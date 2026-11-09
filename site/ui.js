// The few strings the page scripts need (the share button, the pose labels). The build (scripts/site/pages.mjs) writes them
// into every page as JSON in the page's own language; everything else on the page is static HTML.
let ui = {};
try {
  ui = JSON.parse(document.getElementById("ui-strings")?.textContent || "{}");
} catch {
  // no strings: the keys themselves are shown
}
export const t = (key) => ui[key] ?? key;
