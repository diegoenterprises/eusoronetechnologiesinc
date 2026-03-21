/**
 * MEXICAN INSURANCE VALIDATION SERVICE
 * Phase 1 - Cross-Border Audit P0 Blocker #4
 *
 * Validates that carriers operating in Mexico have insurance from
 * SAT-authorized insurers and meet NOM-087 / SCT requirements.
 *
 * Requirements:
 *  - Seguro de Responsabilidad Civil (liability insurance) - MANDATORY
 *  - Seguro de Carga (cargo insurance) - MANDATORY for third-party carriers
 *  - Seguro Ambiental (environmental liability) - MANDATORY for hazmat
 *  - Insurer must be registered with CNSF (Comision Nacional de Seguros y Fianzas)
 *  - Policy must cover the specific vehicle configuration and route
 *  - Minimum coverage amounts set by SCT regulations
 */

import { logger } from '../_core/logger';

// -- Types --

export type MexicanInsuranceType =
  | 'responsabilidad_civil'     // third-party liability
  | 'danos_al_medio_ambiente'   // environmental liability (hazmat)
  | 'carga'                     // cargo insurance
  | 'ocupantes'                 // occupant/driver insurance
  | 'danos_materiales';         // vehicle damage (physical damage)

export type InsuranceValidationStatus = 'valid' | 'expired' | 'insufficient_coverage' | 'unauthorized_insurer' | 'missing';

export interface MexicanInsurancePolicy {
  id: string;
  tipoSeguro: MexicanInsuranceType;
  aseguradora: string;             // insurance company name
  claveAseguradora: string;        // CNSF registration code
  numeroPoliza: string;            // policy number
  vigenciaInicio: string;          // ISO start date
  vigenciaFin: string;             // ISO end date
  sumaAsegurada: number;           // coverage amount in MXN
  moneda: 'MXN' | 'USD';
  coberturaGeografica: 'nacional' | 'fronteriza' | 'internacional';
  vehiculosAmparados: string[];    // covered vehicle plates
  conductoresAmparados?: string[]; // covered driver names/licenses
  hazmatCubierto: boolean;
  deducible: number;               // deductible amount
}

export interface InsuranceRequirement {
  tipo: MexicanInsuranceType;
  nombre: string;
  obligatorio: boolean;
  montoMinimoMXN: number;
  fundamento: string;              // legal basis
  aplica: string;                  // who it applies to
}

export interface InsuranceValidationResult {
  overallStatus: 'compliant' | 'non_compliant' | 'partial';
  requirements: Array<{
    requirement: InsuranceRequirement;
    policy: MexicanInsurancePolicy | null;
    status: InsuranceValidationStatus;
    message: string;
  }>;
  missingPolicies: MexicanInsuranceType[];
  expiringWithin30Days: MexicanInsurancePolicy[];
  warnings: string[];
}


// -- SAT/CNSF Authorized Insurers --
// These are the major insurance companies authorized by CNSF to
// issue freight transport insurance in Mexico.

export const AUTHORIZED_INSURERS: Array<{
  clave: string;
  nombre: string;
  nombreCorto: string;
  activo: boolean;
}> = [
  { clave: 'QUAL', nombre: 'Qualitas Compania de Seguros', nombreCorto: 'Qualitas', activo: true },
  { clave: 'GNPS', nombre: 'GNP Seguros', nombreCorto: 'GNP', activo: true },
  { clave: 'AXAS', nombre: 'AXA Seguros', nombreCorto: 'AXA', activo: true },
  { clave: 'MXRE', nombre: 'Mapfre Mexico', nombreCorto: 'Mapfre', activo: true },
  { clave: 'ZURI', nombre: 'Zurich Seguros Mexico', nombreCorto: 'Zurich', activo: true },
  { clave: 'HDIS', nombre: 'HDI Seguros', nombreCorto: 'HDI', activo: true },
  { clave: 'CHUBB', nombre: 'Chubb Seguros Mexico', nombreCorto: 'Chubb', activo: true },
  { clave: 'ATLS', nombre: 'Atlas Seguros', nombreCorto: 'Atlas', activo: true },
  { clave: 'PRIM', nombre: 'Primero Seguros', nombreCorto: 'Primero', activo: true },
  { clave: 'BNRT', nombre: 'Banorte Seguros', nombreCorto: 'Banorte', activo: true },
  { clave: 'INTL', nombre: 'Seguros Inbursa', nombreCorto: 'Inbursa', activo: true },
  { clave: 'AFIR', nombre: 'Afirme Seguros', nombreCorto: 'Afirme', activo: true },
  { clave: 'TOKM', nombre: 'Tokio Marine Mexico', nombreCorto: 'Tokio Marine', activo: true },
  { clave: 'ALLI', nombre: 'Allianz Mexico', nombreCorto: 'Allianz', activo: true },
  { clave: 'GNRL', nombre: 'General de Seguros', nombreCorto: 'General', activo: true },
  { clave: 'PROT', nombre: 'Proteccion Patrimonial Familiar', nombreCorto: 'PPF', activo: true },
];

export function isAuthorizedInsurer(claveOrNombre: string): boolean {
  const search = claveOrNombre.toUpperCase().trim();
  return AUTHORIZED_INSURERS.some(i =>
    i.activo && (
      i.clave === search ||
      i.nombre.toUpperCase().includes(search) ||
      i.nombreCorto.toUpperCase() === search
    )
  );
}


// -- Insurance Requirements by Operation Type --

export const INSURANCE_REQUIREMENTS: InsuranceRequirement[] = [
  {
    tipo: 'responsabilidad_civil',
    nombre: 'Seguro de Responsabilidad Civil',
    obligatorio: true,
    montoMinimoMXN: 3_500_000,
    fundamento: 'Art. 83 LGVFSP + Art. 118-119 RLSPAF',
    aplica: 'Todos los vehiculos de autotransporte federal',
  },
  {
    tipo: 'carga',
    nombre: 'Seguro de Carga',
    obligatorio: true,
    montoMinimoMXN: 1_000_000,
    fundamento: 'Art. 84 LGVFSP',
    aplica: 'Servicio publico de autotransporte de carga',
  },
  {
    tipo: 'danos_al_medio_ambiente',
    nombre: 'Seguro Ambiental (Materiales Peligrosos)',
    obligatorio: true,
    montoMinimoMXN: 10_000_000,
    fundamento: 'Art. 85 LGVFSP + NOM-002-SCT/2011',
    aplica: 'Transporte de materiales y residuos peligrosos',
  },
  {
    tipo: 'ocupantes',
    nombre: 'Seguro de Viajero/Ocupantes',
    obligatorio: true,
    montoMinimoMXN: 500_000,
    fundamento: 'Art. 82 LGVFSP',
    aplica: 'Todos los vehiculos de autotransporte federal',
  },
  {
    tipo: 'danos_materiales',
    nombre: 'Seguro de Danos Materiales (Vehiculo)',
    obligatorio: false,
    montoMinimoMXN: 0,
    fundamento: 'Recomendado por SCT',
    aplica: 'Opcional - recomendado para flotas',
  },
];

export function getRequiredInsurance(params: {
  isHazmat: boolean;
  isPublicService: boolean;  // servicio publico vs privado
}): InsuranceRequirement[] {
  return INSURANCE_REQUIREMENTS.filter(req => {
    if (!req.obligatorio) return false;
    if (req.tipo === 'danos_al_medio_ambiente' && !params.isHazmat) return false;
    if (req.tipo === 'carga' && !params.isPublicService) return false;
    return true;
  });
}


// -- Validation Engine --

export function validateMexicanInsurance(
  policies: MexicanInsurancePolicy[],
  params: {
    isHazmat: boolean;
    isPublicService: boolean;
    vehiclePlate: string;
    operationDate?: string;
  },
): InsuranceValidationResult {
  const requirements = getRequiredInsurance({
    isHazmat: params.isHazmat,
    isPublicService: params.isPublicService,
  });

  const checkDate = params.operationDate ? new Date(params.operationDate) : new Date();
  const thirtyDaysFromNow = new Date(checkDate.getTime() + 30 * 24 * 3_600_000);
  const results: InsuranceValidationResult['requirements'] = [];
  const missingPolicies: MexicanInsuranceType[] = [];
  const expiringWithin30Days: MexicanInsurancePolicy[] = [];
  const warnings: string[] = [];

  for (const req of requirements) {
    const matchingPolicy = policies.find(p => p.tipoSeguro === req.tipo);

    if (!matchingPolicy) {
      results.push({
        requirement: req,
        policy: null,
        status: 'missing',
        message: `${req.nombre} no encontrado - OBLIGATORIO (${req.fundamento})`,
      });
      missingPolicies.push(req.tipo);
      continue;
    }

    // Check expiration
    const endDate = new Date(matchingPolicy.vigenciaFin);
    if (endDate < checkDate) {
      results.push({
        requirement: req,
        policy: matchingPolicy,
        status: 'expired',
        message: `${req.nombre} vencido el ${matchingPolicy.vigenciaFin}`,
      });
      continue;
    }

    // Check if expiring soon
    if (endDate < thirtyDaysFromNow) {
      expiringWithin30Days.push(matchingPolicy);
      warnings.push(`${req.nombre} vence en menos de 30 dias (${matchingPolicy.vigenciaFin})`);
    }

    // Check authorized insurer
    if (!isAuthorizedInsurer(matchingPolicy.claveAseguradora)) {
      results.push({
        requirement: req,
        policy: matchingPolicy,
        status: 'unauthorized_insurer',
        message: `Aseguradora ${matchingPolicy.aseguradora} no esta autorizada por CNSF`,
      });
      continue;
    }

    // Check minimum coverage
    const coverageInMXN = matchingPolicy.moneda === 'USD'
      ? matchingPolicy.sumaAsegurada * 17.15  // approximate, should use live rate
      : matchingPolicy.sumaAsegurada;

    if (coverageInMXN < req.montoMinimoMXN) {
      results.push({
        requirement: req,
        policy: matchingPolicy,
        status: 'insufficient_coverage',
        message: `Cobertura insuficiente: ${formatMXN(coverageInMXN)} < minimo ${formatMXN(req.montoMinimoMXN)}`,
      });
      continue;
    }

    // Check vehicle coverage
    if (params.vehiclePlate && matchingPolicy.vehiculosAmparados.length > 0) {
      if (!matchingPolicy.vehiculosAmparados.includes(params.vehiclePlate.toUpperCase())) {
        warnings.push(`Vehiculo ${params.vehiclePlate} no aparece en poliza ${matchingPolicy.numeroPoliza} - verificar cobertura`);
      }
    }

    // Check hazmat coverage
    if (params.isHazmat && req.tipo === 'responsabilidad_civil' && !matchingPolicy.hazmatCubierto) {
      warnings.push('Seguro de responsabilidad civil no incluye cobertura de materiales peligrosos');
    }

    results.push({
      requirement: req,
      policy: matchingPolicy,
      status: 'valid',
      message: `${req.nombre} vigente hasta ${matchingPolicy.vigenciaFin}`,
    });
  }

  const hasFailures = results.some(r => r.status !== 'valid');
  const allMissing = results.every(r => r.status === 'missing');

  return {
    overallStatus: allMissing ? 'non_compliant' : hasFailures ? 'partial' : 'compliant',
    requirements: results,
    missingPolicies,
    expiringWithin30Days,
    warnings,
  };
}

function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}


// -- Cross-Border Insurance Bridging --

export interface CrossBorderInsuranceCheck {
  usInsuranceValid: boolean;
  mexicanInsuranceValid: boolean;
  needsMexicanPolicy: boolean;
  message: string;
}

export function checkCrossBorderInsurance(
  hasUSInsurance: boolean,
  mexicanPolicies: MexicanInsurancePolicy[],
  direction: 'US_to_MX' | 'MX_to_US',
  isHazmat: boolean,
): CrossBorderInsuranceCheck {
  // US insurance does NOT cover operations in Mexico
  // Mexican insurance does NOT cover operations in the US
  // Carriers need BOTH when crossing the border

  const mxValidation = validateMexicanInsurance(mexicanPolicies, {
    isHazmat,
    isPublicService: true,
    vehiclePlate: '',
  });

  if (direction === 'US_to_MX') {
    return {
      usInsuranceValid: hasUSInsurance,
      mexicanInsuranceValid: mxValidation.overallStatus === 'compliant',
      needsMexicanPolicy: true,
      message: hasUSInsurance && mxValidation.overallStatus === 'compliant'
        ? 'Both US and Mexican insurance valid for cross-border operation'
        : !hasUSInsurance
          ? 'US insurance required for US leg of cross-border shipment'
          : `Mexican insurance issues: ${mxValidation.requirements.filter(r => r.status !== 'valid').map(r => r.message).join('; ')}`,
    };
  }

  return {
    usInsuranceValid: hasUSInsurance,
    mexicanInsuranceValid: mxValidation.overallStatus === 'compliant',
    needsMexicanPolicy: false,
    message: mxValidation.overallStatus === 'compliant' && hasUSInsurance
      ? 'Both Mexican and US insurance valid for cross-border operation'
      : mxValidation.overallStatus !== 'compliant'
        ? `Mexican insurance issues for MX leg`
        : 'US insurance required for US leg of cross-border shipment',
  };
}
