import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

const checkoutBodySchema = z.object({
  priceId: z.enum(["monthly", "annual"]),
  promoCode: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkoutBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { priceId, promoCode } = parsed.data;

  // Resolve plan name to Stripe price ID server-side — price IDs never leave the server
  const priceIdMap: Record<string, string | undefined> = {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  };
  const resolvedPriceId = priceIdMap[priceId];
  if (!resolvedPriceId) {
    return NextResponse.json(
      { error: "Price not configured" },
      { status: 500 },
    );
  }

  // Authenticate user
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Build Checkout Session params
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: resolvedPriceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?view=pricing`,
    customer_email: user.email,
    metadata: { user_id: user.id },
    allow_promotion_codes: true,
  };

  // If a promo code was explicitly provided, look it up and attach it directly
  // Per D-10: promo codes supported via Stripe Coupons
  if (promoCode) {
    const promo = await stripe.promotionCodes.list({
      code: promoCode,
      limit: 1,
      active: true,
    });
    if (promo.data.length > 0) {
      // Attach promo code directly — remove allow_promotion_codes to avoid conflict
      delete sessionParams.allow_promotion_codes;
      sessionParams.discounts = [{ promotion_code: promo.data[0].id }];
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return NextResponse.json({ url: session.url });
}
