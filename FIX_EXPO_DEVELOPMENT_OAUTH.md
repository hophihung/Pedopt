# 🔧 Fix Expo Development OAuth Redirect

## ❌ Vấn đề
Trong development mode, Expo redirect về `exp://192.168.1.52:8081` thay vì `petadoption://auth/callback`

## ✅ Giải pháp

### 1. Cập nhật Supabase Redirect URLs

**Truy cập**: https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/url-configuration

**Thêm cả 2 URLs**:
```
petadoption://auth/callback
exp://192.168.1.52:8081
```

### 2. Cập nhật Google Console

**Truy cập**: https://console.cloud.google.com/apis/credentials

**Trong Web OAuth Client → Authorized redirect URIs, thêm**:
```
https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
petadoption://auth/callback
exp://192.168.1.52:8081
```

### 3. Cập nhật code để handle cả 2

```typescript
// Trong google-auth.service.ts
const result = await WebBrowser.openAuthSessionAsync(
  oauthUrl,
  __DEV__ 
    ? 'exp://192.168.1.52:8081'  // Development
    : 'petadoption://auth/callback', // Production
  {
    showInRecents: true,
  }
);
```

## 🎯 Cấu hình hoàn chỉnh

### Supabase Redirect URLs:
```
✅ petadoption://auth/callback
✅ exp://192.168.1.52:8081
```

### Google Console Authorized redirect URIs:
```
✅ https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
✅ petadoption://auth/callback  
✅ exp://192.168.1.52:8081
```

## 🚨 Lưu ý quan trọng

- **IP address có thể thay đổi** khi restart Expo
- **Port có thể khác** (8081, 19000, 19001)
- **Kiểm tra Metro logs** để xác nhận exact URL

## 🔍 Cách tìm exact development URL

```bash
# Chạy Expo và xem logs
npx expo start

# Tìm dòng như:
# Metro waiting on exp://192.168.1.52:8081
# Hoặc: Expo DevTools is running at http://localhost:19002
```

## ✅ Test sau khi cấu hình

1. **Thêm URLs vào Supabase và Google Console**
2. **Restart Expo**: `npx expo start --clear`
3. **Thử login Google**
4. **Kiểm tra redirect về đúng app**

---

**Hãy thêm `exp://192.168.1.52:8081` vào cả Supabase và Google Console!**