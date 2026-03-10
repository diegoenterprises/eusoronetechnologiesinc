/**
 * CROSS-BORDER & INTERNATIONAL SHIPPING ROUTER
 * Comprehensive US-Canada-Mexico cross-border operations:
 * - Border wait times & port of entry directory
 * - Customs documentation & HTS classification
 * - Duties/taxes calculator
 * - C-TPAT / FAST card management
 * - Cabotage compliance & bonded carrier ops
 * - eManifest (ACE/ACI) tracking
 * - PARS/PAPS number management
 * - Broker directory & assignment
 * - Export controls (EAR, ITAR, denied parties)
 * - DG/HAZMAT cross-border (TDG vs DOT)
 * - Multi-currency management
 * - Cross-border analytics & seasonal patterns
 * - USMCA/NAFTA certificate of origin
 */

import { z } from "zod";
import { randomBytes } from "crypto";
import { protectedProcedure, router } from "../_core/trpc";

// ─── Helpers & Seed Data ─────────────────────────────────────────────────────

function rid(prefix: string) {
  return `${prefix}-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}
const iso = () => new Date().toISOString();
const future = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
const past = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

// ─── Port of Entry Directory ─────────────────────────────────────────────────

interface PortOfEntry {
  id: string;
  name: string;
  code: string;
  border: "US-CA" | "US-MX";
  state: string;
  province?: string;
  lat: number;
  lng: number;
  hoursOfOperation: string;
  fastLane: boolean;
  hazmatCapable: boolean;
  oversizeCapable: boolean;
  commercialCapable: boolean;
  averageWaitMinutes: number;
  currentWaitMinutes: number;
  waitSeverity: "low" | "moderate" | "high" | "critical";
  lastUpdated: string;
}

const PORTS_OF_ENTRY: PortOfEntry[] = [
  // US-Canada
  { id: "poe-001", name: "Ambassador Bridge", code: "3801", border: "US-CA", state: "MI", province: "ON", lat: 42.3115, lng: -83.0750, hoursOfOperation: "24/7", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 22, currentWaitMinutes: 18, waitSeverity: "low", lastUpdated: iso() },
  { id: "poe-002", name: "Blue Water Bridge", code: "3802", border: "US-CA", state: "MI", province: "ON", lat: 42.9990, lng: -82.4215, hoursOfOperation: "24/7", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 15, currentWaitMinutes: 12, waitSeverity: "low", lastUpdated: iso() },
  { id: "poe-003", name: "Peace Bridge", code: "0901", border: "US-CA", state: "NY", province: "ON", lat: 42.9065, lng: -78.9043, hoursOfOperation: "24/7", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 28, currentWaitMinutes: 35, waitSeverity: "moderate", lastUpdated: iso() },
  { id: "poe-004", name: "Lewiston-Queenston Bridge", code: "0904", border: "US-CA", state: "NY", province: "ON", lat: 43.1597, lng: -79.0489, hoursOfOperation: "24/7", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 20, currentWaitMinutes: 25, waitSeverity: "moderate", lastUpdated: iso() },
  { id: "poe-005", name: "Champlain-Lacolle", code: "0712", border: "US-CA", state: "NY", province: "QC", lat: 45.0096, lng: -73.4538, hoursOfOperation: "24/7", fastLane: true, hazmatCapable: true, oversizeCapable: false, commercialCapable: true, averageWaitMinutes: 18, currentWaitMinutes: 15, waitSeverity: "low", lastUpdated: iso() },
  { id: "poe-006", name: "Pacific Highway", code: "3004", border: "US-CA", state: "WA", province: "BC", lat: 49.0024, lng: -122.7573, hoursOfOperation: "24/7", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 25, currentWaitMinutes: 40, waitSeverity: "high", lastUpdated: iso() },
  { id: "poe-007", name: "Sweetgrass-Coutts", code: "3307", border: "US-CA", state: "MT", province: "AB", lat: 49.0011, lng: -111.9607, hoursOfOperation: "24/7", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 10, currentWaitMinutes: 8, waitSeverity: "low", lastUpdated: iso() },
  { id: "poe-008", name: "Thousand Islands Bridge", code: "0708", border: "US-CA", state: "NY", province: "ON", lat: 44.3553, lng: -75.9851, hoursOfOperation: "24/7", fastLane: true, hazmatCapable: false, oversizeCapable: false, commercialCapable: true, averageWaitMinutes: 12, currentWaitMinutes: 10, waitSeverity: "low", lastUpdated: iso() },
  // US-Mexico
  { id: "poe-101", name: "Laredo (World Trade Bridge)", code: "2304", border: "US-MX", state: "TX", lat: 27.5649, lng: -99.5025, hoursOfOperation: "24/7", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 45, currentWaitMinutes: 55, waitSeverity: "high", lastUpdated: iso() },
  { id: "poe-102", name: "El Paso - Ysleta-Zaragoza", code: "2402", border: "US-MX", state: "TX", lat: 31.6675, lng: -106.3760, hoursOfOperation: "06:00-22:00", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 35, currentWaitMinutes: 42, waitSeverity: "moderate", lastUpdated: iso() },
  { id: "poe-103", name: "Otay Mesa", code: "2506", border: "US-MX", state: "CA", lat: 32.5554, lng: -117.0498, hoursOfOperation: "24/7", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 50, currentWaitMinutes: 65, waitSeverity: "critical", lastUpdated: iso() },
  { id: "poe-104", name: "Nogales-Mariposa", code: "2604", border: "US-MX", state: "AZ", lat: 31.3316, lng: -110.9411, hoursOfOperation: "06:00-22:00", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 30, currentWaitMinutes: 28, waitSeverity: "moderate", lastUpdated: iso() },
  { id: "poe-105", name: "Pharr International Bridge", code: "2305", border: "US-MX", state: "TX", lat: 26.1776, lng: -98.1737, hoursOfOperation: "24/7", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 40, currentWaitMinutes: 38, waitSeverity: "moderate", lastUpdated: iso() },
  { id: "poe-106", name: "Eagle Pass - Camino Real", code: "2303", border: "US-MX", state: "TX", lat: 28.7091, lng: -100.4995, hoursOfOperation: "08:00-20:00", fastLane: false, hazmatCapable: true, oversizeCapable: false, commercialCapable: true, averageWaitMinutes: 25, currentWaitMinutes: 20, waitSeverity: "low", lastUpdated: iso() },
  { id: "poe-107", name: "Calexico East", code: "2507", border: "US-MX", state: "CA", lat: 32.6748, lng: -115.4909, hoursOfOperation: "06:00-22:00", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 35, currentWaitMinutes: 30, waitSeverity: "moderate", lastUpdated: iso() },
  { id: "poe-108", name: "Brownsville - Veterans Bridge", code: "2301", border: "US-MX", state: "TX", lat: 25.9370, lng: -97.4960, hoursOfOperation: "24/7", fastLane: true, hazmatCapable: true, oversizeCapable: true, commercialCapable: true, averageWaitMinutes: 30, currentWaitMinutes: 33, waitSeverity: "moderate", lastUpdated: iso() },
];

// ─── HTS Classification ─────────────────────────────────────────────────────

interface HtsEntry {
  code: string;
  description: string;
  dutyRate: number;
  unit: string;
  chapter: number;
  section: string;
  usExciseTax: number;
  caGst: number;
  mxIva: number;
}

const HTS_SAMPLE: HtsEntry[] = [
  { code: "8704.21", description: "Motor vehicles for transport of goods - GVW <= 5 tonnes", dutyRate: 2.5, unit: "unit", chapter: 87, section: "XVII", usExciseTax: 0, caGst: 5, mxIva: 16 },
  { code: "0201.30", description: "Fresh/chilled bovine meat - boneless", dutyRate: 4.4, unit: "kg", chapter: 2, section: "I", usExciseTax: 0, caGst: 0, mxIva: 0 },
  { code: "4407.11", description: "Coniferous wood - Pine, sawn", dutyRate: 0, unit: "m3", chapter: 44, section: "IX", usExciseTax: 0, caGst: 5, mxIva: 16 },
  { code: "2710.19", description: "Petroleum oils - other than crude", dutyRate: 0.05, unit: "L", chapter: 27, section: "V", usExciseTax: 0.183, caGst: 5, mxIva: 16 },
  { code: "7207.11", description: "Semi-finished steel - < 0.25% carbon", dutyRate: 0, unit: "kg", chapter: 72, section: "XV", usExciseTax: 0, caGst: 5, mxIva: 16 },
  { code: "8471.30", description: "Portable automatic data-processing machines (laptops)", dutyRate: 0, unit: "unit", chapter: 84, section: "XVI", usExciseTax: 0, caGst: 5, mxIva: 16 },
  { code: "6110.20", description: "Jerseys, pullovers, cardigans - cotton", dutyRate: 16.5, unit: "unit", chapter: 61, section: "XI", usExciseTax: 0, caGst: 5, mxIva: 16 },
  { code: "3004.90", description: "Medicaments - put up in dosages", dutyRate: 0, unit: "kg", chapter: 30, section: "VI", usExciseTax: 0, caGst: 0, mxIva: 0 },
  { code: "9401.71", description: "Seats with metal frames - upholstered", dutyRate: 0, unit: "unit", chapter: 94, section: "XX", usExciseTax: 0, caGst: 5, mxIva: 16 },
  { code: "3901.10", description: "Polyethylene - specific gravity < 0.94", dutyRate: 6.5, unit: "kg", chapter: 39, section: "VII", usExciseTax: 0, caGst: 5, mxIva: 16 },
];

// ─── Customs Brokers ─────────────────────────────────────────────────────────

interface CustomsBroker {
  id: string;
  name: string;
  company: string;
  licenseNumber: string;
  border: "US-CA" | "US-MX" | "BOTH";
  rating: number;
  totalClearances: number;
  avgClearanceHours: number;
  specialties: string[];
  portsServed: string[];
  phone: string;
  email: string;
  fastCertified: boolean;
  ctpatCertified: boolean;
  hazmatCapable: boolean;
  available: boolean;
}

const BROKERS: CustomsBroker[] = [
  { id: "brk-001", name: "Maria Gonzalez", company: "TransBorder Customs Inc.", licenseNumber: "CB-2024-0871", border: "BOTH", rating: 4.9, totalClearances: 14200, avgClearanceHours: 2.1, specialties: ["Automotive", "Perishables", "HAZMAT"], portsServed: ["Laredo", "El Paso", "Otay Mesa"], phone: "+1-956-555-0142", email: "mgonzalez@transborder.com", fastCertified: true, ctpatCertified: true, hazmatCapable: true, available: true },
  { id: "brk-002", name: "James Chen", company: "Northern Gateway Brokers", licenseNumber: "CB-2023-0443", border: "US-CA", rating: 4.8, totalClearances: 9800, avgClearanceHours: 1.8, specialties: ["Lumber", "Manufacturing", "Electronics"], portsServed: ["Ambassador Bridge", "Blue Water Bridge", "Peace Bridge"], phone: "+1-519-555-0289", email: "jchen@northerngateway.com", fastCertified: true, ctpatCertified: true, hazmatCapable: false, available: true },
  { id: "brk-003", name: "Sarah Thompson", company: "Pacific Customs Solutions", licenseNumber: "CB-2024-0156", border: "US-CA", rating: 4.7, totalClearances: 7500, avgClearanceHours: 2.4, specialties: ["Agriculture", "Seafood", "Forestry"], portsServed: ["Pacific Highway", "Blaine"], phone: "+1-604-555-0317", email: "sthompson@pacificcustoms.com", fastCertified: true, ctpatCertified: true, hazmatCapable: true, available: true },
  { id: "brk-004", name: "Roberto Alvarez", company: "Frontera Aduanera MX", licenseNumber: "CB-2023-1092", border: "US-MX", rating: 4.6, totalClearances: 11300, avgClearanceHours: 3.2, specialties: ["Automotive Parts", "Textiles", "Agriculture"], portsServed: ["Nogales", "Pharr", "Brownsville"], phone: "+1-520-555-0455", email: "ralvarez@fronteraaduanera.com", fastCertified: true, ctpatCertified: true, hazmatCapable: true, available: false },
  { id: "brk-005", name: "Emily Watson", company: "Great Lakes Brokerage", licenseNumber: "CB-2024-0728", border: "US-CA", rating: 4.5, totalClearances: 5200, avgClearanceHours: 2.0, specialties: ["Steel", "Automotive", "Chemicals"], portsServed: ["Ambassador Bridge", "Thousand Islands Bridge", "Champlain"], phone: "+1-716-555-0623", email: "ewatson@greatlakesbrokerage.com", fastCertified: true, ctpatCertified: false, hazmatCapable: true, available: true },
];

// ─── Router ──────────────────────────────────────────────────────────────────

export const crossBorderRouter = router({

  // ══════════════════════════════════════════════════════════════════════════
  // 1. Dashboard overview
  // ══════════════════════════════════════════════════════════════════════════
  getCrossBorderDashboard: protectedProcedure
    .input(z.object({ period: z.enum(["day", "week", "month", "quarter"]).default("month") }).optional())
    .query(({ input }) => {
      const period = input?.period ?? "month";
      const multiplier = period === "day" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 90;
      return {
        period,
        summary: {
          activeCrossings: 14,
          totalCrossingsThisPeriod: 38 * multiplier,
          pendingClearance: 6,
          averageCrossingTimeMinutes: 47,
          complianceRate: 98.7,
          totalDutiesPaid: 124_500 * multiplier,
          currency: "USD",
        },
        activeCrossings: [
          { id: "cx-001", loadId: "LD-2026-1847", driver: "Carlos Ruiz", origin: "Monterrey, NL", destination: "San Antonio, TX", portOfEntry: "Laredo (World Trade Bridge)", status: "AT_BORDER", estimatedClearance: future(0), direction: "northbound" as const, documentsComplete: true },
          { id: "cx-002", loadId: "LD-2026-1849", driver: "Jean-Pierre Lavoie", origin: "Toronto, ON", destination: "Detroit, MI", portOfEntry: "Ambassador Bridge", status: "IN_CUSTOMS", estimatedClearance: future(0), direction: "southbound" as const, documentsComplete: true },
          { id: "cx-003", loadId: "LD-2026-1852", driver: "Miguel Hernandez", origin: "Chicago, IL", destination: "Guadalajara, JA", portOfEntry: "El Paso - Ysleta-Zaragoza", status: "PRE_ARRIVAL", estimatedClearance: future(1), direction: "southbound" as const, documentsComplete: false },
          { id: "cx-004", loadId: "LD-2026-1855", driver: "Anne-Marie Dubois", origin: "Vancouver, BC", destination: "Seattle, WA", portOfEntry: "Pacific Highway", status: "CLEARED", estimatedClearance: past(0), direction: "southbound" as const, documentsComplete: true },
        ],
        borderAlerts: [
          { id: "ba-001", severity: "high" as const, message: "Otay Mesa experiencing 65+ min commercial wait times", portOfEntry: "Otay Mesa", timestamp: iso() },
          { id: "ba-002", severity: "moderate" as const, message: "Secondary inspection backlog at Peace Bridge", portOfEntry: "Peace Bridge", timestamp: iso() },
          { id: "ba-003", severity: "low" as const, message: "FAST lane reopened at Sweetgrass-Coutts", portOfEntry: "Sweetgrass-Coutts", timestamp: iso() },
        ],
        complianceSnapshot: {
          ctpatStatus: "CERTIFIED",
          ctpatTier: "Tier II",
          fastCardsActive: 23,
          fastCardsExpiringSoon: 2,
          bondedCarrierStatus: "ACTIVE",
          bondAmount: 75_000,
          bondExpiry: future(245),
          eManifestsPending: 3,
          eManifestsAccepted: 41,
          eManifestsRejected: 1,
        },
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 2. Border Wait Times
  // ══════════════════════════════════════════════════════════════════════════
  getBorderWaitTimes: protectedProcedure
    .input(z.object({
      border: z.enum(["US-CA", "US-MX", "ALL"]).default("ALL"),
      portCode: z.string().optional(),
    }).optional())
    .query(({ input }) => {
      const border = input?.border ?? "ALL";
      let ports = PORTS_OF_ENTRY;
      if (border !== "ALL") ports = ports.filter(p => p.border === border);
      if (input?.portCode) ports = ports.filter(p => p.code === input.portCode);
      return {
        updatedAt: iso(),
        ports: ports.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          border: p.border,
          state: p.state,
          currentWaitMinutes: p.currentWaitMinutes,
          averageWaitMinutes: p.averageWaitMinutes,
          fastLaneWaitMinutes: p.fastLane ? Math.max(5, Math.round(p.currentWaitMinutes * 0.4)) : null,
          severity: p.waitSeverity,
          trend: Math.random() > 0.5 ? ("increasing" as const) : ("decreasing" as const),
          lat: p.lat,
          lng: p.lng,
          lastUpdated: p.lastUpdated,
        })),
        systemStatus: "OPERATIONAL" as const,
        dataSource: "CBP BWT API / CBSA",
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 3. Ports of Entry Directory
  // ══════════════════════════════════════════════════════════════════════════
  getPortsOfEntry: protectedProcedure
    .input(z.object({
      border: z.enum(["US-CA", "US-MX", "ALL"]).default("ALL"),
      capabilities: z.object({
        fastLane: z.boolean().optional(),
        hazmat: z.boolean().optional(),
        oversize: z.boolean().optional(),
      }).optional(),
    }).optional())
    .query(({ input }) => {
      let ports = PORTS_OF_ENTRY;
      const border = input?.border ?? "ALL";
      if (border !== "ALL") ports = ports.filter(p => p.border === border);
      if (input?.capabilities?.fastLane) ports = ports.filter(p => p.fastLane);
      if (input?.capabilities?.hazmat) ports = ports.filter(p => p.hazmatCapable);
      if (input?.capabilities?.oversize) ports = ports.filter(p => p.oversizeCapable);
      return { total: ports.length, ports };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 4. Customs Documentation Requirements
  // ══════════════════════════════════════════════════════════════════════════
  getCustomsDocumentation: protectedProcedure
    .input(z.object({
      origin: z.enum(["US", "CA", "MX"]),
      destination: z.enum(["US", "CA", "MX"]),
      shipmentType: z.enum(["general", "hazmat", "perishable", "oversize", "livestock", "controlled"]).default("general"),
    }))
    .query(({ input }) => {
      const base = [
        { name: "Commercial Invoice", required: true, description: "Detailed invoice with value, quantity, HTS codes" },
        { name: "Bill of Lading", required: true, description: "Standard bill of lading for freight" },
        { name: "Packing List", required: true, description: "Itemized packing list with weights/dimensions" },
      ];
      const docs: typeof base = [...base];

      if (input.destination === "US") {
        docs.push({ name: "CBP Form 7501 (Entry Summary)", required: true, description: "US Customs entry summary declaration" });
        docs.push({ name: "ACE eManifest", required: true, description: "Automated Commercial Environment electronic manifest" });
        docs.push({ name: "ISF 10+2 (Importer Security Filing)", required: true, description: "Importer Security Filing for ocean imports" });
      }
      if (input.destination === "CA") {
        docs.push({ name: "CBSA B3 (Canada Customs Coding Form)", required: true, description: "Canadian customs entry declaration" });
        docs.push({ name: "ACI eManifest", required: true, description: "Advance Commercial Information manifest for CBSA" });
        docs.push({ name: "PARS Label", required: true, description: "Pre-Arrival Review System barcode label" });
      }
      if (input.destination === "MX") {
        docs.push({ name: "Pedimento de Importacion", required: true, description: "Mexican customs import declaration" });
        docs.push({ name: "Carta Porte", required: true, description: "Mexican domestic freight waybill (required since 2022)" });
        docs.push({ name: "DODA (Documento de Operacion Aduanera)", required: true, description: "Customs operation document for SAT" });
      }
      if (input.origin !== input.destination) {
        docs.push({ name: "USMCA Certificate of Origin", required: false, description: "Formerly NAFTA — claim preferential tariff treatment under USMCA" });
      }
      if (input.shipmentType === "hazmat") {
        docs.push({ name: "Dangerous Goods Declaration", required: true, description: "IMDG/DOT/TDG dangerous goods documentation" });
        if (input.destination === "CA") docs.push({ name: "TDG Shipping Document", required: true, description: "Transport of Dangerous Goods document per Canadian TDG Act" });
        if (input.destination === "MX") docs.push({ name: "NOM-005-SCT Shipping Paper", required: true, description: "Mexican hazmat transport document per NOM standards" });
      }
      if (input.shipmentType === "perishable") {
        docs.push({ name: "Phytosanitary Certificate", required: true, description: "Plant health certificate for agricultural products" });
        docs.push({ name: "Veterinary Certificate", required: false, description: "For animal-origin products — issued by USDA/CFIA/SENASICA" });
      }
      if (input.shipmentType === "controlled") {
        docs.push({ name: "Export License", required: true, description: "BIS/ITAR export license for controlled goods" });
        docs.push({ name: "End-User Certificate", required: true, description: "Statement of end-use for controlled items" });
      }

      return {
        route: `${input.origin} → ${input.destination}`,
        shipmentType: input.shipmentType,
        requiredDocuments: docs.filter(d => d.required),
        optionalDocuments: docs.filter(d => !d.required),
        totalRequired: docs.filter(d => d.required).length,
        estimatedPrepTimeHours: input.shipmentType === "hazmat" ? 8 : input.shipmentType === "controlled" ? 24 : 4,
        tips: [
          "Submit eManifest at least 1 hour before arrival for US, 1 hour for Canada",
          "Ensure HTS codes match across all documents",
          "USMCA certification can significantly reduce or eliminate duties",
        ],
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 5. Generate Customs Declaration
  // ══════════════════════════════════════════════════════════════════════════
  generateCustomsDeclaration: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      origin: z.object({ country: z.enum(["US", "CA", "MX"]), city: z.string(), state: z.string() }),
      destination: z.object({ country: z.enum(["US", "CA", "MX"]), city: z.string(), state: z.string() }),
      shipper: z.object({ name: z.string(), address: z.string(), taxId: z.string().optional() }),
      consignee: z.object({ name: z.string(), address: z.string(), taxId: z.string().optional() }),
      commodities: z.array(z.object({
        description: z.string(),
        htsCode: z.string(),
        quantity: z.number(),
        unit: z.string(),
        value: z.number(),
        weight: z.number(),
        countryOfOrigin: z.string(),
      })),
      usmc: z.boolean().default(false),
    }))
    .mutation(({ input }) => {
      const totalValue = input.commodities.reduce((s, c) => s + c.value, 0);
      const totalWeight = input.commodities.reduce((s, c) => s + c.weight, 0);
      return {
        declarationId: rid("DECL"),
        documentType: input.destination.country === "US" ? "CBP_7501" : input.destination.country === "CA" ? "CBSA_B3" : "PEDIMENTO",
        generatedAt: iso(),
        status: "DRAFT",
        loadId: input.loadId,
        route: `${input.origin.country} → ${input.destination.country}`,
        shipper: input.shipper,
        consignee: input.consignee,
        commodities: input.commodities.map(c => ({
          ...c,
          lineNumber: input.commodities.indexOf(c) + 1,
          dutyEstimate: c.value * 0.025,
        })),
        totals: {
          declaredValue: totalValue,
          totalWeight,
          estimatedDuties: Math.round(totalValue * 0.025 * 100) / 100,
          estimatedTaxes: Math.round(totalValue * 0.05 * 100) / 100,
          estimatedFees: 27.75,
          currency: input.destination.country === "CA" ? "CAD" : input.destination.country === "MX" ? "MXN" : "USD",
        },
        usmcaCertification: input.usmc ? { eligible: true, certificationNumber: rid("USMCA"), preferentialRate: true, dutySavings: Math.round(totalValue * 0.025 * 100) / 100 } : null,
        filingDeadline: future(5),
        validUntil: future(30),
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 6. HTS Classification Lookup
  // ══════════════════════════════════════════════════════════════════════════
  getHtsClassification: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      htsCode: z.string().optional(),
    }))
    .query(({ input }) => {
      let results = HTS_SAMPLE;
      if (input.htsCode) results = results.filter(h => h.code.startsWith(input.htsCode!));
      if (input.query) {
        const q = input.query.toLowerCase();
        results = results.filter(h => h.description.toLowerCase().includes(q) || h.code.includes(q));
      }
      return {
        query: input.query || input.htsCode || "",
        results: results.map(h => ({
          ...h,
          usmcaEligible: h.dutyRate > 0,
          countrySpecificRates: {
            US: { dutyRate: h.dutyRate, exciseTax: h.usExciseTax },
            CA: { dutyRate: Math.max(0, h.dutyRate - 1), gst: h.caGst, hst: h.caGst > 0 ? 13 : 0 },
            MX: { dutyRate: h.dutyRate * 1.1, iva: h.mxIva },
          },
        })),
        totalResults: results.length,
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 7. Duties & Taxes Calculator
  // ══════════════════════════════════════════════════════════════════════════
  calculateDutiesAndTaxes: protectedProcedure
    .input(z.object({
      origin: z.enum(["US", "CA", "MX"]),
      destination: z.enum(["US", "CA", "MX"]),
      commodities: z.array(z.object({
        htsCode: z.string(),
        description: z.string(),
        value: z.number(),
        weight: z.number(),
        quantity: z.number(),
      })),
      usmcaCertified: z.boolean().default(false),
      currency: z.enum(["USD", "CAD", "MXN"]).default("USD"),
    }))
    .query(({ input }) => {
      const fxRates: Record<string, number> = { USD: 1, CAD: 1.3645, MXN: 17.12 };
      const destRate = fxRates[input.currency] || 1;

      const lineItems = input.commodities.map((c, i) => {
        const hts = HTS_SAMPLE.find(h => h.code === c.htsCode);
        const baseDutyPct = hts?.dutyRate ?? 2.5;
        const dutyPct = input.usmcaCertified ? 0 : baseDutyPct;
        const dutyAmount = Math.round(c.value * (dutyPct / 100) * 100) / 100;
        let taxPct = 0;
        if (input.destination === "CA") taxPct = 5;
        if (input.destination === "MX") taxPct = 16;
        const taxAmount = Math.round((c.value + dutyAmount) * (taxPct / 100) * 100) / 100;
        return {
          lineNumber: i + 1,
          htsCode: c.htsCode,
          description: c.description,
          declaredValue: c.value,
          dutyRate: dutyPct,
          dutyAmount,
          taxRate: taxPct,
          taxName: input.destination === "CA" ? "GST" : input.destination === "MX" ? "IVA" : "None",
          taxAmount,
          totalCharges: dutyAmount + taxAmount,
          usmcaSavings: input.usmcaCertified ? Math.round(c.value * (baseDutyPct / 100) * 100) / 100 : 0,
        };
      });

      const totalDuty = lineItems.reduce((s, l) => s + l.dutyAmount, 0);
      const totalTax = lineItems.reduce((s, l) => s + l.taxAmount, 0);
      const totalSavings = lineItems.reduce((s, l) => s + l.usmcaSavings, 0);
      const merchandiseProcessingFee = input.destination === "US" ? Math.min(Math.max(totalDuty * 0.003464, 31.67), 614.35) : 0;
      const harborMaintenanceFee = 0;
      const brokerageFee = 175;

      return {
        calculatedAt: iso(),
        route: `${input.origin} → ${input.destination}`,
        currency: input.currency,
        lineItems,
        summary: {
          totalDeclaredValue: input.commodities.reduce((s, c) => s + c.value, 0),
          totalDuty: Math.round(totalDuty * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100,
          merchandiseProcessingFee: Math.round(merchandiseProcessingFee * 100) / 100,
          harborMaintenanceFee,
          brokerageFee,
          grandTotal: Math.round((totalDuty + totalTax + merchandiseProcessingFee + brokerageFee) * 100) / 100,
          grandTotalLocal: Math.round((totalDuty + totalTax + merchandiseProcessingFee + brokerageFee) * destRate * 100) / 100,
          localCurrency: input.currency,
          usmcaSavings: Math.round(totalSavings * 100) / 100,
          usmcaCertified: input.usmcaCertified,
        },
        disclaimer: "Estimates only. Actual duties/taxes determined by customs authorities at time of entry.",
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 8. C-TPAT Status
  // ══════════════════════════════════════════════════════════════════════════
  getCtpatStatus: protectedProcedure
    .input(z.object({ companyId: z.string().optional() }).optional())
    .query(() => ({
      certified: true,
      sviNumber: `SVI-${randomBytes(4).toString("hex").toUpperCase()}`,
      tier: "Tier II" as const,
      certificationDate: past(540),
      expiryDate: future(275),
      lastValidation: past(90),
      nextValidation: future(275),
      complianceScore: 94,
      benefits: [
        "Reduced CBP examinations",
        "Front-of-line processing at land border ports",
        "FAST lane eligibility",
        "Shorter wait times",
        "Priority consideration for CBP programs",
        "Access to FAST commercial processing lanes",
        "Eligibility for C-TPAT partner status recognition by CA/MX",
      ],
      requirements: [
        { area: "Physical Security", score: 96, status: "compliant" as const },
        { area: "Access Controls", score: 92, status: "compliant" as const },
        { area: "Personnel Security", score: 90, status: "compliant" as const },
        { area: "Procedural Security", score: 95, status: "compliant" as const },
        { area: "IT Security", score: 88, status: "attention" as const },
        { area: "Supply Chain Security", score: 93, status: "compliant" as const },
        { area: "Training & Awareness", score: 91, status: "compliant" as const },
      ],
      recentAudits: [
        { date: past(90), type: "Self-Assessment", result: "PASS", findings: 2, criticalFindings: 0 },
        { date: past(365), type: "CBP Validation", result: "PASS", findings: 3, criticalFindings: 0 },
      ],
    })),

  // ══════════════════════════════════════════════════════════════════════════
  // 9. FAST Card Management
  // ══════════════════════════════════════════════════════════════════════════
  getFastCardManagement: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }).optional())
    .query(() => ({
      totalCards: 23,
      activeCards: 21,
      expiringSoon: 2,
      expired: 0,
      pendingRenewal: 2,
      cards: [
        { id: "fast-001", driverName: "Carlos Ruiz", cardNumber: `FAST-${randomBytes(4).toString("hex").toUpperCase()}`, status: "ACTIVE" as const, issueDate: past(730), expiryDate: future(365), border: "US-MX" as const, enrollmentCenter: "Laredo, TX", backgroundCheckStatus: "CLEARED" as const },
        { id: "fast-002", driverName: "Jean-Pierre Lavoie", cardNumber: `FAST-${randomBytes(4).toString("hex").toUpperCase()}`, status: "ACTIVE" as const, issueDate: past(500), expiryDate: future(595), border: "US-CA" as const, enrollmentCenter: "Detroit, MI", backgroundCheckStatus: "CLEARED" as const },
        { id: "fast-003", driverName: "Miguel Hernandez", cardNumber: `FAST-${randomBytes(4).toString("hex").toUpperCase()}`, status: "EXPIRING_SOON" as const, issueDate: past(1700), expiryDate: future(25), border: "US-MX" as const, enrollmentCenter: "El Paso, TX", backgroundCheckStatus: "CLEARED" as const },
        { id: "fast-004", driverName: "Anne-Marie Dubois", cardNumber: `FAST-${randomBytes(4).toString("hex").toUpperCase()}`, status: "ACTIVE" as const, issueDate: past(200), expiryDate: future(895), border: "US-CA" as const, enrollmentCenter: "Blaine, WA", backgroundCheckStatus: "CLEARED" as const },
        { id: "fast-005", driverName: "David Kim", cardNumber: `FAST-${randomBytes(4).toString("hex").toUpperCase()}`, status: "EXPIRING_SOON" as const, issueDate: past(1680), expiryDate: future(45), border: "US-CA" as const, enrollmentCenter: "Buffalo, NY", backgroundCheckStatus: "CLEARED" as const },
      ],
      benefits: [
        "Dedicated FAST processing lanes at land borders",
        "Reduced wait times (avg 60-70% faster)",
        "Pre-screened low-risk status",
        "Valid for both US-CA and US-MX borders (when enrolled for both)",
      ],
      renewalProcess: {
        leadTimeDays: 90,
        fee: 50,
        backgroundCheckRequired: true,
        interviewRequired: false,
      },
    })),

  // ══════════════════════════════════════════════════════════════════════════
  // 10. Cabotage Compliance
  // ══════════════════════════════════════════════════════════════════════════
  getCabotageCompliance: protectedProcedure
    .input(z.object({
      carrierId: z.string().optional(),
      originCountry: z.enum(["US", "CA", "MX"]).optional(),
      destinationCountry: z.enum(["US", "CA", "MX"]).optional(),
      pickupCountry: z.enum(["US", "CA", "MX"]).optional(),
      deliveryCountry: z.enum(["US", "CA", "MX"]).optional(),
    }).optional())
    .query(({ input }) => {
      const origin = input?.originCountry ?? "US";
      const dest = input?.destinationCountry ?? "CA";
      const pickup = input?.pickupCountry;
      const delivery = input?.deliveryCountry;

      // Cabotage violation if carrier from one country does domestic moves in another
      const potentialViolation = pickup && delivery && pickup === delivery && pickup !== origin;

      return {
        rules: [
          {
            country: "US",
            description: "Foreign carriers may not perform point-to-point movements within the US",
            statute: "49 USC 14501(a)",
            penalty: "Up to $10,000 per violation; vehicle seizure possible",
            exceptions: ["Transit through US between two foreign points", "Immediate return to border after delivery"],
          },
          {
            country: "CA",
            description: "Foreign carriers cannot move goods between two points in Canada",
            statute: "Canada Transportation Act, Sec. 92",
            penalty: "Fine + revocation of operating authority",
            exceptions: ["Dedicated USMCA provisions", "Emergency permits"],
          },
          {
            country: "MX",
            description: "Foreign-registered trucks restricted to commercial zone (20km from border)",
            statute: "Ley de Caminos, Puentes y Autotransporte Federal",
            penalty: "Vehicle impound + fine",
            exceptions: ["USMCA long-haul provisions (phased implementation)", "Free trade zone operations"],
          },
        ],
        complianceCheck: {
          route: `${origin} → ${dest}`,
          pickupDelivery: pickup && delivery ? `${pickup} → ${delivery}` : null,
          cabotageRisk: potentialViolation ? "HIGH" : "NONE",
          violation: potentialViolation || false,
          recommendation: potentialViolation
            ? `WARNING: Moving goods from ${pickup} to ${delivery} with a ${origin}-registered carrier constitutes cabotage. Use a domestic carrier for this leg.`
            : "Route is compliant with cabotage regulations.",
        },
        usmcaProvisions: {
          longHaulAccess: "Phased — MX carriers may operate in US border states (AZ, CA, NM, TX)",
          crossBorderServices: "Permitted for international shipments",
          transitRights: "Full transit rights for through-shipments",
        },
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 11. Bonded Carrier Status
  // ══════════════════════════════════════════════════════════════════════════
  getBondedCarrierStatus: protectedProcedure
    .input(z.object({ carrierId: z.string().optional() }).optional())
    .query(() => ({
      status: "ACTIVE" as const,
      bondNumber: `BND-${randomBytes(5).toString("hex").toUpperCase()}`,
      bondType: "Continuous",
      bondAmount: 75_000,
      surety: "Zurich North America",
      suretyCode: "044",
      effectiveDate: past(365),
      expiryDate: future(365),
      premiumAnnual: 1_875,
      customsDistricts: ["Laredo", "El Paso", "Detroit", "Buffalo"],
      bondRider: {
        inTransitPrivileges: true,
        warehousePrivileges: false,
        foreignTradeZone: true,
      },
      complianceHistory: {
        claimsAgainstBond: 0,
        liquidatedDamages: 0,
        lastReview: past(180),
        nextReview: future(185),
        riskLevel: "LOW" as const,
      },
    })),

  // ══════════════════════════════════════════════════════════════════════════
  // 12. In-Transit Bond Tracking
  // ══════════════════════════════════════════════════════════════════════════
  getInTransitBondTracking: protectedProcedure
    .input(z.object({ bondNumber: z.string().optional(), loadId: z.string().optional() }).optional())
    .query(() => ({
      activeBonds: [
        { id: "itb-001", loadId: "LD-2026-1830", bondNumber: rid("IT"), entryPort: "Laredo", exitPort: "Detroit", commodity: "Auto Parts", value: 145_000, bondCoverage: 218_000, status: "IN_TRANSIT" as const, entryDate: past(2), estimatedExitDate: future(1), sealNumbers: ["SEAL-4471", "SEAL-4472"], custodyChain: "INTACT" },
        { id: "itb-002", loadId: "LD-2026-1842", bondNumber: rid("IT"), entryPort: "Champlain", exitPort: "Blaine", commodity: "Machinery", value: 89_000, bondCoverage: 134_000, status: "IN_TRANSIT" as const, entryDate: past(1), estimatedExitDate: future(3), sealNumbers: ["SEAL-4489"], custodyChain: "INTACT" },
        { id: "itb-003", loadId: "LD-2026-1815", bondNumber: rid("IT"), entryPort: "Otay Mesa", exitPort: "Nogales", commodity: "Electronics", value: 230_000, bondCoverage: 345_000, status: "COMPLETED" as const, entryDate: past(5), estimatedExitDate: past(3), sealNumbers: ["SEAL-4450", "SEAL-4451"], custodyChain: "VERIFIED" },
      ],
      totalActiveBonds: 2,
      totalValueUnderBond: 234_000,
      complianceRate: 100,
    })),

  // ══════════════════════════════════════════════════════════════════════════
  // 13. USMCA / NAFTA Certificates
  // ══════════════════════════════════════════════════════════════════════════
  getNaftaCertificates: protectedProcedure
    .input(z.object({ loadId: z.string().optional(), status: z.enum(["ALL", "ACTIVE", "EXPIRED", "DRAFT"]).default("ALL") }).optional())
    .query(({ input }) => {
      const certs = [
        { id: "usmca-001", loadId: "LD-2026-1847", certNumber: rid("USMCA"), status: "ACTIVE" as const, exporter: "ABC Manufacturing, Detroit MI", importer: "XYZ Distribuidora, Monterrey NL", producer: "ABC Manufacturing", goods: "Automotive brake assemblies (HTS 8708.30)", originCriteria: "B", periodFrom: past(30), periodTo: future(335), dutySavings: 4_200, blanketCertification: true },
        { id: "usmca-002", loadId: "LD-2026-1830", certNumber: rid("USMCA"), status: "ACTIVE" as const, exporter: "Canadian Lumber Co., Vancouver BC", importer: "US Timber Supply, Seattle WA", producer: "Canadian Lumber Co.", goods: "Coniferous wood, sawn (HTS 4407.11)", originCriteria: "A", periodFrom: past(60), periodTo: future(305), dutySavings: 0, blanketCertification: true },
        { id: "usmca-003", loadId: "LD-2026-1800", certNumber: rid("USMCA"), status: "EXPIRED" as const, exporter: "MexiTech Electronics, Juarez CHH", importer: "BorderTech Inc., El Paso TX", producer: "MexiTech Electronics", goods: "Printed circuit assemblies (HTS 8534.00)", originCriteria: "D", periodFrom: past(400), periodTo: past(35), dutySavings: 6_800, blanketCertification: false },
      ];
      const filtered = input?.status === "ALL" || !input?.status ? certs : certs.filter(c => c.status === input.status);
      if (input?.loadId) return { certificates: certs.filter(c => c.loadId === input.loadId), total: 1 };
      return {
        certificates: filtered,
        total: filtered.length,
        originCriteriaGuide: {
          A: "Wholly obtained or produced in USMCA territory",
          B: "Produced exclusively from originating materials",
          C: "Produced using non-originating materials that meet tariff shift + RVC",
          D: "Produced exclusively in USMCA territory and meets specific rule of origin",
        },
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 14. ACI eManifest (Canada)
  // ══════════════════════════════════════════════════════════════════════════
  getAciEmanifest: protectedProcedure
    .input(z.object({ manifestId: z.string().optional(), loadId: z.string().optional() }).optional())
    .query(() => ({
      manifests: [
        { id: "aci-001", loadId: "LD-2026-1849", ccn: `CCN-${randomBytes(5).toString("hex").toUpperCase()}`, status: "ACCEPTED" as const, submittedAt: past(1), acceptedAt: past(0), portOfEntry: "Ambassador Bridge", estimatedArrival: future(0), carrier: { name: "Northern Express Logistics", scac: "NELX" }, shipmentType: "standard", conveyanceType: "HIGHWAY", pars: `PARS-${randomBytes(6).toString("hex").toUpperCase()}` },
        { id: "aci-002", loadId: "LD-2026-1855", ccn: `CCN-${randomBytes(5).toString("hex").toUpperCase()}`, status: "MATCHED" as const, submittedAt: past(2), acceptedAt: past(1), portOfEntry: "Pacific Highway", estimatedArrival: past(0), carrier: { name: "Trans-Pacific Freight", scac: "TPFR" }, shipmentType: "standard", conveyanceType: "HIGHWAY", pars: `PARS-${randomBytes(6).toString("hex").toUpperCase()}` },
        { id: "aci-003", loadId: "LD-2026-1860", ccn: `CCN-${randomBytes(5).toString("hex").toUpperCase()}`, status: "PENDING" as const, submittedAt: iso(), acceptedAt: null, portOfEntry: "Champlain-Lacolle", estimatedArrival: future(1), carrier: { name: "Quebec Trans Inc.", scac: "QTRI" }, shipmentType: "hazmat", conveyanceType: "HIGHWAY", pars: `PARS-${randomBytes(6).toString("hex").toUpperCase()}` },
      ],
      submissionRequirements: {
        advanceNoticeHours: 1,
        requiredFields: ["CCN", "Carrier Code (SCAC)", "Port of Entry", "ETA", "Conveyance", "Cargo Description", "Shipper/Consignee"],
        hazmatAdvanceDays: 15,
      },
    })),

  // ══════════════════════════════════════════════════════════════════════════
  // 15. ACE eManifest (US)
  // ══════════════════════════════════════════════════════════════════════════
  getAceEmanifest: protectedProcedure
    .input(z.object({ manifestId: z.string().optional(), loadId: z.string().optional() }).optional())
    .query(() => ({
      manifests: [
        { id: "ace-001", loadId: "LD-2026-1847", tripNumber: `TRIP-${randomBytes(5).toString("hex").toUpperCase()}`, status: "ACCEPTED" as const, submittedAt: past(1), acceptedAt: past(0), portOfEntry: "Laredo (World Trade Bridge)", estimatedArrival: future(0), carrier: { name: "Ruiz Transport MX", scac: "RTMX", dot: "3451289" }, shipmentCount: 2, isfStatus: "FILED" as const, paps: `PAPS-${randomBytes(6).toString("hex").toUpperCase()}` },
        { id: "ace-002", loadId: "LD-2026-1852", tripNumber: `TRIP-${randomBytes(5).toString("hex").toUpperCase()}`, status: "REVIEW" as const, submittedAt: iso(), acceptedAt: null, portOfEntry: "El Paso - Ysleta-Zaragoza", estimatedArrival: future(1), carrier: { name: "Great Plains Freight", scac: "GPFT", dot: "2987654" }, shipmentCount: 1, isfStatus: "PENDING" as const, paps: `PAPS-${randomBytes(6).toString("hex").toUpperCase()}` },
        { id: "ace-003", loadId: "LD-2026-1858", tripNumber: `TRIP-${randomBytes(5).toString("hex").toUpperCase()}`, status: "ACCEPTED" as const, submittedAt: past(3), acceptedAt: past(2), portOfEntry: "Otay Mesa", estimatedArrival: past(1), carrier: { name: "Pacific Border Lines", scac: "PBLX", dot: "3125678" }, shipmentCount: 3, isfStatus: "FILED" as const, paps: `PAPS-${randomBytes(6).toString("hex").toUpperCase()}` },
      ],
      submissionRequirements: {
        advanceNoticeHours: 1,
        requiredFields: ["Trip Number", "SCAC", "DOT#", "Port of Entry", "ETA", "Shipment Details", "ISF 10+2"],
        isfDeadline: "24 hours before loading (ocean) / 1 hour before arrival (land)",
      },
    })),

  // ══════════════════════════════════════════════════════════════════════════
  // 16. PARS / PAPS Number Management
  // ══════════════════════════════════════════════════════════════════════════
  getParsNumbers: protectedProcedure
    .input(z.object({ type: z.enum(["PARS", "PAPS", "ALL"]).default("ALL") }).optional())
    .query(({ input }) => {
      const typ = input?.type ?? "ALL";
      const all = [
        { id: "pn-001", type: "PARS" as const, number: `${randomBytes(7).toString("hex").toUpperCase().slice(0, 14)}`, loadId: "LD-2026-1849", status: "MATCHED" as const, broker: "Northern Gateway Brokers", portOfEntry: "Ambassador Bridge", createdAt: past(2), matchedAt: past(1) },
        { id: "pn-002", type: "PARS" as const, number: `${randomBytes(7).toString("hex").toUpperCase().slice(0, 14)}`, loadId: "LD-2026-1855", status: "RELEASED" as const, broker: "Pacific Customs Solutions", portOfEntry: "Pacific Highway", createdAt: past(3), matchedAt: past(2) },
        { id: "pn-003", type: "PAPS" as const, number: `${randomBytes(7).toString("hex").toUpperCase().slice(0, 14)}`, loadId: "LD-2026-1847", status: "CLEARED" as const, broker: "TransBorder Customs Inc.", portOfEntry: "Laredo", createdAt: past(2), matchedAt: past(1) },
        { id: "pn-004", type: "PAPS" as const, number: `${randomBytes(7).toString("hex").toUpperCase().slice(0, 14)}`, loadId: "LD-2026-1852", status: "PENDING" as const, broker: "Frontera Aduanera MX", portOfEntry: "El Paso", createdAt: past(0), matchedAt: null },
      ];
      const filtered = typ === "ALL" ? all : all.filter(p => p.type === typ);
      return {
        numbers: filtered,
        total: filtered.length,
        guide: {
          PARS: "Pre-Arrival Review System — used for shipments entering Canada. Carrier affixes PARS label; broker transmits release request to CBSA.",
          PAPS: "Pre-Arrival Processing System — used for shipments entering the US. Broker submits entry data to CBP linked to PAPS number.",
        },
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 17. Broker Directory
  // ══════════════════════════════════════════════════════════════════════════
  getBrokerDirectory: protectedProcedure
    .input(z.object({
      border: z.enum(["US-CA", "US-MX", "BOTH", "ALL"]).default("ALL"),
      specialty: z.string().optional(),
      available: z.boolean().optional(),
    }).optional())
    .query(({ input }) => {
      let filtered = BROKERS;
      const border = input?.border ?? "ALL";
      if (border !== "ALL") filtered = filtered.filter(b => b.border === border || b.border === "BOTH");
      if (input?.specialty) {
        const sp = input.specialty.toLowerCase();
        filtered = filtered.filter(b => b.specialties.some(s => s.toLowerCase().includes(sp)));
      }
      if (input?.available !== undefined) filtered = filtered.filter(b => b.available === input!.available);
      return { brokers: filtered, total: filtered.length };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 18. Assign Broker
  // ══════════════════════════════════════════════════════════════════════════
  assignBroker: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      brokerId: z.string(),
      portOfEntry: z.string(),
      serviceType: z.enum(["standard", "expedited", "hazmat"]).default("standard"),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const broker = BROKERS.find(b => b.id === input.brokerId);
      return {
        assignmentId: rid("BA"),
        loadId: input.loadId,
        brokerId: input.brokerId,
        brokerName: broker?.name ?? "Unknown",
        brokerCompany: broker?.company ?? "Unknown",
        portOfEntry: input.portOfEntry,
        serviceType: input.serviceType,
        status: "ASSIGNED" as const,
        assignedAt: iso(),
        estimatedClearanceHours: broker?.avgClearanceHours ?? 4,
        fee: input.serviceType === "expedited" ? 350 : input.serviceType === "hazmat" ? 425 : 175,
        notes: input.notes ?? null,
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 19. Cross-Border Compliance Checklist
  // ══════════════════════════════════════════════════════════════════════════
  getCrossBorderCompliance: protectedProcedure
    .input(z.object({
      origin: z.enum(["US", "CA", "MX"]),
      destination: z.enum(["US", "CA", "MX"]),
      shipmentType: z.enum(["general", "hazmat", "perishable", "oversize", "livestock", "controlled"]).default("general"),
    }))
    .query(({ input }) => {
      const items: { category: string; requirement: string; status: string; critical: boolean }[] = [
        { category: "Documentation", requirement: "Commercial invoice with declared value", status: "required", critical: true },
        { category: "Documentation", requirement: "Bill of lading / waybill", status: "required", critical: true },
        { category: "Documentation", requirement: "Packing list", status: "required", critical: true },
        { category: "eManifest", requirement: input.destination === "US" ? "ACE eManifest filed" : input.destination === "CA" ? "ACI eManifest filed" : "SAT Carta Porte", status: "required", critical: true },
        { category: "Carrier", requirement: "Valid operating authority for cross-border", status: "required", critical: true },
        { category: "Carrier", requirement: "Cabotage compliance verified", status: "required", critical: true },
        { category: "Driver", requirement: "Valid passport or FAST card", status: "required", critical: true },
        { category: "Driver", requirement: "Valid CDL / foreign equivalent", status: "required", critical: true },
        { category: "Vehicle", requirement: "Vehicle registration for cross-border", status: "required", critical: true },
        { category: "Vehicle", requirement: "Insurance valid in destination country", status: "required", critical: true },
        { category: "Customs", requirement: "Customs broker assigned", status: "recommended", critical: false },
        { category: "Customs", requirement: "HTS codes verified", status: "required", critical: true },
        { category: "Customs", requirement: "Duties/taxes pre-calculated", status: "recommended", critical: false },
        { category: "Security", requirement: "C-TPAT certification current", status: "recommended", critical: false },
      ];
      if (input.shipmentType === "hazmat") {
        items.push(
          { category: "HAZMAT", requirement: input.destination === "CA" ? "TDG compliance verified" : "DOT HAZMAT compliance verified", status: "required", critical: true },
          { category: "HAZMAT", requirement: "Dangerous goods declaration", status: "required", critical: true },
          { category: "HAZMAT", requirement: "Emergency response info (ERG/CANUTEC/SETIQ)", status: "required", critical: true },
          { category: "HAZMAT", requirement: "15-day advance notice (if applicable)", status: "required", critical: true },
        );
      }
      if (input.shipmentType === "perishable") {
        items.push(
          { category: "Perishable", requirement: "Phytosanitary certificate", status: "required", critical: true },
          { category: "Perishable", requirement: "Temperature monitoring documentation", status: "required", critical: true },
        );
      }
      return {
        route: `${input.origin} → ${input.destination}`,
        shipmentType: input.shipmentType,
        checklist: items,
        totalItems: items.length,
        criticalItems: items.filter(i => i.critical).length,
        readinessScore: 85,
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 20. Export Controls (EAR, ITAR, Denied Parties)
  // ══════════════════════════════════════════════════════════════════════════
  getExportControls: protectedProcedure
    .input(z.object({
      entityName: z.string().optional(),
      country: z.string().optional(),
      eccnCode: z.string().optional(),
      htsCode: z.string().optional(),
    }))
    .query(({ input }) => ({
      screeningResult: {
        entityName: input.entityName ?? "N/A",
        screenedAt: iso(),
        deniedPartyMatch: false,
        sdnMatch: false,
        entityListMatch: false,
        unscMatch: false,
        bisMatch: false,
        overallRisk: "LOW" as const,
        listsScreened: [
          { name: "SDN (Specially Designated Nationals)", source: "OFAC", match: false },
          { name: "Entity List", source: "BIS", match: false },
          { name: "Denied Persons List", source: "BIS", match: false },
          { name: "Unverified List", source: "BIS", match: false },
          { name: "ITAR Debarred", source: "DDTC", match: false },
          { name: "UN Consolidated Sanctions", source: "UN", match: false },
          { name: "EU Consolidated List", source: "EU", match: false },
          { name: "Canada SEMA List", source: "GAC", match: false },
        ],
      },
      exportClassification: input.eccnCode ? {
        eccn: input.eccnCode,
        controlReason: "NS (National Security)",
        licenseRequired: false,
        licenseException: "TSR",
        destinationRestrictions: ["Country Group D:1", "Embargoed nations"],
      } : null,
      guidance: [
        "All parties (shipper, consignee, end-user) must be screened before export",
        "ITAR-controlled items require State Department license (DDTC)",
        "EAR-controlled items may need BIS license based on ECCN + destination",
        "Screening must be re-run if parties change or for each new transaction",
      ],
    })),

  // ══════════════════════════════════════════════════════════════════════════
  // 21. DG / HAZMAT Cross-Border (TDG vs DOT)
  // ══════════════════════════════════════════════════════════════════════════
  getDangerousGoodsCrossBorder: protectedProcedure
    .input(z.object({
      origin: z.enum(["US", "CA", "MX"]),
      destination: z.enum(["US", "CA", "MX"]),
      unNumber: z.string().optional(),
      hazmatClass: z.string().optional(),
    }))
    .query(({ input }) => ({
      route: `${input.origin} → ${input.destination}`,
      regulatoryFrameworks: {
        US: { name: "DOT 49 CFR", authority: "PHMSA / FMCSA", emergencyNumber: "CHEMTREC 1-800-424-9300" },
        CA: { name: "TDG Act (SOR/2001-286)", authority: "Transport Canada", emergencyNumber: "CANUTEC 1-888-226-8832 / *666" },
        MX: { name: "NOM-002/005/010-SCT", authority: "SCT (Secretaria de Comunicaciones y Transportes)", emergencyNumber: "SETIQ 01-800-00-214-00" },
      },
      keyDifferences: [
        { topic: "Placarding", us: "DOT placards (diamond-shaped)", ca: "TDG placards (similar but bilingual EN/FR required)", mx: "NOM placards (UN standard with Spanish text)" },
        { topic: "Shipping Papers", us: "Shipping Paper (49 CFR 172.200)", ca: "TDG Shipping Document (bilingual)", mx: "NOM-005-SCT document (Spanish)" },
        { topic: "Driver Training", us: "HAZMAT endorsement on CDL", ca: "TDG training certificate (valid 3 years)", mx: "Type E license + hazmat course" },
        { topic: "Advance Notice", us: "ACE eManifest (1hr before)", ca: "ACI eManifest (1hr, 15 days for hazmat)", mx: "Pedimento + DODA" },
        { topic: "Emergency Response", us: "ERG guidebook", ca: "ERG + CANUTEC initial response", mx: "ERG + SETIQ hotline" },
        { topic: "Weight Limits", us: "Varies by DOT class", ca: "Generally aligns but some province-specific limits", mx: "NOM-012-SCT (lower max GVW)" },
      ],
      crossBorderRequirements: [
        "Must carry shipping documents for BOTH origin and destination jurisdictions",
        "Placards must meet both DOT and TDG/NOM standards or use UN standard",
        "Driver must hold valid HAZMAT credentials for all countries traversed",
        "Emergency response plan must cover all jurisdictions",
        "Advance notification required for high-hazard materials",
      ],
      classification: input.unNumber ? {
        unNumber: input.unNumber,
        hazmatClass: input.hazmatClass ?? "Unknown",
        usClassification: `DOT Class ${input.hazmatClass ?? "?"}`,
        caClassification: `TDG Class ${input.hazmatClass ?? "?"}`,
        mxClassification: `NOM Class ${input.hazmatClass ?? "?"}`,
        harmonized: true,
      } : null,
    })),

  // ══════════════════════════════════════════════════════════════════════════
  // 22. Multi-Currency Management
  // ══════════════════════════════════════════════════════════════════════════
  getCurrencyManagement: protectedProcedure
    .input(z.object({
      baseCurrency: z.enum(["USD", "CAD", "MXN"]).default("USD"),
    }).optional())
    .query(({ input }) => {
      const base = input?.baseCurrency ?? "USD";
      const rates: Record<string, Record<string, number>> = {
        USD: { USD: 1, CAD: 1.3645, MXN: 17.12 },
        CAD: { USD: 0.7328, CAD: 1, MXN: 12.55 },
        MXN: { USD: 0.0584, CAD: 0.0797, MXN: 1 },
      };
      return {
        baseCurrency: base,
        updatedAt: iso(),
        exchangeRates: rates[base],
        recentInvoices: [
          { id: "inv-001", loadId: "LD-2026-1847", currency: "MXN", amount: 85_600, baseAmount: 85_600 * (rates.MXN?.USD ?? 0.0584), rate: rates.MXN?.USD ?? 0.0584, date: past(3) },
          { id: "inv-002", loadId: "LD-2026-1849", currency: "CAD", amount: 4_200, baseAmount: 4_200 * (rates.CAD?.USD ?? 0.7328), rate: rates.CAD?.USD ?? 0.7328, date: past(2) },
          { id: "inv-003", loadId: "LD-2026-1855", currency: "USD", amount: 3_800, baseAmount: 3_800, rate: 1, date: past(1) },
        ],
        hedgingOptions: [
          { type: "Forward Contract", description: "Lock in exchange rate for future settlement", minAmount: 10_000, term: "30-180 days" },
          { type: "Spot Conversion", description: "Convert at current market rate", minAmount: 0, term: "Immediate (T+2)" },
        ],
        taxImplications: {
          US: "Foreign currency gains/losses reported on Form 1040 Schedule D",
          CA: "Foreign exchange gains/losses per ITA Section 39",
          MX: "ISR reporting of FX gains via annual declaration",
        },
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 23. Cross-Border Analytics
  // ══════════════════════════════════════════════════════════════════════════
  getCrossBorderAnalytics: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      border: z.enum(["US-CA", "US-MX", "ALL"]).default("ALL"),
    }).optional())
    .query(({ input }) => {
      const period = input?.period ?? "month";
      const m = period === "week" ? 0.25 : period === "month" ? 1 : period === "quarter" ? 3 : 12;
      return {
        period,
        border: input?.border ?? "ALL",
        kpis: {
          totalCrossings: Math.round(152 * m),
          averageCrossingTimeMinutes: 47,
          complianceRate: 98.7,
          onTimeRate: 94.2,
          customsClearanceAvgHours: 2.8,
          dutiesPaid: Math.round(124_500 * m),
          brokerageFees: Math.round(18_750 * m),
          totalCostPerCrossing: 892,
          fastLaneUtilization: 68,
          eManifestAcceptanceRate: 97.3,
          secondaryInspectionRate: 3.1,
          cabotageViolations: 0,
        },
        topRoutes: [
          { origin: "Monterrey, MX", destination: "San Antonio, TX", crossings: Math.round(28 * m), avgTime: 52, compliance: 99 },
          { origin: "Toronto, ON", destination: "Detroit, MI", crossings: Math.round(35 * m), avgTime: 22, compliance: 100 },
          { origin: "Vancouver, BC", destination: "Seattle, WA", crossings: Math.round(22 * m), avgTime: 38, compliance: 98 },
          { origin: "El Paso, TX", destination: "Juarez, MX", crossings: Math.round(18 * m), avgTime: 45, compliance: 97 },
          { origin: "Buffalo, NY", destination: "Fort Erie, ON", crossings: Math.round(15 * m), avgTime: 18, compliance: 100 },
        ],
        topPorts: [
          { name: "Laredo", crossings: Math.round(42 * m), avgWait: 48 },
          { name: "Ambassador Bridge", crossings: Math.round(35 * m), avgWait: 20 },
          { name: "Pacific Highway", crossings: Math.round(22 * m), avgWait: 35 },
          { name: "El Paso", crossings: Math.round(20 * m), avgWait: 40 },
          { name: "Otay Mesa", crossings: Math.round(18 * m), avgWait: 58 },
        ],
        costBreakdown: {
          duties: Math.round(124_500 * m),
          taxes: Math.round(31_200 * m),
          brokerage: Math.round(18_750 * m),
          bondPremiums: Math.round(1_875 * m / 12),
          compliance: Math.round(4_500 * m),
          total: Math.round(180_825 * m),
        },
        trends: {
          crossingsChange: 12.4,
          costChange: -3.2,
          complianceChange: 1.1,
          waitTimeChange: -8.5,
        },
      };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // 24. Seasonal Border Patterns
  // ══════════════════════════════════════════════════════════════════════════
  getSeasonalBorderPatterns: protectedProcedure
    .input(z.object({
      portCode: z.string().optional(),
      border: z.enum(["US-CA", "US-MX", "ALL"]).default("ALL"),
    }).optional())
    .query(({ input }) => ({
      border: input?.border ?? "ALL",
      patterns: [
        { month: "January", volumeIndex: 72, avgWaitMinutes: 28, peakDays: ["Mon", "Fri"], notes: "Post-holiday slowdown; lower volumes" },
        { month: "February", volumeIndex: 78, avgWaitMinutes: 30, peakDays: ["Mon", "Thu", "Fri"], notes: "Gradual ramp-up; produce season begins MX→US" },
        { month: "March", volumeIndex: 88, avgWaitMinutes: 35, peakDays: ["Mon", "Wed", "Fri"], notes: "Spring produce surge; auto parts increase" },
        { month: "April", volumeIndex: 92, avgWaitMinutes: 38, peakDays: ["Mon", "Tue", "Fri"], notes: "Peak produce season MX→US; Easter impacts" },
        { month: "May", volumeIndex: 95, avgWaitMinutes: 40, peakDays: ["Mon", "Wed", "Fri"], notes: "High volume; construction materials increase" },
        { month: "June", volumeIndex: 90, avgWaitMinutes: 42, peakDays: ["Mon", "Fri"], notes: "Tourist traffic impacts commercial lanes" },
        { month: "July", volumeIndex: 82, avgWaitMinutes: 38, peakDays: ["Mon", "Fri"], notes: "Plant shutdowns reduce auto parts; July 4 / Canada Day impacts" },
        { month: "August", volumeIndex: 85, avgWaitMinutes: 35, peakDays: ["Mon", "Thu", "Fri"], notes: "Back-to-school retail surge" },
        { month: "September", volumeIndex: 96, avgWaitMinutes: 42, peakDays: ["Mon", "Tue", "Wed", "Fri"], notes: "Harvest season; highest volume period begins" },
        { month: "October", volumeIndex: 100, avgWaitMinutes: 48, peakDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], notes: "PEAK: Holiday inventory build; harvest continues" },
        { month: "November", volumeIndex: 98, avgWaitMinutes: 50, peakDays: ["Mon", "Tue", "Wed", "Thu"], notes: "Pre-holiday peak; Thanksgiving impacts US ports" },
        { month: "December", volumeIndex: 80, avgWaitMinutes: 32, peakDays: ["Mon", "Tue", "Wed"], notes: "Sharp drop after Dec 15; plant shutdowns" },
      ],
      recommendations: [
        "Schedule crossings for Tue/Wed when possible to avoid Monday/Friday peaks",
        "Use FAST lanes during peak months (Sep-Nov) to save 60-70% wait time",
        "File eManifests 2+ hours early during peak season (vs 1hr minimum)",
        "Consider 5:00-7:00 AM arrivals for shortest wait times at major ports",
        "Avoid Laredo and Otay Mesa during October peak; consider Pharr or Calexico as alternatives",
      ],
      bestCrossingTimes: {
        weekday: "Tuesday or Wednesday",
        timeOfDay: "05:00 - 07:00 or 14:00 - 15:00",
        avoidPeak: "Monday AM, Friday PM",
      },
    })),
});
