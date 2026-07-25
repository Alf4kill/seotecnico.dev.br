// ─────────────────────────────────────────────────────────────────────────────
// AI crawler registry — single source of truth for BOTH the declared policy
// (app/robots.ts) and the telemetry (proxy.ts). Keeping one list is the whole
// point: a policy that says one thing while the measurement counts another is
// worse than no measurement at all.
//
// Rationale for the buckets, and the nuances below, in docs/ai-crawler-policy.md.
// ─────────────────────────────────────────────────────────────────────────────

export type BotPurpose = 'training' | 'retrieval' | 'user-triggered'

export interface AiCrawler {
  /** Exact `User-agent` token, as published by the vendor and used in robots.txt. */
  token: string
  vendor: string
  purpose: BotPurpose
}

/**
 * Training crawlers are disallowed; retrieval and user-triggered crawlers are
 * allowed. Content here is all-rights-reserved (content/LICENSE.md), and being
 * cited is objective O7 — so the split is "fetches to answer" vs "fetches to
 * train", not vendor by vendor.
 *
 * Three pairs in this list differ only by suffix, and getting them backwards
 * inverts the policy silently:
 *   - `Applebot-Extended` (training) vs `Applebot` (Siri/Spotlight retrieval)
 *   - `ClaudeBot` (training) vs `Claude-SearchBot` / `Claude-User` (retrieval)
 *   - `GPTBot` (training) vs `OAI-SearchBot` / `ChatGPT-User` (retrieval)
 * `classifyAiCrawler` matches longest-token-first for exactly this reason.
 *
 * `Google-Extended` sits in the training bucket at zero citation cost: it
 * governs whether content improves Gemini Apps and Vertex AI generative APIs.
 * AI Overviews and AI Mode are served from the Search index built by Googlebot,
 * so disallowing it does not affect crawling, indexing or ranking in Google
 * Search — the one training opt-out with no downside.
 */
export const AI_CRAWLERS: readonly AiCrawler[] = [
  // ── Retrieval: builds an index used to answer and cite ────────────────────
  { token: 'OAI-SearchBot', vendor: 'OpenAI', purpose: 'retrieval' },
  { token: 'Claude-SearchBot', vendor: 'Anthropic', purpose: 'retrieval' },
  { token: 'PerplexityBot', vendor: 'Perplexity', purpose: 'retrieval' },
  { token: 'Applebot', vendor: 'Apple', purpose: 'retrieval' },
  // Bing's index feeds Copilot and part of ChatGPT's answers, so it is
  // load-bearing for O7 and named explicitly rather than left to the `*` group.
  { token: 'Bingbot', vendor: 'Microsoft', purpose: 'retrieval' },

  // ── User-triggered: a person asked the assistant to open this URL ─────────
  { token: 'ChatGPT-User', vendor: 'OpenAI', purpose: 'user-triggered' },
  { token: 'Claude-User', vendor: 'Anthropic', purpose: 'user-triggered' },
  { token: 'Perplexity-User', vendor: 'Perplexity', purpose: 'user-triggered' },

  // ── Training: disallowed ──────────────────────────────────────────────────
  { token: 'GPTBot', vendor: 'OpenAI', purpose: 'training' },
  { token: 'ClaudeBot', vendor: 'Anthropic', purpose: 'training' },
  { token: 'Google-Extended', vendor: 'Google', purpose: 'training' },
  { token: 'Applebot-Extended', vendor: 'Apple', purpose: 'training' },
  { token: 'CCBot', vendor: 'Common Crawl', purpose: 'training' },
  { token: 'meta-externalagent', vendor: 'Meta', purpose: 'training' },
  { token: 'Bytespider', vendor: 'ByteDance', purpose: 'training' },
]

/** Training crawlers get `Disallow: /`; everything else keeps site access. */
export function isAllowed(crawler: AiCrawler): boolean {
  return crawler.purpose !== 'training'
}

export const ALLOWED_AI_CRAWLERS = AI_CRAWLERS.filter(isAllowed)
export const DISALLOWED_AI_CRAWLERS = AI_CRAWLERS.filter((c) => !isAllowed(c))

// Longest token first so `Applebot-Extended` can never be matched as
// `Applebot` — a plain `.find()` over declaration order would classify Apple's
// training crawler as retrieval and hand it the content this policy withholds.
const BY_SPECIFICITY = [...AI_CRAWLERS].sort((a, b) => b.token.length - a.token.length)

/**
 * Identify a known AI crawler from a `User-Agent` header.
 *
 * Substring match, case-insensitive: agents append versions and URLs
 * (`Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)`), so an
 * equality check would never fire.
 *
 * A User-Agent is a claim, not proof — anything can send any string. The
 * result is treated as "UA-claimed" until an IP-range check is added.
 */
export function classifyAiCrawler(userAgent: string | null | undefined): AiCrawler | undefined {
  if (!userAgent) return undefined
  const ua = userAgent.toLowerCase()
  return BY_SPECIFICITY.find((crawler) => ua.includes(crawler.token.toLowerCase()))
}
