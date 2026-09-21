/**
 * Resizes and re-encodes every screenshot as WebP, and records the mapping
 * so the MDX pipeline can point at the smaller file.
 *
 * Mintlify never served the raw files: it proxied them through its CDN with
 * `?w=1100&fit=max&auto=format`, so `platform-dashboard.png` reached readers
 * as 67 KB even though the file is 4.2 MB. Self-hosting loses that, and
 * Next's optimizer cannot replace it -- `output: 'export'` forces
 * `images.unoptimized`. Without this step /docs/build/introduction ships
 * 13.6 MB against the live site's 2.8 MB and LCP goes from 0.8 s to 8.6 s.
 *
 * The originals stay in place and keep their URLs: relevanceai.com serves
 * /docs/images/<name>.png today, so those links have to keep resolving.
 * Only what the pages reference changes.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const IMAGES = path.join(ROOT, 'public/images');
// Output lives in its own directory so the 199 WebP files that are checked
// in stay distinguishable from the ~600 this generates, and so the whole
// tree can be gitignored and rebuilt.
const OPT_DIR = path.join(IMAGES, '_opt');
const MANIFEST = path.join(ROOT, 'lib/image-manifest.json');

// Content renders at most ~900 CSS px wide; 1600 covers that at ~1.8x DPR.
const MAX_WIDTH = 1600;
// The header lockup renders at 107 CSS px, so the 1163px source is 10x
// oversized -- and it is preloaded on every page, ahead of the LCP image.
const WIDTHS = [[/^logo\//, 320]];
const widthFor = (rel) => WIDTHS.find(([re]) => re.test(rel))?.[1] ?? MAX_WIDTH;
const QUALITY = 80;
// Below this the WebP round-trip is not worth a second file on disk.
const MIN_SAVING = 0.15;

const SOURCE = /\.(png|jpe?g|webp)$/i;

const files = [];
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (p === OPT_DIR) continue;
    if (e.isDirectory()) walk(p);
    else if (SOURCE.test(e.name)) files.push(p);
  }
})(IMAGES);

const manifest = {};
let before = 0, after = 0, made = 0, reused = 0, skipped = 0;

await Promise.all(files.map(async (src) => {
  const name = path.relative(IMAGES, src).split(path.sep).join('/');
  const rel = `/images/${name}`;
  const out = path.join(OPT_DIR, name).replace(SOURCE, '.webp');
  const srcStat = fs.statSync(src);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  let outStat = fs.existsSync(out) ? fs.statSync(out) : null;
  if (!outStat || outStat.mtimeMs < srcStat.mtimeMs) {
    const img = sharp(src, { limitInputPixels: false });
    const { width } = await img.metadata();
    const max = widthFor(name);
    await img
      .resize({ width: Math.min(width ?? max, max), withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(out);
    outStat = fs.statSync(out);
    made++;
  } else {
    reused++;
  }

  if (outStat.size > srcStat.size * (1 - MIN_SAVING)) {
    // Already small and well compressed, or a screenshot WebP cannot improve
    // on. Leave the page pointing at the original.
    fs.rmSync(out);
    skipped++;
    return;
  }

  const meta = await sharp(out).metadata();
  manifest[rel] = {
    src: `/images/_opt/${name.replace(SOURCE, '.webp')}`,
    width: meta.width,
    height: meta.height,
  };
  before += srcStat.size;
  after += outStat.size;
}));

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');

const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
console.log(`sources        : ${files.length} (${made} encoded, ${reused} cached, ${skipped} not worth it)`);
console.log(`rewritten      : ${Object.keys(manifest).length} images`);
console.log(`payload        : ${mb(before)} -> ${mb(after)} (${(100 - (after / before) * 100).toFixed(0)}% smaller)`);
console.log(`\nwrote lib/image-manifest.json`);
