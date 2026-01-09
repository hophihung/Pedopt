import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: onboardingLoading, needsOnboarding } = useOnboarding();

  // Show loading while checking auth and onboarding status
  if (authLoading || onboardingLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  // If user is not authenticated, let the auth system handle it
  if (!user) {
    return <>{children}</>;
  }

  // If user needs onboarding, the useOnboarding hook will handle the redirect
  // We still render children to avoid flash
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});