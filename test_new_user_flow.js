const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function testNewUserFlow() {
  console.log('🧪 Testing new user registration flow...');
  
  try {
    // 1. Tạo user mới
    const testEmail = `test_user_${Date.now()}@example.com`;
    console.log(`📧 Creating test user: ${testEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        data: {
          full_name: 'Test User'
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
    
    // 2. Đợi một chút để trigger chạy (nếu có)
    console.log('⏳ Waiting 3 seconds for any auto-triggers...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. Kiểm tra xem có profile tự động được tạo không
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user.id)
      .maybeSingle();
    
    if (profileError) {
      console.log('❌ Error checking profile:', profileError.message);
      return;
    }
    
    if (profile) {
      console.log('🚨 AUTO-PROFILE DETECTED!');
      console.log('   Profile was automatically created with:');
      console.log('   - ID:', profile.id);
      console.log('   - Role:', profile.role);
      console.log('   - Email:', profile.email);
      console.log('   - Full Name:', profile.full_name);
      console.log('   - Created At:', profile.created_at);
      console.log('');
      
      if (profile.role === 'seller') {
        console.log('🚨🚨 CRITICAL ISSUE: User was automatically assigned SELLER role!');
        console.log('   This is the bug you mentioned - users are getting seller role without choosing it.');
      } else if (profile.role === 'user') {
        console.log('⚠️  User was automatically assigned USER role (default)');
        console.log('   This means auto-profile creation is still active.');
      } else {
        console.log('❓ User was assigned unknown role:', profile.role);
      }
    } else {
      console.log('✅ No auto-profile creation detected');
      console.log('   User will need to go through role selection screen');
      console.log('   This is the correct behavior!');
    }
    
    // 4. Cleanup - xóa test user (chỉ có thể làm với service role key)
    console.log('');
    console.log('🗑️  Note: Test user cleanup requires service role key');
    console.log('   You may need to manually delete user:', testEmail);
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

testNewUserFlow();