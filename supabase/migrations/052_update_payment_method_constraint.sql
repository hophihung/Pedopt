-- =====================================================
-- UPDATE PAYMENT METHOD CONSTRAINT
-- Cập nhật constraint cho payment_method để hỗ trợ thêm các phương thức mới
-- =====================================================

-- 1. Drop constraint cũ
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- 2. Thêm constraint mới với các payment method được hỗ trợ
ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('cod', 'bank_transfer', 'e_wallet', 'payos', 'momo', 'zalopay'));

-- 3. Cập nhật default value nếu cần
-- Giữ nguyên default là 'cod' vì nó vẫn hợp lệ

-- =====================================================
-- COMPLETED! 🎉
-- - Cập nhật constraint để hỗ trợ payos, momo, zalopay
-- - Giữ nguyên các payment method cũ để backward compatibility
-- =====================================================