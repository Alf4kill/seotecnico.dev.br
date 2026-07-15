import { getAllPosts } from '@/lib/content'
import { buildFeedXml } from '@/lib/feed'

// Rota estática: o feed é gerado no build (novos posts chegam via commit,
// que dispara novo deploy). Sem custo em runtime.
export const dynamic = 'force-static'

export function GET() {
  return new Response(buildFeedXml(getAllPosts()), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
