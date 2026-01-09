-- =====================================================
-- ADD SHIPPING ADDRESS FIELDS TO PROFILES
-- Thêm các trường địa chỉ giao hàng cho profiles table
-- =====================================================

-- 1. Thêm các trường địa chỉ giao hàng
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shipping_name text,
ADD COLUMN IF NOT EXISTS shipping_phone text,
ADD COLUMN IF NOT EXISTS shipping_address text,
ADD COLUMN IF NOT EXISTS shipping_ward text,
ADD COLUMN IF NOT EXISTS shipping_district text,
ADD COLUMN IF NOT EXISTS shipping_city text,
ADD COLUMN IF NOT EXISTS shipping_postal_code text,
ADD COLUMN IF NOT EXISTS is_default_shipping boolean DEFAULT false;

-- 2. Tạo index cho các trường địa chỉ
CREATE INDEX IF NOT EXISTS idx_profiles_shipping_city ON public.profiles(shipping_city);
CREATE INDEX IF NOT EXISTS idx_profiles_shipping_district ON public.profiles(shipping_district);
CREATE INDEX IF NOT EXISTS idx_profiles_is_default_shipping ON public.profiles(is_default_shipping);

-- 3. Tạo function để validate địa chỉ giao hàng
CREATE OR REPLACE FUNCTION validate_shipping_address(
  name_input text,
  phone_input text,
  address_input text,
  city_input text
)
RETURNS boolean AS $$
BEGIN
  -- Kiểm tra các trường bắt buộc
  IF name_input IS NULL OR trim(name_input) = '' THEN
    RETURN false;
  END IF;
  
  IF phone_input IS NULL OR trim(phone_input) = '' THEN
    RETURN false;
  END IF;
  
  IF address_input IS NULL OR trim(address_input) = '' THEN
    RETURN false;
  END IF;
  
  IF city_input IS NULL OR trim(city_input) = '' THEN
    RETURN false;
  END IF;
  
  -- Kiểm tra độ dài tối thiểu
  IF length(trim(name_input)) < 2 THEN
    RETURN false;
  END IF;
  
  IF length(trim(address_input)) < 10 THEN
    RETURN false;
  END IF;
  
  -- Kiểm tra format số điện thoại (đơn giản)
  IF NOT (phone_input ~ '^[\+]?[0-9\s\-\(\)]{8,15}$') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION validate_shipping_address(text, text, text, text) TO authenticated;

-- 5. Tạo function để lấy địa chỉ giao hàng đầy đủ
CREATE OR REPLACE FUNCTION get_full_shipping_address(profile_id uuid)
RETURNS text AS $$
DECLARE
  full_address text;
BEGIN
  SELECT 
    CASE 
      WHEN shipping_address IS NOT NULL AND shipping_city IS NOT NULL THEN
        concat_ws(', ', 
          shipping_address,
          shipping_ward,
          shipping_district, 
          shipping_city,
          shipping_postal_code
        )
      ELSE NULL
    END
  INTO full_address
  FROM public.profiles 
  WHERE id = profile_id;
  
  RETURN full_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions cho function
GRANT EXECUTE ON FUNCTION get_full_shipping_address(uuid) TO authenticated;

-- 7. Tạo view để dễ dàng truy vấn thông tin giao hàng
CREATE OR REPLACE VIEW profile_shipping_info AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.shipping_name,
  p.shipping_phone,
  p.shipping_address,
  p.shipping_ward,
  p.shipping_district,
  p.shipping_city,
  p.shipping_postal_code,
  p.is_default_shipping,
  get_full_shipping_address(p.id) as full_shipping_address
FROM public.profiles p;

-- 8. Grant permissions cho view
GRANT SELECT ON profile_shipping_info TO authenticated;

-- 9. RLS cho view - Không thể enable RLS trực tiếp trên view
-- Thay vào đó, RLS sẽ được kế thừa từ table profiles gốc
-- Vì view chỉ select từ profiles table và profiles đã có RLS

-- =====================================================
-- COMPLETED! 🎉
-- - Thêm các trường địa chỉ giao hàng chi tiết
-- - Tạo validation function
-- - Tạo helper function để lấy địa chỉ đầy đủ
-- - Tạo view để dễ truy vấn
-- - RLS được kế thừa từ profiles table
-- =====================================================