/**
 * VEHICLE ROUTER
 * tRPC procedures for vehicle inspections and management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const vehicleRouter = router({
  /**
   * Get inspections for VehicleInspections page
   */
  getInspections: protectedProcedure
    .input(z.object({ filter: z.string().optional(), search: z.string().optional() }))
    .query(async ({ input }) => {
      const inspections = [
        { id: "i1", vehicle: "TRK-101", type: "annual", date: "2025-01-20", result: "pass", inspector: "John Smith", nextDue: "2026-01-20" },
        { id: "i2", vehicle: "TRK-102", type: "pre-trip", date: "2025-01-23", result: "pass", inspector: "Mike Johnson", nextDue: null },
        { id: "i3", vehicle: "TRK-103", type: "annual", date: "2024-12-15", result: "fail", inspector: "Sarah Williams", nextDue: "2025-01-15" },
      ];
      let filtered = inspections;
      if (input.filter && input.filter !== "all") filtered = filtered.filter(i => i.result === input.filter);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(i => i.vehicle.toLowerCase().includes(q));
      }
      return filtered;
    }),

  /**
   * Get inspection stats for VehicleInspections page
   */
  getInspectionStats: protectedProcedure
    .query(async () => {
      return { total: 45, passed: 40, failed: 3, pending: 2, dueThisWeek: 5 };
    }),

  /**
   * Get inspections due soon
   */
  getInspectionsDue: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(5) }))
    .query(async () => {
      return [
        { id: "d1", vehicle: "TRK-103", type: "annual", dueDate: "2025-01-25", daysRemaining: 2 },
        { id: "d2", vehicle: "TRK-105", type: "quarterly", dueDate: "2025-01-28", daysRemaining: 5 },
      ];
    }),
});
