import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Facebook } from 'lucide-react-native';

interface FacebookLoginButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export function FacebookLoginButton({
  onPress,
  disabled = false,
  loading = false,
  style,
}: FacebookLoginButtonProps) {
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
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Facebook size={20} color="#FFFFFF" strokeWidth={2} />
        )}
        <Text style={styles.text}>
          {loading ? 'Đang kết nối...' : 'Tiếp tục với Facebook'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1877F2',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});