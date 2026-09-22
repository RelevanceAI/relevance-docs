/**
 * Generates the favicon set from public/favicon.png.
 *
 * Mintlify generates a full set at build time (16/32/180/192 + .ico, plus a
 * dark variant) and injects the link tags. Nothing did that here, so the new
 * build declared NO icon tags at all -- browsers fell back to whatever they
 * could guess, and the tab icon was lost.
 *
 * Source is the repo's own 50x50 favicon.png. That is the same source
 * Mintlify upscales from -- a side-by-side against their live 192x192 is
 * visually identical -- so nothing is gained by hunting for a larger one.
 * The logo wordmark is 1163x200 and cropping a square from it cuts the mark
 * in half, so it is not a usable source.
 *
 * Mintlify's dark favicon is byte-identical to its light one (same md5), so
 * a single set covers both themes.
 *
 *   node tools/gen-favicons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'public/favicon.png');
const OUT = path.join(ROOT, 'public');

const PNGS = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'favicon-48x48.png', size: 48 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'android-chrome-192x192.png', size: 192 },
  { file: 'android-chrome-512x512.png', size: 512 },
];

/** Minimal ICO container. Browsers accept PNG-compressed ICO entries. */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);            // reserved
  header.writeUInt16LE(1, 2);            // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = header.length + dir.length;

  entries.forEach((e, i) => {
    const b = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, b);     // width (0 means 256)
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, b + 1); // height
    dir.writeUInt8(0, b + 2);            // palette
    dir.writeUInt8(0, b + 3);            // reserved
    dir.writeUInt16LE(1, b + 4);         // colour planes
    dir.writeUInt16LE(32, b + 6);        // bits per pixel
    dir.writeUInt32LE(e.data.length, b + 8);
    dir.writeUInt32LE(offset, b + 12);
    offset += e.data.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.data)]);
}

const src = sharp(SRC);
const meta = await src.metadata();
console.log(`source: favicon.png ${meta.width}x${meta.height}`);

for (const { file, size } of PNGS) {
  await sharp(SRC)
    .resize(size, size, { kernel: 'lanczos3', fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, file));
  console.log(`  ${file.padEnd(28)} ${size}x${size}`);
}

const icoEntries = [];
for (const size of [16, 32, 48]) {
  icoEntries.push({
    size,
    data: await sharp(SRC).resize(size, size, { kernel: 'lanczos3' }).png().toBuffer(),
  });
}
fs.writeFileSync(path.join(OUT, 'favicon.ico'), buildIco(icoEntries));
console.log(`  ${'favicon.ico'.padEnd(28)} 16+32+48`);
