import { NextResponse } from "next/server"
import { getSupabaseRouteHandlerClient } from "@/lib/supabase/utils"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseRouteHandlerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { plan, billingCycle } = await request.json()

    // Only allow these plans and billing cycles
    const allowedPlans = ["basic", "pro", "enterprise"] as const;
    const allowedBillingCycles = ["monthly", "yearly"] as const;

    if (!allowedPlans.includes(plan) || !allowedBillingCycles.includes(billingCycle)) {
      return NextResponse.json({ error: "Invalid plan or billing cycle" }, { status: 400 })
    }

    // Type assertion after validation
    const typedPlan = plan as typeof allowedPlans[number];
    const typedBillingCycle = billingCycle as typeof allowedBillingCycles[number];

    // Get plan details
    const prices = {
      basic: {
        monthly: 999, // $9.99
        yearly: 9999, // $99.99
      },
      pro: {
        monthly: 1999, // $19.99
        yearly: 19999, // $199.99
      },
      enterprise: {
        monthly: 4999, // $49.99
        yearly: 49999, // $499.99
      },
    }

    // Calculate expiration date
    const now = new Date()
    const expiresAt = new Date(now)

    if (typedBillingCycle === "monthly") {
      expiresAt.setMonth(now.getMonth() + 1)
    } else if (typedBillingCycle === "yearly") {
      expiresAt.setFullYear(now.getFullYear() + 1)
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `BlackRaven ${typedPlan.charAt(0).toUpperCase() + typedPlan.slice(1)} Plan (${typedBillingCycle})`,
              description: `${typedBillingCycle} subscription to BlackRaven ${typedPlan} plan`,
            },
            unit_amount: prices[typedPlan][typedBillingCycle],
            recurring: {
              interval: typedBillingCycle === "monthly" ? "month" : "year",
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        plan: typedPlan,
        billingCycle: typedBillingCycle,
        expiresAt: expiresAt.toISOString(),
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
