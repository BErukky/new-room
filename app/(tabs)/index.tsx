import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator, Share, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../lib/LanguageContext';
import { newsService, NewsArticle } from '@/lib/newsService';

import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop';

const CATEGORIES = ['General', 'Technology', 'AI', 'Electronics', 'Business', 'Entertainment', 'Sports', 'Health', 'Science'];

export default function HomeScreen() {
  const [breakingNews, setBreakingNews] = useState<NewsArticle[]>([]);
  const [dailyBriefing, setDailyBriefing] = useState<NewsArticle[]>([]);
  const [trendingNews, setTrendingNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<{ full_name?: string, avatar_url?: string } | null>(null);
  const [greeting, setGreeting] = useState('GOOD MORNING');
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});
  const [commentsCounts, setCommentsCounts] = useState<Record<string, number>>({});
  const [likedIds, setLikedIds] = useState<string[]>([]);

  const { t, language } = useLanguage();

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting(t('greeting_morning'));
    else if (hour >= 12 && hour < 18) setGreeting(t('greeting_afternoon'));
    else setGreeting(t('greeting_evening'));
  };

  const timeAgo = (dateString: string) => {
    if (!dateString) return '';
    try {
      // CurrentsAPI format: "YYYY-MM-DD HH:MM:SS +0000"
      // Convert to ISO: "YYYY-MM-DDTHH:MM:SSZ" for better compatibility
      const isoDate = dateString.replace(' ', 'T').replace(' +0000', 'Z');
      const published = new Date(isoDate);
      
      if (isNaN(published.getTime())) {
        return 'Recently'; // Fallback for any remaining parsing issues
      }

      const now = new Date();
      const diffInMs = now.getTime() - published.getTime();
      
      const diffInSecs = Math.floor(diffInMs / 1000);
      const diffInMins = Math.floor(diffInSecs / 60);
      const diffInHours = Math.floor(diffInMins / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      
      if (diffInSecs < 60) return `${Math.max(0, diffInSecs)}s ago`;
      if (diffInMins < 60) return `${diffInMins}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return published.toLocaleDateString();
    } catch (e) {
      return 'Recently';
    }
  };

  const fetchNewsData = useCallback(async (country: string = '') => {
    setIsLoading(true);
    try {
      console.log('Starting individual news fetches with country:', country);
      
      // Fetch Breaking News
      const breaking = await newsService.getLatestNews(language, country);
      setBreakingNews(breaking.slice(0, 5));
      console.log('Breaking news loaded');

      // Fetch Daily Briefing (Tech)
      const briefing = await newsService.getLatestNews(language, country, 'technology');
      setDailyBriefing(briefing.slice(0, 10));
      console.log('Daily briefing loaded');

      // Fetch Trending (Lifestyle fallback to Regional/General if empty)
      let trending = await newsService.getLatestNews(language, country, 'lifestyle');
      if (trending.length === 0 && country) {
        console.log('Lifestyle trending empty, falling back to general for country');
        trending = await newsService.getLatestNews(language, country);
      }
      setTrendingNews(trending.slice(0, 15));
      console.log('Trending news loaded');

      // Fetch global interaction counts
      const { data: allLikes } = await supabase.from('likes').select('article_id');
      const lCounts: Record<string, number> = {};
      allLikes?.forEach(l => {
        lCounts[l.article_id] = (lCounts[l.article_id] || 0) + 1;
      });
      setLikesCounts(lCounts);

      const { data: allComments } = await supabase.from('comments').select('article_id');
      const cCounts: Record<string, number> = {};
      allComments?.forEach(c => {
        cCounts[c.article_id] = (cCounts[c.article_id] || 0) + 1;
      });
      setCommentsCounts(cCounts);
    } catch (error) {
      console.error('Failed to fetch news partially:', error);
    } finally {
      setIsLoading(false);
      console.log('News fetching process complete');
    }
  }, [language]);

  const fetchData = useCallback(async () => {
    // 1. Try to get country from local storage first for speed
    let country = await AsyncStorage.getItem('user-country') || '';
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserProfile(user.user_metadata as any);
      
      if (user.user_metadata.country) {
        country = user.user_metadata.country;
        await AsyncStorage.setItem('user-country', country);
      }

      Promise.all([
        supabase.from('saved_articles').select('article_id').eq('user_id', user.id),
        supabase.from('likes').select('article_id').eq('user_id', user.id)
      ]).then(([{ data: saved }, { data: likes }]) => {
        if (saved) setBookmarkedIds(saved.map(item => String(item.article_id)));
        if (likes) setLikedIds(likes.map(item => String(item.article_id)));
      });
    }

    fetchNewsData(country);
  }, [fetchNewsData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const country = await AsyncStorage.getItem('user-country') || '';
    await fetchNewsData(country);
    setRefreshing(false);
  }, [fetchNewsData]);

  useEffect(() => {
    updateGreeting();
    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserProfile(session.user.user_metadata as any);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchData]);

  const toggleLike = async (newsId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Toast.show({ type: 'info', text1: 'Login Required' });

    const isLiked = likedIds.includes(newsId);
    try {
      if (isLiked) {
        await supabase.from('likes').delete().eq('article_id', newsId).eq('user_id', user.id);
        setLikedIds(likedIds.filter(id => id !== newsId));
        setLikesCounts(prev => ({ ...prev, [newsId]: Math.max(0, (prev[newsId] || 0) - 1) }));
      } else {
        await supabase.from('likes').insert({ article_id: newsId, user_id: user.id });
        setLikedIds([...likedIds, newsId]);
        setLikesCounts(prev => ({ ...prev, [newsId]: (prev[newsId] || 0) + 1 }));
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    }
  };

  const toggleBookmark = async (news: NewsArticle) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Toast.show({ type: 'info', text1: 'Login Required' });

    const isBookmarked = bookmarkedIds.includes(news.id);
    try {
      if (isBookmarked) {
        const { error } = await supabase.from('saved_articles').delete().eq('article_id', news.id).eq('user_id', user.id);
        if (error) throw error;
        setBookmarkedIds(bookmarkedIds.filter(id => id !== news.id));
      } else {
        const { error } = await supabase.from('saved_articles').insert({
          article_id: news.id,
          user_id: user.id,
          article_title: news.title,
          article_image: news.image,
          article_source: news.author,
          // article_description: news.description,
          // article_published: news.published,
          // article_url: news.url
        });
        if (error) throw error;
        setBookmarkedIds([...bookmarkedIds, news.id]);
      }
      Toast.show({ type: 'success', text1: isBookmarked ? 'Removed' : 'Saved' });
    } catch (e: any) {
      console.error('Bookmark error:', e);
      Toast.show({ type: 'error', text1: 'Bookmark Error', text2: e.message || 'Failed to save article' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const displayAvatar = userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80';

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-slate-50 dark:bg-slate-900" edges={['top']}>
      
      {/* Header & Profile */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2 z-50">
        <TouchableOpacity 
          onPress={() => router.push('/personal-info')}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-300 dark:border-slate-700 items-center justify-center">
            <Image 
              source={{ uri: displayAvatar }} 
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <View className="ml-3">
            <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{greeting}</Text>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">{userProfile?.full_name || 'User'}</Text>
          </View>
        </TouchableOpacity>
        
        <View className="relative flex-row items-center gap-3">
          <TouchableOpacity 
            onPress={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700 relative"
          >
            <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full z-10 border-2 border-white dark:border-slate-800" />
            <Ionicons name="notifications-outline" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLogout}
            className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center border border-red-100 dark:border-red-900/30"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </TouchableOpacity>

          {showNotifications && (
            <View className="absolute top-12 right-0 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 z-50">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-bold text-slate-900 dark:text-white">Recent Alerts</Text>
                <View className="bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] font-bold text-blue-600">NEW</Text>
                </View>
              </View>
              
              {breakingNews.length > 0 ? (
                <TouchableOpacity 
                  onPress={() => {
                    setShowNotifications(false);
                    router.push({
                      pathname: `/news/${breakingNews[0].id}`,
                      params: { 
                        id: breakingNews[0].id,
                        title: breakingNews[0].title,
                        image: breakingNews[0].image,
                        author: breakingNews[0].author,
                        published: breakingNews[0].published,
                        description: breakingNews[0].description,
                        url: breakingNews[0].url
                      }
                    });
                  }}
                  className="flex-row items-start mb-3"
                >
                  <View className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center mr-3">
                    <Ionicons name="flash" size={20} color="#f97316" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-800 dark:text-slate-200" numberOfLines={2}>
                      {breakingNews[0].title}
                    </Text>
                    <Text className="text-[10px] text-slate-500 mt-1">{timeAgo(breakingNews[0].published)}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <Text className="text-xs text-slate-400 italic text-center py-4">No new alerts at the moment.</Text>
              )}
              
              <View className="h-[1px] bg-slate-100 dark:bg-slate-700 my-2" />
              
              <TouchableOpacity className="items-center py-1">
                <Text className="text-xs font-bold text-blue-600">View All Notifications</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-6 py-3">
        <View className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-3 text-slate-900 dark:text-white"
            placeholder={t('search_placeholder')}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (searchQuery.trim()) {
                router.push({
                  pathname: '/(tabs)/explore',
                  params: { q: searchQuery }
                });
              }
            }}
          />
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {isLoading ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-slate-500 font-medium">{t('loading')}</Text>
          </View>
        ) : (
          <>
        
        {/* Breaking News Section (Horizontal Scroll) */}
        <View className="pt-2 pb-4">
          <View className="px-6 flex-row items-center justify-between mb-4">
            <Text className="text-xl font-extrabold text-slate-900 dark:text-white">{t('breaking_news')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text className="text-blue-600 font-semibold text-sm">{t('view_all')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            snapToInterval={width * 0.85 + 16}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
          >
            {breakingNews.map((news) => (
              <TouchableOpacity 
                key={news.id}
                onPress={() => router.push({
                  pathname: `/news/${news.id}`,
                  params: { 
                    id: news.id,
                    title: news.title,
                    image: news.image,
                    author: news.author,
                    published: news.published,
                    description: news.description,
                    url: news.url
                  }
                })}
                activeOpacity={0.9} 
                style={{ width: width * 0.85 }}
                className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800"
              >
                <Image 
                  source={news.image ? [{ uri: news.image }, { uri: PLACEHOLDER_IMAGE }] : { uri: PLACEHOLDER_IMAGE }} 
                  style={{ width: '100%', height: 200 }}
                  contentFit="cover"
                  transition={500}
                />
                <View className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold tracking-widest uppercase">LIVE</Text>
                </View>
                
                <View className="p-5">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-blue-600 font-semibold text-xs uppercase tracking-wider" numberOfLines={1}>{news.author || 'News'}</Text>
                    <View className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-2" />
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">{timeAgo(news.published)}</Text>
                  </View>
                  
                  <Text className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-3">
                    {news.title}
                  </Text>

                  {/* Interaction Bar */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                    <View className="flex-row items-center gap-4">
                      <TouchableOpacity 
                        onPress={() => toggleLike(news.id)}
                        className="flex-row items-center"
                      >
                        <Ionicons 
                          name={likedIds.includes(news.id) ? "heart" : "heart-outline"} 
                          size={20} 
                          color={likedIds.includes(news.id) ? "#ef4444" : "#64748b"} 
                        />
                        <Text className="text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                          {likesCounts[news.id] || 0}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => router.push(`/news/${news.id}`)}
                        className="flex-row items-center"
                      >
                        <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
                        <Text className="text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                          {commentsCounts[news.id] || 0}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity onPress={() => toggleBookmark(news)}>
                      <Ionicons 
                        name={bookmarkedIds.includes(news.id) ? "bookmark" : "bookmark-outline"} 
                        size={22} 
                        color={bookmarkedIds.includes(news.id) ? "#3b82f6" : "#64748b"} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Explore Topics (Magazine / Others) */}
        <View className="pt-4 pb-2">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
          >
            {CATEGORIES.map((section, index) => (
              <TouchableOpacity 
                key={index}
                className="px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800"
              >
                <Text className="font-semibold text-slate-700 dark:text-slate-300">{section}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Daily Briefing / For You Section */}
        <View className="pt-6 pb-12">
          <View className="px-6 flex-row items-center justify-between mb-4">
            <Text className="text-xl font-extrabold text-slate-900 dark:text-white">{t('daily_briefing')}</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
          >
            {dailyBriefing.map((news) => (
              <TouchableOpacity 
                key={news.id} 
                onPress={() => router.push({
                  pathname: `/news/${news.id}`,
                  params: { 
                    id: news.id,
                    title: news.title,
                    image: news.image,
                    author: news.author,
                    published: news.published,
                    description: news.description,
                    url: news.url
                  }
                })}
                activeOpacity={0.8}
                className="w-64 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 p-3"
              >
                <Image 
                  source={news.image ? [{ uri: news.image }, { uri: PLACEHOLDER_IMAGE }] : { uri: PLACEHOLDER_IMAGE }} 
                  style={{ width: '100%', height: 120, borderRadius: 12 }}
                  contentFit="cover"
                  transition={500}
                />
                <View className="mt-3">
                  <Text className="text-blue-600 font-semibold text-xs uppercase tracking-wider mb-1" numberOfLines={1}>{news.author || 'Daily'}</Text>
                  <Text className="text-base font-bold text-slate-900 dark:text-white leading-snug" numberOfLines={2}>
                    {news.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trending / Vertical Feed */}
        <View className="px-6 pt-2 pb-12">
          <Text className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">{t('trending_now')}</Text>
          
          <View className="space-y-4">
            {trendingNews.map((news) => (
              <TouchableOpacity 
                key={news.id}
                onPress={() => router.push({
                  pathname: `/news/${news.id}`,
                  params: { 
                    id: news.id,
                    title: news.title,
                    image: news.image,
                    author: news.author,
                    published: news.published,
                    description: news.description,
                    url: news.url
                  }
                })}
                activeOpacity={0.7}
                className="flex-row items-center py-2"
              >
                <Image 
                  source={news.image ? [{ uri: news.image }, { uri: PLACEHOLDER_IMAGE }] : { uri: PLACEHOLDER_IMAGE }} 
                  style={{ width: 80, height: 80, borderRadius: 16 }}
                  contentFit="cover"
                  transition={500}
                />
                <View className="flex-1 ml-4 justify-center">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-blue-600 font-semibold text-xs uppercase tracking-wider" numberOfLines={1}>{news.author || 'Trending'}</Text>
                    <View className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-2" />
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">{timeAgo(news.published)}</Text>
                  </View>
                  <Text className="text-base font-bold text-slate-900 dark:text-white leading-snug" numberOfLines={2}>
                    {news.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
