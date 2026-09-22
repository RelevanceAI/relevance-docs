import { defineConfig } from 'fumadocs-mdx/config';
import { remarkHeadingComponents } from './lib/remark-heading-components.mjs';
import { remarkBasePath } from './lib/remark-base-path.mjs';
import { rehypeAssetBase } from './lib/rehype-asset-base.mjs';
import { remarkCodeLang } from './lib/remark-code-lang.mjs';
import { remarkUnwrapBlocks } from './lib/remark-unwrap-blocks.mjs';
import { mintlifySlug } from './lib/mintlify-slug.mjs';
import smartypants from 'remark-smartypants';

/**
 * Global MDX options.
 *
 * Snippets are NOT handled here. fumadocs composes its processor as
 * [remarkInclude, ...these, remarkPostprocess], so remarkInclude always runs
 * first and never sees nodes a plugin here creates. Sources therefore use
 * fumadocs' native <include> directly -- see tools/convert-snippets.mjs.
 */
export default defineConfig({
  mdxOptions: {
    /**
     * Do NOT bundle images as static imports.
     *
     * By default fumadocs turns every markdown image into a static import,
     * which the bundler emits as a hashed copy under _next/static/media. The
     * originals still ship in public/, so every image was deployed TWICE --
     * 115 MB of duplicates in a 696 MB build.
     *
     * With useImport off, images keep their own URL and are served from
     * /docs/images/..., which is exactly the path Mintlify serves them from
     * today. That removes the duplication AND keeps every existing image URL
     * working, with no redirects. The plugin still runs, so images keep their
     * width/height attributes and do not cause layout shift.
     *
     * Next's image optimizer is already off (`images.unoptimized`, required
     * for static export), so the static import bought nothing here.
     */
    remarkImageOptions: { useImport: false },
    // Heading ids have to match Mintlify's, or every deep link into the docs
    // lands at the top of the page -- see lib/mintlify-slug.mjs. This feeds
    // the table of contents as well, so the two cannot drift apart.
    remarkHeadingOptions: { slug: mintlifySlug },
    /**
     * Shiki's `github-dark` colours comments #6A737D, which measures 3.71:1
     * on this theme's code-block background -- under the 4.5:1 AA floor, so
     * every commented sample was hard to read in dark mode.
     * `github-dark-default` uses #8b949e for the same tokens: 5.81:1.
     */
    rehypeCodeOptions: {
      themes: { light: 'github-light', dark: 'github-dark-default' },
    },
    // remarkBasePath runs LAST: remarkImage rewrites images into elements
    // with a `src`, and that src needs the /docs prefix applying after it.
    // Mintlify renders typographic apostrophes and quotes, and slugs headings
    // from the result -- `What's next` becomes `#what’s-next`. Without this
    // the text reads differently AND 85 deep links break. Dashes, ellipses
    // and backticks stay off: Mintlify does not convert those, and `--` is a
    // CLI flag in several code samples.
    remarkPlugins: (v) => [
      remarkHeadingComponents,
      remarkCodeLang,
      remarkUnwrapBlocks,
      [smartypants, { dashes: false, ellipses: false, backticks: false }],
      ...v,
      remarkBasePath,
    ],
    // Last word on asset URLs -- see lib/rehype-asset-base.mjs.
    rehypePlugins: (v) => [...v, rehypeAssetBase],
  },
});
