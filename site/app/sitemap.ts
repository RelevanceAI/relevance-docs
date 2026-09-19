import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { siteUrl } from '@/lib/shared';

/**
 * Mintlify generated /docs/sitemap.xml with 289 URLs. Nothing generates one
 * by default here, so the first build shipped without a sitemap at all.
 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({
    url: `${siteUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: page.url === '/docs/get-started/introduction' ? 1 : 0.7,
  }));
}
