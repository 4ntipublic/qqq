'use server'

import { randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient as createSsrClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getStripe } from '@/lib/stripe'

export type PaymentMethod = 'stripe' | 'paypal' | 'transfer'

const ALLOWED_METHODS: ReadonlyArray<PaymentMethod> = ['stripe', 'paypal', 'transfer']

const LICENSE_PRICE_CENTS: Record<string, number> = {
  'mp3-lease': 2000,
  'wav-lease': 2500,
  trackouts: 4000,
}

const LICENSE_LABEL: Record<string, string> = {
  'mp3-lease': 'MP3 Lease',
  'wav-lease': 'WAV Lease',
  trackouts: 'Trackouts (Stems)',
}

export type CheckoutItemInput = {
  beatId: string
  licenseId: string
}

export type ProcessCheckoutResult = {
  ok: boolean
  invoiceId?: string
  lineCount?: number
  totalCents?: number
  error?: string
  needsLogin?: boolean
  /** When set, the client must redirect to this URL (e.g. Stripe Checkout). */
  redirectUrl?: string
}

const resolveOrigin = async (): Promise<string> => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

const generateInvoiceId = (): string => {
  const date = new Date()
  const yyyy = date.getUTCFullYear().toString()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const suffix = randomBytes(4).toString('hex').toUpperCase()
  return `INV-${yyyy}${mm}${dd}-${suffix}`
}

export async function processCheckoutAction(
  items: CheckoutItemInput[],
  paymentMethod: PaymentMethod
): Promise<ProcessCheckoutResult> {
  // 1) Auth
  const supabase = await createSsrClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  const user = userData.user
  if (authError || !user) {
    return { ok: false, error: 'Necesitás iniciar sesión.', needsLogin: true }
  }

  // 2) Validate payload
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'Tu carrito está vacío.' }
  }
  if (items.length > 50) {
    return { ok: false, error: 'Demasiados items en el carrito.' }
  }
  if (!ALLOWED_METHODS.includes(paymentMethod)) {
    return { ok: false, error: 'Método de pago inválido.' }
  }

  for (const item of items) {
    if (!item || typeof item.beatId !== 'string' || typeof item.licenseId !== 'string') {
      return { ok: false, error: 'Items malformados.' }
    }
    if (!LICENSE_PRICE_CENTS[item.licenseId]) {
      return { ok: false, error: `Licencia desconocida: ${item.licenseId}` }
    }
  }

  // 3) Resolve beats server-side (use admin client to bypass beats RLS for read).
  const admin = createAdminClient()
  const beatIds = Array.from(new Set(items.map((i) => i.beatId)))
  const { data: beatsData, error: beatsError } = await admin
    .from('beats')
    .select('id, title, is_visible')
    .in('id', beatIds)

  if (beatsError) {
    return { ok: false, error: beatsError.message }
  }
  const beatsById = new Map<string, { id: string; title: string; is_visible: boolean }>()
  ;(beatsData ?? []).forEach((b) => {
    beatsById.set(b.id as string, {
      id: b.id as string,
      title: (b.title as string) ?? 'Beat',
      is_visible: Boolean(b.is_visible),
    })
  })
  for (const item of items) {
    const beat = beatsById.get(item.beatId)
    if (!beat) return { ok: false, error: 'Algún beat ya no existe.' }
    if (!beat.is_visible) {
      return { ok: false, error: `"${beat.title}" ya no está disponible.` }
    }
  }

  // 4) Build sale rows. Schema enforces unique invoice_id, so we share a base
  //    and append a per-line suffix when the cart has multiple items.
  const baseInvoice = generateInvoiceId()
  const rows = items.map((item, index) => {
    const priceCents = LICENSE_PRICE_CENTS[item.licenseId]!
    const invoiceId = items.length === 1 ? baseInvoice : `${baseInvoice}-${index + 1}`
    return {
      invoice_id: invoiceId,
      beat_id: item.beatId,
      status: 'Pendiente',
      payment_method: paymentMethod,
      amount_cents: priceCents,
      currency: 'USD',
      buyer_email: user.email ?? '',
      user_id: user.id,
    }
  })

  const totalCents = rows.reduce((sum, r) => sum + r.amount_cents, 0)

  // 5) Insert
  const { error: insertError } = await admin.from('sales').insert(rows)
  if (insertError) {
    return { ok: false, error: insertError.message }
  }

  revalidatePath('/user/settings')
  revalidatePath('/admin/dashboard/ventas')

  // 6) Stripe branch — create a Checkout Session and return its hosted URL.
  if (paymentMethod === 'stripe') {
    try {
      const stripe = getStripe()
      const origin = await resolveOrigin()

      const lineItems = items.map((item) => {
        const beat = beatsById.get(item.beatId)!
        const license = LICENSE_LABEL[item.licenseId] ?? item.licenseId
        return {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: LICENSE_PRICE_CENTS[item.licenseId]!,
            product_data: {
              name: `${beat.title} · ${license}`,
              metadata: {
                beatId: beat.id,
                licenseId: item.licenseId,
              },
            },
          },
        }
      })

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: user.email ?? undefined,
        line_items: lineItems,
        success_url: `${origin}/checkout/success?invoice=${encodeURIComponent(
          baseInvoice
        )}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout?canceled=1`,
        metadata: {
          invoice_id: baseInvoice,
          user_id: user.id,
          line_count: String(rows.length),
        },
        payment_intent_data: {
          metadata: {
            invoice_id: baseInvoice,
            user_id: user.id,
          },
        },
      })

      if (!session.url) {
        // Roll back the pending rows so the user can retry cleanly.
        await admin.from('sales').delete().eq('invoice_id', baseInvoice)
        return { ok: false, error: 'No se pudo iniciar el pago.' }
      }

      return {
        ok: true,
        invoiceId: baseInvoice,
        lineCount: rows.length,
        totalCents,
        redirectUrl: session.url,
      }
    } catch (err) {
      // Best-effort rollback so we don't leave orphan Pendientes.
      await admin.from('sales').delete().like('invoice_id', `${baseInvoice}%`)
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'No se pudo iniciar la sesión de Stripe.',
      }
    }
  }

  // PayPal / Transfer → manual approval flow handled by the admin panel.
  return {
    ok: true,
    invoiceId: baseInvoice,
    lineCount: rows.length,
    totalCents,
  }
}

// Re-export the price map so the client can render totals consistently.
export const PUBLIC_LICENSE_PRICE_CENTS = LICENSE_PRICE_CENTS
export const PUBLIC_LICENSE_LABEL = LICENSE_LABEL
