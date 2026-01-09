import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PayOSDebug } from '@/src/components/__debug__/PayOSDebug';

export default function PayOSDebugScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <PayOSDebug />
    </SafeAreaView>
  );
}