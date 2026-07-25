import { describe, it, expect } from 'vitest'
import {
  AI_CRAWLERS,
  ALLOWED_AI_CRAWLERS,
  DISALLOWED_AI_CRAWLERS,
  classifyAiCrawler,
} from './ai-crawlers'

// User-Agent strings as the vendors actually send them (version + docs URL),
// which is why the classifier matches by substring and not by equality.
const REAL_USER_AGENTS: Record<string, string> = {
  GPTBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
  'OAI-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  'ChatGPT-User': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  ClaudeBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ClaudeBot/1.0; +claudebot@anthropic.com',
  'Claude-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; Claude-SearchBot/1.0; +https://www.anthropic.com',
  PerplexityBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot',
  CCBot: 'CCBot/2.0 (https://commoncrawl.org/faq/)',
  Bytespider: 'Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)',
  'meta-externalagent': 'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
}

describe('AI_CRAWLERS registry', () => {
  it('declares every token exactly once', () => {
    const tokens = AI_CRAWLERS.map((c) => c.token)
    expect(new Set(tokens).size).toBe(tokens.length)
  })

  it('splits into allowed (non-training) and disallowed (training)', () => {
    expect(ALLOWED_AI_CRAWLERS.every((c) => c.purpose !== 'training')).toBe(true)
    expect(DISALLOWED_AI_CRAWLERS.every((c) => c.purpose === 'training')).toBe(true)
    expect(ALLOWED_AI_CRAWLERS.length + DISALLOWED_AI_CRAWLERS.length).toBe(AI_CRAWLERS.length)
  })
})

describe('classifyAiCrawler', () => {
  it('returns undefined for a human browser, an empty string and null', () => {
    const chrome =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
    expect(classifyAiCrawler(chrome)).toBeUndefined()
    expect(classifyAiCrawler('')).toBeUndefined()
    expect(classifyAiCrawler(null)).toBeUndefined()
    expect(classifyAiCrawler(undefined)).toBeUndefined()
  })

  it('identifies each agent from its real User-Agent string', () => {
    for (const [token, ua] of Object.entries(REAL_USER_AGENTS)) {
      expect(classifyAiCrawler(ua)?.token, `UA for ${token}`).toBe(token)
    }
  })

  it('matches case-insensitively', () => {
    expect(classifyAiCrawler('compatible; gptbot/1.2')?.token).toBe('GPTBot')
    expect(classifyAiCrawler('COMPATIBLE; PERPLEXITYBOT/1.0')?.token).toBe('PerplexityBot')
  })

  // ── The suffix pairs: the whole reason matching is longest-token-first ─────
  // Declaration order alone would classify these training crawlers as
  // retrieval and serve them the content the policy withholds.
  it('does not mistake Applebot-Extended for Applebot', () => {
    const extended = classifyAiCrawler('Mozilla/5.0 (compatible; Applebot-Extended/1.0)')
    expect(extended?.token).toBe('Applebot-Extended')
    expect(extended?.purpose).toBe('training')

    const plain = classifyAiCrawler('Mozilla/5.0 (compatible; Applebot/0.1; +http://www.apple.com/go/applebot)')
    expect(plain?.token).toBe('Applebot')
    expect(plain?.purpose).toBe('retrieval')
  })

  it('separates Claude-SearchBot and Claude-User from ClaudeBot', () => {
    expect(classifyAiCrawler(REAL_USER_AGENTS.ClaudeBot)?.purpose).toBe('training')
    expect(classifyAiCrawler(REAL_USER_AGENTS['Claude-SearchBot'])?.purpose).toBe('retrieval')
    expect(classifyAiCrawler('compatible; Claude-User/1.0')?.purpose).toBe('user-triggered')
  })

  it('separates OAI-SearchBot and ChatGPT-User from GPTBot', () => {
    expect(classifyAiCrawler(REAL_USER_AGENTS.GPTBot)?.purpose).toBe('training')
    expect(classifyAiCrawler(REAL_USER_AGENTS['OAI-SearchBot'])?.purpose).toBe('retrieval')
    expect(classifyAiCrawler(REAL_USER_AGENTS['ChatGPT-User'])?.purpose).toBe('user-triggered')
  })

  it('separates Perplexity-User from PerplexityBot', () => {
    expect(classifyAiCrawler(REAL_USER_AGENTS.PerplexityBot)?.purpose).toBe('retrieval')
    expect(classifyAiCrawler('Mozilla/5.0 (compatible; Perplexity-User/1.0)')?.purpose).toBe(
      'user-triggered'
    )
  })

  it('classifies Google-Extended as training, not as a search agent', () => {
    // Blocking it does not affect AI Overviews or Search — see
    // docs/ai-crawler-policy.md §2. Googlebot is deliberately NOT in the
    // registry: it is covered by the `*` group.
    expect(classifyAiCrawler('Google-Extended')?.purpose).toBe('training')
    expect(
      classifyAiCrawler('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
    ).toBeUndefined()
  })
})
