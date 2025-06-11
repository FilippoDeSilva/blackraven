'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getSupabaseServerActionClient, encodedRedirect, handleActionError, ActionError } from '@/lib/actions/utils';
import { loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/common';
import { uploadProfilePicture } from "@/lib/actions/user";

export const signUpAction = async (formData: FormData) => {
  try {
    const data = signupSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      username: formData.get('username'),
    });

    const profilePictureFile = formData.get('profilePicture') as File | null;

    const supabase = await getSupabaseServerActionClient();
    const origin = (await headers()).get('origin');
    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` : `${origin}/auth/callback`;

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectTo,
        data: { username: data.username },
      },
    });

    console.log("[signUpAction] Supabase signUp response authData:", authData);

    if (error) {
      console.error('[signUpAction Error]', error.code, error.message);
      throw new ActionError(error.message, 400, error.code);
    }

    if (authData?.user) {
      let avatarUrl = null;
      const { id, email: userEmailRaw, user_metadata } = authData.user;
      const userEmail = userEmailRaw || '';
      const username = (user_metadata?.username as string) || data.username || userEmail.split('@')[0];
      const nameForAvatar = username.charAt(0).toUpperCase();

      if (profilePictureFile && profilePictureFile.size > 0) {
        console.log(`[signUpAction] Attempting to upload profile picture for user ${id}...`);
        const uploadResult = await uploadProfilePicture(profilePictureFile);
        if (uploadResult.success) {
          avatarUrl = uploadResult.url;
          console.log("[signUpAction] Profile picture uploaded successfully:", avatarUrl);
        } else {
          console.error("[signUpAction] Error uploading profile picture:", uploadResult.error);
          avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=random&color=fff&size=128`;
        }
      } else {
        console.log("[signUpAction] No profile picture provided, generating default avatar URL.");
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=random&color=fff&size=128`;
      }

      console.log("[signUpAction] Attempting to upsert user into public.users table with avatar_url...", avatarUrl);
      const { error: upsertError } = await supabase.from('users').upsert([
        {
          id: id,
          email: userEmail,
          username: username || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'id' });

      if (upsertError) {
        console.error('[signUpAction Upsert User Error]', upsertError.message);
      } else {
        console.log("[signUpAction] User upserted successfully into public.users table.");
      }
    }

    return encodedRedirect(
      'success',
      '/verify-email',
      'Thanks for signing up! Please check your email for a verification link.',
    );
  } catch (error) {
    return handleActionError(error);
  }
};

export const signInAction = async (formData: FormData) => {
  try {
    const data = loginSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const supabase = await getSupabaseServerActionClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    console.log("[signInAction] Supabase signInWithPassword response authData:", authData);

    if (error) {
      console.error('[signInAction Error]', error.code, error.message);
      throw new ActionError(error.message, 401, error.code);
    }

    if (authData?.user) {
      console.log("[signInAction] Attempting to upsert user into public.users table...");
      const { id, email: userEmailRaw, user_metadata } = authData.user;
      const userEmail = String(userEmailRaw || '');
      
      const usernameFromEmail = userEmail.split('@')[0];
      const metadata = user_metadata as Record<string, any> | undefined;
      const username = String(metadata?.username || usernameFromEmail);

      const { data: existingPublicUser, error: fetchUserError } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', id)
        .single();

      let finalAvatarUrl = null;

      if (fetchUserError && fetchUserError.code !== 'PGRST116') {
        console.error("[signInAction] Error fetching existing public user for avatar check:", fetchUserError.message);
        finalAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username.charAt(0).toUpperCase())}&background=random&color=fff&size=128`;
      } else if (existingPublicUser?.avatar_url) {
        finalAvatarUrl = existingPublicUser.avatar_url;
        console.log("[signInAction] Existing avatar_url found for user:", finalAvatarUrl);
      } else {
        console.log("[signInAction] No existing avatar_url found, generating default.");
        finalAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username.charAt(0).toUpperCase())}&background=random&color=fff&size=128`;
      }

      const { error: upsertError } = await supabase.from('users').upsert([
        {
          id: id,
          email: userEmail,
          username: username || null,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'id' });

      if (upsertError) {
        console.error('[signInAction Upsert User Error]', upsertError.message);
      } else {
        console.log("[signInAction] User upserted successfully into public.users table with avatar_url.");
      }
    }

    return encodedRedirect('success', '/dashboard', 'Signed in successfully.');
  } catch (error) {
    return handleActionError(error);
  }
};

export const signInWithOtpAction = async (formData: FormData) => {
  try {
    const email = formData.get('email');
    const parsedEmail = z.string().email().parse(email);

    const supabase = await getSupabaseServerActionClient();
    const origin = (await headers()).get('origin');
    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` : `${origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email: parsedEmail,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error('[signInWithOtpAction Error]', error.code, error.message);
      throw new ActionError(error.message, 400, error.code);
    }

    return encodedRedirect(
      'success',
      '/login',
      'Check your email for a magic link to sign in.',
    );
  } catch (error) {
    return handleActionError(error);
  }
};

export const signUpWithMagicLinkAction = async (formData: FormData) => {
  try {
    const email = formData.get('email');
    const username = formData.get('username');
    const parsedEmail = z.string().email().parse(email);
    const parsedUsername = z.string().optional().parse(username);

    const supabase = await getSupabaseServerActionClient();
    const origin = (await headers()).get('origin');
    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` : `${origin}/auth/callback`;

    const { data: authData, error } = await supabase.auth.signInWithOtp({
      email: parsedEmail,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
        data: { username: parsedUsername },
      },
    });

    console.log("[signUpWithMagicLinkAction] Supabase signInWithOtp response authData:", authData);

    if (error) {
      console.error('[signUpWithMagicLinkAction Error]', error.code, error.message);
      throw new ActionError(error.message, 400, error.code);
    }

    if (authData?.user) {
      const { id, email: userEmailRaw, user_metadata } = authData.user;
      const userEmail = String(userEmailRaw || '');

      const usernameFromEmail = userEmail.split('@')[0];
      const metadata = user_metadata as Record<string, any> | undefined;
      const nameForAvatarSource = String(metadata?.username || parsedUsername || usernameFromEmail);
      const nameForAvatar = nameForAvatarSource.charAt(0).toUpperCase();

      let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=random&color=fff&size=128`;

      console.log("[signUpWithMagicLinkAction] Attempting to upsert user into public.users table with avatar_url...");
      const { error: upsertError } = await supabase.from('users').upsert([
        {
          id: id,
          email: userEmail,
          username: parsedUsername || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (upsertError) {
        console.error('[signUpWithMagicLinkAction Upsert User Error]', upsertError.message);
      } else {
        console.log("[signUpWithMagicLinkAction] User upserted successfully into public.users table.");
      }
    }

    return encodedRedirect(
      'success',
      '/verify-email',
      'Thanks for signing up! Please check your email for a verification link.',
    );
  } catch (error) {
    return handleActionError(error);
  }
};

export const forgotPasswordAction = async (formData: FormData) => {
  try {
    const data = forgotPasswordSchema.parse({
      email: formData.get('email'),
    });

    const supabase = await getSupabaseServerActionClient();
    const origin = (await headers()).get('origin');

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
    });

    if (error) {
      console.error('[forgotPasswordAction Error]', error.code, error.message);
      throw new ActionError(error.message, 400, error.code);
    }

    return encodedRedirect(
      'success',
      '/forgot-password',
      'Check your email for a link to reset your password.',
    );
  } catch (error) {
    return handleActionError(error);
  }
};

export const resetPasswordAction = async (formData: FormData) => {
  try {
    const data = resetPasswordSchema.parse({
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    const supabase = await getSupabaseServerActionClient();

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      console.error('[resetPasswordAction Error]', error.code, error.message);
      throw new ActionError(error.message, 400, error.code);
    }

    return encodedRedirect('success', '/protected/reset-password', 'Password updated successfully.');
  } catch (error) {
    return handleActionError(error);
  }
};

export const signOutAction = async () => {
  try {
    const supabase = await getSupabaseServerActionClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[signOutAction Error]', error.code, error.message);
      throw new ActionError(error.message, 500, error.code);
    }
    return redirect('/login');
  } catch (error) {
    return handleActionError(error);
  }
};

