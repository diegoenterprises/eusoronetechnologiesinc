/**
 * RSS FEED AGGREGATOR SERVICE
 * Aggregates 50 industry-specific RSS feeds for EusoTrip News
 * Covers: Oil & Gas, Chemicals, Refrigerated Transport, Bulk Logistics, Trucking
 */

export interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category: 'oil-gas' | 'chemicals' | 'refrigerated' | 'bulk' | 'trucking' | 'general';
}

export interface RSSArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  source: string;
  category: string;
  image?: string;
}

// All 50 RSS feeds for EusoTrip
export const RSS_FEEDS: RSSFeed[] = [
  // Chemical Industry (3 feeds)
  { id: 'chem-1', name: 'Chemical Industry Today', url: 'https://chemicals.einnews.com/rss', category: 'chemicals' },
  { id: 'chem-2', name: 'Chemical Engineering News', url: 'https://cen.acs.org/content/cen/rss.html', category: 'chemicals' },
  { id: 'chem-3', name: 'Industrial Info Resources', url: 'https://www.industrialinfo.com/rss', category: 'chemicals' },

  // Oil and Gas Industry (5 feeds)
  { id: 'oil-1', name: 'Rigzone Oil and Gas', url: 'https://www.rigzone.com/rss', category: 'oil-gas' },
  { id: 'oil-2', name: 'Oil and Gas IQ', url: 'https://www.oilandgasiq.com/rss', category: 'oil-gas' },
  { id: 'oil-3', name: 'S&P Global Commodity Insights', url: 'https://www.spglobal.com/rss', category: 'oil-gas' },
  { id: 'oil-4', name: 'Oil and Gas Magazine', url: 'https://www.oilandgasmagazine.com.mx/feed', category: 'oil-gas' },
  { id: 'oil-5', name: 'U.S. Energy Information Administration', url: 'https://www.eia.gov/rss', category: 'oil-gas' },

  // Dry and Liquid Bulk Industry (6 feeds)
  { id: 'bulk-1', name: 'Bulk Transporter', url: 'https://www.bulktransporter.com/rss', category: 'bulk' },
  { id: 'bulk-2', name: 'BulkInside', url: 'https://bulkinside.com/rss', category: 'bulk' },
  { id: 'bulk-3', name: 'Bulk Solids Today', url: 'https://bulksolidstoday.com/feed/', category: 'bulk' },
  { id: 'bulk-4', name: 'FeedNavigator', url: 'https://www.feednavigator.com/rss', category: 'bulk' },
  { id: 'bulk-5', name: 'Dry Cargo International', url: 'https://www.drycargomag.com/rss', category: 'bulk' },
  { id: 'bulk-6', name: 'Global Bulk Journal', url: 'https://globalbulkjournal.com/feed/', category: 'bulk' },

  // Refrigerated Goods and Logistics (4 feeds)
  { id: 'refrig-1', name: 'Food Logistics', url: 'https://www.foodlogistics.com/rss', category: 'refrigerated' },
  { id: 'refrig-2', name: 'Cold Chain IQ', url: 'https://www.coldchainiq.com/rss', category: 'refrigerated' },
  { id: 'refrig-3', name: 'Refrigerated & Frozen Foods', url: 'https://www.refrigeratedfrozenfood.com/rss', category: 'refrigerated' },
  { id: 'refrig-4', name: 'Inbound Logistics', url: 'https://www.inboundlogistics.com/rss', category: 'refrigerated' },

  // Transportation and Logistics (5 feeds)
  { id: 'transport-1', name: 'FreightWaves', url: 'https://www.freightwaves.com/feed', category: 'trucking' },
  { id: 'transport-2', name: 'Transport Topics', url: 'https://www.ttnews.com/rss', category: 'trucking' },
  { id: 'transport-3', name: 'Logistics Management', url: 'https://www.logisticsmgmt.com/rss', category: 'trucking' },
  { id: 'transport-4', name: 'TruckNews', url: 'https://www.trucknews.com/rss', category: 'trucking' },
  { id: 'transport-5', name: 'FleetOwner', url: 'https://www.fleetowner.com/rss', category: 'trucking' },

  // General Industry (3 feeds)
  { id: 'general-1', name: 'Supply Chain Dive', url: 'https://www.supplychaindive.com/rss', category: 'general' },
  { id: 'general-2', name: 'Global Trade Magazine', url: 'https://www.globaltrademag.com/rss', category: 'general' },
  { id: 'general-3', name: 'Platts Oil News', url: 'https://www.spglobal.com/rss', category: 'general' },

  // Industry Events and Technology (4 feeds)
  { id: 'tech-1', name: 'Hazmat Magazine', url: 'https://hazmatmag.com/feed/', category: 'general' },
  { id: 'tech-2', name: 'Energy Industry Review', url: 'https://energyindustryreview.com/rss', category: 'oil-gas' },
  { id: 'tech-3', name: 'MarineLink Shipping', url: 'https://www.marinelink.com/rss', category: 'general' },
  { id: 'tech-4', name: 'LNG World News', url: 'https://www.lngworldnews.com/feed/', category: 'oil-gas' },

  // Equipment and Safety (3 feeds)
  { id: 'equip-1', name: 'Industrial Equipment News', url: 'https://www.ien.com/rss', category: 'general' },
  { id: 'equip-2', name: 'Chemical Engineering', url: 'https://www.chemengonline.com/rss', category: 'chemicals' },
  { id: 'equip-3', name: 'Bulk Material Handling', url: 'https://bulkinside.com/rss', category: 'bulk' },

  // Port, Marine, and Shipping (5 feeds)
  { id: 'marine-1', name: 'Marine Log', url: 'https://www.marinelog.com/rss', category: 'general' },
  { id: 'marine-2', name: 'Port Technology International', url: 'https://www.porttechnology.org/rss', category: 'general' },
  { id: 'marine-3', name: 'SeaNews Turkey', url: 'https://www.seanews.com.tr/rss', category: 'general' },
  { id: 'marine-4', name: 'American Shipper', url: 'https://www.freightwaves.com/feed', category: 'trucking' },
  { id: 'marine-5', name: 'World Maritime News', url: 'https://www.offshore-energy.biz/rss', category: 'general' },

  // Refrigeration Technology (3 feeds)
  { id: 'refrig-tech-1', name: 'Refrigeration World', url: 'https://www.refrigerationworldnews.com/rss', category: 'refrigerated' },
  { id: 'refrig-tech-2', name: 'Cold Storage Solutions', url: 'https://coldstoragesolutions.com/rss', category: 'refrigerated' },
  { id: 'refrig-tech-3', name: 'Refrigerated Transporter', url: 'https://www.refrigeratedtransporter.com/rss', category: 'refrigerated' },

  // Supply Chain and Distribution (4 feeds)
  { id: 'supply-1', name: 'Logistics Viewpoints', url: 'https://logisticsviewpoints.com/rss', category: 'trucking' },
  { id: 'supply-2', name: 'Modern Distribution Management', url: 'https://www.mdm.com/rss', category: 'general' },
  { id: 'supply-3', name: 'Warehouse and Logistics News', url: 'https://www.warehousenews.co.uk/rss', category: 'general' },
  { id: 'supply-4', name: 'Supply Chain Brain', url: 'https://www.supplychainbrain.com/rss', category: 'general' },

  // Additional Specialized Feeds (6 feeds)
  { id: 'special-1', name: 'Landline Magazine', url: 'https://landline.media/feed/', category: 'trucking' },
  { id: 'special-2', name: 'Fuels Market News', url: 'https://www.fuelsmarketnews.com/feed/', category: 'oil-gas' },
  { id: 'special-3', name: 'Renewables Now', url: 'https://renewablesnow.com/rss', category: 'general' },
  { id: 'special-4', name: 'Energy News', url: 'https://energynews.us/feed/', category: 'oil-gas' },
  { id: 'special-5', name: 'Tank Transport Trader', url: 'https://tanktransport.com/feed/', category: 'bulk' },
  { id: 'special-6', name: 'Cold Chain News', url: 'https://coldchainnews.com/rss', category: 'refrigerated' },
];

/**
 * Fetch and parse RSS feed
 * In production, this would use a proper RSS parser library
 */
export async function fetchRSSFeed(feedUrl: string): Promise<RSSArticle[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'EusoTrip-NewsAggregator/1.0',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch RSS feed: ${feedUrl}`, response.status);
      return [];
    }

    // Note: In production, use xml2js or similar parser
    // This is a simplified version for demonstration
    const text = await response.text();
    const articles: RSSArticle[] = [];

    // Parse basic RSS structure
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1];

      const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(itemContent);
      const descMatch = /<description>([\s\S]*?)<\/description>/.exec(itemContent);
      const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(itemContent);
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemContent);

      if (titleMatch && linkMatch) {
        articles.push({
          id: `${feedUrl}-${Date.now()}-${Math.random()}`,
          title: titleMatch[1].replace(/<[^>]*>/g, ''),
          description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').substring(0, 200) : '',
          link: linkMatch[1],
          pubDate: pubDateMatch ? new Date(pubDateMatch[1]) : new Date(),
          source: new URL(feedUrl).hostname,
          category: 'news',
        });
      }
    }

    return articles;
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    return [];
  }
}

/**
 * Aggregate all RSS feeds
 */
export async function aggregateAllFeeds(): Promise<RSSArticle[]> {
  const allArticles: RSSArticle[] = [];

  // Fetch feeds in parallel with timeout
  const feedPromises = RSS_FEEDS.map((feed) =>
    Promise.race([
      fetchRSSFeed(feed.url).then((articles) =>
        articles.map((article) => ({
          ...article,
          category: feed.category,
          source: feed.name,
        }))
      ),
      new Promise<RSSArticle[]>((resolve) => setTimeout(() => resolve([]), 5000)), // 5s timeout
    ])
  );

  const results = await Promise.allSettled(feedPromises);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    }
  }

  // Sort by date and limit to 100 most recent
  return allArticles.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime()).slice(0, 100);
}

/**
 * Get feeds by category
 */
export function getFeedsByCategory(category: string): RSSFeed[] {
  return RSS_FEEDS.filter((feed) => feed.category === category);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(RSS_FEEDS.map((feed) => feed.category)));
}

