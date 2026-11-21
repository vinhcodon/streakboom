# scripts/windows

The Windows tools of the repository (ADR-0132, stage 3, `docs/plans/repo-structure-proposal.md`): the signed build and the update manifests (`release.ps1`, `release-finish.ps1`, `ci-release-prepare.ps1`, `release-lib.ps1`, tested by `test-release-lib.ps1`), `test-update/` and `updater-verify/` (rehearsing the update flow), and the measuring and checking scripts. They run on Windows with PowerShell; **the repository root is two levels up** (`Split-Path -Parent (Split-Path -Parent $PSScriptRoot)`).

The old paths `scripts/release.ps1`, `release-finish.ps1`, `ci-release-prepare.ps1`, `test-release-lib.ps1` and `test-remind-seed.ps1` are one-line stubs that call these, so that a habit or an old instruction still works until a release has been made through the new path; then the stubs are deleted. The macOS tools will be in `scripts/macos/` when there is something to distribute.
