-- Migration: Add onboarding fields to profiles table
-- Created: 2024-12-25

-- 1. Add onboarding_completed column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 2. Add preferences column to store user preferences
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT NULL;

-- 3. Create index for onboarding_completed for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON profiles(onboarding_completed);

-- 4. Create index for preferences JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_preferences 
ON profiles USING GIN (preferences);

-- 5. Update existing profiles to have onboarding_completed = true if they have a role
UPDATE profiles 
SET onboarding_completed = true 
WHERE role IS NOT NULL AND onboarding_completed IS NULL;

-- 6. Create function to check if user needs onboarding
CREATE OR REPLACE FUNCTION user_needs_onboarding(user_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Get user profile
  SELECT * INTO profile_record
  FROM profiles
  WHERE id = user_profile_id;
  
  -- If no profile exists, needs onboarding
  IF profile_record IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If no role, needs onboarding
  IF profile_record.role IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If onboarding not completed, needs onboarding
  IF profile_record.onboarding_completed IS NULL OR profile_record.onboarding_completed = FALSE THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise, onboarding is complete
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION user_needs_onboarding(UUID) TO authenticated;