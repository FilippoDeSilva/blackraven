import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { ServerActionResult } from "./utils";
import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export async function uploadProfileImage(formData: FormData): Promise<ServerActionResult<string>> {
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, error: "No file provided." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File size exceeds 5MB limit." };
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { success: false, error: "Invalid file type. Only images (jpeg, png, webp, gif) are allowed." };
  }

  const supabase = createServerActionClient({ cookies });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated." };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  try {
    // 1. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars") // Ensure you have a bucket named 'avatars'
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // 2. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 3. Update user metadata in Auth
    const { error: updateAuthError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    if (updateAuthError) {
      console.error("Supabase Auth Update Error:", updateAuthError);
      return { success: false, error: `Failed to update user profile: ${updateAuthError.message}` };
    }

    // 4. Update user in the public 'users' table (if it exists)
    // This is optional, depending on your schema. If you have a separate 'users' table
    // for additional profile information, update it here.
    const { error: profileUpdateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.warn("Warning: Error updating user profile in 'users' table. This might be expected if the table doesn't exist or RLS prevents it.", profileUpdateError);
      // Do not block success if auth metadata update was successful
    }

    return { success: true, data: publicUrl };
  } catch (error: any) {
    console.error("Unexpected error during profile image upload:", error);
    return { success: false, error: `An unexpected error occurred: ${error.message}` };
  }
} 