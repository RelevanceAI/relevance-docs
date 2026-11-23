import fs from 'node:fs';
import path from 'node:path';

/**
 * docs.json's `navigation.products`, reduced to what the navbar switcher needs.
 *
 * Mintlify nests products ABOVE tabs: "Product" holds the six tabs, "SDK
 * (JavaScript)" holds its own groups and no tabs, and a dropdown beside the
 * logo switches between them. Fumadocs can express that only by nesting the
 * product directories, which would move every file and break the 289 indexed
 * URLs -- so the switcher is ours, and it is derived from docs.json here so
 * it cannot drift from it.
 *
 * `prefix` is the URL prefix every page of the product shares, or '' when
 * they share none. A product with no prefix is the fallback: it owns every
 * page no other product claims, which is how "Product" owns /docs/community.
 */
export interface ProductInfo {
  name: string;
  icon?: string;
  href: string;
  prefix: string;
  hasTabs: boolean;
}

type Node = string | { pages?: Node[]; groups?: Node[]; tabs?: Node[] } | Node[];

function slugs(n: Node, out: string[] = []): string[] {
  if (typeof n === 'string') out.push(n);
  else if (Array.isArray(n)) n.forEach((c) => slugs(c, out));
  else if (n) [n.pages, n.groups, n.tabs].forEach((c) => c && slugs(c, out));
  return out;
}

let cached: ProductInfo[] | undefined;
export function getProducts(): ProductInfo[] {
  if (cached) return cached;
  const docsJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), '..', 'docs.json'), 'utf8'));
  cached = (docsJson.navigation?.products ?? []).map(
    (p: { product: string; icon?: string; tabs?: Node[]; groups?: Node[]; pages?: Node[] }) => {
      const all = slugs(p as Node);
      const first = all[0]?.split('/')[0];
      const shared = first && all.every((s) => s === first || s.startsWith(`${first}/`));
      return {
        name: p.product,
        icon: p.icon,
        href: `/docs/${all[0] ?? ''}`,
        prefix: shared ? `/docs/${first}` : '',
        hasTabs: Array.isArray(p.tabs) && p.tabs.length > 0,
      };
    },
  );
  return cached!;
}

/** Every page docs.json navigates to, in sidebar order across all products. */
let navCache: string[] | undefined;
export function getNavSlugs(): string[] {
  if (navCache) return navCache;
  const docsJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), '..', 'docs.json'), 'utf8'));
  navCache = slugs((docsJson.navigation?.products ?? []) as Node);
  return navCache;
}

/**
 * The docs.json page a URL is filed under. A navigated page is filed under
 * itself. A page docs.json does not list -- 94 of them are served -- is filed
 * the way Mintlify files it, which decides the tab row, the sidebar and the
 * product it is shown with: under the listed page whose slug shares the
 * longest run of leading CHARACTERS with its own, the first such page on a
 * tie, and the first page of all when nothing matches. Characters, not path
 * segments: that is why Mintlify shows /api-reference/* in Access &
 * Administration ("a" of admin/), /embed/* in Enterprise and /support in the
 * SDK. Checked on the preview against all 94 unlisted pages it serves.
 */
export function homeSlug(url: string): string {
  const slug = url.replace(/^\/docs\/?/, '');
  const nav = getNavSlugs();
  if (nav.includes(slug)) return slug;
  let best = nav[0] ?? '';
  let bestLen = 0;
  for (const s of nav) {
    let n = 0;
    while (n < s.length && n < slug.length && s[n] === slug[n]) n++;
    if (n > bestLen) { best = s; bestLen = n; }
  }
  return best;
}

function byPrefix(url: string, products: ProductInfo[]): ProductInfo | undefined {
  return products
    .filter((p) => p.prefix && (url === p.prefix || url.startsWith(`${p.prefix}/`)))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]
    ?? products.find((p) => !p.prefix) ?? products[0];
}

/** The product that owns a URL: the product of the page it is filed under. */
export function productFor(url: string, products = getProducts()): ProductInfo | undefined {
  return byPrefix(`/docs/${homeSlug(url)}`, products);
}

/**
 * The unlisted pages whose product is not the one their own URL prefix
 * suggests -- only /docs/support today. The navbar switcher runs in the
 * browser, where docs.json is not available, so it is handed these instead.
 */
export function productOverrides(): Record<string, string> {
  const products = getProducts();
  const nav = new Set(getNavSlugs());
  const out: Record<string, string> = {};
  const root = path.join(process.cwd(), 'content', 'docs');
  (function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.mdx')) continue;
      const slug = path.relative(root, p).slice(0, -'.mdx'.length).replace(/(^|\/)index$/, '');
      if (nav.has(slug)) continue;
      const url = slug ? `/docs/${slug}` : '/docs';
      const want = productFor(url, products);
      if (want && want !== byPrefix(url, products)) out[url] = want.name;
    }
  })(root);
  return out;
}

/**
 * docs.json's `navigation.global.anchors`: the links Mintlify pins above the
 * sidebar tree. Relative hrefs are docs pages; absolute ones are rendered the
 * way Mintlify renders them -- in a new tab -- even when they point back at
 * relevanceai.com/docs, because that is what the config asks for. Make the
 * href relative in docs.json to keep a link in the same tab.
 */
export interface AnchorInfo { name: string; href: string; icon?: string; external: boolean }

let anchors: AnchorInfo[] | undefined;
export function getGlobalAnchors(): AnchorInfo[] {
  if (anchors) return anchors;
  const docsJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), '..', 'docs.json'), 'utf8'));
  anchors = (docsJson.navigation?.global?.anchors ?? []).map(
    (a: { anchor: string; href: string; icon?: string }) => {
      const external = /^https?:\/\//.test(a.href);
      return { name: a.anchor, icon: a.icon, external, href: external ? a.href : `/docs${a.href.startsWith('/') ? '' : '/'}${a.href}` };
    },
  );
  return anchors!;
}
