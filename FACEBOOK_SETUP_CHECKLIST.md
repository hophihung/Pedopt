# ✅ Facebook OAuth Setup Checklist

## 📋 Cần làm để Facebook OAuth hoạt động

### 1. 🏗️ Tạo Facebook App
- [ ] Truy cập [Facebook Developers](https://developers.facebook.com/)
- [ ] Tạo app mới hoặc sử dụng app hiện có
- [ ] Thêm sản phẩm "Facebook Login"
- [ ] Lấy **App ID** và **App Secret**
- [ ] Lấy **Client Token** (tùy chọn)

### 2. 📱 Cấu hình App (app.json)
- [x] Cài đặt `expo-facebook`: `npx expo install expo-facebook`
- [ ] Chạy script setup: `node setup_facebook_oauth.js`
- [ ] Hoặc thủ công thêm vào `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-facebook",
        {
          "appId": "YOUR_FACEBOOK_APP_ID",
          "clientToken": "YOUR_FACEBOOK_CLIENT_TOKEN",
          "displayName": "Pet Adoption"
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["petadoption", "fbYOUR_FACEBOOK_APP_ID"]
          }
        ]
      }
    },
    "android": {
      "intentFilters": [
        {
          "data": [
            { "scheme": "petadoption" },
            { "scheme": "fbYOUR_FACEBOOK_APP_ID" }
          ]
        }
      ]
    }
  }
}
```

### 3. 🌐 Cấu hình Facebook App Settings
- [ ] Vào **Facebook App Dashboard** → **Facebook Login** → **Settings**
- [ ] Thêm **Valid OAuth Redirect URIs**:
  ```
  https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
  ```
- [ ] Thêm **App Domains**:
  ```
  yxzvjlcyfcjcksrjjmmi.supabase.co
  ```

### 4. 🔧 Cấu hình Supabase Dashboard
- [x] Facebook provider đã được enable
- [ ] Nhập **Facebook App ID** vào Supabase
- [ ] Nhập **Facebook App Secret** vào Supabase
- [ ] Kiểm tra **Redirect URL** đúng:
  ```
  https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
  ```

### 5. 💻 Cập nhật Code (tùy chọn)
- [ ] Sử dụng `AuthContext_with_facebook.tsx` thay vì `AuthContext.tsx`
- [ ] Hoặc thêm method `signInWithFacebookNative` vào AuthContext hiện tại
- [ ] Cập nhật UI để có 2 options: Facebook Web OAuth và Facebook Native

### 6. 🧪 Test Facebook Login
- [ ] Build app: `npx expo run:android` hoặc `npx expo run:ios`
- [ ] Test trên **device thật** (không hoạt động trên simulator)
- [ ] Kiểm tra logs để debug
- [ ] Test cả 2 phương thức:
  - Facebook Web OAuth (qua browser)
  - Facebook Native Login (qua Facebook app)

### 7. 🚀 Production Setup
- [ ] Submit Facebook app for review
- [ ] Request permissions: `public_profile`, `email`
- [ ] Chuyển app sang **Live mode**
- [ ] Test với user thật (không phải test user)

## 🔍 Troubleshooting

### ❌ "Invalid redirect URI"
- Kiểm tra redirect URI trong Facebook App Settings
- Đảm bảo URL chính xác với Supabase project

### ❌ "App not setup"
- Kiểm tra Facebook App ID trong app.json
- Đảm bảo Facebook Login product đã được thêm

### ❌ "Invalid access token"
- Kiểm tra Facebook App Secret trong Supabase
- Đảm bảo app đã được publish (ít nhất là Live mode)

### ❌ "Facebook login cancelled"
- User đã cancel login
- Xử lý error gracefully trong UI

### ❌ "Network error"
- Kiểm tra internet connection
- Kiểm tra Facebook servers status

## 📝 Scripts hỗ trợ

- `node check_facebook_config.js` - Kiểm tra cấu hình hiện tại
- `node setup_facebook_oauth.js` - Setup tự động
- `node test_new_user_flow.js` - Test flow đăng ký mới

## 🎯 Kết quả mong đợi

Sau khi hoàn thành checklist:
- ✅ User có thể login bằng Facebook
- ✅ Profile được tạo tự động với thông tin từ Facebook
- ✅ Avatar từ Facebook được sync
- ✅ Email từ Facebook được lưu
- ✅ User được redirect đến role selection nếu chưa chọn role

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong console
2. Chạy `node check_facebook_config.js`
3. Kiểm tra Facebook App Dashboard
4. Kiểm tra Supabase Dashboard → Authentication → Providers