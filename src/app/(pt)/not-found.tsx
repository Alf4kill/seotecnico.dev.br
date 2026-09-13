import { NotFoundContent } from '@/components/sections/NotFoundContent'

/**
 * 404 de `notFound()` chamado dentro de uma rota portuguesa (ex.: slug de artigo
 * inexistente). Renderiza dentro do root layout português. URLs que não casam
 * com rota nenhuma caem em app/global-not-found.tsx.
 */
export default function NotFound() {
  return <NotFoundContent />
}
