import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const POPULAR_COUNTRIES = [
  'United States', 'United Kingdom', 'Nigeria', 'India', 
  'Canada', 'Australia', 'South Africa', 'Germany'
];

const COUNTRY_CODES: Record<string, string> = {
  'Argentina': 'ar',
  'Australia': 'au',
  'Austria': 'at',
  'Belgium': 'be',
  'Brazil': 'br',
  'Bulgaria': 'bg',
  'Canada': 'ca',
  'China': 'cn',
  'Colombia': 'co',
  'Cuba': 'cu',
  'Czech Republic': 'cz',
  'Egypt': 'eg',
  'France': 'fr',
  'Germany': 'de',
  'Greece': 'gr',
  'Hong Kong': 'hk',
  'Hungary': 'hu',
  'India': 'in',
  'Indonesia': 'id',
  'Ireland': 'ie',
  'Israel': 'il',
  'Italy': 'it',
  'Japan': 'jp',
  'Latvia': 'lv',
  'Lithuania': 'lt',
  'Malaysia': 'my',
  'Mexico': 'mx',
  'Morocco': 'ma',
  'Netherlands': 'nl',
  'New Zealand': 'nz',
  'Nigeria': 'ng',
  'Norway': 'no',
  'Philippines': 'ph',
  'Poland': 'pl',
  'Portugal': 'pt',
  'Romania': 'ro',
  'Russia': 'ru',
  'Saudi Arabia': 'sa',
  'Serbia': 'rs',
  'Singapore': 'sg',
  'Slovakia': 'sk',
  'Slovenia': 'si',
  'South Africa': 'za',
  'South Korea': 'kr',
  'Sweden': 'se',
  'Switzerland': 'ch',
  'Taiwan': 'tw',
  'Thailand': 'th',
  'Turkey': 'tr',
  'UAE': 'ae',
  'Ukraine': 'ua',
  'United Kingdom': 'gb',
  'United States': 'us',
  'Venezuela': 've',
};

const ALL_COUNTRIES = Object.keys(COUNTRY_CODES).sort();

export default function LocationScreen() {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const finishOnboarding = async () => {
    if (!selectedCountry) return;

    setIsLoading(true);
    try {
      const countryCode = COUNTRY_CODES[selectedCountry];
      
      // 1. Save to local storage for quick access
      await AsyncStorage.setItem('user-country', countryCode);
      
      // 2. Save to Supabase user metadata
      const { error } = await supabase.auth.updateUser({
        data: { country: countryCode, country_name: selectedCountry }
      });

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Welcome to Newsroom!',
        text2: `Your feed is now set to ${selectedCountry}.`,
      });
      
      // Route to the Home page
      router.replace('/(tabs)'); 
    } catch (error: any) {
      console.error('Error saving location:', error);
      Toast.show({
        type: 'error',
        text1: 'Setup Failed',
        text2: error.message || 'Could not save your location.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const countriesToFilter = search.trim().length > 0 ? ALL_COUNTRIES : POPULAR_COUNTRIES;
  const filteredCountries = countriesToFilter.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text className="text-sm font-semibold text-slate-500">Step 2 of 2</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 10 }}>
        <View className="mb-6 mt-2">
          <Text className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
            Where are you located?
          </Text>
          <Text className="text-base text-slate-500 dark:text-slate-400 leading-6">
            This helps us fetch the best local news for you.
          </Text>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 mb-6">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-3 text-slate-900 dark:text-white"
            placeholder="Search country..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* List */}
        <View className="pb-4">
          {filteredCountries.map((country) => {
            const isSelected = selectedCountry === country;
            return (
              <TouchableOpacity
                key={country}
                onPress={() => setSelectedCountry(country)}
                className={`flex-row items-center justify-between p-4 mb-4 rounded-2xl border ${
                  isSelected 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-600' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Text className={`font-medium text-base ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {country}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="px-6 pb-8 pt-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <TouchableOpacity 
          disabled={!selectedCountry || isLoading}
          onPress={finishOnboarding}
          className={`py-4 rounded-2xl items-center ${selectedCountry && !isLoading ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`font-bold text-lg tracking-wide ${selectedCountry ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              Finish Setup
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

