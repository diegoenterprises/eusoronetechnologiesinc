/**
 * AUTH SECURITY MODULE
 * Central export for authentication security services.
 */

export { validatePassword, hashPassword, verifyPassword, isPasswordReused, generateSecurePassword, generateResetToken, isResetTokenExpired } from "./password-policy";
export type { PasswordValidationResult } from "./password-policy";

export { checkLoginAllowed, recordFailedLogin, recordSuccessfulLogin, isAccountLocked, unlockAccount, getLoginStats, cleanupStaleRecords } from "./login-throttle";

export { generateTOTPSecret, verifyTOTP, verifyBackupCode, hashBackupCodes, isMFARequired, encryptTOTPSecret, decryptTOTPSecret, auditMFAEvent } from "./mfa";

export { createSession, validateSession, touchSession, destroySession, destroyAllSessions, getActiveSessions, detectSessionAnomaly, cleanupExpiredSessions } from "./session-manager";
export type { SessionInfo } from "./session-manager";

export { generateRefreshToken, storeRefreshToken, rotateRefreshToken, revokeAllRefreshTokens, cleanupExpiredRefreshTokens } from "./refresh-tokens";
export type { RefreshTokenRecord } from "./refresh-tokens";
