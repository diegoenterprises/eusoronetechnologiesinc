/**
 * DOCUMENT OCR & AI CLASSIFICATION SERVICE
 * 
 * Tiered OCR pipeline:
 *   1. PaddleOCR (Python) — highest accuracy for scanned docs
 *   2. ESANG AI Vision — native multimodal OCR + understanding
 * 
 * After text extraction, feeds to ESANG AI for intelligent classification:
 *   - Document type detection
 *   - Key field extraction (dates, amounts, parties, IDs)
 *   - Auto-category assignment
 *   - Expiry date detection
 */

import { execFile } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { ENV } from "../_core/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
export interface OCRResult {
  text: string;
  lines: { text: string; confidence: number }[];
  engine: "paddleocr" | "gemini_vision";
  avgConfidence: number;
}

export interface DocumentClassification {
  category: string;
  subcategory: string;
  confidence: number;
  documentTitle: string;
  summary: string;
  extractedFields: Record<string, string>;
  suggestedExpiryDate: string | null;
  suggestedTags: string[];
  isExpirable: boolean;
}

export interface DigitizeResult {
  ocr: OCRResult;
  classification: DocumentClassification;
}

// ---------------------------------------------------------------------------
// 1. PaddleOCR (Python subprocess)
// ---------------------------------------------------------------------------
async function runPaddleOCR(base64Data: string): Promise<OCRResult | null> {
  const scriptPath = join(__dirname, "paddleOCR.py");  // ESM-safe __dirname defined above
  if (!existsSync(scriptPath)) return null;

  // Write base64 data to temp file
  const tmpFile = join(tmpdir(), `eusotrip_ocr_${Date.now()}.b64`);
  writeFileSync(tmpFile, base64Data);

  return new Promise((resolve) => {
    execFile(
      "python3",
      [scriptPath, tmpFile],
      { timeout: 60000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        // Cleanup
        try { unlinkSync(tmpFile); } catch {}

        if (error) {
          console.warn("[DocumentOCR] PaddleOCR unavailable:", error.message);
          resolve(null);
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (!result.success) {
            console.warn("[DocumentOCR] PaddleOCR error:", result.error);
            resolve(null);
            return;
          }
          resolve({
            text: result.text || "",
            lines: (result.lines || []).map((l: any) => ({
              text: l.text,
              confidence: l.confidence,
            })),
            engine: "paddleocr",
            avgConfidence: result.avgConfidence || 0,
          });
        } catch (parseErr) {
          console.warn("[DocumentOCR] PaddleOCR parse error:", parseErr);
          resolve(null);
        }
      }
    );
  });
}

// ---------------------------------------------------------------------------
// 2. ESANG AI Vision OCR (fallback — always available)
// ---------------------------------------------------------------------------
const GEMINI_VISION_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function runGeminiVisionOCR(base64Data: string): Promise<OCRResult | null> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) {
    console.warn("[DocumentOCR] ESANG AI API key not configured");
    return null;
  }

  // Strip data URI prefix to get raw base64
  let rawBase64 = base64Data;
  let mimeType = "image/png";
  if (base64Data.startsWith("data:")) {
    const [header, data] = base64Data.split(",", 2);
    rawBase64 = data;
    const mimeMatch = header.match(/data:([^;]+)/);
    if (mimeMatch) mimeType = mimeMatch[1];
  }

  // For PDFs, specify PDF mime type
  if (mimeType === "application/pdf") {
    mimeType = "application/pdf";
  }

  try {
    const response = await fetch(`${GEMINI_VISION_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: rawBase64,
                },
              },
              {
                text: `Extract ALL text from this document image. Return the raw extracted text exactly as it appears, preserving line breaks and layout. Do not summarize or interpret — just extract every visible word, number, date, and piece of text. If no text is found, respond with "NO_TEXT_FOUND".`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      console.warn("[DocumentOCR] ESANG AI Vision error:", response.status);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text || text === "NO_TEXT_FOUND") {
      return { text: "", lines: [], engine: "gemini_vision", avgConfidence: 0 };
    }

    const lines = text
      .split("\n")
      .filter((l: string) => l.trim())
      .map((l: string) => ({ text: l.trim(), confidence: 0.9 }));

    return {
      text,
      lines,
      engine: "gemini_vision",
      avgConfidence: 0.9,
    };
  } catch (err) {
    console.error("[DocumentOCR] ESANG AI Vision error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3. ESANG AI Document Classification
// ---------------------------------------------------------------------------
const CLASSIFICATION_PROMPT = `You are ESANG AI's Document Intelligence engine for EusoTrip, a hazardous materials logistics platform.

Analyze the following OCR-extracted text from an uploaded document. Determine:

1. **category**: One of: insurance, permits, compliance, freight, financial, contracts, company, vehicle, other
2. **subcategory**: More specific type, e.g. "liability_insurance", "cargo_insurance", "bol", "rate_confirmation", "cdl", "medical_card", "mc_authority", "invoice", "w9", "vehicle_registration", etc.
3. **confidence**: 0-100 how confident you are
4. **documentTitle**: A clean, descriptive title for this document
5. **summary**: 1-2 sentence summary of what this document is
6. **extractedFields**: Key-value pairs of important data found (dates, amounts, names, IDs, policy numbers, DOT numbers, etc.)
7. **suggestedExpiryDate**: ISO date string if the document has an expiration date, null otherwise
8. **suggestedTags**: Array of relevant tags for searching
9. **isExpirable**: true if this type of document typically expires (insurance, medical cards, permits, etc.)

Respond in VALID JSON only. No markdown, no explanation outside the JSON.

JSON schema:
{
  "category": "string",
  "subcategory": "string",
  "confidence": number,
  "documentTitle": "string",
  "summary": "string",
  "extractedFields": { "key": "value" },
  "suggestedExpiryDate": "string|null",
  "suggestedTags": ["string"],
  "isExpirable": boolean
}`;

async function classifyWithESANG(ocrText: string, filename: string): Promise<DocumentClassification> {
  const apiKey = ENV.geminiApiKey;

  // Fallback classification based on filename if no API key
  if (!apiKey || !ocrText.trim()) {
    return fallbackClassification(filename, ocrText);
  }

  try {
    const response = await fetch(`${GEMINI_VISION_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${CLASSIFICATION_PROMPT}\n\nFilename: ${filename}\n\nExtracted text:\n${ocrText.slice(0, 8000)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      console.warn("[DocumentOCR] ESANG classification error:", response.status);
      return fallbackClassification(filename, ocrText);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip markdown fences if present
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(text);
    return {
      category: parsed.category || "other",
      subcategory: parsed.subcategory || "general",
      confidence: parsed.confidence || 50,
      documentTitle: parsed.documentTitle || filename,
      summary: parsed.summary || "",
      extractedFields: parsed.extractedFields || {},
      suggestedExpiryDate: parsed.suggestedExpiryDate || null,
      suggestedTags: parsed.suggestedTags || [],
      isExpirable: parsed.isExpirable || false,
    };
  } catch (err) {
    console.error("[DocumentOCR] ESANG classification error:", err);
    return fallbackClassification(filename, ocrText);
  }
}

// ---------------------------------------------------------------------------
// Fallback: regex-based classification when AI is unavailable
// ---------------------------------------------------------------------------
function fallbackClassification(filename: string, text: string): DocumentClassification {
  // Normalize underscores/hyphens to spaces so filenames like "Permit_Cost_Estimates" match
  const combined = `${filename} ${text}`.toLowerCase().replace(/[_-]+/g, " ");

  const rules: { pattern: RegExp; category: string; subcategory: string; isExpirable: boolean; tags: string[] }[] = [
    { pattern: /certificate\s*of\s*ins|liability\s*ins|bipd|general\s*liability/i, category: "insurance", subcategory: "liability_insurance", isExpirable: true, tags: ["insurance", "liability"] },
    { pattern: /cargo\s*ins|cargo\s*coverage/i, category: "insurance", subcategory: "cargo_insurance", isExpirable: true, tags: ["insurance", "cargo"] },
    { pattern: /workers?\s*comp/i, category: "insurance", subcategory: "workers_comp", isExpirable: true, tags: ["insurance", "workers-comp"] },
    { pattern: /auto\s*ins|vehicle\s*ins|commercial\s*auto/i, category: "insurance", subcategory: "auto_insurance", isExpirable: true, tags: ["insurance", "auto"] },
    { pattern: /bill\s*of\s*lading|bol[-_\s]|b\/l\b/i, category: "freight", subcategory: "bol", isExpirable: false, tags: ["bol", "freight"] },
    { pattern: /proof\s*of\s*delivery|pod[-_\s]/i, category: "freight", subcategory: "pod", isExpirable: false, tags: ["pod", "freight", "delivery"] },
    { pattern: /rate\s*con|rate\s*confirmation/i, category: "freight", subcategory: "rate_confirmation", isExpirable: false, tags: ["rate-con", "freight"] },
    { pattern: /run\s*ticket/i, category: "freight", subcategory: "run_ticket", isExpirable: false, tags: ["run-ticket", "freight"] },
    { pattern: /delivery\s*receipt/i, category: "freight", subcategory: "delivery_receipt", isExpirable: false, tags: ["delivery", "receipt"] },
    { pattern: /mc\s*auth|operating\s*auth|interstate/i, category: "permits", subcategory: "mc_authority", isExpirable: true, tags: ["mc-authority", "fmcsa"] },
    { pattern: /hazmat\s*perm|hazardous.*permit/i, category: "permits", subcategory: "hazmat_permit", isExpirable: true, tags: ["hazmat", "permit"] },
    { pattern: /oversize|overweight|permit.*transport/i, category: "permits", subcategory: "oversize_permit", isExpirable: true, tags: ["oversize", "permit"] },
    { pattern: /cdl|commercial\s*driver/i, category: "compliance", subcategory: "cdl", isExpirable: true, tags: ["cdl", "driver"] },
    { pattern: /medical\s*card|dot\s*physical|medical\s*exam/i, category: "compliance", subcategory: "medical_card", isExpirable: true, tags: ["medical", "dot-physical"] },
    { pattern: /drug\s*test|substance\s*test/i, category: "compliance", subcategory: "drug_test", isExpirable: true, tags: ["drug-test", "compliance"] },
    { pattern: /ifta/i, category: "compliance", subcategory: "ifta", isExpirable: true, tags: ["ifta", "tax"] },
    { pattern: /invoice|inv[-_\s#]/i, category: "financial", subcategory: "invoice", isExpirable: false, tags: ["invoice", "financial"] },
    { pattern: /receipt|payment\s*rec/i, category: "financial", subcategory: "receipt", isExpirable: false, tags: ["receipt", "payment"] },
    { pattern: /settlement|factoring/i, category: "financial", subcategory: "settlement", isExpirable: false, tags: ["settlement", "financial"] },
    { pattern: /contract|agreement|terms/i, category: "contracts", subcategory: "agreement", isExpirable: true, tags: ["contract", "agreement"] },
    { pattern: /w-?9|tax\s*id|ein/i, category: "company", subcategory: "w9", isExpirable: false, tags: ["w9", "tax"] },
    { pattern: /registration|title|vin/i, category: "vehicle", subcategory: "vehicle_registration", isExpirable: true, tags: ["vehicle", "registration"] },
    { pattern: /inspection|annual\s*insp/i, category: "vehicle", subcategory: "inspection", isExpirable: true, tags: ["vehicle", "inspection"] },
    // Broader catch-all rules (MUST be after specific rules)
    { pattern: /\bpermit\b/i, category: "permits", subcategory: "general_permit", isExpirable: true, tags: ["permit"] },
    { pattern: /\bestimate\b|\bcost.?estimate/i, category: "financial", subcategory: "estimate", isExpirable: false, tags: ["estimate", "financial"] },
    { pattern: /\bquote\b|\bquotation\b/i, category: "financial", subcategory: "quote", isExpirable: false, tags: ["quote", "financial"] },
    { pattern: /\bpurchase\b|\bprocurement\b/i, category: "financial", subcategory: "purchase_order", isExpirable: false, tags: ["purchase", "financial"] },
    { pattern: /\bbudget\b|\bexpense\b/i, category: "financial", subcategory: "budget", isExpirable: false, tags: ["budget", "financial"] },
    { pattern: /\bproposal\b|\bbid\b/i, category: "contracts", subcategory: "proposal", isExpirable: false, tags: ["proposal", "bid"] },
    { pattern: /\blicense\b|\blicence\b/i, category: "compliance", subcategory: "license", isExpirable: true, tags: ["license", "compliance"] },
    { pattern: /\binsurance\b|\bcoverage\b|\bpolicy\b/i, category: "insurance", subcategory: "general_insurance", isExpirable: true, tags: ["insurance"] },
    { pattern: /\bcertificate\b|\bcertification\b/i, category: "compliance", subcategory: "certification", isExpirable: true, tags: ["certificate", "compliance"] },
    { pattern: /\breport\b|\baudit\b/i, category: "compliance", subcategory: "report", isExpirable: false, tags: ["report", "compliance"] },
    { pattern: /\bletter\b|\bcorrespondence\b|\bmemo\b/i, category: "company", subcategory: "correspondence", isExpirable: false, tags: ["letter", "correspondence"] },
    { pattern: /\bmanual\b|\bguide\b|\bhandbook\b/i, category: "company", subcategory: "manual", isExpirable: false, tags: ["manual", "guide"] },
  ];

  for (const rule of rules) {
    if (rule.pattern.test(combined)) {
      return {
        category: rule.category,
        subcategory: rule.subcategory,
        confidence: 65,
        documentTitle: filename.replace(/\.[^.]+$/, ""),
        summary: `Detected as ${rule.subcategory.replace(/_/g, " ")} from filename/content patterns.`,
        extractedFields: {},
        suggestedExpiryDate: null,
        suggestedTags: rule.tags,
        isExpirable: rule.isExpirable,
      };
    }
  }

  return {
    category: "other",
    subcategory: "general",
    confidence: 20,
    documentTitle: filename.replace(/\.[^.]+$/, ""),
    summary: "Could not auto-classify this document.",
    extractedFields: {},
    suggestedExpiryDate: null,
    suggestedTags: [],
    isExpirable: false,
  };
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Full digitize pipeline: OCR → ESANG AI Classification
 * Tries PaddleOCR first, falls back to ESANG AI Vision.
 */
export async function digitizeDocument(
  base64Data: string,
  filename: string
): Promise<DigitizeResult> {
  console.log(`[DocumentOCR] Digitizing: ${filename}`);

  // Step 1: Try PaddleOCR
  let ocrResult = await runPaddleOCR(base64Data);

  // Step 2: Fall back to ESANG AI Vision
  if (!ocrResult || !ocrResult.text.trim()) {
    console.log("[DocumentOCR] PaddleOCR unavailable, using ESANG AI Vision");
    ocrResult = await runGeminiVisionOCR(base64Data);
  }

  if (!ocrResult) {
    ocrResult = { text: "", lines: [], engine: "gemini_vision", avgConfidence: 0 };
  }

  console.log(
    `[DocumentOCR] OCR complete via ${ocrResult.engine}: ${ocrResult.lines.length} lines, avg confidence ${ocrResult.avgConfidence}`
  );

  // Step 3: ESANG AI classification
  const classification = await classifyWithESANG(ocrResult.text, filename);

  console.log(
    `[DocumentOCR] Classified as ${classification.category}/${classification.subcategory} (${classification.confidence}% confidence)`
  );

  return { ocr: ocrResult, classification };
}
