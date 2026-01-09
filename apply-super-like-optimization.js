const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const supabaseUrl = 'https://yxzvjlcyfcjcksrjjmmi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4enZqbGN5ZmNqY2tzcmpqbW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTY2ODAsImV4cCI6MjA3NjY3MjY4MH0.BiaMJr8Z04jR61sUtgDo_aur2V7s8mwIpdzEiCJFMo8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySuperLikeOptimization() {
  console.log('🚀 Applying Super Like Optimization');
  console.log('===================================');
  console.log('');

  try {
    // Read the migration file
    const migrationPath = './supabase/migrations/056_optimize_super_like_functions.sql';
    
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Migration file not found:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded');
    console.log('');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    console.log('');

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length < 10) continue; // Skip very short statements
      
      console.log(`${i + 1}. Executing statement...`);
      
      try {
        // For CREATE FUNCTION statements, we need to use rpc
        if (statement.includes('CREATE OR REPLACE FUNCTION')) {
          const functionName = statement.match(/FUNCTION\s+(\w+)/i)?.[1];
          console.log(`   📝 Creating function: ${functionName}`);
        }
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (e) {
        console.log(`   ❌ Exception: ${e.message}`);
        errorCount++;
      }
    }

    console.log('');
    console.log('📊 Execution Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('');

    if (errorCount === 0) {
      console.log('🎉 All optimizations applied successfully!');
      console.log('');
      console.log('🧪 Testing optimized functions...');
      
      // Test the functions
      await testOptimizedFunctions();
    } else {
      console.log('⚠️ Some errors occurred. Please check the logs above.');
      console.log('');
      console.log('💡 Alternative approach:');
      console.log('   1. Use Supabase CLI: supabase db push');
      console.log('   2. Or apply functions manually in Supabase Dashboard');
    }

  } catch (error) {
    console.error('❌ Application error:', error);
  }
}

async function testOptimizedFunctions() {
  const testUserId = '00000000-0000-0000-0000-000000000000';
  
  try {
    // Test can_user_super_like_optimized
    const { data, error } = await supabase.rpc('can_user_super_like_optimized', {
      user_profile_id: testUserId
    });
    
    if (error) {
      console.log('❌ Function test failed:', error.message);
    } else {
      console.log('✅ Optimized functions working!');
      console.log('📊 Test result:', data);
    }
  } catch (e) {
    console.log('❌ Function test exception:', e.message);
  }
}

// Alternative: Manual function creation
async function createFunctionsManually() {
  console.log('🔧 Creating functions manually...');
  
  const functions = [
    {
      name: 'can_user_super_like_optimized',
      sql: `
        CREATE OR REPLACE FUNCTION can_user_super_like_optimized(user_profile_id UUID)
        RETURNS JSON
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            subscription_info RECORD;
            result JSON;
        BEGIN
            SELECT 
                s.plan as plan_type,
                s.super_likes_limit,
                s.super_likes_used,
                s.status = 'active' as is_active,
                (s.super_likes_limit - s.super_likes_used) as remaining
            INTO subscription_info
            FROM subscriptions s
            WHERE s.profile_id = user_profile_id 
            AND s.status = 'active'
            ORDER BY s.created_at DESC
            LIMIT 1;

            IF NOT FOUND THEN
                INSERT INTO subscriptions (
                    profile_id, plan, super_likes_limit, 
                    super_likes_used, status, start_date
                ) VALUES (
                    user_profile_id, 'free', 5, 0, 'active', NOW()
                );
                
                subscription_info.plan_type := 'free';
                subscription_info.super_likes_limit := 5;
                subscription_info.super_likes_used := 0;
                subscription_info.remaining := 5;
                subscription_info.is_active := true;
            END IF;

            result := json_build_object(
                'can_super_like', 
                CASE 
                    WHEN subscription_info.plan_type = 'pro' THEN true
                    WHEN subscription_info.remaining > 0 THEN true
                    ELSE false
                END,
                'remaining', 
                CASE 
                    WHEN subscription_info.plan_type = 'pro' THEN -1
                    ELSE subscription_info.remaining
                END,
                'limit_value', subscription_info.super_likes_limit,
                'plan_type', subscription_info.plan_type
            );

            RETURN result;
        END;
        $$;
      `
    }
  ];

  for (const func of functions) {
    try {
      console.log(`Creating ${func.name}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: func.sql });
      
      if (error) {
        console.log(`❌ ${func.name}: ${error.message}`);
      } else {
        console.log(`✅ ${func.name}: Created`);
      }
    } catch (e) {
      console.log(`❌ ${func.name}: ${e.message}`);
    }
  }
}

console.log('🔧 Super Like Optimization Tool');
console.log('================================');
console.log('');
console.log('Choose an option:');
console.log('1. Apply full migration (recommended)');
console.log('2. Create functions manually');
console.log('3. Test existing functions');
console.log('');

// For now, just run the full migration
applySuperLikeOptimization();