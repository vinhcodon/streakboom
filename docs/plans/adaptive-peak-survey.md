# Adaptive Peak, step S0: the phrase survey (the form, the sheet, how it is read)

**Status:** drafted 2026-11-13, **ready for Vinh to send**; nothing has been sent and no answer exists. Part of [`adaptive-peak-plan.md`](adaptive-peak-plan.md) (step S0); it feeds step S1 and the verdict on H18. **No app code is involved.**

**What it is for.** To learn what people really type when they want to send Peak away, call it back or put it to sleep, so that a table of phrases can be written from real words, and tested on words it has not seen. Invented phrases (including ones written by a model) would only test the author's imagination.

## 1. Who and how many

- First: **5 to 8 Vietnamese-speaking adults** (the alpha candidates of roadmap R4). Then, if easy, 3 to 5 English speakers and 2 to 3 Japanese speakers; their numbers are too small for a verdict, so they only seed the English and Japanese tables (a reading, not a proof).
- Adults only (the 18+ line). Nobody is asked for a name, e-mail, workplace or any private text.
- They are told what the answers are for and that they can stop at any point. Nothing is recorded except the answers below and the language.

## 2. The form (Vietnamese; paste into a form tool of Vinh's choice, or send as a message)

> **Mấy câu hỏi ngắn về cách bạn nói chuyện với Peak (3 phút, không cần tên)**
>
> Peak là chú mèo nhỏ sống trên màn hình. Đôi khi bạn có thể gõ vào khung chat để bảo nó làm gì đó. Mình đang gom cách mọi người **thực sự** sẽ nói, để Peak hiểu được mà không cần phải hỏi lại. Bạn viết đúng như bạn sẽ gõ, ngắn gọn, không cần lịch sự. Không có câu trả lời đúng hay sai.
>
> **1.** Bạn đang làm việc, Peak đứng đó và bạn muốn nó **đi chỗ khác một lúc**. Bạn sẽ gõ gì? Viết 5 cách khác nhau nếu nghĩ ra được.
> **2.** Bạn muốn nó **quay lại**. Bạn gõ gì? (2 đến 3 cách)
> **3.** Bạn muốn nó **đi ngủ**. Bạn gõ gì? (2 đến 3 cách)
> **4.** Bạn muốn nó **im một lúc**, nhưng vẫn ở trên màn hình. Bạn gõ gì? (2 đến 3 cách)
> **5.** Viết ra **10 câu ngắn bạn thường gõ cho một trợ lý hay một người bạn** khi làm việc (không dán nội dung riêng tư; ví dụ kiểu "hôm nay trời nóng quá", "tôi sẽ đi họp lát"). Đây là để biết Peak **không** nên hiểu nhầm câu thường ngày thành lệnh.
> **6.** Bạn nói tiếng nào là chính khi gõ? (Việt / Anh / Nhật / pha trộn)
> **7.** (Không bắt buộc) Bạn có thích hay không thích cách nó "đi chỗ khác" như thế nào? Một câu thôi.
> **8.** (Không bắt buộc) Nếu được đổi **một thứ** về ngoại hình của Peak (màu lông, một món đồ đeo, hay giọng khô hơn), bạn muốn đổi gì? Nếu là màu thì màu nào? Một câu thôi. *(Câu này phục vụ giả thuyết H23 của `spec/15-customization.md`, bước C1; không liên quan tới câu lệnh.)*

English and Japanese versions of the same seven questions are made from this one when needed; the meaning of questions 1 to 5 is what matters.

## 3. How the answers are recorded

One row per phrase in a sheet (a plain file kept by Vinh, **not committed** until it has been read through for anything private):

| column | meaning |
|---|---|
| `person` | a number, 1, 2, 3 ... (not a name) |
| `lang` | `vi`, `en`, `ja`, or `mix` |
| `intent` | `leave`, `return`, `sleep`, `quiet`, or `none` (question 5 lines are `none`) |
| `text` | the phrase as written |

## 4. How it is read (fixed before any answer is seen)

- **Split by person, not by phrase.** With so few people, a split by phrase would leak (the same person's habits would be in both halves). Use **leave-one-person-out**: for each person, build the table from everyone else's phrases and test it on that person's phrases; report the average and the worst person.
- **Coverage** = the share of the held-out `leave` (and `return`, `sleep`, `quiet`) phrases that the table sends to the right skill. **False positives** = the share of the `none` phrases (question 5, and any other ordinary lines); question 8 is not part of this reading that the table sends to any skill. The matcher is the one in the plan's step S1 (whole message only, about six words or fewer, no question mark).
- Both numbers are reported with the **list of misses and of false positives**, so that Vinh sees what kind of words they are.
- A phrase that belongs to two intents (for example one person's "đi đi" meaning both leave and sleep) is listed and **not** added to either table.
- **Thresholds were set by Vinh on 2026-11-13, before any answer:** supported at 70 % coverage or more with 2 % false positives or fewer; refuted under 40 % coverage; between the two Vinh reads the misses and decides.

## 5. What this does not tell us

How people will phrase it **by voice**; what they type when they are annoyed rather than calm; whether eight people are enough (they are a reading); anything about English and Japanese beyond a few examples. The live counters of step S3 correct the first two.

## 6. What Vinh does

1. Pick the form tool, paste section 2, send it to the alpha candidates (no names collected).
2. Collect the rows into the sheet of section 3 and tell Claude where it is; Claude reads it, builds the table and the matcher test (step S1, with Vinh's go), and reports section 4's numbers.
3. (Done 2026-11-13: the thresholds are fixed; do not change them after seeing the numbers.)

## Not verified

The wording of the questions has not been tried on anyone; question 5 may give too few ordinary lines to measure a 2 % false-positive rate (a 2 % rate needs at least about 150 lines in all, so a larger set of ordinary lines may have to be collected separately).
