/**
 * REST STOPS ROUTER
 * tRPC procedures for rest stop information
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const restStopsRouter = router({
  list: protectedProcedure.input(z.object({ route: z.string().optional() })).query(async () => [
    { id: "rs1", name: "Texas Rest Area I-45", mile: 125, amenities: ["restrooms", "parking", "wifi"] },
  ]),

  getNearby: protectedProcedure.input(z.object({ lat: z.number(), lng: z.number() })).query(async () => [
    { id: "rs1", name: "Pilot Flying J", distance: 5.2, parking: 50 },
  ]),
});
