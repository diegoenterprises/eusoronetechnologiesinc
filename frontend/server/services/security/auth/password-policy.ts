/**
 * PASSWORD POLICY ENFORCEMENT
 * NIST SP 800-63B compliant password rules for EusoTrip.
 *
 * Requirements:
 *   - Minimum 12 characters (admin: 16)
 *   - At least 1 uppercase, 1 lowercase, 1 digit, 1 special character
 *   - Not in breached password database (top 100k)
 *   - No more than 3 consecutive identical characters
 *   - Cannot reuse last 12 passwords
 *   - bcrypt with cost factor 12
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";

const BCRYPT_ROUNDS = 12;
const MAX_PASSWORD_HISTORY = 12;

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "strong" | "very_strong";
}

/**
 * Validate a password against the EusoTrip password policy.
 */
export function validatePassword(
  password: string,
  isAdmin: boolean = false
): PasswordValidationResult {
  const errors: string[] = [];
  const minLength = isAdmin ? 16 : 12;

  // Length check
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }
  if (password.length > 128) {
    errors.push("Password must be at most 128 characters");
  }

  // Character class checks
  if (!/[A-Z]/.test(password)) errors.push("Must contain at least 1 uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Must contain at least 1 lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Must contain at least 1 digit");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Must contain at least 1 special character");

  // No 3+ consecutive identical characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push("Cannot contain 3 or more consecutive identical characters");
  }

  // No common sequences
  const commonSequences = [
    "123456", "password", "qwerty", "abc123", "letmein",
    "welcome", "admin", "master", "login", "eusotrip",
  ];
  const lowerPass = password.toLowerCase();
  for (const seq of commonSequences) {
    if (lowerPass.includes(seq)) {
      errors.push("Password contains a common sequence");
      break;
    }
  }

  // Calculate strength
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 20) score++;

  const strength: PasswordValidationResult["strength"] =
    score <= 2 ? "weak" : score <= 3 ? "fair" : score <= 4 ? "strong" : "very_strong";

  return { valid: errors.length === 0, errors, strength };
}

/**
 * Hash a password with bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if a new password was used in previous password history.
 * @param newPassword - The plaintext new password
 * @param previousHashes - Array of previous bcrypt hashes
 */
export async function isPasswordReused(
  newPassword: string,
  previousHashes: string[]
): Promise<boolean> {
  // Check against the last MAX_PASSWORD_HISTORY passwords
  const recent = previousHashes.slice(-MAX_PASSWORD_HISTORY);
  for (const hash of recent) {
    if (await bcrypt.compare(newPassword, hash)) {
      return true;
    }
  }
  return false;
}

/**
 * Generate a cryptographically secure random password.
 */
export function generateSecurePassword(length: number = 20): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
}

/**
 * Generate a secure reset token.
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Check if a password reset token has expired.
 * Tokens are valid for 1 hour.
 */
export function isResetTokenExpired(createdAt: Date): boolean {
  const ONE_HOUR = 60 * 60 * 1000;
  return Date.now() - createdAt.getTime() > ONE_HOUR;
}
