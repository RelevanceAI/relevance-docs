import Link from 'next/link';

/**
 * Branded 404.
 *
 * Next's default is a bare "404: This page could not be found." with no
 * styling and no way out. Mintlify's 404 is client-rendered and returns an
 * empty document to crawlers, so there is nothing to match -- this is simply
 * better than both. It renders inside the docs layout, so the sidebar and
 * search stay available for recovery.
 *
 * For static export this becomes 404.html, which is what static hosts serve.
 */
export default function NotFound() {
  return (
    <div className="rl-404">
      <p className="rl-404-code">404</p>
      <h1 className="rl-404-title">We can&rsquo;t find that page</h1>
      <p className="rl-404-body">
        The page may have moved, or the link that brought you here may be out of date.
      </p>
      <div className="rl-404-actions">
        <Link className="rl-404-btn rl-404-btn--primary" href="/docs/get-started/introduction">
          Go to the docs home
        </Link>
        <Link className="rl-404-btn" href="/docs/get-started/support">
          Contact support
        </Link>
      </div>
    </div>
  );
}
