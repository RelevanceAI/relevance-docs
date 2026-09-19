/**
 * Mintlify component shims.
 *
 * Registered globally through getMDXComponents(), so the .mdx files reference
 * <Accordion>, <Card>, <Note> etc. with no imports -- exactly as they do in
 * Mintlify today. The content tree migrates unedited.
 *
 * Markup emits stable .rl-* class names; all styling lives in
 * app/relevance.css so the design can change without touching these.
 */
import * as React from 'react';

type Kids = { children?: React.ReactNode };

/**
 * Mintlify icons are Font Awesome names (`icon="chart-line"`). Rendering the
 * prop directly would print the NAME as text. 257 of the 297 distinct names
 * used in this repo are in FA Free; 40 (75 usages) are Pro-only and render as
 * an empty slot rather than leaking the raw string.
 */
/**
 * Font Awesome PRO names used in the corpus, mapped to the closest Free
 * equivalent. Mintlify bundles FA Pro; self-hosting does not, and an
 * unmapped Pro name renders as a blank square. 41 names / 81 usages.
 *
 * Buying an FA Pro licence would let this table be deleted -- `brand-android`,
 * `notion` and `typewriter` are the only ones with no close Free match.
 */
const PRO_TO_FREE: Record<string, string> = {
  'alarm-clock': 'clock',
  'brain-circuit': 'brain',
  'brand-android': 'robot',
  'brand-apple': 'apple-whole',
  browser: 'window-maximize',
  'building-magnifying-glass': 'magnifying-glass-location',
  buildings: 'building',
  'calendar-clock': 'calendar-days',
  'calendar-pen': 'calendar-check',
  calendars: 'calendar-days',
  'chart-line-down': 'arrow-trend-down',
  'chart-mixed': 'chart-simple',
  'chart-network': 'diagram-project',
  'face-awesome': 'face-smile',
  'file-chart-column': 'file-lines',
  'file-plus': 'file-circle-plus',
  files: 'copy',
  'folder-arrow-up': 'folder-open',
  'folder-magnifying-glass': 'folder-open',
  grid: 'table-cells',
  megaphone: 'bullhorn',
  'message-bot': 'robot',
  'message-lines': 'comment-dots',
  messages: 'comments',
  note: 'note-sticky',
  notion: 'book',
  'objects-column': 'table-columns',
  'phone-arrow-up-right': 'phone-volume',
  presentation: 'chalkboard',
  'presentation-screen': 'chalkboard-user',
  'screen-users': 'users-rectangle',
  'shield-check': 'shield-halved',
  sparkles: 'wand-magic-sparkles',
  'table-layout': 'table-list',
  text: 'align-left',
  'trophy-star': 'trophy',
  typewriter: 'keyboard',
  'user-magnifying-glass': 'user-check',
  'user-tie-hair-long': 'user-tie',
  'wave-sine': 'wave-square',
  waveform: 'wave-square',
};

export function Icon({ name, style = 'solid' }: { name?: unknown; style?: string }) {
  if (typeof name !== 'string' || !name) return null;
  const resolved = PRO_TO_FREE[name] ?? name;
  return <i className={`fa-${style} fa-${resolved} rl-icon`} aria-hidden />;
}

/* ---------------------------------------------------------------- callouts */

const VARIANTS = ['note', 'tip', 'warning', 'info', 'check', 'danger'] as const;
type Variant = (typeof VARIANTS)[number];

// Mintlify shows a glyph per callout type; the 6 built-ins take no icon prop,
// so the variant chooses it.
const CALLOUT_ICON: Record<Variant, string> = {
  note: 'circle-info',
  info: 'circle-info',
  tip: 'lightbulb',
  check: 'circle-check',
  warning: 'triangle-exclamation',
  danger: 'circle-exclamation',
};

export function Callout({
  children, variant = 'note', icon, color,
}: Kids & { variant?: Variant; icon?: unknown; color?: string }) {
  return (
    <aside
      className={`rl-callout rl-callout--${variant}`}
      style={color ? ({ ['--rl-cal' as string]: color } as React.CSSProperties) : undefined}
    >
      <span className="rl-callout-mark" aria-hidden>
        <Icon name={typeof icon === 'string' && icon ? icon : CALLOUT_ICON[variant]} />
      </span>
      <div className="rl-callout-body">{children}</div>
    </aside>
  );
}

// The 6 built-ins take NO attributes in Mintlify -- each is a fixed variant.
export const Note = (p: Kids) => <Callout variant="note" {...p} />;
export const Tip = (p: Kids) => <Callout variant="tip" {...p} />;
export const Warning = (p: Kids) => <Callout variant="warning" {...p} />;
export const Info = (p: Kids) => <Callout variant="info" {...p} />;
export const Check = (p: Kids) => <Callout variant="check" {...p} />;
export const Danger = (p: Kids) => <Callout variant="danger" {...p} />;

/* --------------------------------------------------------------- accordion */

export function Accordion({
  title, children, defaultOpen, icon,
}: Kids & { title?: React.ReactNode; defaultOpen?: boolean; icon?: unknown }) {
  return (
    <details className="rl-accordion" open={defaultOpen}>
      <summary className="rl-accordion-summary">
        <Icon name={icon} />
        <span className="rl-accordion-title">{title}</span>
        <svg className="rl-chev" viewBox="0 0 16 16" aria-hidden>
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="rl-accordion-body">{children}</div>
    </details>
  );
}
export const AccordionGroup = ({ children }: Kids) => (
  <div className="rl-accordion-group">{children}</div>
);

/* ------------------------------------------------------------------- cards */

export function Card({
  title, icon, href, horizontal, children,
}: Kids & { title?: React.ReactNode; icon?: unknown; href?: string; horizontal?: boolean }) {
  const inner = (
    <>
      {icon ? <span className="rl-card-icon"><Icon name={icon} /></span> : null}
      <span className="rl-card-main">
        {title ? <span className="rl-card-title">{title}</span> : null}
        {children ? <span className="rl-card-body">{children}</span> : null}
      </span>
      {href ? (
        <svg className="rl-card-arrow" viewBox="0 0 16 16" aria-hidden>
          <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </>
  );
  const cls = `rl-card${horizontal ? ' rl-card--h' : ''}`;
  return href
    ? <a className={cls} href={href}>{inner}</a>
    : <div className={cls}>{inner}</div>;
}

export const CardGroup = ({ cols = 2, children }: Kids & { cols?: number | string }) => (
  <div className="rl-card-group" data-cols={String(cols)}>{children}</div>
);

export const Columns = ({ cols = 2, children }: Kids & { cols?: number | string }) => (
  <div className="rl-card-group" data-cols={String(cols)}>{children}</div>
);

/* ------------------------------------------------------------------- steps */

export const Steps = ({ children }: Kids) => <div className="rl-steps">{children}</div>;
export const Step = ({ title, icon, children }: Kids & { title?: React.ReactNode; icon?: unknown }) => (
  <div className="rl-step">
    <div className="rl-step-marker" aria-hidden />
    <div className="rl-step-content">
      {title ? <p className="rl-step-title"><Icon name={icon} />{title}</p> : null}
      {children}
    </div>
  </div>
);

/* --------------------------------------------------------------- api field */

function Field({
  name, type, required, def, deprecated, children,
}: Kids & { name?: string; type?: unknown; required?: unknown; def?: unknown; deprecated?: unknown }) {
  return (
    <div className="rl-param">
      <div className="rl-param-head">
        {name ? <code className="rl-param-name">{name}</code> : null}
        {type ? <span className="rl-param-type">{String(type)}</span> : null}
        {required ? <span className="rl-param-req">required</span> : null}
        {deprecated ? <span className="rl-param-dep">deprecated</span> : null}
        {def !== undefined && def !== null
          ? <span className="rl-param-default">default: <code>{String(def)}</code></span>
          : null}
      </div>
      <div className="rl-param-body">{children}</div>
    </div>
  );
}

export function ParamField({
  query, path, body, header, type, required, default: def, deprecated, children,
}: Kids & Record<string, unknown>) {
  const name = [query, path, body, header].find((v) => typeof v === 'string') as string | undefined;
  return <Field name={name} type={type} required={required} def={def} deprecated={deprecated}>{children}</Field>;
}

export function ResponseField({
  name, type, required, default: def, deprecated, children,
}: Kids & Record<string, unknown>) {
  return (
    <Field name={name as string} type={type} required={required} def={def} deprecated={deprecated}>
      {children}
    </Field>
  );
}

// Mintlify nests <Expandable> inside a field to reveal sub-properties.
export const Expandable = ({ title, children }: Kids & { title?: string }) => (
  <details className="rl-expandable">
    <summary>{title ?? 'properties'}</summary>
    <div className="rl-expandable-body">{children}</div>
  </details>
);

/* ------------------------------------------------------------ misc wrappers */

export const Frame = ({ caption, children }: Kids & { caption?: React.ReactNode }) => (
  <figure className="rl-frame">
    <div className="rl-frame-inner">{children}</div>
    {caption ? <figcaption className="rl-frame-caption">{caption}</figcaption> : null}
  </figure>
);

export const Badge = ({ children, color }: Kids & { color?: string }) => (
  <span className="rl-badge" data-color={color}>{children}</span>
);

export const Tooltip = ({ tip, children }: Kids & { tip?: string }) => (
  <span className="rl-tooltip" title={tip}>{children}</span>
);

export const Update = ({
  label, description, tags, children,
}: Kids & { label?: string; description?: string; tags?: unknown }) => (
  <article className="rl-update">
    <div className="rl-update-meta">
      {label ? <div className="rl-update-label">{label}</div> : null}
      {description ? <div className="rl-update-desc">{description}</div> : null}
      {Array.isArray(tags) && tags.length
        ? <div className="rl-update-tags">{tags.map((t) => <span key={String(t)} className="rl-badge">{String(t)}</span>)}</div>
        : null}
    </div>
    <div className="rl-update-body">{children}</div>
  </article>
);

/* -------------------------------------------------------------------- tabs */

export const Tabs = ({ children }: Kids) => <div className="rl-tabs">{children}</div>;
export const Tab = ({ title, children }: Kids & { title?: React.ReactNode }) => (
  <section className="rl-tab">
    <h4 className="rl-tab-label">{title}</h4>
    <div className="rl-tab-body">{children}</div>
  </section>
);
export const CodeGroup = ({ children }: Kids) => <div className="rl-codegroup">{children}</div>;

/* Mintlify API-example wrappers -- render as plain blocks. */
export const RequestExample = ({ children }: Kids) => <div className="rl-example">{children}</div>;
export const ResponseExample = ({ children }: Kids) => <div className="rl-example">{children}</div>;
