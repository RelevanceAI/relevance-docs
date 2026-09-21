/**
 * One-time: rewrite Mintlify's <Snippet file="x.mdx" /> to fumadocs' native
 * <include> syntax.
 *
 * Why not keep <Snippet> and expand it in a remark plugin: fumadocs builds
 * its processor as
 *   remarkPlugins: [remarkInclude, ...yourPlugins, remarkPostprocess]
 * so remarkInclude ALWAYS runs before anything a config callback supplies and
 * never sees nodes created afterwards. A custom plugin emitting <include>
 * therefore did nothing, and 144 usages across 43 pages shipped a literal
 * `../../_snippets/...` path in the prose while losing the snippet body --
 * up to 89% of a page.
 *
 * Expanding the file inside the plugin instead requires an MDX parser, and
 * importing one into the fumadocs MDX loader crashes its subprocess
 * ("Broken pipe") -- verified: the imports alone break the build, with the
 * parser never called.
 *
 * So the include is expressed in the source, using the mechanism the
 * framework actually runs. Paths are relative to each file, as remarkInclude
 * expects.
 *
 *   node tools/convert-snippets.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DOCS = path.join(ROOT, 'content/docs');
const SNIPPETS = path.join(ROOT, 'content/_snippets');
const DRY = process.argv.includes('--dry');

/** The source has `components/Tools/...` against a real `components/tools/`. */
function resolveInsensitive(rel) {
  const exact = path.join(SNIPPETS, rel);
  if (fs.existsSync(exact)) return exact;
  let dir = SNIPPETS;
  for (const part of rel.split('/')) {
    const hit = (fs.existsSync(dir) ? fs.readdirSync(dir) : [])
      .find((e) => e.toLowerCase() === part.toLowerCase());
    if (!hit) return null;
    dir = path.join(dir, hit);
  }
  return fs.existsSync(dir) ? dir : null;
}

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.mdx')) files.push(p);
  }
})(DOCS);

let converted = 0; let touched = 0; const missing = [];
const RE = /<Snippet\s+file=(["'])([^"']+)\1\s*\/>/g;

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  if (!RE.test(before)) continue;
  RE.lastIndex = 0;

  const after = before.replace(RE, (match, _q, rel) => {
    const abs = resolveInsensitive(rel);
    if (!abs) { missing.push(`${path.relative(ROOT, file)} -> ${rel}`); return match; }
    let target = path.relative(path.dirname(file), abs).split(path.sep).join('/');
    if (!target.startsWith('.')) target = `./${target}`;
    converted++;
    return `<include>${target}</include>`;
  });

  if (after !== before) {
    touched++;
    if (!DRY) fs.writeFileSync(file, after);
  }
}

console.log(`${DRY ? '[dry] ' : ''}converted ${converted} <Snippet> usages across ${touched} files`);
if (missing.length) {
  console.error(`\nUnresolvable (left as-is):`);
  for (const m of missing) console.error(`  ${m}`);
  process.exit(1);
}
