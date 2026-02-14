/**
 * RSS FEED CONFIGURATION
 * Industry news feeds for real-time updates
 * Categories: Oil & Gas, Chemical, Bulk Transport, Cold Chain, Trucking, Logistics
 */

export type FeedCategory = 
  | "oil_gas"
  | "chemical"
  | "bulk_transport"
  | "cold_chain"
  | "trucking"
  | "logistics"
  | "hazmat"
  | "marine"
  | "supply_chain"
  | "energy"
  | "government";

export interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category: FeedCategory;
  description?: string;
  priority: number; // 1-5, higher = more important
  enabled: boolean;
}

export const FEED_CATEGORY_LABELS: Record<FeedCategory, string> = {
  oil_gas: "Oil & Gas",
  chemical: "Chemical Industry",
  bulk_transport: "Bulk Transport",
  cold_chain: "Cold Chain & Refrigerated",
  trucking: "Trucking",
  logistics: "Logistics",
  hazmat: "Hazmat & Safety",
  marine: "Marine & Shipping",
  supply_chain: "Supply Chain",
  energy: "Energy",
  government: "Government & Regulatory",
};

export const FEED_CATEGORY_COLORS: Record<FeedCategory, string> = {
  oil_gas: "bg-orange-500/20 text-orange-400",
  chemical: "bg-purple-500/20 text-purple-400",
  bulk_transport: "bg-blue-500/20 text-blue-400",
  cold_chain: "bg-cyan-500/20 text-cyan-400",
  trucking: "bg-green-500/20 text-green-400",
  logistics: "bg-yellow-500/20 text-yellow-400",
  hazmat: "bg-red-500/20 text-red-400",
  marine: "bg-indigo-500/20 text-indigo-400",
  supply_chain: "bg-pink-500/20 text-pink-400",
  energy: "bg-amber-500/20 text-amber-400",
  government: "bg-rose-500/20 text-rose-400",
};

// ============================================================================
// OIL & GAS FEEDS
// ============================================================================

export const OIL_GAS_FEEDS: RSSFeed[] = [
  {
    id: "rigzone",
    name: "Rigzone",
    url: "https://www.rigzone.com/rss",
    category: "oil_gas",
    description: "Oil and gas industry news and jobs",
    priority: 5,
    enabled: true,
  },
  {
    id: "oilgas-iq",
    name: "Oil and Gas IQ",
    url: "https://www.oilandgasiq.com/rss",
    category: "oil_gas",
    description: "Oil and gas intelligence",
    priority: 4,
    enabled: true,
  },
  {
    id: "spglobal-energy",
    name: "S&P Global Commodity Insights",
    url: "https://www.spglobal.com/rss",
    category: "oil_gas",
    description: "Energy commodity insights",
    priority: 5,
    enabled: true,
  },
  {
    id: "oilgas-mag",
    name: "Oil and Gas Magazine",
    url: "https://www.oilandgasmagazine.com.mx/feed",
    category: "oil_gas",
    description: "Oil and gas industry magazine",
    priority: 3,
    enabled: true,
  },
  {
    id: "eia",
    name: "U.S. Energy Information Administration",
    url: "https://www.eia.gov/rss",
    category: "oil_gas",
    description: "Official U.S. energy statistics and analysis",
    priority: 5,
    enabled: true,
  },
  {
    id: "oilgas-360",
    name: "Oil & Gas 360",
    url: "https://www.oilandgas360.com/feed/",
    category: "oil_gas",
    description: "Oil and gas transportation logistics",
    priority: 4,
    enabled: true,
  },
  {
    id: "lng-world",
    name: "LNG World News",
    url: "https://www.lngworldnews.com/feed/",
    category: "oil_gas",
    description: "Liquefied natural gas news",
    priority: 4,
    enabled: true,
  },
  {
    id: "fuels-market",
    name: "Fuels Market News",
    url: "https://www.fuelsmarketnews.com/feed/",
    category: "oil_gas",
    description: "Fuel market updates",
    priority: 4,
    enabled: true,
  },
  {
    id: "energy-news",
    name: "Energy News",
    url: "https://energynews.us/feed/",
    category: "oil_gas",
    description: "Energy industry news",
    priority: 3,
    enabled: true,
  },
  {
    id: "energy-industry-review",
    name: "Energy Industry Review",
    url: "https://energyindustryreview.com/rss",
    category: "oil_gas",
    description: "Energy industry analysis",
    priority: 3,
    enabled: true,
  },
];

// ============================================================================
// CHEMICAL INDUSTRY FEEDS
// ============================================================================

export const CHEMICAL_FEEDS: RSSFeed[] = [
  {
    id: "chem-today",
    name: "Chemical Industry Today",
    url: "https://chemicals.einnews.com/rss",
    category: "chemical",
    description: "Chemical industry news",
    priority: 5,
    enabled: true,
  },
  {
    id: "chem-eng-news",
    name: "Chemical Engineering News",
    url: "https://cen.acs.org/content/cen/rss.html",
    category: "chemical",
    description: "American Chemical Society news",
    priority: 5,
    enabled: true,
  },
  {
    id: "industrial-info",
    name: "Industrial Info Resources",
    url: "https://www.industrialinfo.com/rss",
    category: "chemical",
    description: "Chemical processing news",
    priority: 4,
    enabled: true,
  },
  {
    id: "chem-eng-online",
    name: "Chemical Engineering",
    url: "https://www.chemengonline.com/rss",
    category: "chemical",
    description: "Chemical engineering updates",
    priority: 4,
    enabled: true,
  },
];

// ============================================================================
// BULK TRANSPORT FEEDS
// ============================================================================

export const BULK_TRANSPORT_FEEDS: RSSFeed[] = [
  {
    id: "bulk-transporter",
    name: "Bulk Transporter",
    url: "https://www.bulktransporter.com/rss",
    category: "bulk_transport",
    description: "Bulk logistics and transportation",
    priority: 5,
    enabled: true,
  },
  {
    id: "bulk-inside",
    name: "BulkInside",
    url: "https://bulkinside.com/rss",
    category: "bulk_transport",
    description: "Bulk solids handling",
    priority: 4,
    enabled: true,
  },
  {
    id: "bulk-solids-today",
    name: "Bulk Solids Today",
    url: "https://bulksolidstoday.com/feed/",
    category: "bulk_transport",
    description: "Bulk solids industry",
    priority: 3,
    enabled: true,
  },
  {
    id: "dry-cargo-intl",
    name: "Dry Cargo International",
    url: "https://www.drycargomag.com/rss",
    category: "bulk_transport",
    description: "Dry cargo magazine",
    priority: 4,
    enabled: true,
  },
  {
    id: "global-bulk",
    name: "Global Bulk Journal",
    url: "https://globalbulkjournal.com/feed/",
    category: "bulk_transport",
    description: "Global bulk shipping",
    priority: 3,
    enabled: true,
  },
  {
    id: "tank-transport",
    name: "Tank Transport Trader",
    url: "https://tanktransport.com/feed/",
    category: "bulk_transport",
    description: "Tank truck and trailer logistics",
    priority: 4,
    enabled: true,
  },
];

// ============================================================================
// COLD CHAIN & REFRIGERATED FEEDS
// ============================================================================

export const COLD_CHAIN_FEEDS: RSSFeed[] = [
  {
    id: "food-logistics",
    name: "Food Logistics",
    url: "https://www.foodlogistics.com/rss",
    category: "cold_chain",
    description: "Food transportation and cold chain",
    priority: 5,
    enabled: true,
  },
  {
    id: "coldchain-iq",
    name: "Cold Chain IQ",
    url: "https://www.coldchainiq.com/rss",
    category: "cold_chain",
    description: "Cold chain intelligence",
    priority: 4,
    enabled: true,
  },
  {
    id: "refrig-frozen",
    name: "Refrigerated & Frozen Foods",
    url: "https://www.refrigeratedfrozenfood.com/rss",
    category: "cold_chain",
    description: "Refrigerated and frozen foods magazine",
    priority: 5,
    enabled: true,
  },
  {
    id: "refrig-transporter",
    name: "Refrigerated Transporter",
    url: "https://www.refrigeratedtransporter.com/rss",
    category: "cold_chain",
    description: "Temperature-controlled transport",
    priority: 5,
    enabled: true,
  },
  {
    id: "gcca",
    name: "Global Cold Chain Alliance",
    url: "https://www.gcca.org/rss.xml",
    category: "cold_chain",
    description: "Cold chain logistics alliance",
    priority: 4,
    enabled: true,
  },
  {
    id: "rls-logistics",
    name: "RLS Logistics",
    url: "https://rlslogistics.com/feed/",
    category: "cold_chain",
    description: "Cold chain logistics provider",
    priority: 3,
    enabled: true,
  },
];

// ============================================================================
// TRUCKING FEEDS
// ============================================================================

export const TRUCKING_FEEDS: RSSFeed[] = [
  {
    id: "freightwaves",
    name: "FreightWaves",
    url: "https://www.freightwaves.com/feed",
    category: "trucking",
    description: "Freight and trucking news",
    priority: 5,
    enabled: true,
  },
  {
    id: "transport-topics",
    name: "Transport Topics",
    url: "https://www.ttnews.com/rss",
    category: "trucking",
    description: "Transportation industry news",
    priority: 5,
    enabled: true,
  },
  {
    id: "fleet-owner",
    name: "FleetOwner",
    url: "https://www.fleetowner.com/rss",
    category: "trucking",
    description: "Fleet management news",
    priority: 5,
    enabled: true,
  },
  {
    id: "truck-news",
    name: "TruckNews",
    url: "https://www.trucknews.com/rss",
    category: "trucking",
    description: "Canadian trucking news",
    priority: 4,
    enabled: true,
  },
  {
    id: "truckers-report",
    name: "The Truckers Report",
    url: "https://www.thetruckersreport.com/truckingindustryforum/forums/rss",
    category: "trucking",
    description: "Trucking community forum",
    priority: 3,
    enabled: true,
  },
  {
    id: "landline",
    name: "Landline Magazine",
    url: "https://landline.media/feed/",
    category: "trucking",
    description: "Trucking regulations and news",
    priority: 4,
    enabled: true,
  },
  {
    id: "trucking-info",
    name: "American Trucker / Heavy Duty Trucking",
    url: "https://www.truckinginfo.com/rss",
    category: "trucking",
    description: "Fleet management and regulations",
    priority: 4,
    enabled: true,
  },
];

// ============================================================================
// LOGISTICS FEEDS
// ============================================================================

export const LOGISTICS_FEEDS: RSSFeed[] = [
  {
    id: "logistics-mgmt",
    name: "Logistics Management",
    url: "https://www.logisticsmgmt.com/rss",
    category: "logistics",
    description: "Logistics industry management",
    priority: 5,
    enabled: true,
  },
  {
    id: "supply-chain-dive",
    name: "Supply Chain Dive",
    url: "https://www.supplychaindive.com/rss",
    category: "logistics",
    description: "Supply chain news",
    priority: 5,
    enabled: true,
  },
  {
    id: "inbound-logistics",
    name: "Inbound Logistics",
    url: "https://www.inboundlogistics.com/rss",
    category: "logistics",
    description: "Inbound logistics and cold chain",
    priority: 4,
    enabled: true,
  },
  {
    id: "logistics-viewpoints",
    name: "Logistics Viewpoints",
    url: "https://logisticsviewpoints.com/feed",
    category: "logistics",
    description: "Logistics trends and insights",
    priority: 4,
    enabled: true,
  },
  {
    id: "supply-chain-brain",
    name: "Supply Chain Brain",
    url: "https://www.supplychainbrain.com/rss",
    category: "logistics",
    description: "Supply chain intelligence",
    priority: 4,
    enabled: true,
  },
  {
    id: "global-trade",
    name: "Global Trade Magazine",
    url: "https://www.globaltrademag.com/rss",
    category: "logistics",
    description: "Global trade news",
    priority: 3,
    enabled: true,
  },
  {
    id: "inside-logistics",
    name: "Inside Logistics",
    url: "https://www.insidelogistics.ca/feed/",
    category: "logistics",
    description: "Canadian logistics news",
    priority: 3,
    enabled: true,
  },
  {
    id: "mdm",
    name: "Modern Distribution Management",
    url: "https://www.mdm.com/rss",
    category: "logistics",
    description: "Distribution management",
    priority: 3,
    enabled: true,
  },
];

// ============================================================================
// HAZMAT & SAFETY FEEDS
// ============================================================================

export const HAZMAT_FEEDS: RSSFeed[] = [
  {
    id: "hazmat-mag",
    name: "Hazmat Magazine",
    url: "https://hazmatmag.com/feed/",
    category: "hazmat",
    description: "Hazardous materials news",
    priority: 5,
    enabled: true,
  },
  {
    id: "ien",
    name: "Industrial Equipment News",
    url: "https://www.ien.com/rss",
    category: "hazmat",
    description: "Industrial equipment and safety",
    priority: 4,
    enabled: true,
  },
];

// ============================================================================
// MARINE & SHIPPING FEEDS
// ============================================================================

export const MARINE_FEEDS: RSSFeed[] = [
  {
    id: "marine-link",
    name: "MarineLink",
    url: "https://www.marinelink.com/rss",
    category: "marine",
    description: "Marine and shipping news",
    priority: 4,
    enabled: true,
  },
  {
    id: "marine-log",
    name: "Marine Log",
    url: "https://www.marinelog.com/rss",
    category: "marine",
    description: "Marine industry log",
    priority: 4,
    enabled: true,
  },
  {
    id: "port-tech",
    name: "Port Technology International",
    url: "https://www.porttechnology.org/rss",
    category: "marine",
    description: "Port technology news",
    priority: 4,
    enabled: true,
  },
  {
    id: "offshore-energy",
    name: "World Maritime News",
    url: "https://www.offshore-energy.biz/rss",
    category: "marine",
    description: "Offshore and maritime news",
    priority: 4,
    enabled: true,
  },
];

// ============================================================================
// ENERGY FEEDS
// ============================================================================

export const ENERGY_FEEDS: RSSFeed[] = [
  {
    id: "renewables-now",
    name: "Renewables Now",
    url: "https://renewablesnow.com/rss",
    category: "energy",
    description: "Renewable energy news",
    priority: 3,
    enabled: true,
  },
];

// ============================================================================
// GOVERNMENT & REGULATORY FEEDS
// ============================================================================

export const GOVERNMENT_FEEDS: RSSFeed[] = [
  { id: "fmcsa-news", name: "FMCSA News", url: "https://www.fmcsa.dot.gov/newsroom/rss", category: "government", description: "Federal Motor Catalyst Safety Administration", priority: 5, enabled: true },
  { id: "dot-news", name: "DOT News", url: "https://www.transportation.gov/rss", category: "government", description: "Department of Transportation", priority: 5, enabled: true },
  { id: "nhtsa-news", name: "NHTSA News", url: "https://www.nhtsa.gov/rss", category: "government", description: "National Highway Traffic Safety", priority: 5, enabled: true },
  { id: "ntsb-news", name: "NTSB News", url: "https://www.ntsb.gov/Pages/RSS.aspx", category: "government", description: "National Transportation Safety Board", priority: 5, enabled: true },
  { id: "epa-news", name: "EPA News", url: "https://www.epa.gov/rss", category: "government", description: "Environmental Protection Agency", priority: 4, enabled: true },
  { id: "osha-news", name: "OSHA News", url: "https://www.osha.gov/rss", category: "government", description: "Occupational Safety & Health", priority: 4, enabled: true },
  { id: "fra-news", name: "FRA News", url: "https://railroads.dot.gov/rss", category: "government", description: "Federal Railroad Administration", priority: 4, enabled: true },
  { id: "stb-news", name: "STB News", url: "https://www.stb.gov/rss", category: "government", description: "Surface Transportation Board", priority: 4, enabled: true },
  { id: "ferc-news", name: "FERC News", url: "https://www.ferc.gov/rss", category: "government", description: "Federal Energy Regulatory Commission", priority: 4, enabled: true },
  { id: "phmsa-news", name: "PHMSA News", url: "https://www.phmsa.dot.gov/rss", category: "government", description: "Pipeline & Hazmat Safety", priority: 5, enabled: true },
  { id: "gao-reports", name: "GAO Reports", url: "https://www.gao.gov/rss/reports.rss", category: "government", description: "Government Accountability Office", priority: 3, enabled: true },
  { id: "bls-transport", name: "BLS Transportation", url: "https://www.bls.gov/feed/ces_transportation.rss", category: "government", description: "Bureau of Labor Statistics", priority: 3, enabled: true },
  { id: "doe-news", name: "DOE News", url: "https://www.energy.gov/rss", category: "government", description: "Department of Energy", priority: 4, enabled: true },
  { id: "cvsa-news", name: "CVSA News", url: "https://www.cvsa.org/news/feed", category: "government", description: "Commercial Vehicle Safety Alliance", priority: 4, enabled: true },
  { id: "atri-research", name: "ATRI Research", url: "https://truckingresearch.org/feed", category: "government", description: "American Transportation Research Institute", priority: 4, enabled: true },
  { id: "fhwa-news", name: "FHWA News", url: "https://highways.dot.gov/rss", category: "government", description: "Federal Highway Administration", priority: 4, enabled: true },
  { id: "marad-news", name: "MARAD News", url: "https://www.maritime.dot.gov/rss", category: "government", description: "Maritime Administration", priority: 3, enabled: true },
  { id: "carb-news", name: "CARB News", url: "https://ww2.arb.ca.gov/rss", category: "government", description: "California Air Resources Board", priority: 3, enabled: true },
  { id: "nrc-news", name: "NRC News", url: "https://www.nrc.gov/rss", category: "government", description: "Nuclear Regulatory Commission", priority: 3, enabled: true },
  { id: "census-trade", name: "Census Trade Data", url: "https://www.census.gov/economic-indicators/rss", category: "government", description: "US Census Bureau trade indicators", priority: 3, enabled: true },
];

// ============================================================================
// COMBINED EXPORTS
// ============================================================================

export const ALL_FEEDS: RSSFeed[] = [
  ...OIL_GAS_FEEDS,
  ...CHEMICAL_FEEDS,
  ...BULK_TRANSPORT_FEEDS,
  ...COLD_CHAIN_FEEDS,
  ...TRUCKING_FEEDS,
  ...LOGISTICS_FEEDS,
  ...HAZMAT_FEEDS,
  ...MARINE_FEEDS,
  ...ENERGY_FEEDS,
  ...GOVERNMENT_FEEDS,
];

export const FEEDS_BY_CATEGORY: Record<FeedCategory, RSSFeed[]> = {
  oil_gas: OIL_GAS_FEEDS,
  chemical: CHEMICAL_FEEDS,
  bulk_transport: BULK_TRANSPORT_FEEDS,
  cold_chain: COLD_CHAIN_FEEDS,
  trucking: TRUCKING_FEEDS,
  logistics: LOGISTICS_FEEDS,
  hazmat: HAZMAT_FEEDS,
  marine: MARINE_FEEDS,
  supply_chain: LOGISTICS_FEEDS, // Alias
  energy: ENERGY_FEEDS,
  government: GOVERNMENT_FEEDS,
};

export const ENABLED_FEEDS = ALL_FEEDS.filter(f => f.enabled);

export const HIGH_PRIORITY_FEEDS = ALL_FEEDS.filter(f => f.priority >= 4 && f.enabled);

export function getFeedsByCategory(category: FeedCategory): RSSFeed[] {
  return FEEDS_BY_CATEGORY[category] || [];
}

export function getEnabledFeedUrls(): string[] {
  return ENABLED_FEEDS.map(f => f.url);
}
