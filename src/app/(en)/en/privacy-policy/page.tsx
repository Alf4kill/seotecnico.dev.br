import Link from 'next/link'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'
import { PRIVACY_POLICY_UPDATED } from '@/lib/legal'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

// ─────────────────────────────────────────────────────────────────────────────
// Política de privacidade em inglês — par de hreflang de
// /politica-de-privacidade (lib/hreflang.ts). Traduz o MESMO texto: as duas
// páginas descrevem o mesmo tratamento, então mudam juntas, com a mesma data
// (lib/legal.ts). A LGPD continua sendo a lei de referência, também aqui.
// ─────────────────────────────────────────────────────────────────────────────

const PATH = '/en/privacy-policy'

export const metadata = buildMetadata({
  title: 'Privacy policy',
  description:
    'How SEO Técnico handles your data: analytics cookies only with consent, no sign-up, no sale of data. Transparency under Brazil’s LGPD.',
  path: PATH,
  lang: 'en',
})

export default function EnglishPrivacyPolicyPage() {
  return (
    <section className="container-xl py-12 lg:py-16">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: 'Privacy policy', path: PATH },
        ]}
      />

      <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
        <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
        Project · LGPD
      </p>

      <h1 className="font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
        Privacy policy
      </h1>

      <p className="mt-4 text-sm text-muted">
        Updated <time dateTime={PRIVACY_POLICY_UPDATED}>18 October 2026</time>.
      </p>

      <div className="rich-text mt-10 max-w-[68ch]">
        <p>
          {site.name} ({new URL(site.url).hostname}) is a site of articles and
          free tools. This page explains, in plain language, what data is
          processed and why, in compliance with Brazil&rsquo;s General Data
          Protection Law (LGPD, Law No. 13,709/2018).
        </p>

        <h2>What we collect (and what we don&rsquo;t)</h2>
        <ul>
          <li>
            <strong>There is no sign-up, login or form</strong> that stores
            personal data. The tools work without identification and do not
            keep what you type into them.
          </li>
          <li>
            <strong>Traffic and performance measurement (Google Analytics 4,
            via Google Tag Manager):</strong> used only to understand which
            pages and tools are useful and how long pages take to load and
            respond (Core Web Vitals). Analytics cookies are only set{' '}
            <strong>after your consent</strong> in the banner; the default is
            denied (Consent Mode v2). While consent is denied, Google&rsquo;s
            tags still send signals <strong>without cookies</strong> and
            without an identifier stored in your browser (Consent Mode&rsquo;s
            &ldquo;advanced&rdquo; mode). Declining changes nothing about how
            the site works.
          </li>
          <li>
            <strong>We do not sell or share data</strong> with third parties
            for commercial purposes, and we do not run ads.
          </li>
        </ul>

        <h2>Request telemetry and automated crawlers</h2>
        <p>
          The server counts, <strong>anonymously</strong>, the page requests it
          receives, to measure whether and how <strong>automated AI
          crawlers</strong> (such as those from OpenAI, Anthropic, Perplexity
          and Google) read the published content, and to tell automated
          traffic apart from human traffic. From that count, only{' '}
          <strong>the page path, the crawler&rsquo;s name when it identifies
          itself, and derived technical signals</strong> (for example, whether
          the request has the shape of a real browser) are recorded. No IP
          address, no raw header and no personal data is stored, and
          everything goes to an analytics property separate from the one used
          for human visitors.
        </p>
        <p>
          To correlate requests from the same network without identifying
          anyone, a <strong>truncated, hashed network code</strong> is recorded
          (a salted hash of the subnet, not of the full address), whose salt
          changes every month, which keeps the code from building up into a
          lasting identifier. When a request claims to come from a known
          crawler, the IP address is compared <strong>on the spot, in
          memory</strong>, with the network ranges published by the vendor
          itself, only to check the claim; what is recorded is the verdict,
          never the address.
        </p>
        <p>
          <strong>One exception: the lab pages with secret addresses</strong>{' '}
          (under <code>/lab/</code>), which exist to test AI assistants, are
          linked from nowhere and are only sent by the author to the assistant
          under test. On them, the <em>user agent</em>, the{' '}
          <code>Accept</code>, <code>Accept-Language</code>,{' '}
          <code>Sec-Fetch-Mode</code> and <code>Sec-Fetch-Dest</code> headers,
          the country of origin and the name of the public network-range list
          (from a vendor such as Google or OpenAI) that contains the address,
          if any, are also recorded. The IP address is still not recorded.
        </p>
        <p>
          This count is aggregated and anonymous, does not identify you
          individually and does not depend on the consent banner. It is
          described here because a site whose premise is transparent
          measurement should say everything it measures.
        </p>

        <h2>Your choice</h2>
        <p>
          You can accept or decline traffic measurement in the consent banner.
          The choice is stored in your browser (localStorage) and can be
          reversed at any time by clearing the site&rsquo;s data in your
          browser; the banner will show again on your next visit. The browser
          also stores the theme you pick (light or dark), only to keep that
          choice across pages.
        </p>

        <h2>Your rights (LGPD)</h2>
        <p>
          The LGPD gives you rights such as confirmation of processing, access,
          correction and deletion of personal data. Since this site keeps no
          personal database of its own, the only relevant processing is the
          Google Analytics traffic statistics, which are aggregated and do not
          identify you individually.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy can be sent through the public channels
          listed on the <Link href="/en/about" title="About the author">About</Link>{' '}
          page.
        </p>

        <p>
          This is the English version of the{' '}
          <Link
            href="/politica-de-privacidade"
            hrefLang="pt-BR"
            // Outro root layout: sem prefetch (ver LanguageSwitch).
            prefetch={false}
            title="Política de privacidade"
          >
            privacy policy in Portuguese
          </Link>
          ; both describe the same processing.
        </p>
      </div>
    </section>
  )
}
