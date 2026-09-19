# Mintlify migration prototypes

Two working prototypes of the docs site built from the **unmodified** `.mdx`
files in this repo, to decide what replaces Mintlify.

Both render the same 18 representative pages, chosen by greedy set-cover over
component usage so that every component used on a live page appears at least
once. Both import the same design system (`_design/`), so any visual
difference between them comes from the framework, not the CSS.

```
prototypes/
  _design/        shared design tokens + component CSS (identical in both)
  _content/       the 18 staged pages + 9 snippets they pull in
  tools/          docs.json -> framework config converter
  starlight/      Astro Starlight prototype
  fumadocs/       Fumadocs (Next.js, static export) prototype
  pages.json      the page selection
```

## Running them

Staged content, images and generated config are all gitignored — they are
derived from this repo, and committing them would add ~42 MB of duplicated
images. Generate them first:

```bash
node prototypes/tools/setup.mjs                              # stage pages + images
node prototypes/tools/gen-config.mjs --only-prototype-pages  # nav + redirects
```

Then build either one:

```bash
cd prototypes/starlight && npm install && npx astro build   # -> dist/
cd prototypes/fumadocs  && npm install && npx next build    # -> out/
```

`gen-config.mjs` with no flag emits the **full** 289-page navigation instead
of just the 18 staged pages — useful for checking the converter, but the
prototypes will not build against it since the other 271 pages are not staged.

## What the corpus actually looks like

Measured, not estimated:

| | |
|---|---|
| `.mdx` files on disk | 457 |
| Reachable pages (nav + global anchors + redirect targets + inbound links) | 307 |
| Pages in the live sitemap | 289 |
| True orphans (unlinked, unindexed, but still served `200`) | 87 |
| Snippets in `_snippets/` | 63 |
| Redirects | 93 — **79 exact, 14 wildcard** |
| Distinct components on live pages | 20 |

Notes that changed the plan:

- `api-reference/` (5 pages) is unmodified Mintlify starter-kit content pointing
  at `api.mintlify.com/api/user`. There is no OpenAPI spec and no API
  playground anywhere in the repo, which removes the hardest thing to replace.
- `Update`, `Expandable` and `ResponseField` appear **only** on orphaned pages,
  so they do not need shims.
- The `invent-callout` bubble is documented in `CLAUDE.md` and supported by
  `invent-callout.js` + `style.css`, but is used on **zero** pages.
- One file has a `sidebardTitle` typo that Mintlify silently ignores. Both
  prototypes surface it at build time.

## Result

Both prototypes build, and both render byte-identical `.mdx` with **no content
edits** — verified with `cmp` against the originals (18/18 identical in each).
Both emit the same `rl-*` markup, element for element.

| | Starlight | Fumadocs |
|---|---|---|
| Clean build (18 pages) | **7.0 s** | 21.8 s |
| Output size | **25 MB** | 53 MB |
| JS, excluding search | **102 KB** | 1,317 KB |
| Search | Pagefind, static, lazy-loaded (868 KB of assets) | Orama |
| `llms.txt` / `llms-full.txt` | must be built | **out of the box** |
| Per-page `.md` mirrors | must be built | **out of the box** |
| OG images | must be built | **out of the box** |
| Component wiring | remark plugin injects imports into the MDX AST | global `getMDXComponents()` map |
| Snippets | `import.meta.glob` lookup | rewritten to native `<include>` |

### Where each one bit

**Starlight.** Astro 7 has just replaced its default markdown processor, so
remark plugins now need `@astrojs/markdown-remark` installed explicitly or the
build fails with a misleading message. The `@shims` barrel also needs a Vite
alias. Neither is hard, but neither is documented where you'd look.

**Fumadocs.** Its global component map does *not* cover components used inside
headings — Fumadocs extracts headings into the table of contents outside the
provider scope, so

```mdx
### Parallel Tool Calls <Badge color="orange">Beta</Badge>
```

hard-fails the build with `Badge is not defined`. Only 2 pages in the whole
corpus do this, but it breaks the build, so Fumadocs needs import injection
too — just narrowly. Its "no build-time codegen" advantage is real for body
content and false for headings.

### The redirect finding

**14 of the 93 redirects are wildcards** (`/chat/:slug*`, `/agent/:slug*`, …)
that map whole subtrees from the pre-reorg IA. Astro's static `redirects`
config does not support them — left in, it writes a literal file named
`:slug*.html`. They have to live in host rules.

`tools/gen-config.mjs` therefore emits exact and wildcard redirects
separately: exact ones into the framework config, all 93 into a Cloudflare
`_redirects` file and a Vercel `vercel.redirects.json`. **The redirect layer is
host-coupled whichever framework wins.**

### URL parity — the SEO gate

Mintlify serves `/docs/a/b` with no trailing slash and no extension, and 289
URLs are indexed. Both prototypes are configured to match, and Starlight's
generated sitemap already emits the correct `https://relevanceai.com/docs/...`
form. The migration gate should be a clean diff of the generated URL list
against the live sitemap, with zero exceptions.

## Still open

- Neither prototype themes the chrome (nav, sidebar, footer) — only content.
  A real redesign needs design direction first.
- Search quality: Pagefind and Orama are both keyword search. Mintlify's is
  AI-backed. Replacing that is its own project.
- `images/` is 246 MB in a 256 MB repo. Worth moving to a CDN or Git LFS
  independently of this decision.
