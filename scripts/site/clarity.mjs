// Microsoft Clarity (ADR-0118, under ADR-0096): a tool that records how pages are used (clicks, scrolling, mouse movement) and sets cookies.
// The switch is scripts/site/catalog/measurement.json, "clarity": { "projectId": "" } (empty = off: no script, no words). When it is on, one inline script is
// the last thing of every page. It loads Clarity at once for a visitor whose time zone is in Vietnam or Japan, and for any other visitor only after
// they press Accept in a notice of the site's own (no consent script of a third party); it never loads when the browser sends Do Not Track or
// Global Privacy Control, or after the visitor said no. The choice is kept in the visitor's own local storage. Clarity is not in the static HTML
// as a tag with an address: the loader builds its script element, so the build and the live check look for the loader and for the address in it.
import { clarityOn } from "./counting.mjs";
import { STRINGS } from "../../site/strings.mjs";

export const CLARITY_KEY = "streakboom-clarity";
export const CLARITY_SRC = "https://www.clarity.ms/tag/";

/** What the page does for this visitor: "load" (run Clarity now), "ask" (show the notice) or "none". ES5 style: it is also embedded, as text, in the inline script.
 *  `stored` is "yes", "no" or null (the visitor's earlier answer); `dnt` and `gpc` are the browser's Do Not Track and Global Privacy Control signals. */
export function clarityDecision(zone, stored, dnt, gpc) {
  if (dnt || gpc) return "none";
  if (stored === "no") return "none";
  if (stored === "yes") return "load";
  var home = zone === "Asia/Ho_Chi_Minh" || zone === "Asia/Saigon" || zone === "Asia/Tokyo";
  return home ? "load" : "ask";
}

const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

/** The inline script of a page: `id` is the project id, `texts` the notice in the page's language ({ text, yes, no }). */
export function loaderScript(id, texts) {
  return `(function(){var I=${json(id)},K=${json(CLARITY_KEY)},T=${json(texts)};
var decide=${clarityDecision.toString()};
var z="";try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||""}catch(e){}
var s=null;try{s=localStorage.getItem(K)}catch(e){}
var n=navigator,d=decide(z,s,n.doNotTrack==="1"||window.doNotTrack==="1",n.globalPrivacyControl===true);
function load(){var c=window,a="clarity";c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};var t=document.createElement("script");t.async=1;t.src=${json(CLARITY_SRC)}+I;var y=document.getElementsByTagName("script")[0];y.parentNode.insertBefore(t,y)}
function put(v){try{localStorage.setItem(K,v)}catch(e){}}
if(d==="load"){load();return}
if(d!=="ask")return;
var b=document.createElement("div");b.className="consent-strip";b.setAttribute("role","region");b.setAttribute("aria-label","Microsoft Clarity");
var p=document.createElement("p");p.textContent=T.text;
var y=document.createElement("button");y.type="button";y.className="yes";y.textContent=T.yes;
var o=document.createElement("button");o.type="button";o.textContent=T.no;
function gone(){b.parentNode&&b.parentNode.removeChild(b)}
y.addEventListener("click",function(){put("yes");gone();load()});
o.addEventListener("click",function(){put("no");gone()});
b.appendChild(p);b.appendChild(y);b.appendChild(o);document.body.appendChild(b);
})();`;
}

/** The loader of a page in a language, or "" when Clarity is off. */
export function clarityTag(lang, ctx) {
  if (!clarityOn(ctx)) return "";
  const S = STRINGS[lang];
  return `<script id="clarity-loader">${loaderScript(ctx.measurement.clarity.projectId, { text: S.cs_text, yes: S.cs_yes, no: S.cs_no })}</script>`;
}
