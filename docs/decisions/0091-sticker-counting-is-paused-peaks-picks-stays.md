# ADR-0091: Counting of sticker uses is paused; Peak's picks stays

- **Status:** accepted (Vinh chose "Tạm dừng, giữ hàng Peak gợi ý" on 2026-11-13)
- **Date:** 2026-11-13
- **Decided by:** Vinh (author)

## Context
Q7 (ADR-0077) approved anonymous counting from v1, but not how. The test of W-57 settled part of it: GitHub's `download_count` of a tiny release file counted three requests from one IP made 30 and 90 minutes apart (3 to 6), with a lag of about 15 to 25 minutes; whether requests close together are merged is unknown (the first test suggests it), and the app session's pruning of old releases (ADR-0065) would delete counters kept in the main repository. The other way, a Cloudflare Worker, adds a service and a record per person.

## Decision
1. **Nothing is counted for now.** No counter file, no Worker, no new event on the page. The page stays as it is (nothing is sent about the visitor).
2. **The row "Peak's picks" (ADR-0084) stays** as the only first row; the HOT list (plan v1.2) and the Classics shelf are not built.
3. **When to look again:** when the sticker pages have real traffic (the thresholds are Vinh's to set), or if a later decision needs the numbers. The options then: counters in a separate repository (lag and under-counting accepted), a change of the pruning in `release-lib.ps1` by the app session, or a Worker with a privacy text changed first (ADR-0077).

## Consequences
- Plan v1.1 to v1.3 and v1.7 wait; the privacy contract does not change. W-57 keeps what the test showed.
- **Not verified:** that the hand-picked row is enough at low traffic (it is a guess, W-59).
