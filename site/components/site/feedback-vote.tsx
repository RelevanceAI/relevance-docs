'use client';

import { useState, type ReactNode } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';

declare global {
  interface Window { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }
}

/**
 * Mintlify's feedback row: "Was this page helpful?", then Yes / No, then the
 * page's edit links (passed in as children) pushed to the far edge. Below
 * ~560px the row wraps into three lines -- label, votes, links -- exactly as
 * Mintlify's does, because both levels are wrapping flex rows.
 *
 * The buttons stay after a vote, so nothing below the row moves; the label
 * thanks the reader instead, announced through its live region.
 */
export function FeedbackVote({ filePath, children }: { filePath: string; children?: ReactNode }) {
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);

  const vote = (value: 'yes' | 'no') => {
    if (voted === value) return;
    setVoted(value);
    try {
      window.posthog?.capture('docs_page_feedback', { page: filePath, helpful: value === 'yes' });
    } catch {
      // Analytics must never break the page.
    }
  };

  return (
    <div className="rl-feedback-row">
      <p className="rl-feedback-label" aria-live="polite">
        {voted ? 'Thanks for the feedback.' : 'Was this page helpful?'}
      </p>
      <div className="rl-feedback-actions">
        <div className="rl-feedback-group">
          <button type="button" className="rl-fb-btn" aria-pressed={voted === 'yes'}
            aria-label="Yes, this page was helpful" onClick={() => vote('yes')}>
            <ThumbsUp aria-hidden="true" /><small>Yes</small>
          </button>
          <button type="button" className="rl-fb-btn" aria-pressed={voted === 'no'}
            aria-label="No, this page was not helpful" onClick={() => vote('no')}>
            <ThumbsDown aria-hidden="true" /><small>No</small>
          </button>
        </div>
        {children ? <div className="rl-feedback-group">{children}</div> : null}
      </div>
    </div>
  );
}
