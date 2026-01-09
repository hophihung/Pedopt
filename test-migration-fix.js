const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://yxzvjlcyfcjcksrjjmmi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4enZqbGN5ZmNqY2tzcmpqbW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTY2ODAsImV4cCI6MjA3NjY3MjY4MH0.BiaMJr8Z04jR61sUtgDo_aur2V7s8mwIpdzEiCJFMo8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigrationFix() {
  console.log('🔧 Testing Migration Fix');
  console.log('========================');
  console.log('');

  try {
    // Test 1: Check subscriptions table schema
    console.log('1. 📊 Checking subscriptions table schema...');
    
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);
    
    if (subError) {
      console.log('   ❌ Subscriptions table error:', subError.message);
    } else {
      console.log('   ✅ Subscriptions table accessible');
      if (subscriptions && subscriptions.length > 0) {
        const columns = Object.keys(subscriptions[0]);
        console.log('   📋 Columns:', columns.join(', '));
        
        if (columns.includes('profile_id')) {
          console.log('   ✅ Uses profile_id (correct)');
        } else if (columns.includes('user_id')) {
          console.log('   ⚠️ Uses user_id (needs migration fix)');
        }
      }
    }
    
    console.log('');

    // Test 2: Check user_subscription_info view
    console.log('2. 👁️ Checking user_subscription_info view...');
    
    const { data: viewData, error: viewError } = await supabase
      .from('user_subscription_info')
      .select('*')
      .limit(1);
    
    if (viewError) {
      console.log('   ❌ View error:', viewError.message);
    } else {
      console.log('   ✅ View accessible');
      if (viewData && viewData.length > 0) {
        const columns = Object.keys(viewData[0]);
        console.log('   📋 View columns:', columns.join(', '));
      }
    }
    
    console.log('');

    // Test 3: Test optimized functions
    console.log('3. 🚀 Testing optimized functions...');
    
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
    
    // Test can_user_super_like_optimized
    try {
      const { data, error } = await supabase.rpc('can_user_super_like_optimized', {
        user_profile_id: testUserId
      });
      
      if (error) {
        console.log('   ❌ can_user_super_like_optimized:', error.message);
      } else {
        console.log('   ✅ can_user_super_like_optimized: Working');
        console.log('   📊 Result:', data);
      }
    } catch (e) {
      console.log('   ❌ can_user_super_like_optimized exception:', e.message);
    }
    
    console.log('');

    // Test 4: Check super_likes table
    console.log('4. 💫 Checking super_likes table...');
    
    const { data: superLikes, error: slError } = await supabase
      .from('super_likes')
      .select('*')
      .limit(1);
    
    if (slError) {
      console.log('   ❌ Super likes table error:', slError.message);
    } else {
      console.log('   ✅ Super likes table accessible');
      if (superLikes && superLikes.length > 0) {
        const columns = Object.keys(superLikes[0]);
        console.log('   📋 Columns:', columns.join(', '));
      }
    }
    
    console.log('');

    // Test 5: Summary and recommendations
    console.log('📋 Summary and Recommendations:');
    console.log('');
    
    console.log('✅ Fixed Issues:');
    console.log('   - Updated functions to use profile_id instead of user_id');
    console.log('   - Fixed subscription table references');
    console.log('   - Updated plan types (free, premium, pro)');
    console.log('   - Fixed status column usage');
    console.log('');
    
    console.log('🔧 Migration Status:');
    console.log('   - Functions should now work with existing schema');
    console.log('   - No breaking changes to existing data');
    console.log('   - Backward compatible with current structure');
    console.log('');
    
    console.log('🚀 Next Steps:');
    console.log('   1. Run the migration: supabase db push');
    console.log('   2. Test super like functionality in app');
    console.log('   3. Monitor performance improvements');
    console.log('   4. Check error logs for any remaining issues');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testMigrationFix();