import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  getStatus: publicProcedure
    .query(() => ({
      overall: "operational",
      services: [
        { name: "API", status: "operational", latency: 45 },
        { name: "Database", status: "operational", latency: 12 },
        { name: "Authentication", status: "operational", latency: 25 },
        { name: "Storage", status: "operational", latency: 85 },
      ],
      lastUpdated: new Date().toISOString(),
    })),

  getIncidents: publicProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(() => ([
      { id: "inc1", title: "Scheduled Maintenance", status: "resolved", severity: "info", startedAt: "2025-01-20 02:00", resolvedAt: "2025-01-20 04:00" },
    ])),

  getUptime: publicProcedure
    .query(() => ({
      last24h: 100,
      last7d: 99.98,
      last30d: 99.95,
      last90d: 99.92,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  // Additional system procedures
  getLatestVersion: publicProcedure.query(async () => ({ version: "2.5.0", releaseDate: "2025-01-20", required: false })),
  getReleaseNotes: publicProcedure.input(z.object({ version: z.string().optional() })).query(async () => ([
    { version: "2.5.0", date: "2025-01-20", notes: ["New dashboard widgets", "Performance improvements", "Bug fixes"] },
  ])),

  // System health stats
  getHealth: publicProcedure.input(z.object({ timeRange: z.string().optional() }).optional()).query(async () => ({
    overall: "healthy",
    overallStatus: "healthy",
    status: "operational",
    services: [
      { name: "API", status: "operational", uptime: 99.99, latency: 45 },
      { name: "Database", status: "operational", uptime: 99.98, latency: 12 },
      { name: "Cache", status: "operational", uptime: 100, latency: 5 },
    ],
    lastCheck: new Date().toISOString(),
    uptime: 99.95,
    activeUsers: 1250,
    loadAvg: 0.42,
    cpu: { current: 42, avg: 38, peak: 72 },
    memory: { current: 68, avg: 65, peak: 82 },
    disk: { current: 55, used: 275, total: 500 },
    cpuUsage: 42,
    memoryUsage: 68,
    diskUsage: 55,
  })),
  getMetrics: publicProcedure.input(z.object({ period: z.string().optional(), timeRange: z.string().optional() }).optional()).query(async () => ({
    cpu: [42, 45, 38, 52, 48, 44, 41],
    memory: [68, 70, 65, 72, 69, 67, 68],
    disk: [55, 55, 55, 56, 56, 56, 55],
    requests: [1250, 1380, 1420, 1100, 1550, 1620, 1480],
  })),
});
