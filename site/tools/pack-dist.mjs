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

// Copy everything ELSE at out/ root into dist/docs, rather than a whitelist.
// A whitelist silently drops anything new in public/ -- it dropped the whole
// generated favicon set, which then 404'd while the link tags pointed at it.
// Host rule files are handled separately below; Next's internal build
// metadata is not served.
const ROOT_SKIP = new Set([
  'docs',              // already copied above
  '_redirects', '_headers', // belong at the output root, not under /docs
]);
// Next emits both 404.html and an app-router _not-found route. Static hosts
// serve 404.html; shipping _not-found too would expose a thin, real URL at
// /docs/_not-found that returns 200.
const IS_BUILD_META = (n) => n.startsWith('__next.') || n.startsWith('_not-found');

for (const e of fs.readdirSync(OUT, { withFileTypes: true })) {
  if (ROOT_SKIP.has(e.name) || IS_BUILD_META(e.name)) continue;
  fs.cpSync(path.join(OUT, e.name), path.join(DOCS, e.name), { recursive: true });
}

// Host rule files are read from the output ROOT, not from /docs.
for (const entry of ['_redirects', '_headers']) {
  const src = path.join(OUT, entry);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(DIST, entry));
}

// Both Vercel and Cloudflare Pages serve a custom 404 only from the OUTPUT
// ROOT, and the root holds just docs/ plus the rule files -- so the branded
// page built at docs/404.html was never reached and Vercel's generic black
// 404 showed instead. Its assets are referenced as /docs/_next/... via
// assetPrefix, so the same file renders correctly from either location.
const notFound = path.join(DOCS, '404.html');
if (fs.existsSync(notFound)) fs.copyFileSync(notFound, path.join(DIST, '404.html'));

// Mintlify serves every page's markdown at /docs/<slug>.md. Next can only
// emit that route as /llms.mdx/<slug>/content.md, so the file is copied to
// the Mintlify path as well. Doing it here rather than with a host rewrite
// keeps the two hosts identical and costs no route-table entries.
let mirrors = 0;
const LLMS = path.join(DOCS, 'llms.mdx');
if (fs.existsSync(LLMS)) {
  (function mirror(dir, slug) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) { mirror(path.join(dir, e.name), [...slug, e.name]); continue; }
      if (e.name !== 'content.md' || slug.length === 0) continue;
      const dest = path.join(DOCS, ...slug.slice(0, -1), `${slug.at(-1)}.md`);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(dir, e.name), dest);
      mirrors++;
    }
  })(LLMS, []);
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
  'docs/favicon.png', 'docs/favicon.ico', 'docs/favicon-32x32.png',
  'docs/apple-touch-icon.png', 'docs/android-chrome-192x192.png',
  '_redirects', 'docs/llms.txt', 'docs/llms-full.txt', 'docs/og',
  '404.html', 'docs/api/search'];
const missing = REQUIRED.filter((r) => !fs.existsSync(path.join(DIST, r)));

const count = (d) => fs.readdirSync(d, { withFileTypes: true })
  .reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);

console.log(`dist/ files: ${count(DIST)} (${mirrors} .md mirrors, pruned ${pruned} junk files)`);
if (missing.length) {
  console.error(`MISSING from dist: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('all required top-level entries present');
console.log('\nDeploy: site/dist is the output root; pages live at /docs/*.');
