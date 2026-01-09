# Supabase Optimization Guide

## 1. Query Optimization

### ✅ Select chỉ fields cần thiết
```typescript
// ❌ BAD - Lấy tất cả fields
const { data } = await supabase.from('pets').select('*');

// ✅ GOOD - Chỉ lấy fields cần thiết
const { data } = await supabase
  .from('pets')
  .select('id, name, price, images, is_available');
```

### ✅ Sử dụng joins thay vì N+1 queries
```typescript
// ❌ BAD - N+1 queries
const { data: pets } = await supabase.from('pets').select('*');
for (const pet of pets) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', pet.seller_id)
    .single();
}

// ✅ GOOD - Single query với join
const { data: pets } = await supabase
  .from('pets')
  .select(`
    id,
    name,
    price,
    images,
    profiles!pets_seller_id_fkey (
      id,
      full_name,
      avatar_url
    )
  `);
```

### ✅ Pagination cho large datasets
```typescript
// ✅ GOOD - Pagination
const PAGE_SIZE = 20;
const { data, error } = await supabase
  .from('pets')
  .select('id, name, price')
  .eq('is_available', true)
  .order('created_at', { ascending: false })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
```

### ✅ Sử dụng count với head: true
```typescript
// ❌ BAD - Lấy tất cả data chỉ để đếm
const { data } = await supabase.from('pets').select('*');
const count = data?.length || 0;

// ✅ GOOD - Chỉ đếm không lấy data
const { count } = await supabase
  .from('pets')
  .select('*', { count: 'exact', head: true });
```

## 2. Caching Strategy

### ✅ Cache tại client side
```typescript
// Tạo cache service
class SupabaseCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}
```

## 3. Batch Operations

### ✅ Batch multiple queries
```typescript
// ❌ BAD - Sequential queries
const pets = await supabase.from('pets').select('*');
const products = await supabase.from('products').select('*');
const orders = await supabase.from('orders').select('*');

// ✅ GOOD - Parallel queries
const [petsRes, productsRes, ordersRes] = await Promise.all([
  supabase.from('pets').select('id, name'),
  supabase.from('products').select('id, name'),
  supabase.from('orders').select('id, status')
]);
```

## 4. Realtime Optimization

### ✅ Unsubscribe khi không cần
```typescript
useEffect(() => {
  const channel = supabase
    .channel('pets')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'pets' },
      (payload) => {
        // Handle update
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, []);
```

### ✅ Debounce realtime updates
```typescript
import { debounce } from 'lodash';

const debouncedUpdate = debounce((data) => {
  setPets(data);
}, 300);

channel.on('postgres_changes', (payload) => {
  debouncedUpdate(payload.new);
});
```

## 5. Index Optimization

### ✅ Tạo indexes cho các queries thường dùng
```sql
-- Index cho queries với WHERE
CREATE INDEX idx_pets_seller_id ON public.pets(seller_id);
CREATE INDEX idx_pets_is_available ON public.pets(is_available) WHERE is_available = true;

-- Composite index cho queries phức tạp
CREATE INDEX idx_orders_seller_status ON public.orders(seller_id, status);

-- Index cho ORDER BY
CREATE INDEX idx_pets_created_at_desc ON public.pets(created_at DESC);
```

## 6. RLS Policy Optimization

### ✅ Tối ưu RLS policies
```sql
-- ❌ BAD - Subquery trong mỗi row
CREATE POLICY "bad_policy"
  ON public.orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller')
  );

-- ✅ GOOD - Sử dụng function hoặc direct check
CREATE POLICY "good_policy"
  ON public.orders FOR SELECT
  USING (seller_id = auth.uid());
```

## 7. Connection Pooling

### ✅ Sử dụng connection pooling
```typescript
// Tạo singleton supabase client
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'pedopt-app',
        },
      },
    });
  }
  return supabaseClient;
}
```

## 8. Error Handling & Retry

### ✅ Retry logic cho failed requests
```typescript
async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries = 3
): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    const { data, error } = await queryFn();
    if (!error) return data;
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}
```

## 9. Lazy Loading

### ✅ Load data khi cần
```typescript
// Sử dụng React.lazy hoặc load on demand
const loadPetDetails = async (petId: string) => {
  if (!petDetailsCache.has(petId)) {
    const { data } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .single();
    petDetailsCache.set(petId, data);
  }
  return petDetailsCache.get(petId);
};
```

## 10. Monitoring & Analytics

### ✅ Track query performance
```typescript
const trackQuery = async (queryName: string, queryFn: () => Promise<any>) => {
  const start = performance.now();
  const result = await queryFn();
  const duration = performance.now() - start;
  
  if (duration > 1000) {
    console.warn(`Slow query: ${queryName} took ${duration}ms`);
  }
  
  return result;
};
```

