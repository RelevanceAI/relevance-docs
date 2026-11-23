/**
 * Flags Font Awesome icon names that would render as a blank square.
 *
 * Mintlify bundles FA Pro; this build ships a subset of FA Free built by
 * tools/build-icon-font.mjs, plus the PRO_TO_FREE map in
 * components/mintlify/index.tsx. A name in neither renders as an empty box,
 * silently -- which is how `messages` (11 usages) shipped blank in the first
 * pass, and how the 11 brands glyphs shipped blank until the subset started
 * naming a font-family per icon.
 *
 * Checks the built stylesheet rather than the upstream CDN file: the subset
 * is what the browser actually gets, so it is the only thing worth
 * asserting against. Rebuild it after adding icons.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const ICONS_CSS = path.join(ROOT, 'site/app/icons.css');

if (!fs.existsSync(ICONS_CSS)) {
  console.error('site/app/icons.css is missing -- run `node site/tools/build-icon-font.mjs`');
  process.exit(2);
}
const css = fs.readFileSync(ICONS_CSS, 'utf8');
const shipped = new Set([...css.matchAll(/\.fa-([a-z0-9-]+)::before/g)].map((m) => m[1]));
const families = new Set([...css.matchAll(/font-family:"([^"]+)"/g)].map((m) => m[1]));

const shim = fs.readFileSync(path.join(ROOT, 'site/components/mintlify/index.tsx'), 'utf8');
const block = shim.slice(shim.indexOf('const PRO_TO_FREE'), shim.indexOf('export function Icon'));
const mapped = new Map([...block.matchAll(/'?([a-z0-9-]+)'?:\s*'([a-z0-9-]+)'/g)].map((m) => [m[1], m[2]]));

const used = new Map();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.name.endsWith('.mdx')) continue;
    for (const m of fs.readFileSync(p, 'utf8').matchAll(/icon=\{?"([^"]+)"/g)) {
      used.set(m[1], (used.get(m[1]) ?? 0) + 1);
    }
  }
})(path.join(ROOT, 'site/content'));

// Callout glyphs are chosen in code, not in the content.
const calloutBlock = shim.slice(shim.indexOf('const CALLOUT_ICON'), shim.indexOf('export function Callout'));
for (const m of calloutBlock.matchAll(/'([a-z0-9-]+)'/g)) {
  if (!used.has(m[1])) used.set(m[1], 1);
}

const blank = [];
const badTargets = [];
for (const [name, count] of used) {
  const target = mapped.get(name) ?? name;
  if (!shipped.has(target)) blank.push(`${name}${target === name ? '' : ` -> ${target}`} (${count} usages)`);
}
for (const [from, to] of mapped) if (!shipped.has(to)) badTargets.push(`${from} -> ${to}`);

// Every font the stylesheet names must actually be deployed.
const missingFonts = [...css.matchAll(/url\("\/docs\/fonts\/([^"]+)"\)/g)]
  .map((m) => m[1])
  .filter((f) => !fs.existsSync(path.join(ROOT, 'site/public/fonts', f)));

console.log(`icon names used   : ${used.size} (${[...used.values()].reduce((a, b) => a + b, 0)} usages)`);
console.log(`shipped in subset : ${shipped.size} across ${families.size} faces`);
console.log(`pro names mapped  : ${mapped.size}`);
console.log(`would render blank: ${blank.length}`);
console.log(`bad map targets   : ${badTargets.length}`);
console.log(`missing webfonts  : ${missingFonts.length}`);

if (blank.length || badTargets.length || missingFonts.length) {
  if (blank.length) console.error(`\nNo glyph shipped for:\n  ${blank.join('\n  ')}`);
  if (badTargets.length) console.error(`\nPRO_TO_FREE points at a name with no glyph:\n  ${badTargets.join('\n  ')}`);
  if (missingFonts.length) console.error(`\nStylesheet references fonts that are not in public/fonts:\n  ${missingFonts.join('\n  ')}`);
  console.error('\nRebuild with `node site/tools/build-icon-font.mjs`.');
  process.exit(1);
}
console.log('\nICONS OK: every icon resolves to a glyph in the shipped subset.');
