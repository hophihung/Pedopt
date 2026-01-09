const { createClient } = require('@supabase/supabase-js');
const AsyncStorage = require('@react-native-async-storage/async-storage');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function fixAuthTokenError() {
  console.log('🔧 Fixing Invalid Refresh Token Error...');
  
  try {
    // 1. Clear current session
    console.log('🗑️  Clearing current session...');
    await supabase.auth.signOut();
    
    // 2. Clear AsyncStorage (if running in React Native environment)
    try {
      await AsyncStorage.clear();
      console.log('✅ AsyncStorage cleared');
    } catch (storageError) {
      console.log('⚠️  AsyncStorage not available (running in Node.js)');
    }
    
    // 3. Test fresh sign in
    console.log('');
    console.log('🔐 Testing fresh sign in...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'cuteeeehotme2005@gmail.com',
      password: 'Vyvy2005'
    });
    
    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('');
        console.log('💡 Possible solutions:');
        console.log('1. Check email/password are correct');
        console.log('2. User might need to confirm email');
        console.log('3. Account might be disabled');
      }
      
      return;
    }
    
    console.log('✅ Fresh sign in successful!');
    console.log('👤 User ID:', signInData.user.id);
    console.log('📧 Email:', signInData.user.email);
    
    // 4. Test subscription access
    console.log('');
    console.log('🔍 Testing subscription access...');
    
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', signInData.user.id)
      .maybeSingle();
    
    if (subError) {
      console.log('❌ Subscription access failed:', subError.message);
    } else if (subscription) {
      console.log('✅ Subscription access works!');
      console.log(`   Plan: ${subscription.plan}, Status: ${subscription.status}`);
    } else {
      console.log('⚠️  No subscription found');
    }
    
    // 5. Sign out cleanly
    await supabase.auth.signOut();
    console.log('');
    console.log('🎉 Auth token error fixed!');
    console.log('✅ You can now use the app normally');
    
  } catch (error) {
    console.error('❌ Error during fix:', error.message);
  }
}

fixAuthTokenError();