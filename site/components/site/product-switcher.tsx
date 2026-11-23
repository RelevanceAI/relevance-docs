'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SwitcherProduct {
  name: string;
  href: string;
  prefix: string;
  icon?: React.ReactNode;
}

/**
 * Mintlify's product dropdown, beside the logo: "Product" and "SDK
 * (JavaScript)". Measured on the preview: a 32px trigger (6px 10px, 12px
 * radius, 14px/500) carrying the product's icon and a chevron; a 12px-radius
 * menu below it, the current product in primary with a check.
 *
 * It is a disclosure of links, not an ARIA `menu`: these are navigation, and
 * `menu` would promise arrow-key roving that plain links do not need. It
 * closes on Escape, on an outside press, and when the route changes.
 */
export function ProductSwitcher({ products, overrides = {} }: {
  products: SwitcherProduct[];
  /** URL -> product name, for unlisted pages Mintlify files under another
      product than their prefix suggests. See productOverrides(). */
  overrides?: Record<string, string>;
}) {
  const pathname = usePathname() ?? '';
  const override = overrides[pathname.replace(/\/$/, '')];
  const current =
    (override ? products.find((p) => p.name === override) : undefined) ??
    products
      .filter((p) => p.prefix && (pathname === p.prefix || pathname.startsWith(`${p.prefix}/`)))
      .sort((a, b) => b.prefix.length - a.prefix.length)[0]
    ?? products.find((p) => !p.prefix) ?? products[0];
  const [open, setOpen] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  const id = React.useId();

  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    if (!open) return;
    const onPress = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPress);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPress);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!current || products.length < 2) return null;
  return (
    <div className="rl-product" ref={root}>
      <button type="button" className="rl-product-trigger" aria-expanded={open} aria-controls={id}
        onClick={() => setOpen((o) => !o)}>
        {current.icon ? <span className="rl-product-icon" aria-hidden="true">{current.icon}</span> : null}
        <span>{current.name}</span>
        <svg className="rl-product-chev" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul id={id} className="rl-product-menu" hidden={!open}>
        {products.map((p) => {
          const isCurrent = p === current;
          return (
            <li key={p.name}>
              <Link href={p.href} aria-current={isCurrent ? 'true' : undefined}>
                {p.icon ? <span className="rl-product-icon" aria-hidden="true">{p.icon}</span> : null}
                <span>{p.name}</span>
                {isCurrent ? (
                  <svg className="rl-product-check" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.6"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
