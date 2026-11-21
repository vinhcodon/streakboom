# Handoff: duo Peak + Paws, bước tiếp theo (spike, đối chiếu, prototype) và quy tắc phối hợp nhiều model

Ngày: 2026-11-21. Người giao: Vinh. Soạn bởi Claude (chat).
Đầu vào: `docs/handoff/peak-paws-living-spec-v0.2.md` (bản brainstorm của ChatGPT, đã đối chiếu repo; đọc mục 14 trước), cùng `docs/plans/duo-charter-impact.md`, ADR-0068, 0125–0132.

## 0. Trạng thái đã biết (đã kiểm tra trong repo)
- ADR-0068 chỉ chống chạy trùng tiến trình, không cấm nhân vật thứ hai. README không ghi "một Peak một lúc".
- ADR-0129: bốn sticker duo đã lên như sticker thường, test của spec 19 không chạy; H33 chưa kiểm chứng; chó trong app chưa quyết.
- ADR-0127: tên Paws, Vinh chấp nhận rủi ro tên chung. ADR-0131: Paws vẽ theo phương án Mochi.
- `duo-charter-impact.md` đề xuất: chó tắt mặc định, không hoạt động khi Peak đang hoạt động. Spec v0.2 lại có cảnh đôi cùng diễn và lựa chọn "cả hai". Hai điều này mâu thuẫn, xem mục 4.

## 1. Ràng buộc
- Mọi thay đổi code nằm trên nhánh `exp/duo-prototype` trong git worktree riêng. Không merge vào main. Chỉ Vinh merge.
- Chỉ kênh Preview. Tính năng nằm sau một cờ, mặc định tắt. Người dùng Stable không bao giờ thấy.
- Stable và Preview dùng chung dữ liệu (AGENTS): chỉ thêm trường có giá trị mặc định, không đổi nghĩa trường cũ, không viết lại schema.
- Trước khi chạy bất kỳ bản prototype nào, sao lưu thư mục `C:\Users\Vinh\AppData\Roaming\com.streakboom.app` (copy sang chỗ khác) và ghi vào log.
- Không đổi câu chữ trên website hay README; chỉ liệt kê đề xuất.
- Hiến chương giữ nguyên: không trêu người dùng, không nhắc nghỉ hay làm việc, không đếm vắng mặt, không chat AI cho Paws, không sense mới.

## 2. Việc A: spike hiệu năng (làm trước, kết quả quyết định việc C)
So hai cách hiển thị hai pet: (1) một WebView/cửa sổ vẽ cả hai; (2) hai cửa sổ. Đo trên máy tham chiếu, cùng kịch bản (idle, một cảnh chạy, gesture): RAM, CPU, GPU, số tiến trình WebView, và hành vi hit-test/click-through/focus. Ghi cấu hình, build, chế độ nguồn. So với baseline Peak một mình và ngân sách alpha 120 MB (A1 trong `docs/hypotheses/README.md`, ADR-0005). Ghi: cách nào đạt hơn, cách nào cần tách state, và rủi ro. Kết quả vào `docs/plans/duo-render-spike.md`. Chưa đưa kết luận "nên làm duo" ở đây.

## 3. Việc B: đối chiếu và liệt kê chỗ lệch (chỉ ghi, không sửa nội dung công khai)
- Kích thước lưới ảnh màn hình: ADR-0128 (192×108), `picture.rs` (GRID_W=192, GRID_H_MAX=216), ADR-0121 (384×216). Xác định con số thật và tài liệu nào sai.
- Lời hứa riêng tư: nhiều tài liệu, website, README ghi hoặc ngụ ý "không đọc màn hình". Có tính năng ảnh màn hình (Preview, mặc định tắt). Liệt kê mọi chỗ trong repo nói câu tuyệt đối, đối chiếu với điều 4 hiến chương ("hình dạng, không phải ý nghĩa") và ADR-0119/0121/0128, đề xuất câu chữ chính xác. Chỉ đề xuất; website session và Vinh quyết.
- Kiểm tra các tham chiếu trong mục 14 của spec v0.2 (tên file, số ADR, trích dẫn code) xem có đúng không; ghi chỗ sai hoặc không kiểm tra được.
- Kết quả vào `docs/plans/duo-reconciliation.md`.

## 4. Câu hỏi cần Vinh quyết trước khi làm việc C
Claude Code hỏi Vinh nếu chưa có câu trả lời:
1. Chó có được hoạt động cùng lúc Peak không? (`duo-charter-impact` nói không; spec v0.2 có cảnh đôi). Nếu có, điều 2 hiến chương cần mức bảo vệ nào?
2. D-02 "người dùng chọn Peak/Paws/cả hai" có trái quyết định cũ "không đặt lựa chọn ngoại hình/tính cách trong Settings" không? Với prototype, bỏ picker, bật bằng cờ nhà phát triển.
3. "Quản gia" của Paws: chỉ là vai tự phong giữa hai con, không bao giờ nhắm vào người dùng. Đồng ý?

## 5. Việc C: prototype "hai pet sống cùng nhau" (mục 14.8 của spec v0.2)
Phạm vi tối thiểu: 2 pet, 1 đồ vật chung (quả bóng), 3 cảnh không lời, 1 thao tác can thiệp của người dùng.
- Ví dụ cảnh: Paws xếp bóng ngay ngắn; Peak lấy bóng kê đầu; Paws tìm vật khác kê cho Peak để lấy bóng lại. Cảnh thứ hai: Peak dịch ra, Paws không đuổi theo, vài giây sau Peak tự dịch lại. Cảnh thứ ba tự chọn nhưng phải có hậu quả giữa hành động và phản ứng.
- Một cảnh tối đa hai pet, không bubble ở prototype, hủy sạch khi người dùng tương tác hoặc ẩn (dùng scene token để callback cũ không làm pet đã ẩn xuất hiện lại).
- Tuân thủ ngân sách chú ý hiện có (attention.ts, reactions.ts); không nhân đôi quota. Tách kênh: chuyển động nền khác bubble khác thông báo.
- Tách state theo ID pet; không nhân đôi `+page.svelte`. Dùng cách hiển thị thắng ở việc A.
- Paws dùng hình Mochi theo ADR-0131 (`docs/plans/assets/paws/`).
- Điều cần học: "tôi có cảm giác hai đứa đang sống cùng nhau không, hay chỉ xem hai animation chạy cạnh nhau?" Kết quả dạng quay màn hình ngắn Vinh xem được, kèm ghi chú những gì thấy giả, gượng hay phiền.
- Test với đồng hồ giả cho quota và hủy cảnh; kiểm tra tay: gesture, focus, hai màn hình, reduced motion.

## 6. Quy tắc phối hợp nhiều model (Claude Code, Codex/ChatGPT)
- Một nguồn chỉ dẫn: nếu repo có AGENTS.md và CLAUDE.md, CLAUDE.md chỉ import AGENTS.md; không để hai bản chỉ dẫn lệch nhau.
- Vai bất đối xứng. Claude Code xây trên nhánh. Codex/ChatGPT chỉ đọc và phản biện (PR, diff, spec), không commit vào repo này. Chỉ chạy hai builder song song khi vùng file tách rời hẳn nhau.
- Số thứ tự ADR và spec do Claude Code cấp, lấy số kế tiếp từ repo lúc commit. Reviewer không tự đánh số.
- File nóng cần một chủ tại một thời điểm: `app/src/routes/+page.svelte`, `docs/plans/backlog.md`, `docs/plans/verification-debt.md`.
- Reviewer không coi lời của model khác là sự thật: mọi tham chiếu phải mở trong repo để kiểm tra. Người phân xử cuối là Vinh, dựa trên prototype xem được và test chạy được.
- Nhật ký: `docs/handoff/duo-review-log.md`, mỗi lượt ghi: ai, làm gì, kết quả, câu hỏi còn mở.

### Khung review gửi cho Codex/ChatGPT
Mỗi đề xuất theo đúng khung: bằng chứng ở repo (file, dòng) → điều muốn thay đổi → lợi ích dự đoán → chi phí → thử nhỏ nhất → điều kiện bác bỏ. Chỉ nêu điều mà repo ủng hộ hoặc bác bỏ được. Phân biệt: sự thật đã kiểm tra, suy luận, ý kiến. Không sửa file. Ba câu hỏi bắt buộc cho mỗi bản prototype: (1) có phạm điều nào của hiến chương không; (2) có thêm chi phí chú ý hay tài nguyên nào chưa đo; (3) hai pet có tương tác có nguyên nhân hay chỉ chạy cạnh nhau.

## 7. Đầu ra mong đợi
- `docs/plans/duo-render-spike.md`, `docs/plans/duo-reconciliation.md`
- Nhánh `exp/duo-prototype` (chưa merge), video hoặc mô tả cảnh, ghi chú học được
- Các câu hỏi mở cho Vinh; không tự quyết chuyện dùng duo trong app.
- Commit doc-only cho các file doc; nhánh code tách riêng, không push main.
