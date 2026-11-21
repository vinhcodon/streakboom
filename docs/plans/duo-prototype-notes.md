# Duo prototype: what was built, what was checked, what was seen

2026-11-22. Branch `exp/duo-prototype` (worktree `streakboom-duo`), Preview only, behind the developer flag `STREAKBOOM_DUO=1` (off by default), never merged. Decisions: ADR-0139 (who appears), ADR-0140 (Paws chats too). Scenes and the rule: `duo-appearance-and-scenes.md`. The cost of two windows: `duo-render-spike.md`.

## Built (steps 1 to 3, job C of the handoff)
- **State and rule** (`duo.ts`, mirrored in `duo.rs` for the tray): who was out is restored at start; the tray click sends everyone in, or brings out the pet tucked last; the other comes out only when called; each pet comes out where it went in; the entrance is learned from the nearest edge of the work area (not behind the taskbar). The file is `duo.json`, not `pet.json` (Stable drops fields it does not know).
- **Paws window** (`/paws`, Mochi art of ADR-0131, side and front views): exists only while Paws is out; slides in and out; 100 px in a 140 px window like Peak; a small bob while it walks.
- **Scenes** (`scene.ts`): three wordless scenes (tidy the ball and the cushion; Peak shifts away and Paws does not chase; Paws pushes the ball and Peak stops it after a beat); one at a time, a token, the attention rule `mayAct`, a 5-minute gap, cancel on a touch or when a pet goes in. A shared ball or cushion is a third small window only while a scene runs. Peak's page holds its own wandering and shows the pose of the scene (one small block in `+page.svelte`, on the branch only).
- **No menu items.** The prototype is driven through `duo-cmd.txt` in its data folder (`call`, `scene[:id]`, `tray`, `cancel`, `dump`) and traced in `duo-log.txt`.

## Built (steps 4 and 5)
- **Chat commands** (`duo-command.ts`, `duo_command` in `duo.rs`): "gọi Paws ra đi", "Paws vào đi", "call Paws out", "Pawsを呼んで" and the like, understood on the device: no model, no key, no chat turn. Only a short message naming one pet and saying out or in.
- **Paws answers through the AI chat** (ADR-0140): its own voice layer (`persona/paws-voice.md`, from the character bible) with the locked layers shared with Peak; the pet named answers, with no name the one last spoken to, Paws only while it is out. Its key: its own entry if one was stored, else the shared key (Rust commands to store, ask and forget it; **no Settings control yet**). The bubble stands next to the pet that answers (same bubble window, placed against Paws for the length of the line).

## Checked by me, with the real program (script `scripts/windows/duo-test.ps1`, release build, identifier `com.streakboom.duospike`)
Tests: 427 TS tests, 6 Rust tests of `duo.rs`, `svelte-check` clean. On a 1920x1080 screen at 125 percent:
- Paws stands on the work area, on the same floor as Peak (the first build put it behind the taskbar: fixed).
- The three scenes run in order, one ball at a time, and the ball is gone at the end (the first build made several balls: fixed with a lock).
- A real mouse click on Peak during a scene ends it at once (about 6 s into a 14 s scene) and removes the ball.
- The tray sends both in and brings the last one out; a restart restores who was out.
- Chat commands through the developer channel (`cmd:paws:in` and so on): Paws in, a second send-in refused, out again, Peak in with Paws staying, Peak out refused.
- The bubble: a line said as Paws (`say:paws:...`, no model) stands centred above Paws; a line as Peak stands above Peak (window positions and a picture).
- Pictures read by me: sizes of Peak and Paws are close; Peak keeps its own walk and sleep poses in the scenes.

## Seen and not solved
- **The two pets must be on the same floor.** Peak often perches on a window edge (y 670 in the test, the floor is 867). A scene is refused then (logged). Open design question: Paws climbs to the same ground, or scenes run only on the floor.
- After a scene Peak's own wandering can walk into Paws and overlap it.
- Paws only bobs: the Mochi art has no legs to move; a walk cycle would be new art (needs the author).
- A touch on Paws does not cancel a scene (its window is click-through; the hit test of a second window is not built).
- The ball window cannot be narrower than 166 px (a Windows limit): it is invisible but it is wider than the ball.

## Not verified (each in `verification-debt.md`, V-181)
Two monitors, other scale factors, the attention mode of the real Peak (the prototype passes "free"), automatic start of a scene, reduced motion, the answers of Paws from a real key (nobody has seen one: whether the two voices are told apart, H-02), the second key as a person sees it (no Settings control), the commands typed into the real chat box, the Japanese voice of Paws, "both answer one after the other", talking to Paws when Peak is in (the chat box is Peak's), and above all the question of the handoff: do the two feel like they live together, or like two animations side by side. That is for the author to judge from the program.
