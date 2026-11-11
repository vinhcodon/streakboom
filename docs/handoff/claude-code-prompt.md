# Prompt để dán vào Claude Code

Mở Claude Code tại thư mục gốc repo streakboom (D:\Claude\projects\streakboom), rồi dán nguyên khối dưới đây.

---

Hãy nhận một bàn giao từ cuộc trao đổi của mình với Claude trong chat. Đọc theo thứ tự: `docs/handoff/2026-11-11-foundation-handoff.md`, `docs/README.md`, `docs/charter.md`, `docs/decisions/0056`–`0058`, `docs/foundation/README.md`, `docs/foundation/charter-alignment.md`, `docs/foundation/legal-questions.md`, rồi lướt `docs/foundation/streakboom-foundation.vi.md` khi cần chi tiết bằng chứng. Đọc thêm `docs/handoff/requirements-draft-v0.4.md` (kế hoạch trước đó cần hòa với việc này).

Bối cảnh: Foundation (nghiên cứu khoa học) giờ là nhà của bằng chứng; phạm vi sản phẩm là 18+; sứ mệnh không tuyên bố chữa lành. Mình muốn rà soát toàn bộ chiến lược, giả thuyết, roadmap, quyết định và backlog theo Foundation, rồi phát triển tiếp từ đây, hướng tới bản 0.4.0 sau 0.3.2. Mình tin dự án này có ý nghĩa, nhưng mình cần bạn phản biện thẳng, nhất là chỗ Foundation có thể sai, thiếu hoặc mâu thuẫn với repo.

Làm đúng thứ tự, dừng ở mỗi cổng để mình duyệt:
0. Commit các file mới của bàn giao (đường dẫn rõ ràng, ADR-0023) trên nhánh `foundation/alignment`; cập nhật ba chỉ mục (docs/README.md, decisions/README.md, handoff/README.md); chạy `node scripts/audit-docs.mjs`.
1. Viết báo cáo rà soát (ma trận đối chiếu mọi tài liệu và tính năng với charter, 11 quy tắc, sứ mệnh, 18+, tuyên bố cấm). Kiểm chứng từng dòng của charter-alignment.md. Dừng.
2. Đề xuất cách gom nhóm tài liệu (tối thiểu, như trong bàn giao, bạn được điều chỉnh). Chỉ `git mv` sau khi mình đồng ý.
3. Viết spec và plan 0.4.0; nói nếu phạm vi quá lớn. Dừng.
4. Chỉ sau khi mình duyệt mới viết code, kèm test cho các quy tắc kiểm tra được.

Ràng buộc: pha 0–2 không đổi hành vi app; không đẩy lên main khi chưa được mình duyệt; mỗi lần dừng tóm tắt tối đa 10 dòng, nêu câu cần mình quyết và điều gì chưa kiểm chứng.

---
