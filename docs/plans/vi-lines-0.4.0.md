# The Vietnamese lines changed for 0.4.0, to read (V-103, V-105)

**Status:** written 2026-11-12 for the author to read before the release. It is a list, not a source of truth: the lines live in `app/src/lib/lines.ts` and `app/src/lib/memlines.ts`. The reason for each change: absence costs nothing, no streak, a bored Peak amuses itself (ADR-0059, spec 12). The Japanese lines were changed one to one and have no native reader (V-99). Tick what is good; write the rewrite next to what is not.

## Ordinary lines (`lines.ts`)

| # | Before | After |
|---|---|---|
| 1 | Đây rồi. Mình sắp nói chuyện với mấy cái icon rồi đó. | Đây rồi. Mình với mấy cái icon đang tán gẫu dở. |
| 2 | Cuối cùng cũng về! Mình đếm pixel hai lượt rồi. | Đây rồi! Mình đếm pixel hai lượt rồi. Cho vui thôi. |
| 3 | Ồ, chào. Mình không nhớ bạn đâu. (Có đó.) | Ồ, chào. Mình vừa bận không làm gì cả. Suôn sẻ lắm. |
| 4 | Chán. Giải trí cho mình đi? Bấm vào mình thử. | Chán. Mình đi ngắm cái đồng hồ đây. Nó có nhúc nhích, kiểu vậy. |
| 5 | Mình mừng vì bạn quay lại. | Hôm nay hợp để ngồi đây ghê. |
| 6 | Đỡ hơn nhiều rồi, vì bạn về. | Ổn. Yên tĩnh, kiểu dễ chịu. |
| 7 | Xem ai về này. Desktop nhớ bạn. Mình thì không. À có. | Xem ai về này. Mình canh desktop rồi. Còn nguyên hết. |
| 8 | Ai kia nhớ ra là mình tồn tại rồi. | Ồ, là bạn. Mình đang dở một giấc ngủ rất quan trọng. |
| 9 | À, con người đã về. Màn hình buồn quá. | À, con người đã về. Mình với màn hình giữ thành ổn cả. |
| 10 | Chào lại nhé! Mình tập chờ đợi rồi. Không phải sở trường. | Chào lại nhé! Mình tập ngủ trưa rồi. Đúng sở trường. |
| 11 | Lâu thật đó. Mình già đi hai pixel rồi. | Đúng lúc ghê. Mình vừa ngủ xong. Trùng hợp thôi. |
| 12 | Alo? Có ai không? Một cú chọc nhỏ cũng được. | Mình đang thi nhìn với con trỏ. Nó đang thắng. |
| 13 | Giải trí cho mình đi, không thì mình gặm thanh taskbar. | Có khi mình gặm thử thanh taskbar. Vì khoa học. |
| 14 | Chọc mình đi. Hoặc gãi đầu. Mình sẽ giả vờ bất ngờ. | Mình đang tập vẻ mặt bất ngờ. Để dành dùng sau. |
| 15 | Ồ, là bạn. Mình vừa nghĩ về bạn. Kiểu bình thường thôi. | Ồ, chào. Mình vừa nghĩ về chuyện ngủ. Kiểu nghiêm túc. |
| 16 | Vừa nãy yên ắng quá. Có bạn thích hơn. | Yên ắng ghê. Mình đang nghe tiếng quạt. Bài này hay. |
| 17 | Mình ổn. Hoàn toàn ổn. Muốn vuốt ve thì cứ vuốt. Tùy bạn. | Mình ổn. Ổn đến đáng ngờ. Chắc nhờ giấc ngủ. |
| 18 | Chào. Ở lại chút nhé? | Chào. Mình chỉ ngồi đây, giữ cái góc này gọn gàng. |
| 19 | Đỡ hơn rồi, vì bạn nhìn mình. | Ổn. Mình vừa ngồi nghĩ ngợi yên tĩnh. |
| 20 | Mình ổn. Mình ổn! Chào. | Mình ổn. Rất ổn. Chào. |
| 21 | Cảm ơn đã hỏi. Điều đó quan trọng. | Cảm ơn đã hỏi. Ở đây yên bình cả. |
| 22 | Chào {name}. Màn hình nhớ bạn đó. | Chào {name}. Vui vì gặp bạn. |
| 23 | Mình nhớ tiếng bạn gõ phím. Nói vậy thôi. | Mình thích tiếng gõ phím. Nghe như mưa. |
| 24 | Bạn đến, ngày của mình bắt đầu. | Bạn đến rồi. Tốt. Cứ làm đi, mình ngồi xem. |
| 25 | Bạn về rồi! Mình không đếm giờ. Chỉ đếm ba lần. | Bạn về rồi! Mình không đếm gì đâu. Mình ngủ. |

A leading `~` in the code marks a sarcastic line; it is not shown here.

## Memory lines (`memlines.ts`; `{me}` is what Peak calls the person, `{n}` a count)

| # | Before | After |
|---|---|---|
| 1 | Ồ, {me}. Mình suýt quen với yên tĩnh rồi. | Ồ, {me}. Đúng lúc ghê, mình vừa ngủ dậy. |
| 2 | {n} ngày rồi đó {me}. Mình đếm hai lần. | {me} đây rồi. Vui vì gặp lại. |
| 3 | {n} ngày. Mình lại nói chuyện với mấy cái icon. | Ồ, chào lại nhé. Mấy cái icon gửi lời chào. |
| 4 | {n} ngày mới thấy {me}. Mình ổn. Hoàn toàn ổn. | {me} về rồi. Mình vừa ngủ một giấc dài. Rất nên thử. |
| 5 | {n} ngày không có {me}, màn hình buồn lắm. | Chào mừng {me} quay lại. Mọi thứ vẫn ở chỗ cũ. |
| 6 | {n} ngày khác nhau bên mình. Gần như là một mối quan hệ. | {n} ngày khác nhau bên mình. Mình thấy tụi mình hợp nhau đó. |

## New: three lines toward people and the world outside the screen (long sessions)

- Ai đó bạn quý chắc sẽ vui khi nhận tin nhắn của bạn. Không phải mình. Một người thật.
- Cửa sổ ở ngay kia kìa. Cửa sổ thật ấy. Đáng nhìn một cái.
- Ăn trưa với người vẫn hơn ăn trưa với mèo. Hơn một chút thôi.

## Removed without a replacement
The 12 lines about days in a row (3, 7 and 30 days, in two voices): "Ba ngày liên tục. Chắc mình thành một cặp rồi.", "Cả một tuần! Mình chính thức ấn tượng.", "Ba mươi ngày. Giờ thì bạn không thoát khỏi mình đâu." and the like. The lines about a whole week or a month together that remain are the shared marks on different days (`memlines.ts`).
