/**
 * MEXICO CROSS-BORDER ENFORCEMENT ENGINE
 *
 * Production-grade enforcement for MX↔US trucking:
 * - SCT permit validation (permiso SCT)
 * - Cabotage prevention (US carriers cannot do domestic MX moves)
 * - Carta Porte CFDI complement validation
 * - IVA (16%) and retention tax calculation
 * - NOM compliance (NOM-012-SCT-2-2017 weights, NOM-068 hazmat)
 * - Mexican insurance requirement enforcement
 * - Border crossing POE management
 *
 * Regulatory references:
 * - Ley de Caminos, Puentes y Autotransporte Federal
 * - NOM-012-SCT-2-2017 (weight and dimension limits)
 * - NOM-068-SCT-2-2014 (hazmat transport)
 * - CFDI 4.0 with Carta Porte 3.1 complement (SAT)
 * - LISR Art. 106 (tax retention on transport services)
 */

// ── SCT Permit Types ──────────────────────────────────────────────────────────

export const SCT_PERMIT_TYPES = {
  CARGA_GENERAL: { code: "TPAF01", name: "Autotransporte Federal de Carga General", description: "General freight — standard trucking", maxGVW: 75500 },
  CARGA_ESPECIALIZADA: { code: "TPAF02", name: "Carga Especializada", description: "Specialized cargo (oversize, hazmat, etc.)", maxGVW: 75500 },
  CARGA_HAZMAT: { code: "TPAF03", name: "Materiales y Residuos Peligrosos", description: "Hazardous materials and dangerous waste", maxGVW: 75500 },
  AUTOTANQUE: { code: "TPAF04", name: "Autotanque", description: "Tank trucks for liquids/gases", maxGVW: 75500 },
  GRUA_INDUSTRIAL: { code: "TPAF05", name: "Grua Industrial", description: "Industrial crane operations", maxGVW: 75500 },
  FRONTERIZO: { code: "TPAF06", name: "Autotransporte Fronterizo", description: "Cross-border zone only (within 26km)", maxGVW: 75500 },
} as const;

// ── Mexican NOM Weight/Dimension Limits ───────────────────────────────────────

export const NOM_012_LIMITS = {
  maxWidth: 2.6,       // meters (8.53 ft)
  maxHeight: 4.25,     // meters (13.94 ft)
  maxLengthSingle: 14, // meters single unit
  maxLengthArticulated: 23, // meters tractor-trailer
  maxGVW: {
    twoAxle: 19500,    // kg
    threeAxle: 28000,   // kg
    fourAxle: 37500,    // kg
    fiveAxle: 47000,    // kg — ~103,617 lbs
    sixAxle: 51500,     // kg — ~113,536 lbs
    sevenAxle: 56500,   // kg — ~124,560 lbs
  },
  maxSingleAxle: 6500,  // kg
  maxTandemAxle: 17500, // kg
  maxTridemAxle: 23500, // kg
} as const;

// ── Carta Porte Required Fields ───────────────────────────────────────────────

export interface CartaPorteFields {
  /** RFC (Registro Federal de Contribuyentes) of transporter */
  rfcTransportista: string;
  /** CURP of the driver */
  curpOperador: string;
  /** SCT permit number */
  permisoSCT: string;
  /** SCT permit type code */
  tipoPermisoSCT: string;
  /** Vehicle configuration (e.g., T3S2, T3S3) */
  configVehicular: string;
  /** Vehicle license plate */
  placaVM: string;
  /** Insurance policy number (Mexican) */
  polizaSeguro: string;
  /** SAT merchandise code (clave de producto/servicio) */
  claveProdServCP: string;
  /** Origin and destination federal entities */
  origenDestinoFE: { origen: string; destino: string };
  /** Weight in kg */
  pesoKg: number;
  /** Hazmat info if applicable */
  hazmat?: {
    claseMaterial: string;
    unNumber: string;
    embalaje: string;
  };
}

export interface CartaPorteValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate Carta Porte CFDI complement fields per SAT requirements.
 */
export function validateCartaPorte(fields: Partial<CartaPorteFields>): CartaPorteValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!fields.rfcTransportista || !/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/.test(fields.rfcTransportista)) {
    errors.push("RFC del transportista inválido o faltante — required for CFDI Carta Porte 3.1");
  }
  if (!fields.curpOperador || !/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(fields.curpOperador)) {
    errors.push("CURP del operador inválido o faltante — required per SAT Carta Porte complement");
  }
  if (!fields.permisoSCT) {
    errors.push("Número de permiso SCT faltante — SCT operating permit required for MX freight");
  }
  if (!fields.tipoPermisoSCT) {
    errors.push("Tipo de permiso SCT faltante — must specify SCT permit type (TPAF01-TPAF06)");
  }
  if (!fields.configVehicular) {
    errors.push("Configuración vehicular faltante — required vehicle configuration code (e.g., T3S2)");
  }
  if (!fields.placaVM) {
    errors.push("Placa del vehículo faltante — Mexican license plate required");
  }
  if (!fields.polizaSeguro) {
    errors.push("Póliza de seguro mexicano faltante — Mexican insurance policy number required");
  }
  if (!fields.claveProdServCP) {
    errors.push("Clave de producto/servicio faltante — SAT merchandise code required for Carta Porte");
  }
  if (!fields.pesoKg || fields.pesoKg <= 0) {
    errors.push("Peso en kg inválido — cargo weight in kilograms required");
  }
  if (!fields.origenDestinoFE?.origen || !fields.origenDestinoFE?.destino) {
    errors.push("Origen/destino (entidad federativa) faltante — required for Carta Porte routing");
  }

  // Hazmat additional checks
  if (fields.hazmat) {
    if (!fields.hazmat.claseMaterial) errors.push("Clase de material peligroso faltante — NOM-068 hazmat class required");
    if (!fields.hazmat.unNumber) errors.push("Número UN faltante — UN number required for hazmat under NOM-068");
    if (!fields.hazmat.embalaje) warnings.push("Tipo de embalaje no especificado — recommended for hazmat shipments");
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── Cabotage Enforcement ──────────────────────────────────────────────────────

export interface CabotageCheck {
  allowed: boolean;
  reason?: string;
}

/**
 * Prevent cabotage violations:
 * - US-plated carriers CANNOT do domestic MX moves (only cross-border)
 * - MX-plated carriers CANNOT do domestic US moves (only cross-border)
 */
export function checkCabotage(opts: {
  carrierCountry: "US" | "MX" | "CA";
  originCountry: "US" | "MX" | "CA";
  destinationCountry: "US" | "MX" | "CA";
}): CabotageCheck {
  const { carrierCountry, originCountry, destinationCountry } = opts;

  // Domestic MX move by US carrier
  if (carrierCountry === "US" && originCountry === "MX" && destinationCountry === "MX") {
    return { allowed: false, reason: "CABOTAGE VIOLATION: US-registered carriers cannot perform domestic Mexico moves. Only cross-border transport is permitted under NAFTA/USMCA." };
  }

  // Domestic US move by MX carrier
  if (carrierCountry === "MX" && originCountry === "US" && destinationCountry === "US") {
    return { allowed: false, reason: "CABOTAGE VIOLATION: Mexico-registered carriers cannot perform domestic US moves. Only cross-border transport is permitted under NAFTA/USMCA." };
  }

  // Domestic MX move by CA carrier
  if (carrierCountry === "CA" && originCountry === "MX" && destinationCountry === "MX") {
    return { allowed: false, reason: "CABOTAGE VIOLATION: Canadian carriers cannot perform domestic Mexico moves." };
  }

  // Domestic US move by CA carrier (limited — requires US authority)
  if (carrierCountry === "CA" && originCountry === "US" && destinationCountry === "US") {
    return { allowed: false, reason: "CABOTAGE VIOLATION: Canadian carriers cannot perform domestic US moves without US operating authority." };
  }

  return { allowed: true };
}

// ── Mexican Tax Calculation ───────────────────────────────────────────────────

export interface MXTaxBreakdown {
  baseRate: number;         // Rate before taxes (USD)
  baseRateMXN: number;      // Rate in MXN
  iva: number;              // IVA (16%) in MXN
  ivaRate: number;          // 0.16
  retentionISR: number;     // ISR retention (4%) in MXN
  retentionIVA: number;     // IVA retention (4%) in MXN — for PF (persona física)
  totalMXN: number;         // Total with taxes
  totalUSD: number;         // Total converted back to USD
  exchangeRate: number;     // USD→MXN rate used
  /** Whether IEPS applies (fuel, certain chemicals) */
  iepsApplicable: boolean;
  iepsAmount: number;
}

/**
 * Calculate Mexican taxes for a cross-border freight leg.
 * IVA: 16% on transport services
 * ISR retention: 4% when paying persona física transportista
 * IVA retention: 4% when paying persona física (LISR Art. 106)
 */
export function calculateMXTaxes(opts: {
  baseRateUSD: number;
  exchangeRate?: number;
  isPersonaFisica?: boolean;
  isHazmat?: boolean;
  isFuel?: boolean;
}): MXTaxBreakdown {
  const exchangeRate = opts.exchangeRate || 17.15;
  const baseRateMXN = opts.baseRateUSD * exchangeRate;

  const ivaRate = 0.16;
  const iva = baseRateMXN * ivaRate;

  // Retention taxes (only for persona física — individual carriers)
  const retentionISR = opts.isPersonaFisica ? baseRateMXN * 0.04 : 0;
  const retentionIVA = opts.isPersonaFisica ? iva * 0.25 : 0; // 4/16 = 25% of IVA retained

  // IEPS (special production and services tax) — applies to fuel, alcohol, certain chemicals
  const iepsApplicable = !!(opts.isFuel || opts.isHazmat);
  const iepsAmount = iepsApplicable ? baseRateMXN * 0.08 : 0; // Simplified IEPS rate

  const totalMXN = baseRateMXN + iva + iepsAmount - retentionISR - retentionIVA;
  const totalUSD = totalMXN / exchangeRate;

  return {
    baseRate: opts.baseRateUSD,
    baseRateMXN: Math.round(baseRateMXN * 100) / 100,
    iva: Math.round(iva * 100) / 100,
    ivaRate,
    retentionISR: Math.round(retentionISR * 100) / 100,
    retentionIVA: Math.round(retentionIVA * 100) / 100,
    totalMXN: Math.round(totalMXN * 100) / 100,
    totalUSD: Math.round(totalUSD * 100) / 100,
    exchangeRate,
    iepsApplicable,
    iepsAmount: Math.round(iepsAmount * 100) / 100,
  };
}

// ── NOM-012 Weight/Dimension Compliance ───────────────────────────────────────

export interface NOMComplianceResult {
  compliant: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Check NOM-012-SCT-2-2017 weight and dimension compliance for Mexico.
 */
export function checkNOM012(opts: {
  widthMeters?: number;
  heightMeters?: number;
  lengthMeters?: number;
  weightKg?: number;
  axles?: number;
  isArticulated?: boolean;
}): NOMComplianceResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (opts.widthMeters && opts.widthMeters > NOM_012_LIMITS.maxWidth) {
    errors.push(`Width ${opts.widthMeters}m exceeds NOM-012 limit of ${NOM_012_LIMITS.maxWidth}m — permiso especial required`);
  }
  if (opts.heightMeters && opts.heightMeters > NOM_012_LIMITS.maxHeight) {
    errors.push(`Height ${opts.heightMeters}m exceeds NOM-012 limit of ${NOM_012_LIMITS.maxHeight}m`);
  }
  if (opts.lengthMeters) {
    const maxLen = opts.isArticulated ? NOM_012_LIMITS.maxLengthArticulated : NOM_012_LIMITS.maxLengthSingle;
    if (opts.lengthMeters > maxLen) {
      errors.push(`Length ${opts.lengthMeters}m exceeds NOM-012 limit of ${maxLen}m for ${opts.isArticulated ? 'articulated' : 'single'} vehicle`);
    }
  }
  if (opts.weightKg && opts.axles) {
    const limits = NOM_012_LIMITS.maxGVW;
    const axleKey = `${Math.min(opts.axles, 7) <= 2 ? 'two' : Math.min(opts.axles, 7) <= 3 ? 'three' : Math.min(opts.axles, 7) <= 4 ? 'four' : Math.min(opts.axles, 7) <= 5 ? 'five' : Math.min(opts.axles, 7) <= 6 ? 'six' : 'seven'}Axle` as keyof typeof limits;
    const maxWeight = limits[axleKey];
    if (opts.weightKg > maxWeight) {
      errors.push(`GVW ${opts.weightKg.toLocaleString()} kg exceeds NOM-012 limit of ${maxWeight.toLocaleString()} kg for ${opts.axles}-axle configuration`);
    }
  }

  return { compliant: errors.length === 0, errors, warnings };
}

// ── Comprehensive MX Cross-Border Pre-Dispatch Check ──────────────────────────

export interface MXPreDispatchResult {
  cleared: boolean;
  blockers: string[];
  warnings: string[];
  taxBreakdown?: MXTaxBreakdown;
  cartaPorteValid?: boolean;
  nomCompliant?: boolean;
  cabotageOk?: boolean;
  insuranceVerified?: boolean;
}

/**
 * Run all MX cross-border checks before dispatch.
 * This is the main gate for MX-bound loads.
 */
export function runMXPreDispatchChecks(opts: {
  carrierCountry: "US" | "MX" | "CA";
  originCountry: "US" | "MX" | "CA";
  destinationCountry: "US" | "MX" | "CA";
  hasSCTPermit: boolean;
  hasMexicanInsurance: boolean;
  cartaPorteFields?: Partial<CartaPorteFields>;
  weightKg?: number;
  axles?: number;
  widthMeters?: number;
  heightMeters?: number;
  baseRateUSD?: number;
  isHazmat?: boolean;
}): MXPreDispatchResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // 1. Cabotage check
  const cabotage = checkCabotage({
    carrierCountry: opts.carrierCountry,
    originCountry: opts.originCountry,
    destinationCountry: opts.destinationCountry,
  });
  if (!cabotage.allowed) {
    blockers.push(cabotage.reason!);
  }

  // 2. SCT permit (required for any movement within Mexico)
  const isMXLeg = opts.originCountry === "MX" || opts.destinationCountry === "MX";
  if (isMXLeg && !opts.hasSCTPermit) {
    blockers.push("SCT operating permit (permiso SCT) required for freight operations in Mexico — Ley de Caminos Art. 36");
  }

  // 3. Mexican insurance (US insurance NOT valid in Mexico)
  if (isMXLeg && !opts.hasMexicanInsurance) {
    blockers.push("Mexican liability insurance required — US/CA insurance policies are NOT valid in Mexico. Must have policy from CNSF-authorized insurer.");
  }

  // 4. Carta Porte validation
  let cartaPorteValid = true;
  if (isMXLeg && opts.cartaPorteFields) {
    const cpResult = validateCartaPorte(opts.cartaPorteFields);
    cartaPorteValid = cpResult.valid;
    if (!cpResult.valid) {
      blockers.push(...cpResult.errors.map(e => `Carta Porte: ${e}`));
    }
    warnings.push(...cpResult.warnings.map(w => `Carta Porte: ${w}`));
  } else if (isMXLeg) {
    warnings.push("Carta Porte CFDI complement data not provided — will be required before entering Mexico");
  }

  // 5. NOM-012 weight/dimension check
  let nomCompliant = true;
  if (isMXLeg && (opts.weightKg || opts.widthMeters || opts.heightMeters)) {
    const nomResult = checkNOM012({
      weightKg: opts.weightKg,
      axles: opts.axles,
      widthMeters: opts.widthMeters,
      heightMeters: opts.heightMeters,
      isArticulated: true,
    });
    nomCompliant = nomResult.compliant;
    if (!nomResult.compliant) {
      blockers.push(...nomResult.errors.map(e => `NOM-012: ${e}`));
    }
  }

  // 6. Tax calculation
  let taxBreakdown: MXTaxBreakdown | undefined;
  if (isMXLeg && opts.baseRateUSD) {
    taxBreakdown = calculateMXTaxes({
      baseRateUSD: opts.baseRateUSD,
      isHazmat: opts.isHazmat,
    });
  }

  // 7. Hazmat — NOM-068 requires additional permits
  if (isMXLeg && opts.isHazmat) {
    warnings.push("NOM-068-SCT-2-2014 applies: hazmat transport in Mexico requires specialized SCT permit (TPAF03) and SEMARNAT authorization");
  }

  return {
    cleared: blockers.length === 0,
    blockers,
    warnings,
    taxBreakdown,
    cartaPorteValid,
    nomCompliant,
    cabotageOk: cabotage.allowed,
    insuranceVerified: opts.hasMexicanInsurance,
  };
}

// ── Border Crossing POE Data ──────────────────────────────────────────────────

export const MAJOR_US_MX_POES = [
  { id: "laredo_world_trade", name: "World Trade Bridge", city: "Laredo", state: "TX", mxCity: "Nuevo Laredo", avgWaitMin: 45, commercial: true, fastLane: true },
  { id: "laredo_columbia", name: "Colombia-Solidarity Bridge", city: "Laredo", state: "TX", mxCity: "Nuevo Laredo", avgWaitMin: 30, commercial: true, fastLane: true },
  { id: "el_paso_ysleta", name: "Ysleta-Zaragoza Bridge", city: "El Paso", state: "TX", mxCity: "Juárez", avgWaitMin: 40, commercial: true, fastLane: true },
  { id: "el_paso_bota", name: "Bridge of the Americas", city: "El Paso", state: "TX", mxCity: "Juárez", avgWaitMin: 50, commercial: true, fastLane: false },
  { id: "pharr", name: "Pharr International Bridge", city: "Pharr", state: "TX", mxCity: "Reynosa", avgWaitMin: 55, commercial: true, fastLane: true },
  { id: "brownsville_veterans", name: "Veterans International Bridge", city: "Brownsville", state: "TX", mxCity: "Matamoros", avgWaitMin: 35, commercial: true, fastLane: true },
  { id: "eagle_pass", name: "Eagle Pass International Bridge", city: "Eagle Pass", state: "TX", mxCity: "Piedras Negras", avgWaitMin: 25, commercial: true, fastLane: false },
  { id: "nogales_mariposa", name: "Mariposa Port of Entry", city: "Nogales", state: "AZ", mxCity: "Nogales", avgWaitMin: 40, commercial: true, fastLane: true },
  { id: "otay_mesa", name: "Otay Mesa Commercial", city: "San Diego", state: "CA", mxCity: "Tijuana", avgWaitMin: 60, commercial: true, fastLane: true },
  { id: "calexico_east", name: "Calexico East", city: "Calexico", state: "CA", mxCity: "Mexicali", avgWaitMin: 35, commercial: true, fastLane: true },
] as const;
