import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  basePath: '/docs',
  // Mintlify serves /docs/a/b with no trailing slash and no .html suffix.
  trailingSlash: false,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default withMDX(config);
