import { notFound } from 'next/navigation'

// Controle: notFound() na página, sem loading.jsx e sem generateMetadata.
export default async function Page({ params }) {
  const { slug } = await params
  await new Promise((r) => setTimeout(r, 50))
  if (slug !== 'real') notFound()
  return <h1>{slug}</h1>
}
