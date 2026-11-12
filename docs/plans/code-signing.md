# Code signing for the Windows installer: the options and how to apply (DS-1)

**Status:** written 2026-11-12 for the author (story DS-1 of the roadmap, ADR-0071). **Set aside the same day: the author chose SignPath Foundation only (free, releases built in CI), see [`signpath-ci-plan.md`](signpath-ci-plan.md) and ADR-0072.** This file stays as the record of the paid options (Certum and others) and of the finding that no certificate removes the SmartScreen warning at once. Prices and conditions were read from the pages named on 2026-11-12 and some contradict each other. The updater key (minisign) is a different thing and stays as it is.

## What signing does, and what it does not (read this first)

Signing the installer with a certificate shows the person a **publisher name** instead of "Unknown publisher" and lets reputation accumulate for that identity. It does **not** remove the Windows SmartScreen warning at once. Microsoft's own guide (updated 2026-11-10) says new files show the warning until they have enough reputation, for **every** kind of certificate: OV, Azure Artifact Signing, and since 2024 EV too; reputation builds over time when consecutive releases are signed with the same identity ([Microsoft Learn: code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)). With 5 to 8 testers the reputation will barely move, so **the alpha testers will probably still see a SmartScreen prompt** and the install guide keeps its "More info, Run anyway" step. Signing is still worth having before going public (a named publisher, reputation that starts to build, and a clean answer to "is this safe?"), but it is not a way to make the alpha frictionless. That is why the roadmap lets the alpha start unsigned if the certificate is late (week 6).

## The options for you (an individual in Vietnam, an MIT project)

| Option | Cost | Fits? | Why |
|---|---|---|---|
| **A. Certum "Open Source Code Signing"** | about €49 to €69 first year (cloud SimplySign about €49 / $58, or a card set €69; renewal about €29 reported by one developer) | **Best fit** | Issued to **individuals** who publish open-source software; needs a **public project** that shows your relationship to it; verification by photos of your ID (automatic) and a proof of address; signing works from a **local** release (our `release.ps1` runs on your computer) |
| B. SignPath Foundation (free for open source) | free | Poor fit now | Wants a **verifiable automated build** of the public repository (a CI release, which we do not have: ours is local), manual approval of each signing, a "Code signing policy" page on the home page with their attribution line, multi-factor authentication for the team, a project with a "certain verifiable reputation" for executables, and the application is **not guaranteed** (one project was rejected in October 2026). The certificate is issued to SignPath Foundation, so Windows shows that name as the publisher |
| C. An OV certificate from another CA (DigiCert, Sectigo, GlobalSign, SSL.com) | $150 to $300 a year | Works, costs more | Since June 2023 the private key must be on a hardware token or cloud HSM; identity validation takes several business days |
| D. Azure Artifact Signing (about $10 a month) | | **Not available to you** | Individuals are limited to the USA and Canada (organizations: USA, Canada, EU, UK) |
| E. The Microsoft Store (MSIX) | free signing | Another path | Microsoft re-signs and there is no SmartScreen warning, but it means packaging and publishing through the Store: a different project, not a certificate |
| F. EV certificate | $400 and more | No | Same SmartScreen behaviour as OV since 2024 |

Sources: [Microsoft Learn](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options); [Certum: documents required](https://support.certum.eu/en/code-signing-required-documents/); [Certum shop](https://shop.certum.eu/open-source-code-signing.html) and [Certum store (cloud)](https://certum.store/open-source-code-signing-on-simplysign.html); [SignPath Foundation conditions](https://signpath.org/terms.html); [a developer's account of the Certum process](https://piers.rocks/2025/10/30/certum-open-source-code-sign.html).

**Recommendation: A, Certum Open Source.** Apply now (it is the longest wait); do not let the alpha depend on it past week 6.

## Things to decide or know before you pay (Certum)

1. **Your legal name will be the publisher name.** The certificate goes to a natural person and carries "Open Source Developer" and your name from your ID in it. Windows shows it to everyone who installs Peak. The project uses the display name **Vinh Codon**; the certificate will show the name on your identity document. Be sure you are comfortable with that being public.
2. **Open-source only.** Certum says the certificate is revoked if it is used to sign **commercially distributed** software. If you ever sell Peak (accessories, a paid brain, a store), you would need another certificate. Selling is not in the plan, but know it.
3. **The project must show your link to it.** Prepare the public addresses: the repository `https://github.com/vinhcodon/streakboom` (MIT, `LICENSE` names Vinh Codon) and `https://streakboom.com`. A short PDF that links them and says that you are the author and maintainer helps (the developer account above used one).
4. **Stock and price are unclear on Certum's pages** (one says "out of stock", prices differ between the EU shop and the US store, one page is marked as an old listing). Open the shop, pick **Open Source Code Signing in the Cloud (SimplySign)** if it is available (no card, no reader, no shipping to Vietnam), otherwise the card set (ask about shipping). If a page is out of stock, write to Certum's support.
5. **Cloud or card?** The cloud one needs the SimplySign phone app and SimplySign Desktop signed in (a code from your phone) each time you sign; fine for a release done by hand on your computer, awkward for automation. The card needs a reader and drivers. A developer reported hours of trouble linking the card's key to `signtool`.

## How to apply (step by step)

1. **Prepare:** your passport or national ID card (a driving licence or a permanent residence card also counts) and a phone with a camera; a **recent utility bill (electricity, water, gas, phone) in your own name** as the proof of address; the two project addresses above.
2. **Create an account** at the Certum store (shop.certum.eu or certum.store), choose **Open Source Code Signing** (cloud if you can), and pay.
3. **Request the certificate** in your account: "Data security products", select the certificate, and follow the request.
4. **Verify your identity.** Choose "automatic identity verification" (recommended): you photograph **both sides** of the document and your face (a short video may be asked). The alternatives (in person at a registration point, or a notary) are slower.
5. **Upload the proof of address and the project link** (the PDF) in the same place. If the upload fails, Certum's support gives a secure way to send them.
6. **Wait.** One developer got the certificate about two days after submitting; plan for up to two weeks and write to support if the status stays "Under verification".
7. **Activate** it as the account tells you (SimplySign app and Desktop for the cloud one; the card software for the card).
8. **Test on a sample file** (any small `.exe`, not our installer): sign it with `signtool` and open the file's Properties, Digital Signatures. If it shows your name, step 8 is done.

## What to give Claude once you have it (DS-2)

**Never send the certificate, its password, the SimplySign codes, the card PIN or anything secret** (nothing of that goes into chat, a file or the repository; the repository ignores `*.key`). Claude needs only: (a) cloud or card, (b) the certificate's **thumbprint** (a public number: in the certificate's Details, "Thumbprint"), and (c) confirmation that `signtool` signed your sample. Then Claude changes `scripts/release.ps1` (and the Tauri bundle settings) so that the installer is signed before the updater signature is made, and you sign each release from your own computer with SimplySign signed in. DS-3 is then one clean-machine install of the signed build.

## What is not verified

That Certum accepts a person living in Vietnam and which documents it takes from there (its page says nothing special for non-EU applicants); the real price and stock today; the renewal price; how long the verification takes; whether the cloud variant works with `signtool` the way the card does; whether Tauri's bundler can sign with a cloud certificate and still produce the updater signature in the right order (to be tried in DS-2); how fast SmartScreen reputation builds for a small project. These go into `verification-debt.md` (V-114) and are settled when DS-1 to DS-3 are done.
