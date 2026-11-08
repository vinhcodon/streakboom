// English and Vietnamese strings. The English text also lives in index.html as the no-JavaScript
// default. These strings are our own (never user or network content), so data-i18n-html may use them.
export const STRINGS = {
  en: {
    title: "Streakboom: meet Peak, a desktop pet cat",
    nav_features: "Features", nav_install: "Install", nav_privacy: "Privacy", nav_faq: "FAQ", nav_updates: "Updates",
    hero_title: "A little cat that lives on your screen.",
    hero_lead: "Meet <strong>Peak</strong>, a cheerful golden chibi cat. It reacts when you stroke, poke or carry it, says short lines in Vietnamese or English, and keeps you company. Free and open source, for Windows.",
    download: "Download for Windows", latest_release: "latest release", see_more: "See what it does",
    share_btn: "Send link to my PC", link_copied: "Link copied",
    other_os: "Peak runs on Windows 10/11, so this device cannot install it. Send the link to your PC and download it there.",
    direct_dl: "Download the .exe anyway",
    alpha_note: "Closed alpha, Windows 10/11 only. The installer is not code-signed yet, so SmartScreen will warn: choose <em>More info</em>, then <em>Run anyway</em>.",
    demo_hint: "Try it: move the mouse near Peak, click it, or pick a pose.",
    pose_idle: "Idle", pose_happy: "Happy", pose_purr: "Purr", pose_sleep: "Sleep", pose_walk: "Walk", pose_gasp: "Surprised", pose_sad: "Sad", pose_curious: "Curious",
    feat_title: "A companion, not an assistant",
    feat_sub: "Lovable with no AI at all. Bring your own key if you want it to chat.",
    f1_h: "🐈 Alive without AI", f1_p: "A mood and closeness model, 182 hand-written lines per language, quiet hours, and no guilt: it never dies or starves, it only gets a bit lonely.",
    f2_h: "👆 Gestures, not buttons", f2_p: "Sweep over its head to scratch, over its belly to rub, click to poke, drag to carry it by the scruff. Its eyes follow your cursor.",
    f3_h: "🧠 Bring your own brain", f3_p: "Add a Gemini, Claude or OpenAI key and double-click to chat. Gemini has a free tier. Your key stays on your computer.",
    f4_h: "💭 Remembers a little", f4_p: "A name for the pet, what to call you, a few milestones. See, edit or forget any of it in Settings, Memory.",
    f5_h: "🤫 Polite", f5_p: "Quiet in fullscreen apps, during quiet hours and in Quiet mode. Never takes keyboard focus for plain speech.",
    f6_h: "🍃 Light", f6_p: "About 100 to 120 MB of memory and almost no CPU while it stands still (measured on one machine so far).",
    use_title: "How to play with Peak",
    g1_a: "Sweep the cursor over its head", g1_b: "Scratch: it is happy and gets closer to you",
    g2_a: "Sweep over its belly", g2_b: "A belly rub: bliss, or sometimes a playful trap",
    g3_a: "Click once", g3_b: "A poke",
    g4_a: "Drag", g4_b: "Carry it; it lands with a little squash",
    g5_a: "Double-click", g5_b: "Open the chat bubble",
    g6_a: "Right-click it, or the tray icon", g6_b: "Settings, Quiet mode, Quit",
    inst_title: "Install in three steps",
    s1: "Download <code>Streakboom_&lt;version&gt;_x64-setup.exe</code> with the button above, or from the <a href=\"https://github.com/vinhcodon/streakboom/releases/latest\">latest release</a>.",
    s2: "Run it. If Windows says \"Windows protected your PC\", choose <strong>More info</strong>, then <strong>Run anyway</strong>. It installs for the current user only, with no administrator rights.",
    s3: "Peak appears on your screen and shows a short tour. To remove it, use Windows Settings, Apps.",
    inst_note: "Windows needs the WebView2 runtime; the installer downloads it if it is missing.",
    priv_title: "Your data stays yours",
    p1: "API keys are stored in the Windows Credential Manager and sent only to the provider you chose.",
    p2: "What Peak remembers is stored on your computer, and you can see or delete all of it in Settings.",
    p3: "Usage stats are off by default, and nothing is ever sent automatically.",
    p4: "Free and MIT licensed. The code is public, so anyone can read it.",
    faq_title: "Questions",
    q1: "Is it really free?", a1: "Yes. The app costs nothing and the code is under the MIT license. An AI brain is optional and is billed by the provider you choose (Gemini has a free tier; Claude and OpenAI are paid).",
    q2: "Why does Windows warn me when I run the installer?", a2: "The installer is not code-signed yet, so SmartScreen does not recognise it. Choose More info, then Run anyway. The source is public in the GitHub repository.",
    q3: "Do I need AI or an account?", a3: "No. Peak is lovable without any AI and there is no account. If you add your own key, it can also chat and remember a few things about you.",
    q4: "Does it work on Mac or Linux?", a4: "Not yet. It is Windows 10/11 only for now. A macOS port is on the roadmap.",
    q5: "How do I get updates?", a5: "Peak can update itself: install automatically when you are idle, ask first (the default), or never check. You can also download any release from this page.",
    upd_title: "Latest updates",
    upd_sub: "Pulled live from <a href=\"https://github.com/vinhcodon/streakboom/releases\">GitHub Releases</a>. Release notes are in English.",
    notes_more: "Full notes", loading: "Loading releases…", rss: "Subscribe via RSS", load_fail: "Could not load releases. See GitHub Releases.",
    foot_a: "MIT License. Made by Vinh Nguyen. Peak is an original character, drawn as vector shapes in code with Claude's help.",
    foot_bug: "Report a bug",
  },
  vi: {
    title: "Streakboom: gặp Peak, chú mèo thú cưng trên màn hình",
    nav_features: "Tính năng", nav_install: "Cài đặt", nav_privacy: "Riêng tư", nav_faq: "Hỏi đáp", nav_updates: "Cập nhật",
    hero_title: "Một chú mèo nhỏ sống trên màn hình của bạn.",
    hero_lead: "Gặp <strong>Peak</strong>, chú mèo chibi màu vàng vui vẻ. Peak phản ứng khi bạn vuốt ve, chọc hay bế nó, nói vài câu ngắn bằng tiếng Việt hoặc tiếng Anh và ở bên bạn lúc làm việc. Miễn phí, mã nguồn mở, dành cho Windows.",
    download: "Tải về cho Windows", latest_release: "bản mới nhất", see_more: "Xem Peak làm được gì",
    share_btn: "Gửi liên kết sang máy tính", link_copied: "Đã sao chép liên kết",
    other_os: "Peak chạy trên Windows 10/11 nên thiết bị này không cài được. Hãy gửi liên kết sang máy tính của bạn rồi tải về ở đó.",
    direct_dl: "Vẫn tải file .exe",
    alpha_note: "Bản alpha kín, chỉ dành cho Windows 10/11. Bộ cài chưa được ký số nên SmartScreen sẽ cảnh báo: hãy chọn <em>More info</em>, rồi <em>Run anyway</em>.",
    demo_hint: "Thử đi: rê chuột lại gần Peak, bấm vào nó, hoặc chọn một tư thế.",
    pose_idle: "Đứng yên", pose_happy: "Vui", pose_purr: "Rù rù", pose_sleep: "Ngủ", pose_walk: "Đi dạo", pose_gasp: "Giật mình", pose_sad: "Buồn", pose_curious: "Tò mò",
    feat_title: "Một người bạn đồng hành, không phải trợ lý",
    feat_sub: "Đáng yêu mà không cần AI. Muốn trò chuyện thì mang khóa API của riêng bạn.",
    f1_h: "🐈 Sống động không cần AI", f1_p: "Có mô hình tâm trạng và độ thân thiết, 182 câu viết tay cho mỗi ngôn ngữ, giờ yên tĩnh, và không gây áp lực: nó không chết hay đói, chỉ hơi buồn khi vắng bạn.",
    f2_h: "👆 Cử chỉ thay cho nút bấm", f2_p: "Lướt qua đầu để gãi, qua bụng để xoa, bấm để chọc, kéo để xách nó lên. Mắt nó nhìn theo con trỏ chuột của bạn.",
    f3_h: "🧠 Mang bộ não của riêng bạn", f3_p: "Thêm khóa Gemini, Claude hoặc OpenAI rồi bấm đúp để trò chuyện. Gemini có gói miễn phí. Khóa của bạn chỉ nằm trên máy bạn.",
    f4_h: "💭 Nhớ một chút", f4_p: "Tên của thú cưng, cách gọi bạn, vài cột mốc. Xem, sửa hoặc xóa bất cứ thứ gì trong Cài đặt, Bộ nhớ.",
    f5_h: "🤫 Lịch sự", f5_p: "Im lặng khi bạn dùng ứng dụng toàn màn hình, trong giờ yên tĩnh và ở chế độ Yên tĩnh. Không giành bàn phím khi chỉ nói chuyện thường.",
    f6_h: "🍃 Nhẹ", f6_p: "Khoảng 100 đến 120 MB bộ nhớ và gần như không tốn CPU khi đứng yên (mới đo trên một máy).",
    use_title: "Chơi với Peak thế nào",
    g1_a: "Lướt con trỏ qua đầu", g1_b: "Gãi đầu: nó vui và thân với bạn hơn",
    g2_a: "Lướt qua bụng", g2_b: "Xoa bụng: sung sướng, hoặc đôi khi là một cái bẫy tinh nghịch",
    g3_a: "Bấm một lần", g3_b: "Chọc nó",
    g4_a: "Kéo", g4_b: "Xách nó đi; nó tiếp đất với một cú nảy nhẹ",
    g5_a: "Bấm đúp", g5_b: "Mở khung trò chuyện",
    g6_a: "Bấm chuột phải vào nó, hoặc vào biểu tượng khay", g6_b: "Cài đặt, chế độ Yên tĩnh, Thoát",
    inst_title: "Cài đặt trong ba bước",
    s1: "Tải <code>Streakboom_&lt;phiên bản&gt;_x64-setup.exe</code> bằng nút ở trên, hoặc từ <a href=\"https://github.com/vinhcodon/streakboom/releases/latest\">bản phát hành mới nhất</a>.",
    s2: "Chạy file. Nếu Windows báo \"Windows protected your PC\", hãy chọn <strong>More info</strong>, rồi <strong>Run anyway</strong>. Bộ cài chỉ cài cho người dùng hiện tại, không cần quyền quản trị.",
    s3: "Peak xuất hiện trên màn hình và có một buổi giới thiệu ngắn. Muốn gỡ, vào Cài đặt Windows, Ứng dụng.",
    inst_note: "Windows cần WebView2 runtime; bộ cài sẽ tự tải nếu máy chưa có.",
    priv_title: "Dữ liệu của bạn là của bạn",
    p1: "Khóa API được lưu trong Windows Credential Manager và chỉ gửi đến nhà cung cấp bạn đã chọn.",
    p2: "Những gì Peak nhớ được lưu trên máy bạn, và bạn có thể xem hoặc xóa toàn bộ trong Cài đặt.",
    p3: "Thống kê sử dụng mặc định tắt, và không bao giờ tự động gửi đi.",
    p4: "Miễn phí, giấy phép MIT. Mã nguồn công khai nên ai cũng đọc được.",
    faq_title: "Hỏi đáp",
    q1: "Có thật sự miễn phí không?", a1: "Có. Ứng dụng không tốn phí và mã nguồn theo giấy phép MIT. Bộ não AI là tùy chọn và do nhà cung cấp bạn chọn tính phí (Gemini có gói miễn phí; Claude và OpenAI thì trả phí).",
    q2: "Tại sao Windows cảnh báo khi tôi chạy bộ cài?", a2: "Bộ cài chưa được ký số nên SmartScreen chưa nhận ra nó. Hãy chọn More info, rồi Run anyway. Mã nguồn công khai trên kho GitHub.",
    q3: "Tôi có cần AI hay tài khoản không?", a3: "Không. Peak đáng yêu mà không cần AI và cũng không có tài khoản. Nếu bạn thêm khóa của riêng mình, nó có thể trò chuyện và nhớ vài điều về bạn.",
    q4: "Có chạy trên Mac hoặc Linux không?", a4: "Chưa. Hiện chỉ có Windows 10/11. Bản cho macOS nằm trong lộ trình.",
    q5: "Làm sao để nhận bản cập nhật?", a5: "Peak có thể tự cập nhật: tự cài khi bạn rảnh, hỏi trước (mặc định), hoặc không kiểm tra. Bạn cũng có thể tải bất kỳ bản phát hành nào ngay trên trang này.",
    upd_title: "Cập nhật mới nhất",
    upd_sub: "Lấy trực tiếp từ <a href=\"https://github.com/vinhcodon/streakboom/releases\">GitHub Releases</a>. Ghi chú phát hành bằng tiếng Anh.",
    notes_more: "Xem đầy đủ", loading: "Đang tải các bản phát hành…", rss: "Đăng ký qua RSS", load_fail: "Không tải được danh sách bản phát hành. Xem GitHub Releases.",
    foot_a: "Giấy phép MIT. Tác giả Vinh Nguyen. Peak là nhân vật gốc, được vẽ bằng các hình vector trong mã với sự hỗ trợ của Claude.",
    foot_bug: "Báo lỗi",
  },
};

const pick = () => {
  try {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "vi") return saved;
  } catch {}
  return (navigator.language || "en").toLowerCase().startsWith("vi") ? "vi" : "en";
};

export let lang = pick();
export const t = (key) => STRINGS[lang][key] ?? STRINGS.en[key] ?? key;

export function applyLang(next = lang) {
  lang = next;
  try { localStorage.setItem("lang", lang); } catch {}
  document.documentElement.lang = lang;
  document.title = t("title");
  document.documentElement.classList.remove("i18n-pending");
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-html]")) el.innerHTML = t(el.dataset.i18nHtml);
  const btn = document.getElementById("lang-btn");
  if (btn) btn.textContent = lang === "vi" ? "EN" : "VI";
  document.dispatchEvent(new CustomEvent("langchange"));
}
