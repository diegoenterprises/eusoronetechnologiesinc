/**
 * AGENTE ADUANAL (CUSTOMS BROKER) INTEGRATION SERVICE
 * Phase 1 - Cross-Border Audit P0 Blocker #7
 *
 * In Mexico, only licensed Agentes Aduanales can file pedimentos
 * and clear goods through customs. They are licensed by SAT and
 * assigned a "patente aduanal" (4-digit number) tied to specific aduanas.
 *
 * This service manages:
 *  - Broker directory with patente validation
 *  - Broker assignment to shipments
 *  - Communication workflow (document requests, status updates)
 *  - Fee estimation
 *  - Performance tracking
 */

import { logger } from '../_core/logger';

// -- Types --

export type BrokerStatus = 'active' | 'suspended' | 'revoked' | 'inactive';
export type AssignmentStatus = 'pending' | 'accepted' | 'in_progress' | 'documents_requested' | 'cleared' | 'rejected' | 'cancelled';

export interface AgenteAduanal {
  id: string;
  patente: string;              // 4-digit patent number
  nombre: string;
  rfc: string;
  email: string;
  telefono: string;
  aduanasAutorizadas: string[]; // customs offices where they can operate
  especialidades: BrokerSpecialty[];
  status: BrokerStatus;
  // Address
  domicilio: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  // Performance
  totalDespachos: number;       // total clearances handled
  tiempoPromedioHoras: number;  // average clearance time in hours
  calificacion: number;         // rating 1-5
  // Fees
  tarifaBase: number;           // base fee in MXN
  tarifaPorPartida: number;     // per-line-item fee
  // Metadata
  fechaRegistro: string;
  ultimaActividad: string;
  companyId?: number;           // if linked to platform company
}

export type BrokerSpecialty =
  | 'general'
  | 'materiales_peligrosos'
  | 'automotriz'
  | 'farmaceutico'
  | 'alimentos'
  | 'textil'
  | 'electronica'
  | 'quimicos'
  | 'minerales'
  | 'perecederos'
  | 'IMMEX'
  | 'transito_internacional';

export interface BrokerAssignment {
  id: string;
  agenteId: string;
  loadId: number;
  pedimentoId?: string;
  cartaPorteId?: string;
  status: AssignmentStatus;
  // Shipment details
  tipoOperacion: 'importacion' | 'exportacion' | 'transito';
  aduanaEntrada: string;
  aduanaSalida?: string;
  valorMercancias: number;
  moneda: 'USD' | 'MXN';
  numPartidas: number;
  esHazmat: boolean;
  // Documents
  documentosRequeridos: RequiredDocument[];
  documentosRecibidos: string[];
  // Fees
  cotizacion?: BrokerQuote;
  // Timeline
  fechaSolicitud: string;
  fechaAceptacion?: string;
  fechaDespacho?: string;
  fechaLiberacion?: string;
  // Notes
  notas: string[];
  createdBy: number;
}

export interface RequiredDocument {
  tipo: string;
  nombre: string;
  obligatorio: boolean;
  recibido: boolean;
  fechaRecibido?: string;
}

export interface BrokerQuote {
  honorarios: number;           // broker fees
  derechos: number;             // customs duties estimate
  impuestos: number;            // tax estimate
  prevalidacion: number;        // pre-validation fee
  maniobras: number;            // handling charges
  otros: number;                // miscellaneous
  total: number;
  moneda: 'MXN';
  vigencia: string;             // quote valid until
}


// -- Required Documents by Operation Type --

const IMPORT_DOCUMENTS: RequiredDocument[] = [
  { tipo: 'FACTURA', nombre: 'Factura comercial', obligatorio: true, recibido: false },
  { tipo: 'PACKING', nombre: 'Lista de empaque (packing list)', obligatorio: true, recibido: false },
  { tipo: 'BL', nombre: 'Conocimiento de embarque / Carta de porte', obligatorio: true, recibido: false },
  { tipo: 'PEDIMENTO_PREV', nombre: 'Pedimento previo (si aplica)', obligatorio: false, recibido: false },
  { tipo: 'CERT_ORIGEN', nombre: 'Certificado de origen USMCA/T-MEC', obligatorio: false, recibido: false },
  { tipo: 'PERMISO_IMPORT', nombre: 'Permiso de importacion (si aplica)', obligatorio: false, recibido: false },
  { tipo: 'NOM_CERT', nombre: 'Certificado NOM (si aplica)', obligatorio: false, recibido: false },
  { tipo: 'CONSTANCIA_RFC', nombre: 'Constancia de situacion fiscal (RFC)', obligatorio: true, recibido: false },
  { tipo: 'PODER_NOTARIAL', nombre: 'Poder notarial / Encargo conferido', obligatorio: true, recibido: false },
];

const EXPORT_DOCUMENTS: RequiredDocument[] = [
  { tipo: 'FACTURA', nombre: 'Factura comercial', obligatorio: true, recibido: false },
  { tipo: 'PACKING', nombre: 'Lista de empaque', obligatorio: true, recibido: false },
  { tipo: 'CONSTANCIA_RFC', nombre: 'Constancia de situacion fiscal', obligatorio: true, recibido: false },
  { tipo: 'PODER_NOTARIAL', nombre: 'Encargo conferido', obligatorio: true, recibido: false },
  { tipo: 'CERT_ORIGEN', nombre: 'Certificado de origen (si aplica)', obligatorio: false, recibido: false },
  { tipo: 'PERMISO_EXPORT', nombre: 'Permiso de exportacion (si aplica)', obligatorio: false, recibido: false },
];

const HAZMAT_ADDITIONAL: RequiredDocument[] = [
  { tipo: 'HOJA_SEGURIDAD', nombre: 'Hoja de datos de seguridad (SDS/HDS)', obligatorio: true, recibido: false },
  { tipo: 'PERMISO_SEMARNAT', nombre: 'Permiso SEMARNAT', obligatorio: true, recibido: false },
  { tipo: 'SEGURO_AMBIENTAL', nombre: 'Poliza de seguro ambiental', obligatorio: true, recibido: false },
  { tipo: 'PLAN_EMERGENCIA', nombre: 'Plan de atencion a emergencias', obligatorio: true, recibido: false },
];

export function getRequiredDocuments(params: {
  tipoOperacion: 'importacion' | 'exportacion' | 'transito';
  esHazmat: boolean;
}): RequiredDocument[] {
  const base = params.tipoOperacion === 'exportacion' ? [...EXPORT_DOCUMENTS] : [...IMPORT_DOCUMENTS];
  if (params.esHazmat) {
    base.push(...HAZMAT_ADDITIONAL.map(d => ({ ...d })));
  }
  return base;
}


// -- Broker Fee Estimation --

export function estimateBrokerFees(params: {
  valorMercancias: number;
  moneda: 'USD' | 'MXN';
  numPartidas: number;
  tipoOperacion: 'importacion' | 'exportacion' | 'transito';
  esHazmat: boolean;
  tipoCambio?: number;
}): BrokerQuote {
  const tc = params.tipoCambio || 17.15;
  const valorMXN = params.moneda === 'USD' ? params.valorMercancias * tc : params.valorMercancias;

  // Base honorarios: typically 0.5-1.5% of merchandise value, min $3,000 MXN
  let honorarios = Math.max(3000, valorMXN * 0.007);
  // Per-line-item surcharge
  honorarios += params.numPartidas * 150;
  // Hazmat surcharge: +50%
  if (params.esHazmat) honorarios *= 1.5;
  honorarios = Math.round(honorarios * 100) / 100;

  // Customs duties estimate (varies widely by HTS, use 5% default)
  const derechos = params.tipoOperacion === 'exportacion' ? 0 : Math.round(valorMXN * 0.05 * 100) / 100;

  // IVA on (value + duties)
  const impuestos = Math.round((valorMXN + derechos) * 0.16 * 100) / 100;

  // Pre-validation fee
  const prevalidacion = 300;

  // Handling
  const maniobras = params.tipoOperacion === 'transito' ? 500 : 1500;

  const total = Math.round((honorarios + derechos + impuestos + prevalidacion + maniobras) * 100) / 100;

  const vigencia = new Date(Date.now() + 7 * 24 * 3_600_000).toISOString();

  return {
    honorarios,
    derechos,
    impuestos,
    prevalidacion,
    maniobras,
    otros: 0,
    total,
    moneda: 'MXN',
    vigencia,
  };
}


// -- Assignment Creation --

function generateId(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export function createBrokerAssignment(params: {
  agenteId: string;
  loadId: number;
  tipoOperacion: 'importacion' | 'exportacion' | 'transito';
  aduanaEntrada: string;
  aduanaSalida?: string;
  valorMercancias: number;
  moneda: 'USD' | 'MXN';
  numPartidas: number;
  esHazmat: boolean;
  createdBy: number;
}): BrokerAssignment {
  const docs = getRequiredDocuments({
    tipoOperacion: params.tipoOperacion,
    esHazmat: params.esHazmat,
  });

  return {
    id: generateId('BA'),
    agenteId: params.agenteId,
    loadId: params.loadId,
    status: 'pending',
    tipoOperacion: params.tipoOperacion,
    aduanaEntrada: params.aduanaEntrada,
    aduanaSalida: params.aduanaSalida,
    valorMercancias: params.valorMercancias,
    moneda: params.moneda,
    numPartidas: params.numPartidas,
    esHazmat: params.esHazmat,
    documentosRequeridos: docs,
    documentosRecibidos: [],
    fechaSolicitud: new Date().toISOString(),
    notas: [],
    createdBy: params.createdBy,
  };
}

// -- Broker Search/Matching --

export function findBestBroker(
  brokers: AgenteAduanal[],
  params: {
    aduana: string;
    specialty?: BrokerSpecialty;
    esHazmat: boolean;
  },
): AgenteAduanal[] {
  return brokers
    .filter(b => {
      if (b.status !== 'active') return false;
      if (!b.aduanasAutorizadas.includes(params.aduana)) return false;
      if (params.esHazmat && !b.especialidades.includes('materiales_peligrosos')) return false;
      if (params.specialty && !b.especialidades.includes(params.specialty)) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort by rating (desc), then by average clearance time (asc)
      if (b.calificacion !== a.calificacion) return b.calificacion - a.calificacion;
      return a.tiempoPromedioHoras - b.tiempoPromedioHoras;
    });
}

// -- Document Completion Check --

export function checkDocumentCompleteness(assignment: BrokerAssignment): {
  complete: boolean;
  totalRequired: number;
  totalReceived: number;
  missing: string[];
  percentage: number;
} {
  const required = assignment.documentosRequeridos.filter(d => d.obligatorio);
  const received = required.filter(d => d.recibido);
  const missing = required.filter(d => !d.recibido).map(d => d.nombre);

  return {
    complete: missing.length === 0,
    totalRequired: required.length,
    totalReceived: received.length,
    missing,
    percentage: required.length > 0 ? Math.round((received.length / required.length) * 100) : 100,
  };
}
