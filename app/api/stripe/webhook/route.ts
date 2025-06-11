// import { NextResponse } from "next/server"
// import { createClient } from "@/lib/supabase/server"
// import { createSupabaseServerClient } from '@/lib/actions/supabase-client'
// import Stripe from "stripe"
// import { headers } from "next/headers"

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2023-10-16",
// })

// export async function POST(request: Request) {
//   try {
//     const body = await request.text()
//     const signature = headers().get("stripe-signature") as string

//     // Verify webhook signature
//     let event: Stripe.Event

//     try {
//       event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
//     } catch (err: any) {
//       return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
//     }

//     const supabase = createSupabaseServerClient()

//     // Handle the event
//     switch (event.type) {
//       case "checkout.session.completed": {
//         const session = event.data.object as Stripe.Checkout.Session

//         // Extract metadata
//         const { userId, plan, billingCycle, expiresAt } = session.metadata as {
//           userId: string
//           plan: string
//           billingCycle: string
//           expiresAt: string
//         }

//         // Create subscription record
//         const { error } = await supabase.from("subscriptions").insert({
//           user_id: userId,
//           plan,
//           status: "active",
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//           expires_at: expiresAt,
//           payment_id: session.id,
//         })

//         if (error) {
//           console.error("Error creating subscription:", error)
//           return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
//         }

//         break
//       }

//       case "customer.subscription.updated": {
//         const subscription = event.data.object as Stripe.Subscription

//         // Update subscription status
//         const { error } = await supabase
//           .from("subscriptions")
//           .update({
//             status: subscription.status,
//             updated_at: new Date().toISOString(),
//           })
//           .eq("payment_id", subscription.id)

//         if (error) {
//           console.error("Error updating subscription:", error)
//           return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
//         }

//         break
//       }

//       case "customer.subscription.deleted": {
//         const subscription = event.data.object as Stripe.Subscription

//         // Update subscription status to cancelled
//         const { error } = await supabase
//           .from("subscriptions")
//           .update({
//             status: "cancelled",
//             updated_at: new Date().toISOString(),
//           })
//           .eq("payment_id", subscription.id)

//         if (error) {
//           console.error("Error cancelling subscription:", error)
//           return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
//         }

//         break
//       }
//     }

//     return NextResponse.json({ received: true })
//   } catch (error: any) {
//     console.error("Error processing webhook:", error)
//     return NextResponse.json({ error: error.message }, { status: 500 })
//   }
// }
