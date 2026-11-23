import { source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/notebook/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import type * as React from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getPageImageUrl, siteUrl, SITE_NAME } from '@/lib/shared';
import { PageFooter, pagerLinks } from '@/components/site/page-footer';
import { productFor } from '@/lib/products';
import { MobileNav } from '@/components/site/mobile-nav';

/**
 * Mintlify's eyebrow above the h1 is the page's innermost docs.json GROUP --
 * "Overview" on /get-started/core-concepts/mcp-plugins. Groups are separators
 * in the fumadocs tree rather than nodes, so no breadcrumb can produce it, but
 * it is recoverable by walking the tree: a tab (root folder) resets it, a
 * nested folder sets it to its own name, and a separator overrides it for the
 * pages that follow. A page the tree does not list gets none -- which is also
 * what Mintlify shows on its orphan pages.
 */
function groupOf(nodes: PageTree.Node[], url: string, label?: string): { label?: string } | undefined {
  let current = label;
  for (const n of nodes) {
    if (n.type === 'separator') current = typeof n.name === 'string' ? n.name : current;
    /* An unlisted page is filed into a tab (see lib/source.ts) but belongs to
       none of its groups, and Mintlify shows no eyebrow on one. */
    else if (n.type === 'page') { if (n.url === url) return { label: n.$id?.startsWith('orphan:') ? undefined : current }; }
    else if (n.type === 'folder') {
      const own = n.root ? undefined : (typeof n.name === 'string' ? n.name : current);
      if (n.index?.url === url) return { label: own ?? current };
      const hit = groupOf(n.children, url, own);
      if (hit) return hit;
    }
  }
  return undefined;
}

/**
 * Mintlify's endpoint bar, from the page's `api: "POST https://..."`
 * frontmatter: a method chip and the URL's path, split on "/". Mintlify also
 * puts a "Try it" playground button here; there is none, because that needs a
 * request proxy and the only pages using `api:` are the starter kit's
 * placeholder endpoints on api.mintlify.com.
 */
function EndpointBar({ api }: { api: string }) {
  const m = api.trim().match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)$/i);
  if (!m) return null;
  let pathname = m[2];
  try { pathname = new URL(m[2]).pathname; } catch { /* already a path */ }
  const segments = pathname.split('/').filter(Boolean);
  return (
    <div className="rl-endpoint" data-method={m[1].toLowerCase()}>
      <span className="rl-endpoint-method">{m[1].toUpperCase()}</span>
      <span className="rl-endpoint-path" translate="no">
        {segments.map((seg, i) => (
          <span key={i}><span className="rl-endpoint-sep">/</span>{seg}</span>
        ))}
      </span>
    </div>
  );
}

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const full = Boolean(page.data.full || page.data.mode === 'wide');
  const tree = source.getPageTree();
  const eyebrow = groupOf(tree.children, page.url)?.label;
  const { prev, next } = pagerLinks(tree, page.url, (url) => {
    const p = source.getPages().find((x) => x.url === url);
    return p ? ((p.data as { sidebarTitle?: string }).sidebarTitle ?? p.data.title) : undefined;
  });

  return (
    <DocsPage
      toc={page.data.toc}
      /*
       * Mintlify's `mode: "wide"` is fumadocs' `full`: a wider column and no
       * table of contents. The key was parsed into the schema but never read,
       * so all 5 pages that declare it -- every changelog archive, plus the
       * Tool steps index -- rendered at the normal 677px WITH a ToC, against
       * Mintlify's 769px without one.
       */
      full={full}
      /* Which docs.json product owns the page. CSS keys the tab row off it:
         a product without tabs gets a 64px header with no tab row. */
      data-product={productFor(page.url)?.hasTabs === false ? 'no-tabs' : 'tabs'}
      /*
       * The table of contents ships as a bare <div>, so its links sit in no
       * landmark at all -- a screen reader reaches them only by walking the
       * whole page. It already renders an <h3 id="toc-title">On this page</h3>
       * to name it with.
       */
      /* API pages have no table of contents in Mintlify: the rail of request
         and response examples takes its place. Setting `enabled` replaces
         fumadocs' own default of `!full`, so wide pages restate it. */
      tableOfContent={{ enabled: !full && !page.data.api, container: { role: 'navigation', 'aria-labelledby': 'toc-title' } }}
      /* Mintlify never shows a folder trail -- the eyebrow above replaces it.
         Left on, orphan pages read "Api reference > Endpoint". */
      breadcrumb={{ enabled: false }}
      /* Fumadocs' prev / next cards give way to Mintlify's text links, which
         PageFooter renders under the feedback row where Mintlify has them. */
      footer={{ enabled: false }}
      /*
       * The mobile popover renders its trigger inside a <header>, which at
       * the top level is a second banner landmark. A <header> is only a
       * banner when it is not inside sectioning content, and that is decided
       * by the element, not by an ARIA role -- so the container has to BE a
       * <nav>. Base UI's `render` does that; it is absent from fumadocs'
       * ComponentProps<'div'> typing, hence the cast.
       */
      tableOfContentPopover={{
        /* Replaced by Mintlify's hamburger + breadcrumb row; see MobileNav.
           Forced on: fumadocs only renders this slot when the page has TOC
           entries, and the row belongs on every page. */
        enabled: true,
        component: (
          <MobileNav
            group={eyebrow}
            title={(page.data as { sidebarTitle?: string }).sidebarTitle ?? page.data.title}
          />
        ),
        container: {
          'aria-label': 'On this page',
          render: <nav />,
        } as React.ComponentProps<'div'>,
      }}
    >
      {eyebrow ? <p className="rl-eyebrow">{eyebrow}</p> : null}
      {/* Mintlify gives the page h1 this id; keep it so #page-title links work. */}
      <DocsTitle id="page-title">{page.data.title}</DocsTitle>
      <DocsDescription className="rl-description mb-0">{page.data.description}</DocsDescription>
      {page.data.api ? <EndpointBar api={page.data.api} /> : null}
      {/* No "Copy Markdown / Open" row: that came with fumadocs' page template,
          not from Mintlify, and pushed every page's body ~50px below where
          Mintlify puts it. The /docs/<slug>.md mirrors it linked to are
          separate files and are unaffected. */}
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      <PageFooter filePath={page.path} prev={prev} next={next} />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  // page.url already carries /docs.
  const canonical = `${siteUrl}${page.url}`;

  return {
    title: page.data.title,
    description: page.data.description,
    // Mintlify emits a self-referencing canonical on every page. With 163
    // redirects and 96 unlisted-but-served pages, dropping canonicals invites
    // duplicate-content dilution.
    alternates: { canonical },
    openGraph: {
      // Next does not apply the root title template to openGraph, and a
      // page-level openGraph block replaces the root one rather than merging,
      // so the suffix and siteName are restated here to match Mintlify.
      title: `${page.data.title} - ${SITE_NAME}`,
      description: page.data.description,
      siteName: SITE_NAME,
      url: canonical,
      type: 'article',
      images: `/docs${getPageImageUrl(page).url}`,
    },
  };
}
