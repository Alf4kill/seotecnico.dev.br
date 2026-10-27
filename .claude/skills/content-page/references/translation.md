# Writing the English side

The English page is the **same page for another reader**, not a word-for-word
copy. Google's hreflang rule only asks that both sides serve the same purpose
in their language; the site's own rule (CLAUDE.md §10) asks that they carry
the same facts. Everything below follows from those two.

## Keep identical

- Facts, numbers, dates, counts, verdicts and their claim level. If a number
  changes on one side, it changes on both in the same commit.
- `category`, `status`, `datePublished` (new pairs ship in the same PR), FAQ
  count, H2 structure and order. `check-pair.mjs` checks these.
- Code blocks, file paths and command output: copied, not translated. Only the
  comments around them change language.
- Inline SVG diagrams: same shapes and tokens; translate the `<text>` labels
  and the text mirror.

## Adapt

- **Query and slug.** The English slug carries the English query, so it
  usually differs from the Portuguese one (`hreflang-nextjs` →
  `nextjs-hreflang`, `arvore-de-acessibilidade` → `accessibility-tree`). The
  English title is written for English searchers, not translated from the
  Portuguese title.
- **Sentences.** Short, plain English. Brazil-specific context (pt-BR SERPs,
  Brazilian impressions, LGPD) stays, with one clause of explanation for a
  reader who does not know it.
- **Sources.** Prefer the English edition of a source when it exists (Google
  documentation, MDN). Quotes of English sources are verbatim on the English
  side; keep the one-quote-per-source, under-15-words rule of the research
  notes.
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

## Closing translation note

The last line of the file (after `## Sources` when there is one), verbatim,
without a link:

> This is the English version of an article first published in Portuguese; the two declare each other.

22 of the 24 English articles carry it; the two published on 2026-10-23 do not
(see the proposal's observations). Ask the owner before adding it to those two.
