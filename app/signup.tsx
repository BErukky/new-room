import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

const PREFERENCES = ['Global', 'Local', 'Others', 'Magazine'];

export default function SignUpScreen() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPreference, setSelectedPreference] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    let newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'Full name is required.';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) newErrors.email = 'Please enter a valid email.';
    
    // Password must be >= 8 chars, 1 uppercase, 1 number, 1 symbol
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/-]).{8,}$/;
    if (!passwordRegex.test(password)) {
      newErrors.password = 'Password must be at least 8 characters, with 1 uppercase, 1 number, and 1 symbol.';
    }

    if (!selectedPreference) newErrors.preference = 'Please select a news preference.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        console.log('Attempting signup for:', email.trim());
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: name,
              preference: selectedPreference
            }
          }
        });

        if (error) {
          console.error('Supabase signup error:', error);
          throw error;
        }

        console.log('Signup successful:', data.user?.id, 'Session:', !!data.session);
        
        setErrors({});
        Toast.show({
          type: 'success',
          text1: 'Account Created!',
          text2: data.session ? 'Welcome to the Newsroom!' : 'Please check your email to confirm your account.',
        });
        
        if (data.session) {
          router.push('/onboarding/categories');
        }
      } catch (error: any) {
        console.error('Signup catch error:', error);
        Toast.show({
          type: 'error',
          text1: 'Sign Up Failed',
          text2: error.message || 'An error occurred during sign up.',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Invalid details',
        text2: 'Please fix the errors to continue.',
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white dark:bg-slate-900">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header with Back Button */}
        <View className="px-6 pt-4 pb-2 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 60, paddingTop: 10 }}>
          
          <View className="mb-8 mt-2">
            <Text className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
              {t('stay_informed')}
            </Text>
            <Text className="text-base text-slate-500 dark:text-slate-400 leading-6">
              {t('signup_subtitle')}
            </Text>
          </View>

          {/* Form Fields */}
          <View className="space-y-4 mb-8">
            <View>
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">{t('name')}</Text>
              <View className={`flex-row items-center bg-slate-50 dark:bg-slate-800 border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl px-4 py-3`}>
                <Ionicons name="person-outline" size={20} color={errors.name ? '#ef4444' : '#94a3b8'} />
                <TextInput
                  className="flex-1 ml-3 text-slate-900 dark:text-white"
                  placeholder="John Doe"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={(text) => { setName(text); setErrors(e => ({ ...e, name: '' })); }}
                />
              </View>
              {errors.name && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.name}</Text>}
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">{t('email_label')}</Text>
              <View className={`flex-row items-center bg-slate-50 dark:bg-slate-800 border ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl px-4 py-3`}>
                <Ionicons name="mail-outline" size={20} color={errors.email ? '#ef4444' : '#94a3b8'} />
                <TextInput
                  className="flex-1 ml-3 text-slate-900 dark:text-white"
                  placeholder="you@example.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => { setEmail(text); setErrors(e => ({ ...e, email: '' })); }}
                />
              </View>
              {errors.email && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.email}</Text>}
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">{t('password_label')}</Text>
              <View className={`flex-row items-center bg-slate-50 dark:bg-slate-800 border ${errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl px-4 py-3`}>
                <Ionicons name="lock-closed-outline" size={20} color={errors.password ? '#ef4444' : '#94a3b8'} />
                <TextInput
                  className="flex-1 ml-3 text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => { setPassword(text); setErrors(e => ({ ...e, password: '' })); }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="ml-2">
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              
              {/* Password Requirements Logic */}
              <View className="mt-3 px-1 space-y-1.5">
                {[
                  { label: 'At least 8 characters', met: password.length >= 8 },
                  { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
                  { label: 'One number', met: /\d/.test(password) },
                  { label: 'One special character (!@#$%^&*)', met: /[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/-]/.test(password) }
                ].map((req, i) => (
                  <View key={i} className="flex-row items-center">
                    <Ionicons 
                      name={req.met ? "checkmark-circle" : "ellipse-outline"} 
                      size={14} 
                      color={req.met ? "#10b981" : "#94a3b8"} 
                    />
                    <Text className={`text-xs ml-2 ${req.met ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400"}`}>
                      {req.label}
                    </Text>
                  </View>
                ))}
              </View>
              
              {errors.password && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.password}</Text>}
            </View>
          </View>

          {/* Preferences Selection */}
          <View className="mb-8">
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 ml-1">
              {t('preference_title')}
            </Text>
            <View className="flex-row flex-wrap gap-2.5">
              {PREFERENCES.map((pref) => {
                const isSelected = selectedPreference === pref;
                
                let bgClass = 'bg-slate-50 dark:bg-slate-800';
                let borderClass = 'border-slate-200 dark:border-slate-700';
                let textClass = 'text-slate-600 dark:text-slate-300';
                
                if (isSelected) {
                  bgClass = 'bg-blue-600';
                  borderClass = 'border-blue-600';
                  textClass = 'text-white font-bold';
                } else if (errors.preference) {
                  borderClass = 'border-red-500';
                  textClass = 'text-red-500 font-semibold';
                } else {
                  textClass = 'text-slate-600 dark:text-slate-300 font-semibold';
                }

                return (
                  <TouchableOpacity
                    key={pref}
                    onPress={() => { setSelectedPreference(pref); setErrors(e => ({ ...e, preference: '' })); }}
                    className={`px-5 py-3 rounded-2xl border ${bgClass} ${borderClass}`}
                  >
                    <Text className={textClass}>
                      {pref}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.preference && <Text className="text-red-500 text-xs mt-2 ml-2">{errors.preference}</Text>}
          </View>

          <TouchableOpacity 
            onPress={handleSignUp}
            disabled={isLoading}
            className={`py-4 rounded-2xl items-center mt-auto ${isLoading ? 'bg-blue-400' : 'bg-blue-600'}`}
          >
            <Text className="text-white font-bold text-lg tracking-wide">{isLoading ? t('creating_account') : t('create_account')}</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-slate-500 dark:text-slate-400">{t('already_account')}</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text className="text-blue-600 font-bold">{t('log_in')}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
