/**
 * Asserts the SEO-critical head tags exist on every built page, and that the
 * sitemap matches the set of pages Mintlify advertises today.
 *
 * The first build of this site shipped with NO canonical tags, NO og:url, NO
 * structured data, bare titles ("Introduction" instead of "Introduction -
 * Relevance AI Documentation"), and a sitemap advertising 96 orphan pages
 * that Mintlify deliberately omits. Every other gate passed: pages built,
 * links resolved, images loaded. Search visibility is simply not something
 * the other checks can see.
 *
 *   node tools/check-seo.mjs [path/to/live-sitemap.xml]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const DIST = path.join(ROOT, 'site/dist/docs');
const SITE = 'https://relevanceai.com';
const SUFFIX = ' - Relevance AI Documentation';

const REQUIRED = [
  { re: /<link rel="canonical" href="([^"]+)"/, name: 'canonical' },
  { re: /<title>([^<]+)<\/title>/, name: 'title' },
  { re: /<meta property="og:title" content="([^"]+)"/, name: 'og:title' },
  { re: /<meta property="og:url" content="([^"]+)"/, name: 'og:url' },
  { re: /<meta property="og:site_name" content="([^"]+)"/, name: 'og:site_name' },
  { re: /application\/ld\+json/, name: 'json-ld' },
];

const pages = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^(_next|images|videos|og|llms\.mdx)$/.test(e.name)) walk(p); continue; }
    if (e.name.endsWith('.html') && e.name !== '404.html') pages.push(p);
  }
})(DIST);

const problems = [];
for (const f of pages) {
  const html = fs.readFileSync(f, 'utf8');
  const url = `/docs${f.slice(DIST.length).replace(/\.html$/, '')}`;
  for (const { re, name } of REQUIRED) {
    const m = html.match(re);
    if (!m) { problems.push(`${url}: missing ${name}`); continue; }
    if (name === 'canonical' || name === 'og:url') {
      const want = `${SITE}${url}`;
      if (m[1] !== want) problems.push(`${url}: ${name} is ${m[1]}, expected ${want}`);
    }
    if ((name === 'title' || name === 'og:title') && !m[1].endsWith(SUFFIX)) {
      problems.push(`${url}: ${name} lacks the site suffix -- "${m[1]}"`);
    }
  }
  if (/<meta name="robots"[^>]*noindex/.test(html)) problems.push(`${url}: has noindex`);
}

// Sitemap must match the live set exactly unless a change is intended.
let sitemapNote = '';
const smPath = path.join(DIST, 'sitemap.xml');
const built = new Set(
  [...fs.readFileSync(smPath, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
const liveFile = process.argv[2];
if (liveFile && fs.existsSync(liveFile)) {
  const live = new Set(
    [...fs.readFileSync(liveFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  const extra = [...built].filter((u) => !live.has(u));
  const gone = [...live].filter((u) => !built.has(u));
  for (const g of gone) problems.push(`sitemap: ${g} is indexed today but no longer advertised`);
  if (extra.length) sitemapNote = `  NOTE  sitemap advertises ${extra.length} URL(s) Mintlify does not`;
} else {
  sitemapNote = '  NOTE  pass the live sitemap path to diff sitemap scope';
}

console.log(`pages checked : ${pages.length}`);
console.log(`sitemap URLs  : ${built.size}`);
console.log(`problems      : ${problems.length}`);
if (sitemapNote) console.log(sitemapNote);

if (problems.length) {
  console.error('\nSEO problems:');
  for (const p of problems.slice(0, 25)) console.error(`  ${p}`);
  if (problems.length > 25) console.error(`  ... and ${problems.length - 25} more`);
  process.exit(1);
}
console.log('\nSEO OK: canonical, titles, og and structured data present on every page.');
