import type { ReactNode } from 'react'

// Admin layout is intentionally a passthrough. Scroll/overflow is controlled
// per-section by its own layout (e.g. dashboard sidebar layout). The middleware
// guards auth for every /admin/* route except /admin/login.
export default function AdminRootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>
}
