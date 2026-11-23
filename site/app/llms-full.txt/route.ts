import { navPages, renderFullEntry } from '@/lib/llms';

export const revalidate = false;

/**
 * Every navigation page, in slug order, matching Mintlify byte-for-byte in
 * shape: title, Source line, description, body. Orphan pages are left out
 * for the same reason they are left out of llms.txt.
 */
export async function GET() {
  const pages = navPages().sort((a, b) => a.url.localeCompare(b.url));
  const entries = await Promise.all(pages.map(renderFullEntry));

  return new Response(entries.join('\n\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
