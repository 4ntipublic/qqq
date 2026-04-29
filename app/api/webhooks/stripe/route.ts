import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

// Stripe webhooks need the *raw* body for signature verification, so this
// route must run on the Node runtime (not Edge) and never be cached.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Updates the sales status for every row tied to a given invoice base id.
 * Multi-line carts share the same base with -1, -2 suffixes (see checkout/actions).
 */
async function updateSalesStatus(
  invoiceId: string,
  status: 'Pagada' | 'Cancelada' | 'Devolucion'
): Promise<void> {
  if (!invoiceId) return
  const admin = createAdminClient()
  // Match the exact invoice plus its multi-line siblings (`INV-…-1`, `-2`, …).
  const pattern = `${invoiceId}%`
  const { error } = await admin
    .from('sales')
    .update({ status })
    .like('invoice_id', pattern)
  if (error) {
    console.error('[stripe-webhook] update failed', invoiceId, error.message)
  }
}

export async function POST(req: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured')
    // 200 so Stripe doesn't retry forever for a config bug on our side.
    return NextResponse.json({ received: false, error: 'not_configured' }, { status: 200 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    // Bad signature → 400 so Stripe retries (could be a transient issue).
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[stripe-webhook] signature verification failed:', message)
    return NextResponse.json({ error: 'bad_signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // Only flip to Pagada once Stripe confirms the payment cleared.
        const isPaid =
          session.payment_status === 'paid' ||
          session.payment_status === 'no_payment_required'
        if (!isPaid) break
        const invoiceId = (session.metadata?.invoice_id ?? '').trim()
        if (invoiceId) {
          await updateSalesStatus(invoiceId, 'Pagada')
          revalidatePath('/user/settings')
          revalidatePath('/admin/dashboard/ventas')
        }
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        const invoiceId = (session.metadata?.invoice_id ?? '').trim()
        if (invoiceId) {
          await updateSalesStatus(invoiceId, 'Pagada')
          revalidatePath('/user/settings')
          revalidatePath('/admin/dashboard/ventas')
        }
        break
      }

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        const invoiceId = (session.metadata?.invoice_id ?? '').trim()
        if (invoiceId) {
          await updateSalesStatus(invoiceId, 'Cancelada')
          revalidatePath('/admin/dashboard/ventas')
        }
        break
      }

      case 'charge.refunded': {
        // Charge metadata is inherited from the PaymentIntent we created with
        // payment_intent_data.metadata in checkout/actions.ts.
        const charge = event.data.object as Stripe.Charge
        const isFullyRefunded =
          charge.refunded === true ||
          (typeof charge.amount === 'number' &&
            typeof charge.amount_refunded === 'number' &&
            charge.amount_refunded >= charge.amount)
        if (!isFullyRefunded) break

        let invoiceId = (charge.metadata?.invoice_id ?? '').trim()

        // Fallback: pull metadata off the PaymentIntent if the charge object
        // didn't carry it (older sessions, Connect, etc.).
        if (!invoiceId && typeof charge.payment_intent === 'string') {
          try {
            const pi = await getStripe().paymentIntents.retrieve(charge.payment_intent)
            invoiceId = (pi.metadata?.invoice_id ?? '').trim()
          } catch (err) {
            console.error('[stripe-webhook] retrieve PI failed', err)
          }
        }

        if (invoiceId) {
          await updateSalesStatus(invoiceId, 'Devolucion')
          revalidatePath('/user/settings')
          revalidatePath('/admin/dashboard/ventas')
        }
        break
      }

      default:
        // Ignore other events; Stripe will keep streaming them harmlessly.
        break
    }
  } catch (err) {
    // Per spec: swallow internal errors with a 200 so Stripe stops retrying
    // on bugs that won't fix themselves on retry. Log loud so we catch them.
    console.error('[stripe-webhook] handler error', event.type, err)
    return NextResponse.json({ received: true, handled: false }, { status: 200 })
  }

  return NextResponse.json({ received: true })
}
