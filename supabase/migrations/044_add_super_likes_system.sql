-- Migration: Add Super Likes System
-- Created: 2024-12-24
-- Compatible with existing subscriptions table

-- 1. Add super likes columns to existing subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS super_likes_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS super_likes_used INTEGER DEFAULT 0;

-- Update existing subscriptions with super likes limits based on plan
UPDATE subscriptions 
SET 
  super_likes_limit = CASE 
    WHEN plan = 'free' THEN 5
    WHEN plan = 'premium' THEN 25
    WHEN plan = 'pro' THEN -1  -- unlimited
    ELSE 5
  END,
  super_likes_used = 0
WHERE super_likes_limit IS NULL;

-- 2. Create super_likes table
CREATE TABLE IF NOT EXISTS super_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  pet_owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT true, -- Ghim tin nhắn lên đầu
  is_replied BOOLEAN DEFAULT false, -- Đã reply chưa
  pinned_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'), -- Ghim 7 ngày
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replied_at TIMESTAMP WITH TIME ZONE, -- Thời gian reply
  
  UNIQUE(user_id, pet_id) -- Mỗi user chỉ super like 1 pet 1 lần
);

-- 3. Add super_like_count to pets table
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS super_like_count INTEGER DEFAULT 0;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_super_likes_user_id ON super_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_super_likes_pet_id ON super_likes(pet_id);
CREATE INDEX IF NOT EXISTS idx_super_likes_pet_owner_id ON super_likes(pet_owner_id);
CREATE INDEX IF NOT EXISTS idx_super_likes_pinned ON super_likes(pet_owner_id, is_pinned, created_at);
CREATE INDEX IF NOT EXISTS idx_super_likes_created_at ON super_likes(created_at);

-- 5. Create function to update super_like_count
CREATE OR REPLACE FUNCTION update_pet_super_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE pets 
    SET super_like_count = super_like_count + 1 
    WHERE id = NEW.pet_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE pets 
    SET super_like_count = super_like_count - 1 
    WHERE id = OLD.pet_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for super_like_count
DROP TRIGGER IF EXISTS trigger_update_pet_super_like_count ON super_likes;
CREATE TRIGGER trigger_update_pet_super_like_count
  AFTER INSERT OR DELETE ON super_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_pet_super_like_count();

-- 7. Create RLS policies for super_likes
ALTER TABLE super_likes ENABLE ROW LEVEL SECURITY;

-- Super likes policies
CREATE POLICY "Users can view own super likes" ON super_likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own super likes" ON super_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own super likes" ON super_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Policy for pet owners to view super likes on their pets
CREATE POLICY "Pet owners can view super likes on their pets" ON super_likes
  FOR SELECT USING (auth.uid() = pet_owner_id);

-- 8. Create view for user subscription info (compatible with existing structure)
CREATE OR REPLACE VIEW user_subscription_info AS
SELECT 
  s.profile_id as user_id,
  s.plan as plan_type,
  s.super_likes_limit,
  s.super_likes_used,
  (CASE 
    WHEN s.super_likes_limit = -1 THEN 999999 -- unlimited
    ELSE s.super_likes_limit - s.super_likes_used 
  END) as super_likes_remaining,
  (s.status = 'active') as is_active,
  s.start_date,
  s.end_date
FROM subscriptions s
WHERE s.status = 'active';

-- 9. Create view for pinned super likes (for message system)
CREATE OR REPLACE VIEW pinned_super_likes AS
SELECT 
  sl.id,
  sl.user_id,
  sl.pet_id,
  sl.pet_owner_id,
  sl.is_pinned,
  sl.is_replied,
  sl.created_at,
  sl.replied_at,
  -- User info (người gửi super like)
  up.email as user_email,
  up.full_name as user_name,
  up.avatar_url as user_avatar,
  -- Pet info
  p.name as pet_name,
  p.images as pet_images,
  p.type as pet_type
FROM super_likes sl
JOIN profiles up ON sl.user_id = up.id
JOIN pets p ON sl.pet_id = p.id
WHERE sl.is_pinned = true AND sl.is_replied = false
ORDER BY sl.created_at DESC;

-- 10. Create function to handle super like reply
CREATE OR REPLACE FUNCTION handle_super_like_reply(
  super_like_id UUID,
  replier_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  super_like_record super_likes%ROWTYPE;
BEGIN
  -- Get super like record
  SELECT * INTO super_like_record 
  FROM super_likes 
  WHERE id = super_like_id AND pet_owner_id = replier_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update super like as replied
  UPDATE super_likes 
  SET 
    is_replied = true,
    is_pinned = false,
    replied_at = NOW()
  WHERE id = super_like_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to check super like availability
CREATE OR REPLACE FUNCTION can_user_super_like(user_profile_id UUID)
RETURNS TABLE (
  can_super_like BOOLEAN,
  remaining INTEGER,
  limit_value INTEGER
) AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  -- Get user subscription
  SELECT * INTO subscription_record
  FROM subscriptions
  WHERE profile_id = user_profile_id AND status = 'active'
  LIMIT 1;
  
  IF subscription_record IS NULL THEN
    -- No subscription, return default free limits
    RETURN QUERY SELECT false::boolean, 0::integer, 0::integer;
    RETURN;
  END IF;
  
  -- Check if unlimited
  IF subscription_record.super_likes_limit = -1 THEN
    RETURN QUERY SELECT true::boolean, 999999::integer, -1::integer;
    RETURN;
  END IF;
  
  -- Check remaining super likes
  DECLARE
    remaining_likes INTEGER := subscription_record.super_likes_limit - subscription_record.super_likes_used;
  BEGIN
    RETURN QUERY SELECT 
      (remaining_likes > 0)::boolean, 
      remaining_likes::integer, 
      subscription_record.super_likes_limit::integer;
  END;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON user_subscription_info TO authenticated;
GRANT SELECT ON pinned_super_likes TO authenticated;
GRANT EXECUTE ON FUNCTION handle_super_like_reply(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_super_like(UUID) TO authenticated;

-- 12. Update subscription usage function
CREATE OR REPLACE FUNCTION increment_super_like_usage(user_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  -- Get user subscription with lock
  SELECT * INTO subscription_record
  FROM subscriptions
  WHERE profile_id = user_profile_id AND status = 'active'
  FOR UPDATE
  LIMIT 1;
  
  IF subscription_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Don't increment if unlimited
  IF subscription_record.super_likes_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has remaining super likes
  IF subscription_record.super_likes_used >= subscription_record.super_likes_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment usage
  UPDATE subscriptions
  SET 
    super_likes_used = super_likes_used + 1,
    updated_at = NOW()
  WHERE profile_id = user_profile_id AND status = 'active';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION increment_super_like_usage(UUID) TO authenticated;