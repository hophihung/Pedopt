const https = require('https');

const FACEBOOK_APP_ID = '1731268644198831';
const SUPABASE_URL = 'https://yxzvjlcyfcjcksrjjmmi.supabase.co';

console.log('🔍 Kiểm tra cấu hình Facebook OAuth...');
console.log('=====================================');
console.log('');

console.log('📋 Thông tin hiện tại:');
console.log(`- Facebook App ID: ${FACEBOOK_APP_ID}`);
console.log(`- Supabase URL: ${SUPABASE_URL}`);
console.log('');

console.log('✅ Redirect URI cần thiết:');
console.log(`- ${SUPABASE_URL}/auth/v1/callback`);
console.log('- petadoption://auth/callback');
console.log('');

console.log('🔧 Các bước cần thực hiện:');
console.log('');
console.log('1. 🌐 Vào Facebook Developer Console:');
console.log(`   https://developers.facebook.com/apps/${FACEBOOK_APP_ID}/fb-login/settings/`);
console.log('');
console.log('2. 📝 Thêm Valid OAuth Redirect URIs:');
console.log(`   ${SUPABASE_URL}/auth/v1/callback`);
console.log('');
console.log('3. 🏠 Thêm App Domains:');
console.log(`   ${SUPABASE_URL.replace('https://', '')}`);
console.log('');
console.log('4. 🔑 Copy App Secret và paste vào Supabase Dashboard');
console.log('');
console.log('5. 📱 Rebuild app:');
console.log('   npx expo run:android');
console.log('');

// Test if Facebook app is accessible
console.log('🧪 Testing Facebook App accessibility...');
const testUrl = `https://graph.facebook.com/${FACEBOOK_APP_ID}`;

https.get(testUrl, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const appInfo = JSON.parse(data);
      if (appInfo.id) {
        console.log('✅ Facebook App accessible');
        console.log(`   App Name: ${appInfo.name || 'N/A'}`);
      } else {
        console.log('❌ Facebook App not accessible or private');
      }
    } catch (error) {
      console.log('❌ Error parsing Facebook App info');
    }
    console.log('');
    console.log('🎯 Sau khi hoàn thành các bước trên, Facebook OAuth sẽ hoạt động!');
  });
}).on('error', (error) => {
  console.log('❌ Cannot test Facebook App accessibility:', error.message);
  console.log('');
  console.log('🎯 Vẫn có thể tiếp tục với các bước cấu hình ở trên.');
});