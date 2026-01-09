-- =====================================================
-- ADD ADDITIONAL PROFILE FIELDS
-- Thêm các trường bổ sung cho profiles table
-- =====================================================

-- 1. Thêm các trường mới cho profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS date_of_birth text,
ADD COLUMN IF NOT EXISTS reputation_points integer DEFAULT 0;

-- 2. Tạo index cho các trường mới
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_reputation_points ON public.profiles(reputation_points);

-- 3. Cập nhật RLS policies để cho phép user update các trường mới
-- Policy đã có sẵn "Users can update own profile" sẽ cover các trường mới

-- 4. Tạo function để validate phone number (optional)
CREATE OR REPLACE FUNCTION validate_phone_number(phone_input text)
RETURNS boolean AS $$
BEGIN
  -- Simple validation: check if phone contains only digits, spaces, +, -, (, )
  IF phone_input IS NULL OR phone_input = '' THEN
    RETURN true; -- Allow empty phone
  END IF;
  
  -- Check if phone matches basic pattern
  RETURN phone_input ~ '^[\+]?[0-9\s\-\(\)]{8,15}$';
END;
$$ LANGUAGE plpgsql;

-- 5. Add check constraint for phone validation (optional)
-- ALTER TABLE public.profiles 
-- ADD CONSTRAINT check_phone_format 
-- CHECK (validate_phone_number(phone));

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION validate_phone_number(text) TO authenticated;

-- =====================================================
-- COMPLETED! 🎉
-- - Thêm phone, location, bio, date_of_birth, reputation_points
-- - Tạo indexes cho performance
-- - Thêm validation function cho phone
-- - RLS policies đã cover các trường mới
-- =====================================================