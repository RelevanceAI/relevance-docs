'use client';

import { useState } from 'react';

declare global {
  interface Window { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }
}

export function FeedbackVote({ filePath }: { filePath: string }) {
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);

  const vote = (value: 'yes' | 'no') => {
    setVoted(value);
    try {
      window.posthog?.capture('docs_page_feedback', { page: filePath, helpful: value === 'yes' });
    } catch {
      // Analytics must never break the page.
    }
  };

  if (voted) {
    return <p className="rl-feedback rl-feedback--done">Thanks for the feedback.</p>;
  }

  return (
    <div className="rl-feedback">
      <span>Was this page helpful?</span>
      <button type="button" onClick={() => vote('yes')} aria-label="Yes, this page was helpful">
        <i className="fa-solid fa-thumbs-up rl-icon" aria-hidden /> Yes
      </button>
      <button type="button" onClick={() => vote('no')} aria-label="No, this page was not helpful">
        <i className="fa-solid fa-thumbs-down rl-icon" aria-hidden /> No
      </button>
    </div>
  );
}
