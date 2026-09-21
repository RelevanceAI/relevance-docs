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

const found = new Map();
for (const f of pages) {
  const html = fs.readFileSync(f, 'utf8');
  // Only the article body: code samples legitimately contain component tags.
  const start = html.indexOf('<article');
  if (start === -1) continue;
  let body = html.slice(start, html.indexOf('</article>', start));
  body = body.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code[\s\S]*?<\/code>/g, '');

  for (const { re, name } of LEAKS) {
    if (re.test(body)) {
      if (!found.has(name)) found.set(name, []);
      found.get(name).push(`/docs${f.slice(DIST.length).replace(/\.html$/, '')}`);
    }
  }
}

console.log(`pages scanned : ${pages.length}`);
console.log(`leak patterns : ${found.size}`);
if (found.size) {
  console.error('\nSource syntax leaked into rendered output:');
  for (const [name, list] of found) {
    console.error(`  ${name} -- ${list.length} page(s), e.g. ${list[0]}`);
  }
  process.exit(1);
}
console.log('\nCONTENT OK: no source syntax leaked into rendered pages.');
