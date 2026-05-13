import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  'Politics', 'Technology', 'Business', 'Sports', 
  'Entertainment', 'Health', 'Science', 'Fashion', 
  'Gaming', 'Geography', 'Finance', 'Travel'
];

export default function CategoriesScreen() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    if (selected.includes(cat)) {
      setSelected(selected.filter(item => item !== cat));
    } else {
      setSelected([...selected, cat]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text className="text-sm font-semibold text-slate-500">Step 1 of 2</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 10 }}>
        <View className="mb-8 mt-2">
          <Text className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
            What interests you?
          </Text>
          <Text className="text-base text-slate-500 dark:text-slate-400 leading-6">
            Select your favorite topics to personalize your news feed. Pick at least one to continue.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => toggleCategory(cat)}
                className={`px-5 py-3 rounded-full border ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Text className={`font-semibold text-base ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="px-6 pb-8 pt-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <TouchableOpacity 
          disabled={selected.length === 0}
          onPress={() => router.push('/onboarding/location')}
          className={`py-4 rounded-2xl items-center ${selected.length > 0 ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
          <Text className={`font-bold text-lg tracking-wide ${selected.length > 0 ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
