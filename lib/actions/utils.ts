import { cookies } from 'next/headers';
import { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseClientFromCookies } from '@/lib/supabase/utils';

// Define the standard return type for your Server Actions
export interface ServerActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any; // For Zod errors
}

// Custom error class for action-specific errors
export class ActionError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
  }
}

// Helper to create Supabase client for Server Actions (wraps the core utility)
export async function getSupabaseServerActionClient() {
  const cookieStore = await cookies();
  return createSupabaseClientFromCookies(cookieStore);
}

// Helper to get authenticated user in Server Actions
export async function getAuthenticatedUser(): Promise<User> {
  const supabase = await getSupabaseServerActionClient();
  console.log("[getAuthenticatedUser] Attempting to get user from Supabase...");
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    // If the error is an expected AuthSessionMissingError (e.g., after logout),
    // log it as info/debug instead of error to keep the console clean.
    if (error && (error as any).name === 'AuthSessionMissingError') {
      console.log("[getAuthenticatedUser] Auth session missing (expected during unauthenticated redirect).");
    } else {
      console.error("[getAuthenticatedUser] User authentication failed:", error);
    }
    // In a Server Action, we can directly redirect unauthenticated users
    redirect('/login?message=unauthenticated');
  }
  return user;
}

// Centralized error handling for Server Actions
export function handleActionError(error: unknown): ServerActionResult<any> {
  // Re-throw NEXT_REDIRECT errors to let Next.js handle them silently
  if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
    throw error; // Re-throw the NEXT_REDIRECT error
  }

  if (error instanceof ActionError) {
    return { success: false, error: error.message, code: error.code, data: undefined };
  }
  if (error instanceof z.ZodError) {
    // Return a more user-friendly message for validation errors
    return { success: false, error: 'Invalid input data', details: error.flatten().fieldErrors, data: undefined };
  }
  console.error('[Action Error]', error);
  return { success: false, error: 'An unexpected server error occurred.', data: undefined };
}

// Helper for consistent redirects with messages
export const encodedRedirect = (
  type: 'success' | 'error',
  pathname: string,
  message: string,
) => {
  const params = new URLSearchParams();
  params.set('type', type);
  params.set('message', message);
  redirect(`${pathname}?${params.toString()}`);
};