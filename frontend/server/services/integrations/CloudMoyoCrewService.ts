/**
 * CLOUDMOYO CREW MANAGEMENT INTEGRATION SERVICE
 * Railroad crew hours-of-service, assignments, availability,
 * duty status reporting, and certification tracking.
 *
 * Auth: API key as Authorization Bearer token
 * Base: https://api.cloudmoyo.com/crew/v1
 * Env: CLOUDMOYO_API_KEY
 */

import { logger } from "../../_core/logger";

// ── Types ────────────────────────────────────────────────────────────

export type DutyStatus = "on_duty" | "off_duty" | "rest";

export interface HOSViolation {
  violationId: string;
  violationType: string;
  description: string;
  severity: "WARNING" | "MINOR" | "SERIOUS" | "CRITICAL";
  dateOccurred: string;
  hoursOver: number;
  regulation: string;
  corrective: string | null;
}

export interface CrewHOSResult {
  crewMemberId: string;
  crewMemberName: string;
  role: "ENGINEER" | "CONDUCTOR" | "TRAINMASTER" | "BRAKEMAN";
  currentStatus: DutyStatus;
  hoursOnDuty: number;
  hoursAvailable: number;
  restRequired: number;
  lastReportTime: string;
  shiftStart: string | null;
  maxAllowedHours: number;
  violations: HOSViolation[];
  fraComplianceStatus: "COMPLIANT" | "WARNING" | "NON_COMPLIANT";
  consecutiveDaysWorked: number;
  monthlyHoursWorked: number;
  monthlyHoursRemaining: number;
}

export interface TrainConsist {
  locomotiveId: string;
  locomotiveModel: string;
  position: number;
  status: "ACTIVE" | "TRAILING" | "DEAD_IN_TOW";
}

export interface CrewAssignment {
  assignmentId: string;
  trainSymbol: string;
  trainId: string;
  role: "ENGINEER" | "CONDUCTOR";
  status: "CURRENT" | "UPCOMING" | "COMPLETED" | "CANCELLED";
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  originYard: string;
  destinationYard: string;
  subdivision: string;
  consist: TrainConsist[];
}

export interface CrewAssignmentsResult {
  crewMemberId: string;
  crewMemberName: string;
  currentAssignment: CrewAssignment | null;
  upcomingAssignments: CrewAssignment[];
  completedRecent: CrewAssignment[];
}

export interface AvailableCrewMember {
  crewMemberId: string;
  name: string;
  role: "ENGINEER" | "CONDUCTOR";
  hoursRemaining: number;
  qualifications: string[];
  certifications: string[];
  seniority: number;
  boardPosition: number;
  estimatedCallTime: string;
  restStatus: "RESTED" | "RESTING" | "ON_DUTY";
}

export interface CrewAvailabilityResult {
  yardId: string;
  yardName: string;
  railroad: string;
  engineers: AvailableCrewMember[];
  conductors: AvailableCrewMember[];
  totalAvailable: number;
  totalOnDuty: number;
  totalResting: number;
  asOf: string;
}

export interface DutyStatusUpdateResult {
  crewMemberId: string;
  previousStatus: DutyStatus;
  newStatus: DutyStatus;
  effectiveTime: string;
  hoursOnDuty: number;
  hoursAvailable: number;
  restRequired: number;
  acknowledged: boolean;
}

export interface CrewCertification {
  certificationId: string;
  certType: string;
  description: string;
  issuedDate: string;
  expiryDate: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "SUSPENDED";
  issuingAuthority: string;
  requiredTraining: RequiredTraining[];
}

export interface RequiredTraining {
  trainingId: string;
  trainingName: string;
  dueDate: string;
  completedDate: string | null;
  status: "COMPLETED" | "DUE" | "OVERDUE";
  hoursRequired: number;
}

export interface CrewCertificationsResult {
  crewMemberId: string;
  crewMemberName: string;
  certifications: CrewCertification[];
  overallStatus: "CURRENT" | "ACTION_REQUIRED" | "NON_COMPLIANT";
  nextExpiringCert: CrewCertification | null;
}

// ── Endpoint catalog ─────────────────────────────────────────────────

export const CLOUDMOYO_ENDPOINTS = {
  CREW_HOS:           "/crew/{CREW_ID}/hos",
  CREW_ASSIGNMENTS:   "/crew/{CREW_ID}/assignments",
  CREW_AVAILABILITY:  "/yards/{YARD_ID}/crew-availability",
  DUTY_STATUS:        "/crew/{CREW_ID}/duty-status",
  CERTIFICATIONS:     "/crew/{CREW_ID}/certifications",
} as const;

// ── Service ──────────────────────────────────────────────────────────

const CLOUDMOYO_BASE_URL = "https://api.cloudmoyo.com/crew/v1";

export class CloudMoyoCrewService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.CLOUDMOYO_API_KEY || "";
    this.baseUrl = CLOUDMOYO_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; params?: Record<string, string>; body?: unknown } = {},
  ): Promise<T | null> {
    if (!this.apiKey) {
      logger.error("[CloudMoyoCrew] CLOUDMOYO_API_KEY not configured");
      return null;
    }

    const { method = "GET", params = {}, body } = options;
    const qs = Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : "";
    const url = `${this.baseUrl}${endpoint}${qs}`;

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      };
      const fetchOptions: RequestInit = { method, headers, signal: AbortSignal.timeout(15_000) };

      if (body) {
        headers["Content-Type"] = "application/json";
        fetchOptions.body = JSON.stringify(body);
      }

      const resp = await fetch(url, fetchOptions);

      if (!resp.ok) {
        const respBody = await resp.text().catch(() => "");
        logger.error(`[CloudMoyoCrew] API error ${resp.status}: ${respBody}`);
        return null;
      }

      return (await resp.json()) as T;
    } catch (err: any) {
      logger.error(`[CloudMoyoCrew] Request failed: ${err.message}`);
      return null;
    }
  }

  private ep(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) result = result.replace(`{${k}}`, encodeURIComponent(v));
    return result;
  }

  // ── Public methods ─────────────────────────────────────────────────

  async getCrewHOS(crewMemberId: string): Promise<CrewHOSResult | null> {
    logger.info(`[CloudMoyoCrew] Fetching HOS for crew member ${crewMemberId}`);
    return this.request<CrewHOSResult>(
      this.ep(CLOUDMOYO_ENDPOINTS.CREW_HOS, { CREW_ID: crewMemberId })
    );
  }

  async getCrewAssignments(crewMemberId: string): Promise<CrewAssignmentsResult | null> {
    logger.info(`[CloudMoyoCrew] Fetching assignments for crew member ${crewMemberId}`);
    return this.request<CrewAssignmentsResult>(
      this.ep(CLOUDMOYO_ENDPOINTS.CREW_ASSIGNMENTS, { CREW_ID: crewMemberId })
    );
  }

  async getCrewAvailability(yardId: string): Promise<CrewAvailabilityResult | null> {
    logger.info(`[CloudMoyoCrew] Fetching crew availability for yard ${yardId}`);
    return this.request<CrewAvailabilityResult>(
      this.ep(CLOUDMOYO_ENDPOINTS.CREW_AVAILABILITY, { YARD_ID: yardId })
    );
  }

  async reportDutyStatus(crewMemberId: string, status: DutyStatus): Promise<DutyStatusUpdateResult | null> {
    logger.info(`[CloudMoyoCrew] Reporting duty status '${status}' for crew member ${crewMemberId}`);
    return this.request<DutyStatusUpdateResult>(
      this.ep(CLOUDMOYO_ENDPOINTS.DUTY_STATUS, { CREW_ID: crewMemberId }),
      {
        method: "PUT",
        body: { status, reportedAt: new Date().toISOString() },
      },
    );
  }

  async getCertifications(crewMemberId: string): Promise<CrewCertificationsResult | null> {
    logger.info(`[CloudMoyoCrew] Fetching certifications for crew member ${crewMemberId}`);
    return this.request<CrewCertificationsResult>(
      this.ep(CLOUDMOYO_ENDPOINTS.CERTIFICATIONS, { CREW_ID: crewMemberId })
    );
  }
}

export const cloudMoyoCrewService = new CloudMoyoCrewService();
