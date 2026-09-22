import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import * as Mintlify from './mintlify';

/**
 * Mintlify shims are registered GLOBALLY here. This is the Fumadocs
 * equivalent of the Starlight prototype's remark auto-import plugin -- but it
 * is a plain object spread rather than an MDX-AST transform, so there is no
 * build-time codegen and nothing to keep in sync with a component list.
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
