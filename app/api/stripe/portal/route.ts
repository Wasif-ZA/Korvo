import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(_req: NextRequest): Promise<NextResponse> {
  // Authenticate user
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Look up the Stripe customer ID from the profiles table
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { stripeCustomerId: true },
  })

  if (!profile?.stripeCustomerId) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
  }

  // Create a Customer Portal session
  // Per PAY-03: Customer Portal for self-service subscription management
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings`,
  })

  return NextResponse.json({ url: session.url })
}
