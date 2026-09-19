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
        // Mintlify allows `js title="x"` style metadata in the info string.
        let lang = node.lang.trim().toLowerCase();
        lang = ALIASES[lang] ?? lang;
        if (!KNOWN.has(lang) && !PLAIN.has(lang)) lang = 'text';
        node.lang = lang;
      }
      for (const c of node.children ?? []) walk(c);
    };
    walk(tree);
  };
}
