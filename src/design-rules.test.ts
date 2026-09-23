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

/**
 * Texto corrido da página /design: fala das regras em prosa ("o grafite
 * #0E1116", "a rounded corner"), então fica fora das regras de classe e cor.
 */
const PROSE = 'components/design/manifesto-copy.ts'

/** Onde hex é permitido: as duas fontes de verdade da paleta, o favicon e a prosa. */
const HEX_ALLOWED = new Set(['lib/design-tokens.ts', 'app/globals.css', 'app/icon.svg', PROSE])

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
    expect(
      offenders(
        /\brounded-(?!full\b|none\b)[\w[\]-]+|\brounded(?=["'\s`])|border-radius:\s*(?!0|50%)/,
        (rel) => rel === PROSE
      )
    ).toEqual([])
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

  // Dois temas, um seletor: o claro vive só no bloco [data-theme='light'] de
  // globals.css e nos arquivos que gravam o atributo. Um `dark:` do Tailwind ou
  // uma media query solta criariam um terceiro caminho que os testes de
  // contraste não percorrem.
  it('o tema só muda por data-theme, e só nos lugares donos dele', () => {
    const THEME_OWNERS = new Set([
      'app/globals.css',
      'components/layout/ThemeScript.tsx',
      'components/layout/ThemeToggle.tsx',
      'lib/metadata.ts', // theme-color por preferência do sistema
    ])
    expect(offenders(/data-theme|prefers-color-scheme/, (rel) => THEME_OWNERS.has(rel) || rel === PROSE)).toEqual([])
    expect(offenders(/dark:[\w-]/)).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Arte (docs/design-system.md → Arte): cenas, emblemas e marcas de fundo são
// decoração. Precisam sair do leitor de tela, seguir o tema e nunca virar
// imagem raster.
// ─────────────────────────────────────────────────────────────────────────────
describe('regras da arte', () => {
  const ART = SOURCES.filter(({ rel }) => rel.startsWith('components/art/'))

  it('existe arte para verificar', () => {
    expect(ART.map(({ rel }) => rel)).toEqual(
      expect.arrayContaining(['components/art/generated.tsx', 'components/art/Marks.tsx'])
    )
  })

  it('todo <svg> da arte é aria-hidden e não focável', () => {
    const bad = ART.flatMap(({ rel, lines }) =>
      lines.flatMap((line, i) =>
        /<svg/.test(line) && !/aria-hidden/.test(line + (lines[i + 1] ?? '') + (lines[i + 2] ?? '') + (lines[i + 3] ?? ''))
          ? [`${rel}:${i + 1}`]
          : []
      )
    )
    expect(bad).toEqual([])
  })

  it('sem raster, filtro, blur nem cor inline', () => {
    const bad = ART.flatMap(({ rel, lines }) =>
      lines.flatMap((line, i) =>
        /<image|<filter|blur\(|(?:fill|stroke)="(?!none")[^"{]/.test(line) ? [`${rel}:${i + 1}  ${line.trim()}`] : []
      )
    )
    expect(bad).toEqual([])
  })
})
