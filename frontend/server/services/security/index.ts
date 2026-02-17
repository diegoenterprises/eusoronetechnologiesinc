/**
 * EUSOTRIP SECURITY MODULE — MASTER INDEX
 * Central export point for the entire security and data isolation layer.
 *
 * Architecture: EUSOTRIP_DATA_ISOLATION_ARCHITECTURE.md + EusoTrip_Security_Architecture.md
 *
 * Components:
 *   1. Data Isolation (L1-L4 privacy levels, ownership, relationships, org boundaries)
 *   2. RBAC Engine (12 roles × Action × Resource × Scope)
 *   3. Auth Services (password policy, MFA/TOTP, session manager, login throttle, refresh tokens)
 *   4. Audit Integrity (hash-chain tamper detection)
 *   5. Compliance (SOC 2 evidence, GDPR/CCPA data lifecycle)
 *   6. Azure Integration (Key Vault, envelope encryption)
 */

// ─── Data Isolation ─────────────────────────────────────────────────────────
export {
  PrivacyLevel, getClassification, requiresOwnershipCheck,
  allowsOrgAccess, allowsRelationshipAccess, DATA_CLASSIFICATIONS,
  verifyOwnership, ownershipFilter, isOwner,
  verifyLoadParticipant, verifyConversationParticipant,
  verifyBidParticipant, verifyInvoiceParticipant, hasBusinessRelationship,
  verifyOrganizationMembership, requireOrganizationMembership,
  getUserOrganizationId, orgBoundaryFilter, verifySameOrganization,
  getOrganizationMembers, isOrganizationAdmin,
} from "./isolation";

// ─── RBAC Engine ────────────────────────────────────────────────────────────
export {
  permissionKey, parsePermissionKey, ROLE_PERMISSIONS,
  resolveScopeContext, isWithinScope, scopeFilter,
  checkAccess, requireAccess, hasPermission,
  getPermissionsForRole, getAccessibleResources,
} from "./rbac";

// ─── Auth Services ──────────────────────────────────────────────────────────
export {
  validatePassword, hashPassword, verifyPassword, isPasswordReused,
  generateSecurePassword, generateResetToken, isResetTokenExpired,
  checkLoginAllowed, recordFailedLogin, recordSuccessfulLogin,
  isAccountLocked, unlockAccount, getLoginStats, cleanupStaleRecords,
  generateTOTPSecret, verifyTOTP, verifyBackupCode, hashBackupCodes,
  isMFARequired, encryptTOTPSecret, decryptTOTPSecret, auditMFAEvent,
  createSession, validateSession, touchSession, destroySession,
  destroyAllSessions, getActiveSessions, detectSessionAnomaly,
  cleanupExpiredSessions,
  generateRefreshToken, storeRefreshToken, rotateRefreshToken,
  revokeAllRefreshTokens, cleanupExpiredRefreshTokens,
} from "./auth";

// ─── Audit Integrity ────────────────────────────────────────────────────────
export {
  computeEntryHash, getChainTip, verifyChainIntegrity, getChainStats,
} from "./audit";
