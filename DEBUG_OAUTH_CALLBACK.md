# 🔍 Debug OAuth Callback - Theo dõi URL redirect

## 📍 Các cách theo dõi callback URL

### 1. Metro Console Logs (Chính)

**Mở Metro bundler** và tìm các logs:

```
🔵 Opening OAuth URL: https://accounts.google.com/o/oauth2/auth?...
🔵 OAuth result type: success
🔵 OAuth success, handling callback...
🔵 Handling Google OAuth callback: petadoption://auth/callback#access_token=...
```

**Nếu thấy logs này** → Callback đã về app thành công

### 2. React Native Debugger

1. **Enable Remote JS Debugging**
2. **Mở Chrome DevTools**
3. **Console tab** sẽ hiện logs chi tiết

### 3. Expo Development Tools

1. **Trong Expo CLI**, press `m` để mở menu
2. **Chọn "Open DevTools"**
3. **Console tab** hiện logs

### 4. Device Logs (Android)

```bash
# Xem logs trực tiếp từ device
adb logcat | grep -i "oauth\|callback\|petadoption"
```

## 🎯 Callback URL Structure

### ✅ Callback thành công:
```
petadoption://auth/callback#access_token=ya29.xxx&token_type=Bearer&expires_in=3599&scope=openid%20profile%20email&authuser=0&prompt=none
```

### ❌ Callback thất bại:
```
petadoption://auth/callback?error=access_denied&error_description=...
```

## 🔧 Thêm debug logs để theo dõi

Hãy thêm code này để debug callback:

```typescript
// Trong app/(tabs)/_layout.tsx hoặc App.tsx
import { Linking } from 'react-native';

useEffect(() => {
  // Listen for deep links
  const handleDeepLink = (url: string) => {
    console.log('🔗 Deep link received:', url);
    
    if (url.startsWith('petadoption://auth/callback')) {
      console.log('✅ OAuth callback detected!');
      console.log('📋 Full callback URL:', url);
      
      // Parse URL parameters
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.hash.substring(1));
      
      console.log('🔍 Callback parameters:');
      for (const [key, value] of params.entries()) {
        console.log(`  ${key}: ${value.substring(0, 50)}...`);
      }
    }
  };

  // Listen for initial URL (app opened via deep link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log('🚀 App opened with URL:', url);
      handleDeepLink(url);
    }
  });

  // Listen for URL changes (app already open)
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  return () => subscription?.remove();
}, []);
```

## 📱 Test Deep Link Manually

### Trên Android:
```bash
# Test deep link trực tiếp
adb shell am start -W -a android.intent.action.VIEW -d "petadoption://auth/callback#test=123" com.petadoption.app
```

### Trên iOS Simulator:
```bash
# Test deep link
xcrun simctl openurl booted "petadoption://auth/callback#test=123"
```

## 🚨 Các vấn đề thường gặp

### 1. Callback không về app
**Logs sẽ thấy**:
```
🔵 OAuth result type: cancel
```
**Nguyên nhân**: Deep link không hoạt động

### 2. Callback về nhưng không parse được
**Logs sẽ thấy**:
```
🔵 Handling Google OAuth callback: petadoption://auth/callback
❌ No parameters found in callback URL
```
**Nguyên nhân**: URL format sai

### 3. Callback về localhost
**Logs sẽ thấy**:
```
🔵 OAuth result type: success
🔵 OAuth success, handling callback...
🔵 Handling Google OAuth callback: http://localhost:3000/...
```
**Nguyên nhân**: Supabase redirect URL sai

## ✅ Checklist debug

- [ ] Mở Metro console
- [ ] Thêm debug logs cho deep links
- [ ] Test manual deep link
- [ ] Kiểm tra app scheme trong app.config.js
- [ ] Verify Supabase redirect URLs
- [ ] Check Google Console redirect URIs

## 🎯 Expected Flow

1. **User clicks Google login**
2. **Opens browser**: `accounts.google.com/o/oauth2/auth?...`
3. **User authorizes**
4. **Redirects to**: `petadoption://auth/callback#access_token=...`
5. **App receives deep link**
6. **Logs show**: `🔵 Handling Google OAuth callback`
7. **Session created successfully**

---

**Hãy thêm debug code trên và cho tôi biết logs hiển thị gì khi bạn thử login Google!**