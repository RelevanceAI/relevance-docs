/**
 * Mintlify component shims for Fumadocs.
 *
 * Same class contract (.rl-*) and same shared CSS as the Starlight prototype,
 * so any visual difference between the two prototypes comes from the
 * framework rather than the styling.
 *
 * Unlike Starlight, these need NO build-time import injection: Fumadocs maps
 * components globally through getMDXComponents(), so the .mdx files reference
 * <Accordion> with no import, exactly as they do in Mintlify.
 */
import * as React from 'react';

type Kids = { children?: React.ReactNode };

const variants = ['note', 'tip', 'warning', 'info', 'check', 'danger'] as const;
type Variant = (typeof variants)[number];

export function Callout({
  children, variant = 'note', icon, color,
}: Kids & { variant?: Variant; icon?: React.ReactNode; color?: string }) {
  return (
    <aside
      className={`rl-callout rl-callout--${variant}`}
      style={color ? ({ ['--rl-cal' as string]: color } as React.CSSProperties) : undefined}
    >
      {icon ? <span className="rl-callout-icon" aria-hidden>{icon}</span> : null}
      <div>{children}</div>
    </aside>
  );
}

// Mintlify's 6 built-ins take no attributes -- each is a fixed variant.
export const Note = (p: Kids) => <Callout variant="note" {...p} />;
export const Tip = (p: Kids) => <Callout variant="tip" {...p} />;
export const Warning = (p: Kids) => <Callout variant="warning" {...p} />;
export const Info = (p: Kids) => <Callout variant="info" {...p} />;
export const Check = (p: Kids) => <Callout variant="check" {...p} />;
export const Danger = (p: Kids) => <Callout variant="danger" {...p} />;

export function Accordion({
  title, children, defaultOpen, icon,
}: Kids & { title?: string; defaultOpen?: boolean; icon?: React.ReactNode }) {
  return (
    <details className="rl-accordion" open={defaultOpen}>
      <summary>{icon ? <span aria-hidden>{icon}</span> : null}{title}</summary>
      <div className="rl-accordion-body">{children}</div>
    </details>
  );
}
export const AccordionGroup = ({ children }: Kids) => (
  <div className="rl-accordion-group">{children}</div>
);

export function Card({
  title, icon, href, children,
}: Kids & { title?: string; icon?: React.ReactNode; href?: string }) {
  const inner = (
    <>
      {title ? <div className="rl-card-title">{icon ? <span aria-hidden>{icon}</span> : null}{title}</div> : null}
      <div className="rl-card-body">{children}</div>
    </>
  );
  return href
    ? <a className="rl-card" href={href}>{inner}</a>
    : <div className="rl-card">{inner}</div>;
}
export const CardGroup = ({ cols = 2, children }: Kids & { cols?: number }) => (
  <div className="rl-card-group" data-cols={String(cols)}>{children}</div>
);

export const Steps = ({ children }: Kids) => <ol className="rl-steps">{children}</ol>;
export const Step = ({ title, children }: Kids & { title?: string }) => (
  <li className="rl-step">
    {title ? <p className="rl-step-title">{title}</p> : null}
    {children}
  </li>
);

export function ParamField({
  query, path, body, header, type, required, default: def, children,
}: Kids & Record<string, unknown>) {
  const name = (query ?? path ?? body ?? header) as string;
  return (
    <div className="rl-param">
      <div className="rl-param-head">
        <code className="rl-param-name">{name}</code>
        {type ? <span className="rl-param-type">{String(type)}</span> : null}
        {required ? <span className="rl-param-req">required</span> : null}
        {def !== undefined ? <span className="rl-param-type">default: {String(def)}</span> : null}
      </div>
      <div className="rl-param-body">{children}</div>
    </div>
  );
}

export const Frame = ({ caption, children }: Kids & { caption?: string }) => (
  <figure className="rl-frame">
    {children}
    {caption ? <figcaption className="rl-frame-caption">{caption}</figcaption> : null}
  </figure>
);
export const Columns = ({ cols = 2, children }: Kids & { cols?: number }) => (
  <div className="rl-columns" style={{ gridTemplateColumns: `repeat(${cols},minmax(0,1fr))` }}>
    {children}
  </div>
);
export const Badge = ({ children }: Kids) => <span className="rl-badge">{children}</span>;
export const Tooltip = ({ tip, children }: Kids & { tip?: string }) => (
  <span className="rl-tooltip" title={tip}>{children}</span>
);
export const Update = ({ label, description, children }: Kids & { label?: string; description?: string }) => (
  <article className="rl-update">
    <div className="rl-update-meta">
      <div>{label}</div>
      {description ? <div>{description}</div> : null}
    </div>
    <div className="rl-update-body">{children}</div>
  </article>
);

export const Tabs = ({ children }: Kids) => <div className="rl-tabs">{children}</div>;
export const Tab = ({ title, children }: Kids & { title?: string }) => (
  <section className="rl-tab" data-title={title}>
    <h4 className="rl-tab-label">{title}</h4>
    <div className="rl-tab-body">{children}</div>
  </section>
);
export const CodeGroup = ({ children }: Kids) => <Tabs>{children}</Tabs>;
