import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';
import { getProducts, productOverrides } from './products';
import { Icon } from '@/components/mintlify';
import { ProductSwitcher } from '@/components/site/product-switcher';
import { GlobalAnchors } from '@/components/site/global-anchors';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // Mintlify's header is transparent over the page gradient at the top of
      // the page; fumadocs' is 80% background. 'top' gives the same thing and
      // keeps the translucent bar once content scrolls under it.
      transparentMode: 'top',
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
          {/* Mintlify shows the logo alone. The text is kept for the link's
              accessible name and hidden visually -- see .rl-brand-text. */}
          <span className="rl-brand-text">Relevance AI Docs</span>
        </span>
      ),
      // Mintlify's product dropdown, rendered straight after the brand. The
      // icons are resolved here on the server so the client component ships
      // no icon table.
      children: (
        <ProductSwitcher
          products={getProducts().map((p) => ({
            name: p.name, href: p.href, prefix: p.prefix,
            icon: p.icon ? <Icon name={p.icon} /> : undefined,
          }))}
          overrides={productOverrides()}
        />
      ),
    },
    // docs.json `navbar.links` + `navbar.primary`, and nothing else: Mintlify's
    // navbar carries no repository link (GitHub is reached from the page
    // footer's "Suggest edits" / "Raise issue"), so the icon added here in the
    // first cut is gone.
    links: [
      // Rendered inside the sidebar's scroll area ahead of the tree, which is
      // where Mintlify pins its global anchors. `on: 'menu'` keeps it out of
      // the navbar; the sidebar hides every menu item at lg+, so relevance.css
      // un-hides this one.
      { type: 'custom', on: 'menu', children: <GlobalAnchors /> },
      { type: 'main', text: 'Log In', url: 'https://app.relevanceai.com/' },
      { type: 'button', text: 'Sign Up', url: 'https://app.relevanceai.com/auth' },
    ],
  };
}
