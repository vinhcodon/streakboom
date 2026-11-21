# Duo: the render spike (job A of `docs/handoff/duo-prototype-and-cross-review.md`)

**Status:** measured 2026-11-21 and 2026-11-22 by the app session; **a measurement, not a recommendation to build duo** (the handoff says so; the decision is the author's). Code of the spike: branch `exp/duo-prototype` (`app/src-tauri/src/spike.rs`, `app/src/routes/spike/+page.svelte`, `scripts/windows/duo-spike.ps1`), never merged. The raw samples are csv files kept outside the repository (a spike result is a table of numbers, no screen content).

## 1. The question
Two ways to show two pets: **(1)** one WebView and one window that draws both; **(2)** two windows, a WebView each. Measure memory, processor, the number of WebView processes, and look at what each means for the hit test, the click-through and the focus, against the one-pet baseline and the alpha budget of about 120 MB for all processes (ADR-0005, assumption A1 of `docs/hypotheses/README.md`).

## 2. What was measured (the setup, so that the numbers can be redone)
- **Machine:** Intel Core i5-7300U (2 cores, 4 threads), 7.9 GB, Windows 10 Pro build 19045, one monitor 1920 by 1080 at 125%, power plan Balanced, **on battery** (status "discharging"; not on AC). The author's own computer, used by him meanwhile (no other test program was running).
- **Build:** a **release** build (`tauri build --no-bundle`, 17 min 25 s) of `exp/duo-prototype` on top of `main` at `bdefa61`, with the spike code; its own identifier `com.streakboom.duospike`, so the author's Peak and its data folder were not touched (the author's data folder was copied to `D:\Claude\projects\streakboom-backups\com.streakboom.app-20261121-2333` before the first run, as the handoff asks). WebView2 started with `--disable-gpu` as in the product (software drawing), so **the GPU is off by design and was not measured**.
- **Scenarios** (each window click-through, a page with only the rig, no logic of the pet):
  - **s0** one window 200 by 200, one pet; a walk moves the window (the real way Peak walks).
  - **s1** one window 400 by 200 with two pets; a walk moves the pets inside the window.
  - **s2** two windows 200 by 200, one pet each; a walk moves each window.
  - **s3** one window of the size of the monitor ("the world window") with two pets; a walk moves the pets inside it.
  - **app** the real program as it is (the real page, the first start of a fresh data folder: the tour and the bubble appear), for scale.
- **Timeline of each run:** 12 s warm-up, 45 s still (the standing pet: nothing redraws), 45 s **walking all the time** (the pose `walk` at about 30 frames a second and, in s0 and s2, the window moved every 66 ms like the walk tick of the app: **the worst case, longer and steadier than a real walk**), 20 s still again. A script (`duo-spike.ps1`) samples every 2 s the whole tree of processes of the start (the program and its WebView2 processes): their count, the working set, the private memory, and the processor time used as a percent of one core.
- **One run per scenario.** The numbers move by a few percent from run to run; read them as orders of magnitude and ratios, not as exact values.

## 3. Results (the mean of the samples of each phase; private memory in MB, processor in percent of one core)
| Scenario | Processes | Private MB, still | Working set MB, still | Processor, still | Processor, walking |
|---|---|---|---|---|---|
| s0: one window, one pet | 7 | 97 | 279 | 3.0% | 31.7% |
| s1: one window, two pets | 7 | 100 | 284 | 4.7% | 32.5% |
| s2: two windows, one pet each | **8** | **140** | 367 | 6.1% | **69.5%** |
| s3: the world window, two pets | 7 | 126 | 347 | 4.5% | 41.5% |
| app: the real program (first start) | 7 to 8 | 144 | 366 | about 18.7% over the run (the first start is busy) | n/a |

What the tables say, by differences from s0 (the baseline of a pet in its own WebView):
- **A second pet in the same window costs almost nothing** (s1: +3 MB, +1 to 2 points of processor).
- **A second window costs a second renderer: +43 MB private memory, one more process, and walking doubles the processor** (69.5 against 31.7: about 35 points for each window that moves).
- **The world window costs +29 MB and about +10 points while walking**, between the two.
- **What costs the processor while walking is moving a transparent topmost window, not painting a second rig:** s1 (two rigs painted, no window moved) walks at the same cost as s0 (one rig, one window moved), and s2 (two windows moved) costs twice s0.
- **Against the budget of about 120 MB** (ADR-0005 measured 95 to 121 MB for a pet with this kind of page): s0 and s1 are inside it, **s3 is just above it, s2 is 20 MB above it**; and the minimal page here has no logic, the real page and the real program (the row "app") are heavier, so **the room for any second WebView is about nil on this budget**. A window that exists only while it is needed (the bubble window is made on demand and destroyed after 45 s of rest for this reason, `lib.rs`) would pay the memory only then.

## 4. A finding that rules out the world window as it was built
**With the window of the size of the screen on, Windows reports the user as busy:** `SHQueryUserNotificationState` answered **2 (busy: a full-screen program)** while s3 was running, against **5 (accepts notifications)** with s0 and without any spike. So a world window the size of the monitor (a) makes **Peak's own `busy_now()` true**, which keeps Peak quiet and refuses the screen picture, and (b) **tells Windows that the person is in a full-screen program**: the system then holds back toast notifications, a side effect on the person's other apps that the charter's article 1 (no surprise cost) does not allow. A window a little smaller than the work area might not trigger it; **that was not tried** (it needs another build). The hit-test and the click-through of such a window would also have to be redesigned (every pixel of the screen is "ours").

## 5. Hit test, click-through and focus (read in the code; what was not tested)
- **Today one thread** (`spawn_hit_test` in `lib.rs`) polls the pointer (every 150 ms, every 30 ms near the pet) against **one rectangle in `AppState.hit`** and switches `set_ignore_cursor_events` of the **one** window `main`; the rest of `AppState` that is about the pet (`focus_*`, `fly_cancel`, the cover and the away state) is also singular, and the page sends events to `main` (`emitTo("main", …)` in `bus.ts`, nine places in `lib.rs` ask for `main`). **A second pet window needs its own rectangle and either its own thread or a thread over a list of windows** (the polling doubles); the state has to be keyed by pet.
- **Good for two windows:** twenty-one commands already take the calling window (`pet_place`, `move_by`, `fly_path`, `edge_room`, …), so the geometry of a second window works the same way; `Ground::Own` is decided by process id, so both windows are "ours" to the terrain code; the bubble window is one and placed by the pet's position (`place_bubble` reads `main`), which fits "one bubble at a time", but it needs to know which pet speaks.
- **For one window with both pets (s1):** a single rectangle becomes two (or the union), the movement of a pet becomes a movement inside the canvas (a new model: today the pet **is** the window, and the terrain, the flights and the covers move the window), and the pets cannot roam apart by more than the window.
- **Not tested here:** the real hit test and the click-through with two windows (every spike window was click-through so that the computer stayed usable), the focus behaviour of two windows, the order of two topmost windows, the drag of each, two monitors, reduced motion, the GPU (off), a computer on AC power, a second run to see the spread. These go with a prototype if the author decides to build one (job C).

## 6. Which design is cheaper, what needs the state split, and the risks (no conclusion about doing duo)
- **Cheapest by the numbers:** one window with both pets (s1). **Closest to the present architecture:** two windows (s2), because the pet is a window and the commands already work per window; it costs +43 MB and doubles the walking processor **if both walk at once**.
- **A rule that makes s2 cost about s0:** at most one pet moves at a time (the spec's scenes already have one actor move while the other stays; the handoff's scenes do too), and the second window exists only while Paws is shown or in a scene and is destroyed after a rest, like the bubble. Neither was measured; they are the first things to measure in a prototype.
- **Both need the pet state split by pet id** (the hit rectangle, the focus fields, the flight cancel, the cover state, the memory of each pet, the attention and the reaction gate), one coordinator for scenes and one bubble; **neither needs a second copy of `+page.svelte`** (162,769 bytes today).
- **Risks:** the budget of 120 MB is the binding limit; a world window flips the full-screen state of the system (section 4); two topmost windows can cover each other; the cost measured is worst-case walking and one run on battery power; a prototype has to be run on the author's screens before any number here is trusted.
