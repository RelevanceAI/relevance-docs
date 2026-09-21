import { source } from '@/lib/source';

/**
 * Previous / next page links.
 *
 * Mintlify renders these at the bottom of every page. Fumadocs' DocsPage
 * `footer` option renders nothing in this setup -- verified on the deployed
 * preview, where no nav/footer element appeared on any page -- so the page
 * tree is flattened here instead, which gives exactly the sidebar's reading
 * order.
 */
type Node = { type?: string; name?: unknown; url?: string; index?: Node; children?: Node[] };

function flatten(nodes: Node[], out: { url: string; name: string }[] = []) {
  for (const node of nodes) {
    if (node.index?.url) {
      out.push({ url: node.index.url, name: String(node.index.name ?? node.name ?? '') });
    }
    if (typeof node.url === 'string') {
      out.push({ url: node.url, name: String(node.name ?? '') });
    }
    if (node.children) flatten(node.children, out);
  }
  return out;
}

export function PageNav({ url }: { url: string }) {
  const tree = source.getPageTree() as unknown as Node;
  const seen = new Set<string>();
  const ordered = flatten(tree.children ?? []).filter((p) => !seen.has(p.url) && seen.add(p.url));

  const i = ordered.findIndex((p) => p.url === url);
  // Orphan pages are served but unlisted, so they have no neighbours.
  if (i === -1) return null;
  const previous = i > 0 ? ordered[i - 1] : null;
  const next = i < ordered.length - 1 ? ordered[i + 1] : null;
  if (!previous && !next) return null;

  return (
    <nav className="rl-page-nav" aria-label="Page navigation">
      {previous ? (
        <a className="rl-page-nav-link rl-page-nav-link--prev" href={previous.url}>
          <span className="rl-page-nav-dir">
            <i className="fa-solid fa-arrow-left rl-icon" aria-hidden /> Previous
          </span>
          <span className="rl-page-nav-title">{previous.name}</span>
        </a>
      ) : <span />}
      {next ? (
        <a className="rl-page-nav-link rl-page-nav-link--next" href={next.url}>
          <span className="rl-page-nav-dir">
            Next <i className="fa-solid fa-arrow-right rl-icon" aria-hidden />
          </span>
          <span className="rl-page-nav-title">{next.name}</span>
        </a>
      ) : <span />}
    </nav>
  );
}
