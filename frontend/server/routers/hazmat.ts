/**
 * HAZMAT ROUTER
 * tRPC procedures for hazmat shipment management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const hazmatRouter = router({
  getSummary: protectedProcedure.query(async () => ({
    activeShipments: 8,
    totalThisMonth: 45,
    complianceRate: 100,
    topClass: "Class 3 - Flammable Liquids",
    total: 45,
    inTransit: 5,
    loading: 2,
    delivered: 38,
  })),

  getShipments: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => [
    { id: "h1", loadNumber: "LOAD-45920", hazmatClass: "3", unNumber: "UN1203", product: "Gasoline", status: "in_transit" },
  ]),
});
