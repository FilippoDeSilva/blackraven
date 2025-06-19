// "use server";

// import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
// import { cookies } from "next/headers";
// import { ServerActionResult } from "./utils";
// import { z } from "zod";

// const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
// const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

// export async function uploadProfileImage(formData: FormData): Promise<ServerActionResult<string>> {
//   console.log("[uploadProfileImage] Called");
//   console.log("[uploadProfileImage] FormData keys:", Array.from(formData.keys()));
//   const file = formData.get("file") as File;

//   if (!file) {
//     console.log("[uploadProfileImage] No file provided.");
//     return { success: false, error: "No file provided." };
//   }
//   console.log("[uploadProfileImage] File name:", file.name, "type:", file.type, "size:", file.size);

//   if (file.size > MAX_FILE_SIZE) {
//     console.log("[uploadProfileImage] File size exceeds limit:", file.size);
//     return { success: false, error: "File size exceeds 5MB limit." };
//   }

//   if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
//     console.log("[uploadProfileImage] Invalid file type:", file.type);
//     return { success: false, error: "Invalid file type. Only images (jpeg, png, webp, gif) are allowed." };
//   }

//   const supabase = createServerActionClient({ cookies });
//   console.log("[uploadProfileImage] Created Supabase client");

//   const { data: { user } } = await supabase.auth.getUser();
//   console.log("[uploadProfileImage] User:", user?.id);

//   if (!user) {
//     console.log("[uploadProfileImage] User not authenticated.");
//     return { success: false, error: "User not authenticated." };
//   }

//   const fileExt = file.name.split(".").pop();
//   const fileName = `${user.id}-${Date.now()}.${fileExt}`;
//   const filePath = `avatars/${fileName}`;
//   console.log("[uploadProfileImage] Uploading to:", filePath);

//   try {
//     // 1. Upload to Supabase Storage
//     const { data: uploadData, error: uploadError } = await supabase.storage
//       .from("avatars")
//       .upload(filePath, file, {
//         cacheControl: "3600",
//         upsert: false,
//       });
//     console.log("[uploadProfileImage] Upload result:", uploadData, uploadError);

//     if (uploadError) {
//       console.error("[uploadProfileImage] Supabase Storage Upload Error:", uploadError);
//       return { success: false, error: `Upload failed: ${uploadError.message}` };
//     }

//     // 2. Get public URL
//     const { data: publicUrlData } = supabase.storage
//       .from("avatars")
//       .getPublicUrl(filePath);
//     const publicUrl = publicUrlData.publicUrl;
//     console.log("[uploadProfileImage] Public URL:", publicUrl);

//     // 3. Update user metadata in Auth
//     const { error: updateAuthError } = await supabase.auth.updateUser({
//       data: { avatar_url: publicUrl },
//     });
//     console.log("[uploadProfileImage] Update Auth result:", updateAuthError);

//     if (updateAuthError) {
//       console.error("[uploadProfileImage] Supabase Auth Update Error:", updateAuthError);
//       return { success: false, error: `Failed to update user profile: ${updateAuthError.message}` };
//     }

//     // 4. Update user in the public 'users' table (if it exists)
//     const { error: profileUpdateError } = await supabase
//       .from('users')
//       .update({ avatar_url: publicUrl })
//       .eq('id', user.id);
//     console.log("[uploadProfileImage] Update users table result:", profileUpdateError);

//     if (profileUpdateError) {
//       console.warn("[uploadProfileImage] Warning: Error updating user profile in 'users' table. This might be expected if the table doesn't exist or RLS prevents it.", profileUpdateError);
//       // Do not block success if auth metadata update was successful
//     }

//     return { success: true, data: publicUrl };
//   } catch (error: any) {
//     console.error("[uploadProfileImage] Unexpected error during profile image upload:", error);
//     return { success: false, error: `An unexpected error occurred: ${error.message}` };
//   }
// } 