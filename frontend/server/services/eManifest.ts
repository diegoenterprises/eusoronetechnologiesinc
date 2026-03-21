/**
 * ACE/ACI eMANIFEST SERVICE
 * Phase 2 - Cross-Border Audit
 *
 * Implements electronic manifest submission for:
 *  - ACE (Automated Commercial Environment) — US CBP, 19 CFR Part 123
 *  - ACI (Advance Commercial Information) — CBSA, D-Memo D3-5-1
 *
 * Requirements:
 *  ACE (US-bound):
 *   - Trip number, SCAC code, vehicle/driver info, shipper/consignee
 *   - Must be filed 1+ hour before arrival at US port
 *   - Real-time status: Accepted, Hold, Refused, Do Not Load
 *  ACI (Canada-bound):
 *   - Cargo control number (CCN), carrier code, shipment data
 *   - Must be filed before goods arrive at first Canadian port
 *   - PARS (Pre-Arrival Review System) number required
 *   - Real-time status: Matched, Not Matched, Referred
 */

import { logger } from '../_core/logger';

// -- Types --

export type ManifestDirection = 'US_INBOUND' | 'CA_INBOUND';
export type ACEStatus = 'draft' | 'submitted' | 'accepted' | 'hold' | 'refused' | 'do_not_load' | 'cancelled';
export type ACIStatus = 'draft' | 'submitted' | 'matched' | 'not_matched' | 'referred' | 'released' | 'cancelled';

export interface ACEManifest {
  id: string;
  tripNumber: string;           // CBP trip number
  scacCode: string;             // Standard Carrier Alpha Code (4 chars)
  portOfEntry: string;          // US port code (4 digits)
  estimatedArrival: string;     // ISO datetime
  status: ACEStatus;
  // Carrier
  carrierName: string;
  dotNumber: string;
  bondNumber?: string;
  // Vehicle
  vehicleType: 'truck' | 'rail' | 'vessel' | 'air';
  truckLicense: string;
  truckState: string;
  trailerLicense?: string;
  trailerState?: string;
  sealNumbers: string[];
  // Driver
  driverFirstName: string;
  driverLastName: string;
  driverLicenseNumber: string;
  driverLicenseState: string;
  driverCitizenship: string;    // ISO country code
  fastCardNumber?: string;      // FAST/SENTRI/NEXUS
  // Shipments
  shipments: ACEShipment[];
  // Metadata
  loadId?: number;
  submittedAt?: string;
  acceptedAt?: string;
  responseMessage?: string;
  cbpDisposition?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

export interface ACEShipment {
  shipmentControlNumber: string; // unique per shipment
  shipperName: string;
  shipperAddress: string;
  shipperCity: string;
  shipperCountry: string;       // CA or MX
  consigneeName: string;
  consigneeAddress: string;
  consigneeCity: string;
  consigneeState: string;
  consigneeZip: string;
  consigneeCountry: string;     // US
  commodities: ACECommodity[];
  weight: number;               // lbs
  weightUnit: 'LBS' | 'KGS';
  value: number;                // USD
  countryOfOrigin: string;
}

export interface ACECommodity {
  description: string;
  htsCode?: string;             // Harmonized Tariff Schedule code
  quantity: number;
  quantityUnit: string;
  weight: number;
  value: number;
  countryOfOrigin: string;
  hazmat: boolean;
  hazmatClass?: string;
  unNumber?: string;
}


export interface ACIManifest {
  id: string;
  cargoControlNumber: string;   // CCN format: SCAC + 4-digit year + 6-digit seq
  carrierCode: string;          // CBSA carrier code (4 chars)
  portOfEntry: string;          // Canadian port code
  estimatedArrival: string;     // ISO datetime
  status: ACIStatus;
  // Carrier
  carrierName: string;
  // Vehicle
  conveyanceType: 'highway' | 'rail' | 'marine' | 'air';
  truckLicense: string;
  truckJurisdiction: string;    // province code
  trailerLicense?: string;
  trailerJurisdiction?: string;
  sealNumbers: string[];
  containerNumbers: string[];
  // Driver
  driverFirstName: string;
  driverLastName: string;
  driverDateOfBirth: string;    // YYYY-MM-DD
  driverCitizenship: string;
  driverDocumentType: 'passport' | 'fast_card' | 'nexus' | 'cdl';
  driverDocumentNumber: string;
  // Shipments
  shipments: ACIShipment[];
  // PARS
  parsNumber?: string;          // Pre-Arrival Review System
  // Metadata
  loadId?: number;
  submittedAt?: string;
  matchedAt?: string;
  responseMessage?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

export interface ACIShipment {
  houseBillNumber: string;      // unique per shipment
  shipperName: string;
  shipperAddress: string;
  shipperCity: string;
  shipperCountry: string;       // US or MX
  consigneeName: string;
  consigneeAddress: string;
  consigneeCity: string;
  consigneeProvince: string;    // Canadian province
  consigneePostalCode: string;
  consigneeCountry: string;     // CA
  commodities: ACICommodity[];
  weight: number;               // kg
  weightUnit: 'KGS' | 'LBS';
  declaredValue: number;
  declaredCurrency: 'CAD' | 'USD';
  countryOfOrigin: string;
  specialInstructions?: string;
}

export interface ACICommodity {
  description: string;
  hsCode?: string;              // Harmonized System code (Canada uses HS, not HTS)
  quantity: number;
  quantityUnit: string;
  weight: number;
  undgNumber?: string;          // UN Dangerous Goods number
  dangerousGoods: boolean;
}


// -- US Port Codes (CBP Schedule D) --

export const ACE_PORTS: Record<string, { name: string; state: string; border: 'CA' | 'MX' }> = {
  '0101': { name: 'Portal', state: 'ND', border: 'CA' },
  '0104': { name: 'Pembina', state: 'ND', border: 'CA' },
  '0115': { name: 'Neche', state: 'ND', border: 'CA' },
  '0212': { name: 'Grand Portage', state: 'MN', border: 'CA' },
  '0213': { name: 'International Falls', state: 'MN', border: 'CA' },
  '0901': { name: 'Highgate Springs', state: 'VT', border: 'CA' },
  '0904': { name: 'Derby Line', state: 'VT', border: 'CA' },
  '1001': { name: 'Ogdensburg', state: 'NY', border: 'CA' },
  '0712': { name: 'Champlain', state: 'NY', border: 'CA' },
  '3802': { name: 'Buffalo-Niagara', state: 'NY', border: 'CA' },
  '3803': { name: 'Lewiston', state: 'NY', border: 'CA' },
  '0401': { name: 'Calais', state: 'ME', border: 'CA' },
  '0405': { name: 'Houlton', state: 'ME', border: 'CA' },
  '3001': { name: 'Blaine', state: 'WA', border: 'CA' },
  '3004': { name: 'Sumas', state: 'WA', border: 'CA' },
  '3005': { name: 'Lynden', state: 'WA', border: 'CA' },
  '2904': { name: 'Sweetgrass', state: 'MT', border: 'CA' },
  '2301': { name: 'Laredo', state: 'TX', border: 'MX' },
  '2304': { name: 'El Paso', state: 'TX', border: 'MX' },
  '2307': { name: 'Brownsville', state: 'TX', border: 'MX' },
  '2309': { name: 'Eagle Pass', state: 'TX', border: 'MX' },
  '2310': { name: 'Hidalgo/Pharr', state: 'TX', border: 'MX' },
  '2402': { name: 'Nogales', state: 'AZ', border: 'MX' },
  '2501': { name: 'San Ysidro', state: 'CA', border: 'MX' },
  '2503': { name: 'Otay Mesa', state: 'CA', border: 'MX' },
  '2504': { name: 'Tecate', state: 'CA', border: 'MX' },
  '2506': { name: 'Calexico', state: 'CA', border: 'MX' },
  '2601': { name: 'Columbus', state: 'NM', border: 'MX' },
  '2604': { name: 'Santa Teresa', state: 'NM', border: 'MX' },
};

// -- Canadian Port Codes (CBSA) --

export const ACI_PORTS: Record<string, { name: string; province: string }> = {
  '0404': { name: 'Emerson', province: 'MB' },
  '0421': { name: 'North Portal', province: 'SK' },
  '0445': { name: 'Coutts', province: 'AB' },
  '0449': { name: 'Kingsgate', province: 'BC' },
  '0453': { name: 'Pacific Highway', province: 'BC' },
  '0454': { name: 'Huntingdon', province: 'BC' },
  '0456': { name: 'Osoyoos', province: 'BC' },
  '0460': { name: 'Douglas/Peace Arch', province: 'BC' },
  '0402': { name: 'Fort Frances', province: 'ON' },
  '0433': { name: 'Fort Erie', province: 'ON' },
  '0434': { name: 'Queenston/Lewiston', province: 'ON' },
  '0435': { name: 'Lansdowne', province: 'ON' },
  '0438': { name: 'Prescott', province: 'ON' },
  '0439': { name: 'Cornwall', province: 'ON' },
  '0441': { name: 'Sarnia', province: 'ON' },
  '0443': { name: 'Windsor/Ambassador', province: 'ON' },
  '0498': { name: 'Lacolle', province: 'QC' },
  '0499': { name: 'Stanstead', province: 'QC' },
  '0461': { name: 'St. Stephen', province: 'NB' },
  '0467': { name: 'Woodstock', province: 'NB' },
};


// -- ID Generators --

function generateId(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

function generateTripNumber(scac: string): string {
  const seq = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  return `${scac}${seq}`;
}

function generateCCN(carrierCode: string): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  return `${carrierCode}${year}${seq}`;
}

function generatePARS(): string {
  const seq = String(Math.floor(Math.random() * 99999999)).padStart(8, '0');
  return `PARS${seq}`;
}

// -- ACE Manifest Creation (US-bound) --

export function createACEManifest(params: {
  scacCode: string;
  portOfEntry: string;
  estimatedArrival: string;
  carrierName: string;
  dotNumber: string;
  bondNumber?: string;
  truckLicense: string;
  truckState: string;
  trailerLicense?: string;
  trailerState?: string;
  sealNumbers?: string[];
  driverFirstName: string;
  driverLastName: string;
  driverLicenseNumber: string;
  driverLicenseState: string;
  driverCitizenship: string;
  fastCardNumber?: string;
  shipments: ACEShipment[];
  loadId?: number;
  createdBy: number;
}): ACEManifest {
  const now = new Date().toISOString();
  return {
    id: generateId('ACE'),
    tripNumber: generateTripNumber(params.scacCode),
    scacCode: params.scacCode,
    portOfEntry: params.portOfEntry,
    estimatedArrival: params.estimatedArrival,
    status: 'draft',
    carrierName: params.carrierName,
    dotNumber: params.dotNumber,
    bondNumber: params.bondNumber,
    vehicleType: 'truck',
    truckLicense: params.truckLicense,
    truckState: params.truckState,
    trailerLicense: params.trailerLicense,
    trailerState: params.trailerState,
    sealNumbers: params.sealNumbers || [],
    driverFirstName: params.driverFirstName,
    driverLastName: params.driverLastName,
    driverLicenseNumber: params.driverLicenseNumber,
    driverLicenseState: params.driverLicenseState,
    driverCitizenship: params.driverCitizenship,
    fastCardNumber: params.fastCardNumber,
    shipments: params.shipments,
    loadId: params.loadId,
    createdAt: now,
    updatedAt: now,
    createdBy: params.createdBy,
  };
}

// -- ACI Manifest Creation (Canada-bound) --

export function createACIManifest(params: {
  carrierCode: string;
  portOfEntry: string;
  estimatedArrival: string;
  carrierName: string;
  truckLicense: string;
  truckJurisdiction: string;
  trailerLicense?: string;
  trailerJurisdiction?: string;
  sealNumbers?: string[];
  containerNumbers?: string[];
  driverFirstName: string;
  driverLastName: string;
  driverDateOfBirth: string;
  driverCitizenship: string;
  driverDocumentType: 'passport' | 'fast_card' | 'nexus' | 'cdl';
  driverDocumentNumber: string;
  shipments: ACIShipment[];
  loadId?: number;
  createdBy: number;
}): ACIManifest {
  const now = new Date().toISOString();
  return {
    id: generateId('ACI'),
    cargoControlNumber: generateCCN(params.carrierCode),
    carrierCode: params.carrierCode,
    portOfEntry: params.portOfEntry,
    estimatedArrival: params.estimatedArrival,
    status: 'draft',
    carrierName: params.carrierName,
    conveyanceType: 'highway',
    truckLicense: params.truckLicense,
    truckJurisdiction: params.truckJurisdiction,
    trailerLicense: params.trailerLicense,
    trailerJurisdiction: params.trailerJurisdiction,
    sealNumbers: params.sealNumbers || [],
    containerNumbers: params.containerNumbers || [],
    driverFirstName: params.driverFirstName,
    driverLastName: params.driverLastName,
    driverDateOfBirth: params.driverDateOfBirth,
    driverCitizenship: params.driverCitizenship,
    driverDocumentType: params.driverDocumentType,
    driverDocumentNumber: params.driverDocumentNumber,
    shipments: params.shipments,
    parsNumber: generatePARS(),
    loadId: params.loadId,
    createdAt: now,
    updatedAt: now,
    createdBy: params.createdBy,
  };
}


// -- Validation --

export interface ManifestValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateACEManifest(manifest: ACEManifest): ManifestValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // SCAC code: 2-4 alpha characters
  if (!manifest.scacCode || !/^[A-Z]{2,4}$/.test(manifest.scacCode)) {
    errors.push('SCAC code must be 2-4 uppercase letters');
  }

  // Port of entry
  if (!ACE_PORTS[manifest.portOfEntry]) {
    errors.push(`Invalid US port code: ${manifest.portOfEntry}`);
  }

  // Estimated arrival: must be at least 1 hour in the future
  const eta = new Date(manifest.estimatedArrival);
  const minArrival = new Date(Date.now() + 60 * 60_000);
  if (eta < minArrival) {
    warnings.push('ACE manifest should be filed at least 1 hour before arrival');
  }

  // DOT number
  if (!manifest.dotNumber || manifest.dotNumber.length < 5) {
    errors.push('Valid USDOT number required');
  }

  // Vehicle
  if (!manifest.truckLicense) {
    errors.push('Truck license plate required');
  }

  // Driver
  if (!manifest.driverFirstName || !manifest.driverLastName) {
    errors.push('Driver full name required');
  }
  if (!manifest.driverLicenseNumber) {
    errors.push('Driver license number required');
  }
  if (!manifest.driverCitizenship) {
    errors.push('Driver citizenship required');
  }

  // Shipments
  if (manifest.shipments.length === 0) {
    errors.push('At least one shipment required');
  }
  for (const s of manifest.shipments) {
    if (!s.shipmentControlNumber) {
      errors.push('Each shipment must have a shipment control number');
    }
    if (!s.consigneeName || !s.consigneeAddress) {
      errors.push(`Shipment ${s.shipmentControlNumber}: US consignee name and address required`);
    }
    if (s.commodities.length === 0) {
      errors.push(`Shipment ${s.shipmentControlNumber}: at least one commodity required`);
    }
    for (const c of s.commodities) {
      if (c.hazmat && !c.unNumber) {
        errors.push(`Hazmat commodity "${c.description}" requires UN number`);
      }
    }
  }

  // FAST card recommendation
  if (!manifest.fastCardNumber) {
    warnings.push('FAST card not provided — driver may experience longer processing times');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateACIManifest(manifest: ACIManifest): ManifestValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Carrier code
  if (!manifest.carrierCode || manifest.carrierCode.length < 2) {
    errors.push('CBSA carrier code required');
  }

  // CCN format
  if (!manifest.cargoControlNumber || manifest.cargoControlNumber.length < 10) {
    errors.push('Invalid Cargo Control Number format');
  }

  // Port of entry
  if (!ACI_PORTS[manifest.portOfEntry]) {
    errors.push(`Invalid Canadian port code: ${manifest.portOfEntry}`);
  }

  // Driver
  if (!manifest.driverFirstName || !manifest.driverLastName) {
    errors.push('Driver full name required');
  }
  if (!manifest.driverDateOfBirth) {
    errors.push('Driver date of birth required for CBSA');
  }
  if (!manifest.driverDocumentNumber) {
    errors.push('Driver identification document required');
  }

  // Shipments
  if (manifest.shipments.length === 0) {
    errors.push('At least one shipment required');
  }
  for (const s of manifest.shipments) {
    if (!s.houseBillNumber) {
      errors.push('Each shipment must have a house bill number');
    }
    if (!s.consigneeProvince) {
      errors.push(`Shipment ${s.houseBillNumber}: Canadian province required`);
    }
    for (const c of s.commodities) {
      if (c.dangerousGoods && !c.undgNumber) {
        errors.push(`Dangerous goods "${c.description}" requires UNDG number`);
      }
    }
  }

  // PARS check
  if (!manifest.parsNumber) {
    warnings.push('PARS number not generated — may delay customs processing');
  }

  return { valid: errors.length === 0, errors, warnings };
}


// -- ACE XML Payload (CBP format) --

export function generateACEPayload(manifest: ACEManifest): object {
  return {
    header: {
      messageType: 'ACE_EMANIFEST',
      version: '4.3',
      timestamp: new Date().toISOString(),
      direction: 'INBOUND',
    },
    trip: {
      tripNumber: manifest.tripNumber,
      scac: manifest.scacCode,
      portOfArrival: manifest.portOfEntry,
      estimatedArrivalDate: manifest.estimatedArrival,
      usDotNumber: manifest.dotNumber,
      bondNumber: manifest.bondNumber,
    },
    conveyance: {
      type: manifest.vehicleType === 'truck' ? 'HIGHWAY' : manifest.vehicleType.toUpperCase(),
      licensePlate: manifest.truckLicense,
      licensePlateState: manifest.truckState,
      trailerLicensePlate: manifest.trailerLicense,
      trailerState: manifest.trailerState,
      sealNumbers: manifest.sealNumbers,
    },
    crew: [{
      firstName: manifest.driverFirstName,
      lastName: manifest.driverLastName,
      driversLicense: manifest.driverLicenseNumber,
      driversLicenseState: manifest.driverLicenseState,
      citizenship: manifest.driverCitizenship,
      fastCardNumber: manifest.fastCardNumber,
      crewType: 'DRIVER',
    }],
    shipments: manifest.shipments.map(s => ({
      shipmentControlNumber: s.shipmentControlNumber,
      shipper: {
        name: s.shipperName,
        address: s.shipperAddress,
        city: s.shipperCity,
        country: s.shipperCountry,
      },
      consignee: {
        name: s.consigneeName,
        address: s.consigneeAddress,
        city: s.consigneeCity,
        state: s.consigneeState,
        zip: s.consigneeZip,
        country: 'US',
      },
      commodities: s.commodities.map(c => ({
        description: c.description,
        htsCode: c.htsCode,
        quantity: c.quantity,
        quantityUnitOfMeasure: c.quantityUnit,
        weight: c.weight,
        value: c.value,
        countryOfOrigin: c.countryOfOrigin,
        hazardousMaterial: c.hazmat,
        hazardousClass: c.hazmatClass,
        unNumber: c.unNumber,
      })),
      totalWeight: s.weight,
      weightUnit: s.weightUnit,
      totalValue: s.value,
      countryOfOrigin: s.countryOfOrigin,
    })),
  };
}

// -- ACI EDI Payload (CBSA format) --

export function generateACIPayload(manifest: ACIManifest): object {
  return {
    header: {
      messageType: 'ACI_HIGHWAY_CARGO',
      version: '2.0',
      timestamp: new Date().toISOString(),
    },
    conveyance: {
      cargoControlNumber: manifest.cargoControlNumber,
      carrierCode: manifest.carrierCode,
      portOfEntry: manifest.portOfEntry,
      estimatedArrival: manifest.estimatedArrival,
      type: manifest.conveyanceType === 'highway' ? '3' : '1',
      licensePlate: manifest.truckLicense,
      jurisdiction: manifest.truckJurisdiction,
      trailerLicensePlate: manifest.trailerLicense,
      trailerJurisdiction: manifest.trailerJurisdiction,
      sealNumbers: manifest.sealNumbers,
      containerNumbers: manifest.containerNumbers,
    },
    crew: [{
      firstName: manifest.driverFirstName,
      lastName: manifest.driverLastName,
      dateOfBirth: manifest.driverDateOfBirth,
      citizenship: manifest.driverCitizenship,
      documentType: manifest.driverDocumentType,
      documentNumber: manifest.driverDocumentNumber,
    }],
    shipments: manifest.shipments.map(s => ({
      houseBillNumber: s.houseBillNumber,
      shipper: {
        name: s.shipperName,
        address: s.shipperAddress,
        city: s.shipperCity,
        country: s.shipperCountry,
      },
      consignee: {
        name: s.consigneeName,
        address: s.consigneeAddress,
        city: s.consigneeCity,
        province: s.consigneeProvince,
        postalCode: s.consigneePostalCode,
        country: 'CA',
      },
      commodities: s.commodities.map(c => ({
        description: c.description,
        hsCode: c.hsCode,
        quantity: c.quantity,
        quantityUnit: c.quantityUnit,
        weight: c.weight,
        dangerousGoods: c.dangerousGoods,
        undgNumber: c.undgNumber,
      })),
      totalWeight: s.weight,
      weightUnit: s.weightUnit,
      declaredValue: s.declaredValue,
      declaredCurrency: s.declaredCurrency,
      countryOfOrigin: s.countryOfOrigin,
    })),
    parsNumber: manifest.parsNumber,
  };
}

// -- Filing Time Check --

export function checkFilingDeadline(
  estimatedArrival: string,
  direction: ManifestDirection,
): { withinDeadline: boolean; minutesRemaining: number; message: string } {
  const eta = new Date(estimatedArrival).getTime();
  const now = Date.now();
  const minutesRemaining = Math.round((eta - now) / 60_000);

  if (direction === 'US_INBOUND') {
    // ACE: must file 1+ hour before arrival
    const deadline = 60;
    return {
      withinDeadline: minutesRemaining >= deadline,
      minutesRemaining,
      message: minutesRemaining >= deadline
        ? `ACE: ${minutesRemaining} minutes until arrival — within filing window`
        : `ACE WARNING: Only ${minutesRemaining} minutes until arrival — must file at least 60 minutes before`,
    };
  }

  // ACI: must file before arrival (recommended 1+ hour)
  const deadline = 60;
  return {
    withinDeadline: minutesRemaining >= deadline,
    minutesRemaining,
    message: minutesRemaining >= deadline
      ? `ACI: ${minutesRemaining} minutes until arrival — within filing window`
      : `ACI WARNING: Only ${minutesRemaining} minutes until arrival — file immediately`,
  };
}
