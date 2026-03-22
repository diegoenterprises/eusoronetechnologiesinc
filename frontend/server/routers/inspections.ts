/**
 * INSPECTIONS ROUTER
 * tRPC procedures for Pre-Trip Inspections and DVIR
 * Per 49 CFR 396.11-396.13
 * PRODUCTION-READY: All data from database
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { inspections, vehicles, users } from "../../drizzle/schema";
import { fireGamificationEvent } from "../services/gamificationDispatcher";
import { unsafeCast } from "../_core/types/unsafe";

const inspectionItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  name: z.string(),
  status: z.enum(["pass", "fail", "na"]),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
});

const inspectionSchema = z.object({
  vehicleId: z.string(),
  trailerId: z.string().optional(),
  type: z.enum(["pre_trip", "post_trip", "dvir"]),
  odometer: z.number(),
  items: z.array(inspectionItemSchema),
  defectsFound: z.boolean(),
  defectsCorrected: z.boolean().optional(),
  safeToOperate: z.boolean(),
  driverSignature: z.string(),
  notes: z.string().optional(),
});

export const inspectionsRouter = router({
  /**
   * Get inspection checklist template
   */
  getTemplate: protectedProcedure
    .input(z.object({ type: z.enum(["pre_trip", "post_trip", "dvir"]) }))
    .query(async ({ input }) => {
      const categories = [
        {
          id: "engine",
          name: "Engine Compartment",
          items: [
            { id: "oil_level", name: "Oil Level", required: true },
            { id: "coolant_level", name: "Coolant Level", required: true },
            { id: "belts_hoses", name: "Belts and Hoses", required: true },
            { id: "leaks", name: "Leaks (oil, coolant, fuel)", required: true },
            { id: "steering_fluid", name: "Power Steering Fluid", required: true },
          ],
        },
        {
          id: "cab",
          name: "Cab/Interior",
          items: [
            { id: "gauges", name: "All Gauges Working", required: true },
            { id: "horn", name: "Horn", required: true },
            { id: "windshield", name: "Windshield (clean, no cracks)", required: true },
            { id: "wipers", name: "Wipers and Washers", required: true },
            { id: "mirrors", name: "Mirrors", required: true },
            { id: "seatbelt", name: "Seat Belt", required: true },
            { id: "fire_extinguisher", name: "Fire Extinguisher", required: true },
            { id: "triangles", name: "Emergency Triangles", required: true },
          ],
        },
        {
          id: "lights",
          name: "Lights",
          items: [
            { id: "headlights", name: "Headlights (high/low)", required: true },
            { id: "taillights", name: "Taillights", required: true },
            { id: "brake_lights", name: "Brake Lights", required: true },
            { id: "turn_signals", name: "Turn Signals", required: true },
            { id: "hazards", name: "Hazard Lights", required: true },
            { id: "clearance", name: "Clearance/Marker Lights", required: true },
          ],
        },
        {
          id: "brakes",
          name: "Brakes",
          items: [
            { id: "service_brakes", name: "Service Brakes", required: true },
            { id: "parking_brake", name: "Parking Brake", required: true },
            { id: "air_pressure", name: "Air Pressure (90-120 psi)", required: true },
            { id: "air_leaks", name: "Air Leaks", required: true },
            { id: "brake_lines", name: "Brake Lines/Hoses", required: true },
          ],
        },
        {
          id: "tires",
          name: "Tires and Wheels",
          items: [
            { id: "tread_depth", name: "Tread Depth (4/32\" steer, 2/32\" drive)", required: true },
            { id: "tire_pressure", name: "Tire Pressure", required: true },
            { id: "tire_condition", name: "Tire Condition (no cuts, bulges)", required: true },
            { id: "lug_nuts", name: "Lug Nuts Tight", required: true },
            { id: "wheel_seals", name: "Wheel Seals (no leaks)", required: true },
          ],
        },
        {
          id: "coupling",
          name: "Coupling Devices",
          items: [
            { id: "fifth_wheel", name: "Fifth Wheel Secure", required: true },
            { id: "kingpin", name: "Kingpin Locked", required: true },
            { id: "air_lines", name: "Air Lines Connected", required: true },
            { id: "electrical", name: "Electrical Connection", required: true },
            { id: "safety_chains", name: "Safety Chains/Cables", required: false },
          ],
        },
        {
          id: "cargo",
          name: "Cargo Area",
          items: [
            { id: "securement", name: "Cargo Secured", required: true },
            { id: "doors", name: "Doors/Hatches Secured", required: true },
            { id: "placards", name: "Placards (if hazmat)", required: false },
          ],
        },
        {
          id: "hazmat",
          name: "Hazmat (if applicable)",
          items: [
            { id: "placards_correct", name: "Correct Placards Displayed", required: false },
            { id: "shipping_papers", name: "Shipping Papers Available", required: false },
            { id: "erg", name: "ERG Available", required: false },
            { id: "spill_kit", name: "Spill Kit", required: false },
          ],
        },
      ];

      return { type: input.type, categories };
    }),

  /**
   * Submit completed inspection — writes to inspections table
   */
  submit: protectedProcedure
    .input(inspectionSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
      // Resolve companyId
      let companyId = 0;
      try { const [u] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1); companyId = u?.companyId || 0; } catch {}

      const result = await db.insert(inspections).values({
        vehicleId: parseInt(input.vehicleId, 10),
        driverId: userId,
        companyId,
        type: unsafeCast(input.type),
        status: input.defectsFound ? (input.safeToOperate ? "passed" : "failed") : "passed",
        defectsFound: input.items.filter(i => i.status === "fail").length,
        oosViolation: !input.safeToOperate,
        completedAt: new Date(),
        location: input.notes || null,
      } as never);
      const insertedId = unsafeCast(result).insertId || unsafeCast(result)[0]?.insertId || 0;

      // WS-E2E-005: Fire safety_inspection_passed gamification event
      if (input.safeToOperate) {
        const uid = typeof userId === 'number' ? userId : parseInt(String(userId), 10) || 0;
        if (uid) fireGamificationEvent({ userId: uid, type: "safety_inspection_passed", value: 1 });
      }

      // Auto-index inspection for AI semantic search (fire-and-forget)
      try {
        const { indexComplianceRecord } = await import("../services/embeddings/aiTurbocharge");
        const defects = input.items.filter((i: any) => i.status === "fail").map((i: any) => i.label || i.id).join(", ");
        indexComplianceRecord({ id: insertedId, type: `inspection_${input.type}`, description: `Vehicle ${input.vehicleId} ${input.type} inspection. ${input.defectsFound ? `Defects: ${defects}. Safe: ${input.safeToOperate}` : "No defects"}`, status: input.safeToOperate ? "passed" : "failed", severity: input.safeToOperate ? "minor" : "major" });
      } catch {}

      return {
        id: String(insertedId),
        status: "submitted",
        submittedAt: new Date().toISOString(),
        submittedBy: ctx.user?.id,
        vehicleId: input.vehicleId,
        type: input.type,
        defectsFound: input.defectsFound,
        safeToOperate: input.safeToOperate,
      };
    }),

  /**
   * Get inspection history for a vehicle — real DB query
   */
  getHistory: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
      limit: z.number().default(10),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const results = await db.select().from(inspections)
          .where(eq(inspections.vehicleId, parseInt(input.vehicleId, 10)))
          .orderBy(desc(inspections.createdAt))
          .limit(input.limit);
        return results.map(r => ({
          id: String(r.id),
          type: r.type,
          date: r.completedAt?.toISOString() || r.createdAt?.toISOString() || "",
          driver: String(r.driverId),
          defectsFound: (r.defectsFound || 0) > 0,
          defectsCorrected: false,
          safeToOperate: !r.oosViolation,
          status: r.status,
        }));
      } catch { return []; }
    }),

  /**
   * Get defects requiring attention — inspections with defects > 0
   */
  getOpenDefects: protectedProcedure
    .input(z.object({ vehicleId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
      let companyId = 0;
      try { const [u] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1); companyId = u?.companyId || 0; } catch {}
      try {
        const filters: any[] = [eq(inspections.companyId, companyId), sql`${inspections.defectsFound} > 0`];
        if (input.vehicleId) filters.push(eq(inspections.vehicleId, parseInt(input.vehicleId, 10)));
        const results = await db.select().from(inspections).where(and(...filters)).orderBy(desc(inspections.createdAt)).limit(20);
        return results.map(r => ({
          id: String(r.id),
          vehicleId: String(r.vehicleId),
          inspectionId: String(r.id),
          category: "general",
          item: "Defect found",
          description: r.location || "Inspection defect",
          severity: r.oosViolation ? "major" : "minor",
          reportedAt: r.createdAt?.toISOString() || "",
          status: r.status === "failed" ? "pending_repair" : "resolved",
        }));
      } catch { return []; }
    }),

  // Additional inspection procedures — real DB queries
  getRecent: protectedProcedure.input(z.object({ limit: z.number().optional(), type: z.string().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
    let companyId = 0;
    try { const [u] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1); companyId = u?.companyId || 0; } catch {}
    try {
      const filters: any[] = [eq(inspections.companyId, companyId)];
      if (input.type) filters.push(eq(inspections.type, unsafeCast(input.type)));
      const results = await db.select().from(inspections).where(and(...filters)).orderBy(desc(inspections.createdAt)).limit(input.limit || 10);
      return results.map(r => ({ id: String(r.id), vehicleId: String(r.vehicleId), type: r.type, date: r.completedAt?.toISOString()?.split("T")[0] || "", status: r.status || "pending" }));
    } catch { return []; }
  }),
  getPrevious: protectedProcedure.input(z.object({ vehicleId: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
    try {
      const filters: any[] = [eq(inspections.driverId, userId)];
      if (input?.vehicleId) filters.push(eq(inspections.vehicleId, parseInt(input.vehicleId, 10)));
      const results = await db.select().from(inspections).where(and(...filters)).orderBy(desc(inspections.createdAt)).limit(5);
      return results.map(r => ({ id: String(r.id), type: r.type, date: r.completedAt?.toISOString()?.split("T")[0] || "", status: r.status || "pending", defects: r.defectsFound || 0 }));
    } catch { return []; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // DVIR — Driver Vehicle Inspection Reports (49 CFR 396.11)
  // ═══════════════════════════════════════════════════════════════════════════

  createDVIR: protectedProcedure
    .input(z.object({
      vehicleId: z.number(),
      reportType: z.enum(["pre_trip", "post_trip", "en_route"]),
      odometerMiles: z.number().optional(),
      overallCondition: z.enum(["satisfactory", "defects_noted", "out_of_service"]),
      defects: z.array(z.object({
        category: z.string(),
        description: z.string(),
        severity: z.enum(["minor", "major", "out_of_service"]).default("minor"),
        photoUrl: z.string().optional(),
      })).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };
      const driverId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
      try {
        const [result] = await db.execute(sql`
          INSERT INTO dvir_reports (vehicleId, driverId, reportType, reportDate, odometerMiles, overallCondition, defectsFound, defects, status, companyId)
          VALUES (${input.vehicleId}, ${driverId}, ${input.reportType}, CURDATE(), ${input.odometerMiles || null},
            ${input.overallCondition}, ${input.defects.length > 0 ? 1 : 0}, ${JSON.stringify(input.defects)},
            'submitted', ${ctx.user?.companyId || null})
        `);
        const dvirId = (result as any).insertId;

        // Insert individual defect items
        for (const defect of input.defects) {
          await db.execute(sql`
            INSERT INTO dvir_defect_items (dvirId, category, description, severity, photoUrl)
            VALUES (${dvirId}, ${defect.category}, ${defect.description}, ${defect.severity}, ${defect.photoUrl || null})
          `);
        }

        return { success: true, dvirId, reportType: input.reportType, defectsCount: input.defects.length };
      } catch (e) { return { success: false, error: (e as Error).message }; }
    }),

  getDVIRHistory: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const driverId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
      try {
        const [rows] = await db.execute(sql`
          SELECT d.*, v.unitNumber, v.make, v.model
          FROM dvir_reports d
          LEFT JOIN vehicles v ON v.id = d.vehicleId
          WHERE d.driverId = ${driverId}
            ${input.vehicleId ? sql`AND d.vehicleId = ${input.vehicleId}` : sql``}
          ORDER BY d.createdAt DESC
          LIMIT ${input.limit}
        `) as any;
        return rows || [];
      } catch { return []; }
    }),

  reviewDVIR: protectedProcedure
    .input(z.object({
      dvirId: z.number(),
      mechanicNotes: z.string().optional(),
      repairsRequired: z.boolean().default(false),
      repairsCompleted: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const mechanicId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
      try {
        await db.execute(sql`
          UPDATE dvir_reports
          SET mechanicReview = 1, mechanicId = ${mechanicId}, mechanicSignedAt = NOW(),
              mechanicNotes = ${input.mechanicNotes || null},
              repairsRequired = ${input.repairsRequired ? 1 : 0},
              repairsCompleted = ${input.repairsCompleted ? 1 : 0},
              status = ${input.repairsCompleted ? 'repaired' : input.repairsRequired ? 'reviewed' : 'reviewed'}
          WHERE id = ${input.dvirId}
        `);
        return { success: true };
      } catch { return { success: false }; }
    }),

  // DVIR defect categories per 49 CFR 396.11(a)(1)
  getDVIRCategories: protectedProcedure.query(() => {
    return [
      { id: "air_compressor", label: "Air Compressor", group: "engine" },
      { id: "air_lines", label: "Air Lines", group: "brakes" },
      { id: "battery", label: "Battery", group: "electrical" },
      { id: "body", label: "Body", group: "exterior" },
      { id: "brake_accessories", label: "Brake Accessories", group: "brakes" },
      { id: "brakes", label: "Brakes (Service/Parking)", group: "brakes" },
      { id: "coupling_devices", label: "Coupling Devices", group: "trailer" },
      { id: "defroster_heater", label: "Defroster/Heater", group: "cab" },
      { id: "drive_line", label: "Drive Line", group: "drivetrain" },
      { id: "engine", label: "Engine", group: "engine" },
      { id: "exhaust", label: "Exhaust", group: "engine" },
      { id: "fifth_wheel", label: "Fifth Wheel", group: "trailer" },
      { id: "fluid_levels", label: "Fluid Levels", group: "engine" },
      { id: "frame_assembly", label: "Frame and Assembly", group: "chassis" },
      { id: "front_axle", label: "Front Axle", group: "chassis" },
      { id: "fuel_tanks", label: "Fuel Tanks", group: "engine" },
      { id: "horn", label: "Horn", group: "safety" },
      { id: "lights_head", label: "Headlights", group: "lights" },
      { id: "lights_stop", label: "Stop Lights", group: "lights" },
      { id: "lights_tail", label: "Tail Lights", group: "lights" },
      { id: "lights_turn", label: "Turn Indicators", group: "lights" },
      { id: "lights_clearance", label: "Clearance Lights", group: "lights" },
      { id: "mirrors", label: "Mirrors", group: "cab" },
      { id: "muffler", label: "Muffler", group: "engine" },
      { id: "oil_pressure", label: "Oil Pressure", group: "engine" },
      { id: "radiator", label: "Radiator", group: "engine" },
      { id: "reflectors", label: "Reflectors", group: "safety" },
      { id: "safety_equipment", label: "Safety Equipment (triangles, extinguisher)", group: "safety" },
      { id: "springs", label: "Suspension Springs", group: "chassis" },
      { id: "steering", label: "Steering", group: "chassis" },
      { id: "tires", label: "Tires", group: "wheels" },
      { id: "transmission", label: "Transmission", group: "drivetrain" },
      { id: "wheels_rims", label: "Wheels and Rims", group: "wheels" },
      { id: "windows", label: "Windows", group: "cab" },
      { id: "windshield_wipers", label: "Windshield Wipers", group: "cab" },
    ];
  }),
});
