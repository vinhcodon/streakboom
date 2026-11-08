import type { Lang } from "./lines.ts";

export type ErrKind =
  | "invalid_key"
  | "rate_limit"
  | "network"
  | "region"
  | "blocked"
  | "empty"
  | "server"
  | "model"
  | "storage"
  | "unknown";

export interface UiStrings {
  settings: string;
  inputHint: string;
  chatHint: string;
  brainBad: string;
  close: string;
  language: string;
  chattiness: string;
  quiet: string;
  normal: string;
  chatty: string;
  auto: string;
  gentle: string;
  quietHours: string;
  to: string;
  // brain request + guide
  askText: string;
  askYes: string;
  askLater: string;
  guideTitle: string;
  step1: string;
  step2: string;
  step3: string;
  openStudio: string;
  keyPlaceholder: string;
  connect: string;
  connecting: string;
  age: string;
  dataNote: string;
  keyNote: string;
  back: string;
  // settings: brain
  brainLabel: string;
  brainOn: string;
  brainOff: string;
  getBrain: string;
  replaceKey: string;
  removeKey: string;
  sure: string;
  removed: string;
  thinking: string;
  capHit: string;
  slowHint: string;
  copyStats: string;
  statsCopied: string;
  statsHint: string;
  // memory: asking, and the "What the pet remembers" page
  nameAsk: string;
  callMeAsk: string;
  nameHolder: string;
  callMeHolder: string;
  nameOk: string;
  nameSkip: string;
  sectionMemory: string;
  memIntro: string;
  memLearn: string;
  memPetName: string;
  memCallMe: string;
  memNone: string;
  memSave: string;
  memDays: string;
  memStreak: string;
  memUsual: string;
  memParts: { morning: string; afternoon: string; evening: string; night: string };
  memTouches: string;
  memMarks: string;
  memMarkNames: Record<string, string>;
  memForgetHabits: string;
  memForgetAll: string;
  memForgetNote: string;
  memEmpty: string;
  sectionAbout: string;
  versionLabel: string;
  checkUpdates: string;
  checkingUpdates: string;
  upToDate: string;
  updateAvailable: string; // contains {v}
  updateNow: string;
  updating: string;
  updateFailed: string;
  updatesOff: string;
  updateText: string; // contains {v}
  updateYes: string;
  updateLater: string;
  menuSettings: string;
  menuQuiet: string;
  menuQuit: string;
  slowChat: string;
  sectionGeneral: string;
  sectionBrain: string;
  sectionPrivacy: string;
  consentText: string;
  consentNote: string;
  consentYes: string;
  consentNo: string;
  statsLabel: string;
  statsQueued: string;
  on: string;
  off: string;
  details: string;
  haveKey: string;
  modelLabel: string;
  modelAuto: string;
  modelNow: string;
  modelHint: string;
  copy: string;
  copied: string;
  err: Record<ErrKind, string>;
}

export const UI: Record<Lang, UiStrings> = {
  en: {
    settings: "Settings",
    inputHint: "I can't understand words yet",
    chatHint: "Say something…",
    brainBad: "My brain needs a new key",
    close: "Close",
    language: "Language",
    chattiness: "Chattiness",
    quiet: "Quiet",
    normal: "Normal",
    chatty: "Chatty",
    auto: "Auto",
    gentle: "Gentle tone (no sarcasm)",
    quietHours: "Quiet hours",
    to: "to",
    askText: "I'd love to talk with you properly. Could you give me a brain? It's free and takes about 2 minutes.",
    askYes: "Get a free brain",
    askLater: "Later",
    guideTitle: "Giving me a brain",
    step1: "Open Google AI Studio and sign in.",
    step2: "Click “Create API key”.",
    step3: "Copy the key and paste it below.",
    openStudio: "Open Google AI Studio",
    keyPlaceholder: "Paste your key here",
    connect: "Connect",
    connecting: "Checking…",
    age: "I am 18 or older (Google requires this)",
    dataNote:
      "Free keys: Google may use what you send me, and have people read it, to improve its products. Don't tell me anything sensitive.",
    keyNote: "Your key stays on this computer and is only sent to Google. Tip: make a key just for me so it's easy to revoke.",
    back: "Back",
    brainLabel: "Brain",
    brainOn: "connected",
    brainOff: "none yet",
    getBrain: "Get a brain",
    replaceKey: "Replace key",
    removeKey: "Remove key",
    sure: "Sure?",
    removed: "Key removed. I'm back to my few words.",
    thinking: "…",
    capHit: "I've talked a lot today. Let's keep the rest for tomorrow.",
    slowHint: "Google is slow right now. I'm still trying, this can take up to a minute or two.",
    copyStats: "Copy stats",
    statsCopied: "Copied",
    statsHint: "Nothing is sent automatically. Copy it and paste it to the developer if you want to share it.",
    nameAsk: "Hey, I still don't have a name. Want to give me one?",
    callMeAsk: "What should I call you?",
    nameHolder: "A name for me...",
    callMeHolder: "Your name or nickname...",
    nameOk: "Save",
    nameSkip: "Not now",
    sectionMemory: "What the pet remembers",
    memIntro: "Everything the pet knows about you is here, and only here, on this computer. Nothing of it is sent anywhere.",
    memLearn: "Remember my habits (when I show up, how often I touch it)",
    memPetName: "Pet's name",
    memCallMe: "It calls me",
    memNone: "(not set)",
    memSave: "Save",
    memDays: "Days together",
    memStreak: "Longest streak",
    memUsual: "Usually around",
    memParts: { morning: "the morning", afternoon: "the afternoon", evening: "the evening", night: "the night" },
    memTouches: "Pokes and scratches / chats",
    memMarks: "Shared milestones",
    memMarkNames: { "days.7": "A week together", "days.30": "30 days", "days.100": "100 days", "touch.100": "100 touches", "touch.500": "500 touches", "chat.1": "First chat", "chat.25": "25 chats" },
    memForgetHabits: "Forget habits and counts",
    memForgetAll: "Forget everything",
    memForgetNote: "Forgetting habits keeps the names. Forgetting everything also removes the names.",
    memEmpty: "Nothing yet.",
    sectionAbout: "About",
    versionLabel: "Version",
    checkUpdates: "Check for updates",
    checkingUpdates: "Checking…",
    upToDate: "You have the latest version.",
    updateAvailable: "A new version is available: {v}",
    updateNow: "Update now",
    updating: "Downloading the update… I will restart by myself.",
    updateFailed: "The update did not work. Try again later.",
    updatesOff: "Updates are not set up in this build.",
    updateText: "There is a new version of me ({v}). Update now? I will restart.",
    updateYes: "Update",
    updateLater: "Later",
    menuSettings: "Settings…",
    menuQuiet: "Quiet mode",
    menuQuit: "Quit",
    slowChat: "Google is slow right now. Still thinking…",
    sectionGeneral: "General",
    sectionBrain: "Brain (AI)",
    sectionPrivacy: "Privacy",
    consentText: "Can I count which steps people use in the app, to make me better?",
    consentNote:
      "Only step names like “opened the menu”. Never your chats, your key or anything personal. Off by default; change it any time in Settings.",
    consentYes: "Yes, count",
    consentNo: "No thanks",
    statsLabel: "Usage stats",
    statsQueued: "{n} step(s) recorded on this computer, not sent anywhere yet.",
    on: "On",
    off: "Off",
    details: "Details",
    haveKey: "I have my key",
    modelLabel: "Model",
    modelAuto: "Automatic (recommended)",
    modelNow: "Using",
    modelHint: "“lite” models are fastest. Newest full models are often busy.",
    copy: "Copy error",
    copied: "Copied",
    err: {
      invalid_key: "Hmm, that key doesn't work. Want to try copying it again?",
      rate_limit: "I'm a bit tired, let's chat again in a minute.",
      network: "I can't reach the internet right now.",
      region: "Google says my brain isn't available in your region yet.",
      blocked: "I can't say that one out loud.",
      empty: "I lost my words for a second. Try again?",
      server: "Google's side is having a moment. Try again soon.",
      model: "My brain model seems to have moved. Try again later.",
      storage: "I couldn't store the key safely on this computer.",
      unknown: "Something odd happened. Try again?",
    },
  },
  vi: {
    settings: "Cài đặt",
    inputHint: "Mình chưa hiểu chữ đâu",
    chatHint: "Nói gì đó đi…",
    brainBad: "Bộ não của mình cần key mới",
    close: "Đóng",
    language: "Ngôn ngữ",
    chattiness: "Độ nói nhiều",
    quiet: "Ít",
    normal: "Vừa",
    chatty: "Nhiều",
    auto: "Tự động",
    gentle: "Giọng nhẹ nhàng (không mỉa mai)",
    quietHours: "Giờ im lặng",
    to: "đến",
    askText: "Mình muốn nói chuyện với bạn cho đàng hoàng. Bạn cho mình một bộ não nhé? Miễn phí, mất khoảng 2 phút.",
    askYes: "Lấy bộ não miễn phí",
    askLater: "Để sau",
    guideTitle: "Cho mình một bộ não",
    step1: "Mở Google AI Studio và đăng nhập.",
    step2: "Bấm “Create API key”.",
    step3: "Sao chép key rồi dán vào ô bên dưới.",
    openStudio: "Mở Google AI Studio",
    keyPlaceholder: "Dán key vào đây",
    connect: "Kết nối",
    connecting: "Đang kiểm tra…",
    age: "Mình từ 18 tuổi trở lên (Google yêu cầu)",
    dataNote:
      "Key miễn phí: Google có thể dùng những gì bạn gửi cho mình, và cho người đọc, để cải thiện sản phẩm. Đừng kể điều nhạy cảm nhé.",
    keyNote: "Key chỉ nằm trên máy này và chỉ được gửi cho Google. Mẹo: tạo một key riêng cho mình để dễ thu hồi.",
    back: "Quay lại",
    brainLabel: "Bộ não",
    brainOn: "đã kết nối",
    brainOff: "chưa có",
    getBrain: "Lấy bộ não",
    replaceKey: "Đổi key",
    removeKey: "Xóa key",
    sure: "Chắc chứ?",
    removed: "Đã xóa key. Mình lại chỉ biết vài câu.",
    thinking: "…",
    capHit: "Hôm nay mình nói nhiều rồi. Phần còn lại để mai nhé.",
    slowHint: "Google đang chậm. Mình vẫn đang thử, có thể mất tới một hai phút.",
    copyStats: "Sao chép thống kê",
    statsCopied: "Đã chép",
    statsHint: "Không có gì được gửi tự động. Sao chép rồi dán cho người phát triển nếu bạn muốn chia sẻ.",
    nameAsk: "Mình vẫn chưa có tên. Bạn đặt cho mình một cái nhé?",
    callMeAsk: "Mình nên gọi bạn là gì?",
    nameHolder: "Tên cho mình...",
    callMeHolder: "Tên hoặc biệt danh của bạn...",
    nameOk: "Lưu",
    nameSkip: "Để sau",
    sectionMemory: "Pet nhớ gì",
    memIntro: "Mọi điều pet biết về bạn nằm ở đây và chỉ ở trên máy này. Không có gì được gửi đi đâu.",
    memLearn: "Nhớ thói quen của tôi (giờ tôi hay mở, số lần chạm)",
    memPetName: "Tên của pet",
    memCallMe: "Pet gọi tôi là",
    memNone: "(chưa đặt)",
    memSave: "Lưu",
    memDays: "Số ngày bên nhau",
    memStreak: "Chuỗi ngày dài nhất",
    memUsual: "Thường vào khoảng",
    memParts: { morning: "buổi sáng", afternoon: "buổi chiều", evening: "buổi tối", night: "ban đêm" },
    memTouches: "Chọc và gãi / trò chuyện",
    memMarks: "Cột mốc đã chia sẻ",
    memMarkNames: { "days.7": "Một tuần bên nhau", "days.30": "30 ngày", "days.100": "100 ngày", "touch.100": "100 lần chạm", "touch.500": "500 lần chạm", "chat.1": "Lần trò chuyện đầu", "chat.25": "25 cuộc trò chuyện" },
    memForgetHabits: "Quên thói quen và số đếm",
    memForgetAll: "Quên hết",
    memForgetNote: "Quên thói quen vẫn giữ tên. Quên hết thì xóa cả tên.",
    memEmpty: "Chưa có gì.",
    sectionAbout: "Về app",
    versionLabel: "Phiên bản",
    checkUpdates: "Kiểm tra cập nhật",
    checkingUpdates: "Đang kiểm tra…",
    upToDate: "Bạn đang dùng bản mới nhất.",
    updateAvailable: "Có bản mới: {v}",
    updateNow: "Cập nhật ngay",
    updating: "Đang tải bản mới… Mình sẽ tự khởi động lại.",
    updateFailed: "Cập nhật không được. Lát nữa thử lại nhé.",
    updatesOff: "Bản này chưa bật tính năng cập nhật.",
    updateText: "Có bản mới của mình ({v}). Cập nhật nhé? Mình sẽ khởi động lại.",
    updateYes: "Cập nhật",
    updateLater: "Để sau",
    menuSettings: "Cài đặt…",
    menuQuiet: "Chế độ yên lặng",
    menuQuit: "Thoát",
    slowChat: "Google đang chậm. Mình vẫn đang nghĩ…",
    sectionGeneral: "Chung",
    sectionBrain: "Bộ não (AI)",
    sectionPrivacy: "Riêng tư",
    consentText: "Mình đếm xem mọi người dùng app qua những bước nào để cải thiện mình, được không?",
    consentNote:
      "Chỉ ghi tên bước như “đã mở menu”. Không có nội dung chat, key hay thông tin cá nhân. Mặc định là tắt, bạn đổi được bất cứ lúc nào trong Cài đặt.",
    consentYes: "Đồng ý",
    consentNo: "Không, cảm ơn",
    statsLabel: "Thống kê dùng",
    statsQueued: "Đã ghi {n} bước trên máy này, chưa gửi đi đâu.",
    on: "Bật",
    off: "Tắt",
    details: "Chi tiết",
    haveKey: "Mình có key rồi",
    modelLabel: "Mô hình",
    modelAuto: "Tự động (khuyên dùng)",
    modelNow: "Đang dùng",
    modelHint: "Bản “lite” nhanh nhất. Mô hình đầy đủ mới nhất thường bị nghẽn.",
    copy: "Sao chép lỗi",
    copied: "Đã chép",
    err: {
      invalid_key: "Hmm, key này không dùng được. Bạn thử sao chép lại nhé?",
      rate_limit: "Mình hơi mệt, một phút nữa mình nói chuyện tiếp nhé.",
      network: "Giờ mình không kết nối được internet.",
      region: "Google nói bộ não của mình chưa dùng được ở khu vực của bạn.",
      blocked: "Câu đó mình không nói ra được.",
      empty: "Mình quên mất định nói gì. Thử lại nhé?",
      server: "Bên Google đang trục trặc. Lát nữa thử lại nhé.",
      model: "Mô hình của mình có vẻ đã đổi chỗ. Lát nữa thử lại nhé.",
      storage: "Mình không lưu được key an toàn trên máy này.",
      unknown: "Có chuyện lạ xảy ra. Thử lại nhé?",
    },
  },
};
