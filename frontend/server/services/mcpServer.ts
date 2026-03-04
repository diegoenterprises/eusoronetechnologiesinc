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
import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import {
  loads, users, companies, detentionClaims, platformFeeConfigs,
  loadBids, wallets, hzCarrierSafety,
} from "../../drizzle/schema";
import { eq, and, desc, like, sql, count, gte, lte, or, inArray } from "drizzle-orm";

const MCP_API_KEY = process.env.MCP_API_KEY || "";

// ════════════════════════════════════════════════════════════════════════════
// MCP SERVER INSTANCE
// ════════════════════════════════════════════════════════════════════════════

function createEusoTripMcpServer(): McpServer {
  const mcp = new McpServer(
    { name: "EusoTrip Platform", version: "1.0.0" },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
      instructions: `You are connected to the EusoTrip logistics platform — a full-stack freight management system. 
Use these tools to query loads, users, companies, FMCSA carrier safety data, platform fees, analytics, and more.
All monetary values are in USD. Dates are ISO 8601. User roles include: DRIVER, CATALYST (carrier/broker), SHIPPER, DISPATCHER, TERMINAL_MANAGER, ADMIN, SUPER_ADMIN.`,
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
- Accessorial management: detention, lumper, TONU claims`,
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
1. Call platform_analytics to get overall metrics
2. Call get_platform_fees to understand current fee structure
3. Call search_loads with relevant filters to analyze load volume
4. Call accessorial_stats for claims data
5. Call list_users to understand user base

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
  // Auth middleware — require Bearer token matching MCP_API_KEY
  const authMiddleware = (req: Request, res: Response, next: () => void) => {
    if (!MCP_API_KEY) {
      return next(); // No key configured — allow all (dev mode)
    }
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token !== MCP_API_KEY) {
      res.status(401).json({ error: "Invalid or missing MCP API key" });
      return;
    }
    next();
  };

  /** Stateless: create a fresh McpServer + transport per request */
  async function handleMcpRequest(req: Request, res: Response, body?: unknown) {
    const server = createEusoTripMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => { transport.close().catch(() => {}); server.close().catch(() => {}); });
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  }

  app.post("/api/mcp", authMiddleware, async (req: Request, res: Response) => {
    try {
      await handleMcpRequest(req, res, req.body);
    } catch (e: any) {
      console.error("[MCP] POST error:", e?.message);
      if (!res.headersSent) res.status(500).json({ error: "MCP server error" });
    }
  });

  app.get("/api/mcp", authMiddleware, async (req: Request, res: Response) => {
    try {
      await handleMcpRequest(req, res);
    } catch (e: any) {
      console.error("[MCP] GET error:", e?.message);
      if (!res.headersSent) res.status(500).json({ error: "MCP server error" });
    }
  });

  app.delete("/api/mcp", authMiddleware, (_req: Request, res: Response) => {
    res.status(405).json({ error: "Session termination not supported in stateless mode" });
  });

  console.log("[MCP] EusoTrip MCP server mounted at /api/mcp");
}
