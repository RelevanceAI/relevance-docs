import { source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import type * as React from 'react';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getPageImageUrl, getPageMarkdownUrl, gitConfig, siteUrl, SITE_NAME } from '@/lib/shared';
import { PageFooter } from '@/components/site/page-footer';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  // Routes at the app root are served under /docs once dist is deployed.
  const markdownUrl = `/docs${getPageMarkdownUrl(page).url}`;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      /*
       * The table of contents ships as a bare <div>, so its links sit in no
       * landmark at all -- a screen reader reaches them only by walking the
       * whole page. It already renders an <h3 id="toc-title">On this page</h3>
       * to name it with.
       */
      tableOfContent={{ container: { role: 'navigation', 'aria-labelledby': 'toc-title' } }}
      /*
       * The mobile popover renders its trigger inside a <header>, which at
       * the top level is a second banner landmark. A <header> is only a
       * banner when it is not inside sectioning content, and that is decided
       * by the element, not by an ARIA role -- so the container has to BE a
       * <nav>. Base UI's `render` does that; it is absent from fumadocs'
       * ComponentProps<'div'> typing, hence the cast.
       */
      tableOfContentPopover={{
        container: {
          'aria-label': 'On this page',
          render: <nav />,
        } as React.ComponentProps<'div'>,
      }}
    >
      {/* Mintlify gives the page h1 this id; keep it so #page-title links work. */}
      <DocsTitle id="page-title">{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/site/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      <PageFooter filePath={page.path} />
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
