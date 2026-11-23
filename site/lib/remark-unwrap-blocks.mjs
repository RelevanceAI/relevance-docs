/**
 * Lifts block-level Mintlify components out of paragraphs.
 *
 * `<Tip>` on the line straight after a sentence, with no blank line, is
 * inline content to MDX -- so the paragraph ends up containing an <aside>.
 * The HTML parser cannot nest a block element inside <p>, so it closes the
 * paragraph early, the client tree no longer matches the server tree, and
 * React throws #418 and re-renders the whole page on the client. It is
 * invisible apart from a console error and a hydration cost, which is why
 * it survived: 22 pages do it.
 *
 * Splitting in remark rather than editing the content keeps the .mdx files
 * as Mintlify accepts them -- Mintlify renders these correctly, so the
 * source is not wrong, only the strictness differs.
 */
const BLOCK = new Set([
  'Note', 'Tip', 'Warning', 'Info', 'Check', 'Danger', 'Callout',
  'Card', 'CardGroup', 'Columns', 'Accordion', 'AccordionGroup',
  'Steps', 'Step', 'Tabs', 'Tab', 'CodeGroup', 'Frame', 'Update',
  'Expandable', 'ParamField', 'ResponseField', 'RequestExample', 'ResponseExample',
]);

const isBlock = (n) => n.type === 'mdxJsxTextElement' && BLOCK.has(n.name);
const blank = (n) => n.type === 'text' && n.value.trim() === '';

export function remarkUnwrapBlocks() {
  return (tree) => {
    const walk = (parent) => {
      const children = parent.children;
      if (!Array.isArray(children)) return;

      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        walk(node);
        if (node.type !== 'paragraph' || !node.children.some(isBlock)) continue;

        // Split the paragraph into alternating inline runs and block nodes.
        const out = [];
        let run = [];
        const flush = () => {
          if (run.some((n) => !blank(n))) out.push({ ...node, children: run });
          run = [];
        };
        for (const child of node.children) {
          if (isBlock(child)) {
            flush();
            out.push({ ...child, type: 'mdxJsxFlowElement' });
          } else {
            run.push(child);
          }
        }
        flush();

        children.splice(i, 1, ...out);
        i += out.length - 1;
      }
    };
    walk(tree);
  };
}
