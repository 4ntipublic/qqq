import type { Metadata } from 'next'
import { Baloo_Da_2, Manrope } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

const fontTitle = Baloo_Da_2({
  subsets: ['latin'],
  variable: '--font-title',
  weight: ['400', '500', '600', '700', '800'],
})

const fontSans = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'AKPKYY Beat Market',
  description: 'Minimal centralized crystal interface over an interactive water background.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="es">
      <body
        className={`${fontTitle.variable} ${fontSans.variable} bg-[#0D1117] text-[rgba(255,255,255,0.94)] antialiased`}
      >
        {children}
      </body>
    </html>
  )
}