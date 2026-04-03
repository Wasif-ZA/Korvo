// Stripe SDK singleton (lazy-initialized)
// apiVersion matches the installed stripe@21.0.1 package (2026-03-25.dahlia)
import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia' as Stripe.LatestApiVersion,
      typescript: true,
    })
  }
  return _stripe
}

/** @deprecated Use getStripe() — kept for existing imports */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
