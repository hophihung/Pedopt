const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function testRealUserSubscription() {
  console.log('🧪 Testing Real User Subscription Status...');
  
  try {
    // 1. Đăng nhập với user thực tế
    console.log('🔐 Signing in with real user...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'cuteeeehotme2005@gmail.com',
      password: 'Vyvy2005'
    });
    
    if (signInError) {
      console.log('❌ Error signing in:', signInError.message);
      return;
    }
    
    console.log('✅ Signed in successfully!');
    console.log('👤 User ID:', signInData.user.id);
    console.log('📧 Email:', signInData.user.email);
    
    // 2. Kiểm tra subscription hiện tại
    console.log('');
    console.log('🔍 Checking current subscription...');
    
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', signInData.user.id)
      .maybeSingle();
    
    if (subError) {
      console.log('❌ Error checking subscription:', subError.message);
      return;
    }
    
    if (subscription) {
      console.log('✅ User HAS subscription:');
      console.log('📋 Subscription details:');
      console.log(`   • ID: ${subscription.id}`);
      console.log(`   • Plan: ${subscription.plan}`);
      console.log(`   • Status: ${subscription.status}`);
      console.log(`   • Super Likes Limit: ${subscription.super_likes_limit}`);
      console.log(`   • Super Likes Used: ${subscription.super_likes_used}`);
      console.log(`   • Start Date: ${subscription.start_date}`);
      console.log(`   • End Date: ${subscription.end_date || 'No expiry (free plan)'}`);
      console.log(`   • Created: ${subscription.created_at}`);
      console.log(`   • Updated: ${subscription.updated_at}`);
      
      console.log('');
      if (subscription.plan === 'free' && subscription.status === 'active') {
        console.log('🎉 PERFECT! User has active FREE subscription');
        console.log('✅ Auto-subscription system is working correctly');
      } else {
        console.log(`📊 User has ${subscription.plan} plan with ${subscription.status} status`);
      }
      
    } else {
      console.log('❌ User does NOT have subscription');
      console.log('');
      console.log('🛠️  Creating free subscription for this user...');
      
      // Tạo subscription cho user này
      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          profile_id: signInData.user.id,
          plan: 'free',
          status: 'active',
          start_date: new Date().toISOString(),
          super_likes_limit: 5,
          super_likes_used: 0
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Failed to create subscription:', createError.message);
        
        // Thử dùng function ensure_seller_has_subscription
        console.log('🔄 Trying with ensure_seller_has_subscription function...');
        
        const { error: funcError } = await supabase
          .rpc('ensure_seller_has_subscription', { 
            user_profile_id: signInData.user.id 
          });
        
        if (funcError) {
          console.log('❌ Function also failed:', funcError.message);
        } else {
          console.log('✅ Function succeeded! Checking subscription again...');
          
          // Kiểm tra lại
          const { data: newSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('profile_id', signInData.user.id)
            .maybeSingle();
          
          if (newSubscription) {
            console.log('🎉 SUCCESS! Subscription created via function:');
            console.log(`   • Plan: ${newSubscription.plan}`);
            console.log(`   • Status: ${newSubscription.status}`);
          }
        }
        
      } else {
        console.log('✅ Successfully created free subscription:');
        console.log(`   • ID: ${newSub.id}`);
        console.log(`   • Plan: ${newSub.plan}`);
        console.log(`   • Status: ${newSub.status}`);
      }
    }
    
    // 3. Test tạo user mới để xem trigger có hoạt động không
    console.log('');
    console.log('🧪 Testing trigger with new user creation...');
    
    const testEmail = `testuser${Date.now()}@gmail.com`;
    console.log(`📧 Creating new test user: ${testEmail}`);
    
    // Sign out current user first
    await supabase.auth.signOut();
    
    const { data: newUserData, error: newUserError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          full_name: 'Test User for Trigger'
        }
      }
    });
    
    if (newUserError) {
      console.log('❌ Error creating new user:', newUserError.message);
    } else if (newUserData.user) {
      console.log('✅ New user created:', newUserData.user.id);
      
      // Đợi trigger chạy
      console.log('⏳ Waiting 3 seconds for trigger...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Đăng nhập với user mới
      const { error: newSignInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'TestPassword123!'
      });
      
      if (!newSignInError) {
        // Kiểm tra subscription của user mới
        const { data: newUserSub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('profile_id', newUserData.user.id)
          .maybeSingle();
        
        if (newUserSub) {
          console.log('🎉 TRIGGER WORKS! New user automatically got subscription:');
          console.log(`   • Plan: ${newUserSub.plan}`);
          console.log(`   • Status: ${newUserSub.status}`);
          console.log('✅ Auto-subscription system is 100% functional!');
        } else {
          console.log('❌ Trigger did not create subscription for new user');
          console.log('💡 May need to run migration 047 or check trigger installation');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Sign out
    await supabase.auth.signOut();
    console.log('');
    console.log('🔓 Signed out');
  }
}

testRealUserSubscription();