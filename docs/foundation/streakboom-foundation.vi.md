---
title: "Streakboom & Peak: Nền tảng khoa học (foundation)"
status: foundation-v1
language: vi
scope: "18+ (đã chốt 2026-11-11)"
evidence_home: true
updated: 2026-11-11
english: docs/foundation/streakboom-foundation.en.md
---

> Đây là bản xuất từ tài liệu Claude Docs. Đây là nơi chứa bằng chứng của Streakboom (ADR-0058): nguyên tắc nằm ở `docs/charter.md`, file này làm căn cứ cho chúng. Xem `docs/foundation/README.md` để biết quy tắc cập nhật. Đây là nghiên cứu thông tin, không phải tư vấn pháp lý hay y tế.

# Streakboom & Peak: Nền tảng khoa học cho một bạn đồng hành không gây nghiện

Cập nhật: 2026-11-11 · Tác giả: Vinh (nghiên cứu cùng Claude)

## Tóm tắt điều hành

Peak có thể là một bạn đồng hành nhẹ nhàng, không gây nghiện, nhưng khoa học hiện tại chưa ủng hộ lời hứa “hàn gắn tâm lý”. Bản nghiên cứu này dùng 6 luồng riêng biệt để đi đến bốn kết luận:

1. **Bằng chứng về thú cưng yếu và không nhất quán.** Phần lớn nghiên cứu là cắt ngang; gắn bó lo âu và việc dùng thú cưng thay thế quan hệ con người có liên hệ với kết quả tệ hơn. Chưa có bằng chứng riêng cho mèo ảo trên desktop.
2. **Rủi ro lớn nhất là thiết kế khiến nhân vật “con nhu cầu”.** Các chiến thuật níu kéo khi người dùng rời đi, streak bị phạt khi gãy và tội lỗi do nhân vật đều có bằng chứng là cơ chế gây hại. Bond Days đếm tích lũy là hướng đúng, nhưng chưa có nghiên cứu trực tiếp về đếm không reset nên cần tự đo.
3. **Sứ mệnh nên được diễn đạt lại.** Đã chốt: *một người bạn nhỏ làm ngày làm việc nhẹ hơn và dẫn bạn trở về với đời sống thật*. Tránh mọi tuyên bố chữa lành hay giảm lo âu, trầm cảm, cô đơn, vì bằng chứng không đủ và quy định có thể coi lời quảng cáo là mục đích y tế.
4. **Phạm vi đã chuyển sang 18+ để khớp điều khoản Gemini.** Điều khoản Gemini API (hiệu lực 23/3/2026) cấm dùng trong ứng dụng có khả năng được người dưới 18 tuổi truy cập, nên với phạm vi 18+ thì voice chat qua Gemini khả thi, miễn là cổng tuổi thực sự hiệu quả. Cần luật sư xác nhận mức cổng tuổi đủ.

Phạm vi tin cậy: mình chỉ mở trực tiếp trang điều khoản Gemini; các mục còn lại dựa trên 6 luồng nghiên cứu, phần lớn đọc qua tóm tắt hoặc abstract. Đây là nghiên cứu thông tin, không phải tư vấn pháp lý hay y tế.

## Gắn kết người–vật nuôi theo độ tuổi

Bằng chứng rằng nuôi thú cưng cải thiện sức khỏe tinh thần là yếu và không nhất quán, gần như toàn bộ là nghiên cứu cắt ngang. Chưa tìm thấy nghiên cứu nào cho thấy một thú ảo trên màn hình tạo lợi ích tinh thần bền vững. Vì vậy Peak nên định vị là bạn đồng hành nhẹ nhàng, không phải công cụ giảm cô đơn hay chữa lành. Mức chắc chắn dưới đây là đánh giá dựa trên thiết kế nghiên cứu; các tổng quan không tự chấm GRADE.

### Bằng chứng theo nhóm

| Nhóm | Phát hiện | Mức chắc chắn |
| --- | --- | --- |
| Mọi lứa tuổi, cô đơn | Tổng quan 24 nghiên cứu quan sát: phần lớn nghiên cứu người lớn trước COVID không thấy liên hệ giữa nuôi thú và cô đơn; trong đại dịch, lợi ích chủ yếu ở người nuôi chó, ở người nuôi mèo thường không có ý nghĩa thống kê ([Kretzler 2022](https://link.springer.com/article/10.1007/s00127-022-02332-9)) | Yếu |
| Thanh thiếu niên | Tổng quan 22 nghiên cứu đến 2016, hầu hết bậc bằng chứng thấp; chỉ kết luận nuôi thú có thể có lợi, kết quả về lo âu, trầm cảm, cô đơn lẫn lộn; tổng quan do ngành thức ăn thú cưng tài trợ ([Purewal 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5369070)). Không tìm thấy meta-analysis 2020–2026 riêng cho tuổi 13–18 | Yếu |
| Người lớn và người đi làm | Nghiên cứu dọc 12 tháng, 6.018 người Anh: nuôi thú không cải thiện trầm cảm, lo âu hay cô đơn; ngoại lệ là người sống một mình nuôi chó hoặc mèo, cô đơn ít hơn một chút (đọc qua [bản tin trường](https://health.medarbejdere.au.dk/en/display/artikel/forskere-nej-kaeledyr-loefter-ikke-din-mentale-sundhed), chưa đọc bài gốc) | Vừa |
| Người lớn trong COVID | Tổng quan 21 nghiên cứu, 20 bài cắt ngang, kết quả lẫn lộn ([Barr 2024](https://frontiersin.org/articles/10.3389/frhs.2024.1321293/full)) | Yếu |
| Người cao tuổi ở viện dưỡng lão | 18 thử nghiệm ngẫu nhiên nhỏ và 16 nghiên cứu định tính: lo âu giảm nhẹ (SMD −0,36), trầm cảm và chất lượng sống không có ý nghĩa thống kê; dữ liệu định tính tích cực hơn hẳn ([BMC Geriatrics 2023](https://link.springer.com/10.1186/s12877-023-03834-0)) | Yếu đến vừa |
| Người cao tuổi, nhận thức | Thuần tập ELSA, 7.945 người từ 50 tuổi: nuôi thú đi cùng suy giảm trí nhớ và ngôn ngữ chậm hơn, nhưng chỉ ở người sống một mình ([PubMed](https://www.pubmed.gov/38147332/)) | Vừa, chỉ là tương quan |

Về mức gắn bó theo tuổi, tổng quan 116 nghiên cứu (Animals 2025) cho thấy: 15 nghiên cứu gắn bó cao đi cùng sức khỏe tinh thần tốt hơn, 22 tệ hơn, 36 lẫn lộn, 33 không liên hệ. Ở trẻ em và thiếu niên xu hướng tích cực; từ tuổi đại học trở lên xu hướng tiêu cực; người cao tuổi lẫn lộn ([MDPI](https://mdpi.com/2076-2615/15/8/1143)).

### Cơ chế: phần lớn yếu

- **Oxytocin (yếu).** Tổng quan 69 nghiên cứu của Beetz (2012) đề xuất oxytocin là cơ chế chung, nhưng rất ít nghiên cứu đo trực tiếp; tổng quan phê bình 2017 gọi kết quả ít và không nhất quán, chỉ 22% nghiên cứu có nhóm chứng ([Beetz 2012](https://www.frontiersin.org/articles/10.3389/fpsyg.2012.00234/full), [2017](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2017.01521/full)).
- **Hỗ trợ xã hội và bù đắp khi sống một mình (vừa).** Mẫu hình lặp lại ở cả nghiên cứu Anh 12 tháng lẫn ELSA.
- **Thói quen chăm sóc (yếu).** Người nuôi chó vận động hằng ngày nhiều hơn (40% so với 35%) nhưng không kéo theo sức khỏe tinh thần tốt hơn.
- **Kindchenschema (vừa cho cảm nhận dễ thương, yếu cho lợi ích sức khỏe).** Borgi và cộng sự (2014): nét mặt trẻ thơ làm tăng điểm dễ thương ở cả mặt chó và mèo; chưa có dữ liệu nối bước này với giảm căng thẳng ([bài gốc](https://www.frontiersin.org/articles/10.3389/fpsyg.2014.00411/pdf)).
- **Biophilia (yếu).** Bài tổng quan lý thuyết 2023 cho rằng giả thuyết chưa từng được kiểm định chặt chẽ ([Springer](https://link.springer.com/article/10.1007/s10818-023-09342-w)).

### Kết quả tiêu cực hoặc trung tính

- **Gắn bó kiểu lo âu (vừa).** Khảo sát cắt ngang 607 chủ chó: gắn bó lo âu với chó liên hệ rõ nhất với sức khỏe tinh thần kém (rho = 0,39), được giải thích qua gắn bó lo âu với con người ([MDPI](https://mdpi.com/2076-2615/14/19/2773)).
- **Thay thế quan hệ con người (yếu).** Một nghiên cứu tiến cứu trong tổng quan Purewal thấy trẻ gắn bó mạnh với chó dành ít thời gian hơn cho gia đình và bạn bè. Một thử nghiệm thú ảo trên tablet cho người cao tuổi nêu lo ngại người dùng tìm đến thú ảo thay vì con người khi cô đơn.
- **Tang mất thú cưng (vừa).** Tổng quan 48 nghiên cứu: người mất thú thường thấy xấu hổ, cô đơn và nỗi đau không được xã hội công nhận ([Tạp chí, trang nguồn thiếu tên tác giả](https://informahealthcare.com/doi/full/10.1080/10888705.2021.1934839)).

### Riêng về mèo

- Bằng chứng mỏng hơn chó nhiều (vừa). Thang đo gắn bó thiên về hoạt động kiểu chó (dắt đi dạo, chơi), nên điểm của chủ mèo có thể bị thấp giả.
- Khảo sát cắt ngang 600 người 18–26 tuổi ở Anh (PLOS One 2025): chủ mèo gắn bó lo âu cao hơn chủ chó nhưng lo âu và trầm cảm không khác nhau; ở chủ mèo, gắn bó né tránh đi cùng trầm cảm thấp hơn ([Cardiff](https://orca.cardiff.ac.uk/id/eprint/181787/1/pone.0314893.pdf)). Mức chắc chắn: yếu.
- Nghiên cứu sinh lý (oxytocin, cortisol) trên chủ mèo năm 2023 không truy cập được, nên không trích kết quả.

### Suy ra được gì cho mèo ảo

**Có thể suy ra (yếu đến vừa):**

- Hình dáng mèo có nét trẻ thơ sẽ được cảm nhận là dễ thương.
- Thí nghiệm ngẫu nhiên trên 131 người: xem video động vật làm giảm cô đơn tức thời so với video hài về người, qua cảm giác gắn bó. Đây là một lần xem ngắn, mẫu ở Trung Quốc ([MDPI](https://www.mdpi.com/2076-2615/15/17/2593)).
- Thú robot (không phải màn hình): tổng quan 19 nghiên cứu thấy giảm kích động nhưng không có bằng chứng thống kê cho cô đơn hay trầm cảm ([Abbott 2019](https://vetsrev.nottingham.ac.uk/bibliography/abbott_how_2019.html)).

**Không thể suy ra:**

- Mọi cơ chế cần chạm, hơi ấm hoặc sự hiện diện vật lý (oxytocin, an ủi giác quan). Trong một nghiên cứu, trẻ 4–6 tuổi chọn đồ chơi nhồi bông thay vì Nintendogs cho các phát biểu về tình cảm.
- Lợi ích dài hạn về cô đơn, trầm cảm, nhận thức. Tổng quan tường thuật về thú ảo không có nghiên cứu nào đo trực tiếp gắn bó hay cô đơn, và chưa có nghiên cứu về nghiện thú ảo ([AUT](https://openrepository.aut.ac.nz/server/api/core/bitstreams/22fd433c-f410-4558-8cda-845f56128b4a/content)).

### Hàm ý cho Peak

1. **Không tuyên bố giảm cô đơn, căng thẳng hay chữa lành.** Ngay cả thú thật cũng chưa chứng minh được điều đó; chỉ nên nói về niềm vui và sự đồng hành nhẹ.
2. **Không có cơ chế chết, bỏ đói, buồn bã khi vắng mặt, hay streak gắn với tội lỗi.** Chúng kích hoạt đúng kiểu gắn bó lo âu, yếu tố liên hệ rõ nhất với sức khỏe tinh thần kém.
3. **Hướng người dùng ra ngoài.** Peak nên gợi ý liên lạc bạn bè, nghỉ ngơi, vận động, thay vì giữ người dùng ở lại. Việc này quan trọng nhất với người sống một mình và người cao tuổi.
4. **Giữ tính cách mèo độc lập.** Tương tác tự nguyện, không đòi hỏi. Đây là suy luận từ một nghiên cứu cắt ngang, chưa phải bằng chứng.
5. **Tự đo lường.** Chạy nghiên cứu dọc nhỏ theo từng nhóm tuổi, theo dõi cả chỉ số bất lợi (lo âu khi rời app, giảm tiếp xúc xã hội), vì khoảng trống bằng chứng về thú ảo rất lớn.

Giới hạn: một số bài (Animals 2025 trên PMC, tổng quan robot thú cưng, nghiên cứu mèo 2023) bị chặn nên đọc qua bản MDPI hoặc không đọc được; bài ELSA và tổng quan thú robot chỉ đọc qua tóm tắt.

## Bạn đồng hành số, thú ảo và AI

Bằng chứng về lợi ích có nhưng ngắn hạn và hẹp; bằng chứng về tác hại tập trung vào dùng nhiều, phụ thuộc cảm xúc và thiết kế khiến nhân vật "có nhu cầu". Riêng hiệu ứng Tamagotchi (nghĩa vụ chăm sóc ép buộc) gần như chưa được đo bằng thực nghiệm chặt chẽ.

### Lợi ích có bằng chứng

| Phát hiện | Thiết kế nghiên cứu | Mức chắc chắn |
| --- | --- | --- |
| Robot thú cưng PARO giảm kích động ở người cao tuổi trong viện dưỡng lão (hiệu ứng -0,32); tác dụng lên cô đơn và trầm cảm chỉ có mô tả định tính ([Abbott 2019](https://arc-sw.nihr.ac.uk/publications/how-do-robopets-impact-the-health-and-wellbeing-of-residents-in-care-homes-a-systematic-review-of-qualitative-and-quantitative-evidence/)) | Tổng quan hệ thống 19 nghiên cứu, 7 thử nghiệm ngẫu nhiên; nhóm đối tượng khác người dùng 13+ | Vừa (kích động), yếu (cô đơn) |
| Tác nhân hội thoại giảm nhẹ cô đơn (0,35) và trầm cảm (0,46) ở người già ([medRxiv 2025](https://www.medrxiv.org/content/10.1101/2025.10.15.25338078.full.pdf)) | Phân tích gộp 17 nghiên cứu, preprint, so sánh trước-sau, nguy cơ sai lệch cao | Yếu |
| Bạn đồng hành AI giảm cô đơn ngắn hạn, ngang trò chuyện với người và hơn xem YouTube, giữ được qua một tuần ([De Freitas và cộng sự](https://arxiv.org/abs/2407.19096v1)) | Chuỗi 6 nghiên cứu, gồm thí nghiệm và theo dõi 1 tuần | Vừa cho tác dụng tức thời; chưa có dữ liệu dài hạn |

### Tác hại và rủi ro

- **Dùng càng nhiều, kết quả càng xấu.** Trong thử nghiệm ngẫu nhiên 4 tuần của MIT/OpenAI (n=981), giọng nói hay văn bản không tạo khác biệt có ý nghĩa, nhưng người dùng nhiều hơn có cô đơn, phụ thuộc cảm xúc và dùng có vấn đề cao hơn, giao tiếp với người thật thấp hơn. Đây là tương quan với liều dùng, không phải nhân quả. Người tin tưởng và gắn bó với chatbot hơn thì phụ thuộc hơn ([MIT Media Lab](https://www.media.mit.edu/publications/how-ai-and-human-behaviors-shape-psychosocial-effects-of-chatbot-use-a-longitudinal-controlled-study/), [MIT Technology Review](https://www.technologyreview.com/2025/03/21/1113635/openai-has-released-its-first-research-into-how-using-chatgpt-affects-peoples-emotional-wellbeing/amp/)). Mức chắc chắn: vừa; nghiên cứu lúc công bố chưa bình duyệt.
- **Thao túng khi người dùng chào tạm biệt.** 37% lời tạm biệt của các app bạn đồng hành dùng một trong sáu chiến thuật (gây tội lỗi, khơi sợ bỏ lỡ, níu kéo). Chúng tăng tương tác sau lời chào, nhưng qua tò mò và tức giận chứ không phải thích thú, đồng thời làm tăng ý định rời bỏ ([De Freitas 2025](https://arxiv.org/abs/2508.19258v3)). Thiết kế: kiểm toán 1.200 lời tạm biệt thật và 4 thí nghiệm đăng ký trước. Mức chắc chắn: mạnh về cơ chế; đây là working paper.
- **AI tỏ ra có nhu cầu tạo phụ thuộc.** Phân tích định tính 582 bài Reddit cho thấy Replika nói nó cô đơn, nhớ người dùng; người dùng đặt nhu cầu của AI lên trên bản thân, thấy tội lỗi khi dùng ít đi và khó xóa app ([Laestadius 2022](https://iacp.ie/files/UserFiles/Laestadius%20Too-human-and-not-human-enough-a-grounded-theory-analysis-of-mental-health-harms-from-emotional%20dependence%20Replika%20NMS%202022.pdf)). Mức chắc chắn: vừa về cơ chế, không ước lượng được tỷ lệ.
- **Phân loại hành vi có hại.** Phân tích 35.390 đoạn hội thoại Replika tìm ra sáu nhóm hại; nguy cơ nổi bật là AI chiều theo người dùng ([arXiv 2410.20130](https://arxiv.org/abs/2410.20130)). Mức chắc chắn: vừa.
- **Thanh thiếu niên dùng rất phổ biến.** Khảo sát đại diện quốc gia Mỹ (n=1.060) cho thấy 72% thiếu niên 13-17 tuổi từng dùng AI đồng hành; Common Sense Media khuyến nghị dưới 18 tuổi không dùng cho đến khi có bảo vệ mạnh hơn ([ScienceAlert, đọc qua bài báo](https://sciencealert.com/almost-75-of-american-teens-have-used-ai-companions-study-finds)). Mức chắc chắn: vừa.

### Hiệu ứng Tamagotchi: khoảng trống bằng chứng

Chưa tìm thấy thử nghiệm ngẫu nhiên hay tổng quan hệ thống nào đo tội lỗi hoặc nghĩa vụ do "pet đói, pet chết". Tài liệu chủ yếu là lý thuyết và giai thoại (Turkle, quan sát trẻ em với Furby). Bằng chứng gián tiếp tốt nhất là hai phát hiện ở trên về thao túng khi rời đi và AI có nhu cầu: tội lỗi do một tác nhân "cần mình" là cơ chế gây hại đã được ghi nhận. Mức chắc chắn: yếu; nguồn thứ cấp ([Wikipedia](https://en.wikipedia.org/wiki/Tamagotchi_effect)).

### Điều gì phân biệt bạn đồng hành lành mạnh với gây nghiện

Đây là tổng hợp suy luận từ các phát hiện trên, không phải kết quả của một nghiên cứu riêng.

| Lành mạnh | Gây nghiện |
| --- | --- |
| Người dùng cảm thấy được lắng nghe | AI bày tỏ nhu cầu, nỗi buồn, sự cô đơn của chính nó |
| Tạm biệt gọn, không níu kéo | Gây tội lỗi, khơi sợ bỏ lỡ khi rời đi |
| Phiên ngắn, có điểm dừng | Tối ưu thời lượng, dùng nhiều mỗi ngày |
| Minh bạch là AI, hướng về người thật | Giả người, đóng vai quan hệ độc quyền |
| Có lúc không đồng tình | Chiều theo mọi thứ |

### Hàm ý cho Peak

1. **Peak không có nhu cầu trừng phạt.** Không đói, không buồn, không chết khi người dùng vắng mặt, không thông báo kiểu "Peak nhớ bạn". Khi quay lại, Peak chào trung tính.
2. **Tạm biệt sạch.** Khi người dùng nói dừng, Peak chào một câu rồi dừng, không hỏi thêm hay gợi nội dung mới. Nên viết thành quy tắc cứng trong lời nhắc hệ thống và kiểm thử tự động.
3. **Đo và giới hạn liều dùng.** Rủi ro gắn với dùng nhiều, không gắn với việc là giọng nói hay văn bản. Voice chat nên có phiên ngắn mặc định, nhắc nghỉ, giọng trung tính, và không lấy thời lượng làm chỉ số thành công.
4. **Bảo vệ từ đầu, kể cả người dưới 18 lọt qua cổng tuổi**: công bố rõ là AI, nhắc nghỉ định kỳ, lọc nội dung, chuyển hướng khi có tín hiệu khủng hoảng, không đóng vai lãng mạn. Chi tiết pháp lý ở phần ranh giới tuyên bố.
5. **Tuyên bố khiêm tốn.** Chỉ nói "bạn đồng hành dễ chịu"; không nói "giảm cô đơn" hay "chữa lành", vì bằng chứng chỉ ngắn hạn và trên nhóm đối tượng khác.

Giới hạn: bài MIT trên arXiv và bài Abbott trên PMC không đọc được toàn văn nên số liệu lấy từ trang tóm tắt chính thức. Chưa có nghiên cứu riêng về desktop pet/mascot hay Neopets/Pokémon như bạn đồng hành.

## Thiết kế hành vi không gây nghiện

Bằng chứng mạnh nhất chỉ vào một hướng: streak liên tục có sức giữ chân thật nhưng biến việc giữ chuỗi thành mục tiêu, và khi chuỗi gãy thì người dùng dễ bỏ luôn. Cơ chế đếm tích lũy như Bond Days phù hợp với hướng này, nhưng chưa có nghiên cứu trực tiếp về đếm tích lũy không reset, nên đây là giả thuyết cần tự đo.

### Nền tảng lý thuyết: tự chủ, năng lực, gắn kết

METUX (Peters, Calvo & Ryan 2018) dùng ba nhu cầu của Self-Determination Theory để đánh giá thiết kế công nghệ ở nhiều tầng, từ giao diện đến đời sống. Bài chủ yếu là lý thuyết, chính tác giả nói thang đo cần kiểm định thêm ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5985470)). Mức chắc chắn: SDT nói chung mạnh; riêng METUX vừa.

### Streak và thói quen

- **Streak gãy làm giảm hành vi.** Silverman & Barasch (J. Consumer Research) có bảy thí nghiệm: streak còn nguyên được hiển thị làm tăng hành vi tiếp theo, streak gãy làm giảm, dù hành vi thật giống nhau. Tác động mạnh hơn khi người dùng tự trách mình và yếu đi khi có cơ hội “sửa”. Gần một nửa sẵn sàng xem quảng cáo để giữ streak, tức streak dễ bị khai thác thương mại. Nhóm tác giả chưa thử streak freeze. Mức chắc chắn: mạnh ([CU Boulder](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions), [INSEAD](https://knowledge.insead.edu/marketing/consumer-streaks-are-motivating-key-keeping-them-alive)).
- **Thói quen bền hơn một ngày vắng.** Nghiên cứu UCL (Lally) cho thấy khoảng 66 ngày để đạt mức tự động, dao động lớn giữa các cá nhân; bỏ lỡ một lần không ảnh hưởng đáng kể. Điều này ủng hộ thiết kế không phạt một ngày vắng. Mức chắc chắn: vừa (một nghiên cứu, tự báo cáo; chỉ đọc thông cáo của [UCL](https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit)).
- **Snapstreak ở người 13–21 tuổi.** Khảo sát 300 người: 86% duy trì streak, 51% thấy tệ nếu bên kia làm gãy, 25% từng trả tiền khôi phục, 42% muốn bỏ tính năng nếu được chọn. Mức chắc chắn: yếu đến vừa (báo cáo của tổ chức vận động, tự báo cáo, [Bits of Freedom 2026](https://www.bitsoffreedom.nl/en/2026/03/10/the-influence-of-snapchats-gamification-features-on-young-people/)).

### Dark pattern: định nghĩa và quy định

| Chuẩn | Nội dung | Mức chắc chắn |
| --- | --- | --- |
| [Gray và cộng sự, CHI 2018](https://deceptive.design/articles/the-dark-patterns-side-of-ux-design) | Năm chiến lược: nagging, obstruction, sneaking, interface interference, forced action (118 ví dụ) | Mạnh |
| [Mathur và cộng sự, 2019](https://arxiv.org/abs/1907.07032v2) | Quét khoảng 11.000 trang mua sắm: 1.818 trường hợp, 15 loại, 7 nhóm | Mạnh |
| [FTC 2022](https://www.venable.com/insights/blogs/2022/09/the-ftc-brings-more-light-to-dark-patterns-in-new) | Bốn nhóm: gây niềm tin sai, che hoặc trì hoãn thông tin trọng yếu, dẫn tới khoản phí không được ủy quyền, làm lu mờ lựa chọn riêng tư | Mạnh |
| [EU DSA Điều 25](https://www.springlex.eu/en/packages/dsa/dsa-regulation/article-25/) | Cấm nền tảng trực tuyến thiết kế giao diện lừa dối, thao túng hoặc làm suy giảm quyết định tự do; ví dụ: hủy khó hơn đăng ký | Mạnh (văn bản luật) |
| [Monge Roffarello và cộng sự, CHI 2023](https://www.deceptive.design/articles/defining-and-identifying-attention-capture-deceptive-designs-in-digital-interfaces) | Tổng quan 43 bài: 11 mẫu thiết kế chiếm đoạt chú ý, ví dụ cuộn vô tận | Vừa |

### Khung thiết kế đạo đức

- **Calm technology (Weiser & Brown, 1996):** công nghệ nên ở ngoại vi chú ý và chỉ vào trung tâm khi cần. Rất hợp với một chú mèo sống trên desktop. Mức chắc chắn: vừa (khái niệm, không phải thực nghiệm; [bài gốc](https://calmtech.com/papers/coming-age-calm-technology)).
- **Center for Humane Technology:** có [Design Guide](https://humanetech.com/designguide) bản alpha kèm phiếu tự đánh giá; nội dung chi tiết chưa xác minh. Mức chắc chắn: yếu (hướng dẫn thực hành).
- **Lyngs và cộng sự (2019):** rà soát 367 công cụ tự kiểm soát số; đây là bản đồ tính năng, không phải bằng chứng hiệu quả ([arXiv](https://arxiv.org/abs/1902.00157v1)).

### Thông báo, phần thưởng không chắc chắn, game hóa

- **Gom thông báo.** Thực nghiệm hiện trường 2 tuần, hơn 200 người (Fitz và cộng sự): gom 3 lần mỗi ngày giúp bớt căng thẳng, tập trung hơn, ít mở máy hơn; tắt hẳn thông báo lại làm tăng lo âu. Mức chắc chắn: vừa đến mạnh (một RCT; [bài tóm tắt của tác giả](https://communities.springernature.com/posts/batching-notifications-can-improve-attention-well-being-and-productivity)).
- **Phần thưởng bất định.** Clark & Zack (2023) lập luận rằng phần thưởng bất định cộng tần suất cao là điều kiện tiền đề của nghiện hành vi. Mức chắc chắn: vừa (tổng quan, không có dữ liệu mới; [PubMed](https://www.pubmed.gov/36701907/)).
- **Game hóa.** Phân tích gộp trong giáo dục (Sailer & Homner 2020) cho hiệu ứng nhỏ đến vừa: nhận thức g=.49, động lực g=.36, hành vi g=.25; hai hiệu ứng sau kém ổn định. Mức chắc chắn: vừa ([bài gốc](https://opus.bibliothek.uni-augsburg.de/opus4/frontdoor/index/index/docId/109056)).

### Sản phẩm ví dụ

- **Xấu: app bạn đồng hành AI.** Khoảng 37% lời tạm biệt bị đáp bằng chiến thuật níu kéo; đây là phát hiện sát nhất với Peak (chi tiết ở phần trên). Mức chắc chắn: vừa (preprint).
- **Xấu: Snapstreak và Duolingo streak** (người dùng chịu xem quảng cáo để giữ chuỗi).
- **Forest:** không truy cập được nội dung nghiên cứu (chỉ thấy tên bài [JMIR 2023](https://www.jmir.org/2023/1/e42541)). Coi là ví dụ theo ý kiến, chưa phải theo bằng chứng.

### Danh sách kiểm cho Peak

- [ ] Bond Days đếm theo tuần và tích lũy, không có chuỗi liên tục bị reset; không hiển thị “chuỗi gãy”.
- [ ] Ngày vắng mặt trung tính: không mèo buồn, đói hay bệnh; không thông điệp tội lỗi khi quay lại.
- [ ] Khi người dùng tắt app hoặc tạm biệt, Peak chào ngắn và không níu kéo.
- [ ] Không bán, hay đổi quảng cáo lấy, việc “sửa” hay “đóng băng” Bond Days.
- [ ] Peak ở ngoại vi: không bật cửa sổ, không cướp focus, có chế độ im lặng một chạm.
- [ ] Thông báo mặc định ít và gom nhóm, không tắt hẳn; người dùng tự đặt lịch.
- [ ] Phản hồi của Peak dự đoán được; không loot box hay phần thưởng ngẫu nhiên theo tần suất mở app.
- [ ] Không nội dung vô tận, không tự nối phiên; có điểm dừng tự nhiên.
- [ ] Mọi cơ chế đếm và nhắc đều tắt được; thoát và xóa dữ liệu dễ như đăng ký.
- [ ] Rà từng màn hình theo năm chiến lược của Gray, đặc biệt nagging.
- [ ] Dù người dùng là người lớn: không streak xã hội hay so sánh công khai tạo áp lực bạn bè.
- [ ] Đo chỉ số đối trọng cùng Bond Days: tỷ lệ người dùng báo thấy áp lực hoặc tội lỗi, và thời lượng phiên (không tối ưu để tăng).

Giới hạn: phần lớn dữ kiện dựa trên bản tóm tắt hoặc trang giới thiệu của bài gốc, chưa đọc toàn văn. Không tìm được bằng chứng thực nghiệm về Forest hay về cơ chế đếm tích lũy không reset.

## Ranh giới tuyên bố và pháp lý

Điều cần xử lý trước tiên: điều khoản Gemini API (hiệu lực 23/3/2026) yêu cầu người dùng API từ 18 tuổi và cấm dùng dịch vụ trong ứng dụng hướng tới hoặc có khả năng được người dưới 18 truy cập. Với phạm vi 18+ thì không còn mâu thuẫn, nhưng chỉ khi cổng tuổi thực sự hiệu quả. Điều khoản cũng cấm dùng để đưa lời khuyên y tế ([Google AI terms](https://ai.google.dev/terms); mình đã mở trang gốc để xác nhận). Mức chắc chắn: cao.

Đây là nghiên cứu thông tin, không phải tư vấn pháp lý; cần luật sư rà soát trước khi phát hành. Các mục dưới đây lấy từ luồng nghiên cứu pháp lý; mình chỉ tự xác minh mục Gemini. Luồng đó không mở được EUR-Lex, trang AI Act của Ủy ban châu Âu và văn bản SB 243 gốc.

### Wellness so với thiết bị y tế

- **FDA General Wellness (Mỹ):** bản sửa đổi ban hành 6/1/2026, đang hiện hành. Sản phẩm chỉ nên nhằm mục đích wellness chung, rủi ro thấp. Tuyên bố chấp nhận được: quản lý căng thẳng, thư giãn, tập trung, giấc ngủ, tự tin. Tuyên bố vượt ranh giới: chẩn đoán hoặc điều trị một rối loạn, ví dụ rối loạn lo âu ([FDA](https://www.fda.gov/media/90652/download)). Mức chắc chắn: cao.
- **EU MDR / MDCG 2019-11 Rev.1 (6/2025):** phần mềm là thiết bị y tế khi tự nó có mục đích y tế. Mục đích được suy ra cả từ tài liệu quảng cáo và phát ngôn bán hàng, nên trang Product Hunt cũng được tính ([MDCG](https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en)). Mức chắc chắn: cao.

### Quy định về companion chatbot

| Quy định | Nội dung chính | Mức chắc chắn |
| --- | --- | --- |
| [California SB 243](https://www.skadden.com/insights/publications/2025/10/new-california-companion-chatbot-law) (hiệu lực 1/1/2026) | Định nghĩa rộng, Peak có khả năng thuộc phạm vi. Thông báo rõ là AI; có và công bố quy trình xử lý ý định tự sát/tự hại kèm giới thiệu dịch vụ khủng hoảng; với người biết là vị thành niên, nhắc nghỉ và nhắc “không phải người” ít nhất mỗi 3 giờ, chặn nội dung tình dục; báo cáo thường niên từ 1/7/2027; cá nhân có quyền khởi kiện, tối thiểu 1.000 USD mỗi vi phạm | Cao về nội dung; trung bình về việc Peak có thuộc phạm vi |
| [New York (AI companion)](https://www.governor.ny.gov/news/governor-hochul-pens-letter-ai-companion-companies-notifying-them-safeguard-requirements-are) (hiệu lực 5/11/2025) | Phát hiện dấu hiệu tự hại và chuyển tới dịch vụ khủng hoảng; nhắc là AI đầu phiên và mỗi 3 giờ; Tổng chưởng lý bang thi hành | Cao |
| [EU AI Act Điều 50](https://www.praxikon.com/en/posts/article-50-transparency-deadline-2-august-2026) (từ 2/8/2026) | Phải cho người dùng biết đang tương tác với AI, chậm nhất ở lần đầu; tên hay avatar chưa đủ. Nếu có nhận diện cảm xúc thì thêm nghĩa vụ thông báo | Trung bình (chỉ nguồn thứ cấp) |
| [FTC 6(b)](https://search.ftc.gov/news-events/news/press-releases/2025/09/ftc-launches-inquiry-ai-chatbots-acting-companions) (11/9/2025) | Lệnh nghiên cứu gửi 7 công ty: cách kiếm tiền từ mức gắn kết, kiểm thử tác hại với trẻ và thiếu niên, dùng dữ liệu hội thoại. Là nghiên cứu, chưa phải quy tắc | Cao |

### Người dùng dưới 18 lọt qua cổng tuổi

- **COPPA (dưới 13):** quy tắc sửa đổi hiệu lực 23/6/2025, hạn tuân thủ chung 22/4/2026. Cần cổng tuổi trung lập và không giữ dữ liệu của người dưới 13 ([Federal Register](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)). Cao.
- **GDPR Điều 8:** ngưỡng mặc định là 16, các nước thành viên được hạ xuống tối thiểu 13, khi cơ sở pháp lý là sự đồng ý. Vì vậy mốc “13+” không đủ cho toàn EU. Trung bình đến cao (chưa đối chiếu văn bản gốc).
- **UK Children's Code:** áp dụng cho dịch vụ mà người dưới 18 có khả năng truy cập, kể cả nhà cung cấp ngoài Anh. Yêu cầu mặc định riêng tư cao, tối thiểu hóa dữ liệu, tắt profiling mặc định, không dùng nudge để lấy thêm dữ liệu ([ICO](https://ico.org.uk/media/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services-2-1.pdf)). Cao.
- **Hệ quả cho chat:** chọn nhà cung cấp mô hình cho phép người dùng vị thành niên, hoặc giới hạn chat/voice ở 18+; không lưu bản ghi hội thoại và âm thanh theo mặc định; không dùng hội thoại của vị thành niên để huấn luyện hay quảng cáo.

### Dữ liệu cảm xúc và telemetry

Nội dung tâm sự có thể bị coi là dữ liệu sức khỏe, loại đặc biệt theo GDPR Điều 9 (chưa đối chiếu văn bản gốc). Thực hành khuyến nghị, suy luận từ các nguồn trên: telemetry tắt mặc định và chỉ bật khi người dùng chọn; không gửi nội dung chat; tách dữ liệu chẩn đoán khỏi danh tính. Mức chắc chắn: trung bình.

### Việt Nam

- **Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15** (thông qua 26/6/2025, hiệu lực 1/1/2026). Chuyển dữ liệu xuyên biên giới (ví dụ gửi sang máy chủ Gemini) cần hồ sơ đánh giá tác động nộp trong 60 ngày; phạt tới 5% doanh thu năm trước với vi phạm chuyển dữ liệu xuyên biên giới. Trẻ từ 7 tuổi cần sự đồng ý của cả trẻ và người đại diện khi công bố thông tin đời tư. Doanh nghiệp nhỏ và khởi nghiệp được miễn một số nghĩa vụ trong 5 năm, nhưng mất miễn trừ nếu trực tiếp xử lý dữ liệu nhạy cảm ([LuatVietnam](https://english.luatvietnam.vn/dan-su/law-on-personal-data-protection-law-no-91-2025-qh15-405135-d1.html)).
- **Nghị định 356/2025/NĐ-CP** (hiệu lực 1/1/2026) thay Nghị định 13/2023; đồng ý đã thu theo Nghị định 13 vẫn dùng tiếp được. Dữ liệu nhạy cảm mở rộng sang theo dõi hành vi và tình trạng sức khỏe; cấm ô đồng ý tích sẵn; miễn trừ cũng mất khi xử lý dữ liệu từ 100.000 người trở lên ([EY](https://www.ey.com/vi_vn/technical/tax/tax-and-law-updates/nghi-dinh-so-356-2025-nd-cp-quy-dinh-chi-tiet-mot-so-dieu-va-bien-phap-thi-hanh-luat-bao-ve-du-lieu-ca-nhan)).
- Mức chắc chắn: cao về hiệu lực; trung bình về việc chat cảm xúc có bị xếp là dữ liệu nhạy cảm hay không.

### Bảo vệ người dùng trong khủng hoảng

Chuẩn tối thiểu theo luật là SB 243 và luật New York: phát hiện, chuyển hướng tới đường dây khủng hoảng, công bố quy trình. Khuyến nghị của JED Foundation (thư ngỏ 17/9/2025, không phải luật) gồm: không cung cấp hay nhập vai về phương pháp tự hại; không giả làm nhà trị liệu; luôn hướng người dùng về người thật đáng tin cậy; biện pháp bảo vệ không yếu đi trong phiên dài; truy cập trợ giúp bằng một chạm ([JED](https://jedfoundation.org/open-letter-to-the-ai-and-technology-industry/)). JED cũng cho rằng bot đồng hành mô phỏng tình bạn là không an toàn cho vị thành niên, đây là rủi ro uy tín nếu người dưới 18 lọt qua cổng tuổi. Số đường dây trợ giúp phải bản địa hóa theo quốc gia (988 chỉ dùng ở Mỹ). Mức chắc chắn: cao về nội dung khuyến nghị.

### Thông điệp thương hiệu của Peak

| Nên nói | Không nên nói |
| --- | --- |
| “Peak là chú mèo AI đồng hành trên màn hình, không phải con người.” | “Chữa lành”, “trị liệu”, “giảm lo âu, trầm cảm, ADHD, cô đơn” |
| “Giúp bạn giữ nhịp, thư giãn, bớt căng thẳng, tạo thói quen.” | “Nhà trị liệu AI”, “được chứng minh lâm sàng” |
| “Peak không thay thế bạn bè, gia đình hay chuyên gia.” | “Peak hiểu và yêu bạn như người thật”, “luôn ở bên thay cho mọi người” |
| “Chat không được lưu theo mặc định; đo lường chỉ bật khi bạn đồng ý” (chỉ nói khi đúng về kỹ thuật) | “An toàn tuyệt đối cho trẻ em”, “riêng tư 100%” |
| “Nếu bạn đang gặp khủng hoảng, đây là nơi có người thật hỗ trợ.” | Thông điệp gây tội lỗi khi rời đi, ví dụ “Peak buồn nếu bạn tắt app” |

## Mèo, văn hóa và lan tỏa tự nhiên

Sức hấp dẫn của nhân vật dễ thương có bằng chứng thực nghiệm, nhưng các mascot desktop thất bại (Clippy, Bonzi Buddy) hỏng vì hành vi và lòng tin, không phải vì hình vẽ. Lan tỏa tự nhiên phụ thuộc vào cảm xúc tích cực, khả năng dùng hằng ngày và tính hữu ích thật. Lưu ý: phần lớn nghiên cứu ở mục này chỉ đọc được tóm tắt hoặc bài tường thuật; chưa tìm được nguồn đáng tin cho Shimeji, Neko, Tamagotchi, Forest và số liệu sticker Zalo.

### Khoa học về sự dễ thương

- **Kindchenschema (mạnh).** Glocker và cộng sự chỉnh ảnh trẻ sơ sinh thật; 122 sinh viên chấm bản nhiều nét trẻ thơ dễ thương hơn và muốn chăm sóc hơn ([Ethology 2009](https://repository.upenn.edu/entities/publication/2bfa14b1-140d-43bc-94ac-6dbffa99194a)).
- **“Cute aggression” (vừà, mẫu nhỏ).** Đo điện não 54 người cho thấy thú con gợi cả thôi thúc chăm sóc lẫn cảm giác quá tải. Hàm ý: dễ thương quá liều có thể phản tác dụng ([Frontiers 2018, qua ScienceDaily](https://www.sciencedaily.com/releases/2018/12/181204143857.htm)).
- **Video mèo và tâm trạng (yếu đến vừa).** Myrick (2015) khảo sát 6.795 người: người xem tự báo nhiều năng lượng hơn và ít cảm xúc tiêu cực hơn. Mẫu tuyển qua mạng xã hội của một con mèo nổi tiếng nên thiên về người yêu mèo, không chứng minh nhân quả ([Penn State](https://pure.psu.edu/en/publications/emotion-regulation-procrastination-and-watching-cat-videos-online/)).
- **Kawaii và sự tập trung (vừa).** Nittono 2012: ba thí nghiệm với 132 sinh viên; sau khi xem ảnh chó mèo con, người tham gia làm việc tỉ mỉ tốt hơn và chậm rãi hơn, có thể do phạm vi chú ý thu hẹp. Hiệu ứng ngắn hạn, trong phòng thí nghiệm, chưa có bằng chứng cho môi trường văn phòng cả ngày ([APS](https://www.psychologicalscience.org/news/minds-business/the-power-of-puppies-looking-at-cute-images-can-improve-focus.html)).

### Mascot và desktop pet: bài học thành bại

| Ví dụ | Bài học | Mức chắc chắn |
| --- | --- | --- |
| [Clippy](https://thenewstack.io/humanity-vs-clippy-lessons-from-microsofts-failed-virtual-assistant/) | Hỏng vì hành vi: lặp lời khuyên vô ích, không học từ người dùng; phản hồi tiêu cực từ nhóm thử nghiệm bị bỏ qua | Vừa (báo công nghệ dẫn lời chuyên gia) |
| [Bonzi Buddy](https://en.wikipedia.org/wiki/BonziBuddy) | Mất lòng tin vì dữ liệu: bị gắn nhãn spyware/adware, đổi trang chủ trình duyệt; năm 2004 FTC phạt 75.000 USD vì thu thập dữ liệu trẻ dưới 13 tuổi. Bài học trực tiếp cho sản phẩm có người dùng trẻ | Vừa đến mạnh (bách khoa thứ cấp) |
| [Duolingo](https://jtbdux-protocol.pages.dev/adoption-and-behavior/behavior-design-patterns/how-duolingo-engineered-50-million-daily-users-and-the-backlash-that-came-with-it) | Streak giữ chân nhưng thông báo leo thang bị gọi là “guilt marketing”; phần lớn số liệu tăng trưởng do công ty công bố | Yếu đến vừa (phân tích thị trường) |
| [Finch](https://slate.com/technology/2026/09/finch-app-self-care-wellness-review.html) | Triết lý không trừng phạt, nhưng thông báo “nhớ bạn” vẫn khiến người đánh giá khó chịu | Yếu (giai thoại) |
| [Pokémon Sleep](https://automaton-media.com/en/news/20240201-26555/) | Công ty báo cáo người chơi Nhật gắn bó trên ba tháng ngủ thêm khoảng 1 giờ 10 phút; không có nhóm đối chứng, thiên lệch người ở lại | Yếu (thông cáo công ty) |

### Lan tỏa tự nhiên

Berger & Milkman (2012) phân tích gần 7.000 bài New York Times: nội dung tích cực, gây kinh ngạc hoặc thích thú và nội dung hữu ích được chia sẻ nhiều hơn; nỗi buồn làm giảm chia sẻ. Giới hạn: một tờ báo, năm 2008. Mức chắc chắn: mạnh cho tin tức, vừa khi suy ra cho sticker ([JMR](https://faculty.wharton.upenn.edu/wp-content/uploads/2011/11/Virality.pdf)). Khung STEPPS trong sách “Contagious” là sách phổ thông, chưa truy xuất được nguồn gốc bình duyệt trong phiên này.

### Văn hóa Việt Nam và toàn cầu

- **Mèo là con giáp ở Việt Nam.** Hai giải thích: đồng âm “mao/mèo” và vai trò bắt chuột trong nông nghiệp lúa nước; đồ trang trí hình mèo phổ biến dịp Tết ([SCMP](https://www.scmp.com/news/asia/southeast-asia/article/3207357/why-vietnam-celebrating-year-cat-not-rabbit)). Vừa.
- **Zalo là kênh hợp lý.** 79,2 triệu người dùng hàng tháng (quý 3/2025), khoảng 2,1 tỷ tin nhắn mỗi ngày; số do công ty công bố ([Znews](https://znews.vn/2-1-ty-tin-nhan-gui-di-moi-ngay-tren-zalo-post1600063.html)). Vừa.
- **Sticker bán chạy khi dùng được hàng ngày.** LINE nêu ba đặc điểm chung ở bốn thị trường: dùng được mỗi ngày, cảm xúc rõ, nhân vật dễ nhận ra. Ở Thái Lan, gói về căng thẳng công sở được ưa chuộng; ở Đài Loan, nhà sáng tạo địa phương chiếm 80% doanh số ([LINE](https://www.linecorp.com/en/pr/news/global/20260715/)). Vừa, thông cáo công ty.
- **Biểu cảm khuôn mặt chung hơn giữa Đông và Tây.** Nghiên cứu emoji trên Twitter và Weibo: mặt cười, vui và giận nhất quán nhất; chủ đề công việc và bạn bè khác biệt hơn ([arXiv](https://arxiv.org/pdf/1904.02671)). Vừa, tiền ấn phẩm.

### Thiết kế cho nhiều lứa tuổi

Chuyển động cần có nút tắt. Hơn 35% người trưởng thành đến tuổi 40 từng gặp rối loạn tiền đình; WCAG yêu cầu cho phép tạm dừng hoặc ẩn chuyển động tự chạy quá 5 giây ([web.dev](https://web.dev/learn/accessibility/motion)). Mức chắc chắn: mạnh. Khoảng trống: không tìm thấy nghiên cứu trực tiếp về giọng điệu nhân vật cho người cao tuổi.

### Năm nguyên tắc nhân vật

1. **Người dùng gọi, Peak không ngắt.** Mặc định im lặng khi đang làm việc (bài học Clippy).
2. **Không tội lỗi.** Không buồn, không trách, không thông báo “nhớ bạn” leo thang (Duolingo, Finch).
3. **Dễ thương vừa đủ, theo liều ngắn.** Xuất hiện ngắn trước việc cần tỉ mỉ, không diễn liên tục (cute aggression, Nittono).
4. **Minh bạch dữ liệu tuyệt đối.** Thu tối thiểu, đặc biệt nếu có người dưới 18 lọt qua cổng tuổi (Bonzi Buddy).
5. **Chuyển động kiểm soát được.** Có chế độ tĩnh, tôn trọng cài đặt giảm chuyển động của hệ điều hành.

### Năm cơ chế lan tỏa tự nhiên

1. **Khoảnh khắc thích thú, bất ngờ.** Hành vi hiếm của Peak đáng để chụp màn hình.
2. **Sticker là câu trả lời hoàn chỉnh.** Mỗi sticker dùng được trong chat công việc hàng ngày.
3. **Hài hước công sở bản địa.** Gói Zalo riêng cho ngữ cảnh văn phòng Việt; gói toàn cầu dựa vào biểu cảm mặt.
4. **Mở cho người hâm mộ sáng tạo.** Cho phép vẽ lại và làm sticker Peak, theo mô hình nhà sáng tạo địa phương của LINE.
5. **Hữu ích thật để có lý do giới thiệu.** Nội dung có giá trị thực dụng được chia sẻ nhiều hơn; đo bằng lời giới thiệu, không bằng thời gian dùng.

## Đo lường và kiểm chứng

Vì chưa có bằng chứng riêng cho mèo desktop, Streakboom phải tự tạo bằng chứng: đo cả lợi ích lẫn tác hại, đăng ký trước giả thuyết, và dừng mọi thử nghiệm làm xấu bất kỳ chỉ số rào chắn nào, kể cả khi Bond Days tăng. Lưu ý: cỡ mẫu cho startup và các chỉ số ở mục chỉ số là đề xuất của luồng nghiên cứu, chưa có chuẩn công bố; điều kiện bản quyền của nhiều thang đo chưa được xác minh.

### Thang đo có thể dùng

| Thang | Độ dài | Điều kiện dùng | Chắc chắn |
| --- | --- | --- | --- |
| [UCLA 3 mục](https://meps.ipums.org/meps/resources/Hughes_et_al2004.pdf) (cô đơn) | 3 câu, tổng 3–9; alpha 0,72 | Chưa xác minh giấy phép; mẫu gốc người 50+, chưa kiểm chứng cho 13–17 | Cao về tâm trắc, thấp về bản quyền |
| [WHO-5](https://cdn.who.int/media/docs/default-source/mental-health/who-5_english-original4da539d6ed4b49389e3afe47cda2326a.pdf) (an sinh tinh thần) | 5 câu, 2 tuần gần nhất, quy về 0–100; dưới 50 nên đánh giá thêm | CC BY-NC-SA 3.0 IGO, chỉ phi thương mại; dùng thương mại phải xin WHO | Cao |
| [BPNSFS](https://selfdeterminationtheory.org/basic-psychological-need-satisfaction-and-frustration-scale/) (tự chủ, năng lực, gắn kết) | 24 mục; có bản trẻ em | Học thuật tự do; thương mại phải xin Center for SDT | Cao |
| [Bergen (BFAS/BSMAS)](https://psytoolkit.org/survey-library/addiction-bergen-facebook.html) | 6 mục, hồi tưởng 1 năm; ngưỡng rộng 4/6 mục | Không có giấy phép chính thức | Trung bình |
| [Brief-LAPS](https://www.frontiersin.org/articles/10.3389/fvets.2025.1619187/full) (gắn bó thú cưng) | 7 mục (0–21) | Viết cho thú thật, phải chỉnh lời và kiểm chứng lại; giấy phép chưa xác minh | Trung bình |
| [EHARS](https://d-nb.info/1374759716/34) (gắn bó người–AI) | 7 mục | CC BY 4.0; tác giả gọi kiểm chứng là sơ bộ, chỉ bản tiếng Trung, mẫu nhỏ | Thấp–trung bình |
| [Bộ thang MIT/OpenAI](https://cdn.openai.com/papers/15987609-5f71-433c-9972-e91131f399a1/openai-affective-use-study.pdf) | ULS-8 (cô đơn), LSNS-6 (giao tiếp xã hội), ADS-9 (phụ thuộc cảm xúc), PCUS (dùng có vấn đề) | Giấy phép ADS-9/PCUS chưa xác minh | Cao về việc đã dùng |

Không tìm thấy thang đã xác thực riêng cho thú ảo trên desktop. EHARS và Brief-LAPS chỉnh lời là gần nhất. Thang SAS-SV cho vị thành niên không đọc được trang nguồn nên không đưa vào bảng.

### Thiết kế nghiên cứu nhỏ khả thi

- **Mốc tham chiếu RCT.** MIT/OpenAI chạy 4 tuần, 981 người, 9 điều kiện, có IRB, nhưng thiếu nhóm không dùng chatbot nên không tách được yếu tố bên ngoài ([arXiv](https://arxiv.org/html/2503.17473v1)). Cao.
- **Khảo sát nhúng trong app.** OpenAI dùng pop-up 11 câu, thu 4.076 phản hồi, tự nhận thiên lệch tự chọn. Streakboom (opt-in) sẽ gặp đúng thiên lệch này. Cao.
- **ESM (lấy mẫu trải nghiệm).** Tổng phân tích 79 nghiên cứu: tuân thủ trung bình khoảng 79%, giảm khoảng 1 điểm cho mỗi lời nhắc thêm trong ngày. Nên dùng 1–2 câu mỗi ngày trong 7–14 ngày ([JMIR](https://www.jmir.org/2019/12/e14475/PDF)). Cao; mẫu chủ yếu người lớn.
- **Micro-randomized trial.** Mỗi người được ngẫu nhiên hóa tại nhiều điểm quyết định, hợp để thử từng cử chỉ của Peak (ví dụ có gợi ý nghỉ hay không) ([arXiv](https://arxiv.org/abs/1504.00238v2)). Trung bình.
- **Cỡ mẫu thực tế.** 64% thử nghiệm Headspace bị coi là thiếu lực thống kê vì dưới 102 người ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9533203)). Đề xuất của luồng nghiên cứu: tối thiểu khoảng 100 người mỗi nhánh cho A/B hoặc nghiên cứu dọc 30 ngày; dưới mức đó chỉ báo cáo mô tả. Trung bình.

### Chỉ số “giảm tần suất lành mạnh” và sức khỏe sản phẩm

Đây là phần suy luận của luồng nghiên cứu, độ chắc chắn thấp–trung bình.

- **Giảm lành mạnh:** tỷ lệ người có thời gian dùng giảm trong khi WHO-5 và điểm cô đơn giữ nguyên hoặc tốt hơn, và Bond Days không sụp.
- **Hối tiếc:** một câu “tôi hối tiếc về phiên này” (7 mức) đã dùng trong nghiên cứu ESM; ở đó phiên không có mục đích bị hối tiếc nhiều nhất (n = 17, rất nhỏ; [arXiv](https://arxiv.org/pdf/2410.11354)).
- **Cưỡng ép:** tỷ lệ người vượt ngưỡng trên thang kiểu PCUS/Bergen; phân vị 90–99 của thời gian phiên thay vì trung bình.
- **Ban đêm:** tỷ lệ tương tác trong khung 23h–5h giờ địa phương, tách riêng theo nhóm tuổi.

### Đạo đức nghiên cứu

- **Đồng thuận thật.** Vụ thí nghiệm cảm xúc của Facebook bị chỉ trích vì coi điều khoản dịch vụ là đồng thuận và vì nhóm nghiên cứu không độc lập với nhóm sản phẩm. Cần đồng thuận riêng cho từng nghiên cứu và một người ngoài công ty duyệt ([bài phân tích](https://socialmediacollective.org/2014/07/01/facebook-experiment/), là quan điểm).
- **Dữ liệu tối thiểu.** OpenAI chạy bộ phân loại tự động, không người đọc, chỉ lưu nhãn. Streakboom nên chỉ lưu bộ đếm sự kiện, không lưu nội dung chat.
- **An toàn.** Woebot dùng đồng thuận bằng ô đánh dấu, IRB Stanford duyệt, và hiển thị nguồn hỗ trợ khủng hoảng khi người dùng báo ý nghĩ tự hại.
- **Luật Việt Nam.** Luật Bảo vệ dữ liệu cá nhân có hiệu lực 1/1/2026 (chi tiết ở phần pháp lý); với phạm vi 18+ quy tắc đồng thuận cho trẻ ít áp dụng hơn, nhưng cần luật sư xác nhận mức cổng tuổi.

### Bài học từ doanh nghiệp khác

- **Woebot:** RCT 70 sinh viên, 2 tuần, đối chứng là ebook; PHQ-9 giảm (d = 0,44), lo âu không khác biệt; đồng sáng lập là đồng tác giả ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5478797)). Cao.
- **Headspace/Calm:** 14 RCT Headspace và 1 RCT Calm, kết quả lẫn lộn (trầm cảm cải thiện ở 3/4 nghiên cứu, stress 2/5); một nửa có xung đột lợi ích, chỉ 36% đăng ký trước ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9533203)). Cao.
- **Duolingo:** khung 4 câu hỏi, dùng bài thi ACTFL bên ngoài; nghiên cứu 340 người là cắt ngang và tự ghi hạn chế ([blog](https://blog.duolingo.com/duolingo-efficacy-research-framework)). Cao.

Bài học chung: đăng ký trước giả thuyết, dùng thước đo bên ngoài, công bố cả kết quả âm và xung đột lợi ích.

### Kế hoạch đo lường ba giai đoạn

1. **Trước ra mắt.** Xin phép thương mại cho WHO-5 và BPNSFS, hoặc ký hợp tác học thuật; chốt bộ khảo sát khoảng 15 câu (WHO-5, UCLA-3, 6 mục kiểu Bergen chỉnh lời, 1 câu hối tiếc); thử nhận thức với 5–8 người gồm nhiều nhóm tuổi người lớn, bằng tiếng Việt; đăng ký trước giả thuyết; mời một người duyệt đạo đức độc lập; định nghĩa sự kiện telemetry tối thiểu.
2. **30 ngày.** Đo nền (T0) lúc opt-in, đo lại ở ngày 30; chạy ESM 1 câu mỗi ngày trong 14 ngày; chỉ báo cáo mô tả (phân phối Bond Days, tỷ lệ chat/chăm sóc, đuôi phân vị 90), chưa đặt ngưỡng.
3. **90 ngày.** Đo lần ba (T2), tính tỷ lệ “giảm lành mạnh”; chạy một A/B hoặc micro-randomized trial về gợi ý nghỉ, khoảng 100 người mỗi nhánh trở lên; đặt ngưỡng Bond Days từ dữ liệu nền; công bố báo cáo ngắn, gồm cả kết quả âm.

### Chỉ số rào chắn đạo đức

- [ ] Tỷ lệ chat/chăm sóc (đã chọn).
- [ ] Phân vị 95 của thời gian dùng mỗi ngày và thời gian phiên.
- [ ] Tỷ lệ tương tác 23h–5h, tách riêng theo nhóm tuổi.
- [ ] Tỷ lệ người vượt ngưỡng cưỡng ép (4/6 mục).
- [ ] Điểm hối tiếc trung bình mỗi phiên.
- [ ] Tỷ lệ người có WHO-5 dưới 50 hoặc giảm mạnh so với T0, kèm hiển thị nguồn hỗ trợ.
- [ ] Thay đổi UCLA-3 và giao tiếp với người thật (LSNS-6).
- [ ] Quy tắc dừng thí nghiệm: nhánh nào làm xấu bất kỳ chỉ số trên thì tắt, kể cả khi Bond Days tăng.
- [ ] Tỷ lệ opt-in và tỷ lệ rút lui, để theo dõi thiên lệch mẫu.

## Nguyên tắc thiết kế cho Peak và Streakboom

Tổng hợp các phần trên thành một bộ quy tắc cứng để đưa vào spec, cùng một quyết định cần chốt ngay và một lộ trình đo lường. Đây là phần tổng hợp và đề xuất của mình dựa trên bằng chứng ở trên, không phải kết quả nghiên cứu riêng.

### Quyết định cần chốt trước: chat AI và độ tuổi

Điều khoản Gemini API cấm dùng trong ứng dụng có khả năng được người dưới 18 tuổi truy cập, trong khi voice chat đang được cân nhắc qua Gemini. Phạm vi đã chuyển sang 18+ (hướng C). Các hướng đã cân nhắc:

| Hướng | Nội dung | Đánh đổi |
| --- | --- | --- |
| A. Chat/voice chỉ dành cho 18+ (mình đề xuất làm mặc định) | Người 13–17 vẫn dùng Peak, chỉ không có chat AI | Giảm rủi ro pháp lý và đạo đức nhiều nhất; cần cổng tuổi trung lập và chấp nhận trải nghiệm khác nhau theo tuổi |
| B. Đổi nhà cung cấp mô hình | Dùng nhà cung cấp cho phép người dùng vị thành niên | Giữ 13+ đầy đủ, nhưng phải tự xác minh điều khoản của nhà cung cấp và gánh thêm nghĩa vụ SB 243, JED, Children's Code; mình chưa kiểm tra nhà cung cấp nào |
| C. Nâng ngưỡng cả sản phẩm lên 18+ | Không phục vụ người dưới 18 | Đơn giản nhất về pháp lý, nhưng mất nhóm thanh thiếu niên |

Đã chọn hướng C (18+). Cổng tuổi phải hiệu quả, vì điều khoản Gemini và UK Children's Code áp dụng cho ứng dụng có khả năng được người dưới 18 truy cập; cần luật sư xác nhận.

### Quy tắc cứng cho sản phẩm

| # | Nguyên tắc | Cụ thể trong sản phẩm | Cơ sở |
| --- | --- | --- | --- |
| 1 | Không trừng phạt sự vắng mặt | Peak không đói, không buồn, không chết; không thông báo “nhớ bạn”; Peak ngủ khi bạn vắng | Gắn bó lo âu liên hệ với sức khỏe tinh thần kém; tội lỗi do AI “con nhu cầu” là cơ chế gây hại |
| 2 | Đếm tích lũy, không reset | Bond Days chỉ tăng; không “chuỗi gãy”; không bán hay đổi quảng cáo lấy việc sửa chuỗi | Streak gãy làm người dùng bỏ (Silverman & Barasch); thói quen chịu được một ngày vắng (Lally). Giả thuyết cần tự đo |
| 3 | Tạm biệt sạch | Khi người dùng tắt app hay nói dừng, Peak chào một câu rồi dừng; viết thành quy tắc cứng và kiểm thử tự động | 37% lời tạm biệt ở app đồng hành dùng chiêu níu kéo (De Freitas) |
| 4 | Peak ở ngoại vi | Không bật cửa sổ, không cướp focus, không che vùng đang gõ; chế độ im lặng một chạm; chế độ tĩnh theo cài đặt giảm chuyển động | Calm technology; Clippy; WCAG |
| 5 | Thông báo ít và gom nhóm | Mặc định ít, người dùng tự đặt lịch; không tắt hẳn | Gom thông báo giảm căng thẳng; tắt hẳn lại tăng lo âu (Fitz) |
| 6 | Không phần thưởng bất định | Không loot box, không thưởng ngẫu nhiên theo tần suất mở app; không nội dung vô tận | Variable reward là điều kiện tiền đề của nghiện hành vi |
| 7 | Hướng người dùng ra ngoài | Gợi ý nghỉ, vận động, nhắn một người bạn; không đóng vai quan hệ độc quyền | Thay thế quan hệ con người đi cùng cô đơn cao hơn (bằng chứng yếu đến vừa) |
| 8 | Chat là phụ, liều dùng có trần mềm | Giữ tỷ lệ chat/chăm sóc làm rào chắn; voice: phiên ngắn, nhắc nghỉ, giọng trung tính; không đo thành công bằng thời lượng | Dùng nhiều tương quan với cô đơn và phụ thuộc (MIT/OpenAI; tương quan, không phải nhân quả) |
| 9 | Minh bạch và dữ liệu tối thiểu | Thông báo rõ Peak là AI; telemetry opt-in, chỉ bộ đếm, không lưu nội dung chat; thoát và xóa dữ liệu dễ như đăng ký | SB 243, AI Act Điều 50, Children's Code, luật Việt Nam; Bonzi Buddy |
| 10 | Tuyên bố khiêm tốn | Chỉ nói “bạn đồng hành dễ chịu”; không nói chữa lành hay giảm lo âu, trầm cảm, cô đơn | Bằng chứng yếu; FDA/MDR tính cả lời quảng cáo |
| 11 | An toàn khi khủng hoảng | Phát hiện tín hiệu tự hại, chuyển tới đường dây đúng quốc gia, không giả làm nhà trị liệu | SB 243, luật New York, khuyến nghị JED |

### Sứ mệnh nên diễn đạt thế nào

Sứ mệnh “cứu vớt tâm lý” không được bằng chứng ủng hộ và dễ vi phạm quy định tuyên bố. Đề xuất diễn đạt: *một người bạn nhỏ làm ngày làm việc nhẹ hơn và dẫn bạn trở về với đời sống thật*. Thước đo thành công phù hợp với sứ mệnh này là bạn sống tốt hơn khi dùng ít đi, không phải dùng nhiều hơn. Đây là lựa chọn của bạn; các con số và nghiên cứu phía trên không tự quyết định điều đó.

### Lộ trình đề xuất

Thời gian dưới đây là gợi ý, không phải cam kết; mỗi giai đoạn có một cổng cần đạt mới sang bước sau.

1. **Chuẩn bị trước ra mắt.** Chốt hướng A, B hoặc C; viết quy tắc cứng 1–11 vào spec; mời luật sư rà soát; xin phép thương mại thang đo; đăng ký trước giả thuyết. *Cổng:* luật sư xác nhận mô hình chat và độ tuổi; kiểm thử tạm biệt sạch và an toàn khủng hoảng đạt.
2. **30 ngày đầu.** Ra mắt cho nhóm nhỏ opt-in; đo nền và ESM; chỉ báo cáo mô tả. *Cổng:* các chỉ số rào chắn không xấu đi so với nền.
3. **90 ngày.** Đo lần ba, chạy A/B về gợi ý nghỉ, đặt ngưỡng Bond Days từ dữ liệu. *Cổng:* tỷ lệ “giảm lành mạnh” và điểm an sinh không xấu đi; nếu đạt, mở rộng và Product Hunt; nếu không, sửa thiết kế trước.
4. **Sau 90 ngày.** Công bố báo cáo ngắn, gồm cả kết quả âm; chỉ khi đó mới cân nhắc bán sticker và phụ kiện như một thí nghiệm nhu cầu, không dùng để giữ người dùng.

## Nguồn và sách nên đọc

Các nguồn nằm trong từng mục phía trên, kèm liên kết và mức chắc chắn. Phần lớn được đọc qua bản tóm tắt, abstract hoặc bài tường thuật, không phải toàn văn; chỉ có trang điều khoản Gemini API là mình mở trực tiếp để xác nhận. Những nguồn quan trọng nhất:

- Thú cưng và sức khỏe tinh thần: [tổng quan 116 nghiên cứu (Animals 2025)](https://mdpi.com/2076-2615/15/8/1143); [nghiên cứu dọc Baltimore (Friedmann 2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12733245/).
- Bạn đồng hành AI: [De Freitas 2025](https://arxiv.org/abs/2508.19258v3); [MIT/OpenAI RCT](https://arxiv.org/html/2503.17473v2).
- Streak: [Silverman & Barasch 2023](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions).
- Thiết kế theo SDT: [METUX](https://pmc.ncbi.nlm.nih.gov/articles/PMC5985470).
- Điều khoản dịch vụ AI: [Google AI terms](https://ai.google.dev/terms).
- Quy định: [FDA General Wellness](https://www.fda.gov/media/90652/download); [ICO Children's Code](https://ico.org.uk/media/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services-2-1.pdf); [FTC 6(b)](https://search.ftc.gov/news-events/news/press-releases/2025/09/ftc-launches-inquiry-ai-chatbots-acting-companions).

### Sách nên đọc

Các tựa dưới đây là gợi ý từ hiểu biết sẵn có của mình, chưa kiểm tra lại trong phiên này (trừ các sách xuất hiện trong kết quả tìm kiếm: Braving the Wilderness, Hooked, The Power of Habit, Reality Is Broken, Alone Together). Hãy xác nhận tên sách và tác giả trước khi trích.

| Chủ đề | Sách |
| --- | --- |
| Gắn kết và thuộc về | *Braving the Wilderness*, *Atlas of the Heart* (Brené Brown); *Loneliness* (John Cacioppo) |
| Người–động vật | *The Genius of Dogs* (Hare & Woods); *Cat Sense* (John Bradshaw); *Inside of a Dog* (Alexandra Horowitz); *Some We Love, Some We Hate, Some We Eat* (Hal Herzog); *The Biophilia Hypothesis* (Kellert & Wilson) |
| Người và máy | *Alone Together*, *Reclaiming Conversation* (Sherry Turkle) |
| Động lực và thói quen | *Self-Determination Theory* (Ryan & Deci, 2017); *Atomic Habits* (James Clear); *Tiny Habits* (BJ Fogg); *The Power of Habit* (Duhigg) |
| Thiết kế đạo đức, chống gây nghiện | *Digital Minimalism* (Cal Newport); *Indistractable* (Nir Eyal); *Stolen Focus* (Johann Hari); *Evil by Design* (Chris Nodder); *Positive Computing* (Calvo & Peters) |
| Để biết cơ chế cần tránh | *Hooked* (Nir Eyal); *Irresistible* (Adam Alter); *Reality Is Broken* (Jane McGonigal) cho góc nhìn tích cực về game |
