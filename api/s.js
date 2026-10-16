// Serves a link preview (Open Graph tags) for a shared sip, then sends people to the real page.
const SB_URL = process.env.SUPABASE_URL, SB_KEY = process.env.SUPABASE_KEY;
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

module.exports = async (req, res) => {
  const id = String(req.query.id || ''), origin = `https://${req.headers.host}`;
  let p = null;
  if (/^[0-9a-f-]{36}$/i.test(id) && SB_URL && SB_KEY) {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/rpc/share_preview`, {
        method: 'POST',
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: id }),
      });
      const d = await r.json();
      p = Array.isArray(d) && d[0] ? d[0] : null;
    } catch (e) { /* fall back to the generic preview */ }
  }
  const title = p ? `@${p.username} on GUHSIP` : "GUHSIP: What's the sip?";
  const desc = p ? (p.body || 'Shared a sip').slice(0, 200) : 'Gist, reviews and good vibes.';
  const img = p && p.image_url ? p.image_url : `${origin}/icon-512.png`;
  const dest = `${origin}/post.html?id=${encodeURIComponent(id)}`;
  const card = p && p.image_url ? 'summary_large_image' : 'summary';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta property="og:type" content="article"><meta property="og:site_name" content="GUHSIP">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="${card}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}">
<meta http-equiv="refresh" content="0;url=${esc(dest)}"></head>
<body style="background:#050505;color:#fff;font-family:sans-serif"><a style="color:#a3ff12" href="${esc(dest)}">Open on GUHSIP</a>
<script>location.replace(${JSON.stringify(dest)})</script></body></html>`);
};
