import Link from 'next/link'
import { buildMetadata } from '@/lib/metadata'
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import { CwvChecker } from '@/components/tools/CwvChecker'
import { FaqSection } from '@/components/sections/FaqSection'

// ─────────────────────────────────────────────────────────────────────────────
// Ferramenta 3 (CLAUDE.md §5.3): Checador de Core Web Vitals.
// Mesmo padrão das outras duas: client component com a UI + conteúdo
// explicativo renderizado no servidor abaixo (o conteúdo rankeia; a ferramenta
// é usada e linkada). A página é estática; a consulta ao CrUX — e a chave —
// vivem em /api/checador-cwv.
// ─────────────────────────────────────────────────────────────────────────────

const TITLE = 'Checador de Core Web Vitals (dados de campo)'
const DESCRIPTION =
  'Consulte LCP, INP e CLS reais de qualquer site pelo Chrome UX Report: o p75 de usuários de verdade nos últimos 28 dias, com a distribuição das visitas.'
const PATH = '/ferramentas/checador-cwv'

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
})

const faqItems = [
  {
    question: 'Por que meu site aparece como "não está no conjunto de dados"?',
    answer:
      'Porque o CrUX só publica uma origem quando ela reúne visitantes suficientes na janela de 28 dias, com Chrome e com o compartilhamento de estatísticas de uso ativado. Sites novos ou de baixo tráfego simplesmente não aparecem — não é um defeito do site nem um veredito de performance. Enquanto isso, meça com Lighthouse (laboratório) ou instrumente RUM próprio.',
  },
  {
    question: 'Qual a diferença entre estes números e a nota do Lighthouse?',
    answer:
      'São coisas diferentes. O Lighthouse é laboratório: uma carga, um dispositivo emulado, uma rede simulada — ótimo para diagnosticar. O CrUX é campo: o percentil 75 de visitas reais nos últimos 28 dias, em todos os aparelhos e redes dos seus usuários. É o campo que o Google usa como sinal de ranking, e é normal um site com 100 no Lighthouse ter campo pior.',
  },
  {
    question: 'Por que o resultado de exemplo.com difere de www.exemplo.com?',
    answer:
      'Porque para o CrUX são origens diferentes, com conjuntos de dados separados. A ferramenta nunca remove o www por conta própria: fazer isso devolveria o dado de outro endereço sem avisar. Consulte exatamente a origem que seus usuários acessam.',
  },
  {
    question: 'Por que o LCP é bom mas parte dos usuários está em "ruim"?',
    answer:
      'Porque o p75 é um único ponto de corte: ele diz que 75% das visitas ficaram abaixo daquele valor, e nada sobre o quarto restante. Por isso cada métrica aqui mostra também a distribuição em três faixas. Uma origem pode estar "boa" no p75 com 20% dos usuários em "ruim" — normalmente um segmento específico de aparelho ou de rede.',
  },
  {
    question: 'A ferramenta é gratuita? O endereço que eu consulto fica salvo?',
    answer:
      'É gratuita e sem login. A origem consultada não é armazenada nem registrada; o site guarda apenas um evento anônimo com a faixa do LCP (bom, precisa melhorar, ruim ou sem dados), sujeito ao seu consentimento de cookies.',
  },
]

export default function ChecadorCwvPage() {
  return (
    <>
      <SoftwareApplicationJsonLd name={TITLE} description={DESCRIPTION} path={PATH} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Ferramentas', path: '/ferramentas' },
          { name: 'Checador de Core Web Vitals', path: PATH },
        ]}
      />

      <section className="container py-12 lg:py-16">
        <h1 className="font-bold text-foreground text-3xl md:text-4xl">
          Checador de Core Web Vitals
        </h1>
        <p className="mt-4 max-w-3xl text-muted text-base leading-7">
          Digite um endereço e veja os Core Web Vitals de campo daquela origem:
          LCP, INP e CLS no percentil 75 de usuários reais nos últimos 28 dias,
          direto do Chrome UX Report — com a distribuição das visitas em cada
          faixa. Grátis, sem login e sem armazenar o endereço consultado.
        </p>

        <CwvChecker />

        <div className="rich-text mt-14 max-w-3xl">
          <h2>Campo e laboratório medem coisas diferentes</h2>
          <p>
            O número que esta ferramenta mostra vem do <strong>campo</strong>:
            visitas reais, aparelhos reais, redes reais, agregadas pelo Chrome
            UX Report numa janela de 28 dias. É esse o dado que o Google usa
            como sinal, e é por isso que ele não bate com a nota do Lighthouse,
            que roda uma única carga num dispositivo emulado. As duas medidas
            são úteis e não competem: o campo diz <em>se</em> existe problema e
            para quem; o laboratório diz <em>onde</em> está e permite testar a
            correção antes de publicar.
          </p>
          <p>
            Este site pratica a separação que ensina. Os orçamentos que travam
            o CI aqui são de laboratório e deliberadamente mais rígidos que os
            limiares de campo — LCP abaixo de 2,0s no lab contra os 2,5s do
            campo. A folga não é discordância do limiar publicado: é margem,
            porque o p75 de campo inclui a cauda lenta que uma execução
            emulada nunca vê.
          </p>

          <h2>Os limiares que a ferramenta aplica</h2>
          <p>
            São os publicados pelo Google para dados de campo, no p75 da
            origem: LCP bom até 2,5s e ruim acima de 4s; INP bom até 200ms e
            ruim acima de 500ms; CLS bom até 0,1 e ruim acima de 0,25. FCP e
            TTFB aparecem como apoio — não são Core Web Vitals e não entram no
            ranking, mas um TTFB alto explica boa parte dos LCPs ruins. Como
            diagnosticar cada um no App Router está no{' '}
            <Link
              href="/blog/melhorar-lcp-nextjs"
              title="Como melhorar o LCP no Next.js"
            >
              guia de LCP pelas 4 subpartes
            </Link>{' '}
            e em{' '}
            <Link href="/blog/inp-nextjs" title="INP no Next.js: como diagnosticar e corrigir">
              INP no Next.js
            </Link>
            .
          </p>

          <h2>Quando o CrUX não tem o seu site</h2>
          <p>
            É o resultado mais comum, e não significa que a performance seja
            ruim: significa que a origem ainda não reuniu visitantes suficientes
            no período. A ausência é, ela própria, um dado — o momento em que um
            domínio novo <em>entra</em> no CrUX é um marco mensurável, e este
            projeto registrou a própria ausência no baseline de julho de 2026
            justamente para poder medir a entrada depois. Enquanto o campo não
            existe, o caminho é medir RUM no seu próprio site, que é o que este
            domínio faz com a biblioteca <code>web-vitals</code> enviando LCP e
            INP reais para o GA4. O passo a passo está no{' '}
            <Link
              href="/guia/seo-tecnico-nextjs"
              title="Guia completo de SEO técnico para Next.js"
            >
              guia de SEO técnico para Next.js
            </Link>
            . Para checar as tags da mesma página, use o{' '}
            <Link
              href="/ferramentas/validador-meta-tags"
              title="Validador de meta tags e Open Graph"
            >
              validador de meta tags
            </Link>
            .
          </p>
        </div>
      </section>

      <FaqSection items={faqItems} />
    </>
  )
}
