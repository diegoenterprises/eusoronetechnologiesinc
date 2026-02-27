/**
 * REGULATORY DATA — Federal requirements + State profiles
 * Consumed by regulatoryEngine.ts and regulatoryQueries.ts
 */

import type { RegulatoryRequirement, JurisdictionProfile } from "./regulatoryEngine";

// ============================================================================
// FEDERAL REQUIREMENTS — Apply everywhere
// ============================================================================

export const FEDERAL_REQUIREMENTS: RegulatoryRequirement[] = [
  // CDL & ENDORSEMENTS
  {
    id: "FED-CDL-A", category: "endorsement",
    title: "CDL Class A License",
    description: "Commercial Driver's License Class A required for combination vehicles over 26,001 lbs GVWR where towed vehicle exceeds 10,000 lbs",
    regulation: "49 CFR 383.91", authority: "FMCSA",
    appliesTo: { trailerTypes: "ALL", userRoles: ["driver", "owner_operator"], productCategories: "ALL", states: "ALL" },
    renewalPeriod: "Per state (4-8 years)", penalty: "Up to $5,000 fine; criminal penalties for repeat offenses",
    severity: "mandatory", estimatedCost: "$50-$300",
  },
  {
    id: "FED-HAZMAT-H", category: "endorsement",
    title: "Hazmat Endorsement (H)",
    description: "Required for transporting hazardous materials requiring placarding. Includes TSA background check and fingerprinting",
    regulation: "49 CFR 383.93 + TSA 49 CFR 1572", authority: "FMCSA / TSA",
    appliesTo: { trailerTypes: ["DOT-406","DOT-407","DOT-412","MC-331","MC-338","TANKER_CRUDE","TANKER_CHEMICAL"], userRoles: ["driver","owner_operator"], productCategories: ["crude_oil","refined_petroleum","lpg","anhydrous_ammonia","chlorine","sulfuric_acid","ammonium_nitrate","general_hazmat","radioactive","explosives"], states: "ALL" },
    renewalPeriod: "5 years (TSA check every 5 years)", penalty: "$2,500-$25,000 per violation",
    severity: "mandatory", estimatedCost: "$100-$300", processingTime: "4-6 weeks",
  },
  {
    id: "FED-TANKER-N", category: "endorsement",
    title: "Tanker Endorsement (N)",
    description: "Required for driving any vehicle designed to transport liquid in bulk (capacity of 119+ gallons)",
    regulation: "49 CFR 383.93(b)", authority: "FMCSA",
    appliesTo: { trailerTypes: ["DOT-406","DOT-407","DOT-412","MC-331","MC-338","TANKER_CRUDE","TANKER_CHEMICAL"], userRoles: ["driver","owner_operator"], productCategories: "ALL", states: "ALL" },
    renewalPeriod: "With CDL renewal", severity: "mandatory", estimatedCost: "$10-$50",
  },
  {
    id: "FED-TWIC", category: "endorsement",
    title: "TWIC — Transportation Worker Identification Credential",
    description: "Required for unescorted access to secure areas of MTSA-regulated maritime facilities, ports, and certain terminals",
    regulation: "46 CFR 101.514 / 49 CFR 1572", authority: "TSA",
    appliesTo: { trailerTypes: "ALL", userRoles: ["driver","owner_operator"], productCategories: ["crude_oil","refined_petroleum","lpg","anhydrous_ammonia","chlorine","general_hazmat"], states: "ALL" },
    renewalPeriod: "5 years", penalty: "Denied facility access; $10,000+ civil penalty",
    severity: "conditional", estimatedCost: "$125.25", processingTime: "4-6 weeks", url: "https://www.tsa.gov/twic",
  },
  // REGISTRATIONS
  {
    id: "FED-HMSP", category: "registration",
    title: "Hazmat Safety Permit (HMSP)",
    description: "Motor carriers transporting certain highly hazardous materials must obtain HMSP from FMCSA. Required for HRCQ radioactive, bulk explosives, bulk methane/LPG, >1L PIH Zone A",
    regulation: "49 CFR 385.401-385.423", authority: "FMCSA",
    appliesTo: { trailerTypes: ["MC-331","MC-338","DOT-406","DOT-407","TANKER_CRUDE","TANKER_CHEMICAL"], userRoles: ["carrier","owner_operator","fleet_manager"], productCategories: ["lpg","anhydrous_ammonia","chlorine","explosives","radioactive"], states: "ALL" },
    renewalPeriod: "biennial", penalty: "Out-of-service order; $10,000-$50,000 fine",
    severity: "mandatory", estimatedCost: "No fee (safety audit required)", url: "https://www.fmcsa.dot.gov/hazmat",
  },
  {
    id: "FED-HMREG", category: "registration",
    title: "Hazmat Registration (DOT Form F5800.2)",
    description: "All persons who transport or cause to be transported hazardous materials must register annually with PHMSA",
    regulation: "49 CFR 107.601-107.620", authority: "PHMSA",
    appliesTo: { trailerTypes: "ALL", userRoles: ["carrier","owner_operator","shipper"], productCategories: ["crude_oil","refined_petroleum","lpg","anhydrous_ammonia","chlorine","sulfuric_acid","ammonium_nitrate","general_hazmat","radioactive","explosives"], states: "ALL" },
    renewalPeriod: "annual (July 1 – June 30)", penalty: "$250-$50,000 per violation per day",
    severity: "mandatory", estimatedCost: "$150-$3,000", url: "https://www.phmsa.dot.gov/hazmat/registration",
  },
  {
    id: "FED-IFTA", category: "registration",
    title: "IFTA — International Fuel Tax Agreement",
    description: "Quarterly fuel tax reporting for vehicles operating in 2+ IFTA jurisdictions",
    regulation: "IFTA Agreement + 49 CFR Subchapter B", authority: "IFTA Inc. / Base State",
    appliesTo: { trailerTypes: "ALL", userRoles: ["carrier","owner_operator"], productCategories: "ALL", states: "ALL" },
    renewalPeriod: "annual + quarterly filing", severity: "mandatory",
  },
  {
    id: "FED-IRP", category: "registration",
    title: "IRP — International Registration Plan",
    description: "Apportioned registration for commercial vehicles operating in 2+ IRP jurisdictions",
    regulation: "IRP Agreement", authority: "IRP Inc. / Base State",
    appliesTo: { trailerTypes: "ALL", userRoles: ["carrier","owner_operator"], productCategories: "ALL", states: "ALL" },
    renewalPeriod: "annual", severity: "mandatory", estimatedCost: "$500-$5,000",
  },
  {
    id: "FED-UCR", category: "registration",
    title: "UCR — Unified Carrier Registration",
    description: "Annual registration and fee payment for interstate motor carriers, brokers, freight forwarders",
    regulation: "49 USC 14504a", authority: "UCR Board",
    appliesTo: { trailerTypes: "ALL", userRoles: ["carrier","owner_operator","broker"], productCategories: "ALL", states: "ALL" },
    renewalPeriod: "annual", severity: "mandatory", estimatedCost: "$69-$73,346",
  },
  // TRAINING
  {
    id: "FED-HAZMAT-TRAIN", category: "training",
    title: "Hazmat Employee Training (49 CFR 172.704)",
    description: "Five categories: General Awareness, Function-Specific, Safety, Security Awareness, In-Depth Security. Initial within 90 days; recurrent every 3 years",
    regulation: "49 CFR 172.704", authority: "PHMSA / FMCSA",
    appliesTo: { trailerTypes: "ALL", userRoles: ["driver","owner_operator","carrier","fleet_manager","dispatcher","shipper","safety_manager"], productCategories: ["crude_oil","refined_petroleum","lpg","anhydrous_ammonia","chlorine","sulfuric_acid","ammonium_nitrate","general_hazmat","radioactive","explosives"], states: "ALL" },
    renewalPeriod: "triennial", penalty: "$450-$180,000 per violation", severity: "mandatory",
  },
  {
    id: "FED-H2S-TRAIN", category: "training",
    title: "H2S (Hydrogen Sulfide) Safety Training",
    description: "Required for personnel entering any oilfield lease, tank battery, or production facility where H2S may be present",
    regulation: "OSHA 29 CFR 1910.1000 / API RP 49", authority: "OSHA / Operator SOP",
    appliesTo: { trailerTypes: ["DOT-406","DOT-407","TANKER_CRUDE"], userRoles: ["driver","owner_operator"], productCategories: ["crude_oil"], states: "ALL" },
    renewalPeriod: "annual", severity: "mandatory", estimatedCost: "$50-$200",
  },
  {
    id: "FED-HAZWOPER", category: "training",
    title: "HAZWOPER — Hazardous Waste Operations & Emergency Response",
    description: "Required for hazmat workers involved in cleanup or emergency response. 24/40-hour initial; 8-hour annual refresher",
    regulation: "OSHA 29 CFR 1910.120", authority: "OSHA",
    appliesTo: { trailerTypes: "ALL", userRoles: ["driver","owner_operator","safety_manager"], productCategories: ["crude_oil","refined_petroleum","anhydrous_ammonia","chlorine","sulfuric_acid","general_hazmat"], states: "ALL" },
    renewalPeriod: "annual (8-hr refresher)", severity: "conditional", estimatedCost: "$150-$500",
  },
  // INSURANCE
  {
    id: "FED-INS-GENERAL", category: "insurance",
    title: "Minimum Financial Responsibility — General Freight",
    description: "Bodily injury and property damage liability for for-hire carriers of general freight",
    regulation: "49 CFR 387.9", authority: "FMCSA",
    appliesTo: { trailerTypes: ["DRY_VAN","FLATBED","REEFER","HOPPER","LOWBOY","INTERMODAL"], userRoles: ["carrier","owner_operator"], productCategories: ["dry_freight","refrigerated","oversize"], states: "ALL" },
    severity: "mandatory", estimatedCost: "$750,000 minimum",
  },
  {
    id: "FED-INS-HAZMAT", category: "insurance",
    title: "Minimum Financial Responsibility — Hazmat Carrier",
    description: "$5,000,000 for bulk Class 3 (crude oil), TIH, Class 7, Class 1.1/1.2/1.3, bulk 2.3. $1,000,000 for other hazmat",
    regulation: "49 CFR 387.9(b)", authority: "FMCSA",
    appliesTo: { trailerTypes: ["DOT-406","DOT-407","DOT-412","MC-331","MC-338","TANKER_CRUDE","TANKER_CHEMICAL"], userRoles: ["carrier","owner_operator"], productCategories: ["crude_oil","refined_petroleum","lpg","anhydrous_ammonia","chlorine","sulfuric_acid","ammonium_nitrate","general_hazmat","radioactive","explosives"], states: "ALL" },
    severity: "mandatory", estimatedCost: "$1,000,000-$5,000,000 minimum",
  },
  {
    id: "FED-INS-CARGO", category: "insurance",
    title: "Cargo Insurance",
    description: "Covers loss or damage to cargo in transit. Required by most shippers/brokers. Typical: $100,000 minimum",
    regulation: "Shipper/broker contract requirement", authority: "Industry standard",
    appliesTo: { trailerTypes: "ALL", userRoles: ["carrier","owner_operator"], productCategories: "ALL", states: "ALL" },
    severity: "recommended", estimatedCost: "$100,000-$250,000 coverage",
  },
  // INSPECTIONS
  {
    id: "FED-TANK-INSPECT", category: "inspection",
    title: "Cargo Tank Inspection (49 CFR 180.407)",
    description: "External visual: every trip. Internal visual: annual. Leakage: annual. Pressure test: per spec (2yr or 5yr)",
    regulation: "49 CFR 180.407", authority: "PHMSA / FMCSA",
    appliesTo: { trailerTypes: ["DOT-406","DOT-407","DOT-412","MC-331","MC-338","TANKER_CRUDE","TANKER_CHEMICAL"], userRoles: ["carrier","owner_operator","fleet_manager"], productCategories: "ALL", states: "ALL" },
    renewalPeriod: "annual visual; 2-5yr pressure", penalty: "Out-of-service; $1,000-$16,000",
    severity: "mandatory", estimatedCost: "$500-$3,000",
  },
  {
    id: "FED-ANNUAL-INSPECT", category: "inspection",
    title: "Annual Vehicle Inspection (CVSA)",
    description: "All commercial vehicles must pass annual FMCSA inspection. Decal valid 12 months",
    regulation: "49 CFR 396.17", authority: "FMCSA",
    appliesTo: { trailerTypes: "ALL", userRoles: ["carrier","owner_operator","fleet_manager"], productCategories: "ALL", states: "ALL" },
    renewalPeriod: "annual", severity: "mandatory", estimatedCost: "$50-$150",
  },
  // DOCUMENTATION
  {
    id: "FED-BOL", category: "documentation",
    title: "Bill of Lading / Shipping Papers",
    description: "Required for every hazmat shipment: proper shipping name, hazard class, UN/NA number, packing group, quantity, 24-hr emergency phone",
    regulation: "49 CFR 172.200-172.204", authority: "PHMSA",
    appliesTo: { trailerTypes: "ALL", userRoles: ["driver","owner_operator","shipper","dispatcher"], productCategories: ["crude_oil","refined_petroleum","lpg","anhydrous_ammonia","chlorine","sulfuric_acid","ammonium_nitrate","general_hazmat","radioactive","explosives"], states: "ALL" },
    severity: "mandatory", penalty: "$450-$180,000",
  },
  {
    id: "FED-ERG", category: "documentation",
    title: "Emergency Response Guidebook (ERG)",
    description: "Must be carried in every vehicle transporting hazardous materials. Current edition: ERG2024",
    regulation: "49 CFR 172.602(b)", authority: "PHMSA / Transport Canada / Mexico SICT",
    appliesTo: { trailerTypes: "ALL", userRoles: ["driver","owner_operator"], productCategories: ["crude_oil","refined_petroleum","lpg","anhydrous_ammonia","chlorine","sulfuric_acid","ammonium_nitrate","general_hazmat","radioactive","explosives"], states: "ALL" },
    severity: "mandatory",
  },
  // EQUIPMENT
  {
    id: "FED-PLACARDS", category: "equipment",
    title: "Hazmat Placards & Labels",
    description: "Proper placards required on all four sides. Table 1: any qty. Table 2: 1,001+ lbs aggregate",
    regulation: "49 CFR 172.500-172.560", authority: "PHMSA",
    appliesTo: { trailerTypes: "ALL", userRoles: ["driver","owner_operator","carrier"], productCategories: ["crude_oil","refined_petroleum","lpg","anhydrous_ammonia","chlorine","sulfuric_acid","ammonium_nitrate","general_hazmat","radioactive","explosives"], states: "ALL" },
    severity: "mandatory", penalty: "$450-$180,000",
  },
  // OPERATIONAL
  {
    id: "FED-HOS", category: "operational",
    title: "Hours of Service (HOS)",
    description: "11-hr driving, 14-hr window, 60/70-hr cycle, 30-min break, 10-hr off-duty. ELD required",
    regulation: "49 CFR 395", authority: "FMCSA",
    appliesTo: { trailerTypes: "ALL", userRoles: ["driver","owner_operator"], productCategories: "ALL", states: "ALL" },
    severity: "mandatory", penalty: "$1,000-$16,000; driver/carrier OOS",
  },
  {
    id: "FED-DVIR", category: "operational",
    title: "Driver Vehicle Inspection Report (DVIR)",
    description: "Pre-trip and post-trip inspection required. Written report at end of each day",
    regulation: "49 CFR 396.11-396.13", authority: "FMCSA",
    appliesTo: { trailerTypes: "ALL", userRoles: ["driver","owner_operator"], productCategories: "ALL", states: "ALL" },
    severity: "mandatory",
  },
  {
    id: "FED-DRUG-ALCOHOL", category: "operational",
    title: "Drug & Alcohol Testing Program",
    description: "Pre-employment, random, post-accident, reasonable suspicion, return-to-duty, follow-up. Clearinghouse query required",
    regulation: "49 CFR 382 + 49 CFR 40", authority: "FMCSA",
    appliesTo: { trailerTypes: "ALL", userRoles: ["driver","owner_operator","carrier"], productCategories: "ALL", states: "ALL" },
    severity: "mandatory", penalty: "Driver disqualification; $10,000+ carrier fine",
  },
  {
    id: "FED-SEAL-CHAIN", category: "operational",
    title: "Seal Integrity / Chain of Custody",
    description: "Seal numbers recorded on BOL at origin, verified at destination. Broken/missing seal requires immediate reporting",
    regulation: "49 CFR 177.817 / Shipper SOP", authority: "PHMSA / Shipper",
    appliesTo: { trailerTypes: ["DOT-406","DOT-407","DOT-412","TANKER_CRUDE","TANKER_CHEMICAL"], userRoles: ["driver","owner_operator"], productCategories: ["crude_oil","refined_petroleum","chlorine","anhydrous_ammonia"], states: "ALL" },
    severity: "mandatory",
  },
];

// ============================================================================
// STATE PROFILES (14 key states for crude/hazmat operations)
// ============================================================================

export const STATE_PROFILES: Record<string, JurisdictionProfile> = {
  TX: {
    state: "TX", stateName: "Texas", hazmatPermitRequired: true, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA (base state available)",
    weightLimits: { single: 20000, tandem: 34000, gross: 80000 },
    specialRules: [
      "Texas Railroad Commission (RRC) permit required for crude oil transport in certain counties",
      "TxDOT oversize/overweight permit for loads exceeding standard limits",
      "Permian Basin counties may have county road bond requirements",
      "H2S training required for ALL oilfield lease access (operator-enforced)",
    ],
    cities: {
      houston: { name: "Houston", hazmatRestrictions: ["Hazmat restricted on Sam Houston Tollway during peak hours","Port of Houston requires TWIC"], timeRestrictions: ["6-9 AM / 4-7 PM on major freeways (advisory)"], routeRestrictions: ["I-610 loop restricted for oversize hazmat","Washington Ave corridor prohibited for tankers"], additionalPermits: ["City of Houston oversize permit for >80,000 lbs on city streets"] },
      midland: { name: "Midland", hazmatRestrictions: ["Heavy crude truck traffic — designated truck routes enforced"], timeRestrictions: ["School zone restrictions 7-8:30 AM / 3-4:30 PM"], routeRestrictions: ["TX-349 preferred crude oil route","Business 20 restricted for oversize"], additionalPermits: ["Midland County road bond may be required"] },
      odessa: { name: "Odessa", hazmatRestrictions: ["Designated crude oil truck routes"], timeRestrictions: [], routeRestrictions: ["US-385 and TX-302 preferred for hazmat"], additionalPermits: [] },
    },
  },
  NM: {
    state: "NM", stateName: "New Mexico", hazmatPermitRequired: true, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA", weightLimits: { single: 21600, tandem: 34200, gross: 86400 },
    specialRules: ["NMDOT hazmat permit required for Class 1, 2.3, 7","Tribal land crossings may require additional tribal permits"],
    cities: { albuquerque: { name: "Albuquerque", hazmatRestrictions: ["I-40 downtown hazmat restricted during events"], timeRestrictions: [], routeRestrictions: ["I-25/I-40 interchange — use bypass for hazmat"], additionalPermits: [] } },
  },
  OK: {
    state: "OK", stateName: "Oklahoma", hazmatPermitRequired: false, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA", weightLimits: { single: 20000, tandem: 34000, gross: 80000 },
    specialRules: ["Oklahoma Corporation Commission regulates oil field operations","Federal HMSP sufficient — no state-specific hazmat permit"],
    cities: {},
  },
  ND: {
    state: "ND", stateName: "North Dakota", hazmatPermitRequired: false, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA", weightLimits: { single: 20000, tandem: 34000, gross: 105500 },
    specialRules: ["Bakken region: county road restrictions during spring thaw","Higher gross weight limits (105,500 lbs) on certain routes","Seasonal load restrictions March-May","Oil field road bonds required in Williams, McKenzie, Mountrail counties"],
    cities: { williston: { name: "Williston", hazmatRestrictions: ["Heavy crude traffic — designated truck routes"], timeRestrictions: [], routeRestrictions: ["US-2 and US-85 preferred for crude transport"], additionalPermits: ["Williams County road bond required"] } },
  },
  CO: {
    state: "CO", stateName: "Colorado", hazmatPermitRequired: true, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA", weightLimits: { single: 20000, tandem: 36000, gross: 85000 },
    specialRules: ["CDOT hazmat escort program for Eisenhower/Johnson Tunnels","DJ Basin (Weld County): heavy oil & gas traffic","Chain law on I-70 mountain corridor (Sep–May)"],
    cities: { denver: { name: "Denver", hazmatRestrictions: ["I-70 through Denver: hazmat time restrictions during peak"], timeRestrictions: ["6-9 AM, 3:30-6:30 PM on I-25/I-70 (advisory for hazmat)"], routeRestrictions: ["E-470 toll road preferred hazmat bypass"], additionalPermits: [] } },
  },
  CA: {
    state: "CA", stateName: "California", hazmatPermitRequired: true, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA + CA diesel fuel tax surcharge", weightLimits: { single: 20000, tandem: 34000, gross: 80000 },
    specialRules: ["CARB diesel truck emissions requirements","CHP escort required for Class 1 explosives","Caltrans hazmat permit for radioactive/explosives/toxic","Proposition 65 chemical warning requirements"],
    cities: {
      losAngeles: { name: "Los Angeles", hazmatRestrictions: ["Port of LA/Long Beach: TWIC + Clean Truck Program","SCAQMD diesel restrictions in LA Basin"], timeRestrictions: ["Hazmat restricted on certain freeways during peak"], routeRestrictions: ["I-710 designated truck route to ports"], additionalPermits: ["Port of LA Clean Truck Program registration"] },
      sanFrancisco: { name: "San Francisco", hazmatRestrictions: ["Golden Gate Bridge: hazmat restricted","Bay Bridge: restrictions for certain classes"], timeRestrictions: [], routeRestrictions: ["I-880 preferred for hazmat through East Bay"], additionalPermits: [] },
    },
  },
  NY: {
    state: "NY", stateName: "New York", hazmatPermitRequired: true, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA + NY Highway Use Tax (HUT)", weightLimits: { single: 22400, tandem: 36000, gross: 80000 },
    specialRules: ["NY HUT required for vehicles >18,000 lbs","NYSDOT hazmat permit for HRCQ","NYC requires separate NYC DOT permit for ALL hazmat vehicles"],
    cities: {
      newYorkCity: { name: "New York City", hazmatRestrictions: ["ALL hazmat vehicles require NYC DOT permit","Lincoln Tunnel (Cat E): most hazmat prohibited","Holland Tunnel (Cat E): most hazmat prohibited","Queens-Midtown Tunnel (Cat D): flammable/toxic prohibited"], timeRestrictions: ["No hazmat 12 AM–6 AM without special permit","Commercial vehicles restricted from parkways 24/7"], routeRestrictions: ["George Washington Bridge upper level only for hazmat","Designated through-routes only in all boroughs"], additionalPermits: ["NYC DOT hazmat permit","NYC DEP permit for certain chemicals"] },
    },
  },
  PA: {
    state: "PA", stateName: "Pennsylvania", hazmatPermitRequired: true, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA", weightLimits: { single: 22400, tandem: 36000, gross: 80000 },
    specialRules: ["PennDOT hazmat permit for PA Turnpike","Marcellus/Utica shale traffic in NE/SW PA"],
    cities: { philadelphia: { name: "Philadelphia", hazmatRestrictions: ["I-76 hazmat restrictions during peak"], timeRestrictions: ["6-9 AM, 4-7 PM on I-76/I-95"], routeRestrictions: ["I-95 preferred for through hazmat"], additionalPermits: [] } },
  },
  OH: {
    state: "OH", stateName: "Ohio", hazmatPermitRequired: false, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA", weightLimits: { single: 20000, tandem: 34000, gross: 80000 },
    specialRules: ["Federal HMSP sufficient","Utica shale activity in eastern OH"],
    cities: {},
  },
  LA: {
    state: "LA", stateName: "Louisiana", hazmatPermitRequired: false, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA", weightLimits: { single: 20000, tandem: 34000, gross: 80000 },
    specialRules: ["Heavy petrochemical corridor: Baton Rouge to New Orleans","Port of South Louisiana: TWIC required","Atchafalaya Basin Bridge (I-10): hazmat restrictions"],
    cities: {},
  },
  IL: {
    state: "IL", stateName: "Illinois", hazmatPermitRequired: true, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA", weightLimits: { single: 20000, tandem: 34000, gross: 80000 },
    specialRules: ["IDOT hazmat routing permit for HRCQ through Chicago metro"],
    cities: { chicago: { name: "Chicago", hazmatRestrictions: ["Hazmat restricted on certain Cook County routes during rush hours"], timeRestrictions: ["6-9 AM, 3-7 PM weekdays"], routeRestrictions: ["I-294 preferred hazmat bypass"], additionalPermits: ["City of Chicago hazmat vehicle registration"] } },
  },
  NJ: {
    state: "NJ", stateName: "New Jersey", hazmatPermitRequired: true, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA", weightLimits: { single: 22400, tandem: 34000, gross: 80000 },
    specialRules: ["NJDOT hazmat permit for Class 1, 2.3, 7","NJ Turnpike: designated hazmat lanes","Port Newark/Elizabeth: TWIC required"],
    cities: {},
  },
  FL: {
    state: "FL", stateName: "Florida", hazmatPermitRequired: false, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA", weightLimits: { single: 22000, tandem: 44000, gross: 80000 },
    specialRules: ["Federal HMSP sufficient","Port Tampa/Jacksonville/Miami: TWIC required"],
    cities: {},
  },
  WV: {
    state: "WV", stateName: "West Virginia", hazmatPermitRequired: false, oversizePermitRequired: true,
    fuelTaxRegistration: "IFTA", weightLimits: { single: 20000, tandem: 34000, gross: 80000 },
    specialRules: ["Marcellus shale activity","Mountain terrain — additional brake requirements for tankers"],
    cities: {},
  },
};
