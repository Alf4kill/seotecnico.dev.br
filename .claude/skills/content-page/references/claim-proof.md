# Claims that need a document

Some sentences need the page that proves them linked next to them. Most do
not. This file says which ones, what counts as proof, how phases 1, 3 and 4
apply it to a new page, and how to apply it to a published pair.

**Why.** On the index bloat article (PR #159, 2026-11-17) two of the owner's
objections to the draft started this method. It used a market term ("index bloat") for a state of
the index that only Search Console confirms, and it called three hosts'
responses wrong without saying why or where that is written. The rewrite that
answered them is the method below. Google's own self-assessment questions ask
whether content presents information "in a way that makes you want to trust
it", with clear sourcing, and whether it has easily verified factual errors
([Creating helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content),
read 2026-11-18). Outbound links are not a ranking signal. What helps is that
the reader can check the text. On the older pages the gap is real: of the 12
July pages (11 articles and the pillar), only `melhorar-lcp-nextjs` links a
Google, web.dev or Chrome page. In the Portuguese revision batches 1 and 2
(#150, #152), readers reading for style found at least one factual problem on
each of the seven July pages they read.

## The rule

A sentence links the page that proves it, **next to the sentence** and not
only under Fontes, when both of these are true:

- it says what Google (or another crawler or assistant) does, or that
  something hurts crawling, indexing or ranking;
- this site has no measurement that proves it.

What counts as proof:

- **A measurement of this site**, linked to its versioned artifact (log row,
  audit, lab record). It is the strongest proof, because it is the original
  part of the page. The document then proves the mechanism that explains the
  measurement. It does not replace it.
- **A primary source**, in the order below.

What needs no link: general HTML and HTTP knowledge that says nothing about
the effect on Google, code, implementation steps, and this site's own
decisions.

There is no link quota. A page cited twice in the same section is linked
once. The 17 Google links in the body of `index-bloat` are what a diagnosis,
where almost every sentence says something is wrong, needed. They are not a
target: a Next.js tutorial may need none. Too many links and caveats tire the
reader, and "não está documentado" in every section leaves the page without
a position.

## Source order

1. Google's own documentation: developers.google.com (including
   `/crawling`), support.google.com, the Search Central blog.
2. The documentation of whoever makes the technology: nextjs.org, web.dev,
   developer.chrome.com, Cloudflare, WordPress.
3. Specifications: RFC, WHATWG, W3C.
4. A market glossary (Ahrefs, Semrush, Moz) only to define a term, never as
   proof of an effect.

A statement by a Google employee (a talk, a post, an interview) is a
statement, not documentation. The sentence says so. Open every page directly
and read it on the day. Never run a Google search to find or check one: the
project treats automated queries as a spam-policy violation
(`docs/proposals/case-studies-content.md` §4).

## When a sentence uses a market term or says something is bad

These are the remaining rules of the index bloat rewrite. They apply only to
these sentences, which in a diagnosis are most of the page and in a tutorial
are few.

1. **Check the term in both sources.** Read the market definition and
   Google's documentation. When they diverge, use the term for what it is and
   say only what the evidence at hand supports. (`index-bloat` says the site
   "has the ingredients" of index bloat, and points to the indexing report
   for the confirmation.)
2. **Each effect a definition promises needs its own proof.** The crawl
   budget effect does not hold for a site of a few hundred URLs: Google's
   guide addresses sites with more than a million pages, or more than ten
   thousand that change every day.
3. **A claim that something is bad says why.** What the response tells the
   crawler, what actually happened, what the documentation says follows, and
   what the right response would be.
4. **Say what is not a problem, with the same proof.** A fixed description is
   acceptable on aggregation pages, per Google's snippet page.
5. **When the documentation does not settle it, say so,** once, where it
   matters.

## In the pipeline

- **Phase 1.** In the note's table "(a) Claims the article can make", a
  claim of this rule cites the source ID of the page that proves *that*
  claim. A claim with no such page goes to (b) or (c), labelled "not
  documented".
- **Phase 3.** The link goes next to the sentence it proves, and a "this is
  bad" sentence carries its why.
- **Phase 4, step 3.** Open each link that sits next to a claim and read the
  passage: it must prove that sentence, not only exist.

## Claim review of a published pair

Applying the rule to a page that is already published. It changes facts, so
it runs under "Updating an existing pair" in `SKILL.md`, not under
`portuguese-style`, whose rule 2 forbids adding a source.

### Choosing the pages

Read a manual Search Console export (§7.3: there is no API access), **Portuguese
side**. The English side shows the cost, because it changes in the same PR,
but ranking in English is not a goal of the project. The checks, in order:

| What the export shows (PT) | Likely cause | Review? |
|---|---|---|
| A wrong or outdated claim, however it was found | Content error | Yes, first, whatever the traffic |
| Out of the index in two consecutive exports, or not indexed in URL Inspection | Indexing | Not yet. The technical reason comes first (`docs/gsc-reading-notes.md` §1) |
| Position up to 10, few impressions | Little demand: the page is already on page one | Only if the review finds an error. Proof does not create searches |
| Position 11 to 30, no clicks | Competition, depth or trust (a hypothesis, not a measurement) | Yes. This is the target group |
| Position above 30 | Authority or a different search intent | Rarely. Proof alone is unlikely to be enough |
| Good position, low CTR | Title and snippet | No. That is other work |

With 20 to 60 impressions a page, the average position swings with a single
query. It chooses the pages. It proves nothing afterwards.

### The procedure

1. **Before.** Record the URL Inspection state of both URLs (the log row
   needs it). Check the Search Status Dashboard: the `portuguese-style` rule
   on batches applies, so wait for a core update to finish, or say in the row
   that the change shipped during the rollout.
2. **Read for claims, not style.** Go through the Portuguese page against its
   sources and the repository, as phase 4 steps 3 to 5 do. List every claim
   the rule covers, and mark each one: kept, corrected, proved (link added),
   or "not documented". Open every external link already in the page: a
   redirect is updated to its final URL, and a dead page is replaced or the
   sentence is reworded.
3. **Edit.** Correct the claims and add the links. Make the same corrections
   and links on the English page in the same PR, with `english-version` on
   the passages that changed. Run `check-portuguese.mjs` on the Portuguese
   page and the phase 7 scripts on both.
4. **`dateModified`.** Raise it on a side only when a claim changed there
   (corrected, narrowed or removed). A link added to a sentence that was
   already right is not a change of substance. Google warns against changing
   dates to make pages seem fresh.
5. **Log row.** The pages, the index state before, and the counts per page
   (claims corrected, proved, left as not documented). "No prediction": human
   traffic cannot detect an effect of this size (§7.3, power rule), and no
   later check is registered (nothing pending at publication). A comparison
   made months later is a new observation with its own row.
6. **PR description.** The claim list per page, with its marks. The
   corrections are the evidence that the review was worth doing, whatever
   Search Console shows later.
