import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Share,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NewsArticle, newsService } from "@/lib/newsService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../../lib/LanguageContext";

const CATEGORIES = [
  "All",
  "Crypto",
  "AI",
  "Electronics",
  "Startups",
  "Finance",
  "Sports",
  "Gaming",
];

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop";

import { supabase } from "@/lib/supabase";
import Toast from "react-native-toast-message";

export default function ExploreScreen() {
  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("All");
  const { q } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (q) setSearchQuery(q as string);
  }, [q]);
  const [feed, setFeed] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchInteractions = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch bookmarks
      if (user) {
        const { data: saved } = await supabase
          .from("saved_articles")
          .select("article_id")
          .eq("user_id", user.id);
        if (saved)
          setBookmarkedIds(saved.map((item) => String(item.article_id)));

        // Fetch user's likes
        const { data: likes } = await supabase
          .from("likes")
          .select("article_id")
          .eq("user_id", user.id);
        if (likes) setLikedIds(likes.map((item) => String(item.article_id)));
      }

      // Fetch global like counts
      const { data: allLikes } = await supabase
        .from("likes")
        .select("article_id");
      const counts: Record<string, number> = {};
      allLikes?.forEach((l) => {
        counts[l.article_id] = (counts[l.article_id] || 0) + 1;
      });
      setLikesCounts(counts);
    };

    fetchInteractions();
  }, [feed]);

  const toggleBookmark = async (news: NewsArticle) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Toast.show({ type: "info", text1: "Login Required" });

    const isBookmarked = bookmarkedIds.includes(news.id);
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from("saved_articles")
          .delete()
          .eq("article_id", news.id)
          .eq("user_id", user.id);
        if (error) throw error;
        setBookmarkedIds(bookmarkedIds.filter((id) => id !== news.id));
      } else {
        const { error } = await supabase.from("saved_articles").insert({
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
      Toast.show({
        type: "success",
        text1: isBookmarked ? "Removed" : "Saved",
      });
    } catch (e: any) {
      console.error("Bookmark error (Explore):", e);
      Toast.show({
        type: "error",
        text1: "Bookmark Error",
        text2: e.message || "Failed to save article",
      });
    }
  };

  const toggleLike = async (newsId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Toast.show({ type: "info", text1: "Login Required" });

    const isLiked = likedIds.includes(newsId);
    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("article_id", newsId)
          .eq("user_id", user.id);
        setLikedIds(likedIds.filter((id) => id !== newsId));
        setLikesCounts((prev) => ({
          ...prev,
          [newsId]: Math.max(0, (prev[newsId] || 0) - 1),
        }));
      } else {
        await supabase
          .from("likes")
          .insert({ article_id: newsId, user_id: user.id });
        setLikedIds([...likedIds, newsId]);
        setLikesCounts((prev) => ({
          ...prev,
          [newsId]: (prev[newsId] || 0) + 1,
        }));
      }
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Error", text2: e.message });
    }
  };

  const fetchExploreNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const country = (await AsyncStorage.getItem("user-country")) || "";
      let news: NewsArticle[] = [];

      if (searchQuery.trim()) {
        news = await newsService.searchNews(searchQuery, language);
      } else if (activeCategory === "All") {
        news = await newsService.getLatestNews(language, country);
      } else if (activeCategory === "Crypto") {
        news = await newsService.searchNews("crypto", language);
      } else if (activeCategory === "AI") {
        news = await newsService.searchNews(
          "artificial intelligence",
          language,
        );
      } else if (activeCategory === "Startups") {
        news = await newsService.searchNews("startup", language);
      } else if (activeCategory === "Finance") {
        news = await newsService.getLatestNews(language, country, "finance");
      } else if (activeCategory === "Sports") {
        news = await newsService.getLatestNews(language, country, "sports");
      } else if (activeCategory === "Gaming") {
        news = await newsService.getLatestNews(language, country, "game");
      }
      setFeed(news);
    } catch (error) {
      console.error("Failed to fetch explore news:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, language, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchExploreNews();
    setRefreshing(false);
  }, [fetchExploreNews]);

  useEffect(() => {
    fetchExploreNews();
  }, [fetchExploreNews]);

  // Handle Search with simple debounce simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) fetchExploreNews();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchExploreNews]);

  const timeAgo = (dateString: string) => {
    if (!dateString) return "";
    try {
      // CurrentsAPI format: "YYYY-MM-DD HH:MM:SS +0000"
      // Convert to ISO: "YYYY-MM-DDTHH:MM:SSZ" for better compatibility
      const isoDate = dateString.replace(" ", "T").replace(" +0000", "Z");
      const pub = new Date(isoDate);

      if (isNaN(pub.getTime())) {
        return "Recently";
      }

      const now = new Date();
      const diffInMs = now.getTime() - pub.getTime();

      const diffInSecs = Math.floor(diffInMs / 1000);
      const diffInMins = Math.floor(diffInSecs / 60);
      const diffInHours = Math.floor(diffInMins / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInSecs < 60) return `${Math.max(0, diffInSecs)}s ago`;
      if (diffInMins < 60) return `${diffInMins}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return pub.toLocaleDateString();
    } catch (e) {
      return "Recently";
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      className="bg-slate-50 dark:bg-slate-900"
      edges={["top"]}
    >
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Explore
        </Text>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center">
          <Ionicons name="options-outline" size={22} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-6 py-3">
        <View className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-3 text-slate-900 dark:text-white"
            placeholder="Search crypto, tech, sports..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filters (Horizontal) */}
      <View className="py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full border ${isActive ? "bg-blue-600 border-blue-600" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}
              >
                <Text
                  className={`font-semibold ${isActive ? "text-white" : "text-slate-600 dark:text-slate-300"}`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Twitter-like Random Feed */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
      >
        {isLoading ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-slate-500 font-medium">
              Fetching latest news...
            </Text>
          </View>
        ) : (
          <View className="px-6 pt-4 pb-20">
            <View className="space-y-6">
              {feed.map((news) => (
                <TouchableOpacity
                  key={news.id}
                  onPress={() =>
                    router.push({
                      pathname: `/news/${news.id}`,
                      params: {
                        id: news.id,
                        title: news.title,
                        image: news.image,
                        author: news.author,
                        published: news.published,
                        description: news.description,
                        url: news.url,
                      },
                    })
                  }
                  activeOpacity={0.7}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-100 dark:border-slate-700 mb-4"
                >
                  {/* Author / Source Row */}
                  <View className="flex-row items-center mb-3">
                    <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center">
                      <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                        {news.author?.charAt(0) || "N"}
                      </Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text
                        className="font-bold text-slate-900 dark:text-white"
                        numberOfLines={1}
                      >
                        {news.author || "Global News"}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        {timeAgo(news.published)} •{" "}
                        {news.category[0] || "General"}
                      </Text>
                    </View>
                    <TouchableOpacity>
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={20}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Content */}
                  <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 leading-snug">
                    {news.title}
                  </Text>

                  {/* Media */}
                  <Image
                    source={
                      news.image
                        ? [{ uri: news.image }, { uri: PLACEHOLDER_IMAGE }]
                        : { uri: PLACEHOLDER_IMAGE }
                    }
                    style={{ width: "100%", height: 180, borderRadius: 16 }}
                    contentFit="cover"
                    transition={500}
                  />

                  <View className="flex-row items-center justify-between mt-4 px-2">
                    <View className="flex-row items-center gap-6">
                      <TouchableOpacity
                        onPress={() => router.push(`/news/${news.id}`)}
                        className="flex-row items-center"
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={20}
                          color="#64748b"
                        />
                        <Text className="text-slate-500 ml-2">0</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => toggleLike(news.id)}
                        className="flex-row items-center"
                      >
                        <Ionicons
                          name={
                            likedIds.includes(news.id)
                              ? "heart"
                              : "heart-outline"
                          }
                          size={20}
                          color={
                            likedIds.includes(news.id) ? "#ef4444" : "#64748b"
                          }
                        />
                        <Text className="text-slate-500 ml-2">
                          {likesCounts[news.id] || 0}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => toggleBookmark(news)}
                        className="flex-row items-center"
                      >
                        <Ionicons
                          name={
                            bookmarkedIds.includes(news.id)
                              ? "bookmark"
                              : "bookmark-outline"
                          }
                          size={20}
                          color={
                            bookmarkedIds.includes(news.id)
                              ? "#3b82f6"
                              : "#64748b"
                          }
                        />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        Share.share({ message: news.title + " " + news.url })
                      }
                    >
                      <Ionicons
                        name="share-outline"
                        size={20}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              {feed.length === 0 && (
                <View className="py-10 items-center">
                  <Ionicons
                    name="newspaper-outline"
                    size={48}
                    color="#cbd5e1"
                  />
                  <Text className="text-slate-400 mt-4 text-center">
                    No articles found for this category.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
