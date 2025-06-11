import type { User } from '@supabase/supabase-js';
import DashboardClient from './dashboard-client';
import { AuthProvider } from '@/components/auth-provider';
import { NotificationProvider } from '@/contexts/notification-context';
import { getScheduledTransfers, createFileTransfer } from '@/lib/actions/file-actions';
import { createStripeCheckoutSession } from '@/lib/actions/stripe-actions';
import { getSupabaseServerActionClient, ServerActionResult } from '@/lib/actions/utils';

export default async function DashboardPage() {
  const supabase = await getSupabaseServerActionClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('users') // Assuming your public profile table is named 'users'
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error("Error fetching user profile for avatar:", profileError);
    } else if (profile?.avatar_url) {
      avatarUrl = profile.avatar_url;
    }
  }

  const scheduledTransfersResult: ServerActionResult<any[]> = await getScheduledTransfers();
  const scheduledTransfers = (scheduledTransfersResult.success && scheduledTransfersResult.data) ? scheduledTransfersResult.data : [];

  return (
    <AuthProvider>
      <NotificationProvider>
        <DashboardClient 
          user={user} 
          initialScheduledTransfers={scheduledTransfers}
          createFileTransferAction={createFileTransfer}
          createStripeCheckoutSessionAction={createStripeCheckoutSession as (priceId: string) => Promise<ServerActionResult<{ url?: string | null; error?: any; }>>}
          avatarUrl={avatarUrl}
        />
      </NotificationProvider>
    </AuthProvider>
  );
}
