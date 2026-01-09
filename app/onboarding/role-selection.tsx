import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react-native';

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<'user' | 'seller' | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleRoleSelect = (role: 'user' | 'seller') => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole || !user) {
      Alert.alert('Lỗi', 'Vui lòng chọn vai trò của bạn');
      return;
    }

    setLoading(true);
    try {
      // Create or update profile with selected role
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role: selectedRole,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating profile:', error);
        Alert.alert('Lỗi', 'Không thể tạo profile. Vui lòng thử lại.');
        return;
      }

      // Navigate to preferences screen
      router.push('/onboarding/preferences');
    } catch (error) {
      console.error('Error in handleContinue:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Chào mừng đến với PetAdopt! 🐾</Text>
          <Text style={styles.subtitle}>
            Hãy cho chúng tôi biết bạn muốn sử dụng ứng dụng như thế nào
          </Text>
        </View>

        {/* Role Options */}
        <View style={styles.roleContainer}>
          {/* User Role */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'user' && styles.roleCardSelected,
            ]}
            onPress={() => handleRoleSelect('user')}
            activeOpacity={0.8}
          >
            <View style={styles.roleIcon}>
              <Heart size={48} color={selectedRole === 'user' ? '#FFFFFF' : '#FF6B6B'} />
            </View>
            <Text style={[
              styles.roleTitle,
              selectedRole === 'user' && styles.roleTitleSelected,
            ]}>
              Tìm thú cưng
            </Text>
            <Text style={[
              styles.roleDescription,
              selectedRole === 'user' && styles.roleDescriptionSelected,
            ]}>
              Tôi muốn tìm và nhận nuôi thú cưng
            </Text>
            <View style={styles.roleFeatures}>
              <Text style={[
                styles.featureText,
                selectedRole === 'user' && styles.featureTextSelected,
              ]}>
                • Duyệt và tìm kiếm thú cưng
              </Text>
              <Text style={[
                styles.featureText,
                selectedRole === 'user' && styles.featureTextSelected,
              ]}>
                • Kết nối với người bán
              </Text>
              <Text style={[
                styles.featureText,
                selectedRole === 'user' && styles.featureTextSelected,
              ]}>
                • Theo dõi thú cưng yêu thích
              </Text>
            </View>
          </TouchableOpacity>

          {/* Seller Role */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'seller' && styles.roleCardSelected,
            ]}
            onPress={() => handleRoleSelect('seller')}
            activeOpacity={0.8}
          >
            <View style={styles.roleIcon}>
              <ShoppingBag size={48} color={selectedRole === 'seller' ? '#FFFFFF' : '#3B82F6'} />
            </View>
            <Text style={[
              styles.roleTitle,
              selectedRole === 'seller' && styles.roleTitleSelected,
            ]}>
              Bán thú cưng
            </Text>
            <Text style={[
              styles.roleDescription,
              selectedRole === 'seller' && styles.roleDescriptionSelected,
            ]}>
              Tôi muốn đăng bán thú cưng của mình
            </Text>
            <View style={styles.roleFeatures}>
              <Text style={[
                styles.featureText,
                selectedRole === 'seller' && styles.featureTextSelected,
              ]}>
                • Đăng tin bán thú cưng
              </Text>
              <Text style={[
                styles.featureText,
                selectedRole === 'seller' && styles.featureTextSelected,
              ]}>
                • Quản lý đơn hàng
              </Text>
              <Text style={[
                styles.featureText,
                selectedRole === 'seller' && styles.featureTextSelected,
              ]}>
                • Theo dõi doanh thu
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedRole && styles.continueButtonActive,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole || loading}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            selectedRole && styles.continueButtonTextActive,
          ]}>
            {loading ? 'Đang xử lý...' : 'Tiếp tục'}
          </Text>
          {selectedRole && !loading && (
            <ArrowRight size={20} color="#FFFFFF" />
          )}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60, // Tăng từ 40 lên 60 để header cách xa hơn
  },
  header: {
    alignItems: 'center',
    marginBottom: 50, // Tăng từ 40 lên 50
    marginTop: 20, // Thêm margin top
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
  roleContainer: {
    flex: 1,
    gap: 20,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  roleCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B',
  },
  roleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  roleTitleSelected: {
    color: '#FFFFFF',
  },
  roleDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  roleDescriptionSelected: {
    color: '#FFFFFF',
  },
  roleFeatures: {
    alignSelf: 'stretch',
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  featureTextSelected: {
    color: '#FFFFFF',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 30, // Tăng từ 20 lên 30
    marginBottom: 50, // Tăng từ 40 lên 50 để footer cách xa hơn
    gap: 8,
  },
  continueButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  continueButtonTextActive: {
    color: '#FFFFFF',
  },
});