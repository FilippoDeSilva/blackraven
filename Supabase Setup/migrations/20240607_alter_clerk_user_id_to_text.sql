-- Migration: Change clerk_user_id from uuid to text in users, files, and subscriptions tables
ALTER TABLE public.users ALTER COLUMN clerk_user_id TYPE text USING clerk_user_id::text;
ALTER TABLE public.files ALTER COLUMN clerk_user_id TYPE text USING clerk_user_id::text;
ALTER TABLE public.subscriptions ALTER COLUMN clerk_user_id TYPE text USING clerk_user_id::text;
