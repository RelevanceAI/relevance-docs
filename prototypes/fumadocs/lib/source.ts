import { llms, loader } from 'fumadocs-core/source';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';
import { defineCollections, defineDocs } from 'fumadocs-mdx/macro';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

/**
 * Mintlify frontmatter, accepted verbatim so the .mdx files stay unedited.
 * `sidebarTitle` is Mintlify's sidebar label; Fumadocs does not know the key,
 * so we surface it explicitly rather than letting the schema silently drop it.
 * `sidebardTitle` is a real typo present in the repo -- kept optional so the
 * build reports it instead of failing.
 */
const mintlifySchema = pageSchema.extend({
  sidebarTitle: z.string().optional(),
  sidebardTitle: z.string().optional(),
  mode: z.enum(['wide', 'custom', 'center']).optional(),
  icon: z.string().optional(),
  tag: z.string().optional(),
  api: z.string().optional(),
});

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: mintlifySchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [],
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText('processed')}`,
});

/**
 * Snippets are a second collection so fumadocs-mdx registers an MDX loader
 * (and types) for _snippets/. Without this, `<Snippet file="..." />` cannot
 * import them at all -- the loader is scoped to declared collections.
 */
export const snippets = defineCollections({
  type: 'doc',
  dir: 'content/_snippets',
});
