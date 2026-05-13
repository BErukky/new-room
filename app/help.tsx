import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../lib/LanguageContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    question: 'How do I personalize my feed?',
    answer: 'You can personalize your feed by selecting your favorite categories during onboarding or by updating your preferences in the Settings screen.'
  },
  {
    question: 'Can I read news offline?',
    answer: 'Yes! Any article you "Save" will be available for offline reading in your Saved Articles section.'
  },
  {
    question: 'How do I change the app language?',
    answer: 'Go to Settings > Language & Region to choose from our 11 supported global languages.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use Supabase for high-grade encryption and secure authentication to keep your personal information safe.'
  },
  {
    question: 'How do I report a bug?',
    answer: 'You can contact our support team directly at support@newsroom.com or through the feedback form in the Help Center.'
  }
];

export default function HelpCenterScreen() {
  const { t } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full bg-slate-50 dark:bg-slate-800">
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('help_center')}</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2">How can we help?</Text>
          <Text className="text-base text-slate-500 dark:text-slate-400">Search our FAQs or contact support for more assistance.</Text>
        </View>

        {/* FAQ Section */}
        <View className="mb-12">
          <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-1">Frequently Asked Questions</Text>
          
          <View className="space-y-4">
            {FAQS.map((faq, index) => (
              <TouchableOpacity 
                key={index}
                onPress={() => toggleExpand(index)}
                activeOpacity={0.7}
                className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700"
              >
                <View className="flex-row justify-between items-center">
                  <Text className="flex-1 text-lg font-bold text-slate-900 dark:text-white pr-4">{faq.question}</Text>
                  <Ionicons 
                    name={expandedIndex === index ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#3b82f6" 
                  />
                </View>
                {expandedIndex === index && (
                  <Text className="mt-4 text-slate-600 dark:text-slate-300 leading-6 text-base">
                    {faq.answer}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Support */}
        <View className="bg-blue-600 rounded-3xl p-6 mb-12 shadow-lg shadow-blue-500/20">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
              <Ionicons name="mail" size={24} color="#fff" />
            </View>
            <View>
              <Text className="text-xl font-bold text-white">Still need help?</Text>
              <Text className="text-blue-100">Our team is here to assist you.</Text>
            </View>
          </View>
          <TouchableOpacity className="bg-white py-4 rounded-2xl items-center">
            <Text className="text-blue-600 font-bold text-lg">Contact Support</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
