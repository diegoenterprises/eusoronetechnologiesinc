/**
 * VENDORS ROUTER
 * tRPC procedures for vendor and supplier management
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies, loads } from "../../drizzle/schema";

const vendorTypeSchema = z.enum([
  "maintenance", "fuel", "insurance", "parts", "tires", "equipment", "technology", "other"
]);
const vendorStatusSchema = z.enum(["active", "inactive", "pending", "suspended"]);

export const vendorsRouter = router({
  /**
   * List vendors
   */
  list: protectedProcedure
    .input(z.object({
      type: vendorTypeSchema.optional(),
      status: vendorStatusSchema.optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { vendors: [], total: 0 };
      try {
        const conds: any[] = [sql`${companies.description} LIKE '%[vendor]%'`];
        if (input.search) conds.push(sql`${companies.name} LIKE ${`%${input.search}%`}`);
        const rows = await db.select().from(companies).where(and(...conds)).orderBy(desc(companies.createdAt)).limit(input.limit);
        const [countRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(companies).where(and(...conds));
        return {
          vendors: rows.map(c => ({
            id: String(c.id), name: c.name, type: 'other', status: c.isActive ? 'active' : 'inactive',
            email: c.email || '', phone: c.phone || '', address: c.address || '',
            createdAt: c.createdAt?.toISOString() || '',
          })),
          total: countRow?.count || 0,
        };
      } catch (e) { console.error('[Vendors] list error:', e); return { vendors: [], total: 0 }; }
    }),

  /**
   * Get vendor by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return null;
      try {
        const [row] = await db.select().from(companies).where(eq(companies.id, parseInt(input.id))).limit(1);
        if (!row) return null;
        return {
          id: String(row.id), name: row.name, type: 'other', status: row.isActive ? 'active' : 'inactive',
          companyInfo: { legalName: row.name, taxId: '', established: row.createdAt?.toISOString()?.split('T')[0] || '' },
          primaryContact: { name: '', title: '', email: row.email || '', phone: row.phone || '', mobile: '' },
          addresses: row.address ? [{ type: 'primary', address: row.address }] : [],
          services: [], paymentTerms: 'Net 30',
          pricing: { laborRate: 0, shopSupplies: 0, partsMarkup: 0 },
          statistics: { totalSpend: 0, ordersThisYear: 0, avgOrderValue: 0, avgResponseTime: 0, completionRate: 0 },
          certifications: [], insurance: {}, rating: 0, reviews: 0, notes: '',
          createdAt: row.createdAt?.toISOString() || '',
        };
      } catch { return null; }
    }),

  /**
   * Create vendor
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: vendorTypeSchema,
      contact: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
      }),
      address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
      services: z.array(z.string()).optional(),
      paymentTerms: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error('Database unavailable');
      const [result] = await db.insert(companies).values({
        name: input.name,
        description: `[vendor] ${input.type}`,
        email: input.contact.email,
        phone: input.contact.phone,
        address: `${input.address.street}, ${input.address.city}, ${input.address.state} ${input.address.zip}`,
        isActive: false,
      }).$returningId();
      return { id: String(result.id), name: input.name, status: 'pending', createdBy: ctx.user?.id, createdAt: new Date().toISOString() };
    }),

  /**
   * Update vendor
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: vendorStatusSchema.optional(),
      contact: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
      }).optional(),
      paymentTerms: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        const updates: Record<string, any> = {};
        if (input.status) updates.isActive = input.status === 'active';
        if (input.contact?.email) updates.email = input.contact.email;
        if (input.contact?.phone) updates.phone = input.contact.phone;
        if (Object.keys(updates).length > 0) {
          await db.update(companies).set(updates).where(eq(companies.id, parseInt(input.id)));
        }
      }
      return { success: true, id: input.id, updatedBy: ctx.user?.id, updatedAt: new Date().toISOString() };
    }),

  /**
   * Get vendor orders/invoices
   */
  getOrders: protectedProcedure
    .input(z.object({
      vendorId: z.string(),
      status: z.enum(["all", "pending", "completed", "cancelled"]).default("all"),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { orders: [], total: 0, summary: { totalSpend: 0, pendingOrders: 0, avgOrderValue: 0 } };
      try {
        const vendorId = parseInt(input.vendorId);
        const conds: any[] = [eq(loads.catalystId, vendorId)];
        if (input.status === 'completed') conds.push(eq(loads.status, 'delivered'));
        if (input.status === 'pending') conds.push(eq(loads.status, 'posted'));
        if (input.status === 'cancelled') conds.push(eq(loads.status, 'cancelled'));
        const rows = await db.select().from(loads).where(and(...conds)).orderBy(desc(loads.createdAt)).limit(input.limit);
        const [stats] = await db.select({
          totalSpend: sql<number>`COALESCE(SUM(CAST(${loads.rate} AS DECIMAL)), 0)`,
          pending: sql<number>`SUM(CASE WHEN ${loads.status} = 'posted' THEN 1 ELSE 0 END)`,
          count: sql<number>`COUNT(*)`,
        }).from(loads).where(eq(loads.catalystId, vendorId));
        const total = stats?.count || 0;
        return {
          orders: rows.map(l => ({ id: String(l.id), loadNumber: l.loadNumber, status: l.status, rate: l.rate ? parseFloat(String(l.rate)) : 0, createdAt: l.createdAt?.toISOString() || '' })),
          total,
          summary: { totalSpend: Math.round(stats?.totalSpend || 0), pendingOrders: stats?.pending || 0, avgOrderValue: total > 0 ? Math.round((stats?.totalSpend || 0) / total) : 0 },
        };
      } catch { return { orders: [], total: 0, summary: { totalSpend: 0, pendingOrders: 0, avgOrderValue: 0 } }; }
    }),

  /**
   * Create service request
   */
  createServiceRequest: protectedProcedure
    .input(z.object({
      vendorId: z.string(),
      vehicleId: z.string().optional(),
      serviceType: z.string(),
      description: z.string(),
      priority: z.enum(["low", "medium", "high", "urgent"]),
      scheduledDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        requestId: `req_${Date.now()}`,
        vendorId: input.vendorId,
        status: "submitted",
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Rate vendor
   */
  rate: protectedProcedure
    .input(z.object({
      vendorId: z.string(),
      orderId: z.string(),
      rating: z.number().min(1).max(5),
      categories: z.object({
        quality: z.number().min(1).max(5),
        timeliness: z.number().min(1).max(5),
        communication: z.number().min(1).max(5),
        value: z.number().min(1).max(5),
      }).optional(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        ratingId: `rating_${Date.now()}`,
        submittedBy: ctx.user?.id,
        submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get vendor spend analytics
   */
  getSpendAnalytics: protectedProcedure
    .input(z.object({
      period: z.enum(["month", "quarter", "year"]).default("quarter"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { period: input.period, totalSpend: 0, byCategory: [], topVendors: [], trend: { change: 0, direction: 'stable', vsLastPeriod: 0 } };
      try {
        const companyId = ctx.user?.companyId || 0;
        const daysMap: Record<string, number> = { month: 30, quarter: 90, year: 365 };
        const since = new Date(Date.now() - (daysMap[input.period] || 90) * 86400000);
        const [stats] = await db.select({
          totalSpend: sql<number>`COALESCE(SUM(CAST(${loads.rate} AS DECIMAL)), 0)`,
        }).from(loads).where(and(eq(loads.shipperId, companyId), eq(loads.status, 'delivered'), sql`${loads.createdAt} >= ${since}`));
        // Top vendors by spend
        const topRows = await db.select({
          catalystId: loads.catalystId,
          spend: sql<number>`COALESCE(SUM(CAST(${loads.rate} AS DECIMAL)), 0)`,
          count: sql<number>`COUNT(*)`,
        }).from(loads).where(and(eq(loads.shipperId, companyId), eq(loads.status, 'delivered'), sql`${loads.createdAt} >= ${since}`))
          .groupBy(loads.catalystId).orderBy(sql`SUM(CAST(${loads.rate} AS DECIMAL)) DESC`).limit(5);
        const topVendors = await Promise.all(topRows.map(async (r) => {
          let name = `Company #${r.catalystId}`;
          if (r.catalystId) {
            const [c] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, r.catalystId)).limit(1);
            if (c?.name) name = c.name;
          }
          return { id: String(r.catalystId), name, spend: Math.round(r.spend), orders: r.count };
        }));
        return { period: input.period, totalSpend: Math.round(stats?.totalSpend || 0), byCategory: [], topVendors, trend: { change: 0, direction: 'stable', vsLastPeriod: 0 } };
      } catch { return { period: input.period, totalSpend: 0, byCategory: [], topVendors: [], trend: { change: 0, direction: 'stable', vsLastPeriod: 0 } }; }
    }),

  /**
   * Get expiring contracts/certifications
   */
  getExpiring: protectedProcedure
    .input(z.object({
      daysAhead: z.number().default(60),
    }))
    .query(async ({ input }) => {
      // No dedicated vendor contracts table; return empty for now
      console.log(`[Vendors] getExpiring called with daysAhead=${input.daysAhead}`);
      return [];
    }),
});
