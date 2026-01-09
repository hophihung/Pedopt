const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupFacebookOAuth() {
  console.log('🔧 Facebook OAuth Setup Tool');
  console.log('=============================');
  console.log('');
  
  console.log('📋 Before starting, make sure you have:');
  console.log('1. Created a Facebook App at https://developers.facebook.com/');
  console.log('2. Added "Facebook Login" product to your app');
  console.log('3. Got your App ID and App Secret');
  console.log('');
  
  const proceed = await question('Do you want to continue? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('Setup cancelled.');
    rl.close();
    return;
  }
  
  console.log('');
  const appId = await question('Enter your Facebook App ID: ');
  const clientToken = await question('Enter your Facebook Client Token (optional, press Enter to skip): ');
  
  if (!appId) {
    console.log('❌ Facebook App ID is required!');
    rl.close();
    return;
  }
  
  console.log('');
  console.log('🔧 Updating app.json...');
  
  try {
    // Read current app.json
    const appJsonPath = './app.json';
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Add expo-facebook plugin
    const facebookPlugin = [
      'expo-facebook',
      {
        appId: appId,
        clientToken: clientToken || undefined,
        displayName: 'Pet Adoption',
        scheme: `fb${appId}`,
        advertiserIDCollectionEnabled: false,
        autoLogAppEventsEnabled: false,
        isAutoInitEnabled: true,
        iosUserTrackingPermission: 'This identifier will be used to deliver personalized ads to you.'
      }
    ];
    
    // Remove existing expo-facebook plugin if exists
    appJson.expo.plugins = appJson.expo.plugins.filter(plugin => {
      if (Array.isArray(plugin)) {
        return plugin[0] !== 'expo-facebook';
      }
      return plugin !== 'expo-facebook';
    });
    
    // Add new expo-facebook plugin
    const insertIndex = appJson.expo.plugins.findIndex(plugin => 
      Array.isArray(plugin) && plugin[0] === 'expo-web-browser'
    );
    
    if (insertIndex !== -1) {
      appJson.expo.plugins.splice(insertIndex, 0, facebookPlugin);
    } else {
      appJson.expo.plugins.push(facebookPlugin);
    }
    
    // Update iOS URL schemes
    if (!appJson.expo.ios.infoPlist.CFBundleURLTypes[0].CFBundleURLSchemes.includes(`fb${appId}`)) {
      appJson.expo.ios.infoPlist.CFBundleURLTypes[0].CFBundleURLSchemes.push(`fb${appId}`);
    }
    
    // Update Android intent filters
    const androidData = appJson.expo.android.intentFilters[0].data;
    if (!androidData.some(d => d.scheme === `fb${appId}`)) {
      androidData.push({ scheme: `fb${appId}` });
    }
    
    // Write updated app.json
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    
    console.log('✅ app.json updated successfully!');
    console.log('');
    
    // Show next steps
    console.log('📋 Next steps:');
    console.log('');
    console.log('1. 🌐 Configure Facebook App Settings:');
    console.log('   - Go to https://developers.facebook.com/apps/' + appId + '/fb-login/settings/');
    console.log('   - Add Valid OAuth Redirect URIs:');
    console.log('     https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback');
    console.log('');
    console.log('2. 🔧 Configure Supabase Dashboard:');
    console.log('   - Go to Supabase Dashboard → Authentication → Providers');
    console.log('   - Enable Facebook provider');
    console.log('   - Enter Facebook App ID: ' + appId);
    console.log('   - Enter Facebook App Secret: [GET FROM FACEBOOK APP SETTINGS]');
    console.log('');
    console.log('3. 📱 Test the integration:');
    console.log('   - Run: npx expo run:android or npx expo run:ios');
    console.log('   - Test Facebook login on a real device (not simulator)');
    console.log('');
    console.log('4. 🚀 For production:');
    console.log('   - Submit Facebook app for review');
    console.log('   - Enable "public_profile" and "email" permissions');
    console.log('   - Set app to "Live" mode');
    console.log('');
    
    console.log('🎉 Facebook OAuth setup completed!');
    
  } catch (error) {
    console.error('❌ Error updating app.json:', error.message);
  }
  
  rl.close();
}

setupFacebookOAuth();