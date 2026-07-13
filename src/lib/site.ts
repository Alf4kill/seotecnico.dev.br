// ─────────────────────────────────────────────────────────────────────────────
// Fonte única de verdade do site.
// Todos os metadados, schemas JSON-LD, header e footer consomem daqui.
// ─────────────────────────────────────────────────────────────────────────────

export const site = {
  // ── Identidade ──────────────────────────────────────────────────────────────
  name: 'SEO Técnico',
  url: process.env.NEXT_PUBLIC_DOMAIN ?? 'https://seotecnico.dev.br',
  description:
    'Laboratório vivo de SEO técnico para desenvolvedores Next.js: guias práticos, ferramentas gratuitas e experimentos medidos com dados reais.',
  locale: 'pt_BR',

  // ── Analytics / Tracking ────────────────────────────────────────────────────
  gtmId: process.env.NEXT_PUBLIC_GTM_ID ?? '',

  // ── Autor (E-E-A-T) ─────────────────────────────────────────────────────────
  // Preencher URLs públicas quando disponíveis; campos vazios não são
  // renderizados nem incluídos no JSON-LD.
  author: {
    name: 'Henrique Lopes Souza',
    jobTitle: 'Technical SEO Engineer',
    github: 'https://github.com/Alf4kill',
    linkedin: 'https://www.linkedin.com/in/henrique-lopes-souza-028a1215a/',
    email: '',
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Indexação / SEO — fonte única de verdade.
//
// `indexable` só é true quando SITE_INDEXABLE === 'true' (produção real). Em
// qualquer outro caso (dev, homologação na Vercel, variável ausente) o site
// envia noindex/nofollow nos metadados e robots.txt com "disallow: /".
// Fail-safe: o padrão é NÃO indexar. Consumido por app/layout.tsx e app/robots.ts.
// ─────────────────────────────────────────────────────────────────────────────
export const indexable = process.env.SITE_INDEXABLE === 'true'
