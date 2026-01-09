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
    console.log('🔍 PayOS Get Payment Info called');
    
    const requestBody = await req.json();
    console.log('📦 Request body:', requestBody);
    
    const { orderCode, paymentLinkId, action } = requestBody;

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
          status: 500,
        },
      )
    }

    // Determine API endpoint and method
    let apiUrl: string;
    let method = 'GET';
    
    if (action === 'cancel' && (orderCode || paymentLinkId)) {
      // Cancel payment
      const id = paymentLinkId || orderCode;
      apiUrl = `https://api-merchant.payos.vn/v2/payment-requests/${id}/cancel`;
      method = 'PUT';
    } else if (orderCode) {
      // Get payment info by orderCode
      apiUrl = `https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`;
    } else if (paymentLinkId) {
      // Get payment info by paymentLinkId
      apiUrl = `https://api-merchant.payos.vn/v2/payment-requests/${paymentLinkId}`;
    } else {
      console.error('❌ Missing orderCode or paymentLinkId');
      return new Response(
        JSON.stringify({ 
          error: 1, 
          message: 'Missing orderCode or paymentLinkId'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log(`📡 Calling PayOS API: ${method} ${apiUrl}`);

    // Call PayOS API
    const response = await fetch(apiUrl, {
      method,
      headers: {
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY,
        'x-partner-code': PAYOS_CLIENT_ID,
        'x-request-id': `${Date.now()}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 PayOS API response status:', response.status);
    console.log('📊 PayOS API response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📋 PayOS API result:', result);

    // Check if PayOS API returned an error
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
          status: 200, // Return 200 but with error in body
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
        message: error.message || 'Internal server error',
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})