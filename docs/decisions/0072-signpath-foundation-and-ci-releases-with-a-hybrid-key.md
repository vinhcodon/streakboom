# ADR-0072: Free code signing from SignPath Foundation, releases built in CI, a hybrid for the updater key

- **Status:** accepted (answered by the author on 2026-11-12); not yet carried out
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the app session)

## Context
ADR-0071 decided to get a code-signing certificate before the alpha. The guide written for it (`docs/plans/code-signing.md`) recommended a paid certificate. The author set paid options aside and asked for an assessment of SignPath Foundation, which signs open-source projects for free but only for **automated builds of the public repository** with a manual approval of each release, and with a "verifiable reputation" for executable programs. Our releases are built on the author's computer, the repository is 5 days old with 1 star, and the updater signature needs a private key that has never left his computer (`docs/plans/signpath-ci-plan.md`).

## Decision
1. **The path to a signature is SignPath Foundation only;** paid certificates are out of scope.
2. **Releases are built in CI** (a GitHub-hosted runner, a workflow on a version tag) and the installer is submitted to SignPath once approved; until then the same flow runs without the signing step.
3. **A hybrid for the updater key:** CI builds and drafts the release with the installer; a script on the author's computer (`scripts/release-finish.ps1`) downloads it, signs it with the updater key, writes `latest.json`, publishes and prunes. **The updater key does not go to GitHub.** `scripts/release.ps1` stays as the local fallback.
4. **The application is made after two real releases built by CI,** so that it has a public build history, a code signing policy (`CODE_SIGNING.md`, a README section, a website section) and the first download numbers.
5. **The alpha runs on the unsigned installer** as soon as the checks of R3 are done, and signing is a parallel track. **This amends ADR-0071 point 3** ("a certificate before the alpha") and the roadmap's week-6 rule.

## Alternatives considered
The updater key as a GitHub secret with the whole release in CI (more automatic, but the key leaves the author's computer); applying at once (quicker, and likely to be declined for lack of reputation); waiting until after the alpha (better reputation, a much later signature, and the public launch would run unsigned); a paid certificate (set aside by the author); the Microsoft Store (a different packaging project; kept as a free plan B).

## Consequences and when to revisit
Epic E19 changes (the stories CI-1 to CI-3, CP-1 to CP-3, AP-1, SP-1 replace DS-1 to DS-3) and the roadmap (R1 and the gate of R3). The first CI runs may fail and need iterations. Revisit when SignPath answers (approved or not), or if the CI releases prove to be unreliable.

## Sources
`docs/plans/signpath-ci-plan.md`; <https://signpath.org/terms.html>; <https://docs.signpath.io/trusted-build-systems/github>; ADR-0071; ADR-0025 (update delivery).
