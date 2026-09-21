/**
 * Internal link checker over the built output.
 *
 * Every internal href AND asset src in the built pages must resolve to a
 * built page, a file on disk, or a redirect rule. Mintlify tolerated dangling
 * links silently; this makes them visible.
 *
 * `src` is checked too: 396 markdown images once shipped without the /docs
 * prefix because fumadocs appends its own remarkImage after user plugins and
 * reset the URL. Every one of them 404'd and only a browser check caught it.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'site/out');

const pages = new Set();
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) {
      files.push(p);
      pages.add(p.slice(OUT.length).replace(/\.html$/, ''));
    }
  }
})(path.join(OUT, 'docs'));

// Redirect sources count as valid targets.
const redirects = [];
const rf = path.join(OUT, '_redirects');
if (fs.existsSync(rf)) {
  for (const line of fs.readFileSync(rf, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [from] = t.split(/\s+/);
    redirects.push(from);
  }
}
const matchesRedirect = (u) => redirects.some((r) =>
  r.endsWith('*') ? u.startsWith(r.slice(0, -1)) : r === u);

// Assets referenced as /docs/x live at out/x (assetPrefix), pages at out/docs/x.
const assetExists = (u) =>
  u.startsWith('/docs/') && fs.existsSync(path.join(OUT, u.slice('/docs/'.length)));

const broken = new Map();
let checked = 0;

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const from = f.slice(OUT.length).replace(/\.html$/, '');
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const url = m[1].replace(/\/$/, '') || '/';
    // `//host/path` is protocol-relative, i.e. external, despite the leading slash.
    if (url.startsWith('//')) continue;
    if (url.startsWith('/docs/_next') || url.startsWith('/_next')) continue;
    checked++;
    if (pages.has(url) || matchesRedirect(url) || assetExists(url)) continue;
    if (!broken.has(url)) broken.set(url, new Set());
    broken.get(url).add(from);
  }
}

console.log(`pages scanned  : ${files.length}`);
console.log(`links checked  : ${checked}`);
console.log(`broken targets : ${broken.size}`);
if (broken.size) {
  const sorted = [...broken.entries()].sort((a, b) => b[1].size - a[1].size);
  console.log('\nBroken internal links (target <- number of pages linking to it):');
  for (const [url, srcs] of sorted.slice(0, 30)) {
    console.log(`  ${url}  <- ${srcs.size}  e.g. ${[...srcs][0]}`);
  }
  if (sorted.length > 30) console.log(`  ... and ${sorted.length - 30} more`);
}
