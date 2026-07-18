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
  },

  // ── Otimização de imagens ──────────────────────────────────────────────────
  images: {
    // Formatos modernos em ordem de preferência (avif < webp < original)
    formats: ['image/avif', 'image/webp'],

    // Breakpoints para srcset responsivo
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes:  [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ── Redirects permanentes (301) ───────────────────────────────────────────
  async redirects() {
    return [
      // Exemplo: { source: '/url-antiga', destination: '/url-nova', permanent: true },
    ]
  },
}

export default nextConfig
