import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import * as Mintlify from './mintlify';

/**
 * Every Mintlify component is registered globally here, which is why the
 * 383 .mdx files in this repo migrate with no edits and no import lines.
 *
 * The one gap: components used INSIDE a heading are evaluated during
 * table-of-contents extraction, outside this provider. lib/remark-heading-components
 * injects a module-scope import for exactly those cases.
 */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...Mintlify,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
