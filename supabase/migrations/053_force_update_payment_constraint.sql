-- =====================================================
-- FORCE UPDATE PAYMENT METHOD CONSTRAINT
-- Force update constraint trong trường hợp migration trước chưa apply
-- =====================================================

-- 1. Kiểm tra và drop tất cả constraint liên quan đến payment_method
DO $$ 
BEGIN
    -- Drop constraint nếu tồn tại
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_payment_method_check' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_payment_method_check;
    END IF;
END $$;

-- 2. Thêm constraint mới
ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('cod', 'bank_transfer', 'e_wallet', 'payos', 'momo', 'zalopay'));

-- 3. Verify constraint đã được tạo
SELECT 
    constraint_name, 
    check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'orders_payment_method_check';

-- =====================================================
-- COMPLETED! 🎉
-- - Force update constraint với các payment method mới
-- - Verify constraint đã được apply
-- =====================================================