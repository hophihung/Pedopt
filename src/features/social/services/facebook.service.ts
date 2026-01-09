import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FacebookProfile {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface FacebookConnection {
  id: string;
  user_id: string;
  facebook_id: string;
  facebook_name: string;
  facebook_email?: string;
  facebook_avatar?: string;
  connected_at: string;
  is_active: boolean;
}

export const FacebookService = {
  // Check if user has Facebook connected
  async isConnected(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('facebook_connections')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Error checking Facebook connection:', error);
      return false;
    }
  },

  // Get Facebook connection info
  async getConnection(userId: string): Promise<FacebookConnection | null> {
    try {
      const { data, error } = await supabase
        .from('facebook_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error getting Facebook connection:', error);
      return null;
    }
  },

  // Connect Facebook account
  async connect(userId: string, facebookProfile: FacebookProfile): Promise<{ success: boolean; message: string }> {
    try {
      // Check if Facebook account is already connected to another user
      const { data: existingConnection } = await supabase
        .from('facebook_connections')
        .select('user_id')
        .eq('facebook_id', facebookProfile.id)
        .eq('is_active', true)
        .single();

      if (existingConnection && existingConnection.user_id !== userId) {
        return {
          success: false,
          message: 'Tài khoản Facebook này đã được kết nối với tài khoản khác.'
        };
      }

      // Deactivate any existing connections for this user
      await supabase
        .from('facebook_connections')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Create new connection
      const { error } = await supabase
        .from('facebook_connections')
        .insert({
          user_id: userId,
          facebook_id: facebookProfile.id,
          facebook_name: facebookProfile.name,
          facebook_email: facebookProfile.email,
          facebook_avatar: facebookProfile.picture?.data?.url,
          connected_at: new Date().toISOString(),
          is_active: true,
        });

      if (error) {
        console.error('Error connecting Facebook:', error);
        return {
          success: false,
          message: 'Không thể kết nối Facebook. Vui lòng thử lại.'
        };
      }

      return {
        success: true,
        message: 'Đã kết nối Facebook thành công!'
      };
    } catch (error) {
      console.error('Error connecting Facebook:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra. Vui lòng thử lại.'
      };
    }
  },

  // Disconnect Facebook account
  async disconnect(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('facebook_connections')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) {
        console.error('Error disconnecting Facebook:', error);
        return {
          success: false,
          message: 'Không thể ngắt kết nối Facebook. Vui lòng thử lại.'
        };
      }

      return {
        success: true,
        message: 'Đã ngắt kết nối Facebook thành công!'
      };
    } catch (error) {
      console.error('Error disconnecting Facebook:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra. Vui lòng thử lại.'
      };
    }
  },

  // Mock Facebook login (since we can't implement real Facebook SDK here)
  async mockFacebookLogin(): Promise<{ success: boolean; profile?: FacebookProfile; message: string }> {
    try {
      // Simulate Facebook login delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock Facebook profile data
      const mockProfile: FacebookProfile = {
        id: `fb_${Date.now()}`,
        name: 'Người dùng Facebook',
        email: 'facebook.user@example.com',
        picture: {
          data: {
            url: 'https://via.placeholder.com/150'
          }
        }
      };

      return {
        success: true,
        profile: mockProfile,
        message: 'Đăng nhập Facebook thành công!'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Không thể đăng nhập Facebook. Vui lòng thử lại.'
      };
    }
  },

  // Get cached Facebook profile
  async getCachedProfile(): Promise<FacebookProfile | null> {
    try {
      const cached = await AsyncStorage.getItem('facebook_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached Facebook profile:', error);
      return null;
    }
  },

  // Cache Facebook profile
  async cacheProfile(profile: FacebookProfile): Promise<void> {
    try {
      await AsyncStorage.setItem('facebook_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Error caching Facebook profile:', error);
    }
  },

  // Clear cached Facebook profile
  async clearCachedProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem('facebook_profile');
    } catch (error) {
      console.error('Error clearing cached Facebook profile:', error);
    }
  },
};