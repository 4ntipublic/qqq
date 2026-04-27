import type { ReactNode } from 'react'
import { getAdminProfile } from '@/lib/auth'
import { AdminSidebar } from './_components/admin-sidebar'

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const profile = await getAdminProfile()
  return <AdminSidebar profile={profile}>{children}</AdminSidebar>
}
