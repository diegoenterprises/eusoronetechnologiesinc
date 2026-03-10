/**
 * Shared Hazmat Constants
 * Centralized hazmat compliance tables used across load creation and lifecycle management.
 * Source: 49 CFR 177.848 (segregation), 49 CFR 173 (trailer compatibility)
 */

/**
 * Trailer type → allowed hazmat classes mapping.
 * Used during load creation to validate trailer/hazmat compatibility.
 */
export const TRAILER_HAZMAT_ALLOWED: Record<string, string[]> = {
  liquid_tank: ["3", "5.1", "5.2", "6.1", "8"],
  gas_tank: ["2.1", "2.2", "2.3"],
  hazmat_van: ["1", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "2.1", "2.2", "2.3", "3", "4.1", "4.2", "4.3", "5.1", "5.2", "6.1", "6.2", "7", "8", "9"],
  dry_van: ["9"],
  reefer: ["9"],
  flatbed: ["9"],
};

/**
 * Hazmat class segregation table (49 CFR 177.848).
 * Maps each hazmat class to the list of classes it CANNOT be transported with.
 * Used for multi-compartment and multi-load vehicle compatibility checks.
 */
export const SEGREGATION_TABLE: Record<string, string[]> = {
  "1": ["2.1","2.2","2.3","3","4.1","4.2","4.3","5.1","5.2","6.1","7","8"],
  "1.1": ["2.1","2.3","3","4.1","4.2","4.3","5.1","5.2","6.1","7","8"],
  "2.1": ["1","1.1","2.3","3","4.1","4.2","4.3","5.1","5.2","6.1","7","8"],
  "2.3": ["1.1","2.1","3","4.1","4.2","4.3","5.1","5.2","6.1","8"],
  "3": ["1","1.1","2.1","2.3","4.1","4.3","5.1","5.2","6.1","7","8"],
  "4.1": ["1","1.1","2.1","2.3","3","4.3","5.1","5.2","6.1","7","8"],
  "4.2": ["1","1.1","2.1","2.3","3","5.1","5.2","7","8"],
  "4.3": ["1","1.1","2.1","2.3","3","4.1","5.1","5.2","6.1","7","8"],
  "5.1": ["1","1.1","2.1","2.3","3","4.1","4.2","4.3","6.1","7","8"],
  "5.2": ["1","1.1","2.1","2.3","3","4.1","4.2","4.3","6.1","7"],
  "6.1": ["1","1.1","2.1","2.3","3","4.1","4.3","5.1","5.2","7","8"],
  "7": ["1","1.1","2.1","3","4.1","4.2","4.3","5.1","5.2","6.1","8"],
  "8": ["1","1.1","2.1","2.3","3","4.1","4.2","4.3","5.1","6.1","7"],
};

/**
 * Compute CDL endorsement requirements based on hazmat class and trailer type.
 */
export function getRequiredCdlEndorsements(hazmatClass: string | undefined, trailerType: string): string[] {
  const endorsements: string[] = [];
  const isTankTrailer = trailerType.includes("tank");
  if (hazmatClass && isTankTrailer) {
    endorsements.push("X"); // Combined H+N
  } else {
    if (hazmatClass) endorsements.push("H");
    if (isTankTrailer) endorsements.push("N");
  }
  return endorsements;
}
