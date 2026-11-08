//! The pet's "brain": a thin client for the Gemini `generateContent` REST API using the user's
//! own API key (BYOK), plus storage of that key in the OS credential store.
//!
//! The key only ever travels from the OS credential store to Google, in the `x-goog-api-key`
//! header. It is never logged and never included in error messages.
//!
//! `generateContent` is used (not the newer stateful Interactions API) because it is stateless:
//! Google does not keep a server-side conversation history for us.

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::time::Duration;

pub const API_BASE: &str = "https://generativelanguage.googleapis.com/v1beta";
/// Unverified default taken from Google's current docs; on a 404 we ask the API which models
/// the key can use and pick a Flash model instead (see `pick_model`).
/// Verified with a real key: answers a short prompt in about a second.
pub const DEFAULT_MODEL: &str = "gemini-3.1-flash-lite";
const KEY_SERVICE: &str = "streakboom";
const KEY_USER: &str = "gemini-api-key";
const MAX_OUTPUT_TOKENS: u32 = 512;
const MAX_TURNS: usize = 8;
const MAX_TURN_CHARS: usize = 500;

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "snake_case")]
pub enum Kind {
    InvalidKey,
    RateLimit,
    Network,
    Region,
    Blocked,
    Empty,
    Server,
    Model,
    Storage,
    Unknown,
}

#[derive(Serialize, Debug, Clone)]
pub struct AiError {
    pub kind: Kind,
    pub message: String,
}

impl AiError {
    pub fn new(kind: Kind, message: impl Into<String>) -> Self {
        AiError { kind, message: message.into() }
    }
}

#[derive(Deserialize, Clone, Debug)]
pub struct Turn {
    pub role: String, // "user" | "model"
    pub text: String,
}

// ------------------------------------------------------------------ prompts

pub fn persona(lang: &str, tier: u8, gentle: bool) -> String {
    let language = if lang == "vi" { "Vietnamese" } else { "English" };
    let mut s = String::from(
        "You are a witty, slightly sarcastic, loyal, and tech-savvy digital pet living on the user's desktop. \
         Keep your responses extremely concise (under 2 sentences), playful, and attentive to the user's well-being and productivity.",
    );
    s.push_str(&format!(
        " Reply in {language}. Stay in character as a small desktop pet and never claim to be human. \
         Never ask for or repeat passwords, API keys or other secrets. Do not give medical, legal or financial advice."
    ));
    if gentle {
        s.push_str(" Be warm and kind; no sarcasm.");
    }
    match tier {
        0 | 1 => s.push_str(" You barely know the user yet, so be a little shy."),
        3 | 4 => s.push_str(" You are close friends with the user."),
        _ => {}
    }
    s
}

pub fn hello_prompt(lang: &str) -> String {
    if lang == "vi" {
        "Hãy chào mình bằng một câu ngắn. Mình vừa cho bạn một bộ não.".into()
    } else {
        "Greet me in one short sentence. I just gave you a brain.".into()
    }
}


/// The persona plus what the user told the pet earlier. Background only: the model is told not
/// to recite it or to invent more. Only ever used for chats the user started (never for the
/// pet's unprompted lines, which may be on a shared screen).
pub fn persona_with(lang: &str, tier: u8, gentle: bool, known: &[String]) -> String {
    let mut s = persona(lang, tier, gentle);
    let known: Vec<&String> = known.iter().filter(|k| !k.trim().is_empty()).take(24).collect();
    if !known.is_empty() {
        s.push_str(
            "\nBackground about the user, told by them earlier (mention one only when it fits naturally; \
             never list them, never invent other facts about the user):",
        );
        for k in known {
            s.push_str("\n- ");
            s.extend(k.chars().filter(|c| !c.is_control()).take(80));
        }
    }
    s
}

/// System prompt for the small background call that picks durable facts out of a chat.
pub fn extract_prompt(lang: &str) -> String {
    let language = if lang == "vi" { "Vietnamese" } else { "English" };
    format!(
        "You extract lasting facts that the USER stated about themselves from a short chat with a desktop pet. \
         Output at most 3 lines, one fact per line, each under 60 characters, written in {language}, no numbering, \
         no bullets. Only things the user said about themselves that stay true for weeks (interests, projects, pets, \
         routines, preferences). Skip moods, one-off requests, anything the pet said, other people's private details, \
         health, money, exact addresses, passwords, keys, numbers that identify someone. If there is nothing, output NONE."
    )
}

/// Keeps only lines that look like short, harmless facts. A model can ignore instructions, so the
/// rules are enforced here too: no secrets, links, addresses or long digit runs, at most 3, no
/// duplicates of what is already known.
pub fn parse_facts(raw: &str, known: &[String]) -> Vec<String> {
    let banned = ["password", "mật khẩu", "mat khau", "api key", "apikey", "token", "secret", "http", "www.", "@"];
    let mut out: Vec<String> = Vec::new();
    for line in raw.lines() {
        let t = line.trim().trim_start_matches(|c: char| matches!(c, '-' | '*' | '•' | '·') || c.is_ascii_digit() || c == '.' || c == ')').trim();
        let t: String = t.chars().filter(|c| !c.is_control()).collect();
        let n = t.chars().count();
        if !(4..=60).contains(&n) || t.eq_ignore_ascii_case("none") {
            continue;
        }
        let low = t.to_lowercase();
        if banned.iter().any(|b| low.contains(b)) {
            continue;
        }
        let mut run = 0;
        let mut long_digits = false;
        for c in t.chars() {
            run = if c.is_ascii_digit() { run + 1 } else { 0 };
            if run >= 5 {
                long_digits = true;
            }
        }
        if long_digits {
            continue;
        }
        let dup = known.iter().chain(out.iter()).any(|k| {
            let kl = k.to_lowercase();
            kl == low || kl.contains(&low) || low.contains(&kl)
        });
        if dup {
            continue;
        }
        out.push(t);
        if out.len() == 3 {
            break;
        }
    }
    out
}
// ----------------------------------------------------------- pure helpers

/// Loose sanity check only: Google has changed key formats before, so no prefix is required.
pub fn key_ok(key: &str) -> bool {
    let k = key.trim();
    (20..=200).contains(&k.len()) && k.chars().all(|c| c.is_ascii_graphic())
}

pub fn classify(status: u16, body: &str) -> AiError {
    let lower = body.to_lowercase();
    let msg = format!("HTTP {status}");
    match status {
        429 => AiError::new(Kind::RateLimit, msg),
        404 => AiError::new(Kind::Model, msg),
        500..=599 => AiError::new(Kind::Server, msg),
        400 | 401 | 403 => {
            if lower.contains("location is not supported") || lower.contains("not available in your country") {
                AiError::new(Kind::Region, msg)
            } else if status != 400
                || lower.contains("api_key_invalid")
                || lower.contains("api key not valid")
                || lower.contains("unauthenticated")
            {
                AiError::new(Kind::InvalidKey, msg)
            } else {
                AiError::new(Kind::Unknown, msg)
            }
        }
        _ => AiError::new(Kind::Unknown, msg),
    }
}

pub fn build_body(system: &str, turns: &[Turn]) -> Result<Value, AiError> {
    let start = turns.len().saturating_sub(MAX_TURNS);
    let turns = &turns[start..];
    match turns.last() {
        Some(t) if t.role == "user" => {}
        _ => return Err(AiError::new(Kind::Unknown, "last turn must be from the user")),
    }
    let contents: Vec<Value> = turns
        .iter()
        .map(|t| {
            let role = if t.role == "model" { "model" } else { "user" };
            let text: String = t.text.chars().take(MAX_TURN_CHARS).collect();
            json!({ "role": role, "parts": [{ "text": text }] })
        })
        .collect();
    Ok(json!({
        "systemInstruction": { "parts": [{ "text": system }] },
        "contents": contents,
        "generationConfig": { "maxOutputTokens": MAX_OUTPUT_TOKENS }
    }))
}

pub fn extract_text(v: &Value) -> Result<String, AiError> {
    if v.pointer("/promptFeedback/blockReason").is_some() {
        return Err(AiError::new(Kind::Blocked, "prompt blocked"));
    }
    let cand = v.pointer("/candidates/0");
    if let Some(reason) = cand.and_then(|c| c.get("finishReason")).and_then(|r| r.as_str()) {
        if matches!(reason, "SAFETY" | "PROHIBITED_CONTENT" | "BLOCKLIST" | "SPII" | "RECITATION") {
            return Err(AiError::new(Kind::Blocked, reason));
        }
    }
    let text: String = cand
        .and_then(|c| c.pointer("/content/parts"))
        .and_then(|p| p.as_array())
        .map(|parts| {
            parts
                .iter()
                .filter(|p| p.get("thought").and_then(|t| t.as_bool()) != Some(true))
                .filter_map(|p| p.get("text").and_then(|t| t.as_str()))
                .collect::<Vec<_>>()
                .join("")
        })
        .unwrap_or_default();
    let text = text.trim().to_string();
    if text.is_empty() {
        Err(AiError::new(Kind::Empty, "no text"))
    } else {
        Ok(text)
    }
}

/// Best model from a `models.list` response (the app itself uses `pick_model_except`).
#[cfg(test)]
pub fn pick_model(list: &Value) -> Option<String> {
    pick_model_except(list, "")
}

/// Best plain Flash model other than `skip` (used when `skip` is overloaded).
pub fn pick_model_except(list: &Value, skip: &str) -> Option<String> {
    chat_models(list).into_iter().find(|n| n != skip)
}

/// A model name is spliced into the request path, so only plain name characters are allowed.
pub fn model_ok(name: &str) -> bool {
    (1..=80).contains(&name.len()) && name.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '.' | '_'))
}

/// Every text-capable Flash model in a `models.list` response, best first
/// (lite before full Flash, newest version first within each group).
pub fn chat_models(list: &Value) -> Vec<String> {
    let Some(models) = list.get("models").and_then(|m| m.as_array()) else {
        return Vec::new();
    };
    let mut names: Vec<String> = models
        .iter()
        .filter(|m| {
            m.get("supportedGenerationMethods")
                .and_then(|x| x.as_array())
                .map(|a| a.iter().any(|s| s.as_str() == Some("generateContent")))
                .unwrap_or(false)
        })
        .filter_map(|m| m.get("name").and_then(|n| n.as_str()))
        .map(|n| n.trim_start_matches("models/").to_string())
        .filter(|n| {
            n.starts_with("gemini-")
                && n.contains("flash")
                && !["image", "tts", "live", "audio", "preview", "exp", "robotics", "computer", "omni", "transcribe"]
                    .iter()
                    .any(|bad| n.contains(bad))
        })
        .collect();
    // Lite models first: a pet only says a sentence or two, and in practice the newest full
    // Flash models are the ones that get overloaded (measured: lite answers in ~1s, newest Flash
    // timed out at 25s). Within each group the highest name is the newest version.
    names.sort_by_key(|n| (n.contains("lite"), n.clone()));
    names.reverse();
    names.retain(|n| model_ok(n));
    names.dedup();
    names
}

// ------------------------------------------------------------------- HTTP

fn agent() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(8))
        .timeout(Duration::from_secs(20))
        .build()
}

fn read_json(resp: Result<ureq::Response, ureq::Error>) -> Result<Value, AiError> {
    match resp {
        Ok(r) => {
            let body = r
                .into_string()
                .map_err(|_| AiError::new(Kind::Network, "read failed"))?;
            serde_json::from_str(&body).map_err(|_| AiError::new(Kind::Unknown, "bad json"))
        }
        Err(ureq::Error::Status(code, r)) => {
            let body = r.into_string().unwrap_or_default();
            Err(classify(code, &body))
        }
        // ureq's message names the failing step (dns / connect / tls / timeout) and the host, never the key.
        Err(ureq::Error::Transport(t)) => Err(AiError::new(Kind::Network, format!("transport: {t}"))),
    }
}

pub fn generate(base: &str, key: &str, model: &str, system: &str, turns: &[Turn]) -> Result<String, AiError> {
    let body = build_body(system, turns)?;
    let resp = agent()
        .post(&format!("{base}/models/{model}:generateContent"))
        .set("x-goog-api-key", key)
        .set("Content-Type", "application/json")
        .send_string(&body.to_string());
    extract_text(&read_json(resp)?)
}

pub fn list_models(base: &str, key: &str) -> Result<Value, AiError> {
    let resp = agent()
        .get(&format!("{base}/models?pageSize=200"))
        .set("x-goog-api-key", key)
        .call();
    read_json(resp)
}

// ------------------------------------------------------------ credential store

pub fn store_key(key: &str) -> Result<(), AiError> {
    keyring::Entry::new(KEY_SERVICE, KEY_USER)
        .and_then(|e| e.set_password(key.trim()))
        .map_err(|_| AiError::new(Kind::Storage, "credential store"))
}

pub fn load_key() -> Option<String> {
    keyring::Entry::new(KEY_SERVICE, KEY_USER)
        .and_then(|e| e.get_password())
        .ok()
        .filter(|k| !k.is_empty())
}

pub fn delete_key() -> Result<(), AiError> {
    match keyring::Entry::new(KEY_SERVICE, KEY_USER).and_then(|e| e.delete_credential()) {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(_) => Err(AiError::new(Kind::Storage, "credential store")),
    }
}

// ------------------------------------------------------------------- tests

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};
    use std::net::TcpListener;

    /// One-shot HTTP server: answers a single request and returns the raw request text.
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
                if n == 0 {
                    break;
                }
            }
            let resp = format!(
                "HTTP/1.1 {status}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                body.len()
            );
            s.write_all(resp.as_bytes()).unwrap();
            String::from_utf8_lossy(&buf).to_string()
        });
        (base, h)
    }

    fn user(t: &str) -> Vec<Turn> {
        vec![Turn { role: "user".into(), text: t.into() }]
    }

    #[test]
    fn generate_ok_sends_key_in_header_and_system_prompt() {
        let (base, h) = serve_once(
            "200 OK",
            r#"{"candidates":[{"content":{"parts":[{"text":"Hello "},{"text":"there."}]},"finishReason":"STOP"}]}"#,
        );
        let out = generate(&base, "SECRET-KEY-1234567890", "m1", "SYS", &user("hi")).unwrap();
        assert_eq!(out, "Hello there.");
        let req = h.join().unwrap();
        let lower = req.to_lowercase();
        assert!(req.starts_with("POST /models/m1:generateContent"));
        assert!(lower.contains("x-goog-api-key: secret-key-1234567890"));
        assert!(!req.lines().next().unwrap().contains("SECRET"), "key must not be in the URL");
        assert!(req.contains("\"systemInstruction\"") && req.contains("SYS"));
        assert!(req.contains("\"maxOutputTokens\":512"));
    }

    #[test]
    fn http_errors_map_to_pet_friendly_kinds() {
        let cases = [
            ("429 Too Many Requests", r#"{"error":{"status":"RESOURCE_EXHAUSTED"}}"#, Kind::RateLimit),
            ("400 Bad Request", r#"{"error":{"message":"API key not valid. Please pass a valid API key.","details":[{"reason":"API_KEY_INVALID"}]}}"#, Kind::InvalidKey),
            ("403 Forbidden", r#"{"error":{"status":"PERMISSION_DENIED"}}"#, Kind::InvalidKey),
            ("400 Bad Request", r#"{"error":{"message":"User location is not supported for the API use.","status":"FAILED_PRECONDITION"}}"#, Kind::Region),
            ("404 Not Found", r#"{"error":{"status":"NOT_FOUND"}}"#, Kind::Model),
            ("503 Service Unavailable", "{}", Kind::Server),
        ];
        for (status, body, kind) in cases {
            let (base, h) = serve_once(status, body);
            let err = generate(&base, "KEYKEYKEYKEYKEYKEYKEY", "m", "s", &user("hi")).unwrap_err();
            h.join().unwrap();
            assert_eq!(err.kind, kind, "{status}");
            assert!(!err.message.contains("KEYKEY"));
        }
    }

    #[test]
    fn empty_and_blocked_responses() {
        let (base, h) = serve_once("200 OK", r#"{"candidates":[{"finishReason":"MAX_TOKENS"}]}"#);
        assert_eq!(generate(&base, "K", "m", "s", &user("hi")).unwrap_err().kind, Kind::Empty);
        h.join().unwrap();
        let (base, h) = serve_once("200 OK", r#"{"promptFeedback":{"blockReason":"SAFETY"}}"#);
        assert_eq!(generate(&base, "K", "m", "s", &user("hi")).unwrap_err().kind, Kind::Blocked);
        h.join().unwrap();
    }

    #[test]
    fn thought_parts_are_skipped() {
        let v: Value = serde_json::from_str(
            r#"{"candidates":[{"content":{"parts":[{"text":"thinking...","thought":true},{"text":"Hi!"}]}}]}"#,
        )
        .unwrap();
        assert_eq!(extract_text(&v).unwrap(), "Hi!");
    }

    #[test]
    fn closed_port_is_a_network_error() {
        let port = {
            let l = TcpListener::bind("127.0.0.1:0").unwrap();
            l.local_addr().unwrap().port()
        };
        let err = generate(&format!("http://127.0.0.1:{port}"), "K", "m", "s", &user("hi")).unwrap_err();
        assert_eq!(err.kind, Kind::Network);
    }

    #[test]
    fn body_keeps_recent_turns_and_requires_a_final_user_turn() {
        let turns: Vec<Turn> = (0..20)
            .map(|i| Turn { role: if i % 2 == 0 { "user" } else { "model" }.into(), text: "x".repeat(900) })
            .collect();
        assert!(build_body("s", &turns).is_err()); // ends with a model turn
        let mut t = turns.clone();
        t.push(Turn { role: "user".into(), text: "last".into() });
        let b = build_body("s", &t).unwrap();
        let contents = b["contents"].as_array().unwrap();
        assert_eq!(contents.len(), MAX_TURNS);
        assert_eq!(contents[0]["parts"][0]["text"].as_str().unwrap().chars().count(), MAX_TURN_CHARS);
        assert!(build_body("s", &[]).is_err());
    }

    #[test]
    fn model_picking_prefers_newest_plain_flash_with_generate_support() {
        let list: Value = serde_json::from_str(
            r#"{"models":[
              {"name":"models/gemini-3.5-flash","supportedGenerationMethods":["generateContent"]},
              {"name":"models/gemini-3.8-flash","supportedGenerationMethods":["generateContent","countTokens"]},
              {"name":"models/gemini-3.9-flash-lite","supportedGenerationMethods":["generateContent"]},
              {"name":"models/gemini-3.9-flash-image","supportedGenerationMethods":["generateContent"]},
              {"name":"models/gemini-4.0-flash","supportedGenerationMethods":["embedContent"]},
              {"name":"models/gemini-3.9-pro","supportedGenerationMethods":["generateContent"]}
            ]}"#,
        )
        .unwrap();
        // lite first (fast, rarely overloaded), image/pro/embedding-only models never
        assert_eq!(pick_model(&list).as_deref(), Some("gemini-3.9-flash-lite"));
        assert_eq!(pick_model(&serde_json::json!({})), None);
        // when that one fails, fall back to the newest full Flash, then older ones
        assert_eq!(pick_model_except(&list, "gemini-3.9-flash-lite").as_deref(), Some("gemini-3.8-flash"));
        assert_eq!(pick_model_except(&list, "gemini-3.8-flash").as_deref(), Some("gemini-3.9-flash-lite"));
        assert_eq!(chat_models(&list), ["gemini-3.9-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash"]);
        assert!(model_ok("gemini-3.1-flash-lite") && !model_ok("a/b") && !model_ok("") && !model_ok("x?key=1"));
    }


    #[test]
    fn known_facts_reach_the_persona_and_are_bounded() {
        let none = persona_with("en", 2, false, &[]);
        assert_eq!(none, persona("en", 2, false));
        let p = persona_with("en", 2, false, &["has a cat named Mun".into(), "  ".into(), "x\ny".into()]);
        assert!(p.contains("- has a cat named Mun"));
        assert!(!p.contains("- \n"));
        let many: Vec<String> = (0..40).map(|i| format!("fact number {i}")).collect();
        assert_eq!(persona_with("en", 2, false, &many).matches("\n- ").count(), 24);
    }

    #[test]
    fn extracted_facts_are_filtered() {
        let known = vec!["likes jazz".to_string()];
        let raw = "- Is studying for finals\n2. likes jazz a lot\nNONE\nmy password is hunter2\nphone 0912345678 is mine\nsee https://x.io\n* Has a cat named Mun\n* Works on a game\n* Plays chess\nab";
        let out = parse_facts(raw, &known);
        assert_eq!(out, vec!["Is studying for finals", "Has a cat named Mun", "Works on a game"]);
        assert!(parse_facts("NONE", &[]).is_empty());
        assert!(parse_facts(&"x".repeat(200), &[]).is_empty());
    }
    #[test]
    fn key_sanity_and_persona() {
        assert!(key_ok("  AIzaSyExampleExampleExample1234567  "));
        assert!(!key_ok("short"));
        assert!(!key_ok("has space inside the key value 123"));
        assert!(!key_ok(&"a".repeat(300)));
        assert!(persona("vi", 3, true).contains("Vietnamese"));
        assert!(persona("en", 1, true).contains("no sarcasm"));
        assert!(persona("en", 1, false).contains("under 2 sentences"));
    }
}
