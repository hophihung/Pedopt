-- =====================================================
-- AUTO CREATE FREE SUBSCRIPTION FOR NEW USERS
-- Tự động tạo free subscription cho tất cả user mới
-- =====================================================

-- 1. Tạo function để auto-create free subscription
CREATE OR REPLACE FUNCTION auto_create_free_subscription()
RETURNS TRIGGER AS $$
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
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Tạo trigger để auto-create subscription khi tạo profile mới
DROP TRIGGER IF EXISTS trigger_auto_create_free_subscription ON public.profiles;
CREATE TRIGGER trigger_auto_create_free_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_free_subscription();

-- 3. Tạo free subscriptions cho existing users chưa có subscription
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
SELECT 
  p.id,
  'free',
  'active',
  COALESCE(p.created_at, now()),
  5,
  0,
  now(),
  now()
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.profile_id
WHERE s.profile_id IS NULL
ON CONFLICT (profile_id) DO NOTHING;

-- 4. Cập nhật function ensure_seller_has_subscription để không cần thiết nữa
-- Vì giờ tất cả user đều có subscription rồi
CREATE OR REPLACE FUNCTION ensure_seller_has_subscription(user_profile_id uuid)
RETURNS void AS $$
DECLARE
  existing_subscription uuid;
BEGIN
  -- Kiểm tra xem đã có subscription chưa
  SELECT id INTO existing_subscription
  FROM public.subscriptions
  WHERE profile_id = user_profile_id
  LIMIT 1;

  -- Nếu chưa có subscription (trường hợp hiếm), tạo mới
  IF existing_subscription IS NULL THEN
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
      user_profile_id,
      'free',
      'active',
      now(),
      5,
      0,
      now(),
      now()
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION auto_create_free_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_seller_has_subscription(uuid) TO authenticated;

-- =====================================================
-- COMPLETED! 🎉
-- - Tất cả user mới sẽ tự động có free subscription
-- - Existing users không có subscription sẽ được tạo
-- - Trigger hoạt động khi INSERT vào profiles table
-- - Compatible với existing subscription system
-- =====================================================