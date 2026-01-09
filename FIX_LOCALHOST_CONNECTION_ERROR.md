# 🔧 Fix lỗi "từ chối kết nối từ localhost -102"

## ❌ Nguyên nhân lỗi
- Google OAuth thành công
- Nhưng app không thể kết nối với Supabase để tạo session
- Lỗi network connection (-102)

## 🔍 Các nguyên nhân có thể

### 1. Network/Internet issues
- Thiết bị mất kết nối internet
- WiFi/Mobile data không ổn định
- Firewall/Proxy chặn kết nối

### 2. Supabase URL/Key sai
- SUPABASE_URL không đúng
- SUPABASE_ANON_KEY không đúng
- Supabase project bị tạm ngưng

### 3. OAuth callback handling
- Callback URL không được xử lý đúng
- Session không được tạo sau OAuth

## 🔧 Các bước fix

### BƯỚC 1: Kiểm tra kết nối mạng

1. **Test internet trên thiết bị**:
   - Mở browser, truy cập google.com
   - Đảm bảo internet hoạt động bình thường

2. **Test Supabase connection**:
   - Thêm debug code để test kết nối

### BƯỚC 2: Kiểm tra Supabase config

1. **Verify Supabase URL**:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://yxzvjlcyfcjcksrjjmmi.supabase.co
   ```

2. **Test Supabase connection**:
   - Thử call một API đơn giản
   - Kiểm tra project có hoạt động không

### BƯỚC 3: Debug OAuth callback

1. **Thêm logs trong AuthContext**
2. **Kiểm tra session creation**
3. **Debug callback handling**

## 🛠️ Debug Script

Thêm code này để debug:

```typescript
// Trong AuthContext.tsx hoặc component test
const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
    } else {
      console.log('✅ Supabase connection OK');
    }
  } catch (err) {
    console.error('💥 Network error:', err);
  }
};

// Call this function to test
testSupabaseConnection();
```

## 🎯 Quick fixes

### Fix 1: Restart app và clear cache
```bash
npx expo start --clear
```

### Fix 2: Kiểm tra Supabase project status
- Truy cập Supabase Dashboard
- Kiểm tra project có bị pause không
- Kiểm tra API keys còn valid không

### Fix 3: Test trên WiFi khác
- Thử kết nối WiFi khác
- Hoặc dùng mobile data
- Kiểm tra có bị firewall chặn không

### Fix 4: Thêm timeout và retry logic

```typescript
// Trong google-auth.service.ts
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'petadoption://auth/callback',
    scopes: 'openid email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'select_account',
    },
  },
});

// Thêm timeout
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Connection timeout')), 10000)
);

try {
  await Promise.race([authPromise, timeoutPromise]);
} catch (error) {
  console.error('Auth timeout or network error:', error);
}
```

## 🚨 Lưu ý quan trọng

- **Lỗi -102** thường là network issue
- **Google OAuth thành công** nhưng Supabase connection fail
- **Kiểm tra internet** trước tiên
- **Test Supabase connection** riêng biệt

## ✅ Checklist debug

- [ ] Internet connection OK
- [ ] Supabase URL đúng
- [ ] Supabase project active
- [ ] Clear cache và restart
- [ ] Test trên network khác
- [ ] Thêm debug logs
- [ ] Check firewall/proxy settings

## 🎉 Expected result

Sau khi fix, Google OAuth sẽ hoạt động hoàn toàn và tạo session thành công trong Supabase.