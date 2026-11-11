# ADR-0046: Peak gets out from under a window it cannot be raised over (the Start menu, Search)

- **Status:** accepted (the author's report of 2026-11-10); built and seen on the real screen with the Start menu and Search
- **Date:** 2026-11-10
- **Decided by:** Vinh (author), with Claude

## Context
The author found that when the Windows Start menu or Search is opened over Peak, it stays hidden under it with nothing in it noticing. These windows are in a layer above the always-on-top one, so Peak cannot be raised over them.

## What was measured (a real screen, Windows 10)
- The Start menu and Search windows are **not in the stacking order a normal program can list** (walking the windows from the top never shows them), but a **hit test at a point** finds them: the window class is `Windows.UI.Core.CoreWindow` and the style is always-on-top.
- **The Start menu's window rectangle is the whole screen**, while only its flyout answers a touch (a point at the top right of the screen goes to the window behind). Search's rectangle is about the size of its flyout. So a rectangle cannot be used; only a touch at a point tells where the flyout is.

## Decision
1. **Once a second Peak asks Rust about five points of its body** (`cover_probe`): is the topmost window there an always-on-top window that is not ours, not the desktop or the taskbar, and not below Peak in the stacking order (a window that is, is not covering it). If something is, Peak is first put back on top (a window of its own layer may simply have come later) and asked again.
2. **If it is still covered it hops out.** The places it could hop to are listed nearest first (`escape.ts`: sideways in steps of 80 px, then up and down with a bonus against vertical ones, all inside the work area), Rust is asked about the five points of each place, and it hops to the first free one (a hop chain, the same flight as a perch). It then goes on as usual (a perch is forgotten).
3. **Privacy:** only "covered or not" at some points comes back. No title, no process, no name, no rectangle is read for this. ADR-0031 already allows the kind of thing under a point; this adds no new kind of fact.

## Seen
With the cat at the bottom left, the Start menu opened: `covered: out by 400,0`, the cat was 400 px to the right and out of the flyout within two seconds. With Search: out by 560. Nothing happens when nothing covers it.

## Not done
Win 11's centred menus, Task View, the action centre and the notification flyouts should work the same (they are of the same kind of window) but were not seen. A window in front of the cat on a second monitor, the cat dozing under the menu, and the cost of a probe when many places are tried are in the list of what is not verified.

## Amendment 2026-11-11 (the CPU check of 0.3.2)
The first version asked from the page once a second (`cat_covered`, then three calls a second). The CPU check against 0.3.1 showed about 0.4 of a core-percent more in the Rust process and 0.5 more in the WebView2 manager. The check now runs in the hit-test thread (`cat_covered_at`, about once a second, no call from the page); the page is told by the `percept` event `covered` when the answer changes and again every 3 seconds while it lasts, and it then works out where to hop as before. Seen again with the Start menu: covered, out by 400 px, no longer covered. After the change the Rust and the manager CPU were the same as 0.3.1's.
