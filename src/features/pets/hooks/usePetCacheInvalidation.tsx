import { useEffect } from 'react';
import { usePetCache } from '@/src/contexts/PetCacheContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook để tự động invalidate cache trong các trường hợp cần thiết
 */
export function usePetCacheInvalidation() {
  const { user } = useAuth();
  const { invalidateUserPets, getCacheAge } = usePetCache();

  // Invalidate cache khi app trở lại foreground sau thời gian dài
  useEffect(() => {
    let appStateChangeTime = Date.now();

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user) {
        const timeAway = Date.now() - appStateChangeTime;
        const minutesAway = timeAway / (1000 * 60);

        // Nếu app bị background hơn 30 phút, invalidate cache
        if (minutesAway > 30) {
          console.log(`🔄 App was away for ${Math.round(minutesAway)} minutes, invalidating pet cache`);
          await invalidateUserPets(user.id);
        }
      } else if (nextAppState === 'background') {
        appStateChangeTime = Date.now();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user, invalidateUserPets]);

  // Invalidate cache vào lúc nửa đêm (reset hàng ngày)
  useEffect(() => {
    if (!user) return;

    const scheduleNightlyInvalidation = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Midnight

      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      const timer = setTimeout(async () => {
        console.log('🌙 Nightly cache invalidation');
        await invalidateUserPets(user.id);
        
        // Schedule next invalidation
        scheduleNightlyInvalidation();
      }, msUntilMidnight);

      return timer;
    };

    const timer = scheduleNightlyInvalidation();
    return () => clearTimeout(timer);
  }, [user, invalidateUserPets]);

  return {
    // Có thể expose thêm methods nếu cần
    invalidateUserPets: () => user ? invalidateUserPets(user.id) : Promise.resolve(),
  };
}