import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GoogleTagManager } from '@next/third-parties/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SearchProvider } from '@/components/search/SearchContext'
import { SearchModal } from '@/components/search/SearchModal'
import { site, indexable } from '@/lib/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    template: `%s | ${site.name}`,
    default: site.name,
  },
  description: site.description,
  robots: {
    index: indexable,
    follow: indexable,
  },
  openGraph: {
    type: 'website',
    locale: site.locale,
    siteName: site.name,
    url: site.url,
  },
  twitter: {
    card: 'summary_large_image',
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <SearchProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <SearchModal />
        </SearchProvider>
        {site.gtmId && <GoogleTagManager gtmId={site.gtmId} />}
      </body>
    </html>
  )
}
