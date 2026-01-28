/**
 * QUICK ACTIONS ROUTER
 * tRPC procedures for quick action shortcuts
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const quickActionsRouter = router({
  list: protectedProcedure.query(async () => [
    { id: "qa1", name: "Create Load", icon: "plus", path: "/loads/new" },
    { id: "qa2", name: "Find Driver", icon: "search", path: "/drivers" },
  ]),

  getFavorites: protectedProcedure.query(async () => [
    { id: "qa1", name: "Create Load", icon: "plus", path: "/loads/new" },
  ]),

  getRecent: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => [
    { id: "qa2", name: "Find Driver", usedAt: "2025-01-23 10:00" },
  ]),
});
