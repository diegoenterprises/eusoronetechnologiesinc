/**
 * DTN INTEGRATION CLIENT
 * Adapter pattern: IDTNClient interface — returns null when unconfigured.
 * Real DTNClientHTTP to be instantiated when DTN credentials are loaded
 * via the Integrations Portal (facilityIntelligence router).
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

// ── SINGLETON ──────────────────────────────────────────────────────
// Returns null when no DTN integration is configured.
// Real DTNClientHTTP implementation is instantiated only when a company
// has saved DTN credentials via the Integrations Portal (facilityIntelligence router).

let _client: IDTNClient | null = null;

/**
 * Get the DTN client. Returns null if no DTN integration is configured.
 * Callers must handle the null case gracefully.
 */
export function getDTNClient(): IDTNClient | null {
  return _client;
}

/**
 * Set the DTN client instance (called when DTN credentials are loaded).
 */
export function setDTNClient(client: IDTNClient): void {
  _client = client;
}
