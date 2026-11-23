/**
 * Builds a Font Awesome subset containing only the icons this site uses.
 *
 * The page currently loads `all.min.css` from cdnjs -- a render-blocking
 * cross-origin stylesheet (18 KB on the wire) that pulls fa-solid-900.woff2
 * (158 KB). Of its 1,976 glyphs the docs use about 300, and the CSS carries
 * 1,848 class rules for icons that never appear. Blocking it measured FCP
 * 1,120 -> 536 ms on Slow 4G.
 *
 * The output also fixes a correctness bug. components/mintlify's Icon always
 * emitted `fa-solid`, so a brands-only glyph -- `icon="slack"` -- asked the
 * solid font for a codepoint it does not have and rendered an empty box.
 * Here each rule names its own font-family, so the family follows the icon
 * and no class on the element has to be right.
 *
 * Run: node tools/build-icon-font.mjs   (writes public/fonts + app/icons.css)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const VERSION = '6.7.2';
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/${VERSION}`;
const CACHE = path.join(ROOT, 'node_modules/.cache/fontawesome');
const FONTS_OUT = path.join(ROOT, 'public/fonts');
const CSS_OUT = path.join(ROOT, 'app/icons.css');

// Free has three faces. Order matters: a codepoint present in more than one
// should come from the face Font Awesome itself would use.
const FACES = [
  { id: 'solid', file: 'fa-solid-900', family: 'FA Solid', weight: 900 },
  { id: 'brands', file: 'fa-brands-400', family: 'FA Brands', weight: 400 },
  { id: 'regular', file: 'fa-regular-400', family: 'FA Regular', weight: 400 },
];

fs.mkdirSync(CACHE, { recursive: true });
async function cached(name, url) {
  const f = path.join(CACHE, name);
  if (!fs.existsSync(f)) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url} -> ${r.status}`);
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  }
  return f;
}

const cssFile = await cached(`all-${VERSION}.css`, `${CDN}/css/all.min.css`);
const css = fs.readFileSync(cssFile, 'utf8');

/**
 * Every icon name Font Awesome defines, with its codepoint. 6.7 declares
 * these as custom properties on grouped selectors -- `.fa-user-times,
 * .fa-user-xmark{--fa:"\f235"}` -- so aliases share one rule.
 */
const codepoints = new Map();
for (const m of css.matchAll(/((?:\.fa-[a-z0-9-]+,)*\.fa-[a-z0-9-]+)\{--fa:"\\([0-9a-f]+)"/g)) {
  const cp = parseInt(m[2], 16);
  for (const sel of m[1].split(',')) codepoints.set(sel.trim().slice('.fa-'.length), cp);
}

/** Which faces actually contain each codepoint. */
const coverage = new Map();
for (const face of FACES) {
  const file = await cached(`${face.file}.woff2`, `${CDN}/webfonts/${face.file}.woff2`);
  face.path = file;
  const out = execFileSync('python3', ['-c', `
from fontTools.ttLib import TTFont
print(' '.join(str(c) for c in TTFont(${JSON.stringify(file)}).getBestCmap()))
`], { encoding: 'utf8' });
  face.cmap = new Set(out.trim().split(/\s+/).map(Number));
  coverage.set(face.id, face.cmap);
}

/** Every icon name the site can render. */
const used = new Set();
const add = (n) => { if (n) used.add(n); };

(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(mdx|tsx|ts)$/.test(e.name)) continue;
    const t = fs.readFileSync(p, 'utf8');
    for (const m of t.matchAll(/icon=\{?"([^"]+)"/g)) add(m[1]);
    for (const m of t.matchAll(/\bfa-([a-z0-9-]+)\b/g)) add(m[1]);
  }
})(path.join(ROOT, 'content'));
for (const dir of ['components', 'app', 'lib']) {
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(tsx|ts|css)$/.test(e.name)) continue;
      const t = fs.readFileSync(p, 'utf8');
      for (const m of t.matchAll(/icon=\{?"([^"]+)"/g)) add(m[1]);
      for (const m of t.matchAll(/'([a-z0-9-]+)',?\s*$/gm)) void m;
    }
  })(path.join(ROOT, dir));
}
// docs.json declares icons too -- one per product (the navbar switcher) and
// one per global anchor (the links pinned above the sidebar). Neither appears
// in any .mdx or component source, so without this `sparkles` shipped blank.
(function walk(n) {
  if (Array.isArray(n)) return n.forEach(walk);
  if (n && typeof n === 'object') {
    if (typeof n.icon === 'string') add(n.icon);
    Object.values(n).forEach(walk);
  }
})(JSON.parse(fs.readFileSync(path.join(ROOT, '..', 'docs.json'), 'utf8')).navigation);
// ...and `footer.socials` names its brand icons by key: { "github": url }.
for (const key of Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, '..', 'docs.json'), 'utf8')).footer?.socials ?? {})) add(key);
// The callout glyphs are chosen in code, by variant.
const shim = fs.readFileSync(path.join(ROOT, 'components/mintlify/index.tsx'), 'utf8');
const calloutBlock = shim.slice(shim.indexOf('const CALLOUT_ICON'), shim.indexOf('export function Callout'));
for (const m of calloutBlock.matchAll(/'([a-z0-9-]+)'/g)) add(m[1]);

// Pro names are remapped to their Free equivalents before rendering.
const proBlock = shim.slice(shim.indexOf('const PRO_TO_FREE'), shim.indexOf('export function Icon'));
const pro = new Map([...proBlock.matchAll(/'?([a-z0-9-]+)'?:\s*'([a-z0-9-]+)'/g)].map((m) => [m[1], m[2]]));

const resolved = new Set();
for (const name of used) {
  const target = pro.get(name) ?? name;
  if (codepoints.has(target)) resolved.add(target);
}

/** Assign each icon to the face that actually has its glyph. */
const perFace = new Map(FACES.map((f) => [f.id, new Set()]));
const rules = [];
const unresolved = [];
for (const name of [...resolved].sort()) {
  const cp = codepoints.get(name);
  const face = FACES.find((f) => f.cmap.has(cp));
  if (!face) { unresolved.push(name); continue; }
  perFace.get(face.id).add(cp);
  rules.push(`.fa-${name}::before{content:"\\${cp.toString(16)}";font-family:"${face.family}"}`);
}

fs.rmSync(FONTS_OUT, { recursive: true, force: true });
fs.mkdirSync(FONTS_OUT, { recursive: true });

const faceCss = [];
let before = 0, after = 0;
for (const face of FACES) {
  const cps = perFace.get(face.id);
  before += fs.statSync(face.path).size;
  if (!cps.size) continue;
  const out = path.join(FONTS_OUT, `${face.file}-subset.woff2`);
  execFileSync('pyftsubset', [
    face.path,
    `--unicodes=${[...cps].map((c) => `U+${c.toString(16)}`).join(',')}`,
    '--flavor=woff2',
    '--layout-features=',
    '--no-hinting',
    '--desubroutinize',
    `--output-file=${out}`,
  ]);
  after += fs.statSync(out).size;
  faceCss.push(`@font-face{font-family:"${face.family}";font-style:normal;font-weight:${face.weight};` +
    `font-display:block;src:url("/docs/fonts/${face.file}-subset.woff2") format("woff2")}`);
}

const header = `/* Generated by site/tools/build-icon-font.mjs from Font Awesome Free ${VERSION}.
 * Do not edit. Font Awesome Free is CC BY 4.0 / SIL OFL 1.1 -- https://fontawesome.com/license/free
 *
 * Only the ${rules.length} icons this site renders are included, and each rule names
 * its own family so a brands glyph does not have to be tagged as one. */
`;
const base = `.rl-icon,.fa,.fas,.fab,.far,[class*=" fa-"],[class^="fa-"]{` +
  `-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;display:var(--fa-display,inline-block);` +
  `font-style:normal;font-variant:normal;line-height:1;text-rendering:auto}\n`;

fs.writeFileSync(CSS_OUT, `${header}${faceCss.join('\n')}\n${base}${rules.join('\n')}\n`);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`icon names in source : ${used.size}`);
console.log(`resolved to a glyph  : ${rules.length}`);
for (const f of FACES) console.log(`  ${f.id.padEnd(8)}: ${perFace.get(f.id).size}`);
if (unresolved.length) console.log(`no glyph in FA Free  : ${unresolved.length}  ${unresolved.join(', ')}`);
console.log(`webfonts             : ${kb(before)} -> ${kb(after)}`);
console.log(`stylesheet           : ${kb(fs.statSync(cssFile).size)} -> ${kb(fs.statSync(CSS_OUT).size)}`);
console.log(`\nwrote app/icons.css and public/fonts/`);
