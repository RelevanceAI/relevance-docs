import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'Relevance AI Docs';

/**
 * Canonical origin. Without this Next falls back to http://localhost:3000
 * and every og:image in the build points at localhost -- which is exactly
 * what the first full build shipped.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relevanceai.com';
export const docsRoute = '/docs';
export const docsImageRoute = '/og';
export const docsContentRoute = '/llms.mdx';

// fill this with your actual GitHub info, for example:
export const gitConfig = {
  user: 'RelevanceAI',
  repo: 'relevance-docs',
  branch: 'main',
};

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
