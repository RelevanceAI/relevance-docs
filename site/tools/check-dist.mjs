/**
 * Proves site/dist is correct by serving it EXACTLY as a host would --
 * /docs/<path> maps to dist/<path>, with no fallbacks or path guessing --
 * then loading real pages in a browser and failing on any 404.
 *
 * The permissive dev server used earlier masked a real defect: raw asset
 * refs and _next chunks resolved only because it tried multiple candidate
 * paths. This one does not.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
// Playwright is a dev-only dependency for this check; resolve it from
// wherever it is installed rather than adding it to the site's bundle.
const { chromium } = await import(process.env.PLAYWRIGHT_PATH ?? 'playwright');

const DIST = path.resolve(import.meta.dirname, '../dist');
const PORT = 4455;
const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml',
  '.gif':'image/gif', '.webp':'image/webp', '.woff2':'font/woff2', '.json':'application/json',
  '.txt':'text/plain', '.md':'text/markdown', '.xml':'application/xml', '.mp4':'video/mp4' };

// Load the generated host rules so the check behaves like production.
const rules = [];
const rf = path.join(DIST, '_redirects');
if (fs.existsSync(rf)) {
  for (const line of fs.readFileSync(rf, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [from, to, code] = t.split(/\s+/);
    rules.push({ from, to, code: Number(code) || 301 });
  }
}
const redirectFor = (url) => {
  for (const r of rules) {
    if (r.from.endsWith('*')) {
      const base = r.from.slice(0, -1);
      if (url.startsWith(base)) return { to: r.to.replace(':splat', url.slice(base.length)), code: r.code };
    } else if (r.from === url) return { to: r.to, code: r.code };
  }
  return null;
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!url.startsWith('/docs')) { res.writeHead(404); return res.end('outside /docs'); }
  const hit = redirectFor(url);
  if (hit) { res.writeHead(hit.code, { location: hit.to }); return res.end(); }
  const rel = url.slice('/docs'.length).replace(/^\//, '');
  // Exactly one fallback, the same one every static host does: `x` -> `x.html`.
  const candidates = [path.join(DIST, rel), path.join(DIST, `${rel}.html`)];
  for (const f of candidates) {
    try {
      if (fs.statSync(f).isFile()) {
        res.writeHead(200, { 'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream' });
        return fs.createReadStream(f).pipe(res);
      }
    } catch {}
  }
  res.writeHead(404); res.end(`404 ${url}`);
});
await new Promise((r) => server.listen(PORT, r));

const PAGES = [
  'get-started/introduction',
  'get-started/core-concepts/agents',
  'enterprise/data-retention',
  'build/tools/tool-steps/google-sheets/add-multiple-rows',
  'changelog',
  'get-started/pricing',
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const failures = [];

for (const slug of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const bad = [];
  // Same-origin only: this checks the built site, not third-party embeds.
  // The Relevance chat widget calls its own API, which 401s without auth
  // here -- that is the embed working, not a defect in dist/.
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(`http://localhost:${PORT}`)) {
      bad.push(`${r.status()} ${r.url()}`);
    }
  });
  // Not networkidle: the Relevance chat embed keeps a connection open, so
  // the page never goes idle.
  await page.goto(`http://localhost:${PORT}/docs/${slug}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);

  const broken = await page.evaluate(() =>
    [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src));

  if (bad.length || broken.length) failures.push({ slug, bad, broken });
  console.log(`  ${bad.length || broken.length ? 'FAIL' : ' ok '}  /docs/${slug}` +
    `  (${bad.length} http errors, ${broken.length} broken imgs)`);
  await page.close();
}

await browser.close();
server.close();

if (failures.length) {
  console.error('\nFAILURES:');
  for (const f of failures) {
    console.error(`  /docs/${f.slug}`);
    for (const b of [...f.bad, ...f.broken].slice(0, 8)) console.error(`     ${b}`);
  }
  process.exit(1);
}
console.log('\nDIST OK: every page loads with no 404s and no broken images,');
console.log('served with a single /docs -> dist mapping.');
