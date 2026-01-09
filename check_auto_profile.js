const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Sử dụng anon key để test cơ bản
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkAutoProfile() {
  try {
    console.log('🔍 Checking for auto-profile creation...');
    
    // Kiểm tra bằng cách xem có profile nào được tạo với role mặc định không
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, role, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Error checking profiles:', error.message);
      return;
    }
    
    console.log('📊 Recent profiles:');
    profiles.forEach(profile => {
      console.log(`   - ${profile.email}: ${profile.role} (${profile.created_at})`);
    });
    
    // Kiểm tra xem có profile nào có role = 'user' (default) mà không được chọn không
    const defaultRoleProfiles = profiles.filter(p => p.role === 'user');
    
    if (defaultRoleProfiles.length > 0) {
      console.log('');
      console.log('⚠️  Found profiles with default "user" role:');
      defaultRoleProfiles.forEach(profile => {
        console.log(`   - ${profile.email}: ${profile.role}`);
      });
      console.log('');
      console.log('🤔 This could indicate auto-profile creation OR users choosing "user" role.');
      console.log('💡 To be sure, check if users are going through role selection screen.');
    } else {
      console.log('');
      console.log('✅ No profiles with default role found recently.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAutoProfile();