import * as React from 'react';
import defaultMdxComponents from 'fumadocs-ui/mdx';

/**
 * Names the scrollable viewport fumadocs puts around every code block.
 *
 * It renders `<div role="region" tabIndex={0}>` so the block can be scrolled
 * by keyboard -- correct, but with no accessible name. Several unnamed
 * regions on one page is an axe `landmark-unique` violation, and in a screen
 * reader's landmark list they are indistinguishable.
 *
 * The name comes from the fence title where there is one (Mintlify writes it
 * as a bare word after the language), otherwise from the first line of code,
 * which is what a reader would use to tell two samples apart.
 */
function firstLine(node: React.ReactNode): string {
  let out = '';
  const walk = (n: React.ReactNode) => {
    if (out.includes('\n') || out.length > 80 || n == null || typeof n === 'boolean') return;
    if (typeof n === 'string' || typeof n === 'number') { out += String(n); return; }
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (React.isValidElement(n)) walk((n.props as { children?: React.ReactNode }).children);
  };
  walk(node);
  return out.split('\n')[0].trim().slice(0, 60);
}

type PreProps = React.ComponentProps<'pre'> & {
  title?: React.ReactNode;
  viewportProps?: React.HTMLAttributes<HTMLElement>;
};

const Pre = defaultMdxComponents.pre as React.ComponentType<PreProps>;

export function CodeBlock({ viewportProps, ...props }: PreProps) {
  const name = typeof props.title === 'string' && props.title
    ? props.title
    : firstLine(props.children) || 'code sample';

  return (
    <Pre
      {...props}
      viewportProps={{ 'aria-label': `Code: ${name}`, ...viewportProps }}
    />
  );
}
