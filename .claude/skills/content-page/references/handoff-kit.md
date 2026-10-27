# Handoff kit — route A (external writing session)

The writing session runs outside the repository (a claude.ai Project the
owner uses for editorial work). It cannot read code, run scripts or see the
published site's files. The kit gives it everything it needs and tells it what
to leave for the repository session. This route has run since July 2026; the
rules below are the ones that removed whole classes of defects
(`draft-verification.md`).

## What goes in the kit

| # | Item | Why |
|---|---|---|
| 1 | The approved brief (`brief-<slug>.md`) | outline, query, identity, links, banned framings |
| 2 | **The research note** (`docs/research/…md`) | the brief cites its source IDs; without it the session re-researches (2026-10-18) |
| 3 | The instructions block below, pasted as is | the rules a session without the repo would otherwise guess |
| 4 | Frontmatter of one published article of the same type | the shape, not the content |

## Instructions block (paste into the writing session)

```markdown
You are drafting one article for seotecnico.dev.br in Portuguese (pt-BR).
The repository session will verify and finish it. Rules:

1. Follow the brief's outline, query and links. Where you diverge, say why in
   the delivery notes — divergence is allowed, silence is not.
2. Every external fact comes from a source in the research note, by its ID.
   If you check a source again, write the date you read it. No fact from
   memory. No number without a source (claims policy: mechanism, conditional,
   or measured magnitude).
3. NEVER write code that claims to be this site's code. Write a placeholder:
   {/* [CODE-n: what to paste, from which file] */}
   Illustrative code that is not from the site is allowed only with the label
   "Ilustrativo: não existe neste repositório".
4. Diagrams: write a placeholder {/* [SVG-X: one-paragraph spec] */} and the
   text mirror (table or paragraph) next to it. No SVG markup.
5. MDX: no H1 in the body; no double curly braces outside code; no components
   except <Image>; plain Markdown and GFM tables.
6. Quotes: at most one per source, under 15 words, in quotation marks.
7. Banned framings (from the brief): <list>. Not even negated.
8. Decisions that need the owner: [NOTA-REDACAO n: question] in the text,
   and listed again in the delivery notes.
9. Dates you cannot know: datePublished: "AAAA-MM-DD".
```

## What comes back (the return package)

| File | Contents |
|---|---|
| `<slug>.mdx` | the draft, with placeholders |
| `<slug>-entrega.md` | delivery notes: placeholders with what each needs, NOTA-REDACAO list, divergences from the brief and why, sources re-read with dates, open checks |
| `sessao-YYYY-MM-DD-<slug>.md` | session log: inputs, research done, decisions, final structure, self-validation table, pending items |

The session log of 2026-10-18 (`scaled-content-abuse`) is the model: its
pending list became the repository session's first checklist.

## When it arrives

Do not edit first. Run `check-draft.mjs <slug>.mdx --arrival --ban "<list>"`,
compare its placeholder inventory with the delivery notes, then start phase 4
of SKILL.md. The writing session's own validation table is a claim, not a
check: rerun what it lists.
