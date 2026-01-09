# Facebook OAuth Setup Guide - FIXED

## 🎯 Vấn đề đã được giải quyết
✅ Facebook App ID đã được cấu hình: `1731268644198831`
✅ app.json đã được cập nhật với Facebook plugin
✅ URL schemes đã được thêm cho iOS và Android
✅ Supabase OAuth đang hoạt động

## ✅ Cấu hình hiện tại

### 1. **Facebook App Settings** (CẦN KIỂM TRA)

Trong Facebook Developers Console (https://developers.facebook.com/apps/1731268644198831/):

#### Valid OAuth Redirect URIs:
```
https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
```

#### App Domains:
```
yxzvjlcyfcjcksrjjmmi.supabase.co
```

### 2. **Supabase Auth Settings** (CẦN KIỂM TRA)

Trong Supabase Dashboard → Authentication → Providers:

#### Facebook Provider:
```
✅ Enabled: Yes
Facebook App ID: 1731268644198831
Facebook App Secret: [CẦN NHẬP TỪ FACEBOOK APP]
```

#### Redirect URLs:
```
Site URL: petadoption://
Additional Redirect URLs:
- petadoption://auth/callback
```

### 3. **App Configuration** ✅ ĐÃ HOÀN THÀNH

#### app.json:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-facebook",
        {
          "appId": "1731268644198831",
          "displayName": "AdoPet",
          "scheme": "fb1731268644198831"
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "petadoption",
              "fb1731268644198831"
            ]
          }
        ]
      }
    },
    "android": {
      "intentFilters": [
        {
          "data": [
            { "scheme": "petadoption" },
            { "scheme": "fb1731268644198831" }
          ]
        }
      ]
    }
  }
}
```

## 🔧 Các bước cần thực hiện NGAY

### Bước 1: Cấu hình Facebook App
1. Vào https://developers.facebook.com/apps/1731268644198831/fb-login/settings/
2. Thêm Valid OAuth Redirect URI:
   ```
   https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
   ```
3. Lưu App Secret để dùng cho Supabase

### Bước 2: Cấu hình Supabase
1. Vào Supabase Dashboard → Authentication → Providers
2. Enable Facebook provider
3. Nhập:
   - Facebook App ID: `1731268644198831`
   - Facebook App Secret: [LẤY TỪ FACEBOOK APP]

### Bước 3: Rebuild App
```bash
# Xóa cache và rebuild
npx expo install --fix
npx expo run:android
# hoặc
npx expo run:ios
```

## 🚨 Lỗi thường gặp và cách sửa

### Lỗi: "Invalid OAuth redirect URI"
**Nguyên nhân:** Facebook App chưa có redirect URI đúng
**Giải pháp:** Thêm `https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback` vào Facebook App

### Lỗi: "App not configured for Facebook Login"
**Nguyên nhân:** Facebook Login product chưa được enable
**Giải pháp:** Enable Facebook Login trong Facebook App

### Lỗi: "Session not created after OAuth"
**Nguyên nhân:** Supabase chưa có Facebook App Secret
**Giải pháp:** Nhập Facebook App Secret vào Supabase

### Lỗi: "Deep link not working"
**Nguyên nhân:** App chưa được rebuild sau khi thay đổi app.json
**Giải pháp:** Chạy `npx expo run:android` hoặc `npx expo run:ios`

## 🧪 Test OAuth Flow

### 1. Test Deep Link:
```bash
# Test URL scheme
npx uri-scheme open petadoption://auth/callback --android
npx uri-scheme open fb1731268644198831://authorize --android
```

### 2. Debug OAuth:
```bash
node debug-facebook-oauth.js
```

### 3. Test trên thiết bị thật:
1. Build và cài app trên thiết bị thật
2. Nhấn "Tiếp tục với Facebook"
3. Kiểm tra console logs
4. Xác nhận redirect về app

## 📱 Checklist hoàn thành

### Facebook App:
- [ ] **QUAN TRỌNG**: Thêm redirect URI: `https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback`
- [ ] Enable Facebook Login product
- [ ] Copy App Secret

### Supabase:
- [ ] **QUAN TRỌNG**: Enable Facebook provider
- [ ] **QUAN TRỌNG**: Nhập Facebook App ID: `1731268644198831`
- [ ] **QUAN TRỌNG**: Nhập Facebook App Secret
- [ ] Set redirect URLs: `petadoption://auth/callback`

### App:
- [x] ✅ Facebook plugin configured
- [x] ✅ URL schemes added
- [ ] **QUAN TRỌNG**: Rebuild app: `npx expo run:android`
- [ ] Test trên thiết bị thật

## 🎯 Kết luận

Vấn đề chính là **thiếu cấu hình Facebook App Secret trong Supabase**. Sau khi hoàn thành 2 bước quan trọng:

1. **Thêm redirect URI vào Facebook App**
2. **Nhập App Secret vào Supabase**
3. **Rebuild app**

Facebook OAuth sẽ hoạt động bình thường.