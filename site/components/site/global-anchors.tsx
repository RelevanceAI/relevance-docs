import { getGlobalAnchors } from '@/lib/products';
import { Icon } from '@/components/mintlify';

/**
 * Mintlify's global anchors, pinned above the sidebar tree and scrolling with
 * it. Measured on the preview: 24px rows 16px apart, inset 16px; a 24px tile
 * with a 1px 7% ring around a 16px #A0A0A5 glyph; 14px/500 #525256 text.
 */
export function GlobalAnchors() {
  const anchors = getGlobalAnchors();
  if (!anchors.length) return null;
  return (
    <ul className="rl-anchors">
      {anchors.map((a) => (
        <li key={a.name}>
          <a href={a.href} {...(a.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            <span className="rl-anchor-icon" aria-hidden="true">{a.icon ? <Icon name={a.icon} /> : null}</span>
            <span>{a.name}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
