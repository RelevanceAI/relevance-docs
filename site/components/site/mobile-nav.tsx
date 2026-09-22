'use client';
import { SidebarTrigger } from 'fumadocs-ui/layouts/notebook/slots/sidebar';

/**
 * Mintlify's second mobile header row: one full-width button -- a hamburger,
 * then the page's group and title as a breadcrumb -- that opens the
 * navigation drawer. Measured on the preview at 390px: 56px tall, the icon
 * 20px in, the group 14px/400 #727276, a 12px chevron, the title 14px/600.
 *
 * It takes the slot fumadocs gives its mobile table-of-contents popover.
 * Mintlify shows no table of contents below 1280px at all, so replacing the
 * popover (rather than adding a row beside it) is also what matches at
 * tablet widths. It reuses fumadocs' own SidebarTrigger, so the drawer is the
 * real one, not a copy.
 */
export function MobileNav({ group, title }: { group?: string; title: string }) {
  return (
    <div className="rl-mobile-nav">
      <SidebarTrigger className="rl-mobile-nav-trigger" aria-label={`Open navigation: ${group ? `${group}, ` : ''}${title}`}>
        <svg className="rl-mobile-nav-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M2.5 4h11M2.5 8h11M2.5 12h11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {group ? (
          <>
            <span className="rl-mobile-nav-group">{group}</span>
            <svg className="rl-mobile-nav-chev" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M6 3.5l4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        ) : null}
        <span className="rl-mobile-nav-title">{title}</span>
      </SidebarTrigger>
    </div>
  );
}
