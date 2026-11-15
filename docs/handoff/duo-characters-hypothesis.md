# Handoff: cặp đôi nhân vật Peak (mèo) và chó chăm chỉ

Trạng thái: giả thuyết, chưa quyết định. Tác giả ý tưởng: Vinh. Phân tích: Claude (chat) + đối chiếu với đề xuất "Master Paws" của Gemini.
Tài liệu nguồn (Claude Doc): https://claude.ai/artifact/L3cHa1TwSAHjNaVfGWPe8i

## RÀNG BUỘC CỨNG cho phiên Claude Code
- KHÔNG sửa code app hay bất cứ file nào ngoài `docs/`. Chỉ tạo hoặc sửa tài liệu trong `docs/`.
- KHÔNG thêm nhân vật chó vào app. Đây là bước kiểm chứng ý tưởng, chưa phải triển khai.
- Không dùng tên Doge, Cheems, Kabosu cho nhân vật.
- Commit chỉ gồm file doc. Không push khi chưa được bảo.

## 1. Ý tưởng
Thêm nhân vật thứ hai đối lập với Peak.
- Mèo Peak: não cá, tào lao, toàn chơi.
- Chó: chăm chỉ, thông minh, có việc riêng của nó.
- Cả hai đều KHÔNG làm việc cho người dùng.

Quy tắc giọng giữ nguyên: trêu tình huống hoặc con vật, không trêu người dùng. Việc của chó phải nhỏ, vô dụng, đôi khi hỏng (xếp hạt dẻ theo kích cỡ, đóng dấu lên tờ giấy chẳng ai đọc). Chó không được thành tấm gương làm người dùng thấy mình lười. Chất hài nằm ở năng lực đặt sai chỗ: mèo làm việc vô dụng một cách hoàn hảo, chó làm việc vô dụng một cách nghiêm túc.

Bối cảnh đã chốt: Streakboom là bạn đồng hành, không phải trợ lý; Peak không đọc màn hình, tên cửa sổ hay tên ứng dụng; chỉ số bắc đẩu là Bond Days; README 0.4.1 hiện ép "một Peak một lúc".

## 2. Đánh giá đề xuất "Master Paws" của Gemini
Gemini đề xuất: Border Collie đen trắng, 4 nguyên tắc hiến chương, bảng 6 trạng thái, SVG tham chiếu.

| Điểm của Gemini | Kết luận | Lý do |
| --- | --- | --- |
| Hoán đổi tính cách chó – mèo | Giữ | Đúng ý, dễ kể chuyện |
| Loyal Watch (chó canh gác tận tụy khi người dùng làm việc) | Sửa | Thành chó canh cho người dùng, trái với "việc của riêng nó". Thay bằng việc riêng của chó |
| 4 nguyên tắc hiến chương | Giữ | Khớp Quiet mode và cam kết riêng tư |
| Real-life Nudge (chó ngậm cốc, kéo Peak để gợi ý người dùng nghỉ) | Bỏ | Vẫn là nhắc nhở, trái "không làm gì cho bạn" |
| Make Way | Giữ | Rẻ, không đọc màn hình |
| Idle Greeting, Gesture Response, Sleep | Giữ | Tạo gắn bó, không tốn AI |
| Tương tác chó – mèo (chó rủ, mèo phớt lờ; cùng ngủ) | Giữ, làm nặng hơn | Nguồn sinh truyện tranh và sticker |
| Tên "Master Paws" | Sửa | "Master" gợi ông sếp; "Paws" là từ chung, thương hiệu yếu |
| Border Collie đen trắng | Giữ, cần kiểm tra | Tương phản với mèo vàng; thân #2B2D31 có thể khó tách khỏi nền tối |
| Rig 10 tư thế, logic hai thú cưng, system prompt BYOK | Hoãn | Chỉ làm nếu thử sticker thành công. Chó không có chat AI ở bản đầu |

Lỗi SVG của Gemini: `xmlns` ghi `http://w3.org`, đúng là `http://www.w3.org/2000/svg` (dán vào HTML vẫn chạy, nhưng file .svg hoặc thẻ img, cần khi xuất sticker PNG, có thể không hiển thị). Chỉ tai trái có animation. Chưa ai xem bản render ở 32 px và trên nền tối.

## 3. Rủi ro cần canh
- "Một Peak một lúc": hai thú cưng đòi sửa hiến chương, thêm logic Make Way cho hai nhân vật, thêm tải máy. Lý do chính để chưa đưa chó vào app.
- Pha loãng gắn bó: Bond Days là với Peak.
- Chó chăm chỉ dễ thành lời trách thầm.
- Không đo công việc người dùng: chỉ dùng mốc idle như Peak; không Pomodoro, không nhắc deadline.
- Chi phí AI: chó chỉ có câu thoại viết tay; tránh phá hạn mức 60 chat và 6 proactive mỗi ngày.
- Bộ lọc 3 câu hỏi: chó đạt câu 3 (dễ thương khi tắt AI), chưa chứng minh câu 2 (khiến mèo gắn bó hơn).
- Bản quyền: chờ quyết B1 hay B2 trong `licensing-and-brand-assets.md`. Chó vào repo thì mặc định thuộc MIT. Border Collie là giống chung; rủi ro là giống một nhân vật hay meme cụ thể.

## 4. Cách thử (kế hoạch cần kiểm chứng)
2–3 tuần trên streakboom.com và trang sticker, không đụng app.
- 6–8 sticker trôi: 3 sticker chó đơn, 3 sticker đôi mèo – chó, ít nhất 1 bộ truyện bốn ô.
- Đặt cạnh sticker Peak, cùng cách sao chép cho Zalo và Teams.
- Đo lượt sao chép và chia sẻ theo từng sticker, cộng phản hồi trực tiếp ("con chó đó là ai").
- Ngưỡng gợi ý (Vinh chỉnh được): sticker đôi được sao chép ít nhất ngang sticker Peak đơn thì mới xét đưa chó vào app, và khi đó chó là tùy chọn mặc định tắt. Nếu chó hút lượt của Peak thì dừng.
- Ví dụ khung truyện: mèo nằm ngủ; chó xin phép rồi bưng cả chuỗi hạt đã xếp thẳng hàng ngang qua người mèo; mèo mở một mắt, ngủ tiếp.

## 5. Việc cần làm (chỉ tài liệu)
1. Đọc `docs/handoff/` và `docs/spec/` (sticker-page-hypothesis, spec 09-sticker-page, licensing-and-brand-assets, adaptive-peak-and-skills, charter) để nắm cái đã chốt.
2. Viết `docs/spec/10-duo-test-plan.md`: danh sách sticker và khung truyện, cách gắn thẻ đo lượt sao chép theo sticker, ngưỡng quyết định và điều kiện dừng. Phải khớp spec 09; nếu cần đổi spec 09 thì chỉ ghi đề xuất.
3. Phân tích tác động hiến chương: chỉ ra chính xác chỗ nào trong docs (README chỉ đọc) đang ép "một Peak", cần sửa gì nếu sau này cho phép hai thú cưng. Chỉ ghi, không sửa.
4. Tên nhân vật: đề xuất 5 tên (ngắn, dễ nhớ, không gợi quyền lực, không phải từ chung), kiểm tra bằng WebSearch xem có trùng thương hiệu hay nhân vật nổi tiếng không. Ghi kết quả kèm nguồn và nói rõ chỗ chưa chắc.
5. Kiểm tra SVG: sửa xmlns, render ở 256 px và 32 px trên nền sáng và tối trong thư mục tạm ngoài repo (ví dụ /tmp). Ghi nhận xét; chỉ lưu ảnh vào `docs/handoff/assets/` nếu thư mục đó đã có. Không đưa SVG vào `src` hay `public`.
6. Cross-check `10-duo-test-plan` với `09-sticker-page` và `licensing-and-brand-assets`, ghi mâu thuẫn nếu có.
7. Commit doc-only, rồi báo: file đã tạo, kết quả kiểm tra tên, nhận xét render, và các câu hỏi cần Vinh quyết (B1/B2, tên nhân vật).

## 6. Mã SVG tham chiếu của Gemini
Chỉ để tham khảo. Sửa `xmlns` thành `http://www.w3.org/2000/svg` trước khi dùng. Mã nguồn gốc: viewBox 200×200; thân hình mochi #2B2D31 với mảng trắng #F8FAFC chạy từ sống mũi xuống bụng; hai tai #232529; hai chấm lông mày trắng; má hồng #FB7185 opacity 0.7; đuôi đen chóp trắng với animation wagTail 1.2s; thân thở 3s; tai trái giật nhẹ 4s. Bản đầy đủ nằm trong file đính kèm của Vinh (`Master Paws`, mục 5); nếu cần, hỏi Vinh dán lại.
