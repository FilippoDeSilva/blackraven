"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signOutAction() {
  // This would typically involve invalidating the session on the server
  // For Supabase, simply removing cookies would be sufficient if not using the client in SSR
  // For a more robust solution, you'd call a Supabase function to sign out on the server

  const cookieStore = cookies();
  cookieStore.delete('sb-access-token');
  cookieStore.delete('sb-refresh-token');
  redirect("/login");
} 