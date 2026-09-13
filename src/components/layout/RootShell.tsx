import { Inter } from 'next/font/google'
import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ConsentBanner } from '@/components/layout/ConsentBanner'
import { ThemeScript } from '@/components/layout/ThemeScript'
import { WebVitalsReporter } from '@/components/layout/WebVitalsReporter'
import { SearchProvider } from '@/components/search/SearchContext'
import { SearchModal } from '@/components/search/SearchModal'
import { buildSearchIndex } from '@/lib/search-index'
import type { Lang } from '@/lib/hreflang'
import { site } from '@/lib/site'
import '@/app/globals.css'

// ─────────────────────────────────────────────────────────────────────────────
// O documento HTML inteiro, compartilhado pelos dois root layouts.
//
// O site tem um root layout por idioma — app/(pt)/layout.tsx e
// app/(en)/layout.tsx — porque o `lang` do <html> só pode variar por rota se
// cada idioma tiver o seu próprio <html>. Um root layout único fixava
// `lang="pt-BR"` em páginas que se declaram `en` no próprio hreflang: o Google
// ignora o atributo, mas leitores de tela e auditorias de SEO não. Route groups
// resolvem isso sem tornar nenhuma rota dinâmica — a alternativa (ler a URL no
// servidor) custaria o SSG do site inteiro.
//
// Custo aceito, documentado pelo Next.js: navegar entre rotas de root layouts
// diferentes recarrega a página inteira. Aqui isso só acontece ao trocar de
// idioma, que é uma troca de site, não de página.
//
// Tudo que não depende de idioma mora aqui uma vez só: Consent Mode, GTM, tema,
// RUM. O que depende recebe `lang`.
// ─────────────────────────────────────────────────────────────────────────────

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

export function RootShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  // A busca indexa o conteúdo em português. Oferecê-la nas páginas em inglês
  // devolveria resultados num idioma que o leitor não escolheu — então a moldura
  // inglesa não tem busca, nem o atalho Ctrl+K que abriria um modal inexistente.
  const withSearch = lang === 'pt-BR'

  const chrome = (
    <>
      <Header lang={lang} />
      <main className="flex-1">{children}</main>
      <Footer lang={lang} />
    </>
  )

  return (
    <html lang={lang} className={inter.variable} suppressHydrationWarning>
      {/* As duas regras do @next/next abaixo só reconhecem <head> e
          beforeInteractive dentro de um arquivo `layout`. Este componente É o
          corpo dos dois root layouts (e do global-not-found) — o mesmo lugar,
          movido para não existir em três cópias. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        {/* Antes de qualquer coisa: aplica o tema salvo sem flash. */}
        <ThemeScript />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <Script
          id="consent-default"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: consentDefaultScript }}
        />
        {withSearch ? (
          <SearchProvider>
            {chrome}
            <SearchModal items={buildSearchIndex()} />
          </SearchProvider>
        ) : (
          chrome
        )}
        <ConsentBanner lang={lang} />
        <WebVitalsReporter />
        {site.gtmId && <GoogleTagManager gtmId={site.gtmId} />}
      </body>
    </html>
  )
}
