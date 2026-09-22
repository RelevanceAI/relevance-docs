import { defineConfig } from 'fumadocs-mdx/config';
import { remarkSnippet } from './lib/remark-snippet.mjs';
import { remarkHeadingComponents } from './lib/remark-heading-components.mjs';

/**
 * Global MDX options. The <Snippet> rewrite must run BEFORE fumadocs' own
 * remarkInclude, which is what actually inlines the snippet file.
 */
export default defineConfig({
  mdxOptions: {
    remarkPlugins: (v) => [remarkSnippet, remarkHeadingComponents, ...v],
  },
});
