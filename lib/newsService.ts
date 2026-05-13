

const API_KEY = process.env.EXPO_PUBLIC_CURRENTS_API_KEY || '';
if (!API_KEY) {
  console.error('CRITICAL: EXPO_PUBLIC_CURRENTS_API_KEY is not defined in your .env file!');
}
const BASE_URL = 'https://api.currentsapi.services/v1';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  author: string;
  image: string;
  language: string;
  category: string[];
  published: string;
}

const generateSimpleId = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36) + str.length.toString(36);
};

export const newsService = {
  /**
   * Fetches the latest news.
   */
  getLatestNews: async (language: string = 'en', country: string = '', category: string = '') => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for slow networks

    try {
      console.log('Fetching news with params:', { language, country, category });
      const url = new URL(`${BASE_URL}/latest-news`);
      url.searchParams.append('apiKey', API_KEY);
      url.searchParams.append('language', language);
      if (country) url.searchParams.append('country', country);
      if (category) url.searchParams.append('category', category);

      const response = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`News received: ${data.news?.length || 0} articles`);
      
      // CurrentsAPI doesn't provide a unique ID, so we generate a short hash from the URL
      const newsWithIds = (data.news || []).map((article: any) => ({
        ...article,
        id: article.id || generateSimpleId(article.url)
      }));

      return newsWithIds as NewsArticle[];
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Error fetching latest news:', error.name === 'AbortError' ? 'Timeout of 60s exceeded' : error.message);
      return [];
    }
  },

  /**
   * Searches for news based on a query.
   */
  searchNews: async (query: string, language: string = 'en') => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const url = new URL(`${BASE_URL}/search`);
      url.searchParams.append('apiKey', API_KEY);
      url.searchParams.append('keywords', query);
      url.searchParams.append('language', language);

      const response = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`Search results received: ${data.news?.length || 0} articles`);
      
      const newsWithIds = (data.news || []).map((article: any) => ({
        ...article,
        id: article.id || generateSimpleId(article.url)
      }));

      return newsWithIds as NewsArticle[];
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Error searching news:', error.name === 'AbortError' ? 'Timeout of 60s exceeded' : error.message);
      return [];
    }
  }
};
