import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Bug, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { PayOSDebug } from '@/src/utils/payos-debug';
import { colors } from '@/src/theme/colors';
import { supabase } from '@/lib/supabase';

interface TestResult {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
  details?: any;
  suggestion?: string;
}

export function PayOSDebugPanel() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    credentials?: TestResult;
    edgeFunction?: TestResult;
    transactionFormat?: TestResult;
  }>({});

  const runTests = async () => {
    try {
      setTesting(true);
      setResults({});
      
      console.log('🚀 Starting PayOS Debug Tests...');
      
      // Test credentials first
      console.log('1️⃣ Testing credentials...');
      const credentialsResult = await PayOSDebug.testCredentials();
      setResults(prev => ({ ...prev, credentials: credentialsResult }));
      
      if (!credentialsResult.success) {
        console.log('❌ Credentials test failed, skipping other tests');
        return;
      }
      
      // Test Edge Function (products format)
      console.log('2️⃣ Testing Edge Function...');
      const edgeFunctionResult = await PayOSDebug.testEdgeFunction();
      setResults(prev => ({ ...prev, edgeFunction: edgeFunctionResult }));
      
      // Test Transaction Format (chat format)
      console.log('3️⃣ Testing Transaction Format...');
      const transactionResult = await PayOSDebug.testTransactionFormat();
      setResults(prev => ({ ...prev, transactionFormat: transactionResult }));
      
      console.log('✅ All tests completed');
      
    } catch (error: any) {
      console.error('💥 Test suite failed:', error);
      Alert.alert('Lỗi', error.message);
    } finally {
      setTesting(false);
    }
  };

  const testProductsPayOS = async () => {
    try {
      setTesting(true);
      
      console.log('🛍️ Testing Products PayOS...');
      
      // Import PayOSService dynamically to avoid circular imports
      const { PayOSService } = await import('@/src/features/payment/services/payos.service');
      
      const testRequest = {
        orderCode: PayOSService.generateOrderCode(),
        amount: PayOSService.formatAmount(10000),
        description: 'Test payment - Products Debug',
        buyerName: 'Test User',
        buyerEmail: 'test@example.com',
        buyerPhone: '0123456789',
        buyerAddress: 'Test Address',
        items: [
          {
            name: 'Test Product',
            quantity: 1,
            price: PayOSService.formatAmount(10000),
          },
        ],
      };

      console.log('📦 Test request:', testRequest);
      
      const response = await PayOSService.createPaymentLink(testRequest);
      
      console.log('✅ Products PayOS test successful:', response);
      
      Alert.alert(
        'Test thành công!',
        `PayOS Products format hoạt động bình thường.\n\nOrder Code: ${testRequest.orderCode}\nAmount: ${testRequest.amount} VNĐ`
      );
      
      setResults(prev => ({ 
        ...prev, 
        productsTest: { 
          success: true, 
          message: 'Products PayOS test successful',
          data: response 
        } 
      }));
      
    } catch (error: any) {
      console.error('💥 Products PayOS test failed:', error);
      
      Alert.alert(
        'Test thất bại!',
        `Lỗi: ${error.message}\n\nKiểm tra console để xem chi tiết.`
      );
      
      setResults(prev => ({ 
        ...prev, 
        productsTest: { 
          success: false, 
          error: error.message 
        } 
      }));
    } finally {
      setTesting(false);
    }
  };

  const testSimpleEdgeFunction = async () => {
    try {
      setTesting(true);
      
      console.log('🧪 Testing Simple Edge Function...');
      
      const testRequest = {
        test: true,
        message: 'Hello from app',
        timestamp: new Date().toISOString()
      };

      console.log('📦 Simple test request:', testRequest);
      
      // Call simple test Edge Function
      const { data, error } = await supabase.functions.invoke('test-simple', {
        body: testRequest,
      });

      console.log('📡 Simple Edge Function response:', { data, error });

      if (error) {
        console.error('❌ Simple Edge Function error:', error);
        Alert.alert(
          'Simple Test Failed',
          `Even the simple function failed: ${error.message}\n\nThis means there's a fundamental issue with Edge Functions deployment or configuration.`
        );
        
        setResults(prev => ({ 
          ...prev, 
          simpleTest: { 
            success: false, 
            error: `Simple Edge Function Error: ${error.message}` 
          } 
        }));
      } else {
        console.log('✅ Simple Edge Function test successful:', data);
        Alert.alert(
          'Simple Test Success!',
          `Simple Edge Function works!\n\nThis means the issue is specifically with the PayOS function.`
        );
        
        setResults(prev => ({ 
          ...prev, 
          simpleTest: { 
            success: true, 
            message: 'Simple Edge Function works',
            data: data 
          } 
        }));
      }
      
    } catch (error: any) {
      console.error('💥 Simple test failed:', error);
      
      Alert.alert(
        'Simple Test Failed!',
        `Error: ${error.message}\n\nThis indicates a fundamental Edge Function issue.`
      );
      
      setResults(prev => ({ 
        ...prev, 
        simpleTest: { 
          success: false, 
          error: error.message 
        } 
      }));
    } finally {
      setTesting(false);
    }
  };

  const renderTestResult = (title: string, result?: TestResult) => {
    if (!result) {
      return (
        <View style={styles.testItem}>
          <View style={styles.testHeader}>
            <AlertCircle size={20} color="#999" />
            <Text style={styles.testTitle}>{title}</Text>
          </View>
          <Text style={styles.testStatus}>Chưa test</Text>
        </View>
      );
    }

    const icon = result.success ? (
      <CheckCircle size={20} color="#4CAF50" />
    ) : (
      <XCircle size={20} color="#F44336" />
    );

    const statusColor = result.success ? '#4CAF50' : '#F44336';

    return (
      <View style={styles.testItem}>
        <View style={styles.testHeader}>
          {icon}
          <Text style={styles.testTitle}>{title}</Text>
        </View>
        
        <Text style={[styles.testStatus, { color: statusColor }]}>
          {result.success ? 'Thành công' : 'Thất bại'}
        </Text>
        
        {result.error && (
          <Text style={styles.testError}>{result.error}</Text>
        )}
        
        {result.message && (
          <Text style={styles.testMessage}>{result.message}</Text>
        )}
        
        {result.suggestion && (
          <Text style={styles.testSuggestion}>💡 {result.suggestion}</Text>
        )}
        
        {result.details && (
          <View style={styles.testDetails}>
            <Text style={styles.testDetailsTitle}>Chi tiết:</Text>
            <Text style={styles.testDetailsText}>
              {JSON.stringify(result.details, null, 2)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Bug size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>PayOS Debug Panel</Text>
      </View>
      
      <TouchableOpacity
        style={[styles.runButton, testing && styles.runButtonDisabled]}
        onPress={runTests}
        disabled={testing}
      >
        {testing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Play size={20} color="#fff" />
        )}
        <Text style={styles.runButtonText}>
          {testing ? 'Đang test...' : 'Chạy test PayOS'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.runButton, { backgroundColor: '#2196F3' }, testing && styles.runButtonDisabled]}
        onPress={testSimpleEdgeFunction}
        disabled={testing}
      >
        {testing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Play size={20} color="#fff" />
        )}
        <Text style={styles.runButtonText}>
          {testing ? 'Đang test...' : 'Test Simple Edge Function'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.runButton, { backgroundColor: '#FF9800' }, testing && styles.runButtonDisabled]}
        onPress={testProductsPayOS}
        disabled={testing}
      >
        {testing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Play size={20} color="#fff" />
        )}
        <Text style={styles.runButtonText}>
          {testing ? 'Đang test...' : 'Test Products PayOS'}
        </Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.resultsContainer}>
        {renderTestResult('1. PayOS Credentials', results.credentials)}
        {renderTestResult('2. Edge Function (Products)', results.edgeFunction)}
        {renderTestResult('3. Transaction Format (Chat)', results.transactionFormat)}
        {renderTestResult('4. Simple Edge Function Test', (results as any).simpleTest)}
        {renderTestResult('5. Products PayOS Test', (results as any).productsTest)}
        
        {Object.keys(results).length > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Tóm tắt:</Text>
            <Text style={styles.summaryText}>
              {Object.values(results).every(r => r?.success) 
                ? '✅ Tất cả test đều thành công! PayOS hoạt động bình thường.'
                : '❌ Có lỗi trong quá trình test. Kiểm tra chi tiết ở trên.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  runButtonDisabled: {
    backgroundColor: '#D4D6DC',
  },
  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  testItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  testStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  testError: {
    fontSize: 13,
    color: '#F44336',
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  testMessage: {
    fontSize: 13,
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  testSuggestion: {
    fontSize: 12,
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  testDetails: {
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 6,
  },
  testDetailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  testDetailsText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});