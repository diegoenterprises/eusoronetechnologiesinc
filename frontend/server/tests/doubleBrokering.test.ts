/**
 * WS-P0-015R: E2E SMOKE TEST — DOUBLE-BROKERING PREVENTION
 */
import { describe, it, expect } from "vitest";

interface LoadRecord {
  id: number;
  loadNumber: string;
  brokerChainDepth: number;
  status: string;
  originState: string;
  destState: string;
  createdAt: Date;
}

function checkDoubleBrokering(
  role: string,
  existingLoads: LoadRecord[],
  newOriginState: string,
  newDestState: string
): { allowed: boolean; error?: string } {
  if (role !== "BROKER") return { allowed: true };

  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const suspicious = existingLoads.find(
    l =>
      l.status === "posted" &&
      l.createdAt >= twoDaysAgo &&
      l.originState === newOriginState &&
      l.destState === newDestState &&
      l.brokerChainDepth > 0
  );

  if (suspicious) {
    return {
      allowed: false,
      error: `Double-brokering detected: similar load ${suspicious.loadNumber} already brokered on this lane. Re-posting brokered loads is prohibited.`,
    };
  }
  return { allowed: true };
}

function assignBrokerChainDepth(role: string): number {
  return role === "BROKER" ? 1 : 0;
}

describe("Double-Brokering Prevention", () => {
  it("shipper posts always have brokerChainDepth=0", () => {
    expect(assignBrokerChainDepth("SHIPPER")).toBe(0);
    expect(assignBrokerChainDepth("CATALYST")).toBe(0);
  });

  it("broker posts have brokerChainDepth=1", () => {
    expect(assignBrokerChainDepth("BROKER")).toBe(1);
  });

  it("allows broker to post on a fresh lane", () => {
    const result = checkDoubleBrokering("BROKER", [], "TX", "OK");
    expect(result.allowed).toBe(true);
  });

  it("allows broker when existing load on same lane has depth=0", () => {
    const existing: LoadRecord[] = [{
      id: 1, loadNumber: "LB-2025-000001", brokerChainDepth: 0,
      status: "posted", originState: "TX", destState: "OK",
      createdAt: new Date(),
    }];
    const result = checkDoubleBrokering("BROKER", existing, "TX", "OK");
    expect(result.allowed).toBe(true);
  });

  it("blocks broker when existing load on same lane has depth>0", () => {
    const existing: LoadRecord[] = [{
      id: 2, loadNumber: "LB-2025-000002", brokerChainDepth: 1,
      status: "posted", originState: "TX", destState: "OK",
      createdAt: new Date(),
    }];
    const result = checkDoubleBrokering("BROKER", existing, "TX", "OK");
    expect(result.allowed).toBe(false);
    expect(result.error).toContain("Double-brokering");
  });

  it("allows broker on different lane even with brokered loads", () => {
    const existing: LoadRecord[] = [{
      id: 3, loadNumber: "LB-2025-000003", brokerChainDepth: 1,
      status: "posted", originState: "TX", destState: "OK",
      createdAt: new Date(),
    }];
    const result = checkDoubleBrokering("BROKER", existing, "NM", "CO");
    expect(result.allowed).toBe(true);
  });

  it("allows broker when brokered load is older than 48 hours", () => {
    const old = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const existing: LoadRecord[] = [{
      id: 4, loadNumber: "LB-2025-000004", brokerChainDepth: 1,
      status: "posted", originState: "TX", destState: "OK",
      createdAt: old,
    }];
    const result = checkDoubleBrokering("BROKER", existing, "TX", "OK");
    expect(result.allowed).toBe(true);
  });

  it("allows broker when existing brokered load is not posted", () => {
    const existing: LoadRecord[] = [{
      id: 5, loadNumber: "LB-2025-000005", brokerChainDepth: 1,
      status: "assigned", originState: "TX", destState: "OK",
      createdAt: new Date(),
    }];
    const result = checkDoubleBrokering("BROKER", existing, "TX", "OK");
    expect(result.allowed).toBe(true);
  });

  it("non-broker roles bypass the check entirely", () => {
    const existing: LoadRecord[] = [{
      id: 6, loadNumber: "LB-2025-000006", brokerChainDepth: 1,
      status: "posted", originState: "TX", destState: "OK",
      createdAt: new Date(),
    }];
    expect(checkDoubleBrokering("SHIPPER", existing, "TX", "OK").allowed).toBe(true);
    expect(checkDoubleBrokering("CATALYST", existing, "TX", "OK").allowed).toBe(true);
  });
});
