import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ConsentBanner } from '@/components/layout/ConsentBanner'
import { SearchProvider } from '@/components/search/SearchContext'
import { SearchModal } from '@/components/search/SearchModal'
import { site, indexable } from '@/lib/site'
import './globals.css'

// Consent Mode v2 — default "denied" ANTES de qualquer tag do Google carregar.
// O banner (ConsentBanner) atualiza analytics_storage após a escolha do
// usuário; ad_* permanecem negados (o site não veicula anúncios).
const consentDefaultScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});
`

// display 'optional' + sem preload: o LCP da home é TEXTO (parágrafo do hero);
// com preload, o woff2 de ~48KB entra no caminho crítico do LCP simulado
// (PSI/Lighthouse) e adiciona ~1.7s de render delay no slow-4G. Com 'optional'
// o fallback ajustado (adjustFontFallback) pinta imediatamente e fica
// definitivo se a fonte perder a janela de bloqueio — sem repaint, sem CLS;
// a Inter entra do cache nas navegações seguintes.
const inter = Inter({
  subsets: ['latin'],
  display: 'optional',
  preload: false,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    template: `%s | ${site.name}`,
    default: site.name,
  },
  description: site.description,
  robots: {
    index: indexable,
    follow: indexable,
  },
  // Sem `url` aqui: og:url é sempre definido por página via buildMetadata
  // (um url estático no root era herdado e apontava toda subpágina à home).
  openGraph: {
    type: 'website',
    locale: site.locale,
    siteName: site.name,
  },
  twitter: {
    card: 'summary_large_image',
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Script
          id="consent-default"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: consentDefaultScript }}
        />
        <SearchProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <SearchModal />
        </SearchProvider>
        <ConsentBanner />
        {site.gtmId && <GoogleTagManager gtmId={site.gtmId} />}
      </body>
    </html>
  )
}
