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
import { mintlifyAccordionSlug } from '@/lib/mintlify-slug.mjs';

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

const VARIANTS = ['note', 'tip', 'warning', 'info', 'check', 'danger', 'custom'] as const;
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
  custom: 'circle-info',
};

/** Spoken before the body so the variant is not carried by colour alone. */
const LABEL: Record<Variant, string> = {
  note: 'Note',
  info: 'Info',
  tip: 'Tip',
  check: 'Check',
  warning: 'Warning',
  danger: 'Danger',
  custom: 'Note',
};

/*
 * A bare <Callout> is its own style in Mintlify, not a Note: neutral gray
 * (50% gray-50 fill, 20% gray-500 hairline, gray-900 text), or -- given
 * `color` -- that colour at 10% for the fill, 20% for the hairline, and mixed
 * half with black for the text. It rendered as a blue Note here.
 */
export function Callout({
  children, variant = 'custom', icon, color,
}: Kids & { variant?: Variant; icon?: unknown; color?: string }) {
  return (
    // A <div role="note">, not an <aside>: <aside> inside <main> is a
    // complementary landmark that is not top level, which axe flags on every
    // callout (30 on the five pages sampled). The glyph is decorative, so the
    // variant is carried by visually hidden text instead -- without it a
    // screen reader cannot tell a Warning from a Tip.
    <div
      role="note"
      className={`rl-callout rl-callout--${variant}`}
      style={color ? ({ ['--rl-cal-c' as string]: color } as React.CSSProperties) : undefined}
    >
      <span className="rl-callout-mark" aria-hidden>
        <Icon name={typeof icon === 'string' && icon ? icon : CALLOUT_ICON[variant]} />
      </span>
      <div className="rl-callout-body">
        <span className="rl-sr-only">{LABEL[variant]}: </span>
        {children}
      </div>
    </div>
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

/**
 * Mintlify gives every accordion heading an id of `<slug>-accordion-title`,
 * derived from the title with a different rule than it uses for headings --
 * see lib/mintlify-slug.mjs. Nothing in the docs links to one today, but
 * they are addressable URLs Mintlify serves, so they are reproduced.
 */
function accordionId(title: React.ReactNode): string | undefined {
  const text = typeof title === 'string' ? title
    : typeof title === 'number' ? String(title)
    : undefined;
  if (!text) return undefined;
  const slug = mintlifyAccordionSlug(text);
  return slug ? `${slug}-accordion-title` : undefined;
}

export function Accordion({
  title, children, defaultOpen, icon,
}: Kids & { title?: React.ReactNode; defaultOpen?: boolean; icon?: unknown }) {
  return (
    <details className="rl-accordion" open={defaultOpen}>
      {/* Mintlify's order: a filled caret (pointing right until open), then
          the optional icon, then the title at 500 -- not a trailing chevron. */}
      <summary className="rl-accordion-summary">
        <span className="rl-accordion-caret" aria-hidden>
          <svg viewBox="0 0 12 12" focusable="false">
            <path d="M2.3 3.4h7.4a.8.8 0 0 1 .64 1.28L6.64 9.5a.8.8 0 0 1-1.28 0L1.66 4.68A.8.8 0 0 1 2.3 3.4z" fill="currentColor" />
          </svg>
        </span>
        {icon ? <span className="rl-accordion-icon"><Icon name={icon} /></span> : null}
        <span className="rl-accordion-title" id={accordionId(title)}>{title}</span>
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
  /*
   * Mintlify's card: bare icon on its own line, then an <h2> title, then the
   * body -- and no chevron on linked cards. The title really is a heading
   * there, which is what fills the page's table of contents: rendering it as
   * a <span> silently dropped 14 of the 20 entries Mintlify listed on
   * /get-started/core-concepts/mcp-plugins alone.
   *
   * It is deliberately NOT given an id, exactly as Mintlify leaves it, so no
   * new anchors appear and check-anchors stays green.
   */
  const inner = (
    <>
      {icon ? <span className="rl-card-icon"><Icon name={icon} /></span> : null}
      <div className="rl-card-main">
        {title ? <h2 className="rl-card-title">{title}</h2> : null}
        {/* A div, not a span: the body is MDX, so it arrives wrapped in <p>,
            and block content inside phrasing content is what makes the parser
            close the element early and desync hydration -- see
            tools/check-content.mjs. */}
        {children ? <div className="rl-card-body">{children}</div> : null}
      </div>
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
/*
 * Mintlify puts the icon IN the marker, replacing the number -- it shows one
 * or the other, never both. Rendering the number in the circle and the icon
 * again beside the title was the difference that made numbered steps look
 * doubled up.
 */
export const Step = ({ title, icon, children }: Kids & { title?: React.ReactNode; icon?: unknown }) => (
  <div className="rl-step" data-icon={icon ? '' : undefined}>
    <div className="rl-step-marker" aria-hidden>{icon ? <Icon name={icon} /> : null}</div>
    <div className="rl-step-content">
      {title ? <p className="rl-step-title">{title}</p> : null}
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

/*
 * Mintlify nests <Expandable> inside a field to reveal sub-properties. Its
 * summary reads "Show {title}" closed and "Hide {title}" open, behind a small
 * chevron. Both words are rendered and CSS keys the visible one off the
 * native `open` attribute, so this stays a server component with no state --
 * and the hidden word is display:none, so it is out of the accessible name
 * rather than read as "Show Hide".
 */
export const Expandable = ({ title, children }: Kids & { title?: string }) => (
  <details className="rl-expandable">
    <summary>
      <svg className="rl-expandable-chev" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="rl-expandable-label">
        <span className="rl-exp-show">Show</span><span className="rl-exp-hide">Hide</span> {title ?? 'properties'}
      </span>
    </summary>
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

// Tabs, Tab and CodeGroup need state, so they live behind a client boundary.
// Tab labels its panel with a <p>, not an <h4>: they label rather than
// section, and 166 injected h4s were breaking the heading outline on 45
// pages (h2 -> h4 skips).
export { Tabs, Tab, CodeGroup } from './tabs';
export { Tooltip } from './tooltip';

/** First line of text inside a node, for naming a table by its columns. */
function firstText(node: React.ReactNode, limit = 6): string[] {
  const out: string[] = [];
  const walk = (n: React.ReactNode) => {
    if (out.length >= limit || n == null || typeof n === 'boolean') return;
    if (typeof n === 'string' || typeof n === 'number') {
      const t = String(n).trim();
      if (t) out.push(t);
      return;
    }
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (React.isValidElement(n)) {
      const props = n.props as { children?: React.ReactNode };
      walk(props.children);
    }
  };
  walk(node);
  return out;
}

/**
 * Tables scroll horizontally on narrow viewports. Without a focusable, named
 * region the overflowed columns cannot be reached by keyboard at all -- 25
 * such regions per page on a phone. Mintlify wraps them identically.
 *
 * The name comes from the column headers: naming them all "Scrollable table"
 * is a landmark-unique violation and tells a screen reader user nothing about
 * which of the 25 they are in.
 */
export const ScrollableTable = ({ children }: Kids) => {
  // Six cells rather than three: two tables on the same page sharing their
  // first three column names is a landmark-unique violation.
  const headers = firstText(children);
  const label = headers.length ? `Table: ${headers.join(', ')}` : 'Table';
  return (
    <div className="rl-table-scroll" role="region" aria-label={label} tabIndex={0}>
      <table>{children}</table>
    </div>
  );
};

/*
 * Mintlify's API examples. lib/remark-api-examples.mjs moves them into one
 * <ApiExamples> at the top of the page; relevance.css puts that in the rail.
 */
export const ApiExamples = ({ children }: Kids) => <div className="rl-api-examples">{children}</div>;
export const RequestExample = ({ children }: Kids) => <div className="rl-example">{children}</div>;
export const ResponseExample = ({ children }: Kids) => <div className="rl-example">{children}</div>;
