/**
 * Remark plugin: auto-import Mintlify component shims into every MDX file.
 *
 * This is the load-bearing piece of the Starlight migration. Without it,
 * all 307 pages would need an `import { Accordion, Card, ... }` line added
 * at the top -- a scripted edit, but one that touches every content file and
 * shows up in every future diff.
 *
 * With it, the .mdx files migrate BYTE-IDENTICAL: we detect which shim
 * components a file actually references and inject only those imports into
 * the MDX AST at build time. Authors keep writing <Accordion> with no imports,
 * exactly as they do in Mintlify today.
 */
const SHIMS = [
  'Accordion', 'AccordionGroup', 'Card', 'CardGroup', 'Note', 'Tip', 'Warning',
  'Info', 'Check', 'Danger', 'Callout', 'Steps', 'Step', 'Tabs', 'Tab',
  'ParamField', 'Frame', 'Columns', 'Snippet', 'Tooltip', 'CodeGroup',
  'Badge', 'Update',
];

export function autoImportShims() {
  return (tree) => {
    const used = new Set();

    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        if (node.name && SHIMS.includes(node.name)) used.add(node.name);
      }
      // Never descend into code blocks -- <Card> inside a ``` fence is a
      // code sample, not a component, and importing for it is wrong.
      if (node.type === 'code' || node.type === 'inlineCode') return;
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);

    if (used.size === 0) return;

    const names = [...used].sort();
    tree.children.unshift({
      type: 'mdxjsEsm',
      value: `import { ${names.join(', ')} } from '@shims';`,
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [{
            type: 'ImportDeclaration',
            source: { type: 'Literal', value: '@shims', raw: "'@shims'" },
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
