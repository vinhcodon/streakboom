// Hand-written line pools for the naive pet. A leading "~" marks a "spicy" (sarcastic) line;
// it is dropped when the user turns on the gentle tone. See naive_pet_design.md.

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
  | "hint"; // nudges toward a gesture the user has not discovered yet

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

function mk(lang: Lang, trigger: Trigger, texts: string[], opts: Opts = {}): Line[] {
  return texts.map((raw, i) => {
    const spicy = raw.startsWith("~");
    const text = spicy ? raw.slice(1) : raw;
    const key = [trigger, opts.tiers?.join("") ?? "", opts.bands?.join("") ?? "", opts.days ?? ""]
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

export const LINES: Line[] = [...EN, ...VI];

export const MILESTONE_DAYS = [3, 7, 30];
