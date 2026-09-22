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

/**
 * A lazy <img> with no width/height is 0px tall until it loads, so the page
 * below it jumps when it arrives -- 649px on /get-started/chat/super-gtm/skills
 * -- and a heading linked to from elsewhere is scrolled to the wrong place.
 * Markdown images get their size from fumadocs; the raw ones get it here:
 * from the manifest when the image was re-encoded, else from the file.
 */
const PUBLIC = path.resolve(process.cwd(), 'public');
function sizeOf(url) {
  if (manifest[url]?.width) return manifest[url];
  let b;
  try { b = fs.readFileSync(path.join(PUBLIC, url)); } catch { return undefined; }
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.length > 10 && b.toString('ascii', 0, 3) === 'GIF') return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (kind === 'VP8L') { const v = b.readUInt32LE(21); return { width: 1 + (v & 0x3fff), height: 1 + ((v >> 14) & 0x3fff) }; }
    if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return undefined;
}

/**
 * An <iframe> with no accessible name is a serious axe failure: a screen
 * reader announces "frame" and nothing else. 22 embeds across 16 pages had
 * none. Most sit inside a <Frame caption="...">, which describes them
 * exactly -- so the caption becomes the name, and the embed host supplies a
 * fallback for the rest.
 */
const EMBED_NAMES = [
  [/wistia|loom|youtube|vimeo|embedly/, 'Video'],
  [/supademo/, 'Interactive walkthrough'],
  [/app\.relevanceai\.com/, 'Relevance AI tool'],
];

function frameTitle(src) {
  const name = EMBED_NAMES.find(([re]) => re.test(src ?? ''))?.[1];
  return name ? `${name} embed` : 'Embedded content';
}

const attr = (node, name) =>
  node.attributes?.find((a) => a.type === 'mdxJsxAttribute' && a.name === name)?.value;

function visitJsx(node, caption) {
  if (!Array.isArray(node.attributes)) return;
  const original = node.name === 'img' ? attr(node, 'src') : undefined;
  for (const a of node.attributes) {
    if (a.type !== 'mdxJsxAttribute') continue;
    if (a.name === 'src' || a.name === 'poster') a.value = rewrite(a.value);
  }
  const push = (name, value) => {
    if (!node.attributes.some((a) => a.type === 'mdxJsxAttribute' && a.name === name)) {
      node.attributes.push({ type: 'mdxJsxAttribute', name, value });
    }
  };
  if (node.name === 'img') {
    for (const [name, value] of Object.entries(LAZY)) push(name, value);
    if (typeof original === 'string' && !attr(node, 'width') && !attr(node, 'height')) {
      const bare = original.startsWith(`${BASE}/`) ? original.slice(BASE.length) : original;
      const dim = ASSET.test(bare) ? sizeOf(bare) : undefined;
      if (dim?.width && dim?.height) { push('width', String(dim.width)); push('height', String(dim.height)); }
    }
  } else if (node.name === 'iframe') {
    push('title', typeof caption === 'string' && caption.trim()
      ? caption.trim()
      : frameTitle(attr(node, 'src')));
  }
}

function visitElement(node, caption) {
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
  if (node.tagName === 'iframe' && !p.title) {
    p.title = typeof caption === 'string' && caption.trim() ? caption.trim() : frameTitle(p.src);
  }
}

export function rehypeAssetBase() {
  return (tree) => {
    // `caption` carries the nearest enclosing <Frame caption="...">, which is
    // what an embed inside one should be announced as.
    const walk = (node, caption) => {
      if (!node || typeof node !== 'object') return;
      const isJsx = node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
      if (isJsx) visitJsx(node, caption);
      else if (node.properties) visitElement(node, caption);

      const inherited = isJsx && node.name === 'Frame'
        ? (attr(node, 'caption') ?? caption)
        : caption;
      for (const c of node.children ?? []) walk(c, inherited);
    };
    walk(tree, undefined);
  };
}
