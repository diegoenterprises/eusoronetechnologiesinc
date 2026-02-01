/**
 * FACILITY ROUTER
 * tRPC procedures for facility management
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { terminals, loads } from "../../drizzle/schema";

export const facilityRouter = router({
  getStats: protectedProcedure.query(async () => ({
    totalBays: 12,
    availableBays: 4,
    todayShipments: 28,
    staffOnDuty: 8,
  })),

  getBays: protectedProcedure.query(async () => [
    { id: "b1", number: 1, status: "loading", truck: "T-1234", startTime: "08:30" },
    { id: "b2", number: 2, status: "available", truck: null, startTime: null },
    { id: "b3", number: 3, status: "loading", truck: "T-5678", startTime: "09:15" },
  ]),

  getShipments: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [
    { id: "s1", loadNumber: "LOAD-45920", status: "loading", bay: 1, eta: "10:30" },
    { id: "s2", loadNumber: "LOAD-45921", status: "queued", bay: null, eta: "11:00" },
  ]),

  getStaff: protectedProcedure.query(async () => [
    { id: "st1", name: "John Smith", role: "loader", status: "on_duty", shift: "day" },
    { id: "st2", name: "Mary Johnson", role: "supervisor", status: "on_duty", shift: "day" },
  ]),
});
