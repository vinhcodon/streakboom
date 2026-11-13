> **Ghi chú trạng thái (2026-11-13):** tài liệu này là bản nền về tùy biến Peak, viết trước `adaptive-peak-and-skills.md`. Phần đã được điều chỉnh: tùy biến **không đi qua Settings để người dùng tự chọn**. Peak tự nhận ra thói quen hoặc nguyện vọng rồi gợi ý (xem `adaptive-peak-and-skills.md`). Khi đọc cần hiểu hai điểm: (1) "núm độ lầy" ở mục 4 và R4 là cơ chế nội bộ để Peak điều chỉnh, không phải màn hình cài đặt; (2) số thứ tự spec: tài liệu này nói `spec/08-customization.md`, còn adaptive nói `spec/08-adaptive-peak.md`, nên Claude Code cần thống nhất lại số khi viết spec. Lập luận ba tầng và các giả thuyết H1–H4 vẫn còn dùng được.

# Giả thuyết yêu cầu: Tùy biến Peak theo ba tầng (màu, phụ kiện, giọng)

> Handoff cho session Claude Code để suy nghĩ tiếp, đánh giá tính khả thi và viết `spec/08-customization.md` cùng plan.
> **Đây là giả thuyết, chưa phải quyết định.** Mọi mục "Cần xác minh" phải được kiểm chứng trước khi viết thành yêu cầu cứng.
> Quy tắc làm việc: chỉ viết tài liệu, không sửa code app khi Vinh chưa duyệt từng hạng mục. Câu hỏi mở ghi lại, không tự đoán.
> Ngày: 2026-11-13. Người quyết định: Vinh.

---

## 1. Câu hỏi cần trả lời

Người dùng khác nhau thích Peak theo kiểu khác nhau (người thích màu hồng, người thích màu tím, nhóm indie dev thích phong cách thô ráp, lạnh). **Làm sao đáp ứng sự khác nhau này mà không tạo thêm nhân vật và không làm loãng thương hiệu?**

Giả thuyết trả lời: giữ **một** Peak, chia tùy biến thành **ba tầng** chỉ ảnh hưởng đến bề mặt. Mọi nội dung do nhóm làm và phát hành cùng app; **không có nội dung do người dùng đóng góp hay tải lên** (đã loại khỏi phạm vi, xem mục 8).

## 2. Bối cảnh và các quyết định liên quan (đã chốt trước đó)

- Bond là lõi sản phẩm, hài hước công sở là giọng. North star là Bond Days.
- Tệp ưu tiên: dân văn phòng toàn cầu nói tiếng Anh. Nhóm indie dev là kênh kéo đầu tiên (GitHub, Hacker News, Product Hunt), chưa phải tệp đích.
- Bộ lọc tính năng 3 câu (assistant khác làm được bằng prompt không? mèo có gắn bó hơn không? tắt AI còn đáng yêu không?).
- Chưa bán gì, đo nhu cầu trước.
- **Đã loại:** "Personality Packs" bán riêng (bộ system prompt). Lý do: dễ sao chép, và dễ phá nhân vật. Giả thuyết này **không** đưa nó trở lại.
- Tỉ lệ câu thoại châm biếm hiện khoảng 14%. Chưa quyết giữ hay giảm (câu hỏi nhân vật còn mở).

## 3. Hiện trạng nhân vật (đọc từ repo trên GitHub, bản trên máy Vinh có thể đã khác)

- Mèo "mochi" tròn, nét vẽ phẳng 2D, vẽ bằng canvas từ một rig chạy bằng lò xo (`app/src/lib/PetRig.svelte`, `rig/engine.ts`, `rig/draw.ts`, `rig/keys.ts`).
- Màu chủ đạo vàng cam: lông `#f6c26b`, bên tối `#e9a94a`, bụng `#fff1d6`. Hồng đã có làm điểm nhấn: má `#f59e9e`, mũi `#e8828a`, màu phụ `#f4a7a7`. Mực `#2b2220`, miệng `#7a4b3a`.
- Các màu cốt lõi là hằng số đầu `draw.ts` (FUR, DARK, BELLY, PINK, INK, MOUTH). **Nhưng cũng có màu viết thẳng trong hàm vẽ** (ví dụ `#d9696f`, `#f59e9e`, `#e8828a`, `#8ecae6`, `#8a8a8a`, `#6b7cff` ở các chỗ vẽ miệng, má, mũi, hiệu ứng). Nên đổi bảng màu không chỉ là đổi mấy hằng số đầu file.
- Đã có trong spec/03: nét "lầy" thể hiện bằng mắt nửa nhắm và nụ cười lệch, **dự kiến làm biểu cảm thêm cho câu thoại cay, chưa làm**.
- Settings đã có "gentle tone" (xác minh lại trong code hiện tại).
- Hiệu năng: RAM tối đa 120 MB, idle gần 0% CPU. Đi bộ là trạng thái tốn nhất.

## 4. Mô hình ba tầng (đề xuất)

| Tầng | Nội dung | Đổi gì | Không đổi gì |
|---|---|---|---|
| 1. Màu (skin) | Bảng màu thay thế: hồng, tím, tối/xám than, màu "terminal" | Màu lông, bụng, màu nhấn | Hình dạng, tỉ lệ, biểu cảm, chuyển động |
| 2. Phụ kiện | Nơ, tai nghe, mũ hoodie, kính, băng đô | Lớp vẽ thêm lên đầu hoặc cổ | Rig cơ bản và tư thế |
| 3. Giọng (độ lầy) | Núm chỉnh từ ấm đến khô và gọn | Tỉ lệ và kiểu câu thoại, có thể dùng biểu cảm mắt nửa nhắm | Tên, tính cách cốt lõi, quan hệ với chủ |

**Bất biến (không thuộc tùy biến):** tên và bản sắc nhân vật, mối quan hệ và trí nhớ với chủ, cách tính Bond Days, bốn lời hứa về quyền riêng tư.

**Quy tắc giọng "hai lớp":** hình và hành vi luôn dễ thương; lầy nằm ở lớp giọng. Đối tượng bị trêu là tình huống hoặc chính con mèo, **không bao giờ là người dùng**. Lầy phải nhất quán, không thất thường.

## 5. Phân khúc và cách đối xử (giả thuyết)

| Nhóm | Cách đáp ứng | Ghi chú |
|---|---|---|
| Thích màu hồng | Skin hồng (lông hồng sữa/hồng đào) | Phải đổi cả màu nhấn (má, mũi, hồng phụ) sang hồng đậm hơn, nếu không mặt sẽ chìm vào lông. |
| Thích màu tím | Skin tím | Cùng cơ chế; kiểm tra độ tương phản của má, mũi. |
| Indie dev, dân kỹ thuật độc lập | Skin tối, phụ kiện kiểu dev, giọng khô gọn | Coi như kênh phân phối (GitHub, Hacker News, Product Hunt), không nhất thiết là nguồn doanh thu. |
| Dân văn phòng (tệp đích) | Mặc định; có thể chọn một trong vài skin | Là nhóm mặc định, không bị bắt phải tùy biến. |

"Thô ráp, mạnh mẽ" nghĩa là **lì, ít nói, không nịnh**, không phải hung dữ. Mèo vẫn tròn và dễ thương.

## 6. Giả thuyết cần kiểm chứng

- **H1.** Có đủ người dùng muốn skin khác mặc định để đáng làm. *Cách bác bỏ:* sau khi phát biến thể trong sticker và hỏi người dùng alpha, tỉ lệ chọn hoặc hỏi skin khác mặc định thấp. (Ngưỡng do Vinh đặt khi có baseline.)
- **H2.** Skin theo bảng màu rẻ hơn nhiều so với làm nhân vật mới. *Cách bác bỏ:* nếu màu nằm rải rác khắp code vẽ hoặc rig cần sửa nhiều.
- **H3.** Phụ kiện tăng gắn bó hoặc nhu cầu mà không phá rig. *Cách bác bỏ:* nếu phụ kiện cần sửa rig hoặc làm tăng CPU/RAM vượt ngân sách.
- **H4.** Núm "độ lầy" làm người dùng chọn giọng hợp mình mà không giảm Bond Days. *Cách bác bỏ:* nếu nhóm giọng khô có Bond Days thấp hơn đáng kể, hoặc tỉ lệ ẩn mèo tăng.

## 7. Yêu cầu dự kiến (nếu giả thuyết đứng vững)

- **R1. Skin theo bảng màu.** Một cấu trúc dữ liệu thuần (không mã chạy) mô tả bảng màu, áp lên mọi chỗ vẽ, kể cả màu viết thẳng trong hàm. Có quy tắc tối thiểu về độ tương phản giữa lông và màu nhấn.
- **R2. Skin mặc định không đổi.** Người không chọn gì thì trải nghiệm y như hiện tại.
- **R3. Phụ kiện.** Lớp vẽ gắn vào các điểm neo trên rig (đầu, cổ), không đổi tư thế. Số lượng ban đầu nhỏ (khoảng 3–4 món).
- **R4. Núm độ lầy.** Nối với các biến đã có (gentle tone, tỉ lệ câu châm biếm, biểu cảm mắt nửa nhắm khi làm). Mặc định giữ như hiện nay.
- **R5. Đo lường.** Chỉ đếm số, opt-in: skin nào được chọn, núm độ lầy ở mức nào, có dùng phụ kiện không. Không ghi nội dung. Tương thích với `DayStat` và nguyên tắc telemetry hiện có. Tín hiệu nhu cầu ngoài app (sticker, khảo sát) làm trước.
- **R6. Tương thích sticker.** Bộ sticker v0 có thể có biến thể hồng và biểu cảm lầy làm thử nghiệm nhu cầu rẻ nhất (xem `sticker-test.md`).

## 8. Ràng buộc

- Hiệu năng: không vượt ngân sách RAM 120 MB và idle gần 0% CPU. Phụ kiện và skin không được làm tăng chi phí vẽ khi idle.
- Quyền riêng tư: telemetry opt-in và chỉ đếm số. Không có dữ liệu do người dùng tải lên hay đóng góp; skin và câu thoại do nhóm tạo và phát hành cùng app.
- Không bán Personality Packs. Chưa thu tiền; mọi thứ ở giai đoạn này miễn phí hoặc đo nhu cầu.
- **Ngoài phạm vi (đã loại):** người dùng đóng góp hoặc tải lên skin, câu thoại hay bất kỳ dữ liệu nào. Vinh chưa cân nhắc việc này; nó kéo theo kiểm duyệt nội dung và giấy phép. Nếu sau này muốn xét lại thì làm thành giả thuyết riêng.

## 9. Việc cần Claude Code suy nghĩ và xác minh

1. **Màu nằm ở đâu trong code?** Liệt kê mọi chỗ dùng màu vẽ nhân vật (kể cả viết thẳng) và đánh giá chi phí chuyển sang bảng màu. Có chỗ nào ngoài `rig/draw.ts` không?
2. **Phụ kiện:** rig có điểm neo ổn định cho đầu và cổ ở cả hai góc nhìn (trước, ngang)? Có cần điểm neo mới cho tư thế nằm ngủ, bị xách, đi bộ?
3. **Định dạng dữ liệu skin và câu thoại nội bộ** (phát hành cùng app, không do người dùng cung cấp): đề xuất cấu trúc có phiên bản, tương thích đa ngôn ngữ (Anh, Việt, Nhật).
4. **Núm độ lầy:** hiện "gentle tone" làm gì chính xác? Nối thêm núm này có đụng bộ chọn câu thoại (`selector.ts`) và thẻ ngữ cảnh không?
5. **Biểu cảm lầy (mắt nửa nhắm, cười lệch):** chi phí rig, có cần cho giọng khô không, hay chỉ là phần thưởng thẩm mỹ?
6. **Tương tác với trí nhớ và Bond Days:** đổi skin hay giọng có nên được mèo "nhận ra" không? Có ảnh hưởng chỉ số?
7. **Thứ tự làm:** đề xuất thứ tự rẻ nhất để kiểm chứng H1 và H2 trước khi làm R3–R6.
8. **Xung đột:** liệt kê chỗ giả thuyết này mâu thuẫn với code hoặc spec hiện có.

## 10. Câu hỏi mở cho Vinh

- Q1. Mức tùy biến ban đầu: chỉ vài skin và một núm độ lầy, hay thêm cả phụ kiện ngay?
- Q2. Chấp nhận giọng khô cho nhóm dev tới mức nào mà vẫn là Peak (câu hỏi nhân vật còn mở)?
- Q3. Skin nào làm trước: hồng, tím, tối? Hay để dữ liệu quyết?
- Q4. Skin và phụ kiện chung miễn phí hay có món trả phí sau này? (Hiện chưa bán.)
- Q5. Bản đa nhà cung cấp chưa commit có đổi cấu trúc settings mà tùy biến cần bám vào không?

## 11. Sản phẩm bàn giao mong muốn

1. Một phân tích tính khả thi ngắn trả lời mục 9, nêu rõ chỗ nào cần Vinh quyết.
2. `spec/08-customization.md` nếu giả thuyết đứng vững (yêu cầu đánh số, tiêu chí chấp nhận), kèm plan theo thứ tự rẻ nhất để kiểm chứng.
3. Không sửa code app. Câu hỏi mở ghi lại, chờ Vinh.
