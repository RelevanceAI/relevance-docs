/**
 * Links the repo's existing .mdx tree into the Next app's content collection.
 *
 * The docs live at the repository root (get-started/, build/, ...) because
 * that is what Mintlify required. Rather than move 457 files now -- which
 * would break the live Mintlify build before cutover and bury the migration
 * in a rename diff -- this creates site/content/docs as a directory of
 * SYMLINKS to the real content.
 *
 * At cutover this is replaced by a single `git mv` of each directory into
 * site/content/docs/, with no change to URLs or to anything else in the app.
 *
 * old-pages/ is excluded: it already 404s on the live site.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const DOCS = path.join(ROOT, 'site/content/docs');
const SNIPPETS = path.join(ROOT, 'site/content/_snippets');

const DIRS = ['admin', 'api-reference', 'build', 'changelog', 'embed', 'enterprise',
  'example-use-cases', 'get-started', 'guides', 'integrations', 'sdk', 'templates'];
const ROOT_FILES = ['changelog.mdx', 'community.mdx', 'features.mdx', 'guides.mdx', 'support.mdx'];

fs.rmSync(DOCS, { recursive: true, force: true });
fs.rmSync(SNIPPETS, { recursive: true, force: true });
fs.mkdirSync(DOCS, { recursive: true });

let n = 0;
for (const d of DIRS) {
  const src = path.join(ROOT, d);
  if (!fs.existsSync(src)) continue;
  fs.symlinkSync(src, path.join(DOCS, d), 'dir');
  n++;
}
for (const f of ROOT_FILES) {
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) continue;
  fs.symlinkSync(src, path.join(DOCS, f), 'file');
  n++;
}
fs.symlinkSync(path.join(ROOT, '_snippets'), SNIPPETS, 'dir');

const count = (d) => fs.readdirSync(d, { withFileTypes: true, recursive: true })
  .filter((e) => e.isFile() && e.name.endsWith('.mdx')).length;
console.log(`linked ${n} entries -> site/content/docs`);
console.log(`visible .mdx through links: ${count(DOCS)}`);
