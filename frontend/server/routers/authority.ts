/**
 * AUTHORITY & LEASING ROUTER
 * FMCSR Part 376 compliant lease-on, trip lease, and interline management.
 * 
 * Qualifying roles: CATALYST, DRIVER, BROKER, DISPATCH, ESCORT, SAFETY_MANAGER
 * - CATALYST: Can lease authority TO operators OR lease ON to another carrier
 * - DRIVER: Sees which authority they operate under
 * - BROKER: Verifies carrier authority/lease status when booking
 * - DISPATCH: Sees equipment authority assignments
 * - ESCORT: Verifies authority for oversize loads
 * - SAFETY_MANAGER: Audits compliance of lease arrangements
 */

import { z } from "zod";
import { eq, and, desc, sql, or, gte } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, companies, leaseAgreements, vehicles } from "../../drizzle/schema";

export const authorityRouter = router({
  /**
   * Get current user's authority profile — own authority + any active leases
   */
  getMyAuthority: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { ownAuthority: null, activeLeasesAsLessee: [], activeLeasesAsLessor: [], complianceScore: 0 };

    try {
      const userId = typeof ctx.user.id === "string" ? parseInt(ctx.user.id, 10) : ctx.user.id;

      // Get user's company (own authority)
      const [user] = await db.select({
        id: users.id,
        name: users.name,
        role: users.role,
        companyId: users.companyId,
      }).from(users).where(eq(users.id, userId)).limit(1);

      let ownAuthority: any = null;
      if (user?.companyId) {
        const [company] = await db.select().from(companies).where(eq(companies.id, user.companyId)).limit(1);
        if (company) {
          ownAuthority = {
            companyId: company.id,
            companyName: company.name,
            legalName: company.legalName,
            mcNumber: company.mcNumber,
            dotNumber: company.dotNumber,
            insurancePolicy: company.insurancePolicy,
            insuranceExpiry: company.insuranceExpiry?.toISOString() || null,
            complianceStatus: company.complianceStatus,
            isActive: company.isActive,
          };
        }
      }

      // Active leases where user is the LESSEE (operating under someone else's authority)
      let activeLeasesAsLessee: any[] = [];
      try {
        const leaseRows = await db.select().from(leaseAgreements)
          .where(and(eq(leaseAgreements.lesseeUserId, userId), eq(leaseAgreements.status, "active")))
          .orderBy(desc(leaseAgreements.createdAt));

        // Resolve lessor company names
        const companyIds = Array.from(new Set(leaseRows.map(l => l.lessorCompanyId).filter(Boolean)));
        const companyMap: Record<number, any> = {};
        if (companyIds.length > 0) {
          const companyRows = await db.select({ id: companies.id, name: companies.name, mcNumber: companies.mcNumber, dotNumber: companies.dotNumber })
            .from(companies).where(sql`${companies.id} IN (${sql.join(companyIds.map(id => sql`${id}`), sql`, `)})`);
          for (const c of companyRows) companyMap[c.id] = c;
        }

        activeLeasesAsLessee = leaseRows.map(l => ({
          ...formatLease(l),
          lessorCompanyName: companyMap[l.lessorCompanyId]?.name || "Unknown",
          lessorMcNumber: companyMap[l.lessorCompanyId]?.mcNumber || l.mcNumber,
          lessorDotNumber: companyMap[l.lessorCompanyId]?.dotNumber || l.dotNumber,
        }));
      } catch {}

      // Active leases where user's company is the LESSOR (others operating under their authority)
      let activeLeasesAsLessor: any[] = [];
      if (user?.companyId) {
        try {
          const lessorRows = await db.select().from(leaseAgreements)
            .where(and(eq(leaseAgreements.lessorCompanyId, user.companyId), eq(leaseAgreements.status, "active")))
            .orderBy(desc(leaseAgreements.createdAt));

          // Resolve lessee names
          const lesseeIds = Array.from(new Set(lessorRows.map(l => l.lesseeUserId).filter(Boolean)));
          const lesseeMap: Record<number, any> = {};
          if (lesseeIds.length > 0) {
            const lesseeRows = await db.select({ id: users.id, name: users.name, email: users.email })
              .from(users).where(sql`${users.id} IN (${sql.join(lesseeIds.map(id => sql`${id}`), sql`, `)})`);
            for (const u of lesseeRows) lesseeMap[u.id] = u;
          }

          activeLeasesAsLessor = lessorRows.map(l => ({
            ...formatLease(l),
            lesseeName: lesseeMap[l.lesseeUserId]?.name || lesseeMap[l.lesseeUserId]?.email || "Unknown",
          }));
        } catch {}
      }

      // Calculate compliance score
      const allLeases = [...activeLeasesAsLessee, ...activeLeasesAsLessor];
      let complianceScore = 100;
      if (allLeases.length > 0) {
        const checks = allLeases.flatMap(l => [l.hasWrittenLease, l.hasExclusiveControl, l.hasInsuranceCoverage, l.hasVehicleMarking]);
        const passed = checks.filter(Boolean).length;
        complianceScore = Math.round((passed / (checks.length || 1)) * 100);
      }

      return { ownAuthority, activeLeasesAsLessee, activeLeasesAsLessor, complianceScore };
    } catch (error) {
      console.error("[Authority] getMyAuthority error:", error);
      return { ownAuthority: null, activeLeasesAsLessee: [], activeLeasesAsLessor: [], complianceScore: 0 };
    }
  }),

  /**
   * Get all lease agreements for the current user (any status)
   */
  getMyLeases: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      type: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const userId = typeof ctx.user.id === "string" ? parseInt(ctx.user.id, 10) : ctx.user.id;
        const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);

        const rows = await db.select().from(leaseAgreements)
          .where(or(
            eq(leaseAgreements.lesseeUserId, userId),
            user?.companyId ? eq(leaseAgreements.lessorCompanyId, user.companyId) : sql`FALSE`,
          ))
          .orderBy(desc(leaseAgreements.createdAt));

        // Resolve names
        const companyIds = Array.from(new Set(rows.map(r => r.lessorCompanyId).filter(Boolean)));
        const userIds = Array.from(new Set(rows.map(r => r.lesseeUserId).filter(Boolean)));
        const companyMap: Record<number, any> = {};
        const userMap: Record<number, any> = {};

        if (companyIds.length > 0) {
          const cRows = await db.select({ id: companies.id, name: companies.name }).from(companies)
            .where(sql`${companies.id} IN (${sql.join(companyIds.map(id => sql`${id}`), sql`, `)})`);
          for (const c of cRows) companyMap[c.id] = c;
        }
        if (userIds.length > 0) {
          const uRows = await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
            .where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);
          for (const u of uRows) userMap[u.id] = u;
        }

        let results = rows.map(r => ({
          ...formatLease(r),
          lessorCompanyName: companyMap[r.lessorCompanyId]?.name || "Unknown",
          lesseeName: userMap[r.lesseeUserId]?.name || userMap[r.lesseeUserId]?.email || "Unknown",
          isLessor: r.lessorCompanyId === user?.companyId,
          isLessee: r.lesseeUserId === userId,
        }));

        if (input?.status && input.status !== "all") {
          results = results.filter(r => r.status === input.status);
        }
        if (input?.type && input.type !== "all") {
          results = results.filter(r => r.leaseType === input.type);
        }

        return results;
      } catch (error) {
        console.error("[Authority] getMyLeases error:", error);
        return [];
      }
    }),

  /**
   * Get lease stats summary
   */
  getLeaseStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { active: 0, pending: 0, expired: 0, total: 0, asLessor: 0, asLessee: 0 };

    try {
      const userId = typeof ctx.user.id === "string" ? parseInt(ctx.user.id, 10) : ctx.user.id;
      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);

      const rows = await db.select({ status: leaseAgreements.status, lesseeUserId: leaseAgreements.lesseeUserId, lessorCompanyId: leaseAgreements.lessorCompanyId })
        .from(leaseAgreements)
        .where(or(
          eq(leaseAgreements.lesseeUserId, userId),
          user?.companyId ? eq(leaseAgreements.lessorCompanyId, user.companyId) : sql`FALSE`,
        ));

      return {
        active: rows.filter(r => r.status === "active").length,
        pending: rows.filter(r => r.status === "draft" || r.status === "pending_signatures").length,
        expired: rows.filter(r => r.status === "expired").length,
        total: rows.length,
        asLessor: rows.filter(r => r.lessorCompanyId === user?.companyId).length,
        asLessee: rows.filter(r => r.lesseeUserId === userId).length,
      };
    } catch (error) {
      console.error("[Authority] getLeaseStats error:", error);
      return { active: 0, pending: 0, expired: 0, total: 0, asLessor: 0, asLessee: 0 };
    }
  }),

  /**
   * Create a new lease agreement
   */
  createLease: protectedProcedure
    .input(z.object({
      lessorCompanyId: z.number(),
      lesseeUserId: z.number().optional(),
      leaseType: z.enum(["full_lease", "trip_lease", "interline", "seasonal"]),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      revenueSharePercent: z.number().min(0).max(100).optional(),
      loadId: z.number().optional(),
      originCity: z.string().optional(),
      originState: z.string().optional(),
      destinationCity: z.string().optional(),
      destinationState: z.string().optional(),
      trailerTypes: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = typeof ctx.user.id === "string" ? parseInt(ctx.user.id, 10) : ctx.user.id;
      const lesseeId = input.lesseeUserId || userId;

      // Get lessor company details
      const [lessorCompany] = await db.select({
        mcNumber: companies.mcNumber,
        dotNumber: companies.dotNumber,
      }).from(companies).where(eq(companies.id, input.lessorCompanyId)).limit(1);

      const [result] = await db.insert(leaseAgreements).values({
        lessorCompanyId: input.lessorCompanyId,
        lessorUserId: null,
        lesseeUserId: lesseeId,
        lesseeCompanyId: null,
        leaseType: input.leaseType,
        status: "draft",
        mcNumber: lessorCompany?.mcNumber || null,
        dotNumber: lessorCompany?.dotNumber || null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        revenueSharePercent: input.revenueSharePercent?.toString() || null,
        loadId: input.loadId || null,
        originCity: input.originCity || null,
        originState: input.originState || null,
        destinationCity: input.destinationCity || null,
        destinationState: input.destinationState || null,
        trailerTypes: input.trailerTypes || null,
        notes: input.notes || null,
      } as any);

      return { success: true, leaseId: (result as any).insertId };
    }),

  /**
   * Update lease compliance checklist
   */
  updateCompliance: protectedProcedure
    .input(z.object({
      leaseId: z.number(),
      hasWrittenLease: z.boolean().optional(),
      hasExclusiveControl: z.boolean().optional(),
      hasInsuranceCoverage: z.boolean().optional(),
      hasVehicleMarking: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: any = {};
      if (input.hasWrittenLease !== undefined) updates.hasWrittenLease = input.hasWrittenLease;
      if (input.hasExclusiveControl !== undefined) updates.hasExclusiveControl = input.hasExclusiveControl;
      if (input.hasInsuranceCoverage !== undefined) updates.hasInsuranceCoverage = input.hasInsuranceCoverage;
      if (input.hasVehicleMarking !== undefined) updates.hasVehicleMarking = input.hasVehicleMarking;

      // Auto-activate if all compliance checks pass
      const [lease] = await db.select().from(leaseAgreements).where(eq(leaseAgreements.id, input.leaseId)).limit(1);
      if (lease) {
        const merged = { ...lease, ...updates };
        if (merged.hasWrittenLease && merged.hasExclusiveControl && merged.hasInsuranceCoverage && merged.hasVehicleMarking) {
          if (lease.status === "draft" || lease.status === "pending_signatures") {
            updates.status = "active";
          }
        }
      }

      await db.update(leaseAgreements).set(updates).where(eq(leaseAgreements.id, input.leaseId));
      return { success: true };
    }),

  /**
   * Sign a lease agreement
   */
  signLease: protectedProcedure
    .input(z.object({ leaseId: z.number(), role: z.enum(["lessor", "lessee"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: any = {};
      if (input.role === "lessor") {
        updates.lessorSignedAt = new Date();
      } else {
        updates.lesseeSignedAt = new Date();
      }

      // Check if both parties signed
      const [lease] = await db.select().from(leaseAgreements).where(eq(leaseAgreements.id, input.leaseId)).limit(1);
      if (lease) {
        const willHaveBothSigs = (input.role === "lessor" && lease.lesseeSignedAt) || (input.role === "lessee" && lease.lessorSignedAt);
        if (willHaveBothSigs && lease.status === "pending_signatures") {
          updates.status = "active";
        } else if (lease.status === "draft") {
          updates.status = "pending_signatures";
        }
      }

      await db.update(leaseAgreements).set(updates).where(eq(leaseAgreements.id, input.leaseId));
      return { success: true };
    }),

  /**
   * Terminate a lease
   */
  terminateLease: protectedProcedure
    .input(z.object({ leaseId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(leaseAgreements).set({
        status: "terminated",
        notes: input.reason ? `Terminated: ${input.reason}` : "Terminated by user",
      } as any).where(eq(leaseAgreements.id, input.leaseId));

      return { success: true };
    }),

  /**
   * Browse carriers with authority available for lease-on (for owner-operators)
   */
  browseAuthorities: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const rows = await db.select({
          id: companies.id,
          name: companies.name,
          legalName: companies.legalName,
          mcNumber: companies.mcNumber,
          dotNumber: companies.dotNumber,
          complianceStatus: companies.complianceStatus,
          insuranceExpiry: companies.insuranceExpiry,
          isActive: companies.isActive,
        }).from(companies)
          .where(and(eq(companies.isActive, true), sql`${companies.mcNumber} IS NOT NULL AND ${companies.mcNumber} != ''`))
          .orderBy(companies.name)
          .limit(50);

        let results = rows.map(c => ({
          companyId: c.id,
          companyName: c.name,
          legalName: c.legalName,
          mcNumber: c.mcNumber,
          dotNumber: c.dotNumber,
          complianceStatus: c.complianceStatus,
          insuranceValid: c.insuranceExpiry ? new Date(c.insuranceExpiry) > new Date() : false,
        }));

        if (input?.search) {
          const q = input.search.toLowerCase();
          results = results.filter(r =>
            r.companyName?.toLowerCase().includes(q) ||
            r.mcNumber?.toLowerCase().includes(q) ||
            r.dotNumber?.toLowerCase().includes(q)
          );
        }

        return results;
      } catch (error) {
        console.error("[Authority] browseAuthorities error:", error);
        return [];
      }
    }),

  /**
   * Get equipment assigned to leases
   */
  getEquipmentAuthority: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const userId = typeof ctx.user.id === "string" ? parseInt(ctx.user.id, 10) : ctx.user.id;
      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user?.companyId) return [];

      const vehicleRows = await db.select().from(vehicles)
        .where(eq(vehicles.companyId, user.companyId))
        .orderBy(vehicles.vehicleType);

      // Get active leases to cross-reference
      const activeLeases = await db.select().from(leaseAgreements)
        .where(and(
          or(eq(leaseAgreements.lesseeUserId, userId), eq(leaseAgreements.lessorCompanyId, user.companyId)),
          eq(leaseAgreements.status, "active"),
        ));

      return vehicleRows.map(v => {
        const assignedLease = activeLeases.find(l => (l.vehicleIds as number[])?.includes(v.id));
        return {
          vehicleId: v.id,
          vin: v.vin,
          make: v.make,
          model: v.model,
          year: v.year,
          type: v.vehicleType,
          licensePlate: v.licensePlate,
          status: v.status,
          authoritySource: assignedLease ? "leased" : "own",
          leaseId: assignedLease?.id || null,
          leaseMcNumber: assignedLease?.mcNumber || null,
          leaseDotNumber: assignedLease?.dotNumber || null,
        };
      });
    } catch (error) {
      console.error("[Authority] getEquipmentAuthority error:", error);
      return [];
    }
  }),

  /**
   * Add a vehicle to the company fleet
   */
  addVehicle: protectedProcedure
    .input(z.object({
      vin: z.string().min(11).max(17),
      make: z.string().min(1).max(100),
      model: z.string().min(1).max(100),
      year: z.number().min(1990).max(2030),
      vehicleType: z.enum(["tractor", "trailer", "tanker", "flatbed", "refrigerated", "dry_van", "lowboy", "step_deck"]),
      licensePlate: z.string().max(20).optional(),
      capacity: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = typeof ctx.user.id === "string" ? parseInt(ctx.user.id, 10) : ctx.user.id;
      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);

      if (!user?.companyId) {
        // Auto-create a company for the user if none exists
        const result = await db.insert(companies).values({
          name: ctx.user.name ? `${ctx.user.name}'s Fleet` : "My Fleet",
          isActive: true,
        } as any);
        const companyId = (result as any).insertId || (result as any)[0]?.insertId;
        if (companyId) {
          await db.update(users).set({ companyId }).where(eq(users.id, userId));
          await db.insert(vehicles).values({
            companyId,
            vin: input.vin.toUpperCase(),
            make: input.make,
            model: input.model,
            year: input.year,
            vehicleType: input.vehicleType,
            licensePlate: input.licensePlate || null,
            capacity: input.capacity || null,
            status: "available",
            isActive: true,
          } as any);
          return { success: true, message: "Vehicle registered" };
        }
        throw new Error("Failed to create company");
      }

      await db.insert(vehicles).values({
        companyId: user.companyId,
        vin: input.vin.toUpperCase(),
        make: input.make,
        model: input.model,
        year: input.year,
        vehicleType: input.vehicleType,
        licensePlate: input.licensePlate || null,
        capacity: input.capacity || null,
        status: "available",
        isActive: true,
      } as any);

      return { success: true, message: "Vehicle registered" };
    }),

  /**
   * Remove a vehicle from fleet
   */
  removeVehicle: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = typeof ctx.user.id === "string" ? parseInt(ctx.user.id, 10) : ctx.user.id;
      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user?.companyId) throw new Error("No company found");

      // Verify vehicle belongs to user's company
      const [vehicle] = await db.select({ id: vehicles.id }).from(vehicles)
        .where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.companyId, user.companyId)))
        .limit(1);
      if (!vehicle) throw new Error("Vehicle not found");

      await db.update(vehicles).set({ isActive: false, deletedAt: new Date() } as any)
        .where(eq(vehicles.id, input.vehicleId));

      return { success: true, message: "Vehicle removed" };
    }),

  /**
   * FMCSA SAFER API search — search by DOT#, MC#, or company name
   * Powers the "Find Authority" tab with real federal data
   */
  searchAuthority: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      searchType: z.enum(["auto", "dot", "mc", "name"]).default("auto"),
    }))
    .query(async ({ input }) => {
      const FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services";
      const FMCSA_KEY = process.env.FMCSA_WEBKEY || "891b0bbf613e9937bd584968467527aa1f29aec2";

      if (!FMCSA_KEY) {
        return { results: [], error: "FMCSA API key not configured" };
      }

      const q = input.query.trim().replace(/^(MC|MX|DOT)[#\-\s]*/i, "");
      let searchType = input.searchType;

      // Auto-detect search type
      if (searchType === "auto") {
        if (/^\d{1,8}$/.test(q)) {
          searchType = "dot";
        } else if (/^\d{1,8}$/.test(q.replace(/^(MC|MX)-?/i, ""))) {
          searchType = "mc";
        } else {
          searchType = "name";
        }
      }

      async function fmcsaFetch(endpoint: string) {
        const url = `${FMCSA_BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}webKey=${FMCSA_KEY}`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`FMCSA ${res.status}`);
        return res.json();
      }

      try {
        if (searchType === "dot") {
          // Single carrier lookup by DOT number
          const [carrierRes, authRes] = await Promise.allSettled([
            fmcsaFetch(`/carriers/${q}`),
            fmcsaFetch(`/carriers/${q}/authority`),
          ]);

          const carrierData = carrierRes.status === "fulfilled" ? carrierRes.value : null;
          const c = carrierData?.content?.[0]?.carrier || carrierData?.content?.carrier;
          if (!c) {
            return { results: [], searchType: "dot", query: q };
          }

          const authData = authRes.status === "fulfilled" ? authRes.value : null;
          const dockets = authData?.content || [];
          const mcDocket = dockets.find?.((d: any) => d.prefix === "MC") || dockets[0];

          return {
            results: [{
              dotNumber: String(c.dotNumber || q),
              mcNumber: mcDocket?.docketNumber ? `MC-${mcDocket.docketNumber}` : null,
              legalName: c.legalName || "",
              dbaName: c.dbaName || null,
              phone: c.telephone || null,
              email: c.emailAddress || null,
              address: [c.phyStreet, c.phyCity, c.phyState, c.phyZip].filter(Boolean).join(", "),
              city: c.phyCity || "",
              state: c.phyState || "",
              allowedToOperate: c.allowedToOperate === "Y",
              operatingStatus: c.allowedToOperate === "Y" ? "ACTIVE" : "INACTIVE",
              commonAuthority: c.commonAuthorityStatus || "N",
              contractAuthority: c.contractAuthorityStatus || "N",
              brokerAuthority: c.brokerAuthorityStatus || "N",
              safetyRating: c.safetyRating || "NOT RATED",
              fleetSize: c.totalPowerUnits || 0,
              driverCount: c.totalDrivers || 0,
              hazmat: c.hazmatFlag === "Y",
              bipdInsurance: c.bipdInsuranceOnFile === "Y",
              cargoInsurance: c.cargoInsuranceOnFile === "Y",
              source: "FMCSA" as const,
            }],
            searchType: "dot",
            query: q,
          };
        }

        if (searchType === "mc") {
          const cleanMC = q.replace(/^(MC|MX)-?/i, "");
          const res = await fmcsaFetch(`/carriers/docket/${cleanMC}`);
          const carriers = res?.content || [];
          return {
            results: carriers.slice(0, 20).map((c: any) => ({
              dotNumber: String(c.dotNumber || ""),
              mcNumber: `MC-${cleanMC}`,
              legalName: c.legalName || "",
              dbaName: c.dbaName || null,
              phone: c.telephone || null,
              address: [c.phyStreet, c.phyCity, c.phyState, c.phyZip].filter(Boolean).join(", "),
              city: c.phyCity || "",
              state: c.phyState || "",
              allowedToOperate: c.allowedToOperate === "Y",
              operatingStatus: c.allowedToOperate === "Y" ? "ACTIVE" : "INACTIVE",
              safetyRating: c.safetyRating || "NOT RATED",
              fleetSize: c.totalPowerUnits || 0,
              driverCount: c.totalDrivers || 0,
              hazmat: c.hazmatFlag === "Y",
              bipdInsurance: c.bipdInsuranceOnFile === "Y",
              source: "FMCSA" as const,
            })),
            searchType: "mc",
            query: cleanMC,
          };
        }

        // Name search
        const res = await fmcsaFetch(`/carriers/name/${encodeURIComponent(q)}`);
        const carriers = res?.content || [];
        return {
          results: carriers.slice(0, 20).map((c: any) => ({
            dotNumber: String(c.dotNumber || ""),
            mcNumber: null,
            legalName: c.legalName || "",
            dbaName: c.dbaName || null,
            phone: c.telephone || null,
            address: [c.phyStreet, c.phyCity, c.phyState, c.phyZip].filter(Boolean).join(", "),
            city: c.phyCity || "",
            state: c.phyState || "",
            allowedToOperate: c.allowedToOperate === "Y",
            operatingStatus: c.allowedToOperate === "Y" ? "ACTIVE" : "INACTIVE",
            safetyRating: c.safetyRating || "NOT RATED",
            fleetSize: c.totalPowerUnits || 0,
            driverCount: c.totalDrivers || 0,
            hazmat: c.hazmatFlag === "Y",
            bipdInsurance: c.bipdInsuranceOnFile === "Y",
            source: "FMCSA" as const,
          })),
          searchType: "name",
          query: q,
        };
      } catch (err: any) {
        console.error("[Authority] FMCSA search error:", err.message);
        return { results: [], error: err.message, searchType, query: q };
      }
    }),

  /**
   * Create lease from FMCSA lookup — auto-creates company record if needed
   */
  createLeaseFromFMCSA: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
      mcNumber: z.string().optional(),
      legalName: z.string(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      phone: z.string().optional(),
      leaseType: z.enum(["full_lease", "trip_lease", "interline", "seasonal"]),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      revenueSharePercent: z.number().min(0).max(100).optional(),
      originCity: z.string().optional(),
      originState: z.string().optional(),
      destinationCity: z.string().optional(),
      destinationState: z.string().optional(),
      trailerTypes: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = typeof ctx.user.id === "string" ? parseInt(ctx.user.id, 10) : ctx.user.id;

      // Find or create company from FMCSA data
      let companyId: number;
      const cleanDot = input.dotNumber.replace(/\D/g, "");
      const cleanMc = input.mcNumber?.replace(/^MC-?/i, "").replace(/\D/g, "") || null;

      // Try to find existing company by DOT number
      const existingByDot = await db.select({ id: companies.id }).from(companies)
        .where(eq(companies.dotNumber, cleanDot)).limit(1);

      if (existingByDot.length > 0) {
        companyId = existingByDot[0].id;
      } else {
        // Create new company record from FMCSA data
        const [newCompany] = await db.insert(companies).values({
          name: input.legalName,
          legalName: input.legalName,
          dotNumber: cleanDot,
          mcNumber: cleanMc,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          phone: input.phone || null,
          complianceStatus: "pending",
          isActive: true,
        } as any);
        companyId = (newCompany as any).insertId;
      }

      // Create the lease agreement
      const [result] = await db.insert(leaseAgreements).values({
        lessorCompanyId: companyId,
        lessorUserId: null,
        lesseeUserId: userId,
        lesseeCompanyId: null,
        leaseType: input.leaseType,
        status: "draft",
        mcNumber: cleanMc,
        dotNumber: cleanDot,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        revenueSharePercent: input.revenueSharePercent?.toString() || null,
        originCity: input.originCity || null,
        originState: input.originState || null,
        destinationCity: input.destinationCity || null,
        destinationState: input.destinationState || null,
        trailerTypes: input.trailerTypes || null,
        notes: input.notes || null,
      } as any);

      return {
        success: true,
        leaseId: (result as any).insertId,
        companyId,
        companyName: input.legalName,
      };
    }),
});

function formatLease(l: any) {
  return {
    id: l.id,
    leaseType: l.leaseType,
    status: l.status,
    mcNumber: l.mcNumber,
    dotNumber: l.dotNumber,
    startDate: l.startDate?.toISOString() || null,
    endDate: l.endDate?.toISOString() || null,
    revenueSharePercent: l.revenueSharePercent ? parseFloat(l.revenueSharePercent) : null,
    hasWrittenLease: l.hasWrittenLease,
    hasExclusiveControl: l.hasExclusiveControl,
    hasInsuranceCoverage: l.hasInsuranceCoverage,
    hasVehicleMarking: l.hasVehicleMarking,
    insuranceProvider: l.insuranceProvider,
    insurancePolicyNumber: l.insurancePolicyNumber,
    insuranceExpiry: l.insuranceExpiry?.toISOString() || null,
    liabilityCoverage: l.liabilityCoverage ? parseFloat(l.liabilityCoverage) : null,
    cargoCoverage: l.cargoCoverage ? parseFloat(l.cargoCoverage) : null,
    loadId: l.loadId,
    originCity: l.originCity,
    originState: l.originState,
    destinationCity: l.destinationCity,
    destinationState: l.destinationState,
    vehicleIds: l.vehicleIds || [],
    trailerTypes: l.trailerTypes || [],
    lessorSignedAt: l.lessorSignedAt?.toISOString() || null,
    lesseeSignedAt: l.lesseeSignedAt?.toISOString() || null,
    notes: l.notes,
    createdAt: l.createdAt?.toISOString() || null,
  };
}
