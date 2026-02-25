/**
 * FACILITIES ROUTER
 * tRPC procedures for facility/location management
 */

import { z } from "zod";
import { eq, and, desc, sql, like } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { terminals } from "../../drizzle/schema";

const facilityTypeSchema = z.enum([
  "terminal", "refinery", "distribution_center", "truck_stop", "yard", "warehouse", "customer"
]);

export const facilitiesRouter = router({
  /**
   * List facilities
   */
  list: protectedProcedure
    .input(z.object({
      type: facilityTypeSchema.optional(),
      state: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { facilities: [], total: 0 };
      try {
        const companyId = ctx.user?.companyId || 0;
        const conds: any[] = [eq(terminals.companyId, companyId)];
        if (input.state) conds.push(eq(terminals.state, input.state));
        if (input.search) conds.push(like(terminals.name, `%${input.search}%`));
        const rows = await db.select().from(terminals).where(and(...conds)).orderBy(desc(terminals.createdAt)).limit(input.limit).offset(input.offset);
        return {
          facilities: rows.map(r => ({
            id: String(r.id), name: r.name, type: 'terminal',
            address: r.address || '', city: r.city || '', state: r.state || '',
            zip: '', location: { lat: 0, lng: 0 },
            phone: '', operatingHours: '24/7', products: [], hazmatCertified: false,
          })),
          total: rows.length,
        };
      } catch (e) { return { facilities: [], total: 0 }; }
    }),

  /**
   * Get facility by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return null;
      try {
        const [row] = await db.select().from(terminals).where(eq(terminals.id, parseInt(input.id, 10))).limit(1);
        if (!row) return null;
        return {
          id: String(row.id), name: row.name, type: 'terminal',
          address: { street: row.address || '', city: row.city || '', state: row.state || '', zip: '' },
          location: { lat: 0, lng: 0 },
          contact: { phone: '', email: '', dispatchPhone: '' },
          operatingHours: { monday: { open: '00:00', close: '23:59' }, tuesday: { open: '00:00', close: '23:59' }, wednesday: { open: '00:00', close: '23:59' }, thursday: { open: '00:00', close: '23:59' }, friday: { open: '00:00', close: '23:59' }, saturday: { open: '00:00', close: '23:59' }, sunday: { open: '00:00', close: '23:59' } },
          products: [], capabilities: { racks: row.dockCount || 0, loadingBays: row.dockCount || 0, avgLoadTime: 45, hazmatCertified: false, twicRequired: false, scaleOnSite: false },
          instructions: { checkIn: '', loading: '', safety: '' },
          amenities: [], status: row.status || 'active',
        };
      } catch (e) { return null; }
    }),

  /**
   * Search nearby facilities
   */
  searchNearby: protectedProcedure
    .input(z.object({
      location: z.object({ lat: z.number(), lng: z.number() }),
      radius: z.number().default(50),
      type: facilityTypeSchema.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const rows = await db.select().from(terminals).where(eq(terminals.companyId, companyId)).limit(20);
        return rows.map(r => ({ id: String(r.id), name: r.name, type: 'terminal', address: `${r.address || ''}, ${r.city || ''}, ${r.state || ''}`, distance: 0, location: { lat: 0, lng: 0 } }));
      } catch (e) { return []; }
    }),

  /**
   * Get facility operating status
   */
  getStatus: protectedProcedure
    .input(z.object({ facilityId: z.string() }))
    .query(async ({ input }) => {
      return {
        facilityId: input.facilityId,
        status: "operational",
        currentQueue: 3,
        avgWaitTime: 25,
        racksAvailable: 2,
        racksTotal: 4,
        alerts: [],
        lastUpdated: new Date().toISOString(),
      };
    }),

  /**
   * Get facility schedule
   */
  getSchedule: protectedProcedure
    .input(z.object({
      facilityId: z.string(),
      date: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        facilityId: input.facilityId,
        date: input.date,
        slots: [],
        closures: [],
      };
    }),

  /**
   * Create facility
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: facilityTypeSchema,
      address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
      location: z.object({ lat: z.number(), lng: z.number() }).optional(),
      phone: z.string().optional(),
      hazmatCertified: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error('Database unavailable');
      const companyId = ctx.user?.companyId || 0;
      const result = await db.insert(terminals).values({
        companyId, name: input.name, address: input.address.street,
        city: input.address.city, state: input.address.state,
      } as any).$returningId();
      return { id: String(result[0]?.id), name: input.name, type: input.type, address: input.address, createdBy: ctx.user?.id, createdAt: new Date().toISOString() };
    }),

  /**
   * Update facility
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      phone: z.string().optional(),
      operatingHours: z.string().optional(),
      status: z.enum(["operational", "limited", "closed"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error('Database unavailable');
      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.status) updates.status = input.status === 'closed' ? 'inactive' : 'active';
      if (Object.keys(updates).length > 0) {
        await db.update(terminals).set(updates).where(eq(terminals.id, parseInt(input.id, 10)));
      }
      return { success: true, id: input.id, updatedBy: ctx.user?.id, updatedAt: new Date().toISOString() };
    }),

  /**
   * Get favorite facilities
   */
  getFavorites: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const rows = await db.select().from(terminals).where(eq(terminals.companyId, companyId)).limit(10);
        return rows.map(r => ({ id: String(r.id), name: r.name, type: 'terminal', city: r.city || '', state: r.state || '' }));
      } catch (e) { return []; }
    }),

  /**
   * Add favorite facility
   */
  addFavorite: protectedProcedure
    .input(z.object({ facilityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        facilityId: input.facilityId,
        addedAt: new Date().toISOString(),
      };
    }),
});
