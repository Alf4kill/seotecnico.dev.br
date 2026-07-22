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
function Table(props: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="table-scroll">
      <table {...props} />
    </div>
  )
}

export const mdxComponents = {
  Image,
  table: Table,
}
