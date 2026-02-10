/**
 * HAZMAT ROUTER
 * tRPC procedures for hazmat shipment management
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads } from "../../drizzle/schema";

export const hazmatRouter = router({
  getSummary: protectedProcedure.query(async () => ({ activeShipments: 0, totalThisMonth: 0, complianceRate: 0, topClass: "", total: 0, inTransit: 0, loading: 0, delivered: 0 })),

  getShipments: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => []),
});
