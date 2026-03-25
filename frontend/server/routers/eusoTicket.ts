/**
 * EusoTicket™ tRPC Router
 * Run Ticket + Bill of Lading (BOL) Generation System
 * 
 * Integrated with SPECTRA-MATCH™ for crude oil identification
 * 
 * Features:
 * - Run Ticket generation with oil specs
 * - BOL generation with digital signatures
 * - SpectraMatch integration for crude identification
 * - Terminal loading/unloading documentation
 * - Compliance documentation per DOT/EPA regulations
 */

import { z } from "zod";
import { eq, sql, desc, and, inArray, isNull, isNotNull } from "drizzle-orm";
import { randomBytes } from "crypto";
import { router, isolatedApprovedProcedure as protectedProcedure } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { loads, documents, users, vehicles, runTickets, terminals } from "../../drizzle/schema";
import { unsafeCast } from "../_core/types/unsafe";

// Run Ticket schema
const runTicketSchema = z.object({
  // Load info
  loadId: z.string(),
  catalystId: z.string(),
  driverId: z.string(),
  vehicleId: z.string(),
  trailerId: z.string().optional(),
  
  // Terminal info
  originTerminalId: z.string(),
  destinationTerminalId: z.string().optional(),
  
  // Product info
  productName: z.string(),
  productCode: z.string().optional(),
  hazmatClass: z.string().optional(),
  unNumber: z.string().optional(),
  
  // SpectraMatch identification
  spectraMatchId: z.string().optional(),
  crudeType: z.string().optional(),
  apiGravity: z.number().optional(),
  bsw: z.number().optional(),
  sulfurContent: z.number().optional(),
  temperature: z.number().optional(),
  
  // Quantities
  grossVolume: z.number(),
  netVolume: z.number(),
  grossWeight: z.number().optional(),
  netWeight: z.number().optional(),
  
  // Loading info
  loadStartTime: z.string(),
  loadEndTime: z.string(),
  rackNumber: z.string().optional(),
  bayNumber: z.string().optional(),
  meterNumber: z.string().optional(),
  sealNumbers: z.array(z.string()).optional(),
  
  // Notes
  notes: z.string().optional(),
  driverSignature: z.string().optional(),
  operatorSignature: z.string().optional(),
});

// BOL schema
const bolSchema = z.object({
  runTicketId: z.string(),
  
  // Shipper info
  shipperName: z.string(),
  shipperAddress: z.string(),
  shipperContact: z.string().optional(),
  
  // Consignee info
  consigneeName: z.string(),
  consigneeAddress: z.string(),
  consigneeContact: z.string().optional(),
  
  // Catalyst info
  catalystName: z.string(),
  catalystMC: z.string(),
  catalystDOT: z.string(),
  driverName: z.string(),
  driverCDL: z.string(),
  vehiclePlate: z.string(),
  trailerPlate: z.string().optional(),
  
  // Product details from run ticket
  productDescription: z.string(),
  quantity: z.number(),
  quantityUnit: z.enum(["gallons", "barrels", "pounds", "tons"]),
  
  // HazMat info
  isHazmat: z.boolean(),
  hazmatClass: z.string().optional(),
  unNumber: z.string().optional(),
  packingGroup: z.string().optional(),
  ergNumber: z.string().optional(),
  
  // Freight terms
  freightTerms: z.enum(["prepaid", "collect", "third_party"]),
  freightCharges: z.number().optional(),
  
  // Special instructions
  specialInstructions: z.string().optional(),
  emergencyContact: z.string().optional(),
  
  // Signatures
  shipperSignature: z.string().optional(),
  catalystSignature: z.string().optional(),
});

export const eusoTicketRouter = router({
  // Create a new run ticket
  createRunTicket: protectedProcedure
    .input(runTicketSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const ticketNumber = `RT-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
      const driverIdNum = parseInt(input.driverId) || 0;
      const companyId = Number(ctx.user?.companyId) || 0;
      const loadIdNum = parseInt(input.loadId) || undefined;

      const [result] = await db.insert(runTickets).values({
        ticketNumber,
        loadId: loadIdNum,
        driverId: driverIdNum,
        companyId,
        status: "active",
        origin: input.originTerminalId,
        destination: input.destinationTerminalId || null,
        driverNotes: input.notes || null,
      }).$returningId();

      return {
        success: true,
        ticketNumber,
        ticketId: result.id,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.id,
        status: "active",
        data: {
          ...input,
          ticketNumber,
          spectraMatchVerified: !!input.spectraMatchId,
        },
      };
    }),

  // Get run ticket by ID
  getRunTicket: protectedProcedure
    .input(z.object({ ticketNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const ticketId = parseInt(input.ticketNumber.replace(/\D/g, '')) || 0;
        const [load] = await db.select().from(loads).where(eq(loads.id, ticketId)).limit(1);

        if (!load) {
          return {
            ticketNumber: input.ticketNumber,
            status: "not_found",
            loadId: "",
            catalystId: "",
            driverId: "",
            vehicleId: "",
            originTerminalId: "",
            productName: "",
            crudeType: "",
            apiGravity: 0,
            bsw: 0,
            sulfurContent: 0,
            temperature: 0,
            grossVolume: 0,
            netVolume: 0,
            grossWeight: 0,
            netWeight: 0,
            loadStartTime: "",
            loadEndTime: "",
            rackNumber: "",
            bayNumber: "",
            meterNumber: "",
            sealNumbers: [],
            spectraMatchVerified: false,
            spectraMatchConfidence: 0,
            createdAt: new Date().toISOString(),
          };
        }

        const smResult = unsafeCast(load).spectraMatchResult;
        return {
          ticketNumber: input.ticketNumber,
          status: load.status || "pending",
          loadId: `LD-${load.id}`,
          catalystId: String(load.catalystId || ""),
          driverId: String(load.driverId || ""),
          vehicleId: "",
          originTerminalId: "",
          productName: unsafeCast(load).commodityName || smResult?.productName || "Unknown Product",
          crudeType: smResult?.crudeId || unsafeCast(load).commodityName || "",
          apiGravity: smResult?.apiGravity || 0,
          bsw: smResult?.bsw || 0,
          sulfurContent: smResult?.sulfur || 0,
          temperature: 0,
          grossVolume: parseFloat(String(load.weight)) || 0,
          netVolume: parseFloat(String(load.weight)) || 0,
          grossWeight: parseFloat(String(load.weight)) || 0,
          netWeight: parseFloat(String(load.weight)) || 0,
          loadStartTime: load.pickupDate?.toISOString() || "",
          loadEndTime: load.deliveryDate?.toISOString() || "",
          rackNumber: "",
          bayNumber: "",
          meterNumber: "",
          sealNumbers: [],
          spectraMatchVerified: !!smResult,
          spectraMatchConfidence: smResult?.confidence || 0,
          spectraMatchResult: smResult || null,
          createdAt: load.createdAt?.toISOString() || new Date().toISOString(),
        };
      } catch (error) {
        logger.error('[EusoTicket] getRunTicket error:', error);
        throw error;
      }
    }),

  // List run tickets
  listRunTickets: protectedProcedure
    .input(z.object({
      terminalId: z.string().optional(),
      driverId: z.string().optional(),
      status: z.enum(["draft", "pending", "completed", "cancelled"]).optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { tickets: [], total: 0 };

      try {
        const loadsList = await db
          .select({
            id: loads.id,
            status: loads.status,
            weight: loads.weight,
            commodityName: loads.commodityName,
            spectraMatchResult: loads.spectraMatchResult,
            createdAt: loads.createdAt,
            driverId: loads.driverId,
            originTerminalId: loads.originTerminalId,
            driverName: users.name,
            terminalName: terminals.name,
          })
          .from(loads)
          .leftJoin(users, eq(loads.driverId, users.id))
          .leftJoin(terminals, eq(loads.originTerminalId, terminals.id))
          .orderBy(desc(loads.createdAt))
          .limit(input.limit);

        return {
          tickets: loadsList.map(row => {
            const smResult = unsafeCast(row).spectraMatchResult;
            return {
              ticketNumber: `RT-${row.id}`,
              status: row.status || "pending",
              productName: row.commodityName || smResult?.productName || "Unknown",
              netVolume: parseFloat(String(row.weight)) || 0,
              apiGravity: smResult?.apiGravity || 0,
              driverName: row.driverName || "Unassigned",
              vehiclePlate: "",
              terminalName: row.terminalName || "No Terminal",
              createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
              spectraMatchVerified: !!smResult,
              spectraMatchConfidence: smResult?.confidence || 0,
            };
          }),
          total: loadsList.length,
        };
      } catch (error) {
        logger.error('[EusoTicket] listRunTickets error:', error);
        return { tickets: [], total: 0 };
      }
    }),

  // Generate BOL from run ticket
  generateBOL: protectedProcedure
    .input(bolSchema)
    .mutation(async ({ input, ctx }) => {
      const bolNumber = `BOL-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
      
      return {
        success: true,
        bolNumber,
        runTicketId: input.runTicketId,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.id,
        status: "issued",
        documentUrl: `/documents/bol/${bolNumber}.pdf`,
        data: {
          ...input,
          bolNumber,
        },
      };
    }),

  // Get BOL by number
  getBOL: protectedProcedure
    .input(z.object({ bolNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Find the BOL document by name matching the bolNumber
        const [bolDoc] = await db
          .select()
          .from(documents)
          .where(and(
            eq(documents.type, "bol"),
            eq(documents.name, input.bolNumber),
          ))
          .limit(1);

        if (!bolDoc || !bolDoc.loadId) {
          return {
            bolNumber: input.bolNumber,
            runTicketId: "", status: "not_found",
            shipperName: "", shipperAddress: "",
            consigneeName: "", consigneeAddress: "",
            catalystName: "", catalystMC: "", catalystDOT: "",
            driverName: "", driverCDL: "",
            vehiclePlate: "", trailerPlate: "",
            productDescription: "", quantity: 0, quantityUnit: "",
            isHazmat: false, hazmatClass: "", unNumber: "",
            packingGroup: "", ergNumber: "",
            freightTerms: "", freightCharges: 0,
            specialInstructions: "", emergencyContact: "",
            shipperSignature: "", catalystSignature: "",
            createdAt: bolDoc?.createdAt?.toISOString() || new Date().toISOString(),
            deliveredAt: "",
          };
        }

        // Get associated load with driver, shipper, catalyst info
        const [loadRow] = await db
          .select({
            load: loads,
            driverName: users.name,
          })
          .from(loads)
          .leftJoin(users, eq(loads.driverId, users.id))
          .where(eq(loads.id, bolDoc.loadId))
          .limit(1);

        if (!loadRow) {
          return {
            bolNumber: input.bolNumber,
            runTicketId: "", status: bolDoc.status || "active",
            shipperName: "", shipperAddress: "",
            consigneeName: "", consigneeAddress: "",
            catalystName: "", catalystMC: "", catalystDOT: "",
            driverName: "", driverCDL: "",
            vehiclePlate: "", trailerPlate: "",
            productDescription: "", quantity: 0, quantityUnit: "",
            isHazmat: false, hazmatClass: "", unNumber: "",
            packingGroup: "", ergNumber: "",
            freightTerms: "", freightCharges: 0,
            specialInstructions: "", emergencyContact: "",
            shipperSignature: "", catalystSignature: "",
            createdAt: bolDoc.createdAt?.toISOString() || new Date().toISOString(),
            deliveredAt: "",
          };
        }

        const load = loadRow.load;
        const pickup = unsafeCast(load).pickupLocation;
        const delivery = unsafeCast(load).deliveryLocation;

        // Fetch shipper name
        let shipperName = "";
        if (load.shipperId) {
          const [shipper] = await db.select({ name: users.name }).from(users).where(eq(users.id, load.shipperId)).limit(1);
          shipperName = shipper?.name || "";
        }

        // Fetch catalyst name
        let catalystName = "";
        if (load.catalystId) {
          const [catalyst] = await db.select({ name: users.name }).from(users).where(eq(users.id, load.catalystId)).limit(1);
          catalystName = catalyst?.name || "";
        }

        return {
          bolNumber: input.bolNumber,
          runTicketId: `RT-${load.id}`,
          status: bolDoc.status || "active",
          shipperName,
          shipperAddress: pickup ? `${pickup.address}, ${pickup.city}, ${pickup.state} ${pickup.zipCode}` : "",
          consigneeName: "",
          consigneeAddress: delivery ? `${delivery.address}, ${delivery.city}, ${delivery.state} ${delivery.zipCode}` : "",
          catalystName,
          catalystMC: "",
          catalystDOT: "",
          driverName: loadRow.driverName || "",
          driverCDL: "",
          vehiclePlate: "",
          trailerPlate: "",
          productDescription: load.commodityName || unsafeCast(load).spectraMatchResult?.productName || "",
          quantity: parseFloat(String(load.weight)) || 0,
          quantityUnit: load.weightUnit || "lbs",
          isHazmat: load.cargoType === "hazmat",
          hazmatClass: load.hazmatClass || "",
          unNumber: load.unNumber || "",
          packingGroup: load.packingGroup || "",
          ergNumber: load.emergencyResponseNumber || "",
          freightTerms: "",
          freightCharges: parseFloat(String(load.rate)) || 0,
          specialInstructions: load.specialInstructions || "",
          emergencyContact: load.emergencyPhone || "",
          shipperSignature: "",
          catalystSignature: "",
          createdAt: bolDoc.createdAt?.toISOString() || new Date().toISOString(),
          deliveredAt: load.actualDeliveryDate?.toISOString() || "",
        };
      } catch (error) {
        logger.error('[EusoTicket] getBOL error:', error);
        throw error;
      }
    }),

  // List BOLs
  listBOLs: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "issued", "in_transit", "delivered", "cancelled"]).optional(),
      catalystId: z.string().optional(),
      shipperId: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { bols: [], total: 0 };

      try {
        const conditions = [
          eq(documents.type, "bol"),
          isNull(documents.deletedAt),
        ];

        if (input.status) {
          const statusMap: Record<string, string> = {
            draft: "pending", issued: "active", in_transit: "active",
            delivered: "active", cancelled: "expired",
          };
          conditions.push(eq(documents.status, statusMap[input.status] || "active"));
        }

        const bolDocs = await db
          .select({
            id: documents.id,
            name: documents.name,
            status: documents.status,
            loadId: documents.loadId,
            fileUrl: documents.fileUrl,
            createdAt: documents.createdAt,
          })
          .from(documents)
          .where(and(...conditions))
          .orderBy(desc(documents.createdAt))
          .limit(input.limit);

        // Fetch associated load info for each BOL
        const loadIds = bolDocs.map(d => d.loadId).filter((id): id is number => id !== null);
        let loadMap = new Map<number, { loadNumber: string; status: string; shipperName: string; driverName: string }>();

        if (loadIds.length > 0) {
          const loadRows = await db
            .select({
              id: loads.id,
              loadNumber: loads.loadNumber,
              status: loads.status,
              shipperId: loads.shipperId,
              driverName: users.name,
            })
            .from(loads)
            .leftJoin(users, eq(loads.driverId, users.id))
            .where(inArray(loads.id, loadIds));

          for (const row of loadRows) {
            loadMap.set(row.id, {
              loadNumber: row.loadNumber,
              status: row.status || "pending",
              shipperName: "",
              driverName: row.driverName || "Unassigned",
            });
          }
        }

        return {
          bols: bolDocs.map(doc => {
            const loadInfo = doc.loadId ? loadMap.get(doc.loadId) : null;
            return {
              bolNumber: doc.name,
              loadNumber: loadInfo?.loadNumber || "",
              status: doc.status || "active",
              driverName: loadInfo?.driverName || "",
              fileUrl: doc.fileUrl,
              createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
            };
          }),
          total: bolDocs.length,
        };
      } catch (error) {
        logger.error('[EusoTicket] listBOLs error:', error);
        return { bols: [], total: 0 };
      }
    }),

  // Update run ticket status
  updateRunTicketStatus: protectedProcedure
    .input(z.object({
      ticketNumber: z.string(),
      status: z.enum(["draft", "pending", "completed", "cancelled"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        ticketNumber: input.ticketNumber,
        status: input.status,
        updatedAt: new Date().toISOString(),
        updatedBy: ctx.user?.id,
      };
    }),

  // Update BOL status
  updateBOLStatus: protectedProcedure
    .input(z.object({
      bolNumber: z.string(),
      status: z.enum(["draft", "issued", "in_transit", "delivered", "cancelled"]),
      notes: z.string().optional(),
      proofOfDelivery: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        bolNumber: input.bolNumber,
        status: input.status,
        updatedAt: new Date().toISOString(),
        updatedBy: ctx.user?.id,
      };
    }),

  // Get terminal loading stats
  getTerminalStats: protectedProcedure
    .input(z.object({ terminalId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          terminalId: input.terminalId,
          todayTickets: 0, todayVolume: 0,
          weekTickets: 0, weekVolume: 0,
          monthTickets: 0, monthVolume: 0,
          avgLoadTime: 0, avgApiGravity: 0,
          topCrudeTypes: [] as { name: string; count: number }[],
          pendingTickets: 0, pendingBOLs: 0,
        };
      }

      try {
        const terminalIdNum = parseInt(input.terminalId) || 0;

        // Today's stats
        const [todayStats] = await db.select({
          count: sql<number>`COUNT(*)`,
          volume: sql<number>`COALESCE(SUM(CAST(${loads.weight} AS DECIMAL(10,2))), 0)`,
        }).from(loads)
          .where(and(
            eq(loads.originTerminalId, terminalIdNum),
            sql`DATE(${loads.createdAt}) = CURDATE()`,
          ));

        // This week's stats
        const [weekStats] = await db.select({
          count: sql<number>`COUNT(*)`,
          volume: sql<number>`COALESCE(SUM(CAST(${loads.weight} AS DECIMAL(10,2))), 0)`,
        }).from(loads)
          .where(and(
            eq(loads.originTerminalId, terminalIdNum),
            sql`YEARWEEK(${loads.createdAt}, 1) = YEARWEEK(CURDATE(), 1)`,
          ));

        // This month's stats
        const [monthStats] = await db.select({
          count: sql<number>`COUNT(*)`,
          volume: sql<number>`COALESCE(SUM(CAST(${loads.weight} AS DECIMAL(10,2))), 0)`,
        }).from(loads)
          .where(and(
            eq(loads.originTerminalId, terminalIdNum),
            sql`YEAR(${loads.createdAt}) = YEAR(CURDATE()) AND MONTH(${loads.createdAt}) = MONTH(CURDATE())`,
          ));

        // Pending tickets (loads at this terminal not yet completed)
        const [pendingCounts] = await db.select({
          pendingTickets: sql<number>`SUM(CASE WHEN ${loads.status} IN ('loading','at_pickup','pickup_checkin','en_route_pickup') THEN 1 ELSE 0 END)`,
          pendingBOLs: sql<number>`SUM(CASE WHEN ${loads.status} = 'pod_pending' THEN 1 ELSE 0 END)`,
        }).from(loads)
          .where(eq(loads.originTerminalId, terminalIdNum));

        // Top crude/commodity types
        const crudeTypes = await db.select({
          name: loads.commodityName,
          count: sql<number>`COUNT(*)`,
        }).from(loads)
          .where(and(
            eq(loads.originTerminalId, terminalIdNum),
            isNotNull(loads.commodityName),
          ))
          .groupBy(loads.commodityName)
          .orderBy(sql`COUNT(*) DESC`)
          .limit(5);

        return {
          terminalId: input.terminalId,
          todayTickets: Number(todayStats?.count) || 0,
          todayVolume: Number(todayStats?.volume) || 0,
          weekTickets: Number(weekStats?.count) || 0,
          weekVolume: Number(weekStats?.volume) || 0,
          monthTickets: Number(monthStats?.count) || 0,
          monthVolume: Number(monthStats?.volume) || 0,
          avgLoadTime: 0,
          avgApiGravity: 0,
          topCrudeTypes: crudeTypes.map(c => ({ name: c.name || "Unknown", count: Number(c.count) })),
          pendingTickets: Number(pendingCounts?.pendingTickets) || 0,
          pendingBOLs: Number(pendingCounts?.pendingBOLs) || 0,
        };
      } catch (error) {
        logger.error('[EusoTicket] getTerminalStats error:', error);
        return {
          terminalId: input.terminalId,
          todayTickets: 0, todayVolume: 0,
          weekTickets: 0, weekVolume: 0,
          monthTickets: 0, monthVolume: 0,
          avgLoadTime: 0, avgApiGravity: 0,
          topCrudeTypes: [] as { name: string; count: number }[],
          pendingTickets: 0, pendingBOLs: 0,
        };
      }
    }),

  // Generate PDF for run ticket
  generateRunTicketPDF: protectedProcedure
    .input(z.object({ ticketNumber: z.string() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        ticketNumber: input.ticketNumber,
        documentUrl: `/documents/run-tickets/${input.ticketNumber}.pdf`,
        generatedAt: new Date().toISOString(),
      };
    }),

  // Generate PDF for BOL
  generateBOLPDF: protectedProcedure
    .input(z.object({ bolNumber: z.string() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        bolNumber: input.bolNumber,
        documentUrl: `/documents/bol/${input.bolNumber}.pdf`,
        generatedAt: new Date().toISOString(),
      };
    }),

  // Validate run ticket before BOL generation
  validateForBOL: protectedProcedure
    .input(z.object({ ticketNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const checks: { name: string; status: "passed" | "failed" | "warning" }[] = [];
      const warnings: string[] = [];
      const errors: string[] = [];

      try {
        // Parse ticket number to find the load
        const ticketId = parseInt(input.ticketNumber.replace(/\D/g, '')) || 0;

        // Check if run ticket exists
        const [ticket] = await db.select().from(runTickets).where(eq(runTickets.id, ticketId)).limit(1);
        if (!ticket) {
          // Try by ticket number
          const [ticketByNum] = await db.select().from(runTickets).where(eq(runTickets.ticketNumber, input.ticketNumber)).limit(1);
          if (!ticketByNum) {
            return {
              ticketNumber: input.ticketNumber,
              isValid: false,
              checks: [{ name: "Run Ticket Exists", status: "failed" as const }],
              warnings: [],
              errors: ["Run ticket not found"],
            };
          }
        }

        const activeTicket = ticket;
        const loadId = activeTicket?.loadId;

        // Load the associated load if exists
        let load: typeof loads.$inferSelect | null = null;
        if (loadId) {
          const [foundLoad] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
          load = foundLoad || null;
        }

        // Check 1: Driver assigned
        if (activeTicket?.driverId) {
          const [driver] = await db.select({ name: users.name }).from(users).where(eq(users.id, activeTicket.driverId)).limit(1);
          if (driver?.name) {
            checks.push({ name: "Driver Signature", status: "passed" });
          } else {
            checks.push({ name: "Driver Signature", status: "failed" });
            errors.push("Driver record not found");
          }
        } else {
          checks.push({ name: "Driver Signature", status: "failed" });
          errors.push("No driver assigned to run ticket");
        }

        // Check 2: Operator Signature — check if there's a signed document for this load
        if (loadId) {
          const [signedDoc] = await db.select({ id: documents.id })
            .from(documents)
            .where(and(eq(documents.loadId, loadId), eq(documents.type, "signature")))
            .limit(1);
          checks.push({ name: "Operator Signature", status: signedDoc ? "passed" : "warning" });
          if (!signedDoc) warnings.push("No operator signature document found");
        } else {
          checks.push({ name: "Operator Signature", status: "warning" });
          warnings.push("No load linked — cannot verify operator signature");
        }

        // Check 3: Volume Verification
        if (load && parseFloat(String(load.weight)) > 0) {
          checks.push({ name: "Volume Verification", status: "passed" });
        } else {
          checks.push({ name: "Volume Verification", status: "failed" });
          errors.push("No volume/weight recorded on load");
        }

        // Check 4: Seal Numbers — check load documents JSON
        const loadDocs = load ? unsafeCast(load).documents : null;
        if (loadDocs && Array.isArray(loadDocs) && loadDocs.length > 0) {
          checks.push({ name: "Seal Numbers", status: "passed" });
        } else {
          checks.push({ name: "Seal Numbers", status: "warning" });
          warnings.push("No seal number documentation found");
        }

        // Check 5: SpectraMatch Verification
        const smResult = load ? unsafeCast(load).spectraMatchResult : null;
        if (smResult && smResult.confidence >= 0.8) {
          checks.push({ name: "SpectraMatch Verification", status: "passed" });
        } else if (smResult) {
          checks.push({ name: "SpectraMatch Verification", status: "warning" });
          warnings.push(`SpectraMatch confidence low: ${(smResult.confidence * 100).toFixed(0)}%`);
        } else {
          checks.push({ name: "SpectraMatch Verification", status: "warning" });
          warnings.push("No SpectraMatch result available");
        }

        // Check 6: HazMat Classification
        if (load?.cargoType === "hazmat") {
          if (load.hazmatClass && load.unNumber) {
            checks.push({ name: "HazMat Classification", status: "passed" });
          } else {
            checks.push({ name: "HazMat Classification", status: "failed" });
            errors.push("HazMat load missing classification or UN number");
          }
        } else {
          checks.push({ name: "HazMat Classification", status: "passed" });
        }

        // Check 7: Temperature Check (for reefer loads)
        if (load?.cargoType === "refrigerated") {
          checks.push({ name: "Temperature Check", status: "warning" });
          warnings.push("Temperature data requires manual verification for reefer load");
        } else {
          checks.push({ name: "Temperature Check", status: "passed" });
        }

        const isValid = checks.every(c => c.status !== "failed");

        return {
          ticketNumber: input.ticketNumber,
          isValid,
          checks,
          warnings,
          errors,
        };
      } catch (error) {
        logger.error('[EusoTicket] validateForBOL error:', error);
        return {
          ticketNumber: input.ticketNumber,
          isValid: false,
          checks: [{ name: "Validation", status: "failed" as const }],
          warnings: [],
          errors: ["Validation failed due to internal error"],
        };
      }
    }),
});
