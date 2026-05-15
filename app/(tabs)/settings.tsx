import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Switch, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';

import { supabase } from '@/lib/supabase';
import { useLanguage } from '../../lib/LanguageContext';

export default function SettingsScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { t } = useLanguage();
  
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [userProfile, setUserProfile] = React.useState<{ full_name?: string, avatar_url?: string, email?: string } | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile({
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
          email: user.email
        });
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserProfile({
          full_name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url,
          email: session.user.email
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    Toast.show({
      type: 'success',
      text1: 'Logged out successfully'
    });
    router.replace('/login');
  };

  const SETTINGS_SECTIONS = [
    {
      title: t('personal_info'),
      items: [
        { icon: 'person-outline', label: t('personal_info'), type: 'link', route: '/personal-info' },
        { icon: 'bookmark-outline', label: t('saved_articles'), type: 'link', route: '/saved' },
        { icon: 'time-outline', label: t('reading_history'), type: 'link', route: '/history' }
      ]
    },
    {
      title: t('preferences'),
      items: [
        { icon: 'notifications-outline', label: t('push_notifications'), type: 'toggle', value: notificationsEnabled, onToggle: setNotificationsEnabled },
        { icon: 'moon-outline', label: t('dark_mode'), type: 'toggle', value: isDarkMode, onToggle: toggleColorScheme },
        { icon: 'globe-outline', label: t('language_region'), type: 'link', route: '/language' }
      ]
    },
    {
      title: t('support'),
      items: [
        { icon: 'help-circle-outline', label: t('help_center'), type: 'link', route: '/help' },
        { icon: 'document-text-outline', label: t('terms_service'), type: 'link', route: '/terms' },
        { icon: 'information-circle-outline', label: t('about'), type: 'link', route: '/about' }
      ]
    }
  ];


  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-slate-50 dark:bg-slate-900" edges={['top']}>
      
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('settings')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View className="px-6 py-6">
          <TouchableOpacity 
            onPress={() => router.push('/personal-info')}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 flex-row items-center"
            activeOpacity={0.7}
          >
            <View className="relative">
              {userProfile?.avatar_url ? (
                <Image 
                  source={{ uri: userProfile.avatar_url }} 
                  style={{ width: 70, height: 70, borderRadius: 35 }}
                />
              ) : (
                <View className="w-[70px] h-[70px] rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center">
                  <Ionicons name="person" size={32} color="#64748b" />
                </View>
              )}
            </View>
            
            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {userProfile?.full_name || 'User'}
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                {userProfile?.email || 'Loading email...'}
              </Text>
            </View>
            <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center">
              <Ionicons name="chevron-forward" size={18} color="#3b82f6" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        <View className="px-6 pb-6 space-y-8">
          {SETTINGS_SECTIONS.map((section, index) => (
            <View key={index}>
              <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 ml-2">
                {section.title}
              </Text>
              <View className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                {section.items.map((item: any, itemIndex: number) => (
                  <View key={itemIndex}>
                    {item.type === 'link' ? (
                      <TouchableOpacity 
                        onPress={() => item.route && router.push(item.route)}
                        className="flex-row items-center px-4 py-4 active:bg-slate-50 dark:active:bg-slate-700/50"
                      >
                        <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center">
                          <Ionicons name={item.icon as any} size={18} color="#3b82f6" />
                        </View>
                        <Text className="flex-1 ml-3 font-semibold text-slate-700 dark:text-slate-200">{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                      </TouchableOpacity>
                    ) : (
                      <View className="flex-row items-center px-4 py-4">
                        <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center">
                          <Ionicons name={item.icon as any} size={18} color="#3b82f6" />
                        </View>
                        <Text className="flex-1 ml-3 font-semibold text-slate-700 dark:text-slate-200">{item.label}</Text>
                        <Switch 
                          value={item.value} 
                          onValueChange={item.onToggle}
                          trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                          thumbColor={Platform.OS === 'ios' ? '#ffffff' : item.value ? '#ffffff' : '#f8fafc'}
                        />
                      </View>
                    )}
                    {itemIndex < section.items.length - 1 && (
                      <View className="h-[1px] bg-slate-100 dark:bg-slate-700 ml-16" />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Logout Button */}
        <View className="px-6 pb-12 pt-2">
          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-red-50 dark:bg-red-900/20 py-4 rounded-2xl items-center flex-row justify-center border border-red-100 dark:border-red-900/30"
          >
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text className="text-red-500 font-bold text-lg tracking-wide ml-2">{t('logout')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
