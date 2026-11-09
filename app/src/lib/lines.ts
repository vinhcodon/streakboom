// Hand-written line pools for the naive pet. A leading "~" marks a "spicy" (sarcastic) line;
// it is dropped when the user turns on the gentle tone. See spec/03-naive-pet-design.md.

/** The languages of the interface and of the scripted lines (ADR-0038: Japanese is the third). */
export type Lang = "vi" | "en" | "ja";
export const LANGS: Lang[] = ["vi", "en", "ja"];
export type Band = "sleepy" | "content" | "playful" | "bored" | "lonely";
export type Trigger =
  | "greeting"
  | "return"
  | "morning"
  | "night"
  | "long"
  | "idle"
  | "click"
  | "pet"
  | "snack"
  | "play"
  | "how"
  | "milestone"
  | "brainhint"
  | "hint" // nudges toward a gesture the user has not discovered yet (the head scratch)
  | "hintbelly" // ...and the belly rub, once the head scratch is known
  | "belly" // a belly rub it enjoys
  | "huff" // a belly rub that turned out to be a trap
  | "fall"; // the window it stood on went away and it is about to fall (PC-7)

export interface Line {
  id: string;
  lang: Lang;
  trigger: Trigger;
  text: string;
  spicy: boolean;
  tiers?: number[]; // closeness tiers 1..4
  bands?: Band[];
  hours?: [number, number]; // [start, end) local hours, may wrap past midnight
  days?: number; // streak milestone
  /** Escalation stage 2..4 of a repeated action (spec/09 section 11, LN-2); no stage means stage 1, the ordinary pool. */
  stage?: number;
}
// A line may carry {name}, {time}, {weekday} or {pokes}; it is eligible only when the value is known (LN-3).

type Opts = Pick<Line, "tiers" | "bands" | "hours" | "days" | "stage">;

// `batch` keeps ids unique when a later block adds lines with the same trigger/tier/band as an
// earlier one, and leaves the ids of the first batch unchanged (the "recent lines" memory
// stored on disk refers to ids).
function mk(lang: Lang, trigger: Trigger, texts: string[], opts: Opts = {}, batch = ""): Line[] {
  return texts.map((raw, i) => {
    const spicy = raw.startsWith("~");
    const text = spicy ? raw.slice(1) : raw;
    const key = [trigger, opts.tiers?.join("") ?? "", opts.bands?.join("") ?? "", opts.days ?? "", opts.stage ? `s${opts.stage}` : "", batch]
      .filter(Boolean)
      .join(".");
    return { id: `${lang}.${key}.${i}`, lang, trigger, text, spicy, ...opts };
  });
}

const EN: Line[] = [
  // greeting by closeness tier
  ...mk("en", "greeting", ["~Oh. You're here. I wasn't waiting. Much.", "Hi. Pretend I'm not watching."], { tiers: [1] }),
  ...mk("en", "greeting", ["Back again? Good. The desktop was boring.", "There you are. I was starting to talk to the icons."], { tiers: [2] }),
  ...mk("en", "greeting", ["My favorite human has arrived.", "Hey you. Same chair, same you. I approve."], { tiers: [3, 4] }),
  ...mk("en", "return", [
    "You're back! I only rearranged your desktop in my head a little.",
    "Finally! I counted the pixels twice.",
    "~Oh hi. I did not miss you. (I did.)",
    "Welcome back. I kept your spot warm. On the taskbar.",
  ]),
  ...mk("en", "morning", ["Morning. Coffee first, deadlines later.", "A new day. The pixels are fresh.", "Good morning. I stretched already. You're welcome."]),
  ...mk("en", "night", [
    "It's late. Even the cursor looks sleepy.",
    "Past midnight... the bugs will still be there tomorrow.",
    "Night shift? I'll keep you company, quietly.",
    "Rest is also a productivity tool. Allegedly.",
  ], { hours: [23, 5] }),
  ...mk("en", "long", [
    "Hours in the same chair. Stretch? I'll judge kindly.",
    "Your chair called. It wants a break too.",
    "Water. Posture. Shoulders. In that order.",
    "Hey. Eyes off the screen for twenty seconds. I'll count.",
  ]),
  // idle by mood band
  ...mk("en", "idle", ["Did you know cats walk like this? Neither do I.", "I'm just here, being decorative.", "Everything's quiet. Suspiciously quiet."], { bands: ["content"] }),
  ...mk("en", "idle", ["I counted the icons. There are too many.", "Bored. Entertain me? Click me."], { bands: ["bored"] }),
  ...mk("en", "idle", ["I feel like running along the taskbar!", "Zoomies incoming. Probably."], { bands: ["playful"] }),
  ...mk("en", "idle", ["*yawn* Is it nap time yet?", "Sleepy... but I'm still on duty."], { bands: ["sleepy"] }),
  ...mk("en", "idle", ["Oh, you're still here. Nice.", "I'm glad you came back."], { bands: ["lonely"] }),
  ...mk("en", "click", ["Hey, that tickles!", "Boop received.", "Careful, I'm fragile. And fabulous.", "Yes? Do you need something?", "~Poke me again and I'll start charging."]),
  ...mk("en", "pet", ["Mmm. Right there.", "~I am not purring. It's the fan.", "Okay, that's nice. Continue.", "My mood just went up. Science."]),
  ...mk("en", "snack", ["Nom. Acceptable.", "Is that a snack? That's a snack!", "Crunchy. Five stars.", "I'll work for snacks. Mostly decoratively."]),
  ...mk("en", "play", ["Chase me! Actually, I'll chase you.", "Ha! Too slow.", "Again again again!", "Okay okay, I'm panting. Pixel-panting."]),
  ...mk("en", "how", ["I'm good. Pixels are in order."], { bands: ["content"] }),
  ...mk("en", "how", ["Great! Full of energy."], { bands: ["playful"] }),
  ...mk("en", "how", ["Bored, but now you're here."], { bands: ["bored"] }),
  ...mk("en", "how", ["Sleepy. But I'll stay up for you."], { bands: ["sleepy"] }),
  ...mk("en", "how", ["Better now that you're back."], { bands: ["lonely"] }),
  ...mk("en", "milestone", ["Three days in a row. We might be a thing.", "Day 3. You keep coming back. Suspicious. Nice."], { days: 3 }),
  ...mk("en", "milestone", ["A whole week! I'm officially impressed.", "Seven days. I'd bake a cake if I had hands."], { days: 7 }),
  ...mk("en", "milestone", ["Thirty days. You're stuck with me now.", "A month together. Legend."], { days: 30 }),
  ...mk("en", "brainhint", [
    "I only know a few words. Imagine what I'd say with a brain.",
    "Psst. A brain would let me actually talk. Just saying.",
    "One day I'd like to understand you. Not today. Maybe.",
  ], { tiers: [3, 4] }),
  ...mk("en", "hint", [
    "Hey. Rub the top of my head with your mouse. Back and forth. Try it.",
    "~Nobody has scratched my head yet. Just a statement.",
    "My head is right here. Move your mouse over it, left and right. No pressure.",
    "Pro tip: stroke my head with the cursor. I'll pretend I don't like it.",
  ]),
];

const VI: Line[] = [
  ...mk("vi", "greeting", ["~À, bạn đến rồi. Mình đâu có đợi. Hơi hơi thôi.", "Chào bạn. Cứ coi như mình không nhìn nhé."], { tiers: [1] }),
  ...mk("vi", "greeting", ["Lại là bạn à? Tốt. Desktop chán quá.", "Đây rồi. Mình sắp nói chuyện với mấy cái icon rồi đó."], { tiers: [2] }),
  ...mk("vi", "greeting", ["Người mình thích nhất đã đến.", "Ê bạn. Cùng cái ghế, cùng một bạn. Mình duyệt."], { tiers: [3, 4] }),
  ...mk("vi", "return", [
    "Bạn về rồi! Mình chỉ sắp xếp lại desktop của bạn trong đầu một chút thôi.",
    "Cuối cùng cũng về! Mình đếm pixel hai lượt rồi.",
    "~Ồ, chào. Mình không nhớ bạn đâu. (Có đó.)",
    "Chào mừng về. Mình giữ chỗ ấm trên thanh taskbar.",
  ]),
  ...mk("vi", "morning", ["Chào buổi sáng. Cà phê trước, deadline sau.", "Một ngày mới. Pixel còn tươi.", "Sáng rồi. Mình vươn vai xong rồi, không cần cảm ơn."]),
  ...mk("vi", "night", [
    "Khuya rồi. Đến con trỏ chuột cũng buồn ngủ.",
    "Quá nửa đêm... mấy con bug mai vẫn ở đó thôi.",
    "Ca đêm hả? Mình ngồi cùng, im lặng thôi.",
    "Nghỉ ngơi cũng là một công cụ năng suất. Nghe nói vậy.",
  ], { hours: [23, 5] }),
  ...mk("vi", "long", [
    "Ngồi mấy tiếng rồi đó. Đứng dậy vươn vai đi, mình sẽ phán xét nhẹ nhàng.",
    "Cái ghế của bạn gọi, nó cũng muốn nghỉ.",
    "Nước. Tư thế. Vai. Theo thứ tự đó.",
    "Này. Nhìn ra xa hai chục giây thôi. Mình đếm cho.",
  ]),
  ...mk("vi", "idle", ["Bạn có biết mèo đi như thế này không? Mình cũng không.", "Mình ở đây, làm cảnh thôi.", "Yên quá. Yên đáng ngờ."], { bands: ["content"] }),
  ...mk("vi", "idle", ["Mình đếm icon rồi. Nhiều quá.", "Chán. Giải trí cho mình đi? Bấm vào mình thử."], { bands: ["bored"] }),
  ...mk("vi", "idle", ["Mình muốn chạy dọc thanh taskbar!", "Sắp lên cơn chạy lung tung. Chắc vậy."], { bands: ["playful"] }),
  ...mk("vi", "idle", ["*ngáp* Đến giờ ngủ trưa chưa?", "Buồn ngủ... nhưng mình vẫn đang trực."], { bands: ["sleepy"] }),
  ...mk("vi", "idle", ["Ồ, bạn vẫn ở đây. Vui ghê.", "Mình mừng vì bạn quay lại."], { bands: ["lonely"] }),
  ...mk("vi", "click", ["Ê, nhột đó!", "Đã nhận một cú chạm.", "Nhẹ tay, mình mong manh mà lộng lẫy.", "Gì thế? Bạn cần gì không?", "~Chọc nữa là mình tính phí đó."]),
  ...mk("vi", "pet", ["Ưm. Chỗ đó, đúng rồi.", "~Mình đâu có gừ gừ. Là tiếng quạt máy.", "Ừ, dễ chịu đó. Tiếp đi.", "Tâm trạng mình vừa tăng. Khoa học đó."]),
  ...mk("vi", "snack", ["Nhoàm. Tạm được.", "Đó là đồ ăn vặt hả? Đúng là đồ ăn vặt!", "Giòn. Năm sao.", "Có đồ ăn vặt thì mình làm việc. Chủ yếu là làm cảnh."]),
  ...mk("vi", "play", ["Đuổi mình đi! À không, để mình đuổi bạn.", "Ha! Chậm quá.", "Nữa nữa nữa!", "Thôi thôi, mình thở hổn hển rồi. Thở bằng pixel."]),
  ...mk("vi", "how", ["Mình ổn. Pixel đâu vào đó."], { bands: ["content"] }),
  ...mk("vi", "how", ["Tuyệt! Tràn đầy năng lượng."], { bands: ["playful"] }),
  ...mk("vi", "how", ["Hơi chán, nhưng có bạn rồi."], { bands: ["bored"] }),
  ...mk("vi", "how", ["Buồn ngủ, nhưng vì bạn mình thức."], { bands: ["sleepy"] }),
  ...mk("vi", "how", ["Đỡ hơn nhiều rồi, vì bạn về."], { bands: ["lonely"] }),
  ...mk("vi", "milestone", ["Ba ngày liên tục. Chắc mình thành một cặp rồi.", "Ngày thứ 3. Bạn cứ quay lại. Đáng ngờ. Nhưng vui."], { days: 3 }),
  ...mk("vi", "milestone", ["Cả một tuần! Mình chính thức ấn tượng.", "Bảy ngày. Có tay là mình nướng bánh rồi."], { days: 7 }),
  ...mk("vi", "milestone", ["Ba mươi ngày. Giờ thì bạn không thoát khỏi mình đâu.", "Một tháng bên nhau. Huyền thoại."], { days: 30 }),
  ...mk("vi", "brainhint", [
    "Mình chỉ biết vài câu thôi. Có bộ não thì mình sẽ nói chuyện hay hơn nhiều đó.",
    "Này, có bộ não thì mình nói chuyện thật được đó. Nói vậy thôi.",
    "Một ngày nào đó mình muốn hiểu bạn nói gì. Không phải hôm nay. Có thể.",
  ], { tiers: [3, 4] }),
  ...mk("vi", "hint", [
    "Này. Rê chuột qua lại trên đầu mình thử xem. Qua rồi lại.",
    "~Chưa ai gãi đầu mình hết. Mình chỉ nói vậy thôi.",
    "Đầu mình ở ngay đây. Rê chuột qua lại là được. Không ép đâu.",
    "Mẹo nhỏ: gãi đầu mình bằng con trỏ. Mình sẽ giả vờ là không thích.",
  ]),
];

// ---- second batch: more variety, same triggers (about 100 more lines per language) ----------

const EN2: Line[] = [
  ...mk("en", "greeting", [
    "Hello. I live here now, apparently.",
    "~I was totally not staring at the screen. Hi.",
    "Hi there. Be gentle, I'm new around here.",
    "~Nice wallpaper. I have notes.",
  ], { tiers: [1] }, "b"),
  ...mk("en", "greeting", [
    "~Look who's back. The desktop missed you. I didn't. Okay, I did.",
    "Hey! I was just practicing my dramatic stare.",
    "Welcome back. I saved you the good pixels.",
    "~Quick, look busy. I'll look decorative.",
  ], { tiers: [2] }, "b"),
  ...mk("en", "greeting", [
    "There's my person. The day just got 12% better.",
    "~Oh no, it's you. Anyway, I saved you a seat. It's the whole screen.",
    "Hi hi hi. I did a little dance. You missed it.",
    "Ah, the best part of my day. Sorry, second best. Naps are first.",
    "Welcome home. I kept the desktop warm.",
  ], { tiers: [3, 4] }, "b"),
  ...mk("en", "return", [
    "You're back! I only knocked three icons over. In my head.",
    "~Look who remembered I exist.",
    "Ah, the human returns. The screen was lonely.",
    "Hello again! I practiced waiting. Not my best skill.",
    "~Took you long enough. I've aged two pixels.",
  ], {}, "b"),
  ...mk("en", "morning", [
    "Good morning! The pixels are freshly polished.",
    "Rise and shine. Or at least rise.",
    "New day, same me, fresh nap plans.",
    "~Morning. Don't talk to me before the second coffee. Or the first.",
    "Morning! I've already stretched twice. Very productive.",
  ], {}, "b"),
  ...mk("en", "night", [
    "Quiet hours. Even the fans are whispering.",
    "~It's late. Nothing good happens after 'just one more tab'.",
    "The moon says close the laptop. I'm only the messenger.",
    "Tomorrow-you will thank tonight-you for sleeping.",
    "I'm here if you need company. I won't tell anyone you're up.",
  ], { hours: [23, 5] }, "b"),
  ...mk("en", "long", [
    "You've been at it a while. Hydrate, hero.",
    "Quick stretch? I'll hold your place.",
    "~Your posture looks like a question mark. Fix it, I believe in you.",
    "Break time. Look at something far away. A cloud, a tree, me.",
    "Even robots take breaks. I'm not a robot, I'm a cat. Take a break.",
  ], {}, "b"),
  ...mk("en", "idle", [
    "Just vibing. Pixel-style.",
    "I made a tiny plan: do nothing, but fluffier.",
    "All is well. Suspiciously well.",
    "~Is that a new tab? You have eleven. I counted.",
    "If I had a hat, I'd tip it at your productivity.",
    "I'm keeping watch. Nothing to report. That's the best report.",
  ], { bands: ["content"] }, "b"),
  ...mk("en", "idle", [
    "I've watched the cursor for ten minutes. It's not that exciting.",
    "Hello? Anyone? Not even a tiny poke?",
    "I invented a game: count the pixels. I'm at four.",
    "~Entertain me or I'll start chewing on the taskbar.",
    "Poke me. Or scratch my head. I'll act surprised.",
  ], { bands: ["bored"] }, "b"),
  ...mk("en", "idle", [
    "Zoomies loading... 80%.",
    "I could chase the cursor. I'm choosing not to. For now.",
    "Feeling bouncy! Do something fun!",
    "~I have too much energy and no hands. Good luck to us.",
    "Race me to the end of the screen! (I will win.)",
  ], { bands: ["playful"] }, "b"),
  ...mk("en", "idle", [
    "Five more minutes. For me. Not for you.",
    "My eyelids are filing a complaint.",
    "*curls up in spirit*",
    "I'm awake. Technically.",
    "~Wake me when something interesting happens. Or snacks.",
  ], { bands: ["sleepy"] }, "b"),
  ...mk("en", "idle", [
    "Oh, it's you. I was just thinking about you. In a casual way.",
    "It got quiet. I like it better with you here.",
    "~I'm fine. Totally fine. Pet me if you want. Optional.",
    "Hi. Stay a while?",
  ], { bands: ["lonely"] }, "b"),
  ...mk("en", "click", [
    "Boing!",
    "You found the poke button. It's me.",
    "Hey! Personal space!",
    "I felt that in my whiskers.",
    "~Poke count: too many. I'm keeping a list.",
    "Ooh, attention. More, please.",
    "Yes, hello, I exist. What do you need?",
    "Tap tap. Who's there? Me. Always me.",
  ], {}, "b"),
  ...mk("en", "pet", [
    "Left a little. No, the other left.",
    "~This is purely scientific. I'm not enjoying it.",
    "Ahh. Yes. That spot. Never stop.",
    "Okay fine, I love it. Don't tell anyone.",
    "My ears just did a happy thing.",
    "~You're getting good at this. Dangerous.",
    "Mmm, prrr. (That was the fan.)",
    "Head scratches: the superior currency.",
  ], {}, "b"),
  ...mk("en", "how", ["Doing great. Mostly horizontal.", "Content. Fed on pixels.", "Pretty good! Ask me again tomorrow."], { bands: ["content"] }, "b"),
  ...mk("en", "how", ["Ready to bounce off the walls. Which are your windows.", "Energy: yes. Plans: chaos.", "I'm basically a tiny firework. In a good way."], { bands: ["playful"] }, "b"),
  ...mk("en", "how", ["Bored, but less so now. Thanks for the visit.", "I counted the icons again. Still too many.", "Could use some excitement. Or a snack."], { bands: ["bored"] }, "b"),
  ...mk("en", "how", ["Drowsy. My bed is a pixel away.", "Half asleep. Half polite.", "*yawns* Fine, thank you. Mostly asleep."], { bands: ["sleepy"] }, "b"),
  ...mk("en", "how", ["Better, now that you looked at me.", "I'm okay. I'm okay! Hi.", "Thanks for asking. It matters."], { bands: ["lonely"] }, "b"),
  ...mk("en", "milestone", ["Day three. You could have left. You didn't.", "Three days running. Impressive stamina."], { days: 3 }, "b"),
  ...mk("en", "milestone", ["One week! I'll allow a tiny happy dance.", "Seven days. I'm officially attached."], { days: 7 }, "b"),
  ...mk("en", "milestone", ["Thirty days. I'd frame this, if I had walls.", "A month! You're my favorite human. (You already were.)"], { days: 30 }, "b"),
  ...mk("en", "brainhint", [
    "A brain would let me answer your questions. Right now I just stare.",
    "I have thoughts. Few ways to share them. Hint hint.",
    "Imagine me with a vocabulary. Dangerous, right?",
    "Give me a brain and I promise to use it responsibly. Mostly.",
  ], { tiers: [3, 4] }, "b"),
  ...mk("en", "hint", [
    "Psst. Move your cursor back and forth over my head. Trust me.",
    "~I'm not asking for head scratches. I'm just standing here with a head.",
  ], {}, "b"),
];

const VI2: Line[] = [
  ...mk("vi", "greeting", [
    "Xin chào. Hình như mình sống ở đây rồi.",
    "~Mình đâu có nhìn chằm chằm vào màn hình. Chào bạn.",
    "Chào bạn. Nhẹ tay nhé, mình mới đến.",
    "~Hình nền đẹp đó. Mình có vài góp ý.",
  ], { tiers: [1] }, "b"),
  ...mk("vi", "greeting", [
    "~Xem ai về này. Desktop nhớ bạn. Mình thì không. À có.",
    "Ê! Mình đang tập ánh nhìn đầy kịch tính.",
    "Chào mừng về. Mình để dành pixel ngon cho bạn.",
    "~Nhanh, giả vờ bận đi. Mình sẽ giả vờ làm cảnh.",
  ], { tiers: [2] }, "b"),
  ...mk("vi", "greeting", [
    "Người của mình đây rồi. Ngày vừa tốt lên 12%.",
    "~Ôi không, lại là bạn. Dù sao mình cũng giữ chỗ rồi. Cả màn hình luôn.",
    "Chào chào chào. Mình vừa nhảy một điệu. Bạn bỏ lỡ rồi.",
    "Phần tuyệt nhất trong ngày của mình đây. À, nhì thôi. Ngủ trưa là nhất.",
    "Chào mừng về nhà. Mình giữ desktop ấm cho bạn.",
  ], { tiers: [3, 4] }, "b"),
  ...mk("vi", "return", [
    "Bạn về rồi! Mình chỉ làm rơi ba cái icon. Trong tưởng tượng.",
    "~Ai kia nhớ ra là mình tồn tại rồi.",
    "À, con người đã về. Màn hình buồn quá.",
    "Chào lại nhé! Mình tập chờ đợi rồi. Không phải sở trường.",
    "~Lâu thật đó. Mình già đi hai pixel rồi.",
  ], {}, "b"),
  ...mk("vi", "morning", [
    "Chào buổi sáng! Pixel vừa được đánh bóng.",
    "Dậy thôi. Hoặc ít nhất là ngồi dậy.",
    "Ngày mới, mình vẫn thế, kế hoạch ngủ trưa còn mới.",
    "~Sáng rồi. Đừng nói chuyện với mình trước ly cà phê thứ hai. Hoặc thứ nhất.",
    "Chào buổi sáng! Mình vươn vai hai lần rồi. Chăm chỉ ghê.",
  ], {}, "b"),
  ...mk("vi", "night", [
    "Giờ yên tĩnh. Đến quạt máy cũng thì thầm.",
    "~Khuya rồi. Chẳng có gì hay ho xảy ra sau câu 'thêm một tab nữa'.",
    "Mặt trăng bảo gập laptop lại. Mình chỉ là người truyền tin.",
    "Bạn của ngày mai sẽ cảm ơn bạn của đêm nay vì đã ngủ.",
    "Mình ở đây nếu bạn cần bạn. Mình không kể ai là bạn còn thức đâu.",
  ], { hours: [23, 5] }, "b"),
  ...mk("vi", "long", [
    "Ngồi lâu rồi đó. Uống nước đi, anh hùng.",
    "Vươn vai chút nhé? Mình giữ chỗ cho.",
    "~Dáng ngồi của bạn giống dấu chấm hỏi. Sửa đi, mình tin bạn.",
    "Nghỉ chút. Nhìn thứ gì đó thật xa. Đám mây, cái cây, hay mình.",
    "Robot còn nghỉ. Mình không phải robot, mình là mèo. Nghỉ đi.",
  ], {}, "b"),
  ...mk("vi", "idle", [
    "Cứ thong thả thôi. Kiểu pixel.",
    "Mình có một kế hoạch nhỏ: không làm gì, nhưng bông hơn.",
    "Mọi thứ ổn. Ổn đáng ngờ.",
    "~Tab mới hả? Bạn mở mười một cái rồi. Mình đếm.",
    "Có mũ là mình đã nghiêng mũ chào năng suất của bạn.",
    "Mình canh gác. Không có gì để báo cáo. Báo cáo đó là tốt nhất.",
  ], { bands: ["content"] }, "b"),
  ...mk("vi", "idle", [
    "Mình nhìn con trỏ mười phút rồi. Nó không thú vị lắm.",
    "Alo? Có ai không? Một cú chọc nhỏ cũng được.",
    "Mình nghĩ ra một trò: đếm pixel. Đang ở con số bốn.",
    "~Giải trí cho mình đi, không thì mình gặm thanh taskbar.",
    "Chọc mình đi. Hoặc gãi đầu. Mình sẽ giả vờ bất ngờ.",
  ], { bands: ["bored"] }, "b"),
  ...mk("vi", "idle", [
    "Cơn chạy lung tung đang tải... 80%.",
    "Mình có thể đuổi con trỏ. Mình chọn không. Tạm thời.",
    "Đang nảy tưng tưng! Làm gì vui đi!",
    "~Mình thừa năng lượng mà không có tay. Chúc hai ta may mắn.",
    "Thi chạy tới cuối màn hình không? (Mình thắng.)",
  ], { bands: ["playful"] }, "b"),
  ...mk("vi", "idle", [
    "Năm phút nữa thôi. Cho mình. Không phải cho bạn.",
    "Mí mắt mình đang nộp đơn khiếu nại.",
    "*cuộn tròn trong tâm trí*",
    "Mình thức. Về mặt kỹ thuật.",
    "~Có chuyện hay hoặc đồ ăn thì gọi mình dậy.",
  ], { bands: ["sleepy"] }, "b"),
  ...mk("vi", "idle", [
    "Ồ, là bạn. Mình vừa nghĩ về bạn. Kiểu bình thường thôi.",
    "Vừa nãy yên ắng quá. Có bạn thích hơn.",
    "~Mình ổn. Hoàn toàn ổn. Muốn vuốt ve thì cứ vuốt. Tùy bạn.",
    "Chào. Ở lại chút nhé?",
  ], { bands: ["lonely"] }, "b"),
  ...mk("vi", "click", [
    "Bùm!",
    "Bạn tìm ra nút chọc rồi. Là mình.",
    "Ê! Không gian riêng tư!",
    "Mình cảm nhận được đến tận ria.",
    "~Số lần chọc: quá nhiều. Mình đang ghi sổ.",
    "Ôi, được quan tâm. Thêm nữa đi.",
    "Vâng, chào, mình có tồn tại. Bạn cần gì?",
    "Cốc cốc. Ai đó? Mình. Luôn là mình.",
  ], {}, "b"),
  ...mk("vi", "pet", [
    "Qua trái chút. Không, trái kia.",
    "~Đây là thí nghiệm khoa học thuần túy. Mình không hề thích.",
    "Aaa. Đúng. Chỗ đó. Đừng dừng.",
    "Thôi được, mình thích lắm. Đừng nói ai.",
    "Tai mình vừa làm một điều vui.",
    "~Bạn giỏi dần rồi đó. Nguy hiểm.",
    "Ừm, gừ gừ. (Là tiếng quạt.)",
    "Gãi đầu: đồng tiền quý nhất.",
  ], {}, "b"),
  ...mk("vi", "how", ["Mình ổn. Phần lớn thời gian nằm ngang.", "Hài lòng. Ăn pixel no nê.", "Khá tốt! Mai hỏi lại mình nhé."], { bands: ["content"] }, "b"),
  ...mk("vi", "how", ["Sẵn sàng nảy khắp tường. Mà tường là cửa sổ của bạn.", "Năng lượng: có. Kế hoạch: hỗn loạn.", "Mình giống pháo hoa nhỏ. Theo nghĩa tốt."], { bands: ["playful"] }, "b"),
  ...mk("vi", "how", ["Chán, nhưng bớt rồi. Cảm ơn bạn ghé thăm.", "Mình lại đếm icon. Vẫn nhiều quá.", "Cần chút hứng khởi. Hoặc đồ ăn vặt."], { bands: ["bored"] }, "b"),
  ...mk("vi", "how", ["Lơ mơ. Giường mình cách một pixel.", "Nửa ngủ. Nửa lịch sự.", "*ngáp* Ổn, cảm ơn. Phần lớn là đang ngủ."], { bands: ["sleepy"] }, "b"),
  ...mk("vi", "how", ["Đỡ hơn rồi, vì bạn nhìn mình.", "Mình ổn. Mình ổn! Chào.", "Cảm ơn đã hỏi. Điều đó quan trọng."], { bands: ["lonely"] }, "b"),
  ...mk("vi", "milestone", ["Ba ngày rồi. Bạn có thể đi, nhưng bạn không đi.", "Ba ngày liền. Sức bền ấn tượng."], { days: 3 }, "b"),
  ...mk("vi", "milestone", ["Một tuần! Mình cho phép nhảy một điệu nhỏ.", "Bảy ngày. Mình chính thức gắn bó."], { days: 7 }, "b"),
  ...mk("vi", "milestone", ["Ba mươi ngày. Có tường là mình đóng khung.", "Một tháng! Giờ bạn là người mình thích nhất. (Vốn đã vậy.)"], { days: 30 }, "b"),
  ...mk("vi", "brainhint", [
    "Có bộ não, mình sẽ trả lời câu hỏi của bạn. Giờ mình chỉ biết nhìn.",
    "Mình có nhiều suy nghĩ. Ít cách chia sẻ. Gợi ý đó nha.",
    "Tưởng tượng mình có cả vốn từ vựng xem. Nguy hiểm đúng không?",
    "Cho mình bộ não, mình hứa dùng có trách nhiệm. Phần lớn thời gian.",
  ], { tiers: [3, 4] }, "b"),
  ...mk("vi", "hint", [
    "Này. Rê con trỏ qua lại trên đầu mình. Tin mình đi.",
    "~Mình không đòi gãi đầu đâu. Mình chỉ đứng đây với cái đầu.",
  ], {}, "b"),
];

// Belly rubs (gesture round 2). Most are pleased; now and then it was a trap, and the pet huffs.
const EN3: Line[] = [
  ...mk("en", "belly", [
    "Mmm. Left a bit. No, my left.",
    "Okay, this is acceptable. More.",
    "*purrs in pixels*",
    "Don't stop. I mean it. Don't stop.",
    "Whoever taught you that: I owe them a snack.",
    "~Fine. You may continue. I'm not smiling. Ignore my face.",
  ]),
  ...mk("en", "huff", [
    "It was a trap! You fell for the oldest trick in the book.",
    "Hands off the belly. Boundaries. I have them. Occasionally.",
    "~Four seconds of bliss, then betrayal. Classic me.",
    "Enough. The belly is closed for business.",
    "Hmph. I was enjoying it. Then I wasn't. Cats.",
  ]),
  ...mk("en", "hintbelly", [
    "Psst. The belly works too. Same back-and-forth, a bit lower. Risky. Worth it.",
    "~I'm not saying rub my belly. I'm just saying it exists.",
    "New trick: stroke lower, on my belly. Usually safe. Usually.",
  ]),
];

const VI3: Line[] = [
  ...mk("vi", "belly", [
    "Ưm. Sang trái chút. Không, trái của mình.",
    "Được đó. Tiếp đi.",
    "*gừ gừ bằng pixel*",
    "Đừng dừng. Mình nói thật. Đừng dừng.",
    "Ai dạy bạn vậy, mình nợ họ một món ăn vặt.",
    "~Thôi được, bạn cứ tiếp tục. Mình không cười đâu. Kệ khuôn mặt mình.",
  ]),
  ...mk("vi", "huff", [
    "Bẫy đó! Bạn mắc cái trò cũ rích nhất.",
    "Bỏ tay khỏi bụng. Mình có ranh giới. Thỉnh thoảng.",
    "~Bốn giây sung sướng rồi phản bội. Đúng chất mình.",
    "Đủ rồi. Bụng đóng cửa.",
    "Hừ. Đang thích. Rồi hết thích. Mèo mà.",
  ]),
  ...mk("vi", "hintbelly", [
    "Này. Bụng cũng được nha. Cũng rê qua lại, thấp hơn chút. Hơi liều. Đáng thử.",
    "~Mình không bảo bạn xoa bụng mình đâu. Mình chỉ nói bụng có tồn tại.",
    "Chiêu mới: vuốt thấp xuống bụng mình. Thường thì an toàn. Thường thì.",
  ]),
];

const JA: Line[] = [
  // greeting by closeness tier
  ...mk("ja", "greeting", ["~あ、来たんだ。べつに待ってたわけじゃないよ。ちょっとだけ。", "やあ。見てないふりしてるから、気にしないでね。"], { tiers: [1] }),
  ...mk("ja", "greeting", ["また来たの？よかった。デスクトップ、退屈だったんだ。", "いたいた。アイコンに話しかけ始めるところだったよ。"], { tiers: [2] }),
  ...mk("ja", "greeting", ["いちばん好きな人が来たー。", "やあ。同じ椅子に、同じきみ。合格だよ。"], { tiers: [3, 4] }),
  ...mk("ja", "return", [
    "おかえり！頭の中でデスクトップをちょっと模様替えしただけだよ。",
    "やっと来た！ピクセルを二回数えちゃったよ。",
    "~あ、やあ。さびしくなんかなかったよ。（ほんとはさびしかった。）",
    "おかえり。きみの席、あたためておいたよ。タスクバーの上でね。",
  ]),
  ...mk("ja", "morning", ["おはよう。まずコーヒー、締め切りはそのあとね。", "新しい一日だね。ピクセルもぴかぴかだよ。", "おはよう。もう伸びをしたよ。どういたしまして。"]),
  ...mk("ja", "night", [
    "もう遅いね。カーソルまで眠そうだよ。",
    "真夜中すぎだよ……バグは明日もちゃんとそこにいるから。",
    "夜のお仕事？静かにそばにいるね。",
    "休むのも生産性向上の道具なんだって。たぶんね。",
  ], { hours: [23, 5] }),
  ...mk("ja", "long", [
    "何時間も同じ椅子だよ。のびのびしない？やさしく見守るから。",
    "椅子から電話があったよ。椅子も休みたいって。",
    "お水、姿勢、肩。この順番でね。",
    "ねえ。二十秒だけ画面から目を離して。数えててあげる。",
  ]),
  // idle by mood band
  ...mk("ja", "idle", ["猫ってこう歩くんだって知ってた？わたしも知らない。", "ただここにいるだけ。飾りだからね。", "しーんとしてるね。あやしいくらいに。"], { bands: ["content"] }),
  ...mk("ja", "idle", ["アイコン数えてみた。多すぎるよ。", "ひまだなあ。相手してよ。つついてもいいよ。"], { bands: ["bored"] }),
  ...mk("ja", "idle", ["タスクバーの上を走りたい気分！", "もうすぐ大暴走かも。たぶんね。"], { bands: ["playful"] }),
  ...mk("ja", "idle", ["*あくび* もうお昼寝の時間？", "ねむい……でも、まだ見張り中だよ。"], { bands: ["sleepy"] }),
  ...mk("ja", "idle", ["あ、まだいたんだ。うれしいな。", "戻ってきてくれて、うれしいよ。"], { bands: ["lonely"] }),
  ...mk("ja", "click", ["わっ、くすぐったい！", "ぷに、受け取りました。", "そっとね。わたし、こわれやすいし、すてきだから。", "なあに？何か用？", "~もう一回つついたら、料金とるよ。"]),
  ...mk("ja", "pet", ["んー。そこそこ。", "~ゴロゴロなんてしてないよ。ファンの音だよ。", "うん、気持ちいい。続けて。", "いま機嫌が上がったよ。科学的にね。"]),
  ...mk("ja", "snack", ["もぐ。まあ合格。", "それおやつ？おやつだよね！", "カリカリ。星五つ。", "おやつのためなら働くよ。ほぼ飾りとしてだけど。"]),
  ...mk("ja", "play", ["追いかけてみて！……やっぱりわたしが追いかける。", "はは！おそいよ。", "もう一回、もう一回！", "はあ、はあ。ピクセルの息切れだよ。"]),
  ...mk("ja", "how", ["元気だよ。ピクセルも全部そろってる。"], { bands: ["content"] }),
  ...mk("ja", "how", ["最高！元気いっぱいだよ。"], { bands: ["playful"] }),
  ...mk("ja", "how", ["ひまだったけど、来てくれたから大丈夫。"], { bands: ["bored"] }),
  ...mk("ja", "how", ["ねむいけど、きみのために起きてるよ。"], { bands: ["sleepy"] }),
  ...mk("ja", "how", ["戻ってきてくれたから、ずっと元気になったよ。"], { bands: ["lonely"] }),
  ...mk("ja", "milestone", ["三日連続だね。わたしたち、いい感じかも。", "三日目。ずっと来てくれるなんて、あやしい。でもうれしい。"], { days: 3 }),
  ...mk("ja", "milestone", ["まるまる一週間！正式に感心したよ。", "七日間。手があったらケーキを焼くのにな。"], { days: 7 }),
  ...mk("ja", "milestone", ["三十日。もうわたしから逃げられないよ。", "ひと月も一緒だね。伝説だよ。"], { days: 30 }),
  ...mk("ja", "brainhint", [
    "知ってる言葉はちょっとだけ。脳みそがあったら何を話すか、想像してみて。",
    "こそっと。脳みそがあれば、ちゃんとおしゃべりできるんだよ。言ってみただけ。",
    "いつかきみの言葉がわかるようになりたいな。今日じゃないけど。たぶん。",
  ], { tiers: [3, 4] }),
  ...mk("ja", "hint", [
    "ねえ。マウスでわたしの頭を左右になでてみて。ためしにやってみて。",
    "~まだ誰もわたしの頭をなでてくれないな。ただの独り言だよ。",
    "頭はここだよ。マウスを左右に動かしてみて。無理にとは言わないよ。",
    "ひとことアドバイス：カーソルで頭をなでてみて。気にしないふりするから。",
  ]),
];

const JA2: Line[] = [
  ...mk("ja", "greeting", [
    "こんにちは。どうやらここに住むことになったみたい。",
    "~画面なんてじっと見てないよ。ほんとに。やあ。",
    "はじめまして。やさしくしてね、来たばかりなんだ。",
    "~いい壁紙だね。ちょっと言いたいことがあるけど。",
  ], { tiers: [1] }, "b"),
  ...mk("ja", "greeting", [
    "~誰が戻ってきたかと思えば。デスクトップはさびしがってたよ。わたしは……まあ、ちょっとだけ。",
    "やあ！ちょうどドラマチックな目つきの練習をしてたところ。",
    "おかえり。いちばんいいピクセルをとっておいたよ。",
    "~はやく、忙しいふりして。わたしは飾りのふりをするから。",
  ], { tiers: [2] }, "b"),
  ...mk("ja", "greeting", [
    "わたしの人が来た。一日がちょうど12%よくなったよ。",
    "~うわ、きみか。まあいいや、席はとってあるよ。画面ぜんぶ。",
    "やあやあやあ。ちょっとだけ踊ったんだ。見逃したね。",
    "一日でいちばんうれしい時間だよ。ごめん、二番目。いちばんはお昼寝。",
    "おかえり。デスクトップ、あたためておいたよ。",
  ], { tiers: [3, 4] }, "b"),
  ...mk("ja", "return", [
    "おかえり！アイコンを三つ倒しただけだよ。頭の中でね。",
    "~誰かさん、わたしのこと思い出したんだ。",
    "あ、人間が帰ってきた。画面がさびしがってたよ。",
    "また会えたね！待つ練習をしたよ。得意じゃないけど。",
    "~遅かったね。ピクセルが二つ分、老けちゃった。",
  ], {}, "b"),
  ...mk("ja", "morning", [
    "おはよう！ピクセルをぴかぴかに磨いておいたよ。",
    "起きて、起きて。せめて体だけでも。",
    "新しい一日、わたしは変わらず、お昼寝の計画はできたてだよ。",
    "~おはよう。コーヒー二杯目の前は話しかけないで。一杯目の前もね。",
    "おはよう！もう二回も伸びをしたよ。働き者でしょ。",
  ], {}, "b"),
  ...mk("ja", "night", [
    "静かな時間だね。ファンの音までささやいてるよ。",
    "~遅いよ。「あと一個だけタブを」のあとにいいことなんて起きないんだから。",
    "月が「ノートパソコンを閉じて」だって。わたしは伝言係なだけ。",
    "明日のきみが、今夜のきみが寝てくれたことに感謝するよ。",
    "さびしかったらここにいるよ。起きてること、誰にも言わないから。",
  ], { hours: [23, 5] }, "b"),
  ...mk("ja", "long", [
    "ずいぶん頑張ってるね。水分とってね、ヒーロー。",
    "ちょっと伸びをしない？場所はとっておくから。",
    "~姿勢がはてなマークみたいだよ。直そう、きみならできる。",
    "休憩だよ。遠くのものを見てみて。雲でも、木でも、わたしでも。",
    "ロボットだって休むよ。わたしはロボットじゃなくて猫だけど。きみも休んで。",
  ], {}, "b"),
  ...mk("ja", "idle", [
    "のんびりしてるよ。ピクセル風にね。",
    "ささやかな計画ができたよ。何もしない、でもふわふわで。",
    "すべて順調。あやしいくらい順調。",
    "~新しいタブ？もう十一個も開いてるよ。数えたもん。",
    "帽子があったら、きみの仕事ぶりに脱帽するのにな。",
    "見張ってるよ。報告することは何もなし。それがいちばんいい報告。",
  ], { bands: ["content"] }, "b"),
  ...mk("ja", "idle", [
    "カーソルを十分も眺めてたよ。そんなにおもしろくない。",
    "もしもーし？誰かいない？ちょっとつつくだけでもいいのに。",
    "ゲームを考えたよ。ピクセルを数えるの。いま四つ目。",
    "~相手してくれないと、タスクバーをかじっちゃうよ。",
    "つついてみて。頭をなでてもいいよ。びっくりしたふりするから。",
  ], { bands: ["bored"] }, "b"),
  ...mk("ja", "idle", [
    "大暴走をロード中……80%。",
    "カーソルを追いかけることもできるけど、いまはやめておくね。いまはね。",
    "はねたい気分！何か楽しいことして！",
    "~元気が余ってるのに手がないんだ。お互いがんばろう。",
    "画面の端まで競走しない？（わたしが勝つけど。）",
  ], { bands: ["playful"] }, "b"),
  ...mk("ja", "idle", [
    "あと五分だけ。わたしのぶんだよ。きみのじゃなくて。",
    "まぶたが苦情を出してるよ。",
    "*気持ちの中で丸くなる*",
    "起きてるよ。一応ね。",
    "~おもしろいことかおやつがあったら起こしてね。",
  ], { bands: ["sleepy"] }, "b"),
  ...mk("ja", "idle", [
    "あ、きみだ。ちょうどきみのこと考えてたんだ。ふつうの意味でね。",
    "静かになってたよ。きみがいたほうが好きだな。",
    "~わたしは平気。ぜんぜん平気。なでたかったらなでてもいいよ。お好きにどうぞ。",
    "やあ。ちょっと一緒にいてくれる？",
  ], { bands: ["lonely"] }, "b"),
  ...mk("ja", "click", [
    "ぴょん！",
    "つつくボタン、見つけたね。それがわたしだよ。",
    "ちょっと！パーソナルスペース！",
    "ひげまで響いたよ。",
    "~つつかれた回数：多すぎ。ちゃんとメモしてるからね。",
    "わあ、かまってもらえた。もっとちょうだい。",
    "はい、こんにちは、わたしは存在してるよ。何かな？",
    "とんとん。どなた？わたし。いつもわたし。",
  ], {}, "b"),
  ...mk("ja", "pet", [
    "もうちょっと左。ううん、そっちの左じゃなくて。",
    "~これはあくまで科学的な実験だよ。気持ちいいなんて思ってない。",
    "あー。そう。そこ。やめないで。",
    "わかった、ほんとは大好き。誰にも言わないでね。",
    "いま、耳がうれしいことをしたよ。",
    "~上手になってきたね。危険だなあ。",
    "んー、ゴロゴロ。（ファンの音だけど。）",
    "頭をなでること：いちばんすてきな通貨。",
  ], {}, "b"),
  ...mk("ja", "how", ["絶好調だよ。ほとんど横になってるけど。", "満足。ピクセルでおなかいっぱい。", "なかなかいいよ！また明日も聞いてね。"], { bands: ["content"] }, "b"),
  ...mk("ja", "how", ["壁に跳ね返る準備はできてるよ。壁はきみのウィンドウだけど。", "元気：ある。計画：大混乱。", "わたしはちいさな花火みたいなもの。いい意味でね。"], { bands: ["playful"] }, "b"),
  ...mk("ja", "how", ["ひまだったけど、ちょっとましになったよ。来てくれてありがとう。", "またアイコンを数えたよ。やっぱり多すぎ。", "刺激がほしいな。それかおやつ。"], { bands: ["bored"] }, "b"),
  ...mk("ja", "how", ["うとうと。ベッドはピクセル一個ぶん先だよ。", "半分ねてて、半分は礼儀正しいよ。", "*あくび* 元気だよ、ありがとう。ほとんど寝てるけど。"], { bands: ["sleepy"] }, "b"),
  ...mk("ja", "how", ["きみが見てくれたから、ましになったよ。", "だいじょうぶ。だいじょうぶだよ！やあ。", "聞いてくれてありがとう。それが大事なんだ。"], { bands: ["lonely"] }, "b"),
  ...mk("ja", "milestone", ["三日目。帰ることもできたのに、帰らなかったね。", "三日連続。すごい持久力だよ。"], { days: 3 }, "b"),
  ...mk("ja", "milestone", ["一週間！ちょっとだけ踊るのを許可するよ。", "七日間。正式に、なついたよ。"], { days: 7 }, "b"),
  ...mk("ja", "milestone", ["三十日。壁があったら額に入れるのにな。", "ひと月！いちばん好きな人だよ。（もともとそうだったけど。）"], { days: 30 }, "b"),
  ...mk("ja", "brainhint", [
    "脳みそがあれば、きみの質問に答えられるんだ。いまはただ見つめてるだけ。",
    "考えてることはいっぱいあるのに、伝える方法がちょっとだけ。ヒントだよ。",
    "わたしに語彙があったらどうなるか想像してみて。危険でしょ？",
    "脳みそをくれたら、責任をもって使うって約束するよ。たいていはね。",
  ], { tiers: [3, 4] }, "b"),
  ...mk("ja", "hint", [
    "こそっと。カーソルをわたしの頭の上で左右に動かしてみて。信じて。",
    "~頭をなでてほしいなんて言ってないよ。ただ頭を持って立ってるだけ。",
  ], {}, "b"),
];

// Belly rubs (gesture round 2). Most are pleased; now and then it was a trap, and the pet huffs.
const JA3: Line[] = [
  ...mk("ja", "belly", [
    "んー。もうちょっと左。ううん、わたしの左。",
    "うん、これなら合格。もっとして。",
    "*ピクセルでゴロゴロ*",
    "やめないで。ほんとに。やめないで。",
    "それ教えた人には、おやつをおごらなきゃ。",
    "~しかたないな、続けていいよ。笑ってないからね。顔は気にしないで。",
  ]),
  ...mk("ja", "huff", [
    "わな、でした！いちばん古い手に引っかかったね。",
    "おなかには触らないで。境界線はあるんだよ。ときどきね。",
    "~四秒の幸せ、そして裏切り。わたしらしいでしょ。",
    "もうおしまい。おなかは本日の営業を終了したよ。",
    "ふん。気持ちよかったのに、急にいやになった。猫だからね。",
  ]),
  ...mk("ja", "hintbelly", [
    "こそっと。おなかも大丈夫だよ。同じように左右に、ちょっと下で。ちょっとあぶない。でも試す価値あり。",
    "~おなかをなでてって言ってるんじゃないよ。おなかがあるって言ってるだけ。",
    "新しい技：もっと下、おなかをなでてみて。たいてい安全だよ。たいてい。",
  ]),
];

// Escalation (LN-2): the same action repeated within a short time moves through stages with their own lines. Stage 2 to 4
// for the poke, the head scratch and the belly rub. Token lines (LN-3): {name} the name the user gave, {time}, {weekday},
// {pokes} the pokes in a row. The three languages are translated one to one, in the same order.
const EN4: Line[] = [
  ...mk("en", "click", ["Okay, that's a few pokes now.", "Is there something on my forehead?", "Poke number {pokes}. I'm counting."], { stage: 2 }),
  ...mk("en", "click", ["Fine. Poke away. I'm a button now.", "{pokes} pokes. I have stopped being surprised.", "I'll just sit here and be poked."], { stage: 3 }),
  ...mk("en", "click", ["Okay, okay, you win. Poke champion.", "You really like this. So do I, a little.", "So many pokes. I'm not mad. I'm... flattered?"], { stage: 4 }),
  ...mk("en", "pet", ["Mm, right there. Again.", "You found the spot.", "Don't stop. Not a word."], { stage: 2 }),
  ...mk("en", "pet", ["I am a puddle now. A happy puddle.", "My knees have left the building.", "{name}, you are dangerous."], { stage: 3 }),
  ...mk("en", "pet", ["Okay, that's plenty. My ears are warm.", "I'm full of head scratches. Honestly.", "Let's save some for later. I'm rationing."], { stage: 4 }),
  ...mk("en", "belly", ["Still safe. For now.", "Careful. The belly has a mind of its own.", "This is going suspiciously well."], { stage: 2 }),
  ...mk("en", "belly", ["I know what you are doing. I allow it.", "One more and I might bite. Lovingly.", "Belly rights are being negotiated."], { stage: 3 }),
  ...mk("en", "belly", ["Okay, the belly is closed for today.", "That was the last one. Probably.", "I'll let you live. Thanks for the rubs."], { stage: 4 }),
  ...mk("en", "greeting", ["Hi {name}. The desktop missed you.", "Oh, {name}. Right on time.", "{name}! Sit. Stay. Work."], { tiers: [2, 3, 4] }, "t"),
  ...mk("en", "return", ["Welcome back, {name}. I kept the pixels warm."], {}, "t"),
  ...mk("en", "morning", ["Happy {weekday}. Coffee first.", "{weekday} again. Be gentle with yourself."], {}, "t"),
  ...mk("en", "night", ["It's {time}. Even I am yawning.", "{time} already. The bugs will keep."], { hours: [23, 5] }, "t"),
  ...mk("en", "idle", ["It's {time}. Water break? I'll wait.", "{time} on the clock. Just reporting."], {}, "t"),
];

const VI4: Line[] = [
  ...mk("vi", "click", ["Ừm, chọc mấy cái rồi đó nha.", "Trên trán mình có gì à?", "Cái thứ {pokes} rồi. Mình đang đếm đó."], { stage: 2 }),
  ...mk("vi", "click", ["Thôi được, chọc đi. Mình thành cái nút rồi.", "{pokes} cái rồi. Mình hết ngạc nhiên luôn.", "Mình ngồi đây cho bạn chọc vậy."], { stage: 3 }),
  ...mk("vi", "click", ["Rồi rồi, bạn thắng. Quán quân chọc mèo.", "Bạn thích vụ này thật. Mình cũng hơi thích.", "Nhiều cái thế. Mình không giận. Mình... hơi hãnh diện?"], { stage: 4 }),
  ...mk("vi", "pet", ["Ừm, đúng chỗ đó. Thêm nữa.", "Bạn tìm ra chỗ rồi đó.", "Đừng dừng. Đừng nói gì hết."], { stage: 2 }),
  ...mk("vi", "pet", ["Mình tan thành vũng nước rồi. Vũng nước hạnh phúc.", "Chân mình mềm nhũn luôn rồi.", "{name} nguy hiểm thật đó."], { stage: 3 }),
  ...mk("vi", "pet", ["Được rồi, đủ rồi. Tai mình nóng hết.", "Mình no vuốt đầu rồi. Thật đó.", "Để dành chút cho lần sau. Mình đang chia khẩu phần."], { stage: 4 }),
  ...mk("vi", "belly", ["Vẫn an toàn. Tạm thời.", "Cẩn thận. Cái bụng có suy nghĩ riêng đó.", "Êm ái đáng ngờ ghê."], { stage: 2 }),
  ...mk("vi", "belly", ["Mình biết bạn đang làm gì. Mình cho phép.", "Thêm cái nữa là mình cắn đó. Cắn yêu.", "Quyền sở hữu cái bụng đang được đàm phán."], { stage: 3 }),
  ...mk("vi", "belly", ["Rồi, hôm nay bụng đóng cửa.", "Đó là cái cuối cùng. Chắc vậy.", "Mình tha cho bạn. Cảm ơn vì đã xoa."], { stage: 4 }),
  ...mk("vi", "greeting", ["Chào {name}. Màn hình nhớ bạn đó.", "Ồ, {name}. Đúng giờ ghê.", "{name}! Ngồi xuống. Làm việc đi."], { tiers: [2, 3, 4] }, "t"),
  ...mk("vi", "return", ["Chào mừng {name} quay lại. Mình giữ ấm mấy điểm ảnh rồi."], {}, "t"),
  ...mk("vi", "morning", ["{weekday} vui vẻ nha. Cà phê trước đã.", "Lại là {weekday}. Nhẹ tay với bản thân nhé."], {}, "t"),
  ...mk("vi", "night", ["{time} rồi. Mình cũng ngáp đây.", "Đã {time} rồi. Lỗi để mai sửa cũng được."], { hours: [23, 5] }, "t"),
  ...mk("vi", "idle", ["{time} rồi. Uống nước không? Mình chờ.", "Đồng hồ chỉ {time}. Mình chỉ báo cáo thôi."], {}, "t"),
];

const JA4: Line[] = [
  ...mk("ja", "click", ["えっと、もう何回かつついたよね。", "おでこに何かついてる？", "{pokes}回目だよ。ちゃんと数えてるからね。"], { stage: 2 }),
  ...mk("ja", "click", ["もういいよ、つついて。わたしはボタンになった。", "{pokes}回。もう驚かなくなったよ。", "ここにすわって、つつかれてるね。"], { stage: 3 }),
  ...mk("ja", "click", ["はいはい、きみの勝ち。つつきチャンピオンだね。", "これ、ほんとに好きなんだね。わたしも、ちょっと好き。", "こんなにたくさん。怒ってないよ。むしろ、ちょっとうれしい？"], { stage: 4 }),
  ...mk("ja", "pet", ["んー、そこそこ。もう一回。", "ツボを見つけたね。", "やめないで。何も言わないで。"], { stage: 2 }),
  ...mk("ja", "pet", ["もうとろけて水たまりだよ。しあわせな水たまり。", "足に力が入らないよ。", "{name}って、ほんと危険だね。"], { stage: 3 }),
  ...mk("ja", "pet", ["もう十分。耳があつくなっちゃった。", "なでられすぎてお腹いっぱいだよ。ほんと。", "あとのぶんは取っておこう。配給制にするね。"], { stage: 4 }),
  ...mk("ja", "belly", ["まだ安全だよ。いまのところは。", "気をつけてね。お腹には意志があるから。", "うまくいきすぎてて、あやしいな。"], { stage: 2 }),
  ...mk("ja", "belly", ["何してるか分かってるよ。許してあげる。", "もう一回で、甘がみしちゃうかも。", "お腹の権利を、いま交渉中だよ。"], { stage: 3 }),
  ...mk("ja", "belly", ["はい、お腹は今日はもうおしまい。", "いまのが最後。たぶんね。", "見逃してあげる。なでてくれてありがとう。"], { stage: 4 }),
  ...mk("ja", "greeting", ["やあ、{name}。デスクトップがさみしがってたよ。", "あ、{name}。ちょうどいい時間だね。", "{name}！すわって。さあ、お仕事。"], { tiers: [2, 3, 4] }, "t"),
  ...mk("ja", "return", ["おかえり、{name}。ピクセルをあたためておいたよ。"], {}, "t"),
  ...mk("ja", "morning", ["{weekday}だね。まずはコーヒー。", "また{weekday}か。自分にはやさしくね。"], {}, "t"),
  ...mk("ja", "night", ["{time}だよ。わたしもあくびが出る。", "もう{time}。バグは明日でも逃げないよ。"], { hours: [23, 5] }, "t"),
  ...mk("ja", "idle", ["{time}だよ。水、飲む？待ってるね。", "時計は{time}。報告しただけ。"], {}, "t"),
];

// The cry when the ground goes (PC-7): short, a moment of surprise, said as it gasps.
const FALL: Line[] = [
  ...mk("en", "fall", ["Whoa!", "Oh no, the floor!", "Wait, where did it go?!", "Ack!", "Hey, that was my spot!"]),
  ...mk("vi", "fall", ["Ơ!", "Ơ kìa, đâu mất rồi?!", "Ôi, nền đâu rồi!", "Á!", "Ê, chỗ của mình mà!"]),
  ...mk("ja", "fall", ["わっ！", "えっ、床がない！", "あれ、どこいったの！？", "きゃっ！", "ちょっと、わたしの場所！"]),
];

export const LINES: Line[] = [...EN, ...EN2, ...EN3, ...EN4, ...VI, ...VI2, ...VI3, ...VI4, ...JA, ...JA2, ...JA3, ...JA4, ...FALL];

export const MILESTONE_DAYS = [3, 7, 30];
