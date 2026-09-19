import type { Metadata } from 'next'
import { RootShell } from '@/components/layout/RootShell'
import { NotFoundContent } from '@/components/sections/NotFoundContent'
import { rootMetadata, rootViewport } from '@/lib/metadata'
import { site } from '@/lib/site'

// ─────────────────────────────────────────────────────────────────────────────
// 404 de URLs que não casam com rota nenhuma (experimental.globalNotFound).
//
// Necessário porque o site tem um root layout por idioma (ver RootShell): sem
// um app/layout.tsx único, não há onde compor o 404 global. Este arquivo
// ignora os layouts e devolve o documento inteiro — por isso reusa o RootShell,
// que é o mesmo documento que as páginas usam, e o 404 continua com header,
// footer, fontes e Consent Mode.
//
// A moldura é a portuguesa (x-default do site, §10); o conteúdo é bilíngue
// porque a URL errada pode ter vindo de qualquer um dos dois lados.
//
// Metadados: os do root layout português mais o título. Sem `robots`, de
// propósito: o Next.js já injeta `<meta name="robots" content="noindex">` em
// toda resposta 404. Declarar outro aqui produzia duas metas — medido no build
// de 2026-09-12 (`noindex` + `noindex, follow`). E como nenhum layout emite
// `robots` (ver `rootMetadata`), a do Next é a única do documento.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  ...rootMetadata('pt-BR'),
  title: `Página não encontrada | ${site.name}`,
}

export const viewport = rootViewport

export default function GlobalNotFound() {
  return (
    <RootShell lang="pt-BR">
      <NotFoundContent bilingual />
    </RootShell>
  )
}
