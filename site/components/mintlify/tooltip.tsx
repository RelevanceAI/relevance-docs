'use client';
import * as React from 'react';

/**
 * Mintlify's <Tooltip>: a dotted-underlined trigger and a white bubble 4px
 * above it, centred, with no arrow. Measured on
 * /build/tools/tool-steps/google-calendar/check-google-calendar-availability.
 *
 * This replaces a bare `title` attribute, which showed the browser's own
 * delayed, unstyled tooltip, never appeared on keyboard focus, and never
 * appeared on touch at all.
 *
 * It is a client component for one reason: WCAG 1.4.13 requires content
 * shown on hover or focus to be dismissible without moving the pointer, and
 * a pure-CSS :hover bubble cannot be closed with Escape. The bubble text is
 * referenced by aria-describedby, so it is announced as the trigger's
 * description rather than read inline.
 */
export function Tooltip({ tip, children }: { tip?: string; children?: React.ReactNode }) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  if (!tip) return <>{children}</>;
  return (
    <span
      className="rl-tooltip"
      tabIndex={0}
      aria-describedby={id}
      data-open={open || undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
    >
      {children}
      <span role="tooltip" id={id} className="rl-tooltip-bubble">{tip}</span>
    </span>
  );
}
