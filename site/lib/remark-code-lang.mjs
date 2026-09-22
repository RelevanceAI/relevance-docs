/**
 * Normalizes code-fence language names.
 *
 * Mintlify is lenient about fence languages; Shiki is strict and throws
 * "Language `Python` not found", which fails the whole build. This corpus
 * carries `Python` (6), `python3` (4), `https` (2) and `SOQL` (1) -- 13
 * fences that would otherwise block the migration.
 *
 * Rules: lower-case, apply aliases, and fall back to `text` for anything
 * Shiki does not bundle, so a future bad fence degrades to plain text
 * instead of breaking the build.
 *
 * It also carries the fence title across. Mintlify writes it as a bare word
 * after the language (```json Cursor); fumadocs wants title="Cursor". 119
 * fences use it, and inside a <CodeGroup> it IS the tab label -- without it
 * the three-way MCP config on /docs/integrations/mcp/mcp-server reads
 * "Tab 1 / Tab 2 / Tab 3" instead of "Cursor / VS Code / Windsurf".
 */
import { bundledLanguages } from 'shiki';

const KNOWN = new Set(Object.keys(bundledLanguages));
// Shiki always accepts these as "no highlighting".
const PLAIN = new Set(['text', 'plaintext', 'txt', 'plain', 'ansi', '']);

const ALIASES = {
  python3: 'python',
  py: 'python',
  soql: 'sql',
  https: 'http',
  node: 'javascript',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  jsonc: 'json',
  curl: 'bash',
};

export function remarkCodeLang() {
  return (tree) => {
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'code' && typeof node.lang === 'string') {
        let lang = node.lang.trim().toLowerCase();
        lang = ALIASES[lang] ?? lang;
        if (!KNOWN.has(lang) && !PLAIN.has(lang)) lang = 'text';
        node.lang = lang;

        // A meta string with no `key=value` in it is a Mintlify title.
        const meta = node.meta?.trim();
        if (meta && !meta.includes('=')) node.meta = `title="${meta.replace(/"/g, '&quot;')}"`;
      }
      for (const c of node.children ?? []) walk(c);
    };
    walk(tree);
  };
}
