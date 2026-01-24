import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

export const auditLogsRouter = router({
  getLogs: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      action: z.string().optional(),
      userId: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      // Return mock data for now - will be replaced with real DB queries
      const logs = [
        { id: "1", action: "login", description: "User logged in", userName: "John Doe", resource: "auth", ipAddress: "192.168.1.1", timestamp: "2025-01-24 08:30:00" },
        { id: "2", action: "create", description: "Created new load #LOAD-12345", userName: "Jane Smith", resource: "loads", ipAddress: "192.168.1.2", timestamp: "2025-01-24 09:15:00" },
        { id: "3", action: "update", description: "Updated driver profile", userName: "Mike Johnson", resource: "drivers", ipAddress: "192.168.1.3", timestamp: "2025-01-24 10:00:00" },
      ];
      return {
        logs,
        totalPages: 1,
        total: logs.length,
      };
    }),

  getUsers: publicProcedure.query(async () => {
    return [
      { id: "1", name: "John Doe" },
      { id: "2", name: "Jane Smith" },
      { id: "3", name: "Mike Johnson" },
    ];
  }),

  getSummary: publicProcedure.query(async () => {
    return {
      totalEvents: 1250,
      todayEvents: 45,
      activeUsers: 12,
      securityEvents: 3,
    };
  }),
});
