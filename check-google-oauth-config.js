#!/usr/bin/env node

const fs = require('fs');

console.log('🔍 Kiểm tra cấu hình Google OAuth');
console.log('=================================');
console.log('');

// Kiểm tra .env file
let supabaseUrl = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].trim();
    console.log('✅ Supabase URL:', supabaseUrl);
  } else {
    console.log('❌ Không tìm thấy EXPO_PUBLIC_SUPABASE_URL trong .env');
  }
} catch (error) {
  console.log('❌ Không thể đọc file .env:', error.message);
}

// Kiểm tra app.config.js
let appScheme = '';
try {
  const appConfigContent = fs.readFileSync('app.config.js', 'utf8');
  const schemeMatch = appConfigContent.match(/scheme:\s*["']([^"']+)["']/);
  if (schemeMatch) {
    appScheme = schemeMatch[1];
    console.log('✅ App scheme:', appScheme);
  } else {
    console.log('❌ Không tìm thấy scheme trong app.config.js');
  }
} catch (error) {
  console.log('❌ Không thể đọc app.config.js:', error.message);
}

console.log('');
console.log('📋 Redirect URIs cần cấu hình trong Google Console:');
console.log('');

if (supabaseUrl) {
  console.log('1. Supabase Redirect URI:');
  console.log(`   ${supabaseUrl}/auth/v1/callback`);
  console.log('');
}

if (appScheme) {
  console.log('2. Mobile App Redirect URI:');
  console.log(`   ${appScheme}://auth/callback`);
  console.log('');
}

console.log('🔧 Các bước cần làm để fix lỗi redirect_uri_mismatch:');
console.log('');
console.log('1. Truy cập Google Cloud Console:');
console.log('   https://console.cloud.google.com/apis/credentials');
console.log('');
console.log('2. Chỉnh sửa OAuth 2.0 Client ID và thêm Redirect URIs:');
if (supabaseUrl) {
  console.log(`   - ${supabaseUrl}/auth/v1/callback`);
}
if (appScheme) {
  console.log(`   - ${appScheme}://auth/callback`);
}
console.log('');
console.log('3. Cấu hình Supabase Dashboard:');
console.log('   - Bật Google provider');
console.log('   - Nhập Client ID và Client Secret');
console.log('');
console.log('4. Test trên thiết bị thật (không phải simulator)');
console.log('');

// Kiểm tra Google Auth Service
try {
  const serviceContent = fs.readFileSync('src/features/auth/services/google-auth.service.ts', 'utf8');
  
  if (serviceContent.includes('YOUR_GOOGLE_CLIENT_ID')) {
    console.log('⚠️  Cảnh báo: Google Auth Service vẫn có placeholder Client ID');
    console.log('   Tuy nhiên, sử dụng Supabase OAuth nên không cần Client ID trong code');
  }
  
  if (serviceContent.includes('signInWithGoogleSupabase')) {
    console.log('✅ Google Auth Service đã được cấu hình để sử dụng Supabase OAuth');
  }
  
} catch (error) {
  console.log('❌ Không thể kiểm tra Google Auth Service:', error.message);
}

console.log('');
console.log('🎯 Lưu ý quan trọng:');
console.log('- Google OAuth chỉ hoạt động trên thiết bị thật');
console.log('- Đảm bảo Google+ API đã được enable');
console.log('- Kiểm tra OAuth consent screen đã được cấu hình');
console.log('- Nếu vẫn lỗi, thử clear cache: npx expo start --clear');
console.log('');
console.log('📖 Xem hướng dẫn chi tiết trong: GOOGLE_OAUTH_FIX_GUIDE.md');