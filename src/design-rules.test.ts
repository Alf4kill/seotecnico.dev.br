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
// Fontes: o conteúdo cabe nos quatro arquivos latinos.
//
// O next/font serve cada família em arquivos por unicode-range, e o navegador
// só baixa o arquivo de um intervalo quando a página usa um caractere dele. Uma
// página só com texto latino baixa 4 arquivos (Plex Sans, Space Grotesk, Plex
// Mono 400 e 600), o teto `resource-summary:font:count` do lighthouserc.js.
// Um `─` num trecho de código puxa o arquivo de símbolos da Plex Mono; um `ƒ`,
// o latin-ext. O Lighthouse CI só audita algumas URLs, então este teste cobre
// todas as páginas de /content.
//
// Os intervalos são os dos @font-face do build de produção (2026-11-13). Se o
// next/font mudar os subconjuntos, copie de novo do <style> de qualquer página
// em .next/server/app. Caractere fora de todos os intervalos (→, ≤, ○) não
// baixa nada: cai na fonte do sistema.
// ─────────────────────────────────────────────────────────────────────────────
describe('subconjuntos de fonte no conteúdo', () => {
  const CONTENT = path.join(process.cwd(), 'content')

  const ranges = (spec: string): Array<[number, number]> =>
    spec.split(',').map((part) => {
      const [from, to = from] = part.split('-')
      return [parseInt(from, 16), parseInt(to, 16)]
    })
  const within = (code: number, list: Array<[number, number]>) => list.some(([a, b]) => code >= a && code <= b)

  // O intervalo latino vem por último no CSS e por isso é o primeiro que o
  // navegador tenta: caractere que está nele nunca puxa outro arquivo.
  const LATIN = ranges('0-FF,131,152-153,2BB-2BC,2C6,2DA,2DC,304,308,329,2000-206F,20AC,2122,2191,2193,2212,2215,FEFF,FFFD')
  const EXTRA: Record<string, Array<[number, number]>> = {
    'símbolos (Plex Mono)': ranges('2000-2001,2004-2008,200A,23B8-23BD,2500-259F'),
    'latin-ext': ranges(
      '100-2BA,2BD-2C5,2C7-2CC,2CE-2D7,2DD-2FF,304,308,329,1D00-1DBF,1E00-1E9F,1EF2-1EFF,2020,20A0-20AB,20AD-20C4,2113,2C60-2C7F,A720-A7FF'
    ),
    vietnamita: ranges('102-103,110-111,128-129,168-169,1A0-1A1,1AF-1B0,300-301,303-304,308-309,323,329,1EA0-1EF9,20AB'),
    'grego (Plex Sans)': ranges('370-377,37A-37F,384-38A,38C,38E-3A1,3A3-3FF'),
    cirílico: ranges('301,400-45F,490-491,4B0-4B1,2116'),
    'cirílico-ext': ranges('460-52F,1C80-1C8A,20B4,2DE0-2DFF,A640-A69F,FE2E-FE2F'),
  }

  // Exceções aceitas, por arquivo. O `ƒ` é o símbolo de rota dinâmica que o
  // `next build` imprime, e o artigo é sobre esses símbolos: trocá-lo mudaria
  // o que o artigo mostra. Custa os dois arquivos latin-ext da Plex Mono nesse
  // par de páginas, decisão em aberto no PR que criou este teste.
  const ACCEPTED: Record<string, string> = {
    'blog/ssr-ssg-isr-nextjs.mdx': 'ƒ',
    'en/blog/nextjs-ssr-ssg-isr.mdx': 'ƒ',
  }

  const contentFiles = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return contentFiles(full)
      return /\.mdx?$/.test(entry.name) ? [full] : []
    })

  const PAGES = contentFiles(CONTENT).map((file) => ({
    rel: path.relative(CONTENT, file).split(path.sep).join('/'),
    lines: fs.readFileSync(file, 'utf8').split(/\r?\n/),
  }))

  const subsetOf = (char: string) => {
    const code = char.codePointAt(0)!
    if (within(code, LATIN)) return null
    return Object.keys(EXTRA).find((name) => within(code, EXTRA[name])) ?? null
  }

  it('existe conteúdo para verificar', () => {
    expect(PAGES.length).toBeGreaterThan(20)
  })

  it('nenhum caractere de subconjunto não latino, fora das exceções aceitas', () => {
    const bad = PAGES.flatMap(({ rel, lines }) =>
      lines.flatMap((line, i) =>
        [...new Set(line)].flatMap((char) => {
          const subset = subsetOf(char)
          if (!subset || ACCEPTED[rel]?.includes(char)) return []
          const code = char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')
          return [`${rel}:${i + 1}  U+${code} ${char} (${subset})  ${line.trim().slice(0, 60)}`]
        })
      )
    )
    expect(bad).toEqual([])
  })

  it('toda exceção aceita ainda é usada (remova a que sobrar)', () => {
    const stale = Object.entries(ACCEPTED).flatMap(([rel, chars]) => {
      const page = PAGES.find((p) => p.rel === rel)
      return [...chars].filter((char) => !page?.lines.some((line) => line.includes(char))).map((char) => `${rel} ${char}`)
    })
    expect(stale).toEqual([])
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
