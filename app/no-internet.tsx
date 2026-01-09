import React from 'react';
import { NoInternetScreen } from '@/src/components';
import { useRouter } from 'expo-router';

export default function NoInternetPage() {
  const router = useRouter();

  const handleRetry = () => {
    // Go back or refresh
    router.back();
  };

  return <NoInternetScreen onRetry={handleRetry} />;
}
