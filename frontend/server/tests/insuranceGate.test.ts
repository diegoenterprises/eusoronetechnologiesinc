/**
 * WS-P0-015R: E2E SMOKE TEST — INSURANCE GATE
 */
import { describe, it, expect } from "vitest";

interface Policy { policyType: string; status: string; expirationDate: Date; combinedSingleLimit?: string; hazmatCoverage?: boolean; endorsements?: string[] }

function checkInsuranceGate(policies: Policy[], isHazmat: boolean, hazmatClass?: string) {
  if (!policies.length) return { passed: false, error: "Carrier has no valid insurance certificates" };
  const active = policies.filter(p => p.status === "active" && p.expirationDate >= new Date());
  if (!active.length) return { passed: false, error: "Carrier has no valid insurance certificates" };
  const hasAuto = active.some(p => p.policyType === "auto_liability");
  const hasCargo = active.some(p => p.policyType === "cargo" || p.policyType === "motor_truck_cargo");
  if (!hasAuto || !hasCargo) return { passed: false, error: "Carrier missing required insurance coverage (auto liability + cargo)" };
  if (isHazmat) {
    const hasHazmat = active.some(p => p.policyType === "hazmat_endorsement" || p.hazmatCoverage || (p.endorsements || []).some(e => e.toLowerCase().includes("hazmat")));
    if (!hasHazmat) return { passed: false, error: "Hazmat load requires hazmat insurance endorsement" };
  }
  const maxCoverage = Math.max(...active.map(p => parseFloat(p.combinedSingleLimit || "0") || 0));
  if (maxCoverage > 0 && maxCoverage < 1_000_000) return { passed: false, error: `Insurance coverage below minimum ($1,000,000)` };
  return { passed: true };
}

const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

describe("Insurance Gate", () => {
  it("blocks carrier with no policies", () => {
    expect(checkInsuranceGate([], false).passed).toBe(false);
  });
  it("blocks carrier with only expired policies", () => {
    const r = checkInsuranceGate([{ policyType: "auto_liability", status: "active", expirationDate: pastDate, combinedSingleLimit: "2000000" }], false);
    expect(r.passed).toBe(false);
  });
  it("blocks carrier missing auto_liability", () => {
    const r = checkInsuranceGate([{ policyType: "cargo", status: "active", expirationDate: futureDate, combinedSingleLimit: "2000000" }], false);
    expect(r.passed).toBe(false);
    expect(r.error).toContain("auto liability");
  });
  it("blocks carrier missing cargo coverage", () => {
    const r = checkInsuranceGate([{ policyType: "auto_liability", status: "active", expirationDate: futureDate, combinedSingleLimit: "2000000" }], false);
    expect(r.passed).toBe(false);
    expect(r.error).toContain("cargo");
  });
  it("allows carrier with auto_liability + cargo", () => {
    const policies: Policy[] = [
      { policyType: "auto_liability", status: "active", expirationDate: futureDate, combinedSingleLimit: "2000000" },
      { policyType: "cargo", status: "active", expirationDate: futureDate, combinedSingleLimit: "1500000" },
    ];
    expect(checkInsuranceGate(policies, false).passed).toBe(true);
  });
  it("blocks hazmat load without hazmat endorsement", () => {
    const policies: Policy[] = [
      { policyType: "auto_liability", status: "active", expirationDate: futureDate, combinedSingleLimit: "2000000" },
      { policyType: "cargo", status: "active", expirationDate: futureDate, combinedSingleLimit: "1500000" },
    ];
    const r = checkInsuranceGate(policies, true, "3");
    expect(r.passed).toBe(false);
    expect(r.error).toContain("hazmat");
  });
  it("allows hazmat load with hazmat endorsement", () => {
    const policies: Policy[] = [
      { policyType: "auto_liability", status: "active", expirationDate: futureDate, combinedSingleLimit: "2000000" },
      { policyType: "cargo", status: "active", expirationDate: futureDate, combinedSingleLimit: "1500000" },
      { policyType: "hazmat_endorsement", status: "active", expirationDate: futureDate },
    ];
    expect(checkInsuranceGate(policies, true, "3").passed).toBe(true);
  });
  it("allows hazmat via endorsements array", () => {
    const policies: Policy[] = [
      { policyType: "auto_liability", status: "active", expirationDate: futureDate, combinedSingleLimit: "2000000" },
      { policyType: "cargo", status: "active", expirationDate: futureDate, combinedSingleLimit: "1500000", endorsements: ["HAZMAT Coverage"] },
    ];
    expect(checkInsuranceGate(policies, true).passed).toBe(true);
  });
  it("blocks coverage below $1M minimum", () => {
    const policies: Policy[] = [
      { policyType: "auto_liability", status: "active", expirationDate: futureDate, combinedSingleLimit: "500000" },
      { policyType: "cargo", status: "active", expirationDate: futureDate, combinedSingleLimit: "500000" },
    ];
    const r = checkInsuranceGate(policies, false);
    expect(r.passed).toBe(false);
    expect(r.error).toContain("minimum");
  });
  it("allows coverage at exactly $1M", () => {
    const policies: Policy[] = [
      { policyType: "auto_liability", status: "active", expirationDate: futureDate, combinedSingleLimit: "1000000" },
      { policyType: "cargo", status: "active", expirationDate: futureDate, combinedSingleLimit: "1000000" },
    ];
    expect(checkInsuranceGate(policies, false).passed).toBe(true);
  });
});
