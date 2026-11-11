# Sticker set: direction for the second pass (proposal)

Status: **Vinh chose on 2026-11-11 (ADR-0050): about 29% sarcasm (5 of 17), sticker 03 as his own idea (a cat lying back with crossed legs, thinking about life), sticker 09 as a curled mochi; those were drawn as a first pass.** The rest of this document is the reasoning and the ideas not taken. Follows the first pass in [`sticker-set-v0.md`](sticker-set-v0.md). Vinh found the poses of 03 ("Gãi bụng đi?") and 09 ("Ngủ ngon.") unnatural and asked for (1) a redraw direction for pose and expression, (2) replacements or additions that raise the share of sarcasm (it was 0%, ADR-0049 item 3), (3) a direction for the kinds of expression based on what a sticker is used for. Sketches of every idea below, made with the same rig numbers, are in [`assets/stickers/direction-v1/direction_sheet.png`](assets/stickers/direction-v1/direction_sheet.png) (rough: they show the direction, not the final art).

## 1. What a sticker is for

A sticker is not the cat talking to its owner (the app). It is a **person talking to another person** through the cat, in a chat, in two seconds, usually on a phone at about 120 px. So the cat speaks in the **sender's voice**, and a sticker earns its place by being the quickest way to say something a person says often. What people reach for stickers to do, in the order they matter for a work-and-chat audience:

| Use | What the sender wants | Example in this set |
|---|---|---|
| **Open and close** a chat | Greeting, good night | 01, 09 |
| **Acknowledge** | "ok", thanks, sorry, "got it" | 11, 12 (and a plain "ok" is missing) |
| **React** with a feeling | Happy, tired, shocked, moved | 02, 04, 07, 13 |
| **Banter** (the biggest use between friends) | Teasing, deadpan, "yeah right", unimpressed, "whatever" | 05, 15 only: **too few** |
| **Ask or dare** | Plead, demand, "come at me" | 03 |
| **Nudge** | Invite, hurry, "get on with it" | 08 |
| **Refuse or deflect** | "can't", "busy", "not now" | 06 |
| **Show a state** | Busy, sleeping, thinking | 04, 14 |

Findings: the first pass is warm and gentle (purr twice, sad twice, happy twice) and thin on banter, which is where a chat sticker is used most and where a cat's deadpan is strongest. It also has no sticker that says "I am busy" or "not now" in the cat's way. Peak's own character gives a ready source of banter that is **already in the app** (so the sticker still matches the cat): quirk 1, proud but secretly glad ("I was not waiting"); quirk 2, the belly is a trap; quirk 3, hates being woken; quirk 4, counts time (the hour jokes); and the half-lidded `huff` and `smirk` faces (spec/06 section 1.2).

### Reading rules for the face (what makes one expression read at 120 px)
1. **One idea per sticker, carried by the eyes first.** The rig has no brows or hands, so meaning comes from the lid (full, half, closed), the gaze (straight, aside, up), the head tilt and the mouth. Check each sticker at 120 px.
2. **Sarcasm is a gap between face and words**: a flat or half-lidded face with a mild line ("Ừ, giỏi lắm."), or a sweet face with a sharp line. The tools in the rig: half lid (about 0.5 to 0.6), gaze aside (`gx`), a tilt (`roll`), a flat mouth, and a one-sided smile (the mouth model already has a right-side alpha, `ra`; set to 0 it gives a smirk), and strong cheeks for "secretly glad".
3. **Tease the situation, never the person's worth** (charter, section 1.6 rule 1) and nothing that Zalo bans (insults, swearing, threats). The sarcasm here is deadpan and a little vain, like a cat; a sender can aim it at a friend, and it must still be gentle enough to send to a friend.
4. **A pose must read as a real cat position.** The rig has a front view with five bodies (stand, sit, front loaf, stretch, hang) and a side view. Use them; invent a body only for a sticker that cannot work without it, and say so (sticker-only art).

## 2. Redraw 03 "Gãi bụng đi?" (belly)

**What is wrong:** the cat is drawn as a flat oval with the paws like rabbit ears: it reads as a pancake, not as a cat on its back. **A belly-up cat reads by its silhouette:** a round belly facing us, the head at the top looking at us (the neck twisted), the front paws curled in, the hind legs splayed, the tail out to the side.

**Direction (sketch A):** the body as a tall oval, the belly cream and large in the center, the head on top with a **half-lidded, one-sided smirk** (a trap, quirk 2, which is also why it is funny), the front paws curled, the hind legs splayed low, the **claws just visible on one paw** (a small flat detail; it is the joke). Text, a dare: **"Gãi đi, dám không?"** (4 words). Sticker-only art (the app cat never rolls over); the sketch is rough and the hind legs still read a little like sitting: the second pass fixes the splay.

Two other ways if A does not please:
- **B, the belly offered while sitting:** `sit` front with both front paws raised under the chin, eyes wide and shining, text "Gãi bụng đi?" (the sweet version, no sarcasm; it **is** in the app's poses, so it matches the cat).
- **C, flopped on its side:** the cat lying on its side, one front paw reaching toward us, half-lidded, text "Gãi đi." (the lazy version).

## 3. Redraw 09 "Ngủ ngon." (good night)

**What is wrong:** the side-on loaf shows a long flat body with a small head at one end: the face, which is the emotion, is small and the shape reads as a dead pancake.

**Direction (sketch B):** use the **front loaf (`LOAF_F`, which is in the app)**: the head low and wide, eyes shut as arcs, a slow "z", cheeks warm, the head rolled a few degrees. The face is large, so it reads as a sleeping cat at 120 px. It matches the app, so no sticker-only art. Moon or stars are optional extras (art, not app).

Also add, with the **same pose and one change**, a refusal that people use all day:
- **"Đang bận ngủ."** (3 words; sketch C): the front loaf with **one eye open as a slit**, flat mouth. Says "do not disturb" in the cat's way (quirk 3).

## 4. The sarcasm layer: proposed additions (sketches D to H)

All use poses that exist in the app, except H, which is a small variation of the side stand.

| Sketch | Text | Face and pose | Use | Quirk it draws on |
|---|---|---|---|---|
| D | **Ừ, giỏi lắm.** (3) | `stand`, half lid (0.5), gaze aside, flat mouth, a slight tilt | Dry praise, "yeah right" | The `smirk` family |
| E | **Rồi sao nữa?** (3) | `stand`, half lid, gaze up and aside, three grey dots (the `think` dots) | Unimpressed, "and then?" | `think` and `huff` |
| F | **Ai đợi đâu.** (3) | `stand`, lid 0.7, gaze aside, **cheeks at full strength** (secretly glad) | "I was not waiting for you" | Quirk 1, proud but secretly glad |
| G | **Biết ngay.** (2) | `stand`, one-sided smirk, half lid, tilt | Smug "I knew it" | `smirk` |
| H | **Hứ.** (1) | **side** `stand`, head up, eyes shut, flat mouth | A snub, "hmph" | Pride |

And the existing three that tilt toward sarcasm: 03 becomes the dare above; 05 "Hừm." (the glare) is kept; 15 "Hì hì." can become "Biết ngay." (G) so there are not two smug stickers.

### Share of sarcasm
The app keeps about 14% of its scripted lines sarcastic (spec/06 D4). A chat sticker is the other way round: banter is its main use, so a share near the app's would leave the set without edge. Options (counted on the stickers that carry a sarcastic or teasing line):
- **About 13%, the app's level (2 of 15):** no additions; 03 uses the sweet version B (belly offered while sitting); only 05 and 15 tease.
- **About 29% (5 of 17):** 03 as the dare, plus D "Ừ, giỏi lắm." and F "Ai đợi đâu." (15 + 2 = 17 stickers).
- **About 37% (7 of 19):** everything in the table below except the optional 20 (with 20: 8 of 20, 40%). The table below is this one.

## 5. The set after the second pass (19 stickers; the limit is 20)

Sarcastic or teasing ones are marked **S**.

| # | Text | Use | Pose | In the app? |
|---|---|---|---|---|
| 01 | Chào buổi sáng! | open | `wake`, side | yes |
| 02 | Sướng quá~ | react | `purr` | yes |
| 03 | **Gãi đi, dám không?** S | dare | belly up, new art | no (sticker-only) |
| 04 | Buồn ngủ… | state | `drowsy` | yes |
| 05 | **Hừm.** S | banter | `huff` | yes |
| 06 | Quá sức mèo rồi. | refuse | `sad` | yes |
| 07 | Giỏi quá! | react | `happy` | yes |
| 08 | Làm chung nhé? | nudge | `curious` | yes |
| 09 | Ngủ ngon. | close | front loaf | yes |
| 10 | Trời mưa rồi. | state | `sit` under a cloud | no (cloud is art) |
| 11 | Xin lỗi nhé. | acknowledge | `sad` | yes |
| 12 | Cảm ơn nha! | acknowledge | `purr` | yes |
| 13 | Ơ! | react | `gasp` | yes |
| 14 | Để mình nghĩ… | state | `think` | yes |
| 15 | Biết ngay. S (was "Hì hì.") | banter | one-sided `smirk` | yes |
| 16 | **Ừ, giỏi lắm.** S | banter | half-lidded `stand` | yes |
| 17 | **Rồi sao nữa?** S | banter | `stand` with dots | yes |
| 18 | **Ai đợi đâu.** S | banter | `stand`, strong cheeks | yes |
| 19 | **Đang bận ngủ.** S | refuse | front loaf, one eye open | yes |
| 20 | Hứ. S (optional, side snub) | banter | side `stand` | yes |

With 20 there are 7 sarcastic or teasing ones (03, 05, 15, 16, 17, 18, 19; 20 makes 8 of 20, 40%); the 35% layout is 19 stickers without 20.

## 6. What to keep in mind
- Zalo: at most 4 words per frame, no insults, no text about trademarks, flat, 360 x 360. Every proposed text fits. The 12-sticker minimum is met by far.
- Sticker-only art stays labelled (ADR-0049 item 6): 03 and the cloud in 10.
- Texts above are proposals for Vinh to change; they have not been through his ear for Vietnamese banter (the charter asks for a native review of the lines, backlog E3).
- The sarcasm share reverses ADR-0049 item 3; when Vinh chooses, a new ADR records it (the old one stays as history).
- Nothing here is drawn as final. The sheet shows rough sketches made with the same rig numbers; the final pass would also polish the belly pose (sketch A).
