/**
 * INDUSTRY VERTICALS ROUTER (GAP-274-339)
 * tRPC procedures for industry vertical configuration,
 * compliance, equipment, hazmat segregation, pricing,
 * seasonal factors, analytics, and carrier certifications.
 */

import { z } from "zod";
import { sql, desc } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, companies, inspections } from "../../drizzle/schema";
import {
  getAllVerticals,
  getVertical,
  getVerticalFields,
  getVerticalCompliance,
  getVerticalDocuments,
  getVerticalPricing,
  validateLoadForVertical,
} from "../services/IndustryVerticals";
import { logger } from "../_core/logger";

// Map vertical IDs to corresponding cargoType enum values in the loads table
const VERTICAL_CARGO_MAP: Record<string, string[]> = {
  petroleum: ["petroleum"],
  tanker: ["petroleum", "liquid", "water"],
  chemical: ["chemicals", "hazmat"],
  hazmat: ["hazmat", "chemicals"],
  food: ["food_grade", "refrigerated"],
  refrigerated: ["refrigerated", "food_grade"],
  construction: ["oversized"],
  heavy_haul: ["oversized"],
  livestock: ["livestock"],
  intermodal: ["intermodal"],
  auto_transport: ["vehicles"],
  automotive: ["vehicles"],
  general_freight: ["general"],
  flatbed: ["general", "oversized"],
  ltl: ["general"],
  bulk_dry: ["dry_bulk", "grain"],
  pharma: ["refrigerated"],
  environmental: ["hazmat", "chemicals"],
};

// ── Vertical IDs ─────────────────────────────────────────────────────────────
const verticalIdSchema = z.enum([
  "general_freight", "refrigerated", "hazmat", "tanker", "flatbed",
  "auto_transport", "intermodal", "ltl", "heavy_haul", "livestock",
  "bulk_dry", "moving_household",
  // Aliases for the requested verticals that map into existing ones
  "petroleum", "chemical", "food", "construction", "environmental",
  "pharma", "automotive",
]);

// Map alias verticals to their canonical vertical + extra overlay data
const VERTICAL_ALIAS_MAP: Record<string, string> = {
  petroleum: "tanker",
  chemical: "hazmat",
  food: "refrigerated",
  construction: "heavy_haul",
  environmental: "hazmat",
  pharma: "refrigerated",
  automotive: "auto_transport",
};

function resolveVerticalId(id: string): string {
  return VERTICAL_ALIAS_MAP[id] || id;
}

// ── Hazmat Segregation Table (49 CFR 177.848) ────────────────────────────────
// X = incompatible, O = may be loaded together with conditions, blank = compatible
const HAZMAT_SEGREGATION: Record<string, Record<string, string>> = {
  "1.1": { "1.1": "X", "1.2": "X", "1.3": "X", "1.4": "X", "2.1": "X", "2.2": "X", "2.3": "X", "3": "X", "4.1": "X", "4.2": "X", "4.3": "X", "5.1": "X", "5.2": "X", "6.1": "X", "7": "X", "8": "X" },
  "1.2": { "1.1": "X", "1.2": "X", "1.3": "X", "1.4": "X", "2.1": "X", "2.2": "X", "2.3": "X", "3": "X", "4.1": "X", "4.2": "X", "4.3": "X", "5.1": "X", "5.2": "X", "6.1": "X", "7": "X", "8": "X" },
  "1.3": { "1.1": "X", "1.2": "X", "1.3": "X", "1.4": "X", "2.1": "X", "2.2": "X", "2.3": "X", "3": "X", "4.1": "X", "4.2": "X", "4.3": "X", "5.1": "X", "5.2": "X", "6.1": "X", "7": "X", "8": "X" },
  "1.4": { "1.1": "X", "1.2": "X", "1.3": "X", "1.4": "", "2.1": "", "2.2": "", "2.3": "X", "3": "", "4.1": "", "4.2": "X", "4.3": "", "5.1": "", "5.2": "X", "6.1": "", "7": "", "8": "" },
  "2.1": { "1.1": "X", "1.2": "X", "1.3": "X", "2.3": "X", "3": "", "4.2": "X", "4.3": "", "5.1": "", "5.2": "X", "6.1": "", "7": "", "8": "" },
  "2.2": { "1.1": "X", "1.2": "X", "1.3": "X" },
  "2.3": { "1.1": "X", "1.2": "X", "1.3": "X", "1.4": "X", "2.1": "X", "3": "X", "4.1": "X", "4.2": "X", "4.3": "X", "5.1": "X", "5.2": "X", "6.1": "X", "8": "X" },
  "3":   { "1.1": "X", "1.2": "X", "1.3": "X", "2.3": "X", "4.2": "X", "5.1": "O", "5.2": "X", "6.1": "O" },
  "4.1": { "1.1": "X", "1.2": "X", "1.3": "X", "2.3": "X", "4.2": "X", "5.1": "O", "5.2": "X" },
  "4.2": { "1.1": "X", "1.2": "X", "1.3": "X", "1.4": "X", "2.1": "X", "2.3": "X", "3": "X", "4.1": "X", "4.3": "X", "5.1": "X", "5.2": "X", "6.1": "X", "8": "X" },
  "4.3": { "1.1": "X", "1.2": "X", "1.3": "X", "2.3": "X", "4.2": "X", "5.1": "X", "5.2": "X", "8": "X" },
  "5.1": { "1.1": "X", "1.2": "X", "1.3": "X", "2.3": "X", "3": "O", "4.1": "O", "4.2": "X", "4.3": "X", "5.2": "X", "6.1": "O" },
  "5.2": { "1.1": "X", "1.2": "X", "1.3": "X", "1.4": "X", "2.1": "X", "2.3": "X", "3": "X", "4.1": "X", "4.2": "X", "4.3": "X", "5.1": "X", "6.1": "X", "8": "X" },
  "6.1": { "1.1": "X", "1.2": "X", "1.3": "X", "2.3": "X", "3": "O", "4.2": "X", "5.1": "O", "5.2": "X" },
  "7":   { "1.1": "X", "1.2": "X", "1.3": "X" },
  "8":   { "1.1": "X", "1.2": "X", "1.3": "X", "2.3": "X", "4.2": "X", "4.3": "X", "5.2": "X" },
};

// ── Temperature Protocols ────────────────────────────────────────────────────
const TEMPERATURE_PROTOCOLS: Record<string, {
  vertical: string;
  protocols: Array<{
    product: string;
    tempRange: { min: number; max: number; unit: string };
    tolerance: number;
    monitoringInterval: string;
    alarmThreshold: number;
    regulation: string;
    notes: string;
  }>;
}> = {
  food: {
    vertical: "Food / Agriculture",
    protocols: [
      { product: "Frozen Foods", tempRange: { min: -10, max: 0, unit: "F" }, tolerance: 2, monitoringInterval: "15 min", alarmThreshold: 5, regulation: "21 CFR 110 / FSMA", notes: "Must remain at or below 0 F. Pre-cool trailer to -10 F before loading." },
      { product: "Fresh Produce", tempRange: { min: 32, max: 40, unit: "F" }, tolerance: 3, monitoringInterval: "30 min", alarmThreshold: 45, regulation: "FSMA 21 CFR 1.908", notes: "Ethylene-producing items must be separated from ethylene-sensitive items." },
      { product: "Dairy Products", tempRange: { min: 33, max: 38, unit: "F" }, tolerance: 2, monitoringInterval: "15 min", alarmThreshold: 41, regulation: "PMO / Grade A", notes: "Pasteurized Milk Ordinance requires 45 F or below for Grade A." },
      { product: "Meat / Poultry", tempRange: { min: 28, max: 32, unit: "F" }, tolerance: 2, monitoringInterval: "15 min", alarmThreshold: 40, regulation: "USDA FSIS 9 CFR 381/590", notes: "USDA inspection certificate required. Zero tolerance for temp abuse." },
      { product: "Seafood", tempRange: { min: 28, max: 32, unit: "F" }, tolerance: 1, monitoringInterval: "10 min", alarmThreshold: 38, regulation: "FDA 21 CFR 123 (HACCP)", notes: "Seafood HACCP plan required. Many species require near-freezing temps." },
      { product: "Ice Cream", tempRange: { min: -20, max: -10, unit: "F" }, tolerance: 2, monitoringInterval: "15 min", alarmThreshold: 0, regulation: "21 CFR 135", notes: "Must be stored at -20 F for optimal quality." },
    ],
  },
  pharma: {
    vertical: "Pharmaceutical",
    protocols: [
      { product: "Controlled Room Temp (CRT)", tempRange: { min: 59, max: 77, unit: "F" }, tolerance: 2, monitoringInterval: "5 min", alarmThreshold: 4, regulation: "USP <659> / GDP", notes: "Most common pharma range. Mean kinetic temperature (MKT) tracking required." },
      { product: "Refrigerated Biologics", tempRange: { min: 36, max: 46, unit: "F" }, tolerance: 1, monitoringInterval: "5 min", alarmThreshold: 2, regulation: "FDA 21 CFR 211 / WHO GDP", notes: "Vaccines, insulin, biologics. Freeze excursion is product-destroying." },
      { product: "Frozen Biologics", tempRange: { min: -13, max: -4, unit: "F" }, tolerance: 1, monitoringInterval: "5 min", alarmThreshold: 2, regulation: "FDA 21 CFR 600", notes: "Certain biologics, blood products. Dry ice or active cooling required." },
      { product: "Ultra-Cold (mRNA)", tempRange: { min: -94, max: -58, unit: "F" }, tolerance: 1, monitoringInterval: "2 min", alarmThreshold: 2, regulation: "FDA EUA / GDP", notes: "mRNA vaccines. Requires specialized ultra-cold containers or dry ice replenishment." },
      { product: "Controlled Substances (DEA)", tempRange: { min: 59, max: 77, unit: "F" }, tolerance: 2, monitoringInterval: "5 min", alarmThreshold: 4, regulation: "DEA 21 CFR 1301 / USP", notes: "Chain of custody documentation required. DEA-222 forms for Schedule II." },
    ],
  },
  chemical: {
    vertical: "Chemical",
    protocols: [
      { product: "Temperature-Sensitive Chemicals", tempRange: { min: 50, max: 80, unit: "F" }, tolerance: 5, monitoringInterval: "30 min", alarmThreshold: 10, regulation: "49 CFR 173 / SDS", notes: "Per SDS storage requirements. Some chemicals polymerize at high temps." },
      { product: "Cryogenic Liquids", tempRange: { min: -320, max: -150, unit: "F" }, tolerance: 5, monitoringInterval: "5 min", alarmThreshold: 10, regulation: "49 CFR 173.320", notes: "LNG, liquid nitrogen, liquid oxygen. Pressure vessel monitoring required." },
      { product: "Reactive Chemicals", tempRange: { min: 40, max: 70, unit: "F" }, tolerance: 3, monitoringInterval: "10 min", alarmThreshold: 5, regulation: "49 CFR 173 / OSHA 1910.119", notes: "Organic peroxides, self-reactive substances. Must avoid heat sources." },
    ],
  },
};

// ── Environmental Compliance ─────────────────────────────────────────────────
const ENVIRONMENTAL_COMPLIANCE = {
  epa: {
    category: "EPA Compliance",
    requirements: [
      { id: "spcc", regulation: "40 CFR 112", title: "Spill Prevention, Control & Countermeasure", description: "SPCC plan required for facilities storing >1,320 gal above ground or >42,000 gal underground", severity: "critical" as const, applicableVerticals: ["petroleum", "tanker", "chemical", "hazmat"] },
      { id: "rcra", regulation: "40 CFR 260-265", title: "Hazardous Waste Management", description: "RCRA manifests for hazardous waste transport. EPA ID number required for generators and TSDFs", severity: "critical" as const, applicableVerticals: ["chemical", "hazmat", "environmental"] },
      { id: "cercla", regulation: "40 CFR 302", title: "CERCLA Reportable Quantities", description: "Immediate reporting required if spill exceeds reportable quantity. NRC notification: 1-800-424-8802", severity: "critical" as const, applicableVerticals: ["petroleum", "chemical", "hazmat", "tanker"] },
      { id: "tsca", regulation: "40 CFR 761", title: "Toxic Substances Control Act", description: "PCB transport requirements. Special marking, manifesting, and disposal facility requirements", severity: "high" as const, applicableVerticals: ["chemical", "environmental"] },
      { id: "caa_mobile", regulation: "40 CFR 80/86", title: "Clean Air Act — Mobile Sources", description: "SmartWay participation, idle reduction, emissions compliance for fleet vehicles", severity: "medium" as const, applicableVerticals: ["general_freight", "tanker", "petroleum"] },
    ],
  },
  osha: {
    category: "OSHA Compliance",
    requirements: [
      { id: "hazcom", regulation: "29 CFR 1910.1200", title: "Hazard Communication (HazCom/GHS)", description: "SDS must accompany hazardous materials. Labels must be GHS-compliant", severity: "critical" as const, applicableVerticals: ["chemical", "hazmat", "petroleum"] },
      { id: "psm", regulation: "29 CFR 1910.119", title: "Process Safety Management", description: "PSM requirements for facilities handling highly hazardous chemicals above threshold quantities", severity: "critical" as const, applicableVerticals: ["chemical", "petroleum"] },
      { id: "respiratory", regulation: "29 CFR 1910.134", title: "Respiratory Protection", description: "Respiratory protection program for drivers entering chemical/petroleum facilities", severity: "high" as const, applicableVerticals: ["chemical", "petroleum", "environmental"] },
      { id: "confined_space", regulation: "29 CFR 1910.146", title: "Confined Space Entry", description: "Permit-required confined space entry for tank cleaning, inspections", severity: "high" as const, applicableVerticals: ["tanker", "petroleum", "chemical"] },
    ],
  },
  dot_phmsa: {
    category: "DOT / PHMSA",
    requirements: [
      { id: "hmr", regulation: "49 CFR 171-180", title: "Hazardous Materials Regulations", description: "Complete HMR compliance: classification, packaging, marking, labeling, placarding, shipping papers", severity: "critical" as const, applicableVerticals: ["hazmat", "chemical", "petroleum", "tanker"] },
      { id: "security_plan", regulation: "49 CFR 172.800", title: "Security Plan", description: "Required for carriers transporting certain hazmat quantities (HRCQ). Risk assessment and mitigation", severity: "critical" as const, applicableVerticals: ["hazmat", "chemical", "petroleum"] },
      { id: "routing", regulation: "49 CFR 397", title: "Hazmat Routing", description: "Designated hazmat routes must be used. Avoid tunnels, bridges, and populated areas per FMCSA rules", severity: "high" as const, applicableVerticals: ["hazmat", "chemical", "petroleum"] },
      { id: "tank_spec", regulation: "49 CFR 178/180", title: "Tank Specifications & Testing", description: "DOT specification tanks: MC-306, MC-307, MC-312, MC-331, MC-338. Periodic inspection/testing required", severity: "critical" as const, applicableVerticals: ["tanker", "petroleum", "chemical"] },
    ],
  },
  fda_fsma: {
    category: "FDA / FSMA",
    requirements: [
      { id: "sanitary_transport", regulation: "21 CFR 1.900-934", title: "FSMA Sanitary Transportation Rule", description: "Vehicles/equipment must be clean, temp-controlled as needed, with written procedures and records", severity: "critical" as const, applicableVerticals: ["food", "refrigerated"] },
      { id: "preventive_controls", regulation: "21 CFR 117", title: "Preventive Controls for Human Food", description: "HARPC plan required for food facilities. Carrier must verify shipper compliance", severity: "high" as const, applicableVerticals: ["food", "refrigerated"] },
      { id: "fsvp", regulation: "21 CFR 1.500", title: "Foreign Supplier Verification", description: "FSVP program for importers. Verification of foreign supplier food safety compliance", severity: "high" as const, applicableVerticals: ["food", "intermodal"] },
    ],
  },
  spill: {
    category: "Spill Response Protocols",
    requirements: [
      { id: "spill_kit", regulation: "49 CFR 172.602", title: "Spill Kit Requirements", description: "Appropriate spill containment materials based on commodity: absorbent pads, booms, PPE", severity: "critical" as const, applicableVerticals: ["petroleum", "chemical", "tanker", "hazmat"] },
      { id: "nrc_report", regulation: "40 CFR 302.6", title: "NRC Reporting", description: "Call National Response Center 1-800-424-8802 for any spill exceeding reportable quantity within 15 minutes", severity: "critical" as const, applicableVerticals: ["petroleum", "chemical", "tanker", "hazmat", "environmental"] },
      { id: "state_report", regulation: "State SERC", title: "State Emergency Reporting", description: "Notify State Emergency Response Commission and Local Emergency Planning Committee", severity: "critical" as const, applicableVerticals: ["petroleum", "chemical", "tanker", "hazmat"] },
    ],
  },
};

// ── Construction Load Requirements ───────────────────────────────────────────
const CONSTRUCTION_REQUIREMENTS = {
  oversizePermits: {
    standard: { width: 8.5, height: 13.5, length: 53, weight: 80000 },
    requiresPermitWhen: "Load exceeds any standard dimension or 80,000 lbs GVW",
    stateVariations: [
      { state: "TX", maxWidth: 8.5, maxHeight: 14, maxLength: 59, maxWeight: 84000, notes: "Allows 84,000 GVW on certain routes. OS/OW permits from TxDMV." },
      { state: "CA", maxWidth: 8.5, maxHeight: 14, maxLength: 75, maxWeight: 80000, notes: "Caltrans issues permits. Annual or single-trip. Height restricted on many routes." },
      { state: "FL", maxWidth: 8.5, maxHeight: 13.5, maxLength: 75, maxWeight: 80000, notes: "FDOT issues permits. Superload >200,000 lbs requires engineering analysis." },
      { state: "NY", maxWidth: 8.5, maxHeight: 13.5, maxLength: 53, maxWeight: 80000, notes: "NYSDOT. Very restrictive on NYC routes. Special permits for bridges." },
      { state: "IL", maxWidth: 8.5, maxHeight: 13.5, maxLength: 60, maxWeight: 80000, notes: "IDOT. Superload permits for >120,000 lbs. Route-specific restrictions." },
    ],
  },
  escortRequirements: [
    { condition: "Width > 12 ft", escorts: 1, position: "Front", notes: "Most states require 1 front escort for loads 12-14 ft wide" },
    { condition: "Width > 14 ft", escorts: 2, position: "Front + Rear", notes: "2 escorts required. Many states require law enforcement notification" },
    { condition: "Width > 16 ft", escorts: 2, position: "Front + Rear + Police", notes: "State police escort often required. Route survey mandatory" },
    { condition: "Length > 100 ft", escorts: 1, position: "Rear", notes: "1 rear escort. Additional for very long loads" },
    { condition: "Length > 120 ft", escorts: 2, position: "Front + Rear", notes: "2 escorts. Route survey required in most states" },
    { condition: "Height > 15 ft", escorts: 1, position: "Front (height pole)", notes: "Front escort with height pole to verify clearances" },
    { condition: "Weight > 150,000 lbs", escorts: 2, position: "Front + Rear", notes: "Superload. Bridge analysis, route survey, possible police escort" },
  ],
  routeRestrictions: [
    "No travel on interstates during rush hours (varies by state, typically 6-9 AM, 3-6 PM)",
    "Daylight travel only for oversize loads in most states (30 min after sunrise to 30 min before sunset)",
    "No weekend or holiday travel for superloads in many states",
    "Bridge weight restrictions — federal bridge formula B applies, engineering analysis for superloads",
    "Tunnel restrictions — many tunnels prohibit oversized loads entirely",
    "Low-clearance bridge database must be checked (FHWA National Bridge Inventory)",
    "Wind restrictions — many states suspend OS permits at sustained winds > 25 mph",
  ],
  commonEquipment: [
    { type: "Lowboy / RGN", maxWeight: 80000, deckHeight: "18-24 in", bestFor: "Construction equipment, heavy machinery" },
    { type: "Step Deck", maxWeight: 48000, deckHeight: "36 in (lower), 60 in (upper)", bestFor: "Tall equipment that exceeds flatbed height" },
    { type: "Multi-Axle RGN", maxWeight: 200000, deckHeight: "16-20 in", bestFor: "Transformers, generators, industrial super loads" },
    { type: "Perimeter Frame", maxWeight: 250000, deckHeight: "Custom", bestFor: "Wind turbine nacelles, bridge beams" },
    { type: "Hydraulic Platform (Goldhofer)", maxWeight: 500000, deckHeight: "Variable", bestFor: "Super loads, modular buildings, reactors" },
  ],
};

// ── Pharmaceutical Chain of Custody ──────────────────────────────────────────
const PHARMA_CHAIN_OF_CUSTODY = {
  trackingRequirements: [
    { stage: "Pickup", requirements: ["Verify shipper license (DEA registration for controlled)", "Temp logger activation and calibration check", "Seal number recorded on BOL", "Photo documentation of cargo and seals", "GPS tracking activated"], responsible: "Driver + Shipper" },
    { stage: "In Transit", requirements: ["Continuous GPS tracking", "Temperature monitoring every 5 minutes", "No unauthorized stops > 15 minutes", "Tamper-evident seal integrity check at every stop", "Driver must remain with vehicle (controlled substances)"], responsible: "Driver + Dispatch" },
    { stage: "Delivery", requirements: ["Seal integrity verification before unloading", "Temperature log download and review", "Receiver signature with license verification", "Photo documentation of delivered cargo", "Any temperature excursion documented and reported"], responsible: "Driver + Receiver" },
    { stage: "Documentation", requirements: ["BOL with complete chain of custody signatures", "Temperature log archived for minimum 3 years", "GPS route log archived", "Excursion reports filed within 24 hours", "DEA-222 forms completed for Schedule II (triplicate)"], responsible: "Carrier + Shipper + Receiver" },
  ],
  deaSchedules: [
    { schedule: "Schedule I", examples: "Research chemicals (heroin, LSD, peyote)", transport: "Rarely transported commercially. Requires specific DEA research registration", requirements: ["DEA Form 222", "Armed courier often required", "Cannot be stored in transit"] },
    { schedule: "Schedule II", examples: "Oxycodone, fentanyl, morphine, amphetamine", transport: "Highest security requirements for commercial transport", requirements: ["DEA Form 222 (triplicate)", "Locked cage/vault in vehicle", "Two-person team recommended", "Real-time GPS tracking mandatory", "Background-checked drivers only"] },
    { schedule: "Schedule III", examples: "Codeine combinations, ketamine, anabolic steroids", transport: "High security, written records required", requirements: ["Invoice/packing list sufficient (no DEA-222)", "Locked compartment", "Chain of custody documentation", "Driver background check"] },
    { schedule: "Schedule IV", examples: "Benzodiazepines (Xanax, Valium), tramadol, zolpidem", transport: "Standard secure transport with documentation", requirements: ["Invoice records", "Secure compartment", "Chain of custody", "Biennial inventory"] },
    { schedule: "Schedule V", examples: "Cough preparations with codeine, pregabalin", transport: "Standard transport with record-keeping", requirements: ["Invoice records", "Standard secure transport", "Record retention 2 years"] },
  ],
  gdpRequirements: [
    "Good Distribution Practice (GDP) training for all personnel",
    "Qualified transport vehicles with validated temperature control",
    "Written SOPs for transport, storage, and handling",
    "Risk-based approach to temperature monitoring",
    "Deviation and CAPA (Corrective and Preventive Action) procedures",
    "Annual GDP qualification of transport routes",
    "Supplier qualification and audit program",
  ],
};

// ── Livestock Welfare Protocols ──────────────────────────────────────────────
const LIVESTOCK_WELFARE = {
  regulations: [
    { regulation: "28-Hour Law (49 USC 80502)", description: "Animals must be unloaded for rest, water, and feeding after 28 consecutive hours of transport. Rest period minimum 5 hours.", severity: "critical" as const, penalty: "Up to $500 per violation per animal" },
    { regulation: "USDA APHIS 9 CFR 89", description: "Requirements for cleaning and disinfecting vehicles used for interstate livestock transport", severity: "high" as const, penalty: "Quarantine and cleaning at owner's expense" },
    { regulation: "State Veterinary Requirements", description: "Certificate of Veterinary Inspection (CVI/health certificate) required within 30 days for interstate movement", severity: "critical" as const, penalty: "Livestock refused entry, quarantine, fines vary by state" },
    { regulation: "Humane Slaughter Act (7 USC 1901)", description: "Animals must be handled humanely during transport to slaughter facilities", severity: "critical" as const, penalty: "Plant suspension, criminal penalties" },
    { regulation: "FMCSA Hours of Service", description: "Livestock drivers may use the agricultural HOS exemption within 150 air-mile radius of source", severity: "high" as const, penalty: "Standard HOS violations" },
  ],
  maxTransitTimes: [
    { animal: "Cattle", maxHours: 28, restHours: 5, densityPerFt: "1 head / 12-14 sq ft (market weight)", notes: "Reduce density in hot weather. Cattle stress at > 80 F." },
    { animal: "Hogs / Swine", maxHours: 24, restHours: 5, densityPerFt: "1 head / 3-4 sq ft (market weight)", notes: "Most heat-sensitive livestock. Misters/sprinklers above 70 F. Avoid loading in peak heat." },
    { animal: "Poultry", maxHours: 24, restHours: 5, densityPerFt: "Per crate/cage capacity", notes: "No federal unloading required but welfare audits apply. Heat stress above 85 F is critical." },
    { animal: "Horses", maxHours: 28, restHours: 8, densityPerFt: "1 horse / 24-28 sq ft", notes: "Higher welfare standard. Individual stalls preferred. USDA APHIS for international." },
    { animal: "Sheep / Goats", maxHours: 28, restHours: 5, densityPerFt: "1 head / 4-5 sq ft", notes: "Separation by species recommended. Horned and polled should be separated." },
  ],
  restStopRequirements: [
    "USDA-approved stockyards or rest stop facilities",
    "Adequate pen space, fresh water, and appropriate feed",
    "Shelter from extreme weather conditions",
    "Veterinary access if animals show distress",
    "Minimum 5-hour rest period (8 hours for horses)",
    "Bedding/footing appropriate for species",
    "Ramp angle must not exceed 25 degrees",
  ],
  weatherRestrictions: [
    { condition: "Temperature > 95 F", action: "Stop loading. Provide shade and water. Consider night transport.", applies: "All species" },
    { condition: "Temperature > 80 F", action: "Reduce density 10-15%. Ensure ventilation. Avoid prolonged stops.", applies: "Hogs/Swine (most sensitive)" },
    { condition: "Temperature < 20 F", action: "Provide windbreaks. Increase bedding. Reduce transit time.", applies: "Poultry, young livestock" },
    { condition: "Wind Chill < 0 F", action: "Close trailer vents partially. Monitor for hypothermia.", applies: "All species" },
  ],
};

// ── Intermodal Configurations ────────────────────────────────────────────────
const INTERMODAL_CONFIGS = {
  containerSpecs: [
    { type: "20ft Standard (TEU)", dimensions: { length: 19.875, width: 7.708, height: 7.875, unit: "ft" }, maxPayload: 47900, tareWeight: 4850, cubicCapacity: 1172, unit: "lbs" },
    { type: "40ft Standard", dimensions: { length: 39.458, width: 7.708, height: 7.875, unit: "ft" }, maxPayload: 58820, tareWeight: 8380, cubicCapacity: 2390, unit: "lbs" },
    { type: "40ft High-Cube", dimensions: { length: 39.458, width: 7.708, height: 8.875, unit: "ft" }, maxPayload: 58490, tareWeight: 8710, cubicCapacity: 2694, unit: "lbs" },
    { type: "45ft High-Cube", dimensions: { length: 44.5, width: 7.708, height: 8.875, unit: "ft" }, maxPayload: 57200, tareWeight: 10000, cubicCapacity: 3040, unit: "lbs" },
    { type: "20ft Reefer", dimensions: { length: 17.833, width: 7.417, height: 7.167, unit: "ft" }, maxPayload: 41500, tareWeight: 6500, cubicCapacity: 948, unit: "lbs" },
    { type: "40ft Reefer", dimensions: { length: 37.917, width: 7.417, height: 7.5, unit: "ft" }, maxPayload: 52700, tareWeight: 9700, cubicCapacity: 2104, unit: "lbs" },
  ],
  chassisTypes: [
    { type: "20ft Chassis", maxPayload: 52900, characteristics: "Single axle or tandem. Used for standard 20ft containers." },
    { type: "40ft Chassis", maxPayload: 67200, characteristics: "Tandem axle. Most common for 40ft and 40ft HC containers." },
    { type: "40/45ft Combo Chassis", maxPayload: 65000, characteristics: "Extendable/slider chassis. Accommodates both 40ft and 45ft containers." },
    { type: "Tri-Axle Chassis", maxPayload: 72000, characteristics: "For overweight containers. Required in some states for heavy loads." },
    { type: "Bomb Cart / Yard Chassis", maxPayload: 67200, characteristics: "Terminal use only. Not road-legal." },
  ],
  portProtocols: [
    { port: "Los Angeles / Long Beach", turnTime: "2-4 hours", appointments: "Required (PierPASS/TMF)", notes: "Busiest US port complex. Off-peak incentive program. Chassis pool (DCLI, TRAC, Flexi-Van)." },
    { port: "New York / New Jersey", turnTime: "2-5 hours", appointments: "Required", notes: "Port Authority NYNJ. Chassis pools (NACPC). High congestion surcharges." },
    { port: "Savannah (GPA)", turnTime: "1-3 hours", appointments: "Required", notes: "Fastest-growing US port. Garden City Terminal. Good truck turn times." },
    { port: "Houston", turnTime: "1-3 hours", appointments: "Required", notes: "Port Houston Bayport and Barbours Cut. Growing container volumes." },
    { port: "Charleston (SCPA)", turnTime: "1-3 hours", appointments: "Required", notes: "Hugh Leatherman Terminal. Deepest harbor on East Coast." },
    { port: "Seattle / Tacoma", turnTime: "2-4 hours", appointments: "Required", notes: "Northwest Seaport Alliance. Gateway to Asia-Pacific." },
  ],
};

// ── Seasonal Factors ─────────────────────────────────────────────────────────
const SEASONAL_FACTORS: Record<string, {
  vertical: string;
  seasons: Array<{
    period: string;
    months: string;
    demandMultiplier: number;
    rateImpact: string;
    drivers: string[];
  }>;
}> = {
  petroleum: {
    vertical: "Petroleum",
    seasons: [
      { period: "Winter Heating Season", months: "Nov-Mar", demandMultiplier: 1.35, rateImpact: "+25-40%", drivers: ["Heating oil demand surge", "Propane deliveries increase 3x", "Winter diesel additives", "Holiday travel fuel demand"] },
      { period: "Spring Refinery Maintenance", months: "Mar-May", demandMultiplier: 1.15, rateImpact: "+10-20%", drivers: ["Refinery turnarounds reduce supply", "Summer blend gasoline transition", "Regional supply imbalances"] },
      { period: "Summer Driving Season", months: "Jun-Aug", demandMultiplier: 1.25, rateImpact: "+15-30%", drivers: ["Peak gasoline demand", "RVP specification changes", "Vacation travel surge", "Hurricane season risk (Gulf Coast)"] },
      { period: "Fall Harvest & Transition", months: "Sep-Nov", demandMultiplier: 1.10, rateImpact: "+5-15%", drivers: ["Harvest fuel demand", "Winter blend transition", "Pre-winter propane stocking"] },
    ],
  },
  food: {
    vertical: "Food / Agriculture",
    seasons: [
      { period: "Spring Planting", months: "Mar-May", demandMultiplier: 1.15, rateImpact: "+10-20%", drivers: ["Seed and fertilizer transport", "Early produce (FL, TX, CA)", "Greenhouse shipments"] },
      { period: "Summer Peak Produce", months: "Jun-Aug", demandMultiplier: 1.30, rateImpact: "+20-35%", drivers: ["Peak fruit/vegetable harvest", "Reefer capacity extremely tight", "Berry season (CA, OR, WA)", "Sweet corn, watermelon corridors"] },
      { period: "Fall Harvest", months: "Sep-Nov", demandMultiplier: 1.40, rateImpact: "+25-45%", drivers: ["Grain harvest (corn, soybeans, wheat)", "Apple, pumpkin harvest", "Holiday food distribution", "Reefer + dry van both tight"] },
      { period: "Winter/Holiday", months: "Dec-Feb", demandMultiplier: 1.20, rateImpact: "+10-25%", drivers: ["Holiday food distribution", "Citrus season (FL, TX, CA)", "Import produce from Mexico", "Cold weather shipping challenges"] },
    ],
  },
  construction: {
    vertical: "Construction",
    seasons: [
      { period: "Spring Ramp-Up", months: "Mar-May", demandMultiplier: 1.25, rateImpact: "+15-30%", drivers: ["Construction season begins", "Road/bridge projects start", "Steel and aggregate demand surge", "Equipment mobilization"] },
      { period: "Summer Peak", months: "Jun-Aug", demandMultiplier: 1.40, rateImpact: "+25-45%", drivers: ["Peak construction activity", "Infrastructure projects at full speed", "Flatbed capacity very tight", "Aggregate and concrete demand peak"] },
      { period: "Fall Wind-Down", months: "Sep-Nov", demandMultiplier: 1.15, rateImpact: "+5-20%", drivers: ["Projects racing to finish before winter", "Year-end budget spending", "Equipment demobilization"] },
      { period: "Winter Slowdown", months: "Dec-Feb", demandMultiplier: 0.75, rateImpact: "-10-25%", drivers: ["Northern states halt outdoor projects", "Reduced aggregate/concrete", "Indoor construction continues", "Equipment maintenance/storage"] },
    ],
  },
  pharma: {
    vertical: "Pharmaceutical",
    seasons: [
      { period: "Flu Season Prep", months: "Jul-Sep", demandMultiplier: 1.30, rateImpact: "+20-35%", drivers: ["Flu vaccine distribution", "Pharmacy stocking cycles", "Cold chain capacity premium"] },
      { period: "Q4 Budget Flush", months: "Oct-Dec", demandMultiplier: 1.20, rateImpact: "+15-25%", drivers: ["Year-end distribution targets", "New drug launches", "Holiday inventory builds", "Clinical trial shipments"] },
      { period: "Q1 New Year", months: "Jan-Mar", demandMultiplier: 1.15, rateImpact: "+10-20%", drivers: ["Insurance formulary changes", "New product launches", "Flu/cold season peak demand"] },
      { period: "Q2 Steady State", months: "Apr-Jun", demandMultiplier: 1.00, rateImpact: "Baseline", drivers: ["Lowest seasonal impact", "Allergy medication spike", "Clinical trial shipments steady"] },
    ],
  },
  livestock: {
    vertical: "Livestock",
    seasons: [
      { period: "Spring Calving/Shipping", months: "Mar-May", demandMultiplier: 1.25, rateImpact: "+15-30%", drivers: ["Calf shipping to feedlots", "Spring grass cattle movement", "Auction season begins"] },
      { period: "Summer Challenge", months: "Jun-Aug", demandMultiplier: 0.90, rateImpact: "-5-15%", drivers: ["Heat stress limits shipping", "Night/early morning loading only", "Reduced transport for animal welfare"] },
      { period: "Fall Run", months: "Sep-Nov", demandMultiplier: 1.45, rateImpact: "+30-50%", drivers: ["Peak cattle shipping season", "Fall calf sales", "Feedlot placements surge", "Pot trailer capacity very tight"] },
      { period: "Winter", months: "Dec-Feb", demandMultiplier: 1.05, rateImpact: "+0-10%", drivers: ["Reduced shipping volume", "Cold weather challenges", "Fat cattle to packing plants steady"] },
    ],
  },
  intermodal: {
    vertical: "Intermodal",
    seasons: [
      { period: "Chinese New Year Impact", months: "Jan-Mar", demandMultiplier: 0.85, rateImpact: "-10-20%", drivers: ["Asian factory shutdowns", "Reduced import volumes", "Post-holiday inventory drawdown"] },
      { period: "Pre-Peak Stocking", months: "Jun-Aug", demandMultiplier: 1.35, rateImpact: "+20-40%", drivers: ["Retailers stocking for back-to-school + holiday", "Asia-US peak shipping", "Chassis shortages at major ports"] },
      { period: "Peak Season", months: "Sep-Nov", demandMultiplier: 1.45, rateImpact: "+30-50%", drivers: ["Holiday inventory rush", "Vessel capacity maxed", "Drayage capacity extremely tight", "Port congestion surcharges"] },
      { period: "Post-Peak Lull", months: "Dec-Jan", demandMultiplier: 0.90, rateImpact: "-5-15%", drivers: ["Post-holiday volume drop", "Inventory corrections", "Carrier repositioning"] },
    ],
  },
};

// ── Carrier Certifications ───────────────────────────────────────────────────
const CARRIER_CERTIFICATIONS: Record<string, {
  vertical: string;
  certifications: Array<{
    id: string;
    name: string;
    issuedBy: string;
    required: boolean;
    renewalPeriod: string;
    description: string;
    verificationUrl?: string;
  }>;
}> = {
  petroleum: {
    vertical: "Petroleum",
    certifications: [
      { id: "hazmat_endorsement", name: "CDL Hazmat Endorsement (H)", issuedBy: "State DMV / TSA", required: true, renewalPeriod: "5 years (with TSA background check)", description: "Required for all drivers hauling petroleum products. TSA threat assessment required.", verificationUrl: "https://www.tsa.gov/for-industry/hazmat-endorsement" },
      { id: "tanker_endorsement", name: "CDL Tanker Endorsement (N)", issuedBy: "State DMV", required: true, renewalPeriod: "CDL renewal cycle", description: "Required for drivers operating tank vehicles with capacity > 1,000 gallons" },
      { id: "twic", name: "TWIC Card", issuedBy: "TSA", required: true, renewalPeriod: "5 years", description: "Transportation Worker Identification Credential. Required for port and refinery access.", verificationUrl: "https://www.tsa.gov/for-industry/twic" },
      { id: "api_cert", name: "API Training Certification", issuedBy: "American Petroleum Institute", required: false, renewalPeriod: "3 years", description: "API RP 1004 — Loading/unloading tank trucks. Industry best practice." },
      { id: "pec_safeland", name: "PEC SafeLand/SafeGulf", issuedBy: "PEC Safety", required: false, renewalPeriod: "Annual", description: "Required by many refineries and upstream operators for facility access" },
    ],
  },
  chemical: {
    vertical: "Chemical",
    certifications: [
      { id: "hazmat_endorsement", name: "CDL Hazmat Endorsement (H)", issuedBy: "State DMV / TSA", required: true, renewalPeriod: "5 years", description: "Required for all hazmat transport" },
      { id: "tanker_endorsement", name: "CDL Tanker Endorsement (N)", issuedBy: "State DMV", required: true, renewalPeriod: "CDL renewal", description: "Required for liquid chemical tankers" },
      { id: "hazmat_training", name: "DOT Hazmat Training", issuedBy: "Employer / Training Provider", required: true, renewalPeriod: "3 years (49 CFR 172.704)", description: "General awareness, function-specific, safety, security training" },
      { id: "rcra_training", name: "RCRA Hazardous Waste Training", issuedBy: "Employer / Training Provider", required: false, renewalPeriod: "Annual (40 CFR 265.16)", description: "Required for drivers handling hazardous waste shipments" },
      { id: "responsible_care", name: "Responsible Care Certification", issuedBy: "American Chemistry Council", required: false, renewalPeriod: "3 years", description: "Industry-recognized program for chemical transport safety" },
    ],
  },
  food: {
    vertical: "Food / Agriculture",
    certifications: [
      { id: "fsma_training", name: "FSMA Sanitary Transportation Training", issuedBy: "FDA-recognized provider", required: true, renewalPeriod: "3 years recommended", description: "21 CFR 1.900-934 training for food transport" },
      { id: "haccp", name: "HACCP Certification", issuedBy: "Training provider", required: false, renewalPeriod: "5 years", description: "Hazard Analysis Critical Control Points. Required by many food shippers." },
      { id: "sqf_transport", name: "SQF Transport Certification", issuedBy: "SQF Institute", required: false, renewalPeriod: "Annual audit", description: "Safe Quality Food program for transport operators" },
      { id: "organic_handler", name: "USDA Organic Handler Certification", issuedBy: "USDA-accredited certifier", required: false, renewalPeriod: "Annual", description: "Required for transporting certified organic products" },
      { id: "smartway", name: "EPA SmartWay Partner", issuedBy: "EPA", required: false, renewalPeriod: "Annual reporting", description: "Voluntary program for fuel-efficient, lower-emission freight transport" },
    ],
  },
  pharma: {
    vertical: "Pharmaceutical",
    certifications: [
      { id: "gdp_training", name: "GDP Training Certification", issuedBy: "WHO/PDA recognized provider", required: true, renewalPeriod: "Annual refresher", description: "Good Distribution Practice training for pharmaceutical logistics" },
      { id: "dea_registration", name: "DEA Registration (Carrier)", issuedBy: "DEA", required: true, renewalPeriod: "Annual (DEA Form 510)", description: "Required for carriers transporting controlled substances" },
      { id: "iata_dgr", name: "IATA DGR Certification", issuedBy: "IATA", required: false, renewalPeriod: "2 years", description: "For intermodal pharma shipments involving air transport" },
      { id: "ceiv_pharma", name: "CEIV Pharma Certification", issuedBy: "IATA", required: false, renewalPeriod: "3 years", description: "Center of Excellence for Independent Validators — pharma logistics" },
      { id: "tapa_tsr", name: "TAPA TSR Certification", issuedBy: "Transported Asset Protection Assoc.", required: false, renewalPeriod: "3 years", description: "Trucking Security Requirements for high-value pharma shipments" },
    ],
  },
  livestock: {
    vertical: "Livestock",
    certifications: [
      { id: "tqa", name: "Beef Quality Assurance (BQA) Transportation", issuedBy: "National Cattlemen's Beef Association", required: false, renewalPeriod: "3 years", description: "Industry standard for livestock transport best practices" },
      { id: "pqa_transport", name: "PQA Plus Transport Quality Assurance", issuedBy: "National Pork Board", required: false, renewalPeriod: "3 years", description: "Required by most pork packers for hog haulers" },
      { id: "livestock_hauler", name: "Certified Livestock Hauler", issuedBy: "Professional Animal Auditor Certification Organization", required: false, renewalPeriod: "5 years", description: "Third-party certification for livestock transport competency" },
      { id: "state_brand_inspector", name: "Brand Inspector License", issuedBy: "State Brand Board", required: false, renewalPeriod: "Annual", description: "Required in western brand-inspection states for cattle transport" },
    ],
  },
  intermodal: {
    vertical: "Intermodal",
    certifications: [
      { id: "twic", name: "TWIC Card", issuedBy: "TSA", required: true, renewalPeriod: "5 years", description: "Required for all port/terminal access" },
      { id: "port_access", name: "Port Access Card / Registration", issuedBy: "Port Authority", required: true, renewalPeriod: "Annual", description: "Terminal-specific access registration (e.g., RFID tag, biometric)" },
      { id: "chassis_inspection", name: "FHWA Chassis Inspection Certification", issuedBy: "IANA / IEP", required: false, renewalPeriod: "Annual", description: "Intermodal Equipment Provider chassis roadability inspection" },
      { id: "c_tpat", name: "C-TPAT Membership", issuedBy: "CBP", required: false, renewalPeriod: "Annual validation", description: "Customs-Trade Partnership Against Terrorism. Expedited clearance benefit." },
    ],
  },
  automotive: {
    vertical: "Automotive",
    certifications: [
      { id: "dot_auto_carrier", name: "DOT Auto Carrier Registration", issuedBy: "FMCSA", required: true, renewalPeriod: "Biennial (MCS-150)", description: "Motor carrier authority for auto transport" },
      { id: "auto_carrier_insurance", name: "Auto Transport Cargo Insurance", issuedBy: "Insurance carrier", required: true, renewalPeriod: "Annual", description: "Specialized cargo coverage for vehicles in transit ($100K+ per load)" },
      { id: "enclosed_cert", name: "Enclosed Transport Certification", issuedBy: "Industry training", required: false, renewalPeriod: "No expiration", description: "Specialized training for enclosed exotic/classic vehicle transport" },
    ],
  },
  construction: {
    vertical: "Construction",
    certifications: [
      { id: "oversize_permit_agent", name: "Oversize/Overweight Permit Agent", issuedBy: "State DOT", required: false, renewalPeriod: "Annual", description: "Authorized to obtain OS/OW permits in multiple states" },
      { id: "nccco_rigger", name: "NCCCO Rigger Certification", issuedBy: "National Commission for the Certification of Crane Operators", required: false, renewalPeriod: "5 years", description: "For loads requiring crane loading/unloading" },
      { id: "pilot_car", name: "Pilot Car / Escort Vehicle Certification", issuedBy: "State DOT", required: false, renewalPeriod: "Varies by state", description: "Required to operate as escort vehicle for oversize loads" },
    ],
  },
};

// ── Vertical Analytics KPIs ──────────────────────────────────────────────────
const VERTICAL_ANALYTICS: Record<string, {
  vertical: string;
  kpis: Array<{
    metric: string;
    value: number;
    unit: string;
    trend: number;
    benchmark: number;
    benchmarkLabel: string;
  }>;
}> = {
  petroleum: {
    vertical: "Petroleum",
    kpis: [
      { metric: "Avg Revenue per Load", value: 4850, unit: "$", trend: 8.2, benchmark: 4200, benchmarkLabel: "Industry Avg" },
      { metric: "Tank Utilization Rate", value: 87, unit: "%", trend: 3.1, benchmark: 82, benchmarkLabel: "Industry Avg" },
      { metric: "Spill Incident Rate", value: 0.02, unit: "per 1K loads", trend: -15, benchmark: 0.05, benchmarkLabel: "PHMSA Target" },
      { metric: "Avg Transit Time", value: 8.5, unit: "hours", trend: -2.3, benchmark: 10, benchmarkLabel: "Industry Avg" },
      { metric: "On-Time Delivery", value: 94.2, unit: "%", trend: 1.8, benchmark: 92, benchmarkLabel: "Industry Avg" },
      { metric: "Driver Compliance Score", value: 97, unit: "%", trend: 0.5, benchmark: 95, benchmarkLabel: "Minimum" },
    ],
  },
  food: {
    vertical: "Food / Agriculture",
    kpis: [
      { metric: "Temperature Compliance", value: 98.5, unit: "%", trend: 0.8, benchmark: 97, benchmarkLabel: "FSMA Target" },
      { metric: "Avg Revenue per Mile", value: 3.45, unit: "$/mi", trend: 5.2, benchmark: 2.85, benchmarkLabel: "Dry Van Avg" },
      { metric: "Reefer Breakdown Rate", value: 1.2, unit: "%", trend: -8.5, benchmark: 2.0, benchmarkLabel: "Industry Avg" },
      { metric: "Product Rejection Rate", value: 0.8, unit: "%", trend: -12, benchmark: 1.5, benchmarkLabel: "Industry Avg" },
      { metric: "FSMA Audit Pass Rate", value: 96, unit: "%", trend: 2.1, benchmark: 90, benchmarkLabel: "FDA Expectation" },
      { metric: "Load-to-Truck Ratio", value: 8.5, unit: ":1", trend: 15, benchmark: 5.2, benchmarkLabel: "Dry Van Avg" },
    ],
  },
  construction: {
    vertical: "Construction",
    kpis: [
      { metric: "Avg Revenue per Load", value: 6200, unit: "$", trend: 12, benchmark: 4800, benchmarkLabel: "Flatbed Avg" },
      { metric: "Permit Processing Time", value: 3.2, unit: "days", trend: -18, benchmark: 5, benchmarkLabel: "Industry Avg" },
      { metric: "OS/OW Compliance Rate", value: 99.1, unit: "%", trend: 0.3, benchmark: 98, benchmarkLabel: "Target" },
      { metric: "Equipment Utilization", value: 78, unit: "%", trend: 5.4, benchmark: 72, benchmarkLabel: "Industry Avg" },
      { metric: "Escort Cost per Load", value: 850, unit: "$", trend: 6.2, benchmark: 750, benchmarkLabel: "Industry Avg" },
      { metric: "Seasonal Rate Premium", value: 32, unit: "%", trend: 8, benchmark: 25, benchmarkLabel: "Historical Avg" },
    ],
  },
  pharma: {
    vertical: "Pharmaceutical",
    kpis: [
      { metric: "Chain of Custody Compliance", value: 99.8, unit: "%", trend: 0.2, benchmark: 99.5, benchmarkLabel: "GDP Target" },
      { metric: "Temperature Excursion Rate", value: 0.3, unit: "%", trend: -25, benchmark: 0.5, benchmarkLabel: "Industry Max" },
      { metric: "Avg Revenue per Load", value: 8500, unit: "$", trend: 6.8, benchmark: 7200, benchmarkLabel: "Industry Avg" },
      { metric: "DEA Audit Compliance", value: 100, unit: "%", trend: 0, benchmark: 100, benchmarkLabel: "Required" },
      { metric: "On-Time Delivery", value: 97.5, unit: "%", trend: 1.2, benchmark: 95, benchmarkLabel: "SLA Target" },
      { metric: "Mean Kinetic Temp Variance", value: 1.2, unit: "F", trend: -8, benchmark: 2.0, benchmarkLabel: "USP Max" },
    ],
  },
  chemical: {
    vertical: "Chemical",
    kpis: [
      { metric: "Hazmat Compliance Score", value: 98.5, unit: "%", trend: 1.1, benchmark: 97, benchmarkLabel: "PHMSA Target" },
      { metric: "Avg Revenue per Load", value: 5600, unit: "$", trend: 7.5, benchmark: 4800, benchmarkLabel: "Industry Avg" },
      { metric: "Incident-Free Miles", value: 2450000, unit: "miles", trend: 12, benchmark: 2000000, benchmarkLabel: "Prev Year" },
      { metric: "Tank Inspection Pass Rate", value: 96.8, unit: "%", trend: 0.8, benchmark: 95, benchmarkLabel: "DOT Minimum" },
      { metric: "Emergency Response Readiness", value: 94, unit: "%", trend: 3, benchmark: 90, benchmarkLabel: "ACC Target" },
      { metric: "Cross-Contamination Events", value: 0, unit: "events", trend: 0, benchmark: 0, benchmarkLabel: "Zero Tolerance" },
    ],
  },
  livestock: {
    vertical: "Livestock",
    kpis: [
      { metric: "Animal Welfare Score", value: 96, unit: "%", trend: 2.5, benchmark: 90, benchmarkLabel: "BQA Target" },
      { metric: "Avg Revenue per Load", value: 3800, unit: "$", trend: 4.2, benchmark: 3200, benchmarkLabel: "Industry Avg" },
      { metric: "28-Hour Law Compliance", value: 100, unit: "%", trend: 0, benchmark: 100, benchmarkLabel: "Required" },
      { metric: "Mortality Rate", value: 0.05, unit: "%", trend: -20, benchmark: 0.1, benchmarkLabel: "Industry Avg" },
      { metric: "Health Cert Compliance", value: 99.5, unit: "%", trend: 0.5, benchmark: 100, benchmarkLabel: "Required" },
      { metric: "Seasonal Pot Utilization", value: 82, unit: "%", trend: 8, benchmark: 75, benchmarkLabel: "Industry Avg" },
    ],
  },
  intermodal: {
    vertical: "Intermodal",
    kpis: [
      { metric: "Avg Turn Time", value: 2.8, unit: "hours", trend: -12, benchmark: 3.5, benchmarkLabel: "Port Avg" },
      { metric: "Chassis Availability", value: 88, unit: "%", trend: 5, benchmark: 82, benchmarkLabel: "Industry Avg" },
      { metric: "On-Time Port Arrivals", value: 91, unit: "%", trend: 3.2, benchmark: 85, benchmarkLabel: "Industry Avg" },
      { metric: "Demurrage Charges Avoided", value: 78, unit: "%", trend: 15, benchmark: 60, benchmarkLabel: "Industry Avg" },
      { metric: "Avg Revenue per Dray", value: 680, unit: "$", trend: 8.5, benchmark: 550, benchmarkLabel: "Market Avg" },
      { metric: "Container Damage Rate", value: 0.3, unit: "%", trend: -10, benchmark: 0.5, benchmarkLabel: "Industry Avg" },
    ],
  },
  automotive: {
    vertical: "Automotive",
    kpis: [
      { metric: "Damage Claim Rate", value: 0.8, unit: "%", trend: -15, benchmark: 1.5, benchmarkLabel: "Industry Avg" },
      { metric: "Avg Revenue per Vehicle", value: 450, unit: "$", trend: 6.2, benchmark: 380, benchmarkLabel: "Market Avg" },
      { metric: "Load Factor", value: 8.2, unit: "vehicles", trend: 3, benchmark: 7.5, benchmarkLabel: "Avg per Load" },
      { metric: "On-Time Delivery", value: 93, unit: "%", trend: 2.8, benchmark: 90, benchmarkLabel: "Industry Avg" },
      { metric: "VCR Completion Rate", value: 99.2, unit: "%", trend: 1.1, benchmark: 98, benchmarkLabel: "Target" },
      { metric: "Enclosed Premium Revenue", value: 62, unit: "% of loads", trend: 8, benchmark: 45, benchmarkLabel: "Market Avg" },
    ],
  },
};

// ── Specialized Equipment Data ───────────────────────────────────────────────
const SPECIALIZED_EQUIPMENT: Record<string, {
  vertical: string;
  equipment: Array<{
    type: string;
    specification: string;
    capacity: string;
    certifications: string[];
    avgDayRate: number;
    availability: string;
    notes: string;
  }>;
}> = {
  petroleum: {
    vertical: "Petroleum",
    equipment: [
      { type: "MC-306 (DOT 406)", specification: "Atmospheric pressure, non-insulated", capacity: "8,500-9,500 gal", certifications: ["DOT Spec 406", "Annual visual inspection", "5-year pressure test"], avgDayRate: 1800, availability: "High", notes: "Most common for gasoline, diesel, ethanol. Elliptical cross-section for low center of gravity." },
      { type: "MC-307 (DOT 407)", specification: "Low pressure, insulated", capacity: "6,000-7,000 gal", certifications: ["DOT Spec 407", "Annual inspection", "5-year hydrostatic test"], avgDayRate: 2200, availability: "Moderate", notes: "Chemicals, mild corrosives, food-grade liquids. Circular cross-section. Often stainless steel." },
      { type: "MC-312 (DOT 412)", specification: "High pressure, acid-resistant", capacity: "4,500-6,500 gal", certifications: ["DOT Spec 412", "Annual inspection", "5-year hydrostatic test"], avgDayRate: 2800, availability: "Low", notes: "Corrosive liquids (acid, caustic). Rubber-lined or special alloy construction." },
      { type: "MC-331", specification: "High-pressure compressed gas", capacity: "10,000-11,500 gal", certifications: ["DOT MC-331", "Annual inspection", "5-year hydrostatic test", "Pressure relief device test"], avgDayRate: 2500, availability: "Moderate", notes: "LPG, propane, anhydrous ammonia. Cylindrical. 250+ PSI working pressure." },
      { type: "MC-338", specification: "Cryogenic", capacity: "9,000-11,000 gal", certifications: ["DOT MC-338", "Annual inspection", "5-year test"], avgDayRate: 3200, availability: "Low", notes: "LNG, liquid nitrogen, liquid oxygen, liquid argon. Double-walled vacuum insulation." },
    ],
  },
  food: {
    vertical: "Food / Agriculture",
    equipment: [
      { type: "Standard Reefer (53ft)", specification: "Carrier/Thermo King unit, single-temp", capacity: "44,000 lbs / 2,500 cu ft", certifications: ["Reefer unit annual certification", "FSMA-compliant trailer"], avgDayRate: 1200, availability: "High", notes: "Most common for food transport. Temp range: -20 F to 70 F. 6-hour fuel capacity." },
      { type: "Multi-Temp Reefer", specification: "2-3 temperature zones", capacity: "42,000 lbs / 2,200 cu ft", certifications: ["Multi-zone certification", "FSMA compliance"], avgDayRate: 1500, availability: "Low", notes: "Allows frozen + chilled + ambient in one trailer. Movable bulkhead dividers." },
      { type: "Food-Grade Tanker", specification: "Stainless steel, CIP-capable", capacity: "5,500-6,500 gal", certifications: ["FDA food contact", "Kosher certification available", "3-A Sanitary Standards"], avgDayRate: 2000, availability: "Moderate", notes: "Milk, juice, wine, cooking oil. Must provide tank wash ticket before loading." },
      { type: "Hopper/Grain Trailer", specification: "Aluminum or steel hopper bottom", capacity: "48,000 lbs / 1,000 cu ft", certifications: ["Scale certification", "Food-grade interior"], avgDayRate: 900, availability: "Seasonal", notes: "Grain, feed, sugar, flour. High demand during harvest (Sep-Nov). Self-unloading." },
    ],
  },
  construction: {
    vertical: "Construction",
    equipment: [
      { type: "Standard Flatbed (53ft)", specification: "Aluminum or steel deck", capacity: "48,000 lbs", certifications: ["Annual DOT inspection"], avgDayRate: 800, availability: "High", notes: "Steel, lumber, pipe, machinery. Requires securement equipment (chains, straps, binders)." },
      { type: "Step Deck / Drop Deck", specification: "Upper deck 60in, lower deck 36in", capacity: "48,000 lbs", certifications: ["Annual DOT inspection"], avgDayRate: 900, availability: "High", notes: "Tall loads that would exceed height limits on standard flatbed. No ramp needed for forklifts." },
      { type: "RGN (Removable Gooseneck)", specification: "Front detaches for drive-on loading", capacity: "42,000-180,000 lbs (multi-axle)", certifications: ["Annual DOT inspection", "State permits for overweight"], avgDayRate: 1400, availability: "Moderate", notes: "Construction equipment (excavators, loaders). Front drops to create ramp." },
      { type: "Lowboy", specification: "Deck height 18-24 inches", capacity: "40,000-80,000 lbs", certifications: ["Annual DOT inspection"], avgDayRate: 1200, availability: "Moderate", notes: "Tall equipment (cranes, large excavators). Maximum legal height clearance." },
      { type: "Beam Trailer (Schnabel)", specification: "Load becomes part of trailer structure", capacity: "200,000-1,000,000 lbs", certifications: ["Engineering certification", "State superload permits"], avgDayRate: 5000, availability: "Very Low", notes: "Transformers, reactor vessels. Load suspended between two carrying units." },
    ],
  },
  pharma: {
    vertical: "Pharmaceutical",
    equipment: [
      { type: "GDP-Qualified Reefer", specification: "Validated temp control, dual redundancy", capacity: "40,000 lbs", certifications: ["GDP qualification", "Annual IQ/OQ/PQ", "Calibrated sensors"], avgDayRate: 1800, availability: "Moderate", notes: "Pharma-dedicated trailers. Temperature mapping required. Backup reefer unit." },
      { type: "Controlled Substance Vehicle", specification: "Reinforced locks, GPS, alarm system", capacity: "Varies", certifications: ["DEA registration", "Security certification", "GPS tracking"], avgDayRate: 2500, availability: "Low", notes: "Vault or cage for Schedule II-V. Real-time monitoring. Two-person team for high-value." },
      { type: "Ultra-Cold Container", specification: "Active cooling to -80C / -112F", capacity: "2,000-5,000 lbs", certifications: ["GDP qualification", "WHO PQS", "Calibration certificate"], avgDayRate: 3500, availability: "Very Low", notes: "mRNA vaccines, cell therapies. Dry ice or active mechanical cooling. 5-day+ hold time." },
      { type: "Parcel/Small Shipment Vehicle", specification: "Multi-zone temp control, bulk-break capable", capacity: "10,000-15,000 lbs", certifications: ["GDP qualification", "Temperature mapping"], avgDayRate: 1200, availability: "Moderate", notes: "Last-mile pharma delivery. Multiple stops with temp-controlled compartments." },
    ],
  },
  chemical: {
    vertical: "Chemical",
    equipment: [
      { type: "Stainless Steel ISO Tank", specification: "UN T-code rated, 20ft frame", capacity: "5,000-6,340 gal", certifications: ["UN/ISO certification", "2.5-year inspection", "5-year hydrostatic"], avgDayRate: 2400, availability: "Moderate", notes: "Intermodal-capable. Ship-rail-truck. Multiple T-codes for different chemicals." },
      { type: "Acid Tanker (MC-312/DOT 412)", specification: "Rubber-lined or Hastelloy", capacity: "4,500-5,500 gal", certifications: ["DOT 412 spec", "Annual inspection", "Liner inspection"], avgDayRate: 2800, availability: "Low", notes: "Sulfuric acid, hydrochloric acid, phosphoric acid. Specialized loading/unloading." },
      { type: "Dry Bulk Chemical Trailer", specification: "Pneumatic discharge, pressure-rated", capacity: "1,500 cu ft / 48,000 lbs", certifications: ["DOT inspection", "Pressure vessel cert"], avgDayRate: 1100, availability: "Moderate", notes: "Plastic pellets, soda ash, calcium carbonate, dry chemicals." },
    ],
  },
  livestock: {
    vertical: "Livestock",
    equipment: [
      { type: "Cattle Pot (Possum-Belly)", specification: "3-deck, perforated aluminum sides", capacity: "50-55 head (market cattle)", certifications: ["Annual DOT inspection", "BQA-recommended standards"], avgDayRate: 1400, availability: "Seasonal", notes: "Most common livestock trailer. Top deck (possum belly) for calves/hogs. Aluminum construction." },
      { type: "Straight Deck Livestock", specification: "Single deck, solid or punch sides", capacity: "30-35 head (market cattle)", certifications: ["Annual DOT inspection"], avgDayRate: 1000, availability: "Moderate", notes: "Used for horses, breeding stock. Gentler ride. Easier loading/unloading." },
      { type: "Poultry Trailer", specification: "Open sides, modular cage system", capacity: "5,000-7,000 birds", certifications: ["Annual DOT inspection", "NPIP compliance"], avgDayRate: 800, availability: "Moderate", notes: "Live poultry to processing plants. Caged or loose-loaded. Wash/disinfect between loads." },
    ],
  },
  intermodal: {
    vertical: "Intermodal",
    equipment: [
      { type: "20ft Container Chassis", specification: "Fixed length, single or tandem axle", capacity: "52,900 lbs payload", certifications: ["FHWA roadability", "IEP inspection"], avgDayRate: 50, availability: "High", notes: "For standard 20ft ISO containers. Pool chassis available at most terminals." },
      { type: "40ft Container Chassis", specification: "Fixed length, tandem axle", capacity: "67,200 lbs payload", certifications: ["FHWA roadability", "IEP inspection"], avgDayRate: 55, availability: "High", notes: "Most common chassis type. For 40ft standard and high-cube containers." },
      { type: "Combo/Slider Chassis", specification: "Extendable 40-45ft, tandem axle", capacity: "65,000 lbs payload", certifications: ["FHWA roadability", "IEP inspection"], avgDayRate: 65, availability: "Moderate", notes: "Accommodates both 40ft and 45ft containers. Sliding rear bolster." },
      { type: "Tri-Axle Chassis", specification: "Three axles for overweight", capacity: "72,000 lbs payload", certifications: ["FHWA roadability", "Overweight permits"], avgDayRate: 85, availability: "Low", notes: "For overweight containers. Required in some states for containers > 44,000 lbs cargo." },
    ],
  },
  automotive: {
    vertical: "Automotive",
    equipment: [
      { type: "Open Car Hauler (7-10 car)", specification: "Multi-level, hydraulic ramps", capacity: "7-10 vehicles / 80,000 lbs", certifications: ["Annual DOT inspection", "Cargo insurance"], avgDayRate: 1000, availability: "High", notes: "Most common for dealer-to-dealer and auction vehicles. Upper and lower decks adjustable." },
      { type: "Enclosed Car Hauler (2-6 car)", specification: "Fully enclosed, climate-optional", capacity: "2-6 vehicles", certifications: ["Annual DOT inspection", "Specialized cargo insurance"], avgDayRate: 1800, availability: "Moderate", notes: "Exotic, classic, and high-value vehicles. Soft-tie securement. Lift gate." },
      { type: "Hotshot (3-4 car)", specification: "Wedge trailer behind pickup/medium-duty", capacity: "3-4 vehicles", certifications: ["DOT inspection", "Cargo insurance"], avgDayRate: 600, availability: "High", notes: "Expedited single-vehicle or small batch transport. Lower overhead." },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export const industryVerticalsRouter = router({
  // ── 1. getAll — List all available industry verticals ──────────────────────
  getAll: protectedProcedure.query(async () => {
    const verticals = getAllVerticals();

    // Try to pull real load counts by cargoType from DB
    let loadCountsByCargoType: Record<string, number> = {};
    try {
      const db = await getDb();
      if (db) {
        const [rows] = await db.execute(
          sql`SELECT cargoType, COUNT(*) as cnt FROM loads WHERE deletedAt IS NULL GROUP BY cargoType`
        );
        for (const row of (rows as unknown as any[])) {
          loadCountsByCargoType[row.cargoType as string] = Number(row.cnt);
        }
      }
    } catch (e) {
      logger.warn("[IndustryVerticals] getAll DB query failed:", e);
    }

    return verticals.map(v => {
      // Sum load counts for all cargo types relevant to this vertical
      const cargoKeys = VERTICAL_CARGO_MAP[v.id] || [];
      const activeLoads = cargoKeys.reduce((sum, key) => sum + (loadCountsByCargoType[key] || 0), 0);
      return {
        id: v.id,
        name: v.name,
        icon: v.icon,
        description: v.description,
        equipmentCount: v.equipmentTypes.length,
        cargoTypes: v.cargoTypes,
        temperatureControlled: v.temperatureControlled,
        hazmatApplicable: v.hazmatApplicable,
        activeLoads,
      };
    });
  }),

  // ── 2. getVerticalConfig — Full configuration for a specific vertical ─────
  getVerticalConfig: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const resolved = resolveVerticalId(input.verticalId);
      const vertical = getVertical(resolved);
      if (!vertical) return null;
      return {
        ...vertical,
        aliasId: input.verticalId !== resolved ? input.verticalId : undefined,
        resolvedFrom: input.verticalId !== resolved ? resolved : undefined,
      };
    }),

  // ── 3. getComplianceRequirements — Regulatory requirements per vertical ───
  getComplianceRequirements: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const resolved = resolveVerticalId(input.verticalId);
      const vertical = getVertical(resolved);
      const baseCompliance = vertical?.complianceRules || [];

      // Gather all environmental/regulatory compliance relevant to this vertical
      const envCompliance: Array<{ category: string; id: string; regulation: string; title: string; description: string; severity: string }> = [];
      for (const [, section] of Object.entries(ENVIRONMENTAL_COMPLIANCE)) {
        for (const req of section.requirements) {
          if (req.applicableVerticals.includes(input.verticalId) || req.applicableVerticals.includes(resolved)) {
            envCompliance.push({ category: section.category, ...req });
          }
        }
      }

      // Query real compliance stats from inspections + companies tables
      let complianceStats: {
        totalInspections: number;
        passedInspections: number;
        failedInspections: number;
        oosViolations: number;
        passRate: number;
        companiesCompliant: number;
        companiesTotal: number;
      } | null = null;

      try {
        const db = await getDb();
        if (db) {
          // Inspection pass/fail rates
          const [inspRows] = await db.execute(
            sql`SELECT COUNT(*) as total,
                       SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed,
                       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                       SUM(CASE WHEN oosViolation = 1 THEN 1 ELSE 0 END) as oos
                FROM inspections`
          );
          const inspRow = (inspRows as unknown as any[])[0];
          const total = Number(inspRow?.total ?? 0);
          const passed = Number(inspRow?.passed ?? 0);
          const failed = Number(inspRow?.failed ?? 0);
          const oos = Number(inspRow?.oos ?? 0);

          // Company compliance status
          const [compRows] = await db.execute(
            sql`SELECT COUNT(*) as total,
                       SUM(CASE WHEN complianceStatus = 'compliant' THEN 1 ELSE 0 END) as compliant
                FROM companies`
          );
          const compRow = (compRows as unknown as any[])[0];
          const compTotal = Number(compRow?.total ?? 0);
          const compCompliant = Number(compRow?.compliant ?? 0);

          if (total > 0 || compTotal > 0) {
            complianceStats = {
              totalInspections: total,
              passedInspections: passed,
              failedInspections: failed,
              oosViolations: oos,
              passRate: total > 0 ? Math.round((passed / total) * 1000) / 10 : 0,
              companiesCompliant: compCompliant,
              companiesTotal: compTotal,
            };
          }
        }
      } catch (e) {
        logger.warn(`[IndustryVerticals] Compliance DB query failed for ${input.verticalId}:`, e);
      }

      return {
        verticalId: input.verticalId,
        verticalName: vertical?.name || input.verticalId,
        baseRules: baseCompliance,
        environmentalCompliance: envCompliance,
        requiredDocuments: vertical?.requiredDocuments || [],
        specialRequirements: vertical?.specialRequirements || [],
        complianceStats,
      };
    }),

  // ── 4. validateCargoCompatibility — Co-loading compatibility check ────────
  validateCargoCompatibility: protectedProcedure
    .input(z.object({
      cargoItems: z.array(z.object({
        hazmatClass: z.string().optional(),
        vertical: z.string(),
        requiresTemp: z.boolean().optional(),
        tempRange: z.object({ min: z.number(), max: z.number() }).optional(),
        isFoodGrade: z.boolean().optional(),
      })),
    }))
    .query(async ({ input }) => {
      const { cargoItems } = input;
      const conflicts: Array<{ item1: number; item2: number; reason: string; severity: string }> = [];
      const warnings: string[] = [];

      for (let i = 0; i < cargoItems.length; i++) {
        for (let j = i + 1; j < cargoItems.length; j++) {
          const a = cargoItems[i];
          const b = cargoItems[j];

          // Hazmat segregation check
          if (a.hazmatClass && b.hazmatClass) {
            const seg = HAZMAT_SEGREGATION[a.hazmatClass]?.[b.hazmatClass] ||
                        HAZMAT_SEGREGATION[b.hazmatClass]?.[a.hazmatClass];
            if (seg === "X") {
              conflicts.push({ item1: i, item2: j, reason: `Hazmat Class ${a.hazmatClass} is incompatible with Class ${b.hazmatClass} per 49 CFR 177.848`, severity: "critical" });
            } else if (seg === "O") {
              conflicts.push({ item1: i, item2: j, reason: `Hazmat Class ${a.hazmatClass} and Class ${b.hazmatClass} may be co-loaded only with specific separation per 49 CFR 177.848`, severity: "warning" });
            }
          }

          // Temperature compatibility
          if (a.requiresTemp && b.requiresTemp && a.tempRange && b.tempRange) {
            if (a.tempRange.max < b.tempRange.min || b.tempRange.max < a.tempRange.min) {
              conflicts.push({ item1: i, item2: j, reason: `Temperature ranges incompatible: ${a.tempRange.min}-${a.tempRange.max} F vs ${b.tempRange.min}-${b.tempRange.max} F`, severity: "critical" });
            }
          }

          // Food safety
          if ((a.isFoodGrade && b.hazmatClass) || (b.isFoodGrade && a.hazmatClass)) {
            conflicts.push({ item1: i, item2: j, reason: "Food-grade cargo cannot be co-loaded with hazardous materials per FSMA 21 CFR 1.908", severity: "critical" });
          }

          // Vertical incompatibility
          if (a.vertical === "livestock" && b.vertical !== "livestock") {
            conflicts.push({ item1: i, item2: j, reason: "Livestock cannot be co-loaded with non-livestock cargo", severity: "critical" });
          }
        }
      }

      if (cargoItems.length > 1) {
        const hasHazmat = cargoItems.some(c => c.hazmatClass);
        const hasFood = cargoItems.some(c => c.isFoodGrade);
        if (hasHazmat) warnings.push("Mixed loads with hazmat require additional shipping paper documentation");
        if (hasFood) warnings.push("Food loads with mixed cargo must comply with FSMA sanitary transport rules");
      }

      return {
        compatible: conflicts.filter(c => c.severity === "critical").length === 0,
        conflicts,
        warnings,
        itemCount: cargoItems.length,
      };
    }),

  // ── 5. getSpecializedEquipment — Equipment requirements per vertical ──────
  getSpecializedEquipment: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const data = SPECIALIZED_EQUIPMENT[input.verticalId];
      if (data) return data;

      // Fallback: build from base vertical
      const resolved = resolveVerticalId(input.verticalId);
      const fallback = SPECIALIZED_EQUIPMENT[resolved];
      if (fallback) return { ...fallback, vertical: `${input.verticalId} (via ${resolved})` };

      // Generic fallback from vertical definition
      const vertical = getVertical(resolved);
      if (!vertical) return { vertical: input.verticalId, equipment: [] };
      return {
        vertical: vertical.name,
        equipment: vertical.equipmentTypes.map(t => ({
          type: t, specification: "Standard configuration", capacity: "Varies",
          certifications: ["Annual DOT inspection"], avgDayRate: 800,
          availability: "Moderate", notes: "",
        })),
      };
    }),

  // ── 6. getHazmatSegregation — Full DOT/PHMSA segregation table ────────────
  getHazmatSegregation: protectedProcedure
    .input(z.object({
      classA: z.string().optional(),
      classB: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      if (input?.classA && input?.classB) {
        const result = HAZMAT_SEGREGATION[input.classA]?.[input.classB] ||
                       HAZMAT_SEGREGATION[input.classB]?.[input.classA] || "";
        return {
          classA: input.classA,
          classB: input.classB,
          result: result === "X" ? "INCOMPATIBLE" : result === "O" ? "CONDITIONAL" : "COMPATIBLE",
          code: result || "",
          regulation: "49 CFR 177.848",
          description: result === "X"
            ? `Class ${input.classA} and Class ${input.classB} must NOT be loaded on the same vehicle`
            : result === "O"
            ? `Class ${input.classA} and Class ${input.classB} may be loaded together with specific separation requirements`
            : `Class ${input.classA} and Class ${input.classB} may be co-loaded`,
        };
      }

      // Return full table
      const classes = ["1.1", "1.2", "1.3", "1.4", "2.1", "2.2", "2.3", "3", "4.1", "4.2", "4.3", "5.1", "5.2", "6.1", "7", "8", "9"];
      const table: Array<{ classA: string; classB: string; result: string }> = [];
      for (const a of classes) {
        for (const b of classes) {
          if (a <= b) {
            const val = HAZMAT_SEGREGATION[a]?.[b] || HAZMAT_SEGREGATION[b]?.[a] || "";
            if (val) table.push({ classA: a, classB: b, result: val });
          }
        }
      }
      return {
        regulation: "49 CFR 177.848 — Segregation of Hazardous Materials",
        legend: { X: "Do NOT load, transport, or store together", O: "May be loaded together with conditions — see 49 CFR 177.848(d)", "": "Compatible — may be loaded together" },
        classes,
        entries: table,
      };
    }),

  // ── 7. getTemperatureProtocols — Cold chain protocols ─────────────────────
  getTemperatureProtocols: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const data = TEMPERATURE_PROTOCOLS[input.verticalId];
      if (data) return data;

      // Check alias
      const resolved = resolveVerticalId(input.verticalId);
      if (TEMPERATURE_PROTOCOLS[resolved]) {
        return { ...TEMPERATURE_PROTOCOLS[resolved], vertical: `${input.verticalId} protocols` };
      }

      // Check if base vertical is temp-controlled
      const vertical = getVertical(resolved);
      if (vertical?.temperatureControlled) {
        return {
          vertical: vertical.name,
          protocols: [{
            product: "General Temperature-Controlled",
            tempRange: { min: 33, max: 40, unit: "F" },
            tolerance: 3,
            monitoringInterval: "30 min",
            alarmThreshold: 5,
            regulation: "Per shipper requirements",
            notes: "Follow shipper-specified temperature requirements",
          }],
        };
      }

      return { vertical: input.verticalId, protocols: [] };
    }),

  // ── 8. getEnvironmentalCompliance — EPA, emissions, spill protocols ───────
  getEnvironmentalCompliance: protectedProcedure
    .input(z.object({ verticalId: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input?.verticalId) {
        return ENVIRONMENTAL_COMPLIANCE;
      }

      const resolved = resolveVerticalId(input.verticalId);
      const filtered: Record<string, any> = {};
      for (const [key, section] of Object.entries(ENVIRONMENTAL_COMPLIANCE)) {
        const applicable = section.requirements.filter(
          r => r.applicableVerticals.includes(input.verticalId!) || r.applicableVerticals.includes(resolved)
        );
        if (applicable.length > 0) {
          filtered[key] = { ...section, requirements: applicable };
        }
      }
      return filtered;
    }),

  // ── 9. getConstructionLoadRequirements — Permits, escorts, routes ─────────
  getConstructionLoadRequirements: protectedProcedure
    .input(z.object({
      width: z.number().optional(),
      height: z.number().optional(),
      length: z.number().optional(),
      weight: z.number().optional(),
      states: z.array(z.string()).optional(),
    }).optional())
    .query(async ({ input }) => {
      const requirements = { ...CONSTRUCTION_REQUIREMENTS };

      if (input?.states && input.states.length > 0) {
        const filteredVariations = requirements.oversizePermits.stateVariations.filter(
          s => input.states!.includes(s.state)
        );
        if (filteredVariations.length > 0) {
          requirements.oversizePermits = {
            ...requirements.oversizePermits,
            stateVariations: filteredVariations,
          };
        }
      }

      // Determine which escort requirements apply
      let applicableEscorts = requirements.escortRequirements;
      if (input?.width || input?.height || input?.length || input?.weight) {
        applicableEscorts = requirements.escortRequirements.filter(e => {
          if (input.width && e.condition.includes("Width") && input.width > parseFloat(e.condition.match(/[\d.]+/)?.[0] || "999")) return true;
          if (input.height && e.condition.includes("Height") && input.height > parseFloat(e.condition.match(/[\d.]+/)?.[0] || "999")) return true;
          if (input.length && e.condition.includes("Length") && input.length > parseFloat(e.condition.match(/[\d.]+/)?.[0] || "999")) return true;
          if (input.weight && e.condition.includes("Weight") && input.weight > parseFloat(e.condition.replace(/,/g, "").match(/[\d.]+/)?.[0] || "999999")) return true;
          return false;
        });
      }

      return {
        ...requirements,
        applicableEscorts,
        needsPermit: !!(input?.width && input.width > 8.5) ||
                     !!(input?.height && input.height > 13.5) ||
                     !!(input?.length && input.length > 53) ||
                     !!(input?.weight && input.weight > 80000),
      };
    }),

  // ── 10. getPharmaceuticalChainOfCustody — CoC tracking, DEA schedules ─────
  getPharmaceuticalChainOfCustody: protectedProcedure.query(async () => {
    return PHARMA_CHAIN_OF_CUSTODY;
  }),

  // ── 11. getLivestockWelfareProtocols — Animal welfare, transit times ───────
  getLivestockWelfareProtocols: protectedProcedure
    .input(z.object({ animalType: z.string().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.animalType) {
        const transit = LIVESTOCK_WELFARE.maxTransitTimes.find(
          t => t.animal.toLowerCase().includes(input.animalType!.toLowerCase())
        );
        return {
          ...LIVESTOCK_WELFARE,
          maxTransitTimes: transit ? [transit] : LIVESTOCK_WELFARE.maxTransitTimes,
        };
      }
      return LIVESTOCK_WELFARE;
    }),

  // ── 12. getIntermodalConfigurations — Container specs, chassis, ports ─────
  getIntermodalConfigurations: protectedProcedure
    .input(z.object({ containerType: z.string().optional(), port: z.string().optional() }).optional())
    .query(async ({ input }) => {
      let configs = { ...INTERMODAL_CONFIGS };
      if (input?.containerType) {
        configs = {
          ...configs,
          containerSpecs: configs.containerSpecs.filter(c =>
            c.type.toLowerCase().includes(input.containerType!.toLowerCase())
          ),
        };
      }
      if (input?.port) {
        configs = {
          ...configs,
          portProtocols: configs.portProtocols.filter(p =>
            p.port.toLowerCase().includes(input.port!.toLowerCase())
          ),
        };
      }
      return configs;
    }),

  // ── 13. calculateVerticalPricing — Vertical-specific rate calculations ────
  calculateVerticalPricing: protectedProcedure
    .input(z.object({
      verticalId: z.string(),
      baseRate: z.number(),
      miles: z.number().optional(),
      factors: z.array(z.string()),
      weight: z.number().optional(),
      hazmatClass: z.string().optional(),
      temperatureRequired: z.boolean().optional(),
      oversized: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const resolved = resolveVerticalId(input.verticalId);
      const basePricing = getVerticalPricing(resolved, input.baseRate, input.factors);

      // Additional surcharges
      const surcharges: Array<{ name: string; amount: number; description: string }> = [];

      if (input.hazmatClass) {
        const hazmatPremium = input.baseRate * 0.25;
        surcharges.push({ name: "Hazmat Surcharge", amount: Math.round(hazmatPremium * 100) / 100, description: `Class ${input.hazmatClass} hazmat handling and compliance` });
      }

      if (input.temperatureRequired) {
        const reeferFuel = (input.miles || 500) * 0.15;
        surcharges.push({ name: "Reefer Fuel Surcharge", amount: Math.round(reeferFuel * 100) / 100, description: "Refrigeration unit fuel cost" });
      }

      if (input.oversized) {
        const permitCost = 250 + ((input.miles || 500) > 500 ? 150 : 0);
        surcharges.push({ name: "Oversize Permit Bundle", amount: permitCost, description: "Multi-state oversize/overweight permits" });
        surcharges.push({ name: "Escort Vehicle", amount: 850, description: "Required escort/pilot car" });
      }

      const totalSurcharges = surcharges.reduce((sum, s) => sum + s.amount, 0);

      return {
        ...basePricing,
        verticalId: input.verticalId,
        surcharges,
        totalSurcharges,
        allInRate: Math.round((basePricing.finalRate + totalSurcharges) * 100) / 100,
        ratePerMile: input.miles ? Math.round(((basePricing.finalRate + totalSurcharges) / input.miles) * 100) / 100 : null,
      };
    }),

  // ── 14. getSeasonalFactors — Seasonal demand patterns per vertical ────────
  getSeasonalFactors: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const data = SEASONAL_FACTORS[input.verticalId];
      if (data) return data;

      const resolved = resolveVerticalId(input.verticalId);
      if (SEASONAL_FACTORS[resolved]) {
        return { ...SEASONAL_FACTORS[resolved], vertical: `${input.verticalId} (via ${resolved})` };
      }

      return {
        vertical: input.verticalId,
        seasons: [
          { period: "Q1", months: "Jan-Mar", demandMultiplier: 1.0, rateImpact: "Baseline", drivers: ["Standard demand"] },
          { period: "Q2", months: "Apr-Jun", demandMultiplier: 1.05, rateImpact: "+5%", drivers: ["Slight seasonal uptick"] },
          { period: "Q3", months: "Jul-Sep", demandMultiplier: 1.10, rateImpact: "+10%", drivers: ["Summer demand increase"] },
          { period: "Q4", months: "Oct-Dec", demandMultiplier: 1.15, rateImpact: "+15%", drivers: ["Year-end volume surge"] },
        ],
      };
    }),

  // ── 15. getVerticalAnalytics — KPIs and metrics per vertical ──────────────
  getVerticalAnalytics: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const resolved = resolveVerticalId(input.verticalId);
      const cargoTypes = VERTICAL_CARGO_MAP[input.verticalId] || VERTICAL_CARGO_MAP[resolved] || ["general"];

      // Try to pull real aggregates from DB
      try {
        const db = await getDb();
        if (db) {
          const placeholders = cargoTypes.map(c => `'${c}'`).join(",");
          const [rows] = await db.execute(sql.raw(
            `SELECT COUNT(*) as totalLoads, COALESCE(SUM(rate), 0) as totalRevenue,
                    COALESCE(AVG(rate), 0) as avgRate,
                    SUM(CASE WHEN status = 'delivered' OR status = 'complete' OR status = 'paid' THEN 1 ELSE 0 END) as completedLoads,
                    SUM(CASE WHEN status IN ('en_route_pickup','at_pickup','loading','loaded','in_transit','at_delivery','unloading') THEN 1 ELSE 0 END) as activeLoads
             FROM loads WHERE cargoType IN (${placeholders}) AND deletedAt IS NULL`
          ));
          const row = (rows as unknown as any[])[0];
          const totalLoads = Number(row?.totalLoads ?? 0);
          const totalRevenue = Number(row?.totalRevenue ?? 0);
          const avgRate = Number(row?.avgRate ?? 0);
          const completedLoads = Number(row?.completedLoads ?? 0);
          const activeLoads = Number(row?.activeLoads ?? 0);

          if (totalLoads > 0) {
            // Get reference KPIs for benchmarks
            const staticData = VERTICAL_ANALYTICS[input.verticalId] || VERTICAL_ANALYTICS[resolved];
            const benchmarkKpis = staticData?.kpis || [];
            return {
              vertical: staticData?.vertical || input.verticalId,
              kpis: [
                { metric: "Total Loads", value: totalLoads, unit: "loads", trend: 0, benchmark: benchmarkKpis[0]?.benchmark || 0, benchmarkLabel: "DB Aggregate" },
                { metric: "Avg Revenue per Load", value: Math.round(avgRate * 100) / 100, unit: "$", trend: 0, benchmark: benchmarkKpis.find(k => k.metric.includes("Revenue"))?.benchmark || 3000, benchmarkLabel: "Industry Avg" },
                { metric: "Active Loads", value: activeLoads, unit: "loads", trend: 0, benchmark: 0, benchmarkLabel: "Current" },
                { metric: "Completed Loads", value: completedLoads, unit: "loads", trend: 0, benchmark: 0, benchmarkLabel: "Historical" },
                { metric: "Total Revenue", value: Math.round(totalRevenue), unit: "$", trend: 0, benchmark: 0, benchmarkLabel: "Cumulative" },
                ...(benchmarkKpis.filter(k => k.metric.includes("Compliance") || k.metric.includes("On-Time") || k.metric.includes("Score"))),
              ],
            };
          }
        }
      } catch (e) {
        logger.warn(`[IndustryVerticals] Analytics DB query failed for ${input.verticalId}:`, e);
      }

      // Fallback to static KPIs
      const data = VERTICAL_ANALYTICS[input.verticalId];
      if (data) return data;

      if (VERTICAL_ANALYTICS[resolved]) {
        return { ...VERTICAL_ANALYTICS[resolved], vertical: `${input.verticalId}` };
      }

      return {
        vertical: input.verticalId,
        kpis: [
          { metric: "Avg Revenue per Load", value: 3500, unit: "$", trend: 5.0, benchmark: 3000, benchmarkLabel: "Industry Avg" },
          { metric: "On-Time Delivery", value: 92, unit: "%", trend: 2.1, benchmark: 90, benchmarkLabel: "Target" },
          { metric: "Load Utilization", value: 85, unit: "%", trend: 1.5, benchmark: 80, benchmarkLabel: "Industry Avg" },
          { metric: "Claims Rate", value: 1.2, unit: "%", trend: -8, benchmark: 2.0, benchmarkLabel: "Industry Avg" },
        ],
      };
    }),

  // ── 16. getCarrierCertifications — Required certs per vertical ────────────
  getCarrierCertifications: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const data = CARRIER_CERTIFICATIONS[input.verticalId];
      if (data) return data;

      const resolved = resolveVerticalId(input.verticalId);
      if (CARRIER_CERTIFICATIONS[resolved]) {
        return { ...CARRIER_CERTIFICATIONS[resolved], vertical: `${input.verticalId}` };
      }

      return {
        vertical: input.verticalId,
        certifications: [
          { id: "mc_authority", name: "FMCSA Motor Carrier Authority", issuedBy: "FMCSA", required: true, renewalPeriod: "Biennial MCS-150", description: "Active operating authority required" },
          { id: "insurance", name: "Minimum Insurance Coverage", issuedBy: "Insurance carrier", required: true, renewalPeriod: "Annual", description: "$750K minimum for general freight, $1M+ for hazmat" },
        ],
      };
    }),

  // ── Keep legacy procedures for backward compatibility ─────────────────────
  getVertical: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const vertical = getVertical(input.verticalId);
      if (!vertical) return null;
      return vertical;
    }),

  getFields: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      return getVerticalFields(input.verticalId);
    }),

  getCompliance: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      return getVerticalCompliance(input.verticalId);
    }),

  getDocuments: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      return getVerticalDocuments(input.verticalId);
    }),

  calculatePricing: protectedProcedure
    .input(z.object({
      verticalId: z.string(),
      baseRate: z.number(),
      factors: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      return getVerticalPricing(input.verticalId, input.baseRate, input.factors);
    }),

  validateLoad: protectedProcedure
    .input(z.object({
      verticalId: z.string(),
      loadData: z.record(z.string(), z.any()),
    }))
    .query(async ({ input }) => {
      return validateLoadForVertical(input.verticalId, input.loadData);
    }),

  getEquipmentTypes: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const vertical = getVertical(input.verticalId);
      if (!vertical) return [];
      return vertical.equipmentTypes;
    }),

  getPricingFactors: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const vertical = getVertical(input.verticalId);
      if (!vertical) return [];
      return vertical.pricingFactors;
    }),

  getSpecialRequirements: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const vertical = getVertical(input.verticalId);
      if (!vertical) return { requirements: [], weightRange: null };
      return {
        requirements: vertical.specialRequirements,
        weightRange: vertical.typicalWeightRange,
        temperatureControlled: vertical.temperatureControlled,
        hazmatApplicable: vertical.hazmatApplicable,
      };
    }),
});
