// ─────────────────────────────────────────────────────────────────────────────
// register-pt.mjs — the Portuguese register profile shared by
// calibrate-register-pt.mjs (step 2 of docs/proposals/portuguese-style.md) and
// the future check-portuguese.mjs (step 3).
//
// It measures structural habits of running prose that a lexical rule cannot
// see: colons used as hinges between clauses, dashes used for asides,
// semicolons joining sentences, sentence length, how the text addresses the
// reader, lists and bold labels. The native band per feature comes from a
// corpus of technical Portuguese written by Brazilian authors before
// 2022-11-30 (native-corpus-pt.json); this site's pages are compared with it.
//
// Same approach as english-version/scripts/register.mjs: prose is kept only
// when it reads as sentences, inline code becomes a token, and no text from
// third-party pages is ever stored, only counts. The numbers are signals, not
// grades: a page can sit outside the band for a good reason.
// ─────────────────────────────────────────────────────────────────────────────

/** Paragraphs shorter than this are left out of the page profile. */
export const PROFILE_MIN_WORDS = 25

const WORD = /\p{L}[\p{L}'’-]*/gu

export const wordsOf = (text) => text.match(WORD) || []

export const sentencesOf = (text) =>
  text.split(/(?<=[.!?…]["')»”]?)\s+(?=["(«“]?[\p{Lu}0-9])/u).map((s) => s.trim()).filter((s) => wordsOf(s).length >= 3)

/**
 * Running prose: ends like a sentence and has a sentence break at least every
 * 60 words. Drops navigation wrapped in <p>, captions, labels and fragments.
 */
export function isProse(paragraph, minWords = PROFILE_MIN_WORDS) {
  const n = wordsOf(paragraph).length
  const stops = (paragraph.match(/[.!?…](\s|$)/g) || []).length
  return n >= minWords && /[.!?…]["')»”]?\s*$/.test(paragraph.trim()) && n / Math.max(stops, 1) <= 60
}

/**
 * Dash asides in one sentence: an em dash, or an en dash or hyphen with a
 * space on both sides (Brazilian sites use all three as "travessão"). A pair
 * around an aside counts once.
 */
const dashAsides = (sentence) => Math.ceil((sentence.match(/—|\s[–-]\s/g) || []).length / 2)

// ── the imperative ──────────────────────────────────────────────────────────
// Brazilian technical prose addresses the reader in two ways: "você" and the
// imperative ("rode", "confira", "abra o DevTools"). Until 2026-11-14 only
// "você" was counted, so a page written in the imperative sat below the band
// (25 of 31 pages at bda4f98). The owner chose to count both and measure the
// native band again (docs/proposals/portuguese-style.md, decision 6).
//
// Portuguese has no imperative form of its own for "você": it is the present
// subjunctive, which also follows "que". So the count is a lexicon of verbs
// that technical prose uses to give instructions, taken only where an
// instruction starts: the start of a sentence or clause (after , ; :), after
// "e"/"ou", or after a clause-initial adverb ("Não use", "Depois abra").

const IMPERATIVES = `abra acesse acompanhe adicione aguarde ajuste altere analise anime anote
  aplique aponte aproveite assine atualize avalie baixe busque calcule carregue chame
  clique cole coloque comece compare compile configure confira confirme conecte conte
  considere consulte continue copie corrija crie defina deixe descubra desative
  desligue digite diga edite elimine entenda envie escolha escreva espere evite
  examine execute experimente explore faça feche filtre fique garanta gere grave
  guarde habilite identifique ignore imagine implemente importe inclua informe insira
  inspecione instale interaja leia lembre limpe liste mantenha marque meça mova mude
  navegue note observe olhe otimize pare peça pegue pense perceba pergunte pesquise
  ponha preencha prefira prepare priorize procure publique pule recarregue reduza
  registre reinicie remova renderize repare repita responda revise rode salve saiba
  selecione siga solicite substitua suba tente teste tire trate troque use utilize
  valide verifique veja volte`.split(/\s+/)
const IMPERATIVE_FORMS = new Set([...IMPERATIVES, ...IMPERATIVES.map((f) => `${f}m`)]) // "vejam", "usem"
const IMPERATIVE_SE = new Set(['lembre-se', 'certifique-se', 'inscreva-se', 'atente-se', 'prepare-se', 'cadastre-se', 'preocupe-se', 'informe-se', 'acostume-se'])
/** Forms that are also nouns or adjectives ("o teste", "peça por peça", "um erro grave"): counted only before a determiner. */
const AMBIGUOUS = new Set(['teste', 'note', 'peça', 'grave', 'continue', 'gere', 'pare', 'marque', 'salve', 'registre', 'conte', 'diga'])
const DETERMINER = /^(o|a|os|as|um|uma|se|que|seu|sua|seus|suas|esse|essa|esses|essas|este|esta|isso|isto|aquilo|como|no|na|nos|nas|X|cada|todo|toda|todos|todas|com|primeiro|antes|depois|sempre|também|agora)$/i
const JOINERS = new Set(['e', 'ou'])
const ADVERBS = new Set(['não', 'nunca', 'então', 'depois', 'agora', 'aí', 'só', 'primeiro', 'apenas', 'sempre', 'também'])
const SUBJECTS = new Set(['que', 'se', 'você', 'vocês', 'eu', 'ele', 'ela', 'eles', 'elas', 'nós', 'o', 'a', 'os', 'as'])

const bare = (w = '') => w.toLowerCase().replace(/^[(«“"'‘]+|[)»”"'’.,;:!?…]+$/g, '')
const opensClause = (words, i) => i === 0 || /[,;:]$/.test(words[i - 1])

/** Imperatives addressed to the reader in one sentence (a quoted prompt or phrase is not one). */
export function imperativesOf(sentence) {
  const w = sentence.split(/\s+/).filter(Boolean)
  let n = 0
  let quoted = false // inside "…", “…” or «…»: a quoted prompt or phrase
  for (let i = 0; i < w.length; i++) {
    const inQuote = quoted || /^[«“"]/.test(w[i])
    for (const ch of w[i]) {
      if (ch === '"') quoted = !quoted
      else if (ch === '“' || ch === '«') quoted = true
      else if (ch === '”' || ch === '»') quoted = false
    }
    const tok = bare(w[i])
    if (!IMPERATIVE_FORMS.has(tok) && !IMPERATIVE_SE.has(tok)) continue
    if (inQuote) continue
    const prev = bare(w[i - 1])
    const starts = opensClause(w, i)
      || JOINERS.has(prev)
      || (ADVERBS.has(prev) && (opensClause(w, i - 1) || JOINERS.has(bare(w[i - 2]))))
    if (!starts || SUBJECTS.has(prev)) continue
    if (AMBIGUOUS.has(tok.replace(/m$/, '')) && !DETERMINER.test(bare(w[i + 1]))) continue
    n++
  }
  return n
}

const median = (v) => {
  const s = [...v].sort((a, b) => a - b)
  if (!s.length) return NaN
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Page-level features. `dir` says which side of the band warns: 'high' above
 * the native p90, 'low' below the native p10, 'both' outside p10–p90, 'info'
 * never (reported, not judged).
 */
export const FEATURES = [
  {
    id: 'colons', label: 'colons per 100 sentences', dir: 'high',
    hint: 'a colon joining two clauses: write two sentences, or "por isso", "porque"',
    compute: (s) => (100 * s.colons) / s.sentences,
  },
  {
    id: 'dashes', label: 'dash asides per 100 sentences', dir: 'high',
    hint: 'an aside between dashes: commas, parentheses or a new sentence',
    compute: (s) => (100 * s.dashes) / s.sentences,
  },
  {
    id: 'semicolons', label: 'semicolons per 100 sentences', dir: 'high',
    hint: 'two sentences joined by ";": write two sentences',
    compute: (s) => (100 * s.semicolons) / s.sentences,
  },
  {
    id: 'sentence-median', label: 'median words per sentence', dir: 'both',
    hint: 'sentence length far from native technical prose: split, or join where the idea is one',
    compute: (s) => s.sentenceMedian,
  },
  {
    id: 'voce', label: '"você" and imperatives per 100 words', dir: 'low',
    hint: 'impersonal frames ("é possível", "deve-se") where the reader acts: "você" or the imperative',
    compute: (s) => (100 * (s.voce + s.imperatives)) / s.words,
  },
  {
    id: 'first-person', label: 'first person singular per 100 words', dir: 'info',
    hint: '',
    compute: (s) => (100 * s.firstPerson) / s.words,
  },
  {
    id: 'list-items', label: 'list items per 1,000 words of prose', dir: 'high',
    hint: 'a list where the steps cause each other: a paragraph carries the causal words',
    compute: (s) => (s.listItems == null ? NaN : (1000 * s.listItems) / s.words),
  },
  {
    id: 'bold-labels', label: 'bold-label paragraphs per 100 paragraphs', dir: 'high',
    hint: 'a bold label opening paragraph after paragraph: sentences that say it',
    compute: (s) => (s.boldLabels == null ? NaN : (100 * s.boldLabels) / Math.max(s.allParagraphs, 1)),
  },
]

/**
 * Raw counts. `paragraphs` are plain-text prose paragraphs (already filtered);
 * `structure` carries what only the source format can tell: list items, all
 * paragraphs and bold-label paragraphs (null when unknown).
 */
export function counts(paragraphs, structure = {}) {
  const text = paragraphs.join('\n')
  const sentences = paragraphs.flatMap(sentencesOf)
  const c = (re) => (text.match(re) || []).length
  return {
    paragraphs: paragraphs.length,
    words: wordsOf(text).length,
    sentences: sentences.length,
    sentenceMedian: median(sentences.map((s) => wordsOf(s).length)),
    colons: c(/:\s/g),
    dashes: sentences.reduce((n, s) => n + dashAsides(s), 0),
    semicolons: c(/;\s/g),
    voce: c(/(?<![\p{L}])(você|vocês)(?![\p{L}])/giu),
    imperatives: sentences.reduce((n, s) => n + imperativesOf(s), 0),
    firstPerson: c(/(?<![\p{L}])(eu|meu|minha|meus|minhas|mim|comigo)(?![\p{L}])/giu),
    listItems: structure.listItems ?? null,
    allParagraphs: structure.allParagraphs ?? paragraphs.length,
    boldLabels: structure.boldLabels ?? null,
  }
}

/** Feature values; null when there is too little prose to measure. */
export function profile(paragraphs, structure) {
  const s = counts(paragraphs, structure)
  if (s.words < 300 || s.sentences < 15) return null
  return Object.fromEntries(FEATURES.map((f) => [f.id, f.compute(s)]))
}

/** Nearest-rank percentile of a sorted copy, ignoring NaN. */
export function percentile(values, p) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b)
  return v.length ? v[Math.min(v.length - 1, Math.max(0, Math.ceil((p / 100) * v.length) - 1))] : NaN
}

// ── Portuguese check ────────────────────────────────────────────────────────

const PT = new Set(['de', 'que', 'não', 'uma', 'para', 'com', 'os', 'as', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'é', 'um', 'se', 'por', 'mais', 'como', 'mas', 'ao', 'ou', 'quando', 'também', 'isso', 'esse', 'essa', 'ele', 'ela'])
const EN = new Set(['the', 'and', 'of', 'to', 'is', 'that', 'it', 'for', 'with', 'this', 'are', 'you', 'on', 'be', 'not'])

/** Share of Portuguese and English function words, to reject pages in English. */
export function languageShares(paragraphs) {
  const w = wordsOf(paragraphs.join(' ').toLowerCase())
  const n = Math.max(w.length, 1)
  return { pt: w.filter((x) => PT.has(x)).length / n, en: w.filter((x) => EN.has(x)).length / n }
}

// ── text extraction ─────────────────────────────────────────────────────────

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', laquo: '«', raquo: '»', mdash: '—', ndash: '–', hellip: '…' }

export const decode = (s) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? (/^[a-z]+$/i.test(n) && n.length > 1 ? decodeNamed(n) : ' '))

// Accented letters as named entities (&atilde; &ccedil; …), common in older pages.
const ACCENTS = { acute: '́', grave: '̀', circ: '̂', tilde: '̃', uml: '̈', cedil: '̧' }
function decodeNamed(n) {
  const m = n.match(/^([a-zA-Z])(acute|grave|circ|tilde|uml|cedil)$/)
  return m ? (m[1] + ACCENTS[m[2]]).normalize('NFC') : ' '
}

/** An HTML area without scripts, code, navigation, figures, forms and comment sections. */
function cleanArea(area) {
  return area
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|pre|nav|header|footer|aside|svg|figure|form|noscript|button)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(div|section|ol)\b[^>]*(id|class)="[^"]*\b(comments?|respond|related|share|sharing|newsletter)\b[^"]*"[\s\S]*$/i, ' ')
}

const pText = (inner) =>
  decode(inner.replace(/<code\b[\s\S]*?<\/code>/gi, ' X ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

/**
 * The article of an HTML page: of every <article>, <main> and the <body>, the
 * area with the most words of prose (a first <article> is often a teaser or a
 * header block, and some themes put the post outside any <article>).
 */
export function articleHtml(html) {
  const areas = ['article', 'main', 'body'].flatMap((tag) =>
    [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map((m) => m[1]))
  if (!areas.length) areas.push(html)
  const proseWords = (a) => [...a.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => pText(m[1])).filter((p) => isProse(p)).reduce((n, p) => n + wordsOf(p).length, 0)
  const cleaned = areas.map(cleanArea)
  const best = Math.max(...cleaned.map(proseWords))
  // the smallest area that still holds (almost) all the prose: the post, not the page around it
  return cleaned.filter((a) => proseWords(a) >= 0.9 * best).sort((a, b) => a.length - b.length)[0]
}

/** Prose paragraphs and structure of an HTML page. */
export function fromHtml(html) {
  const area = articleHtml(html)
  const ps = [...area.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1])
  const texts = ps.map(pText).filter(Boolean)
  return {
    paragraphs: texts.filter((p) => isProse(p)),
    structure: {
      listItems: (area.match(/<li\b/gi) || []).length,
      allParagraphs: texts.length,
      boldLabels: ps.filter((p) => /^\s*<(strong|b)\b[^>]*>[^<]{1,60}[:.]\s*<\/\1>/i.test(p) || /^\s*<(strong|b)\b[^>]*>[^<]{1,60}<\/\1>\s*:/i.test(p)).length,
    },
  }
}

/**
 * Prose paragraphs and structure of an MDX body: fenced code, tables, lists,
 * headings, quotes and JSX blocks left out of the prose; inline code as a
 * token, links as their text.
 */
export function fromMdx(body) {
  let inFence = false
  const lines = body.split(/\r?\n/).map((l) => {
    if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; return '' }
    return inFence ? '' : l
  })
  const text = lines.join('\n').replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
  const blocks = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  // A list marker is "-" or "*" followed by a space; a paragraph that opens
  // with **bold** is prose, as a <p><strong> is in fromHtml.
  const paraBlocks = blocks.filter((p) => !/^([|#<>→{]|[-*+]\s|[-*_]{3,}\s*$|\d+\.\s|import |export )/.test(p))
  const clean = (p) => p
    .replace(/`[^`]*`/g, ' X ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/(\*\*|__|\*|_)(?=\S)|(?<=\S)(\*\*|__|\*|_)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return {
    paragraphs: paraBlocks.map(clean).filter((p) => isProse(p)),
    structure: {
      listItems: lines.filter((l) => /^\s*([-*]|\d+\.)\s+\S/.test(l)).length,
      allParagraphs: paraBlocks.length,
      boldLabels: blocks.filter((p) => /^\*\*[^*\n]{1,60}([:.]\*\*|\*\*\s*:)/.test(p)).length,
    },
  }
}
