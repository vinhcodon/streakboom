//! Update check and install. Updates are downloaded from a signed manifest (`latest.json`);
//! the installer's signature is verified against the public key in tauri.conf.json, so a
//! redirected or tampered download cannot be installed.

use serde::Serialize;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State, Url};
use tauri_plugin_updater::{Update, UpdaterExt};

/// Where the update manifest lives (the `latest.json` asset of the newest GitHub release).
/// EMPTY would switch updates off. The repo must be public for this address to work.
pub const UPDATE_URL: &str = "https://github.com/vinhcodon/streakboom/releases/latest/download/latest.json";

/// A second copy of the same manifest, committed in the repository by the release script.
/// raw.githubusercontent.com kept working on 2026-11-08 while the release-download path of
/// github.com answered 504 for every release, so it is tried first and UPDATE_URL second. (The
/// installer address inside the manifest uses the GitHub API for the same reason.)
pub const FALLBACK_URL: &str = "https://raw.githubusercontent.com/vinhcodon/streakboom/main/updates/latest.json";

/// The manifest of the Preview channel (ADR-0090): the repository copy only, rewritten at every publish to show the newest
/// release of both channels (the updater takes the first address that answers, not the highest version). A Preview build has
/// no release-asset address of its own, so the Stable address is its second one: it can only offer a Stable that is newer.
pub const PREVIEW_URL: &str = "https://raw.githubusercontent.com/vinhcodon/streakboom/main/updates/preview.json";

/// The two release channels (ADR-0090). An even middle number in the version is Stable (0.4.x, 0.6.x), an odd one is Preview
/// (0.5.x, 0.7.x). `src/lib/channel.ts` has the same rule for the pages.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Channel {
    Stable,
    Preview,
}

/// The channel a version belongs to. Anything that is not `major.minor.patch` is Stable: the safe side, because Stable never
/// reads the Preview manifest.
pub fn channel_of(version: &str) -> Channel {
    let core = version.trim().trim_start_matches('v');
    let core = core.split(['-', '+']).next().unwrap_or("");
    let parts: Vec<&str> = core.split('.').collect();
    if parts.len() != 3 || parts.iter().any(|p| p.is_empty() || !p.bytes().all(|b| b.is_ascii_digit())) {
        return Channel::Stable;
    }
    match parts[1].parse::<u64>() {
        Ok(n) if n % 2 == 1 => Channel::Preview,
        _ => Channel::Stable,
    }
}

/// Each request gives up after this long, so one stuck address cannot hold up the next one.
const REQUEST_TIMEOUT: Duration = Duration::from_secs(20);
/// A failed check is repeated once after this pause (the first failure is often a passing hiccup).
const RETRY_PAUSE: Duration = Duration::from_secs(4);

/// The update found by the last check, kept so either window can install it.
#[derive(Default)]
pub struct PendingUpdate(pub Mutex<Option<Update>>);

#[derive(Serialize, Clone)]
pub struct UpdateInfo {
    pub version: String,
    pub notes: Option<String>,
    /// The channel of the offered version: "stable" or "preview" (by its middle number).
    pub channel: String,
}

/// Which kind of check this is (ADR-0095, spec 16 section 11).
/// - `Background`: the quiet check and the Ask card. Stable only, never a Preview.
/// - `Manual`: the person pressed "Check for updates": a Stable if there is a newer one, else, on a copy that is itself a
///   Preview, the newest Preview.
/// - `Test`: the person confirmed "Test builds...": the newest Stable if newer, else the newest Preview, on any copy.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Scope {
    Background,
    Manual,
    Test,
}

/// The scope named by the page; anything unknown is the safe one (a background check, Stable only).
pub fn scope_of(name: Option<&str>) -> Scope {
    match name.map(str::trim) {
        Some("manual") => Scope::Manual,
        Some("test") => Scope::Test,
        _ => Scope::Background,
    }
}

/// May a Preview be offered at all in this kind of check, for a copy on this channel?
pub fn wants_preview(scope: Scope, own: Channel) -> bool {
    match scope {
        Scope::Background => false,
        Scope::Manual => own == Channel::Preview,
        Scope::Test => true,
    }
}

/// The one candidate: the newer Stable if there is one, else (when a Preview may be offered) the newer Preview. The inputs are
/// what the updater found NEWER than this copy, so "higher than the copy in hand" is already settled; the channel of each
/// version is checked here, so a manifest that holds the other channel's version (the older rule put the newest of both in
/// `preview.json`) never offers it by mistake.
pub fn choose(stable_newer: Option<&str>, preview_newer: Option<&str>, want_preview: bool) -> Option<(String, Channel)> {
    if let Some(v) = stable_newer.filter(|v| channel_of(v) == Channel::Stable) {
        return Some((v.to_string(), Channel::Stable));
    }
    if want_preview {
        if let Some(v) = preview_newer.filter(|v| channel_of(v) == Channel::Preview) {
            return Some((v.to_string(), Channel::Preview));
        }
    }
    None
}

/// The manifest addresses, in the order they are tried. Normally the built-in ones; for testing,
/// STREAKBOOM_UPDATE_URL may hold one address or several separated by commas. The override is
/// safe to allow: an update is only installed if its signature verifies. Empty = updates are off.
fn override_list() -> Option<String> {
    std::env::var("STREAKBOOM_UPDATE_URL").ok().filter(|s| !s.trim().is_empty())
}

fn from_list(list: &str) -> Vec<Url> {
    list.split(',').filter_map(|u| Url::parse(u.trim()).ok()).collect()
}

/// The addresses of the STABLE manifest, in the order they are tried: the repository copy, then the release asset.
fn stable_endpoints(over: Option<&str>) -> Vec<Url> {
    match over.map(str::trim).filter(|s| !s.is_empty()) {
        Some(list) => from_list(list),
        None if UPDATE_URL.is_empty() => Vec::new(),
        None => [FALLBACK_URL, UPDATE_URL].iter().filter_map(|u| Url::parse(u).ok()).collect(),
    }
}

/// The addresses of the PREVIEW manifest: the repository copy only (a Preview release has no asset address of its own).
fn preview_endpoints(over: Option<&str>) -> Vec<Url> {
    match over.map(str::trim).filter(|s| !s.is_empty()) {
        Some(list) => from_list(list),
        None if UPDATE_URL.is_empty() => Vec::new(),
        None => Url::parse(PREVIEW_URL).into_iter().collect(),
    }
}

/// True when updates are configured.
#[tauri::command]
pub fn update_enabled() -> bool {
    !stable_endpoints(override_list().as_deref()).is_empty()
}

/// One manifest, asked once (with one more round after a short pause if every address failed). The updater offers a release
/// only if its version is higher than this copy's.
async fn check_one(app: &AppHandle, urls: Vec<Url>) -> Result<Option<Update>, String> {
    if urls.is_empty() {
        return Ok(None);
    }
    let build = || -> Result<_, String> {
        app.updater_builder()
            .timeout(REQUEST_TIMEOUT)
            .endpoints(urls.clone())
            .map_err(|e| e.to_string())?
            .build()
            .map_err(|e| e.to_string())
    };
    // The plugin tries every address in turn; if all fail, one more round after a short pause.
    match build()?.check().await {
        Ok(f) => Ok(f),
        Err(_) => {
            let _ = tauri::async_runtime::spawn_blocking(|| std::thread::sleep(RETRY_PAUSE)).await;
            let again = build()?.check().await;
            if let Err(e) = &again {
                crate::append_trace(app, TRACE_FILE, &failure_line("check_failed", status_in(&e.to_string()), None));
            }
            again.map_err(|e| e.to_string())
        }
    }
}

/// The small log of a failed update (names and numbers only, like leave-trace.log), in the app data folder.
const TRACE_FILE: &str = "update-trace.log";

/// Digits and dots of a version, nothing else.
fn numbers_only(v: &str) -> String {
    v.chars().filter(|c| c.is_ascii_digit() || *c == '.').take(20).collect()
}

/// The HTTP status code named in an error text ("... with status: 403 Forbidden"): the first three digits after the word
/// "status", 100 to 599. Only the number is kept, never the text.
fn status_in(err: &str) -> Option<u16> {
    let lower = err.to_ascii_lowercase();
    let at = lower.find("status")?;
    let digits: String = lower[at + 6..].chars().skip_while(|c| !c.is_ascii_digit()).take_while(|c| c.is_ascii_digit()).collect();
    let n: u16 = digits.parse().ok()?;
    (100..=599).contains(&n).then_some(n)
}

/// What GitHub's rate-limit page said: (limit, remaining, seconds until the reset).
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
struct RateLimit {
    limit: u64,
    remaining: u64,
    reset_in: u64,
}

/// Read the "core" quota from the answer of `api.github.com/rate_limit`, with the time now in seconds.
fn parse_rate_limit(json: &str, now_secs: u64) -> Option<RateLimit> {
    let v: serde_json::Value = serde_json::from_str(json).ok()?;
    let core = v.get("resources")?.get("core")?;
    Some(RateLimit {
        limit: core.get("limit")?.as_u64()?,
        remaining: core.get("remaining")?.as_u64()?,
        reset_in: core.get("reset")?.as_u64()?.saturating_sub(now_secs),
    })
}

/// One line for `update-trace.log`: the kind, the status if one was named, and the quota if it could be read.
fn failure_line(kind: &str, status: Option<u16>, limit: Option<RateLimit>) -> String {
    let mut s = format!("{kind} v={}", env!("CARGO_PKG_VERSION"));
    if let Some(c) = status {
        s += &format!(" status={c}");
    }
    if let Some(l) = limit {
        s += &format!(" limit={} remaining={} reset_in={}", l.limit, l.remaining, l.reset_in);
    }
    s
}

/// Ask GitHub how many unsigned API calls this address has left. The page itself does not use up the quota, and nothing
/// about the person is sent (a fixed program name, no account). Only called after a failed install.
fn rate_limit_now() -> Option<RateLimit> {
    let agent = ureq::AgentBuilder::new().timeout(Duration::from_secs(8)).build();
    let body = agent.get("https://api.github.com/rate_limit").set("User-Agent", "Streakboom-updater").call().ok()?.into_string().ok()?;
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).ok()?.as_secs();
    parse_rate_limit(&body, now)
}

/// Ask whether a newer version exists, by the rule of ADR-0095 (spec 16 section 11): one candidate, the newer Stable, else (when
/// the check is by hand on a Preview copy, or confirmed through "Test builds...") the newer Preview. `scope` is "background"
/// (the default: Stable only), "manual" or "test". `None` = up to date (or updates are off). With STREAKBOOM_UPDATE_URL set,
/// that one list is asked and whatever it offers is taken (a test aid).
#[tauri::command]
pub async fn update_check(app: AppHandle, pending: State<'_, PendingUpdate>, scope: Option<String>) -> Result<Option<UpdateInfo>, String> {
    let scope = scope_of(scope.as_deref());
    let own = channel_of(env!("CARGO_PKG_VERSION"));
    let found = match override_list() {
        Some(list) => check_one(&app, from_list(&list)).await?,
        None => {
            let stable = check_one(&app, stable_endpoints(None)).await?;
            let stable_v = stable.as_ref().map(|u| u.version.clone());
            // Ask for the Preview manifest only when it could matter: no newer Stable and a Preview may be offered.
            let preview = if stable_v.as_deref().is_some_and(|v| channel_of(v) == Channel::Stable) || !wants_preview(scope, own) {
                None
            } else {
                check_one(&app, preview_endpoints(None)).await?
            };
            let preview_v = preview.as_ref().map(|u| u.version.clone());
            match choose(stable_v.as_deref(), preview_v.as_deref(), wants_preview(scope, own)) {
                Some((_, Channel::Stable)) => stable,
                Some((_, Channel::Preview)) => preview,
                None => None,
            }
        }
    };
    let info = found.as_ref().map(|u| UpdateInfo {
        version: u.version.clone(),
        notes: u.body.clone(),
        channel: if channel_of(&u.version) == Channel::Preview { "preview" } else { "stable" }.to_string(),
    });
    *pending.0.lock().unwrap() = found;
    Ok(info)
}

/// Download the update found by `update_check`, verify its signature, install it and restart.
/// Progress is sent as `update-progress` events: [downloaded_bytes, total_bytes_or_null].
#[tauri::command]
pub async fn update_install(app: AppHandle, pending: State<'_, PendingUpdate>) -> Result<(), String> {
    let update = pending.0.lock().unwrap().take().ok_or("no update to install")?;
    let mut downloaded: u64 = 0;
    let progress = app.clone();
    crate::append_trace(&app, TRACE_FILE, &format!("install_start from={} to={}", env!("CARGO_PKG_VERSION"), numbers_only(&update.version)));
    let result = update
        .download_and_install(
            move |chunk, total| {
                downloaded += chunk as u64;
                let _ = progress.emit("update-progress", (downloaded, total));
            },
            || {},
        )
        .await;
    if let Err(e) = &result {
        // Why did it fail? The status and, from GitHub's free rate-limit page, how many unsigned calls are left (V-142).
        let status = status_in(&e.to_string());
        let limit = tauri::async_runtime::spawn_blocking(rate_limit_now).await.ok().flatten();
        crate::append_trace(&app, TRACE_FILE, &failure_line("install_failed", status, limit));
    }
    result.map_err(|e| e.to_string())?;
    // On Windows the installer ends this process itself; elsewhere restart into the new version.
    app.restart()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_status_is_read_from_the_error_text_and_only_the_number_is_kept() {
        assert_eq!(status_in("Download request failed with status: 403 Forbidden"), Some(403));
        assert_eq!(status_in("request failed with status 429"), Some(429));
        assert_eq!(status_in("Status: 504"), Some(504));
        assert_eq!(status_in("could not fetch a valid release JSON"), None);
        assert_eq!(status_in("status: none"), None);
        assert_eq!(status_in("status 99999"), None);
        assert_eq!(status_in("status: 42"), None);
    }

    #[test]
    fn the_quota_is_read_from_the_rate_limit_page() {
        let j = r#"{"resources":{"core":{"limit":60,"remaining":0,"reset":1000,"used":60},"search":{"limit":10}}}"#;
        assert_eq!(parse_rate_limit(j, 160), Some(RateLimit { limit: 60, remaining: 0, reset_in: 840 }));
        assert_eq!(parse_rate_limit(j, 5000).map(|r| r.reset_in), Some(0)); // a reset in the past is 0, not a wrap
        assert_eq!(parse_rate_limit("nope", 0), None);
        assert_eq!(parse_rate_limit(r#"{"resources":{}}"#, 0), None);
    }

    #[test]
    fn a_failure_line_has_names_and_numbers_only() {
        let l = failure_line("install_failed", Some(403), Some(RateLimit { limit: 60, remaining: 0, reset_in: 840 }));
        assert!(l.starts_with("install_failed v="));
        assert!(l.ends_with("status=403 limit=60 remaining=0 reset_in=840"));
        assert!(failure_line("check_failed", None, None).starts_with("check_failed v="));
        assert!(!failure_line("check_failed", None, None).contains("status"));
        // it survives the filter of the trace file unchanged
        assert!(crate::trace_line(&l, 1).unwrap().contains(&l));
        assert_eq!(numbers_only("0.9.7-evil\n/x"), "0.9.7");
    }

    #[test]
    fn updates_are_off_until_an_address_is_configured() {
        // (the test harness does not set STREAKBOOM_UPDATE_URL)
        if std::env::var("STREAKBOOM_UPDATE_URL").is_err() {
            assert_eq!(UPDATE_URL.is_empty(), !update_enabled());
        }
    }

    #[test]
    fn the_built_in_addresses_are_the_repository_copy_first_then_the_release_asset() {
        let v = stable_endpoints(None);
        assert_eq!(v.len(), 2);
        assert_eq!(v[0].host_str(), Some("raw.githubusercontent.com"));
        assert!(v[0].path().ends_with("/updates/latest.json"));
        assert_eq!(v[1].host_str(), Some("github.com"));
        assert_eq!(stable_endpoints(Some("   ")).len(), 2); // blank means "not set"
    }

    #[test]
    fn the_override_can_list_several_addresses_and_skips_bad_ones() {
        let v = stable_endpoints(Some("http://127.0.0.1:1/a.json, not a url ,https://example.com/b.json"));
        assert_eq!(v.len(), 2);
        assert_eq!(v[0].as_str(), "http://127.0.0.1:1/a.json");
        assert_eq!(v[1].host_str(), Some("example.com"));
        assert!(stable_endpoints(Some("nonsense")).is_empty());
        assert!(preview_endpoints(Some("nonsense")).is_empty());
    }

    #[test]
    fn an_even_middle_number_is_stable_and_an_odd_one_is_preview() {
        for v in ["0.4.0", "0.4.2", "0.6.0", "0.6.7", "0.0.1", "1.2.3", "2.0.0"] {
            assert_eq!(channel_of(v), Channel::Stable, "{v}");
        }
        for v in ["0.5.0", "0.5.12", "0.7.1", "1.1.0", "0.3.2"] {
            assert_eq!(channel_of(v), Channel::Preview, "{v}");
        }
        assert_eq!(channel_of("v0.5.1"), Channel::Preview);
        assert_eq!(channel_of(" 0.5.1 "), Channel::Preview);
        assert_eq!(channel_of("0.5.1-rc.1"), Channel::Preview);
        for v in ["", "abc", "0.5", "5", "0.x.1", "0.5.x", "-0.5.1", "0.5.1.2"] {
            assert_eq!(channel_of(v), Channel::Stable, "\"{v}\"");
        }
    }

    #[test]
    fn the_version_of_this_build_is_on_a_known_channel_and_the_table_matches_the_pages() {
        // The same table is asserted in src/lib/channel.test.ts; if one side changes, both must change together.
        for (v, ch) in [("0.4.2", Channel::Stable), ("0.5.0", Channel::Preview), ("0.6.0", Channel::Stable), ("0.7.3", Channel::Preview), ("junk", Channel::Stable)] {
            assert_eq!(channel_of(v), ch, "{v}");
        }
        // The build in hand is on the channel its own middle number says (a Preview build made by CI carries an odd one).
        let own = env!("CARGO_PKG_VERSION");
        let minor: u64 = own.split('.').nth(1).and_then(|m| m.parse().ok()).expect("the crate version is major.minor.patch");
        assert_eq!(channel_of(own), if minor % 2 == 1 { Channel::Preview } else { Channel::Stable });
    }

    #[test]
    fn the_preview_manifest_is_the_repository_copy_only_and_the_override_applies_to_both() {
        let v = preview_endpoints(None);
        assert_eq!(v.len(), 1);
        assert_eq!(v[0].host_str(), Some("raw.githubusercontent.com"));
        assert!(v[0].path().ends_with("/updates/preview.json"));
        // the Stable manifest is never the Preview one
        assert!(!stable_endpoints(None).iter().any(|u| u.path().ends_with("preview.json")));
        let o = preview_endpoints(Some("https://example.com/x.json"));
        assert_eq!(o.len(), 1);
        assert_eq!(stable_endpoints(Some("https://example.com/x.json")).len(), 1);
    }

    #[test]
    fn the_kind_of_check_is_named_by_the_page_and_the_unknown_is_the_safe_one() {
        assert_eq!(scope_of(Some("manual")), Scope::Manual);
        assert_eq!(scope_of(Some(" test ")), Scope::Test);
        assert_eq!(scope_of(Some("background")), Scope::Background);
        assert_eq!(scope_of(None), Scope::Background);
        assert_eq!(scope_of(Some("")), Scope::Background);
        assert_eq!(scope_of(Some("TEST")), Scope::Background); // exact words only
        assert_eq!(scope_of(Some("anything")), Scope::Background);
    }

    #[test]
    fn a_preview_may_be_offered_only_by_hand_on_a_preview_copy_or_after_the_confirmation() {
        // ADR-0095: never in the background; by hand only on a copy that is itself a Preview; on a Stable copy only through "Test builds..."
        assert!(!wants_preview(Scope::Background, Channel::Stable));
        assert!(!wants_preview(Scope::Background, Channel::Preview));
        assert!(!wants_preview(Scope::Manual, Channel::Stable));
        assert!(wants_preview(Scope::Manual, Channel::Preview));
        assert!(wants_preview(Scope::Test, Channel::Stable));
        assert!(wants_preview(Scope::Test, Channel::Preview));
    }

    // The table of spec 16 section 11, with real version numbers. `newer` is what the updater would find newer than the copy.
    fn newer<'a>(current: &str, manifest: Option<&'a str>) -> Option<&'a str> {
        let t = |v: &str| -> (u64, u64, u64) {
            let mut p = v.split('.').map(|n| n.parse::<u64>().unwrap());
            (p.next().unwrap(), p.next().unwrap(), p.next().unwrap())
        };
        manifest.filter(|m| t(m) > t(current))
    }
    fn offer(current: &str, scope: Scope, stable_manifest: Option<&str>, preview_manifest: Option<&str>) -> Option<(String, Channel)> {
        let own = channel_of(current);
        choose(newer(current, stable_manifest), newer(current, preview_manifest), wants_preview(scope, own))
    }
    fn stable(v: &str) -> Option<(String, Channel)> {
        Some((v.to_string(), Channel::Stable))
    }
    fn preview(v: &str) -> Option<(String, Channel)> {
        Some((v.to_string(), Channel::Preview))
    }

    #[test]
    fn a_stable_copy_is_offered_a_newer_stable_and_never_a_preview_unless_it_asked_for_test_builds() {
        // Stable 0.4.2; the newest Stable is 0.6.0; the newest Preview is 0.7.1
        for scope in [Scope::Background, Scope::Manual, Scope::Test] {
            assert_eq!(offer("0.4.2", scope, Some("0.6.0"), Some("0.7.1")), stable("0.6.0"), "{scope:?}");
        }
        // Stable 0.6.0 is the newest Stable; a Preview 0.7.1 exists
        assert_eq!(offer("0.6.0", Scope::Background, Some("0.6.0"), Some("0.7.1")), None);
        assert_eq!(offer("0.6.0", Scope::Manual, Some("0.6.0"), Some("0.7.1")), None, "a Stable copy sees up to date");
        assert_eq!(offer("0.6.0", Scope::Test, Some("0.6.0"), Some("0.7.1")), preview("0.7.1"), "only after the confirmation");
        // nothing newer anywhere
        assert_eq!(offer("0.6.0", Scope::Test, Some("0.6.0"), Some("0.5.1")), None);
    }

    #[test]
    fn a_preview_copy_is_offered_a_newer_preview_by_hand_and_never_in_the_background() {
        // Preview 0.7.0; no newer Stable (the newest is 0.6.0); the newest Preview is 0.7.1
        assert_eq!(offer("0.7.0", Scope::Manual, Some("0.6.0"), Some("0.7.1")), preview("0.7.1"));
        assert_eq!(offer("0.7.0", Scope::Test, Some("0.6.0"), Some("0.7.1")), preview("0.7.1"));
        assert_eq!(offer("0.7.0", Scope::Background, Some("0.6.0"), Some("0.7.1")), None, "never a Preview in the background");
        // a Stable that is lower than the copy is not offered: no downgrade
        assert_eq!(offer("0.7.1", Scope::Manual, Some("0.6.0"), Some("0.7.1")), None);
    }

    #[test]
    fn a_preview_copy_is_offered_the_stable_first_when_both_are_newer() {
        // Preview 0.7.1; a Stable 0.8.0 and a Preview 0.9.0 exist
        for scope in [Scope::Background, Scope::Manual, Scope::Test] {
            assert_eq!(offer("0.7.1", scope, Some("0.8.0"), Some("0.9.0")), stable("0.8.0"), "{scope:?}");
        }
        // after taking it (a Stable copy now), the next check by hand does not show the Preview (a Stable copy)...
        assert_eq!(offer("0.8.0", Scope::Manual, Some("0.8.0"), Some("0.9.0")), None);
        // ...unless it is a Preview copy: a copy on 0.9.0 sees its own line's next build
        assert_eq!(offer("0.9.0", Scope::Manual, Some("0.8.0"), Some("0.9.1")), preview("0.9.1"));
    }

    #[test]
    fn a_manifest_that_holds_the_other_channels_version_never_offers_it_by_mistake() {
        // The older rule put the newest of both channels in preview.json: here it holds a Stable 0.8.0, a Preview copy by hand
        assert_eq!(choose(None, Some("0.8.0"), true), None, "a Stable number in the Preview manifest is not a Preview");
        assert_eq!(choose(Some("0.9.1"), None, true), None, "a Preview number in the Stable manifest is not a Stable");
        assert_eq!(choose(Some("0.8.0"), Some("0.9.0"), false), stable("0.8.0"));
        assert_eq!(choose(None, None, true), None);
    }
}
