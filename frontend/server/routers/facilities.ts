/**
 * FACILITIES ROUTER
 * tRPC procedures for facility/location management
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
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
    .query(async ({ input }) => {
      const facilities = [
        {
          id: "fac_001",
          name: "Shell Houston Terminal",
          type: "terminal",
          address: "1234 Refinery Rd",
          city: "Houston",
          state: "TX",
          zip: "77001",
          location: { lat: 29.7604, lng: -95.3698 },
          phone: "555-0150",
          operatingHours: "24/7",
          products: ["Gasoline", "Diesel", "Jet Fuel"],
          hazmatCertified: true,
        },
        {
          id: "fac_002",
          name: "Exxon Beaumont Refinery",
          type: "refinery",
          address: "900 Industrial Blvd",
          city: "Beaumont",
          state: "TX",
          zip: "77701",
          location: { lat: 30.0802, lng: -94.1266 },
          phone: "555-0160",
          operatingHours: "24/7",
          products: ["Gasoline", "Diesel", "Crude Oil"],
          hazmatCertified: true,
        },
        {
          id: "fac_003",
          name: "7-Eleven Distribution Center",
          type: "distribution_center",
          address: "5678 Commerce Dr",
          city: "Dallas",
          state: "TX",
          zip: "75201",
          location: { lat: 32.7767, lng: -96.7970 },
          phone: "555-0170",
          operatingHours: "Mon-Sat 6AM-10PM",
          products: ["Gasoline"],
          hazmatCertified: false,
        },
        {
          id: "fac_004",
          name: "",
          type: "yard",
          address: "2000 Trucking Lane",
          city: "Houston",
          state: "TX",
          zip: "77002",
          location: { lat: 29.75, lng: -95.35 },
          phone: "555-0100",
          operatingHours: "24/7",
          products: [],
          hazmatCertified: true,
        },
      ];

      let filtered = facilities;
      if (input.type) filtered = filtered.filter(f => f.type === input.type);
      if (input.state) filtered = filtered.filter(f => f.state === input.state);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(f => 
          f.name.toLowerCase().includes(q) ||
          f.city.toLowerCase().includes(q)
        );
      }

      return {
        facilities: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get facility by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        name: "Shell Houston Terminal",
        type: "terminal",
        address: {
          street: "1234 Refinery Rd",
          city: "Houston",
          state: "TX",
          zip: "77001",
        },
        location: { lat: 29.7604, lng: -95.3698 },
        contact: {
          phone: "555-0150",
          email: "houston@shell-terminal.com",
          dispatchPhone: "555-0151",
        },
        operatingHours: {
          monday: { open: "00:00", close: "23:59" },
          tuesday: { open: "00:00", close: "23:59" },
          wednesday: { open: "00:00", close: "23:59" },
          thursday: { open: "00:00", close: "23:59" },
          friday: { open: "00:00", close: "23:59" },
          saturday: { open: "00:00", close: "23:59" },
          sunday: { open: "00:00", close: "23:59" },
        },
        products: [
          { name: "Unleaded Gasoline", unNumber: "1203" },
          { name: "Premium Gasoline", unNumber: "1203" },
          { name: "Diesel", unNumber: "1202" },
          { name: "Jet Fuel", unNumber: "1863" },
        ],
        capabilities: {
          racks: 4,
          loadingBays: 6,
          avgLoadTime: 45,
          hazmatCertified: true,
          twicRequired: true,
          scaleOnSite: true,
        },
        instructions: {
          checkIn: "Report to guard shack with BOL and driver ID. TWIC card required.",
          loading: "Follow rack assignments. No cell phones in loading area.",
          safety: "PPE required: Hard hat, safety glasses, flame-resistant clothing.",
        },
        amenities: ["Restrooms", "Driver Lounge", "Vending Machines"],
        status: "operational",
      };
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
    .query(async ({ input }) => {
      return [
        {
          id: "fac_001",
          name: "Shell Houston Terminal",
          type: "terminal",
          address: "1234 Refinery Rd, Houston, TX",
          distance: 5.2,
          location: { lat: 29.7604, lng: -95.3698 },
        },
        {
          id: "fac_004",
          name: "",
          type: "yard",
          address: "2000 Trucking Lane, Houston, TX",
          distance: 8.5,
          location: { lat: 29.75, lng: -95.35 },
        },
      ];
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
      return {
        id: `fac_${Date.now()}`,
        ...input,
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
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
      return {
        success: true,
        id: input.id,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get favorite facilities
   */
  getFavorites: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        { id: "fac_001", name: "Shell Houston Terminal", type: "terminal", city: "Houston", state: "TX" },
        { id: "fac_002", name: "Exxon Beaumont Refinery", type: "refinery", city: "Beaumont", state: "TX" },
      ];
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
