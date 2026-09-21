import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/shared';

export const dynamic = 'force-static';

/**
 * Mirrors the robots.txt Mintlify serves today, so crawler behaviour does not
 * change at cutover. Build assets are disallowed but images stay crawlable.
 *
 * The Content-Signal line is Mintlify's current AI-usage declaration
 * (ai-train=yes, search=yes, ai-input=yes). It is preserved deliberately --
 * changing it is a policy decision, not a migration detail.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/docs/_next/image'],
        disallow: ['/docs/_next/'],
      },
    ],
    sitemap: `${siteUrl}/docs/sitemap.xml`,
  };
}
