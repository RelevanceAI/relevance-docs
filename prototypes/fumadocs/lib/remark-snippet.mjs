import path from 'node:path';

/**
 * Rewrites Mintlify's <Snippet file="x.mdx" /> into Fumadocs' native
 * <include>...</include> tag, which fumadocs-mdx then inlines at build time.
 *
 * Doing it this way means snippets ride the framework's own include pipeline
 * (caching, watch-mode invalidation, processed-markdown output for llms.txt)
 * rather than a hand-maintained import map. The .mdx files keep Mintlify's
 * <Snippet> syntax untouched.
 *
 * Must run BEFORE remarkInclude in the plugin order.
 */
const SNIPPET_ROOT = path.resolve(import.meta.dirname, '../content/_snippets');

export function remarkSnippet() {
  return (tree, file) => {
    const from = path.dirname(file.path ?? file.history?.[0] ?? '');

    const walk = (node) => {
      if (!node?.children) return;
      node.children = node.children.map((child) => {
        if (
          (child.type === 'mdxJsxFlowElement' || child.type === 'mdxJsxTextElement') &&
          child.name === 'Snippet'
        ) {
          const attr = (child.attributes ?? []).find((a) => a.name === 'file');
          if (typeof attr?.value === 'string') {
            let rel = path.relative(from, path.join(SNIPPET_ROOT, attr.value));
            if (!rel.startsWith('.')) rel = `./${rel}`;
            return {
              type: 'mdxJsxFlowElement',
              name: 'include',
              attributes: [],
              children: [{ type: 'text', value: rel.split(path.sep).join('/') }],
            };
          }
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}
