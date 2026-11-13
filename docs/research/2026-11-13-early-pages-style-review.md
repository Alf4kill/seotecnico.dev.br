# Research — the style review run on the first three articles, November 2026

> **Status:** research note · 2026-11-13 · first practical use of the
> `portuguese-style` skill after step 5 of `docs/proposals/portuguese-style.md`;
> input for the project entry about the plan, not an article.
> **Question:** how were the first articles written, and does the review
> skill work on them: does it move the register toward native, keep every
> fact and hedge, and stay out of the content?
> **Method:** the skill's steps 1–6 on the three oldest Portuguese articles,
> in analysis mode. The edited copies stay in the session's scratchpad. No
> published page changed: a batch revision of published pages waits for the
> running core update (proposal §6–§7, step 6).
> **Measured at:** `99217a2` (main after PR #141).
> **Labels:** **[observation]** = measured or read here on 2026-11-13.
> **[inference]** = my reading.

## 1. The pages and how they were written

| Page | Published | Publish commit |
|---|---|---|
| `melhorar-lcp-nextjs` (LCP hub) | 2026-07-17 | `d70d7c3` |
| `lcp-alto-next-js` (LCP spoke) | 2026-07-18 | `1c6bcca` |
| `json-ld-nextjs` (JSON-LD spoke) | 2026-07-19 | `8a8b845` |

**[observation]** The three came from an external writing session through
the handoff kit, were verified in the repository and published with the
editorial decisions of the handoff "kept intact" (commit body of
`d70d7c3`). No style pass existed: the checks of July were frontmatter,
links and claims. The register was whatever the writing session produced.

**[observation]** Medians by publication period, with the same measure as
the band (`register-pt.mjs`; colons, dashes and semicolons per 100
sentences, "você" per 100 words, lists per 1,000 words):

| Period | Pages | Colons | Dashes | Semicolons | Words per sentence | "Você" | Lists |
|---|---|---|---|---|---|---|---|
| July (Next.js cluster) | 12 | 31.2 | 30.4 | 7.8 | 21.5 | 0.2 | 4.4 |
| Sep 13–24 | 1 | 17.4 | 13.0 | 8.7 | 16 | 0 | 14.3 |
| Sep 25 – Oct 19 | 10 | 21.5 | 0 | 2.5 | 17 | 0.1 | 8.8 |
| Oct 20 – Nov | 7 | 21.9 | 0 | 2.1 | 16 | 0 | 15.9 |
| Native median | 22 | 4.55 | 0 | 0 | 17 | 0.8 | 2 |

**[inference]** The July pages carry the generated register at its
strongest: dash asides and long sentences. Both dropped from late
September; this note did not look for the cause. Colons fell less (31 → 22, still about five times native) and
"você" never rose. Lists grew: later pages traded dashes for bullets.

## 2. The pass

Per page: `check-portuguese.mjs` (step 1), a hedge list written to the
scratchpad before any edit (step 2), a fresh reader in a new subagent with
the step 3 prompt, read-only on the repository (step 3), my judgment of each
proposal against `voz.md` and "What not to fix", the accepted edits applied
by script to a copy (step 4), then `placeholders.mjs compare`, a hedge
marker count and the checks (steps 5–6).

**[observation]** Register before → after the accepted edits:

| Page | Proposals | Accepted | Colons | Dashes | Semicolons | Words per sentence | Hedge markers | `compare` |
|---|---|---|---|---|---|---|---|---|
| `melhorar-lcp-nextjs` | 72 | 67 | 28.4 → 15.8 | 43.2 → 3.2 | 9.5 → 2.1 | 21.5 → 16 | 62 → 62 | nothing missing |
| `lcp-alto-next-js` | 56 | 56 | 26.0 → 12.5 | 26.0 → 0 | 6.7 → 0 | 23 → 17 | 43 → 43 | one inline code, explained below |
| `json-ld-nextjs` | 77 | 70 | 31.2 → 18.3 | 21.4 → 0 | 7.8 → 1.1 | 20 → 18 | 65 → 65 | nothing missing |

- Hedge lists: 58, 38 and 59 entries. Each entry was still in its page,
  at the same strength, after the edits.
- `compare` on `lcp-alto-next-js` lists `@import` once: row 17 cut a label
  sentence ("O mecanismo é como o `@import` funciona."), and the next
  sentence still names `@import`.
- `check-draft.mjs`: 0 errors on the three edited copies.
- Colons stay above the native p90 (16.7) on `json-ld-nextjs`. What is left
  are colons before a list, a question or one explanation, the use "What
  not to fix" keeps. `voz.md` allows a page past the band when the rest is
  the owner's voice; one more pass would be cutting for the number.
- `title`, `description`, `dateModified`, headings, code, figures, tables
  and link targets were untouched in all three copies.

**[observation]** Proposals by pattern. A proposal can carry two patterns
(a dash and a colon in the same span), so a column sums past its total.

| Pattern | `melhorar` | `lcp-alto` | `json-ld` | Found by the script? |
|---|---|---|---|---|
| Dash aside or dash hinge | 44 | 28 | 34 | as a rate (`register-dashes`) |
| Colon joining two claims | 16 | 18 | 25 | as a rate, and `colon-chain` |
| Semicolon | 11 | 9 | 11 | as a rate |
| Setup phrase before the claim | 7 | 10 | 19 | no |
| Unit without a space ("2,5s") | 7 | 6 | 0 | yes (`unit-space`), one missed inside quotes |
| Calque | 6 | 4 | 2 | no |
| Generalization | 5 | 0 | 7 | 1 of 12 (verb list) |
| Empty contrast | 2 | 1 | 2 | 1 of 5 |
| Filler, inflated word, hedge filler | 1 | 2 | 3 | yes |
| Closing that repeats the opening | 0 | 0 | 2 | no |
| Other (bold labels, "vs." in prose, one word per concept, "nós") | 8 | 0 | 1 | partly |
| **Total proposals** | **72** | **56** | **77** | |

**[inference]** The script and the reader do different jobs. The script
measures the rate of three marks and finds a few fixed phrases. The reader
finds the setup phrase ("O mecanismo é o seguinte.", "A regra prática:",
"A pergunta que dimensiona o risco é:"), the calque ("por design",
"inflige em si mesmo") and the closing that repeats the opening. None of
those has a fixed form a regex could catch. Without the reader, the pass
would fix punctuation and leave the frames that make a page read as
generated.

## 3. What I held back, and why

**[observation]** 12 proposals were rejected, all of the same kind: 5 on
`melhorar-lcp-nextjs` (lines 105, 117, 200, 365, 489) and 7 on
`json-ld-nextjs`. Each cut an unmeasured generalization: "que quase
ninguém explicita", "quase todo conteúdo sobre LCP assume imagem", "a única
coisa que a maioria dos guias otimiza", "a subparte menos compreendida",
"metade do conteúdo em português erra nisso", "a maior parte do conteúdo em
português está desatualizada".

The readers were right that none of these has evidence on the page. But
cutting a claim changes what the page says, and rule 1 of the skill
forbids a style pass to change a claim level. The catalog said otherwise:
`marcas-ptbr.md` told the reviewer to "cut it" for a generalization the
verb list misses. Two parts of the skill disagreed, and the readers
followed the catalog.

Fixed in this PR: the catalog row now says to report the cut as
NOTA-REDACAO on a published page, and `SKILL.md` step 3 says that a
proposal cutting or weakening a claim waits for the owner, as does any
factual problem a reader finds. The heading of `json-ld-nextjs` at 277
("o schema que quase todo mundo esquece") stays, as "What not to fix" says
for anchors.

## 4. Content problems the readers found (owner decisions)

None of these was edited. They are content (content-page phase 4), not
style. Two I verified in the repository; the rest are the readers'
reports, to check before any fix.

**`melhorar-lcp-nextjs`**

1. **[observation] AVIF.** "O componente serve AVIF/WebP automaticamente"
   (324–325). In Next.js 16.2.12, `imageConfigDefault.formats` is
   `['image/webp']` (`node_modules/next/dist/shared/lib/image-config.js`).
   AVIF comes only when `images.formats` lists it, as this site's
   `next.config` does (line 31).
2. **[observation] `swap` against this site.** The page recommends
   `display: 'swap'` and says the site loads its font through `next/font`.
   The site loads its three families with `display: 'optional'` and no
   preload (`RootShell.tsx`, `docs/design-system.md` §8).
3. The skeleton mechanism (484–487): LCP is re-marked only by a larger
   later candidate, so a skeleton larger than the content would stay the
   LCP, not be replaced.
4. "Se o seu TTFB é 1,8 s, o LCP nunca será bom" (210): "nunca" is stronger
   than the arithmetic, which leaves 0,7 s.
5. "na maioria dos diagnósticos que eu faço" (199): a frequency with no
   record. The same sentence is in `lcp-alto-next-js` (77). If the
   diagnostics are client work, it also conflicts with `CLAUDE.md` §13.
6. The July promise "atualizo esta seção com a medição" (399–405) is still
   open, and "o site ainda não aparece no CrUX" needs a date.
7. The screenshot's numbers (549–560) have no date or commit, and the home
   was redesigned on 2026-09-21.
8. "em ordem de impacto" (213) and "o caso mais comum… são fontes" (372)
   are rankings with no measurement.
9. The FAQ's claim about the 2026 INP methodology changes (25–27) has no
   source.

**`lcp-alto-next-js`**

1. **[observation]** "Se você marca cinco recursos como urgentes" (351)
   lists four.
2. 1.280 ms (PSI, 292–296) and "cerca de 1,7 s" (Lighthouse, 357–358) come
   from different instruments, without saying so next to them.
3. "boa parte do material que ainda rankeia… ensina `priority`" (162–163)
   has no dated check.
4. The example of a background you need to preload is "uma textura
   decorativa" (164–166), the case where it is usually not the LCP.
5. Present-tense statements from July: RUM "ainda sem uma janela
   estatística", "ainda fora do CrUX" (385–388).
6. "o cluster reúne os validadores" links to `/ferramentas`, the tools
   index (399).

**`json-ld-nextjs`**

1. The six unmeasured frequencies of §3, held back.
2. The opening says JSON-LD is not a "direct" ranking factor (73–74); the
   closing drops "direto" (615).
3. To verify against Google's documentation: breadcrumbs in mobile results
   (281–282), the `SoftwareApplication` rich result without a rating or
   review (521–522), an Article enhancement report in Search Console
   (539–543), author display for `Article` (75–76).
4. "este site é novo… ainda não tenho histórico" (544–546) is stale.
5. "alimentam as respostas de IA de forma indireta" (336–337) and "sinal
   ruim" (445–446) have no source.

**[inference]** The style pass is a second reading by someone who did not
write the page, and that reading finds content problems too. The problems
above survived the July verification. The skill already sends them back to
content-page phase 4, and this run is the first evidence that the path is
needed.

## 5. What the run says about the skill

**Works:**

- **Register.** Dashes went to 0 or near it, semicolons to 0–2, sentences to
  the native median, colons halved. All with every hedge and every number
  in place.
- **Invariants.** The hedge list caught what `compare` cannot see. On
  `json-ld-nextjs`, the reader's own count showed two hedges leaving with
  rejected generalizations; with those rows held back, the count is equal.
- **The fresh reader.** It keeps the owner's traits (first person, short
  landings like "Se tudo é urgente, nada é.", "não porque X, mas porque Y"
  where X is the previous section's cause) and says why in a "Kept on
  purpose" table.

**Did not work, or not yet:**

- **The generalization rule** contradicted rule 1 (§3). Fixed here.
- **"Você".** It barely moved (`melhorar-lcp-nextjs` stays at 0.3, the
  band's p10). The pass changes punctuation and frames, and these pages
  address the reader in the imperative, which the measure does not count.
  "What not to fix" already expects that.
- **One `unit-space` miss** inside quotes ("4,9s vira 0,9s"). A display
  case, not fixed.
- **Cost.** One page takes a reader run of several minutes and a judgment
  pass over 56–77 rows. A batch of 30 pages (step 6) needs the rows grouped
  by pattern for the owner, not one table per page.

**New in the catalog:** the closing that repeats the opening, confirmed on
`json-ld-nextjs` (152, 623). Two patterns of `estilo-ptbr.md` §5.2 are
still without a published instance: the triad by habit and the list whose
steps cause each other.

## 6. Reproducing

From the repository root at `99217a2`:

```bash
node .claude/skills/portuguese-style/scripts/check-portuguese.mjs content/blog/melhorar-lcp-nextjs.mdx
node .claude/skills/portuguese-style/scripts/check-portuguese.mjs --published --summary
```

The period medians group the `--summary` rows by `datePublished` (cuts at
2026-08-01, 2026-09-25 and 2026-10-20) and take the nearest-rank median.
The proposals, the hedge lists and the edited copies were working files in
the session's scratchpad and are not in the repository: the readers' rows
quote whole sentences of the pages, and the edits will be made again on the
pages themselves in step 6, against the pages as they are then.
