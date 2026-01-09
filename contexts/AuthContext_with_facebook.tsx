import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';
import { router } from 'expo-router';
import { getClientIPWithRetry } from '../src/utils/ipUtils';
import * as Facebook from 'expo-facebook';

interface Profile {
  id: string;
  role: 'user' | 'seller';
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

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
  signInWithFacebookNative: () => Promise<void>;
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
      } catch (error) {
        console.error('Error loading onboarding status:', error);
      }
    };

    loadOnboardingStatus();

    // Timeout fallback to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('Auth loading timeout - setting loading to false');
      setLoading(false);
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
      clearTimeout(timeout);
      console.error('Error getting session:', error);
      setLoading(false);
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
      
      // Nếu là seller và chưa có subscription, đảm bảo tạo free subscription
      if (data && data.role === 'seller') {
        try {
          await supabase.rpc('ensure_seller_has_subscription', {
            user_profile_id: userId
          });
        } catch (subscriptionError) {
          console.error('Error ensuring seller subscription:', subscriptionError);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
      // Lấy IP address
      const clientIP = await getClientIPWithRetry();
      
      if (clientIP) {
        // Kiểm tra IP có bị ban không
        const { data: banCheck, error: banError } = await supabase.rpc('check_ip_ban', {
          p_ip_address: clientIP,
        });

        if (banError) {
          console.warn('⚠️ Error checking IP ban:', banError);
        } else if (banCheck?.banned) {
          const errorMessage = banCheck.reason || 'IP address của bạn đã bị ban';
          throw new Error(errorMessage);
        }

        // Đăng nhập
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Nếu muốn phản hồi UI ngay khi đăng nhập thành công:
        if (data?.session?.user) {
          // Track IP sau khi đăng nhập thành công
          if (clientIP) {
            try {
              await supabase.rpc('track_user_ip', {
                p_user_id: data.session.user.id,
                p_ip_address: clientIP,
              });
            } catch (trackError) {
              console.warn('⚠️ Error tracking IP:', trackError);
            }
          }

          setSession(data.session);
          setUser(data.session.user);
          await fetchProfile(data.session.user.id);
          router.replace('/(tabs)/discover/match' as any);
        }
      } else {
        // Nếu không lấy được IP, vẫn cho phép đăng nhập nhưng không track
        console.warn('⚠️ Could not get client IP, proceeding without IP check');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.session?.user) {
          setSession(data.session);
          setUser(data.session.user);
          await fetchProfile(data.session.user.id);
          router.replace('/(tabs)/discover/match' as any);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    // Lấy IP address trước khi đăng ký
    const clientIP = await getClientIPWithRetry();
    
    if (clientIP) {
      // Kiểm tra IP có bị ban không
      const { data: banCheck, error: banError } = await supabase.rpc('check_ip_ban', {
        p_ip_address: clientIP,
      });

      if (banError) {
        console.warn('⚠️ Error checking IP ban:', banError);
      } else if (banCheck?.banned) {
        const errorMessage = banCheck.reason || 'IP address của bạn đã bị ban. Không thể đăng ký tài khoản mới.';
        throw new Error(errorMessage);
      }

      // Kiểm tra số lượng tài khoản từ IP này
      const { data: limitCheck, error: limitError } = await supabase.rpc('check_ip_account_limit', {
        p_ip_address: clientIP,
        p_max_accounts: 3, // Giới hạn 3 tài khoản mỗi IP
      });

      if (limitError) {
        console.warn('⚠️ Error checking IP account limit:', limitError);
      } else if (limitCheck?.banned || !limitCheck?.success) {
        const errorMessage = limitCheck?.message || 'IP address đã đăng ký quá nhiều tài khoản. Không thể đăng ký thêm.';
        throw new Error(errorMessage);
      }
    }

    // Đăng ký tài khoản với metadata full_name nếu có
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

    // Track IP sau khi đăng ký thành công
    if (clientIP && data?.user) {
      try {
        await supabase.rpc('track_user_ip', {
          p_user_id: data.user.id,
          p_ip_address: clientIP,
        });

        // Kiểm tra lại sau khi track để tự động ban nếu vượt quá
        await supabase.rpc('check_ip_account_limit', {
          p_ip_address: clientIP,
          p_max_accounts: 3,
        });
      } catch (trackError) {
        console.warn('⚠️ Error tracking IP:', trackError);
      }
    }
  };

  const signInWithGoogle = async () => {
    console.log('🔵 Starting Google OAuth...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'petadoption://auth/callback',
      },
    });
    console.log('🔵 OAuth Data:', data);
    if (error) {
      console.error('🔴 Google OAuth Error:', error);
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    console.log('🔵 Starting Facebook OAuth (Supabase)...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: 'petadoption://auth/callback',
      },
    });
    console.log('🔵 OAuth Data:', data);
    if (error) {
      console.error('🔴 Facebook OAuth Error:', error);
      throw error;
    }
  };

  const signInWithFacebookNative = async () => {
    try {
      console.log('🔵 Starting Facebook Native Login...');
      
      // Initialize Facebook SDK
      await Facebook.initializeAsync({
        appId: 'YOUR_FACEBOOK_APP_ID', // Replace with your actual App ID
      });
      
      // Request Facebook login
      const result = await Facebook.logInWithReadPermissionsAsync({
        permissions: ['public_profile', 'email'],
      });
      
      console.log('🔵 Facebook Login Result:', result);
      
      if (result.type === 'success') {
        // Sign in to Supabase with Facebook token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'facebook',
          token: result.token,
        });
        
        if (error) {
          console.error('🔴 Supabase Facebook Error:', error);
          throw error;
        }
        
        console.log('✅ Facebook login successful:', data);
        
        if (data?.session?.user) {
          setSession(data.session);
          setUser(data.session.user);
          await fetchProfile(data.session.user.id);
          router.replace('/(tabs)/discover/match' as any);
        }
      } else if (result.type === 'cancel') {
        throw new Error('Facebook login was cancelled');
      } else {
        throw new Error('Facebook login failed');
      }
    } catch (error: any) {
      console.error('🔴 Facebook Native Login Error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const createProfile = async (role: 'user' | 'seller') => {
    if (!user) throw new Error('No user found');

    console.log('🔵 Creating profile with role:', role);

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

      if (updateError) {
        console.error('🔴 Error updating profile:', updateError);
        throw updateError;
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
        console.error('🔴 Error creating profile:', error);
        throw error;
      }
    }

    console.log('🔵 Profile created/updated successfully');

    // Nếu là seller, đảm bảo có subscription
    if (role === 'seller') {
      try {
        await supabase.rpc('ensure_seller_has_subscription', {
          user_profile_id: user.id
        });
        console.log('✅ Seller subscription ensured');
      } catch (subscriptionError) {
        console.warn('⚠️ Error ensuring seller subscription:', subscriptionError);
      }
    }

    // Reset onboarding when creating new profile
    await AsyncStorage.setItem('onboarding_completed', 'false');
    setHasCompletedOnboarding(false);

    // Refresh profile để đảm bảo UI cập nhật
    await refreshProfile();
    
    console.log('🔵 Returning role:', role);
    return role;
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
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
    signInWithFacebookNative,
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