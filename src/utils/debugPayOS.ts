import { supabase } from '@/lib/supabase';

export const debugPayOSEdgeFunctions = async () => {
  console.log('🔧 Debugging PayOS Edge Functions...');
  
  try {
    // Test 1: Check if functions exist
    console.log('📡 Testing payos-create-payment function...');
    const createResponse = await supabase.functions.invoke('payos-create-payment', {
      body: {
        orderCode: 123456,
        amount: 1000,
        description: 'Test payment',
        items: [{ name: 'Test', quantity: 1, price: 1000 }],
      },
    });
    
    console.log('✅ Create function response:', createResponse);
    
    // Test 2: Check get payment function
    console.log('📡 Testing payos-get-payment function...');
    const getResponse = await supabase.functions.invoke('payos-get-payment', {
      body: { orderCode: 123456 },
    });
    
    console.log('✅ Get function response:', getResponse);
    
    return {
      createFunction: createResponse.error ? 'ERROR' : 'OK',
      getFunction: getResponse.error ? 'ERROR' : 'OK',
      createError: createResponse.error?.message,
      getError: getResponse.error?.message,
    };
    
  } catch (error) {
    console.error('💥 Debug error:', error);
    return {
      createFunction: 'ERROR',
      getFunction: 'ERROR',
      error: error.message,
    };
  }
};

export const checkSupabaseConnection = async () => {
  console.log('🔧 Checking Supabase connection...');
  
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      return { status: 'ERROR', error: error.message };
    }
    
    console.log('✅ Supabase connection OK');
    return { status: 'OK', data };
    
  } catch (error) {
    console.error('💥 Connection test error:', error);
    return { status: 'ERROR', error: error.message };
  }
};

// Explain non-2xx error
export const explainNon2xxError = () => {
  console.log(`
🔍 PayOS Non-2xx Error Explanation:

❌ "Edge Function returned a non-2xx status code" có nghĩa:

1. 📡 Edge Function không tồn tại (404)
2. 🔑 Thiếu environment variables (500)
3. 🚫 Function có lỗi code (500)
4. 🔒 Không có quyền truy cập (403)

🛠️ Cách fix:

1. Deploy Edge Functions:
   supabase functions deploy payos-create-payment
   supabase functions deploy payos-get-payment

2. Kiểm tra Environment Variables trong Supabase:
   - PAYOS_CLIENT_ID
   - PAYOS_API_KEY  
   - PAYOS_CHECKSUM_KEY

3. Kiểm tra logs trong Supabase Dashboard:
   Functions → Logs

4. Test với mock data (hiện tại):
   - QR code vẫn hiển thị
   - Dùng test button để simulate success
  `);
};

// Auto-run explanation in dev mode
if (__DEV__) {
  explainNon2xxError();
}