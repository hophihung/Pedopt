# 🎯 Cấu hình Google OAuth với 2 Clients (Android + Web)

## ✅ Setup hiện tại
Bạn đã tạo đúng:
- **Android OAuth Client** - cho native Google Sign-In
- **Web OAuth Client** - cho Supabase OAuth flow

## 🔧 Cách sử dụng từng loại

### 1. Web OAuth Client (cho Supabase)

**Mục đích**: Dùng cho Supabase OAuth flow (hiện tại đang dùng)

**Cấu hình**:
- **JavaScript origins**: `https://yxzvjlcyfcjcksrjjmmi.supabase.co`
- **Redirect URIs**: 
  - `https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback`
  - `petadoption://auth/callback`

**Sử dụng trong Supabase**:
1. Truy cập: https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/providers
2. Enable Google provider
3. Nhập **Web Client ID** và **Web Client Secret**
4. Save

### 2. Android OAuth Client (cho tương lai)

**Mục đích**: Dùng cho native Google Sign-In (nếu muốn)

**Cấu hình**:
- **Package name**: `com.petadoption.app`
- **SHA-1 fingerprint**: (từ keystore)

**Sử dụng trong code**:
- Cập nhật `google-auth.service.ts`
- Thay `YOUR_GOOGLE_CLIENT_ID` bằng **Android Client ID**

## 🎯 Khuyến nghị hiện tại

**Dùng Web OAuth Client** vì:
- ✅ Đơn giản hơn
- ✅ Không cần SHA-1 fingerprint
- ✅ Hoạt động tốt với Supabase
- ✅ Ít lỗi hơn

## 📋 Các bước tiếp theo

### BƯỚC 1: Cấu hình Supabase với Web Client

1. **Lấy Web Client credentials**:
   - Vào Web OAuth Client trong Google Console
   - Copy **Client ID** và **Client Secret**

2. **Cấu hình Supabase**:
   - Paste vào Supabase Auth Providers
   - Enable Google provider
   - Save

### BƯỚC 2: Test đăng nhập

1. **Chạy app trên thiết bị thật**:
   ```bash
   npx expo run:android
   ```

2. **Thử đăng nhập Google**
3. **Kiểm tra logs** nếu có lỗi

### BƯỚC 3: Debug nếu cần

Nếu vẫn có lỗi, check:
- [ ] Web Client ID đã nhập đúng vào Supabase
- [ ] Redirect URIs đã cấu hình đúng
- [ ] App đang chạy trên thiết bị thật (không phải simulator)

## 🔍 So sánh 2 loại Client

| Loại | Dùng cho | Cần cấu hình | Độ phức tạp |
|------|----------|--------------|-------------|
| **Web** | Supabase OAuth | Redirect URIs | Đơn giản ⭐ |
| **Android** | Native Sign-In | SHA-1 fingerprint | Phức tạp ⭐⭐⭐ |

## 🚨 Lưu ý quan trọng

- **Chỉ dùng 1 loại** tại 1 thời điểm
- **Web Client** cho Supabase OAuth (khuyến nghị)
- **Android Client** cho native implementation (tương lai)
- **Không trộn lẫn** Client IDs

## ✅ Checklist hoàn thành

- [ ] Web OAuth Client đã tạo
- [ ] Redirect URIs đã cấu hình
- [ ] Supabase đã enable Google với Web Client ID
- [ ] Test đăng nhập thành công

---

**Tóm tắt**: Dùng **Web OAuth Client** cho Supabase, giữ **Android Client** cho tương lai nếu cần native implementation.