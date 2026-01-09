import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabaseClient';
import * as Linking from 'expo-linking';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      console.log('🔵 Auth callback received with params:', params);
      console.log('🔵 Full URL:', Linking.createURL('/auth/callback'));

      // Wait a bit for the OAuth flow to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the current session after OAuth redirect
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('🔵 Session after OAuth:', session);
      console.log('🔵 Session error:', error);

      if (error) {
        console.error('❌ Auth callback error:', error);
        router.replace('/(auth)/login');
        return;
      }

      if (session?.user) {
        console.log('✅ OAuth login successful');
        console.log('🔵 User:', session.user.email, session.user.user_metadata);
        
        // Check if user has profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        console.log('🔵 User profile:', profile);

        if (profile?.role) {
          // User has profile, go to main app
          router.replace('/(tabs)/discover/match');
        } else {
          // New user, go to onboarding
          router.replace('/onboarding/role-selection');
        }
      } else {
        console.warn('⚠️ No session found after OAuth, trying again...');
        
        // Try one more time after a longer wait
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        
        if (retrySession?.user) {
          console.log('✅ OAuth login successful on retry');
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', retrySession.user.id)
            .maybeSingle();

          if (profile?.role) {
            router.replace('/(tabs)/discover/match');
          } else {
            router.replace('/onboarding/role-selection');
          }
        } else {
          console.warn('⚠️ Still no session found, redirecting to login');
          router.replace('/(auth)/login');
        }
      }
    } catch (error) {
      console.error('💥 Auth callback error:', error);
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6B6B" />
      <Text style={styles.text}>Đang xử lý đăng nhập Facebook...</Text>
      <Text style={styles.subText}>Vui lòng đợi một chút...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    gap: 16,
  },
  text: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
    textAlign: 'center',
  },
});