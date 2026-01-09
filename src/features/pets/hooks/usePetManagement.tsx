import { useState, useEffect, useCallback } from 'react';
import { PetService, PetCreateData, PetUpdateData } from '../services/pet.service';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePetCache } from '@/src/contexts/PetCacheContext';
import { logCacheHit, logCacheMiss } from '../utils/cacheMonitor';

export interface PetLimitInfo {
  currentCount: number;
  limit: number;
  canCreate: boolean;
  plan: string;
}

export function usePetManagement() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { 
    setCachedUserPets, 
    getCachedUserPets, 
    invalidateUserPets,
    getCacheAge 
  } = usePetCache();
  
  const [userPets, setUserPets] = useState<any[]>([]);
  const [availablePets, setAvailablePets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [petLimitInfo, setPetLimitInfo] = useState<PetLimitInfo | null>(null);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(false);

  // Lấy thông tin giới hạn pet
  const fetchPetLimitInfo = async () => {
    if (!user || !subscription) return;

    try {
      const { canCreate, currentCount, limit } = await PetService.canCreatePet(
        user.id, 
        subscription.plan
      );
      
      setPetLimitInfo({
        currentCount,
        limit,
        canCreate,
        plan: subscription.plan
      });
    } catch (err) {
      console.error('Error fetching pet limit info:', err);
    }
  };

  // Lấy pets của user với cache
  const fetchUserPets = useCallback(async (forceRefresh: boolean = false) => {
    if (!user) return;

    try {
      setError(null);

      // Nếu không force refresh, thử load từ cache trước
      if (!forceRefresh) {
        setIsLoadingFromCache(true);
        const cachedPets = await getCachedUserPets(user.id);
        
        if (cachedPets) {
          const cacheAge = await getCacheAge(`user_pets_${user.id}`);
          console.log(`📦 Loaded ${cachedPets.length} pets from cache (age: ${cacheAge}min)`);
          
          // Log cache hit
          if (cacheAge !== null) {
            logCacheHit(cacheAge);
          }
          
          setUserPets(cachedPets);
          setIsLoadingFromCache(false);
          
          // Nếu cache còn mới (< 30 phút), không cần fetch từ server
          if (cacheAge !== null && cacheAge < 30) {
            return;
          }
          
          // Nếu cache cũ hơn 30 phút, fetch từ server trong background
          console.log('🔄 Cache is old, refreshing in background...');
        } else {
          // Log cache miss
          logCacheMiss();
        }
        setIsLoadingFromCache(false);
      }

      // Fetch từ server
      setLoading(true);
      const pets = await PetService.getUserPets(user.id);
      
      console.log(`🌐 Loaded ${pets.length} pets from server`);
      
      setUserPets(pets);
      
      // Cache kết quả mới
      await setCachedUserPets(user.id, pets);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user pets';
      setError(message);
      console.error('Error fetching user pets:', err);
    } finally {
      setLoading(false);
      setIsLoadingFromCache(false);
    }
  }, [user, getCachedUserPets, setCachedUserPets, getCacheAge]);

  // Lấy pets có sẵn (cho swipe)
  const fetchAvailablePets = async () => {
    try {
      setLoading(true);
      setError(null);
      const pets = await PetService.getAvailablePets(user?.id);
      setAvailablePets(pets);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch available pets';
      setError(message);
      console.error('Error fetching available pets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Tạo pet mới
  const createPet = async (petData: PetCreateData) => {
    if (!user || !subscription) {
      throw new Error('User not authenticated or no subscription');
    }

    try {
      setLoading(true);
      setError(null);
      
      const newPet = await PetService.createPet(user.id, petData, subscription.plan);
      
      // Update local state
      const updatedPets = [newPet, ...userPets];
      setUserPets(updatedPets);
      
      // Update cache
      await setCachedUserPets(user.id, updatedPets);
      
      // Cập nhật thông tin giới hạn
      await fetchPetLimitInfo();
      
      console.log('✅ Pet created and cache updated');
      return newPet;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create pet';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật pet
  const updatePet = async (petId: string, petData: PetUpdateData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      
      const updatedPet = await PetService.updatePet(petId, user.id, petData);
      
      // Update local state
      const updatedPets = userPets.map(pet => pet.id === petId ? updatedPet : pet);
      setUserPets(updatedPets);
      
      // Update cache
      await setCachedUserPets(user.id, updatedPets);
      
      console.log('✅ Pet updated and cache refreshed');
      return updatedPet;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update pet';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xóa pet
  const deletePet = async (petId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      
      await PetService.deletePet(petId, user.id);
      
      // Update local state
      const updatedPets = userPets.filter(pet => pet.id !== petId);
      setUserPets(updatedPets);
      
      // Update cache
      await setCachedUserPets(user.id, updatedPets);
      
      // Cập nhật thông tin giới hạn
      await fetchPetLimitInfo();
      
      console.log('✅ Pet deleted and cache updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete pet';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Toggle availability
  const togglePetAvailability = async (petId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      
      const updatedPet = await PetService.togglePetAvailability(petId, user.id);
      
      // Update local state
      const updatedPets = userPets.map(pet => pet.id === petId ? updatedPet : pet);
      setUserPets(updatedPets);
      
      // Update cache
      await setCachedUserPets(user.id, updatedPets);
      
      console.log('✅ Pet availability toggled and cache updated');
      return updatedPet;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle pet availability';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Lấy pet theo ID
  const getPetById = async (petId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const pet = await PetService.getPetById(petId);
      return pet;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pet';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Invalidate cache (for manual refresh)
  const invalidateCache = useCallback(async () => {
    if (!user) return;
    
    await invalidateUserPets(user.id);
    console.log('🗑️ Pet cache invalidated');
  }, [user, invalidateUserPets]);

  // Force refresh (clear cache and fetch from server)
  const forceRefresh = useCallback(async () => {
    if (!user) return;
    
    await invalidateCache();
    await fetchUserPets(true);
  }, [user, invalidateCache, fetchUserPets]);

  // Load dữ liệu ban đầu
  useEffect(() => {
    if (user && subscription) {
      fetchUserPets(false); // Load from cache first
      fetchPetLimitInfo();
    }
  }, [user, subscription, fetchUserPets]);

  return {
    // Data
    userPets,
    availablePets,
    petLimitInfo,
    loading,
    error,
    isLoadingFromCache,
    
    // Actions
    createPet,
    updatePet,
    deletePet,
    togglePetAvailability,
    getPetById,
    fetchUserPets,
    fetchAvailablePets,
    fetchPetLimitInfo,
    
    // Cache actions
    invalidateCache,
    forceRefresh,
    
    // Utilities
    canCreatePet: petLimitInfo?.canCreate || false,
    currentPetCount: petLimitInfo?.currentCount || 0,
    petLimit: petLimitInfo?.limit || 4,
  };
}
