import { defineConfig } from 'fumadocs-mdx/config';
import { remarkSnippet } from './lib/remark-snippet.mjs';
import { remarkHeadingComponents } from './lib/remark-heading-components.mjs';
import { remarkBasePath } from './lib/remark-base-path.mjs';
import { remarkCodeLang } from './lib/remark-code-lang.mjs';

/**
 * Global MDX options. The <Snippet> rewrite must run BEFORE fumadocs' own
 * remarkInclude, which is what actually inlines the snippet file.
 */
export default defineConfig({
  mdxOptions: {
    remarkPlugins: (v) => [remarkSnippet, remarkHeadingComponents, remarkBasePath, remarkCodeLang, ...v],
  },
});
