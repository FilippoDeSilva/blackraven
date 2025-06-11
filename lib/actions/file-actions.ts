"use server"

import { revalidatePath } from "next/cache"
import { hashPassword, comparePasswords } from "@/lib/utils/bcrypt"
import { z } from "zod"
import { getSupabaseServerActionClient, getAuthenticatedUser, handleActionError, ActionError } from '@/lib/actions/utils';
import { fileUploadPayloadSchema, deactivateFileSchema, launchProcessSchema, fileIdSchema } from '@/lib/validations/common';

// Hash passphrase with bcrypt
async function hashPassphrase(passphrase: string): Promise<string> {
  return hashPassword(passphrase)
}

// Verify passphrase against stored hash with bcrypt
export async function verifyPassphrase(storedHash: string, passphrase: string): Promise<boolean> {
  return comparePasswords(passphrase, storedHash)
}

// Upload files and create scheduled transfer
export async function createFileTransfer(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    const file = formData.get('file');
    const filename = formData.get('filename');
    const message = formData.get('message');
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    const recipientsRaw = formData.get('recipients'); // Capture raw string
    const deactivation_passphrase = formData.get('deactivation_passphrase');

    console.log("[createFileTransfer] Raw recipients from FormData (string):", recipientsRaw);

    let parsedRecipients = {};
    try {
      parsedRecipients = recipientsRaw ? JSON.parse(recipientsRaw as string) : {};
      console.log("[createFileTransfer] Parsed recipients (object):", parsedRecipients);
    } catch (parseError) {
      console.error("[createFileTransfer] Error parsing recipients JSON:", parseError);
      throw new ActionError("Invalid recipients data format.", 400, "INVALID_RECIPIENTS_FORMAT");
    }

    // Construct an object for Zod validation
    const inputData = {
      files: file instanceof Blob ? [{ name: filename as string, size: file.size, type: file.type }] : [],
      message: message as string,
      startDate: startDate as string,
      endDate: endDate as string,
      recipients: parsedRecipients, // Use the parsed object
      deactivationPassphrase: deactivation_passphrase as string,
    };

    // Validate input using Zod schema
    console.log("[createFileTransfer] Input data for Zod validation:", JSON.stringify(inputData, null, 2));
    const validatedData = fileUploadPayloadSchema.parse(inputData);
    console.log("[createFileTransfer] Validated Data (Zod):", JSON.stringify(validatedData, null, 2));

    if (!(file instanceof Blob)) {
      throw new ActionError('File is required and must be a Blob/File.', 400);
    }

    const supabase = await getSupabaseServerActionClient();

    // Upload file to Supabase Storage
    console.log("[createFileTransfer] Attempting to upload file to storage...");
    const { data: fileData, error: fileError } = await supabase.storage
      .from("files")
      .upload(`${user.id}/${Date.now()}-${validatedData.files[0].name}`, file);

    if (fileError) {
      console.error("Error uploading file:", fileError);
      throw new ActionError("Failed to upload file", 500, fileError.message);
    }
    console.log("[createFileTransfer] File uploaded to storage:", fileData.path);

    console.log("[createFileTransfer] Deactivation passphrase data before hashing:", validatedData.deactivationPassphrase);
    const hashedPassphrase = await hashPassphrase(validatedData.deactivationPassphrase);
    console.log("[createFileTransfer] Passphrase hashed:", hashedPassphrase);

    console.log("[createFileTransfer] Attempting to insert transfer record into file_transfers table...");
    const { data: transferData, error: transferError } = await supabase
      .from("file_transfers")
      .insert({
        user_id: user.id,
        file_path: fileData.path,
        filename: validatedData.files[0].name,
        message: validatedData.message,
        start_date: validatedData.startDate,
        end_date: validatedData.endDate,
        recipients: validatedData.recipients,
        deactivation_passphrase: hashedPassphrase,
        status: "pending",
      })
      .select()
      .single();

    if (transferError) {
      console.error("Error creating transfer:", transferError);
      await supabase.storage.from("files").remove([fileData.path]); // Clean up uploaded file
      throw new ActionError("Failed to create transfer record", 500, transferError.message);
    }
    console.log("[createFileTransfer] Transfer record created successfully:", transferData);

    revalidatePath('/dashboard'); // Revalidate path after successful creation
    return { success: true, data: transferData };
  } catch (error) {
    console.error("[createFileTransfer] Caught error during file transfer creation:", error);
    return handleActionError(error);
  }
}

// Deactivate a scheduled file transfer
export async function deactivateFile(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await getSupabaseServerActionClient();

    const data = deactivateFileSchema.parse({
      fileId: formData.get('fileId'),
      deactivationPass: formData.get('deactivationPass'),
    });

    const { data: transfer, error: fetchError } = await supabase
      .from("file_transfers")
      .select("file_path, deactivation_passphrase") // Select file_path to delete the file
      .eq("id", data.fileId)
      .eq('user_id', user.id) // Ensure only owner can deactivate
      .single();

    if (fetchError || !transfer) {
      throw new ActionError("Transfer not found or not owned by user", 404);
    }

    const isValid = await comparePasswords(data.deactivationPass, transfer.deactivation_passphrase);
    if (!isValid) {
      throw new ActionError("Invalid passphrase", 403);
    }

    // Delete the file from Supabase Storage
    if (transfer.file_path) {
      console.log(`[deactivateFile] Attempting to delete file from storage: ${transfer.file_path}`);
      const { error: deleteFileError } = await supabase.storage
        .from("files") // Assuming your bucket is named 'files'
        .remove([transfer.file_path]);

      if (deleteFileError) {
        console.error("Error deleting file from storage:", deleteFileError);
        // Depending on criticality, you might throw an error or just log it.
        // For now, we'll log and continue to update transfer status.
      } else {
        console.log(`[deactivateFile] File successfully deleted from storage: ${transfer.file_path}`);
      }
    }

    const { error: updateError } = await supabase
      .from("file_transfers")
      .update({ status: "cancelled" })
      .eq("id", data.fileId);

    if (updateError) {
      console.error("Error updating transfer:", updateError);
      throw new ActionError("Failed to deactivate transfer", 500, updateError.message);
    }

    revalidatePath('/dashboard'); // Revalidate path after deactivation
    return { success: true, message: "File deactivated and deleted successfully." };
  } catch (error) {
    return handleActionError(error);
  }
}

// Get user's scheduled file transfers
export async function getScheduledTransfers() {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await getSupabaseServerActionClient();

    const { data, error } = await supabase
      .from("file_transfers")
      .select("*")
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching scheduled transfers:", error);
      throw new ActionError("Failed to fetch scheduled transfers", 500, error.message);
    }

    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}

// List all files owned by the authenticated user
export async function listFiles() {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await getSupabaseServerActionClient();

    const { data, error } = await supabase
      .from('files') // Assuming 'files' is the table storing general file metadata, distinct from 'file_transfers'
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching files:", error);
      throw new ActionError("Failed to fetch files", 500, error.message);
    }

    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}

// Launch a process for a file
export async function launchFileProcess(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await getSupabaseServerActionClient();

    const data = launchProcessSchema.parse({
      fileId: formData.get('fileId'),
    });

    // Check file ownership (critical for security)
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', data.fileId)
      .eq('user_id', user.id)
      .single();

    if (fileError || !file) {
      throw new ActionError("File not found or not owned by user", 404);
    }

    // TODO: Implement your actual file processing logic here.
    // This might involve: queuing a job, triggering an external service, or direct database updates.
    // For now, it's a placeholder.

    // Example: Update file status to 'processing' (replace with actual logic)
    const { error: updateError } = await supabase
      .from('files')
      .update({ status: 'processing' })
      .eq('id', data.fileId);

    if (updateError) {
      console.error("Error updating file status:", updateError);
      throw new ActionError("Failed to launch file process", 500, updateError.message);
    }

    revalidatePath('/dashboard'); // Revalidate path after process launch
    return { success: true, message: 'File process initiated successfully.' };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteScheduledTransferAndFile(transferId: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await getSupabaseServerActionClient();

    // First, fetch the transfer to get the file_path and ensure ownership
    const { data: transfer, error: fetchError } = await supabase
      .from('file_transfers')
      .select('file_path')
      .eq('id', transferId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !transfer) {
      throw new ActionError("Transfer not found or not owned by user", 404);
    }

    // Delete the file from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('files') // Assuming your storage bucket is named 'files'
      .remove([transfer.file_path]);

    if (storageError) {
      console.error("Error deleting file from storage:", storageError);
      // Decide if you want to proceed with database deletion even if file storage deletion fails
      throw new ActionError("Failed to delete file from storage", 500, storageError.message);
    }

    // Then, delete the transfer record from the database
    const { error: dbError } = await supabase
      .from('file_transfers')
      .delete()
      .eq('id', transferId)
      .eq('user_id', user.id); // Double check ownership for deletion

    if (dbError) {
      console.error("Error deleting transfer record:", dbError);
      throw new ActionError("Failed to delete transfer record", 500, dbError.message);
    }

    revalidatePath('/dashboard'); // Revalidate path after deletion
    return { success: true, message: 'File transfer and associated file deleted successfully.' };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function sendScheduledTransferNow(transferId: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await getSupabaseServerActionClient();

    // Fetch the transfer to ensure ownership and status
    const { data: transfer, error: fetchError } = await supabase
      .from('file_transfers')
      .select('*')
      .eq('id', transferId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !transfer) {
      throw new ActionError("Transfer not found or not owned by user", 404);
    }

    if (transfer.status !== 'pending') {
      throw new ActionError("Transfer is not in a pending state.", 400);
    }

    // TODO: Implement the actual logic to send the file transfer immediately.
    // This might involve calling an internal service, a background function, etc.
    // For now, update the status to 'sent' and log a message.

    const { error: updateError } = await supabase
      .from('file_transfers')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', transferId);

    if (updateError) {
      console.error("Error updating transfer status to sent:", updateError);
      throw new ActionError("Failed to mark transfer as sent", 500, updateError.message);
    }

    revalidatePath('/dashboard'); // Revalidate path after action
    return { success: true, message: 'File transfer sent successfully.' };
  } catch (error) {
    return handleActionError(error);
  }
}
