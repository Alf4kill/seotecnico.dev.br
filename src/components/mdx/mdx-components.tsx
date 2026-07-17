import Image from 'next/image'

// ─────────────────────────────────────────────────────────────────────────────
// Componentes disponíveis dentro dos arquivos MDX de /content.
//
// `Image` (next/image) é a forma sancionada de embutir imagens em artigos:
// exige width/height explícitos (sem CLS) e serve formato otimizado (§6).
// Imagens de conteúdo ficam abaixo da dobra — nunca usar `preload` aqui.
// ─────────────────────────────────────────────────────────────────────────────

export const mdxComponents = {
  Image,
}
