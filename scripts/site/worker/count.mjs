// The counter of sticker copies (ADR-0092): a Cloudflare Worker with a D1 database. It receives one small note per copy, "<sticker> <language>"
// (for example "thank-you vi"), adds one to that day's total for that sticker and language, and keeps nothing else: no identifier, no list of
// visitors, no address stored by this code. A request that is not exactly that is refused. The totals are read with a secret token, by the build.
// The code takes `env` (DB, READ_TOKEN, ALLOWED_ORIGIN, optionally LIMITER) so it is tested here with a fake database (scripts/site/counter.test.mjs).

const NOTE = /^([a-z0-9][a-z0-9-]{0,39}) (en|vi|ja)$/;
export const MAX_STICKERS_PER_DAY = 100; // the set has about 34; a day with more different names than this is garbage, not counted

const reply = (status, body = null, extra = {}) => new Response(body, { status, headers: { "cache-control": "no-store", ...extra } });

/** Compares two strings without stopping at the first difference. */
function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/totals") {
      const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
      if (!env.READ_TOKEN || !same(token, env.READ_TOKEN)) return reply(401);
      const { results } = await env.DB.prepare("SELECT day, slug, lang, n FROM uses ORDER BY day, slug, lang").all();
      return reply(200, JSON.stringify({ rows: results }), { "content-type": "application/json" });
    }
    if (request.method !== "POST" || url.pathname !== "/") return reply(404);
    const origin = request.headers.get("origin");
    // Safari (WebKit) sends the origin "null" for a POST that asks for no referrer, which the page does; so "null" is accepted too. The check only turns away other sites that name themselves (ADR-0092).
    if (origin && origin !== "null" && origin !== env.ALLOWED_ORIGIN) return reply(403);
    if (env.LIMITER) {
      const { success } = await env.LIMITER.limit({ key: request.headers.get("cf-connecting-ip") || "none" });
      if (!success) return reply(429);
    }
    const text = (await request.text()).slice(0, 80);
    const m = NOTE.exec(text);
    if (!m) return reply(400);
    const [, slug, lang] = m;
    const day = new Date().toISOString().slice(0, 10);
    const known = await env.DB.prepare("SELECT 1 AS x FROM uses WHERE day = ?1 AND slug = ?2 LIMIT 1").bind(day, slug).first();
    if (!known) {
      const c = await env.DB.prepare("SELECT COUNT(DISTINCT slug) AS c FROM uses WHERE day = ?1").bind(day).first();
      if ((c?.c || 0) >= MAX_STICKERS_PER_DAY) return reply(204);
    }
    await env.DB.prepare("INSERT INTO uses (day, slug, lang, n) VALUES (?1, ?2, ?3, 1) ON CONFLICT (day, slug, lang) DO UPDATE SET n = n + 1").bind(day, slug, lang).run();
    return reply(204);
  },
};
