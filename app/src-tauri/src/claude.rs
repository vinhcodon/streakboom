//! Claude (Anthropic) as a brain: a thin client for the Messages API with the user's own API key.
//!
//! The key only travels from the OS credential store to Anthropic, in the `x-api-key` header. It
//! is never logged and never part of an error message. The request is stateless: the app sends
//! the recent turns each time, nothing is kept on Anthropic's side by us.

use crate::brain::{AiError, Kind, Turn, agent, read_json_with};
use serde_json::{Value, json};

pub const API_BASE: &str = "https://api.anthropic.com/v1";
const VERSION: &str = "2023-06-01";
/// A small, fast model is plenty for a pet that says a sentence or two. If this name does not
/// exist for a key, the API is asked which models it offers (see `chat_models`).
pub const DEFAULT_MODEL: &str = "claude-haiku-5-5";
const MAX_OUTPUT_TOKENS: u32 = 512;
const MAX_TURNS: usize = 8;
const MAX_TURN_CHARS: usize = 500;

pub fn classify(status: u16, body: &str) -> AiError {
    let lower = body.to_lowercase();
    let msg = format!("HTTP {status}");
    match status {
        429 => AiError::new(Kind::RateLimit, msg),
        404 => AiError::new(Kind::Model, msg),
        // 529 is Anthropic's "overloaded"
        500..=599 => AiError::new(Kind::Server, msg),
        401 => AiError::new(Kind::InvalidKey, msg),
        403 => {
            if lower.contains("not available") && lower.contains("country") || lower.contains("region") {
                AiError::new(Kind::Region, msg)
            } else {
                AiError::new(Kind::InvalidKey, msg)
            }
        }
        400 | 402 => {
            if lower.contains("credit balance") || lower.contains("billing") || lower.contains("payment") {
                AiError::new(Kind::Billing, msg)
            } else if lower.contains("model") && (lower.contains("not found") || lower.contains("invalid")) {
                AiError::new(Kind::Model, msg)
            } else if lower.contains("x-api-key") || lower.contains("authentication") {
                AiError::new(Kind::InvalidKey, msg)
            } else {
                AiError::new(Kind::Unknown, msg)
            }
        }
        _ => AiError::new(Kind::Unknown, msg),
    }
}

/// The Messages API wants roles "user" and "assistant", starting with "user". Consecutive turns
/// of one role are joined.
pub fn build_body(model: &str, system: &str, turns: &[Turn]) -> Result<Value, AiError> {
    let start = turns.len().saturating_sub(MAX_TURNS);
    let turns = &turns[start..];
    match turns.last() {
        Some(t) if t.role == "user" => {}
        _ => return Err(AiError::new(Kind::Unknown, "last turn must be from the user")),
    }
    let mut messages: Vec<(String, String)> = Vec::new();
    for t in turns {
        let role = if t.role == "model" { "assistant" } else { "user" };
        let text: String = t.text.chars().take(MAX_TURN_CHARS).collect();
        match messages.last_mut() {
            Some((r, c)) if r == role => {
                c.push('\n');
                c.push_str(&text);
            }
            _ => messages.push((role.to_string(), text)),
        }
    }
    // the first message must be from the user
    while messages.first().is_some_and(|(r, _)| r != "user") {
        messages.remove(0);
    }
    let messages: Vec<Value> = messages.into_iter().map(|(r, c)| json!({ "role": r, "content": c })).collect();
    Ok(json!({
        "model": model,
        "max_tokens": MAX_OUTPUT_TOKENS,
        "system": system,
        "messages": messages,
    }))
}

pub fn extract_text(v: &Value) -> Result<String, AiError> {
    if v.get("stop_reason").and_then(|r| r.as_str()) == Some("refusal") {
        return Err(AiError::new(Kind::Blocked, "refusal"));
    }
    let text: String = v
        .get("content")
        .and_then(|c| c.as_array())
        .map(|parts| {
            parts
                .iter()
                .filter(|p| p.get("type").and_then(|t| t.as_str()) == Some("text"))
                .filter_map(|p| p.get("text").and_then(|t| t.as_str()))
                .collect::<Vec<_>>()
                .join("")
        })
        .unwrap_or_default();
    let text = text.trim().to_string();
    if text.is_empty() { Err(AiError::new(Kind::Empty, "no text")) } else { Ok(text) }
}

pub fn generate(base: &str, key: &str, model: &str, system: &str, turns: &[Turn]) -> Result<String, AiError> {
    let body = build_body(model, system, turns)?;
    let resp = agent()
        .post(&format!("{base}/messages"))
        .set("x-api-key", key)
        .set("anthropic-version", VERSION)
        .set("content-type", "application/json")
        .send_string(&body.to_string());
    extract_text(&read_json_with(resp, classify)?)
}

pub fn list_models(base: &str, key: &str) -> Result<Value, AiError> {
    let resp = agent()
        .get(&format!("{base}/models?limit=100"))
        .set("x-api-key", key)
        .set("anthropic-version", VERSION)
        .call();
    read_json_with(resp, classify)
}

/// Claude models the key can use, best first for a pet: Haiku (small and fast) before Sonnet,
/// then the rest (Opus last: the most expensive for a sentence or two); within a group the
/// highest id is the newest.
pub fn chat_models(list: &Value) -> Vec<String> {
    let Some(data) = list.get("data").and_then(|d| d.as_array()) else {
        return Vec::new();
    };
    let mut names: Vec<String> = data
        .iter()
        .filter_map(|m| m.get("id").and_then(|n| n.as_str()))
        .filter(|n| n.starts_with("claude-") && crate::brain::model_ok(n))
        .map(|n| n.to_string())
        .collect();
    let rank = |n: &str| if n.contains("haiku") { 0 } else if n.contains("sonnet") { 1 } else if n.contains("opus") { 3 } else { 2 };
    names.sort_by(|a, b| rank(a).cmp(&rank(b)).then_with(|| b.cmp(a)));
    names.dedup();
    names
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};
    use std::net::TcpListener;

    fn serve_once(status: &str, body: &str) -> (String, std::thread::JoinHandle<String>) {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        let (status, body) = (status.to_string(), body.to_string());
        let h = std::thread::spawn(move || {
            let (mut s, _) = listener.accept().unwrap();
            let mut buf = Vec::new();
            let mut tmp = [0u8; 4096];
            loop {
                let n = s.read(&mut tmp).unwrap();
                buf.extend_from_slice(&tmp[..n]);
                let text = String::from_utf8_lossy(&buf).to_string();
                if let Some(i) = text.find("\r\n\r\n") {
                    let len = text
                        .lines()
                        .find_map(|l| l.to_lowercase().strip_prefix("content-length:").map(|v| v.trim().parse::<usize>().unwrap_or(0)))
                        .unwrap_or(0);
                    if buf.len() >= i + 4 + len {
                        break;
                    }
                }
            }
            let resp = format!("HTTP/1.1 {status}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len());
            s.write_all(resp.as_bytes()).unwrap();
            String::from_utf8_lossy(&buf).to_string()
        });
        (base, h)
    }

    fn turn(role: &str, text: &str) -> Turn {
        Turn { role: role.into(), text: text.into() }
    }

    #[test]
    fn body_has_the_messages_shape_and_starts_with_the_user() {
        let b = build_body("m", "sys", &[turn("model", "stray"), turn("user", "hi"), turn("model", "hello"), turn("user", "a"), turn("user", "b")]).unwrap();
        assert_eq!(b["system"], "sys");
        assert_eq!(b["model"], "m");
        let msgs = b["messages"].as_array().unwrap();
        assert_eq!(msgs[0]["role"], "user");
        assert_eq!(msgs[0]["content"], "hi");
        assert_eq!(msgs[1]["role"], "assistant");
        assert_eq!(msgs[2]["content"], "a\nb"); // consecutive user turns are joined
        assert!(build_body("m", "s", &[turn("model", "x")]).is_err());
    }

    #[test]
    fn text_blocks_are_joined_and_refusals_are_blocked() {
        let ok = json!({ "content": [{ "type": "text", "text": " Hi " }, { "type": "thinking", "thinking": "x" }, { "type": "text", "text": "there" }] });
        assert_eq!(extract_text(&ok).unwrap(), "Hi there");
        assert_eq!(extract_text(&json!({ "content": [] })).unwrap_err().kind, Kind::Empty);
        assert_eq!(extract_text(&json!({ "stop_reason": "refusal", "content": [] })).unwrap_err().kind, Kind::Blocked);
    }

    #[test]
    fn http_errors_map_to_pet_friendly_kinds() {
        assert_eq!(classify(401, "{}").kind, Kind::InvalidKey);
        assert_eq!(classify(429, "{}").kind, Kind::RateLimit);
        assert_eq!(classify(529, "overloaded").kind, Kind::Server);
        assert_eq!(classify(404, "{}").kind, Kind::Model);
        assert_eq!(classify(400, r#"{"error":{"message":"Your credit balance is too low to access the Anthropic API"}}"#).kind, Kind::Billing);
        assert_eq!(classify(403, r#"{"error":{"message":"Request not allowed"}}"#).kind, Kind::InvalidKey);
        assert_eq!(classify(400, r#"{"error":{"message":"max_tokens must be positive"}}"#).kind, Kind::Unknown);
    }

    #[test]
    fn models_are_ordered_haiku_then_sonnet_then_the_rest() {
        let list = json!({ "data": [
            { "id": "claude-opus-5-5" }, { "id": "claude-sonnet-5-5" }, { "id": "claude-haiku-4-5-20251001" },
            { "id": "claude-haiku-5-5" }, { "id": "not-claude" }, { "id": "claude-bad name" }
        ] });
        assert_eq!(chat_models(&list), vec!["claude-haiku-5-5", "claude-haiku-4-5-20251001", "claude-sonnet-5-5", "claude-opus-5-5"]);
    }

    #[test]
    fn a_request_carries_the_key_in_the_header_only() {
        let (base, h) = serve_once("200 OK", r#"{"content":[{"type":"text","text":"Mrrp"}]}"#);
        let out = generate(&base, "sk-ant-test-key", "claude-haiku-5-5", "sys", &[turn("user", "hi")]).unwrap();
        assert_eq!(out, "Mrrp");
        let raw = h.join().unwrap();
        let lower = raw.to_lowercase();
        assert!(lower.contains("x-api-key: sk-ant-test-key"));
        assert!(lower.contains("anthropic-version: 2023-06-01"));
        assert!(lower.contains("post /messages"));
        let body = raw.split("\r\n\r\n").nth(1).unwrap_or("");
        assert!(!body.contains("sk-ant-test-key"));
    }

    #[test]
    fn an_error_response_is_classified() {
        let (base, h) = serve_once("401 Unauthorized", r#"{"error":{"type":"authentication_error"}}"#);
        let e = generate(&base, "bad", "m", "s", &[turn("user", "hi")]).unwrap_err();
        h.join().unwrap();
        assert_eq!(e.kind, Kind::InvalidKey);
    }
}
