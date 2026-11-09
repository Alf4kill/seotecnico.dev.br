import { notFound } from 'next/navigation'

// notFound() em generateMetadata E na página.
const exists = async (slug) => {
  await new Promise((r) => setTimeout(r, 50))
  return slug === 'real'
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  if (!(await exists(slug))) notFound()
  return { title: slug }
}

export default async function Page({ params }) {
  const { slug } = await params
  if (!(await exists(slug))) notFound()
  return <h1>{slug}</h1>
}
