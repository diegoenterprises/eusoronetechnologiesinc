/**
 * RSS FEED SERVICE — HIGH-PERFORMANCE REAL-TIME ENGINE
 *
 * Architecture:
 *   - Fully parallel fetch with Promise.allSettled (all 30 feeds at once)
 *   - Per-feed health tracking: auto-skip feeds that fail 3+ times in a row
 *   - Background auto-refresh every 3 minutes via setInterval
 *   - Generation counter so frontend can cheaply poll for changes
 *   - Incremental merge: new articles are merged into existing cache (no flicker)
 *   - NEVER blocks on fetch — always returns cached data instantly
 */

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

export interface FeedHealth {
  consecutiveFailures: number;
  lastSuccess: Date | null;
  lastAttempt: Date | null;
  avgLatencyMs: number;
  totalFetches: number;
  totalSuccesses: number;
}

// ---------------------------------------------------------------------------
// FEED SOURCES
// ---------------------------------------------------------------------------
// 200 comprehensive industry feeds imported from data file
import { ALL_200_FEEDS } from "./rssFeedData";
export const DEFAULT_RSS_FEEDS: RSSFeedSource[] = ALL_200_FEEDS;

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------
let rssFeedSources: RSSFeedSource[] = [...DEFAULT_RSS_FEEDS];
let cachedArticles: RSSArticle[] = [];
let lastFetchTime: Date | null = null;
let cacheGeneration = 0;
let isFetching = false;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const FEED_TIMEOUT_MS = 8000;
const REFRESH_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const MAX_CONSECUTIVE_FAILURES = 5; // skip feed after this many failures in a row
const FAILURE_COOLDOWN_MS = 10 * 60 * 1000; // retry failed feeds after 10 min

const feedHealth: Map<string, FeedHealth> = new Map();

function getHealth(feedId: string): FeedHealth {
  if (!feedHealth.has(feedId)) {
    feedHealth.set(feedId, {
      consecutiveFailures: 0,
      lastSuccess: null,
      lastAttempt: null,
      avgLatencyMs: 0,
      totalFetches: 0,
      totalSuccesses: 0,
    });
  }
  return feedHealth.get(feedId)!;
}

function shouldSkipFeed(feedId: string): boolean {
  const h = getHealth(feedId);
  if (h.consecutiveFailures < MAX_CONSECUTIVE_FAILURES) return false;
  // Allow retry after cooldown
  if (h.lastAttempt && Date.now() - h.lastAttempt.getTime() > FAILURE_COOLDOWN_MS) return false;
  return true;
}

// ---------------------------------------------------------------------------
// XML PARSER
// ---------------------------------------------------------------------------
function parseRSSContent(xml: string, source: RSSFeedSource): RSSArticle[] {
  const articles: RSSArticle[] = [];
  try {
    // Support both RSS <item> and Atom <entry> formats
    const itemRegex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/gi;
    const items = xml.match(itemRegex) || [];
    for (const item of items.slice(0, 10)) {
      const getTag = (tag: string): string => {
        const re = new RegExp(
          `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`,
          "i"
        );
        const m = item.match(re);
        return (m?.[1] || m?.[2] || "").trim().replace(/<[^>]+>/g, "");
      };
      const title = getTag("title");
      const description = getTag("description") || getTag("summary") || getTag("content");
      // Atom <link> uses href attribute (self-closing), RSS uses text content
      const atomLinkMatch = item.match(/<link[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/i);
      const link = getTag("link") || (atomLinkMatch?.[1]?.trim() || "") || getTag("guid") || getTag("id");
      const pubDate = getTag("pubDate") || getTag("published") || getTag("dc:date");
      let imageUrl: string | undefined;
      const enc = item.match(/enclosure[^>]*url=["']([^"']+)["']/i);
      const med = item.match(/media:content[^>]*url=["']([^"']+)["']/i);
      const img = item.match(/<img[^>]*src=["']([^"']+)["']/i);
      imageUrl = enc?.[1] || med?.[1] || img?.[1];
      if (title && link) {
        articles.push({
          id: `rss_${source.id}_${Buffer.from(link).toString("base64").slice(0, 20)}`,
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
  } catch (err) {
    // silently skip malformed feeds
  }
  return articles;
}

// ---------------------------------------------------------------------------
// SINGLE FEED FETCH (with health tracking)
// ---------------------------------------------------------------------------
async function fetchRSSFeed(source: RSSFeedSource): Promise<RSSArticle[]> {
  const h = getHealth(source.id);
  h.totalFetches++;
  h.lastAttempt = new Date();

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "EusoTrip News Aggregator/2.0",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    const articles = parseRSSContent(xml, source);

    // Update health: success
    const latency = Date.now() - start;
    h.consecutiveFailures = 0;
    h.lastSuccess = new Date();
    h.totalSuccesses++;
    h.avgLatencyMs = h.avgLatencyMs
      ? h.avgLatencyMs * 0.7 + latency * 0.3
      : latency;

    return articles;
  } catch {
    h.consecutiveFailures++;
    return [];
  }
}

// ---------------------------------------------------------------------------
// FETCH ALL — fully parallel, merge into existing cache
// ---------------------------------------------------------------------------
export async function fetchAllFeeds(): Promise<RSSArticle[]> {
  if (isFetching) return cachedArticles; // deduplicate concurrent calls
  isFetching = true;
  const startMs = Date.now();

  try {
    const enabledFeeds = rssFeedSources.filter(
      (f) => f.enabled && !shouldSkipFeed(f.id)
    );
    const skipped = rssFeedSources.filter(
      (f) => f.enabled && shouldSkipFeed(f.id)
    ).length;

    // Batch feeds in groups of 25 to avoid overwhelming outbound connections
    const BATCH_SIZE = 25;
    const results: PromiseSettledResult<RSSArticle[]>[] = [];
    for (let i = 0; i < enabledFeeds.length; i += BATCH_SIZE) {
      const batch = enabledFeeds.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(batch.map(fetchRSSFeed));
      results.push(...batchResults);
    }

    const freshArticles: RSSArticle[] = [];
    let successCount = 0;
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.length > 0) {
        freshArticles.push(...r.value);
        successCount++;
      }
    }

    // Merge: deduplicate by article id, prefer newer data
    const articleMap = new Map<string, RSSArticle>();
    // Keep existing articles as fallback
    for (const a of cachedArticles) articleMap.set(a.id, a);
    // Overlay with fresh articles
    for (const a of freshArticles) articleMap.set(a.id, a);

    const merged = Array.from(articleMap.values());
    merged.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Only keep latest 500 articles to cap memory
    cachedArticles = merged.slice(0, 500);
    lastFetchTime = new Date();
    cacheGeneration++;

    const elapsed = Date.now() - startMs;
    console.log(
      `[RSS] Refresh #${cacheGeneration}: ${successCount}/${enabledFeeds.length} feeds OK, ${skipped} skipped, ${cachedArticles.length} total articles in ${elapsed}ms`
    );

    return cachedArticles;
  } finally {
    isFetching = false;
  }
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/** NEVER blocks — returns cached data instantly, triggers background refresh if stale */
export async function getArticles(options?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  articles: RSSArticle[];
  total: number;
  lastUpdated: string | null;
  generation: number;
}> {
  // First load: await fetch with timeout so frontend gets data immediately
  if (cachedArticles.length === 0) {
    if (!isFetching) {
      await Promise.race([
        fetchAllFeeds().catch(() => {}),
        new Promise(resolve => setTimeout(resolve, 20000)),
      ]);
    } else {
      // Another fetch is in progress (e.g. pre-warm), wait briefly for it
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  let filtered = cachedArticles;

  if (options?.category && options.category !== "all") {
    filtered = filtered.filter((a) => a.category === options.category);
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const offset = options?.offset || 0;
  const limit = options?.limit || 20;

  return {
    articles: filtered.slice(offset, offset + limit),
    total,
    lastUpdated: lastFetchTime?.toISOString() || null,
    generation: cacheGeneration,
  };
}

/** Cheap poll endpoint — returns only metadata so frontend knows when to refetch */
export function getCacheStatus(): {
  generation: number;
  articleCount: number;
  lastUpdated: string | null;
  isFetching: boolean;
  healthyFeeds: number;
  unhealthyFeeds: number;
} {
  let healthy = 0;
  let unhealthy = 0;
  for (const src of rssFeedSources.filter((s) => s.enabled)) {
    if (shouldSkipFeed(src.id)) unhealthy++;
    else healthy++;
  }
  return {
    generation: cacheGeneration,
    articleCount: cachedArticles.length,
    lastUpdated: lastFetchTime?.toISOString() || null,
    isFetching,
    healthyFeeds: healthy,
    unhealthyFeeds: unhealthy,
  };
}

export async function getTrendingArticles(
  limit = 10
): Promise<RSSArticle[]> {
  if (cachedArticles.length === 0 && !isFetching) {
    fetchAllFeeds().catch(() => {});
  }
  const bySource = new Map<string, RSSArticle>();
  for (const article of cachedArticles) {
    if (!bySource.has(article.source)) {
      bySource.set(article.source, article);
    }
    if (bySource.size >= limit) break;
  }
  return Array.from(bySource.values());
}

// ---------------------------------------------------------------------------
// FEED MANAGEMENT
// ---------------------------------------------------------------------------
export function getAllFeedSources(): (RSSFeedSource & { health: FeedHealth })[] {
  return rssFeedSources.map((s) => ({ ...s, health: getHealth(s.id) }));
}

export function addFeedSource(
  feed: Omit<RSSFeedSource, "id" | "addedAt">
): RSSFeedSource {
  const newFeed: RSSFeedSource = {
    ...feed,
    id: `rss_custom_${Date.now()}`,
    addedAt: new Date().toISOString(),
  };
  rssFeedSources.push(newFeed);
  return newFeed;
}

export function updateFeedSource(
  id: string,
  updates: Partial<RSSFeedSource>
): RSSFeedSource | null {
  const index = rssFeedSources.findIndex((f) => f.id === id);
  if (index === -1) return null;
  rssFeedSources[index] = { ...rssFeedSources[index], ...updates };
  return rssFeedSources[index];
}

export function deleteFeedSource(id: string): boolean {
  const index = rssFeedSources.findIndex((f) => f.id === id);
  if (index === -1) return false;
  rssFeedSources.splice(index, 1);
  feedHealth.delete(id);
  return true;
}

export function toggleFeedSource(id: string): RSSFeedSource | null {
  const feed = rssFeedSources.find((f) => f.id === id);
  if (!feed) return null;
  feed.enabled = !feed.enabled;
  return feed;
}

export function resetFeedHealth(id: string): boolean {
  const h = feedHealth.get(id);
  if (!h) return false;
  h.consecutiveFailures = 0;
  return true;
}

// ---------------------------------------------------------------------------
// FORCE REFRESH + BACKGROUND LOOP
// ---------------------------------------------------------------------------
export async function refreshCache(): Promise<{
  count: number;
  lastUpdated: string;
  generation: number;
  elapsed: number;
}> {
  const start = Date.now();
  await fetchAllFeeds();
  return {
    count: cachedArticles.length,
    lastUpdated: lastFetchTime?.toISOString() || new Date().toISOString(),
    generation: cacheGeneration,
    elapsed: Date.now() - start,
  };
}

/** Start the background auto-refresh interval */
export function startAutoRefresh(): void {
  if (refreshTimer) return; // already running
  console.log(
    `[RSS] Starting background auto-refresh every ${REFRESH_INTERVAL_MS / 1000}s`
  );
  refreshTimer = setInterval(() => {
    fetchAllFeeds().catch((err) =>
      console.warn("[RSS] Background refresh error:", err)
    );
  }, REFRESH_INTERVAL_MS);
}

/** Stop the background auto-refresh */
export function stopAutoRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    console.log("[RSS] Background auto-refresh stopped");
  }
}

/** Pre-warm + start auto-refresh loop */
export function preWarmCache(): void {
  console.log("[RSS] Pre-warming news cache...");
  fetchAllFeeds()
    .then((articles) => {
      console.log(`[RSS] Cache warmed with ${articles.length} articles`);
      startAutoRefresh();
    })
    .catch((err) => {
      console.warn("[RSS] Pre-warm failed:", err);
      // Start auto-refresh anyway so it retries
      startAutoRefresh();
    });
}
