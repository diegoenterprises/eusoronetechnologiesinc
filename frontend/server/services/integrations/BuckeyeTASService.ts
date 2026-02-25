/**
 * BUCKEYE TAS INTEGRATION SERVICE
 * Terminal Automation System for Buckeye Partners-operated terminals.
 * Scheduling, allocation, loading rack management, inventory, and BOL.
 *
 * Auth: API key + Terminal ID via custom headers
 * Base: https://api.buckeyetas.com/v1/ (enterprise — requires partnership agreement)
 * Buckeye uses Emerson Synthesis TAS internally; this client targets their partner API.
 * Env: BUCKEYE_API_KEY, BUCKEYE_API_SECRET
 */

import BaseIntegrationService, { SyncResult, MappedRecord } from "./BaseIntegrationService";

// ── Types ────────────────────────────────────────────────────────────
export interface BuckeyeTerminal {
  terminalId: string;
  terminalName: string;
  city: string;
  state: string;
  padd: number;
  latitude: number;
  longitude: number;
  products: string[];
  rackCount: number;
  operatingHours: string;
  status: string;
}

export interface BuckeyeAppointment {
  appointmentId: string;
  terminalId: string;
  scheduledDate: string;
  scheduledTime: string;
  carrier: string;
  driverName: string;
  vehiclePlate: string;
  product: string;
  volumeGallons: number;
  status: "SCHEDULED" | "CHECKED_IN" | "LOADING" | "COMPLETE" | "CANCELLED" | "NO_SHOW";
  rackAssignment?: string;
  estimatedLoadTime?: number;
}

export interface BuckeyeAllocation {
  allocationId: string;
  terminalId: string;
  product: string;
  supplier: string;
  allocatedVolume: number;
  usedVolume: number;
  remainingVolume: number;
  periodStart: string;
  periodEnd: string;
  unit: string;
}

export interface BuckeyeRackStatus {
  rackId: string;
  terminalId: string;
  rackNumber: number;
  status: "AVAILABLE" | "LOADING" | "MAINTENANCE" | "RESERVED" | "OFFLINE";
  currentDriver?: string;
  currentProduct?: string;
  percentComplete?: number;
  estimatedCompletion?: string;
}

export interface BuckeyeInventory {
  terminalId: string;
  tankId: string;
  product: string;
  currentLevel: number;
  maxCapacity: number;
  utilizationPct: number;
  temperature: number;
  lastGauged: string;
  unit: string;
}

export interface BuckeyeBOL {
  bolNumber: string;
  terminalId: string;
  loadDate: string;
  carrier: string;
  driver: string;
  vehicle: string;
  product: string;
  grossVolume: number;
  netVolume: number;
  temperature: number;
  gravity: number;
  seals: string[];
  shipper: string;
  consignee: string;
  destination: string;
}

export interface BuckeyeLoadingEvent {
  eventId: string;
  terminalId: string;
  rackId: string;
  eventType: "GATE_IN" | "RACK_ASSIGN" | "LOAD_START" | "LOAD_COMPLETE" | "GATE_OUT" | "OVERFILL_ALARM" | "EMERGENCY_STOP";
  timestamp: string;
  driverName: string;
  product?: string;
  volume?: number;
  details?: string;
}

// ── Endpoint catalog ─────────────────────────────────────────────────
export const BUCKEYE_ENDPOINTS = {
  // Terminal Operations
  TERMINALS:            "/v1/terminals",
  TERMINAL_DETAIL:      "/v1/terminals/:terminalId",
  TERMINAL_STATUS:      "/v1/terminals/:terminalId/status",
  // Scheduling & Appointments
  APPOINTMENTS:         "/v1/terminals/:terminalId/appointments",
  APPOINTMENT_CREATE:   "/v1/terminals/:terminalId/appointments",
  APPOINTMENT_UPDATE:   "/v1/terminals/:terminalId/appointments/:appointmentId",
  APPOINTMENT_CANCEL:   "/v1/terminals/:terminalId/appointments/:appointmentId/cancel",
  // Allocation
  ALLOCATIONS:          "/v1/terminals/:terminalId/allocations",
  ALLOCATION_CHECK:     "/v1/terminals/:terminalId/allocations/check",
  // Rack Operations
  RACK_STATUS:          "/v1/terminals/:terminalId/racks",
  RACK_DETAIL:          "/v1/terminals/:terminalId/racks/:rackId",
  RACK_QUEUE:           "/v1/terminals/:terminalId/racks/queue",
  // Loading
  LOADING_START:        "/v1/terminals/:terminalId/loading/start",
  LOADING_STATUS:       "/v1/terminals/:terminalId/loading/:loadingId",
  LOADING_COMPLETE:     "/v1/terminals/:terminalId/loading/:loadingId/complete",
  LOADING_EVENTS:       "/v1/terminals/:terminalId/loading/events",
  // Inventory
  INVENTORY:            "/v1/terminals/:terminalId/inventory",
  INVENTORY_TANK:       "/v1/terminals/:terminalId/inventory/:tankId",
  INVENTORY_HISTORY:    "/v1/terminals/:terminalId/inventory/history",
  // BOL / Documents
  BOL_LIST:             "/v1/terminals/:terminalId/bols",
  BOL_DETAIL:           "/v1/terminals/:terminalId/bols/:bolNumber",
  BOL_GENERATE:         "/v1/terminals/:terminalId/bols/generate",
  // Gate Operations
  GATE_CHECKIN:         "/v1/terminals/:terminalId/gate/checkin",
  GATE_CHECKOUT:        "/v1/terminals/:terminalId/gate/checkout",
  GATE_QUEUE:           "/v1/terminals/:terminalId/gate/queue",
  // Driver Pre-Clearance
  DRIVER_PRECLEAR:      "/v1/terminals/:terminalId/drivers/preclear",
  DRIVER_VALIDATE:      "/v1/terminals/:terminalId/drivers/validate",
} as const;

// ── Service ──────────────────────────────────────────────────────────
export class BuckeyeTASService extends BaseIntegrationService {
  constructor() {
    super("buckeye_tas", "https://api.buckeyetas.com");
  }

  /** Make authenticated Buckeye TAS API request */
  private async request<T>(endpoint: string, options: { method?: string; body?: any; params?: Record<string, string> } = {}): Promise<T> {
    const apiKey = this.credentials.apiKey || process.env.BUCKEYE_API_KEY;
    const apiSecret = this.credentials.apiSecret || process.env.BUCKEYE_API_SECRET;
    if (!apiKey) throw new Error("Buckeye TAS API key not configured (set BUCKEYE_API_KEY)");

    const qs = options.params ? "?" + new URLSearchParams(options.params).toString() : "";
    const url = `${this.apiBaseUrl}${endpoint}${qs}`;

    const resp = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": apiKey,
        ...(apiSecret ? { "X-API-Secret": apiSecret } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });

    if (!resp.ok) throw new Error(`Buckeye TAS API ${resp.status}: ${await resp.text().catch(() => "")}`);
    return resp.json();
  }

  private ep(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) result = result.replace(`:${k}`, v);
    return result;
  }

  // ── Public data methods ────────────────────────────────────────────

  async getTerminals(): Promise<BuckeyeTerminal[]> {
    return this.request(BUCKEYE_ENDPOINTS.TERMINALS);
  }

  async getTerminalStatus(terminalId: string): Promise<{ status: string; rackAvailability: number; queueLength: number }> {
    return this.request(this.ep(BUCKEYE_ENDPOINTS.TERMINAL_STATUS, { terminalId }));
  }

  async getAppointments(terminalId: string, date?: string): Promise<BuckeyeAppointment[]> {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    return this.request(this.ep(BUCKEYE_ENDPOINTS.APPOINTMENTS, { terminalId }), { params });
  }

  async createAppointment(terminalId: string, data: { scheduledDate: string; scheduledTime: string; carrier: string; driverName: string; vehiclePlate: string; product: string; volumeGallons: number }): Promise<BuckeyeAppointment> {
    return this.request(this.ep(BUCKEYE_ENDPOINTS.APPOINTMENT_CREATE, { terminalId }), { method: "POST", body: data });
  }

  async cancelAppointment(terminalId: string, appointmentId: string): Promise<{ success: boolean }> {
    return this.request(this.ep(BUCKEYE_ENDPOINTS.APPOINTMENT_CANCEL, { terminalId, appointmentId }), { method: "POST" });
  }

  async getAllocations(terminalId: string): Promise<BuckeyeAllocation[]> {
    return this.request(this.ep(BUCKEYE_ENDPOINTS.ALLOCATIONS, { terminalId }));
  }

  async checkAllocation(terminalId: string, product: string, volume: number): Promise<{ available: boolean; remaining: number }> {
    return this.request(this.ep(BUCKEYE_ENDPOINTS.ALLOCATION_CHECK, { terminalId }), { params: { product, volume: String(volume) } });
  }

  async getRackStatus(terminalId: string): Promise<BuckeyeRackStatus[]> {
    return this.request(this.ep(BUCKEYE_ENDPOINTS.RACK_STATUS, { terminalId }));
  }

  async getInventory(terminalId: string): Promise<BuckeyeInventory[]> {
    return this.request(this.ep(BUCKEYE_ENDPOINTS.INVENTORY, { terminalId }));
  }

  async getBOLs(terminalId: string, filters: { startDate?: string; endDate?: string; carrier?: string } = {}): Promise<BuckeyeBOL[]> {
    return this.request(this.ep(BUCKEYE_ENDPOINTS.BOL_LIST, { terminalId }), { params: filters as Record<string, string> });
  }

  async getBOLDetail(terminalId: string, bolNumber: string): Promise<BuckeyeBOL> {
    return this.request(this.ep(BUCKEYE_ENDPOINTS.BOL_DETAIL, { terminalId, bolNumber }));
  }

  async getLoadingEvents(terminalId: string, limit?: number): Promise<BuckeyeLoadingEvent[]> {
    return this.request(this.ep(BUCKEYE_ENDPOINTS.LOADING_EVENTS, { terminalId }), { params: { limit: String(limit || 50) } });
  }

  async gateCheckin(terminalId: string, data: { driverName: string; vehiclePlate: string; appointmentId?: string }): Promise<{ gatePass: string; rackAssignment: string }> {
    return this.request(this.ep(BUCKEYE_ENDPOINTS.GATE_CHECKIN, { terminalId }), { method: "POST", body: data });
  }

  async preClearDriver(terminalId: string, data: { driverName: string; cdlNumber: string; cdlState: string; carrierDOT: string; hazmat: boolean; twic?: string }): Promise<{ cleared: boolean; issues: string[] }> {
    return this.request(this.ep(BUCKEYE_ENDPOINTS.DRIVER_PRECLEAR, { terminalId }), { method: "POST", body: data });
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
      externalId: r.terminalId || r.appointmentId || r.bolNumber || "",
      externalType: `buckeye_${dataType}`,
      externalData: r,
      internalTable: `buckeye_${dataType}`,
      internalData: r,
    }));
  }
}

export const buckeyeTASService = new BuckeyeTASService();
