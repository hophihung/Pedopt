const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function testTriggerFunctionality() {
  console.log('🧪 Testing Auto-Subscription Trigger Functionality...');
  
  try {
    // 1. Tạo test user mới
    const testEmail = `test_trigger_${Date.now()}@example.com`;
    console.log(`📧 Creating test user: ${testEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        data: {
          full_name: 'Test Trigger User'
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Error creating user:', signUpError.message);
      return;
    }
    
    if (!signUpData.user) {
      console.log('❌ No user data returned');
      return;
    }
    
    console.log('✅ User created successfully:', signUpData.user.id);
    
    // 2. Đợi một chút để trigger chạy
    console.log('⏳ Waiting 3 seconds for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. Đăng nhập với user mới để có session
    console.log('🔐 Signing in with new user...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'testpassword123'
    });
    
    if (signInError) {
      console.log('❌ Error signing in:', signInError.message);
      return;
    }
    
    console.log('✅ Signed in successfully');
    
    // 4. Kiểm tra xem có subscription tự động được tạo không
    console.log('🔍 Checking if subscription was auto-created...');
    
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', signUpData.user.id)
      .maybeSingle();
    
    if (subError) {
      console.log('❌ Error checking subscription:', subError.message);
      return;
    }
    
    if (subscription) {
      console.log('🎉 SUCCESS! Auto-subscription trigger is WORKING!');
      console.log('📋 Subscription details:');
      console.log(`   - ID: ${subscription.id}`);
      console.log(`   - Plan: ${subscription.plan}`);
      console.log(`   - Status: ${subscription.status}`);
      console.log(`   - Super Likes Limit: ${subscription.super_likes_limit}`);
      console.log(`   - Super Likes Used: ${subscription.super_likes_used}`);
      console.log(`   - Created: ${subscription.created_at}`);
      
      if (subscription.plan === 'free' && subscription.status === 'active') {
        console.log('');
        console.log('✅ PERFECT! New user automatically got FREE subscription');
        console.log('✅ Trigger is working exactly as expected');
      } else {
        console.log('');
        console.log('⚠️  Subscription created but with unexpected values');
      }
    } else {
      console.log('❌ FAILED! No subscription was auto-created');
      console.log('');
      console.log('🔧 Possible issues:');
      console.log('1. Trigger not installed - run migration 047');
      console.log('2. Function has errors');
      console.log('3. RLS blocking the insert');
      
      // Thử tạo subscription manually để test
      console.log('');
      console.log('🛠️  Trying to create subscription manually...');
      
      const { data: manualSub, error: manualError } = await supabase
        .from('subscriptions')
        .insert({
          profile_id: signUpData.user.id,
          plan: 'free',
          status: 'active',
          super_likes_limit: 5,
          super_likes_used: 0
        })
        .select()
        .single();
      
      if (manualError) {
        console.log('❌ Manual creation also failed:', manualError.message);
        console.log('   This suggests RLS or permission issues');
      } else {
        console.log('✅ Manual creation worked');
        console.log('   This suggests trigger is not firing');
      }
    }
    
    // 5. Cleanup - xóa test user
    console.log('');
    console.log('🗑️  Cleaning up test user...');
    
    const { error: deleteError } = await supabase.auth.admin.deleteUser(signUpData.user.id);
    if (deleteError) {
      console.log('⚠️  Could not delete test user (need service role key)');
      console.log('   Test user email:', testEmail);
    } else {
      console.log('✅ Test user cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

// Thêm function để test existing users
async function testExistingUsersSubscription() {
  console.log('');
  console.log('🔍 Testing existing users subscription status...');
  
  try {
    // Thử đăng nhập với user có sẵn
    const existingUsers = [
      'admin@gmail.com',
      'test@example.com',
      'user@test.com'
    ];
    
    for (const email of existingUsers) {
      console.log(`\n📧 Testing ${email}...`);
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'password123' // Thay bằng password thực tế
      });
      
      if (signInError) {
        console.log(`   ❌ Cannot sign in: ${signInError.message}`);
        continue;
      }
      
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, status, super_likes_limit')
        .eq('profile_id', signInData.user.id)
        .maybeSingle();
      
      if (subscription) {
        console.log(`   ✅ Has subscription: ${subscription.plan} (${subscription.status})`);
      } else {
        console.log(`   ❌ No subscription found`);
        
        // Thử tạo subscription cho user này
        console.log(`   🛠️  Creating subscription for existing user...`);
        
        const { error: createError } = await supabase
          .from('subscriptions')
          .insert({
            profile_id: signInData.user.id,
            plan: 'free',
            status: 'active',
            super_likes_limit: 5,
            super_likes_used: 0
          });
        
        if (createError) {
          console.log(`   ❌ Failed to create: ${createError.message}`);
        } else {
          console.log(`   ✅ Created free subscription`);
        }
      }
      
      // Sign out
      await supabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('❌ Error testing existing users:', error.message);
  }
}

// Chạy cả 2 tests
async function runAllTests() {
  await testTriggerFunctionality();
  await testExistingUsersSubscription();
  
  console.log('');
  console.log('🏁 Test completed!');
  console.log('');
  console.log('📋 Summary:');
  console.log('- If trigger works: New users get free subscription automatically');
  console.log('- If trigger fails: Need to run migration 047 or fix RLS');
  console.log('- Existing users: May need manual subscription creation');
}

runAllTests();