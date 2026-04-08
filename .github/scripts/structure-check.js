#!/usr/bin/env node
'use strict';

/**
 * Documentation structure check
 *
 * Checks MDX files for structural issues without using AI.
 * Pass file paths as arguments:
 *   node structure-check.js path/to/file.mdx ...
 *
 * Exits with code 1 if any errors are found (PR-blocking).
 * Warnings are surfaced as annotations but do not fail the check.
 */

const fs = require('fs');

const files = process.argv.slice(2).filter(f => f.endsWith('.mdx'));

if (files.length === 0) {
  console.log('No MDX files to check.');
  process.exit(0);
}

let hasErrors = false;
const allIssues = [];

function issue(level, file, line, message) {
  if (level === 'error') hasErrors = true;
  // GitHub Actions annotation
  console.log(`::${level} file=${file},line=${line}::${message}`);
  allIssues.push({ level, file, line, message });
}

const err  = (f, l, m) => issue('error',   f, l, m);
const warn = (f, l, m) => issue('warning', f, l, m);

// ─── Check: Supademo embed uses the standard wrapper structure ─────────────
//
// Every Supademo iframe must be wrapped in the responsive div container with
// the correct aspect ratio, border colour, and border radius.
//
// Expected structure:
//   <div style={{ width: '100%', position: 'relative', paddingTop: '56.25%' }}>
//     <iframe
//       src="https://app.supademo.com/embed/..."
//       ...
//       allow="clipboard-write; fullscreen"
//       webkitAllowFullscreen="true"
//       mozAllowFullscreen="true"
//       allowFullscreen
//       style={{ ..., border: '3px solid #5E43CE', borderRadius: '10px' }}/>
//   </div>

function checkSupademoStructure(file, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes('app.supademo.com/embed/')) continue;

    // Grab context: 25 lines before the src= line (for the wrapper div attrs)
    // and 15 lines after (for the style={{ ... }} block that closes the iframe)
    const ctx = lines.slice(Math.max(0, i - 25), i + 15).join('\n');

    if (!ctx.includes("paddingTop: '56.25%'"))
      err(file, i + 1, "Supademo embed isn't using the standard wrapper — replace it with the snippet from the style guide. [technical: paddingTop: '56.25%' missing from wrapper <div>]");

    if (!ctx.includes("border: '3px solid #5E43CE'"))
      err(file, i + 1, "Supademo embed is missing the purple border — use the standard embed snippet. [technical: border: '3px solid #5E43CE' missing from iframe style]");

    if (!ctx.includes("borderRadius: '10px'"))
      err(file, i + 1, "Supademo embed is missing rounded corners — use the standard embed snippet. [technical: borderRadius: '10px' missing from iframe style]");

    if (!ctx.includes('allowFullscreen'))
      err(file, i + 1, "Supademo embed won't support fullscreen — use the standard embed snippet. [technical: allowFullscreen attribute missing from iframe]");

    if (!ctx.includes('allow="clipboard-write; fullscreen"'))
      err(file, i + 1, "Supademo embed is missing clipboard and fullscreen permissions — use the standard embed snippet. [technical: allow=\"clipboard-write; fullscreen\" missing from iframe]");
  }
}

// ─── Shared: detect headings that look like an FAQ section ───────────────
//
// Catches intentional FAQ sections regardless of how they're titled:
//   ## FAQ / ## FAQs / ## Frequently Asked Questions / ## Frequently asked questions (FAQs)
//   ## Common questions / ## Questions / ## Q&A / ## Questions and answers

function looksLikeFaqHeading(text) {
  return /^(faq|faqs|frequently asked)/i.test(text)
    || /^(common\s+)?questions?(\s+and\s+answers?)?$/i.test(text)
    || /^q\s*[&+]\s*a$/i.test(text)
    || /^q\s*and\s*a$/i.test(text);
}

// ─── Check: FAQ heading uses the standard title ───────────────────────────
//
// Any heading that looks like an FAQ section must be exactly:
//   Frequently asked questions (FAQs)
//
// Wrong: "FAQs", "FAQ", "Frequently Asked Questions", "Frequently asked questions",
//        "Common questions", "Q&A", "Questions and answers", etc.

function checkFaqTitle(file, lines) {
  const CORRECT = 'Frequently asked questions (FAQs)';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!/^#{1,6}\s/.test(line)) continue;

    const text = line.replace(/^#{1,6}\s+/, '');
    if (looksLikeFaqHeading(text) && text !== CORRECT) {
      err(file, i + 1, `FAQ section title is wrong — it must be exactly: Frequently asked questions (FAQs). [technical: heading text "${text}" does not match required value]`);
    }
  }
}

// ─── Check: FAQ section uses <AccordionGroup> ─────────────────────────────
//
// Any heading that looks like an FAQ section (correct title or not) must be
// followed by <AccordionGroup> with <Accordion> components — not plain prose,
// bullet lists, or bare <Accordion> tags outside a group.

function checkFaqUsesAccordionGroup(file, lines) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!/^#{1,6}\s/.test(line)) continue;

    const text = line.replace(/^#{1,6}\s+/, '');
    if (!looksLikeFaqHeading(text)) continue;

    let found = false;
    for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
      if (lines[j].includes('<AccordionGroup>')) { found = true; break; }
      if (/^#{1,6}\s/.test(lines[j].trim())) break; // hit the next heading
    }

    if (!found)
      err(file, i + 1, 'FAQ section must use accordions, not plain text or bullet points — wrap questions in <AccordionGroup> with individual <Accordion> components. [technical: <AccordionGroup> not found within 15 lines of FAQ heading]');
  }
}

// ─── Check: Long key-value bullet lists should use a table ────────────────
//
// 5 or more consecutive bullet items with a bold label + separator pattern
// should be a markdown table instead. Matches all three separator styles:
//
//   - **Label**: description       (colon)
//   - **Label** — description      (em dash)
//   - **Label** - description      (hyphen)
//   - **Label** – description      (en dash)

function checkBulletKeyValueShouldBeTable(file, lines) {
  let count = 0;
  let startLine = -1;

  for (let i = 0; i <= lines.length; i++) {
    const line = i < lines.length ? lines[i] : '';
    // Bold label followed by: colon, em dash, en dash, or spaced hyphen
    if (/^\s*[-*]\s+\*\*[^*]+\*\*(\s*:|\s+[-—–])/.test(line)) {
      if (count === 0) startLine = i;
      count++;
    } else {
      if (count >= 5)
        warn(file, startLine + 1, `${count} settings listed as bullet points — consider using a table instead so they're easier to scan. [technical: ${count} consecutive bullet items matching **Key**: value or **Key** — value pattern]`);
      count = 0;
      startLine = -1;
    }
  }
}

// ─── Check: Feature bullet lists should use <CardGroup> ──────────────────
//
// 3 or more consecutive bullet items with a bold feature name (no colon
// immediately after) should use <CardGroup> with <Card> components instead.
//
//   - **Feature name** description   →  <CardGroup><Card ...>

function checkBulletFeaturesShouldBeCards(file, lines) {
  let count = 0;
  let startLine = -1;

  for (let i = 0; i <= lines.length; i++) {
    const line = i < lines.length ? lines[i] : '';
    // Bold bullet item where ** is NOT followed by any key-value separator
    if (/^\s*[-*]\s+\*\*[^*]+\*\*(?!\s*:|\s+[-—–])/.test(line)) {
      if (count === 0) startLine = i;
      count++;
    } else {
      if (count >= 4)
        warn(file, startLine + 1, `${count} features listed as bullet points — consider using cards instead so they stand out visually. [technical: ${count} consecutive bullet items matching **Feature** pattern, use <CardGroup> with <Card> components]`);
      count = 0;
      startLine = -1;
    }
  }
}

// ─── Check: Images must have alt text ────────────────────────────────────
//
// ![](path) has no alt text and is inaccessible. Require descriptive alt text.

function checkImageAltText(file, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (/!\[\s*\]\(/.test(lines[i]))
      err(file, i + 1, 'Image has no alt text — add a short description of what the image shows inside the brackets, e.g. ![The agent configuration panel](path). [technical: empty alt attribute detected in markdown image syntax ![](path)]');
  }
}

// ─── Run all checks ───────────────────────────────────────────────────────

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log(`::warning::File not found, skipping: ${file}`);
    continue;
  }

  const lines = fs.readFileSync(file, 'utf8').split('\n');

  checkSupademoStructure(file, lines);
  checkFaqTitle(file, lines);
  checkFaqUsesAccordionGroup(file, lines);
  checkBulletKeyValueShouldBeTable(file, lines);
  checkBulletFeaturesShouldBeCards(file, lines);
  checkImageAltText(file, lines);
}

// ─── Console summary ──────────────────────────────────────────────────────

const errors   = allIssues.filter(i => i.level === 'error').length;
const warnings = allIssues.filter(i => i.level === 'warning').length;
console.log(`\nChecked ${files.length} file(s): ${errors} error(s), ${warnings} warning(s)`);

// ─── GitHub step summary ──────────────────────────────────────────────────

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  let md;
  if (allIssues.length === 0) {
    md = '## Documentation Lint Checks\n\n✅ All lint checks passed.\n';
  } else {
    const rows = allIssues
      .map(({ level, file, line, message }) =>
        `| ${level === 'error' ? '❌ Error' : '⚠️ Warning'} | \`${file}\` | ${line} | ${message} |`
      )
      .join('\n');
    md = [
      '## Documentation Lint Checks',
      '',
      `${errors} error(s) · ${warnings} warning(s)`,
      '',
      '| Level | File | Line | Issue |',
      '|---|---|---|---|',
      rows,
      '',
    ].join('\n');
  }
  fs.appendFileSync(summaryPath, md);
}

process.exit(hasErrors ? 1 : 0);
