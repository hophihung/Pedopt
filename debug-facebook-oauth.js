const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://yxzvjlcyfcjcksrjjmmi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4enZqbGN5ZmNqY2tzcmpqbW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTY2ODAsImV4cCI6MjA3NjY3MjY4MH0.BiaMJr8Z04jR61sUtgDo_aur2V7s8mwIpdzEiCJFMo8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFacebookOAuth() {
  console.log('🔧 Facebook OAuth Debug Tool');
  console.log('============================');
  console.log('');

  try {
    // Test Facebook OAuth configuration
    console.log('1. Testing Facebook OAuth configuration...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: 'petadoption://auth/callback',
      },
    });

    if (error) {
      console.error('❌ Facebook OAuth Error:', error);
      console.log('');
      console.log('🔧 Possible solutions:');
      console.log('1. Check if Facebook provider is enabled in Supabase Dashboard');
      console.log('2. Verify Facebook App ID and Secret in Supabase Auth settings');
      console.log('3. Ensure redirect URLs are configured correctly');
      console.log('');
      return;
    }

    if (data?.url) {
      console.log('✅ Facebook OAuth URL generated successfully');
      console.log('🔗 OAuth URL:', data.url);
      console.log('');
      
      // Parse the URL to check configuration
      const url = new URL(data.url);
      console.log('📋 OAuth Configuration:');
      console.log('- Provider:', url.hostname);
      console.log('- Client ID:', url.searchParams.get('client_id'));
      console.log('- Redirect URI:', url.searchParams.get('redirect_uri'));
      console.log('- Response Type:', url.searchParams.get('response_type'));
      console.log('- Scope:', url.searchParams.get('scope'));
      console.log('');
      
      console.log('✅ Facebook OAuth is properly configured!');
      console.log('');
      console.log('📱 Next steps:');
      console.log('1. Make sure Facebook App has these redirect URIs:');
      console.log('   - https://yxzvjlcyfcjcksrjjmmi.supabase.co/auth/v1/callback');
      console.log('   - petadoption://auth/callback');
      console.log('');
      console.log('2. Rebuild your app after app.json changes:');
      console.log('   npx expo run:android or npx expo run:ios');
      console.log('');
      console.log('3. Test on a real device (not simulator)');
      console.log('');
    } else {
      console.log('❌ No OAuth URL generated');
    }

  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

// Test Supabase connection first
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error && error.message !== 'Auth session missing!') {
      throw error;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing Supabase connection...');
  const connected = await testSupabaseConnection();
  
  if (connected) {
    console.log('');
    await debugFacebookOAuth();
  } else {
    console.log('');
    console.log('🔧 Please check your Supabase configuration');
  }
}

main();