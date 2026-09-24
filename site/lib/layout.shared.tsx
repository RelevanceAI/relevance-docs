import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';
import { getProducts, productOverrides } from './products';
import { Icon } from '@/components/mintlify';
import { ProductSwitcher } from '@/components/site/product-switcher';
import { GlobalAnchors } from '@/components/site/global-anchors';
import { BrandMark } from '@/components/site/brand-mark';

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
          {/* Inlined, not an <img>: the wordmark's paths use currentColor so
              it takes its colour from .rl-brand and follows the theme, which
              a pair of light/dark raster files could only fake by swapping.
              It also drops two image requests that preloaded on every page
              ahead of the LCP image. */}
          <BrandMark />
          {/* The lockup is aria-hidden, so this is the link's accessible
              name. Hidden visually -- see .rl-brand-text. */}
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
