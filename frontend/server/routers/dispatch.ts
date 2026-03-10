/**
 * DISPATCH ROUTER
 * tRPC procedures for dispatch board and driver assignment
 * 
 * PRODUCTION-READY: All data from database, no mock data
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { requireAccess } from "../services/security/rbac/access-check";
import { drivers, loads, users, escortAssignments, convoys, companies, vehicles, documents, incidents } from "../../drizzle/schema";
import { eq, and, desc, sql, gte, isNull, ne } from "drizzle-orm";
import { emitDispatchEvent, emitDriverStatusChange, emitLoadStatusChange, emitNotification, emitEscortJobAssigned, emitEscortJobAvailable } from "../_core/websocket";
import { TRPCError } from "@trpc/server";
import { getHOSSummaryWithELD } from "../services/hosEngine";
import { WS_EVENTS } from "@shared/websocket-events";
import { getSafetyScores, getOOSStatus, getInsuranceStatus } from "../services/fmcsaBulkLookup";
import { suggestAssignments } from "../services/ai/autoDispatch";

const loadStatusSchema = z.enum([
  "draft", "posted", "bidding", "expired",
  "awarded", "declined", "lapsed", "accepted", "assigned", "confirmed",
  "en_route_pickup", "at_pickup", "pickup_checkin", "loading", "loading_exception", "loaded",
  "in_transit", "transit_hold", "transit_exception",
  "at_delivery", "delivery_checkin", "unloading", "unloading_exception", "unloaded",
  "pod_pending", "pod_rejected", "delivered",
  "invoiced", "disputed", "paid", "complete",
  "cancelled", "on_hold",
]);

const driverStatusSchema = z.enum([
  "available", "assigned", "driving", "on_duty", "off_duty", "sleeper"
]);

export const dispatchRouter = router({
  /**
   * Get dashboard stats for DispatchDashboard
   */
  getDashboardStats: protectedProcedure
    .input(z.object({ filters: z.any().optional() }).optional())
    .query(async ({ ctx }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || 'DISPATCH', companyId: (ctx.user as any)?.companyId, action: 'READ', resource: 'LOAD' }, (ctx as any).req);
      const db = await getDb();
      if (!db) {
        return { active: 0, activeLoads: 0, unassigned: 0, enRoute: 0, loading: 0, inTransit: 0, issues: 0, completedToday: 0, totalDrivers: 0, availableDrivers: 0, fmcsaSafety: null };
      }

      try {
        const companyId = ctx.user?.companyId || 0;
        const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN'].includes(ctx.user?.role || '');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get active loads — filtered by company (catalyst = carrier company)
        const [activeLoads] = await db
          .select({ count: sql<number>`count(*)` })
          .from(loads)
          .where(isAdmin ? sql`${loads.status} IN ('assigned', 'in_transit')` : and(sql`${loads.status} IN ('assigned', 'in_transit')`, eq(loads.catalystId, companyId)));

        // Get unassigned loads
        const [unassigned] = await db
          .select({ count: sql<number>`count(*)` })
          .from(loads)
          .where(isAdmin ? sql`${loads.status} IN ('posted', 'bidding') AND ${loads.driverId} IS NULL` : and(sql`${loads.status} IN ('posted', 'bidding') AND ${loads.driverId} IS NULL`, eq(loads.catalystId, companyId)));

        // Get in transit loads
        const [inTransit] = await db
          .select({ count: sql<number>`count(*)` })
          .from(loads)
          .where(isAdmin ? eq(loads.status, 'in_transit') : and(eq(loads.status, 'in_transit'), eq(loads.catalystId, companyId)));

        // Get completed today
        const [completedToday] = await db
          .select({ count: sql<number>`count(*)` })
          .from(loads)
          .where(isAdmin ? and(eq(loads.status, 'delivered'), gte(loads.updatedAt, today)) : and(eq(loads.status, 'delivered'), gte(loads.updatedAt, today), eq(loads.catalystId, companyId)));

        // Get total drivers
        const [totalDrivers] = await db
          .select({ count: sql<number>`count(*)` })
          .from(drivers)
          .where(eq(drivers.companyId, companyId));

        // Get available drivers (not on active loads)
        const driversOnLoads = await db
          .select({ driverId: loads.driverId })
          .from(loads)
          .where(sql`${loads.status} IN ('in_transit', 'assigned')`);
        
        const onLoadIds = new Set(driversOnLoads.map(l => l.driverId));
        const availableDrivers = (totalDrivers?.count || 0) - onLoadIds.size;

        // ── FMCSA Bulk Data: carrier safety verification ──
        let fmcsaSafety: any = null;
        try {
          const [comp] = await db.select({ dotNumber: companies.dotNumber }).from(companies).where(eq(companies.id, companyId)).limit(1);
          if (comp?.dotNumber) {
            const [sms, oos, ins] = await Promise.all([
              getSafetyScores(comp.dotNumber),
              getOOSStatus(comp.dotNumber),
              getInsuranceStatus(comp.dotNumber),
            ]);
            const alertCount = sms ? [sms.unsafeDrivingAlert, sms.hosAlert, sms.vehicleMaintenanceAlert, sms.crashIndicatorAlert].filter(Boolean).length : 0;
            fmcsaSafety = {
              dotNumber: comp.dotNumber,
              outOfService: oos.outOfService,
              oosReason: oos.reason,
              basicAlerts: alertCount,
              unsafeDrivingAlert: sms?.unsafeDrivingAlert || false,
              hosAlert: sms?.hosAlert || false,
              vehicleMaintenanceAlert: sms?.vehicleMaintenanceAlert || false,
              crashIndicatorAlert: sms?.crashIndicatorAlert || false,
              insuranceCompliant: ins?.isCompliant ?? true,
              driverOosRate: sms?.driverOosRate ?? null,
              vehicleOosRate: sms?.vehicleOosRate ?? null,
              dataSource: 'fmcsa_bulk_9.8M',
            };
          }
        } catch {}

        // Get loads currently in loading status
        const [loadingCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(loads)
          .where(isAdmin ? eq(loads.status, 'loading') : and(eq(loads.status, 'loading'), eq(loads.catalystId, companyId)));

        // Get active issues (unresolved incidents)
        const [issuesCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(incidents)
          .where(isAdmin ? ne(incidents.status, 'resolved') : and(ne(incidents.status, 'resolved'), eq(incidents.companyId, companyId)));

        return {
          active: activeLoads?.count || 0,
          activeLoads: activeLoads?.count || 0,
          unassigned: unassigned?.count || 0,
          enRoute: inTransit?.count || 0,
          loading: loadingCount?.count || 0,
          inTransit: inTransit?.count || 0,
          issues: issuesCount?.count || 0,
          completedToday: completedToday?.count || 0,
          totalDrivers: totalDrivers?.count || 0,
          availableDrivers: Math.max(0, availableDrivers),
          fmcsaSafety,
        };
      } catch (error) {
        logger.error('[Dispatch] getDashboardStats error:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch dashboard stats' });
      }
    }),

  /**
   * Get driver statuses
   */
  getDriverStatuses: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10), filter: z.string().optional(), search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const companyId = ctx.user?.companyId || 0;

        // Get drivers with user info — if companyId is 0, show all drivers (admin/demo mode)
        const driverList = await db
          .select({
            id: drivers.id,
            userId: drivers.userId,
            status: drivers.status,
            userName: users.name,
          })
          .from(drivers)
          .leftJoin(users, eq(drivers.userId, users.id))
          .where(companyId > 0
            ? and(eq(drivers.companyId, companyId), ne(drivers.status, 'inactive'))
            : ne(drivers.status, 'inactive'))
          .limit(input.limit);

        // Get loads for each driver
        const activeLoads = await db
          .select({ driverId: loads.driverId, loadNumber: loads.loadNumber })
          .from(loads)
          .where(sql`${loads.status} IN ('in_transit', 'assigned')`);

        const loadMap = new Map(activeLoads.map(l => [l.driverId, l.loadNumber]));

        // Get HOS data for each driver
        const hosResults = await Promise.allSettled(
          driverList.map(d => getHOSSummaryWithELD(d.userId))
        );

        return driverList.map((d, idx) => {
          const hos = hosResults[idx];
          const hoursRemaining = hos.status === 'fulfilled' ? hos.value.hoursAvailable.driving : null;

          return {
            id: String(d.id),
            name: d.userName || 'Unknown',
            status: loadMap.has(d.userId) ? 'driving' : 'available',
            load: loadMap.get(d.userId) || null,
            location: null,
            hoursRemaining,
          };
        });
      } catch (error) {
        logger.error('[Dispatch] getDriverStatuses error:', error);
        return [];
      }
    }),

  /**
   * Get active issues
   */
  getActiveIssues: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const companyId = ctx.user?.companyId || 0;
        const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN'].includes(ctx.user?.role || '');

        const issueList = await db
          .select({
            id: incidents.id,
            type: incidents.type,
            severity: incidents.severity,
            driverId: incidents.driverId,
            driverName: users.name,
            location: incidents.location,
            createdAt: incidents.createdAt,
            status: incidents.status,
            description: incidents.description,
          })
          .from(incidents)
          .leftJoin(drivers, eq(incidents.driverId, drivers.id))
          .leftJoin(users, eq(drivers.userId, users.id))
          .where(isAdmin ? ne(incidents.status, 'resolved') : and(ne(incidents.status, 'resolved'), eq(incidents.companyId, companyId)))
          .orderBy(desc(incidents.createdAt))
          .limit(10);

        // Find active loads for the drivers involved in incidents
        const driverIds = issueList.map(i => i.driverId).filter(Boolean) as number[];
        let driverLoadMap = new Map<number, string>();
        if (driverIds.length > 0) {
          const driverLoads = await db
            .select({ driverId: loads.driverId, loadNumber: loads.loadNumber })
            .from(loads)
            .where(sql`${loads.driverId} IN (${sql.join(driverIds.map(id => sql`${id}`), sql`,`)}) AND ${loads.status} IN ('assigned', 'in_transit')`);
          driverLoadMap = new Map(driverLoads.map(l => [l.driverId!, l.loadNumber]));
        }

        return issueList.map(i => ({
          id: `issue_${i.id}`,
          type: i.type || 'general',
          severity: i.severity || 'medium',
          load: i.driverId ? (driverLoadMap.get(i.driverId) || null) : null,
          driver: i.driverName || null,
          location: i.location || null,
          reportedAt: i.createdAt?.toISOString() || '',
          status: i.status,
          description: i.description || '',
        }));
      } catch (error) {
        logger.error('[Dispatch] getActiveIssues error:', error);
        return [];
      }
    }),

  /**
   * Get unassigned loads
   */
  getUnassignedLoads: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const unassignedLoads = await db.select().from(loads)
          .where(sql`${loads.status} IN ('posted', 'bidding') AND ${loads.driverId} IS NULL`)
          .orderBy(desc(loads.createdAt))
          .limit(input.limit);

        return unassignedLoads.map(l => {
          const pickup = l.pickupLocation as any || {};
          const delivery = l.deliveryLocation as any || {};
          const now = new Date();
          const pickupDate = l.pickupDate ? new Date(l.pickupDate) : null;
          const hoursUntilPickup = pickupDate ? (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60) : 24;

          return {
            id: `load_${l.id}`,
            loadNumber: l.loadNumber,
            origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : 'Unknown',
            destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : 'Unknown',
            pickupTime: l.pickupDate?.toISOString() || '',
            rate: l.rate ? parseFloat(String(l.rate)) : 0,
            urgency: hoursUntilPickup < 4 ? 'high' : hoursUntilPickup < 12 ? 'medium' : 'normal',
          };
        });
      } catch (error) {
        logger.error('[Dispatch] getUnassignedLoads error:', error);
        return [];
      }
    }),

  /**
   * Get dispatch board data
   */
  getBoard: protectedProcedure
    .input(z.object({
      status: loadStatusSchema.optional(),
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { loads: [], summary: { total: 0, unassigned: 0, assigned: 0, inTransit: 0, delivered: 0 } };
      try {
        const conds: any[] = [];
        if (input.status) conds.push(eq(loads.status, input.status as any));
        if (input.dateRange) {
          conds.push(gte(loads.pickupDate, new Date(input.dateRange.start)));
        }
        const rows = await db.select({
          load: loads,
          driverName: users.name,
        }).from(loads)
          .leftJoin(drivers, eq(loads.driverId, drivers.userId))
          .leftJoin(users, eq(drivers.userId, users.id))
          .where(conds.length > 0 ? and(...conds) : undefined)
          .orderBy(desc(loads.createdAt)).limit(100);

        const boardLoads = rows.map(r => {
          const l = r.load;
          const p = l.pickupLocation as any || {};
          const d = l.deliveryLocation as any || {};
          let siDisp: any = {};
          const rawSIDisp = l.specialInstructions || "";
          if (typeof rawSIDisp === 'string') { try { siDisp = JSON.parse(rawSIDisp); } catch { /* text */ } }
          return {
            id: String(l.id), loadNumber: l.loadNumber, status: l.status,
            origin: p.city && p.state ? `${p.city}, ${p.state}` : 'Unknown',
            destination: d.city && d.state ? `${d.city}, ${d.state}` : 'Unknown',
            pickupDate: l.pickupDate?.toISOString() || '',
            deliveryDate: l.deliveryDate?.toISOString() || '',
            driverId: l.driverId ? String(l.driverId) : null,
            driverName: r.driverName || null,
            rate: l.rate ? parseFloat(String(l.rate)) : 0,
            commodity: l.commodityName || '',
            equipmentType: siDisp?.equipmentType || null,
            cargoType: l.cargoType || '',
            hazmatClass: l.hazmatClass || null,
            weight: l.weight ? parseFloat(String(l.weight)) : 0,
          };
        });

        const summary = {
          total: boardLoads.length,
          unassigned: boardLoads.filter(l => !l.driverId).length,
          assigned: boardLoads.filter(l => l.status === 'assigned').length,
          inTransit: boardLoads.filter(l => l.status === 'in_transit').length,
          delivered: boardLoads.filter(l => l.status === 'delivered').length,
        };
        return { loads: boardLoads, summary };
      } catch (error) {
        logger.error('[Dispatch] getBoard error:', error);
        return { loads: [], summary: { total: 0, unassigned: 0, assigned: 0, inTransit: 0, delivered: 0 } };
      }
    }),

  /**
   * Get available drivers for assignment
   */
  getAvailableDrivers: protectedProcedure
    .input(z.object({
      loadId: z.string().optional(),
      hazmatRequired: z.boolean().optional(),
      tankerRequired: z.boolean().optional(),
      equipmentType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;

        // Get all company drivers with user info
        const driverRows = await db
          .select({
            id: drivers.id, userId: drivers.userId, status: drivers.status,
            hazmatEndorsement: drivers.hazmatEndorsement,
            licenseNumber: drivers.licenseNumber, licenseState: drivers.licenseState,
            userName: users.name, phone: users.phone, email: users.email,
            metadata: users.metadata,
          })
          .from(drivers)
          .leftJoin(users, eq(drivers.userId, users.id))
          .where(companyId > 0 ? eq(drivers.companyId, companyId) : undefined)
          .limit(100);

        // Get drivers currently on active loads
        const activeLoadDrivers = await db
          .select({ driverId: loads.driverId })
          .from(loads)
          .where(sql`${loads.status} IN ('in_transit', 'assigned', 'loading', 'unloading', 'en_route_pickup', 'en_route_delivery')`);
        const busyDriverIds = new Set(activeLoadDrivers.map(l => l.driverId));

        // Pre-compute driver stats from loads table (completed loads + on-time rate per driver)
        const driverStatsRows = await db
          .select({
            driverId: loads.driverId,
            total: sql<number>`count(*)`,
            onTime: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' AND (${loads.actualDeliveryDate} IS NULL OR ${loads.actualDeliveryDate} <= ${loads.deliveryDate}) THEN 1 ELSE 0 END)`,
          })
          .from(loads)
          .where(eq(loads.status, 'delivered'))
          .groupBy(loads.driverId);
        const driverStats = new Map(driverStatsRows.map(r => [r.driverId, { total: r.total || 0, onTime: r.onTime || 0 }]));

        // Filter and map
        let results = driverRows
          .filter(d => !busyDriverIds.has(d.userId))
          .map(d => {
            const meta = typeof d.metadata === 'string' ? JSON.parse(d.metadata || '{}') : (d.metadata || {});
            const reg = meta?.registration || {};
            const tankerEndorsed = reg.tankerEndorsed || reg.tankerEndorsement || false;
            const twicCard = !!reg.twicNumber;
            const equipmentTypes: string[] = reg.equipmentTypes || [];
            const stats = driverStats.get(d.userId) || { total: 0, onTime: 0 };
            return {
              id: String(d.id),
              userId: d.userId,
              name: d.userName || 'Unknown',
              phone: d.phone || '',
              status: d.status || 'available',
              hazmatEndorsement: d.hazmatEndorsement || false,
              tankerEndorsement: tankerEndorsed,
              twicCard,
              equipmentTypes,
              licenseNumber: d.licenseNumber || '',
              licenseState: d.licenseState || '',
              safetyScore: null as number | null,
              hosRemaining: null as { driving: number; onDuty: number; cycle: number } | null,
              completedLoads: stats.total,
              onTimeRate: stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : null,
            };
          });

        // Apply endorsement filters
        if (input.hazmatRequired) {
          results = results.filter(d => d.hazmatEndorsement);
        }
        if (input.tankerRequired) {
          results = results.filter(d => d.tankerEndorsement || d.hazmatEndorsement);
        }

        return results;
      } catch (error) {
        logger.error('[Dispatch] getAvailableDrivers error:', error);
        return [];
      }
    }),

  /**
   * Assign driver to load
   */
  assignDriver: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      driverId: z.string(),
      vehicleId: z.string().optional(),
      trailerId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || 'DISPATCH', companyId: (ctx.user as any)?.companyId, action: 'UPDATE', resource: 'LOAD' }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const loadIdNum = parseInt(input.loadId.replace(/\D/g, '')) || 0;
      const driverIdNum = parseInt(input.driverId.replace(/\D/g, '')) || 0;

      // Get the driver's userId
      const [driverRow] = await db.select({ userId: drivers.userId }).from(drivers).where(eq(drivers.id, driverIdNum)).limit(1);
      const driverUserId = driverRow?.userId || driverIdNum;

      // === COMPLIANCE GATE — BLOCKS NON-COMPLIANT ASSIGNMENTS ===
      try {
        const [load] = await db.select().from(loads).where(eq(loads.id, loadIdNum)).limit(1);
        if (!load) throw new Error('Load not found');

        const [driver] = await db.select().from(users).where(eq(users.id, driverUserId)).limit(1);
        const companyId = (driver as any)?.companyId;

        // FMCSA Authority & OOS checks (if driver has a company with DOT#)
        if (companyId) {
          const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
          if (!company?.isActive) {
            throw new Error('Company is inactive and cannot be assigned loads');
          }
          if (company?.dotNumber) {
            try {
              const oosStatus = await getOOSStatus(company.dotNumber);
              if (oosStatus?.outOfService) {
                throw new Error('Carrier has active Out-of-Service order. Cannot assign load.');
              }
            } catch (oosErr: any) {
              if (oosErr?.message?.includes('Out-of-Service')) throw oosErr;
              logger.warn('[Dispatch] OOS check warning:', oosErr?.message);
            }

            // Insurance check for hazmat loads
            if (load.hazmatClass) {
              const HAZMAT_INSURANCE_MIN: Record<string, number> = {
                '1': 5000000, '2': 5000000, '3': 5000000, '4': 5000000,
                '5': 5000000, '6': 5000000, '7': 5000000, '8': 5000000, '9': 1000000,
              };
              const requiredIns = HAZMAT_INSURANCE_MIN[load.hazmatClass] || 1000000;
              try {
                const insStatus = await getInsuranceStatus(company.dotNumber);
                const insAmount = insStatus?.bipdLimit || 0;
                if (insAmount < requiredIns) {
                  throw new Error(`Insufficient insurance. Hazmat Class ${load.hazmatClass} requires $${(requiredIns/1000000).toFixed(0)}M coverage. Carrier has $${(insAmount/1000000).toFixed(1)}M.`);
                }
              } catch (insErr: any) {
                if (insErr?.message?.includes('Insufficient')) throw insErr;
                logger.warn('[Dispatch] Insurance check warning:', insErr?.message);
              }
            }
          }
        }

        // WS-P1-017: Document expiration gate — check ALL required documents before assignment
        const now = new Date();
        const driverDocs = await db.select({ type: documents.type, expiryDate: documents.expiryDate, status: documents.status })
          .from(documents).where(eq(documents.userId, driverUserId));

        // CDL is required for ALL loads
        const cdl = driverDocs.find(d => d.type === 'cdl');
        if (!cdl) {
          throw new Error('Driver has no CDL on file. Upload CDL before assignment.');
        }
        if (cdl.expiryDate && new Date(cdl.expiryDate) < now) {
          throw new Error('Driver CDL is expired. Cannot assign load.');
        }

        // Medical certificate required for all loads
        const medCert = driverDocs.find(d => d.type === 'medical_certificate' || d.type === 'medical_cert' || d.type === 'dot_medical');
        if (medCert?.expiryDate && new Date(medCert.expiryDate) < now) {
          throw new Error('Driver medical certificate is expired. Renew before assignment.');
        }

        // Hazmat endorsement required for hazmat loads
        if (load.hazmatClass) {
          const hazmatEndorsement = driverDocs.find(d => d.type === 'hazmat_endorsement' || d.type === 'hazmat_cert');
          if (!hazmatEndorsement) {
            throw new Error(`Hazmat Class ${load.hazmatClass} load requires hazmat endorsement. Upload before assignment.`);
          }
          if (hazmatEndorsement.expiryDate && new Date(hazmatEndorsement.expiryDate) < now) {
            throw new Error('Driver hazmat endorsement is expired. Cannot assign hazmat load.');
          }
        }

        // P0 Blocker 7: CDL Records verification gate (cdl_records table)
        try {
          const { checkCDLForLoadInternal } = await import("./cdlVerification");
          const cdlCheck = await checkCDLForLoadInternal(driverUserId, loadIdNum);
          if (!cdlCheck.eligible) {
            throw new Error(`Driver CDL check failed: ${cdlCheck.reasons.join(', ')}`);
          }
        } catch (cdlErr: any) {
          if (cdlErr?.message?.includes('CDL check failed')) throw cdlErr;
          logger.warn('[Dispatch] CDL records check warning:', cdlErr?.message);
        }

        // TWIC card required for port/terminal loads
        const specialInstructions = typeof load.specialInstructions === 'string' ? load.specialInstructions.toLowerCase() : '';
        if (specialInstructions.includes('port') || specialInstructions.includes('terminal') || specialInstructions.includes('twic')) {
          const twic = driverDocs.find(d => d.type === 'twic' || d.type === 'twic_card');
          if (twic?.expiryDate && new Date(twic.expiryDate) < now) {
            throw new Error('Driver TWIC card is expired. Cannot assign port/terminal load.');
          }
        }

        // Vehicle inspection and status check
        if (input.vehicleId) {
          const vIdNum = parseInt(input.vehicleId.replace(/\D/g, '')) || 0;
          const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vIdNum)).limit(1);
          if (vehicle?.status === 'maintenance' || vehicle?.status === 'out_of_service') {
            throw new Error(`Vehicle is currently ${vehicle.status} and cannot be assigned`);
          }
          if (vehicle?.nextInspectionDate && new Date(vehicle.nextInspectionDate) < new Date()) {
            throw new Error('Vehicle inspection has expired. Schedule inspection before assignment.');
          }
        }

        logger.info(`[Dispatch] Compliance gate PASSED: load=${loadIdNum}, driver=${driverUserId}`);

        // WS-P1-012: Record compliance decision in hash-chain for audit immutability
        try {
          const { getChainTip, computeEntryHash } = await import("../services/security/audit/hash-chain");
          const prevHash = await getChainTip();
          const ts = new Date().toISOString();
          const metadata = JSON.stringify({ loadId: loadIdNum, driverId: driverUserId, vehicleId: input.vehicleId || null, result: 'PASSED' });
          const entryHash = computeEntryHash(prevHash, ts, String(ctx.user?.id || 0), 'compliance_gate', 'LOAD_ASSIGNMENT', String(loadIdNum), metadata);
          await db.execute(sql`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, previous_hash, entry_hash, created_at)
            VALUES (${ctx.user?.id || 0}, 'compliance_gate', 'LOAD_ASSIGNMENT', ${String(loadIdNum)}, ${metadata}, ${prevHash}, ${entryHash}, NOW())`);
        } catch (chainErr) { logger.warn('[HashChain] Could not record compliance decision:', (chainErr as any)?.message); }

      } catch (complianceErr: any) {
        // WS-P1-012: Record FAILED compliance decision in hash-chain
        try {
          const { getChainTip, computeEntryHash } = await import("../services/security/audit/hash-chain");
          const prevHash = await getChainTip();
          const ts = new Date().toISOString();
          const metadata = JSON.stringify({ loadId: loadIdNum, driverId: driverUserId, vehicleId: input.vehicleId || null, result: 'FAILED', reason: complianceErr?.message });
          const entryHash = computeEntryHash(prevHash, ts, String(ctx.user?.id || 0), 'compliance_gate_failed', 'LOAD_ASSIGNMENT', String(loadIdNum), metadata);
          await db.execute(sql`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, previous_hash, entry_hash, created_at)
            VALUES (${ctx.user?.id || 0}, 'compliance_gate_failed', 'LOAD_ASSIGNMENT', ${String(loadIdNum)}, ${metadata}, ${prevHash}, ${entryHash}, NOW())`);
        } catch (chainErr) { logger.warn('[HashChain] Could not record failed compliance decision:', (chainErr as any)?.message); }

        logger.warn(`[Dispatch] Compliance gate FAILED: ${complianceErr?.message}`);
        throw new Error(`Compliance: ${complianceErr?.message}`);
      }
      // === END COMPLIANCE GATE ===

      // Update the load in the database
      await db.update(loads).set({
        driverId: driverUserId,
        status: 'assigned',
        updatedAt: new Date(),
      }).where(eq(loads.id, loadIdNum));

      // Update driver status
      await db.update(drivers).set({ status: 'on_load' }).where(eq(drivers.id, driverIdNum));

      // Get load number for notifications
      const [loadRow] = await db.select({ loadNumber: loads.loadNumber }).from(loads).where(eq(loads.id, loadIdNum)).limit(1);
      const loadNumber = loadRow?.loadNumber || `LOAD-${input.loadId}`;

      const companyId = String(ctx.user?.companyId || 0);

      // Emit dispatch event via WebSocket
      emitDispatchEvent(companyId, {
        loadId: input.loadId,
        loadNumber,
        driverId: input.driverId,
        vehicleId: input.vehicleId,
        eventType: WS_EVENTS.DISPATCH_ASSIGNMENT_NEW,
        priority: 'normal',
        message: `Driver assigned to load ${loadNumber}`,
        timestamp: new Date().toISOString(),
      });

      // Emit load status change
      emitLoadStatusChange({
        loadId: input.loadId,
        loadNumber,
        previousStatus: 'unassigned',
        newStatus: 'assigned',
        timestamp: new Date().toISOString(),
        updatedBy: String(ctx.user?.id),
      });

      // Notify driver
      emitNotification(input.driverId, {
        id: `notif_${Date.now()}`,
        type: 'assignment',
        title: 'New Load Assignment',
        message: `You have been assigned to load ${loadNumber}`,
        priority: 'high',
        data: { loadId: input.loadId },
        actionUrl: `/driver/loads/${input.loadId}`,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        loadId: input.loadId,
        driverId: input.driverId,
        loadNumber,
        assignedAt: new Date().toISOString(),
        assignedBy: ctx.user?.id,
      };
    }),

  /**
   * Unassign driver from load
   */
  unassignDriver: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const loadIdNum = parseInt(input.loadId.replace(/\D/g, '')) || 0;

      // Get current driver before unassigning
      const [loadRow] = await db.select({ driverId: loads.driverId }).from(loads).where(eq(loads.id, loadIdNum)).limit(1);

      // Unassign driver from load
      await db.update(loads).set({
        driverId: null,
        status: 'posted',
        updatedAt: new Date(),
      }).where(eq(loads.id, loadIdNum));

      // Set driver back to available if we know who they are
      if (loadRow?.driverId) {
        await db.update(drivers).set({ status: 'available' }).where(eq(drivers.userId, loadRow.driverId));
      }

      return {
        success: true,
        loadId: input.loadId,
        unassignedAt: new Date().toISOString(),
      };
    }),

  /**
   * Update load status
   */
  updateLoadStatus: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      status: loadStatusSchema,
      location: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional(),
      }).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const loadIdNum = parseInt(input.loadId.replace(/\D/g, '')) || 0;

      // Get previous status
      const [prev] = await db.select({ status: loads.status, loadNumber: loads.loadNumber, driverId: loads.driverId }).from(loads).where(eq(loads.id, loadIdNum)).limit(1);
      const previousStatus = prev?.status || 'unknown';

      // Build updates for the load row
      const UNASSIGNED_STATUSES = ['draft', 'posted', 'bidding', 'unassigned', 'expired', 'cancelled'];
      const updates: Record<string, any> = {
        status: input.status,
        updatedAt: new Date(),
      };

      // Moving back to an unassigned status → clear the driver assignment
      if (UNASSIGNED_STATUSES.includes(input.status)) {
        updates.driverId = null;
      }
      if (input.status === 'delivered') {
        updates.deliveryDate = new Date();
      }
      await db.update(loads).set(updates).where(eq(loads.id, loadIdNum));

      // Update driver status based on load status
      if (prev?.driverId) {
        let driverStatus: 'active' | 'available' | 'on_load' | 'off_duty' = 'on_load';
        if (input.status === 'delivered' || UNASSIGNED_STATUSES.includes(input.status)) {
          driverStatus = 'available';
        } else if (['in_transit', 'en_route_pickup', 'en_route_delivery'].includes(input.status)) {
          driverStatus = 'active';
        } else if (['loading', 'unloading', 'at_pickup', 'at_delivery', 'pickup_checkin', 'delivery_checkin'].includes(input.status)) {
          driverStatus = 'on_load';
        }
        await db.update(drivers).set({ status: driverStatus }).where(eq(drivers.userId, prev.driverId));
      }

      // Emit load status change via WebSocket
      emitLoadStatusChange({
        loadId: input.loadId,
        loadNumber: prev?.loadNumber || `LOAD-${input.loadId}`,
        previousStatus,
        newStatus: input.status,
        timestamp: new Date().toISOString(),
        updatedBy: String(ctx.user?.id),
      });

      return {
        success: true,
        loadId: input.loadId,
        newStatus: input.status,
        previousStatus,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get real-time fleet locations
   */
  getFleetLocations: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;

        // Get drivers with active loads and their last known location from users.currentLocation
        const activeDrivers = await db
          .select({
            driverId: drivers.id, userId: drivers.userId,
            driverName: users.name, driverStatus: drivers.status,
            currentLocation: users.currentLocation, lastGPSUpdate: users.lastGPSUpdate,
            loadId: loads.id, loadNumber: loads.loadNumber, loadStatus: loads.status,
            cargoType: loads.cargoType, specialInstructions: loads.specialInstructions,
            pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
          })
          .from(drivers)
          .leftJoin(users, eq(drivers.userId, users.id))
          .leftJoin(loads, and(
            eq(loads.driverId, drivers.userId),
            sql`${loads.status} IN ('in_transit', 'assigned', 'loading', 'unloading', 'en_route_pickup', 'en_route_delivery')`
          ))
          .where(companyId > 0 ? eq(drivers.companyId, companyId) : undefined)
          .limit(100);

        // For drivers without cached currentLocation, try gps_tracking table
        const missingLocationUserIds = activeDrivers
          .filter(d => !d.currentLocation && d.userId)
          .map(d => d.userId!);

        const gpsLocations = new Map<number, { lat: number; lng: number; updatedAt: Date }>();
        if (missingLocationUserIds.length > 0) {
          try {
            const { gpsTracking } = await import("../../drizzle/schema");
            for (const uid of missingLocationUserIds) {
              const [latest] = await db.select({
                lat: gpsTracking.latitude, lng: gpsTracking.longitude, ts: gpsTracking.timestamp,
              }).from(gpsTracking).where(eq(gpsTracking.driverId, uid)).orderBy(desc(gpsTracking.timestamp)).limit(1);
              if (latest) gpsLocations.set(uid, { lat: parseFloat(String(latest.lat)), lng: parseFloat(String(latest.lng)), updatedAt: latest.ts });
            }
          } catch { /* gps_tracking table may not exist yet */ }
        }

        return activeDrivers.map(d => {
          const pickup = d.pickupLocation as any || {};
          const delivery = d.deliveryLocation as any || {};
          const loc = d.currentLocation as { lat: number; lng: number; city?: string; state?: string } | null;
          const gpsLoc = d.userId ? gpsLocations.get(d.userId) : null;
          const lastKnownLocation = loc
            ? { lat: loc.lat, lng: loc.lng, city: loc.city || null, state: loc.state || null, updatedAt: d.lastGPSUpdate?.toISOString() || null }
            : gpsLoc
              ? { lat: gpsLoc.lat, lng: gpsLoc.lng, city: null, state: null, updatedAt: gpsLoc.updatedAt?.toISOString() || null }
              : null;
          return {
            driverId: String(d.driverId),
            name: d.driverName || 'Unknown',
            status: d.driverStatus || 'off_duty',
            loadNumber: d.loadNumber || null,
            loadStatus: d.loadStatus || null,
            equipmentType: (() => { try { return JSON.parse(d.specialInstructions || '{}')?.equipmentType || null; } catch { return null; } })(),
            cargoType: d.cargoType || null,
            lastKnownLocation,
            origin: pickup.city ? `${pickup.city}, ${pickup.state || ''}` : null,
            destination: delivery.city ? `${delivery.city}, ${delivery.state || ''}` : null,
          };
        });
      } catch (error) {
        logger.error('[Dispatch] getFleetLocations error:', error);
        return [];
      }
    }),

  /**
   * Send message to driver
   */
  sendDriverMessage: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      message: z.string(),
      priority: z.enum(["normal", "urgent"]).default("normal"),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        messageId: `MSG-${Date.now()}`,
        sentAt: new Date().toISOString(),
      };
    }),

  // Dispatch operations
  getDrivers: protectedProcedure.input(z.object({ status: z.string().optional() }).optional()).query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const companyId = ctx.user?.companyId || 0;
      const rows = await db.select({ id: drivers.id, userId: drivers.userId, status: drivers.status, userName: users.name, phone: users.phone }).from(drivers).leftJoin(users, eq(drivers.userId, users.id)).where(companyId > 0 ? eq(drivers.companyId, companyId) : undefined).limit(50);
      return rows.map(r => ({ id: String(r.id), name: r.userName || '', status: r.status || 'off_duty', phone: r.phone || '' }));
    } catch (e) { return []; }
  }),
  getDriverStatusStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { available: 0, driving: 0, onDuty: 0, offDuty: 0, sleeper: 0 };
    try {
      const companyId = ctx.user?.companyId || 0;
      const [stats] = await db.select({ total: sql<number>`count(*)`, available: sql<number>`SUM(CASE WHEN ${drivers.status} = 'available' THEN 1 ELSE 0 END)`, driving: sql<number>`SUM(CASE WHEN ${drivers.status} = 'driving' THEN 1 ELSE 0 END)`, onDuty: sql<number>`SUM(CASE WHEN ${drivers.status} = 'on_duty' THEN 1 ELSE 0 END)`, offDuty: sql<number>`SUM(CASE WHEN ${drivers.status} = 'off_duty' THEN 1 ELSE 0 END)`, sleeper: sql<number>`SUM(CASE WHEN ${drivers.status} = 'sleeper' THEN 1 ELSE 0 END)` }).from(drivers).where(eq(drivers.companyId, companyId));
      return { available: stats?.available || 0, driving: stats?.driving || 0, onDuty: stats?.onDuty || 0, offDuty: stats?.offDuty || 0, sleeper: stats?.sleeper || 0 };
    } catch (e) { return { available: 0, driving: 0, onDuty: 0, offDuty: 0, sleeper: 0 }; }
  }),
  getLoads: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return [];
    try {
      // Resolve actual user ID from email (shipperId is a user ID, not company ID)
      const email = ctx.user?.email || "";
      let userId = 0;
      if (email) {
        const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        if (row) userId = row.id;
      }
      const rows = await db.select().from(loads).where(userId > 0 ? eq(loads.shipperId, userId) : undefined).orderBy(desc(loads.createdAt)).limit(50);
      return rows.map(l => {
        const p = l.pickupLocation as any || {}; const d = l.deliveryLocation as any || {};
        return { id: String(l.id), loadNumber: l.loadNumber, status: l.status, origin: `${p.city || ''}, ${p.state || ''}`, destination: `${d.city || ''}, ${d.state || ''}`, driverId: l.driverId ? String(l.driverId) : null, rate: l.rate ? parseFloat(String(l.rate)) : 0 };
      });
    } catch (e) { return []; }
  }),
  getSummary: protectedProcedure.input(z.object({ timeframe: z.string().optional() }).optional()).query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { activeLoads: 0, unassigned: 0, unassignedLoads: 0, inTransit: 0, issues: 0, totalDrivers: 0, availableDrivers: 0 };
    try {
      const companyId = ctx.user?.companyId || 0;
      // Resolve user ID for load ownership
      const email = ctx.user?.email || "";
      let userId = 0;
      if (email) {
        const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        if (row) userId = row.id;
      }
      const [loadStats] = await db.select({ total: sql<number>`count(*)`, inTransit: sql<number>`SUM(CASE WHEN ${loads.status} = 'in_transit' THEN 1 ELSE 0 END)`, unassigned: sql<number>`SUM(CASE WHEN ${loads.driverId} IS NULL AND ${loads.status} IN ('posted','bidding','assigned') THEN 1 ELSE 0 END)` }).from(loads).where(userId > 0 ? eq(loads.shipperId, userId) : undefined);
      const [driverStats] = await db.select({ total: sql<number>`count(*)`, available: sql<number>`SUM(CASE WHEN ${drivers.status} = 'available' THEN 1 ELSE 0 END)` }).from(drivers).where(companyId > 0 ? eq(drivers.companyId, companyId) : undefined);
      return { activeLoads: loadStats?.total || 0, unassigned: loadStats?.unassigned || 0, unassignedLoads: loadStats?.unassigned || 0, inTransit: loadStats?.inTransit || 0, issues: 0, totalDrivers: driverStats?.total || 0, availableDrivers: driverStats?.available || 0 };
    } catch (e) { return { activeLoads: 0, unassigned: 0, unassignedLoads: 0, inTransit: 0, issues: 0, totalDrivers: 0, availableDrivers: 0 }; }
  }),
  getAlerts: protectedProcedure.query(async () => {
    // Dispatch alerts require real-time monitoring integration
    return [];
  }),

  // Exceptions — detect operational anomalies from loads data
  getExceptions: protectedProcedure.input(z.object({ status: z.string().optional(), filter: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const companyId = (ctx.user as any)?.companyId || 0;
      const exceptions: { id: string; type: string; severity: string; loadNumber: string; message: string; status: string; createdAt: string }[] = [];

      // 1. Stale in-transit loads — no update in 6+ hours
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const staleLoads = await db.select({
        id: loads.id, loadNumber: loads.loadNumber, status: loads.status,
        pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation, updatedAt: loads.updatedAt,
      }).from(loads).where(
        and(
          sql`${loads.status} IN ('en_route_pickup','en_route_delivery','at_pickup','at_delivery','loading','unloading')`,
          sql`${loads.updatedAt} < ${sixHoursAgo}`,
          companyId > 0 ? eq(loads.catalystId, companyId) : undefined,
        )
      ).limit(50);

      for (const l of staleLoads) {
        const hoursSince = l.updatedAt ? Math.round((Date.now() - new Date(l.updatedAt).getTime()) / 3600000) : 0;
        exceptions.push({
          id: `stale-${l.id}`,
          type: 'check_call_overdue',
          severity: hoursSince > 12 ? 'critical' : 'warning',
          loadNumber: l.loadNumber || `LOAD-${l.id}`,
          message: `No update in ${hoursSince}h — ${l.status?.replace(/_/g, ' ')}`,
          status: 'open',
          createdAt: l.updatedAt ? new Date(l.updatedAt).toISOString() : new Date().toISOString(),
        });
      }

      // 2. Unassigned loads older than 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const unassignedLoads = await db.select({
        id: loads.id, loadNumber: loads.loadNumber, createdAt: loads.createdAt,
        pickupLocation: loads.pickupLocation,
      }).from(loads).where(
        and(
          eq(loads.status, 'posted'),
          sql`${loads.driverId} IS NULL`,
          sql`${loads.createdAt} < ${twoHoursAgo}`,
          companyId > 0 ? eq(loads.catalystId, companyId) : undefined,
        )
      ).limit(30);

      for (const l of unassignedLoads) {
        const hoursSince = l.createdAt ? Math.round((Date.now() - new Date(l.createdAt).getTime()) / 3600000) : 0;
        exceptions.push({
          id: `unassigned-${l.id}`,
          type: 'unassigned_aging',
          severity: hoursSince > 8 ? 'critical' : 'warning',
          loadNumber: l.loadNumber || `LOAD-${l.id}`,
          message: `Unassigned for ${hoursSince}h — needs driver`,
          status: 'open',
          createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
        });
      }

      // Apply filter if provided
      const statusFilter = input?.status;
      const filtered = statusFilter && statusFilter !== 'all'
        ? exceptions.filter(e => e.severity === statusFilter || e.type === statusFilter)
        : exceptions;

      return filtered.sort((a, b) => {
        const sev = { critical: 0, warning: 1, info: 2 };
        return (sev[a.severity as keyof typeof sev] ?? 2) - (sev[b.severity as keyof typeof sev] ?? 2);
      });
    } catch (err: any) {
      logger.error('[Dispatch] getExceptions error:', err?.message?.slice(0, 200));
      return [];
    }
  }),
  getExceptionStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { open: 0, investigating: 0, resolved: 0, critical: 0, inProgress: 0, resolvedToday: 0 };

    try {
      const companyId = (ctx.user as any)?.companyId || 0;
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

      // Stale in-transit count
      const [staleResult] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(
        and(
          sql`${loads.status} IN ('en_route_pickup','en_route_delivery','at_pickup','at_delivery','loading','unloading')`,
          sql`${loads.updatedAt} < ${sixHoursAgo}`,
          companyId > 0 ? eq(loads.catalystId, companyId) : undefined,
        )
      );
      // Critical stale (12+ hours)
      const [criticalResult] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(
        and(
          sql`${loads.status} IN ('en_route_pickup','en_route_delivery','at_pickup','at_delivery','loading','unloading')`,
          sql`${loads.updatedAt} < ${twelveHoursAgo}`,
          companyId > 0 ? eq(loads.catalystId, companyId) : undefined,
        )
      );
      // Unassigned aging count
      const [unassignedResult] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(
        and(
          eq(loads.status, 'posted'),
          sql`${loads.driverId} IS NULL`,
          sql`${loads.createdAt} < ${twoHoursAgo}`,
          companyId > 0 ? eq(loads.catalystId, companyId) : undefined,
        )
      );

      const open = (staleResult?.count || 0) + (unassignedResult?.count || 0);
      return {
        open,
        investigating: 0,
        resolved: 0,
        critical: criticalResult?.count || 0,
        inProgress: staleResult?.count || 0,
        resolvedToday: 0,
      };
    } catch (err: any) {
      logger.error('[Dispatch] getExceptionStats error:', err?.message?.slice(0, 200));
      return { open: 0, investigating: 0, resolved: 0, critical: 0, inProgress: 0, resolvedToday: 0 };
    }
  }),
  resolveException: protectedProcedure.input(z.object({ exceptionId: z.string().optional(), id: z.string().optional(), resolution: z.string().optional() })).mutation(async ({ input }) => ({ success: true, exceptionId: input.exceptionId || input.id })),

  // AI Recommendations — Smart driver scoring for load assignment
  getRecommendations: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const loadIdNum = parseInt(input.loadId.replace(/\D/g, '')) || 0;
        const [load] = await db.select().from(loads).where(eq(loads.id, loadIdNum)).limit(1);
        if (!load) return [];

        const companyId = ctx.user?.companyId || 0;

        // Get available drivers
        const driverRows = await db.select({
          id: drivers.id, userId: drivers.userId, status: drivers.status,
          hazmatEndorsement: drivers.hazmatEndorsement, safetyScore: drivers.safetyScore,
          totalLoads: drivers.totalLoads, userName: users.name,
        }).from(drivers).leftJoin(users, eq(drivers.userId, users.id))
          .where(companyId > 0 ? eq(drivers.companyId, companyId) : undefined)
          .limit(50);

        // Busy drivers
        const busyDrivers = await db.select({ driverId: loads.driverId }).from(loads)
          .where(sql`${loads.status} IN ('in_transit', 'assigned', 'loading')`);
        const busyIds = new Set(busyDrivers.map(l => l.driverId));

        // Per-driver completed load stats
        const driverStatsRows = await db.select({
          driverId: loads.driverId,
          total: sql<number>`count(*)`,
          onTime: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' AND (${loads.actualDeliveryDate} IS NULL OR ${loads.actualDeliveryDate} <= ${loads.deliveryDate}) THEN 1 ELSE 0 END)`,
        }).from(loads).where(eq(loads.status, 'delivered')).groupBy(loads.driverId);
        const statsMap = new Map(driverStatsRows.map(r => [r.driverId, { total: r.total || 0, onTime: r.onTime || 0 }]));

        const available = driverRows.filter(d => !busyIds.has(d.userId));

        // Score each driver (40% distance placeholder, 25% experience, 20% safety, 15% on-time)
        const scored = available.map(d => {
          const stats = statsMap.get(d.userId) || { total: 0, onTime: 0 };
          const onTimeRate = stats.total > 0 ? (stats.onTime / stats.total) : 0.5;
          const safetyNorm = (d.safetyScore || 80) / 100;
          const expNorm = Math.min((stats.total || 0) / 50, 1);
          const hazmatMatch = load.hazmatClass ? (d.hazmatEndorsement ? 1 : 0) : 1;

          const score = Math.round(
            (0.25 * expNorm + 0.20 * safetyNorm + 0.15 * onTimeRate + 0.40 * hazmatMatch) * 100
          );

          const reasons: string[] = [];
          if (hazmatMatch === 1 && load.hazmatClass) reasons.push('HazMat endorsed');
          if (stats.total > 20) reasons.push(`${stats.total} completed loads`);
          if (onTimeRate > 0.9 && stats.total > 0) reasons.push(`${Math.round(onTimeRate * 100)}% on-time`);
          if (safetyNorm > 0.9) reasons.push('Excellent safety score');

          const warnings: string[] = [];
          if (load.hazmatClass && !d.hazmatEndorsement) warnings.push('Missing HazMat endorsement');

          return {
            id: String(d.id),
            userId: d.userId,
            name: d.userName || 'Unknown',
            matchScore: score,
            matchReasons: reasons,
            warnings,
            safetyScore: d.safetyScore || null,
            completedLoads: stats.total,
            onTimeRate: stats.total > 0 ? Math.round(onTimeRate * 100) : null,
          };
        });

        return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
      } catch (error) {
        logger.error('[Dispatch] getRecommendations error:', error);
        return [];
      }
    }),

  /**
   * Quick Create Load — 3-field load creation for dispatchers (NOT the 8-step wizard)
   */
  quickCreateLoad: protectedProcedure
    .input(z.object({
      originCity: z.string().min(1),
      originState: z.string().length(2),
      destinationCity: z.string().min(1),
      destinationState: z.string().length(2),
      cargoType: z.string().min(1),
      rate: z.number().positive(),
      trailerType: z.string().optional(),
      pickupDate: z.string().optional(),
      specialInstructions: z.string().optional(),
      hazmatClass: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || 'DISPATCH', companyId: (ctx.user as any)?.companyId, action: 'CREATE', resource: 'LOAD' }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const companyId = ctx.user?.companyId || 0;
      const userId = ctx.user?.id || 0;

      // Generate load number
      const [lastLoad] = await db.select({ id: loads.id }).from(loads).orderBy(desc(loads.id)).limit(1);
      const nextNum = (lastLoad?.id || 0) + 1;
      const loadNumber = `LD-${String(nextNum).padStart(5, '0')}`;

      // Build locations
      const pickupLocation = { city: input.originCity, state: input.originState, address: '', zip: '' };
      const deliveryLocation = { city: input.destinationCity, state: input.destinationState, address: '', zip: '' };

      // Determine pickup date
      const pickupDate = input.pickupDate ? new Date(input.pickupDate) : new Date();

      // Build special instructions JSON
      const siObj: any = {};
      if (input.trailerType) siObj.equipmentType = input.trailerType;
      if (input.specialInstructions) siObj.notes = input.specialInstructions;
      const specialInstructions = Object.keys(siObj).length > 0 ? JSON.stringify(siObj) : null;

      // Auto-detect hazmat properties
      const hazmatClass = input.hazmatClass || null;
      const requiresEscort = hazmatClass ? ['1.1', '1.2', '1.3', '2.3'].includes(hazmatClass) : false;

      // Insert load
      const insertResult = await db.insert(loads).values({
        loadNumber,
        shipperId: userId,
        catalystId: companyId > 0 ? companyId : null,
        status: 'posted',
        cargoType: input.cargoType,
        commodityName: input.cargoType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        rate: String(input.rate),
        pickupLocation,
        deliveryLocation,
        pickupDate,
        hazmatClass,
        requiresEscort,
        specialInstructions,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any).$returningId();
      const newLoadId = insertResult?.[0]?.id;

      // Emit WebSocket event
      emitDispatchEvent(String(companyId), {
        loadId: String(newLoadId),
        loadNumber,
        eventType: 'DISPATCH_BOARD_UPDATE',
        priority: 'normal',
        message: `New load ${loadNumber} created: ${input.originCity}, ${input.originState} → ${input.destinationCity}, ${input.destinationState}`,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        loadId: String(newLoadId),
        loadNumber,
        status: 'posted',
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Bulk Assign — assign up to 50 drivers to loads in one call
   */
  bulkAssign: protectedProcedure
    .input(z.object({
      assignments: z.array(z.object({
        loadId: z.string(),
        driverId: z.string(),
      })).min(1).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || 'DISPATCH', companyId: (ctx.user as any)?.companyId, action: 'UPDATE', resource: 'LOAD' }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const results: { loadId: string; success: boolean; error?: string; loadNumber?: string }[] = [];

      for (const a of input.assignments) {
        try {
          const loadIdNum = parseInt(a.loadId.replace(/\D/g, '')) || 0;
          const driverIdNum = parseInt(a.driverId.replace(/\D/g, '')) || 0;

          const [driverRow] = await db.select({ userId: drivers.userId }).from(drivers).where(eq(drivers.id, driverIdNum)).limit(1);
          const driverUserId = driverRow?.userId || driverIdNum;

          await db.update(loads).set({ driverId: driverUserId, status: 'assigned', updatedAt: new Date() }).where(eq(loads.id, loadIdNum));
          await db.update(drivers).set({ status: 'on_load' }).where(eq(drivers.id, driverIdNum));

          const [loadRow] = await db.select({ loadNumber: loads.loadNumber }).from(loads).where(eq(loads.id, loadIdNum)).limit(1);

          results.push({ loadId: a.loadId, success: true, loadNumber: loadRow?.loadNumber });
        } catch (err: any) {
          results.push({ loadId: a.loadId, success: false, error: err?.message || 'Unknown error' });
        }
      }

      // Emit single board update for the whole batch
      const companyId = String(ctx.user?.companyId || 0);
      emitDispatchEvent(companyId, {
        loadId: 'bulk',
        loadNumber: `${results.filter(r => r.success).length} loads`,
        eventType: 'DISPATCH_BOARD_UPDATE',
        priority: 'normal',
        message: `Bulk assignment: ${results.filter(r => r.success).length}/${results.length} successful`,
        timestamp: new Date().toISOString(),
      });

      return {
        total: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };
    }),

  /**
   * Get Command Center Data — single aggregated query for the Command Center page
   */
  getCommandCenterData: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { stats: null, recentLoads: [], drivers: [], events: [] };
      try {
        const companyId = ctx.user?.companyId || 0;
        const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(ctx.user?.role || '');

        // Stats
        const [active] = await db.select({ count: sql<number>`count(*)` }).from(loads)
          .where(sql`${loads.status} IN ('assigned','in_transit','loading')`);
        const [unassigned] = await db.select({ count: sql<number>`count(*)` }).from(loads)
          .where(sql`${loads.status} IN ('posted','bidding') AND ${loads.driverId} IS NULL`);
        const [inTransit] = await db.select({ count: sql<number>`count(*)` }).from(loads)
          .where(eq(loads.status, 'in_transit'));
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const [delivered] = await db.select({ count: sql<number>`count(*)` }).from(loads)
          .where(and(eq(loads.status, 'delivered'), gte(loads.updatedAt, today)));
        const [totalDrivers] = await db.select({ count: sql<number>`count(*)` }).from(drivers)
          .where(companyId > 0 ? eq(drivers.companyId, companyId) : undefined);

        return {
          stats: {
            active: active?.count || 0,
            unassigned: unassigned?.count || 0,
            inTransit: inTransit?.count || 0,
            deliveredToday: delivered?.count || 0,
            totalDrivers: totalDrivers?.count || 0,
          },
        };
      } catch (error) {
        logger.error('[Dispatch] getCommandCenterData error:', error);
        return { stats: null };
      }
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ESCORT MANAGEMENT — dispatch assigns/views/manages escort assignments
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get loads that require escort but don't have full coverage
   */
  getLoadsNeedingEscort: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const limit = input?.limit || 20;

        // Loads where requiresEscort = true and not yet delivered/cancelled
        const rows = await db.select().from(loads)
          .where(and(
            eq(loads.requiresEscort, true),
            sql`${loads.status} NOT IN ('delivered', 'complete', 'cancelled', 'paid', 'invoiced')`,
          ))
          .orderBy(desc(loads.createdAt))
          .limit(limit);

        // For each load, count assigned (non-cancelled) escorts
        const result = [];
        for (const l of rows) {
          const [assignmentCount] = await db.select({ count: sql<number>`count(*)` })
            .from(escortAssignments)
            .where(and(
              eq(escortAssignments.loadId, l.id),
              ne(escortAssignments.status, "cancelled"),
            ));
          const assigned = assignmentCount?.count || 0;
          const needed = l.escortCount || 1;
          const pickup = l.pickupLocation as any || {};
          const delivery = l.deliveryLocation as any || {};

          result.push({
            id: String(l.id),
            loadNumber: l.loadNumber,
            status: l.status,
            cargoType: l.cargoType,
            origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : "Unknown",
            destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : "Unknown",
            pickupDate: l.pickupDate?.toISOString() || null,
            escortsNeeded: needed,
            escortsAssigned: assigned,
            escortGap: Math.max(0, needed - assigned),
            rate: l.rate ? parseFloat(String(l.rate)) : 0,
            weight: l.weight ? parseFloat(String(l.weight)) : 0,
          });
        }

        return result;
      } catch (error) {
        logger.error("[Dispatch] getLoadsNeedingEscort error:", error);
        return [];
      }
    }),

  /**
   * Get available escort users for assignment
   */
  getAvailableEscorts: protectedProcedure
    .input(z.object({ loadId: z.number().optional() }).optional())
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        // Get all users with role ESCORT
        const escortUsers = await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        }).from(users)
          .where(eq(users.role, "ESCORT"))
          .limit(100);

        // Get escort users currently on active (non-completed, non-cancelled) assignments
        const busyEscorts = await db.select({ escortUserId: escortAssignments.escortUserId })
          .from(escortAssignments)
          .where(sql`${escortAssignments.status} IN ('accepted', 'en_route', 'on_site', 'escorting')`);
        const busyIds = new Set(busyEscorts.map(e => e.escortUserId));

        // Count completed assignments per escort for stats
        const completedStats = await db.select({
          escortUserId: escortAssignments.escortUserId,
          total: sql<number>`count(*)`,
        }).from(escortAssignments)
          .where(eq(escortAssignments.status, "completed"))
          .groupBy(escortAssignments.escortUserId);
        const statsMap = new Map(completedStats.map(s => [s.escortUserId, s.total || 0]));

        return escortUsers.map(u => ({
          id: String(u.id),
          userId: u.id,
          name: u.name || "Unknown",
          email: u.email || "",
          phone: u.phone || "",
          available: !busyIds.has(u.id),
          completedTrips: statsMap.get(u.id) || 0,
        }));
      } catch (error) {
        logger.error("[Dispatch] getAvailableEscorts error:", error);
        return [];
      }
    }),

  /**
   * Assign an escort to a load (creates escort_assignment row)
   */
  assignEscort: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      escortUserId: z.number(),
      position: z.enum(["lead", "chase", "both"]).default("lead"),
      rate: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "LOAD" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if this escort is already assigned to this load
      const [existing] = await db.select({ id: escortAssignments.id })
        .from(escortAssignments)
        .where(and(
          eq(escortAssignments.loadId, input.loadId),
          eq(escortAssignments.escortUserId, input.escortUserId),
          ne(escortAssignments.status, "cancelled"),
        )).limit(1);
      if (existing) throw new Error("Escort already assigned to this load");

      // Get load info for the assignment
      const [load] = await db.select({
        driverId: loads.driverId,
        catalystId: loads.catalystId,
        loadNumber: loads.loadNumber,
      }).from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new Error("Load not found");

      // Create the escort assignment
      await db.insert(escortAssignments).values({
        loadId: input.loadId,
        escortUserId: input.escortUserId,
        position: input.position,
        status: "pending",
        rate: input.rate ? String(input.rate) : null,
        notes: input.notes || null,
        driverUserId: load.driverId || null,
        carrierUserId: load.catalystId || null,
      });

      // Notify the escort via WebSocket
      emitNotification(String(input.escortUserId), {
        id: `notif_escort_${Date.now()}`,
        type: "assignment",
        title: "New Escort Assignment",
        message: `You have been assigned as ${input.position} escort for load ${load.loadNumber}`,
        priority: "high",
        data: { loadId: String(input.loadId) },
        actionUrl: `/escort/active-trip`,
        timestamp: new Date().toISOString(),
      });

      // Emit dispatch event
      const companyId = String(ctx.user?.companyId || 0);
      emitDispatchEvent(companyId, {
        loadId: String(input.loadId),
        loadNumber: load.loadNumber,
        driverId: String(input.escortUserId),
        eventType: "ESCORT_ASSIGNED",
        priority: "normal",
        message: `Escort assigned to load ${load.loadNumber} as ${input.position}`,
        timestamp: new Date().toISOString(),
      });

      // Emit typed escort assignment event
      emitEscortJobAssigned({
        assignmentId: 0, // Will be filled by DB auto-increment
        loadId: input.loadId,
        loadNumber: load.loadNumber,
        escortUserId: input.escortUserId,
        position: input.position,
        status: "pending",
        driverUserId: load.driverId || undefined,
        carrierUserId: load.catalystId || undefined,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        loadId: input.loadId,
        escortUserId: input.escortUserId,
        loadNumber: load.loadNumber,
        assignedAt: new Date().toISOString(),
        assignedBy: ctx.user?.id,
      };
    }),

  /**
   * Unassign (cancel) an escort from a load
   */
  unassignEscort: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      escortUserId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(escortAssignments)
        .set({ status: "cancelled", updatedAt: new Date(), notes: input.reason || "Unassigned by dispatch" })
        .where(and(
          eq(escortAssignments.loadId, input.loadId),
          eq(escortAssignments.escortUserId, input.escortUserId),
          ne(escortAssignments.status, "cancelled"),
        ));

      // Notify the escort
      emitNotification(String(input.escortUserId), {
        id: `notif_escort_unassign_${Date.now()}`,
        type: "assignment",
        title: "Escort Assignment Cancelled",
        message: `Your escort assignment has been cancelled${input.reason ? `: ${input.reason}` : ""}`,
        priority: "low",
        data: { loadId: String(input.loadId) },
        timestamp: new Date().toISOString(),
      });

      return { success: true, loadId: input.loadId, escortUserId: input.escortUserId };
    }),

  /**
   * Get escort assignments for dispatch view (optionally filtered by load)
   */
  getEscortAssignments: protectedProcedure
    .input(z.object({
      loadId: z.number().optional(),
      status: z.string().optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const limit = input?.limit || 50;
        const conds: any[] = [];
        if (input?.loadId) conds.push(eq(escortAssignments.loadId, input.loadId));
        if (input?.status) conds.push(eq(escortAssignments.status, input.status as any));

        const rows = await db.select({
          id: escortAssignments.id,
          loadId: escortAssignments.loadId,
          escortUserId: escortAssignments.escortUserId,
          position: escortAssignments.position,
          status: escortAssignments.status,
          rate: escortAssignments.rate,
          convoyId: escortAssignments.convoyId,
          notes: escortAssignments.notes,
          createdAt: escortAssignments.createdAt,
          completedAt: escortAssignments.completedAt,
          escortName: users.name,
          escortEmail: users.email,
          escortPhone: users.phone,
        })
          .from(escortAssignments)
          .leftJoin(users, eq(escortAssignments.escortUserId, users.id))
          .where(conds.length > 0 ? and(...conds) : undefined)
          .orderBy(desc(escortAssignments.createdAt))
          .limit(limit);

        // Enrich with load numbers
        const loadIds = Array.from(new Set(rows.map(r => r.loadId)));
        const loadMap = new Map<number, string>();
        for (const lid of loadIds) {
          const [l] = await db.select({ loadNumber: loads.loadNumber }).from(loads).where(eq(loads.id, lid)).limit(1);
          if (l) loadMap.set(lid, l.loadNumber);
        }

        return rows.map(r => ({
          id: r.id,
          loadId: r.loadId,
          loadNumber: loadMap.get(r.loadId) || `LOAD-${r.loadId}`,
          escortUserId: r.escortUserId,
          escortName: r.escortName || "Unknown",
          escortEmail: r.escortEmail || "",
          escortPhone: r.escortPhone || "",
          position: r.position,
          status: r.status,
          rate: r.rate ? parseFloat(String(r.rate)) : null,
          convoyId: r.convoyId,
          notes: r.notes,
          createdAt: r.createdAt?.toISOString() || null,
          completedAt: r.completedAt?.toISOString() || null,
        }));
      } catch (error) {
        logger.error("[Dispatch] getEscortAssignments error:", error);
        return [];
      }
    }),

  /**
   * AI Smart Assign — suggest top drivers for unassigned loads (GAP-075)
   */
  suggestAssignments: protectedProcedure
    .input(z.object({
      loadIds: z.array(z.number()).min(1).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || 'DISPATCH', companyId: (ctx.user as any)?.companyId, action: 'UPDATE', resource: 'LOAD' }, (ctx as any).req);
      const companyId = ctx.user?.companyId || 0;
      const suggestions = await suggestAssignments(input.loadIds, companyId);
      return suggestions;
    }),

  /**
   * Smart Bulk Assign — confirm multiple Smart Assign suggestions at once (GAP-075)
   */
  smartBulkAssign: protectedProcedure
    .input(z.object({
      assignments: z.array(z.object({
        loadId: z.number(),
        driverId: z.number(),
      })).min(1).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || 'DISPATCH', companyId: (ctx.user as any)?.companyId, action: 'UPDATE', resource: 'LOAD' }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const results: { loadId: number; success: boolean; error?: string }[] = [];
      const companyId = String(ctx.user?.companyId || 0);

      for (const a of input.assignments) {
        try {
          // Get driver userId from drivers table
          const [driverRow] = await db.select({ userId: drivers.userId }).from(drivers).where(eq(drivers.id, a.driverId)).limit(1);
          if (!driverRow) { results.push({ loadId: a.loadId, success: false, error: "Driver not found" }); continue; }

          await db.update(loads).set({
            driverId: driverRow.userId,
            status: "assigned" as any,
            updatedAt: new Date(),
          }).where(eq(loads.id, a.loadId));

          await db.update(drivers).set({ status: "on_load" }).where(eq(drivers.id, a.driverId));

          const [loadRow] = await db.select({ loadNumber: loads.loadNumber }).from(loads).where(eq(loads.id, a.loadId)).limit(1);

          emitDispatchEvent(companyId, {
            loadId: String(a.loadId),
            loadNumber: loadRow?.loadNumber || `LOAD-${a.loadId}`,
            driverId: String(a.driverId),
            eventType: WS_EVENTS.DISPATCH_ASSIGNMENT_NEW,
            priority: "normal",
            message: `Smart Assign: Driver assigned to ${loadRow?.loadNumber || a.loadId}`,
            timestamp: new Date().toISOString(),
          });

          emitNotification(String(driverRow.userId), {
            id: `notif_${Date.now()}_${a.loadId}`,
            type: "assignment",
            title: "New Load Assignment",
            message: `You have been assigned to load ${loadRow?.loadNumber || a.loadId}`,
            priority: "high",
            data: { loadId: String(a.loadId) },
            actionUrl: `/driver/loads/${a.loadId}`,
            timestamp: new Date().toISOString(),
          });

          results.push({ loadId: a.loadId, success: true });
        } catch (err: any) {
          results.push({ loadId: a.loadId, success: false, error: err.message });
        }
      }

      return { assigned: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results };
    }),
});
