-- Migration: Safely change clerk_user_id from uuid to text in users, files, and subscriptions tables, update foreign keys, and fix RLS policies for Clerk integration

-- 1. Drop RLS policies
DROP POLICY IF EXISTS "Users can access their own row" ON public.users;
DROP POLICY IF EXISTS "Users can access their own files" ON public.files;
DROP POLICY IF EXISTS "Users can access their own subscriptions" ON public.subscriptions;

-- 2. Drop foreign key constraints
ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_clerk_user_id_fkey;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_clerk_user_id_fkey;

-- 3. Change clerk_user_id column type from uuid to text
ALTER TABLE public.users ALTER COLUMN clerk_user_id TYPE text USING clerk_user_id::text;
ALTER TABLE public.files ALTER COLUMN clerk_user_id TYPE text USING clerk_user_id::text;
ALTER TABLE public.subscriptions ALTER COLUMN clerk_user_id TYPE text USING clerk_user_id::text;

-- 4. Re-add foreign key constraints (now as text)
ALTER TABLE public.files
  ADD CONSTRAINT files_clerk_user_id_fkey FOREIGN KEY (clerk_user_id) REFERENCES public.users(clerk_user_id);

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_clerk_user_id_fkey FOREIGN KEY (clerk_user_id) REFERENCES public.users(clerk_user_id);

-- 5. Recreate RLS policies, casting auth.uid() to text
CREATE POLICY "Users can access their own row" ON public.users
  USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "Users can access their own files" ON public.files
  USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "Users can access their own subscriptions" ON public.subscriptions
  USING (clerk_user_id = auth.uid()::text);
