import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { OAuthHandlerService } from '@/src/features/auth/services/oauth-handler.service';
import { supabase } from '@/lib/supabase';

export function OAuthDebugPanel() {
  const [oauthConfig, setOauthConfig] = useState<{ facebook: boolean; google: boolean } | null>(null);
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      
      // Get Supabase URL
      const url = supabase.supabaseUrl;
      setSupabaseUrl(url);

      // Check OAuth configuration
      const config = await OAuthHandlerService.checkOAuthConfiguration();
      setOauthConfig(config);
    } catch (error) {
      console.error('Error loading debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const testFacebookOAuth = async () => {
    try {
      console.log('🧪 Testing Facebook OAuth...');
      await OAuthHandlerService.signInWithFacebook();
    } catch (error) {
      console.error('🧪 Facebook OAuth test failed:', error);
    }
  };

  const testGoogleOAuth = async () => {
    try {
      console.log('🧪 Testing Google OAuth...');
      await OAuthHandlerService.signInWithGoogle();
    } catch (error) {
      console.error('🧪 Google OAuth test failed:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>OAuth Debug Panel</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supabase Configuration</Text>
        <Text style={styles.info}>URL: {supabaseUrl}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OAuth Providers Status</Text>
        {oauthConfig ? (
          <>
            <Text style={[styles.status, oauthConfig.facebook ? styles.success : styles.error]}>
              Facebook: {oauthConfig.facebook ? '✅ Configured' : '❌ Not configured'}
            </Text>
            <Text style={[styles.status, oauthConfig.google ? styles.success : styles.error]}>
              Google: {oauthConfig.google ? '✅ Configured' : '❌ Not configured'}
            </Text>
          </>
        ) : (
          <Text style={styles.loading}>Loading...</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test OAuth</Text>
        <TouchableOpacity style={styles.testButton} onPress={testFacebookOAuth}>
          <Text style={styles.testButtonText}>Test Facebook OAuth</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.testButton} onPress={testGoogleOAuth}>
          <Text style={styles.testButtonText}>Test Google OAuth</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Info</Text>
        <Text style={styles.debugText}>
          • Check console logs for detailed OAuth flow{'\n'}
          • Ensure Facebook/Google apps are configured{'\n'}
          • Verify redirect URLs in provider settings{'\n'}
          • Check Supabase Auth settings
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
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  status: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  success: {
    color: '#059669',
  },
  error: {
    color: '#DC2626',
  },
  loading: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  testButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});