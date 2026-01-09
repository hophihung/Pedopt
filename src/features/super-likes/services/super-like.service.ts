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

export class SuperLikeService {
  /**
   * Get user's current subscription info
   */
  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscription_info')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {return null;
      }

      return data;
    } catch (error) {return null;
    }
  }

  /**
   * Check if user can super like (has remaining super likes)
   */
  static async canSuperLike(userId: string): Promise<{ canSuperLike: boolean; remaining: number; limit: number }> {
    try {
      // Use the database function we created
      const { data, error } = await supabase.rpc('can_user_super_like', {
        user_profile_id: userId
      });

      if (error) {return { canSuperLike: false, remaining: 0, limit: 0 };
      }

      if (!data || data.length === 0) {
        return { canSuperLike: false, remaining: 0, limit: 0 };
      }

      const result = data[0];
      return {
        canSuperLike: result.can_super_like,
        remaining: result.remaining,
        limit: result.limit_value
      };
    } catch (error) {return { canSuperLike: false, remaining: 0, limit: 0 };
    }
  }

  /**
   * Super like a pet
   */
  static async superLikePet(petId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {// Check if user can super like using database function
      const { canSuperLike, remaining } = await this.canSuperLike(userId);if (!canSuperLike) {
        return {
          success: false,
          message: remaining === 0 ? 'Bạn đã hết lượt Super Like!' : 'Không thể Super Like lúc này'
        };
      }

      // Get pet owner info
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .select('seller_id')
        .eq('id', petId)
        .single();

      if (petError || !pet) {return {
          success: false,
          message: 'Không tìm thấy thú cưng'
        };
      }// Check if already super liked this pet
      const { data: existingSuperLike } = await supabase
        .from('super_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('pet_id', petId)
        .single();

      if (existingSuperLike) {
        return {
          success: false,
          message: 'Bạn đã Super Like thú cưng này rồi!'
        };
      }

      // Create super like with pinning logic
      const { error: superLikeError } = await supabase
        .from('super_likes')
        .insert({
          user_id: userId,
          pet_id: petId,
          pet_owner_id: pet.seller_id,
          is_pinned: true,
          is_replied: false,
          pinned_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (superLikeError) {return {
          success: false,
          message: 'Có lỗi xảy ra khi Super Like'
        };
      }// Update subscription usage using database function
      const { data: updateResult, error: updateError } = await supabase.rpc('increment_super_like_usage', {
        user_profile_id: userId
      });

      if (updateError) {} else {}

      return {
        success: true,
        message: 'Super Like thành công! Tin nhắn của bạn sẽ được ghim lên đầu ⭐'
      };

    } catch (error) {return {
        success: false,
        message: 'Có lỗi xảy ra'
      };
    }
  }

  /**
   * Get user's super liked pets
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
          pets (
            id,
            name,
            images,
            type,
            age_months
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {return [];
      }

      return data || [];
    } catch (error) {return [];
    }
  }

  /**
   * Remove super like
   */
  static async removeSuperLike(petId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('super_likes')
        .delete()
        .eq('user_id', userId)
        .eq('pet_id', petId);

      if (error) {return {
          success: false,
          message: 'Có lỗi xảy ra khi bỏ Super Like'
        };
      }

      // Update subscription usage
      const subscription = await this.getUserSubscription(userId);
      if (subscription && subscription.plan_type !== 'unlimited' && subscription.super_likes_used > 0) {
        await supabase
          .from('subscriptions')
          .update({
            super_likes_used: subscription.super_likes_used - 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('is_active', true);
      }

      return {
        success: true,
        message: 'Đã bỏ Super Like'
      };

    } catch (error) {return {
        success: false,
        message: 'Có lỗi xảy ra'
      };
    }
  }

  /**
   * Get pinned super likes for a user (messages that should be pinned)
   */
  static async getPinnedSuperLikes(userId: string): Promise<SuperLike[]> {
    try {
      const { data, error } = await supabase
        .from('pinned_super_likes')
        .select('*')
        .eq('pet_owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) {return [];
      }

      return data || [];
    } catch (error) {return [];
    }
  }

  /**
   * Handle reply to super like (unpin the message)
   */
  static async handleSuperLikeReply(superLikeId: string, replierUserId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('handle_super_like_reply', {
        super_like_id: superLikeId,
        replier_user_id: replierUserId
      });

      if (error) {return {
          success: false,
          message: 'Có lỗi xảy ra khi xử lý reply'
        };
      }

      return {
        success: data,
        message: data ? 'Đã bỏ ghim tin nhắn' : 'Không thể bỏ ghim tin nhắn'
      };
    } catch (error) {return {
        success: false,
        message: 'Có lỗi xảy ra'
      };
    }
  }

  /**
   * Get super likes sent by user (for tracking purposes)
   */
  static async getSentSuperLikes(userId: string): Promise<SuperLike[]> {
    try {
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
          pets (
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
        .order('created_at', { ascending: false });

      if (error) {return [];
      }

      return data || [];
    } catch (error) {return [];
    }
  }

  /**
   * Get subscription plans
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
        super_likes_limit: -1, // -1 means unlimited
        features: ['Super Likes không giới hạn', 'Tất cả tính năng Premium', 'Ưu tiên hỗ trợ']
      }
    ];
  }
}