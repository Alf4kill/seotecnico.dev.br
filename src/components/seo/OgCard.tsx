import { site } from '@/lib/site'
import { colors } from '@/lib/design-tokens'
import type { SceneId } from '@/lib/art'
import type { CategoryShape, CategoryTone } from '@/lib/categories'
import type { CentralVariant } from '@/components/art/Marks'
import { markDataUri, sceneDataUri } from '@/lib/og-art'

// ─────────────────────────────────────────────────────────────────────────────
// OgCard — layout base das imagens Open Graph (1200×630) geradas com next/og.
//
// Renderizado pelo Satori, que suporta só um subconjunto de CSS: flexbox
// (sem grid), sem classes Tailwind nem CSS custom properties — todo estilo é
// inline, as cores vêm em hex de lib/design-tokens.ts (espelho testado de
// globals.css) e todo elemento com múltiplos filhos precisa de display:flex.
// As fontes (Space Grotesk, IBM Plex Mono) vêm de lib/og-fonts.ts e têm de ser
// passadas ao ImageResponse por quem renderiza este cartão.
//
// O cartão repete o cabeçalho da página que representa, para o link
// compartilhado e a página aberta serem reconhecidamente a mesma coisa:
//   - artigo → a cena do artigo (lib/art.ts) na coluna da direita, o eixo com
//     a sua forma Bauhaus no sobretítulo, o monograma do autor no rodapé;
//   - marca (home, /en) → a marca central A1 atrás do título, "Next.js" em
//     ciano, como no herói da home;
//   - colofão → o cartaz do herói de /design (três palavras empilhadas, o fio
//     âmbar, o anel e o quadrado de superfície) no lugar do título.
// A arte entra por lib/og-art.ts: o mesmo SVG do site, com o hex do escuro.
//
// Marca e domínio dentro da imagem (§14: o cartão compartilhado carrega a
// autoria mesmo quando copiado). Sem canto arredondado, sem degradê — as
// regras do sistema valem também aqui. O cartão é sempre escuro: o tema claro
// é escolha de quem lê o site, e a prévia do link não sabe quem vai vê-la.
//
// Consumido pelos route handlers de card: app/(pt)/opengraph-image (marca PT),
// app/(en)/en/opengraph-image (marca EN), app/(pt)/blog/[slug]/opengraph-image
// (por artigo) e os dois colofões. Dimensões e alt ficam em /lib/metadata.ts.
// ─────────────────────────────────────────────────────────────────────────────

const MONO = 'IBM Plex Mono'
const DISPLAY = 'Space Grotesk'

/**
 * Opacidade da marca central no cartão. O site usa --mark-central-opacity
 * (0,07) atrás de um herói de 1280px; a prévia do link aparece a ~500px e
 * recomprimida, onde 0,07 some. O dobro mantém a marca como fundo — o título
 * segue >12:1 sobre ela — sem virar ilustração.
 */
const OG_MARK_OPACITY = 0.14

const TONE_HEX: Record<CategoryTone, string> = {
  primary: colors.primary,
  accent: colors.accent,
  'shape-danger': colors.danger,
  'shape-reference': colors.reference,
}

export type OgArt =
  | { kind: 'scene'; id: SceneId }
  | { kind: 'mark'; variant: CentralVariant }
  /** Herói de /design. As três palavras SÃO o título, que não se repete. */
  | { kind: 'poster'; words: readonly [string, string, string] }

export interface OgCardProps {
  /** Rótulo de instrumento no canto superior (ex.: "Artigo", "Colofão"). */
  badge?: string
  /** Sobretítulo em ciano. Com `shape`, leva a forma do eixo; sem, o fio da home. */
  kicker: string
  shape?: { shape: CategoryShape; tone: CategoryTone }
  title: string
  /** Fim do título em ciano, como "Next.js" no herói da home. */
  highlight?: string
  subtitle?: string
  /** Metadado em mono ao lado do autor (ex.: "2026-07-26 · 10 min"). */
  meta?: string
  art: OgArt
}

/** Iniciais do autor, como o monograma do cabeçalho do artigo. */
function monogram(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/** Rótulo mono em caixa alta — o `.eyebrow` do site. */
function label(fontSize: number, color: string) {
  return { fontSize, letterSpacing: 3, textTransform: 'uppercase', color } as const
}

function KickerMark({ shape }: Pick<OgCardProps, 'shape'>) {
  if (!shape) return <div style={{ width: 48, height: 3, backgroundColor: colors.primary }} />
  const fill = TONE_HEX[shape.tone]
  // Um filho só: o Satori serializa o <svg> e não aceita `false` entre os filhos.
  const form =
    shape.shape === 'circle' ? (
      <circle cx="9" cy="9" r="9" fill={fill} />
    ) : shape.shape === 'square' ? (
      <rect x="0" y="0" width="18" height="18" fill={fill} />
    ) : (
      <polygon points="9,0 18,18 0,18" fill={fill} />
    )
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      {form}
    </svg>
  )
}

/** As quatro formas primárias do sistema, na ordem do manifesto. */
function Shapes({ scale = 1 }: { scale?: number }) {
  return (
    <svg width={176 * scale} height={40 * scale} viewBox="0 0 176 40">
      <circle cx="20" cy="20" r="20" fill={colors.primary} />
      <rect x="52" y="0" width="40" height="40" fill={colors.accent} />
      <polygon points="126,0 148,40 104,40" fill={colors.danger} />
      <rect x="160" y="0" width="16" height="40" fill={colors.reference} />
    </svg>
  )
}

/** Fundo do herói de /design: anel e quadrado em superfície, atrás do cartaz. */
function PosterBackdrop() {
  return (
    <svg width="560" height="630" viewBox="0 0 560 630" style={{ position: 'absolute', right: 0, top: 0 }}>
      <circle cx="400" cy="250" r="188" fill="none" stroke={colors.surface} strokeWidth="44" />
      <rect x="150" y="330" width="170" height="170" fill={colors.surface} />
    </svg>
  )
}

/** As três palavras do herói de /design, com o fio âmbar depois da segunda. */
function PosterWords({ words }: { words: readonly [string, string, string] }) {
  const line = { fontFamily: DISPLAY, fontSize: 96, fontWeight: 700, lineHeight: 0.86, letterSpacing: -4 }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', textTransform: 'uppercase' }}>
      <div style={{ ...line, color: colors.foreground }}>{words[0]}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ ...line, color: colors.primary }}>{words[1]}</div>
        <div style={{ flexGrow: 1, height: 16, backgroundColor: colors.accent }} />
      </div>
      <div style={{ ...line, color: colors.ruleStrong }}>{words[2]}</div>
    </div>
  )
}

function titleSize(title: string, wide: boolean): number {
  const n = title.length
  if (wide) return n > 48 ? 68 : 76
  if (n > 52) return 54
  if (n > 36) return 60
  return 68
}

export function OgCard({ badge, kicker, shape, title, highlight, subtitle, meta, art }: OgCardProps) {
  const domain = new URL(site.url).host
  const wide = art.kind !== 'scene'
  const size = titleSize(highlight ? `${title} ${highlight}` : title, wide)
  // Palavra por palavra: o Satori quebra a linha entre itens flex, e o espaço
  // vira `columnGap` — uma margem no destaque viraria recuo quando ele desce.
  const words = [
    ...title.split(/\s+/).map((w) => ({ w, color: colors.foreground })),
    ...(highlight ?? '').split(/\s+/).filter(Boolean).map((w) => ({ w, color: colors.primary })),
  ]

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: colors.background,
        fontFamily: MONO,
      }}
    >
      {/* Fundo antes no DOM = pintado por baixo. A marca central sangra pela
          direita como no herói da home; o cartaz traz o anel e o quadrado. */}
      {art.kind === 'mark' && (
        // eslint-disable-next-line @next/next/no-img-element -- Satori, não HTML
        <img
          src={markDataUri(art.variant, OG_MARK_OPACITY)}
          width={760}
          height={760}
          style={{ position: 'absolute', right: -170, top: -70 }}
          alt=""
        />
      )}
      {art.kind === 'poster' && <PosterBackdrop />}

      {/* Faixa de topo: ciano, âmbar e vermelho em pesos desiguais (De Stijl). */}
      <div style={{ display: 'flex', height: 10 }}>
        <div style={{ flexGrow: 1, backgroundColor: colors.primary }} />
        <div style={{ width: 220, backgroundColor: colors.accent }} />
        <div style={{ width: 110, backgroundColor: colors.danger }} />
      </div>

      <div
        style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px 72px 44px',
        }}
      >
        {/* Barra da marca — a mesma do header do site. */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, color: colors.foreground }}>
              SEO TÉCNICO
            </div>
            <div style={{ fontSize: 18, letterSpacing: 3, color: colors.primary }}>.DEV.BR</div>
          </div>
          {badge && <div style={label(18, colors.label)}>{badge}</div>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <KickerMark shape={shape} />
              <div style={label(20, colors.primary)}>{kicker}</div>
            </div>

            {art.kind === 'poster' ? (
              <PosterWords words={art.words} />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  columnGap: Math.round(size * 0.24),
                  fontFamily: DISPLAY,
                  fontSize: size,
                  fontWeight: 700,
                  lineHeight: 1.02,
                  letterSpacing: -2,
                  // Nada de `undefined` em style: o Satori chama .trim() no valor.
                  ...(wide && { maxWidth: 960 }),
                }}
              >
                {words.map(({ w, color }, i) => (
                  <span key={i} style={{ color }}>
                    {w}
                  </span>
                ))}
              </div>
            )}

            {subtitle && (
              <div style={{ fontSize: 23, lineHeight: 1.45, color: colors.muted, ...(wide && { maxWidth: 820 }) }}>
                {subtitle}
              </div>
            )}
          </div>

          {art.kind === 'scene' && (
            // eslint-disable-next-line @next/next/no-img-element -- Satori, não HTML
            <img src={sceneDataUri(art.id)} width={420} height={327} alt="" />
          )}
        </div>

        {/* Faixa do autor — a do cabeçalho do artigo, com o domínio no lugar do eixo. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${colors.ruleStrong}`,
            paddingTop: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                color: colors.onPrimary,
                fontFamily: DISPLAY,
                fontSize: 19,
                fontWeight: 700,
              }}
            >
              {monogram(site.author.name)}
            </div>
            <div style={{ fontSize: 20, color: colors.foreground }}>{site.author.name}</div>
            {meta && <div style={{ ...label(17, colors.label), letterSpacing: 1.5, marginLeft: 12 }}>{meta}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ fontSize: 20, color: colors.primary }}>{domain}</div>
            <Shapes scale={0.75} />
          </div>
        </div>
      </div>
    </div>
  )
}
