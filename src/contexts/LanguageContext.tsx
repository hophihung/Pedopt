import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18n, Language } from '@/src/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(I18n.getLanguage());

  // Load user's preferred language on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadUserLanguage();
    } else {
      // Reset to default when logged out
      const defaultLang: Language = 'vi';
      setLanguageState(defaultLang);
      I18n.setLanguage(defaultLang);
    }
  }, [user?.id]);

  const loadUserLanguage = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferred_language')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user language:', error);
        return;
      }

      if (data?.preferred_language) {
        const lang = data.preferred_language as Language;
        setLanguageState(lang);
        I18n.setLanguage(lang);
      } else {
        // Set default if no preference exists
        const defaultLang: Language = 'vi';
        setLanguageState(defaultLang);
        I18n.setLanguage(defaultLang);
      }
    } catch (error) {
      console.error('Error loading user language:', error);
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    I18n.setLanguage(newLanguage);

    // Save to database
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            preferred_language: newLanguage,
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error saving language preference:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error saving language preference:', error);
        throw error;
      }
    }
  };

  const t = (key: string, params?: Record<string, string>) => {
    return I18n.t(key, params);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

