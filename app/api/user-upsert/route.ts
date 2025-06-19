import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
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

    let body: any = {};
    try { body = await req.json(); } catch {}
    const username = body?.username || user.user_metadata?.username || user.email?.split('@')[0];
    const avatar_url = body?.avatar_url || user.user_metadata?.avatar_url || null;
    const subscription_status = body?.subscription_status || null;
    const notification_preferences = body?.notification_preferences || null;
    const now = new Date().toISOString();

    const { error: upsertError } = await supabase.from('users').upsert([
      {
        id: user.id,
        email: user.email,
        username,
        avatar_url,
        subscription_status,
        notification_preferences,
        updated_at: now,
        // created_at is handled by default value in schema
      }
    ], { onConflict: 'id' });

    if (upsertError) {
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Unexpected error" }, { status: 500 });
  }
} 