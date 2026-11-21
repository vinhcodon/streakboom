# StreakBoom — Giả thuyết sản phẩm & Spec Peak/Paws
Phiên bản: 0.2 · Ngày: 17/11/2026 · Trạng thái: bản làm việc để thảo luận, đã đối chiếu repo
Chủ sản phẩm: Vinh Ha · Phạm vi: định nghĩa sản phẩm, nhân vật, trải nghiệm và tiêu chí kiểm chứng; chưa phải xác nhận triển khai.
Định dạng Markdown để dễ sửa, so sánh thay đổi và chuyển sang backlog.

## 1. Quy ước và cách cập nhật
- CHỐT: quyết định người dùng đã nêu rõ.
- ĐỀ XUẤT: lựa chọn thiết kế của bản này, có thể đổi sau thảo luận.
- GIẢ THUYẾT: cần bằng chứng từ người dùng.
- ĐÃ QUAN SÁT: nội dung website, không đồng nghĩa đã kiểm tra ứng dụng.
- MỞ: chưa đủ thông tin hoặc chưa quyết định.

Giữ nguyên ID của quyết định, giả thuyết và yêu cầu khi cập nhật. Thay đổi ý nghĩa cần ghi lý do, bằng chứng và phần bị ảnh hưởng. v0.x là giai đoạn khám phá; không tự biến đề xuất thành quyết định đã duyệt. Mỗi vòng trao đổi cập nhật cùng tài liệu, thêm changelog, giữ các giả thuyết bị bác bỏ cùng lý do.

## 2. Tóm tắt hướng sản phẩm
CHỐT D-01: Peak và Paws là hai nhân vật trong cùng một ứng dụng StreakBoom.
CHỐT D-02: Người dùng chọn Peak, Paws hoặc cả hai xuất hiện.
CHỐT D-03: Hướng nhân vật là pet sống trên màn hình, vô dụng, trả treo và nhây.
CHỐT D-04: Xây dựng tài liệu sống, tiếp tục trao đổi và cập nhật.

ĐỀ XUẤT D-05: Bản sắc nhân vật độc lập với hệ điều hành. Đích sản phẩm là cùng ba chế độ trên Windows và macOS; lịch hỗ trợ macOS chưa được chốt.
ĐỀ XUẤT D-06: Windows hiện có là nơi thử nghiệm trước. Không đồng thời cam kết port macOS và xây toàn bộ tương tác đôi.
ĐỀ XUẤT D-07: Peak = thương nhưng chối; Paws = thương nhưng làm màu. Đây là hướng đã được đón nhận, chưa phải toàn bộ character bible được duyệt.
ĐỀ XUẤT D-08: Không cần AI để có trải nghiệm pet hoàn chỉnh; chat bằng khóa riêng là phần tùy chọn, kế thừa định hướng website.

Lời hứa: “Góc máy có thêm một đứa. Hoặc hai.”
Giá trị mong đợi: sự hiện diện có tính cách và những khoảnh khắc vui nhỏ, không thêm trách nhiệm chăm sóc hay áp lực năng suất.

## 3. Soi chiếu StreakBoom hiện tại
Nguồn đã đọc trực tiếp trong cuộc trao đổi ngày 17/11/2026:
- https://streakboom.com/
- https://streakboom.com/story/
Website giới thiệu v0.10.0, phát hành 14/11/2026. Chưa cài/chạy ứng dụng, chưa audit mã nguồn; các nội dung dưới là mô tả công khai.

| Hạng mục | ĐÃ QUAN SÁT | Hệ quả cho spec |
|---|---|---|
| Sản phẩm | Peak, một mèo desktop trên Windows 10/11 | Mở rộng thành hai nhân vật trong một app |
| Triết lý | Đồng hành, không làm việc hộ | Giữ trong cả solo và duo |
| Sự riêng tư | Không đọc nội dung màn hình hay những gì người dùng gõ | Không tạo câu đùa ngụ ý biết tài liệu, tab, tin nhắn |
| Nhịp xuất hiện | Yên khi làm việc, di chuyển/nói khi nghỉ | Cần điều phối chung cho hai pet |
| Tương tác | Vuốt, chọc, đẩy, kéo; có thể yêu cầu tránh ra | Cùng bộ thao tác nhưng biểu đạt khác nhau |
| Gắn bó | Có mood/closeness; không chết, không đói vì vắng mặt | Tách trạng thái từng pet, không phạt pet bị ẩn |
| AI | Hoạt động không AI; có thể thêm khóa riêng để chat | MVP nhân vật và duo không phụ thuộc AI |
| Peak trong Story | Tự hào về việc ngồi, giờ làm ngắn, chối tiếng gừ gừ | Giữ hạt nhân sĩ diện và tình cảm kín |
| Nền tảng | Windows hiện tại | macOS cần khảo sát kỹ thuật riêng |

Khoảng trống cần giải quyết: định danh pet, lựa chọn hiển thị, đời sống riêng của Paws, tương tác đôi, ngân sách chú ý, lưu trạng thái và migration.
Tên StreakBoom được giữ trong tài liệu; chưa đề xuất đổi thương hiệu. Cần xem lại copy để tên không gợi nghĩa vụ streak trái lời hứa không gây tội lỗi.

## 4. Người dùng và công việc cảm xúc
GIẢ THUYẾT phân khúc theo cách muốn được đồng hành, không theo tính cách suy ra từ OS.

| Nhóm | Nhu cầu | Điều dễ khó chịu | Thiết kế đáp ứng |
|---|---|---|---|
| Người thích hiện diện yên tĩnh | Có sinh vật bên cạnh mà không phải trò chuyện | Lời thoại, chuyển động liên tục | Solo, quiet, đời sống không lời |
| Người thích tương tác tinh nghịch | Chọc rồi nhận phản ứng có cá tính | Phản hồi lặp, câu đùa vô duyên | Gesture, animation, biến thể cùng tính cách |
| Người thích xem hai nhân vật | Thỉnh thoảng thấy một chuyện nhỏ tự diễn ra | Hai con tranh chú ý, cảnh quá dài | Duo với nhịp chung, cảnh ngắn có thể ngắt |

JTBD: “Khi ở một mình trước máy lâu, tôi muốn có một sự hiện diện thân thuộc, để góc làm việc có sức sống mà không phải chăm thêm một việc.”
Không giả định mọi người dùng cần cả hai; solo là trải nghiệm hoàn chỉnh, không phải bản thiếu.

## 5. Giả thuyết có thể bác bỏ
Các ngưỡng dưới là ngưỡng quyết định nội bộ đề xuất, không phải benchmark ngành hoặc kết quả đã thu được.

| ID | Giả thuyết | Phép thử | Tín hiệu ủng hộ / bác bỏ | Yêu cầu liên quan |
|---|---|---|---|---|
| H-01 | Có mặt yên tĩnh vẫn tạo giá trị sau khi hết mới lạ | Pilot 7 ngày, 12–20 người; phỏng vấn ngày 1 và 7 | ≥60% muốn giữ ít nhất một pet và kể được một khoảnh khắc cụ thể; <40% thì xem lại giá trị nền | F-03, F-07 |
| H-02 | Peak/Paws được nhận ra qua hành vi và giọng nói | 8 vignette ẩn tên, trộn thứ tự | Trung vị ≥6/8 nhận diện đúng sau giới thiệu; ≤4/8 thì persona chưa phân biệt | F-04 |
| H-03 | Lựa chọn nhân vật có ích độc lập OS | Cho người Win/Mac xem cả hai, chọn trước khi tiết lộ nền tảng | Ghi lựa chọn và lý do; nếu chỉ chọn theo hình dáng thì chưa chứng minh giá trị persona | F-01, F-04 |
| H-04 | Duo tạo giá trị thêm mà không tăng phiền | Thử solo/duo theo thứ tự cân bằng, cùng giới hạn chủ động | ≥50% thích duo ở ít nhất một bối cảnh; điểm phiền trung vị không tăng >1 trên thang 1–5 | F-05, F-06 |
| H-05 | Trả treo nhưng hợp tác được xem là đáng yêu | Cho yêu cầu tránh/im lặng, quan sát phản ứng | ≥80% hiểu pet đã nghe lời; nếu nhiều người hiểu là app chống lệnh thì sửa biểu đạt | F-02, F-04 |
| H-06 | Một trò đùa có hồi đáp đáng giá hơn nhiều lời ngẫu nhiên | So sánh cảnh ngắn có nối tiếp với câu độc lập, cùng tần suất | Ưu tiên dựa trên nhớ được tình huống và muốn lặp tương tác; nếu thấy dai/phiền thì giảm nối tiếp | F-05, F-06 |

Pilot là định hướng, chưa đủ để suy rộng thị trường hay kết luận nhân quả về retention. Báo cáo cả số người và mẫu số, không chỉ phần trăm. Tuyển cả người ít thích pet để tránh chỉ thu tín hiệu từ fan.

## 6. Character bible tối thiểu
| Thuộc tính | Peak | Paws |
|---|---|---|
| Vai tự phong | Chủ nhà | Quản gia |
| Niềm tin | “Bạn đang dùng máy của tôi.” | “Tôi giữ nơi này hoạt động có nề nếp.” |
| Thực tế | Ở ké, ngủ nhiều, muốn gần bạn | Nhiệt tình, vụng, giỏi nghi thức vô nghĩa |
| Mâu thuẫn | Thương nhưng chối | Thương nhưng làm màu |
| Trả treo | Bẻ nghĩa, nhận vơ, phủ nhận | Lễ phép rồi diễn giải theo ý mình |
| Ngôn ngữ cơ thể | Liếc, quay lưng, lặng lẽ dịch gần | Đuôi vẫy, đứng nghiêm, chuẩn bị quá mức |
| Nhịp thoại | Ngắn, tỉnh bơ | Trang trọng hơi quá, kết thúc ngớ ngẩn |
| Tình cảm | Ở gần mà không thú nhận | Mừng rõ rồi cố giữ phong thái |
| Giới hạn | Không độc ác/cáu kỉnh liên tục | Không chỉ phục tùng, không luôn làm nền |

Luật chung:
1. Trả treo bằng lời, hợp tác bằng hành động.
2. Có đời sống riêng; không theo đuổi sự chú ý liên tục.
3. Chọc tình huống hoặc chính mình, không hạ nhục người dùng.
4. Không ghen trách vì bị ẩn/chọn con kia; không suy sụp khi người dùng vắng.
5. Không suy đoán tâm trạng, năng lực hay công việc của người dùng.
6. Có thể hài bằng tư thế, không cần câu nào cũng là punchline.

Ví dụ cùng trigger:
- Tránh ra: Peak “Tôi vốn định sang kia.”; Paws “Đã nhường đường. Bạn cứ tự nhiên khen.” Cả hai nhường ngay.
- Vuốt: Peak “Được. Bạn có năng khiếu.” rồi nghiêng đầu; Paws “Tôi đang trực.” nhưng vẫy đuôi.
- Quay lại: Peak mở mắt rồi dịch gần; Paws đứng dậy mừng rồi giả nghiêm. Không nhắc số ngày vắng theo cách trách móc.
- Im lặng: ưu tiên động tác xác nhận; không cố nói câu cuối trong chế độ tắt lời.

## 7. Các chế độ và luồng chính
F-01 — Chọn nhân vật (P0)
Ba lựa chọn ngang hàng: Peak / Paws / Cả hai. Chuyển ngay trong ứng dụng, không cài thêm hay khởi động lại.
Người mới được xem ba preview ngắn; ĐỀ XUẤT default là Peak để giữ liên tục với sản phẩm hiện tại.
Người đang dùng được giữ Peak và trạng thái cũ; không tự bật Paws sau update.
Đóng picker không áp dụng thay đổi chưa chọn. Cài đặt đã chọn tồn tại qua restart.
Ẩn cả ứng dụng là điều khiển riêng, không phải lựa chọn nhân vật thứ tư.

F-02 — Quyền kiểm soát (P0)
Có: ẩn tất cả, hiện lại, tắt lời, tắt âm thanh, giảm chuyển động, chọn nhân vật.
Mute/silent có hiệu lực ngay; hủy thoại đang chờ. Hide hủy toàn bộ cảnh và bỏ vùng bắt chuột của pet.
Lệnh tránh ngắt cảnh hiện tại và nhường vị trí; không phát sinh thêm bước xác nhận.
Không để cửa sổ overlay vô hình chặn click. Không cướp focus khi tự xuất hiện.
ĐỀ XUẤT không âm thanh mặc định. Pet không tự bật lại âm thanh/mức nhây đã tắt.

F-03 — Hiện diện (P0)
Giữ ý tưởng hiện có: yên khi người dùng làm việc, chủ động khi nghỉ.
Baseline đã đọc trong attention.ts: Free sau 45 giây idle; Play 120 giây sau tương tác, kết thúc sau 20 giây hoạt động nơi khác. Giữ baseline để so sánh; không tự đổi sang 30 giây như đề xuất v0.1. Các giá trị là chi tiết triển khai có thể kiểm chứng, không phải nguyên tắc bất biến.
Khi phát hiện người dùng hoạt động trở lại, ngừng bắt đầu cảnh chủ động; cảnh đang chạy thu gọn yên lặng.
Quiet cho phép tư thế thở/ngủ rất nhẹ, không speech và không dạo chơi.
Không yêu cầu đọc nội dung ứng dụng hay ghi phím để vận hành.

F-04 — Solo (P0)
Mỗi pet có tối thiểu 6 phản ứng: nghỉ, vuốt, chọc, kéo, tránh, chào lại.
Mỗi phản ứng có action xác định, ít nhất một biến thể; không bốc câu hoàn toàn ngẫu nhiên trái mood hoặc tình huống.
Solo Paws phải có đời sống riêng, không cần Peak để hoàn thành trò đùa.

F-05 — Duo (P0 ở mức giới hạn)
Hai nhân vật cùng sống trong một không gian, không phải hai bộ phát thoại độc lập.
Tối thiểu ba cảnh: tuần tra bốn góc; tranh chỗ nằm; chuyền đồ chơi.
Ví dụ tuần tra: Paws “Đã kiểm tra bốn góc.” Peak “Có gì?” Paws “Bốn góc.” Peak “Mai kiểm tra lại.”
Mỗi cảnh tối đa hai pet, một speech bubble tại một thời điểm, có bản không lời.
MVP không cần đối thoại AI tự phát giữa hai pet.
Người dùng tương tác với một pet thì dừng cảnh đôi; pet còn lại quay về idle, không chen lời.
Chuyển duo sang solo ở giữa cảnh hủy các lượt còn lại; không tham chiếu con đã ẩn.
Không đủ chỗ an toàn thì hai pet nghỉ tại vị trí tách nhau; bỏ qua cảnh thay vì cố diễn.

F-06 — Ngân sách chú ý chung (P0)
Thông số bắt đầu để thử, chưa phải tối ưu:
- Tối đa một cảnh chủ động cho cả app trong mỗi 5 phút đủ điều kiện idle.
- Tối đa hai cảnh chủ động trong một giờ app hiển thị.
- Một cảnh ≤12 giây, mỗi bubble ≤12 từ; bản dịch được phép khác độ dài nếu dễ đọc.
- Không lặp cùng scene trong phiên; khi hết scene phù hợp thì yên, không cố lặp.
- Tương tác do người dùng khởi tạo không tính quota chủ động, nhưng chọc liên tục gộp phản hồi, không xếp hàng vô hạn.
- Chế độ nhây Nhẹ / Vừa của v0.1 được đưa về MỞ: repo chủ trương thích nghi thay vì setting về lượng hành vi. Thử thao tác trực tiếp và Quiet trước; có thể mở lại lựa chọn nếu thích nghi khó hiểu hoặc không đáp ứng sở thích người dùng.
- Giới hạn duo bằng solo; không nhân đôi khi có thêm pet.
- Khi hoạt động trở lại, không xả “backlog” câu nói sau đó.

F-07 — Gắn bó và trạng thái (P0 cơ bản, mở rộng P1)
Lưu riêng vị trí, mức quen và sở thích tương tác của từng pet; không có decay vì vắng hoặc bị ẩn.
Ẩn một pet = ngừng hiển thị và xử lý tương tác của pet đó. Không mô phỏng buồn/đói ở nền.
Bản đầu chỉ cần nhớ vị trí và một thói quen nhẹ; không cần hệ thống điểm công khai.
Không đồng bộ cloud ở MVP; không hứa ký ức xuyên thiết bị.

F-08 — Chat tùy chọn (bảo toàn hiện trạng, mở rộng P1)
Nếu giữ chat hiện tại, người dùng phải biết đang nói với ai. Chọn một pet làm người trả lời.
Pet còn lại không tự gọi model, không tự gửi thêm hội thoại, không tăng chi phí ngầm khi bật duo.
Không có khóa hoặc API lỗi: hoạt cảnh/gesture vẫn chạy; lỗi được xử lý như lỗi tính năng, không làm pet “chết”.
Cách chọn provider/key và bảo quản khóa phải audit mã nguồn trước khi sửa, tài liệu này không xác nhận cơ chế hiện có.

## 8. Kiến trúc hành vi đề xuất
Đây là mô hình logic, không khẳng định cấu trúc repo đang có.
- App settings: visiblePetIds, lastSelection, quiet, audio, reducedMotion.
- Pet state theo ID peak/paws: pose, position, familiarity, interactionPreferences.
- Scene coordinator: kiểm tra điều kiện, chọn một scene, giữ lượt nói, hủy cảnh.
- Content catalog: sceneId, actors, triggers, preconditions, actions, localizedLines, cooldown, cancellation.
- Input adapter: gesture, lệnh menu và tín hiệu active/idle tối thiểu; không mang nội dung màn hình vào character logic.
- Renderer: thể hiện pet và bubble; không quyết định độc lập khi nào được chen lời.

Ưu tiên xử lý: hide/silent → tránh/các điều khiển người dùng → gesture → chuyển trạng thái active → scene chủ động.
Mọi bước có thời gian phải có thể hủy. Dùng scene token để callback cũ không làm con đã ẩn xuất hiện lại.

Trạng thái logic:
Hidden → hiện lại theo lastSelection.
Visible/Quiet → nhận gesture, không khởi động scene.
Visible/Idle → chỉ chạy scene nếu qua eligibility và quota.
Scene → hoàn tất về Idle; bất kỳ hide/switch/direct interaction đều hủy.
Ứng dụng hoạt động trở lại → Quiet. Định nghĩa active/idle chính xác phụ thuộc tín hiệu được phép và cần audit.

Migration:
Thêm schemaVersion. Giữ nguyên dữ liệu Peak hiện có, khởi tạo Paws mới, visiblePetIds=[peak] cho người cũ.
Không xóa trạng thái Peak khi chọn Paws. Migration chạy một lần và phải chịu được restart giữa chừng; chuẩn bị backup/rollback theo cơ chế repo thực tế.

## 9. Acceptance criteria có thể kiểm tra
| ID | Tình huống | Kết quả bắt buộc |
|---|---|---|
| AC-01 | Chọn mỗi chế độ rồi restart | Đúng pet, đúng lựa chọn đã lưu |
| AC-02 | Update từ bản Peak hiện tại | Peak giữ trạng thái, Paws không tự xuất hiện |
| AC-03 | Hide khi đang thoại đôi | Cả hai biến mất; không callback/bubble xuất hiện lại |
| AC-04 | Chọn solo giữa scene duo | Chỉ pet được chọn còn lại, không lời nhắc con đã ẩn |
| AC-05 | Yêu cầu tránh | Nhường ngay khi xử lý lệnh, câu trả treo không trì hoãn action |
| AC-06 | Bật quiet/mute | Không thoại/âm thanh mới trái cài đặt; hàng đợi cũ bị hủy |
| AC-07 | Duo suốt một giờ đủ idle | Không vượt quota chung, không chồng bubble |
| AC-08 | Gesture trong scene | Scene hủy sạch, pet được chạm phản hồi; không tranh lượt |
| AC-09 | Ngắt mạng/không có API key | Solo, duo, gesture scripted vẫn dùng được |
| AC-10 | Trở lại sau nhiều ngày hoặc đổi pet | Không mất closeness, không trách móc |
| AC-11 | Đổi độ phân giải/rút màn hình phụ | Pet trở về vùng nhìn thấy, không kẹt ngoài màn hình |
| AC-12 | Overlay khi không trỏ vào pet | Không chặn click nền hoặc cướp focus |
| AC-13 | Bật reduced motion | Không đuổi bắt/nhảy mạnh; vẫn có phản hồi bằng pose |
| AC-14 | Ngừng chủ động rồi hoạt động lại | Không dồn các cảnh đã bỏ qua thành burst |

Kiểm tra hiệu năng trên máy tham chiếu được ghi rõ cấu hình, phiên bản build và chế độ nguồn. Đo CPU/GPU/RAM baseline Peak hiện có, solo Paws và duo cùng kịch bản. Chưa đặt con số RAM/CPU tùy ý trước khi đo; ngân sách kỹ thuật là mục MỞ phải chốt trước release.
Dùng test scheduler với đồng hồ giả cho quota/cancel và kiểm tra thủ công gesture, focus, nhiều màn hình. Chưa có test hoặc tiêu chí nào được chạy trong lần soạn spec này.

## 10. Phạm vi và thứ tự triển khai
P0a — Audit hiện trạng: đọc charter và mã nguồn; xác định renderer, state, idle, privacy, chat, migration; lập mapping tới spec.
P0b — Hai solo: character IDs, picker, Paws 6 phản ứng, persist, quiet/hide, giữ Peak cũ.
P0c — Duo có giới hạn: coordinator, 3 scene scripted, shared budget, cancellation, AC liên quan.
P0d — Pilot: bản dùng ổn định trên Windows, thử 7 ngày, cập nhật H-01…06.
P1 — Mở rộng nội dung, nhớ thói quen, localization, khảo sát/triển khai macOS theo quyết định tiếp theo.

Ngoài scope MVP: hai pet nói chuyện bằng LLM liên tục; đọc màn hình; tự làm việc; cloud account/sync; marketplace; breeding; vật phẩm ép check-in; punishment streak.
Không chốt deadline trước audit. macOS là hướng nền tảng cần xác nhận, không đồng nghĩa bản duo đầu tiên phải phát hành đồng thời hai OS.

## 11. Thu thập bằng chứng tôn trọng lời hứa sản phẩm
Ưu tiên diary ngắn và phỏng vấn; không thêm telemetry mạng mặc định.
Nếu cần log pilot, người tham gia chủ động đồng ý và xuất file local. Chỉ ghi mode, event category, sceneId, lượt hide/mute/switch và thời lượng quan sát ở mức cần thiết.
Không ghi nội dung chat, phím gõ, tiêu đề cửa sổ, app đang dùng, screenshot hoặc API key.
“App chạy nền” không đồng nghĩa người dùng thích pet. Retention và số click chỉ là tín hiệu phụ, cần kết hợp lý do giữ/gỡ và khoảnh khắc nhớ được.
Đổi persona sau khi đã gắn bó có thể gây mất cảm giác thân thuộc; ưu tiên bổ sung nhất quán, thử biến thể riêng trước khi thay nhân vật toàn bộ.

## 12. Câu hỏi mở cho các vòng tiếp theo
| ID | Câu hỏi | Mặc định bản này để tiếp tục | Tác động |
|---|---|---|---|
| Q-01 | Mức láo/nhây mong muốn đến đâu? | Tinh nghịch nhẹ, không xúc phạm | Voice, phản hồi, localization |
| Q-02 | Paws hình dáng/giống chó nào? | Repo ADR-0131 đã chọn Mochi: thân hạt đậu, tai mềm, mảng trắng, lông mày nâu; cần chuyển thành rig động, không khởi động thiết kế lại từ số không | Animation và sản xuất asset |
| Q-03 | Chọn người dùng quốc tế hay Việt Nam trước? | Viết spec tiếng Việt; không bỏ hỗ trợ ngôn ngữ hiện có | Viết thoại và tuyển pilot |
| Q-04 | Có cần macOS ngay đợt duo? | Thử trên Windows trước; không khóa persona theo OS | Scope và lịch |
| Q-05 | Độ “vô dụng” có cho phép tiện ích nhỏ? | Chưa thêm tiện ích | Định vị và kỳ vọng |
| Q-06 | Hai pet là bạn, bạn cùng nhà hay quan hệ khác? | Bạn cùng nhà hay đấu khẩu, đều có lúc thắng | Story và cảnh đôi |

## 13. Changelog và quyết định
v0.1 — 17/11/2026
- Ghi nhận chuyển từ chia Peak/Windows và Paws/macOS sang một app, ba lựa chọn.
- Tách bản sắc nhân vật khỏi hệ điều hành.
- Thêm giả thuyết, persona, luồng chọn pet, scene coordinator, quota chú ý, tiêu chí chấp nhận và pilot.
- Chưa sửa code, chưa phát hành, chưa xác nhận tính khả thi macOS hay kết quả người dùng.

Mẫu cập nhật: [ngày] [ID] nội dung cũ → mới; lý do/bằng chứng; trạng thái CHỐT/ĐỀ XUẤT/GIẢ THUYẾT; requirement/test bị ảnh hưởng.

## 14. Repo review — nền cho brainstorm với Vinh và Claude (v0.2)
Ngày đọc: 17/11/2026. Snapshot main: f8e75bccca92f8fd12a3b580a30f45b54570b777.
Đọc tài liệu định hướng/charter, các ADR liên quan, spec duo, foundation (các phần liên quan), kế hoạch loop, và các module chú ý/phản ứng/ký ức/đo lường cùng các phần tích hợp của trang pet. Không phải audit toàn bộ repo; không build, không chạy app, không xác minh nghiên cứu bên ngoài mà foundation dẫn.

Lệnh mới của Vinh: coi repo là nền tảng và lịch sử lý luận, không là giới hạn bất biến. Các đề xuất dưới không tự sửa quyết định trong repo. Chưa gửi gì cho Claude, chưa tạo commit/PR.

### 14.1. Động cơ nhìn từ repo
ĐÃ ĐỌC: PROJECT/charter định nghĩa bạn nhỏ làm ngày làm việc nhẹ hơn, hướng về đời sống thật; foundation và release 0.4 bỏ cơ chế vắng mặt gây tội lỗi/streak. Story mô tả nhu cầu có sự hiện diện trong khoảng nghỉ, không cần trò chuyện hay công việc.
SUY LUẬN: động cơ sản phẩm là “được ở cùng mà không mắc nợ nhau”; động cơ kỹ thuật là làm nhân vật có thân thể, cảm giác và nhịp sống; loop engineering là cách tìm hành vi vừa đúng vừa có duyên.
ĐỀ XUẤT: chuyển đơn vị thiết kế từ một mascot sang một góc sống chung có quan hệ người–Peak, người–Paws và Peak–Paws. Đây là hướng sáng tạo, chưa phải kiến trúc lớn cần xây ngay.

### 14.2. Những điều cần hiệu chỉnh từ v0.1 và lịch sử repo
| Chủ đề | Bằng chứng ở repo | Điều chỉnh / đề xuất |
|---|---|---|
| Hai nền tảng | ADR-0132 chấp nhận một repo, một app, platform layer; chưa di chuyển code, macOS chưa thử | Kế thừa hướng này; lịch và tính khả thi vẫn mở |
| “Một Peak” | ADR-0068 và duo-charter-impact giải thích chống chạy trùng process | Không coi đây là lý do cấm duo |
| Hình ảnh Paws | ADR-0131 đã chọn Mochi | Giữ làm baseline cho rig, có thể phản biện tiếp |
| Sticker duo | Spec 19 cập nhật bốn sticker lên bình thường, test đối chứng không chạy | Không dùng sự tồn tại sticker làm bằng chứng duo thành công |
| Riêng tư | Preview có screenPicture off mặc định; picture.rs chụp xám cục bộ và xử lý grid | Cần phân biệt không hiểu nội dung với hoàn toàn không lấy pixel. Không kế thừa câu “không bao giờ nhìn màn hình” cho mọi phiên bản |
| Kích thước picture | ADR-0128 ghi tối đa 192×108; code GRID_W=192, GRID_H_MAX=216 | Có độ lệch tài liệu/code; xác minh và sửa wording trước phát hành liên quan |
| Chú ý | attention.ts có Work/Free/Play; reactions.ts có quota phản ứng | Mở rộng cơ chế hiện có. Quota cảnh đôi và quota phản ứng là hai loại khác nhau, không thay thế máy móc |
| Ký ức | memory.ts có tên, thói quen, facts, ngày quan trọng, chỗ ngồi | Spec duo phải phân rõ ký ức người dùng dùng chung, ký ức từng pet và sự kiện chung |
| Tiện ích nhỏ | ADR-0080 từng loại reminders; ADR-0115 đã triển khai “kept days” trong Preview | “Vô dụng” là định vị cần diễn giải, không nên là cấm mọi hành vi có ích |
| Migration | AGENTS: Stable/Preview dùng chung dữ liệu, thêm field có default, không đổi nghĩa field cũ | Không thực hiện schema rewrite chỉ vì v0.1 nói schemaVersion; phải giữ tương thích hai chiều |
| Đo lường | bond.ts: Bond Days là số ngày có care trong 7 ngày gần nhất | Không nhầm với bộ đếm tích lũy suốt đời; dùng như tín hiệu phụ, không đồng nhất với gắn bó |

### 14.3. Các phản biện đề xuất
1. “Paws hút sự chú ý của Peak thì dừng” (kế hoạch sticker cũ) bảo vệ mascot hơn giá trị app. Mục tiêu mới cho phép người dùng chọn Paws: đánh giá tổng giá trị và mức phiền, không bắt Paws làm Peak được yêu hơn.
2. “Thành công khi cần pet ít hơn” là ý hướng tốt nhưng không phải metric đủ: ít dùng có thể là hài lòng, chán, lỗi hoặc quên. Phân biệt tự do rời đi với giảm sử dụng bằng mọi giá.
3. Không dùng Bond Days làm mục tiêu duy nhất: người vui khi nhìn hai pet nằm cạnh nhau có thể không vuốt. Đo trải nghiệm bằng câu hỏi ngắn, ý muốn giữ, khoảnh khắc nhớ được và hành vi chủ động; không biến hiện diện chạy nền thành bằng chứng thích.
4. “Gentle before sharp” cần phân biệt không được gây hại với không được có kịch tính. Một cú liếc hoặc né cái ôm có thể rất có cá tính mà ít chiếm chú ý. Đừng làm hai con thành hai phiên bản lịch sự giống nhau.
5. “Không setting về lượng” là giả thuyết UX có thể thử. Quyền chọn pet là lựa chọn sở thích đã được Vinh yêu cầu; không nên ép người dùng phải trò chuyện để bật Paws. Quyền kiểm soát rõ ràng có thể đi cùng điều chỉnh tự nhiên.
6. Không có bằng chứng về hiệu quả sức khỏe không có nghĩa không có giá trị giải trí/đồng hành. Foundation là tài liệu tham khảo có giới hạn tự công bố, không phải bằng chứng cho mọi hạn chế sáng tạo.
7. Không coi mọi hình thức chú ý là một chi phí như nhau: chuyển động nền, bubble buộc đọc và thông báo giành focus có tác động khác nhau. Ngân sách nên tách kênh trước khi chốt quota.

### 14.4. Cơ hội sáng tạo: đời sống có nguyên nhân
Thử trước một “đồ vật chung”: quả bóng, chiếc hộp hoặc chiếc lá chỉ tồn tại trong lớp vẽ của app.
Paws cố xếp bóng ngay ngắn; Peak dùng bóng kê đầu; Paws tìm vật khác kê cho Peak để lấy bóng lại. Tình huống có mục tiêu nhỏ, hành động và hậu quả; không cần đọc công việc người dùng hoặc hai LLM tự trò chuyện.

Ba lớp trạng thái ĐỀ XUẤT:
- Bản sắc ổn định: Peak sĩ diện, Paws nghiêm túc quá mức.
- Trạng thái ngắn hạn: đang ngủ, đang chơi, đang quan tâm đồ vật; đổi theo sự kiện thực, không bốc ngẫu nhiên vô hạn.
- Lịch sử chung có giới hạn: ai mang bóng tới, chỗ nằm vừa được chọn, thói quen người dùng đã dạy. Không bịa trải nghiệm ngoài lúc app chạy.

Cả hai có thể muốn làm việc riêng mà không cần người dùng. “Có mong muốn” không đồng nghĩa “phải được người dùng chăm”.
Ví dụ tương tác không lời: Paws nằm cạnh Peak; Peak dịch ra một chút; Paws không đuổi theo; vài giây sau Peak tự dịch lại. Chỉ diễn khi đủ điều kiện chú ý, không gán ý nghĩa bị bỏ rơi.

Sửa hướng Paws ĐỀ XUẤT: “rất giỏi làm những việc không cần làm” thay cho “luôn vụng và bất tài”. Giữ nét thương nhưng làm màu; có lúc Paws giải quyết được vấn đề nhỏ của hai con, có lúc Peak đúng. “Quản gia” chỉ là vai tự phong trong thế giới của chúng, không quản lý người dùng.

### 14.5. Giả thuyết mới (namespace SB2 để không trùng H1…H33 trong repo)
| ID | Giả thuyết | Thử rẻ nhất | Điều khiến đổi hướng |
|---|---|---|---|
| SB2-01 | Đời sống có nguyên nhân tạo cảm giác sống hơn chuỗi cảnh ngẫu nhiên | Hai clip cùng độ dài, cùng animation; một bản giữ hậu quả giữa hành động, một bản độc lập; đảo thứ tự | Người xem không nhận ra khác biệt hoặc thấy bản liên tục khó hiểu |
| SB2-02 | Quan hệ giữa hai pet tạo giá trị thêm ngoài số lượng nhân vật | So sánh duo độc lập và duo có một đồ vật chung, giữ mức chuyển động | Duo có quan hệ không được muốn giữ hơn hoặc gây phiền hơn |
| SB2-03 | Paws có năng lực vô dụng hấp dẫn hơn Paws luôn thất bại | Hai cảnh cùng mục tiêu nhỏ và độ dài | Người xem chỉ thấy “ông sếp làm việc” hoặc không thấy khác biệt |
| SB2-04 | Tương tác ít vẫn có thể là trải nghiệm tốt | Pilot hỏi mức vui khi hiện diện và ý muốn giữ, đối chiếu Bond Days | Nhóm không chạm cũng không nhớ, không thích, không muốn giữ |

Các H-01…06 ở mục 5 là ID cục bộ của tài liệu này, không tự thêm cùng số vào repo.
Các ngưỡng quota/pilot ở v0.1 vẫn là đề xuất, cần đối chiếu baseline hiện có. Không coi chúng là con số đã tối ưu.

### 14.6. Nền kỹ thuật nên tận dụng
- attention.ts → quyền được hoạt động theo ngữ cảnh.
- events.ts + beats.ts + choose.ts → sự kiện, cách nhân vật cảm nhận, biểu đạt bằng cơ thể rồi mới đến lời.
- reactions.ts → ưu tiên và giới hạn phản ứng.
- selector.ts → chọn lời theo ngôn ngữ, mức quen, tone; tránh lặp.
- memory.ts → ký ức có giới hạn và quyền xóa.
- terrain/perception + platform layer đã đề xuất → môi trường sống và mức chắc chắn của tín hiệu.
- skill-run và skill files → hành động cơ thể có thể điều khiển.

Trang app/src/routes/+page.svelte ở snapshot khoảng 157 KB, đang nắm một data, một mem, một attention và một reaction gate. Đọc code cho thấy phần điều phối còn gắn với một pet. Thêm Paws nên tách state theo ID và một nơi điều phối chung; không nhân đôi trang hoặc giả định “hai pet bắt buộc hai WebView”. Cần spike so sánh cách render/hit-test và hiệu năng trước chọn số cửa sổ.

Chưa có lý do phải dùng world model học máy để có duo. Nếu khảo sát model nhẹ nhận địa hình, giữ nó như thí nghiệm perception riêng, so với baseline heuristic; chỉ đưa vào khi giảm che nội dung mà không tăng chuyển động/chi phí không đáng có.

### 14.7. Cách làm việc ba bên
Vinh sở hữu lựa chọn và cảm nhận nhân vật; Claude và ChatGPT đều được đề xuất, phản biện và sửa giả định của mình, không bị đóng khung một bên “sáng tạo”, bên kia “giữ luật”.
Mỗi đề xuất: bằng chứng repo → điều muốn thay → lợi ích dự đoán → chi phí → thử nhỏ → điều kiện bác bỏ.
Tài liệu brainstorm giữ ngoài source implementation cho đến khi quyết định nhập vào repo. Khi nhập, map sang ADR/spec/hypotheses hiện có, lấy số mới từ repo lúc đó, không dựng bộ tài liệu quyết định song song.
Không cần đạt đồng thuận giữa AI để coi là đúng; ưu tiên prototype có thể nhìn và phản hồi của Vinh/người thử.

### 14.8. Gói thử tiếp theo đề xuất
Một prototype nhỏ: 2 pet, 1 đồ vật, 3 cảnh không lời, một thao tác can thiệp của người dùng.
Điều cần học: “Tôi có cảm giác hai đứa đang sống cùng nhau không, hay chỉ xem hai animation chạy cạnh nhau?”
Sau đó mới chốt thêm thoại, ký ức dài hạn, kiến trúc scene tổng quát và quota.

### 14.9. Nguồn trực tiếp
Các đường dẫn dưới thuộc snapshot đã nêu:
- docs/PROJECT.md; docs/charter.md; docs/foundation/streakboom-foundation.vi.md
- docs/handoff/duo-characters-hypothesis.md; spec/19-duo-test-plan.md; docs/plans/duo-charter-impact.md
- docs/decisions/0080-peak-adapts-instead-of-asking-and-its-skills-are-body-language.md
- docs/decisions/0115-remind-is-built-the-first-slice-the-tag-with-arguments-and-the-kept-days.md
- docs/decisions/0128-the-screen-picture-switch-in-settings-off-by-default.md
- docs/decisions/0131-paws-is-drawn-as-the-mochi-option.md
- docs/decisions/0132-one-repository-with-a-platform-layer-and-named-zones.md
- docs/plans/loop-engineering.md; docs/hypotheses/README.md
- app/src/lib/{attention,events,beats,reactions,selector,memory,bond,state,perception}.ts
- app/src-tauri/src/picture.rs; app/src/routes/+page.svelte

## 15. Changelog v0.2 — 17/11/2026
Bổ sung review repo và trạng thái Stable/Preview; sửa baseline idle, hình ảnh Paws và đưa setting mức nhây về mở. Thêm các phản biện, bốn giả thuyết SB2 và prototype 2 pet/1 đồ vật/3 cảnh. Ghi nhận các đề xuất cũ cần đối chiếu lại, không sửa repo hay xem đề xuất là đã duyệt.


