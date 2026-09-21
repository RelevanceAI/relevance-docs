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
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getPageImageUrl, getPageMarkdownUrl, gitConfig, siteUrl, SITE_NAME } from '@/lib/shared';
import { PageFooter } from '@/components/site/page-footer';
import { PageNav } from '@/components/site/page-nav';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  // Routes at the app root are served under /docs once dist is deployed.
  const markdownUrl = `/docs${getPageMarkdownUrl(page).url}`;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
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
      <PageNav url={page.url} />
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
