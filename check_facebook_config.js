const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkFacebookConfig() {
  console.log('🔍 Checking Facebook OAuth configuration...');
  
  try {
    // Test Facebook OAuth URL generation
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: 'petadoption://auth/callback',
      }
    });
    
    if (error) {
      console.log('❌ Facebook OAuth Error:', error.message);
      
      if (error.message.includes('Provider not found')) {
        console.log('');
        console.log('🚨 Facebook provider is not enabled in Supabase!');
        console.log('');
        console.log('📋 To fix this:');
        console.log('1. Go to Supabase Dashboard → Authentication → Providers');
        console.log('2. Enable Facebook provider');
        console.log('3. Add Facebook App ID and App Secret');
        console.log('4. Set redirect URL to: https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback');
      } else if (error.message.includes('Invalid redirect')) {
        console.log('');
        console.log('🚨 Invalid redirect URL configuration!');
        console.log('');
        console.log('📋 To fix this:');
        console.log('1. Check Facebook App Settings → Facebook Login → Valid OAuth Redirect URIs');
        console.log('2. Add: https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback');
      }
    } else {
      console.log('✅ Facebook OAuth URL generated successfully!');
      console.log('🔗 OAuth URL:', data.url);
      
      if (data.url) {
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Add Facebook App ID to app.json');
        console.log('2. Configure Facebook App Settings');
        console.log('3. Test on real device (not simulator)');
      }
    }
    
    // Check current app.json for Facebook config
    const fs = require('fs');
    const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
    
    console.log('');
    console.log('📱 Checking app.json configuration...');
    
    const hasExpoFacebook = appJson.expo.plugins?.some(plugin => 
      Array.isArray(plugin) ? plugin[0] === 'expo-facebook' : plugin === 'expo-facebook'
    );
    
    if (hasExpoFacebook) {
      console.log('✅ expo-facebook plugin found in app.json');
    } else {
      console.log('❌ expo-facebook plugin NOT found in app.json');
      console.log('');
      console.log('📋 Add this to app.json plugins:');
      console.log(`[
  "expo-facebook",
  {
    "appId": "YOUR_FACEBOOK_APP_ID",
    "clientToken": "YOUR_FACEBOOK_CLIENT_TOKEN",
    "displayName": "Pet Adoption"
  }
]`);
    }
    
    // Check URL schemes
    const iosSchemes = appJson.expo.ios?.infoPlist?.CFBundleURLTypes?.[0]?.CFBundleURLSchemes || [];
    const androidIntents = appJson.expo.android?.intentFilters?.[0]?.data || [];
    
    console.log('');
    console.log('🔗 URL Schemes:');
    console.log('iOS schemes:', iosSchemes);
    console.log('Android schemes:', androidIntents.map(d => d.scheme));
    
    const hasFacebookScheme = iosSchemes.some(scheme => scheme.startsWith('fb')) ||
                             androidIntents.some(intent => intent.scheme?.startsWith('fb'));
    
    if (!hasFacebookScheme) {
      console.log('⚠️  Facebook URL scheme (fb{APP_ID}) not found');
      console.log('   Add fb{YOUR_FACEBOOK_APP_ID} to URL schemes');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkFacebookConfig();