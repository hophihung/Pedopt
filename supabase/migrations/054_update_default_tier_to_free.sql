-- =====================================================
-- UPDATE DEFAULT COMMISSION TIER TO FREE
-- Change tier name from "Default" to "Free" for better UX
-- =====================================================

-- Update existing "Default" tier to "Free"
UPDATE public.commission_tiers 
SET 
  tier_name = 'Free',
  updated_at = now()
WHERE tier_name = 'Default';

-- Insert "Free" tier if it doesn't exist (in case migration runs on fresh DB)
INSERT INTO public.commission_tiers (tier_name, min_reputation_points, max_reputation_points, commission_rate, processing_fee_rate) 
VALUES ('Free', 0, 49, 6.00, 1.00)
ON CONFLICT (tier_name) DO NOTHING;

-- Verify the change
DO $$
DECLARE
  tier_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tier_count 
  FROM public.commission_tiers 
  WHERE tier_name = 'Free' AND is_active = true;
  
  IF tier_count > 0 THEN
    RAISE NOTICE '✅ Successfully updated/created Free tier';
  ELSE
    RAISE NOTICE '❌ Failed to create Free tier';
  END IF;
END $$;