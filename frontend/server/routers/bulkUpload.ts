/**
 * UNIFIED BULK UPLOAD ROUTER
 * Handles ALL entity types: loads, drivers, vehicles, contacts, rates, facilities
 * Features: AI/OCR column mapping (ESANG/Gemini), email invitations, full DB linking
 *
 * Procedures:
 *   getSupportedEntityTypes — list all supported entity types with field definitions
 *   uploadAndProcess       — parse CSV, AI-map columns (VIGA multi-pass), create job + rows
 *   validateJob            — validate rows per entity-type rules, check duplicates
 *   executeJob             — insert valid rows into target tables, send invites
 *   getJobStatus           — get full job details with row-level results
 *   getJobHistory          — list past jobs for user's company
 *   downloadTemplate       — return CSV template with headers + example row
 *   downloadErrors         — return CSV of failed/invalid rows for re-upload
 *   cancelJob              — cancel a pending/validating job
 *   retryFailedRows        — retry only the failed rows from a completed job
 *   processDocument        — VIGA + Gemini 2.5 Flash Vision + OCR: extract structured data from photos/PDFs
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import {
  bulkImportJobs,
  bulkImportRows,
  loads,
  users,
  drivers,
  vehicles,
  companies,
  facilities,
  notifications,
  pricebookEntries,
  documents,
} from "../../drizzle/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { unsafeCast } from "../_core/types/unsafe";
import { ENV } from "../_core/env";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// CONSTANTS & TYPES
// ---------------------------------------------------------------------------

const US_STATE_CODES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC", "PR", "VI", "GU", "AS", "MP",
];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

interface EntityTypeDefinition {
  type: string;
  label: string;
  requiredFields: string[];
  optionalFields: string[];
  templateUrl: string;
  maxRows: number;
}

const ENTITY_TYPES: EntityTypeDefinition[] = [
  {
    type: "loads",
    label: "Loads/Shipments",
    requiredFields: ["pickupLocation", "deliveryLocation", "pickupDate", "deliveryDate", "cargoType"],
    optionalFields: ["hazmatClass", "weight", "weightUnit", "volume", "volumeUnit", "rate", "currency", "specialInstructions", "commodityName", "unNumber"],
    templateUrl: "/api/bulk/template/loads",
    maxRows: 5000,
  },
  {
    type: "drivers",
    label: "Drivers",
    requiredFields: ["firstName", "lastName", "email", "phone", "cdlNumber", "cdlState", "cdlExpiry"],
    optionalFields: ["cdlClass", "hazmatEndorsement", "tankerEndorsement", "doublesEndorsement", "address", "city", "state", "zip", "dateOfBirth", "hireDate"],
    templateUrl: "/api/bulk/template/drivers",
    maxRows: 1000,
  },
  {
    type: "vehicles",
    label: "Vehicles/Equipment",
    requiredFields: ["vin", "vehicleType", "make", "year"],
    optionalFields: ["model", "licensePlate", "mileage", "capacity", "nextMaintenanceDate", "nextInspectionDate"],
    templateUrl: "/api/bulk/template/vehicles",
    maxRows: 2000,
  },
  {
    type: "contacts",
    label: "Contacts/Partners",
    requiredFields: ["companyName", "email"],
    optionalFields: ["phone", "contactName", "dotNumber", "mcNumber", "address", "city", "state", "zip", "companyType"],
    templateUrl: "/api/bulk/template/contacts",
    maxRows: 2000,
  },
  {
    type: "rates",
    label: "Rate Cards/Pricebook",
    requiredFields: ["originState", "destinationState", "rate", "rateType"],
    optionalFields: ["originCity", "destinationCity", "equipmentType", "minWeight", "maxWeight", "effectiveDate", "expiryDate", "fuelSurcharge"],
    templateUrl: "/api/bulk/template/rates",
    maxRows: 10000,
  },
  {
    type: "facilities",
    label: "Facilities/Terminals",
    requiredFields: ["facilityName", "address", "city", "state"],
    optionalFields: ["zip", "facilityType", "latitude", "longitude", "loadingBays", "unloadingBays", "operatingHours", "contactName", "contactPhone", "contactEmail"],
    templateUrl: "/api/bulk/template/facilities",
    maxRows: 500,
  },
  {
    type: "bols",
    label: "Bills of Lading (BOL)",
    requiredFields: ["shipperName", "carrierName", "originAddress", "destinationAddress", "commodity"],
    optionalFields: ["bolNumber", "loadNumber", "weight", "weightUnit", "pieces", "hazmatClass", "unNumber", "sealNumber", "trailerNumber", "pickupDate", "deliveryDate", "specialInstructions", "emergencyContact", "emergencyPhone", "driverName", "driverPhone"],
    templateUrl: "/api/bulk/template/bols",
    maxRows: 2000,
  },
];

const ENTITY_TYPE_MAP = new Map(ENTITY_TYPES.map(e => [e.type, e]));

// ---------------------------------------------------------------------------
// CSV PARSING — handles quoted fields, escaped commas, multi-line values, BOM
// ---------------------------------------------------------------------------

function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip BOM marker (UTF-8: EF BB BF)
  let text = csvText;
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  // Normalize line endings to \n
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const records: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote ("")
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        current.push(field.trim());
        field = "";
        i++;
      } else if (ch === '\n') {
        current.push(field.trim());
        field = "";
        if (current.some(f => f !== "")) {
          records.push(current);
        }
        current = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Handle last field/record
  if (field !== "" || current.length > 0) {
    current.push(field.trim());
    if (current.some(f => f !== "")) {
      records.push(current);
    }
  }

  if (records.length < 1) return { headers: [], rows: [] };

  const headers = records[0].map(h => h.replace(/^"/, "").replace(/"$/, "").trim());
  const rows: Record<string, string>[] = [];

  for (let r = 1; r < records.length; r++) {
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = records[r][idx] !== undefined ? records[r][idx] : "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

// ---------------------------------------------------------------------------
// ESANG AI — Intelligent CSV Column Mapping (Gemini 2.0 Flash)
// ---------------------------------------------------------------------------

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_VISION_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const VISION_TIMEOUT_MS = 60_000;
const VISION_MAX_RETRIES = 2;

// ---------------------------------------------------------------------------
// GEMINI VISION CALL — VIGA-style multi-pass with structured JSON output
// Adapted from visualIntelligence.ts callGeminiVision pattern
// ---------------------------------------------------------------------------

async function callGeminiVisionForDocument(
  fileBase64: string,
  mimeType: string,
  systemPrompt: string,
  retries = VISION_MAX_RETRIES,
): Promise<string> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured — VIGA document processing requires Gemini Vision");

  // Strip data URI prefix if present
  let rawBase64 = fileBase64;
  let finalMime = mimeType;
  if (fileBase64.startsWith("data:")) {
    const [header, data] = fileBase64.split(",", 2);
    rawBase64 = data;
    const mimeMatch = header.match(/data:([^;]+)/);
    if (mimeMatch) finalMime = mimeMatch[1];
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

    try {
      const response = await fetch(`${GEMINI_VISION_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType: finalMime, data: rawBase64 } },
                { text: systemPrompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      });

      clearTimeout(timer);

      if (response.ok) {
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      }

      if (response.status < 500) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Gemini Vision ${response.status}: ${errText.slice(0, 200)}`);
      }

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
        continue;
      }

      throw new Error(`Gemini Vision failed after ${retries + 1} attempts: ${response.status}`);
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
          continue;
        }
        throw new Error("Gemini Vision request timed out");
      }
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }

  throw new Error("callGeminiVisionForDocument: exhausted retries");
}

function buildMappingPrompt(entityType: string, targetFields: string[]): string {
  return `You are ESANG AI's CSV Intelligence engine for EusoTrip, a freight logistics platform.

You will receive CSV column headers and sample data rows from a bulk ${entityType} import file.
Your job is to intelligently map each CSV column to one of these standard fields:
${targetFields.join(", ")}

VIGA PROTOCOL (Multi-Pass Column Intelligence):
Pass 1 — IDENTIFY: Analyze column semantics from header names + sample data patterns (dates, emails, numbers, addresses, codes)
Pass 2 — MAP: Map each column to the closest target field with confidence score. Use fuzzy matching — "First" or "First Name" → firstName, "CDL #" → cdlNumber, "Pickup Addr" → pickupLocation
Pass 3 — VERIFY: Cross-check mappings for consistency — if column has dates, it maps to a date field; if column has email patterns, it maps to an email field; no duplicate target mappings

PLATFORM VALUE NORMALIZATION:
- cargoType values MUST be one of: general, hazmat, refrigerated, oversized, liquid, gas, chemicals, petroleum, livestock, vehicles, timber, grain, dry_bulk, food_grade, water, intermodal, cryogenic
- vehicleType values MUST be one of: tractor, trailer, tanker, flatbed, refrigerated, dry_van, lowboy, step_deck, hopper, pneumatic, reefer, auto_carrier, chemical_tanker, box_truck, specialized, oversize, container_chassis, conestoga, rgn, double_drop
- hazmatClass MUST be DOT class: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3, 4.1, 4.2, 4.3, 5.1, 5.2, 6.1, 6.2, 7, 8, 9
- rateType MUST be: flat, per_mile, per_barrel, per_gallon, per_ton
- Map "crude"/"crude oil"/"WTI" → cargoType: petroleum | "gasoline"/"diesel" → petroleum | "LPG"/"propane" → gas | "frozen"/"produce"/"dairy" → refrigerated

Rules:
1. Map columns by meaning, not exact name. E.g. "First" or "First Name" → firstName, "CDL #" → cdlNumber
2. Date fields: normalize to YYYY-MM-DD format regardless of input format (MM/DD/YYYY, DD-Mon-YYYY, etc.)
3. If a column doesn't map to any field, set its mapping to null
4. Phone numbers: normalize to digits only, add +1 prefix if US
5. State codes: normalize to 2-letter uppercase (e.g., "Texas" → TX, "Louisiana" → LA)
6. Email: lowercase and trim
7. For each row, apply data cleaning AND normalize enum values to exact platform codes listed above
8. If commodity/cargo implies hazmat, auto-populate hazmatClass even if not in a separate column

Respond with VALID JSON only. No markdown, no explanation.

JSON schema:
{
  "columnMapping": { "<original_csv_header>": "<target_field_or_null>" },
  "mappedRows": [ { "field1": "...", "field2": "...", ... } ],
  "confidence": <0-100>,
  "unmappedColumns": ["<columns that had no match>"],
  "notes": "<brief note about any issues or assumptions>"
}`;
}

async function aiMapCSV(
  entityType: string,
  headers: string[],
  rows: Record<string, string>[]
): Promise<{
  mappedRows: Record<string, string>[];
  columnMapping: Record<string, string | null>;
  confidence: number;
  notes: string;
} | null> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) {
    logger.info("[BulkUpload] ESANG AI key not configured, using raw CSV headers");
    return null;
  }

  const entityDef = ENTITY_TYPE_MAP.get(entityType);
  if (!entityDef) return null;

  const targetFields = [...entityDef.requiredFields, ...entityDef.optionalFields];
  const prompt = buildMappingPrompt(entityType, targetFields);

  // Send up to 5 sample rows for mapping context
  const sampleRows = rows.slice(0, 5);
  const csvPreview = [
    headers.join(","),
    ...sampleRows.map(r => headers.map(h => String(r[h] || "")).join(",")),
  ].join("\n");

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${prompt}\n\nEntity Type: ${entityType}\nCSV Headers: ${JSON.stringify(headers)}\nTotal rows to map: ${rows.length}\n\nCSV Preview (headers + up to 5 sample rows):\n${csvPreview}\n\nNow map ALL ${rows.length} rows. Here is the full data as JSON:\n${JSON.stringify(rows)}`,
          }],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
    });

    if (!response.ok) {
      logger.warn(`[BulkUpload] ESANG AI error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(text);
    logger.info(`[BulkUpload] ESANG AI mapped ${parsed.mappedRows?.length || 0} rows for ${entityType}, confidence: ${parsed.confidence}%`);

    return {
      mappedRows: parsed.mappedRows || rows,
      columnMapping: parsed.columnMapping || {},
      confidence: parsed.confidence || 50,
      notes: parsed.notes || "",
    };
  } catch (err) {
    logger.error("[BulkUpload] ESANG AI CSV mapping error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// VALIDATION HELPERS
// ---------------------------------------------------------------------------

function validateDriverRow(raw: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = ["firstName", "lastName", "email", "phone", "cdlNumber", "cdlState", "cdlExpiry"];
  for (const field of required) {
    if (!raw[field] || String(raw[field]).trim() === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (raw.email && !EMAIL_REGEX.test(String(raw.email))) {
    errors.push("Invalid email format");
  }
  if (raw.cdlNumber && String(raw.cdlNumber).trim().length < 4) {
    errors.push("CDL number must be at least 4 characters");
  }
  if (raw.cdlState && !US_STATE_CODES.includes(String(raw.cdlState).toUpperCase())) {
    errors.push(`Invalid CDL state code: ${raw.cdlState}`);
  }
  if (raw.cdlExpiry && !DATE_REGEX.test(String(raw.cdlExpiry))) {
    errors.push("cdlExpiry must be YYYY-MM-DD format");
  }
  if (raw.dateOfBirth && raw.dateOfBirth !== "" && !DATE_REGEX.test(String(raw.dateOfBirth))) {
    errors.push("dateOfBirth must be YYYY-MM-DD format");
  }
  if (raw.hireDate && raw.hireDate !== "" && !DATE_REGEX.test(String(raw.hireDate))) {
    errors.push("hireDate must be YYYY-MM-DD format");
  }
  return { isValid: errors.length === 0, errors };
}

function validateVehicleRow(raw: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = ["vin", "vehicleType", "make", "year"];
  for (const field of required) {
    if (!raw[field] || String(raw[field]).trim() === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (raw.vin && !VIN_REGEX.test(String(raw.vin).replace(/\s/g, ""))) {
    errors.push("VIN must be exactly 17 alphanumeric characters (excluding I, O, Q)");
  }
  if (raw.year) {
    const year = Number(raw.year);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2) {
      errors.push("Invalid vehicle year");
    }
  }
  if (raw.mileage && raw.mileage !== "" && (isNaN(Number(raw.mileage)) || Number(raw.mileage) < 0)) {
    errors.push("Mileage must be a non-negative number");
  }
  if (raw.capacity && raw.capacity !== "" && (isNaN(Number(raw.capacity)) || Number(raw.capacity) < 0)) {
    errors.push("Capacity must be a non-negative number");
  }
  return { isValid: errors.length === 0, errors };
}

function validateLoadRow(raw: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = ["pickupLocation", "deliveryLocation", "pickupDate", "deliveryDate", "cargoType"];
  for (const field of required) {
    if (!raw[field] || String(raw[field]).trim() === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (raw.pickupDate && !DATE_REGEX.test(String(raw.pickupDate))) {
    errors.push("pickupDate must be YYYY-MM-DD format");
  }
  if (raw.deliveryDate && !DATE_REGEX.test(String(raw.deliveryDate))) {
    errors.push("deliveryDate must be YYYY-MM-DD format");
  }
  if (raw.pickupDate && raw.deliveryDate && raw.deliveryDate < raw.pickupDate) {
    errors.push("deliveryDate must be on or after pickupDate");
  }
  if (raw.weight !== undefined && raw.weight !== "" && (isNaN(Number(raw.weight)) || Number(raw.weight) < 0)) {
    errors.push("weight must be a non-negative number");
  }
  if (raw.rate !== undefined && raw.rate !== "" && (isNaN(Number(raw.rate)) || Number(raw.rate) < 0)) {
    errors.push("rate must be a non-negative number");
  }
  return { isValid: errors.length === 0, errors };
}

function validateContactRow(raw: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!raw.companyName || String(raw.companyName).trim() === "") {
    errors.push("Missing required field: companyName");
  }
  if (!raw.email || String(raw.email).trim() === "") {
    errors.push("Missing required field: email");
  }
  if (raw.email && !EMAIL_REGEX.test(String(raw.email))) {
    errors.push("Invalid email format");
  }
  if (raw.state && raw.state !== "" && !US_STATE_CODES.includes(String(raw.state).toUpperCase())) {
    errors.push(`Invalid state code: ${raw.state}`);
  }
  return { isValid: errors.length === 0, errors };
}

function validateRateRow(raw: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = ["originState", "destinationState", "rate", "rateType"];
  for (const field of required) {
    if (!raw[field] || String(raw[field]).trim() === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (raw.originState && !US_STATE_CODES.includes(String(raw.originState).toUpperCase())) {
    errors.push(`Invalid origin state code: ${raw.originState}`);
  }
  if (raw.destinationState && !US_STATE_CODES.includes(String(raw.destinationState).toUpperCase())) {
    errors.push(`Invalid destination state code: ${raw.destinationState}`);
  }
  if (raw.rate) {
    const rate = Number(raw.rate);
    if (isNaN(rate) || rate <= 0) {
      errors.push("Rate must be a positive number");
    }
  }
  const validRateTypes = ["per_mile", "flat", "per_barrel", "per_gallon", "per_ton"];
  if (raw.rateType && !validRateTypes.includes(String(raw.rateType).toLowerCase())) {
    errors.push(`Invalid rateType. Must be one of: ${validRateTypes.join(", ")}`);
  }
  if (raw.effectiveDate && raw.effectiveDate !== "" && !DATE_REGEX.test(String(raw.effectiveDate))) {
    errors.push("effectiveDate must be YYYY-MM-DD format");
  }
  if (raw.expiryDate && raw.expiryDate !== "" && !DATE_REGEX.test(String(raw.expiryDate))) {
    errors.push("expiryDate must be YYYY-MM-DD format");
  }
  return { isValid: errors.length === 0, errors };
}

function validateFacilityRow(raw: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = ["facilityName", "address", "city", "state"];
  for (const field of required) {
    if (!raw[field] || String(raw[field]).trim() === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (raw.state && !US_STATE_CODES.includes(String(raw.state).toUpperCase())) {
    errors.push(`Invalid state code: ${raw.state}`);
  }
  if (raw.latitude && raw.latitude !== "") {
    const lat = Number(raw.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push("Latitude must be between -90 and 90");
    }
  }
  if (raw.longitude && raw.longitude !== "") {
    const lng = Number(raw.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push("Longitude must be between -180 and 180");
    }
  }
  if (raw.loadingBays && raw.loadingBays !== "" && (isNaN(Number(raw.loadingBays)) || Number(raw.loadingBays) < 0)) {
    errors.push("loadingBays must be a non-negative number");
  }
  if (raw.unloadingBays && raw.unloadingBays !== "" && (isNaN(Number(raw.unloadingBays)) || Number(raw.unloadingBays) < 0)) {
    errors.push("unloadingBays must be a non-negative number");
  }
  return { isValid: errors.length === 0, errors };
}

function validateBOLRow(raw: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = ["shipperName", "carrierName", "originAddress", "destinationAddress", "commodity"];
  for (const field of required) {
    if (!raw[field] || String(raw[field]).trim() === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (raw.pickupDate && raw.pickupDate !== "" && !DATE_REGEX.test(String(raw.pickupDate))) {
    errors.push("pickupDate must be YYYY-MM-DD format");
  }
  if (raw.deliveryDate && raw.deliveryDate !== "" && !DATE_REGEX.test(String(raw.deliveryDate))) {
    errors.push("deliveryDate must be YYYY-MM-DD format");
  }
  if (raw.pickupDate && raw.deliveryDate && raw.pickupDate !== "" && raw.deliveryDate !== "" && raw.deliveryDate < raw.pickupDate) {
    errors.push("deliveryDate must be on or after pickupDate");
  }
  if (raw.weight && raw.weight !== "" && (isNaN(Number(raw.weight)) || Number(raw.weight) < 0)) {
    errors.push("weight must be a non-negative number");
  }
  if (raw.pieces && raw.pieces !== "" && (isNaN(Number(raw.pieces)) || Number(raw.pieces) < 0)) {
    errors.push("pieces must be a non-negative number");
  }
  return { isValid: errors.length === 0, errors };
}

function validateRowByEntityType(entityType: string, raw: Record<string, any>): { isValid: boolean; errors: string[] } {
  switch (entityType) {
    case "drivers": return validateDriverRow(raw);
    case "vehicles": return validateVehicleRow(raw);
    case "loads": return validateLoadRow(raw);
    case "contacts": return validateContactRow(raw);
    case "rates": return validateRateRow(raw);
    case "facilities": return validateFacilityRow(raw);
    case "bols": return validateBOLRow(raw);
    default: return { isValid: false, errors: [`Unsupported entity type: ${entityType}`] };
  }
}

// ---------------------------------------------------------------------------
// TEMPLATE GENERATORS
// ---------------------------------------------------------------------------

function getTemplate(entityType: string): { csv: string; fileName: string } {
  switch (entityType) {
    case "loads": {
      const headers = ["pickupLocation", "deliveryLocation", "pickupDate", "deliveryDate", "cargoType", "hazmatClass", "weight", "weightUnit", "volume", "volumeUnit", "rate", "currency", "specialInstructions", "commodityName", "unNumber"];
      const example = ['"Houston, TX"', '"Cushing, OK"', "2026-04-01", "2026-04-02", "general", "3", "52000", "lbs", "200", "bbl", "4500", "USD", '"Temperature sensitive"', '"WTI Crude"', "UN1267"];
      return { csv: headers.join(",") + "\n" + example.join(","), fileName: "bulk_loads_template.csv" };
    }
    case "drivers": {
      const headers = ["firstName", "lastName", "email", "phone", "cdlNumber", "cdlState", "cdlExpiry", "cdlClass", "hazmatEndorsement", "tankerEndorsement", "doublesEndorsement", "address", "city", "state", "zip", "dateOfBirth", "hireDate"];
      const example = ["John", "Doe", "john.doe@example.com", "5551234567", "D12345678", "TX", "2027-12-31", "A", "true", "false", "false", '"123 Main St"', "Houston", "TX", "77001", "1985-06-15", "2024-01-10"];
      return { csv: headers.join(",") + "\n" + example.join(","), fileName: "bulk_drivers_template.csv" };
    }
    case "vehicles": {
      const headers = ["vin", "vehicleType", "make", "year", "model", "licensePlate", "mileage", "capacity", "nextMaintenanceDate", "nextInspectionDate"];
      const example = ["1HGCM82633A004352", "tractor", "Peterbilt", "2023", "579", "TX-ABC1234", "45000", "80000", "2026-06-01", "2026-09-15"];
      return { csv: headers.join(",") + "\n" + example.join(","), fileName: "bulk_vehicles_template.csv" };
    }
    case "contacts": {
      const headers = ["companyName", "email", "phone", "contactName", "dotNumber", "mcNumber", "address", "city", "state", "zip", "companyType"];
      const example = ['"Acme Transport LLC"', "ops@acmetransport.com", "5559876543", '"Jane Smith"', "1234567", "MC-654321", '"456 Oak Ave"', "Dallas", "TX", "75201", "motor_carrier"];
      return { csv: headers.join(",") + "\n" + example.join(","), fileName: "bulk_contacts_template.csv" };
    }
    case "rates": {
      const headers = ["originState", "destinationState", "rate", "rateType", "originCity", "destinationCity", "equipmentType", "minWeight", "maxWeight", "effectiveDate", "expiryDate", "fuelSurcharge"];
      const example = ["TX", "OK", "4500.00", "flat", "Houston", "Cushing", "tanker", "40000", "80000", "2026-04-01", "2026-12-31", "0.15"];
      return { csv: headers.join(",") + "\n" + example.join(","), fileName: "bulk_rates_template.csv" };
    }
    case "facilities": {
      const headers = ["facilityName", "address", "city", "state", "zip", "facilityType", "latitude", "longitude", "loadingBays", "unloadingBays", "operatingHours", "contactName", "contactPhone", "contactEmail"];
      const example = ['"Enterprise Products Terminal"', '"1100 Louisiana St"', "Houston", "TX", "77002", "TERMINAL", "29.7604", "-95.3698", "8", "6", '"Mon-Fri 6AM-6PM"', '"Bob Johnson"', "5551112233", "bob@enterprise.com"];
      return { csv: headers.join(",") + "\n" + example.join(","), fileName: "bulk_facilities_template.csv" };
    }
    case "bols": {
      const headers = ["shipperName", "carrierName", "originAddress", "destinationAddress", "commodity", "bolNumber", "loadNumber", "weight", "weightUnit", "pieces", "hazmatClass", "unNumber", "sealNumber", "trailerNumber", "pickupDate", "deliveryDate", "specialInstructions", "emergencyContact", "emergencyPhone", "driverName", "driverPhone"];
      const example = ['"Acme Oil Co"', '"Swift Transport LLC"', '"1200 Main St, Houston, TX 77002"', '"456 Refinery Rd, Cushing, OK 74023"', '"WTI Crude Oil"', "BOL-2026-001", "LD-10042", "52000", "lbs", "1", "3", "UN1267", "SEAL-9001", "TRL-5582", "2026-04-01", "2026-04-02", '"Temperature sensitive — keep below 100F"', '"CHEMTREC"', "1-800-424-9300", '"John Doe"', "5551234567"];
      return { csv: headers.join(",") + "\n" + example.join(","), fileName: "bulk_bols_template.csv" };
    }
    default:
      return { csv: "", fileName: "template.csv" };
  }
}

// ---------------------------------------------------------------------------
// HELPER: Generate secure random password
// ---------------------------------------------------------------------------

function generateSecurePassword(): string {
  const bytes = crypto.randomBytes(16);
  return bytes.toString("base64url").slice(0, 20);
}

// ---------------------------------------------------------------------------
// HELPER: Escape CSV field
// ---------------------------------------------------------------------------

function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ---------------------------------------------------------------------------
// ROUTER
// ---------------------------------------------------------------------------

export const bulkUploadRouter = router({

  // =========================================================================
  // 1. getSupportedEntityTypes — List all supported entity types
  // =========================================================================
  getSupportedEntityTypes: protectedProcedure
    .query(async () => {
      return { entityTypes: ENTITY_TYPES };
    }),

  // =========================================================================
  // 2. uploadAndProcess — Parse CSV, AI-map columns, create job + rows
  // =========================================================================
  uploadAndProcess: protectedProcedure
    .input(z.object({
      entityType: z.string().min(1),
      csvText: z.string().min(1),
      fileName: z.string().min(1),
      options: z.object({
        sendInvites: z.boolean().optional(),
        dryRun: z.boolean().optional(),
        aiMapping: z.boolean().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;
      const userId = Number((ctx.user as any).id) || 0;
      if (!companyId) throw new Error("Company context required");

      const entityDef = ENTITY_TYPE_MAP.get(input.entityType);
      if (!entityDef) throw new Error(`Unsupported entity type: ${input.entityType}. Supported: ${ENTITY_TYPES.map(e => e.type).join(", ")}`);

      // Parse CSV
      const { headers, rows: rawRows } = parseCSV(input.csvText);
      if (rawRows.length === 0) throw new Error("CSV contains no data rows");
      if (rawRows.length > entityDef.maxRows) {
        throw new Error(`CSV exceeds maximum of ${entityDef.maxRows} rows for ${entityDef.label}. Got ${rawRows.length} rows.`);
      }

      // ESANG AI: intelligently map CSV columns to standard fields
      let rows = rawRows;
      let aiMapping: Record<string, string | null> | null = null;
      let aiConfidence = 0;
      let aiNotes = "";

      if (input.options?.aiMapping !== false) {
        try {
          const aiResult = await aiMapCSV(input.entityType, headers, rawRows);
          if (aiResult && aiResult.mappedRows.length > 0) {
            rows = aiResult.mappedRows;
            aiMapping = aiResult.columnMapping;
            aiConfidence = aiResult.confidence;
            aiNotes = aiResult.notes;
            logger.info(`[BulkUpload] AI mapping applied for ${input.entityType}: ${aiConfidence}% confidence. Notes: ${aiNotes}`);
          }
        } catch (aiErr) {
          logger.warn("[BulkUpload] AI mapping failed, using raw CSV:", aiErr);
        }
      }

      // Create job — store entityType in the fileName field as a prefix for identification
      const jobFileName = `[${input.entityType}] ${input.fileName}`;
      await unsafeCast(db).execute(
        sql`INSERT INTO bulk_import_jobs (companyId, uploadedBy, fileName, totalRows, status) VALUES (${companyId}, ${userId}, ${jobFileName}, ${rows.length}, 'uploaded')`
      );

      const [job] = await db.select().from(bulkImportJobs)
        .where(and(eq(bulkImportJobs.companyId, companyId), eq(bulkImportJobs.uploadedBy, userId)))
        .orderBy(sql`${bulkImportJobs.id} DESC`)
        .limit(1);
      if (!job) throw new Error("Failed to create import job");

      // Insert rows
      for (let i = 0; i < rows.length; i++) {
        await unsafeCast(db).execute(
          sql`INSERT INTO bulk_import_rows (jobId, rowNumber, rawData, status) VALUES (${job.id}, ${i + 1}, ${JSON.stringify(rows[i])}, 'pending')`
        );
      }

      // Preview: first 5 rows
      const previewRows = rows.slice(0, 5);

      return {
        jobId: job.id,
        totalRows: rows.length,
        headers,
        mappedFields: aiMapping ? Object.values(aiMapping).filter(Boolean) : headers,
        previewRows,
        aiConfidence,
        aiMapping: aiMapping ? { columnMapping: aiMapping, confidence: aiConfidence, notes: aiNotes } : null,
      };
    }),

  // =========================================================================
  // 3. validateJob — Validate each row based on entityType rules
  // =========================================================================
  validateJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [job] = await db.select().from(bulkImportJobs)
        .where(and(eq(bulkImportJobs.id, input.jobId), eq(bulkImportJobs.companyId, companyId)))
        .limit(1);
      if (!job) throw new Error("Import job not found");

      // Extract entityType from fileName prefix "[entityType] filename"
      const entityTypeMatch = job.fileName.match(/^\[(\w+)\]/);
      const entityType = entityTypeMatch ? entityTypeMatch[1] : "loads";

      // Mark as validating
      await db.update(bulkImportJobs).set({ status: "validating" }).where(eq(bulkImportJobs.id, input.jobId));

      const rows = await db.select().from(bulkImportRows)
        .where(eq(bulkImportRows.jobId, input.jobId))
        .orderBy(sql`${bulkImportRows.rowNumber} ASC`);

      let validCount = 0;
      let invalidCount = 0;
      let duplicateCount = 0;
      const allErrors: Record<string, string[]> = {};

      // Pre-fetch existing data for duplicate checking
      let existingEmails: Set<string> = new Set();
      let existingVins: Set<string> = new Set();
      let existingDotNumbers: Set<string> = new Set();
      let existingMcNumbers: Set<string> = new Set();

      try {
        if (entityType === "drivers") {
          const existingUsers = await db.select({ email: users.email }).from(users).where(eq(users.role, "DRIVER"));
          existingEmails = new Set(existingUsers.map(u => u.email?.toLowerCase() || "").filter(Boolean));
        } else if (entityType === "vehicles") {
          const existingVehicles = await db.select({ vin: vehicles.vin }).from(vehicles).where(eq(vehicles.companyId, companyId));
          existingVins = new Set(existingVehicles.map(v => v.vin.toUpperCase()));
        } else if (entityType === "contacts") {
          const existingCompanies = await db.select({ dotNumber: companies.dotNumber, mcNumber: companies.mcNumber }).from(companies);
          existingDotNumbers = new Set(existingCompanies.map(c => c.dotNumber || "").filter(Boolean));
          existingMcNumbers = new Set(existingCompanies.map(c => c.mcNumber || "").filter(Boolean));
        }
      } catch (err) {
        logger.warn("[BulkUpload] Duplicate check pre-fetch failed:", err);
      }

      // Track in-batch duplicates
      const batchEmails = new Set<string>();
      const batchVins = new Set<string>();

      for (const row of rows) {
        const rawData: Record<string, any> = typeof row.rawData === "string" ? JSON.parse(row.rawData) : row.rawData;
        const { isValid, errors } = validateRowByEntityType(entityType, rawData);
        const rowErrors = [...errors];

        // Duplicate checks
        if (entityType === "drivers" && rawData.email) {
          const email = String(rawData.email).toLowerCase().trim();
          if (existingEmails.has(email)) {
            rowErrors.push(`Duplicate: email "${email}" already exists in the system`);
            duplicateCount++;
          } else if (batchEmails.has(email)) {
            rowErrors.push(`Duplicate: email "${email}" appears multiple times in this upload`);
            duplicateCount++;
          }
          batchEmails.add(email);
        }

        if (entityType === "vehicles" && rawData.vin) {
          const vin = String(rawData.vin).toUpperCase().replace(/\s/g, "");
          if (existingVins.has(vin)) {
            rowErrors.push(`Duplicate: VIN "${vin}" already exists in the system`);
            duplicateCount++;
          } else if (batchVins.has(vin)) {
            rowErrors.push(`Duplicate: VIN "${vin}" appears multiple times in this upload`);
            duplicateCount++;
          }
          batchVins.add(vin);
        }

        if (entityType === "contacts") {
          if (rawData.dotNumber && existingDotNumbers.has(String(rawData.dotNumber))) {
            rowErrors.push(`Duplicate: DOT# "${rawData.dotNumber}" already exists in the system`);
            duplicateCount++;
          }
          if (rawData.mcNumber && existingMcNumbers.has(String(rawData.mcNumber))) {
            rowErrors.push(`Duplicate: MC# "${rawData.mcNumber}" already exists in the system`);
            duplicateCount++;
          }
        }

        const finalValid = isValid && rowErrors.length === 0;

        if (finalValid) {
          validCount++;
          await db.update(bulkImportRows).set({ status: "valid", errors: null }).where(eq(bulkImportRows.id, row.id));
        } else {
          invalidCount++;
          allErrors[String(row.rowNumber)] = rowErrors;
          await db.update(bulkImportRows).set({ status: "invalid", errors: rowErrors }).where(eq(bulkImportRows.id, row.id));
        }
      }

      // Update job
      await db.update(bulkImportJobs).set({
        status: "validated",
        validationErrors: Object.keys(allErrors).length > 0 ? allErrors : null,
      }).where(eq(bulkImportJobs.id, input.jobId));

      return {
        jobId: input.jobId,
        validCount,
        invalidCount,
        duplicateCount,
        errors: allErrors,
      };
    }),

  // =========================================================================
  // 4. executeJob — Insert valid rows into target tables, send invites
  // =========================================================================
  executeJob: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      sendInvites: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;
      const userId = Number((ctx.user as any).id) || 0;
      if (!companyId) throw new Error("Company context required");

      const [job] = await db.select().from(bulkImportJobs)
        .where(and(eq(bulkImportJobs.id, input.jobId), eq(bulkImportJobs.companyId, companyId)))
        .limit(1);
      if (!job) throw new Error("Import job not found");
      if (job.status !== "validated") throw new Error("Job must be validated before execution");

      // Extract entityType from fileName prefix
      const entityTypeMatch = job.fileName.match(/^\[(\w+)\]/);
      const entityType = entityTypeMatch ? entityTypeMatch[1] : "loads";

      // Mark as importing
      await db.update(bulkImportJobs).set({ status: "importing" }).where(eq(bulkImportJobs.id, input.jobId));

      const validRows = await db.select().from(bulkImportRows)
        .where(and(eq(bulkImportRows.jobId, input.jobId), eq(bulkImportRows.status, "valid")))
        .orderBy(sql`${bulkImportRows.rowNumber} ASC`);

      let createdCount = 0;
      let failedCount = 0;
      let invitesSent = 0;
      const results: Array<{ rowNumber: number; entityId: number | null; status: string; error?: string }> = [];

      for (const row of validRows) {
        try {
          const raw: Record<string, any> = typeof row.rawData === "string" ? JSON.parse(row.rawData) : row.rawData;
          let entityId: number | null = null;

          switch (entityType) {
            // ---------------------------------------------------------------
            // DRIVERS
            // ---------------------------------------------------------------
            case "drivers": {
              const email = String(raw.email).toLowerCase().trim();
              const tempPassword = generateSecurePassword();
              const openId = `bulk-${crypto.randomUUID()}`;

              // Create user record
              await unsafeCast(db).execute(
                sql`INSERT INTO users (openId, name, email, phone, role, companyId, isVerified, isActive, passwordHash, metadata, createdAt, updatedAt, lastSignedIn)
                VALUES (
                  ${openId},
                  ${`${String(raw.firstName).trim()} ${String(raw.lastName).trim()}`},
                  ${email},
                  ${String(raw.phone || "").trim()},
                  'DRIVER',
                  ${companyId},
                  0,
                  1,
                  ${tempPassword},
                  ${JSON.stringify({ bulkImported: true, importJobId: input.jobId, needsPasswordReset: true, approvalStatus: "pending_review" })},
                  NOW(), NOW(), NOW()
                )`
              );

              const [createdUser] = await db.select({ id: users.id }).from(users)
                .where(eq(users.email, email)).limit(1);
              if (!createdUser) throw new Error("Failed to create user record");

              // Create driver record
              const cdlExpiry = raw.cdlExpiry && DATE_REGEX.test(String(raw.cdlExpiry))
                ? String(raw.cdlExpiry) : null;

              await unsafeCast(db).execute(
                sql`INSERT INTO drivers (userId, companyId, licenseNumber, licenseState, licenseExpiry, hazmatEndorsement, status, createdAt, updatedAt)
                VALUES (
                  ${createdUser.id},
                  ${companyId},
                  ${String(raw.cdlNumber || "").trim()},
                  ${String(raw.cdlState || "").toUpperCase().trim()},
                  ${cdlExpiry ? sql`${cdlExpiry}` : sql`NULL`},
                  ${raw.hazmatEndorsement === "true" || raw.hazmatEndorsement === "1" ? 1 : 0},
                  'active',
                  NOW(), NOW()
                )`
              );

              const [createdDriver] = await db.select({ id: drivers.id }).from(drivers)
                .where(eq(drivers.userId, createdUser.id)).limit(1);
              entityId = createdDriver?.id || createdUser.id;

              // Send invitation notification
              if (input.sendInvites) {
                try {
                  await unsafeCast(db).execute(
                    sql`INSERT INTO notifications (userId, type, title, message, data, isRead, createdAt)
                    VALUES (
                      ${createdUser.id},
                      'system',
                      ${"Welcome to EusoTrip — Account Created"},
                      ${`Your driver account has been created. Please log in with your email (${email}) and set up your password.`},
                      ${JSON.stringify({ type: "invitation", tempPassword, importJobId: input.jobId })},
                      0,
                      NOW()
                    )`
                  );
                  invitesSent++;
                } catch (notifErr) {
                  logger.warn(`[BulkUpload] Failed to send invite for ${email}:`, notifErr);
                }
              }

              break;
            }

            // ---------------------------------------------------------------
            // VEHICLES
            // ---------------------------------------------------------------
            case "vehicles": {
              const vin = String(raw.vin).toUpperCase().replace(/\s/g, "");
              const vehicleType = String(raw.vehicleType || "tractor").toLowerCase().trim();
              const make = String(raw.make || "").trim();
              const year = Number(raw.year) || new Date().getFullYear();

              await unsafeCast(db).execute(
                sql`INSERT INTO vehicles (companyId, vin, vehicleType, make, model, year, licensePlate, mileage, capacity, status, isActive, createdAt, updatedAt)
                VALUES (
                  ${companyId},
                  ${vin},
                  ${vehicleType},
                  ${make},
                  ${String(raw.model || "").trim() || null},
                  ${year},
                  ${String(raw.licensePlate || "").trim() || null},
                  ${raw.mileage ? Number(raw.mileage) : null},
                  ${raw.capacity ? String(raw.capacity) : null},
                  'available',
                  1,
                  NOW(), NOW()
                )`
              );

              const [createdVehicle] = await db.select({ id: vehicles.id }).from(vehicles)
                .where(eq(vehicles.vin, vin)).limit(1);
              entityId = createdVehicle?.id || null;
              break;
            }

            // ---------------------------------------------------------------
            // LOADS
            // ---------------------------------------------------------------
            case "loads": {
              const loadNumber = `BLK-${input.jobId}-${row.rowNumber}-${Date.now().toString(36).toUpperCase()}`;

              await unsafeCast(db).execute(
                sql`INSERT INTO loads (loadNumber, shipperId, pickupLocation, deliveryLocation, pickupDate, deliveryDate, cargoType, hazmatClass, weight, rate, specialInstructions, commodityName, unNumber, status, createdAt, updatedAt)
                VALUES (
                  ${loadNumber},
                  ${userId},
                  ${raw.pickupLocation || ""},
                  ${raw.deliveryLocation || ""},
                  ${raw.pickupDate},
                  ${raw.deliveryDate},
                  ${raw.cargoType || "general"},
                  ${raw.hazmatClass || null},
                  ${raw.weight ? Number(raw.weight) : null},
                  ${raw.rate ? Number(raw.rate) : null},
                  ${raw.specialInstructions || null},
                  ${raw.commodityName || null},
                  ${raw.unNumber || null},
                  'pending',
                  NOW(), NOW()
                )`
              );

              const [createdLoad] = await db.select({ id: loads.id }).from(loads)
                .where(eq(loads.loadNumber, loadNumber)).limit(1);
              entityId = createdLoad?.id || null;
              break;
            }

            // ---------------------------------------------------------------
            // CONTACTS
            // ---------------------------------------------------------------
            case "contacts": {
              const contactEmail = String(raw.email).toLowerCase().trim();
              const companyName = String(raw.companyName).trim();
              const dotNumber = raw.dotNumber ? String(raw.dotNumber).trim() : null;
              const mcNumber = raw.mcNumber ? String(raw.mcNumber).trim() : null;

              // Check if company already exists by DOT/MC/name
              let existingCompanyId: number | null = null;

              if (dotNumber) {
                const [existing] = await db.select({ id: companies.id }).from(companies)
                  .where(eq(companies.dotNumber, dotNumber)).limit(1);
                if (existing) existingCompanyId = existing.id;
              }
              if (!existingCompanyId && mcNumber) {
                const [existing] = await db.select({ id: companies.id }).from(companies)
                  .where(eq(companies.mcNumber, mcNumber)).limit(1);
                if (existing) existingCompanyId = existing.id;
              }

              if (existingCompanyId) {
                // Company exists — record the partnership reference
                entityId = existingCompanyId;
                logger.info(`[BulkUpload] Contact "${companyName}" matched existing company ID ${existingCompanyId}`);
              } else {
                // Create new company record
                await unsafeCast(db).execute(
                  sql`INSERT INTO companies (name, dotNumber, mcNumber, email, phone, address, city, state, zipCode, isActive, createdAt, updatedAt)
                  VALUES (
                    ${companyName},
                    ${dotNumber},
                    ${mcNumber},
                    ${contactEmail},
                    ${String(raw.phone || "").trim() || null},
                    ${String(raw.address || "").trim() || null},
                    ${String(raw.city || "").trim() || null},
                    ${String(raw.state || "").toUpperCase().trim() || null},
                    ${String(raw.zip || "").trim() || null},
                    1,
                    NOW(), NOW()
                  )`
                );

                const [createdCompany] = await db.select({ id: companies.id }).from(companies)
                  .where(eq(companies.email, contactEmail))
                  .orderBy(sql`${companies.id} DESC`)
                  .limit(1);
                entityId = createdCompany?.id || null;

                // Send invitation notification to the uploading user as a reminder
                if (input.sendInvites) {
                  try {
                    await unsafeCast(db).execute(
                      sql`INSERT INTO notifications (userId, type, title, message, data, isRead, createdAt)
                      VALUES (
                        ${userId},
                        'system',
                        ${`New Contact Added: ${companyName}`},
                        ${`Company "${companyName}" (${contactEmail}) has been created via bulk upload. Send them an invitation to join EusoTrip.`},
                        ${JSON.stringify({ type: "invitation", contactCompanyId: entityId, importJobId: input.jobId })},
                        0,
                        NOW()
                      )`
                    );
                    invitesSent++;
                  } catch (notifErr) {
                    logger.warn(`[BulkUpload] Failed to create contact notification for ${companyName}:`, notifErr);
                  }
                }
              }
              break;
            }

            // ---------------------------------------------------------------
            // RATES
            // ---------------------------------------------------------------
            case "rates": {
              const originState = String(raw.originState).toUpperCase().trim();
              const destinationState = String(raw.destinationState).toUpperCase().trim();
              const rate = Number(raw.rate);
              const rateType = String(raw.rateType).toLowerCase().trim();
              const effectiveDate = raw.effectiveDate && DATE_REGEX.test(String(raw.effectiveDate))
                ? String(raw.effectiveDate)
                : new Date().toISOString().slice(0, 10);
              const expiryDate = raw.expiryDate && DATE_REGEX.test(String(raw.expiryDate))
                ? String(raw.expiryDate) : null;

              const entryName = `${originState} → ${destinationState} (${rateType})`;
              const fuelSurcharge = raw.fuelSurcharge ? Number(raw.fuelSurcharge) : null;

              await unsafeCast(db).execute(
                sql`INSERT INTO pricebook_entries (companyId, entryName, originCity, originState, destinationCity, destinationState, rate, rateType, fscValue, effectiveDate, expirationDate, isActive, createdBy, createdAt, updatedAt)
                VALUES (
                  ${companyId},
                  ${entryName},
                  ${String(raw.originCity || "").trim() || null},
                  ${originState},
                  ${String(raw.destinationCity || "").trim() || null},
                  ${destinationState},
                  ${rate},
                  ${rateType},
                  ${fuelSurcharge},
                  ${effectiveDate},
                  ${expiryDate ? sql`${expiryDate}` : sql`NULL`},
                  1,
                  ${userId},
                  NOW(), NOW()
                )`
              );

              const [createdRate] = await db.select({ id: pricebookEntries.id }).from(pricebookEntries)
                .where(and(eq(pricebookEntries.companyId, companyId), eq(pricebookEntries.entryName, entryName)))
                .orderBy(sql`${pricebookEntries.id} DESC`)
                .limit(1);
              entityId = createdRate?.id || null;
              break;
            }

            // ---------------------------------------------------------------
            // FACILITIES
            // ---------------------------------------------------------------
            case "facilities": {
              const facilityName = String(raw.facilityName).trim();
              const address = String(raw.address).trim();
              const city = String(raw.city).trim();
              const state = String(raw.state).toUpperCase().trim();
              const zip = raw.zip ? String(raw.zip).trim() : null;
              const facilityType = raw.facilityType ? String(raw.facilityType).toUpperCase().trim() : "TERMINAL";
              const latitude = raw.latitude && raw.latitude !== "" ? Number(raw.latitude) : 0;
              const longitude = raw.longitude && raw.longitude !== "" ? Number(raw.longitude) : 0;

              await unsafeCast(db).execute(
                sql`INSERT INTO facilities (facility_name, facility_address, facility_city, facility_state, facility_zip, facility_type, latitude, longitude, loading_bays, unloading_bays, loading_hours, office_phone, facility_status, data_source, claimed_by_company_id, claimed_by_user_id, created_at, updated_at)
                VALUES (
                  ${facilityName},
                  ${address},
                  ${city},
                  ${state},
                  ${zip},
                  ${facilityType},
                  ${latitude},
                  ${longitude},
                  ${raw.loadingBays ? Number(raw.loadingBays) : null},
                  ${raw.unloadingBays ? Number(raw.unloadingBays) : null},
                  ${raw.operatingHours ? String(raw.operatingHours).trim() : null},
                  ${raw.contactPhone ? String(raw.contactPhone).trim() : null},
                  'OPERATING',
                  'bulk_upload',
                  ${companyId},
                  ${userId},
                  NOW(), NOW()
                )`
              );

              const [createdFacility] = await db.select({ id: facilities.id }).from(facilities)
                .where(and(
                  eq(facilities.facilityName, facilityName),
                  eq(facilities.state, state),
                ))
                .orderBy(sql`${facilities.id} DESC`)
                .limit(1);
              entityId = createdFacility?.id || null;
              break;
            }

            // ---------------------------------------------------------------
            // BOLS (Bills of Lading)
            // ---------------------------------------------------------------
            case "bols": {
              const bolNumber = raw.bolNumber && String(raw.bolNumber).trim()
                ? String(raw.bolNumber).trim()
                : `BOL-${Date.now()}-${row.rowNumber}`;
              const docName = `BOL ${bolNumber}`;

              // Build metadata JSON with all BOL fields
              const bolMetadata: Record<string, any> = {
                bolNumber,
                shipperName: String(raw.shipperName || "").trim(),
                carrierName: String(raw.carrierName || "").trim(),
                originAddress: String(raw.originAddress || "").trim(),
                destinationAddress: String(raw.destinationAddress || "").trim(),
                commodity: String(raw.commodity || "").trim(),
                weight: raw.weight ? Number(raw.weight) : null,
                weightUnit: raw.weightUnit ? String(raw.weightUnit).trim() : null,
                pieces: raw.pieces ? Number(raw.pieces) : null,
                hazmatClass: raw.hazmatClass ? String(raw.hazmatClass).trim() : null,
                unNumber: raw.unNumber ? String(raw.unNumber).trim() : null,
                sealNumber: raw.sealNumber ? String(raw.sealNumber).trim() : null,
                trailerNumber: raw.trailerNumber ? String(raw.trailerNumber).trim() : null,
                pickupDate: raw.pickupDate && DATE_REGEX.test(String(raw.pickupDate)) ? String(raw.pickupDate) : null,
                deliveryDate: raw.deliveryDate && DATE_REGEX.test(String(raw.deliveryDate)) ? String(raw.deliveryDate) : null,
                specialInstructions: raw.specialInstructions ? String(raw.specialInstructions).trim() : null,
                emergencyContact: raw.emergencyContact ? String(raw.emergencyContact).trim() : null,
                emergencyPhone: raw.emergencyPhone ? String(raw.emergencyPhone).trim() : null,
                driverName: raw.driverName ? String(raw.driverName).trim() : null,
                driverPhone: raw.driverPhone ? String(raw.driverPhone).trim() : null,
                bulkImported: true,
                importJobId: input.jobId,
              };

              // Try to link to an existing load if loadNumber is provided
              let linkedLoadId: number | null = null;
              if (raw.loadNumber && String(raw.loadNumber).trim()) {
                try {
                  const [existingLoad] = await db.select({ id: loads.id }).from(loads)
                    .where(eq(loads.loadNumber, String(raw.loadNumber).trim()))
                    .limit(1);
                  if (existingLoad) {
                    linkedLoadId = existingLoad.id;
                    bolMetadata.loadNumber = String(raw.loadNumber).trim();
                  }
                } catch (loadErr) {
                  logger.warn(`[BulkUpload] Could not link BOL to load "${raw.loadNumber}":`, loadErr);
                }
              }

              // Create document record with type "bol"
              await unsafeCast(db).execute(
                sql`INSERT INTO documents (userId, companyId, loadId, type, name, fileUrl, status, createdAt)
                VALUES (
                  ${userId},
                  ${companyId},
                  ${linkedLoadId},
                  'bol',
                  ${docName},
                  ${JSON.stringify(bolMetadata)},
                  'active',
                  NOW()
                )`
              );

              const [createdDoc] = await db.select({ id: documents.id }).from(documents)
                .where(and(eq(documents.companyId, companyId), eq(documents.name, docName)))
                .orderBy(sql`${documents.id} DESC`)
                .limit(1);
              entityId = createdDoc?.id || null;
              break;
            }

            default:
              throw new Error(`Unsupported entity type: ${entityType}`);
          }

          // Update row as created
          await db.update(bulkImportRows).set({
            status: "created",
            loadId: entityId,
          }).where(eq(bulkImportRows.id, row.id));
          createdCount++;

          results.push({ rowNumber: row.rowNumber, entityId, status: "created" });
        } catch (err: unknown) {
          failedCount++;
          const errMsg = (err as Error).message || "Unknown error";
          await db.update(bulkImportRows).set({
            status: "failed",
            errors: [errMsg],
          }).where(eq(bulkImportRows.id, row.id));

          results.push({ rowNumber: row.rowNumber, entityId: null, status: "failed", error: errMsg });
          logger.error(`[BulkUpload] Row ${row.rowNumber} failed for ${entityType}:`, err);
        }
      }

      // Update job status
      await db.update(bulkImportJobs).set({
        status: "completed",
        successCount: createdCount,
        failCount: failedCount,
        completedAt: new Date(),
      }).where(eq(bulkImportJobs.id, input.jobId));

      return {
        jobId: input.jobId,
        createdCount,
        failedCount,
        invitesSent,
        results,
      };
    }),

  // =========================================================================
  // 5. getJobStatus — Full job details with row-level results
  // =========================================================================
  getJobStatus: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [job] = await db.select().from(bulkImportJobs)
        .where(and(eq(bulkImportJobs.id, input.jobId), eq(bulkImportJobs.companyId, companyId)))
        .limit(1);
      if (!job) throw new Error("Import job not found");

      // Extract entityType from fileName
      const entityTypeMatch = job.fileName.match(/^\[(\w+)\]/);
      const entityType = entityTypeMatch ? entityTypeMatch[1] : "loads";

      const rows = await db.select().from(bulkImportRows)
        .where(eq(bulkImportRows.jobId, input.jobId))
        .orderBy(sql`${bulkImportRows.rowNumber} ASC`);

      return {
        jobId: job.id,
        entityType,
        fileName: job.fileName.replace(/^\[\w+\]\s*/, ""),
        status: job.status,
        totalRows: job.totalRows,
        successCount: job.successCount,
        failCount: job.failCount,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        validationErrors: job.validationErrors,
        rows: rows.map(r => ({
          rowNumber: r.rowNumber,
          rawData: r.rawData,
          status: r.status,
          errors: r.errors,
          entityId: r.loadId,
        })),
      };
    }),

  // =========================================================================
  // 6. getJobHistory — Past jobs for the user's company
  // =========================================================================
  getJobHistory: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
      entityType: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const limit = input?.limit || 20;
      const offset = input?.offset || 0;

      let whereCondition = eq(bulkImportJobs.companyId, companyId);

      // Filter by entityType if specified (matches the [entityType] prefix in fileName)
      if (input?.entityType) {
        whereCondition = and(
          whereCondition,
          sql`${bulkImportJobs.fileName} LIKE ${`[${input.entityType}]%`}`
        ) as any;
      }

      const jobs = await db.select().from(bulkImportJobs)
        .where(whereCondition)
        .orderBy(sql`${bulkImportJobs.createdAt} DESC`)
        .limit(limit)
        .offset(offset);

      return {
        jobs: jobs.map(j => {
          const entityTypeMatch = j.fileName.match(/^\[(\w+)\]/);
          return {
            ...j,
            entityType: entityTypeMatch ? entityTypeMatch[1] : "loads",
            fileName: j.fileName.replace(/^\[\w+\]\s*/, ""),
          };
        }),
      };
    }),

  // =========================================================================
  // 7. downloadTemplate — CSV template with headers + example row
  // =========================================================================
  downloadTemplate: protectedProcedure
    .input(z.object({ entityType: z.string() }))
    .query(async ({ input }) => {
      const entityDef = ENTITY_TYPE_MAP.get(input.entityType);
      if (!entityDef) throw new Error(`Unsupported entity type: ${input.entityType}`);

      return getTemplate(input.entityType);
    }),

  // =========================================================================
  // 8. downloadErrors — CSV of failed/invalid rows for re-upload
  // =========================================================================
  downloadErrors: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [job] = await db.select().from(bulkImportJobs)
        .where(and(eq(bulkImportJobs.id, input.jobId), eq(bulkImportJobs.companyId, companyId)))
        .limit(1);
      if (!job) throw new Error("Import job not found");

      const errorRows = await db.select().from(bulkImportRows)
        .where(and(
          eq(bulkImportRows.jobId, input.jobId),
          sql`${bulkImportRows.status} IN ('invalid', 'failed')`,
        ))
        .orderBy(sql`${bulkImportRows.rowNumber} ASC`);

      if (errorRows.length === 0) return { csv: "", fileName: `errors_job_${input.jobId}.csv` };

      // Collect all keys from raw data
      const allKeys = new Set<string>();
      for (const r of errorRows) {
        const raw: Record<string, any> = typeof r.rawData === "string" ? JSON.parse(r.rawData) : r.rawData;
        Object.keys(raw).forEach(k => allKeys.add(k));
      }
      const headers = ["rowNumber", ...Array.from(allKeys), "errors"];

      const lines = [headers.join(",")];
      for (const r of errorRows) {
        const raw: Record<string, any> = typeof r.rawData === "string" ? JSON.parse(r.rawData) : r.rawData;
        const errs = Array.isArray(r.errors) ? r.errors.join("; ") : "";
        const values = [
          String(r.rowNumber),
          ...Array.from(allKeys).map(k => escapeCSVField(String(raw[k] || ""))),
          escapeCSVField(errs),
        ];
        lines.push(values.join(","));
      }

      return { csv: lines.join("\n"), fileName: `errors_job_${input.jobId}.csv` };
    }),

  // =========================================================================
  // 9. cancelJob — Cancel a pending/validating job
  // =========================================================================
  cancelJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [job] = await db.select().from(bulkImportJobs)
        .where(and(eq(bulkImportJobs.id, input.jobId), eq(bulkImportJobs.companyId, companyId)))
        .limit(1);
      if (!job) throw new Error("Import job not found");

      const cancellableStatuses = ["uploaded", "validating", "validated"];
      if (!cancellableStatuses.includes(job.status || "")) {
        throw new Error(`Cannot cancel job in status "${job.status}". Only jobs in uploaded/validating/validated status can be cancelled.`);
      }

      await db.update(bulkImportJobs).set({
        status: "failed",
        completedAt: new Date(),
      }).where(eq(bulkImportJobs.id, input.jobId));

      // Mark all pending/valid rows as failed
      await unsafeCast(db).execute(
        sql`UPDATE bulk_import_rows SET status = 'failed', errors = ${JSON.stringify(["Job cancelled by user"])} WHERE jobId = ${input.jobId} AND status IN ('pending', 'valid')`
      );

      logger.info(`[BulkUpload] Job ${input.jobId} cancelled by user ${(ctx.user as any).id}`);

      return { jobId: input.jobId, status: "cancelled" };
    }),

  // =========================================================================
  // 10. retryFailedRows — Retry only failed rows from a completed job
  // =========================================================================
  retryFailedRows: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [job] = await db.select().from(bulkImportJobs)
        .where(and(eq(bulkImportJobs.id, input.jobId), eq(bulkImportJobs.companyId, companyId)))
        .limit(1);
      if (!job) throw new Error("Import job not found");

      if (job.status !== "completed" && job.status !== "failed") {
        throw new Error(`Cannot retry job in status "${job.status}". Only completed or failed jobs can be retried.`);
      }

      // Reset failed rows back to pending
      const failedRows = await db.select().from(bulkImportRows)
        .where(and(
          eq(bulkImportRows.jobId, input.jobId),
          sql`${bulkImportRows.status} IN ('failed', 'invalid')`,
        ))
        .orderBy(sql`${bulkImportRows.rowNumber} ASC`);

      if (failedRows.length === 0) {
        return { jobId: input.jobId, retriedCount: 0, message: "No failed rows to retry" };
      }

      // Reset rows to pending
      const failedRowIds = failedRows.map(r => r.id);
      for (const rowId of failedRowIds) {
        await db.update(bulkImportRows).set({
          status: "pending",
          errors: null,
        }).where(eq(bulkImportRows.id, rowId));
      }

      // Reset job status to uploaded so it can be re-validated and re-executed
      await db.update(bulkImportJobs).set({
        status: "uploaded",
        completedAt: null,
      }).where(eq(bulkImportJobs.id, input.jobId));

      logger.info(`[BulkUpload] Job ${input.jobId}: ${failedRows.length} failed rows reset for retry`);

      return {
        jobId: input.jobId,
        retriedCount: failedRows.length,
        message: `${failedRows.length} rows reset to pending. Run validateJob then executeJob to process them.`,
      };
    }),

  // =========================================================================
  // 11. processDocument — VIGA + Gemini Vision + OCR Document Intelligence
  //     Users drop a photo/PDF and AI extracts structured data automatically.
  //     Triple-engine: VIGA multi-pass analysis → Gemini 2.5 Flash Vision → OCR
  // =========================================================================
  processDocument: protectedProcedure
    .input(z.object({
      entityType: z.string().min(1),
      fileBase64: z.string().min(1),   // base64 encoded image or PDF
      mimeType: z.string().min(1),     // image/png, image/jpeg, application/pdf
      fileName: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = Number(ctx.user!.companyId) || 0;
      if (!companyId) throw new Error("Company context required");

      const entityDef = ENTITY_TYPE_MAP.get(input.entityType);
      if (!entityDef) {
        throw new Error(`Unsupported entity type: ${input.entityType}. Supported: ${ENTITY_TYPES.map(e => e.type).join(", ")}`);
      }

      const allFields = [...entityDef.requiredFields, ...entityDef.optionalFields];

      // ── Step 1: Build entity-specific VIGA extraction prompt with FULL platform code mappings ──
      const PLATFORM_CODES = `
EUSOTRIP PLATFORM CODE REFERENCE — You MUST map extracted values to these EXACT codes:

CARGO TYPES (use for cargoType field): general, hazmat, refrigerated, oversized, liquid, gas, chemicals, petroleum, livestock, vehicles, timber, grain, dry_bulk, food_grade, water, intermodal, cryogenic
MAPPING RULES: "crude oil"/"crude"/"WTI"/"Brent" → petroleum | "gasoline"/"diesel"/"jet fuel"/"refined" → petroleum | "LPG"/"propane"/"NGL"/"ammonia" → gas | "LNG"/"LOX"/"liquid nitrogen" → cryogenic | "milk"/"edible oil"/"juice" → food_grade | "produce"/"frozen"/"dairy"/"meat"/"pharma" → refrigerated | "steel"/"lumber"/"machinery"/"solar panels" → general | "grain"/"sand"/"cement"/"flour" → dry_bulk | "cattle"/"poultry"/"hogs" → livestock | "cars"/"auto"/"vehicle transport" → vehicles

VEHICLE TYPES (use for vehicleType field): tractor, trailer, tanker, flatbed, refrigerated, dry_van, lowboy, step_deck, hopper, pneumatic, end_dump, intermodal_chassis, curtain_side, reefer, auto_carrier, car_hauler, grain_trailer, dump_trailer, container_chassis, conestoga, rgn, double_drop, roll_off, box_truck, chemical_tanker, specialized, oversize

DOT HAZMAT CLASSES (use for hazmatClass field): 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 3, 4.1, 4.2, 4.3, 5.1, 5.2, 6.1, 6.2, 7, 8, 9
MAPPING: "Flammable Liquid"/"combustible" → 3 | "Flammable Gas"/"propane"/"LPG" → 2.1 | "Poison Gas"/"toxic gas"/"H2S"/"chlorine" → 2.3 | "Corrosive"/"acid"/"caustic" → 8 | "Oxidizer" → 5.1 | "Explosive" → 1.1-1.6 | "Radioactive" → 7

KEY UN NUMBERS: UN1005=Ammonia, UN1017=Chlorine, UN1075=LPG, UN1170=Ethanol, UN1202=Diesel, UN1203=Gasoline, UN1267=Crude Oil, UN1268=Condensate, UN1789=HCl, UN1830=H2SO4, UN1863=Jet Fuel, UN1972=LNG, UN1977=Liquid Nitrogen, UN1993=Flammable Liquid NOS, UN1999=Asphalt, UN2067=Ammonium Nitrate

DOT TANK SPECS: MC-306/DOT-406=Liquid Tank, MC-307/DOT-407=Chemical Tank, MC-312/DOT-412=Corrosive Tank, MC-331=Pressurized Gas, MC-338=Cryogenic

WEIGHT UNITS: lbs (default), kg | VOLUME UNITS: gal (default), bbl (barrels for petroleum), cbm | RATE TYPES: flat, per_mile, per_barrel, per_gallon, per_ton

CDL CLASSES: A, B, C | ENDORSEMENTS: H=Hazmat, N=Tank, X=Hazmat+Tank, T=Doubles/Triples, P=Passenger

FACILITY TYPES: TERMINAL, REFINERY, WELL, RACK, TANK_BATTERY, TRANSLOAD, BULK_PLANT

US STATE CODES: AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY`;

      const extractionPrompt = `You are ESANG, an AI document processor for EusoTrip logistics platform.
Powered by VIGA (Vision-as-Inverse-Graphics Agent) multi-pass visual analysis.

TASK: Extract structured data from this ${entityDef.label} document (${input.fileName}).

${PLATFORM_CODES}

ANALYSIS PROTOCOL (VIGA Multi-Pass):
Pass 1 — CAPTURE: Identify document type, orientation, quality. Is this a BOL, invoice, rate sheet, driver list, manifest, inspection form, facility directory, or something else?
Pass 2 — EXTRACT: Read ALL text, numbers, dates, names, addresses, phone numbers, emails, IDs, codes, UN numbers, hazmat placards, seal numbers, trailer numbers. Use OCR-level precision. Read every cell if it is a table/spreadsheet photo.
Pass 3 — STRUCTURE: Map extracted data to these target fields: ${allFields.join(", ")}
  CRITICAL: Use the PLATFORM CODE REFERENCE above to normalize values:
  - Cargo descriptions → map to exact cargoType enum (e.g., "Electrical Appliances" → general, "Crude Oil" → petroleum)
  - Hazmat info → map to exact hazmatClass code (e.g., "Flammable Liquid" → 3) + resolve UN number
  - Vehicle/trailer descriptions → map to exact vehicleType enum
  - Weights → normalize to lbs with unit "lbs"
  - Volumes → normalize to appropriate unit (bbl for petroleum, gal otherwise)
  - States → 2-letter code (e.g., "Louisiana" → LA, "New Orleans, LA" → extract "LA")
  - Dates → YYYY-MM-DD format
Pass 4 — VERIFY: Cross-check extracted values:
  - cargoType MUST be one of the enum values listed above
  - hazmatClass MUST be a valid DOT class (1.1-9) if present
  - vehicleType MUST be one of the enum values listed above
  - State codes MUST be valid 2-letter US/CA codes
  - UN numbers MUST be 4-digit format (UN####)
  - Weights realistic for freight (500-80,000 lbs typical)
  - If commodity implies hazmat (crude oil, gasoline, chemicals), set hazmatClass appropriately even if not explicitly stated

If this is a MULTI-RECORD document (e.g., a spreadsheet photo, a list of items, multiple BOLs on one page, a rate table), extract EACH record as a separate row in the records array.

Required fields for this entity type: ${entityDef.requiredFields.join(", ")}
Optional fields: ${entityDef.optionalFields.join(", ")}

Return STRICT JSON:
{
  "documentType": "string (detected type)",
  "confidence": number (0-100),
  "recordCount": number,
  "records": [
    { ${allFields.map(f => `"${f}": "value or null"`).join(", ")} }
  ],
  "warnings": ["any quality/ambiguity warnings"],
  "rawTextExtracted": "full OCR text for audit"
}

Extract ALL possible fields. Use null for unreadable/missing values. Be precise.`;

      logger.info(`[BulkUpload/VIGA] Processing document: ${input.fileName} as ${input.entityType} (${input.mimeType})`);
      const startTime = Date.now();

      // ── Step 2: Call Gemini 2.5 Flash Vision (VIGA engine) ──
      let rawJson: string;
      try {
        rawJson = await callGeminiVisionForDocument(
          input.fileBase64,
          input.mimeType,
          extractionPrompt,
        );
      } catch (err: any) {
        logger.error(`[BulkUpload/VIGA] Gemini Vision call failed:`, err.message);
        throw new Error(`Document processing failed: ${err.message}. Ensure the image is clear and the file is not corrupted.`);
      }

      // ── Step 3: Parse and validate the AI response ──
      let parsed: {
        documentType: string;
        confidence: number;
        recordCount: number;
        records: Record<string, any>[];
        warnings: string[];
        rawTextExtracted: string;
      };

      try {
        parsed = JSON.parse(rawJson);
      } catch {
        // Try to extract JSON from markdown code block (fallback)
        const jsonMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          logger.error(`[BulkUpload/VIGA] Failed to parse response: ${rawJson.slice(0, 300)}`);
          throw new Error("AI returned invalid JSON. The document may be too blurry or in an unsupported format.");
        }
      }

      const elapsed = Date.now() - startTime;
      logger.info(`[BulkUpload/VIGA] Document processed in ${elapsed}ms — type: ${parsed.documentType}, confidence: ${parsed.confidence}%, records: ${parsed.recordCount}`);

      // Ensure records array exists and has content
      if (!Array.isArray(parsed.records) || parsed.records.length === 0) {
        throw new Error("No records could be extracted from this document. Try a clearer image or a different file format.");
      }

      // ── Step 4: Validate extracted records against entity type requirements ──
      const validatedRecords: Array<{
        data: Record<string, any>;
        isValid: boolean;
        errors: string[];
        missingRequired: string[];
      }> = [];

      for (const record of parsed.records) {
        // Clean up null strings
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(record)) {
          if (value === null || value === "null" || value === "N/A" || value === "") {
            cleaned[key] = "";
          } else {
            cleaned[key] = String(value).trim();
          }
        }

        // Check which required fields are missing
        const missingRequired = entityDef.requiredFields.filter(
          f => !cleaned[f] || cleaned[f] === "",
        );

        // Run entity-specific validation
        const { isValid, errors } = validateRowByEntityType(input.entityType, cleaned);

        validatedRecords.push({
          data: cleaned,
          isValid: isValid && missingRequired.length === 0,
          errors,
          missingRequired,
        });
      }

      const validCount = validatedRecords.filter(r => r.isValid).length;
      const invalidCount = validatedRecords.filter(r => !r.isValid).length;

      // ── Step 5: Convert extracted records to CSV text ──
      // This allows the frontend to feed it directly into the uploadAndProcess flow
      const csvHeaders = allFields;
      const csvLines = [csvHeaders.join(",")];
      for (const vr of validatedRecords) {
        const row = csvHeaders.map(h => {
          const val = vr.data[h] || "";
          return escapeCSVField(String(val));
        });
        csvLines.push(row.join(","));
      }
      const csvText = csvLines.join("\n");

      // ── Step 6: Build warnings list ──
      const allWarnings = [...(parsed.warnings || [])];
      if (parsed.confidence < 50) {
        allWarnings.push("Low confidence extraction — please review all fields carefully before importing.");
      }
      if (invalidCount > 0) {
        allWarnings.push(`${invalidCount} of ${validatedRecords.length} records have validation issues — review required fields.`);
      }
      for (const vr of validatedRecords) {
        if (vr.missingRequired.length > 0) {
          allWarnings.push(`Record missing required fields: ${vr.missingRequired.join(", ")}`);
        }
      }

      logger.info(`[BulkUpload/VIGA] Extraction complete: ${validCount} valid, ${invalidCount} invalid out of ${validatedRecords.length} records`);

      return {
        documentType: parsed.documentType || "unknown",
        confidence: parsed.confidence || 0,
        recordCount: validatedRecords.length,
        records: validatedRecords,
        csvText,
        warnings: allWarnings,
        rawTextExtracted: parsed.rawTextExtracted || "",
        processingTimeMs: elapsed,
        entityType: input.entityType,
        entityLabel: entityDef.label,
      };
    }),
});
