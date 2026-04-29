'use server'

import { assertAdmin } from '@/lib/admin-guard'
import { fetchAdminUserSales, type AdminUserSale } from '@/lib/admin-queries'

export type LoadUserSalesResult = {
  ok: boolean
  sales?: AdminUserSale[]
  error?: string
}

export async function loadUserSalesAction(
  userId: string,
  email: string | null
): Promise<LoadUserSalesResult> {
  const guard = await assertAdmin()
  if (!guard.ok) return { ok: false, error: guard.error ?? 'No autorizado.' }

  if (!userId || typeof userId !== 'string') {
    return { ok: false, error: 'ID inválido.' }
  }

  try {
    const sales = await fetchAdminUserSales(userId, email)
    return { ok: true, sales }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'No se pudieron cargar las ventas.',
    }
  }
}
