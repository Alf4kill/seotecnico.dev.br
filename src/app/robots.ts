import type { MetadataRoute } from 'next'
import { site, indexable } from '@/lib/site'
import { ALLOWED_AI_CRAWLERS, DISALLOWED_AI_CRAWLERS } from '@/lib/ai-crawlers'
import { TRAP_ROBOTS_PATH } from '@/lib/lab-traps'

// O trap de robots (docs/detection-experiment.md §4) existe APENAS nesta
// linha de Disallow: fora do sitemap, fora do llms.txt, sem link de lugar
// nenhum. Quem chega lá parseou este arquivo e escolheu buscar o que ele
// proíbe. O trap de llms.txt (TRAP_LLMS_PATH) fica fora daqui de propósito —
// listá-lo contaminaria a atribuição de canal.
const DISALLOWED_PATHS = ['/api/', TRAP_ROBOTS_PATH]

export default function robots(): MetadataRoute.Robots {
  if (!indexable) {
    // Fail-safe: um grupo `*` sozinho basta aqui. Nenhum grupo nomeado existe,
    // então todo crawler — de IA ou não — cai neste.
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /busca NÃO entra aqui: a página já é noindex, e um Disallow impediria
        // o Googlebot de rastreá-la — logo, de ler o próprio noindex. As duas
        // diretivas se cancelam. Ver /blog/sitemap-dinamico-nextjs.
        disallow: DISALLOWED_PATHS,
      },

      // Política explícita por agente de IA (docs/ai-crawler-policy.md):
      // rastreador que busca para responder e citar é liberado; rastreador que
      // busca para treinar modelo é bloqueado.
      //
      // ATENÇÃO: um grupo nomeado SUBSTITUI o grupo `*`, não o estende — o
      // crawler obedece apenas ao grupo mais específico que cita o nome dele.
      // Por isso cada grupo liberado repete o próprio `Disallow: /api/`: sem a
      // repetição, /api/ ficaria aberto justamente para os agentes que este
      // arquivo acabou de nomear. Coberto por tests/seo/seo.spec.ts.
      ...ALLOWED_AI_CRAWLERS.map((crawler) => ({
        userAgent: crawler.token,
        allow: '/',
        disallow: DISALLOWED_PATHS,
      })),

      ...DISALLOWED_AI_CRAWLERS.map((crawler) => ({
        userAgent: crawler.token,
        disallow: '/',
      })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
  }
}
