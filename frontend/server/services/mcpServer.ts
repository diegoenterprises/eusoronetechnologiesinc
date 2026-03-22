/**
 * MCP SERVER — Model Context Protocol
 * Exposes EusoTrip platform data & tools via MCP for AI-powered integrations.
 * 
 * Transport: Streamable HTTP (stateless)
 * Auth: Bearer token via MCP_API_KEY env var
 * Mount point: /api/mcp (see _core/index.ts)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import type { Express, Request, Response } from "express";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import {
  loads, users, companies, detentionClaims, platformFeeConfigs,
  loadBids, wallets, hzCarrierSafety,
  pricebookEntries, pricebookHistory,
  fscSchedules, fscLookupTable, fscHistory,
  portalAccessTokens, portalLoadLinks, portalAuditLog,
  creditChecks, factoringInvoices,
  drivers, vehicles, settlements, notifications,
  conversations, messages, documents, inspections,
  agreements,
  experiments, variantAssignments, metricEvents, experimentResults,
  tenantBranding, blockchainAuditTrail,
  adrCompliance, adrDriverCertifications, imdgCompliance,
  autonomousVehicles, avTelemetry, tenants, tenantDataIsolation,
  incidents, escortAssignments, allocationContracts, allocationDailyTracking,
  certifications,
  railShipments, railCarriers, railYards, railcars, trainConsists, railShipmentEvents,
  vesselShipments, vessels, ports, shippingContainers, containerTracking, vesselShipmentEvents,
  vesselISPSRecords, vesselInspections,
  intermodalShipments, intermodalSegments,
  hosState, hosLogs, fsmaTempLogs, bridgeClearanceChecks, mfaTokens,
} from "../../drizzle/schema";
import { eq, and, desc, like, sql, count, gte, lte, or, inArray } from "drizzle-orm";

const MCP_API_KEY = process.env.MCP_API_KEY || "";

// ════════════════════════════════════════════════════════════════════════════
// CODEBASE ROOT — bundled source snapshot shipped with the deploy
// In production the source snapshot is at dist/src-snapshot/
// In development it's the repo root
// ════════════════════════════════════════════════════════════════════════════
const REPO_ROOT = (() => {
  // Production: bundled code is dist/index.js → snapshot is dist/src-snapshot/
  const snapshotPath = path.resolve(import.meta.dirname, "src-snapshot");
  if (fs.existsSync(snapshotPath)) return snapshotPath;
  // Dev fallback: repo root (walk up from server/services/)
  let devRoot = import.meta.dirname;
  for (let i = 0; i < 6; i++) {
    devRoot = path.dirname(devRoot);
    if (fs.existsSync(path.join(devRoot, "frontend")) && fs.existsSync(path.join(devRoot, "backend"))) return devRoot;
  }
  return snapshotPath; // will gracefully fail
})();

/** Prevent path traversal attacks — resolve and verify the path stays within REPO_ROOT */
function safePath(relative: string): string | null {
  const resolved = path.resolve(REPO_ROOT, relative.replace(/^\/+/, ""));
  if (!resolved.startsWith(REPO_ROOT)) return null;
  return resolved;
}

/** Skip binary / heavy / useless dirs */
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", "__pycache__", "venv", ".DS_Store"]);

// ════════════════════════════════════════════════════════════════════════════
// MCP SERVER INSTANCE
// ════════════════════════════════════════════════════════════════════════════

function createEusoTripMcpServer(): McpServer {
  const mcp = new McpServer(
    { name: "EusoTrip Platform", version: "5.0.0" },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
      instructions: `You are connected to the EusoTrip logistics platform — a full-stack freight management system built by Eusorone Technologies Inc.
Use these tools to query loads, users, companies, drivers, vehicles, settlements, FMCSA carrier safety data, dispatch operations, financial analytics, and more.
All monetary values are in USD. Dates are ISO 8601. User roles: DRIVER, CATALYST (carrier/broker), SHIPPER, DISPATCHER, BROKER, TERMINAL_MANAGER, ADMIN, SUPER_ADMIN.
Domains: eusotrip.com (primary), eusorone.com (alias). Stack: React + TypeScript, Express + tRPC, MySQL, Azure App Service.`,
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: search_loads
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "search_loads",
    "Search freight loads on the EusoTrip platform. Filter by status, origin, destination, cargo type, or get recent loads.",
    {
      status: z.string().optional().describe("Filter by status: available, assigned, in_transit, delivered, cancelled"),
      origin: z.string().optional().describe("Filter by pickup location (partial match)"),
      destination: z.string().optional().describe("Filter by delivery location (partial match)"),
      cargoType: z.string().optional().describe("Filter by cargo type"),
      limit: z.number().optional().default(20).describe("Max results (default 20)"),
    },
    async ({ status, origin, destination, cargoType, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      const conditions = [];
      if (status) conditions.push(eq(loads.status, status as any));
      if (origin) conditions.push(like(loads.pickupLocation, `%${origin}%`));
      if (destination) conditions.push(like(loads.deliveryLocation, `%${destination}%`));
      if (cargoType) conditions.push(eq(loads.cargoType, cargoType as any));

      const results = await db.select({
        id: loads.id,
        loadNumber: loads.loadNumber,
        status: loads.status,
        pickupLocation: loads.pickupLocation,
        deliveryLocation: loads.deliveryLocation,
        cargoType: loads.cargoType,
        weight: loads.weight,
        rate: loads.rate,
        distance: loads.distance,
        createdAt: loads.createdAt,
      })
        .from(loads)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(loads.createdAt))
        .limit(limit || 20);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ count: results.length, loads: results }, null, 2),
        }],
      };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: get_load_details
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "get_load_details",
    "Get full details for a specific load by ID or load number, including assigned driver, shipper, and bids.",
    {
      loadId: z.number().optional().describe("Load ID"),
      loadNumber: z.string().optional().describe("Load number (e.g. LD-00123)"),
    },
    async ({ loadId, loadNumber }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      const condition = loadId
        ? eq(loads.id, loadId)
        : loadNumber
          ? eq(loads.loadNumber, loadNumber)
          : undefined;
      if (!condition) return { content: [{ type: "text" as const, text: "Provide loadId or loadNumber" }] };

      const [load] = await db.select().from(loads).where(condition).limit(1);
      if (!load) return { content: [{ type: "text" as const, text: "Load not found" }] };

      // Get bids
      const bids = await db.select({
        id: loadBids.id,
        bidAmount: loadBids.bidAmount,
        status: loadBids.status,
        bidderUserId: loadBids.bidderUserId,
        createdAt: loadBids.createdAt,
      }).from(loadBids).where(eq(loadBids.loadId, load.id)).orderBy(desc(loadBids.createdAt));

      // Get driver info
      let driver = null;
      if (load.driverId) {
        const [d] = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
          .from(users).where(eq(users.id, load.driverId)).limit(1);
        driver = d || null;
      }

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ load, driver, bids }, null, 2),
        }],
      };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: list_users
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "list_users",
    "List platform users. Filter by role, search by name or email.",
    {
      role: z.string().optional().describe("Filter by role: DRIVER, CATALYST, SHIPPER, DISPATCHER, BROKER, ADMIN, SUPER_ADMIN, TERMINAL_MANAGER"),
      search: z.string().optional().describe("Search by name or email (partial match)"),
      limit: z.number().optional().default(25).describe("Max results"),
    },
    async ({ role, search, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      const conditions = [];
      if (role) conditions.push(eq(users.role, role as any));
      if (search) conditions.push(or(like(users.name, `%${search}%`), like(users.email, `%${search}%`)));

      const results = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        companyId: users.companyId,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(limit || 25);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ count: results.length, users: results }, null, 2),
        }],
      };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: get_user_details
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "get_user_details",
    "Get full profile for a specific user by ID or email, including wallet balance.",
    {
      userId: z.number().optional().describe("User ID"),
      email: z.string().optional().describe("User email"),
    },
    async ({ userId, email }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      const condition = userId ? eq(users.id, userId) : email ? eq(users.email, email) : undefined;
      if (!condition) return { content: [{ type: "text" as const, text: "Provide userId or email" }] };

      const [user] = await db.select().from(users).where(condition).limit(1);
      if (!user) return { content: [{ type: "text" as const, text: "User not found" }] };

      // Wallet
      let wallet = null;
      try {
        const [w] = await db.select({
          availableBalance: wallets.availableBalance,
          pendingBalance: wallets.pendingBalance,
          totalReceived: wallets.totalReceived,
          totalSpent: wallets.totalSpent,
          stripeAccountStatus: wallets.stripeAccountStatus,
        }).from(wallets).where(eq(wallets.userId, user.id)).limit(1);
        wallet = w || null;
      } catch {}

      // Company
      let company = null;
      if (user.companyId) {
        const [c] = await db.select({ id: companies.id, name: companies.name, dotNumber: companies.dotNumber, mcNumber: companies.mcNumber })
          .from(companies).where(eq(companies.id, user.companyId)).limit(1);
        company = c || null;
      }

      // Sanitize sensitive fields
      const { password, ...safeUser } = user as any;

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ user: safeUser, wallet, company }, null, 2),
        }],
      };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: search_companies
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "search_companies",
    "Search companies/carriers on the platform by name, DOT number, or MC number.",
    {
      search: z.string().optional().describe("Company name (partial match)"),
      dotNumber: z.string().optional().describe("USDOT number"),
      mcNumber: z.string().optional().describe("MC number"),
      limit: z.number().optional().default(20),
    },
    async ({ search, dotNumber, mcNumber, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      const conditions = [];
      if (search) conditions.push(like(companies.name, `%${search}%`));
      if (dotNumber) conditions.push(eq(companies.dotNumber, dotNumber));
      if (mcNumber) conditions.push(eq(companies.mcNumber, mcNumber));

      const results = await db.select({
        id: companies.id,
        name: companies.name,
        dotNumber: companies.dotNumber,
        mcNumber: companies.mcNumber,
        complianceStatus: companies.complianceStatus,
        city: companies.city,
        state: companies.state,
      })
        .from(companies)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(companies.createdAt))
        .limit(limit || 20);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ count: results.length, companies: results }, null, 2),
        }],
      };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: fmcsa_carrier_safety
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "fmcsa_carrier_safety",
    "Look up FMCSA carrier safety data by DOT number. Returns safety rating, BASICs scores, and risk assessment.",
    {
      dotNumber: z.string().describe("USDOT number to look up"),
    },
    async ({ dotNumber }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const [cached] = await db.select().from(hzCarrierSafety).where(eq(hzCarrierSafety.dotNumber, dotNumber)).limit(1);
        if (!cached) return { content: [{ type: "text" as const, text: `No FMCSA data found for DOT# ${dotNumber}` }] };

        const scores = [
          cached.unsafeDrivingScore, cached.hosComplianceScore, cached.driverFitnessScore,
          cached.controlledSubstancesScore, cached.vehicleMaintenanceScore,
          cached.hazmatComplianceScore, cached.crashIndicatorScore,
        ].filter(Boolean).map(Number);
        const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
        const riskLevel = maxScore >= 80 ? "HIGH" : maxScore >= 60 ? "ELEVATED" : maxScore >= 40 ? "MODERATE" : scores.length > 0 ? "LOW" : "UNKNOWN";

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              dotNumber,
              legalName: cached.legalName,
              safetyRating: cached.safetyRating,
              riskLevel,
              basics: {
                unsafeDriving: cached.unsafeDrivingScore ? Number(cached.unsafeDrivingScore) : null,
                hoursOfService: cached.hosComplianceScore ? Number(cached.hosComplianceScore) : null,
                driverFitness: cached.driverFitnessScore ? Number(cached.driverFitnessScore) : null,
                controlledSubstances: cached.controlledSubstancesScore ? Number(cached.controlledSubstancesScore) : null,
                vehicleMaintenance: cached.vehicleMaintenanceScore ? Number(cached.vehicleMaintenanceScore) : null,
                hazmatCompliance: cached.hazmatComplianceScore ? Number(cached.hazmatComplianceScore) : null,
                crashIndicator: cached.crashIndicatorScore ? Number(cached.crashIndicatorScore) : null,
              },
              lastUpdate: cached.lastUpdate?.toISOString() || null,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `FMCSA lookup error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: platform_analytics
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "platform_analytics",
    "Get platform-wide analytics: total loads, users, companies, revenue, and recent activity.",
    {},
    async () => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const [loadCount] = await db.select({ count: sql<number>`count(*)` }).from(loads);
        const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
        const [companyCount] = await db.select({ count: sql<number>`count(*)` }).from(companies);
        const [activeLoads] = await db.select({ count: sql<number>`count(*)` }).from(loads)
          .where(inArray(loads.status, ["available", "assigned", "in_transit"] as any));
        const [deliveredLoads] = await db.select({ count: sql<number>`count(*)` }).from(loads)
          .where(eq(loads.status, "delivered" as any));

        // Users by role
        const roleBreakdown = await db.select({
          role: users.role,
          count: sql<number>`count(*)`,
        }).from(users).groupBy(users.role);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              totalLoads: loadCount?.count || 0,
              activeLoads: activeLoads?.count || 0,
              deliveredLoads: deliveredLoads?.count || 0,
              totalUsers: userCount?.count || 0,
              totalCompanies: companyCount?.count || 0,
              usersByRole: roleBreakdown,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Analytics error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: get_platform_fees
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "get_platform_fees",
    "Get all active platform fee configurations set by Super Admin.",
    {},
    async () => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const configs = await db.select().from(platformFeeConfigs)
          .where(eq(platformFeeConfigs.isActive, true))
          .orderBy(desc(platformFeeConfigs.createdAt));

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ count: configs.length, fees: configs }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Fee config error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: accessorial_stats
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "accessorial_stats",
    "Get accessorial claims summary: pending, approved, paid, disputed counts and total amounts.",
    {},
    async () => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const claims = await db.select({
          status: detentionClaims.status,
          totalAmount: detentionClaims.totalAmount,
        }).from(detentionClaims);

        let pending = 0, approved = 0, paid = 0, disputed = 0, totalAmount = 0;
        for (const c of claims) {
          const amt = c.totalAmount ? parseFloat(c.totalAmount) : 0;
          totalAmount += amt;
          if (c.status === "pending_review" || c.status === "accruing") pending++;
          else if (c.status === "approved") approved++;
          else if (c.status === "paid") paid++;
          else if (c.status === "disputed") disputed++;
        }

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              totalClaims: claims.length,
              pending, approved, paid, disputed,
              totalAmount: Math.round(totalAmount * 100) / 100,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Accessorial stats error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: search_pricebook — query pricebook rate entries
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "search_pricebook",
    "Search pricebook rate entries. Filter by origin, destination, cargo type, or rate type. Returns rate details with cascading priority.",
    {
      origin: z.string().optional().describe("Filter by origin city or state (partial match)"),
      destination: z.string().optional().describe("Filter by destination city or state (partial match)"),
      cargoType: z.string().optional().describe("Filter by cargo type"),
      rateType: z.string().optional().describe("Filter by rate type: per_mile, flat, per_barrel, per_gallon, per_ton"),
      activeOnly: z.boolean().optional().default(true).describe("Only show active entries (default true)"),
      limit: z.number().optional().default(25).describe("Max results"),
    },
    async ({ origin, destination, cargoType, rateType, activeOnly, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const conditions = [];
        if (activeOnly !== false) conditions.push(eq(pricebookEntries.isActive, 1));
        if (cargoType) conditions.push(eq(pricebookEntries.cargoType, cargoType));
        if (rateType) conditions.push(eq(pricebookEntries.rateType, rateType as any));
        if (origin) conditions.push(or(like(pricebookEntries.originCity, `%${origin}%`), like(pricebookEntries.originState, `%${origin}%`)));
        if (destination) conditions.push(or(like(pricebookEntries.destinationCity, `%${destination}%`), like(pricebookEntries.destinationState, `%${destination}%`)));

        const results = await db.select({
          id: pricebookEntries.id,
          entryName: pricebookEntries.entryName,
          originCity: pricebookEntries.originCity,
          originState: pricebookEntries.originState,
          destinationCity: pricebookEntries.destinationCity,
          destinationState: pricebookEntries.destinationState,
          cargoType: pricebookEntries.cargoType,
          rateType: pricebookEntries.rateType,
          rate: pricebookEntries.rate,
          minimumCharge: pricebookEntries.minimumCharge,
          fscIncluded: pricebookEntries.fscIncluded,
          effectiveDate: pricebookEntries.effectiveDate,
          expirationDate: pricebookEntries.expirationDate,
          isActive: pricebookEntries.isActive,
        })
          .from(pricebookEntries)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(pricebookEntries.createdAt))
          .limit(limit || 25);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ count: results.length, entries: results }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Pricebook error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: fsc_schedules — list FSC engine schedules and calculate
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "fsc_schedules",
    "List FSC (fuel surcharge) schedules, including calculation method (CPM, percentage, table), PADD region, and current fuel prices. Can also calculate FSC for a given schedule.",
    {
      scheduleId: z.number().optional().describe("Get details for a specific schedule ID"),
      includeHistory: z.boolean().optional().default(false).describe("Include recent FSC history (last 30 entries)"),
      limit: z.number().optional().default(20),
    },
    async ({ scheduleId, includeHistory, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        if (scheduleId) {
          const [schedule] = await db.select().from(fscSchedules).where(eq(fscSchedules.id, scheduleId)).limit(1);
          if (!schedule) return { content: [{ type: "text" as const, text: `FSC schedule ${scheduleId} not found` }] };

          let lookupTable: any[] = [];
          if (schedule.method === "table") {
            lookupTable = await db.select().from(fscLookupTable)
              .where(eq(fscLookupTable.scheduleId, scheduleId))
              .orderBy(sql`${fscLookupTable.fuelPriceMin} ASC`);
          }

          let history: any[] = [];
          if (includeHistory) {
            history = await db.select().from(fscHistory)
              .where(eq(fscHistory.scheduleId, scheduleId))
              .orderBy(desc(fscHistory.appliedAt))
              .limit(30);
          }

          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({ schedule, lookupTable, history }, null, 2),
            }],
          };
        }

        const schedules = await db.select({
          id: fscSchedules.id,
          scheduleName: fscSchedules.scheduleName,
          method: fscSchedules.method,
          paddRegion: fscSchedules.paddRegion,
          cpmRate: fscSchedules.cpmRate,
          percentageRate: fscSchedules.percentageRate,
          lastPaddPrice: fscSchedules.lastPaddPrice,
          isActive: fscSchedules.isActive,
          lastUpdateAt: fscSchedules.lastUpdateAt,
        })
          .from(fscSchedules)
          .orderBy(desc(fscSchedules.createdAt))
          .limit(limit || 20);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ count: schedules.length, schedules }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `FSC error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: portal_tokens — list customer portal access tokens and analytics
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "portal_tokens",
    "List customer portal access tokens. Shows customer name, status, linked load count, last access. For admin/analytics on the read-only customer portal.",
    {
      activeOnly: z.boolean().optional().default(false).describe("Only show active tokens"),
      limit: z.number().optional().default(25),
    },
    async ({ activeOnly, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const conditions = [];
        if (activeOnly) conditions.push(eq(portalAccessTokens.isActive, 1));

        const tokens = await db.select({
          id: portalAccessTokens.id,
          customerName: portalAccessTokens.customerName,
          customerEmail: portalAccessTokens.customerEmail,
          isActive: portalAccessTokens.isActive,
          expiresAt: portalAccessTokens.expiresAt,
          lastAccessAt: portalAccessTokens.lastAccessAt,
          createdAt: portalAccessTokens.createdAt,
        })
          .from(portalAccessTokens)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(portalAccessTokens.createdAt))
          .limit(limit || 25);

        // Get load counts and audit counts
        const enriched = [];
        for (const t of tokens) {
          const [linkCount]: any = await (db as any).execute(
            sql`SELECT COUNT(*) as cnt FROM portal_load_links WHERE portalTokenId = ${t.id}`
          );
          const [auditCount]: any = await (db as any).execute(
            sql`SELECT COUNT(*) as cnt FROM portal_audit_log WHERE portalTokenId = ${t.id}`
          );
          enriched.push({
            ...t,
            linkedLoads: Array.isArray(linkCount) ? Number(linkCount[0]?.cnt || 0) : 0,
            totalAccesses: Array.isArray(auditCount) ? Number(auditCount[0]?.cnt || 0) : 0,
          });
        }

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ count: enriched.length, tokens: enriched }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Portal tokens error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: portal_audit — customer portal access audit log
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "portal_audit",
    "View customer portal audit log — see who accessed the portal, when, and what they viewed. Filter by token ID.",
    {
      tokenId: z.number().optional().describe("Filter by specific portal token ID"),
      limit: z.number().optional().default(50),
    },
    async ({ tokenId, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const conditions = [];
        if (tokenId) conditions.push(eq(portalAuditLog.portalTokenId, tokenId));

        const entries = await db.select({
          id: portalAuditLog.id,
          portalTokenId: portalAuditLog.portalTokenId,
          action: portalAuditLog.action,
          resourceType: portalAuditLog.resourceType,
          resourceId: portalAuditLog.resourceId,
          accessedAt: portalAuditLog.accessedAt,
        })
          .from(portalAuditLog)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(portalAuditLog.accessedAt))
          .limit(limit || 50);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ count: entries.length, auditLog: entries }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Portal audit error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: credit_check — run or view credit checks on entities
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "credit_check",
    "View credit check history or look up a specific entity's credit score. Platform-internal scoring (300-850) uses FMCSA safety data, payment history, company age, and debtor behavior. Ratings: AAA-D with approve/review/decline recommendation.",
    {
      entityName: z.string().optional().describe("Entity name to look up (partial match)"),
      limit: z.number().optional().default(20).describe("Max results for history"),
    },
    async ({ entityName, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const conditions: any[] = [];
        if (entityName) conditions.push(like(creditChecks.entityName, `%${entityName}%`));

        const rows = await db.select({
          id: creditChecks.id,
          entityName: creditChecks.entityName,
          entityType: creditChecks.entityType,
          mcNumber: creditChecks.mcNumber,
          dotNumber: creditChecks.dotNumber,
          creditScore: creditChecks.creditScore,
          creditRating: creditChecks.creditRating,
          avgDaysToPay: creditChecks.avgDaysToPay,
          yearsInBusiness: creditChecks.yearsInBusiness,
          recommendation: creditChecks.recommendation,
          createdAt: creditChecks.createdAt,
        })
          .from(creditChecks)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(creditChecks.createdAt))
          .limit(limit || 20);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ count: rows.length, creditChecks: rows }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Credit check error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: factoring_overview — factoring invoices and debtor analytics
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "factoring_overview",
    "Get factoring analytics: total invoices, funded amounts, fees collected, aging breakdown, and top debtors. For freight factoring and quick-pay program oversight.",
    {},
    async () => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const [stats] = await db.select({
          totalInvoices: sql<number>`COUNT(*)`,
          totalFactored: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.invoiceAmount} AS DECIMAL)), 0)`,
          totalFunded: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.advanceAmount} AS DECIMAL)), 0)`,
          totalFees: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.factoringFeeAmount} AS DECIMAL)), 0)`,
          pending: sql<number>`SUM(CASE WHEN ${factoringInvoices.status} IN ('submitted', 'under_review', 'approved') THEN 1 ELSE 0 END)`,
          funded: sql<number>`SUM(CASE WHEN ${factoringInvoices.status} = 'funded' THEN 1 ELSE 0 END)`,
          collected: sql<number>`SUM(CASE WHEN ${factoringInvoices.status} = 'collected' THEN 1 ELSE 0 END)`,
          disputed: sql<number>`SUM(CASE WHEN ${factoringInvoices.status} IN ('disputed', 'chargedback', 'short_paid') THEN 1 ELSE 0 END)`,
        }).from(factoringInvoices);

        // Recent invoices
        const recent = await db.select({
          id: factoringInvoices.id,
          invoiceNumber: factoringInvoices.invoiceNumber,
          status: factoringInvoices.status,
          invoiceAmount: factoringInvoices.invoiceAmount,
          advanceAmount: factoringInvoices.advanceAmount,
          submittedAt: factoringInvoices.submittedAt,
        })
          .from(factoringInvoices)
          .orderBy(desc(factoringInvoices.submittedAt))
          .limit(10);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              summary: {
                totalInvoices: stats?.totalInvoices || 0,
                totalFactored: Math.round(stats?.totalFactored || 0),
                totalFunded: Math.round(stats?.totalFunded || 0),
                totalFees: Math.round(stats?.totalFees || 0),
                pending: stats?.pending || 0,
                funded: stats?.funded || 0,
                collected: stats?.collected || 0,
                disputed: stats?.disputed || 0,
              },
              recentInvoices: recent,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Factoring error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: list_directory — browse the codebase
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "list_directory",
    "List files and subdirectories in the EusoTrip codebase. Use '.' or '' for the repo root. Returns file names, sizes, and types.",
    {
      path: z.string().optional().default(".").describe("Relative path from repo root (e.g. 'frontend/server/routers')"),
    },
    async ({ path: relPath }) => {
      const dir = safePath(relPath || ".");
      if (!dir) return { content: [{ type: "text" as const, text: "Invalid path (outside repo)" }] };
      if (!fs.existsSync(dir)) return { content: [{ type: "text" as const, text: `Path not found: ${relPath}` }] };

      const stat = fs.statSync(dir);
      if (!stat.isDirectory()) return { content: [{ type: "text" as const, text: `Not a directory: ${relPath}` }] };

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const items = entries
          .filter(e => !SKIP_DIRS.has(e.name))
          .map(e => {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) {
              let count = 0;
              try { count = fs.readdirSync(full).filter(f => !SKIP_DIRS.has(f)).length; } catch {}
              return { name: e.name + "/", type: "dir", items: count };
            }
            try {
              const s = fs.statSync(full);
              return { name: e.name, type: "file", size: s.size };
            } catch {
              return { name: e.name, type: "file", size: 0 };
            }
          })
          .sort((a, b) => {
            if (a.type === "dir" && b.type !== "dir") return -1;
            if (a.type !== "dir" && b.type === "dir") return 1;
            return a.name.localeCompare(b.name);
          });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ path: relPath || ".", entries: items }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Error listing directory: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: read_file — view source code
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "read_file",
    "Read the contents of a file in the EusoTrip codebase. Returns the full text. For large files, use startLine/endLine to read a portion.",
    {
      path: z.string().describe("Relative path from repo root (e.g. 'frontend/server/routers/loads.ts')"),
      startLine: z.number().optional().describe("Start line number (1-indexed). Omit for full file."),
      endLine: z.number().optional().describe("End line number (1-indexed). Omit for full file."),
    },
    async ({ path: relPath, startLine, endLine }) => {
      const filePath = safePath(relPath);
      if (!filePath) return { content: [{ type: "text" as const, text: "Invalid path (outside repo)" }] };
      if (!fs.existsSync(filePath)) return { content: [{ type: "text" as const, text: `File not found: ${relPath}` }] };

      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) return { content: [{ type: "text" as const, text: `'${relPath}' is a directory. Use list_directory instead.` }] };

      // Skip large binary files
      if (stat.size > 2 * 1024 * 1024) {
        return { content: [{ type: "text" as const, text: `File too large (${(stat.size / 1024 / 1024).toFixed(1)}MB). Max 2MB.` }] };
      }

      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        if (startLine || endLine) {
          const start = Math.max(1, startLine || 1);
          const end = Math.min(lines.length, endLine || lines.length);
          const slice = lines.slice(start - 1, end);
          return {
            content: [{
              type: "text" as const,
              text: `File: ${relPath} (lines ${start}-${end} of ${lines.length})\n\n${slice.map((l, i) => `${start + i}: ${l}`).join("\n")}`,
            }],
          };
        }

        // Full file — cap at 500 lines to keep response manageable
        if (lines.length > 500) {
          return {
            content: [{
              type: "text" as const,
              text: `File: ${relPath} (${lines.length} lines — showing first 500, use startLine/endLine for rest)\n\n${lines.slice(0, 500).map((l, i) => `${i + 1}: ${l}`).join("\n")}`,
            }],
          };
        }

        return {
          content: [{
            type: "text" as const,
            text: `File: ${relPath} (${lines.length} lines)\n\n${content}`,
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Error reading file: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: search_code — grep across the codebase
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "search_code",
    "Search for a pattern (text or regex) across the EusoTrip codebase. Returns matching files and lines. Like grep.",
    {
      query: z.string().describe("Search string or pattern"),
      path: z.string().optional().default(".").describe("Subdirectory to search within (e.g. 'frontend/server')"),
      filePattern: z.string().optional().describe("File glob filter (e.g. '*.ts', '*.tsx')"),
      maxResults: z.number().optional().default(30).describe("Max matching lines to return (default 30)"),
    },
    async ({ query, path: relPath, filePattern, maxResults }) => {
      const searchDir = safePath(relPath || ".");
      if (!searchDir || !fs.existsSync(searchDir)) {
        return { content: [{ type: "text" as const, text: `Invalid search path: ${relPath}` }] };
      }

      try {
        // Use grep if available, otherwise manual search
        const limit = Math.min(maxResults || 30, 100);
        const includeArg = filePattern ? `--include='${filePattern}'` : "";
        const excludeDirs = "--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=venv --exclude-dir=__pycache__";
        const cmd = `grep -rn ${excludeDirs} ${includeArg} -m ${limit} ${JSON.stringify(query)} ${JSON.stringify(searchDir)} 2>/dev/null || true`;

        const output = execSync(cmd, { maxBuffer: 1024 * 1024, timeout: 10000 }).toString();
        const lines = output.trim().split("\n").filter(Boolean);

        // Make paths relative to REPO_ROOT
        const results = lines.map(line => {
          return line.replace(REPO_ROOT + "/", "");
        });

        if (results.length === 0) {
          return { content: [{ type: "text" as const, text: `No matches for "${query}" in ${relPath || "."}` }] };
        }

        return {
          content: [{
            type: "text" as const,
            text: `Found ${results.length} match(es) for "${query}":\n\n${results.join("\n")}`,
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Search error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: get_file_tree — full recursive tree of a directory
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "get_file_tree",
    "Get a full recursive file tree of a directory in the EusoTrip codebase. Useful for understanding project structure.",
    {
      path: z.string().optional().default(".").describe("Relative path (e.g. 'frontend/client/src/pages')"),
      maxDepth: z.number().optional().default(4).describe("Max directory depth (default 4)"),
    },
    async ({ path: relPath, maxDepth }) => {
      const dir = safePath(relPath || ".");
      if (!dir || !fs.existsSync(dir)) {
        return { content: [{ type: "text" as const, text: `Path not found: ${relPath}` }] };
      }

      const lines: string[] = [];
      const walk = (d: string, prefix: string, depth: number) => {
        if (depth > (maxDepth || 4)) return;
        try {
          const entries = fs.readdirSync(d, { withFileTypes: true })
            .filter(e => !SKIP_DIRS.has(e.name))
            .sort((a, b) => {
              if (a.isDirectory() && !b.isDirectory()) return -1;
              if (!a.isDirectory() && b.isDirectory()) return 1;
              return a.name.localeCompare(b.name);
            });
          entries.forEach((e, i) => {
            const isLast = i === entries.length - 1;
            const connector = isLast ? "└── " : "├── ";
            const full = path.join(d, e.name);
            if (e.isDirectory()) {
              lines.push(`${prefix}${connector}${e.name}/`);
              walk(full, prefix + (isLast ? "    " : "│   "), depth + 1);
            } else {
              lines.push(`${prefix}${connector}${e.name}`);
            }
          });
        } catch {}
      };

      lines.push((relPath || ".") + "/");
      walk(dir, "", 1);

      // Cap output
      const maxLines = 500;
      const truncated = lines.length > maxLines;
      const output = lines.slice(0, maxLines).join("\n") + (truncated ? `\n\n... (truncated, ${lines.length - maxLines} more entries)` : "");

      return {
        content: [{
          type: "text" as const,
          text: output,
        }],
      };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: run_sql_query (read-only)
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "run_sql_query",
    "Execute a read-only SQL query against the EusoTrip database. Only SELECT statements are allowed. Use this for custom analytics and data exploration.",
    {
      query: z.string().describe("SQL SELECT query to execute"),
    },
    async ({ query }) => {
      // Safety: only allow SELECT queries
      const trimmed = query.trim().toUpperCase();
      if (!trimmed.startsWith("SELECT")) {
        return { content: [{ type: "text" as const, text: "Only SELECT queries are allowed." }] };
      }
      // Block dangerous keywords
      const blocked = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE"];
      for (const kw of blocked) {
        if (trimmed.includes(kw)) {
          return { content: [{ type: "text" as const, text: `Blocked: query contains '${kw}'. Only read-only SELECT queries are allowed.` }] };
        }
      }

      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const result = await db.execute(sql.raw(query + " LIMIT 100"));
        const rows = Array.isArray(result) ? result[0] : result;
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ rowCount: Array.isArray(rows) ? rows.length : 0, rows }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `SQL error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: search_drivers — list/search drivers with status, HOS, endorsements
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "search_drivers",
    "Search drivers on the platform. Returns driver info, status, safety score, hazmat endorsement, total miles and loads. Join with users table for name/email.",
    {
      status: z.string().optional().describe("Filter by status: active, inactive, suspended, available, off_duty, on_load"),
      companyId: z.number().optional().describe("Filter by company ID"),
      hazmatOnly: z.boolean().optional().describe("Only show drivers with hazmat endorsement"),
      search: z.string().optional().describe("Search driver by name or email (via users table)"),
      limit: z.number().optional().default(25),
    },
    async ({ status, companyId, hazmatOnly, search, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const conditions: any[] = [];
        if (status) conditions.push(eq(drivers.status, status as any));
        if (companyId) conditions.push(eq(drivers.companyId, companyId));
        if (hazmatOnly) conditions.push(eq(drivers.hazmatEndorsement, true));

        let results: any[];
        if (search) {
          results = await db.select({
            driverId: drivers.id, userId: drivers.userId, companyId: drivers.companyId,
            status: drivers.status, safetyScore: drivers.safetyScore,
            hazmatEndorsement: drivers.hazmatEndorsement, totalMiles: drivers.totalMiles,
            totalLoads: drivers.totalLoads, licenseState: drivers.licenseState,
            licenseExpiry: drivers.licenseExpiry, medicalCardExpiry: drivers.medicalCardExpiry,
            name: users.name, email: users.email, phone: users.phone,
          })
            .from(drivers)
            .leftJoin(users, eq(drivers.userId, users.id))
            .where(and(...conditions, or(like(users.name, `%${search}%`), like(users.email, `%${search}%`))))
            .orderBy(desc(drivers.updatedAt))
            .limit(limit || 25);
        } else {
          results = await db.select({
            driverId: drivers.id, userId: drivers.userId, companyId: drivers.companyId,
            status: drivers.status, safetyScore: drivers.safetyScore,
            hazmatEndorsement: drivers.hazmatEndorsement, totalMiles: drivers.totalMiles,
            totalLoads: drivers.totalLoads, licenseState: drivers.licenseState,
            licenseExpiry: drivers.licenseExpiry, medicalCardExpiry: drivers.medicalCardExpiry,
            name: users.name, email: users.email, phone: users.phone,
          })
            .from(drivers)
            .leftJoin(users, eq(drivers.userId, users.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(drivers.updatedAt))
            .limit(limit || 25);
        }

        return { content: [{ type: "text" as const, text: JSON.stringify({ count: results.length, drivers: results }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Driver search error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: list_vehicles — fleet vehicles with status, type, mileage
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "list_vehicles",
    "List fleet vehicles. Filter by type, status, or company. Returns VIN, make/model/year, mileage, status, maintenance dates.",
    {
      vehicleType: z.string().optional().describe("Filter by type: tractor, trailer, tanker, flatbed, refrigerated, dry_van, etc."),
      status: z.string().optional().describe("Filter by status: available, in_use, maintenance, out_of_service"),
      companyId: z.number().optional().describe("Filter by company ID"),
      limit: z.number().optional().default(25),
    },
    async ({ vehicleType, status, companyId, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const conditions: any[] = [];
        if (vehicleType) conditions.push(eq(vehicles.vehicleType, vehicleType as any));
        if (status) conditions.push(eq(vehicles.status, status as any));
        if (companyId) conditions.push(eq(vehicles.companyId, companyId));

        const results = await db.select({
          id: vehicles.id, companyId: vehicles.companyId, vin: vehicles.vin,
          make: vehicles.make, model: vehicles.model, year: vehicles.year,
          licensePlate: vehicles.licensePlate, vehicleType: vehicles.vehicleType,
          capacity: vehicles.capacity, mileage: vehicles.mileage,
          status: vehicles.status, currentDriverId: vehicles.currentDriverId,
          nextMaintenanceDate: vehicles.nextMaintenanceDate,
          nextInspectionDate: vehicles.nextInspectionDate,
        })
          .from(vehicles)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(vehicles.updatedAt))
          .limit(limit || 25);

        return { content: [{ type: "text" as const, text: JSON.stringify({ count: results.length, vehicles: results }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Vehicle list error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: dispatch_board — get current Kanban board state
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "dispatch_board",
    "Get the current dispatch board state — loads grouped by Kanban lane (unassigned, assigned, in_transit, delivered). Shows load counts and details per lane.",
    {},
    async () => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const LANE_MAP: Record<string, string[]> = {
          unassigned: ["posted", "bidding", "unassigned", "draft"],
          assigned: ["assigned", "en_route_pickup", "at_pickup", "loading"],
          in_transit: ["in_transit", "en_route_delivery", "at_delivery", "unloading"],
          delivered: ["delivered"],
        };

        const board: Record<string, any[]> = {};
        for (const [lane, statuses] of Object.entries(LANE_MAP)) {
          const items = await db.select({
            id: loads.id, loadNumber: loads.loadNumber, status: loads.status,
            pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
            rate: loads.rate, driverId: loads.driverId, cargoType: loads.cargoType,
            updatedAt: loads.updatedAt,
          })
            .from(loads)
            .where(inArray(loads.status, statuses as any))
            .orderBy(desc(loads.updatedAt))
            .limit(50);
          board[lane] = items;
        }

        const summary = Object.fromEntries(Object.entries(board).map(([k, v]) => [k, v.length]));
        return { content: [{ type: "text" as const, text: JSON.stringify({ summary, board }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Dispatch board error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: settlement_overview — settlement stats and recent batches
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "settlement_overview",
    "Get settlement overview: total settlements, amounts by status (pending, approved, paid), and recent settlement records.",
    {
      status: z.string().optional().describe("Filter by status"),
      limit: z.number().optional().default(20),
    },
    async ({ status, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const conditions: any[] = [];
        if (status) conditions.push(eq(settlements.status, status as any));

        const results = await db.select().from(settlements)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(settlements.createdAt))
          .limit(limit || 20);

        const [stats] = await db.select({
          total: sql<number>`COUNT(*)`,
          totalAmount: sql<number>`COALESCE(SUM(CAST(${settlements.totalShipperCharge} AS DECIMAL)), 0)`,
        }).from(settlements);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              totalSettlements: stats?.total || 0,
              totalAmount: Math.round((stats?.totalAmount || 0) * 100) / 100,
              recent: results,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Settlement error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: list_agreements — contracts/agreements between parties
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "list_agreements",
    "List agreements (contracts) between platform parties. Filter by status or type. Shows signatories, dates, and terms.",
    {
      status: z.string().optional().describe("Filter by status: draft, sent, signed, executed, terminated, expired"),
      limit: z.number().optional().default(20),
    },
    async ({ status, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const conditions: any[] = [];
        if (status) conditions.push(eq(agreements.status, status as any));

        const results = await db.select().from(agreements)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(agreements.createdAt))
          .limit(limit || 20);

        return { content: [{ type: "text" as const, text: JSON.stringify({ count: results.length, agreements: results }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Agreements error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: wallet_overview — wallet balances and transaction summary
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "wallet_overview",
    "Get wallet balances across the platform. Shows available balance, pending, total received/spent, Stripe status. Filter by user ID.",
    {
      userId: z.number().optional().describe("Get wallet for a specific user ID"),
      limit: z.number().optional().default(25),
    },
    async ({ userId, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        if (userId) {
          const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
          if (!wallet) return { content: [{ type: "text" as const, text: `No wallet found for user ${userId}` }] };
          return { content: [{ type: "text" as const, text: JSON.stringify({ wallet }, null, 2) }] };
        }

        const results = await db.select({
          userId: wallets.userId,
          availableBalance: wallets.availableBalance,
          pendingBalance: wallets.pendingBalance,
          totalReceived: wallets.totalReceived,
          totalSpent: wallets.totalSpent,
          stripeAccountStatus: wallets.stripeAccountStatus,
        })
          .from(wallets)
          .orderBy(desc(wallets.availableBalance))
          .limit(limit || 25);

        const [totals] = await db.select({
          walletCount: sql<number>`COUNT(*)`,
          totalAvailable: sql<number>`COALESCE(SUM(CAST(${wallets.availableBalance} AS DECIMAL)), 0)`,
          totalPending: sql<number>`COALESCE(SUM(CAST(${wallets.pendingBalance} AS DECIMAL)), 0)`,
        }).from(wallets);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              totalWallets: totals?.walletCount || 0,
              platformTotalAvailable: Math.round((totals?.totalAvailable || 0) * 100) / 100,
              platformTotalPending: Math.round((totals?.totalPending || 0) * 100) / 100,
              wallets: results,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Wallet error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: messaging_overview — recent conversations and messages
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "messaging_overview",
    "Get messaging overview: recent conversations and message counts. Useful for understanding platform communication activity.",
    {
      limit: z.number().optional().default(20),
    },
    async ({ limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const convos = await db.select().from(conversations)
          .orderBy(desc(conversations.updatedAt))
          .limit(limit || 20);

        const [msgStats] = await db.select({
          totalMessages: sql<number>`COUNT(*)`,
          totalConversations: sql<number>`(SELECT COUNT(*) FROM conversations)`,
        }).from(messages);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              totalConversations: msgStats?.totalConversations || 0,
              totalMessages: msgStats?.totalMessages || 0,
              recentConversations: convos,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Messaging error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: notification_history — recent platform notifications
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "notification_history",
    "View recent platform notifications. Filter by user ID or type. Shows notification content, read status, priority.",
    {
      userId: z.number().optional().describe("Filter by user ID"),
      limit: z.number().optional().default(30),
    },
    async ({ userId, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };

      try {
        const conditions: any[] = [];
        if (userId) conditions.push(eq(notifications.userId, userId));

        const results = await db.select().from(notifications)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(notifications.createdAt))
          .limit(limit || 30);

        return { content: [{ type: "text" as const, text: JSON.stringify({ count: results.length, notifications: results }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Notification error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 5 TOOLS
  // ══════════════════════════════════════════════════════════════════════════

  // TOOL: list_experiments — Innovation Lab A/B tests
  mcp.tool(
    "list_experiments",
    "List A/B experiments from the Innovation Lab. Filter by status. Shows hypothesis, variants, sample size, and statistical results.",
    {
      status: z.string().optional().describe("Filter by status: draft, running, paused, completed, archived"),
      limit: z.number().optional().default(20),
    },
    async ({ status, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [];
        if (status) conditions.push(eq(experiments.status, status));
        const rows = await db.select().from(experiments)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(experiments.createdAt))
          .limit(limit || 20);

        // Get result summaries
        const enriched = [];
        for (const exp of rows) {
          const results = await db.select().from(experimentResults).where(eq(experimentResults.experimentId, exp.id)).limit(5);
          const [assignCount]: any = await (db as any).execute(sql`SELECT COUNT(*) as cnt FROM variant_assignments WHERE experimentId = ${exp.id}`);
          const [eventCount]: any = await (db as any).execute(sql`SELECT COUNT(*) as cnt FROM metric_events WHERE experimentId = ${exp.id}`);
          enriched.push({
            ...exp,
            totalAssignments: Array.isArray(assignCount) ? Number(assignCount[0]?.cnt || 0) : 0,
            totalEvents: Array.isArray(eventCount) ? Number(eventCount[0]?.cnt || 0) : 0,
            results,
          });
        }

        return { content: [{ type: "text" as const, text: JSON.stringify({ count: enriched.length, experiments: enriched }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Experiments error: ${e.message}` }] };
      }
    }
  );

  // TOOL: blockchain_audit — immutable audit trail
  mcp.tool(
    "blockchain_audit",
    "Query the blockchain audit trail. Search by load ID, event type, or actor. Returns SHA-256 hash-chained audit events with verification status.",
    {
      loadId: z.number().optional().describe("Filter by load ID"),
      eventType: z.string().optional().describe("Filter by event type (e.g. load_created, status_changed, payment_processed)"),
      actorId: z.number().optional().describe("Filter by actor user ID"),
      limit: z.number().optional().default(30),
    },
    async ({ loadId, eventType, actorId, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [];
        if (loadId) conditions.push(eq(blockchainAuditTrail.loadId, loadId));
        if (eventType) conditions.push(eq(blockchainAuditTrail.eventType, eventType));
        // actorId filter not available — blockchainAuditTrail has no actorId column

        const rows = await db.select().from(blockchainAuditTrail)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(blockchainAuditTrail.timestamp))
          .limit(limit || 30);

        const [total]: any = await (db as any).execute(sql`SELECT COUNT(*) as cnt FROM blockchain_audit_trail`);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              totalEvents: Array.isArray(total) ? Number(total[0]?.cnt || 0) : 0,
              returned: rows.length,
              events: rows,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Blockchain audit error: ${e.message}` }] };
      }
    }
  );

  // TOOL: adr_compliance — EU ADR hazmat compliance records
  mcp.tool(
    "adr_compliance",
    "Query EU ADR (Agreement concerning Dangerous goods by Road) compliance records. Search by load, UN number, or ADR class. Includes tunnel restriction codes and driver certifications.",
    {
      loadId: z.number().optional().describe("Filter by load ID"),
      unNumber: z.string().optional().describe("Filter by UN number (e.g. UN1267)"),
      adrClass: z.string().optional().describe("Filter by ADR class (e.g. 3, 2.1, 6.1)"),
      limit: z.number().optional().default(20),
    },
    async ({ loadId, unNumber, adrClass, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [];
        if (loadId) conditions.push(eq(adrCompliance.loadId, loadId));
        if (unNumber) conditions.push(eq(adrCompliance.adrUnNumber, unNumber));
        if (adrClass) conditions.push(eq(adrCompliance.adrClass, adrClass));

        const records = await db.select().from(adrCompliance)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(adrCompliance.createdAt))
          .limit(limit || 20);

        // Get driver certifications
        const certs = await db.select().from(adrDriverCertifications)
          .orderBy(desc(adrDriverCertifications.createdAt))
          .limit(20);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ count: records.length, records, driverCertifications: certs }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `ADR compliance error: ${e.message}` }] };
      }
    }
  );

  // TOOL: imdg_compliance — IMDG Code maritime hazmat compliance
  mcp.tool(
    "imdg_compliance",
    "Query IMDG (International Maritime Dangerous Goods) Code compliance records for multi-modal hazmat shipments. Search by load, UN number, or IMDG class.",
    {
      loadId: z.number().optional().describe("Filter by load ID"),
      unNumber: z.string().optional().describe("Filter by UN number"),
      imdgClass: z.string().optional().describe("Filter by IMDG class"),
      limit: z.number().optional().default(20),
    },
    async ({ loadId, unNumber, imdgClass, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [];
        if (loadId) conditions.push(eq(imdgCompliance.loadId, loadId));
        // unNumber filter not available — imdgCompliance has no unNumber column
        if (imdgClass) conditions.push(eq(imdgCompliance.imdgClass, imdgClass));

        const records = await db.select().from(imdgCompliance)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(imdgCompliance.createdAt))
          .limit(limit || 20);

        return { content: [{ type: "text" as const, text: JSON.stringify({ count: records.length, records }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `IMDG compliance error: ${e.message}` }] };
      }
    }
  );

  // TOOL: autonomous_fleet — AV registration, telemetry, and status
  mcp.tool(
    "autonomous_fleet",
    "Query autonomous vehicle fleet. List registered AVs, get telemetry data, check operational status. Supports emergency takeover monitoring.",
    {
      avId: z.number().optional().describe("Get details + telemetry for a specific AV ID"),
      status: z.string().optional().describe("Filter by status: active, idle, emergency_control, offline"),
      limit: z.number().optional().default(20),
    },
    async ({ avId, status, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        if (avId) {
          const [av] = await db.select().from(autonomousVehicles).where(eq(autonomousVehicles.id, avId)).limit(1);
          if (!av) return { content: [{ type: "text" as const, text: `AV #${avId} not found` }] };
          const telemetry = await db.select().from(avTelemetry)
            .where(eq(avTelemetry.avId, avId))
            .orderBy(desc(avTelemetry.timestamp))
            .limit(20);
          return { content: [{ type: "text" as const, text: JSON.stringify({ vehicle: av, recentTelemetry: telemetry }, null, 2) }] };
        }

        const conditions: any[] = [];
        if (status) conditions.push(eq(autonomousVehicles.operationalStatus, status));

        const vehicles = await db.select().from(autonomousVehicles)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(autonomousVehicles.createdAt))
          .limit(limit || 20);

        // Fleet summary
        const [stats]: any = await (db as any).execute(sql`
          SELECT COUNT(*) as total,
            SUM(CASE WHEN operationalStatus = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN operationalStatus = 'idle' THEN 1 ELSE 0 END) as idle,
            SUM(CASE WHEN operationalStatus = 'emergency_control' THEN 1 ELSE 0 END) as emergency,
            SUM(CASE WHEN operationalStatus = 'offline' THEN 1 ELSE 0 END) as offline
          FROM autonomous_vehicles
        `);
        const fleetStats = Array.isArray(stats) ? stats[0] : {};

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ fleetStats, count: vehicles.length, vehicles }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `AV fleet error: ${e.message}` }] };
      }
    }
  );

  // TOOL: list_tenants — PaaS white-label tenant management
  mcp.tool(
    "list_tenants",
    "List PaaS white-label tenants. Shows tenant status, API key preview, custom domain, user/load limits, and data isolation config.",
    {
      status: z.string().optional().describe("Filter by status: active, suspended, deactivated"),
      limit: z.number().optional().default(20),
    },
    async ({ status, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [];
        if (status) conditions.push(eq(tenants.status, status));

        const rows = await db.select().from(tenants)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(tenants.createdAt))
          .limit(limit || 20);

        // Enrich with branding and isolation
        const enriched = [];
        for (const t of rows) {
          const [branding] = await db.select().from(tenantBranding).where(eq(tenantBranding.tenantId, t.id)).limit(1);
          const [isolation] = await db.select().from(tenantDataIsolation).where(eq(tenantDataIsolation.tenantId, t.id)).limit(1);
          enriched.push({
            ...t,
            tenantKey: t.tenantKey ? `${t.tenantKey.substring(0, 8)}...` : null,
            branding: branding || null,
            dataIsolation: isolation || null,
          });
        }

        return { content: [{ type: "text" as const, text: JSON.stringify({ count: enriched.length, tenants: enriched }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Tenant list error: ${e.message}` }] };
      }
    }
  );

  // TOOL: tenant_branding — white-label branding configs
  mcp.tool(
    "tenant_branding",
    "Get white-label branding configurations for tenants. Shows brand name, colors, fonts, logos, and custom domains.",
    {
      tenantId: z.number().optional().describe("Get branding for a specific tenant ID"),
    },
    async ({ tenantId }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        if (tenantId) {
          const [brand] = await db.select().from(tenantBranding).where(eq(tenantBranding.tenantId, tenantId)).limit(1);
          if (!brand) return { content: [{ type: "text" as const, text: `No branding for tenant ${tenantId}` }] };
          return { content: [{ type: "text" as const, text: JSON.stringify({ branding: brand }, null, 2) }] };
        }
        const brands = await db.select().from(tenantBranding).orderBy(desc(tenantBranding.updatedAt)).limit(50);
        return { content: [{ type: "text" as const, text: JSON.stringify({ count: brands.length, brandings: brands }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Branding error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 6 TOOLS — Operational Intelligence
  // ══════════════════════════════════════════════════════════════════════════

  // TOOL: hos_status — driver HOS compliance
  mcp.tool(
    "hos_status",
    "Get HOS (Hours of Service) status for a driver or fleet-wide summary. Returns driving/on-duty/cycle hours remaining, violations, break status. Uses the 49 CFR 395-compliant HOS engine with ELD integration.",
    {
      driverId: z.number().optional().describe("Specific driver user ID for individual HOS status"),
    },
    async ({ driverId }) => {
      try {
        const { getHOSSummaryWithELD } = await import("../services/hosEngine");
        if (driverId) {
          const summary = await getHOSSummaryWithELD(driverId);
          return { content: [{ type: "text" as const, text: JSON.stringify({ driverId, hos: summary }, null, 2) }] };
        }
        // Fleet-wide: get all active drivers and summarize
        const db = await getDb();
        if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
        const activeDrivers = await db.select({ userId: drivers.userId }).from(drivers)
          .where(eq(drivers.status, "active" as any)).limit(50);
        const fleet: any[] = [];
        for (const d of activeDrivers) {
          if (!d.userId) continue;
          const s = await getHOSSummaryWithELD(d.userId);
          fleet.push({ userId: d.userId, status: s.status, canDrive: s.canDrive, drivingRemaining: s.drivingRemaining, violations: s.violations?.length || 0 });
        }
        return { content: [{ type: "text" as const, text: JSON.stringify({ activeDrivers: fleet.length, fleet }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `HOS error: ${e.message}` }] };
      }
    }
  );

  // TOOL: carrier_scorecard — carrier performance metrics
  mcp.tool(
    "carrier_scorecard",
    "Get carrier performance scorecard. Uses SQL aggregate queries over loads, ratings, and safety data to compute on-time rate, acceptance rate, damage rate, and overall score.",
    {
      carrierId: z.number().optional().describe("Carrier company ID"),
      limit: z.number().optional().default(10).describe("Top carriers to return if no carrierId specified"),
    },
    async ({ carrierId, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        if (carrierId) {
          const [company] = await db.select({ id: companies.id, name: companies.name, dotNumber: companies.dotNumber })
            .from(companies).where(eq(companies.id, carrierId)).limit(1);
          const [stats] = await db.select({
            totalLoads: sql<number>`COUNT(*)`,
            delivered: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
            avgRate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`,
          }).from(loads).where(eq(loads.catalystId, carrierId));
          return { content: [{ type: "text" as const, text: JSON.stringify({ company, stats }, null, 2) }] };
        }
        // Top carriers by load count
        const topCarriers = await db.select({
          carrierId: loads.catalystId,
          totalLoads: sql<number>`COUNT(*)`,
          delivered: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
          avgRate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`,
        }).from(loads)
          .where(sql`${loads.catalystId} IS NOT NULL`)
          .groupBy(loads.catalystId)
          .orderBy(sql`COUNT(*) DESC`)
          .limit(limit || 10);
        return { content: [{ type: "text" as const, text: JSON.stringify({ count: topCarriers.length, topCarriers }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Carrier scorecard error: ${e.message}` }] };
      }
    }
  );

  // TOOL: safety_incidents — safety incidents and investigations
  mcp.tool(
    "safety_incidents",
    "Query safety incidents on the platform. Filter by severity, status, or type. Returns incident details, severity, investigation status, and corrective actions.",
    {
      severity: z.string().optional().describe("Filter by severity: low, medium, high, critical"),
      status: z.string().optional().describe("Filter by status: reported, investigating, resolved, closed"),
      limit: z.number().optional().default(20),
    },
    async ({ severity, status, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [];
        if (severity) conditions.push(eq(incidents.severity, severity as any));
        if (status) conditions.push(eq(incidents.status, status as any));
        const rows = await db.select().from(incidents)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(incidents.createdAt))
          .limit(limit || 20);
        const [stats] = await db.select({
          total: sql<number>`COUNT(*)`,
          critical: sql<number>`SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END)`,
          open: sql<number>`SUM(CASE WHEN status IN ('reported','investigating') THEN 1 ELSE 0 END)`,
        }).from(incidents);
        return { content: [{ type: "text" as const, text: JSON.stringify({ stats, count: rows.length, incidents: rows }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Incidents error: ${e.message}` }] };
      }
    }
  );

  // TOOL: escort_overview — escort/oversize load operations
  mcp.tool(
    "escort_overview",
    "Get escort assignment overview for oversize/overweight load operations. Filter by status. Shows escort type (lead, chase, height pole), route, driver assignments.",
    {
      status: z.string().optional().describe("Filter by status: pending, assigned, active, completed, cancelled"),
      limit: z.number().optional().default(20),
    },
    async ({ status, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [];
        if (status) conditions.push(eq(escortAssignments.status, status as any));
        const rows = await db.select().from(escortAssignments)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(escortAssignments.createdAt))
          .limit(limit || 20);
        const [stats] = await db.select({
          total: sql<number>`COUNT(*)`,
          active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
          pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
          completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
        }).from(escortAssignments);
        return { content: [{ type: "text" as const, text: JSON.stringify({ stats, count: rows.length, assignments: rows }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Escort error: ${e.message}` }] };
      }
    }
  );

  // TOOL: allocation_tracker — volume/barrel allocation tracking
  mcp.tool(
    "allocation_tracker",
    "Get allocation contract tracking — daily barrel/volume fulfillment against take-or-pay commitments. Shows contracts, daily tracking, and fill rates.",
    {
      contractId: z.number().optional().describe("Get details for a specific allocation contract"),
      limit: z.number().optional().default(20),
    },
    async ({ contractId, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        if (contractId) {
          const [contract] = await db.select().from(allocationContracts).where(eq(allocationContracts.id, contractId)).limit(1);
          if (!contract) return { content: [{ type: "text" as const, text: `Contract ${contractId} not found` }] };
          const tracking = await db.select().from(allocationDailyTracking)
            .where(eq(allocationDailyTracking.allocationContractId, contractId))
            .orderBy(desc(allocationDailyTracking.trackingDate))
            .limit(30);
          return { content: [{ type: "text" as const, text: JSON.stringify({ contract, recentTracking: tracking }, null, 2) }] };
        }
        const contracts = await db.select().from(allocationContracts)
          .orderBy(desc(allocationContracts.createdAt))
          .limit(limit || 20);
        return { content: [{ type: "text" as const, text: JSON.stringify({ count: contracts.length, contracts }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Allocation error: ${e.message}` }] };
      }
    }
  );

  // TOOL: compliance_overview — platform compliance status
  mcp.tool(
    "compliance_overview",
    "Get compliance overview across the platform. Summarizes driver certifications, document expiry, insurance status, and FMCSA compliance by company.",
    {},
    async () => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const now = new Date();
        // Expiring certifications in next 30 days
        const thirtyDaysOut = new Date(now.getTime() + 30 * 86400000);
        const [certStats] = await db.select({
          totalCerts: sql<number>`COUNT(*)`,
          expired: sql<number>`SUM(CASE WHEN expiryDate < NOW() THEN 1 ELSE 0 END)`,
          expiringSoon: sql<number>`SUM(CASE WHEN expiryDate BETWEEN NOW() AND ${thirtyDaysOut.toISOString().slice(0, 10)} THEN 1 ELSE 0 END)`,
        }).from(certifications);

        // Document stats
        const [docStats] = await db.select({
          totalDocs: sql<number>`COUNT(*)`,
        }).from(documents);

        // Inspection stats
        const [inspStats] = await db.select({
          totalInspections: sql<number>`COUNT(*)`,
        }).from(inspections);

        // Active driver count
        const [driverStats] = await db.select({
          total: sql<number>`COUNT(*)`,
          active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
          suspended: sql<number>`SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END)`,
        }).from(drivers);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              certifications: certStats,
              documents: docStats,
              inspections: inspStats,
              drivers: driverStats,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Compliance error: ${e.message}` }] };
      }
    }
  );

  // TOOL: eld_fleet_status — ELD connections and fleet telematics
  mcp.tool(
    "eld_fleet_status",
    "Get ELD (Electronic Logging Device) fleet status. Shows which companies/drivers have ELD connections (Motive, Samsara, KeepTruckin), connection health, and last sync.",
    {},
    async () => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        // Check if eld_connections table exists
        const [tables]: any = await (db as any).execute(sql`SHOW TABLES LIKE 'eld_connections'`);
        if (!Array.isArray(tables) || tables.length === 0) {
          return { content: [{ type: "text" as const, text: JSON.stringify({ message: "ELD connections table not yet provisioned. ELD data is accessed via the HOS engine fallback." }, null, 2) }] };
        }
        const [stats]: any = await (db as any).execute(sql`
          SELECT provider, COUNT(*) as cnt, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active
          FROM eld_connections GROUP BY provider
        `);
        return { content: [{ type: "text" as const, text: JSON.stringify({ providers: Array.isArray(stats) ? stats : [] }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `ELD error: ${e.message}` }] };
      }
    }
  );

  // TOOL: inspection_records — vehicle and driver inspections
  mcp.tool(
    "inspection_records",
    "Query inspection records (DOT roadside inspections, pre/post-trip DVIR, Zeun mechanic inspections). Filter by type, result, or driver.",
    {
      driverId: z.number().optional().describe("Filter by driver ID"),
      vehicleId: z.number().optional().describe("Filter by vehicle ID"),
      limit: z.number().optional().default(20),
    },
    async ({ driverId, vehicleId, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [];
        if (driverId) conditions.push(eq(inspections.driverId, driverId));
        if (vehicleId) conditions.push(eq(inspections.vehicleId, vehicleId));

        const rows = await db.select().from(inspections)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(inspections.createdAt))
          .limit(limit || 20);

        const [stats] = await db.select({
          total: sql<number>`COUNT(*)`,
        }).from(inspections);

        return { content: [{ type: "text" as const, text: JSON.stringify({ totalRecords: stats?.total || 0, returned: rows.length, inspections: rows }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Inspection error: ${e.message}` }] };
      }
    }
  );

  // TOOL: certifications_status — driver/company certifications and expiry
  mcp.tool(
    "certifications_status",
    "Query driver and company certifications (CDL, hazmat, TWIC, medical card, etc). Shows expiry dates and compliance status. Filter by type or expiry window.",
    {
      userId: z.number().optional().describe("Filter by user ID"),
      expiringSoon: z.boolean().optional().describe("Show only certifications expiring in the next 30 days"),
      limit: z.number().optional().default(25),
    },
    async ({ userId, expiringSoon, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [];
        if (userId) conditions.push(eq(certifications.userId, userId));
        if (expiringSoon) {
          const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
          conditions.push(sql`${certifications.expiryDate} BETWEEN NOW() AND ${thirtyDays}`);
        }

        const rows = await db.select().from(certifications)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(sql`${certifications.expiryDate} ASC`)
          .limit(limit || 25);

        return { content: [{ type: "text" as const, text: JSON.stringify({ count: rows.length, certifications: rows }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Certifications error: ${e.message}` }] };
      }
    }
  );

  // TOOL: zeun_maintenance — Zeun mechanic/maintenance system (Viga + Gemini)
  mcp.tool(
    "zeun_maintenance",
    "Query the Zeun maintenance system — EusoTrip's mechanic module powered by Viga photo AI and Gemini diagnostics. Shows maintenance orders, work history, and vehicle health. Photo inspections live here.",
    {
      vehicleId: z.number().optional().describe("Filter by vehicle ID"),
      status: z.string().optional().describe("Filter by status: open, in_progress, completed, cancelled"),
      limit: z.number().optional().default(20),
    },
    async ({ vehicleId, status, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        // Check if maintenance_orders table exists
        const [tables]: any = await (db as any).execute(sql`SHOW TABLES LIKE 'maintenance_orders'`);
        if (!Array.isArray(tables) || tables.length === 0) {
          // Fall back to inspections table for maintenance data
          const conditions: any[] = [];
          if (vehicleId) conditions.push(eq(inspections.vehicleId, vehicleId));
          const rows = await db.select().from(inspections)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(inspections.createdAt)).limit(limit || 20);
          return { content: [{ type: "text" as const, text: JSON.stringify({ source: "inspections_fallback", note: "Zeun maintenance_orders table not yet provisioned. Showing inspection records.", count: rows.length, records: rows }, null, 2) }] };
        }
        const query = status
          ? sql`SELECT * FROM maintenance_orders WHERE status = ${status} ORDER BY createdAt DESC LIMIT ${limit || 20}`
          : vehicleId
            ? sql`SELECT * FROM maintenance_orders WHERE vehicleId = ${vehicleId} ORDER BY createdAt DESC LIMIT ${limit || 20}`
            : sql`SELECT * FROM maintenance_orders ORDER BY createdAt DESC LIMIT ${limit || 20}`;
        const [rows]: any = await (db as any).execute(query);
        return { content: [{ type: "text" as const, text: JSON.stringify({ source: "zeun", count: Array.isArray(rows) ? rows.length : 0, orders: rows }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Zeun error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RESOURCE: platform overview
  // ══════════════════════════════════════════════════════════════════════════
  mcp.resource(
    "Platform Overview",
    "eusotrip://platform/overview",
    { description: "High-level overview of the EusoTrip platform architecture and capabilities", mimeType: "text/plain" },
    async () => ({
      contents: [{
        uri: "eusotrip://platform/overview",
        mimeType: "text/plain",
        text: `EusoTrip — Full-Stack Freight & Logistics Platform
Built by Eusorone Technologies Inc. (CEO: Mike "Diego" Usoro)

DOMAINS: eusotrip.com (primary), eusorone.com (redirects)
STACK: React + TypeScript (frontend), Express + tRPC (API), MySQL (DB), Azure App Service (hosting)
AI: ESANG AI (Gemini 2.0 Flash) — chat, SPECTRA-MATCH product ID, RAG knowledge base

USER ROLES:
- DRIVER — CDL drivers, submit PODs, track HOS, earn via loads
- CATALYST — Carriers/brokers who bid on loads, manage fleets
- SHIPPER — Post loads, pay carriers, manage supply chain
- DISPATCHER — Coordinate loads, assign drivers
- BROKER — Match shippers with carriers
- TERMINAL_MANAGER — Manage fuel terminals, SCADA, access validation
- ADMIN / SUPER_ADMIN — Platform management, fee configuration, analytics

KEY FEATURES:
- Load lifecycle: post → bid → assign → pickup → in_transit → deliver → pay
- EusoWallet: Stripe Connect wallets for instant pay, escrow, payouts
- FMCSA integration: carrier safety scoring, compliance verification
- Gamification: missions, XP, leaderboards
- Document Center: 560+ compliance documents with OCR
- Hot Zones: 22+ data sources for market intelligence
- Platform fees: dynamic, configurable by Super Admin
- Accessorial management: detention, lumper, TONU claims
- Dispatch Planner: daily driver slot scheduling with drag-and-drop
- Settlement Batching: 3-level batch grouping & approval workflows
- Allocation Tracker: daily barrel/volume tracking per contract
- Bulk Load Import: CSV upload wizard with validation and preview
- Pricebook: rate sheets with cascading priority lookup, CSV import/export, rate history
- FSC Engine: fuel surcharge calculator — CPM, percentage, table lookup with PADD pricing
- Customer Portal: read-only token-based portal for shippers/brokers, GPS tracking with 2-min delay
- Agreements: digital contract management with e-signature workflow
- Commission Engine: automated commission calculations for brokers/agents
- CDL Verification: driver license and endorsement validation
- Factoring Credit Score: platform-internal 300-850 scoring using FMCSA safety, payment history, company age (AAA-D ratings)
- EusoSMS: Azure Communication Services SMS gateway with retry queue, opt-out management, delivery tracking (30+ event types)

PHASE 5 — SCALE + POLISH + INNOVATION (GAP-436 → GAP-451):
- Innovation Lab: A/B testing framework with stratified cohort assignment, t-test/chi-square statistical significance
- Blockchain Audit Trail: SHA-256 hash-chained immutable event log with chain verification
- EU ADR Compliance: DOT→ADR class mapping, Annex III tunnel restriction codes, driver certification validation
- IMDG Code: International Maritime Dangerous Goods compliance for multi-modal hazmat shipments
- Autonomous Vehicle Integration: AV registration, telemetry ingestion, emergency takeover/release
- PaaS White-Label Infrastructure: multi-tenant isolation, API key management, custom domains
- White-Label Branding: per-tenant logos, colors, fonts, custom domains
- i18n: react-i18next with EN/ES/FR locales, browser language detection
- Phase 5 Command Center: 8-tab unified admin hub at /super-admin/phase5

PHASE 6 — OPERATIONAL INTELLIGENCE (MCP v3.0):
- HOS Engine: 49 CFR 395-compliant hours-of-service tracking with ELD integration
- Carrier Scorecard: aggregate carrier performance from loads, ratings, and FMCSA safety data
- Safety Incidents: incident reporting, investigation tracking, corrective actions
- Escort Operations: oversize/overweight escort assignments with lead/chase/height pole tracking
- Allocation Tracker: take-or-pay barrel/volume daily fulfillment tracking
- Compliance Overview: cross-domain compliance health (certs, docs, inspections, drivers)
- ELD Fleet Status: Electronic Logging Device connection health by provider
- Inspection Records: DOT roadside, DVIR pre/post-trip, Zeun mechanic inspections
- Certifications: CDL, hazmat, TWIC, medical card expiry tracking
- Zeun Maintenance: mechanic module powered by Viga photo AI + Gemini diagnostics

PHASE 7 — CROSS-BORDER OPERATIONS (MCP v4.0):
- Mexican Import Compliance: RFC, Padron, Agente Aduanal, Carta Porte, NOM checks
- Mexican Tax Estimation: IGI duty, IVA, DTA, IEPS with USMCA/IMMEX exemptions
- VUCEM Portal: Digital trade procedures by authority (COFEPRIS, SEMARNAT, etc.)
- NOM Standards: Official Mexican standards lookup by sector
- MX Border Crossings: Infrastructure, capacity, hours for US-MX crossings
- Canadian Compliance: Provincial weights, TDG, CBSA docs, permits
- USMCA/T-MEC: Rules of origin, certificate requirements, duty savings
- Trusted Programs: FAST, SENTRI, NEXUS, C-TPAT, PIP, NEEC with time savings
- Vertical Pricing: Multi-modal freight quoting with cross-border premiums (USD/CAD/MXN)
- HOS Comparison: US/CA/MX hours-of-service rule comparison
- Currency Conversion: Live USD/CAD/MXN exchange rates

PHASE 8 — P0 SAFETY & COMPLIANCE (MCP v5.0):
- HOS Persistence: DB-backed state + immutable audit logs per 49 CFR 395.8 (no more in-memory loss on restart)
- HOS Timezone: driver-specific timezone support, no hardcoded Central
- FSMA Food Safety: temperature logging with FDA excursion detection per 21 CFR 1.908
- Bridge Clearance: vehicle height vs bridge clearance validation per 23 CFR 650
- 2FA/MFA: TOTP setup/verify with backup codes for platform security
- Transport Mode Guards: ctx.user enriched with transportModes from DB for rail/vessel access control

MCP TOOLS (74 total): search_loads, get_load_details, list_users, get_user_details, search_companies, fmcsa_carrier_safety, platform_analytics, get_platform_fees, accessorial_stats, search_pricebook, fsc_schedules, portal_tokens, portal_audit, credit_check, factoring_overview, list_directory, read_file, search_code, get_file_tree, run_sql_query, search_drivers, list_vehicles, dispatch_board, settlement_overview, list_agreements, wallet_overview, messaging_overview, notification_history, list_experiments, blockchain_audit, adr_compliance, imdg_compliance, autonomous_fleet, list_tenants, tenant_branding, hos_status, carrier_scorecard, safety_incidents, escort_overview, allocation_tracker, compliance_overview, eld_fleet_status, inspection_records, certifications_status, zeun_maintenance, cross_border_mx_compliance, cross_border_mx_taxes, cross_border_vucem, cross_border_nom, cross_border_mx_crossings, cross_border_ca_compliance, cross_border_usmca, cross_border_trusted_programs, cross_border_pricing, cross_border_base_rates, cross_border_surcharges, cross_border_hos, cross_border_currency, hos_audit_logs, fsma_compliance, bridge_clearance, mfa_status`,
      }],
    })
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RESOURCE: database schema
  // ══════════════════════════════════════════════════════════════════════════
  mcp.resource(
    "Database Tables",
    "eusotrip://database/tables",
    { description: "Key database tables and their purpose", mimeType: "text/plain" },
    async () => {
      const db = await getDb();
      let tableList = "Database unavailable";
      if (db) {
        try {
          const tables = await db.execute(sql.raw("SHOW TABLES"));
          const rows = Array.isArray(tables) ? tables[0] : tables;
          tableList = Array.isArray(rows) ? rows.map((r: any) => Object.values(r)[0]).join("\n") : "Could not list tables";
        } catch (e: any) {
          tableList = `Error: ${e.message}`;
        }
      }
      return {
        contents: [{
          uri: "eusotrip://database/tables",
          mimeType: "text/plain",
          text: tableList,
        }],
      };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PROMPT: business_report
  // ══════════════════════════════════════════════════════════════════════════
  mcp.prompt(
    "business_report",
    "Generate a business intelligence report for the EusoTrip platform",
    {
      focus: z.string().optional().describe("Report focus area: revenue, operations, growth, safety, compliance"),
      period: z.string().optional().describe("Time period: today, week, month, quarter, year"),
    },
    async ({ focus, period }) => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Generate a comprehensive ${focus || "executive"} report for the EusoTrip platform covering the ${period || "current month"}. 
Use the available tools to pull real data:
1. Call platform_analytics for overall metrics
2. Call dispatch_board for current dispatch state
3. Call search_loads to analyze load volume and trends
4. Call search_drivers for fleet driver status
5. Call settlement_overview for financial settlements
6. Call wallet_overview for platform-wide balances
7. Call factoring_overview for factoring program health
8. Call accessorial_stats for claims data
9. Call get_platform_fees for current fee structure
10. Call hos_status for fleet HOS compliance
11. Call carrier_scorecard for top carrier performance
12. Call safety_incidents for safety metrics
13. Call compliance_overview for compliance health
14. Call certifications_status with expiringSoon=true for upcoming expirations

Format as a professional business report with sections, key metrics, trends, and actionable recommendations.`,
        },
      }],
    })
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: search_rail_shipments
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "search_rail_shipments",
    "Search rail shipments on the EusoTrip platform. Filter by status, origin, destination, or carrier.",
    {
      status: z.string().optional().describe("Filter by status: pending, car_ordered, car_placed, loading, loaded, in_transit, at_interchange, in_yard, spotted, unloading, delivered, cancelled"),
      originRailroad: z.string().optional().describe("Filter by origin railroad reporting mark (e.g. BNSF, UP)"),
      destinationRailroad: z.string().optional().describe("Filter by destination railroad mark"),
      carrierMark: z.string().optional().describe("Filter by primary carrier reporting mark (e.g. BNSF, UP, CSX, NS)"),
      limit: z.number().optional().default(20).describe("Max results (default 20)"),
    },
    async ({ status, originRailroad, destinationRailroad, carrierMark, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      const conds = [];
      if (status) conds.push(eq(railShipments.status, status as any));
      if (originRailroad) conds.push(eq(railShipments.originRailroad, originRailroad));
      if (destinationRailroad) conds.push(eq(railShipments.destinationRailroad, destinationRailroad));
      if (carrierMark) {
        const carrier = await db.select({ id: railCarriers.id }).from(railCarriers).where(eq(railCarriers.reportingMark, carrierMark)).limit(1);
        if (carrier.length > 0) conds.push(eq(railShipments.carrierId, carrier[0].id));
      }
      const results = await db.select({
        id: railShipments.id, shipmentNumber: railShipments.shipmentNumber, status: railShipments.status,
        originRailroad: railShipments.originRailroad, destinationRailroad: railShipments.destinationRailroad,
        commodity: railShipments.commodity, weight: railShipments.weight, hazmatClass: railShipments.hazmatClass,
        createdAt: railShipments.createdAt,
      }).from(railShipments).where(conds.length > 0 ? and(...conds) : undefined).orderBy(desc(railShipments.createdAt)).limit(limit || 20);
      return { content: [{ type: "text" as const, text: JSON.stringify({ count: results.length, railShipments: results }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: get_rail_shipment_details
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "get_rail_shipment_details",
    "Get full details for a rail shipment by ID or shipment number, including events and railcar info.",
    {
      id: z.number().optional().describe("Rail shipment ID"),
      shipmentNumber: z.string().optional().describe("Rail shipment number"),
    },
    async ({ id, shipmentNumber }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      const cond = id ? eq(railShipments.id, id) : shipmentNumber ? eq(railShipments.shipmentNumber, shipmentNumber) : null;
      if (!cond) return { content: [{ type: "text" as const, text: "Provide id or shipmentNumber" }] };
      const [shipment] = await db.select().from(railShipments).where(cond).limit(1);
      if (!shipment) return { content: [{ type: "text" as const, text: "Rail shipment not found" }] };
      const events = await db.select().from(railShipmentEvents).where(eq(railShipmentEvents.shipmentId, shipment.id)).orderBy(desc(railShipmentEvents.timestamp)).limit(50);
      const cars = await db.select().from(railcars).where(eq(railcars.assignedShipmentId, shipment.id));
      return { content: [{ type: "text" as const, text: JSON.stringify({ shipment, events, railcars: cars }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: rail_yard_lookup
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "rail_yard_lookup",
    "Search rail yards by railroad, state, or intermodal capability.",
    {
      state: z.string().optional().describe("Filter by US state abbreviation"),
      railroad: z.string().optional().describe("Filter by railroad reporting mark"),
      intermodal: z.boolean().optional().describe("Filter to intermodal-capable yards only"),
      limit: z.number().optional().default(25).describe("Max results (default 25)"),
    },
    async ({ state, railroad, intermodal, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      const conds = [];
      if (state) conds.push(eq(railYards.state, state));
      if (intermodal) conds.push(eq(railYards.hasIntermodal, true));
      if (railroad) {
        const carrier = await db.select({ id: railCarriers.id }).from(railCarriers).where(eq(railCarriers.reportingMark, railroad)).limit(1);
        if (carrier.length > 0) conds.push(eq(railYards.railroadId, carrier[0].id));
      }
      const results = await db.select().from(railYards).where(conds.length > 0 ? and(...conds) : undefined).limit(limit || 25);
      return { content: [{ type: "text" as const, text: JSON.stringify({ count: results.length, yards: results }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: rail_carrier_info
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "rail_carrier_info",
    "Get railroad company details by reporting mark (e.g. BNSF, UP, CSX, NS, KCS).",
    {
      reportingMark: z.string().describe("Railroad reporting mark (e.g. BNSF, UP, CSX)"),
    },
    async ({ reportingMark }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      const [carrier] = await db.select().from(railCarriers).where(eq(railCarriers.reportingMark, reportingMark.toUpperCase())).limit(1);
      if (!carrier) return { content: [{ type: "text" as const, text: `Railroad '${reportingMark}' not found` }] };
      const yardCount = await db.select({ c: count() }).from(railYards).where(eq(railYards.railroadId, carrier.id));
      const shipmentCount = await db.select({ c: count() }).from(railShipments).where(eq(railShipments.carrierId, carrier.id));
      return { content: [{ type: "text" as const, text: JSON.stringify({ carrier, yards: yardCount[0]?.c || 0, shipments: shipmentCount[0]?.c || 0 }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: rail_compliance_status
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "rail_compliance_status",
    "Get FRA compliance status for a rail carrier including inspection history.",
    {
      reportingMark: z.string().describe("Railroad reporting mark"),
    },
    async ({ reportingMark }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      const [carrier] = await db.select().from(railCarriers).where(eq(railCarriers.reportingMark, reportingMark.toUpperCase())).limit(1);
      if (!carrier) return { content: [{ type: "text" as const, text: `Railroad '${reportingMark}' not found` }] };
      const recentInspections = await db.execute(sql`SELECT ri.*, rc.railcarNumber FROM rail_inspections ri LEFT JOIN railcars rc ON ri.railcarId = rc.id ORDER BY ri.inspectionDate DESC LIMIT 20`);
      return { content: [{ type: "text" as const, text: JSON.stringify({ carrier: { name: carrier.name, reportingMark: carrier.reportingMark, classType: carrier.classType, dotNumber: carrier.dotNumber, isActive: carrier.isActive }, recentInspections }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: search_vessel_bookings
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "search_vessel_bookings",
    "Search vessel/maritime shipments by status, port, carrier, or booking number.",
    {
      status: z.string().optional().describe("Filter by status: pending, confirmed, gate_in, loaded, departed, in_transit, arrived, discharged, customs_hold, customs_cleared, gate_out, delivered, cancelled"),
      portOfLoading: z.string().optional().describe("Filter by port of loading name (partial match)"),
      portOfDischarge: z.string().optional().describe("Filter by port of discharge name (partial match)"),
      carrier: z.string().optional().describe("Filter by shipping line name (partial match)"),
      limit: z.number().optional().default(20).describe("Max results (default 20)"),
    },
    async ({ status, portOfLoading, portOfDischarge, carrier, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      const conds = [];
      if (status) conds.push(eq(vesselShipments.status, status as any));
      if (portOfLoading) {
        const p = await db.select({ id: ports.id }).from(ports).where(like(ports.name, `%${portOfLoading}%`)).limit(1);
        if (p.length > 0) conds.push(eq(vesselShipments.originPortId, p[0].id));
      }
      if (portOfDischarge) {
        const p = await db.select({ id: ports.id }).from(ports).where(like(ports.name, `%${portOfDischarge}%`)).limit(1);
        if (p.length > 0) conds.push(eq(vesselShipments.destinationPortId, p[0].id));
      }
      if (carrier) conds.push(like(vesselShipments.serviceRoute, `%${carrier}%`));
      const results = await db.select({
        id: vesselShipments.id, bookingNumber: vesselShipments.bookingNumber, billOfLading: vesselShipments.billOfLading,
        status: vesselShipments.status, serviceRoute: vesselShipments.serviceRoute,
        commodity: vesselShipments.commodity, numberOfContainers: vesselShipments.numberOfContainers,
        hazmatClass: vesselShipments.hazmatClass, createdAt: vesselShipments.createdAt,
      }).from(vesselShipments).where(conds.length > 0 ? and(...conds) : undefined).orderBy(desc(vesselShipments.createdAt)).limit(limit || 20);
      return { content: [{ type: "text" as const, text: JSON.stringify({ count: results.length, vesselBookings: results }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: get_vessel_booking_details
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "get_vessel_booking_details",
    "Get full details for a vessel booking by ID or booking number, including events and containers.",
    {
      id: z.number().optional().describe("Vessel shipment ID"),
      bookingNumber: z.string().optional().describe("Vessel booking number"),
    },
    async ({ id, bookingNumber }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      const cond = id ? eq(vesselShipments.id, id) : bookingNumber ? eq(vesselShipments.bookingNumber, bookingNumber) : null;
      if (!cond) return { content: [{ type: "text" as const, text: "Provide id or bookingNumber" }] };
      const [booking] = await db.select().from(vesselShipments).where(cond).limit(1);
      if (!booking) return { content: [{ type: "text" as const, text: "Vessel booking not found" }] };
      const events = await db.select().from(vesselShipmentEvents).where(eq(vesselShipmentEvents.shipmentId, booking.id)).orderBy(desc(vesselShipmentEvents.timestamp)).limit(50);
      const containers = await db.select().from(shippingContainers).where(eq(shippingContainers.assignedShipmentId, booking.id));
      return { content: [{ type: "text" as const, text: JSON.stringify({ booking, events, containers }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: port_lookup
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "port_lookup",
    "Search ports by country, name, UN/LOCODE, or capabilities (rail access, container terminal).",
    {
      country: z.string().optional().describe("Filter by country code (US, CA, MX)"),
      name: z.string().optional().describe("Filter by port name (partial match)"),
      unlocode: z.string().optional().describe("Filter by UN/LOCODE"),
      hasRailAccess: z.boolean().optional().describe("Filter to ports with rail access"),
      limit: z.number().optional().default(25).describe("Max results (default 25)"),
    },
    async ({ country, name, unlocode, hasRailAccess, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      const conds = [];
      if (country) conds.push(eq(ports.country, country as any));
      if (name) conds.push(like(ports.name, `%${name}%`));
      if (unlocode) conds.push(eq(ports.unlocode, unlocode));
      if (hasRailAccess) conds.push(eq(ports.hasRailAccess, true));
      const results = await db.select().from(ports).where(conds.length > 0 ? and(...conds) : undefined).limit(limit || 25);
      return { content: [{ type: "text" as const, text: JSON.stringify({ count: results.length, ports: results }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: container_tracking
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "container_tracking",
    "Track a shipping container by container number across all transport modes.",
    {
      containerNumber: z.string().describe("Container number (e.g. MSCU1234567)"),
    },
    async ({ containerNumber }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      const [container] = await db.select().from(shippingContainers).where(eq(shippingContainers.containerNumber, containerNumber)).limit(1);
      if (!container) return { content: [{ type: "text" as const, text: `Container '${containerNumber}' not found` }] };
      const tracking = await db.select().from(containerTracking).where(eq(containerTracking.containerId, container.id)).orderBy(desc(containerTracking.timestamp)).limit(50);
      let vesselBooking = null;
      if (container.assignedShipmentId) {
        const [b] = await db.select({ bookingNumber: vesselShipments.bookingNumber, status: vesselShipments.status, serviceRoute: vesselShipments.serviceRoute }).from(vesselShipments).where(eq(vesselShipments.id, container.assignedShipmentId)).limit(1);
        vesselBooking = b || null;
      }
      return { content: [{ type: "text" as const, text: JSON.stringify({ container, vesselBooking, trackingHistory: tracking }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: vessel_compliance_status
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "vessel_compliance_status",
    "Get maritime compliance status (ISM/ISPS/MARPOL) for a vessel by name or IMO number.",
    {
      vesselName: z.string().optional().describe("Vessel name (partial match)"),
      imoNumber: z.string().optional().describe("IMO number"),
    },
    async ({ vesselName, imoNumber }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      const cond = imoNumber ? eq(vessels.imoNumber, imoNumber) : vesselName ? like(vessels.name, `%${vesselName}%`) : null;
      if (!cond) return { content: [{ type: "text" as const, text: "Provide vesselName or imoNumber" }] };
      const [vessel] = await db.select().from(vessels).where(cond).limit(1);
      if (!vessel) return { content: [{ type: "text" as const, text: "Vessel not found" }] };
      const ispsRecords = await db.select().from(vesselISPSRecords).where(eq(vesselISPSRecords.vesselId, vessel.id)).orderBy(desc(vesselISPSRecords.createdAt)).limit(10);
      const inspectionRecords = await db.select().from(vesselInspections).where(eq(vesselInspections.vesselId, vessel.id)).orderBy(desc(vesselInspections.inspectionDate)).limit(10);
      return { content: [{ type: "text" as const, text: JSON.stringify({ vessel: { id: vessel.id, name: vessel.name, imoNumber: vessel.imoNumber, mmsiNumber: vessel.mmsiNumber, vesselType: vessel.vesselType, flag: vessel.flag, classificationSociety: vessel.classificationSociety, ownerCompany: vessel.ownerCompany }, ispsRecords, inspections: inspectionRecords }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: search_intermodal_shipments
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "search_intermodal_shipments",
    "Search multi-modal intermodal shipments that span truck, rail, and/or vessel modes.",
    {
      status: z.string().optional().describe("Filter by status: pending, in_transit, at_transfer, delivered, cancelled"),
      origin: z.string().optional().describe("Filter by origin (partial match)"),
      destination: z.string().optional().describe("Filter by destination (partial match)"),
      limit: z.number().optional().default(20).describe("Max results (default 20)"),
    },
    async ({ status, origin, destination, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      const conds = [];
      if (status) conds.push(eq(intermodalShipments.status, status as any));
      if (origin) conds.push(sql`JSON_EXTRACT(originLocation, '$.description') LIKE ${`%${origin}%`}`);
      if (destination) conds.push(sql`JSON_EXTRACT(destinationLocation, '$.description') LIKE ${`%${destination}%`}`);
      const results = await db.select({
        id: intermodalShipments.id, intermodalNumber: intermodalShipments.intermodalNumber,
        status: intermodalShipments.status, originLocation: intermodalShipments.originLocation,
        destinationLocation: intermodalShipments.destinationLocation, numberOfSegments: intermodalShipments.numberOfSegments,
        createdAt: intermodalShipments.createdAt,
      }).from(intermodalShipments).where(conds.length > 0 ? and(...conds) : undefined).orderBy(desc(intermodalShipments.createdAt)).limit(limit || 20);
      return { content: [{ type: "text" as const, text: JSON.stringify({ count: results.length, intermodalShipments: results }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TOOL: get_intermodal_journey
  // ══════════════════════════════════════════════════════════════════════════
  mcp.tool(
    "get_intermodal_journey",
    "Get full journey detail for an intermodal shipment including all segments across transport modes.",
    {
      id: z.number().optional().describe("Intermodal shipment ID"),
      intermodalNumber: z.string().optional().describe("Intermodal shipment number"),
    },
    async ({ id, intermodalNumber }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      const cond = id ? eq(intermodalShipments.id, id) : intermodalNumber ? eq(intermodalShipments.intermodalNumber, intermodalNumber) : null;
      if (!cond) return { content: [{ type: "text" as const, text: "Provide id or intermodalNumber" }] };
      const [shipment] = await db.select().from(intermodalShipments).where(cond).limit(1);
      if (!shipment) return { content: [{ type: "text" as const, text: "Intermodal shipment not found" }] };
      const segments = await db.select().from(intermodalSegments).where(eq(intermodalSegments.intermodalShipmentId, shipment.id)).orderBy(intermodalSegments.legNumber);
      return { content: [{ type: "text" as const, text: JSON.stringify({ shipment, segments }, null, 2) }] };
    }
  );


  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 7 — CROSS-BORDER OPERATIONS TOOLS
  // ══════════════════════════════════════════════════════════════════════════

  // TOOL: cross_border_compliance — Mexican import compliance check
  mcp.tool(
    "cross_border_mx_compliance",
    "Check Mexican import compliance. Verifies RFC, Padron de Importadores, Agente Aduanal, Carta Porte, NOM certification, and USMCA eligibility for a given product type.",
    {
      hasRFC: z.boolean().describe("Does the importer have a valid RFC (tax ID)?"),
      hasPadronImportadores: z.boolean().describe("Is the importer registered in Padron de Importadores?"),
      hasAgenteAduanal: z.boolean().describe("Is a licensed customs broker (Agente Aduanal) assigned?"),
      hasCartaPorte: z.boolean().describe("Has a Carta Porte CFDI been generated?"),
      productType: z.string().describe("Product type (e.g. electronics, food, chemicals, textiles, automotive, pharmaceutical)"),
      hasNOMCert: z.boolean().optional().describe("Has applicable NOM certification?"),
      isUSMCA: z.boolean().optional().describe("Is this a USMCA/T-MEC origin shipment?"),
      hasOriginCert: z.boolean().optional().describe("Has certificate of origin?"),
    },
    async ({ hasRFC, hasPadronImportadores, hasAgenteAduanal, hasCartaPorte, productType, hasNOMCert, isUSMCA, hasOriginCert }) => {
      try {
        const { checkMexicanImportCompliance } = await import("./mexicanDeepDive");
        const result = checkMexicanImportCompliance({
          hasRFC, hasPadronImportadores, hasAgenteAduanal, hasCartaPorte, productType,
          hasNOMCert: hasNOMCert ?? false, isUSMCA: isUSMCA ?? false, hasOriginCert: hasOriginCert ?? false,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `MX compliance error: ${e.message}` }] };
      }
    }
  );

  // TOOL: cross_border_mx_taxes — estimate Mexican import duties and taxes
  mcp.tool(
    "cross_border_mx_taxes",
    "Estimate Mexican import taxes (IGI duty, IVA 16%, DTA 0.8%, optional IEPS) for a given customs value. Supports USMCA and IMMEX exemptions.",
    {
      customsValueUSD: z.number().describe("Customs value in USD"),
      htsRate: z.number().describe("HTS tariff rate as decimal (e.g. 0.05 for 5%)"),
      isUSMCA: z.boolean().optional().describe("USMCA/T-MEC origin (duty exemption)"),
      isIMMEX: z.boolean().optional().describe("IMMEX/maquiladora program (IVA deferral)"),
      hasIEPS: z.boolean().optional().describe("Subject to IEPS excise tax?"),
      iepsRate: z.number().optional().describe("IEPS rate as decimal if applicable"),
    },
    async ({ customsValueUSD, htsRate, isUSMCA, isIMMEX, hasIEPS, iepsRate }) => {
      try {
        const { estimateMexicanImportTaxes } = await import("./mexicanDeepDive");
        const result = estimateMexicanImportTaxes({
          customsValueUSD, htsRate,
          isUSMCA: isUSMCA ?? false, isIMMEX: isIMMEX ?? false,
          hasIEPS: hasIEPS ?? false, iepsRate: iepsRate ?? 0,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `MX tax estimate error: ${e.message}` }] };
      }
    }
  );

  // TOOL: cross_border_vucem — VUCEM portal procedures
  mcp.tool(
    "cross_border_vucem",
    "Get VUCEM (Ventanilla Unica de Comercio Exterior Mexicano) digital trade procedures. Filter by authority (COFEPRIS, SEMARNAT, SENASICA, SE, SAT, SEDENA).",
    {
      authority: z.string().optional().describe("Filter by Mexican authority (e.g. COFEPRIS, SEMARNAT, SENASICA, SE, SAT, SEDENA)"),
    },
    async ({ authority }) => {
      try {
        const { getVUCEMProcedures } = await import("./mexicanDeepDive");
        const result = getVUCEMProcedures(authority);
        return { content: [{ type: "text" as const, text: JSON.stringify({ count: result.length, procedures: result }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `VUCEM error: ${e.message}` }] };
      }
    }
  );

  // TOOL: cross_border_nom — NOM standards lookup
  mcp.tool(
    "cross_border_nom",
    "Look up Mexican NOM (Norma Oficial Mexicana) standards by sector. Returns standard ID, description, and applicable products.",
    {
      sector: z.string().optional().describe("Filter by sector (e.g. electronics, food, chemicals, textiles, automotive, pharmaceutical)"),
    },
    async ({ sector }) => {
      try {
        const { getNOMStandards } = await import("./mexicanDeepDive");
        const result = getNOMStandards(sector);
        return { content: [{ type: "text" as const, text: JSON.stringify({ count: result.length, standards: result }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `NOM error: ${e.message}` }] };
      }
    }
  );

  // TOOL: cross_border_mx_crossings — Mexican border crossing info
  mcp.tool(
    "cross_border_mx_crossings",
    "Get information on major US-Mexico border crossings including location, capacity, hours, and commercial capabilities. Filter by Mexican state or crossing type.",
    {
      state: z.string().optional().describe("Filter by Mexican state (e.g. Tamaulipas, Chihuahua, Sonora, Baja California)"),
      type: z.string().optional().describe("Filter by type (e.g. COMMERCIAL, PASSENGER, RAIL)"),
      minCapacity: z.number().optional().describe("Minimum daily truck capacity"),
    },
    async ({ state, type, minCapacity }) => {
      try {
        const { getMXBorderCrossings } = await import("./mexicanDeepDive");
        const result = getMXBorderCrossings({ state, type, minCapacity });
        return { content: [{ type: "text" as const, text: JSON.stringify({ count: result.length, crossings: result }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `MX crossings error: ${e.message}` }] };
      }
    }
  );

  // TOOL: cross_border_canadian_compliance — Canadian compliance check
  mcp.tool(
    "cross_border_ca_compliance",
    "Run a full Canadian compliance check for a cross-border shipment. Checks provincial weight limits, TDG dangerous goods, CBSA document requirements, and provincial permits.",
    {
      province: z.string().describe("Canadian province code (e.g. ON, QC, BC, AB)"),
      gvwKg: z.number().describe("Gross vehicle weight in kg"),
      hasHazmat: z.boolean().optional().describe("Is the load hazmat/TDG regulated?"),
      tdgClass: z.string().optional().describe("TDG class if hazmat (e.g. 3, 2.1, 6.1)"),
    },
    async ({ province, gvwKg, hasHazmat, tdgClass }) => {
      try {
        const { runFullCanadianComplianceCheck } = await import("./canadianCompliance");
        const now = new Date();
        const isWinter = now.getMonth() >= 10 || now.getMonth() <= 2; // Nov-Mar
        const result = runFullCanadianComplianceCheck({
          provinces: [province as any],
          gvw_kg: gvwKg,
          isWinter,
          hasDangerousGoods: hasHazmat ?? false,
          tdgClass,
          hasShippingDoc: true,
          hasPlacards: hasHazmat ?? false,
          hasERAP: false,
          driverTDGTrained: hasHazmat ?? false,
          hasInsurance: true,
          insuranceAmount_CAD: 2000000,
          hasACIeManifest: true,
          hasPARS: true,
          hasCCI: true,
          hasB3: true,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `CA compliance error: ${e.message}` }] };
      }
    }
  );

  // TOOL: cross_border_usmca — USMCA/T-MEC eligibility check
  mcp.tool(
    "cross_border_usmca",
    "Check USMCA/T-MEC eligibility for a product. Returns rules of origin, certificate requirements, and duty savings estimate.",
    {
      htsCode: z.string().optional().describe("HTS tariff code"),
      productCategory: z.string().optional().describe("Product category"),
    },
    async ({ htsCode, productCategory }) => {
      try {
        const { getUSMCAOriginRules, getUSMCACertificateRequirements } = await import("./crossBorderHardening");
        const rules = getUSMCAOriginRules();
        const certReqs = getUSMCACertificateRequirements();
        return { content: [{ type: "text" as const, text: JSON.stringify({ originRules: rules, certificateRequirements: certReqs }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `USMCA error: ${e.message}` }] };
      }
    }
  );

  // TOOL: cross_border_trusted_programs — FAST/SENTRI/NEXUS/C-TPAT programs
  mcp.tool(
    "cross_border_trusted_programs",
    "Get information on trusted traveler/shipper programs (FAST, SENTRI, NEXUS, C-TPAT, PIP, NEEC, AEO). Shows eligibility criteria, benefits, and estimated border time savings.",
    {
      programId: z.string().optional().describe("Specific program ID for time savings estimate"),
    },
    async ({ programId }) => {
      try {
        const { getTrustedPrograms, estimateBorderTimeSavings } = await import("./crossBorderHardening");
        const programs = getTrustedPrograms();
        let timeSavings = null;
        if (programId) timeSavings = estimateBorderTimeSavings(programId);
        return { content: [{ type: "text" as const, text: JSON.stringify({ count: programs.length, programs, timeSavings }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Trusted programs error: ${e.message}` }] };
      }
    }
  );

  // TOOL: cross_border_pricing — generate freight quote with cross-border premiums
  mcp.tool(
    "cross_border_pricing",
    "Generate a freight quote with mode-specific rates, surcharges, and cross-border premiums. Supports TRUCK/RAIL/VESSEL modes in USD/CAD/MXN.",
    {
      mode: z.enum(["TRUCK", "RAIL", "VESSEL"]).describe("Transport mode"),
      rateId: z.string().describe("Base rate ID (e.g. TR-DRY-MI, RL-INTER-CTR, VS-FCL-40)"),
      quantity: z.number().describe("Quantity (miles, containers, tons, etc.)"),
      distance: z.number().optional().describe("Distance in miles/km (for per-mile/km rates)"),
      surchargeIds: z.array(z.string()).optional().describe("Surcharge IDs to apply (e.g. SC-FSC, SC-XBORDER, SC-HAZ)"),
      crossBorder: z.boolean().optional().describe("Is this a cross-border shipment?"),
      direction: z.string().optional().describe("Cross-border direction (US_TO_CA, CA_TO_US, US_TO_MX, MX_TO_US)"),
      currency: z.enum(["USD", "CAD", "MXN"]).optional().describe("Quote currency (default USD)"),
    },
    async ({ mode, rateId, quantity, distance, surchargeIds, crossBorder, direction, currency }) => {
      try {
        const { generateQuote } = await import("./verticalPricingEngine");
        const result = generateQuote({
          mode, rateId, quantity, distance,
          surchargeIds: surchargeIds || [],
          crossBorder: crossBorder ?? false,
          direction,
          currency: currency ?? "USD",
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Pricing error: ${e.message}` }] };
      }
    }
  );

  // TOOL: cross_border_base_rates — list available freight rates
  mcp.tool(
    "cross_border_base_rates",
    "List all available freight base rates across TRUCK, RAIL, and VESSEL modes. Filter by mode or currency. Shows rate ID, unit, base rate, and conditions.",
    {
      mode: z.enum(["TRUCK", "RAIL", "VESSEL"]).optional().describe("Filter by transport mode"),
      currency: z.enum(["USD", "CAD", "MXN"]).optional().describe("Filter by currency"),
    },
    async ({ mode, currency }) => {
      try {
        const { getBaseRates } = await import("./verticalPricingEngine");
        const result = getBaseRates({ mode: mode as any, currency: currency as any });
        return { content: [{ type: "text" as const, text: JSON.stringify({ count: result.length, rates: result }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Base rates error: ${e.message}` }] };
      }
    }
  );

  // TOOL: cross_border_surcharges — list freight surcharges and accessorials
  mcp.tool(
    "cross_border_surcharges",
    "List all freight surcharges and accessorials (fuel, cross-border, equipment, handling, hazmat, specialty). Filter by mode or category.",
    {
      mode: z.enum(["TRUCK", "RAIL", "VESSEL"]).optional().describe("Filter by applicable mode"),
      category: z.string().optional().describe("Filter by category keyword (e.g. fuel, hazmat, cross-border, detention, drayage)"),
    },
    async ({ mode, category }) => {
      try {
        const { getSurcharges } = await import("./verticalPricingEngine");
        const result = getSurcharges({ mode: mode as any, category });
        return { content: [{ type: "text" as const, text: JSON.stringify({ count: result.length, surcharges: result }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Surcharges error: ${e.message}` }] };
      }
    }
  );

  // TOOL: cross_border_hos — get HOS rules for US/CA/MX
  mcp.tool(
    "cross_border_hos",
    "Get Hours of Service rules for US (49 CFR 395), Canada (SOR/2005-313), and Mexico (NOM-087-SCT). Compare rules across jurisdictions and check border transition requirements.",
    {
      country: z.enum(["US", "CA", "MX"]).optional().describe("Specific country HOS rules"),
    },
    async ({ country }) => {
      try {
        const { getHOSRuleSummary } = await import("./hosBorderTransition");
        if (country) {
          const rules = getHOSRuleSummary(country as any);
          return { content: [{ type: "text" as const, text: JSON.stringify({ country, rules }, null, 2) }] };
        }
        const us = getHOSRuleSummary("US");
        const ca = getHOSRuleSummary("CA");
        const mx = getHOSRuleSummary("MX");
        return { content: [{ type: "text" as const, text: JSON.stringify({ comparison: { US: us, CA: ca, MX: mx } }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `HOS rules error: ${e.message}` }] };
      }
    }
  );

  // TOOL: cross_border_currency — convert currencies
  mcp.tool(
    "cross_border_currency",
    "Convert between USD, CAD, and MXN. Uses live exchange rates with fallback to cached rates.",
    {
      amount: z.number().describe("Amount to convert"),
      from: z.enum(["USD", "CAD", "MXN"]).describe("Source currency"),
      to: z.enum(["USD", "CAD", "MXN"]).describe("Target currency"),
    },
    async ({ amount, from, to }) => {
      try {
        const { convertCurrency, formatCurrency } = await import("./currencyEngine");
        const converted = await convertCurrency(amount, from as any, to as any);
        return { content: [{ type: "text" as const, text: JSON.stringify({ original: { amount, currency: from }, converted: { amount: converted, currency: to, formatted: formatCurrency(converted, to as any) } }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Currency error: ${e.message}` }] };
      }
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 8 — P0 SAFETY & COMPLIANCE TOOLS
  // ══════════════════════════════════════════════════════════════════════════

  // TOOL: hos_audit_logs — immutable HOS audit trail per 49 CFR 395.8
  mcp.tool(
    "hos_audit_logs",
    "Query the immutable HOS audit log for a driver. Shows every status change, violation, break, and reset event with timestamps, location, odometer, and engine hours. Required for 49 CFR 395.8 recordkeeping.",
    {
      userId: z.number().describe("Driver user ID"),
      eventType: z.string().optional().describe("Filter by event type: status_change, violation, break_start, break_end, reset, cycle_restart, edit, annotation"),
      limit: z.number().optional().default(50).describe("Max results (default 50)"),
    },
    async ({ userId, eventType, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [eq(hosLogs.userId, userId)];
        if (eventType) conditions.push(eq(hosLogs.eventType, eventType as any));
        const logs = await db.select().from(hosLogs)
          .where(and(...conditions))
          .orderBy(desc(hosLogs.createdAt))
          .limit(limit || 50);
        const [state] = await db.select().from(hosState).where(eq(hosState.userId, userId)).limit(1);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              userId,
              currentState: state || null,
              logCount: logs.length,
              logs,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `HOS audit error: ${e.message}` }] };
      }
    }
  );

  // TOOL: fsma_compliance — FSMA food safety temperature logs & excursions
  mcp.tool(
    "fsma_compliance",
    "Query FSMA (Food Safety Modernization Act) temperature logs for refrigerated/food-grade loads. Shows temperature readings, excursion events, set points, and compliance status per 21 CFR 1.908.",
    {
      loadId: z.number().optional().describe("Filter by load ID"),
      excursionsOnly: z.boolean().optional().describe("Show only temperature excursion events"),
      limit: z.number().optional().default(50).describe("Max results (default 50)"),
    },
    async ({ loadId, excursionsOnly, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [];
        if (loadId) conditions.push(eq(fsmaTempLogs.loadId, loadId));
        if (excursionsOnly) conditions.push(eq(fsmaTempLogs.isExcursion, true));
        const logs = await db.select().from(fsmaTempLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(fsmaTempLogs.createdAt))
          .limit(limit || 50);
        const [stats] = await db.select({
          totalReadings: sql<number>`COUNT(*)`,
          excursions: sql<number>`SUM(CASE WHEN isExcursion = 1 THEN 1 ELSE 0 END)`,
          avgTemp: sql<number>`COALESCE(AVG(CAST(temperature AS DECIMAL)), 0)`,
          minTemp: sql<number>`COALESCE(MIN(CAST(temperature AS DECIMAL)), 0)`,
          maxTemp: sql<number>`COALESCE(MAX(CAST(temperature AS DECIMAL)), 0)`,
        }).from(fsmaTempLogs)
          .where(loadId ? eq(fsmaTempLogs.loadId, loadId) : undefined);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              summary: {
                totalReadings: stats?.totalReadings || 0,
                excursions: stats?.excursions || 0,
                avgTemp: Math.round((stats?.avgTemp || 0) * 10) / 10,
                minTemp: stats?.minTemp || 0,
                maxTemp: stats?.maxTemp || 0,
              },
              returned: logs.length,
              logs,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `FSMA error: ${e.message}` }] };
      }
    }
  );

  // TOOL: bridge_clearance — bridge clearance checks for oversized loads
  mcp.tool(
    "bridge_clearance",
    "Query bridge clearance validation results for loads. Shows bridge height checks, warnings, blocks, and overrides per 23 CFR 650. Critical for oversize/overheight loads.",
    {
      loadId: z.number().optional().describe("Filter by load ID"),
      status: z.string().optional().describe("Filter by status: clear, warning, blocked, override"),
      limit: z.number().optional().default(30).describe("Max results (default 30)"),
    },
    async ({ loadId, status, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [];
        if (loadId) conditions.push(eq(bridgeClearanceChecks.loadId, loadId));
        if (status) conditions.push(eq(bridgeClearanceChecks.status, status as any));
        const checks = await db.select().from(bridgeClearanceChecks)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(bridgeClearanceChecks.checkedAt))
          .limit(limit || 30);
        const [stats] = await db.select({
          total: sql<number>`COUNT(*)`,
          clear: sql<number>`SUM(CASE WHEN status = 'clear' THEN 1 ELSE 0 END)`,
          warnings: sql<number>`SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END)`,
          blocked: sql<number>`SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END)`,
          overrides: sql<number>`SUM(CASE WHEN status = 'override' THEN 1 ELSE 0 END)`,
        }).from(bridgeClearanceChecks)
          .where(loadId ? eq(bridgeClearanceChecks.loadId, loadId) : undefined);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              summary: stats,
              returned: checks.length,
              checks,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Bridge clearance error: ${e.message}` }] };
      }
    }
  );

  // TOOL: mfa_status — 2FA/MFA enrollment status
  mcp.tool(
    "mfa_status",
    "Query MFA (Multi-Factor Authentication) enrollment status across the platform. Shows which users have TOTP/SMS/email MFA enabled, method types, and last usage.",
    {
      userId: z.number().optional().describe("Check MFA status for a specific user ID"),
      enabledOnly: z.boolean().optional().describe("Only show users with MFA enabled"),
      limit: z.number().optional().default(25).describe("Max results (default 25)"),
    },
    async ({ userId, enabledOnly, limit }) => {
      const db = await getDb();
      if (!db) return { content: [{ type: "text" as const, text: "Database unavailable" }] };
      try {
        const conditions: any[] = [];
        if (userId) conditions.push(eq(mfaTokens.userId, userId));
        if (enabledOnly) conditions.push(eq(mfaTokens.isEnabled, true));
        const tokens = await db.select({
          id: mfaTokens.id,
          userId: mfaTokens.userId,
          method: mfaTokens.method,
          isEnabled: mfaTokens.isEnabled,
          lastUsedAt: mfaTokens.lastUsedAt,
          createdAt: mfaTokens.createdAt,
        }).from(mfaTokens)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(mfaTokens.createdAt))
          .limit(limit || 25);
        const [stats] = await db.select({
          totalEnrolled: sql<number>`COUNT(*)`,
          enabled: sql<number>`SUM(CASE WHEN isEnabled = 1 THEN 1 ELSE 0 END)`,
          totp: sql<number>`SUM(CASE WHEN method = 'totp' THEN 1 ELSE 0 END)`,
          sms: sql<number>`SUM(CASE WHEN method = 'sms' THEN 1 ELSE 0 END)`,
          email: sql<number>`SUM(CASE WHEN method = 'email' THEN 1 ELSE 0 END)`,
        }).from(mfaTokens);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              platformMFA: {
                totalEnrolled: stats?.totalEnrolled || 0,
                enabled: stats?.enabled || 0,
                byMethod: { totp: stats?.totp || 0, sms: stats?.sms || 0, email: stats?.email || 0 },
              },
              returned: tokens.length,
              tokens,
            }, null, 2),
          }],
        };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `MFA status error: ${e.message}` }] };
      }
    }
  );

  return mcp;
}

// ════════════════════════════════════════════════════════════════════════════
// MOUNT ON EXPRESS
// ════════════════════════════════════════════════════════════════════════════

export function mountMcpServer(app: Express): void {
  /** Stateless: create a fresh McpServer + transport per request */
  async function handleMcpRequest(req: Request, res: Response, body?: unknown) {
    const server = createEusoTripMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => { transport.close().catch(() => {}); server.close().catch(() => {}); });
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  }

  app.post("/api/mcp", async (req: Request, res: Response) => {
    try {
      await handleMcpRequest(req, res, req.body);
    } catch (e: any) {
      logger.error("[MCP] POST error:", e?.message);
      if (!res.headersSent) res.status(500).json({ error: "MCP server error" });
    }
  });

  app.get("/api/mcp", (_req: Request, res: Response) => {
    res.status(200).json({
      jsonrpc: "2.0",
      result: {
        server: "EusoTrip Platform",
        version: "5.0.0",
        status: "ok",
        tools: 74,
        transport: "streamable-http",
        endpoint: "POST /api/mcp",
      },
    });
  });

  app.delete("/api/mcp", (_req: Request, res: Response) => {
    res.status(405).json({ error: "Session termination not supported in stateless mode" });
  });

  logger.info("[MCP] EusoTrip MCP server mounted at /api/mcp");
}
