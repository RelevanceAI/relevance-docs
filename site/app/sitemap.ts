import type { MetadataRoute } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { source } from '@/lib/source';
import { siteUrl } from '@/lib/shared';

export const dynamic = 'force-static';

/**
 * Only pages listed in docs.json navigation are advertised.
 *
 * The build produces 385 pages, but 96 of them are orphans: served, but
 * unlinked and absent from Mintlify's sitemap today. Advertising them would
 * push 96 previously-unindexed pages — including the leftover Mintlify
 * starter-kit API stubs — into the index at cutover, which is a change in
 * behaviour, not a migration. They stay reachable; they just aren't listed,
 * exactly as now.
 */
function navSlugs(): Set<string> {
  const docsJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), '..', 'docs.json'), 'utf8'),
  );
  const out = new Set<string>();
  const walk = (o: unknown) => {
    if (typeof o === 'string') { out.add(o); return; }
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (o && typeof o === 'object') {
      for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v);
    }
  };
  walk(docsJson.navigation?.products ?? []);

  // Mintlify's sitemap covers the navigation.products tree only, so the
  // global anchors (/docs/community and /docs/changelog) are absent from it
  // today even though both are linked from every page. Matching that keeps
  // the migration exactly neutral. Both are still crawlable via those links;
  // flip this to true to advertise them as well -- a small opportunity, not
  // a regression either way.
  const INCLUDE_GLOBAL_ANCHORS = false;
  if (INCLUDE_GLOBAL_ANCHORS) {
    for (const a of docsJson.navigation?.global?.anchors ?? []) {
      const href = String(a.href ?? '').replace('https://relevanceai.com/docs', '');
      if (href.startsWith('/')) out.add(href.replace(/^\//, ''));
    }
  }
  return out;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const listed = navSlugs();
  return source
    .getPages()
    .filter((page) => listed.has(page.url.replace(/^\/docs\//, '')))
    .map((page) => ({
      url: `${siteUrl}${page.url}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: page.url === '/docs/get-started/introduction' ? 1 : 0.7,
    }));
}
