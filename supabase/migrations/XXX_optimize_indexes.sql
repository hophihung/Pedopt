-- =====================================================
-- OPTIMIZE DATABASE INDEXES
-- Tối ưu hóa indexes để tăng tốc độ queries
-- =====================================================

-- 1. Composite indexes cho queries phức tạp
CREATE INDEX IF NOT EXISTS idx_pets_seller_available 
ON public.pets(seller_id, is_available) 
WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_orders_seller_status_created 
ON public.orders(seller_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_status_created 
ON public.orders(buyer_id, status, created_at DESC);

-- 2. Indexes cho location-based queries (nếu có)
CREATE INDEX IF NOT EXISTS idx_pets_location_available 
ON public.pets(latitude, longitude, is_available) 
WHERE is_available = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. Indexes cho full-text search (nếu cần)
-- CREATE INDEX IF NOT EXISTS idx_pets_name_search 
-- ON public.pets USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- 4. Partial indexes cho filtered queries
CREATE INDEX IF NOT EXISTS idx_products_seller_available 
ON public.products(seller_id, is_available) 
WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, is_read, created_at DESC) 
WHERE is_read = false;

-- 5. Indexes cho date range queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pets_created_at 
ON public.pets(created_at DESC);

-- 6. Indexes cho join operations
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reel_likes_reel_user 
ON public.reel_likes(reel_id, user_id);

-- 7. Analyze tables để update statistics
ANALYZE public.pets;
ANALYZE public.orders;
ANALYZE public.products;
ANALYZE public.profiles;
ANALYZE public.messages;
ANALYZE public.notifications;

