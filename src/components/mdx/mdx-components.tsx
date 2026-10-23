import Image from 'next/image'
import type { ComponentPropsWithoutRef } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Componentes disponíveis dentro dos arquivos MDX de /content.
//
// `Image` (next/image) é a forma sancionada de embutir imagens em artigos:
// exige width/height explícitos (sem CLS) e serve formato otimizado (§6).
// Imagens de conteúdo ficam abaixo da dobra — nunca usar `preload` aqui.
// ─────────────────────────────────────────────────────────────────────────────

// Tabelas markdown viram <table> sem contêiner de scroll; células com código
// não quebram linha e estouravam o container no mobile. O wrapper dá o
// overflow-x próprio (mesma solução que o `pre` já tem no globals.css).
//
// Os dois contêineres com scroll horizontal (tabela e bloco de código) levam
// tabIndex=0: sem foco, quem navega só pelo teclado não consegue rolar o que
// passou da largura (axe scrollable-region-focusable, WCAG 2.1.1).
function Table(props: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="table-scroll" tabIndex={0}>
      <table {...props} />
    </div>
  )
}

function Pre(props: ComponentPropsWithoutRef<'pre'>) {
  return <pre tabIndex={0} {...props} />
}

export const mdxComponents = {
  Image,
  table: Table,
  pre: Pre,
}
