import { NextResponse } from "next/server"
import { sendFileNotification } from "@/lib/notifications"
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// This route would be called by a cron job to check for files that need to be sent
export async function POST(request: Request) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get("authorization")
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Get all scheduled file transfers that have reached their scheduled time
    const now = new Date().toISOString()
    const { data: transfers, error } = await supabase
      .from("file_transfers")
      .select("*")
      .eq("status", "pending")
      .lt("end_date", now)

    if (error) {
      throw error
    }

    // Process each transfer
    type FileTransfer = {
      id: string;
      recipients: Record<string, string>;
      platforms: string[];
      user_id?: string;
      // add other fields as needed
    };

    const processPromises = (transfers as FileTransfer[]).map(async (transfer) => {
      try {
        // For each platform, send to the corresponding recipient
        const recipients = transfer.recipients || {};
        const platforms = transfer.platforms || Object.keys(recipients);
        for (const platform of platforms) {
          const recipient = recipients[platform];
          if (!recipient) continue;
          // TODO: Implement platform-specific sending logic
          // Example:
          // if (platform === 'gmail') {
          //   await sendViaGmail(transfer, recipient);
          // } else if (platform === 'push') {
          //   await sendViaPush(transfer, recipient);
          // }
        }
        // Update transfer status
        await supabase.from("file_transfers").update({ status: "sent" }).eq("id", transfer.id)
        // Send notification to recipients
        await sendFileNotification(transfer, transfer.user_id || "")
        return { id: transfer.id, success: true }
      } catch (fileError) {
        console.error(`Error processing transfer ${transfer.id}:`, fileError)
        return { id: transfer.id, success: false, error: fileError }
      }
    })

    const results = await Promise.all(processPromises)

    return NextResponse.json({
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("Error in scheduled file check:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
