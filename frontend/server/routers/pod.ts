/**
 * POD (Proof of Delivery) ROUTER
 * tRPC procedures for proof of delivery management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const podRouter = router({
  getSummary: protectedProcedure.query(async () => ({
    pending: 5,
    completed: 150,
    avgUploadTime: 15,
  })),

  list: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [
    { id: "p1", loadNumber: "LOAD-45918", status: "completed", uploadedAt: "2025-01-22", signedBy: "John Smith" },
  ]),
});
