/**
 * Last word on asset URLs: applies the `/docs` base, swaps in the optimized
 * WebP, and makes sure nothing loads eagerly.
 *
 * Why rehype and not remark: fumadocs appends its own `remarkImage` AFTER
 * any user-supplied remark plugins, and that plugin rewrites image `src`
 * from the node's original URL -- discarding a prefix applied earlier in the
 * remark phase. 396 markdown images came out as `/images/...` and 404'd.
 * rehype runs after every remark plugin. Links stay in remark-base-path:
 * they are not touched by remarkImage and are already correct there.
 *
 * Two node shapes have to be handled. A markdown image is a hast element
 * with `properties`, and its src has not been prefixed yet. A raw <img>
 * written in MDX stays an MDX JSX node the whole way through -- it never
 * becomes a hast element and never passes through the component map -- so
 * its attributes live in `node.attributes` and remark-base-path has already
 * prefixed its src.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * Written by tools/optimize-images.mjs, which `npm run build` runs first.
 * If it is missing the pages simply keep pointing at the original files --
 * correct, just heavy -- rather than failing the build.
 */
// Resolved from the working directory, not import.meta.dirname: this module
// is bundled into the MDX loader and its own path is not stable there.
const MANIFEST = path.resolve(process.cwd(), 'lib/image-manifest.json');
const manifest = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  : (console.warn('[rehype-asset-base] no image manifest -- serving full-size images'), {});

const BASE = '/docs';
const ASSET = /^\/(images|videos)\//;

/**
 * Screenshots are stored at capture resolution (up to 4116px wide, 4.2 MB).
 * Mintlify hid that behind a resizing CDN; tools/optimize-images.mjs
 * replaces it, and this is where a page starts pointing at the result.
 */
const optimized = (url) => manifest[url]?.src ?? url;

const rewrite = (v) => {
  if (typeof v !== 'string') return v;
  if (v.startsWith(`${BASE}/`)) {
    const bare = v.slice(BASE.length);
    return ASSET.test(bare) ? `${BASE}${optimized(bare)}` : v;
  }
  return ASSET.test(v) ? `${BASE}${optimized(v)}` : v;
};

/**
 * React emits `<link rel="preload" as="image">` for any <img> that is not
 * lazy, and Next's route prefetch then runs those preloads for pages the
 * reader never opens: /docs/build/introduction pulled 12 MB of the Invent
 * page's screenshots that way. None of the 65 raw <img> tags in the content
 * carried a loading attribute.
 */
const LAZY = { loading: 'lazy', decoding: 'async' };

function visitJsx(node) {
  if (!Array.isArray(node.attributes)) return;
  const isImage = node.name === 'img';
  for (const attr of node.attributes) {
    if (attr.type !== 'mdxJsxAttribute') continue;
    if (attr.name === 'src' || attr.name === 'poster') attr.value = rewrite(attr.value);
  }
  if (!isImage) return;
  for (const [name, value] of Object.entries(LAZY)) {
    if (!node.attributes.some((a) => a.type === 'mdxJsxAttribute' && a.name === name)) {
      node.attributes.push({ type: 'mdxJsxAttribute', name, value });
    }
  }
}

function visitElement(node) {
  const p = node.properties;
  for (const key of ['src', 'poster']) {
    if (typeof p[key] === 'string') p[key] = rewrite(p[key]);
  }
  if (typeof p.srcSet === 'string') {
    p.srcSet = p.srcSet.split(',').map((part) => {
      const [u, ...rest] = part.trim().split(/\s+/);
      return [rewrite(u), ...rest].join(' ');
    }).join(', ');
  }
  if (node.tagName === 'img' && p.loading === undefined) {
    p.loading = 'lazy';
    p.decoding ??= 'async';
  }
}

export function rehypeAssetBase() {
  return (tree) => {
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') visitJsx(node);
      else if (node.properties) visitElement(node);
      for (const c of node.children ?? []) walk(c);
    };
    walk(tree);
  };
}
