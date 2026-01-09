import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface CacheStatusIndicatorProps {
  isLoadingFromCache: boolean;
  isLoading: boolean;
  hasData: boolean;
  cacheAge?: number | null; // in minutes
}

export function CacheStatusIndicator({ 
  isLoadingFromCache, 
  isLoading, 
  hasData,
  cacheAge 
}: CacheStatusIndicatorProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isLoadingFromCache) {
      setShowSuccess(false);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (!isLoading && hasData) {
      // Show success briefly
      setShowSuccess(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Hide after 2 seconds
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowSuccess(false));
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoadingFromCache, isLoading, hasData, opacity]);

  if (!isLoadingFromCache && !showSuccess) {
    return null;
  }

  const getCacheStatusText = () => {
    if (isLoadingFromCache) {
      if (cacheAge !== null && cacheAge !== undefined) {
        if (cacheAge < 5) {
          return '⚡ Tải từ bộ nhớ đệm (mới)';
        } else if (cacheAge < 30) {
          return '📦 Tải từ bộ nhớ đệm';
        } else {
          return '🔄 Tải từ bộ nhớ đệm (đang cập nhật)';
        }
      }
      return '⚡ Tải từ bộ nhớ đệm';
    }
    
    if (showSuccess) {
      return '✅ Dữ liệu đã sẵn sàng';
    }
    
    return '';
  };

  const getIndicatorStyle = () => {
    if (isLoadingFromCache) {
      if (cacheAge !== null && cacheAge !== undefined && cacheAge >= 30) {
        return styles.cacheRefreshingIndicator;
      }
      return styles.cacheIndicator;
    }
    
    if (showSuccess) {
      return styles.cacheSuccessIndicator;
    }
    
    return styles.cacheIndicator;
  };

  const getTextStyle = () => {
    if (isLoadingFromCache) {
      if (cacheAge !== null && cacheAge !== undefined && cacheAge >= 30) {
        return styles.cacheRefreshingText;
      }
      return styles.cacheIndicatorText;
    }
    
    if (showSuccess) {
      return styles.cacheSuccessText;
    }
    
    return styles.cacheIndicatorText;
  };

  return (
    <Animated.View style={[getIndicatorStyle(), { opacity }]}>
      <Text style={getTextStyle()}>
        {getCacheStatusText()}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cacheIndicator: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  cacheIndicatorText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '500',
  },
  cacheRefreshingIndicator: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  cacheRefreshingText: {
    fontSize: 13,
    color: '#F57C00',
    fontWeight: '500',
  },
  cacheSuccessIndicator: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cacheSuccessText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
});