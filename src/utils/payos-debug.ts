import { supabase } from '@/lib/supabase';

/**
 * Debug utility for PayOS integration
 * Helps troubleshoot PayOS payment issues
 */
export const PayOSDebug = {
  /**
   * Test Edge Function connectivity
   */
  async testEdgeFunction() {
    try {
      console.log('🧪 Testing Edge Function connectivity...');
      
      const testRequest = {
        // Products format test
        orderCode: Date.now(),
        amount: 10000,
        description: 'Test payment',
        buyerName: 'Test User',
        buyerEmail: 'test@example.com',
        buyerPhone: '0123456789',
        buyerAddress: 'Test Address',
        items: [
          {
            name: 'Test Product',
            quantity: 1,
            price: 10000,
          },
        ],
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const { data, error } = await supabase.functions.invoke('create-payos-payment-link', {
        body: testRequest,
      });

      console.log('📡 Edge Function Response:', { data, error });

      if (error) {
        console.error('❌ Edge Function Error:', error);
        return { success: false, error: error.message };
      }

      // Check new response format
      if (data?.error && data.error !== 0) {
        console.error('❌ PayOS API Error:', data);
        return { success: false, error: data.message, details: data.details };
      }

      console.log('✅ Edge Function test successful');
      return { success: true, data };
    } catch (error: any) {
      console.error('💥 Test failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test transaction format (chat)
   */
  async testTransactionFormat() {
    try {
      console.log('🧪 Testing Transaction Format...');
      
      const testRequest = {
        // Transaction format test
        transaction_id: 'test-transaction-123',
        amount: 15000,
        pet_name: 'Test Pet',
        transaction_code: 'TEST123',
        return_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      };

      const { data, error } = await supabase.functions.invoke('create-payos-payment-link', {
        body: testRequest,
      });

      console.log('📡 Transaction Format Response:', { data, error });

      if (error) {
        console.error('❌ Transaction Format Error:', error);
        return { success: false, error: error.message };
      }

      if (data?.error && data.error !== 0) {
        console.error('❌ PayOS API Error:', data);
        return { success: false, error: data.message, details: data.details };
      }

      console.log('✅ Transaction format test successful');
      return { success: true, data };
    } catch (error: any) {
      console.error('💥 Transaction test failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test PayOS credentials
   */
  async testCredentials() {
    try {
      console.log('🔑 Testing PayOS Credentials...');
      
      // Send minimal request to check credentials
      const testRequest = {
        orderCode: Date.now(),
        amount: 1000, // Minimum amount
        description: 'Credential test',
        buyerName: 'Test',
        items: [{ name: 'Test', quantity: 1, price: 1000 }],
      };

      const { data, error } = await supabase.functions.invoke('create-payos-payment-link', {
        body: testRequest,
      });

      console.log('🔑 Credentials Test Response:', { data, error });

      if (error) {
        if (error.message?.includes('PayOS configuration missing')) {
          return { 
            success: false, 
            error: 'PayOS credentials not configured in Supabase Secrets',
            suggestion: 'Run: supabase secrets set PAYOS_CLIENT_ID=xxx PAYOS_API_KEY=xxx PAYOS_CHECKSUM_KEY=xxx'
          };
        }
        return { success: false, error: error.message };
      }

      if (data?.error) {
        if (data.error === 1 && data.message?.includes('configuration')) {
          return { 
            success: false, 
            error: 'PayOS credentials invalid or missing',
            details: data.details
          };
        }
        return { success: false, error: data.message };
      }

      console.log('✅ PayOS credentials are valid');
      return { success: true, message: 'Credentials are valid' };
    } catch (error: any) {
      console.error('💥 Credentials test failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Running PayOS Debug Tests...');
    
    const results = {
      credentials: await this.testCredentials(),
      edgeFunction: await this.testEdgeFunction(),
      transactionFormat: await this.testTransactionFormat(),
    };

    console.log('📊 Test Results:', results);
    
    return results;
  },
};