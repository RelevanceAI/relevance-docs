/**
 * Nav coverage gate.
 *
 * Every page docs.json lists must appear in the generated meta.json tree.
 * A page can build, be linked from elsewhere and pass every other gate while
 * being invisible in the sidebar -- which is what happened when single-page
 * groups folded into a directory named after the page and silently dropped
 * 7 pages from the nav.
 *
 * gen-nav writes each entry relative to the directory holding the meta.json,
 * so a page `a/b/c` is listed as `c` in a/b/meta.json, `b/c` in a/meta.json,
 * or `a/b/c` at the root. This checks all of those.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const DOCS = path.join(ROOT, 'site/content/docs');
const docsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs.json'), 'utf8'));

const wanted = new Set();
(function walk(o) {
  if (typeof o === 'string') { wanted.add(o); return; }
  if (Array.isArray(o)) { o.forEach(walk); return; }
  if (o && typeof o === 'object') {
    for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v);
  }
})(docsJson.navigation.products ?? []);

const metaCache = new Map();
const entriesOf = (dir) => {
  if (!metaCache.has(dir)) {
    const f = path.join(DOCS, dir, 'meta.json');
    metaCache.set(dir, fs.existsSync(f)
      ? new Set((JSON.parse(fs.readFileSync(f, 'utf8')).pages ?? []).filter((p) => !p.startsWith('---')))
      : new Set());
  }
  return metaCache.get(dir);
};

const listed = (slug) => {
  const parts = slug.split('/');
  for (let i = parts.length - 1; i >= 0; i--) {
    const dir = parts.slice(0, i).join('/');
    const rest = parts.slice(i).join('/');
    if (entriesOf(dir).has(rest)) return true;
    // A folder's own page is listed as `index` inside that folder.
    if (rest === '' && entriesOf(slug).has('index')) return true;
  }
  return entriesOf(slug).has('index');
};

const onDisk = (p) =>
  fs.existsSync(path.join(DOCS, `${p}.mdx`)) || fs.existsSync(path.join(DOCS, p, 'index.mdx'));

const missing = [...wanted].filter((p) => onDisk(p) && !listed(p)).sort();
const gone = [...wanted].filter((p) => !onDisk(p)).sort();

const shadowed = [];
(function findShadows(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const sub = path.join(dir, e.name);
    if (fs.existsSync(`${sub}.mdx`)) shadowed.push(path.relative(DOCS, sub));
    findShadows(sub);
  }
})(DOCS);

console.log(`docs.json nav pages  : ${wanted.size}`);
console.log(`listed in meta tree  : ${wanted.size - missing.length - gone.length}`);
console.log(`missing from nav     : ${missing.length}`);
console.log(`listed but no file   : ${gone.length}`);
console.log(`shadowed by a folder : ${shadowed.length}`);

if (missing.length) {
  console.error('\nIn docs.json but absent from the generated nav:');
  for (const m of missing) console.error(`  ${m}`);
}
for (const g of gone) console.error(`  NO FILE: ${g}`);
for (const s of shadowed) console.error(`  SHADOWED: ${s}/ hides ${s}.mdx`);
if (missing.length || shadowed.length || gone.length) process.exit(1);
console.log('\nNAV OK: every docs.json page is listed in the sidebar tree.');
