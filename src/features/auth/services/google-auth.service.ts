import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

// Complete auth session for better UX
WebBrowser.maybeCompleteAuthSession();

export const GoogleAuthService = {
  // Native Google OAuth using expo-auth-session
  async signInWithGoogleNative(): Promise<void> {
    try {
      console.log('🔵 Starting Native Google OAuth...');

      // Create auth request
      const request = new AuthSession.AuthRequest({
        clientId: 'YOUR_GOOGLE_CLIENT_ID', // Will be replaced by actual client ID
        scopes: ['openid', 'profile', 'email'],
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'petadoption',
          path: 'auth/callback',
        }),
        responseType: AuthSession.ResponseType.Code,
        additionalParameters: {},
        extraParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      });

      console.log('🔵 Auth request created:', {
        clientId: request.clientId,
        redirectUri: request.redirectUri,
        scopes: request.scopes,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        showInRecents: true,
      });

      console.log('🔵 Auth result:', result);

      if (result.type === 'success') {
        const { code } = result.params;
        
        if (code) {
          // Exchange code for tokens via Supabase
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            throw error;
          }
          
          console.log('✅ Google OAuth successful:', data);
          return;
        } else {
          throw new Error('No authorization code received');
        }
      } else if (result.type === 'cancel') {
        throw new Error('Google login was cancelled');
      } else {
        throw new Error('Google login failed');
      }
    } catch (error) {
      console.error('💥 Native Google OAuth error:', error);
      throw error;
    }
  },

  // Fallback to Supabase OAuth (current implementation)
  async signInWithGoogleSupabase(): Promise<void> {
    try {
      console.log('🔵 Starting Supabase Google OAuth...');

      // Determine redirect URL based on environment
      const redirectUrl = __DEV__ 
        ? 'exp://192.168.1.52:8081'  // Development
        : 'petadoption://auth/callback'; // Production
      
      console.log('🔍 Using redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          scopes: 'openid email profile', // Minimal scopes for speed
          queryParams: {
            prompt: 'select_account', // Remove access_type for speed
          },
        },
      });

      if (error) {
        console.error('💥 Supabase OAuth error:', error);
        throw new Error(`Google login failed: ${error.message}`);
      }

      if (data?.url) {
        console.log('🔵 Opening OAuth URL...');
        
        // Add timeout for WebBrowser
        const BROWSER_TIMEOUT = 30000; // 30 seconds
        
        const browserPromise = WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl, // Use the same redirect URL
          {
            showInRecents: true,
          }
        );
        
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Browser timeout')), BROWSER_TIMEOUT)
        );
        
        const result = await Promise.race([browserPromise, timeoutPromise]);

        console.log('🔵 OAuth result type:', result.type);

        if (result.type === 'success' && result.url) {
          console.log('🔵 OAuth success, handling callback...');
          // Handle callback URL
          await this.handleOAuthCallback(result.url);
        } else if (result.type === 'cancel') {
          throw new Error('Google login was cancelled');
        } else {
          throw new Error('Google login failed');
        }
      } else {
        throw new Error('No OAuth URL received from Supabase');
      }
    } catch (error) {
      console.error('💥 Supabase Google OAuth error:', error);
      throw error;
    }
  },

  // Handle OAuth callback
  async handleOAuthCallback(url: string): Promise<void> {
    try {
      console.log('🔵 Handling Google OAuth callback:', url);

      let urlParams: URLSearchParams;
      
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
      const errorDescription = urlParams.get('error_description');

      console.log('🔍 Callback params:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        error,
        errorDescription
      });

      if (error) {
        throw new Error(errorDescription || error);
      }

      if (accessToken) {
        console.log('🔵 Setting session with tokens...');
        
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        console.log('🔍 Session result:', {
          hasSession: !!data?.session,
          hasUser: !!data?.user,
          error: sessionError
        });

        if (sessionError) {
          console.error('💥 Session creation error:', sessionError);
          throw sessionError;
        }

        if (data?.session) {
          console.log('✅ Google OAuth login successful');
          return;
        } else {
          throw new Error('No session created after OAuth');
        }
      } else {
        throw new Error('No access token found in callback URL');
      }
    } catch (error) {
      console.error('💥 Google OAuth callback error:', error);
      throw error;
    }
  },

  // Main Google sign-in method (uses Supabase OAuth - more reliable)
  async signInWithGoogle(): Promise<void> {
    try {
      console.log('🔵 Starting Google OAuth via Supabase...');
      await this.signInWithGoogleSupabase();
    } catch (error) {
      console.error('💥 Google OAuth failed:', error);
      
      // Provide helpful error messages for common issues
      if (error.message?.includes('redirect_uri_mismatch')) {
        throw new Error('Lỗi cấu hình Google OAuth. Vui lòng kiểm tra Redirect URIs trong Google Console.');
      } else if (error.message?.includes('invalid_client')) {
        throw new Error('Google Client ID hoặc Secret không đúng. Vui lòng kiểm tra cấu hình Supabase.');
      } else if (error.message?.includes('access_denied')) {
        throw new Error('Đăng nhập Google bị từ chối hoặc hủy bỏ.');
      } else {
        throw new Error(`Lỗi đăng nhập Google: ${error.message}`);
      }
    }
  },
};