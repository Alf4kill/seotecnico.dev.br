import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { controlCode, controlPaths, normalizeRound, resolveProbe } from '@/lib/lab-probes'
import { FetchedCode, RenderedByClientComponent } from '@/components/lab/ControlCodes'

// ─────────────────────────────────────────────────────────────────────────────
// Controle positivo da H15 e da H16 (docs/detection-experiment.md §4.6, §4.7).
//
// Quatro códigos por rodada, um por caminho de renderização:
//   SRV- texto deste Server Component            → está no HTML
//   UC-  renderizado por um componente 'use client' → TAMBÉM está no HTML
//   LD-  só no JSON-LD                            → está no HTML, dentro de <script>
//   JS-  buscado depois da montagem, em useEffect → só existe se o JS rodar
//
// Dinâmica: a rodada (?r=) muda os códigos, e o slug é lido do ambiente em
// tempo de requisição. Cada sonda (o slug da H15, ou uma URL derivada por
// assistente na H16) tem os próprios códigos. Segmento que não é sonda, ou
// slug ausente → 404.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Página de laboratório — controle positivo',
  robots: { index: false, follow: false },
}

export default async function ControlProbePage({
  params,
  searchParams,
}: {
  params: Promise<{ probe: string }>
  searchParams: Promise<{ r?: string | string[] }>
}) {
  const probe = resolveProbe((await params).probe)
  if (!probe) notFound()
  const { slug } = probe

  const round = normalizeRound((await searchParams).r)
  const code = (kind: 'SRV' | 'UC' | 'LD') => controlCode(slug, round, kind)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Página de laboratório — controle positivo',
    identifier: code('LD'),
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
      />
      <h1>Página de laboratório — controle positivo</h1>
      <p>
        Esta página existe para medir o que um assistente de IA lê de uma página Next.js quando
        alguém pede que ele a abra. Ela não está no sitemap, não está no índice de busca e
        nenhuma página aponta para cá: só chega aqui quem recebeu o endereço. O experimento é
        público e está documentado no repositório do site (
        <code>docs/detection-experiment.md</code>, §4.6 e §4.7).
      </p>
      <p>
        Rodada <strong>{round}</strong>. Os códigos abaixo mudam a cada rodada.
      </p>
      <p>
        Código do servidor: <strong>{code('SRV')}</strong>
      </p>
      <RenderedByClientComponent code={code('UC')} />
      <FetchedCode endpoint={`${controlPaths(slug).js}?r=${round}`} />
      <p>
        O acesso é registrado sem o endereço IP: caminho, cabeçalhos técnicos da requisição (user
        agent, <code>Accept</code>, <code>Accept-Language</code>), o país, a lista pública de
        faixas de rede em que o endereço está, se estiver em alguma, e um código de rede truncado
        que rotaciona todo mês. Detalhes na{' '}
        <a href="/politica-de-privacidade">política de privacidade</a>.
      </p>
    </main>
  )
}
