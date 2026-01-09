import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';

export function useDoubleTapNavigationSimple() {
  const router = useRouter();
  const pathname = usePathname();
  const lastTapTime = useRef<number>(0);
  const DOUBLE_TAP_DELAY = 400;

  useEffect(() => {
    // Listen for tab bar taps globally
    const handleGlobalTap = () => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTapTime.current;

      if (timeDiff < DOUBLE_TAP_DELAY) {
        // Double tap detected
        console.log('🔄 Double tap detected - going back');
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        if (router.canGoBack()) {
          router.back();
        }
      }

      lastTapTime.current = currentTime;
    };

    // This is a simple approach - you would need to manually call this
    // from tab press events or use a different method
    
    return () => {
      // Cleanup if needed
    };
  }, [router]);

  const handleTabPress = () => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastTapTime.current;

    if (timeDiff < DOUBLE_TAP_DELAY) {
      // Double tap
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (router.canGoBack()) {
        router.back();
        return true; // Indicate that we handled the double tap
      }
    } else {
      // Single tap
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    lastTapTime.current = currentTime;
    return false; // Allow normal navigation
  };

  return { handleTabPress };
}