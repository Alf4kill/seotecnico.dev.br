import Link from 'next/link'
import { buildMetadata } from '@/lib/metadata'
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import { MetaValidator } from '@/components/tools/MetaValidator'
import { FaqSection } from '@/components/sections/FaqSection'

// ─────────────────────────────────────────────────────────────────────────────
// Ferramenta 2 (CLAUDE.md §5.3): Validador de meta tags.
// Mesmo padrão de página do gerador de JSON-LD: client component com a UI +
// conteúdo explicativo renderizado no servidor abaixo (o conteúdo rankeia; a
// ferramenta é usada e linkada). A página é estática; o trabalho dinâmico
// vive em /api/validador-meta.
// ─────────────────────────────────────────────────────────────────────────────

const TITLE = 'Validador de meta tags e Open Graph'
const DESCRIPTION =
  'Cole uma URL e veja como o Google e as redes sociais leem sua página: title, description, canonical, robots e Open Graph — com alertas do que corrigir.'
const PATH = '/ferramentas/validador-meta-tags'

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
})

const faqItems = [
  {
    question: 'O validador é gratuito? A URL que eu colo fica salva?',
    answer:
      'É gratuito e sem login. A URL é buscada uma única vez pelo servidor para ler as tags e não é armazenada nem registrada. O site guarda apenas um evento anônimo de uso da ferramenta (quantos problemas foram encontrados), sujeito ao seu consentimento de cookies.',
  },
  {
    question: 'Por que os limites são 60 caracteres para o title e 155 para a description?',
    answer:
      'Porque é aproximadamente onde o Google trunca na página de resultados (o corte real é em pixels, não em caracteres — 60/155 é a margem segura usada na prática). Passar do limite não é penalidade: o texto só aparece cortado, o que costuma reduzir o CTR.',
  },
  {
    question: 'O que é um canonical autorreferente e por que importa?',
    answer:
      'É a tag link rel="canonical" apontando para a própria URL da página. Ela consolida variações (parâmetros de campanha, barra final, http/https) num único endereço indexável. Toda página indexável deveria ter o seu — é uma das checagens que a suíte de testes deste próprio site impõe em CI.',
  },
  {
    question: 'A ferramenta funciona com páginas que dependem de JavaScript?',
    answer:
      'O validador lê o HTML que o servidor responde — o mesmo que um crawler recebe na primeira passada. Se suas meta tags só existem depois do JavaScript executar (SPA sem SSR), elas não aparecem aqui, e esse é exatamente o problema a corrigir: renderize as tags no servidor.',
  },
]

export default function ValidadorMetaTagsPage() {
  return (
    <>
      <SoftwareApplicationJsonLd name={TITLE} description={DESCRIPTION} path={PATH} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Ferramentas', path: '/ferramentas' },
          { name: 'Validador de meta tags', path: PATH },
        ]}
      />

      <section className="container py-12 lg:py-16">
        <h1 className="font-bold text-foreground text-3xl md:text-4xl">
          Validador de meta tags
        </h1>
        <p className="mt-4 max-w-3xl text-muted text-base leading-7">
          Cole a URL de qualquer página e veja o que o Google e as redes
          sociais realmente leem: title, meta description, canonical, robots,
          H1 e Open Graph — com um preview da SERP e alertas do que corrigir.
          Grátis, sem login e sem armazenar a URL.
        </p>

        <MetaValidator />

        <div className="rich-text mt-14 max-w-3xl">
          <h2>O que o validador checa (e com que régua)</h2>
          <p>
            As checagens são as mesmas que este site impõe a si próprio em CI:
            title presente e até 60 caracteres, meta description até 155,
            canonical absoluto e autorreferente, exatamente um H1, atributo{' '}
            <code>lang</code>, charset, viewport e as tags Open Graph que
            alimentam o preview de link no WhatsApp, LinkedIn e afins. Cada
            item volta como ok, aviso ou erro — com a explicação do porquê, não
            só o veredito. A régua completa, com o racional de cada tag e o
            código para implementá-las no App Router, está no guia da{' '}
            <Link
              href="/blog/metadata-api-nextjs"
              title="Metadata API do Next.js: guia prático"
            >
              Metadata API do Next.js
            </Link>
            .
          </p>

          <h2>Por que validar o HTML do servidor, e não o DOM</h2>
          <p>
            A ferramenta lê a resposta HTML crua da sua URL — o mesmo
            documento que o Googlebot recebe na primeira passada, antes de
            qualquer JavaScript. Meta tags injetadas no cliente podem até ser
            vistas pelo Google na fila de renderização, mas chegam tarde,
            competem com o que veio no HTML e somem para crawlers que não
            executam JS (a maioria dos agentes de IA, por exemplo — medido
            neste próprio domínio). Se o seu title só existe depois da
            hidratação, o diagnóstico não é da tag: é de renderização — o{' '}
            <Link
              href="/blog/ssr-ssg-isr-nextjs"
              title="SSR vs SSG vs ISR: o que o Googlebot enxerga"
            >
              comparativo SSR, SSG e ISR
            </Link>{' '}
            mostra o que cada estratégia entrega ao crawler.
          </p>

          <h2>Canonical: a checagem que mais reprova</h2>
          <p>
            Canonical ausente, relativo ou apontando para outra URL é o
            problema mais comum que a ferramenta encontra — e o mais barato de
            corrigir. A regra prática: toda página indexável carrega um
            canonical absoluto apontando para ela mesma; variações (parâmetros,
            barra final, versão http) consolidam no endereço canônico. Quando
            usar canonical, quando usar redirect e quando usar noindex — e por
            que <code>noindex</code> + <code>Disallow</code> se cancelam — está
            em{' '}
            <Link
              href="/blog/redirects-canonicals-nextjs"
              title="Redirects e canonicals no Next.js"
            >
              redirects e canonicals no Next.js
            </Link>
            . O contexto completo de SEO técnico para Next.js, do zero ao CI,
            fica no{' '}
            <Link
              href="/guia/seo-tecnico-nextjs"
              title="Guia completo de SEO técnico para Next.js"
            >
              guia de SEO técnico para Next.js
            </Link>
            .
          </p>
        </div>
      </section>

      <FaqSection items={faqItems} />
    </>
  )
}
