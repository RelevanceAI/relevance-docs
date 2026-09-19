import { Inter, Sora } from 'next/font/google';
import { Provider } from '@/components/provider';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import type { Metadata } from 'next';
import { siteUrl } from '@/lib/shared';
import { Analytics } from '@/components/site/analytics';
import { ChatWidget } from '@/components/site/chat-widget';
import './global.css';
import './relevance.css';

// Brand typefaces from relevanceai.com: Sora for headings, Inter for UI/body.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap', weight: ['400', '500', '600'] });

// Anchors every relative metadata URL (og:image in particular) to the real
// origin instead of localhost.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`} suppressHydrationWarning>
      <head>
        {/* Mintlify ships Font Awesome; 257/297 icon names used here are in Free. */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <Provider>
          <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
            {children}
          </DocsLayout>
        </Provider>
        <Analytics />
        <ChatWidget />
      </body>
    </html>
  );
}
