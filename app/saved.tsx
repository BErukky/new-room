import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import Toast from 'react-native-toast-message';
import { useLanguage } from '../lib/LanguageContext';

export default function SavedArticlesScreen() {
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedArticles = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('saved_articles')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (error) throw error;
      setSavedArticles(data || []);
    } catch (error: any) {
      console.error('Error fetching saved articles:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Could not load saved articles.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSavedArticles();
    }, [fetchSavedArticles])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSavedArticles();
  }, [fetchSavedArticles]);

  const removeBookmark = async (articleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('article_id', articleId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedArticles(savedArticles.filter(a => a.article_id !== articleId));
      Toast.show({ type: 'success', text1: 'Removed from library' });
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
      <View className="px-6 pt-4 pb-4 flex-row items-center border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('saved_articles')}</Text>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {savedArticles.length === 0 ? (
          <View className="items-center justify-center pt-20">
            <Ionicons name="bookmark-outline" size={64} color="#cbd5e1" />
            <Text className="text-slate-500 font-medium mt-4">No saved articles yet.</Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)')}
              className="mt-6 bg-blue-600 px-6 py-3 rounded-full"
            >
              <Text className="text-white font-bold">Explore News</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4 pb-10">
            {savedArticles.map((item) => (
              <View key={item.id} className="flex-row items-center py-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <TouchableOpacity 
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
                  className="flex-row items-center flex-1"
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
                    </View>
                    <Text className="text-base font-bold text-slate-900 dark:text-white leading-snug" numberOfLines={2}>
                      {item.article_title}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeBookmark(item.article_id)} className="ml-2 p-2">
                  <Ionicons name="bookmark" size={24} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
