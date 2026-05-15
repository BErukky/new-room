import React, { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Share, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import Toast from 'react-native-toast-message';
import { useLanguage } from '../../lib/LanguageContext';

export default function ArticleScreen() {
  const { id, title, image, author, published, description, url } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const article = {
    id: id as string,
    title: title as string,
    image: image as string,
    author: author as string,
    time: published as string,
    content: description as string,
    source: (author as string) || 'News'
  };

  const timeAgo = (dateString: string) => {
    if (!dateString) return '';
    const now = new Date();
    const pub = new Date(dateString.replace(' +0000', ''));
    const diffInMs = now.getTime() - pub.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      const { data: comments, error: cError } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', id)
        .order('created_at', { ascending: false });

      if (cError) throw cError;
      setCommentsList(comments || []);

      const { count, error: lCountError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', id);
      
      if (lCountError) throw lCountError;
      setLikesCount(count || 0);

      if (authUser) {
        const { data: like } = await supabase
          .from('likes')
          .select('*')
          .eq('article_id', id)
          .eq('user_id', authUser.id)
          .maybeSingle();
        setIsLiked(!!like);

        const { data: bookmark } = await supabase
          .from('saved_articles')
          .select('*')
          .eq('article_id', id)
          .eq('user_id', authUser.id)
          .maybeSingle();
        setIsBookmarked(!!bookmark);

        await supabase.from('reading_history').insert({
          user_id: authUser.id,
          article_id: id,
          article_title: article.title,
          article_image: article.image,
          article_source: article.source,
          article_description: article.content,
          article_published: article.time
        });
      }
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!user) return Toast.show({ type: 'info', text1: 'Login Required', text2: 'Please log in to like articles.' });

    try {
      if (isLiked) {
        await supabase.from('likes').delete().eq('article_id', id).eq('user_id', user.id);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from('likes').insert({ article_id: id, user_id: user.id });
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    }
  };

  const toggleBookmark = async () => {
    if (!user) return Toast.show({ type: 'info', text1: 'Login Required', text2: 'Please log in to save articles.' });

    try {
      if (isBookmarked) {
        const { error } = await supabase.from('saved_articles').delete().eq('article_id', id).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('saved_articles').insert({ 
          article_id: id, 
          user_id: user.id,
          article_title: article.title,
          article_image: article.image,
          article_source: article.source,
          // article_description: article.content,
          // article_published: article.time,
          // article_url: url
        });
        if (error) throw error;
      }
      setIsBookmarked(!isBookmarked);
      Toast.show({ type: 'success', text1: isBookmarked ? 'Removed from Saved' : 'Saved to Library' });
    } catch (e: any) {
      console.error('Bookmark error (Detail):', e);
      Toast.show({ type: 'error', text1: 'Bookmark Error', text2: e.message || 'Failed to save article' });
    }
  };

  const handleSendComment = async () => {
    if (!user) return Toast.show({ type: 'info', text1: 'Login Required', text2: 'Please log in to comment.' });
    if (!commentText.trim()) return;

    try {
      const newComment = {
        article_id: id,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || 'Guest User',
        user_avatar: user.user_metadata?.avatar_url,
        content: commentText.trim()
      };

      const { data, error } = await supabase.from('comments').insert(newComment).select().single();
      if (error) throw error;

      setCommentsList([data, ...commentsList]);
      setCommentText('');
      Toast.show({ type: 'success', text1: 'Comment posted!' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to post', text2: e.message });
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-slate-500 font-medium">{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-white dark:bg-slate-900">
      <ScrollView style={{ flex: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        
        {/* Header Image with Back Button Overlay */}
        <View className="relative w-full h-80">
          <Image 
            source={{ uri: article.image }} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/20" />
          
          <SafeAreaView edges={['top']} className="absolute w-full px-4 pt-2 flex-row justify-between items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={toggleBookmark}
                className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
              >
                <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={22} color={isBookmarked ? "#3b82f6" : "white"} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => Share.share({ message: `Check out this article: ${article.title}` })}
                className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
              >
                <Ionicons name="share-outline" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Article Body */}
        <View className="px-6 py-6 bg-white dark:bg-slate-900 -mt-6 rounded-t-3xl">
          <View className="flex-row items-center mb-4">
            <View className="bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full">
              <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">{article.source}</Text>
            </View>
            <View className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-3" />
            <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">{article.readTime}</Text>
          </View>

          <Text className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
            {article.title}
          </Text>

          <View className="flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700">
                <Ionicons name="person" size={20} color="#64748b" />
              </View>
              <View className="ml-3">
                <Text className="font-bold text-slate-900 dark:text-white">{article.author}</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">{article.time}</Text>
              </View>
            </View>
          </View>



          <Text className="text-lg text-slate-700 dark:text-slate-300 leading-8 mb-8">
            {article.content || 'No description available for this article.'}
          </Text>

          <TouchableOpacity 
            onPress={() => WebBrowser.openBrowserAsync(url as string)}
            className="bg-blue-600 py-4 rounded-2xl items-center mb-8 shadow-lg shadow-blue-500/30"
          >
            <Text className="text-white font-bold text-lg">Read Full Story</Text>
          </TouchableOpacity>

          {/* Comments Section */}
          <View className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-4 pb-24">
            <Text className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('comments')} ({commentsList.length})</Text>
            
            <View className="space-y-6">
              {commentsList.map((comment) => (
                <View key={comment.id} className="flex-row">
                  <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center overflow-hidden">
                    {comment.user_avatar ? (
                      <Image source={{ uri: comment.user_avatar }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text className="text-blue-600 dark:text-blue-400 font-bold">{comment.user_name?.charAt(0) || 'U'}</Text>
                    )}
                  </View>
                  <View className="flex-1 ml-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="font-bold text-slate-900 dark:text-white">{comment.user_name}</Text>
                      <Text className="text-[10px] text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Text className="text-slate-700 dark:text-slate-300">{comment.content}</Text>
                  </View>
                </View>
              ))}
              {commentsList.length === 0 && (
                <Text className="text-slate-400 italic text-center py-4">Be the first to comment!</Text>
              )}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
        <SafeAreaView edges={['bottom']} className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 flex-1 mr-4 border border-slate-200 dark:border-slate-700">
            <TextInput 
              className="flex-1 text-slate-900 dark:text-white ml-1 py-1"
              placeholder={t('add_comment')}
              placeholderTextColor="#94a3b8"
              value={commentText}
              onChangeText={setCommentText}
            />
            {commentText.length > 0 && (
              <TouchableOpacity onPress={handleSendComment}>
                <Ionicons name="send" size={20} color="#3b82f6" />
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row gap-4 items-center">
            <TouchableOpacity onPress={toggleLike} className="flex-row items-center">
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#ef4444" : "#64748b"} />
              <Text className="text-slate-500 dark:text-slate-400 font-medium ml-1">
                {likesCount}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

    </View>
  );
}
