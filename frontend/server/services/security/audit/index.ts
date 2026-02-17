/**
 * AUDIT SECURITY MODULE
 * Central export for audit integrity services.
 */

export { computeEntryHash, getChainTip, verifyChainIntegrity, getChainStats } from "./hash-chain";
export type { AuditChainEntry } from "./hash-chain";
