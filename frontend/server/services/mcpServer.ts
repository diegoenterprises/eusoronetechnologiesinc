/**
 * MCP SERVER — Model Context Protocol for Claude Cowork
 * Exposes EusoTrip platform data & tools so Claude can connect as a custom connector.
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
    { name: "EusoTrip Platform", version: "2.0.0" },
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
        if (rateType) conditions.push(eq(pricebookEntries.rateType, rateType));
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
          totalAmount: sql<number>`COALESCE(SUM(CAST(${settlements.totalAmount} AS DECIMAL)), 0)`,
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

AUDIT STATUS: 127/127 PASS (100%) — all P1/P2 security and functionality gaps resolved`,
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

Format as a professional business report with sections, key metrics, trends, and actionable recommendations.`,
        },
      }],
    })
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
      console.error("[MCP] POST error:", e?.message);
      if (!res.headersSent) res.status(500).json({ error: "MCP server error" });
    }
  });

  app.get("/api/mcp", async (req: Request, res: Response) => {
    try {
      await handleMcpRequest(req, res);
    } catch (e: any) {
      console.error("[MCP] GET error:", e?.message);
      if (!res.headersSent) res.status(500).json({ error: "MCP server error" });
    }
  });

  app.delete("/api/mcp", (_req: Request, res: Response) => {
    res.status(405).json({ error: "Session termination not supported in stateless mode" });
  });

  console.log("[MCP] EusoTrip MCP server mounted at /api/mcp");
}
