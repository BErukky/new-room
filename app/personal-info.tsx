import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../lib/LanguageContext';

export default function PersonalInfoScreen() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      console.log('--- Profile Sync Start ---');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      let authUser = session?.user;
      
      if (!authUser) {
        const { data: { user: directUser }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        authUser = directUser;
      }

      if (authUser) {
        setUser(authUser);
        setEmail(authUser.email || '');
        
        // Start with the latest Auth Metadata (this is usually the freshest)
        let finalName = authUser.user_metadata?.full_name || '';
        let finalAvatar = authUser.user_metadata?.avatar_url || '';

        // Then check the profiles table - if it's NEWER, use it. 
        // Or if metadata is empty, use the table.
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          if (profile) {
            console.log('Table data:', profile);
            // Only overwrite if the table actually has data and it matches our ID
            if (profile.full_name && !finalName) finalName = profile.full_name;
            if (profile.avatar_url && !finalAvatar) finalAvatar = profile.avatar_url;
          }
        } catch (e) {
          console.log('Profiles table not ready.');
        }

        setName(finalName);
        setAvatarUrl(finalAvatar);
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, [fetchProfile]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatarUrl(result.assets[0].uri);
      Toast.show({
        type: 'info',
        text1: 'Photo Selected',
        text2: 'Click Save to confirm changes.',
      });
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Name cannot be empty' });
      return;
    }

    setUpdating(true);
    try {
      console.log('Starting Bulletproof Update...');
      
      // 1. Update Auth Metadata (The primary source)
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: name.trim(),
          avatar_url: avatarUrl
        }
      });

      if (authError) throw authError;

      // 2. Explicitly update the profiles table to prevent reversion
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: name.trim(),
          avatar_url: avatarUrl,
          email: email,
          updated_at: new Date().toISOString(),
        });

      if (profileError) console.warn('Table update failed, but metadata is saved:', profileError.message);

      setUser(authData.user);
      setIsEditing(false);
      
      Toast.show({
        type: 'success',
        text1: 'Profile Saved',
        text2: 'Your name is now permanently updated!',
      });
      
      // Force a re-fetch to confirm
      fetchProfile();
      
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-slate-500 font-medium">Syncing Profile...</Text>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-slate-900">
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('personal_info')}</Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => isEditing ? handleUpdate() : setIsEditing(true)}
          disabled={updating}
          className="bg-blue-600 px-5 py-2.5 rounded-2xl shadow-sm"
        >
          {updating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-bold">
              {isEditing ? t('save') : t('edit')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        <View className="px-6 pt-8 pb-12">
          <View className="items-center mb-10">
            <View className="relative">
              <View className="w-32 h-32 rounded-full border-4 border-blue-50 dark:border-blue-900/30 overflow-hidden shadow-xl">
                {avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }} 
                    style={{ width: '100%', height: '100%' }} 
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <Ionicons name="person" size={64} color="#64748b" />
                  </View>
                )}
              </View>
              {isEditing && (
                <TouchableOpacity 
                  className="absolute bottom-0 right-0 bg-blue-600 p-3 rounded-full border-4 border-white dark:border-slate-900 shadow-lg"
                  onPress={pickImage}
                >
                  <Ionicons name="camera" size={22} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('name')}</Text>
              {isEditing ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="bg-slate-50 dark:bg-slate-800 px-5 py-4 rounded-2xl border border-blue-500 text-slate-900 dark:text-white font-bold text-lg"
                  placeholder="Your full name"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <View className="bg-slate-50 dark:bg-slate-800 px-5 py-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <Text className="text-slate-900 dark:text-white font-bold text-lg">{name || 'User'}</Text>
                </View>
              )}
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('email')}</Text>
              <View className="bg-slate-50 dark:bg-slate-800 px-5 py-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-lg">{email}</Text>
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">News Preference</Text>
              <View className="flex-row flex-wrap gap-2">
                {(user?.user_metadata?.preference ? [user.user_metadata.preference] : ['Global News']).map(cat => (
                  <View key={cat} className="bg-blue-600/10 px-5 py-2.5 rounded-full border border-blue-600/20">
                    <Text className="text-blue-600 font-bold">{cat}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Location / Region</Text>
              <View className="bg-slate-50 dark:bg-slate-800 px-5 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex-row items-center justify-between">
                <Text className="text-slate-900 dark:text-white font-bold text-lg">
                  {user?.user_metadata?.country_name || 'Global'} ({user?.user_metadata?.country?.toUpperCase() || 'ALL'})
                </Text>
                <TouchableOpacity onPress={() => router.push('/onboarding/location')}>
                  <Text className="text-blue-600 font-bold">Change</Text>
                </TouchableOpacity>
              </View>
            </View>

            {isEditing && (
              <TouchableOpacity 
                onPress={() => setIsEditing(false)}
                className="mt-6 py-4 rounded-2xl items-center bg-slate-100 dark:bg-slate-800"
              >
                <Text className="text-slate-500 font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
