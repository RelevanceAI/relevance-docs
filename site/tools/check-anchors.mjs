/**
 * Every anchor Mintlify serves today must exist in the build.
 *
 * Deep links are invisible when they break: the browser silently shows the
 * top of the page. github-slugger (fumadocs' default) and Mintlify disagree
 * on `&`, `/`, apostrophes, periods, parentheses and duplicate numbering, so
 * 201 heading anchors across 140 pages pointed at nothing before the custom
 * slugger in lib/mintlify-slug.mjs.
 *
 * The live ids are captured in tools/fixtures/live-anchors.json -- scraped
 * from relevanceai.com/docs while Mintlify still serves it. Regenerate with
 * `node tools/check-anchors.mjs --refresh` while the live site is up.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'out/docs');
const FIXTURE = path.join(ROOT, 'tools/fixtures/live-anchors.json');

// Mintlify's own UI chrome; React ids change every deploy and are not content.
const isChrome = (id) => /^(_R_|base-ui)/.test(id);

/**
 * Live capture: Mintlify puts content ids only on headings and on the <p>
 * that holds an accordion title, so restricting to those tags keeps its UI
 * chrome out of the fixture.
 */
const liveIds = (html) => {
  const out = new Set();
  for (const m of html.matchAll(/<(?:h[1-6]|p)\b[^>]*\bid="([^"]+)"/g)) {
    const id = m[1].replace(/&amp;/g, '&');
    if (!isChrome(id)) out.add(id);
  }
  return out;
};

/**
 * Our side: any element at all. The markup differs -- accordion titles are a
 * <span> here -- and all that matters is that the fragment resolves.
 */
const builtIds = (html) => {
  const out = new Set();
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) out.add(m[1].replace(/&amp;/g, '&'));
  return out;
};

if (process.argv.includes('--refresh')) {
  const slugs = JSON.parse(fs.readFileSync(path.join(ROOT, '..', 'docs.json'), 'utf8'));
  const list = [];
  const walk = (o) => {
    if (typeof o === 'string') { list.push(o); return; }
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === 'object') for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v);
  };
  walk(slugs.navigation?.products ?? []);

  const data = {};
  let i = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (i < list.length) {
      const slug = list[i++];
      const r = await fetch(`https://relevanceai.com/docs/${slug}`);
      if (!r.ok) { console.warn(`  skip ${slug} (${r.status})`); continue; }
      data[slug] = [...liveIds(await r.text())].sort();
    }
  }));
  fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
  fs.writeFileSync(FIXTURE, JSON.stringify(data, null, 1) + '\n');
  console.log(`captured ${Object.keys(data).length} pages`);
  process.exit(0);
}

/**
 * One id Mintlify generates that this build does not, and will not.
 *
 * Mintlify's accordion slug drops the apostrophe in a contraction
 * (`don't` -> `dont`) everywhere except here, where it splits on it. Its own
 * output is inconsistent, so there is no rule that produces both; one page
 * out of 289 loses one accordion anchor that nothing links to.
 */
const ACCEPTED = new Set([
  'guides/customer-support/response-drafting#auto-send-before-you-re-ready-accordion-title',
]);

const live = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
let total = 0, missing = 0;
const bad = [];
for (const [slug, ids] of Object.entries(live)) {
  const f = path.join(OUT, `${slug}.html`);
  if (!fs.existsSync(f)) { bad.push({ slug, gone: ['PAGE MISSING'] }); continue; }
  const ours = builtIds(fs.readFileSync(f, 'utf8'));
  const gone = ids.filter((id) => !ours.has(id) && !ACCEPTED.has(`${slug}#${id}`));
  total += ids.length;
  missing += gone.length;
  if (gone.length) bad.push({ slug, gone });
}

console.log(`pages          : ${Object.keys(live).length}`);
console.log(`live anchors   : ${total}`);
console.log(`missing in ours: ${missing} across ${bad.length} pages`);
console.log(`known exceptions: ${ACCEPTED.size}`);
if (bad.length) {
  console.error('\nBROKEN DEEP LINKS:');
  for (const b of bad.slice(0, 20)) console.error(`  /docs/${b.slug}\n     ${b.gone.slice(0, 6).join('\n     ')}`);
  process.exit(1);
}
console.log('\nANCHORS OK: every anchor Mintlify serves resolves in the build.');
