/**
 * Page weight budget.
 *
 * Mintlify proxied every screenshot through a resizing CDN, so the 4.2 MB
 * files in this repo reached readers at ~67 KB. Self-hosting loses that and
 * `output: 'export'` rules out Next's optimizer, so the build ships what is
 * on disk: /docs/build/introduction once weighed 13.6 MB against the live
 * site's 2.8 MB, with LCP at 8.6 s. tools/optimize-images.mjs fixes it; this
 * stops it coming back when someone adds a screenshot.
 *
 * Counts what the document references directly -- images, video posters and
 * the HTML itself. Lazy images are included: they are still the page's
 * bytes, just deferred.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'out');
// The yearly changelog archives carry 60-100 screenshots each and sit just
// over 3 MB even fully optimized; every one of them is lazy. 4 MB leaves
// them alone while still catching a single unoptimized 4 MB screenshot.
const BUDGET_MB = 4;

const pages = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) pages.push(p);
  }
})(path.join(OUT, 'docs'));

const size = (f) => { try { return fs.statSync(f).size; } catch { return 0; } };

const rows = [];
let missing = 0;
for (const f of pages) {
  const html = fs.readFileSync(f, 'utf8');
  let bytes = Buffer.byteLength(html);
  const seen = new Set();
  for (const m of html.matchAll(/(?:src|poster)="(\/docs\/(?:images|videos)\/[^"]+)"/g)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    // Assets live at out/<path> -- the /docs prefix comes from assetPrefix.
    const onDisk = path.join(OUT, m[1].slice('/docs/'.length));
    const s = size(onDisk);
    if (!s) missing++;
    bytes += s;
  }
  rows.push({ url: f.slice(OUT.length).replace(/\.html$/, ''), bytes, assets: seen.size });
}

rows.sort((a, b) => b.bytes - a.bytes);
const mb = (n) => (n / 1048576).toFixed(2);
const over = rows.filter((r) => r.bytes > BUDGET_MB * 1048576);

console.log(`pages          : ${rows.length}`);
console.log(`total          : ${mb(rows.reduce((n, r) => n + r.bytes, 0))} MB`);
console.log(`median page    : ${mb(rows[Math.floor(rows.length / 2)].bytes)} MB`);
console.log(`heaviest       : ${mb(rows[0].bytes)} MB  ${rows[0].url}`);
console.log(`over ${BUDGET_MB} MB budget: ${over.length}`);
if (missing) console.log(`  NOTE  ${missing} referenced assets not found on disk (check-links covers those)`);

if (over.length) {
  console.error('\nPAGES OVER BUDGET:');
  for (const r of over.slice(0, 15)) console.error(`  ${mb(r.bytes)} MB  ${r.url}  (${r.assets} assets)`);
  console.error('\nRun `node tools/optimize-images.mjs`, or shrink the source screenshots.');
  process.exit(1);
}
console.log(`\nWEIGHT OK: every page is under the ${BUDGET_MB} MB budget.`);
