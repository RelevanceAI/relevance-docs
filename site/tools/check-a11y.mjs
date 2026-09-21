/**
 * axe-core over a sample of built pages, at desktop and phone widths.
 *
 * Accessibility defects here are invisible in review: a callout that is a
 * complementary landmark, 25 scroll regions all called "Scrollable table",
 * an <svg role="img"> with no name, a screenshot with no alt text. The first
 * pass shipped 47 violations across five pages and nobody could see any of
 * them.
 *
 * Samples every Nth page rather than all 385 -- the violations that matter
 * come from components, which repeat. Pass a count to widen it.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 4560;
const SAMPLE = Number(process.argv[2] ?? 30);
const CACHE = path.join(ROOT, 'node_modules/.cache/axe-core-4.10.2.js');
const AXE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';

const pw = await import(process.env.PLAYWRIGHT_PATH ?? 'playwright')
  .catch(() => import('/opt/node22/lib/node_modules/playwright/index.js'));
const { chromium } = pw.chromium ? pw : pw.default;

if (!fs.existsSync(CACHE)) {
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  const r = await fetch(AXE_URL);
  if (!r.ok) { console.error(`could not fetch axe-core (${r.status})`); process.exit(2); }
  fs.writeFileSync(CACHE, await r.text());
}
const AXE = fs.readFileSync(CACHE, 'utf8');

const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
  '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.svg':'image/svg+xml',
  '.woff2':'font/woff2', '.json':'application/json', '.txt':'text/plain', '.md':'text/markdown' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\//, '');
  for (const f of [path.join(DIST, url), path.join(DIST, `${url}.html`)]) {
    try {
      if (fs.statSync(f).isFile()) {
        res.writeHead(200, { 'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream' });
        return fs.createReadStream(f).pipe(res);
      }
    } catch {}
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(PORT, r));

const all = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html') && e.name !== '404.html') {
      all.push(p.slice(path.join(DIST, 'docs').length + 1).replace(/\.html$/, ''));
    }
  }
})(path.join(DIST, 'docs'));
const step = Math.max(1, Math.floor(all.length / SAMPLE));
const pages = all.filter((_, i) => i % step === 0).slice(0, SAMPLE);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const found = new Map();
for (const vp of [{ name: 'desktop', width: 1440, height: 950 }, { name: 'phone', width: 390, height: 844 }]) {
  for (const slug of pages) {
    const p = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await p.goto(`http://localhost:${PORT}/docs/${slug}`, { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(1800);
    await p.addScriptTag({ content: AXE });
    const r = await p.evaluate(async () => window.axe.run(document, { resultTypes: ['violations'] }));
    for (const v of r.violations) {
      const k = `${v.impact}|${v.id}`;
      if (!found.has(k)) found.set(k, { nodes: 0, where: new Set(), help: v.help, sample: v.nodes[0]?.html?.slice(0, 120) });
      const e = found.get(k);
      e.nodes += v.nodes.length;
      e.where.add(`${vp.name}:${slug}`);
    }
    await p.close();
  }
}
await browser.close();
server.close();

const RANK = { critical: 0, serious: 1, moderate: 2, minor: 3 };
const rows = [...found.entries()].sort(
  (a, b) => RANK[a[0].split('|')[0]] - RANK[b[0].split('|')[0]] || b[1].nodes - a[1].nodes);

console.log(`pages sampled : ${pages.length} of ${all.length}, at 2 viewports`);
console.log(`rules violated: ${rows.length}`);
console.log(`nodes         : ${rows.reduce((n, r) => n + r[1].nodes, 0)}`);
if (rows.length) {
  console.error('\nACCESSIBILITY VIOLATIONS:');
  for (const [k, v] of rows) {
    console.error(`  ${k}  -- ${v.nodes} nodes on ${v.where.size} page/viewport combos`);
    console.error(`     ${v.help}`);
    console.error(`     ${v.sample}`);
    console.error(`     e.g. ${[...v.where][0]}`);
  }
  process.exit(1);
}
console.log('\nA11Y OK: axe-core reports no violations.');
