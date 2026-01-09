import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
// Temporarily using icon fallback to fix view registry error
import { Heart, X, RotateCcw, Star, Send, MapPin, Home, Grid3x3 } from '@/src/utils/iconFallback';
import { useRouter } from 'expo-router';
import Swiper from 'react-native-deck-swiper';
import { PetService } from '@/src/features/pets/services/pet.service';
import { formatPetLocation } from '@/src/features/pets/utils/location';
import { PetCardNew } from '@/src/features/pets/components';
import { SuperLikeOptimizedService } from '@/src/features/super-likes/services/super-like-optimized.service';
import { supabase } from '@/lib/supabase';
import { DoubleTapHint } from '@/src/components/DoubleTapHint';
import { MatchNotification } from '@/src/features/match/components/MatchNotification';
import { useMatchNotifications } from '@/src/features/match/hooks/useMatchNotifications';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Pet {
  id: string;
  name: string;
  type: string;
  age_months?: number;
  breed?: string;
  location?: string;
  description?: string;
  price?: number;
  images: string[];
  seller_id: string;
  is_available: boolean;
  like_count: number;
  view_count: number;
  verification_status?: 'pending' | 'approved' | 'rejected';
  verified_at?: string;
  verified_by?: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  energy_level?: string;
  size?: string;
  distance_km?: number;
}

// Feature flag to toggle between old and new card design
const USE_NEW_CARD_DESIGN = false;

export default function MatchScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { currentNotification, hasNotification, closeNotification } = useMatchNotifications();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const imageIndicesRef = useRef<{ [key: string]: number }>({});
  const [imageIndices, setImageIndices] = useState<{ [key: string]: number }>({});
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPets, setLikedPets] = useState<Set<string>>(new Set());
  const [superLikedPets, setSuperLikedPets] = useState<Set<string>>(new Set());
  const [superLikesRemaining, setSuperLikesRemaining] = useState(0);
  const swiperRef = useRef<any>(null);

  const imageAnimations = useRef<{ [key: string]: Animated.Value }>({});

  const getAnimationValue = (petId: string) => {
    if (!imageAnimations.current[petId]) {
      imageAnimations.current[petId] = new Animated.Value(0);
    }
    return imageAnimations.current[petId];
  };

  useEffect(() => {
    loadPets();
    loadSuperLikeInfo();
    
    // Debug: Check user profile
    if (user?.id) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (!data?.role) {
            // No role found - should redirect to onboarding
          } else {
            // User has role
          }
        });
    }
  }, []);

  const loadSuperLikeInfo = async () => {
    if (!user?.id) return;
    
    try {
      const { remaining } = await SuperLikeOptimizedService.canSuperLike(user.id);
      setSuperLikesRemaining(remaining);
      
      const superLikes = await SuperLikeOptimizedService.getUserSuperLikes(user.id);
      const superLikedPetIds = new Set(superLikes.map(sl => sl.pet_id));
      setSuperLikedPets(superLikedPetIds);
    } catch (error) {
      // Error loading super like info
    }
  };

  const forceCheckOnboarding = async () => {
    if (!user?.id) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();if (!profile?.role) {router.push('/onboarding/role-selection');
      } else {alert(`User role: ${profile.role}`);
      }
    } catch (error) {}
  };

  useEffect(() => {}, [imageIndices]);

  const loadPets = async () => {
    try {
      setLoading(true);

      // Kiểm tra user trước khi load pets
      if (!user?.id) {setPets([]);
        return;
      }// Load tất cả pets
      const availablePets = await PetService.getAvailablePets(user.id);if (!availablePets || !Array.isArray(availablePets)) {setPets([]);
        return;
      }

      const parsedPets = availablePets.map((pet: any) => {
        let images = [];

        try {
          if (Array.isArray(pet.images)) {
            images = pet.images;
          } else if (typeof pet.images === 'string' && pet.images.trim()) {
            images = JSON.parse(pet.images);
          }
        } catch (parseError) {images = [];
        }

        return {
          ...pet,
          images: Array.isArray(images) ? images : [],
        };
      }).filter((pet: any) => {
        // Lọc ra những pet có ID hợp lệ
        if (!pet.id) {return false;
        }
        return true;
      });setPets(parsedPets);
    } catch (error) {setPets([]);

      // Hiển thị thông báo lỗi chi tiết hơn
      if (error instanceof Error) {}
    } finally {
      setLoading(false);
    }
  };

  const trackPetView = async (petId: string) => {
    try {
      await PetService.trackView(petId, user?.id);
    } catch (error) {}
  };

  const handleToggleLike = async (petId: string) => {
    if (!user?.id) return;

    try {
      const result = await PetService.toggleLike(petId, user.id);

      if (result.liked) {
        setLikedPets((prev) => new Set(prev).add(petId));
      } else {
        setLikedPets((prev) => {
          const next = new Set(prev);
          next.delete(petId);
          return next;
        });
      }
    } catch (error) {}
  };

  const handleLike = () => {
    // Thêm haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (currentIndex < pets.length) {
      trackPetView(pets[currentIndex].id);
    }
    swiperRef.current?.swipeRight();
  };

  const handlePass = async () => {
    // Thêm haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex < pets.length && user?.id) {
      const petId = pets[currentIndex].id;
      trackPetView(petId);

      // Lưu pass action - pet này sẽ không hiển thị lại
      try {
        await PetService.passPet(petId, user.id);
      } catch (error) {}
    }
    swiperRef.current?.swipeLeft();
  };

  const getCurrentImageIndex = useCallback((petId: string) => {
    const index = imageIndicesRef.current[petId] || 0;return index;
  }, []);

  const handleNextImage = useCallback((petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    if (!pet || pet.images.length <= 1) return;

    const currentImgIndex = getCurrentImageIndex(petId);if (currentImgIndex < pet.images.length - 1) {
      // Thêm haptic feedback nhẹ
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const nextIndex = currentImgIndex + 1;// Update ref first
      imageIndicesRef.current = { ...imageIndicesRef.current, [petId]: nextIndex };// Update state for re-render
      setImageIndices({ ...imageIndicesRef.current });

      // Then animate
      Animated.timing(getAnimationValue(petId), {
        toValue: nextIndex,
        duration: 150, // Giảm từ 300ms xuống 150ms
        useNativeDriver: true,
      }).start(() => {});
    } else {}
  }, [pets, getCurrentImageIndex]);

  const handlePrevImage = useCallback((petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    if (!pet || pet.images.length <= 1) return;

    const currentImgIndex = getCurrentImageIndex(petId);if (currentImgIndex > 0) {
      // Thêm haptic feedback nhẹ
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const prevIndex = currentImgIndex - 1;// Update ref first
      imageIndicesRef.current = { ...imageIndicesRef.current, [petId]: prevIndex };// Update state for re-render
      setImageIndices({ ...imageIndicesRef.current });

      // Then animate
      Animated.timing(getAnimationValue(petId), {
        toValue: prevIndex,
        duration: 150, // Giảm từ 300ms xuống 150ms
        useNativeDriver: true,
      }).start(() => {});
    } else {}
  }, [pets, getCurrentImageIndex]);

  const handleSuperLike = async () => {
    if (!user?.id || currentIndex >= pets.length) return;
    
    // Thêm haptic feedback mạnh hơn cho super like
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const pet = pets[currentIndex];
    
    // Optimistic UI update - show loading state immediately
    setSuperLikedPets(prev => new Set(prev).add(pet.id));
    
    try {
      const result = await SuperLikeOptimizedService.superLikePet(pet.id, user.id);
      
      if (result.success) {
        // Update remaining count immediately
        setSuperLikesRemaining(prev => Math.max(0, prev - 1));
        // Track view
        trackPetView(pet.id);
        // Move to next card
        swiperRef.current?.swipeTop?.();
      } else {
        // Revert optimistic update on error
        setSuperLikedPets(prev => {
          const newSet = new Set(prev);
          newSet.delete(pet.id);
          return newSet;
        });
        // Show error message
        alert(result.message);
      }
    } catch (error) {
      // Revert optimistic update on error
      setSuperLikedPets(prev => {
        const newSet = new Set(prev);
        newSet.delete(pet.id);
        return newSet;
      });alert('Có lỗi xảy ra khi Super Like');
    }
  };

  // Handle match notification message button
  const handleMatchMessage = () => {
    if (currentNotification) {
      router.push('/(tabs)/social/chat');
      closeNotification();
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}>
        <ActivityIndicator size="large" color="#FF5A75" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Đang tải pets...
        </Text>
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            {/* Main Tabs */}
            <View style={styles.mainTabs}>
              <TouchableOpacity
                style={[styles.mainTabButton, styles.mainTabButtonActive]}
                onPress={() => router.push('/(tabs)/discover/match')}
                activeOpacity={0.7}
              >
                <Heart size={24} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.mainTabTextActive}>Match</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mainTabButton}
                onPress={() => router.push('/(tabs)/discover/reel')}
                activeOpacity={0.7}
              >
                <Star size={24} color="#6B7280" strokeWidth={2.5} />
                <Text style={styles.mainTabText}>Reels</Text>
              </TouchableOpacity>
            </View>

            {/* Explore Icon */}
            <TouchableOpacity
              style={styles.exploreIconButton}
              onPress={() => router.push('/(tabs)/discover/explore')}
              activeOpacity={0.7}
            >
              <Grid3x3 size={26} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty State */}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Heart size={48} color="#FF6B6B" strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có thú cưng nào</Text>
          <Text style={styles.emptyDescription}>
            Hiện tại chưa có thú cưng nào để khám phá.{'\n'}
            Hãy thử lại sau hoặc khám phá tab Explore!
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadPets}
          >
            <RotateCcw size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/discover/explore')}
          >
            <Grid3x3 size={18} color="#FF6B6B" strokeWidth={2} />
            <Text style={styles.exploreButtonText}>Khám phá Explore</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Double Tap Hint */}
      <DoubleTapHint />
      
      {/* Match Notification */}
      {hasNotification && currentNotification && (
        <MatchNotification
          visible={hasNotification}
          matchedUser={currentNotification.matchedUser}
          pet={currentNotification.pet}
          onClose={closeNotification}
          onMessage={handleMatchMessage}
        />
      )}
      
      {/* Modern Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          {/* Main Tabs */}
          <View style={styles.mainTabs}>
            <TouchableOpacity
              style={[styles.mainTabButton, styles.mainTabButtonActive]}
              onPress={() => router.push('/(tabs)/discover/match')}
              activeOpacity={0.7}
            >
              <Heart size={24} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.mainTabTextActive}>Match</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainTabButton}
              onPress={() => router.push('/(tabs)/discover/reel')}
              activeOpacity={0.7}
            >
              <Star size={24} color="#6B7280" strokeWidth={2.5} />
              <Text style={styles.mainTabText}>Reels</Text>
            </TouchableOpacity>
          </View>

          {/* Explore Icon */}
          <TouchableOpacity
            style={styles.exploreIconButton}
            onPress={() => router.push('/(tabs)/discover/explore')}
            activeOpacity={0.7}
          >
            <Grid3x3 size={26} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <Swiper
          ref={swiperRef}
          cards={pets}
          renderCard={(pet: Pet) =>
            USE_NEW_CARD_DESIGN ? (
              <PetCardNew
                pet={pet as any}
                onPress={() => {if (!pet.id) {return;
                  }
                  router.push(`/pet/${pet.id}`);
                }}
                onLike={() => handleToggleLike(pet.id)}
                onFavorite={() => handleToggleLike(pet.id)}
                onShare={async () => {
                  try {} catch (error) {}
                }}
                onBack={() => swiperRef.current?.jumpToCardIndex(Math.max(currentIndex - 1, 0))}
                onClose={() => swiperRef.current?.swipeLeft()}
                isLiked={likedPets.has(pet.id)}
                isFavorited={likedPets.has(pet.id)}
                showActions={true}
              />
            ) : (
              <View style={styles.card}>
                <TouchableOpacity 
                  style={styles.imageContainer}
                  onPress={() => {if (!pet.id) {return;
                    }
                    router.push(`/pet/${pet.id}`);
                  }}
                  activeOpacity={0.95}
                >
                  <Animated.View
                    style={[
                      styles.imageSlider,
                      pet.images.length > 1 && {
                        transform: [
                          {
                            translateX: getAnimationValue(pet.id).interpolate({
                              inputRange: pet.images.map((_, i) => i),
                              outputRange: pet.images.map(
                                (_, i) => -i * (SCREEN_WIDTH - 40)
                              ),
                            }),
                          },
                        ],
                      },
                    ]}>
                    {pet.images.map((imageUrl, index) => (
                      <Image
                        key={`${pet.id}-${index}`}
                        source={{ uri: imageUrl }}
                        style={styles.petImage}
                      />
                    ))}
                  </Animated.View>
                </TouchableOpacity>

                {/* Small tap zones only for image navigation */}
                {pet.images.length > 1 && (
                  <View style={styles.tapZones} pointerEvents="box-none">
                    <TouchableOpacity
                      activeOpacity={1}
                      style={styles.tapZoneLeft}
                      onPress={() => {handlePrevImage(pet.id);
                      }}
                    />
                    <TouchableOpacity
                      activeOpacity={1}
                      style={styles.tapZoneRight}
                      onPress={() => {handleNextImage(pet.id);
                      }}
                    />
                  </View>
                )}

                <View style={styles.imageIndicators}>
                  {pet.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        (imageIndicesRef.current[pet.id] || 0) === index && styles.indicatorActive,
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.cardOverlay}>
                  {/* Pet Info Overlay - Bottom Left */}
                  <View style={styles.petInfoOverlay}>
                    {/* Active Status - chỉ hiển thị cho pets đã verified */}
                    {pet.verification_status === 'approved' && (
                      <View style={styles.activeStatus}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeText}>Đã xác minh</Text>
                      </View>
                    )}

                    {/* Name, Age, Verification */}
                    <View style={styles.nameRow}>
                      <Text style={styles.petName}>{pet.name}</Text>
                      {pet.age_months && (
                        <Text style={styles.petAge}>
                          {Math.floor(pet.age_months / 12)}
                        </Text>
                      )}
                      {/* Verification badge - chỉ hiển thị khi pet đã được verify */}
                      {pet.verification_status === 'approved' && (
                        <Text style={styles.verifiedIcon}>✓</Text>
                      )}
                    </View>

                    {/* Breed and Price */}
                    {(pet.breed || pet.price) && (
                      <View style={styles.breedPriceRow}>
                        {pet.breed && (
                          <Text style={styles.breedText}>{pet.breed}</Text>
                        )}
                        {pet.price && pet.price > 0 && (
                          <Text style={styles.priceText}>
                            {pet.price.toLocaleString('vi-VN')} VND
                          </Text>
                        )}
                        {pet.price === 0 && (
                          <Text style={styles.freeText}>Miễn phí</Text>
                        )}
                      </View>
                    )}

                    {/* Location */}
                    {pet.location && (
                      <View style={styles.infoRow}>
                        <Home size={14} color="#fff" style={styles.icon} />
                        <Text style={styles.infoText}>Sống tại {formatPetLocation(pet.location)}</Text>
                      </View>
                    )}

                    {/* Distance */}
                    {pet.distance_km !== undefined && (
                      <View style={styles.infoRow}>
                        <MapPin size={14} color="#fff" style={styles.icon} />
                        <Text style={styles.infoText}>
                          Cách xa {pet.distance_km.toFixed(1)} km
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )
          }
          onSwipedLeft={async (cardIndex) => {
            if (cardIndex < pets.length && user?.id) {
              const petId = pets[cardIndex].id;// Lưu pass action - pet này sẽ không hiển thị lại
              try {
                await PetService.passPet(petId, user.id);
              } catch (error) {}
            }
            setCurrentIndex(cardIndex + 1);
          }}
          onSwipedRight={(cardIndex: number) => {
            if (cardIndex < pets.length) {handleToggleLike(pets[cardIndex].id);
            }
            setCurrentIndex(cardIndex + 1);
          }}
          onSwipedTop={(cardIndex: number) => {
            if (cardIndex < pets.length) {// Super like logic is handled in handleSuperLike
            }
            setCurrentIndex(cardIndex + 1);
          }}
          cardIndex={currentIndex}
          onSwiped={(cardIndex) => {
            setCurrentIndex(cardIndex + 1);
          }}
          backgroundColor="transparent"
          stackSize={3}
          stackSeparation={15}
          animateCardOpacity
          verticalSwipe={true}
          // Cải thiện animation performance
          swipeAnimationDuration={150} // Giảm từ 200ms xuống 150ms
          disableBottomSwipe={true}
          // Thêm overlay cho swipe feedback
          overlayLabels={{
            left: {
              title: '✕ PASS',
              style: {
                label: {
                  backgroundColor: 'rgba(255, 68, 88, 0.9)',
                  borderColor: '#FF4458',
                  color: '#FFFFFF',
                  borderWidth: 2,
                  fontSize: 22,
                  fontWeight: '800',
                  padding: 12,
                  borderRadius: 12,
                  textAlign: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: -30,
                }
              }
            },
            right: {
              title: '♥ LIKE',
              style: {
                label: {
                  backgroundColor: 'rgba(76, 204, 108, 0.9)',
                  borderColor: '#4CCC6C',
                  color: '#FFFFFF',
                  borderWidth: 2,
                  fontSize: 22,
                  fontWeight: '800',
                  padding: 12,
                  borderRadius: 12,
                  textAlign: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: 30,
                }
              }
            },
            top: {
              title: '⭐ SUPER LIKE',
              style: {
                label: {
                  backgroundColor: 'rgba(93, 173, 226, 0.9)',
                  borderColor: '#5DADE2',
                  color: '#FFFFFF',
                  borderWidth: 2,
                  fontSize: 20,
                  fontWeight: '800',
                  padding: 12,
                  borderRadius: 12,
                  textAlign: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 60,
                }
              }
            }
          }}
        />
      </View>

      <View style={styles.actions} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            swiperRef.current?.jumpToCardIndex(Math.max(currentIndex - 1, 0))
          }
          activeOpacity={0.7}
        >
          <RotateCcw size={28} color="#F59E0B" strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handlePass}
          activeOpacity={0.7}
        >
          <X size={32} color="#EF4444" strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.starButton]} 
          onPress={handleSuperLike}
          activeOpacity={0.7}
        >
          <Star 
            size={24} 
            color={superLikesRemaining > 0 ? "#3B82F6" : "#9CA3AF"} 
            strokeWidth={2.5} 
            fill={
              currentIndex < pets.length && superLikedPets.has(pets[currentIndex]?.id)
                ? '#3B82F6'
                : 'transparent'
            }
          />
          {superLikesRemaining > 0 && (
            <Text style={styles.superLikeCount}>{superLikesRemaining}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <Heart
            size={28}
            color="#FF6B6B"
            strokeWidth={2.5}
            fill={
              currentIndex < pets.length &&
                likedPets.has(pets[currentIndex]?.id)
                ? '#FF6B6B'
                : 'transparent'
            }
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // TODO: Implement send/message functionality
          }}
          activeOpacity={0.7}
        >
          <Send size={24} color="#8B5CF6" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    backgroundColor: '#FAFAFA'
  },

  // Modern Header Styles
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 44 : 36,
    paddingBottom: 9,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTabs: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 10,
    gap: 8,
  },
  mainTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
  },
  mainTabButtonActive: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  mainTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  mainTabTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exploreIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Card Container
  cardContainer: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 5,
    paddingHorizontal: 20,
    marginTop: -10,
  },
  card: {
    height: SCREEN_WIDTH * 1.24,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 28,
    zIndex: 1, // Thêm zIndex để đảm bảo touch events
  },
  imageSlider: {
    flexDirection: 'row',
    height: '100%',
  },
  petImage: {
    width: SCREEN_WIDTH - 40,
    height: '100%',
    resizeMode: 'cover',
  },
  tapZones: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    flexDirection: 'row',
    zIndex: 5, // Giảm từ 10 xuống 5
  },
  tapZoneLeft: {
    width: 60, // Chỉ 60px bên trái
    backgroundColor: 'transparent',
  },
  tapZoneRight: {
    position: 'absolute',
    right: 0,
    width: 60, // Chỉ 60px bên phải
    height: '100%',
    backgroundColor: 'transparent',
  },
  imageIndicators: {
    position: 'absolute',
    top: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  cardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  petInfoOverlay: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D664',
  },
  activeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  petName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  petAge: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  verifiedIcon: {
    fontSize: 20,
    color: '#4ECFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  breedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    gap: 12,
  },
  breedText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  freeText: {
    fontSize: 14,
    color: '#4CD964',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  icon: {
    marginRight: 0,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Action Buttons
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 80 : 140,
    backgroundColor: '#FAFAFA',
    zIndex: 9999,
    elevation: 9999,
    position: 'relative',
  },
  actionButton: {
    width: 69,
    height: 69,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  starButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    position: 'relative',
  },
  superLikeCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FAFAFA',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    gap: 8,
  },
  exploreButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '700',
  },
});

