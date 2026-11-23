import fs from 'node:fs';
import path from 'node:path';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/**
 * Dev only. The deploy gathers out/ under dist/docs (tools/pack-dist.mjs), so
 * /docs/images, /docs/fonts and the rest resolve natively in production -- but
 * `next dev` serves public/ from the domain root while every asset URL in the
 * HTML carries the /docs prefix, so locally they all 404: screenshots blank,
 * icon font falls back to tofu.
 *
 * beforeFiles, and one rule per entry in public/ rather than a blanket
 * /docs/:path*. The blanket rule is wrong in both other buckets: afterFiles is
 * applied before dynamic routes and swallowed every page, and fallback never
 * runs at all because app/docs/[[...slug]] matches the asset URL first and
 * renders a 404.
 */
const devAssetRewrites = async () => ({
  beforeFiles: fs
    .readdirSync(path.resolve(import.meta.dirname, 'public'), { withFileTypes: true })
    // _headers and _redirects are host rule files, not served content.
    .filter((entry) => !entry.name.startsWith('_'))
    .map((entry) =>
      entry.isDirectory()
        ? { source: `/docs/${entry.name}/:path*`, destination: `/${entry.name}/:path*` }
        : { source: `/docs/${entry.name}`, destination: `/${entry.name}` },
    ),
  afterFiles: [],
  fallback: [],
});

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  // NOT basePath. basePath rewrites next/link at runtime but leaves plain
  // <a> from MDX alone, so no single setting is correct for both: prefixing
  // MDX links then produced /docs/docs/..., and not prefixing them left
  // server-rendered hrefs that 404 for crawlers and with JS disabled.
  //
  // Instead the /docs segment is a real route (app/docs/**) so every page URL
  // literally contains it, and assetPrefix points the _next chunks at /docs
  // so the whole site can be served from one path.
  assetPrefix: '/docs',
  trailingSlash: false,
  // Static export cannot run the Next image optimizer.
  images: { unoptimized: true },
  ...(process.env.NODE_ENV === 'development' && { rewrites: devAssetRewrites }),
};

export default withMDX(config);
