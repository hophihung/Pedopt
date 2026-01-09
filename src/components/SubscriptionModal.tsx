import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import {
  useSubscription,
  SubscriptionPlan,
} from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    originalPrice: null,
    period: 'Vĩnh viễn',
    description: 'Khám phá thú cưng cơ bản',
    color: '#9CA3AF',
    gradient: ['#9CA3AF', '#6B7280'],
    features: [
      'Tạo tối đa 4 pet objects',
      'Mỗi pet tối đa 4 ảnh',
      'Xem 5 thú cưng mỗi ngày',
    ],
    petLimit: 4,
    imagesPerPet: 4,
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99000,
    originalPrice: 149000,
    period: '/tháng',
    description: 'Trải nghiệm nâng cao',
    color: '#FF6B6B',
    gradient: ['#FF6B6B', '#FF8A8A'],
    features: [
      'Tạo tối đa 6 pet objects',
      'Mỗi pet tối đa 4 ảnh',
      'Xem không giới hạn',
      'Pet nổi bật',
    ],
    petLimit: 6,
    imagesPerPet: 4,
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149000,
    originalPrice: 299000,
    period: '/tháng',
    description: 'Chuyên nghiệp',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#FBBF24'],
    features: [
      'Tạo tối đa 9 pet objects',
      'Mỗi pet tối đa 4 ảnh',
      'Mọi tính năng Premium',
      'Analytics chi tiết',
    ],
    petLimit: 9,
    imagesPerPet: 4,
    popular: false,
  },
];

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SubscriptionModal({ visible, onClose }: SubscriptionModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, loading, createSubscription, upgradeSubscription, refreshSubscription } =
    useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để đăng ký gói');
      return;
    }

    try {
      setIsProcessing(true);
      setSelectedPlan(plan);

      // Free plan - create directly without payment
      if (plan === 'free') {
        // Nếu đang có subscription active và không phải free, hỏi xác nhận
        if (subscription?.status === 'active' && subscription.plan !== 'free') {
          Alert.alert(
            'Xác nhận hủy gói',
            `Bạn đang sử dụng gói ${subscription.plan.toUpperCase()}. Bạn có chắc chắn muốn hủy và chuyển sang gói Free không?`,
            [
              {
                text: 'Hủy',
                style: 'cancel',
                onPress: () => {
                  setIsProcessing(false);
                  setSelectedPlan(null);
                }
              },
              {
                text: 'Xác nhận',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await upgradeSubscription(plan);
                    // Refresh subscription để đảm bảo state được cập nhật
                    await refreshSubscription();
                    Alert.alert('Thành công', 'Đã chuyển sang gói Free thành công!');
                    setTimeout(() => {
                      onClose();
                    }, 500);
                  } catch (error) {
                    Alert.alert(
                      'Lỗi',
                      error instanceof Error ? error.message : 'Có lỗi xảy ra'
                    );
                  } finally {
                    setIsProcessing(false);
                    setSelectedPlan(null);
                  }
                }
              }
            ]
          );
          return;
        } else if (!subscription || subscription.status !== 'active') {
          console.log('🔵 Creating new free subscription...');
          await createSubscription(plan);
          console.log('✅ Free subscription created');
          // Refresh subscription để đảm bảo state được cập nhật
          await refreshSubscription();
          Alert.alert('Thành công', 'Đăng ký gói Free thành công!');
          setTimeout(() => {
            onClose();
          }, 500);
        } else {
          // Đã có free subscription active
          Alert.alert('Thông báo', 'Bạn đã có gói Free đang hoạt động');
          onClose();
        }
        return;
      }

      // Paid plans - process PayOS payment
      if (subscription?.status === 'active' && subscription.plan !== plan) {
        // Upgrade hoặc downgrade
        await upgradeSubscription(plan);
        // Don't show success alert here, PayOS will handle it
        return;
      } else if (!subscription || subscription.status !== 'active') {
        // Tạo mới subscription
        await createSubscription(plan);
        // Don't show success alert here, PayOS will handle it
        return;
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      Alert.alert(
        'Lỗi',
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng ký gói'
      );
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const formatPrice = (amount: number) => {
    if (amount === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chọn gói subscription</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Plans */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {PLANS.map((plan) => {
              const isCurrentPlan = subscription?.plan === plan.id;
              const isSelected = selectedPlan === plan.id;
              const isPopular = plan.popular;

              return (
                <View key={plan.id} style={styles.planWrapper}>
                  {isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>PHỔ BIẾN NHẤT</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.planCard,
                      isCurrentPlan && styles.planCardCurrent,
                      isSelected && styles.planCardSelected,
                      isPopular && styles.planCardPopular,
                    ]}
                    onPress={() => handleSelectPlan(plan.id as SubscriptionPlan)}
                    disabled={isProcessing || isCurrentPlan}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.planGradient,
                        {
                          backgroundColor: isCurrentPlan
                            ? '#10B981'
                            : plan.color,
                        },
                      ]}
                    >
                      <View style={styles.planHeader}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        {isCurrentPlan && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Hiện tại</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.priceContainer}>
                        <Text style={styles.price}>
                          {plan.price.toLocaleString('vi-VN')}
                        </Text>
                        <Text style={styles.priceCurrency}>đ</Text>
                        <Text style={styles.pricePeriod}>{plan.period}</Text>
                      </View>

                      {plan.originalPrice && (
                        <View style={styles.originalPriceContainer}>
                          <Text style={styles.originalPrice}>
                            {plan.originalPrice.toLocaleString('vi-VN')}đ
                          </Text>
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>
                              -
                              {Math.round(
                                (1 - plan.price / plan.originalPrice) * 100
                              )}
                              %
                            </Text>
                          </View>
                        </View>
                      )}

                      <Text style={styles.planDescription}>{plan.description}</Text>
                    </View>

                    <View style={styles.featuresContainer}>
                      <Text style={styles.featuresTitle}>Tính năng bao gồm:</Text>
                      {plan.features.map((feature, idx) => (
                        <View key={idx} style={styles.featureItem}>
                          <Text style={styles.featureCheckmark}>✓</Text>
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.selectButton,
                        isCurrentPlan && styles.selectButtonDisabled,
                        isPopular && styles.selectButtonPopular,
                      ]}
                      onPress={() => handleSelectPlan(plan.id as SubscriptionPlan)}
                      disabled={isProcessing || isCurrentPlan}
                    >
                      {isProcessing && selectedPlan === plan.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text
                          style={[
                            styles.selectButtonText,
                            isCurrentPlan && styles.selectButtonTextDisabled,
                          ]}
                        >
                          {isCurrentPlan
                            ? 'Gói hiện tại'
                            : subscription?.status === 'active'
                            ? `Chuyển sang ${plan.name}`
                            : `Chọn gói ${plan.name}`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 40,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  planWrapper: {
    marginBottom: 16,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  planCardCurrent: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
  },
  planCardSelected: {
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.2,
  },
  planCardPopular: {
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.2,
  },
  planGradient: {
    padding: 24,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  currentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  priceCurrency: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '700',
  },
  pricePeriod: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    fontWeight: '600',
  },
  originalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  originalPrice: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  planDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    fontWeight: '500',
  },
  featuresContainer: {
    padding: 24,
    paddingTop: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureCheckmark: {
    fontSize: 16,
    color: '#10B981',
    marginRight: 12,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  selectButton: {
    margin: 24,
    marginTop: 0,
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  selectButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  selectButtonPopular: {
    backgroundColor: '#FF6B6B',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  selectButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

