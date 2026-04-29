import 'server-only'
import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY

let cached: Stripe | null = null

/**
 * Returns a singleton Stripe client. Throws lazily so build-time renders that
 * do not actually need Stripe (e.g. listing the checkout page) keep working
 * in environments where the secret is intentionally absent.
 */
export function getStripe(): Stripe {
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  if (!cached) {
    cached = new Stripe(secretKey, {
      // Pin the API version for predictable webhook payload shapes.
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
      appInfo: { name: 'akpkyy', version: '1.0.0' },
    })
  }
  return cached
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''
