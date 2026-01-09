import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Check, Globe } from 'lucide-react-native';
import { Language } from '@/src/i18n';
import { colors } from '@/src/theme/colors';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface LanguageSelectorProps {
  onLanguageChange?: (language: Language) => void;
}

const LANGUAGES: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
];

export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const { language: selectedLanguage, setLanguage } = useLanguage();

  const handleSelectLanguage = async (language: Language) => {
    try {
      await setLanguage(language);
      onLanguageChange?.(language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Globe size={20} color={colors.primary} />
        <Text style={styles.title}>Ngôn ngữ</Text>
      </View>
      <ScrollView style={styles.languagesList} showsVerticalScrollIndicator={false}>
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                isSelected && styles.languageItemSelected,
              ]}
              onPress={() => handleSelectLanguage(lang.code)}
              activeOpacity={0.7}
            >
              <View style={styles.languageContent}>
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <View style={styles.languageInfo}>
                  <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
                    {lang.nativeName}
                  </Text>
                  <Text style={styles.languageCode}>{lang.name}</Text>
                </View>
              </View>
              {isSelected && (
                <View style={styles.checkIcon}>
                  <Check size={20} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  languagesList: {
    maxHeight: 200,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderLight,
    marginBottom: 12,
  },
  languageItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '10',
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  languageNameSelected: {
    color: colors.primary,
  },
  languageCode: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  checkIcon: {
    marginLeft: 12,
  },
});

