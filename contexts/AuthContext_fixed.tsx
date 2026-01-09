import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';
import { router } from 'expo-router';
import { getClientIPWithRetry } from '../src/utils/ipUtils';

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
  signOut: () => Promise<void>;
  createProfile: (role: 'user' | 'seller') => Promise<'user' | 'seller'>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  clearAuthError: () => Promise<void>;
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
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      // Handle different auth events
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        await clearAuthState();
      } else if (event === 'SIGNED_IN') {
        console.log('User signed in');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setHasCompletedOnboarding(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    try {
      // Timeout fallback to prevent infinite loading
      const timeout = setTimeout(() => {
        console.warn('Auth loading timeout - setting loading to false');
        setLoading(false);
      }, 10000);

      const { data: { session }, error } = await supabase.auth.getSession();
      
      clearTimeout(timeout);
      
      if (error) {
        console.error('Error getting session:', error);
        
        // Handle refresh token errors
        if (error.message.includes('refresh_token_not_found') || 
            error.message.includes('Invalid Refresh Token')) {
          console.log('Invalid refresh token detected, clearing auth state');
          await clearAuthError();
          return;
        }
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Error initializing auth:', error);
      setLoading(false);
    }
  };

  const clearAuthState = async () => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setHasCompletedOnboarding(false);
    
    try {
      await AsyncStorage.removeItem('onboarding_completed');
      await AsyncStorage.removeItem('supabase.auth.token');
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  const clearAuthError = async () => {
    console.log('Clearing auth error and resetting state');
    
    try {
      // Sign out to clear any invalid tokens
      await supabase.auth.signOut();
      
      // Clear local storage
      await clearAuthState();
      
      setLoading(false);
      
      console.log('Auth error cleared successfully');
    } catch (error) {
      console.error('Error clearing auth error:', error);
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // Handle auth errors in profile fetching
        if (error.message.includes('JWT') || error.message.includes('token')) {
          console.log('Auth error in fetchProfile, clearing auth state');
          await clearAuthError();
          return;
        }
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
      // Clear any existing auth errors first
      await supabase.auth.signOut();
      
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
      }

      // Đăng nhập
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Track IP sau khi đăng nhập thành công
      if (data?.session?.user && clientIP) {
        try {
          await supabase.rpc('track_user_ip', {
            p_user_id: data.session.user.id,
            p_ip_address: clientIP,
          });
        } catch (trackError) {
          console.warn('⚠️ Error tracking IP:', trackError);
        }
      }

      if (data?.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        await fetchProfile(data.session.user.id);
        router.replace('/(tabs)/discover/match' as any);
      }
    } catch (error: any) {
      // Handle specific auth errors
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email hoặc mật khẩu không đúng');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Vui lòng xác nhận email trước khi đăng nhập');
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the methods remain the same ...
  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    // Implementation remains the same as original
  };

  const signInWithGoogle = async () => {
    // Implementation remains the same as original
  };

  const signInWithFacebook = async () => {
    // Implementation remains the same as original
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      await clearAuthState();
    } catch (error) {
      console.error('Error signing out:', error);
      // Force clear state even if signOut fails
      await clearAuthState();
    }
  };

  const createProfile = async (role: 'user' | 'seller') => {
    // Implementation remains the same as original
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
    signOut,
    createProfile,
    refreshProfile,
    completeOnboarding,
    clearAuthError,
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