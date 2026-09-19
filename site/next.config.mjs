import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  // Mintlify serves the docs at /docs with no trailing slash and no .html
  // suffix. 289 URLs are indexed, so this has to match exactly.
  basePath: '/docs',
  trailingSlash: false,
  // Static export cannot run the Next image optimizer.
  images: { unoptimized: true },
};

export default withMDX(config);
