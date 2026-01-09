const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupGoogleOAuth() {
  console.log('🔧 Google OAuth Setup Tool');
  console.log('============================');
  console.log('');
  
  console.log('📋 Before starting, make sure you have:');
  console.log('1. Created a Google Cloud Project at https://console.cloud.google.com/');
  console.log('2. Enabled Google+ API and Google Sign-In API');
  console.log('3. Created OAuth 2.0 credentials (Web application)');
  console.log('4. Got your Client ID and Client Secret');
  console.log('');
  
  const proceed = await question('Do you want to continue? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('Setup cancelled.');
    rl.close();
    return;
  }
  
  console.log('');
  const clientId = await question('Enter your Google OAuth Client ID: ');
  const clientSecret = await question('Enter your Google OAuth Client Secret: ');
  
  if (!clientId || !clientSecret) {
    console.log('❌ Google Client ID and Secret are required!');
    rl.close();
    return;
  }
  
  console.log('');
  console.log('🔧 Creating Google OAuth configuration...');
  
  try {
    // Create Google OAuth config file
    const googleConfig = {
      web: {
        client_id: clientId,
        client_secret: clientSecret,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        redirect_uris: [
          "https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback",
          "petadoption://auth/callback"
        ]
      }
    };
    
    // Write Google config
    fs.writeFileSync('./google-oauth-config.json', JSON.stringify(googleConfig, null, 2));
    
    console.log('✅ Google OAuth config created successfully!');
    console.log('');
    
    // Show next steps
    console.log('📋 Next steps:');
    console.log('');
    console.log('1. 🌐 Configure Google Cloud Console:');
    console.log('   - Go to https://console.cloud.google.com/apis/credentials');
    console.log('   - Edit your OAuth 2.0 Client ID');
    console.log('   - Add Authorized redirect URIs:');
    console.log('     https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback');
    console.log('     petadoption://auth/callback');
    console.log('');
    console.log('2. 🔧 Configure Supabase Dashboard:');
    console.log('   - Go to Supabase Dashboard → Authentication → Providers');
    console.log('   - Enable Google provider');
    console.log('   - Enter Google Client ID: ' + clientId);
    console.log('   - Enter Google Client Secret: ' + clientSecret);
    console.log('');
    console.log('3. 📱 Test the integration:');
    console.log('   - Run: npx expo run:android or npx expo run:ios');
    console.log('   - Test Google login on a real device');
    console.log('');
    console.log('4. 🚀 For production:');
    console.log('   - Verify domain ownership in Google Console');
    console.log('   - Submit OAuth consent screen for review if needed');
    console.log('   - Test with different Google accounts');
    console.log('');
    
    console.log('🎉 Google OAuth setup completed!');
    
  } catch (error) {
    console.error('❌ Error creating Google OAuth config:', error.message);
  }
  
  rl.close();
}

setupGoogleOAuth();