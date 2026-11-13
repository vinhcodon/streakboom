# Bảng test V1: gửi sticker Peak vào Zalo và Microsoft Teams (cho Vinh test tay)

**Từ:** phiên website (Claude) · **Cho:** Vinh · **Ngày:** 2026-11-13 · **Trạng thái:** bảng trống, chờ kết quả. Thuộc kế hoạch [`../plans/sticker-page-plan.md`](../plans/sticker-page-plan.md) (giai đoạn 0) và [`../../spec/13-sticker-page.md`](../../spec/13-sticker-page.md) mục 1.

**Quy tắc:** ô nào chưa thử thì để trống. **Không ghi "được" khi chưa thấy tận mắt**, và chụp màn hình cho mỗi ô (đặt tên như mục 4). Mọi hành vi của Zalo, Teams, iOS đều chưa biết cho tới khi bảng này có kết quả.

## 1. Chuẩn bị

1. **Ba sticker thử** (từ trang `https://streakboom.com/stickers/`, bản tiếng Việt cho Zalo, bản tiếng Anh cho Teams): **01 "Chào buổi sáng!"** (hình dài, chữ to), **09 "Sinh nhật vui vẻ!"** (chữ nhỏ hơn), **31 "Không nha"** (nhiều chi tiết). Dùng đúng số này ở mọi ô để so sánh được.
2. **Ba biến thể:**
   - **T** = ảnh gốc trong suốt 360 px (mặc định của trang, chép bằng cách bấm vào sticker).
   - **W** = cùng ảnh trên nền trắng vuông 360 px. Chưa có sẵn trên trang: tạo tay bằng Paint hoặc bất kỳ phần mềm nào (dán sticker lên khung trắng 360×360, lưu PNG, ví dụ `01-W.png`), rồi chép ảnh đó ra clipboard hoặc kéo-thả file/ảnh vào khung chat.
   - **S** = kích thước khác. Thêm `?px=NN` vào địa chỉ trang, ví dụ `https://streakboom.com/stickers/?px=240` rồi bấm sticker: ảnh chép ra có cạnh NN px (48 đến 360). Chỉ dùng để tìm cỡ vừa mắt ở cột "Kích thước tối ưu".
3. **Ghi lại phiên bản** của trình duyệt, Zalo, Teams, hệ điều hành (cột cuối). Nếu Zalo hoặc Teams ở chế độ nền tối, ghi rõ (mục 3).
4. **Cách làm mỗi route:**
   - **Dán (copy-dán):** bấm sticker trên trang (thấy dòng "Đã chép"), sang khung chat, **Ctrl+V** (điện thoại: giữ ô nhập rồi chọn Dán), gửi.
   - **Kéo-thả (chỉ máy tính/web):** kéo **chính hình** sticker trên trang thả vào cửa sổ chat, gửi.
   - **Chia sẻ (điện thoại):** bấm sticker, bấm **Chia sẻ** trong dòng xác nhận, chọn Zalo hoặc Teams trong bảng chia sẻ, gửi.
   - **Menu có sẵn của trình duyệt (dự phòng):** chuột phải vào hình, **Copy image** (điện thoại: giữ ngón tay vào hình, chọn Chia sẻ hoặc Lưu ảnh), rồi dán.
5. **Mỗi lần thử nhìn gì:** (a) có đến được khung chat không; (b) **nền** (trong suốt / trắng / đen / khác); (c) **cỡ hiển thị** so với sticker thật của app đó (ghi "to bất thường", "đúng cỡ", "nhỏ", hoặc đo bằng pixel trên ảnh chụp nếu được); (d) **độ nét** (rõ / hơi mờ / vỡ); (e) app hiển thị như **sticker hay như ảnh thường** (có khung, có bấm mở rộng, có tên file không); (f) **trong chat 1-1 và trong nhóm/kênh** có khác không.

## 2. Nhóm ưu tiên: Zalo

Điền: **Y** (được), **N** (không), **P** (một phần, ghi rõ ở ghi chú), để trống nếu chưa thử.

| Môi trường | Route | Biến thể | Đến được chat? | Nền | Cỡ hiển thị | Độ nét | Như sticker hay ảnh? | Cỡ tối ưu (px) | Ghi chú | Ngày / người / phiên bản |
|---|---|---|---|---|---|---|---|---|---|---|
| Zalo Web (chat.zalo.me) | Dán | T | | | | | | | | |
| Zalo Web | Dán | W | | | | | | | | |
| Zalo Web | Kéo-thả | T | | | | | | | | |
| Zalo Web | Kéo-thả | W | | | | | | | | |
| Zalo PC (app Windows) | Dán | T | | | | | | | | |
| Zalo PC | Dán | W | | | | | | | | |
| Zalo PC | Kéo-thả | T | | | | | | | | |
| Zalo PC | Kéo-thả | W | | | | | | | | |
| Zalo Android | Chia sẻ | T | | | | | | | | |
| Zalo Android | Chia sẻ | W | | | | | | | | |
| Zalo Android | Dán (sau khi chép) | T | | | | | | | | |
| Zalo iOS | Chia sẻ | T | | | | | | | | |
| Zalo iOS | Chia sẻ | W | | | | | | | | |
| Zalo iOS | Dán (sau khi chép) | T | | | | | | | | |

## 3. Nhóm ưu tiên: Microsoft Teams

Thêm hai điều chỉ có ở Teams: **chat 1-1 và kênh (channel)** có khác không; và **chủ đề tối** (Teams dark) có làm sticker khó đọc không (chữ đen trên nền trong suốt).

| Môi trường | Route | Biến thể | Đến được chat? | Nền (và trên chủ đề tối) | Cỡ hiển thị | Độ nét | Như ảnh nội tuyến hay như tệp đính kèm? | Cỡ tối ưu (px) | Ghi chú | Ngày / người / phiên bản |
|---|---|---|---|---|---|---|---|---|---|---|
| Teams Web | Dán | T | | | | | | | | |
| Teams Web | Dán | W | | | | | | | | |
| Teams Web | Kéo-thả | T | | | | | | | | |
| Teams Web | Kéo-thả | W | | | | | | | | |
| Teams desktop (Windows) | Dán | T | | | | | | | | |
| Teams desktop | Dán | W | | | | | | | | |
| Teams desktop | Kéo-thả | T | | | | | | | | |
| Teams desktop | Kéo-thả | W | | | | | | | | |
| Teams Android | Chia sẻ | T | | | | | | | | |
| Teams Android | Chia sẻ | W | | | | | | | | |
| Teams Android | Dán (sau khi chép) | T | | | | | | | | |
| Teams iOS | Chia sẻ | T | | | | | | | | |
| Teams iOS | Chia sẻ | W | | | | | | | | |
| Teams iOS | Dán (sau khi chép) | T | | | | | | | | |

Kênh so với chat 1-1 (chỉ cần một dòng cho mỗi môi trường đã thử):

| Môi trường | Route | Khác gì giữa kênh và chat 1-1? | Ghi chú |
|---|---|---|---|
| Teams desktop | Dán T | | |
| Teams Web | Dán T | | |

## 4. Nhóm thứ yếu (làm sau, ghi ngắn): Messenger, Telegram, WhatsApp

Chỉ biến thể **T**. Cột: đến được chat (Y/N/P), nền, cỡ hiển thị, nét, ghi chú.

| App | Môi trường | Route | Đến được chat? | Nền | Cỡ | Nét | Ghi chú | Ngày / người / phiên bản |
|---|---|---|---|---|---|---|---|---|
| Messenger | Web | Dán | | | | | | |
| Messenger | Web | Kéo-thả | | | | | | |
| Messenger | Android / iOS | Chia sẻ | | | | | | |
| Telegram | Desktop | Dán | | | | | | |
| Telegram | Desktop | Kéo-thả | | | | | | |
| Telegram | Android / iOS | Chia sẻ | | | | | | |
| WhatsApp | Web / Desktop | Dán | | | | | | |
| WhatsApp | Web / Desktop | Kéo-thả | | | | | | |
| WhatsApp | Android / iOS | Chia sẻ | | | | | | |

## 5. Chẩn đoán nền trắng (rất nên làm trước các ô trên)

Mục đích: biết nền trắng đến từ **clipboard của Windows**, từ **trình duyệt**, hay từ **app chat**. Chép sticker 01 (T) rồi dán vào từng nơi sau, ghi nền:

| Dán vào | Nền thấy được | Ghi chú |
|---|---|---|
| Paint (nền trắng) và Paint 3D hoặc ứng dụng có caro nền | | |
| Word hoặc PowerPoint | | |
| Telegram Desktop (nếu có) | | |
| Zalo PC | | |
| Teams desktop | | |

Nếu chỉ Zalo (hoặc Teams) cho nền trắng còn các nơi khác giữ trong suốt thì nền trắng là do app đó; nếu mọi nơi đều trắng thì do đường clipboard. Kết quả quyết định có cần biến thể W trên trang không (spec 13 mục 1.5).

## 6. Quy ước đặt tên ảnh chụp
`app-moitruong-route-bienthe-sticker.png`, ví dụ `zalo-pc-dan-T-01.png`, `teams-web-keotha-W-09.png` (không dấu trong tên file). Chưa có thư mục lưu quy định: chọn một thư mục ngoài repo hoặc nhờ phiên website thêm sau khi có kết quả.

## 7. Đã biết cho tới nay (không phải ô của bảng, không thay cho bảng)

- **Zalo, một thiết bị, chưa ghi là nền tảng nào** (Vinh báo 2026-11-12): dán/chia sẻ sticker **được**; ảnh **to bất thường** so với sticker của Zalo; **nền trắng**; với 180 px vẫn to, với 128 px **bé và chất lượng thấp** nên trang quay về ảnh gốc 360 px. Cần đưa vào bảng để biết ở môi trường nào.
- File gốc có nền **trong suốt** thật (RGBA, khoảng 60% điểm ảnh trong suốt) và ảnh trang đặt lên clipboard vẫn trong suốt (kiểm bằng trình duyệt, không phải bằng Zalo).
- Chưa biết gì về Teams, Messenger, Telegram, WhatsApp cho ảnh tĩnh.

## 7b. Tóm tắt của Vinh (2026-11-13)
Vinh đã **test nhanh** trên tất cả nền tảng của mình (Zalo và Teams: app máy tính, web, điện thoại) và thấy **ok**; Teams sẽ đưa vào dùng thật, có lỗi sẽ sửa sau. **Chưa có ô nào của bảng được điền**, nên "ok" cụ thể ra sao (nền, cỡ, kéo-thả, chủ đề tối, nền trắng) chưa được ghi lại và chưa được kiểm chứng ở đây. Bảng vẫn dùng được khi có lỗi cần khoanh vùng.

## 8. Sau khi điền
Gửi lại cho phiên website (hoặc báo "xong ô nào"). Phiên website sẽ cập nhật spec 13 mục 1 (luồng) và kế hoạch giai đoạn 0.4, và ghi các ô chưa thử vào `docs/plans/verification-debt.md`.
