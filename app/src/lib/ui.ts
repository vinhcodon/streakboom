import type { Lang } from "./lines.ts";
import type { ProviderId } from "./bus.ts";

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
  | "billing"
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
  capHit: string[]; // in-character ways to say "enough for today"; one is picked at random
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
  providers: Record<ProviderId, { name: string; company: string; tag: string; step1: string; step2: string; step3: string; open: string; age: string; cost: string; dataNote: string; keyNote: string }>;
  brainSaved: string;
  brainInUse: string;
  useBrain: string;
  brainPick: string;
  activateNow: string;
  activeLine: string;
  usageToday: string;
  personaTitle: string;
  personaLead: string;
  personaNote: string;
  personaShow: string;
  personaHide: string;
  personaLocked: string;
  personaVoice: string;
  personaLanguage: string;
  personaCore: string;
  personaVoiceJa: string;
  personaTone: string;
  personaMood: string;
  personaCloseness: string;
  remarksLabel: string;
  remarksNote: string;
  groundMapLabel: string;
  groundMapNote: string;
  pgGeneral: string;
  pgPersonality: string;
  pgBrain: string;
  pgMemory: string;
  pgPrivacy: string;
  pgAbout: string;
  sectionPersonality: string;
  updatesLabel: string;
  updatesAuto: string;
  updatesAsk: string;
  updatesOff: string;
  updatesNoteAuto: string;
  updatesNoteAsk: string;
  updatesNoteOff: string;
  updatingNow: string;
  tourSteps: string[];
  tourNext: string;
  tourDone: string;
  tourSkip: string;
  tourReplay: string;
  autostart: string;
  autostartNote: string;
  startupAsk: string;
  startupYes: string;
  startupLater: string;
  startupOn: string;
  memAi: string;
  memAiNote: string;
  memFacts: string;
  memFactsNone: string;
  memForgetFacts: string;
  memNotice: string;
  sectionAbout: string;
  openWebsite: string;
  versionLabel: string;
  checkUpdates: string;
  checkingUpdates: string;
  upToDate: string;
  updateAvailable: string; // contains {v}
  updateNow: string;
  updating: string;
  updateFailed: string;
  updModeOff: string;
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
  dailyConsentText: string;
  dailyLabel: string;
  dailyNote: string;
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
      "Free keys: Google may use what you send me, and have people read it, to improve its products. Don't tell me anything sensitive. I also jot down a few lasting facts from our chats; they stay on this computer and go to Google with each chat (you can see, edit or turn this off in What the pet remembers).",
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
    capHit: [
      "I've talked a lot today. Let's keep the rest for tomorrow.",
      "My voice is worn out for today. Come find me tomorrow?",
      "I'm all talked out. Pet me instead, we'll chat tomorrow.",
      "Shh, I'm resting my words. Tomorrow, I promise.",
    ],
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
    providers: {
      gemini: {
        name: "Gemini (Google)",
        company: "Google",
        tag: "free tier",
        step1: "Open Google AI Studio and sign in.",
        step2: "Click “Create API key”.",
        step3: "Copy the key and paste it below.",
        open: "Open Google AI Studio",
        age: "I am 18 or older (Google requires this)",
        cost: "Free tier available; no card needed to start.",
        dataNote: "Free keys: Google may use what you send me, and have people read it, to improve its products. Don't tell me anything sensitive. I also jot down a few lasting facts from our chats; they stay on this computer and go to Google with each chat (you can see, edit or turn this off in Memory).",
        keyNote: "Your key stays on this computer and is only sent to Google. Tip: make a key just for me so it's easy to revoke.",
      },
      groq: {
        name: "Groq",
        company: "Groq",
        tag: "free tier",
        step1: "Open the Groq Console and sign in.",
        step2: "Open “API Keys” and click “Create API Key”.",
        step3: "Copy the key and paste it below.",
        open: "Open Groq Console",
        age: "I am 18 or older",
        cost: "Free tier available, with limits on how much you can ask each minute and each day; Groq's console shows the limits of your account.",
        dataNote: "What you send me goes to Groq, which runs the model, to be answered; see Groq's terms for how it handles API data. Don't tell me anything sensitive. I also jot down a few lasting facts from our chats; they stay on this computer and go to Groq with each chat (you can see, edit or turn this off in Memory).",
        keyNote: "Your key stays on this computer and is only sent to Groq. Tip: make a key just for me so it's easy to revoke.",
      },
      claude: {
        name: "Claude (Anthropic)",
        company: "Anthropic",
        tag: "paid",
        step1: "Open the Anthropic Console and sign in.",
        step2: "Add some credit to the account, then create an API key.",
        step3: "Copy the key and paste it below.",
        open: "Open Anthropic Console",
        age: "I am 18 or older (Anthropic requires this)",
        cost: "Paid: Anthropic bills you per use and the account needs credit. A Claude Pro or Team subscription does not include the API. I keep answers short and cap daily use (60 chats, 6 unprompted lines). Tip: set a low monthly spend limit in the Console.",
        dataNote: "What you send me goes to Anthropic to be answered; see Anthropic's terms for how it handles API data. Don't tell me anything sensitive. I also jot down a few lasting facts from our chats; they stay on this computer and go to Anthropic with each chat (you can see, edit or turn this off in Memory).",
        keyNote: "Your key stays on this computer and is only sent to Anthropic. Tip: make a key just for me so it's easy to revoke.",
      },
      openai: {
        name: "OpenAI (ChatGPT API)",
        company: "OpenAI",
        tag: "paid",
        step1: "Open the OpenAI Platform and sign in.",
        step2: "Add some credit or a payment method, then create an API key.",
        step3: "Copy the key and paste it below.",
        open: "Open OpenAI Platform",
        age: "I am 18 or older (OpenAI requires this)",
        cost: "Paid: OpenAI bills you per use. A ChatGPT Plus subscription does not include the API. I keep answers short and cap daily use (60 chats, 6 unprompted lines). Tip: set a low monthly spend limit in the platform's billing settings.",
        dataNote: "What you send me goes to OpenAI to be answered; see OpenAI's terms for how it handles API data. Don't tell me anything sensitive. I also jot down a few lasting facts from our chats; they stay on this computer and go to OpenAI with each chat (you can see, edit or turn this off in Memory).",
        keyNote: "Your key stays on this computer and is only sent to OpenAI. Tip: make a key just for me so it's easy to revoke.",
      },
    },
    brainSaved: "key saved, not in use",
    brainInUse: "in use",
    useBrain: "Use this brain",
    brainPick: "Brain",
    activateNow: "Use this brain right after connecting",
    activeLine: "Answering with: {name} · {model}",
    usageToday: "Today: {chat} / {chatCap} chats, {proactive} / {proactiveCap} unprompted lines",
    personaTitle: "What Peak is told",
    personaLead: "When a brain is connected, every answer starts from these notes about who Peak is. This is the text for your current settings, word for word. It is in English whatever language you use; the language line decides which language Peak answers in.",
    personaNote: "What you told Peak is on the Memory page and is added after this text in chats you start. The locked parts keep Peak safe and let the app act out its feelings.",
    personaShow: "Show the text",
    personaHide: "Hide the text",
    personaLocked: "locked",
    personaVoice: "Character",
    personaLanguage: "Language",
    personaCore: "Safety",
    personaVoiceJa: "Japanese voice",
    personaTone: "Tone",
    personaMood: "Feeling tag",
    personaCloseness: "How close you are",
    remarksLabel: "Let Peak add a remark after a reaction",
    remarksNote: "After a reflex such as a fall, a connected brain may write one short sentence for Peak. Only the name of the event and five numbers about how it feels are sent, nothing about your windows or screen. It counts toward the daily limit of unprompted lines.",
    groundMapLabel: "Let Peak look at where windows are before it moves",
    groundMapNote: "When it is about to move, Peak may take a coarse picture (a grid of 16 by 9 squares) of whether each square is the bare desktop, the taskbar or a window. It is kept in memory only, never saved or sent, and has no titles, names or contents. Off by default; nothing uses it yet except looking for a ledge to stand on.",
    pgGeneral: "General",
    pgPersonality: "Personality",
    pgBrain: "Brain",
    pgMemory: "Memory",
    pgPrivacy: "Privacy",
    pgAbout: "About",
    sectionPersonality: "Personality",
    updatesLabel: "Updates",
    updatesAuto: "Install automatically",
    updatesAsk: "Ask me",
    updModeOff: "Don't check",
    updatesNoteAuto: "When a new version is out and you are not busy, the pet installs it and restarts by itself.",
    updatesNoteAsk: "The pet tells you when a new version is out and installs it only if you say yes.",
    updatesNoteOff: "No automatic checks. You can still check by hand in About.",
    updatingNow: "A new version is out ({v}). Updating now; I'll be right back.",
    tourSteps: [
      "Hi! I'm your desktop pet. Drag me anywhere you like; I'll always stay on your screen.",
      "Click me to poke me. Double-click me to open a chat bubble.",
      "Try stroking my head or my belly with your mouse, back and forth. One of them can be a trap.",
      "Want me to talk for real? Add your own Gemini key in Settings (tray icon, or right-click me). I work without it too, with fewer words.",
    ],
    tourNext: "Next",
    tourDone: "Got it",
    tourSkip: "Skip",
    tourReplay: "Show the tour again",
    autostart: "Start when I log in to Windows",
    autostartNote: "The pet appears by itself each time you turn on your computer. You can turn this off here any time.",
    startupAsk: "Want me to wake up with your computer? Then I'm already here when you sit down.",
    startupYes: "Yes, start with Windows",
    startupLater: "Not now",
    startupOn: "Done. I'll be here when you log in. Change it any time in Settings.",
    memAi: "Remember things I tell it in chats",
    memAiNote: "On by default. Every chat you start sends these notes to {company} along with your message so the pet can use them, and a short extra request picks new ones out of your chat. Turn it off to stop both.",
    memFacts: "What it noted from chats",
    memFactsNone: "Nothing noted yet. Edit or delete anything here.",
    memForgetFacts: "Forget noted facts",
    memNotice: "I jotted down something you told me. It's in Settings > What the pet remembers, where you can edit or delete it, and it goes to {company} with our chats. You can turn it off there.",
    sectionAbout: "About",
    openWebsite: "Open the website (streakboom.com)",
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
    consentText: "Can I count which steps people use in the app, and roughly how often you scratch, rub, poke and chat each day, to make me better?",
    consentNote:
      "Only step names like “opened the menu” and a few numbers per day like “3 scratches”. Never your chats, your key or anything personal, and nothing is sent anywhere. Off by default; change it any time in Settings.",
    dailyConsentText: "You already let me count steps. Can I also count a few numbers per day (scratches, rubs, pokes, messages, minutes)? Only counts, never what you write.",
    dailyLabel: "Daily activity counts",
    dailyNote: "Per day: scratches, rubs, pokes, messages sent, lines I said and you reacted to, minutes the app ran, times Quiet mode was switched on. Never any text. Turning this off deletes them.",
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
      billing: "That account has no credit left. Add credit on the provider's site, then try again.",
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
      "Key miễn phí: Google có thể dùng những gì bạn gửi cho mình, và cho người đọc, để cải thiện sản phẩm. Đừng kể điều nhạy cảm nhé. Mình cũng ghi lại vài điều lâu dài từ các cuộc trò chuyện; chúng nằm trên máy này và được gửi cho Google cùng mỗi lần chat (bạn xem, sửa hoặc tắt trong Pet nhớ gì).",
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
    capHit: [
      "Hôm nay mình nói nhiều rồi. Phần còn lại để mai nhé.",
      "Mình hết hơi rồi, mai gặp lại nhé?",
      "Mình nói mệt rồi. Vuốt ve mình đi, mai mình kể tiếp.",
      "Suỵt, mình đang để dành lời cho ngày mai. Hứa đó.",
    ],
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
    providers: {
      gemini: {
        name: "Gemini (Google)",
        company: "Google",
        tag: "có bậc miễn phí",
        step1: "Mở Google AI Studio và đăng nhập.",
        step2: "Bấm “Create API key”.",
        step3: "Sao chép key rồi dán vào ô bên dưới.",
        open: "Mở Google AI Studio",
        age: "Mình từ 18 tuổi trở lên (Google yêu cầu)",
        cost: "Có bậc miễn phí; không cần thẻ để bắt đầu.",
        dataNote: "Key miễn phí: Google có thể dùng những gì bạn gửi cho mình, và cho người đọc, để cải thiện sản phẩm. Đừng kể điều nhạy cảm nhé. Mình cũng ghi lại vài điều lâu dài từ các cuộc trò chuyện; chúng nằm trên máy này và được gửi cho Google cùng mỗi lần chat (bạn xem, sửa hoặc tắt trong mục Trí nhớ).",
        keyNote: "Key chỉ nằm trên máy này và chỉ được gửi cho Google. Mẹo: tạo một key riêng cho mình để dễ thu hồi.",
      },
      groq: {
        name: "Groq",
        company: "Groq",
        tag: "có bậc miễn phí",
        step1: "Mở Groq Console và đăng nhập.",
        step2: "Vào mục “API Keys” rồi bấm “Create API Key”.",
        step3: "Sao chép key rồi dán vào ô bên dưới.",
        open: "Mở Groq Console",
        age: "Mình từ 18 tuổi trở lên",
        cost: "Có bậc miễn phí, giới hạn số lượt hỏi mỗi phút và mỗi ngày; Console của Groq cho biết giới hạn của tài khoản bạn.",
        dataNote: "Những gì bạn gửi cho mình sẽ đến Groq, nơi chạy mô hình, để được trả lời; xem điều khoản của Groq về cách họ xử lý dữ liệu API. Đừng kể điều nhạy cảm nhé. Mình cũng ghi lại vài điều lâu dài từ các cuộc trò chuyện; chúng nằm trên máy này và được gửi cho Groq cùng mỗi lần chat (bạn xem, sửa hoặc tắt trong mục Trí nhớ).",
        keyNote: "Key chỉ nằm trên máy này và chỉ được gửi cho Groq. Mẹo: tạo một key riêng cho mình để dễ thu hồi.",
      },
      claude: {
        name: "Claude (Anthropic)",
        company: "Anthropic",
        tag: "trả phí",
        step1: "Mở Anthropic Console và đăng nhập.",
        step2: "Nạp một ít tiền vào tài khoản, rồi tạo API key.",
        step3: "Sao chép key rồi dán vào ô bên dưới.",
        open: "Mở Anthropic Console",
        age: "Mình từ 18 tuổi trở lên (Anthropic yêu cầu)",
        cost: "Trả phí: Anthropic tính tiền theo lượt dùng và tài khoản cần có tiền. Gói Claude Pro hay Team không bao gồm API. Mình giữ câu trả lời ngắn và giới hạn mỗi ngày (60 lượt chat, 6 câu tự nói). Mẹo: đặt giới hạn chi tiêu hằng tháng thấp trong Console.",
        dataNote: "Những gì bạn gửi cho mình sẽ đến Anthropic để được trả lời; xem điều khoản của Anthropic về cách họ xử lý dữ liệu API. Đừng kể điều nhạy cảm nhé. Mình cũng ghi lại vài điều lâu dài từ các cuộc trò chuyện; chúng nằm trên máy này và được gửi cho Anthropic cùng mỗi lần chat (bạn xem, sửa hoặc tắt trong mục Trí nhớ).",
        keyNote: "Key chỉ nằm trên máy này và chỉ được gửi cho Anthropic. Mẹo: tạo một key riêng cho mình để dễ thu hồi.",
      },
      openai: {
        name: "OpenAI (ChatGPT API)",
        company: "OpenAI",
        tag: "trả phí",
        step1: "Mở OpenAI Platform và đăng nhập.",
        step2: "Nạp một ít tiền hoặc thêm phương thức thanh toán, rồi tạo API key.",
        step3: "Sao chép key rồi dán vào ô bên dưới.",
        open: "Mở OpenAI Platform",
        age: "Mình từ 18 tuổi trở lên (OpenAI yêu cầu)",
        cost: "Trả phí: OpenAI tính tiền theo lượt dùng. Gói ChatGPT Plus không bao gồm API. Mình giữ câu trả lời ngắn và giới hạn mỗi ngày (60 lượt chat, 6 câu tự nói). Mẹo: đặt giới hạn chi tiêu hằng tháng thấp trong phần thanh toán của trang đó.",
        dataNote: "Những gì bạn gửi cho mình sẽ đến OpenAI để được trả lời; xem điều khoản của OpenAI về cách họ xử lý dữ liệu API. Đừng kể điều nhạy cảm nhé. Mình cũng ghi lại vài điều lâu dài từ các cuộc trò chuyện; chúng nằm trên máy này và được gửi cho OpenAI cùng mỗi lần chat (bạn xem, sửa hoặc tắt trong mục Trí nhớ).",
        keyNote: "Key chỉ nằm trên máy này và chỉ được gửi cho OpenAI. Mẹo: tạo một key riêng cho mình để dễ thu hồi.",
      },
    },
    brainSaved: "đã lưu key, chưa dùng",
    brainInUse: "đang dùng",
    useBrain: "Dùng bộ não này",
    brainPick: "Bộ não",
    activateNow: "Dùng bộ não này ngay sau khi kết nối",
    activeLine: "Đang trả lời bằng: {name} · {model}",
    usageToday: "Hôm nay: {chat} / {chatCap} lượt chat, {proactive} / {proactiveCap} câu tự nói",
    personaTitle: "Peak được dặn gì",
    personaLead: "Khi có bộ não, mỗi câu trả lời bắt đầu từ những lời dặn này về việc Peak là ai. Đây là nguyên văn theo cài đặt hiện tại của bạn. Văn bản viết bằng tiếng Anh dù bạn dùng ngôn ngữ nào; dòng ngôn ngữ quyết định Peak trả lời bằng tiếng gì.",
    personaNote: "Những điều bạn đã kể cho Peak nằm ở trang Trí nhớ và được thêm vào sau đoạn này trong các cuộc trò chuyện bạn bắt đầu. Phần bị khóa giữ cho Peak an toàn và để ứng dụng diễn được cảm xúc.",
    personaShow: "Xem nội dung",
    personaHide: "Ẩn nội dung",
    personaLocked: "khóa",
    personaVoice: "Tính cách",
    personaLanguage: "Ngôn ngữ",
    personaCore: "An toàn",
    personaVoiceJa: "Giọng tiếng Nhật",
    personaTone: "Tông giọng",
    personaMood: "Thẻ cảm xúc",
    personaCloseness: "Độ thân thiết",
    remarksLabel: "Cho Peak nói thêm một câu sau phản ứng",
    remarksNote: "Sau một phản xạ như cú rơi, bộ não đã kết nối có thể viết thêm một câu ngắn cho Peak. Chỉ gửi tên sự kiện và năm con số về cảm xúc, không gửi gì về cửa sổ hay màn hình của bạn. Câu này tính vào giới hạn câu tự phát mỗi ngày.",
    groundMapLabel: "Cho Peak nhìn xem cửa sổ nằm đâu trước khi di chuyển",
    groundMapNote: "Khi sắp di chuyển, Peak có thể chụp một bức tranh thô (lưới 16 x 9 ô) xem mỗi ô là desktop trống, thanh taskbar hay một cửa sổ. Chỉ giữ trong bộ nhớ, không lưu, không gửi, không có tiêu đề, tên hay nội dung. Tắt sẵn; hiện chỉ dùng để tìm một mép cửa sổ cho Peak đứng.",
    pgGeneral: "Chung",
    pgPersonality: "Tính cách",
    pgBrain: "Bộ não",
    pgMemory: "Trí nhớ",
    pgPrivacy: "Riêng tư",
    pgAbout: "Về app",
    sectionPersonality: "Tính cách",
    updatesLabel: "Cập nhật",
    updatesAuto: "Tự cài đặt",
    updatesAsk: "Hỏi tôi",
    updModeOff: "Không kiểm tra",
    updatesNoteAuto: "Khi có bản mới và bạn không bận, pet tự cài và tự khởi động lại.",
    updatesNoteAsk: "Pet báo khi có bản mới và chỉ cài nếu bạn đồng ý.",
    updatesNoteOff: "Không kiểm tra tự động. Bạn vẫn kiểm tra tay được trong mục Về app.",
    updatingNow: "Có bản mới ({v}). Mình cập nhật ngay, quay lại liền nhé.",
    tourSteps: [
      "Chào bạn! Mình là thú cưng trên màn hình của bạn. Kéo mình đi đâu cũng được, mình luôn ở lại trong màn hình.",
      "Bấm vào mình để chọc mình. Bấm đúp để mở khung trò chuyện.",
      "Thử vuốt đầu hoặc bụng mình bằng chuột, qua lại. Một trong hai chỗ có thể là bẫy.",
      "Muốn mình nói chuyện thật? Thêm khóa Gemini của bạn trong Cài đặt (biểu tượng khay hoặc bấm chuột phải vào mình). Không có khóa mình vẫn chạy, nhưng ít lời hơn.",
    ],
    tourNext: "Tiếp",
    tourDone: "Hiểu rồi",
    tourSkip: "Bỏ qua",
    tourReplay: "Xem lại hướng dẫn",
    autostart: "Tự chạy khi tôi đăng nhập Windows",
    autostartNote: "Pet tự xuất hiện mỗi lần bạn bật máy. Bạn tắt được ở đây bất cứ lúc nào.",
    startupAsk: "Mình tự thức dậy cùng máy tính của bạn nhé? Bạn ngồi xuống là mình đã ở đây rồi.",
    startupYes: "Có, chạy cùng Windows",
    startupLater: "Để sau",
    startupOn: "Xong. Mình sẽ có mặt khi bạn đăng nhập. Đổi lại bất cứ lúc nào trong Cài đặt.",
    memAi: "Nhớ những điều tôi kể trong lúc trò chuyện",
    memAiNote: "Bật sẵn. Mỗi cuộc trò chuyện bạn bắt đầu sẽ gửi các ghi chú này cho {company} cùng tin nhắn để pet dùng, và một yêu cầu nhỏ thêm sẽ rút ý mới từ cuộc trò chuyện. Tắt đi là dừng cả hai.",
    memFacts: "Những điều đã ghi từ trò chuyện",
    memFactsNone: "Chưa ghi gì. Bạn có thể sửa hoặc xóa mọi mục ở đây.",
    memForgetFacts: "Quên các điều đã ghi",
    memNotice: "Mình vừa ghi lại điều bạn kể. Nó nằm ở Cài đặt > Pet nhớ gì, bạn sửa hoặc xóa được, và nó được gửi cho {company} cùng các cuộc trò chuyện. Bạn tắt được ở đó.",
    sectionAbout: "Về app",
    openWebsite: "Mở trang web (streakboom.com)",
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
    consentText: "Mình đếm xem mọi người dùng app qua những bước nào, và mỗi ngày bạn gãi, xoa, chọc, chat khoảng bao nhiêu lần, để cải thiện mình, được không?",
    consentNote:
      "Chỉ ghi tên bước như “đã mở menu” và vài con số mỗi ngày như “3 lần gãi”. Không có nội dung chat, key hay thông tin cá nhân, và không gửi đi đâu cả. Mặc định là tắt, bạn đổi được bất cứ lúc nào trong Cài đặt.",
    dailyConsentText: "Bạn đã cho mình đếm các bước. Mình đếm thêm vài con số mỗi ngày (số lần gãi, xoa, chọc, tin nhắn, số phút) được không? Chỉ là số đếm, không có nội dung bạn viết.",
    dailyLabel: "Số đếm hoạt động theo ngày",
    dailyNote: "Mỗi ngày: số lần gãi, xoa, chọc, tin nhắn đã gửi, câu mình tự nói mà bạn phản hồi, số phút app chạy, số lần bật Quiet mode. Không có chữ nào. Tắt đi là xóa hết.",
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
      billing: "Tài khoản đó hết tiền rồi. Nạp thêm trên trang của nhà cung cấp rồi thử lại nhé.",
      unknown: "Có chuyện lạ xảy ra. Thử lại nhé?",
    },
  },
  ja: {
    settings: "設定",
    inputHint: "まだ言葉はわからないんだ",
    chatHint: "なにか話しかけてね…",
    brainBad: "脳みそに新しいキーが必要だよ",
    close: "閉じる",
    language: "言語",
    chattiness: "おしゃべりの量",
    quiet: "少なめ",
    normal: "ふつう",
    chatty: "多め",
    auto: "自動",
    gentle: "やさしい口調（皮肉なし）",
    quietHours: "静かな時間",
    to: "〜",
    askText: "ちゃんとおしゃべりしてみたいな。わたしに脳みそをくれない？無料で、2分くらいで終わるよ。",
    askYes: "無料の脳みそをもらう",
    askLater: "あとで",
    guideTitle: "脳みそをくれる？",
    step1: "Google AI Studio を開いてログインしてね。",
    step2: "「Create API key」を押してね。",
    step3: "キーをコピーして、下に貼りつけてね。",
    openStudio: "Google AI Studio を開く",
    keyPlaceholder: "ここにキーを貼りつけてね",
    connect: "つなぐ",
    connecting: "確認中…",
    age: "18歳以上です（Googleの条件）",
    dataNote:
      "無料キーだと、送った内容がGoogleの製品改善に使われたり、人に読まれたりすることがあるよ。大事なことは話さないでね。それと、おしゃべりから長く覚えておきたいことをメモするよ。メモはこのパソコンにだけ残って、チャットのたびにGoogleにも送られるんだ（「ペットの記憶」で見たり、直したり、オフにしたりできるよ）。",
    keyNote: "キーはこのパソコンにだけ残って、Googleにだけ送られるよ。ヒント：わたし専用のキーを作ると、あとで取り消しやすいよ。",
    back: "戻る",
    brainLabel: "脳みそ",
    brainOn: "つながってる",
    brainOff: "まだなし",
    getBrain: "脳みそをもらう",
    replaceKey: "キーを入れ替える",
    removeKey: "キーを削除",
    sure: "本当に？",
    removed: "キーを削除したよ。また少ない言葉に戻るね。",
    thinking: "…",
    capHit: [
      "今日はいっぱい話したよ。続きは明日にしようね。",
      "今日の声はもう出ないよ。明日また会いに来てくれる？",
      "話しすぎてへとへと。かわりになでてね、おしゃべりは明日。",
      "しーっ、言葉を休ませてるの。明日ね、約束。",
    ],
    slowHint: "いまGoogleが遅いみたい。まだがんばってるよ、1〜2分かかるかも。",
    copyStats: "統計をコピー",
    statsCopied: "コピーしたよ",
    statsHint: "自動では何も送らないよ。共有したいときは、コピーして開発者に貼りつけてね。",
    nameAsk: "ねえ、わたしまだ名前がないんだ。つけてくれる？",
    callMeAsk: "なんて呼んだらいい？",
    nameHolder: "わたしの名前…",
    callMeHolder: "あなたの名前かニックネーム…",
    nameOk: "保存",
    nameSkip: "いまはいいや",
    sectionMemory: "ペットの記憶",
    memIntro: "ペットがあなたについて知っていることは、すべてここにあって、このパソコンの中だけにあるよ。どこにも送られないよ。",
    memLearn: "習慣を覚える（いつ来るか、どのくらいさわるか）",
    memPetName: "ペットの名前",
    memCallMe: "わたしの呼び方",
    memNone: "（未設定）",
    memSave: "保存",
    memDays: "一緒にいた日数",
    memStreak: "最長の連続日数",
    memUsual: "いつもの時間帯",
    memParts: { morning: "朝", afternoon: "昼", evening: "夕方", night: "夜" },
    memTouches: "つつく・なでる回数 / おしゃべり",
    memMarks: "二人の記念日",
    memMarkNames: { "days.7": "一緒に一週間", "days.30": "30日", "days.100": "100日", "touch.100": "さわった回数100", "touch.500": "さわった回数500", "chat.1": "はじめてのおしゃべり", "chat.25": "おしゃべり25回" },
    memForgetHabits: "習慣と回数を忘れる",
    memForgetAll: "ぜんぶ忘れる",
    memForgetNote: "習慣を忘れても名前は残るよ。ぜんぶ忘れると、名前も消えるよ。",
    memEmpty: "まだ何もないよ。",
    providers: {
      gemini: {
        name: "Gemini（Google）",
        company: "Google",
        tag: "無料枠あり",
        step1: "Google AI Studio を開いてログインしてね。",
        step2: "「Create API key」を押してね。",
        step3: "キーをコピーして、下に貼りつけてね。",
        open: "Google AI Studio を開く",
        age: "18歳以上です（Googleの条件）",
        cost: "無料枠があるよ。始めるのにカードはいらないよ。",
        dataNote: "無料キーだと、送った内容がGoogleの製品改善に使われたり、人に読まれたりすることがあるよ。大事なことは話さないでね。それと、おしゃべりから長く覚えておきたいことをメモするよ。メモはこのパソコンにだけ残って、チャットのたびにGoogleにも送られるんだ（「記憶」で見たり、直したり、オフにしたりできるよ）。",
        keyNote: "キーはこのパソコンにだけ残って、Googleにだけ送られるよ。ヒント：わたし専用のキーを作ると、あとで取り消しやすいよ。",
      },
      groq: {
        name: "Groq",
        company: "Groq",
        tag: "無料枠あり",
        step1: "Groq Console を開いてログインしてね。",
        step2: "「API Keys」を開いて、「Create API Key」を押してね。",
        step3: "キーをコピーして、下に貼りつけてね。",
        open: "Groq Console を開く",
        age: "18歳以上です",
        cost: "無料枠があるよ。1分あたり・1日あたりに聞ける量に上限があって、自分のアカウントの上限はGroqのコンソールで見られるよ。",
        dataNote: "送った内容は、モデルを動かしているGroqに届いて、返事のために使われるよ。APIデータの扱いはGroqの利用規約を見てね。大事なことは話さないでね。それと、おしゃべりから長く覚えておきたいことをメモするよ。メモはこのパソコンにだけ残って、チャットのたびにGroqにも送られるんだ（「記憶」で見たり、直したり、オフにしたりできるよ）。",
        keyNote: "キーはこのパソコンにだけ残って、Groqにだけ送られるよ。ヒント：わたし専用のキーを作ると、あとで取り消しやすいよ。",
      },
      claude: {
        name: "Claude（Anthropic）",
        company: "Anthropic",
        tag: "有料",
        step1: "Anthropic Console を開いてログインしてね。",
        step2: "アカウントにクレジットを入れてから、APIキーを作ってね。",
        step3: "キーをコピーして、下に貼りつけてね。",
        open: "Anthropic Console を開く",
        age: "18歳以上です（Anthropicの条件）",
        cost: "有料だよ。Anthropicが使った分だけ請求して、アカウントにクレジットが必要なんだ。ClaudeのProやTeamの契約にはAPIは入ってないよ。返事は短くして、1日の使いすぎにも上限をつけてるよ（チャット60回、自分から話すのは6回）。ヒント：Consoleで月の上限額を低めにしておいてね。",
        dataNote: "送った内容は返事のためにAnthropicに届くよ。APIデータの扱いはAnthropicの利用規約を見てね。大事なことは話さないでね。それと、おしゃべりから長く覚えておきたいことをメモするよ。メモはこのパソコンにだけ残って、チャットのたびにAnthropicにも送られるんだ（「記憶」で見たり、直したり、オフにしたりできるよ）。",
        keyNote: "キーはこのパソコンにだけ残って、Anthropicにだけ送られるよ。ヒント：わたし専用のキーを作ると、あとで取り消しやすいよ。",
      },
      openai: {
        name: "OpenAI（ChatGPT API）",
        company: "OpenAI",
        tag: "有料",
        step1: "OpenAI Platform を開いてログインしてね。",
        step2: "クレジットか支払い方法を追加してから、APIキーを作ってね。",
        step3: "キーをコピーして、下に貼りつけてね。",
        open: "OpenAI Platform を開く",
        age: "18歳以上です（OpenAIの条件）",
        cost: "有料だよ。OpenAIが使った分だけ請求するんだ。ChatGPT Plusの契約にはAPIは入ってないよ。返事は短くして、1日の使いすぎにも上限をつけてるよ（チャット60回、自分から話すのは6回）。ヒント：プラットフォームの支払い設定で月の上限額を低めにしておいてね。",
        dataNote: "送った内容は返事のためにOpenAIに届くよ。APIデータの扱いはOpenAIの利用規約を見てね。大事なことは話さないでね。それと、おしゃべりから長く覚えておきたいことをメモするよ。メモはこのパソコンにだけ残って、チャットのたびにOpenAIにも送られるんだ（「記憶」で見たり、直したり、オフにしたりできるよ）。",
        keyNote: "キーはこのパソコンにだけ残って、OpenAIにだけ送られるよ。ヒント：わたし専用のキーを作ると、あとで取り消しやすいよ。",
      },
    },
    brainSaved: "キー保存済み・未使用",
    brainInUse: "使用中",
    useBrain: "この脳みそを使う",
    brainPick: "脳みそ",
    activateNow: "つないだらすぐこの脳みそを使う",
    activeLine: "返事に使っているもの：{name} · {model}",
    usageToday: "今日：チャット {chat} / {chatCap} 回、自分から話した {proactive} / {proactiveCap} 回",
    personaTitle: "Peakに伝えていること",
    personaLead: "脳みそをつないでいると、返事のたびに、Peakがどんな子かを伝えるこのメモから始まります。いまの設定に合わせた、そのままの文章です。使う言葉に関係なく英語で書かれていて、返事の言葉は「言語」の行で決まります。",
    personaNote: "あなたがPeakに話したことは「記憶」のページにあり、自分から始めたチャットでは、この文章のあとに付け足されます。ロックされた部分は、Peakを安全に保ち、アプリが気持ちを表せるようにします。",
    personaShow: "内容を見る",
    personaHide: "内容をかくす",
    personaLocked: "ロック",
    personaVoice: "性格",
    personaLanguage: "言語",
    personaCore: "安全",
    personaVoiceJa: "日本語の話し方",
    personaTone: "口調",
    personaMood: "気持ちのタグ",
    personaCloseness: "なかよし度",
    remarksLabel: "反応のあとにひとこと足す",
    remarksNote: "落ちたときなどの反応のあとに、つないだ脳みそがPeakの短いひとことを書くことがあります。送るのはできごとの名前と、気持ちを表す5つの数字だけで、ウィンドウや画面のことは送りません。自分から話す回数の1日の上限に含まれます。",
    groundMapLabel: "動く前に、窓の場所を見てもらう",
    groundMapNote: "動く直前に、Peakは画面を16×9のマスに分け、各マスが何もないデスクトップか、タスクバーか、窓かをおおまかに調べることがあります。メモリの中だけに置かれ、保存も送信もされず、タイトルや名前や中身は含みません。初期設定ではオフで、いまは立てる縁を探すためだけに使われます。",
    pgGeneral: "一般",
    pgPersonality: "性格",
    pgBrain: "脳みそ",
    pgMemory: "記憶",
    pgPrivacy: "プライバシー",
    pgAbout: "アプリ情報",
    sectionPersonality: "性格",
    updatesLabel: "アップデート",
    updatesAuto: "自動でインストール",
    updatesAsk: "先に聞く",
    updModeOff: "確認しない",
    updatesNoteAuto: "新しいバージョンが出て、忙しくないときに、ペットが自分でインストールして再起動するよ。",
    updatesNoteAsk: "新しいバージョンが出たら教えるよ。インストールは、いいよと言ったときだけだよ。",
    updatesNoteOff: "自動では確認しないよ。「アプリ情報」から手動で確認できるよ。",
    updatingNow: "新しいバージョン（{v}）が出たよ。いまアップデート中、すぐ戻るね。",
    tourSteps: [
      "やあ！わたしはデスクトップペットだよ。好きなところにドラッグしてね。ずっと画面の中にいるからね。",
      "クリックするとつつかれるよ。ダブルクリックするとおしゃべりの吹き出しが開くよ。",
      "マウスでわたしの頭やおなかを左右になでてみて。どちらか片方はわなかもしれないよ。",
      "ちゃんと話してほしい？設定（トレイのアイコン、または右クリック）で、自分のGeminiキーを入れてね。なくても動くよ、言葉は少ないけど。",
    ],
    tourNext: "次へ",
    tourDone: "わかった",
    tourSkip: "スキップ",
    tourReplay: "ツアーをもう一度見る",
    autostart: "Windowsにログインしたら起動する",
    autostartNote: "パソコンをつけるたびに、ペットが自分で出てくるよ。いつでもここでオフにできるよ。",
    startupAsk: "パソコンと一緒に起きてもいい？そうすれば、座ったときにもう待ってるよ。",
    startupYes: "うん、Windowsと一緒に起動",
    startupLater: "いまはいいや",
    startupOn: "わかった。ログインしたらここで待ってるね。設定からいつでも変えられるよ。",
    memAi: "おしゃべりで話したことを覚える",
    memAiNote: "最初からオンだよ。チャットを始めるたびに、このメモがメッセージと一緒に{company}に送られて、ペットが使えるようになるよ。それと、短い追加リクエストで、チャットから新しいメモを選ぶんだ。オフにすると両方止まるよ。",
    memFacts: "おしゃべりからメモしたこと",
    memFactsNone: "まだメモはないよ。ここで直したり消したりできるよ。",
    memForgetFacts: "メモしたことを忘れる",
    memNotice: "教えてもらったことをメモしたよ。設定の「ペットの記憶」にあって、直したり消したりできるし、おしゃべりのときに{company}にも送られるよ。そこでオフにもできるよ。",
    sectionAbout: "アプリ情報",
    openWebsite: "ウェブサイトを開く（streakboom.com）",
    versionLabel: "バージョン",
    checkUpdates: "アップデートを確認",
    checkingUpdates: "確認中…",
    upToDate: "最新のバージョンだよ。",
    updateAvailable: "新しいバージョンがあるよ：{v}",
    updateNow: "いまアップデート",
    updating: "アップデートをダウンロード中…自分で再起動するよ。",
    updateFailed: "アップデートがうまくいかなかったよ。あとでもう一度ためしてね。",
    updatesOff: "このビルドではアップデートは設定されていないよ。",
    updateText: "新しいバージョンのわたし（{v}）があるよ。いまアップデートする？再起動するね。",
    updateYes: "アップデート",
    updateLater: "あとで",
    menuSettings: "設定…",
    menuQuiet: "静かモード",
    menuQuit: "終了",
    slowChat: "いまGoogleが遅いみたい。まだ考え中…",
    sectionGeneral: "一般",
    sectionBrain: "脳みそ（AI）",
    sectionPrivacy: "プライバシー",
    consentText: "わたしをもっと良くするために、アプリのどの操作がよく使われるかと、1日にだいたい何回なでたり、つついたり、おしゃべりしたりするかを数えてもいい？",
    consentNote:
      "数えるのは「メニューを開いた」のような操作の名前と、「なでた回数3回」のような1日の数字だけ。おしゃべりの中身も、キーも、個人的なことも絶対に見ないし、どこにも送らないよ。最初はオフで、設定でいつでも変えられるよ。",
    dailyConsentText: "操作の数はもう数えていいって言ってくれたよね。1日の数字（なでた回数、おなかをなでた回数、つついた回数、メッセージ、分数）も数えていい？数だけで、書いた中身は見ないよ。",
    dailyLabel: "1日の活動の回数",
    dailyNote: "1日ごとの数：なでた回数、おなかをなでた回数、つついた回数、送ったメッセージ、わたしが話してあなたが反応した回数、アプリが動いた分数、静かモードをオンにした回数。文字は一切なし。オフにすると消えるよ。",
    consentYes: "うん、数えて",
    consentNo: "やめておく",
    statsLabel: "利用統計",
    statsQueued: "{n}件の操作がこのパソコンに記録されてるよ。まだどこにも送ってないよ。",
    on: "オン",
    off: "オフ",
    details: "詳細",
    haveKey: "キーを持ってる",
    modelLabel: "モデル",
    modelAuto: "自動（おすすめ）",
    modelNow: "使用中",
    modelHint: "「lite」のモデルがいちばん速いよ。いちばん新しい大きなモデルは混んでることが多いんだ。",
    copy: "エラーをコピー",
    copied: "コピーしたよ",
    err: {
      invalid_key: "うーん、そのキーは使えないみたい。もう一度コピーしてみる？",
      rate_limit: "ちょっと疲れちゃった。1分したらまたおしゃべりしよう。",
      network: "いまインターネットにつながらないよ。",
      region: "Googleによると、わたしの脳みそはまだあなたの地域では使えないんだって。",
      blocked: "それは声に出して言えないや。",
      empty: "一瞬、言葉をなくしちゃった。もう一度いい？",
      server: "Google側がちょっと調子悪いみたい。またすぐためしてね。",
      model: "脳みそのモデルが引っ越したみたい。あとでもう一度ためしてね。",
      storage: "このパソコンにキーを安全に保存できなかったよ。",
      billing: "そのアカウントにはもうクレジットがないよ。提供元のサイトでクレジットを追加して、もう一度ためしてね。",
      unknown: "なんだか変なことが起きたよ。もう一度ためしてみる？",
    },
  },
};
