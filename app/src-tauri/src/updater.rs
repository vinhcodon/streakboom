//! Update check and install. Updates are downloaded from a signed manifest (`latest.json`);
//! the installer's signature is verified against the public key in tauri.conf.json, so a
//! redirected or tampered download cannot be installed.

use serde::Serialize;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State, Url};
use tauri_plugin_updater::{Update, UpdaterExt};

/// Where the update manifest lives (the `latest.json` asset of the newest GitHub release).
/// EMPTY would switch updates off. The repo must be public for this address to work.
pub const UPDATE_URL: &str = "https://github.com/vinhcodon/streakboom/releases/latest/download/latest.json";

/// The update found by the last check, kept so either window can install it.
#[derive(Default)]
pub struct PendingUpdate(pub Mutex<Option<Update>>);

#[derive(Serialize, Clone)]
pub struct UpdateInfo {
    pub version: String,
    pub notes: Option<String>,
}

/// The manifest address: the built-in one, or (for testing) the STREAKBOOM_UPDATE_URL variable.
/// The override is safe to allow: an update is only installed if its signature verifies.
fn endpoint() -> Option<Url> {
    let raw = std::env::var("STREAKBOOM_UPDATE_URL").ok().filter(|s| !s.is_empty());
    let raw = raw.as_deref().unwrap_or(UPDATE_URL);
    if raw.is_empty() {
        return None;
    }
    Url::parse(raw).ok()
}

/// True when updates are configured.
#[tauri::command]
pub fn update_enabled() -> bool {
    endpoint().is_some()
}

/// Ask the server whether a newer version exists. `None` = up to date (or updates are off).
#[tauri::command]
pub async fn update_check(app: AppHandle, pending: State<'_, PendingUpdate>) -> Result<Option<UpdateInfo>, String> {
    let Some(url) = endpoint() else {
        return Ok(None);
    };
    let updater = app
        .updater_builder()
        .endpoints(vec![url])
        .map_err(|e| e.to_string())?
        .build()
        .map_err(|e| e.to_string())?;
    let found = updater.check().await.map_err(|e| e.to_string())?;
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
}
