/**
 * BOL ROUTER
 * tRPC procedures for Bill of Lading management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const bolRouter = router({
  /**
   * List BOLs
   */
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      const bols = [
        { id: "bol_001", number: "BOL-2025-0234", loadNumber: "LOAD-45920", shipper: "Shell Oil", carrier: "ABC Transport", status: "completed", createdAt: "2025-01-23" },
        { id: "bol_002", number: "BOL-2025-0235", loadNumber: "LOAD-45918", shipper: "ExxonMobil", carrier: "FastHaul LLC", status: "in_transit", createdAt: "2025-01-23" },
        { id: "bol_003", number: "BOL-2025-0236", loadNumber: "LOAD-45925", shipper: "Chevron", carrier: "SafeHaul", status: "pending", createdAt: "2025-01-24" },
      ];
      if (input.status) {
        return bols.filter(b => b.status === input.status);
      }
      return bols;
    }),

  /**
   * Get BOL summary
   */
  getSummary: protectedProcedure
    .query(async () => {
      return {
        total: 156,
        pending: 8,
        inTransit: 12,
        completed: 136,
        thisWeek: 24,
      };
    }),

  /**
   * Get BOL by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        number: "BOL-2025-0234",
        loadNumber: "LOAD-45920",
        shipper: { name: "Shell Oil Company", address: "1234 Refinery Rd, Houston, TX" },
        carrier: { name: "ABC Transport LLC", mc: "MC-987654" },
        consignee: { name: "Fuel Depot Dallas", address: "5678 Industrial Blvd, Dallas, TX" },
        product: "Unleaded Gasoline",
        quantity: 8500,
        unit: "gallons",
        status: "completed",
        createdAt: "2025-01-23T08:00:00Z",
        deliveredAt: "2025-01-23T16:30:00Z",
      };
    }),

  /**
   * Create BOL
   */
  create: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      shipperId: z.string(),
      carrierId: z.string(),
      consigneeId: z.string(),
      product: z.string(),
      quantity: z.number(),
      unit: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        id: `bol_${Date.now()}`,
        number: `BOL-2025-${Math.floor(Math.random() * 9000) + 1000}`,
      };
    }),
});
