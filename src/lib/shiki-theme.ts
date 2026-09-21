import type { ThemeRegistrationRaw } from 'shiki'
import { colors } from '@/lib/design-tokens'

// ─────────────────────────────────────────────────────────────────────────────
// Tema de código do sistema visual — construído com a paleta do site em vez de
// escolhido num catálogo, pelo mesmo critério que escolheu o anterior
// (github-dark-high-contrast): o audit de contraste do Lighthouse avalia cada
// span de código como texto, então TODO token tem de passar AA sobre o fundo.
//
// Pior token: comentário, #8593A4 sobre #1B222B = 5,12:1. O design original
// pedia #7A8798 para palavras-chave (4,39:1 — reprova); subiu um degrau.
// shiki-theme.test.ts mede cada cor deste arquivo e falha abaixo de 4,5:1.
//
// Hierarquia: identificadores claros, palavras-chave apagadas, strings em
// ciano claro, funções em âmbar — o código lê como o resto da página.
// ─────────────────────────────────────────────────────────────────────────────

const c = {
  bg: colors.surface2,
  fg: colors.body,
  bright: colors.foreground,
  dim: colors.muted,
  comment: colors.labelOnCode,
  string: colors.primaryHover,
  number: colors.primary,
  fn: colors.accent,
  invalid: colors.dangerText,
}

const rules: ThemeRegistrationRaw['settings'] = [
  { settings: { background: c.bg, foreground: c.fg } },
  { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: c.comment } },
  {
    scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.operator.new', 'keyword.control'],
    settings: { foreground: c.dim },
  },
  { scope: ['keyword.operator', 'punctuation', 'meta.brace'], settings: { foreground: c.dim } },
  { scope: ['string', 'string.template', 'punctuation.definition.string'], settings: { foreground: c.string } },
  {
    scope: ['constant.numeric', 'constant.language', 'constant.character', 'support.constant'],
    settings: { foreground: c.number },
  },
  {
    scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function'],
    settings: { foreground: c.fn },
  },
  {
    scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'entity.other.inherited-class'],
    settings: { foreground: c.bright },
  },
  { scope: ['variable', 'variable.parameter', 'meta.object-literal.key'], settings: { foreground: c.fg } },
  { scope: ['variable.other.constant', 'variable.other.readwrite.alias'], settings: { foreground: c.bright } },
  { scope: ['entity.name.tag', 'support.type.property-name'], settings: { foreground: c.number } },
  { scope: ['entity.other.attribute-name'], settings: { foreground: c.fn } },
  { scope: ['markup.inserted'], settings: { foreground: c.number } },
  { scope: ['markup.deleted', 'invalid'], settings: { foreground: c.invalid } },
  { scope: ['markup.bold'], settings: { foreground: c.bright, fontStyle: 'bold' } },
]

export const shikiTheme: ThemeRegistrationRaw & { tokenColors: typeof rules } = {
  name: 'seo-tecnico-retro',
  type: 'dark',
  colors: {
    'editor.background': c.bg,
    'editor.foreground': c.fg,
  },
  settings: rules,
  // As mesmas regras sob a chave do formato VS Code: é por `tokenColors` que o
  // rehype-pretty-code reconhece um tema-objeto em tempo de execução (sem ela,
  // trata o objeto como mapa de vários temas), enquanto os tipos dele pedem
  // `settings`. O Shiki aceita as duas.
  tokenColors: rules,
}
