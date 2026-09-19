import { gitConfig } from '@/lib/shared';

/**
 * The page-footer affordances Mintlify rendered on every page: a helpfulness
 * vote, "Suggest edits" and "Raise issue". None of them exist in Fumadocs by
 * default, so the first build dropped all three.
 *
 * The vote posts to PostHog rather than Mintlify's own endpoint, so the
 * signal keeps flowing to a system the team already reads.
 */
import { FeedbackVote } from './feedback-vote';

export function PageFooter({ filePath }: { filePath: string }) {
  const { user, repo, branch } = gitConfig;
  const editUrl = `https://github.com/${user}/${repo}/edit/${branch}/site/content/docs/${filePath}`;
  const issueUrl =
    `https://github.com/${user}/${repo}/issues/new?title=` +
    encodeURIComponent(`Docs issue: ${filePath}`) +
    `&body=${encodeURIComponent(`Page: \`${filePath}\`\n\nWhat's wrong:\n`)}`;

  return (
    <div className="rl-page-footer">
      <FeedbackVote filePath={filePath} />
      <div className="rl-page-footer-links">
        <a href={editUrl} target="_blank" rel="noreferrer">
          <i className="fa-solid fa-pen rl-icon" aria-hidden /> Suggest edits
        </a>
        <a href={issueUrl} target="_blank" rel="noreferrer">
          <i className="fa-solid fa-triangle-exclamation rl-icon" aria-hidden /> Raise issue
        </a>
      </div>
    </div>
  );
}
