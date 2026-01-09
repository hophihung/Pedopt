import { Tabs } from 'expo-router';
import { Home, MessageCircle, PawPrint, User } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { Platform, View } from 'react-native';
import { OnboardingWrapper } from '@/src/components/OnboardingWrapper';
import { useDoubleTapNavigation } from '@/src/hooks/useDoubleTapNavigation';
import { usePetPreloader } from '@/src/features/pets/hooks/usePetPreloader';
import { usePetCacheInvalidation } from '@/src/features/pets/hooks/usePetCacheInvalidation';
import { useUnreadCount } from '@/src/features/chat/hooks/useUnreadCount';
import { NotificationBadge } from '@/src/components/NotificationBadge';
import { useEffect } from 'react';
import { Linking } from 'react-native';

export default function TabLayout() {
  const { handleTabPress } = useDoubleTapNavigation();
  const { totalUnreadCount } = useUnreadCount();
  
  // Preload pet data khi app khởi động
  usePetPreloader();
  
  // Auto invalidate cache khi cần thiết
  usePetCacheInvalidation();

  // Debug deep links for OAuth callback
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log('🔗 Deep link received:', url);
      
      if (url.startsWith('petadoption://auth/callback')) {
        console.log('✅ OAuth callback detected!');
        console.log('📋 Full callback URL:', url);
        
        try {
          // Parse URL parameters
          const urlObj = new URL(url);
          const hash = urlObj.hash.substring(1);
          const search = urlObj.search.substring(1);
          
          console.log('🔍 URL Hash:', hash);
          console.log('🔍 URL Search:', search);
          
          if (hash) {
            const params = new URLSearchParams(hash);
            console.log('🔍 Hash parameters:');
            for (const [key, value] of params.entries()) {
              console.log(`  ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
            }
          }
          
          if (search) {
            const params = new URLSearchParams(search);
            console.log('🔍 Search parameters:');
            for (const [key, value] of params.entries()) {
              console.log(`  ${key}: ${value}`);
            }
          }
        } catch (error) {
          console.error('💥 Error parsing callback URL:', error);
        }
      }
    };

    // Listen for initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🚀 App opened with URL:', url);
        handleDeepLink(url);
      }
    });

    // Listen for URL changes (app already open)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription?.remove();
  }, []);

  return (
    <OnboardingWrapper>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FF6B6B',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            height: Platform.OS === 'ios' ? 75 : 65,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
            paddingTop: 10,
            paddingHorizontal: 24,
            marginHorizontal: 24,
            marginBottom: Platform.OS === 'ios' ? 60 : 50,
            borderRadius: 32,
            borderTopWidth: 0,
            position: 'absolute',
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            borderWidth: 0,
          },
          tabBarIconStyle: {
            marginTop: 0,
          },
        }}
      >
        {/* Trang chủ - hub dẫn tới các tính năng chính */}
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({ color }) => <Home size={28} color={color} strokeWidth={2.2} />,
          }}
          listeners={{
            tabPress: (e) => handleTabPress(e, 'discover'),
          }}
        />

        {/* Tìm thú cưng */}
        <Tabs.Screen
          name="pets"
          options={{
            title: 'Tìm thú cưng',
            tabBarIcon: ({ color }) => <PawPrint size={28} color={color} strokeWidth={2.2} />,
          }}
          listeners={{
            tabPress: (e) => handleTabPress(e, 'pets'),
          }}
        />

        {/* Tin nhắn */}
        <Tabs.Screen
          name="social"
          options={{
            title: 'Tin nhắn',
            tabBarIcon: ({ color }) => (
              <View style={{ position: 'relative' }}>
                <MessageCircle size={28} color={color} strokeWidth={2.2} />
                {totalUnreadCount > 0 && (
                  <NotificationBadge
                    count={totalUnreadCount}
                    size="small"
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                    }}
                  />
                )}
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => handleTabPress(e, 'social'),
          }}
        />

        {/* Tài khoản */}
        <Tabs.Screen
          name="me"
          options={{
            title: 'Tài khoản',
            tabBarIcon: ({ color }) => <User size={28} color={color} strokeWidth={2.2} />,
          }}
          listeners={{
            tabPress: (e) => handleTabPress(e, 'me'),
          }}
        />
      </Tabs>
    </OnboardingWrapper>
  );
}
