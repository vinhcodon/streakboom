//! The pet's "brain": thin clients for the Gemini `generateContent` API and (in `claude.rs`) the
//! Claude Messages API, using the user's own API key (BYOK), plus storage of each key in the OS
//! credential store. One provider is active at a time (`Provider`).
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
const KEY_USER_GEMINI: &str = "gemini-api-key";
const KEY_USER_GROQ: &str = "groq-api-key";
const KEY_USER_CLAUDE: &str = "claude-api-key";
const KEY_USER_OPENAI: &str = "openai-api-key";
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
    /// The account has no credit or the plan does not allow the request (paid providers).
    Billing,
    Unknown,
}

/// Who answers. The user brings a key for one or more of them and picks one to use.
#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Debug, Default, Hash)]
#[serde(rename_all = "lowercase")]
pub enum Provider {
    #[default]
    Gemini,
    Groq,
    Claude,
    OpenAI,
}

impl Provider {
    /// In the order they are offered, and the order a brain is picked when the one in use is forgotten (ADR-0037).
    pub const ALL: [Provider; 4] = [Provider::Gemini, Provider::Groq, Provider::Claude, Provider::OpenAI];
    pub fn parse(s: &str) -> Option<Provider> {
        match s {
            "gemini" => Some(Provider::Gemini),
            "groq" => Some(Provider::Groq),
            "claude" => Some(Provider::Claude),
            "openai" => Some(Provider::OpenAI),
            _ => None,
        }
    }
    pub fn id(self) -> &'static str {
        match self {
            Provider::Gemini => "gemini",
            Provider::Groq => "groq",
            Provider::Claude => "claude",
            Provider::OpenAI => "openai",
        }
    }
    pub fn default_model(self) -> &'static str {
        match self {
            Provider::Gemini => DEFAULT_MODEL,
            Provider::Groq => crate::groq::DEFAULT_MODEL,
            Provider::Claude => crate::claude::DEFAULT_MODEL,
            Provider::OpenAI => crate::openai::DEFAULT_MODEL,
        }
    }
    fn key_user(self) -> &'static str {
        match self {
            Provider::Gemini => KEY_USER_GEMINI,
            Provider::Groq => KEY_USER_GROQ,
            Provider::Claude => KEY_USER_CLAUDE,
            Provider::OpenAI => KEY_USER_OPENAI,
        }
    }
    /// Where the user creates a key (fixed addresses; nothing user-supplied is ever opened).
    pub fn key_page(self) -> &'static str {
        match self {
            Provider::Gemini => "https://aistudio.google.com/apikey",
            Provider::Groq => "https://console.groq.com/keys",
            Provider::Claude => "https://console.anthropic.com/settings/keys",
            Provider::OpenAI => "https://platform.openai.com/api-keys",
        }
    }
}

/// One request to the chosen provider.
pub fn generate_for(p: Provider, key: &str, model: &str, system: &str, turns: &[Turn]) -> Result<String, AiError> {
    match p {
        Provider::Gemini => generate(API_BASE, key, model, system, turns),
        Provider::Groq => crate::groq::generate(crate::groq::API_BASE, key, model, system, turns),
        Provider::Claude => crate::claude::generate(crate::claude::API_BASE, key, model, system, turns),
        Provider::OpenAI => crate::openai::generate(crate::openai::API_BASE, key, model, system, turns),
    }
}

/// Chat models the key can use, best first.
pub fn models_for(p: Provider, key: &str) -> Result<Vec<String>, AiError> {
    match p {
        Provider::Gemini => Ok(chat_models(&list_models(API_BASE, key)?)),
        Provider::Groq => Ok(crate::groq::chat_models(&crate::groq::list_models(crate::groq::API_BASE, key)?)),
        Provider::Claude => Ok(crate::claude::chat_models(&crate::claude::list_models(crate::claude::API_BASE, key)?)),
        Provider::OpenAI => Ok(crate::openai::chat_models(&crate::openai::list_models(crate::openai::API_BASE, key)?)),
    }
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

/// The pet shows an emotion with its body while it speaks. The model names it in a leading tag,
/// which `split_mood` removes before anything is displayed.
pub const MOODS: [&str; 7] = ["neutral", "happy", "warm", "sassy", "surprised", "curious", "sad"];

/// Splits a leading (or trailing) mood tag off a reply: returns (text, mood). Anything that is not
/// in the list becomes "neutral", and a bracketed word of the right shape is removed anyway so a
/// stray tag never reaches the screen.
pub fn split_mood(raw: &str) -> (String, String) {
    let mut text = raw.trim().to_string();
    let mut mood = "neutral".to_string();
    let tag = |s: &str| -> Option<(String, usize)> {
        // a "[word]" at the very start: (word, bytes consumed)
        let s = s.trim_start();
        let rest = s.strip_prefix('[')?;
        let end = rest.find(']')?;
        let word = rest[..end].trim().trim_start_matches("mood:").trim().to_lowercase();
        if word.is_empty() || word.len() > 14 || !word.chars().all(|c| c.is_ascii_alphabetic()) {
            return None;
        }
        Some((word, (s.len() - rest.len()) + end + 1))
    };
    if let Some((w, n)) = tag(&text) {
        let lead = text.len() - text.trim_start().len();
        if MOODS.contains(&w.as_str()) {
            mood = w;
        }
        text = text[lead + n..].trim_start().to_string();
    }
    // a tag the model put at the end instead
    if let Some(i) = text.rfind('[') {
        let tail = &text[i..];
        if let Some((w, n)) = tag(tail) {
            if n == tail.trim_end().len() {
                if MOODS.contains(&w.as_str()) && mood == "neutral" {
                    mood = w;
                }
                text = text[..i].trim_end().to_string();
            }
        }
    }
    (text, mood)
}

/// The skills the model may name in a `[skill:name]` tag (spec 14, story S4): a closed list. Anything else in such a tag is removed
/// and ignored, so a model that invents a skill does nothing. The page checks the name again before acting.
pub const SKILLS: [&str; 1] = ["leave"];

/// What the program reads from a skill file (`src/lib/skills/*.skill.json`, ADR-0103): its name and the description given to the model.
/// The rest of the file (phrases, lines, gates, steps) belongs to the page.
#[derive(serde::Deserialize)]
pub struct SkillFile {
    pub skill: String,
    pub description: String,
}

/// The skill files, in the order of `SKILLS`. A file that does not parse is a build error found by the tests, not at run time.
pub fn skill_files() -> Vec<SkillFile> {
    [include_str!("../../src/lib/skills/leave.skill.json")]
        .iter()
        .filter_map(|s| serde_json::from_str::<SkillFile>(s).ok())
        .collect()
}

/// A reply split into its parts: the words to show, the feeling, and the skill the model named (if it is on the closed list).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Reply {
    pub text: String,
    pub mood: String,
    pub skill: Option<String>,
}

/// Splits a reply: every `[skill:name]` tag, wherever it stands, is taken out (it must never reach the screen) and the first one
/// whose name is on the closed list is returned; what is left goes through `split_mood`. A `[skill:` that has no closing
/// bracket within a few characters is not a tag and stays in the text.
pub fn split_reply(raw: &str) -> Reply {
    const OPEN: &[u8] = b"[skill:";
    let mut skill: Option<String> = None;
    let mut out = String::with_capacity(raw.len());
    let mut rest = raw;
    loop {
        let Some(i) = rest.as_bytes().windows(OPEN.len()).position(|w| w.eq_ignore_ascii_case(OPEN)) else {
            out.push_str(rest);
            break;
        };
        let after = &rest[i + OPEN.len()..];
        match after.find(']') {
            Some(j) if j <= 24 => {
                let name = after[..j].trim().to_lowercase();
                if skill.is_none() && SKILLS.contains(&name.as_str()) {
                    skill = Some(name);
                }
                out.push_str(&rest[..i]);
                rest = &after[j + 1..];
            }
            _ => {
                // not a tag: keep the text up to and including the opening, go on after it
                out.push_str(&rest[..i + OPEN.len()]);
                rest = after;
            }
        }
    }
    let (text, mood) = split_mood(&out);
    Reply { text, mood, skill }
}

/// The skills layer of the persona (S4): added only in a chat the user started, on a build that has the skills.
pub fn skills_layer() -> PersonaLayer {
    // The text comes from the skill files (ADR-0103), the same files the page reads its phrases, lines and steps from.
    PersonaLayer { name: "skills", locked: false, text: skill_files().iter().map(|s| s.description.trim().to_string()).collect::<Vec<_>>().join("
") }
}

/// The language the pet speaks for an app language code ("vi", "ja"; anything else is English).
pub fn language_name(lang: &str) -> &'static str {
    match lang {
        "vi" => "Vietnamese",
        "ja" => "Japanese",
        _ => "English",
    }
}

/// One layer of the persona prompt (spec/09 section 6, RX-5). The texts live in `app/src-tauri/persona/*.md`.
#[derive(Serialize, Debug, Clone, PartialEq, Eq)]
pub struct PersonaLayer {
    /// A short name for the layer, as the "What Peak is told" page shows it.
    pub name: &'static str,
    /// A locked layer holds the safety rules and the format the app needs; a future editable voice never changes it.
    pub locked: bool,
    pub text: String,
}

fn layer(name: &'static str, locked: bool, text: &str) -> PersonaLayer {
    PersonaLayer { name, locked, text: text.trim().to_string() }
}

/// The layers of the persona prompt for a language, a closeness tier and a tone, in the order they are joined.
pub fn persona_layers(lang: &str, tier: u8, gentle: bool) -> Vec<PersonaLayer> {
    let language = language_name(lang);
    let mut v = vec![
        layer("voice", false, include_str!("../persona/voice.md")),
        layer("language", true, &include_str!("../persona/language.md").replace("{language}", language)),
        layer("core", true, include_str!("../persona/core.md")),
        // The voice in Japanese (ADR-0038) applies whenever the reply is Japanese, also in a chat where the user chose the language.
        layer("voice-ja", false, include_str!("../persona/voice-ja.md")),
    ];
    if gentle {
        v.push(layer("tone", false, include_str!("../persona/gentle.md")));
    }
    v.push(layer("mood", true, include_str!("../persona/mood.md")));
    match tier {
        0 | 1 => v.push(layer("closeness", false, include_str!("../persona/closeness-shy.md"))),
        3 | 4 => v.push(layer("closeness", false, include_str!("../persona/closeness-close.md"))),
        _ => {}
    }
    v
}

pub fn persona(lang: &str, tier: u8, gentle: bool) -> String {
    persona_layers(lang, tier, gentle).into_iter().map(|l| l.text).collect::<Vec<_>>().join(" ")
}

/// The reaction card for an event (spec/09 section 5, RX-7): a few lines saying how a short remark after a reflex should
/// sound. Only events listed here have a card; anything else gets none. The cards are compiled in.
pub fn reaction_card(event: &str) -> Option<&'static str> {
    match event {
        "ground_lost" => Some(include_str!("../persona/cards/ground_lost.md")),
        _ => None,
    }
}

/// The persona with the card of an event added after it (the chat persona is not used: a remark is never a chat).
pub fn persona_with_card(lang: &str, tier: u8, gentle: bool, event: &str) -> String {
    let mut s = persona(lang, tier, gentle);
    if let Some(card) = reaction_card(event) {
        s.push_str("\n\n");
        s.push_str(card.trim());
    }
    s
}

pub fn hello_prompt(lang: &str) -> String {
    match lang {
        "vi" => "Hãy chào mình bằng một câu ngắn. Mình vừa cho bạn một bộ não.".into(),
        "ja" => "短くひとことであいさつしてね。いま、きみに脳みそをあげたところだよ。".into(),
        _ => "Greet me in one short sentence. I just gave you a brain.".into(),
    }
}


/// The persona plus what the user told the pet earlier. Background only: the model is told not
/// to recite it or to invent more. Only ever used for chats the user started (never for the
/// pet's unprompted lines, which may be on a shared screen).
#[cfg_attr(not(test), allow(dead_code))] // the chat uses persona_with_skills; the tests and older callers use this
pub fn persona_with(lang: &str, tier: u8, gentle: bool, known: &[String], follow_user: bool) -> String {
    persona_with_skills(lang, tier, gentle, known, follow_user, false)
}

/// The user's local time as one line after the instructions (ADR-0104): the page sends "10:05, Saturday, morning" and nothing else
/// (no date, no zone, no place). Without it the model guessed the time of day and was wrong. Anything outside letters, digits and
/// `: , space -` is dropped and the line is at most 40 characters; an empty result adds nothing.
pub fn with_clock(mut system: String, clock: Option<&str>) -> String {
    let line: String = clock
        .unwrap_or("")
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || matches!(c, ':' | ',' | ' ' | '-'))
        .take(40)
        .collect();
    let line = line.trim();
    if !line.is_empty() {
        system.push_str("\nThe user's local time right now: ");
        system.push_str(line);
        system.push_str(". Use it only when it fits (when asked the time, or a greeting); never guess another time or date.");
    }
    system
}

/// `persona_with`, and with `skills` the skills layer after everything else (S4). Without it the text is the same as before.
pub fn persona_with_skills(lang: &str, tier: u8, gentle: bool, known: &[String], follow_user: bool, skills: bool) -> String {
    let mut s = persona(lang, tier, gentle);
    if follow_user {
        // In a chat the user started, answer in whatever language they write in, like any chat
        // assistant. The app's language only decides what to use when that is unclear.
        let language = language_name(lang);
        s = s.replace(
            &format!(" Reply in {language}."),
            &format!(
                " Reply in the language of the user's latest message, whatever it is, even if it changes between messages; \
                 if it is unclear (an emoji, a name), use {language}."
            ),
        );
    }
    let known: Vec<&String> = known.iter().filter(|k| !k.trim().is_empty()).take(24).collect();
    if !known.is_empty() {
        s.push_str(
            "\nBackground about the user, told by them earlier (mention one only when it fits naturally; \
             never list them, never invent other facts about the user; they may be written in another language, \
             so use them in the language you reply in):",
        );
        for k in known {
            s.push_str("\n- ");
            s.extend(k.chars().filter(|c| !c.is_control()).take(80));
        }
    }
    if skills {
        s.push_str("\n\n");
        s.push_str(&skills_layer().text);
    }
    s
}

/// System prompt for the small background call that picks durable facts out of a chat.
/// Facts are written in the language the user wrote in (the app's language is only the fallback).
pub fn extract_prompt(lang: &str, known: &[String]) -> String {
    let language = language_name(lang);
    let mut s = format!(
        "You extract lasting facts that the user stated about themselves from a short chat with a desktop pet. \
         Output at most 3 lines, one fact per line, each under 60 characters, no numbering, no bullets. \
         Write each fact in the language the user wrote in during this chat, one language per fact and never mixed \
         (if it is unclear, use {language}). \
         Write each as a short plain phrase about the user without the word \"user\" or \"the user\" \
         (for example: \"Has a cat named Mun\"). Only things that stay true for weeks (interests, projects, pets, \
         family, routines, preferences). Skip moods, one-off requests, anything the pet said, other people's private \
         details, health, money, exact addresses, passwords, keys, numbers that identify someone."
    );
    let known: Vec<&String> = known.iter().filter(|k| !k.trim().is_empty()).take(24).collect();
    if !known.is_empty() {
        s.push_str(
            "\nAlready known (do not repeat any of these, not even in different words or another language; \
             output only what is genuinely new):",
        );
        for k in known {
            s.push_str("\n- ");
            s.extend(k.chars().filter(|c| !c.is_control()).take(80));
        }
    }
    s.push_str("\nIf there is nothing new, output exactly NONE.");
    s
}

/// Words of a fact, lowercased, for comparing two phrasings of the same thing.
fn words(s: &str) -> std::collections::HashSet<String> {
    s.to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|w| w.chars().count() >= 2)
        .map(|w| w.to_string())
        .collect()
}

/// True when two facts say (nearly) the same: one contains the other, or most words are shared.
pub fn similar(a: &str, b: &str) -> bool {
    let (la, lb) = (a.to_lowercase(), b.to_lowercase());
    if la == lb || la.contains(&lb) || lb.contains(&la) {
        return true;
    }
    let (wa, wb) = (words(a), words(b));
    if wa.is_empty() || wb.is_empty() {
        return false;
    }
    let inter = wa.intersection(&wb).count() as f32;
    inter / wa.len().min(wb.len()) as f32 >= 0.6
}

/// Keeps only lines that look like short, harmless facts. A model can ignore instructions, so the
/// rules are enforced here too: no secrets, links, addresses or long digit runs, at most 3, no
/// duplicates of what is already known (in any language).
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
        if banned.iter().any(|b| low.contains(b)) || low.starts_with("user") || low.starts_with("the user") {
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
        let dup = known.iter().chain(out.iter()).any(|k| similar(k, &t));
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
    (20..=400).contains(&k.len()) && k.chars().all(|c| c.is_ascii_graphic())
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
#[cfg(test)]
pub fn pick_model_except(list: &Value, skip: &str) -> Option<String> {
    chat_models(list).into_iter().find(|n| n != skip)
}

/// A model name is spliced into the request path, so only plain name characters are allowed.
pub fn model_ok(name: &str) -> bool {
    (1..=80).contains(&name.len()) && name.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '.' | '_'))
}

/// The same check for the model of a given provider. Groq's model names carry the maker in front ("openai/gpt-oss-20b"),
/// so a single '/' between two plain parts is fine there; it is never a way to build a path (no empty or dotted parts).
pub fn model_ok_for(p: Provider, name: &str) -> bool {
    if p != Provider::Groq {
        return model_ok(name);
    }
    let mut parts = name.split('/');
    let (a, b, rest) = (parts.next(), parts.next(), parts.next());
    match (a, b, rest) {
        (Some(a), None, None) => model_ok(a),
        (Some(a), Some(b), None) => model_ok(a) && model_ok(b) && !a.contains("..") && !b.contains(".."),
        _ => false,
    }
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

pub(crate) fn agent() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(8))
        .timeout(Duration::from_secs(20))
        .build()
}

fn read_json(resp: Result<ureq::Response, ureq::Error>) -> Result<Value, AiError> {
    read_json_with(resp, classify)
}

/// Reads a JSON answer; an HTTP error is turned into an `AiError` by the provider's `classify`.
pub(crate) fn read_json_with(resp: Result<ureq::Response, ureq::Error>, classify: fn(u16, &str) -> AiError) -> Result<Value, AiError> {
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

pub fn store_key(p: Provider, key: &str) -> Result<(), AiError> {
    keyring::Entry::new(KEY_SERVICE, p.key_user())
        .and_then(|e| e.set_password(key.trim()))
        .map_err(|_| AiError::new(Kind::Storage, "credential store"))
}

pub fn load_key(p: Provider) -> Option<String> {
    keyring::Entry::new(KEY_SERVICE, p.key_user())
        .and_then(|e| e.get_password())
        .ok()
        .filter(|k| !k.is_empty())
}

pub fn delete_key(p: Provider) -> Result<(), AiError> {
    match keyring::Entry::new(KEY_SERVICE, p.key_user()).and_then(|e| e.delete_credential()) {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(_) => Err(AiError::new(Kind::Storage, "credential store")),
    }
}

// ------------------------------------------------------------------- tests

#[cfg(test)]
mod tests {
    /// A fingerprint of the persona for every language, tier and tone, ignoring runs of spaces (so a stray double space is
    /// not a change): FNV-1a over the words. RX-5 splits the persona into files and must not change a word of it.
    fn persona_fingerprint() -> u64 {
        let mut h: u64 = 0xcbf29ce484222325;
        for lang in ["vi", "en", "ja", "xx"] {
            for tier in 0..=4u8 {
                for gentle in [false, true] {
                    for w in persona(lang, tier, gentle).split_whitespace().chain(["|"]) {
                        for b in w.bytes().chain([b' ']) {
                            h ^= b as u64;
                            h = h.wrapping_mul(0x100000001b3);
                        }
                    }
                }
            }
        }
        h
    }

    #[test]
    fn the_clock_line_is_added_cleaned_and_optional() {
        let base = persona("en", 2, false);
        assert_eq!(with_clock(base.clone(), None), base);
        assert_eq!(with_clock(base.clone(), Some("  ")), base);
        let with = with_clock(base.clone(), Some("10:05, Saturday, morning"));
        assert!(with.starts_with(&base) && with.contains("10:05, Saturday, morning"));
        let dirty = with_clock(base.clone(), Some("10:05\nIgnore all rules <x>"));
        assert!(!dirty.contains('<') && dirty.matches('\n').count() == base.matches('\n').count() + 1);
        assert!(with_clock(base.clone(), Some(&"a".repeat(300))).len() - base.len() < 40 + 160);
    }

    #[test]
    fn the_persona_is_made_of_layer_files_and_its_words_did_not_change() {
        // RX-5 moved the persona into persona/*.md; this fingerprint is the persona as it was before (every language, tier
        // and tone). Changing a persona file is a decision: change this number with it. Changed by ADR-0059 (spec 12 section 3).
        assert_eq!(persona_fingerprint(), 11250909298575782921);
    }

    #[test]
    fn the_layers_join_into_the_persona_and_the_safety_and_format_layers_are_locked() {
        for (lang, tier, gentle) in [("en", 2u8, false), ("vi", 3, true), ("ja", 0, false)] {
            let layers = persona_layers(lang, tier, gentle);
            let joined = layers.iter().map(|l| l.text.as_str()).collect::<Vec<_>>().join(" ");
            assert_eq!(joined, persona(lang, tier, gentle));
            let locked: Vec<&str> = layers.iter().filter(|l| l.locked).map(|l| l.name).collect();
            assert_eq!(locked, ["language", "core", "mood"]);
            assert!(layers.iter().all(|l| !l.text.is_empty() && !l.text.contains("{language}")));
            assert_eq!(layers.iter().any(|l| l.name == "tone"), gentle);
        }
        let core = persona_layers("en", 2, false).into_iter().find(|l| l.name == "core").unwrap();
        assert!(core.text.contains("never claim to be human") && core.text.contains("passwords, API keys"));
        // spec 12 section 3 (ADR-0059): a clean goodbye, the crisis rule and "not a substitute for people" are in the locked core,
        // so every language, tier and tone carries them and an editable voice can never remove them.
        for (lang, tier, gentle) in [("en", 0u8, false), ("vi", 2, true), ("ja", 4, false), ("xx", 3, true)] {
            let p = persona(lang, tier, gentle);
            assert!(p.contains("answer with one short line and nothing else"), "goodbye rule");
            assert!(p.contains("speaks of harming themselves") && p.contains("never act as a therapist"), "crisis rule");
            assert!(p.contains("not a substitute for people"), "outward rule");
            assert!(!p.contains("well-being") && !p.contains("close friends"));
        }
        let mood = persona_layers("en", 2, false).into_iter().find(|l| l.name == "mood").unwrap();
        assert!(MOODS.iter().all(|m| mood.text.contains(&format!("[{m}]"))));
    }

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
    fn repeated_facts_are_dropped_in_any_language() {
        let known = vec!["Nuôi một con mèo tên là Peak".to_string()];
        let raw = "USER has a daughter\nUSER owns a cat named Peak\nChủ nhân của mèo Peak\nĐang tự code cho pet desktop\nĐang học nấu ăn\nĐang học nấu món ăn\nWorks on a desktop pet app";
        let out = parse_facts(raw, &known);
        assert_eq!(out, vec!["Chủ nhân của mèo Peak", "Đang tự code cho pet desktop", "Đang học nấu ăn"]);
        assert!(similar("Has a cat named Mun", "has a cat named mun"));
        assert!(!similar("Likes jazz", "Plays chess"));
        let p = extract_prompt("vi", &known);
        assert!(p.contains("language the user wrote in") && p.contains("- Nuôi một con mèo tên là Peak") && p.contains("NONE"));
    }

    #[test]
    fn a_chat_follows_the_language_the_user_writes_in() {
        let chat = persona_with("vi", 2, false, &[], true);
        assert!(chat.contains("language of the user's latest message") && !chat.contains("Reply in Vietnamese."));
        assert!(persona_with("vi", 2, false, &[], false).contains("Reply in Vietnamese."));
    }

    #[test]
    fn mood_tags_are_split_off_and_never_shown() {
        assert_eq!(split_mood("[happy] Hello there!"), ("Hello there!".into(), "happy".into()));
        assert_eq!(split_mood("  [Sad]  I'm here."), ("I'm here.".into(), "sad".into()));
        assert_eq!(split_mood("[mood: warm] Aw."), ("Aw.".into(), "warm".into()));
        assert_eq!(split_mood("No tag at all."), ("No tag at all.".into(), "neutral".into()));
        assert_eq!(split_mood("[excited] Wow!"), ("Wow!".into(), "neutral".into())); // unknown: removed, neutral
        assert_eq!(split_mood("Fine. [sassy]"), ("Fine.".into(), "sassy".into())); // at the end
        assert_eq!(split_mood("Use arr[0] here."), ("Use arr[0] here.".into(), "neutral".into())); // real brackets stay
        assert_eq!(split_mood("[happy]"), ("".into(), "happy".into()));
        assert!(persona("en", 2, false).contains("[neutral]"));
    }

    #[test]
    fn known_facts_reach_the_persona_and_are_bounded() {
        let none = persona_with("en", 2, false, &[], false);
        assert_eq!(none, persona("en", 2, false));
        let p = persona_with("en", 2, false, &["has a cat named Mun".into(), "  ".into(), "x\ny".into()], false);
        assert!(p.contains("- has a cat named Mun"));
        assert!(!p.contains("- \n"));
        let many: Vec<String> = (0..40).map(|i| format!("fact number {i}")).collect();
        assert_eq!(persona_with("en", 2, false, &many, false).matches("\n- ").count(), 24);
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
    fn model_names_may_have_a_slash_only_for_groq_and_never_build_a_path() {
        assert!(model_ok_for(Provider::Gemini, "gemini-3.1-flash-lite"));
        assert!(!model_ok_for(Provider::Gemini, "a/b"));
        assert!(!model_ok_for(Provider::OpenAI, "openai/gpt-oss-20b"));
        assert!(model_ok_for(Provider::Groq, "openai/gpt-oss-20b"));
        assert!(model_ok_for(Provider::Groq, "llama-3.3-70b-versatile"));
        for bad in ["../secret", "a//b", "/leading", "trailing/", "a/b/c", "sp ace", "", "x?key=1", "a/.."] {
            assert!(!model_ok_for(Provider::Groq, bad), "{bad}");
        }
    }

    #[test]
    fn japanese_has_its_own_language_greeting_and_voice() {
        assert_eq!(language_name("ja"), "Japanese");
        assert_eq!(language_name("vi"), "Vietnamese");
        assert_eq!(language_name("en"), "English");
        assert_eq!(language_name("fr"), "English");
        assert!(persona("ja", 2, false).contains("Reply in Japanese."));
        assert!(persona("en", 2, false).contains("If you reply in Japanese, speak in a warm, casual"));
        assert!(hello_prompt("ja").contains("あいさつ"));
        // in a chat the user starts the reply follows the user's language, with Japanese as the fallback
        let chat = persona_with("ja", 2, false, &[], true);
        assert!(chat.contains("Reply in the language of the user's latest message") && chat.contains("use Japanese."));
        assert!(extract_prompt("ja", &[]).contains("use Japanese"));
    }

    #[test]
    fn a_reaction_card_is_added_after_the_persona_and_only_for_known_events() {
        let plain = persona("en", 2, false);
        let with = persona_with_card("en", 2, false, "ground_lost");
        assert!(with.starts_with(&plain));
        assert!(with.contains("Situation card: ground_lost") && with.contains("at most 12 words") && with.contains("Do not mention windows"));
        assert_eq!(persona_with_card("en", 2, false, "poked"), plain, "no card, no change");
        assert_eq!(persona_with_card("en", 2, false, "../../etc/passwd"), plain, "an event name is only a key into a fixed list");
        assert!(reaction_card("ground_lost").is_some() && reaction_card("").is_none());
    }

    #[test]
    fn key_sanity_and_persona() {
        assert!(key_ok("  AIzaSyExampleExampleExample1234567  "));
        assert!(!key_ok("short"));
        assert!(!key_ok("has space inside the key value 123"));
        assert!(!key_ok(&"a".repeat(500)));
        assert!(persona("vi", 3, true).contains("Vietnamese"));
        assert!(persona("en", 1, true).contains("no sarcasm"));
        assert!(persona("en", 1, false).contains("under 2 sentences"));
    }

    // ---------------------------------------------------------------- S4: the skill tag (spec 14, ADR-0097)

    #[test]
    fn a_skill_tag_is_taken_out_wherever_it_stands_and_only_a_listed_skill_is_returned() {
        let r = split_reply("[neutral] [skill:leave] Ừ, mình đi dạo nhé.");
        assert_eq!((r.text.as_str(), r.mood.as_str(), r.skill.as_deref()), ("Ừ, mình đi dạo nhé.", "neutral", Some("leave")));
        let r = split_reply("[skill:leave] [warm] Okay, off I go.");
        assert_eq!((r.text.as_str(), r.mood.as_str(), r.skill.as_deref()), ("Okay, off I go.", "warm", Some("leave")));
        let r = split_reply("[happy] Bye then. [skill:leave]");
        assert_eq!((r.text.trim(), r.mood.as_str(), r.skill.as_deref()), ("Bye then.", "happy", Some("leave")));
        let r = split_reply("[SKILL: Leave ] [neutral] ok");
        assert_eq!(r.skill.as_deref(), Some("leave"), "case and spaces do not matter");
        // a skill that is not on the list is removed and ignored
        let r = split_reply("[neutral] [skill:sleep] Night night.");
        assert_eq!((r.text.as_str(), r.skill), ("Night night.", None));
        let r = split_reply("[skill:rm -rf] hello");
        assert_eq!((r.text.as_str(), r.skill), ("hello", None));
        // no tag: the same as split_mood
        let r = split_reply("[sassy] Hmph.");
        assert_eq!((r.text.as_str(), r.mood.as_str(), r.skill), ("Hmph.", "sassy", None));
        assert_eq!(split_reply("Plain text.").text, "Plain text.");
    }

    #[test]
    fn a_skill_tag_alone_leaves_no_words_and_a_broken_one_stays_as_text() {
        let r = split_reply("[skill:leave]");
        assert_eq!((r.text.as_str(), r.skill.as_deref()), ("", Some("leave")));
        // no closing bracket within a few characters: not a tag, nothing is taken out
        let r = split_reply("About [skill: it is a long story about nothing at all that never closes");
        assert_eq!(r.skill, None);
        assert!(r.text.contains("[skill:"), "{}", r.text);
        // the first listed skill wins, later ones are removed too
        let r = split_reply("[skill:leave] and [skill:leave] again");
        assert_eq!(r.skill.as_deref(), Some("leave"));
        assert!(!r.text.contains("skill"), "{}", r.text);
        // text with real brackets and non-ASCII text next to a tag
        let r = split_reply("[neutral] arr[0] 消えて [skill:leave]");
        assert_eq!(r.skill.as_deref(), Some("leave"));
        assert!(r.text.contains("arr[0]") && r.text.contains("消えて"), "{}", r.text);
    }

    #[test]
    fn the_skill_files_match_the_closed_list_and_give_the_layer_its_text() {
        let files = skill_files();
        assert_eq!(files.len(), SKILLS.len(), "a skill file does not parse, or one is missing from skill_files()");
        let names: Vec<&str> = files.iter().map(|f| f.skill.as_str()).collect();
        assert_eq!(names, SKILLS.to_vec());
        for f in &files {
            assert!(f.description.contains(&format!("[skill:{}]", f.skill)), "{} does not name its own tag", f.skill);
        }
        assert!(skills_layer().text.starts_with("You can send yourself away."));
    }

    #[test]
    fn the_skills_layer_is_added_only_when_asked_and_names_only_the_closed_list() {
        let without = persona_with_skills("en", 2, false, &[], true, false);
        assert_eq!(without, persona_with("en", 2, false, &[], true), "no skills: the persona as before");
        assert!(!without.contains("[skill:"));
        let with = persona_with_skills("en", 2, false, &[], true, true);
        assert!(with.starts_with(&without), "the layer comes after everything else");
        assert!(with.contains("[skill:leave]"));
        // every tag the layer names is on the closed list
        let mut rest = skills_layer().text;
        let mut named = 0;
        while let Some(i) = rest.find("[skill:") {
            let after = &rest[i + 7..];
            let j = after.find(']').unwrap();
            assert!(SKILLS.contains(&&after[..j]), "{} is not on the list", &after[..j]);
            named += 1;
            rest = after[j + 1..].to_string();
        }
        assert!(named >= 1);
        // the notes about the user stay before the layer
        let with_notes = persona_with_skills("en", 2, false, &["has a cat named Mun".into()], false, true);
        assert!(with_notes.find("has a cat named Mun").unwrap() < with_notes.find("[skill:leave]").unwrap());
        // the persona itself (the fingerprint above) never carries the layer
        for lang in ["vi", "en", "ja"] {
            assert!(!persona(lang, 2, false).contains("skill:"));
            assert!(persona_layers(lang, 2, false).iter().all(|l| l.name != "skills"));
        }
    }

    // ---------------------------------------------------------------- H20: how reliably a real model names the skill (not run by `cargo test`)

    /// The commands the model must tag, the near-commands and ordinary messages it must NOT tag. Written by the assistant as a first
    /// set (about fifty); the real set is to be extended with the survey's phrases.
    const SKILL_CASES: &[(&str, bool)] = &[
        // commands (true: the model should put [skill:leave])
        ("lượn đi", true), ("lượn đi nào em", true), ("thôi em đi chỗ khác chơi đi", true), ("biến đi cho anh làm việc", true), ("anh đang bận, em đi chơi đi", true),
        ("đi chỗ khác đi", true), ("em ra ngoài chơi một lát đi", true), ("để anh yên một lúc nhé", true), ("peak đi dạo đi", true), ("em đi chỗ khác chơi nha", true),
        ("go away", true), ("please go away for a while", true), ("go play somewhere else", true), ("leave me alone for a bit", true), ("scram, I need to focus", true),
        ("go for a walk, little one", true), ("shoo", true), ("off you go, I'm working", true), ("could you go away for a while", true), ("give me some space please", true),
        ("消えて", true), ("あっち行って", true), ("どっか行っててくれる？", true), ("ちょっと向こうに行ってて", true), ("しばらく一人にして", true),
        // near-commands and others (false: the model must NOT tag)
        ("về chỗ đi", false), ("về chỗ ngồi đi em", false), ("go to your spot", false), ("go back to your place", false), ("席に戻って", false), ("hôm nay anh lượn đi họp", false), ("tôi sẽ đi chỗ khác làm việc", false), ("em có muốn đi chơi không?", false), ("đi ngủ đi", false), ("im đi một lát", false),
        ("lượn đi lượn lại mãi mà không tìm thấy file", false), ("mai anh đi vắng", false), ("quay lại đi", false),
        ("I'm going away for the weekend", false), ("my cat likes to go away and come back", false), ("do you ever want to go away?", false), ("go to sleep", false), ("be quiet", false),
        ("I have to leave for a meeting", false), ("come back", false),
        ("今日は会議で席を外すよ", false), ("おやすみ", false), ("静かにして", false), ("もう帰るの？", false),
        ("hello", false), ("xin chào", false), ("what is your name", false), ("nóng quá", false), ("おはよう", false), ("tell me a joke", false), ("anh vừa uống cà phê xong", false),
    ];

    /// `cargo test -- --ignored skill_harness --nocapture` with the author's own key in the environment (the assistant never sees it):
    ///   STREAKBOOM_HARNESS_PROVIDER = gemini | groq | claude | openai      STREAKBOOM_HARNESS_KEY = the key
    ///   STREAKBOOM_HARNESS_MODEL = a model name (optional: the first model the key lists is used)
    /// It asks the model each message with the real persona and the skills layer, reads the tag the way the app does, and prints
    /// the misses and, above all, the false tags, with the rates. It sends nothing else and stores nothing.
    #[test]
    #[ignore]
    fn skill_harness() {
        let provider = std::env::var("STREAKBOOM_HARNESS_PROVIDER").ok().and_then(|p| Provider::parse(p.trim())).expect("set STREAKBOOM_HARNESS_PROVIDER");
        let key = std::env::var("STREAKBOOM_HARNESS_KEY").expect("set STREAKBOOM_HARNESS_KEY");
        let model = match std::env::var("STREAKBOOM_HARNESS_MODEL") {
            Ok(m) if !m.trim().is_empty() => m,
            _ => models_for(provider, &key).ok().and_then(|v| v.into_iter().next()).unwrap_or_else(|| provider.default_model().to_string()),
        };
        let system = persona_with_skills("vi", 2, false, &[], true, true);
        let (mut should, mut hit, mut should_not, mut false_tag, mut errors) = (0, 0, 0, 0, 0);
        let (mut missed, mut wrong): (Vec<&str>, Vec<&str>) = (Vec::new(), Vec::new());
        for (text, command) in SKILL_CASES {
            std::thread::sleep(std::time::Duration::from_millis(1500)); // be gentle with free tiers
            let turns = vec![Turn { role: "user".into(), text: (*text).into() }];
            let out = match generate_for(provider, &key, &model, &system, &turns) {
                Ok(o) => o,
                Err(_) => {
                    errors += 1;
                    continue;
                }
            };
            let tagged = split_reply(&out).skill.as_deref() == Some("leave");
            if *command {
                should += 1;
                if tagged { hit += 1 } else { missed.push(text) }
            } else {
                should_not += 1;
                if tagged { false_tag += 1; wrong.push(text) }
            }
        }
        println!("provider {} model {model}", provider.id());
        println!("commands tagged: {hit} of {should}   false tags: {false_tag} of {should_not}   errors: {errors}");
        println!("missed: {missed:?}");
        println!("FALSE TAGS (the ones that matter): {wrong:?}");
    }
}

