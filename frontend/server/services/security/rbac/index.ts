/**
 * RBAC MODULE
 * Central export for Role-Based Access Control services.
 */

export type { Action, Resource, Scope, Permission } from "./permissions";
export { permissionKey, parsePermissionKey } from "./permissions";

export { ROLE_PERMISSIONS } from "./role-permission-map";

export { resolveScopeContext, isWithinScope, scopeFilter } from "./scope-resolver";
export type { ScopeContext } from "./scope-resolver";

export { checkAccess, requireAccess, hasPermission, getPermissionsForRole, getAccessibleResources } from "./access-check";
export type { AccessCheckInput, AccessCheckResult } from "./access-check";
