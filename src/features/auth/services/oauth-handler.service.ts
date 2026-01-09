import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export const OAuthHandlerService = {
  // Enhanced Facebook OAuth with better error handling
  async signInWithFacebook(): Promise<void> {
    try {// Complete any pending auth sessions
      WebBrowser.maybeCompleteAuthSession();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: 'petadoption://auth/callback',
          scopes: 'public_profile', // Chỉ request public_profile, không request email
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });if (error) {throw new Error(`Facebook login failed: ${error.message}`);
      }

      if (data?.url) {// Open the OAuth URL with Facebook scheme as fallback
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'petadoption://auth/callback',
          {
            showInRecents: true,
          }
        );if (result.type === 'success' && result.url) {
          // Handle the callback URL
          await this.handleOAuthCallback(result.url);
        } else if (result.type === 'cancel') {
          throw new Error('Facebook login was cancelled');
        } else {
          throw new Error('Facebook login failed - please try again');
        }
      } else {
        throw new Error('No OAuth URL received from Supabase');
      }
    } catch (error) {throw error;
    }
  },

  // Enhanced Google OAuth with better error handling
  async signInWithGoogle(): Promise<void> {
    try {WebBrowser.maybeCompleteAuthSession();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'petadoption://auth/callback',
          scopes: 'openid email profile', // Specify required scopes
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Allow user to select account
          },
        },
      });if (error) {throw new Error(`Google login failed: ${error.message}`);
      }

      if (data?.url) {const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'petadoption://auth/callback',
          {
            showInRecents: true,
          }
        );if (result.type === 'success' && result.url) {
          await this.handleOAuthCallback(result.url);
        } else if (result.type === 'cancel') {
          throw new Error('Google login was cancelled');
        } else {
          throw new Error('Google login failed - please try again');
        }
      } else {
        throw new Error('No OAuth URL received from Supabase');
      }
    } catch (error) {throw error;
    }
  },

  // Handle OAuth callback URL
  async handleOAuthCallback(url: string): Promise<void> {
    try {// Parse the URL to extract tokens
      const parsed = Linking.parse(url);// Extract access_token and refresh_token from URL fragments or query params
      let urlParams: URLSearchParams;
      
      // Try URL fragment first (most common for OAuth)
      if (url.includes('#')) {
        urlParams = new URLSearchParams(url.split('#')[1]);
      } else if (url.includes('?')) {
        urlParams = new URLSearchParams(url.split('?')[1]);
      } else {
        throw new Error('No parameters found in callback URL');
      }

      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');if (error) {
        throw new Error(errorDescription || error);
      }

      if (accessToken) {
        // Set the session with the tokens
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });if (sessionError) {
          throw sessionError;
        }

        if (data?.session) {// Don't navigate here - let AuthContext handle it
          return;
        } else {
          throw new Error('No session created after OAuth');
        }
      } else {
        throw new Error('No access token found in callback URL');
      }
    } catch (error) {throw error;
    }
  },

  // Check if OAuth is properly configured
  async checkOAuthConfiguration(): Promise<{ facebook: boolean; google: boolean }> {
    try {
      // Try to get OAuth URLs to check if providers are configured
      const facebookResult = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: 'test://callback' },
      });

      const googleResult = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'test://callback' },
      });

      return {
        facebook: !facebookResult.error,
        google: !googleResult.error,
      };
    } catch (error) {return { facebook: false, google: false };
    }
  },
};