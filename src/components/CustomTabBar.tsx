import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Home, MessageCircle, PawPrint, User } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Refs để track thời gian tap
  const lastTapTime = useRef<{ [key: string]: number }>({});
  const scaleAnimations = useRef<{ [key: string]: Animated.Value }>({});
  const DOUBLE_TAP_DELAY = 400; // 400ms để dễ double tap hơn

  // Initialize scale animations
  state.routes.forEach((route: any) => {
    if (!scaleAnimations.current[route.name]) {
      scaleAnimations.current[route.name] = new Animated.Value(1);
    }
  });

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? '#FF6B6B' : '#9CA3AF';
    const size = 28;
    const strokeWidth = 2.2;

    switch (routeName) {
      case 'discover':
        return <Home size={size} color={color} strokeWidth={strokeWidth} />;
      case 'pets':
        return <PawPrint size={size} color={color} strokeWidth={strokeWidth} />;
      case 'social':
        return <MessageCircle size={size} color={color} strokeWidth={strokeWidth} />;
      case 'me':
        return <User size={size} color={color} strokeWidth={strokeWidth} />;
      default:
        return <Home size={size} color={color} strokeWidth={strokeWidth} />;
    }
  };

  const animateTab = (routeName: string) => {
    const animation = scaleAnimations.current[routeName];
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTabPress = (routeName: string, isFocused: boolean) => {
    const currentTime = Date.now();
    const lastTap = lastTapTime.current[routeName] || 0;
    const timeDiff = currentTime - lastTap;

    // Animate tab press
    animateTab(routeName);

    if (isFocused && timeDiff < DOUBLE_TAP_DELAY) {
      // Double tap detected - go back
      console.log(`🔄 Double tap detected on ${routeName} - going back`);
      
      // Haptic feedback for double tap
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (router.canGoBack()) {
        router.back();
      }
    } else {
      // Single tap - navigate to tab
      if (!isFocused) {
        // Haptic feedback for tab switch
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate(routeName);
      } else {
        // Light haptic for tap on current tab
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    // Update last tap time
    lastTapTime.current[routeName] = currentTime;
  };

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const scaleAnimation = scaleAnimations.current[route.name];

        return (
          <Animated.View
            key={route.key}
            style={[
              styles.tabItemContainer,
              { transform: [{ scale: scaleAnimation }] }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tabItem,
                isFocused && styles.tabItemFocused,
              ]}
              onPress={() => handleTabPress(route.name, isFocused)}
              activeOpacity={0.7}
            >
              {getTabIcon(route.name, isFocused)}
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
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
    justifyContent: 'space-around', // Đảm bảo các tab được phân bố đều
    alignItems: 'center',
  },
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // Bỏ flex: 1 để không bị stretch
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 48,
    minHeight: 48,
  },
  tabItemFocused: {
    backgroundColor: '#FFF0F0',
  },
});