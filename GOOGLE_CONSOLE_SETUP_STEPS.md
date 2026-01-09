# 🔧 Hướng dẫn tạo Google OAuth Client đúng cách

## ❌ Vấn đề hiện tại
Bạn đang xem **"Client ID for Android"** - loại này không có "Authorized redirect URIs".

## ✅ Giải pháp: Tạo Web Application OAuth Client

### BƯỚC 1: Tạo OAuth Client mới

1. **Truy cập Google Cloud Console**:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Tạo credentials mới**:
   - Click **"+ CREATE CREDENTIALS"**
   - Chọn **"OAuth client ID"**

3. **Chọn Application type**:
   - Chọn **"Web application"** (KHÔNG phải Android)
   - Đặt tên: `AdoPet Web OAuth Client`

### BƯỚC 2: Cấu hình Redirect URIs

Sau khi chọn "Web application", bạn sẽ thấy phần **"Authorized redirect URIs"**:

1. **Click "ADD URI"** và thêm:
   ```
   https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
   ```

2. **Click "ADD URI"** lần nữa và thêm:
   ```
   petadoption://auth/callback
   ```

3. **Click "CREATE"**

### BƯỚC 3: Lấy Client ID và Secret

Sau khi tạo xong, bạn sẽ nhận được:
- **Client ID**: Dạng `xxxxx.apps.googleusercontent.com`
- **Client Secret**: Chuỗi ký tự ngẫu nhiên

**Lưu lại** cả hai thông tin này!

### BƯỚC 4: Cấu hình Supabase

1. **Truy cập Supabase Dashboard**:
   ```
   https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/providers
   ```

2. **Enable Google Provider**:
   - Bật toggle cho Google
   - Nhập **Client ID** vừa lấy được
   - Nhập **Client Secret** vừa lấy được
   - Click **"Save"**

## 🎯 Tại sao cần Web Application?

| Loại Client | Có Redirect URIs? | Dùng cho |
|-------------|-------------------|----------|
| **Android** | ❌ Không | Native Android apps |
| **iOS** | ❌ Không | Native iOS apps |
| **Web application** | ✅ Có | Web apps, OAuth flows |

**Supabase OAuth** cần **Web application** client vì nó hoạt động qua web redirect flow.

## 🔍 Kiểm tra cấu hình

Sau khi hoàn thành, bạn sẽ thấy:

1. **Trong Google Console**:
   - Web application OAuth client
   - 2 redirect URIs đã được thêm

2. **Trong Supabase**:
   - Google provider enabled
   - Client ID và Secret đã nhập

## 🚨 Lưu ý quan trọng

- **Giữ lại Android OAuth client** nếu bạn có kế hoạch dùng native Google Sign-In
- **Web OAuth client** dùng cho Supabase OAuth flow
- **Có thể có cả 2 loại** trong cùng 1 project

## 🎉 Test thử

Sau khi cấu hình xong:
1. Chạy app trên thiết bị thật
2. Thử đăng nhập Google
3. Không còn lỗi `redirect_uri_mismatch`

---

**Nếu vẫn không thấy "Authorized redirect URIs" sau khi chọn "Web application", hãy chụp màn hình để tôi hỗ trợ thêm!**