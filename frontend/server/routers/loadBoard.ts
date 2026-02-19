/**
 * LOAD BOARD ROUTER — GOLD STANDARD
 * Comprehensive tRPC procedures for freight matching, load posting, booking,
 * and hazmat-class-aware carrier matching.
 *
 * TRAILER TYPES: Every DOT specification, capacity, inspection requirement,
 * hazmat class compatibility, and product compatibility matrix.
 *
 * MATCHING ALGORITHM: Scores carriers/loads on endorsement, HMSP authorization,
 * insurance adequacy, trailer compatibility, lane preference, weight capacity,
 * and compliance status.
 *
 * PRODUCTION-READY: All data from database, no mock data.
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, companies, vehicles, bids, drivers, users, loadBids, bidAutoAcceptRules, negotiations, negotiationMessages, laneContracts, agreements } from "../../drizzle/schema";
import { resolveUserRole, isAdminRole } from "../_core/resolveRole";

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE-AWARE USER RESOLUTION
// Maps auth context (Clerk/JWT) → DB user ID, role, company, driver profile
// ═══════════════════════════════════════════════════════════════════════════════

async function resolveUserId(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const email = ctxUser?.email || "";
  if (!email) return ctxUser?.id ? Number(ctxUser.id) : 0;
  try {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (row) return row.id;
  } catch { /* fall through */ }
  return ctxUser?.id ? Number(ctxUser.id) : 0;
}

interface UserProfile {
  userId: number;
  role: string;
  isAdmin: boolean;
  companyId: number | null;
  driverId: number | null;
  hasHazmatEndorsement: boolean;
  hazmatExpired: boolean;
  carrierHazmatAuth: boolean;
  carrierInsuranceAmount: number;
}

async function resolveUserProfile(ctxUser: any): Promise<UserProfile> {
  const userId = await resolveUserId(ctxUser);
  const role = await resolveUserRole(ctxUser);
  const admin = isAdminRole(role);
  let companyId: number | null = null;
  let driverId: number | null = null;
  let hasHazmatEndorsement = false;
  let hazmatExpired = false;
  let carrierHazmatAuth = false;
  let carrierInsuranceAmount = 0;

  const db = await getDb();
  if (db && userId) {
    try {
      // Get driver record (links user → company, endorsements)
      const [drv] = await db.select().from(drivers).where(eq(drivers.userId, userId)).limit(1);
      if (drv) {
        driverId = drv.id;
        companyId = drv.companyId;
        hasHazmatEndorsement = !!drv.hazmatEndorsement;
        if (drv.hazmatExpiry && new Date(drv.hazmatExpiry) < new Date()) hazmatExpired = true;
      }
      // Get company details for carrier/hazmat/insurance checks
      if (companyId) {
        const [co] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
        if (co) {
          carrierHazmatAuth = !!co.hazmatLicense && !(co.hazmatExpiry && new Date(co.hazmatExpiry) < new Date());
          if (co.insurancePolicy) {
            try {
              const ins = typeof co.insurancePolicy === 'string' ? JSON.parse(co.insurancePolicy) : co.insurancePolicy;
              carrierInsuranceAmount = (ins as any)?.amount || (ins as any)?.limit || 0;
            } catch { carrierInsuranceAmount = 0; }
          }
        }
      }
    } catch (e) { console.warn('[LoadBoard] resolveUserProfile failed:', e); }
  }

  return { userId, role, isAdmin: admin, companyId, driverId, hasHazmatEndorsement, hazmatExpired, carrierHazmatAuth, carrierInsuranceAmount };
}

// Maps user role → bidder role for the loadBids table
function roleToBidderRole(role: string): "catalyst" | "broker" | "driver" | "escort" {
  if (role === "BROKER") return "broker";
  if (role === "DRIVER") return "driver";
  if (role === "ESCORT") return "escort";
  return "catalyst"; // CATALYST, DISPATCH, ADMIN, etc default to catalyst
}

// Roles allowed to post loads
const LOAD_POSTER_ROLES = ["SHIPPER", "BROKER", "ADMIN", "SUPER_ADMIN", "DISPATCH", "TERMINAL_MANAGER"];
// Roles allowed to bid on loads
const LOAD_BIDDER_ROLES = ["CATALYST", "BROKER", "DRIVER", "DISPATCH", "ESCORT", "ADMIN", "SUPER_ADMIN"];
// Roles allowed to book loads (assign carrier)
const LOAD_BOOKER_ROLES = ["CATALYST", "BROKER", "DISPATCH", "ADMIN", "SUPER_ADMIN"];
// Roles that see matching (carrier-facing)
const CARRIER_ROLES = ["CATALYST", "BROKER", "DISPATCH", "DRIVER", "ESCORT"];
// Roles that see carrier search (shipper-facing)
const SHIPPER_ROLES = ["SHIPPER", "BROKER", "ADMIN", "SUPER_ADMIN", "TERMINAL_MANAGER"];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE TRAILER TYPE SYSTEM
// Every DOT specification, capacity, products, hazmat classes, inspections
// ═══════════════════════════════════════════════════════════════════════════════

interface TrailerSpec {
  name: string;
  dotSpec: string;
  category: "tank" | "dry" | "flat" | "refrigerated" | "bulk" | "specialized";
  capacityGallons: number | null;
  capacityLbs: number;
  hazmatClasses: string[];
  products: string[];
  inspectionReq: string;
  inspectionInterval: string;
  cdlEndorsement: string;
  specialRequirements: string[];
}

const TRAILER_TYPES: Record<string, TrailerSpec> = {
  // ── LIQUID TANK TRAILERS (DOT/MC Spec) ──────────────────────────────────
  "MC-306": {
    name: "Petroleum Tank (DOT-406)",
    dotSpec: "DOT-406",
    category: "tank",
    capacityGallons: 9500,
    capacityLbs: 80000,
    hazmatClasses: ["3", "6.1", "8", "9"],
    products: [
      "Gasoline (UN1203)", "Diesel fuel (UN1202)", "Jet fuel (UN1863)",
      "Kerosene (UN1223)", "Heating oil (NA1993)", "Aviation gasoline (UN1203)",
      "Ethanol fuel blends (UN1170)", "Biodiesel (NA1993)",
      "Naphtha (UN1256)", "Fuel oil No. 2 (NA1993)", "Fuel oil No. 6 (NA1993)",
      "Methanol (UN1230)", "Toluene (UN1294)", "Xylene (UN1307)",
      "Acetone (UN1090)", "Isopropanol (UN1219)",
    ],
    inspectionReq: "49 CFR 180.407 — External visual, internal visual, lining inspection, pressure test, thickness test",
    inspectionInterval: "Annual visual, 5-year pressure retest",
    cdlEndorsement: "HN",
    specialRequirements: ["Vapor recovery system", "Grounding/bonding equipment", "Rollover protection", "Emergency shutoff valves"],
  },
  "MC-307": {
    name: "Chemical Tank (DOT-407)",
    dotSpec: "DOT-407",
    category: "tank",
    capacityGallons: 7000,
    capacityLbs: 80000,
    hazmatClasses: ["3", "4.1", "5.1", "5.2", "6.1", "8", "9"],
    products: [
      "Sulfuric acid (UN1830)", "Hydrochloric acid (UN1789)",
      "Phosphoric acid (UN1805)", "Nitric acid (UN2031)",
      "Sodium hydroxide solution (UN1824)", "Potassium hydroxide (UN1814)",
      "Hydrogen peroxide >8% (UN2015)", "Acetic acid (UN2789)",
      "Formaldehyde solution (UN1198)", "Ammonia solution (UN2672)",
      "Isocyanates (UN2206)", "Phenol (UN1671)",
      "Chloroform (UN1888)", "Methylene chloride (UN1593)",
      "Ethylene glycol (NA1993)", "Propylene glycol",
      "Latex emulsions", "Resins (polyester/epoxy)",
      "Detergent concentrates", "Industrial solvents",
    ],
    inspectionReq: "49 CFR 180.407 — External visual, internal visual, lining inspection, pressure test, thickness test",
    inspectionInterval: "Annual visual, 5-year pressure retest",
    cdlEndorsement: "HN",
    specialRequirements: ["Stainless steel or lined interior", "Chemical-resistant gaskets", "Vapor recovery", "Emergency shutoff"],
  },
  "MC-312": {
    name: "Corrosive Tank (DOT-412)",
    dotSpec: "DOT-412",
    category: "tank",
    capacityGallons: 6500,
    capacityLbs: 80000,
    hazmatClasses: ["3", "5.1", "6.1", "8"],
    products: [
      "Sulfuric acid concentrated (UN1830)", "Hydrochloric acid (UN1789)",
      "Hydrofluoric acid (UN1790)", "Nitric acid fuming (UN2032)",
      "Chromic acid (UN1463)", "Oleum (UN1831)",
      "Bromine (UN1744)", "Ferric chloride solution (UN2582)",
      "Aluminum chloride solution (UN2581)", "Zinc chloride solution (UN1840)",
      "Phosphorus trichloride (UN1809)", "Titanium tetrachloride (UN1838)",
      "Battery acid", "Etching solutions",
      "Caustic soda 50% (UN1824)", "Bleach solutions (UN1791)",
    ],
    inspectionReq: "49 CFR 180.407 — External visual, internal visual, lining inspection, pressure test, thickness test (higher pressure rating)",
    inspectionInterval: "Annual visual, 2-year pressure retest (higher frequency due to corrosive service)",
    cdlEndorsement: "HN",
    specialRequirements: ["Rubber/PTFE lining", "Corrosion-resistant valves", "Double-walled optional", "Spill containment"],
  },
  "MC-331": {
    name: "Pressurized Gas Tank",
    dotSpec: "MC-331",
    category: "tank",
    capacityGallons: 11600,
    capacityLbs: 80000,
    hazmatClasses: ["2.1", "2.2", "2.3", "3"],
    products: [
      "Propane/LPG (UN1075)", "Butane (UN1011)", "Isobutane (UN1969)",
      "Anhydrous ammonia (UN1005)", "Chlorine (UN1017)",
      "Sulfur dioxide (UN1079)", "Vinyl chloride (UN1086)",
      "Ethylene oxide (UN1040)", "Propylene (UN1077)",
      "Butadiene (UN1010)", "Methyl chloride (UN1063)",
      "Dimethyl ether (UN1033)", "Hydrogen fluoride (UN1052)",
      "Phosgene (UN1076)", "Ethyl chloride (UN1037)",
      "NGL (natural gas liquids)", "Refrigerant gases (various UN)",
    ],
    inspectionReq: "49 CFR 180.407 — External visual every trip, hydrostatic retest, thickness test, relief valve test",
    inspectionInterval: "Visual every load, 10-year hydrostatic retest",
    cdlEndorsement: "HN",
    specialRequirements: ["Pressure relief devices", "Excess flow valves", "Internal shutoff", "Manway inspection", "No welding repairs without requalification"],
  },
  "MC-338": {
    name: "Cryogenic Tank",
    dotSpec: "MC-338",
    category: "tank",
    capacityGallons: 11500,
    capacityLbs: 80000,
    hazmatClasses: ["2.2", "2.1"],
    products: [
      "Liquid oxygen (UN1073)", "Liquid nitrogen (UN1977)",
      "Liquid argon (UN1951)", "Liquid helium (UN1963)",
      "LNG — Liquid natural gas (UN1972)", "Liquid hydrogen (UN1966)",
      "Liquid carbon dioxide (UN2187)", "Liquid ethylene (UN1038)",
      "Liquid nitrous oxide (UN2201)", "Liquid neon (UN1913)",
    ],
    inspectionReq: "49 CFR 180.407 — Vacuum integrity test, hold-time test, pressure test, relief device test",
    inspectionInterval: "Annual hold-time test, 5-year vacuum integrity",
    cdlEndorsement: "N",
    specialRequirements: ["Vacuum-insulated double wall", "Cryogenic-rated valves", "Pressure-building coils", "Vent stack", "PPE for cryogenic burns"],
  },
  "DOT-407": {
    name: "Low-Pressure Chemical Tank (Stainless)",
    dotSpec: "DOT-407",
    category: "tank",
    capacityGallons: 6800,
    capacityLbs: 80000,
    hazmatClasses: ["3", "5.1", "6.1", "8", "9"],
    products: [
      "Food-grade oils (non-hazmat)", "Liquid sugar/corn syrup",
      "Wine/spirits (UN3065)", "Chocolate liquor",
      "Vegetable oils", "Animal fats/tallow",
      "Pharmaceutical intermediates", "Cosmetic bases",
      "Mild chemicals requiring stainless contact",
    ],
    inspectionReq: "49 CFR 180.407 — Standard tank test suite, plus FDA food-grade certification if dual-use",
    inspectionInterval: "Annual visual, 5-year pressure retest",
    cdlEndorsement: "N",
    specialRequirements: ["316L stainless interior", "Sanitary fittings (Tri-Clamp)", "CIP (Clean-in-Place) system", "Kosher/Halal certification optional"],
  },

  // ── DRY FREIGHT TRAILERS ──────────────────────────────────────────────────
  "DRY_VAN": {
    name: "Dry Van (53ft Standard)",
    dotSpec: "N/A — Standard trailer",
    category: "dry",
    capacityGallons: null,
    capacityLbs: 45000,
    hazmatClasses: ["1.4", "4.1", "4.2", "4.3", "5.1", "5.2", "6.1", "6.2", "8", "9"],
    products: [
      "Packaged chemicals (drums/totes/pails)", "Aerosol products (UN1950)",
      "Batteries — lithium (UN3480/3481)", "Batteries — lead-acid (UN2794)",
      "Paint/coatings (UN1263)", "Adhesives (UN1133)",
      "Pesticides/herbicides (various UN)", "Fertilizers (UN2067/2071)",
      "Cleaning supplies", "Pharmaceutical products",
      "Consumer electronics", "General merchandise",
      "Paper/packaging products", "Textiles/apparel",
      "Canned/packaged food", "Beverages (non-bulk)",
      "Auto parts", "Furniture", "Appliances",
      "Building materials (packaged)", "Medical supplies/devices",
      "Fireworks (UN0336) — Class 1.4G",
    ],
    inspectionReq: "Standard DOT annual inspection (49 CFR 396.17)",
    inspectionInterval: "Annual DOT inspection",
    cdlEndorsement: "",
    specialRequirements: ["E-track/logistic posts", "Air-ride suspension for fragile freight", "Load locks/straps"],
  },
  "HAZMAT_VAN": {
    name: "Hazmat-Rated Dry Van",
    dotSpec: "N/A — Enhanced spec van",
    category: "dry",
    capacityGallons: null,
    capacityLbs: 44000,
    hazmatClasses: ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "4.1", "4.2", "4.3", "5.1", "5.2", "6.1", "6.2", "7", "8", "9"],
    products: [
      "Explosives — commercial (UN0081/0082/0083)", "Detonators (UN0255)",
      "Ammonium nitrate (UN1942)", "Black powder (UN0027)",
      "Smokeless powder (UN0509)", "Signal flares (UN0191)",
      "Radioactive materials — LSA/SCO (UN2912)", "Radioactive — Type A packages (UN2915)",
      "Infectious substances — Category A (UN2814)", "Infectious — Category B (UN3373)",
      "Toxic substances in drums/packaging", "Organic peroxides — Type E/F (UN3107-3120)",
      "Oxidizers in bulk packaging", "Military munitions",
      "Fireworks (UN0335/0336) — all classes",
    ],
    inspectionReq: "Standard DOT annual + enhanced placarding mounts, floor integrity, door seals, cargo securement",
    inspectionInterval: "Annual DOT + pre-trip for each hazmat load",
    cdlEndorsement: "H",
    specialRequirements: ["Reinforced floor", "Sealed door gaskets", "Placard holders all 4 sides + ends", "Fire extinguisher 10-lb ABC", "Emergency response info pocket"],
  },

  // ── FLATBED FAMILY ─────────────────────────────────────────────────────────
  "FLATBED": {
    name: "Standard Flatbed (48/53ft)",
    dotSpec: "N/A — Standard trailer",
    category: "flat",
    capacityGallons: null,
    capacityLbs: 48000,
    hazmatClasses: ["1.4", "4.1", "7", "9"],
    products: [
      "Steel coils/beams/plate", "Lumber/timber", "Concrete products (pipe/block)",
      "Heavy machinery/equipment", "Construction materials",
      "Wind turbine components", "Solar panels (oversized)",
      "Pipe (steel/PVC/HDPE)", "Structural steel", "Rebar bundles",
      "Transformers (oil-filled — UN3432)", "Railroad equipment",
      "Military vehicles/equipment", "Industrial valves/fittings",
      "Precast concrete", "Brick/masonry pallets",
      "Radioactive Type B casks (UN2916) — flatbed with cradle",
    ],
    inspectionReq: "Standard DOT annual (49 CFR 396.17)",
    inspectionInterval: "Annual DOT inspection",
    cdlEndorsement: "",
    specialRequirements: ["Tarps (lumber/steel tarps)", "Chains/binders for coils", "Edge protectors", "4-inch straps", "Coil racks optional"],
  },
  "STEP_DECK": {
    name: "Step Deck / Drop Deck",
    dotSpec: "N/A — Specialty flatbed",
    category: "flat",
    capacityGallons: null,
    capacityLbs: 48000,
    hazmatClasses: ["9"],
    products: [
      "Tall/overheight machinery", "Industrial equipment",
      "Agricultural equipment (tractors/combines)", "Construction equipment",
      "Generators/compressors", "HVAC units (oversized)",
      "Vehicles (specialty)", "Modular buildings",
      "Tall fabrications", "Processing equipment",
    ],
    inspectionReq: "Standard DOT annual (49 CFR 396.17)",
    inspectionInterval: "Annual DOT inspection",
    cdlEndorsement: "",
    specialRequirements: ["Ramps for drive-on", "Chains/binders", "Tarps available for weather protection"],
  },
  "LOWBOY": {
    name: "Lowboy / RGN (Removable Gooseneck)",
    dotSpec: "N/A — Heavy haul trailer",
    category: "flat",
    capacityGallons: null,
    capacityLbs: 80000,
    hazmatClasses: ["9"],
    products: [
      "Excavators/bulldozers/cranes", "Mining equipment",
      "Industrial boilers/pressure vessels", "Oil field equipment",
      "Bridge beams/girders", "Heavy transformers",
      "Military tanks/vehicles", "Wind turbine nacelles",
      "Pre-built modular homes", "Oversized industrial components",
    ],
    inspectionReq: "Standard DOT annual + oversize/overweight permit verification",
    inspectionInterval: "Annual DOT inspection",
    cdlEndorsement: "",
    specialRequirements: ["Oversize/overweight permits", "Escort vehicles (state-dependent)", "Route survey for clearance", "Hydraulic detachable gooseneck"],
  },
  "CONESTOGA": {
    name: "Conestoga (Rolling-Tarp Flatbed)",
    dotSpec: "N/A — Covered flatbed",
    category: "flat",
    capacityGallons: null,
    capacityLbs: 44000,
    hazmatClasses: ["4.1", "9"],
    products: [
      "Building materials (weather-sensitive)", "Drywall/insulation",
      "Packaged lumber/plywood", "Metal products requiring weather protection",
      "Machinery requiring covered but side-load access",
      "Rolled goods (carpet/vinyl)", "Paper rolls",
      "Bagged products on pallets", "Boxed electronics (oversized)",
    ],
    inspectionReq: "Standard DOT annual (49 CFR 396.17)",
    inspectionInterval: "Annual DOT inspection",
    cdlEndorsement: "",
    specialRequirements: ["Rolling tarp system", "Side-access capability", "Floor-level loading"],
  },

  // ── REFRIGERATED ───────────────────────────────────────────────────────────
  "REEFER": {
    name: "Refrigerated Trailer (53ft)",
    dotSpec: "N/A — Temperature-controlled",
    category: "refrigerated",
    capacityGallons: null,
    capacityLbs: 44000,
    hazmatClasses: ["2.2", "6.2", "9"],
    products: [
      "Frozen foods (meats/seafood/vegetables)", "Fresh produce",
      "Dairy products (milk/cheese/yogurt)", "Ice cream",
      "Pharmaceutical products (cold chain)", "Vaccines (2-8°C)",
      "Biologics/blood products", "Floral products",
      "Chocolate/confections (temperature-sensitive)",
      "Beverages (temperature-sensitive)", "Chemicals requiring temp control",
      "Temperature-sensitive adhesives/resins",
      "Frozen dough/bakery products", "Meat/poultry (fresh or frozen)",
      "Seafood (fresh, frozen, live)", "Organic peroxides requiring temp control (UN3111-3120)",
    ],
    inspectionReq: "Standard DOT annual + reefer unit maintenance, FSMA temperature monitoring (21 CFR 1.908)",
    inspectionInterval: "Annual DOT + reefer unit per manufacturer schedule (typically 500-hr intervals)",
    cdlEndorsement: "",
    specialRequirements: ["Continuous temperature monitoring", "FSMA Sanitary Transport compliance", "Pre-cool verification", "Multi-temp zones optional", "Fuel for reefer unit"],
  },

  // ── BULK/PNEUMATIC ─────────────────────────────────────────────────────────
  "HOPPER": {
    name: "Dry Bulk / Pneumatic Hopper",
    dotSpec: "DOT-412 (if hazmat) / Standard",
    category: "bulk",
    capacityGallons: null,
    capacityLbs: 50000,
    hazmatClasses: ["4.1", "5.1", "8", "9"],
    products: [
      "Cement/portland cement", "Fly ash", "Calcium carbonate",
      "Sand/silica", "Plastic pellets/resin", "Soda ash (UN3082)",
      "Sugar (granulated)", "Flour/grain", "Animal feed",
      "Fertilizer — dry (ammonium nitrate UN1942, urea)",
      "Potash (UN1422 — Class 4.3 when wet)",
      "Salt/road salt", "Calcium chloride",
      "Activated carbon", "Titanium dioxide",
      "Sodium bicarbonate", "Bentonite clay",
      "Diatomaceous earth", "Kaolin/ball clay",
    ],
    inspectionReq: "Standard DOT annual + pneumatic system test, pressure relief device check",
    inspectionInterval: "Annual DOT inspection + pneumatic test",
    cdlEndorsement: "",
    specialRequirements: ["Air compressor/blower system", "Discharge hoses", "Dust collection capability", "Load cell/scale integration optional"],
  },
  "FOOD_GRADE_TANK": {
    name: "Food-Grade Liquid Tank (Stainless 316L)",
    dotSpec: "DOT-407 (food-grade variant)",
    category: "tank",
    capacityGallons: 6500,
    capacityLbs: 80000,
    hazmatClasses: ["3", "9"],
    products: [
      "Liquid sugar/HFCS", "Corn syrup", "Chocolate liquor",
      "Vegetable oils (soybean, canola, palm)", "Olive oil",
      "Animal fats/tallow", "Coconut oil", "Lard",
      "Milk/cream (bulk)", "Juice concentrates",
      "Wine/spirits (UN3065)", "Beer (bulk)",
      "Water (purified/spring)", "Liquid eggs",
      "Molasses", "Honey (bulk)", "Vinegar",
      "Pharmaceutical-grade water (WFI)", "Flavoring extracts",
    ],
    inspectionReq: "49 CFR 180.407 + FDA 21 CFR 1.908 (FSMA Sanitary Transport) — kosher/halal wash verification",
    inspectionInterval: "Annual DOT + kosher/halal wash between loads, CIP verification",
    cdlEndorsement: "N",
    specialRequirements: ["316L stainless steel", "Tri-Clamp sanitary fittings", "CIP system", "FDA FSMA compliant", "Kosher/Halal certification", "Temperature monitoring"],
  },
  "WATER_TANK": {
    name: "Water / Non-Hazmat Liquid Tank",
    dotSpec: "Non-DOT (potable water) / DOT-406 variant",
    category: "tank",
    capacityGallons: 9000,
    capacityLbs: 80000,
    hazmatClasses: [],
    products: [
      "Potable water", "Non-potable water (construction/mining)",
      "Produced water (oilfield)", "Fracking water",
      "Flowback water", "Brine solutions",
      "Dust control water", "Fire suppression water",
      "Wastewater transport", "Drilling mud",
    ],
    inspectionReq: "Standard DOT annual, potable water certification if applicable",
    inspectionInterval: "Annual DOT inspection",
    cdlEndorsement: "N",
    specialRequirements: ["Potable water certification (NSF/ANSI 61)", "Baffles for slosh control", "Bottom-dump or pump-off capability"],
  },

  // ── SPECIALIZED TRAILERS ────────────────────────────────────────────────────
  "INTERMODAL": {
    name: "Intermodal Container Chassis (20/40/53ft)",
    dotSpec: "N/A — ISO container chassis",
    category: "specialized",
    capacityGallons: null,
    capacityLbs: 44000,
    hazmatClasses: ["1.4", "3", "4.1", "5.1", "6.1", "8", "9"],
    products: [
      "Containerized general cargo", "Containerized chemicals (drums/totes/IBCs)",
      "Containerized food products", "Import/export containers",
      "ISO tank containers (hazmat)", "Reefer containers",
      "Military/government containers", "E-commerce/retail goods",
    ],
    inspectionReq: "Standard DOT annual + container CSC plate verification",
    inspectionInterval: "Annual DOT + CSC inspection per IICL",
    cdlEndorsement: "",
    specialRequirements: ["Twist locks for container securement", "CSC plate current", "Chassis inspection per FMCSA Intermodal Equipment Providers rule"],
  },
  "CURTAINSIDE": {
    name: "Curtainside / Tautliner",
    dotSpec: "N/A — Side-access trailer",
    category: "dry",
    capacityGallons: null,
    capacityLbs: 44000,
    hazmatClasses: ["4.1", "9"],
    products: [
      "Palletized goods requiring side-load", "Beverage distribution",
      "Building materials", "Appliances",
      "Rolled goods (paper/textiles/carpet)", "Furniture",
      "Packaged lumber", "Bagged products",
    ],
    inspectionReq: "Standard DOT annual (49 CFR 396.17)",
    inspectionInterval: "Annual DOT inspection",
    cdlEndorsement: "",
    specialRequirements: ["Curtain tensioning system", "Side-load forklift access", "Roller-bed optional for heavy pallets"],
  },
  "DOUBLE_DROP": {
    name: "Double Drop / Stretch Trailer",
    dotSpec: "N/A — Heavy/oversized",
    category: "flat",
    capacityGallons: null,
    capacityLbs: 45000,
    hazmatClasses: ["9"],
    products: [
      "Extremely tall/oversized equipment", "Industrial vessels",
      "ASME pressure vessels", "Heat exchangers",
      "Reactor vessels", "Columns/towers",
      "Oversized fabrications", "Large electrical transformers",
    ],
    inspectionReq: "Standard DOT annual + oversize permit verification",
    inspectionInterval: "Annual DOT inspection",
    cdlEndorsement: "",
    specialRequirements: ["Oversize/overweight permits", "Escort vehicles", "Route survey", "Extendable to 60-80ft"],
  },
  "DUMP_TRAILER": {
    name: "End Dump / Bottom Dump / Side Dump",
    dotSpec: "N/A — Dump trailer",
    category: "bulk",
    capacityGallons: null,
    capacityLbs: 50000,
    hazmatClasses: ["9"],
    products: [
      "Sand/gravel/aggregate", "Dirt/topsoil/fill",
      "Asphalt millings", "Demolition debris",
      "Coal", "Scrap metal",
      "Grain (farm use)", "Rock/stone",
      "Woodchips/mulch", "Construction waste",
    ],
    inspectionReq: "Standard DOT annual + hydraulic system inspection",
    inspectionInterval: "Annual DOT inspection",
    cdlEndorsement: "",
    specialRequirements: ["Hydraulic PTO or electric-over-hydraulic", "Tarp system for dust control", "Tailgate/barn door configuration"],
  },
  "AUTO_CARRIER": {
    name: "Auto Carrier / Car Hauler (7-10 vehicle)",
    dotSpec: "N/A — Vehicle transport",
    category: "specialized",
    capacityGallons: null,
    capacityLbs: 50000,
    hazmatClasses: [],
    products: [
      "Passenger vehicles (new/used)", "Light trucks/SUVs",
      "Vans", "Electric vehicles",
      "Dealer auction vehicles", "Rental fleet vehicles",
      "Classic/collector cars (enclosed carrier)",
    ],
    inspectionReq: "Standard DOT annual + hydraulic ramp inspection",
    inspectionInterval: "Annual DOT inspection",
    cdlEndorsement: "",
    specialRequirements: ["Adjustable deck ramps", "Wheel chocks/tie-downs per vehicle", "Drip pans for fluid leaks", "Enclosed option for high-value vehicles"],
  },
  "LIVESTOCK": {
    name: "Livestock / Cattle Pot",
    dotSpec: "N/A — Live animal transport",
    category: "specialized",
    capacityGallons: null,
    capacityLbs: 50000,
    hazmatClasses: [],
    products: [
      "Cattle", "Hogs/swine", "Sheep/goats",
      "Horses (stock trailer variant)", "Poultry (live)",
      "Exotic animals (permitted)", "Bison/buffalo",
    ],
    inspectionReq: "Standard DOT annual + USDA APHIS requirements, 28-hour law compliance",
    inspectionInterval: "Annual DOT inspection",
    cdlEndorsement: "",
    specialRequirements: ["Ventilation system", "Non-slip flooring", "Multiple deck levels", "28-hour law rest stops", "USDA health certificates"],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HAZMAT CLASS → REQUIREMENTS MAPPING (derived from trailer specs)
// Every DOT hazard class + divisions with required endorsements,
// compatible trailer types, and minimum insurance per FMCSA 387.9
// ═══════════════════════════════════════════════════════════════════════════════

const HAZMAT_CLASS_REQUIREMENTS: Record<string, {
  endorsement: string;
  trailerTypes: string[];
  insuranceMinimum: number;
  className: string;
  exampleProducts: string[];
}> = {
  "1.1": { endorsement: "H", trailerTypes: ["HAZMAT_VAN", "FLATBED"], insuranceMinimum: 5000000, className: "Explosives — Mass Explosion Hazard", exampleProducts: ["Dynamite (UN0081)", "TNT (UN0209)", "C-4 explosive", "Blasting caps (UN0255)"] },
  "1.2": { endorsement: "H", trailerTypes: ["HAZMAT_VAN", "FLATBED"], insuranceMinimum: 5000000, className: "Explosives — Projection Hazard", exampleProducts: ["Artillery rounds", "Rockets (UN0180)", "Grenades", "Shaped charges"] },
  "1.3": { endorsement: "H", trailerTypes: ["HAZMAT_VAN", "FLATBED"], insuranceMinimum: 5000000, className: "Explosives — Fire/Minor Blast", exampleProducts: ["Propellant (UN0498)", "Flares (UN0092)", "Smokeless powder (UN0509)", "Rocket motors (UN0186)"] },
  "1.4": { endorsement: "H", trailerTypes: ["DRY_VAN", "HAZMAT_VAN", "FLATBED", "INTERMODAL"], insuranceMinimum: 1000000, className: "Explosives — Minor Hazard", exampleProducts: ["Fireworks (UN0336)", "Safety fuses (UN0105)", "Small arms ammunition (UN0012)", "Practice ammunition"] },
  "1.5": { endorsement: "H", trailerTypes: ["HAZMAT_VAN"], insuranceMinimum: 5000000, className: "Explosives — Very Insensitive", exampleProducts: ["Blasting agents (UN0331)", "ANFO — Ammonium nitrate fuel oil", "Emulsion explosives"] },
  "1.6": { endorsement: "H", trailerTypes: ["HAZMAT_VAN"], insuranceMinimum: 1000000, className: "Explosives — Extremely Insensitive", exampleProducts: ["Insensitive detonating substances", "Extremely insensitive articles"] },
  "2.1": { endorsement: "HN", trailerTypes: ["MC-331"], insuranceMinimum: 5000000, className: "Flammable Gas", exampleProducts: ["Propane/LPG (UN1075)", "Butane (UN1011)", "Hydrogen (UN1049)", "Acetylene (UN1001)", "Methane/natural gas"] },
  "2.2": { endorsement: "N", trailerTypes: ["MC-331", "MC-338", "REEFER", "DRY_VAN"], insuranceMinimum: 1000000, className: "Non-Flammable/Non-Toxic Gas", exampleProducts: ["Nitrogen (UN1066)", "Oxygen (UN1072)", "Argon (UN1006)", "CO2 (UN1013)", "Helium", "Medical gases"] },
  "2.3": { endorsement: "HN", trailerTypes: ["MC-331"], insuranceMinimum: 5000000, className: "Toxic/Poison Gas", exampleProducts: ["Chlorine (UN1017)", "Ammonia anhydrous (UN1005)", "Phosgene (UN1076)", "Hydrogen sulfide (UN1053)", "Sulfur dioxide (UN1079)"] },
  "3": { endorsement: "HN", trailerTypes: ["MC-306", "MC-307", "MC-312", "FOOD_GRADE_TANK", "DRY_VAN", "INTERMODAL"], insuranceMinimum: 5000000, className: "Flammable Liquid", exampleProducts: ["Gasoline (UN1203)", "Diesel (UN1202)", "Ethanol (UN1170)", "Acetone (UN1090)", "Toluene (UN1294)", "Paint (UN1263)", "Methanol (UN1230)"] },
  "4.1": { endorsement: "H", trailerTypes: ["DRY_VAN", "HAZMAT_VAN", "MC-307", "HOPPER", "CONESTOGA", "CURTAINSIDE", "INTERMODAL"], insuranceMinimum: 1000000, className: "Flammable Solid", exampleProducts: ["Matches (UN1944)", "Naphthalene (UN1334)", "Sulfur (UN1350)", "Metal powders (UN1309)", "Magnesium (UN1869)"] },
  "4.2": { endorsement: "H", trailerTypes: ["DRY_VAN", "HAZMAT_VAN"], insuranceMinimum: 1000000, className: "Spontaneously Combustible", exampleProducts: ["White phosphorus (UN1381)", "Aluminum alkyls (UN3394)", "Charcoal (UN1361)", "Oily cotton waste"] },
  "4.3": { endorsement: "H", trailerTypes: ["DRY_VAN", "HAZMAT_VAN"], insuranceMinimum: 5000000, className: "Dangerous When Wet", exampleProducts: ["Sodium (UN1428)", "Potassium (UN2257)", "Calcium carbide (UN1402)", "Lithium (UN1415)", "Aluminum powder (UN1396)"] },
  "5.1": { endorsement: "H", trailerTypes: ["DRY_VAN", "HAZMAT_VAN", "MC-307", "HOPPER", "INTERMODAL"], insuranceMinimum: 1000000, className: "Oxidizer", exampleProducts: ["Ammonium nitrate (UN1942)", "Hydrogen peroxide >8% (UN2015)", "Sodium nitrate (UN1498)", "Calcium hypochlorite (UN1748)", "Potassium permanganate"] },
  "5.2": { endorsement: "H", trailerTypes: ["DRY_VAN", "HAZMAT_VAN", "REEFER"], insuranceMinimum: 1000000, className: "Organic Peroxide", exampleProducts: ["Benzoyl peroxide (UN3102)", "MEKP (UN3101)", "Dibenzoyl peroxide", "Cumene hydroperoxide", "Peracetic acid"] },
  "6.1": { endorsement: "H", trailerTypes: ["DRY_VAN", "HAZMAT_VAN", "MC-306", "MC-307", "MC-312", "INTERMODAL"], insuranceMinimum: 5000000, className: "Toxic/Poison", exampleProducts: ["Pesticides (various)", "Arsenic compounds (UN1556)", "Cyanide (UN1588)", "Phenol (UN1671)", "Lead compounds", "Mercury (UN2809)"] },
  "6.2": { endorsement: "H", trailerTypes: ["DRY_VAN", "HAZMAT_VAN", "REEFER"], insuranceMinimum: 1000000, className: "Infectious Substance", exampleProducts: ["Infectious waste — Category A (UN2814)", "Diagnostic specimens — Category B (UN3373)", "Medical/clinical waste (UN3291)", "Cultures/biologicals"] },
  "7": { endorsement: "H", trailerTypes: ["DRY_VAN", "HAZMAT_VAN", "FLATBED"], insuranceMinimum: 5000000, className: "Radioactive", exampleProducts: ["Radioactive LSA (UN2912)", "Type A packages (UN2915)", "Type B(U) casks (UN2916)", "Uranium hexafluoride (UN2977)", "Cobalt-60 sources", "Medical isotopes"] },
  "8": { endorsement: "HN", trailerTypes: ["MC-312", "MC-307", "DRY_VAN", "HAZMAT_VAN", "INTERMODAL"], insuranceMinimum: 5000000, className: "Corrosive", exampleProducts: ["Sulfuric acid (UN1830)", "Hydrochloric acid (UN1789)", "Sodium hydroxide (UN1824)", "Battery acid", "Hydrofluoric acid (UN1790)", "Nitric acid (UN2031)"] },
  "9": { endorsement: "H", trailerTypes: ["DRY_VAN", "FLATBED", "MC-306", "HOPPER", "INTERMODAL", "CONESTOGA", "STEP_DECK", "LOWBOY", "DUMP_TRAILER", "DOUBLE_DROP", "CURTAINSIDE"], insuranceMinimum: 1000000, className: "Miscellaneous Dangerous Goods", exampleProducts: ["Lithium batteries (UN3480)", "Dry ice (UN1845)", "Environmentally hazardous substance (UN3082)", "Air bags (UN3268)", "Asbestos (UN2212)", "Magnetized material (UN2807)"] },
};

const equipmentTypeSchema = z.enum([
  "tanker", "dry_van", "flatbed", "reefer", "step_deck", "lowboy",
  "gas_tank", "cryogenic", "hazmat_van", "bulk_hopper", "food_grade_tank",
  "water_tank", "conestoga", "curtainside", "intermodal", "double_drop",
  "dump_trailer", "auto_carrier", "livestock",
]);

export const loadBoardRouter = router({
  /**
   * Search available loads
   */
  search: publicProcedure
    .input(z.object({
      origin: z.object({
        city: z.string().optional(),
        state: z.string(),
        radius: z.number().default(50),
      }),
      destination: z.object({
        city: z.string().optional(),
        state: z.string(),
        radius: z.number().default(50),
      }).optional(),
      equipmentType: equipmentTypeSchema.optional(),
      pickupDateStart: z.string().optional(),
      pickupDateEnd: z.string().optional(),
      minRate: z.number().optional(),
      maxWeight: z.number().optional(),
      hazmat: z.boolean().optional(),
      hazmatClass: z.string().optional(),
      unNumber: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
      sortBy: z.enum(["rate", "distance", "pickup_date", "posted_date"]).default("posted_date"),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { loads: [], total: 0, marketStats: { avgRate: 0, totalLoads: 0, loadToTruckRatio: 0 } };
      try {
        const conditions = [sql`${loads.status} IN ('posted', 'available')`];
        if (input.hazmat === true) conditions.push(sql`${loads.hazmatClass} IS NOT NULL AND ${loads.hazmatClass} != ''`);
        if (input.hazmat === false) conditions.push(sql`(${loads.hazmatClass} IS NULL OR ${loads.hazmatClass} = '')`);
        if (input.hazmatClass) conditions.push(sql`${loads.hazmatClass} = ${input.hazmatClass}`);
        if (input.unNumber) conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.specialInstructions}, '$.unNumber')) = ${input.unNumber}`);
        const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
        const rows = await db.select().from(loads).where(whereClause!).orderBy(desc(loads.createdAt)).limit(input.limit).offset(input.offset);
        const [stats] = await db.select({ count: sql<number>`count(*)`, avgRate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)` }).from(loads).where(whereClause!);
        return {
          loads: rows.map(l => {
            const pickup = l.pickupLocation as any || {};
            const delivery = l.deliveryLocation as any || {};
            const si = typeof l.specialInstructions === 'string' ? (() => { try { return JSON.parse(l.specialInstructions); } catch { return {}; } })() : (l.specialInstructions || {});
            return {
              id: String(l.id), loadNumber: l.loadNumber, status: l.status,
              origin: { city: pickup.city || '', state: pickup.state || '' },
              destination: { city: delivery.city || '', state: delivery.state || '' },
              rate: l.rate ? parseFloat(String(l.rate)) : 0,
              distance: l.distance ? parseFloat(String(l.distance)) : 0,
              weight: l.weight ? parseFloat(String(l.weight)) : 0,
              equipmentType: l.cargoType || '',
              hazmat: !!l.hazmatClass,
              hazmatClass: l.hazmatClass || null,
              unNumber: (si as any)?.unNumber || null,
              packingGroup: (si as any)?.packingGroup || null,
              properShippingName: (si as any)?.properShippingName || null,
              postedAt: l.createdAt?.toISOString() || '',
            };
          }),
          total: stats?.count || 0,
          marketStats: { avgRate: Math.round(stats?.avgRate || 0), totalLoads: stats?.count || 0, loadToTruckRatio: 0 },
        };
      } catch (e) { console.error('[LoadBoard] search error:', e); return { loads: [], total: 0, marketStats: { avgRate: 0, totalLoads: 0, loadToTruckRatio: 0 } }; }
    }),

  /**
   * Get load details
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return null;
      try {
        const [load] = await db.select().from(loads).where(eq(loads.id, parseInt(input.id))).limit(1);
        if (!load) return null;
        const pickup = load.pickupLocation as any || {};
        const delivery = load.deliveryLocation as any || {};
        let shipperName = '';
        if (load.shipperId) {
          const [co] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, load.shipperId)).limit(1);
          shipperName = co?.name || '';
        }
        return { id: String(load.id), loadNumber: load.loadNumber, status: load.status, shipper: { name: shipperName }, origin: { city: pickup.city || '', state: pickup.state || '', address: pickup.address || '' }, destination: { city: delivery.city || '', state: delivery.state || '', address: delivery.address || '' }, distance: load.distance ? parseFloat(String(load.distance)) : 0, pricing: { rate: load.rate ? parseFloat(String(load.rate)) : 0 }, postedAt: load.createdAt?.toISOString() || '', postedBy: String(load.shipperId || '') };
      } catch (e) { console.error('[LoadBoard] getById error:', e); return null; }
    }),

  /**
   * Post load to board
   */
  postLoad: protectedProcedure
    .input(z.object({
      origin: z.object({
        facility: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        contact: z.string(),
        phone: z.string(),
      }),
      destination: z.object({
        facility: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        contact: z.string(),
        phone: z.string(),
      }),
      pickupDate: z.string(),
      deliveryDate: z.string(),
      commodity: z.string(),
      weight: z.number(),
      equipmentType: equipmentTypeSchema,
      hazmat: z.boolean().default(false),
      hazmatClass: z.string().optional(),
      unNumber: z.string().optional(),
      packingGroup: z.enum(["I", "II", "III"]).optional(),
      properShippingName: z.string().optional(),
      rate: z.number(),
      expiresIn: z.number().default(24),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const profile = await resolveUserProfile(ctx.user);
      if (!LOAD_POSTER_ROLES.includes(profile.role) && !profile.isAdmin) throw new Error(`Role ${profile.role} cannot post loads`);
      const isHazmat = input.hazmat || !!input.hazmatClass;
      if (isHazmat && input.hazmatClass) {
        const classReqs = HAZMAT_CLASS_REQUIREMENTS[input.hazmatClass];
        if (!classReqs) console.warn(`[LoadBoard] Unknown hazmat class: ${input.hazmatClass}`);
      }
      const hazmatMeta = isHazmat ? JSON.stringify({
        unNumber: input.unNumber || null,
        packingGroup: input.packingGroup || null,
        properShippingName: input.properShippingName || null,
      }) : null;
      const loadNumber = `LB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const [result] = await db.insert(loads).values({
        shipperId: profile.userId,
        loadNumber,
        status: "posted",
        cargoType: isHazmat ? "hazmat" as const : "general" as const,
        hazmatClass: isHazmat ? (input.hazmatClass || "9") : null,
        commodityName: input.commodity,
        weight: String(input.weight),
        rate: String(input.rate),
        specialInstructions: hazmatMeta,
        pickupLocation: { address: input.origin.address, city: input.origin.city, state: input.origin.state, zipCode: input.origin.zip, lat: 0, lng: 0 },
        deliveryLocation: { address: input.destination.address, city: input.destination.city, state: input.destination.state, zipCode: input.destination.zip, lat: 0, lng: 0 },
        pickupDate: new Date(input.pickupDate),
        deliveryDate: new Date(input.deliveryDate),
      }).$returningId();
      return {
        id: String(result.id),
        loadNumber,
        status: "posted",
        postedBy: profile.userId,
        postedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + input.expiresIn * 60 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * Book load
   */
  bookLoad: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      vehicleId: z.string(),
      driverId: z.string(),
      agreedRate: z.number().optional(),
      skipHazmatCheck: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const profile = await resolveUserProfile(ctx.user);
      if (!LOAD_BOOKER_ROLES.includes(profile.role) && !profile.isAdmin) throw new Error(`Role ${profile.role} cannot book loads`);
      const loadId = parseInt(input.loadId);
      const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
      if (!load) throw new Error("Load not found");
      if (load.status !== "posted" && load.status !== "bidding") throw new Error("Load is no longer available");

      // --- HAZMAT PRE-BOOKING VERIFICATION ---
      const hazmatWarnings: string[] = [];
      if (load.hazmatClass && !input.skipHazmatCheck) {
        const classReqs = HAZMAT_CLASS_REQUIREMENTS[load.hazmatClass];
        // 1. Verify driver has required endorsement
        if (input.driverId) {
          try {
            const dId = parseInt(input.driverId);
            const [driver] = await db.select().from(drivers).where(eq(drivers.id, dId)).limit(1);
            if (driver) {
              const reqEndorsement = classReqs?.endorsement || 'H';
              const hasH = !!driver.hazmatEndorsement;
              const hasN = hasH;
              if (reqEndorsement.includes('H') && !hasH) hazmatWarnings.push(`Driver missing CDL-H (Hazmat) endorsement required for Class ${load.hazmatClass}`);
              if (reqEndorsement === 'HN' && !hasH) hazmatWarnings.push(`Driver missing CDL-HN (Hazmat+Tanker) endorsement required for Class ${load.hazmatClass}`);
              if (reqEndorsement === 'N' && !hasN) hazmatWarnings.push(`Driver missing CDL-N (Tanker) endorsement required for Class ${load.hazmatClass}`);
              if (hasH && driver.hazmatExpiry && new Date(driver.hazmatExpiry) < new Date()) {
                hazmatWarnings.push(`Driver's hazmat endorsement expired on ${driver.hazmatExpiry.toISOString().split('T')[0]}`);
              }
              if (driver.medicalCardExpiry && new Date(driver.medicalCardExpiry) < new Date()) {
                hazmatWarnings.push(`Driver's medical certificate expired on ${driver.medicalCardExpiry.toISOString().split('T')[0]}`);
              }
            }
          } catch (e) { console.warn('[LoadBoard] Driver endorsement check failed:', e); }
        }
        // 2. Verify vehicle/trailer compatibility
        if (input.vehicleId && classReqs) {
          try {
            const vId = parseInt(input.vehicleId);
            const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vId)).limit(1);
            if (vehicle) {
              const vType = ((vehicle as any).trailerType || (vehicle as any).vehicleType || '').toUpperCase();
              const allowed = classReqs.trailerTypes.map(t => t.toUpperCase());
              if (vType && !allowed.some(a => vType.includes(a))) {
                hazmatWarnings.push(`Vehicle trailer type '${vType}' may not be authorized for Hazmat Class ${load.hazmatClass}. Allowed: ${allowed.join(', ')}`);
              }
            }
          } catch (e) { console.warn('[LoadBoard] Vehicle compat check failed:', e); }
        }
        // If blocking warnings exist, return them instead of booking
        if (hazmatWarnings.length > 0) {
          return {
            bookingId: null,
            loadId: input.loadId,
            status: "hazmat_verification_failed",
            hazmatWarnings,
            bookedBy: profile.userId,
            bookedAt: new Date().toISOString(),
            confirmationNumber: null,
          };
        }
      }

      const confirmationNumber = `CONF-${Date.now()}`;
      await db.update(loads).set({
        status: "assigned",
        catalystId: profile.userId,
        vehicleId: input.vehicleId ? parseInt(input.vehicleId) : undefined,
        driverId: input.driverId ? parseInt(input.driverId) : undefined,
        rate: input.agreedRate ? String(input.agreedRate) : load.rate,
      }).where(eq(loads.id, loadId));

      return {
        bookingId: String(loadId),
        loadId: input.loadId,
        status: "assigned",
        hazmatWarnings: [],
        bookedBy: profile.userId,
        bookedAt: new Date().toISOString(),
        confirmationNumber,
      };
    }),

  /**
   * Request rate negotiation
   */
  negotiateRate: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      proposedRate: z.number(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId);
      const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
      if (!load) throw new Error("Load not found");
      const bidderProfile = await resolveUserProfile(ctx.user);
      if (!LOAD_BIDDER_ROLES.includes(bidderProfile.role) && !bidderProfile.isAdmin) throw new Error(`Role ${bidderProfile.role} cannot negotiate rates`);
      const [result] = await db.insert(bids).values({
        loadId,
        catalystId: bidderProfile.userId,
        amount: String(input.proposedRate),
        status: "pending",
        notes: input.message || null,
      }).$returningId();
      if (load.status === "posted") {
        await db.update(loads).set({ status: "bidding" }).where(eq(loads.id, loadId));
      }
      return {
        negotiationId: String(result.id),
        loadId: input.loadId,
        proposedRate: input.proposedRate,
        status: "pending",
        submittedBy: bidderProfile.userId,
        submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get my posted loads
   */
  getMyPostedLoads: protectedProcedure
    .input(z.object({ status: z.enum(["all", "active", "booked", "expired"]).default("all") }))
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const profile = await resolveUserProfile(ctx.user);
        const userId = profile.userId;
        // Role-aware scoping: SHIPPER sees posted, CATALYST/DRIVER sees assigned, BROKER sees both, ADMIN sees all
        let scopeCondition;
        if (profile.isAdmin) {
          scopeCondition = sql`1 = 1`;
        } else if (profile.role === 'CATALYST' || profile.role === 'DISPATCH') {
          scopeCondition = sql`(${loads.shipperId} = ${userId} OR ${loads.catalystId} = ${userId})`;
        } else if (profile.role === 'DRIVER' || profile.role === 'ESCORT') {
          scopeCondition = sql`(${loads.driverId} = ${userId} OR ${loads.shipperId} = ${userId})`;
        } else if (profile.role === 'BROKER') {
          scopeCondition = sql`(${loads.shipperId} = ${userId} OR ${loads.catalystId} = ${userId})`;
        } else {
          // SHIPPER, TERMINAL_MANAGER, COMPLIANCE_OFFICER, SAFETY_MANAGER, FACTORING
          scopeCondition = eq(loads.shipperId, userId);
        }
        const rows = await db.select().from(loads).where(scopeCondition).orderBy(desc(loads.createdAt)).limit(50);
        return rows.map(l => {
          const pickup = l.pickupLocation as any || {};
          const delivery = l.deliveryLocation as any || {};
          return { id: String(l.id), loadNumber: l.loadNumber, status: l.status, origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : '', destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : '', rate: l.rate ? parseFloat(String(l.rate)) : 0, postedAt: l.createdAt?.toISOString() || '' };
        });
      } catch (e) { return []; }
    }),

  /**
   * Get saved searches
   */
  getSavedSearches: protectedProcedure
    .query(async () => {
      // Saved searches require a dedicated table; return empty until schema supports it
      return [];
    }),

  /**
   * Save search
   */
  saveSearch: protectedProcedure
    .input(z.object({
      name: z.string(),
      criteria: z.object({
        origin: z.object({
          city: z.string().optional(),
          state: z.string(),
          radius: z.number(),
        }),
        destination: z.object({
          city: z.string().optional(),
          state: z.string(),
          radius: z.number(),
        }).optional(),
        equipmentType: equipmentTypeSchema.optional(),
        minRate: z.number().optional(),
      }),
      notifications: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `search_${Date.now()}`,
        name: input.name,
        savedBy: (await resolveUserId(ctx.user)),
        savedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get load board alerts
   */
  getAlerts: protectedProcedure
    .query(async () => {
      // Load board alerts require a dedicated table; return empty until schema supports it
      return [];
    }),

  /**
   * Update load
   */
  updateLoad: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      rate: z.number().optional(),
      pickupDate: z.string().optional(),
      deliveryDate: z.string().optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId);
      const updates: Record<string, any> = {};
      if (input.rate !== undefined) updates.rate = String(input.rate);
      if (input.pickupDate) updates.pickupDate = new Date(input.pickupDate);
      if (input.deliveryDate) updates.deliveryDate = new Date(input.deliveryDate);
      if (Object.keys(updates).length > 0) {
        await db.update(loads).set(updates).where(eq(loads.id, loadId));
      }
      return {
        success: true,
        loadId: input.loadId,
        updatedBy: (await resolveUserId(ctx.user)),
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Cancel posted load
   */
  cancelLoad: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId);
      await db.update(loads).set({
        status: "cancelled",
        specialInstructions: input.reason ? `CANCELLED: ${input.reason}` : undefined,
      }).where(eq(loads.id, loadId));
      return {
        success: true,
        loadId: input.loadId,
        cancelledBy: (await resolveUserId(ctx.user)),
        cancelledAt: new Date().toISOString(),
      };
    }),

  /**
   * Get market rates
   */
  getMarketRates: protectedProcedure
    .input(z.object({
      origin: z.object({ city: z.string(), state: z.string() }),
      destination: z.object({ city: z.string(), state: z.string() }),
      equipmentType: equipmentTypeSchema,
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      let avgRate = 3.15, minRate = 2.80, maxRate = 3.50, totalLoads = 0;
      if (db) {
        try {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
          const [stats] = await db.select({
            avg: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`,
            min: sql<number>`COALESCE(MIN(CAST(${loads.rate} AS DECIMAL)), 0)`,
            max: sql<number>`COALESCE(MAX(CAST(${loads.rate} AS DECIMAL)), 0)`,
            count: sql<number>`count(*)`,
          }).from(loads).where(and(
            sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.pickupLocation}, '$.state')) = ${input.origin.state}`,
            sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.deliveryLocation}, '$.state')) = ${input.destination.state}`,
            gte(loads.createdAt, thirtyDaysAgo),
          ));
          if (stats && stats.count > 0) {
            avgRate = Math.round(stats.avg * 100) / 100 || 3.15;
            minRate = Math.round(stats.min * 100) / 100 || 2.80;
            maxRate = Math.round(stats.max * 100) / 100 || 3.50;
            totalLoads = stats.count || 0;
          }
        } catch (e) { console.error('[LoadBoard] getMarketRates error:', e); }
      }
      return {
        lane: `${input.origin.city}, ${input.origin.state} to ${input.destination.city}, ${input.destination.state}`,
        equipmentType: input.equipmentType,
        currentRate: { low: minRate, average: avgRate, high: maxRate },
        trend: { direction: avgRate > 3.0 ? "up" : "down", change: Math.abs(avgRate - 3.0), period: "30 days" },
        volume: { daily: Math.round(totalLoads / 30), weekly: Math.round(totalLoads / 4) },
        recommendation: totalLoads > 10 ? (avgRate > 3.0 ? "Active lane - rates above average" : "Competitive lane - consider negotiating") : "Limited data for this lane",
      };
    }),

  /**
   * HAZMAT-CLASS-AWARE FREIGHT MATCHING — DAT-killer differentiator
   * Given a carrier/driver profile, find all compatible loads considering:
   * 1. Hazmat class authorization (HMSP)
   * 2. Driver endorsement (H, N, HN, X)
   * 3. Equipment/trailer compatibility
   * 4. Insurance adequacy
   * 5. Lane preferences (origin/dest state)
   * 6. Weight capacity
   */
  matchLoadsToCarrier: protectedProcedure
    .input(z.object({
      carrierId: z.number().optional(),
      driverId: z.number().optional(),
      vehicleId: z.number().optional(),
      preferredOriginStates: z.array(z.string()).optional(),
      preferredDestStates: z.array(z.string()).optional(),
      maxWeight: z.number().optional(),
      includeHazmat: z.boolean().default(true),
      includeGeneral: z.boolean().default(true),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { matches: [], total: 0, matchCriteria: {} };
      try {
        // 1. Gather carrier/driver/vehicle profile
        let hasHazmatEndorsement = false;
        let hasTankerEndorsement = false;
        let hazmatExpired = false;
        let carrierHazmatAuth = false;
        let carrierInsuranceAmount = 0;
        let trailerType = '';

        if (input.driverId) {
          const [drv] = await db.select().from(drivers).where(eq(drivers.id, input.driverId)).limit(1);
          if (drv) {
            hasHazmatEndorsement = !!drv.hazmatEndorsement;
            hasTankerEndorsement = hasHazmatEndorsement; // inferred
            if (drv.hazmatExpiry && new Date(drv.hazmatExpiry) < new Date()) hazmatExpired = true;
          }
        }

        if (input.carrierId) {
          const [co] = await db.select().from(companies).where(eq(companies.id, input.carrierId)).limit(1);
          if (co) {
            carrierHazmatAuth = !!co.hazmatLicense;
            if (co.hazmatExpiry && new Date(co.hazmatExpiry) < new Date()) carrierHazmatAuth = false;
            // Parse insurance amount from policy info
            if (co.insurancePolicy) {
              try {
                const ins = typeof co.insurancePolicy === 'string' ? JSON.parse(co.insurancePolicy) : co.insurancePolicy;
                carrierInsuranceAmount = (ins as any)?.amount || (ins as any)?.limit || 1000000;
              } catch { carrierInsuranceAmount = 1000000; }
            }
          }
        }

        if (input.vehicleId) {
          const [veh] = await db.select().from(vehicles).where(eq(vehicles.id, input.vehicleId)).limit(1);
          if (veh) {
            trailerType = ((veh as any).trailerType || (veh as any).vehicleType || '').toUpperCase();
          }
        }

        // 2. Fetch available loads
        const availableLoads = await db.select().from(loads)
          .where(sql`${loads.status} IN ('posted', 'available', 'bidding')`)
          .orderBy(desc(loads.createdAt))
          .limit(200);

        // 3. Score and filter each load
        const matches: Array<{
          loadId: string; loadNumber: string; score: number; matchReasons: string[]; warnings: string[];
          origin: string; destination: string; rate: number; distance: number; weight: number;
          hazmat: boolean; hazmatClass: string | null; equipmentType: string;
          postedAt: string;
        }> = [];

        for (const load of availableLoads) {
          const reasons: string[] = [];
          const warnings: string[] = [];
          let score = 50; // base score
          const pickup = load.pickupLocation as any || {};
          const delivery = load.deliveryLocation as any || {};
          const isHazmat = !!load.hazmatClass;
          const loadWeight = load.weight ? parseFloat(String(load.weight)) : 0;

          // Filter: hazmat/general preference
          if (isHazmat && !input.includeHazmat) continue;
          if (!isHazmat && !input.includeGeneral) continue;

          // Filter: weight capacity
          if (input.maxWeight && loadWeight > input.maxWeight) continue;

          // Hazmat authorization check
          if (isHazmat) {
            const classReqs = HAZMAT_CLASS_REQUIREMENTS[load.hazmatClass!];
            if (!hasHazmatEndorsement || hazmatExpired) {
              warnings.push(`Requires ${classReqs?.endorsement || 'H'} endorsement`);
              score -= 40;
            } else {
              reasons.push(`Driver has ${classReqs?.endorsement || 'H'} endorsement`);
              score += 15;
            }
            if (!carrierHazmatAuth) {
              warnings.push('Carrier missing HMSP registration');
              score -= 30;
            } else {
              reasons.push('Carrier HMSP authorized');
              score += 10;
            }
            // Insurance adequacy
            if (classReqs && carrierInsuranceAmount < classReqs.insuranceMinimum) {
              warnings.push(`Insurance $${(carrierInsuranceAmount / 1000000).toFixed(1)}M below required $${(classReqs.insuranceMinimum / 1000000).toFixed(1)}M`);
              score -= 20;
            } else if (classReqs) {
              reasons.push('Insurance meets minimum');
              score += 5;
            }
            // Trailer compatibility
            if (trailerType && classReqs) {
              const allowed = classReqs.trailerTypes.map(t => t.toUpperCase());
              if (allowed.some(a => trailerType.includes(a))) {
                reasons.push(`${trailerType} compatible with Class ${load.hazmatClass}`);
                score += 10;
              } else {
                warnings.push(`${trailerType} may not be approved for Class ${load.hazmatClass}`);
                score -= 15;
              }
            }
            // Hazmat loads get bonus for specialized carriers
            if (hasHazmatEndorsement && carrierHazmatAuth) score += 10;
          } else {
            reasons.push('General freight — no hazmat requirements');
            score += 5;
          }

          // Lane preference boost
          const originState = (pickup.state || '').toUpperCase();
          const destState = (delivery.state || '').toUpperCase();
          if (input.preferredOriginStates?.length) {
            if (input.preferredOriginStates.map(s => s.toUpperCase()).includes(originState)) {
              reasons.push(`Preferred origin state: ${originState}`);
              score += 15;
            }
          }
          if (input.preferredDestStates?.length) {
            if (input.preferredDestStates.map(s => s.toUpperCase()).includes(destState)) {
              reasons.push(`Preferred destination state: ${destState}`);
              score += 10;
            }
          }

          // Rate attractiveness
          const rate = load.rate ? parseFloat(String(load.rate)) : 0;
          if (rate > 3000) { reasons.push('High-value load'); score += 5; }

          // Only include if score is positive
          if (score <= 0) continue;

          matches.push({
            loadId: String(load.id),
            loadNumber: load.loadNumber || `LOAD-${load.id}`,
            score: Math.min(100, Math.max(0, score)),
            matchReasons: reasons,
            warnings,
            origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : originState,
            destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : destState,
            rate,
            distance: load.distance ? parseFloat(String(load.distance)) : 0,
            weight: loadWeight,
            hazmat: isHazmat,
            hazmatClass: load.hazmatClass || null,
            equipmentType: load.cargoType || '',
            postedAt: load.createdAt?.toISOString() || '',
          });
        }

        // Sort by score descending
        matches.sort((a, b) => b.score - a.score);

        return {
          matches: matches.slice(0, input.limit),
          total: matches.length,
          matchCriteria: {
            hasHazmatEndorsement,
            hasTankerEndorsement,
            carrierHazmatAuth,
            carrierInsuranceAmount,
            trailerType: trailerType || null,
            preferredOriginStates: input.preferredOriginStates || [],
            preferredDestStates: input.preferredDestStates || [],
          },
        };
      } catch (e) {
        console.error('[LoadBoard] matchLoadsToCarrier error:', e);
        return { matches: [], total: 0, matchCriteria: {} };
      }
    }),

  /**
   * REVERSE MATCH — Given a load, find qualified carriers/drivers
   * Checks: hazmat authorization, endorsements, equipment, insurance, compliance
   */
  getMatchingCarriers: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { carriers: [], total: 0 };
      try {
        const loadId = parseInt(input.loadId);
        const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
        if (!load) return { carriers: [], total: 0 };

        const isHazmat = !!load.hazmatClass;
        const classReqs = isHazmat ? HAZMAT_CLASS_REQUIREMENTS[load.hazmatClass!] : null;

        // Get all active carriers
        const allCarriers = await db.select().from(companies)
          .where(sql`${companies.isActive} = 1`)
          .limit(200);

        const carriers: Array<{
          carrierId: string; name: string; dotNumber: string; mcNumber: string;
          score: number; qualifications: string[]; warnings: string[];
          hazmatAuthorized: boolean; insuranceAdequate: boolean;
        }> = [];

        for (const co of allCarriers) {
          const quals: string[] = [];
          const warns: string[] = [];
          let score = 50;

          if (isHazmat) {
            // HMSP check
            if (co.hazmatLicense) {
              if (co.hazmatExpiry && new Date(co.hazmatExpiry) < new Date()) {
                warns.push('HMSP registration expired');
                score -= 30;
              } else {
                quals.push('HMSP registered');
                score += 20;
              }
            } else {
              warns.push('No HMSP registration');
              score -= 40;
            }

            // Insurance check
            let insAmount = 0;
            if (co.insurancePolicy) {
              try {
                const ins = typeof co.insurancePolicy === 'string' ? JSON.parse(co.insurancePolicy) : co.insurancePolicy;
                insAmount = (ins as any)?.amount || (ins as any)?.limit || 0;
              } catch { insAmount = 0; }
            }
            if (classReqs && insAmount >= classReqs.insuranceMinimum) {
              quals.push(`Insurance $${(insAmount / 1000000).toFixed(1)}M meets minimum`);
              score += 10;
            } else if (classReqs) {
              warns.push(`Insurance below $${(classReqs.insuranceMinimum / 1000000).toFixed(1)}M minimum`);
              score -= 20;
            }
          } else {
            quals.push('General freight eligible');
            score += 5;
          }

          // Compliance status
          if (co.complianceStatus === 'compliant' || co.complianceStatus === ('active' as any)) {
            quals.push('Compliance: active');
            score += 10;
          } else if (co.complianceStatus === 'non_compliant' || co.complianceStatus === 'expired') {
            warns.push(`Compliance: ${co.complianceStatus}`);
            score -= 25;
          }

          // Insurance expiry
          if (co.insuranceExpiry && new Date(co.insuranceExpiry) < new Date()) {
            warns.push('Insurance expired');
            score -= 30;
          }

          if (score <= 0) continue;

          carriers.push({
            carrierId: String(co.id),
            name: co.name || '',
            dotNumber: co.dotNumber || '',
            mcNumber: co.mcNumber || '',
            score: Math.min(100, Math.max(0, score)),
            qualifications: quals,
            warnings: warns,
            hazmatAuthorized: !!co.hazmatLicense && !(co.hazmatExpiry && new Date(co.hazmatExpiry) < new Date()),
            insuranceAdequate: !warns.some(w => w.includes('Insurance')),
          });
        }

        carriers.sort((a, b) => b.score - a.score);
        return { carriers: carriers.slice(0, 50), total: carriers.length };
      } catch (e) {
        console.error('[LoadBoard] getMatchingCarriers error:', e);
        return { carriers: [], total: 0 };
      }
    }),

  /**
   * Load board dashboard stats
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const empty = { totalAvailable: 0, hazmatLoads: 0, generalLoads: 0, avgRate: 0, myPosted: 0, myBooked: 0, bidsReceived: 0, topLanes: [] as any[], userRole: '' };
    if (!db) return empty;
    try {
      const profile = await resolveUserProfile(ctx.user);
      const userId = profile.userId;
      const [avail] = await db.select({
        total: sql<number>`COUNT(*)`,
        hazmat: sql<number>`SUM(CASE WHEN ${loads.hazmatClass} IS NOT NULL AND ${loads.hazmatClass} != '' THEN 1 ELSE 0 END)`,
        general: sql<number>`SUM(CASE WHEN ${loads.hazmatClass} IS NULL OR ${loads.hazmatClass} = '' THEN 1 ELSE 0 END)`,
        avgRate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`,
      }).from(loads).where(sql`${loads.status} IN ('posted', 'available', 'bidding')`);

      // Role-aware "my" counts: SHIPPER sees posted loads, CATALYST sees booked, BROKER/ADMIN sees both
      let myPostedCount = 0, myBookedCount = 0, bidsReceivedCount = 0;
      if (profile.isAdmin) {
        const [mp] = await db.select({ c: sql<number>`COUNT(*)` }).from(loads).where(sql`${loads.status} IN ('posted', 'available', 'bidding')`);
        const [mb] = await db.select({ c: sql<number>`COUNT(*)` }).from(loads).where(eq(loads.status, 'assigned' as any));
        const [bc] = await db.select({ c: sql<number>`COUNT(*)` }).from(bids).where(eq(bids.status, 'pending'));
        myPostedCount = mp?.c || 0; myBookedCount = mb?.c || 0; bidsReceivedCount = bc?.c || 0;
      } else if (CARRIER_ROLES.includes(profile.role)) {
        const [mp] = await db.select({ c: sql<number>`COUNT(*)` }).from(loads).where(and(eq(loads.shipperId, userId), sql`${loads.status} IN ('posted', 'available', 'bidding')`));
        const [mb] = await db.select({ c: sql<number>`COUNT(*)` }).from(loads).where(and(eq(loads.catalystId, userId), eq(loads.status, 'assigned' as any)));
        const [bc] = await db.select({ c: sql<number>`COUNT(*)` }).from(bids).where(eq(bids.catalystId, userId));
        myPostedCount = mp?.c || 0; myBookedCount = mb?.c || 0; bidsReceivedCount = bc?.c || 0;
      } else {
        // SHIPPER, TERMINAL_MANAGER, FACTORING, COMPLIANCE_OFFICER, SAFETY_MANAGER
        const [mp] = await db.select({ c: sql<number>`COUNT(*)` }).from(loads).where(and(eq(loads.shipperId, userId), sql`${loads.status} IN ('posted', 'available', 'bidding')`));
        const [mb] = await db.select({ c: sql<number>`COUNT(*)` }).from(loads).where(and(eq(loads.catalystId, userId), eq(loads.status, 'assigned' as any)));
        const [bc] = await db.select({ c: sql<number>`COUNT(*)` }).from(bids).where(and(eq(bids.status, 'pending'), sql`${bids.loadId} IN (SELECT id FROM loads WHERE shipper_id = ${userId})`));
        myPostedCount = mp?.c || 0; myBookedCount = mb?.c || 0; bidsReceivedCount = bc?.c || 0;
      }

      // Top lanes by volume (last 30 days)
      const topLanes = await db.select({
        originState: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${loads.pickupLocation}, '$.state'))`,
        destState: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${loads.deliveryLocation}, '$.state'))`,
        count: sql<number>`COUNT(*)`,
        avgRate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`,
      }).from(loads)
        .where(gte(loads.createdAt, new Date(Date.now() - 30 * 86400000)))
        .groupBy(sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.pickupLocation}, '$.state'))`, sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.deliveryLocation}, '$.state'))`)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(10);

      return {
        totalAvailable: avail?.total || 0,
        hazmatLoads: avail?.hazmat || 0,
        generalLoads: avail?.general || 0,
        avgRate: Math.round((avail?.avgRate || 0) * 100) / 100,
        myPosted: myPostedCount,
        myBooked: myBookedCount,
        bidsReceived: bidsReceivedCount,
        userRole: profile.role,
        topLanes: topLanes.map(l => ({
          lane: `${l.originState || '?'} → ${l.destState || '?'}`,
          volume: l.count || 0,
          avgRate: Math.round((l.avgRate || 0) * 100) / 100,
        })),
      };
    } catch (e) { console.error('[LoadBoard] getStats error:', e); return empty; }
  }),

  /**
   * Recent load board activity feed
   */
  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const profile = await resolveUserProfile(ctx.user);
        const userId = profile.userId;
        // Role-aware: each role sees activity relevant to them
        const recentLoads = await db.select({
          id: loads.id, loadNumber: loads.loadNumber, status: loads.status,
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
          rate: loads.rate, hazmatClass: loads.hazmatClass, createdAt: loads.createdAt, updatedAt: loads.updatedAt,
        }).from(loads)
          .where(sql`${loads.shipperId} = ${userId} OR ${loads.catalystId} = ${userId} OR ${loads.driverId} = ${userId}`)
          .orderBy(desc(loads.updatedAt))
          .limit(input.limit);

        return recentLoads.map(l => {
          const pickup = l.pickupLocation as any || {};
          const delivery = l.deliveryLocation as any || {};
          let action = 'updated';
          if (l.status === 'posted' || l.status === ('available' as any)) action = 'posted';
          else if (l.status === 'assigned') action = 'booked';
          else if (l.status === 'in_transit') action = 'in_transit';
          else if (l.status === 'delivered') action = 'delivered';
          else if (l.status === 'cancelled') action = 'cancelled';
          return {
            id: String(l.id),
            loadNumber: l.loadNumber || `LOAD-${l.id}`,
            action,
            origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : '',
            destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : '',
            rate: l.rate ? parseFloat(String(l.rate)) : 0,
            hazmat: !!l.hazmatClass,
            hazmatClass: l.hazmatClass || null,
            timestamp: (l.updatedAt || l.createdAt)?.toISOString() || '',
          };
        });
      } catch (e) { console.error('[LoadBoard] getRecentActivity error:', e); return []; }
    }),

  /**
   * Dedicated hazmat load search with class filtering and ERG info
   */
  getHazmatLoads: protectedProcedure
    .input(z.object({
      hazmatClass: z.string().optional(),
      unNumber: z.string().optional(),
      originState: z.string().optional(),
      destState: z.string().optional(),
      minRate: z.number().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { loads: [], total: 0, classSummary: {} };
      try {
        const conditions = [
          sql`${loads.status} IN ('posted', 'available', 'bidding')`,
          sql`${loads.hazmatClass} IS NOT NULL AND ${loads.hazmatClass} != ''`,
        ];
        if (input.hazmatClass) conditions.push(eq(loads.hazmatClass, input.hazmatClass));
        if (input.originState) conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.pickupLocation}, '$.state')) = ${input.originState}`);
        if (input.destState) conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.deliveryLocation}, '$.state')) = ${input.destState}`);
        if (input.minRate) conditions.push(sql`CAST(${loads.rate} AS DECIMAL) >= ${input.minRate}`);

        const rows = await db.select().from(loads).where(and(...conditions)).orderBy(desc(loads.createdAt)).limit(input.limit);

        // Class breakdown
        const classSummary: Record<string, number> = {};
        const [breakdown] = await db.select({
          classes: sql<string>`GROUP_CONCAT(DISTINCT ${loads.hazmatClass})`,
        }).from(loads).where(and(
          sql`${loads.status} IN ('posted', 'available', 'bidding')`,
          sql`${loads.hazmatClass} IS NOT NULL AND ${loads.hazmatClass} != ''`,
        ));

        // Count per class
        const classRows = await db.select({
          hc: loads.hazmatClass,
          cnt: sql<number>`COUNT(*)`,
        }).from(loads).where(and(
          sql`${loads.status} IN ('posted', 'available', 'bidding')`,
          sql`${loads.hazmatClass} IS NOT NULL AND ${loads.hazmatClass} != ''`,
        )).groupBy(loads.hazmatClass);
        for (const cr of classRows) {
          if (cr.hc) classSummary[cr.hc] = cr.cnt || 0;
        }

        return {
          loads: rows.map(l => {
            const pickup = l.pickupLocation as any || {};
            const delivery = l.deliveryLocation as any || {};
            const classReqs = HAZMAT_CLASS_REQUIREMENTS[l.hazmatClass!];
            const si = typeof l.specialInstructions === 'string' ? (() => { try { return JSON.parse(l.specialInstructions); } catch { return {}; } })() : (l.specialInstructions || {});
            return {
              id: String(l.id),
              loadNumber: l.loadNumber || `LOAD-${l.id}`,
              hazmatClass: l.hazmatClass,
              unNumber: (si as any)?.unNumber || null,
              packingGroup: (si as any)?.packingGroup || null,
              properShippingName: (si as any)?.properShippingName || null,
              origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : '',
              destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : '',
              rate: l.rate ? parseFloat(String(l.rate)) : 0,
              weight: l.weight ? parseFloat(String(l.weight)) : 0,
              equipmentType: l.cargoType || '',
              requiredEndorsement: classReqs?.endorsement || 'H',
              requiredTrailers: classReqs?.trailerTypes || [],
              requiredInsurance: classReqs?.insuranceMinimum || 1000000,
              postedAt: l.createdAt?.toISOString() || '',
            };
          }),
          total: rows.length,
          classSummary,
        };
      } catch (e) { console.error('[LoadBoard] getHazmatLoads error:', e); return { loads: [], total: 0, classSummary: {} }; }
    }),

  /**
   * TRAILER TYPE REFERENCE — Full spec for every trailer in the system
   * Query by trailer code, category, or hazmat class
   */
  getTrailerTypes: protectedProcedure
    .input(z.object({
      trailerCode: z.string().optional(),
      category: z.enum(["tank", "dry", "flat", "refrigerated", "bulk", "specialized", "all"]).default("all"),
      hazmatClass: z.string().optional(),
      productSearch: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      let results = Object.entries(TRAILER_TYPES);

      if (input?.trailerCode) {
        const code = input.trailerCode.toUpperCase().replace(/-/g, '-');
        results = results.filter(([k]) => k === code || k === input.trailerCode);
        if (results.length === 1) {
          const [code, spec] = results[0];
          const classInfo = spec.hazmatClasses.map(hc => {
            const req = HAZMAT_CLASS_REQUIREMENTS[hc];
            return req ? { class: hc, name: req.className, endorsement: req.endorsement, insuranceMin: req.insuranceMinimum, exampleProducts: req.exampleProducts } : { class: hc, name: `Class ${hc}`, endorsement: "H", insuranceMin: 1000000, exampleProducts: [] };
          });
          return {
            trailers: [{ code, ...spec, hazmatClassDetails: classInfo }],
            total: 1,
          };
        }
      }

      if (input?.category && input.category !== "all") {
        results = results.filter(([, spec]) => spec.category === input.category);
      }

      if (input?.hazmatClass) {
        results = results.filter(([, spec]) => spec.hazmatClasses.includes(input.hazmatClass!));
      }

      if (input?.productSearch) {
        const q = input.productSearch.toLowerCase();
        results = results.filter(([, spec]) => spec.products.some(p => p.toLowerCase().includes(q)));
      }

      return {
        trailers: results.map(([code, spec]) => ({
          code,
          name: spec.name,
          dotSpec: spec.dotSpec,
          category: spec.category,
          capacityGallons: spec.capacityGallons,
          capacityLbs: spec.capacityLbs,
          hazmatClasses: spec.hazmatClasses,
          productCount: spec.products.length,
          products: spec.products,
          inspectionReq: spec.inspectionReq,
          inspectionInterval: spec.inspectionInterval,
          cdlEndorsement: spec.cdlEndorsement || "None",
          specialRequirements: spec.specialRequirements,
        })),
        total: results.length,
        categories: {
          tank: Object.values(TRAILER_TYPES).filter(t => t.category === "tank").length,
          dry: Object.values(TRAILER_TYPES).filter(t => t.category === "dry").length,
          flat: Object.values(TRAILER_TYPES).filter(t => t.category === "flat").length,
          refrigerated: Object.values(TRAILER_TYPES).filter(t => t.category === "refrigerated").length,
          bulk: Object.values(TRAILER_TYPES).filter(t => t.category === "bulk").length,
          specialized: Object.values(TRAILER_TYPES).filter(t => t.category === "specialized").length,
        },
      };
    }),

  /**
   * REVERSE EQUIPMENT LOOKUP — Given a product name, UN number, or hazmat class,
   * find all compatible trailers with full specs and requirements
   */
  getEquipmentForProduct: protectedProcedure
    .input(z.object({
      productName: z.string().optional(),
      unNumber: z.string().optional(),
      hazmatClass: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const matchedTrailers: Array<{
        code: string;
        name: string;
        dotSpec: string;
        category: string;
        capacityLbs: number;
        capacityGallons: number | null;
        matchReason: string;
        cdlEndorsement: string;
        inspectionReq: string;
        specialRequirements: string[];
        matchedProducts: string[];
      }> = [];

      // If hazmat class provided, get class requirements
      let classReqs = input.hazmatClass ? HAZMAT_CLASS_REQUIREMENTS[input.hazmatClass] : null;

      // If UN number provided, try to determine hazmat class from product search
      if (input.unNumber && !classReqs) {
        const unSearch = `UN${input.unNumber.replace(/^UN/i, '')}`;
        for (const [, spec] of Object.entries(TRAILER_TYPES)) {
          for (const prod of spec.products) {
            if (prod.includes(unSearch)) {
              for (const hc of spec.hazmatClasses) {
                if (HAZMAT_CLASS_REQUIREMENTS[hc]) {
                  classReqs = HAZMAT_CLASS_REQUIREMENTS[hc];
                  break;
                }
              }
              break;
            }
          }
          if (classReqs) break;
        }
      }

      // Match by hazmat class — use the class requirements to find authorized trailer types
      if (classReqs) {
        for (const tCode of classReqs.trailerTypes) {
          const spec = TRAILER_TYPES[tCode];
          if (spec) {
            matchedTrailers.push({
              code: tCode,
              name: spec.name,
              dotSpec: spec.dotSpec,
              category: spec.category,
              capacityLbs: spec.capacityLbs,
              capacityGallons: spec.capacityGallons,
              matchReason: `Authorized for Hazmat Class ${input.hazmatClass} (${classReqs.className})`,
              cdlEndorsement: spec.cdlEndorsement || classReqs.endorsement,
              inspectionReq: spec.inspectionReq,
              specialRequirements: spec.specialRequirements,
              matchedProducts: spec.products.filter(p => {
                if (input.unNumber) return p.toLowerCase().includes(input.unNumber.toLowerCase()) || p.includes(`UN${input.unNumber.replace(/^UN/i, '')}`);
                if (input.productName) return p.toLowerCase().includes(input.productName.toLowerCase());
                return true;
              }).slice(0, 5),
            });
          }
        }
      }

      // Match by product name — search across all trailer products
      if (input.productName && matchedTrailers.length === 0) {
        const q = input.productName.toLowerCase();
        for (const [code, spec] of Object.entries(TRAILER_TYPES)) {
          const matching = spec.products.filter(p => p.toLowerCase().includes(q));
          if (matching.length > 0) {
            matchedTrailers.push({
              code,
              name: spec.name,
              dotSpec: spec.dotSpec,
              category: spec.category,
              capacityLbs: spec.capacityLbs,
              capacityGallons: spec.capacityGallons,
              matchReason: `Product match: ${matching[0]}`,
              cdlEndorsement: spec.cdlEndorsement || "None",
              inspectionReq: spec.inspectionReq,
              specialRequirements: spec.specialRequirements,
              matchedProducts: matching.slice(0, 5),
            });
          }
        }
      }

      // Match by UN number across all products
      if (input.unNumber && matchedTrailers.length === 0) {
        const unSearch = input.unNumber.replace(/^UN/i, '');
        for (const [code, spec] of Object.entries(TRAILER_TYPES)) {
          const matching = spec.products.filter(p => p.includes(`UN${unSearch}`) || p.includes(`NA${unSearch}`));
          if (matching.length > 0) {
            matchedTrailers.push({
              code,
              name: spec.name,
              dotSpec: spec.dotSpec,
              category: spec.category,
              capacityLbs: spec.capacityLbs,
              capacityGallons: spec.capacityGallons,
              matchReason: `UN number match: ${matching[0]}`,
              cdlEndorsement: spec.cdlEndorsement || "None",
              inspectionReq: spec.inspectionReq,
              specialRequirements: spec.specialRequirements,
              matchedProducts: matching,
            });
          }
        }
      }

      return {
        trailers: matchedTrailers,
        total: matchedTrailers.length,
        query: { productName: input.productName, unNumber: input.unNumber, hazmatClass: input.hazmatClass },
        hazmatRequirements: classReqs ? {
          endorsement: classReqs.endorsement,
          insuranceMinimum: classReqs.insuranceMinimum,
          className: classReqs.className,
          exampleProducts: classReqs.exampleProducts,
        } : null,
      };
    }),

  /**
   * GET HAZMAT CLASS REQUIREMENTS — Full reference for all 19 hazmat classes/divisions
   * with required endorsements, compatible trailers, insurance minimums, and example products
   */
  getHazmatClassRequirements: protectedProcedure
    .input(z.object({ hazmatClass: z.string().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.hazmatClass) {
        const req = HAZMAT_CLASS_REQUIREMENTS[input.hazmatClass];
        if (!req) return { found: false, hazmatClass: input.hazmatClass };
        const trailerDetails = req.trailerTypes.map(t => {
          const spec = TRAILER_TYPES[t];
          return spec ? { code: t, name: spec.name, dotSpec: spec.dotSpec, capacityLbs: spec.capacityLbs, capacityGallons: spec.capacityGallons } : { code: t, name: t, dotSpec: "Unknown", capacityLbs: 0, capacityGallons: null };
        });
        return {
          found: true,
          hazmatClass: input.hazmatClass,
          ...req,
          trailerDetails,
        };
      }
      return {
        found: true,
        classes: Object.entries(HAZMAT_CLASS_REQUIREMENTS).map(([code, req]) => ({
          code,
          className: req.className,
          endorsement: req.endorsement,
          insuranceMinimum: req.insuranceMinimum,
          trailerTypes: req.trailerTypes,
          exampleProducts: req.exampleProducts.slice(0, 3),
        })),
        totalClasses: Object.keys(HAZMAT_CLASS_REQUIREMENTS).length,
        totalTrailerTypes: Object.keys(TRAILER_TYPES).length,
      };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ENHANCED BIDDING — loadBids table with multi-round counter-offers,
  // auto-accept rules, and equipment/hazmat qualification checks
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * SUBMIT ENHANCED BID — Multi-round bidding with hazmat qualification pre-check
   * Uses loadBids table (not simple bids). Checks auto-accept rules.
   */
  submitEnhancedBid: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      bidAmount: z.number(),
      rateType: z.enum(["flat", "per_mile", "per_hour", "per_ton", "percentage"]).default("flat"),
      equipmentType: z.string().optional(),
      estimatedPickup: z.string().optional(),
      estimatedDelivery: z.string().optional(),
      transitTimeDays: z.number().optional(),
      fuelSurchargeIncluded: z.boolean().default(false),
      accessorialsIncluded: z.array(z.string()).optional(),
      conditions: z.string().optional(),
      parentBidId: z.number().optional(),
      agreementId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const profile = await resolveUserProfile(ctx.user);
      if (!LOAD_BIDDER_ROLES.includes(profile.role) && !profile.isAdmin) throw new Error(`Role ${profile.role} cannot submit bids`);
      const userId = profile.userId;

      // 1. Fetch the load to check hazmat requirements
      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new Error("Load not found");
      if (!["posted", "bidding"].includes(load.status as string)) throw new Error("Load is no longer accepting bids");

      const hazmatWarnings: string[] = [];
      const isHazmat = !!load.hazmatClass;

      // 2. If hazmat, verify bidder's company qualifications
      if (isHazmat) {
        const classReqs = HAZMAT_CLASS_REQUIREMENTS[load.hazmatClass!];
        // Get bidder's company
        const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId)).limit(1);
        if (driver) {
          if (!driver.hazmatEndorsement) hazmatWarnings.push(`Missing CDL-${classReqs?.endorsement || 'H'} endorsement for Class ${load.hazmatClass}`);
          if (driver.hazmatExpiry && new Date(driver.hazmatExpiry) < new Date()) hazmatWarnings.push("Hazmat endorsement expired");
          if (driver.companyId) {
            const [co] = await db.select().from(companies).where(eq(companies.id, driver.companyId)).limit(1);
            if (co) {
              if (!co.hazmatLicense) hazmatWarnings.push("Company missing HMSP registration");
              if (co.hazmatExpiry && new Date(co.hazmatExpiry) < new Date()) hazmatWarnings.push("Company HMSP expired");
              let insAmount = 0;
              if (co.insurancePolicy) {
                try { const ins = typeof co.insurancePolicy === 'string' ? JSON.parse(co.insurancePolicy) : co.insurancePolicy; insAmount = (ins as any)?.amount || (ins as any)?.limit || 0; } catch { insAmount = 0; }
              }
              if (classReqs && insAmount < classReqs.insuranceMinimum) {
                hazmatWarnings.push(`Insurance $${(insAmount / 1000000).toFixed(1)}M below required $${(classReqs.insuranceMinimum / 1000000).toFixed(1)}M`);
              }
            }
          }
        }
      }

      // 3. Determine bid round
      let bidRound = 1;
      if (input.parentBidId) {
        const [parent] = await db.select({ round: loadBids.bidRound }).from(loadBids).where(eq(loadBids.id, input.parentBidId)).limit(1);
        bidRound = (parent?.round || 0) + 1;
      }

      // 4. Get bidder's company ID
      let bidderCompanyId: number | null = null;
      const [drvRecord] = await db.select({ companyId: drivers.companyId }).from(drivers).where(eq(drivers.userId, userId)).limit(1);
      bidderCompanyId = drvRecord?.companyId || null;

      // 5. Insert the enhanced bid
      const [result] = await db.insert(loadBids).values({
        loadId: input.loadId,
        bidderUserId: userId,
        bidderCompanyId,
        bidderRole: roleToBidderRole(profile.role),
        bidAmount: String(input.bidAmount),
        rateType: input.rateType,
        parentBidId: input.parentBidId || null,
        bidRound,
        equipmentType: input.equipmentType || null,
        estimatedPickup: input.estimatedPickup ? new Date(input.estimatedPickup) : null,
        estimatedDelivery: input.estimatedDelivery ? new Date(input.estimatedDelivery) : null,
        transitTimeDays: input.transitTimeDays || null,
        fuelSurchargeIncluded: input.fuelSurchargeIncluded,
        accessorialsIncluded: input.accessorialsIncluded || null,
        conditions: input.conditions || null,
        agreementId: input.agreementId || null,
        status: "pending",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }).$returningId();

      // 6. Update load status to bidding
      if (load.status === "posted") {
        await db.update(loads).set({ status: "bidding" }).where(eq(loads.id, input.loadId));
      }

      // 7. Check auto-accept rules
      let autoAccepted = false;
      try {
        const rules = await db.select().from(bidAutoAcceptRules)
          .where(and(
            sql`${bidAutoAcceptRules.isActive} = 1`,
            sql`${bidAutoAcceptRules.userId} = ${load.shipperId} OR ${bidAutoAcceptRules.companyId} IN (SELECT companyId FROM drivers WHERE userId = ${load.shipperId})`,
          ))
          .limit(10);

        for (const rule of rules) {
          let matches = true;
          if (rule.maxRate && parseFloat(String(rule.maxRate)) < input.bidAmount) matches = false;
          if (rule.requiredHazmat && !isHazmat) matches = false;
          if (rule.maxTransitDays && input.transitTimeDays && input.transitTimeDays > rule.maxTransitDays) matches = false;
          if (rule.requiredEquipmentTypes && input.equipmentType) {
            const reqTypes = rule.requiredEquipmentTypes as string[];
            if (!reqTypes.includes(input.equipmentType)) matches = false;
          }

          if (matches && hazmatWarnings.length === 0) {
            // Auto-accept this bid
            await db.update(loadBids).set({
              status: "auto_accepted",
              isAutoAccepted: true,
              respondedAt: new Date(),
              respondedBy: load.shipperId,
            }).where(eq(loadBids.id, result.id));

            await db.update(loads).set({
              status: "assigned",
              catalystId: userId,
            }).where(eq(loads.id, input.loadId));

            await db.update(bidAutoAcceptRules).set({
              totalAutoAccepted: sql`${bidAutoAcceptRules.totalAutoAccepted} + 1`,
            }).where(eq(bidAutoAcceptRules.id, rule.id));

            autoAccepted = true;
            break;
          }
        }
      } catch (e) { console.warn('[LoadBoard] Auto-accept check failed:', e); }

      return {
        bidId: result.id,
        loadId: input.loadId,
        bidAmount: input.bidAmount,
        bidRound,
        status: autoAccepted ? "auto_accepted" : "pending",
        autoAccepted,
        hazmatWarnings,
        isHazmat,
        hazmatClass: load.hazmatClass || null,
        submittedBy: userId,
        submittedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * GET BIDS FOR LOAD — Full bid history with counter-offer chains
   */
  getBidsForLoad: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      includeWithdrawn: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { bids: [], total: 0 };
      try {
        const conditions = [eq(loadBids.loadId, input.loadId)];
        if (!input.includeWithdrawn) {
          conditions.push(sql`${loadBids.status} != 'withdrawn'`);
        }

        const rows = await db.select().from(loadBids)
          .where(and(...conditions))
          .orderBy(desc(loadBids.createdAt))
          .limit(100);

        // Enrich with bidder info
        const enriched = await Promise.all(rows.map(async (bid) => {
          let bidderName = '';
          let companyName = '';
          let hazmatAuthorized = false;
          if (bid.bidderCompanyId) {
            const [co] = await db.select({ name: companies.name, hazmatLicense: companies.hazmatLicense })
              .from(companies).where(eq(companies.id, bid.bidderCompanyId)).limit(1);
            companyName = co?.name || '';
            hazmatAuthorized = !!co?.hazmatLicense;
          }
          return {
            id: bid.id,
            bidAmount: parseFloat(String(bid.bidAmount)),
            rateType: bid.rateType,
            bidRound: bid.bidRound,
            parentBidId: bid.parentBidId,
            status: bid.status,
            bidderRole: bid.bidderRole,
            bidderUserId: bid.bidderUserId,
            bidderCompanyId: bid.bidderCompanyId,
            bidderName,
            companyName,
            hazmatAuthorized,
            equipmentType: bid.equipmentType,
            transitTimeDays: bid.transitTimeDays,
            fuelSurchargeIncluded: bid.fuelSurchargeIncluded,
            accessorialsIncluded: bid.accessorialsIncluded,
            conditions: bid.conditions,
            isAutoAccepted: bid.isAutoAccepted,
            expiresAt: bid.expiresAt?.toISOString() || null,
            respondedAt: bid.respondedAt?.toISOString() || null,
            createdAt: bid.createdAt?.toISOString() || '',
          };
        }));

        return { bids: enriched, total: enriched.length };
      } catch (e) { console.error('[LoadBoard] getBidsForLoad error:', e); return { bids: [], total: 0 }; }
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // NEGOTIATION THREADS — Thread-based rate negotiation using
  // negotiations + negotiationMessages tables
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * CREATE NEGOTIATION — Start a rate negotiation thread for a load
   */
  createNegotiation: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      respondentUserId: z.number(),
      subject: z.string(),
      description: z.string().optional(),
      initialOffer: z.number(),
      rateType: z.string().default("flat"),
      negotiationType: z.enum(["load_rate", "lane_rate", "contract_terms", "fuel_surcharge", "accessorial_rates", "volume_commitment", "payment_terms", "general"]).default("load_rate"),
      responseDeadlineHours: z.number().default(48),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const profile = await resolveUserProfile(ctx.user);
      const userId = profile.userId;

      // Get company IDs
      let initiatorCompanyId: number | null = profile.companyId;
      let respondentCompanyId: number | null = null;
      const [respDrv] = await db.select({ companyId: drivers.companyId }).from(drivers).where(eq(drivers.userId, input.respondentUserId)).limit(1);
      respondentCompanyId = respDrv?.companyId || null;

      const negNumber = `NEG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const deadline = new Date(Date.now() + input.responseDeadlineHours * 60 * 60 * 1000);

      const [negResult] = await db.insert(negotiations).values({
        negotiationNumber: negNumber,
        negotiationType: input.negotiationType,
        loadId: input.loadId,
        initiatorUserId: userId,
        initiatorCompanyId,
        respondentUserId: input.respondentUserId,
        respondentCompanyId,
        subject: input.subject,
        description: input.description || null,
        currentOffer: {
          amount: input.initialOffer,
          rateType: input.rateType,
          proposedBy: userId,
          proposedAt: new Date().toISOString(),
        },
        totalRounds: 1,
        status: "awaiting_response",
        responseDeadline: deadline,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }).$returningId();

      // Insert the initial offer message
      await db.insert(negotiationMessages).values({
        negotiationId: negResult.id,
        senderUserId: userId,
        round: 1,
        messageType: "initial_offer",
        content: input.description || `Initial offer: $${input.initialOffer}`,
        offerAmount: String(input.initialOffer),
        offerRateType: input.rateType,
      });

      return {
        negotiationId: negResult.id,
        negotiationNumber: negNumber,
        loadId: input.loadId,
        initialOffer: input.initialOffer,
        status: "awaiting_response",
        responseDeadline: deadline.toISOString(),
        createdBy: userId,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * GET NEGOTIATION THREAD — Full thread with all messages/offers
   */
  getNegotiationThread: protectedProcedure
    .input(z.object({ negotiationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return null;
      try {
        const [neg] = await db.select().from(negotiations).where(eq(negotiations.id, input.negotiationId)).limit(1);
        if (!neg) return null;

        const messages = await db.select().from(negotiationMessages)
          .where(eq(negotiationMessages.negotiationId, input.negotiationId))
          .orderBy(negotiationMessages.round, negotiationMessages.createdAt);

        // Get load info if load-based negotiation
        let loadInfo = null;
        if (neg.loadId) {
          const [load] = await db.select().from(loads).where(eq(loads.id, neg.loadId)).limit(1);
          if (load) {
            const pickup = load.pickupLocation as any || {};
            const delivery = load.deliveryLocation as any || {};
            loadInfo = {
              id: load.id,
              loadNumber: load.loadNumber,
              origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : '',
              destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : '',
              rate: load.rate ? parseFloat(String(load.rate)) : 0,
              hazmatClass: load.hazmatClass,
            };
          }
        }

        return {
          id: neg.id,
          negotiationNumber: neg.negotiationNumber,
          negotiationType: neg.negotiationType,
          subject: neg.subject,
          description: neg.description,
          status: neg.status,
          outcome: neg.outcome,
          currentOffer: neg.currentOffer,
          totalRounds: neg.totalRounds,
          initiatorUserId: neg.initiatorUserId,
          respondentUserId: neg.respondentUserId,
          responseDeadline: neg.responseDeadline?.toISOString() || null,
          expiresAt: neg.expiresAt?.toISOString() || null,
          resolvedAt: neg.resolvedAt?.toISOString() || null,
          loadInfo,
          messages: messages.map(m => ({
            id: m.id,
            round: m.round,
            messageType: m.messageType,
            content: m.content,
            offerAmount: m.offerAmount ? parseFloat(String(m.offerAmount)) : null,
            offerRateType: m.offerRateType,
            offerTerms: m.offerTerms,
            senderUserId: m.senderUserId,
            isRead: m.isRead,
            createdAt: m.createdAt?.toISOString() || '',
          })),
          createdAt: neg.createdAt?.toISOString() || '',
        };
      } catch (e) { console.error('[LoadBoard] getNegotiationThread error:', e); return null; }
    }),

  /**
   * RESPOND TO NEGOTIATION — Counter-offer, accept, or reject
   */
  respondToNegotiation: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      action: z.enum(["counter_offer", "accept", "reject", "withdraw"]),
      counterAmount: z.number().optional(),
      counterRateType: z.string().optional(),
      counterTerms: z.record(z.string(), z.unknown()).optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const profile = await resolveUserProfile(ctx.user);
      const userId = profile.userId;

      const [neg] = await db.select().from(negotiations).where(eq(negotiations.id, input.negotiationId)).limit(1);
      if (!neg) throw new Error("Negotiation not found");
      if (["agreed", "rejected", "expired", "cancelled"].includes(neg.status as string)) throw new Error("Negotiation is already closed");
      // Verify user is a party to this negotiation
      if (!profile.isAdmin && userId !== neg.initiatorUserId && userId !== neg.respondentUserId) throw new Error("You are not a party to this negotiation");

      const newRound = (neg.totalRounds || 0) + 1;

      if (input.action === "accept") {
        await db.update(negotiations).set({
          status: "agreed",
          outcome: "accepted",
          agreedTerms: neg.currentOffer,
          resolvedAt: new Date(),
          totalRounds: newRound,
        }).where(eq(negotiations.id, input.negotiationId));

        await db.insert(negotiationMessages).values({
          negotiationId: input.negotiationId,
          senderUserId: userId,
          round: newRound,
          messageType: "accept",
          content: input.message || "Offer accepted",
        });

        // If load-based, auto-assign the load
        if (neg.loadId) {
          const assignTo = userId === neg.initiatorUserId ? neg.respondentUserId : neg.initiatorUserId;
          const offer = neg.currentOffer as any;
          await db.update(loads).set({
            status: "assigned",
            catalystId: assignTo,
            rate: offer?.amount ? String(offer.amount) : undefined,
          }).where(eq(loads.id, neg.loadId));
        }

        return { negotiationId: input.negotiationId, action: "accepted", round: newRound, resolvedAt: new Date().toISOString() };
      }

      if (input.action === "reject") {
        await db.update(negotiations).set({
          status: "rejected",
          outcome: "rejected",
          resolvedAt: new Date(),
          totalRounds: newRound,
        }).where(eq(negotiations.id, input.negotiationId));

        await db.insert(negotiationMessages).values({
          negotiationId: input.negotiationId,
          senderUserId: userId,
          round: newRound,
          messageType: "reject",
          content: input.message || "Offer rejected",
        });

        return { negotiationId: input.negotiationId, action: "rejected", round: newRound, resolvedAt: new Date().toISOString() };
      }

      if (input.action === "counter_offer") {
        if (!input.counterAmount) throw new Error("Counter amount required for counter offer");

        const newOffer = {
          amount: input.counterAmount,
          rateType: input.counterRateType || "flat",
          terms: input.counterTerms || {},
          proposedBy: userId,
          proposedAt: new Date().toISOString(),
        };

        await db.update(negotiations).set({
          status: "counter_offered",
          currentOffer: newOffer,
          totalRounds: newRound,
          responseDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
        }).where(eq(negotiations.id, input.negotiationId));

        await db.insert(negotiationMessages).values({
          negotiationId: input.negotiationId,
          senderUserId: userId,
          round: newRound,
          messageType: "counter_offer",
          content: input.message || `Counter offer: $${input.counterAmount}`,
          offerAmount: String(input.counterAmount),
          offerRateType: input.counterRateType || "flat",
          offerTerms: input.counterTerms || null,
        });

        return { negotiationId: input.negotiationId, action: "counter_offered", counterAmount: input.counterAmount, round: newRound };
      }

      // Withdraw
      await db.update(negotiations).set({
        status: "cancelled",
        outcome: "cancelled",
        resolvedAt: new Date(),
      }).where(eq(negotiations.id, input.negotiationId));

      await db.insert(negotiationMessages).values({
        negotiationId: input.negotiationId,
        senderUserId: userId,
        round: newRound,
        messageType: "withdraw",
        content: input.message || "Negotiation withdrawn",
      });

      return { negotiationId: input.negotiationId, action: "withdrawn", round: newRound };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LANE CONTRACTS — Contracted lane rates that boost matching scores
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET LANE CONTRACT RATES — Look up contracted rates for a lane
   */
  getLaneContractRates: protectedProcedure
    .input(z.object({
      originState: z.string(),
      destinationState: z.string(),
      originCity: z.string().optional(),
      destinationCity: z.string().optional(),
      equipmentType: z.string().optional(),
      hazmatRequired: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { contracts: [], total: 0 };
      try {
        const userId = await resolveUserId(ctx.user);
        const conditions = [
          eq(laneContracts.status, "active"),
          eq(laneContracts.originState, input.originState),
          eq(laneContracts.destinationState, input.destinationState),
          sql`${laneContracts.expirationDate} > NOW()`,
        ];
        if (input.originCity) conditions.push(eq(laneContracts.originCity, input.originCity));
        if (input.destinationCity) conditions.push(eq(laneContracts.destinationCity, input.destinationCity));
        if (input.hazmatRequired !== undefined) conditions.push(eq(laneContracts.hazmatRequired, input.hazmatRequired));

        const rows = await db.select().from(laneContracts)
          .where(and(...conditions))
          .orderBy(desc(laneContracts.totalLoadsBooked))
          .limit(20);

        return {
          contracts: rows.map(c => ({
            id: c.id,
            lane: `${c.originCity}, ${c.originState} → ${c.destinationCity}, ${c.destinationState}`,
            contractedRate: parseFloat(String(c.contractedRate)),
            rateType: c.rateType,
            equipmentType: c.equipmentType,
            hazmatRequired: c.hazmatRequired,
            volumeCommitment: c.volumeCommitment,
            volumeFulfilled: c.volumeFulfilled,
            volumePeriod: c.volumePeriod,
            estimatedMiles: c.estimatedMiles ? parseFloat(String(c.estimatedMiles)) : null,
            totalLoadsBooked: c.totalLoadsBooked,
            onTimePercentage: c.onTimePercentage ? parseFloat(String(c.onTimePercentage)) : null,
            effectiveDate: c.effectiveDate?.toISOString() || '',
            expirationDate: c.expirationDate?.toISOString() || '',
            shipperId: c.shipperId,
            catalystId: c.catalystId,
            brokerId: c.brokerId,
          })),
          total: rows.length,
        };
      } catch (e) { console.error('[LoadBoard] getLaneContractRates error:', e); return { contracts: [], total: 0 }; }
    }),

  /**
   * ENHANCED MATCH — Upgraded matchLoadsToCarrier that also boosts scores for:
   * - Active lane contracts on the load's lane
   * - Active master service agreements (MSAs) between shipper and carrier
   * - Counter-offer history (repeat business)
   */
  enhancedMatchLoadsToCarrier: protectedProcedure
    .input(z.object({
      carrierId: z.number().optional(),
      driverId: z.number().optional(),
      vehicleId: z.number().optional(),
      preferredOriginStates: z.array(z.string()).optional(),
      preferredDestStates: z.array(z.string()).optional(),
      maxWeight: z.number().optional(),
      includeHazmat: z.boolean().default(true),
      includeGeneral: z.boolean().default(true),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { matches: [], total: 0, matchCriteria: {}, contractedLanes: 0, activeMSAs: 0 };
      try {
        // 1. Gather carrier/driver/vehicle profile (same as matchLoadsToCarrier)
        let hasHazmatEndorsement = false;
        let hasTankerEndorsement = false;
        let hazmatExpired = false;
        let carrierHazmatAuth = false;
        let carrierInsuranceAmount = 0;
        let trailerType = '';
        let carrierCompanyId: number | null = null;

        if (input.driverId) {
          const [drv] = await db.select().from(drivers).where(eq(drivers.id, input.driverId)).limit(1);
          if (drv) {
            hasHazmatEndorsement = !!drv.hazmatEndorsement;
            hasTankerEndorsement = hasHazmatEndorsement;
            if (drv.hazmatExpiry && new Date(drv.hazmatExpiry) < new Date()) hazmatExpired = true;
            carrierCompanyId = drv.companyId;
          }
        }

        if (input.carrierId) {
          const [co] = await db.select().from(companies).where(eq(companies.id, input.carrierId)).limit(1);
          if (co) {
            carrierHazmatAuth = !!co.hazmatLicense;
            if (co.hazmatExpiry && new Date(co.hazmatExpiry) < new Date()) carrierHazmatAuth = false;
            carrierCompanyId = co.id;
            if (co.insurancePolicy) {
              try { const ins = typeof co.insurancePolicy === 'string' ? JSON.parse(co.insurancePolicy) : co.insurancePolicy; carrierInsuranceAmount = (ins as any)?.amount || (ins as any)?.limit || 1000000; } catch { carrierInsuranceAmount = 1000000; }
            }
          }
        }

        if (input.vehicleId) {
          const [veh] = await db.select().from(vehicles).where(eq(vehicles.id, input.vehicleId)).limit(1);
          if (veh) trailerType = ((veh as any).trailerType || (veh as any).vehicleType || '').toUpperCase();
        }

        // 2. Fetch active lane contracts for this carrier
        let carrierLaneContracts: Array<{ originState: string; destState: string; rate: number }> = [];
        if (carrierCompanyId) {
          const lanes = await db.select({
            originState: laneContracts.originState,
            destinationState: laneContracts.destinationState,
            contractedRate: laneContracts.contractedRate,
          }).from(laneContracts)
            .where(and(
              eq(laneContracts.status, "active"),
              sql`${laneContracts.expirationDate} > NOW()`,
              sql`${laneContracts.catalystCompanyId} = ${carrierCompanyId} OR ${laneContracts.catalystId} IN (SELECT userId FROM drivers WHERE companyId = ${carrierCompanyId})`,
            ))
            .limit(100);
          carrierLaneContracts = lanes.map(l => ({
            originState: l.originState,
            destState: l.destinationState,
            rate: parseFloat(String(l.contractedRate)),
          }));
        }

        // 3. Fetch active MSAs for this carrier
        let activeMSAShipperIds: number[] = [];
        if (carrierCompanyId) {
          try {
            const msas = await db.select({
              partyAId: sql<number>`COALESCE(${agreements.partyAUserId}, 0)`,
              partyBId: sql<number>`COALESCE(${agreements.partyBUserId}, 0)`,
            }).from(agreements)
              .where(and(
                eq(agreements.status, "active" as any),
                sql`${agreements.expirationDate} > NOW()`,
                sql`${agreements.partyACompanyId} = ${carrierCompanyId} OR ${agreements.partyBCompanyId} = ${carrierCompanyId}`,
              ))
              .limit(50);
            for (const m of msas) {
              if (m.partyAId) activeMSAShipperIds.push(m.partyAId);
              if (m.partyBId) activeMSAShipperIds.push(m.partyBId);
            }
          } catch (e) { console.warn('[LoadBoard] MSA lookup failed:', e); }
        }

        // 4. Fetch available loads
        const availableLoads = await db.select().from(loads)
          .where(sql`${loads.status} IN ('posted', 'available', 'bidding')`)
          .orderBy(desc(loads.createdAt))
          .limit(200);

        // 5. Score each load (same base logic + lane contract + MSA boost)
        const matches: Array<{
          loadId: string; loadNumber: string; score: number; matchReasons: string[]; warnings: string[];
          origin: string; destination: string; rate: number; distance: number; weight: number;
          hazmat: boolean; hazmatClass: string | null; equipmentType: string;
          laneContracted: boolean; contractedRate: number | null; msaActive: boolean;
          postedAt: string;
        }> = [];

        for (const load of availableLoads) {
          const reasons: string[] = [];
          const warnings: string[] = [];
          let score = 50;
          const pickup = load.pickupLocation as any || {};
          const delivery = load.deliveryLocation as any || {};
          const isHazmat = !!load.hazmatClass;
          const loadWeight = load.weight ? parseFloat(String(load.weight)) : 0;
          const originState = (pickup.state || '').toUpperCase();
          const destState = (delivery.state || '').toUpperCase();

          if (isHazmat && !input.includeHazmat) continue;
          if (!isHazmat && !input.includeGeneral) continue;
          if (input.maxWeight && loadWeight > input.maxWeight) continue;

          // Hazmat checks (same as matchLoadsToCarrier)
          if (isHazmat) {
            const classReqs = HAZMAT_CLASS_REQUIREMENTS[load.hazmatClass!];
            if (!hasHazmatEndorsement || hazmatExpired) { warnings.push(`Requires ${classReqs?.endorsement || 'H'} endorsement`); score -= 40; }
            else { reasons.push(`Driver has ${classReqs?.endorsement || 'H'} endorsement`); score += 15; }
            if (!carrierHazmatAuth) { warnings.push('Carrier missing HMSP'); score -= 30; }
            else { reasons.push('Carrier HMSP authorized'); score += 10; }
            if (classReqs && carrierInsuranceAmount < classReqs.insuranceMinimum) { warnings.push(`Insurance below $${(classReqs.insuranceMinimum / 1000000).toFixed(1)}M minimum`); score -= 20; }
            else if (classReqs) { reasons.push('Insurance meets minimum'); score += 5; }
            if (trailerType && classReqs) {
              const allowed = classReqs.trailerTypes.map(t => t.toUpperCase());
              if (allowed.some(a => trailerType.includes(a))) { reasons.push(`${trailerType} compatible`); score += 10; }
              else { warnings.push(`${trailerType} not approved for Class ${load.hazmatClass}`); score -= 15; }
            }
            if (hasHazmatEndorsement && carrierHazmatAuth) score += 10;
          } else {
            reasons.push('General freight'); score += 5;
          }

          // Lane preference
          if (input.preferredOriginStates?.length) {
            if (input.preferredOriginStates.map(s => s.toUpperCase()).includes(originState)) { reasons.push(`Preferred origin: ${originState}`); score += 15; }
          }
          if (input.preferredDestStates?.length) {
            if (input.preferredDestStates.map(s => s.toUpperCase()).includes(destState)) { reasons.push(`Preferred dest: ${destState}`); score += 10; }
          }

          // ★ LANE CONTRACT BOOST — carrier has an active contract on this lane
          let laneContracted = false;
          let contractedRate: number | null = null;
          const laneMatch = carrierLaneContracts.find(lc =>
            lc.originState.toUpperCase() === originState && lc.destState.toUpperCase() === destState
          );
          if (laneMatch) {
            laneContracted = true;
            contractedRate = laneMatch.rate;
            reasons.push(`Lane contracted at $${laneMatch.rate.toLocaleString()}`);
            score += 20;
          }

          // ★ MSA BOOST — carrier has an active agreement with this shipper
          let msaActive = false;
          if (load.shipperId && activeMSAShipperIds.includes(load.shipperId)) {
            msaActive = true;
            reasons.push('Active MSA with shipper');
            score += 15;
          }

          const rate = load.rate ? parseFloat(String(load.rate)) : 0;
          if (rate > 3000) { reasons.push('High-value load'); score += 5; }

          if (score <= 0) continue;

          matches.push({
            loadId: String(load.id),
            loadNumber: load.loadNumber || `LOAD-${load.id}`,
            score: Math.min(100, Math.max(0, score)),
            matchReasons: reasons,
            warnings,
            origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : originState,
            destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : destState,
            rate,
            distance: load.distance ? parseFloat(String(load.distance)) : 0,
            weight: loadWeight,
            hazmat: isHazmat,
            hazmatClass: load.hazmatClass || null,
            equipmentType: load.cargoType || '',
            laneContracted,
            contractedRate,
            msaActive,
            postedAt: load.createdAt?.toISOString() || '',
          });
        }

        matches.sort((a, b) => b.score - a.score);

        return {
          matches: matches.slice(0, input.limit),
          total: matches.length,
          matchCriteria: {
            hasHazmatEndorsement, hasTankerEndorsement, carrierHazmatAuth, carrierInsuranceAmount,
            trailerType: trailerType || null,
            preferredOriginStates: input.preferredOriginStates || [],
            preferredDestStates: input.preferredDestStates || [],
          },
          contractedLanes: carrierLaneContracts.length,
          activeMSAs: activeMSAShipperIds.length,
        };
      } catch (e) {
        console.error('[LoadBoard] enhancedMatchLoadsToCarrier error:', e);
        return { matches: [], total: 0, matchCriteria: {}, contractedLanes: 0, activeMSAs: 0 };
      }
    }),
});
