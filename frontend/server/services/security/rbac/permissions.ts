/**
 * RBAC PERMISSIONS DEFINITIONS
 * Defines the Action + Resource + Scope permission model from
 * EusoTrip_Security_Architecture.md Section 4.2
 */

// Actions a user can perform
export type Action = "CREATE" | "READ" | "UPDATE" | "DELETE" | "APPROVE" | "EXPORT";

// Resources that can be acted upon
export type Resource =
  // Load lifecycle
  | "LOAD" | "BID" | "RATE_CONFIRMATION" | "BOL" | "POD"
  // Users & companies
  | "USER" | "COMPANY" | "DRIVER" | "VEHICLE" | "EQUIPMENT"
  // Financial
  | "WALLET" | "INVOICE" | "PAYMENT" | "REFUND" | "FACTORING_ADVANCE" | "DETENTION_CHARGE" | "ACCESSORIAL_CLAIM"
  // Location/tracking
  | "GPS_BREADCRUMB" | "GEOFENCE" | "GEOTAG" | "ROUTE"
  // Compliance
  | "COMPLIANCE_RECORD" | "AUDIT_LOG" | "SAFETY_EVENT" | "INCIDENT_REPORT"
  // Sensitive data
  | "SSN" | "BANK_ACCOUNT" | "CDL_NUMBER" | "MEDICAL_CERT"
  // Communication
  | "MESSAGE" | "CONVERSATION" | "NOTIFICATION"
  // Documents
  | "DOCUMENT" | "AGREEMENT"
  // Terminal / Supply Chain
  | "TERMINAL_PARTNER" | "SUPPLY_CHAIN_CONFIG"
  // System
  | "SYSTEM_CONFIG" | "API_KEY" | "ENCRYPTION_KEY" | "PLATFORM_FEES"
  // Gamification
  | "MISSION" | "ACHIEVEMENT" | "REWARD";

// Scope: WHO's data can they access?
export type Scope =
  | "OWN"        // Only their own data
  | "COMPANY"    // Their company's data
  | "LINKED"     // Companies they have a business relationship with
  | "PLATFORM"   // All data on the platform (admin)
  | "SYSTEM";    // System-level configuration (super admin)

export interface Permission {
  action: Action;
  resource: Resource;
  scope: Scope;
}

/**
 * Permission string format: "ACTION:RESOURCE:SCOPE"
 * Used for fast lookups in the permission map.
 */
export function permissionKey(action: Action, resource: Resource, scope: Scope): string {
  return `${action}:${resource}:${scope}`;
}

/**
 * Parse a permission string back into components.
 */
export function parsePermissionKey(key: string): Permission | null {
  const parts = key.split(":");
  if (parts.length !== 3) return null;
  return {
    action: parts[0] as Action,
    resource: parts[1] as Resource,
    scope: parts[2] as Scope,
  };
}
