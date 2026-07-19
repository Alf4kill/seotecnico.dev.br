import Link from 'next/link'
import { buildMetadata } from '@/lib/metadata'
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import { JsonLdGenerator } from '@/components/tools/JsonLdGenerator'
import { FaqSection } from '@/components/sections/FaqSection'

// ─────────────────────────────────────────────────────────────────────────────
// Ferramenta 1 (CLAUDE.md §5.3): Gerador de JSON-LD.
// Padrão de página de ferramenta: client component com a UI + conteúdo
// explicativo renderizado no servidor abaixo dela (o conteúdo é o que rankeia;
// a ferramenta é o que é usado e linkado). Página 100% estática.
// ─────────────────────────────────────────────────────────────────────────────

const TITLE = 'Gerador de JSON-LD e dados estruturados'
const DESCRIPTION =
  'Gere JSON-LD válido de Article, FAQPage, BreadcrumbList, Person e Organization — com saída pronta para Next.js. Grátis, sem login e sem armazenar dados.'
const PATH = '/ferramentas/gerador-json-ld'

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
})

const faqItems = [
  {
    question: 'O gerador é gratuito? Os dados que eu digito ficam salvos?',
    answer:
      'É gratuito e sem login. Tudo roda no seu navegador: nenhum campo do formulário é enviado ou armazenado em servidor. O site registra apenas um evento anônimo de uso da ferramenta (qual tipo de schema foi gerado), sujeito ao seu consentimento de cookies.',
  },
  {
    question: 'JSON-LD ajuda no ranking do Google?',
    answer:
      'Dados estruturados não são um fator direto de ranking, mas habilitam rich results (FAQ expandido, breadcrumb na URL, dados do artigo) que aumentam a visibilidade e o CTR na página de resultados — e ajudam o Google a entender entidades como autor e organização.',
  },
  {
    question: 'Onde eu colo o JSON-LD gerado no Next.js?',
    answer:
      'Num Server Component da página, dentro de uma tag script com type application/ld+json, usando dangerouslySetInnerHTML com JSON.stringify do schema. A aba "Componente Next.js" da ferramenta já entrega esse código pronto — é o mesmo padrão que este site usa em produção.',
  },
  {
    question: 'Preciso validar o código antes de publicar?',
    answer:
      'Sim, sempre. Use o teste de pesquisa aprimorada do Google para conferir a elegibilidade a rich results e o validator.schema.org para a sintaxe schema.org. Depois de publicar, acompanhe erros de dados estruturados no relatório de melhorias do Search Console.',
  },
]

export default function GeradorJsonLdPage() {
  return (
    <>
      <SoftwareApplicationJsonLd name={TITLE} description={DESCRIPTION} path={PATH} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Ferramentas', path: '/ferramentas' },
          { name: 'Gerador de JSON-LD', path: PATH },
        ]}
      />

      <section className="container py-12 lg:py-16">
        <h1 className="font-bold text-foreground text-3xl md:text-4xl">
          Gerador de JSON-LD
        </h1>
        <p className="mt-4 max-w-3xl text-muted text-base leading-7">
          Escolha o tipo de schema, preencha o formulário e gere dados
          estruturados schema.org válidos — em JSON-LD puro ou como componente
          Next.js pronto para colar no seu projeto. Grátis, sem login e sem
          armazenar nada do que você digita.
        </p>

        <JsonLdGenerator />

        <div className="rich-text mt-14 max-w-3xl">
          <h2>O que é JSON-LD (e por que o Google prefere esse formato)</h2>
          <p>
            JSON-LD (JSON for Linked Data) é o formato de dados estruturados
            que o Google{' '}
            <a
              href="https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"
              target="_blank"
              rel="noopener noreferrer"
            >
              recomenda oficialmente
            </a>
            : um bloco de JSON dentro de uma tag <code>{'<script>'}</code>,
            separado do HTML visível. Diferente de microdata, ele não se
            mistura com a marcação da página — dá para gerar, testar e
            versionar o schema como qualquer outro dado. É com ele que uma
            página se torna elegível a rich results como FAQ expandido,
            breadcrumbs na URL e metadados de artigo na busca.
          </p>

          <h2>Como implementar o JSON-LD no Next.js (App Router)</h2>
          <p>
            No App Router, o lugar do JSON-LD é um <strong>Server
            Component</strong>: o schema sai no HTML inicial, visível para o
            Googlebot sem depender de JavaScript. O padrão — o mesmo que a aba
            &quot;Componente Next.js&quot; da ferramenta gera, e o mesmo que
            este site usa em todas as páginas:
          </p>
          <pre>
            <code>{`// components/seo/faq-json-ld.tsx
const schema = { /* saída do gerador */ }

export function FaqJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}`}</code>
          </pre>
          <p>
            Renderize o componente dentro da página (não no{' '}
            <code>layout.tsx</code>, a menos que o schema valha para o site
            inteiro, como <code>WebSite</code>). Este gerador entrega o schema
            rápido; para a implementação completa — onde cada tipo vive no App
            Router, como derivar o <code>Article</code> do frontmatter e como
            travar tudo por teste automatizado — veja{' '}
            <Link
              href="/blog/json-ld-nextjs"
              title="Como implementar JSON-LD no Next.js (App Router)"
            >
              como implementar JSON-LD no Next.js
            </Link>
            .
          </p>

          <h2>Como validar os dados estruturados</h2>
          <p>
            Gerou, validou: o{' '}
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noopener noreferrer"
            >
              teste de pesquisa aprimorada
            </a>{' '}
            confirma a elegibilidade a rich results do Google, e o{' '}
            <a
              href="https://validator.schema.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              validador do schema.org
            </a>{' '}
            confere a sintaxe. Depois de publicado, o Search Console passa a
            reportar erros e avisos de dados estruturados no relatório de
            melhorias — é lá que você descobre se algo quebrou numa mudança de
            template.
          </p>
        </div>
      </section>

      <FaqSection items={faqItems} />
    </>
  )
}
