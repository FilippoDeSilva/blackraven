import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: NextRequest) {
  try {
    console.log('[FinalizeUser] Called');
    const { session_id } = await req.json();
    console.log('[FinalizeUser] session_id:', session_id);
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
    console.log('[FinalizeUser] user:', user);
    if (!user || userError) {
      console.log('[FinalizeUser] User not authenticated:', userError);
      return NextResponse.json({ success: false, error: "User not authenticated", debug: { user, userError } }, { status: 401 });
    }

    // Fetch Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('[FinalizeUser] Stripe session:', session);
    if (!session || !session.metadata) {
      console.log('[FinalizeUser] Invalid Stripe session or missing metadata');
      return NextResponse.json({ success: false, error: "Invalid Stripe session or missing metadata", debug: { session } }, { status: 400 });
    }
    const { userId, plan, billingCycle, expiresAt } = session.metadata as {
      userId: string;
      plan: string;
      billingCycle: string;
      expiresAt: string;
    };
    console.log('[FinalizeUser] Stripe metadata:', session.metadata);
    if (userId !== user.id) {
      console.log('[FinalizeUser] User mismatch:', { userId, userIdType: typeof userId, user_id: user.id, user_idType: typeof user.id });
      return NextResponse.json({ success: false, error: "User mismatch", debug: { userId, user_id: user.id } }, { status: 403 });
    }

    // Upsert payload
    const upsertPayload = {
      id: user.id,
      email: user.email,
      subscription_status: "active",
      plan,
      billing_cycle: billingCycle,
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    };
    console.log('[FinalizeUser] Upsert payload:', upsertPayload);

    // Update users table with plan, billingCycle, subscription_status, expires_at
    const { error: upsertError } = await supabase.from("users").upsert([
      upsertPayload
    ], { onConflict: "id" });
    console.log('[FinalizeUser] Upsert error:', upsertError);
    if (upsertError) {
      // Check for RLS or permission errors
      if (upsertError.code === '42501' || upsertError.message?.toLowerCase().includes('rls')) {
        console.log('[FinalizeUser] RLS or permission error:', upsertError);
      }
      return NextResponse.json({ success: false, error: upsertError.message, debug: { upsertError, upsertPayload } }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.log('[FinalizeUser] Exception:', error);
    return NextResponse.json({ success: false, error: error.message || "Unexpected error", debug: { error } }, { status: 500 });
  }
} 