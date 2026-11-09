//! Groq as a brain: the fourth one, placed right after Gemini (ADR-0034). Groq's API is OpenAI-compatible (the same chat
//! completions request and response), so this is a thin layer over `openai.rs`: its own address, default model, error
//! reading, a rule for reasoning models and the choice of chat models.
//!
//! The key only travels from the OS credential store to Groq, in the `Authorization` header. It is never logged and
//! never part of an error message. Requests are stateless: the app sends the recent turns each time.

use crate::brain::{AiError, Kind, Turn, agent, read_json_with};
use serde_json::Value;

pub const API_BASE: &str = "https://api.groq.com/openai/v1";
/// Named on Groq's models page as a production model (2026-11-09). If a key cannot use it the API is asked which models
/// it offers and the first chat model of `chat_models` is used instead. Not tried with a real key yet (verification debt).
pub const DEFAULT_MODEL: &str = "llama-3.3-70b-versatile";

/// How Groq's errors read: 401 a bad key; 403 a key or organisation that may not use the API; 429 slow down or the day's
/// free allowance is used up (Groq answers both with 429 and a `retry-after` header); 400 or 404 for a model that is
/// gone or unknown.
pub fn classify(status: u16, body: &str) -> AiError {
    let lower = body.to_lowercase();
    let msg = format!("HTTP {status}");
    match status {
        401 => AiError::new(Kind::InvalidKey, msg),
        403 => AiError::new(Kind::InvalidKey, msg),
        429 => AiError::new(Kind::RateLimit, msg),
        404 => AiError::new(Kind::Model, msg),
        400 | 422 => {
            if lower.contains("model_not_found") || lower.contains("model_decommissioned") || lower.contains("does not exist") || lower.contains("decommissioned") {
                AiError::new(Kind::Model, msg)
            } else {
                AiError::new(Kind::Unknown, msg)
            }
        }
        500..=599 => AiError::new(Kind::Server, msg),
        _ => AiError::new(Kind::Unknown, msg),
    }
}

/// The OpenAI-style body, plus a low reasoning effort for the `gpt-oss` models: they think before they answer, and with a
/// small output limit the thinking could use up the whole answer.
pub fn build_body(model: &str, system: &str, turns: &[Turn]) -> Result<Value, AiError> {
    let mut body = crate::openai::build_body(model, system, turns)?;
    if model.contains("gpt-oss") {
        body["reasoning_effort"] = Value::from("low");
    }
    Ok(body)
}

pub fn generate(base: &str, key: &str, model: &str, system: &str, turns: &[Turn]) -> Result<String, AiError> {
    let body = build_body(model, system, turns)?;
    let resp = agent()
        .post(&format!("{base}/chat/completions"))
        .set("Authorization", &format!("Bearer {key}"))
        .set("Content-Type", "application/json")
        .send_string(&body.to_string());
    crate::openai::extract_text(&read_json_with(resp, classify)?)
}

pub fn list_models(base: &str, key: &str) -> Result<Value, AiError> {
    let resp = agent().get(&format!("{base}/models")).set("Authorization", &format!("Bearer {key}")).call();
    read_json_with(resp, classify)
}

/// Chat models for a pet, best first. Models for speech, text-to-speech, prompt or content safety, embeddings and the
/// multi-tool "compound" systems are left out. The order: the default model, then the small fast Llama, then the open
/// GPT models (the 20 billion one first), then anything else by name.
pub fn chat_models(list: &Value) -> Vec<String> {
    let Some(data) = list.get("data").and_then(|d| d.as_array()) else {
        return Vec::new();
    };
    const BAD: [&str; 10] = ["whisper", "tts", "orpheus", "playai", "guard", "safeguard", "embed", "compound", "distil", "moderation"];
    let mut names: Vec<String> = data
        .iter()
        .filter_map(|m| m.get("id").and_then(|n| n.as_str()))
        .filter(|n| !BAD.iter().any(|b| n.contains(b)) && crate::brain::model_ok_for(crate::brain::Provider::Groq, n))
        .map(|n| n.to_string())
        .collect();
    let rank = |n: &str| {
        if n == DEFAULT_MODEL {
            0
        } else if n.contains("llama-3.1-8b") {
            1
        } else if n.contains("gpt-oss-20b") {
            2
        } else if n.contains("gpt-oss-120b") {
            3
        } else {
            4
        }
    };
    names.sort_by(|a, b| rank(a).cmp(&rank(b)).then_with(|| a.cmp(b)));
    names.dedup();
    names
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
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
    fn errors_read_the_way_groq_sends_them() {
        assert_eq!(classify(401, "{}").kind, Kind::InvalidKey);
        assert_eq!(classify(403, "{}").kind, Kind::InvalidKey);
        assert_eq!(classify(429, r#"{"error":{"code":"rate_limit_exceeded"}}"#).kind, Kind::RateLimit);
        assert_eq!(classify(404, "{}").kind, Kind::Model);
        assert_eq!(classify(400, r#"{"error":{"code":"model_decommissioned"}}"#).kind, Kind::Model);
        assert_eq!(classify(400, r#"{"error":{"message":"The model `x` does not exist"}}"#).kind, Kind::Model);
        assert_eq!(classify(400, r#"{"error":{"message":"bad parameter"}}"#).kind, Kind::Unknown);
        assert_eq!(classify(503, "x").kind, Kind::Server);
    }

    #[test]
    fn reasoning_models_get_a_low_effort_and_the_others_do_not() {
        let t = [turn("user", "hi")];
        assert_eq!(build_body("openai/gpt-oss-20b", "s", &t).unwrap()["reasoning_effort"], "low");
        assert!(build_body("llama-3.3-70b-versatile", "s", &t).unwrap().get("reasoning_effort").is_none());
        assert!(build_body("m", "s", &[turn("model", "x")]).is_err());
    }

    #[test]
    fn chat_models_skip_speech_safety_and_embeddings_and_keep_the_default_first() {
        let list = json!({ "data": [
            { "id": "whisper-large-v3" }, { "id": "openai/gpt-oss-120b" }, { "id": "llama-3.1-8b-instant" },
            { "id": "canopylabs/orpheus-v1-english" }, { "id": "llama-3.3-70b-versatile" }, { "id": "meta-llama/llama-prompt-guard-2-22m" },
            { "id": "openai/gpt-oss-20b" }, { "id": "openai/gpt-oss-safeguard-20b" }, { "id": "groq/compound" }, { "id": "qwen/qwen3.8-27b" }
        ] });
        assert_eq!(
            chat_models(&list),
            vec!["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"]
        );
        assert!(chat_models(&json!({})).is_empty());
    }

    #[test]
    fn a_request_goes_to_groq_with_the_key_in_the_header_only() {
        let (base, h) = serve_once("200 OK", r#"{"choices":[{"message":{"content":"Mrrp"}}]}"#);
        let out = generate(&base, "gsk_test_key_123456", "llama-3.3-70b-versatile", "sys", &[turn("user", "hi")]).unwrap();
        assert_eq!(out, "Mrrp");
        let raw = h.join().unwrap();
        let lower = raw.to_lowercase();
        assert!(lower.contains("authorization: bearer gsk_test_key_123456"));
        assert!(lower.contains("post /chat/completions"));
        let body = raw.split("\r\n\r\n").nth(1).unwrap_or("");
        assert!(!body.contains("gsk_test_key_123456"));
    }

    #[test]
    fn an_error_response_is_classified() {
        let (base, h) = serve_once("401 Unauthorized", r#"{"error":{"code":"invalid_api_key"}}"#);
        let e = generate(&base, "bad", "m", "s", &[turn("user", "hi")]).unwrap_err();
        h.join().unwrap();
        assert_eq!(e.kind, Kind::InvalidKey);
    }

    #[test]
    fn the_default_model_and_address_are_what_the_docs_name() {
        assert_eq!(API_BASE, "https://api.groq.com/openai/v1");
        assert_eq!(DEFAULT_MODEL, "llama-3.3-70b-versatile");
    }
}
