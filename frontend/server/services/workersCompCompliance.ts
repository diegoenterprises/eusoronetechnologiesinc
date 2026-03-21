/**
 * WORKERS' COMPENSATION COMPLIANCE ENGINE
 *
 * Per-state workers' comp requirements for trucking operations.
 * Validates WC coverage before driver assignment.
 *
 * Key rules:
 * - Most states REQUIRE WC for all employees (no exemption for trucking)
 * - TX and some states allow opt-out for sole proprietors / owner-operators
 * - Some states require WC even for 1099 independent contractors when they
 *   work exclusively for one carrier (economic dependence test)
 * - Interstate carriers must comply with the state where work is performed
 */

interface StateWCRequirement {
  required: boolean;
  /** Whether sole proprietors / owner-operators can opt out */
  ownerOperatorExempt: boolean;
  /** Minimum number of employees before WC is mandatory */
  minEmployees: number;
  /** State-specific notes */
  notes: string;
  /** Regulatory reference */
  regulation: string;
}

export const STATE_WC_REQUIREMENTS: Record<string, StateWCRequirement> = {
  // States that REQUIRE WC for all (no owner-operator exemption)
  CA: { required: true, ownerOperatorExempt: false, minEmployees: 1, notes: "All employers must carry WC. No exemptions.", regulation: "CA Labor Code §3700" },
  NY: { required: true, ownerOperatorExempt: false, minEmployees: 1, notes: "All employers. Severe penalties for non-compliance.", regulation: "NY WCL §10" },
  OH: { required: true, ownerOperatorExempt: false, minEmployees: 1, notes: "State fund or self-insured. All employers.", regulation: "ORC §4123.35" },
  WA: { required: true, ownerOperatorExempt: false, minEmployees: 1, notes: "State monopoly fund. All employers.", regulation: "RCW 51.12.010" },
  IL: { required: true, ownerOperatorExempt: false, minEmployees: 1, notes: "All employers with any employees.", regulation: "820 ILCS 305/1" },
  PA: { required: true, ownerOperatorExempt: false, minEmployees: 1, notes: "All employers. Construction especially strict.", regulation: "PA WCA §305" },
  NJ: { required: true, ownerOperatorExempt: false, minEmployees: 1, notes: "All employers. Criminal penalties for non-compliance.", regulation: "NJ STAT 34:15-71" },
  MA: { required: true, ownerOperatorExempt: false, minEmployees: 1, notes: "All employers. Stop-work orders enforced.", regulation: "MGL c.152 §25A" },
  CT: { required: true, ownerOperatorExempt: false, minEmployees: 1, notes: "All employers with any employees.", regulation: "CGS §31-284" },
  WV: { required: true, ownerOperatorExempt: false, minEmployees: 1, notes: "All employers. State managed fund.", regulation: "WV Code §23-2-1" },

  // States that allow owner-operator / sole proprietor exemption
  TX: { required: false, ownerOperatorExempt: true, minEmployees: 0, notes: "WC not required but strongly recommended. Employers lose common-law defenses without it.", regulation: "TX Labor Code §406.002" },
  OK: { required: true, ownerOperatorExempt: true, minEmployees: 1, notes: "Sole proprietors may opt out. Corps/LLCs must carry.", regulation: "85A OS §2(18)" },
  FL: { required: true, ownerOperatorExempt: true, minEmployees: 4, notes: "Required for 4+ employees. Construction: 1+ employee.", regulation: "FL Stat §440.02" },
  GA: { required: true, ownerOperatorExempt: true, minEmployees: 3, notes: "Required for 3+ employees. Officers can exempt.", regulation: "OCGA §34-9-2" },
  NC: { required: true, ownerOperatorExempt: true, minEmployees: 3, notes: "Required for 3+ employees. Sole proprietors exempt.", regulation: "NCGS §97-2" },
  SC: { required: true, ownerOperatorExempt: true, minEmployees: 4, notes: "Required for 4+ employees.", regulation: "SC Code §42-1-360" },
  AL: { required: true, ownerOperatorExempt: true, minEmployees: 5, notes: "Required for 5+ employees. Mining/construction: different thresholds.", regulation: "Ala. Code §25-5-50" },
  MS: { required: true, ownerOperatorExempt: true, minEmployees: 5, notes: "Required for 5+ employees. Sole proprietors exempt.", regulation: "Miss. Code §71-3-5" },
  TN: { required: true, ownerOperatorExempt: true, minEmployees: 5, notes: "Required for 5+ employees. Construction: 1+.", regulation: "TCA §50-6-102" },
  AR: { required: true, ownerOperatorExempt: true, minEmployees: 3, notes: "Required for 3+ employees.", regulation: "ACA §11-9-102" },
  IN: { required: true, ownerOperatorExempt: true, minEmployees: 1, notes: "All employers. Sole proprietors/partners may opt out.", regulation: "IC 22-3-2-9" },
  LA: { required: true, ownerOperatorExempt: true, minEmployees: 1, notes: "All employers. Owner-operators may self-exempt.", regulation: "LSA-RS 23:1021" },
  CO: { required: true, ownerOperatorExempt: true, minEmployees: 1, notes: "All employers. Sole proprietors may waive.", regulation: "CRS §8-40-202" },
  NM: { required: true, ownerOperatorExempt: true, minEmployees: 3, notes: "Required for 3+ employees.", regulation: "NMSA §52-1-6" },
  ND: { required: true, ownerOperatorExempt: true, minEmployees: 1, notes: "State fund. Sole proprietors may opt out.", regulation: "NDCC §65-01-02" },
  AZ: { required: true, ownerOperatorExempt: true, minEmployees: 1, notes: "All employers. Sole proprietors/partners may opt out.", regulation: "ARS §23-901" },
  NV: { required: true, ownerOperatorExempt: true, minEmployees: 1, notes: "All employers. Sole proprietors may exempt.", regulation: "NRS §616A.020" },
  MO: { required: true, ownerOperatorExempt: true, minEmployees: 5, notes: "Required for 5+ employees.", regulation: "RSMo §287.030" },
  KS: { required: true, ownerOperatorExempt: true, minEmployees: 1, notes: "All employers. Sole proprietors/partners/officers may opt out.", regulation: "KSA §44-505" },
  VA: { required: true, ownerOperatorExempt: true, minEmployees: 3, notes: "Required for 3+ employees regularly employed.", regulation: "VA Code §65.2-101" },
};

// Default for unlisted states — assume required
const DEFAULT_WC: StateWCRequirement = {
  required: true, ownerOperatorExempt: true, minEmployees: 1,
  notes: "Default — verify with state workers' comp board.",
  regulation: "State-specific WC statute",
};

export interface WCValidationResult {
  compliant: boolean;
  errors: string[];
  warnings: string[];
  stateDetails: { state: string; required: boolean; hasPolicy: boolean; notes: string }[];
}

/**
 * Validate workers' comp compliance for a carrier operating in the given states.
 */
export function validateWorkersComp(opts: {
  hasWCPolicy: boolean;
  wcPolicyExpired: boolean;
  isOwnerOperator: boolean;
  employeeCount: number;
  operatingStates: string[];
}): WCValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stateDetails: WCValidationResult["stateDetails"] = [];

  for (const state of opts.operatingStates) {
    const rules = STATE_WC_REQUIREMENTS[state.toUpperCase()] || DEFAULT_WC;

    const isExempt = !rules.required ||
      (rules.ownerOperatorExempt && opts.isOwnerOperator && opts.employeeCount < rules.minEmployees);

    if (isExempt) {
      stateDetails.push({ state, required: false, hasPolicy: opts.hasWCPolicy, notes: `Exempt: ${rules.notes}` });
      if (!opts.hasWCPolicy) {
        warnings.push(`${state}: WC not required for owner-operators but recommended (${rules.regulation})`);
      }
    } else {
      stateDetails.push({ state, required: true, hasPolicy: opts.hasWCPolicy, notes: rules.notes });
      if (!opts.hasWCPolicy) {
        errors.push(`${state}: Workers' compensation insurance required per ${rules.regulation} — ${rules.notes}`);
      } else if (opts.wcPolicyExpired) {
        errors.push(`${state}: Workers' compensation policy has expired — active coverage required per ${rules.regulation}`);
      }
    }
  }

  return {
    compliant: errors.length === 0,
    errors,
    warnings,
    stateDetails,
  };
}
