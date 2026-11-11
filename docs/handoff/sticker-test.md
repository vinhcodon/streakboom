# Handoff: Thử nghiệm sticker chat (Zalo) cho Streakboom

> Tài liệu handoff cho Claude Code, dùng để viết spec và plan. **Không sửa code app.** Đây là thử nghiệm marketing/brand ngoài app, chỉ cần liên kết với spec/06 (character) và spec/05 (north star).
> Trạng thái: bản nháp v0.1, 2026-11-10. Người quyết định: Vinh.

## 1. Quyết định đã chốt

| Mục | Quyết định |
|---|---|
| Mục tiêu chính | Kéo người dùng mới (acquisition). Không đặt mục tiêu doanh thu trực tiếp. |
| Nền tảng thử đầu tiên | Zalo. Telegram là dự phòng. LINE chỉ xét sau, khi xác nhận PayPal dùng được ở Việt Nam. WhatsApp/iMessage tạm bỏ (cần đóng gói thành app, iMessage cần Apple Developer 99 USD/năm). |
| Nhân vật | Chú mèo mochi của Streakboom (người dùng nhắc là "Peak"; xác nhận là chú mèo, cần chốt tên chính thức, xem câu hỏi mở). |
| Nguồn lực | Tự làm, có AI hỗ trợ. Chi phí gần 0. |

## 2. Giả thuyết cần kiểm chứng

- H1: Sticker mèo có biểu cảm đặc trưng của Streakboom, phát miễn phí trên Zalo, đem lại lượt cài app mà không tốn tiền quảng cáo.
- H2: Người cài từ sticker có chất lượng không thấp hơn nhóm thường (đo bằng Bond Days, xem spec/05).
- H3 (phụ): Việc vẽ sticker buộc chốt rõ tính cách mèo, nên có tác dụng như kiểm tra character bible.

Giả thuyết **không** kiểm chứng ở giai đoạn này: bán sticker, bán phụ kiện, merchandise.

## 3. Phạm vi bộ sticker v0

- 8–12 sticker tĩnh, PNG nền trong suốt, cùng một con mèo.
- Biểu cảm lấy từ hành vi thật của mèo trong app, không dùng ý tưởng mèo chung chung:
  1. chào buổi sáng
  2. cọ đầu / được gãi đầu
  3. đòi gãi bụng
  4. ngủ gật
  5. lườm khi bị chọc
  6. "to quá em không làm được" (từ chối việc quá sức; câu chữ cần Vinh chốt, xem spec/06)
  7. ăn mừng streak
  8. nhắc nhẹ / rủ làm việc
  9–12 (tùy chọn): mưa/đêm, đói, xin lỗi, cảm ơn.
- Quy tắc nhất quán nhân vật: một bản mẫu mặt mèo (character sheet) làm chuẩn. Mọi sticker sinh bằng AI phải so lại với bản mẫu. Loại ảnh lệch tỷ lệ mặt, màu lông, kiểu mắt.
- Tên bộ sticker và tên tác giả có chữ Streakboom (Zalo ghi tên tác giả trên bộ sticker).
- Không có nội dung có bản quyền bên thứ ba, không nhái nhân vật có sẵn.

## 4. Kỹ thuật nộp (cần xác minh lại trên trang đăng ký)

- Đăng ký tại cổng sticker của Zalo (stickers.zaloapp.com/register theo các bài hướng dẫn; xác nhận lại URL hiện hành).
- Các bài hướng dẫn ghi: ZIP dưới 20 MB, ảnh đại diện JPG/PNG dưới 1 MB, PNG nền trong suốt. Số liệu chính xác (kích thước từng sticker) phải đọc lại ở trang đăng ký.
- Zalo duyệt nghệ thuật và nội dung rồi liên hệ lại tác giả. Thời gian duyệt chưa biết.

## 5. Điều cần xác minh trước khi đầu tư thêm

1. Zalo có cho tác giả xem số lượt tải bộ sticker không?
2. Mô tả bộ sticker có cho phép link ngoài / tên app không?
3. Điều khoản doanh thu của Zalo (bán sticker có không, chia sẻ thế nào). Nguồn công khai tôi tìm được không nêu rõ.
4. Việt Nam có dùng được PayPal để vào LINE Creators Market không (điều kiện của LINE).

Nếu (1) hoặc (2) là "không": chuyển sang phát qua cộng đồng (gửi cho người dùng alpha, fanpage, nhóm) và đo bằng link rút gọn trên trang tải.

## 6. Kế hoạch đo

Đặt ngưỡng **trước** khi chạy. Các số dưới đây là ước đoán, Vinh chỉnh theo thực tế.

| Chỉ số | Cách đo | Ngưỡng thử |
|---|---|---|
| Bộ sticker được duyệt | Phản hồi Zalo | Có trong 2–3 tuần |
| Lượt tải sticker | Số liệu cổng tác giả (nếu có) | Ghi nhận, chưa đặt ngưỡng |
| Lượt cài từ sticker | Link rút gọn riêng + trang tải | Vài chục lượt sau 4–6 tuần |
| Chất lượng người dùng | Bond Days nhóm cài từ sticker vs nhóm khác | Bằng hoặc cao hơn |

Quy tắc dừng: nếu sau 4–6 tuần dưới ngưỡng, dừng. Chi phí thất bại chỉ là vài ngày vẽ.

Lưu ý ràng buộc telemetry: telemetry hiện chỉ opt-in và chỉ đếm số. Nguồn cài (từ sticker) phải đo ngoài app (link rút gọn / trang tải), **không** thêm theo dõi cá nhân vào app.

## 7. Câu hỏi mở (cần Vinh)

1. Tên chính thức của chú mèo (dùng làm tên bộ sticker): "Peak" hay tên khác?
2. Câu chữ cho sticker "to quá em không làm được".
3. Tỷ lệ giọng châm biếm trong lời thoại sticker (hiện ước tính khoảng 14% trong character bible).
4. Có muốn sticker động (animated) ở giai đoạn sau không? Rig hiện chỉ có góc nhìn trước và ngang.
5. Có chấp nhận nền tảng không cung cấp số liệu tải không?

## 8. Sản phẩm bàn giao mong muốn từ Claude Code

- Thêm phần "Sticker & biểu cảm" vào `spec/06-character-and-movement.md`: danh sách biểu cảm khớp với animation/state của mèo trong app, để dùng chung asset khi có thể.
- Một plan ngắn cho thử nghiệm: việc, thứ tự, người làm, mốc xác minh ở mục 5, ngưỡng dừng ở mục 6.
- Không thay đổi code app trừ khi spec/06 yêu cầu riêng và Vinh duyệt.

## 9. Bối cảnh và nguồn tham khảo

- Kinh tế trực tiếp của sticker thấp và tập trung ở top. Dữ liệu LINE là số cũ (2014–2015), thị trường chính Nhật/Đài Loan/Thái Lan. Trang trợ giúp LINE hiện tại ghi creator nhận 50% của (doanh thu trừ phí nền tảng) cho bộ nộp từ 1/2/2015; TechCrunch năm 2015 từng đưa mức 35%, cần kiểm tra điều khoản mới.
- Giá trị brand đến từ việc nhân vật có sợi dây cảm xúc trước. LINE Friends gắn người dùng bằng phim ngắn; sticker "mặt vàng" của Weixin không có liên kết đó nên không thành brand.
- Pusheen được ước tính đã gửi hơn 20 tỷ lần trên các nền tảng.
- Nguồn: LINE Creators help (Money transfers), TechCrunch (2015, 2016), The Standard (Cashing in on stickers), Pusheen About, Viettimes (Zalo mở kho sticker).
