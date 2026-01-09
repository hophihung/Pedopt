# ⚡ Tối ưu tốc độ Google Login

## 🐌 Nguyên nhân login Google chậm

### 1. Network Issues
- **Kết nối internet chậm**
- **DNS resolution chậm**
- **Supabase server xa**

### 2. OAuth Flow phức tạp
- **Multiple redirects**: Google → Supabase → App
- **Token exchange** mất thời gian
- **Session creation** chậm

### 3. App Processing
- **Profile creation/update** chậm
- **Database queries** nhiều
- **IP tracking** và validation

### 4. Development Environment
- **Expo development server** chậm
- **Hot reload** can thiệp
- **Debug logs** nhiều

## ⚡ Các cách tối ưu

### 1. Tối ưu OAuth Flow

```typescript
// Thêm timeout cho OAuth
const OAUTH_TIMEOUT = 15000; // 15 seconds

const signInWithGoogleFast = async () => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('OAuth timeout')), OAUTH_TIMEOUT)
  );

  const oauthPromise = supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'petadoption://auth/callback',
      scopes: 'openid email profile', // Minimal scopes
    },
  });

  return Promise.race([oauthPromise, timeoutPromise]);
};
```

### 2. Tối ưu Profile Processing

```typescript
// Trong AuthContext.tsx - tối ưu fetchProfile
const fetchProfile = async (userId: string) => {
  try {
    // Parallel queries thay vì sequential
    const [profileResult, subscriptionResult] = await Promise.allSettled([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.rpc('ensure_seller_has_subscription', { user_profile_id: userId })
    ]);

    // Handle results...
  } catch (error) {
    // Handle error...
  }
};
```

### 3. Giảm Database Queries

```typescript
// Tối ưu signInWithEmail trong AuthContext
const signInWithEmail = async (email: string, password: string) => {
  setLoading(true);
  
  try {
    // Đăng nhập trước, track IP sau
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data?.session?.user) {
      // Set session ngay lập tức
      setSession(data.session);
      setUser(data.session.user);
      
      // Background tasks - không block UI
      Promise.allSettled([
        fetchProfile(data.session.user.id),
        trackUserIP(data.session.user.id), // Background
      ]);

      // Navigate ngay
      router.replace('/(tabs)/discover/match' as any);
    }
  } finally {
    setLoading(false);
  }
};
```

### 4. Optimize Loading States

```typescript
// Thêm loading states chi tiết
const [authStep, setAuthStep] = useState<string>('');

const signInWithGoogle = async () => {
  try {
    setAuthStep('Connecting to Google...');
    // OAuth flow
    
    setAuthStep('Authenticating...');
    // Handle callback
    
    setAuthStep('Setting up profile...');
    // Profile setup
    
    setAuthStep('Complete!');
  } catch (error) {
    setAuthStep('');
    throw error;
  }
};
```

## 🚀 Quick Fixes

### 1. Giảm Scopes
```typescript
// Chỉ yêu cầu scopes cần thiết
scopes: 'openid email profile' // Thay vì nhiều scopes
```

### 2. Skip IP Tracking (tạm thời)
```typescript
// Comment out IP tracking để test
// await getClientIPWithRetry();
// await supabase.rpc('track_user_ip', ...);
```

### 3. Parallel Processing
```typescript
// Xử lý song song thay vì tuần tự
await Promise.all([
  fetchProfile(userId),
  handleSocialPostLogin(userId),
]);
```

### 4. Production Build
```bash
# Test với production build (nhanh hơn dev)
npx expo run:android --variant release
```

## 📊 Benchmark Times

| Bước | Thời gian mong đợi | Nếu chậm hơn |
|------|-------------------|--------------|
| **OAuth popup** | 2-3s | Check network |
| **Token exchange** | 1-2s | Check Supabase |
| **Profile fetch** | 1s | Optimize queries |
| **Total** | 4-6s | > 10s = có vấn đề |

## 🔍 Debug Performance

```typescript
// Thêm performance tracking
const performanceTracker = {
  start: Date.now(),
  
  mark(step: string) {
    console.log(`⏱️ ${step}: ${Date.now() - this.start}ms`);
  }
};

// Trong OAuth flow
performanceTracker.mark('OAuth started');
// ... OAuth code
performanceTracker.mark('OAuth completed');
performanceTracker.mark('Profile fetch started');
// ... Profile code
performanceTracker.mark('Profile fetch completed');
```

## ✅ Checklist tối ưu

- [ ] Giảm OAuth scopes
- [ ] Parallel processing
- [ ] Skip non-essential operations
- [ ] Add timeout handling
- [ ] Test trên production build
- [ ] Monitor performance logs
- [ ] Optimize database queries

---

**Thử áp dụng các optimizations trên và cho tôi biết kết quả!**