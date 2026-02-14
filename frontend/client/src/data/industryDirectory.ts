/**
 * INDUSTRY DIRECTORY DATA
 * Oil & Gas Companies, Hazmat Catalysts, Fuel Resellers, and Terminals
 * Organized by state and company type
 */

export type CompanyType = 
  | "refinery" 
  | "shipper" 
  | "catalyst" 
  | "terminal" 
  | "fuel_reseller" 
  | "logistics" 
  | "exploration";

export type State = 
  | "TX" | "LA" | "CA" | "IL" | "PA" | "OH" | "NJ";

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  state: State;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  services: string[];
  isVerified?: boolean;
}

// ============================================================================
// TEXAS COMPANIES
// ============================================================================

export const TEXAS_COMPANIES: Company[] = [
  // Oil & Gas Majors
  {
    id: "tx-exxon",
    name: "ExxonMobil",
    type: "refinery",
    state: "TX",
    city: "Irving",
    phone: "(972) 444-1000",
    website: "https://corporate.exxonmobil.com",
    services: ["Oil & Gas Refining", "Petrochemicals", "Fuel Distribution"],
    isVerified: true,
  },
  {
    id: "tx-valero",
    name: "Valero Energy Corporation",
    type: "refinery",
    state: "TX",
    city: "San Antonio",
    phone: "(210) 345-2000",
    website: "https://www.valero.com",
    services: ["Refining", "Marketing", "Fuel Distribution"],
    isVerified: true,
  },
  {
    id: "tx-hollyfrontier",
    name: "HollyFrontier Corporation (HF Sinclair)",
    type: "refinery",
    state: "TX",
    city: "Dallas",
    phone: "(214) 871-3555",
    website: "https://www.hfsinclair.com",
    services: ["Refining", "Marketing", "Lubricants"],
    isVerified: true,
  },
  {
    id: "tx-apache",
    name: "Apache Corporation (APA)",
    type: "exploration",
    state: "TX",
    city: "Houston",
    phone: "(713) 296-6000",
    website: "https://www.apacorp.com",
    services: ["Exploration", "Production", "Oil & Gas"],
    isVerified: true,
  },
  {
    id: "tx-nustar",
    name: "NuStar Energy",
    type: "terminal",
    state: "TX",
    city: "San Antonio",
    phone: "(210) 918-2000",
    website: "https://www.nustarenergy.com",
    services: ["Pipeline Operations", "Terminal Operations", "Crude Oil Storage"],
    isVerified: true,
  },
  {
    id: "tx-suncoast",
    name: "Sun Coast Resources, LLC",
    type: "fuel_reseller",
    state: "TX",
    city: "Houston",
    phone: "(800) 677-3835",
    website: "https://www.suncoastresources.com",
    services: ["Fuel Distribution", "Lubricants", "Chemicals"],
    isVerified: true,
  },
  {
    id: "tx-enlink",
    name: "EnLink Midstream",
    type: "logistics",
    state: "TX",
    city: "Dallas",
    phone: "(214) 953-9500",
    website: "https://www.enlink.com",
    services: ["Natural Gas Gathering", "Crude Oil Transportation", "Midstream Services"],
    isVerified: true,
  },
  {
    id: "tx-texasfueling",
    name: "Texas Fueling Services, Inc.",
    type: "fuel_reseller",
    state: "TX",
    city: "Houston",
    phone: "(281) 443-2336",
    website: "https://www.texasfueling.com",
    services: ["Bulk Fueling", "Frac Fueling", "Mobile Fueling"],
    isVerified: true,
  },
  {
    id: "tx-colonial",
    name: "Colonial Oil Industries, Inc.",
    type: "fuel_reseller",
    state: "TX",
    city: "Houston",
    phone: "(713) 219-8200",
    website: "https://www.colonialgroupinc.com",
    services: ["Fuel Distribution", "Logistics"],
    isVerified: true,
  },
  {
    id: "tx-pilot",
    name: "Pilot Thomas Logistics",
    type: "logistics",
    state: "TX",
    phone: "(844) 785-8326",
    website: "https://www.pilotthomas.com",
    services: ["Fuel Delivery", "Logistics", "Energy Services"],
    isVerified: true,
  },
  {
    id: "tx-petromax",
    name: "PetroMax",
    type: "fuel_reseller",
    state: "TX",
    city: "Dallas",
    phone: "(972) 665-1990",
    website: "https://www.petromaxfuels.com",
    services: ["Fuel Distribution", "Fleet Fueling"],
    isVerified: true,
  },
  {
    id: "tx-ricochet",
    name: "Ricochet Fuel Distributors",
    type: "fuel_reseller",
    state: "TX",
    website: "https://www.ricochetfuel.com",
    services: ["Fuel Distribution", "Fleet Services"],
    isVerified: false,
  },
  {
    id: "tx-reeder",
    name: "Reeder Distributors",
    type: "fuel_reseller",
    state: "TX",
    website: "https://reederdistributors.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "tx-king",
    name: "King Fuels",
    type: "fuel_reseller",
    state: "TX",
    website: "https://kingfuels.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "tx-campbell",
    name: "Campbell Oil Company",
    type: "fuel_reseller",
    state: "TX",
    phone: "(409) 379-2021",
    website: "https://campbelloilco.com",
    services: ["Gasoline", "Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "tx-kendrick",
    name: "Kendrick Oil Company",
    type: "fuel_reseller",
    state: "TX",
    phone: "(806) 250-3991",
    website: "https://kendrickoil.com",
    services: ["Diesel", "Gasoline", "Propane", "Kerosene"],
    isVerified: false,
  },
];

// ============================================================================
// LOUISIANA COMPANIES
// ============================================================================

export const LOUISIANA_COMPANIES: Company[] = [
  {
    id: "la-badger",
    name: "Badger Oil Corporation",
    type: "exploration",
    state: "LA",
    phone: "(337) 234-2485",
    services: ["Exploration", "Production"],
    isVerified: false,
  },
  {
    id: "la-valero-stcharles",
    name: "Valero St. Charles Refinery",
    type: "refinery",
    state: "LA",
    city: "Norco",
    phone: "(504) 764-4747",
    website: "https://www.valero.com",
    services: ["Petroleum Refining", "Fuel Production"],
    isVerified: true,
  },
  {
    id: "la-shell-norco",
    name: "Shell Norco Refining",
    type: "refinery",
    state: "LA",
    city: "Norco",
    phone: "(504) 464-2211",
    website: "https://www.shell.com",
    services: ["Chemical Refining", "Petroleum Refining"],
    isVerified: true,
  },
  {
    id: "la-crescent",
    name: "Crescent Midstream",
    type: "terminal",
    state: "LA",
    phone: "(985) 288-9300",
    services: ["Oil & Gas Gathering", "Storage", "Pipeline Services"],
    isVerified: true,
  },
  {
    id: "la-pelican",
    name: "Pelican Energy Consultants",
    type: "logistics",
    state: "LA",
    phone: "(985) 809-6727",
    website: "https://www.pelicanenergy.com",
    services: ["Midstream Solutions", "Upstream Operations"],
    isVerified: false,
  },
  {
    id: "la-pbf",
    name: "PBF Energy Chalmette Refining",
    type: "refinery",
    state: "LA",
    city: "Chalmette",
    phone: "(504) 279-4086",
    website: "https://www.pbfenergy.com",
    services: ["Refining", "Petroleum Distribution"],
    isVerified: true,
  },
  {
    id: "la-citgo",
    name: "CITGO Petroleum Corporation",
    type: "refinery",
    state: "LA",
    city: "Lake Charles",
    phone: "(337) 491-4000",
    website: "https://www.citgo.com",
    services: ["Fuel Distribution", "Refining"],
    isVerified: true,
  },
  {
    id: "la-reagan",
    name: "Reagan Power & Compression",
    type: "fuel_reseller",
    state: "LA",
    phone: "(504) 467-7504",
    website: "https://www.reaganpower.com",
    services: ["Fuel Supply", "Energy Management"],
    isVerified: false,
  },
  {
    id: "la-lard",
    name: "Lard Oil Company",
    type: "fuel_reseller",
    state: "LA",
    phone: "(800) 738-7734",
    website: "https://www.lardoil.com",
    services: ["Fuel Distribution", "Lubricants"],
    isVerified: false,
  },
  {
    id: "la-central",
    name: "Central Oil & Supply Corporation",
    type: "fuel_reseller",
    state: "LA",
    website: "https://central-oil.com",
    services: ["Fuel Distribution", "Oil Supply"],
    isVerified: false,
  },
  {
    id: "la-miguez",
    name: "Miguez Fuel & Lubricants",
    type: "fuel_reseller",
    state: "LA",
    website: "https://miguezfuel.com",
    services: ["Fuel", "Lubricants"],
    isVerified: false,
  },
  {
    id: "la-retif",
    name: "Retif Oil & Fuel",
    type: "fuel_reseller",
    state: "LA",
    website: "https://www.retif.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
];

// ============================================================================
// CALIFORNIA COMPANIES
// ============================================================================

export const CALIFORNIA_COMPANIES: Company[] = [
  {
    id: "ca-chevron",
    name: "Chevron Corporation",
    type: "refinery",
    state: "CA",
    city: "San Ramon",
    phone: "(925) 842-1000",
    website: "https://www.chevron.com",
    services: ["Oil & Gas Refining", "Distribution", "Trading"],
    isVerified: true,
  },
  {
    id: "ca-phillips66",
    name: "Phillips 66",
    type: "refinery",
    state: "CA",
    phone: "(877) 704-9653",
    website: "https://www.phillips66.com",
    services: ["Petroleum", "Gas", "Chemicals"],
    isVerified: true,
  },
  {
    id: "ca-beacon",
    name: "Beacon Oil Company",
    type: "exploration",
    state: "CA",
    services: ["Oil & Gas Operations"],
    isVerified: false,
  },
  {
    id: "ca-kindermorganep",
    name: "Kinder Morgan Energy Partners",
    type: "terminal",
    state: "CA",
    phone: "(714) 560-4400",
    website: "https://www.kindermorgan.com",
    services: ["Fuel Transportation", "Storage", "Natural Gas Pipelines"],
    isVerified: true,
  },
  {
    id: "ca-valleypacific",
    name: "Valley Pacific Petroleum",
    type: "fuel_reseller",
    state: "CA",
    phone: "(209) 334-2145",
    services: ["Fuels", "Lubricants", "Chemical Products"],
    isVerified: false,
  },
  {
    id: "ca-allchemical",
    name: "All Chemical Transport Corp",
    type: "catalyst",
    state: "CA",
    phone: "(800) 451-2436",
    website: "https://allchemical.com",
    services: ["Liquid Bulk Transport", "Hazardous Materials", "Chemical Logistics"],
    isVerified: true,
  },
  {
    id: "ca-powersource",
    name: "Powersource Transportation",
    type: "catalyst",
    state: "CA",
    phone: "(800) 438-8789",
    website: "https://www.powersourcetrans.com",
    services: ["Bulk Liquid", "Hopper-Bottom Trailers", "Hazardous Materials"],
    isVerified: true,
  },
  {
    id: "ca-scfuels",
    name: "SC Fuels",
    type: "fuel_reseller",
    state: "CA",
    website: "https://www.scfuels.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "ca-woodoil",
    name: "Wood Oil Co.",
    type: "fuel_reseller",
    state: "CA",
    website: "https://woodoilcompany.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
];

// ============================================================================
// ILLINOIS COMPANIES
// ============================================================================

export const ILLINOIS_COMPANIES: Company[] = [
  {
    id: "il-adm",
    name: "ADM (Archer Daniels Midland)",
    type: "refinery",
    state: "IL",
    city: "Chicago",
    phone: "(312) 634-8100",
    website: "https://www.adm.com",
    services: ["Agriculture", "Oil Refining", "Biofuels"],
    isVerified: true,
  },
  {
    id: "il-kindermogan",
    name: "Kinder Morgan",
    type: "terminal",
    state: "IL",
    city: "Chicago",
    phone: "(630) 725-1000",
    website: "https://www.kindermorgan.com",
    services: ["Oil & Gas Storage", "Transport"],
    isVerified: true,
  },
  {
    id: "il-marathon",
    name: "Marathon Petroleum Corporation",
    type: "refinery",
    state: "IL",
    phone: "(419) 422-2121",
    website: "https://www.marathonpetroleum.com",
    services: ["Oil Refining", "Transport"],
    isVerified: true,
  },
  {
    id: "il-buckeye",
    name: "Buckeye Partners LP",
    type: "terminal",
    state: "IL",
    phone: "(630) 968-9300",
    services: ["Transportation", "Storage", "Petroleum Products"],
    isVerified: true,
  },
  {
    id: "il-sully",
    name: "Sully Transport, Inc.",
    type: "catalyst",
    state: "IL",
    phone: "(641) 594-3435",
    website: "https://sullytransport.com",
    services: ["Hazardous Bulk Liquids", "Propane", "Ammonia", "Jet Fuel"],
    isVerified: true,
  },
  {
    id: "il-par",
    name: "PAR Trucking Inc",
    type: "catalyst",
    state: "IL",
    phone: "(708) 924-6163",
    website: "https://www.partrucking.com",
    services: ["Bulk Liquid Chemical Transport"],
    isVerified: true,
  },
  {
    id: "il-schwerman",
    name: "Schwerman Trucking Co.",
    type: "catalyst",
    state: "IL",
    phone: "(847) 273-7700",
    website: "https://schwerman.com",
    services: ["Liquid Bulk Transportation", "Dry Bulk Transportation"],
    isVerified: true,
  },
  {
    id: "il-dupre",
    name: "Dupré Logistics",
    type: "catalyst",
    state: "IL",
    phone: "(708) 424-0200",
    website: "https://duprelogistics.com",
    services: ["Hazardous Transportation", "Non-Hazardous Bulk Transportation"],
    isVerified: true,
  },
  {
    id: "il-hittman",
    name: "Hittman Transport Services",
    type: "catalyst",
    state: "IL",
    phone: "(800) 987-6663",
    website: "https://hittmantransport.com",
    services: ["Radioactive Material Transport", "Hazardous Material Transport"],
    isVerified: true,
  },
  {
    id: "il-mohr",
    name: "Mohr Oil Co.",
    type: "fuel_reseller",
    state: "IL",
    website: "http://mohroil.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "il-noil",
    name: "Noil Corp Inc.",
    type: "fuel_reseller",
    state: "IL",
    website: "https://www.noilcorp.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "il-parent",
    name: "Parent Petroleum",
    type: "fuel_reseller",
    state: "IL",
    website: "https://www.parentpetroleum.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "il-avalon",
    name: "Avalon Petroleum",
    type: "fuel_reseller",
    state: "IL",
    website: "https://www.avalonpetroleum.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
];

// ============================================================================
// PENNSYLVANIA COMPANIES
// ============================================================================

export const PENNSYLVANIA_COMPANIES: Company[] = [
  {
    id: "pa-sunoco",
    name: "Sunoco LP",
    type: "refinery",
    state: "PA",
    city: "Philadelphia",
    phone: "(215) 977-3000",
    website: "https://www.sunoco.com",
    services: ["Oil & Gas Refining", "Marketing", "Bulk Fuel Distribution"],
    isVerified: true,
  },
  {
    id: "pa-pbf",
    name: "PBF Energy",
    type: "refinery",
    state: "PA",
    phone: "(732) 750-6000",
    website: "https://www.pbfenergy.com",
    services: ["Refining", "Logistics"],
    isVerified: true,
  },
  {
    id: "pa-conoco",
    name: "ConocoPhillips Refinery",
    type: "refinery",
    state: "PA",
    phone: "(800) 527-5476",
    website: "https://www.conocophillips.com",
    services: ["Oil Refining", "Marketing"],
    isVerified: true,
  },
  {
    id: "pa-guttman",
    name: "Guttman Energy",
    type: "fuel_reseller",
    state: "PA",
    phone: "(724) 489-5130",
    services: ["Fuel Distribution", "Risk Management", "Energy Services"],
    isVerified: true,
  },
  {
    id: "pa-americanrefining",
    name: "American Refining Group",
    type: "refinery",
    state: "PA",
    phone: "(814) 368-1200",
    services: ["Oil Refining", "Lubricants Production"],
    isVerified: true,
  },
  {
    id: "pa-penntank",
    name: "Penn Tank Lines, Inc.",
    type: "catalyst",
    state: "PA",
    phone: "(610) 444-6000",
    website: "https://penntanklines.com",
    services: ["Petroleum Transport", "Chemical Transport"],
    isVerified: true,
  },
  {
    id: "pa-ward",
    name: "Ward Trucking",
    type: "catalyst",
    state: "PA",
    phone: "(800) 458-3625",
    website: "https://wardtrucking.com",
    services: ["Liquid Bulk", "Specialized Services"],
    isVerified: true,
  },
  {
    id: "pa-aduie",
    name: "A. Duie Pyle, Inc.",
    type: "catalyst",
    state: "PA",
    phone: "(800) 523-5020",
    website: "https://aduiepyle.com",
    services: ["LTL", "Logistics", "Hazardous Freight Services"],
    isVerified: true,
  },
  {
    id: "pa-langer",
    name: "Langer Transport Corp.",
    type: "catalyst",
    state: "PA",
    phone: "(800) 362-5218",
    website: "https://langertransport.com",
    services: ["Hazardous Material Transportation"],
    isVerified: true,
  },
  {
    id: "pa-patransformer",
    name: "Pennsylvania Transformer Technology",
    type: "catalyst",
    state: "PA",
    phone: "(724) 346-8146",
    website: "https://patransformer.com",
    services: ["Bulk Hazardous Material Transport"],
    isVerified: false,
  },
  {
    id: "pa-export",
    name: "Export Fuel Co. Inc.",
    type: "fuel_reseller",
    state: "PA",
    website: "https://exportfuel.com",
    services: ["Fuel Products"],
    isVerified: false,
  },
  {
    id: "pa-manor",
    name: "Manor Fuels Inc.",
    type: "fuel_reseller",
    state: "PA",
    website: "https://www.manorfuels.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "pa-cardinal",
    name: "Cardinal USA Fuel Oil",
    type: "fuel_reseller",
    state: "PA",
    website: "https://www.cardinalusa.com",
    services: ["Fuel Oil"],
    isVerified: false,
  },
  {
    id: "pa-aero",
    name: "Aero Energy",
    type: "fuel_reseller",
    state: "PA",
    website: "https://www.aeroenergy.com",
    services: ["Heating Oil", "Fuel Delivery"],
    isVerified: false,
  },
];

// ============================================================================
// OHIO COMPANIES
// ============================================================================

export const OHIO_COMPANIES: Company[] = [
  {
    id: "oh-bphusky",
    name: "BP Husky Toledo Refinery",
    type: "refinery",
    state: "OH",
    city: "Toledo",
    phone: "(419) 698-9701",
    services: ["Refining", "Petrochemicals"],
    isVerified: true,
  },
  {
    id: "oh-marathon",
    name: "Marathon Petroleum Corporation",
    type: "refinery",
    state: "OH",
    phone: "(419) 422-2121",
    website: "https://www.marathonpetroleum.com",
    services: ["Refining"],
    isVerified: true,
  },
  {
    id: "oh-ngl",
    name: "NGL Energy Partners LP",
    type: "logistics",
    state: "OH",
    phone: "(800) 905-4012",
    website: "https://www.nglenergypartners.com",
    services: ["Liquid Bulk Transport"],
    isVerified: true,
  },
  {
    id: "oh-rj",
    name: "R&J Trucking Inc.",
    type: "catalyst",
    state: "OH",
    phone: "(800) 262-9365",
    website: "https://rjtrucking.com",
    services: ["Dry Bulk", "Hazardous Materials"],
    isVerified: true,
  },
  {
    id: "oh-venture",
    name: "Venture Logistics",
    type: "catalyst",
    state: "OH",
    phone: "(614) 876-9961",
    website: "https://venturelogistics.com",
    services: ["Bulk Hazardous Material Transport"],
    isVerified: true,
  },
  {
    id: "oh-kenan",
    name: "Kenan Advantage Group",
    type: "catalyst",
    state: "OH",
    phone: "(800) 969-5466",
    website: "https://thekag.com",
    services: ["Fuels", "Chemicals", "Bulk Transport"],
    isVerified: true,
  },
  {
    id: "oh-savage",
    name: "Savage Services",
    type: "logistics",
    state: "OH",
    phone: "(800) 827-4439",
    website: "https://savageservices.com",
    services: ["Oil & Gas Logistics", "Hazardous Material Logistics"],
    isVerified: true,
  },
  {
    id: "oh-schneider",
    name: "Schneider National Bulk Catalysts",
    type: "catalyst",
    state: "OH",
    phone: "(800) 558-6767",
    website: "https://schneider.com",
    services: ["Hazardous Bulk Transport"],
    isVerified: true,
  },
  {
    id: "oh-oilworks",
    name: "Oilworks, LLC",
    type: "fuel_reseller",
    state: "OH",
    website: "https://oilworksllc.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "oh-kuhlwein",
    name: "Kuhlwein Petroleum Co.",
    type: "fuel_reseller",
    state: "OH",
    website: "https://www.kuhlweinpetroleum.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "oh-duncan",
    name: "Duncan Oil Company",
    type: "fuel_reseller",
    state: "OH",
    website: "https://duncan-oil.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "oh-mansfield",
    name: "Mansfield Service Partners",
    type: "fuel_reseller",
    state: "OH",
    website: "https://msp.energy",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
];

// ============================================================================
// NEW JERSEY COMPANIES
// ============================================================================

export const NEW_JERSEY_COMPANIES: Company[] = [
  {
    id: "nj-exxon",
    name: "ExxonMobil Refinery",
    type: "refinery",
    state: "NJ",
    phone: "(732) 388-5300",
    website: "https://corporate.exxonmobil.com",
    services: ["Oil Refining"],
    isVerified: true,
  },
  {
    id: "nj-pbf",
    name: "PBF Energy",
    type: "refinery",
    state: "NJ",
    phone: "(732) 750-6000",
    website: "https://www.pbfenergy.com",
    services: ["Petroleum Refining"],
    isVerified: true,
  },
  {
    id: "nj-conoco",
    name: "ConocoPhillips",
    type: "refinery",
    state: "NJ",
    phone: "(877) 704-9653",
    website: "https://www.conocophillips.com",
    services: ["Petroleum Refining"],
    isVerified: true,
  },
  {
    id: "nj-superior",
    name: "Superior Catalysts",
    type: "catalyst",
    state: "NJ",
    phone: "(732) 349-9600",
    website: "https://superior-catalysts.com",
    services: ["Liquid Transport", "Chemical Transport"],
    isVerified: true,
  },
  {
    id: "nj-odyssey",
    name: "Odyssey Logistics & Technology",
    type: "logistics",
    state: "NJ",
    phone: "(203) 448-3900",
    website: "https://odysseylogistics.com",
    services: ["Hazardous Materials", "Bulk Liquids"],
    isVerified: true,
  },
  {
    id: "nj-dana",
    name: "Dana Transport",
    type: "catalyst",
    state: "NJ",
    phone: "(732) 280-1010",
    website: "https://danacompanies.com",
    services: ["Chemical Bulk", "Hazardous Materials"],
    isVerified: true,
  },
  {
    id: "nj-quality",
    name: "Quality Distribution Inc.",
    type: "catalyst",
    state: "NJ",
    phone: "(800) 282-2031",
    website: "https://qualitydistribution.com",
    services: ["Chemical Transport", "Hazardous Material Transport"],
    isVerified: true,
  },
  {
    id: "nj-kenan",
    name: "Kenan Advantage Group",
    type: "catalyst",
    state: "NJ",
    phone: "(800) 969-5466",
    website: "https://thekag.com",
    services: ["Fuels", "Chemicals", "Hazardous Materials"],
    isVerified: true,
  },
  {
    id: "nj-skpetroleum",
    name: "SK Petroleum Services Inc",
    type: "fuel_reseller",
    state: "NJ",
    services: ["Fuel Services"],
    isVerified: false,
  },
  {
    id: "nj-bonded",
    name: "Bonded Oil Co.",
    type: "fuel_reseller",
    state: "NJ",
    website: "https://www.bondedoil.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "nj-allied",
    name: "Allied Oil Co.",
    type: "fuel_reseller",
    state: "NJ",
    website: "https://www.alliedoilco.com",
    services: ["Fuel Distribution"],
    isVerified: false,
  },
  {
    id: "nj-duffy",
    name: "John Duffy Energy Services",
    type: "fuel_reseller",
    state: "NJ",
    website: "https://duffyenergy.com",
    services: ["Energy Services"],
    isVerified: false,
  },
];

// ============================================================================
// COMBINED EXPORTS
// ============================================================================

export const ALL_COMPANIES: Company[] = [
  ...TEXAS_COMPANIES,
  ...LOUISIANA_COMPANIES,
  ...CALIFORNIA_COMPANIES,
  ...ILLINOIS_COMPANIES,
  ...PENNSYLVANIA_COMPANIES,
  ...OHIO_COMPANIES,
  ...NEW_JERSEY_COMPANIES,
];

export const COMPANIES_BY_STATE: Record<State, Company[]> = {
  TX: TEXAS_COMPANIES,
  LA: LOUISIANA_COMPANIES,
  CA: CALIFORNIA_COMPANIES,
  IL: ILLINOIS_COMPANIES,
  PA: PENNSYLVANIA_COMPANIES,
  OH: OHIO_COMPANIES,
  NJ: NEW_JERSEY_COMPANIES,
};

export const STATE_NAMES: Record<State, string> = {
  TX: "Texas",
  LA: "Louisiana",
  CA: "California",
  IL: "Illinois",
  PA: "Pennsylvania",
  OH: "Ohio",
  NJ: "New Jersey",
};

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  refinery: "Refinery",
  shipper: "Shipper",
  catalyst: "Catalyst",
  terminal: "Terminal",
  fuel_reseller: "Fuel Reseller",
  logistics: "Logistics",
  exploration: "Exploration & Production",
};

export function getCompaniesByType(type: CompanyType): Company[] {
  return ALL_COMPANIES.filter(c => c.type === type);
}

export function getCompaniesByState(state: State): Company[] {
  return COMPANIES_BY_STATE[state] || [];
}

export function searchCompanies(query: string): Company[] {
  const q = query.toLowerCase();
  return ALL_COMPANIES.filter(c => 
    c.name.toLowerCase().includes(q) ||
    c.services.some(s => s.toLowerCase().includes(q)) ||
    c.city?.toLowerCase().includes(q)
  );
}

export function getVerifiedCompanies(): Company[] {
  return ALL_COMPANIES.filter(c => c.isVerified);
}
