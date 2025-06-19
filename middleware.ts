import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Exclude public routes and static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/complete-profile") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  // Only protect /dashboard and subroutes (customize as needed)
  if (pathname.startsWith("/dashboard")) {
    // Allow access if session_id is present in the query (for Stripe finalization)
    if (req.nextUrl.searchParams.has("session_id")) {
      return NextResponse.next();
    }
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const { data: profile } = await supabase
      .from("users")
      .select("username, subscription_status")
      .eq("id", user.id)
      .single();
    if (!profile?.username || profile.subscription_status !== "active") {
      return NextResponse.redirect(new URL("/complete-profile", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};