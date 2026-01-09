import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { FacebookConnection } from './FacebookConnection';

/**
 * Demo component để test Facebook Connection feature
 * Có thể sử dụng trong development để test UI/UX
 */
export function FacebookConnectionDemo() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Facebook Connection Demo</Text>
      <Text style={styles.description}>
        Test tính năng kết nối Facebook với mock data
      </Text>
      
      <FacebookConnection />
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🧪 Demo Features:</Text>
        <Text style={styles.infoText}>
          • Mock Facebook login (2s delay){'\n'}
          • Fake profile data generation{'\n'}
          • Full connect/disconnect flow{'\n'}
          • Database integration{'\n'}
          • Error handling simulation
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
    marginBottom: 24,
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
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