/**
 * QUICK ACTIONS ROUTER
 * tRPC procedures for quick action shortcuts
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const quickActionsRouter = router({
  list: protectedProcedure.query(async () => {
    return [
      { id: 'create_load', label: 'Create Load', icon: 'Plus', path: '/loads/create' },
      { id: 'find_loads', label: 'Find Loads', icon: 'Search', path: '/loads/find' },
      { id: 'dispatch', label: 'Dispatch Board', icon: 'LayoutDashboard', path: '/dispatch' },
      { id: 'fleet', label: 'Fleet Overview', icon: 'Truck', path: '/fleet' },
      { id: 'drivers', label: 'Manage Drivers', icon: 'Users', path: '/drivers' },
      { id: 'billing', label: 'Billing', icon: 'CreditCard', path: '/billing' },
      { id: 'reports', label: 'Reports', icon: 'BarChart3', path: '/reports' },
      { id: 'compliance', label: 'Compliance', icon: 'ShieldCheck', path: '/compliance' },
    ];
  }),

  getFavorites: protectedProcedure.query(async () => {
    // User favorites require a dedicated user_favorites table
    return [];
  }),

  getRecent: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => {
    // Recent actions require activity tracking
    return [];
  }),
});
