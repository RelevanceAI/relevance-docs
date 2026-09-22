/**
 * URL parity gate.
 *
 * 289 URLs are indexed on the live Mintlify site. Any one of them that the
 * new build does not emit is a 404 and a lost search ranking, so this must
 * report zero missing before cutover.
 *
 *   node site/tools/check-parity.mjs [path/to/live-sitemap.xml]
 *
 * With no argument it fetches the live sitemap. Exits non-zero on any miss.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'site/out');

async function liveUrls(src) {
  let xml;
  if (src && fs.existsSync(src)) {
    xml = fs.readFileSync(src, 'utf8');
  } else {
    const res = await fetch('https://relevanceai.com/docs/sitemap.xml');
    if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
    xml = await res.text();
  }
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace('https://relevanceai.com', ''));
  if (urls.length < 100) {
    throw new Error(`only ${urls.length} URLs parsed from the sitemap -- refusing to pass on a bad fetch`);
  }
  return new Set(urls);
}

function builtUrls() {
  const out = new Set();
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) {
        // out/ is the /docs tree, so the public URL is /docs + this path.
        out.add(p.slice(OUT.length).replace(/\.html$/, ''));
      }
    }
  };
  walk(path.join(OUT, 'docs'));
  return out;
}

const live = await liveUrls(process.argv[2]);
const built = builtUrls();
const missing = [...live].filter((u) => !built.has(u)).sort();
const extra = [...built].filter((u) => !live.has(u)).sort();

console.log(`live sitemap : ${live.size}`);
console.log(`built pages  : ${built.size}`);
console.log(`missing      : ${missing.length}`);
console.log(`extra        : ${extra.length}  (orphans Mintlify also serves)`);

if (missing.length) {
  console.error('\nMISSING URLs -- these would 404 after cutover:');
  for (const m of missing) console.error(`  ${m}`);
  process.exit(1);
}
console.log('\nPARITY OK: every indexed URL is present in the build.');
