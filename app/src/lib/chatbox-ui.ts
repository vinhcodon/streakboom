// The words of the chat box and of the Shortcuts card, in the language the person chose in Settings (Vietnamese, English, Japanese). The names Peak and
// Paws are never translated. The main page tells the box the language with every view.

import type { SlashItem } from "./chatbox.ts";

export type BoxLang = "vi" | "en" | "ja";

export interface BoxStrings {
  today: string;
  you: string;
  sendTo: string;
  both: string;
  keepOpen: string;
  send: string;
  commands: string;
  messagePeak: string;
  messagePaws: string;
  messageBoth: string;
  noBrain: string;
  empty: string;
  emptyNoBrain: string;
  hintName: string; // the part before the command; the page adds /name and the closing part
  hintNameAfter: string;
  writing: string; // "{name} is writing"
  locale: string;
  slash: { outPaws: string; outPeak: string; inPaws: string; inPeak: string; pin: string; clear: string; callMe: string }; // callMe has {name}
}

export const BOX_UI: Record<BoxLang, BoxStrings> = {
  en: {
    today: "Today", you: "You", sendTo: "Send to", both: "Both", keepOpen: "Keep open", send: "Send", commands: "Commands",
    messagePeak: "Message Peak", messagePaws: "Message Paws", messageBoth: "Message Peak and Paws",
    noBrain: "No brain connected: commands only",
    empty: "Say something to Peak or Paws.",
    emptyNoBrain: "No brain is connected. Commands such as “call Paws out” still work.",
    hintName: "Tell Peak and Paws what to call you: type", hintNameAfter: "and your name.",
    writing: "{name} is writing", locale: "en-GB",
    slash: { outPaws: "Call Paws out", outPeak: "Call Peak out", inPaws: "Send Paws in", inPeak: "Send Peak in", pin: "Keep the box open", clear: "Clear this chat", callMe: "Call me {name}" },
  },
  vi: {
    today: "Hôm nay", you: "Bạn", sendTo: "Gửi cho", both: "Cả hai", keepOpen: "Giữ hộp luôn mở", send: "Gửi", commands: "Lệnh",
    messagePeak: "Nhắn cho Peak", messagePaws: "Nhắn cho Paws", messageBoth: "Nhắn cho Peak và Paws",
    noBrain: "Chưa có bộ não: chỉ dùng được lệnh",
    empty: "Nói gì đó với Peak hoặc Paws đi.",
    emptyNoBrain: "Chưa có bộ não nào. Các lệnh như “gọi Paws ra” vẫn dùng được.",
    hintName: "Cho Peak và Paws biết nên gọi bạn là gì: gõ", hintNameAfter: "rồi tên của bạn.",
    writing: "{name} đang viết", locale: "vi-VN",
    slash: { outPaws: "Gọi Paws ra", outPeak: "Gọi Peak ra", inPaws: "Cho Paws vào", inPeak: "Cho Peak vào", pin: "Giữ hộp luôn mở", clear: "Xóa cuộc trò chuyện này", callMe: "Hãy gọi tôi là {name}" },
  },
  ja: {
    today: "今日", you: "あなた", sendTo: "宛先", both: "ふたり", keepOpen: "開いたままにする", send: "送信", commands: "コマンド",
    messagePeak: "Peakにメッセージ", messagePaws: "Pawsにメッセージ", messageBoth: "PeakとPawsにメッセージ",
    noBrain: "ブレインが未接続です：コマンドのみ",
    empty: "PeakかPawsに話しかけてみよう。",
    emptyNoBrain: "ブレインが未接続です。「Pawsを呼んで」などのコマンドは使えます。",
    hintName: "PeakとPawsに呼び名を伝えるには、", hintNameAfter: "と名前を入力してね。",
    writing: "{name}が入力中", locale: "ja-JP",
    slash: { outPaws: "Pawsを呼ぶ", outPeak: "Peakを呼ぶ", inPaws: "Pawsを戻す", inPeak: "Peakを戻す", pin: "ボックスを開いたままにする", clear: "このチャットを消す", callMe: "{name}と呼んで" },
  },
};

export function boxStrings(lang: string | undefined): BoxStrings {
  return BOX_UI[lang === "vi" || lang === "ja" ? lang : "en"];
}

/** The label of an item of the slash list in the chosen language (the item itself carries the English one). */
export function slashLabel(s: BoxStrings, it: SlashItem): string {
  switch (it.act.kind) {
    case "out": return it.act.target === "paws" ? s.slash.outPaws : s.slash.outPeak;
    case "in": return it.act.target === "paws" ? s.slash.inPaws : s.slash.inPeak;
    case "pin": return s.slash.pin;
    case "clear": return s.slash.clear;
    case "name": return s.slash.callMe.replace("{name}", it.act.value);
  }
}
