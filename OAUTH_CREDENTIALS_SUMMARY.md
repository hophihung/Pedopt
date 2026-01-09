# 🔑 OAuth Credentials Summary

## 📱 App Information
- **Package Name:** `com.petadoption.app`
- **App Name:** Pet Adoption
- **Bundle ID (iOS):** `com.petadoption.app`

## 🔐 Android Debug Keystore
- **SHA-1 Fingerprint:** `E6:2D:C4:1F:8A:5F:AA:17:DA:48:0B:35:98:54:C3:75:B4:FC:F3:D8`
- **SHA-256 Fingerprint:** `34:E7:92:63:79:96:45:99:8F:14:26:3B:71:55:E5:91:45:0C:05:6D:DC:AA:22:E7:D6:2B:3D:8E:13:83:D5:9C`
- **Keystore Path:** `C:\Users\ADmin\.android\debug.keystore`
- **Alias:** `androiddebugkey`
- **Password:** `android`

## 🌐 Facebook Developer Console Setup

### 1. Basic Settings
**URL:** https://developers.facebook.com/apps/1731268644198831/settings/basic/

**Android Configuration:**
- Package Name: `com.petadoption.app`
- Class Name: `com.petadoption.app.MainActivity`
- Key Hash (SHA-1): `E6:2D:C4:1F:8A:5F:AA:17:DA:48:0B:35:98:54:C3:75:B4:FC:F3:D8`

### 2. Facebook Login Settings
**URL:** https://developers.facebook.com/apps/1731268644198831/fb-login/settings/

**Valid OAuth Redirect URIs:**
```
https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
petadoption://auth/callback
```

## 🌐 Google Cloud Console Setup

### 1. OAuth 2.0 Client ID (Android)
**URL:** https://console.cloud.google.com/apis/credentials

**Configuration:**
- Application Type: Android
- Package Name: `com.petadoption.app`
- SHA-1 Certificate Fingerprint: `E6:2D:C4:1F:8A:5F:AA:17:DA:48:0B:35:98:54:C3:75:B4:FC:F3:D8`

### 2. OAuth 2.0 Client ID (Web)
**For Supabase Integration:**
- Application Type: Web application
- Authorized redirect URIs:
  ```
  https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
  ```

## 🔧 Supabase Configuration

### Authentication Providers
**URL:** https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/providers

**Facebook Provider:**
- App ID: `1731268644198831`
- App Secret: `[GET FROM FACEBOOK DEVELOPER CONSOLE]`

**Google Provider:**
- Client ID: `[GET FROM GOOGLE CLOUD CONSOLE]`
- Client Secret: `[GET FROM GOOGLE CLOUD CONSOLE]`

**Redirect URLs:**
```
petadoption://auth/callback
```

## 📋 Checklist

### Facebook OAuth:
- [ ] Add Android app in Facebook Developer Console
- [ ] Configure package name and SHA-1
- [ ] Add OAuth redirect URIs
- [ ] Get App Secret
- [ ] Configure in Supabase

### Google OAuth:
- [ ] Create Android OAuth client in Google Cloud Console
- [ ] Configure package name and SHA-1
- [ ] Create Web OAuth client for Supabase
- [ ] Add redirect URIs
- [ ] Get Client ID and Secret
- [ ] Configure in Supabase

### Testing:
- [ ] Build Android app: `npx expo run:android`
- [ ] Test on real Android device
- [ ] Test Facebook login
- [ ] Test Google login
- [ ] Verify redirect flows

## 🚨 Important Notes

1. **Real Device Only:** OAuth only works on real devices, not emulators
2. **Debug vs Production:** These credentials are for DEBUG builds only
3. **Production Setup:** For production, you'll need to create production keystore and update fingerprints
4. **App Review:** Facebook and Google may require app review for production use

## 🔄 Production Setup (Later)

When ready for production:
1. Generate production keystore
2. Get production SHA-1 fingerprint
3. Update Facebook and Google configurations
4. Submit for app review if required
5. Update Supabase with production credentials

---

**Generated:** December 30, 2024  
**Debug Keystore Created:** ✅  
**SHA-1 Retrieved:** ✅  
**Ready for OAuth Setup:** ✅