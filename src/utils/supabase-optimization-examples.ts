/**
 * Examples: Cách sử dụng các optimization utilities
 * 
 * Đây là file ví dụ - không import vào code chính
 * Copy các patterns này vào các service files của bạn
 */

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { optimizedQuery, batchQueries, countQuery, paginate } from './supabase-query-optimizer';
import { realtimeManager, debounceRealtime } from './realtime-manager';
import { supabaseCache } from './supabase-cache';

// ============================================
// EXAMPLE 1: Optimized Query với Cache
// ============================================
export async function getPetsOptimized(userId: string) {
  return optimizedQuery(
    supabase,
    'pets',
    () =>
      supabase
        .from('pets')
        .select('id, name, price, images, is_available')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false }),
    {
      cache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      retries: 3,
    }
  );
}

// ============================================
// EXAMPLE 2: Batch Multiple Queries
// ============================================
export async function getDashboardData(userId: string) {
  return batchQueries({
    pets: () =>
      supabase
        .from('pets')
        .select('id, name')
        .eq('seller_id', userId)
        .limit(10),
    orders: () =>
      supabase
        .from('orders')
        .select('id, status')
        .eq('seller_id', userId)
        .limit(10),
    products: () =>
      supabase
        .from('products')
        .select('id, name')
        .eq('seller_id', userId)
        .limit(10),
  });
}

// ============================================
// EXAMPLE 3: Pagination
// ============================================
export async function getPetsPaginated(page: number, pageSize: number = 20) {
  const { from, to } = paginate(page, pageSize);

  return optimizedQuery(
    supabase,
    'pets',
    () =>
      supabase
        .from('pets')
        .select('id, name, price, images')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .range(from, to),
    { cache: true }
  );
}

// ============================================
// EXAMPLE 4: Count Query (Head: true)
// ============================================
export async function getPetCount(userId: string) {
  return countQuery(supabase, 'pets', (query) =>
    query.eq('seller_id', userId)
  );
}

// ============================================
// EXAMPLE 5: Select chỉ fields cần thiết
// ============================================
export async function getPetList() {
  // ❌ BAD - Lấy tất cả fields
  // const { data } = await supabase.from('pets').select('*');

  // ✅ GOOD - Chỉ lấy fields cần thiết
  const { data } = await supabase
    .from('pets')
    .select('id, name, price, images, is_available, created_at')
    .eq('is_available', true)
    .limit(20);

  return data;
}

// ============================================
// EXAMPLE 6: Join thay vì N+1 queries
// ============================================
export async function getPetsWithProfiles() {
  // ❌ BAD - N+1 queries
  // const { data: pets } = await supabase.from('pets').select('*');
  // for (const pet of pets) {
  //   const { data: profile } = await supabase
  //     .from('profiles')
  //     .select('full_name')
  //     .eq('id', pet.seller_id)
  //     .single();
  // }

  // ✅ GOOD - Single query với join
  const { data } = await supabase
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
    `)
    .eq('is_available', true)
    .limit(20);

  return data;
}

// ============================================
// EXAMPLE 7: Realtime với Manager
// ============================================
export function subscribeToPets(
  userId: string,
  onUpdate: (pet: any) => void
) {
  // Debounce updates để tránh quá nhiều re-renders
  const debouncedUpdate = debounceRealtime(onUpdate, 300);

  return realtimeManager.subscribe(`pets-${userId}`, {
    table: 'pets',
    event: 'UPDATE',
    filter: `seller_id=eq.${userId}`,
    callback: (payload) => {
      debouncedUpdate(payload.new);
    },
  });
}

// ============================================
// EXAMPLE 8: Invalidate Cache khi cần
// ============================================
export async function createPet(petData: any) {
  const { data, error } = await supabase
    .from('pets')
    .insert(petData)
    .select()
    .single();

  if (!error && data) {
    // Invalidate cache để data mới được load
    supabaseCache.delete('pets');
  }

  return { data, error };
}

// ============================================
// EXAMPLE 9: Cleanup Realtime Subscriptions
// ============================================
export function usePetsRealtime(userId: string) {
  useEffect(() => {
    const unsubscribe = subscribeToPets(userId, (pet) => {
      // Handle update
      console.log('Pet updated:', pet);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [userId]);
}

// ============================================
// EXAMPLE 10: Optimized Profile Query
// ============================================
export async function getProfileOptimized(userId: string) {
  return optimizedQuery(
    supabase,
    'profiles',
    () =>
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('id', userId)
        .single(),
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes (profiles don't change often)
    }
  );
}

