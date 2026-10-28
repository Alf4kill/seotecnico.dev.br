# What stays identical, what is adapted

The English page is the **same page for another reader**, not a word-for-word
copy. Google's hreflang rule only asks that both sides serve the same purpose
in their language; the site's own rule (CLAUDE.md §10) asks that they carry
the same facts. Everything below follows from those two. How the English
should *sound* is `style-guide.md`; this file is the contract that keeps the
pair a pair. `check-pair.mjs` (content-page skill) checks most of it.

## Keep identical

- Facts, numbers, dates, counts, verdicts and their claim level. If a number
  changes on one side, it changes on both in the same commit. Hedging is part
  of the claim level: "in this test, no" does not become "mostly not", and a
  present-tense statement does not become past tense (both were caught in the
  2026-10-27 revision).
- `category`, `status`, `datePublished` (new pairs ship in the same PR), FAQ
  count, H2 structure and order. H2 *wording* is adapted; the count and order
  are not.
- Code blocks, file paths and command output: copied, not translated —
  including Portuguese comments inside the code, since the code is the
  repository's. Escapes inside inline code (`\u003c`) are part of the code:
  the 2026-10-27 revision found one shown as `<` on the English side.
- Inline SVG diagrams: same shapes, coordinates and tokens; translate the
  `<text>` labels, the `aria-label` and the text mirror. A longer English
  label that overflows its box is shortened, never fixed by moving shapes.
- `slug` and `primaryQuery` of a **published** page: never renamed (§5.2).
- Verbatim quotes of English sources: verbatim. Quotes of Portuguese sources
  are translated and say so.

## Adapt

- **Query and slug** of a new page. The English slug carries the English
  query, so it usually differs from the Portuguese one (`hreflang-nextjs` →
  `nextjs-hreflang`, `arvore-de-acessibilidade` → `accessibility-tree`). The
  English title is written for English searchers, not translated from the
  Portuguese title.
- **Paragraphs inside a section.** Their number and order, and the order of
  sentences inside them, are free. Only the H2 sections and their order are
  fixed. An English writer opens a section with the claim; the Portuguese may
  build up to it. Keeping the Portuguese paragraph map is how the first
  revision kept Portuguese structure in English words
  (`docs/research/2026-10-27-english-register-profile.md`).
- **Sentences.** Everything in `style-guide.md` and `calques.md`. Brazil-specific
  context (pt-BR SERPs, Brazilian impressions, LGPD) stays, with one clause of
  explanation for a reader who does not know it.
- **Headings.** Written as an English writer would title the section. When a
  heading changes, its anchor changes (rehype-slug): search for links to the
  old `#anchor` in `content/en` and update them in the same commit.
- **Sources.** Prefer the English edition of a source when it exists (Google
  documentation, MDN). Keep the one-quote-per-source, under-15-words rule of
  the research notes.
- **`keywords`.** Start the list with `'english', 'inglês'` (the on-site search
  uses them to surface English pages), then English synonyms and
  abbreviations; aim for ≥3 beyond those two.

## Links

- English text links **only** to English pages (owner rule, commit `8aba089`):
  map every internal link through `TRANSLATION_PAIRS` in `src/lib/hreflang.ts`.
  The Portuguese original stays one click away through the header's language
  switch.
- If a Portuguese target has no English pair, rewrite the sentence so it does
  not need the link, or point to the closest English page. Do not link the
  Portuguese page.
- Pillar: `/en/guide/technical-seo-nextjs`. Tools: `/en/tools/json-ld-generator`,
  `/en/tools/meta-tag-validator`, `/en/tools/cwv-checker`.

## Frontmatter

```yaml
lang: "en"
translationOf: "<portuguese-slug>"   # English side only
basedOn: ['<english slug of each Portuguese source>']
```

`title` ≤60, `description` ≤155, `tldr` ≤300 characters (§10). English is
usually shorter than Portuguese, but a natural rewrite can run longer: count
after the native pass, not after the first draft.

## Closing translation note

The last line of the file (after `## Sources` when there is one), verbatim,
without a link. Articles:

> This is the English version of an article first published in Portuguese; the two declare each other.

Project entries use "a page" instead of "an article". All 24 English
articles carry the note since 2026-10-27; the guide and the case studies do
not, by design. `check-english.mjs` fails when the note is present but not on
the last line (`which-ai-assistants-run-javascript` had a paragraph after it
until the 2026-10-27 revision).
