//! OpenAI as a brain: a thin client for the Chat Completions API with the user's own API key.
//!
//! The key only travels from the OS credential store to OpenAI, in the `Authorization` header. It
//! is never logged and never part of an error message. Requests are stateless: the app sends the
//! recent turns each time.

use crate::brain::{AiError, Kind, Turn, agent, read_json_with};
use serde_json::{Value, json};

pub const API_BASE: &str = "https://api.openai.com/v1";
/// A small, cheap, non-reasoning model is plenty for a sentence or two. If this name does not
/// exist for a key, the API is asked which models it offers (see `chat_models`).
pub const DEFAULT_MODEL: &str = "gpt-4.1-mini";
const MAX_OUTPUT_TOKENS: u32 = 600;
const MAX_TURNS: usize = 8;
const MAX_TURN_CHARS: usize = 500;

pub fn classify(status: u16, body: &str) -> AiError {
    let lower = body.to_lowercase();
    let msg = format!("HTTP {status}");
    match status {
        // 429 is both "slow down" and "no quota left"; the second is a billing problem
        429 => {
            if lower.contains("insufficient_quota") || lower.contains("exceeded your current quota") {
                AiError::new(Kind::Billing, msg)
            } else {
                AiError::new(Kind::RateLimit, msg)
            }
        }
        404 => AiError::new(Kind::Model, msg),
        500..=599 => AiError::new(Kind::Server, msg),
        401 => AiError::new(Kind::InvalidKey, msg),
        403 => {
            if lower.contains("unsupported_country") || lower.contains("country, region, or territory") {
                AiError::new(Kind::Region, msg)
            } else {
                AiError::new(Kind::InvalidKey, msg)
            }
        }
        400 => {
            if lower.contains("model_not_found") || (lower.contains("model") && lower.contains("does not exist")) {
                AiError::new(Kind::Model, msg)
            } else if lower.contains("billing") || lower.contains("insufficient_quota") {
                AiError::new(Kind::Billing, msg)
            } else {
                AiError::new(Kind::Unknown, msg)
            }
        }
        402 => AiError::new(Kind::Billing, msg),
        _ => AiError::new(Kind::Unknown, msg),
    }
}

/// The system prompt first, then the recent turns as "user" / "assistant".
pub fn build_body(model: &str, system: &str, turns: &[Turn]) -> Result<Value, AiError> {
    let start = turns.len().saturating_sub(MAX_TURNS);
    let turns = &turns[start..];
    match turns.last() {
        Some(t) if t.role == "user" => {}
        _ => return Err(AiError::new(Kind::Unknown, "last turn must be from the user")),
    }
    let mut messages = vec![json!({ "role": "system", "content": system })];
    for t in turns {
        let role = if t.role == "model" { "assistant" } else { "user" };
        let text: String = t.text.chars().take(MAX_TURN_CHARS).collect();
        messages.push(json!({ "role": role, "content": text }));
    }
    Ok(json!({
        "model": model,
        "messages": messages,
        // current models take max_completion_tokens (the older max_tokens is rejected by some)
        "max_completion_tokens": MAX_OUTPUT_TOKENS,
    }))
}

pub fn extract_text(v: &Value) -> Result<String, AiError> {
    let choice = v.pointer("/choices/0");
    if choice.and_then(|c| c.pointer("/message/refusal")).is_some_and(|r| !r.is_null()) {
        return Err(AiError::new(Kind::Blocked, "refusal"));
    }
    if choice.and_then(|c| c.get("finish_reason")).and_then(|r| r.as_str()) == Some("content_filter") {
        return Err(AiError::new(Kind::Blocked, "content_filter"));
    }
    let text = choice
        .and_then(|c| c.pointer("/message/content"))
        .and_then(|t| t.as_str())
        .unwrap_or("")
        .trim()
        .to_string();
    if text.is_empty() { Err(AiError::new(Kind::Empty, "no text")) } else { Ok(text) }
}

pub fn generate(base: &str, key: &str, model: &str, system: &str, turns: &[Turn]) -> Result<String, AiError> {
    let body = build_body(model, system, turns)?;
    let resp = agent()
        .post(&format!("{base}/chat/completions"))
        .set("Authorization", &format!("Bearer {key}"))
        .set("Content-Type", "application/json")
        .send_string(&body.to_string());
    extract_text(&read_json_with(resp, classify)?)
}

pub fn list_models(base: &str, key: &str) -> Result<Value, AiError> {
    let resp = agent().get(&format!("{base}/models")).set("Authorization", &format!("Bearer {key}")).call();
    read_json_with(resp, classify)
}

/// Chat models for a pet, best first: small ("mini", then "nano") before full-size ones, newest
/// first within a group. Models for audio, images, speech, search, embeddings, moderation and
/// code agents are left out.
pub fn chat_models(list: &Value) -> Vec<String> {
    let Some(data) = list.get("data").and_then(|d| d.as_array()) else {
        return Vec::new();
    };
    const BAD: [&str; 14] = [
        "audio", "realtime", "transcribe", "tts", "image", "search", "embedding", "moderation", "codex", "instruct", "whisper", "dall", "davinci", "babbage",
    ];
    let mut names: Vec<String> = data
        .iter()
        .filter_map(|m| m.get("id").and_then(|n| n.as_str()))
        .filter(|n| n.starts_with("gpt-") && !BAD.iter().any(|b| n.contains(b)) && crate::brain::model_ok(n))
        .map(|n| n.to_string())
        .collect();
    let rank = |n: &str| if n.contains("mini") { 0 } else if n.contains("nano") { 1 } else { 2 };
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
    fn body_starts_with_the_system_message() {
        let b = build_body("m", "sys", &[turn("user", "hi"), turn("model", "hello"), turn("user", "again")]).unwrap();
        let msgs = b["messages"].as_array().unwrap();
        assert_eq!(msgs[0]["role"], "system");
        assert_eq!(msgs[0]["content"], "sys");
        assert_eq!(msgs[2]["role"], "assistant");
        assert_eq!(msgs.len(), 4);
        assert!(b.get("max_completion_tokens").is_some() && b.get("max_tokens").is_none());
        assert!(build_body("m", "s", &[turn("model", "x")]).is_err());
    }

    #[test]
    fn text_refusals_filters_and_empty_answers() {
        assert_eq!(extract_text(&json!({ "choices": [{ "message": { "content": " Hi " } }] })).unwrap(), "Hi");
        assert_eq!(extract_text(&json!({ "choices": [{ "message": { "content": "" }, "finish_reason": "length" }] })).unwrap_err().kind, Kind::Empty);
        assert_eq!(extract_text(&json!({ "choices": [{ "message": { "content": null, "refusal": "no" } }] })).unwrap_err().kind, Kind::Blocked);
        assert_eq!(extract_text(&json!({ "choices": [{ "message": { "content": "x" }, "finish_reason": "content_filter" }] })).unwrap_err().kind, Kind::Blocked);
        assert_eq!(extract_text(&json!({})).unwrap_err().kind, Kind::Empty);
    }

    #[test]
    fn http_errors_map_to_pet_friendly_kinds() {
        assert_eq!(classify(401, "{}").kind, Kind::InvalidKey);
        assert_eq!(classify(429, r#"{"error":{"code":"rate_limit_exceeded"}}"#).kind, Kind::RateLimit);
        assert_eq!(classify(429, r#"{"error":{"code":"insufficient_quota","message":"You exceeded your current quota"}}"#).kind, Kind::Billing);
        assert_eq!(classify(404, "{}").kind, Kind::Model);
        assert_eq!(classify(400, r#"{"error":{"code":"model_not_found"}}"#).kind, Kind::Model);
        assert_eq!(classify(503, "x").kind, Kind::Server);
        assert_eq!(classify(403, r#"{"error":{"code":"unsupported_country_region_territory"}}"#).kind, Kind::Region);
        assert_eq!(classify(400, r#"{"error":{"message":"bad parameter"}}"#).kind, Kind::Unknown);
    }

    #[test]
    fn models_prefer_small_chat_models_and_skip_the_rest() {
        let list = json!({ "data": [
            { "id": "gpt-5" }, { "id": "gpt-4.1-mini" }, { "id": "gpt-5-mini" }, { "id": "gpt-4o-mini-tts" },
            { "id": "gpt-4o-audio-preview" }, { "id": "text-embedding-3-small" }, { "id": "gpt-5-nano" }, { "id": "gpt-4.1" },
            { "id": "gpt-image-1" }, { "id": "gpt-5-codex" }
        ] });
        assert_eq!(chat_models(&list), vec!["gpt-5-mini", "gpt-4.1-mini", "gpt-5-nano", "gpt-5", "gpt-4.1"]);
    }

    #[test]
    fn a_request_carries_the_key_in_the_header_only() {
        let (base, h) = serve_once("200 OK", r#"{"choices":[{"message":{"content":"Mrrp"}}]}"#);
        let out = generate(&base, "sk-test-key-123456", "gpt-4.1-mini", "sys", &[turn("user", "hi")]).unwrap();
        assert_eq!(out, "Mrrp");
        let raw = h.join().unwrap();
        let lower = raw.to_lowercase();
        assert!(lower.contains("authorization: bearer sk-test-key-123456"));
        assert!(lower.contains("post /chat/completions"));
        let body = raw.split("\r\n\r\n").nth(1).unwrap_or("");
        assert!(!body.contains("sk-test-key-123456"));
    }

    #[test]
    fn an_error_response_is_classified() {
        let (base, h) = serve_once("401 Unauthorized", r#"{"error":{"code":"invalid_api_key"}}"#);
        let e = generate(&base, "bad", "m", "s", &[turn("user", "hi")]).unwrap_err();
        h.join().unwrap();
        assert_eq!(e.kind, Kind::InvalidKey);
    }
}
