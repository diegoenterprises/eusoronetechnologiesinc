/**
 * SCALES ROUTER
 * tRPC procedures for weigh station information
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const scalesRouter = router({
  list: protectedProcedure.input(z.object({ state: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => [
    { id: "s1", name: "I-45 Weigh Station", mile: 85, status: "open", prepassEnabled: true },
  ]),

  getNearby: protectedProcedure.input(z.object({ lat: z.number().optional(), lng: z.number().optional(), limit: z.number().optional() })).query(async () => [
    { id: "s1", name: "I-45 Weigh Station", distance: 12.5, status: "open" },
  ]),
});
