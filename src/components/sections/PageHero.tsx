import Image from 'next/image'
import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs'

/**
 * Banner de topo das páginas internas (Blog, Ferramentas, etc.).
 *
 * Base reutilizável: imagem de fundo escurecida (object-cover) — ou gradiente
 * sólido quando não há imagem — com a trilha de navegação (breadcrumb), o
 * título h1 e um subtítulo opcional centralizados.
 *
 * O banner fica recuado 16px das bordas da viewport (padding p-4 na section),
 * formando um cartão arredondado.
 */

type PageHeroProps = {
  /** Título principal (h1) da página. */
  titulo: string
  /** Texto de apoio exibido abaixo do título. */
  subtitulo?: string
  /** Itens da trilha de navegação. O último é a página atual (sem link). */
  breadcrumb: Crumb[]
  /** Imagem de fundo do banner. Sem imagem, usa gradiente da cor primária. */
  imagem?: string
}

export function PageHero({ titulo, subtitulo, breadcrumb, imagem }: PageHeroProps) {
  return (
    // p-4 = 16px de recuo do banner em relação às bordas
    <section className="p-4">
      <div
        className="relative flex min-h-[240px] items-center justify-center overflow-hidden
                   rounded-2xl bg-gradient-to-br from-primary-solid-hover to-primary-solid md:min-h-[300px]"
      >
        {/* Imagem de fundo (opcional) */}
        {imagem && (
          <Image
            src={imagem}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}

        {/* Conteúdo centralizado: breadcrumb + título + subtítulo */}
        <div className="container-xl relative flex flex-col items-center gap-4 py-12 text-center lg:gap-6 lg:py-16">
          <Breadcrumbs items={breadcrumb} variant="light" />

          <h1 className="font-bold text-white text-4xl leading-tight md:text-5xl">
            {titulo}
          </h1>

          {subtitulo && (
            <p className="max-w-2xl text-white/85 text-sm leading-7 md:text-base">
              {subtitulo}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
