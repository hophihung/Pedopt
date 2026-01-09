-- Optimized Super Like Functions for Better Performance
-- Created: 2024-12-30

-- Function: Check if user can super like (optimized)
CREATE OR REPLACE FUNCTION can_user_super_like_optimized(user_profile_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscription_info RECORD;
    result JSON;
BEGIN
    -- Get subscription info in single query
    SELECT 
        s.plan as plan_type,
        s.super_likes_limit,
        s.super_likes_used,
        s.status = 'active' as is_active,
        (s.super_likes_limit - s.super_likes_used) as remaining
    INTO subscription_info
    FROM subscriptions s
    WHERE s.profile_id = user_profile_id 
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- If no subscription found, create free subscription
    IF NOT FOUND THEN
        INSERT INTO subscriptions (
            profile_id, 
            plan, 
            super_likes_limit, 
            super_likes_used, 
            status,
            start_date
        ) VALUES (
            user_profile_id, 
            'free', 
            5, 
            0, 
            'active',
            NOW()
        );
        
        subscription_info.plan_type := 'free';
        subscription_info.super_likes_limit := 5;
        subscription_info.super_likes_used := 0;
        subscription_info.remaining := 5;
        subscription_info.is_active := true;
    END IF;

    -- Build result
    result := json_build_object(
        'can_super_like', 
        CASE 
            WHEN subscription_info.plan_type = 'pro' THEN true -- pro = unlimited
            WHEN subscription_info.remaining > 0 THEN true
            ELSE false
        END,
        'remaining', 
        CASE 
            WHEN subscription_info.plan_type = 'pro' THEN -1 -- pro = unlimited
            ELSE subscription_info.remaining
        END,
        'limit_value', subscription_info.super_likes_limit,
        'plan_type', subscription_info.plan_type
    );

    RETURN result;
END;
$$;

-- Function: Super like a pet (optimized single transaction)
CREATE OR REPLACE FUNCTION super_like_pet_optimized(
    p_pet_id UUID,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pet_owner_id UUID;
    subscription_info RECORD;
    can_like BOOLEAN := false;
    result JSON;
BEGIN
    -- Start transaction
    BEGIN
        -- Get pet owner in single query
        SELECT seller_id INTO pet_owner_id
        FROM pets 
        WHERE id = p_pet_id AND is_available = true;
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'message', 'pet_not_found'
            );
        END IF;

        -- Check if already super liked
        IF EXISTS (
            SELECT 1 FROM super_likes 
            WHERE user_id = p_user_id AND pet_id = p_pet_id
        ) THEN
            RETURN json_build_object(
                'success', false,
                'message', 'already_super_liked'
            );
        END IF;

        -- Get and check subscription in single query
        SELECT 
            plan,
            super_likes_limit,
            super_likes_used,
            (super_likes_limit - super_likes_used) as remaining
        INTO subscription_info
        FROM subscriptions
        WHERE profile_id = p_user_id AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1;

        -- Create free subscription if none exists
        IF NOT FOUND THEN
            INSERT INTO subscriptions (
                profile_id, plan, super_likes_limit, 
                super_likes_used, status, start_date
            ) VALUES (
                p_user_id, 'free', 5, 0, 'active', NOW()
            );
            
            subscription_info.plan := 'free';
            subscription_info.super_likes_limit := 5;
            subscription_info.super_likes_used := 0;
            subscription_info.remaining := 5;
        END IF;

        -- Check if can super like
        IF subscription_info.plan = 'pro' THEN -- pro = unlimited
            can_like := true;
        ELSIF subscription_info.remaining > 0 THEN
            can_like := true;
        END IF;

        IF NOT can_like THEN
            RETURN json_build_object(
                'success', false,
                'message', 'no_super_likes_remaining'
            );
        END IF;

        -- Create super like
        INSERT INTO super_likes (
            user_id,
            pet_id,
            pet_owner_id,
            is_pinned,
            is_replied,
            pinned_until
        ) VALUES (
            p_user_id,
            p_pet_id,
            pet_owner_id,
            true,
            false,
            NOW() + INTERVAL '7 days'
        );

        -- Update subscription usage (only if not unlimited)
        IF subscription_info.plan != 'pro' THEN
            UPDATE subscriptions 
            SET 
                super_likes_used = super_likes_used + 1,
                updated_at = NOW()
            WHERE profile_id = p_user_id AND status = 'active';
        END IF;

        -- Return success
        result := json_build_object(
            'success', true,
            'message', 'super_like_created',
            'remaining', 
            CASE 
                WHEN subscription_info.plan = 'pro' THEN -1
                ELSE subscription_info.remaining - 1
            END
        );

        RETURN result;

    EXCEPTION WHEN OTHERS THEN
        -- Rollback on error
        RAISE;
    END;
END;
$$;

-- Function: Remove super like (optimized)
CREATE OR REPLACE FUNCTION remove_super_like_optimized(
    p_pet_id UUID,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    super_like_found BOOLEAN := false;
    subscription_plan TEXT;
BEGIN
    -- Check if super like exists and delete in single query
    DELETE FROM super_likes 
    WHERE user_id = p_user_id AND pet_id = p_pet_id
    RETURNING true INTO super_like_found;

    IF NOT super_like_found THEN
        RETURN json_build_object(
            'success', false,
            'message', 'super_like_not_found'
        );
    END IF;

    -- Get subscription plan
    SELECT plan INTO subscription_plan
    FROM subscriptions
    WHERE profile_id = p_user_id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    -- Update subscription usage (only if not unlimited and has usage)
    IF subscription_plan IS NOT NULL AND subscription_plan != 'pro' THEN
        UPDATE subscriptions 
        SET 
            super_likes_used = GREATEST(0, super_likes_used - 1),
            updated_at = NOW()
        WHERE profile_id = p_user_id 
        AND status = 'active' 
        AND super_likes_used > 0;
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'super_like_removed'
    );
END;
$$;

-- Function: Handle super like reply (optimized)
CREATE OR REPLACE FUNCTION handle_super_like_reply_optimized(
    p_super_like_id UUID,
    p_replier_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    super_like_record RECORD;
BEGIN
    -- Get super like info and update in single query
    UPDATE super_likes 
    SET 
        is_replied = true,
        replied_at = NOW(),
        is_pinned = false
    WHERE id = p_super_like_id 
    AND pet_owner_id = p_replier_user_id
    AND is_replied = false
    RETURNING * INTO super_like_record;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'super_like_not_found_or_already_replied'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'super_like_reply_handled'
    );
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_super_likes_user_pet ON super_likes(user_id, pet_id);
CREATE INDEX IF NOT EXISTS idx_super_likes_pet_owner ON super_likes(pet_owner_id, is_pinned, created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_active ON subscriptions(profile_id, status, created_at);

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_user_super_like_optimized(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION super_like_pet_optimized(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_super_like_optimized(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_super_like_reply_optimized(UUID, UUID) TO authenticated;