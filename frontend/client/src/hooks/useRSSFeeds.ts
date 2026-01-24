/**
 * RSS FEED HOOK
 * Fetches and parses RSS feeds for real-time news
 */

import { useState, useEffect, useCallback } from "react";
import { ALL_FEEDS, ENABLED_FEEDS, type RSSFeed, type FeedCategory } from "@/data/rssFeeds";

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  source: string;
  sourceId: string;
  category: FeedCategory;
  imageUrl?: string;
}

interface UseRSSFeedsOptions {
  categories?: FeedCategory[];
  limit?: number;
  refreshInterval?: number; // in milliseconds
  enabled?: boolean;
}

interface UseRSSFeedsReturn {
  articles: NewsArticle[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

// RSS to JSON proxy service (using a public CORS proxy or our own backend)
const RSS_PROXY_URL = "https://api.rss2json.com/v1/api.json?rss_url=";
const CORS_PROXY_URL = "https://corsproxy.io/?";

// Parse RSS XML to articles
function parseRSSXml(xml: string, feed: RSSFeed): NewsArticle[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const items = doc.querySelectorAll("item");
  const articles: NewsArticle[] = [];

  items.forEach((item, index) => {
    const title = item.querySelector("title")?.textContent || "";
    const description = item.querySelector("description")?.textContent || "";
    const link = item.querySelector("link")?.textContent || "";
    const pubDateStr = item.querySelector("pubDate")?.textContent || "";
    
    // Try to extract image from various sources
    let imageUrl = 
      item.querySelector("enclosure")?.getAttribute("url") ||
      item.querySelector("media\\:content, content")?.getAttribute("url") ||
      item.querySelector("media\\:thumbnail, thumbnail")?.getAttribute("url") ||
      extractImageFromHtml(description);

    const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();

    if (title) {
      articles.push({
        id: `${feed.id}-${index}-${pubDate.getTime()}`,
        title: stripHtml(title),
        description: stripHtml(description).slice(0, 300),
        link,
        pubDate,
        source: feed.name,
        sourceId: feed.id,
        category: feed.category,
        imageUrl,
      });
    }
  });

  return articles;
}

// Helper to strip HTML tags
function stripHtml(html: string): string {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// Helper to extract image from HTML content
function extractImageFromHtml(html: string): string | undefined {
  const match = html.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : undefined;
}

// Fetch a single feed with timeout and error handling
async function fetchFeed(feed: RSSFeed, timeout = 5000): Promise<NewsArticle[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Try RSS2JSON first (more reliable)
    const response = await fetch(
      `${RSS_PROXY_URL}${encodeURIComponent(feed.url)}`,
      { signal: controller.signal }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === "ok" && data.items) {
        return data.items.map((item: any, index: number) => ({
          id: `${feed.id}-${index}-${new Date(item.pubDate || Date.now()).getTime()}`,
          title: item.title || "",
          description: stripHtml(item.description || "").slice(0, 300),
          link: item.link || "",
          pubDate: new Date(item.pubDate || Date.now()),
          source: feed.name,
          sourceId: feed.id,
          category: feed.category,
          imageUrl: item.thumbnail || item.enclosure?.link,
        }));
      }
    }

    // Fallback to CORS proxy + XML parsing
    const xmlResponse = await fetch(
      `${CORS_PROXY_URL}${encodeURIComponent(feed.url)}`,
      { signal: controller.signal }
    );
    
    if (xmlResponse.ok) {
      const xml = await xmlResponse.text();
      return parseRSSXml(xml, feed);
    }

    return [];
  } catch (error) {
    console.warn(`Failed to fetch feed ${feed.name}:`, error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

// Main hook
export function useRSSFeeds(options: UseRSSFeedsOptions = {}): UseRSSFeedsReturn {
  const {
    categories,
    limit = 50,
    refreshInterval = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
  } = options;

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Get feeds to fetch based on categories
  const feedsToFetch = categories
    ? ENABLED_FEEDS.filter(f => categories.includes(f.category))
    : ENABLED_FEEDS;

  // Sort by priority (highest first)
  const sortedFeeds = [...feedsToFetch].sort((a, b) => b.priority - a.priority);

  const fetchAllFeeds = useCallback(async () => {
    if (!enabled || sortedFeeds.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch feeds in parallel with a limit to avoid overwhelming
      const batchSize = 5;
      const allArticles: NewsArticle[] = [];

      for (let i = 0; i < sortedFeeds.length; i += batchSize) {
        const batch = sortedFeeds.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(feed => fetchFeed(feed)));
        batchResults.forEach(articles => allArticles.push(...articles));
      }

      // Sort by date (newest first) and limit
      const sortedArticles = allArticles
        .filter(a => a.title && a.title.length > 0)
        .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
        .slice(0, limit);

      setArticles(sortedArticles);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch feeds");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, sortedFeeds, limit]);

  // Initial fetch
  useEffect(() => {
    fetchAllFeeds();
  }, [fetchAllFeeds]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    const interval = setInterval(fetchAllFeeds, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, refreshInterval, fetchAllFeeds]);

  return {
    articles,
    isLoading,
    error,
    refresh: fetchAllFeeds,
    lastUpdated,
  };
}

// Hook for single category
export function useRSSFeedsByCategory(
  category: FeedCategory,
  limit = 20
): UseRSSFeedsReturn {
  return useRSSFeeds({ categories: [category], limit });
}

// Hook for multiple categories
export function useRSSFeedsMultiCategory(
  categories: FeedCategory[],
  limit = 50
): UseRSSFeedsReturn {
  return useRSSFeeds({ categories, limit });
}

export default useRSSFeeds;
