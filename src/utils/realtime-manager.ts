/**
 * Realtime Subscription Manager
 * Quản lý và tối ưu hóa realtime subscriptions
 */

import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

interface SubscriptionConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: any) => void;
}

class RealtimeManager {
  private channels = new Map<string, RealtimeChannel>();
  private client: SupabaseClient | null = null;

  /**
   * Initialize with Supabase client
   */
  init(client: SupabaseClient): void {
    this.client = client;
  }

  /**
   * Subscribe to table changes
   */
  subscribe(
    channelName: string,
    config: SubscriptionConfig
  ): () => void {
    if (!this.client) {
      throw new Error('RealtimeManager not initialized');
    }

    // Unsubscribe existing channel with same name
    this.unsubscribe(channelName);

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: config.event,
          schema: 'public',
          table: config.table,
          filter: config.filter,
        },
        config.callback
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribe(channelName);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.client?.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    for (const [name, channel] of this.channels.entries()) {
      this.client?.removeChannel(channel);
    }
    this.channels.clear();
  }

  /**
   * Get active channels count
   */
  getActiveChannelsCount(): number {
    return this.channels.size;
  }

  /**
   * Check if channel is subscribed
   */
  isSubscribed(channelName: string): boolean {
    return this.channels.has(channelName);
  }
}

// Singleton instance
export const realtimeManager = new RealtimeManager();

/**
 * Debounce function for realtime updates
 */
export function debounceRealtime<T>(
  callback: (data: T) => void,
  delay: number = 300
): (data: T) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (data: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(data);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function for realtime updates
 */
export function throttleRealtime<T>(
  callback: (data: T) => void,
  limit: number = 1000
): (data: T) => void {
  let inThrottle: boolean = false;

  return (data: T) => {
    if (!inThrottle) {
      callback(data);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

