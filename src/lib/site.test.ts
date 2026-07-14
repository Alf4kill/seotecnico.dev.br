import { describe, expect, it } from 'vitest'
import { parseGtmId } from './site'

describe('parseGtmId', () => {
  it('returns a bare container id unchanged', () => {
    expect(parseGtmId('GTM-N5RB56R9')).toBe('GTM-N5RB56R9')
  })

  it('extracts the id from a full pasted GTM snippet (the prod bug)', () => {
    const snippet = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N5RB56R9');</script>
<!-- End Google Tag Manager -->`
    expect(parseGtmId(snippet)).toBe('GTM-N5RB56R9')
  })

  it('trims surrounding whitespace and newlines', () => {
    expect(parseGtmId('  GTM-N5RB56R9\n')).toBe('GTM-N5RB56R9')
  })

  it('returns an empty string when unset', () => {
    expect(parseGtmId(undefined)).toBe('')
    expect(parseGtmId('')).toBe('')
  })

  it('returns an empty string when no GTM id is present (e.g. a GA4 id)', () => {
    expect(parseGtmId('G-59LQZ6LR72')).toBe('')
  })
})
