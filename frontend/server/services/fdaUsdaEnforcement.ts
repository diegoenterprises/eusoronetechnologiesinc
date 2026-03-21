/**
 * FDA PRIOR NOTICE + USDA APHIS HOLD SERVICE
 * MX→US Enforcement — Phase V12
 *
 * FDA Prior Notice (21 CFR Part 1, Subpart I):
 *  - Required for ALL food/feed imports into the US
 *  - Must be filed 2-8 hours before arrival (truck) via FDA PNSI system
 *  - Confirmation number issued upon acceptance
 *  - CBP won't release food shipments without confirmed PN
 *
 * USDA APHIS (7 CFR Part 319/330):
 *  - Phytosanitary inspection for plants, fruits, vegetables, wood packaging
 *  - Veterinary inspection for animal products
 *  - FSIS inspection for meat, poultry, egg products
 *  - Hold/release lifecycle at port of entry
 */

import { logger } from '../_core/logger';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type FDAPNStatus = 'draft' | 'submitted' | 'confirmed' | 'review' | 'hold' | 'refused' | 'cancelled';
export type USDAHoldStatus = 'pending_inspection' | 'inspecting' | 'sampled' | 'passed' | 'conditional_release' | 'hold' | 'refused' | 'released';
export type USDAAgency = 'APHIS' | 'FSIS' | 'AMS' | 'GIPSA';
export type InspectionType = 'phytosanitary' | 'veterinary' | 'food_safety' | 'grain_inspection' | 'fumigation' | 'lab_sample';

export interface FDAPriorNoticeInput {
  loadId?: number;
  aceManifestId?: number;
  importerName: string;
  importerFeiNumber?: string;
  importerDunsNumber?: string;
  productDescription: string;
  productCode?: string;
  productFdaCode?: string;
  countryOfOrigin: string;
  countryOfShipment: string;
  manufacturerName?: string;
  manufacturerFeiNumber?: string;
  shipperName: string;
  growerId?: string;
  quantity: number;
  quantityUnit: string;
  estimatedValueUsd?: number;
  portOfEntry: string;
  anticipatedArrival: string;
  modeOfTransport?: 'truck' | 'rail' | 'vessel' | 'air';
  consigneeName: string;
  consigneeAddress?: string;
  consigneeFeiNumber?: string;
}

export interface FDAPriorNoticeResult {
  confirmationNumber: string;
  status: FDAPNStatus;
  filingDeadline: string;
  isLate: boolean;
  validation: { valid: boolean; errors: string[]; warnings: string[] };
}

export interface USDAHoldInput {
  loadId?: number;
  aceManifestId?: number;
  fdaPriorNoticeId?: number;
  agency: USDAAgency;
  inspectionType: InspectionType;
  commodityDescription: string;
  commodityHtsCode?: string;
  countryOfOrigin: string;
  quantity?: number;
  quantityUnit?: string;
  portOfEntry: string;
  inspectionFacility?: string;
}

export interface USDAHoldResult {
  holdNumber: string;
  status: USDAHoldStatus;
  estimatedInspectionHours: number;
  requiredDocuments: string[];
  fees: { inspectionFee: number; storageFeePerDay: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FDA PRODUCT CODES (common food categories per 21 CFR)
// ═══════════════════════════════════════════════════════════════════════════════

export const FDA_PRODUCT_CODES: Record<string, { name: string; fdaCode: string; requiresPN: boolean; highRisk: boolean }> = {
  '01': { name: 'Dairy Products & Substitutes', fdaCode: '01', requiresPN: true, highRisk: true },
  '02': { name: 'Eggs & Egg Products', fdaCode: '02', requiresPN: true, highRisk: true },
  '03': { name: 'Fishery/Seafood Products', fdaCode: '03', requiresPN: true, highRisk: true },
  '04': { name: 'Fruits & Fruit Products', fdaCode: '04', requiresPN: true, highRisk: false },
  '05': { name: 'Vegetables & Vegetable Products', fdaCode: '05', requiresPN: true, highRisk: false },
  '07': { name: 'Cereal/Flour/Starch Products', fdaCode: '07', requiresPN: true, highRisk: false },
  '09': { name: 'Nuts & Edible Seeds', fdaCode: '09', requiresPN: true, highRisk: false },
  '10': { name: 'Spices/Flavors/Salts', fdaCode: '10', requiresPN: true, highRisk: false },
  '12': { name: 'Beverages', fdaCode: '12', requiresPN: true, highRisk: false },
  '13': { name: 'Sweeteners & Confectionery', fdaCode: '13', requiresPN: true, highRisk: false },
  '15': { name: 'Meat/Poultry (FDA-regulated)', fdaCode: '15', requiresPN: true, highRisk: true },
  '16': { name: 'Whole Grains/Seeds/Herbs', fdaCode: '16', requiresPN: true, highRisk: false },
  '17': { name: 'Fats/Oils', fdaCode: '17', requiresPN: true, highRisk: false },
  '20': { name: 'Animal Feed', fdaCode: '20', requiresPN: true, highRisk: false },
  '21': { name: 'Color Additives', fdaCode: '21', requiresPN: true, highRisk: true },
  '22': { name: 'Food Additives', fdaCode: '22', requiresPN: true, highRisk: true },
  '23': { name: 'Dietary Supplements', fdaCode: '23', requiresPN: true, highRisk: true },
  '25': { name: 'Infant Formula', fdaCode: '25', requiresPN: true, highRisk: true },
  '33': { name: 'Cosmetics', fdaCode: '33', requiresPN: false, highRisk: false },
  '34': { name: 'Drugs (human)', fdaCode: '34', requiresPN: false, highRisk: true },
  '40': { name: 'Medical Devices', fdaCode: '40', requiresPN: false, highRisk: true },
};

// ═══════════════════════════════════════════════════════════════════════════════
// USDA INSPECTION REQUIREMENTS BY COMMODITY TYPE
// ═══════════════════════════════════════════════════════════════════════════════

export const USDA_INSPECTION_MATRIX: Record<string, {
  agency: USDAAgency;
  inspectionType: InspectionType;
  requiredDocs: string[];
  estimatedHours: number;
  inspectionFee: number;
  storageFeePerDay: number;
  notes: string;
}> = {
  'fresh_produce': {
    agency: 'APHIS',
    inspectionType: 'phytosanitary',
    requiredDocs: ['Phytosanitary certificate from origin country', 'APHIS PPQ 587 import permit', 'Fumigation certificate (if applicable)', 'ISPM-15 stamp on wood packaging'],
    estimatedHours: 4,
    inspectionFee: 56,
    storageFeePerDay: 150,
    notes: 'APHIS may require cold treatment for certain fruits from MX. Pest-free area cert may accelerate.',
  },
  'fresh_meat': {
    agency: 'FSIS',
    inspectionType: 'food_safety',
    requiredDocs: ['FSIS import inspection application (9540-1)', 'Foreign government health certificate', 'FSIS import permit', 'USDA FSIS-approved establishment certificate'],
    estimatedHours: 6,
    inspectionFee: 128,
    storageFeePerDay: 250,
    notes: 'All fresh/frozen meat must be from FSIS-approved foreign establishments. Re-inspection at border mandatory.',
  },
  'poultry': {
    agency: 'FSIS',
    inspectionType: 'food_safety',
    requiredDocs: ['FSIS import inspection application', 'Official health certificate', 'FSIS-approved establishment number', 'Newcastle disease free certification'],
    estimatedHours: 6,
    inspectionFee: 128,
    storageFeePerDay: 250,
    notes: 'Mexican poultry facilities must be FSIS-approved. Newcastle disease testing may add 24-48 hrs.',
  },
  'grain_bulk': {
    agency: 'GIPSA',
    inspectionType: 'grain_inspection',
    requiredDocs: ['Official grain inspection certificate', 'Phytosanitary certificate', 'Weight certificate', 'Quality analysis report'],
    estimatedHours: 8,
    inspectionFee: 85,
    storageFeePerDay: 100,
    notes: 'GIPSA inspection for grade/quality. Fumigation required for stored-product pests.',
  },
  'live_plants': {
    agency: 'APHIS',
    inspectionType: 'phytosanitary',
    requiredDocs: ['APHIS PPQ 587 import permit', 'Phytosanitary certificate from SENASICA', 'Pest risk documentation', 'Growing medium certification (soil-free)'],
    estimatedHours: 24,
    inspectionFee: 75,
    storageFeePerDay: 200,
    notes: 'All live plants require APHIS import permit. Soil prohibited. Post-entry quarantine may apply.',
  },
  'live_animals': {
    agency: 'APHIS',
    inspectionType: 'veterinary',
    requiredDocs: ['APHIS VS 17-29 import permit', 'Official health certificate from SENASICA', 'TB/Brucellosis test results', 'Brand inspection (cattle)'],
    estimatedHours: 12,
    inspectionFee: 100,
    storageFeePerDay: 300,
    notes: 'Veterinary inspection at designated border stations. TB/Brucellosis testing within 60 days of import.',
  },
  'wood_packaging': {
    agency: 'APHIS',
    inspectionType: 'fumigation',
    requiredDocs: ['ISPM-15 compliance stamp on all wood packaging', 'Heat treatment certificate (56°C/30min)', 'Methyl bromide fumigation cert (if applicable)'],
    estimatedHours: 2,
    inspectionFee: 0,
    storageFeePerDay: 0,
    notes: 'ISPM-15 stamp on wood pallets/crates is mandatory. Non-compliant wood packaging = hold + fumigation.',
  },
  'dairy': {
    agency: 'APHIS',
    inspectionType: 'food_safety',
    requiredDocs: ['APHIS VS 16-3 import permit (for cheese)', 'FDA Prior Notice confirmation', 'Certificate of origin', 'Pasteurization certificate'],
    estimatedHours: 4,
    inspectionFee: 56,
    storageFeePerDay: 200,
    notes: 'Mexican dairy must meet APHIS/FDA dual requirements. Pasteurization mandatory for most products.',
  },
  'avocados': {
    agency: 'APHIS',
    inspectionType: 'phytosanitary',
    requiredDocs: ['APHIS Systems Approach certification (7 CFR 319.56-30)', 'SENASICA phytosanitary certificate', 'Packinghouse certification from approved list', 'Pest survey records from growing area'],
    estimatedHours: 3,
    inspectionFee: 56,
    storageFeePerDay: 150,
    notes: 'Mexican Hass avocados allowed from approved municipalities in Michoacán under Systems Approach. APHIS inspection at port.',
  },
  'tomatoes': {
    agency: 'APHIS',
    inspectionType: 'phytosanitary',
    requiredDocs: ['Phytosanitary certificate from SENASICA', 'AMS inspection (if for federal marketing order)', 'Grade/quality certificate', 'Pest-free certification'],
    estimatedHours: 3,
    inspectionFee: 56,
    storageFeePerDay: 150,
    notes: 'Tomatoes from MX subject to antidumping duties. AMS inspection for marketing order compliance.',
  },
  'berries': {
    agency: 'APHIS',
    inspectionType: 'phytosanitary',
    requiredDocs: ['Phytosanitary certificate from SENASICA', 'Cold treatment certificate (if applicable)', 'Systems Approach compliance docs', 'FDA Prior Notice confirmation'],
    estimatedHours: 4,
    inspectionFee: 56,
    storageFeePerDay: 200,
    notes: 'Berries may require cold treatment or systems approach. High perishability — expedited lanes at Nogales.',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// FILING DEADLINE CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * FDA Prior Notice filing deadlines per 21 CFR 1.279:
 *  - Truck: no less than 2 hours before arrival
 *  - Rail: no less than 4 hours before arrival
 *  - Air: no less than 4 hours before arrival (or by time of departure if < 4 hrs flight)
 *  - Vessel: no less than 8 hours before arrival
 *  - Maximum advance: 15 days before arrival
 */
export function calculateFDAFilingDeadline(anticipatedArrival: string, mode: 'truck' | 'rail' | 'vessel' | 'air'): {
  deadline: Date;
  hoursBeforeArrival: number;
  maxAdvanceDate: Date;
  isWithinWindow: boolean;
} {
  const arrival = new Date(anticipatedArrival);
  const hoursMap: Record<string, number> = { truck: 2, rail: 4, air: 4, vessel: 8 };
  const hours = hoursMap[mode] || 2;
  const deadline = new Date(arrival.getTime() - hours * 3600_000);
  const maxAdvance = new Date(arrival.getTime() - 15 * 86400_000);
  const now = new Date();
  const isWithinWindow = now >= maxAdvance && now <= deadline;

  return { deadline, hoursBeforeArrival: hours, maxAdvanceDate: maxAdvance, isWithinWindow };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FDA PRIOR NOTICE — CREATION + VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateConfirmationNumber(): string {
  const prefix = 'PN';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

function generateHoldNumber(): string {
  const prefix = 'USDA';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export function validateFDAPriorNotice(input: FDAPriorNoticeInput): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!input.importerName?.trim()) errors.push('Importer name is required');
  if (!input.productDescription?.trim()) errors.push('Product description is required');
  if (!input.countryOfOrigin?.trim()) errors.push('Country of origin is required');
  if (!input.countryOfShipment?.trim()) errors.push('Country of shipment is required');
  if (!input.shipperName?.trim()) errors.push('Shipper name is required');
  if (!input.quantity || input.quantity <= 0) errors.push('Quantity must be > 0');
  if (!input.quantityUnit?.trim()) errors.push('Quantity unit is required');
  if (!input.portOfEntry?.trim()) errors.push('Port of entry is required');
  if (!input.anticipatedArrival) errors.push('Anticipated arrival date/time is required');
  if (!input.consigneeName?.trim()) errors.push('US consignee name is required');

  // FEI number format (FDA Establishment Identifier: 10 digits)
  if (input.importerFeiNumber && !/^\d{7,10}$/.test(input.importerFeiNumber)) {
    warnings.push('FEI number should be 7-10 digits');
  }

  // Filing deadline check
  if (input.anticipatedArrival) {
    const mode = input.modeOfTransport || 'truck';
    const { deadline, isWithinWindow } = calculateFDAFilingDeadline(input.anticipatedArrival, mode);
    const now = new Date();

    if (now > deadline) {
      errors.push(`Filing deadline has passed. For ${mode}, PN must be submitted at least ${mode === 'truck' ? '2' : mode === 'vessel' ? '8' : '4'} hours before arrival.`);
    } else if (!isWithinWindow) {
      const arrival = new Date(input.anticipatedArrival);
      const maxAdvance = new Date(arrival.getTime() - 15 * 86400_000);
      if (now < maxAdvance) {
        warnings.push('Prior Notice cannot be filed more than 15 days before anticipated arrival.');
      }
    }
  }

  // Country-specific checks for MX origin
  if (input.countryOfOrigin === 'MX') {
    if (!input.manufacturerName) {
      warnings.push('Manufacturer/grower name recommended for Mexican food imports.');
    }
    warnings.push('Mexican food imports may require SENASICA phytosanitary certificate.');
  }

  // High-risk product check
  if (input.productFdaCode) {
    const productInfo = FDA_PRODUCT_CODES[input.productFdaCode];
    if (productInfo?.highRisk) {
      warnings.push(`Product category "${productInfo.name}" is high-risk — expect enhanced screening.`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function createFDAPriorNotice(input: FDAPriorNoticeInput): FDAPriorNoticeResult {
  const mode = input.modeOfTransport || 'truck';
  const { deadline, isWithinWindow } = calculateFDAFilingDeadline(input.anticipatedArrival, mode);
  const now = new Date();
  const isLate = now > deadline;
  const validation = validateFDAPriorNotice(input);
  const confirmationNumber = generateConfirmationNumber();

  logger.info(`[FDA-PN] Created ${confirmationNumber} for ${input.productDescription} from ${input.countryOfOrigin}, port=${input.portOfEntry}, late=${isLate}`);

  return {
    confirmationNumber,
    status: validation.valid ? 'submitted' : 'draft',
    filingDeadline: deadline.toISOString(),
    isLate,
    validation,
  };
}

/**
 * Generate FDA PNSI (Prior Notice System Interface) payload
 * Format matches FDA's XML submission schema
 */
export function generateFDAPNPayload(input: FDAPriorNoticeInput, confirmationNumber: string): object {
  return {
    header: {
      messageType: 'FDA_PRIOR_NOTICE',
      version: '8.0',
      timestamp: new Date().toISOString(),
      confirmationNumber,
    },
    submitter: {
      type: 'IMPORTER',
      name: input.importerName,
      feiNumber: input.importerFeiNumber,
      dunsNumber: input.importerDunsNumber,
    },
    article: {
      productDescription: input.productDescription,
      productCode: input.productCode,
      fdaProductCode: input.productFdaCode,
      countryOfOrigin: input.countryOfOrigin,
      countryOfShipment: input.countryOfShipment,
      manufacturer: {
        name: input.manufacturerName,
        feiNumber: input.manufacturerFeiNumber,
      },
      shipper: {
        name: input.shipperName,
      },
      grower: input.growerId ? { id: input.growerId } : undefined,
      quantity: {
        amount: input.quantity,
        unit: input.quantityUnit,
      },
      estimatedValue: input.estimatedValueUsd,
    },
    routing: {
      portOfArrival: input.portOfEntry,
      anticipatedArrivalDateTime: input.anticipatedArrival,
      modeOfTransportation: (input.modeOfTransport || 'truck').toUpperCase(),
    },
    consignee: {
      name: input.consigneeName,
      address: input.consigneeAddress,
      feiNumber: input.consigneeFeiNumber,
      country: 'US',
    },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// USDA APHIS — HOLD CREATION + INSPECTION TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

export function determineUSDARequirements(commodityType: string, countryOfOrigin: string): {
  required: boolean;
  agency: USDAAgency;
  inspectionType: InspectionType;
  documents: string[];
  estimatedHours: number;
  fees: { inspectionFee: number; storageFeePerDay: number };
  notes: string;
} | null {
  const matrix = USDA_INSPECTION_MATRIX[commodityType];
  if (!matrix) {
    return null;
  }

  // MX-origin commodities get extra scrutiny
  const extraDocs: string[] = [];
  if (countryOfOrigin === 'MX') {
    extraDocs.push('SENASICA export certificate');
    if (commodityType === 'fresh_produce' || commodityType === 'avocados' || commodityType === 'tomatoes' || commodityType === 'berries') {
      extraDocs.push('SENASICA phytosanitary certificate');
    }
    if (commodityType === 'live_animals') {
      extraDocs.push('SENASICA zoosanitary certificate');
    }
  }

  return {
    required: true,
    agency: matrix.agency,
    inspectionType: matrix.inspectionType,
    documents: [...matrix.requiredDocs, ...extraDocs],
    estimatedHours: matrix.estimatedHours,
    fees: { inspectionFee: matrix.inspectionFee, storageFeePerDay: matrix.storageFeePerDay },
    notes: matrix.notes,
  };
}

export function createUSDAHold(input: USDAHoldInput): USDAHoldResult {
  const holdNumber = generateHoldNumber();
  const matrix = USDA_INSPECTION_MATRIX[input.inspectionType] || USDA_INSPECTION_MATRIX['fresh_produce']!;
  const requiredDocuments = determineUSDARequirements(
    input.inspectionType === 'phytosanitary' ? 'fresh_produce' : input.inspectionType === 'food_safety' ? 'fresh_meat' : 'grain_bulk',
    input.countryOfOrigin,
  )?.documents || matrix.requiredDocs;

  logger.info(`[USDA] Hold ${holdNumber} created: ${input.agency} ${input.inspectionType} for ${input.commodityDescription} from ${input.countryOfOrigin}, port=${input.portOfEntry}`);

  return {
    holdNumber,
    status: 'pending_inspection',
    estimatedInspectionHours: matrix.estimatedHours,
    requiredDocuments,
    fees: { inspectionFee: matrix.inspectionFee, storageFeePerDay: matrix.storageFeePerDay },
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// ACE MANIFEST SUBMISSION SIMULATION
// ═══════════════════════════════════════════════════════════════════════════════

export type ACESubmissionResult = {
  success: boolean;
  status: 'accepted' | 'hold' | 'refused' | 'do_not_load';
  disposition: string;
  message: string;
  respondedAt: string;
};

/**
 * Simulate ACE manifest submission to CBP.
 * In production, this would submit via CBP's ACE Web Services (AWS/MQ).
 * Returns simulated CBP response based on manifest data.
 */
export function simulateACESubmission(manifest: {
  tripNumber: string;
  scacCode: string;
  portOfEntry: string;
  estimatedArrival: string;
  driverCitizenship: string;
  fastCardNumber?: string | null;
  shipments: any[];
  bondNumber?: string | null;
}): ACESubmissionResult {
  const now = new Date().toISOString();

  // Validate bond for commercial shipments
  const totalValue = manifest.shipments.reduce((sum: number, s: any) => {
    return sum + (typeof s.value === 'number' ? s.value : 0);
  }, 0);

  if (totalValue > 2500 && !manifest.bondNumber) {
    return {
      success: false,
      status: 'refused',
      disposition: 'BOND_REQUIRED',
      message: 'Customs bond required for commercial shipments over $2,500 USD. File CBP Form 301.',
      respondedAt: now,
    };
  }

  // Check for hazmat without proper flagging
  const hasHazmat = manifest.shipments.some((s: any) =>
    s.commodities?.some((c: any) => c.hazmat === true && !c.unNumber)
  );
  if (hasHazmat) {
    return {
      success: false,
      status: 'hold',
      disposition: 'HAZMAT_INCOMPLETE',
      message: 'Hazmat commodity missing UN number. Complete hazmat data per 49 CFR 172.200 before re-submitting.',
      respondedAt: now,
    };
  }

  // Check arrival timing
  const eta = new Date(manifest.estimatedArrival);
  const minFiling = new Date(eta.getTime() - 60 * 60_000);
  if (new Date() > minFiling) {
    return {
      success: false,
      status: 'refused',
      disposition: 'LATE_FILING',
      message: 'ACE eManifest must be filed at least 1 hour before estimated arrival per 19 CFR 123.92.',
      respondedAt: now,
    };
  }

  // FAST card check
  const hasFast = !!manifest.fastCardNumber;
  const disposition = hasFast ? 'FAST_RELEASE' : 'STANDARD_RELEASE';
  const message = hasFast
    ? `Trip ${manifest.tripNumber} accepted. FAST processing authorized. Present at FAST lane.`
    : `Trip ${manifest.tripNumber} accepted. Standard processing. May be subject to random inspection.`;

  logger.info(`[ACE] Submission for trip ${manifest.tripNumber}: ACCEPTED (${disposition})`);

  return {
    success: true,
    status: 'accepted',
    disposition,
    message,
    respondedAt: now,
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// MX→US ENFORCEMENT CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════════

export interface EnforcementCheck {
  requirement: string;
  authority: string;
  cfr: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  detail: string;
}

/**
 * Comprehensive MX→US enforcement compliance check for a load.
 * Evaluates all CBP, FDA, USDA, FMCSA requirements.
 */
export function checkMXtoUSCompliance(params: {
  hasACEManifest: boolean;
  aceStatus?: string;
  hasFDAPriorNotice: boolean;
  fdaStatus?: string;
  isFood: boolean;
  isAgricultural: boolean;
  isLiveAnimal: boolean;
  hasPhytoCert: boolean;
  hasVetCert: boolean;
  hasCustomsBond: boolean;
  hasFAST: boolean;
  hasISPM15: boolean;
  hasCartaPorte: boolean;
  hasPedimento: boolean;
  totalValueUsd: number;
  driverHasTWIC: boolean;
  driverHasVisa: boolean;
}): { compliant: boolean; score: number; checks: EnforcementCheck[] } {
  const checks: EnforcementCheck[] = [];

  // 1. ACE eManifest
  checks.push({
    requirement: 'ACE eManifest',
    authority: 'CBP',
    cfr: '19 CFR 123.92',
    status: params.hasACEManifest
      ? (params.aceStatus === 'accepted' ? 'pass' : params.aceStatus === 'submitted' ? 'pending' : 'warning')
      : 'fail',
    detail: params.hasACEManifest
      ? `ACE manifest status: ${params.aceStatus}`
      : 'ACE eManifest required for all truck crossings from Mexico.',
  });

  // 2. FDA Prior Notice (if food)
  if (params.isFood) {
    checks.push({
      requirement: 'FDA Prior Notice',
      authority: 'FDA',
      cfr: '21 CFR 1.279',
      status: params.hasFDAPriorNotice
        ? (params.fdaStatus === 'confirmed' ? 'pass' : params.fdaStatus === 'submitted' ? 'pending' : 'warning')
        : 'fail',
      detail: params.hasFDAPriorNotice
        ? `FDA PN status: ${params.fdaStatus}`
        : 'FDA Prior Notice required for all food/feed imports. File 2+ hours before arrival (truck).',
    });
  }

  // 3. USDA Phytosanitary (if agricultural)
  if (params.isAgricultural) {
    checks.push({
      requirement: 'Phytosanitary Certificate',
      authority: 'USDA APHIS',
      cfr: '7 CFR 319',
      status: params.hasPhytoCert ? 'pass' : 'fail',
      detail: params.hasPhytoCert
        ? 'Phytosanitary certificate on file.'
        : 'SENASICA phytosanitary certificate required for plant/produce imports from Mexico.',
    });
  }

  // 4. USDA Veterinary (if live animals)
  if (params.isLiveAnimal) {
    checks.push({
      requirement: 'Veterinary Health Certificate',
      authority: 'USDA APHIS VS',
      cfr: '9 CFR 93',
      status: params.hasVetCert ? 'pass' : 'fail',
      detail: params.hasVetCert
        ? 'Veterinary certificate on file.'
        : 'SENASICA zoosanitary health certificate required for live animal imports.',
    });
  }

  // 5. Customs Bond
  checks.push({
    requirement: 'Customs Bond',
    authority: 'CBP',
    cfr: '19 CFR 113',
    status: params.hasCustomsBond || params.totalValueUsd <= 2500 ? 'pass' : 'fail',
    detail: params.hasCustomsBond
      ? 'Customs bond on file.'
      : params.totalValueUsd <= 2500
        ? 'Informal entry — no bond required under $2,500.'
        : 'CBP Form 301 customs bond required for commercial entries over $2,500 USD.',
  });

  // 6. ISPM-15 wood packaging
  checks.push({
    requirement: 'ISPM-15 Wood Packaging',
    authority: 'USDA APHIS',
    cfr: '7 CFR 319.40',
    status: params.hasISPM15 ? 'pass' : 'warning',
    detail: params.hasISPM15
      ? 'ISPM-15 compliance confirmed (heat-treated wood packaging).'
      : 'Ensure all wood packaging/pallets have ISPM-15 stamp. Non-compliant wood will be held for fumigation.',
  });

  // 7. Mexican Carta Porte
  checks.push({
    requirement: 'Carta Porte CFDI',
    authority: 'SAT Mexico',
    cfr: 'CFF Art. 29-A',
    status: params.hasCartaPorte ? 'pass' : 'fail',
    detail: params.hasCartaPorte
      ? 'Carta Porte CFDI 4.0 complement on file.'
      : 'Carta Porte CFDI mandatory for all freight movement in Mexico. Required to exit MX.',
  });

  // 8. Pedimento (Mexican customs declaration)
  checks.push({
    requirement: 'Pedimento Aduanal',
    authority: 'SAT/Aduana Mexico',
    cfr: 'Ley Aduanera Art. 36',
    status: params.hasPedimento ? 'pass' : 'fail',
    detail: params.hasPedimento
      ? 'Pedimento filed through Agente Aduanal.'
      : 'Mexican customs export declaration (Pedimento) required. Must be filed by licensed Agente Aduanal.',
  });

  // 9. FAST card (optional but recommended)
  checks.push({
    requirement: 'FAST Card',
    authority: 'CBP',
    cfr: '19 CFR 123',
    status: params.hasFAST ? 'pass' : 'warning',
    detail: params.hasFAST
      ? 'FAST card — expedited processing authorized.'
      : 'FAST card recommended for expedited border crossing. Driver may use standard lane.',
  });

  // 10. Driver entry documentation
  checks.push({
    requirement: 'Driver Entry Authorization',
    authority: 'CBP/DOS',
    cfr: '8 CFR 212/214',
    status: params.driverHasVisa ? 'pass' : 'fail',
    detail: params.driverHasVisa
      ? 'Driver has valid B1/B2 visa or border crossing card.'
      : 'Mexican driver requires valid B1 visa, BCC, or SENTRI/Global Entry to enter US.',
  });

  // Score
  const total = checks.length;
  const passed = checks.filter(c => c.status === 'pass').length;
  const pending = checks.filter(c => c.status === 'pending').length;
  const score = Math.round(((passed + pending * 0.5) / total) * 100);
  const compliant = checks.every(c => c.status !== 'fail');

  logger.info(`[MX→US] Compliance check: ${passed}/${total} pass, score=${score}, compliant=${compliant}`);

  return { compliant, score, checks };
}
