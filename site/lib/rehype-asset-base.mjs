/**
 * Applies the `/docs` base to asset URLs, in rehype.
 *
 * Why rehype and not remark: fumadocs appends its own `remarkImage` AFTER
 * any user-supplied remark plugins, and that plugin rewrites image `src`
 * from the node's original URL -- discarding a prefix applied earlier in the
 * remark phase. 396 markdown images came out as `/images/...` and 404'd.
 *
 * rehype runs after every remark plugin, so this is the last word on asset
 * URLs. Links stay in remark-base-path: they are not touched by remarkImage
 * and are already correct there.
 */
const BASE = '/docs';
const ASSET = /^\/(images|videos)\//;

const prefix = (v) =>
  typeof v === 'string' && ASSET.test(v) ? `${BASE}${v}` : v;

export function rehypeAssetBase() {
  return (tree) => {
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      const p = node.properties;
      if (p) {
        for (const key of ['src', 'poster']) {
          if (typeof p[key] === 'string') p[key] = prefix(p[key]);
        }
        if (typeof p.srcSet === 'string') {
          p.srcSet = p.srcSet.split(',').map((part) => {
            const [u, ...rest] = part.trim().split(/\s+/);
            return [prefix(u), ...rest].join(' ');
          }).join(', ');
        }
      }
      for (const c of node.children ?? []) walk(c);
    };
    walk(tree);
  };
}
