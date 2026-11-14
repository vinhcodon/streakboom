// The taglines of the home page (ADR-0104). One is in the HTML (the default: what a crawler, a reader without script and the first paint see); a tiny inline
// script, right after it, replaces it with one picked at random from the same list when the page is loaded. No timer, no animation, nothing stored: the cat
// does not perform on a page the person is reading (charter articles 2 and 3). The slogan under the name in the header is fixed.
export const TAGLINE_KEYS = ["tg1", "tg2", "tg3", "tg4", "tg5", "tg6", "tg7", "tg8", "tg9", "tg10", "tg11", "tg12"];
/** The one in the HTML: the one that also says what Peak is. */
export const DEFAULT_TAGLINE = "tg4";
/** The words a tagline script may not contain: no timer, no storage, no request, no cookie. */
export const FORBIDDEN_IN_SCRIPT = ["setInterval", "setTimeout", "requestAnimationFrame", "localStorage", "sessionStorage", "indexedDB", "fetch", "XMLHttpRequest", "sendBeacon", "cookie", "animate"];
export const MAX_TAGLINE_LENGTH = { en: 80, vi: 80, ja: 48 };

/** The inline script that picks one tagline at random from the list of the page language. */
export function taglineScript(list) {
  const json = JSON.stringify(list).replaceAll("<", "\\u003c");
  return `(function(){var T=${json},e=document.getElementById("tagline");if(e&&T.length)e.textContent=T[Math.floor(Math.random()*T.length)]})();`;
}
