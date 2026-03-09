/**
 * CUSTOMER PORTAL ROUTER — WS-DC-007
 * Read-only customer portal with token-based authentication
 *
 * Procedures:
 *   createPortalAccess   — generate portal token for customer
 *   listPortalAccess     — list all tokens for company
 *   revokeAccess         — deactivate token
 *   linkLoads            — link loads to token
 *   autoLinkByAllocation — link loads from allocation contract
 *   portalGetLoads       — public: get loads for token
 *   portalGetLoadDetail  — public: get load detail + timeline
 *   portalGetMap         — public: get GPS positions (2-min delay)
 *   validatePortalToken  — internal token validation
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireAccess } from "../services/security/rbac/access-check";
import { portalAccessTokens, portalLoadLinks, portalAuditLog, loads } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64-char hex
}

async function validateToken(db: any, accessToken: string) {
  const [token] = await db.select().from(portalAccessTokens)
    .where(and(
      eq(portalAccessTokens.accessToken, accessToken),
      eq(portalAccessTokens.isActive, 1),
      sql`${portalAccessTokens.expiresAt} > NOW()`
    ))
    .limit(1);

  if (!token) return null;

  // Update lastAccessAt
  await db.update(portalAccessTokens)
    .set({ lastAccessAt: new Date() })
    .where(eq(portalAccessTokens.id, token.id));

  // Log access
  await (db as any).execute(
    sql`INSERT INTO portal_audit_log (portalTokenId, action) VALUES (${token.id}, 'portal_access')`
  );

  return token;
}

export const customerPortalRouter = router({

  /**
   * createPortalAccess — Generate portal token for customer
   */
  createPortalAccess: protectedProcedure
    .input(z.object({
      customerName: z.string().min(1),
      customerEmail: z.string().email().optional(),
      permissions: z.record(z.string(), z.string()).optional(),
      expiresInDays: z.number().min(1).max(730).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "ADMIN", companyId: (ctx.user as any)?.companyId, action: "CREATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      const userId = Number((ctx.user as any)?.id) || 0;

      const accessToken = generateToken();
      const expiresInDays = input.expiresInDays || 365;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const permissions = input.permissions || { loads: "read", map: "read", timeline: "read" };

      await (db as any).execute(
        sql`INSERT INTO portal_access_tokens (companyId, issuedBy, customerName, customerEmail, accessToken, permissions, expiresAt) VALUES (${companyId}, ${userId}, ${input.customerName}, ${input.customerEmail || null}, ${accessToken}, ${JSON.stringify(permissions)}, ${expiresAt.toISOString().slice(0, 19).replace("T", " ")})`
      );

      const [token] = await db.select().from(portalAccessTokens)
        .where(eq(portalAccessTokens.accessToken, accessToken))
        .limit(1);

      return {
        tokenId: token?.id,
        accessToken,
        customerName: input.customerName,
        expiresAt: expiresAt.toISOString(),
        portalUrl: `/portal?token=${accessToken}`,
      };
    }),

  /**
   * listPortalAccess — List all tokens for company
   */
  listPortalAccess: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const tokens = await db.select().from(portalAccessTokens)
        .where(eq(portalAccessTokens.companyId, companyId))
        .orderBy(sql`${portalAccessTokens.createdAt} DESC`);

      // Get load counts per token
      const result = [];
      for (const t of tokens) {
        const [countRow]: any = await (db as any).execute(
          sql`SELECT COUNT(*) as cnt FROM portal_load_links WHERE portalTokenId = ${t.id}`
        );
        const loadCount = Array.isArray(countRow) ? Number(countRow[0]?.cnt || 0) : 0;
        result.push({
          tokenId: t.id,
          customerName: t.customerName,
          customerEmail: t.customerEmail,
          isActive: !!t.isActive,
          expiresAt: t.expiresAt,
          lastAccessAt: t.lastAccessAt,
          loadCount,
          createdAt: t.createdAt,
        });
      }

      return { tokens: result };
    }),

  /**
   * revokeAccess — Deactivate token
   */
  revokeAccess: protectedProcedure
    .input(z.object({ tokenId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "ADMIN", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      await db.update(portalAccessTokens)
        .set({ isActive: 0 })
        .where(and(eq(portalAccessTokens.id, input.tokenId), eq(portalAccessTokens.companyId, companyId)));

      return { tokenId: input.tokenId, isActive: false };
    }),

  /**
   * linkLoads — Bulk link loads to token
   */
  linkLoads: protectedProcedure
    .input(z.object({
      tokenId: z.number(),
      loadIds: z.array(z.number()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "ADMIN", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      // Verify token belongs to company
      const [token] = await db.select().from(portalAccessTokens)
        .where(and(eq(portalAccessTokens.id, input.tokenId), eq(portalAccessTokens.companyId, companyId)))
        .limit(1);
      if (!token) throw new Error("Token not found");

      let linked = 0;
      const failures: string[] = [];

      for (const loadId of input.loadIds) {
        try {
          await (db as any).execute(
            sql`INSERT IGNORE INTO portal_load_links (portalTokenId, loadId) VALUES (${input.tokenId}, ${loadId})`
          );
          linked++;
        } catch (err: any) {
          failures.push(`Load ${loadId}: ${err.message}`);
        }
      }

      return { linkedCount: linked, failures };
    }),

  /**
   * autoLinkByAllocation — Link all loads from allocation contract
   */
  autoLinkByAllocation: protectedProcedure
    .input(z.object({
      tokenId: z.number(),
      allocationContractId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "ADMIN", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      // Find loads linked to this allocation contract via daily tracking
      const [trackingRows]: any = await (db as any).execute(
        sql`SELECT DISTINCT loadId FROM allocation_daily_tracking WHERE contractId = ${input.allocationContractId} AND loadId IS NOT NULL`
      );
      const loadIds = Array.isArray(trackingRows) ? trackingRows.map((r: any) => r.loadId).filter(Boolean) : [];

      let linked = 0;
      for (const loadId of loadIds) {
        try {
          await (db as any).execute(
            sql`INSERT IGNORE INTO portal_load_links (portalTokenId, loadId) VALUES (${input.tokenId}, ${loadId})`
          );
          linked++;
        } catch { /* duplicate */ }
      }

      return { linkedCount: linked };
    }),

  /**
   * portalGetLoads — Public: get loads for token
   */
  portalGetLoads: publicProcedure
    .input(z.object({ accessToken: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const token = await validateToken(db, input.accessToken);
      if (!token) throw new Error("Invalid or expired portal token");

      // Log action
      await (db as any).execute(
        sql`INSERT INTO portal_audit_log (portalTokenId, action, resourceType) VALUES (${token.id}, 'get_loads', 'load')`
      );

      const [rows]: any = await (db as any).execute(
        sql`SELECT l.id, l.loadNumber, l.pickupLocation, l.deliveryLocation, l.pickupDate, l.deliveryDate, l.cargoType, l.status, l.specialInstructions FROM loads l INNER JOIN portal_load_links pll ON pll.loadId = l.id WHERE pll.portalTokenId = ${token.id} ORDER BY l.pickupDate DESC`
      );

      const loadList = Array.isArray(rows) ? rows.map((r: any) => ({
        loadId: r.id,
        loadNumber: r.loadNumber,
        pickupLocation: r.pickupLocation,
        deliveryLocation: r.deliveryLocation,
        pickupDate: r.pickupDate,
        deliveryDate: r.deliveryDate,
        cargoType: r.cargoType,
        status: r.status,
        lastUpdate: null,
      })) : [];

      return { loads: loadList, customerName: token.customerName };
    }),

  /**
   * portalGetLoadDetail — Public: get load detail + timeline
   */
  portalGetLoadDetail: publicProcedure
    .input(z.object({ accessToken: z.string().min(1), loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const token = await validateToken(db, input.accessToken);
      if (!token) throw new Error("Invalid or expired portal token");

      // Verify load is linked to this token
      const [link] = await db.select().from(portalLoadLinks)
        .where(and(eq(portalLoadLinks.portalTokenId, token.id), eq(portalLoadLinks.loadId, input.loadId)))
        .limit(1);
      if (!link) throw new Error("Load not accessible");

      await (db as any).execute(
        sql`INSERT INTO portal_audit_log (portalTokenId, action, resourceType, resourceId) VALUES (${token.id}, 'get_load_detail', 'load', ${input.loadId})`
      );

      const [loadRows]: any = await (db as any).execute(
        sql`SELECT l.id, l.loadNumber, l.pickupLocation, l.deliveryLocation, l.pickupDate, l.deliveryDate, l.cargoType, l.status, l.specialInstructions, l.weight, l.distance FROM loads l WHERE l.id = ${input.loadId} LIMIT 1`
      );
      const load = Array.isArray(loadRows) ? loadRows[0] : null;
      if (!load) throw new Error("Load not found");

      // Get timeline events from load_events if available
      let timeline: any[] = [];
      try {
        const [events]: any = await (db as any).execute(
          sql`SELECT eventType as event, status, location, timestamp FROM load_events WHERE loadId = ${input.loadId} ORDER BY timestamp ASC`
        );
        if (Array.isArray(events)) timeline = events;
      } catch { /* table may not exist */ }

      // No financial data exposed
      return {
        loadId: load.id,
        loadNumber: load.loadNumber,
        pickupLocation: load.pickupLocation,
        deliveryLocation: load.deliveryLocation,
        pickupDate: load.pickupDate,
        deliveryDate: load.deliveryDate,
        cargoType: load.cargoType,
        currentStatus: load.status,
        weight: load.weight,
        distance: load.distance,
        specialInstructions: load.specialInstructions,
        timeline,
      };
    }),

  /**
   * portalGetMap — Public: get GPS positions (2-min delayed)
   */
  portalGetMap: publicProcedure
    .input(z.object({ accessToken: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const token = await validateToken(db, input.accessToken);
      if (!token) throw new Error("Invalid or expired portal token");

      await (db as any).execute(
        sql`INSERT INTO portal_audit_log (portalTokenId, action, resourceType) VALUES (${token.id}, 'get_map', 'gps')`
      );

      // GPS data delayed 2 minutes for operational security
      let positions: any[] = [];
      try {
        const [rows]: any = await (db as any).execute(
          sql`SELECT g.loadId, g.latitude, g.longitude, g.heading, g.speed, g.timestamp as lastUpdate, l.status FROM gps_tracking g INNER JOIN portal_load_links pll ON pll.loadId = g.loadId INNER JOIN loads l ON l.id = g.loadId WHERE pll.portalTokenId = ${token.id} AND g.timestamp <= DATE_SUB(NOW(), INTERVAL 2 MINUTE) AND g.id IN (SELECT MAX(g2.id) FROM gps_tracking g2 WHERE g2.timestamp <= DATE_SUB(NOW(), INTERVAL 2 MINUTE) GROUP BY g2.loadId)`
        );
        if (Array.isArray(rows)) positions = rows;
      } catch { /* gps_tracking may not have data */ }

      return { positions };
    }),

  /**
   * validatePortalToken — Internal token validation
   */
  validatePortalToken: publicProcedure
    .input(z.object({ accessToken: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false, error: "Database unavailable" };

      const token = await validateToken(db, input.accessToken);
      if (!token) return { valid: false, error: "Invalid or expired token" };

      return {
        valid: true,
        tokenId: token.id,
        customerName: token.customerName,
        permissions: token.permissions || { loads: "read", map: "read", timeline: "read" },
      };
    }),
});
