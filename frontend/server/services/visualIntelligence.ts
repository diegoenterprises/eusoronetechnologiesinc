/**
 * VISUAL INTELLIGENCE SERVICE — VIGA-Inspired Multi-Pass Visual Analysis Engine
 * 
 * Adapts the Vision-as-Inverse-Graphics Agent (VIGA) pattern from UC Berkeley:
 *   1. CAPTURE — Receive image (base64) from driver/user
 *   2. ANALYZE — Multi-pass Gemini 2.5 Flash Vision reasoning
 *   3. ANNOTATE — Generate structured findings with spatial references
 *   4. VERIFY — Cross-reference against known patterns & vehicle history
 *   5. STORE — Persist to contextual memory for longitudinal tracking
 * 
 * Use Cases:
 *   - ZEUN Mechanics: Photo-based mechanical diagnosis & repair guidance
 *   - Active Trip: Gauge reading extraction, seal verification, DVIR, cargo condition
 *   - POD: Visual proof of delivery verification
 *   - Market Intelligence: Crowdsourced terminal/facility mapping
 *   - Damage Assessment: Accident/incident visual evidence
 * 
 * Reference: arXiv:2601.11109 (Vision-as-Inverse-Graphics Agent via Interleaved Multimodal Reasoning)
 */

import { ENV } from "../_core/env";

const GEMINI_VISION_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const VISION_TIMEOUT_MS = 45_000;
const VISION_MAX_RETRIES = 2;

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface VisualAnalysisRequest {
  imageBase64: string;
  mimeType?: string;
  analysisType: AnalysisType;
  context?: Record<string, any>;
}

export type AnalysisType =
  | "MECHANICAL_DIAGNOSIS"
  | "GAUGE_READING"
  | "SEAL_VERIFICATION"
  | "DVIR_INSPECTION"
  | "CARGO_CONDITION"
  | "POD_VERIFICATION"
  | "FACILITY_MAPPING"
  | "DAMAGE_ASSESSMENT"
  | "ROAD_CONDITION"
  | "GENERAL_VISUAL";

export interface MechanicalDiagnosis {
  component: string;
  componentCategory: string;
  condition: "GOOD" | "WORN" | "DAMAGED" | "CRITICAL" | "FAILED";
  defects: Array<{
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    location: string;
  }>;
  repairRecommendation: string;
  repairSteps: string[];
  partsNeeded: string[];
  estimatedRepairTime: string;
  safetyRisk: "NONE" | "LOW" | "MODERATE" | "HIGH" | "IMMEDIATE_DANGER";
  canContinueDriving: boolean;
  confidence: number;
  visualNotes: string;
}

export interface GaugeReading {
  gaugeType: string;
  reading: string;
  unit: string;
  numericValue: number | null;
  normalRange: string;
  isWithinNormal: boolean;
  additionalReadings: Array<{ label: string; value: string; unit: string }>;
  confidence: number;
  visualNotes: string;
}

export interface SealVerification {
  sealNumber: string;
  sealType: string;
  condition: "INTACT" | "BROKEN" | "TAMPERED" | "MISSING" | "UNREADABLE";
  tamperEvidence: boolean;
  tamperDetails: string | null;
  matchesBOL: boolean | null;
  confidence: number;
  visualNotes: string;
}

export interface DVIRInspection {
  inspectionPoint: string;
  condition: "PASS" | "MARGINAL" | "FAIL";
  defectsFound: Array<{
    description: string;
    severity: "MINOR" | "MAJOR" | "CRITICAL_OOS";
    requiresImmediate: boolean;
  }>;
  regulatoryNotes: string[];
  confidence: number;
  visualNotes: string;
}

export interface CargoCondition {
  cargoType: string;
  condition: "SECURE" | "SHIFTED" | "DAMAGED" | "LEAKING" | "UNKNOWN";
  issues: Array<{ description: string; severity: string; location: string }>;
  securementStatus: string;
  hazmatVisible: boolean;
  placardInfo: string | null;
  confidence: number;
  visualNotes: string;
}

export interface PODVerification {
  deliveryConfirmed: boolean;
  siteCondition: string;
  visibleEvidence: string[];
  discrepancies: string[];
  signatureVisible: boolean;
  timestampEvidence: string | null;
  confidence: number;
  visualNotes: string;
}

export interface FacilityMapping {
  facilityType: string;
  features: string[];
  accessPoints: string[];
  equipment: string[];
  hazards: string[];
  capacity: string | null;
  navigationNotes: string[];
  confidence: number;
  visualNotes: string;
}

export interface DamageAssessment {
  damageType: string;
  severity: "COSMETIC" | "MINOR" | "MODERATE" | "SEVERE" | "TOTAL";
  affectedAreas: Array<{ area: string; description: string; severity: string }>;
  estimatedRepairCost: { min: number; max: number };
  safetyImplications: string[];
  evidenceNotes: string[];
  insuranceRelevant: boolean;
  confidence: number;
  visualNotes: string;
}

export interface RoadCondition {
  conditionType: string;
  severity: "GOOD" | "FAIR" | "POOR" | "HAZARDOUS" | "IMPASSABLE";
  hazards: string[];
  recommendedAction: string;
  alternateRouteAdvised: boolean;
  confidence: number;
  visualNotes: string;
}

export type VisualAnalysisResult =
  | { type: "MECHANICAL_DIAGNOSIS"; data: MechanicalDiagnosis }
  | { type: "GAUGE_READING"; data: GaugeReading }
  | { type: "SEAL_VERIFICATION"; data: SealVerification }
  | { type: "DVIR_INSPECTION"; data: DVIRInspection }
  | { type: "CARGO_CONDITION"; data: CargoCondition }
  | { type: "POD_VERIFICATION"; data: PODVerification }
  | { type: "FACILITY_MAPPING"; data: FacilityMapping }
  | { type: "DAMAGE_ASSESSMENT"; data: DamageAssessment }
  | { type: "ROAD_CONDITION"; data: RoadCondition }
  | { type: "GENERAL_VISUAL"; data: { summary: string; details: string[]; confidence: number } };

// ════════════════════════════════════════════════════════════════════════════
// GEMINI VISION CALL — VIGA-style multi-pass with structured JSON output
// ════════════════════════════════════════════════════════════════════════════

async function callGeminiVision(
  imageBase64: string,
  mimeType: string,
  systemPrompt: string,
  retries = VISION_MAX_RETRIES,
): Promise<string> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  // Strip data URI prefix
  let rawBase64 = imageBase64;
  let finalMime = mimeType;
  if (imageBase64.startsWith("data:")) {
    const [header, data] = imageBase64.split(",", 2);
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
            maxOutputTokens: 4096,
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

  throw new Error("callGeminiVision: exhausted retries");
}

// ════════════════════════════════════════════════════════════════════════════
// ANALYSIS PROMPTS — Domain-specific VIGA Generator+Verifier prompts
// ════════════════════════════════════════════════════════════════════════════

function getMechanicalDiagnosisPrompt(context?: Record<string, any>): string {
  const vehicleInfo = context?.vehicleMake
    ? `Vehicle: ${context.vehicleYear || ""} ${context.vehicleMake} ${context.vehicleModel || ""}. `
    : "";
  const symptomInfo = context?.symptoms?.length
    ? `Reported symptoms: ${context.symptoms.join(", ")}. `
    : "";
  const categoryInfo = context?.issueCategory
    ? `Issue category: ${context.issueCategory}. `
    : "";

  return `You are VIGA — a Vision-as-Inverse-Graphics diagnostic agent for commercial vehicle mechanics. You use iterative visual reasoning: first IDENTIFY the component, then DETECT defects by comparing against known-good state, then RECOMMEND repairs.

${vehicleInfo}${symptomInfo}${categoryInfo}

ANALYZE this photograph of a vehicle component/part. Perform multi-pass analysis:
PASS 1 (IDENTIFY): What component is shown? What make/model-specific details are visible?
PASS 2 (DETECT): What defects, wear, damage, or abnormalities are visible? Compare against known-good condition.
PASS 3 (DIAGNOSE): What is the root cause? How does this relate to reported symptoms?
PASS 4 (RECOMMEND): What repairs are needed? What parts? Can the driver continue safely?

Return JSON:
{
  "component": "specific component name",
  "componentCategory": "ENGINE|BRAKES|TRANSMISSION|ELECTRICAL|TIRES|FUEL_SYSTEM|COOLING|EXHAUST|STEERING|SUSPENSION|HVAC|OTHER",
  "condition": "GOOD|WORN|DAMAGED|CRITICAL|FAILED",
  "defects": [{"description": "what is wrong", "severity": "LOW|MEDIUM|HIGH|CRITICAL", "location": "where on the component"}],
  "repairRecommendation": "concise repair recommendation",
  "repairSteps": ["step 1", "step 2"],
  "partsNeeded": ["part name"],
  "estimatedRepairTime": "e.g. 2-3 hours",
  "safetyRisk": "NONE|LOW|MODERATE|HIGH|IMMEDIATE_DANGER",
  "canContinueDriving": true/false,
  "confidence": 0.0-1.0,
  "visualNotes": "what you see in the image that informed your diagnosis"
}`;
}

function getGaugeReadingPrompt(context?: Record<string, any>): string {
  const gaugeContext = context?.gaugeType ? `Expected gauge type: ${context.gaugeType}. ` : "";
  return `You are a precision visual OCR agent for industrial gauges and meters in petroleum/chemical transportation.

${gaugeContext}

ANALYZE this photograph of a gauge, meter, or instrument reading. Extract ALL visible readings with maximum precision.

For tank gauges: Look for innage/outage readings, temperature, BS&W (Basic Sediment & Water), API gravity.
For pressure gauges: Read PSI/bar values, identify scale markings.
For fuel gauges: Read level percentage or volume.
For temperature gauges: Read Fahrenheit/Celsius values.

Return JSON:
{
  "gaugeType": "type of gauge (tank level, pressure, temperature, fuel, etc.)",
  "reading": "primary reading as string",
  "unit": "unit of measurement",
  "numericValue": number or null,
  "normalRange": "expected normal range for this gauge type",
  "isWithinNormal": true/false,
  "additionalReadings": [{"label": "name", "value": "reading", "unit": "unit"}],
  "confidence": 0.0-1.0,
  "visualNotes": "description of gauge condition, visibility, any obstructions"
}`;
}

function getSealVerificationPrompt(context?: Record<string, any>): string {
  const bolSeal = context?.expectedSealNumber
    ? `Expected seal number from BOL: ${context.expectedSealNumber}. `
    : "";
  return `You are a security seal verification agent for commercial freight and hazmat transportation.

${bolSeal}

ANALYZE this photograph of a seal (bolt seal, cable seal, padlock seal, or barrier seal). Perform verification:
PASS 1: Read the seal number/identifier completely and accurately.
PASS 2: Assess physical condition — is it intact, broken, showing signs of tampering?
PASS 3: If expected number provided, verify match.

Look for: cut marks, re-attachment evidence, mismatched serial fonts, bent components, scratches around locking mechanism.

Return JSON:
{
  "sealNumber": "the seal number/ID read from the image",
  "sealType": "bolt|cable|padlock|barrier|other",
  "condition": "INTACT|BROKEN|TAMPERED|MISSING|UNREADABLE",
  "tamperEvidence": true/false,
  "tamperDetails": "description of tampering evidence or null",
  "matchesBOL": true/false/null (null if no expected number provided),
  "confidence": 0.0-1.0,
  "visualNotes": "what you see that supports your assessment"
}`;
}

function getDVIRPrompt(context?: Record<string, any>): string {
  const pointInfo = context?.inspectionPoint
    ? `Inspection point: ${context.inspectionPoint}. `
    : "";
  return `You are a DOT/FMCSA-compliant vehicle inspection agent performing DVIR (Driver Vehicle Inspection Report) visual verification.

${pointInfo}

ANALYZE this photograph of a vehicle inspection point. Apply FMCSA Out-of-Service criteria:
PASS 1: Identify the inspection point/component.
PASS 2: Assess condition against FMCSA standards (49 CFR 396.13).
PASS 3: Determine if defects are minor, major, or OOS (Out-of-Service).

Key OOS criteria to check: tire tread depth <2/32", brake component damage, fluid leaks, lighting failures, coupling integrity, frame cracks, steering play, exhaust leaks.

Return JSON:
{
  "inspectionPoint": "name of the inspection point",
  "condition": "PASS|MARGINAL|FAIL",
  "defectsFound": [{"description": "defect", "severity": "MINOR|MAJOR|CRITICAL_OOS", "requiresImmediate": true/false}],
  "regulatoryNotes": ["relevant FMCSA regulation notes"],
  "confidence": 0.0-1.0,
  "visualNotes": "observations from the image"
}`;
}

function getCargoConditionPrompt(context?: Record<string, any>): string {
  return `You are a cargo securement and condition assessment agent for commercial freight transportation.

ANALYZE this photograph of cargo, tank, or freight. Assess:
PASS 1: Identify cargo type and container/securement method.
PASS 2: Check for shifting, damage, leaks, spills.
PASS 3: Verify securement meets FMCSA standards (49 CFR 393).
PASS 4: Identify any hazmat placards or markings.

Return JSON:
{
  "cargoType": "description of cargo",
  "condition": "SECURE|SHIFTED|DAMAGED|LEAKING|UNKNOWN",
  "issues": [{"description": "issue", "severity": "LOW|MEDIUM|HIGH|CRITICAL", "location": "where"}],
  "securementStatus": "assessment of tie-downs, chains, straps, binders",
  "hazmatVisible": true/false,
  "placardInfo": "placard details or null",
  "confidence": 0.0-1.0,
  "visualNotes": "what you see"
}`;
}

function getPODVerificationPrompt(context?: Record<string, any>): string {
  const loadInfo = context?.loadNumber ? `Load number: ${context.loadNumber}. ` : "";
  const consignee = context?.consigneeName ? `Expected consignee: ${context.consigneeName}. ` : "";
  return `You are a Proof of Delivery verification agent for commercial logistics.

${loadInfo}${consignee}

ANALYZE this photograph taken at a delivery site. Verify:
PASS 1: Is there visible evidence of delivery completion?
PASS 2: What is the condition of the delivery site?
PASS 3: Are there any discrepancies, damages, or concerns?
PASS 4: Is a signature or timestamp visible?

Return JSON:
{
  "deliveryConfirmed": true/false,
  "siteCondition": "description of delivery site condition",
  "visibleEvidence": ["evidence supporting delivery"],
  "discrepancies": ["any issues or discrepancies noted"],
  "signatureVisible": true/false,
  "timestampEvidence": "any visible date/time or null",
  "confidence": 0.0-1.0,
  "visualNotes": "observations from the image"
}`;
}

function getFacilityMappingPrompt(context?: Record<string, any>): string {
  return `You are a facility intelligence mapping agent building a database of terminals, loading racks, and logistics facilities.

ANALYZE this photograph of a logistics facility, terminal, or loading/unloading point. Document:
PASS 1: Identify facility type and key features.
PASS 2: Map access points, lanes, equipment.
PASS 3: Identify hazards, restrictions, or special requirements.
PASS 4: Estimate capacity and note navigation guidance.

Return JSON:
{
  "facilityType": "terminal|loading_rack|tank_farm|warehouse|dock|yard|other",
  "features": ["key facility features"],
  "accessPoints": ["entry/exit descriptions"],
  "equipment": ["visible equipment (pumps, arms, scales, etc.)"],
  "hazards": ["safety hazards noted"],
  "capacity": "estimated capacity or null",
  "navigationNotes": ["tips for drivers approaching this facility"],
  "confidence": 0.0-1.0,
  "visualNotes": "observations from the image"
}`;
}

function getDamageAssessmentPrompt(context?: Record<string, any>): string {
  return `You are a vehicle/cargo damage assessment agent for insurance and claims documentation.

ANALYZE this photograph of damage to a vehicle, trailer, or cargo. Assess:
PASS 1: Identify type and extent of damage.
PASS 2: Catalog each damaged area with severity.
PASS 3: Estimate repair costs based on commercial vehicle rates.
PASS 4: Note safety implications and insurance-relevant details.

Return JSON:
{
  "damageType": "collision|structural|mechanical|weather|vandalism|cargo|other",
  "severity": "COSMETIC|MINOR|MODERATE|SEVERE|TOTAL",
  "affectedAreas": [{"area": "location", "description": "damage", "severity": "LOW|MEDIUM|HIGH|CRITICAL"}],
  "estimatedRepairCost": {"min": number, "max": number},
  "safetyImplications": ["safety concerns"],
  "evidenceNotes": ["details useful for claims"],
  "insuranceRelevant": true/false,
  "confidence": 0.0-1.0,
  "visualNotes": "what you see"
}`;
}

function getRoadConditionPrompt(context?: Record<string, any>): string {
  return `You are a road condition intelligence agent building a real-time road database for commercial truck routing.

ANALYZE this photograph of a road or route condition. Assess:
PASS 1: Identify road surface condition and any hazards.
PASS 2: Rate overall condition for commercial vehicle passage.
PASS 3: Recommend action for the driver.

Return JSON:
{
  "conditionType": "construction|pothole|flooding|ice|debris|congestion|clearance|weight_restriction|normal",
  "severity": "GOOD|FAIR|POOR|HAZARDOUS|IMPASSABLE",
  "hazards": ["specific hazards"],
  "recommendedAction": "advice for driver",
  "alternateRouteAdvised": true/false,
  "confidence": 0.0-1.0,
  "visualNotes": "what you see"
}`;
}

function getGeneralVisualPrompt(): string {
  return `ANALYZE this image and provide a detailed summary relevant to commercial trucking and logistics operations.

Return JSON:
{
  "summary": "concise summary of what the image shows",
  "details": ["specific observations relevant to trucking/logistics"],
  "confidence": 0.0-1.0
}`;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN ANALYSIS FUNCTION
// ════════════════════════════════════════════════════════════════════════════

export async function analyzeImage(
  request: VisualAnalysisRequest,
): Promise<VisualAnalysisResult> {
  const mimeType = request.mimeType || "image/jpeg";
  const { analysisType, context } = request;

  let prompt: string;
  switch (analysisType) {
    case "MECHANICAL_DIAGNOSIS":
      prompt = getMechanicalDiagnosisPrompt(context);
      break;
    case "GAUGE_READING":
      prompt = getGaugeReadingPrompt(context);
      break;
    case "SEAL_VERIFICATION":
      prompt = getSealVerificationPrompt(context);
      break;
    case "DVIR_INSPECTION":
      prompt = getDVIRPrompt(context);
      break;
    case "CARGO_CONDITION":
      prompt = getCargoConditionPrompt(context);
      break;
    case "POD_VERIFICATION":
      prompt = getPODVerificationPrompt(context);
      break;
    case "FACILITY_MAPPING":
      prompt = getFacilityMappingPrompt(context);
      break;
    case "DAMAGE_ASSESSMENT":
      prompt = getDamageAssessmentPrompt(context);
      break;
    case "ROAD_CONDITION":
      prompt = getRoadConditionPrompt(context);
      break;
    default:
      prompt = getGeneralVisualPrompt();
      break;
  }

  console.log(`[VIGA] Starting ${analysisType} analysis...`);
  const startTime = Date.now();

  const rawJson = await callGeminiVision(request.imageBase64, mimeType, prompt);

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error(`Failed to parse VIGA response as JSON: ${rawJson.slice(0, 200)}`);
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[VIGA] ${analysisType} complete in ${elapsed}ms (confidence: ${parsed.confidence || "N/A"})`);

  return { type: analysisType, data: parsed } as VisualAnalysisResult;
}

// ════════════════════════════════════════════════════════════════════════════
// MULTI-PASS ANALYSIS — VIGA iterative refinement
// ════════════════════════════════════════════════════════════════════════════

export async function analyzeImageMultiPass(
  request: VisualAnalysisRequest,
  passes: AnalysisType[],
): Promise<VisualAnalysisResult[]> {
  const results: VisualAnalysisResult[] = [];

  for (const analysisType of passes) {
    try {
      const result = await analyzeImage({ ...request, analysisType });
      results.push(result);
    } catch (err: any) {
      console.error(`[VIGA] Pass ${analysisType} failed:`, err.message);
    }
  }

  return results;
}
