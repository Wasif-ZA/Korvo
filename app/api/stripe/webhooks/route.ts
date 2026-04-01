import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { handleCheckoutCompleted, handleSubscriptionDeleted } from '@/lib/stripe/webhooks'

export async function POST(req: NextRequest): Promise<NextResponse> {
  // CRITICAL: Use req.text() NOT req.json() — raw body required for signature verification
  // Using req.json() parses the body first and breaks Stripe HMAC verification (Pitfall 2)
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(subscription)
      break
    }
    default:
      // Unhandled event type — log and acknowledge (return 200 so Stripe doesn't retry)
      console.log(`Webhook: unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
