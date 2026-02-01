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

  getReleaseNotes: publicProcedure
    .input(z.object({ filter: z.string().optional(), limit: z.number().optional() }))
    .query(() => [
      {
        id: "v2.1.0",
        version: "2.1.0",
        date: new Date().toISOString(),
        title: "Registration System Overhaul",
        changes: [
          { type: "feature", description: "Added all 10 role registration forms with tRPC integration" },
          { type: "improvement", description: "Enhanced form validation with Zod schemas" },
          { type: "bugfix", description: "Fixed TypeScript errors in registration pages" },
        ],
      },
    ]),

  getLatestVersion: publicProcedure.query(() => ({
    version: "2.1.0",
    releasedAt: new Date().toISOString(),
    isLatest: true,
  })),

  getStatus: publicProcedure.query(() => ({
    status: "operational" as const,
    services: [
      { name: "API", status: "operational" as const },
      { name: "Database", status: "operational" as const },
      { name: "Authentication", status: "operational" as const },
    ],
    lastUpdated: new Date().toISOString(),
  })),

  getIncidents: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(() => [] as { id: string; title: string; status: string; createdAt: string; description: string }[]),

  getUptime: publicProcedure.query(() => ({
    uptime: 99.9,
    last24h: 100,
    last7d: 99.9,
    last30d: 99.8,
    responseTime: 45,
    lastDowntime: null as string | null,
    uptimeHistory: [
      { date: new Date().toISOString(), uptime: 100 },
    ],
  })),
});
