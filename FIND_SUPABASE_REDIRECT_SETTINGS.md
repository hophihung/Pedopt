# 🔍 Tìm cấu hình Redirect URL trong Supabase

## 📍 Các vị trí có thể có

### 1. Authentication Settings (Chính)
```
https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/url-configuration
```

**Hoặc**:
- Dashboard → **Authentication** → **URL Configuration**
- Tìm các trường:
  - **Site URL**
  - **Redirect URLs** 
  - **Additional Redirect URLs**

### 2. General Settings
```
https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/settings/general
```

**Tìm**:
- **Site URL**
- **Additional URLs**

### 3. Auth Providers (Google)
```
https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/providers
```

**Trong Google provider settings**:
- **Redirect URL** (có thể ở đây)

## 🎯 Những gì cần tìm và sửa

### ❌ Cần xóa/sửa:
```
http://localhost:3000
http://localhost:8081
http://127.0.0.1:3000
```

### ✅ Cần có:
```
petadoption://auth/callback
```

## 🔧 Hướng dẫn từng bước

### BƯỚC 1: Kiểm tra Authentication → URL Configuration

1. **Truy cập**: https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/url-configuration

2. **Tìm các trường**:
   - Site URL
   - Redirect URLs
   - Additional Redirect URLs

3. **Sửa nếu thấy localhost**:
   - Xóa localhost URLs
   - Thêm `petadoption://auth/callback`

### BƯỚC 2: Kiểm tra General Settings

1. **Truy cập**: https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/settings/general

2. **Scroll xuống tìm**:
   - Site URL
   - Additional URLs
   - Custom domains

### BƯỚC 3: Kiểm tra Google Provider

1. **Truy cập**: https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/providers

2. **Click vào Google provider**

3. **Tìm Redirect URL field**

## 🖼️ Giao diện có thể trông như thế nào

```
┌─────────────────────────────────────┐
│ Site URL                            │
│ ┌─────────────────────────────────┐ │
│ │ http://localhost:3000           │ │ ← XÓA CÁI NÀY
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Additional Redirect URLs            │
│ ┌─────────────────────────────────┐ │
│ │ petadoption://auth/callback     │ │ ← THÊM CÁI NÀY
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🚨 Nếu không tìm thấy

### Thử các URL này:

1. **Auth Settings**:
   ```
   https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/settings
   ```

2. **Auth Configuration**:
   ```
   https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/configuration
   ```

3. **Project Settings**:
   ```
   https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/settings
   ```

## 🔍 Cách tìm nhanh

1. **Vào Supabase Dashboard**
2. **Dùng Ctrl+F** tìm kiếm:
   - "localhost"
   - "redirect"
   - "site url"
   - "callback"

## 🎯 Alternative: Dùng Supabase CLI

Nếu không tìm thấy trong UI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Check auth config
supabase projects list
supabase link --project-ref yxzvjlcyfcjcksrjjmmi
```

---

**Hãy thử truy cập các URL trên và cho tôi biết bạn thấy gì!**