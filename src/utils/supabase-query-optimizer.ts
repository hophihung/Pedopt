/**
 * Supabase Query Optimizer
 * Utilities để tối ưu hóa queries và giảm tài nguyên
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseCache, generateCacheKey } from './supabase-cache';

interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
  retries?: number;
  timeout?: number;
}

/**
 * Optimized query với caching và retry
 */
export async function optimizedQuery<T>(
  client: SupabaseClient,
  table: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: QueryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const {
    cache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    retries = 3,
    timeout = 10000, // 10 seconds
  } = options;

  // Generate cache key
  const cacheKey = generateCacheKey(table, { query: queryFn.toString() });

  // Check cache first
  if (cache) {
    const cached = supabaseCache.get<T>(cacheKey);
    if (cached !== null) {
      return { data: cached, error: null };
    }
  }

  // Execute query with retry
  let lastError: any = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Add timeout
      const queryPromise = queryFn();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), timeout);
      });

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (!error && data) {
        // Cache the result
        if (cache) {
          supabaseCache.set(cacheKey, data, cacheTTL);
        }
        return { data, error: null };
      }

      if (error) {
        lastError = error;
        // Don't retry on certain errors
        if (error.code === 'PGRST116' || error.code === '23505') {
          return { data: null, error };
        }
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    } catch (err: any) {
      lastError = err;
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  return { data: null, error: lastError };
}

/**
 * Batch multiple queries in parallel
 */
export async function batchQueries<T extends Record<string, any>>(
  queries: Record<keyof T, () => Promise<{ data: any; error: any }>>
): Promise<{ [K in keyof T]: { data: any; error: any } }> {
  const keys = Object.keys(queries) as Array<keyof T>;
  const results = await Promise.all(
    keys.map(async (key) => {
      try {
        return await queries[key]();
      } catch (error) {
        return { data: null, error };
      }
    })
  );

  const result: any = {};
  keys.forEach((key, index) => {
    result[key] = results[index];
  });

  return result;
}

/**
 * Select only needed fields (reduces payload size)
 */
export function selectFields(fields: string[]): string {
  return fields.join(', ');
}

/**
 * Pagination helper
 */
export function paginate(page: number, pageSize: number) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

/**
 * Count query (head: true to reduce data transfer)
 */
export async function countQuery(
  client: SupabaseClient,
  table: string,
  filter?: (query: any) => any
): Promise<number> {
  let query = client.from(table).select('*', { count: 'exact', head: true });
  
  if (filter) {
    query = filter(query);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

/**
 * Invalidate cache for a table
 */
export function invalidateCache(table: string): void {
  // Clear all cache entries for this table
  // This is a simple implementation - you might want to track keys per table
  supabaseCache.clear();
}

