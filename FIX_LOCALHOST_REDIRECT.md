# 🔧 Fix lỗi localhost redirect trong Google OAuth

## ❌ Vấn đề
Google OAuth đang redirect về `localhost:3000` thay vì `petadoption://auth/callback`

## 🔍 Nguyên nhân
1. **Supabase Site URL** cấu hình sai
2. **Development environment** override redirect URL
3. **Expo development server** can thiệp vào OAuth flow

## ✅ Giải pháp

### BƯỚC 1: Kiểm tra Supabase Site URL

1. **Truy cập Supabase Dashboard**:
   ```
   https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/settings/general
   ```

2. **Kiểm tra "Site URL"**:
   - Nếu là `http://localhost:3000` → **SAI**
   - Phải là `petadoption://auth/callback` hoặc để trống

3. **Cập nhật Site URL**:
   - Xóa `http://localhost:3000`
   - Để trống hoặc nhập `petadoption://`
   - Click **"Save"**

### BƯỚC 2: Kiểm tra Additional URLs

1. **Trong cùng trang Settings**:
   - Tìm **"Additional URLs"** hoặc **"Redirect URLs"**
   - Đảm bảo có: `petadoption://auth/callback`
   - Xóa bất kỳ localhost URLs nào

### BƯỚC 3: Restart Expo và clear cache

```bash
# Stop Expo server
Ctrl+C

# Clear cache và restart
npx expo start --clear
```

### BƯỚC 4: Test trên production build (khuyến nghị)

```bash
# Build production APK
npx expo build:android

# Hoặc development build
npx expo run:android --variant release
```

## 🎯 Tại sao có lỗi localhost?

| Môi trường | Redirect URL | Lý do |
|------------|--------------|-------|
| **Expo Dev** | `localhost:3000` | Development server |
| **Production** | `petadoption://` | Actual app scheme |

**Expo development server** có thể override redirect URLs để phục vụ development.

## 🔧 Workaround đã áp dụng

Code đã được cập nhật để tự động fix localhost URLs:

```typescript
// Detect và fix localhost redirect
if (oauthUrl.includes('redirect_to=http%3A//localhost')) {
  oauthUrl = oauthUrl.replace(
    /redirect_to=http%3A\/\/localhost[^&]*/,
    'redirect_to=petadoption%3A//auth/callback'
  );
}
```

## ✅ Checklist fix

- [ ] Supabase Site URL không phải localhost
- [ ] Additional URLs có petadoption://auth/callback
- [ ] Clear cache và restart Expo
- [ ] Test trên production build
- [ ] Kiểm tra logs để confirm fix

## 🎉 Kết quả mong đợi

Sau khi fix:
- Google OAuth sẽ redirect về app
- Không còn lỗi "localhost refused to connect"
- Đăng nhập thành công

---

**Lưu ý**: Nếu vẫn lỗi, hãy thử build production APK để test, vì development environment có thể can thiệp OAuth flow.