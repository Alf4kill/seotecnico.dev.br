# Research — the register of the English pages against native technical English, October 2026

> **Status:** research note · 2026-10-27 · input for a change to the
> `english-version` skill (blind English draft, Google style as the base,
> register profile in `check-english.mjs`), not an article.
> **Question:** after the revision of the same day removed every known calque,
> do the English pages still differ from native technical English, and in
> what measurable way?
> **Trigger:** the owner's review of `/en/project/how-a-page-is-made`,
> published right after that revision: too many "the", and more broadly
> English that is correct but built on Portuguese structure.
> **Method:** register features measured with
> `.claude/skills/english-version/scripts/register.mjs` on 26 native pages
> (`native-corpus.json`) and on the 28 English pages of the site, at
> `4a1f512`. Thresholds written to `register-thresholds.json`.
> **Labels:** **[documented]** = the source's own text says it.
> **[inference]** = my reading. **[observation]** = measured here on
> 2026-10-27.
> **Quotes:** at most one per source, under 15 words. No corpus text is
> stored in the repository: the scripts keep counts only.

## 0. Sources

All accessed **2026-10-27**.

| ID | Source |
|---|---|
| G1 | [Google developer documentation style guide: Commas](https://developers.google.com/style/commas) |
| G2 | [Google developer documentation style guide: Contractions](https://developers.google.com/style/contractions) |
| G3 | [Google developer documentation style guide: Second person](https://developers.google.com/style/person) |
| G4 | [Google developer documentation style guide: Active voice](https://developers.google.com/style/voice) |
| G5 | [Google developer documentation style guide: Colons](https://developers.google.com/style/colons) |
| G6 | [Google developer documentation style guide: Semicolons](https://developers.google.com/style/semicolons) |
| G7 | [Google developer documentation style guide: Dates and times](https://developers.google.com/style/dates-times) |
| G8 | [Google developer documentation style guide: Voice and tone](https://developers.google.com/style/tone) |
| C | The 27 pages in `.claude/skills/english-version/scripts/native-corpus.json`: 17 documentation pages (Google Search Central, web.dev) and 10 first-person write-ups from US-based companies and engineers (Vercel, Dan Luu, Alex Russell, Tim Kadlec, Nolan Lawson, Kent C. Dodds, Brad Frost) |
| R | `docs/research/2026-10-27-english-translation-quality.md` (the revision this note follows) |

## 1. Why a base style guide

The site's English style guide was written from scratch during the revision
of the same day. One of its rules, "no serial comma (the site's existing
style)", turned a Portuguese habit into a house rule: Portuguese does not use
the serial comma, and the existing pages had been written from Portuguese.
**[inference]**

The Google developer documentation style guide is written for the same
reader (developers), in American English, and the documentation half of the
corpus follows it. What it says on the points that matter here:

- Serial comma: use it in a series of three or more items. **[documented]** — G1
- Contractions: yes, especially negations ("it's harder to misread don't as
  do"). **[documented]** — G2
- Address the reader as "you", not "we". **[documented]** — G3
- Active voice; make clear who performs the action. **[documented]** — G4
- A colon introducing a list follows a complete sentence; in general,
  lowercase after a colon. **[documented]** — G5
- "If possible, avoid using semicolons." **[documented]** — G6
- Dates as January 19, 2017; numeric dates in ISO 8601. **[documented]** — G7
- Conversational, friendly and respectful, not pedantic. **[documented]** — G8

Decision (owner, 2026-10-27): the Google guide is the base, and the site's
`style-guide.md` keeps only its deviations and its glossary. Deviations kept:
"I" for the owner's own decisions and measurements (one author, not an
organization), 24-hour UTC times where the repository records them, en dash
in numeric ranges, straight quotes.

## 2. What was measured **[observation]**

`register.mjs` keeps running prose only: paragraphs of 25 or more words that
end like a sentence and have a sentence break at least every 60 words. Code,
tables, lists, headings, quotes, captions and navigation are left out;
inline code counts as one token. Per page:

| Feature | Docs p50 | First-person p50 | Native p10 | Native p50 | Native p90 | Site p50 |
|---|---|---|---|---|---|---|
| "the" per 100 words | 6.1 | 4.8 | 3.0 | 5.7 | 8.3 | 9.5 |
| % of sentences opening with "The" | 10.4 | 6.3 | 3.2 | 10.4 | 18.2 | 23.9 |
| Colons per 100 sentences | 0.0 | 3.2 | 0.0 | 1.6 | 6.5 | 25.0 |
| Semicolons per 100 sentences | 0.0 | 0.0 | 0.0 | 0.0 | 13.3 | 9.5 |
| "you/your" per 100 words | 2.2 | 0.7 | 0.4 | 1.5 | 2.9 | 0.6 |

Corpus: 26 of the 27 pages, 41,097 words of prose (one Search Central page,
the sitemaps overview, had too little running prose and was skipped).

"the" per paragraph (paragraphs of 40 or more words):

| | Paragraphs | p50 | p90 | p95 |
|---|---|---|---|---|
| Native | 523 | 5.6 | 10.6 | 12.2 |
| Site | 489 | 9.2 | 14.1 | 15.9 |

106 of the site's 489 paragraphs are above the native p95.

Site pages past each threshold (native p90 for the first four, p10 for
"you"): "the" 23 of 28, "The" openers 23 of 28, colons 28 of 28, semicolons
5 of 28, "you" 8 of 28.

Reproduce (network needed; the corpus pages can change, so a rerun can move
the numbers):

```bash
git checkout 4a1f512 -- content/en
node .claude/skills/english-version/scripts/calibrate-register.mjs
git checkout HEAD -- content/en
```

## 3. What the numbers say

- **Colons are the strongest signal.** The median site page uses 16 times
  the native median, and every page is past the native p90. A sample of 25
  of the 435 colons in blog prose was nearly all "setup: payoff" sentences
  ("The practical takeaway is different: important facts need to be in the
  visible text too"). Each is grammatical English. The rate is what reads
  as translated. **[observation]** So the check is a page-level rate, not a
  warning per colon. **[inference]**
- **"the" and "The" openers come together.** The site's prose opens a
  sentence with "The" more than twice as often as the native median: "The
  mechanism is the same…", "The prevention is the same…", "The bigger
  problem is the explanation." These are Portuguese noun-phrase subjects ("O
  mecanismo é o mesmo"). **[observation]** + **[inference]**
- **"you" depends on genre.** First-person write-ups use it about as rarely
  as the site (0.7 vs 0.6 per 100 words), documentation three times as
  often. The threshold is the native p10, so only pages that almost never
  address the reader are flagged. **[observation]**
- **Semicolons are not a site-wide problem.** Native first-person writers
  vary widely (one author drives the p90); 5 site pages are past it.
  **[observation]**
- **Sentence length, passive voice and contractions** were measured in the
  pilot and left out: the site is within or on the native side of the corpus
  on all three. **[observation]**

## 4. False positives **[observation]**

The owner asked for the rate before any rule ships (as a warning, never an
error).

- **Paragraph "the" density.** 15 of the 106 flagged paragraphs, picked at
  even intervals and read by hand: 8 read as Portuguese structure ("X is the
  same as…", noun-phrase openers, colon labels), 1 borderline, 6 fine as they
  stood (the articles were required: unique referents already introduced, a
  run of "the screen… the tree…" in a comparison). About **6 in 15 (40%)
  are false positives**.
- **Colons.** Individually almost never wrong (above): a per-colon rule
  would be close to 100% false positives, so there is none.
- **Pattern rules** proposed with the measurement: `the-coord` ("the X and
  the Y") 28 hits, `the-genitive` ("the X of/in the Y") 82, `the-heading`
  ("The X" headings) 7, `is-the-same` 6, `between-me` 1. Many `the-coord`
  and `the-genitive` hits are correct ("the vendor and the IP" names two
  different things). They are questions for the reviser.

A 40% false-positive rate is why all of it is WARN. It ranks pages and
points at paragraphs; it does not decide.

## 5. Why the method still produced translated structure **[inference]**

The revision of the same day (R) rewrote all 28 pages and removed 263
script-detectable calques. The register numbers above are from after that
revision. Three reasons, in the order they matter:

1. **The English drafter had the Portuguese prose open.** The skill's step 2
   said "with the Portuguese open only to copy what is verbatim". In
   practice the English kept the Portuguese paragraph order, sentence order
   and noun-phrase subjects. How-a-page-is-made, written in that same PR, is
   among the pages furthest from native (4 of 5 features past threshold).
2. **The intent map was not a file** ("write down for yourself"), so it
   collapsed into the Portuguese text it was supposed to replace.
3. **The checks measured words, not structure.** The revision optimized
   against the calque list and reached 0 errors; colon rate, noun-phrase
   openers and article density were never measured.

R2 of the first note found that specific linguistic instructions beat
"make it natural". The register features give the native reader those
instructions.

## (a) Decisions

| Decision | Why |
|---|---|
| Google developer documentation style guide as the base; `style-guide.md` keeps deviations and glossary | same audience, American English, the corpus follows it; the house rules had absorbed a Portuguese habit |
| Serial comma from now on | G1; the "no serial comma" rule came from Portuguese. Published pages converted in the follow-up revision, not here |
| The intent map becomes a fact sheet file; the English draft is written by a reader that never sees the Portuguese prose | §5, reasons 1 and 2 |
| Paragraph order and count, and sentence order, are free inside each H2 | the pair contract needs the same facts and H2 structure, not the same paragraphs |
| Register profile in `check-english.mjs` as WARN, ranked in `--summary` | §4: 40% false positives on the paragraph rule |
| Thresholds: native p90 (p10 for "you") per page, p95 per paragraph | a page past p90 on several features is unusual for native prose; p95 keeps the paragraph list short enough to read |

## (b) Claims to avoid

| Claim | Why |
|---|---|
| "The English now reads as native" | the profile measures distance on five features; a page inside every threshold can still read as translated, and no native human reader has reviewed it |
| "Native English uses N% of 'the'" | the corpus is 26 pages of one genre, chosen by me; the numbers describe this corpus |
| "The site's colons are errors" | each is grammatical; the rate is the finding |

## (c) Open questions

1. A human native reader for a sample of pages, to check what the profile
   cannot (carried over from R, still open).
2. Should the register profile gate anything? Not with a 40% false-positive
   rate; revisit if a revision brings every page inside the thresholds.
3. A larger first-person corpus, closer to the lab pages' genre (only 10
   pages now).
