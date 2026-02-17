/**
 * WIDGETS ROUTER — DB-BACKED DASHBOARD WIDGET MANAGEMENT
 * 
 * Provides real CRUD for:
 *  • Widget catalog (dashboard_widgets table — 153 seeded widgets)
 *  • User layouts (dashboard_layouts table — grid positions per user/role)
 *  • Widget configs (widget_configurations table — per-user settings)
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { dashboardWidgets, dashboardLayouts, widgetConfigurations } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export const widgetsRouter = router({
  /**
   * Get all widgets available for the user's role from DB
   */
  getWidgetCatalog: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const role = ctx.user?.role || 'SHIPPER';
    if (!db) return { items: [] };
    try {
      const all = await db.select().from(dashboardWidgets).where(eq(dashboardWidgets.isActive, true));
      const filtered = all.filter(w => {
        const roles = w.rolesAllowed as string[] | null;
        if (!roles) return true;
        return roles.includes(role) || roles.includes('ADMIN') || role === 'ADMIN' || role === 'SUPER_ADMIN';
      });
      return { items: filtered };
    } catch (e) {
      console.error('[Widgets] getWidgetCatalog error:', e);
      return { items: [] };
    }
  }),

  /**
   * Get user's saved dashboard layout from DB
   * Falls back to null if none saved (frontend uses default)
   */
  getMyLayout: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userId = ctx.user?.id;
    const role = ctx.user?.role || 'SHIPPER';
    if (!db || !userId) return { layout: null, role };
    try {
      const [saved] = await db.select()
        .from(dashboardLayouts)
        .where(and(eq(dashboardLayouts.userId, userId), eq(dashboardLayouts.role, role)))
        .limit(1);
      return {
        layout: saved?.layoutJson || null,
        role,
        layoutId: saved?.id || null,
        name: saved?.name || null,
      };
    } catch (e) {
      console.error('[Widgets] getMyLayout error:', e);
      return { layout: null, role };
    }
  }),

  /**
   * Save user's dashboard layout to DB (upsert)
   */
  saveLayout: protectedProcedure
    .input(z.object({
      layout: z.array(z.object({
        widgetId: z.string(),
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      })),
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user?.id;
      const role = ctx.user?.role || 'SHIPPER';
      if (!db || !userId) return { success: false, error: 'No database connection' };
      try {
        const [existing] = await db.select({ id: dashboardLayouts.id })
          .from(dashboardLayouts)
          .where(and(eq(dashboardLayouts.userId, userId), eq(dashboardLayouts.role, role)))
          .limit(1);

        if (existing) {
          await db.update(dashboardLayouts)
            .set({
              layoutJson: input.layout,
              name: input.name || null,
            })
            .where(eq(dashboardLayouts.id, existing.id));
        } else {
          await db.insert(dashboardLayouts).values({
            userId,
            role,
            layoutJson: input.layout,
            name: input.name || 'Default',
            isDefault: false,
          });
        }
        return { success: true };
      } catch (e) {
        console.error('[Widgets] saveLayout error:', e);
        return { success: false, error: String(e) };
      }
    }),

  /**
   * Reset layout — delete user's custom layout so frontend falls back to defaults
   */
  resetLayout: protectedProcedure
    .input(z.object({}).optional())
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      const userId = ctx.user?.id;
      const role = ctx.user?.role || 'SHIPPER';
      if (!db || !userId) return { success: false };
      try {
        await db.delete(dashboardLayouts)
          .where(and(eq(dashboardLayouts.userId, userId), eq(dashboardLayouts.role, role)));
        return { success: true };
      } catch (e) {
        console.error('[Widgets] resetLayout error:', e);
        return { success: false };
      }
    }),

  /**
   * Get per-widget configurations for current user
   */
  getWidgetConfig: protectedProcedure
    .input(z.object({ widgetId: z.number() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user?.id;
      if (!db || !userId) return { configs: [] };
      try {
        if (input?.widgetId) {
          const [config] = await db.select()
            .from(widgetConfigurations)
            .where(and(eq(widgetConfigurations.userId, userId), eq(widgetConfigurations.widgetId, input.widgetId)))
            .limit(1);
          return { configs: config ? [config] : [] };
        }
        const configs = await db.select()
          .from(widgetConfigurations)
          .where(eq(widgetConfigurations.userId, userId));
        return { configs };
      } catch (e) {
        console.error('[Widgets] getWidgetConfig error:', e);
        return { configs: [] };
      }
    }),

  /**
   * Save per-widget configuration (upsert)
   */
  saveWidgetConfig: protectedProcedure
    .input(z.object({
      widgetId: z.number(),
      settings: z.record(z.string(), z.unknown()).optional(),
      isVisible: z.boolean().optional(),
      refreshInterval: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user?.id;
      if (!db || !userId) return { success: false };
      try {
        const [existing] = await db.select({ id: widgetConfigurations.id })
          .from(widgetConfigurations)
          .where(and(eq(widgetConfigurations.userId, userId), eq(widgetConfigurations.widgetId, input.widgetId)))
          .limit(1);

        if (existing) {
          await db.update(widgetConfigurations)
            .set({
              settings: input.settings || {},
              isVisible: input.isVisible ?? true,
              refreshInterval: input.refreshInterval ?? 60,
            })
            .where(eq(widgetConfigurations.id, existing.id));
        } else {
          await db.insert(widgetConfigurations).values({
            userId,
            widgetId: input.widgetId,
            settings: input.settings || {},
            isVisible: input.isVisible ?? true,
            refreshInterval: input.refreshInterval ?? 60,
          });
        }
        return { success: true };
      } catch (e) {
        console.error('[Widgets] saveWidgetConfig error:', e);
        return { success: false };
      }
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      category: z.enum(["analytics", "operations", "financial", "communication", "productivity", "safety", "compliance", "performance", "planning", "tracking", "reporting", "management", "system"]).default("analytics"),
      componentPath: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const widgetKey = `custom_${input.name.toLowerCase().replace(/\s+/g, "_")}_${Date.now().toString(36)}`;
      const [result] = await db.insert(dashboardWidgets).values({
        widgetKey,
        name: input.name,
        description: input.description,
        category: input.category,
        componentPath: input.componentPath,
        isActive: true,
      }).$returningId();
      return { success: true, id: result.id, widgetKey };
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const updates: Record<string, any> = {};
      if (input.name) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.isActive !== undefined) updates.isActive = input.isActive;
      if (Object.keys(updates).length > 0) {
        await db.update(dashboardWidgets).set(updates).where(eq(dashboardWidgets.id, input.id));
      }
      return { success: true, id: input.id };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      await db.update(dashboardWidgets).set({ isActive: false }).where(eq(dashboardWidgets.id, input.id));
      return { success: true, id: input.id };
    }),
  getWidgets: protectedProcedure.query(async () => ({ items: [] })),
  getWidgetTemplates: protectedProcedure.query(async () => ({ templates: [] })),
  getWidgetSharing: protectedProcedure.query(async () => ({ shared: [] })),
  getWidgetDataSources: protectedProcedure.query(async () => ({ sources: [] })),
  getWidgetBuilder: protectedProcedure.query(async () => ({})),
  getWidgetThemes: protectedProcedure.query(async () => ({ themes: [] })),
  getWidgetLayouts: protectedProcedure.query(async () => ({ layouts: [] })),
  getWidgetReports: protectedProcedure.query(async () => ({ reports: [] })),
  getImportExport: protectedProcedure.query(async () => ({ items: [] })),
  getCatalog: protectedProcedure.query(async () => ({ items: [] })),
  getConfiguration: protectedProcedure.query(async () => ({ items: [] })),
  getCustomization: protectedProcedure.query(async () => ({ items: [] })),
  getDataConnections: protectedProcedure.query(async () => ({ items: [] })),
  getDeveloperTools: protectedProcedure.query(async () => ({ items: [] })),
  getEmbedOptions: protectedProcedure.query(async () => ({ items: [] })),
  getGallery: protectedProcedure.query(async () => ({ items: [] })),
  getLayoutEditor: protectedProcedure.query(async () => ({ items: [] })),
  getMarketplace: protectedProcedure.query(async () => ({ items: [] })),
  getMyWidgets: protectedProcedure.query(async () => ({ items: [] })),
  getPerformance: protectedProcedure.query(async () => ({ items: [] })),
  getPermissions: protectedProcedure.query(async () => ({ items: [] })),
  getPresets: protectedProcedure.query(async () => ({ items: [] })),
  getPreview: protectedProcedure.query(async () => ({ items: [] })),
  getPublishing: protectedProcedure.query(async () => ({ items: [] })),
  getRealtimeData: protectedProcedure.query(async () => ({ items: [] })),
  getScheduling: protectedProcedure.query(async () => ({ items: [] })),
  getSettings: protectedProcedure.query(async () => ({ items: [] })),
  getSharing: protectedProcedure.query(async () => ({ items: [] })),
  getStyleEditor: protectedProcedure.query(async () => ({ items: [] })),
  getTemplateLibrary: protectedProcedure.query(async () => ({ items: [] })),
  getUsageAnalytics: protectedProcedure.query(async () => ({ items: [] })),
  getVersionHistory: protectedProcedure.query(async () => ({ items: [] })),
});
