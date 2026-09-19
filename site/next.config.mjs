import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

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
};

export default withMDX(config);
