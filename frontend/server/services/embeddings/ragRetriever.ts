/**
 * RAG RETRIEVER — Knowledge Retrieval for ESANG AI
 * 
 * Retrieves relevant knowledge chunks from the embedding index
 * to inject into ESANG AI's Gemini prompts, replacing the massive
 * static system prompt with targeted, context-aware retrieval.
 * 
 * Flow:
 *   User question → embed query → cosine search → top-K chunks → inject into Gemini prompt
 */

import { embeddingService, EmbeddingService } from "./embeddingService";

// ── Types ────────────────────────────────────────────────────────────────────
export interface RetrievedChunk {
  text: string;
  score: number;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export interface RAGContext {
  chunks: RetrievedChunk[];
  totalCandidates: number;
  retrievalTimeMs: number;
}

// ── Retriever ────────────────────────────────────────────────────────────────

// ── Intent-Based Entity Type Routing ─────────────────────────────────────────
// Analyzes query keywords to route to the most relevant knowledge domains,
// dramatically improving retrieval precision vs. blind all-entity search.
const INTENT_PATTERNS: Array<{ pattern: RegExp; entityTypes: string[] }> = [
  { pattern: /\b(hazmat|UN\d{4}|spill|chemical|placards?|erg|toxic|flammable|corrosive|explosive|h2s|hydrogen sulfide|bleve|scba)\b/i, entityTypes: ["knowledge", "erg_guide"] },
  { pattern: /\b(dtc|fault code|spn|fmi|check engine|derate|aftertreatment|def|dpf|egr|coolant|oil pressure|brake|tire|maintenance|mechanic|diagnostic|breakdown)\b/i, entityTypes: ["knowledge"] },
  { pattern: /\b(rate|per barrel|per mile|surcharge|fsc|fuel|tariff|pricing|cost|charge|fee|schedule a)\b/i, entityTypes: ["knowledge", "rate_sheet"] },
  { pattern: /\b(hos|hours of service|eld|drive time|rest|sleeper|14.hour|11.hour|duty|off.duty|log|fmcsa|csa|dot inspection|drug test|clearinghouse|compliance|violation|audit)\b/i, entityTypes: ["knowledge", "compliance_record"] },
  { pattern: /\b(load|freight|haul|route|lane|pickup|delivery|dispatch|tracking|bol|run ticket)\b/i, entityTypes: ["knowledge", "load"] },
  { pattern: /\b(carrier|company|mc.?number|dot.?number|usdot|authority|broker|catalyst|fleet)\b/i, entityTypes: ["knowledge", "carrier"] },
  { pattern: /\b(badge|xp|level|mission|crate|eusomiles|gamification|achievement|leaderboard|the haul)\b/i, entityTypes: ["knowledge"] },
  { pattern: /\b(document|cdl|medical card|insurance|certificate|permit|license|ifta|irp|twic)\b/i, entityTypes: ["knowledge", "document"] },
  { pattern: /\b(weather|wildfire|seismic|flood|storm|zone|corridor|i-\d+|interstate|pipeline)\b/i, entityTypes: ["knowledge", "zone_intelligence"] },
  { pattern: /\b(crude|wti|brent|api gravity|sulfur|sweet|sour|gasoline|diesel|propane|lpg|jet fuel|ngl|refinery|terminal)\b/i, entityTypes: ["knowledge"] },
  { pattern: /\b(agreement|contract|msa|nda|lease|terms|signature)\b/i, entityTypes: ["knowledge", "agreement"] },
  { pattern: /\b(spectra|product identification|viscosity|flash point|pour point|tan|bs.?w)\b/i, entityTypes: ["knowledge"] },
];

function inferEntityTypes(query: string): string[] | undefined {
  const matched = new Set<string>();
  for (const { pattern, entityTypes } of INTENT_PATTERNS) {
    if (pattern.test(query)) {
      for (const et of entityTypes) matched.add(et);
    }
  }
  // Always include general knowledge if we matched anything domain-specific
  if (matched.size > 0) matched.add("knowledge");
  return matched.size > 0 ? Array.from(matched) : undefined;
}

/**
 * Retrieve the most relevant knowledge chunks for a user query.
 * Uses cached candidates (via aiTurbocharge) + intent-based routing for precision.
 * Falls back gracefully if the embedding service is unavailable.
 */
export async function retrieveContext(
  query: string,
  options: {
    entityTypes?: string[];
    topK?: number;
    threshold?: number;
  } = {},
): Promise<RAGContext> {
  const start = Date.now();
  const topK = options.topK ?? 5;
  const threshold = options.threshold ?? 0.25;

  try {
    // Check if embedding service is available
    const healthy = await embeddingService.isHealthy();
    if (!healthy) {
      return { chunks: [], totalCandidates: 0, retrievalTimeMs: Date.now() - start };
    }

    // Embed the query (uses LRU cache for repeat queries)
    const queryVec = await embeddingService.embedOne(query);

    // Use intent-based routing if no explicit entity types provided
    const effectiveTypes = options.entityTypes?.length ? options.entityTypes : inferEntityTypes(query);

    // Use the cached candidate system from aiTurbocharge (avoids DB hit per query)
    const { semanticSearch } = await import("./aiTurbocharge");
    const results = await semanticSearch(query, {
      entityTypes: effectiveTypes as any,
      topK,
      threshold,
    });

    const chunks: RetrievedChunk[] = results.map(r => ({
      text: r.text || "",
      score: r.score,
      entityType: r.entityType || "",
      entityId: r.entityId || "",
      metadata: r.metadata,
    }));

    return {
      chunks,
      totalCandidates: results.length,
      retrievalTimeMs: Date.now() - start,
    };
  } catch (err) {
    console.error("[RAGRetriever] Error:", err);
    return { chunks: [], totalCandidates: 0, retrievalTimeMs: Date.now() - start };
  }
}

/**
 * Format retrieved chunks into a context string for injection into a Gemini prompt.
 */
export function formatRAGContext(rag: RAGContext): string {
  if (rag.chunks.length === 0) return "";

  const header = `\n\n## Retrieved Knowledge (${rag.chunks.length} relevant chunks, ${rag.retrievalTimeMs}ms)`;
  const body = rag.chunks.map((c, i) =>
    `\n### [${c.entityType}:${c.entityId}] (relevance: ${(c.score * 100).toFixed(1)}%)\n${c.text}`
  ).join("\n");

  return `${header}${body}\n\nUse the above retrieved knowledge to ground your response. If the knowledge is relevant, cite it. If it's not relevant to the user's question, ignore it and respond from your general knowledge.`;
}

/**
 * Seed the knowledge base with initial platform knowledge.
 * Call this once during setup, or periodically to refresh.
 */
export async function seedKnowledgeBase(): Promise<{ indexed: number; errors: number }> {
  let indexed = 0;
  let errors = 0;

  const knowledgeChunks: Array<{ entityType: string; entityId: string; text: string; metadata?: Record<string, unknown> }> = [
    // ERG Hazmat basics
    {
      entityType: "knowledge",
      entityId: "erg-crude-oil",
      text: "UN1267 Petroleum Crude Oil: ERG Guide 128 (Flammable Liquids, Non-Polar), Hazard Class 3, Packing Group I-III. Isolate 50m/165ft. Highly flammable liquid and vapor. May be ignited by heat, sparks, or flames. Vapors may travel to source of ignition and flash back. Fire response: Use dry chemical, CO2, water spray, or alcohol-resistant foam. Spill: Eliminate ignition sources, absorb with earth or other absorbent. Emergency contacts: CHEMTREC 1-800-424-9300, NRC 1-800-424-8802.",
      metadata: { category: "hazmat", unNumber: "1267" },
    },
    {
      entityType: "knowledge",
      entityId: "erg-sour-crude",
      text: "UN3494 Sour Crude Oil (H2S): ERG Guide 131 (Flammable Liquids - Toxic), Hazard Class 3, TIH (Toxic Inhalation Hazard) material. Contains hydrogen sulfide. Extremely dangerous — H2S is lethal at concentrations above 100 ppm. Requires full SCBA and chemical-resistant suit. Large spill night isolation: up to 7km downwind. NEVER enter contaminated area without proper PPE.",
      metadata: { category: "hazmat", unNumber: "3494" },
    },
    {
      entityType: "knowledge",
      entityId: "erg-gasoline",
      text: "UN1203 Gasoline: ERG Guide 128, Hazard Class 3, PG II. Flash point -43°C. Isolate 50m. RBOB Gasoline 61.5° API. Extremely flammable. Vapor heavier than air, may travel long distances to ignition source. Static discharge can ignite vapors during loading/unloading.",
      metadata: { category: "hazmat", unNumber: "1203" },
    },
    {
      entityType: "knowledge",
      entityId: "erg-diesel",
      text: "UN1202 Diesel Fuel: ERG Guide 128, Hazard Class 3, PG III. Flash point >52°C. ULSD (Ultra-Low Sulfur Diesel) 36.5° API. Less volatile than gasoline but still flammable. Winter diesel may have additives affecting handling properties.",
      metadata: { category: "hazmat", unNumber: "1202" },
    },
    {
      entityType: "knowledge",
      entityId: "erg-propane-lpg",
      text: "UN1075 LPG / UN1978 Propane: ERG Guide 115 (Gases - Flammable), Hazard Class 2.1. Isolate 100m. BLEVE risk if tank exposed to fire. Propane specific gravity 0.51, vapor pressure 124 psi at 60°F. HD-5 commercial grade ≥90% propane. Butane UN1011 Guide 115 Class 2.1.",
      metadata: { category: "hazmat", unNumber: "1075" },
    },
    {
      entityType: "knowledge",
      entityId: "erg-h2s",
      text: "UN1053 Hydrogen Sulfide (H2S): ERG Guide 117 (Gases - Toxic - Flammable EXTREME), Hazard Class 2.3, TIH. Lethal at 500+ ppm. Olfactory fatigue at 100 ppm — you stop smelling it before lethal concentrations. Immediate SCBA required. Large spill night protection zone: up to 11km downwind.",
      metadata: { category: "hazmat", unNumber: "1053" },
    },

    // Crude oil knowledge
    {
      entityType: "knowledge",
      entityId: "crude-wti-grades",
      text: "WTI (West Texas Intermediate): 39.6° API, 0.24% sulfur (sweet), benchmark crude for North America. WTI Midland: 42.5° API, 0.24% S. WTI Light: 47.5° API, 0.05% S (ultra-sweet). Eagle Ford: 45° API, 0.1% S (light sweet, South Texas). Bakken: 42.3° API, 0.12% S, HIGH RVP 8-15 psi (volatile, special handling required).",
      metadata: { category: "crude-oil", region: "US" },
    },
    {
      entityType: "knowledge",
      entityId: "crude-gulf-grades",
      text: "Gulf of Mexico crudes: Mars 29° API, 1.95% S (medium sour). Poseidon 29.6° API, 1.97% S. SGC 30.4° API, 2.24% S. LLS (Light Louisiana Sweet) 35.6° API, 0.37% S. HLS (Heavy Louisiana Sweet) 32.9° API, 0.35% S. These are key GoM deepwater production grades.",
      metadata: { category: "crude-oil", region: "Gulf" },
    },
    {
      entityType: "knowledge",
      entityId: "crude-canada-grades",
      text: "Canadian crudes: WCS (Western Canadian Select) 20.8° API, 3.57% S, viscosity 250 cSt, TAN 1.7 — heavy sour bitumen blend. SSP (Synthetic Sweet Petroleum) 32.3° API, 0.21% S — upgraded synthetic. Cold Lake Blend heavy. Albian Heavy Synthetic 20° API, ultra-low 0.15% S. Access Western Blend 21° API, 3.75% S (dilbit).",
      metadata: { category: "crude-oil", region: "Canada" },
    },
    {
      entityType: "knowledge",
      entityId: "crude-global-benchmarks",
      text: "Global crude benchmarks: Brent Blend 38.3° API, 0.37% S (global benchmark, North Sea). Dubai 30.5° API (Asian benchmark). Murban 39.75° API (ICE Futures). Urals 31.5° API, 1.35% S (Russian benchmark). Bonny Light 35.4° API, 0.14% S (Nigerian sweet). Tapis 45.2° API (Asian light benchmark).",
      metadata: { category: "crude-oil", region: "Global" },
    },

    // Platform operations
    {
      entityType: "knowledge",
      entityId: "platform-load-lifecycle",
      text: "EusoTrip load lifecycle: posted → bidding → assigned → en_route_pickup → at_pickup → loading → in_transit → at_delivery → unloading → delivered → invoiced → paid. Cargo exception states: temp_excursion, reefer_breakdown, contamination_reject, seal_breach, weight_violation. These pause the normal flow and trigger alerts to shipper and catalyst.",
      metadata: { category: "platform" },
    },
    {
      entityType: "knowledge",
      entityId: "platform-roles",
      text: "EusoTrip user roles: SHIPPER (posts loads, manages freight), CATALYST (carrier company, accepts loads, manages drivers), DRIVER (operates vehicle, runs loads), BROKER (intermediary), DISPATCH (coordinates drivers), ESCORT/PILOT_CAR (oversize loads), TERMINAL_MANAGER (facility operations), COMPLIANCE_OFFICER, SAFETY_MANAGER, ADMIN, SUPER_ADMIN.",
      metadata: { category: "platform" },
    },
    {
      entityType: "knowledge",
      entityId: "platform-rate-sheets",
      text: "Rate sheet structure for crude oil hauling: Rate per barrel ($/bbl) by mileage bracket (5-mile increments). Example: 1-5mi $0.83, 51-55mi $1.53, 101-105mi $2.43, 201-205mi $4.75. Surcharges: FSC (fuel surcharge based on EIA PADD diesel), wait time $75-85/hr after first hour, split loads $35-50/run, rejects $70-85 with numbered reject ticket, minimum 160 barrels.",
      metadata: { category: "platform" },
    },
    {
      entityType: "knowledge",
      entityId: "platform-run-ticket",
      text: "Run ticket / BOL process: At pickup, driver gauges tank levels (open/close gauge in ft-in), records observed gravity, temperature, BS&W% (basic sediment & water), calculates gross barrels via GOV (Government Standard Volume) tables. BOL includes origin (lease/station), destination (terminal), driver/truck/trailer IDs, hazmat certification, seal numbers. Net barrels = gross minus BS&W deduction.",
      metadata: { category: "platform" },
    },
    {
      entityType: "knowledge",
      entityId: "platform-pipelines",
      text: "Major US pipeline systems: Colonial Pipeline (Houston TX → Linden NJ, 5,500 mi, 2.5M bbl/day, 45% East Coast fuel). Plantation Pipeline (Baton Rouge → DC, 3,100 mi). Explorer Pipeline (Houston → Hammond IN). Magellan Midstream (TX/OK → Midwest). Enterprise Products (TX Gulf Coast, 50,000 mi). Kinder Morgan (83,000 mi national network). Keystone (Hardisty AB → Houston TX).",
      metadata: { category: "infrastructure" },
    },
    {
      entityType: "knowledge",
      entityId: "platform-emergency-response",
      text: "EusoTrip Emergency Response: 'Call to Haul' mass mobilization of drivers when pipeline/refinery infrastructure fails (inspired by Colonial Pipeline attack May 2021 that shut 45% of East Coast fuel). Features: Mobilization Zones with CRITICAL/HIGH/MEDIUM priority, Surge Pay up to 5x multiplier, HOS waivers during declared emergencies, government liaison with FEMA/DOE/DOT/PHMSA/CISA.",
      metadata: { category: "platform" },
    },

    // ── ZEUN MECHANICS — Truck Diagnostics & Repair ──
    { entityType: "knowledge", entityId: "zeun-dtc-aftertreatment", text: "Common aftertreatment DTC codes: SPN 520342 FMI 31 — DEF Doser Condition (clogged doser, DEF pump failure, poor DEF quality). SPN 3364 FMI 4 — EGR Valve Position Error (carbon buildup). SPN 1569 FMI 31 — Engine Protection Torque Derate (DPF full, sensor failure). SPN 3226 FMI 0 — SCR Catalyst Efficiency Below Threshold. SPN 4094 FMI 18 — NOx Sensor Reading Too High. Most aftertreatment issues allow driving to nearest shop but face progressive derate.", metadata: { category: "mechanics", subcategory: "dtc" } },
    { entityType: "knowledge", entityId: "zeun-dtc-engine", text: "Common engine DTC codes: SPN 111 FMI 3 — Engine Coolant Level Low (STOP immediately, risk of engine damage). SPN 100 FMI 3 — Oil Pressure Low (CRITICAL, stop engine). SPN 110 FMI 0 — Coolant Temp High. SPN 91 FMI 3 — Throttle Position Sensor Fault. SPN 84 FMI 2 — Vehicle Speed Signal Error. SPN 190 FMI 0 — Engine Overspeed. SPN 94 FMI 1 — Fuel Delivery Pressure Low. Always check oil level, coolant level, and belt condition first.", metadata: { category: "mechanics", subcategory: "dtc" } },
    { entityType: "knowledge", entityId: "zeun-dtc-brakes", text: "Brake system DTCs: SPN 802 FMI 5 — ABS Wheel Speed Sensor Open Circuit. SPN 1438 FMI 14 — Air Dryer Purge Fault. Low air pressure below 60 psi triggers spring brake application. Compressor governor cut-in 100 psi, cut-out 125 psi. Air tank drain daily. Slack adjuster max 1-inch travel. Brake lining minimum 1/4 inch. Out-of-service criteria: any brake dragging, air leak audible, pushrod travel exceeds limit.", metadata: { category: "mechanics", subcategory: "dtc" } },
    { entityType: "knowledge", entityId: "zeun-def-system", text: "DEF (Diesel Exhaust Fluid) system: 32.5% urea solution, freezes at 12°F (-11°C). DEF consumption ~2-3% of diesel consumption. Tank sizes: 5-23 gallons. DEF quality issues: contamination causes SCR catalyst damage ($3,000-8,000 repair). Symptoms of bad DEF: increased NOx, derate warnings, check engine light. Never mix DEF with diesel. DEF shelf life 1-2 years at proper temperature.", metadata: { category: "mechanics", subcategory: "def" } },
    { entityType: "knowledge", entityId: "zeun-preventive-maintenance", text: "Class 8 truck preventive maintenance schedule: Oil change every 25,000-50,000 miles (varies by engine). DPF cleaning every 200,000-400,000 miles. Coolant flush every 300,000 miles or 5 years. Transmission fluid every 100,000-150,000 miles. Wheel bearing repack every 100,000 miles. Brake inspection every 25,000 miles. Air filter replacement every 30,000-50,000 miles. Annual DOT inspection required.", metadata: { category: "mechanics", subcategory: "maintenance" } },
    { entityType: "knowledge", entityId: "zeun-tire-guide", text: "Commercial truck tire guide: Steer tires minimum 4/32 inch tread depth. Drive tires minimum 2/32 inch. Trailer tires minimum 2/32 inch. Tire pressure: steer 110-120 psi, drive 95-105 psi, trailer 95-105 psi. Recapping allowed on drive and trailer positions only, never steer. Tire blowout: grip wheel firmly, DO NOT brake hard, slow down gradually, pull to safe area. Mismatched duals cause irregular wear.", metadata: { category: "mechanics", subcategory: "tires" } },
    { entityType: "knowledge", entityId: "zeun-emergency-procedures", text: "Truck emergency procedures: ENGINE FIRE — pull over, shut off engine, evacuate 100ft, call 911. BRAKE FAILURE — downshift, use engine brake, find runaway ramp or uphill grade. TIRE BLOWOUT — grip wheel, no hard braking, slow gradually. ROLLOVER RISK — reduce speed in curves, check load distribution. HAZMAT SPILL — evacuate upwind, call CHEMTREC 1-800-424-9300, do NOT attempt cleanup. MEDICAL EMERGENCY — pull over safely, call 911, use first aid kit.", metadata: { category: "mechanics", subcategory: "emergency" } },

    // ── COMPLIANCE & REGULATORY ──
    { entityType: "knowledge", entityId: "compliance-hos", text: "FMCSA Hours of Service rules (Property-Carrying): 11-hour driving limit after 10 consecutive hours off duty. 14-hour on-duty window. 30-minute break required after 8 cumulative hours of driving. 60/70-hour limit over 7/8 consecutive days. 34-hour restart resets weekly limits. Sleeper berth: 7/3 or 8/2 split allowed. Short-haul exception: 150 air-mile radius, 14-hour duty period, no ELD required. Adverse driving: +2 hours driving time for unexpected conditions.", metadata: { category: "compliance", subcategory: "hos" } },
    { entityType: "knowledge", entityId: "compliance-eld", text: "ELD (Electronic Logging Device) mandate: Required for all CMV drivers subject to HOS rules since Dec 2019. Must be registered with FMCSA. Records duty status automatically. Data transfer to inspectors via Bluetooth, USB, or email. Malfunctions: driver has 8 days to repair, must use paper logs. ELD exempt: pre-2000 model year engines, short-haul drivers, driveaway-towaway. AOBRD (grandfather) devices no longer valid.", metadata: { category: "compliance", subcategory: "eld" } },
    { entityType: "knowledge", entityId: "compliance-hazmat-endorsement", text: "Hazmat endorsement (CDL H or X): Required for any driver transporting hazmat in quantities requiring placards. TSA background check required, renewed every 5 years. Training: general awareness, function-specific, safety, security awareness, in-depth security (for security plans). Placarding: 1,001+ lbs aggregate gross weight for Table 2 hazmat, ANY quantity for Table 1 (explosives, poison gas, WMD). Tanker endorsement (N) also needed for liquid bulk.", metadata: { category: "compliance", subcategory: "hazmat" } },
    { entityType: "knowledge", entityId: "compliance-csa-basics", text: "FMCSA CSA (Compliance, Safety, Accountability) BASICs: Unsafe Driving (speeding, reckless, seatbelt), HOS Compliance, Driver Fitness (licensing, medical cert), Controlled Substances, Vehicle Maintenance, Hazardous Materials Compliance, Crash Indicator. Percentile scores 0-100, intervention thresholds vary by BASIC. Scores update monthly. High scores trigger warning letters, investigations, or cooperative safety plans.", metadata: { category: "compliance", subcategory: "csa" } },
    { entityType: "knowledge", entityId: "compliance-drug-testing", text: "FMCSA drug & alcohol testing: Pre-employment (drug), Random (50% drug, 10% alcohol annually), Post-accident, Reasonable suspicion, Return-to-duty, Follow-up. Substances tested: marijuana, cocaine, amphetamines, opioids, PCP. BAC limit: 0.04% while operating CMV. Positive test or refusal: immediately removed from safety-sensitive duties, must complete SAP evaluation and return-to-duty process. FMCSA Drug & Alcohol Clearinghouse required since Jan 2020.", metadata: { category: "compliance", subcategory: "drug-testing" } },
    { entityType: "knowledge", entityId: "compliance-weight-limits", text: "Federal weight limits: Single axle 20,000 lbs. Tandem axle 34,000 lbs. Gross vehicle weight 80,000 lbs. Bridge formula determines max weight based on axle spacing. Overweight permits vary by state. Common overweight violations: $100-$16,000+ fines depending on amount over. Weigh station procedures: approach at posted speed, follow signals, scale reading determines if secondary inspection needed. PrePass/Drivewyze bypass systems.", metadata: { category: "compliance", subcategory: "weight" } },

    // ── GAMIFICATION / THE HAUL ──
    { entityType: "knowledge", entityId: "gamification-overview", text: "EusoTrip Gamification System 'The Haul': XP-based progression with levels and tiers (Bronze, Silver, Gold, Platinum, Diamond). EusoMiles currency earned through missions, badges, and crate drops. Mission types: daily, weekly, monthly, epic, seasonal, raid, story, achievement. Categories: deliveries, earnings, safety, efficiency, social, special, onboarding. Reward crates: common, uncommon, rare, epic, legendary, mythic — each with increasing EusoMiles and XP.", metadata: { category: "gamification" } },
    { entityType: "knowledge", entityId: "gamification-missions", text: "Mission system: Missions are role-specific — drivers get delivery and safety missions, catalysts get fleet management missions, shippers get posting and volume missions. Weekly rotation with AI-generated missions based on platform activity. Max 10 active missions per user. HOS compliance check before starting driving missions. Mission progress tracked automatically via platform events (load completion, on-time delivery, safety scores).", metadata: { category: "gamification" } },
    { entityType: "knowledge", entityId: "gamification-badges", text: "Badge categories: Milestone (first load, 100 loads, 10k miles), Performance (on-time streak, fuel efficiency champion), Specialty (hazmat certified, oversize specialist), Seasonal (holiday challenges), Epic (rare achievements), Legendary (platform-wide recognition). Badges award XP and can be displayed on user profiles (max 3 display badges). Rare badges have special visual effects.", metadata: { category: "gamification" } },

    // ── SPECTRA-MATCH PRODUCT IDENTIFICATION ──
    { entityType: "knowledge", entityId: "spectra-product-classes", text: "SPECTRA-MATCH product classification system: Petroleum products identified by API gravity, sulfur content, RVP (Reid Vapor Pressure), viscosity, flash point, pour point, TAN (Total Acid Number), BS&W% (Basic Sediment & Water). Categories: crude oil (light/medium/heavy, sweet/sour), refined products (gasoline, diesel, jet fuel, heating oil), NGLs, chemicals, biofuels. Each product has specific handling, storage, and transportation requirements.", metadata: { category: "spectra-match" } },
    { entityType: "knowledge", entityId: "spectra-tank-types", text: "Tank truck types for petroleum: MC-306/DOT-406 (atmospheric, gasoline/diesel, 8,000-9,500 gal). MC-307/DOT-407 (low-pressure chemical, corrosives). MC-312/DOT-412 (corrosive chemical). MC-331 (high-pressure, propane/anhydrous ammonia, 10,000-11,500 gal). MC-338 (cryogenic, LNG/nitrogen). DOT-407/SS (stainless steel, food-grade). Crude oil haulers: DOT-407 modified, 130-210 bbl capacity. Compartmented tanks for multi-product delivery.", metadata: { category: "spectra-match" } },

    // ── DOCUMENT CENTER & AGREEMENTS ──
    { entityType: "knowledge", entityId: "doc-center-types", text: "Document Center categories: CDL/License, Medical Card (DOT physical, valid 2 years max), Insurance (COI, cargo, general liability), Vehicle Registration, Annual Inspection (valid 12 months), Hazmat Certification, TWIC Card, Drug Test Results, MVR (Motor Vehicle Record), W-9/Tax Forms, Carrier Authority (MC/DOT), BOL/Run Tickets, Rate Confirmations, Fuel Receipts, Lumper Receipts, Proof of Delivery.", metadata: { category: "documents" } },
    { entityType: "knowledge", entityId: "agreements-types", text: "Agreement types on EusoTrip: Carrier-Shipper contract (rates, lanes, volume commitments), Broker-Carrier agreement, Owner-Operator lease agreement, Load Rate Confirmation (per-load terms), Master Service Agreement (MSA), NDA, Equipment lease, Fuel card agreement, Insurance requirements addendum. Digital signature via platform. Auto-expiration alerts 30/60/90 days before end date.", metadata: { category: "agreements" } },

    // ── SUPPORT & HELP CENTER ──
    { entityType: "knowledge", entityId: "support-common-issues", text: "Common support topics: Account verification/approval delays, payment processing (ACH 3-5 business days, QuickPay 24hr), load disputes (rate discrepancies, accessorial charges), ELD connectivity issues, document upload failures, insurance certificate updates, MC authority activation, driver qualification file completion, two-factor authentication setup, password reset, mobile app troubleshooting.", metadata: { category: "support" } },

    // ── MARKET INTELLIGENCE ──
    { entityType: "knowledge", entityId: "market-diesel-pricing", text: "Diesel fuel pricing: EIA publishes weekly retail diesel prices by PADD region. PADD 1 (East Coast), PADD 2 (Midwest), PADD 3 (Gulf Coast — typically cheapest), PADD 4 (Rocky Mountain), PADD 5 (West Coast — typically most expensive, includes CA). Fuel surcharge calculation: (Current diesel price - Base diesel price) / Average MPG = FSC per mile. Typical Class 8 MPG: 5.5-7.0.", metadata: { category: "market-intelligence" } },
    { entityType: "knowledge", entityId: "market-freight-rates", text: "Freight rate factors: Lane supply/demand, seasonal patterns (produce season Q1-Q3, holiday Q4), fuel costs, equipment type (flatbed premium, reefer premium), weight/dimensions, hazmat surcharge, detention time, accessorials (lumper, driver assist, TONU). Spot market vs contract rates. DAT/Truckstop load-to-truck ratio indicates market tightness. Rate per mile varies: dry van $2-4/mi, flatbed $2.50-5/mi, reefer $2.50-5/mi, tanker $3-7/mi.", metadata: { category: "market-intelligence" } },

    // ── ZONE INTELLIGENCE ──
    { entityType: "knowledge", entityId: "zone-weather-impacts", text: "Weather impacts on trucking: Winter storms — chain requirements (I-80 Donner Pass, I-70 Colorado, I-90 Montana). Hurricane season Jun-Nov Gulf Coast — evacuation route loads, fuel pre-positioning. Tornado Alley spring storms — route diversions. Heat waves — tire blowout risk increases above 100°F, cooling system stress. Fog — I-5 Central Valley CA, I-10 Louisiana. Flooding — low-water crossings, bridge weight restrictions during high water.", metadata: { category: "zone-intelligence" } },
    { entityType: "knowledge", entityId: "zone-major-corridors", text: "Major freight corridors: I-10 (LA to Jacksonville, 2,460 mi — busiest East-West southern route). I-40 (Barstow to Wilmington NC). I-80 (San Francisco to NYC area). I-95 (Maine to Miami — busiest North-South East Coast). I-35 (Laredo TX to Duluth MN — NAFTA corridor). I-65 (Mobile to Gary IN). I-75 (Miami to Sault Ste. Marie). Key intermodal: Chicago (largest rail hub), LA/Long Beach (largest port), Houston (energy hub).", metadata: { category: "zone-intelligence" } },
  ];

  // Try to index all knowledge chunks
  for (const chunk of knowledgeChunks) {
    try {
      const hash = await EmbeddingService.contentHash(chunk.text);
      const results = await embeddingService.embed([chunk.text]);
      if (results.length > 0) {
        const { getDb } = await import("../../db");
        const { embeddings } = await import("../../../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();
        if (db) {
          // Upsert
          await db.delete(embeddings).where(and(
            eq(embeddings.entityType, chunk.entityType as any),
            eq(embeddings.entityId, chunk.entityId),
          ));
          await db.insert(embeddings).values({
            entityType: chunk.entityType as any,
            entityId: chunk.entityId,
            contentHash: hash,
            embedding: results[0].embedding.values,
            dimensions: results[0].embedding.dimensions,
            model: embeddingService.modelId,
            sourceText: chunk.text,
            metadata: chunk.metadata || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          indexed++;
        }
      }
    } catch (err) {
      console.error(`[RAGRetriever] Failed to seed "${chunk.entityId}":`, err);
      errors++;
    }
  }

  console.log(`[RAGRetriever] Knowledge base seeded: ${indexed} indexed, ${errors} errors`);
  return { indexed, errors };
}
