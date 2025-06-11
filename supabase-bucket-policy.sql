-- Supabase Storage Policy for files bucket
-- Only allow users to access files in their own folder (named after their Clerk user ID)
CREATE POLICY "Users can access their own files" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'files' AND storage.objects.name LIKE auth.uid() || '/%'
  );
