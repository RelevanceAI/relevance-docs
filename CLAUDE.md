# relevance-docs

Relevance AI documentation site, powered by Mintlify. Hosted at https://relevanceai.com/docs.

## Content standards

- Technical documentation, not marketing copy. Banned words: "powerful", "seamlessly", "effortlessly", "unlock", "supercharge", "robust", "leverage". Just describe what things do.
- Don't state the obvious. Add genuinely useful context — edge cases, gotchas, non-obvious behavior, prerequisites.
- American English spelling only (customize, optimize, analyze, color, behavior — not British variants). This is for SEO.
- No emojis in documentation content.

## Heading and title capitalization

**Sentence case everywhere.** Only capitalize proper nouns and product names.

- CORRECT: `## How to configure your settings`
- WRONG: `## How To Configure Your Settings`

This applies to ALL text that acts as a section header:
- Heading levels (`#`, `##`, `###`, `####`, `#####`, `######`) — all H1 through H6 are valid in MDX files and can be used for proper document hierarchy
- `<Card title="...">`
- `<Accordion title="...">`
- `<Step title="...">`

## Mintlify components

Search Mintlify docs for component syntax when needed — do not guess. Prioritize interactive components over plain markdown.

Key rules:
- 6 built-in callout types (`<Note>`, `<Warning>`, `<Info>`, `<Tip>`, `<Check>`, `<Danger>`) take NO attributes. `<Note type="warning">` is invalid — use `<Warning>` instead.
- Custom callouts use `<Callout icon="key" color="#FFC107" iconType="regular">`.
- Callouts must be a single short paragraph — no bullet lists, no multi-line content, no bold labels inside.
- Accordion content: use flowing sentences, not bullet lists.
- Use `<CardGroup>` with icons for feature lists instead of plain bullet lists.
- Don't mix bold text (`**Feature Name**`) with heading formats for section titles — use a proper heading.
- Long examples go in `<Accordion>` components with specific, descriptive titles (not generic ones like "Example").

## Invent callout

A styled bubble that tells readers Invent can do the thing the page is teaching them to do by hand. Blobby (the Invent mascot) sits on the left and tracks the cursor.

Drop it in after the intro of any page where Invent can do the job:

```mdx
<div className="invent-callout">
  <strong>Invent can do this for you.</strong> Ask Invent to create an Agent with a name and a purpose, and it sets up the system prompt, picks the Tools, and connects the integrations it needs.
</div>
```

Rules:
- Only the copy changes between usages — never the markup, the class name, or the structure. All styling lives in `style.css` so one edit there updates every bubble.
- Keep it to one short paragraph, lead-in bolded. Say what to ask Invent for, not what Invent is.
- Don't nest it inside a Mintlify callout, `<Card>`, or `<Accordion>`.
- Don't put more than one on a page.

Supporting files, none of which need touching to add a bubble: `invent-callout.js` (builds Blobby and animates his eyes), `images/invent-blobby-seal.svg` (the `pd/inventor` sprite from relevance-api-node), `images/invent-blobby.svg` (static fallback when JS is off). Blobby's size and the spacing around him are the `--blobby-size` and `--blobby-gap` custom properties on `.invent-callout`.

## Navigation

- `docs.json` controls the page tree. There is no `mint.json`.
- When adding new pages, update `docs.json` with valid JSON.
- Update `sidebarTitle` when page titles change.
- Don't place pages in wrong navigation groups — follow logical hierarchy.

## Content structure

- Follow logical page progression: Overview → Key features → Setup → Configuration → Advanced
- No redundant "Quick Links" sections that duplicate sidebar navigation.
- No "Next Steps" sections unless they provide unique actionable guidance beyond what navigation already offers.
- No "How It Works" sections that repeat information already explained elsewhere on the page.
- Don't duplicate content across pages — link to the canonical source instead.

## Links

- Descriptive link text — never "click here" or "read more".
- "Learn more" links go at the bottom of the page, not the top.
- Verify all internal and anchor links work. Don't link to `#section-name` targeting bold text — the target must be a proper heading.
- Use root-relative paths for internal links (e.g., `/quickstart`).
- Always link to the support contact page (`/get-started/support`) rather than referencing specific email addresses like `support@relevanceai.com`. This keeps contact information centralized and up-to-date.

## Step-by-step instructions

- Be specific — reference exact UI element names as they appear in the product.
- CORRECT: `Click **Create agent**` / WRONG: `Click the button`

## Workflow

- Always explore the repo structure and read similar pages before creating new content. Match existing structure, tone, and component patterns.
- Branch name will be provided as input — use it as-is.
- Keep PRs focused and scoped.

## Quality checklist

Before committing, verify:
- All headings are in sentence case
- All internal and anchor links work
- Card, accordion, and step titles follow capitalization rules
- Examples are in accordions where appropriate
- No orphaned pages (everything is linked from navigation)
- Consistent terminology across all modified files
- No duplicate content — link to canonical sources
