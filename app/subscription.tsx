import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useSubscription,
  SubscriptionPlan,
} from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    originalPrice: null,
    period: 'Vĩnh viễn',
    description: 'Khám phá thú cưng cơ bản',
    color: '#8E8E93',
    gradient: ['#8E8E93', '#A8A8A8'],
    features: [
      'Tạo tối đa 4 pet objects',
      'Mỗi pet tối đa 4 ảnh',
      'Xem 5 thú cưng mỗi ngày',
      'Liên hệ cơ bản',
      'Hỗ trợ email',
    ],
    limitations: ['Không có tính năng nổi bật', 'Không có analytics'],
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
    color: '#007AFF',
    gradient: ['#007AFF', '#5856D6'],
    features: [
      'Tạo tối đa 6 pet objects',
      'Mỗi pet tối đa 4 ảnh',
      'Xem không giới hạn',
      'Liên hệ ưu tiên',
      'Ẩn số điện thoại',
      'Pet nổi bật',
      'Hỗ trợ ưu tiên',
    ],
    limitations: [],
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
    color: '#FF9500',
    gradient: ['#FF9500', '#FF6B35'],
    features: [
      'Tạo tối đa 9 pet objects',
      'Mỗi pet tối đa 4 ảnh',
      'Mọi tính năng Premium',
      'Analytics chi tiết',
      'Hỗ trợ 24/7',
      'Badge Pro',
      'Tính năng độc quyền',
      'API access',
    ],
    limitations: [],
    petLimit: 9,
    imagesPerPet: 4,
    popular: true,
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, loading, createSubscription, upgradeSubscription } =
    useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
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
                    Alert.alert('Thành công', 'Đã chuyển sang gói Free thành công!');
                    setTimeout(() => {
                      router.replace('/(tabs)/discover/match');
                    }, 1000);
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
          await createSubscription(plan);
          Alert.alert('Thành công', 'Đăng ký gói Free thành công!');
          setTimeout(() => {
            router.replace('/(tabs)/discover/match');
          }, 1000);
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

  const handleSkip = () => {
    router.replace('/(tabs)/discover/match' as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Bỏ qua</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Nâng cấp tài khoản</Text>
          <Text style={styles.headerSubtitle}>
            Chọn gói dịch vụ phù hợp với nhu cầu của bạn
          </Text>
        </View>
      </View>

      {/* Current Subscription */}
      {subscription?.status === 'active' && (
        <View style={styles.currentSubscription}>
          <View style={styles.currentSubscriptionContent}>
            <Text style={styles.currentLabel}>Gói hiện tại:</Text>
            <Text style={styles.currentPlan}>
              {subscription.plan.toUpperCase()}
            </Text>
            <Text style={styles.currentDate}>
              Từ:{' '}
              {new Date(subscription.start_date).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>
      )}

      {/* Plans */}
      <ScrollView
        style={styles.plansContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.plansContent}
      >
        {PLANS.map((plan, index) => {
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
                <LinearGradient
                  colors={
                    isCurrentPlan
                      ? (['#34C759', '#30D158'] as const)
                      : (plan.gradient as any)
                  }
                  style={styles.planGradient}
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
                </LinearGradient>

                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>Tính năng bao gồm:</Text>
                  {plan.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Text style={styles.featureCheckmark}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}

                  {plan.limitations.length > 0 && (
                    <>
                      <Text style={styles.limitationsTitle}>Hạn chế:</Text>
                      {plan.limitations.map((limitation, idx) => (
                        <View key={idx} style={styles.limitationItem}>
                          <Text style={styles.limitationIcon}>✗</Text>
                          <Text style={styles.limitationText}>
                            {limitation}
                          </Text>
                        </View>
                      ))}
                    </>
                  )}
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
                        ? `Nâng cấp lên ${plan.name}`
                        : `Chọn gói ${plan.name}`}
                    </Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Tại sao nên nâng cấp?</Text>
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🚀</Text>
              <Text style={styles.benefitTitle}>Tăng hiệu quả</Text>
              <Text style={styles.benefitDescription}>
                Tạo nhiều pet objects hơn để tăng cơ hội bán
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>⭐</Text>
              <Text style={styles.benefitTitle}>Nổi bật hơn</Text>
              <Text style={styles.benefitDescription}>
                Pet của bạn sẽ được ưu tiên hiển thị
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📊</Text>
              <Text style={styles.benefitTitle}>Analytics</Text>
              <Text style={styles.benefitDescription}>
                Theo dõi hiệu suất và lượt xem
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <Text style={styles.benefitTitle}>Mục tiêu</Text>
              <Text style={styles.benefitDescription}>
                Đạt được mục tiêu bán pet nhanh hơn
              </Text>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Câu hỏi thường gặp</Text>
          <View style={styles.faqItems}>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                Có thể hủy gói bất cứ lúc nào không?
              </Text>
              <Text style={styles.faqAnswer}>
                Có, bạn có thể hủy gói subscription bất cứ lúc nào. Gói sẽ hết
                hạn vào cuối chu kỳ thanh toán.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Có được hoàn tiền không?</Text>
              <Text style={styles.faqAnswer}>
                Chúng tôi cung cấp chính sách hoàn tiền trong vòng 7 ngày đầu
                tiên.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                Có thể nâng cấp/giảm cấp gói không?
              </Text>
              <Text style={styles.faqAnswer}>
                Có, bạn có thể thay đổi gói bất cứ lúc nào. Thay đổi sẽ có hiệu
                lực ngay lập tức.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Bạn có thể thay đổi hoặc hủy gói bất cứ lúc nào
        </Text>
        <Text style={styles.footerSubtext}>Thanh toán an toàn và bảo mật</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    color: '#1F2937',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  currentSubscription: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  currentSubscriptionContent: {
    padding: 20,
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentPlan: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  currentDate: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
    fontWeight: '500',
  },
  plansContainer: {
    flex: 1,
  },
  plansContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  planWrapper: {
    marginBottom: 20,
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
    backgroundColor: 'transparent',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  currentBadge: {
    backgroundColor: '#10B981',
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
    color: '#FF6B6B',
    letterSpacing: -1,
  },
  priceCurrency: {
    fontSize: 18,
    color: '#FF6B6B',
    marginLeft: 4,
    fontWeight: '700',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#6B7280',
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
    color: '#9CA3AF',
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
    color: '#6B7280',
    lineHeight: 24,
    fontWeight: '500',
  },
  featuresContainer: {
    padding: 24,
    paddingTop: 16,
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
  limitationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 12,
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitationIcon: {
    fontSize: 16,
    color: '#EF4444',
    marginRight: 12,
    fontWeight: '700',
  },
  limitationText: {
    fontSize: 14,
    color: '#6B7280',
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
  benefitsSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitItem: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  benefitIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitDescription: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  faqSection: {
    marginTop: 32,
  },
  faqTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  faqItems: {
    gap: 16,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
});
