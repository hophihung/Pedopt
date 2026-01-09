import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PetCacheContextType {
  // Generic cache methods
  setCache: <T>(key: string, data: T, ttlMinutes?: number) => Promise<void>;
  getCache: <T>(key: string) => Promise<T | null>;
  clearCache: (key: string) => Promise<void>;
  clearAllCache: () => Promise<void>;
  
  // Pet-specific cache methods
  setCachedUserPets: (userId: string, pets: any[]) => Promise<void>;
  getCachedUserPets: (userId: string) => Promise<any[] | null>;
  invalidateUserPets: (userId: string) => Promise<void>;
  
  // Cache status
  isCacheValid: (key: string) => Promise<boolean>;
  getCacheAge: (key: string) => Promise<number | null>; // minutes
}

const PetCacheContext = createContext<PetCacheContextType | undefined>(undefined);

const CACHE_PREFIX = 'pet_cache_';
const DEFAULT_TTL_MINUTES = 10; // Cache for 10 minutes by default

export function PetCacheProvider({ children }: { children: React.ReactNode }) {
  const [memoryCache] = useState(new Map<string, CacheItem<any>>());
  const cacheRefs = useRef(new Set<string>());

  // Generic cache setter
  const setCache = useCallback(async <T,>(
    key: string, 
    data: T, 
    ttlMinutes: number = DEFAULT_TTL_MINUTES
  ): Promise<void> => {
    const now = Date.now();
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + (ttlMinutes * 60 * 1000),
    };

    const cacheKey = `${CACHE_PREFIX}${key}`;
    
    try {
      // Store in memory cache for immediate access
      memoryCache.set(cacheKey, cacheItem);
      cacheRefs.current.add(cacheKey);
      
      // Store in AsyncStorage for persistence
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      
      console.log(`✅ Cache set for key: ${key}, TTL: ${ttlMinutes}min`);
    } catch (error) {
      console.error('❌ Error setting cache:', error);
    }
  }, [memoryCache]);

  // Generic cache getter
  const getCache = useCallback(async <T,>(key: string): Promise<T | null> => {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const now = Date.now();

    try {
      // Check memory cache first
      let cacheItem = memoryCache.get(cacheKey);
      
      // If not in memory, check AsyncStorage
      if (!cacheItem) {
        const stored = await AsyncStorage.getItem(cacheKey);
        if (stored) {
          cacheItem = JSON.parse(stored) as CacheItem<T>;
          // Restore to memory cache
          memoryCache.set(cacheKey, cacheItem);
          cacheRefs.current.add(cacheKey);
        }
      }

      if (!cacheItem) {
        console.log(`📭 Cache miss for key: ${key}`);
        return null;
      }

      // Check if cache is expired
      if (now > cacheItem.expiresAt) {
        console.log(`⏰ Cache expired for key: ${key}`);
        await clearCache(key);
        return null;
      }

      const ageMinutes = Math.round((now - cacheItem.timestamp) / (60 * 1000));
      console.log(`📦 Cache hit for key: ${key}, age: ${ageMinutes}min`);
      
      return cacheItem.data;
    } catch (error) {
      console.error('❌ Error getting cache:', error);
      return null;
    }
  }, [memoryCache]);

  // Clear specific cache
  const clearCache = useCallback(async (key: string): Promise<void> => {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    
    try {
      memoryCache.delete(cacheKey);
      cacheRefs.current.delete(cacheKey);
      await AsyncStorage.removeItem(cacheKey);
      
      console.log(`🗑️ Cache cleared for key: ${key}`);
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }, [memoryCache]);

  // Clear all cache
  const clearAllCache = useCallback(async (): Promise<void> => {
    try {
      // Clear memory cache
      memoryCache.clear();
      
      // Clear AsyncStorage cache
      const keys = Array.from(cacheRefs.current);
      if (keys.length > 0) {
        await AsyncStorage.multiRemove(keys);
      }
      
      cacheRefs.current.clear();
      console.log('🗑️ All pet cache cleared');
    } catch (error) {
      console.error('❌ Error clearing all cache:', error);
    }
  }, [memoryCache]);

  // Pet-specific: Cache user pets
  const setCachedUserPets = useCallback(async (userId: string, pets: any[]): Promise<void> => {
    await setCache(`user_pets_${userId}`, pets, 60); // Cache for 60 minutes (1 hour)
  }, [setCache]);

  // Pet-specific: Get cached user pets
  const getCachedUserPets = useCallback(async (userId: string): Promise<any[] | null> => {
    return await getCache<any[]>(`user_pets_${userId}`);
  }, [getCache]);

  // Pet-specific: Invalidate user pets cache
  const invalidateUserPets = useCallback(async (userId: string): Promise<void> => {
    await clearCache(`user_pets_${userId}`);
  }, [clearCache]);

  // Check if cache is valid (not expired)
  const isCacheValid = useCallback(async (key: string): Promise<boolean> => {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const now = Date.now();

    try {
      let cacheItem = memoryCache.get(cacheKey);
      
      if (!cacheItem) {
        const stored = await AsyncStorage.getItem(cacheKey);
        if (stored) {
          cacheItem = JSON.parse(stored);
        }
      }

      return cacheItem ? now <= cacheItem.expiresAt : false;
    } catch (error) {
      console.error('❌ Error checking cache validity:', error);
      return false;
    }
  }, [memoryCache]);

  // Get cache age in minutes
  const getCacheAge = useCallback(async (key: string): Promise<number | null> => {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const now = Date.now();

    try {
      let cacheItem = memoryCache.get(cacheKey);
      
      if (!cacheItem) {
        const stored = await AsyncStorage.getItem(cacheKey);
        if (stored) {
          cacheItem = JSON.parse(stored);
        }
      }

      return cacheItem ? Math.round((now - cacheItem.timestamp) / (60 * 1000)) : null;
    } catch (error) {
      console.error('❌ Error getting cache age:', error);
      return null;
    }
  }, [memoryCache]);

  const value: PetCacheContextType = {
    setCache,
    getCache,
    clearCache,
    clearAllCache,
    setCachedUserPets,
    getCachedUserPets,
    invalidateUserPets,
    isCacheValid,
    getCacheAge,
  };

  return (
    <PetCacheContext.Provider value={value}>
      {children}
    </PetCacheContext.Provider>
  );
}

export function usePetCache() {
  const context = useContext(PetCacheContext);
  if (context === undefined) {
    throw new Error('usePetCache must be used within a PetCacheProvider');
  }
  return context;
}