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
    console.log('🧪 Simple test function called');
    
    const requestBody = await req.json();
    console.log('📦 Request body:', requestBody);
    
    // Always return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Simple test function is working!',
        timestamp: new Date().toISOString(),
        receivedData: requestBody
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('💥 Simple test error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Simple test error but still 200',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})