import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from 'next/font/google'
import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ConsentBanner } from '@/components/layout/ConsentBanner'
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
// Tudo que não depende de idioma mora aqui uma vez só: Consent Mode, GTM,
// fontes, RUM. O que depende recebe `lang`.
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

// Três famílias do sistema visual (docs/design-system.md): Space Grotesk nos
// títulos, IBM Plex Sans no corpo, IBM Plex Mono em rótulos e código.
//
// Todas com display 'optional' e SEM preload — a mesma regra que valia para a
// Inter, agora remedida com três fontes (LHCI, throttling devtools, mediana de
// 3, mesma máquina, 2026-09-19; LCP em ms de / · /blog · artigo · guia):
//   Inter, sem preload (antes)           961 ·  981 · 1055 · 1026   48,7KB
//   3 famílias, sem preload  ← escolhido 909 ·  938 · 1061 · 1091   63–74KB
//   idem, Space Grotesk com preload     1051 · 1037 · 1345 · 1242
// O preload põe o woff2 no caminho crítico e empurra o FCP (= LCP de texto)
// em 140–290ms. Sem ele, o fallback ajustado (adjustFontFallback) pinta na
// hora e fica definitivo se a fonte perder a janela de bloqueio — sem repaint,
// sem CLS; as fontes entram do cache nas navegações seguintes.
//
// Custo que sobra, medido com o redesign inteiro (home, mediana de 5): as três
// famílias somam ~190ms de Style & Layout ANTES da primeira pintura (FCP 1160
// contra 976 com as fontes desligadas). Não é o download — o documento termina
// em 760ms nos dois casos — nem a janela de bloqueio: 'swap' mede o mesmo
// (1160) e ainda traz CLS de 0,053 no artigo; desligar o adjustFontFallback
// também (1162). Aceito: LCP de laboratório segue em ~1,2s contra o budget de
// 2,0s, Performance 100. Se o budget apertar, o próximo corte é a Plex Mono.
//
// Pesos mínimos: Plex Sans e Space Grotesk são variáveis (um arquivo cada);
// a Plex Mono é estática, então só 400 (rótulos) e 600 (botões, índices).
const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'optional',
  preload: false,
  variable: '--font-sans',
})
const display = Space_Grotesk({
  subsets: ['latin'],
  display: 'optional',
  preload: false,
  variable: '--font-display',
})
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'optional',
  preload: false,
  variable: '--font-mono',
})

export function RootShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  // A busca indexa o conteúdo em português. Oferecê-la nas páginas em inglês
  // devolveria resultados num idioma que o leitor não escolheu — então a moldura
  // inglesa não tem busca, nem o atalho Ctrl+K que abriria um modal inexistente.
  const withSearch = lang === 'pt-BR'

  const chrome = (
    <>
      <a href="#conteudo" className="skip-link">
        {lang === 'en' ? 'Skip to content' : 'Pular para o conteúdo'}
      </a>
      <Header lang={lang} />
      <main id="conteudo" className="flex-1">{children}</main>
      <Footer lang={lang} />
    </>
  )

  return (
    <html lang={lang} className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      {/* As duas regras do @next/next abaixo só reconhecem <head> e
          beforeInteractive dentro de um arquivo `layout`. Este componente É o
          corpo dos dois root layouts (e do global-not-found) — o mesmo lugar,
          movido para não existir em três cópias.

          O <head> explícito fica mesmo vazio (desde que o script de tema saiu,
          com o tema claro): sem ele o Next não iça o script beforeInteractive
          do consentimento para o head, e o React passa a renderizá-lo como
          <script> inerte no body — o dev overlay acusa na hora. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head />
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
