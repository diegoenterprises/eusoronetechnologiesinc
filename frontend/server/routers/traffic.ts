/**
 * TRAFFIC ROUTER
 * tRPC procedures for traffic conditions
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const trafficRouter = router({
  /**
   * Get traffic incidents for TrafficConditions page
   */
  getIncidents: protectedProcedure
    .query(async () => {
      return [
        { id: "i1", type: "accident", location: "I-10 W near Katy", severity: "major", lanes: "2 of 4 closed", reportedAt: "2025-01-23 09:15", estimatedClear: "12:00 PM" },
        { id: "i2", type: "stalled_vehicle", location: "US-290 E near Cypress", severity: "minor", lanes: "Right shoulder", reportedAt: "2025-01-23 10:30", estimatedClear: "11:00 AM" },
      ];
    }),

  /**
   * Get construction zones for TrafficConditions page
   */
  getConstruction: protectedProcedure
    .query(async () => {
      return [
        { id: "c1", location: "I-45 N between FM 1960 and Hardy Toll", severity: "moderate", startDate: "2025-01-15", endDate: "2025-03-15", restrictions: "Lane closures 9 PM - 5 AM" },
        { id: "c2", location: "SH 99 Grand Parkway", severity: "minor", startDate: "2025-01-01", endDate: "2025-06-30", restrictions: "Reduced speed limits" },
      ];
    }),

  /**
   * Get traffic delays for TrafficConditions page
   */
  getDelays: protectedProcedure
    .query(async () => {
      return {
        avgDelay: 22,
        routes: [
          { id: "d1", route: "I-10 W", from: "Downtown Houston", to: "Katy", normalTime: 25, currentTime: 55, delay: 30, severity: "major" },
          { id: "d2", route: "I-45 N", from: "Downtown Houston", to: "The Woodlands", normalTime: 35, currentTime: 50, delay: 15, severity: "moderate" },
        ],
      };
    }),
});
