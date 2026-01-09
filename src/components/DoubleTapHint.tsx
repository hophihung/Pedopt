import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X } from 'lucide-react-native';

const HINT_STORAGE_KEY = 'double_tap_hint_shown';

export function DoubleTapHint() {
  const [visible, setVisible] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    checkShouldShowHint();
  }, []);

  const checkShouldShowHint = async () => {
    try {
      const hintShown = await AsyncStorage.getItem(HINT_STORAGE_KEY);
      if (!hintShown) {
        // Delay để không hiện ngay khi app load
        setTimeout(() => {
          setVisible(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking hint status:', error);
    }
  };

  const hideHint = async () => {
    try {
      await AsyncStorage.setItem(HINT_STORAGE_KEY, 'true');
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    } catch (error) {
      console.error('Error saving hint status:', error);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.hint}>
        <TouchableOpacity style={styles.closeButton} onPress={hideHint}>
          <X size={20} color="#666" />
        </TouchableOpacity>
        
        <Text style={styles.title}>💡 Mẹo nhỏ</Text>
        <Text style={styles.description}>
          Nhấn đúp vào tab đang active để quay lại trang trước
        </Text>
        
        <TouchableOpacity style={styles.gotItButton} onPress={hideHint}>
          <Text style={styles.gotItText}>Đã hiểu</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  hint: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE4E1',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
    marginRight: 30,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  gotItButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  gotItText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});