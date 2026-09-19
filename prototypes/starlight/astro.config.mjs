import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import starlight from '@astrojs/starlight';
import { autoImportShims } from './src/plugins/auto-import.mjs';
import { mintlifyFrontmatter } from './src/plugins/frontmatter.mjs';
import sidebar from './sidebar.generated.mjs';
import redirects from './redirects.generated.mjs';

export default defineConfig({
  site: 'https://relevanceai.com',
  base: '/docs',
  // Mintlify serves /docs/a/b with NO trailing slash. Matching this exactly
  // is the single highest-risk item in the migration -- 289 indexed URLs.
  trailingSlash: 'never',
  build: { format: 'file' },
  redirects,
  vite: {
    resolve: {
      alias: {
        '@shims': fileURLToPath(new URL('./src/components/shims.ts', import.meta.url)),
      },
    },
  },
  markdown: {
    remarkPlugins: [mintlifyFrontmatter, autoImportShims],
  },
  integrations: [
    starlight({
      title: 'Relevance AI Documentation',
      favicon: '/favicon.png',
      logo: { light: './public/images/logo/light.png', dark: './public/images/logo/dark.png' },
      customCss: [
        '../_design/tokens.css',
        '../_design/components.css',
        './src/styles/starlight-bridge.css',
      ],
      social: [
        { icon: 'x.com', label: 'X', href: 'https://twitter.com/relevanceai_' },
        { icon: 'github', label: 'GitHub', href: 'https://github.com/relevanceai' },
        { icon: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/company/relevanceai' },
      ],
      sidebar,
      // Pagefind is on by default -- static, no Algolia contract.
      pagefind: true,
    }),
  ],
});
