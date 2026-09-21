import { renderIndex } from '@/lib/llms';

export const revalidate = false;

export function GET() {
  return new Response(renderIndex(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
