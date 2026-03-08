/**
 * COMPLIANCE & DOCUMENTATION TEMPLATES SERVICE (Task 4.3)
 * Generates compliance checklists, document templates, and pre-trip
 * inspection forms tailored to each industry vertical.
 */

import {
  getVertical,
  getVerticalCompliance,
  getVerticalDocuments,
  getAllVerticals,
  type IndustryVertical,
  type ComplianceRule,
  type DocumentTemplate,
} from "./IndustryVerticals";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  label: string;
  category: "pre_trip" | "loading" | "in_transit" | "delivery" | "post_delivery";
  regulation?: string;
  severity: "critical" | "high" | "medium" | "low";
  checked: boolean;
  notes: string;
  autoVerifiable: boolean;
}

export interface ComplianceChecklist {
  verticalId: string;
  verticalName: string;
  generatedAt: string;
  items: ChecklistItem[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface DocumentField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "boolean" | "signature";
  required: boolean;
  placeholder?: string;
  options?: string[];
  section: string;
}

export interface GeneratedDocTemplate {
  id: string;
  name: string;
  verticalId: string;
  category: DocumentTemplate["category"];
  description: string;
  fields: DocumentField[];
  regulatoryReference?: string;
  sections: string[];
  printable: boolean;
}

export interface InspectionForm {
  id: string;
  name: string;
  verticalId: string;
  type: "pre_trip" | "loading" | "unloading" | "post_trip";
  items: Array<{
    id: string;
    label: string;
    checkType: "pass_fail" | "measurement" | "photo" | "text";
    required: boolean;
    category: string;
    unit?: string;
  }>;
}

// ── Base Checklist Items (shared across verticals) ──────────────────────────

const BASE_PRE_TRIP: ChecklistItem[] = [
  { id: "pt-cdl", label: "Driver CDL valid and in possession", category: "pre_trip", regulation: "49 CFR 383", severity: "critical", checked: false, notes: "", autoVerifiable: true },
  { id: "pt-medical", label: "Medical certificate valid and in cab", category: "pre_trip", regulation: "49 CFR 391.41", severity: "critical", checked: false, notes: "", autoVerifiable: true },
  { id: "pt-dvir", label: "Pre-trip DVIR completed", category: "pre_trip", regulation: "49 CFR 396.13", severity: "critical", checked: false, notes: "", autoVerifiable: false },
  { id: "pt-eld", label: "ELD functioning and HOS compliant", category: "pre_trip", regulation: "49 CFR 395.8", severity: "critical", checked: false, notes: "", autoVerifiable: true },
  { id: "pt-insurance", label: "Insurance card in cab", category: "pre_trip", regulation: "49 CFR 387", severity: "high", checked: false, notes: "", autoVerifiable: false },
  { id: "pt-registration", label: "Vehicle registration current", category: "pre_trip", regulation: "State Law", severity: "high", checked: false, notes: "", autoVerifiable: true },
  { id: "pt-fire-ext", label: "Fire extinguisher charged and accessible", category: "pre_trip", regulation: "49 CFR 393.95", severity: "high", checked: false, notes: "", autoVerifiable: false },
  { id: "pt-triangles", label: "3 reflective triangles in cab", category: "pre_trip", regulation: "49 CFR 393.95", severity: "high", checked: false, notes: "", autoVerifiable: false },
];

const BASE_LOADING: ChecklistItem[] = [
  { id: "ld-bol", label: "Bill of Lading completed and signed", category: "loading", regulation: "49 CFR 373", severity: "critical", checked: false, notes: "", autoVerifiable: false },
  { id: "ld-weight", label: "Load weight within legal limits", category: "loading", regulation: "49 CFR 392.9", severity: "critical", checked: false, notes: "", autoVerifiable: true },
  { id: "ld-secure", label: "Cargo properly secured", category: "loading", regulation: "49 CFR 393.100", severity: "critical", checked: false, notes: "", autoVerifiable: false },
  { id: "ld-seal", label: "Trailer sealed (if applicable)", category: "loading", severity: "medium", checked: false, notes: "", autoVerifiable: false },
];

const BASE_DELIVERY: ChecklistItem[] = [
  { id: "dl-pod", label: "Proof of Delivery signed", category: "delivery", severity: "critical", checked: false, notes: "", autoVerifiable: false },
  { id: "dl-inspect", label: "Receiver inspected cargo — no exceptions", category: "delivery", severity: "high", checked: false, notes: "", autoVerifiable: false },
  { id: "dl-photos", label: "Delivery photos captured", category: "delivery", severity: "medium", checked: false, notes: "", autoVerifiable: false },
];

// ── Vertical-Specific Checklist Items ───────────────────────────────────────

const VERTICAL_ITEMS: Record<string, ChecklistItem[]> = {
  refrigerated: [
    { id: "rf-precool", label: "Trailer pre-cooled to target temperature", category: "pre_trip", regulation: "21 CFR 1.908", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "rf-reefer-check", label: "Reefer unit operational — fuel level OK", category: "pre_trip", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "rf-temp-set", label: "Temperature set point confirmed with shipper", category: "loading", regulation: "21 CFR 1.908", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "rf-pulp-temp", label: "Pulp temperature verified at loading", category: "loading", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "rf-door-seal", label: "Door seal intact — no air leaks", category: "loading", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "rf-temp-log", label: "Temperature log running continuously", category: "in_transit", regulation: "21 CFR 1.912", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "rf-temp-check", label: "Temperature checked every 2 hours", category: "in_transit", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "rf-printout", label: "Temperature printout provided at delivery", category: "delivery", severity: "critical", checked: false, notes: "", autoVerifiable: false },
  ],

  hazmat: [
    { id: "hz-h-endorse", label: "CDL H endorsement verified", category: "pre_trip", regulation: "49 CFR 383.93", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "hz-erg", label: "ERG 2020 guidebook in cab", category: "pre_trip", regulation: "49 CFR 172.602", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "hz-placards", label: "Correct placards displayed per DOT", category: "pre_trip", regulation: "49 CFR 172.504", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "hz-shipping-papers", label: "Shipping papers in reach — proper format", category: "loading", regulation: "49 CFR 172.200", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "hz-sds", label: "SDS available for all materials", category: "loading", regulation: "29 CFR 1910.1200", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "hz-segregation", label: "Incompatible materials segregated", category: "loading", regulation: "49 CFR 177.848", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "hz-ppe", label: "PPE available per SDS requirements", category: "loading", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "hz-route", label: "Hazmat-designated route confirmed", category: "in_transit", regulation: "49 CFR 397", severity: "high", checked: false, notes: "", autoVerifiable: true },
    { id: "hz-parking", label: "Safe haven parking used for stops", category: "in_transit", regulation: "49 CFR 397.7", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "hz-spill-kit", label: "Spill kit accessible and stocked", category: "pre_trip", severity: "high", checked: false, notes: "", autoVerifiable: false },
  ],

  tanker: [
    { id: "tk-n-endorse", label: "CDL N (tanker) endorsement verified", category: "pre_trip", regulation: "49 CFR 383.93", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "tk-tank-cert", label: "Tank inspection certificate current", category: "pre_trip", regulation: "49 CFR 180.407", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "tk-valves", label: "All valves closed and sealed before transit", category: "loading", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "tk-vapor", label: "Vapor recovery connected (if required)", category: "loading", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "tk-grounding", label: "Static grounding wire connected during loading", category: "loading", regulation: "NFPA 385", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "tk-overfill", label: "Overfill protection system tested", category: "loading", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "tk-clean", label: "Tank clean per product requirements", category: "pre_trip", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "tk-run-ticket", label: "Run ticket matches BOL quantity", category: "delivery", severity: "critical", checked: false, notes: "", autoVerifiable: false },
  ],

  flatbed: [
    { id: "fb-chains", label: "Chains/binders in good condition", category: "pre_trip", regulation: "49 CFR 393.104", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "fb-straps", label: "Adequate straps/tiedowns for load", category: "pre_trip", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "fb-tiedown-count", label: "Minimum tiedowns per 49 CFR (1 per 10ft + 1)", category: "loading", regulation: "49 CFR 393.106", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "fb-edge-protect", label: "Edge protectors on chains/straps", category: "loading", regulation: "49 CFR 393.104", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "fb-tarp", label: "Tarp installed (if required)", category: "loading", severity: "medium", checked: false, notes: "", autoVerifiable: false },
    { id: "fb-flags", label: "Red flags on projecting loads", category: "loading", regulation: "49 CFR 393.87", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "fb-permit", label: "OS/OW permits obtained for all states", category: "pre_trip", regulation: "State DOT", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "fb-50mi-check", label: "Securement checked within first 50 miles", category: "in_transit", regulation: "49 CFR 392.9", severity: "high", checked: false, notes: "", autoVerifiable: false },
  ],

  auto_transport: [
    { id: "at-vcr-pickup", label: "Vehicle Condition Report completed at pickup", category: "loading", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "at-photos-pickup", label: "All vehicle photos taken at pickup", category: "loading", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "at-4-tiedowns", label: "4 independent tiedowns per vehicle", category: "loading", regulation: "49 CFR 393.128", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "at-vin-verify", label: "VINs verified against BOL", category: "loading", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "at-drip-pans", label: "Drip pans under vehicles (if leaking)", category: "loading", severity: "medium", checked: false, notes: "", autoVerifiable: false },
    { id: "at-vcr-delivery", label: "VCR completed at delivery with receiver", category: "delivery", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "at-photos-delivery", label: "All vehicle photos taken at delivery", category: "delivery", severity: "critical", checked: false, notes: "", autoVerifiable: false },
  ],

  intermodal: [
    { id: "im-twic", label: "TWIC card valid and in possession", category: "pre_trip", regulation: "46 CFR 101.514", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "im-chassis-inspect", label: "Chassis pre-trip inspection completed", category: "pre_trip", regulation: "FHWA Roadability", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "im-pins", label: "Container twist-locks/pins secured", category: "loading", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "im-seal-verify", label: "Seal number matches documentation", category: "loading", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "im-customs", label: "Customs clearance confirmed before movement", category: "loading", regulation: "CBP 19 CFR", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "im-lfd", label: "Last Free Day tracked — demurrage risk assessed", category: "loading", severity: "high", checked: false, notes: "", autoVerifiable: true },
    { id: "im-overweight", label: "Container weight verified under legal limit", category: "loading", regulation: "SOLAS VGM", severity: "critical", checked: false, notes: "", autoVerifiable: true },
  ],

  ltl: [
    { id: "ltl-class-verify", label: "NMFC freight class verified", category: "loading", regulation: "NMFTA", severity: "high", checked: false, notes: "", autoVerifiable: true },
    { id: "ltl-dims", label: "Dimensions measured and recorded", category: "loading", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "ltl-labels", label: "Handling unit labels applied (shipper/consignee)", category: "loading", severity: "medium", checked: false, notes: "", autoVerifiable: false },
    { id: "ltl-stack", label: "Non-stackable items flagged", category: "loading", severity: "medium", checked: false, notes: "", autoVerifiable: false },
    { id: "ltl-exceptions", label: "Exception notes on POD if damage found", category: "delivery", severity: "high", checked: false, notes: "", autoVerifiable: false },
  ],

  heavy_haul: [
    { id: "hh-route-survey", label: "Route survey completed and verified", category: "pre_trip", regulation: "State DOT", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "hh-permits-all", label: "OS/OW permits for ALL transit states obtained", category: "pre_trip", regulation: "State DOT", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "hh-escort-ready", label: "Escort/pilot vehicles confirmed and briefed", category: "pre_trip", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "hh-bridge-study", label: "Bridge analysis approved for route", category: "pre_trip", regulation: "Federal Bridge Formula", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "hh-utility-clear", label: "Utility line clearances coordinated", category: "pre_trip", regulation: "State/Local", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "hh-police-notify", label: "State police notified (where required)", category: "pre_trip", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "hh-daylight", label: "Travel during daylight hours only (if required)", category: "in_transit", regulation: "State DOT", severity: "high", checked: false, notes: "", autoVerifiable: true },
    { id: "hh-axle-weight", label: "Axle weights distributed per bridge formula", category: "loading", severity: "critical", checked: false, notes: "", autoVerifiable: true },
  ],

  livestock: [
    { id: "ls-health-cert", label: "Certificate of Veterinary Inspection obtained", category: "pre_trip", regulation: "9 CFR", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "ls-brand-insp", label: "Brand inspection completed (western states)", category: "pre_trip", regulation: "State Ag", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "ls-bedding", label: "Adequate bedding in trailer", category: "pre_trip", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "ls-ventilation", label: "Ventilation adequate for weather conditions", category: "pre_trip", regulation: "USDA APHIS", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "ls-water", label: "Water available for animals", category: "loading", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "ls-28hr-plan", label: "28-Hour Law rest stop planned (if applicable)", category: "pre_trip", regulation: "49 USC 80502", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "ls-headcount", label: "Head count verified at loading and unloading", category: "loading", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "ls-dead-check", label: "Check for dead/downer animals before unloading", category: "delivery", severity: "critical", checked: false, notes: "", autoVerifiable: false },
  ],

  bulk_dry: [
    { id: "bd-clean", label: "Trailer clean — no cross-contamination risk", category: "pre_trip", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "bd-seals", label: "Hopper gates/seals in good condition", category: "pre_trip", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "bd-tarp", label: "Tarp installed to prevent spillage", category: "loading", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "bd-scale", label: "Scale weight obtained after loading", category: "loading", regulation: "Federal/State", severity: "critical", checked: false, notes: "", autoVerifiable: true },
    { id: "bd-grade", label: "Grade certificate obtained (grain)", category: "loading", severity: "medium", checked: false, notes: "", autoVerifiable: false },
    { id: "bd-unload-method", label: "Unloading method confirmed with receiver", category: "delivery", severity: "medium", checked: false, notes: "", autoVerifiable: false },
  ],

  moving_household: [
    { id: "hg-estimate", label: "Written estimate provided to customer", category: "pre_trip", regulation: "49 CFR 375", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "hg-rights", label: "Rights & Responsibilities booklet provided", category: "pre_trip", regulation: "49 CFR 375.401", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "hg-inventory", label: "Detailed inventory completed at pickup", category: "loading", regulation: "49 CFR 375.403", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "hg-valuation", label: "Valuation declaration signed by customer", category: "loading", regulation: "49 CFR 375", severity: "critical", checked: false, notes: "", autoVerifiable: false },
    { id: "hg-pad-wrap", label: "Furniture padded/wrapped for protection", category: "loading", severity: "high", checked: false, notes: "", autoVerifiable: false },
    { id: "hg-scale", label: "Shipment weighed on certified scale", category: "loading", regulation: "49 CFR 375.521", severity: "high", checked: false, notes: "", autoVerifiable: true },
    { id: "hg-claim-form", label: "Claim form provided if damage noted", category: "delivery", regulation: "49 CFR 370", severity: "high", checked: false, notes: "", autoVerifiable: false },
  ],

  general_freight: [],
};

// ── Document Template Definitions ───────────────────────────────────────────

const DOCUMENT_TEMPLATES: Record<string, GeneratedDocTemplate[]> = {
  general_freight: [
    {
      id: "gf-bol", name: "Standard Bill of Lading", verticalId: "general_freight", category: "shipping",
      description: "Standard straight BOL per 49 CFR 373",
      regulatoryReference: "49 CFR 373",
      sections: ["Shipper Info", "Consignee Info", "Carrier Info", "Commodity Details", "Weight & Count", "Signatures"],
      printable: true,
      fields: [
        { key: "shipperName", label: "Shipper Name", type: "text", required: true, section: "Shipper Info" },
        { key: "shipperAddress", label: "Shipper Address", type: "text", required: true, section: "Shipper Info" },
        { key: "consigneeName", label: "Consignee Name", type: "text", required: true, section: "Consignee Info" },
        { key: "consigneeAddress", label: "Consignee Address", type: "text", required: true, section: "Consignee Info" },
        { key: "carrierName", label: "Carrier Name", type: "text", required: true, section: "Carrier Info" },
        { key: "commodity", label: "Commodity Description", type: "text", required: true, section: "Commodity Details" },
        { key: "weight", label: "Weight (lbs)", type: "number", required: true, section: "Weight & Count" },
        { key: "pieces", label: "Pieces/Units", type: "number", required: true, section: "Weight & Count" },
        { key: "shipperSignature", label: "Shipper Signature", type: "signature", required: true, section: "Signatures" },
        { key: "carrierSignature", label: "Carrier Signature", type: "signature", required: true, section: "Signatures" },
        { key: "date", label: "Date", type: "date", required: true, section: "Signatures" },
      ],
    },
  ],

  hazmat: [
    {
      id: "hz-bol", name: "Hazmat Bill of Lading", verticalId: "hazmat", category: "shipping",
      description: "DOT-compliant hazmat shipping paper per 49 CFR 172.200-204",
      regulatoryReference: "49 CFR 172.200-204",
      sections: ["Shipper Info", "Consignee Info", "Hazmat Details", "Emergency Info", "Carrier Certification", "Shipper Certification"],
      printable: true,
      fields: [
        { key: "shipperName", label: "Shipper Name", type: "text", required: true, section: "Shipper Info" },
        { key: "shipperAddress", label: "Shipper Address", type: "text", required: true, section: "Shipper Info" },
        { key: "consigneeName", label: "Consignee Name", type: "text", required: true, section: "Consignee Info" },
        { key: "consigneeAddress", label: "Consignee Address", type: "text", required: true, section: "Consignee Info" },
        { key: "properShippingName", label: "Proper Shipping Name", type: "text", required: true, section: "Hazmat Details" },
        { key: "hazardClass", label: "Hazard Class/Division", type: "text", required: true, section: "Hazmat Details" },
        { key: "unNumber", label: "UN/NA Number", type: "text", required: true, section: "Hazmat Details", placeholder: "UN1203" },
        { key: "packingGroup", label: "Packing Group", type: "select", required: false, options: ["I", "II", "III"], section: "Hazmat Details" },
        { key: "quantity", label: "Total Quantity", type: "text", required: true, section: "Hazmat Details" },
        { key: "subsidiaryHazards", label: "Subsidiary Hazard(s)", type: "text", required: false, section: "Hazmat Details" },
        { key: "technicalName", label: "Technical Name (if required)", type: "text", required: false, section: "Hazmat Details" },
        { key: "ergGuide", label: "ERG Guide Number", type: "number", required: false, section: "Hazmat Details" },
        { key: "emergencyPhone", label: "24-Hour Emergency Phone", type: "text", required: true, section: "Emergency Info", placeholder: "CHEMTREC: 1-800-424-9300" },
        { key: "emergencyContact", label: "Emergency Contact Name", type: "text", required: true, section: "Emergency Info" },
        { key: "shipperCert", label: "Shipper Certification", type: "signature", required: true, section: "Shipper Certification" },
        { key: "carrierCert", label: "Carrier Acknowledgment", type: "signature", required: true, section: "Carrier Certification" },
        { key: "date", label: "Date", type: "date", required: true, section: "Carrier Certification" },
      ],
    },
    {
      id: "hz-security-plan", name: "Hazmat Security Plan Summary", verticalId: "hazmat", category: "compliance",
      description: "Security plan summary per 49 CFR 172.800",
      regulatoryReference: "49 CFR 172.800-802",
      sections: ["Personnel Security", "Unauthorized Access", "En Route Security"],
      printable: true,
      fields: [
        { key: "companyName", label: "Company Name", type: "text", required: true, section: "Personnel Security" },
        { key: "securityOfficer", label: "Security Coordinator", type: "text", required: true, section: "Personnel Security" },
        { key: "backgroundChecks", label: "Background Checks Completed", type: "boolean", required: true, section: "Personnel Security" },
        { key: "accessControls", label: "Access Control Measures", type: "text", required: true, section: "Unauthorized Access" },
        { key: "enRouteProcedures", label: "En Route Security Procedures", type: "text", required: true, section: "En Route Security" },
        { key: "date", label: "Effective Date", type: "date", required: true, section: "Personnel Security" },
      ],
    },
  ],

  tanker: [
    {
      id: "tk-bol", name: "Tanker Bill of Lading / Run Ticket", verticalId: "tanker", category: "shipping",
      description: "Liquid bulk BOL with gauge/measurement data",
      sections: ["Shipper Info", "Consignee Info", "Product Details", "Measurement", "Signatures"],
      printable: true,
      fields: [
        { key: "shipperName", label: "Shipper/Terminal", type: "text", required: true, section: "Shipper Info" },
        { key: "consigneeName", label: "Consignee/Receiver", type: "text", required: true, section: "Consignee Info" },
        { key: "productName", label: "Product Name", type: "text", required: true, section: "Product Details" },
        { key: "tankSpec", label: "Tank Specification", type: "select", required: true, options: ["MC-306/DOT-406", "MC-307/DOT-407", "MC-312/DOT-412", "MC-331", "MC-338", "Food-Grade SS"], section: "Product Details" },
        { key: "grossGallons", label: "Gross Gallons", type: "number", required: true, section: "Measurement" },
        { key: "netGallons", label: "Net Gallons", type: "number", required: true, section: "Measurement" },
        { key: "temperature", label: "Temperature (°F)", type: "number", required: false, section: "Measurement" },
        { key: "specificGravity", label: "Specific Gravity / API", type: "number", required: false, section: "Measurement" },
        { key: "bsw", label: "BS&W %", type: "number", required: false, section: "Measurement" },
        { key: "loadingSign", label: "Loading Operator Signature", type: "signature", required: true, section: "Signatures" },
        { key: "driverSign", label: "Driver Signature", type: "signature", required: true, section: "Signatures" },
        { key: "date", label: "Date", type: "date", required: true, section: "Signatures" },
      ],
    },
    {
      id: "tk-wash", name: "Tank Wash Certificate", verticalId: "tanker", category: "compliance",
      description: "Proof of tank cleaning for food-grade or cross-product loads",
      sections: ["Wash Facility", "Tank Details", "Wash Details", "Certification"],
      printable: true,
      fields: [
        { key: "facilityName", label: "Wash Facility Name", type: "text", required: true, section: "Wash Facility" },
        { key: "facilityAddress", label: "Facility Address", type: "text", required: true, section: "Wash Facility" },
        { key: "tankNumber", label: "Tank/Trailer Number", type: "text", required: true, section: "Tank Details" },
        { key: "lastProduct", label: "Last Product Hauled", type: "text", required: true, section: "Tank Details" },
        { key: "nextProduct", label: "Next Product to Haul", type: "text", required: true, section: "Tank Details" },
        { key: "washType", label: "Wash Type", type: "select", required: true, options: ["Rinse", "Caustic Wash", "Acid Wash", "Steam Clean", "Kosher Wash"], section: "Wash Details" },
        { key: "kosher", label: "Kosher Certified", type: "boolean", required: false, section: "Wash Details" },
        { key: "certSignature", label: "Facility Certification", type: "signature", required: true, section: "Certification" },
        { key: "date", label: "Date", type: "date", required: true, section: "Certification" },
      ],
    },
  ],

  refrigerated: [
    {
      id: "rf-bol", name: "Refrigerated BOL", verticalId: "refrigerated", category: "shipping",
      description: "BOL with temperature requirements and FSMA compliance",
      regulatoryReference: "21 CFR 1.908",
      sections: ["Shipper Info", "Consignee Info", "Product Details", "Temperature Requirements", "FSMA Compliance", "Signatures"],
      printable: true,
      fields: [
        { key: "shipperName", label: "Shipper Name", type: "text", required: true, section: "Shipper Info" },
        { key: "consigneeName", label: "Consignee Name", type: "text", required: true, section: "Consignee Info" },
        { key: "commodity", label: "Commodity", type: "text", required: true, section: "Product Details" },
        { key: "tempMin", label: "Min Temperature (°F)", type: "number", required: true, section: "Temperature Requirements" },
        { key: "tempMax", label: "Max Temperature (°F)", type: "number", required: true, section: "Temperature Requirements" },
        { key: "preCoolTemp", label: "Pre-Cool Temperature (°F)", type: "number", required: false, section: "Temperature Requirements" },
        { key: "fsmaCritical", label: "FSMA Critical Shipment", type: "boolean", required: false, section: "FSMA Compliance" },
        { key: "previousCargo", label: "Previous Cargo in Trailer", type: "text", required: false, section: "FSMA Compliance" },
        { key: "shipperSign", label: "Shipper Signature", type: "signature", required: true, section: "Signatures" },
        { key: "driverSign", label: "Driver Signature", type: "signature", required: true, section: "Signatures" },
        { key: "date", label: "Date", type: "date", required: true, section: "Signatures" },
      ],
    },
  ],

  flatbed: [
    {
      id: "fb-securement", name: "Cargo Securement Inspection Form", verticalId: "flatbed", category: "safety",
      description: "Documented cargo securement verification per 49 CFR 393.100-136",
      regulatoryReference: "49 CFR 393.100-136",
      sections: ["Load Details", "Securement Method", "Verification", "Inspection"],
      printable: true,
      fields: [
        { key: "commodity", label: "Commodity Type", type: "text", required: true, section: "Load Details" },
        { key: "dimensions", label: "Load Dimensions (LxWxH)", type: "text", required: true, section: "Load Details" },
        { key: "weight", label: "Total Weight (lbs)", type: "number", required: true, section: "Load Details" },
        { key: "securementType", label: "Primary Securement", type: "select", required: true, options: ["Chains + Binders", "Straps", "Chains + Straps", "Cradles/Chocks", "Blocking/Bracing"], section: "Securement Method" },
        { key: "tiedownCount", label: "Number of Tiedowns", type: "number", required: true, section: "Securement Method" },
        { key: "edgeProtectors", label: "Edge Protectors Used", type: "boolean", required: false, section: "Securement Method" },
        { key: "50miCheck", label: "50-Mile Securement Re-Check", type: "boolean", required: false, section: "Verification" },
        { key: "driverSign", label: "Driver Signature", type: "signature", required: true, section: "Inspection" },
        { key: "date", label: "Date", type: "date", required: true, section: "Inspection" },
      ],
    },
  ],

  auto_transport: [
    {
      id: "at-vcr", name: "Vehicle Condition Report", verticalId: "auto_transport", category: "shipping",
      description: "Photo-documented vehicle condition at pickup and delivery",
      sections: ["Vehicle Info", "Pickup Condition", "Delivery Condition", "Signatures"],
      printable: true,
      fields: [
        { key: "vin", label: "VIN", type: "text", required: true, section: "Vehicle Info" },
        { key: "year", label: "Year", type: "number", required: true, section: "Vehicle Info" },
        { key: "make", label: "Make", type: "text", required: true, section: "Vehicle Info" },
        { key: "model", label: "Model", type: "text", required: true, section: "Vehicle Info" },
        { key: "color", label: "Color", type: "text", required: true, section: "Vehicle Info" },
        { key: "mileage", label: "Odometer", type: "number", required: false, section: "Vehicle Info" },
        { key: "operable", label: "Operable", type: "boolean", required: true, section: "Vehicle Info" },
        { key: "pickupCondition", label: "Pickup Condition Notes", type: "text", required: true, section: "Pickup Condition", placeholder: "Document all existing damage" },
        { key: "deliveryCondition", label: "Delivery Condition Notes", type: "text", required: false, section: "Delivery Condition" },
        { key: "shipperSign", label: "Shipper/Dealer Signature", type: "signature", required: true, section: "Signatures" },
        { key: "driverSign", label: "Driver Signature", type: "signature", required: true, section: "Signatures" },
        { key: "receiverSign", label: "Receiver Signature", type: "signature", required: false, section: "Signatures" },
        { key: "date", label: "Date", type: "date", required: true, section: "Signatures" },
      ],
    },
  ],

  intermodal: [
    {
      id: "im-gate-ticket", name: "Port Gate Ticket", verticalId: "intermodal", category: "shipping",
      description: "Container pickup/drop-off documentation at marine terminal",
      sections: ["Terminal Info", "Container Details", "Equipment", "Authorization"],
      printable: true,
      fields: [
        { key: "terminal", label: "Terminal Name", type: "text", required: true, section: "Terminal Info" },
        { key: "containerNumber", label: "Container Number", type: "text", required: true, section: "Container Details" },
        { key: "sealNumber", label: "Seal Number", type: "text", required: true, section: "Container Details" },
        { key: "containerSize", label: "Container Size", type: "select", required: true, options: ["20ft", "40ft", "40ft HC", "45ft HC"], section: "Container Details" },
        { key: "bookingNumber", label: "Booking/BL Number", type: "text", required: true, section: "Container Details" },
        { key: "chassisNumber", label: "Chassis Number", type: "text", required: true, section: "Equipment" },
        { key: "weight", label: "VGM Weight (lbs)", type: "number", required: true, section: "Container Details" },
        { key: "driverSign", label: "Driver Signature", type: "signature", required: true, section: "Authorization" },
        { key: "date", label: "Date/Time", type: "date", required: true, section: "Authorization" },
      ],
    },
  ],

  livestock: [
    {
      id: "ls-health", name: "Certificate of Veterinary Inspection", verticalId: "livestock", category: "compliance",
      description: "Interstate health certificate for live animal transport",
      regulatoryReference: "9 CFR",
      sections: ["Origin Farm", "Destination", "Animal Details", "Health Status", "Veterinarian"],
      printable: true,
      fields: [
        { key: "originFarm", label: "Origin Farm/Ranch", type: "text", required: true, section: "Origin Farm" },
        { key: "originState", label: "Origin State", type: "text", required: true, section: "Origin Farm" },
        { key: "destFacility", label: "Destination Facility", type: "text", required: true, section: "Destination" },
        { key: "destState", label: "Destination State", type: "text", required: true, section: "Destination" },
        { key: "species", label: "Species", type: "select", required: true, options: ["Cattle", "Swine", "Horses", "Sheep", "Goats", "Poultry"], section: "Animal Details" },
        { key: "headCount", label: "Head Count", type: "number", required: true, section: "Animal Details" },
        { key: "healthStatus", label: "Health Status", type: "select", required: true, options: ["Healthy", "Under Observation", "Quarantined"], section: "Health Status" },
        { key: "vetName", label: "Veterinarian Name", type: "text", required: true, section: "Veterinarian" },
        { key: "vetLicense", label: "Vet License Number", type: "text", required: true, section: "Veterinarian" },
        { key: "vetSign", label: "Veterinarian Signature", type: "signature", required: true, section: "Veterinarian" },
        { key: "date", label: "Date", type: "date", required: true, section: "Veterinarian" },
      ],
    },
  ],

  heavy_haul: [
    {
      id: "hh-permit-app", name: "Oversize/Overweight Permit Application", verticalId: "heavy_haul", category: "compliance",
      description: "State DOT OS/OW permit application data",
      sections: ["Carrier Info", "Load Details", "Route Info", "Dimensions", "Special Requirements"],
      printable: true,
      fields: [
        { key: "carrierName", label: "Carrier Name", type: "text", required: true, section: "Carrier Info" },
        { key: "dotNumber", label: "DOT Number", type: "text", required: true, section: "Carrier Info" },
        { key: "commodity", label: "Commodity Description", type: "text", required: true, section: "Load Details" },
        { key: "grossWeight", label: "Gross Weight (lbs)", type: "number", required: true, section: "Load Details" },
        { key: "length", label: "Overall Length (ft)", type: "number", required: true, section: "Dimensions" },
        { key: "width", label: "Overall Width (ft)", type: "number", required: true, section: "Dimensions" },
        { key: "height", label: "Overall Height (ft)", type: "number", required: true, section: "Dimensions" },
        { key: "axles", label: "Number of Axles", type: "number", required: true, section: "Dimensions" },
        { key: "origin", label: "Origin City/State", type: "text", required: true, section: "Route Info" },
        { key: "destination", label: "Destination City/State", type: "text", required: true, section: "Route Info" },
        { key: "transitStates", label: "Transit States", type: "text", required: true, section: "Route Info" },
        { key: "escorts", label: "Escort Vehicles Required", type: "number", required: false, section: "Special Requirements" },
        { key: "bridgeStudy", label: "Bridge Study Required", type: "boolean", required: false, section: "Special Requirements" },
      ],
    },
  ],

  ltl: [],
  bulk_dry: [],
  moving_household: [
    {
      id: "hg-estimate-form", name: "Written Estimate Form", verticalId: "moving_household", category: "shipping",
      description: "Binding or non-binding estimate per 49 CFR 375",
      regulatoryReference: "49 CFR 375",
      sections: ["Customer Info", "Move Details", "Estimate", "Terms"],
      printable: true,
      fields: [
        { key: "customerName", label: "Customer Name", type: "text", required: true, section: "Customer Info" },
        { key: "originAddress", label: "Origin Address", type: "text", required: true, section: "Move Details" },
        { key: "destAddress", label: "Destination Address", type: "text", required: true, section: "Move Details" },
        { key: "estimateType", label: "Estimate Type", type: "select", required: true, options: ["Binding", "Non-Binding"], section: "Estimate" },
        { key: "estimatedWeight", label: "Estimated Weight (lbs)", type: "number", required: true, section: "Estimate" },
        { key: "estimatedCost", label: "Estimated Cost ($)", type: "number", required: true, section: "Estimate" },
        { key: "moveDate", label: "Scheduled Move Date", type: "date", required: true, section: "Move Details" },
        { key: "customerSign", label: "Customer Signature", type: "signature", required: true, section: "Terms" },
        { key: "companySign", label: "Company Representative", type: "signature", required: true, section: "Terms" },
        { key: "date", label: "Date", type: "date", required: true, section: "Terms" },
      ],
    },
  ],
};

// ── Service Functions ────────────────────────────────────────────────────────

export function generateChecklist(verticalId: string): ComplianceChecklist | null {
  const vertical = getVertical(verticalId);
  if (!vertical) return null;

  const verticalSpecific = VERTICAL_ITEMS[verticalId] || [];
  const items: ChecklistItem[] = [
    ...BASE_PRE_TRIP,
    ...verticalSpecific.filter(i => i.category === "pre_trip"),
    ...BASE_LOADING,
    ...verticalSpecific.filter(i => i.category === "loading"),
    ...verticalSpecific.filter(i => i.category === "in_transit"),
    ...BASE_DELIVERY,
    ...verticalSpecific.filter(i => i.category === "delivery"),
    ...verticalSpecific.filter(i => i.category === "post_delivery"),
  ];

  return {
    verticalId,
    verticalName: vertical.name,
    generatedAt: new Date().toISOString(),
    items,
    summary: {
      total: items.length,
      critical: items.filter(i => i.severity === "critical").length,
      high: items.filter(i => i.severity === "high").length,
      medium: items.filter(i => i.severity === "medium").length,
      low: items.filter(i => i.severity === "low").length,
    },
  };
}

export function getDocumentTemplates(verticalId: string): GeneratedDocTemplate[] {
  // Return vertical-specific templates, falling back to general freight BOL
  const templates = DOCUMENT_TEMPLATES[verticalId];
  if (templates && templates.length > 0) return templates;
  return DOCUMENT_TEMPLATES.general_freight || [];
}

export function getDocumentTemplate(verticalId: string, templateId: string): GeneratedDocTemplate | null {
  const templates = getDocumentTemplates(verticalId);
  return templates.find(t => t.id === templateId) || null;
}

export function getAllAvailableTemplates(): Array<{ verticalId: string; verticalName: string; templates: GeneratedDocTemplate[] }> {
  const verticals = getAllVerticals();
  return verticals.map(v => ({
    verticalId: v.id,
    verticalName: v.name,
    templates: getDocumentTemplates(v.id),
  })).filter(v => v.templates.length > 0);
}

export function generateComplianceSummary(verticalId: string, loadData: Record<string, any>): {
  verticalId: string;
  verticalName: string;
  score: number;
  maxScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  criticalIssues: string[];
  warnings: string[];
  documentsReady: { name: string; ready: boolean }[];
} {
  const vertical = getVertical(verticalId);
  if (!vertical) return {
    verticalId, verticalName: "Unknown", score: 0, maxScore: 100,
    grade: "F", criticalIssues: ["Unknown vertical"], warnings: [], documentsReady: [],
  };

  let score = 100;
  const criticalIssues: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of vertical.customFields) {
    if (field.required) {
      const val = loadData[field.key];
      if (val === undefined || val === null || val === "") {
        score -= 15;
        criticalIssues.push(`Missing required field: ${field.label}`);
      }
    }
  }

  // Check compliance rules
  for (const rule of vertical.complianceRules) {
    if (rule.autoCheck && rule.checkField) {
      const val = loadData[rule.checkField];
      if (!val && val !== 0) {
        if (rule.severity === "critical") {
          score -= 20;
          criticalIssues.push(`${rule.regulation}: ${rule.description}`);
        } else if (rule.severity === "high") {
          score -= 10;
          warnings.push(`${rule.regulation}: ${rule.description}`);
        } else {
          score -= 5;
          warnings.push(rule.description);
        }
      }
    }
  }

  score = Math.max(0, score);
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";

  // Document readiness
  const documentsReady = vertical.requiredDocuments.map(doc => ({
    name: doc.name,
    ready: !!loadData[`doc_${doc.id}`],
  }));

  return {
    verticalId, verticalName: vertical.name,
    score, maxScore: 100, grade,
    criticalIssues, warnings, documentsReady,
  };
}
