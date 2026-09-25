import { site } from '@/lib/site'
import { buttonClasses } from '@/components/ui/Button'
import type { Lang } from '@/lib/hreflang'

// ─────────────────────────────────────────────────────────────────────────────
// Disponibilidade e contato — fim de /sobre e /en/about.
//
// O site é portfólio (CLAUDE.md §2), e até 2026-09 nenhuma página dizia que o
// autor está disponível nem como falar com ele. Este bloco é essa resposta, no
// mesmo lugar nas duas línguas.
//
// Cada canal vem de `site.author` e só aparece quando o campo existe: email e
// CV ficam vazios até haver um endereço dedicado (§14) e um PDF hospedado fora
// do repositório. Os links externos são medidos pelo `outbound_click` do GTM,
// sem código aqui.
// ─────────────────────────────────────────────────────────────────────────────

const COPY: Record<Lang, {
  eyebrow: string
  title: string
  body: string
  linkedin: string
  cv: string
  email: string
  github: string
}> = {
  en: {
    eyebrow: 'Availability',
    title: 'Open to work',
    body:
      'Open to remote technical SEO and front-end roles, full-time or contract. The portfolio is this site: the code, the tests and the experiment log behind every claim on it.',
    linkedin: 'Message on LinkedIn',
    cv: 'CV (PDF)',
    email: 'Email',
    github: 'GitHub',
  },
  'pt-BR': {
    eyebrow: 'Disponibilidade',
    title: 'Aberto a oportunidades',
    body:
      'Aberto a vagas e contratos remotos de SEO técnico e front-end. O portfólio é o próprio site: o código, os testes e o log de experimentos por trás de cada afirmação dele.',
    linkedin: 'Falar no LinkedIn',
    cv: 'Currículo (PDF)',
    email: 'Email',
    github: 'GitHub',
  },
}

export function AvailabilityNote({ lang }: { lang: Lang }) {
  const copy = COPY[lang]
  const { linkedin, cv, email, github } = site.author

  // A ação principal é a primeira que existir: uma só em ciano cheio por tela.
  const actions = [
    linkedin && { href: linkedin, label: copy.linkedin, external: true },
    email && { href: `mailto:${email}`, label: copy.email, external: false },
    cv && { href: cv, label: copy.cv, external: true },
    github && { href: github, label: copy.github, external: true },
  ].filter(Boolean) as { href: string; label: string; external: boolean }[]

  return (
    <section
      aria-labelledby="availability"
      className="mt-12 max-w-[68ch] border-t-[3px] border-primary bg-surface p-6 lg:p-8"
    >
      <p className="eyebrow text-primary">{copy.eyebrow}</p>
      <h2
        id="availability"
        className="mt-3 font-display text-[clamp(1.5rem,1.1rem+1.4vw,2.125rem)] font-bold leading-[1.1] tracking-[-0.02em] text-foreground"
      >
        {copy.title}
      </h2>
      <p className="mt-4 text-[1.0625rem] leading-relaxed text-body">{copy.body}</p>
      <div className="mt-6 flex flex-wrap gap-4">
        {actions.map(({ href, label, external }, i) => (
          <a
            key={href}
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={buttonClasses(i === 0 ? 'solid' : 'outline')}
          >
            {label}
            {external && <span aria-hidden="true">↗</span>}
          </a>
        ))}
      </div>
    </section>
  )
}
