const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔑 Creating Debug Keystore & Getting SHA-1');
console.log('==========================================');
console.log('');

const homeDir = os.homedir();
const androidDir = path.join(homeDir, '.android');
const debugKeystorePath = path.join(androidDir, 'debug.keystore');

console.log('📱 App Information:');
console.log('   Package Name: com.petadoption.app');
console.log('   Debug Keystore Path:', debugKeystorePath);
console.log('');

// Check if .android directory exists
if (!fs.existsSync(androidDir)) {
  console.log('📁 Creating .android directory...');
  fs.mkdirSync(androidDir, { recursive: true });
  console.log('✅ .android directory created');
}

// Check if debug keystore exists
if (!fs.existsSync(debugKeystorePath)) {
  console.log('🔐 Debug keystore not found. Creating new debug keystore...');
  console.log('');
  
  try {
    // Create debug keystore
    const createKeystoreCommand = `keytool -genkey -v -keystore "${debugKeystorePath}" -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Android Debug,O=Android,C=US"`;
    
    console.log('📋 Creating keystore with command:');
    console.log('   keytool -genkey -v -keystore [path] -alias androiddebugkey ...');
    console.log('');
    
    execSync(createKeystoreCommand, { stdio: 'inherit' });
    console.log('✅ Debug keystore created successfully!');
    console.log('');
    
  } catch (error) {
    console.log('❌ Error creating debug keystore:', error.message);
    console.log('');
    console.log('💡 Alternative: Build Android app first');
    console.log('   npx expo run:android');
    console.log('   This will automatically create the debug keystore');
    console.log('');
    return;
  }
} else {
  console.log('✅ Debug keystore already exists');
  console.log('');
}

// Get SHA-1 from keystore
console.log('🔍 Getting SHA-1 fingerprint...');
console.log('');

try {
  const listKeystoreCommand = `keytool -keystore "${debugKeystorePath}" -list -v -alias androiddebugkey -storepass android`;
  
  const output = execSync(listKeystoreCommand, { encoding: 'utf8' });
  
  // Extract SHA-1 and SHA-256
  const sha1Match = output.match(/SHA1:\s*([A-F0-9:]+)/i);
  const sha256Match = output.match(/SHA256:\s*([A-F0-9:]+)/i);
  const md5Match = output.match(/MD5:\s*([A-F0-9:]+)/i);
  
  console.log('🎯 KEYSTORE INFORMATION:');
  console.log('========================');
  console.log('');
  console.log('📱 Package Name: com.petadoption.app');
  console.log('');
  
  if (sha1Match) {
    console.log('🔑 SHA-1 Fingerprint:');
    console.log('   ' + sha1Match[1]);
    console.log('');
  }
  
  if (sha256Match) {
    console.log('🔐 SHA-256 Fingerprint:');
    console.log('   ' + sha256Match[1]);
    console.log('');
  }
  
  if (md5Match) {
    console.log('🔒 MD5 Fingerprint:');
    console.log('   ' + md5Match[1]);
    console.log('');
  }
  
  console.log('📋 FOR FACEBOOK DEVELOPER CONSOLE:');
  console.log('==================================');
  console.log('');
  console.log('1. Go to: https://developers.facebook.com/apps/1731268644198831/settings/basic/');
  console.log('2. Scroll to "Android" section');
  console.log('3. Add Package Name: com.petadoption.app');
  console.log('4. Add Class Name: com.petadoption.app.MainActivity');
  if (sha1Match) {
    console.log('5. Add Key Hash (SHA-1): ' + sha1Match[1]);
  }
  console.log('');
  
  console.log('📋 FOR GOOGLE CLOUD CONSOLE:');
  console.log('============================');
  console.log('');
  console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
  console.log('2. Create OAuth 2.0 Client ID for Android');
  console.log('3. Add Package Name: com.petadoption.app');
  if (sha1Match) {
    console.log('4. Add SHA-1 Certificate Fingerprint: ' + sha1Match[1]);
  }
  console.log('');
  
  console.log('🚀 NEXT STEPS:');
  console.log('==============');
  console.log('');
  console.log('1. ✅ Copy the information above');
  console.log('2. 🌐 Add to Facebook Developer Console');
  console.log('3. 🌐 Add to Google Cloud Console');
  console.log('4. 🔧 Configure OAuth redirect URIs');
  console.log('5. 📱 Build and test on real Android device');
  console.log('');
  console.log('💡 Remember: OAuth only works on real devices, not emulators!');
  
} catch (error) {
  console.log('❌ Error getting keystore info:', error.message);
  console.log('');
  console.log('🔧 Troubleshooting:');
  console.log('   1. Make sure Java JDK is installed');
  console.log('   2. Make sure keytool is in PATH');
  console.log('   3. Try running as Administrator');
  console.log('   4. Or build Android app first: npx expo run:android');
}