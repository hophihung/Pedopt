# 🔧 Fix lỗi "Invalid Origin: URIs must not contain a path"

## ❌ Nguyên nhân lỗi
Bạn đang nhập URI có path vào sai phần trong Google Console.

## ✅ Cách phân biệt 2 phần

### 1. Authorized JavaScript origins
**Chỉ nhập domain** (không có path, không có `/`):
```
✅ Đúng: https://yxzvjlcyfcjcksrjjmmi.supabase.co
❌ Sai:  https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
```

### 2. Authorized redirect URIs  
**Nhập full URI** (có path):
```
✅ Đúng: https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
✅ Đúng: petadoption://auth/callback
```

## 🔧 Cách cấu hình đúng

### BƯỚC 1: Authorized JavaScript origins
Trong phần **"Authorized JavaScript origins"**:
- Click **"+ ADD URI"**
- Nhập: `https://yxzvjlcyfcjcksrjjmmi.supabase.co`
- **KHÔNG** thêm `/auth/v1/callback`

### BƯỚC 2: Authorized redirect URIs
Trong phần **"Authorized redirect URIs"**:
- Click **"+ ADD URI"**
- Nhập: `https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback`
- Click **"+ ADD URI"** lần nữa
- Nhập: `petadoption://auth/callback`

## 📋 Cấu hình hoàn chỉnh

```
📍 Authorized JavaScript origins:
   https://yxzvjlcyfcjcksrjjmmi.supabase.co

📍 Authorized redirect URIs:
   https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
   petadoption://auth/callback
```

## 🎯 Tại sao cần cả 2?

| Phần | Mục đích |
|------|----------|
| **JavaScript origins** | Cho phép domain gọi Google APIs |
| **Redirect URIs** | Nơi Google redirect sau khi đăng nhập |

## 🚨 Lưu ý quan trọng

- **JavaScript origins**: Chỉ domain, không có path
- **Redirect URIs**: Full URI với path
- **Không nhầm lẫn** 2 phần này

## ✅ Checklist

- [ ] JavaScript origins: `https://yxzvjlcyfcjcksrjjmmi.supabase.co`
- [ ] Redirect URI 1: `https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback`
- [ ] Redirect URI 2: `petadoption://auth/callback`
- [ ] Click "Save"

Sau khi cấu hình đúng, lỗi sẽ biến mất!