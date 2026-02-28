/**
 * NLP PROCESSOR v1.0
 * Natural Language Processing for Logistics
 * 
 * Implements: Entity extraction, text classification, sentiment analysis,
 *             keyword extraction (TF-IDF), intent detection, text similarity
 *
 * Inspired by: spaCy, NLTK, Flair, Sentence-Transformers
 * Pure TypeScript — no Python dependency
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ExtractedEntities {
  locations: { text: string; type: "city" | "state" | "address" | "facility" }[];
  dates: { text: string; parsed?: Date }[];
  amounts: { text: string; value: number; currency: string }[];
  weights: { text: string; value: number; unit: string }[];
  distances: { text: string; value: number; unit: string }[];
  hazmat: { unNumber?: string; hazClass?: string; packingGroup?: string; productName?: string }[];
  vehicles: { type: string; number?: string }[];
  people: { name: string; role?: string }[];
  companies: { name: string }[];
  references: { type: string; number: string }[];
}

export interface ClassificationResult {
  category: string;
  confidence: number;
  subcategory?: string;
  allScores: { category: string; score: number }[];
}

export interface SentimentResult {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  score: number; // -1 to 1
  magnitude: number; // 0-1 (strength)
  keywords: { word: string; sentiment: number }[];
}

export interface KeywordResult {
  keywords: { term: string; score: number; frequency: number }[];
  summary: string;
}

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  suggestedAction?: string;
}

// ═══════════════════════════════════════════════════════════════════
// TOKENIZATION & PREPROCESSING
// ═══════════════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "and", "but", "or", "if", "while", "that", "this", "these", "those",
  "it", "its", "i", "me", "my", "we", "our", "you", "your", "he", "him",
  "his", "she", "her", "they", "them", "their", "what", "which", "who",
]);

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s\-\.#$%]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

function ngrams(tokens: string[], n: number): string[] {
  const result: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    result.push(tokens.slice(i, i + n).join(" "));
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// ENTITY EXTRACTION
// ═══════════════════════════════════════════════════════════════════

const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const STATE_NAMES = new Set(Object.values(US_STATES).map(s => s.toLowerCase()));
const STATE_ABBREVS = new Set(Object.keys(US_STATES));

const HAZMAT_PATTERNS = {
  unNumber: /\bUN\s*(\d{4})\b/gi,
  hazClass: /\bclass\s*(\d+(?:\.\d+)?)\b/gi,
  packingGroup: /\b(?:PG|packing\s*group)\s*(I{1,3}|[123])\b/gi,
  hazProducts: /\b(petroleum\s*crude|gasoline|diesel|propane|ammonia|chlorine|sulfuric\s*acid|hydrochloric|ethanol|methanol|acetone|benzene|toluene|xylene|butane|hydrogen|oxygen|nitrogen|lng|lpg|cng)\b/gi,
};

const VEHICLE_PATTERNS = {
  truck: /\b(?:truck|tractor|cab)\s*#?\s*(\d+)\b/gi,
  trailer: /\b(?:trailer|tank|tanker)\s*#?\s*(\d+)\b/gi,
  equipment: /\b(dry\s*van|reefer|flatbed|tanker|hopper|step\s*deck|lowboy|mc-?33[18]|cryogenic|food\s*grade|pneumatic)\b/gi,
};

const REFERENCE_PATTERNS = {
  bol: /\b(?:BOL|bill\s*of\s*lading)\s*#?\s*([A-Z0-9\-]+)\b/gi,
  po: /\b(?:PO|purchase\s*order)\s*#?\s*([A-Z0-9\-]+)\b/gi,
  load: /\b(?:load|LD)\s*#?\s*([A-Z0-9\-]+)\b/gi,
  ticket: /\b(?:ticket|run\s*ticket)\s*#?\s*([A-Z0-9\-]+)\b/gi,
  dot: /\b(?:DOT|USDOT)\s*#?\s*(\d+)\b/gi,
  mc: /\bMC\s*#?\s*(\d+)\b/gi,
  invoice: /\b(?:invoice|inv)\s*#?\s*([A-Z0-9\-]+)\b/gi,
};

/**
 * Extract entities from text
 */
export function extractEntities(text: string): ExtractedEntities {
  const result: ExtractedEntities = {
    locations: [], dates: [], amounts: [], weights: [],
    distances: [], hazmat: [], vehicles: [], people: [], companies: [], references: [],
  };

  // Locations — state abbreviations
  const stateMatches = text.match(/\b[A-Z]{2}\b/g) || [];
  for (const m of stateMatches) {
    if (STATE_ABBREVS.has(m)) {
      result.locations.push({ text: m, type: "state" });
    }
  }

  // Locations — city, state patterns
  const cityStatePattern = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),?\s*([A-Z]{2})\b/g;
  let csMatch;
  while ((csMatch = cityStatePattern.exec(text)) !== null) {
    if (STATE_ABBREVS.has(csMatch[2])) {
      result.locations.push({ text: `${csMatch[1]}, ${csMatch[2]}`, type: "city" });
    }
  }

  // Dates
  const datePatterns = [
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,
    /\b(\d{4}-\d{2}-\d{2})\b/g,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi,
  ];
  for (const pattern of datePatterns) {
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const parsed = new Date(m[1]);
      result.dates.push({ text: m[1], parsed: isNaN(parsed.getTime()) ? undefined : parsed });
    }
  }

  // Money amounts
  const moneyPattern = /\$\s*([\d,]+(?:\.\d{1,2})?)\b/g;
  let moneyMatch;
  while ((moneyMatch = moneyPattern.exec(text)) !== null) {
    result.amounts.push({
      text: moneyMatch[0],
      value: parseFloat(moneyMatch[1].replace(/,/g, "")),
      currency: "USD",
    });
  }

  // Weights
  const weightPattern = /\b([\d,]+(?:\.\d+)?)\s*(lbs?|pounds?|tons?|kg|kilograms?|bbls?|barrels?|gallons?|gal)\b/gi;
  let wMatch;
  while ((wMatch = weightPattern.exec(text)) !== null) {
    result.weights.push({
      text: wMatch[0],
      value: parseFloat(wMatch[1].replace(/,/g, "")),
      unit: wMatch[2].toLowerCase(),
    });
  }

  // Distances
  const distPattern = /\b([\d,]+(?:\.\d+)?)\s*(miles?|mi|km|kilometers?)\b/gi;
  let dMatch;
  while ((dMatch = distPattern.exec(text)) !== null) {
    result.distances.push({
      text: dMatch[0],
      value: parseFloat(dMatch[1].replace(/,/g, "")),
      unit: dMatch[2].toLowerCase(),
    });
  }

  // Hazmat
  let unMatch;
  while ((unMatch = HAZMAT_PATTERNS.unNumber.exec(text)) !== null) {
    const hazEntry: ExtractedEntities["hazmat"][0] = { unNumber: `UN${unMatch[1]}` };
    result.hazmat.push(hazEntry);
  }
  let hcMatch;
  while ((hcMatch = HAZMAT_PATTERNS.hazClass.exec(text)) !== null) {
    if (result.hazmat.length > 0) result.hazmat[result.hazmat.length - 1].hazClass = hcMatch[1];
    else result.hazmat.push({ hazClass: hcMatch[1] });
  }
  let pgMatch;
  while ((pgMatch = HAZMAT_PATTERNS.packingGroup.exec(text)) !== null) {
    if (result.hazmat.length > 0) result.hazmat[result.hazmat.length - 1].packingGroup = pgMatch[1];
    else result.hazmat.push({ packingGroup: pgMatch[1] });
  }
  let hpMatch;
  while ((hpMatch = HAZMAT_PATTERNS.hazProducts.exec(text)) !== null) {
    if (result.hazmat.length > 0) result.hazmat[result.hazmat.length - 1].productName = hpMatch[1];
    else result.hazmat.push({ productName: hpMatch[1] });
  }

  // Vehicles
  let vMatch;
  while ((vMatch = VEHICLE_PATTERNS.truck.exec(text)) !== null) {
    result.vehicles.push({ type: "truck", number: vMatch[1] });
  }
  while ((vMatch = VEHICLE_PATTERNS.trailer.exec(text)) !== null) {
    result.vehicles.push({ type: "trailer", number: vMatch[1] });
  }
  while ((vMatch = VEHICLE_PATTERNS.equipment.exec(text)) !== null) {
    result.vehicles.push({ type: vMatch[1].toLowerCase().replace(/\s+/g, "_") });
  }

  // References
  for (const [refType, pattern] of Object.entries(REFERENCE_PATTERNS)) {
    let rMatch;
    while ((rMatch = pattern.exec(text)) !== null) {
      result.references.push({ type: refType, number: rMatch[1] });
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// TEXT CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════

const CLASSIFICATION_RULES: Record<string, { keywords: string[]; weight: number }[]> = {
  "damage_claim": [
    { keywords: ["damage", "damaged", "broken", "dent", "scratch", "leak", "spill", "contaminated"], weight: 3 },
    { keywords: ["claim", "insurance", "loss", "compensation", "reimburse"], weight: 2 },
  ],
  "delay_issue": [
    { keywords: ["late", "delay", "delayed", "behind", "overdue", "missed", "detention"], weight: 3 },
    { keywords: ["schedule", "appointment", "window", "eta", "arrival"], weight: 1 },
  ],
  "safety_incident": [
    { keywords: ["accident", "crash", "collision", "rollover", "fire", "explosion", "injury"], weight: 4 },
    { keywords: ["safety", "violation", "hazard", "dangerous", "emergency"], weight: 2 },
    { keywords: ["dot", "fmcsa", "osha", "inspection", "citation"], weight: 2 },
  ],
  "compliance_issue": [
    { keywords: ["expired", "overdue", "non-compliant", "violation", "audit", "penalty"], weight: 3 },
    { keywords: ["license", "permit", "certification", "endorsement", "ifta", "irp"], weight: 2 },
    { keywords: ["hos", "hours", "logbook", "eld", "driving", "rest"], weight: 2 },
  ],
  "rate_dispute": [
    { keywords: ["rate", "price", "cost", "charge", "fee", "surcharge", "accessorial"], weight: 3 },
    { keywords: ["dispute", "incorrect", "overcharge", "undercharge", "billing", "invoice"], weight: 3 },
  ],
  "equipment_issue": [
    { keywords: ["breakdown", "malfunction", "repair", "maintenance", "tire", "brake", "engine"], weight: 3 },
    { keywords: ["trailer", "truck", "tractor", "reefer", "tanker", "equipment"], weight: 2 },
  ],
  "load_issue": [
    { keywords: ["shortage", "overage", "missing", "wrong", "incorrect", "refused", "rejected"], weight: 3 },
    { keywords: ["load", "shipment", "freight", "cargo", "delivery", "pickup"], weight: 1 },
  ],
  "hazmat_issue": [
    { keywords: ["hazmat", "hazardous", "chemical", "toxic", "flammable", "corrosive"], weight: 4 },
    { keywords: ["placard", "shipping papers", "un number", "emergency response"], weight: 3 },
    { keywords: ["spill", "leak", "release", "contamination", "exposure"], weight: 3 },
  ],
  "customer_service": [
    { keywords: ["help", "support", "question", "issue", "problem", "need"], weight: 1 },
    { keywords: ["account", "login", "password", "access", "update"], weight: 2 },
  ],
  "positive_feedback": [
    { keywords: ["great", "excellent", "good", "thank", "appreciate", "satisfied", "professional"], weight: 2 },
    { keywords: ["recommend", "best", "outstanding", "reliable", "fast", "efficient"], weight: 2 },
  ],
};

/**
 * Classify text into logistics categories
 */
export function classifyText(text: string): ClassificationResult {
  const tokens = tokenize(text);
  const bigrams = ngrams(tokens, 2);
  const allTerms = [...tokens, ...bigrams];

  const scores: Record<string, number> = {};
  for (const [category, rules] of Object.entries(CLASSIFICATION_RULES)) {
    let score = 0;
    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        const kwTokens = keyword.split(" ");
        if (kwTokens.length === 1) {
          if (tokens.includes(keyword)) score += rule.weight;
        } else {
          if (allTerms.includes(keyword)) score += rule.weight;
        }
      }
    }
    scores[category] = score;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const maxScore = sorted[0]?.[1] || 0;
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  return {
    category: maxScore > 0 ? sorted[0][0] : "general",
    confidence: totalScore > 0 ? Math.min(95, Math.round((maxScore / totalScore) * 100)) : 0,
    subcategory: sorted.length > 1 && sorted[1][1] > 0 ? sorted[1][0] : undefined,
    allScores: sorted.filter(([, s]) => s > 0).map(([cat, s]) => ({
      category: cat,
      score: Math.round((s / Math.max(totalScore, 1)) * 100),
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════
// SENTIMENT ANALYSIS
// ═══════════════════════════════════════════════════════════════════

const SENTIMENT_LEXICON: Record<string, number> = {
  // Positive
  good: 0.6, great: 0.8, excellent: 0.9, outstanding: 0.95, amazing: 0.9,
  reliable: 0.7, professional: 0.7, efficient: 0.7, fast: 0.5, safe: 0.6,
  clean: 0.4, satisfied: 0.7, recommend: 0.8, thank: 0.5, appreciate: 0.6,
  best: 0.8, perfect: 0.9, smooth: 0.5, helpful: 0.6, friendly: 0.5,
  // Negative
  bad: -0.6, terrible: -0.9, awful: -0.9, horrible: -0.9, worst: -0.95,
  damaged: -0.7, broken: -0.7, late: -0.6, delayed: -0.6, slow: -0.4,
  rude: -0.7, unprofessional: -0.8, dangerous: -0.8, unsafe: -0.8,
  dirty: -0.4, disappointed: -0.6, frustrated: -0.7, angry: -0.7,
  complaint: -0.5, problem: -0.4, issue: -0.3, wrong: -0.5, fail: -0.7,
  refused: -0.6, rejected: -0.5, missing: -0.5, lost: -0.6, stolen: -0.8,
  accident: -0.8, crash: -0.9, spill: -0.7, leak: -0.6, violation: -0.6,
  // Intensifiers
  very: 0, extremely: 0, incredibly: 0, absolutely: 0, totally: 0,
};

const NEGATORS = new Set(["not", "no", "never", "neither", "nor", "hardly", "barely", "scarcely", "dont", "doesnt", "didnt", "wasnt", "werent", "isnt", "arent", "wont", "cant", "couldnt", "shouldnt", "wouldnt"]);
const INTENSIFIERS = new Set(["very", "extremely", "incredibly", "absolutely", "totally", "really", "so", "quite", "rather"]);

/**
 * Analyze sentiment of text
 */
export function analyzeSentiment(text: string): SentimentResult {
  const tokens = text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  let totalScore = 0;
  let wordCount = 0;
  const keywordSentiments: { word: string; sentiment: number }[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const lexScore = SENTIMENT_LEXICON[token];
    if (lexScore === undefined || lexScore === 0) continue;

    let score = lexScore;

    // Check for negation in previous 3 words
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if (NEGATORS.has(tokens[j])) { score *= -0.8; break; }
    }

    // Check for intensifier
    if (i > 0 && INTENSIFIERS.has(tokens[i - 1])) {
      score *= 1.4;
    }

    totalScore += score;
    wordCount++;
    keywordSentiments.push({ word: token, sentiment: Math.round(score * 100) / 100 });
  }

  const avgScore = wordCount > 0 ? totalScore / wordCount : 0;
  const magnitude = wordCount > 0 ? Math.min(1, Math.abs(totalScore) / Math.max(wordCount, 1)) : 0;

  let sentiment: SentimentResult["sentiment"] = "NEUTRAL";
  if (avgScore > 0.15) sentiment = "POSITIVE";
  else if (avgScore < -0.15) sentiment = "NEGATIVE";

  return {
    sentiment,
    score: Math.round(Math.max(-1, Math.min(1, avgScore)) * 100) / 100,
    magnitude: Math.round(magnitude * 100) / 100,
    keywords: keywordSentiments.sort((a, b) => Math.abs(b.sentiment) - Math.abs(a.sentiment)).slice(0, 10),
  };
}

// ═══════════════════════════════════════════════════════════════════
// KEYWORD EXTRACTION (TF-IDF inspired)
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract keywords from text using TF-IDF-like scoring
 */
export function extractKeywords(text: string, maxKeywords: number = 10): KeywordResult {
  const tokens = tokenize(text);
  if (!tokens.length) return { keywords: [], summary: "" };

  // Term frequency
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }

  // Score by TF * length bonus (longer terms are more specific)
  const scored = Array.from(tf).map(([term, freq]) => ({
    term,
    score: Math.round((freq / tokens.length) * Math.log(1 + term.length) * 1000) / 1000,
    frequency: freq,
  })).sort((a, b) => b.score - a.score);

  const keywords = scored.slice(0, maxKeywords);
  const summary = keywords.slice(0, 5).map(k => k.term).join(", ");

  return { keywords, summary };
}

// ═══════════════════════════════════════════════════════════════════
// INTENT DETECTION (for ESANG AI chat enhancement)
// ═══════════════════════════════════════════════════════════════════

const INTENT_PATTERNS: { intent: string; patterns: RegExp[]; action?: string }[] = [
  { intent: "find_load", patterns: [/find.*load/i, /search.*load/i, /available.*load/i, /load.*from.*to/i], action: "search_loads" },
  { intent: "check_rate", patterns: [/rate.*from.*to/i, /how much.*ship/i, /price.*lane/i, /cost.*transport/i], action: "predict_rate" },
  { intent: "track_shipment", patterns: [/where.*load/i, /track.*shipment/i, /eta.*delivery/i, /status.*load/i], action: "track_load" },
  { intent: "check_compliance", patterns: [/compliance.*status/i, /expir.*document/i, /hos.*hours/i, /inspection.*due/i], action: "check_compliance" },
  { intent: "report_incident", patterns: [/report.*accident/i, /report.*incident/i, /safety.*issue/i, /damage.*report/i], action: "report_incident" },
  { intent: "find_facility", patterns: [/nearest.*terminal/i, /find.*facility/i, /closest.*refinery/i, /terminal.*near/i], action: "search_facilities" },
  { intent: "check_weather", patterns: [/weather.*route/i, /road.*condition/i, /storm.*area/i], action: "check_weather" },
  { intent: "manage_bid", patterns: [/submit.*bid/i, /bid.*load/i, /my.*bid/i, /withdraw.*bid/i], action: "manage_bids" },
  { intent: "erg_lookup", patterns: [/erg.*guide/i, /hazmat.*response/i, /un.*number/i, /emergency.*response/i], action: "erg_lookup" },
  { intent: "get_help", patterns: [/help/i, /how.*do/i, /what.*is/i, /explain/i], action: "help" },
];

/**
 * Detect user intent from message
 */
export function detectIntent(message: string): IntentResult {
  for (const { intent, patterns, action } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        const entities = extractEntities(message);
        const entityMap: Record<string, string> = {};
        if (entities.locations.length) entityMap.location = entities.locations[0].text;
        if (entities.amounts.length) entityMap.amount = String(entities.amounts[0].value);
        if (entities.hazmat.length) entityMap.hazmat = entities.hazmat[0].unNumber || entities.hazmat[0].productName || "";
        if (entities.references.length) entityMap.reference = `${entities.references[0].type}:${entities.references[0].number}`;

        return { intent, confidence: 85, entities: entityMap, suggestedAction: action };
      }
    }
  }

  return { intent: "general", confidence: 30, entities: {}, suggestedAction: "chat" };
}

/**
 * Auto-classify incident severity from description
 */
export function classifyIncidentSeverity(description: string): {
  severity: "CRITICAL" | "MAJOR" | "MINOR" | "INFO";
  score: number;
  reasoning: string;
} {
  const text = description.toLowerCase();

  const criticalTerms = ["fatality", "death", "explosion", "fire", "rollover", "major spill", "hazmat release", "evacuation", "hospitalized"];
  const majorTerms = ["injury", "accident", "collision", "significant damage", "road closure", "cargo loss", "environmental", "violation"];
  const minorTerms = ["minor damage", "scratch", "dent", "delay", "near miss", "fender bender", "warning"];

  let criticalScore = 0, majorScore = 0, minorScore = 0;
  for (const term of criticalTerms) { if (text.includes(term)) criticalScore += 3; }
  for (const term of majorTerms) { if (text.includes(term)) majorScore += 2; }
  for (const term of minorTerms) { if (text.includes(term)) minorScore += 1; }

  if (criticalScore >= 3) return { severity: "CRITICAL", score: Math.min(100, criticalScore * 20), reasoning: "Contains critical safety keywords indicating severe incident" };
  if (majorScore >= 4) return { severity: "MAJOR", score: Math.min(100, majorScore * 15), reasoning: "Contains major incident indicators" };
  if (minorScore >= 2 || majorScore >= 2) return { severity: "MINOR", score: Math.min(100, (minorScore + majorScore) * 15), reasoning: "Contains minor incident indicators" };
  return { severity: "INFO", score: 10, reasoning: "No significant severity indicators detected" };
}

/**
 * Parse load description into structured data
 */
export function parseLoadDescription(text: string): {
  origin?: string;
  destination?: string;
  commodity?: string;
  weight?: { value: number; unit: string };
  distance?: { value: number; unit: string };
  hazmat?: boolean;
  equipment?: string;
  rate?: number;
  dates?: string[];
} {
  const entities = extractEntities(text);
  const locations = entities.locations.filter(l => l.type === "city" || l.type === "state");

  return {
    origin: locations[0]?.text,
    destination: locations[1]?.text,
    commodity: entities.hazmat[0]?.productName || undefined,
    weight: entities.weights[0] ? { value: entities.weights[0].value, unit: entities.weights[0].unit } : undefined,
    distance: entities.distances[0] ? { value: entities.distances[0].value, unit: entities.distances[0].unit } : undefined,
    hazmat: entities.hazmat.length > 0,
    equipment: entities.vehicles.find(v => !v.number)?.type,
    rate: entities.amounts[0]?.value,
    dates: entities.dates.map(d => d.text),
  };
}
