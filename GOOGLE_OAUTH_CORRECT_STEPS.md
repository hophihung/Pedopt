# 🔧 Hướng dẫn tạo OAuth Client ID (KHÔNG phải API Key)

## ❌ Vấn đề hiện tại
Bạn đang xem **API Key** - loại này không có "Authorized redirect URIs".

## ✅ Cần tạo OAuth 2.0 Client ID

### BƯỚC 1: Quay lại trang Credentials chính

1. **Click vào mũi tên "Back" hoặc breadcrumb** để quay lại trang chính
2. **Hoặc truy cập trực tiếp**:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

### BƯỚC 2: Tạo OAuth 2.0 Client ID (KHÔNG phải API Key)

1. **Tại trang Credentials chính**, click **"+ CREATE CREDENTIALS"**

2. **Chọn "OAuth client ID"** (KHÔNG chọn "API key")
   ```
   + CREATE CREDENTIALS
   ├── API key          ❌ (Bạn đang xem cái này)
   ├── OAuth client ID  ✅ (Cần chọn cái này)
   └── Service account key
   ```

3. **Nếu chưa cấu hình OAuth consent screen**:
   - Sẽ có thông báo yêu cầu cấu hình
   - Click **"CONFIGURE CONSENT SCREEN"**
   - Chọn **"External"** → **"CREATE"**
   - Điền thông tin cơ bản:
     - App name: `AdoPet`
     - User support email: email của bạn
     - Developer contact: email của bạn
   - Click **"SAVE AND CONTINUE"** qua các bước

### BƯỚC 3: Tạo OAuth Client ID

Sau khi cấu hình consent screen:

1. **Quay lại tạo OAuth client ID**
2. **Chọn Application type**: **"Web application"**
3. **Đặt tên**: `AdoPet OAuth Client`
4. **Thêm Authorized redirect URIs**:
   - Click **"+ ADD URI"**
   - Nhập: `https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback`
   - Click **"+ ADD URI"** lần nữa
   - Nhập: `petadoption://auth/callback`
5. **Click "CREATE"**

### BƯỚC 4: Lưu Client ID và Secret

Sau khi tạo xong, popup sẽ hiện:
- **Client ID**: `xxxxx.apps.googleusercontent.com`
- **Client secret**: `GOCSPX-xxxxx`

**Sao chép và lưu lại** cả hai!

## 🔍 Phân biệt API Key vs OAuth Client ID

| Loại | Mục đích | Có Redirect URIs? |
|------|----------|-------------------|
| **API Key** | Call Google APIs | ❌ Không |
| **OAuth Client ID** | Đăng nhập Google | ✅ Có |

**Để đăng nhập Google**, bạn cần **OAuth Client ID**, không phải API Key.

## 🎯 Sau khi có OAuth Client ID

1. **Cấu hình Supabase**:
   - Truy cập: https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/providers
   - Enable Google provider
   - Nhập Client ID và Client Secret vừa lấy

2. **Test đăng nhập Google** trên app

## 🚨 Lưu ý

- **Giữ lại API Key** nếu app cần call Google APIs khác
- **OAuth Client ID** chỉ dùng cho đăng nhập
- **Có thể có cả 2** trong cùng project

---

**Tóm tắt**: Bạn cần tạo **OAuth Client ID** (không phải API Key) để có phần "Authorized redirect URIs".