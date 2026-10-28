// ─────────────────────────────────────────────────────────────────────────────
// register.mjs — the register profile shared by check-english.mjs and
// calibrate-register.mjs.
//
// A page can be free of every known calque and still read as translated:
// Portuguese packs ideas into nouns ("o documento de processo no
// repositório"), chains clauses with colons and semicolons, opens sentences
// with a definite noun phrase and avoids addressing the reader. Each of these
// survives a word-by-word translation in correct English words. This module
// measures them on running prose so a page can be compared with native
// technical English (thresholds in register-thresholds.json, measured by
// calibrate-register.mjs on the corpus in native-corpus.json).
//
// The numbers are signals, not grades: a page can sit past a threshold for a
// good reason (a page about "the" HTML spec), and a page inside every
// threshold can still read as translated.
// ─────────────────────────────────────────────────────────────────────────────

/** Paragraphs shorter than this are too noisy for a per-paragraph density. */
export const PARAGRAPH_MIN_WORDS = 40

/** Paragraphs shorter than this are left out of the page profile. */
export const PROFILE_MIN_WORDS = 25

const WORD = /\b[A-Za-z][A-Za-z'’]*\b/g

export const wordsOf = (text) => text.match(WORD) || []

export const sentencesOf = (text) =>
  text.split(/(?<=[.!?]["')]?)\s+(?=["(]?[A-Z0-9])/).map((s) => s.trim()).filter((s) => wordsOf(s).length >= 3)

/**
 * Running prose: ends like a sentence and has a sentence break at least every
 * 60 words. Drops navigation wrapped in <p>, captions, labels and fragments.
 */
export function isProse(paragraph, minWords = PROFILE_MIN_WORDS) {
  const n = wordsOf(paragraph).length
  const stops = (paragraph.match(/[.!?](\s|$)/g) || []).length
  return n >= minWords && /[.!?]["')]?\s*$/.test(paragraph.trim()) && n / Math.max(stops, 1) <= 60
}

/** "the" per 100 words of one paragraph. */
export const theDensity = (paragraph) => {
  const n = wordsOf(paragraph).length
  return n ? (100 * (paragraph.match(/\bthe\b/gi) || []).length) / n : 0
}

/**
 * Page-level features. `dir` says which side is the Portuguese one: 'high'
 * warns above the native p90, 'low' below the native p10.
 */
export const FEATURES = [
  {
    id: 'the', label: '"the" per 100 words', dir: 'high',
    hint: 'noun chains from Portuguese ("o X do Y"): use possessives, compounds, pronouns, verbs',
    compute: (s) => (100 * s.the) / s.words,
  },
  {
    id: 'the-opener', label: '% sentences opening with "The"', dir: 'high',
    hint: 'definite noun-phrase subjects: start with the actor, a verb, "you" or "this"',
    compute: (s) => (100 * s.theOpeners) / s.sentences,
  },
  {
    id: 'colons', label: 'colons per 100 sentences', dir: 'high',
    hint: 'Portuguese joins clauses with ":"; English uses a period, "so" or a dash',
    compute: (s) => (100 * s.colons) / s.sentences,
  },
  {
    id: 'semicolons', label: 'semicolons per 100 sentences', dir: 'high',
    hint: 'split the clauses into sentences (Google style: avoid semicolons when possible)',
    compute: (s) => (100 * s.semicolons) / s.sentences,
  },
  {
    id: 'you', label: '"you/your" per 100 words', dir: 'low',
    hint: 'impersonal Portuguese ("é possível", "deve-se"): address the reader as "you"',
    compute: (s) => (100 * s.you) / s.words,
  },
]

/** Raw counts over a list of plain-text paragraphs (already prose-filtered). */
export function counts(paragraphs) {
  const text = paragraphs.join('\n')
  const sentences = paragraphs.flatMap(sentencesOf)
  const c = (re) => (text.match(re) || []).length
  return {
    paragraphs: paragraphs.length,
    words: wordsOf(text).length,
    sentences: sentences.length,
    the: c(/\bthe\b/gi),
    theOpeners: sentences.filter((s) => /^["(]?The\b/.test(s)).length,
    colons: c(/:\s/g),
    semicolons: c(/;\s/g),
    you: c(/\b(you|your|yours|yourself)\b/gi),
  }
}

/** Feature values for a list of plain-text paragraphs; null when too little prose. */
export function profile(paragraphs) {
  const s = counts(paragraphs)
  if (s.words < 300 || s.sentences < 15) return null
  return Object.fromEntries(FEATURES.map((f) => [f.id, f.compute(s)]))
}

/** Nearest-rank percentile of a sorted copy. */
export function percentile(values, p) {
  const v = [...values].sort((a, b) => a - b)
  return v.length ? v[Math.min(v.length - 1, Math.max(0, Math.ceil((p / 100) * v.length) - 1))] : NaN
}

// ── text extraction ─────────────────────────────────────────────────────────

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', mdash: '—', ndash: '–', hellip: '…' }

const decode = (s) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? ' ')

/** Prose paragraphs of an HTML page: <p> elements, inline code as a token. */
export function htmlParagraphs(html) {
  const body = html
    .replace(/<(script|style|pre|nav|header|footer|aside|svg)\b[\s\S]*?<\/\1>/gi, ' ')
  return [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => decode(m[1].replace(/<code\b[\s\S]*?<\/code>/gi, ' X ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim())
    .filter((p) => isProse(p))
}

/**
 * Prose paragraphs of an MDX body: fenced code, tables, lists, headings,
 * quotes and JSX blocks left out; inline code as a token, links as their text.
 */
export function mdxParagraphs(body) {
  let inFence = false
  const text = body.split(/\r?\n/).map((l) => {
    if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; return '' }
    return inFence ? '' : l
  }).join('\n')
  return text.split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !/^([|#<>*→{-]|\d+\.\s|import |export )/.test(p))
    .map((p) => p
      .replace(/`[^`]*`/g, ' X ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/(\*\*|__|\*|_)(?=\S)|(?<=\S)(\*\*|__|\*|_)/g, '')
      .replace(/\s+/g, ' ')
      .trim())
    .filter((p) => isProse(p))
}
