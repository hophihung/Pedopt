#!/usr/bin/env node

// Script để test deep link manually
const { execSync } = require('child_process');

console.log('🔧 Testing Deep Link for OAuth Callback');
console.log('=====================================');

const testUrl = 'petadoption://auth/callback#access_token=test123&token_type=Bearer&expires_in=3600';

try {
  console.log('📱 Testing deep link:', testUrl);
  
  // Test trên Android (cần device/emulator đang chạy)
  const command = `adb shell am start -W -a android.intent.action.VIEW -d "${testUrl}" com.petadoption.app`;
  
  console.log('🚀 Executing command:', command);
  
  const result = execSync(command, { encoding: 'utf8' });
  console.log('✅ Command result:', result);
  
  console.log('');
  console.log('📋 Kiểm tra Metro console để xem logs:');
  console.log('- 🔗 Deep link received: petadoption://auth/callback#...');
  console.log('- ✅ OAuth callback detected!');
  console.log('- 📋 Full callback URL: ...');
  console.log('- 🔍 Hash parameters: ...');
  
} catch (error) {
  console.error('❌ Error testing deep link:', error.message);
  console.log('');
  console.log('💡 Possible issues:');
  console.log('- Android device/emulator not connected');
  console.log('- App not installed or wrong package name');
  console.log('- ADB not in PATH');
  console.log('');
  console.log('🔧 Manual test:');
  console.log('1. Open app on device');
  console.log('2. Run: adb shell am start -W -a android.intent.action.VIEW -d "petadoption://auth/callback#test=123" com.petadoption.app');
  console.log('3. Check Metro console for logs');
}