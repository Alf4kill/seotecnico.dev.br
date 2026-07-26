import { getAllPosts, getGuide } from '@/lib/content'
import { buildLlmsTxt } from '@/lib/llms-txt'

// Rota estática, mesma decisão do feed.xml: o índice é gerado no build, e novo
// conteúdo chega por commit — que já dispara deploy. Zero custo em runtime.
export const dynamic = 'force-static'

export function GET() {
  return new Response(buildLlmsTxt(getGuide(), getAllPosts(), getGuide('en')), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
