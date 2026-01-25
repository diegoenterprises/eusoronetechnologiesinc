/**
 * PREFERENCES ROUTER
 * tRPC procedures for user preferences
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const preferencesRouter = router({
  update: protectedProcedure.input(z.object({ key: z.string(), value: z.any() })).mutation(async ({ input }) => ({
    success: true,
    key: input.key,
  })),

  reset: protectedProcedure.mutation(async () => ({
    success: true,
  })),
});
