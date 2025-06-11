import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Define a type for the cookie store, explicitly as a Promise to satisfy TypeScript's inference
type CookieStoreType = Promise<ReturnType<typeof cookies>>;

// Creates a Supabase client configured to use cookies from a provided cookie store (which TypeScript infers as a Promise)
export function createSupabaseClientFromCookies(cookieStore: CookieStoreType) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          const store = await cookieStore;
          return store.get(name)?.value;
        },
        set: async (name: string, value: string, options: CookieOptions) => {
          try {
            const store = await cookieStore;
            store.set(name, value, options);
          } catch (error) {
            console.warn('Failed to set cookie within server client (possibly called from non-server context):', error);
          }
        },
        remove: async (name: string, options: CookieOptions) => {
          try {
            const store = await cookieStore;
            store.delete(name);
          } catch (error) {
            console.warn('Failed to remove cookie within server client (possibly called from non-server context):', error);
          }
        },
      },
    },
  );
}

// New function for Route Handlers
export async function getSupabaseRouteHandlerClient() {
  const cookieStore = await cookies(); // Explicitly await cookies() here to get the resolved object
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          const store = await cookieStore;
          return store.get(name)?.value;
        },
        set: async (name: string, value: string, options: CookieOptions) => {
          const store = await cookieStore;
          store.set(name, value, options);
        },
        remove: async (name: string) => {
          const store = await cookieStore;
          store.delete(name);
        },
      },
    }
  );
} 