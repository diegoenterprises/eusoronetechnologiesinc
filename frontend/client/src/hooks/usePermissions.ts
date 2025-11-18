/**
 * React hooks for role-based permission checking
 * 
 * Provides convenient hooks to check permissions in React components
 */

import { useAuth } from "@/_core/hooks/useAuth";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  FeatureAccess,
  UIVisibility,
  type Permission,
  type UserRole,
} from "@shared/permissions";

/**
 * Hook to check if current user has a specific permission
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  if (!user?.role) return false;
  return hasPermission(user.role as UserRole, permission);
}

/**
 * Hook to check if current user has ANY of the specified permissions
 */
export function useAnyPermission(permissions: Permission[]): boolean {
  const { user } = useAuth();
  if (!user?.role) return false;
  return hasAnyPermission(user.role as UserRole, permissions);
}

/**
 * Hook to check if current user has ALL of the specified permissions
 */
export function useAllPermissions(permissions: Permission[]): boolean {
  const { user } = useAuth();
  if (!user?.role) return false;
  return hasAllPermissions(user.role as UserRole, permissions);
}

/**
 * Hook to get all permissions for current user
 */
export function useUserPermissions(): Permission[] {
  const { user } = useAuth();
  if (!user?.role) return [];
  return getRolePermissions(user.role as UserRole);
}

/**
 * Hook to get feature access helpers for current user
 */
export function useFeatureAccess() {
  const { user } = useAuth();
  const role = (user?.role as UserRole) || "DRIVER";

  return {
    canCreateLoads: FeatureAccess.canCreateLoads(role),
    canViewLoads: FeatureAccess.canViewLoads(role),
    canSubmitBids: FeatureAccess.canSubmitBids(role),
    canManageFleet: FeatureAccess.canManageFleet(role),
    canManageTerminal: FeatureAccess.canManageTerminal(role),
    canApproveCompliance: FeatureAccess.canApproveCompliance(role),
    canManageSafety: FeatureAccess.canManageSafety(role),
    canManageUsers: FeatureAccess.canManageUsers(role),
    canConfigureSystem: FeatureAccess.canConfigureSystem(role),
    canUseZeun: FeatureAccess.canUseZeun(role),
  };
}

/**
 * Hook to get UI visibility helpers for current user
 */
export function useUIVisibility() {
  const { user } = useAuth();
  const role = (user?.role as UserRole) || "DRIVER";

  return {
    showCreateLoadButton: UIVisibility.showCreateLoadButton(role),
    showBidButton: UIVisibility.showBidButton(role),
    showFleetManagement: UIVisibility.showFleetManagement(role),
    showTerminalOperations: UIVisibility.showTerminalOperations(role),
    showComplianceApproval: UIVisibility.showComplianceApproval(role),
    showSafetyManagement: UIVisibility.showSafetyManagement(role),
    showUserManagement: UIVisibility.showUserManagement(role),
    showSystemConfig: UIVisibility.showSystemConfig(role),
    showZeunMechanics: UIVisibility.showZeunMechanics(role),
  };
}

/**
 * Component wrapper for conditional rendering based on permissions
 */
interface PermissionGateProps {
  permission?: Permission;
  anyPermissions?: Permission[];
  allPermissions?: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permission,
  anyPermissions,
  allPermissions,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { user } = useAuth();
  
  if (!user?.role) return fallback as React.ReactElement;

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(user.role as UserRole, permission);
  } else if (anyPermissions) {
    hasAccess = hasAnyPermission(user.role as UserRole, anyPermissions);
  } else if (allPermissions) {
    hasAccess = hasAllPermissions(user.role as UserRole, allPermissions);
  }

  return hasAccess ? (children as React.ReactElement) : (fallback as React.ReactElement);
}

