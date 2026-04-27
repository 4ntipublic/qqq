'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

export interface SidebarNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  matchPrefix?: boolean
}

export interface SidebarProfile {
  displayName: string
  username: string
  email: string
  role: string
  initial: string
}

interface SidebarShellProps {
  title: string
  items: SidebarNavItem[]
  profile: SidebarProfile
  children: React.ReactNode
}

function SidebarNav({
  items,
  pathname,
  onItemClick,
}: {
  items: SidebarNavItem[]
  pathname: string
  onItemClick?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.matchPrefix
          ? pathname.startsWith(item.href)
          : pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-light transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarProfileFooter({ profile }: { profile: SidebarProfile }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-sidebar-border bg-background/60 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-sm font-light text-foreground">
          {profile.initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-light text-foreground">
            {profile.displayName}
          </p>
          <p className="truncate text-xs font-light text-muted-foreground">
            {profile.email}
          </p>
        </div>
      </div>
      <Separator />
      <div className="flex items-center justify-between text-xs font-light">
        <span className="text-muted-foreground">@{profile.username}</span>
        <span className="rounded-lg border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-foreground">
          {profile.role}
        </span>
      </div>
      <form action="/admin/logout" method="post">
        <button
          type="submit"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-light text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  )
}

function SidebarInner({
  title,
  items,
  profile,
  pathname,
  onItemClick,
}: {
  title: string
  items: SidebarNavItem[]
  profile: SidebarProfile
  pathname: string
  onItemClick?: () => void
}) {
  return (
    <>
      <div className="px-1 pb-2">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          akpkyy · admin
        </p>
        <h2 className="mt-1 font-helvetica text-xl font-light tracking-[-0.01em] text-foreground">
          {title}
        </h2>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto py-3">
        <SidebarNav items={items} pathname={pathname} onItemClick={onItemClick} />
      </div>
      <SidebarProfileFooter profile={profile} />
    </>
  )
}

export function SidebarShell({ title, items, profile, children }: SidebarShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-3 border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <SidebarInner
          title={title}
          items={items}
          profile={profile}
          pathname={pathname}
        />
      </aside>

      {/* Mobile top bar + sheet */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur-sm lg:hidden">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menú"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-foreground"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetTitle className="sr-only">Navegación admin</SheetTitle>
                <SidebarInner
                  title={title}
                  items={items}
                  profile={profile}
                  pathname={pathname}
                  onItemClick={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <span className="font-helvetica text-sm font-light tracking-[0.01em] text-foreground">
              akpkyy · admin
            </span>
          </div>
          <form action="/admin/logout" method="post">
            <button
              type="submit"
              aria-label="Cerrar sesión"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        </header>

        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  )
}
