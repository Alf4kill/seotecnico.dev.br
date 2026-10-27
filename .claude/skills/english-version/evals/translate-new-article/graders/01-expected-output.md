---
type: llm
focus: trace
weight: 1
---

The result matches this description: The run reads references/structure.md and references/style-guide.md, builds an intent map of the Portuguese page before writing English, writes content/en/blog/sec-fetch-mode-header-draft.mdx without reading content/en/blog/sec-fetch-mode-header.mdx, keeps every number, date, hedge, code block (including Portuguese comments), H2 count and FAQ count identical to the Portuguese, links only to /en pages, uses American spelling and Month D, YYYY dates in prose, and ends with the translation note as the last line. It runs check-english.mjs on the new file (0 errors) and reports its judgment calls (title, headings, glossary choices) rather than a list of edits. It does not edit content/blog/sec-fetch-mode.mdx.
