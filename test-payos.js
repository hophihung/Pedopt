/**
 * Simple PayOS Edge Function Test
 * Run with: node test-payos.js
 */

const SUPABASE_URL = 'https://yxzvjlcyfcjcksrjjmmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4enZqbGN5ZmNqY2tzcmpqbW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTY2ODAsImV4cCI6MjA3NjY3MjY4MH0.BiaMJr8Z04jR61sUtgDo_aur2V7s8mwIpdzEiCJFMo8';

async function testPayOSEdgeFunction() {
  console.log('🚀 Testing PayOS Edge Function...');
  
  try {
    // Test 1: Products format
    console.log('\n1️⃣ Testing Products Format...');
    const productsRequest = {
      orderCode: Date.now(),
      amount: 10000,
      description: 'Test payment - Products',
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

    const productsResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-payos-payment-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productsRequest),
    });

    console.log('📊 Products Response Status:', productsResponse.status);
    const productsData = await productsResponse.json();
    console.log('📦 Products Response Data:', JSON.stringify(productsData, null, 2));

    // Test 2: Transaction format (chat)
    console.log('\n2️⃣ Testing Transaction Format...');
    const transactionRequest = {
      transaction_id: 'test-transaction-123',
      amount: 15000,
      pet_name: 'Test Pet',
      transaction_code: 'TEST123',
      return_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    };

    const transactionResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-payos-payment-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionRequest),
    });

    console.log('📊 Transaction Response Status:', transactionResponse.status);
    const transactionData = await transactionResponse.json();
    console.log('📦 Transaction Response Data:', JSON.stringify(transactionData, null, 2));

    // Summary
    console.log('\n📋 Test Summary:');
    console.log('Products Format:', productsResponse.status === 200 ? '✅ OK' : '❌ Failed');
    console.log('Transaction Format:', transactionResponse.status === 200 ? '✅ OK' : '❌ Failed');
    
    if (productsData?.error === 0 && transactionData?.error === 0) {
      console.log('🎉 All tests passed! PayOS is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the responses above.');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testPayOSEdgeFunction();