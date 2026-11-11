# Streakboom: Bản phác thảo yêu cầu (draft v0.1, trước khi giao cho Claude Code)

> Mục đích: gom toàn bộ quyết định chiến lược đã thảo luận thành một văn bản để Claude Code viết `spec/07-requirements.md` và plan.
> Nguồn: các cuộc trao đổi với Vinh (north star, nhân vật và chuyển động, ký số/macOS, Product Hunt, sticker, voice) và bản đánh giá chiến lược do Gemini viết (đã được rà lại).
> **Quy tắc làm việc:** Claude Code chỉ viết spec và plan. Không sửa code app khi Vinh chưa duyệt từng hạng mục. Mọi con số "ngưỡng" chưa có baseline thì để trống, không tự đoán.
> Ngày: 2026-11-11. Người quyết định: Vinh.

---

## 1. Các quyết định đã chốt

| # | Quyết định | Ghi chú |
|---|---|---|
| D1 | **Bond là lõi sản phẩm, hài hước công sở là giọng.** | Mèo gắn bó, nhớ bạn và lớn lên cùng bạn. Thoại theo khung giờ hành chính là cách thể hiện, không phải sản phẩm chính. |
| D2 | **North star = Bond Days** (số ngày trong 7 ngày gần nhất có ít nhất một hành động chăm sóc chủ động: gãi đầu, xoa bụng, hoặc phản ứng với câu mèo tự nói). Chat và chọc đơn thuần không tính. | Chưa đặt ngưỡng mục tiêu. Chờ có dữ liệu từ người dùng ngoài; baseline hiện chỉ có n=1. |
| D3 | **Dùng thử AI không cần key (proxy): đo trước, quyết sau.** Ra mắt bản có kho thoại offline + BYOK, đo `key_valid` và chỗ rụng ở bước key, rồi mới quyết có làm proxy không. | Xem mục 6 (cổng quyết định). |
| D4 | **Chưa bán gì, đo nhu cầu trước.** Giai đoạn này chỉ thu tín hiệu nhu cầu, không thu tiền. | Xem mục 7. |
| D5 | **Tệp khách hàng ưu tiên: dân văn phòng toàn cầu, tiếng Anh.** Sản phẩm vẫn giữ Anh/Việt/Nhật đã có. | Product Hunt là kênh chính. Xem câu hỏi mở Q1 về Zalo. |
| D6 | Nguyên tắc lọc tính năng (3 câu hỏi): (a) một AI assistant khác có làm được bằng prompt không? (b) tính năng có làm mèo gắn bó, nhớ, lớn lên hơn không? (c) tắt AI đi thì mèo còn dễ thương không? | Mọi hạng mục bên dưới phải qua bộ lọc này. |
| D7 | Định vị: **companion, không phải assistant.** Tôn trọng không gian làm việc, không đọc phím, không chụp màn hình, không theo dõi tên cửa sổ, mèo không chết hay đói. | Giữ nguyên bốn lời hứa hiện có trừ khi D3 đổi sang làm proxy. |

## 2. Nguyên tắc sản phẩm (ràng buộc cho mọi spec)

1. **Out of your way.** Mèo không bao giờ đè lên vùng người dùng đang gõ (xem spec/06 và thang an toàn focus). Không bật bong bóng khi đang gõ phím hoặc di chuột liên tục.
2. **Tắt AI vẫn đáng yêu.** Trải nghiệm không-AI phải đủ tốt để giữ người dùng, vì phần lớn người mới sẽ chưa có key.
3. **Quyền riêng tư là tính năng.** Telemetry opt-in, chỉ đếm số, không nội dung. Mọi thay đổi chạm vào lời hứa phải được Vinh duyệt riêng.
4. **Hiệu năng.** RAM tối đa 120 MB, idle gần 0% CPU. Đi bộ là trạng thái tốn nhất nên không mở rộng chuyển động nếu đẩy vượt ngân sách này.
5. **Chỉ số guardrail:** chat share = chat/(chat + gãi + xoa bụng), tỉ lệ ẩn mèo hoặc bật Quiet mode, CPU/RAM.

## 3. Các luồng công việc và yêu cầu

### A. Đo lường (nền tảng cho mọi quyết định khác)
- A1. Thực hiện bộ chỉ số trong `docs/handoff/north-star-bond-days.md` (đếm theo ngày: gãi, xoa bụng, chọc, chat, số câu mèo tự nói, số lần phản hồi, phút hoạt động; tối đa 60 ngày; opt-in; xuất bằng "Copy stats").
- A2. Thêm sự kiện phễu cần cho D3: tỉ lệ người dùng mở chat (double-click) mà chưa có key, người bấm "mở trang lấy key", người dán key, người `key_valid`. Hiện `get_key_clicked`, `key_pasted`, `key_valid` đã có; bổ sung chỉ khi thiếu bước nào.
- A3. Cách đo nguồn cài (từ sticker, Product Hunt, trang web) nằm **ngoài app** (link rút gọn, trang tải), không thêm theo dõi cá nhân vào app.
- A4. Output: `spec/05-north-star-metrics.md` và plan (đã có handoff riêng).

### B. Kích hoạt và onboarding (nhắm vào chỗ rụng lớn nhất)
- B1. **Kho thoại offline theo ngữ cảnh thời gian** (sáng/trưa/chiều/tối, đầu tuần so với cuối tuần). Mục tiêu: người chưa có key vẫn không thấy lặp lại trong tuần đầu. Cần số lượng câu thoại tối thiểu do Vinh quyết (hiện khoảng 58 câu mỗi ngôn ngữ, mục tiêu cũ là 150).
- B2. **Kích hoạt khi nhàn rỗi.** Mèo chỉ tự nói khi hệ thống nhàn rỗi hoặc người dùng chủ động tương tác (hover/click). Hiện chưa có phản ứng theo thời gian nhàn rỗi nên đây là hạng mục mới. Bắt buộc tôn trọng Quiet mode, giờ yên tĩnh, fullscreen.
- B3. Khung giờ gợi ý để viết thoại (từ bản Gemini, giữ như ý tưởng nội dung): đầu tuần sáng thứ Hai, 11h30 trưa, 13h00 sau nghỉ trưa, 16h30 chuẩn bị về, 20h00 người tăng ca. Giờ này mang tính ví dụ văn phòng; spec cần xét múi giờ và ngày làm việc của người dùng quốc tế, không cứng giờ.
- B4. Cải thiện bước lấy key trong Settings: đo chỗ rụng trước, sửa sau (xem D3).

### C. Nhân vật và chuyển động
- C1. Triển khai theo `docs/handoff/character-and-movement.md` → `spec/06-character-and-movement.md`.
- C2. Ba quyết định nhân vật còn mở: tên mèo mặc định, câu từ chối "to quá em không làm được", tỉ lệ châm biếm (hiện ước tính khoảng 14%).
- C3. Giọng "hài hước công sở" phải khớp character bible: mèo nhỏ, ấm, có chút lười. Giọng "mỏ hỗn chê sếp" nằm ngoài nhân vật hiện tại, **không đưa vào phạm vi** cho đến khi Vinh quyết (Q4).

### D. Phân phối
- D-1. **Ký số Windows:** làm trước khi quảng bá rộng. Ưu tiên các phương án đã khảo sát: SignPath Foundation (miễn phí cho mã nguồn mở) hoặc chứng chỉ OV (khoảng 150–300 USD/năm). Azure Artifact Signing không dùng được cho cá nhân ở Việt Nam. EV không cho tin cậy SmartScreen tức thì. Khóa minisign của updater tách biệt với chứng chỉ Authenticode.
- D-2. **Product Hunt:** chuẩn bị theo đánh giá đã có (xếp hạng theo lượt vote và chất lượng bình luận, traffic chủ yếu từ điện thoại nên trang đích phải đọc được trên mobile). Giờ ra mắt: 12:01 AM PT. Tính lại giờ Việt Nam lúc đăng.
- D-3. **Sticker chat:** theo `docs/handoff/sticker-test.md` (mục tiêu kéo người dùng mới, tự làm có AI hỗ trợ, ngưỡng dừng sau 4–6 tuần). Xem Q1 về nền tảng.
- D-4. macOS: chỉ khi bản Windows ổn. Cần Apple Developer (99 USD/năm), notarization, `macOSPrivateApi` cho cửa sổ trong suốt (không lên App Store), viết lại phát hiện fullscreen và phần Keychain.

### E. Voice (giai đoạn sau, chia pha)
- E1. Pha 1: bấm giữ để nói → ghi âm ngắn → gửi cho model Gemini Flash/Flash-Lite hiện có → mèo trả lời bằng chữ như hiện nay. Không cần dịch vụ thứ hai.
- E2. Pha 2: mèo nói lại. Thử TTS của Gemini (xem lại trang giá trước khi chọn) với giọng Windows làm dự phòng.
- E3. Ràng buộc: mặc định tắt, tôn trọng Quiet mode, nằm trong hạn mức chat hiện có (60/ngày), không nghe liên tục.
- E4. **Quyền riêng tư:** gửi âm thanh nhạy cảm hơn chữ. Gói miễn phí của Gemini có thể dùng yêu cầu để cải thiện sản phẩm Google, nên mục Privacy phải nói rõ. Voice không tính vào Bond Days (cùng quy tắc với chat).
- E5. Chỉ vào kế hoạch sau khi Vinh nghe thử chất lượng tiếng Việt và tiếng Anh trong AI Studio.

### F. Doanh thu: chỉ đo nhu cầu (D4)
- F1. Giai đoạn này **không** bán và không thu tiền. Chỉ thu tín hiệu nhu cầu.
- F2. Các tín hiệu có thể dùng (không cần đổi code app trước khi Vinh duyệt): phản hồi từ người dùng alpha, lượt tải và chia sẻ sticker, lượt xem trang giới thiệu vật phẩm, khảo sát ngắn, so sánh Bond Days của nhóm người sẵn sàng mua với nhóm còn lại.
- F3. Hướng ưu tiên khi đến lúc bán: vật phẩm và ngoại hình cho mèo (khó sao chép, gắn với mối quan hệ). **Không ưu tiên** Peak Pass (chat không giới hạn) và Personality Packs (bộ system prompt), vì cả hai là thứ AI khác làm được bằng prompt (trượt bộ lọc D6a).
- F4. Nếu sau này bán: cần xét cổng thanh toán và thuế khi thu tiền từ Việt Nam, và chi phí AI mỗi tin nhắn. Chưa nghiên cứu.

### G. Tuyên ngôn và chính sách riêng tư
- G1. Chỉ viết lại khi có thay đổi thật. Với D3 (chưa làm proxy), bốn lời hứa hiện tại vẫn đúng và không đổi.
- G2. Nếu sau này làm proxy: lời hứa phải mô tả đúng phạm vi (xem mục 6), không dùng chữ "zero-storage" khi vẫn có bộ đếm gắn với thiết bị.

## 4. Đánh giá bản chiến lược Gemini

| Ý tưởng của Gemini | Kết luận | Lý do |
|---|---|---|
| Tệp dân văn phòng, mèo "tào lao" giải tỏa áp lực | **Nhận** làm giọng và tệp khách | Hợp D1 và D5. Không làm lõi. |
| Kho thoại theo khung giờ + kích hoạt khi nhàn rỗi | **Nhận** (B1, B2) | Giảm lặp lại cho người không có key. |
| Stateless proxy 10–15 tin/ngày | **Hoãn** (D3) | Đo trước. Xem mục 6. |
| Peak Pass (chat không giới hạn) | **Từ chối ở giai đoạn này** | Bán đúng phần dễ sao chép nhất. |
| Personality Packs (system prompt) | **Từ chối ở giai đoạn này** | Trượt bộ lọc D6a, và "mỏ hỗn" lệch khỏi nhân vật. |
| Phụ kiện/trang phục cho mèo | **Giữ làm hướng ưu tiên khi bán** | Gắn với mối quan hệ. |
| Ký chứng chỉ Code Signing | **Nhận** (D-1) | Gỡ rào đầu tiên cho người dùng mới. |
| "Không vướng COPPA/GDPR-K" | **Không dùng làm lập luận** | GDPR vẫn áp dụng cho người lớn nếu có proxy xử lý nội dung chat. Cần xem xét pháp lý riêng. |
| Giữ bốn lời hứa, thêm "Hybrid AI" vào Privacy | **Hoãn** (G1) | Chỉ khi có proxy. |

Những điều bản Gemini bỏ sót và spec này bổ sung: north star và guardrail, trí nhớ và gắn bó, an toàn focus khi gõ, Product Hunt, sticker, voice, đo lường trước khi quyết.

Những điểm trong bản Gemini cần xác minh với thực tế (không dùng làm sự thật): phiên bản "v0.3.1" (Vinh nhớ alpha 0.1.x), tuyên bố "tự động né chuột và dừng khi gõ" (đã có báo cáo mèo đè lên vùng gõ), website `streakboom.com`, khả năng BYOK với Claude và OpenAI (bản đa nhà cung cấp trên máy Vinh còn chưa commit).

## 5. Thứ tự ưu tiên

**Ngay (trước khi mời người dùng ngoài):**
1. A: telemetry và baseline.
2. D-1: ký số Windows.
3. C: sửa việc mèo đè lên vùng đang gõ (nằm trong thang an toàn focus của spec/06).

**Tiếp theo (cùng đợt ra mắt):**
4. B1 và B2: kho thoại offline theo ngữ cảnh, kích hoạt khi nhàn rỗi.
5. D-3: bộ sticker v0 và thử nghiệm.
6. D-2: chuẩn bị Product Hunt (trang đích, ảnh/GIF, câu chuyện).

**Sau, khi có dữ liệu:**
7. Quyết proxy (mục 6).
8. Voice pha 1, rồi pha 2.
9. Quyết bán gì (F3).
10. macOS.

## 6. Cổng quyết định cho proxy (D3)

Quyết sau khi có dữ liệu từ người dùng ngoài, không quyết bằng cảm tính. Đo tối thiểu:
- Tỉ lệ người dùng đã ý định chat nhưng bỏ ở bước key.
- Bond Days của người **không có key** so với người **có key** (để biết AI có thật sự tạo gắn bó hay không).
- Số người dùng ngoài đã có đủ dữ liệu. Ngưỡng và cỡ mẫu do Vinh đặt khi có baseline.

Nếu cuối cùng làm proxy, các ràng buộc phải có trong spec:
1. Gọi nhà cung cấp AI bằng key **trả phí**, vì gói miễn phí của Gemini có thể dùng yêu cầu để cải thiện sản phẩm Google.
2. Giới hạn theo thiết bị cần bộ đếm gắn với mã băm thiết bị. Phải nói rõ đó là một định danh (dù ẩn danh), không tuyên bố "không lưu gì".
3. Xét log vận hành của nền tảng chạy proxy và của nhà cung cấp AI phía sau.
4. Mã nguồn công khai chứng minh mã, không chứng minh bản đang chạy. Lời hứa phải nói đúng phạm vi đó.
5. Xử lý lạm dụng (cài lại để lấy thêm lượt), chi phí mỗi tin nhắn, vùng địa lý.
6. Viết lại bốn lời hứa và Privacy cho khớp, kèm duyệt riêng của Vinh.

## 7. Câu hỏi mở (cần Vinh)

- **Q1.** Bạn chọn tệp toàn cầu nói tiếng Anh, trong khi thử nghiệm sticker đã chốt ở Zalo (chỉ phủ Việt Nam). Giữ Zalo như thử nghiệm rẻ cho cộng đồng Việt, hay đổi sang Telegram/nền tảng khác phủ toàn cầu?
- **Q2.** Phiên bản hiện tại của app là bao nhiêu, và `streakboom.com` đã có chưa?
- **Q3.** Ba quyết định nhân vật: tên mèo mặc định (có phải "Peak" không), câu "to quá em không làm được", tỉ lệ châm biếm.
- **Q4.** Có đưa giọng "mỏ hỗn" vào phạm vi không (hiện loại ra)?
- **Q5.** Số câu thoại offline tối thiểu cho mỗi ngôn ngữ trước khi ra mắt.
- **Q6.** Với D4: bạn muốn thu tín hiệu nhu cầu bằng cách nào trước (khảo sát, trang vật phẩm, sticker, hay phản hồi alpha)?
- **Q7.** Bạn có muốn voice vào trước ngày ra mắt hay sau? Nếu trước, chỉ pha 1?
- **Q8.** Bản đa nhà cung cấp chưa commit: khi nào commit, và có nằm trong phạm vi bản ra mắt không?

## 8. Sản phẩm bàn giao mong muốn từ Claude Code

1. `spec/07-requirements.md`: biến văn bản này thành yêu cầu có đánh số, tiêu chí chấp nhận và phụ thuộc giữa các luồng.
2. Một plan theo mục 5 (Ngay / Tiếp theo / Sau) với người làm và mốc.
3. Danh sách xung đột giữa văn bản này và code/spec hiện có (ví dụ phiên bản, hành vi né vùng gõ, bản đa nhà cung cấp).
4. Không sửa code app. Các câu hỏi mở ghi lại chờ Vinh, không tự quyết.
