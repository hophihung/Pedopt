const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function testSubscriptionIdInProfiles() {
  console.log('🧪 Testing subscription_id in profiles table...');
  
  try {
    // 1. Đăng nhập với user thực tế
    console.log('🔐 Signing in...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'cuteeeehotme2005@gmail.com',
      password: 'Vyvy2005'
    });
    
    if (signInError) {
      console.log('❌ Error signing in:', signInError.message);
      return;
    }
    
    console.log('✅ Signed in successfully');
    
    // 2. Kiểm tra profile có subscription_id không
    console.log('');
    console.log('🔍 Checking profile.subscription_id...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, subscription_id')
      .eq('id', signInData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Error fetching profile:', profileError.message);
      return;
    }
    
    console.log('📋 Profile info:');
    console.log(`   • ID: ${profile.id}`);
    console.log(`   • Email: ${profile.email}`);
    console.log(`   • Subscription ID: ${profile.subscription_id || 'NULL'}`);
    
    // 3. Kiểm tra subscription tương ứng
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();
    
    if (subError) {
      console.log('❌ Error fetching subscription:', subError.message);
      return;
    }
    
    if (subscription) {
      console.log('');
      console.log('📋 Subscription info:');
      console.log(`   • ID: ${subscription.id}`);
      console.log(`   • Plan: ${subscription.plan}`);
      console.log(`   • Status: ${subscription.status}`);
      
      // 4. Kiểm tra consistency
      if (profile.subscription_id === subscription.id) {
        console.log('');
        console.log('🎉 PERFECT! Profile.subscription_id matches subscription.id');
        console.log('✅ Database consistency is maintained');
      } else if (profile.subscription_id === null) {
        console.log('');
        console.log('❌ Profile.subscription_id is NULL but subscription exists');
        console.log('💡 Need to run migration 048 to fix this');
        console.log('');
        console.log('🛠️  Expected after migration 048:');
        console.log(`   • Profile.subscription_id should be: ${subscription.id}`);
        console.log('   • Automatic sync between profiles and subscriptions');
      } else {
        console.log('');
        console.log('⚠️  Profile.subscription_id does not match subscription.id');
        console.log(`   • Profile has: ${profile.subscription_id}`);
        console.log(`   • Subscription is: ${subscription.id}`);
      }
    } else {
      console.log('');
      console.log('❌ No subscription found for this profile');
    }
    
    // 5. Test với tất cả profiles
    console.log('');
    console.log('📊 Checking all profiles subscription_id status...');
    
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, email, subscription_id')
      .limit(10);
    
    if (!allProfilesError && allProfiles) {
      console.log('');
      console.log('📋 All profiles subscription_id status:');
      
      let nullCount = 0;
      let hasIdCount = 0;
      
      for (const p of allProfiles) {
        if (p.subscription_id) {
          hasIdCount++;
          console.log(`   ✅ ${p.email}: ${p.subscription_id.substring(0, 8)}...`);
        } else {
          nullCount++;
          console.log(`   ❌ ${p.email}: NULL`);
        }
      }
      
      console.log('');
      console.log('📈 Summary:');
      console.log(`   • Profiles with subscription_id: ${hasIdCount}`);
      console.log(`   • Profiles with NULL subscription_id: ${nullCount}`);
      
      if (nullCount > 0) {
        console.log('');
        console.log('💡 To fix NULL subscription_id:');
        console.log('1. Run migration 048 in Supabase Dashboard');
        console.log('2. This will add subscription_id column to profiles');
        console.log('3. Auto-sync existing subscriptions');
        console.log('4. Create triggers for future consistency');
      } else {
        console.log('');
        console.log('🎉 All profiles have subscription_id!');
        console.log('✅ System is working perfectly');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await supabase.auth.signOut();
  }
}

testSubscriptionIdInProfiles();