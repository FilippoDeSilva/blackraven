ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;



-- Users can only see/update their own user row
CREATE POLICY "Users can access their own row" ON public.users
  USING (auth_user_id = auth.uid());

-- Users can only access their own files
CREATE POLICY "Users can access their own files" ON public.files
  USING (auth_user_id = auth.uid());

-- Users can only access their own subscriptions
CREATE POLICY "Users can access their own subscriptions" ON public.subscriptions
  USING (auth_user_id = auth.uid());




-- Supabase Storage Policy for files bucket
-- Only allow users to access files in their own folder (named after their Supabase user ID)
CREATE POLICY "Users can access their own files" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'files' AND storage.objects.name LIKE auth.uid() || '/%'
  );
