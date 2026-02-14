/**
 * USEROLACCESS HOOK - 9-ROLE SYSTEM
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Provides role-based access control for all 9 user types:
 * - SHIPPER, CARRIER, BROKER, DRIVER, CATALYST, ESCORT, TERMINAL_MANAGER, ADMIN, SUPER_ADMIN
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export type UserRole = 
  | "SHIPPER" 
  | "CARRIER" 
  | "BROKER" 
  | "DRIVER" 
  | "CATALYST" 
  | "ESCORT" 
  | "TERMINAL_MANAGER" 
  | "FACTORING"
  | "ADMIN" 
  | "SUPER_ADMIN"
  | "USER"; // Default fallback

interface RoleAccessConfig {
  [page: string]: UserRole[];
}

// Comprehensive page access configuration for all 9 roles
const PAGE_ACCESS: RoleAccessConfig = {
  // Dashboard
  "/": ["SHIPPER", "CARRIER", "BROKER", "DRIVER", "CATALYST", "ESCORT", "TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  
  // Shipper-specific pages
  "/loads": ["SHIPPER", "CARRIER", "BROKER", "ADMIN", "SUPER_ADMIN"],
  "/loads/create": ["SHIPPER", "BROKER", "ADMIN", "SUPER_ADMIN"],
  "/loads/active": ["SHIPPER", "CARRIER", "BROKER", "ADMIN", "SUPER_ADMIN"],
  "/tracking": ["SHIPPER", "CARRIER", "BROKER", "ADMIN", "SUPER_ADMIN"],
  "/carriers": ["SHIPPER", "BROKER", "ADMIN", "SUPER_ADMIN"],
  
  // Carrier-specific pages
  "/marketplace": ["CARRIER", "BROKER", "ADMIN", "SUPER_ADMIN"],
  "/bids": ["CARRIER", "ADMIN", "SUPER_ADMIN"],
  "/loads/transit": ["CARRIER", "DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/fleet": ["CARRIER", "ADMIN", "SUPER_ADMIN"],
  "/drivers": ["CARRIER", "ADMIN", "SUPER_ADMIN"],
  "/earnings": ["CARRIER", "DRIVER", "CATALYST", "ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/analytics": ["CARRIER", "BROKER", "ADMIN", "SUPER_ADMIN"],
  
  // Driver-specific pages
  "/jobs": ["DRIVER", "CARRIER", "ADMIN", "SUPER_ADMIN"],
  "/jobs/current": ["DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/navigation": ["DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/vehicle": ["DRIVER", "ADMIN", "SUPER_ADMIN"],
  "/diagnostics": ["DRIVER", "TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/documents": ["DRIVER", "ADMIN", "SUPER_ADMIN"],
  
  // Catalyst-specific pages
  "/specializations": ["CATALYST", "ADMIN", "SUPER_ADMIN"],
  "/matched-loads": ["CATALYST", "ADMIN", "SUPER_ADMIN"],
  "/opportunities": ["CATALYST", "ADMIN", "SUPER_ADMIN"],
  "/performance": ["CATALYST", "CARRIER", "ADMIN", "SUPER_ADMIN"],
  "/ai-assistant": ["CATALYST", "SHIPPER", "CARRIER", "DRIVER", "ADMIN", "SUPER_ADMIN"],
  
  // Escort-specific pages
  "/convoys": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/team": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/incidents": ["ESCORT", "ADMIN", "SUPER_ADMIN"],
  "/reports": ["ESCORT", "TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  
  // Terminal Manager-specific pages
  "/facility": ["TERMINAL_MANAGER", "SHIPPER", "ADMIN", "SUPER_ADMIN"],
  "/incoming": ["TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/outgoing": ["TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/staff": ["TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/operations": ["TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/compliance": ["TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
  
  // Factoring-specific pages
  "/factoring": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/invoices": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/carriers": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/collections": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/funding": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/risk": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/aging": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/chargebacks": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/debtors": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/reports": ["FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/factoring/settings": ["FACTORING", "ADMIN", "SUPER_ADMIN"],

  // Shared pages
  "/messages": ["SHIPPER", "CARRIER", "BROKER", "DRIVER", "CATALYST", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/payments": ["SHIPPER", "CARRIER", "BROKER", "FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/wallet": ["SHIPPER", "CARRIER", "BROKER", "DRIVER", "CATALYST", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/company": ["SHIPPER", "CARRIER", "BROKER", "FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/profile": ["SHIPPER", "CARRIER", "BROKER", "DRIVER", "CATALYST", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/settings": ["SHIPPER", "CARRIER", "BROKER", "DRIVER", "CATALYST", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "ADMIN", "SUPER_ADMIN"],
  "/support": ["SHIPPER", "CARRIER", "BROKER", "DRIVER", "CATALYST", "ESCORT", "TERMINAL_MANAGER", "FACTORING", "ADMIN", "SUPER_ADMIN"],
  
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
    CATALYST: 3,
    TERMINAL_MANAGER: 4,
    FACTORING: 5,
    SHIPPER: 6,
    CARRIER: 7,
    BROKER: 8,
    ADMIN: 9,
    SUPER_ADMIN: 10,
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

