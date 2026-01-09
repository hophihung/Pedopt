import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { usePetManagement } from '../../../src/features/pets/hooks/usePetManagement';
import { PetLimitBanner } from '../../../src/features/pets/components/PetLimitBanner';
import { PetCard } from '../../../src/features/pets/components/PetCard';
import { SubscriptionModal } from '../../../src/components/SubscriptionModal';
import { CacheStatusIndicator } from '../../../src/components/CacheStatusIndicator';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Edit2, Trash2, PawPrint } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { Header } from '@/src/components/Header';
import { usePetCache } from '@/src/contexts/PetCacheContext';
import { useAuth } from '@/contexts/AuthContext';

export default function MyPetsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'my-pets' | 'virtual-pet'>('my-pets');
  const { getCacheAge } = usePetCache();
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  
  // Import useAuth để lấy user
  const { user } = useAuth();
  
  // Tab bar height + marginBottom + safe area bottom + extra padding
  const tabBarHeight = Platform.OS === 'ios' ? 85 : 70;
  const tabBarMarginBottom = Platform.OS === 'ios' ? 25 : 16;
  const bottomPadding = tabBarHeight + tabBarMarginBottom + insets.bottom + 10;
  
  // Navigate between my-pets and virtual-pet
  const handleTabChange = (tab: 'my-pets' | 'virtual-pet') => {
    setActiveTab(tab);
    if (tab === 'virtual-pet') {
      router.replace('/(tabs)/pets/virtual-pet');
    } else {
      router.replace('/(tabs)/pets/my-pets');
    }
  };

  // Update active tab based on current pathname
  useEffect(() => {
    if (pathname?.includes('/virtual-pet')) {
      setActiveTab('virtual-pet');
    } else {
      setActiveTab('my-pets');
    }
  }, [pathname]);
  const {
    userPets,
    petLimitInfo,
    loading,
    error,
    isLoadingFromCache,
    deletePet,
    togglePetAvailability,
    fetchUserPets,
    forceRefresh,
  } = usePetManagement();

  const [refreshing, setRefreshing] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Get cache age for display
  useEffect(() => {
    const updateCacheAge = async () => {
      if (user) {
        const age = await getCacheAge(`user_pets_${user.id}`);
        setCacheAge(age);
      }
    };
    
    updateCacheAge();
    
    // Update cache age every 30 seconds
    const interval = setInterval(updateCacheAge, 30000);
    return () => clearInterval(interval);
  }, [user, getCacheAge, userPets]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await forceRefresh(); // Use forceRefresh instead of fetchUserPets for pull-to-refresh
    setRefreshing(false);
  };

  const handleCreatePet = () => {
    if (!petLimitInfo?.canCreate) {
      // Mở modal subscription thay vì navigate
      setShowSubscriptionModal(true);
      return;
    }
    router.push('/pet/create-pet');
  };

  const handleEditPet = (petId: string) => {
    router.push(`/edit-pet/${petId}` as any);
  };

  const handleDeletePet = (petId: string, petName: string) => {
    Alert.alert(
      'Xóa Pet',
      `Bạn có chắc muốn xóa "${petName}"? Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePet(petId);
              Alert.alert('Thành công', 'Đã xóa pet thành công!');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa pet. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const handleToggleAvailability = async (petId: string) => {
    try {
      await togglePetAvailability(petId);
    } catch (error) {
      Alert.alert(
        'Lỗi',
        'Không thể thay đổi trạng thái pet. Vui lòng thử lại.'
      );
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserPets}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Compact Header - Logo + Tabs in one row */}
      <View style={styles.headerContainer}>
        <Text style={styles.logoIcon}>🐾</Text>
        
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'my-pets' && styles.tabButtonActive]}
            onPress={() => handleTabChange('my-pets')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === 'my-pets' && styles.tabButtonTextActive]}>
              Pets của tôi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'virtual-pet' && styles.tabButtonActive]}
            onPress={() => handleTabChange('virtual-pet')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === 'virtual-pet' && styles.tabButtonTextActive]}>
              Pet ảo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Removed floating create button */}

      {/* Pet Limit Banner */}
      {petLimitInfo && (
        <PetLimitBanner
          currentCount={petLimitInfo.currentCount}
          limit={petLimitInfo.limit}
          plan={petLimitInfo.plan}
        />
      )}

      {/* Cache Status Indicator - New Component */}
      <CacheStatusIndicator
        isLoadingFromCache={isLoadingFromCache}
        isLoading={loading}
        hasData={userPets.length > 0}
        cacheAge={cacheAge}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* Pet Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statItem, styles.statItemTotal]}>
          <Text style={styles.statNumber}>{userPets.length}</Text>
          <Text style={styles.statLabel}>Tổng Pet</Text>
        </View>

        <View style={[styles.statItem, styles.statItemAvailable]}>
          <Text style={styles.statNumber}>
            {userPets.filter((pet) => pet.is_available).length}
          </Text>
          <Text style={styles.statLabel}>Đang bán</Text>
        </View>

        <View style={[styles.statItem, styles.statItemSold]}>
          <Text style={styles.statNumber}>
            {userPets.filter((pet) => !pet.is_available).length}
          </Text>
          <Text style={styles.statLabel}>Đã bán</Text>
        </View>
      </View>

      {/* Pet List */}
      <ScrollView
        style={styles.petList}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {userPets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <PawPrint size={80} color="#FF6B6B" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có pet nào</Text>
            <Text style={styles.emptyDescription}>
              Tạo pet đầu tiên của bạn để bắt đầu bán!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleCreatePet}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Tạo Pet đầu tiên</Text>
            </TouchableOpacity>
          </View>
        ) : (
          userPets.map((pet) => (
            <View key={pet.id} style={styles.petCardWrapper}>
              <TouchableOpacity
                style={styles.petCardContainer}
                activeOpacity={0.95}
                onPress={() => router.push(`/pet/${pet.id}`)}
              >
                {/* Pet Image */}
                {pet.images && pet.images.length > 0 ? (
                  <Image
                    source={{ uri: pet.images[0] }}
                    style={styles.petCardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.petCardImagePlaceholder}>
                    <PawPrint size={48} color="#CCC" />
                  </View>
                )}

                {/* Status Badge */}
                <View style={[
                  styles.petStatusBadge,
                  pet.is_available ? styles.petStatusAvailable : styles.petStatusSold
                ]}>
                  <Text style={styles.petStatusText}>
                    {pet.is_available ? '● Có hoạt động gần đây' : '● Đã bán'}
                  </Text>
                </View>

                {/* Pet Info */}
                <View style={styles.petCardInfo}>
                  <Text style={styles.petCardName} numberOfLines={1}>
                    {`${pet.name}${pet.age_months ? `, ${pet.age_months} tháng` : ''}`}
                  </Text>
                  {pet.location && (
                    <Text style={styles.petCardLocation} numberOfLines={1}>
                      {`📍 ${pet.location}`}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditPet(pet.id)}
                >
                  <Edit2 size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePet(pet.id, pet.name)}
                >
                  <Trash2 size={16} color="#FF3B30" strokeWidth={2} />
                  <Text style={styles.deleteButtonText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 20,
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 28,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 11,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabButtonTextActive: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flex: 1,
  },
  headerTab: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    position: 'relative',
  },
  headerTabDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.5)',
    letterSpacing: 0.2,
  },
  headerTabTextActive: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  headerTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -20 }],
    width: 40,
    height: 2,
    backgroundColor: '#000000',
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  // Removed createButton styles
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statItemTotal: {
    borderLeftWidth: 4,
    borderLeftColor: '#1F2937', // Dark gray - professional
  },
  statItemAvailable: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669', // Emerald green - active/available
  },
  statItemSold: {
    borderLeftWidth: 4,
    borderLeftColor: '#6B7280', // Cool gray - completed/sold
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  petList: {
    flex: 1,
    paddingTop: 8,
  },
  petCardWrapper: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  petCardContainer: {
    position: 'relative',
    height: 420,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  petCardImage: {
    width: '100%',
    height: '100%',
  },
  petCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  petStatusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  petStatusAvailable: {
    backgroundColor: 'rgba(76, 217, 100, 0.95)',
  },
  petStatusSold: {
    backgroundColor: 'rgba(255, 59, 48, 0.95)',
  },
  petStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  petCardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
  },
  petCardName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  petCardLocation: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#FFE5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F5F7FA',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cacheSuccessText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
});
