# 🔧 Fix Google OAuth Redirect URI Mismatch

## ❌ Nguyên nhân lỗi `redirect_uri_mismatch`

Lỗi này xảy ra khi Redirect URI trong Google Cloud Console không khớp với URI mà ứng dụng gửi đi.

## 📋 Thông tin cấu hình hiện tại

- **Supabase URL**: `https://yxzvjlcyfcjcksrjjmmi.supabase.co`
- **App Scheme**: `petadoption`
- **Redirect URIs cần thiết**:
  1. `https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback`
  2. `petadoption://auth/callback`

## 🔧 Hướng dẫn fix từng bước

### BƯỚC 1: Cấu hình Google Cloud Console

1. **Truy cập Google Cloud Console**:
   - Đi tới: https://console.cloud.google.com/apis/credentials
   - Chọn project của bạn

2. **Cấu hình OAuth 2.0 Client ID**:
   - Click vào OAuth 2.0 Client ID đã tạo
   - Trong phần **"Authorized redirect URIs"**, thêm:
     ```
     https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
     petadoption://auth/callback
     ```
   - Click **"Save"**

3. **Kiểm tra APIs đã enable**:
   - Google+ API
   - Google Sign-In API
   - People API (optional)

### BƯỚC 2: Cấu hình Supabase Dashboard

1. **Truy cập Supabase Auth Settings**:
   - Đi tới: https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/providers

2. **Enable Google Provider**:
   - Bật Google provider
   - Nhập **Google Client ID** và **Client Secret**
   - Đảm bảo Redirect URL là: `https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback`

### BƯỚC 3: Cập nhật Code

Hiện tại trong `google-auth.service.ts` vẫn có placeholder:

```typescript
clientId: 'YOUR_GOOGLE_CLIENT_ID', // ❌ Cần thay thế
```

**Cần làm**:
1. Lấy Google Client ID từ Google Console
2. Thay thế placeholder trong code
3. Hoặc sử dụng Supabase OAuth (khuyến nghị)

### BƯỚC 4: Test và Debug

1. **Chạy trên thiết bị thật** (không phải simulator):
   ```bash
   npx expo run:android
   # hoặc
   npx expo run:ios
   ```

2. **Kiểm tra logs**:
   - Mở Metro bundler logs
   - Kiểm tra console.log trong app

3. **Clear cache nếu cần**:
   ```bash
   npx expo start --clear
   ```

## 🚨 Lưu ý quan trọng

- **Google OAuth chỉ hoạt động trên thiết bị thật**, không phải simulator/emulator
- **App scheme** `petadoption` phải khớp với cấu hình trong `app.config.js`
- **Redirect URIs** phải khớp chính xác (không có trailing slash)
- **Domain verification** có thể cần thiết cho production

## 🎯 Các lỗi thường gặp

### 1. `redirect_uri_mismatch`
**Nguyên nhân**: Redirect URI không khớp
**Giải pháp**: Kiểm tra lại URIs trong Google Console

### 2. `invalid_client`
**Nguyên nhân**: Client ID hoặc Secret sai
**Giải pháp**: Kiểm tra lại credentials

### 3. `access_denied`
**Nguyên nhân**: User từ chối hoặc app chưa được verify
**Giải pháp**: Kiểm tra OAuth consent screen

### 4. `unauthorized_client`
**Nguyên nhân**: Client chưa được authorize cho redirect URI
**Giải pháp**: Thêm URI vào Google Console

## 🔍 Debug Script

Chạy script này để kiểm tra cấu hình:

```javascript
// Thêm vào component để debug
import * as AuthSession from 'expo-auth-session';

const debugGoogleOAuth = () => {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'petadoption',
    path: 'auth/callback',
  });
  
  console.log('🔍 Debug Google OAuth:');
  console.log('Redirect URI:', redirectUri);
  console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log('Expected URIs in Google Console:');
  console.log('1.', 'https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback');
  console.log('2.', 'petadoption://auth/callback');
};
```

## ✅ Checklist hoàn thành

- [ ] Thêm redirect URIs vào Google Console
- [ ] Enable Google provider trong Supabase
- [ ] Nhập Client ID và Secret vào Supabase
- [ ] Cập nhật code với Client ID thực
- [ ] Test trên thiết bị thật
- [ ] Kiểm tra logs và debug

## 🎉 Kết quả mong đợi

Sau khi hoàn thành các bước trên, Google OAuth sẽ hoạt động bình thường và không còn lỗi `redirect_uri_mismatch`.