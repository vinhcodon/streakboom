---
title: Bàn giao cho Claude Code — rà soát toàn bộ theo Foundation, hướng tới v0.4.0
status: handoff (chưa nhận)
date: 2026-11-11
from: cuộc trao đổi trong Claude chat (Vinh và Claude)
---

# Bàn giao: rà soát toàn diện theo Foundation, hướng tới 0.4.0

Theo quy tắc của `handoff/README.md`: đây là một đầu vào, không phải nguồn sự thật. Sau khi nhận, đừng sửa file này; ghi kết quả vào chỉ mục, ADR, giả thuyết hoặc spec.

## 1. Chuyện gì thay đổi

Vinh vừa hoàn tất một nghiên cứu khoa học nền tảng (`docs/foundation/`, hai ngôn ngữ). Kết luận chính:
- Bằng chứng cho lợi ích tâm lý của thú ảo gần như không có; bằng chứng cho thú thật yếu và không nhất quán. Không được hứa "chữa lành".
- Rủi ro lớn nhất là nhân vật "có nhu cầu" (đói, buồn, trách móc, streak gãy, níu kéo khi tạm biệt).
- Điều khoản Gemini API cấm ứng dụng có khả năng được người dưới 18 truy cập → phạm vi **18+** (ADR-0056).
- Sứ mệnh mới, không tuyên bố sức khỏe (ADR-0057).

Vinh muốn: coi Foundation là cơ sở bằng chứng từ nay (ADR-0058), rà lại toàn bộ chiến lược, giả thuyết, roadmap, quyết định, backlog, sau đó phát triển tiếp từ đây; bản phát hành lớn tiếp theo (sau 0.3.2) dự kiến là **0.4.0**.

## 2. Hệ thống docs đã có (đừng làm lại)

Repo đã theo nguyên tắc "mỗi loại phát biểu có một nhà" (`docs/README.md`): charter, decisions (55 ADR), hypotheses, plans, handoff, engineering-log, verification-debt, CHANGELOG, `scripts/audit-docs.mjs`. Việc cần làm là **thêm một nhà cho bằng chứng** và **căn chỉnh**, không tái cấu trúc cả cây.

Việc đã làm trong bàn giao này (chỉ thêm file mới, chưa sửa file cũ, chưa commit):
- `docs/foundation/` : README, hai bản nghiên cứu, `charter-alignment.md` (nháp), `legal-questions.md`.
- `docs/decisions/0056`, `0057`, `0058` (ADR theo mẫu của repo).
- `docs/handoff/` : file này và `claude-code-prompt.md`.

## 3. Việc cần làm, theo cổng (dừng ở mỗi cổng để Vinh duyệt)

### Pha 0 — Nhận và hòa nhập (nhỏ, rủi ro thấp)
Commit các file mới bằng đường dẫn rõ ràng (ADR-0023). Cập nhật các chỉ mục: thêm hàng "Evidence | foundation/" vào `docs/README.md`; thêm ba hàng 0056–0058 vào `docs/decisions/README.md`; thêm hàng cho handoff này vào `docs/handoff/README.md`. Chạy `node scripts/audit-docs.mjs` và sửa nếu nó phàn nàn.

### Pha 1 — Rà soát → `docs/handoff/2026-11-review.md` (hoặc đặt nơi hợp lý hơn nếu bạn thấy)
Ma trận đối chiếu mọi tài liệu và tính năng với: charter, 11 quy tắc (`foundation/charter-alignment.md`, hãy kiểm chứng từng dòng vì mình mới đọc charter và ADR-0013/0022/0055), sứ mệnh, 18+, danh sách tuyên bố cấm. Các điểm đã biết cần xử lý:
- **Xung đột:** ADR-0013 và charter điều 7 cho phép "neglect makes it a little lonely"; Foundation nói vắng mặt không có cái giá cảm xúc nào.
- **Tên "streak":** `active_d3`/`active_d7` trong telemetry; kiểm tra có chỗ nào hiển thị streak hay reset không.
- **Căng thẳng:** Foundation muốn người dùng tự đặt lịch thông báo; charter cấm setting về "lượng" hành vi. Quyết bằng ADR.
- **Tuyên bố công khai:** README, website (kể cả nội dung tiếng Anh/Việt/Nhật), sticker, store listing.
- **Mới hoàn toàn:** cổng tuổi 18+, an toàn khủng hoảng (quy tắc 11), tạm biệt sạch có test (quy tắc 3), gợi ý hướng ra ngoài (quy tắc 7).
- **Cũ:** `docs/plans/roadmap.md` ("from 0.1.14 to a closed alpha") và `requirements-draft-v0.4.md` (D1–D7, D5 nhắm dân văn phòng tiếng Anh toàn cầu, Q1 về Zalo, E4 gói miễn phí Gemini) cần hòa với Foundation.
- Với backlog (~50 KB), verification-debt (~55 KB), engineering-log (~170 KB): chỉ rà các hạng mục chạm quy tắc, không viết lại lịch sử.
Với mỗi chỗ lệch: mức độ (chặn / sửa / ghi nhận), đề xuất, công sức. Đánh dấu giả thuyết cũ nào bị bằng chứng làm yếu.
**Cổng 1: Vinh duyệt ma trận.**

### Pha 2 — Gom nhóm tài liệu (đề xuất tối thiểu, chờ duyệt)
Vinh muốn cấu trúc gọn hơn. Gợi ý, bạn được điều chỉnh sau khi thấy repo:
- Giữ `decisions/`, `hypotheses/`, `handoff/`, `charter.md`.
- Gom `docs/plans/` thành nhóm: `plans/stickers/` (sticker-*, `assets/`), `plans/website/` (website-seo-geo), `plans/releases/` (release-*), phần còn lại giữ nguyên; kế hoạch xong thì đánh dấu done.
- Bản nháp requirements v0.4: giữ nguyên (handoff không sửa), ghi trong chỉ mục điều gì đã thành spec/ADR.
- Thêm `foundation/evidence/` khi có nghiên cứu mở rộng.
Dùng `git mv`, sửa mọi liên kết tương đối, chạy audit-docs. Không xóa tài liệu; cái bị thay thế đánh dấu superseded trong chỉ mục.
**Cổng 2: Vinh duyệt trước khi di chuyển file.**

### Pha 3 — Spec và kế hoạch 0.4.0 → `spec/07-…` hoặc số tiếp theo trong `spec/`, và `docs/plans/release-0.4.0.md`
Phản biện kích thước. Khung gợi ý "Căn chỉnh Foundation":
| Nhóm | Hạng mục | Quy tắc |
|---|---|---|
| Hành vi | Gỡ mọi biểu hiện cô đơn/đói/buồn khi vắng; không "nhớ bạn"; không streak/reset | 1, 2 |
| Thoát phiên | Một câu chào rồi dừng; test tự động | 3 |
| Ngoại vi | Giữ nguyên các bảo đảm hiện có; kiểm tra reduced-motion của OS | 4 |
| Thông báo/thưởng | Rà tần suất lời tự nói; không gắn thưởng với tần suất mở app | 5, 6 |
| Hướng ra ngoài | Một nhóm lời nhẹ nhàng (nghỉ, đứng dậy, nhắn một người bạn) | 7 |
| Chat/voice | Giữ chat share; voice chỉ khi qua cổng pháp lý | 8, 11 |
| Dữ liệu | Rà telemetry (đã opt-in), đường xóa dữ liệu | 9 |
| Tuyên bố | Rà README/site/sticker/Privacy theo bảng Nên/Không nên nói | 10 |
| Tuổi | Cổng tuổi 18+ | ADR-0056 |
| An toàn | Phát hiện tín hiệu khủng hoảng, chuyển đường dây đúng quốc gia | 11 |
Tính năng mới (voice, bán hàng, proxy) chỉ vào sau cổng của chúng. Nếu 0.4.0 quá lớn, đề xuất 0.4.0/0.4.1.
**Cổng 3: Vinh duyệt spec.**

### Pha 4 — Thực thi
Theo spec và README của docs (ADR-0033: mỗi bản phát hành làm cùng một bộ việc nhà). Mỗi quy tắc kiểm tra được thì có test.

## 4. Phản biện cần cân nhắc (không phải mệnh lệnh)

1. **"Nguồn sự thật" chỉ nên áp dụng cho nguyên tắc.** Phần lớn nguồn của nghiên cứu mới đọc ở mức tóm tắt. Đừng biến một con số thành yêu cầu sản phẩm; xác minh trước khi dựa vào.
2. **Hai bộ quy tắc là rủi ro.** Charter đã có; `charter-alignment.md` chỉ là cầu nối. Kết quả cuối phải là charter được sửa bằng ADR, không phải thêm file quy tắc song song.
3. **Bond Days là giả thuyết.** Không có nghiên cứu trực tiếp về đếm tích lũy không reset; theo dõi rào chắn từ đầu. Tên "Bond" cũng đáng soi dưới góc nhìn gắn bó quá mức.
4. **Product Hunt và lộ trình 90 ngày.** Nghiên cứu đặt Product Hunt sau cổng 90 ngày; bản nháp v0.4 coi PH là kênh chính, ưu tiên sớm. Cần Vinh quyết, ghi thành ADR.
5. **18+ và BYOK.** App dùng key của người dùng (ADR-0001), nên bên chịu điều khoản Gemini có thể là người dùng. Câu hỏi mở cho luật sư; đừng viết lên website rằng app "an toàn" hay "chỉ dành cho người lớn" như cam kết cho tới khi biết mức cổng tuổi.
6. **Cỡ mẫu.** Thử nghiệm cần ~100 người mỗi nhánh; hiện baseline chỉ n=1. Báo cáo mô tả, không nhân quả.
7. **Hướng "mọi lứa tuổi" hẹp lại** thành mọi lứa tuổi người lớn.
8. **Lời nhắc tự phản biện:** nếu Foundation sai hoặc thiếu so với thực tế repo hay bằng chứng mới, nói thẳng và hỏi Vinh.

## 5. Ràng buộc làm việc
- Nhánh riêng, ví dụ `foundation/alignment`; commit nhỏ, đường dẫn rõ ràng (ADR-0023). Không đẩy `main` khi chưa được duyệt.
- Pha 0–2 không đổi hành vi app. Code chỉ sau Cổng 3, và chỉ theo từng hạng mục Vinh duyệt (bản nháp v0.4 cũng yêu cầu vậy).
- Tài liệu nội bộ theo ngôn ngữ đang dùng trong thư mục đó; README công khai và store listing dùng tiếng Anh.
- Mỗi lần dừng: tóm tắt tối đa 10 dòng và nêu câu cần Vinh quyết. Nói rõ điều gì **chưa kiểm chứng**.
