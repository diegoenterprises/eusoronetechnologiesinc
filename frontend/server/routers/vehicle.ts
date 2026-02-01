/**
 * VEHICLE ROUTER
 * tRPC procedures for vehicle inspections and management
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vehicles } from "../../drizzle/schema";

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
      return { total: 45, passed: 40, failed: 3, pending: 2, dueThisWeek: 5, defectsOpen: 8, totalThisMonth: 45 };
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

  // Get assigned vehicle for driver
  getAssigned: protectedProcedure.query(async () => ({
    id: "v1",
    unitNumber: "TRK-103",
    year: 2022,
    make: "Peterbilt",
    model: "579",
    vin: "1HGBH41JXMN109186",
    licensePlate: "TX-ABC-1234",
    odometer: 87450,
    fuelLevel: 75,
    status: "active",
  })),

  // Get maintenance history
  getMaintenanceHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async () => ({
      records: [
        { id: "1", type: "Oil Change", date: "2026-01-15", mileage: 85000, cost: 150 },
        { id: "2", type: "Tire Rotation", date: "2026-01-01", mileage: 83500, cost: 75 },
        { id: "3", type: "Brake Inspection", date: "2025-12-15", mileage: 82000, cost: 200 },
      ],
    })),
});
