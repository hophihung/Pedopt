const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const supabaseUrl = 'https://yxzvjlcyfcjcksrjjmmi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4enZqbGN5ZmNqY2tzcmpqbW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTY2ODAsImV4cCI6MjA3NjY3MjY4MH0.BiaMJr8Z04jR61sUtgDo_aur2V7s8mwIpdzEiCJFMo8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOAuthConfiguration() {
  console.log('🔍 Kiểm tra cấu hình OAuth tổng thể');
  console.log('=====================================');
  console.log('');

  // Check app.json configuration
  console.log('1. 📱 Kiểm tra app.json...');
  try {
    const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
    
    console.log('✅ App configuration:');
    console.log(`   - App name: ${appJson.expo.name}`);
    console.log(`   - Scheme: ${appJson.expo.scheme}`);
    
    // Check plugins
    const plugins = appJson.expo.plugins || [];
    const hasFacebook = plugins.some(p => Array.isArray(p) && p[0] === 'expo-facebook');
    const hasAuthSession = plugins.includes('expo-auth-session');
    
    console.log(`   - Facebook plugin: ${hasFacebook ? '✅' : '❌'}`);
    console.log(`   - Auth session plugin: ${hasAuthSession ? '✅' : '❌'}`);
    
    if (hasFacebook) {
      const facebookConfig = plugins.find(p => Array.isArray(p) && p[0] === 'expo-facebook');
      console.log(`   - Facebook App ID: ${facebookConfig[1].appId}`);
    }
    
  } catch (error) {
    console.log('❌ Error reading app.json:', error.message);
  }
  
  console.log('');

  // Check Supabase OAuth providers
  console.log('2. 🔧 Kiểm tra Supabase OAuth providers...');
  
  try {
    // Test Facebook OAuth
    const { data: fbData, error: fbError } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: 'test://callback' },
    });
    
    console.log(`   - Facebook OAuth: ${fbError ? '❌' : '✅'}`);
    if (fbError) {
      console.log(`     Error: ${fbError.message}`);
    }
    
    // Test Google OAuth
    const { data: googleData, error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'test://callback' },
    });
    
    console.log(`   - Google OAuth: ${googleError ? '❌' : '✅'}`);
    if (googleError) {
      console.log(`     Error: ${googleError.message}`);
    }
    
  } catch (error) {
    console.log('❌ Error testing OAuth providers:', error.message);
  }
  
  console.log('');

  // Check package.json dependencies
  console.log('3. 📦 Kiểm tra dependencies...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = [
      'expo-auth-session',
      'expo-web-browser',
      'expo-facebook',
      '@supabase/supabase-js',
    ];
    
    requiredDeps.forEach(dep => {
      console.log(`   - ${dep}: ${deps[dep] ? '✅ ' + deps[dep] : '❌ Missing'}`);
    });
    
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
  }
  
  console.log('');

  // Show next steps
  console.log('📋 Các bước tiếp theo:');
  console.log('');
  console.log('🔧 Để hoàn thành setup:');
  console.log('');
  console.log('1. **Facebook OAuth:**');
  console.log('   - Vào: https://developers.facebook.com/apps/1731268644198831/fb-login/settings/');
  console.log('   - Thêm redirect URI: https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback');
  console.log('   - Lấy App Secret và nhập vào Supabase Dashboard');
  console.log('');
  console.log('2. **Google OAuth:**');
  console.log('   - Vào: https://console.cloud.google.com/apis/credentials');
  console.log('   - Tạo OAuth 2.0 Client ID');
  console.log('   - Thêm redirect URI: https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback');
  console.log('   - Nhập Client ID và Secret vào Supabase Dashboard');
  console.log('');
  console.log('3. **Supabase Dashboard:**');
  console.log('   - Vào: https://app.supabase.com/project/yxzvjlcyfcjcksrjjmmi/auth/providers');
  console.log('   - Enable Facebook và Google providers');
  console.log('   - Nhập credentials từ các bước trên');
  console.log('');
  console.log('4. **Test:**');
  console.log('   - Rebuild app: npx expo run:android');
  console.log('   - Test trên thiết bị thật');
  console.log('');
  
  console.log('🎯 Sau khi hoàn thành, cả Facebook và Google OAuth sẽ hoạt động!');
}

checkOAuthConfiguration();