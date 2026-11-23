/**
 * Scans built pages for source syntax that leaked into rendered prose.
 *
 * This exists because 144 <Snippet> includes across 43 pages silently
 * failed: fumadocs prepends its own remarkInclude BEFORE any plugin a
 * config callback supplies, so a plugin that emitted <include> did nothing.
 * The element survived to the HTML, browsers render unknown inline elements,
 * and readers saw a literal `../../_snippets/foo.mdx` path where the content
 * should be. Five pages lost 60-89% of their body.
 *
 * Every other gate passed throughout: the pages built, the links resolved,
 * the images loaded. Only reading the rendered text catches this.
 *
 * It also checks that the body is valid HTML in the one way that matters at
 * runtime: a block element inside a <p> (or a <p> inside a <p>) makes the
 * parser close the paragraph early, so the client tree stops matching the
 * server tree and React throws #418 and re-renders the page on the client.
 * A `<Tip>` on the line straight after a sentence did this on 22 pages, and
 * a raw `<p style=...>` with its text on the next line on 3 more.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(import.meta.dirname, '../dist/docs');

const LEAKS = [
  { re: /<include>/i, name: 'unprocessed <include> element' },
  { re: /_snippets\/[\w./-]+\.mdx/, name: 'raw _snippets path in output' },
  { re: /\[object Object\]/, name: '[object Object]' },
  { re: /^\s*:::/m, name: 'unconverted ::: directive' },
  { re: /<(Accordion|Card|Note|Tip|Warning|Info|Step|Tabs?|Snippet|Frame|ParamField)\b/, name: 'literal component tag' },
];

const pages = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^(_next|images|videos|og|llms\.mdx|api)$/.test(e.name)) walk(p); continue; }
    if (e.name.endsWith('.html')) pages.push(p);
  }
})(DIST);

/** Block-level elements the HTML parser will not leave inside a <p>. */
const BLOCK_IN_P = /<(p|div|aside|ul|ol|li|figure|pre|table|section|article|h[1-6])\b/;

function badParagraphs(body) {
  for (const m of body.matchAll(/<p\b[^>]*>/g)) {
    const end = body.indexOf('</p>', m.index);
    const inner = body.slice(m.index + m[0].length, end === -1 ? undefined : end);
    const hit = BLOCK_IN_P.exec(inner);
    if (hit) return hit[1];
  }
  return null;
}

const found = new Map();
const nesting = [];
for (const f of pages) {
  const html = fs.readFileSync(f, 'utf8');
  // Only the article body: code samples legitimately contain component tags.
  const start = html.indexOf('<article');
  if (start === -1) continue;
  let body = html.slice(start, html.indexOf('</article>', start));
  body = body.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code[\s\S]*?<\/code>/g, '');

  const tag = badParagraphs(body);
  if (tag) nesting.push(`/docs${f.slice(DIST.length).replace(/\.html$/, '')} (<${tag}> inside <p>)`);

  for (const { re, name } of LEAKS) {
    if (re.test(body)) {
      if (!found.has(name)) found.set(name, []);
      found.get(name).push(`/docs${f.slice(DIST.length).replace(/\.html$/, '')}`);
    }
  }
}

console.log(`pages scanned : ${pages.length}`);
console.log(`leak patterns : ${found.size}`);
console.log(`bad <p> nesting: ${nesting.length}`);
if (found.size) {
  console.error('\nSource syntax leaked into rendered output:');
  for (const [name, list] of found) {
    console.error(`  ${name} -- ${list.length} page(s), e.g. ${list[0]}`);
  }
}
if (nesting.length) {
  console.error('\nBlock element inside a <p> -- this breaks hydration:');
  for (const n of nesting.slice(0, 12)) console.error(`  ${n}`);
  if (nesting.length > 12) console.error(`  ... and ${nesting.length - 12} more`);
  console.error('\nAdd the component to BLOCK in lib/remark-unwrap-blocks.mjs, or put the');
  console.error('raw JSX element\'s content on the same line as its tag.');
}
if (found.size || nesting.length) process.exit(1);
console.log('\nCONTENT OK: no source syntax leaked, and no block element inside a <p>.');
