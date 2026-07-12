'use client'

import { useRef, useState, Children, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Slider de cartões reutilizável.
 *
 *  - Desktop (lg+): grade estática (lg:grid + gridColsClass), sem controles.
 *  - Tablet (sm–lg): grade estática de 2 colunas (sm:grid-cols-2), sem controles.
 *  - Mobile (< sm): slider horizontal com scroll-snap nativo (suporta swipe),
 *    setas anterior/próximo e indicadores (dots). Sem dependências externas.
 *
 * Cada filho é envolvido por um "slide" (largura total no mobile, célula da
 * grade no desktop). Os cartões filhos devem usar `w-full`/`h-full` para
 * preencher o slide e manter alturas iguais.
 *
 * Usado por: AvaliacoesSection (variant="light", fundo verde) e
 * BlogSection (variant="dark", fundo claro).
 */

type Variant = 'light' | 'dark'

const styles: Record<
  Variant,
  { button: string; dotActive: string; dotIdle: string; outline: string }
> = {
  // Sobre fundo escuro/verde: controles brancos.
  light: {
    button: 'bg-white text-primary hover:bg-gray-50',
    dotActive: 'bg-white',
    dotIdle: 'bg-white/50 hover:bg-white/70',
    outline: 'focus-visible:outline-white',
  },
  // Sobre fundo claro: botões brancos com sombra, dots verdes.
  dark: {
    button: 'bg-white text-primary shadow-md hover:bg-gray-50',
    dotActive: 'bg-primary',
    dotIdle: 'bg-gray-300 hover:bg-gray-400',
    outline: 'focus-visible:outline-primary',
  },
}

export function CardSlider({
  children,
  gridColsClass = 'lg:grid-cols-4',
  variant = 'light',
}: {
  children: ReactNode
  /** Classe de colunas no desktop (lg+). Mantenha como literal p/ o Tailwind. */
  gridColsClass?: string
  variant?: Variant
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const count = Children.count(children)
  const s = styles[variant]

  /** Recalcula o dot ativo a partir do slide mais próximo do scroll atual. */
  function handleScroll() {
    const el = scrollerRef.current
    if (!el) return
    const slides = Array.from(el.children) as HTMLElement[]
    let closest = 0
    let min = Infinity
    slides.forEach((slide, i) => {
      const dist = Math.abs(slide.offsetLeft - el.scrollLeft)
      if (dist < min) {
        min = dist
        closest = i
      }
    })
    setActiveIndex(closest)
  }

  function scrollToIndex(index: number) {
    const el = scrollerRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(index, count - 1))
    const slide = el.children[clamped] as HTMLElement | undefined
    if (slide) el.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Track: slider no mobile, grade no desktop */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className={[
          'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
          'xl:gap-6',
          'sm:grid sm:grid-cols-2 sm:overflow-visible',
          gridColsClass,
        ].join(' ')}
      >
        {Children.map(children, (child) => (
          <div className="flex h-auto w-full shrink-0 basis-full snap-center sm:basis-auto">
            {child}
          </div>
        ))}
      </div>

      {/* Controles — apenas mobile (< sm) */}
      <div className="mt-8 flex items-center justify-center gap-6 sm:hidden">
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Anterior"
          className={[
            'flex h-12 w-12 items-center justify-center rounded-full transition',
            'disabled:opacity-40 focus-visible:outline focus-visible:outline-2',
            'focus-visible:outline-offset-2',
            s.button,
            s.outline,
          ].join(' ')}
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Ir para o item ${i + 1}`}
              aria-current={activeIndex === i}
              className={[
                'h-2.5 rounded-full transition-all duration-300',
                activeIndex === i ? `w-6 ${s.dotActive}` : `w-2.5 ${s.dotIdle}`,
              ].join(' ')}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex === count - 1}
          aria-label="Próximo"
          className={[
            'flex h-12 w-12 items-center justify-center rounded-full transition',
            'disabled:opacity-40 focus-visible:outline focus-visible:outline-2',
            'focus-visible:outline-offset-2',
            s.button,
            s.outline,
          ].join(' ')}
        >
          <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
