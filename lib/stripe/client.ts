// Stripe SDK singleton
// apiVersion matches the installed stripe@21.0.1 package (2026-03-25.dahlia)
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia' as Stripe.LatestApiVersion,
  typescript: true,
})
