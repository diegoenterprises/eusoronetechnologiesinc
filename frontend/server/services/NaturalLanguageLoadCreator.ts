/**
 * NATURAL LANGUAGE LOAD CREATION SERVICE (GAP-339)
 *
 * Converts free-text load descriptions into structured load objects.
 * Leverages existing nlpProcessor.parseLoadDescription() and
 * aiSidecar.parseLoadQuery() for entity extraction, with enhanced
 * pattern matching for load-specific fields.
 *
 * Example inputs:
 * - "Need a tanker from Houston TX to Dallas TX next Monday, 40k lbs crude oil, $2800"
 * - "Flatbed Chicago to Atlanta, 45000 lbs steel coils, pickup June 15, deliver June 17"
 * - "Reefer load 20 pallets frozen food from LA to Phoenix ASAP, $3.50/mile"
 */

// ── Types ──

export interface ParsedLoad {
  // Location
  originCity: string | null;
  originState: string | null;
  destinationCity: string | null;
  destinationState: string | null;
  // Cargo
  cargoType: string | null;
  cargoDescription: string | null;
  weight: number | null;
  weightUnit: string;
  palletCount: number | null;
  // Equipment
  equipmentType: string | null;
  // Schedule
  pickupDate: string | null;
  deliveryDate: string | null;
  urgency: "standard" | "expedited" | "asap";
  // Financial
  rate: number | null;
  rateType: "flat" | "per_mile" | null;
  // Special
  hazmat: boolean;
  temperatureControlled: boolean;
  oversized: boolean;
  // Confidence
  confidence: number;
  parsedFields: string[];
  unparsedText: string;
  suggestions: string[];
}

export interface NLParseResult {
  success: boolean;
  parsed: ParsedLoad;
  rawInput: string;
  extractedEntities: { text: string; type: string; confidence: number }[];
}

// ── Constants ──

const US_STATES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};

const STATE_ABBREVS = new Set(Object.values(US_STATES));

const CITY_STATE_MAP: Record<string, string> = {
  houston: "TX", dallas: "TX", austin: "TX", "san antonio": "TX", "fort worth": "TX",
  chicago: "IL", atlanta: "GA", phoenix: "AZ", "los angeles": "CA", "san francisco": "CA",
  "new york": "NY", denver: "CO", miami: "FL", tampa: "FL", orlando: "FL",
  seattle: "WA", portland: "OR", "las vegas": "NV", memphis: "TN", nashville: "TN",
  charlotte: "NC", detroit: "MI", minneapolis: "MN", "kansas city": "MO",
  "st louis": "MO", "new orleans": "LA", "oklahoma city": "OK", tulsa: "OK",
  "el paso": "TX", "salt lake city": "UT", "san diego": "CA", sacramento: "CA",
  indianapolis: "IN", columbus: "OH", cleveland: "OH", pittsburgh: "PA",
  philadelphia: "PA", boston: "MA", baltimore: "MD", "jacksonville": "FL",
  "louisville": "KY", "milwaukee": "WI", albuquerque: "NM", tucson: "AZ",
  "little rock": "AR", "birmingham": "AL", "baton rouge": "LA", "richmond": "VA",
  raleigh: "NC", omaha: "NE", "des moines": "IA", wichita: "KS",
};

const EQUIPMENT_MAP: Record<string, string> = {
  flatbed: "flatbed", "flat bed": "flatbed", flat: "flatbed",
  "dry van": "dry_van", van: "dry_van", "dry": "dry_van",
  reefer: "refrigerated", refrigerated: "refrigerated", "cold": "refrigerated",
  tanker: "tanker", tank: "tanker",
  hopper: "hopper", pneumatic: "pneumatic",
  "step deck": "step_deck", stepdeck: "step_deck",
  lowboy: "lowboy", "low boy": "lowboy",
  "double drop": "double_drop", rgn: "rgn",
  conestoga: "conestoga",
  "auto carrier": "auto_carrier", "car hauler": "auto_carrier",
  "moving van": "moving_van",
  "livestock": "livestock_trailer",
  "grain trailer": "grain_trailer",
  "dump trailer": "dump_trailer",
  intermodal: "intermodal_chassis", container: "container_chassis",
};

const CARGO_MAP: Record<string, string> = {
  crude: "petroleum", oil: "petroleum", petroleum: "petroleum",
  fuel: "petroleum", diesel: "petroleum", gasoline: "petroleum",
  chemical: "chemicals", acid: "chemicals", chemicals: "chemicals",
  food: "refrigerated", produce: "refrigerated", frozen: "refrigerated",
  meat: "refrigerated", dairy: "refrigerated", seafood: "refrigerated",
  lumber: "general_freight", steel: "general_freight", coils: "general_freight",
  machinery: "general_freight", equipment: "general_freight",
  oversized: "oversized", overweight: "oversized", "over-dimensional": "oversized",
  hazmat: "hazmat", hazardous: "hazmat", flammable: "hazmat",
  grain: "bulk_dry", sand: "bulk_dry", gravel: "bulk_dry",
  livestock: "livestock", cattle: "livestock", horses: "livestock",
  cars: "auto_transport", vehicles: "auto_transport", automobiles: "auto_transport",
  household: "moving_household", furniture: "moving_household",
};

// ── Main Parser ──

export function parseNaturalLanguageLoad(text: string): NLParseResult {
  const lower = text.toLowerCase().trim();
  const entities: NLParseResult["extractedEntities"] = [];
  const parsedFields: string[] = [];

  const result: ParsedLoad = {
    originCity: null, originState: null,
    destinationCity: null, destinationState: null,
    cargoType: null, cargoDescription: null,
    weight: null, weightUnit: "lbs", palletCount: null,
    equipmentType: null,
    pickupDate: null, deliveryDate: null, urgency: "standard",
    rate: null, rateType: null,
    hazmat: false, temperatureControlled: false, oversized: false,
    confidence: 0, parsedFields: [], unparsedText: "", suggestions: [],
  };

  // 1. Extract locations (from X to Y pattern)
  const fromTo = lower.match(/from\s+([a-z\s]+?)(?:,?\s*([a-z]{2}))?\s+to\s+([a-z\s]+?)(?:,?\s*([a-z]{2}))?(?:\s|,|$|\.|;)/);
  if (fromTo) {
    const [, originCity, originState, destCity, destState] = fromTo;
    result.originCity = titleCase(originCity.trim());
    result.destinationCity = titleCase(destCity.trim());

    if (originState && STATE_ABBREVS.has(originState.toUpperCase())) {
      result.originState = originState.toUpperCase();
    } else {
      result.originState = CITY_STATE_MAP[originCity.trim()] || null;
    }

    if (destState && STATE_ABBREVS.has(destState.toUpperCase())) {
      result.destinationState = destState.toUpperCase();
    } else {
      result.destinationState = CITY_STATE_MAP[destCity.trim()] || null;
    }

    parsedFields.push("origin", "destination");
    entities.push(
      { text: result.originCity, type: "ORIGIN", confidence: 0.9 },
      { text: result.destinationCity, type: "DESTINATION", confidence: 0.9 },
    );
  } else {
    // Try "X to Y" without "from"
    const toPattern = lower.match(/([a-z\s]+?)(?:,?\s*([a-z]{2}))?\s+to\s+([a-z\s]+?)(?:,?\s*([a-z]{2}))?(?:\s|,|$|\.|;)/);
    if (toPattern) {
      const [, oCity, oState, dCity, dState] = toPattern;
      const oClean = oCity.trim().split(/\s+/).slice(-2).join(" ");
      const dClean = dCity.trim().split(/\s+/).slice(0, 2).join(" ");

      if (CITY_STATE_MAP[oClean] || (oState && STATE_ABBREVS.has(oState.toUpperCase()))) {
        result.originCity = titleCase(oClean);
        result.originState = oState?.toUpperCase() || CITY_STATE_MAP[oClean] || null;
        parsedFields.push("origin");
        entities.push({ text: result.originCity, type: "ORIGIN", confidence: 0.7 });
      }

      if (CITY_STATE_MAP[dClean] || (dState && STATE_ABBREVS.has(dState.toUpperCase()))) {
        result.destinationCity = titleCase(dClean);
        result.destinationState = dState?.toUpperCase() || CITY_STATE_MAP[dClean] || null;
        parsedFields.push("destination");
        entities.push({ text: result.destinationCity, type: "DESTINATION", confidence: 0.7 });
      }
    }
  }

  // 2. Equipment type
  for (const [keyword, equip] of Object.entries(EQUIPMENT_MAP)) {
    if (lower.includes(keyword)) {
      result.equipmentType = equip;
      parsedFields.push("equipment");
      entities.push({ text: keyword, type: "EQUIPMENT", confidence: 0.95 });
      break;
    }
  }

  // 3. Cargo type
  for (const [keyword, cargo] of Object.entries(CARGO_MAP)) {
    if (lower.includes(keyword)) {
      result.cargoType = cargo;
      parsedFields.push("cargoType");
      entities.push({ text: keyword, type: "CARGO", confidence: 0.85 });
      // Cargo description: words around the keyword
      const idx = lower.indexOf(keyword);
      const window = text.substring(Math.max(0, idx - 20), Math.min(text.length, idx + keyword.length + 20)).trim();
      result.cargoDescription = window;
      break;
    }
  }

  // 4. Weight
  const weightMatch = lower.match(/(\d[\d,]*)\s*(?:k)?\s*(lbs?|pounds?|tons?|kg)/i);
  if (weightMatch) {
    let value = parseFloat(weightMatch[1].replace(/,/g, ""));
    const unit = weightMatch[2].toLowerCase();
    if (lower.charAt(lower.indexOf(weightMatch[1]) + weightMatch[1].length) === "k") {
      value *= 1000;
    }
    if (unit.startsWith("ton")) {
      value *= 2000;
      result.weightUnit = "lbs";
    } else if (unit === "kg") {
      result.weightUnit = "kg";
    }
    result.weight = value;
    parsedFields.push("weight");
    entities.push({ text: weightMatch[0], type: "WEIGHT", confidence: 0.9 });
  }
  // Shorthand: "40k" without unit → assume lbs
  if (!result.weight) {
    const shortWeight = lower.match(/(\d+)k\s*(?:lbs?|pounds?)?/);
    if (shortWeight) {
      result.weight = parseInt(shortWeight[1]) * 1000;
      parsedFields.push("weight");
      entities.push({ text: shortWeight[0], type: "WEIGHT", confidence: 0.7 });
    }
  }

  // 5. Pallet count
  const palletMatch = lower.match(/(\d+)\s*(?:pallets?|plt|skids?)/);
  if (palletMatch) {
    result.palletCount = parseInt(palletMatch[1]);
    parsedFields.push("palletCount");
    entities.push({ text: palletMatch[0], type: "PALLETS", confidence: 0.9 });
  }

  // 6. Rate
  const rateMile = lower.match(/\$\s*([\d.]+)\s*(?:\/\s*(?:mi|mile))/);
  if (rateMile) {
    result.rate = parseFloat(rateMile[1]);
    result.rateType = "per_mile";
    parsedFields.push("rate");
    entities.push({ text: rateMile[0], type: "RATE", confidence: 0.95 });
  } else {
    const rateFlat = lower.match(/\$\s*([\d,]+(?:\.\d+)?)/);
    if (rateFlat) {
      result.rate = parseFloat(rateFlat[1].replace(/,/g, ""));
      result.rateType = "flat";
      parsedFields.push("rate");
      entities.push({ text: rateFlat[0], type: "RATE", confidence: 0.85 });
    }
  }

  // 7. Dates
  const datePatterns: [RegExp, string][] = [
    [/(?:pickup|pick up|pick-up)\s+(?:on\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4})/i, "pickup"],
    [/(?:deliver|delivery|drop)\s+(?:on\s+|by\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4})/i, "delivery"],
    [/(\w+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4})/i, "pickup"], // default first date = pickup
  ];

  for (const [pattern, field] of datePatterns) {
    const match = lower.match(pattern);
    if (match) {
      const dateStr = parseDateString(match[1]);
      if (dateStr) {
        if (field === "pickup" && !result.pickupDate) {
          result.pickupDate = dateStr;
          parsedFields.push("pickupDate");
          entities.push({ text: match[1], type: "PICKUP_DATE", confidence: 0.8 });
        } else if (field === "delivery" && !result.deliveryDate) {
          result.deliveryDate = dateStr;
          parsedFields.push("deliveryDate");
          entities.push({ text: match[1], type: "DELIVERY_DATE", confidence: 0.8 });
        }
      }
    }
  }

  // Relative dates
  if (!result.pickupDate) {
    if (lower.includes("today")) {
      result.pickupDate = new Date().toISOString().split("T")[0];
      parsedFields.push("pickupDate");
    } else if (lower.includes("tomorrow")) {
      const d = new Date(); d.setDate(d.getDate() + 1);
      result.pickupDate = d.toISOString().split("T")[0];
      parsedFields.push("pickupDate");
    } else if (lower.includes("next monday")) {
      result.pickupDate = nextDayOfWeek(1);
      parsedFields.push("pickupDate");
    } else if (lower.includes("next tuesday")) {
      result.pickupDate = nextDayOfWeek(2);
      parsedFields.push("pickupDate");
    } else if (lower.includes("next wednesday")) {
      result.pickupDate = nextDayOfWeek(3);
      parsedFields.push("pickupDate");
    } else if (lower.includes("next thursday")) {
      result.pickupDate = nextDayOfWeek(4);
      parsedFields.push("pickupDate");
    } else if (lower.includes("next friday")) {
      result.pickupDate = nextDayOfWeek(5);
      parsedFields.push("pickupDate");
    } else if (lower.match(/next\s+week/)) {
      result.pickupDate = nextDayOfWeek(1); // next Monday
      parsedFields.push("pickupDate");
    }
  }

  // 8. Urgency
  if (lower.includes("asap") || lower.includes("urgent") || lower.includes("emergency") || lower.includes("rush")) {
    result.urgency = "asap";
    parsedFields.push("urgency");
  } else if (lower.includes("expedited") || lower.includes("hot") || lower.includes("priority")) {
    result.urgency = "expedited";
    parsedFields.push("urgency");
  }

  // 9. Special flags
  const hazmatKeywords = ["hazmat", "hazardous", "dangerous goods", "flammable", "corrosive", "explosive", "toxic", "radioactive", "un number", "placard"];
  result.hazmat = hazmatKeywords.some(kw => lower.includes(kw));
  if (result.hazmat) parsedFields.push("hazmat");

  result.temperatureControlled = result.equipmentType === "refrigerated" || ["frozen", "refrigerated", "cold", "temperature controlled", "temp controlled"].some(kw => lower.includes(kw));
  if (result.temperatureControlled) parsedFields.push("temperatureControlled");

  result.oversized = ["oversized", "overweight", "over-dimensional", "wide load", "heavy haul", "permit load"].some(kw => lower.includes(kw));
  if (result.oversized) parsedFields.push("oversized");

  // 10. Confidence score
  const maxFields = 10; // origin, dest, equipment, cargo, weight, rate, pickupDate, deliveryDate, hazmat, urgency
  const uniqueFields = new Set(parsedFields);
  result.confidence = Math.min(100, Math.round((uniqueFields.size / maxFields) * 100));
  result.parsedFields = Array.from(uniqueFields);

  // 11. Suggestions for missing fields
  if (!result.originCity) result.suggestions.push("Add pickup city (e.g., 'from Houston TX')");
  if (!result.destinationCity) result.suggestions.push("Add delivery city (e.g., 'to Dallas TX')");
  if (!result.equipmentType) result.suggestions.push("Specify equipment (e.g., 'flatbed', 'tanker', 'reefer')");
  if (!result.weight) result.suggestions.push("Add weight (e.g., '40000 lbs' or '40k lbs')");
  if (!result.rate) result.suggestions.push("Include rate (e.g., '$2800' or '$3.50/mile')");
  if (!result.pickupDate) result.suggestions.push("Specify pickup date (e.g., 'next Monday', 'June 15')");

  // 12. Unparsed text (remove recognized patterns)
  let remaining = text;
  for (const e of entities) {
    remaining = remaining.replace(new RegExp(escapeRegex(e.text), "i"), "").trim();
  }
  result.unparsedText = remaining.replace(/\s+/g, " ").trim();

  return {
    success: result.parsedFields.length >= 2,
    parsed: result,
    rawInput: text,
    extractedEntities: entities,
  };
}

// ── Helpers ──

function titleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseDateString(str: string): string | null {
  const cleaned = str.replace(/(st|nd|rd|th)/gi, "").trim();
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    // If no year specified and date is in the past, assume next year
    if (!str.match(/\d{4}/) && d < new Date()) {
      d.setFullYear(d.getFullYear() + 1);
    }
    return d.toISOString().split("T")[0];
  }
  return null;
}

function nextDayOfWeek(dayOfWeek: number): string {
  const d = new Date();
  const diff = (dayOfWeek - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}
