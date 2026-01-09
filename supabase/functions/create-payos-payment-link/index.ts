// @ts-ignore - Deno runtime will handle this import
// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Deno global types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 PayOS Create Payment Link called');
    
    const requestBody = await req.json();
    console.log('📦 Request body:', requestBody);
    
    // PayOS API configuration
    const PAYOS_CLIENT_ID = Deno.env.get('PAYOS_CLIENT_ID')
    const PAYOS_API_KEY = Deno.env.get('PAYOS_API_KEY')
    const PAYOS_CHECKSUM_KEY = Deno.env.get('PAYOS_CHECKSUM_KEY')

    console.log('🔑 PayOS Config check:', {
      hasClientId: !!PAYOS_CLIENT_ID,
      hasApiKey: !!PAYOS_API_KEY,
      hasChecksumKey: !!PAYOS_CHECKSUM_KEY
    });

    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
      console.error('❌ PayOS configuration missing');
      return new Response(
        JSON.stringify({ 
          error: 1, 
          message: 'PayOS configuration missing',
          details: {
            hasClientId: !!PAYOS_CLIENT_ID,
            hasApiKey: !!PAYOS_API_KEY,
            hasChecksumKey: !!PAYOS_CHECKSUM_KEY
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Handle both formats: products (orderCode) and chat transactions (transaction_id)
    const isTransactionFormat = requestBody.transaction_id && !requestBody.orderCode;
    
    let orderCode: number, amount: number, description: string, buyerName: string, buyerEmail: string, buyerPhone: string, buyerAddress: string, items: any[], returnUrl: string, cancelUrl: string;
    
    if (isTransactionFormat) {
      // Chat transaction format
      console.log('📱 Processing chat transaction format');
      const { transaction_id, pet_name, transaction_code } = requestBody;
      
      orderCode = transaction_code ? parseInt(transaction_code.replace(/[^0-9]/g, '')) || Date.now() : Date.now();
      amount = requestBody.amount;
      description = `Thanh toán giao dịch ${pet_name || 'thú cưng'} - Mã: ${transaction_code || transaction_id}`;
      buyerName = requestBody.buyer_name || 'Khách hàng';
      buyerEmail = requestBody.buyer_email || '';
      buyerPhone = requestBody.buyer_phone || '';
      buyerAddress = requestBody.buyer_address || '';
      items = [{
        name: pet_name || 'Thú cưng',
        quantity: 1,
        price: requestBody.amount
      }];
      returnUrl = requestBody.return_url || 'https://example.com/success';
      cancelUrl = requestBody.cancel_url || 'https://example.com/cancel';
    } else {
      // Products format
      console.log('🛍️ Processing products format');
      orderCode = requestBody.orderCode;
      amount = requestBody.amount;
      description = requestBody.description;
      buyerName = requestBody.buyerName;
      buyerEmail = requestBody.buyerEmail;
      buyerPhone = requestBody.buyerPhone;
      buyerAddress = requestBody.buyerAddress;
      items = requestBody.items;
      returnUrl = requestBody.returnUrl;
      cancelUrl = requestBody.cancelUrl;
    }

    // Validate required fields
    if (!orderCode || !amount || !items || items.length === 0) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ 
          error: 1, 
          message: 'Missing required fields: orderCode, amount, items'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Ensure orderCode is a number and within valid range
    const numericOrderCode = typeof orderCode === 'string' ? parseInt(orderCode) : orderCode;
    if (isNaN(numericOrderCode) || numericOrderCode <= 0) {
      console.error('❌ Invalid orderCode:', orderCode);
      return new Response(
        JSON.stringify({ 
          error: 1, 
          message: 'Invalid orderCode: must be a positive number'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Create PayOS payment request
    const paymentData = {
      orderCode: numericOrderCode,
      amount: Math.round(amount),
      description: description || 'Thanh toán đơn hàng',
      items: items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity || 1,
        price: Math.round(item.price || 0)
      })),
      returnUrl: returnUrl || 'https://example.com/success',
      cancelUrl: cancelUrl || 'https://example.com/cancel',
    };

    // Add optional buyer info if provided
    if (buyerName) (paymentData as any).buyerName = buyerName;
    if (buyerEmail) (paymentData as any).buyerEmail = buyerEmail;
    if (buyerPhone) (paymentData as any).buyerPhone = buyerPhone;
    if (buyerAddress) (paymentData as any).buyerAddress = buyerAddress;

    console.log('📡 PayOS payment data:', paymentData);

    // Call PayOS API
    const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    console.log('📊 PayOS API response status:', response.status);
    
    const result = await response.json();
    console.log('📋 PayOS API result:', result);

    // Always return 200 with proper error/success format
    if (!response.ok) {
      console.error('❌ PayOS API error:', response.status, result);
      return new Response(
        JSON.stringify({ 
          error: 1, 
          message: `PayOS API Error: ${result.message || 'Unknown error'}`,
          details: result,
          status: response.status
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Return successful PayOS response
    return new Response(
      JSON.stringify({
        error: 0,
        message: 'Success',
        data: result.data || result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('💥 PayOS function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 1, 
        message: (error as Error).message || 'Internal server error',
        stack: (error as Error).stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})