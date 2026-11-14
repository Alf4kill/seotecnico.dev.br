# Counting the imperative in the Portuguese reader-address measure

> **Date:** 2026-11-14 · **Status:** done · **Decision:** owner, 2026-11-14,
> option (a) of `docs/research/2026-11-13-style-skills-in-practice.md` §5.4
> ("count the imperative and measure the native band again").
> **Code:** `fc02dd2` (`register-pt.mjs`, `calibrate-register-pt.mjs`).

## 1. Question

`check-portuguese.mjs` warned on "você" for 25 of 31 published pages at
`bda4f98`. The working explanation (the analysis note above, §5.4, and the
project entry `revisao-do-portugues`) was that the site addresses its reader
in the imperative ("rode", "compare", "confira"), which the measure did not
count. If that was right, counting the imperative would bring the site's
pages into the band. If not, the warning points at a real difference.

## 2. Method

**What counts as an imperative.** Portuguese has no imperative form of its own
for "você": it is the present subjunctive, which also follows "que". So the
count (`imperativesOf()` in `register-pt.mjs`) is a lexicon of about 150 verbs
that technical prose uses to give instructions, plus their plurals and nine
"-se" forms ("lembre-se", "certifique-se"), counted only where an instruction
starts:

- at the start of a sentence or clause (after `,` `;` `:`);
- after "e" or "ou";
- after a clause-initial adverb ("Não use", "Depois abra").

It skips:

- a form right after a subject ("que", "se", "você", "o");
- a form inside a quotation (a quoted prompt such as "Liste as URLs…" is not
  addressed to the reader);
- a form that is also a noun or adjective ("teste", "peça", "grave", "note"),
  unless a determiner follows ("Teste o", not "o teste" or "peça por peça").

The feature keeps its id (`voce`) and counts "você" plus imperatives per 100
words of running prose. Lists, tables, headings and code stay out, as before.

**Checks on the detector.**

- *Site:* every match on the 32 Portuguese pages was read in its sentence. Of
  the false positives found, all were inside quotations: prompts in
  `auditoria-seo-com-ia`, quoted guidance in `auditoria-de-sitemap` ("Liste
  as URLs…") and a quoted "baixe já" in `lcp-alto-next-js`. The quotation
  rule removed them. 80 imperatives remain; a few borderline ones
  stay in (an idiom such as "diga o user agent o que disser").
- *Native corpus:* only the matched forms were printed, never text. All were
  instruction verbs ("use", "faça", "verifique", "veja", "coloque",
  "lembre-se", …).
- *Recall* was not measured. A verb missing from the lexicon is not counted,
  so the values are a floor.

**Native band.** `calibrate-register-pt.mjs --pages --write --only voce`
fetched the 22 corpus pages again. `diegoeis.com` now answers HTTP 403 to the
script, and the page was dropped rather than fetched another way. The band
for this feature comes from the other **21 pages** (8 sites, 10 authors,
21,048 words of prose). The other seven features keep the band of
2026-11-11 (`cf086ec`, 22 pages): `--only` replaces one feature and records
that measure under `remeasured` in `register-thresholds-pt.json`.

## 3. Results

Values per 100 words of running prose, p10 / median / p90.

| | "você" | imperative | both |
|---|---|---|---|
| native (21 pages) | 0.30 / 0.80 / 1.70 | 0 / 0.17 / 0.68 | **0.53 / 1.25 / 2.06** |
| site (32 pages) | 0 / 0.08 / 0.37 | 0 / 0.14 / 0.37 | 0 / 0.20 / 0.66 |

On "você" alone, the 21 pages give the p10 and median of the 22 measured on
2026-11-11 (0.3 and 0.8); the p90 is 1.70 instead of 1.85. Dropping one page
moved only the top of the band, which this feature does not warn on.

Site pages below the new p10 (0.53): **26 of 32**. With the old measure: 25 of
31 (the 32nd page, `revisao-do-portugues`, was published on 2026-11-14 and
is below on both measures).

## 4. Finding

The explanation was wrong. In running prose the site uses the imperative
almost as often as native authors (median 0.14 against 0.17), but uses "você"
a tenth as often (0.08 against 0.80). Counting the imperative raised the
native band as much as the site's values, so the warning stays on the same
pages. It now points at a real difference in how the site addresses its
reader, not at a gap in the script.

What does not follow: that a page should add "você" to reach the band. The
skill's rule stands (`marcas-ptbr.md`, false positives): where the reader
acts, an impersonal frame can become "você" or the imperative; adding "você"
only to move the number is writing for the metric.

## 5. Changed with this note

- `register-thresholds-pt.json`: `voce` band 0.53 / 1.25 / 2.06, with
  `remeasured.voce`.
- `marcas-ptbr.md`, `estilo-ptbr.md`, `voz.md`: the measure's new definition
  and values.
- Project entry `revisao-do-portugues` / `how-portuguese-is-reviewed`: the
  "você" item and the band table, with this result.
- `docs/research/2026-11-13-style-skills-in-practice.md` §5.4: dated note
  pointing here.

## 6. Reproducing

```bash
node .claude/skills/portuguese-style/scripts/calibrate-register-pt.mjs --pages
node .claude/skills/portuguese-style/scripts/check-portuguese.mjs --published --summary
```

The first needs network, and the corpus pages can change or stop answering.
Run at the commit that added this note to get the values above.
