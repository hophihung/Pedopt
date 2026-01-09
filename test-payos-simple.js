/**
 * Simple PayOS Test Script
 * Test PayOS integration without running the full app
 */

// Test data
const testPayment = {
  orderCode: Date.now(),
  amount: 10000,
  description: 'Test payment from script',
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

async function testPayOS() {
  console.log('🚀 Testing PayOS Edge Function...');
  console.log('📦 Test data:', JSON.stringify(testPayment, null, 2));
  
  try {
    const response = await fetch('https://yxzvjlcyfcjcksrjjmmi.supabase.co/functions/v1/create-payos-payment-link', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4enZqbGN5ZmNqY2tzcmpqbW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTY2ODAsImV4cCI6MjA3NjY3MjY4MH0.BiaMJr8Z04jR61sUtgDo_aur2V7s8mwIpdzEiCJFMo8',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayment),
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📋 Response Data:', JSON.stringify(result, null, 2));

    if (response.ok && result.error === 0) {
      console.log('✅ PayOS test successful!');
      console.log('🔗 Payment URL:', result.data?.checkoutUrl);
      console.log('📱 QR Code:', result.data?.qrCode ? 'Available' : 'Not available');
    } else {
      console.log('❌ PayOS test failed');
      console.log('💥 Error:', result.message || 'Unknown error');
      if (result.details) {
        console.log('📋 Details:', JSON.stringify(result.details, null, 2));
      }
    }
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

// Run the test
testPayOS();