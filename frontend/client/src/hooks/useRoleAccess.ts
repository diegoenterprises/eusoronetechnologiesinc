/**
 * USEROLACCESS HOOK - 12-ROLE SYSTEM
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Provides role-based access control for all 12 user types:
 * - SHIPPER, CATALYST, BROKER, DRIVER, DISPATCH, ESCORT, TERMINAL_MANAGER,
 *   FACTORING, COMPLIANCE_OFFICER, SAFETY_MANAGER, ADMIN, SUPER_ADMIN
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export type UserRole = 
  | "SHIPPER" 
  | "CATALYST" 
  | "BROKER" 
  | "DRIVER" 
  | "DISPATCH" 
  | "ESCORT" 
  | "TERMINAL_MANAGER" 
  | "FACTORING"
  | "COMPLIANCE_OFFICER"
  | "SAFETY_MANAGER"
  | "ADMIN" 
  | "SUPER_ADMIN"
  | "USER"; // Default fallback

interface RoleAccessConfig {
  [page: string]: UserRole[];
}

// Comprehensive page access configuration for all 12 roles
const PAGE_ACCESS: RoleAccessConfig = {
  // Dashboard
  "/": ["SHIPPER", "CATALYST", "BROKER", "DRIVER", "DISPATCH", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  
  // Shipper-specific pages
  "/loads": ["SHIPPER", "CATALYST", "BROKER", "ADMIN", "SUPER_ADMIN"],
  "/loads/create": ["SHIPPER", "BROKER", "ADMIN", "SUPER_ADMIN"],
  "/loads/active": ["SHIPPER", "CATALYST", "BROKER", "ADMIN", "SUPER_ADMIN"],
  "/tracking": ["SHIPPER", "CATALYST", "BROKER", "ADMIN", "SUPER_ADMIN"],
  "/catalysts": ["SHIPPER", "BROKER", "ADMIN", "SUPER_ADMIN"],
  
  // Catalyst-specific pages
  "/marketplace": ["CATALYST", "BROKER", "DRIVER", "DISPATCH", "ADMIN", "SUPER_ADMIN"],
  "/bids": ["CATALYST", "BROKER", "DRIVER", "DISPATCH", "ADMIN", "SUPER_ADMIN"],
  "/loads/transit": ["CATALYST", "DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/fleet": ["CATALYST", "ADMIN", "SUPER_ADMIN"],
  "/drivers": ["CATALYST", "ADMIN", "SUPER_ADMIN"],
  "/earnings": ["CATALYST", "DRIVER", "DISPATCH", "ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/analytics": ["CATALYST", "BROKER", "ADMIN", "SUPER_ADMIN"],
  
  // Driver-specific pages
  "/jobs": ["DRIVER", "CATALYST", "ADMIN", "SUPER_ADMIN"],
  "/jobs/current": ["DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/navigation": ["DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/vehicle": ["DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/diagnostics": ["DRIVER", "TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/documents": ["SHIPPER", "CATALYST", "BROKER", "DRIVER", "DISPATCH", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  
  // Dispatch-specific pages
  "/specializations": ["DISPATCH", "ADMIN", "SUPER_ADMIN"],
  "/matched-loads": ["DISPATCH", "ADMIN", "SUPER_ADMIN"],
  "/opportunities": ["DISPATCH", "ADMIN", "SUPER_ADMIN"],
  "/performance": ["DISPATCH", "CATALYST", "ADMIN", "SUPER_ADMIN"],
  "/ai-assistant": ["DISPATCH", "SHIPPER", "CATALYST", "DRIVER", "ADMIN", "SUPER_ADMIN"],
  
  // Escort-specific pages
  "/convoys": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/team": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/escort/incidents": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/escort/reports": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/escort/jobs": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/escort/active-trip": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/escort/profile": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/escort/marketplace": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/escort/permits": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/escort/schedule": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/escort/earnings": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/escort/certifications": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/reports": ["ESCORT", "TERMINAL_MANAGER", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  
  // Terminal Manager-specific pages
  "/facility": ["TERMINAL_MANAGER", "SHIPPER", "ADMIN", "SUPER_ADMIN"],
  "/incoming": ["TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/outgoing": ["TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/staff": ["TERMINAL_MANAGER", "SHIPPER", "BROKER", "ADMIN", "SUPER_ADMIN"],
  "/operations": ["TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/compliance": ["TERMINAL_MANAGER", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  
  // Factoring-specific pages
  "/factoring": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/invoices": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/catalysts": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/collections": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/funding": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/risk": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/aging": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/chargebacks": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/debtors": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/reports": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/settings": ["FACTORING", "ADMIN", "SUPER_ADMIN"],

  // Compliance Officer-specific pages
  "/compliance/dq-files": ["COMPLIANCE_OFFICER", "ADMIN", "SUPER_ADMIN"],
  "/compliance/calendar": ["COMPLIANCE_OFFICER", "ADMIN", "SUPER_ADMIN"],
  "/compliance/clearinghouse": ["COMPLIANCE_OFFICER", "ADMIN", "SUPER_ADMIN"],
  "/compliance/eld": ["COMPLIANCE_OFFICER", "ADMIN", "SUPER_ADMIN"],
  "/violations": ["COMPLIANCE_OFFICER", "ADMIN", "SUPER_ADMIN"],
  "/audits": ["COMPLIANCE_OFFICER", "ADMIN", "SUPER_ADMIN"],
  "/fleet-compliance": ["COMPLIANCE_OFFICER", "ADMIN", "SUPER_ADMIN"],
  "/driver-compliance": ["COMPLIANCE_OFFICER", "ADMIN", "SUPER_ADMIN"],
  "/compliance/reports": ["COMPLIANCE_OFFICER", "ADMIN", "SUPER_ADMIN"],

  // Safety Manager-specific pages
  "/safety": ["SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/safety-metrics": ["SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/safety/incidents": ["SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/safety/csa-scores": ["SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/safety/driver-performance": ["SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/safety/meetings": ["SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/driver-health": ["SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/vehicle-safety": ["SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/training": ["SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/hazmat": ["SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/incidents": ["SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/accident-report": ["SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],

  // Shared pages
  "/messages": ["SHIPPER", "CATALYST", "BROKER", "DRIVER", "DISPATCH", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/payments": ["SHIPPER", "CATALYST", "BROKER", "FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/wallet": ["SHIPPER", "CATALYST", "BROKER", "DRIVER", "DISPATCH", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/company": ["SHIPPER", "CATALYST", "BROKER", "ESCORT", "FACTORING", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/profile": ["SHIPPER", "CATALYST", "BROKER", "DRIVER", "DISPATCH", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/settings": ["SHIPPER", "CATALYST", "BROKER", "DRIVER", "DISPATCH", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/support": ["SHIPPER", "CATALYST", "BROKER", "DRIVER", "DISPATCH", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  
  // Admin pages
  "/admin": ["ADMIN", "SUPER_ADMIN"],
  "/admin/users": ["ADMIN", "SUPER_ADMIN"],
  "/admin/companies": ["ADMIN", "SUPER_ADMIN"],
  "/admin/loads": ["ADMIN", "SUPER_ADMIN"],
  "/admin/payments": ["ADMIN", "SUPER_ADMIN"],
  "/admin/disputes": ["ADMIN", "SUPER_ADMIN"],
  "/admin/documents": ["ADMIN", "SUPER_ADMIN"],
  "/admin/analytics": ["ADMIN", "SUPER_ADMIN"],
  "/admin/settings": ["ADMIN", "SUPER_ADMIN"],
  
  // Super Admin pages
  "/super-admin": ["SUPER_ADMIN"],
  "/super-admin/users": ["SUPER_ADMIN"],
  "/super-admin/companies": ["SUPER_ADMIN"],
  "/super-admin/loads": ["SUPER_ADMIN"],
  "/super-admin/config": ["SUPER_ADMIN"],
  "/super-admin/database": ["SUPER_ADMIN"],
  "/super-admin/security": ["SUPER_ADMIN"],
  "/super-admin/logs": ["SUPER_ADMIN"],
  "/super-admin/monitoring": ["SUPER_ADMIN"],
  "/super-admin/settings": ["SUPER_ADMIN"],
};

/**
 * Hook to check if current user has access to required roles
 * @param requiredRoles - Array of roles that have access
 * @returns Object with hasAccess boolean and user info
 */
export function useRoleAccess(requiredRoles: UserRole[]) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      const userRole = (user.role as UserRole) || "USER";
      if (!requiredRoles.includes(userRole)) {
        navigate("/");
      }
    }
  }, [user, loading, requiredRoles, navigate]);

  const hasAccess = user && requiredRoles.includes((user.role as UserRole) || "USER");

  return { 
    hasAccess,
    user,
    loading,
    userRole: (user?.role as UserRole) || "USER"
  };
}

/**
 * Get required roles for a specific page
 * @param page - Page path
 * @returns Array of roles that have access to the page
 */
export function getPageAccessRoles(page: string): UserRole[] {
  return PAGE_ACCESS[page] || [];
}

/**
 * Check if a specific role has access to a page
 * @param role - User role
 * @param page - Page path
 * @returns true if role has access
 */
export function hasPageAccess(role: UserRole, page: string): boolean {
  const allowedRoles = getPageAccessRoles(page);
  return allowedRoles.includes(role);
}

/**
 * Get all pages accessible by a role
 * @param role - User role
 * @returns Array of page paths
 */
export function getAccessiblePages(role: UserRole): string[] {
  return Object.entries(PAGE_ACCESS)
    .filter(([_, roles]) => roles.includes(role))
    .map(([page, _]) => page);
}

/**
 * Check if user is admin or super admin
 * @param role - User role
 * @returns true if admin or super admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Check if user is super admin
 * @param role - User role
 * @returns true if super admin
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

/**
 * Get role hierarchy level (for permission escalation)
 * @param role - User role
 * @returns Hierarchy level (0 = lowest, 8 = highest)
 */
export function getRoleHierarchy(role: UserRole): number {
  const hierarchy: Record<UserRole, number> = {
    USER: 0,
    DRIVER: 1,
    ESCORT: 2,
    DISPATCH: 3,
    TERMINAL_MANAGER: 4,
    FACTORING: 5,
    COMPLIANCE_OFFICER: 6,
    SAFETY_MANAGER: 7,
    SHIPPER: 8,
    CATALYST: 9,
    BROKER: 10,
    ADMIN: 11,
    SUPER_ADMIN: 12,
  };
  return hierarchy[role] || 0;
}

/**
 * Check if one role can manage another role
 * @param managerRole - Role trying to manage
 * @param targetRole - Role being managed
 * @returns true if manager can manage target
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  return getRoleHierarchy(managerRole) > getRoleHierarchy(targetRole);
}

