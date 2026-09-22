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

/*
 * `depth` mirrors how Mintlify draws docs.json:
 *   0  a tab (or a product with no tabs)  -> a fumadocs root folder
 *   1  a group directly inside a tab      -> a section: heading + pages, ALWAYS open
 *   2+ a group nested inside a group      -> a collapsible folder, when foldable
 *
 * Depth 1 used to fold like any other group, so "Core Concepts", "Chat" and
 * the rest rendered as collapsed folders where Mintlify shows a bold heading
 * with every page listed beneath it.
 */
/*
 * A nested group is a collapsible folder in Mintlify whatever its pages look
 * like. Fumadocs folders are directories, so two sibling groups whose pages
 * share one directory -- Popular Integrations' six, all in
 * popular-integrations/ -- cannot each be one: they merged into a single
 * folder named after the last ("Developer", 34 pages). Those, and nested
 * groups that fold nowhere, are written as a run between
 * `---@group:Label---` and `---@end---`, which lib/source.ts turns into a
 * folder of its own.
 */
const GROUP_OPEN = (label) => `---@group:${label}---`;
const GROUP_CLOSE = '---@end---';
function sharedPrefixes(items) {
  const seen = new Map();
  for (const c of items) {
    if (c.slug) continue;
    const sl = slugsOf(c);
    if (!sl.length) continue;
    const pre = commonPrefix(sl);
    seen.set(pre, (seen.get(pre) ?? 0) + 1);
  }
  return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
}

function place(node, dir, depth = 0, shared = new Set()) {
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

  if (depth === 1) {
    if (node.label) ensure(dir).pages.push(`---${node.label}---`);
    const sh = sharedPrefixes(node.items);
    node.items.forEach((c) => place(c, dir, 2, sh));
  } else if (depth >= 2 && node.label && (!foldable || shared.has(prefix))) {
    ensure(dir).pages.push(GROUP_OPEN(node.label));
    const sh = sharedPrefixes(node.items);
    node.items.forEach((c) => place(c, dir, depth + 1, sh));
    ensure(dir).pages.push(GROUP_CLOSE);
  } else if (foldable) {
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
    if (depth === 0) ensure(prefix).root = true;
    const sh = sharedPrefixes(node.items);
    node.items.forEach((c) => place(c, prefix, depth + 1, sh));
  } else {
    if (node.label) ensure(dir).pages.push(`---${node.label}---`);
    const sh = sharedPrefixes(node.items);
    node.items.forEach((c) => place(c, dir, depth + 1, sh));
  }
}

tree.forEach((n) => place(n, '', 0));

// Global anchors are NOT written into the tree: components/site/global-anchors
// renders them above every tab's sidebar, as Mintlify does. Listing their
// pages here (community, changelog) put them under no tab, so they opened with
// no tab row; left out, lib/source.ts files them into a tab as Mintlify does.

let written = 0;
const writtenFiles = new Set();
for (const [dir, cfg] of dirs) {
  const meta = {};
  if (cfg.title) meta.title = cfg.title;
  if (cfg.root) meta.root = true;
  // Dedupe pages, never separators: every `---@end---` closes its own group.
  const seenPages = new Set();
  meta.pages = cfg.pages.filter((p) => p.startsWith('---') || (seenPages.has(p) ? false : seenPages.add(p)));
  const f = path.join(DOCS, dir, 'meta.json');
  // Never write through a symlink into the source tree -- meta.json belongs to
  // the app, so materialise the directory locally when the target is linked.
  const parent = path.dirname(f);
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
  fs.writeFileSync(f, JSON.stringify(meta, null, 2) + '\n');
  writtenFiles.add(f);
  written++;
}

/*
 * Remove every meta.json this run did not write. They are all generated, so a
 * leftover is a folder docs.json no longer describes -- inert while nothing
 * references it, and silently back in the sidebar with a stale title and page
 * list the moment something does. The tree is then a pure function of
 * docs.json.
 */
let removed = 0;
(function sweep(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory() && !e.isSymbolicLink()) sweep(p);
    else if (e.name === 'meta.json' && !writtenFiles.has(p)) { fs.unlinkSync(p); removed++; }
  }
})(DOCS);

const leaves = [...dirs.values()].reduce(
  (a, c) => a + c.pages.filter((p) => !p.startsWith('---')).length, 0);
console.log(`meta.json written : ${written}`);
console.log(`meta.json removed : ${removed}`);
console.log(`nav entries       : ${leaves}`);
