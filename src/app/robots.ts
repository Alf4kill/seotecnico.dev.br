import type { MetadataRoute } from 'next'
import { site, indexable } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  if (!indexable) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /busca NÃO entra aqui: a página já é noindex, e um Disallow impediria
        // o Googlebot de rastreá-la — logo, de ler o próprio noindex. As duas
        // diretivas se cancelam. Ver /blog/sitemap-dinamico-nextjs.
        disallow: ['/api/'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  }
}
