/**
 * Stages the prototype content and its images into both prototypes.
 *
 * The staged copies are derived, not source -- they are gitignored, because
 * committing them would add ~42 MB of duplicated images to a repo whose
 * history is already 256 MB. Run this after cloning, before building.
 *
 *   node prototypes/tools/setup.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const PROTO = path.join(ROOT, 'prototypes');

const copyTree = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name);
    const d = path.join(to, e.name);
    if (e.isDirectory()) copyTree(s, d);
    else fs.copyFileSync(s, d);
  }
};

const targets = [
  { name: 'starlight', docs: 'starlight/src/content/docs', snippets: 'starlight/src/content/_snippets', pub: 'starlight/public' },
  { name: 'fumadocs',  docs: 'fumadocs/content/docs',      snippets: 'fumadocs/content/_snippets',      pub: 'fumadocs/public'  },
];

// Every image referenced by the staged pages and snippets.
const referenced = new Set(['/images/logo/light.png', '/images/logo/dark.png']);
const scan = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { scan(p); continue; }
    if (!e.name.endsWith('.mdx')) continue;
    const t = fs.readFileSync(p, 'utf8');
    for (const m of [...t.matchAll(/\((\/images\/[^)\s]+)/g), ...t.matchAll(/src="(\/images\/[^"]+)"/g)]) {
      referenced.add(m[1]);
    }
  }
};
scan(path.join(PROTO, '_content'));

for (const t of targets) {
  const docsDir = path.join(PROTO, t.docs);
  const snipDir = path.join(PROTO, t.snippets);
  fs.rmSync(docsDir, { recursive: true, force: true });
  fs.rmSync(snipDir, { recursive: true, force: true });
  copyTree(path.join(PROTO, '_content'), docsDir);
  // _snippets is not a page collection -- move it beside docs, not inside.
  fs.renameSync(path.join(docsDir, '_snippets'), snipDir);

  let n = 0;
  for (const img of referenced) {
    const src = path.join(ROOT, img.replace(/^\//, ''));
    if (!fs.existsSync(src)) continue;
    const dst = path.join(PROTO, t.pub, img.replace(/^\//, ''));
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    n++;
  }
  fs.copyFileSync(path.join(ROOT, 'favicon.png'), path.join(PROTO, t.pub, 'favicon.png'));
  console.log(`${t.name}: staged ${fs.readdirSync(docsDir).length} top-level entries, ${n} images`);
}
