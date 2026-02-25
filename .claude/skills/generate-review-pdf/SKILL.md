---
name: generate-review-pdf
description: Generate a PDF of a documentation page for external teams to review before shipping
disable-model-invocation: true
argument-hint: "[path-to-mdx-file]"
---

# Generate review PDF

Convert a documentation `.mdx` page into a clean, styled PDF for external review (e.g. product managers, stakeholders). The PDF is saved to `~/Downloads/`.

## Input

`$ARGUMENTS` should be the path to an `.mdx` file (relative or absolute). If not provided, ask the user which page to convert.

## Steps

1. **Read the `.mdx` file** to get the full page content.

2. **Generate an HTML file** in `/tmp/` that faithfully renders the page content with clean styling. Use the template structure from [template.html](template.html) as the base.

3. **Content conversion rules** — convert MDX components to their HTML equivalents:

   | MDX Component | HTML Equivalent |
   |---------------|-----------------|
   | `<Warning>` | Yellow callout box with "WARNING" label |
   | `<Note>` | Blue callout box with "NOTE" label |
   | `<Tip>` | Green callout box with "TIP" label |
   | `<Info>` | Blue callout box with "INFO" label |
   | `<Columns>` + `<Card>` | CSS grid of styled card boxes |
   | `<AccordionGroup>` + `<Accordion>` | **Fully expanded** FAQ items — show question as header, answer as body. Accordions don't work in PDFs so all content must be visible. |
   | `<Steps>` + `<Step>` | Numbered list with step titles as bold headings |
   | `<Tabs>` + `<Tab>` | Show all tabs expanded with tab title as heading |
   | Supademo `<iframe>` | **Cannot embed in PDF.** Replace with a styled clickable link box pointing to the Supademo URL. Convert the embed URL from `/embed/[ID]` to `/demo/[ID]` for the link. Label it "Interactive Walkthrough (Supademo)" with the iframe's `title` attribute as the link text. |
   | `<CardGroup>` | CSS grid of linked card boxes |
   | Markdown headings, lists, bold, links | Standard HTML equivalents |

4. **Add a review banner** at the top of the PDF with:
   - "Documentation Review Draft" label
   - Current date
   - The file path / destination URL if known
   - Current git branch name

5. **Convert HTML to PDF** using Chrome headless:
   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --print-to-pdf="$OUTPUT_PATH" "$HTML_PATH"
   ```

6. **Clean up** the temporary HTML file.

7. **Tell the user** the output path.

## Output filename

Derive the PDF name from the MDX filename:
- `user-level-authentication.mdx` → `User-Level-Authentication-Review.pdf`
- `quick-start-guide.mdx` → `Quick-Start-Guide-Review.pdf`

Save to `~/Downloads/`.

## Styling guidelines

- Use system fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`)
- Max width 800px, centered
- Purple accent color `#5E43CE` for Supademo link borders (matches the docs brand)
- Cards: light grey background `#f8f8fc`, subtle border
- Callouts: coloured left border with tinted background
- FAQs: bordered boxes with grey header background, fully expanded
- Add `page-break-inside: avoid` on cards, callouts, and FAQ items
- Add `print-color-adjust: exact` for print media
