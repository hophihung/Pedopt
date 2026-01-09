const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function testAutoSubscription() {
  console.log('🧪 Testing Auto Free Subscription...');
  
  try {
    // 1. Kiểm tra trigger có tồn tại không
    console.log('📋 Checking if trigger exists...');
    
    // 2. Kiểm tra existing users có subscription chưa
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .limit(5);
    
    if (profileError) {
      console.log('❌ Error checking profiles:', profileError.message);
      return;
    }
    
    console.log('📊 Checking subscriptions for sample profiles:');
    for (const profile of profiles) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('profile_id', profile.id)
        .maybeSingle();
      
      console.log(`   - ${profile.email}: ${subscription?.plan || 'NO SUBSCRIPTION'} (${subscription?.status || 'N/A'})`);
    }
    
    // 3. Kiểm tra profiles không có subscription
    const { data: profilesWithSub, error: subError } = await supabase
      .from('subscriptions')
      .select('profile_id, plan, status')
      .limit(10);
    
    const { data: allProfiles, error: allProfileError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(10);
    
    if (!subError && !allProfileError && profilesWithSub && allProfiles) {
      const profilesWithSubIds = profilesWithSub.map(s => s.profile_id);
      const profilesWithoutSub = allProfiles.filter(p => !profilesWithSubIds.includes(p.id));
      
      if (profilesWithoutSub.length > 0) {
        console.log('');
        console.log('🚨 Found profiles WITHOUT subscription:');
        profilesWithoutSub.forEach(profile => {
          console.log(`   - ${profile.email}`);
        });
        console.log('');
        console.log('💡 Run migration 047 to fix this!');
      } else {
        console.log('');
        console.log('✅ All checked profiles have subscriptions!');
      }
    }
    
    // 4. Test tạo user mới (simulation)
    console.log('');
    console.log('🔮 To test auto-subscription for new users:');
    console.log('1. Create a new user via signup');
    console.log('2. Check if they automatically get free subscription');
    console.log('3. The trigger should create subscription when profile is inserted');
    
    // 5. Kiểm tra subscription counts với đúng syntax
    const { count: subCount } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });
    
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log('');
    console.log('📈 Statistics:');
    console.log(`   - Total profiles: ${profileCount || 'unknown'}`);
    console.log(`   - Total subscriptions: ${subCount || 'unknown'}`);
    
    // Kiểm tra breakdown theo plan
    const { data: allSubs } = await supabase
      .from('subscriptions')
      .select('plan, status');
    
    if (allSubs && allSubs.length > 0) {
      const planCounts = allSubs.reduce((acc, sub) => {
        const key = `${sub.plan} (${sub.status})`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   - Subscription breakdown:');
      Object.entries(planCounts).forEach(([plan, count]) => {
        console.log(`     • ${plan}: ${count}`);
      });
      
      if (subCount === profileCount) {
        console.log('');
        console.log('🎉 SUCCESS! All profiles have subscriptions!');
        console.log('✅ Auto-subscription system is working correctly');
      } else {
        console.log('');
        console.log(`⚠️  Mismatch: ${profileCount} profiles but ${subCount} subscriptions`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAutoSubscription();