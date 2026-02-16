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
});
