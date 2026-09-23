import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Lang } from '@/lib/hreflang'
import { site } from '@/lib/site'
import { colors, contrastRatio, lightColors, type ColorToken } from '@/lib/design-tokens'
import { CATEGORIES } from '@/lib/categories'
import { ButtonLink, buttonClasses } from '@/components/ui/Button'
import { CategoryChip } from '@/components/ui/CategoryMark'
import { InstrumentFrame, InstrumentStrip } from '@/components/ui/InstrumentFrame'
import { MANIFESTO_COPY, MANIFESTO_REVISED } from '@/components/design/manifesto-copy'
import { ART_TITLES, SCENES_BY_CATEGORY, TOOL_EMBLEMS } from '@/lib/art'
import { Emblem, Scene } from '@/components/art/Art'
import { CentralMark, CornerMark } from '@/components/art/Marks'

// ─────────────────────────────────────────────────────────────────────────────
// A página especial do design — o colofão (prancha "Manifesto do design").
// Nas outras telas o estilo é contido; aqui ele aparece em tamanho de cartaz.
//
// Server component puro: nenhuma ilha de cliente. As composições são div e SVG
// inline com as classes do sistema (fill-*, bg-*), nunca hex — o mesmo
// guard (design-rules.test.ts) vale para esta página.
//
// Três partes são dado, não ilustração: as tabelas de contraste (uma por tema)
// são calculadas no build a partir de lib/design-tokens.ts, os marcadores de
// categoria são os de lib/categories.ts e a galeria de arte lê lib/art.ts.
// A galeria é a única página com mais de uma cena: é o catálogo delas.
// ─────────────────────────────────────────────────────────────────────────────

const REPO_DOC = `${site.repository}/blob/main/docs/design-system.md`
const REPO_FILE = (path: string) => `${site.repository}/blob/main/${path}`

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="eyebrow text-primary">{children}</p>
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="font-display text-[clamp(1.875rem,1.2rem+2.4vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.025em] text-foreground"
    >
      {children}
    </h2>
  )
}

/**
 * Tabela de contraste calculada no build — a medição original desta página.
 * Uma por tema. No claro não há linha de rótulo-sobre-código (o bloco de código
 * é ilha escura) nem de vermelho-forma (no claro forma e texto são o mesmo).
 */
function ContrastTable({ lang, theme }: { lang: Lang; theme: 'dark' | 'light' }) {
  const copy = MANIFESTO_COPY[lang].color
  const palette = theme === 'dark' ? colors : lightColors
  const rows: ColorToken[] =
    theme === 'dark'
      ? ['foreground', 'body', 'muted', 'label', 'labelOnCode', 'primary', 'accent', 'dangerText', 'danger']
      : ['foreground', 'body', 'muted', 'label', 'primary', 'accent', 'dangerText']
  const surfaces = [palette.background, palette.surface, palette.surface2]
  const headers = theme === 'dark' ? copy.headers : copy.lightHeaders
  const fmt = (n: number) => n.toFixed(2).replace('.', lang === 'en' ? '.' : ',')

  return (
    <figure className="flex flex-col gap-4">
      <p className="font-display text-xl font-bold text-foreground">{theme === 'dark' ? copy.tableTitle : copy.lightTitle}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} className="eyebrow border-b-2 border-primary py-3 pr-4 text-left font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((token) => (
              <tr key={token}>
                <td className="border-b border-gray py-3 pr-4">
                  <span className="flex items-center gap-3">
                    <span aria-hidden="true" className="h-4 w-4 shrink-0 border border-gray-strong" style={{ background: palette[token] }} />
                    <span className="font-mono text-xs text-foreground">{palette[token]}</span>
                  </span>
                </td>
                <td className="border-b border-gray py-3 pr-4 text-muted">{copy.roles[token]}</td>
                {surfaces.map((bg) => {
                  const ratio = contrastRatio(palette[token], bg)
                  const pass = ratio >= 4.5
                  return (
                    <td key={bg} className={`border-b border-gray py-3 pr-4 font-mono text-xs ${pass ? 'text-body' : 'text-danger'}`}>
                      {fmt(ratio)}:1{!pass && <span className="uppercase tracking-[0.1em]"> · {copy.fails}</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="max-w-[48rem] text-sm leading-relaxed text-muted">
        {theme === 'dark' ? copy.tableCaption : copy.lightCaption}
      </figcaption>
    </figure>
  )
}

/**
 * Uma mensagem em morse, sem legenda de propósito — fica para quem quiser
 * decodificar. Traço = barra longa, ponto = quadrado; a última letra em âmbar.
 * O nome acessível transcreve os sinais em vez de entregar a resposta: quem
 * usa leitor de tela recebe o mesmo enigma que quem vê.
 */
const MORSE = ['--.', '---', '---', '-..', '-.', '..', '--.', '....', '-']

function Morse({ label }: { label: string }) {
  return (
    <div role="img" aria-label={label} className="flex flex-wrap items-center gap-5">
      {MORSE.map((letter, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {[...letter].map((mark, j) => (
            <span
              key={j}
              className={`block h-1.5 ${mark === '-' ? 'w-6.5' : 'w-1.5'} ${i === MORSE.length - 1 ? 'bg-accent' : 'bg-primary'}`}
            />
          ))}
        </span>
      ))}
    </div>
  )
}

function Eclipse({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label={label}>
      <circle cx="16" cy="20" r="1.4" className="fill-gray-strong" />
      <circle cx="104" cy="28" r="1.2" className="fill-gray-strong" />
      <circle cx="22" cy="100" r="1.2" className="fill-gray-strong" />
      <circle cx="52" cy="54" r="40" strokeWidth="3" className="fill-background stroke-primary" />
      <circle cx="61" cy="63" r="40" className="fill-background" />
      <circle cx="92" cy="84" r="20" strokeWidth="1.5" className="fill-surface-alt stroke-gray" />
      <path d="M56 38 L59 55 L76 58 L59 61 L56 78 L53 61 L36 58 L53 55 Z" className="fill-foreground" />
      <rect x="58" y="0" width="2" height="8" className="fill-gray-strong" />
      <rect x="58" y="112" width="2" height="8" className="fill-gray-strong" />
      <rect x="0" y="58" width="8" height="2" className="fill-accent" />
      <rect x="112" y="58" width="8" height="2" className="fill-gray-strong" />
    </svg>
  )
}

/** ST-01: só círculo, quadrado e triângulo, nas cores do sistema. */
function Robot({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 420 560" className="h-auto w-full max-w-[22.5rem]" role="img" aria-label={label}>
      <rect x="96" y="512" width="228" height="14" className="fill-gray-strong" />
      <rect x="140" y="470" width="40" height="42" strokeWidth="2" className="fill-surface-2 stroke-gray-strong" />
      <rect x="240" y="470" width="40" height="42" strokeWidth="2" className="fill-surface-2 stroke-gray-strong" />
      <rect x="110" y="268" width="200" height="204" strokeWidth="2" className="fill-surface stroke-gray-strong" />
      <rect x="110" y="268" width="200" height="10" className="fill-primary" />
      <rect x="134" y="298" width="152" height="58" strokeWidth="2" className="fill-background stroke-gray" />
      <rect x="146" y="312" width="86" height="6" className="fill-gray-strong" />
      <rect x="146" y="326" width="128" height="6" className="fill-primary" />
      <rect x="146" y="340" width="60" height="6" className="fill-gray-strong" />
      <rect x="134" y="374" width="52" height="52" className="fill-shape-danger" />
      <rect x="196" y="374" width="52" height="52" className="fill-shape-reference" />
      <circle cx="284" cy="400" r="26" className="fill-accent" />
      <rect x="134" y="440" width="152" height="4" className="fill-gray" />
      <circle cx="110" cy="290" r="26" strokeWidth="3" className="fill-background stroke-primary" />
      <circle cx="310" cy="290" r="26" strokeWidth="3" className="fill-background stroke-primary" />
      <rect x="62" y="304" width="34" height="132" strokeWidth="2" className="fill-surface-2 stroke-gray-strong" />
      <rect x="324" y="304" width="34" height="132" strokeWidth="2" className="fill-surface-2 stroke-gray-strong" />
      <rect x="62" y="436" width="34" height="18" className="fill-accent" />
      <rect x="324" y="436" width="34" height="18" className="fill-primary" />
      <rect x="192" y="240" width="36" height="30" className="fill-gray-strong" />
      <rect x="112" y="104" width="196" height="138" strokeWidth="3" className="fill-surface stroke-primary" />
      <path d="M112 104 A 98 69 0 0 1 210 104 Z" className="fill-surface-2" />
      <rect x="134" y="140" width="152" height="52" className="fill-background" />
      <rect x="134" y="160" width="152" height="8" className="fill-primary" />
      <circle cx="172" cy="166" r="13" className="fill-accent" />
      <rect x="230" y="156" width="42" height="16" className="fill-primary" />
      {[150, 166, 182, 198, 214].map((x) => (
        <rect key={x} x={x} y="208" width="10" height="14" className="fill-gray-strong" />
      ))}
      <polygon points="210,42 232,104 188,104" className="fill-accent" />
      <circle cx="210" cy="34" r="9" className="fill-primary" />
      <rect x="30" y="104" width="14" height="2" className="fill-gray-strong" />
      <rect x="30" y="170" width="24" height="2" className="fill-primary" />
      <rect x="30" y="236" width="14" height="2" className="fill-gray-strong" />
      <rect x="376" y="104" width="14" height="2" className="fill-gray-strong" />
      <rect x="366" y="170" width="24" height="2" className="fill-accent" />
      <rect x="376" y="236" width="14" height="2" className="fill-gray-strong" />
    </svg>
  )
}

/** Composições dos quatro cartões de "Linhagem", uma por escola. */
function LineageArt({ index }: { index: number }) {
  if (index === 0)
    return (
      <div aria-hidden="true" className="flex h-44 items-center justify-center gap-6 border-b border-gray bg-surface-alt">
        <span className="h-20 w-20 rounded-full bg-shape-danger sm:h-26 sm:w-26" />
        <span className="h-20 w-20 bg-accent sm:h-26 sm:w-26" />
        <span className="h-0 w-0 border-x-[46px] border-b-[80px] border-x-transparent border-b-shape-reference sm:border-x-[58px] sm:border-b-[104px]" />
      </div>
    )
  if (index === 1)
    return (
      <div aria-hidden="true" className="grid h-44 grid-cols-[2fr_1fr_1fr] grid-rows-3 gap-1.5 border-b border-gray bg-background p-1.5">
        <span className="row-span-2 bg-shape-danger" />
        <span className="col-span-2 bg-surface-2" />
        <span className="row-span-2 bg-shape-reference" />
        <span className="bg-surface-2" />
        <span className="bg-surface-2" />
        <span className="bg-accent" />
      </div>
    )
  if (index === 2)
    return (
      <div aria-hidden="true" className="grid h-44 grid-cols-12 content-center gap-x-3 gap-y-2.5 border-b border-gray bg-surface-alt px-7">
        <span className="col-span-12 h-[3px] bg-primary" />
        <span className="col-span-4 flex flex-col gap-1.5">
          <span className="h-2 bg-gray-strong" />
          <span className="h-2 bg-gray" />
          <span className="h-2 w-[70%] bg-gray" />
        </span>
        <span className="col-span-8 flex flex-col gap-1.5">
          <span className="h-2 bg-gray-strong" />
          <span className="h-2 bg-gray-strong" />
          <span className="h-2 bg-gray" />
          <span className="h-2 w-[55%] bg-gray" />
        </span>
        <span className="col-span-12 h-px bg-gray" />
        {['12 col', 'gut 24', 'flush', 'left'].map((t, i) => (
          <span key={t} className={`col-span-3 font-mono text-[0.625rem] uppercase tracking-[0.16em] ${i === 3 ? 'text-accent' : 'text-label'}`}>
            {t}
          </span>
        ))}
      </div>
    )
  return (
    <div aria-hidden="true" className="flex h-44 flex-col justify-end gap-2.5 border-b border-gray bg-surface-alt px-7 pb-6">
      <span className="flex justify-between font-mono text-[0.625rem] uppercase tracking-[0.14em] text-label">
        <span>Objetividade</span>
        <span>Neue Grafik</span>
      </span>
      <span className="flex items-baseline gap-4 border-t-[3px] border-foreground pt-2.5 font-display text-7xl font-bold leading-[0.82] tracking-[-0.05em]">
        <span className="text-foreground">01</span>
        <span className="text-primary">02</span>
        <span className="text-gray-strong">03</span>
      </span>
    </div>
  )
}

/** Uma moldura de galeria: a obra sobre a superfície, a legenda em mono. */
function Plate({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <figure className="flex flex-col border border-gray bg-surface">
      <div className="relative flex items-center justify-center overflow-hidden border-b border-gray bg-background p-4">
        {children}
      </div>
      <figcaption className="eyebrow px-4 py-3 text-[0.625rem]">{caption}</figcaption>
    </figure>
  )
}

/** 07 · Arte — o catálogo das cenas, emblemas e marcas, lido de lib/art.ts. */
function ArtGallery({ lang, className }: { lang: Lang; className: string }) {
  const c = MANIFESTO_COPY[lang].art
  const marks = [
    <CentralMark key="a1" variant="beam" className="!static !opacity-40 w-40" />,
    <CentralMark key="a2" variant="axonometric" className="!static !opacity-40 w-40" />,
    <CentralMark key="a3" variant="arcs" className="!static !opacity-40 w-40" />,
    <CornerMark key="b1" variant="arc" className="!static !opacity-40 w-32" />,
    <CornerMark key="b2" variant="dots" className="!static !opacity-40 w-36" />,
    <CornerMark key="b5" variant="crosshair" className="!static !opacity-40 w-28" />,
  ]

  return (
    <section aria-labelledby="arte" className={`${className} flex flex-col gap-12`}>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3"><SectionLabel>{c.label}</SectionLabel></div>
        <div className="flex flex-col gap-5.5 lg:col-span-9">
          <SectionTitle id="arte">{c.title}</SectionTitle>
          {c.paragraphs.map((p) => (
            <p key={p.slice(0, 20)} className="max-w-[51rem] text-lg leading-[1.75] text-body">{p}</p>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <h3 className="font-display text-xl font-bold text-foreground">{c.scenesTitle}</h3>
        {CATEGORIES.map(({ slug }) => (
          <div key={slug} className="flex flex-col gap-3">
            <CategoryChip category={slug} lang={lang} />
            <div className="grid gap-4 sm:grid-cols-3">
              {SCENES_BY_CATEGORY[slug].map((id) => (
                <Plate key={id} caption={ART_TITLES[id][lang]}>
                  <Scene id={id} className="w-full max-w-[22.5rem]" />
                </Plate>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-display text-xl font-bold text-foreground">{c.emblemsTitle}</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(Object.entries(TOOL_EMBLEMS) as [keyof typeof TOOL_EMBLEMS, (typeof TOOL_EMBLEMS)[keyof typeof TOOL_EMBLEMS]][]).map(
            ([tool, id]) => (
              <Plate key={id} caption={`${ART_TITLES[id][lang]} · ${c.emblemFor[tool]}`}>
                <Emblem id={id} className="h-20 w-20" />
              </Plate>
            )
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-display text-xl font-bold text-foreground">{c.marksTitle}</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {marks.map((mark, i) => (
            <Plate key={c.marks[i]} caption={c.marks[i]}>
              <span className="flex h-40 items-center justify-center">{mark}</span>
            </Plate>
          ))}
        </div>
        <p className="font-mono text-xs text-label">{c.marksNote}</p>
      </div>
    </section>
  )
}

export function Manifesto({ lang }: { lang: Lang }) {
  const c = MANIFESTO_COPY[lang]
  const section = 'container-xl border-b border-gray py-14 lg:py-18'

  return (
    <article>
      <div aria-hidden="true" className="hazard-stripe" />

      {/* ── Hero em tamanho de cartaz ─────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-gray">
        <div aria-hidden="true" className="absolute -right-20 top-10 hidden h-105 w-105 rounded-full border-[44px] border-surface lg:block" />
        <div aria-hidden="true" className="absolute right-75 top-65 hidden h-45 w-45 bg-surface lg:block" />
        <div className="container-xl relative flex flex-col gap-2 py-14 lg:py-16">
          <p className="eyebrow flex items-center gap-4 pb-5 font-semibold text-primary">
            <span aria-hidden="true" className="h-1 w-16 bg-primary" />
            {c.eyebrow}
          </p>
          <h1 className="flex flex-col font-display text-[clamp(3.75rem,0.9rem+11.5vw,11rem)] font-bold uppercase leading-[0.84] tracking-[-0.045em]">
            <span className="text-foreground">{c.heroWords[0]}</span>
            <span className="flex items-baseline gap-6 text-primary">
              {c.heroWords[1]}
              <span aria-hidden="true" className="hidden h-[0.14em] flex-1 bg-accent md:block" />
            </span>
            <span className="text-gray-strong">{c.heroWords[2]}</span>
          </h1>
          <div className="grid gap-8 pt-11 lg:grid-cols-12 lg:gap-6">
            <p className="text-lg leading-relaxed text-foreground lg:col-span-6 lg:text-[1.3125rem]">{c.lead}</p>
            <div className="flex flex-col gap-2.5 border-t-2 border-accent pt-3.5 lg:col-span-3">
              <p className="eyebrow text-[0.625rem]">{c.schoolsLabel}</p>
              <ul className="font-mono text-[0.8125rem] leading-[1.9] text-foreground">
                {c.schools.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div className="flex flex-col gap-2.5 border-t-2 border-primary pt-3.5 lg:col-span-3">
              <p className="eyebrow text-[0.625rem]">{c.atmosphereLabel}</p>
              <ul className="font-mono text-[0.8125rem] leading-[1.9] text-foreground">
                {c.atmosphere.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* ── 01 Tese ─────────────────────────────────────────────── */}
      <section aria-labelledby="tese" className={`${section} grid gap-6 lg:grid-cols-12`}>
        <div className="lg:col-span-3"><SectionLabel>{c.thesis.label}</SectionLabel></div>
        <div className="flex flex-col gap-5.5 lg:col-span-9">
          <SectionTitle id="tese">{c.thesis.title}</SectionTitle>
          {c.thesis.paragraphs.map((p) => (
            <p key={p.slice(0, 20)} className="max-w-[51rem] text-lg leading-[1.75] text-body">{p}</p>
          ))}
        </div>
      </section>

      {/* ── 02 Linhagem ─────────────────────────────────────────── */}
      <section aria-labelledby="linhagem" className={section}>
        <div className="flex flex-col gap-3 pb-8 md:flex-row md:items-baseline md:gap-5">
          <SectionLabel>{c.lineage.label}</SectionLabel>
          <SectionTitle id="linhagem">{c.lineage.title}</SectionTitle>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {c.lineage.cards.map((card, i) => (
            <div key={card.school} className="flex flex-col border border-gray bg-surface">
              <LineageArt index={i} />
              <div className="flex flex-1 flex-col gap-3.5 p-7">
                <p className="eyebrow flex justify-between gap-4">
                  <span className="text-primary">{card.school}</span>
                  <span>{card.years}</span>
                </p>
                <h3 className="font-display text-2xl font-bold leading-tight text-foreground">{card.title}</h3>
                <p className="flex-1 text-base leading-[1.7] text-muted">{card.text}</p>
                <p className="border-t border-gray pt-3 font-mono text-xs uppercase leading-[1.8] text-primary">
                  {c.lineage.where} {card.where}
                </p>
              </div>
            </div>
          ))}
        </div>
        <ul className="flex flex-wrap gap-3 pt-8">
          {CATEGORIES.map(({ slug }) => (
            <li key={slug}><CategoryChip category={slug} lang={lang} /></li>
          ))}
        </ul>
      </section>

      {/* ── 03 Cor ──────────────────────────────────────────────── */}
      <section aria-labelledby="cor" className={`${section} grid gap-6 lg:grid-cols-12`}>
        <div className="lg:col-span-3"><SectionLabel>{c.color.label}</SectionLabel></div>
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-9">
          <SectionTitle id="cor">{c.color.title}</SectionTitle>
          <p className="max-w-[51rem] text-lg leading-[1.75] text-body">{c.color.text}</p>
          <figure className="flex flex-col gap-3">
            <div aria-hidden="true" className="flex h-30">
              <div className="flex flex-[3] items-end border border-gray bg-background p-3">
                <span className="font-mono text-[0.6875rem] text-label">78%</span>
              </div>
              <div className="flex flex-1 items-end bg-surface p-3">
                <span className="font-mono text-[0.6875rem] text-label">16%</span>
              </div>
              <div className="flex w-17.5 items-end bg-primary p-3">
                <span className="font-mono text-[0.6875rem] text-on-primary">4%</span>
              </div>
              <div className="flex w-10 items-end bg-accent p-2">
                <span className="font-mono text-[0.6875rem] text-on-primary">2%</span>
              </div>
            </div>
            <figcaption className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-label">
              <span>{c.color.areaCaption}: 78 · 16 · 4 · 2%</span>
              <span className="text-accent">{c.color.areaNote}</span>
            </figcaption>
          </figure>
          <ContrastTable lang={lang} theme="dark" />
          <ContrastTable lang={lang} theme="light" />
        </div>
      </section>

      {/* ── 04 Atmosfera ────────────────────────────────────────── */}
      <section aria-labelledby="atmosfera" className="relative overflow-hidden border-b border-gray">
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-accent" />
        <div aria-hidden="true" className="absolute right-20 top-16 hidden h-65 w-65 rounded-full border-2 border-gray xl:block" />
        <div aria-hidden="true" className="absolute right-35 top-31 hidden h-35 w-35 rounded-full border-2 border-gray-strong xl:block" />
        {/* No desktop largo o eclipse fica dentro das órbitas, como na prancha;
            abaixo disso entra no fluxo, na coluna da direita. Um só é exibido
            por vez (display:none tira o outro da árvore de acessibilidade). */}
        <div className="absolute right-37.5 top-33.5 hidden xl:block">
          <Eclipse label={c.atmosphereSection.eclipseAria} />
        </div>
        <div className="container-xl relative grid gap-6 py-16 lg:grid-cols-12">
          <div className="lg:col-span-3"><SectionLabel>{c.atmosphereSection.label}</SectionLabel></div>
          <div className="flex flex-col gap-5.5 lg:col-span-7">
            <SectionTitle id="atmosfera">
              {c.atmosphereSection.title[0]}
              <em className="text-accent">{c.atmosphereSection.title[1]}</em>
            </SectionTitle>
            {c.atmosphereSection.paragraphs.map((p) => (
              <p key={p.slice(0, 20)} className="max-w-[47.5rem] text-lg leading-[1.75] text-body">{p}</p>
            ))}
            <ul className="flex flex-wrap gap-3 pt-1.5">
              {c.atmosphereSection.tags.map((t) => (
                <li key={t} className="border border-gray-strong px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-3.5 flex flex-col gap-3.5 border-t border-gray pt-5">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-accent">
                {c.atmosphereSection.morseLabel}
              </p>
              <Morse label={c.atmosphereSection.morseAria} />
            </div>
          </div>
          <div className="flex items-start justify-center lg:col-span-2 lg:justify-end xl:hidden">
            <Eclipse label={c.atmosphereSection.eclipseAria} />
          </div>
        </div>
      </section>

      {/* ── 05 Unidade ST-01 ────────────────────────────────────── */}
      <section aria-labelledby="unidade" className="border-b border-gray bg-surface-alt">
        <div className="container-xl py-16">
          <div className="flex flex-col gap-3 pb-9 md:flex-row md:items-baseline md:gap-5">
            <SectionLabel>{c.unit.label}</SectionLabel>
            <SectionTitle id="unidade">{c.unit.title}</SectionTitle>
          </div>
          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="relative flex justify-center border border-gray bg-background px-6 py-10 lg:col-span-5">
              <span aria-hidden="true" className="absolute left-1/2 top-4 -translate-x-1/2 font-mono text-[0.625rem] tracking-[0.2em] text-label">ST‑01</span>
              <Robot label={c.unit.robotAria} />
            </div>
            <div className="flex flex-col gap-5.5 lg:col-span-7">
              <p className="text-xl leading-relaxed text-foreground lg:text-[1.3125rem]">{c.unit.lead}</p>
              {c.unit.paragraphs.map((p) => (
                <p key={p.slice(0, 20)} className="max-w-[44rem] text-lg leading-[1.75] text-body">{p}</p>
              ))}
              <ul className="grid gap-4 pt-1.5 sm:grid-cols-3">
                {c.unit.roles.map(({ label, text }, i) => (
                  <li key={label} className="flex flex-col gap-2 border border-gray bg-background p-4.5">
                    {i === 0 && <span aria-hidden="true" className="h-5 w-5 rounded-full bg-primary" />}
                    {i === 1 && <span aria-hidden="true" className="h-5 w-5 bg-accent" />}
                    {i === 2 && <span aria-hidden="true" className="h-0 w-0 border-x-[11px] border-b-[20px] border-x-transparent border-b-shape-danger" />}
                    <span className="eyebrow text-[0.625rem]">{label}</span>
                    <span className="text-sm leading-normal text-foreground">{text}</span>
                  </li>
                ))}
              </ul>
              <p className="flex flex-wrap gap-x-7 gap-y-2 border-y border-gray py-3.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-label">
                <span>{c.unit.strip[0]}</span>
                <span>{c.unit.strip[1]}</span>
                <span className="text-primary">{c.unit.strip[2]}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 06 Regras ───────────────────────────────────────────── */}
      <section aria-labelledby="regras" className={section}>
        <div className="flex flex-col gap-3 pb-7 md:flex-row md:items-baseline md:gap-5">
          <SectionLabel>{c.rules.label}</SectionLabel>
          <SectionTitle id="regras">{c.rules.title}</SectionTitle>
        </div>
        <ul className="grid border-b border-gray md:grid-cols-2 md:gap-x-14">
          {c.rules.items.map(({ kind, text, check }) => (
            <li key={text} className="flex gap-4.5 border-t border-gray py-4.5">
              <span className={`w-9 shrink-0 font-mono text-xs uppercase ${kind === 'no' ? 'text-danger' : 'text-primary'}`}>
                {kind === 'no' ? c.rules.no : c.rules.yes}
              </span>
              <span className="flex flex-col gap-1.5">
                <span className="text-base leading-normal text-body">{text}</span>
                {check.includes('/') ? (
                  <a href={REPO_FILE(check)} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.6875rem] text-label hover:text-primary">
                    {c.rules.enforced} · {check}
                  </a>
                ) : (
                  <span className="font-mono text-[0.6875rem] text-label">{check}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 07 Arte ─────────────────────────────────────────────── */}
      <ArtGallery lang={lang} className={section} />

      {/* ── 08 Sistema ──────────────────────────────────────────── */}
      <section aria-labelledby="sistema" className={`${section} flex flex-col gap-12`}>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3"><SectionLabel>{c.system.label}</SectionLabel></div>
          <div className="flex flex-col gap-4 lg:col-span-9">
            <SectionTitle id="sistema">{c.system.title}</SectionTitle>
            <p className="max-w-[46rem] text-lg leading-[1.75] text-body">{c.system.text}</p>
          </div>
        </div>

        <div className="flex flex-col">
          <h3 className="pb-4 font-display text-xl font-bold text-foreground">{c.system.typeTitle}</h3>
          {c.system.specimens.map(({ meta, sample, kind }) => (
            <div key={meta} className="grid gap-3 border-t border-gray py-5 md:grid-cols-[13.75rem_minmax(0,1fr)] md:gap-6">
              <p className="eyebrow leading-[1.8]">{meta}</p>
              {kind === 'display' && <p className="font-display text-[clamp(2.25rem,1.3rem+3.2vw,4rem)] font-bold leading-[0.98] tracking-[-0.02em] text-foreground">{sample}</p>}
              {kind === 'section' && <p className="font-display text-[2rem] font-bold leading-[1.15] tracking-[-0.01em] text-foreground">{sample}</p>}
              {kind === 'body' && <p className="max-w-[68ch] text-lg leading-[1.75] text-body">{sample}</p>}
              {kind === 'mono' && <p className="eyebrow text-primary">{sample}</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="font-display text-xl font-bold text-foreground">{c.system.componentsTitle}</h3>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-4 border border-gray bg-surface p-6">
              <span className={buttonClasses('solid')}>{c.system.buttons[0]}</span>
              <span className={buttonClasses('outline')}>{c.system.buttons[1]}</span>
              <span className={buttonClasses('link', 'self-start')}>{c.system.buttons[2]} <span aria-hidden="true">→</span></span>
            </div>
            <InstrumentFrame label={c.system.noteLabel}>
              <p className="text-[0.9375rem] leading-[1.7] text-foreground">{c.system.note}</p>
            </InstrumentFrame>
            <div className="flex flex-col gap-4 border border-gray bg-surface p-6">
              <InstrumentStrip
                items={[
                  { label: lang === 'en' ? 'Source' : 'Fonte', value: 'design-tokens.ts' },
                  { label: lang === 'en' ? 'Tokens' : 'Tokens', value: String(Object.keys(colors).length) },
                  { label: lang === 'en' ? 'Revised' : 'Revisão', value: MANIFESTO_REVISED, tone: 'accent' },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-display text-xl font-bold text-foreground">{c.system.gridTitle}</h3>
          <div aria-hidden="true" className="grid h-24 grid-cols-12 gap-2 md:gap-6">
            {Array.from({ length: 12 }, (_, i) => (
              <span
                key={i}
                className={`border-t-[3px] bg-surface ${i < 3 ? 'border-primary' : i < 10 ? 'border-gray' : 'border-accent'}`}
              />
            ))}
          </div>
          <p className="flex flex-wrap gap-x-10 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-label">
            <span className="text-primary">{c.system.gridLegend[0]}</span>
            <span>{c.system.gridLegend[1]}</span>
            <span className="text-accent">{c.system.gridLegend[2]}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <ButtonLink href={c.cta.blogHref}>{c.cta.blog}</ButtonLink>
          <a href={REPO_DOC} target="_blank" rel="noopener noreferrer" className={buttonClasses('outline')}>
            {c.cta.code} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <div aria-hidden="true" className="hazard-stripe [--stripe:var(--color-primary)]" />
      <p className="container-xl py-6 font-mono text-xs text-label">
        {c.footer} <time dateTime={MANIFESTO_REVISED}>{MANIFESTO_REVISED}</time> ·{' '}
        <Link href={lang === 'en' ? '/en/about' : '/sobre'} className="text-primary hover:text-primary-hover">
          {site.author.name}
        </Link>
      </p>
    </article>
  )
}
