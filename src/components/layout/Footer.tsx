import Link from 'next/link'
import type { Lang } from '@/lib/hreflang'
import { site } from '@/lib/site'

interface FooterLink {
  label: string
  href: string
  /** Idioma do destino, quando difere do rodapé — vira `hrefLang` + `lang`. */
  lang?: Lang
}

interface FooterColumn {
  title: string
  links: FooterLink[]
}

interface Copy {
  home: string
  homeLabel: string
  byline: string
  navLabel: string
  columns: FooterColumn[]
  copyright: (year: number) => string
}

const NETWORK: FooterLink[] = [
  ...(site.author.github ? [{ label: 'GitHub', href: site.author.github }] : []),
  ...(site.author.linkedin ? [{ label: 'LinkedIn', href: site.author.linkedin }] : []),
]

const COPY: Record<Lang, Copy> = {
  'pt-BR': {
    home: '/',
    homeLabel: `${site.name} — página inicial`,
    byline: `${site.author.name} · ${site.author.jobTitle}`,
    navLabel: 'Navegação do rodapé',
    columns: [
      {
        title: 'Conteúdo',
        links: [
          { label: 'Guia de SEO técnico', href: '/guia/seo-tecnico-nextjs' },
          { label: 'Blog',                href: '/blog' },
          { label: 'Ferramentas',         href: '/ferramentas' },
        ],
      },
      {
        title: 'Projeto',
        links: [
          { label: 'Sobre',                   href: '/sobre' },
          { label: 'Política de privacidade', href: '/politica-de-privacidade' },
        ],
      },
      { title: 'Rede', links: [...NETWORK, { label: 'RSS', href: '/feed.xml' }] },
    ],
    copyright: (year) =>
      `© ${year} ${site.name} — projeto pessoal e laboratório público de SEO técnico. Conteúdo e imagens © ${site.author.name}, todos os direitos reservados; código-fonte sob licença MIT.`,
  },
  en: {
    home: '/en',
    homeLabel: `${site.name} — home`,
    byline: `${site.author.name} · ${site.author.jobTitle}`,
    navLabel: 'Footer navigation',
    // A política de privacidade e o feed só existem em português. Os links
    // dizem isso em vez de fingir o contrário: um rótulo em inglês levando a
    // uma página em português, sem aviso, é o despejo silencioso que esta
    // moldura evita.
    columns: [
      {
        title: 'Content',
        links: [
          { label: 'Technical SEO guide', href: '/en/guide/technical-seo-nextjs' },
          { label: 'Site in Portuguese',  href: '/', lang: 'pt-BR' },
        ],
      },
      {
        title: 'Project',
        links: [
          { label: 'About',                          href: '/en/about' },
          { label: 'Privacy policy (in Portuguese)', href: '/politica-de-privacidade', lang: 'pt-BR' },
        ],
      },
      { title: 'Network', links: NETWORK },
    ],
    copyright: (year) =>
      `© ${year} ${site.name} — personal project and public technical SEO lab. Content and images © ${site.author.name}, all rights reserved; source code under the MIT License.`,
  },
}

const LINK_CLASS = 'text-sm text-muted transition-colors hover:text-primary'

function FooterAnchor({ label, href, lang }: FooterLink) {
  // Rede social e feed: âncora comum. Página do site: <Link>, sem prefetch
  // quando o destino é o outro root layout (ver LanguageSwitch).
  if (!href.startsWith('/') || href.endsWith('.xml')) {
    const external = !href.startsWith('/')
    return (
      <a
        href={href}
        className={LINK_CLASS}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {label}
      </a>
    )
  }
  return (
    <Link
      href={href}
      hrefLang={lang}
      lang={lang}
      prefetch={lang ? false : undefined}
      className={LINK_CLASS}
      title={label}
    >
      {label}
    </Link>
  )
}

export function Footer({ lang }: { lang: Lang }) {
  const year = new Date().getFullYear()
  const copy = COPY[lang]

  return (
    <footer className="mt-14 border-t-[3px] border-primary">
      <div className="container-xl flex flex-col gap-10 py-10 md:flex-row md:items-start md:justify-between">

        {/* ── Marca + byline ────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5">
          <Link
            href={copy.home}
            className="font-display text-[1.0625rem] font-bold uppercase text-foreground"
            title={copy.homeLabel}
          >
            {site.name}
          </Link>
          <p className="text-sm text-muted">{copy.byline}</p>
        </div>

        {/* ── Colunas ───────────────────────────────────────────── */}
        <nav aria-label={copy.navLabel} className="grid grid-cols-2 gap-x-14 gap-y-8 sm:grid-cols-3">
          {copy.columns.map(({ title, links }) => (
            <div key={title} className="flex flex-col gap-2.5">
              <p className="eyebrow text-[0.625rem]">{title}</p>
              {links.map((link) => (
                <FooterAnchor key={link.href} {...link} />
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* ── Copyright (divisão de licenças, §14) ─────────────────── */}
      <div className="border-t border-gray">
        <div className="container-xl py-5">
          <p className="font-mono text-xs leading-6 text-label">{copy.copyright(year)}</p>
        </div>
      </div>
    </footer>
  )
}
