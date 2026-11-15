# Giấy phép và tài sản thương hiệu của Peak (handoff cho Claude Code)

Trạng thái: bản nháp v0.1, 2026-11-15. Người quyết định: Vinh.
Đây không phải tư vấn pháp lý. Mọi văn bản cuối cùng cần Vinh duyệt, và nên cho luật sư xem một lần (mục 8).

## 1. Quyết định của Vinh

- Chọn **hướng B**: code mở (MIT), còn nhân vật Peak, tên và các tác phẩm hình ảnh thương hiệu có điều khoản riêng. Mục đích: giữ quyền làm merch (áo, phụ kiện) và sticker thương mại.
- Dự án **chưa có người dùng biết đến**, nên coi như công bố lần đầu; không cần chăm sóc người dùng cũ. Lưu ý kỹ thuật duy nhất: mọi commit và bản phát hành đã công khai dưới MIT thì ai đã tải vẫn dùng được theo MIT. Điều khoản mới chỉ có hiệu lực từ ngày công bố. Vinh chấp nhận điều này.

## 2. Hiện trạng (đã đọc từ repo trên máy Vinh)

- `LICENSE` là MIT thuần, "Copyright (c) 2026 Vinh Codon", áp cho toàn repo.
- `README.md` mục về nhân vật: Peak là nhân vật gốc; ba bản phác "mochi cat" do Claude đề xuất, Vinh chọn hướng; rig (tư thế, lò xo, code vẽ) viết cùng Claude; mèo được vẽ hoàn toàn bằng hình vector trong code (`app/src/lib/rig/`); mấy file ảnh (icon app, icon website, ảnh chia sẻ) sinh ra từ code; **"art được MIT cùng code"**.
- `CONTRIBUTING.md`: "The code and art are under the MIT license, and so are your contributions."
- `README.md`: "Free and open source. MIT licensed."
- `assets/peak-icon-1024.png` là file ảnh duy nhất trong `assets/`.
- Trong ba file trên không thấy chính sách nhãn hiệu cho tên "Peak" hay "Streakboom". Chưa kiểm tra `docs/decisions/` và `docs/charter.md`; hãy kiểm tra.
- Sticker chưa có trong repo.

## 3. Mâu thuẫn cần xử lý trước: SignPath

Repo đang chuẩn bị nộp đơn xin chứng chỉ ký số miễn phí của SignPath Foundation (xem `CODE_SIGNING.md`, README). Theo trang điều kiện của họ (signpath.org/terms), dự án phải dùng giấy phép nguồn mở được OSI chấp thuận, **không có cấp phép thương mại kép, cho mọi thành phần**. Nếu Peak (nhân vật vẽ bằng code, nằm trong bản cài) bị tách ra khỏi MIT với điều khoản "không dùng thương mại", có nguy cơ dự án không đủ điều kiện. Đây là suy đoán từ điều kiện công bố, chưa phải phán quyết của SignPath. Việc này cần xác minh trước khi sửa giấy phép.

## 4. Hai phương án của hướng B

| | B1: tách nhân vật khỏi MIT | B2: tương thích SignPath (đề xuất mặc định) |
|---|---|---|
| Code và hình Peak trong app (rig, icon) | Điều khoản riêng, hạn chế thương mại | Giữ MIT, như hiện nay |
| Tên "Peak", "Streakboom", logo | Chính sách nhãn hiệu | Chính sách nhãn hiệu (không cho dùng tên/logo cho sản phẩm khác, cho bản fork) |
| Sticker, thiết kế merch mới | Điều khoản riêng | Điều khoản riêng, tài sản **không nằm trong repo MIT** |
| Bảo vệ quyền làm merch | Mạnh hơn | Yếu hơn ở nhân vật cơ bản; mạnh ở tên, logo và thiết kế mới |
| Rủi ro với SignPath | Cao, cần SignPath xác nhận | Thấp |

Giải thích: B2 chấp nhận rằng ai đó có thể dựng lại mèo từ code MIT, nhưng họ không được gọi nó là Peak hay Streakboom, và không được dùng sticker và thiết kế merch chính thức. Với dự án chưa có người dùng, đây thường là điểm cân bằng thực tế. Claude Code đánh giá, Vinh quyết.

## 5. Yêu cầu

- **R1. Kiểm kê.** Liệt kê mọi thứ cấu thành "bản sắc Peak": file code vẽ nhân vật, bảng màu, ảnh sinh ra từ code, icon, ảnh chia sẻ, văn bản thương hiệu trên website, tên và cách dùng tên "Peak" và "Streakboom" trong repo và website. Với mỗi mục, ghi hiện đang thuộc giấy phép nào.
- **R2. Xác minh SignPath.** Đọc lại điều kiện hiện hành của SignPath Foundation, đối chiếu với B1 và B2, ghi rõ chỗ chắc chắn và chỗ phải hỏi họ. Không tự kết luận về việc họ sẽ chấp thuận.
- **R3. Chính sách nhãn hiệu (`TRADEMARK.md`).** Nêu tên, logo được bảo vệ; được phép: nhắc tên để mô tả, bài viết, review, bản fork đã đổi tên; không được: dùng tên/logo cho sản phẩm khác hay thương mại, gây hiểu lầm là chính thức. Giọng ngắn, dễ hiểu, tiếng Anh và tiếng Việt.
- **R4. Điều khoản sticker và merch (`ASSETS.md` hoặc trang riêng trên website).** Điều cho phép: dùng và chia sẻ sticker trong chat, mạng xã hội, bài viết có ghi nguồn; không cho phép: in lên sản phẩm, bán, đưa vào gói sticker hay kho nội dung khác, huấn luyện mô hình (nếu Vinh muốn). Đề xuất cách gắn điều khoản vào trang sticker (một dòng ở chân trang, link tới văn bản đầy đủ). Đặt sticker ở nơi không bị `LICENSE` MIT của repo bao phủ (thư mục có `LICENSE` riêng, hoặc kho riêng).
- **R5. Đồng bộ văn bản hiện có.** Sửa README ("Free and open source. MIT licensed." và đoạn về art), CONTRIBUTING (câu "code and art are under MIT"), chân trang website. Quy tắc đóng góp: chưa nhận đóng góp hình ảnh cho nhân vật nếu chưa có thỏa thuận riêng.
- **R6. Ghi chú nguồn gốc sáng tạo.** Một tài liệu ngắn mô tả đúng quy trình tạo Peak: Claude đề xuất bản phác, Vinh chọn hướng và chỉnh, code được viết cùng Claude. Mục đích: cho luật sư xem để đánh giá mức bảo hộ bản quyền (với phần do AI tạo, mức bảo hộ khác nhau theo nước). Không tự suy diễn về mặt pháp lý.
- **R7. Ngày hiệu lực.** Ghi trong tài liệu: điều khoản mới áp dụng từ ngày công bố; bản trước đó vẫn là MIT.
- **R8. Quyết định kiến trúc.** Ghi thành một ADR trong `docs/decisions/` theo quy ước hiện có, kèm lý do và phương án đã cân nhắc.

## 6. Ràng buộc

- Chỉ viết tài liệu. Không sửa code app, không sửa nội dung file `LICENSE` của phần code (MIT). Thay đổi văn bản README, CONTRIBUTING và website cần Vinh duyệt từng cái trước khi commit.
- Không tuyên bố điều gì về luật nhãn hiệu hay bản quyền như thể là chắc chắn. Ghi rõ "cần luật sư xác nhận".
- Giữ nguyên các lời hứa riêng tư và hiến chương.

## 7. Câu hỏi mở cho Vinh

- Q1. B1 hay B2? (Mặc định đề xuất: B2, nếu SignPath quan trọng với bạn.)
- Q2. Có nộp đơn SignPath ngay không, hay tạm hoãn đến khi xong phần giấy phép?
- Q3. Sticker nằm trong kho riêng, hay thư mục có `LICENSE` riêng trong repo?
- Q4. Cho phép fan art và sticker do người dùng tự làm từ Peak ở mức nào (có thương mại không)?
- Q5. Với các bản fork: bắt buộc đổi tên nếu sửa nhân vật, hay chỉ khi phân phối?

## 8. Câu hỏi cho luật sư (một buổi ngắn)

- Mức bảo hộ bản quyền cho nhân vật được tạo với sự hỗ trợ của AI ở Việt Nam và các thị trường mục tiêu.
- Khả năng và thủ tục đăng ký nhãn hiệu cho "Streakboom" và "Peak" (Peak là từ thông dụng), cho nhóm hàng phần mềm, sticker và hàng hóa.
- Cách soạn điều khoản sticker và chính sách nhãn hiệu cho đúng với hướng đã chọn.

## 9. Sản phẩm mong đợi

- Kiểm kê (R1) và đánh giá SignPath (R2).
- Dự thảo `TRADEMARK.md`, `ASSETS.md` (hoặc trang website), các thay đổi đề xuất cho README/CONTRIBUTING/website (dạng diff để duyệt, chưa áp dụng).
- ADR về quyết định.
- Tóm tắt cuối: những quyết định đã tự chọn, câu hỏi cần Vinh quyết (Q1–Q5) kèm đề xuất mặc định, phần cần luật sư.
