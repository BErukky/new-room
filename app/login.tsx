import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

export default function LoginScreen() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    let newErrors: { [key: string]: string } = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) newErrors.email = 'Please enter a valid email.';
    if (!password) newErrors.password = 'Password is required to log in.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [showResend, setShowResend] = useState(false);

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (error) throw error;
      
      Toast.show({
        type: 'success',
        text1: 'Email Sent',
        text2: 'Please check your inbox for the new link.',
      });
      setShowResend(false);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (validateForm()) {
      setIsLoading(true);
      setShowResend(false);
      try {
        console.log('Attempting login for:', email.trim());
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          console.error('Supabase login error:', error);
          throw error;
        }

        console.log('Login successful:', data.user?.id);
        setErrors({});
        Toast.show({
          type: 'success',
          text1: 'Login Successful!',
          text2: 'Welcome back.',
        });
        router.replace('/(tabs)');
      } catch (error: any) {
        console.error('Login catch error:', error);
        
        let message = error.message || 'Invalid email or password.';
        
        // Handle specific Supabase error for unconfirmed emails
        if (message.toLowerCase().includes('email not confirmed')) {
          message = 'Please check your inbox to confirm your email address before logging in.';
          setShowResend(true);
        }

        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: message,
          visibilityTime: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: 'Check your email and password.',
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
          
          <View className="mb-10 mt-2">
            <Text className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
              {t('welcome_back')}
            </Text>
            <Text className="text-base text-slate-500 dark:text-slate-400 leading-6">
              {t('login_subtitle')}
            </Text>
          </View>

          {/* Form Fields */}
          <View className="space-y-4 mb-8 flex-1">
            <View>
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
              {errors.password && <Text className="text-red-500 text-xs mt-1 ml-2">{errors.password}</Text>}
            </View>
            
            <TouchableOpacity onPress={() => router.push('/forgot-password')} className="mt-4 self-end">
              <Text className="text-sm font-semibold text-blue-600">{t('forgot_password')}</Text>
            </TouchableOpacity>
          </View>

          {showResend && (
            <TouchableOpacity 
              onPress={handleResendConfirmation}
              disabled={isLoading}
              className="py-4 rounded-2xl items-center mb-4 bg-orange-50 border border-orange-200"
            >
              <Text className="text-orange-600 font-bold">{t('resend_email')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={handleLogin}
            disabled={isLoading}
            className={`py-4 rounded-2xl items-center mt-4 ${isLoading ? 'bg-blue-400' : 'bg-blue-600'}`}
          >
            <Text className="text-white font-bold text-lg tracking-wide">{isLoading ? t('logging_in') : t('login_button')}</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-slate-500 dark:text-slate-400">{t('no_account')}</Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text className="text-blue-600 font-bold">{t('signup_label')}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
