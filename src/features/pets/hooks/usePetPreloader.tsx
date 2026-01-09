import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePetCache } from '@/src/contexts/PetCacheContext';
import { PetService } from '../services/pet.service';

/**
 * Hook để preload pet data khi app khởi động
 * Giúp cải thiện trải nghiệm người dùng bằng cách load data trước
 */
export function usePetPreloader() {
  const { user } = useAuth();
  const { getCachedUserPets, setCachedUserPets, getCacheAge } = usePetCache();

  const preloadUserPets = useCallback(async () => {
    if (!user) return;

    try {
      // Kiểm tra cache hiện tại
      const cachedPets = await getCachedUserPets(user.id);
      const cacheAge = await getCacheAge(`user_pets_${user.id}`);

      // Nếu đã có cache và còn mới (< 45 phút), không cần preload
      if (cachedPets && cacheAge !== null && cacheAge < 45) {
        console.log(`🚀 Pet cache is fresh (${cacheAge}min), skipping preload`);
        return;
      }

      // Preload data từ server trong background
      console.log('🚀 Preloading user pets in background...');
      
      const pets = await PetService.getUserPets(user.id);
      await setCachedUserPets(user.id, pets);
      
      console.log(`🚀 Preloaded ${pets.length} pets successfully`);
    } catch (error) {
      console.log('🚀 Preload failed (silent):', error);
      // Fail silently - preload không nên ảnh hưởng đến UX
    }
  }, [user, getCachedUserPets, setCachedUserPets, getCacheAge]);

  // Preload khi user login
  useEffect(() => {
    if (user) {
      // Delay một chút để không block UI
      const timer = setTimeout(preloadUserPets, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, preloadUserPets]);

  return {
    preloadUserPets,
  };
}