/**
 * RSS FEED DATA — CURATED INTELLIGENCE SOURCES
 *
 * Tiered source system:
 *   TIER 1 (Breaking): First to report, original journalism, market-moving
 *   TIER 2 (Analysis): Deep analysis, investigative, expert commentary
 *   TIER 3 (Regulatory): Government/agency primary sources — policy, rules, enforcement
 *   TIER 4 (Trade): Industry association news — trends, data, workforce
 *
 * REMOVED: Corporate PR blogs, equipment manufacturer press releases,
 * content marketing, recycled press releases, advertorial sources.
 *
 * Categories: trucking, logistics, supply_chain, oil_gas, energy, chemical,
 * refrigerated, bulk, hazmat, marine, government, rail
 */

import type { RSSFeedSource } from "./rssService";

export type SourceTier = 1 | 2 | 3 | 4;

export interface TieredFeedSource extends RSSFeedSource {
  tier: SourceTier;
  country?: "US" | "CA" | "MX" | "INTL";
  topics?: string[];
}

const T = "2025-01-01T00:00:00Z";
const f = (id: number, name: string, url: string, category: string, tier: SourceTier, country: "US" | "CA" | "MX" | "INTL" = "US", topics: string[] = []): TieredFeedSource => ({
  id: `rss_${String(id).padStart(3, "0")}`, name, url, category, enabled: true, addedAt: T, tier, country, topics,
});

export const ALL_FEEDS: TieredFeedSource[] = [
  // =====================================================================
  // TRUCKING & FREIGHT — Original journalism, not corporate blogs
  // =====================================================================

  // TIER 1: Breaking news, first to report
  f(1, "FreightWaves", "https://www.freightwaves.com/news/feed", "trucking", 1, "US", ["rates", "capacity", "market"]),
  f(2, "Transport Topics", "https://www.ttnews.com/rss.xml", "trucking", 1, "US", ["fleet", "regulation", "safety"]),
  f(3, "Journal of Commerce", "https://www.joc.com/rss/logistics", "logistics", 1, "US", ["ports", "intermodal", "ocean"]),
  f(4, "American Shipper", "https://www.freightwaves.com/american-shipper/feed", "marine", 1, "US", ["ocean", "ports", "trade"]),

  // TIER 2: Analysis, deep reporting
  f(5, "Trucking Dive", "https://www.truckingdive.com/feeds/news/", "trucking", 2, "US", ["regulation", "fleet", "technology"]),
  f(6, "Overdrive Magazine", "https://www.overdriveonline.com/feed", "trucking", 2, "US", ["owner-operator", "rates", "fuel"]),
  f(7, "Commercial Carrier Journal", "https://www.ccjdigital.com/feed", "trucking", 2, "US", ["fleet", "maintenance", "technology"]),
  f(8, "Land Line Magazine", "https://landline.media/feed/", "trucking", 2, "US", ["owner-operator", "regulation", "fuel"]),
  f(9, "CDL Life", "https://cdllife.com/feed", "trucking", 2, "US", ["driver", "jobs", "lifestyle"]),
  f(10, "FleetOwner", "https://www.fleetowner.com/rss.xml", "trucking", 2, "US", ["fleet", "technology", "safety"]),
  f(11, "Heavy Duty Trucking", "https://www.truckinginfo.com/rss", "trucking", 2, "US", ["equipment", "maintenance", "fleet"]),
  f(12, "Truck News", "https://www.trucknews.com/rss/", "trucking", 2, "CA", ["canada", "cross-border", "regulation"]),
  f(13, "DAT Freight & Analytics", "https://www.dat.com/blog/rss.xml", "trucking", 2, "US", ["rates", "capacity", "spot-market"]),
  f(14, "The Trucker", "https://www.thetrucker.com/feed", "trucking", 2, "US", ["industry", "regulation", "driver"]),

  // =====================================================================
  // LOGISTICS & SUPPLY CHAIN — Journalism and analysis only
  // =====================================================================

  f(15, "Logistics Management", "https://feeds.feedburner.com/logisticsmgmt/latest", "logistics", 1, "US", ["3pl", "warehousing", "technology"]),
  f(16, "Supply Chain Dive", "https://www.supplychaindive.com/feeds/news/", "supply_chain", 1, "US", ["disruption", "procurement", "sustainability"]),
  f(17, "SupplyChainBrain", "https://www.supplychainbrain.com/rss", "supply_chain", 2, "US", ["technology", "strategy", "disruption"]),
  f(18, "Inbound Logistics", "https://www.inboundlogistics.com/feed", "logistics", 2, "US", ["3pl", "technology", "strategy"]),
  f(19, "DC Velocity", "https://www.dcvelocity.com/rss", "logistics", 2, "US", ["warehousing", "automation", "labor"]),
  f(20, "Supply Chain Management Review", "https://www.scmr.com/feed", "supply_chain", 2, "US", ["strategy", "procurement", "risk"]),
  f(21, "Logistics Viewpoints", "https://logisticsviewpoints.com/feed", "logistics", 2, "US", ["technology", "strategy", "analysis"]),
  f(22, "Freightos Blog", "https://www.freightos.com/blog/feed", "logistics", 2, "INTL", ["ocean-rates", "air-freight", "index"]),

  // =====================================================================
  // OIL & GAS / ENERGY — Market-moving sources
  // =====================================================================

  // TIER 1: Breaking, market-moving
  f(23, "Oil & Gas Journal", "https://www.ogj.com/rss", "oil_gas", 1, "US", ["upstream", "downstream", "midstream"]),
  f(24, "Rigzone", "https://www.rigzone.com/news/rss/a_all.aspx", "oil_gas", 1, "INTL", ["drilling", "offshore", "jobs"]),
  f(25, "OilPrice.com", "https://oilprice.com/rss/main", "oil_gas", 1, "INTL", ["crude-price", "opec", "geopolitics"]),
  f(26, "S&P Global Commodity Insights", "https://www.spglobal.com/commodityinsights/rss", "oil_gas", 1, "INTL", ["platts", "pricing", "benchmarks"]),
  f(27, "Natural Gas Intelligence", "https://www.naturalgasintel.com/rss", "oil_gas", 1, "US", ["natural-gas", "lng", "pipeline"]),

  // TIER 2: Analysis
  f(28, "World Oil", "https://www.worldoil.com/rss", "oil_gas", 2, "INTL", ["technology", "drilling", "production"]),
  f(29, "Hart Energy", "https://www.hartenergy.com/rss", "oil_gas", 2, "US", ["shale", "permian", "midstream"]),
  f(30, "Pipeline & Gas Journal", "https://pgjonline.com/feed", "oil_gas", 2, "US", ["pipeline", "midstream", "infrastructure"]),
  f(31, "Midstream Business", "https://www.midstreambusiness.com/rss", "oil_gas", 2, "US", ["pipeline", "storage", "processing"]),
  f(32, "Upstream Online", "https://www.upstreamonline.com/rss", "oil_gas", 2, "INTL", ["exploration", "production", "offshore"]),
  f(33, "Shale Magazine", "https://shalemag.com/feed", "oil_gas", 2, "US", ["permian", "eagle-ford", "bakken"]),
  f(34, "Oil & Gas 360", "https://www.oilandgas360.com/feed", "oil_gas", 2, "US", ["earnings", "companies", "analysis"]),
  f(35, "Petroleum Economist", "https://pemedianetwork.com/feed", "oil_gas", 2, "INTL", ["geopolitics", "strategy", "lng"]),

  // TIER 3: Government energy data
  f(36, "US EIA Today in Energy", "https://www.eia.gov/rss/todayinenergy.xml", "energy", 3, "US", ["data", "production", "consumption"]),
  f(37, "US EIA Natural Gas Weekly", "https://www.eia.gov/naturalgas/weekly/rss.xml", "energy", 3, "US", ["natural-gas", "storage", "data"]),
  f(38, "DOE Fossil Energy", "https://www.energy.gov/fe/rss.xml", "energy", 3, "US", ["policy", "research", "lng-exports"]),
  f(39, "OPEC News", "https://www.opec.org/opec_web/en/rss.xml", "oil_gas", 3, "INTL", ["production-cuts", "quota", "crude-price"]),

  // TIER 4: Industry association
  f(40, "API News", "https://www.api.org/news/feed", "oil_gas", 4, "US", ["standards", "policy", "safety"]),

  // Energy transition (relevant to fuel/fleet strategy)
  f(41, "Utility Dive", "https://www.utilitydive.com/feeds/news/", "energy", 2, "US", ["ev", "grid", "regulation"]),
  f(42, "Power Magazine", "https://www.powermag.com/feed", "energy", 2, "US", ["generation", "grid", "policy"]),

  // =====================================================================
  // CHEMICAL INDUSTRY — Trade press, not corporate PR
  // =====================================================================

  f(43, "Chemical & Engineering News", "https://feeds.feedburner.com/cen_latestnews", "chemical", 1, "US", ["research", "industry", "regulation"]),
  f(44, "ICIS Chemical News", "https://www.icis.com/explore/rss", "chemical", 1, "INTL", ["pricing", "supply", "demand"]),
  f(45, "Chemical Processing", "https://www.chemicalprocessing.com/feed", "chemical", 2, "US", ["manufacturing", "safety", "technology"]),
  f(46, "ChemWeek", "https://chemweek.com/feed", "chemical", 2, "US", ["business", "mergers", "capacity"]),
  f(47, "CSB News", "https://www.csb.gov/feed", "chemical", 3, "US", ["incidents", "investigation", "safety"]),
  f(48, "Chemistry World", "https://www.chemistryworld.com/rss", "chemical", 2, "INTL", ["research", "policy", "industry"]),

  // =====================================================================
  // COLD CHAIN / REFRIGERATED — Trade journalism only
  // =====================================================================

  f(49, "Refrigerated Transporter", "https://www.refrigeratedtrans.com/rss", "refrigerated", 1, "US", ["reefer", "temperature", "compliance"]),
  f(50, "Cold Chain Federation", "https://coldchainfederation.org.uk/feed", "refrigerated", 2, "INTL", ["pharma", "food-safety", "technology"]),

  // =====================================================================
  // BULK TRANSPORTATION — Trade press only
  // =====================================================================

  f(51, "Bulk Transporter", "https://www.bulktransporter.com/rss", "bulk", 1, "US", ["tanker", "petroleum", "chemical"]),
  f(52, "Tank Transport Trader", "https://tanktransport.com/feed", "bulk", 2, "US", ["equipment", "tanker", "market"]),
  f(53, "Dry Bulk Magazine", "https://www.drybulkmagazine.com/feed", "bulk", 2, "INTL", ["grain", "cement", "aggregate"]),

  // TIER 4: Industry association
  f(54, "NTTC News", "https://www.tanktruck.org/news/feed", "bulk", 4, "US", ["regulation", "safety", "advocacy"]),

  // =====================================================================
  // HAZMAT — Regulatory and training sources (no vendor marketing)
  // =====================================================================

  f(55, "PHMSA News", "https://www.phmsa.dot.gov/rss", "hazmat", 3, "US", ["regulation", "enforcement", "pipeline"]),
  f(56, "DOT Hazmat", "https://www.transportation.gov/hazmat/rss", "hazmat", 3, "US", ["regulation", "classification", "permits"]),
  f(57, "Hazmat Nation", "https://hazmatnation.com/blog/feed", "hazmat", 2, "US", ["training", "compliance", "incidents"]),
  f(58, "ChemTrec Blog", "https://www.chemtrec.com/resources/blog/feed", "hazmat", 2, "US", ["emergency-response", "compliance", "erg"]),
  f(59, "Labelmaster Blog", "https://blog.labelmaster.com/feed", "hazmat", 2, "US", ["classification", "packaging", "shipping"]),

  // =====================================================================
  // MARINE / MARITIME — Real maritime journalism
  // =====================================================================

  // TIER 1: Breaking
  f(60, "gCaptain", "https://gcaptain.com/feed", "marine", 1, "INTL", ["shipping", "incidents", "fleet"]),
  f(61, "Maritime Executive", "https://maritime-executive.com/articles.rss", "marine", 1, "INTL", ["business", "regulation", "technology"]),
  f(62, "TradeWinds", "https://www.tradewindsnews.com/rss", "marine", 1, "INTL", ["tankers", "dry-bulk", "containers"]),
  f(63, "Lloyd's List", "https://lloydslist.maritimeintelligence.informa.com/rss", "marine", 1, "INTL", ["insurance", "ports", "regulation"]),
  f(64, "Splash 24/7", "https://splash247.com/feed", "marine", 1, "INTL", ["shipping", "containers", "tankers"]),

  // TIER 2: Analysis
  f(65, "Marine Link", "https://www.marinelink.com/news/rss", "marine", 2, "INTL", ["technology", "offshore", "shipbuilding"]),
  f(66, "Marine Log", "https://www.marinelog.com/feed", "marine", 2, "US", ["jones-act", "shipbuilding", "inland"]),
  f(67, "Port Technology", "https://www.porttechnology.org/feed", "marine", 2, "INTL", ["automation", "terminals", "operations"]),
  f(68, "JOC Maritime", "https://www.joc.com/maritime/rss", "marine", 1, "US", ["containers", "ports", "rates"]),
  f(69, "Tanker Shipping & Trade", "https://www.tankershipping.com/feed", "marine", 2, "INTL", ["tankers", "vetting", "crude"]),
  f(70, "Seatrade Maritime", "https://www.seatrade-maritime.com/rss", "marine", 2, "INTL", ["cruise", "lng", "offshore"]),

  // TIER 3: Government maritime
  f(71, "MARAD News", "https://www.maritime.dot.gov/rss", "marine", 3, "US", ["jones-act", "policy", "shipbuilding"]),
  f(72, "US Coast Guard", "https://www.news.uscg.mil/rss", "marine", 3, "US", ["safety", "enforcement", "search-rescue"]),

  // TIER 4: Port authorities (primary source for port ops)
  f(73, "Port of LA News", "https://www.portoflosangeles.org/news/feed", "marine", 4, "US", ["la-port", "containers", "congestion"]),
  f(74, "Port of Houston", "https://porthouston.com/news/feed", "marine", 4, "US", ["houston", "energy", "petrochemical"]),

  // =====================================================================
  // RAIL — Trade journalism
  // =====================================================================

  f(75, "Railway Age", "https://www.railwayage.com/feed", "rail", 1, "US", ["class-i", "intermodal", "regulation"]),
  f(76, "Trains Magazine", "https://www.trains.com/trn/feed", "rail", 2, "US", ["operations", "infrastructure", "history"]),
  f(77, "Progressive Railroading", "https://www.progressiverailroading.com/rss", "rail", 1, "US", ["business", "technology", "safety"]),
  f(78, "Railway Track & Structures", "https://www.rtands.com/feed", "rail", 2, "US", ["infrastructure", "maintenance", "engineering"]),

  // TIER 3: Government rail
  f(79, "FRA News", "https://railroads.dot.gov/rss", "rail", 3, "US", ["safety", "regulation", "grants"]),
  f(80, "STB News", "https://www.stb.gov/rss", "rail", 3, "US", ["rates", "service", "regulation"]),

  // =====================================================================
  // GOVERNMENT & REGULATORY — Primary sources only
  // =====================================================================

  f(81, "FMCSA News", "https://www.fmcsa.dot.gov/newsroom/rss", "government", 3, "US", ["hos", "safety", "csa"]),
  f(82, "DOT News", "https://www.transportation.gov/rss", "government", 3, "US", ["infrastructure", "policy", "grants"]),
  f(83, "NHTSA News", "https://www.nhtsa.gov/rss", "government", 3, "US", ["recalls", "safety", "crashes"]),
  f(84, "NTSB News", "https://www.ntsb.gov/Pages/RSS.aspx", "government", 3, "US", ["investigations", "accidents", "recommendations"]),
  f(85, "EPA News", "https://www.epa.gov/rss", "government", 3, "US", ["emissions", "hazwaste", "clean-air"]),
  f(86, "OSHA News", "https://www.osha.gov/rss", "government", 3, "US", ["workplace-safety", "citations", "standards"]),

  // TIER 4: Industry associations
  f(87, "American Trucking Associations", "https://www.trucking.org/news/feed", "trucking", 4, "US", ["advocacy", "workforce", "data"]),
  f(88, "Truckload Carriers Association", "https://www.truckload.org/feed", "trucking", 4, "US", ["truckload", "safety", "advocacy"]),
  f(89, "AAPA Ports", "https://www.aapa-ports.org/feed", "marine", 4, "US", ["ports", "infrastructure", "trade"]),
  f(90, "American Chemistry Council", "https://www.americanchemistry.com/feed", "chemical", 4, "US", ["responsible-care", "policy", "data"]),

  // =====================================================================
  // CANADA — Cross-border intelligence
  // =====================================================================

  f(91, "Truck News (Canada)", "https://www.trucknews.com/rss/", "trucking", 2, "CA", ["canada", "regulation", "cross-border"]),
  f(92, "Transport Canada", "https://www.tc.gc.ca/rss/en/news.xml", "government", 3, "CA", ["regulation", "safety", "policy"]),
  f(93, "CBSA News", "https://www.cbsa-asfc.gc.ca/rss/whatsnew-eng.xml", "government", 3, "CA", ["customs", "border", "trade"]),

  // =====================================================================
  // MEXICO — Cross-border intelligence
  // =====================================================================

  f(94, "T21 Mexico", "https://t21.com.mx/feed", "logistics", 2, "MX", ["mexico", "logistics", "nearshoring"]),
  f(95, "Revista TyT", "https://www.tyt.com.mx/feed", "trucking", 2, "MX", ["mexico", "trucking", "regulation"]),
  f(96, "SAT Mexico", "https://www.sat.gob.mx/sitio_internet/rss", "government", 3, "MX", ["customs", "tax", "pedimento"]),
];

// Legacy compatibility — re-export as ALL_200_FEEDS for rssService.ts
export const ALL_200_FEEDS = ALL_FEEDS as RSSFeedSource[];
