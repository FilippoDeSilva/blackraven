import { NextRequest } from "next/server";
import { cookies } from 'next/headers';
import { errorResponse, successResponse } from '@/lib/api/utils';
import { getSupabaseServerActionClient } from "@/lib/actions/utils";

export async function GET(req: NextRequest) {
  try {
    // Validate the secret key
    const authHeader = req.headers.get('authorization');
    if (!authHeader || authHeader.split(' ')[1] !== process.env.CRON_SECRET) {
      return errorResponse('Unauthorized', 401);
    }

    console.log("Cron job triggered. Checking for due transfers...");

    const supabase = await getSupabaseServerActionClient();

    // Query for pending transfers where the end_date is in the past or now
    const { data: dueTransfers, error } = await supabase
      .from('file_transfers')
      .select('*')
      .eq('status', 'pending')
      .lte('end_date', new Date().toISOString());

    if (error) {
      console.error("Error fetching due transfers:", error);
      return errorResponse('Failed to fetch due transfers', 500);
    }

    console.log(`Found ${dueTransfers.length} transfers due for processing.`);

    // Process each due transfer
    for (const transfer of dueTransfers) {
      console.log(`Processing transfer ID: ${transfer.id} for file: ${transfer.filename}`);

      // TODO: Implement actual file sending logic here or call a service
      // You would likely download the file from storage and send it to recipients
      // await sendFileTransfer(transfer);

      // Update transfer status to 'sent' or 'completed'
      const { error: updateError } = await supabase
        .from('file_transfers')
        .update({ status: 'sent' })
        .eq('id', transfer.id);

      if (updateError) {
        console.error(`Error updating status for transfer ID ${transfer.id}:`, updateError);
      } else {
        console.log(`Successfully updated status for transfer ID ${transfer.id}.`);
      }
    }

    return successResponse({ message: `Processed ${dueTransfers.length} due transfers.` });
  } catch (error) {
    console.error("Unexpected error during cron job execution:", error);
    return errorResponse('Internal server error', 500);
  }
} 