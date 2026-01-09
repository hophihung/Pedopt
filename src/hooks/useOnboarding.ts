import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  role?: string;
  preferences?: any;
  onboarding_completed?: boolean;
}

export const useOnboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    checkOnboardingStatus();
  }, [user, authLoading]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get user profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Profile fetch result:', { profileData, error });

      // If no profile exists, create one and redirect to role selection
      if (error && error.code === 'PGRST116') {
        console.log('No profile found, redirecting to role selection');
        setNeedsOnboarding(true);
        router.replace('/onboarding/role-selection');
        return;
      }

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Check if user needs role selection
      const needsRoleSelection = !profileData?.role;
      
      console.log('Onboarding check:', {
        hasProfile: !!profileData,
        role: profileData?.role,
        needsRoleSelection,
      });
      
      setNeedsOnboarding(needsRoleSelection);

      // Auto-redirect to role selection if no role
      if (needsRoleSelection) {
        console.log('No role found, redirecting to role selection');
        router.replace('/onboarding/role-selection');
      } else {
        console.log('User has role:', profileData.role, '- onboarding complete');
      }

    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error completing onboarding:', error);
        return false;
      }

      setNeedsOnboarding(false);
      return true;
    } catch (error) {
      console.error('Error in completeOnboarding:', error);
      return false;
    }
  };

  return {
    profile,
    loading,
    needsOnboarding,
    checkOnboardingStatus,
    completeOnboarding,
  };
};