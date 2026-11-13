# Giả thuyết yêu cầu: Peak tự nhận ra thói quen và có "kỹ năng cơ thể"

> Handoff cho session Claude Code để suy nghĩ tiếp, đánh giá tính khả thi và viết `spec/08-adaptive-peak.md` cùng plan.
> **Đây là giả thuyết, chưa phải quyết định cuối.** Các mục "Đã chốt" là quyết định của Vinh trong cuộc trao đổi ngày 2026-11-13; phần còn lại cần kiểm chứng.
> Quy tắc làm việc: chỉ viết tài liệu, không sửa code app khi Vinh chưa duyệt từng hạng mục. Câu hỏi mở ghi lại, không tự đoán.
> Tài liệu này **thay thế phần giao tiếp** của `customization-hypothesis.md` (xem mục 12).

---

## 1. Ý tưởng

Thay vì cho người dùng chọn tùy chỉnh trong Settings, **Peak tự nhận ra** sở thích của người dùng qua tần suất hành vi hoặc qua điều họ nói, rồi **gợi ý** phương án khi Peak có năng lực thực hiện. Năng lực đó là các **kỹ năng (skill/function call)** để Peak phản ứng bằng hành động với điều người dùng nói trong khung chat hoặc bằng giọng nói. Ví dụ:
- Người dùng nói "lượn đi": Peak chào tạm biệt rồi chạy mất (hoặc biến đi theo một cách nào đó).
- Người dùng bấm hotkey: Peak nhấc điện thoại áp vào tai ("alo"), người dùng nói tiếp.
- Người dùng nói về một chỗ: Peak nhảy về chỗ quen rồi nằm ngủ.

## 2. Các quyết định đã chốt (Vinh, 2026-11-13)

| # | Quyết định |
|---|---|
| A1 | **Không đưa lựa chọn tùy chỉnh về sở thích** (màu, phụ kiện, giọng, chỗ ngồi) vào Settings. Peak tự nhận ra và gợi ý. |
| A2 | **Kỹ năng của Peak chỉ là ngôn ngữ cơ thể và sự hiện diện.** Không động vào ứng dụng, tệp hay dữ liệu của người dùng. Không có tiện ích kiểu hẹn giờ, nhắc việc. |
| A3 | **Cách gọi bằng giọng nói ở bản đầu: chỉ hotkey, bấm giữ để nói.** Chưa có wake word ("hey Peak"). |
| A4 | **Lát cắt kỹ năng đầu tiên: "Lượn đi"** (chào, ẩn, quay lại). Hoạt họa nhấc điện thoại, về chỗ quen rồi ngủ, biến hình **chưa được chọn** cho lát cắt đầu. |
| A5 | **Việc gọi hoặc đuổi mèo bằng lời không tính vào Bond Days** ở giai đoạn đầu. Đếm riêng. |
| A6 | Các điều khiển về an toàn và riêng tư (Quiet mode, ẩn mèo, key, ngôn ngữ, quyền riêng tư, xem/xóa những gì Peak đã học) **vẫn là điều khiển xác định**, không thương lượng với mèo. |

Các quyết định trước vẫn đúng: Bond là lõi, hài hước công sở là giọng, north star là Bond Days, chưa bán gì, không bán Personality Packs, không có nội dung do người dùng đóng góp.

## 3. Nguyên tắc

- **P1.** Kỹ năng là ngôn ngữ cơ thể và sự hiện diện của mèo, không phải hành động trên máy người dùng. Trượt sang việc của trợ lý là vi phạm bộ lọc tính năng.
- **P2.** **Hai tầng ý định:** (1) bảng ý định cục bộ cho các lệnh phổ biến, chạy không cần AI hay key; (2) function call của LLM cho câu mơ hồ, khi có key. Tắt AI vẫn phải chơi được.
- **P3.** Danh sách kỹ năng là **đóng** (whitelist). Mỗi kỹ năng có thời gian chờ, hoàn tác được, tuân theo Quiet mode, giờ yên tĩnh, fullscreen và trình chiếu, và không chạy khi người dùng đang gõ.
- **P4.** Học từ hành vi bằng **đếm cục bộ**, không theo dõi nội dung hay tên cửa sổ. Gợi ý ít, nói rõ lý do, lùi lại khi bị từ chối, cho xem và xóa.
- **P5.** Điều khiển an toàn/riêng tư luôn xác định (A6).
- **P6.** Giọng nói: bấm giữ để nói, không mở mic liên tục. Mic bật phải hiện rõ.

## 4. Hiện trạng code (đọc từ repo trên GitHub; bản trên máy Vinh có thể đã khác)

- Chat gửi chỉ dẫn hệ thống (`systemInstruction`) và nhận lại chữ. **Chưa có function calling.**
- **Chưa thấy phím tắt toàn cục** trong code.
- Đã có `brain_remember`: rút sự thật từ hội thoại và lưu cục bộ. Nền cho "học qua trao đổi".
- Đã có các card hỏi/lựa chọn trong bong bóng (các loại panel `ask`, `choice`...). Nền cho "gợi ý rồi hỏi có/không".
- Rig chỉ có góc nhìn trước và ngang. Đi bộ là trạng thái tốn CPU nhất (khoảng 7–15% một lõi trên các tiến trình ở 0.1.7).
- Hạn mức chat hiện có: 60 lượt/ngày, 6 câu mèo tự nói/ngày.
- Đã có Quiet mode và phát hiện fullscreen/trình chiếu trên Windows.

## 5. Giả thuyết cần kiểm chứng

- **H1.** Đếm hành vi cục bộ đủ để Peak đưa ra gợi ý mà người dùng chấp nhận. *Bác bỏ nếu:* tỉ lệ chấp nhận thấp, hoặc người dùng ẩn mèo/bật Quiet mode nhiều hơn sau khi có gợi ý. (Ngưỡng do Vinh đặt khi có baseline.)
- **H2.** Bảng ý định cục bộ (Anh/Việt/Nhật) bao phủ phần lớn lệnh thực tế, nên LLM chỉ cần cho phần mơ hồ. *Bác bỏ nếu:* phần lớn câu lệnh thật không khớp bảng.
- **H3.** "Lượn đi" tăng cảm xúc, không bị dùng thay Quiet mode theo cách làm giảm Bond Days. *Bác bỏ nếu:* người dùng lượn đi rồi không gọi mèo về, hoặc Bond Days giảm.
- **H4.** Function call của model nhỏ (Flash/Flash-Lite) đủ tin cậy với danh sách đóng ít kỹ năng. *Bác bỏ nếu:* gọi sai hoặc bịa kỹ năng thường xuyên.
- **H5.** Hotkey bấm giữ để nói được dùng thật (không chỉ thử một lần). *Bác bỏ nếu:* số lần dùng rơi nhanh sau tuần đầu.
- **H6.** Học hành vi cục bộ không gây cảm giác bị theo dõi. *Bác bỏ nếu:* khảo sát hoặc tỉ lệ tắt cho thấy khó chịu.

## 6. Mô hình hai tầng và vòng đời một kỹ năng

1. Người dùng nói/gõ.
2. **Tầng 1, bảng ý định cục bộ:** khớp từ khóa (Anh/Việt/Nhật) → mã kỹ năng. Khớp thì chạy ngay.
3. **Tầng 2, LLM** (chỉ khi có key và tầng 1 không khớp): gọi hàm với danh sách kỹ năng đóng. Client **kiểm tra lại** kết quả (mã kỹ năng nằm trong danh sách, tham số hợp lệ) trước khi chạy.
4. **Che độ trễ:** trong lúc chờ LLM (khoảng 1–3 giây), mèo phản ứng cục bộ ngay (ví dụ tai dựng).
5. **Cổng an toàn:** cooldown, Quiet mode, giờ yên tĩnh, fullscreen, trình chiếu, đang gõ.
6. **Thực thi** bằng hoạt họa và trạng thái của rig.
7. **Hoàn tác:** một câu nói hoặc một nút ("quay lại đi").

## 7. Danh mục kỹ năng

**Lát cắt đầu (đã chọn):**
- **Lượn đi.** Mèo nói một câu chào tạm biệt, chạy ra khỏi màn hình hoặc biến đi, ẩn một thời gian, rồi quay lại. Về bản chất là Quiet mode có cảm xúc. Cần quyết: bao lâu mèo quay lại, và cách gọi mèo về khi nó đang ẩn (xem câu hỏi mở).

**Ứng viên cho các lát cắt sau (chưa chọn, ghi chi phí để tham khảo):**
- **Hotkey → nhấc điện thoại "alo".** Biến trạng thái đang nghe thành hoạt họa. Cần phím tắt toàn cục (chưa có), quyền mic, hoạt họa mới.
- **Về chỗ quen rồi ngủ.** Khó nhất: nhớ vị trí theo tọa độ màn hình (học từ nơi người dùng hay đặt mèo, không dùng tên cửa sổ), đi bộ nhiều hướng (tốn CPU), xử lý đa màn hình.
- **Biến hình.** Chi phí nằm ở hoạt họa mới hoàn toàn.

**Nhận xét:** nút thắt thật là hoạt họa và trạng thái mới trong rig, không phải function calling. Mỗi kỹ năng cần ước chi phí hoạt họa trước.

## 8. Học từ hành vi (không dùng AI)

Tín hiệu có thể đếm cục bộ (Vinh duyệt danh sách cuối):
- Nơi người dùng hay thả/đặt mèo (tọa độ màn hình).
- Giờ trong ngày người dùng gãi đầu hoặc tương tác.
- Tần suất ẩn mèo/bật Quiet mode.
- Tỉ lệ chat so với gãi/xoa bụng (đã có là guardrail).

**Không** theo dõi: nội dung gõ, nội dung màn hình, tên cửa sổ/ứng dụng.

Quy tắc gợi ý: tối đa N lần mỗi tuần (Vinh đặt), lùi lại sau khi bị từ chối, nói rõ lý do ("em thấy anh hay đặt em ở đây"), luôn có đường lùi bằng lời. Có chỗ **xem và xóa** những gì Peak đã học (xác định, không qua hội thoại). Việc người dùng chấp nhận một gợi ý của mèo là hành vi tự nguyện, có thể là tín hiệu Bond Days (khớp "phản ứng với câu mèo tự nói"); cần Vinh duyệt cách tính.

## 9. Yêu cầu dự kiến (nếu giả thuyết đứng vững)

- **R1.** Bảng ý định cục bộ cho kỹ năng trong danh sách, ba ngôn ngữ (hoặc theo thứ tự Vinh quyết).
- **R2.** Kỹ năng "Lượn đi" đầy đủ vòng đời mục 6.
- **R3.** Function call của LLM khi có key: danh sách đóng, schema chặt, client kiểm tra lại, có đường lùi về tầng 1. Không đưa tên tệp, ứng dụng hay dữ liệu người dùng vào hàm.
- **R4.** Cổng an toàn (P3) áp cho mọi kỹ năng.
- **R5.** Hotkey toàn cục bấm giữ để nói (voice pha 1): phím cấu hình được hoặc chọn mặc định ít xung đột, trạng thái đang nghe, quyền mic, hiển thị rõ khi mic bật, ghi âm ngắn gửi cho model đã có. Thứ tự so với lát cắt kỹ năng đầu do Vinh quyết.
- **R6.** Bộ đếm hành vi cục bộ và cơ chế gợi ý (card có/không), giới hạn tần suất, ghi nhớ "đã từ chối".
- **R7.** Màn hình xem và xóa những gì Peak đã học.
- **R8.** Đo lường (opt-in, chỉ đếm số): số lần dùng mỗi kỹ năng, tỉ lệ hoàn tác, tỉ lệ chấp nhận gợi ý, tỉ lệ ẩn mèo. Việc gọi/đuổi mèo đếm riêng, **không** vào Bond Days (A5). Không ghi nội dung.

## 10. Ràng buộc

- Hiệu năng: RAM tối đa 120 MB, idle gần 0% CPU. Kỹ năng mới không được làm tăng chi phí khi idle. Đi bộ nhiều hướng phải được đo.
- Quyền riêng tư: telemetry opt-in và chỉ đếm số; mic chỉ khi bấm giữ; gửi âm thanh cho nhà cung cấp AI cần nói rõ (gói miễn phí của Gemini có thể dùng yêu cầu để cải thiện sản phẩm Google).
- Tắt AI vẫn phải đáng yêu: tầng 1 chạy không cần key.
- Không thêm lựa chọn sở thích vào Settings (A1). Điều khiển an toàn/riêng tư vẫn có (A6).
- Không có nội dung do người dùng đóng góp hoặc tải lên. Không bán Personality Packs. Chưa thu tiền.

## 11. Việc cần Claude Code suy nghĩ và xác minh

1. Liệt kê mọi trạng thái của rig và đánh giá chi phí thêm trạng thái "rời màn hình", "ẩn", "quay lại". Có nối được với Quiet mode hiện có không?
2. Bảng ý định cục bộ: đề xuất cấu trúc và cách đo độ bao phủ với dữ liệu thật (alpha). Xử lý nhập nhằng ("lượn đi" so với "đi ngủ đi").
3. Function calling của Gemini trong `brain.rs`: thay đổi cần thiết, cách kiểm tra lại kết quả, và độ tin cậy với model nhỏ. Hạn mức chat 60/ngày có tính lượt gọi hàm không?
4. Phím tắt toàn cục: phương án trong Tauri 2, xung đột phím, hành vi khi ứng dụng khác đang giữ focus (không được cướp focus bàn phím của ứng dụng đang gõ).
5. Ghi âm ngắn và gửi cho Gemini: định dạng, kích thước, quyền mic trên Windows, chỉ báo mic.
6. Bộ đếm hành vi cục bộ: nơi lưu, kích thước, cách xóa, quan hệ với `memory.json` và `DayStat`.
7. Cơ chế gợi ý: dùng lại card `ask`/`choice`? Quy tắc tần suất và lùi lại.
8. Cách bảo đảm hành động không xảy ra lúc họp, chia sẻ màn hình hoặc trình chiếu (kiểm tra phát hiện hiện có đủ chưa).
9. Thứ tự làm rẻ nhất để kiểm chứng H2 và H3 trước.
10. Liệt kê chỗ tài liệu này mâu thuẫn với code hoặc spec hiện có.

## 12. Quan hệ với tài liệu đã có

- `customization-hypothesis.md`: ba tầng (màu, phụ kiện, giọng) giữ làm **kho những gì Peak có thể thay đổi ở chính nó**. Cách giao tiếp đổi từ "người dùng chọn" sang "Peak đề xuất" (A1). R1–R4 cũ chỉ còn là phần thực thi bên dưới; H1 cũ đổi sang đo tỉ lệ chấp nhận gợi ý (H1 mới). Cần Claude Code hợp nhất khi viết spec.
- `requirements-draft-v0.4.md`: mục voice đổi thành hotkey bấm giữ để nói (R5); wake word chuyển thành "sau, tùy chọn, chạy trên máy", chưa nằm trong phạm vi.
- `north-star-bond-days.md`: thêm quy tắc A5 (gọi/đuổi mèo bằng lời không tính vào Bond Days; đếm riêng).
- `character-and-movement.md`: ranh giới "tránh vùng đang gõ" áp cho mọi kỹ năng; đi bộ nhiều hướng là điều kiện của kỹ năng "về chỗ quen".

## 13. Câu hỏi mở cho Vinh

- Q1. Sau "lượn đi", mèo quay lại sau bao lâu, và gọi mèo về bằng cách nào khi nó đang ẩn (tray, hotkey, click ở đâu)?
- Q2. Có đưa hoạt họa nhấc điện thoại vào lát cắt sớm cùng hotkey không? (Hiện chưa chọn.)
- Q3. Kỹ năng thứ hai nên là gì: nhấc điện thoại, về chỗ ngủ, hay biến hình?
- Q4. Danh sách tín hiệu hành vi được học (mục 8): duyệt hay bớt?
- Q5. Gợi ý tối đa bao nhiêu lần mỗi tuần, và khi bị từ chối thì lùi bao lâu?
- Q6. Bảng ý định cục bộ làm ba ngôn ngữ ngay hay Anh/Việt trước?
- Q7. Lượt gọi hàm của LLM có tính vào hạn mức chat 60/ngày không?
- Q8. Bản đa nhà cung cấp chưa commit có đổi cấu trúc chat/gọi hàm mà tài liệu này cần bám vào không?

## 14. Sản phẩm bàn giao mong muốn

1. Một phân tích tính khả thi ngắn trả lời mục 11, nêu rõ chỗ nào cần Vinh quyết.
2. `spec/08-adaptive-peak.md` nếu giả thuyết đứng vững (yêu cầu đánh số, tiêu chí chấp nhận, hợp nhất với `customization-hypothesis.md`), kèm plan theo thứ tự rẻ nhất để kiểm chứng.
3. Không sửa code app. Câu hỏi mở ghi lại, chờ Vinh.
