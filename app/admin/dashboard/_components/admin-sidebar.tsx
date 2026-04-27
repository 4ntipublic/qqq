'use client'

import type { ReactNode } from 'react'
import { LayoutDashboard, Tags, Receipt, Music2 } from 'lucide-react'
import { SidebarShell, type SidebarNavItem, type SidebarProfile } from '@/components/ui/sidebar'

const navItems: SidebarNavItem[] = [
  {
    label: 'Inicio',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Categorías',
    href: '/admin/dashboard/categorias',
    icon: Tags,
    matchPrefix: true,
  },
  {
    label: 'Ventas',
    href: '/admin/dashboard/ventas',
    icon: Receipt,
    matchPrefix: true,
  },
  {
    label: 'Beats',
    href: '/admin/dashboard/beats',
    icon: Music2,
    matchPrefix: true,
  },
]

interface AdminSidebarProps {
  profile: SidebarProfile
  children: ReactNode
}

export function AdminSidebar({ profile, children }: AdminSidebarProps) {
  return (
    <SidebarShell title="Admin Supreme" items={navItems} profile={profile}>
      {children}
    </SidebarShell>
  )
}
