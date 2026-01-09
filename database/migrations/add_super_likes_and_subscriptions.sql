-- Migration: Add Super Likes and Subscriptions
-- Created: 2024-12-24

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('free', 'basic', 'premium', 'unlimited')),
  super_likes_limit INTEGER NOT NULL DEFAULT 0,
  super_likes_used INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, is_active) -- Chỉ có 1 subscription active per user
);

-- 2. Create super_likes table
CREATE TABLE IF NOT EXISTS super_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  pet_owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT true, -- Ghim tin nhắn lên đầu
  is_replied BOOLEAN DEFAULT false, -- Đã reply chưa
  pinned_until TIMESTAMP WITH TIME ZONE, -- Ghim đến khi nào
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replied_at TIMESTAMP WITH TIME ZONE, -- Thời gian reply
  
  UNIQUE(user_id, pet_id) -- Mỗi user chỉ super like 1 pet 1 lần
);

-- 3. Add super_like_count to pets table
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS super_like_count INTEGER DEFAULT 0;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(user_id, is_active);
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

-- 7. Insert default subscription plans
INSERT INTO subscriptions (user_id, plan_type, super_likes_limit, super_likes_used, is_active)
SELECT 
  id as user_id,
  'free' as plan_type,
  5 as super_likes_limit,
  0 as super_likes_used,
  true as is_active
FROM profiles
WHERE id NOT IN (SELECT user_id FROM subscriptions WHERE is_active = true)
ON CONFLICT (user_id, is_active) DO NOTHING;

-- 8. Create RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_likes ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

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

-- 9. Create view for user subscription info
CREATE OR REPLACE VIEW user_subscription_info AS
SELECT 
  s.user_id,
  s.plan_type,
  s.super_likes_limit,
  s.super_likes_used,
  (s.super_likes_limit - s.super_likes_used) as super_likes_remaining,
  s.is_active,
  s.start_date,
  s.end_date
FROM subscriptions s
WHERE s.is_active = true;

-- 10. Create view for pinned super likes (for message system)
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

-- 11. Create function to handle super like reply
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

-- Grant permissions
GRANT SELECT ON user_subscription_info TO authenticated;
GRANT SELECT ON pinned_super_likes TO authenticated;
GRANT EXECUTE ON FUNCTION handle_super_like_reply(UUID, UUID) TO authenticated;