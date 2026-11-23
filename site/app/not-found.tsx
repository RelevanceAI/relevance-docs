import type { Metadata } from 'next';
import { MobileNav } from '@/components/site/mobile-nav';

export const metadata: Metadata = { title: 'Page not found' };

/**
 * Mintlify's 404, measured on the preview: no sidebar and no tab row, just
 * the header, then a centred block 192px down -- "404" at 48px/600 in
 * primary, a 24px/500 heading, one 16px line -- 24px apart. On a phone the
 * hamburger row stays, titled "Page not found", so the navigation is still
 * one tap away; on desktop the header search is the way out, as it is there.
 *
 * It renders inside the docs layout, so it has to claim the grid's `main`
 * area itself: left to auto-placement it landed in the first free track, a
 * 60px column, and pushed the sidebar below it.
 *
 * For static export this becomes 404.html, which is what static hosts serve.
 */
export default function NotFound() {
  return (
    <>
      <MobileNav title="Page not found" />
      <main className="rl-404">
        <div className="rl-404-block">
          <p className="rl-404-code">404</p>
          <h1 className="rl-404-title">Page not found</h1>
          <p className="rl-404-body">We couldn&rsquo;t find the page.</p>
        </div>
      </main>
    </>
  );
}
