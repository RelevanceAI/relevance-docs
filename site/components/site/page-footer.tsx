import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { Pencil, TriangleAlert } from 'lucide-react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { gitConfig } from '@/lib/shared';
import { Icon } from '@/components/mintlify';

/**
 * Everything Mintlify puts under a page's content, in its order and at its
 * measured spacing: the edit / issue row, then prev / next, then a site
 * footer carrying docs.json's `footer.socials`.
 *
 * There is deliberately no "Was this page helpful?" vote: it was used about
 * once a fortnight on Mintlify and nothing reads the result here, so it
 * asked readers for a signal that went nowhere.
 */

export interface PagerLink { url: string; name: string }

export function PageFooter({ filePath, prev, next }: { filePath: string; prev?: PagerLink; next?: PagerLink }) {
  const { user, repo, branch } = gitConfig;
  const editUrl = `https://github.com/${user}/${repo}/edit/${branch}/site/content/docs/${filePath}`;
  const issueUrl =
    `https://github.com/${user}/${repo}/issues/new?title=` +
    encodeURIComponent(`Docs issue: ${filePath}`) +
    `&body=${encodeURIComponent(`Page: \`${filePath}\`\n\nWhat's wrong:\n`)}`;

  // One wrapper: #nd-page is a flex column with a 16px gap, which would
  // otherwise be added to each of Mintlify's measured spacings below.
  return (
    <div className="rl-page-end">
      <div className="rl-feedback-toolbar">
        <div className="rl-feedback-row">
          <a className="rl-fb-btn" href={editUrl} target="_blank" rel="noreferrer">
            <Pencil aria-hidden="true" /><small>Suggest edits</small>
          </a>
          <a className="rl-fb-btn" href={issueUrl} target="_blank" rel="noreferrer">
            <TriangleAlert aria-hidden="true" /><small>Raise issue</small>
          </a>
        </div>
      </div>
      {prev || next ? (
        <nav className="rl-pager" aria-label="Pagination">
          {prev ? (
            <Link className="rl-pager-prev" href={prev.url} aria-label={`Previous: ${prev.name}`}>
              <Chevron /><span>{prev.name}</span>
            </Link>
          ) : null}
          {next ? (
            <Link className="rl-pager-next" href={next.url} aria-label={`Next: ${next.name}`}>
              <span>{next.name}</span><Chevron />
            </Link>
          ) : null}
        </nav>
      ) : null}
      <SiteFooter />
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 3 6" aria-hidden="true" focusable="false">
      <path d="M3 0L0 3L3 6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Mintlify's prev / next: the neighbours in sidebar order, within the page's
 * tab only -- the first page of a tab has no "Previous", the last no "Next"
 * -- and none at all on a page docs.json does not list. Labelled by sidebar
 * title, as the sidebar is.
 */
export function pagerLinks(
  tree: PageTree.Root, url: string, label: (url: string) => string | undefined,
): { prev?: PagerLink; next?: PagerLink } {
  let pages: PageTree.Item[] | undefined;
  (function find(nodes: PageTree.Node[], tab: PageTree.Node[] | undefined): boolean {
    for (const n of nodes) {
      if (n.type === 'page' && n.url === url) { if (tab) pages = flatten(tab); return true; }
      if (n.type === 'folder') {
        const t = n.root ? n.children : tab;
        if (n.index?.url === url) { if (t) pages = flatten(t); return true; }
        if (find(n.children, t)) return true;
      }
    }
    return false;
  })(tree.children, undefined);
  const i = pages?.findIndex((p) => p.url === url) ?? -1;
  if (!pages || i < 0) return {};
  const link = (p?: PageTree.Item) => (p ? { url: p.url, name: label(p.url) ?? String(p.name) } : undefined);
  return { prev: link(pages[i - 1]), next: link(pages[i + 1]) };
}

function flatten(nodes: PageTree.Node[], out: PageTree.Item[] = []): PageTree.Item[] {
  for (const n of nodes) {
    if (n.type === 'page') {
      if (!n.$id?.startsWith('orphan:') && !n.external && !/^https?:\/\//.test(n.url)) out.push(n);
    } else if (n.type === 'folder') {
      if (n.index) out.push(n.index);
      flatten(n.children, out);
    }
  }
  return out;
}

const SOCIAL_NAMES: Record<string, string> = {
  twitter: 'Twitter', x: 'X', github: 'GitHub', linkedin: 'LinkedIn', youtube: 'YouTube',
  discord: 'Discord', slack: 'Slack', facebook: 'Facebook', instagram: 'Instagram',
};

let socials: [string, string][] | undefined;
function getSocials(): [string, string][] {
  if (socials) return socials;
  const docsJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), '..', 'docs.json'), 'utf8'));
  socials = Object.entries((docsJson.footer?.socials ?? {}) as Record<string, string>);
  return socials;
}

/**
 * Mintlify's site footer: a hairline, then docs.json's social links as 20px
 * brand icons. Its right-hand "Powered by Mintlify" badge is not carried
 * over -- it would no longer be true.
 */
function SiteFooter() {
  const links = getSocials();
  if (links.length === 0) return null;
  return (
    <footer className="rl-site-footer">
      <ul className="rl-socials">
        {links.map(([key, href]) => (
          <li key={key}>
            <a href={href} target="_blank" rel="noreferrer">
              <span className="sr-only">{SOCIAL_NAMES[key] ?? key}</span>
              <Icon name={key} style="brands" />
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
