const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixGoogleRedirectURI() {
  console.log('🔧 Fix Google OAuth Redirect URI Mismatch');
  console.log('==========================================');
  console.log('');
  
  console.log('❌ Lỗi redirect_uri_mismatch xảy ra khi:');
  console.log('1. Redirect URI trong Google Console không khớp với app');
  console.log('2. Google Client ID chưa được cấu hình đúng');
  console.log('3. Supabase Auth settings chưa đúng');
  console.log('');
  
  // Kiểm tra cấu hình hiện tại
  console.log('🔍 Kiểm tra cấu hình hiện tại...');
  
  // Đọc Supabase URL từ .env
  let supabaseUrl = '';
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/);
    if (urlMatch) {
      supabaseUrl = urlMatch[1].trim();
      console.log('✅ Supabase URL:', supabaseUrl);
    }
  } catch (error) {
    console.log('❌ Không thể đọc file .env');
  }
  
  // Kiểm tra app scheme
  try {
    const appConfigContent = fs.readFileSync('app.config.js', 'utf8');
    const schemeMatch = appConfigContent.match(/scheme:\s*["']([^"']+)["']/);
    if (schemeMatch) {
      const appScheme = schemeMatch[1];
      console.log('✅ App scheme:', appScheme);
    }
  } catch (error) {
    console.log('❌ Không thể đọc app.config.js');
  }
  
  console.log('');
  console.log('📋 Các Redirect URI cần cấu hình trong Google Console:');
  console.log('');
  
  if (supabaseUrl) {
    const supabaseRedirectUri = `${supabaseUrl}/auth/v1/callback`;
    console.log('1. Supabase Redirect URI:');
    console.log(`   ${supabaseRedirectUri}`);
  }
  
  console.log('2. Mobile App Redirect URI:');
  console.log('   petadoption://auth/callback');
  console.log('');
  
  console.log('🔧 Hướng dẫn fix lỗi:');
  console.log('');
  
  console.log('BƯỚC 1: Cấu hình Google Cloud Console');
  console.log('--------------------------------------');
  console.log('1. Truy cập: https://console.cloud.google.com/apis/credentials');
  console.log('2. Chọn project của bạn');
  console.log('3. Click vào OAuth 2.0 Client ID đã tạo');
  console.log('4. Trong phần "Authorized redirect URIs", thêm:');
  if (supabaseUrl) {
    console.log(`   - ${supabaseUrl}/auth/v1/callback`);
  }
  console.log('   - petadoption://auth/callback');
  console.log('5. Click "Save"');
  console.log('');
  
  console.log('BƯỚC 2: Cấu hình Supabase Dashboard');
  console.log('------------------------------------');
  console.log('1. Truy cập: https://app.supabase.com/project/YOUR_PROJECT/auth/providers');
  console.log('2. Enable Google provider');
  console.log('3. Nhập Google Client ID và Client Secret');
  console.log('4. Trong "Redirect URL", đảm bảo có:');
  if (supabaseUrl) {
    console.log(`   ${supabaseUrl}/auth/v1/callback`);
  }
  console.log('');
  
  const hasClientId = await question('Bạn đã có Google Client ID chưa? (y/n): ');
  
  if (hasClientId.toLowerCase() === 'y') {
    const clientId = await question('Nhập Google Client ID: ');
    
    if (clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID') {
      console.log('');
      console.log('🔧 Cập nhật Google Auth Service...');
      
      try {
        // Đọc và cập nhật google-auth.service.ts
        const servicePath = 'src/features/auth/services/google-auth.service.ts';
        let serviceContent = fs.readFileSync(servicePath, 'utf8');
        
        // Thay thế placeholder bằng Client ID thực
        serviceContent = serviceContent.replace(
          'YOUR_GOOGLE_CLIENT_ID',
          clientId
        );
        
        fs.writeFileSync(servicePath, serviceContent);
        console.log('✅ Đã cập nhật Google Client ID trong service');
        
      } catch (error) {
        console.log('❌ Lỗi khi cập nhật service:', error.message);
      }
    }
  }
  
  console.log('');
  console.log('BƯỚC 3: Test cấu hình');
  console.log('---------------------');
  console.log('1. Chạy app trên thiết bị thật (không phải simulator)');
  console.log('2. Thử đăng nhập bằng Google');
  console.log('3. Kiểm tra console logs để debug');
  console.log('');
  
  console.log('🚨 LƯU Ý QUAN TRỌNG:');
  console.log('- Google OAuth chỉ hoạt động trên thiết bị thật, không phải simulator');
  console.log('- Đảm bảo app scheme "petadoption" được cấu hình đúng');
  console.log('- Kiểm tra Google+ API đã được enable trong Google Cloud Console');
  console.log('- Nếu vẫn lỗi, thử xóa cache: npx expo start --clear');
  console.log('');
  
  console.log('🎯 Các lỗi thường gặp và cách fix:');
  console.log('');
  console.log('1. "redirect_uri_mismatch":');
  console.log('   → Kiểm tra lại Redirect URIs trong Google Console');
  console.log('');
  console.log('2. "invalid_client":');
  console.log('   → Kiểm tra Client ID và Client Secret');
  console.log('');
  console.log('3. "access_denied":');
  console.log('   → User từ chối hoặc app chưa được verify');
  console.log('');
  
  const createDebugScript = await question('Tạo script debug Google OAuth? (y/n): ');
  
  if (createDebugScript.toLowerCase() === 'y') {
    const debugScript = `// Debug Google OAuth Configuration
console.log('🔍 Google OAuth Debug Info');
console.log('==========================');

// Check environment
console.log('Environment:', __DEV__ ? 'Development' : 'Production');

// Check Supabase URL
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);

// Check app scheme
import { Linking } from 'react-native';
console.log('App URL Scheme:', await Linking.getInitialURL());

// Check redirect URI
import * as AuthSession from 'expo-auth-session';
const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'petadoption',
  path: 'auth/callback',
});
console.log('Generated Redirect URI:', redirectUri);

// Expected redirect URIs
console.log('Expected Redirect URIs in Google Console:');
console.log('1.', '${supabaseUrl}/auth/v1/callback');
console.log('2.', 'petadoption://auth/callback');
`;

    fs.writeFileSync('debug-google-oauth-config.js', debugScript);
    console.log('✅ Đã tạo debug script: debug-google-oauth-config.js');
  }
  
  console.log('');
  console.log('🎉 Hoàn thành! Hãy làm theo các bước trên để fix lỗi redirect_uri_mismatch');
  
  rl.close();
}

fixGoogleRedirectURI();