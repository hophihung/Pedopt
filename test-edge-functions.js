/**
 * Test Edge Functions directly
 */

const SUPABASE_URL = 'https://yxzvjlcyfcjcksrjjmmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4enZqbGN5ZmNqY2tzcmpqbW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTY2ODAsImV4cCI6MjA3NjY3MjY4MH0.BiaMJr8Z04jR61sUtgDo_aur2V7s8mwIpdzEiCJFMo8';

async function testEdgeFunction(functionName, requestBody) {
  console.log(`\n🧪 Testing ${functionName}...`);
  console.log('📦 Request:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log('📋 Response Body:', result);

    if (response.ok) {
      console.log('✅ Function exists and responded');
      try {
        const jsonResult = JSON.parse(result);
        return { success: true, data: jsonResult };
      } catch (e) {
        return { success: true, data: result };
      }
    } else {
      console.log('❌ Function failed or not found');
      return { success: false, error: `Status ${response.status}: ${result}` };
    }
  } catch (error) {
    console.error('💥 Network error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Edge Functions...');
  
  // Test data
  const productsRequest = {
    orderCode: Date.now(),
    amount: 10000,
    description: 'Test payment - Products',
    buyerName: 'Test User',
    items: [{ name: 'Test Product', quantity: 1, price: 10000 }],
    returnUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
  };

  const chatRequest = {
    transaction_id: 'test-123',
    amount: 15000,
    pet_name: 'Test Pet',
    transaction_code: 'TEST123',
    return_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
  };

  // Test 1: Original function (chat uses this)
  const originalResult = await testEdgeFunction('create-payos-payment-link', chatRequest);
  
  // Test 2: New products function
  const productsResult = await testEdgeFunction('create-payos-payment-products', productsRequest);
  
  // Test 3: Original function with products format
  const originalWithProductsResult = await testEdgeFunction('create-payos-payment-link', productsRequest);

  console.log('\n📋 Summary:');
  console.log('Original function (chat format):', originalResult.success ? '✅ Works' : '❌ Failed');
  console.log('Products function:', productsResult.success ? '✅ Works' : '❌ Failed');
  console.log('Original function (products format):', originalWithProductsResult.success ? '✅ Works' : '❌ Failed');

  if (!productsResult.success) {
    console.log('\n💡 Suggestion: Products function not deployed. Use original function instead.');
  }
}

runTests();