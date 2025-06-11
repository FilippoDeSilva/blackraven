import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Simple in-memory rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(ip);

  if (!userLimit) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (userLimit.count >= MAX_REQUESTS) {
    return true;
  }

  userLimit.count++;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Defensive: check for JSON parse errors
    let body;
    try {
      body = await req.json();
    } catch (jsonErr) {
      console.error('[OAUTH] Failed to parse JSON body:', jsonErr);
      return NextResponse.json(
        { error: 'Malformed request body.' },
        { status: 400 }
      );
    }

    console.log('[OAUTH] Request body:', body);
    const { provider, redirectTo } = body || {};

    if (!provider) {
      console.error('[OAUTH] Missing provider in request body:', body);
      return NextResponse.json(
        { error: 'Missing provider.' },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ['google', 'github'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider.' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieStore }
    );

    console.log('[OAUTH] Supabase SSR client created');

    let data, error;
    try {
      ({ data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || process.env.NEXT_PUBLIC_SUPABASE_OAUTH_REDIRECT_URL,
        },
      }));
    } catch (oauthErr) {
      console.error('[OAUTH] signInWithOAuth threw:', oauthErr);
      return NextResponse.json(
        { error: 'OAuth call failed.' },
        { status: 500 }
      );
    }

    console.log('[OAUTH] signInWithOAuth result:', { data, error });

    if (error) {
      console.error('[OAUTH] signInWithOAuth error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data?.url) {
      console.error('[OAUTH] No URL returned from signInWithOAuth:', data);
      return NextResponse.json(
        { error: 'OAuth provider URL missing.' },
        { status: 500 }
      );
    }

    // Let middleware handle session cookies
    return NextResponse.json({ url: data.url });
  } catch (err: any) {
    // Print the error as string for maximum visibility
    console.error('[OAUTH] Unexpected error:', err?.stack || String(err));
    return NextResponse.json(
      { error: 'An unexpected server error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
