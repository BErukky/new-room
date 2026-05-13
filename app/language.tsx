import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../lib/LanguageContext';
import { Language } from '../lib/translations';

const LANGUAGES: { id: Language; name: string; nativeName: string }[] = [
  { id: 'en', name: 'English', nativeName: 'English' },
  { id: 'zh', name: 'Chinese', nativeName: '中文' },
  { id: 'ko', name: 'Korean', nativeName: '한국어' },
  { id: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { id: 'de', name: 'German', nativeName: 'Deutsch' },
  { id: 'ru', name: 'Russian', nativeName: 'Русский' },
  { id: 'fr', name: 'French', nativeName: 'Français' },
  { id: 'es', name: 'Spanish', nativeName: 'Español' },
  { id: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { id: 'it', name: 'Italian', nativeName: 'Italiano' },
  { id: 'ja', name: 'Japanese', nativeName: '日本語' },
];

export default function LanguageScreen() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-slate-900">
      <View className="px-6 pt-4 pb-4 flex-row items-center border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('language_region')}</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4">
        <View className="bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden mb-12">
          {LANGUAGES.map((lang, index) => (
            <View key={lang.id}>
              <TouchableOpacity 
                onPress={() => setLanguage(lang.id)}
                className="flex-row items-center justify-between px-5 py-4 active:bg-slate-100 dark:active:bg-slate-700/50"
              >
                <View>
                  <Text className="font-bold text-slate-900 dark:text-white text-base">{lang.name}</Text>
                  <Text className="text-slate-500 text-xs mt-0.5">{lang.nativeName}</Text>
                </View>
                {language === lang.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                )}
                {language !== lang.id && (
                  <View className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-600" />
                )}
              </TouchableOpacity>
              {index < LANGUAGES.length - 1 && (
                <View className="h-[1px] bg-slate-200 dark:bg-slate-700 ml-5" />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
