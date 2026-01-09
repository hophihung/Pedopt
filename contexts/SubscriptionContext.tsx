import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { subscriptionService } from '../src/services/subscription.service';
import type { SubscriptionPlan, Subscription } from '../src/services/subscription.service';
import { Linking, Alert } from 'react-native';

export type { SubscriptionPlan, Subscription };
export type SubscriptionStatus = 'active' | 'pending' | 'canceled' | 'expired';

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  createSubscription: (plan: SubscriptionPlan) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  upgradeSubscription: (newPlan: SubscriptionPlan) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  getPetLimit: (plan?: SubscriptionPlan) => number;
  getImagesPerPetLimit: () => number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query subscription
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('profile_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Nếu có data, đảm bảo có cả plan (text) và plan_id
      if (data) {
        // Nếu có plan_id nhưng không có plan (text), lấy từ subscription_plans
        if (data.plan_id && !data.plan) {
          const { data: planData } = await supabase
            .from('subscription_plans')
            .select('name')
            .eq('id', data.plan_id)
            .maybeSingle();
          if (planData) {
            data.plan = planData.name as SubscriptionPlan;
          }
        }
        // Nếu có plan (text) nhưng không có plan_id, lấy từ subscription_plans
        if (data.plan && !data.plan_id) {
          const { data: planData } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('name', data.plan)
            .eq('is_active', true)
            .maybeSingle();
          if (planData) {
            data.plan_id = planData.id;
            // Cập nhật subscription với plan_id
            await supabase
              .from('subscriptions')
              .update({ plan_id: planData.id })
              .eq('id', data.id);
          }
        }
      }

      setSubscription(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch subscription';
      setError(message);
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (plan: SubscriptionPlan) => {
    try {
      setLoading(true);
      setError(null);

      // Kiểm tra xem user đã có subscription chưa
      const hasActive = await subscriptionService.hasActiveSubscription(user!.id);
      if (hasActive && subscription?.status === 'active' && subscription.plan === plan) {
        console.log('✅ User already has active subscription for plan:', plan);
        return;
      }

      // Free plan - create directly without payment
      if (plan === 'free') {
        console.log('🔵 Creating free subscription for user:', user!.id);
        
        const newSubscription = await subscriptionService.createFreeSubscription(user!.id);
        console.log('✅ Free subscription created successfully:', newSubscription);
        
        setSubscription(newSubscription);
        await fetchSubscription();
        return;
      }

      // Paid plans - process PayOS payment
      console.log('🔵 Creating paid subscription for plan:', plan);
      
      const { subscription: newSubscription, paymentUrl } = 
        await subscriptionService.createPaidSubscription(user!.id, plan, 'monthly');

      console.log('✅ Paid subscription created, opening payment link');

      // Open payment link
      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (canOpen) {
        await Linking.openURL(paymentUrl);
        setSubscription(newSubscription);
        
        Alert.alert(
          'Thanh toán',
          'Vui lòng hoàn tất thanh toán. Subscription sẽ được kích hoạt sau khi thanh toán thành công.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh subscription after a delay to check payment status
                setTimeout(() => {
                  fetchSubscription();
                }, 3000);
              }
            }
          ]
        );
      } else {
        throw new Error('Không thể mở payment link');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create subscription';
      setError(message);
      console.error('🔴 Error creating subscription:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!subscription) {
        throw new Error('No active subscription to cancel');
      }

      const canceledSubscription = await subscriptionService.cancelSubscription(user!.id);
      setSubscription(canceledSubscription);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(message);
      console.error('🔴 Error canceling subscription:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const upgradeSubscription = async (newPlan: SubscriptionPlan) => {
    try {
      setLoading(true);
      setError(null);

      if (!subscription) {
        await createSubscription(newPlan);
        return;
      }

      console.log('🔵 Changing subscription plan from', subscription.plan, 'to', newPlan);

      // Use service to change plan
      const result = await subscriptionService.changePlan(user!.id, newPlan, 'monthly');

      // If free plan, result is Subscription
      if ('id' in result && !('paymentUrl' in result)) {
        setSubscription(result);
        await fetchSubscription();
        return;
      }

      // If paid plan, result has paymentUrl
      if ('paymentUrl' in result) {
        const canOpen = await Linking.canOpenURL(result.paymentUrl);
        if (canOpen) {
          await Linking.openURL(result.paymentUrl);
          setSubscription(result.subscription);
          
          Alert.alert(
            'Thanh toán',
            'Vui lòng hoàn tất thanh toán. Subscription sẽ được cập nhật sau khi thanh toán thành công.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setTimeout(() => {
                    fetchSubscription();
                  }, 3000);
                }
              }
            ]
          );
        } else {
          throw new Error('Không thể mở payment link');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upgrade subscription';
      setError(message);
      console.error('🔴 Error upgrading subscription:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    if (user) {
      await fetchSubscription();
    }
  };

  const getPetLimit = (plan?: SubscriptionPlan): number => {
    // Nếu subscription bị canceled hoặc không có, treat như free plan
    const currentPlan = (subscription?.status === 'active') ? 
      (plan || subscription?.plan || 'free') : 'free';
    const limits = {
      'free': 4,
      'premium': 6,
      'pro': 9,
    };
    return limits[currentPlan] || 4;
  };

  const getImagesPerPetLimit = (): number => {
    return 4; // Tất cả gói đều có giới hạn 4 ảnh/pet
  };

  const value = {
    subscription,
    loading,
    error,
    createSubscription,
    cancelSubscription,
    upgradeSubscription,
    refreshSubscription,
    getPetLimit,
    getImagesPerPetLimit,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

