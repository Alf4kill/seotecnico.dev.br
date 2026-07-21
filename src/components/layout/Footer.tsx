import Link from 'next/link'
import { site } from '@/lib/site'

// Ícones de marca inline (lucide-react removeu os brand icons)
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
)

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0Z" />
  </svg>
)

const footerLinks = [
  { label: 'Guia de SEO técnico',      href: '/guia/seo-tecnico-nextjs' },
  { label: 'Blog',                     href: '/blog' },
  { label: 'Ferramentas',              href: '/ferramentas' },
  { label: 'Sobre',                    href: '/sobre' },
  { label: 'Política de privacidade',  href: '/politica-de-privacidade' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray bg-surface">
      <div className="container py-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">

        {/* ── Marca + byline ────────────────────────────────────── */}
        <div className="max-w-sm">
          <Link
            href="/"
            className="text-lg font-bold text-foreground"
            title={`${site.name} — página inicial`}
          >
            SEO <span className="text-primary">Técnico</span>
          </Link>
          <p className="mt-3 text-sm text-muted leading-6">
            Laboratório vivo de SEO técnico para desenvolvedores Next.js —
            por {site.author.name}, {site.author.jobTitle}.
          </p>

          {(site.author.github || site.author.linkedin) && (
            <div className="mt-4 flex items-center gap-3">
              {site.author.github && (
                <a
                  href={site.author.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  title="GitHub"
                  className="text-muted hover:text-primary transition-colors"
                >
                  <GithubIcon />
                </a>
              )}
              {site.author.linkedin && (
                <a
                  href={site.author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                  className="text-muted hover:text-primary transition-colors"
                >
                  <LinkedinIcon />
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Navegação ─────────────────────────────────────────── */}
        <nav aria-label="Navegação do rodapé" className="flex flex-col gap-2">
          {footerLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-foreground hover:text-primary transition-colors"
              title={label}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Copyright ───────────────────────────────────────────── */}
      <div className="border-t border-gray">
        <div className="container py-4">
          <p className="text-xs text-muted">
            © {year} {site.name} — projeto pessoal e laboratório público de SEO
            técnico. Conteúdo e imagens © {site.author.name}, todos os direitos
            reservados; código-fonte sob licença MIT.
          </p>
        </div>
      </div>
    </footer>
  )
}
