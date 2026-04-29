'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/utils/supabase/admin'

export type SaleActionResult = { ok: boolean; error?: string }

const TARGETS = ['Pagada', 'Cancelada', 'Pendiente'] as const
type SaleStatus = (typeof TARGETS)[number]

/**
 * Manually flip a sale's status. Limited to non-Stripe sales (transfer / paypal)
 * because Stripe-paid invoices reconcile through the webhook and shouldn't be
 * overridden by hand without a real refund flow.
 */
export async function updateSaleStatusAction(
  saleId: string,
  nextStatus: SaleStatus
): Promise<SaleActionResult> {
  const guard = await assertAdmin()
  if (!guard.ok) return { ok: false, error: guard.error }

  if (typeof saleId !== 'string' || saleId.length < 8) {
    return { ok: false, error: 'ID inválido.' }
  }
  if (!TARGETS.includes(nextStatus)) {
    return { ok: false, error: 'Estado inválido.' }
  }

  const admin = createAdminClient()

  const { data: existing, error: readError } = await admin
    .from('sales')
    .select('id, payment_method, status')
    .eq('id', saleId)
    .maybeSingle()
  if (readError) return { ok: false, error: readError.message }
  if (!existing) return { ok: false, error: 'Venta no encontrada.' }

  if ((existing as { payment_method: string }).payment_method === 'stripe') {
    return {
      ok: false,
      error: 'Las ventas por Stripe se concilian automáticamente vía webhook.',
    }
  }

  const { error: updateError } = await admin
    .from('sales')
    .update({ status: nextStatus })
    .eq('id', saleId)
  if (updateError) return { ok: false, error: updateError.message }

  revalidatePath('/admin/dashboard/ventas')
  revalidatePath('/user/settings')
  return { ok: true }
}
