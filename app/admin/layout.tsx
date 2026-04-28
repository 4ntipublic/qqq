import type { ReactNode } from 'react'

export default function AdminRootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>
}
