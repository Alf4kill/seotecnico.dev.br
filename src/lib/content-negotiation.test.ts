import { describe, it, expect } from 'vitest'
import { acceptsMarkdown } from './content-negotiation'

describe('acceptsMarkdown', () => {
  it('counts an explicit Markdown request', () => {
    expect(acceptsMarkdown('text/markdown')).toBe(true)
    expect(acceptsMarkdown('text/markdown, text/html;q=0.9, */*;q=0.8')).toBe(true)
    expect(acceptsMarkdown('text/html, text/markdown;q=0.5')).toBe(true)
  })

  it('counts the pre-RFC 7763 name', () => {
    expect(acceptsMarkdown('text/x-markdown')).toBe(true)
  })

  it('is case- and whitespace-insensitive', () => {
    expect(acceptsMarkdown('  Text/Markdown ; Q=1 ')).toBe(true)
  })

  it('treats q=0 as a refusal, not a request', () => {
    expect(acceptsMarkdown('text/html, text/markdown;q=0')).toBe(false)
    expect(acceptsMarkdown('text/markdown;q=0.0')).toBe(false)
  })

  it('does not count wildcards: they accept Markdown without asking for it', () => {
    expect(acceptsMarkdown('*/*')).toBe(false)
    expect(acceptsMarkdown('text/*')).toBe(false)
    expect(
      acceptsMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
    ).toBe(false)
  })

  it('handles a missing header', () => {
    expect(acceptsMarkdown(null)).toBe(false)
    expect(acceptsMarkdown(undefined)).toBe(false)
    expect(acceptsMarkdown('')).toBe(false)
  })

  it('ignores a malformed quality value instead of counting it', () => {
    expect(acceptsMarkdown('text/markdown;q=abc')).toBe(false)
  })
})
