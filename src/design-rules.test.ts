import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// As regras "NÃO" do sistema visual (docs/design-system.md, página /design),
// verificadas no código — não na revisão de quem lembrar delas.
//
// Por que um teste e não só a configuração: tailwind.config.js já apagou
// `rounded-lg`, `shadow-md` e afins, mas o Tailwind não reclama de classe que
// não existe — ela simplesmente não gera CSS, e o componente sai quebrado sem
// aviso. Aqui a classe proibida falha o CI com o arquivo e a linha.
// ─────────────────────────────────────────────────────────────────────────────

const ROOT = path.join(process.cwd(), 'src')

/** Onde hex é permitido: as duas fontes de verdade da paleta, e o favicon. */
const HEX_ALLOWED = new Set(['lib/design-tokens.ts', 'app/globals.css', 'app/icon.svg'])

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return files(full)
    return /\.(tsx?|css|svg)$/.test(entry.name) && !entry.name.endsWith('.test.ts') ? [full] : []
  })
}

const SOURCES = files(ROOT).map((file) => ({
  rel: path.relative(ROOT, file).split(path.sep).join('/'),
  lines: fs.readFileSync(file, 'utf8').split(/\r?\n/),
}))

/** Comentário não é código: citar "#7A8798 reprova" num comentário é documentação. */
const isComment = (line: string) => /^\s*(\/\/|\/?\*|\{\/\*)/.test(line)

/** Linhas de código que casam com o padrão, como "arquivo:linha  trecho". */
function offenders(pattern: RegExp, skip: (rel: string) => boolean = () => false): string[] {
  return SOURCES.filter(({ rel }) => !skip(rel)).flatMap(({ rel, lines }) =>
    lines.flatMap((line, i) =>
      !isComment(line) && pattern.test(line) ? [`${rel}:${i + 1}  ${line.trim().slice(0, 90)}`] : []
    )
  )
}

describe('regras do sistema visual', () => {
  it('nenhum canto arredondado (só o círculo, rounded-full, é forma)', () => {
    expect(offenders(/\brounded-(?!full\b|none\b)[\w[\]-]+|\brounded(?=["'\s`])|border-radius:\s*(?!0|50%)/)).toEqual([])
  })

  // A faixa de alerta (repeating-linear-gradient) é listra, não degradê: é um
  // elemento do próprio sistema.
  it('nenhuma sombra nem degradê decorativo', () => {
    expect(offenders(/\bshadow-(?!none\b)[\w[\]-]+|\bbg-gradient-|(?<!repeating-)linear-gradient\(/)).toEqual([])
  })

  it('nenhuma cor fora dos tokens (text-white, gray-500, hex solto)', () => {
    expect(offenders(/\b(?:text|bg|border)-(?:white|black)\b|\bgray-\d{2,3}\b/)).toEqual([])
    expect(offenders(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/, (rel) => HEX_ALLOWED.has(rel))).toEqual([])
  })

  it('o tema claro não voltou', () => {
    expect(offenders(/data-theme|prefers-color-scheme:\s*light|ThemeToggle|ThemeScript/)).toEqual([])
  })
})
