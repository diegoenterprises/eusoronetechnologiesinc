/**
 * DEARMAN SYSTEMS INTEGRATION SERVICE
 * Terminal Automation & Management Software — Load authorization, inventory
 * management, order management, BOL generation, and reporting for bulk
 * liquid commodity terminals (petroleum, chemical, renewable fuels, LNG, LPG).
 *
 * Auth: API key + Account ID via custom headers
 * Base: https://api.dearmansystems.com/v5/ (TAS V5/V5+ partner API)
 * Website: https://www.dearmansystems.com/
 * Products: TAS V5 (small-medium), TAS V5+ (enterprise, unlimited integrations)
 * Env: DEARMAN_API_KEY, DEARMAN_ACCOUNT_ID
 */

import BaseIntegrationService, { SyncResult, MappedRecord } from "./BaseIntegrationService";

// ── Types ────────────────────────────────────────────────────────────
export interface DearmanTerminal {
  terminalId: string;
  terminalName: string;
  accountId: string;
  city: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  products: string[];
  rackCount: number;
  scaleCount: number;
  meterCount: number;
  operatingHours: string;
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE";
  tasVersion: string;
}

export interface DearmanLoadAuthorization {
  authorizationId: string;
  terminalId: string;
  orderId: string;
  carrier: string;
  driverName: string;
  driverId: string;
  vehiclePlate: string;
  trailerNumber: string;
  product: string;
  authorizedVolume: number;
  unit: string;
  status: "PENDING" | "AUTHORIZED" | "LOADING" | "COMPLETE" | "REJECTED" | "EXPIRED";
  authorizationTime: string;
  expirationTime: string;
  presetNumber?: number;
  rackAssignment?: string;
}

export interface DearmanOrder {
  orderId: string;
  terminalId: string;
  orderDate: string;
  shipper: string;
  consignee: string;
  carrier: string;
  product: string;
  orderedVolume: number;
  loadedVolume: number;
  remainingVolume: number;
  unit: string;
  status: "OPEN" | "PARTIAL" | "FILLED" | "CANCELLED" | "EXPIRED";
  priority: number;
  deliveryDate?: string;
  poNumber?: string;
  contractNumber?: string;
}

export interface DearmanInventory {
  terminalId: string;
  tankId: string;
  tankName: string;
  product: string;
  currentVolume: number;
  shellCapacity: number;
  availableVolume: number;
  utilizationPct: number;
  temperature: number;
  gravity: number;
  lastGauged: string;
  unit: string;
  alarmLow: number;
  alarmHigh: number;
  status: "NORMAL" | "LOW" | "HIGH" | "CRITICAL";
}

export interface DearmanTransaction {
  transactionId: string;
  terminalId: string;
  transactionDate: string;
  transactionType: "LOAD" | "UNLOAD" | "TRANSFER" | "RECEIPT" | "DELIVERY";
  product: string;
  grossVolume: number;
  netVolume: number;
  temperature: number;
  gravity: number;
  meterNumber: string;
  presetNumber: number;
  carrier: string;
  driverName: string;
  vehiclePlate: string;
  trailerNumber: string;
  sealNumbers: string[];
  startTime: string;
  endTime: string;
  duration: number;
  bolNumber?: string;
}

export interface DearmanBOL {
  bolNumber: string;
  terminalId: string;
  transactionId: string;
  loadDate: string;
  carrier: string;
  driverName: string;
  vehiclePlate: string;
  trailerNumber: string;
  product: string;
  grossVolume: number;
  netVolume: number;
  temperature: number;
  gravity: number;
  sealNumbers: string[];
  shipper: string;
  consignee: string;
  destination: string;
  poNumber?: string;
  contractNumber?: string;
  generatedAt: string;
  pdfUrl?: string;
}

export interface DearmanRackStatus {
  rackId: string;
  terminalId: string;
  rackNumber: number;
  presetNumber: number;
  status: "IDLE" | "AUTHORIZED" | "LOADING" | "COMPLETE" | "FAULT" | "MAINTENANCE";
  product?: string;
  driverName?: string;
  vehiclePlate?: string;
  percentComplete?: number;
  flowRate?: number;
  volumeLoaded?: number;
  targetVolume?: number;
  startTime?: string;
  estimatedCompletion?: string;
}

export interface DearmanGateEvent {
  eventId: string;
  terminalId: string;
  eventType: "ARRIVAL" | "DEPARTURE" | "DENIED" | "MANUAL_OVERRIDE";
  driverName: string;
  vehiclePlate: string;
  timestamp: string;
  deuDevice?: string;
  badgeNumber?: string;
  authorizationStatus: string;
}

export interface DearmanReport {
  reportId: string;
  reportType: string;
  reportName: string;
  generatedAt: string;
  format: "PDF" | "CSV" | "XLSX";
  downloadUrl: string;
  periodStart: string;
  periodEnd: string;
}

export interface DearmanContractPricing {
  contractId: string;
  terminalId: string;
  product: string;
  shipper: string;
  pricePerUnit: number;
  unit: string;
  effectiveDate: string;
  expirationDate: string;
  volumeCommitment: number;
  volumeLoaded: number;
  pricingType: "FIXED" | "INDEX_PLUS" | "RACK_MINUS" | "COST_PLUS";
  indexReference?: string;
  adjustment?: number;
}

// ── Endpoint catalog ─────────────────────────────────────────────────
export const DEARMAN_ENDPOINTS = {
  // Terminal Management
  TERMINALS:              "/v5/terminals",
  TERMINAL_DETAIL:        "/v5/terminals/:terminalId",
  TERMINAL_STATUS:        "/v5/terminals/:terminalId/status",
  // Load Authorization
  AUTHORIZATIONS:         "/v5/terminals/:terminalId/authorizations",
  AUTHORIZATION_CREATE:   "/v5/terminals/:terminalId/authorizations",
  AUTHORIZATION_DETAIL:   "/v5/terminals/:terminalId/authorizations/:authId",
  AUTHORIZATION_CANCEL:   "/v5/terminals/:terminalId/authorizations/:authId/cancel",
  // Orders
  ORDERS:                 "/v5/terminals/:terminalId/orders",
  ORDER_CREATE:           "/v5/terminals/:terminalId/orders",
  ORDER_DETAIL:           "/v5/terminals/:terminalId/orders/:orderId",
  ORDER_UPDATE:           "/v5/terminals/:terminalId/orders/:orderId",
  // Inventory / Tank Gauging
  INVENTORY:              "/v5/terminals/:terminalId/inventory",
  INVENTORY_TANK:         "/v5/terminals/:terminalId/inventory/:tankId",
  INVENTORY_HISTORY:      "/v5/terminals/:terminalId/inventory/history",
  INVENTORY_ALARMS:       "/v5/terminals/:terminalId/inventory/alarms",
  // Transactions / Measurement
  TRANSACTIONS:           "/v5/terminals/:terminalId/transactions",
  TRANSACTION_DETAIL:     "/v5/terminals/:terminalId/transactions/:transactionId",
  TRANSACTIONS_SUMMARY:   "/v5/terminals/:terminalId/transactions/summary",
  // BOL / Documents
  BOLS:                   "/v5/terminals/:terminalId/bols",
  BOL_DETAIL:             "/v5/terminals/:terminalId/bols/:bolNumber",
  BOL_GENERATE:           "/v5/terminals/:terminalId/bols/generate",
  BOL_PDF:                "/v5/terminals/:terminalId/bols/:bolNumber/pdf",
  // Rack Operations
  RACK_STATUS:            "/v5/terminals/:terminalId/racks",
  RACK_DETAIL:            "/v5/terminals/:terminalId/racks/:rackId",
  RACK_QUEUE:             "/v5/terminals/:terminalId/racks/queue",
  // Gate / DEU (Dearman Entry Unit)
  GATE_EVENTS:            "/v5/terminals/:terminalId/gate/events",
  GATE_CHECKIN:           "/v5/terminals/:terminalId/gate/checkin",
  GATE_CHECKOUT:          "/v5/terminals/:terminalId/gate/checkout",
  // Contracts & Pricing
  CONTRACTS:              "/v5/terminals/:terminalId/contracts",
  CONTRACT_DETAIL:        "/v5/terminals/:terminalId/contracts/:contractId",
  CONTRACT_PRICING:       "/v5/terminals/:terminalId/contracts/pricing",
  // Invoicing
  INVOICES:               "/v5/terminals/:terminalId/invoices",
  INVOICE_GENERATE:       "/v5/terminals/:terminalId/invoices/generate",
  // Reports
  REPORTS:                "/v5/terminals/:terminalId/reports",
  REPORT_GENERATE:        "/v5/terminals/:terminalId/reports/generate",
  REPORT_DOWNLOAD:        "/v5/terminals/:terminalId/reports/:reportId/download",
  // Webhooks
  WEBHOOKS:               "/v5/webhooks",
  WEBHOOK_CREATE:         "/v5/webhooks",
  WEBHOOK_DELETE:         "/v5/webhooks/:webhookId",
} as const;

// ── Service ──────────────────────────────────────────────────────────
export class DearmanService extends BaseIntegrationService {
  constructor() {
    super("dearman", "https://api.dearmansystems.com");
  }

  /** Make authenticated Dearman API request */
  private async request<T>(endpoint: string, options: { method?: string; body?: any; params?: Record<string, string> } = {}): Promise<T> {
    const apiKey = this.credentials.apiKey || process.env.DEARMAN_API_KEY;
    const accountId = this.credentials.externalId || process.env.DEARMAN_ACCOUNT_ID;
    if (!apiKey) throw new Error("Dearman API key not configured (set DEARMAN_API_KEY)");

    const qs = options.params ? "?" + new URLSearchParams(options.params).toString() : "";
    const url = `${this.apiBaseUrl}${endpoint}${qs}`;

    const resp = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": apiKey,
        ...(accountId ? { "X-Account-ID": accountId } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });

    if (!resp.ok) throw new Error(`Dearman API ${resp.status}: ${await resp.text().catch(() => "")}`);
    return resp.json();
  }

  private ep(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) result = result.replace(`:${k}`, v);
    return result;
  }

  // ── Public data methods ────────────────────────────────────────────

  async getTerminals(): Promise<DearmanTerminal[]> {
    return this.request(DEARMAN_ENDPOINTS.TERMINALS);
  }

  async getTerminalStatus(terminalId: string): Promise<DearmanTerminal> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.TERMINAL_STATUS, { terminalId }));
  }

  async getAuthorizations(terminalId: string, filters: { status?: string; date?: string } = {}): Promise<DearmanLoadAuthorization[]> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.AUTHORIZATIONS, { terminalId }), { params: filters as Record<string, string> });
  }

  async createAuthorization(terminalId: string, data: { orderId: string; carrier: string; driverName: string; driverId: string; vehiclePlate: string; trailerNumber: string; product: string; volume: number }): Promise<DearmanLoadAuthorization> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.AUTHORIZATION_CREATE, { terminalId }), { method: "POST", body: data });
  }

  async cancelAuthorization(terminalId: string, authId: string): Promise<{ success: boolean }> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.AUTHORIZATION_CANCEL, { terminalId, authId }), { method: "POST" });
  }

  async getOrders(terminalId: string, filters: { status?: string; shipper?: string; startDate?: string; endDate?: string } = {}): Promise<DearmanOrder[]> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.ORDERS, { terminalId }), { params: filters as Record<string, string> });
  }

  async createOrder(terminalId: string, data: Partial<DearmanOrder>): Promise<DearmanOrder> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.ORDER_CREATE, { terminalId }), { method: "POST", body: data });
  }

  async getInventory(terminalId: string): Promise<DearmanInventory[]> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.INVENTORY, { terminalId }));
  }

  async getInventoryHistory(terminalId: string, tankId: string, startDate: string, endDate: string): Promise<DearmanInventory[]> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.INVENTORY_HISTORY, { terminalId }), { params: { tankId, startDate, endDate } });
  }

  async getInventoryAlarms(terminalId: string): Promise<{ tankId: string; alarmType: string; value: number; threshold: number; timestamp: string }[]> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.INVENTORY_ALARMS, { terminalId }));
  }

  async getTransactions(terminalId: string, filters: { startDate?: string; endDate?: string; product?: string; carrier?: string; limit?: number } = {}): Promise<DearmanTransaction[]> {
    const params: Record<string, string> = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.product) params.product = filters.product;
    if (filters.carrier) params.carrier = filters.carrier;
    if (filters.limit) params.limit = String(filters.limit);
    return this.request(this.ep(DEARMAN_ENDPOINTS.TRANSACTIONS, { terminalId }), { params });
  }

  async getTransactionSummary(terminalId: string, startDate: string, endDate: string): Promise<{ product: string; totalGross: number; totalNet: number; transactionCount: number; unit: string }[]> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.TRANSACTIONS_SUMMARY, { terminalId }), { params: { startDate, endDate } });
  }

  async getBOLs(terminalId: string, filters: { startDate?: string; endDate?: string; carrier?: string } = {}): Promise<DearmanBOL[]> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.BOLS, { terminalId }), { params: filters as Record<string, string> });
  }

  async getBOLDetail(terminalId: string, bolNumber: string): Promise<DearmanBOL> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.BOL_DETAIL, { terminalId, bolNumber }));
  }

  async generateBOL(terminalId: string, transactionId: string): Promise<DearmanBOL> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.BOL_GENERATE, { terminalId }), { method: "POST", body: { transactionId } });
  }

  async getRackStatus(terminalId: string): Promise<DearmanRackStatus[]> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.RACK_STATUS, { terminalId }));
  }

  async getRackQueue(terminalId: string): Promise<{ position: number; driverName: string; product: string; estimatedWait: number }[]> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.RACK_QUEUE, { terminalId }));
  }

  async getGateEvents(terminalId: string, filters: { startDate?: string; endDate?: string; limit?: number } = {}): Promise<DearmanGateEvent[]> {
    const params: Record<string, string> = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.limit) params.limit = String(filters.limit);
    return this.request(this.ep(DEARMAN_ENDPOINTS.GATE_EVENTS, { terminalId }), { params });
  }

  async gateCheckin(terminalId: string, data: { driverName: string; vehiclePlate: string; badgeNumber?: string }): Promise<{ success: boolean; authorizationStatus: string; rackAssignment?: string }> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.GATE_CHECKIN, { terminalId }), { method: "POST", body: data });
  }

  async getContracts(terminalId: string): Promise<DearmanContractPricing[]> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.CONTRACTS, { terminalId }));
  }

  async getContractPricing(terminalId: string, product?: string): Promise<DearmanContractPricing[]> {
    const params: Record<string, string> = {};
    if (product) params.product = product;
    return this.request(this.ep(DEARMAN_ENDPOINTS.CONTRACT_PRICING, { terminalId }), { params });
  }

  async getReports(terminalId: string): Promise<DearmanReport[]> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.REPORTS, { terminalId }));
  }

  async generateReport(terminalId: string, data: { reportType: string; periodStart: string; periodEnd: string; format: "PDF" | "CSV" | "XLSX" }): Promise<DearmanReport> {
    return this.request(this.ep(DEARMAN_ENDPOINTS.REPORT_GENERATE, { terminalId }), { method: "POST", body: data });
  }

  async configureWebhook(data: { url: string; events: string[]; secret: string }): Promise<{ webhookId: string; status: string }> {
    return this.request(DEARMAN_ENDPOINTS.WEBHOOK_CREATE, { method: "POST", body: data });
  }

  // ── BaseIntegrationService abstract implementations ────────────────

  async testConnection(): Promise<boolean> {
    try { await this.getTerminals(); return true; } catch { return false; }
  }

  async fetchData(dataTypes?: string[]): Promise<SyncResult> {
    const result: SyncResult = { success: true, recordsFetched: 0, recordsCreated: 0, recordsUpdated: 0, recordsFailed: 0, errors: [] };
    try {
      const terminals = await this.getTerminals();
      result.recordsFetched += terminals.length;
    } catch (e: any) { result.errors.push(e.message); result.success = false; }
    return result;
  }

  mapToInternal(externalData: unknown, dataType: string): MappedRecord[] {
    const records = Array.isArray(externalData) ? externalData : [externalData];
    return records.map(r => ({
      externalId: r.terminalId || r.authorizationId || r.orderId || r.bolNumber || r.transactionId || "",
      externalType: `dearman_${dataType}`,
      externalData: r,
      internalTable: `dearman_${dataType}`,
      internalData: r,
    }));
  }
}

export const dearmanService = new DearmanService();
