import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="rl-brand">
          {/* basePath is applied to public/ assets, so reference them bare. */}
          <img src="/images/logo/light.png" alt="" className="rl-brand-mark rl-brand-mark--light" />
          <img src="/images/logo/dark.png" alt="" className="rl-brand-mark rl-brand-mark--dark" />
          {/* The logo already carries the Relevance AI wordmark, so the text
              beside it is just the section name. */}
          <span className="rl-brand-text">Docs</span>
        </span>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
