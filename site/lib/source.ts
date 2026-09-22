import { createElement, Fragment } from 'react';
import { loader } from 'fumadocs-core/source';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';
import { defineCollections, defineDocs } from 'fumadocs-mdx/macro';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';
import type * as PageTree from 'fumadocs-core/page-tree';
import { homeSlug } from './products';

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
          const data = file?.format === 'page'
            ? (file.data as { tag?: string; sidebarTitle?: string })
            : undefined;
          /*
           * Mintlify labels a page in the sidebar by `sidebarTitle` when it has
           * one, and by `title` only otherwise. The schema accepted the key but
           * nothing read it, so 120 pages showed their full title instead --
           * "Using Agents and Workforces in Relevance Chat" where Mintlify says
           * "Using Agents and Workforces".
           */
          const label = data?.sidebarTitle ?? node.name;
          const tag = data?.tag;
          if (!tag && label === node.name) return node;

          return {
            ...node,
            name: tag
              ? createElement(Fragment, null, label, createElement('span', { className: 'rl-nav-tag' }, tag))
              : label,
          };
        },
      },
    ],
  },
});

/*
 * A page docs.json does not list still opens inside a tab on Mintlify: the
 * tab row shows, that tab is active, and its sidebar is the one beside the
 * page -- with nothing highlighted, since the page is not in it. Fumadocs
 * finds a page's tab by searching the tree, so an unlisted page (it lands in
 * the loader's `fallback` tree) found none: no tab row, and a sidebar of
 * every tab at once.
 *
 * So each one is appended to the tab it is filed under (homeSlug) as an item
 * the sidebar hides (.rl-nav-orphan in relevance.css), and that the eyebrow
 * and prev / next skip by its `orphan:` id. This runs on the built tree, not
 * as a `root` transformer: the loader adds its own fallback transformer
 * after ours, so the fallback tree does not exist yet when ours runs. The
 * loader caches the tree, so filing it once here is permanent.
 */
function fileOrphans(tree: PageTree.Root) {
  const orphans: PageTree.Item[] = [];
  (function collect(nodes: PageTree.Node[]) {
    for (const n of nodes) {
      if (n.type === 'page') orphans.push(n);
      else if (n.type === 'folder') { if (n.index) orphans.push(n.index); collect(n.children); }
    }
  })(tree.fallback?.children ?? []);

  const tabOf = (url: string): PageTree.Folder | undefined => {
    let found: PageTree.Folder | undefined;
    (function walk(nodes: PageTree.Node[], tab?: PageTree.Folder): boolean {
      for (const n of nodes) {
        if (n.type === 'page' && n.url === url) { found = tab; return true; }
        if (n.type === 'folder') {
          const t = n.root ? n : tab;
          if (n.index?.url === url) { found = t; return true; }
          if (walk(n.children, t)) return true;
        }
      }
      return false;
    })(tree.children);
    return found;
  };

  for (const page of orphans) {
    const tab = tabOf(`${docsRoute}/${homeSlug(page.url)}`);
    if (!tab) continue;
    tab.children.push({
      ...page,
      $id: `orphan:${page.url}`,
      name: createElement('span', { className: 'rl-nav-orphan' }, page.name),
    });
  }
}
fileOrphans(source.getPageTree());
