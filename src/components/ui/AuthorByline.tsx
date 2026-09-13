import Link from 'next/link'
import { site } from '@/lib/site'

// ─────────────────────────────────────────────────────────────────────────────
// Assinatura visível do autor (CLAUDE.md §1: byline + Person schema em todo
// artigo, para E-E-A-T).
//
// O `Person` já sai no JSON-LD via `ArticleJsonLd` → `personSchema()`; esta é
// a contraparte legível, que faltava. O link para a página do autor é o que
// liga as duas leituras: é onde a entidade do schema tem corpo. Cada idioma
// aponta para a sua página; o nó `Person` continua um só (@id em /sobre).
// ─────────────────────────────────────────────────────────────────────────────

export function AuthorByline({ lang = 'pt-BR' }: { lang?: 'pt-BR' | 'en' }) {
  return (
    <span>
      {lang === 'en' ? 'By' : 'Por'}{' '}
      <Link
        href={lang === 'en' ? '/en/about' : '/sobre'}
        rel="author"
        className="text-primary hover:underline"
      >
        {site.author.name}
      </Link>
      , {site.author.jobTitle}
    </span>
  )
}
