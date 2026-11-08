// Hand-written line pools for the naive pet. A leading "~" marks a "spicy" (sarcastic) line;
// it is dropped when the user turns on the gentle tone. See spec/03-naive-pet-design.md.

export type Lang = "vi" | "en";
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
  | "huff"; // a belly rub that turned out to be a trap

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
}

type Opts = Pick<Line, "tiers" | "bands" | "hours" | "days">;

// `batch` keeps ids unique when a later block adds lines with the same trigger/tier/band as an
// earlier one, and leaves the ids of the first batch unchanged (the "recent lines" memory
// stored on disk refers to ids).
function mk(lang: Lang, trigger: Trigger, texts: string[], opts: Opts = {}, batch = ""): Line[] {
  return texts.map((raw, i) => {
    const spicy = raw.startsWith("~");
    const text = spicy ? raw.slice(1) : raw;
    const key = [trigger, opts.tiers?.join("") ?? "", opts.bands?.join("") ?? "", opts.days ?? "", batch]
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

export const LINES: Line[] = [...EN, ...EN2, ...EN3, ...VI, ...VI2, ...VI3];

export const MILESTONE_DAYS = [3, 7, 30];
