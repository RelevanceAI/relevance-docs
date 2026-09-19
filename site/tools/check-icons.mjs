/**
 * Flags Font Awesome icon names that would render as a blank square.
 *
 * Mintlify bundles FA Pro; this build uses FA Free plus the PRO_TO_FREE map
 * in components/mintlify/index.tsx. Any name that is in neither renders as an
 * empty box -- silently, which is how `messages` (11 usages) shipped blank in
 * the first pass. Run after adding pages.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const FA_CSS = process.argv[2];

if (!FA_CSS || !fs.existsSync(FA_CSS)) {
  console.error('usage: node site/tools/check-icons.mjs <path-to-fontawesome-all.min.css>');
  console.error('  curl -sS https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css -o /tmp/fa.css');
  process.exit(2);
}

const free = new Set([...fs.readFileSync(FA_CSS, 'utf8').matchAll(/\.fa-([a-z0-9-]+)/g)].map((m) => m[1]));

const shim = fs.readFileSync(path.join(ROOT, 'site/components/mintlify/index.tsx'), 'utf8');
const block = shim.slice(shim.indexOf('const PRO_TO_FREE'), shim.indexOf('export function Icon'));
const mapped = new Map([...block.matchAll(/'?([a-z-]+)'?:\s*'([a-z-]+)'/g)].map((m) => [m[1], m[2]]));

const used = new Map();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.name.endsWith('.mdx')) continue;
    const t = fs.readFileSync(p, 'utf8');
    for (const m of t.matchAll(/icon=\{?"([^"]+)"/g)) {
      used.set(m[1], (used.get(m[1]) ?? 0) + 1);
    }
  }
})(path.join(ROOT, 'site/content'));

const blank = [];
for (const [name, n] of used) {
  const resolved = mapped.get(name) ?? name;
  if (!free.has(resolved)) blank.push([name, resolved, n]);
}

// A mapping that points at a name FA Free does not have is just as broken.
const badTargets = [...mapped.entries()].filter(([, to]) => !free.has(to));

console.log(`icon names used   : ${used.size} (${[...used.values()].reduce((a, b) => a + b, 0)} usages)`);
console.log(`pro names mapped  : ${mapped.size}`);
console.log(`would render blank: ${blank.length}`);
console.log(`bad map targets   : ${badTargets.length}`);

if (blank.length) {
  console.error('\nThese icons render as a blank square -- add them to PRO_TO_FREE:');
  for (const [name, resolved, n] of blank.sort((a, b) => b[2] - a[2])) {
    console.error(`  ${name}${name === resolved ? '' : ` -> ${resolved}`}  (${n} usages)`);
  }
}
for (const [from, to] of badTargets) console.error(`  BAD MAP: ${from} -> ${to} (not in FA Free)`);
if (blank.length || badTargets.length) process.exit(1);
console.log('\nICONS OK: every icon resolves to a Font Awesome Free glyph.');
