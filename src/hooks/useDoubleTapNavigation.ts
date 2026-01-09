import { useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';

export function useDoubleTapNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const lastTapTime = useRef<{ [key: string]: number }>({});
  const DOUBLE_TAP_DELAY = 400;

  const handleTabPress = (e: any, routeName: string) => {
    const currentTime = Date.now();
    const lastTap = lastTapTime.current[routeName] || 0;
    const timeDiff = currentTime - lastTap;

    // Check if this tab is currently focused
    const isCurrentTab = pathname.includes(routeName);

    if (isCurrentTab && timeDiff < DOUBLE_TAP_DELAY) {
      // Double tap detected - prevent default navigation and go back
      e.preventDefault();
      
      console.log(`🔄 Double tap detected on ${routeName} - going back`);
      
      // Haptic feedback for double tap
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (router.canGoBack()) {
        router.back();
      }
    } else {
      // Single tap - allow normal navigation
      if (!isCurrentTab) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        // Light haptic for tap on current tab
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    // Update last tap time
    lastTapTime.current[routeName] = currentTime;
  };

  return { handleTabPress };
}