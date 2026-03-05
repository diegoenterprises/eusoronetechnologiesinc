/**
 * WS-T1-001: VIGA-Inspired Document Verification Agent
 *
 * Applies VIGA's iterative analysis-by-synthesis loop to BOL/POD verification.
 * Instead of rendering 3D scenes, we "render" document understanding and verify
 * against the load database.
 *
 * Pattern:
 *   Generator  = ESANG AI extracting fields from document photos (Gemini Vision)
 *   Verifier   = Comparison engine checking extracted data against load record
 *   Memory     = Context of extraction attempts and corrections
 *   Skill Lib  = extract_text, extract_fields, compare_to_record, flag_discrepancy
 *
 * Reference: arXiv:2601.11109v2 (Vision-as-Inverse-Graphics Agent)
 */

import { ENV } from "../../_core/env";
import { getDb } from "../../db";
import { loads, auditLogs } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

// ── Constants ─────────────────────────────────────────────────────────────────
const GEMINI_VISION_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const VISION_TIMEOUT_MS = 45_000;
const MAX_ITERATIONS = 3;
const CONFIDENCE_THRESHOLD = 0.90;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FieldComparison {
  extracted: string;
  expected: string;
  match: boolean;
  confidence: number;
}

export interface VerificationResult {
  loadNumber: FieldComparison;
  origin: FieldComparison;
  destination: FieldComparison;
  weight: FieldComparison;
  hazmatClass: FieldComparison;
  carrier: FieldComparison;
  productName: FieldComparison;
  overallConfidence: number;
  discrepancies: string[];
  iteration: number;
  documentType: "bol" | "pod";
  status: "verified" | "discrepancies_found" | "low_confidence" | "failed";
}

interface ExtractedFields {
  loadNumber?: string;
  origin?: string;
  destination?: string;
  weight?: string;
  hazmatClass?: string;
  carrier?: string;
  productName?: string;
  signature?: boolean;
  date?: string;
  additionalNotes?: string;
}

// ── Gemini Vision Call ────────────────────────────────────────────────────────

async function callGeminiVisionForDocument(
  imageBase64: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) throw new Error("[DocVerifier] GEMINI_API_KEY not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

  try {
    const resp = await fetch(`${GEMINI_VISION_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });

    clearTimeout(timer);
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "unknown");
      throw new Error(`Gemini API ${resp.status}: ${errText.slice(0, 200)}`);
    }

    const data = await resp.json() as any;
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Extraction Prompts ────────────────────────────────────────────────────────

function getExtractionPrompt(
  documentType: "bol" | "pod",
  previousAttempts: VerificationResult[],
  focusAreas: string[],
): string {
  const docName = documentType === "bol" ? "Bill of Lading (BOL)" : "Proof of Delivery (POD)";
  const focusInstructions = focusAreas.length > 0
    ? `\n\nPREVIOUS EXTRACTION HAD ISSUES WITH: ${focusAreas.join(", ")}. Pay extra attention to these fields.`
    : "";
  const iterationContext = previousAttempts.length > 0
    ? `\n\nThis is attempt #${previousAttempts.length + 1}. Previous attempt confidence: ${(previousAttempts[previousAttempts.length - 1].overallConfidence * 100).toFixed(0)}%.`
    : "";

  return `You are VIGA — a Vision-as-Inverse-Graphics document verification agent for freight logistics.

Analyze this ${docName} image and extract ALL of the following fields. Be as precise as possible.
${focusInstructions}${iterationContext}

Return JSON with these exact fields:
{
  "loadNumber": "the load/shipment/reference number (e.g., LD-240305-ABCD1234)",
  "origin": "pickup city, state (e.g., Houston, TX)",
  "destination": "delivery city, state (e.g., Corpus Christi, TX)",
  "weight": "total weight with units (e.g., 42000 lbs)",
  "hazmatClass": "hazmat classification if present, or empty string",
  "carrier": "carrier/trucking company name",
  "productName": "commodity/product name (e.g., Crude Oil, WTI)",
  "signature": true or false — whether a signature is visible,
  "date": "document date if visible",
  "additionalNotes": "any other relevant info (seal numbers, trailer, etc.)"
}

If a field is not visible or illegible, use an empty string. Do NOT guess.`;
}

// ── Field Comparison Engine (Verifier) ────────────────────────────────────────

function normalizeForComparison(val: string): string {
  return (val || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyMatch(extracted: string, expected: string): { match: boolean; confidence: number } {
  const a = normalizeForComparison(extracted);
  const b = normalizeForComparison(expected);

  if (!a || !b) return { match: false, confidence: 0 };
  if (a === b) return { match: true, confidence: 1.0 };

  // Check if one contains the other
  if (a.includes(b) || b.includes(a)) return { match: true, confidence: 0.9 };

  // Token overlap (Jaccard similarity)
  const tokensA = a.split(" ").filter(Boolean);
  const tokensB = new Set(b.split(" ").filter(Boolean));
  const intersection = tokensA.filter(t => tokensB.has(t)).length;
  const allTokens = new Set(tokensA.concat(Array.from(tokensB)));
  const union = allTokens.size;
  const jaccard = union > 0 ? intersection / union : 0;

  return {
    match: jaccard >= 0.6,
    confidence: jaccard,
  };
}

function compareField(extracted: string, expected: string): FieldComparison {
  const { match, confidence } = fuzzyMatch(extracted, expected);
  return { extracted: extracted || "(not found)", expected, match, confidence };
}

// ── Core Verification Loop (VIGA Pattern) ─────────────────────────────────────

/**
 * Verify a BOL or POD document image against the load database record.
 * Uses VIGA's iterative Generator → Verifier → Memory loop.
 */
export async function verifyDocument(
  imageBase64: string,
  loadId: number,
  documentType: "bol" | "pod",
  options: {
    mimeType?: string;
    maxIterations?: number;
    userId?: number;
  } = {},
): Promise<VerificationResult> {
  const mimeType = options.mimeType || "image/jpeg";
  const maxIter = options.maxIterations ?? MAX_ITERATIONS;

  // Fetch load record from DB
  const db = await getDb();
  if (!db) throw new Error("[DocVerifier] Database unavailable");

  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) throw new Error(`[DocVerifier] Load #${loadId} not found`);

  const loadRecord = load as any;
  const expectedOrigin = loadRecord.pickupLocation?.city
    ? `${loadRecord.pickupLocation.city}, ${loadRecord.pickupLocation.state}`
    : loadRecord.pickupLocation?.address || "";
  const expectedDest = loadRecord.deliveryLocation?.city
    ? `${loadRecord.deliveryLocation.city}, ${loadRecord.deliveryLocation.state}`
    : loadRecord.deliveryLocation?.address || "";

  // VIGA Memory — stores past iteration results
  let memory: VerificationResult[] = [];

  for (let t = 0; t < maxIter; t++) {
    const focusAreas = memory.length > 0
      ? memory[memory.length - 1].discrepancies
      : [];

    try {
      // Phase 1: Generator — Extract fields using Gemini Vision
      const prompt = getExtractionPrompt(documentType, memory, focusAreas);
      const rawJson = await callGeminiVisionForDocument(imageBase64, mimeType, prompt);

      let extracted: ExtractedFields;
      try {
        extracted = JSON.parse(rawJson);
      } catch {
        const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extracted = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse extraction response");
        }
      }

      // Phase 2: Verifier — Compare extracted data against load record
      const loadNumber = compareField(extracted.loadNumber || "", loadRecord.loadNumber || "");
      const origin = compareField(extracted.origin || "", expectedOrigin);
      const destination = compareField(extracted.destination || "", expectedDest);
      const weight = compareField(extracted.weight || "", loadRecord.weight ? `${loadRecord.weight} ${loadRecord.weightUnit || "lbs"}` : "");
      const hazmatClass = compareField(extracted.hazmatClass || "", loadRecord.hazmatClass || "");
      const carrier = compareField(extracted.carrier || "", ""); // No expected — informational
      const productName = compareField(extracted.productName || "", loadRecord.commodityName || loadRecord.cargoType || "");

      // Compute overall confidence (weighted average of key fields)
      const fieldScores = [
        { weight: 0.30, score: loadNumber.confidence },
        { weight: 0.20, score: origin.confidence },
        { weight: 0.20, score: destination.confidence },
        { weight: 0.15, score: weight.confidence || (weight.expected ? 0 : 1) },
        { weight: 0.15, score: productName.confidence || (productName.expected ? 0 : 1) },
      ];
      const overallConfidence = fieldScores.reduce((sum, f) => sum + f.weight * f.score, 0);

      // Collect discrepancies
      const discrepancies: string[] = [];
      if (!loadNumber.match && loadNumber.expected) discrepancies.push(`Load number mismatch: "${loadNumber.extracted}" vs "${loadNumber.expected}"`);
      if (!origin.match && origin.expected) discrepancies.push(`Origin mismatch: "${origin.extracted}" vs "${origin.expected}"`);
      if (!destination.match && destination.expected) discrepancies.push(`Destination mismatch: "${destination.extracted}" vs "${destination.expected}"`);
      if (!weight.match && weight.expected) discrepancies.push(`Weight mismatch: "${weight.extracted}" vs "${weight.expected}"`);
      if (!hazmatClass.match && hazmatClass.expected) discrepancies.push(`Hazmat class mismatch: "${hazmatClass.extracted}" vs "${hazmatClass.expected}"`);
      if (!productName.match && productName.expected) discrepancies.push(`Product mismatch: "${productName.extracted}" vs "${productName.expected}"`);

      // Determine status
      let status: VerificationResult["status"] = "verified";
      if (overallConfidence < 0.5) status = "low_confidence";
      else if (discrepancies.length > 0) status = "discrepancies_found";

      const result: VerificationResult = {
        loadNumber, origin, destination, weight, hazmatClass, carrier, productName,
        overallConfidence,
        discrepancies,
        iteration: t + 1,
        documentType,
        status,
      };

      // Phase 3: Memory Update (VIGA TailL pattern — keep last 3)
      memory.push(result);
      if (memory.length > 3) memory = memory.slice(-3);

      // Phase 4: Convergence check
      if (overallConfidence >= CONFIDENCE_THRESHOLD || discrepancies.length === 0) {
        console.log(`[DocVerifier] Converged at iteration ${t + 1} (confidence: ${(overallConfidence * 100).toFixed(1)}%)`);
        break;
      }

      console.log(`[DocVerifier] Iteration ${t + 1}: confidence ${(overallConfidence * 100).toFixed(1)}%, ${discrepancies.length} discrepancies — refining...`);
    } catch (err: any) {
      console.error(`[DocVerifier] Iteration ${t + 1} failed:`, err.message);
      if (t === maxIter - 1) {
        return {
          loadNumber: { extracted: "", expected: loadRecord.loadNumber || "", match: false, confidence: 0 },
          origin: { extracted: "", expected: expectedOrigin, match: false, confidence: 0 },
          destination: { extracted: "", expected: expectedDest, match: false, confidence: 0 },
          weight: { extracted: "", expected: loadRecord.weight || "", match: false, confidence: 0 },
          hazmatClass: { extracted: "", expected: loadRecord.hazmatClass || "", match: false, confidence: 0 },
          carrier: { extracted: "", expected: "", match: false, confidence: 0 },
          productName: { extracted: "", expected: loadRecord.commodityName || "", match: false, confidence: 0 },
          overallConfidence: 0,
          discrepancies: [`Extraction failed: ${err.message}`],
          iteration: t + 1,
          documentType,
          status: "failed",
        };
      }
    }
  }

  const finalResult = memory[memory.length - 1];

  // Audit log the verification
  try {
    await db.insert(auditLogs).values({
      action: `document_verification_${documentType}`,
      entityType: "load",
      entityId: loadId,
      userId: options.userId || null,
      changes: JSON.stringify({
        status: finalResult.status,
        confidence: finalResult.overallConfidence,
        iterations: finalResult.iteration,
        discrepancies: finalResult.discrepancies,
      }),
      severity: finalResult.status === "verified" ? "LOW" : "MEDIUM",
    } as any);
  } catch { /* non-critical */ }

  return finalResult;
}

/**
 * Quick verification — single-pass extraction without iterative refinement.
 * Faster but less accurate. Use for bulk screening.
 */
export async function quickVerify(
  imageBase64: string,
  loadId: number,
  documentType: "bol" | "pod",
  mimeType = "image/jpeg",
): Promise<VerificationResult> {
  return verifyDocument(imageBase64, loadId, documentType, { mimeType, maxIterations: 1 });
}
