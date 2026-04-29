import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import Providers from './_components/Providers'
import GlobalHeaderMount from './_components/GlobalHeaderMount'
import GlobalFooter from './_components/GlobalFooter'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akpkyy.com'
const SITE_NAME = 'akpkyy'
const SITE_TITLE = 'akpkyy | Premium Beats'
const SITE_DESCRIPTION =
  'Beats premium hechos a mano. Catálogo curado, licencias instantáneas y descargas en alta calidad.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s · akpkyy',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'akpkyy' }],
  creator: 'akpkyy',
  publisher: 'akpkyy',
  keywords: [
    'akpkyy',
    'beats',
    'instrumentales',
    'trap',
    'rap',
    'producer',
    'beat store',
    'licencias',
    'type beat',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'akpkyy · Premium Beats',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
    creator: '@akpkyy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#f8fafc',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="es">
      <body
        className="bg-[#f8fafc] text-[#111827] antialiased"
        style={{
          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
          fontWeight: 300,
        }}
      >
        <Providers>
          <GlobalHeaderMount />
          {children}
          <GlobalFooter />
        </Providers>
      </body>
    </html>
  )
}