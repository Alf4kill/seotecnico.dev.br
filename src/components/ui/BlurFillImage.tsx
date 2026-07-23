import Image from 'next/image'

type BlurFillImageProps = {
  src: string
  alt: string
  /** Atributo `title` da imagem real (tooltip/SEO). Se omitido, usa o `alt`. */
  title?: string
  /** Repassado para os dois `next/image` (mesma variante = 1 download). */
  sizes?: string
  /** `preload` do next/image (v16 — sucessor da prop `priority`, deprecada). */
  preload?: boolean
  /** Classe extra na imagem em primeiro plano (ex.: hover scale). */
  className?: string
}

/**
 * Imagem dentro de um frame de proporção fixa, exibida SEM corte.
 *
 * A imagem real aparece inteira (`object-contain`) sobre uma cópia borrada
 * dela mesma (`object-cover`), que preenche as laterais — assim o frame 16:10
 * fica cheio mesmo com imagens em retrato, sem cortar nada e sem espaços vazios.
 *
 * O frame (aspect-ratio + `relative` + `overflow-hidden`) é definido pelo
 * elemento pai, igual ao uso anterior de `<Image fill />`.
 */
export function BlurFillImage({
  src,
  alt,
  title,
  sizes,
  preload,
  className,
}: BlurFillImageProps) {
  return (
    <>
      {/* Fundo borrado — preenche o frame */}
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        preload={preload}
        className="scale-150 object-cover blur-2xl"
      />
      {/* Imagem real — inteira, sem corte */}
      <Image
        src={src}
        alt={alt}
        title={title || alt || undefined}
        fill
        sizes={sizes}
        preload={preload}
        className={`object-contain${className ? ` ${className}` : ''}`}
      />
    </>
  )
}
