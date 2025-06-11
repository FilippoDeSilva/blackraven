'use server';

import Stripe from 'stripe';
import { getSupabaseServerActionClient, handleActionError, ServerActionResult, ActionError } from '@/lib/actions/utils'; // Centralized Supabase client and ServerActionResult

// Initialize server-side Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Use a recent stable API version, or the one used in your Stripe dashboard settings
  apiVersion: '2025-05-28.basil', // Example API version
});

// Helper function to get the base URL
const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_APP_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/';
  // Make sure to include https:// when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};

export async function createStripeCheckoutSession(priceId: string): Promise<ServerActionResult<{ url?: string | null; }>> {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Stripe secret key not configured.");
    return handleActionError(new ActionError("Stripe not configured", 500, "STRIPE_CONFIG_ERROR"));
  }

  if (!priceId) {
    console.warn("createStripeCheckoutSession: Missing priceId.");
    return handleActionError(new ActionError("Price ID is required", 400, "VALIDATION_ERROR"));
  }

  try {
    const supabase = await getSupabaseServerActionClient(); // Use centralized helper

    const { data: userAuth, error: userError } = await supabase.auth.getUser();

    if (userError || !userAuth.user) {
      console.error("[createStripeCheckoutSession] Authentication required:", userError);
      return handleActionError(new ActionError("Authentication required to create a checkout session.", 401, "AUTH_REQUIRED"));
    }

    const user = userAuth.user;

    // Retrieve customer ID from Supabase user metadata or create one if needed
    let customerId = user.user_metadata?.stripe_customer_id; // Assuming you store stripe_customer_id

    if (!customerId) {
      // Create a new customer in Stripe if one doesn't exist
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Update Supabase user metadata with the new customer ID
      const { error: updateError } = await supabase.auth.updateUser({
        data: { stripe_customer_id: customerId },
      });

      if (updateError) {
        console.error("[createStripeCheckoutSession] Error updating user metadata:", updateError);
        // Decide how to handle this error - might still proceed with checkout
        // For now, it won't stop the process but log an error.
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      redirect_on_completion: 'always',
      success_url: `${getURL()}account?status=success`, // Assuming a success page
      cancel_url: `${getURL()}pricing?status=cancelled`, // Assuming a pricing page
    });

    console.log("[createStripeCheckoutSession] Checkout session created:", session.url);
    return { success: true, data: { url: session.url } };

  } catch (error: any) {
    console.error("[createStripeCheckoutSession] Error creating checkout session:", error);
    return handleActionError(error);
  }
} 