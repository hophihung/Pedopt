-- =====================================================
-- IMPROVE SUBSCRIPTION SYSTEM (FIXED VERSION)
-- Sửa các lỗi và thêm các giải pháp tối ưu
-- =====================================================

-- 1. Đảm bảo unique constraint trên profile_id (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_profile_id_key' 
    AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD CONSTRAINT subscriptions_profile_id_key UNIQUE (profile_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, ignore
    NULL;
END $$;

-- 2. Tạo function atomic để create/update subscription
DROP FUNCTION IF EXISTS create_or_update_subscription(uuid, text, uuid, text);
CREATE OR REPLACE FUNCTION create_or_update_subscription(
  user_profile_id uuid,
  plan_name text,
  plan_id_param uuid DEFAULT NULL,
  billing_cycle_param text DEFAULT 'monthly'
)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  plan text,
  status text,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
DECLARE
  subscription_record RECORD;
  new_status text;
BEGIN
  -- Validate plan name
  IF plan_name NOT IN ('free', 'premium', 'pro') THEN
    RAISE EXCEPTION 'Invalid plan name: %', plan_name;
  END IF;

  -- Determine status based on plan
  IF plan_name = 'free' THEN
    new_status := 'active';
  ELSE
    new_status := 'pending'; -- Will be activated after payment
  END IF;

  -- Check if subscription exists
  SELECT * INTO subscription_record
  FROM public.subscriptions
  WHERE profile_id = user_profile_id
  LIMIT 1
  FOR UPDATE; -- Lock row to prevent race conditions

  IF subscription_record IS NULL THEN
    -- Create new subscription
    INSERT INTO public.subscriptions (
      profile_id,
      plan,
      status,
      start_date,
      created_at,
      updated_at
    )
    VALUES (
      user_profile_id,
      plan_name,
      new_status,
      now(),
      now(),
      now()
    )
    RETURNING * INTO subscription_record;
  ELSE
    -- Update existing subscription
    UPDATE public.subscriptions
    SET
      plan = plan_name,
      status = new_status,
      start_date = CASE 
        WHEN status != 'active' THEN now()
        ELSE start_date
      END,
      updated_at = now()
    WHERE id = subscription_record.id
    RETURNING * INTO subscription_record;
  END IF;

  -- Return subscription record
  RETURN QUERY SELECT
    subscription_record.id,
    subscription_record.profile_id,
    subscription_record.plan,
    subscription_record.status,
    subscription_record.start_date,
    subscription_record.end_date,
    subscription_record.created_at,
    subscription_record.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tạo function để activate subscription sau khi payment thành công
DROP FUNCTION IF EXISTS activate_subscription_after_payment(uuid, text, text);
CREATE OR REPLACE FUNCTION activate_subscription_after_payment(
  subscription_id_param uuid,
  payment_id_param text DEFAULT NULL,
  payment_method_param text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  -- Get subscription with lock
  SELECT * INTO subscription_record
  FROM public.subscriptions
  WHERE id = subscription_id_param
  FOR UPDATE;

  IF subscription_record IS NULL THEN
    RAISE EXCEPTION 'Subscription not found: %', subscription_id_param;
  END IF;

  -- Update subscription to active
  UPDATE public.subscriptions
  SET
    status = 'active',
    start_date = COALESCE(start_date, now()),
    end_date = CASE
      WHEN subscription_record.plan = 'pro' THEN now() + INTERVAL '1 year'
      WHEN subscription_record.plan = 'premium' THEN now() + INTERVAL '1 month'
      ELSE NULL -- free plan has no end date
    END,
    updated_at = now()
  WHERE id = subscription_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Tạo function để check và cleanup expired subscriptions
CREATE OR REPLACE FUNCTION check_and_expire_subscriptions()
RETURNS void AS $$
BEGIN
  -- Expire subscriptions that have passed end_date
  UPDATE public.subscriptions
  SET
    status = 'expired',
    updated_at = now()
  WHERE status = 'active'
    AND end_date IS NOT NULL
    AND end_date < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Tạo index để tối ưu queries (skip if exists)
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_status 
ON public.subscriptions(profile_id, status) 
WHERE status IN ('active', 'pending');

CREATE INDEX IF NOT EXISTS idx_subscriptions_status_created 
ON public.subscriptions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date 
ON public.subscriptions(end_date) 
WHERE end_date IS NOT NULL;

-- 6. Tạo function để get subscription với plan details
DROP FUNCTION IF EXISTS get_subscription_with_plan(uuid);
CREATE OR REPLACE FUNCTION get_subscription_with_plan(user_profile_id uuid)
RETURNS TABLE (
  subscription_id uuid,
  profile_id uuid,
  plan_name text,
  status text,
  start_date timestamptz,
  end_date timestamptz,
  super_likes_limit integer,
  super_likes_used integer,
  super_likes_remaining integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as subscription_id,
    s.profile_id,
    s.plan as plan_name,
    s.status,
    s.start_date,
    s.end_date,
    s.super_likes_limit,
    s.super_likes_used,
    CASE 
      WHEN s.super_likes_limit = -1 THEN 999999 -- unlimited
      ELSE s.super_likes_limit - s.super_likes_used 
    END as super_likes_remaining
  FROM public.subscriptions s
  WHERE s.profile_id = user_profile_id
    AND s.status IN ('active', 'pending')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Cải thiện ensure_seller_has_subscription với better error handling
CREATE OR REPLACE FUNCTION ensure_seller_has_subscription(user_profile_id uuid)
RETURNS void AS $$
DECLARE
  existing_subscription uuid;
BEGIN
  -- Kiểm tra xem đã có subscription chưa (với lock để tránh race condition)
  SELECT id INTO existing_subscription
  FROM public.subscriptions
  WHERE profile_id = user_profile_id
  LIMIT 1
  FOR UPDATE;

  -- Nếu chưa có subscription, tạo mới
  IF existing_subscription IS NULL THEN
    INSERT INTO public.subscriptions (
      profile_id,
      plan,
      status,
      start_date,
      super_likes_limit,
      super_likes_used
    )
    VALUES (
      user_profile_id,
      'free',
      'active',
      now(),
      5,
      0
    )
    ON CONFLICT (profile_id) DO UPDATE
    SET 
      plan = EXCLUDED.plan,
      status = 'active',
      super_likes_limit = COALESCE(subscriptions.super_likes_limit, 5),
      super_likes_used = COALESCE(subscriptions.super_likes_used, 0),
      updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Tạo bảng subscription_errors để track errors (skip if exists)
CREATE TABLE IF NOT EXISTS public.subscription_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  error_type text NOT NULL,
  error_message text NOT NULL,
  error_code text,
  error_details jsonb,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes (skip if exists)
CREATE INDEX IF NOT EXISTS idx_subscription_errors_user_id 
ON public.subscription_errors(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_errors_resolved 
ON public.subscription_errors(resolved, created_at DESC);

-- Enable RLS
ALTER TABLE public.subscription_errors ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists, then create new one
DROP POLICY IF EXISTS "Users can view own subscription errors" ON public.subscription_errors;
CREATE POLICY "Users can view own subscription errors"
  ON public.subscription_errors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 9. Tạo function để log subscription errors
DROP FUNCTION IF EXISTS log_subscription_error(uuid, uuid, text, text, text, jsonb);
CREATE OR REPLACE FUNCTION log_subscription_error(
  user_id_param uuid,
  subscription_id_param uuid,
  error_type_param text,
  error_message_param text,
  error_code_param text DEFAULT NULL,
  error_details_param jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  error_id uuid;
BEGIN
  INSERT INTO public.subscription_errors (
    user_id,
    subscription_id,
    error_type,
    error_message,
    error_code,
    error_details
  )
  VALUES (
    user_id_param,
    subscription_id_param,
    error_type_param,
    error_message_param,
    error_code_param,
    error_details_param
  )
  RETURNING id INTO error_id;

  RETURN error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_or_update_subscription(uuid, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_subscription_after_payment(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_expire_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_with_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_seller_has_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION log_subscription_error(uuid, uuid, text, text, text, jsonb) TO authenticated;

-- =====================================================
-- COMPLETED! 🎉
-- - Atomic subscription creation/update
-- - Better error handling
-- - Race condition prevention
-- - Subscription expiration handling
-- - Error logging
-- - Compatible with existing structure
-- =====================================================