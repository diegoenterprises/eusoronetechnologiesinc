/**
 * CONVOY ROUTER - Multi-vehicle coordination for oversize loads
 */

import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { convoys, locationHistory, users, escortAssignments, loads } from "../../drizzle/schema";
import { emitConvoyFormed, emitConvoyUpdate, emitEscortJobAssigned, emitEscortJobStarted, emitEscortJobCompleted } from "../_core/websocket";

export const convoyRouter = router({
  // Create a convoy
  createConvoy: protectedProcedure.input(z.object({
    loadId: z.number(),
    routeId: z.number().optional(),
    leadUserId: z.number(),
    loadUserId: z.number(),
    rearUserId: z.number().optional(),
    targetLeadDistanceMeters: z.number().default(800),
    targetRearDistanceMeters: z.number().default(500),
    maxSpeedMph: z.number().default(45),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [convoy] = await db.insert(convoys).values({
      loadId: input.loadId,
      routeId: input.routeId,
      leadUserId: input.leadUserId,
      loadUserId: input.loadUserId,
      rearUserId: input.rearUserId,
      status: "forming",
      targetLeadDistanceMeters: input.targetLeadDistanceMeters,
      targetRearDistanceMeters: input.targetRearDistanceMeters,
      maxSpeedMph: input.maxSpeedMph,
    }).$returningId();

    // Auto-create escort assignments for lead/rear users linked to this convoy
    const [load] = await db.select({ driverId: loads.driverId, catalystId: loads.catalystId })
      .from(loads).where(eq(loads.id, input.loadId)).limit(1);

    // Lead escort assignment (always present)
    const [existingLead] = await db.select({ id: escortAssignments.id })
      .from(escortAssignments)
      .where(and(
        eq(escortAssignments.loadId, input.loadId),
        eq(escortAssignments.escortUserId, input.leadUserId),
      )).limit(1);
    if (existingLead) {
      await db.update(escortAssignments)
        .set({ convoyId: convoy.id, position: "lead" })
        .where(eq(escortAssignments.id, existingLead.id));
    } else {
      await db.insert(escortAssignments).values({
        loadId: input.loadId,
        escortUserId: input.leadUserId,
        convoyId: convoy.id,
        position: "lead",
        status: "accepted",
        driverUserId: load?.driverId || null,
        carrierUserId: load?.catalystId || null,
      });
    }

    // Rear escort assignment (if present)
    if (input.rearUserId) {
      const [existingRear] = await db.select({ id: escortAssignments.id })
        .from(escortAssignments)
        .where(and(
          eq(escortAssignments.loadId, input.loadId),
          eq(escortAssignments.escortUserId, input.rearUserId),
        )).limit(1);
      if (existingRear) {
        await db.update(escortAssignments)
          .set({ convoyId: convoy.id, position: "chase" })
          .where(eq(escortAssignments.id, existingRear.id));
      } else {
        await db.insert(escortAssignments).values({
          loadId: input.loadId,
          escortUserId: input.rearUserId,
          convoyId: convoy.id,
          position: "chase",
          status: "accepted",
          driverUserId: load?.driverId || null,
          carrierUserId: load?.catalystId || null,
        });
      }
    }

    // Emit convoy formed event
    emitConvoyFormed({
      convoyId: convoy.id,
      loadId: input.loadId,
      status: "forming",
      leadUserId: input.leadUserId,
      rearUserId: input.rearUserId,
      loadUserId: input.loadUserId,
      timestamp: new Date().toISOString(),
    });

    // Emit escort assignment events for lead
    emitEscortJobAssigned({
      assignmentId: 0,
      loadId: input.loadId,
      escortUserId: input.leadUserId,
      position: "lead",
      status: "accepted",
      convoyId: convoy.id,
      driverUserId: load?.driverId || undefined,
      carrierUserId: load?.catalystId || undefined,
      timestamp: new Date().toISOString(),
    });

    // Emit escort assignment event for rear if present
    if (input.rearUserId) {
      emitEscortJobAssigned({
        assignmentId: 0,
        loadId: input.loadId,
        escortUserId: input.rearUserId,
        position: "chase",
        status: "accepted",
        convoyId: convoy.id,
        driverUserId: load?.driverId || undefined,
        carrierUserId: load?.catalystId || undefined,
        timestamp: new Date().toISOString(),
      });
    }

    return { success: true, convoyId: convoy.id };
  }),

  // Get convoy details
  getConvoy: protectedProcedure.input(z.object({ convoyId: z.number().optional(), loadId: z.number().optional() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    let convoy;
    if (input.convoyId) {
      [convoy] = await db.select().from(convoys).where(eq(convoys.id, input.convoyId)).limit(1);
    } else if (input.loadId) {
      [convoy] = await db.select().from(convoys).where(eq(convoys.loadId, input.loadId)).orderBy(desc(convoys.createdAt)).limit(1);
    }

    if (!convoy) return null;

    // Get user names
    const [lead] = await db.select({ name: users.name }).from(users).where(eq(users.id, convoy.leadUserId)).limit(1);
    const [load] = await db.select({ name: users.name }).from(users).where(eq(users.id, convoy.loadUserId)).limit(1);
    let rear = null;
    if (convoy.rearUserId) {
      [rear] = await db.select({ name: users.name }).from(users).where(eq(users.id, convoy.rearUserId)).limit(1);
    }

    return {
      id: convoy.id,
      loadId: convoy.loadId,
      status: convoy.status,
      lead: { userId: convoy.leadUserId, name: lead?.name || "Lead Escort" },
      loadVehicle: { userId: convoy.loadUserId, name: load?.name || "Load Driver" },
      rear: rear ? { userId: convoy.rearUserId, name: rear.name || "Rear Escort" } : null,
      targetLeadDistance: convoy.targetLeadDistanceMeters,
      targetRearDistance: convoy.targetRearDistanceMeters,
      currentLeadDistance: convoy.currentLeadDistance,
      currentRearDistance: convoy.currentRearDistance,
      maxSpeedMph: convoy.maxSpeedMph,
      startedAt: convoy.startedAt?.toISOString(),
    };
  }),

  // Get convoy positions (real-time locations of all vehicles)
  getConvoyPositions: protectedProcedure.input(z.object({ convoyId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const [convoy] = await db.select().from(convoys).where(eq(convoys.id, input.convoyId)).limit(1);
    if (!convoy) return null;

    const userIds = [convoy.leadUserId, convoy.loadUserId];
    if (convoy.rearUserId) userIds.push(convoy.rearUserId);

    const positions = [];
    for (const userId of userIds) {
      const [loc] = await db.select().from(locationHistory).where(eq(locationHistory.userId, userId)).orderBy(desc(locationHistory.serverTimestamp)).limit(1);
      if (loc) {
        const role = userId === convoy.leadUserId ? "lead" : userId === convoy.loadUserId ? "load" : "rear";
        positions.push({
          userId,
          role,
          lat: Number(loc.latitude),
          lng: Number(loc.longitude),
          speed: loc.speed ? Number(loc.speed) : 0,
          heading: loc.heading ? Number(loc.heading) : 0,
          timestamp: loc.serverTimestamp?.toISOString(),
        });
      }
    }

    // Calculate distances between vehicles
    let leadDistance = null;
    let rearDistance = null;
    const leadPos = positions.find(p => p.role === "lead");
    const loadPos = positions.find(p => p.role === "load");
    const rearPos = positions.find(p => p.role === "rear");

    if (leadPos && loadPos) {
      leadDistance = calculateDistance(leadPos.lat, leadPos.lng, loadPos.lat, loadPos.lng);
    }
    if (loadPos && rearPos) {
      rearDistance = calculateDistance(loadPos.lat, loadPos.lng, rearPos.lat, rearPos.lng);
    }

    return { convoyId: input.convoyId, positions, leadDistance, rearDistance, status: convoy.status };
  }),

  // Update convoy status
  updateConvoyStatus: protectedProcedure.input(z.object({ convoyId: z.number(), status: z.enum(["forming", "active", "paused", "completed", "disbanded"]) })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Fetch convoy info before update for event payloads
    const [convoy] = await db.select({
      loadId: convoys.loadId,
      leadUserId: convoys.leadUserId,
      rearUserId: convoys.rearUserId,
      loadUserId: convoys.loadUserId,
      status: convoys.status,
    }).from(convoys).where(eq(convoys.id, input.convoyId)).limit(1);
    if (!convoy) throw new Error("Convoy not found");
    const previousStatus = convoy.status;

    const updates: Record<string, unknown> = { status: input.status };
    if (input.status === "active") updates.startedAt = new Date();
    if (input.status === "completed" || input.status === "disbanded") updates.completedAt = new Date();

    await db.update(convoys).set(updates).where(eq(convoys.id, input.convoyId));

    // Sync escort assignment statuses with convoy status
    // Fetch linked assignments for event emission
    const linkedAssignments = await db.select({
      id: escortAssignments.id,
      escortUserId: escortAssignments.escortUserId,
      loadId: escortAssignments.loadId,
      position: escortAssignments.position,
      driverUserId: escortAssignments.driverUserId,
      carrierUserId: escortAssignments.carrierUserId,
    }).from(escortAssignments).where(eq(escortAssignments.convoyId, input.convoyId));

    if (input.status === "active") {
      await db.update(escortAssignments)
        .set({ status: "escorting", startedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(escortAssignments.convoyId, input.convoyId), eq(escortAssignments.status, "accepted")));

      // Emit escort job started for each linked assignment
      for (const a of linkedAssignments) {
        emitEscortJobStarted({
          assignmentId: a.id,
          loadId: a.loadId,
          escortUserId: a.escortUserId,
          position: (a.position as "lead" | "chase" | "both") || "lead",
          status: "escorting",
          previousStatus: "accepted",
          convoyId: input.convoyId,
          driverUserId: a.driverUserId || undefined,
          carrierUserId: a.carrierUserId || undefined,
          timestamp: new Date().toISOString(),
        });
      }
    } else if (input.status === "completed") {
      await db.update(escortAssignments)
        .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(escortAssignments.convoyId, input.convoyId), eq(escortAssignments.status, "escorting")));

      for (const a of linkedAssignments) {
        emitEscortJobCompleted({
          assignmentId: a.id,
          loadId: a.loadId,
          escortUserId: a.escortUserId,
          position: (a.position as "lead" | "chase" | "both") || "lead",
          status: "completed",
          previousStatus: "escorting",
          convoyId: input.convoyId,
          driverUserId: a.driverUserId || undefined,
          carrierUserId: a.carrierUserId || undefined,
          timestamp: new Date().toISOString(),
        });
      }
    } else if (input.status === "disbanded") {
      await db.update(escortAssignments)
        .set({ status: "cancelled", updatedAt: new Date(), notes: "Convoy disbanded" })
        .where(and(eq(escortAssignments.convoyId, input.convoyId), eq(escortAssignments.status, "escorting")));
    }

    // Emit convoy status update
    emitConvoyUpdate({
      convoyId: input.convoyId,
      loadId: convoy.loadId,
      status: input.status,
      previousStatus,
      leadUserId: convoy.leadUserId,
      rearUserId: convoy.rearUserId || undefined,
      loadUserId: convoy.loadUserId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }),

  // Update convoy distances (called periodically with position updates)
  updateDistances: protectedProcedure.input(z.object({ convoyId: z.number(), leadDistance: z.number().optional(), rearDistance: z.number().optional() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.update(convoys).set({
      currentLeadDistance: input.leadDistance,
      currentRearDistance: input.rearDistance,
      lastPositionUpdate: new Date(),
    }).where(eq(convoys.id, input.convoyId));

    return { success: true };
  }),

  // GAP-082 Task 5.2: Convoy Route Optimization — fuel, rest, timing, permits
  optimizeConvoyRoute: protectedProcedure.input(z.object({
    convoyId: z.number().optional(),
    loadId: z.number().optional(),
    originLat: z.number(),
    originLng: z.number(),
    destLat: z.number(),
    destLng: z.number(),
    totalDistanceMiles: z.number(),
    estimatedTravelHours: z.number().optional(),
    isOversize: z.boolean().default(false),
    loadWidth: z.number().optional(),
    loadHeight: z.number().optional(),
    loadWeight: z.number().optional(),
    departureTime: z.string().optional(),
    transitStates: z.array(z.string()).default([]),
  })).query(async ({ input }) => {
    const avgSpeed = input.isOversize ? 35 : 45; // mph convoy average
    const travelHours = input.estimatedTravelHours || (input.totalDistanceMiles / avgSpeed);
    const fuelRangeMiles = 350; // avg truck fuel range for convoy (conservative)
    const driverHOSLimit = 11; // max driving hours
    const daylightStart = 7; // 7 AM
    const daylightEnd = 18; // 6 PM (sunset conservative)
    const daylightHours = daylightEnd - daylightStart;

    // ── Fuel Stops ──
    const fuelStopCount = Math.max(0, Math.floor(input.totalDistanceMiles / fuelRangeMiles));
    const fuelStops: Array<{ stopNumber: number; approximateMile: number; estimatedTime: string; notes: string }> = [];
    for (let i = 1; i <= fuelStopCount; i++) {
      const mile = i * fuelRangeMiles;
      const hoursIn = mile / avgSpeed;
      fuelStops.push({
        stopNumber: i,
        approximateMile: mile,
        estimatedTime: `+${hoursIn.toFixed(1)}h from departure`,
        notes: "Fuel all convoy vehicles simultaneously. Lead escort fuels first, then load, then rear.",
      });
    }

    // ── Rest / HOS Stops ──
    const restStops: Array<{ stopNumber: number; type: string; approximateHour: number; duration: string; reason: string }> = [];
    if (travelHours > 5) {
      restStops.push({ stopNumber: 1, type: "break", approximateHour: 5, duration: "30 min", reason: "Mandatory 30-min break after 5h driving (HOS 49 CFR 395.3)" });
    }
    if (travelHours > driverHOSLimit) {
      const overnightStops = Math.ceil(travelHours / driverHOSLimit) - 1;
      for (let i = 0; i < overnightStops; i++) {
        restStops.push({
          stopNumber: restStops.length + 1,
          type: "overnight",
          approximateHour: driverHOSLimit * (i + 1),
          duration: "10h off-duty",
          reason: `HOS 11h driving limit — 10h consecutive off-duty required (49 CFR 395.3)`,
        });
      }
    }

    // ── Daylight-Only Windows (Oversize/Heavy Haul) ──
    const daylightWindows: Array<{ day: number; start: string; end: string; drivingHours: number; miles: number }> = [];
    if (input.isOversize) {
      const departureDateObj = input.departureTime ? new Date(input.departureTime) : new Date();
      let remainingMiles = input.totalDistanceMiles;
      let dayNum = 1;

      while (remainingMiles > 0) {
        const dayMiles = Math.min(remainingMiles, avgSpeed * daylightHours);
        const dayDate = new Date(departureDateObj);
        dayDate.setDate(dayDate.getDate() + dayNum - 1);

        // Skip weekends (most states restrict oversize on weekends)
        const dow = dayDate.getDay();
        if (dow === 0 || dow === 6) {
          dayNum++;
          continue;
        }

        daylightWindows.push({
          day: dayNum,
          start: `${dayDate.toISOString().split("T")[0]} ${String(daylightStart).padStart(2, "0")}:00`,
          end: `${dayDate.toISOString().split("T")[0]} ${String(daylightEnd).padStart(2, "0")}:00`,
          drivingHours: Math.min(daylightHours, remainingMiles / avgSpeed),
          miles: Math.round(dayMiles),
        });

        remainingMiles -= dayMiles;
        dayNum++;
        if (dayNum > 14) break; // safety cap
      }
    }

    // ── State Permit Checkpoints ──
    const STATE_RESTRICTIONS: Record<string, { daylightOnly: boolean; noWeekends: boolean; noHolidays: boolean; maxSpeed: number; escortRequired: boolean; policeEscort: boolean; notes: string }> = {
      TX: { daylightOnly: true, noWeekends: true, noHolidays: true, maxSpeed: 45, escortRequired: false, policeEscort: false, notes: "Permit office: TxDMV. Electronic permits available." },
      CA: { daylightOnly: true, noWeekends: true, noHolidays: true, maxSpeed: 35, escortRequired: true, policeEscort: false, notes: "Caltrans permit required. Width >12ft needs escort. CHP notification for width >14ft." },
      FL: { daylightOnly: true, noWeekends: false, noHolidays: true, maxSpeed: 45, escortRequired: false, policeEscort: false, notes: "FDOT permits. Saturday travel allowed with restrictions." },
      NY: { daylightOnly: true, noWeekends: true, noHolidays: true, maxSpeed: 40, escortRequired: true, policeEscort: true, notes: "NYSDOT requires police escort for width >14ft. No travel on NYC bridges." },
      PA: { daylightOnly: true, noWeekends: true, noHolidays: true, maxSpeed: 40, escortRequired: true, policeEscort: false, notes: "PennDOT. Height >15ft requires utility coordination." },
      OH: { daylightOnly: true, noWeekends: true, noHolidays: true, maxSpeed: 45, escortRequired: false, policeEscort: false, notes: "ODOT electronic permits. Annual permits available for repeat lanes." },
      IL: { daylightOnly: true, noWeekends: true, noHolidays: true, maxSpeed: 45, escortRequired: false, policeEscort: false, notes: "IDOT. Superloads require 5-day advance notice." },
      GA: { daylightOnly: true, noWeekends: true, noHolidays: true, maxSpeed: 45, escortRequired: false, policeEscort: false, notes: "GDOT permits online. Height >15ft6in requires route survey." },
      LA: { daylightOnly: true, noWeekends: true, noHolidays: true, maxSpeed: 45, escortRequired: false, policeEscort: false, notes: "DOTD. Baton Rouge area requires special routing." },
      OK: { daylightOnly: true, noWeekends: true, noHolidays: true, maxSpeed: 45, escortRequired: false, policeEscort: false, notes: "OTA turnpike permits separate from ODOT highway permits." },
    };

    const permitCheckpoints = input.transitStates.map(st => {
      const restrictions = STATE_RESTRICTIONS[st.toUpperCase()];
      return {
        state: st.toUpperCase(),
        permitRequired: input.isOversize,
        restrictions: restrictions || { daylightOnly: true, noWeekends: true, noHolidays: true, maxSpeed: 45, escortRequired: false, policeEscort: false, notes: "Contact state DOT for permit requirements" },
      };
    });

    // ── Estimated Timeline ──
    let totalDays: number;
    if (input.isOversize) {
      totalDays = daylightWindows.length || Math.ceil(travelHours / daylightHours);
    } else {
      totalDays = Math.ceil(travelHours / driverHOSLimit);
    }

    // ── Convoy-Specific Warnings ──
    const warnings: string[] = [];
    if (input.isOversize && input.loadWidth && input.loadWidth > 14) {
      warnings.push("Width >14ft — most states require front and rear escort vehicles");
    }
    if (input.isOversize && input.loadWidth && input.loadWidth > 16) {
      warnings.push("Width >16ft — law enforcement escort likely required in multiple states");
    }
    if (input.isOversize && input.loadHeight && input.loadHeight > 15.5) {
      warnings.push("Height >15.5ft — utility line coordination required. Contact power companies along route.");
    }
    if (input.loadWeight && input.loadWeight > 120000) {
      warnings.push("Gross weight >120,000 lbs — bridge analysis required for route");
    }
    if (travelHours > 24) {
      warnings.push("Multi-day convoy — ensure relay escorts or overnight secure parking");
    }
    if (input.transitStates.length > 3) {
      warnings.push(`${input.transitStates.length} transit states — allow extra time for permit coordination`);
    }

    return {
      summary: {
        totalDistanceMiles: input.totalDistanceMiles,
        estimatedTravelHours: Math.round(travelHours * 10) / 10,
        estimatedDays: totalDays,
        avgConvoySpeed: avgSpeed,
        fuelStopCount: fuelStops.length,
        restStopCount: restStops.length,
        permitStates: permitCheckpoints.length,
      },
      fuelStops,
      restStops,
      daylightWindows,
      permitCheckpoints,
      warnings,
      recommendations: [
        "Stage all convoy vehicles at origin 1 hour before departure",
        "Verify radio communication between all vehicles before departure",
        "Lead escort should carry route plan and all state permits",
        fuelStops.length > 0 ? "Pre-identify truck stops with sufficient parking for convoy" : "",
        input.isOversize ? "Contact each state permit office 3-5 business days before travel" : "",
        input.isOversize ? "Verify utility line clearances on route survey before departure" : "",
      ].filter(Boolean),
    };
  }),

  // AI-enhanced spacing and speed prediction based on historical data + conditions
  predictOptimalSpacing: protectedProcedure.input(z.object({
    convoyId: z.number().optional(),
    loadId: z.number().optional(),
    currentSpeed: z.number().optional(),
    weatherCondition: z.enum(["clear", "rain", "fog", "snow", "ice", "wind"]).default("clear"),
    roadType: z.enum(["highway", "rural", "urban", "mountain"]).default("highway"),
    loadWeight: z.number().optional(),
    loadWidth: z.number().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();

    // Base parameters from rule engine
    let baseLeadDistance = 800; // meters
    let baseRearDistance = 500;
    let baseMaxSpeed = 45; // mph
    let confidence = 0.6; // baseline confidence

    // Factor 1: Weather adjustment (physics-based model)
    const weatherMultipliers: Record<string, { spacing: number; speed: number }> = {
      clear: { spacing: 1.0, speed: 1.0 },
      rain: { spacing: 1.4, speed: 0.85 },
      fog: { spacing: 1.8, speed: 0.7 },
      snow: { spacing: 2.0, speed: 0.6 },
      ice: { spacing: 2.5, speed: 0.5 },
      wind: { spacing: 1.3, speed: 0.8 },
    };
    const wm = weatherMultipliers[input.weatherCondition] || weatherMultipliers.clear;

    // Factor 2: Road type adjustment
    const roadMultipliers: Record<string, { spacing: number; speed: number }> = {
      highway: { spacing: 1.0, speed: 1.0 },
      rural: { spacing: 0.9, speed: 0.9 },
      urban: { spacing: 1.5, speed: 0.65 },
      mountain: { spacing: 1.6, speed: 0.7 },
    };
    const rm = roadMultipliers[input.roadType] || roadMultipliers.highway;

    // Factor 3: Load dimensions adjustment
    if (input.loadWidth && input.loadWidth > 12) {
      baseLeadDistance *= 1.3;
      baseRearDistance *= 1.2;
      baseMaxSpeed *= 0.8;
    }
    if (input.loadWeight && input.loadWeight > 120000) {
      baseMaxSpeed *= 0.85;
      baseLeadDistance *= 1.2;
    }

    // Factor 4: Historical data learning (query completed convoys)
    let historicalAdjustment = 1.0;
    if (db) {
      try {
        const [histRows] = await db.execute(sql`
          SELECT AVG(currentLeadDistance) as avgLead, AVG(currentRearDistance) as avgRear,
            AVG(maxSpeedMph) as avgSpeed, COUNT(*) as total,
            AVG(TIMESTAMPDIFF(MINUTE, startedAt, completedAt)) as avgDuration
          FROM convoys WHERE status = 'completed' AND completedAt IS NOT NULL
            AND completedAt > DATE_SUB(NOW(), INTERVAL 90 DAY)
        `) as any;
        const h = (histRows || [])[0];
        if (h && Number(h.total) >= 3) {
          // Use historical averages to refine predictions
          const histAvgLead = Number(h.avgLead) || baseLeadDistance;
          const histAvgRear = Number(h.avgRear) || baseRearDistance;
          // Blend historical with rule-based (70% historical, 30% rule when sufficient data)
          const blendWeight = Math.min(Number(h.total) / 20, 0.7);
          baseLeadDistance = baseLeadDistance * (1 - blendWeight) + histAvgLead * blendWeight;
          baseRearDistance = baseRearDistance * (1 - blendWeight) + histAvgRear * blendWeight;
          confidence = Math.min(0.95, 0.6 + blendWeight * 0.5);
          historicalAdjustment = blendWeight;
        }
      } catch {} // convoys table may not have enough data
    }

    // Apply all factors
    const recommendedLeadDistance = Math.round(baseLeadDistance * wm.spacing * rm.spacing);
    const recommendedRearDistance = Math.round(baseRearDistance * wm.spacing * rm.spacing);
    const recommendedMaxSpeed = Math.round(baseMaxSpeed * wm.speed * rm.speed);

    // Speed zones (recommendations for different segments)
    const speedZones = [
      { zone: "straight_highway", speed: recommendedMaxSpeed, spacing: recommendedLeadDistance },
      { zone: "curve", speed: Math.round(recommendedMaxSpeed * 0.75), spacing: Math.round(recommendedLeadDistance * 1.3) },
      { zone: "intersection", speed: Math.round(recommendedMaxSpeed * 0.5), spacing: Math.round(recommendedLeadDistance * 1.5) },
      { zone: "bridge", speed: Math.round(recommendedMaxSpeed * 0.7), spacing: Math.round(recommendedLeadDistance * 1.2) },
    ];

    return {
      recommendedLeadDistance,
      recommendedRearDistance,
      recommendedMaxSpeed,
      confidence: Math.round(confidence * 100),
      model: historicalAdjustment > 0.3 ? "ml_blended" : "rule_based",
      factors: {
        weather: { condition: input.weatherCondition, spacingMultiplier: wm.spacing, speedMultiplier: wm.speed },
        road: { type: input.roadType, spacingMultiplier: rm.spacing, speedMultiplier: rm.speed },
        historical: { blendWeight: Math.round(historicalAdjustment * 100), available: historicalAdjustment > 0 },
      },
      speedZones,
      warnings: [
        ...(input.weatherCondition !== "clear" ? [`${input.weatherCondition} conditions — increased spacing recommended`] : []),
        ...(input.loadWidth && input.loadWidth > 14 ? ["Super-wide load — law enforcement escort may be required"] : []),
        ...(recommendedMaxSpeed < 35 ? ["Low speed advisory — consider alternate timing"] : []),
      ],
    };
  }),

  // GAP-082: Get convoy alerts (separation breaches, speed violations)
  getConvoyAlerts: protectedProcedure.input(z.object({ convoyId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const [convoy] = await db.select().from(convoys).where(eq(convoys.id, input.convoyId)).limit(1);
    if (!convoy) return [];

    const alerts: Array<{ id: string; type: string; severity: "critical" | "warning" | "info"; message: string; timestamp: string }> = [];
    const now = new Date().toISOString();

    // Check lead separation
    if (convoy.currentLeadDistance != null) {
      const target = convoy.targetLeadDistanceMeters || 800;
      if (Number(convoy.currentLeadDistance) > target * 1.5) {
        alerts.push({ id: `lead-crit-${convoy.id}`, type: "separation", severity: "critical", message: `Lead vehicle separation ${Math.round(Number(convoy.currentLeadDistance))}m exceeds critical threshold (${Math.round(target * 1.5)}m)`, timestamp: now });
      } else if (Number(convoy.currentLeadDistance) > target) {
        alerts.push({ id: `lead-warn-${convoy.id}`, type: "separation", severity: "warning", message: `Lead vehicle separation ${Math.round(Number(convoy.currentLeadDistance))}m exceeds target (${target}m)`, timestamp: now });
      }
    }

    // Check rear separation
    if (convoy.currentRearDistance != null) {
      const target = convoy.targetRearDistanceMeters || 500;
      if (Number(convoy.currentRearDistance) > target * 1.5) {
        alerts.push({ id: `rear-crit-${convoy.id}`, type: "separation", severity: "critical", message: `Rear vehicle separation ${Math.round(Number(convoy.currentRearDistance))}m exceeds critical threshold (${Math.round(target * 1.5)}m)`, timestamp: now });
      } else if (Number(convoy.currentRearDistance) > target) {
        alerts.push({ id: `rear-warn-${convoy.id}`, type: "separation", severity: "warning", message: `Rear vehicle separation ${Math.round(Number(convoy.currentRearDistance))}m exceeds target (${target}m)`, timestamp: now });
      }
    }

    // Check speed violations via latest positions
    const userIds = [convoy.leadUserId, convoy.loadUserId];
    if (convoy.rearUserId) userIds.push(convoy.rearUserId);
    for (const uid of userIds) {
      const [loc] = await db.select({ speed: locationHistory.speed }).from(locationHistory)
        .where(eq(locationHistory.userId, uid)).orderBy(desc(locationHistory.serverTimestamp)).limit(1);
      if (loc?.speed && Number(loc.speed) > (convoy.maxSpeedMph || 45) * 1.609) {
        const role = uid === convoy.leadUserId ? "Lead" : uid === convoy.loadUserId ? "Load" : "Rear";
        alerts.push({ id: `speed-${uid}`, type: "speed", severity: "warning", message: `${role} vehicle exceeding max speed (${Math.round(Number(loc.speed) / 1.609)} mph > ${convoy.maxSpeedMph || 45} mph)`, timestamp: now });
      }
    }

    // Position staleness check
    for (const uid of userIds) {
      const [loc] = await db.select({ ts: locationHistory.serverTimestamp }).from(locationHistory)
        .where(eq(locationHistory.userId, uid)).orderBy(desc(locationHistory.serverTimestamp)).limit(1);
      if (loc?.ts) {
        const age = Date.now() - new Date(loc.ts).getTime();
        if (age > 120_000) {
          const role = uid === convoy.leadUserId ? "Lead" : uid === convoy.loadUserId ? "Load" : "Rear";
          alerts.push({ id: `stale-${uid}`, type: "signal", severity: age > 300_000 ? "critical" : "warning", message: `${role} vehicle GPS signal stale (${Math.round(age / 60_000)}m ago)`, timestamp: now });
        }
      }
    }

    return alerts;
  }),

  // GAP-082: Get convoy position history (breadcrumb trail)
  getConvoyHistory: protectedProcedure.input(z.object({ convoyId: z.number(), minutes: z.number().default(30) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { convoyId: input.convoyId, trails: [] };

    const [convoy] = await db.select().from(convoys).where(eq(convoys.id, input.convoyId)).limit(1);
    if (!convoy) return { convoyId: input.convoyId, trails: [] };

    const userIds = [
      { userId: convoy.leadUserId, role: "lead" },
      { userId: convoy.loadUserId, role: "load" },
    ];
    if (convoy.rearUserId) userIds.push({ userId: convoy.rearUserId, role: "rear" });

    const cutoff = new Date(Date.now() - input.minutes * 60 * 1000);
    const trails: Array<{ role: string; points: Array<{ lat: number; lng: number; speed: number; ts: string }> }> = [];

    for (const { userId, role } of userIds) {
      const points = await db.select({
        lat: locationHistory.latitude,
        lng: locationHistory.longitude,
        speed: locationHistory.speed,
        ts: locationHistory.serverTimestamp,
      }).from(locationHistory)
        .where(and(
          eq(locationHistory.userId, userId),
          sql`${locationHistory.serverTimestamp} >= ${cutoff}`,
        ))
        .orderBy(locationHistory.serverTimestamp)
        .limit(200);

      trails.push({
        role,
        points: points.map(p => ({
          lat: Number(p.lat),
          lng: Number(p.lng),
          speed: p.speed ? Number(p.speed) : 0,
          ts: p.ts?.toISOString() || "",
        })),
      });
    }

    return { convoyId: input.convoyId, trails };
  }),

  // Get active convoys for a company/fleet
  getActiveConvoys: protectedProcedure.input(z.object({ limit: z.number().default(20) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const activeConvoys = await db.select().from(convoys).where(eq(convoys.status, "active")).orderBy(desc(convoys.startedAt)).limit(input.limit);

    return activeConvoys.map(c => ({
      id: c.id,
      loadId: c.loadId,
      status: c.status,
      leadUserId: c.leadUserId,
      loadUserId: c.loadUserId,
      rearUserId: c.rearUserId,
      currentLeadDistance: c.currentLeadDistance,
      currentRearDistance: c.currentRearDistance,
      startedAt: c.startedAt?.toISOString(),
    }));
  }),
});

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
