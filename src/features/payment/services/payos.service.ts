import { supabase } from '@/lib/supabase';

export interface PayOSPaymentRequest {
  orderCode: number;
  amount: number;
  description: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PayOSPaymentResponse {
  error: number;
  message: string;
  data?: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
  };
}

export interface PayOSWebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
}

export const PayOSService = {
  /**
   * Tạo payment link với PayOS (workaround using chat logic)
   */
  async createPaymentLink(request: PayOSPaymentRequest): Promise<PayOSPaymentResponse> {
    try {
      console.log('🔄 Creating PayOS payment with request:', request);
      
      // Validate request
      if (!request.orderCode || !request.amount || !request.items?.length) {
        throw new Error('Invalid PayOS request: missing required fields');
      }

      // WORKAROUND: Use chat transaction format since it works
      const chatFormatRequest = {
        transaction_id: `product-${request.orderCode}`,
        amount: Math.round(request.amount),
        pet_name: request.items[0]?.name || 'Sản phẩm',
        transaction_code: request.orderCode.toString(),
        buyer_name: request.buyerName || 'Khách hàng',
        buyer_email: request.buyerEmail || '',
        buyer_phone: request.buyerPhone || '',
        buyer_address: request.buyerAddress || '',
        return_url: request.returnUrl || 'petadoption://payment-success',
        cancel_url: request.cancelUrl || 'petadoption://payment-cancel',
      };

      console.log('📡 Sending chat format request to Edge Function:', chatFormatRequest);
      
      // Use the same Edge Function that chat uses
      const { data, error } = await supabase.functions.invoke('create-payos-payment-link', {
        body: chatFormatRequest,
      });

      console.log('📡 Edge Function response:', { data, error });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(`Edge Function Error: ${error.message}`);
      }

      // Check if PayOS returned an error (but don't throw on "Success" message)
      if (data?.error && data.error !== 0) {
        console.error('❌ PayOS API error:', data);
        throw new Error(`PayOS Error: ${data.message || 'Unknown PayOS error'}`);
      }

      // Handle test response from simplified Edge Function
      if (data?.test === true) {
        console.log('🧪 Test response from Edge Function:', data);
        // Return a mock successful response for testing
        return {
          error: 0,
          message: 'Test Success - Edge Function Working',
          data: {
            bin: '',
            accountNumber: '',
            accountName: '',
            amount: request.amount,
            description: request.description,
            orderCode: request.orderCode,
            currency: 'VND',
            paymentLinkId: 'test-payment-link-id',
            status: 'PENDING',
            checkoutUrl: 'https://test.payos.vn/payment',
            qrCode: 'test-qr-code-data',
          }
        };
      }

      console.log('✅ PayOS response:', data);
      
      // Debug: Log the exact response structure
      console.log('🔍 PayOS response structure:', {
        hasError: 'error' in data,
        errorValue: data?.error,
        hasData: 'data' in data,
        dataValue: data?.data,
        hasMessage: 'message' in data,
        messageValue: data?.message,
        fullResponse: JSON.stringify(data, null, 2)
      });
      
      // Handle real PayOS response
      if (data?.error === 0) {
        // Success response from PayOS
        const productsResponse: PayOSPaymentResponse = {
          error: 0,
          message: data.message || 'Success',
          data: data.data ? {
            bin: data.data.bin || '',
            accountNumber: data.data.accountNumber || '',
            accountName: data.data.accountName || '',
            amount: data.data.amount || request.amount,
            description: data.data.description || request.description,
            orderCode: data.data.orderCode || request.orderCode,
            currency: data.data.currency || 'VND',
            paymentLinkId: data.data.paymentLinkId || data.data.id || '',
            status: data.data.status || 'PENDING',
            checkoutUrl: data.data.checkoutUrl || data.data.paymentUrl || '',
            qrCode: data.data.qrCode || data.data.qrCode || '',
          } : undefined
        };
        
        console.log('📦 Converted products response:', productsResponse);
        return productsResponse;
      } else {
        // Error response from PayOS
        console.error('❌ PayOS returned error:', data);
        throw new Error(`PayOS Error: ${data.message || 'Unknown PayOS error'}`);
      }
    } catch (error) {
      console.error('💥 Error creating PayOS payment:', error);
      throw error;
    }
  },

  /**
   * Kiểm tra trạng thái thanh toán
   */
  async getPaymentStatus(orderCode: number): Promise<any> {
    try {
      console.log('🔍 Checking PayOS payment status for:', orderCode);
      
      const { data, error } = await supabase.functions.invoke('get-payos-payment-info', {
        body: { orderCode },
      });

      console.log('📡 PayOS status response:', { data, error });

      if (error) {
        console.error('❌ PayOS status error:', error);
        throw new Error(`Edge Function Error: ${error.message}`);
      }

      // Check if PayOS returned an error
      if (data?.error && data.error !== 0) {
        console.error('❌ PayOS API error:', data);
        throw new Error(`PayOS Error: ${data.message || 'Unknown PayOS error'}`);
      }

      return data;
    } catch (error) {
      console.error('💥 Error getting PayOS payment status:', error);
      throw error;
    }
  },

  /**
   * Hủy payment link
   */
  async cancelPaymentLink(orderCode: number): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('get-payos-payment-info', {
        body: { orderCode, action: 'cancel' },
      });

      if (error) {
        throw new Error(`PayOS API Error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error canceling PayOS payment:', error);
      throw error;
    }
  },

  /**
   * Tạo orderCode unique
   */
  generateOrderCode(): number {
    // Tạo orderCode từ timestamp + random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return parseInt(`${timestamp}${random}`.slice(-9)); // Giới hạn 9 chữ số
  },

  /**
   * Format amount cho PayOS (VND, không có decimal)
   */
  formatAmount(amount: number): number {
    return Math.round(amount);
  },
};