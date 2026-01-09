import { Tabs } from 'expo-router';
// Temporarily using Expo vector icons instead of Lucide to fix view registry error
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

export default function DiscoverTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          display: 'none', // Ẩn tab bar - chỉ hiển thị header tabs
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="match"
        options={{
          href: null, // Ẩn khỏi tab bar - di chuyển lên header
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Ẩn khỏi tab bar - di chuyển lên header
        }}
      />
      <Tabs.Screen
        name="reel"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
    </Tabs>
  );
}

