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
export const DEFAULT_RSS_FEEDS: RSSFeedSource[] = [
  { id: "rss_001", name: "Chemical Industry Today", url: "https://chemicals.einnews.com/rss", category: "chemical", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_002", name: "Chemical Engineering News", url: "https://cen.acs.org/content/cen/rss.html", category: "chemical", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_003", name: "Rigzone Oil and Gas", url: "https://www.rigzone.com/rss", category: "oil_gas", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_004", name: "Oil and Gas Magazine", url: "https://www.oilandgasmagazine.com.mx/feed", category: "oil_gas", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_005", name: "EIA Energy", url: "https://www.eia.gov/rss", category: "oil_gas", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_006", name: "Oil & Gas 360", url: "https://www.oilandgas360.com/feed/", category: "oil_gas", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_007", name: "Bulk Transporter", url: "https://www.bulktransporter.com/rss", category: "bulk", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_008", name: "Bulk Solids Today", url: "https://bulksolidstoday.com/feed/", category: "bulk", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_009", name: "Dry Cargo International", url: "https://www.drycargomag.com/rss", category: "bulk", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_010", name: "Food Logistics", url: "https://www.foodlogistics.com/rss", category: "refrigerated", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_011", name: "Refrigerated & Frozen Foods", url: "https://www.refrigeratedfrozenfood.com/rss", category: "refrigerated", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_012", name: "Refrigerated Transporter", url: "https://refrigeratedtransporter.com/rss", category: "refrigerated", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_013", name: "FreightWaves", url: "https://www.freightwaves.com/feed", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_014", name: "Transport Topics", url: "https://www.ttnews.com/rss", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_015", name: "Logistics Management", url: "https://www.logisticsmgmt.com/rss", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_016", name: "TruckNews", url: "https://www.trucknews.com/rss", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_017", name: "FleetOwner", url: "https://www.fleetowner.com/rss", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_018", name: "Landline Magazine", url: "https://landline.media/feed/", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_019", name: "Truckers Report", url: "https://www.thetruckersreport.com/truckingindustryforum/forums/rss", category: "logistics", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_020", name: "Supply Chain Dive", url: "https://www.supplychaindive.com/rss", category: "supply_chain", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_021", name: "Supply Chain Brain", url: "https://www.supplychainbrain.com/rss", category: "supply_chain", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_022", name: "Logistics Viewpoints", url: "https://logisticsviewpoints.com/feed", category: "supply_chain", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_023", name: "Hazmat Magazine", url: "https://hazmatmag.com/feed/", category: "hazmat", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_024", name: "Marine Log", url: "https://www.marinelog.com/rss", category: "marine", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_025", name: "MarineLink", url: "https://www.marinelink.com/rss", category: "marine", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_026", name: "LNG World News", url: "https://www.lngworldnews.com/feed/", category: "marine", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_027", name: "Energy Industry Review", url: "https://energyindustryreview.com/rss", category: "energy", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_028", name: "Renewables Now", url: "https://renewablesnow.com/rss", category: "energy", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_029", name: "Fuels Market News", url: "https://www.fuelsmarketnews.com/feed/", category: "energy", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
  { id: "rss_030", name: "Industrial Equipment News", url: "https://www.ien.com/rss", category: "equipment", enabled: true, addedAt: "2025-01-01T00:00:00Z" },
];

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------
let rssFeedSources: RSSFeedSource[] = [...DEFAULT_RSS_FEEDS];
let cachedArticles: RSSArticle[] = [];
let lastFetchTime: Date | null = null;
let cacheGeneration = 0;
let isFetching = false;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const FEED_TIMEOUT_MS = 2000;
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
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
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
      const description = getTag("description") || getTag("summary");
      const link = getTag("link") || getTag("guid");
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

    // Fire ALL feeds simultaneously — no batching
    const results = await Promise.allSettled(enabledFeeds.map(fetchRSSFeed));

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
  // If empty cache, trigger fetch but don't await — return empty immediately
  if (cachedArticles.length === 0 && !isFetching) {
    fetchAllFeeds().catch(() => {});
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
