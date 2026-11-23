/**
 * Mintlify's heading-id rules, reproduced exactly.
 *
 * Deep links into the docs -- from other pages, from support tickets, from
 * Google's sitelinks -- all target Mintlify's ids. github-slugger (what
 * fumadocs uses by default) strips `&`, `/`, apostrophes and periods, so
 * `#security-&-compliance` and `#what's-next` would silently land at the top
 * of the page instead of the section. 201 anchors across 140 pages differed.
 *
 * Derived by fitting against every heading on all 289 live pages: 2,664/2,664
 * exact. The rules:
 *
 *   - lowercase, trimmed, zero-width spaces removed
 *   - whitespace, `.`, `(` and `)` all become `-`
 *   - `!#$%*,:;<=>?@[\]^`{|}~` are dropped
 *   - everything else survives, including `&`, `/`, `+`, `_`, quotes and any
 *     non-ASCII character (`trigger-→-agent` is a real id)
 *   - runs of `-` collapse; leading and trailing `-` go
 *   - repeats are numbered from 2, keyed on the lowercased heading TEXT, not
 *     on the resulting slug -- so "Let agent decide" and "Let Agent Decide"
 *     collide and the second becomes `-2`, while "Bad examples" and
 *     "Bad examples:" do not and both get `bad-examples`. That last one is a
 *     duplicate id in Mintlify's own output; it is reproduced rather than
 *     fixed so the existing link keeps landing where it always has.
 */
const DROP = /[!#$%*,:;<=>?@[\\\]^`{|}~]/g;
const TO_DASH = /[\s.()]+/g;

export function mintlifyHeadingSlug(text) {
  return text
    .replace(/​/g, '')
    .trim()
    .toLowerCase()
    .replace(DROP, '')
    .replace(TO_DASH, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Per-document occurrence counts. remark-heading calls this once per heading
// with the same mdast root, and never for a heading that declares its own
// `[#id]`, which is also how Mintlify treats explicit ids.
const counters = new WeakMap();

/** Drop-in for fumadocs' `remarkHeadingOptions.slug`. */
export function mintlifySlug(root, _heading, text) {
  let seen = counters.get(root);
  if (!seen) counters.set(root, (seen = new Map()));

  const key = text.replace(/​/g, '').trim().toLowerCase();
  const n = seen.get(key) ?? 1;
  seen.set(key, n + 1);

  const base = mintlifyHeadingSlug(text);
  return n > 1 ? `${base}-${n}` : base;
}

/**
 * Mintlify's *other* slug rule, used for the `<title>-accordion-title` id it
 * puts on every accordion heading. It is not the heading rule: `&` becomes
 * `and`, and everything that is not alphanumeric becomes `-`, except an
 * apostrophe inside a contraction, which just disappears (`don't` -> `dont`,
 * but `I'm` -> `i-m`). 1,207 of the 1,208 live accordion ids match.
 */
export function mintlifyAccordionSlug(text) {
  return text
    .replace(/([A-Za-z]{2,})['’]([A-Za-z])/g, '$1$2')
    .toLowerCase()
    .replaceAll('&', 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
