# Google OAuth Setup Guide

## 🎯 Tổng quan
Hướng dẫn cấu hình Google OAuth cho ứng dụng Pet Adoption

## 📋 Yêu cầu trước khi bắt đầu
- Tài khoản Google Cloud Console
- Supabase project đã setup
- Expo CLI đã cài đặt

## 🔧 Các bước setup

### Bước 1: Tạo Google Cloud Project

1. **Vào Google Cloud Console:**
   ```
   https://console.cloud.google.com/
   ```

2. **Tạo project mới hoặc chọn project hiện có**

3. **Enable APIs cần thiết:**
   - Google+ API
   - Google Sign-In API
   - Google Identity and Access Management (IAM) API

### Bước 2: Tạo OAuth 2.0 Credentials

1. **Vào Credentials:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Click "Create Credentials" → "OAuth 2.0 Client IDs"**

3. **Chọn Application type: "Web application"**

4. **Thêm Authorized redirect URIs:**
   ```
   https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
   petadoption://auth/callback
   ```

5. **Copy Client ID và Client Secret**

### Bước 3: Cấu hình OAuth Consent Screen

1. **Vào OAuth consent screen:**
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **Chọn "External" user type**

3. **Điền thông tin app:**
   - App name: `Pet Adoption`
   - User support email: `your-email@gmail.com`
   - App logo: Upload logo của app
   - App domain: `yxzvjlcyfcjcksrjjmmi.supabase.co`

4. **Thêm scopes:**
   - `openid`
   - `email`
   - `profile`

5. **Thêm test users (nếu app chưa được verify)**

### Bước 4: Cấu hình Supabase

1. **Vào Supabase Dashboard:**
   ```
   https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/providers
   ```

2. **Enable Google provider**

3. **Nhập thông tin:**
   - **Client ID**: [Client ID từ Google Console]
   - **Client Secret**: [Client Secret từ Google Console]

4. **Thêm redirect URLs:**
   ```
   petadoption://auth/callback
   ```

### Bước 5: Cấu hình App

1. **Chạy setup script:**
   ```bash
   node setup_google_oauth.js
   ```

2. **Rebuild app:**
   ```bash
   npx expo run:android
   # hoặc
   npx expo run:ios
   ```

### Bước 6: Test OAuth

1. **Debug Google OAuth:**
   ```bash
   node debug-google-oauth.js
   ```

2. **Test trên thiết bị thật:**
   - Mở app
   - Nhấn "Tiếp tục với Google"
   - Kiểm tra login flow

## 🚨 Troubleshooting

### Lỗi: "redirect_uri_mismatch"
**Nguyên nhân:** Redirect URI không khớp
**Giải pháp:** 
- Kiểm tra redirect URIs trong Google Console
- Đảm bảo có đúng URL: `https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback`

### Lỗi: "access_denied"
**Nguyên nhân:** User từ chối quyền hoặc app chưa được verify
**Giải pháp:**
- Thêm user vào test users list
- Hoặc submit app để review

### Lỗi: "invalid_client"
**Nguyên nhân:** Client ID hoặc Secret sai
**Giải pháp:**
- Kiểm tra lại Client ID và Secret trong Supabase
- Đảm bảo copy đúng từ Google Console

### Lỗi: "unauthorized_client"
**Nguyên nhân:** OAuth consent screen chưa setup
**Giải pháp:**
- Hoàn thành OAuth consent screen setup
- Thêm required scopes

## 📱 Lưu ý quan trọng

1. **Google OAuth chỉ hoạt động trên thiết bị thật**
2. **Phải rebuild app sau khi thay đổi app.json**
3. **Test với nhiều tài khoản Google khác nhau**
4. **Cho production, cần submit OAuth consent screen để review**

## 🎯 Checklist hoàn thành

- [ ] ✅ Tạo Google Cloud Project
- [ ] ✅ Enable required APIs
- [ ] ✅ Tạo OAuth 2.0 credentials
- [ ] ✅ Setup OAuth consent screen
- [ ] ✅ Cấu hình Supabase Google provider
- [ ] ✅ Thêm redirect URIs
- [ ] ✅ Rebuild app
- [ ] ✅ Test trên thiết bị thật

## 🚀 Production Checklist

- [ ] ✅ Verify domain ownership
- [ ] ✅ Submit OAuth consent screen for review
- [ ] ✅ Test với external users
- [ ] ✅ Monitor error logs
- [ ] ✅ Setup proper error handling

Sau khi hoàn thành tất cả các bước, Google OAuth sẽ hoạt động hoàn hảo!