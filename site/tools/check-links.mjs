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
const brokenFragments = new Map();
let checked = 0;
let fragmentsChecked = 0;

// Every id on each page, so a #fragment can be resolved rather than skipped.
// A link to a heading that no longer exists is invisible in a browser: the
// page loads and quietly stays at the top.
const idsByPage = new Map();
const htmlByPage = new Map();
for (const f of files) {
  const url = f.slice(OUT.length).replace(/\.html$/, '');
  const html = fs.readFileSync(f, 'utf8');
  htmlByPage.set(url, html);
  idsByPage.set(url, new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'))));
}

for (const [from, html] of htmlByPage) {
  for (const m of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
    const raw = m[1];
    if (!raw.startsWith('/') && !raw.startsWith('#')) continue;
    // `//host/path` is protocol-relative, i.e. external, despite the leading slash.
    if (raw.startsWith('//')) continue;

    const hash = raw.indexOf('#');
    // Both sides go through the same decoding: ids and hrefs are HTML-escaped
    // in the source, so `#a-&amp;-b` and id="a-&amp;-b" are the same anchor.
    const fragment = hash === -1 ? ''
      : decodeURIComponent(raw.slice(hash + 1)).replace(/&amp;/g, '&');
    let url = (hash === -1 ? raw : raw.slice(0, hash)).split('?')[0];
    url = url.replace(/\/$/, '');

    if (url && !url.startsWith('/docs/_next') && !url.startsWith('/_next')) {
      checked++;
      if (!pages.has(url) && !matchesRedirect(url) && !assetExists(url)) {
        if (!broken.has(url)) broken.set(url, new Set());
        broken.get(url).add(from);
        continue;
      }
    }

    if (!fragment) continue;
    const target = url || from;
    const ids = idsByPage.get(target);
    // Only pages we built can be checked; a fragment behind a redirect is not.
    if (!ids) continue;
    fragmentsChecked++;
    if (ids.has(fragment)) continue;
    const key = `${target}#${fragment}`;
    if (!brokenFragments.has(key)) brokenFragments.set(key, new Set());
    brokenFragments.get(key).add(from);
  }
}

const report = (label, map) => {
  if (!map.size) return;
  const sorted = [...map.entries()].sort((a, b) => b[1].size - a[1].size);
  console.error(`\n${label} (target <- number of pages linking to it):`);
  for (const [url, srcs] of sorted.slice(0, 30)) {
    console.error(`  ${url}  <- ${srcs.size}  e.g. ${[...srcs][0]}`);
  }
  if (sorted.length > 30) console.error(`  ... and ${sorted.length - 30} more`);
};

console.log(`pages scanned  : ${files.length}`);
console.log(`links checked  : ${checked}`);
console.log(`fragments      : ${fragmentsChecked}`);
console.log(`broken targets : ${broken.size}`);
console.log(`broken anchors : ${brokenFragments.size}`);
report('Broken internal links', broken);
report('Links to anchors that do not exist', brokenFragments);
if (broken.size || brokenFragments.size) process.exit(1);
console.log('\nLINKS OK: every internal link, asset and anchor resolves.');
