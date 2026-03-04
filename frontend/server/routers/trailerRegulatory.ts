/**
 * TRAILER REGULATORY ROUTER — GOLD STANDARD
 * Comprehensive tRPC procedures for ALL non-hazmat trailer types
 * Covers: Product lists, cargo securement (49 CFR 393), FSMA sanitary transport
 * (21 CFR 1.900-1.934), oversize/overweight permits, reefer temp compliance,
 * food-grade tank sanitation, water quality, hopper pneumatic safety
 * Mirrors the depth of the hazmat router for every non-hazmat trailer type
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getProductsForTrailer, searchProducts } from "../_core/trailerProducts";

export const trailerRegulatoryRouter = router({

  // 1. getProductsByTrailerType — returns 50 products + metadata for a given trailer type
  getProductsByTrailerType: protectedProcedure
    .input(z.object({
      trailerType: z.string(),
      search: z.string().optional(),
    }))
    .query(({ input }) => {
      const products = input.search
        ? searchProducts(input.trailerType, input.search)
        : getProductsForTrailer(input.trailerType);

      return {
        trailerType: input.trailerType,
        products,
        totalAvailable: getProductsForTrailer(input.trailerType).length,
        supportsOther: true,
      };
    }),

  // 2. getDryVanRegulations — 49 CFR 393 cargo securement, weight limits, load planning
  getDryVanRegulations: protectedProcedure
    .input(z.object({
      productId: z.string().optional(),
      productName: z.string().optional(),
      weight: z.number().optional(),
    }).optional())
    .query(({ input }) => {
      const weight = input?.weight || 0;
      const overweight = weight > 44000;

      return {
        trailerType: "dry_van",
        title: "Dry Van Regulatory Compliance",
        cargoSecurement: {
          cfr: "49 CFR 393 Subpart I",
          title: "Cargo Securement Rules",
          requirements: [
            { id: "cs_001", rule: "49 CFR 393.100", title: "Applicability", desc: "Applies to all cargo-carrying CMVs operated in interstate commerce" },
            { id: "cs_002", rule: "49 CFR 393.102", title: "Securement Systems", desc: "Cargo must be immobilized or secured to prevent shifting. Aggregate WLL must be at least 50% of cargo weight for forward restraint" },
            { id: "cs_003", rule: "49 CFR 393.104", title: "Tiedown Devices", desc: "Each tiedown must have WLL >= 1/2 cargo weight divided by number of tiedowns. No knots allowed in synthetic webbing." },
            { id: "cs_004", rule: "49 CFR 393.106", title: "Minimum Number of Tiedowns", desc: "1 tiedown for articles <=5ft, 2 for >5ft and <=10ft, add 1 per additional 10ft of length" },
            { id: "cs_005", rule: "49 CFR 393.110", title: "Friction Mats", desc: "May reduce tiedown requirements if friction coefficient >= 0.6" },
          ],
        },
        weightLimits: {
          cfr: "23 USC 127 / Bridge Formula",
          title: "Federal Weight Limits",
          requirements: [
            { id: "wl_001", rule: "23 USC 127(a)", title: "Gross Vehicle Weight", desc: "80,000 lbs maximum on Interstate Highway System" },
            { id: "wl_002", rule: "Bridge Formula B", title: "Bridge Formula", desc: "W = 500 * (LN/(N-1) + 12N + 36). Limits weight per axle group." },
            { id: "wl_003", rule: "Single Axle", title: "Single Axle Limit", desc: "20,000 lbs maximum per single axle" },
            { id: "wl_004", rule: "Tandem Axle", title: "Tandem Axle Limit", desc: "34,000 lbs maximum per tandem axle" },
            { id: "wl_005", rule: "State Permits", title: "Overweight Permits", desc: "Varies by state — some allow 88,000-105,000 lbs with divisible load permits" },
          ],
        },
        loadPlanning: {
          title: "Load Planning & Optimization",
          guidelines: [
            { id: "lp_001", title: "Axle Weight Distribution", desc: "Steer: 12,000 lbs / Drive tandem: 34,000 lbs / Trailer tandem: 34,000 lbs = 80,000 GVW" },
            { id: "lp_002", title: "Floor Load Rating", desc: "Typical dry van floor rated for 16,000 lb forklift with 8,000 lb per wheel" },
            { id: "lp_003", title: "Cube vs Weight", desc: "53ft dry van = 3,000 cu ft / Max payload ~44,000 lbs. Products at <14.7 lbs/cu ft cube out first." },
            { id: "lp_004", title: "Load Bars", desc: "FMCSA recommends load-lock bars every 4ft for partial loads to prevent shifting" },
            { id: "lp_005", title: "Mixed Commodities", desc: "Heavy items on bottom, light on top. No incompatible products (chemicals near food)." },
          ],
        },
        alerts: overweight ? [{
          severity: "warning" as const,
          message: `Load weight ${weight.toLocaleString()} lbs exceeds typical dry van max payload of 44,000 lbs. Check axle weights and consider overweight permit.`,
        }] : [],
        inspectionChecklist: [
          "Verify all tiedowns have minimum WLL per 49 CFR 393.104",
          "Check load bars are properly positioned and locked",
          "Confirm cargo does not exceed floor load rating",
          "Verify trailer doors seal properly (weatherproof)",
          "Check king pin and landing gear condition",
          "Verify brake lights, turn signals, and reflective tape",
          "Ensure cargo is compatible (no food near chemicals)",
          "Record seal number on BOL if sealed load",
        ],
      };
    }),

  // 3. getReeferRegulations — FSMA 21 CFR 1.908, temp monitoring, cleaning standards
  getReeferRegulations: protectedProcedure
    .input(z.object({
      productId: z.string().optional(),
      productName: z.string().optional(),
      setpointTemp: z.number().optional(),
    }).optional())
    .query(({ input }) => {
      return {
        trailerType: "reefer",
        title: "Refrigerated Trailer Regulatory Compliance",
        fsma: {
          cfr: "21 CFR Part 1 Subpart O (1.900-1.934)",
          title: "FSMA Sanitary Transportation of Human and Animal Food",
          requirements: [
            { id: "fsma_001", rule: "21 CFR 1.906", title: "Applicability", desc: "Applies to shippers, carriers, loaders, receivers of food transported by motor vehicle or rail in the US" },
            { id: "fsma_002", rule: "21 CFR 1.908(a)", title: "Vehicle & Transport Equipment", desc: "Vehicles must be designed to maintain required temperature conditions and be inspectable for cleanliness" },
            { id: "fsma_003", rule: "21 CFR 1.908(b)", title: "Transportation Operations", desc: "Must ensure food not transported in a way that makes it unsafe. Pre-cool, set temp, monitor, document." },
            { id: "fsma_004", rule: "21 CFR 1.908(c)", title: "Information Exchange", desc: "Shipper must communicate required temp conditions, pre-cooling requirements, and prior cargo restrictions" },
            { id: "fsma_005", rule: "21 CFR 1.908(d)", title: "Training", desc: "Carrier personnel must be trained in sanitary transport practices. Training records retained." },
            { id: "fsma_006", rule: "21 CFR 1.908(e)", title: "Records", desc: "Written procedures, training records, agreements, and monitoring records must be retained for 12 months" },
          ],
        },
        temperatureControl: {
          title: "Temperature Monitoring & Documentation",
          requirements: [
            { id: "tc_001", title: "Pulp Temperature", desc: "Product core temp must be verified at pickup before loading. Document on BOL." },
            { id: "tc_002", title: "Continuous Monitoring", desc: "Data logger recording temp at minimum every 15 minutes. Many receivers require every 5 min." },
            { id: "tc_003", title: "Pre-Cool Trailer", desc: "Pre-cool trailer within 5F of setpoint BEFORE loading. Do NOT use cargo to cool the trailer." },
            { id: "tc_004", title: "Air Flow", desc: "Maintain air chute integrity. Do not block airflow under/over pallets. Floor grooves must be clear." },
            { id: "tc_005", title: "Fuel Management", desc: "Reefer diesel sufficient for entire trip + 24hr buffer. Fuel stops are driver's responsibility." },
            { id: "tc_006", title: "Temp Excursion Protocol", desc: "If temp deviates >5F from setpoint for >30 min, notify dispatch immediately. Document incident." },
          ],
        },
        cleaningStandards: {
          title: "Cleaning & Sanitation Requirements",
          requirements: [
            { id: "cl_001", title: "Washout Between Loads", desc: "Interior must be swept/washed between loads. Food loads require food-grade washout facility." },
            { id: "cl_002", title: "Previous Cargo Disclosure", desc: "Disclose last 3 loads hauled. Many food shippers reject if prior hazmat/chemicals." },
            { id: "cl_003", title: "No Hazmat Cross-Contamination", desc: "Trailers used for hazmat shall NOT be used for food without certified decontamination." },
            { id: "cl_004", title: "Organic Certification", desc: "USDA Organic loads may require dedicated trailers or certified cleanout documentation." },
          ],
        },
        temperatureGuide: [
          { product: "Frozen Meat/Poultry/Seafood", setpoint: "0F or below", tolerance: "+/- 2F" },
          { product: "Ice Cream/Frozen Desserts", setpoint: "-20F to -10F", tolerance: "+/- 2F" },
          { product: "Fresh Meat/Poultry", setpoint: "28-32F", tolerance: "+/- 2F" },
          { product: "Dairy (Milk, Cheese, Yogurt)", setpoint: "33-38F", tolerance: "+/- 2F" },
          { product: "Fresh Produce", setpoint: "32-36F (varies)", tolerance: "+/- 3F" },
          { product: "Tropical Fruit", setpoint: "45-55F", tolerance: "+/- 3F" },
          { product: "Pharmaceuticals (2-8C)", setpoint: "36-46F", tolerance: "+/- 1F" },
          { product: "Chocolate/Confections", setpoint: "55-65F", tolerance: "+/- 5F" },
          { product: "Fresh Flowers", setpoint: "33-36F", tolerance: "+/- 2F" },
          { product: "Wine", setpoint: "55-60F", tolerance: "+/- 3F" },
        ],
        inspectionChecklist: [
          "Verify reefer unit is running and at setpoint temp before loading",
          "Confirm pre-cool achieved (within 5F of setpoint)",
          "Check data logger is functional and recording",
          "Inspect door seals for gaps/tears (cold air leak)",
          "Verify air chute is intact and properly positioned",
          "Check fuel level for reefer unit — sufficient for trip + 24hr buffer",
          "Record pulp temperature of product at pickup",
          "Verify previous cargo disclosed and trailer washout if required",
          "Confirm FSMA training records are current",
          "Document setpoint temp on BOL",
        ],
      };
    }),

  // 4. getFlatbedRegulations — 49 CFR 393 Subpart I, oversize/overweight
  getFlatbedRegulations: protectedProcedure
    .input(z.object({
      productId: z.string().optional(),
      productName: z.string().optional(),
      weight: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      length: z.number().optional(),
    }).optional())
    .query(({ input }) => {
      const width = input?.width || 0;
      const height = input?.height || 0;
      const length = input?.length || 0;
      const weight = input?.weight || 0;

      const oversizeAlerts: Array<{ severity: "warning" | "critical"; message: string }> = [];
      if (width > 8.5) oversizeAlerts.push({ severity: "warning", message: `Load width ${width}ft exceeds 8.5ft legal limit. Width permit and possible escort required.` });
      if (height > 13.5) oversizeAlerts.push({ severity: "warning", message: `Load height ${height}ft exceeds 13.5ft legal limit. Height permit required. Verify bridge/overpass clearances.` });
      if (length > 75) oversizeAlerts.push({ severity: "warning", message: `Overall length ${length}ft may exceed state limits. Length permit required in most states.` });
      if (weight > 80000) oversizeAlerts.push({ severity: "critical", message: `GVW ${weight.toLocaleString()} lbs exceeds 80,000 lb federal limit. Overweight permit required.` });

      return {
        trailerType: "flatbed",
        title: "Flatbed Trailer Regulatory Compliance",
        cargoSecurement: {
          cfr: "49 CFR 393 Subpart I (393.100-393.136)",
          title: "Cargo Securement — Flatbed Specific",
          requirements: [
            { id: "fb_cs_001", rule: "49 CFR 393.110(b)", title: "Minimum Strength", desc: "Aggregate WLL >= 50% cargo weight forward, 50% rearward, 50% each side" },
            { id: "fb_cs_002", rule: "49 CFR 393.114", title: "Dressed Lumber & Building Products", desc: "Bundles blocked against forward movement. Tiedowns at 3ft max from ends, every 10ft." },
            { id: "fb_cs_003", rule: "49 CFR 393.116", title: "Logs", desc: "Minimum 2 tiedowns for short logs (<10ft bunks). Each stack needs independent tiedowns." },
            { id: "fb_cs_004", rule: "49 CFR 393.118", title: "Metal Coils, Pipe, Rolls", desc: "Prevented from rolling. Chocks/cradles required. Banding alone is not sufficient." },
            { id: "fb_cs_005", rule: "49 CFR 393.120", title: "Concrete Pipe/Precast", desc: "Prevented from all movement. Blocking at front/rear of each tier." },
            { id: "fb_cs_006", rule: "49 CFR 393.122", title: "Intermodal Containers", desc: "Secured by twist locks. 4 tiedowns if no twist locks." },
            { id: "fb_cs_007", rule: "49 CFR 393.126", title: "Heavy Vehicles/Equipment/Machinery", desc: "Restrained against all movement. 4 tiedowns minimum. Chains required for >10,000 lbs." },
            { id: "fb_cs_008", rule: "49 CFR 393.128", title: "Automobiles/Light Trucks", desc: "Minimum 2 tiedowns per vehicle. Prevent forward/rearward/lateral movement." },
          ],
        },
        oversizeOverweight: {
          title: "Oversize / Overweight Permit Requirements",
          requirements: [
            { id: "os_001", title: "Width Permit", desc: "Required if load exceeds 8.5ft wide. Most states issue up to 16ft." },
            { id: "os_002", title: "Height Permit", desc: "Required if exceeds 13.5ft (14ft some states). Many bridges lower than 14ft." },
            { id: "os_003", title: "Length Permit", desc: "Required if overall vehicle+load exceeds state maximums (75-100ft varies)." },
            { id: "os_004", title: "Weight Permit (Non-Divisible)", desc: "Non-divisible loads >80,000 lbs require single-trip or annual overweight permits per state." },
            { id: "os_005", title: "Escort Vehicles", desc: "Generally required for loads >12ft wide or >14.5ft high. Front and/or rear escort." },
            { id: "os_006", title: "Travel Restrictions", desc: "Superloads: daylight hours, weekdays only, no holidays, no adverse weather." },
            { id: "os_007", title: "Route Survey", desc: "Required for superloads — verify bridge ratings, overhead clearances, turn radii." },
            { id: "os_008", title: "Flags & Signs", desc: "OVERSIZE LOAD sign (yellow/black, 7ft x 18in). Red/orange flags on extremities." },
            { id: "os_009", title: "Lights & Markings", desc: "Amber rotating/strobe lights on pilot cars. Amber lights on extremities." },
          ],
        },
        tarpingRequirements: {
          title: "Tarping & Load Cover Requirements",
          requirements: [
            { id: "tp_001", title: "Full Tarping", desc: "Required by many shippers for weather protection. Lumber/steel commonly tarped." },
            { id: "tp_002", title: "Smoke Tarps", desc: "4ft front smoke tarp protects first rows from road dirt/exhaust." },
            { id: "tp_003", title: "Coil Racks", desc: "Steel coils require coil racks/bunks. Never haul coils on flat deck without cradles." },
          ],
        },
        alerts: oversizeAlerts,
        inspectionChecklist: [
          "Verify all chains/binders are rated for load weight (Grade 70 or 80)",
          "Check that aggregate WLL >= 50% of cargo weight in all directions",
          "Confirm blocking and bracing prevents all movement",
          "Verify flags/signs on oversize loads (OVERSIZE LOAD placard)",
          "Check all permits are current and on-board for route",
          "Verify escort vehicle arrangements if required",
          "Confirm route survey completed for superloads",
          "Check edge protectors on all straps contacting sharp edges",
          "Verify tarp properly secured (if required)",
          "Document load dimensions and weight on BOL",
        ],
      };
    }),

  // 5. getBulkHopperRegulations — pneumatic safety, weight compliance, food-grade hopper
  getBulkHopperRegulations: protectedProcedure
    .input(z.object({
      productId: z.string().optional(),
      productName: z.string().optional(),
      weight: z.number().optional(),
      isFoodGrade: z.boolean().optional(),
    }).optional())
    .query(({ input }) => {
      const isFoodGrade = input?.isFoodGrade || false;
      const weight = input?.weight || 0;

      return {
        trailerType: "bulk_hopper",
        title: "Dry Bulk / Hopper Trailer Regulatory Compliance",
        weightCompliance: {
          cfr: "23 USC 127 / Bridge Formula",
          title: "Weight Compliance for Bulk Commodities",
          requirements: [
            { id: "bw_001", title: "Gross Weight", desc: "80,000 lbs GVW on interstate. Pneumatic trailers tare ~14,000-16,000 lbs. Max payload ~44,000-46,000 lbs." },
            { id: "bw_002", title: "Certified Scales", desc: "All bulk loads should be weighed on certified scales at origin. Weight tickets required." },
            { id: "bw_003", title: "Axle Distribution", desc: "Bulk commodities can shift. Spread-axle trailers help. Sliding tandem position matters." },
            { id: "bw_004", title: "Agricultural Tolerance", desc: "Some states allow 5% overweight tolerance for agricultural products during harvest." },
          ],
        },
        pneumaticSafety: {
          title: "Pneumatic Unloading Safety",
          requirements: [
            { id: "pn_001", title: "Air Pressure Limits", desc: "Do NOT exceed trailer MAWP (Max Allowable Working Pressure). Typical: 15 PSI. Check placard." },
            { id: "pn_002", title: "Pressure Relief Valve", desc: "PRV must be functional and set to trailer MAWP. Test annually. Required by ASME/DOT." },
            { id: "pn_003", title: "Hose & Coupling Inspection", desc: "Inspect pneumatic hoses, couplings, gaskets before each unload. Replace worn components." },
            { id: "pn_004", title: "Static Grounding", desc: "Ground trailer before unloading dry powders. Pneumatic transfer generates static." },
            { id: "pn_005", title: "Dust Explosion Awareness", desc: "NFPA 652: combustible dust hazard. Flour, sugar, starch, wood dust are explosive in dust clouds." },
            { id: "pn_006", title: "Driver PPE", desc: "Safety glasses, hard hat, steel-toed boots, dust mask/respirator for silica/cement. Hi-vis vest." },
            { id: "pn_007", title: "Fall Protection", desc: "OSHA 1926.501: fall protection required when working on top of hopper (>4ft)." },
          ],
        },
        foodGradeHopper: isFoodGrade ? {
          title: "Food-Grade Dry Bulk Requirements",
          requirements: [
            { id: "fgh_001", rule: "21 CFR 1.900-1.934", title: "FSMA Compliance", desc: "Applies to food-grade bulk transport (flour, sugar, grain, starch)" },
            { id: "fgh_002", title: "Dedicated vs Multi-Use", desc: "Many food shippers require dedicated food-only trailers. Prior load docs required." },
            { id: "fgh_003", title: "Washout Certification", desc: "Food-grade washout at certified facility. Certificate of Cleaning (COC) required." },
            { id: "fgh_004", title: "Allergen Control", desc: "Disclose allergens (wheat, soy, peanut) to next shipper. Some require allergen-free trailers." },
            { id: "fgh_005", title: "GFSI/SQF Certification", desc: "Many food manufacturers require GFSI-benchmarked food safety certification from carrier." },
          ],
        } : null,
        alerts: weight > 46000 ? [{
          severity: "warning" as const,
          message: `Payload ${weight.toLocaleString()} lbs may exceed typical hopper max payload of 46,000 lbs.`,
        }] : [],
        inspectionChecklist: [
          "Verify trailer MAWP placard and pressure relief valve",
          "Check all hopper lids/hatches seal properly",
          "Inspect pneumatic hoses and couplings for wear/damage",
          "Confirm static grounding strap is functional",
          "Verify weight ticket from certified scales",
          "Check axle weights are within limits (slide tandems if needed)",
          isFoodGrade ? "Verify food-grade washout certificate (COC)" : "Check trailer cleanliness between loads",
          isFoodGrade ? "Confirm allergen documentation" : "Check for cross-contamination risk with prior loads",
          "Verify driver has proper PPE for product type",
          "Document product, weight, and trailer condition on BOL",
        ].filter(Boolean),
      };
    }),

  // 6. getFoodGradeTankRegulations — FDA/FSMA 21 CFR 1.900-1.934, PMO, tank specs
  getFoodGradeTankRegulations: protectedProcedure
    .input(z.object({
      productId: z.string().optional(),
      productName: z.string().optional(),
      isDairy: z.boolean().optional(),
      isKosher: z.boolean().optional(),
      isOrganic: z.boolean().optional(),
    }).optional())
    .query(({ input }) => {
      const isDairy = input?.isDairy || false;
      const isKosher = input?.isKosher || false;
      const isOrganic = input?.isOrganic || false;

      return {
        trailerType: "food_grade_tank",
        title: "Food-Grade Liquid Tank Regulatory Compliance",
        fsma: {
          cfr: "21 CFR Part 1 Subpart O",
          title: "FSMA Sanitary Transportation Rule",
          requirements: [
            { id: "fgt_001", rule: "21 CFR 1.908", title: "Vehicle & Equipment", desc: "Tank designed/maintained to prevent contamination. Stainless steel 304/316L, sanitary fittings." },
            { id: "fgt_002", rule: "21 CFR 1.908(b)", title: "Cleaning & Sanitation", desc: "CIP (Clean-In-Place) between loads. Kosher/Halal may require separate CIP." },
            { id: "fgt_003", rule: "21 CFR 1.908(c)", title: "Prior Cargo Communication", desc: "Carrier must disclose last 3 loads. Shipper may reject if incompatible prior cargo." },
            { id: "fgt_004", rule: "21 CFR 1.908(d)", title: "Training", desc: "Carrier personnel trained in sanitary transport. Records retained 12 months." },
            { id: "fgt_005", rule: "21 CFR 1.908(e)", title: "Record Keeping", desc: "Written procedures, monitoring records, training records, agreements — all 12-month retention." },
          ],
        },
        pmo: isDairy ? {
          title: "Pasteurized Milk Ordinance (PMO) — Grade A Dairy",
          requirements: [
            { id: "pmo_001", title: "PMO Permit", desc: "Carrier must hold current PMO permit from state dairy authority for Grade A milk transport." },
            { id: "pmo_002", title: "Temperature", desc: "Grade A milk must be maintained at 45F or below from pickup to delivery." },
            { id: "pmo_003", title: "Seal Integrity", desc: "Outlet valves sealed at pickup. Seals verified intact at delivery." },
            { id: "pmo_004", title: "Tank Wash", desc: "CIP at PMO-approved wash facility. Wash ticket required with each load." },
            { id: "pmo_005", title: "Sampling", desc: "Milk samples taken at pickup per PMO protocols. Lab results retained." },
          ],
        } : null,
        tankSpecs: {
          title: "Food-Grade Tank Specifications",
          requirements: [
            { id: "ts_001", title: "Material", desc: "304 or 316L stainless steel interior. No aluminum or carbon steel for food contact." },
            { id: "ts_002", title: "Surface Finish", desc: "Interior: 150 grit (Ra 32) min for food. Dairy requires 180 grit (Ra 20) or better." },
            { id: "ts_003", title: "Sanitary Fittings", desc: "Tri-clamp (3A) fittings. No threaded connections on food-contact surfaces." },
            { id: "ts_004", title: "CIP System", desc: "Spray balls or rotating heads. 180F hot water + caustic wash + acid rinse + sanitizer." },
            { id: "ts_005", title: "Insulation", desc: "Foam or vacuum insulation for temp-sensitive products. Heated coils for viscous products." },
            { id: "ts_006", title: "Heating System", desc: "Hot water or steam coils for products that solidify (palm oil, tallow, chocolate)." },
          ],
        },
        certifications: {
          title: "Certifications & Documentation",
          requirements: [
            { id: "cert_001", title: "3-A Sanitary Standards", desc: "Tank must meet 3-A standards for milk/dairy. Annual inspection." },
            { id: "cert_002", title: "Tanker Endorsement (CDL-N)", desc: "49 CFR 383: Driver must have N endorsement for liquid bulk >1,000 gallons." },
            { id: "cert_003", title: "Wash Ticket", desc: "Certified food-grade wash ticket from approved facility. Must accompany BOL." },
            ...(isKosher ? [{ id: "cert_004", title: "Kosher Certification", desc: "Rabbi-supervised. Separate CIP protocols for kosher products." }] : []),
            ...(isOrganic ? [{ id: "cert_005", title: "Organic Certification", desc: "USDA Organic: dedicated tank or certified cleanout between organic/conventional." }] : []),
          ],
        },
        alerts: [],
        inspectionChecklist: [
          "Verify food-grade wash ticket (CIP) from certified facility",
          "Confirm prior 3 loads disclosed and compatible",
          "Check all tri-clamp fittings are tight and gaskets intact",
          "Verify tank interior surface is clean and free of residue",
          "Confirm temp monitoring equipment is functional",
          isDairy ? "Verify PMO permit is current" : null,
          isDairy ? "Check outlet valve seals for Grade A compliance" : null,
          isKosher ? "Verify kosher certification and CIP protocol" : null,
          isOrganic ? "Verify organic certification or cleanout documentation" : null,
          "Confirm driver has CDL with N (tanker) endorsement",
          "Document product, temp setpoint, and tank condition on BOL",
        ].filter(Boolean),
      };
    }),

  // 7. getWaterTankRegulations — EPA, potable water standards, oilfield water
  getWaterTankRegulations: protectedProcedure
    .input(z.object({
      productId: z.string().optional(),
      productName: z.string().optional(),
      isPotable: z.boolean().optional(),
      isOilfield: z.boolean().optional(),
    }).optional())
    .query(({ input }) => {
      const isPotable = input?.isPotable || false;
      const isOilfield = input?.isOilfield || false;

      return {
        trailerType: "water_tank",
        title: "Water Tank Regulatory Compliance",
        potableWater: isPotable ? {
          title: "Potable Water Transport Requirements",
          requirements: [
            { id: "pw_001", title: "NSF/ANSI 61 Certification", desc: "Tank and all wetted components must be NSF/ANSI 61 certified for drinking water contact." },
            { id: "pw_002", rule: "42 USC 300f", title: "EPA Safe Drinking Water Act", desc: "Water for human consumption must meet EPA primary drinking water standards." },
            { id: "pw_003", title: "State Health Dept Permit", desc: "Most states require a water hauler permit/license. Annual tank inspection." },
            { id: "pw_004", title: "Chlorine Residual", desc: "Maintain 0.2-2.0 ppm free chlorine residual. Test at fill and delivery. Document results." },
            { id: "pw_005", title: "Bacteriological Testing", desc: "Coliform/E.coli testing required periodically. Zero total coliform per 100mL." },
            { id: "pw_006", title: "Tank Sanitization", desc: "Chlorinate to 50-200 ppm, hold 24hr, flush to <2 ppm before potable use." },
          ],
        } : null,
        industrialWater: isOilfield ? {
          title: "Industrial & Oilfield Water Requirements",
          requirements: [
            { id: "iw_001", title: "Produced Water Disposal", desc: "UIC Class II well disposal requires EPA/state permit. Track volume, source, well ID." },
            { id: "iw_002", title: "NORM Screening", desc: "Produced water may contain Naturally Occurring Radioactive Material. Survey may be required." },
            { id: "iw_003", title: "H2S Risk", desc: "Oilfield water often contains dissolved H2S. Personal gas detector required. 10 ppm OSHA PEL." },
            { id: "iw_004", title: "Spill Prevention", desc: "SPCC plan near waterways. Carry spill kit. Report spills per state regs." },
            { id: "iw_005", title: "Manifest/Ticket", desc: "Produced water loads require field ticket: lease name, API number, volume, SWD destination." },
          ],
        } : null,
        generalRequirements: {
          title: "Water Tank General Requirements",
          requirements: [
            { id: "wtr_001", title: "Tanker Endorsement (CDL-N)", desc: "49 CFR 383: Required for liquid bulk >1,000 gallons." },
            { id: "wtr_002", title: "Baffles / Surge Control", desc: "Non-baffled tanks have severe surge risk. Partial loads are most dangerous." },
            { id: "wtr_003", title: "Rollover Prevention", desc: "Water tankers have highest rollover rate of any CMV. Reduce speed on curves/ramps." },
            { id: "wtr_004", title: "Load Securement", desc: "Hoses, pumps, and fittings must be secured per 49 CFR 393 during transport." },
            { id: "wtr_005", title: "Overflow Protection", desc: "Do not overfill. Leave 5% headspace minimum for thermal expansion." },
            { id: "wtr_006", title: "Anti-Siphon Device", desc: "Required in many jurisdictions to prevent backflow contamination." },
          ],
        },
        alerts: [],
        inspectionChecklist: [
          "Verify CDL with N (tanker) endorsement",
          "Check tank baffles and surge suppression system",
          isPotable ? "Verify NSF/ANSI 61 certification for all wetted surfaces" : null,
          isPotable ? "Test chlorine residual at fill point (0.2-2.0 ppm)" : null,
          isPotable ? "Verify state water hauler permit is current" : null,
          isOilfield ? "Verify produced water disposal permit for destination SWD" : null,
          isOilfield ? "Check personal H2S monitor and calibration" : null,
          isOilfield ? "Verify SPCC plan and spill kit on-board" : null,
          "Check all valves, fittings, and hose connections for leaks",
          "Verify overflow protection (5% headspace minimum)",
          "Confirm load is not overfilled — check gauge or sight glass",
          "Document volume, source, and destination on ticket/BOL",
        ].filter(Boolean),
      };
    }),

  // 8. getStepDeckRegulations — oversize, securement, height clearance
  getStepDeckRegulations: protectedProcedure
    .input(z.object({
      productId: z.string().optional(),
      productName: z.string().optional(),
      weight: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional())
    .query(({ input }) => {
      const width = input?.width || 0;
      const height = input?.height || 0;
      const weight = input?.weight || 0;
      const alerts: Array<{ severity: "warning" | "critical"; message: string }> = [];
      if (width > 8.5) alerts.push({ severity: "warning", message: `Load width ${width}ft exceeds 8.5ft legal limit. Width permit required.` });
      if (height > 13.5) alerts.push({ severity: "warning", message: `Load height ${height}ft exceeds 13.5ft. Height permit required. Verify bridge clearances.` });
      if (weight > 80000) alerts.push({ severity: "critical", message: `GVW ${weight.toLocaleString()} lbs exceeds 80,000 lb limit. Overweight permit required.` });

      return {
        trailerType: "step_deck",
        title: "Step Deck / Drop Deck Regulatory Compliance",
        cargoSecurement: {
          cfr: "49 CFR 393.100-393.136",
          title: "Cargo Securement — Step Deck Specific",
          requirements: [
            { id: "sd_cs_001", rule: "49 CFR 393.126", title: "Heavy Equipment", desc: "4 tiedowns minimum for equipment >10,000 lbs. Chains required. Prevent all movement." },
            { id: "sd_cs_002", rule: "49 CFR 393.110(b)", title: "Minimum WLL", desc: "Aggregate WLL >= 50% cargo weight forward, rearward, and each side." },
            { id: "sd_cs_003", rule: "49 CFR 393.104", title: "Tiedown Condition", desc: "No knots in webbing. All components rated for load. Edge protectors on sharp edges." },
          ],
        },
        heightAdvantage: {
          title: "Step Deck Height Advantage",
          guidelines: [
            { id: "sd_ha_001", title: "Upper Deck", desc: "~60in from ground — same as standard flatbed. Useful for shorter items." },
            { id: "sd_ha_002", title: "Lower Deck", desc: "~38-42in from ground — provides ~18-22in extra height clearance vs flatbed." },
            { id: "sd_ha_003", title: "Loading", desc: "Equipment drives up ramps onto lower deck. No crane required for self-propelled loads." },
          ],
        },
        alerts,
        inspectionChecklist: [
          "Verify all chains/binders rated for load weight (Grade 70/80)",
          "Check ramp condition and weight rating for drive-on loading",
          "Confirm equipment is drained of fluids and bucket/blade lowered",
          "Verify aggregate WLL >= 50% cargo weight in all directions",
          "Check oversize permits on-board if applicable",
          "Confirm bridge clearance for route (lower deck advantage)",
          "Document load dimensions and weight on BOL",
        ],
      };
    }),

  // 9. getAutoCarrierRegulations — vehicle transport, VIN verification, damage reporting
  getAutoCarrierRegulations: protectedProcedure
    .input(z.object({
      vehicleCount: z.number().optional(),
      hasExotics: z.boolean().optional(),
      hasNonRunning: z.boolean().optional(),
    }).optional())
    .query(({ input }) => {
      const vehicleCount = input?.vehicleCount || 0;
      const hasExotics = input?.hasExotics || false;
      const hasNonRunning = input?.hasNonRunning || false;

      return {
        trailerType: "auto_carrier",
        title: "Auto Carrier Regulatory Compliance",
        vehicleSecurement: {
          cfr: "49 CFR 393.128",
          title: "Automobile & Light Truck Securement",
          requirements: [
            { id: "ac_vs_001", rule: "49 CFR 393.128(a)", title: "Minimum Tiedowns", desc: "Minimum 2 tiedowns per vehicle. Must prevent forward, rearward, and lateral movement." },
            { id: "ac_vs_002", rule: "49 CFR 393.128(b)", title: "Wheel Chocks/Tire Straps", desc: "Vehicles must be secured by tire straps, wheel nets, or wheel chocks plus tiedowns." },
            { id: "ac_vs_003", rule: "49 CFR 393.104", title: "Tiedown Rating", desc: "Each tiedown must have sufficient WLL. Ratchet straps or chains per vehicle weight." },
            { id: "ac_vs_004", rule: "49 CFR 393.128(c)", title: "Parking Brake", desc: "Set parking brake on each vehicle. Transmission in Park (auto) or gear (manual)." },
          ],
        },
        conditionReporting: {
          title: "Vehicle Condition Reporting",
          requirements: [
            { id: "ac_cr_001", title: "Pre-Transport Inspection", desc: "Walk-around inspection of every vehicle at pickup. Document existing damage with photos." },
            { id: "ac_cr_002", title: "Condition Report (BOL)", desc: "Detailed condition report signed by shipper and driver. Note scratches, dents, chips." },
            { id: "ac_cr_003", title: "Delivery Inspection", desc: "Walk-around at delivery. Any new damage must be noted and reported immediately." },
            { id: "ac_cr_004", title: "VIN Verification", desc: "Verify VIN matches BOL for every vehicle loaded. Cross-check make/model/color." },
          ],
        },
        specialConsiderations: {
          title: "Special Vehicle Types",
          requirements: [
            ...(hasExotics ? [{ id: "ac_sc_001", title: "Exotic/Luxury Vehicles", desc: "Enclosed carrier recommended. No stacking above exotics. Extra padding/blankets. Covered transport only." }] : []),
            ...(hasNonRunning ? [{ id: "ac_sc_002", title: "Non-Running / Salvage", desc: "Winch required for loading. Verify fluid containment — drip pans under engine/trans. Secure with additional tiedowns." }] : []),
            { id: "ac_sc_003", title: "Electric Vehicles (EVs)", desc: "Heavy due to batteries (4,000-6,000 lbs). May reduce load count. Verify SOC (state of charge) is 20-80%." },
            { id: "ac_sc_004", title: "Drip Pans", desc: "Place drip pans under all vehicles to prevent fluid leaks onto vehicles below." },
          ],
        },
        alerts: vehicleCount > 10 ? [{
          severity: "warning" as const,
          message: `${vehicleCount} vehicles exceeds typical open carrier capacity of 7-10 vehicles. May need multiple loads.`,
        }] : [],
        inspectionChecklist: [
          "Verify VIN for each vehicle matches BOL",
          "Complete condition report with photos at pickup",
          "Set parking brake and transmission in Park on each vehicle",
          "Verify minimum 2 tiedowns per vehicle (tire straps or wheel nets)",
          "Place drip pans under all vehicles",
          hasExotics ? "Use enclosed carrier for exotic/luxury vehicles" : null,
          hasNonRunning ? "Verify winch capacity for non-running vehicles" : null,
          "Check carrier dimensions: 8.5ft width / 13.5ft height / 75ft length",
          "Document vehicle count, VINs, and condition on BOL",
        ].filter(Boolean),
      };
    }),

  // 10. getLivestockRegulations — 28-Hour Law, USDA health certs, animal welfare
  getLivestockRegulations: protectedProcedure
    .input(z.object({
      animalType: z.string().optional(),
      headCount: z.number().optional(),
      isInterstate: z.boolean().optional(),
    }).optional())
    .query(({ input }) => {
      const isInterstate = input?.isInterstate !== false;

      return {
        trailerType: "livestock",
        title: "Livestock Transport Regulatory Compliance",
        twentyEightHourLaw: {
          statute: "49 USC 80502",
          title: "28-Hour Law — Animal Transport",
          requirements: [
            { id: "ls_28_001", rule: "49 USC 80502(a)", title: "Maximum Transit Time", desc: "Animals may not be confined >28 consecutive hours without unloading for feed, water, and rest." },
            { id: "ls_28_002", rule: "49 USC 80502(b)", title: "Rest Period", desc: "Minimum 5 consecutive hours of rest after unloading. Adequate feed, water, and space." },
            { id: "ls_28_003", rule: "49 USC 80502(c)", title: "Extension to 36 Hours", desc: "Shipper may request extension to 36 hours by written consent. Document on BOL." },
            { id: "ls_28_004", title: "Penalty", desc: "Violation: $500-$5,000 per offense. USDA APHIS enforcement." },
          ],
        },
        usdaHealth: isInterstate ? {
          title: "USDA Interstate Health Requirements",
          requirements: [
            { id: "ls_uh_001", title: "Certificate of Veterinary Inspection (CVI)", desc: "Required for interstate transport. Issued by accredited veterinarian within 30 days." },
            { id: "ls_uh_002", title: "Brand Inspection", desc: "Required in western states (MT, WY, SD, CO, NM, NV, ID, etc.). Proof of ownership." },
            { id: "ls_uh_003", title: "Brucellosis/TB Testing", desc: "Some states require negative test results for cattle. Check destination state requirements." },
            { id: "ls_uh_004", title: "Trichomoniasis Testing", desc: "Required for breeding bulls in many states. Test within 60 days." },
            { id: "ls_uh_005", title: "USDA Back Tags", desc: "Back tags required for cattle moving to slaughter. Applied at origin." },
          ],
        } : null,
        animalWelfare: {
          title: "Animal Welfare & Loading Standards",
          requirements: [
            { id: "ls_aw_001", title: "Loading Density", desc: "Cattle: 14-17 sq ft per head (1200 lb). Hogs: 3.6-4.0 sq ft per head (250 lb). Do NOT overload." },
            { id: "ls_aw_002", title: "Ventilation", desc: "Adequate airflow. Adjust louvers for temperature. Livestock generates significant heat." },
            { id: "ls_aw_003", title: "Non-Slip Flooring", desc: "Trailer floor must have non-slip surface. Sand or shavings for bedding." },
            { id: "ls_aw_004", title: "Heat Stress", desc: "Above 80F: reduce loading density 10-15%. Above 90F: consider delaying transport." },
            { id: "ls_aw_005", title: "Cold Stress", desc: "Below 20F: bedding required. Wind chill protection. Fresh-shorn sheep extremely vulnerable." },
            { id: "ls_aw_006", title: "Water", desc: "Water available during rest stops. Cattle drink 10-20 gallons/day." },
          ],
        },
        hosExemption: {
          title: "FMCSA HOS Exemption for Livestock",
          requirements: [
            { id: "ls_hos_001", title: "Agricultural Exemption", desc: "Livestock carriers exempt from HOS within 150 air-miles of source. Check state-specific rules." },
            { id: "ls_hos_002", title: "Adverse Conditions", desc: "Animal welfare emergency allows extended driving to reach unloading facility." },
          ],
        },
        alerts: [],
        inspectionChecklist: [
          "Verify CVI (health certificate) is current and on-board",
          "Check brand inspection documentation (western states)",
          "Verify loading density is within USDA guidelines",
          "Confirm trailer ventilation and non-slip flooring",
          "Check bedding material if required by temperature",
          "Verify 28-hour timer — plan rest stops accordingly",
          "Check water and feed supplies",
          "Confirm destination state entry requirements met",
          "Document head count, species, and origin on BOL",
        ],
      };
    }),

  // 11. getLogTrailerRegulations — 49 CFR 393.116, timber transport
  getLogTrailerRegulations: protectedProcedure
    .input(z.object({
      weight: z.number().optional(),
      logLength: z.number().optional(),
    }).optional())
    .query(({ input }) => {
      const weight = input?.weight || 0;
      const alerts: Array<{ severity: "warning" | "critical"; message: string }> = [];
      if (weight > 88000) alerts.push({ severity: "critical", message: `Weight ${weight.toLocaleString()} lbs exceeds typical timber overweight tolerance. Check state limits.` });

      return {
        trailerType: "log_trailer",
        title: "Log Trailer Regulatory Compliance",
        cargoSecurement: {
          cfr: "49 CFR 393.116",
          title: "Logs — Specific Securement Requirements",
          requirements: [
            { id: "lt_cs_001", rule: "49 CFR 393.116(a)", title: "Shortwood (<=10ft Bunks)", desc: "Minimum 2 tiedowns per stack. Outer logs must not extend above stakes." },
            { id: "lt_cs_002", rule: "49 CFR 393.116(b)", title: "Longwood (Tree-Length)", desc: "Center bunk tiedowns plus end restraints. Prevent forward/rearward shifting." },
            { id: "lt_cs_003", rule: "49 CFR 393.116(c)", title: "Independent Stacks", desc: "Each stack must be independently secured. Adjacent stack failure must not cause cascade." },
            { id: "lt_cs_004", rule: "49 CFR 393.116(d)", title: "Wrapper Chains", desc: "Wrapper chains around each bunk. Binders tight. No slack." },
            { id: "lt_cs_005", title: "Stakes/Bolsters", desc: "Trailer stakes must be in good condition. Proper height above log stack. Check welds." },
          ],
        },
        weightCompliance: {
          title: "Timber Weight Compliance",
          requirements: [
            { id: "lt_wc_001", title: "State Overweight Tolerance", desc: "Many states allow 5-10% overweight for timber/forest products. Check route states." },
            { id: "lt_wc_002", title: "Scaled Weight", desc: "Get scaled weight ticket at origin (log yard or scale). Some states require certified scales." },
            { id: "lt_wc_003", title: "Axle Weight Distribution", desc: "Tri-axle and spread-axle trailers common. Proper bunk placement for weight distribution." },
          ],
        },
        safetyRequirements: {
          title: "Logging Truck Safety",
          requirements: [
            { id: "lt_sr_001", title: "Road Conditions", desc: "Logging roads often unpaved, steep, narrow. Low-range gearing. Jake brake recommended." },
            { id: "lt_sr_002", title: "Rollover Risk", desc: "High center of gravity. Reduce speed on curves. Load wider logs on bottom." },
            { id: "lt_sr_003", title: "Debris", desc: "Loose bark and limbs must be secured. No debris falling from load onto roadway." },
          ],
        },
        alerts,
        inspectionChecklist: [
          "Verify wrapper chains tight on each bunk",
          "Check all stakes/bolsters for damage or cracks",
          "Confirm no logs extend above stake height",
          "Get scaled weight ticket at origin",
          "Check state timber transport permits on-board",
          "Verify binders are properly tightened",
          "Remove loose bark/debris that could fall on roadway",
          "Check brake system — logging trucks need maximum braking",
          "Document species, volume (MBF or tons), and destination on BOL",
        ],
      };
    }),

  // 12. getGrainHopperRegulations — USDA grain inspection, harvest overweight
  getGrainHopperRegulations: protectedProcedure
    .input(z.object({
      grainType: z.string().optional(),
      bushels: z.number().optional(),
      isHarvestSeason: z.boolean().optional(),
    }).optional())
    .query(({ input }) => {
      const bushels = input?.bushels || 0;
      const isHarvest = input?.isHarvestSeason || false;

      return {
        trailerType: "grain_hopper",
        title: "Grain Hopper Regulatory Compliance",
        usdaGrading: {
          title: "USDA Federal Grain Inspection Service (FGIS)",
          requirements: [
            { id: "gh_ug_001", title: "Grade Determination", desc: "Grain graded at elevator by FGIS-licensed inspector. Grade determines price and acceptance." },
            { id: "gh_ug_002", title: "Moisture Content", desc: "Must meet grade spec. Corn: 15.5% max (#2). Wet grain may be docked or rejected." },
            { id: "gh_ug_003", title: "Test Weight", desc: "Bushel weight determines grade. Corn #2: 54 lbs/bu min. Wheat #1: 60 lbs/bu min." },
            { id: "gh_ug_004", title: "Foreign Material / Damage", desc: "Max % foreign material, damaged kernels, heat damage per grade. Affects price." },
            { id: "gh_ug_005", title: "Mycotoxin Testing", desc: "Aflatoxin, DON/vomitoxin, fumonisin testing may be required. FDA action levels apply." },
          ],
        },
        weightCompliance: {
          title: "Weight Compliance & Harvest Exemptions",
          requirements: [
            { id: "gh_wc_001", title: "Federal GVW", desc: "80,000 lbs on interstate. Grain hopper tare ~12,000-14,000 lbs. Max payload ~46,000 lbs." },
            { id: "gh_wc_002", title: "Harvest Exemption", desc: isHarvest
              ? "HARVEST SEASON ACTIVE: Many states allow 5-10% overweight for grain from field to elevator. Check state-specific rules."
              : "Outside harvest season — standard weight limits apply. Some states have year-round ag tolerance." },
            { id: "gh_wc_003", title: "Scale Tickets", desc: "Weigh at certified scale. Weight ticket required for elevator delivery." },
          ],
        },
        trailerRequirements: {
          title: "Grain Hopper Trailer Requirements",
          requirements: [
            { id: "gh_tr_001", title: "Clean Trailer", desc: "No cross-contamination. Sweep thoroughly between grain types. Identity-preserved (IP) loads need dedicated clean trailers." },
            { id: "gh_tr_002", title: "Hopper Lids", desc: "All lids must seal completely. Moisture intrusion ruins grain. Check gaskets." },
            { id: "gh_tr_003", title: "Hopper Gates", desc: "Gates must open/close properly for gravity unloading. No grain leakage during transport." },
            { id: "gh_tr_004", title: "Fumigation Records", desc: "If hauling stored grain, fumigation records may be required. Document treatment dates/chemicals." },
          ],
        },
        alerts: bushels > 1000 ? [{
          severity: "warning" as const,
          message: `${bushels.toLocaleString()} bushels may exceed single-trailer capacity (~900-1000 bushels typical). Verify weight.`,
        }] : [],
        inspectionChecklist: [
          "Sweep trailer clean — no residual grain from prior load",
          "Check all hopper lids seal properly (gaskets intact)",
          "Verify hopper gates operate and don't leak",
          "Get scaled weight at certified scale",
          isHarvest ? "Verify harvest season overweight tolerance for route states" : "Confirm weight within 80,000 lb GVW limit",
          "Check grain moisture and condition before loading",
          "Document grain type, grade, bushels, and weight on BOL",
          "Verify destination elevator acceptance criteria",
        ].filter(Boolean),
      };
    }),

  // 13. getRegulatorySummary — quick overview of all regulatory requirements for a trailer type
  getRegulatorySummary: protectedProcedure
    .input(z.object({
      trailerType: z.string(),
      productId: z.string().optional(),
      productName: z.string().optional(),
    }))
    .query(({ input }) => {
      const summaries: Record<string, {
        title: string;
        primaryRegulations: string[];
        keyRequirements: string[];
        driverEndorsements: string[];
        permitTypes: string[];
      }> = {
        dry_van: {
          title: "Dry Van",
          primaryRegulations: ["49 CFR 393 Subpart I (Cargo Securement)", "23 USC 127 (Weight Limits)", "Bridge Formula B"],
          keyRequirements: ["Tiedowns per 49 CFR 393.106", "80,000 lb GVW limit", "Load bars for partials", "Axle weight distribution"],
          driverEndorsements: ["CDL Class A"],
          permitTypes: ["Overweight (if >80,000 lbs with divisible load permit)"],
        },
        reefer: {
          title: "Refrigerated (Reefer)",
          primaryRegulations: ["21 CFR 1.900-1.934 (FSMA Sanitary Transport)", "49 CFR 393 (Cargo Securement)", "USDA/FSIS (Meat/Poultry)"],
          keyRequirements: ["Pre-cool trailer before loading", "Continuous temp monitoring (data logger)", "FSMA training records", "Food-grade washout between loads", "12-month record retention"],
          driverEndorsements: ["CDL Class A"],
          permitTypes: [],
        },
        flatbed: {
          title: "Flatbed",
          primaryRegulations: ["49 CFR 393.100-393.136 (Cargo Securement)", "49 CFR 393.114-393.132 (Commodity-Specific)", "State Oversize/Overweight Laws"],
          keyRequirements: ["WLL >= 50% cargo weight each direction", "Commodity-specific securement (coils, lumber, pipe)", "Oversize permits for width >8.5ft / height >13.5ft", "Escort vehicles for superloads", "OVERSIZE LOAD signage"],
          driverEndorsements: ["CDL Class A"],
          permitTypes: ["Width Permit", "Height Permit", "Length Permit", "Overweight Permit", "Superload Permit"],
        },
        bulk_hopper: {
          title: "Dry Bulk / Hopper",
          primaryRegulations: ["23 USC 127 (Weight Limits)", "NFPA 652 (Combustible Dust)", "OSHA 1926.501 (Fall Protection)", "21 CFR 1.900-1.934 (FSMA — food-grade only)"],
          keyRequirements: ["MAWP compliance for pneumatic unload", "Static grounding for dry powders", "Certified scale weight tickets", "PPE: respirator for silica/cement", "Food-grade COC washout (if applicable)"],
          driverEndorsements: ["CDL Class A"],
          permitTypes: ["Agricultural overweight tolerance (harvest season, some states)"],
        },
        food_grade_tank: {
          title: "Food-Grade Liquid Tank",
          primaryRegulations: ["21 CFR 1.900-1.934 (FSMA)", "FDA Food Safety", "PMO (Pasteurized Milk Ordinance — dairy)", "3-A Sanitary Standards"],
          keyRequirements: ["CIP (Clean-In-Place) between loads", "Wash ticket from certified facility", "Prior 3-load disclosure", "304/316L stainless steel", "Tri-clamp sanitary fittings", "Temp monitoring for perishables"],
          driverEndorsements: ["CDL Class A", "N (Tanker) Endorsement"],
          permitTypes: ["PMO Permit (Grade A dairy)", "State food transport license"],
        },
        water_tank: {
          title: "Water Tank",
          primaryRegulations: ["42 USC 300f (Safe Drinking Water Act — potable)", "EPA UIC Program (oilfield disposal)", "NSF/ANSI 61 (potable tank certification)", "OSHA H2S standards (oilfield)"],
          keyRequirements: ["NSF 61 certification (potable)", "Chlorine residual testing (potable)", "SWD well permits (oilfield)", "Surge/baffle safety — highest rollover risk", "5% headspace for thermal expansion"],
          driverEndorsements: ["CDL Class A", "N (Tanker) Endorsement"],
          permitTypes: ["State water hauler permit (potable)", "EPA UIC Class II (oilfield disposal)", "SPCC plan (near waterways)"],
        },
        step_deck: {
          title: "Step Deck / Drop Deck",
          primaryRegulations: ["49 CFR 393.100-393.136 (Cargo Securement)", "49 CFR 393.126 (Heavy Vehicles/Equipment)", "State Oversize/Overweight Laws"],
          keyRequirements: ["WLL >= 50% cargo weight each direction", "4-point chain minimum for equipment >10,000 lbs", "Height clearance advantage — verify bridge ratings", "Oversize permits if width >8.5ft", "Equipment must be drained of fluids/fuel"],
          driverEndorsements: ["CDL Class A"],
          permitTypes: ["Width Permit", "Height Permit", "Overweight Permit"],
        },
        lowboy: {
          title: "Lowboy / RGN",
          primaryRegulations: ["49 CFR 393.126 (Heavy Vehicles/Equipment/Machinery)", "49 CFR 393.100-393.136 (Cargo Securement)", "State Superload Laws", "FHWA Bridge Formula"],
          keyRequirements: ["Detachable gooseneck for drive-on loading", "4-point chain minimum — Grade 80 chains for >40k lbs", "Route survey for superloads (bridge ratings, turn radii)", "Pilot/escort vehicles for oversize", "Equipment drained, blade/bucket lowered"],
          driverEndorsements: ["CDL Class A"],
          permitTypes: ["Width Permit", "Height Permit", "Overweight Permit", "Superload Permit", "State DOT Route Approval"],
        },
        double_drop: {
          title: "Double Drop / Stretch",
          primaryRegulations: ["49 CFR 393.126 (Heavy Vehicles/Equipment)", "49 CFR 393.100-393.136 (Cargo Securement)", "State Superload Laws"],
          keyRequirements: ["Maximum well depth for tall cargo", "Route survey mandatory for height-critical loads", "Bridge clearance verification at every overpass", "Multi-axle weight distribution", "Escort vehicles front and rear"],
          driverEndorsements: ["CDL Class A"],
          permitTypes: ["Width Permit", "Height Permit", "Length Permit", "Overweight Permit", "Superload Permit"],
        },
        conestoga: {
          title: "Conestoga (Rolling-Tarp)",
          primaryRegulations: ["49 CFR 393.100-393.136 (Cargo Securement)", "49 CFR 393.118 (Metal Coils/Pipe)", "49 CFR 393.114 (Lumber)"],
          keyRequirements: ["Weather protection without tarping delay", "Same securement as flatbed — WLL >= 50%", "Coil racks for steel coils", "No moisture damage for paper/drywall/cement", "Side-loading capability for forklifts"],
          driverEndorsements: ["CDL Class A"],
          permitTypes: ["Overweight Permit (if applicable)"],
        },
        auto_carrier: {
          title: "Auto Carrier / Car Hauler",
          primaryRegulations: ["49 CFR 393.128 (Automobiles/Light Trucks)", "49 CFR 393.104 (Tiedown Devices)", "FMCSA Vehicle Transport Regulations"],
          keyRequirements: ["Minimum 2 tiedowns per vehicle (49 CFR 393.128)", "Prevent forward/rearward/lateral movement", "Drip pans for fluid leaks", "VIN verification before loading", "Damage inspection report (condition report) at pickup and delivery", "Maximum 8.5ft width / 13.5ft height / 75ft length"],
          driverEndorsements: ["CDL Class A"],
          permitTypes: [],
        },
        livestock: {
          title: "Livestock / Cattle Pot",
          primaryRegulations: ["49 USC 80502 (28-Hour Law)", "USDA APHIS 9 CFR (Animal Transport)", "FMCSA HOS Exemption for Livestock", "State Brand Inspection Laws"],
          keyRequirements: ["28-Hour Rule: unload for feed/water/rest every 28 hrs", "USDA health certificates for interstate transport", "Brand inspection at origin (western states)", "Temperature monitoring — heat stress kills", "Trailer ventilation and non-slip flooring", "Loading density per USDA guidelines"],
          driverEndorsements: ["CDL Class A"],
          permitTypes: ["USDA Health Certificate (CVI)", "State Brand Inspection", "State Livestock Transport Permit"],
        },
        log_trailer: {
          title: "Log Trailer",
          primaryRegulations: ["49 CFR 393.116 (Logs — Specific Securement)", "State Forest Products Transport Laws", "State Weight Tolerance (Timber)"],
          keyRequirements: ["49 CFR 393.116: minimum 2 tiedowns for <10ft bunk", "Each stack independently secured", "Wrapper chains on each bunk", "No logs extending beyond trailer stakes", "Scaled weight ticket from certified scales", "State timber harvest permits"],
          driverEndorsements: ["CDL Class A"],
          permitTypes: ["State Timber Transport Permit", "Forest Road Access Permit", "Agricultural/Timber Overweight Tolerance"],
        },
        grain_hopper: {
          title: "Grain Hopper",
          primaryRegulations: ["USDA Federal Grain Inspection Service (FGIS)", "23 USC 127 (Weight Limits)", "State Harvest Season Overweight Tolerance"],
          keyRequirements: ["USDA grade inspection at elevator", "Certified scale weight tickets", "Hopper lids sealed to prevent moisture/contamination", "Clean trailer — no cross-contamination between grain types", "Fumigation records if stored grain", "Harvest season overweight tolerance (5-10% in many states)"],
          driverEndorsements: ["CDL Class A"],
          permitTypes: ["Harvest Season Overweight Permit", "State Agricultural Exemption"],
        },
      };

      return summaries[input.trailerType] || {
        title: input.trailerType,
        primaryRegulations: ["49 CFR 393 (General Cargo Securement)"],
        keyRequirements: ["Standard CMV inspection", "Weight compliance"],
        driverEndorsements: ["CDL Class A"],
        permitTypes: [],
      };
    }),
});
