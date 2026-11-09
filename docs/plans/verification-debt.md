# Verification debt

Everything that was built or released but **not yet checked**, in one place. Before 2026-11-09 these lived as scattered "Not verified" lines in `docs/engineering-log.md` (about 37 of them, some already out of date). From now on this file is the list; the engineering log still tells the story of each task and says what it left unchecked, and **every new "Not verified" line is also added here, and a row is ticked or removed as soon as it is checked** (with the date and how).

Who: **Vinh** = needs the author (a second machine, a key, a reboot, eyes on the screen); **Claude** = can be done by the agent; **either**.
How the agent checks on the real machine: run from the author's Terminal panel (the agent's own shell sees a private copy of `AppData`, see the engineering log of 2026-11-09), start the app with `explorer.exe <exe>`, and for synthetic input click only on a box the test opens itself.

## A. Needs the author (a machine, a key, a reboot, eyes)
| ID | What is unchecked | How to check | Who | Since |
|---|---|---|---|---|
| V-1 | A lower-end second machine: install, update, CPU, behaviour (roadmap A1) | install 0.2.4 and look at the CPU for a day | Vinh | 0.2.0 |
| V-2 | 100% and 150% display scale (this machine runs 125%) and **several monitors**: pointer offset, walk across, `move_to`, hops, the click frame of the typing lane (roadmap A2, A3; VE-2) | change the scale; plug a second monitor; try the test build's hop items near the edges | Vinh | 0.2.0 |
| V-3 | Start with Windows across a reboot, and the tray icon after a restart (A7; PR-8) | turn the option on, reboot, look | Vinh | 0.2.0 |
| V-4 | Real keys for the Claude and the OpenAI brains: connect, chat in both languages, the no-credit and bad-key errors, the mood tags (VE-4, VE-5) | a key in Settings, Brain (never pasted in chat) | Vinh | Phase 3 |
| V-5 | A full 8-hour soak on the current build, and a long CPU run with nobody at the PC (VE-8; PR-9 decides the CPU target) | leave the PC awake; `scripts/soak-log.ps1` | Vinh | 0.2.2 |
| V-6 | The restored data shows in Settings, Memory (name, call-me name, 5 facts) | open Settings, Memory | Vinh | 2026-11-09 |
| V-7 | The installer window itself (icon, wording) and the Apps list entry (only silent installs were done) | run `Streakboom_x.y.z_x64-setup.exe` by hand | Vinh | 0.2.0 |
| V-8 | The update click-through: the offer, the accept, the restart, and which manifest address served it (the app does not log it); the mode "automatic when idle" (only "ask" was used) | wait for the next release | Vinh | 0.2.1 |
| V-9 | The first-run consent card with the new wording on a fresh install | install on a clean user | Vinh | 0.2.0 |
| V-10 | Whether the focus-safety constants feel right with a real person typing (including long pauses between bursts, keyboard-only use) and whether the typing lane's guess (H9) is good enough | use it for a week | Vinh | 0.2.4 |
| V-11 | A fresh look at the hop (TE-7): the legs of the walk pose move in the air; would a dedicated leap pose be better? | try "Test: hop up" again after TE-15 | Vinh | 2026-11-09 |

## B. The agent can check these
| ID | What is unchecked | How to check | Who | Since |
|---|---|---|---|---|
| V-20 | A stronger silence test: force `window.__pet.proactive()` during fullscreen, presentation and screen sharing, and with a sleeping cat; the app must show nothing (PF-3) | debug port plus the hook | Claude | 0.2.1 |
| V-21 | A click shorter than the polling interval (the "pressed since" bit of the button reading) | synthetic short clicks with nobody using the mouse | Claude (author's hands off the mouse) | 2026-11-09 |
| V-22 | Swapped mouse buttons: the left virtual key is the physical left button; a left-handed setting would record the wrong clicks | read `GetSystemMetrics(SM_SWAPBUTTON)` and use it; a unit test for the mapping | Claude | 2026-11-09 |
| V-23 | Hops: against the screen edge and the taskbar (clamping), on a loaded machine, and the frames in mid-air (capture faster than the screen grab) | the test build with the debug port; a burner process; a faster capture | Claude | 2026-11-09 |
| V-24 | A walk interrupted by the user working near the cat, a make-way walk interrupted by a click, a sleeping cat when the user starts typing (it waits until it wakes) | synthetic input with a harmless target | Claude | 0.2.4 |
| V-25 | The focus probe with the screen locked, shared or in a remote session, and with touch or pen input | needs those setups; a lock-screen check is possible | either | 0.2.4 |
| V-26 | Hit-testing the cat after the window moves between monitors of different scale | with V-2 | Vinh | 0.2.4 |
| V-27 | Old items from the 0.2.0 build: `shown` and `engaged` with a real unprompted line, `quiet`, the midnight rollover, the minute counter after a real sleep, the export JSON on the clipboard | the debug hooks and a changed clock | Claude | 0.2.0 |
| V-28 | The CPU of a walk away and of the probe loop (the cost of hops and falls was measured and cut in TE-15: about 0.34 core-seconds a hop; a whole typing session at four probes a second is not measured) | `scripts/cpu-breakdown.ps1` during a typing session | Claude | 2026-11-09 |
| V-29 | `cargo clippy` is not installed on this machine, so no lint run has been done | `rustup component add clippy` | Claude | 0.2.1 |

| V-30 | The typing lane with real, varied typing: a sleeping cat in the way (it was seen in the log once, waking after 0.6 s, but not by eye), the cat walking into the band, a text field near the top or bottom edge (the side with room), lines that wrap, text that was already there, typing in a title bar or a browser | use it for a week | Vinh | 2026-11-09 |
| V-31 | How often the cat hops in real use now that the cool-down is 10 s (a 6 s one gave 15 hops in two minutes in the author's test) | after a day of use read `window.__pet.trail()` (needs the debug port) or ask the author | either | 2026-11-09 |
| V-32 | The system timer set to 1 ms during a flight (`timeBeginPeriod`): that the even frames hold on other machines and that nothing else is slowed or kept awake | the second machine (V-1) | Vinh | 2026-11-09 |

| V-34 | The documentation audit (`scripts/audit-docs.mjs`) checks links, indexes, versions, retired names and test counts only; whether a spec or plan sentence is out of date was checked by reading on 2026-11-09 and can drift again | read the specs, plans, ADR statuses and progress notes at every release (ADR-0033) | Claude | 2026-11-09 |
| V-35 | ~~The website session has not yet acted on `website-release-prompt.md`~~ **Acted on 2026-11-09:** the site was brought in line with 0.2.5 (site commit `10d2fc0`: the "out of your way" text, the privacy item and FAQ, the numbers, the name "Vinh Codon", a "Wake up" chip) and the SEO and GEO proposal is in [`website-seo-geo.md`](website-seo-geo.md). The author chose (ADR-0034) and the structure was **built and deployed the same day** (commit `76a851b`); what is open is listed in V-46, V-47 and V-50 to V-53 | see those rows | Vinh | 2026-11-09 |

## D. The website (streakboom.com)
| ID | What is unchecked | How to check | Who | Since |
|---|---|---|---|---|
| V-40 | The site was looked at only in the desktop app's built-in browser (Chromium) and with emulated phone widths (320, 375, 768, 1280 px, light and dark): **not** in Firefox, Safari or Edge, and **not on a real phone** (touch targets, the scrolling menu, fonts, the canvas speed) | open streakboom.com on a phone and in Firefox | Vinh | 2026-11-09 |
| V-41 | The "Send link to my PC" button (Web Share sheet, or copy) was never run on a real phone; only the Windows layout and the emulated phone layout were looked at | tap it on a phone | Vinh | 2026-11-09 |
| V-42 | The share preview (title, description, image `og-image.jpg` with the text "Free app") on Facebook, Zalo and X was not looked at, and the platforms keep the old preview until Scrape Again | Facebook Sharing Debugger; send the link in Zalo | Vinh | 2026-11-09 |
| V-43 | The interactive Peak: the **committed** rig on the live site was checked by frame change only (wake: 6 distinct frames in 1.1 s, walk: 6 in 1.8 s), not by eye at full speed; my looking by eye used the app session's working tree, which had uncommitted rig changes (`app/src/lib/rig/engine.ts`). When that is committed the site redeploys by itself | look at the wake and the walk on the live site after the next rig commit | Claude | 2026-11-09 |
| V-44 | No offline or slow-network test on a real phone; the failures of `raw.githubusercontent.com` (error, 404, hang, empty file) were simulated with a service worker on the desktop. The raw host's rate limits were not examined | airplane mode on a phone; a throttled connection | either | 2026-11-09 |
| V-45 | The Vietnamese text of the site was written by Claude and read by the author only partly; no other native reader has looked at it (tone, terms such as "bộ não", "nhường chỗ", "giọng nhẹ nhàng") | ask a second Vietnamese reader | Vinh | 2026-11-09 |
| V-46 | Accessibility was checked by structure and keyboard focus styles only, not with a screen reader or an automated audit; Lighthouse and Core Web Vitals were never run | run Lighthouse (mobile and desktop) and tab through the page; keep the numbers as the baseline for the SEO and GEO work | Claude | 2026-11-09 |
| V-47 | No baseline for search or assistants: nothing is verified in Search Console or Bing Webmaster Tools (needs a DNS TXT record at name.com), the GitHub domain verification (a TXT record) is not done, and the assistants were not asked the question set in `website-seo-geo.md` section 7 | the author adds the TXT records; ask the assistants and log the answers | Vinh | 2026-11-09 |
| V-48 | The deletion step of `scripts/release.ps1 -Publish` (keep the newest two releases) ran only against made-up data; a stale **draft** release would count as "the previous release" (the script does not filter drafts). The site reads `CHANGELOG.md`, so the site is not hurt, but the way back could be lost | filter `draft` in the selection; run a real publish | Claude (app session) | 2026-11-09 |
| V-49 | The link text and the share image still say "Free" for the app: checked against the README (the AI brain is billed by the provider; the pages say so), but the wording was not reviewed by the author | read the home page and the share image | Vinh | 2026-11-09 |
| V-50 | The JSON-LD (SoftwareApplication, Person, WebSite, FAQPage), the `hreflang` pairs and `sitemap.xml` were checked by the build's own checks only, not by an external validator (schema.org validator, Google Rich Results Test, Search Console), and the sitemap is not submitted anywhere | run the validators on streakboom.com; submit the sitemap in Search Console and Bing | Claude / Vinh | 2026-11-09 |
| V-51 | A redeploy caused by a real release (the workflow now runs for `CHANGELOG.md`, `updates/latest.json` and `tauri.conf.json`) has not been seen, and "a failed check means nothing is deployed" is reasoned from how the workflow is built and unit-tested for each rule, not run in GitHub Actions with a real failure | watch `pages.yml` at the next release; once, push a change that breaks a check on a branch to see the deploy stop | Claude | 2026-11-09 |
| V-52 | The Vietnamese of the new blocks (At a glance, What Streakboom is not, the privacy page, the headings) was written by Claude and not read by a Vietnamese reader (adds to V-45) | ask a Vietnamese reader | Vinh | 2026-11-09 |
| V-53 | The new pages were looked at in the built-in browser only: the home in English and Vietnamese, the changelog and the phone layout by eye; the privacy pages and the 404 page only for structure and horizontal overflow; nothing by eye in dark mode on the new pages; no screen reader; the `/vi/` page was not read through by a Vietnamese reader | open each new page on a phone and in dark mode | Vinh | 2026-11-09 |
| V-54 | The language is chosen by the address now (ADR-0034): the old browser-language detection is gone, so a Vietnamese visitor who opens `/` sees English first; whether that costs visitors is unknown | look at how people arrive (Search Console country and language); add a banner if needed | either | 2026-11-09 |

## C. Things that are written but not done (not verification, kept here so they are not lost)
- ~~The privacy text on the **website** for the mouse button reading~~ **done 2026-11-09** (site commit `10d2fc0`: "what Peak notices", FAQ "Does Peak read what I type"). Still to carry to the website when TE-9 ships: the attention field and the ground type. The website session reads `CHANGELOG.md` and must be told when the lane is released.
- The website session has to be told when the behaviour it describes changes (focus-safety, making way; the typing lane when it ships): its source of truth is `CHANGELOG.md`.
