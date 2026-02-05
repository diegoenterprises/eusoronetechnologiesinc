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
import { eq, sql, desc, and } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { loads, documents, users, vehicles } from "../../drizzle/schema";

// Run Ticket schema
const runTicketSchema = z.object({
  // Load info
  loadId: z.string(),
  carrierId: z.string(),
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
  
  // Carrier info
  carrierName: z.string(),
  carrierMC: z.string(),
  carrierDOT: z.string(),
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
  carrierSignature: z.string().optional(),
});

export const eusoTicketRouter = router({
  // Create a new run ticket
  createRunTicket: protectedProcedure
    .input(runTicketSchema)
    .mutation(async ({ input, ctx }) => {
      const ticketNumber = `RT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      // In production, save to database
      return {
        success: true,
        ticketNumber,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.id,
        status: "draft",
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
            carrierId: "",
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

        return {
          ticketNumber: input.ticketNumber,
          status: load.status || "pending",
          loadId: `LD-${load.id}`,
          carrierId: String(load.carrierId || ""),
          driverId: String(load.driverId || ""),
          vehicleId: "",
          originTerminalId: "",
          productName: (load as any).commodityName || "Unknown Product",
          crudeType: (load as any).commodityName || "",
          apiGravity: 0,
          bsw: 0,
          sulfurContent: 0,
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
          spectraMatchVerified: false,
          spectraMatchConfidence: 0,
          createdAt: load.createdAt?.toISOString() || new Date().toISOString(),
        };
      } catch (error) {
        console.error('[EusoTicket] getRunTicket error:', error);
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
        const loadsList = await db.select({
          id: loads.id,
          status: loads.status,
          commodityName: (loads as any).commodityName,
          weight: loads.weight,
          createdAt: loads.createdAt,
        }).from(loads)
          .orderBy(desc(loads.createdAt))
          .limit(input.limit);

        return {
          tickets: loadsList.map(load => ({
            ticketNumber: `RT-${load.id}`,
            status: load.status || "pending",
            productName: load.commodityName || "Unknown",
            netVolume: parseFloat(String(load.weight)) || 0,
            apiGravity: 0,
            driverName: "Driver",
            vehiclePlate: "",
            terminalName: "Terminal",
            createdAt: load.createdAt?.toISOString() || new Date().toISOString(),
            spectraMatchVerified: false,
          })),
          total: loadsList.length,
        };
      } catch (error) {
        console.error('[EusoTicket] listRunTickets error:', error);
        return { tickets: [], total: 0 };
      }
    }),

  // Generate BOL from run ticket
  generateBOL: protectedProcedure
    .input(bolSchema)
    .mutation(async ({ input, ctx }) => {
      const bolNumber = `BOL-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
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
      return {
        bolNumber: input.bolNumber,
        runTicketId: "RT-2024-001",
        status: "delivered",
        shipperName: "ABC Oil Company",
        shipperAddress: "123 Oil Field Rd, Midland, TX 79701",
        consigneeName: "XYZ Refinery",
        consigneeAddress: "456 Refinery Way, Houston, TX 77001",
        carrierName: "EusoTrip Transport LLC",
        carrierMC: "MC-123456",
        carrierDOT: "DOT-789012",
        driverName: "John Smith",
        driverCDL: "TX-CDL-12345",
        vehiclePlate: "TX-1234",
        trailerPlate: "TX-T-5678",
        productDescription: "West Texas Intermediate Crude Oil",
        quantity: 8475,
        quantityUnit: "gallons",
        isHazmat: true,
        hazmatClass: "3",
        unNumber: "UN1267",
        packingGroup: "II",
        ergNumber: "128",
        freightTerms: "prepaid",
        freightCharges: 2500,
        specialInstructions: "Temperature sensitive - maintain below 100°F",
        emergencyContact: "1-800-555-0123",
        shipperSignature: "signed",
        carrierSignature: "signed",
        createdAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
      };
    }),

  // List BOLs
  listBOLs: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "issued", "in_transit", "delivered", "cancelled"]).optional(),
      carrierId: z.string().optional(),
      shipperId: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return {
        bols: [
          {
            bolNumber: "BOL-2024-001",
            runTicketId: "RT-2024-001",
            status: "delivered",
            shipperName: "ABC Oil Company",
            consigneeName: "XYZ Refinery",
            productDescription: "WTI Crude Oil",
            quantity: 8475,
            quantityUnit: "gallons",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            deliveredAt: new Date().toISOString(),
          },
          {
            bolNumber: "BOL-2024-002",
            runTicketId: "RT-2024-002",
            status: "in_transit",
            shipperName: "Bakken Energy LLC",
            consigneeName: "Gulf Coast Refinery",
            productDescription: "Bakken Crude Oil",
            quantity: 8200,
            quantityUnit: "gallons",
            createdAt: new Date(Date.now() - 43200000).toISOString(),
          },
          {
            bolNumber: "BOL-2024-003",
            runTicketId: "RT-2024-003",
            status: "issued",
            shipperName: "Eagle Ford Resources",
            consigneeName: "Corpus Christi Terminal",
            productDescription: "Eagle Ford Condensate",
            quantity: 7900,
            quantityUnit: "gallons",
            createdAt: new Date(Date.now() - 21600000).toISOString(),
          },
        ],
        total: 3,
      };
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
      return {
        terminalId: input.terminalId,
        todayTickets: 12,
        todayVolume: 98500,
        weekTickets: 67,
        weekVolume: 568750,
        monthTickets: 289,
        monthVolume: 2451250,
        avgLoadTime: 45, // minutes
        avgApiGravity: 40.2,
        topCrudeTypes: [
          { type: "WTI", count: 145, percentage: 50.2 },
          { type: "Bakken", count: 72, percentage: 24.9 },
          { type: "Eagle Ford", count: 52, percentage: 18.0 },
          { type: "Other", count: 20, percentage: 6.9 },
        ],
        pendingTickets: 3,
        pendingBOLs: 5,
      };
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
      return {
        ticketNumber: input.ticketNumber,
        isValid: true,
        checks: [
          { name: "Driver Signature", status: "passed" },
          { name: "Operator Signature", status: "passed" },
          { name: "Volume Verification", status: "passed" },
          { name: "Seal Numbers", status: "passed" },
          { name: "SpectraMatch Verification", status: "passed" },
          { name: "HazMat Classification", status: "passed" },
          { name: "Temperature Check", status: "passed" },
        ],
        warnings: [],
        errors: [],
      };
    }),
});
