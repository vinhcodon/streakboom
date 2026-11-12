# Security policy

Streakboom is a small, open-source desktop pet maintained by one person. This page says what to report, how, and what to expect.

## What to report

A problem that could harm someone who uses Streakboom, for example:

- a way to read a person's **API key** (it is kept in the Windows Credential Manager and sent only to the provider they chose);
- a way to make the app **send something it should not** (usage statistics are off by default and are never sent automatically; the only network calls are to the chosen brain provider and to GitHub for updates);
- a way to **run code through an update** (updates are signed; an update is installed only if its signature verifies);
- a way to make Peak **read what the person types or what is on their screen** (its privacy contract says it never does: [`docs/privacy.md`](docs/privacy.md));
- a flaw in how the installer or the files in `%APPDATA%\com.streakboom.app` are handled.

Not security problems (open an ordinary issue): the SmartScreen warning (the installer is not code-signed yet, a known gap), a wrong answer from an AI brain, or something Peak says that you dislike.

## How to report

**Please do not put details in a public issue.**

1. Use the repository's **Security** tab, then **Report a vulnerability**. It is private to you and the maintainer (GitHub's private vulnerability reporting, switched on on 2026-11-12).
2. If that does not work for you (for example you have no GitHub account you want to use), open a public issue titled **"Security report: please contact me"** with **no technical details, no keys and no proof of concept**, and say how the maintainer can reach you or ask for a private channel there. The maintainer will answer and move the conversation somewhere private.

Please include, once the channel is private: the version (Settings, About), your Windows version, what you saw, and how to reproduce it. Never send a real API key; a revoked or fake one is enough.

## What to expect

This is a one-person project, so there is no service level. The maintainer will try to acknowledge a report within a few days, to say whether it is accepted, and to fix a confirmed problem in the next release (a serious one in a patch release). You will be credited in the release notes if you want to be. Please give a reasonable time to fix a problem before you publish it.

## Supported versions

Only the **latest release** is supported. GitHub keeps the release before it as a way back, and does not fix it. Updates are signed with a private key that is not in the repository.

## Downloading safely

Download only from this repository's Releases page or from streakboom.com. The installer is not code-signed yet, so Windows SmartScreen warns when you run it (a known gap, see the README). Once Peak is installed, it checks the signature of every update itself (the manifest is `updates/latest.json`) and refuses one that does not verify.
