import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { orderCode, amount, description, buyerName, buyerEmail, buyerPhone, buyerAddress, items, returnUrl, cancelUrl } = await req.json()

    // PayOS API configuration
    const PAYOS_CLIENT_ID = Deno.env.get('PAYOS_CLIENT_ID')
    const PAYOS_API_KEY = Deno.env.get('PAYOS_API_KEY')
    const PAYOS_CHECKSUM_KEY = Deno.env.get('PAYOS_CHECKSUM_KEY')

    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
      throw new Error('PayOS configuration missing')
    }

    // Create payment request
    const paymentData = {
      orderCode,
      amount,
      description,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      items,
      returnUrl: returnUrl || `${req.headers.get('origin')}/payment/success`,
      cancelUrl: cancelUrl || `${req.headers.get('origin')}/payment/cancel`,
    }

    // Call PayOS API
    const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    const result = await response.json()

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})