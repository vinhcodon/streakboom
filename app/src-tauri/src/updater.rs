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
}

/// The manifest addresses, in the order they are tried. Normally the built-in ones; for testing,
/// STREAKBOOM_UPDATE_URL may hold one address or several separated by commas. The override is
/// safe to allow: an update is only installed if its signature verifies. Empty = updates are off.
fn endpoints() -> Vec<Url> {
    parse_endpoints(std::env::var("STREAKBOOM_UPDATE_URL").ok().as_deref(), channel_of(env!("CARGO_PKG_VERSION")))
}

fn parse_endpoints(over: Option<&str>, channel: Channel) -> Vec<Url> {
    match over.map(str::trim).filter(|s| !s.is_empty()) {
        Some(list) => list.split(',').filter_map(|u| Url::parse(u.trim()).ok()).collect(),
        None if UPDATE_URL.is_empty() => Vec::new(),
        None => {
            let first = if channel == Channel::Preview { PREVIEW_URL } else { FALLBACK_URL };
            [first, UPDATE_URL].iter().filter_map(|u| Url::parse(u).ok()).collect()
        }
    }
}

/// True when updates are configured.
#[tauri::command]
pub fn update_enabled() -> bool {
    !endpoints().is_empty()
}

/// Ask the server whether a newer version exists. `None` = up to date (or updates are off).
#[tauri::command]
pub async fn update_check(app: AppHandle, pending: State<'_, PendingUpdate>) -> Result<Option<UpdateInfo>, String> {
    let urls = endpoints();
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
    let found = match build()?.check().await {
        Ok(f) => f,
        Err(_) => {
            let _ = tauri::async_runtime::spawn_blocking(|| std::thread::sleep(RETRY_PAUSE)).await;
            build()?.check().await.map_err(|e| e.to_string())?
        }
    };
    let info = found.as_ref().map(|u| UpdateInfo {
        version: u.version.clone(),
        notes: u.body.clone(),
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
    update
        .download_and_install(
            move |chunk, total| {
                downloaded += chunk as u64;
                let _ = progress.emit("update-progress", (downloaded, total));
            },
            || {},
        )
        .await
        .map_err(|e| e.to_string())?;
    // On Windows the installer ends this process itself; elsewhere restart into the new version.
    app.restart()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn updates_are_off_until_an_address_is_configured() {
        // (the test harness does not set STREAKBOOM_UPDATE_URL)
        if std::env::var("STREAKBOOM_UPDATE_URL").is_err() {
            assert_eq!(UPDATE_URL.is_empty(), !update_enabled());
        }
    }

    #[test]
    fn the_built_in_addresses_are_the_repository_copy_first_then_the_release_asset() {
        let v = parse_endpoints(None, Channel::Stable);
        assert_eq!(v.len(), 2);
        assert_eq!(v[0].host_str(), Some("raw.githubusercontent.com"));
        assert!(v[0].path().ends_with("/updates/latest.json"));
        assert_eq!(v[1].host_str(), Some("github.com"));
        assert_eq!(parse_endpoints(Some("   "), Channel::Stable).len(), 2); // blank means "not set"
    }

    #[test]
    fn the_override_can_list_several_addresses_and_skips_bad_ones() {
        let v = parse_endpoints(Some("http://127.0.0.1:1/a.json, not a url ,https://example.com/b.json"), Channel::Stable);
        assert_eq!(v.len(), 2);
        assert_eq!(v[0].as_str(), "http://127.0.0.1:1/a.json");
        assert_eq!(v[1].host_str(), Some("example.com"));
        assert!(parse_endpoints(Some("nonsense"), Channel::Stable).is_empty());
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
    fn a_preview_reads_its_own_manifest_first_and_the_stable_address_second() {
        let v = parse_endpoints(None, Channel::Preview);
        assert_eq!(v.len(), 2);
        assert_eq!(v[0].host_str(), Some("raw.githubusercontent.com"));
        assert!(v[0].path().ends_with("/updates/preview.json"));
        assert_eq!(v[1].host_str(), Some("github.com"));
        assert!(v[1].path().ends_with("/releases/latest/download/latest.json"));
        // The override ignores the channel.
        let o = parse_endpoints(Some("https://example.com/x.json"), Channel::Preview);
        assert_eq!(o.len(), 1);
    }
}
