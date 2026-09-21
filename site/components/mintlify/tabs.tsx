'use client';
import * as React from 'react';

/**
 * <Tabs> and <CodeGroup>, which Mintlify renders as a real tab strip.
 *
 * The first pass shimmed them as plain containers, so every panel stacked
 * on top of the next. On the six "pick your path" guides that is actively
 * misleading: the page reads as three contradictory sets of instructions
 * rather than a choice. Six pages wrap them in .path-picker for exactly
 * that framing.
 *
 * Titles come from the children's props, which is how Mintlify's API works
 * (`<Tab title="...">`); server-rendered MDX children arrive here as plain
 * element descriptors, so reading props off them is safe across the client
 * boundary.
 */
type TabChild = React.ReactElement<{ title?: React.ReactNode; children?: React.ReactNode }>;

function useTabs(children: React.ReactNode) {
  const items = React.Children.toArray(children).filter(
    (c): c is TabChild => React.isValidElement(c),
  );
  const [active, setActive] = React.useState(0);
  const id = React.useId();
  return { items, active, setActive, id };
}

function TabStrip({
  children, className, labelledBy,
}: { children: React.ReactNode; className: string; labelledBy: string }) {
  const { items, active, setActive, id } = useTabs(children);
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

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
    <div className={className}>
      <div className="rl-tablist" role="tablist" aria-label={labelledBy} onKeyDown={onKeyDown}>
        {items.map((item, i) => (
          <button
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-controls={`${id}-panel-${i}`}
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
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          className="rl-tab-panel"
          hidden={i !== active}
        >
          {item.props.children}
        </div>
      ))}
    </div>
  );
}

export const Tabs = ({ children }: { children?: React.ReactNode }) => (
  <TabStrip className="rl-tabs" labelledBy="Options">{children}</TabStrip>
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
  <TabStrip className="rl-codegroup" labelledBy="Code examples">{children}</TabStrip>
);
