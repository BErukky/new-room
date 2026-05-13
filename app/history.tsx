import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import Toast from 'react-native-toast-message';
import { useLanguage } from '../lib/LanguageContext';

export default function ReadingHistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLanguage();

  const fetchHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch history, removing duplicates by article_id and keeping the latest view
      const { data, error } = await supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      // Filter unique articles to avoid showing the same story multiple times in a row
      const uniqueHistory = data?.filter((v, i, a) => a.findIndex(t => t.article_id === v.article_id) === i);
      setHistory(uniqueHistory || []);
    } catch (error: any) {
      console.error('Error fetching history:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, [fetchHistory]);

  const clearHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('reading_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setHistory([]);
      Toast.show({ type: 'success', text1: 'History cleared' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
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
          <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('history')}</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text className="text-red-500 font-bold">{t('clear_all')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {history.length === 0 ? (
          <View className="items-center justify-center pt-20">
            <Ionicons name="time-outline" size={64} color="#cbd5e1" />
            <Text className="text-slate-500 font-medium mt-4">Your reading history is empty.</Text>
          </View>
        ) : (
          <View className="space-y-4 pb-10">
            {history.map((item) => (
              <TouchableOpacity 
                key={item.id}
                onPress={() => router.push({
                  pathname: `/news/${item.article_id}`,
                  params: { 
                    id: item.article_id,
                    title: item.article_title,
                    image: item.article_image,
                    author: item.article_source,
                    published: item.article_published,
                    description: item.article_description,
                    url: item.article_url
                  }
                })}
                className="flex-row items-center py-2 border-b border-slate-100 dark:border-slate-800 pb-4"
                activeOpacity={0.7}
              >
                <Image 
                  source={{ uri: item.article_image }} 
                  style={{ width: 80, height: 80, borderRadius: 16 }}
                  resizeMode="cover"
                />
                <View className="flex-1 ml-4 justify-center">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-blue-600 font-semibold text-xs uppercase tracking-wider">{item.article_source}</Text>
                    <View className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-2" />
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px]">
                      {new Date(item.viewed_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className="text-base font-bold text-slate-900 dark:text-white leading-snug" numberOfLines={2}>
                    {item.article_title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
