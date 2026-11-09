import { notFound } from 'next/navigation'

// notFound() SÓ em generateMetadata; a página não confere nada e renderiza na
// hora. Desde o Next.js 15.2 o metadata pode ser enviado em streaming para quem
// não está na lista de "HTML-limited bots" — e aí o status já saiu como 200.
export async function generateMetadata({ params }) {
  const { slug } = await params
  await new Promise((r) => setTimeout(r, 200))
  if (slug !== 'real') notFound()
  return { title: slug }
}

export default function Page() {
  return <h1>page body</h1>
}
