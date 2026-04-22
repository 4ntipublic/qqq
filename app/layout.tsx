import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'AKPKYY Beat Market',
  description: 'Minimal centralized crystal interface with native gradient background.',
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
        {children}
      </body>
    </html>
  )
}