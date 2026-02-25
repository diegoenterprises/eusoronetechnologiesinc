/**
 * INSURANCE DOCUMENT SCANNER — Gemini-Powered Extraction
 * 
 * Scans insurance documents (Declaration Pages, ACORD 25/24 certificates)
 * and extracts structured policy data using Google Gemini Vision API.
 * 
 * Adapted for EusoTrip's existing Gemini integration pattern.
 * Uses the same API key and fetch helpers as ESANG AI.
 */

import { ENV } from "../_core/env";

// Use Gemini 2.5 Flash for fast multimodal extraction
const GEMINI_VISION_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_TIMEOUT_MS = 60_000; // 60s for document processing
const MAX_RETRIES = 2;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface InsuranceExtraction {
  documentType: "ACORD_25" | "ACORD_24" | "DEC_PAGE_AUTO" | "DEC_PAGE_CARGO" | "DEC_PAGE_GL" | "UNKNOWN";
  confidence: number;

  policy: {
    number: string;
    effectiveDate: string;
    expirationDate: string;
    insurerName: string;
    insurerNAIC?: string;
    namedInsured: string;
    namedInsuredAddress?: string;
  };

  coverages: CoverageExtraction[];

  endorsements: {
    mcs90: boolean;
    mcs90Filed?: boolean;
    additionalInsured: boolean;
    waiverOfSubrogation: boolean;
    primaryNonContributory: boolean;
    hazmatCoverage: boolean;
    pollutionLiability: boolean;
  };

  producer?: {
    name: string;
    phone: string;
    address?: string;
  };

  vehicles?: VehicleExtraction[];

  extractionWarnings: string[];
  fieldsRequiringReview: string[];
}

export interface CoverageExtraction {
  type: "AUTO_LIABILITY" | "GENERAL_LIABILITY" | "CARGO" | "WORKERS_COMP" | "UMBRELLA" | "POLLUTION";
  limits: {
    combinedSingleLimit?: number | null;
    bodilyInjuryPerPerson?: number | null;
    bodilyInjuryPerAccident?: number | null;
    propertyDamage?: number | null;
    eachOccurrence?: number | null;
    aggregate?: number | null;
    productsCompletedOps?: number | null;
    cargoLimit?: number | null;
    deductible?: number | null;
  };
}

export interface VehicleExtraction {
  vin: string;
  year: number;
  make: string;
  model: string;
}

// Hazmat coverage requirements per 49 CFR 387
export const COVERAGE_REQUIREMENTS = {
  GENERAL_FREIGHT: { minimumLiability: 750_000, requiresMcs90: true },
  HAZMAT_STANDARD: { minimumLiability: 1_000_000, requiresMcs90: true, requiresHazmatEndorsement: true },
  HAZMAT_HIGH_RISK: { minimumLiability: 5_000_000, requiresMcs90: true, requiresHazmatEndorsement: true, requiresHMSP: true },
} as const;

export const HIGH_RISK_HAZMAT_CLASSES = ["1", "2.1", "2.3", "6.1", "7"];

// ═══════════════════════════════════════════════════════════════════════════
// GEMINI FETCH HELPER (same pattern as esangAI.ts)
// ═══════════════════════════════════════════════════════════════════════════

async function gemFetch(url: string, init: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    try {
      const resp = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (resp.ok || resp.status < 500) return resp;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      return resp;
    } catch (err: any) {
      clearTimeout(timer);
      if (attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error("Gemini fetch failed after retries");
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTION PROMPT
// ═══════════════════════════════════════════════════════════════════════════

const EXTRACTION_PROMPT = `You are an insurance document extraction specialist for a hazmat trucking logistics platform.
Analyze this insurance document (Declaration Page, ACORD 25, or ACORD 24 Certificate of Insurance) and extract ALL relevant information.

Return a JSON object with this EXACT structure:

{
  "documentType": "ACORD_25" | "ACORD_24" | "DEC_PAGE_AUTO" | "DEC_PAGE_CARGO" | "DEC_PAGE_GL" | "UNKNOWN",
  "confidence": 0.0-1.0,
  "policy": {
    "number": "policy number string",
    "effectiveDate": "YYYY-MM-DD",
    "expirationDate": "YYYY-MM-DD",
    "insurerName": "insurance company name",
    "insurerNAIC": "NAIC code if visible",
    "namedInsured": "name of insured party",
    "namedInsuredAddress": "address if visible"
  },
  "coverages": [
    {
      "type": "AUTO_LIABILITY" | "GENERAL_LIABILITY" | "CARGO" | "WORKERS_COMP" | "UMBRELLA" | "POLLUTION",
      "limits": {
        "combinedSingleLimit": number or null,
        "bodilyInjuryPerPerson": number or null,
        "bodilyInjuryPerAccident": number or null,
        "propertyDamage": number or null,
        "eachOccurrence": number or null,
        "aggregate": number or null,
        "productsCompletedOps": number or null,
        "cargoLimit": number or null,
        "deductible": number or null
      }
    }
  ],
  "endorsements": {
    "mcs90": true/false,
    "mcs90Filed": true/false if indicated,
    "additionalInsured": true/false,
    "waiverOfSubrogation": true/false,
    "primaryNonContributory": true/false,
    "hazmatCoverage": true/false,
    "pollutionLiability": true/false
  },
  "producer": {
    "name": "agent/broker name",
    "phone": "phone number",
    "address": "address if visible"
  },
  "vehicles": [
    {
      "vin": "VIN number",
      "year": 2024,
      "make": "Freightliner",
      "model": "Cascadia"
    }
  ],
  "extractionWarnings": [],
  "fieldsRequiringReview": []
}

CRITICAL RULES:
1. Convert ALL dollar amounts to integers (no commas, no dollar signs, no decimals)
2. Dates MUST be YYYY-MM-DD format
3. If a field is not visible or unclear, use null
4. Set confidence 0.0-1.0 based on document clarity
5. Add warnings for any fields that were difficult to read
6. MCS-90 endorsement is CRITICAL for trucking — look for it specifically
7. Look for "Additional Insured" checkbox or endorsement language
8. Extract ALL vehicles if this is an auto policy
9. For ACORD forms, form number is usually bottom left
10. For hazmat trucking: look for pollution liability, environmental coverage, hazmat endorsement

Respond ONLY with valid JSON, no additional text or markdown.`;

// ═══════════════════════════════════════════════════════════════════════════
// SCANNER SERVICE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract insurance data from a document image using Gemini Vision API.
 * 
 * @param base64Data - Base64-encoded file content (no data: prefix)
 * @param mimeType - "application/pdf", "image/png", or "image/jpeg"
 * @returns Structured InsuranceExtraction with confidence scores
 */
export async function scanInsuranceDocument(
  base64Data: string,
  mimeType: string
): Promise<InsuranceExtraction> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) {
    throw new Error("Gemini API key not configured — set GEMINI_API_KEY");
  }

  // Strip data URI prefix if present
  const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType === "application/pdf" ? "application/pdf" : mimeType,
              data: cleanBase64,
            },
          },
          { text: EXTRACTION_PROMPT },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      topP: 0.95,
    },
  };

  const response = await gemFetch(`${GEMINI_VISION_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[InsuranceScanner] Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Parse JSON response
  const extraction = parseExtractionResponse(text);

  // Validate and add warnings
  validateExtraction(extraction);

  console.log(`[InsuranceScanner] Extracted ${extraction.documentType} — confidence: ${extraction.confidence} — ${extraction.coverages.length} coverages, ${extraction.extractionWarnings.length} warnings`);

  return extraction;
}

/**
 * Parse Gemini response text into InsuranceExtraction
 */
function parseExtractionResponse(responseText: string): InsuranceExtraction {
  // Remove markdown code blocks if present
  let cleaned = responseText.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  // Try to find JSON object in the response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in Gemini response");
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // Normalize to our expected shape
    return {
      documentType: parsed.documentType || "UNKNOWN",
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
      policy: {
        number: parsed.policy?.number || "",
        effectiveDate: parsed.policy?.effectiveDate || "",
        expirationDate: parsed.policy?.expirationDate || "",
        insurerName: parsed.policy?.insurerName || "",
        insurerNAIC: parsed.policy?.insurerNAIC || undefined,
        namedInsured: parsed.policy?.namedInsured || "",
        namedInsuredAddress: parsed.policy?.namedInsuredAddress || undefined,
      },
      coverages: (parsed.coverages || []).map((c: any) => ({
        type: c.type || "AUTO_LIABILITY",
        limits: {
          combinedSingleLimit: c.limits?.combinedSingleLimit ?? null,
          bodilyInjuryPerPerson: c.limits?.bodilyInjuryPerPerson ?? null,
          bodilyInjuryPerAccident: c.limits?.bodilyInjuryPerAccident ?? null,
          propertyDamage: c.limits?.propertyDamage ?? null,
          eachOccurrence: c.limits?.eachOccurrence ?? null,
          aggregate: c.limits?.aggregate ?? null,
          productsCompletedOps: c.limits?.productsCompletedOps ?? null,
          cargoLimit: c.limits?.cargoLimit ?? null,
          deductible: c.limits?.deductible ?? null,
        },
      })),
      endorsements: {
        mcs90: !!parsed.endorsements?.mcs90,
        mcs90Filed: parsed.endorsements?.mcs90Filed ?? undefined,
        additionalInsured: !!parsed.endorsements?.additionalInsured,
        waiverOfSubrogation: !!parsed.endorsements?.waiverOfSubrogation,
        primaryNonContributory: !!parsed.endorsements?.primaryNonContributory,
        hazmatCoverage: !!parsed.endorsements?.hazmatCoverage,
        pollutionLiability: !!parsed.endorsements?.pollutionLiability,
      },
      producer: parsed.producer ? {
        name: parsed.producer.name || "",
        phone: parsed.producer.phone || "",
        address: parsed.producer.address || undefined,
      } : undefined,
      vehicles: (parsed.vehicles || []).map((v: any) => ({
        vin: v.vin || "",
        year: v.year || 0,
        make: v.make || "",
        model: v.model || "",
      })),
      extractionWarnings: parsed.extractionWarnings || [],
      fieldsRequiringReview: parsed.fieldsRequiringReview || [],
    };
  } catch (err) {
    console.error("[InsuranceScanner] JSON parse error:", err);
    throw new Error("Failed to parse extraction response");
  }
}

/**
 * Validate extraction and add warnings for critical missing fields
 */
function validateExtraction(extraction: InsuranceExtraction): void {
  const w = extraction.extractionWarnings;
  const r = extraction.fieldsRequiringReview;

  // Missing policy number
  if (!extraction.policy.number) {
    w.push("Policy number not found — manual entry required");
    r.push("policyNumber");
  }

  // Missing or invalid dates
  if (!extraction.policy.effectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(extraction.policy.effectiveDate)) {
    w.push("Effective date unclear or not found");
    r.push("effectiveDate");
  }
  if (!extraction.policy.expirationDate || !/^\d{4}-\d{2}-\d{2}$/.test(extraction.policy.expirationDate)) {
    w.push("Expiration date unclear or not found");
    r.push("expirationDate");
  }

  // Check if policy is expired
  if (extraction.policy.expirationDate) {
    const expDate = new Date(extraction.policy.expirationDate);
    if (expDate < new Date()) {
      w.push(`Policy appears EXPIRED (expiration: ${extraction.policy.expirationDate})`);
    }
  }

  // Missing MCS-90 (critical for trucking)
  if (!extraction.endorsements.mcs90) {
    w.push("MCS-90 endorsement not detected — required for interstate motor carriers");
  }

  // Missing auto liability coverage
  const hasAutoLiability = extraction.coverages.some(c => c.type === "AUTO_LIABILITY");
  if (!hasAutoLiability) {
    w.push("No auto liability coverage detected");
  }

  // Low confidence
  if (extraction.confidence < 0.7) {
    w.push(`Low extraction confidence (${(extraction.confidence * 100).toFixed(0)}%) — manual review recommended`);
  }

  // Missing insurer name
  if (!extraction.policy.insurerName) {
    w.push("Insurer name not found");
    r.push("insurerName");
  }

  // Missing named insured
  if (!extraction.policy.namedInsured) {
    w.push("Named insured not found");
    r.push("namedInsured");
  }
}

/**
 * Check if a carrier's insurance coverage meets requirements for a specific load.
 * Returns compliance result with pass/fail and specific deficiencies.
 */
export function checkCoverageCompliance(params: {
  autoLiabilityLimit: number;
  cargoLimit: number;
  hasMcs90: boolean;
  hasHazmatCoverage: boolean;
  hasPollutionLiability: boolean;
  hazmatClass?: string;
  isHRCQ?: boolean;
  isBulk?: boolean;
}): {
  compliant: boolean;
  deficiencies: string[];
  requiredLiability: number;
  currentLiability: number;
} {
  const deficiencies: string[] = [];
  let requiredLiability: number = COVERAGE_REQUIREMENTS.GENERAL_FREIGHT.minimumLiability;

  // Determine required coverage level
  if (params.hazmatClass) {
    if (HIGH_RISK_HAZMAT_CLASSES.includes(params.hazmatClass) || params.isHRCQ) {
      requiredLiability = COVERAGE_REQUIREMENTS.HAZMAT_HIGH_RISK.minimumLiability;
      if (!params.hasHazmatCoverage) deficiencies.push("Hazmat endorsement required for high-risk materials");
      if (!params.hasPollutionLiability) deficiencies.push("Pollution liability coverage required for high-risk hazmat");
    } else {
      requiredLiability = COVERAGE_REQUIREMENTS.HAZMAT_STANDARD.minimumLiability;
      if (!params.hasHazmatCoverage) deficiencies.push("Hazmat endorsement required");
    }
  }

  // Check auto liability
  if (params.autoLiabilityLimit < requiredLiability) {
    deficiencies.push(`Auto liability ($${params.autoLiabilityLimit.toLocaleString()}) below required minimum ($${requiredLiability.toLocaleString()})`);
  }

  // Check MCS-90
  if (!params.hasMcs90) {
    deficiencies.push("MCS-90 endorsement not on file — required for interstate motor carriers");
  }

  return {
    compliant: deficiencies.length === 0,
    deficiencies,
    requiredLiability,
    currentLiability: params.autoLiabilityLimit,
  };
}
