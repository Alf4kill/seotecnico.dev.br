# Research note — template

The shape of the two notes in `docs/research/` (2026-09-13 page creation,
2026-10-18 scaled content). A note is **input for one page, not the page**: it
records what the sources say on a dated day and ends with the claims the
article may make. English, like everything in `docs/` (§10).

File: `docs/research/YYYY-MM-DD-<topic>.md`.

```markdown
# Research — <question in a few words>, <Month YYYY>

> **Status:** research note · YYYY-MM-DD · input for one article, not the article.
> **Question:** <the one question the note answers, as a yes/no or "what/how">
> **Owner constraints:** <what may not be used: a client case, a number, a name>
> **Method:** every page below was downloaded on YYYY-MM-DD and read in full
> from its HTML. The "Last updated" date is the one printed on the page.
> Pages that now redirect were read from the Internet Archive and are marked.
> Nothing here relies on memory of what a page used to say.
> **Labels:** **[documented]** = the source's own current text says it.
> **[documented, historical]** = it said so, but the page is retired or
> superseded. **[inference]** = my reading, not stated by the source.
> **[third-party]** = secondary evidence, with sample, method and conflict of
> interest. **[observation]** = something measured here on YYYY-MM-DD.
> **Quotes:** at most one per source, under 15 words.

## 0. Sources

All accessed **YYYY-MM-DD**.

| ID | Source | Last updated (as printed) |
|---|---|---|
| G1 | [title](url) | YYYY-MM-DD |

## 1. <what the primary sources say, one subsection per point> **[label]** — G1
## 2. … (history, timeline, third-party evidence, local context)

## (a) Claims the article can make
| Claim | Level (§10) | Source IDs |

## (b) Claims to avoid
| Claim | Why (no source / contradicted / third-party only) |

## (c) Open questions
Things the sources do not settle. Each becomes a NOTA-REDACAO in the brief or
is left out of the article.

## (d) Proposed angle and primaryQuery
The angle, the PT query, the EN query, and the first-hand element (§0 gate 1).
```

## Rules

- **Primary first.** The source's own page (Google Search Central, MDN, the
  framework's docs, a spec). A blog post about it is **[third-party]** and
  needs its sample, method and conflict of interest written next to it.
- **Printed date, not memory.** Record the "Last updated" the page prints. A
  claim that a page "used to say" needs the archived copy.
- **Sources IDs are stable.** The brief, the draft and the delivery notes cite
  `G1`, `a3`; the writing session needs the note to resolve them.
- **Sections (b) and (c) are not optional.** They are what keeps the draft
  from repeating a popular claim the sources do not support. The 2026-10-18
  note lists 13 claims to avoid; the brief turned five of them into banned
  framings, and the published article contains none of the five
  (`check-draft.mjs --ban` on `scaled-content-abuse.mdx`: OK).
- **One commit, before the brief:** `docs: research note on <topic>`, with a
  body that lists the sources read and what the note concludes (`5adfded`).
