/**
 * MULTI-MODAL RBAC — Transport Mode access control
 * V5 Multi-Modal Expansion: TRUCK + RAIL + VESSEL
 */

// Role-to-Mode mapping
export const ROLE_TO_MODE: Record<string, string[]> = {
  // TRUCKING roles
  SHIPPER: ["TRUCK"], CATALYST: ["TRUCK"], BROKER: ["TRUCK"], DRIVER: ["TRUCK"],
  DISPATCH: ["TRUCK"], ESCORT: ["TRUCK"], TERMINAL_MANAGER: ["TRUCK"],
  COMPLIANCE_OFFICER: ["TRUCK"], SAFETY_MANAGER: ["TRUCK"], FACTORING: ["TRUCK"],
  // RAIL roles
  RAIL_SHIPPER: ["RAIL"], RAIL_CARRIER: ["RAIL"], RAIL_DISPATCHER: ["RAIL"],
  RAIL_ENGINEER: ["RAIL"], RAIL_CONDUCTOR: ["RAIL"], RAIL_BROKER: ["RAIL"],
  // VESSEL roles
  VESSEL_SHIPPER: ["VESSEL"], VESSEL_OPERATOR: ["VESSEL"], PORT_MASTER: ["VESSEL"],
  SHIP_CAPTAIN: ["VESSEL"], VESSEL_BROKER: ["VESSEL"], CUSTOMS_BROKER: ["VESSEL"],
  // ADMIN roles — all modes
  ADMIN: ["TRUCK", "RAIL", "VESSEL"], SUPER_ADMIN: ["TRUCK", "RAIL", "VESSEL"],
};

export const SHARED_RESOURCES = ["messages", "wallet", "settings", "training", "notifications", "documents"];

export function userHasMode(user: { role: string; transportModes?: string[] }, requiredMode: string): boolean {
  if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) return true;
  const userModes = user.transportModes || ROLE_TO_MODE[user.role] || [];
  return userModes.includes(requiredMode);
}

export function getUserModes(user: { role: string; transportModes?: string[] }): string[] {
  if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) return ["TRUCK", "RAIL", "VESSEL"];
  return user.transportModes || ROLE_TO_MODE[user.role] || ["TRUCK"];
}

export const RAIL_ROLES = [
  "RAIL_SHIPPER", "RAIL_CARRIER", "RAIL_DISPATCHER",
  "RAIL_ENGINEER", "RAIL_CONDUCTOR", "RAIL_BROKER",
] as const;

export const VESSEL_ROLES = [
  "VESSEL_SHIPPER", "VESSEL_OPERATOR", "PORT_MASTER",
  "SHIP_CAPTAIN", "VESSEL_BROKER", "CUSTOMS_BROKER",
] as const;

export const TRUCK_ROLES = [
  "SHIPPER", "CATALYST", "BROKER", "DRIVER",
  "DISPATCH", "ESCORT", "TERMINAL_MANAGER",
  "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "FACTORING",
] as const;

export const ALL_ROLES = [...TRUCK_ROLES, ...RAIL_ROLES, ...VESSEL_ROLES, "ADMIN", "SUPER_ADMIN"] as const;
