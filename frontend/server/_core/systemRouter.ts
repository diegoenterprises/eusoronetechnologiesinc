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
});
