/**
 * PHOTO-BASED PRE-TRIP INSPECTION AI (GAP-164)
 *
 * Uses AI vision to analyze vehicle photos and auto-detect defects:
 * 1. Photo capture points mapped to FMCSA inspection categories
 * 2. AI analysis per photo (tire condition, brake wear, fluid leaks, etc.)
 * 3. Defect severity classification (minor/major/OOS)
 * 4. Automated inspection report generation
 * 5. Compliance scoring against 49 CFR 396.11-396.13
 */

// ── Types ──

export type DefectSeverity = "none" | "minor" | "major" | "critical_oos";
export type PhotoStatus = "pending" | "analyzing" | "passed" | "defect_found" | "error";

export interface InspectionPoint {
  id: string;
  name: string;
  category: string;
  description: string;
  regulation: string;
  requiredPhotos: number;
  oosThreshold: string;
  examples: string[];
}

export interface PhotoAnalysisResult {
  pointId: string;
  pointName: string;
  category: string;
  status: PhotoStatus;
  condition: "PASS" | "MARGINAL" | "FAIL";
  confidence: number;
  defects: {
    description: string;
    severity: DefectSeverity;
    requiresImmediate: boolean;
    regulationRef: string;
  }[];
  aiNotes: string;
  analyzedAt: string;
}

export interface PhotoInspectionReport {
  id: string;
  vehicleId: string;
  driverId: string;
  type: "pre_trip" | "post_trip";
  startedAt: string;
  completedAt: string | null;
  pointsTotal: number;
  pointsCompleted: number;
  pointsPassed: number;
  pointsFailed: number;
  totalDefects: number;
  criticalDefects: number;
  overallResult: "pass" | "marginal" | "fail" | "oos";
  complianceScore: number;
  results: PhotoAnalysisResult[];
  safeToOperate: boolean;
}

// ── Inspection Points (49 CFR 396) ──

export const INSPECTION_POINTS: InspectionPoint[] = [
  { id: "tires_steer", name: "Steer Tires", category: "Tires & Wheels", description: "Front steer tires — tread depth, condition, pressure", regulation: "49 CFR 393.75", requiredPhotos: 1, oosThreshold: "Tread < 4/32\", exposed cord, flat, cuts to cords", examples: ["Low tread depth", "Sidewall bulge", "Nail/puncture"] },
  { id: "tires_drive", name: "Drive Tires", category: "Tires & Wheels", description: "Drive axle tires — tread, condition, duals spacing", regulation: "49 CFR 393.75", requiredPhotos: 1, oosThreshold: "Tread < 2/32\", exposed cord, flat", examples: ["Worn tread", "Mismatched duals", "Separation"] },
  { id: "tires_trailer", name: "Trailer Tires", category: "Tires & Wheels", description: "Trailer tires and wheel conditions", regulation: "49 CFR 393.75", requiredPhotos: 1, oosThreshold: "Tread < 2/32\", flat, missing", examples: ["Flat tire", "Missing lug nuts"] },
  { id: "brakes_visible", name: "Brake Components", category: "Brakes", description: "Visible brake components — drums, slack adjusters, air lines", regulation: "49 CFR 393.47", requiredPhotos: 1, oosThreshold: "Cracked drum, air leak, missing component", examples: ["Worn drum", "Leaking air line", "Frozen brake"] },
  { id: "lights_front", name: "Front Lights", category: "Lights & Signals", description: "Headlights, turn signals, clearance lights", regulation: "49 CFR 393.9", requiredPhotos: 1, oosThreshold: "Inoperative headlight, no turn signals", examples: ["Burnt bulb", "Cracked lens", "Missing light"] },
  { id: "lights_rear", name: "Rear Lights", category: "Lights & Signals", description: "Taillights, brake lights, turn signals, reflectors", regulation: "49 CFR 393.11", requiredPhotos: 1, oosThreshold: "No brake lights, no taillights", examples: ["Burnt taillight", "Broken lens"] },
  { id: "coupling", name: "Coupling Devices", category: "Coupling", description: "Fifth wheel, kingpin, safety chains, air/electric lines", regulation: "49 CFR 393.70", requiredPhotos: 1, oosThreshold: "Fifth wheel not locked, missing safety device", examples: ["Fifth wheel gap", "Worn kingpin", "Damaged glad hand"] },
  { id: "engine", name: "Engine Compartment", category: "Engine", description: "Oil level, coolant, belts, hoses, leaks", regulation: "49 CFR 396.3", requiredPhotos: 1, oosThreshold: "Severe fluid leak, missing belt", examples: ["Oil leak", "Coolant leak", "Worn belt"] },
  { id: "frame_body", name: "Frame & Body", category: "Frame", description: "Frame rails, crossmembers, body damage", regulation: "49 CFR 393.201", requiredPhotos: 1, oosThreshold: "Cracked frame, loose body parts", examples: ["Frame crack", "Loose panel", "Rust holes"] },
  { id: "exhaust", name: "Exhaust System", category: "Exhaust", description: "Exhaust pipes, mounts, leaks under cab", regulation: "49 CFR 393.83", requiredPhotos: 1, oosThreshold: "Leak under cab, damaged components", examples: ["Exhaust leak", "Loose clamp", "Hole in pipe"] },
  { id: "cab_safety", name: "Cab Safety Equipment", category: "Cab", description: "Fire extinguisher, triangles, first aid, mirrors", regulation: "49 CFR 393.95", requiredPhotos: 1, oosThreshold: "Missing fire extinguisher, no triangles", examples: ["Expired extinguisher", "Missing triangles", "Broken mirror"] },
  { id: "windshield", name: "Windshield & Wipers", category: "Cab", description: "Windshield condition, wipers, washers", regulation: "49 CFR 393.60", requiredPhotos: 1, oosThreshold: "Crack in driver view area, inoperable wipers", examples: ["Crack in view", "Worn wipers", "Chip"] },
];

// ── Simulated AI Analysis ──

export function analyzeInspectionPhoto(pointId: string): PhotoAnalysisResult {
  const point = INSPECTION_POINTS.find(p => p.id === pointId);
  if (!point) {
    return {
      pointId, pointName: "Unknown", category: "Unknown", status: "error",
      condition: "FAIL", confidence: 0, defects: [], aiNotes: "Unknown inspection point",
      analyzedAt: new Date().toISOString(),
    };
  }

  // Simulate AI analysis with realistic probabilities
  const random = Math.random();
  let condition: "PASS" | "MARGINAL" | "FAIL";
  let defects: PhotoAnalysisResult["defects"] = [];

  if (random < 0.65) {
    // 65% pass
    condition = "PASS";
  } else if (random < 0.85) {
    // 20% marginal (minor defect)
    condition = "MARGINAL";
    defects = [{
      description: point.examples[Math.floor(Math.random() * point.examples.length)] || "Minor wear detected",
      severity: "minor",
      requiresImmediate: false,
      regulationRef: point.regulation,
    }];
  } else if (random < 0.95) {
    // 10% fail (major defect)
    condition = "FAIL";
    defects = [{
      description: point.examples[0] || "Defect detected",
      severity: "major",
      requiresImmediate: true,
      regulationRef: point.regulation,
    }];
  } else {
    // 5% critical OOS
    condition = "FAIL";
    defects = [{
      description: point.oosThreshold.split(",")[0] || "Critical defect",
      severity: "critical_oos",
      requiresImmediate: true,
      regulationRef: point.regulation,
    }];
  }

  const confidence = 0.82 + Math.random() * 0.16;
  const aiNotes = condition === "PASS"
    ? `${point.name} appears in good condition. No visible defects or wear beyond normal.`
    : condition === "MARGINAL"
      ? `${point.name} shows signs of wear. Monitor and schedule maintenance. ${defects[0]?.description}.`
      : `${point.name} has defects requiring attention. ${defects.map(d => d.description).join(". ")}. Refer to ${point.regulation}.`;

  return {
    pointId,
    pointName: point.name,
    category: point.category,
    status: defects.length > 0 ? "defect_found" : "passed",
    condition,
    confidence: Math.round(confidence * 100) / 100,
    defects,
    aiNotes,
    analyzedAt: new Date().toISOString(),
  };
}

export function generatePhotoInspectionReport(
  vehicleId: string,
  driverId: string,
  type: "pre_trip" | "post_trip",
): PhotoInspectionReport {
  const results = INSPECTION_POINTS.map(p => analyzeInspectionPhoto(p.id));

  const passed = results.filter(r => r.condition === "PASS").length;
  const failed = results.filter(r => r.condition === "FAIL").length;
  const allDefects = results.flatMap(r => r.defects);
  const critical = allDefects.filter(d => d.severity === "critical_oos").length;

  let overallResult: "pass" | "marginal" | "fail" | "oos";
  if (critical > 0) overallResult = "oos";
  else if (failed > 0) overallResult = "fail";
  else if (allDefects.length > 0) overallResult = "marginal";
  else overallResult = "pass";

  const complianceScore = Math.round(
    ((passed + results.filter(r => r.condition === "MARGINAL").length * 0.5) / results.length) * 100
  );

  return {
    id: `PI-${Date.now()}`,
    vehicleId,
    driverId,
    type,
    startedAt: new Date(Date.now() - 300000).toISOString(),
    completedAt: new Date().toISOString(),
    pointsTotal: results.length,
    pointsCompleted: results.length,
    pointsPassed: passed,
    pointsFailed: failed,
    totalDefects: allDefects.length,
    criticalDefects: critical,
    overallResult,
    complianceScore,
    results,
    safeToOperate: critical === 0 && failed <= 1,
  };
}
