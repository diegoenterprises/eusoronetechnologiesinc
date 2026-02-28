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
  supplyChainPartnerships,
  agreements,
} from "../../drizzle/schema";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";
import { fmcsaService } from "../services/fmcsa";
import { emailService } from "../_core/email";
import { sendSms } from "../services/eusosms";

// All authenticated users can manage their own partnerships
const partnershipProcedure = auditedProtectedProcedure;

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
   * Layer 1: Search EusoTrip platform database
   * Layer 2: Search FMCSA SAFER API for verified carriers not on platform
   */
  searchCompanies: partnershipProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      const results: Array<{
        id: number | null;
        name: string;
        dotNumber: string | null;
        mcNumber: string | null;
        city: string | null;
        state: string | null;
        supplyChainRole: string | null;
        marketerType: string | null;
        phone: string | null;
        email: string | null;
        onPlatform: boolean;
        fmcsaVerified: boolean;
        hmFlag?: string;
        powerUnits?: number;
        driverTotal?: number;
      }> = [];

      const seenDots = new Set<string>();

      // Layer 1: Search EusoTrip database
      if (db) {
        try {
          const dbResults = await db
            .select({
              id: companies.id,
              name: companies.name,
              dotNumber: companies.dotNumber,
              mcNumber: companies.mcNumber,
              city: companies.city,
              state: companies.state,
              supplyChainRole: companies.supplyChainRole,
              marketerType: companies.marketerType,
              phone: companies.phone,
              email: companies.email,
            })
            .from(companies)
            .where(sql`${companies.name} LIKE ${'%' + input.query + '%'} OR ${companies.dotNumber} LIKE ${'%' + input.query + '%'} OR ${companies.mcNumber} LIKE ${'%' + input.query + '%'}`)
            .limit(15);

          for (const c of dbResults) {
            results.push({
              ...c,
              onPlatform: true,
              fmcsaVerified: false, // Will verify below if DOT exists
            });
            if (c.dotNumber) seenDots.add(c.dotNumber);
          }
        } catch (error) {
          console.error("[SupplyChain] searchCompanies DB error:", error);
        }
      }

      // Layer 2: Search FMCSA SAFER API
      if (fmcsaService.isConfigured()) {
        try {
          const query = input.query.trim();
          const isDotQuery = /^\d{5,9}$/.test(query);
          const isMcQuery = /^(MC)?[\s-]?\d{4,8}$/i.test(query);

          let fmcsaResults: any[] = [];

          if (isDotQuery) {
            // Direct DOT lookup
            const carrier = await fmcsaService.getCatalystByDOT(query);
            if (carrier) fmcsaResults = [carrier];
          } else if (isMcQuery) {
            // MC lookup
            const mcNum = query.replace(/[^\d]/g, '');
            const carrier = await fmcsaService.getCatalystByMC(mcNum);
            if (carrier) fmcsaResults = [carrier];
          } else if (query.length >= 3) {
            // Name search
            fmcsaResults = await fmcsaService.searchCatalysts(query, undefined, 10);
          }

          // Add FMCSA results that aren't already on platform
          for (const c of fmcsaResults) {
            const dot = c.dotNumber?.toString() || "";
            if (dot && seenDots.has(dot)) {
              // Mark the platform result as FMCSA verified
              const existing = results.find(r => r.dotNumber === dot);
              if (existing) existing.fmcsaVerified = true;
              continue;
            }
            if (dot) seenDots.add(dot);

            results.push({
              id: null, // Not on platform
              name: c.legalName || c.dbaName || "Unknown",
              dotNumber: dot || null,
              mcNumber: null,
              city: c.phyCity || null,
              state: c.phyState || null,
              supplyChainRole: null,
              marketerType: null,
              phone: c.telephone || null,
              email: c.emailAddress || null,
              onPlatform: false,
              fmcsaVerified: true,
              hmFlag: c.hmFlag,
              powerUnits: c.nbr_power_unit,
              driverTotal: c.driver_total,
            });
          }
        } catch (error) {
          console.error("[SupplyChain] searchCompanies FMCSA error:", error);
        }
      }

      // Sort: platform users first, then FMCSA verified
      results.sort((a, b) => {
        if (a.onPlatform && !b.onPlatform) return -1;
        if (!a.onPlatform && b.onPlatform) return 1;
        return 0;
      });

      return results.slice(0, 20);
    }),

  /**
   * Send invite to a company not on the platform
   * Uses SMS or email via Azure Communication Services
   */
  invitePartner: auditedTerminalProcedure
    .input(z.object({
      companyName: z.string().min(1),
      dotNumber: z.string().optional(),
      method: z.enum(["sms", "email"]),
      contact: z.string().min(1), // phone or email
      partnerType: partnerTypeSchema,
      terminalName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const inviterName = ctx.user?.name || ctx.user?.email || "A terminal operator";
      const terminalLabel = input.terminalName || "their terminal";
      const APP_URL = process.env.APP_URL || "https://eusotrip.com";
      const signupUrl = `${APP_URL}/register?ref=partner-invite&dot=${input.dotNumber || ""}`;

      if (input.method === "sms") {
        const message = `${inviterName} invites ${input.companyName} to join EusoTrip as a supply chain partner (${input.partnerType}) for ${terminalLabel}. Sign up: ${signupUrl}`;
        try {
          const result = await sendSms({ to: input.contact, message, userId: ctx.user?.id });
          return { success: result.status !== "FAILED", method: "sms", messageId: result.id };
        } catch (err: any) {
          console.error("[SupplyChain] invitePartner SMS error:", err);
          return { success: false, method: "sms", error: err?.message || "SMS failed" };
        }
      } else {
        // Email invite with branded template
        const html = buildPartnerInviteEmail({
          inviterName,
          companyName: input.companyName,
          partnerType: input.partnerType,
          terminalName: terminalLabel,
          signupUrl,
          appUrl: APP_URL,
        });

        try {
          const sent = await emailService.send({
            to: input.contact,
            subject: `You're Invited to Join EusoTrip as a Supply Chain Partner`,
            html,
          });
          return { success: sent, method: "email" };
        } catch (err: any) {
          console.error("[SupplyChain] invitePartner email error:", err);
          return { success: false, method: "email", error: err?.message || "Email failed" };
        }
      }
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERALIZED SUPPLY CHAIN PARTNERSHIPS (All Roles)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Role config: what partner types each role can add
   */
  getPartnerConfig: partnershipProcedure.query(({ ctx }) => {
    const role = ctx.user?.role || "DRIVER";
    const configs: Record<string, { partnerTypes: { toRole: string; relationship: string; label: string; description: string }[]; heading: string; subheading: string }> = {
      SHIPPER: {
        heading: "My Supply Chain Partners",
        subheading: "Carriers, brokers, and terminals you work with",
        partnerTypes: [
          { toRole: "CATALYST", relationship: "hauls_for", label: "Carrier / Catalyst", description: "Companies that haul your loads" },
          { toRole: "BROKER", relationship: "brokers_for", label: "Broker", description: "Brokers who arrange transport for you" },
          { toRole: "TERMINAL_MANAGER", relationship: "terminal_access", label: "Terminal", description: "Terminals you pick up or deliver to" },
          { toRole: "DISPATCH", relationship: "dispatches_for", label: "Dispatch Service", description: "Third-party dispatch providers" },
        ],
      },
      CATALYST: {
        heading: "My Supply Chain Partners",
        subheading: "Shippers, drivers, and brokers in your network",
        partnerTypes: [
          { toRole: "SHIPPER", relationship: "sources_from", label: "Shipper", description: "Companies who give you loads" },
          { toRole: "BROKER", relationship: "sources_from", label: "Broker", description: "Brokers who assign you loads" },
          { toRole: "DRIVER", relationship: "hauls_for", label: "Driver", description: "Drivers in your fleet or contracted" },
          { toRole: "ESCORT", relationship: "escorts_for", label: "Escort", description: "Escort vehicles for hazmat loads" },
          { toRole: "TERMINAL_MANAGER", relationship: "terminal_access", label: "Terminal", description: "Terminals you pick up or deliver at" },
        ],
      },
      BROKER: {
        heading: "My Supply Chain Partners",
        subheading: "Shippers, carriers, and terminals you connect",
        partnerTypes: [
          { toRole: "SHIPPER", relationship: "brokers_for", label: "Shipper", description: "Shippers whose loads you broker" },
          { toRole: "CATALYST", relationship: "hauls_for", label: "Carrier / Catalyst", description: "Carriers you assign loads to" },
          { toRole: "TERMINAL_MANAGER", relationship: "terminal_access", label: "Terminal", description: "Terminals in your routes" },
          { toRole: "DISPATCH", relationship: "dispatches_for", label: "Dispatch Service", description: "Dispatch services you use" },
        ],
      },
      DRIVER: {
        heading: "My Partners",
        subheading: "Your carrier and dispatch contacts",
        partnerTypes: [
          { toRole: "CATALYST", relationship: "hauls_for", label: "Carrier / Catalyst", description: "The carrier you drive for" },
          { toRole: "DISPATCH", relationship: "dispatches_for", label: "Dispatcher", description: "Your dispatch contact" },
        ],
      },
      ESCORT: {
        heading: "My Partners",
        subheading: "Carriers and drivers you escort for",
        partnerTypes: [
          { toRole: "CATALYST", relationship: "escorts_for", label: "Carrier / Catalyst", description: "Carriers you provide escort for" },
        ],
      },
      DISPATCH: {
        heading: "My Supply Chain Partners",
        subheading: "Carriers, drivers, and shippers you coordinate",
        partnerTypes: [
          { toRole: "CATALYST", relationship: "dispatches_for", label: "Carrier / Catalyst", description: "Carriers you dispatch for" },
          { toRole: "SHIPPER", relationship: "dispatches_for", label: "Shipper", description: "Shippers you coordinate loads for" },
          { toRole: "DRIVER", relationship: "dispatches_for", label: "Driver", description: "Drivers you assign and track" },
        ],
      },
      TERMINAL_MANAGER: {
        heading: "Supply Chain Partners",
        subheading: "Managed via Terminal Partners page",
        partnerTypes: [
          { toRole: "SHIPPER", relationship: "terminal_access", label: "Shipper", description: "Shippers who use your terminal" },
          { toRole: "CATALYST", relationship: "terminal_access", label: "Transporter", description: "Carriers picking up at your terminal" },
          { toRole: "BROKER", relationship: "terminal_access", label: "Broker", description: "Brokers who route through your terminal" },
        ],
      },
      COMPLIANCE_OFFICER: {
        heading: "Compliance Partners",
        subheading: "Companies in your compliance network",
        partnerTypes: [
          { toRole: "CATALYST", relationship: "compliance_for", label: "Carrier", description: "Carriers you monitor compliance for" },
          { toRole: "SHIPPER", relationship: "compliance_for", label: "Shipper", description: "Shippers you audit" },
        ],
      },
      SAFETY_MANAGER: {
        heading: "Safety Partners",
        subheading: "Companies in your safety network",
        partnerTypes: [
          { toRole: "CATALYST", relationship: "compliance_for", label: "Carrier", description: "Carriers in your safety program" },
          { toRole: "DRIVER", relationship: "compliance_for", label: "Driver", description: "Drivers you oversee" },
        ],
      },
      FACTORING: {
        heading: "Factoring Partners",
        subheading: "Carriers, shippers & brokers you factor for",
        partnerTypes: [
          { toRole: "CATALYST", relationship: "factors_for", label: "Carrier / Catalyst", description: "Carriers whose invoices you factor" },
          { toRole: "SHIPPER", relationship: "factors_for", label: "Shipper", description: "Shippers (debtors) you collect from" },
          { toRole: "BROKER", relationship: "factors_for", label: "Broker", description: "Brokers whose loads you fund" },
        ],
      },
      ADMIN: {
        heading: "Platform Partners",
        subheading: "All supply chain partner management",
        partnerTypes: [
          { toRole: "SHIPPER", relationship: "platform_admin", label: "Shipper", description: "Shipper companies on the platform" },
          { toRole: "CATALYST", relationship: "platform_admin", label: "Carrier / Catalyst", description: "Carrier companies on the platform" },
          { toRole: "BROKER", relationship: "platform_admin", label: "Broker", description: "Broker companies on the platform" },
          { toRole: "TERMINAL_MANAGER", relationship: "platform_admin", label: "Terminal", description: "Terminal facilities on the platform" },
          { toRole: "DISPATCH", relationship: "platform_admin", label: "Dispatch", description: "Dispatch services on the platform" },
        ],
      },
      SUPER_ADMIN: {
        heading: "Platform Partners",
        subheading: "System-wide partner oversight",
        partnerTypes: [
          { toRole: "SHIPPER", relationship: "platform_admin", label: "Shipper", description: "Shipper companies on the platform" },
          { toRole: "CATALYST", relationship: "platform_admin", label: "Carrier / Catalyst", description: "Carrier companies on the platform" },
          { toRole: "BROKER", relationship: "platform_admin", label: "Broker", description: "Broker companies on the platform" },
          { toRole: "TERMINAL_MANAGER", relationship: "platform_admin", label: "Terminal", description: "Terminal facilities on the platform" },
          { toRole: "DISPATCH", relationship: "platform_admin", label: "Dispatch", description: "Dispatch services on the platform" },
          { toRole: "FACTORING", relationship: "platform_admin", label: "Factoring", description: "Factoring companies on the platform" },
        ],
      },
    };
    const fallback = { heading: "My Partners", subheading: "Your supply chain connections", partnerTypes: [] as any[] };
    return configs[role] || fallback;
  }),

  /**
   * Get all partnerships for the current user's company
   */
  getMyPartners: partnershipProcedure
    .input(z.object({
      status: z.enum(["active", "pending", "declined", "suspended", "terminated"]).optional(),
      toRole: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        if (!companyId) return [];

        // Get partnerships where we are the "from" company
        const outbound = await db
          .select({
            id: supplyChainPartnerships.id,
            direction: sql<string>`'outbound'`.as("direction"),
            partnerCompanyId: supplyChainPartnerships.toCompanyId,
            fromRole: supplyChainPartnerships.fromRole,
            toRole: supplyChainPartnerships.toRole,
            relationshipType: supplyChainPartnerships.relationshipType,
            status: supplyChainPartnerships.status,
            notes: supplyChainPartnerships.notes,
            invitedVia: supplyChainPartnerships.invitedVia,
            createdAt: supplyChainPartnerships.createdAt,
            companyName: companies.name,
            companyDot: companies.dotNumber,
            companyMc: companies.mcNumber,
            companyCity: companies.city,
            companyState: companies.state,
          })
          .from(supplyChainPartnerships)
          .leftJoin(companies, eq(supplyChainPartnerships.toCompanyId, companies.id))
          .where(and(
            eq(supplyChainPartnerships.fromCompanyId, companyId),
            input?.status ? eq(supplyChainPartnerships.status, input.status) : undefined,
            input?.toRole ? eq(supplyChainPartnerships.toRole, input.toRole as any) : undefined,
          ))
          .orderBy(desc(supplyChainPartnerships.createdAt));

        // Get partnerships where we are the "to" company (others added us)
        const inbound = await db
          .select({
            id: supplyChainPartnerships.id,
            direction: sql<string>`'inbound'`.as("direction"),
            partnerCompanyId: supplyChainPartnerships.fromCompanyId,
            fromRole: supplyChainPartnerships.fromRole,
            toRole: supplyChainPartnerships.toRole,
            relationshipType: supplyChainPartnerships.relationshipType,
            status: supplyChainPartnerships.status,
            notes: supplyChainPartnerships.notes,
            invitedVia: supplyChainPartnerships.invitedVia,
            createdAt: supplyChainPartnerships.createdAt,
            companyName: companies.name,
            companyDot: companies.dotNumber,
            companyMc: companies.mcNumber,
            companyCity: companies.city,
            companyState: companies.state,
          })
          .from(supplyChainPartnerships)
          .leftJoin(companies, eq(supplyChainPartnerships.fromCompanyId, companies.id))
          .where(and(
            eq(supplyChainPartnerships.toCompanyId, companyId),
            input?.status ? eq(supplyChainPartnerships.status, input.status) : undefined,
          ))
          .orderBy(desc(supplyChainPartnerships.createdAt));

        // Merge, deduplicate by id
        const seen = new Set<number>();
        const combined = [...outbound, ...inbound].filter(p => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });

        // Enrich with agreement status per partner company
        const partnerCompanyIds = Array.from(new Set(combined.map(p => p.partnerCompanyId).filter(Boolean))) as number[];
        let agreementMap: Record<number, string> = {};
        if (partnerCompanyIds.length > 0) {
          try {
            const relevantAgreements = await db
              .select({
                partyACompanyId: agreements.partyACompanyId,
                partyBCompanyId: agreements.partyBCompanyId,
                status: agreements.status,
                expirationDate: agreements.expirationDate,
              })
              .from(agreements)
              .where(
                or(
                  and(eq(agreements.partyACompanyId, companyId), inArray(agreements.partyBCompanyId, partnerCompanyIds)),
                  and(eq(agreements.partyBCompanyId, companyId), inArray(agreements.partyACompanyId, partnerCompanyIds)),
                )
              );

            // For each partner company, determine the best agreement status
            // Priority: active > pending_signature/pending_review/negotiating/draft > expired > none
            for (const agr of relevantAgreements) {
              const partnerId = agr.partyACompanyId === companyId ? agr.partyBCompanyId : agr.partyACompanyId;
              if (!partnerId) continue;
              const current = agreementMap[partnerId];
              const s = agr.status || "draft";
              // Check if active agreement is actually expired by date
              const isExpiredByDate = s === "active" && agr.expirationDate && new Date(agr.expirationDate) < new Date();
              const effectiveStatus = isExpiredByDate ? "expired" : s;

              if (effectiveStatus === "active") {
                agreementMap[partnerId] = "active";
              } else if (["pending_signature", "pending_review", "negotiating", "draft"].includes(effectiveStatus) && current !== "active") {
                agreementMap[partnerId] = "pending";
              } else if (effectiveStatus === "expired" && !current) {
                agreementMap[partnerId] = "expired";
              }
            }
          } catch (e) {
            console.error("[SupplyChain] Agreement enrichment error:", e);
          }
        }

        return combined.map(p => ({
          ...p,
          agreementStatus: (p.partnerCompanyId && agreementMap[p.partnerCompanyId]) || null,
        }));
      } catch (error) {
        console.error("[SupplyChain] getMyPartners error:", error);
        return [];
      }
    }),

  /**
   * Stats for the partner dashboard header
   */
  getPartnershipStats: partnershipProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, active: 0, pending: 0, byRole: {} as Record<string, number> };
    try {
      const companyId = ctx.user?.companyId || 0;
      if (!companyId) return { total: 0, active: 0, pending: 0, byRole: {} };

      const all = await db
        .select({
          status: supplyChainPartnerships.status,
          toRole: supplyChainPartnerships.toRole,
          fromRole: supplyChainPartnerships.fromRole,
        })
        .from(supplyChainPartnerships)
        .where(or(
          eq(supplyChainPartnerships.fromCompanyId, companyId),
          eq(supplyChainPartnerships.toCompanyId, companyId),
        ));

      const total = all.length;
      const active = all.filter(p => p.status === "active").length;
      const pending = all.filter(p => p.status === "pending").length;
      const byRole: Record<string, number> = {};
      for (const p of all) {
        const role = p.toRole || p.fromRole || "OTHER";
        byRole[role] = (byRole[role] || 0) + 1;
      }
      return { total, active, pending, byRole };
    } catch (error) {
      console.error("[SupplyChain] getPartnershipStats error:", error);
      return { total: 0, active: 0, pending: 0, byRole: {} };
    }
  }),

  /**
   * Add a new partnership (on-platform company)
   */
  addPartnership: partnershipProcedure
    .input(z.object({
      toCompanyId: z.number(),
      toRole: z.string(),
      relationshipType: z.string(),
      notes: z.string().optional(),
      terminalId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user?.companyId || 0;
      const userId = ctx.user?.id || 0;
      const fromRole = ctx.user?.role || "SHIPPER";
      if (!companyId) throw new Error("No company associated with your account");

      const [result] = await db.insert(supplyChainPartnerships).values({
        fromCompanyId: companyId,
        toCompanyId: input.toCompanyId,
        initiatorUserId: userId,
        fromRole: fromRole as any,
        toRole: input.toRole as any,
        relationshipType: input.relationshipType as any,
        status: "active",
        notes: input.notes || null,
        terminalId: input.terminalId || null,
        invitedVia: "platform",
      }).$returningId();

      return { success: true, id: result?.id };
    }),

  /**
   * Update partnership status
   */
  updatePartnershipStatus: partnershipProcedure
    .input(z.object({
      partnershipId: z.number(),
      status: z.enum(["active", "pending", "declined", "suspended", "terminated"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user?.companyId || 0;

      await db.update(supplyChainPartnerships)
        .set({ status: input.status, updatedAt: new Date() })
        .where(and(
          eq(supplyChainPartnerships.id, input.partnershipId),
          or(
            eq(supplyChainPartnerships.fromCompanyId, companyId),
            eq(supplyChainPartnerships.toCompanyId, companyId),
          ),
        ));

      return { success: true };
    }),

  /**
   * Invite a non-platform company + create pending partnership record
   */
  inviteAndPartner: partnershipProcedure
    .input(z.object({
      companyName: z.string().min(1),
      dotNumber: z.string().optional(),
      method: z.enum(["sms", "email"]),
      contact: z.string().min(1),
      toRole: z.string(),
      relationshipType: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const inviterName = ctx.user?.name || ctx.user?.email || "A partner";
      const fromRole = ctx.user?.role || "SHIPPER";
      const APP_URL = process.env.APP_URL || "https://eusotrip.com";
      const signupUrl = `${APP_URL}/register?ref=partner-invite&dot=${input.dotNumber || ""}&role=${input.toRole}`;

      const roleLabels: Record<string, string> = {
        SHIPPER: "Shipper", CATALYST: "Carrier", BROKER: "Broker", DRIVER: "Driver",
        DISPATCH: "Dispatcher", ESCORT: "Escort", TERMINAL_MANAGER: "Terminal Operator",
        COMPLIANCE_OFFICER: "Compliance Officer", SAFETY_MANAGER: "Safety Manager",
      };
      const toLabel = roleLabels[input.toRole] || input.toRole;

      if (input.method === "sms") {
        const message = `${inviterName} invites ${input.companyName} to join EusoTrip as a ${toLabel} partner. Sign up free: ${signupUrl}`;
        try {
          const result = await sendSms({ to: input.contact, message, userId: ctx.user?.id });
          return { success: result.status !== "FAILED", method: "sms" };
        } catch (err: any) {
          return { success: false, method: "sms", error: err?.message || "SMS failed" };
        }
      } else {
        const html = buildPartnerInviteEmail({
          inviterName,
          companyName: input.companyName,
          partnerType: toLabel.toLowerCase(),
          terminalName: `${fromRole} partnership`,
          signupUrl,
          appUrl: APP_URL,
        });
        try {
          const sent = await emailService.send({
            to: input.contact,
            subject: `You're Invited to Join EusoTrip as a Supply Chain Partner`,
            html,
          });
          return { success: sent, method: "email" };
        } catch (err: any) {
          return { success: false, method: "email", error: err?.message || "Email failed" };
        }
      }
    }),
});

// ─── Branded Partner Invite Email Template ───
function buildPartnerInviteEmail(params: {
  inviterName: string;
  companyName: string;
  partnerType: string;
  terminalName: string;
  signupUrl: string;
  appUrl: string;
}): string {
  const LOGO_URL = `${params.appUrl}/eusotrip-logo.png`;
  const partnerLabel = params.partnerType.charAt(0).toUpperCase() + params.partnerType.slice(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Partner Invitation - EusoTrip</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1120;min-height:100vh">
<tr><td align="center" style="padding:40px 16px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

<tr><td align="center" style="padding-bottom:32px">
  <img src="${LOGO_URL}" alt="EusoTrip" width="52" height="52" style="display:block;border:0;border-radius:14px">
</td></tr>

<tr><td style="background:linear-gradient(145deg,rgba(30,41,59,0.80),rgba(15,23,42,0.95));border:1px solid rgba(255,255,255,0.06);border-radius:20px;overflow:hidden">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="height:3px;background:linear-gradient(90deg,#1473FF,#BE01FF)"></td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:36px 36px 0">
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;line-height:1.3">You're Invited to Join EusoTrip</h1>
  </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:20px 36px 36px;color:#94A3B8;font-size:15px;line-height:1.7">
    <p style="margin:0 0 16px;color:#CBD5E1">Hello <strong style="color:#E2E8F0">${params.companyName}</strong>,</p>
    <p style="margin:0 0 16px;color:#CBD5E1"><strong style="color:#E2E8F0">${params.inviterName}</strong> has invited you to join the EusoTrip platform as a <strong style="background:linear-gradient(90deg,#1473FF,#BE01FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${partnerLabel}</strong> partner for <strong style="color:#E2E8F0">${params.terminalName}</strong>.</p>
    <p style="margin:0 0 8px;color:#94A3B8">EusoTrip is the leading hazmat and energy logistics platform, connecting terminals, shippers, brokers, and transporters across the industry.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px">
    <tr><td align="center">
      <a href="${params.signupUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1473FF,#BE01FF);color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:12px;letter-spacing:0.2px">Create Your Free Account</a>
    </td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#475569;line-height:1.5">By joining, you'll gain access to real-time load tracking, compliance management, market intelligence, and seamless supply chain coordination.</p>
  </td></tr>
  </table>
</td></tr>

<tr><td style="padding:28px 0 0;text-align:center">
  <p style="margin:0 0 4px;font-size:12px;color:#475569;letter-spacing:0.5px">
    <span style="background:linear-gradient(90deg,#1473FF,#BE01FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:600">EusoTrip</span>
  </p>
  <p style="margin:0 0 4px;font-size:11px;color:#334155">Hazmat &amp; Energy Logistics Platform</p>
  <p style="margin:0;font-size:11px;color:#1E293B">
    <a href="${params.appUrl}/privacy-policy" style="color:#475569;text-decoration:none">Privacy</a>
    &nbsp;&middot;&nbsp;
    <a href="${params.appUrl}/terms" style="color:#475569;text-decoration:none">Terms</a>
    &nbsp;&middot;&nbsp;
    <a href="${params.appUrl}" style="color:#475569;text-decoration:none">eusotrip.com</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
