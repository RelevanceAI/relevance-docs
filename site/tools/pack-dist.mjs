/**
 * Produces site/dist -- the directory to deploy at the /docs path.
 *
 * After flattening the routes (the app no longer has its own /docs segment;
 * `basePath: '/docs'` supplies the prefix exactly once), out/ IS the /docs
 * tree, so this is a straight copy plus a sanity check that the pieces the
 * HTML references are actually present.
 *
 * Deploy: map /docs/* to this directory. One rule.
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
// out/docs/** is the page tree; everything else the HTML references sits at
// out/ root and is referenced under /docs thanks to assetPrefix, so both
// halves are gathered under one root here.
fs.cpSync(path.join(OUT, 'docs'), DIST, { recursive: true });
for (const entry of ['_next', 'images', 'videos', 'og', 'llms.mdx', 'llms.txt',
  'llms-full.txt', 'sitemap.xml', 'robots.txt', 'favicon.png', '_redirects', '404.html']) {
  const src = path.join(OUT, entry);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(DIST, entry), { recursive: true });
}

const REQUIRED = ['_next', 'images', 'sitemap.xml', 'robots.txt', 'favicon.png',
  '_redirects', 'llms.txt', 'llms-full.txt', 'og'];
const missing = REQUIRED.filter((r) => !fs.existsSync(path.join(DIST, r)));

const count = (d) => fs.readdirSync(d, { withFileTypes: true })
  .reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);

console.log(`dist/ files: ${count(DIST)}`);
if (missing.length) {
  console.error(`MISSING from dist: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('all required top-level entries present');
console.log('\nDeploy: serve site/dist at the /docs path (one rule).');
