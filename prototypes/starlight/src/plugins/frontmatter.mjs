/**
 * Remark plugin: translate Mintlify frontmatter into Starlight frontmatter
 * at build time, so the .mdx files keep Mintlify's exact frontmatter keys.
 *
 *   sidebarTitle: "Foo"  ->  sidebar: { label: "Foo" }
 *   mode: "wide"         ->  template: "splash"-ish wide layout
 *
 * Also tolerates the `sidebardTitle` typo found in the real repo, and warns,
 * which is how a build-time schema catches what Mintlify silently ignored.
 */
export function mintlifyFrontmatter() {
  return (_tree, file) => {
    const fm = file.data?.astro?.frontmatter;
    if (!fm) return;

    if (fm.sidebardTitle && !fm.sidebarTitle) {
      console.warn(`[frontmatter] ${file.path}: 'sidebardTitle' is a typo for 'sidebarTitle'`);
      fm.sidebarTitle = fm.sidebardTitle;
    }
    if (fm.sidebarTitle) {
      fm.sidebar = { ...(fm.sidebar ?? {}), label: fm.sidebarTitle };
    }
    if (fm.mode === 'wide') {
      fm.tableOfContents = false;
      }
    // Mintlify allows a bare `title` with no description; Starlight is fine
    // with that, but we normalise quotes-only titles that trip the schema.
    if (typeof fm.title === 'string') fm.title = fm.title.trim();
  };
}
