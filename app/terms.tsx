import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../lib/LanguageContext';

export default function TermsOfServiceScreen() {
  const { t } = useLanguage();

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing or using the Newsroom application, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the application.'
    },
    {
      title: '2. User Conduct',
      content: 'You are responsible for all activity that occurs under your account. You agree not to use the application for any unlawful purpose or any purpose prohibited under these terms.'
    },
    {
      title: '3. Privacy Policy',
      content: 'Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information when you use our application.'
    },
    {
      title: '4. Intellectual Property',
      content: 'The content provided through the Newsroom application is protected by copyright, trademark, and other laws. You may not modify, publish, or participate in the transfer or sale of such content.'
    },
    {
      title: '5. Limitation of Liability',
      content: 'Newsroom shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of the application.'
    },
    {
      title: '6. Changes to Terms',
      content: 'We reserve the right to modify these terms at any time. Your continued use of the application following the posting of changes constitutes your acceptance of such changes.'
    }
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full bg-slate-50 dark:bg-slate-800">
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('terms_service')}</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
        <View className="mb-10">
          <Text className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">Terms of Service</Text>
          <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Last Updated: May 11, 2026</Text>
        </View>

        <View className="space-y-10 pb-20">
          {sections.map((section, index) => (
            <View key={index}>
              <Text className="text-xl font-bold text-slate-900 dark:text-white mb-3">{section.title}</Text>
              <Text className="text-base text-slate-600 dark:text-slate-300 leading-7">
                {section.content}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
