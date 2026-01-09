import React, { useRef } from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface DoubleTapTabBarProps {
  children: React.ReactNode;
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
}

export function DoubleTapTabBar({ children, routeName, isFocused, onPress }: DoubleTapTabBarProps) {
  const router = useRouter();
  const lastTapTime = useRef<{ [key: string]: number }>({});
  const DOUBLE_TAP_DELAY = 400;

  const handlePress = () => {
    const currentTime = Date.now();
    const lastTap = lastTapTime.current[routeName] || 0;
    const timeDiff = currentTime - lastTap;

    if (isFocused && timeDiff < DOUBLE_TAP_DELAY) {
      // Double tap detected - go back
      console.log(`🔄 Double tap detected on ${routeName} - going back`);
      
      // Haptic feedback for double tap
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (router.canGoBack()) {
        router.back();
      }
    } else {
      // Single tap - normal navigation
      if (!isFocused) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }

    // Update last tap time
    lastTapTime.current[routeName] = currentTime;
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}