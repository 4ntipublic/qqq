import type { Metadata } from 'next'
import { fetchAdminUsers } from '@/lib/admin-queries'
import { AdminUsersClient } from './_components/admin-users-client'

export const metadata: Metadata = {
  title: 'Admin · Usuarios',
}

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const users = await fetchAdminUsers()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Usuarios
        </p>
        <h1 className="font-helvetica text-4xl font-light tracking-[-0.01em] text-foreground">
          Comunidad
        </h1>
        <p className="text-sm font-light text-muted-foreground">
          {users.length === 0
            ? 'Todavía no hay cuentas registradas.'
            : `${users.length} ${users.length === 1 ? 'cuenta registrada' : 'cuentas registradas'} · acceso de solo lectura`}
        </p>
      </header>

      <AdminUsersClient users={users} />
    </div>
  )
}
