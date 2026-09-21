/**
 * Asserts that everything needed to build is actually committed to git.
 *
 * The repo's root .gitignore carried bare `package.json` and
 * `package-lock.json` patterns, which git matches at ANY depth. So
 * site/package.json was silently never committed: `git add -A` skipped it
 * without a word, every local build worked because the file exists on disk,
 * and the failure only appeared on Vercel -- which cloned the repo, found no
 * manifest, skipped install entirely, and died with "next: command not found"
 * after 12 seconds.
 *
 * Checking `git check-ignore` catches this class of bug locally, where no
 * amount of building can.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const REQUIRED = [
  'site/package.json',
  'site/package-lock.json',
  'site/next.config.mjs',
  'site/source.config.ts',
  'site/tsconfig.json',
  'site/vercel.json',
  'site/postcss.config.mjs',
  'site/public/_redirects',
  'site/public/_headers',
  'site/app/layout.tsx',
  'site/components/mdx.tsx',
  'site/lib/source.ts',
];

const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

const tracked = new Set(git(['ls-files']).split('\n'));
const missing = [];
const ignored = [];

for (const f of REQUIRED) {
  if (!fs.existsSync(path.join(ROOT, f))) { missing.push(`${f} (not on disk)`); continue; }
  if (!tracked.has(f)) {
    missing.push(f);
    try {
      const rule = execFileSync('git', ['check-ignore', '-v', f], { cwd: ROOT, encoding: 'utf8' }).trim();
      if (rule) ignored.push(`${f}\n      ignored by ${rule.split('\t')[0]}`);
    } catch { /* not ignored, just untracked */ }
  }
}

// Any source file under site/ that git is ignoring is suspicious. Build
// output and dependencies are expected; anything else is probably a mistake.
const EXPECTED_IGNORES = /(^|\/)(node_modules|\.next|out|dist|\.source)(\/|$)|next-env\.d\.ts$/;
const stray = git(['status', '--ignored', '--short', 'site/'])
  .split('\n')
  .filter((l) => l.startsWith('!!'))
  .map((l) => l.slice(3).trim())
  .filter((f) => !EXPECTED_IGNORES.test(f));

console.log(`required files : ${REQUIRED.length}`);
console.log(`untracked      : ${missing.length}`);
console.log(`stray ignores  : ${stray.length}`);

if (missing.length) {
  console.error('\nRequired to build, but NOT committed:');
  for (const m of missing) console.error(`  ${m}`);
  for (const i of ignored) console.error(`  ${i}`);
}
for (const s of stray) console.error(`  STRAY IGNORE under site/: ${s}`);
if (missing.length || stray.length) process.exit(1);
console.log('\nTRACKED OK: every file needed to build is committed.');
