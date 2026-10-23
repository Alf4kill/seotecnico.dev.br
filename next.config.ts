import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ── Origens de dev permitidas ──────────────────────────────────────────────
  // Sem isto, o Next bloqueia os assets de dev (_next/*) quando a página é
  // acessada por 127.0.0.1, impedindo a hidratação no preview.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],

  // ── CSS inline (LCP) ───────────────────────────────────────────────────────
  // O CSS do site é pequeno (~22KB brutos / ~5KB comprimidos); inlinado no
  // <head> elimina o único request render-blocking apontado pelo PSI, ao custo
  // de perder o cache do .css entre páginas — troca favorável neste tamanho.
  experimental: {
    inlineCss: true,

    // ── 404 global (app/global-not-found.tsx) ──────────────────────────────
    // O site tem um root layout por idioma, (pt) e (en), para que o <html lang>
    // de cada página seja o do idioma dela. Sem um app/layout.tsx único, o
    // Next.js não tem onde compor o 404 de URLs sem rota — este é o mecanismo
    // documentado para esse caso. Experimental no Next 16.2: se regredir, o
    // sintoma é um 404 sem estilo (status continua 404), coberto pelo teste
    // de 404 da suíte Playwright.
    globalNotFound: true,
  },

  // ── Otimização de imagens ──────────────────────────────────────────────────
  images: {
    // Formatos modernos em ordem de preferência (avif < webp < original)
    formats: ['image/avif', 'image/webp'],

    // Breakpoints para srcset responsivo
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes:  [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ── Headers de segurança ───────────────────────────────────────────────────
  // Achado da auditoria de crawl de 2026-10-23 (docs/crawl-audit-2026-10.md):
  // nenhum header de segurança era enviado. Estes três não mudam nada no que o
  // Googlebot lê, e o site não se embute em iframe em lugar nenhum.
  // Content-Security-Policy fica de fora de propósito: uma CSP que valha alguma
  // coisa precisa de nonce ou hash para o GTM, o ThemeScript inline e o JSON-LD
  // — decisão separada, registrada no mesmo documento.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },

  // ── Redirects permanentes (301) ───────────────────────────────────────────
  async redirects() {
    return [
      // /en/guide é só um segmento de caminho, sem página: quem encurta a URL
      // do guia inglês caía num 404. Com /en virando home, este era o último
      // beco sem saída da camada inglesa. `permanent` ⇒ 308.
      { source: '/en/guide', destination: '/en/guide/technical-seo-nextjs', permanent: true },
    ]
  },
}

export default nextConfig
