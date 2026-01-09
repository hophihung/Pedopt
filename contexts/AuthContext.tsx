import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';
import { router } from 'expo-router';
import { getClientIPWithRetry } from '../src/utils/ipUtils';
import { Profile } from '../src/features/profile/types/profile.types';
import { SocialAuthService } from '../src/features/auth/services/social-auth.service';
import { OAuthHandlerService } from '../src/features/auth/services/oauth-handler.service';
import { GoogleAuthService } from '@/src/features/auth/services/google-auth.service';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  createProfile: (role: 'user' | 'seller') => Promise<'user' | 'seller'>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Load onboarding status
    const loadOnboardingStatus = async () => {
      try {
        const status = await AsyncStorage.getItem('onboarding_completed');
        setHasCompletedOnboarding(status === 'true');
      } catch (error) {}
    };

    loadOnboardingStatus();

    // Timeout fallback to prevent infinite loading
    const timeout = setTimeout(() => {setLoading(false);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      clearTimeout(timeout);setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setHasCompletedOnboarding(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
      
      // Background tasks - don't block UI
      if (data && data.role === 'seller') {
        // Run in background, don't await
        (async () => {
          try {
            await supabase.rpc('ensure_seller_has_subscription', {
              user_profile_id: userId
            });
          } catch (error) {
            // Ignore errors
          }
        })();
      }

      // Background social auth handling
      SocialAuthService.handleSocialPostLogin(userId).catch(() => {}); // Ignore errors
      
    } catch (error) {
      console.error('Profile fetch error:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Đăng nhập trước, không chờ IP check để tránh network timeout
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      // Background IP tracking - không block UI
      if (data?.session?.user) {
        // Chạy IP tracking trong background, không await
        getClientIPWithRetry().then(async (clientIP) => {
          if (clientIP) {
            try {
              // Kiểm tra IP ban trong background
              const { data: banCheck } = await supabase.rpc('check_ip_ban', {
                p_ip_address: clientIP,
              });

              if (banCheck?.banned) {
                console.warn('IP is banned:', banCheck.reason);
                // Có thể hiển thị warning hoặc sign out user
              } else {
                // Track IP sau khi đăng nhập thành công
                await supabase.rpc('track_user_ip', {
                  p_user_id: data.session.user.id,
                  p_ip_address: clientIP,
                });
              }
            } catch (trackError) {
              console.warn('IP tracking failed:', trackError);
            }
          }
        }).catch((ipError) => {
          console.warn('Background IP check failed:', ipError);
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    try {
      // Đăng ký tài khoản trước, không chờ IP check
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || null,
          },
        },
      });
      
      if (error) throw error;

      // Background IP tracking và validation - không block UI
      if (data?.user) {
        getClientIPWithRetry().then(async (clientIP) => {
          if (clientIP) {
            try {
              // Kiểm tra IP ban và limit trong background
              const [banCheck, limitCheck] = await Promise.all([
                supabase.rpc('check_ip_ban', { p_ip_address: clientIP }),
                supabase.rpc('check_ip_account_limit', { 
                  p_ip_address: clientIP, 
                  p_max_accounts: 3 
                })
              ]);

              if (banCheck.data?.banned) {
                console.warn('User registered from banned IP:', banCheck.data.reason);
              }

              if (limitCheck.data && (!limitCheck.data.success || limitCheck.data.banned)) {
                console.warn('IP account limit exceeded:', limitCheck.data.message);
              }

              // Track IP
              await supabase.rpc('track_user_ip', {
                p_user_id: data.user!.id,
                p_ip_address: clientIP,
              });
            } catch (trackError) {
              console.warn('Background IP tracking failed:', trackError);
            }
          }
        }).catch((ipError) => {
          console.warn('Background IP check failed:', ipError);
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      console.log('🔵 Starting Google OAuth...');
      await GoogleAuthService.signInWithGoogle();
      
      // Don't wait for profile fetch - let it happen in background
      // The auth state change will trigger profile fetch automatically
      
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    try {
      await OAuthHandlerService.signInWithFacebook();
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first
      setSession(null);
      setUser(null);
      setProfile(null);
      setHasCompletedOnboarding(false);
      
      // Clear AsyncStorage
      try {
        await AsyncStorage.removeItem('onboarding_completed');
      } catch (storageError) {}
      
      // Try to logout from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        // Check if it's a network/server error (502, 503, etc.)
        if (error.message?.includes('502') || 
            error.message?.includes('Bad Gateway') ||
            error.message?.includes('AuthRetryableFetchError')) {
          // Don't throw error - user is effectively logged out locally
        } else {
          // For other errors, still don't throw to prevent UI issues
        }
      }
      
      // Navigate to login screen
      router.replace('/auth/login' as any);
      
    } catch (error: any) {
      // Even if logout fails, clear local state and navigate
      setSession(null);
      setUser(null);
      setProfile(null);
      setHasCompletedOnboarding(false);
      
      try {
        await AsyncStorage.removeItem('onboarding_completed');
      } catch (storageError) {}
      
      router.replace('/auth/login' as any);
      
      // Don't throw error to prevent app crashes
    }
  };

  const createProfile = async (role: 'user' | 'seller') => {
    if (!user) throw new Error('No user found');

    // Kiểm tra xem profile đã tồn tại chưa
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      // Nếu đã có profile, chỉ cập nhật role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id);

      if (updateError) {throw updateError;
      }
    } else {
      // Nếu chưa có profile, tạo mới
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        role,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      });

      if (error) {
        throw error;
      }
    }

    // Nếu là seller, đảm bảo có subscription
    if (role === 'seller') {
      try {
        await supabase.rpc('ensure_seller_has_subscription', {
          user_profile_id: user.id
        });} catch (subscriptionError) {// Không throw error vì subscription có thể được tạo sau
      }
    }

    // Reset onboarding when creating new profile
    await AsyncStorage.setItem('onboarding_completed', 'false');
    setHasCompletedOnboarding(false);

    // Refresh profile để đảm bảo UI cập nhật
    await refreshProfile();
    
    // Return role để component có thể xử lý redirect
    return role;
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {}
  };

  const value = {
    session,
    user,
    profile,
    loading,
    hasCompletedOnboarding,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    createProfile,
    refreshProfile,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
