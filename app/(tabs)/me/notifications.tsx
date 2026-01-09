import { NotificationCenter } from '@/src/features/notifications/components/NotificationCenter';
import { PayOSDebugPanel } from '@/src/components/PayOSDebugPanel';
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Bug } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';

export default function NotificationsScreen() {
  const [showDebug, setShowDebug] = useState(false);

  if (showDebug) {
    return (
      <View style={styles.container}>
        <View style={styles.debugHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowDebug(false)}
          >
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
        <PayOSDebugPanel />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => setShowDebug(true)}
      >
        <Bug size={20} color={colors.primary} />
        <Text style={styles.debugButtonText}>PayOS Debug</Text>
      </TouchableOpacity>
      <NotificationCenter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  debugButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  debugHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

