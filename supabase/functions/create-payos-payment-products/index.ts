import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 PayOS Products Payment Link called');
    
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
          message: 'PayOS configuration missing'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Extract products format data
    const { orderCode, amount, description, buyerName, buyerEmail, buyerPhone, buyerAddress, items, returnUrl, cancelUrl } = requestBody;

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

    // Create PayOS payment request (simple format like chat)
    const paymentData = {
      orderCode: typeof orderCode === 'string' ? parseInt(orderCode) : orderCode,
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

    // Add optional buyer info
    if (buyerName) paymentData.buyerName = buyerName;
    if (buyerEmail) paymentData.buyerEmail = buyerEmail;
    if (buyerPhone) paymentData.buyerPhone = buyerPhone;
    if (buyerAddress) paymentData.buyerAddress = buyerAddress;

    console.log('📡 PayOS payment data:', paymentData);

    // Call PayOS API (same as chat - simple approach)
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

    // Return PayOS response (same format as original)
    return new Response(
      JSON.stringify(result),
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
        message: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})