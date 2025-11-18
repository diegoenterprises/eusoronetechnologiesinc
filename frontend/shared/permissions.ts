/**
 * EusoTrip Role-Based Access Control (RBAC) System
 * 
 * This module defines the complete permission matrix for all 10 user roles,
 * implementing enterprise-grade access control with feature-level granularity.
 */

export type UserRole =
  | "SHIPPER"
  | "CARRIER"
  | "DRIVER"
  | "BROKER"
  | "TERMINAL_MANAGER"
  | "ESCORT"
  | "CATALYST"
  | "COMPLIANCE_OFFICER"
  | "SAFETY_MANAGER"
  | "ADMIN"
  | "SUPER_ADMIN";

export type Permission =
  // Load Management
  | "loads:create"
  | "loads:view"
  | "loads:edit"
  | "loads:delete"
  | "loads:assign"
  
  // Bid Management
  | "bids:create"
  | "bids:view"
  | "bids:accept"
  | "bids:reject"
  
  // Fleet Management
  | "fleet:view"
  | "fleet:manage"
  | "fleet:assign_drivers"
  
  // Driver Management
  | "drivers:view"
  | "drivers:manage"
  | "drivers:assign"
  
  // Tracking
  | "tracking:view_own"
  | "tracking:view_all"
  | "tracking:update"
  
  // Terminal Operations
  | "terminal:view"
  | "terminal:manage"
  | "terminal:schedule"
  
  // Escort Services
  | "escort:view_requests"
  | "escort:bid"
  | "escort:manage_routes"
  
  // Compliance
  | "compliance:view"
  | "compliance:review"
  | "compliance:approve"
  | "compliance:audit"
  
  // Safety
  | "safety:view"
  | "safety:manage_incidents"
  | "safety:manage_protocols"
  | "safety:conduct_audits"
  
  // Wallet & Payments
  | "wallet:view"
  | "wallet:transact"
  | "wallet:manage"
  
  // Analytics
  | "analytics:view_own"
  | "analytics:view_all"
  | "analytics:export"
  
  // User Management
  | "users:view"
  | "users:manage"
  | "users:delete"
  
  // Company Management
  | "company:view"
  | "company:manage"
  | "company:delete"
  
  // System Administration
  | "system:configure"
  | "system:view_logs"
  | "system:manage_roles"
  
  // Documents
  | "documents:view"
  | "documents:upload"
  | "documents:approve"
  | "documents:delete"
  
  // Messages
  | "messages:send"
  | "messages:view"
  | "messages:broadcast"
  
  // ZEUN Mechanics
  | "zeun:report_breakdown"
  | "zeun:view_diagnostics"
  | "zeun:search_providers"
  | "zeun:manage_maintenance";

/**
 * Complete Role-Based Permission Matrix
 * 
 * Defines exactly which permissions each role has access to.
 * Based on the authoritative EusotripUserRolesandPermissions.md document.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SHIPPER: [
    "loads:create",
    "loads:view",
    "loads:edit",
    "bids:view",
    "bids:accept",
    "bids:reject",
    "tracking:view_own",
    "compliance:view",
    "wallet:view",
    "wallet:transact",
    "analytics:view_own",
    "documents:view",
    "documents:upload",
    "messages:send",
    "messages:view",
  ],

  CARRIER: [
    "loads:view",
    "bids:create",
    "bids:view",
    "fleet:view",
    "fleet:manage",
    "fleet:assign_drivers",
    "drivers:view",
    "drivers:manage",
    "drivers:assign",
    "tracking:view_own",
    "compliance:view",
    "safety:view",
    "wallet:view",
    "wallet:transact",
    "analytics:view_own",
    "documents:view",
    "documents:upload",
    "messages:send",
    "messages:view",
    "zeun:report_breakdown",
    "zeun:view_diagnostics",
    "zeun:search_providers",
    "zeun:manage_maintenance",
  ],

  DRIVER: [
    "loads:view",
    "tracking:view_own",
    "tracking:update",
    "compliance:view",
    "safety:view",
    "wallet:view",
    "documents:view",
    "documents:upload",
    "messages:send",
    "messages:view",
    "zeun:report_breakdown",
    "zeun:view_diagnostics",
    "zeun:search_providers",
  ],

  BROKER: [
    "loads:create",
    "loads:view",
    "loads:edit",
    "bids:create",
    "bids:view",
    "bids:accept",
    "bids:reject",
    "tracking:view_own",
    "compliance:view",
    "wallet:view",
    "wallet:transact",
    "analytics:view_own",
    "documents:view",
    "documents:upload",
    "messages:send",
    "messages:view",
  ],

  TERMINAL_MANAGER: [
    "loads:view",
    "tracking:view_own",
    "terminal:view",
    "terminal:manage",
    "terminal:schedule",
    "compliance:view",
    "safety:view",
    "wallet:view",
    "analytics:view_own",
    "documents:view",
    "documents:upload",
    "messages:send",
    "messages:view",
  ],

  ESCORT: [
    "loads:view",
    "bids:create",
    "bids:view",
    "escort:view_requests",
    "escort:bid",
    "escort:manage_routes",
    "fleet:view",
    "fleet:manage",
    "tracking:view_own",
    "compliance:view",
    "safety:view",
    "wallet:view",
    "wallet:transact",
    "documents:view",
    "documents:upload",
    "messages:send",
    "messages:view",
  ],

  CATALYST: [
    "loads:create",
    "loads:view",
    "loads:edit",
    "loads:assign",
    "tracking:view_own",
    "compliance:view",
    "compliance:review",
    "wallet:view",
    "wallet:transact",
    "analytics:view_own",
    "documents:view",
    "documents:upload",
    "documents:approve",
    "messages:send",
    "messages:view",
  ],

  COMPLIANCE_OFFICER: [
    "loads:view",
    "tracking:view_all",
    "compliance:view",
    "compliance:review",
    "compliance:approve",
    "compliance:audit",
    "analytics:view_all",
    "documents:view",
    "documents:approve",
    "documents:delete",
    "messages:send",
    "messages:view",
    "messages:broadcast",
  ],

  SAFETY_MANAGER: [
    "loads:view",
    "tracking:view_all",
    "compliance:view",
    "safety:view",
    "safety:manage_incidents",
    "safety:manage_protocols",
    "safety:conduct_audits",
    "analytics:view_all",
    "documents:view",
    "documents:upload",
    "messages:send",
    "messages:view",
    "messages:broadcast",
  ],

  ADMIN: [
    "loads:create",
    "loads:view",
    "loads:edit",
    "loads:delete",
    "loads:assign",
    "bids:create",
    "bids:view",
    "bids:accept",
    "bids:reject",
    "fleet:view",
    "fleet:manage",
    "fleet:assign_drivers",
    "drivers:view",
    "drivers:manage",
    "drivers:assign",
    "tracking:view_all",
    "terminal:view",
    "terminal:manage",
    "terminal:schedule",
    "escort:view_requests",
    "escort:bid",
    "escort:manage_routes",
    "compliance:view",
    "compliance:review",
    "compliance:approve",
    "compliance:audit",
    "safety:view",
    "safety:manage_incidents",
    "safety:manage_protocols",
    "safety:conduct_audits",
    "wallet:view",
    "wallet:transact",
    "wallet:manage",
    "analytics:view_all",
    "analytics:export",
    "users:view",
    "users:manage",
    "company:view",
    "company:manage",
    "documents:view",
    "documents:upload",
    "documents:approve",
    "documents:delete",
    "messages:send",
    "messages:view",
    "messages:broadcast",
    "zeun:report_breakdown",
    "zeun:view_diagnostics",
    "zeun:search_providers",
    "zeun:manage_maintenance",
  ],

  SUPER_ADMIN: [
    "loads:create",
    "loads:view",
    "loads:edit",
    "loads:delete",
    "loads:assign",
    "bids:create",
    "bids:view",
    "bids:accept",
    "bids:reject",
    "fleet:view",
    "fleet:manage",
    "fleet:assign_drivers",
    "drivers:view",
    "drivers:manage",
    "drivers:assign",
    "tracking:view_all",
    "terminal:view",
    "terminal:manage",
    "terminal:schedule",
    "escort:view_requests",
    "escort:bid",
    "escort:manage_routes",
    "compliance:view",
    "compliance:review",
    "compliance:approve",
    "compliance:audit",
    "safety:view",
    "safety:manage_incidents",
    "safety:manage_protocols",
    "safety:conduct_audits",
    "wallet:view",
    "wallet:transact",
    "wallet:manage",
    "analytics:view_all",
    "analytics:export",
    "users:view",
    "users:manage",
    "users:delete",
    "company:view",
    "company:manage",
    "company:delete",
    "system:configure",
    "system:view_logs",
    "system:manage_roles",
    "documents:view",
    "documents:upload",
    "documents:approve",
    "documents:delete",
    "messages:send",
    "messages:view",
    "messages:broadcast",
    "zeun:report_breakdown",
    "zeun:view_diagnostics",
    "zeun:search_providers",
    "zeun:manage_maintenance",
  ],
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole | string, permission: Permission): boolean {
  const normalizedRole = String(role).toUpperCase() as UserRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Check if a user role has ANY of the specified permissions
 */
export function hasAnyPermission(role: UserRole | string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a user role has ALL of the specified permissions
 */
export function hasAllPermissions(role: UserRole | string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(role: UserRole | string): Permission[] {
  const normalizedRole = String(role).toUpperCase() as UserRole;
  return ROLE_PERMISSIONS[normalizedRole] || [];
}

/**
 * Feature-level access control helpers
 */
export const FeatureAccess = {
  canCreateLoads: (role: UserRole | string) => hasPermission(role, "loads:create"),
  canViewLoads: (role: UserRole | string) => hasPermission(role, "loads:view"),
  canSubmitBids: (role: UserRole | string) => hasPermission(role, "bids:create"),
  canManageFleet: (role: UserRole | string) => hasPermission(role, "fleet:manage"),
  canManageTerminal: (role: UserRole | string) => hasPermission(role, "terminal:manage"),
  canApproveCompliance: (role: UserRole | string) => hasPermission(role, "compliance:approve"),
  canManageSafety: (role: UserRole | string) => hasPermission(role, "safety:manage_incidents"),
  canManageUsers: (role: UserRole | string) => hasPermission(role, "users:manage"),
  canConfigureSystem: (role: UserRole | string) => hasPermission(role, "system:configure"),
  canUseZeun: (role: UserRole | string) => hasPermission(role, "zeun:report_breakdown"),
};

/**
 * UI visibility helpers - determine which UI elements to show/hide
 */
export const UIVisibility = {
  showCreateLoadButton: (role: UserRole | string) => FeatureAccess.canCreateLoads(role),
  showBidButton: (role: UserRole | string) => FeatureAccess.canSubmitBids(role),
  showFleetManagement: (role: UserRole | string) => FeatureAccess.canManageFleet(role),
  showTerminalOperations: (role: UserRole | string) => FeatureAccess.canManageTerminal(role),
  showComplianceApproval: (role: UserRole | string) => FeatureAccess.canApproveCompliance(role),
  showSafetyManagement: (role: UserRole | string) => FeatureAccess.canManageSafety(role),
  showUserManagement: (role: UserRole | string) => FeatureAccess.canManageUsers(role),
  showSystemConfig: (role: UserRole | string) => FeatureAccess.canConfigureSystem(role),
  showZeunMechanics: (role: UserRole | string) => FeatureAccess.canUseZeun(role),
};

