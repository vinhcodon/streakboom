# Contributing to Streakboom

Thank you for looking. Streakboom is a small project with a clear character, so a few rules keep it that way. This page is short on purpose.

## Before you start

- **Read the charter** ([`docs/charter.md`](docs/charter.md), one page). It ranks what Peak is for. A change that breaks a higher article for a lower one will not be merged, however well it is made.
- **New to the repository, or an AI assistant?** Read [`docs/PROJECT.md`](docs/PROJECT.md), then [`AGENTS.md`](AGENTS.md).
- **Not sure whether something fits?** Open an issue first (the "Idea" form). A short conversation is cheaper than a rejected pull request.

## Ways to help

| You can | How |
|---|---|
| Report a bug | The "Bug" issue form. Say the Peak version, your Windows version, and the monitors and display scale. **Never paste an API key.** |
| Test on a machine or a setup we have not | Windows 11, several monitors, mixed display scales, a lower-end computer, a real key for Claude or OpenAI. These are the open checks in [`docs/plans/verification-debt.md`](docs/plans/verification-debt.md); tell us what you saw. |
| Read the Japanese | The Japanese text was written by Claude and has no native reader (it is a beta). A careful read of `app/src/lib/ui.ts` and `app/src/lib/lines.ts`, with corrections, is one of the most useful things you can give. The Vietnamese and English lines are welcome too. |
| Fix a bug or build a story | Pick an open story in [`docs/plans/backlog.md`](docs/plans/backlog.md) or an open issue, say so in the issue, then open a pull request. |
| Improve the documents | Welcome. Keep each fact in its one home ([`docs/README.md`](docs/README.md)). |

## What we will not merge

These come from the charter and from the research in [`docs/foundation/`](docs/foundation/README.md):

- **Reading meaning.** No key logging, no screen or window-title or app-name reading, nothing sent anywhere unless the person turns it on (privacy contract, ADR-0031).
- **A pet that needs the person.** No hunger, sadness, guilt, streaks, "I missed you", no holding people back when they leave.
- **Health claims.** No "healing", "therapy", "reduces anxiety or loneliness", in the app, the README or anywhere public.
- **An assistant.** Peak does not draft, summarise, search or fix. It is a companion.
- **A setting for an amount of behaviour** (how lively, how talkative). Peak reads the room; "few settings" is a principle.
- **Surprises on a working screen.** Anything that makes someone who is concentrating look up.

## Setting up

Windows 10/11, Node.js 24+, Rust stable with the MSVC build tools. From `app/`:

```powershell
npm install
npm run tauri dev
npm test
npm run check
cd src-tauri; cargo test
```

More in [`docs/development.md`](docs/development.md). A debug build of the Rust core can take 4 to 15 GB of disk; `cargo clean --profile dev` frees it.

## Pull requests

1. **Small and focused.** One change per pull request; commit only the files you changed.
2. **Tests for pure logic** (`app/src/lib/*.test.ts` beside the code; Rust tests next to the Rust). A rule that can be checked is checked.
3. **Docs in the same pull request** if users or contributors can see the change: the spec, the README if it changes a promise, `CHANGELOG.md` for a user-visible change (a short bold first sentence, then lines starting with `- `).
4. **A choice is an ADR.** If you chose between real alternatives, add a short record in `docs/decisions/` (copy the shape of an existing one) and its row in the index.
5. **Say what you did not verify.** If you could not try it on a real machine, say so in the pull request; we track such items in the debt list.
6. **Run the audit:** `node scripts/audit-docs.mjs` must report no problems. The CI runs the tests and the audit on every pull request.
7. **Motion and art** (anything the cat does or looks like): include a short screen recording or a screenshot. The author looks at a test build before it is merged.

AI-assisted contributions are fine (this project is built with Claude); you are responsible for what you submit. The code and art are under the [MIT license](LICENSE), and so are your contributions.

## Conduct and security

Be kind: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Security problems: [`SECURITY.md`](SECURITY.md), not a public issue.
