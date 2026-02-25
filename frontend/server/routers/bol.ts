/**
 * BOL & EUSOTICKET (RUN TICKET) ROUTER
 * Comprehensive Bill of Lading and Run Ticket management
 * Uses ESANG AI (Gemini) for intelligent document generation
 * 
 * BOL Types: Standard, Hazmat, Tanker, Food-Grade
 * EusoTicket: Industry-standard run tickets for petroleum hauling
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireAccess } from "../services/security/rbac/access-check";
import { loads, documents, companies, users, drivers, vehicles } from "../../drizzle/schema";
import { bolService } from "../services/bol";
import { esangAI } from "../_core/esangAI";

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

const partySchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  phone: z.string().optional(),
  contact: z.string().optional(),
});

const itemSchema = z.object({
  quantity: z.number(),
  quantityUnit: z.string(),
  description: z.string(),
  weight: z.number(),
  weightUnit: z.string().default("lbs"),
  class: z.string().optional(),
  nmfcNumber: z.string().optional(),
  hazmatClass: z.string().optional(),
  unNumber: z.string().optional(),
  packingGroup: z.string().optional(),
});

const hazmatInfoSchema = z.object({
  hazardClass: z.string(),
  unNumber: z.string(),
  packingGroup: z.string(),
  properShippingName: z.string(),
  technicalName: z.string().optional(),
  placard: z.string(),
  emergencyPhone: z.string(),
  ergGuideNumber: z.string(),
  quantity: z.number(),
  quantityUnit: z.string(),
  containerType: z.string(),
  reportableQuantity: z.boolean().default(false),
});

const tankerInfoSchema = z.object({
  productType: z.string(),
  productName: z.string(),
  quantityGallons: z.number(),
  specificGravity: z.number().optional(),
  temperature: z.number().optional(),
  temperatureUnit: z.enum(["F", "C"]).optional(),
  isFoodGrade: z.boolean().default(false),
  sanitationCertRequired: z.boolean().default(false),
  kosherCertRequired: z.boolean().optional(),
  previousLoad: z.string().optional(),
  washoutRequired: z.boolean().default(false),
  washoutType: z.enum(["rinse", "chemical", "kosher", "full_sanitation"]).optional(),
  sealNumber: z.string().optional(),
});

// ── Gauge Reading schema (FT / IN / FRACT — real-world tank strapping format) ──
const gaugeReadingSchema = z.object({
  feet: z.number(),
  inches: z.number(),
  fraction: z.number().default(0), // 1/4 inch increments (0-3)
});

// EusoTicket (Run Ticket) schema — enhanced with real-world crude oil fields
// Based on: TexStar BOL, Enterprise Run Ticket, Papa Trucklines Invoice
const runTicketSchema = z.object({
  ticketNumber: z.string().optional(),
  invoiceNumber: z.string().optional(), // Papa Trucklines style sequential invoice #
  ticketDate: z.string(),
  closingTime: z.string().optional(),

  // Driver / Transporter
  driverId: z.number().optional(),
  driverName: z.string().optional(),
  driverNumber: z.string().optional(), // Driver # from BOL
  transporterName: z.string().optional(), // "Trucked By" field
  vehicleId: z.number().optional(),
  truckNumber: z.string().optional(), // Truck # (e.g., "3424 8085")
  trailerNumber: z.string().optional(),

  // Origin (Lease/Property/Plant)
  operatorLeasePlant: z.string().optional(), // Operator Lease Plant
  leasePlantName: z.string().optional(), // Lease Plant Name
  forAccountOf: z.string().optional(), // "For the Account Of" (e.g., "E.E.P — Efficient Energy Partners")
  propertyNumber: z.string().optional(),
  propertyName: z.string().optional(),
  leaseNumber: z.string().optional(), // HAGE0003 style lease #
  county: z.string().optional(),
  stateProvince: z.string().optional(),
  operatorName: z.string().optional(), // Operator (e.g., "Somgas LP")
  producerName: z.string().optional(), // Producer
  shipperName: z.string().optional(), // Shipper (e.g., "CP Energy")

  // Movement
  movedBy: z.enum(["pipeline", "line", "truck"]).default("truck"),
  destinationStation: z.string().optional(), // Destination (Station N°)
  destinationMiles: z.number().optional(), // One-way miles
  nameOfCompany: z.string().optional(), // Customer company name
  rNumber: z.string().optional(), // R Number (reference for reconciliation)

  // Tank / Meter
  tankId: z.string().optional(),
  tankNumber: z.string().optional(), // Tank #
  tankSize: z.number().optional(), // Tank capacity in barrels (e.g., 500)
  tankCapacity: z.string().optional(), // "16FT/500BBLS" format
  tankHeight: z.string().optional(), // "15-00-00/04" format
  meterId: z.string().optional(),

  // Loading Meter readings (Papa Trucklines style)
  meterOff: z.number().optional(), // Meter reading when loading starts
  meterOn: z.number().optional(), // Meter reading when loading ends
  meterFactor: z.number().optional(), // Meter correction factor
  avgLineTemp: z.number().optional(), // Average line temperature

  // Gauge readings — FT/IN/FRACT format (Enterprise / TexStar style)
  openGauge: gaugeReadingSchema.optional(), // Open/starting tank level
  closeGauge: gaugeReadingSchema.optional(), // Close/ending tank level
  highGauge: gaugeReadingSchema.optional(), // High reading (Papa Trucklines style)
  lowGauge: gaugeReadingSchema.optional(), // Low reading
  // Simplified numeric gauges (backwards compat)
  startingGauge: z.number().optional(),
  endingGauge: z.number().optional(),
  startingMeter: z.number().optional(),
  endingMeter: z.number().optional(),

  // Temperature at each gauge reading
  openTemp: z.number().optional(), // Temp at open gauge
  closeTemp: z.number().optional(), // Temp at close gauge
  highTemp: z.number().optional(), // Temp at high gauge
  lowTemp: z.number().optional(), // Temp at low gauge

  // Observed measurements
  obsGravity: z.number(), // Observed API gravity
  obsTemperature: z.number(), // Observed temperature °F
  gravityAt60F: z.number().optional(), // Gravity corrected to 60°F
  bsw: z.number(), // Basic Sediment & Water %
  bswFeet: z.number().optional(), // BS&W bottom measurement FT
  bswInches: z.number().optional(), // BS&W bottom measurement IN
  bswFraction: z.number().optional(), // BS&W bottom measurement FRACT

  // Bottom measurement (Enterprise style)
  bottomFeet: z.number().optional(),
  bottomInches: z.number().optional(),

  // Volumes (Government Standard per API/ASTM)
  grossBarrels: z.number().optional(),
  netBarrels: z.number().optional(),
  correctedGravity: z.number().optional(),
  correctedVolume: z.number().optional(),
  bswVolume: z.number().optional(),
  openGOV: z.number().optional(), // Government Observed Volume at open
  closeGOV: z.number().optional(), // Government Observed Volume at close
  estGOV: z.number().optional(), // Estimated GOV
  estGSV: z.number().optional(), // Estimated Gross Standard Volume
  estNSV: z.number().optional(), // Estimated Net Standard Volume

  // Quality / Content
  sulfurContent: z.number().optional(),
  ironContent: z.number().optional(),
  h2sContent: z.number().optional(),
  qualityNote: z.string().optional(), // "Good Oil", "Reject", etc.

  // Product & destination
  productType: z.string(), // "Petroleum Crude Oil" / "UN1267"
  unNumber: z.string().optional(), // UN1267
  hazmatClass: z.string().optional(), // "3"
  packingGroup: z.string().optional(), // "PG I"
  destination: z.string().optional(),
  purchaserName: z.string().optional(),

  // Seals
  sealOn: z.string().optional(),
  sealOff: z.string().optional(),
  sealNumbers: z.array(z.string()).optional(),

  // Driver ON/OFF times (Papa Trucklines style — tracks total time on job)
  driverOnTime: z.string().optional(), // e.g., "7:00 AM"
  driverOffTime: z.string().optional(), // e.g., "3:15 PM"
  driverOnDate: z.string().optional(),
  driverOffDate: z.string().optional(),

  // Arrive/Depart times (TexStar style)
  arriveOriginTime: z.string().optional(),
  departOriginTime: z.string().optional(),
  arriveDestTime: z.string().optional(),
  departDestTime: z.string().optional(),

  // Reject info
  rejectNotes: z.string().optional(),
  isReject: z.boolean().default(false),

  // Wait time
  waitNotes: z.string().optional(), // e.g., "2: Slow loading"
  waitTimeHours: z.number().optional(),

  // Signatures
  gaugerSignature: z.string().optional(), // Driver/gauger signature
  operatorWitness: z.string().optional(), // Operator's witness signature
  carrierRepSignature: z.string().optional(), // Carrier representative

  // Meta
  comment: z.string().optional(),
  isCorrection: z.boolean().default(false),
  originalTicketNumber: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function generateBOLNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const seq = Math.floor(Math.random() * 9000 + 1000);
  return `BOL-${y}${m}${d}-${seq}`;
}

function generateTicketNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const seq = Math.floor(Math.random() * 9000 + 1000);
  return `ET-${y}${m}${d}-${seq}`;
}

// Volume calculation per API/ASTM standards
function calculateVolumes(input: {
  obsGravity: number;
  obsTemperature: number;
  bsw: number;
  startingGauge?: number;
  endingGauge?: number;
  startingMeter?: number;
  endingMeter?: number;
}) {
  // Temperature correction factor (corrects to 60°F standard)
  const tempDiff = input.obsTemperature - 60;
  const tempCorrectionFactor = 1 - (0.00035 * tempDiff);
  
  // API gravity correction to 60°F
  const correctedGravity = input.obsGravity + (0.00065 * tempDiff * (141.5 / (131.5 + input.obsGravity)));
  
  // Calculate gross volume from gauge/meter readings
  let grossBarrels = 0;
  if (input.startingGauge !== undefined && input.endingGauge !== undefined) {
    // Tank strapping calculation would be applied here
    grossBarrels = Math.abs(input.startingGauge - input.endingGauge);
  } else if (input.startingMeter !== undefined && input.endingMeter !== undefined) {
    grossBarrels = Math.abs(input.endingMeter - input.startingMeter);
  }
  
  // Temperature-corrected volume
  const correctedVolume = grossBarrels * tempCorrectionFactor;
  
  // BS&W deduction
  const bswVolume = correctedVolume * (input.bsw / 100);
  const netBarrels = correctedVolume - bswVolume;
  
  return {
    grossBarrels: Math.round(grossBarrels * 100) / 100,
    correctedGravity: Math.round(correctedGravity * 10) / 10,
    correctedVolume: Math.round(correctedVolume * 100) / 100,
    bswVolume: Math.round(bswVolume * 100) / 100,
    netBarrels: Math.round(netBarrels * 100) / 100,
    tempCorrectionFactor: Math.round(tempCorrectionFactor * 10000) / 10000,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════

export const bolRouter = router({
  // ─── BOL PROCEDURES ───

  /**
   * List BOLs
   */
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const bolDocs = await db.select()
          .from(documents)
          .where(eq(documents.type, 'bol'))
          .orderBy(desc(documents.createdAt))
          .limit(input.limit);

        return bolDocs.map(d => {
          let meta: any = {};
          try { meta = typeof d.fileUrl === 'string' && d.fileUrl.startsWith('{') ? JSON.parse(d.fileUrl) : {}; } catch { meta = {}; }
          return {
            id: `bol_${d.id}`,
            number: meta.bolNumber || `BOL-${new Date().getFullYear()}-${String(d.id).padStart(4, '0')}`,
            loadNumber: meta.loadNumber || (d.loadId ? `LOAD-${d.loadId}` : 'N/A'),
            shipper: meta.shipper?.name || 'Shipper',
            catalyst: meta.catalyst?.name || 'Carrier',
            bolType: meta.type || 'standard',
            productName: meta.items?.[0]?.description || 'N/A',
            quantity: meta.items?.[0]?.quantity || 0,
            status: d.status || 'pending',
            createdAt: d.createdAt?.toISOString().split('T')[0] || '',
          };
        });
      } catch (error) {
        console.error('[BOL] list error:', error);
        return [];
      }
    }),

  /**
   * Get BOL summary stats
   */
  getSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { total: 0, pending: 0, inTransit: 0, completed: 0, thisWeek: 0, issues: 0 };

      try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [total] = await db.select({ count: sql<number>`count(*)` }).from(documents).where(eq(documents.type, 'bol'));
        const [thisWeek] = await db.select({ count: sql<number>`count(*)` }).from(documents).where(and(eq(documents.type, 'bol'), gte(documents.createdAt, weekAgo)));

        return {
          total: total?.count || 0,
          pending: 0,
          inTransit: 0,
          completed: total?.count || 0,
          thisWeek: thisWeek?.count || 0,
          issues: 0,
        };
      } catch (error) {
        console.error('[BOL] getSummary error:', error);
        return { total: 0, pending: 0, inTransit: 0, completed: 0, thisWeek: 0, issues: 0 };
      }
    }),

  /**
   * Generate BOL with AI assistance
   * Uses ESANG AI to populate hazmat info, special instructions, etc.
   */
  generate: protectedProcedure
    .input(z.object({
      // Required fields
      loadId: z.string().optional(),
      appointmentId: z.string().optional(),
      shipDate: z.string(),
      
      // Parties - can be IDs or inline objects
      shipperId: z.number().optional(),
      shipper: partySchema.optional(),
      consigneeId: z.number().optional(),
      consignee: partySchema.optional(),
      carrierId: z.number().optional(),
      carrier: partySchema.optional(),
      
      // Shipment details
      productType: z.string(), // gasoline, diesel, crude, jet_a, lpg, etc.
      productName: z.string(),
      quantity: z.number(),
      quantityUnit: z.string().default("gallons"),
      weight: z.number().optional(),
      
      // BOL type
      bolType: z.enum(["straight", "order", "hazmat", "tanker", "food_grade"]).default("straight"),
      
      // Hazmat (optional)
      hazmat: z.array(hazmatInfoSchema).optional(),
      unNumber: z.string().optional(), // For single hazmat product
      
      // Tanker info (optional)
      tankerInfo: tankerInfoSchema.optional(),
      
      // Trailer info
      trailerType: z.string().optional(),
      trailerNumber: z.string().optional(),
      sealNumber: z.string().optional(),
      
      // Charges & references
      freightCharges: z.enum(["prepaid", "collect", "third_party"]).default("prepaid"),
      poNumber: z.string().optional(),
      
      // Instructions
      specialInstructions: z.string().optional(),
      deliveryInstructions: z.string().optional(),
      
      // Use AI to enhance
      useAI: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || 'SHIPPER', companyId: (ctx.user as any)?.companyId, action: 'CREATE', resource: 'BOL' }, (ctx as any).req);
      const db = await getDb();
      const bolNumber = generateBOLNumber();
      
      // Resolve parties from IDs if provided
      let shipper = input.shipper;
      let consignee = input.consignee;
      let carrier = input.carrier;
      
      if (db) {
        if (input.shipperId && !shipper) {
          const [co] = await db.select().from(companies).where(eq(companies.id, input.shipperId)).limit(1);
          if (co) shipper = { name: co.name || "", address: co.address || "", city: co.city || "", state: co.state || "", zipCode: co.zipCode || "", phone: co.phone || undefined };
        }
        if (input.consigneeId && !consignee) {
          const [co] = await db.select().from(companies).where(eq(companies.id, input.consigneeId)).limit(1);
          if (co) consignee = { name: co.name || "", address: co.address || "", city: co.city || "", state: co.state || "", zipCode: co.zipCode || "", phone: co.phone || undefined };
        }
        if (input.carrierId && !carrier) {
          const [co] = await db.select().from(companies).where(eq(companies.id, input.carrierId)).limit(1);
          if (co) carrier = { name: co.name || "", address: co.address || "", city: co.city || "", state: co.state || "", zipCode: co.zipCode || "", phone: co.phone || undefined };
        }
      }
      
      // AI enhancement - get hazmat info if UN number provided
      let hazmatInfo = input.hazmat || [];
      let aiSpecialInstructions = input.specialInstructions;
      
      if (input.useAI && input.unNumber && hazmatInfo.length === 0) {
        try {
          // Use ESANG AI ERG lookup for hazmat info from UN number
          const ergResult = await esangAI.ergLookup({ unNumber: input.unNumber });
          const ergData = ergResult as any;
          if (ergData?.hazardClass || ergData?.message) {
            hazmatInfo = [{
              hazardClass: ergData.hazardClass || "3",
              unNumber: input.unNumber,
              packingGroup: ergData.packingGroup || "III",
              properShippingName: ergData.materialName || input.productName,
              placard: ergData.placard || "",
              emergencyPhone: "1-800-424-9300", // CHEMTREC
              ergGuideNumber: String(ergData.guideNumber || ""),
              quantity: input.quantity,
              quantityUnit: input.quantityUnit,
              containerType: input.trailerType || "tank",
              reportableQuantity: false,
            }];
            
            if (!aiSpecialInstructions) {
              aiSpecialInstructions = `HAZMAT LOAD - ERG Guide #${ergData.guideNumber || "N/A"}. ${ergData.materialName || input.productName}. Keep away from heat sources. Use appropriate PPE.`;
            }
          }
        } catch (e) {
          console.error("[BOL] AI enhancement error:", e);
        }
      }
      
      // Build BOL document
      const bolDoc = {
        bolNumber,
        loadId: input.loadId || `LOAD-${Date.now()}`,
        loadNumber: input.loadId || `LOAD-${Date.now()}`,
        type: input.bolType,
        status: "draft" as const,
        createdAt: new Date().toISOString(),
        shipDate: input.shipDate,
        shipper: shipper || { name: "", address: "", city: "", state: "", zipCode: "" },
        consignee: consignee || { name: "", address: "", city: "", state: "", zipCode: "" },
        catalyst: carrier || { name: "", address: "", city: "", state: "", zipCode: "" },
        items: [{
          quantity: input.quantity,
          quantityUnit: input.quantityUnit,
          description: input.productName,
          weight: input.weight || Math.round(input.quantity * 7), // ~7 lbs/gallon for fuel
          weightUnit: "lbs",
          hazmatClass: hazmatInfo[0]?.hazardClass,
          unNumber: hazmatInfo[0]?.unNumber,
        }],
        totalWeight: input.weight || Math.round(input.quantity * 7),
        totalPieces: 1,
        hazmat: hazmatInfo.length > 0 ? hazmatInfo : undefined,
        tankerInfo: input.tankerInfo,
        freightCharges: input.freightCharges,
        poNumber: input.poNumber,
        specialInstructions: aiSpecialInstructions,
        deliveryInstructions: input.deliveryInstructions,
        pickupConfirmed: false,
        deliveryConfirmed: false,
      };
      
      // Generate HTML for PDF
      const html = bolService.generateBOLHTML(bolDoc as any);
      
      // Store in documents table (metadata stored as JSON in fileUrl since no metadata column)
      if (db) {
        try {
          await db.insert(documents).values({
            userId: ctx.user?.id || 0,
            type: "bol",
            name: `BOL ${bolNumber}`,
            status: "active",
            fileUrl: JSON.stringify(bolDoc),
          });
        } catch (e) {
          console.error("[BOL] DB insert error:", e);
        }
      }
      
      return {
        success: true,
        bolNumber,
        bolDocument: bolDoc,
        html,
        downloadUrl: `/api/bol/${bolNumber}/download`,
      };
    }),

  // ─── EUSOTICKET (RUN TICKET) PROCEDURES ───

  /**
   * List run tickets
   */
  listRunTickets: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      driverId: z.number().optional(),
      propertyNumber: z.string().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const tickets = await db.select()
          .from(documents)
          .where(eq(documents.type, 'run_ticket'))
          .orderBy(desc(documents.createdAt))
          .limit(input.limit);

        return tickets.map(d => {
          let meta: any = {};
          try { meta = typeof d.fileUrl === 'string' && d.fileUrl.startsWith('{') ? JSON.parse(d.fileUrl) : {}; } catch { meta = {}; }
          return {
            id: d.id,
            ticketNumber: meta?.ticketNumber || `ET-${d.id}`,
            ticketDate: meta?.ticketDate || d.createdAt?.toISOString().split('T')[0],
            driverName: meta?.driverName || "Unknown",
            driverNumber: meta?.driverNumber,
            transporterName: meta?.transporterName,
            truckNumber: meta?.truckNumber,
            operatorLeasePlant: meta?.operatorLeasePlant,
            leaseNumber: meta?.leaseNumber,
            propertyName: meta?.propertyName || meta?.operatorLeasePlant || "Unknown",
            productType: meta?.productType || "Crude",
            obsGravity: meta?.obsGravity,
            bsw: meta?.bsw,
            grossBarrels: meta?.grossBarrels || 0,
            netBarrels: meta?.netBarrels || 0,
            destinationStation: meta?.destinationStation,
            destinationMiles: meta?.destinationMiles,
            qualityNote: meta?.qualityNote,
            rNumber: meta?.rNumber,
            status: d.status || "active",
          };
        });
      } catch (error) {
        console.error('[RunTicket] list error:', error);
        return [];
      }
    }),

  /**
   * Generate EusoTicket (Run Ticket)
   * Industry-standard petroleum hauling ticket with volume calculations
   */
  generateRunTicket: protectedProcedure
    .input(runTicketSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const ticketNumber = input.ticketNumber || generateTicketNumber();
      
      // Calculate volumes based on API/ASTM standards
      const volumes = calculateVolumes({
        obsGravity: input.obsGravity,
        obsTemperature: input.obsTemperature,
        bsw: input.bsw,
        startingGauge: input.startingGauge,
        endingGauge: input.endingGauge,
        startingMeter: input.startingMeter,
        endingMeter: input.endingMeter,
      });
      
      // Build run ticket document — persist ALL real-world fields
      const ticket = {
        ticketNumber,
        invoiceNumber: input.invoiceNumber,
        ticketDate: input.ticketDate,
        closingTime: input.closingTime || new Date().toISOString().split('T')[1].slice(0, 5),
        effectiveDate: calculateEffectiveDate(input.ticketDate, input.closingTime),
        
        // Driver/Transporter
        driverId: input.driverId,
        driverName: input.driverName,
        driverNumber: input.driverNumber,
        transporterName: input.transporterName,
        vehicleId: input.vehicleId,
        truckNumber: input.truckNumber,
        trailerNumber: input.trailerNumber,
        
        // Origin (Lease/Property/Plant) — full crude oil industry fields
        operatorLeasePlant: input.operatorLeasePlant,
        leasePlantName: input.leasePlantName,
        forAccountOf: input.forAccountOf,
        propertyNumber: input.propertyNumber,
        propertyName: input.propertyName,
        leaseNumber: input.leaseNumber,
        county: input.county,
        stateProvince: input.stateProvince,
        operatorName: input.operatorName,
        producerName: input.producerName,
        shipperName: input.shipperName,
        
        // Movement
        movedBy: input.movedBy,
        destinationStation: input.destinationStation,
        destinationMiles: input.destinationMiles,
        nameOfCompany: input.nameOfCompany,
        rNumber: input.rNumber,
        
        // Tank / Meter
        tankId: input.tankId,
        tankNumber: input.tankNumber,
        tankSize: input.tankSize,
        tankCapacity: input.tankCapacity,
        tankHeight: input.tankHeight,
        meterId: input.meterId,
        meterOff: input.meterOff,
        meterOn: input.meterOn,
        meterFactor: input.meterFactor,
        avgLineTemp: input.avgLineTemp,
        
        // Gauge readings (FT/IN/FRACT)
        openGauge: input.openGauge,
        closeGauge: input.closeGauge,
        highGauge: input.highGauge,
        lowGauge: input.lowGauge,
        startingGauge: input.startingGauge,
        endingGauge: input.endingGauge,
        startingMeter: input.startingMeter,
        endingMeter: input.endingMeter,
        
        // Temperatures
        openTemp: input.openTemp,
        closeTemp: input.closeTemp,
        highTemp: input.highTemp,
        lowTemp: input.lowTemp,
        
        // Observed measurements
        obsGravity: input.obsGravity,
        obsTemperature: input.obsTemperature,
        gravityAt60F: input.gravityAt60F,
        bsw: input.bsw,
        bswFeet: input.bswFeet,
        bswInches: input.bswInches,
        bswFraction: input.bswFraction,
        bottomFeet: input.bottomFeet,
        bottomInches: input.bottomInches,
        
        // Calculated volumes (API/ASTM)
        ...volumes,
        // Override with user-provided if present
        grossBarrels: input.grossBarrels || volumes.grossBarrels,
        netBarrels: input.netBarrels || volumes.netBarrels,
        openGOV: input.openGOV,
        closeGOV: input.closeGOV,
        estGOV: input.estGOV,
        estGSV: input.estGSV,
        estNSV: input.estNSV,
        
        // Quality
        sulfurContent: input.sulfurContent,
        ironContent: input.ironContent,
        h2sContent: input.h2sContent,
        qualityNote: input.qualityNote,
        
        // Product & destination
        productType: input.productType,
        unNumber: input.unNumber,
        hazmatClass: input.hazmatClass,
        packingGroup: input.packingGroup,
        destination: input.destination,
        purchaserName: input.purchaserName,
        
        // Seals
        sealOn: input.sealOn,
        sealOff: input.sealOff,
        sealNumbers: input.sealNumbers,
        
        // Driver ON/OFF times
        driverOnTime: input.driverOnTime,
        driverOffTime: input.driverOffTime,
        driverOnDate: input.driverOnDate,
        driverOffDate: input.driverOffDate,
        
        // Arrive/Depart times
        arriveOriginTime: input.arriveOriginTime,
        departOriginTime: input.departOriginTime,
        arriveDestTime: input.arriveDestTime,
        departDestTime: input.departDestTime,
        
        // Wait / Reject
        waitNotes: input.waitNotes,
        waitTimeHours: input.waitTimeHours,
        rejectNotes: input.rejectNotes,
        isReject: input.isReject,
        
        // Signatures
        gaugerSignature: input.gaugerSignature,
        operatorWitness: input.operatorWitness,
        carrierRepSignature: input.carrierRepSignature,
        
        // Meta
        comment: input.comment,
        isCorrection: input.isCorrection,
        originalTicketNumber: input.originalTicketNumber,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.id,
      };
      
      // Generate ticket HTML
      const html = generateRunTicketHTML(ticket);
      
      // Store in documents table (metadata stored as JSON in fileUrl since no metadata column)
      if (db) {
        try {
          await db.insert(documents).values({
            userId: ctx.user?.id || 0,
            type: "run_ticket",
            name: `Run Ticket ${ticketNumber}`,
            status: "active",
            fileUrl: JSON.stringify(ticket),
          });
        } catch (e) {
          console.error("[RunTicket] DB insert error:", e);
        }
      }
      
      return {
        success: true,
        ticketNumber,
        ticket,
        html,
        downloadUrl: `/api/run-ticket/${ticketNumber}/download`,
      };
    }),

  /**
   * Calculate volumes for run ticket (preview)
   */
  calculateRunTicketVolumes: protectedProcedure
    .input(z.object({
      obsGravity: z.number(),
      obsTemperature: z.number(),
      bsw: z.number(),
      startingGauge: z.number().optional(),
      endingGauge: z.number().optional(),
      startingMeter: z.number().optional(),
      endingMeter: z.number().optional(),
    }))
    .query(({ input }) => {
      return calculateVolumes(input);
    }),

  /**
   * DYNAMIC COMPLETION TICKET — generates the right document type per cargo/trailer type
   *
   * Tanker (liquid/petroleum/chemicals/gas) → Run Ticket (gauging, BS&W, API gravity, barrels)
   * Dry Van (general)                       → Delivery Receipt (piece count, weight, pallets)
   * Reefer (refrigerated)                   → Delivery Receipt + Temperature Log
   * Flatbed (oversized)                     → Delivery Receipt + Dimensions + Securement
   * Hazmat (any trailer)                    → Enhanced receipt with hazmat compliance fields
   *
   * Called after load delivery is confirmed.
   */
  generateCompletionTicket: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      // Common fields
      driverName: z.string().optional(),
      driverId: z.number().optional(),
      carrierName: z.string().optional(),
      origin: z.string().optional(),
      destination: z.string().optional(),
      miles: z.coerce.number().optional(),
      arriveTime: z.string().optional(),
      departTime: z.string().optional(),
      waitTimeHours: z.coerce.number().optional(),
      sealNumbers: z.array(z.string()).optional(),
      comment: z.string().optional(),
      driverSignature: z.string().optional(),
      receiverSignature: z.string().optional(),

      // ── Tanker / Liquid fields (petroleum, chemicals, liquid, gas) ──
      obsGravity: z.coerce.number().optional(),
      obsTemperature: z.coerce.number().optional(),
      bsw: z.coerce.number().optional(),
      grossBarrels: z.coerce.number().optional(),
      netBarrels: z.coerce.number().optional(),
      startingGauge: z.coerce.number().optional(),
      endingGauge: z.coerce.number().optional(),
      tankNumber: z.string().optional(),
      productName: z.string().optional(),
      sulfurContent: z.coerce.number().optional(),
      h2sContent: z.coerce.number().optional(),

      // ── Dry Van / General fields ──
      pieceCount: z.coerce.number().optional(),
      palletCount: z.coerce.number().optional(),
      totalWeight: z.coerce.number().optional(),
      weightUnit: z.string().optional(),
      itemDescription: z.string().optional(),
      poNumber: z.string().optional(),
      receivedInGoodCondition: z.boolean().optional(),
      damageNotes: z.string().optional(),
      shortageNotes: z.string().optional(),

      // ── Reefer / Refrigerated fields ──
      setTemperature: z.coerce.number().optional(),
      tempUnit: z.string().optional(),
      tempAtPickup: z.coerce.number().optional(),
      tempAtDelivery: z.coerce.number().optional(),
      tempReadings: z.array(z.object({
        time: z.string(),
        temp: z.number(),
        location: z.string().optional(),
      })).optional(),
      continuousTempLog: z.boolean().optional(),
      productIntegrity: z.boolean().optional(),

      // ── Flatbed / Oversized fields ──
      dimensions: z.object({
        length: z.number(),
        width: z.number(),
        height: z.number(),
        unit: z.string().default("ft"),
      }).optional(),
      overweightPermit: z.string().optional(),
      oversizePermit: z.string().optional(),
      securementMethod: z.string().optional(),
      tieDownCount: z.coerce.number().optional(),
      tarpRequired: z.boolean().optional(),
      tarpApplied: z.boolean().optional(),
      escortRequired: z.boolean().optional(),

      // ── Hazmat overlay (any trailer type) ──
      hazmatClass: z.string().optional(),
      unNumber: z.string().optional(),
      packingGroup: z.string().optional(),
      emergencyPhone: z.string().optional(),
      placardApplied: z.boolean().optional(),
      spillKitVerified: z.boolean().optional(),
      ppeUsed: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Fetch load to determine cargo type
      const [load] = await db.select().from(loads)
        .where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new Error("Load not found");

      const cargoType = load.cargoType || "general";
      const ticketNumber = generateTicketNumber();
      const now = new Date().toISOString();

      // Determine document subtype based on cargo
      const isLiquid = ["liquid", "petroleum", "chemicals", "gas"].includes(cargoType);
      const isReefer = cargoType === "refrigerated";
      const isFlatbed = cargoType === "oversized";
      const isHazmat = cargoType === "hazmat" || !!input.hazmatClass;

      let docSubtype = "delivery_receipt";
      if (isLiquid) docSubtype = "run_ticket";
      else if (isReefer) docSubtype = "temp_delivery_receipt";
      else if (isFlatbed) docSubtype = "oversize_delivery_receipt";
      if (isHazmat) docSubtype = docSubtype === "run_ticket" ? "hazmat_run_ticket" : "hazmat_delivery_receipt";

      // Build the universal ticket document
      const ticket: any = {
        ticketNumber,
        docSubtype,
        cargoType,
        loadId: input.loadId,
        loadNumber: load.loadNumber,
        commodityName: load.commodityName || input.productName || null,
        createdAt: now,
        createdBy: ctx.user?.id,

        // Common
        driverName: input.driverName || null,
        driverId: input.driverId || null,
        carrierName: input.carrierName || null,
        origin: input.origin || (load.pickupLocation as any)?.address || null,
        destination: input.destination || (load.deliveryLocation as any)?.address || null,
        miles: input.miles || (load.distance ? Number(load.distance) : null),
        arriveTime: input.arriveTime || null,
        departTime: input.departTime || null,
        waitTimeHours: input.waitTimeHours || 0,
        sealNumbers: input.sealNumbers || [],
        comment: input.comment || null,
        driverSignature: input.driverSignature || null,
        receiverSignature: input.receiverSignature || null,
      };

      // ── Liquid/Tanker fields ──
      if (isLiquid) {
        const volumes = (input.obsGravity && input.obsTemperature && input.bsw !== undefined)
          ? calculateVolumes({
              obsGravity: input.obsGravity,
              obsTemperature: input.obsTemperature,
              bsw: input.bsw,
              startingGauge: input.startingGauge,
              endingGauge: input.endingGauge,
            })
          : null;

        Object.assign(ticket, {
          obsGravity: input.obsGravity,
          obsTemperature: input.obsTemperature,
          bsw: input.bsw,
          grossBarrels: input.grossBarrels || volumes?.grossBarrels || 0,
          netBarrels: input.netBarrels || volumes?.netBarrels || 0,
          correctedGravity: volumes?.correctedGravity,
          correctedVolume: volumes?.correctedVolume,
          bswVolume: volumes?.bswVolume,
          tempCorrectionFactor: volumes?.tempCorrectionFactor,
          startingGauge: input.startingGauge,
          endingGauge: input.endingGauge,
          tankNumber: input.tankNumber,
          productName: input.productName || load.commodityName,
          sulfurContent: input.sulfurContent,
          h2sContent: input.h2sContent,
          volumeUnit: "BBL",
        });
      }

      // ── Dry Van / General fields ──
      if (!isLiquid) {
        Object.assign(ticket, {
          pieceCount: input.pieceCount || 0,
          palletCount: input.palletCount || 0,
          totalWeight: input.totalWeight || (load.weight ? Number(load.weight) : 0),
          weightUnit: input.weightUnit || load.weightUnit || "lbs",
          itemDescription: input.itemDescription || load.commodityName || null,
          poNumber: input.poNumber || null,
          receivedInGoodCondition: input.receivedInGoodCondition ?? true,
          damageNotes: input.damageNotes || null,
          shortageNotes: input.shortageNotes || null,
        });
      }

      // ── Reefer fields ──
      if (isReefer) {
        Object.assign(ticket, {
          setTemperature: input.setTemperature,
          tempUnit: input.tempUnit || "F",
          tempAtPickup: input.tempAtPickup,
          tempAtDelivery: input.tempAtDelivery,
          tempReadings: input.tempReadings || [],
          continuousTempLog: input.continuousTempLog ?? false,
          productIntegrity: input.productIntegrity ?? true,
        });
      }

      // ── Flatbed / Oversized fields ──
      if (isFlatbed) {
        Object.assign(ticket, {
          dimensions: input.dimensions || null,
          overweightPermit: input.overweightPermit || null,
          oversizePermit: input.oversizePermit || null,
          securementMethod: input.securementMethod || null,
          tieDownCount: input.tieDownCount || 0,
          tarpRequired: input.tarpRequired ?? false,
          tarpApplied: input.tarpApplied ?? false,
          escortRequired: input.escortRequired ?? false,
        });
      }

      // ── Hazmat overlay ──
      if (isHazmat) {
        Object.assign(ticket, {
          hazmatClass: input.hazmatClass || load.hazmatClass || null,
          unNumber: input.unNumber || load.unNumber || null,
          packingGroup: input.packingGroup || null,
          emergencyPhone: input.emergencyPhone || "1-800-424-9300",
          placardApplied: input.placardApplied ?? true,
          spillKitVerified: input.spillKitVerified ?? true,
          ppeUsed: input.ppeUsed ?? true,
        });
      }

      // Store in documents table
      try {
        await db.insert(documents).values({
          userId: ctx.user?.id || 0,
          companyId: ctx.user?.companyId || 0,
          loadId: input.loadId,
          type: "run_ticket",
          name: `${isLiquid ? "Run Ticket" : isReefer ? "Temp Delivery Receipt" : isFlatbed ? "Oversize Delivery Receipt" : "Delivery Receipt"} ${ticketNumber}`,
          status: "active",
          fileUrl: JSON.stringify(ticket),
        } as any);
      } catch (e) {
        console.error("[CompletionTicket] DB insert error:", e);
      }

      return {
        success: true,
        ticketNumber,
        docSubtype,
        cargoType,
        ticket,
      };
    }),

  /**
   * AUTO-GENERATE BOL FROM LOAD — called when a load is created/assigned
   * Dynamic per cargo type: tanker BOL, standard BOL, hazmat BOL, reefer BOL, oversize BOL
   */
  generateBOLFromLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [load] = await db.select().from(loads)
        .where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new Error("Load not found");

      // Resolve shipper info
      let shipperName = "Shipper";
      if (load.shipperId) {
        try {
          const [u] = await db.select().from(users).where(eq(users.id, load.shipperId)).limit(1);
          if (u) shipperName = u.name || "Shipper";
        } catch {}
      }

      // Resolve driver/carrier info
      let driverName = "Driver";
      if (load.driverId) {
        try {
          const [u] = await db.select().from(users).where(eq(users.id, load.driverId)).limit(1);
          if (u) driverName = u.name || "Driver";
        } catch {}
      }

      const cargoType = load.cargoType || "general";
      const isLiquid = ["liquid", "petroleum", "chemicals", "gas"].includes(cargoType);
      const isHazmat = cargoType === "hazmat";
      const isReefer = cargoType === "refrigerated";
      const bolNumber = generateBOLNumber();
      const pickup = load.pickupLocation as any;
      const delivery = load.deliveryLocation as any;

      const bolType = isHazmat ? "hazmat" : isLiquid ? "tanker" : "straight";

      const bolDoc: any = {
        bolNumber,
        loadId: load.id,
        loadNumber: load.loadNumber,
        type: bolType,
        cargoType,
        status: "active",
        createdAt: new Date().toISOString(),
        shipDate: load.pickupDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
        shipper: { name: shipperName, address: pickup?.address || "", city: pickup?.city || "", state: pickup?.state || "", zipCode: pickup?.zipCode || "" },
        consignee: { name: "", address: delivery?.address || "", city: delivery?.city || "", state: delivery?.state || "", zipCode: delivery?.zipCode || "" },
        catalyst: { name: driverName },
        commodityName: load.commodityName || null,
        weight: load.weight ? Number(load.weight) : null,
        weightUnit: load.weightUnit || "lbs",
        volume: load.volume ? Number(load.volume) : null,
        volumeUnit: load.volumeUnit || "gal",
        distance: load.distance ? Number(load.distance) : null,
        specialInstructions: load.specialInstructions || null,
      };

      // Liquid-specific fields
      if (isLiquid) {
        bolDoc.productType = load.commodityName || "Petroleum Product";
        bolDoc.quantityUnit = "gallons";
      }

      // Hazmat fields
      if (isHazmat) {
        bolDoc.hazmatClass = load.hazmatClass || null;
        bolDoc.unNumber = load.unNumber || null;
        bolDoc.emergencyPhone = "1-800-424-9300";
      }

      // Reefer fields
      if (isReefer) {
        bolDoc.temperatureRequirements = "Maintain required temperature per shipper instructions";
      }

      // Store
      try {
        await db.insert(documents).values({
          userId: ctx.user?.id || 0,
          companyId: ctx.user?.companyId || 0,
          loadId: load.id,
          type: "bol",
          name: `BOL ${bolNumber} - ${load.loadNumber}`,
          status: "active",
          fileUrl: JSON.stringify(bolDoc),
        } as any);
      } catch (e) {
        console.error("[BOL] auto-generate from load error:", e);
      }

      return { success: true, bolNumber, bolType, cargoType, loadNumber: load.loadNumber };
    }),
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

// Calculate effective date based on 7AM cutoff (industry standard)
function calculateEffectiveDate(ticketDate: string, closingTime?: string): string {
  const date = new Date(ticketDate);
  if (closingTime) {
    const [hours] = closingTime.split(":").map(Number);
    // If before 7AM, it belongs to previous day
    if (hours < 7) {
      date.setDate(date.getDate() - 1);
    }
  }
  return date.toISOString().split("T")[0];
}

// Generate Run Ticket HTML
function generateRunTicketHTML(ticket: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Run Ticket - ${ticket.ticketNumber}</title>
  <style>
    body { font-family: 'Courier New', monospace; font-size: 11pt; margin: 20px; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
    .title { font-size: 18pt; font-weight: bold; }
    .ticket-number { font-size: 14pt; margin-top: 5px; }
    .section { border: 1px solid #000; margin-bottom: 10px; padding: 10px; }
    .section-title { font-weight: bold; background: #e0e0e0; padding: 5px; margin: -10px -10px 10px -10px; text-transform: uppercase; }
    .row { display: flex; margin-bottom: 5px; }
    .col { flex: 1; }
    .col-2 { flex: 2; }
    .label { font-weight: bold; display: inline-block; min-width: 120px; }
    .value { display: inline-block; border-bottom: 1px solid #999; min-width: 100px; padding: 0 5px; }
    .measurements { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .totals { background: #f5f5f5; padding: 10px; margin-top: 10px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #999; }
    .totals-row:last-child { border-bottom: none; font-weight: bold; font-size: 14pt; }
    .footer { margin-top: 20px; font-size: 9pt; text-align: center; color: #666; }
    .signature-row { display: flex; margin-top: 20px; gap: 20px; }
    .signature-box { flex: 1; }
    .signature-line { border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px; }
    ${ticket.isCorrection ? '.correction-banner { background: #ffeb3b; padding: 10px; text-align: center; font-weight: bold; margin-bottom: 10px; }' : ''}
  </style>
</head>
<body>
  ${ticket.isCorrection ? `<div class="correction-banner">⚠️ CORRECTION TICKET - Original: ${ticket.originalTicketNumber}</div>` : ''}
  
  <div class="header">
    <div class="title">EUSOTICKET™ RUN TICKET</div>
    <div class="ticket-number">Ticket #: ${ticket.ticketNumber}</div>
    <div>Date: ${new Date(ticket.ticketDate).toLocaleDateString()} | Time: ${ticket.closingTime || 'N/A'}</div>
    <div>Effective Date: ${ticket.effectiveDate}</div>
  </div>

  <div class="row">
    <div class="col section">
      <div class="section-title">Driver / Transporter</div>
      <div><span class="label">Driver:</span> <span class="value">${ticket.driverName || 'N/A'}</span></div>
      <div><span class="label">Transporter:</span> <span class="value">${ticket.transporterName || 'N/A'}</span></div>
      <div><span class="label">Trailer #:</span> <span class="value">${ticket.trailerNumber || 'N/A'}</span></div>
    </div>
    <div class="col section">
      <div class="section-title">Origin / Lease</div>
      <div><span class="label">Property #:</span> <span class="value">${ticket.propertyNumber || 'N/A'}</span></div>
      <div><span class="label">Property Name:</span> <span class="value">${ticket.propertyName || 'N/A'}</span></div>
      <div><span class="label">Tank/Meter:</span> <span class="value">${ticket.tankId || ticket.meterId || 'N/A'}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Product & Destination</div>
    <div class="row">
      <div class="col"><span class="label">Product:</span> <span class="value">${ticket.productType}</span></div>
      <div class="col"><span class="label">Purchaser:</span> <span class="value">${ticket.purchaserName || 'N/A'}</span></div>
    </div>
    <div><span class="label">Destination:</span> <span class="value">${ticket.destination || 'N/A'}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Measurements</div>
    <div class="measurements">
      <div>
        <div><span class="label">Observed Gravity:</span> <span class="value">${ticket.obsGravity}° API</span></div>
        <div><span class="label">Observed Temp:</span> <span class="value">${ticket.obsTemperature}°F</span></div>
        <div><span class="label">BS&W:</span> <span class="value">${ticket.bsw}%</span></div>
      </div>
      <div>
        <div><span class="label">Starting Gauge:</span> <span class="value">${ticket.startingGauge ?? ticket.startingMeter ?? 'N/A'}</span></div>
        <div><span class="label">Ending Gauge:</span> <span class="value">${ticket.endingGauge ?? ticket.endingMeter ?? 'N/A'}</span></div>
        <div><span class="label">Seal #:</span> <span class="value">${ticket.sealNumbers?.join(', ') || 'N/A'}</span></div>
      </div>
    </div>
    ${ticket.sulfurContent || ticket.ironContent || ticket.h2sContent ? `
    <div style="margin-top: 10px; border-top: 1px dashed #999; padding-top: 10px;">
      ${ticket.sulfurContent ? `<span class="label">Sulfur:</span> <span class="value">${ticket.sulfurContent}%</span>` : ''}
      ${ticket.ironContent ? `<span class="label">Iron:</span> <span class="value">${ticket.ironContent} ppm</span>` : ''}
      ${ticket.h2sContent ? `<span class="label">H₂S:</span> <span class="value">${ticket.h2sContent} ppm</span>` : ''}
    </div>
    ` : ''}
  </div>

  <div class="section">
    <div class="section-title">Volume Calculations</div>
    <div class="totals">
      <div class="totals-row"><span>Gross Volume:</span><span>${ticket.grossBarrels?.toFixed(2) || '0.00'} BBL</span></div>
      <div class="totals-row"><span>Temp Correction Factor:</span><span>${ticket.tempCorrectionFactor?.toFixed(4) || '1.0000'}</span></div>
      <div class="totals-row"><span>Corrected Gravity:</span><span>${ticket.correctedGravity?.toFixed(1) || ticket.obsGravity}° API</span></div>
      <div class="totals-row"><span>Corrected Volume:</span><span>${ticket.correctedVolume?.toFixed(2) || '0.00'} BBL</span></div>
      <div class="totals-row"><span>BS&W Deduction (${ticket.bsw}%):</span><span>-${ticket.bswVolume?.toFixed(2) || '0.00'} BBL</span></div>
      <div class="totals-row"><span>NET BARRELS:</span><span>${ticket.netBarrels?.toFixed(2) || '0.00'} BBL</span></div>
    </div>
  </div>

  ${ticket.comment ? `
  <div class="section">
    <div class="section-title">Comments</div>
    <div>${ticket.comment}</div>
  </div>
  ` : ''}

  <div class="signature-row">
    <div class="signature-box">
      <div class="signature-line"></div>
      <div>Gauger / Operator Signature</div>
    </div>
    <div class="signature-box">
      <div class="signature-line"></div>
      <div>Driver Signature</div>
    </div>
  </div>

  <div class="footer">
    <p>This run ticket certifies that the above measurements and calculations are accurate to the best of our knowledge.</p>
    <p>Generated by EusoTrip EusoTicket™ System | ${new Date().toISOString()}</p>
  </div>
</body>
</html>
  `;
}
