'use client'

import { useState } from 'react'
import type { FaqItem } from '@/lib/content'

/**
 * Seção de FAQ (acordeão) + rich snippet schema.org/FAQPage.
 *
 * Apresentacional e reutilizável: o conteúdo vem por prop — tipicamente do
 * campo `faq` do frontmatter de um artigo MDX.
 */
type FaqSectionProps = {
  /** Perguntas/respostas a exibir. */
  items: FaqItem[]
  /** Título (h2) da seção. */
  titulo?: string
  /** Idioma do conteúdo — marca a subárvore quando difere do documento. */
  lang?: 'pt-BR' | 'en'
}

export function FaqSection({ items, titulo = 'Perguntas frequentes', lang }: FaqSectionProps) {
  // Primeiro item aberto por padrão (espelha o design).
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      lang={lang}
      className="mt-16 border-t border-gray bg-surface-alt py-12 md:py-16"
      aria-labelledby="faq-titulo"
    >
      <div className="container-xl grid gap-8 lg:grid-cols-12 lg:gap-6">

        {/* Alinhado à esquerda, como todo título do sistema: a escola suíça
            não centraliza (docs/design-system.md). */}
        <h2
          id="faq-titulo"
          className="font-display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.025em] text-foreground lg:col-span-4"
        >
          {titulo}
        </h2>

        <div className="flex flex-col border-b border-gray lg:col-span-8">
          {items.map(({ question, answer }, i) => {
            const open = openIndex === i
            const panelId = `faq-panel-${i}`
            const buttonId = `faq-button-${i}`

            return (
              <div
                key={question}
                className="border-t border-gray"
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full cursor-pointer items-baseline gap-4 py-5 text-left"
                >
                  <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 font-display text-lg font-medium text-foreground lg:text-xl">
                    {question}
                  </span>
                  <span aria-hidden="true" className="font-mono text-lg text-primary">
                    {open ? '−' : '+'}
                  </span>
                </button>

                {/* Animação de altura via grid-template-rows (0fr -> 1fr) */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={[
                    'grid transition-[grid-template-rows] duration-300 ease-in-out',
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  ].join(' ')}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[68ch] pb-6 pl-8 text-base leading-relaxed text-body">
                      {answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rich snippet de FAQ (schema.org/FAQPage).
          `<` vira `<` para que nenhum texto de pergunta/resposta possa
          fechar a tag script — mesmo escape usado em components/seo/JsonLd. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: items.map(({ question, answer }) => ({
              '@type': 'Question',
              name: question,
              acceptedAnswer: { '@type': 'Answer', text: answer },
            })),
          }).replace(/</g, '\\u003c'),
        }}
      />
    </section>
  )
}
