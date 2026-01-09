# 🔧 Fix Google OAuth "Missing Secret" Error

## ❌ Error: "unsupported provider missing OAuth secret"

## ✅ Solution Steps:

### 1. Get Google Credentials
From Google Cloud Console page you just opened:

**Client ID (already visible):**
```
1039156168116-a4ph8ta2n07u0itantpjsv7f1fm3jidv.apps.googleusercontent.com
```

**Client Secret:**
- Click the eye icon (👁️) next to "Client Secret (for OAuth)" field
- Copy the revealed secret

### 2. Configure Supabase
1. Go to: https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/providers
2. Find "Google" provider
3. Click "Enable" if not already enabled
4. Fill in:
   - **Client ID:** `1039156168116-a4ph8ta2n07u0itantpjsv7f1fm3jidv.apps.googleusercontent.com`
   - **Client Secret:** `[PASTE THE SECRET YOU COPIED]`
5. Click "Save"

### 3. Add Redirect URLs
In the same Supabase page, make sure these redirect URLs are configured:
```
petadoption://auth/callback
```

### 4. Verify Google Cloud Console
Back in Google Cloud Console, make sure:
- **Authorized redirect URIs** includes:
  ```
  https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback
  ```

### 5. Test the Fix
After saving in Supabase:
1. Build your app: `npx expo run:android`
2. Test Google login on real device
3. Check if error is resolved

## 🚨 Common Issues:

### Issue 1: Client Secret not visible
**Solution:** Click the eye icon (👁️) to reveal it

### Issue 2: "Invalid client" error
**Solution:** Double-check Client ID is copied correctly

### Issue 3: "Redirect URI mismatch"
**Solution:** Ensure redirect URIs match exactly in both Google and Supabase

## 📋 Checklist:
- [ ] ✅ Get Client Secret from Google Cloud Console
- [ ] ✅ Enable Google provider in Supabase
- [ ] ✅ Add Client ID to Supabase
- [ ] ✅ Add Client Secret to Supabase
- [ ] ✅ Configure redirect URLs
- [ ] ✅ Save configuration
- [ ] ✅ Test on real device

## 💡 Pro Tips:
- Client Secret is only shown once, copy it immediately
- Always test OAuth on real devices, not emulators
- Check browser console for detailed error messages
- Ensure both Google and Supabase configurations match exactly