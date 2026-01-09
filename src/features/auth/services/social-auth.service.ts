import { supabase } from '@/lib/supabase';
import { FacebookService } from '@/src/features/social/services/facebook.service';

export const SocialAuthService = {
  // Handle post-login Facebook connection
  async handleFacebookPostLogin(userId: string): Promise<void> {
    try {
      // Check if user logged in via Facebook OAuth
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) return;

      // Check if user has Facebook provider
      const facebookIdentity = user.user.identities?.find(
        identity => identity.provider === 'facebook'
      );

      if (!facebookIdentity) return;

      // Check if Facebook connection already exists
      const isConnected = await FacebookService.isConnected(userId);
      if (isConnected) return;

      // Extract Facebook profile data from user metadata
      const facebookProfile = {
        id: facebookIdentity.id,
        name: user.user.user_metadata?.full_name || 
              user.user.user_metadata?.name || 
              'Facebook User',
        email: user.user.email,
        picture: user.user.user_metadata?.avatar_url ? {
          data: {
            url: user.user.user_metadata.avatar_url
          }
        } : undefined,
      };

      // Auto-connect Facebook account
      const result = await FacebookService.connect(userId, facebookProfile);
      
      if (result.success) {
        console.log('✅ Auto-connected Facebook account after OAuth login');
      } else {
        console.warn('⚠️ Failed to auto-connect Facebook:', result.message);
      }
    } catch (error) {
      console.error('Error handling Facebook post-login:', error);
      // Don't throw error - this is a background operation
    }
  },

  // Handle post-login Google connection (future feature)
  async handleGooglePostLogin(userId: string): Promise<void> {
    try {
      // Similar implementation for Google
      console.log('Google post-login handling not implemented yet');
    } catch (error) {
      console.error('Error handling Google post-login:', error);
    }
  },

  // Handle any social provider post-login
  async handleSocialPostLogin(userId: string): Promise<void> {
    try {
      await Promise.all([
        this.handleFacebookPostLogin(userId),
        this.handleGooglePostLogin(userId),
      ]);
    } catch (error) {
      console.error('Error handling social post-login:', error);
    }
  },
};