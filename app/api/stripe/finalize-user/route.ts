import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return NextResponse.json({ success: false, error: "Missing session_id" }, { status: 400 });
    }

    // Get user from Supabase session
    const cookieStore = await cookies();
    const cookieAdapter = {
      getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
      setAll: (cookiesToSet: { name: string; value: string; options?: any }[]) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set({ name, value, ...options });
        });
      },
      deleteAll: (cookiesToDelete: { name: string; options?: any }[]) => {
        cookiesToDelete.forEach(({ name, options }) => {
          cookieStore.delete({ name, ...options });
        });
      },
    };
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieAdapter }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }

    // Fetch Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session || !session.metadata) {
      return NextResponse.json({ success: false, error: "Invalid Stripe session or missing metadata" }, { status: 400 });
    }
    const { userId, plan, billingCycle, expiresAt } = session.metadata as {
      userId: string;
      plan: string;
      billingCycle: string;
      expiresAt: string;
    };
    if (userId !== user.id) {
      return NextResponse.json({ success: false, error: "User mismatch" }, { status: 403 });
    }

    // Update users table with plan, billingCycle, subscription_status, expires_at
    const { error: upsertError } = await supabase.from("users").upsert([
      {
        id: user.id,
        subscription_status: "active",
        plan,
        billing_cycle: billingCycle,
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
    ], { onConflict: "id" });
    if (upsertError) {
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Unexpected error" }, { status: 500 });
  }
} 