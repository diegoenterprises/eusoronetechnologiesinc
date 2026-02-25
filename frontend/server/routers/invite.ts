/**
 * INVITE ROUTER
 * tRPC procedures for situation-aware invitations
 * Powers viral growth by prompting invites at every external interaction
 */

import { z } from "zod";
import { router, auditedProtectedProcedure } from "../_core/trpc";
import { sendInvite, sendBulkInvites, InviteContext } from "../services/inviteService";
import { fmcsaService } from "../services/fmcsa";
import { getDb } from "../db";
import { companies } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

const inviteContextSchema = z.enum([
  "PARTNER_LINK",
  "LOAD_BOARD",
  "ACCESS_GATE",
  "LOAD_ASSIGN",
  "CARRIER_SEARCH",
  "DRIVER_ONBOARD",
  "SHIPPER_CONNECT",
  "GENERAL",
]);

export const inviteRouter = router({
  /**
   * Send a single invite
   */
  send: auditedProtectedProcedure
    .input(z.object({
      context: inviteContextSchema,
      method: z.enum(["sms", "email"]),
      contact: z.string().min(1),
      targetName: z.string().min(1),
      targetDot: z.string().optional(),
      targetMc: z.string().optional(),
      loadNumber: z.string().optional(),
      terminalName: z.string().optional(),
      laneName: z.string().optional(),
      productType: z.string().optional(),
      urgency: z.enum(["normal", "urgent"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const inviterName = ctx.user?.name || ctx.user?.email || "Someone";
      // Try to get company name
      let inviterCompany: string | undefined;
      const db = await getDb();
      if (db && ctx.user?.companyId) {
        try {
          const [co] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, ctx.user.companyId)).limit(1);
          if (co?.name) inviterCompany = co.name;
        } catch { /* ignore */ }
      }

      const result = await sendInvite({
        context: input.context as InviteContext,
        method: input.method,
        contact: input.contact,
        inviterName,
        inviterCompany,
        targetName: input.targetName,
        targetDot: input.targetDot,
        targetMc: input.targetMc,
        loadNumber: input.loadNumber,
        terminalName: input.terminalName,
        laneName: input.laneName,
        productType: input.productType,
        urgency: input.urgency,
        userId: ctx.user?.id,
      });

      return result;
    }),

  /**
   * Send bulk invites (e.g., invite multiple carriers to bid)
   */
  sendBulk: auditedProtectedProcedure
    .input(z.object({
      context: inviteContextSchema,
      method: z.enum(["sms", "email"]),
      targets: z.array(z.object({
        contact: z.string(),
        name: z.string(),
        dot: z.string().optional(),
      })),
      loadNumber: z.string().optional(),
      laneName: z.string().optional(),
      urgency: z.enum(["normal", "urgent"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const inviterName = ctx.user?.name || ctx.user?.email || "Someone";
      let inviterCompany: string | undefined;
      const db = await getDb();
      if (db && ctx.user?.companyId) {
        try {
          const [co] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, ctx.user.companyId)).limit(1);
          if (co?.name) inviterCompany = co.name;
        } catch { /* ignore */ }
      }

      const invites = input.targets.map(t => ({
        context: input.context as InviteContext,
        method: input.method as "sms" | "email",
        contact: t.contact,
        inviterName,
        inviterCompany,
        targetName: t.name,
        targetDot: t.dot,
        loadNumber: input.loadNumber,
        laneName: input.laneName,
        urgency: input.urgency,
        userId: ctx.user?.id,
      }));

      return sendBulkInvites(invites);
    }),

  /**
   * Lookup a company/carrier for invite — checks platform DB then FMCSA
   * Returns contact info and onPlatform status
   */
  lookup: auditedProtectedProcedure
    .input(z.object({
      query: z.string().min(1), // name, DOT, or MC
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const results: Array<{
        id: number | null;
        name: string;
        dotNumber: string | null;
        mcNumber: string | null;
        phone: string | null;
        email: string | null;
        city: string | null;
        state: string | null;
        onPlatform: boolean;
        fmcsaVerified: boolean;
        hmFlag?: string;
      }> = [];

      const seenDots = new Set<string>();

      // Layer 1: Platform DB
      if (db) {
        try {
          const dbResults = await db
            .select({
              id: companies.id,
              name: companies.name,
              dotNumber: companies.dotNumber,
              mcNumber: companies.mcNumber,
              phone: companies.phone,
              email: companies.email,
              city: companies.city,
              state: companies.state,
            })
            .from(companies)
            .where(sql`${companies.name} LIKE ${'%' + input.query + '%'} OR ${companies.dotNumber} LIKE ${'%' + input.query + '%'} OR ${companies.mcNumber} LIKE ${'%' + input.query + '%'}`)
            .limit(10);

          for (const c of dbResults) {
            results.push({ ...c, onPlatform: true, fmcsaVerified: false });
            if (c.dotNumber) seenDots.add(c.dotNumber);
          }
        } catch { /* ignore */ }
      }

      // Layer 2: FMCSA
      if (fmcsaService.isConfigured()) {
        try {
          const query = input.query.trim();
          const isDot = /^\d{5,9}$/.test(query);
          const isMc = /^(MC)?[\s-]?\d{4,8}$/i.test(query);

          let fmcsaResults: any[] = [];
          if (isDot) {
            const c = await fmcsaService.getCatalystByDOT(query);
            if (c) fmcsaResults = [c];
          } else if (isMc) {
            const c = await fmcsaService.getCatalystByMC(query.replace(/[^\d]/g, ''));
            if (c) fmcsaResults = [c];
          } else if (query.length >= 3) {
            fmcsaResults = await fmcsaService.searchCatalysts(query, undefined, 8);
          }

          for (const c of fmcsaResults) {
            const dot = c.dotNumber?.toString() || "";
            if (dot && seenDots.has(dot)) {
              const ex = results.find(r => r.dotNumber === dot);
              if (ex) ex.fmcsaVerified = true;
              continue;
            }
            if (dot) seenDots.add(dot);

            results.push({
              id: null,
              name: c.legalName || c.dbaName || "Unknown",
              dotNumber: dot || null,
              mcNumber: null,
              phone: c.telephone || null,
              email: c.emailAddress || null,
              city: c.phyCity || null,
              state: c.phyState || null,
              onPlatform: false,
              fmcsaVerified: true,
              hmFlag: c.hmFlag,
            });
          }
        } catch { /* ignore */ }
      }

      // Sort platform first
      results.sort((a, b) => (a.onPlatform === b.onPlatform ? 0 : a.onPlatform ? -1 : 1));
      return results.slice(0, 15);
    }),
});
