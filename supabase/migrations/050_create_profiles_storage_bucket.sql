-- =====================================================
-- CREATE PROFILES STORAGE BUCKET
-- Tạo bucket Supabase Storage để lưu ảnh đại diện
-- =====================================================

-- 1. Tạo hoặc cập nhật bucket cho profile avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  5242880, -- 5MB limit (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Tạo RLS policies cho profiles bucket
-- Policy: Anyone can view profile images (public bucket)
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
CREATE POLICY "Anyone can view profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

-- Policy: Authenticated users can upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar images" ON storage.objects;
CREATE POLICY "Users can update their own avatar images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar images" ON storage.objects;
CREATE POLICY "Users can delete their own avatar images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- COMPLETED! 🎉
-- Profiles storage bucket is ready with 5MB file size limit
-- =====================================================