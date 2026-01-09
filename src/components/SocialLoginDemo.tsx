import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { FacebookLoginButton } from './FacebookLoginButton';
import { GoogleLoginButton } from './GoogleLoginButton';

/**
 * Demo component để test Social Login buttons
 * Có thể sử dụng trong development để test UI/UX
 */
export function SocialLoginDemo() {
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleFacebookLogin = async () => {
    setFacebookLoading(true);
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    Alert.alert('Facebook Login', 'Demo Facebook login completed!');
    setFacebookLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    Alert.alert('Google Login', 'Demo Google login completed!');
    setGoogleLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Social Login Demo</Text>
      <Text style={styles.description}>
        Test các button đăng nhập social với loading states
      </Text>
      
      <View style={styles.buttonsContainer}>
        <FacebookLoginButton
          onPress={handleFacebookLogin}
          loading={facebookLoading}
          disabled={googleLoading}
        />
        
        <GoogleLoginButton
          onPress={handleGoogleLogin}
          loading={googleLoading}
          disabled={facebookLoading}
        />
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🧪 Demo Features:</Text>
        <Text style={styles.infoText}>
          • Facebook branded button với icon{'\n'}
          • Google branded button với "G" icon{'\n'}
          • Individual loading states{'\n'}
          • Press animations{'\n'}
          • Disabled states{'\n'}
          • 2-second mock login delay
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});