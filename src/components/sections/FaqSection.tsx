'use client'

import { useState } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
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
}

export function FaqSection({ items, titulo = 'Perguntas frequentes' }: FaqSectionProps) {
  // Primeiro item aberto por padrão (espelha o design).
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="bg-[#F9FAFB] py-12 md:py-16 lg:py-20" aria-labelledby="faq-titulo">
      <div className="container">

        <h2
          id="faq-titulo"
          className="text-center font-bold text-foreground
                     text-3xl md:text-4xl lg:text-5xl
                     mb-10 lg:mb-14"
        >
          {titulo}
        </h2>

        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {items.map(({ question, answer }, i) => {
            const open = openIndex === i
            const panelId = `faq-panel-${i}`
            const buttonId = `faq-button-${i}`

            return (
              <div
                key={question}
                className={[
                  'rounded-xl bg-white transition-colors duration-200',
                  open
                    ? 'border border-primary'
                    : 'border border-transparent shadow-sm',
                ].join(' ')}
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4
                             px-5 py-5 md:px-6 text-left cursor-pointer"
                >
                  <span className="font-semibold text-foreground text-base lg:text-lg">
                    {question}
                  </span>
                  {open ? (
                    <ArrowUp className="w-5 h-5 shrink-0 text-foreground" strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <ArrowDown className="w-5 h-5 shrink-0 text-foreground" strokeWidth={2} aria-hidden="true" />
                  )}
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
                    <p className="px-5 pb-5 md:px-6 text-muted text-sm leading-7 lg:text-base">
                      {answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rich snippet de FAQ (schema.org/FAQPage) */}
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
          }),
        }}
      />
    </section>
  )
}
