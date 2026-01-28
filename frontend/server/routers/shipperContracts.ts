/**
 * SHIPPER CONTRACTS ROUTER
 * tRPC procedures for shipper contract management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const shipperContractsRouter = router({
  /**
   * List contracts for ShipperContracts page
   */
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      const contracts = [
        { id: "c1", number: "CONT-2025-001", shipper: "Shell Oil", status: "active", startDate: "2025-01-01", endDate: "2025-12-31", value: 250000 },
        { id: "c2", number: "CONT-2025-002", shipper: "ExxonMobil", status: "active", startDate: "2025-01-15", endDate: "2025-07-15", value: 180000 },
        { id: "c3", number: "CONT-2024-045", shipper: "Chevron", status: "expired", startDate: "2024-01-01", endDate: "2024-12-31", value: 220000 },
      ];
      if (input.status) return contracts.filter(c => c.status === input.status);
      return contracts;
    }),

  /**
   * Get summary for ShipperContracts page
   */
  getSummary: protectedProcedure
    .query(async () => {
      return { total: 12, active: 8, pending: 2, expired: 2, expiringSoon: 3, totalValue: 1250000 };
    }),

  /**
   * Get contract by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        number: "CONT-2025-001",
        shipper: "Shell Oil",
        status: "active",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        value: 250000,
        terms: "Standard freight terms",
        lanes: [
          { origin: "Houston, TX", destination: "Dallas, TX", rate: 2450 },
          { origin: "Beaumont, TX", destination: "Austin, TX", rate: 2800 },
        ],
      };
    }),
});
