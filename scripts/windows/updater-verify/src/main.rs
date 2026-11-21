// Verifies an updater signature the way the installed app will: against the public key in tauri.conf.json.
// Used by scripts/release-finish.ps1 before a release is published, so a wrong key or a damaged installer is caught
// on the maintainer's computer and not on the computers of the people who update.
//
//   updater-verify <public key (the base64 text of tauri.conf.json)> <signature: base64 text or the path of a .sig file> <installer>
//
// Prints VALID and exits 0, or prints INVALID and exits 1. It reads no secret (a public key and a public signature).
use base64::Engine;
use minisign_verify::{PublicKey, Signature};

fn main() {
    let a: Vec<String> = std::env::args().collect();
    if a.len() != 4 {
        eprintln!("usage: updater-verify <public key base64> <signature base64 or .sig path> <installer>");
        std::process::exit(2);
    }
    let b64 = base64::engine::general_purpose::STANDARD;
    let text = |s: &str| String::from_utf8(b64.decode(s.trim()).expect("not base64")).expect("not text");
    let pk_text = text(&a[1]);
    let sig_arg = if std::path::Path::new(&a[2]).exists() { std::fs::read_to_string(&a[2]).expect("cannot read the signature file") } else { a[2].clone() };
    let sig_text = text(&sig_arg);
    let data = std::fs::read(&a[3]).expect("cannot read the installer");
    let pk = PublicKey::decode(&pk_text).expect("bad public key");
    let sig = Signature::decode(&sig_text).expect("bad signature");
    match pk.verify(&data, &sig, false) {
        Ok(()) => println!("VALID: the signature verifies against the public key"),
        Err(e) => {
            println!("INVALID: {e}");
            std::process::exit(1)
        }
    }
}
