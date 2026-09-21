// ─────────────────────────────────────────────────────────────────────────────
// Paleta do sistema visual em hex — para quem não lê CSS custom properties.
//
// O site consome as cores por `var(--x)` (globals.css → tailwind.config.js).
// Três lugares não conseguem: o Satori das imagens OG, o favicon e a tabela de
// contraste que a página /design calcula no build. Eles leem daqui.
//
// Duas fontes de verdade para o mesmo número só são aceitáveis com um teste que
// as mantém iguais: design-tokens.test.ts compara cada valor abaixo com o token
// correspondente em globals.css e falha na primeira divergência.
//
// Contraste medido (WCAG 2.x) contra os fundos — ver docs/design-system.md.
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  /** Fundo da página — grafite. */
  background: '#0E1116',
  /** Superfície de cartão. */
  surface: '#151A21',
  /** Superfície elevada — blocos de código. */
  surface2: '#1B222B',
  /** Faixa alternada de seção (manifesto). */
  surfaceAlt: '#12161C',
  /** Fio de 1px, divisores. Decorativo: 1,40:1, nunca borda de controle. */
  rule: '#262F3A',
  /** Fio forte, contorno de botão secundário. */
  ruleStrong: '#35404E',
  /** Borda de controle de formulário — ≥3:1 (WCAG 1.4.11) sobre fundo e cartão. */
  control: '#606B7A',
  /** Títulos e texto de destaque. */
  foreground: '#E8ECF1',
  /** Corpo de leitura longa. */
  body: '#C6D0DB',
  /** Texto de apoio, resumos. */
  muted: '#97A3B2',
  /** Rótulos monoespaçados. Não usar sobre surface2 (4,39:1) — ver labelOnCode. */
  label: '#7A8798',
  /** Rótulo sobre bloco de código: 5,12:1 sobre surface2. */
  labelOnCode: '#8593A4',
  /** Acento primário — ciano de instrumento. Texto, link, fio, botão sólido. */
  primary: '#3ED8C8',
  /** Hover do acento. */
  primaryHover: '#8BE9DE',
  /** Texto sobre superfície ciano ou âmbar. */
  onPrimary: '#0E1116',
  /** Acento secundário — âmbar de alerta. */
  accent: '#E89B3C',
  /** Vermelho como TEXTO ("regressão", "não"): 5,61:1 sobre o fundo. */
  dangerText: '#E5625A',
  /** Vermelho De Stijl como FORMA. Como texto reprova (4,21:1). */
  danger: '#D0483C',
  /** Azul De Stijl — referência. Só forma (3,18:1). */
  reference: '#2F5BD0',
} as const

export type ColorToken = keyof typeof colors

/** Luminância relativa (WCAG 2.x) de uma cor #RRGGBB. */
export function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste WCAG entre duas cores, de 1 a 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
