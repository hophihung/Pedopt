# 🚨 SỬA LỖI FACEBOOK OAUTH - HƯỚNG DẪN CHI TIẾT

## ❌ Lỗi hiện tại:
"Không thể tải URL, miền của URL không được đưa vào miền ứng dụng"

## ✅ Nguyên nhân:
Facebook App chưa có redirect URI đúng trong cấu hình

## 🔧 CÁCH SỬA (THỰC HIỆN NGAY):

### Bước 1: Vào Facebook Developer Console
1. Truy cập: https://developers.facebook.com/apps/1731268644198831/
2. Đăng nhập với tài khoản Facebook của bạn

### Bước 2: Cấu hình Facebook Login
1. Vào **Products** → **Facebook Login** → **Settings**
2. Trong **Valid OAuth Redirect URIs**, thêm:
   ```
   https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
   ```
3. Nhấn **Save Changes**

### Bước 3: Cấu hình App Domains
1. Vào **Settings** → **Basic**
2. Trong **App Domains**, thêm:
   ```
   yxzvjlcyfcjcksrjjmmi.supabase.co
   ```
3. Nhấn **Save Changes**

### Bước 4: Cấu hình Supabase
1. Vào Supabase Dashboard: https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi
2. Vào **Authentication** → **Providers**
3. Enable **Facebook** provider
4. Nhập:
   - **Facebook App ID**: `1731268644198831`
   - **Facebook App Secret**: [LẤY TỪ FACEBOOK APP → Settings → Basic]

### Bước 5: Test lại
1. Rebuild app: `npx expo run:android` hoặc `npx expo run:ios`
2. Test Facebook login trên thiết bị thật (không phải simulator)

## 🎯 Checklist hoàn thành:
- [ ] ✅ Thêm redirect URI vào Facebook App
- [ ] ✅ Thêm app domain vào Facebook App  
- [ ] ✅ Enable Facebook provider trong Supabase
- [ ] ✅ Nhập App Secret vào Supabase
- [ ] ✅ Rebuild app
- [ ] ✅ Test trên thiết bị thật

## 📱 Lưu ý quan trọng:
- Facebook OAuth chỉ hoạt động trên thiết bị thật, không hoạt động trên simulator
- Phải rebuild app sau khi thay đổi app.json
- App Secret phải được nhập chính xác vào Supabase

Sau khi hoàn thành các bước trên, Facebook OAuth sẽ hoạt động bình thường!