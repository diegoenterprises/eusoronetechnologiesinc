/**
 * RSS FEED SERVICE
 * Fetches and parses RSS feeds from industry news sources
 */

import { z } from "zod";

export interface RSSFeedSource {
  id: string;
  name: string;
  url: string;
  category: string;
  enabled: boolean;
  addedAt: string;
}

export interface RSSArticle {
  id: string;
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
  source: string;
  sourceUrl: string;
  category: string;
  imageUrl?: string;
}

// Default RSS feeds for the platform
export const DEFAULT_RSS_FEEDS: RSSFeedSource[] = [
  // Chemical Industry
  { id: "rss_001", name: "Chemical Industry Today", url: "https://chemicals.einnews.com/rss", category: "chemical", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_002", name: "Chemical Engineering News", url: "https://cen.acs.org/content/cen/rss.html", category: "chemical", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  
  // Oil and Gas
  { id: "rss_003", name: "Rigzone Oil and Gas", url: "https://www.rigzone.com/rss", category: "oil_gas", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_004", name: "Oil and Gas Magazine", url: "https://www.oilandgasmagazine.com.mx/feed", category: "oil_gas", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_005", name: "EIA Energy", url: "https://www.eia.gov/rss", category: "oil_gas", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_006", name: "Oil & Gas 360", url: "https://www.oilandgas360.com/feed/", category: "oil_gas", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  
  // Bulk Transport
  { id: "rss_007", name: "Bulk Transporter", url: "https://www.bulktransporter.com/rss", category: "bulk", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_008", name: "Bulk Solids Today", url: "https://bulksolidstoday.com/feed/", category: "bulk", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_009", name: "Dry Cargo International", url: "https://www.drycargomag.com/rss", category: "bulk", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  
  // Refrigerated/Cold Chain
  { id: "rss_010", name: "Food Logistics", url: "https://www.foodlogistics.com/rss", category: "refrigerated", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_011", name: "Refrigerated & Frozen Foods", url: "https://www.refrigeratedfrozenfood.com/rss", category: "refrigerated", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_012", name: "Refrigerated Transporter", url: "https://refrigeratedtransporter.com/rss", category: "refrigerated", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  
  // Transportation & Logistics
  { id: "rss_013", name: "FreightWaves", url: "https://www.freightwaves.com/feed", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_014", name: "Transport Topics", url: "https://www.ttnews.com/rss", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_015", name: "Logistics Management", url: "https://www.logisticsmgmt.com/rss", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_016", name: "TruckNews", url: "https://www.trucknews.com/rss", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_017", name: "FleetOwner", url: "https://www.fleetowner.com/rss", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_018", name: "Landline Magazine", url: "https://landline.media/feed/", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_019", name: "Truckers Report", url: "https://www.thetruckersreport.com/truckingindustryforum/forums/rss", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  
  // Supply Chain
  { id: "rss_020", name: "Supply Chain Dive", url: "https://www.supplychaindive.com/rss", category: "supply_chain", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_021", name: "Supply Chain Brain", url: "https://www.supplychainbrain.com/rss", category: "supply_chain", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_022", name: "Logistics Viewpoints", url: "https://logisticsviewpoints.com/feed", category: "supply_chain", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  
  // Hazmat
  { id: "rss_023", name: "Hazmat Magazine", url: "https://hazmatmag.com/feed/", category: "hazmat", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  
  // Marine/Shipping
  { id: "rss_024", name: "Marine Log", url: "https://www.marinelog.com/rss", category: "marine", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_025", name: "MarineLink", url: "https://www.marinelink.com/rss", category: "marine", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_026", name: "LNG World News", url: "https://www.lngworldnews.com/feed/", category: "marine", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  
  // Energy
  { id: "rss_027", name: "Energy Industry Review", url: "https://energyindustryreview.com/rss", category: "energy", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_028", name: "Renewables Now", url: "https://renewablesnow.com/rss", category: "energy", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_029", name: "Fuels Market News", url: "https://www.fuelsmarketnews.com/feed/", category: "energy", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  
  // Equipment
  { id: "rss_030", name: "Industrial Equipment News", url: "https://www.ien.com/rss", category: "equipment", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
];

// In-memory storage for RSS feeds (in production, use database)
let rssFeedSources: RSSFeedSource[] = [...DEFAULT_RSS_FEEDS];
let cachedArticles: RSSArticle[] = [];
let lastFetchTime: Date | null = null;

/**
 * Parse RSS XML content into articles
 */
function parseRSSContent(xml: string, source: RSSFeedSource): RSSArticle[] {
  const articles: RSSArticle[] = [];
  
  try {
    // Extract items using regex (works in Node.js without XML parser)
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const items = xml.match(itemRegex) || [];
    
    for (const item of items.slice(0, 10)) { // Limit to 10 per source
      const getTagContent = (tag: string): string => {
        const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
        const match = item.match(regex);
        return (match?.[1] || match?.[2] || '').trim().replace(/<[^>]+>/g, '');
      };
      
      const title = getTagContent('title');
      const description = getTagContent('description') || getTagContent('summary');
      const link = getTagContent('link') || getTagContent('guid');
      const pubDate = getTagContent('pubDate') || getTagContent('published') || getTagContent('dc:date');
      
      // Extract image from enclosure or media:content
      let imageUrl: string | undefined;
      const enclosureMatch = item.match(/enclosure[^>]*url=["']([^"']+)["']/i);
      const mediaMatch = item.match(/media:content[^>]*url=["']([^"']+)["']/i);
      const imgMatch = item.match(/<img[^>]*src=["']([^"']+)["']/i);
      imageUrl = enclosureMatch?.[1] || mediaMatch?.[1] || imgMatch?.[1];
      
      if (title && link) {
        articles.push({
          id: `rss_${source.id}_${Buffer.from(link).toString('base64').slice(0, 20)}`,
          title: title.slice(0, 200),
          summary: description.slice(0, 500),
          link,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          source: source.name,
          sourceUrl: source.url,
          category: source.category,
          imageUrl,
        });
      }
    }
  } catch (error) {
    console.error(`Error parsing RSS from ${source.name}:`, error);
  }
  
  return articles;
}

/**
 * Fetch RSS feed from URL
 */
async function fetchRSSFeed(source: RSSFeedSource): Promise<RSSArticle[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout for speed
    
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EusoTrip News Aggregator/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xml = await response.text();
    return parseRSSContent(xml, source);
  } catch (error) {
    console.error(`Failed to fetch RSS from ${source.name}:`, error);
    return [];
  }
}

/**
 * Fetch all RSS feeds and update cache
 */
export async function fetchAllFeeds(): Promise<RSSArticle[]> {
  const enabledFeeds = rssFeedSources.filter(f => f.enabled);
  const allArticles: RSSArticle[] = [];
  
  // Fetch feeds in parallel with higher concurrency for speed
  const batchSize = 10;
  for (let i = 0; i < enabledFeeds.length; i += batchSize) {
    const batch = enabledFeeds.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(fetchRSSFeed));
    results.forEach(articles => allArticles.push(...articles));
  }
  
  // Sort by date (newest first)
  allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  // Update cache
  cachedArticles = allArticles;
  lastFetchTime = new Date();
  
  return allArticles;
}

/**
 * Get cached articles or fetch if stale
 */
export async function getArticles(options?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ articles: RSSArticle[]; total: number; lastUpdated: string | null }> {
  // Return cached data immediately if available; refresh in background if stale
  const cacheAge = lastFetchTime ? (Date.now() - lastFetchTime.getTime()) / 1000 / 60 : Infinity;
  if (cachedArticles.length === 0) {
    // First load — must fetch
    await fetchAllFeeds();
  } else if (cacheAge > 30) {
    // Stale — refresh in background, serve cached immediately
    fetchAllFeeds().catch(() => {});
  }
  
  let filtered = [...cachedArticles];
  
  if (options?.category && options.category !== 'all') {
    filtered = filtered.filter(a => a.category === options.category);
  }
  
  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(searchLower) ||
      a.summary.toLowerCase().includes(searchLower) ||
      a.source.toLowerCase().includes(searchLower)
    );
  }
  
  const total = filtered.length;
  const offset = options?.offset || 0;
  const limit = options?.limit || 20;
  
  return {
    articles: filtered.slice(offset, offset + limit),
    total,
    lastUpdated: lastFetchTime?.toISOString() || null,
  };
}

/**
 * Get trending articles (most recent from each category)
 */
export async function getTrendingArticles(limit = 10): Promise<RSSArticle[]> {
  const cacheAge = lastFetchTime ? (Date.now() - lastFetchTime.getTime()) / 1000 / 60 : Infinity;
  if (cachedArticles.length === 0) {
    await fetchAllFeeds();
  } else if (cacheAge > 30) {
    fetchAllFeeds().catch(() => {});
  }
  
  // Get top articles from different sources for variety
  const bySource = new Map<string, RSSArticle>();
  for (const article of cachedArticles) {
    if (!bySource.has(article.source)) {
      bySource.set(article.source, article);
    }
    if (bySource.size >= limit) break;
  }
  
  return Array.from(bySource.values());
}

// RSS Feed Management Functions
export function getAllFeedSources(): RSSFeedSource[] {
  return rssFeedSources;
}

export function addFeedSource(feed: Omit<RSSFeedSource, 'id' | 'addedAt'>): RSSFeedSource {
  const newFeed: RSSFeedSource = {
    ...feed,
    id: `rss_custom_${Date.now()}`,
    addedAt: new Date().toISOString(),
  };
  rssFeedSources.push(newFeed);
  return newFeed;
}

export function updateFeedSource(id: string, updates: Partial<RSSFeedSource>): RSSFeedSource | null {
  const index = rssFeedSources.findIndex(f => f.id === id);
  if (index === -1) return null;
  rssFeedSources[index] = { ...rssFeedSources[index], ...updates };
  return rssFeedSources[index];
}

export function deleteFeedSource(id: string): boolean {
  const index = rssFeedSources.findIndex(f => f.id === id);
  if (index === -1) return false;
  rssFeedSources.splice(index, 1);
  return true;
}

export function toggleFeedSource(id: string): RSSFeedSource | null {
  const feed = rssFeedSources.find(f => f.id === id);
  if (!feed) return null;
  feed.enabled = !feed.enabled;
  return feed;
}

// Force refresh cache
export async function refreshCache(): Promise<{ count: number; lastUpdated: string }> {
  const articles = await fetchAllFeeds();
  return {
    count: articles.length,
    lastUpdated: lastFetchTime?.toISOString() || new Date().toISOString(),
  };
}
