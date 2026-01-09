const { execSync } = require('child_process');
const os = require('os');
const path = require('path');

console.log('🔑 Getting SHA-1 Fingerprint for Android');
console.log('========================================');
console.log('');

// Package name from app.json
const packageName = 'com.petadoption.app';
console.log('📱 Package Name:', packageName);
console.log('');

// Determine keystore paths based on OS
const homeDir = os.homedir();
let debugKeystorePath;
let productionKeystorePath;

if (os.platform() === 'win32') {
  debugKeystorePath = path.join(homeDir, '.android', 'debug.keystore');
  productionKeystorePath = path.join(process.cwd(), 'android', 'app', 'release.keystore');
} else {
  debugKeystorePath = path.join(homeDir, '.android', 'debug.keystore');
  productionKeystorePath = path.join(process.cwd(), 'android', 'app', 'release.keystore');
}

console.log('🔍 Keystore Paths:');
console.log('   Debug:', debugKeystorePath);
console.log('   Production:', productionKeystorePath);
console.log('');

function getKeystoreInfo(keystorePath, keystoreType = 'debug') {
  try {
    console.log(`🔐 Getting ${keystoreType} keystore info...`);
    
    const password = keystoreType === 'debug' ? 'android' : 'your-production-password';
    const alias = keystoreType === 'debug' ? 'androiddebugkey' : 'your-production-alias';
    
    // Command to get keystore info
    const command = `keytool -keystore "${keystorePath}" -list -v -alias ${alias} -storepass ${password}`;
    
    console.log('📋 Command to run:');
    console.log(`   ${command}`);
    console.log('');
    
    try {
      const output = execSync(command, { encoding: 'utf8' });
      
      // Extract SHA-1 from output
      const sha1Match = output.match(/SHA1:\s*([A-F0-9:]+)/i);
      const sha256Match = output.match(/SHA256:\s*([A-F0-9:]+)/i);
      
      if (sha1Match) {
        console.log(`✅ ${keystoreType.toUpperCase()} SHA-1:`, sha1Match[1]);
      }
      
      if (sha256Match) {
        console.log(`✅ ${keystoreType.toUpperCase()} SHA-256:`, sha256Match[1]);
      }
      
      return {
        sha1: sha1Match ? sha1Match[1] : null,
        sha256: sha256Match ? sha256Match[1] : null
      };
      
    } catch (execError) {
      if (execError.message.includes('keytool')) {
        console.log(`❌ keytool not found. Please install Java JDK.`);
      } else if (execError.message.includes('Keystore was tampered')) {
        console.log(`❌ Wrong password for ${keystoreType} keystore.`);
      } else if (execError.message.includes('does not exist')) {
        console.log(`❌ ${keystoreType} keystore not found at: ${keystorePath}`);
      } else {
        console.log(`❌ Error: ${execError.message}`);
      }
      return null;
    }
    
  } catch (error) {
    console.log(`❌ Error getting ${keystoreType} keystore info:`, error.message);
    return null;
  }
}

// Check if keytool is available
try {
  execSync('keytool -help', { stdio: 'ignore' });
  console.log('✅ keytool is available');
} catch (error) {
  console.log('❌ keytool not found. Please install Java JDK.');
  console.log('');
  console.log('💡 Installation:');
  console.log('   - Download Java JDK from Oracle or OpenJDK');
  console.log('   - Add JAVA_HOME to environment variables');
  console.log('   - Add %JAVA_HOME%\\bin to PATH');
  console.log('');
  process.exit(1);
}

console.log('');

// Get debug keystore info
const debugInfo = getKeystoreInfo(debugKeystorePath, 'debug');

console.log('');

// Try to get production keystore info (if exists)
const fs = require('fs');
if (fs.existsSync(productionKeystorePath)) {
  console.log('🔐 Production keystore found, attempting to get info...');
  console.log('⚠️  You will need to provide the production keystore password and alias.');
  // Uncomment the line below and provide correct password/alias for production
  // const productionInfo = getKeystoreInfo(productionKeystorePath, 'production');
} else {
  console.log('ℹ️  Production keystore not found (this is normal for development)');
}

console.log('');
console.log('📋 Summary for Facebook/Google OAuth Setup:');
console.log('==========================================');
console.log('');
console.log('📱 Package Name:', packageName);

if (debugInfo && debugInfo.sha1) {
  console.log('🔑 Debug SHA-1:', debugInfo.sha1);
  console.log('');
  console.log('🔧 Use these values in:');
  console.log('   - Facebook Developer Console');
  console.log('   - Google Cloud Console');
  console.log('   - Firebase Console (if using)');
} else {
  console.log('❌ Could not retrieve SHA-1 fingerprint');
  console.log('');
  console.log('💡 Manual steps:');
  console.log('   1. Open Command Prompt as Administrator');
  console.log('   2. Run the following command:');
  console.log('');
  console.log(`   keytool -keystore "${debugKeystorePath}" -list -v -alias androiddebugkey -storepass android`);
  console.log('');
  console.log('   3. Look for SHA1 in the output');
}

console.log('');
console.log('🚀 Next Steps:');
console.log('   1. Copy the Package Name and SHA-1');
console.log('   2. Add them to Facebook Developer Console');
console.log('   3. Add them to Google Cloud Console');
console.log('   4. Update OAuth redirect URIs');
console.log('   5. Test OAuth login on real device');