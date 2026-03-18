# EUSOTRIP WINDSURF INSTRUCTIONS
## Production Readiness Campaign — March 2026

### How to Use These Files

1. Open Windsurf in your IDE connected to `github.com/diegoenterprises/eusoronetechnologiesinc`
2. Feed the files **in numbered order** starting with `P0-Critical/01-WS-P0-001.md`
3. Each file is a self-contained instruction — paste the entire contents into Windsurf's chat
4. Wait for Windsurf to implement and confirm before moving to the next file
5. After each P0 fix, run the **verification step** at the bottom of each file
6. After ALL P0 files are done, run `15-WS-P0-015.md` which is the end-to-end smoke test

### Execution Order

**P0 CRITICAL (Do first — blocks customer onboarding):**

```
01 → Stripe webhook receiver (money tracking)
02 → Payout execution (drivers get paid)
03 → Platform fee configs (revenue)
04 → Settlement automation (payment cycle)
05 → Compliance gate at load assignment (DOT compliance)
06 → Insurance minimum at bid acceptance (regulatory)
07 → WebSocket events on lifecycle transitions (real-time)
08 → WebSocket events on bid submission (real-time)
09 → RBAC guards on fleet.ts (security)
10 → Fix orphaned wallet records (data integrity)
11 → Create all 12 user type test accounts (testing)
12 → Register carrier company with DOT/MC (testing)
13 → Register test vehicles (testing)
14 → Fix load data integrity (data quality)
15 → END-TO-END SMOKE TEST (validation)
```

**P1 HIGH (Sprint 1 — after P0 complete):**

```
01-18 → Security, frontend, compliance, financial, real-time fixes
```

### Important Notes

- CARRIER = CATALYST in EusoTrip terminology (dispatchers who operate fleets)
- Every instruction includes: exact files, code changes, and verification steps
- Instructions have cross-team consensus (Alpha/Beta/Gamma/Delta/Epsilon/Zeta)
- Source of truth: User Journey Documents for each of the 12 user types
