/**
 * WS-P0-015R: E2E SMOKE TEST — COMPLIANCE GATE
 */
import { describe, it, expect } from "vitest";

interface FMCSAVerification {
  safetyRating?: { rating: string };
  authorities?: Array<{ authorityStatus: string }>;
}

function checkComplianceGate(company: { dotNumber?: string | null } | null, v: FMCSAVerification | null) {
  if (!company || !company.dotNumber) return { passed: false, error: "Carrier must have a registered DOT number" };
  if (!v) return { passed: true };
  if (v.safetyRating?.rating === "Unsatisfactory") return { passed: false, error: "Carrier has Unsatisfactory FMCSA safety rating" };
  if (v.authorities && v.authorities.length > 0 && !v.authorities.some(a => a.authorityStatus === "ACTIVE"))
    return { passed: false, error: "Carrier operating authority is not active" };
  return { passed: true };
}

describe("Compliance Gate", () => {
  it("blocks carrier with no DOT number", () => {
    expect(checkComplianceGate(null, null).passed).toBe(false);
    expect(checkComplianceGate({ dotNumber: null }, null).passed).toBe(false);
    expect(checkComplianceGate({ dotNumber: "" }, null).passed).toBe(false);
  });
  it("allows carrier with DOT when FMCSA unavailable", () => {
    expect(checkComplianceGate({ dotNumber: "123" }, null).passed).toBe(true);
  });
  it("blocks Unsatisfactory safety rating", () => {
    const r = checkComplianceGate({ dotNumber: "123" }, { safetyRating: { rating: "Unsatisfactory" } });
    expect(r.passed).toBe(false);
    expect(r.error).toContain("Unsatisfactory");
  });
  it("allows Satisfactory safety rating", () => {
    expect(checkComplianceGate({ dotNumber: "123" }, { safetyRating: { rating: "Satisfactory" }, authorities: [{ authorityStatus: "ACTIVE" }] }).passed).toBe(true);
  });
  it("blocks when all authorities INACTIVE", () => {
    const r = checkComplianceGate({ dotNumber: "123" }, { authorities: [{ authorityStatus: "INACTIVE" }] });
    expect(r.passed).toBe(false);
  });
  it("allows when at least one authority ACTIVE", () => {
    expect(checkComplianceGate({ dotNumber: "123" }, { authorities: [{ authorityStatus: "INACTIVE" }, { authorityStatus: "ACTIVE" }] }).passed).toBe(true);
  });
  it("allows carrier with no authorities listed", () => {
    expect(checkComplianceGate({ dotNumber: "123" }, { authorities: [] }).passed).toBe(true);
  });
  it("Unsatisfactory takes priority over active authority", () => {
    const r = checkComplianceGate({ dotNumber: "123" }, { safetyRating: { rating: "Unsatisfactory" }, authorities: [{ authorityStatus: "ACTIVE" }] });
    expect(r.passed).toBe(false);
  });
});
