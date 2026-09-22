/**
 * Lifts <RequestExample> and <ResponseExample> to the top of the page, inside
 * one <ApiExamples> wrapper.
 *
 * Mintlify never renders these where the author wrote them -- always at the
 * bottom of the file. From 1280px it shows them in a 448px rail beside the
 * content; below that, inline straight after the page description. Both are
 * "at the top", so moving the nodes once serves both, and relevance.css
 * places the wrapper (see .rl-api-examples). Request is stacked above
 * Response, as Mintlify stacks them.
 */
export function remarkApiExamples() {
  return (tree) => {
    const picked = [];
    tree.children = tree.children.filter((n) => {
      const hit = n.type === 'mdxJsxFlowElement' && (n.name === 'RequestExample' || n.name === 'ResponseExample');
      if (hit) picked.push(n);
      return !hit;
    });
    if (!picked.length) return;
    picked.sort((a, b) => (a.name === 'RequestExample' ? 0 : 1) - (b.name === 'RequestExample' ? 0 : 1));
    tree.children.unshift({ type: 'mdxJsxFlowElement', name: 'ApiExamples', attributes: [], children: picked });
  };
}
