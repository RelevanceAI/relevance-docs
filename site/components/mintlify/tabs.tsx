'use client';
import * as React from 'react';
import { mintlifyHeadingSlug } from '@/lib/mintlify-slug.mjs';

/**
 * <Tabs> and <CodeGroup>, which Mintlify renders as a real tab strip.
 *
 * The first pass shimmed them as plain containers, so every panel stacked on
 * top of the next. On the six "pick your path" guides that is actively
 * misleading: the page reads as three contradictory sets of instructions
 * rather than a choice.
 *
 * Making them interactive introduced a problem of its own, though. Once only
 * one panel is visible, every anchor inside the others points at hidden
 * content -- 85 table-of-contents entries across 16 pages went dead. Two
 * things fix that, and both match what Mintlify does:
 *
 *  - Tab BUTTONS carry an id slugged from their title, exactly as headings
 *    are (152 of these exist on the live site), so `#no-build` is a real
 *    target.
 *  - A hash pointing anywhere inside a panel opens that panel first, then
 *    scrolls. Mintlify leaves such links scrolling to hidden content; this
 *    is strictly better and costs nothing.
 *
 * Mintlify keeps panel headings out of the table of contents entirely; this
 * build lists them. That cannot be changed from a remark plugin -- fumadocs
 * appends its own remarkHeading, which populates `file.data.toc`, AFTER the
 * user plugin list, so `file.data.toc` is undefined by the time one runs
 * (verified: undefined on all 896 invocations). Revealing the panel makes
 * every one of those entries work, which is the behaviour that matters, so
 * the extra entries stay.
 */
type TabChild = React.ReactElement<{ title?: React.ReactNode; children?: React.ReactNode }>;

const titleOf = (item: TabChild, i: number) =>
  typeof item.props.title === 'string' ? item.props.title : `Tab ${i + 1}`;

function TabStrip({
  children, className, label, slugged, whole = false,
}: { children: React.ReactNode; className: string; label: string; slugged: boolean; whole?: boolean }) {
  const items = React.Children.toArray(children).filter(
    (c): c is TabChild => React.isValidElement(c),
  );
  const [active, setActive] = React.useState(0);
  const uid = React.useId();
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const rootRef = React.useRef<HTMLDivElement>(null);

  // A CodeGroup's tabs are not addressable on Mintlify either, so only
  // content tabs get a slug; everything else falls back to the generated id.
  const tabId = (item: TabChild, i: number) => {
    const slug = slugged ? mintlifyHeadingSlug(titleOf(item, i)) : '';
    return slug || `${uid}-tab-${i}`;
  };

  /** Open whichever panel holds the current hash target. */
  const revealHash = React.useCallback(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash || !rootRef.current) return;

    const panels = rootRef.current.querySelectorAll('[role="tabpanel"]');
    for (let i = 0; i < panels.length; i++) {
      const isTarget = items[i] && tabId(items[i], i) === hash;
      if (isTarget || panels[i].querySelector(`[id="${CSS.escape(hash)}"]`)) {
        setActive(i);
        // Let the panel render before scrolling to something inside it.
        requestAnimationFrame(() => {
          document.getElementById(hash)?.scrollIntoView({ block: 'start' });
        });
        return;
      }
    }
  }, [items]);

  React.useEffect(() => {
    revealHash();
    window.addEventListener('hashchange', revealHash);
    return () => window.removeEventListener('hashchange', revealHash);
  }, [revealHash]);

  // Arrow keys move between tabs, which is what a tablist is expected to do.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (active + delta + items.length) % items.length;
    setActive(next);
    refs.current[next]?.focus();
  };

  if (items.length < 2) return <div className={className}>{children}</div>;

  return (
    <div className={className} ref={rootRef}>
      <div className="rl-tablist" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        {items.map((item, i) => (
          <button
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            id={tabId(item, i)}
            aria-controls={`${uid}-panel-${i}`}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            data-active={i === active || undefined}
            className="rl-tab-button"
            onClick={() => setActive(i)}
          >
            {item.props.title ?? `Tab ${i + 1}`}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${uid}-panel-${i}`}
          aria-labelledby={tabId(item, i)}
          className="rl-tab-panel"
          hidden={i !== active}
        >
          {/* A CodeGroup's child IS the code block: render it whole, minus
              the title the tab already shows. Unwrapping it to its children,
              as a <Tab> is, dropped the .shiki figure that shiki's dual-theme
              colours hang off -- every CodeGroup rendered as plain text. */}
          {whole ? React.cloneElement(item, { title: undefined }) : item.props.children}
        </div>
      ))}
    </div>
  );
}

export const Tabs = ({ children }: { children?: React.ReactNode }) => (
  <TabStrip className="rl-tabs" label="Options" slugged>{children}</TabStrip>
);

/**
 * A single tab outside a <Tabs> -- rare, but it happens -- still needs to
 * render its title and body rather than vanish.
 */
export const Tab = ({ title, children }: { title?: React.ReactNode; children?: React.ReactNode }) => (
  <section className="rl-tab">
    <p className="rl-tab-label">{title}</p>
    <div className="rl-tab-body">{children}</div>
  </section>
);

export const CodeGroup = ({ children }: { children?: React.ReactNode }) => (
  <TabStrip className="rl-codegroup" label="Code examples" slugged={false} whole>{children}</TabStrip>
);
