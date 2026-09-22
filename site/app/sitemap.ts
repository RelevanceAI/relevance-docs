import type { MetadataRoute } from 'next';
import { navPages } from '@/lib/llms';
import { source } from '@/lib/source';
import { siteUrl } from '@/lib/shared';

export const dynamic = 'force-static';

/**
 * The 289 pages in docs.json navigation, plus the changelog archives.
 *
 * The build produces 385 pages; 96 are orphans, served but unlinked from
 * the navigation tree. Advertising all of them would push five leftover
 * Mintlify starter-kit API stubs and ~50 pages with no inbound link at all
 * into the index at cutover -- a content-quality change dressed up as a
 * migration. They stay reachable; they just aren't listed, exactly as now.
 *
 * The three changelog year archives are the exception. They are current,
 * substantive, and linked from the changelog's own sidebar; Mintlify leaves
 * them out only because its sitemap walks navigation.products and the
 * changelog is a global anchor. That is an artifact of how Mintlify builds
 * sitemaps, not a decision about those pages.
 */
const EXTRA = ['/docs/changelog/2023', '/docs/changelog/2024', '/docs/changelog/2025'];

export default function sitemap(): MetadataRoute.Sitemap {
  const byUrl = new Map(source.getPages().map((p) => [p.url, p]));
  const urls = [
    ...navPages().map((p) => p.url),
    ...EXTRA.filter((u) => byUrl.has(u)),
  ];

  return urls.map((url) => ({
    url: `${siteUrl}${url}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: url === '/docs/get-started/introduction' ? 1 : 0.7,
  }));
}
