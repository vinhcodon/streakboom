# Sticker pack 2: the office pack (proposal, waiting for Vinh's approval)

Status: **proposal 2026-11-12. Nothing is drawn. Superseded in part on 2026-11-12 by [`sticker-packs-three-categories.md`](sticker-packs-three-categories.md): Vinh added two more categories (Cute, Friends); the office list there has 19 new stickers plus "Làm chung nhé?" from the current set, and "Để em check." is out.** Asked by Vinh: a second pack of 20 stickers with the emotions and lines that are common in office chats, in the voice of a cheeky ("lầy lội") cat, with **no duplicate** of the 20 stickers of pack 1 (`assets/stickers/set-v1/`, see [`sticker-set-v0.md`](sticker-set-v0.md)). Same rules as pack 1: PNG 360 x 360 with a transparent background, flat, at most 4 words per frame, nothing Zalo bans (ADR-0049), the charter (tease the situation, never the person's worth, ADR-0047), CC BY 4.0 and the Copy-only web page (ADR-0051).

## 1. Assessment

**Why it is a good idea**
- Pack 1 covers general feelings (greeting, joy, sorry, thanks, crying, "no"). A chat sticker is used most for banter, and office chats (Zalo work groups, Teams, Slack) are where Peak's audience, people who work at a PC all day (ADR-0002, the product line "a small cat that lives on your screen"), actually talk. A set about work is more likely to be sent in a group and seen by people who have not met Peak: this is what hypothesis H14 needs.
- The cat's habits are a ready source of office jokes that are already Peak's character: knocking a mug off the desk, sitting on the keyboard, pretending not to have heard, sleeping through a meeting, hating Mondays. The pack does not need the cat to be a worker; it is a cat **commenting on** work.

**Risks, and what to do about them**
1. **Overlap.** Pack 1 already has "Ok nè!", "Quá sức mèo rồi.", "Giỏi quá.", "Buồn ngủ…", "Hoan hô!", "Làm chung nhé?". Section 3 checks each new sticker against them; the closest are "Ok sếp." (against "Ok nè!") and "Em có nghe mà." (against "Buồn ngủ…"); both differ in the situation, the body and the face.
2. **Tone.** "Cheeky" must stay on the right side of rude: tease the situation (the meeting, the deadline, the Monday), not a person; "sếp" appears only in a light, shared-joke way; no sticker says a boss, a colleague or a customer is stupid, lazy or bad (charter article on guilt and judgement; Zalo's ban on insults).
3. **Peak is a companion, not an assistant** (charter): a few lines are the **sender's** voice ("Để em check.") and are fine, but none must make the cat look like a work tool or imply that Peak does tasks. No sticker offers help.
4. **Props.** The pack needs many new props (laptop, mug, clock, coins, a mic icon, sunglasses, a spinner). They are sticker art, not rig poses, and each can break the flat and simple look. Rule: one prop per sticker, built from plain flat shapes in the existing palette plus a few accents (coffee brown, alert red, coin yellow), no text on props except a tick or a symbol.
5. **Localisation.** These jokes are Vietnamese office culture ("sếp", Zalo's "thu hồi", "lương về chưa"). Translating them word by word would fall flat. **Proposal: pack 2 is Vietnamese only at first**; English and Japanese versions are written later as different, local office lines (for example English "Seen.", "You're on mute!", "Per my last email"; Japanese Monday and overtime jokes), not translations. This differs from pack 1 (three languages from the same pictures) and changes what the website needs (question A below).
6. **Effort.** About the effort of pack 1's later passes: the list is approved first, then a first drawing of all 20, then notes and redrawing (several rounds, as for pack 1). Written in the same script style (`build_stickers.py` grows a second set).

## 2. The list (for approval)

Texts are Vietnamese, 4 words or fewer, a first proposal for Vinh to change. "Rig" says what the face and body come from in the app (the pose names of `sprites.ts`); props and gestures are sticker art.

| # | Quote | Meaning and when it is sent | Pose, expression, prop | Rig basis |
|---|---|---|---|---|
| 01 | Đã xem. | "Seen": you read it and say nothing more; a polite or cold non-answer | Deadpan, half lids, eyes slid sideways; two small "read" ticks float beside it | `stand` front, half lid |
| 02 | Ok sếp. | "Yes, boss": a too-cheerful promise to do it | A little salute with one paw, a smile that is a bit too wide, eyes round and shiny | `stand` front, `happy` mouth |
| 03 | Để em check. | "Let me check": buying time | Looks away from the viewer while one paw taps a small laptop | `sit` front, gaze aside |
| 04 | Họp nữa à? | "Another meeting?": dread | Wide eyes, ears flat, tail puffed, a sweat drop, a little clock | `gasp` face with `sad` ears |
| 05 | Em có nghe mà. | "I was listening!": woken up in a meeting | Eyes snap open, one paw up, a pen in the other, a "z" being swept away | `wake` / `drowsy` face, wide |
| 06 | Deadline! | "The deadline is here": panic | Paws on both cheeks, mouth a round "o", an alarm clock ringing beside it | `gasp`, `held`-like wide eyes |
| 07 | Xong rồi nha! | "Done!": quietly proud | Chest out, eyes closed in a smile, a page with a tick held in front | `happy` face, `stand` |
| 08 | Nhắc nhẹ nhé. | A gentle reminder that is not so gentle | Looks at the viewer, a paw slowly pushing a mug to the edge of the desk (the classic cat move) | `stand` side, half lid |
| 09 | Cà phê đâu? | Needs coffee before anything | Slumped over a big mug, hugging it with both paws, eyes barely open | `drowsy`, `sit` |
| 10 | Lương về chưa? | "Is it payday?": hopeful | Paws clasped, eyes shining with small coin shapes | `curious` face, wide eyes |
| 11 | Thứ Hai rồi… | Monday blues | Flat on the floor like a loaf, a grey cloud over it, a sigh | `loaf` front, `sad` face |
| 12 | Thứ Sáu rồi! | Friday joy | Sunglasses, tail up, a small party sparkle | `happy` face, `stand` |
| 13 | Không phải em. | "It was not me": blame-dodging | Whistling, eyes aside, an overturned mug behind it (the cat knocked it off) | `stand` side, `smirk` face |
| 14 | Thu hồi đi! | "Recall it!": a message sent by mistake (Zalo has "thu hồi") | Wide eyes, both paws up, a speech bubble with a small "x" and an arrow going back | `gasp`, `held`-like |
| 15 | Mạng lag quá. | "My connection is bad": the excuse | Frozen face, mouth half open, a loading spinner above its head | `stand` front, rest face |
| 16 | Tắt mic rồi! | "You are on mute!": the meeting classic | Mouth wide open as if talking, a crossed-out microphone beside it | `stand` front, open mouth |
| 17 | Mai tính nha. | "I will deal with it tomorrow": procrastination | Lying back, eyes closed, a calendar page flying away | `loaf` side, closed eyes |
| 18 | Bản cuối. Thật. | "This is the final version. Really.": the fifth revision | A tired smile, sweat drop, a stack of files with the top one ticked | `stand` front, smile with a sweat drop |
| 19 | Sếp tới rồi! | "The boss is coming!": freeze | Ears up, fur on end, eyes huge, hides half behind a laptop | `notice` face, `stand` |
| 20 | Làm ở nhà. | Working from home | Wrapped in a blanket on the sofa with a laptop on its lap, half-lidded | `loaf` front, half lid |

Counts: **no title or message of the 20 repeats one of pack 1** (pack 1 is greeting, bliss, "that's life", sleepy, sulk, overwhelmed, invite, good night, haha, sorry, thanks, surprise, thinking, giggle, dry praise, "who's waiting", crying, ok, hooray, no).

### Reserve ideas (swap in if Vinh wants to replace some)
"Đi ăn trưa thôi!" (a lunch invitation, from the person's point of view, not the cat's hunger), "Tăng lương nha sếp?", "Cho em nghỉ phép.", "Họp xong chưa?", "Đã gửi mail.", "Em xin deadline mới.", "Ý hay đấy… (không).", "Tăng ca à?".

## 3. Check against pack 1
| New | Closest in pack 1 | Why it is not a duplicate |
|---|---|---|
| 02 Ok sếp. | Ok nè! | "Ok nè!" is a friendly wink and an ok-sign; "Ok sếp." is a dutiful salute, a different relationship and body. The closest pair: **question B**. |
| 05 Em có nghe mà. | Buồn ngủ… | Pack 1 is sleepy and alone; this one is caught awake in a meeting, eyes wide. |
| 04 Họp nữa à? and 06 Deadline! | Quá sức mèo rồi. | Pack 1 is a refusal; these are dread and panic about a named situation. |
| 07 Xong rồi nha! | Giỏi quá. / Hoan hô! | Praise and cheering are for others' work; this is "I am done". |
| 11 Thứ Hai rồi… and 17 Mai tính nha. | Cuộc sống mà. | Pack 1 is a shrug about life; these are about a specific day and about putting off a task. |

## 4. Proposed way of working
1. **Vinh approves the list** (the quotes and the descriptions, with the changes he wants) and answers questions A and B.
2. Claude draws a first pass of the 20 in the same style (script, flat, the pack-1 palette plus a few accents), one prop each, and a contact sheet; Vinh looks; two or three short rounds as in pack 1.
3. An ADR records the decisions; backlog story ST-8; the hypotheses are unchanged (H14 is about the Zalo-less web route, this pack is another way into it).
4. The website session adds a second pack (a pack selector or a second page) from a `set-office` folder with its own manifest; a handoff is written then, not before.
5. Non-Vietnamese versions are separate work.

## 5. Vinh's answers to the questions (2026-11-12); the list itself is still waiting for his approval
**A.** Vietnamese only for now. **B.** Keep "Ok sếp." next to "Ok nè!" (different situation). **C.** The tone stays light as drafted. **Not yet answered:** Vinh has not yet approved the 20 quotes and descriptions of section 2 (he asked to approve them before anything is drawn).

The questions as asked:
- **A. Languages:** Vietnamese only for now (recommended: the jokes are Vietnamese), or three languages of the same pictures like pack 1, or Vietnamese and English.
- **B. The closest overlap:** keep "Ok sếp." next to "Ok nè!", or swap it for a reserve idea.
- **C. Edge of the tone:** how cheeky the "sếp" lines may be (light, as drafted; or sharper; or no "sếp" at all).

## 6. Not verified
That office stickers raise the sharing or the installs (H14 is untested); that the Vietnamese lines sound natural and funny to Vinh's colleagues and are not rude to a boss (nobody has read them); that the props keep the flat, cute look at 120 px.
