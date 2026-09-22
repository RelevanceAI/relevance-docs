/**
 * Projects Mintlify's docs.json navigation onto Fumadocs' meta.json layout.
 *
 * docs.json holds one arbitrarily-nested tree (products > tabs > groups >
 * pages). Fumadocs instead reads a meta.json per directory, so the tree has
 * to be mapped onto the folder structure. Without this it auto-generates nav
 * from folder names and loses docs.json's grouping and ordering entirely.
 *
 * Pages that exist but are absent from docs.json stay reachable at their URL
 * and are simply not listed -- matching Mintlify, where 87 such orphans are
 * served today.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const DOCS = path.join(ROOT, 'site/content/docs');
const docsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs.json'), 'utf8'));

// A page can live at `x.mdx` or, when a folder of the same name exists, at
// `x/index.mdx` -- Fumadocs serves both at /docs/x.
const exists = (slug) =>
  fs.existsSync(path.join(DOCS, `${slug}.mdx`)) ||
  fs.existsSync(path.join(DOCS, slug, 'index.mdx'));

/** Mintlify group node -> { label, items } */
function toTree(node) {
  if (typeof node === 'string') return exists(node) ? { slug: node } : null;
  if (Array.isArray(node)) return node.map(toTree).filter(Boolean);
  if (node && typeof node === 'object') {
    const label = node.group ?? node.tab ?? node.product ?? node.anchor;
    const kids = node.pages ?? node.groups ?? node.tabs;
    if (kids) {
      const items = [toTree(kids)].flat().filter(Boolean);
      if (!items.length) return null;
      return label ? { label, items } : items;
    }
  }
  return null;
}

const tree = (docsJson.navigation.products ?? [])
  .flatMap((p) => [toTree(p.tabs ?? p)].flat())
  .filter(Boolean);

// dir -> { pages: [], title }
const dirs = new Map();
const ensure = (d) => {
  if (!dirs.has(d)) dirs.set(d, { pages: [] });
  return dirs.get(d);
};

const slugsOf = (n) => {
  const out = [];
  const rec = (x) => { if (x?.slug) out.push(x.slug); else (x?.items ?? []).forEach(rec); };
  rec(n);
  return out;
};

/**
 * Longest common SEGMENT prefix of a set of slugs.
 *
 * Unlike a plain dirname-based prefix, a slug that IS the prefix counts as a
 * match -- `guides` alongside `guides/sales/x` folds into the `guides` folder
 * with `guides.mdx` as its index. Without this the whole Guides tab collapsed
 * into a flat separator list at the root.
 */
const commonPrefix = (slugs) => {
  const parts = slugs.map((s) => s.split('/'));
  let acc = parts[0] ?? [];
  for (const p of parts.slice(1)) {
    const out = [];
    for (let i = 0; i < Math.min(acc.length, p.length); i++) {
      if (acc[i] === p[i]) out.push(acc[i]); else break;
    }
    acc = out;
  }
  return acc.join('/');
};

function place(node, dir, isTab = false) {
  if (node.slug) {
    // A folder's own page is referenced as `index`, not as an empty string.
    const rel = path.posix.relative(dir, node.slug) || 'index';
    ensure(dir).pages.push(rel);
    return;
  }
  const slugs = slugsOf(node);
  if (!slugs.length) return;

  const prefix = commonPrefix(slugs);
  const deeper = prefix && prefix !== dir && prefix.startsWith(dir === '' ? '' : `${dir}/`);
  // At least one page must live strictly BELOW the prefix, otherwise the
  // prefix is the page itself and folding would create a directory named
  // after it -- which shadows the .mdx and drops the page from the sidebar
  // entirely. A single-page group is a separator, not a folder.
  const hasDescendant = slugs.some((s) => s.startsWith(`${prefix}/`));
  const foldable = deeper && hasDescendant &&
    slugs.every((s) => s === prefix || s.startsWith(`${prefix}/`));

  if (foldable) {
    ensure(dir).pages.push(path.posix.relative(dir, prefix));
    ensure(prefix).title = node.label;
    /*
     * Mark a TAB's folder as a fumadocs "root" folder.
     *
     * Fumadocs only forms a tab group for folders flagged root, so without
     * this the notebook layout has nothing to put in the navbar and silently
     * falls back to nesting every tab as a collapsible sidebar section --
     * which is exactly how the first cut of this site differed from Mintlify,
     * where these are a horizontal row across the top.
     *
     * Only top-level nodes get it: a group NESTED inside a tab is a sidebar
     * section in Mintlify too, and flagging those would scope the sidebar to
     * the subsection and hide its siblings.
     */
    if (isTab) ensure(prefix).root = true;
    node.items.forEach((c) => place(c, prefix));
  } else {
    if (node.label) ensure(dir).pages.push(`---${node.label}---`);
    node.items.forEach((c) => place(c, dir));
  }
}

tree.forEach((n) => place(n, '', true));

// Global anchors are top-level links alongside the tree.
for (const a of docsJson.navigation.global?.anchors ?? []) {
  const href = a.href.replace('https://relevanceai.com/docs', '');
  if (!href.startsWith('/')) continue;
  const slug = href.replace(/^\//, '');
  if (exists(slug)) ensure('').pages.push(slug);
}

let written = 0;
for (const [dir, cfg] of dirs) {
  const meta = {};
  if (cfg.title) meta.title = cfg.title;
  if (cfg.root) meta.root = true;
  meta.pages = [...new Set(cfg.pages)];
  const f = path.join(DOCS, dir, 'meta.json');
  // Never write through a symlink into the source tree -- meta.json belongs to
  // the app, so materialise the directory locally when the target is linked.
  const parent = path.dirname(f);
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
  fs.writeFileSync(f, JSON.stringify(meta, null, 2) + '\n');
  written++;
}

const leaves = [...dirs.values()].reduce(
  (a, c) => a + c.pages.filter((p) => !p.startsWith('---')).length, 0);
console.log(`meta.json written : ${written}`);
console.log(`nav entries       : ${leaves}`);
