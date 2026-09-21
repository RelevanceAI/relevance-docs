/**
 * Produces site/dist -- the deployable output root.
 *
 * After flattening the routes (the app no longer has its own /docs segment;
 * `basePath: '/docs'` supplies the prefix exactly once), out/ IS the /docs
 * tree, so this is a straight copy plus a sanity check that the pieces the
 * HTML references are actually present.
 *
 * Layout: everything lives under dist/docs/, so the output root is served at
 * the DOMAIN root and every public URL is /docs/... natively. That matters
 * because host redirect rules (_redirects, vercel.json) are written as paths
 * from the domain root, and ours carry the /docs prefix -- mounting the
 * output at /docs instead would double it.
 *
 * Vercel : project output directory = site/dist
 * CF Pages: build output directory  = site/dist
 * Either way the marketing site rewrites /docs/:path* to this deployment.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'out');
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(path.join(OUT, 'docs'))) {
  console.error('site/out/docs missing -- run `npx next build` first.');
  process.exit(2);
}

fs.rmSync(DIST, { recursive: true, force: true });
const DOCS = path.join(DIST, 'docs');

// out/docs/** is the page tree; everything else the HTML references sits at
// out/ root and is referenced under /docs thanks to assetPrefix, so both
// halves are gathered under dist/docs/.
fs.cpSync(path.join(OUT, 'docs'), DOCS, { recursive: true });
for (const entry of ['_next', 'images', 'videos', 'og', 'llms.mdx', 'llms.txt',
  'llms-full.txt', 'sitemap.xml', 'robots.txt', 'favicon.png', '404.html']) {
  const src = path.join(OUT, entry);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(DOCS, entry), { recursive: true });
}

// Host rule files are read from the output ROOT, not from /docs.
for (const entry of ['_redirects', '_headers']) {
  const src = path.join(OUT, entry);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(DIST, entry));
}

// macOS/editor junk that Mintlify never served -- .DS_Store files were being
// deployed alongside the images.
let pruned = 0;
(function prune(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { prune(p); continue; }
    if (['.DS_Store', 'Thumbs.db'].includes(e.name) || e.name.endsWith('.orig')) {
      fs.rmSync(p); pruned++;
    }
  }
})(DIST);

const REQUIRED = ['docs/_next', 'docs/images', 'docs/sitemap.xml', 'docs/robots.txt',
  'docs/favicon.png', '_redirects', 'docs/llms.txt', 'docs/llms-full.txt', 'docs/og'];
const missing = REQUIRED.filter((r) => !fs.existsSync(path.join(DIST, r)));

const count = (d) => fs.readdirSync(d, { withFileTypes: true })
  .reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);

console.log(`dist/ files: ${count(DIST)} (pruned ${pruned} junk files)`);
if (missing.length) {
  console.error(`MISSING from dist: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('all required top-level entries present');
console.log('\nDeploy: site/dist is the output root; pages live at /docs/*.');
