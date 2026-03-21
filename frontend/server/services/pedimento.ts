/**
 * PEDIMENTO (MEXICAN CUSTOMS DECLARATION) SERVICE
 * Phase 1 - Cross-Border Audit P0 Blocker #6
 *
 * The Pedimento is Mexico's official customs declaration document,
 * required for ALL goods entering or leaving Mexico. It is filed
 * electronically through VUCEM (Ventanilla Unica de Comercio Exterior Mexicano).
 *
 * Key requirements:
 *  - Must be filed by a licensed Agente Aduanal (customs broker)
 *  - Includes: HTS classification, duties, taxes (IVA, DTA, ISAN)
 *  - Requires pedimento number (15 digits: YY-AA-PPPP-NNNNNNN)
 *  - Must reference Carta Porte if domestic leg exists
 *  - USMCA/T-MEC certificate of origin for preferential tariffs
 *  - Pre-validation required before goods arrive at aduana
 */

import { logger } from '../_core/logger';
import { type CurrencyCode, convertCurrency, formatCurrency } from './currencyEngine';

// -- Types --

export type PedimentoStatus = 'draft' | 'pre_validated' | 'submitted' | 'paid' | 'cleared' | 'cancelled' | 'rejected';
export type PedimentoType = 'A1' | 'A4' | 'G1' | 'IN' | 'K1' | 'V1' | 'RT';
// A1 = Importacion definitiva (permanent import)
// A4 = Importacion temporal (IMMEX)
// G1 = Exportacion definitiva (permanent export)
// IN = Transito interno (domestic transit of foreign goods)
// K1 = Cambio de regimen (regime change)
// V1 = Retorno virtual (virtual return for IMMEX)
// RT = Retorno (return of temporarily imported goods)

export interface PedimentoParty {
  rfc: string;
  nombre: string;
  domicilioFiscal: string;
  curp?: string;           // for individuals
  patenteAduanal?: string; // customs broker patent number
}

export interface PedimentoMercancia {
  fraccionArancelaria: string;  // 8-digit HTS code
  descripcion: string;
  cantidad: number;
  unidadMedida: string;         // SAT unit code
  paisOrigen: string;           // ISO country code
  paisVendedor?: string;
  valorAduana: number;           // customs value in USD
  valorComercial: number;        // commercial value in MXN
  pesoKg: number;
  marcas?: string;
  numSerie?: string;
  arancelAdValorem: number;      // duty rate (decimal, e.g. 0.05 = 5%)
  cuotaCompensatoria?: number;   // anti-dumping rate if applicable
  permisos?: PedimentoPermiso[];
  vinculacion: boolean;          // related-party transaction
  metodoValoracion: '1' | '2' | '3' | '4' | '5' | '6'; // WTO valuation method
}

export interface PedimentoPermiso {
  tipo: string;         // permit type code
  autoridad: string;    // issuing authority
  numero: string;       // permit number
  firma?: string;       // digital signature
}

export interface PedimentoImpuestos {
  arancelImporte: number;        // duty amount MXN
  iva: number;                    // IVA (16%) on (customs value + duty)
  dta: number;                    // Derecho de Tramite Aduanero (0.8% or fixed)
  isan?: number;                  // special tax on new vehicles
  ieps?: number;                  // special production/services tax
  cuotaCompensatoria: number;     // anti-dumping duties
  prevalidacion: number;          // pre-validation fee (~$300 MXN)
  total: number;
}

export interface PedimentoDocument {
  id: string;
  numeroPedimento: string;        // YY-AA-PPPP-NNNNNNN format
  tipo: PedimentoType;
  status: PedimentoStatus;
  fechaEntrada: string;           // ISO date of entry/exit
  fechaPago?: string;             // ISO date duties were paid
  // Parties
  importadorExportador: PedimentoParty;
  agenteAduanal: PedimentoParty;
  proveedor?: PedimentoParty;     // foreign supplier (imports)
  destinatario?: PedimentoParty;  // foreign buyer (exports)
  // Customs
  aduanaEntrada: string;          // customs office code (3 digits)
  aduanaSalida?: string;
  patente: string;                // agent patent number (4 digits)
  seccion: string;                // customs section
  // Cargo
  mercancias: PedimentoMercancia[];
  pesoTotalKg: number;
  numBultos: number;              // number of packages
  // Transport
  medioTransporte: 'carretero' | 'maritimo' | 'aereo' | 'ferroviario';
  placaVehiculo?: string;
  numContenedor?: string;
  // Financial
  valorDolares: number;           // total value in USD
  tipoCambio: number;             // USD/MXN exchange rate used
  impuestos: PedimentoImpuestos;
  // References
  cartaPorteId?: string;
  eManifestId?: string;
  facturaComercial?: string;      // commercial invoice number
  certificadoOrigen?: string;     // USMCA/T-MEC cert number
  // Metadata
  loadId?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}


// -- Mexican Customs Offices --

export const ADUANAS: Record<string, { name: string; state: string; type: 'fronteriza' | 'maritima' | 'interior' }> = {
  '240': { name: 'Nuevo Laredo', state: 'TAMPS', type: 'fronteriza' },
  '160': { name: 'Ciudad Juarez', state: 'CHIH', type: 'fronteriza' },
  '430': { name: 'Tijuana (Mesa de Otay)', state: 'BC', type: 'fronteriza' },
  '800': { name: 'Colombia, NL', state: 'NL', type: 'fronteriza' },
  '190': { name: 'Piedras Negras', state: 'COAH', type: 'fronteriza' },
  '250': { name: 'Reynosa', state: 'TAMPS', type: 'fronteriza' },
  '230': { name: 'Matamoros', state: 'TAMPS', type: 'fronteriza' },
  '310': { name: 'Nogales', state: 'SON', type: 'fronteriza' },
  '120': { name: 'Mexicali', state: 'BC', type: 'fronteriza' },
  '470': { name: 'Veracruz', state: 'VER', type: 'maritima' },
  '480': { name: 'Manzanillo', state: 'COL', type: 'maritima' },
  '440': { name: 'Lazaro Cardenas', state: 'MICH', type: 'maritima' },
  '650': { name: 'Altamira', state: 'TAMPS', type: 'maritima' },
  '500': { name: 'Aeropuerto CDMX', state: 'CDMX', type: 'interior' },
  '010': { name: 'Mexico (Interior)', state: 'CDMX', type: 'interior' },
  '640': { name: 'Guadalajara', state: 'JAL', type: 'interior' },
  '820': { name: 'Monterrey', state: 'NL', type: 'interior' },
};

// -- Pedimento Type Descriptions --

export const PEDIMENTO_TYPES: Record<PedimentoType, string> = {
  'A1': 'Importacion Definitiva',
  'A4': 'Importacion Temporal (IMMEX)',
  'G1': 'Exportacion Definitiva',
  'IN': 'Transito Interno',
  'K1': 'Cambio de Regimen',
  'V1': 'Retorno Virtual',
  'RT': 'Retorno de Mercancias',
};


// -- Pedimento Number Generation --

function generatePedimentoNumber(year: number, aduana: string, patente: string): string {
  const yy = String(year).slice(-2);
  const seq = String(Math.floor(Math.random() * 9999999)).padStart(7, '0');
  return `${yy}-${aduana.padStart(2, '0')}-${patente.padStart(4, '0')}-${seq}`;
}

function generateId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PED-${ts}-${rand}`;
}

// -- Tax Calculation --

export function calculatePedimentoTaxes(
  mercancias: PedimentoMercancia[],
  tipoCambio: number,
  pedimentoType: PedimentoType,
): PedimentoImpuestos {
  let totalArancel = 0;
  let totalCuotaComp = 0;
  let totalValorAduana = 0;

  for (const m of mercancias) {
    const valorMXN = m.valorAduana * tipoCambio;
    totalValorAduana += valorMXN;
    totalArancel += valorMXN * m.arancelAdValorem;
    if (m.cuotaCompensatoria) {
      totalCuotaComp += valorMXN * m.cuotaCompensatoria;
    }
  }

  totalArancel = Math.round(totalArancel * 100) / 100;
  totalCuotaComp = Math.round(totalCuotaComp * 100) / 100;

  // DTA (Derecho de Tramite Aduanero)
  // For imports: 0.8% of customs value (min ~$300 MXN, max varies)
  // For exports: fixed fee (~$300 MXN)
  let dta: number;
  if (pedimentoType === 'G1') {
    dta = 317; // Fixed export DTA (2024 rate)
  } else {
    dta = Math.max(317, Math.round(totalValorAduana * 0.008 * 100) / 100);
  }

  // IVA: 16% on (customs value + duty + DTA)
  const ivaBase = totalValorAduana + totalArancel + dta;
  const iva = Math.round(ivaBase * 0.16 * 100) / 100;

  const prevalidacion = 300; // ~$300 MXN pre-validation fee

  return {
    arancelImporte: totalArancel,
    iva,
    dta,
    cuotaCompensatoria: totalCuotaComp,
    prevalidacion,
    total: Math.round((totalArancel + iva + dta + totalCuotaComp + prevalidacion) * 100) / 100,
  };
}


// -- Document Creation --

export function createPedimento(params: {
  tipo: PedimentoType;
  importadorExportador: PedimentoParty;
  agenteAduanal: PedimentoParty;
  proveedor?: PedimentoParty;
  destinatario?: PedimentoParty;
  aduanaEntrada: string;
  patente: string;
  seccion?: string;
  mercancias: PedimentoMercancia[];
  numBultos: number;
  medioTransporte: 'carretero' | 'maritimo' | 'aereo' | 'ferroviario';
  placaVehiculo?: string;
  tipoCambio: number;
  cartaPorteId?: string;
  eManifestId?: string;
  facturaComercial?: string;
  certificadoOrigen?: string;
  loadId?: number;
  createdBy: number;
}): PedimentoDocument {
  const now = new Date();
  const impuestos = calculatePedimentoTaxes(params.mercancias, params.tipoCambio, params.tipo);
  const pesoTotal = params.mercancias.reduce((sum, m) => sum + m.pesoKg, 0);
  const valorDolares = params.mercancias.reduce((sum, m) => sum + m.valorAduana, 0);

  return {
    id: generateId(),
    numeroPedimento: generatePedimentoNumber(now.getFullYear(), params.aduanaEntrada, params.patente),
    tipo: params.tipo,
    status: 'draft',
    fechaEntrada: now.toISOString(),
    importadorExportador: params.importadorExportador,
    agenteAduanal: params.agenteAduanal,
    proveedor: params.proveedor,
    destinatario: params.destinatario,
    aduanaEntrada: params.aduanaEntrada,
    patente: params.patente,
    seccion: params.seccion || '0',
    mercancias: params.mercancias,
    pesoTotalKg: pesoTotal,
    numBultos: params.numBultos,
    medioTransporte: params.medioTransporte,
    placaVehiculo: params.placaVehiculo,
    valorDolares,
    tipoCambio: params.tipoCambio,
    impuestos,
    cartaPorteId: params.cartaPorteId,
    eManifestId: params.eManifestId,
    facturaComercial: params.facturaComercial,
    certificadoOrigen: params.certificadoOrigen,
    loadId: params.loadId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy: params.createdBy,
  };
}


// -- Validation --

export interface PedimentoValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePedimento(doc: PedimentoDocument): PedimentoValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Pedimento number format: YY-AA-PPPP-NNNNNNN
  if (!doc.numeroPedimento || !/^\d{2}-\d{2,3}-\d{4}-\d{7}$/.test(doc.numeroPedimento)) {
    errors.push('Numero de pedimento invalido (formato: YY-AA-PPPP-NNNNNNN)');
  }

  // Importer/Exporter RFC
  if (!doc.importadorExportador.rfc || doc.importadorExportador.rfc.length < 12) {
    errors.push('RFC del importador/exportador invalido');
  }

  // Agente Aduanal
  if (!doc.agenteAduanal.rfc) {
    errors.push('RFC del agente aduanal requerido');
  }
  if (!doc.agenteAduanal.patenteAduanal) {
    errors.push('Patente aduanal del agente requerida');
  }

  // Aduana validation
  if (!ADUANAS[doc.aduanaEntrada]) {
    errors.push(`Aduana de entrada invalida: ${doc.aduanaEntrada}`);
  }

  // Mercancias
  if (doc.mercancias.length === 0) {
    errors.push('Debe incluir al menos una mercancia');
  }
  for (const m of doc.mercancias) {
    if (!m.fraccionArancelaria || m.fraccionArancelaria.length !== 8) {
      errors.push(`Fraccion arancelaria invalida: ${m.fraccionArancelaria} (debe ser 8 digitos)`);
    }
    if (m.valorAduana <= 0) {
      errors.push(`Valor aduana debe ser mayor a 0 para ${m.descripcion}`);
    }
    if (m.pesoKg <= 0) {
      errors.push(`Peso debe ser mayor a 0 para ${m.descripcion}`);
    }
    if (m.vinculacion && m.metodoValoracion !== '1') {
      warnings.push(`Mercancia ${m.descripcion}: transaccion vinculada con metodo de valoracion ${m.metodoValoracion} - verificar con agente aduanal`);
    }
  }

  // Exchange rate sanity check (USD/MXN should be ~15-25 in normal conditions)
  if (doc.tipoCambio < 10 || doc.tipoCambio > 30) {
    warnings.push(`Tipo de cambio (${doc.tipoCambio}) parece inusual - verificar`);
  }

  // USMCA check for US/CA origin goods
  const usCanadaGoods = doc.mercancias.filter(m => m.paisOrigen === 'US' || m.paisOrigen === 'CA');
  if (usCanadaGoods.length > 0 && !doc.certificadoOrigen) {
    warnings.push('Mercancias de origen US/CA detectadas - certificado de origen USMCA/T-MEC puede reducir aranceles');
  }

  // Transport validation
  if (doc.medioTransporte === 'carretero' && !doc.placaVehiculo) {
    warnings.push('Placa del vehiculo recomendada para transporte carretero');
  }

  return { valid: errors.length === 0, errors, warnings };
}


// -- VUCEM Submission Payload --

export function generateVUCEMPayload(doc: PedimentoDocument): object {
  // This generates the data structure expected by VUCEM
  // (Ventanilla Unica de Comercio Exterior Mexicano)
  // In production, this would be submitted via VUCEM's web service API
  return {
    encabezado: {
      tipoPedimento: doc.tipo,
      numeroPedimento: doc.numeroPedimento,
      claveAduana: doc.aduanaEntrada,
      patente: doc.patente,
      seccion: doc.seccion,
      fechaEntrada: doc.fechaEntrada,
      medioTransporte: doc.medioTransporte === 'carretero' ? '7' :
        doc.medioTransporte === 'maritimo' ? '1' :
        doc.medioTransporte === 'aereo' ? '4' : '2',
    },
    importadorExportador: {
      rfc: doc.importadorExportador.rfc,
      nombre: doc.importadorExportador.nombre,
      domicilioFiscal: doc.importadorExportador.domicilioFiscal,
    },
    proveedor: doc.proveedor ? {
      nombre: doc.proveedor.nombre,
      domicilio: doc.proveedor.domicilioFiscal,
    } : undefined,
    partidas: doc.mercancias.map((m, i) => ({
      secuencia: i + 1,
      fraccion: m.fraccionArancelaria,
      descripcion: m.descripcion,
      cantidad: m.cantidad,
      unidadMedida: m.unidadMedida,
      paisOrigen: m.paisOrigen,
      valorAduana: m.valorAduana,
      pesoKg: m.pesoKg,
      arancel: m.arancelAdValorem,
      vinculacion: m.vinculacion ? 'S' : 'N',
      metodoValoracion: m.metodoValoracion,
      permisos: m.permisos?.map(p => ({
        tipo: p.tipo,
        autoridad: p.autoridad,
        numero: p.numero,
      })),
    })),
    impuestos: {
      arancel: doc.impuestos.arancelImporte,
      iva: doc.impuestos.iva,
      dta: doc.impuestos.dta,
      cuotaCompensatoria: doc.impuestos.cuotaCompensatoria,
      total: doc.impuestos.total,
    },
    tipoCambio: doc.tipoCambio,
    valorDolares: doc.valorDolares,
    datosTransporte: {
      placa: doc.placaVehiculo,
      contenedor: doc.numContenedor,
    },
    referencias: {
      cartaPorte: doc.cartaPorteId,
      eManifest: doc.eManifestId,
      facturaComercial: doc.facturaComercial,
      certificadoOrigen: doc.certificadoOrigen,
    },
  };
}
