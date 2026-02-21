/**
 * DTN INTEGRATION CLIENT
 * Adapter pattern: IDTNClient interface + DTNClientMock for development.
 * Production DTNClientHTTP to be implemented after DTN partnership established.
 * All DTN API keys are AES-256-GCM encrypted (Tier 1 RESTRICTED).
 */

// ── TYPES ──────────────────────────────────────────────────────────

export interface DTNCredentials {
  terminalId: string;
  apiKey: string;
  environment: "sandbox" | "production";
}

export interface DTNAllocation {
  terminalId: string;
  product: string;
  allocatedVolume: number;
  usedVolume: number;
  remainingVolume: number;
  unit: string;
  periodStart: string;
  periodEnd: string;
}

export interface DTNCreditCheck {
  carrierId: string;
  terminalId: string;
  authorized: boolean;
  creditLimit: number;
  availableCredit: number;
  reason?: string;
}

export interface DTNLoadingProgress {
  loadingId: string;
  dockId: string;
  product: string;
  percentComplete: number;
  gallonsLoaded: number;
  targetGallons: number;
  estimatedCompletion: string;
  status: "IN_PROGRESS" | "COMPLETE" | "ERROR" | "PAUSED";
}

export interface DTNBOLData {
  bolNumber: string;
  terminalId: string;
  product: string;
  quantity: number;
  unit: string;
  seals: string[];
  shipper: string;
  consignee: string;
  carrier: string;
  driverName: string;
  vehiclePlate: string;
  loadedAt: string;
}

export interface DTNInventory {
  terminalId: string;
  product: string;
  currentLevel: number;
  maxCapacity: number;
  percentFull: number;
  unit: string;
  lastUpdated: string;
}

export interface DTNRackPrice {
  terminalId: string;
  product: string;
  supplierName: string;
  grossPrice: number;
  netPrice: number;
  taxes: number;
  effectiveDate: string;
  unit: string;
}

export interface DTNDriverClearance {
  driverId: string;
  driverName: string;
  cdlNumber: string;
  cdlState: string;
  hazmatEndorsement: boolean;
  hazmatExpiry?: string;
  twicNumber?: string;
  twicExpiry?: string;
  medicalCertExpiry?: string;
  carrierDOT: string;
  carrierMC: string;
  insuranceExpiry?: string;
}

export interface DTNClearanceResult {
  authorized: boolean;
  issues: string[];
  preClearedGate?: string;
}

// ── INTERFACE ──────────────────────────────────────────────────────

export interface IDTNClient {
  authenticate(credentials: DTNCredentials): Promise<{ token: string; expiresAt: string }>;

  // TABS (Allocation + Credit + Billing)
  getTerminalAllocation(terminalId: string, product: string): Promise<DTNAllocation>;
  checkCredit(carrierId: string, terminalId: string): Promise<DTNCreditCheck>;

  // Guardian3 (Gate + Loading + BOL)
  sendDriverPreClearance(data: DTNDriverClearance): Promise<DTNClearanceResult>;
  notifyArrival(terminalId: string, loadId: string, driverName: string): Promise<void>;
  notifyDeparture(terminalId: string, loadId: string): Promise<void>;
  getLoadingProgress(loadingId: string): Promise<DTNLoadingProgress>;

  // TIMS (Inventory)
  getInventoryLevels(terminalId: string): Promise<DTNInventory[]>;

  // Fuel Buyer (Pricing)
  getRackPricing(terminalId: string, product?: string): Promise<DTNRackPrice[]>;
}

// ── MOCK CLIENT (realistic fake data) ──────────────────────────────

const PRODUCTS = ["GASOLINE", "DIESEL", "JET_FUEL", "ETHANOL", "HEATING_OIL"];
const SUPPLIERS = ["Valero", "Phillips 66", "Marathon", "Chevron", "Shell", "ExxonMobil", "BP"];

export class DTNClientMock implements IDTNClient {
  async authenticate(_creds: DTNCredentials) {
    return { token: "mock-token-" + Date.now(), expiresAt: new Date(Date.now() + 3600000).toISOString() };
  }

  async getTerminalAllocation(terminalId: string, product: string): Promise<DTNAllocation> {
    const allocated = 50000 + Math.floor(Math.random() * 100000);
    const used = Math.floor(allocated * (0.3 + Math.random() * 0.5));
    return {
      terminalId, product,
      allocatedVolume: allocated,
      usedVolume: used,
      remainingVolume: allocated - used,
      unit: "gallons",
      periodStart: new Date().toISOString().split("T")[0],
      periodEnd: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    };
  }

  async checkCredit(carrierId: string, terminalId: string): Promise<DTNCreditCheck> {
    const limit = 100000 + Math.floor(Math.random() * 400000);
    const available = Math.floor(limit * (0.4 + Math.random() * 0.5));
    return {
      carrierId, terminalId,
      authorized: true,
      creditLimit: limit,
      availableCredit: available,
    };
  }

  async sendDriverPreClearance(_data: DTNDriverClearance): Promise<DTNClearanceResult> {
    return { authorized: true, issues: [], preClearedGate: "GATE-A" };
  }

  async notifyArrival(_terminalId: string, _loadId: string, _driverName: string) {}
  async notifyDeparture(_terminalId: string, _loadId: string) {}

  async getLoadingProgress(loadingId: string): Promise<DTNLoadingProgress> {
    const pct = Math.floor(Math.random() * 100);
    const target = 8000 + Math.floor(Math.random() * 2000);
    return {
      loadingId, dockId: "DOCK-" + (1 + Math.floor(Math.random() * 8)),
      product: PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)],
      percentComplete: pct, gallonsLoaded: Math.floor(target * pct / 100),
      targetGallons: target,
      estimatedCompletion: new Date(Date.now() + (100 - pct) * 30000).toISOString(),
      status: pct >= 100 ? "COMPLETE" : "IN_PROGRESS",
    };
  }

  async getInventoryLevels(terminalId: string): Promise<DTNInventory[]> {
    return PRODUCTS.slice(0, 3 + Math.floor(Math.random() * 3)).map(product => {
      const max = 500000 + Math.floor(Math.random() * 2000000);
      const current = Math.floor(max * (0.2 + Math.random() * 0.7));
      return {
        terminalId, product,
        currentLevel: current, maxCapacity: max,
        percentFull: Math.round(current / max * 100),
        unit: "barrels",
        lastUpdated: new Date().toISOString(),
      };
    });
  }

  async getRackPricing(terminalId: string, product?: string): Promise<DTNRackPrice[]> {
    const prods = product ? [product] : PRODUCTS.slice(0, 4);
    const prices: DTNRackPrice[] = [];
    for (const p of prods) {
      const base = p === "GASOLINE" ? 2.20 : p === "DIESEL" ? 2.45 : p === "JET_FUEL" ? 2.80 : p === "ETHANOL" ? 1.90 : 2.10;
      for (const sup of SUPPLIERS.slice(0, 2 + Math.floor(Math.random() * 3))) {
        const variation = (Math.random() - 0.5) * 0.30;
        const gross = Math.round((base + variation) * 1000) / 1000;
        const taxes = Math.round(gross * 0.18 * 1000) / 1000;
        prices.push({
          terminalId, product: p, supplierName: sup,
          grossPrice: gross, netPrice: Math.round((gross - taxes) * 1000) / 1000,
          taxes, effectiveDate: new Date().toISOString(), unit: "$/gallon",
        });
      }
    }
    return prices;
  }
}

// ── SINGLETON ──────────────────────────────────────────────────────

let _client: IDTNClient | null = null;
export function getDTNClient(): IDTNClient {
  if (!_client) _client = new DTNClientMock();
  return _client;
}
