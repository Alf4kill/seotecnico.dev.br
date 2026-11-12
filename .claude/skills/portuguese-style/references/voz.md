# The owner's voice

What a style pass must not remove. Read from the two pages the owner
drafted himself (content-page route B): `pre-registro-seo` and
`sec-fetch-mode`, as published, which means after content-page's
verification pass, so some of it may be the pass's and not his. It
describes, it does not prescribe. It sets **no threshold**: the band in
`register-thresholds-pt.json` comes from native writers, and the owner's
pages are measured against it like any other page.

## What his pages measure

`check-portuguese.mjs --summary`, content at `631e4a3`, scripts as of proposal step 4:

| Feature | `pre-registro-seo` | `sec-fetch-mode` | native p50 / p90 |
|---|---|---|---|
| colons per 100 sentences | 18.4 | 26.8 | 4.5 / 16.7 |
| semicolons per 100 sentences | 1.0 | 0.9 | 0 / 1.9 |
| dash asides per 100 sentences | 0 | 0 | 0 / 4.8 |
| median words per sentence | 17 | 17 | 17 (p10 13, p90 26) |
| "você" per 100 words | 0.1 | 0.1 | 0.8 (p10 0.3) |
| bold-label paragraphs per 100 paragraphs | 0 | 24.4 | 0 / 22.2 |

So his colons are above the band too, but by less than the July pages
(24 to 52). Sentence length, semicolons and dashes are native. A review of
one of his pages starts from the colons and "você" (and, in `sec-fetch-mode`,
the bold labels), and leaves the rest.

## Traits to keep

Each with a line from his pages. A rewrite that loses the trait is wrong
even when the script stops warning.

| Trait | Line | Why it stays |
|---|---|---|
| A short sentence that lands the point after a long one | "Isso é pré-registrar." · "Este site não bloqueia nada com eles. Só registra." · "O raciocínio é curto." | it is how he paces an argument; merging it into the sentence before flattens it |
| A definition by counterexample, with the reason | "\"Melhorar o LCP\" não é hipótese, porque nenhum resultado a contradiz. \"O render delay cai para 1,0 s ou menos\" é, porque 1,1 s a falsifica." | a contrast with evidence, not the empty "não é X, é Y" (`marcas-ptbr.md`, "What not to fix") |
| A contrast against what the reader likely believes | "Não é o limiar de \"bom\" do Google, que é 2,5 s no dado de campo; é uma régua de laboratório mais apertada que o site escolheu." | X is a real belief and the page states the fact against it |
| Dry irony at a bad method | "o tráfego que subiu prova que a mudança funcionou, e o que caiu foi sazonalidade" | the one place the pages allow a joke: at a method, never at people |
| "Ninguém" as a consequence of method | "Sem o registro, daqui a três meses ninguém lembra o que mudou em qual semana." | a counterfactual about the record, not a judgment of people |
| The page states its own defects | "## O defeito que este artigo achou" · "o defeito que a revisão deste artigo achou no próprio instrumento" | the lab's method in one sentence; never soften it into "uma limitação" |
| First person for his own acts, the site as the scope | "como o usei como instrumento de medição", "como descrevo no relato do instrumento", "Neste site, cada mudança deliberada ganha uma entrada" | one author, `estilo-ptbr.md` §1; "neste site" is a hedge (§6) |
| Ordinals in prose for two or three points | "Primeiro, os cabeçalhos só são enviados para URLs potencialmente confiáveis… Segundo, são cabeçalhos proibidos…" | a paragraph that keeps the reasoning, instead of a bullet list |
| Numbers with what they can and cannot show | "Esses números são de laboratório. O dado de campo, que é o que o Google usa, vem do CrUX" | the claims policy in his own words |
| A colon before one explanation | "qualquer resultado vira confirmação: o tráfego que subiu prova…" | a correct colon. The band's p90 allows about one in six sentences, so most of his colons are this kind; cut the ones that join two claims |

## What a pass may still change in his pages

- A colon that joins two claims, when the paragraph has more than one: two
  sentences, or "porque" / "por isso".
- An impersonal frame where the reader acts: "você". His pages have one
  model: "Para saber se o seu já tem, o checador de Core Web Vitals consulta
  o CrUX pela origem."
- Any pattern of `estilo-ptbr.md` §5 the script or the reader finds. The
  traits above are not a licence for filler.

"Nothing to change" is an acceptable result for a page of his that is
inside the band on everything but one feature, when the hits are the traits
above.
