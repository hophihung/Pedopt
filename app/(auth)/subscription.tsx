/**
 * SubscriptionScreen - Auth Flow
 * Màn hình chọn subscription plan cho seller mới
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { paymentService, SubscriptionPlan } from '../../src/services/payment.service';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { CurrencyConverter } from '../../src/utils/currency';

export default function SubscriptionScreen() {
  const { user, profile } = useAuth();
  const { createSubscription } = useSubscription();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      console.log('🔵 Loading subscription plans...');
      const availablePlans = await paymentService.getSubscriptionPlans();
      console.log('🔵 Loaded plans:', availablePlans.length);
      setPlans(availablePlans);
      // Mặc định chọn free plan
      const freePlan = availablePlans.find(p => p.name === 'free');
      if (freePlan) {
        console.log('🔵 Selected free plan:', freePlan.id);
        setSelectedPlan(freePlan.id);
      }
    } catch (error) {
      console.error('🔴 Error loading plans:', error);
      Alert.alert('Error', 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    console.log('🔵 Continue clicked, selectedPlan:', selectedPlan);
    
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    const plan = plans.find(p => p.id === selectedPlan);
    console.log('🔵 Selected plan:', plan);
    
    if (!plan) {
      Alert.alert('Error', 'Invalid plan selected');
      return;
    }

    // Nếu chọn free plan, tạo subscription và tiếp tục
    if (plan.name === 'free') {
      console.log('🔵 Creating free plan subscription...');
      try {
        setUpgrading(true);
        await createSubscription('free');
        console.log('✅ Free plan subscription created successfully');
        // Đợi một chút để đảm bảo subscription được sync
        await new Promise(resolve => setTimeout(resolve, 500));
        router.replace('/(auth)/filter-pets');
      } catch (error) {
        console.error('🔴 Error creating free subscription:', error);
        Alert.alert(
          'Lỗi',
          error instanceof Error ? error.message : 'Không thể tạo subscription. Vui lòng thử lại.'
        );
      } finally {
        setUpgrading(false);
      }
      return;
    }

    // Nếu chọn paid plan, hiển thị thông báo (trong MVP có thể skip payment)
    Alert.alert(
      'Payment Required',
      `You selected ${plan.display_name} plan. In MVP, you can continue with free plan for now.`,
      [
        {
          text: 'Continue with Free',
          onPress: () => {
            console.log('🔵 User chose to continue with free plan');
            router.replace('/(auth)/filter-pets');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const formatPrice = (amount: number) => {
    if (amount === 0) return 'Miễn phí';
    return CurrencyConverter.format(amount, 'VND');
  };

  const getPriceText = (plan: SubscriptionPlan) => {
    if (plan.name === 'free') return 'Miễn phí';
    const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    const monthlyPrice = plan.price_monthly;
    const yearlyDiscount = Math.round((1 - plan.price_yearly / (monthlyPrice * 12)) * 100);
    
    if (billingCycle === 'yearly' && yearlyDiscount > 0) {
      return `${formatPrice(price)}/năm (Tiết kiệm ${yearlyDiscount}%)`;
    }
    return `${formatPrice(price)}/${billingCycle === 'yearly' ? 'năm' : 'tháng'}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading subscription plans...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🎉</Text>
            <Text variant="headlineMedium" style={styles.title}>
              Welcome, Pet Care Provider!
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Choose your subscription plan to start helping pets find loving homes
            </Text>
          </View>

          {/* Billing Cycle Toggle */}
          <View style={styles.billingToggle}>
            <Button
              mode={billingCycle === 'monthly' ? 'contained' : 'outlined'}
              onPress={() => setBillingCycle('monthly')}
              style={styles.toggleButton}
            >
              Monthly
            </Button>
            <Button
              mode={billingCycle === 'yearly' ? 'contained' : 'outlined'}
              onPress={() => setBillingCycle('yearly')}
              style={styles.toggleButton}
            >
              Yearly (Save 17%)
            </Button>
          </View>

          {/* Plans */}
          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <Card
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.selectedPlanCard,
                  plan.is_popular && styles.popularPlanCard
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                <Card.Content style={styles.planContent}>
                  {plan.is_popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>Most Popular</Text>
                    </View>
                  )}
                  
                  <View style={styles.planHeader}>
                    <Ionicons 
                      name={plan.icon as any} 
                      size={32} 
                      color={plan.color} 
                    />
                    <Text variant="titleLarge" style={styles.planName}>
                      {plan.display_name}
                    </Text>
                  </View>

                  <Text style={[styles.planPrice, { color: plan.color }]}>
                    {getPriceText(plan)}
                  </Text>

                  <Text style={styles.planDescription}>
                    {plan.description}
                  </Text>

                  <View style={styles.featuresContainer}>
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.featureText}>
                          {feature.name}: {feature.value === 'unlimited' ? 'Unlimited' : feature.value}
                        </Text>
                      </View>
                    ))}
                    {plan.features.length > 3 && (
                      <Text style={styles.moreFeatures}>
                        +{plan.features.length - 3} more features
                      </Text>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>

          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleContinue}
              loading={upgrading}
              disabled={!selectedPlan}
              style={styles.continueButton}
            >
              Continue
            </Button>
            
            <Text style={styles.helpText}>
              You can upgrade or change your plan anytime in your profile settings
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontWeight: '800',
    marginBottom: 8,
    color: '#1F2937',
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
  },
  billingToggle: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleButton: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 12,
  },
  plansContainer: {
    marginBottom: 32,
  },
  planCard: {
    marginBottom: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedPlanCard: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.2,
  },
  popularPlanCard: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.2,
  },
  planContent: {
    padding: 24,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    marginLeft: 12,
    fontWeight: '800',
    color: '#1F2937',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    color: '#FF6B6B',
    letterSpacing: -0.5,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  featuresContainer: {
    marginTop: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    flex: 1,
    fontWeight: '500',
    lineHeight: 20,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 6,
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 40,
  },
  continueButton: {
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 6,
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  helpText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 18,
  },
});