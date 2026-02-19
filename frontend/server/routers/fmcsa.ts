/**
 * FMCSA QCMobile API Integration Router
 * Free public REST API for catalyst/broker/shipper verification
 * Auto-populates 30+ fields from a single USDOT or MC number lookup
 * 
 * Base URL: https://mobile.fmcsa.dot.gov/qc/services/
 * Auth: WebKey query parameter (free — register at mobile.fmcsa.dot.gov)
 */

import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";

const FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services";
const FMCSA_KEY = process.env.FMCSA_WEBKEY || "891b0bbf613e9937bd584968467527aa1f29aec2";

// In-memory cache to avoid hammering FMCSA API (24h TTL)
const catalystCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCached(key: string) {
  const entry = catalystCache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data;
  if (entry) catalystCache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  catalystCache.set(key, { data, expires: Date.now() + CACHE_TTL });
  // Evict old entries if cache grows too large
  if (catalystCache.size > 5000) {
    const now = Date.now();
    Array.from(catalystCache.entries()).forEach(([k, v]) => {
      if (v.expires < now) catalystCache.delete(k);
    });
  }
}

async function fmcsaFetch(endpoint: string) {
  const url = `${FMCSA_BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}webKey=${FMCSA_KEY}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`FMCSA API error: ${res.status}`);
  return res.json();
}

function parseCatalystResponse(c: any) {
  return {
    // Company Profile
    companyProfile: {
      legalName: c.legalName || "",
      dba: c.dbaName || null,
      phone: c.telephone || null,
      email: c.emailAddress || null,
      physicalAddress: {
        street: c.phyStreet || "",
        city: c.phyCity || "",
        state: c.phyState || "",
        zip: c.phyZip || "",
        country: c.phyCountry || "US",
      },
      mailingAddress: {
        street: c.mailingStreet || "",
        city: c.mailingCity || "",
        state: c.mailingState || "",
        zip: c.mailingZip || "",
      },
      fleetSize: c.totalPowerUnits || 0,
      driverCount: c.totalDrivers || 0,
    },

    // Authority
    authority: {
      dotNumber: String(c.dotNumber || ""),
      allowedToOperate: c.allowedToOperate === "Y",
      operatingStatus: c.allowedToOperate === "Y" ? "ACTIVE" : "INACTIVE",
      commonAuthority: c.commonAuthorityStatus || "N",
      contractAuthority: c.contractAuthorityStatus || "N",
      brokerAuthority: c.brokerAuthorityStatus || "N",
      catalystOperation: c.catalystOperation?.catalystOperationDesc || null,
      catalystOperationCode: c.catalystOperation?.catalystOperationCode || null,
    },

    // Safety
    safety: {
      rating: c.safetyRating || "NOT RATED",
      ratingDate: c.safetyRatingDate || null,
      crashTotal: c.crashTotal || 0,
      fatalCrash: c.fatalCrash || 0,
      injCrash: c.injCrash || 0,
      towCrash: c.towCrash || 0,
      inspections: {
        driver: {
          total: c.driverInsp || 0,
          oos: c.driverOosInsp || 0,
          rate: c.driverOosRate || 0,
        },
        vehicle: {
          total: c.vehicleInsp || 0,
          oos: c.vehicleOosInsp || 0,
          rate: c.vehicleOosRate || 0,
        },
        hazmat: {
          total: c.hazmatInsp || 0,
          oos: c.hazmatOosInsp || 0,
          rate: c.hazmatOosRate || 0,
        },
      },
    },

    // Insurance
    insurance: {
      bipdOnFile: c.bipdInsuranceOnFile === "Y",
      bipdRequired: c.bipdInsuranceRequired === "Y",
      bipdAmount: c.bipdRequiredAmount || null,
      cargoOnFile: c.cargoInsuranceOnFile === "Y",
      cargoRequired: c.cargoInsuranceRequired === "Y",
      bondOnFile: c.bondInsuranceOnFile === "Y",
      bondRequired: c.bondInsuranceRequired === "Y",
    },

    // Hazmat
    hazmat: {
      authorized: c.hazmatFlag === "Y",
    },
  };
}

export const fmcsaRouter = router({
  /**
   * Primary: Lookup catalyst by USDOT number
   * Returns full company profile, authority, safety, insurance, hazmat data
   */
  lookupByDOT: publicProcedure
    .input(z.object({ dotNumber: z.string().regex(/^\d{1,8}$/, "USDOT must be 1-8 digits") }))
    .query(async ({ input }) => {
      if (!FMCSA_KEY) {
        return { verified: false, error: "FMCSA API key not configured. Enter data manually.", noApiKey: true };
      }

      const cacheKey = `dot:${input.dotNumber}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      try {
        const [catalystRes, authorityRes, basicsRes, cargoRes] = await Promise.allSettled([
          fmcsaFetch(`/carriers/${input.dotNumber}`),
          fmcsaFetch(`/carriers/${input.dotNumber}/authority`),
          fmcsaFetch(`/carriers/${input.dotNumber}/basics`),
          fmcsaFetch(`/carriers/${input.dotNumber}/cargo-carried`),
        ]);

        const catalyst = catalystRes.status === "fulfilled" ? catalystRes.value : null;
        const c = catalyst?.content?.[0]?.carrier || catalyst?.content?.carrier || catalyst?.content?.[0]?.catalyst || catalyst?.content?.catalyst;
        if (!c) {
          return { verified: false, error: "Carrier not found for this USDOT number" };
        }

        const parsed = parseCatalystResponse(c);

        // Attach additional data from parallel calls
        const authority = authorityRes.status === "fulfilled" ? authorityRes.value : null;
        const basics = basicsRes.status === "fulfilled" ? basicsRes.value : null;
        const cargo = cargoRes.status === "fulfilled" ? cargoRes.value : null;

        const result = {
          verified: true,
          ...parsed,
          authority: {
            ...parsed.authority,
            docketNumbers: authority?.content || [],
          },
          safety: {
            ...parsed.safety,
            basics: basics?.content || [],
          },
          hazmat: {
            ...parsed.hazmat,
            cargoTypes: cargo?.content || [],
          },
          // Blocking checks
          isBlocked: !parsed.authority.allowedToOperate,
          blockReason: !parsed.authority.allowedToOperate
            ? "This catalyst is NOT authorized to operate. Registration cannot proceed."
            : null,
          // Warnings
          warnings: [
            ...(parsed.safety.rating === "CONDITIONAL"
              ? ["Safety rating is CONDITIONAL — requires safety improvement plan"]
              : []),
            ...(parsed.safety.inspections.driver.rate > 25
              ? [`Driver OOS rate (${parsed.safety.inspections.driver.rate}%) exceeds national average`]
              : []),
            ...(parsed.safety.inspections.vehicle.rate > 25
              ? [`Vehicle OOS rate (${parsed.safety.inspections.vehicle.rate}%) exceeds national average`]
              : []),
            ...(!parsed.insurance.bipdOnFile && parsed.insurance.bipdRequired
              ? ["No BIPD insurance on file — certificate of insurance required"]
              : []),
          ],
          fetchedAt: new Date().toISOString(),
        };

        setCache(cacheKey, result);
        return result;
      } catch (err: any) {
        return { verified: false, error: err.message || "FMCSA lookup failed" };
      }
    }),

  /**
   * Lookup by MC/MX number (brokers, for-hire catalysts)
   */
  lookupByMC: publicProcedure
    .input(z.object({ mcNumber: z.string().regex(/^\d{1,8}$/, "MC number must be 1-8 digits") }))
    .query(async ({ input }) => {
      if (!FMCSA_KEY) {
        return { results: [], error: "FMCSA API key not configured", noApiKey: true };
      }

      const cacheKey = `mc:${input.mcNumber}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      try {
        const res = await fmcsaFetch(`/carriers/docket/${input.mcNumber}`);
        const catalysts = res?.content || [];
        const result = {
          results: catalysts.slice(0, 10).map((c: any) => ({
            dotNumber: String(c.dotNumber || ""),
            legalName: c.legalName || "",
            dbaName: c.dbaName || null,
            state: c.phyState || "",
            status: c.allowedToOperate === "Y" ? "ACTIVE" : "INACTIVE",
          })),
        };
        setCache(cacheKey, result);
        return result;
      } catch (err: any) {
        return { results: [], error: err.message || "MC lookup failed" };
      }
    }),

  /**
   * Typeahead: Search by company name
   */
  searchByName: publicProcedure
    .input(z.object({ name: z.string().min(3).max(100) }))
    .query(async ({ input }) => {
      if (!FMCSA_KEY) {
        return { results: [], noApiKey: true };
      }

      try {
        const res = await fmcsaFetch(`/carriers/name/${encodeURIComponent(input.name)}`);
        const catalysts = res?.content || [];
        return {
          results: catalysts.slice(0, 10).map((c: any) => ({
            dotNumber: String(c.dotNumber || ""),
            legalName: c.legalName || "",
            dbaName: c.dbaName || null,
            state: c.phyState || "",
            status: c.allowedToOperate === "Y" ? "ACTIVE" : "INACTIVE",
            fleetSize: c.totalPowerUnits || 0,
          })),
        };
      } catch {
        return { results: [] };
      }
    }),

  /**
   * HMSP Permit Verification (49 CFR Part 385 Subpart E)
   * Hazardous Materials Safety Permit — required for carriers transporting:
   * - Class 1.1/1.2/1.3 Explosives (highway route controlled)
   * - Class 2.3 Poison Gas (Zone A) or Class 6.1 Poison (Zone A bulk)
   * - Class 7 Radioactive (highway route controlled quantities)
   * - Bulk quantities of certain hazmat classes
   *
   * Cross-references FMCSA carrier data + cargo-carried to determine if
   * the carrier's HMSP status covers the requested hazmat class.
   * NO competitor offers this level of verification.
   */
  verifyHMSP: publicProcedure
    .input(z.object({
      dotNumber: z.string().regex(/^\d{1,8}$/, "USDOT must be 1-8 digits"),
      requestedHazmatClass: z.string().optional(),
      requestedUnNumber: z.string().optional(),
    }))
    .query(async ({ input }) => {
      if (!FMCSA_KEY) {
        return { verified: false, error: "FMCSA API key not configured", noApiKey: true };
      }

      const cacheKey = `hmsp:${input.dotNumber}`;
      const cached = getCached(cacheKey);
      // If cached and no specific class requested, return cached
      if (cached && !input.requestedHazmatClass) return cached;

      try {
        const [catalystRes, cargoRes] = await Promise.allSettled([
          fmcsaFetch(`/carriers/${input.dotNumber}`),
          fmcsaFetch(`/carriers/${input.dotNumber}/cargo-carried`),
        ]);

        const catalyst = catalystRes.status === "fulfilled" ? catalystRes.value : null;
        const c = catalyst?.content?.[0]?.carrier || catalyst?.content?.carrier || catalyst?.content?.[0]?.catalyst || catalyst?.content?.catalyst;
        if (!c) return { verified: false, error: "Carrier not found" };

        const isHazmatAuthorized = c.hazmatFlag === "Y";
        const isAllowedToOperate = c.allowedToOperate === "Y";

        // Parse cargo-carried for specific hazmat classes
        const cargoData = cargoRes.status === "fulfilled" ? cargoRes.value : null;
        const cargoTypes: Array<{ code: string; description: string }> = [];
        if (cargoData?.content) {
          const items = Array.isArray(cargoData.content) ? cargoData.content : [cargoData.content];
          for (const item of items) {
            if (item?.cargoClassDesc || item?.cargoCode) {
              cargoTypes.push({
                code: String(item.cargoCode || ""),
                description: String(item.cargoClassDesc || ""),
              });
            }
          }
        }

        // Determine if carrier handles hazmat cargo types
        const hazmatCargoIndicators = cargoTypes.filter(ct =>
          ct.description?.toLowerCase().includes("hazmat") ||
          ct.description?.toLowerCase().includes("hazardous") ||
          ct.description?.toLowerCase().includes("explosive") ||
          ct.description?.toLowerCase().includes("flammable") ||
          ct.description?.toLowerCase().includes("radioactive") ||
          ct.description?.toLowerCase().includes("corrosive") ||
          ct.description?.toLowerCase().includes("poison") ||
          ct.description?.toLowerCase().includes("oxidizer") ||
          ct.code === "HM"
        );

        // HMSP-required classes per 49 CFR 385.403
        const HMSP_REQUIRED_CLASSES = [
          "1.1", "1.2", "1.3",   // Highway route controlled explosives
          "2.3",                   // Poison gas (Zone A inhalation hazard)
          "6.1",                   // Poison (Zone A, bulk only)
          "7",                     // Radioactive (highway route controlled qty)
        ];

        const hmspRequired = input.requestedHazmatClass
          ? HMSP_REQUIRED_CLASSES.some(cls => input.requestedHazmatClass!.startsWith(cls))
          : false;

        // Safety inspection history for hazmat
        const hazmatInspections = {
          total: c.hazmatInsp || 0,
          oos: c.hazmatOosInsp || 0,
          oosRate: c.hazmatOosRate || 0,
          nationalAvgOosRate: 4.5, // FMCSA national average
          aboveAverage: (c.hazmatOosRate || 0) > 4.5,
        };

        // Build compliance determination
        const checks: Array<{ check: string; status: "pass" | "fail" | "warn"; detail: string; regulation: string }> = [];

        checks.push({
          check: "Operating Authority",
          status: isAllowedToOperate ? "pass" : "fail",
          detail: isAllowedToOperate ? "Carrier authorized to operate" : "Carrier NOT authorized to operate",
          regulation: "49 CFR Part 392",
        });

        checks.push({
          check: "Hazmat Authorization",
          status: isHazmatAuthorized ? "pass" : "fail",
          detail: isHazmatAuthorized ? "Carrier has hazmat authorization (H flag)" : "Carrier does NOT have hazmat authorization",
          regulation: "49 CFR 107 Subpart G",
        });

        if (hmspRequired) {
          checks.push({
            check: "HMSP Permit Required",
            status: isHazmatAuthorized ? "warn" : "fail",
            detail: `Class ${input.requestedHazmatClass} requires HMSP permit per 49 CFR 385.403. ${isHazmatAuthorized ? "Carrier has hazmat flag — verify HMSP permit document on file." : "Carrier lacks hazmat authorization — HMSP cannot be valid."}`,
            regulation: "49 CFR Part 385 Subpart E",
          });
        }

        if (hazmatInspections.aboveAverage) {
          checks.push({
            check: "Hazmat Inspection OOS Rate",
            status: "warn",
            detail: `OOS rate ${hazmatInspections.oosRate}% exceeds national avg (${hazmatInspections.nationalAvgOosRate}%)`,
            regulation: "49 CFR Part 385",
          });
        }

        const failCount = checks.filter(ch => ch.status === "fail").length;
        const warnCount = checks.filter(ch => ch.status === "warn").length;

        const result = {
          verified: true,
          dotNumber: String(c.dotNumber || input.dotNumber),
          legalName: c.legalName || "",
          isAllowedToOperate,
          isHazmatAuthorized,
          hmspRequired,
          hmspStatus: !isHazmatAuthorized ? "NOT_AUTHORIZED" as const :
                      hmspRequired ? "DOCUMENT_VERIFICATION_REQUIRED" as const :
                      "NOT_REQUIRED" as const,
          cargoTypes,
          hazmatCargoIndicators,
          hazmatInspections,
          checks,
          overallStatus: failCount > 0 ? "BLOCKED" as const : warnCount > 0 ? "WARNING" as const : "CLEAR" as const,
          requestedClass: input.requestedHazmatClass || null,
          fetchedAt: new Date().toISOString(),
        };

        if (!input.requestedHazmatClass) setCache(cacheKey, result);
        return result;
      } catch (err: any) {
        return { verified: false, error: err.message || "HMSP verification failed" };
      }
    }),

  /**
   * Hazmat Class Authorization Matching
   * Cross-checks a carrier's FMCSA profile against a specific load's hazmat requirements.
   * Returns a clear pass/fail with specific compliance gaps.
   * 
   * This is the KEY differentiator — no competitor (McLeod, DAT, Uber Freight) offers
   * automated hazmat class-to-carrier authorization matching.
   */
  verifyHazmatAuthorization: publicProcedure
    .input(z.object({
      dotNumber: z.string().regex(/^\d{1,8}$/, "USDOT must be 1-8 digits"),
      hazmatClass: z.string(),
      unNumber: z.string().optional(),
      weight: z.number().optional(),
      weightUnit: z.enum(["lbs", "kg"]).default("lbs"),
      requiresTankerEndorsement: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      if (!FMCSA_KEY) {
        return { authorized: false, error: "FMCSA API key not configured", noApiKey: true };
      }

      try {
        const [catalystRes, cargoRes, basicsRes] = await Promise.allSettled([
          fmcsaFetch(`/carriers/${input.dotNumber}`),
          fmcsaFetch(`/carriers/${input.dotNumber}/cargo-carried`),
          fmcsaFetch(`/carriers/${input.dotNumber}/basics`),
        ]);

        const catalyst = catalystRes.status === "fulfilled" ? catalystRes.value : null;
        const c = catalyst?.content?.[0]?.carrier || catalyst?.content?.carrier || catalyst?.content?.[0]?.catalyst || catalyst?.content?.catalyst;
        if (!c) return { authorized: false, error: "Carrier not found" };

        const gaps: Array<{ requirement: string; status: "missing" | "expired" | "insufficient"; regulation: string; severity: "critical" | "warning" }> = [];
        const passed: Array<{ requirement: string; detail: string }> = [];

        // 1. Operating authority
        if (c.allowedToOperate !== "Y") {
          gaps.push({ requirement: "Operating Authority", status: "missing", regulation: "49 CFR Part 392", severity: "critical" });
        } else {
          passed.push({ requirement: "Operating Authority", detail: "Active and authorized" });
        }

        // 2. Hazmat flag
        if (c.hazmatFlag !== "Y") {
          gaps.push({ requirement: "Hazmat Authorization", status: "missing", regulation: "49 CFR 107 Subpart G", severity: "critical" });
        } else {
          passed.push({ requirement: "Hazmat Authorization", detail: "Hazmat flag active" });
        }

        // 3. Insurance adequacy for hazmat
        if (c.bipdInsuranceRequired === "Y" && c.bipdInsuranceOnFile !== "Y") {
          gaps.push({ requirement: "BIPD Insurance", status: "missing", regulation: "49 CFR Part 387", severity: "critical" });
        }

        // 4. Safety rating check
        if (c.safetyRating === "UNSATISFACTORY") {
          gaps.push({ requirement: "Safety Rating", status: "insufficient", regulation: "49 CFR Part 385", severity: "critical" });
        } else if (c.safetyRating === "CONDITIONAL") {
          gaps.push({ requirement: "Safety Rating", status: "insufficient", regulation: "49 CFR Part 385", severity: "warning" });
        }

        // 5. Hazmat inspection history
        const hazmatOOS = c.hazmatOosRate || 0;
        if (hazmatOOS > 10) {
          gaps.push({ requirement: "Hazmat OOS Rate", status: "insufficient", regulation: "49 CFR Part 385", severity: "critical" });
        } else if (hazmatOOS > 4.5) {
          gaps.push({ requirement: "Hazmat OOS Rate", status: "insufficient", regulation: "49 CFR Part 385", severity: "warning" });
        }

        // 6. HMSP permit requirement check
        const HMSP_CLASSES = ["1.1", "1.2", "1.3", "2.3", "6.1", "7"];
        const needsHMSP = HMSP_CLASSES.some(cls => input.hazmatClass.startsWith(cls));
        if (needsHMSP) {
          if (c.hazmatFlag !== "Y") {
            gaps.push({ requirement: "HMSP Permit", status: "missing", regulation: "49 CFR 385.403", severity: "critical" });
          } else {
            passed.push({ requirement: "HMSP Permit Eligibility", detail: `Hazmat authorized — verify physical HMSP permit for Class ${input.hazmatClass}` });
          }
        }

        // 7. CSA BASICs check
        const basics = basicsRes.status === "fulfilled" ? basicsRes.value : null;
        if (basics?.content) {
          const basicsList = Array.isArray(basics.content) ? basics.content : [basics.content];
          for (const b of basicsList) {
            if (b?.basicsType === "HM Compliance" && b?.basicsViolationThreshold === "Exceeds") {
              gaps.push({ requirement: "CSA HM Compliance BASIC", status: "insufficient", regulation: "49 CFR Part 385", severity: "critical" });
            }
          }
        }

        const criticalGaps = gaps.filter(g => g.severity === "critical");
        const authorized = criticalGaps.length === 0;

        return {
          authorized,
          dotNumber: String(c.dotNumber || input.dotNumber),
          legalName: c.legalName || "",
          requestedHazmatClass: input.hazmatClass,
          requestedUnNumber: input.unNumber || null,
          needsHMSP,
          gaps,
          passed,
          summary: {
            totalChecks: gaps.length + passed.length,
            passed: passed.length,
            criticalGaps: criticalGaps.length,
            warnings: gaps.filter(g => g.severity === "warning").length,
          },
          recommendation: authorized
            ? gaps.length > 0
              ? "AUTHORIZED WITH WARNINGS — carrier meets minimum requirements but has compliance items to address"
              : "FULLY AUTHORIZED — carrier passes all hazmat authorization checks"
            : `NOT AUTHORIZED — ${criticalGaps.length} critical gap(s): ${criticalGaps.map(g => g.requirement).join(", ")}`,
          fetchedAt: new Date().toISOString(),
        };
      } catch (err: any) {
        return { authorized: false, error: err.message || "Authorization check failed" };
      }
    }),
});
