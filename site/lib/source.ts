import { createElement, Fragment } from 'react';
import { loader } from 'fumadocs-core/source';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';
import { defineCollections, defineDocs } from 'fumadocs-mdx/macro';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

/**
 * Mintlify frontmatter, accepted verbatim so the .mdx files need no edits.
 *
 * Every key Mintlify supports is declared here rather than dropped, so a
 * typo surfaces as a build error instead of silently doing nothing -- which
 * is how `sidebardTitle` survived in the repo unnoticed.
 */
const mintlifySchema = pageSchema.extend({
  sidebarTitle: z.string().optional(),
  sidebardTitle: z.string().optional(), // known typo, kept so the build reports it
  mode: z.enum(['wide', 'custom', 'center']).optional(),
  icon: z.string().optional(),
  tag: z.string().optional(),
  api: z.string().optional(),
  openapi: z.string().optional(),
  keywords: z.union([z.string(), z.array(z.string())]).optional(),
  'og:title': z.string().optional(),
  'og:description': z.string().optional(),
});

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: mintlifySchema,
    postprocess: {
      // Powers llms.txt / llms-full.txt and the per-page .md mirrors.
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

/**
 * Snippets are a separate collection so fumadocs-mdx registers an MDX loader
 * for _snippets/. Without it, <Snippet file="..." /> cannot resolve at all --
 * the loader is scoped to declared collections.
 */
export const snippets = defineCollections({
  type: 'doc',
  dir: 'content/_snippets',
});

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [],
  pageTree: {
    transformers: [
      {
        /**
         * Mintlify renders `tag:` frontmatter as a pill beside the page's
         * sidebar entry -- how readers are told Subagents and Flow Builder
         * are LEGACY before they open them. Three pages use it, and it was
         * dropped silently.
         */
        file(node, filePath) {
          const file = filePath ? this.storage.read(filePath) : undefined;
          const tag = file?.format === 'page'
            ? (file.data as { tag?: string }).tag
            : undefined;
          if (!tag) return node;

          return {
            ...node,
            name: createElement(
              Fragment,
              null,
              node.name,
              createElement('span', { className: 'rl-nav-tag' }, tag),
            ),
          };
        },
      },
    ],
  },
});
