/**
 * SUPPLY CHAIN ROUTER
 * tRPC procedures for terminal-shipper-marketer supply chain management
 * 
 * Models the oil trucking supply chain:
 *   Terminal (rack/refinery) -> Shipper/Marketer -> Catalyst/Broker -> Driver
 * 
 * A shipper is the entity tendering product for transport.
 * A marketer (oil jobber) is an intermediary who buys/sells fuel.
 * A shipper becomes a marketer when they directly sell or direct product.
 * The marketer classification is infused into the shipper role via supplyChainRole.
 * 
 * PRODUCTION-READY: All data from database, no mock data
 */

import { z } from "zod";
import {
  router,
  auditedTerminalProcedure,
  auditedProtectedProcedure,
  isolatedRoleProcedure,
  ROLES,
} from "../_core/trpc";

// Terminal Manager + Admin can manage partners
const terminalMgmtProcedure = isolatedRoleProcedure(ROLES.TERMINAL_MANAGER);
// Shippers, Brokers, Catalysts, Terminal Managers can view supply chain data
const supplyChainReadProcedure = isolatedRoleProcedure(
  ROLES.TERMINAL_MANAGER, ROLES.SHIPPER, ROLES.BROKER, ROLES.CATALYST, ROLES.DISPATCH
);
import { getDb } from "../db";
import {
  terminals,
  terminalPartners,
  companies,
  users,
  loads,
} from "../../drizzle/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

const partnerTypeSchema = z.enum(["shipper", "marketer", "broker", "transporter"]);
const partnerStatusSchema = z.enum(["active", "pending", "suspended", "terminated"]);
const rackAccessSchema = z.enum(["full", "limited", "scheduled"]);
const supplyChainRoleSchema = z.enum([
  "PRODUCER", "REFINER", "MARKETER", "WHOLESALER", "RETAILER", "TERMINAL_OPERATOR", "TRANSPORTER"
]);
const marketerTypeSchema = z.enum(["branded", "independent", "used_oil"]);

export const supplyChainRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // TERMINAL PARTNER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * List all partners for a terminal (Terminal Manager view)
   */
  getTerminalPartners: auditedTerminalProcedure
    .input(z.object({
      terminalId: z.number().optional(),
      partnerType: partnerTypeSchema.optional(),
      status: partnerStatusSchema.optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const companyId = ctx.user?.companyId || 0;

        // Get terminal(s) for this company
        const companyTerminals = await db
          .select({ id: terminals.id })
          .from(terminals)
          .where(eq(terminals.companyId, companyId));

        if (companyTerminals.length === 0) return [];

        const terminalIds = input?.terminalId
          ? [input.terminalId]
          : companyTerminals.map(t => t.id);

        // Get partners with company info
        const partners = await db
          .select({
            id: terminalPartners.id,
            terminalId: terminalPartners.terminalId,
            companyId: terminalPartners.companyId,
            partnerType: terminalPartners.partnerType,
            status: terminalPartners.status,
            rackAccessLevel: terminalPartners.rackAccessLevel,
            monthlyVolumeCommitment: terminalPartners.monthlyVolumeCommitment,
            productTypes: terminalPartners.productTypes,
            notes: terminalPartners.notes,
            startDate: terminalPartners.startDate,
            endDate: terminalPartners.endDate,
            companyName: companies.name,
            companyDot: companies.dotNumber,
            companyMc: companies.mcNumber,
            companyCity: companies.city,
            companyState: companies.state,
            supplyChainRole: companies.supplyChainRole,
            marketerType: companies.marketerType,
            terminalName: terminals.name,
            terminalCode: terminals.code,
          })
          .from(terminalPartners)
          .leftJoin(companies, eq(terminalPartners.companyId, companies.id))
          .leftJoin(terminals, eq(terminalPartners.terminalId, terminals.id))
          .where(
            and(
              inArray(terminalPartners.terminalId, terminalIds),
              input?.partnerType ? eq(terminalPartners.partnerType, input.partnerType) : undefined,
              input?.status ? eq(terminalPartners.status, input.status) : undefined,
            )
          )
          .orderBy(desc(terminalPartners.createdAt));

        return partners.map(p => ({
          ...p,
          monthlyVolumeCommitment: p.monthlyVolumeCommitment ? Number(p.monthlyVolumeCommitment) : null,
          startDate: p.startDate?.toISOString() || null,
          endDate: p.endDate?.toISOString() || null,
          isMarketer: p.supplyChainRole === "MARKETER" || p.partnerType === "marketer",
        }));
      } catch (error) {
        console.error("[SupplyChain] getTerminalPartners error:", error);
        return [];
      }
    }),

  /**
   * Get partner stats for terminal dashboard
   */
  getPartnerStats: auditedTerminalProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, active: 0, shippers: 0, marketers: 0, brokers: 0, transporters: 0, pendingVolume: 0 };

    try {
      const companyId = ctx.user?.companyId || 0;
      const companyTerminals = await db
        .select({ id: terminals.id })
        .from(terminals)
        .where(eq(terminals.companyId, companyId));

      if (companyTerminals.length === 0) {
        return { total: 0, active: 0, shippers: 0, marketers: 0, brokers: 0, transporters: 0, pendingVolume: 0 };
      }

      const terminalIds = companyTerminals.map(t => t.id);

      const [total] = await db
        .select({ count: sql<number>`count(*)` })
        .from(terminalPartners)
        .where(inArray(terminalPartners.terminalId, terminalIds));

      const [active] = await db
        .select({ count: sql<number>`count(*)` })
        .from(terminalPartners)
        .where(and(inArray(terminalPartners.terminalId, terminalIds), eq(terminalPartners.status, "active")));

      const [shippers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(terminalPartners)
        .where(and(inArray(terminalPartners.terminalId, terminalIds), eq(terminalPartners.partnerType, "shipper")));

      const [marketers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(terminalPartners)
        .where(and(inArray(terminalPartners.terminalId, terminalIds), eq(terminalPartners.partnerType, "marketer")));

      const [brokers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(terminalPartners)
        .where(and(inArray(terminalPartners.terminalId, terminalIds), eq(terminalPartners.partnerType, "broker")));

      const [transporters] = await db
        .select({ count: sql<number>`count(*)` })
        .from(terminalPartners)
        .where(and(inArray(terminalPartners.terminalId, terminalIds), eq(terminalPartners.partnerType, "transporter")));

      return {
        total: total?.count || 0,
        active: active?.count || 0,
        shippers: shippers?.count || 0,
        marketers: marketers?.count || 0,
        brokers: brokers?.count || 0,
        transporters: transporters?.count || 0,
        pendingVolume: 0,
      };
    } catch (error) {
      console.error("[SupplyChain] getPartnerStats error:", error);
      return { total: 0, active: 0, shippers: 0, marketers: 0, brokers: 0, transporters: 0, pendingVolume: 0 };
    }
  }),

  /**
   * Add a partner to a terminal
   */
  addPartner: terminalMgmtProcedure
    .input(z.object({
      terminalId: z.number(),
      companyId: z.number(),
      partnerType: partnerTypeSchema,
      rackAccessLevel: rackAccessSchema.optional(),
      monthlyVolumeCommitment: z.number().optional(),
      productTypes: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [result] = await db.insert(terminalPartners).values({
        terminalId: input.terminalId,
        companyId: input.companyId,
        partnerType: input.partnerType,
        status: "pending",
        rackAccessLevel: input.rackAccessLevel || "scheduled",
        monthlyVolumeCommitment: input.monthlyVolumeCommitment?.toString(),
        productTypes: input.productTypes || [],
        notes: input.notes,
      }).$returningId();

      return { success: true, id: result.id };
    }),

  /**
   * Update a terminal partner
   */
  updatePartner: terminalMgmtProcedure
    .input(z.object({
      id: z.number(),
      status: partnerStatusSchema.optional(),
      rackAccessLevel: rackAccessSchema.optional(),
      monthlyVolumeCommitment: z.number().optional(),
      productTypes: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updates: Record<string, any> = {};
      if (input.status) updates.status = input.status;
      if (input.rackAccessLevel) updates.rackAccessLevel = input.rackAccessLevel;
      if (input.monthlyVolumeCommitment !== undefined) updates.monthlyVolumeCommitment = input.monthlyVolumeCommitment.toString();
      if (input.productTypes) updates.productTypes = input.productTypes;
      if (input.notes !== undefined) updates.notes = input.notes;

      if (Object.keys(updates).length > 0) {
        await db.update(terminalPartners).set(updates).where(eq(terminalPartners.id, input.id));
      }

      return { success: true, id: input.id };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPLY CHAIN CLASSIFICATION (Shipper/Marketer)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get company supply chain classification
   */
  getCompanyClassification: supplyChainReadProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    try {
      const companyId = ctx.user?.companyId || 0;
      if (!companyId) return null;

      const [company] = await db
        .select({
          id: companies.id,
          name: companies.name,
          supplyChainRole: companies.supplyChainRole,
          marketerType: companies.marketerType,
          supplyChainMeta: companies.supplyChainMeta,
        })
        .from(companies)
        .where(eq(companies.id, companyId));

      return company || null;
    } catch (error) {
      console.error("[SupplyChain] getCompanyClassification error:", error);
      return null;
    }
  }),

  /**
   * Update company supply chain classification
   */
  updateCompanyClassification: supplyChainReadProcedure
    .input(z.object({
      supplyChainRole: supplyChainRoleSchema.optional().nullable(),
      marketerType: marketerTypeSchema.optional().nullable(),
      supplyChainMeta: z.object({
        productsHandled: z.array(z.string()).optional(),
        annualVolume: z.number().optional(),
        volumeUnit: z.string().optional(),
        customerTypes: z.array(z.string()).optional(),
        supplySource: z.string().optional(),
        distributionRegions: z.array(z.string()).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const companyId = ctx.user?.companyId || 0;
      if (!companyId) throw new Error("No company associated");

      const updates: Record<string, any> = {};
      if (input.supplyChainRole !== undefined) updates.supplyChainRole = input.supplyChainRole;
      if (input.marketerType !== undefined) updates.marketerType = input.marketerType;
      if (input.supplyChainMeta) updates.supplyChainMeta = input.supplyChainMeta;

      if (Object.keys(updates).length > 0) {
        await db.update(companies).set(updates).where(eq(companies.id, companyId));
      }

      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SHIPPER/MARKETER: MY TERMINALS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get terminals where this company is a partner (Shipper/Marketer view)
   */
  getMyTerminals: supplyChainReadProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const companyId = ctx.user?.companyId || 0;
      if (!companyId) return [];

      const myTerminals = await db
        .select({
          partnerId: terminalPartners.id,
          partnerType: terminalPartners.partnerType,
          status: terminalPartners.status,
          rackAccessLevel: terminalPartners.rackAccessLevel,
          monthlyVolumeCommitment: terminalPartners.monthlyVolumeCommitment,
          productTypes: terminalPartners.productTypes,
          terminalId: terminals.id,
          terminalName: terminals.name,
          terminalCode: terminals.code,
          terminalType: terminals.terminalType,
          terminalCity: terminals.city,
          terminalState: terminals.state,
          productsHandled: terminals.productsHandled,
          throughputCapacity: terminals.throughputCapacity,
          throughputUnit: terminals.throughputUnit,
        })
        .from(terminalPartners)
        .leftJoin(terminals, eq(terminalPartners.terminalId, terminals.id))
        .where(and(
          eq(terminalPartners.companyId, companyId),
          eq(terminalPartners.status, "active"),
        ))
        .orderBy(terminals.name);

      return myTerminals.map(t => ({
        ...t,
        monthlyVolumeCommitment: t.monthlyVolumeCommitment ? Number(t.monthlyVolumeCommitment) : null,
        throughputCapacity: t.throughputCapacity ? Number(t.throughputCapacity) : null,
      }));
    } catch (error) {
      console.error("[SupplyChain] getMyTerminals error:", error);
      return [];
    }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPLY CHAIN FLOW — Load Terminal Linking
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get terminals for load creation dropdown (shipper picks origin/dest terminal)
   */
  getTerminalsForLoadCreation: supplyChainReadProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const companyId = ctx.user?.companyId || 0;

      // Get all terminals this company has active partnerships with
      const partnerTerminals = await db
        .select({
          terminalId: terminals.id,
          terminalName: terminals.name,
          terminalCode: terminals.code,
          terminalType: terminals.terminalType,
          city: terminals.city,
          state: terminals.state,
          productsHandled: terminals.productsHandled,
          partnerType: terminalPartners.partnerType,
          rackAccessLevel: terminalPartners.rackAccessLevel,
        })
        .from(terminalPartners)
        .leftJoin(terminals, eq(terminalPartners.terminalId, terminals.id))
        .where(and(
          eq(terminalPartners.companyId, companyId),
          eq(terminalPartners.status, "active"),
        ))
        .orderBy(terminals.name);

      // Also get company-owned terminals
      const ownedTerminals = await db
        .select({
          terminalId: terminals.id,
          terminalName: terminals.name,
          terminalCode: terminals.code,
          terminalType: terminals.terminalType,
          city: terminals.city,
          state: terminals.state,
          productsHandled: terminals.productsHandled,
        })
        .from(terminals)
        .where(eq(terminals.companyId, companyId));

      const owned = ownedTerminals.map(t => ({
        ...t,
        partnerType: "owner" as const,
        rackAccessLevel: "full" as const,
      }));

      // Deduplicate
      const seen = new Set<number>();
      const combined = [...owned, ...partnerTerminals].filter(t => {
        if (!t.terminalId || seen.has(t.terminalId)) return false;
        seen.add(t.terminalId);
        return true;
      });

      return combined;
    } catch (error) {
      console.error("[SupplyChain] getTerminalsForLoadCreation error:", error);
      return [];
    }
  }),

  /**
   * Get supply chain flow summary for a terminal
   * Shows: inbound loads (from shippers/marketers) + outbound loads (to destinations)
   */
  getTerminalFlowSummary: auditedTerminalProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { inbound: 0, outbound: 0, activePartners: 0, monthlyVolume: 0 };

    try {
      const companyId = ctx.user?.companyId || 0;
      const companyTerminals = await db
        .select({ id: terminals.id })
        .from(terminals)
        .where(eq(terminals.companyId, companyId));

      if (companyTerminals.length === 0) {
        return { inbound: 0, outbound: 0, activePartners: 0, monthlyVolume: 0 };
      }

      const terminalIds = companyTerminals.map(t => t.id);

      const [inbound] = await db
        .select({ count: sql<number>`count(*)` })
        .from(loads)
        .where(inArray(loads.destinationTerminalId, terminalIds));

      const [outbound] = await db
        .select({ count: sql<number>`count(*)` })
        .from(loads)
        .where(inArray(loads.originTerminalId, terminalIds));

      const [partners] = await db
        .select({ count: sql<number>`count(*)` })
        .from(terminalPartners)
        .where(and(
          inArray(terminalPartners.terminalId, terminalIds),
          eq(terminalPartners.status, "active"),
        ));

      return {
        inbound: inbound?.count || 0,
        outbound: outbound?.count || 0,
        activePartners: partners?.count || 0,
        monthlyVolume: 0,
      };
    } catch (error) {
      console.error("[SupplyChain] getTerminalFlowSummary error:", error);
      return { inbound: 0, outbound: 0, activePartners: 0, monthlyVolume: 0 };
    }
  }),

  /**
   * Search companies to add as partner (by name, DOT, or MC)
   */
  searchCompanies: auditedTerminalProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const results = await db
          .select({
            id: companies.id,
            name: companies.name,
            dotNumber: companies.dotNumber,
            mcNumber: companies.mcNumber,
            city: companies.city,
            state: companies.state,
            supplyChainRole: companies.supplyChainRole,
            marketerType: companies.marketerType,
          })
          .from(companies)
          .where(sql`${companies.name} LIKE ${'%' + input.query + '%'} OR ${companies.dotNumber} LIKE ${'%' + input.query + '%'} OR ${companies.mcNumber} LIKE ${'%' + input.query + '%'}`)
          .limit(20);

        return results;
      } catch (error) {
        console.error("[SupplyChain] searchCompanies error:", error);
        return [];
      }
    }),
});
