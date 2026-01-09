const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function runMigration047() {
  console.log('🚀 Running Migration 047: Auto Create Free Subscription...');
  
  try {
    // Đọc migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/047_auto_create_free_subscription.sql', 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('📝 Migration content preview:');
    console.log(migrationSQL.substring(0, 200) + '...');
    
    console.log('');
    console.log('⚠️  Note: This script cannot execute the migration directly');
    console.log('💡 To apply the migration:');
    console.log('');
    console.log('1. 🌐 Go to Supabase Dashboard');
    console.log('2. 📊 Navigate to SQL Editor');
    console.log('3. 📋 Copy and paste the migration content');
    console.log('4. ▶️  Run the SQL');
    console.log('');
    console.log('Or use Supabase CLI:');
    console.log('   npx supabase db push');
    console.log('');
    
    // Kiểm tra xem function đã tồn tại chưa
    console.log('🔍 Checking if migration components exist...');
    
    // Test function ensure_seller_has_subscription
    try {
      const { error } = await supabase
        .rpc('ensure_seller_has_subscription', { 
          user_profile_id: '00000000-0000-0000-0000-000000000000' 
        });
      
      if (error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('❌ Function ensure_seller_has_subscription does not exist');
          console.log('💡 Migration 047 needs to be applied');
        } else {
          console.log('✅ Function ensure_seller_has_subscription exists');
          console.log('   (Got error but function exists):', error.message);
        }
      } else {
        console.log('✅ Function ensure_seller_has_subscription works perfectly');
      }
    } catch (funcError) {
      console.log('⚠️  Cannot test function:', funcError.message);
    }
    
    // Hiển thị migration content để copy-paste
    console.log('');
    console.log('📋 MIGRATION CONTENT TO COPY-PASTE:');
    console.log('=' .repeat(60));
    console.log(migrationSQL);
    console.log('=' .repeat(60));
    
    console.log('');
    console.log('🎯 What this migration does:');
    console.log('✅ Creates auto_create_free_subscription() function');
    console.log('✅ Creates trigger on profiles table');
    console.log('✅ Auto-creates free subscription for new users');
    console.log('✅ Creates subscriptions for existing users without one');
    console.log('✅ Updates ensure_seller_has_subscription function');
    
    console.log('');
    console.log('🔮 After running this migration:');
    console.log('• All new users will automatically get free subscription');
    console.log('• Existing users without subscription will get one');
    console.log('• Trigger will fire on every new profile insert');
    console.log('• System will be fully automated');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runMigration047();