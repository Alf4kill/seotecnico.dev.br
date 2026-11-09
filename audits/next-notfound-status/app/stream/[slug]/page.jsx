import { notFound } from 'next/navigation'

// Igual ao controle, mas o segmento tem loading.jsx: a resposta começa a ser
// enviada (streaming) antes de notFound() rodar.
export default async function Page({ params }) {
  const { slug } = await params
  await new Promise((r) => setTimeout(r, 50))
  if (slug !== 'real') notFound()
  return <h1>{slug}</h1>
}
