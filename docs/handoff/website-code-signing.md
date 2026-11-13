# To the website session: the "Code signing policy" section (needed before the SignPath application)

**From:** the app session (Vinh and Claude)
**To:** the session working on `site/`
**Date:** 2026-11-12
**Status:** a request, **not tied to a release**; it must be live **before** the author applies to SignPath Foundation (story AP-1 of `docs/plans/backlog.md`, epic E19; plan: [`../plans/signpath-ci-plan.md`](../plans/signpath-ci-plan.md); decision: ADR-0072).

## Why
SignPath Foundation gives free code signing to open-source projects on conditions. One of them is that the project's **home page and download pages** carry a **"Code signing policy"** (the exact term) with the team roles and a link to the privacy policy. The application will be reviewed against the live site, so the section must be there and must be **true**. The full policy is in the repository: [`CODE_SIGNING.md`](../../CODE_SIGNING.md).

## What to do
1. **A "Code signing policy" section on the home page and on the download area of every language** (the heading uses the English term `Code signing policy` in all three languages, with the explanation in the page's language). Keep it short; link to `CODE_SIGNING.md` on GitHub for the whole text.
2. **What it says now (honest wording, nothing is signed yet):**
   - The installers are **not code-signed yet**, and Windows SmartScreen will warn ("More info", then "Run anyway"; the install steps you already show stay).
   - The project is **preparing to apply for free code signing from SignPath.io** (certificate by SignPath Foundation), which needs releases built automatically in public CI; the policy it will follow is [`CODE_SIGNING.md`](https://github.com/vinhcodon/streakboom/blob/main/CODE_SIGNING.md).
   - **Team:** Vinh Codon ([@vinhcodon](https://github.com/vinhcodon)) is the author, reviewer and approver (one person).
   - **Privacy:** a link to your privacy page, and one plain sentence: the program uses the network only to check for updates at GitHub (can be turned off) and, if the person adds their own key, to chat with the provider they chose; nothing else is sent.
3. **Do not claim more than is true:** no "signed", "verified", "trusted", "safe" or "secure installer", and **not the SignPath attribution line yet**. When the project is approved the author will tell you, and the line `Free code signing provided by SignPath.io, certificate by SignPath Foundation` (exactly that wording) goes on the home page and the download pages, with the "not signed yet" sentences removed.
4. **Optional, as you see fit:** a check in your build that the home page and the download area of each language contain `Code signing policy` and a link to `CODE_SIGNING.md`, so the section cannot silently disappear (and later, the attribution line once it is active). The README's own section is already there.
5. The repository also has [`THIRD-PARTY-NOTICES.md`](https://github.com/vinhcodon/streakboom/blob/main/THIRD-PARTY-NOTICES.md) (the licenses of the code compiled into the program; it is installed next to the program from the next release) and [`docs/dependency-licenses.md`](../dependency-licenses.md); the privacy page could link them. This is a suggestion, not a SignPath condition.

## Report back
Tell the author when the section is live in the three languages (he will then apply), write an ADR for what you chose, and add anything unchecked to the website section of `docs/plans/verification-debt.md`.
