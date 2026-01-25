/**
 * CARRIER PACKETS ROUTER
 * tRPC procedures for carrier packet management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const carrierPacketsRouter = router({
  list: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [
    { id: "cp1", carrierId: "c1", carrierName: "ABC Transport", status: "pending", sentAt: "2025-01-22" },
  ]),

  getSummary: protectedProcedure.query(async () => ({ total: 25, pending: 8, completed: 17 })),

  send: protectedProcedure.input(z.object({ carrierId: z.string() })).mutation(async ({ input }) => ({
    success: true, packetId: "packet_123",
  })),
});
