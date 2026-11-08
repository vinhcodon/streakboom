# ADR-0025: Update delivery has two manifest addresses, the installer through the GitHub API, and a retry

- **Status:** accepted (built; not yet released)
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude. Supplements ADR-0010.

## Context
On 2026-11-08 the public release-download path of github.com (`github.com/.../releases/download/...`, also behind `releases/latest/download/...`) answered 504 for every release of the repository (and for other repositories), at its southeast-Asia edge, while the GitHub status page said all systems were operational. The API (`api.github.com`) and `raw.githubusercontent.com` kept working. The app read one address once, so every update check failed.

## Decision
- The app tries two manifest addresses in order: a copy committed in the repository (`updates/latest.json` on `raw.githubusercontent.com`) and then the release asset (`releases/latest/download/latest.json`). Each request times out after 20 s, and a failed check is repeated once after 4 s.
- The installer address inside the manifest is the GitHub API asset address (`api.github.com/repos/.../releases/assets/ID`); the updater plugin already asks for `Accept: application/octet-stream`, which that address accepts without a login.
- The release script (`scripts/release.ps1 -Publish`) does it in order: a clean git tree, a draft release with the installer, read the asset id, write the manifest with the API address, upload it, publish, then commit and push `updates/latest.json`.
- Signature verification is unchanged: nothing is installed unless the signature in the manifest matches the installer and the public key in the app.
- `STREAKBOOM_UPDATE_URL` accepts several comma-separated addresses, so the fallback can be rehearsed.

## Alternatives considered
Waiting for GitHub (kept as the status quo for installed copies); a different host for the installer such as object storage (more moving parts and accounts); a hand-written client that bypasses the plugin (more code to maintain).

## Consequences and when to revisit
- Only builds that contain this change benefit. Copies that were installed before it (up to 0.1.15) still read the old single address, so they need one manual install to get it, as happened for 0.1.15 on the author's machine.
- Unauthenticated API downloads are limited to 60 an hour per IP; an update check is two small requests and a download is one.
- The repository copy of the manifest is served through a cache and can lag a few minutes behind a release.
- If GitHub changes how asset addresses work, the API address and this script need revisiting.

## Sources
docs/engineering-log.md (the update delivery entry), app/src-tauri/src/updater.rs, scripts/release.ps1
