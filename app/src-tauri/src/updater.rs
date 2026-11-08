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
    parse_endpoints(std::env::var("STREAKBOOM_UPDATE_URL").ok().as_deref())
}

fn parse_endpoints(over: Option<&str>) -> Vec<Url> {
    match over.map(str::trim).filter(|s| !s.is_empty()) {
        Some(list) => list.split(',').filter_map(|u| Url::parse(u.trim()).ok()).collect(),
        None if UPDATE_URL.is_empty() => Vec::new(),
        None => [FALLBACK_URL, UPDATE_URL].iter().filter_map(|u| Url::parse(u).ok()).collect(),
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
        let v = parse_endpoints(None);
        assert_eq!(v.len(), 2);
        assert_eq!(v[0].host_str(), Some("raw.githubusercontent.com"));
        assert_eq!(v[1].host_str(), Some("github.com"));
        assert_eq!(parse_endpoints(Some("   ")).len(), 2); // blank means "not set"
    }

    #[test]
    fn the_override_can_list_several_addresses_and_skips_bad_ones() {
        let v = parse_endpoints(Some("http://127.0.0.1:1/a.json, not a url ,https://example.com/b.json"));
        assert_eq!(v.len(), 2);
        assert_eq!(v[0].as_str(), "http://127.0.0.1:1/a.json");
        assert_eq!(v[1].host_str(), Some("example.com"));
        assert!(parse_endpoints(Some("nonsense")).is_empty());
    }
}
