import { supabase } from "@/lib/supabaseClient";

export interface SuperLike {
  id: string;
  user_id: string;
  pet_id: string;
  pet_owner_id: string;
  is_pinned: boolean;
  is_replied: boolean;
  created_at: string;
  replied_at?: string;
  // Extended info for UI
  user_name?: string;
  user_avatar?: string;
  user_email?: string;
  pet_name?: string;
  pet_images?: string[];
  pet_type?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'basic' | 'premium' | 'unlimited';
  super_likes_limit: number;
  super_likes_used: number;
  super_likes_remaining: number;
  is_active: boolean;
  start_date: string;
  end_date?: string;
}

// Cache for subscription data to avoid repeated DB calls
const subscriptionCache = new Map<string, { data: Subscription | null; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export class SuperLikeOptimizedService {
  /**
   * Get user's current subscription info with caching
   */
  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      // Check cache first
      const cached = subscriptionCache.get(userId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
      }

      const { data, error } = await supabase
        .from('user_subscription_info')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return null;
      }

      // Cache the result
      subscriptionCache.set(userId, { data, timestamp: now });
      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user can super like (optimized with single RPC call)
   */
  static async canSuperLike(userId: string): Promise<{ canSuperLike: boolean; remaining: number; limit: number }> {
    try {
      // Use single optimized RPC call
      const { data, error } = await supabase.rpc('can_user_super_like_optimized', {
        user_profile_id: userId
      });

      if (error) {
        return { canSuperLike: false, remaining: 0, limit: 0 };
      }

      if (!data) {
        return { canSuperLike: false, remaining: 0, limit: 0 };
      }

      return {
        canSuperLike: data.can_super_like,
        remaining: data.remaining,
        limit: data.limit_value
      };
    } catch (error) {
      return { canSuperLike: false, remaining: 0, limit: 0 };
    }
  }

  /**
   * Super like a pet (optimized with single transaction)
   */
  static async superLikePet(petId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Use single RPC call that handles everything in one transaction
      const { data, error } = await supabase.rpc('super_like_pet_optimized', {
        p_pet_id: petId,
        p_user_id: userId
      });

      if (error) {
        // Handle specific error cases
        if (error.message?.includes('already_super_liked')) {
          return {
            success: false,
            message: 'Bạn đã Super Like thú cưng này rồi!'
          };
        }
        
        if (error.message?.includes('no_super_likes_remaining')) {
          return {
            success: false,
            message: 'Bạn đã hết lượt Super Like!'
          };
        }
        
        if (error.message?.includes('pet_not_found')) {
          return {
            success: false,
            message: 'Không tìm thấy thú cưng'
          };
        }
        
        return {
          success: false,
          message: 'Có lỗi xảy ra khi Super Like'
        };
      }

      if (!data?.success) {
        return {
          success: false,
          message: data?.message || 'Không thể Super Like lúc này'
        };
      }

      // Clear cache to force refresh
      subscriptionCache.delete(userId);

      return {
        success: true,
        message: 'Super Like thành công! Tin nhắn của bạn sẽ được ghim lên đầu ⭐'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Có lỗi xảy ra'
      };
    }
  }

  /**
   * Get user's super liked pets (optimized query)
   */
  static async getUserSuperLikes(userId: string): Promise<SuperLike[]> {
    try {
      const { data, error } = await supabase
        .from('super_likes')
        .select(`
          id,
          user_id,
          pet_id,
          created_at,
          pets!inner (
            id,
            name,
            images,
            type,
            age_months
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50); // Limit results for performance

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Remove super like (optimized with single RPC)
   */
  static async removeSuperLike(petId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('remove_super_like_optimized', {
        p_pet_id: petId,
        p_user_id: userId
      });

      if (error) {
        return {
          success: false,
          message: 'Có lỗi xảy ra khi bỏ Super Like'
        };
      }

      // Clear cache
      subscriptionCache.delete(userId);

      return {
        success: data?.success || false,
        message: data?.success ? 'Đã bỏ Super Like' : 'Không thể bỏ Super Like'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Có lỗi xảy ra'
      };
    }
  }

  /**
   * Get pinned super likes for a user (optimized)
   */
  static async getPinnedSuperLikes(userId: string): Promise<SuperLike[]> {
    try {
      const { data, error } = await supabase
        .from('pinned_super_likes')
        .select('*')
        .eq('pet_owner_id', userId)
        .eq('is_pinned', true)
        .order('created_at', { ascending: false })
        .limit(20); // Limit for performance

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Handle reply to super like (optimized)
   */
  static async handleSuperLikeReply(superLikeId: string, replierUserId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('handle_super_like_reply_optimized', {
        p_super_like_id: superLikeId,
        p_replier_user_id: replierUserId
      });

      if (error) {
        return {
          success: false,
          message: 'Có lỗi xảy ra khi xử lý reply'
        };
      }

      return {
        success: data?.success || false,
        message: data?.success ? 'Đã bỏ ghim tin nhắn' : 'Không thể bỏ ghim tin nhắn'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Có lỗi xảy ra'
      };
    }
  }

  /**
   * Get super likes sent by user (optimized with pagination)
   */
  static async getSentSuperLikes(userId: string, page: number = 0, limit: number = 20): Promise<SuperLike[]> {
    try {
      const offset = page * limit;
      
      const { data, error } = await supabase
        .from('super_likes')
        .select(`
          id,
          user_id,
          pet_id,
          pet_owner_id,
          is_pinned,
          is_replied,
          created_at,
          replied_at,
          pets!inner (
            id,
            name,
            images,
            type,
            age_months
          ),
          profiles!super_likes_pet_owner_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear cache for user (call when subscription changes)
   */
  static clearCache(userId: string): void {
    subscriptionCache.delete(userId);
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    subscriptionCache.clear();
  }

  /**
   * Get subscription plans (static data)
   */
  static getSubscriptionPlans() {
    return [
      {
        type: 'free',
        name: 'Miễn phí',
        price: 0,
        super_likes_limit: 5,
        features: ['5 Super Likes/tháng', 'Xem profile cơ bản', 'Match không giới hạn']
      },
      {
        type: 'basic',
        name: 'Cơ bản',
        price: 99000,
        super_likes_limit: 10,
        features: ['10 Super Likes/tháng', 'Xem ai đã like bạn', 'Boost profile 1 lần/tháng']
      },
      {
        type: 'premium',
        name: 'Cao cấp',
        price: 199000,
        super_likes_limit: 25,
        features: ['25 Super Likes/tháng', 'Rewind không giới hạn', 'Passport - tìm kiếm toàn quốc']
      },
      {
        type: 'unlimited',
        name: 'Không giới hạn',
        price: 299000,
        super_likes_limit: -1,
        features: ['Super Likes không giới hạn', 'Tất cả tính năng Premium', 'Ưu tiên hỗ trợ']
      }
    ];
  }
}