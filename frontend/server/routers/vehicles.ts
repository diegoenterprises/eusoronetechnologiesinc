/**
 * VEHICLES ROUTER
 * tRPC procedures for vehicle management
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vehicles, drivers } from "../../drizzle/schema";

export const vehiclesRouter = router({
  list: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => [
    { id: "v1", unit: "TRK-101", type: "tanker", status: "active", driver: "Mike Johnson" },
  ]),

  getSummary: protectedProcedure.query(async () => ({
    total: 30,
    active: 25,
    maintenance: 3,
    outOfService: 2,
  })),
});
