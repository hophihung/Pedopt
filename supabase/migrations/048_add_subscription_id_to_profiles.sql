-- =====================================================
-- ADD SUBSCRIPTION_ID TO PROFILES TABLE
-- Thêm cột subscription_id vào bảng profiles để link với subscriptions
-- =====================================================

-- 1. Thêm cột subscription_id vào bảng profiles (nếu chưa có)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL;

-- 2. Tạo index cho performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_id ON public.profiles(subscription_id);

-- 3. Cập nhật subscription_id cho existing profiles
UPDATE public.profiles 
SET subscription_id = s.id
FROM public.subscriptions s
WHERE profiles.id = s.profile_id 
  AND profiles.subscription_id IS NULL
  AND s.status = 'active';

-- 4. Tạo function để tự động update subscription_id khi tạo subscription mới
CREATE OR REPLACE FUNCTION update_profile_subscription_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Khi tạo subscription mới, update profile với subscription_id
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET subscription_id = NEW.id
    WHERE id = NEW.profile_id;
    RETURN NEW;
  END IF;
  
  -- Khi xóa subscription, set subscription_id = NULL
  IF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET subscription_id = NULL
    WHERE subscription_id = OLD.id;
    RETURN OLD;
  END IF;
  
  -- Khi update subscription status, có thể cần update profile
  IF TG_OP = 'UPDATE' THEN
    -- Nếu subscription trở thành active và profile chưa có subscription_id
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
      UPDATE public.profiles 
      SET subscription_id = NEW.id
      WHERE id = NEW.profile_id AND subscription_id IS NULL;
    END IF;
    
    -- Nếu subscription không còn active, có thể cần tìm subscription active khác
    IF NEW.status != 'active' AND OLD.status = 'active' THEN
      UPDATE public.profiles 
      SET subscription_id = (
        SELECT s.id 
        FROM public.subscriptions s 
        WHERE s.profile_id = NEW.profile_id 
          AND s.status = 'active' 
          AND s.id != NEW.id
        ORDER BY s.created_at DESC 
        LIMIT 1
      )
      WHERE id = NEW.profile_id AND subscription_id = NEW.id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Tạo trigger để tự động sync subscription_id
DROP TRIGGER IF EXISTS trigger_update_profile_subscription_id ON public.subscriptions;
CREATE TRIGGER trigger_update_profile_subscription_id
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_subscription_id();

-- 6. Cập nhật function auto_create_free_subscription để cũng update profile
CREATE OR REPLACE FUNCTION auto_create_free_subscription()
RETURNS TRIGGER AS $$
DECLARE
  new_subscription_id uuid;
BEGIN
  -- Tạo free subscription cho user mới với đầy đủ thông tin
  INSERT INTO public.subscriptions (
    profile_id, 
    plan, 
    status, 
    start_date,
    super_likes_limit,
    super_likes_used,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    'free', 
    'active', 
    now(),
    5,  -- Free plan có 5 super likes
    0,  -- Chưa sử dụng
    now(),
    now()
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    start_date = EXCLUDED.start_date,
    super_likes_limit = EXCLUDED.super_likes_limit,
    super_likes_used = EXCLUDED.super_likes_used,
    updated_at = now()
  RETURNING id INTO new_subscription_id;
  
  -- Update profile với subscription_id
  UPDATE public.profiles 
  SET subscription_id = new_subscription_id
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION update_profile_subscription_id() TO authenticated;

-- =====================================================
-- COMPLETED! 🎉
-- - Thêm cột subscription_id vào profiles table
-- - Tự động sync subscription_id khi tạo/update/delete subscription
-- - Update existing profiles với subscription_id
-- - Trigger tự động maintain consistency
-- =====================================================