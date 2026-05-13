import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../lib/LanguageContext';

export default function AboutScreen() {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full bg-slate-50 dark:bg-slate-800">
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('about')}</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="items-center py-16 bg-slate-50 dark:bg-slate-800/50">
          <View className="w-24 h-24 bg-blue-600 rounded-[32px] items-center justify-center shadow-xl shadow-blue-500/40 mb-6">
            <Ionicons name="newspaper" size={48} color="#fff" />
          </View>
          <Text className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">NEWSROOM</Text>
          <Text className="text-base font-bold text-blue-600 tracking-widest mt-1 uppercase">Version 1.0.0</Text>
        </View>

        <View className="px-8 py-12">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Our Mission</Text>
          <Text className="text-lg text-slate-600 dark:text-slate-300 leading-8 mb-8">
            Newsroom was built with a simple goal: to provide high-quality, personalized news to a global audience. We believe that everyone should have access to information that matters to them, presented in a clean and beautiful way.
          </Text>

          <View className="h-[1px] bg-slate-100 dark:bg-slate-800 mb-8" />

          <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Features</Text>
          <View className="space-y-6">
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-4">
                <Ionicons name="globe-outline" size={20} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-1">Global Support</Text>
                <Text className="text-slate-500 dark:text-slate-400">Supporting 11 global languages for a truly worldwide experience.</Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/30 items-center justify-center mr-4">
                <Ionicons name="flash-outline" size={20} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-1">Real-time Updates</Text>
                <Text className="text-slate-500 dark:text-slate-400">Powered by Supabase for lightning-fast news delivery and social features.</Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 items-center justify-center mr-4">
                <Ionicons name="color-palette-outline" size={20} color="#8b5cf6" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-1">Adaptive Design</Text>
                <Text className="text-slate-500 dark:text-slate-400">Stunning UI that adapts perfectly to your light or dark mode preferences.</Text>
              </View>
            </View>
          </View>

          <View className="mt-16 items-center">
            <Text className="text-slate-400 dark:text-slate-500 text-sm">Made with ❤️ for the World</Text>
            <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">© 2026 Newsroom Inc. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
