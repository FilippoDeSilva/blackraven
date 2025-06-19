// import { createSupabaseClientFromCookies } from "@/lib/supabase/utils";
// import { cookies } from "next/headers";

// interface UploadResult {
//   success: boolean;
//   error?: string;
//   url?: string;
// }

// export async function uploadProfilePicture(file: File): Promise<UploadResult> {
//   const cookieStore = await cookies();
//   const supabase = createSupabaseClientFromCookies(cookieStore);

//   const { data: { user } } = await supabase.auth.getUser();

//   if (!user) {
//     return { success: false, error: "User not authenticated." };
//   }

//   const fileExtension = file.name.split('.').pop();
//   const filePath = `${user.id}/${Date.now()}.${fileExtension}`;

//   try {
//     const { data, error } = await supabase.storage
//       .from('avatars') // Assuming you have a bucket named 'avatars'
//       .upload(filePath, file, { cacheControl: '3600', upsert: true });

//     if (error) {
//       return { success: false, error: error.message };
//     }

//     const { data: publicUrlData } = supabase.storage
//       .from('avatars')
//       .getPublicUrl(filePath);

//     if (!publicUrlData.publicUrl) {
//       return { success: false, error: "Failed to get public URL for the uploaded file." };
//     }

//     // Update the user's profile with the avatar_url
//     // Assuming a 'profiles' table with 'id' (uuid) and 'avatar_url' (text) columns
//     const { error: updateError } = await supabase
//       .from('profiles')
//       .upsert({ id: user.id, avatar_url: publicUrlData.publicUrl }, { onConflict: 'id' });

//     if (updateError) {
//       // Optionally delete the uploaded file if database update fails
//       await supabase.storage.from('avatars').remove([filePath]);
//       return { success: false, error: `Failed to update profile: ${updateError.message}` };
//     }

//     return { success: true, url: publicUrlData.publicUrl };
//   } catch (err: any) {
//     return { success: false, error: err.message || "An unknown error occurred during file upload." };
//   }
// }

// export async function getLatestAvatarUrl(userId: string): Promise<string | null> {
//   try {
//     const supabase = createSupabaseClientFromCookies(Promise.resolve(cookies()));
//     const { data: profile, error } = await supabase
//       .from('users')
//       .select('avatar_url')
//       .eq('id', userId)
//       .single();
//     if (error) {
//       return null;
//     }
//     return profile?.avatar_url || null;
//   } catch (e) {
//     return null;
//   }
// } 