// Stripe webhook event handlers
// Per PAY-04: Plan stored in profiles table — ONLY updated here, never client-side
// Per D-08: Data is kept on subscription end — user just returns to free tier limits
import { prisma } from '@/lib/db/prisma'
import { stripe } from '@/lib/stripe/client'
import type Stripe from 'stripe'

/**
 * Handles checkout.session.completed webhook event.
 * Retrieves the full session (Pitfall 7: session event may not have subscription expanded yet),
 * then updates the user's profile to 'pro' with Stripe IDs.
 */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  // Retrieve full session with expanded subscription (Pitfall 7 prevention)
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['subscription'],
  })

  const userId = fullSession.metadata?.user_id
  if (!userId) {
    console.error('Webhook: checkout.session.completed missing user_id in metadata', { sessionId: session.id })
    return
  }

  const subscription = fullSession.subscription as Stripe.Subscription

  // Update profile — Prisma bypasses RLS (direct PostgreSQL connection, not PostgREST)
  // This is the ONLY place where profiles.plan is set to 'pro'
  await prisma.profile.update({
    where: { userId },
    data: {
      plan: 'pro',
      stripeCustomerId: fullSession.customer as string,
      stripeSubscriptionId: subscription.id,
    },
  })
}

/**
 * Handles customer.subscription.deleted webhook event.
 * Downgrades the user's profile to 'free' and clears the subscription ID.
 * Per D-08: Data is kept — user just returns to free tier limits.
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  // Find profile by stripeSubscriptionId and downgrade to free
  await prisma.profile.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      plan: 'free',
      stripeSubscriptionId: null,
    },
  })
}
