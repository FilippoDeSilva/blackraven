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

    // Get plan details
    const prices = {
      basic: {
        monthly: 999, // $9.99
        quarterly: 2699, // $26.99
        yearly: 9999, // $99.99
      },
      premium: {
        monthly: 1999, // $19.99
        quarterly: 5399, // $53.99
        yearly: 19999, // $199.99
      },
      enterprise: {
        monthly: 4999, // $49.99
        quarterly: 13499, // $134.99
        yearly: 49999, // $499.99
      },
    }

    // Calculate expiration date
    const now = new Date()
    const expiresAt = new Date(now)

    if (billingCycle === "monthly") {
      expiresAt.setMonth(now.getMonth() + 1)
    } else if (billingCycle === "quarterly") {
      expiresAt.setMonth(now.getMonth() + 3)
    } else if (billingCycle === "yearly") {
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
              name: `BlackRaven ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${billingCycle})`,
              description: `${billingCycle} subscription to BlackRaven ${plan} plan`,
            },
            unit_amount: prices[plan as keyof typeof prices][billingCycle as keyof typeof prices.basic],
            recurring: {
              interval: billingCycle === "monthly" ? "month" : billingCycle === "quarterly" ? "month" : "year",
              interval_count: billingCycle === "quarterly" ? 3 : 1,
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
        plan,
        billingCycle,
        expiresAt: expiresAt.toISOString(),
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
