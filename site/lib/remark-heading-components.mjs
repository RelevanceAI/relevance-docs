/**
 * Fumadocs extracts headings into the table of contents at build time, and
 * that extraction is evaluated OUTSIDE the MDX component provider. A
 * component used inside a heading -- e.g.
 *
 *     ### Parallel Tool Calls <Badge color="orange">Beta</Badge>
 *
 * -- is therefore `not defined` at module scope and hard-fails the build,
 * even though getMDXComponents() maps it globally for body content.
 *
 * Only 2 pages in the corpus do this, but it is a build break, so we inject a
 * module-scope import for exactly the components that appear in headings.
 * Body content still resolves through the global component map.
 */
const SHIMS = new Set([
  'Accordion', 'AccordionGroup', 'Card', 'CardGroup', 'Note', 'Tip', 'Warning',
  'Info', 'Check', 'Danger', 'Callout', 'Steps', 'Step', 'Tabs', 'Tab',
  'ParamField', 'Frame', 'Columns', 'Tooltip', 'CodeGroup', 'Badge', 'Update',
]);

export function remarkHeadingComponents() {
  return (tree) => {
    const used = new Set();

    for (const node of tree.children ?? []) {
      if (node.type !== 'heading') continue;
      const scan = (n) => {
        if (!n || typeof n !== 'object') return;
        if ((n.type === 'mdxJsxTextElement' || n.type === 'mdxJsxFlowElement') && SHIMS.has(n.name)) {
          used.add(n.name);
        }
        for (const c of n.children ?? []) scan(c);
      };
      scan(node);
    }
    if (used.size === 0) return;

    const names = [...used].sort();
    tree.children.unshift({
      type: 'mdxjsEsm',
      value: `import { ${names.join(', ')} } from '@/components/mintlify';`,
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [{
            type: 'ImportDeclaration',
            source: {
              type: 'Literal',
              value: '@/components/mintlify',
              raw: "'@/components/mintlify'",
            },
            specifiers: names.map((n) => ({
              type: 'ImportSpecifier',
              imported: { type: 'Identifier', name: n },
              local: { type: 'Identifier', name: n },
            })),
          }],
        },
      },
    });
  };
}
