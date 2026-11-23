import fs from 'node:fs';
import path from 'node:path';
import { source } from '@/lib/source';
import { siteUrl, SITE_NAME } from '@/lib/shared';

type Page = ReturnType<typeof source.getPages>[number];

/** Several pages carry a trailing space in their frontmatter description. */
const desc = (page: Page) => page.data.description?.trim();

/**
 * docs.json navigation order.
 *
 * Mintlify's llms.txt lists exactly the pages in navigation.products, in
 * tree order, and nothing else -- the 96 orphan pages the build also emits
 * are absent from it. Reading docs.json directly is the only way to get that
 * ordering; source.getPages() returns filesystem order.
 */
function navSlugs(): string[] {
  const docsJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), '..', 'docs.json'), 'utf8'),
  );
  const out: string[] = [];
  const seen = new Set<string>();
  const walk = (o: unknown) => {
    if (typeof o === 'string') {
      if (!seen.has(o)) { seen.add(o); out.push(o); }
      return;
    }
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (o && typeof o === 'object') {
      for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v);
    }
  };
  walk(docsJson.navigation?.products ?? []);
  return out;
}

/** Global anchors that point somewhere absolute -- Mintlify's "Optional" list. */
function optionalLinks(): { title: string; href: string }[] {
  const docsJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), '..', 'docs.json'), 'utf8'),
  );
  return (docsJson.navigation?.global?.anchors ?? [])
    .filter((a: { href?: string }) => /^https?:\/\//.test(a.href ?? ''))
    .map((a: { anchor: string; href: string }) => ({ title: a.anchor, href: a.href }));
}

/** Pages in docs.json order, skipping any slug without a built page. */
export function navPages(): Page[] {
  const byUrl = new Map(source.getPages().map((p) => [p.url, p]));
  return navSlugs()
    .map((slug) => byUrl.get(`/docs/${slug}`))
    .filter((p): p is Page => p !== undefined);
}

/**
 * Cleans up what the MDX processor hands back.
 *
 * - Entity escapes: remark-stringify emits `&#x22;` for quotes inside raw
 *   JSX attributes and `&#x2A;` for the first asterisk of some `**bold**`
 *   runs, so `**Best practice:**` ships as `&#x2A;*Best practice:**`. Both
 *   are literal characters in the source; Mintlify's output has neither.
 * - `[#custom-anchor]`: Mintlify's explicit-heading-id syntax. It sets the
 *   HTML id, and Mintlify strips it from the markdown mirror.
 * - Site-root URLs: the mirrors are consumed detached from the site, so
 *   `/docs/...` has to become absolute the way Mintlify's does.
 */
export function cleanMarkdown(md: string, { absoluteLinks = false } = {}): string {
  let out = md
    .replaceAll('&#x22;', '"')
    .replaceAll('&#x2A;', '*')
    .replace(/^(\s*#{1,6} .*?)[ \t]*\[#[^\]\s]+\][ \t]*$/gm, '$1')
    // Images are absolute in every Mintlify variant (it rewrites them to its
    // CDN); links are absolute only in llms-full.txt.
    .replaceAll('](/docs/images/', `](${siteUrl}/docs/images/`)
    .replaceAll('src="/docs/', `src="${siteUrl}/docs/`);
  if (absoluteLinks) out = out.replaceAll('](/docs/', `](${siteUrl}/docs/`);
  return out.trim();
}

/** One page in Mintlify's llms-full.txt shape. */
export async function renderFullEntry(page: Page): Promise<string> {
  const blocks = [`# ${page.data.title}\nSource: ${siteUrl}${page.url}`];
  if (desc(page)) blocks.push(desc(page)!);
  blocks.push(cleanMarkdown(await page.data.getText('processed'), { absoluteLinks: true }));
  return `${blocks.join('\n\n')}\n`;
}

/**
 * One page in Mintlify's per-page `.md` mirror shape, including the header
 * that points agents at the index first.
 */
export async function renderPageMirror(page: Page): Promise<string> {
  const blocks = [
    ['> ## Documentation Index',
      `> Fetch the complete documentation index at: ${siteUrl}/docs/llms.txt`,
      '> Use this file to discover all available pages before exploring further.',
    ].join('\n'),
    `# ${page.data.title}`,
  ];
  if (desc(page)) blocks.push(`> ${desc(page)}`);
  blocks.push(cleanMarkdown(await page.data.getText('processed')));
  return `${blocks.join('\n\n')}\n`;
}

/** Mintlify's llms.txt: a flat list of `.md` URLs, then the Optional anchors. */
export function renderIndex(): string {
  const lines = [`# ${SITE_NAME}`, ''];
  for (const page of navPages()) {
    const d = desc(page) ? `: ${desc(page)}` : '';
    lines.push(`- [${page.data.title}](${siteUrl}${page.url}.md)${d}`);
  }
  const optional = optionalLinks();
  if (optional.length) {
    lines.push('', '## Optional', '');
    for (const o of optional) lines.push(`- [${o.title}](${o.href})`);
  }
  return `${lines.join('\n')}\n`;
}
