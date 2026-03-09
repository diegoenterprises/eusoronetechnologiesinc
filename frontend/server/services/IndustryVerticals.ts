/**
 * INDUSTRY VERTICALS SERVICE (GAP-274-339)
 * Configuration schema for 12 trucking industry verticals.
 * Each vertical defines: equipment, cargo types, compliance rules,
 * required documents, custom fields for load creation, and pricing factors.
 */

export interface VerticalField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "date" | "textarea";
  options?: string[];
  required: boolean;
  placeholder?: string;
  unit?: string;
  defaultValue?: any;
}

export interface ComplianceRule {
  id: string;
  regulation: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  autoCheck: boolean;
  checkField?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  required: boolean;
  category: "shipping" | "compliance" | "safety" | "insurance" | "customs";
  description: string;
}

export interface IndustryVertical {
  id: string;
  name: string;
  icon: string;
  description: string;
  equipmentTypes: string[];
  cargoTypes: string[];
  customFields: VerticalField[];
  complianceRules: ComplianceRule[];
  requiredDocuments: DocumentTemplate[];
  pricingFactors: { factor: string; multiplier: number; description: string }[];
  specialRequirements: string[];
  typicalWeightRange: { min: number; max: number; unit: string };
  temperatureControlled: boolean;
  hazmatApplicable: boolean;
}

export const INDUSTRY_VERTICALS: Record<string, IndustryVertical> = {
  general_freight: {
    id: "general_freight",
    name: "General Freight",
    icon: "Package",
    description: "Standard dry goods, palletized cargo, and general merchandise",
    equipmentTypes: ["Dry Van", "Flatbed", "Box Truck", "Straight Truck"],
    cargoTypes: ["general", "palletized", "boxed", "crated", "loose"],
    customFields: [
      { key: "palletCount", label: "Pallet Count", type: "number", required: false, placeholder: "e.g. 24" },
      { key: "stackable", label: "Stackable", type: "boolean", required: false, defaultValue: true },
      { key: "floorLoaded", label: "Floor Loaded", type: "boolean", required: false, defaultValue: false },
      { key: "liftgateRequired", label: "Liftgate Required", type: "boolean", required: false, defaultValue: false },
      { key: "insideDelivery", label: "Inside Delivery", type: "boolean", required: false, defaultValue: false },
    ],
    complianceRules: [
      { id: "gf-weight", regulation: "49 CFR 392.9", description: "Max gross weight 80,000 lbs (including truck)", severity: "critical", autoCheck: true, checkField: "weight" },
      { id: "gf-securement", regulation: "49 CFR 393.100-136", description: "Cargo securement standards — min 1 tiedown per 10ft", severity: "high", autoCheck: false },
    ],
    requiredDocuments: [
      { id: "bol", name: "Bill of Lading", required: true, category: "shipping", description: "Standard BOL with shipper/consignee, commodity, weight" },
      { id: "pod", name: "Proof of Delivery", required: true, category: "shipping", description: "Signed delivery receipt" },
    ],
    pricingFactors: [
      { factor: "base", multiplier: 1.0, description: "Standard rate per mile" },
      { factor: "liftgate", multiplier: 1.08, description: "Liftgate service surcharge" },
      { factor: "inside_delivery", multiplier: 1.12, description: "Inside delivery surcharge" },
    ],
    specialRequirements: [],
    typicalWeightRange: { min: 1000, max: 45000, unit: "lbs" },
    temperatureControlled: false,
    hazmatApplicable: false,
  },

  refrigerated: {
    id: "refrigerated",
    name: "Refrigerated / Temperature-Controlled",
    icon: "Snowflake",
    description: "Perishable foods, pharmaceuticals, and temperature-sensitive cargo",
    equipmentTypes: ["Reefer", "Insulated Van", "Multi-Temp Reefer"],
    cargoTypes: ["frozen", "chilled", "fresh_produce", "dairy", "meat", "seafood", "pharmaceuticals"],
    customFields: [
      { key: "tempMin", label: "Min Temperature", type: "number", required: true, placeholder: "-10", unit: "°F" },
      { key: "tempMax", label: "Max Temperature", type: "number", required: true, placeholder: "34", unit: "°F" },
      { key: "continuousMonitoring", label: "Continuous Temp Monitoring", type: "boolean", required: false, defaultValue: true },
      { key: "preCool", label: "Pre-Cool Required", type: "boolean", required: false, defaultValue: true },
      { key: "productType", label: "Product Type", type: "select", required: true, options: ["Frozen", "Chilled", "Fresh Produce", "Dairy", "Meat/Poultry", "Seafood", "Pharmaceuticals", "Flowers/Plants"] },
      { key: "fsmaCritical", label: "FSMA Critical Shipment", type: "boolean", required: false, defaultValue: false },
    ],
    complianceRules: [
      { id: "rf-fsma", regulation: "21 CFR 1.908 (FSMA)", description: "Sanitary transportation of food — temperature records required", severity: "critical", autoCheck: true, checkField: "fsmaCritical" },
      { id: "rf-temp", regulation: "21 CFR 110", description: "Temperature must remain within specified range during entire transit", severity: "critical", autoCheck: true, checkField: "tempMin" },
      { id: "rf-precool", regulation: "Industry Standard", description: "Trailer must be pre-cooled to target temp before loading", severity: "high", autoCheck: false },
      { id: "rf-records", regulation: "21 CFR 1.912", description: "Maintain temperature monitoring records for 12 months", severity: "high", autoCheck: false },
    ],
    requiredDocuments: [
      { id: "bol", name: "Bill of Lading", required: true, category: "shipping", description: "BOL with temperature requirements noted" },
      { id: "temp-log", name: "Temperature Log", required: true, category: "compliance", description: "Continuous reefer temperature printout" },
      { id: "fsma-record", name: "FSMA Sanitary Transport Record", required: false, category: "compliance", description: "Required for FSMA-critical shipments" },
      { id: "usda-cert", name: "USDA Inspection Certificate", required: false, category: "compliance", description: "For meat/poultry/egg products" },
    ],
    pricingFactors: [
      { factor: "base", multiplier: 1.0, description: "Standard reefer rate" },
      { factor: "frozen", multiplier: 1.15, description: "Frozen cargo premium (below 0°F)" },
      { factor: "pharma", multiplier: 1.30, description: "Pharmaceutical-grade temp control" },
      { factor: "multi_temp", multiplier: 1.20, description: "Multi-temperature zone trailer" },
    ],
    specialRequirements: ["Reefer unit must be operational and pre-cooled", "Driver must check temps every 2 hours", "FSMA training required for food shipments"],
    typicalWeightRange: { min: 1000, max: 44000, unit: "lbs" },
    temperatureControlled: true,
    hazmatApplicable: false,
  },

  hazmat: {
    id: "hazmat",
    name: "Hazardous Materials",
    icon: "AlertTriangle",
    description: "DOT-regulated hazardous materials across all 9 classes",
    equipmentTypes: ["MC-306", "MC-307", "MC-312", "MC-331", "MC-338", "Dry Van", "Flatbed"],
    cargoTypes: ["hazmat", "chemicals", "petroleum", "gas", "explosives", "radioactive", "corrosive"],
    customFields: [
      { key: "hazmatClass", label: "Hazmat Class", type: "select", required: true, options: ["1.1","1.2","1.3","1.4","2.1","2.2","2.3","3","4.1","4.2","4.3","5.1","5.2","6.1","6.2","7","8","9"] },
      { key: "unNumber", label: "UN Number", type: "text", required: true, placeholder: "UN1234" },
      { key: "packingGroup", label: "Packing Group", type: "select", required: false, options: ["I", "II", "III"] },
      { key: "properShippingName", label: "Proper Shipping Name", type: "text", required: true, placeholder: "e.g. Gasoline" },
      { key: "ergGuide", label: "ERG Guide #", type: "number", required: false, placeholder: "128" },
      { key: "placard", label: "Placard Required", type: "boolean", required: false, defaultValue: true },
      { key: "isTIH", label: "Toxic Inhalation Hazard", type: "boolean", required: false, defaultValue: false },
      { key: "emergencyPhone", label: "Emergency Contact Phone", type: "text", required: true, placeholder: "CHEMTREC: 1-800-424-9300" },
    ],
    complianceRules: [
      { id: "hz-endorsement", regulation: "49 CFR 383.93", description: "Driver must have valid CDL with H endorsement", severity: "critical", autoCheck: true },
      { id: "hz-shipping-papers", regulation: "49 CFR 172.200", description: "Shipping papers with proper description, UN#, hazard class, packing group", severity: "critical", autoCheck: false },
      { id: "hz-placard", regulation: "49 CFR 172.504", description: "Vehicle properly placarded per DOT requirements", severity: "critical", autoCheck: false },
      { id: "hz-segregation", regulation: "49 CFR 177.848", description: "Incompatible materials must be segregated", severity: "critical", autoCheck: true, checkField: "hazmatClass" },
      { id: "hz-routing", regulation: "49 CFR 397", description: "Must use designated hazmat routes; avoid tunnels and populated areas", severity: "high", autoCheck: false },
      { id: "hz-security", regulation: "49 CFR 172.800", description: "Security plan required for certain high-risk materials", severity: "high", autoCheck: false },
    ],
    requiredDocuments: [
      { id: "bol", name: "Hazmat Bill of Lading", required: true, category: "shipping", description: "BOL with proper shipping name, UN#, hazard class, PG, ERG" },
      { id: "erg", name: "Emergency Response Guidebook", required: true, category: "safety", description: "Current ERG must be in cab" },
      { id: "sds", name: "Safety Data Sheet (SDS)", required: true, category: "safety", description: "SDS for each material being transported" },
      { id: "hazmat-cert", name: "Hazmat Training Certificate", required: true, category: "compliance", description: "Driver hazmat training per 49 CFR 172.704" },
      { id: "security-plan", name: "Security Plan", required: false, category: "compliance", description: "Required for HRCQ and certain materials" },
    ],
    pricingFactors: [
      { factor: "base", multiplier: 1.0, description: "Standard rate" },
      { factor: "hazmat_premium", multiplier: 1.25, description: "General hazmat surcharge" },
      { factor: "explosives", multiplier: 1.50, description: "Class 1 explosives premium" },
      { factor: "radioactive", multiplier: 1.60, description: "Class 7 radioactive premium" },
      { factor: "tih", multiplier: 1.45, description: "Toxic inhalation hazard premium" },
    ],
    specialRequirements: ["H endorsement on CDL", "TWIC card for port access", "Hazmat training current within 3 years", "Emergency response plan onboard"],
    typicalWeightRange: { min: 500, max: 44000, unit: "lbs" },
    temperatureControlled: false,
    hazmatApplicable: true,
  },

  tanker: {
    id: "tanker",
    name: "Tanker / Liquid Bulk",
    icon: "Droplets",
    description: "Liquid bulk transportation — petroleum, chemicals, food-grade liquids",
    equipmentTypes: ["MC-306", "MC-307", "MC-312", "MC-331", "MC-338", "Food-Grade Tanker", "Acid Tanker"],
    cargoTypes: ["petroleum", "chemicals", "liquid", "food_grade_liquid", "crude_oil", "fuel", "water"],
    customFields: [
      { key: "kosher", label: "Kosher Certified", type: "boolean", required: false, defaultValue: false },
      { key: "lastProduct", label: "Last Product Hauled", type: "text", required: false, placeholder: "For cross-contamination check" },
      { key: "washRequired", label: "Tank Wash Required", type: "boolean", required: false, defaultValue: false },
    ],
    complianceRules: [
      { id: "tk-endorsement", regulation: "49 CFR 383.93", description: "Driver must have CDL with N (tanker) endorsement", severity: "critical", autoCheck: true },
      { id: "tk-inspection", regulation: "49 CFR 180.407", description: "Tank must have current inspection (visual annual, pressure 5yr, hydro)", severity: "critical", autoCheck: false },
      { id: "tk-surge", regulation: "49 CFR 393.86", description: "Baffled tanks required for certain liquids to prevent surge", severity: "high", autoCheck: false },
      { id: "tk-weight", regulation: "Bridge Formula", description: "Liquid weight distribution must comply with bridge formula", severity: "high", autoCheck: true, checkField: "volume" },
    ],
    requiredDocuments: [
      { id: "bol", name: "Bill of Lading", required: true, category: "shipping", description: "BOL with product name, volume, weight, SG" },
      { id: "tank-cert", name: "Tank Inspection Certificate", required: true, category: "compliance", description: "Current DOT tank inspection per 49 CFR 180.407" },
      { id: "wash-ticket", name: "Tank Wash Ticket", required: false, category: "compliance", description: "Proof of tank cleaning before loading food-grade" },
      { id: "run-ticket", name: "Run Ticket", required: false, category: "shipping", description: "Loading/unloading measurement ticket" },
    ],
    pricingFactors: [
      { factor: "base", multiplier: 1.0, description: "Standard tanker rate per mile" },
      { factor: "food_grade", multiplier: 1.20, description: "Food-grade tanker premium" },
      { factor: "acid", multiplier: 1.35, description: "Corrosive/acid premium" },
      { factor: "cryogenic", multiplier: 1.40, description: "Cryogenic liquid premium" },
      { factor: "wash_cost", multiplier: 1.05, description: "Tank wash pass-through" },
    ],
    specialRequirements: ["N endorsement on CDL", "Tank inspection current", "Cross-contamination check for food-grade"],
    typicalWeightRange: { min: 5000, max: 44000, unit: "lbs" },
    temperatureControlled: false,
    hazmatApplicable: true,
  },

  flatbed: {
    id: "flatbed",
    name: "Flatbed / Open Deck",
    icon: "Truck",
    description: "Oversized, heavy, and construction materials on open trailers",
    equipmentTypes: ["Flatbed", "Step Deck", "Lowboy", "RGN", "Double Drop", "Conestoga"],
    cargoTypes: ["steel", "lumber", "machinery", "construction", "oversized", "heavy_haul", "coils"],
    customFields: [
      { key: "dimensions", label: "Cargo Dimensions (LxWxH)", type: "text", required: true, placeholder: "48x8x8 ft" },
      { key: "isOversized", label: "Oversized Load", type: "boolean", required: false, defaultValue: false },
      { key: "overWidth", label: "Over Width (ft)", type: "number", required: false, placeholder: "12" },
      { key: "overHeight", label: "Over Height (ft)", type: "number", required: false, placeholder: "14" },
      { key: "overLength", label: "Over Length (ft)", type: "number", required: false, placeholder: "75" },
      { key: "permitRequired", label: "Permit Required", type: "boolean", required: false, defaultValue: false },
      { key: "escortRequired", label: "Escort Vehicle Required", type: "boolean", required: false, defaultValue: false },
      { key: "tarpRequired", label: "Tarp Required", type: "boolean", required: false, defaultValue: false },
      { key: "coilRacks", label: "Coil Racks Needed", type: "boolean", required: false, defaultValue: false },
    ],
    complianceRules: [
      { id: "fb-securement", regulation: "49 CFR 393.100-136", description: "Cargo securement — chains, binders, straps per commodity type", severity: "critical", autoCheck: false },
      { id: "fb-oversized", regulation: "State DOT", description: "Oversized loads require permits and may need escorts/pilot cars", severity: "critical", autoCheck: true, checkField: "isOversized" },
      { id: "fb-flags", regulation: "49 CFR 393.87", description: "Red flags/lights required on projecting loads", severity: "high", autoCheck: false },
      { id: "fb-tarp", regulation: "Contract/State", description: "Tarp may be required to protect cargo from elements", severity: "medium", autoCheck: true, checkField: "tarpRequired" },
    ],
    requiredDocuments: [
      { id: "bol", name: "Bill of Lading", required: true, category: "shipping", description: "BOL with dimensions and weight" },
      { id: "oversize-permit", name: "Oversize/Overweight Permit", required: false, category: "compliance", description: "State DOT permits for each transit state" },
      { id: "escort-plan", name: "Escort/Pilot Car Plan", required: false, category: "safety", description: "Route plan with escort positions" },
    ],
    pricingFactors: [
      { factor: "base", multiplier: 1.0, description: "Standard flatbed rate" },
      { factor: "oversized", multiplier: 1.40, description: "Oversized load premium" },
      { factor: "heavy_haul", multiplier: 1.60, description: "Heavy haul (>80,000 lbs) premium" },
      { factor: "escort", multiplier: 1.25, description: "Escort vehicle surcharge" },
      { factor: "tarp", multiplier: 1.05, description: "Tarp surcharge" },
      { factor: "permits", multiplier: 1.10, description: "Multi-state permit costs" },
    ],
    specialRequirements: ["Proper securement equipment (chains, binders, straps)", "Banner/flags for oversized", "Pilot cars for certain dimensions"],
    typicalWeightRange: { min: 5000, max: 120000, unit: "lbs" },
    temperatureControlled: false,
    hazmatApplicable: false,
  },

  auto_transport: {
    id: "auto_transport",
    name: "Auto Transport",
    icon: "Car",
    description: "Vehicle hauling — new/used cars, trucks, motorcycles, EVs",
    equipmentTypes: ["Car Hauler (Open)", "Car Hauler (Enclosed)", "Hotshot", "Lowboy"],
    cargoTypes: ["vehicles", "automobiles", "motorcycles", "EVs", "classic_cars"],
    customFields: [
      { key: "vehicleCount", label: "Number of Vehicles", type: "number", required: true, placeholder: "1-10" },
      { key: "vehicleType", label: "Vehicle Type", type: "select", required: true, options: ["Sedan", "SUV/Truck", "Motorcycle", "EV", "Classic/Exotic", "Commercial Vehicle", "RV/Motorhome"] },
      { key: "enclosed", label: "Enclosed Transport", type: "boolean", required: false, defaultValue: false },
      { key: "operable", label: "All Vehicles Operable", type: "boolean", required: false, defaultValue: true },
      { key: "vinNumbers", label: "VIN Numbers", type: "textarea", required: false, placeholder: "One per line" },
    ],
    complianceRules: [
      { id: "at-inspection", regulation: "Industry Standard", description: "Vehicle condition report (VCR) required at pickup and delivery", severity: "critical", autoCheck: false },
      { id: "at-insurance", regulation: "49 CFR 387", description: "Carrier must have cargo insurance covering vehicles in transit", severity: "critical", autoCheck: false },
      { id: "at-securement", regulation: "49 CFR 393.128", description: "Each vehicle must have 4 independent tiedowns", severity: "high", autoCheck: false },
    ],
    requiredDocuments: [
      { id: "bol", name: "Bill of Lading", required: true, category: "shipping", description: "BOL with VINs, make/model/year, condition" },
      { id: "vcr", name: "Vehicle Condition Report", required: true, category: "shipping", description: "Photo inspection at pickup and delivery" },
      { id: "insurance-cert", name: "Cargo Insurance Certificate", required: true, category: "insurance", description: "Coverage for value of vehicles" },
    ],
    pricingFactors: [
      { factor: "base", multiplier: 1.0, description: "Per vehicle rate" },
      { factor: "enclosed", multiplier: 1.60, description: "Enclosed transport premium" },
      { factor: "inoperable", multiplier: 1.15, description: "Non-running vehicle surcharge" },
      { factor: "exotic", multiplier: 1.40, description: "Classic/exotic vehicle premium" },
      { factor: "ev_battery", multiplier: 1.10, description: "EV special handling" },
    ],
    specialRequirements: ["Photo documentation at pickup", "VCR signed by shipper", "VIN verification"],
    typicalWeightRange: { min: 2000, max: 80000, unit: "lbs" },
    temperatureControlled: false,
    hazmatApplicable: false,
  },

  intermodal: {
    id: "intermodal",
    name: "Intermodal / Container",
    icon: "Container",
    description: "ISO containers, port drayage, rail-to-truck transfers",
    equipmentTypes: ["Container Chassis", "20ft Chassis", "40ft Chassis", "Flatbed"],
    cargoTypes: ["container", "ISO_container", "import", "export", "transload"],
    customFields: [
      { key: "containerSize", label: "Container Size", type: "select", required: true, options: ["20ft Standard", "40ft Standard", "40ft High-Cube", "45ft High-Cube", "20ft Reefer", "40ft Reefer"] },
      { key: "containerNumber", label: "Container Number", type: "text", required: true, placeholder: "MAEU1234567" },
      { key: "sealNumber", label: "Seal Number", type: "text", required: false, placeholder: "SEAL123456" },
      { key: "bookingNumber", label: "Booking/BL Number", type: "text", required: false },
      { key: "steamshipLine", label: "Steamship Line", type: "text", required: false, placeholder: "e.g. Maersk, MSC" },
      { key: "portOfEntry", label: "Port of Entry", type: "text", required: false, placeholder: "e.g. Houston, Long Beach" },
      { key: "lastFreeDay", label: "Last Free Day", type: "date", required: false },
      { key: "demurrage", label: "Demurrage Risk", type: "boolean", required: false, defaultValue: false },
    ],
    complianceRules: [
      { id: "im-twic", regulation: "46 CFR 101.514", description: "TWIC card required for port access", severity: "critical", autoCheck: false },
      { id: "im-weight", regulation: "SOLAS VGM", description: "Verified Gross Mass required for export containers", severity: "critical", autoCheck: false },
      { id: "im-chassis", regulation: "FMCSA", description: "Chassis inspection required — FHWA roadability", severity: "high", autoCheck: false },
      { id: "im-customs", regulation: "CBP 19 CFR", description: "Customs clearance must be obtained before inland movement", severity: "critical", autoCheck: false },
    ],
    requiredDocuments: [
      { id: "bol", name: "Ocean Bill of Lading", required: true, category: "shipping", description: "Master or house B/L" },
      { id: "delivery-order", name: "Delivery Order", required: true, category: "shipping", description: "Terminal release/delivery order" },
      { id: "customs-release", name: "Customs Release", required: false, category: "customs", description: "CBP release confirmation" },
      { id: "isf", name: "ISF (10+2) Filing", required: false, category: "customs", description: "Importer Security Filing for imports" },
    ],
    pricingFactors: [
      { factor: "base", multiplier: 1.0, description: "Standard drayage rate" },
      { factor: "port_congestion", multiplier: 1.15, description: "Port congestion surcharge" },
      { factor: "chassis_split", multiplier: 1.10, description: "Chassis pick up/drop off at different locations" },
      { factor: "overweight", multiplier: 1.20, description: "Overweight container (>44,000 lbs cargo)" },
      { factor: "reefer", multiplier: 1.25, description: "Reefer container genset" },
    ],
    specialRequirements: ["TWIC card", "Port-specific terminal access", "Chassis inspection", "Last free day tracking"],
    typicalWeightRange: { min: 5000, max: 44000, unit: "lbs" },
    temperatureControlled: false,
    hazmatApplicable: true,
  },

  ltl: {
    id: "ltl",
    name: "LTL / Partial Load",
    icon: "Layers",
    description: "Less-than-truckload shipments, shared trailer space",
    equipmentTypes: ["Dry Van", "Reefer", "Flatbed"],
    cargoTypes: ["ltl", "partial", "palletized", "boxed"],
    customFields: [
      { key: "nmfcClass", label: "NMFC Class", type: "select", required: true, options: ["50", "55", "60", "65", "70", "77.5", "85", "92.5", "100", "110", "125", "150", "175", "200", "250", "300", "400", "500"] },
      { key: "nmfcNumber", label: "NMFC Number", type: "text", required: false, placeholder: "e.g. 44500" },
      { key: "handlingUnits", label: "Handling Units", type: "number", required: true, placeholder: "e.g. 4" },
      { key: "linearFeet", label: "Linear Feet", type: "number", required: true, placeholder: "e.g. 8", unit: "ft" },
      { key: "residentialDelivery", label: "Residential Delivery", type: "boolean", required: false, defaultValue: false },
      { key: "appointmentRequired", label: "Appointment Required", type: "boolean", required: false, defaultValue: false },
    ],
    complianceRules: [
      { id: "ltl-class", regulation: "NMFTA", description: "Freight class must match commodity per NMFC classification", severity: "high", autoCheck: true, checkField: "nmfcClass" },
      { id: "ltl-dims", regulation: "NMFTA", description: "Dimensions must be accurate — reclass fees for misclassification", severity: "medium", autoCheck: false },
    ],
    requiredDocuments: [
      { id: "bol", name: "LTL Bill of Lading", required: true, category: "shipping", description: "BOL with NMFC class, dimensions, handling units" },
      { id: "pod", name: "Proof of Delivery", required: true, category: "shipping", description: "Signed POD with exception notes" },
    ],
    pricingFactors: [
      { factor: "base", multiplier: 1.0, description: "CWT rate based on NMFC class" },
      { factor: "residential", multiplier: 1.20, description: "Residential delivery surcharge" },
      { factor: "liftgate", multiplier: 1.08, description: "Liftgate" },
      { factor: "appointment", multiplier: 1.05, description: "Appointment delivery" },
      { factor: "reclass", multiplier: 1.15, description: "Potential reclass adjustment" },
    ],
    specialRequirements: ["Accurate NMFC classification", "Proper dimensions for density-based pricing"],
    typicalWeightRange: { min: 100, max: 15000, unit: "lbs" },
    temperatureControlled: false,
    hazmatApplicable: false,
  },

  heavy_haul: {
    id: "heavy_haul",
    name: "Heavy Haul / Specialized",
    icon: "Weight",
    description: "Super loads, wind turbines, transformers, industrial equipment",
    equipmentTypes: ["RGN", "Multi-Axle", "Perimeter Frame", "Schnabel", "Beam Trailer", "Hydraulic Platform"],
    cargoTypes: ["heavy_haul", "oversized", "wind_turbine", "transformer", "industrial_equipment", "modular_building"],
    customFields: [
      { key: "grossWeight", label: "Gross Weight", type: "number", required: true, placeholder: "150000", unit: "lbs" },
      { key: "length", label: "Overall Length", type: "number", required: true, placeholder: "120", unit: "ft" },
      { key: "width", label: "Overall Width", type: "number", required: true, placeholder: "14", unit: "ft" },
      { key: "height", label: "Overall Height", type: "number", required: true, placeholder: "16", unit: "ft" },
      { key: "axleCount", label: "Required Axles", type: "number", required: false, placeholder: "13" },
      { key: "escortCount", label: "Escort Vehicles Needed", type: "number", required: false, placeholder: "2" },
      { key: "bridgeStudy", label: "Bridge Study Required", type: "boolean", required: false, defaultValue: false },
      { key: "utilityCoordination", label: "Utility Line Coordination", type: "boolean", required: false, defaultValue: false },
      { key: "routeSurvey", label: "Route Survey Completed", type: "boolean", required: false, defaultValue: false },
    ],
    complianceRules: [
      { id: "hh-permits", regulation: "State DOT", description: "Permits required in every transit state — varies by dimensions/weight", severity: "critical", autoCheck: true, checkField: "grossWeight" },
      { id: "hh-escorts", regulation: "State DOT", description: "Escort/pilot cars required — number varies by state and dimensions", severity: "critical", autoCheck: true, checkField: "escortCount" },
      { id: "hh-bridge", regulation: "Federal Bridge Formula", description: "Bridge analysis required for loads exceeding 80,000 lbs", severity: "critical", autoCheck: true, checkField: "bridgeStudy" },
      { id: "hh-time", regulation: "State DOT", description: "Travel restrictions — daylight only, no weekends/holidays in many states", severity: "high", autoCheck: false },
      { id: "hh-utility", regulation: "State/Local", description: "Utility line coordination for height clearance", severity: "high", autoCheck: true, checkField: "utilityCoordination" },
    ],
    requiredDocuments: [
      { id: "bol", name: "Bill of Lading", required: true, category: "shipping", description: "Detailed BOL with exact dimensions and weight" },
      { id: "permits", name: "Oversize/Overweight Permits", required: true, category: "compliance", description: "Permits for each transit state" },
      { id: "route-survey", name: "Route Survey Report", required: true, category: "safety", description: "Detailed route survey with clearances" },
      { id: "bridge-study", name: "Bridge Analysis", required: false, category: "compliance", description: "Engineering bridge study for super loads" },
      { id: "escort-plan", name: "Escort Plan", required: true, category: "safety", description: "Escort vehicle positions and communication plan" },
    ],
    pricingFactors: [
      { factor: "base", multiplier: 1.0, description: "Heavy haul base rate" },
      { factor: "super_load", multiplier: 2.0, description: "Super load (>150,000 lbs or >16ft wide)" },
      { factor: "permits", multiplier: 1.15, description: "Multi-state permit costs" },
      { factor: "escorts", multiplier: 1.30, description: "Multiple escort vehicles" },
      { factor: "bridge_study", multiplier: 1.10, description: "Bridge engineering study" },
      { factor: "route_survey", multiplier: 1.08, description: "Route survey cost" },
    ],
    specialRequirements: ["Route survey before movement", "Bridge study for super loads", "Utility coordination for height", "State police notification in some states"],
    typicalWeightRange: { min: 80000, max: 500000, unit: "lbs" },
    temperatureControlled: false,
    hazmatApplicable: false,
  },

  livestock: {
    id: "livestock",
    name: "Livestock / Live Animals",
    icon: "Beef",
    description: "Cattle, poultry, hogs, horses, and other live animal transport",
    equipmentTypes: ["Cattle Pot", "Livestock Trailer", "Horse Trailer", "Poultry Trailer"],
    cargoTypes: ["livestock", "cattle", "hogs", "poultry", "horses", "live_animals"],
    customFields: [
      { key: "animalType", label: "Animal Type", type: "select", required: true, options: ["Cattle", "Hogs/Swine", "Poultry", "Horses", "Sheep/Goats", "Other"] },
      { key: "headCount", label: "Head Count", type: "number", required: true, placeholder: "40" },
      { key: "avgWeight", label: "Avg Weight per Head", type: "number", required: false, placeholder: "1200", unit: "lbs" },
      { key: "healthCert", label: "Health Certificate Required", type: "boolean", required: false, defaultValue: true },
      { key: "brandInspection", label: "Brand Inspection Required", type: "boolean", required: false, defaultValue: false },
      { key: "feedWaterStops", label: "Feed/Water Stops Needed", type: "boolean", required: false, defaultValue: false },
    ],
    complianceRules: [
      { id: "ls-28hr", regulation: "49 USC 80502", description: "28-Hour Law — animals must be unloaded for 5hrs rest/feed/water after 28hrs", severity: "critical", autoCheck: false },
      { id: "ls-health", regulation: "9 CFR", description: "Interstate health certificate (CVI) required for crossing state lines", severity: "critical", autoCheck: true, checkField: "healthCert" },
      { id: "ls-brand", regulation: "State Ag", description: "Brand inspection required in western states", severity: "high", autoCheck: true, checkField: "brandInspection" },
      { id: "ls-welfare", regulation: "USDA APHIS", description: "Animal welfare — proper ventilation, space, bedding", severity: "critical", autoCheck: false },
    ],
    requiredDocuments: [
      { id: "bol", name: "Bill of Lading", required: true, category: "shipping", description: "BOL with species, head count, origin farm" },
      { id: "health-cert", name: "Certificate of Veterinary Inspection", required: true, category: "compliance", description: "CVI signed by licensed vet within 30 days" },
      { id: "brand-inspection", name: "Brand Inspection Certificate", required: false, category: "compliance", description: "Required in brand inspection states" },
    ],
    pricingFactors: [
      { factor: "base", multiplier: 1.0, description: "Per head or per load rate" },
      { factor: "horses", multiplier: 1.35, description: "Horse transport premium" },
      { factor: "long_haul", multiplier: 1.15, description: "Feed/water stop required (>28hr)" },
    ],
    specialRequirements: ["28-Hour Law compliance", "Health certificate within 30 days", "Proper ventilation and bedding", "Feed/water stop planning"],
    typicalWeightRange: { min: 10000, max: 48000, unit: "lbs" },
    temperatureControlled: false,
    hazmatApplicable: false,
  },

  bulk_dry: {
    id: "bulk_dry",
    name: "Dry Bulk / Pneumatic",
    icon: "Mountain",
    description: "Grain, sand, cement, plastic pellets, and other dry bulk commodities",
    equipmentTypes: ["Hopper", "Pneumatic Tanker", "Belt Trailer", "End Dump", "Walking Floor"],
    cargoTypes: ["grain", "sand", "cement", "plastic_pellets", "fly_ash", "lime", "salt", "feed"],
    customFields: [
      { key: "commodity", label: "Commodity", type: "select", required: true, options: ["Grain/Corn", "Wheat", "Soybeans", "Sand/Gravel", "Cement", "Lime", "Fly Ash", "Plastic Pellets", "Feed/Meal", "Salt", "Fertilizer", "Other"] },
      { key: "volume", label: "Volume", type: "number", required: false, placeholder: "1000", unit: "cu ft" },
      { key: "bulkDensity", label: "Bulk Density", type: "number", required: false, placeholder: "62", unit: "lbs/cu ft" },
      { key: "loadingMethod", label: "Loading Method", type: "select", required: false, options: ["Gravity", "Pneumatic", "Conveyor", "Auger"] },
      { key: "unloadingMethod", label: "Unloading Method", type: "select", required: false, options: ["Gravity (bottom)", "Pneumatic (air)", "Belt/Conveyor", "End Dump", "Walking Floor"] },
      { key: "moistureContent", label: "Moisture Content %", type: "number", required: false },
    ],
    complianceRules: [
      { id: "bd-weight", regulation: "Federal/State", description: "Overweight fines — bulk loads frequently approach limits", severity: "critical", autoCheck: true, checkField: "weight" },
      { id: "bd-dust", regulation: "OSHA 29 CFR 1910.272", description: "Dust control during loading/unloading (grain elevators)", severity: "high", autoCheck: false },
      { id: "bd-contamination", regulation: "FDA 21 CFR", description: "Food-grade commodities must be free from contamination", severity: "high", autoCheck: false },
    ],
    requiredDocuments: [
      { id: "bol", name: "Bill of Lading", required: true, category: "shipping", description: "BOL with commodity, weight, grade" },
      { id: "weight-ticket", name: "Weight Ticket", required: true, category: "shipping", description: "Certified scale weight at loading" },
      { id: "grade-cert", name: "Grade Certificate", required: false, category: "compliance", description: "USDA grain grade for agricultural commodities" },
    ],
    pricingFactors: [
      { factor: "base", multiplier: 1.0, description: "Standard bulk rate" },
      { factor: "pneumatic", multiplier: 1.15, description: "Pneumatic unloading premium" },
      { factor: "food_grade", multiplier: 1.10, description: "Food-grade trailer requirement" },
    ],
    specialRequirements: ["Scale weight verification", "Trailer cleanliness for food-grade", "Dust control at grain facilities"],
    typicalWeightRange: { min: 20000, max: 48000, unit: "lbs" },
    temperatureControlled: false,
    hazmatApplicable: false,
  },

  moving_household: {
    id: "moving_household",
    name: "Household Goods / Moving",
    icon: "Home",
    description: "Residential and commercial moving services",
    equipmentTypes: ["Moving Van", "Straight Truck", "Container/Pod"],
    cargoTypes: ["household_goods", "furniture", "personal_effects", "office_furniture"],
    customFields: [
      { key: "estimatedWeight", label: "Estimated Weight", type: "number", required: true, placeholder: "8000", unit: "lbs" },
      { key: "moveType", label: "Move Type", type: "select", required: true, options: ["Residential", "Commercial/Office", "Military/Government", "Corporate Relocation"] },
      { key: "packingService", label: "Packing Service", type: "boolean", required: false, defaultValue: false },
      { key: "storageNeeded", label: "Storage in Transit", type: "boolean", required: false, defaultValue: false },
      { key: "valuation", label: "Declared Value", type: "number", required: false, placeholder: "25000", unit: "$" },
      { key: "inventoryRequired", label: "Detailed Inventory", type: "boolean", required: false, defaultValue: true },
    ],
    complianceRules: [
      { id: "hg-estimate", regulation: "49 CFR 375", description: "Written estimate required — binding or non-binding", severity: "critical", autoCheck: false },
      { id: "hg-rights", regulation: "49 CFR 375.401", description: "Must provide 'Your Rights and Responsibilities' booklet", severity: "critical", autoCheck: false },
      { id: "hg-inventory", regulation: "49 CFR 375.403", description: "Detailed inventory must be completed at pickup", severity: "high", autoCheck: true, checkField: "inventoryRequired" },
      { id: "hg-weight", regulation: "49 CFR 375.521", description: "Shipment must be weighed on certified scale", severity: "high", autoCheck: false },
    ],
    requiredDocuments: [
      { id: "bol", name: "Bill of Lading / Contract", required: true, category: "shipping", description: "Detailed moving contract" },
      { id: "estimate", name: "Written Estimate", required: true, category: "shipping", description: "Binding or non-binding estimate" },
      { id: "inventory", name: "Household Goods Inventory", required: true, category: "shipping", description: "Item-by-item inventory with condition" },
      { id: "rights-booklet", name: "Rights & Responsibilities", required: true, category: "compliance", description: "FMCSA consumer protection booklet" },
      { id: "valuation", name: "Valuation Declaration", required: true, category: "insurance", description: "Released value or full replacement" },
    ],
    pricingFactors: [
      { factor: "base", multiplier: 1.0, description: "Per CWT or flat rate" },
      { factor: "packing", multiplier: 1.30, description: "Full packing service" },
      { factor: "storage", multiplier: 1.15, description: "Storage in transit" },
      { factor: "stairs", multiplier: 1.08, description: "Stairs/elevator carry" },
      { factor: "long_carry", multiplier: 1.05, description: "Long carry (>75ft)" },
    ],
    specialRequirements: ["Written estimate before loading", "Consumer rights booklet", "Certified scale weight", "Detailed inventory"],
    typicalWeightRange: { min: 2000, max: 20000, unit: "lbs" },
    temperatureControlled: false,
    hazmatApplicable: false,
  },
};

// ── Service Functions ────────────────────────────────────────────────────────

export function getVertical(verticalId: string): IndustryVertical | null {
  return INDUSTRY_VERTICALS[verticalId] || null;
}

export function getAllVerticals(): IndustryVertical[] {
  return Object.values(INDUSTRY_VERTICALS);
}

export function getVerticalFields(verticalId: string): VerticalField[] {
  return INDUSTRY_VERTICALS[verticalId]?.customFields || [];
}

export function getVerticalCompliance(verticalId: string): ComplianceRule[] {
  return INDUSTRY_VERTICALS[verticalId]?.complianceRules || [];
}

export function getVerticalDocuments(verticalId: string): DocumentTemplate[] {
  return INDUSTRY_VERTICALS[verticalId]?.requiredDocuments || [];
}

export function getVerticalPricing(verticalId: string, baseRate: number, factors: string[]): {
  baseRate: number; adjustments: Array<{ factor: string; multiplier: number; amount: number }>; finalRate: number;
} {
  const vertical = INDUSTRY_VERTICALS[verticalId];
  if (!vertical) return { baseRate, adjustments: [], finalRate: baseRate };

  let totalMultiplier = 1.0;
  const adjustments: Array<{ factor: string; multiplier: number; amount: number }> = [];

  for (const f of factors) {
    const pf = vertical.pricingFactors.find(p => p.factor === f);
    if (pf && pf.factor !== "base") {
      const amount = baseRate * (pf.multiplier - 1);
      adjustments.push({ factor: pf.factor, multiplier: pf.multiplier, amount: Math.round(amount * 100) / 100 });
      totalMultiplier *= pf.multiplier;
    }
  }

  return {
    baseRate,
    adjustments,
    finalRate: Math.round(baseRate * totalMultiplier * 100) / 100,
  };
}

export function validateLoadForVertical(verticalId: string, loadData: Record<string, any>): {
  valid: boolean; errors: string[]; warnings: string[];
} {
  const vertical = INDUSTRY_VERTICALS[verticalId];
  if (!vertical) return { valid: false, errors: [`Unknown vertical: ${verticalId}`], warnings: [] };

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required custom fields
  for (const field of vertical.customFields) {
    if (field.required && (loadData[field.key] === undefined || loadData[field.key] === null || loadData[field.key] === "")) {
      errors.push(`Required field missing: ${field.label}`);
    }
  }

  // Auto-check compliance rules
  for (const rule of vertical.complianceRules) {
    if (rule.autoCheck && rule.checkField) {
      const val = loadData[rule.checkField];
      if (val === undefined || val === null || val === "" || val === false) {
        if (rule.severity === "critical") {
          errors.push(`Compliance: ${rule.description} (${rule.regulation})`);
        } else {
          warnings.push(`${rule.description} (${rule.regulation})`);
        }
      }
    }
  }

  // Weight check
  if (loadData.weight) {
    const w = Number(loadData.weight);
    if (w > vertical.typicalWeightRange.max) {
      warnings.push(`Weight ${w} ${vertical.typicalWeightRange.unit} exceeds typical max of ${vertical.typicalWeightRange.max} for ${vertical.name}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
