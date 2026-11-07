// Diagnostic for the Gemini connection. Reads the key from the GEMINI_KEY environment variable
// (falls back to a fake key). The key is never printed. Run it yourself so the key stays local.
use std::io::Read;

fn show(label: &str, r: Result<ureq::Response, ureq::Error>) {
    match r {
        Ok(resp) => {
            let status = resp.status();
            let mut body = String::new();
            let read = resp.into_reader().take(400_000).read_to_string(&mut body);
            match read {
                Ok(_) => println!("{label}: OK {status}, {} bytes. start: {}", body.len(), body.chars().take(160).collect::<String>().replace('\n', " ")),
                Err(e) => println!("{label}: status {status} but READING THE BODY FAILED: {e} (got {} bytes)", body.len()),
            }
        }
        Err(ureq::Error::Status(c, resp)) => {
            let t = resp.into_string().unwrap_or_default();
            println!("{label}: HTTP {c}: {}", t.chars().take(200).collect::<String>().replace('\n', " "));
        }
        Err(e) => println!("{label}: TRANSPORT ERROR: {e}"),
    }
}

fn main() {
    let key = std::env::var("GEMINI_KEY").unwrap_or_else(|_| "AIzaFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKE00".into());
    let key = key.trim().to_string();
    println!("key length: {} chars (fake={})", key.len(), std::env::var("GEMINI_KEY").is_err());
    let agent = ureq::AgentBuilder::new()
        .timeout_connect(std::time::Duration::from_secs(8))
        .timeout(std::time::Duration::from_secs(40))
        .build();

    show(
        "list models",
        agent
            .get("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200")
            .set("x-goog-api-key", &key)
            .call(),
    );

    // Same shape as the app's real request: system instruction + user turn + output cap.
    let persona = "You are a witty, slightly sarcastic, loyal, and tech-savvy digital pet living on the user's desktop. Keep your responses extremely concise (under 2 sentences), playful, and attentive to the user's well-being and productivity. Reply in Vietnamese. Stay in character as a small desktop pet and never claim to be human. Never ask for or repeat passwords, API keys or other secrets. Do not give medical, legal or financial advice. You barely know the user yet, so be a little shy.";
    let cases = [
        ("short, no system", serde_json::json!({"contents":[{"role":"user","parts":[{"text":"Say hi in 3 words."}]}]})),
        ("system + english", serde_json::json!({"systemInstruction":{"parts":[{"text":persona}]},"contents":[{"role":"user","parts":[{"text":"Greet me in one short sentence. I just gave you a brain."}]}],"generationConfig":{"maxOutputTokens":512}})),
        ("system + vietnamese (app's hello)", serde_json::json!({"systemInstruction":{"parts":[{"text":persona}]},"contents":[{"role":"user","parts":[{"text":"Hãy chào mình bằng một câu ngắn. Mình vừa cho bạn một bộ não."}]}],"generationConfig":{"maxOutputTokens":512}})),
    ];
    for (name, body) in cases {
        for i in 1..=2 {
            let t0 = std::time::Instant::now();
            show(
                &format!("generate [{name}] #{i}"),
                agent
                    .post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent")
                    .set("x-goog-api-key", &key)
                    .set("Content-Type", "application/json")
                    .send_string(&body.to_string()),
            );
            println!("   took {:.1}s", t0.elapsed().as_secs_f32());
        }
    }
}
