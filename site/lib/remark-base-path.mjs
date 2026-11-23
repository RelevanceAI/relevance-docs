/**
 * Applies the `/docs` basePath to root-relative links and raw asset refs.
 *
 * Mintlify serves the docs at the root of its own host, so CLAUDE.md tells
 * authors to write internal links as `/get-started/support`. Under Next's
 * basePath those resolve to the site root, not the docs root: a link check
 * over the first full build found 124 distinct broken targets across 1,547
 * internal links. Nothing in Next or Fumadocs rewrites them.
 *
 * Scope is narrow and hard-won:
 *
 *   PREFIXED  - raw `src`/`poster`/`srcSet` attributes, and raw HTML `src`.
 *               Plain <img> is emitted as-is, so nothing else adds the base.
 *
 *   PREFIXED  - markdown/JSX LINKS. Fumadocs renders absolute MDX links as
 *               plain <a>, which nothing rewrites, so without this every
 *               in-page link 404s for crawlers and with JS disabled.
 *
 *   PREFIXED  - markdown IMAGES. With remarkImageOptions.useImport disabled
 *               these keep their own URL instead of becoming bundled static
 *               imports, so they need the base like any other asset. This
 *               plugin runs AFTER remarkImage so the file has already been
 *               resolved and measured from its original path.
 *
 * Deliberately NOT handled: markdown IMAGES (`![](/images/x.png)`).
 * fumadocs-mdx turns those into static imports resolved from public/, and
 * prefixing them makes the build look for `public/docs/images/...` and fail.
 */
const BASE = '/docs';

// Anything rooted at "/" that is not already under the base and is not a
// protocol-relative URL.
const isInternalRoot = (v) =>
  typeof v === 'string' &&
  v.startsWith('/') &&
  !v.startsWith('//') &&
  !v.startsWith(`${BASE}/`) &&
  v !== BASE;

const prefix = (v) => (isInternalRoot(v) ? `${BASE}${v}` : v);

export function remarkBasePath() {
  return (tree) => {
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;

      if ((node.type === 'link' || node.type === 'definition' || node.type === 'image')
          && typeof node.url === 'string') {
        node.url = prefix(node.url);
      }

      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        for (const attr of node.attributes ?? []) {
          if (attr.type !== 'mdxJsxAttribute') continue;
          if (['href', 'src', 'poster'].includes(attr.name) && typeof attr.value === 'string') {
            attr.value = prefix(attr.value);
          }
          if (attr.name === 'srcSet' && typeof attr.value === 'string') {
            attr.value = attr.value.split(',').map((part) => {
              const [u, ...rest] = part.trim().split(/\s+/);
              return [prefix(u), ...rest].join(' ');
            }).join(', ');
          }
        }
      }

      if (node.type === 'html' && typeof node.value === 'string') {
        node.value = node.value.replace(
          /\b(href|src|poster)=("|')(\/[^"']*)\2/g,
          (m, a, q, u) => (isInternalRoot(u) ? `${a}=${q}${BASE}${u}${q}` : m),
        );
      }

      for (const c of node.children ?? []) walk(c);
    };
    walk(tree);
  };
}
