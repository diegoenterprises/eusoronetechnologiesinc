/**
 * CARTA PORTE (CFDI) DOCUMENT GENERATOR
 * Phase 1 - Cross-Border Audit P0 Blocker #1
 *
 * Implements Complemento Carta Porte 3.1 (effective Jan 2024)
 * Required for ALL freight movement within Mexico and cross-border.
 * Without this document, freight is legally unseizable and the carrier
 * faces fines of $17,000-$170,000 MXN per incident.
 *
 * SAT (Servicio de Administracion Tributaria) requirements:
 *  - CFDI 4.0 base document + Carta Porte 3.1 complement
 *  - Digital signature (e.firma / FIEL) of issuer
 *  - UUID (folio fiscal) from PAC (Proveedor Autorizado de Certificacion)
 *  - Must include: origin, destination, cargo description, weight,
 *    vehicle config, driver SCT license, insurance policy, route
 */

import { logger } from '../_core/logger';

// -- Types --

export type CartaPorteStatus = 'draft' | 'pending_signature' | 'signed' | 'stamped' | 'cancelled' | 'error';
export type CartaPorteType = 'ingreso' | 'traslado';
// ingreso = revenue shipment (carrier bills shipper)
// traslado = transfer (company moves own goods)

export interface CartaPorteAddress {
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  colonia: string;        // neighborhood
  municipio: string;      // municipality
  estado: string;         // state code (e.g. 'JAL', 'NL')
  codigoPostal: string;   // 5-digit postal code
  pais: 'MEX' | 'USA' | 'CAN';
  localidad?: string;
  referencia?: string;    // landmark reference
}

export interface CartaPorteCargo {
  claveProducto: string;      // SAT product catalog key (8 digits)
  descripcion: string;
  cantidad: number;
  claveUnidad: string;        // SAT unit key (e.g. 'KGM', 'LTR', 'XBX')
  pesoKg: number;
  valorMercancia: number;     // declared value in MXN
  moneda: 'MXN' | 'USD' | 'CAD';
  materialPeligroso: boolean;
  cveMaterialPeligroso?: string;  // UN number if hazmat
  embalaje?: string;              // packaging type code
  fraccionArancelaria?: string;   // HTS code for cross-border
}

export interface CartaPorteVehicle {
  configVehicular: string;     // NOM-012 config code (e.g. 'T3S2', 'C3')
  placaVM: string;             // license plate
  anioModelo: number;          // model year
  aseguradora: string;         // insurance company name
  polizaSeguro: string;        // policy number
  permisoSCT: string;          // SCT permit type
  numPermisoSCT: string;       // SCT permit number
  subtipRem?: string;          // trailer subtype
  placaRemolque?: string;      // trailer plate
}

export interface CartaPorteDriver {
  rfcFigura: string;           // RFC (tax ID) of driver/operator
  nombreFigura: string;        // full name
  numLicencia: string;         // SCT license number
  tipoLicencia: string;        // A, B, C, D, or E
  residenciaFiscal?: string;   // tax residency country
  numRegIdTrib?: string;       // foreign tax ID if applicable
}

export interface CartaPorteRoute {
  origenId: string;
  destinoId: string;
  distanciaKm: number;
  fechaSalida: string;         // ISO departure
  fechaLlegada: string;        // ISO estimated arrival
  // For multi-stop
  ubicaciones: CartaPorteUbicacion[];
}

export interface CartaPorteUbicacion {
  tipoUbicacion: 'Origen' | 'Destino' | 'Paso';
  idUbicacion: string;         // ID starting with 'OR' or 'DE'
  rfcRemitente: string;        // RFC of sender/receiver
  nombreRemitente: string;
  domicilio: CartaPorteAddress;
  fechaHoraSalidaLlegada: string;
  distanciaRecorrida?: number; // km from previous stop
}

export interface CartaPorteDocument {
  id: string;
  version: '3.1';
  tipo: CartaPorteType;
  status: CartaPorteStatus;
  // CFDI base fields
  rfcEmisor: string;           // issuer RFC
  nombreEmisor: string;
  regimenFiscal: string;       // tax regime code
  rfcReceptor: string;         // receiver RFC
  nombreReceptor: string;
  usoCFDI: string;             // CFDI use code
  // Carta Porte complement
  transpInternac: 'Si' | 'No';
  entradaSalidaMerc?: 'Entrada' | 'Salida';
  paisOrigenDestino?: string;  // country code if international
  viaEntradaSalida?: string;   // entry/exit mode
  // Sub-objects
  mercancias: CartaPorteCargo[];
  vehiculo: CartaPorteVehicle;
  figuraTransporte: CartaPorteDriver[];
  ruta: CartaPorteRoute;
  // Totals
  pesoTotalKg: number;
  numTotalMercancias: number;
  // Signing
  uuid?: string;               // folio fiscal (assigned by PAC)
  selloDigital?: string;       // digital signature
  cadenaOriginal?: string;     // original chain for verification
  fechaTimbrado?: string;      // PAC timestamp
  noCertificado?: string;
  // Metadata
  loadId?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}


// -- SAT Catalog Constants --

// Regimen Fiscal codes (most common for transport)
export const REGIMEN_FISCAL = {
  '601': 'General de Ley Personas Morales',
  '603': 'Personas Morales con Fines no Lucrativos',
  '612': 'Personas Fisicas con Actividades Empresariales',
  '616': 'Sin obligaciones fiscales',
  '621': 'Incorporacion Fiscal',
  '626': 'Regimen Simplificado de Confianza',
};

// Uso CFDI for transport
export const USO_CFDI = {
  'S01': 'Sin efectos fiscales',
  'G03': 'Gastos en general',
  'P01': 'Por definir',
};

// Vehicle configuration codes (NOM-012-SCT-2)
export const VEHICLE_CONFIGS: Record<string, string> = {
  'VL': 'Vehiculo ligero',
  'C2': 'Camion unitario 2 ejes',
  'C3': 'Camion unitario 3 ejes',
  'T2S1': 'Tractocamion 2 ejes - Semirremolque 1 eje',
  'T2S2': 'Tractocamion 2 ejes - Semirremolque 2 ejes',
  'T3S2': 'Tractocamion 3 ejes - Semirremolque 2 ejes',
  'T3S3': 'Tractocamion 3 ejes - Semirremolque 3 ejes',
  'T3S2R4': 'Tractocamion doble remolque',
};

// SCT Permit types
export const SCT_PERMIT_TYPES: Record<string, string> = {
  'TPAF01': 'Autotransporte Federal de Carga General',
  'TPAF02': 'Transporte Privado de Carga',
  'TPAF03': 'Autotransporte Federal de Carga Especializada',
  'TPAF04': 'Transporte de materiales y residuos peligrosos',
  'TPAF05': 'Autotransporte Federal de Carga General (Grua Industrial)',
  'TPAF06': 'Arrastre en vias generales',
  'TPAF07': 'Maniobras de Carga y Descarga',
  'TPAF08': 'Transporte multimodal',
  'TPAF09': 'Operacion de transporte internacional (fronterizo)',
  'TPAF10': 'Transporte de vehiculos nuevos sin rodar',
};

// Common cargo unit keys
export const CLAVE_UNIDAD: Record<string, string> = {
  'KGM': 'Kilogramo',
  'TNE': 'Tonelada metrica',
  'LTR': 'Litro',
  'MTQ': 'Metro cubico',
  'XBX': 'Caja',
  'XPL': 'Pallet',
  'XUN': 'Unidad',
  'GLL': 'Galon',
  'BBL': 'Barril',
  'DPC': 'Docena de piezas',
};


// -- Document Generation --

function generateId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CP-${ts}-${rand}`;
}

function generateUbicacionId(tipo: 'Origen' | 'Destino' | 'Paso', index: number): string {
  const prefix = tipo === 'Origen' ? 'OR' : tipo === 'Destino' ? 'DE' : 'IN';
  return `${prefix}${String(index + 1).padStart(6, '0')}`;
}

export function createCartaPorte(params: {
  tipo: CartaPorteType;
  emisor: { rfc: string; nombre: string; regimenFiscal: string };
  receptor: { rfc: string; nombre: string; usoCFDI: string };
  mercancias: CartaPorteCargo[];
  vehiculo: CartaPorteVehicle;
  conductores: CartaPorteDriver[];
  ruta: {
    origen: { rfcRemitente: string; nombreRemitente: string; domicilio: CartaPorteAddress; fechaSalida: string };
    destino: { rfcRemitente: string; nombreRemitente: string; domicilio: CartaPorteAddress; fechaLlegada: string };
    distanciaKm: number;
    paradas?: Array<{ rfcRemitente: string; nombreRemitente: string; domicilio: CartaPorteAddress; fechaHora: string }>;
  };
  isInternational: boolean;
  entradaSalida?: 'Entrada' | 'Salida';
  paisOrigenDestino?: string;
  loadId?: number;
  createdBy: number;
}): CartaPorteDocument {
  const ubicaciones: CartaPorteUbicacion[] = [];

  // Origin
  ubicaciones.push({
    tipoUbicacion: 'Origen',
    idUbicacion: generateUbicacionId('Origen', 0),
    rfcRemitente: params.ruta.origen.rfcRemitente,
    nombreRemitente: params.ruta.origen.nombreRemitente,
    domicilio: params.ruta.origen.domicilio,
    fechaHoraSalidaLlegada: params.ruta.origen.fechaSalida,
  });

  // Intermediate stops
  if (params.ruta.paradas) {
    for (let i = 0; i < params.ruta.paradas.length; i++) {
      const p = params.ruta.paradas[i];
      ubicaciones.push({
        tipoUbicacion: 'Paso',
        idUbicacion: generateUbicacionId('Paso', i),
        rfcRemitente: p.rfcRemitente,
        nombreRemitente: p.nombreRemitente,
        domicilio: p.domicilio,
        fechaHoraSalidaLlegada: p.fechaHora,
      });
    }
  }

  // Destination
  ubicaciones.push({
    tipoUbicacion: 'Destino',
    idUbicacion: generateUbicacionId('Destino', 0),
    rfcRemitente: params.ruta.destino.rfcRemitente,
    nombreRemitente: params.ruta.destino.nombreRemitente,
    domicilio: params.ruta.destino.domicilio,
    fechaHoraSalidaLlegada: params.ruta.destino.fechaLlegada,
    distanciaRecorrida: params.ruta.distanciaKm,
  });

  const pesoTotal = params.mercancias.reduce((sum, m) => sum + m.pesoKg, 0);
  const now = new Date().toISOString();

  return {
    id: generateId(),
    version: '3.1',
    tipo: params.tipo,
    status: 'draft',
    rfcEmisor: params.emisor.rfc,
    nombreEmisor: params.emisor.nombre,
    regimenFiscal: params.emisor.regimenFiscal,
    rfcReceptor: params.receptor.rfc,
    nombreReceptor: params.receptor.nombre,
    usoCFDI: params.receptor.usoCFDI,
    transpInternac: params.isInternational ? 'Si' : 'No',
    entradaSalidaMerc: params.entradaSalida,
    paisOrigenDestino: params.paisOrigenDestino,
    mercancias: params.mercancias,
    vehiculo: params.vehiculo,
    figuraTransporte: params.conductores,
    ruta: {
      origenId: ubicaciones[0].idUbicacion,
      destinoId: ubicaciones[ubicaciones.length - 1].idUbicacion,
      distanciaKm: params.ruta.distanciaKm,
      fechaSalida: params.ruta.origen.fechaSalida,
      fechaLlegada: params.ruta.destino.fechaLlegada,
      ubicaciones,
    },
    pesoTotalKg: pesoTotal,
    numTotalMercancias: params.mercancias.length,
    loadId: params.loadId,
    createdAt: now,
    updatedAt: now,
    createdBy: params.createdBy,
  };
}


// -- Validation --

export interface CartaPorteValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCartaPorte(doc: CartaPorteDocument): CartaPorteValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // RFC validation (13 chars for personas morales, 12 for personas fisicas)
  if (!doc.rfcEmisor || (doc.rfcEmisor.length !== 12 && doc.rfcEmisor.length !== 13)) {
    errors.push('RFC Emisor invalido - debe tener 12 o 13 caracteres');
  }
  if (!doc.rfcReceptor || (doc.rfcReceptor.length !== 12 && doc.rfcReceptor.length !== 13)) {
    errors.push('RFC Receptor invalido - debe tener 12 o 13 caracteres');
  }

  // Cargo validation
  if (doc.mercancias.length === 0) {
    errors.push('Debe incluir al menos una mercancia');
  }
  for (const m of doc.mercancias) {
    if (!m.claveProducto || m.claveProducto.length !== 8) {
      errors.push(`Clave de producto invalida: ${m.claveProducto} - debe tener 8 digitos`);
    }
    if (m.pesoKg <= 0) {
      errors.push(`Peso invalido para ${m.descripcion}: debe ser mayor a 0`);
    }
    if (m.materialPeligroso && !m.cveMaterialPeligroso) {
      errors.push(`Material peligroso ${m.descripcion} requiere numero ONU (cveMaterialPeligroso)`);
    }
  }

  // Vehicle validation
  if (!doc.vehiculo.configVehicular) {
    errors.push('Configuracion vehicular requerida (NOM-012-SCT-2)');
  }
  if (!doc.vehiculo.placaVM) {
    errors.push('Placa del vehiculo requerida');
  }
  if (!doc.vehiculo.aseguradora || !doc.vehiculo.polizaSeguro) {
    errors.push('Seguro de responsabilidad civil obligatorio');
  }
  if (!doc.vehiculo.permisoSCT || !doc.vehiculo.numPermisoSCT) {
    errors.push('Permiso SCT obligatorio para autotransporte federal');
  }

  // Driver validation
  if (doc.figuraTransporte.length === 0) {
    errors.push('Debe incluir al menos un operador (figura de transporte)');
  }
  for (const d of doc.figuraTransporte) {
    if (!d.rfcFigura) {
      errors.push(`RFC del operador ${d.nombreFigura} requerido`);
    }
    if (!d.numLicencia) {
      errors.push(`Licencia SCT del operador ${d.nombreFigura} requerida`);
    }
  }

  // Route validation
  if (doc.ruta.ubicaciones.length < 2) {
    errors.push('La ruta debe tener al menos origen y destino');
  }
  if (doc.ruta.distanciaKm <= 0) {
    errors.push('La distancia recorrida debe ser mayor a 0 km');
  }

  // International shipment validation
  if (doc.transpInternac === 'Si') {
    if (!doc.entradaSalidaMerc) {
      errors.push('Debe especificar si es Entrada o Salida de mercancia (transporte internacional)');
    }
    if (!doc.paisOrigenDestino) {
      errors.push('Pais de origen/destino requerido para transporte internacional');
    }
    // Check for fraccion arancelaria on all items
    for (const m of doc.mercancias) {
      if (!m.fraccionArancelaria) {
        warnings.push(`Fraccion arancelaria recomendada para ${m.descripcion} (transporte internacional)`);
      }
    }
  }

  // Weight check
  const calcWeight = doc.mercancias.reduce((sum, m) => sum + m.pesoKg, 0);
  if (Math.abs(calcWeight - doc.pesoTotalKg) > 1) {
    warnings.push(`Peso total (${doc.pesoTotalKg} kg) no coincide con suma de mercancias (${calcWeight} kg)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// -- XML Generation (for PAC submission) --

export function generateCartaPorteXML(doc: CartaPorteDocument): string {
  // This generates a simplified XML structure. In production, this would
  // be sent to a PAC (Proveedor Autorizado de Certificacion) for digital
  // signature and UUID assignment.
  const mercXml = doc.mercancias.map(m => `
      <cartaporte31:Mercancia
        BienesTransp="${m.claveProducto}"
        Descripcion="${escapeXml(m.descripcion)}"
        Cantidad="${m.cantidad}"
        ClaveUnidad="${m.claveUnidad}"
        PesoEnKg="${m.pesoKg}"
        ValorMercancia="${m.valorMercancia}"
        Moneda="${m.moneda}"
        ${m.materialPeligroso ? `MaterialPeligroso="Si" CveMaterialPeligroso="${m.cveMaterialPeligroso}"` : 'MaterialPeligroso="No"'}
        ${m.fraccionArancelaria ? `FraccionArancelaria="${m.fraccionArancelaria}"` : ''}
      />`).join('');

  const ubXml = doc.ruta.ubicaciones.map(u => `
      <cartaporte31:Ubicacion
        TipoUbicacion="${u.tipoUbicacion}"
        IDUbicacion="${u.idUbicacion}"
        RFCRemitenteDestinatario="${u.rfcRemitente}"
        NombreRemitenteDestinatario="${escapeXml(u.nombreRemitente)}"
        FechaHoraSalidaLlegada="${u.fechaHoraSalidaLlegada}"
        ${u.distanciaRecorrida ? `DistanciaRecorrida="${u.distanciaRecorrida}"` : ''}
      >
        <cartaporte31:Domicilio
          Calle="${escapeXml(u.domicilio.street)}"
          NumeroExterior="${u.domicilio.exteriorNumber}"
          Colonia="${escapeXml(u.domicilio.colonia)}"
          Municipio="${escapeXml(u.domicilio.municipio)}"
          Estado="${u.domicilio.estado}"
          Pais="${u.domicilio.pais}"
          CodigoPostal="${u.domicilio.codigoPostal}"
        />
      </cartaporte31:Ubicacion>`).join('');

  const figXml = doc.figuraTransporte.map(f => `
      <cartaporte31:TiposFigura
        TipoFigura="01"
        RFCFigura="${f.rfcFigura}"
        NombreFigura="${escapeXml(f.nombreFigura)}"
        NumLicencia="${f.numLicencia}"
      />`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante
  xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  xmlns:cartaporte31="http://www.sat.gob.mx/CartaPorte31"
  Version="4.0"
  Serie="CP"
  Folio="${doc.id}"
  Fecha="${doc.createdAt}"
  TipoDeComprobante="${doc.tipo === 'ingreso' ? 'I' : 'T'}"
>
  <cfdi:Emisor Rfc="${doc.rfcEmisor}" Nombre="${escapeXml(doc.nombreEmisor)}" RegimenFiscal="${doc.regimenFiscal}" />
  <cfdi:Receptor Rfc="${doc.rfcReceptor}" Nombre="${escapeXml(doc.nombreReceptor)}" UsoCFDI="${doc.usoCFDI}" />
  <cfdi:Complemento>
    <cartaporte31:CartaPorte
      Version="3.1"
      TranspInternac="${doc.transpInternac}"
      ${doc.entradaSalidaMerc ? `EntradaSalidaMerc="${doc.entradaSalidaMerc}"` : ''}
      ${doc.paisOrigenDestino ? `PaisOrigenDestino="${doc.paisOrigenDestino}"` : ''}
    >
      <cartaporte31:Ubicaciones>${ubXml}
      </cartaporte31:Ubicaciones>
      <cartaporte31:Mercancias
        PesoBrutoTotal="${doc.pesoTotalKg}"
        UnidadPeso="KGM"
        NumTotalMercancias="${doc.numTotalMercancias}"
      >${mercXml}
        <cartaporte31:Autotransporte
          PermSCT="${doc.vehiculo.permisoSCT}"
          NumPermisoSCT="${doc.vehiculo.numPermisoSCT}"
        >
          <cartaporte31:IdentificacionVehicular
            ConfigVehicular="${doc.vehiculo.configVehicular}"
            PlacaVM="${doc.vehiculo.placaVM}"
            AnioModeloVM="${doc.vehiculo.anioModelo}"
          />
          <cartaporte31:Seguros
            AseguraRespCivil="${escapeXml(doc.vehiculo.aseguradora)}"
            PolizaRespCivil="${doc.vehiculo.polizaSeguro}"
          />
        </cartaporte31:Autotransporte>
      </cartaporte31:Mercancias>
      <cartaporte31:FiguraTransporte>${figXml}
      </cartaporte31:FiguraTransporte>
    </cartaporte31:CartaPorte>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
