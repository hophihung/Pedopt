import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation } from '@/src/features/chat';

interface ChatCacheData {
  conversations: Conversation[];
  hiddenBuyerIds: string[];
  scrollPosition: number;
  timestamp: number;
}

interface UseChatCacheReturn {
  cachedData: ChatCacheData | null;
  saveCache: (data: Partial<ChatCacheData>) => Promise<void>;
  clearCache: () => Promise<void>;
  isLoading: boolean;
}

export function useChatCache(userId?: string): UseChatCacheReturn {
  const [cachedData, setCachedData] = useState<ChatCacheData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getCacheKey = useCallback(() => {
    return userId ? `chat_cache_${userId}` : null;
  }, [userId]);

  const loadCache = useCallback(async () => {
    const cacheKey = getCacheKey();
    if (!cacheKey) {
      setIsLoading(false);
      return;
    }

    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached) as ChatCacheData;
        // Chỉ sử dụng cache nếu không quá 10 phút
        if (Date.now() - data.timestamp < 10 * 60 * 1000) {
          setCachedData(data);
        }
      }
    } catch (error) {
      console.log('Error loading chat cache:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getCacheKey]);

  const saveCache = useCallback(async (data: Partial<ChatCacheData>) => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return;

    try {
      const currentCache = cachedData || {
        conversations: [],
        hiddenBuyerIds: [],
        scrollPosition: 0,
        timestamp: Date.now()
      };

      const updatedCache = {
        ...currentCache,
        ...data,
        timestamp: Date.now()
      };

      // Chỉ update nếu có thay đổi thực sự
      const hasChanges = JSON.stringify(currentCache) !== JSON.stringify(updatedCache);
      if (hasChanges) {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedCache));
        setCachedData(updatedCache);
      }
    } catch (error) {
      console.log('Error saving chat cache:', error);
    }
  }, [getCacheKey, cachedData]);

  const clearCache = useCallback(async () => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return;

    try {
      await AsyncStorage.removeItem(cacheKey);
      setCachedData(null);
    } catch (error) {
      console.log('Error clearing chat cache:', error);
    }
  }, [getCacheKey]);

  useEffect(() => {
    if (userId) {
      loadCache();
    }
  }, [userId, loadCache]);

  return {
    cachedData,
    saveCache,
    clearCache,
    isLoading
  };
}