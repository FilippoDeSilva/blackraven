import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

type CookieToSet = { name: string; value: string; options?: any };
type CookieToDelete = { name: string; options?: any };

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    // Cookie adapter for Supabase SSR (Next.js 14+)
    const cookieAdapter = {
      getAll: (): { name: string; value: string }[] => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
      setAll: (cookiesToSet: CookieToSet[]) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set({ name, value, ...options });
        });
      },
      deleteAll: (cookiesToDelete: CookieToDelete[]) => {
        cookiesToDelete.forEach(({ name, options }) => {
          cookieStore.delete({ name, ...options });
        });
      },
    };

    // Create Supabase client with cookie adapter
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieAdapter }
    );

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }

    // Parse file from form-data
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type and size
    if (!(file instanceof Blob) || !("size" in file) || !("type" in file)) {
      return NextResponse.json({ success: false, error: "Invalid file object" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "File size exceeds 5MB limit." }, { status: 400 });
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Invalid file type. Only images (jpeg, png, webp, gif) are allowed." }, { status: 400 });
    }

    // Generate file path
    const fileExt = file.type.split("/").pop() || "jpg";
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) {
      return NextResponse.json({ success: false, error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL (or use signed URL for private buckets)
    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = publicUrlData.publicUrl;

    // Update user metadata in Auth
    const { error: updateAuthError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });
    if (updateAuthError) {
      return NextResponse.json({ success: false, error: `Failed to update user profile: ${updateAuthError.message}` }, { status: 500 });
    }

    // Optionally update users table (if exists)
    await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);

    return NextResponse.json({ success: true, data: publicUrl });
  } catch (error: any) {
    console.error("[API] upload-profile-image error:", error);
    return NextResponse.json({ success: false, error: error.message || "Unexpected error" }, { status: 500 });
  }
}

//GET USER PROFILE
export async function GET(req: NextRequest) {
    try {
      const cookieStore = await cookies();
      const cookieAdapter = {
        getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
        setAll: (cookiesToSet: { name: string; value: string; options?: any }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
        deleteAll: (cookiesToDelete: { name: string; options?: any }[]) => {
          cookiesToDelete.forEach(({ name, options }) => {
            cookieStore.delete({ name, ...options });
          });
        },
      };
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: cookieAdapter }
      );
  
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        console.error("[get-avatar-url] User not authenticated", userError);
        return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
      }
  
      // Log the user object for debugging
      console.log("[get-avatar-url] Authenticated user:", user);
  
      const { data: profile, error } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (error) {
        console.error("[get-avatar-url] Supabase error fetching avatar_url:", error);
        return NextResponse.json({ success: false, error: error.message, details: error }, { status: 500 });
      }
      return NextResponse.json({ success: true, avatarUrl: profile?.avatar_url || null });
    } catch (e: any) {
      console.error("[get-avatar-url] Unexpected error:", e);
      return NextResponse.json({ success: false, error: e.message || "Unexpected error" }, { status: 500 });
    }
  } 