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
    // docs.json `navbar.links` + `navbar.primary`, plus the repository link.
    // The built-in `githubUrl` renders an <svg role="img"> with no accessible
    // name inside the link, which axe flags as serious on every page; this
    // supplies the same mark as decorative markup instead.
    links: [
      { type: 'main', text: 'Log In', url: 'https://app.relevanceai.com/' },
      { type: 'button', text: 'Sign Up', url: 'https://app.relevanceai.com/auth' },
      {
        type: 'icon',
        label: 'Relevance AI docs on GitHub',
        text: 'GitHub',
        url: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
        external: true,
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        ),
      },
    ],
  };
}
