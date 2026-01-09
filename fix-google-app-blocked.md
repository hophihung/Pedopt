# 🚫 Fix Google "App Blocked" Error

## ❌ Lỗi: "Yêu cầu ứng dụng không hợp lệ, đã chặn quyền truy cập"

## 🔍 Nguyên nhân:
1. OAuth Consent Screen chưa được cấu hình
2. App chưa được verify bởi Google
3. Scopes không được phép
4. Domain chưa được verify

## ✅ Giải pháp:

### Bước 1: Cấu hình OAuth Consent Screen
1. **Vào Google Cloud Console:**
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **Chọn User Type:**
   - Chọn **"External"** (cho testing)
   - Click **"Create"**

3. **App Information:**
   - **App name:** `Pet Adoption`
   - **User support email:** `[your-email@gmail.com]`
   - **App logo:** Upload logo (optional)
   - **App domain:** `yxzvjlcyfcjcksrjjmmi.supabase.co`
   - **Developer contact:** `[your-email@gmail.com]`

4. **Scopes:**
   - Click **"Add or Remove Scopes"**
   - Add these scopes:
     ```
     openid
     email
     profile
     ```

5. **Test Users (QUAN TRỌNG):**
   - Click **"Add Users"**
   - Thêm email của bạn để test:
     ```
     [your-email@gmail.com]
     ```

### Bước 2: Cấu hình Authorized Domains
1. **Trong OAuth Consent Screen:**
   - Tìm **"Authorized domains"**
   - Thêm domain:
     ```
     supabase.co
     ```

### Bước 3: Cấu hình OAuth Client
1. **Vào Credentials:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Edit OAuth 2.0 Client:**
   - Click vào Client ID đã tạo
   - **Authorized redirect URIs:**
     ```
     https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
     ```

### Bước 4: Enable APIs
1. **Vào APIs & Services:**
   ```
   https://console.cloud.google.com/apis/library
   ```

2. **Enable các APIs sau:**
   - Google+ API
   - Google Sign-In API
   - People API

### Bước 5: Publish App (cho Testing)
1. **Trong OAuth Consent Screen:**
   - Click **"Publish App"**
   - Chọn **"Make available to test users"**

## 🧪 Testing Steps:

### 1. Sử dụng Test User
- Chỉ test với email đã thêm vào "Test users"
- Không test với email khác

### 2. Kiểm tra Scopes
- Chỉ request `openid`, `email`, `profile`
- Không request scopes khác

### 3. Test trên Real Device
```bash
npx expo run:android
```

## 🔧 Troubleshooting:

### Lỗi: "This app isn't verified"
**Giải pháp:**
- Click **"Advanced"**
- Click **"Go to [App Name] (unsafe)"**
- Hoặc thêm email vào test users

### Lỗi: "redirect_uri_mismatch"
**Giải pháp:**
- Kiểm tra redirect URI trong Google Console
- Đảm bảo match với Supabase callback URL

### Lỗi: "access_denied"
**Giải pháp:**
- Kiểm tra OAuth Consent Screen đã publish
- Đảm bảo user email trong test users list

## 📋 Checklist:

### OAuth Consent Screen:
- [ ] ✅ App name configured
- [ ] ✅ User support email added
- [ ] ✅ Authorized domains added
- [ ] ✅ Scopes configured (openid, email, profile)
- [ ] ✅ Test users added
- [ ] ✅ App published for testing

### OAuth Client:
- [ ] ✅ Redirect URIs configured
- [ ] ✅ Client ID and Secret obtained

### APIs:
- [ ] ✅ Google+ API enabled
- [ ] ✅ Google Sign-In API enabled
- [ ] ✅ People API enabled

### Supabase:
- [ ] ✅ Google provider enabled
- [ ] ✅ Client ID configured
- [ ] ✅ Client Secret configured
- [ ] ✅ Redirect URL configured

## 💡 Pro Tips:

1. **Development vs Production:**
   - Cho development: Dùng "External" + Test users
   - Cho production: Cần submit app review

2. **Test Users:**
   - Chỉ test với email trong test users list
   - Có thể add tối đa 100 test users

3. **App Verification:**
   - Cho production cần verify app với Google
   - Process này có thể mất vài tuần

4. **Scopes:**
   - Chỉ request scopes thực sự cần thiết
   - Sensitive scopes cần app review