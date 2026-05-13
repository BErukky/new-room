import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Toast.show({ type: 'error', text1: 'Please enter your email address.' });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'newsroom://reset-password',
      });

      if (error) throw error;

      Toast.show({ type: 'success', text1: 'Password reset email sent!', text2: 'Please check your inbox.' });
      router.replace('/login');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to send email', text2: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-slate-900">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16 }}>
          <TouchableOpacity onPress={() => router.back()} className="mb-8 w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Ionicons name="arrow-back" size={24} className="text-blue-500" />
          </TouchableOpacity>

          <Text className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">Reset Password</Text>
          <Text className="text-slate-500 dark:text-slate-400 mb-10 text-base">Enter the email associated with your account and we'll send an email with instructions to reset your password.</Text>

          <View className="space-y-6 mb-8">
            <View>
              <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Email Address</Text>
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-700">
                <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                <TextInput
                  className="flex-1 ml-3 text-slate-900 dark:text-white text-base"
                  placeholder="you@example.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleReset}
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl items-center ${isLoading ? 'bg-blue-400' : 'bg-blue-600'}`}
          >
            <Text className="text-white font-bold text-lg">{isLoading ? 'Sending...' : 'Send Instructions'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
