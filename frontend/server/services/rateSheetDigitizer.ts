/**
 * RATE SHEET DIGITIZER — EusoTrip Platform
 *
 * Parses uploaded CSV, XLSX, and PDF files into structured rate tier + surcharge
 * data that maps 1:1 to the platform's digital rate sheet schema.
 *
 * Platform schema (from rateSheet router):
 *   rateTiers[]: { minMiles, maxMiles, ratePerBarrel }
 *   surcharges:  { fscEnabled, fscBaselineDieselPrice, fscMilesPerGallon,
 *                  fscPaddRegion, waitTimeFreeHours, waitTimeRatePerHour,
 *                  splitLoadFee, rejectFee, minimumBarrels,
 *                  travelSurchargePerMile, longLeaseRoadFee, multipleGatesFee }
 *
 * CSV/XLSX: Direct column extraction with flexible header matching.
 * PDF:      ESANG AI (Gemini) extracts structured JSON with domain-specific prompt.
 * All:      Post-extraction normalization + validation ensures the output is
 *           ready to save as a platform rate sheet with zero transformation.
 */

import { parse as csvParse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { esangAI } from "../_core/esangAI";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES — exactly match the platform's rate sheet schema
// ═══════════════════════════════════════════════════════════════════════════

export interface PlatformRateTier {
  minMiles: number;
  maxMiles: number;
  ratePerBarrel: number;
}

export interface PlatformSurcharges {
  fscEnabled: boolean;
  fscBaselineDieselPrice: number;
  fscMilesPerGallon: number;
  fscPaddRegion: string;
  waitTimeFreeHours: number;
  waitTimeRatePerHour: number;
  splitLoadFee: number;
  rejectFee: number;
  minimumBarrels: number;
  travelSurchargePerMile: number;
  longLeaseRoadFee?: number;
  multipleGatesFee?: number;
}

export interface DigitizeResult {
  rateTiers: PlatformRateTier[];
  surcharges: PlatformSurcharges;
  rateUnit: string;
  productType: string | null;
  region: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  issuedBy: string | null;
  issuedTo: string | null;
  warnings: string[];
  source: "csv" | "xlsx" | "pdf";
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT SURCHARGES — platform defaults for any missing fields
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_SURCHARGES: PlatformSurcharges = {
  fscEnabled: true,
  fscBaselineDieselPrice: 3.75,
  fscMilesPerGallon: 5,
  fscPaddRegion: "3",
  waitTimeFreeHours: 1,
  waitTimeRatePerHour: 85,
  splitLoadFee: 50,
  rejectFee: 85,
  minimumBarrels: 160,
  travelSurchargePerMile: 1.50,
};

// ═══════════════════════════════════════════════════════════════════════════
// HEADER MATCHING — flexible column detection for CSV/XLSX
// ═══════════════════════════════════════════════════════════════════════════

const MILES_MIN_PATTERNS = [/min.*mile/i, /from.*mile/i, /mile.*min/i, /mile.*from/i, /start.*mile/i, /low.*mile/i, /^min$/i, /^from$/i];
const MILES_MAX_PATTERNS = [/max.*mile/i, /to.*mile/i, /mile.*max/i, /mile.*to/i, /end.*mile/i, /high.*mile/i, /^max$/i, /^to$/i, /^miles$/i];
const RATE_PATTERNS = [/rate/i, /price/i, /\$.*bbl/i, /per.*bbl/i, /per.*mile/i, /cost/i, /charge/i, /\$/i];
const MILES_RANGE_PATTERNS = [/mile/i, /range/i, /distance/i];

function matchHeader(header: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(header.trim()));
}

function detectRateUnit(headers: string[], _rows: any[]): string {
  const joined = headers.join(" ").toLowerCase();
  if (joined.includes("bbl") || joined.includes("barrel")) return "per_barrel";
  if (joined.includes("cwt")) return "per_cwt";
  if (joined.includes("ton")) return "per_ton";
  if (joined.includes("pallet")) return "per_pallet";
  if (joined.includes("gallon")) return "per_gallon";
  if (joined.includes("flat")) return "flat_rate";
  return "per_mile";
}

function parseMileRange(val: string): { min: number; max: number } | null {
  const cleaned = String(val).replace(/,/g, "").trim();
  const m = cleaned.match(/(\d+)\s*[-–—]\s*(\d+)/) || cleaned.match(/(\d+)\s+to\s+(\d+)/i);
  if (m) return { min: parseInt(m[1]), max: parseInt(m[2]) };
  const single = cleaned.match(/^(\d+)$/);
  if (single) return { min: 0, max: parseInt(single[1]) };
  return null;
}

function parseNumeric(val: unknown): number {
  if (typeof val === "number") return val;
  const s = String(val).replace(/[$,\s]/g, "").trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIER VALIDATION — sort, deduplicate, fill gaps, ensure continuity
// ═══════════════════════════════════════════════════════════════════════════

function validateAndNormalizeTiers(
  raw: Array<{ minMiles: number; maxMiles: number; rate: number }>,
  warnings: string[],
): PlatformRateTier[] {
  if (raw.length === 0) return [];

  // Remove zero/negative rates
  let tiers = raw.filter(t => t.rate > 0 && t.maxMiles > 0);

  // Sort by minMiles ascending
  tiers.sort((a, b) => a.minMiles - b.minMiles);

  // Deduplicate overlapping bands (keep the one with higher rate precision)
  const deduped: typeof tiers = [];
  for (const tier of tiers) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.minMiles === tier.minMiles && prev.maxMiles === tier.maxMiles) {
      warnings.push(`Duplicate tier ${tier.minMiles}-${tier.maxMiles} mi — kept first`);
      continue;
    }
    deduped.push(tier);
  }
  tiers = deduped;

  // Fill gaps between tiers
  const filled: PlatformRateTier[] = [];
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const prev = filled[filled.length - 1];

    // If there's a gap, patch it
    if (prev && t.minMiles > prev.maxMiles + 1) {
      const gapStart = prev.maxMiles + 1;
      const gapEnd = t.minMiles - 1;
      if (gapEnd - gapStart <= 5) {
        // Small gap — extend previous tier
        filled[filled.length - 1] = { ...prev, maxMiles: gapEnd };
      } else {
        warnings.push(`Gap detected: ${gapStart}-${gapEnd} mi — interpolated`);
        // Interpolate rate for gap
        const avgRate = (prev.ratePerBarrel + t.rate) / 2;
        filled.push({ minMiles: gapStart, maxMiles: gapEnd, ratePerBarrel: Math.round(avgRate * 100) / 100 });
      }
    }

    // If minMiles overlaps with previous, adjust
    if (prev && t.minMiles <= prev.maxMiles) {
      filled.push({
        minMiles: prev.maxMiles + 1,
        maxMiles: t.maxMiles,
        ratePerBarrel: Math.round(t.rate * 100) / 100,
      });
    } else {
      filled.push({
        minMiles: t.minMiles,
        maxMiles: t.maxMiles,
        ratePerBarrel: Math.round(t.rate * 100) / 100,
      });
    }
  }

  // Ensure first tier starts at 1
  if (filled.length > 0 && filled[0].minMiles === 0) {
    filled[0].minMiles = 1;
  }

  return filled;
}

// ═══════════════════════════════════════════════════════════════════════════
// SURCHARGE EXTRACTION — text heuristics → platform schema
// ═══════════════════════════════════════════════════════════════════════════

function extractSurchargesFromText(text: string): Partial<PlatformSurcharges> {
  const surcharges: Partial<PlatformSurcharges> = {};

  // FSC
  if (/fuel\s*surcharge|fsc\b/i.test(text)) {
    surcharges.fscEnabled = true;
    const baseMatch = text.match(/base(?:line)?.*?\$?([\d.]+)\s*(?:\/?\s*gal|per\s*gal)/i)
      || text.match(/\$?([\d.]+)\s*(?:base(?:line)?|per\s*gal)/i)
      || text.match(/diesel\s*(?:price|base).*?\$?([\d.]+)/i);
    if (baseMatch) surcharges.fscBaselineDieselPrice = parseFloat(baseMatch[1]);

    const mpgMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:mpg|miles?\s*per\s*gal)/i);
    if (mpgMatch) surcharges.fscMilesPerGallon = parseFloat(mpgMatch[1]);

    if (/padd\s*[1-5]/i.test(text)) {
      const paddMatch = text.match(/padd\s*(\d)/i);
      if (paddMatch) surcharges.fscPaddRegion = paddMatch[1];
    }
  }

  // Wait time
  const waitMatch = text.match(/wait.*?\$?([\d.]+)\s*(?:\/|per)\s*(?:hr|hour)/i)
    || text.match(/demurrage.*?\$?([\d.]+)\s*(?:\/|per)\s*(?:hr|hour)/i);
  if (waitMatch) surcharges.waitTimeRatePerHour = parseFloat(waitMatch[1]);
  const freeMatch = text.match(/(\d+)\s*(?:hour|hr).*?free/i) || text.match(/free.*?(\d+)\s*(?:hour|hr)/i);
  if (freeMatch) surcharges.waitTimeFreeHours = parseInt(freeMatch[1]);

  // Split load
  const splitMatch = text.match(/split\s*(?:load)?.*?\$?([\d.]+)/i);
  if (splitMatch) surcharges.splitLoadFee = parseFloat(splitMatch[1]);

  // Reject
  const rejectMatch = text.match(/reject.*?\$?([\d.]+)/i);
  if (rejectMatch) surcharges.rejectFee = parseFloat(rejectMatch[1]);

  // Minimum barrels
  const minBblMatch = text.match(/min(?:imum)?.*?(\d+)\s*(?:bbl|barrel)/i)
    || text.match(/(\d+)\s*(?:bbl|barrel)\s*min/i);
  if (minBblMatch) surcharges.minimumBarrels = parseInt(minBblMatch[1]);

  // Travel surcharge
  const travelMatch = text.match(/travel.*?\$?([\d.]+)\s*(?:\/|per)\s*mi/i)
    || text.match(/deadhead.*?\$?([\d.]+)\s*(?:\/|per)\s*mi/i);
  if (travelMatch) surcharges.travelSurchargePerMile = parseFloat(travelMatch[1]);

  // Lease road / gate fees
  const leaseMatch = text.match(/lease\s*road.*?\$?([\d.]+)/i);
  if (leaseMatch) surcharges.longLeaseRoadFee = parseFloat(leaseMatch[1]);
  const gateMatch = text.match(/(?:multiple|extra)\s*gate.*?\$?([\d.]+)/i);
  if (gateMatch) surcharges.multipleGatesFee = parseFloat(gateMatch[1]);

  return surcharges;
}

// Merge extracted surcharges with platform defaults
function mergeSurcharges(extracted: Partial<PlatformSurcharges>): PlatformSurcharges {
  return {
    ...DEFAULT_SURCHARGES,
    ...extracted,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CSV PARSER
// ═══════════════════════════════════════════════════════════════════════════

function parseCSV(buffer: Buffer): DigitizeResult {
  const text = buffer.toString("utf-8");
  const warnings: string[] = [];

  let records: Record<string, string>[];
  try {
    records = csvParse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (e: any) {
    throw new Error(`CSV parse error: ${e.message}`);
  }

  if (records.length === 0) throw new Error("CSV file is empty or has no data rows");

  const headers = Object.keys(records[0]);
  return extractTiersFromRows(headers, records, text, warnings, "csv");
}

// ═══════════════════════════════════════════════════════════════════════════
// XLSX PARSER
// ═══════════════════════════════════════════════════════════════════════════

function parseXLSX(buffer: Buffer): DigitizeResult {
  const warnings: string[] = [];
  const workbook = XLSX.read(buffer, { type: "buffer" });

  let sheetName = workbook.SheetNames[0];
  for (const name of workbook.SheetNames) {
    if (/rate|schedule|tier|price/i.test(name)) {
      sheetName = name;
      break;
    }
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error("No worksheet found in Excel file");

  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (rawRows.length < 2) throw new Error("Excel sheet has no data rows");

  const headers = rawRows[0].map((h: any) => String(h).trim());
  const records = rawRows.slice(1)
    .filter(row => row.some((cell: any) => String(cell).trim() !== ""))
    .map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = String(row[i] ?? ""); });
      return obj;
    });

  if (records.length === 0) throw new Error("Excel sheet has no data rows after headers");
  if (workbook.SheetNames.length > 1) {
    warnings.push(`Used sheet "${sheetName}" (${workbook.SheetNames.length} sheets found)`);
  }

  // Rebuild full text for surcharge extraction (all sheets + all cells)
  const fullText = rawRows.map(r => r.map((c: any) => String(c)).join(" ")).join("\n");

  return extractTiersFromRows(headers, records, fullText, warnings, "xlsx");
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED TIER EXTRACTION (CSV + XLSX)
// ═══════════════════════════════════════════════════════════════════════════

function extractTiersFromRows(
  headers: string[],
  records: Record<string, string>[],
  fullText: string,
  warnings: string[],
  source: "csv" | "xlsx"
): DigitizeResult {
  let minCol: string | null = null;
  let maxCol: string | null = null;
  let rateCol: string | null = null;
  let rangeCol: string | null = null;

  for (const h of headers) {
    if (!minCol && matchHeader(h, MILES_MIN_PATTERNS)) minCol = h;
    if (!maxCol && matchHeader(h, MILES_MAX_PATTERNS)) maxCol = h;
    if (!rateCol && matchHeader(h, RATE_PATTERNS)) rateCol = h;
    if (!rangeCol && matchHeader(h, MILES_RANGE_PATTERNS)) rangeCol = h;
  }

  const useMileRange = !minCol && !maxCol && rangeCol;

  if (!rateCol) {
    for (const h of headers) {
      const numCount = records.filter(r => /^\$?\d/.test(String(r[h]).trim())).length;
      if (numCount >= records.length * 0.5 && !matchHeader(h, MILES_MIN_PATTERNS) && !matchHeader(h, MILES_MAX_PATTERNS) && !matchHeader(h, MILES_RANGE_PATTERNS)) {
        rateCol = h;
        break;
      }
    }
  }

  if (!rateCol) throw new Error(`Could not identify rate column. Headers found: ${headers.join(", ")}`);

  const rateUnit = detectRateUnit(headers, records);
  const rawTiers: Array<{ minMiles: number; maxMiles: number; rate: number }> = [];
  let prevMax = 0;

  for (const row of records) {
    const rate = parseNumeric(row[rateCol!]);
    if (rate <= 0) continue;

    let min = 0;
    let max = 0;

    if (useMileRange && rangeCol) {
      const parsed = parseMileRange(row[rangeCol]);
      if (parsed) { min = parsed.min; max = parsed.max; }
      else continue;
    } else if (minCol && maxCol) {
      min = parseNumeric(row[minCol]);
      max = parseNumeric(row[maxCol]);
    } else if (maxCol) {
      min = prevMax > 0 ? prevMax + 1 : 1;
      max = parseNumeric(row[maxCol]);
    } else {
      min = prevMax > 0 ? prevMax + 1 : 1;
      max = min + 4;
    }

    if (max > 0) {
      rawTiers.push({ minMiles: min, maxMiles: max, rate });
      prevMax = max;
    }
  }

  if (rawTiers.length === 0) throw new Error("No valid rate tiers found in file");

  const rateTiers = validateAndNormalizeTiers(rawTiers, warnings);
  const extractedSurcharges = extractSurchargesFromText(fullText);
  const surcharges = mergeSurcharges(extractedSurcharges);

  if (rateTiers.length < 3) warnings.push("Only a few tiers found — verify data is complete");

  return {
    rateTiers,
    surcharges,
    rateUnit,
    productType: null,
    region: null,
    effectiveDate: null,
    expirationDate: null,
    issuedBy: null,
    issuedTo: null,
    warnings,
    source,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF PARSER — ESANG AI (Gemini) with domain-specific prompt
// ═══════════════════════════════════════════════════════════════════════════

// ESANG AI prompt — teaches the model the exact platform schema so the
// JSON it returns can be saved directly with zero transformation.
function buildDigitizePrompt(textContent: string): string {
  return `You are ESANG AI, the intelligent document digitizer for the EusoTrip freight platform.
You are extracting data from a transportation rate sheet (Schedule A) to populate the platform's digital rate sheet.

### DOCUMENT TEXT
${textContent || "(No readable text could be extracted — use any visible patterns from the content structure.)"}

### YOUR TASK
Extract ALL data from this rate sheet and return it as a JSON object that matches the EusoTrip platform schema EXACTLY.

### PLATFORM SCHEMA — follow these field names and types precisely:

\`\`\`
{
  "rateTiers": [
    { "minMiles": <integer>, "maxMiles": <integer>, "ratePerBarrel": <float> }
  ],
  "surcharges": {
    "fscEnabled": <boolean>,
    "fscBaselineDieselPrice": <float, $/gallon, the base price for FSC calculation>,
    "fscMilesPerGallon": <float, truck fuel economy for FSC>,
    "fscPaddRegion": <string, EIA PADD region "1"|"2"|"3"|"4"|"5", default "3">,
    "waitTimeFreeHours": <integer, free waiting hours before charges apply>,
    "waitTimeRatePerHour": <float, $/hour after free period>,
    "splitLoadFee": <float, $ per split load>,
    "rejectFee": <float, $ per rejected load with ticket>,
    "minimumBarrels": <integer, minimum BBL per load>,
    "travelSurchargePerMile": <float, $/mile for deadhead/travel outside operating area>,
    "longLeaseRoadFee": <float or null, extra fee for long lease roads>,
    "multipleGatesFee": <float or null, extra fee for multiple gates>
  },
  "rateUnit": <string, one of: "per_barrel"|"per_mile"|"per_cwt"|"flat_rate"|"per_ton"|"per_gallon"|"per_pallet">,
  "productType": <string or null, e.g. "Crude Oil", "NGL", "Condensate", "Diesel", "Refined Products", "General Freight">,
  "region": <string or null, e.g. "Permian Basin", "Eagle Ford", "Bakken", "DJ Basin">,
  "effectiveDate": <string or null, "YYYY-MM-DD" format>,
  "expirationDate": <string or null, "YYYY-MM-DD" format>,
  "issuedBy": <string or null, company that issued the rate sheet>,
  "issuedTo": <string or null, carrier/hauler the rate sheet is issued to>
}
\`\`\`

### RULES
1. **rateTiers** must be sorted ascending by minMiles. Each tier is a mileage band (e.g., 1-5, 6-10, 11-15...).
   - "ratePerBarrel" is the dollar amount per barrel (or per unit if not oil). Keep 2 decimal places.
   - Extract EVERY tier in the document. Do not skip or summarize.
   - If tiers use 5-mile increments (common in crude oil): 1-5, 6-10, 11-15, 16-20, etc.
   - If tiers are listed as single mile values, create bands: mile 5 = band 1-5, mile 10 = band 6-10, etc.
2. **surcharges** — extract any surcharge data you find. Use platform defaults for anything not mentioned:
   - fscBaselineDieselPrice default: 3.75, fscMilesPerGallon default: 5, fscPaddRegion default: "3"
   - waitTimeFreeHours default: 1, waitTimeRatePerHour default: 85
   - splitLoadFee default: 50, rejectFee default: 85
   - minimumBarrels default: 160, travelSurchargePerMile default: 1.50
3. If the document mentions "DOE index", "EIA", or "PADD", set fscEnabled=true.
4. Look for detention/demurrage rates — map to waitTimeRatePerHour.
5. Look for deadhead surcharges — map to travelSurchargePerMile.
6. Identify the product type from context (crude oil, NGL, condensate, diesel, general freight, etc.).
7. Identify the geographic region from addresses, terminals, or basin references.
8. Extract effective/expiration dates if present.
9. Extract issuing company and recipient company names.

Respond with ONLY the JSON object. No markdown, no explanation, just pure valid JSON.`;
}

async function parsePDF(buffer: Buffer): Promise<DigitizeResult> {
  const warnings: string[] = [];

  // Multi-strategy PDF text extraction
  const textContent = extractTextFromPDFBuffer(buffer);

  if (!textContent || textContent.length < 20) {
    warnings.push("Limited text could be extracted from PDF — AI will interpret the raw structure");
  }

  const prompt = buildDigitizePrompt(textContent);

  console.log(`[RateSheetDigitizer] PDF text extracted: ${textContent.length} chars, sending to ESANG AI`);

  try {
    const response = await esangAI.chat("system-digitizer", prompt, { role: "SYSTEM" });
    const responseText = response.message || response.response || "";

    // Extract JSON — handle markdown code blocks too
    let jsonStr: string | null = null;
    const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
    }

    if (!jsonStr) {
      console.error("[RateSheetDigitizer] AI response (no JSON):", responseText.slice(0, 500));
      throw new Error("ESANG AI did not return valid JSON — the PDF may be image-based or encrypted");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr: any) {
      // Try to fix common JSON issues (trailing commas, etc.)
      const cleaned = jsonStr
        .replace(/,\s*([}\]])/g, "$1")  // trailing commas
        .replace(/'/g, '"');            // single quotes
      parsed = JSON.parse(cleaned);
    }

    if (!parsed.rateTiers || !Array.isArray(parsed.rateTiers) || parsed.rateTiers.length === 0) {
      throw new Error("ESANG AI could not identify rate tiers in the PDF — the document may not contain a rate table");
    }

    // Normalize AI output to platform schema
    const rawTiers = parsed.rateTiers.map((t: any) => ({
      minMiles: Number(t.minMiles) || 0,
      maxMiles: Number(t.maxMiles) || 0,
      rate: Number(t.ratePerBarrel) || Number(t.ratePerUnit) || Number(t.rate) || 0,
    }));

    const rateTiers = validateAndNormalizeTiers(rawTiers, warnings);

    if (rateTiers.length === 0) throw new Error("No valid rate tiers extracted from PDF");

    // Normalize surcharges — AI may return any subset of fields
    const aiSurcharges = parsed.surcharges || {};
    const normalizedSurcharges: Partial<PlatformSurcharges> = {};

    // Map any AI field name variants to the exact platform field names
    if (aiSurcharges.fscEnabled !== undefined) normalizedSurcharges.fscEnabled = Boolean(aiSurcharges.fscEnabled);
    if (aiSurcharges.fuelSurchargeEnabled !== undefined) normalizedSurcharges.fscEnabled = Boolean(aiSurcharges.fuelSurchargeEnabled);
    if (aiSurcharges.fscBaselineDieselPrice) normalizedSurcharges.fscBaselineDieselPrice = Number(aiSurcharges.fscBaselineDieselPrice);
    if (aiSurcharges.fuelSurchargeBasePrice) normalizedSurcharges.fscBaselineDieselPrice = Number(aiSurcharges.fuelSurchargeBasePrice);
    if (aiSurcharges.fscMilesPerGallon) normalizedSurcharges.fscMilesPerGallon = Number(aiSurcharges.fscMilesPerGallon);
    if (aiSurcharges.fscPaddRegion) normalizedSurcharges.fscPaddRegion = String(aiSurcharges.fscPaddRegion);
    if (aiSurcharges.waitTimeFreeHours !== undefined) normalizedSurcharges.waitTimeFreeHours = Number(aiSurcharges.waitTimeFreeHours);
    if (aiSurcharges.waitTimeRatePerHour) normalizedSurcharges.waitTimeRatePerHour = Number(aiSurcharges.waitTimeRatePerHour);
    if (aiSurcharges.waitTimeRate) normalizedSurcharges.waitTimeRatePerHour = Number(aiSurcharges.waitTimeRate);
    if (aiSurcharges.splitLoadFee) normalizedSurcharges.splitLoadFee = Number(aiSurcharges.splitLoadFee);
    if (aiSurcharges.rejectFee) normalizedSurcharges.rejectFee = Number(aiSurcharges.rejectFee);
    if (aiSurcharges.minimumBarrels) normalizedSurcharges.minimumBarrels = Number(aiSurcharges.minimumBarrels);
    if (aiSurcharges.travelSurchargePerMile) normalizedSurcharges.travelSurchargePerMile = Number(aiSurcharges.travelSurchargePerMile);
    if (aiSurcharges.longLeaseRoadFee) normalizedSurcharges.longLeaseRoadFee = Number(aiSurcharges.longLeaseRoadFee);
    if (aiSurcharges.multipleGatesFee) normalizedSurcharges.multipleGatesFee = Number(aiSurcharges.multipleGatesFee);

    // Also try text-based extraction as a fallback for anything AI missed
    const textExtracted = extractSurchargesFromText(textContent);
    for (const [k, v] of Object.entries(textExtracted)) {
      if (v !== undefined && !(k in normalizedSurcharges)) {
        (normalizedSurcharges as any)[k] = v;
      }
    }

    const surcharges = mergeSurcharges(normalizedSurcharges);

    // Determine rate unit
    const rateUnit = parsed.rateUnit || "per_barrel";
    const validUnits = ["per_barrel", "per_mile", "per_cwt", "flat_rate", "per_ton", "per_gallon", "per_pallet"];
    const finalRateUnit = validUnits.includes(rateUnit) ? rateUnit : "per_barrel";

    console.log(`[RateSheetDigitizer] ESANG AI extracted ${rateTiers.length} tiers, product=${parsed.productType}, region=${parsed.region}`);

    warnings.push("Digitized by ESANG AI — review tiers and surcharges for accuracy");

    return {
      rateTiers,
      surcharges,
      rateUnit: finalRateUnit,
      productType: parsed.productType || null,
      region: parsed.region || null,
      effectiveDate: parsed.effectiveDate || null,
      expirationDate: parsed.expirationDate || null,
      issuedBy: parsed.issuedBy || null,
      issuedTo: parsed.issuedTo || null,
      warnings,
      source: "pdf",
    };
  } catch (e: any) {
    console.error("[RateSheetDigitizer] PDF extraction error:", e.message);
    if (e.message.includes("ESANG AI") || e.message.includes("AI")) throw e;
    throw new Error(`PDF extraction failed: ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF TEXT EXTRACTION — multiple strategies
// ═══════════════════════════════════════════════════════════════════════════

function extractTextFromPDFBuffer(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const chunks: string[] = [];

  // Strategy 1: Extract text between BT...ET text objects (PDF standard)
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let btMatch;
  while ((btMatch = btEtRegex.exec(raw)) !== null) {
    const textBlock = btMatch[1];
    // Extract strings in parentheses within text blocks
    const strRegex = /\(([^)]{1,1000})\)/g;
    let strMatch;
    while ((strMatch = strRegex.exec(textBlock)) !== null) {
      const decoded = decodePDFString(strMatch[1]);
      if (decoded.trim().length > 0) chunks.push(decoded.trim());
    }
  }

  // Strategy 2: Extract all parenthesized strings (broader, catches more)
  if (chunks.length < 5) {
    const textRegex = /\(([^)]{1,500})\)/g;
    let match;
    while ((match = textRegex.exec(raw)) !== null) {
      const decoded = decodePDFString(match[1]);
      if (decoded.trim().length > 1 && /[a-zA-Z0-9$.]/.test(decoded)) {
        chunks.push(decoded.trim());
      }
    }
  }

  // Strategy 3: Look for FlateDecode streams and try to decompress
  // (Node zlib can decompress deflated streams)
  try {
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let streamMatch;
    const zlib = require("zlib");
    while ((streamMatch = streamRegex.exec(raw)) !== null) {
      try {
        const streamData = Buffer.from(streamMatch[1], "latin1");
        const inflated = zlib.inflateSync(streamData);
        const streamText = inflated.toString("latin1");
        // Extract text from decompressed stream
        const textInStream = /\(([^)]{1,500})\)/g;
        let sm;
        while ((sm = textInStream.exec(streamText)) !== null) {
          const d = decodePDFString(sm[1]);
          if (d.trim().length > 1 && /[a-zA-Z0-9$.]/.test(d)) {
            chunks.push(d.trim());
          }
        }
      } catch {
        // Stream not deflate-compressed or corrupted — skip
      }
    }
  } catch {
    // zlib unavailable — skip
  }

  // Deduplicate and join
  const seen = new Set<string>();
  const unique = chunks.filter(c => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });

  const text = unique.join(" ").slice(0, 12000);
  console.log(`[RateSheetDigitizer] PDF text extraction: ${unique.length} chunks, ${text.length} chars`);
  return text || "";
}

function decodePDFString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export async function digitizeRateSheet(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<DigitizeResult> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mime = mimeType.toLowerCase();

  if (ext === "csv" || mime === "text/csv") {
    return parseCSV(fileBuffer);
  }

  if (ext === "xlsx" || ext === "xls" || mime.includes("spreadsheet") || mime.includes("excel")) {
    return parseXLSX(fileBuffer);
  }

  if (ext === "pdf" || mime === "application/pdf") {
    return parsePDF(fileBuffer);
  }

  throw new Error(`Unsupported file type: ${ext || mime}. Accepted: CSV, XLSX, XLS, PDF`);
}
