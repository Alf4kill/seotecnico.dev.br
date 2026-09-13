import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Os artigos citam código DESTE repositório pelo caminho — "o generateMetadata
// real está em src/app/(pt)/blog/[slug]/page.tsx". Esse é o argumento de
// E-E-A-T do site: o que o artigo mostra é o que roda aqui.
//
// A migração para route groups (PR #44) moveu esses arquivos e nenhum teste
// percebeu: quatro artigos ficaram citando caminhos que não existiam mais. Este
// teste só confere que o arquivo citado existe; não confere se o trecho bate
// com o conteúdo. É barato e pega o caso mais comum, que é a mudança de lugar.
//
// Convenção que o teste assume: caminho com prefixo `src/` é deste repositório.
// Trecho genérico de tutorial ("app/layout.tsx", sem `src/`) não é conferido.
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT_DIR = path.join(process.cwd(), 'content')
const SRC_PATH = /\bsrc\/[\w\-./[\]()]+?\.(?:tsx|ts|jsx|js|mjs|css)\b/g

function mdxFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return mdxFiles(full)
    return entry.name.endsWith('.mdx') ? [full] : []
  })
}

describe('content ↔ repository', () => {
  const files = mdxFiles(CONTENT_DIR)

  it('finds the articles it is meant to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map((file) => [path.relative(process.cwd(), file).split(path.sep).join('/'), file]))(
    '%s cites only files that exist in this repository',
    (_label, file) => {
      const cited = [...new Set(fs.readFileSync(file, 'utf-8').match(SRC_PATH) ?? [])]
      const missing = cited.filter((p) => !fs.existsSync(path.join(process.cwd(), p)))

      expect(missing, 'cited as this site’s code, but no such file').toEqual([])
    }
  )
})
