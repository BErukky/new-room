import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { supabase } from '../lib/supabase';

export default function WelcomeScreen() {
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(tabs)');
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        router.replace('/(tabs)');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white dark:bg-slate-900 justify-between items-center px-6 pb-12 pt-20">
      
      {/* Top Section / Logo */}
      <View className="items-center mt-20">
        <Animated.View 
          entering={FadeInDown.duration(1000).springify()}
          className="bg-blue-100 dark:bg-blue-900/40 p-6 rounded-full mb-8"
        >
          <Ionicons name="newspaper" size={64} color="#3b82f6" />
        </Animated.View>
        
        <Animated.Text 
          entering={FadeInUp.delay(300).duration(800)}
          className="text-4xl font-extrabold text-slate-900 dark:text-white text-center tracking-tight mb-4"
        >
          Welcome to the{'\n'}
          <Text className="text-blue-600">Newsroom</Text>
        </Animated.Text>

        <Animated.Text 
          entering={FadeInUp.delay(500).duration(800)}
          className="text-base text-slate-500 dark:text-slate-400 text-center px-4 leading-6"
        >
          Get breaking news, local stories, and personalized updates delivered straight to your pocket.
        </Animated.Text>
      </View>

      {/* Bottom Section / Action */}
      <Animated.View 
        entering={FadeInUp.delay(800).duration(800)}
        className="w-full"
      >
        <TouchableOpacity 
          onPress={() => router.push('/signup')}
          className="bg-blue-600 w-full py-4 rounded-2xl items-center flex-row justify-center space-x-2"
        >
          <Text className="text-white font-bold text-lg tracking-wide mr-2">Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-slate-500 dark:text-slate-400 font-medium">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text className="text-blue-600 font-bold">Log In</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

    </SafeAreaView>
  );
}
