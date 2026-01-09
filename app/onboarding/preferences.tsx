import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
// Temporarily using icon fallback to fix view registry error
import { ArrowRight, Check } from '@/src/utils/iconFallback';

const PET_TYPES = [
  { id: 'dog', name: 'Chó', emoji: '🐕' },
  { id: 'cat', name: 'Mèo', emoji: '🐱' },
  { id: 'bird', name: 'Chim', emoji: '🐦' },
  { id: 'hamster', name: 'Chuột hamster', emoji: '🐹' },
  { id: 'rabbit', name: 'Thỏ', emoji: '🐰' },
  { id: 'fish', name: 'Cá', emoji: '🐠' },
  { id: 'turtle', name: 'Rùa', emoji: '🐢' },
  { id: 'other', name: 'Khác', emoji: '🐾' },
];

const AGE_RANGES = [
  { id: 'puppy', name: 'Con non (0-6 tháng)', range: [0, 6] },
  { id: 'young', name: 'Trẻ (6-24 tháng)', range: [6, 24] },
  { id: 'adult', name: 'Trưởng thành (2-7 năm)', range: [24, 84] },
  { id: 'senior', name: 'Già (7+ năm)', range: [84, 999] },
];

const PRICE_RANGES = [
  { id: 'free', name: 'Miễn phí', range: [0, 0] },
  { id: 'low', name: 'Dưới 1 triệu', range: [0, 1000000] },
  { id: 'medium', name: '1-5 triệu', range: [1000000, 5000000] },
  { id: 'high', name: '5-10 triệu', range: [5000000, 10000000] },
  { id: 'premium', name: 'Trên 10 triệu', range: [10000000, 999999999] },
];

export default function PreferencesScreen() {
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([]);
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const toggleSelection = (
    item: string,
    selectedItems: string[],
    setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleFinish = async () => {
    if (!user) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    setLoading(true);
    try {
      // Save user preferences
      const preferences = {
        pet_types: selectedPetTypes,
        age_ranges: selectedAgeRanges,
        price_ranges: selectedPriceRanges,
        onboarding_completed: true,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving preferences:', error);
        Alert.alert('Lỗi', 'Không thể lưu preferences. Vui lòng thử lại.');
        return;
      }

      // Navigate to main app
      router.replace('/(tabs)/discover');
    } catch (error) {
      console.error('Error in handleFinish:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) {
      router.replace('/(tabs)/discover');
      return;
    }

    try {
      // Mark onboarding as completed even when skipped
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error marking onboarding complete:', error);
      }
    } catch (error) {
      console.error('Error in handleSkip:', error);
    }

    // Navigate to main app regardless of database update result
    router.replace('/(tabs)/discover');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Sở thích của bạn 🎯</Text>
            <Text style={styles.subtitle}>
              Giúp chúng tôi tìm những thú cưng phù hợp nhất với bạn
            </Text>
            
            {/* Skip button in header as backup */}
            <TouchableOpacity
              style={styles.headerSkipButton}
              onPress={async () => {
                console.log('Header skip button pressed - force skip');
                
                // Force update profile to mark onboarding complete
                if (user?.id) {
                  try {
                    await supabase
                      .from('profiles')
                      .upsert({
                        id: user.id,
                        onboarding_completed: true,
                        updated_at: new Date().toISOString(),
                      });
                    console.log('Profile updated successfully');
                  } catch (error) {
                    console.error('Error updating profile:', error);
                  }
                }
                
                router.replace('/(tabs)/discover');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.headerSkipButtonText}>Bỏ qua ngay →</Text>
            </TouchableOpacity>
          </View>

          {/* Pet Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loại thú cưng yêu thích</Text>
            <View style={styles.optionsGrid}>
              {PET_TYPES.map((petType) => (
                <TouchableOpacity
                  key={petType.id}
                  style={[
                    styles.optionCard,
                    selectedPetTypes.includes(petType.id) && styles.optionCardSelected,
                  ]}
                  onPress={() => toggleSelection(petType.id, selectedPetTypes, setSelectedPetTypes)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionEmoji}>{petType.emoji}</Text>
                  <Text style={[
                    styles.optionText,
                    selectedPetTypes.includes(petType.id) && styles.optionTextSelected,
                  ]}>
                    {petType.name}
                  </Text>
                  {selectedPetTypes.includes(petType.id) && (
                    <View style={styles.checkIcon}>
                      <Check size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Age Ranges */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Độ tuổi mong muốn</Text>
            <View style={styles.optionsList}>
              {AGE_RANGES.map((ageRange) => (
                <TouchableOpacity
                  key={ageRange.id}
                  style={[
                    styles.listOption,
                    selectedAgeRanges.includes(ageRange.id) && styles.listOptionSelected,
                  ]}
                  onPress={() => toggleSelection(ageRange.id, selectedAgeRanges, setSelectedAgeRanges)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.listOptionText,
                    selectedAgeRanges.includes(ageRange.id) && styles.listOptionTextSelected,
                  ]}>
                    {ageRange.name}
                  </Text>
                  {selectedAgeRanges.includes(ageRange.id) && (
                    <View style={styles.checkIconSmall}>
                      <Check size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price Ranges */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khoảng giá mong muốn</Text>
            <View style={styles.optionsList}>
              {PRICE_RANGES.map((priceRange) => (
                <TouchableOpacity
                  key={priceRange.id}
                  style={[
                    styles.listOption,
                    selectedPriceRanges.includes(priceRange.id) && styles.listOptionSelected,
                  ]}
                  onPress={() => toggleSelection(priceRange.id, selectedPriceRanges, setSelectedPriceRanges)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.listOptionText,
                    selectedPriceRanges.includes(priceRange.id) && styles.listOptionTextSelected,
                  ]}>
                    {priceRange.name}
                  </Text>
                  {selectedPriceRanges.includes(priceRange.id) && (
                    <View style={styles.checkIconSmall}>
                      <Check size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            console.log('Skip button pressed - direct handler');
            router.replace('/(tabs)/discover');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.skipButtonText}>Bỏ qua</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinish}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.finishButtonText}>
            {loading ? 'Đang lưu...' : 'Hoàn thành'}
          </Text>
          {!loading && <ArrowRight size={20} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerSkipButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
  },
  headerSkipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minWidth: '45%',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B',
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 12,
  },
  listOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listOptionSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B',
  },
  listOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  listOptionTextSelected: {
    color: '#FFFFFF',
  },
  checkIconSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    zIndex: 10000,
    elevation: 10000,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  finishButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    gap: 8,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});