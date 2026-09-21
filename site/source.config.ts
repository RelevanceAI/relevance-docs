import { defineConfig } from 'fumadocs-mdx/config';
import { remarkHeadingComponents } from './lib/remark-heading-components.mjs';
import { remarkBasePath } from './lib/remark-base-path.mjs';
import { rehypeAssetBase } from './lib/rehype-asset-base.mjs';
import { remarkCodeLang } from './lib/remark-code-lang.mjs';

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
    // remarkBasePath runs LAST: remarkImage rewrites images into elements
    // with a `src`, and that src needs the /docs prefix applying after it.
    remarkPlugins: (v) => [remarkHeadingComponents, remarkCodeLang, ...v, remarkBasePath],
    // Last word on asset URLs -- see lib/rehype-asset-base.mjs.
    rehypePlugins: (v) => [...v, rehypeAssetBase],
  },
});
