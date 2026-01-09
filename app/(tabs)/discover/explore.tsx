import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Heart, Calendar, DollarSign, Star, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { PetService } from '@/src/features/pets/services/pet.service';
import { formatPetLocation } from '@/src/features/pets/utils/location';
import { colors } from '@/src/theme/colors';
import { SkeletonGrid } from '@/src/components/Skeleton';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/4587993/pexels-photo-4587993.jpeg';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 columns with 16px padding on sides and 16px gap

interface Pet {
  id: string;
  name: string;
  type?: string;
  breed?: string;
  location?: string;
  energy_level?: string;
  images: string[];
  price?: number;
  age_months?: number;
  gender?: string;
  is_available?: boolean;
}

const PET_TYPE_LABELS: Record<string, string> = {
  dog: 'Chó',
  cat: 'Mèo',
  hamster: 'Hamster',
  bird: 'Chim',
  rabbit: 'Thỏ',
  other: 'Khác',
};

const GENDER_LABELS: Record<string, string> = {
  male: '♂',
  female: '♀',
  unknown: '?',
};

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Dogs', value: 'dog' },
  { label: 'Cats', value: 'cat' },
  { label: 'Small Pets', value: 'small' },
  { label: 'Active', value: 'active' },
];

export default function ExploreScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const loadPets = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      try {
        if (mode === 'initial') {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        const availablePets = await PetService.getAvailablePets(user?.id);
        const parsedPets = availablePets.map((pet: any) => ({
          ...pet,
          images: Array.isArray(pet.images)
            ? pet.images
            : typeof pet.images === 'string'
            ? JSON.parse(pet.images)
            : [],
        }));
        setPets(parsedPets);
      } catch (error) {
        console.error('Failed to load explore pets:', error);
      } finally {
        if (mode === 'initial') {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [user?.id]
  );

  useEffect(() => {
    loadPets('initial');
  }, [loadPets]);

  const handleRefresh = () => {
    loadPets('refresh');
  };

  const filteredPets = useMemo(() => {
    if (selectedFilter === 'all') return pets;
    if (selectedFilter === 'active') {
      return pets.filter((pet) =>
        pet.energy_level?.toLowerCase().includes('active')
      );
    }
    return pets.filter(
      (pet) =>
        pet.type?.toLowerCase() === selectedFilter ||
        pet.breed?.toLowerCase().includes(selectedFilter)
    );
  }, [pets, selectedFilter]);

  const handleOpenPet = (petId: string) => {
    router.push(`/pet/${petId}`);
  };

  return (
    <View style={styles.container}>
      {/* Modern Header for Explore */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          {/* Back to Match */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/discover/match')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#6B7280" strokeWidth={2.5} />
          </TouchableOpacity>
          
          {/* Title */}
          <Text style={styles.headerTitle}>Khám phá</Text>
          
          {/* Reels Icon */}
          <TouchableOpacity 
            style={styles.reelsIconButton}
            onPress={() => router.push('/(tabs)/discover/reel')}
            activeOpacity={0.7}
          >
            <Star size={20} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Danh mục</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterChip,
                  selectedFilter === filter.value && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(filter.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter.value && styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Header */}
        {!loading && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filteredPets.length} thú cưng được tìm thấy
            </Text>
          </View>
        )}

        {/* Grid */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <SkeletonGrid count={6} />
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredPets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={styles.petCard}
                onPress={() => handleOpenPet(pet.id)}
                activeOpacity={0.9}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: pet.images?.[0] || FALLBACK_IMAGE }}
                    style={styles.petImage}
                  />
                  
                  {/* Gradient overlay */}
                  <View style={styles.imageGradient} />
                  
                  {/* Status badges */}
                  <View style={styles.badgeContainer}>
                    {pet.type && (
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {PET_TYPE_LABELS[pet.type] || pet.type}
                        </Text>
                      </View>
                    )}
                    {!pet.is_available && (
                      <View style={styles.soldBadge}>
                        <Text style={styles.soldBadgeText}>Đã bán</Text>
                      </View>
                    )}
                  </View>

                  {/* Heart icon */}
                  <TouchableOpacity style={styles.heartButton}>
                    <Heart size={16} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.petInfo}>
                  <View style={styles.petHeader}>
                    <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
                    {pet.gender && (
                      <Text style={styles.genderIcon}>
                        {GENDER_LABELS[pet.gender] || '?'}
                      </Text>
                    )}
                  </View>
                  
                  {pet.breed && (
                    <Text style={styles.petBreed} numberOfLines={1}>{pet.breed}</Text>
                  )}
                  
                  <View style={styles.petMetaRow}>
                    {pet.age_months && (
                      <View style={styles.metaItem}>
                        <Calendar size={10} color="#9CA3AF" />
                        <Text style={styles.metaText}>
                          {Math.floor(pet.age_months / 12)}t
                        </Text>
                      </View>
                    )}
                    
                    {pet.location && (
                      <View style={styles.metaItem}>
                        <MapPin size={10} color="#9CA3AF" />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {formatPetLocation(pet.location)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Price */}
                  <View style={styles.priceContainer}>
                    {pet.price && pet.price > 0 ? (
                      <View style={styles.priceRow}>
                        <DollarSign size={12} color="#FF6B6B" />
                        <Text style={styles.priceText}>
                          {pet.price.toLocaleString('vi-VN')}đ
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.freeText}>Miễn phí</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {filteredPets.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🐾</Text>
                <Text style={styles.emptyTitle}>Chưa có thú cưng</Text>
                <Text style={styles.emptySubtitle}>
                  Hãy thử bộ lọc khác nhé
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FAFAFA' 
  },
  
  // Modern Header Styles
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  reelsIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandText: { fontSize: 26, fontWeight: '700', color: '#6366F1' },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topNavButton: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  topNavButtonActive: {
    backgroundColor: '#FFF4EB',
  },
  topNavText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  topNavTextActive: {
    color: '#FF8C42',
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100, // Tăng padding để tránh bị tab layout che
  },
  heroCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2B2F3A',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#4F5665',
    lineHeight: 20,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B5C',
  },
  heroImage: {
    width: 110,
    height: 110,
    borderRadius: 20,
    marginLeft: 12,
  },
  filterSection: {
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  filterRow: {
    gap: 10,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  loaderContainer: {
    marginTop: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 0,
  },
  petCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: CARD_WIDTH * 0.8,
  },
  petImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 6,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  soldBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  soldBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInfo: {
    padding: 12,
    gap: 6,
  },
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  petName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    letterSpacing: 0.1,
  },
  genderIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  petBreed: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  petMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  metaText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  priceContainer: {
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  freeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  emptyState: {
    width: '100%',
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
