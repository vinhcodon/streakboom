# Code signing policy

This is the code signing policy of **Streakboom** (the program, with the character Peak). It says what is signed, by whom, how, and what the program does on a person's computer, so that anyone can check a download.

## Status (read this first)

**The installers are not code-signed yet.** Windows SmartScreen warns when you run one ("Windows protected your PC": choose **More info**, then **Run anyway**). The project is preparing to apply for free code signing from [SignPath.io](https://signpath.io) (certificate by [SignPath Foundation](https://signpath.org)), which needs the releases to be built automatically in public CI first. The plan is in [`docs/plans/signpath-ci-plan.md`](docs/plans/signpath-ci-plan.md). **Until the application is approved this page describes the policy we will follow, and nothing is signed.** When signing is active, this page and the README will say:

> Free code signing provided by SignPath.io, certificate by SignPath Foundation

## The project

- **Official repository:** <https://github.com/vinhcodon/streakboom> (public, MIT license). It is the only source of the signed files.
- **Home page and downloads:** <https://streakboom.com> and the [latest release](https://github.com/vinhcodon/streakboom/releases/latest). Download only from there.
- **Product name and version:** every signed file carries the product name `Streakboom` and, as its product version, the version of the release (for example `0.4.1`).

## What is signed

Only **the Windows installer**, `Streakboom_<version>_x64-setup.exe`, the file people download. The program inside it and the uninstaller are not signed separately (the installer is built in one step; signing the inside is a possible later improvement). Nothing built on a developer's computer is ever signed or published as a signed file.

## How a release is built and signed (when signing is active)

1. A version tag `vX.Y.Z` is pushed to the official repository by its owner.
2. The GitHub Actions workflow `.github/workflows/release.yml`, on a **GitHub-hosted** runner, checks that the tag, `tauri.conf.json` and `CHANGELOG.md` agree, runs the tests, and builds the installer from the source at that tag. The workflow is part of the source and is reviewed like any other file.
3. The installer is submitted to SignPath from the workflow. **Every signing request is approved by hand** (see the roles below) before it is signed.
4. The signed installer is attached to a **draft** GitHub release. The maintainer then adds the update signature (a separate key, see below), publishes the release and the update manifest.

## Roles

The team is one person at present:

| Role | Who | What it means |
|---|---|---|
| **Author** | Vinh Codon ([@vinhcodon](https://github.com/vinhcodon)) | Writes and merges source without further review |
| **Reviewer** | the same person | Reviews pull requests from people who are not committers (`.github/CODEOWNERS` names the owner for every file) |
| **Approver** | the same person | Approves each signing request |

All accounts that can change the source or the signing configuration use **multi-factor authentication**. If more people join, they are listed here with their role.

## Keys

- The Authenticode **signing key is held by SignPath** in a hardware module; the project never has it.
- The **update key** (a minisign key, a different thing) signs the update manifest's installer so that installed copies accept an update only if it verifies. It stays on the maintainer's own computer, is **not in the repository or in GitHub**, and is never printed or shared. The public half is in `app/src-tauri/tauri.conf.json`.

## What the program does on your computer, and what it sends

Plainly, so that a reviewer or an antivirus engine can tell Peak from spyware (the full text: [`docs/privacy.md`](docs/privacy.md), and the privacy page of the website):

- **Network.** Two uses only. (1) It checks for updates at GitHub (the manifest `updates/latest.json` and the release asset); this can be set to "Don't check" in Settings. (2) If **you** add your own API key, it sends your chat messages to the provider you chose (Google, Groq, Anthropic or OpenAI). Nothing else is sent: usage statistics are off by default and are never sent automatically (you can copy them by hand).
- **Input.** To keep out of your way Peak reads **when** you last used the keyboard or the mouse (one number, through `GetLastInputInfo`), where the pointer is, and whether the primary mouse button is down (through `GetAsyncKeyState`, for that one button). It **never** reads which keys you press or what you type, and it installs no keyboard or mouse hook.
- **Windows and screen.** It asks the system what kind of thing is just under its feet (the desktop, the taskbar or some window) and keeps an anonymous number for "the same window as a moment ago"; a window's class name is used only to tell the desktop and taskbar from other windows and is dropped at once. It never reads window titles, application names or what is on the screen. These readings stay in memory and are never saved or sent.
- **System changes.** It installs for the current user only (no administrator rights). "Start with Windows" is **off** by default and is asked once, politely. It has an uninstaller (Windows Settings, Apps; the uninstaller offers to delete its data).
- **No hacking tools.** It does not look for or use vulnerabilities, and does not bypass the security of the system.

## Third-party code

The dependencies and their licenses are listed in [`docs/dependency-licenses.md`](docs/dependency-licenses.md) (checked 2026-11-12: no proprietary component), and the license notices that their licenses ask for are in [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md), which is installed next to the program. Third-party binaries are not signed with our certificate.

## Checking a download

When signing is active: right-click the installer, **Properties**, **Digital Signatures**, and check that the signature is valid and the product name is `Streakboom` with the version of the release you meant to install. Before that: compare nothing with a signature (there is none) and download only from the places above.

## Concerns and incidents

A security problem: [`SECURITY.md`](SECURITY.md) (private reporting is on). A complaint about a signed file (for example an antivirus detection): open an issue or write through the private channel; the maintainer will investigate, find the root cause and cooperate with SignPath Foundation's investigation if it asks. See also the [Code of Conduct](CODE_OF_CONDUCT.md).
