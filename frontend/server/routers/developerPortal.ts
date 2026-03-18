/**
 * DEVELOPER PORTAL ROUTER (Phase 4 — Task 2.1.1 + 2.1.2)
 * MCP Write Tools, API Key Management, Usage Analytics, Webhook Config
 * 
 * API keys and webhooks are persisted to MySQL via Drizzle ORM.
 * Keys are stored as SHA-256 hashes; the raw key is only shown once on creation.
 */
import { z } from "zod";
import { randomBytes, createHash } from "crypto";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { developerApiKeys, developerWebhooks } from "../../drizzle/schema";
import { logger } from "../_core/logger";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

const mcpWriteToolsRouter = router({
  getTools: protectedProcedure.query(() => ([
    { name: "loads.create", description: "Create a new load", method: "POST", category: "loads", rateLimit: 100, requiresScope: "loads:write" },
    { name: "loads.update", description: "Update load status/details", method: "PATCH", category: "loads", rateLimit: 200, requiresScope: "loads:write" },
    { name: "loads.cancel", description: "Cancel a posted load", method: "POST", category: "loads", rateLimit: 50, requiresScope: "loads:write" },
    { name: "bids.submit", description: "Submit a bid on a load", method: "POST", category: "bids", rateLimit: 100, requiresScope: "bids:write" },
    { name: "bids.withdraw", description: "Withdraw a pending bid", method: "POST", category: "bids", rateLimit: 100, requiresScope: "bids:write" },
    { name: "documents.upload", description: "Upload BOL, POD, or other docs", method: "POST", category: "documents", rateLimit: 50, requiresScope: "documents:write" },
    { name: "tracking.update", description: "Push GPS/status update", method: "POST", category: "tracking", rateLimit: 1000, requiresScope: "tracking:write" },
    { name: "notifications.send", description: "Send notification to user", method: "POST", category: "notifications", rateLimit: 200, requiresScope: "notifications:write" },
    { name: "compliance.submit", description: "Submit compliance document", method: "POST", category: "compliance", rateLimit: 50, requiresScope: "compliance:write" },
    { name: "wallet.transfer", description: "Initiate wallet transfer", method: "POST", category: "wallet", rateLimit: 20, requiresScope: "wallet:write" },
  ])),
  getScopes: protectedProcedure.query(() => ([
    { scope: "loads:read", description: "Read load data" },
    { scope: "loads:write", description: "Create/update/cancel loads" },
    { scope: "bids:read", description: "Read bid data" },
    { scope: "bids:write", description: "Submit/withdraw bids" },
    { scope: "documents:read", description: "Read documents" },
    { scope: "documents:write", description: "Upload documents" },
    { scope: "tracking:read", description: "Read tracking data" },
    { scope: "tracking:write", description: "Push tracking updates" },
    { scope: "notifications:write", description: "Send notifications" },
    { scope: "compliance:read", description: "Read compliance data" },
    { scope: "compliance:write", description: "Submit compliance docs" },
    { scope: "wallet:read", description: "Read wallet balance/history" },
    { scope: "wallet:write", description: "Initiate transfers" },
    { scope: "analytics:read", description: "Read analytics data" },
  ])),
});

const apiKeyRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = ctx.user?.id || 0;
    const rows = await db.select().from(developerApiKeys).where(eq(developerApiKeys.userId, userId));
    return rows.map(k => ({
      id: k.visibleId,
      name: k.name,
      key: k.keyPrefix + "..." + k.keySuffix,
      scopes: k.scopes,
      status: k.status,
      createdAt: k.createdAt?.toISOString() || "",
      expiresAt: k.expiresAt?.toISOString() || null,
      lastUsed: k.lastUsedAt?.toISOString() || null,
      requestCount: k.requestCount,
    }));
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string(), scopes: z.array(z.string()), expiresInDays: z.number().default(365) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };
      const userId = ctx.user?.id || 0;
      const rawKey = `euso_${randomBytes(24).toString('hex')}`;
      const visibleId = `AK-${Date.now()}`;
      const expiresAt = new Date(Date.now() + input.expiresInDays * 86400000);
      await db.insert(developerApiKeys).values({
        visibleId,
        userId,
        name: input.name,
        keyHash: hashKey(rawKey),
        keyPrefix: rawKey.slice(0, 12),
        keySuffix: rawKey.slice(-4),
        scopes: input.scopes,
        status: "active",
        expiresAt,
      });
      logger.info(`[DevPortal] API key created: ${visibleId} for user ${userId}`);
      return { success: true, apiKey: rawKey, id: visibleId, expiresAt: expiresAt.toISOString(), warning: "Store this key securely — it will not be shown again." };
    }),
  revoke: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };
      const userId = ctx.user?.id || 0;
      const result = await db.update(developerApiKeys)
        .set({ status: "revoked" })
        .where(and(eq(developerApiKeys.visibleId, input.keyId), eq(developerApiKeys.userId, userId)));
      return { success: true };
    }),
  getUsage: protectedProcedure
    .input(z.object({ keyId: z.string(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      const trend = [];
      for (let i = input.days; i >= 0; i--) {
        trend.push({ date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10), requests: 0, errors: 0, latencyP50: 0, latencyP99: 0 });
      }
      return { keyId: input.keyId, trend, totalRequests: trend.reduce((s, t) => s + t.requests, 0), totalErrors: trend.reduce((s, t) => s + t.errors, 0) };
    }),
});

const webhookRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = ctx.user?.id || 0;
    const rows = await db.select().from(developerWebhooks).where(eq(developerWebhooks.userId, userId));
    return rows.map(w => ({
      id: w.visibleId,
      url: w.url,
      events: w.events,
      secret: w.secretHash ? "***" : null,
      status: w.status,
      deliveryRate: w.deliveryRate,
      lastDelivery: w.lastDeliveryAt?.toISOString() || null,
      createdAt: w.createdAt?.toISOString() || "",
    }));
  }),
  create: protectedProcedure
    .input(z.object({ url: z.string().url(), events: z.array(z.string()), secret: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };
      const userId = ctx.user?.id || 0;
      const visibleId = `WH-${Date.now()}`;
      await db.insert(developerWebhooks).values({
        visibleId,
        userId,
        url: input.url,
        events: input.events,
        secretHash: input.secret ? hashKey(input.secret) : null,
        status: "active",
      });
      logger.info(`[DevPortal] Webhook created: ${visibleId} for user ${userId}`);
      return { success: true, id: visibleId, url: input.url, events: input.events, secret: input.secret ? "***" : null, status: "active", deliveryRate: 100, lastDelivery: null, createdAt: new Date().toISOString() };
    }),
  delete: protectedProcedure.input(z.object({ webhookId: z.string() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const userId = ctx.user?.id || 0;
    await db.delete(developerWebhooks).where(and(eq(developerWebhooks.visibleId, input.webhookId), eq(developerWebhooks.userId, userId)));
    return { success: true };
  }),
  getEvents: protectedProcedure.query(() => ([
    { event: "load.created", description: "New load posted" },
    { event: "load.status_changed", description: "Load status updated" },
    { event: "bid.submitted", description: "New bid received" },
    { event: "bid.accepted", description: "Bid accepted" },
    { event: "document.uploaded", description: "Document uploaded" },
    { event: "payment.completed", description: "Payment processed" },
    { event: "compliance.expiring", description: "Compliance item expiring soon" },
    { event: "tracking.update", description: "GPS position update" },
  ])),
});

const sdkRouter = router({
  getInfo: protectedProcedure.query(() => ({
    sdks: [
      { language: "JavaScript/TypeScript", package: "@eusotrip/sdk", version: "1.0.0", installCmd: "npm install @eusotrip/sdk", docs: "/docs/sdk/js" },
      { language: "Python", package: "eusotrip-sdk", version: "1.0.0", installCmd: "pip install eusotrip-sdk", docs: "/docs/sdk/python" },
      { language: "cURL", package: null, version: null, installCmd: null, docs: "/docs/api/rest" },
    ],
    apiBase: "https://api.eusotrip.com/v1",
    rateLimits: { standard: "1000 req/min", premium: "5000 req/min", enterprise: "unlimited" },
    authentication: "Bearer token via API key in Authorization header",
  })),
});

export const developerPortalRouter = router({
  mcpTools: mcpWriteToolsRouter,
  apiKeys: apiKeyRouter,
  webhooks: webhookRouter,
  sdk: sdkRouter,
});
