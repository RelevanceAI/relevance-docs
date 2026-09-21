import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // Without this the brand lockup links to "/", the marketing site root,
      // from all 385 pages. Mintlify's /docs 308s here too.
      url: '/docs/get-started/introduction',
      title: (
        <span className="rl-brand">
          {/* Raw <img> is NOT rewritten by Next's basePath -- only next/image
              and _next assets are -- so these carry the /docs prefix
              explicitly, matching how the MDX asset refs are rewritten.
              These reference the .webp that tools/optimize-images.mjs
              produces: the .png sources are 1163px wide for a 107px slot and
              both variants preload on every page, ahead of the LCP image. */}
          <img src="/docs/images/_opt/logo/light.webp" alt="" className="rl-brand-mark rl-brand-mark--light" />
          <img src="/docs/images/_opt/logo/dark.webp" alt="" className="rl-brand-mark rl-brand-mark--dark" />
          {/* The logo already carries the Relevance AI wordmark, so the text
              beside it is just the section name. */}
          <span className="rl-brand-text">Docs</span>
        </span>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    // docs.json `navbar.links` + `navbar.primary`.
    links: [
      { type: 'main', text: 'Log In', url: 'https://app.relevanceai.com/' },
      { type: 'button', text: 'Sign Up', url: 'https://app.relevanceai.com/auth' },
    ],
  };
}
