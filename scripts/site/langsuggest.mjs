// The language suggestion (ADR-0067, amended by ADR-0107): a thin, quiet strip above the header, shown ONCE per browser and language, in the suggested language, with a link to the same page in that
// language and a close button. It never redirects, never asks a server, never looks at the IP address or the location: the only inputs
// are the browser's own list of languages and a short list in the visitor's own local storage (the languages they closed or followed).
// An inline script at the top of the body builds the strip before the first paint, so nothing moves; the strip is not in the static
// HTML, so crawlers and assistants see the pages exactly as before (the hreflang alternates are unchanged).

export const LANG_KEY = "streakboom-lang-seen";

/** The language to suggest, or null. The first language of the browser's list that the site has decides; it is suggested unless it is
 *  the page's own language or the visitor has already closed or followed it. Written in plain ES5 style: it is also embedded, as text,
 *  in the inline script (the same function is tested in Node and runs in the page). */
export function pickSuggestion(languages, pageLang, seen, available) {
  for (var i = 0; i < languages.length; i++) {
    var code = String(languages[i]).toLowerCase().split("-")[0];
    if (available.indexOf(code) !== -1) return code === pageLang || seen.indexOf(code) !== -1 ? null : code;
  }
  return null;
}

/** The language the browser asks for, if it is not the page's own (the first language of its list that the site has), or null; the seen list is not read:
 *  the header button of that language is made a little brighter on every page, even after the strip has been shown. ES5 style, embedded in the inline script. */
export function wantedLanguage(languages, pageLang, available) {
  for (var i = 0; i < languages.length; i++) {
    var code = String(languages[i]).toLowerCase().split("-")[0];
    if (available.indexOf(code) !== -1) return code === pageLang ? null : code;
  }
  return null;
}

const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

/** The inline script of one page. `targets` is { lang: { href, text, close } } for every other language: the same page in it, the
 *  question in that language, the label of the close button in that language. */
export function inlineScript(pageLang, targets) {
  return `(function(){var K=${json(LANG_KEY)},P=${json(pageLang)},T=${json(targets)},A=${json(["en", "vi", "ja"])};
var pick=${pickSuggestion.toString()};
var want=${wantedLanguage.toString()};
function read(){try{var v=JSON.parse(localStorage.getItem(K)||"[]");return Array.isArray(v)?v:[]}catch(e){return[]}}
function write(l){try{var v=read();if(v.indexOf(l)<0)v.push(l);localStorage.setItem(K,JSON.stringify(v))}catch(e){}}
var L=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""];
var w=want(L,P,A);
if(w)document.documentElement.setAttribute("data-want",w);
var l=pick(L,P,read(),A);
if(!l||!T[l])return;
write(l);
var t=T[l],d=document.createElement("div");d.className="lang-strip";d.setAttribute("lang",l);
var a=document.createElement("a");a.href=t.href;a.setAttribute("hreflang",l);a.textContent=t.text;a.addEventListener("click",function(){write(l)});
var b=document.createElement("button");b.type="button";b.setAttribute("aria-label",t.close);b.textContent="\\u00d7";b.addEventListener("click",function(){write(l);d.parentNode&&d.parentNode.removeChild(d)});
d.appendChild(a);d.appendChild(b);document.body.insertBefore(d,document.body.firstChild);
})();`;
}
