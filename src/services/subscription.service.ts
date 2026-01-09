/**
 * Improved Subscription Service
 * Xử lý subscription với error handling tốt hơn, retry logic, và validation
 */

import { supabase } from '@/lib/supabase';
import { PayOSSubscriptionService } from './payos-subscription.service';
import { Linking, Alert } from 'react-native';

export type SubscriptionPlan = 'free' | 'premium' | 'pro';
export type SubscriptionStatus = 'active' | 'pending' | 'canceled' | 'expired';

export interface Subscription {
  id: string;
  profile_id: string;
  plan: SubscriptionPlan;
  plan_id: string | null;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  billing_cycle: 'monthly' | 'yearly';
  payment_method: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateSubscriptionOptions {
  plan: SubscriptionPlan;
  billingCycle?: 'monthly' | 'yearly';
  retries?: number;
}

interface SubscriptionError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

class SubscriptionService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Retry helper với exponential backoff
   */
  private async retry<T>(
    fn: () => Promise<T>,
    retries: number = this.MAX_RETRIES,
    delay: number = this.RETRY_DELAY
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }

      // Don't retry on certain errors
      const subscriptionError = error as SubscriptionError;
      if (
        subscriptionError.code === '23505' || // Unique constraint violation
        subscriptionError.code === '23503' || // Foreign key violation
        subscriptionError.message?.includes('not found')
      ) {
        throw error;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff
      return this.retry(fn, retries - 1, delay * 2);
    }
  }

  /**
   * Validate subscription data
   */
  private validatePlan(plan: SubscriptionPlan): void {
    const validPlans: SubscriptionPlan[] = ['free', 'premium', 'pro'];
    if (!validPlans.includes(plan)) {
      throw new Error(`Invalid plan: ${plan}. Must be one of: ${validPlans.join(', ')}`);
    }
  }

  /**
   * Get plan ID from plan name
   */
  private async getPlanId(plan: SubscriptionPlan): Promise<string> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', plan)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch plan: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Plan '${plan}' not found or inactive`);
    }

    return data.id;
  }

  /**
   * Check if user already has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('profile_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check subscription: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Get user's current subscription
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    return data;
  }

  /**
   * Create or update subscription (atomic operation)
   */
  async createOrUpdateSubscription(
    userId: string,
    options: CreateSubscriptionOptions
  ): Promise<Subscription> {
    this.validatePlan(options.plan);

    return this.retry(async () => {
      const planId = await this.getPlanId(options.plan);

      // Use database function for atomic operation
      const { data, error } = await supabase.rpc('create_or_update_subscription', {
        user_profile_id: userId,
        plan_name: options.plan,
        plan_id_param: planId,
        billing_cycle_param: options.billingCycle || 'monthly',
      });

      if (error) {
        throw new Error(`Failed to create subscription: ${error.message}`);
      }

      if (!data) {
        throw new Error('Subscription creation returned no data');
      }

      return data as Subscription;
    });
  }

  /**
   * Create free subscription
   */
  async createFreeSubscription(userId: string): Promise<Subscription> {
    try {
      // Check existing subscription first
      const existing = await this.getSubscription(userId);
      
      if (existing && existing.status === 'active' && existing.plan === 'free') {
        return existing;
      }

      return await this.createOrUpdateSubscription(userId, {
        plan: 'free',
        billingCycle: 'monthly',
      });
    } catch (error) {
      const err = error as SubscriptionError;
      throw new Error(
        `Failed to create free subscription: ${err.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Create paid subscription with payment
   */
  async createPaidSubscription(
    userId: string,
    plan: 'premium' | 'pro',
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<{ subscription: Subscription; paymentUrl: string }> {
    try {
      this.validatePlan(plan);

      // Get plan price
      const planPrices: Record<'premium' | 'pro', number> = {
        premium: 99000,
        pro: 149000,
      };
      const amount = planPrices[plan] || 0;

      if (amount <= 0) {
        throw new Error('Invalid plan price');
      }

      // Create pending subscription first
      const subscription = await this.createOrUpdateSubscription(userId, {
        plan,
        billingCycle,
      });

      // Update to pending status
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ status: 'pending' })
        .eq('id', subscription.id);

      if (updateError) {
        throw new Error(`Failed to set subscription to pending: ${updateError.message}`);
      }

      // Create PayOS payment link
      const paymentLink = await PayOSSubscriptionService.createSubscriptionPaymentLink(
        subscription.id,
        plan,
        amount,
        billingCycle
      );

      return {
        subscription: { ...subscription, status: 'pending' },
        paymentUrl: paymentLink.payment_url,
      };
    } catch (error) {
      const err = error as SubscriptionError;
      throw new Error(
        `Failed to create paid subscription: ${err.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Activate subscription after successful payment
   */
  async activateSubscription(
    subscriptionId: string,
    paymentId: string,
    paymentMethod: string
  ): Promise<Subscription> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          payment_id: paymentId,
          payment_method: paymentMethod,
          start_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to activate subscription: ${error.message}`);
      }

      if (!data) {
        throw new Error('Subscription not found');
      }

      return data;
    } catch (error) {
      const err = error as SubscriptionError;
      throw new Error(
        `Failed to activate subscription: ${err.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<Subscription> {
    try {
      const subscription = await this.getSubscription(userId);

      if (!subscription) {
        throw new Error('No subscription found');
      }

      if (subscription.status === 'canceled') {
        return subscription;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to cancel subscription: ${error.message}`);
      }

      if (!data) {
        throw new Error('Subscription not found');
      }

      return data;
    } catch (error) {
      const err = error as SubscriptionError;
      throw new Error(
        `Failed to cancel subscription: ${err.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Upgrade/Downgrade subscription
   */
  async changePlan(
    userId: string,
    newPlan: SubscriptionPlan,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<Subscription | { subscription: Subscription; paymentUrl: string }> {
    try {
      this.validatePlan(newPlan);

      const currentSubscription = await this.getSubscription(userId);

      // If upgrading to free, just update
      if (newPlan === 'free') {
        return await this.createOrUpdateSubscription(userId, {
          plan: 'free',
          billingCycle: 'monthly',
        });
      }

      // If upgrading to paid plan, create payment
      if (newPlan === 'premium' || newPlan === 'pro') {
        return await this.createPaidSubscription(userId, newPlan, billingCycle);
      }

      throw new Error('Invalid plan transition');
    } catch (error) {
      const err = error as SubscriptionError;
      throw new Error(`Failed to change plan: ${err.message || 'Unknown error'}`);
    }
  }

  /**
   * Refresh subscription status (check payment status)
   */
  async refreshSubscription(userId: string): Promise<Subscription | null> {
    try {
      const subscription = await this.getSubscription(userId);

      if (!subscription) {
        return null;
      }

      // If subscription is pending, check payment status
      if (subscription.status === 'pending' && subscription.payment_id) {
        // Check payment status via PayOS
        // This would need to be implemented based on your payment provider
        // For now, just return current subscription
      }

      return subscription;
    } catch (error) {
      const err = error as SubscriptionError;
      console.error('Error refreshing subscription:', err);
      return null;
    }
  }
}

export const subscriptionService = new SubscriptionService();

