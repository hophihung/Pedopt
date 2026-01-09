-- =====================================================
-- ADD PET VERIFICATION SYSTEM
-- Thêm hệ thống xác minh pet bởi admin
-- =====================================================

-- 1. Thêm cột verification cho pets table
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS verification_notes text;

-- 2. Tạo index cho verification status
CREATE INDEX IF NOT EXISTS idx_pets_verification_status ON public.pets(verification_status);
CREATE INDEX IF NOT EXISTS idx_pets_verified_at ON public.pets(verified_at);

-- 3. Tạo function để approve pet
CREATE OR REPLACE FUNCTION approve_pet(
  pet_id uuid,
  admin_id uuid,
  notes text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  admin_role text;
BEGIN
  -- Kiểm tra admin có quyền không
  SELECT role INTO admin_role
  FROM profiles
  WHERE id = admin_id;
  
  IF admin_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can approve pets';
  END IF;
  
  -- Update pet verification
  UPDATE pets
  SET 
    verification_status = 'approved',
    verified_at = NOW(),
    verified_by = admin_id,
    verification_notes = notes
  WHERE id = pet_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Tạo function để reject pet
CREATE OR REPLACE FUNCTION reject_pet(
  pet_id uuid,
  admin_id uuid,
  notes text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  admin_role text;
BEGIN
  -- Kiểm tra admin có quyền không
  SELECT role INTO admin_role
  FROM profiles
  WHERE id = admin_id;
  
  IF admin_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can reject pets';
  END IF;
  
  -- Update pet verification
  UPDATE pets
  SET 
    verification_status = 'rejected',
    verified_at = NOW(),
    verified_by = admin_id,
    verification_notes = notes
  WHERE id = pet_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Tạo view để lấy pets đã verified
CREATE OR REPLACE VIEW verified_pets AS
SELECT 
  p.*,
  pr.full_name as seller_name,
  pr.avatar_url as seller_avatar,
  pr.reputation_points,
  admin_pr.full_name as verified_by_name
FROM pets p
LEFT JOIN profiles pr ON p.seller_id = pr.id
LEFT JOIN profiles admin_pr ON p.verified_by = admin_pr.id
WHERE p.verification_status = 'approved'
  AND p.is_available = true;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION approve_pet(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_pet(uuid, uuid, text) TO authenticated;
GRANT SELECT ON verified_pets TO authenticated;

-- 7. Update existing pets to approved (for backward compatibility)
UPDATE pets 
SET verification_status = 'approved', verified_at = NOW()
WHERE verification_status = 'pending' AND created_at < NOW() - INTERVAL '1 day';

-- =====================================================
-- COMPLETED! 🎉
-- Pet verification system is ready
-- - Added verification_status, verified_at, verified_by, verification_notes columns
-- - Created approve_pet and reject_pet functions for admins
-- - Created verified_pets view
-- - Updated existing pets to approved status
-- =====================================================