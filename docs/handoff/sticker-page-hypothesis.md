# Trang sticker Peak: giả thuyết và yêu cầu (handoff cho Claude Code)

Trạng thái: bản nháp v0.2 (đã chốt D5, D6 ngày 13/11/2026), cần session Claude Code viết spec và plan.
Phạm vi: trang sticker trên streakboom.com (web + mobile web). Không sửa code app desktop. Không có backend mới ngoài đếm sự kiện ẩn danh.

## 1. Quyết định đã có (từ Vinh)

- D1. Trang sticker là nơi người dùng chọn sticker Peak rồi **tự chia sẻ sang app chat của họ**. Bỏ phương án đăng ký sticker pack trên từng app (quá hạn chế).
- D2. Vinh sẽ liên tục thêm sticker theo chủ đề funny/lầy. Quy mô dự kiến: hàng nghìn sticker, nhiều ngôn ngữ.
- D3. Cần có: ô lọc nhanh theo tên/tag, tab HOT (top dùng).
- D4. Không tài khoản, không người dùng đóng góp nội dung.
- D5. App chat ưu tiên: **Zalo và Microsoft Teams**. Messenger, Telegram, WhatsApp là thứ yếu (test sau).
- D6. v0 **chỉ sticker tĩnh**. Chưa làm sticker động.
- Hệ quả của D5: Teams và Zalo dùng nhiều trên máy tính văn phòng, nên **đường desktop (copy PNG rồi dán, kéo-thả) là đường chính, mobile Web Share là đường song song**, không phải ngược lại. Thiết kế và test ưu tiên desktop trước.

## 2. Giả thuyết chính

H1. Nếu thời gian từ lúc vào trang đến lúc sticker nằm trong khung chat ≤ 2 chạm (mobile) / ≤ 2 click (desktop), tỷ lệ phiên có share sẽ cao hơn đáng kể so với luồng "tải về rồi gửi".
H2. Tìm theo ý định/cảm xúc/tình huống (kể cả gõ không dấu) hiệu quả hơn tìm theo tên sticker.
H3. Giọng Peak trên trang (toast, trạng thái trống, kệ theo giờ) tăng nhớ thương hiệu và lượt quay lại mà không làm chậm luồng chọn.
H4. Mỗi trang sticker/tag có thể là cổng vào từ tìm kiếm tự nhiên (cần giải quyết vấn đề lập chỉ mục trước, xem mục 8).
H5. Một lời mời tải app nhẹ, một lần, chuyển đổi được mà không gây khó chịu.

Chỉ số chính: **thời gian đến lượt copy/share đầu tiên** và **tỷ lệ phiên có ít nhất một lượt share**.

## 3. Cơ chế chia sẻ (đã tra cứu, kèm mức xác nhận)

Đã xác nhận qua tài liệu:
- Web Share API có file: phải kiểm tra `navigator.canShare({files})` trước khi `share()`, cần HTTPS và thao tác người dùng. Hỗ trợ theo web.dev: Chrome 128, Edge 93, Safari 14; Firefox sau cờ. Không hỗ trợ thì fallback tải file. Nguồn: web.dev/articles/files/share-files, web.dev/web-share.
- Async Clipboard ghi ảnh chủ yếu PNG (và SVG); các định dạng khác chưa hỗ trợ; ghi một ảnh mỗi lần. Safari hạn chế ghi clipboard trong callback bất đồng bộ: chuẩn bị blob trước hoặc truyền promise vào ClipboardItem. Nguồn: web.dev/articles/clipboard/copy-images, goo.gle/3DC0e7Y.
- Sticker động qua clipboard: mất chuyển động (PNG-only). Nguồn cũ về GIF cho thấy copy chỉ lấy frame hiện tại; cần test lại.
- Telegram: animated WebP gửi qua desktop/Android có thể thành ảnh tĩnh; WebP bị ép kích thước sticker. WhatsApp dùng .webp cho sticker và đang thử định dạng Lottie cho pack cao cấp. Nguồn: bugs.telegram.org/c/1621, c/4360/5.

Chưa xác minh (phải test tay, xem mục 9):
- Zalo (ưu tiên): cách xử lý ảnh PNG trong suốt khi dán/kéo-thả vào khung chat trên Zalo PC, Zalo Web, mobile: giữ nền trong suốt không, hiển thị cỡ nào, có thành ảnh thường thay vì sticker không.
- Microsoft Teams (ưu tiên): dán ảnh từ clipboard vào khung soạn tin, kéo-thả file, hiển thị trong chat và kênh (desktop, web, mobile). Chưa tra cứu gì về Teams.
- Messenger, Telegram, WhatsApp (thứ yếu): chưa xác minh phần chia sẻ ảnh tĩnh.
- Hành vi Web Share với file trên iOS Safari thực tế (kích thước, định dạng được nhận).

## 4. Luồng chia sẻ theo nền tảng

- Mobile: nút "Gửi" gọi Web Share với file PNG. Không hỗ trợ: tải file xuống + hướng dẫn một dòng.
- Desktop: click = copy PNG vào clipboard; toast giọng Peak báo đã copy. Phụ: kéo-thả, tải về.
- Sticker động: mặc định gắn nhãn "động"; nút chính là tải về/kéo-thả (GIF hoặc WebP/MP4 sau khi test). Không hứa copy giữ chuyển động.
- Mọi thao tác chia sẻ phải chạy trong sự kiện người dùng; blob phải sẵn sàng trước khi click (prefetch khi hover/hiển thị).

## 5. Duyệt và tìm kiếm

- R1. Ô tìm kiếm luôn hiển thị; lọc ngay khi gõ; chỉ mục tải sẵn phía client.
- R2. Chuẩn hóa dấu tiếng Việt (gõ "met roi" ra "mệt rồi"), chịu lỗi gõ (fuzzy).
- R3. Mỗi sticker có: tên theo từng ngôn ngữ, tag cảm xúc, tag tình huống, từ đồng nghĩa theo ngôn ngữ, mức "độ lầy" (hiền / lầy / lầy muốn tắt thở).
- R4. Tab: HOT (7 ngày), Mới, Cảm xúc/Tình huống (chip cuộn ngang), Của tôi (gần đây + yêu thích, lưu localStorage, không tài khoản).
- R5. Kệ theo thời điểm (sáng thứ Hai, 11:30 trưa, 16:30 thứ Sáu...), dùng giờ máy người dùng.
- R6. Bộ lọc "độ lầy".
- R7. (Ý tưởng, làm sau) ô "Nói đại đi, Peak tìm cho": nhập câu tự nhiên rồi khớp với tag; có thể dùng embedding khi đã có dữ liệu.

## 6. Quy mô và đa ngôn ngữ

- R8. Lưới ảo hóa; thumbnail WebP nhỏ; lazy load; PWA để mở lại nhanh.
- R9. Tách lớp hình Peak khỏi lớp caption; ghép chữ phía client (canvas) cho các ngôn ngữ phụ. Sticker chủ lực có thể đặt chữ thủ công. Cần kiểm tra chất lượng chữ khi xuất PNG.
- R10. Dữ liệu sticker là một nguồn duy nhất (JSON/Markdown) sinh ra cả chỉ mục tìm kiếm, trang tag và sitemap.
- R11. HOT dựa trên đếm lượt copy/share ẩn danh, chỉ đếm, không định danh. Phương án nhẹ nhất do Claude Code đề xuất (analytics sự kiện sẵn có hoặc endpoint đếm tối giản). Không tạo tài khoản.

## 7. Tinh thần Peak trên trang

- R12. Peak không bao giờ che lưới hay chặn thao tác. Nó ngồi một góc, nhìn theo con trỏ, phản ứng nhẹ.
- R13. Toast sau copy/share có nhiều câu, đổi theo sticker hoặc theo giờ.
- R14. Trạng thái trống/không tìm thấy có giọng Peak, đồng thời ghi lại cụm tìm không ra (để biết làm sticker nào tiếp).
- R15. Mỗi sticker có permalink và ảnh xem trước Open Graph; mỗi tag/chủ đề có trang riêng.
- R16. Lời mời tải app: một lần, nhẹ (ví dụ sau lần copy thứ 5), không popup chặn, có thể tắt vĩnh viễn.
- R17. Tôn trọng `prefers-reduced-motion`.

## 8. Phụ thuộc và rủi ro

- streakboom.com hiện chưa được Google lập chỉ mục. Chưa xác định nguyên nhân (cần trạng thái URL Inspection trong Search Console, robots.txt, sitemap.xml). H4 không kiểm chứng được trước khi giải quyết.
- Sticker động: có thể không dùng được trên một số app; không đầu tư nhiều trước khi có bảng test.
- Quyền sở hữu hình ảnh và nội dung: tất cả sticker do Vinh tạo/AI hỗ trợ; cần nhất quán nhân vật khi mở rộng hàng nghìn sticker.
- Trang sticker không được biến thành sản phẩm thứ hai: nếu sau này đưa sticker vào trong app, chạy qua bộ lọc 3 câu hỏi (trợ lý khác có làm được bằng prompt? có làm Peak gắn bó hơn? còn đáng yêu khi tắt AI?).

## 9. Việc cần xác minh (cho Claude Code / Vinh)

V1. Bảng test thật. Nhóm ưu tiên: Zalo và Microsoft Teams × Web/desktop app/Android/iOS × PNG tĩnh (nền trong suốt, có thể thêm biến thể nền trắng), cho các đường copy-dán, kéo-thả và share. Ghi kết quả từng ô (giữ nền trong suốt? kích thước hiển thị? kích thước tối ưu?). Nhóm thứ yếu: Messenger, Telegram, WhatsApp. Định dạng động (GIF/WebP) để sau, chưa thuộc v0.
V2. Web Share với file trên iOS Safari và Android Chrome: giới hạn kích thước/định dạng thực tế.
V3. Safari: mẫu ghi clipboard hợp lệ cho ảnh PNG sinh động (prefetch blob).
V4. Mã nguồn website nằm ở đâu (cùng repo streakboom hay repo riêng), công nghệ đang dùng, cách deploy.
V5. Cách ghép caption phía client cho tiếng Việt/ký tự phức tạp (font, kích thước, chất lượng xuất).
V6. Phương án đếm lượt cho HOT ít phụ thuộc nhất.
V7. Nguyên nhân chưa được lập chỉ mục (đối chiếu Search Console).

## 10. Phạm vi v0 đề xuất

Có: lưới PNG tĩnh, tìm theo tên/tag (không dấu), Web Share mobile, copy desktop, toast giọng Peak, tab Của tôi, permalink + Open Graph, đo thời gian đến lượt share đầu.
Chưa: sticker động, tab HOT, kệ theo giờ, ô "Nói đại đi", caption ghép phía client, lời mời tải app (thêm khi đã có dữ liệu sử dụng).

## 11. Chỉ số đo

- Thời gian từ vào trang đến copy/share đầu tiên.
- Tỷ lệ phiên có ít nhất một lượt share.
- Tỷ lệ tìm không ra kết quả và nội dung các lượt tìm đó.
- Tỷ lệ quay lại sau 7 ngày.
- Cơ cấu nền tảng/trình duyệt; tỷ lệ share thành công so với fallback tải về.
- Chuyển đổi sang tải app (và ngược lại: người dùng app có mở trang sticker không).

## 12. Câu hỏi còn mở cho Vinh

Đã trả lời (13/11/2026): Q1 = ưu tiên Zalo và Microsoft Teams (D5). Q2 = v0 chỉ sticker tĩnh (D6).
Q3. Ngôn ngữ ưu tiên sau tiếng Việt và tiếng Anh?
Q4. Website hiện nằm ở đâu và ai quản lý deploy?
Q5. Có muốn tách caption ghép phía client ngay v0, hay đặt chữ thủ công trước?

## 13. Sản phẩm mong đợi từ Claude Code

- `spec/09-sticker-page.md` (yêu cầu, luồng, mô hình dữ liệu sticker, chỉ mục tìm kiếm).
- Kế hoạch thực hiện theo giai đoạn (v0 → v1) và bảng test V1.
- Không sửa code app desktop. Mọi thay đổi trang web đi qua spec/plan và được Vinh duyệt trước.
