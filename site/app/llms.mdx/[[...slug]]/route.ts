import { source } from '@/lib/source';
import { renderPageMirror } from '@/lib/llms';
import { getPageMarkdownUrl } from '@/lib/shared';
import { notFound } from 'next/navigation';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/llms.mdx/[[...slug]]'>) {
  const { slug } = await params;
  // remove the appended "content.md"
  const page = source.getPage(slug?.slice(0, -1));
  if (!page) notFound();

  return new Response(await renderPageMirror(page), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: getPageMarkdownUrl(page).segments,
  }));
}
