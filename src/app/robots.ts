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
        disallow: ['/api/', '/busca'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  }
}
