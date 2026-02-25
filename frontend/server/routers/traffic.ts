/**
 * TRAFFIC ROUTER
 * tRPC procedures for traffic conditions
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const trafficRouter = router({
  /**
   * Get traffic incidents for TrafficConditions page
   */
  getIncidents: protectedProcedure
    .query(async () => {
      return [];
    }),

  /**
   * Get construction zones for TrafficConditions page
   */
  getConstruction: protectedProcedure
    .query(async () => {
      return [];
    }),

  /**
   * Get traffic delays for TrafficConditions page
   */
  getDelays: protectedProcedure
    .query(async () => {
      return {
        avgDelay: 0, routes: [],
      };
    }),
});
