import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  console.log("[middleware] Incoming request:", req.nextUrl.pathname)
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  let user = null
  try {
    // Try to refresh the session if it exists
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.log("[middleware] Session error:", sessionError)
    } else if (session) {
      // If session exists, try to refresh it
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.log("[middleware] Session refresh error:", refreshError)
      }
    }

    // Get the user after potential refresh
    const { data } = await supabase.auth.getUser()
    user = data.user
    console.log("[middleware] Supabase user:", user)
  } catch (err) {
    console.log("[middleware] Error fetching user:", err)
  }

  const protectedPaths = ["/dashboard"]
  const isProtected = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path))
  const isLogin = req.nextUrl.pathname === "/login"
  console.log("[middleware] isProtected:", isProtected, "isLogin:", isLogin)

  if (isLogin && user) {
    const redirectTo = req.nextUrl.searchParams.get("redirect") || "/dashboard"
    console.log("[middleware] Authenticated user on /login, redirecting to:", redirectTo)
    return NextResponse.redirect(new URL(redirectTo, req.url))
  }

  if (isProtected && !user) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname)
    console.log("[middleware] Unauthenticated user on protected route, redirecting to:", redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)
  }

  console.log("[middleware] No redirect, returning response")
  return res
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/login"],
}