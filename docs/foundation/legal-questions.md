---
title: Câu hỏi cần luật sư xác nhận
status: open
updated: 2026-11-11
---

# Câu hỏi cho luật sư (trước khi phát hành)

Nghiên cứu chỉ là thông tin. Phần lớn nguồn pháp lý chưa được đối chiếu với văn bản gốc; chỉ điều khoản Gemini API được mở trực tiếp. Mang file này cùng bản nghiên cứu khi gặp luật sư.

## Ưu tiên cao (chặn phát hành)

1. **Cổng tuổi 18+.** Với app desktop, tự khai tuổi có đủ không, hay cần xác minh? Điều khoản Gemini và UK Children's Code tính ứng dụng "có khả năng được người dưới 18 truy cập". Mức nào được coi là hợp lý?
2. **Chuyển dữ liệu xuyên biên giới (Việt Nam).** Gửi âm thanh/văn bản sang Gemini có cần hồ sơ đánh giá tác động theo Luật 91/2025/QH15 và Nghị định 356/2025 không? Hạn nộp 60 ngày tính từ khi nào?
3. **Tuyên bố sức khỏe.** Cách diễn đạt "làm ngày làm việc nhẹ hơn, bớt căng thẳng" có nằm trong ranh giới wellness chung (FDA, EU MDR) không? Trang Product Hunt và sticker có bị tính là tuyên bố không?
4. **Dữ liệu chat cảm xúc.** Có bị xếp là dữ liệu nhạy cảm (Việt Nam, GDPR Điều 9) không? Nếu không lưu nội dung và chỉ gửi qua API, nghĩa vụ là gì?

## Ưu tiên vừa

5. **Companion chatbot.** Peak có thuộc phạm vi California SB 243 và luật New York không, khi người dùng chủ yếu ngoài Mỹ? Nếu có người dưới 18 lọt qua cổng tuổi thì nghĩa vụ nào kích hoạt?
6. **EU AI Act Điều 50** (từ 2026-08-02): cách công bố "đây là AI" đủ cho avatar mèo và voice.
7. **Miễn trừ doanh nghiệp nhỏ/khởi nghiệp** ở Việt Nam: điều kiện mất miễn trừ khi xử lý dữ liệu nhạy cảm.
8. **Đồng ý nghiên cứu.** Telemetry opt-in và khảo sát (WHO-5, UCLA-3) có cần đồng ý riêng cho nghiên cứu, và có cần người duyệt đạo đức độc lập không?
9. **Bản quyền thang đo.** WHO-5 và BPNSFS cần xin phép khi dùng thương mại.

10. **BYOK và điều khoản Gemini.** Streakboom hiện chỉ cho người dùng dùng key của chính họ (ADR-0001). Khi đó bên ký điều khoản Gemini là người dùng, hay Streakboom cũng bị ràng buộc về độ tuổi và nội dung? Điều này đổi gì với phạm vi 18+ và với việc quảng bá voice chat?

## Tự kiểm tra trước khi gặp luật sư (không cần luật sư)

- Điều khoản gói miễn phí của Gemini về việc dùng dữ liệu để cải thiện sản phẩm: bản nháp requirements v0.4 (mục E4) đã ghi nhận rủi ro này nhưng chưa xác minh. Nếu gói miễn phí cho phép dùng nội dung để huấn luyện, nó mâu thuẫn quy tắc 9 và Privacy trong app phải nói rõ.
