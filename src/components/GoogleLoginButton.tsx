import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';

interface GoogleLoginButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export function GoogleLoginButton({
  onPress,
  disabled = false,
  loading = false,
  style,
}: GoogleLoginButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = async () => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    try {
      await onPress();
    } finally {
      setIsPressed(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        isPressed && styles.buttonPressed,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color="#1F2937" />
        ) : (
          <Text style={styles.googleIcon}>G</Text>
        )}
        <Text style={styles.text}>
          {loading ? 'Đang kết nối...' : 'Tiếp tục với Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#F9FAFB',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  text: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});