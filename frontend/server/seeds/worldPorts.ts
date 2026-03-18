/**
 * WORLD PORTS SEED DATA — EusoTrip Platform
 *
 * Comprehensive seed containing 500+ major commercial ports worldwide.
 * Covers every continent and major shipping lane.
 *
 * Data includes:
 *  - Accurate UN/LOCODE identifiers
 *  - GPS coordinates (4 decimal places)
 *  - ISO 3166 alpha-2 country codes
 *  - Port type classification
 *  - Physical specs (draft, berths, TEU capacity)
 *  - Infrastructure flags (cranes, rail access)
 */

import { ports } from "../../drizzle/schema";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PortSeedData {
  name: string;
  unlocode: string;
  city: string;
  state: string | null;
  country: string;
  coordinates: { lat: number; lng: number };
  portType: "seaport" | "river_port" | "lake_port" | "inland_port" | "container_terminal";
  maxDraft: string | null;
  totalBerths: number | null;
  containerCapacityTEU: number | null;
  hasCranes: boolean;
  hasRailAccess: boolean;
  customsOffice: string | null;
  ftzNumber: string | null;
  operatingAuthority: string | null;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function p(
  name: string,
  unlocode: string,
  city: string,
  state: string | null,
  country: string,
  lat: number,
  lng: number,
  portType: PortSeedData["portType"],
  opts: {
    maxDraft?: number;
    totalBerths?: number;
    containerCapacityTEU?: number;
    hasCranes?: boolean;
    hasRailAccess?: boolean;
    customsOffice?: string;
    ftzNumber?: string;
    operatingAuthority?: string;
  } = {},
): PortSeedData {
  return {
    name,
    unlocode,
    city,
    state,
    country,
    coordinates: { lat: parseFloat(lat.toFixed(4)), lng: parseFloat(lng.toFixed(4)) },
    portType,
    maxDraft: opts.maxDraft != null ? opts.maxDraft.toFixed(2) : null,
    totalBerths: opts.totalBerths ?? null,
    containerCapacityTEU: opts.containerCapacityTEU ?? null,
    hasCranes: opts.hasCranes ?? false,
    hasRailAccess: opts.hasRailAccess ?? false,
    customsOffice: opts.customsOffice ?? null,
    ftzNumber: opts.ftzNumber ?? null,
    operatingAuthority: opts.operatingAuthority ?? null,
    isActive: true,
  };
}

// ===========================================================================
// WORLD PORTS ARRAY
// ===========================================================================

export const WORLD_PORTS: PortSeedData[] = [

  // =========================================================================
  // NORTH AMERICA — UNITED STATES — SEAPORTS / CONTAINER TERMINALS
  // =========================================================================
  p("Port of Los Angeles", "USLAX", "Los Angeles", "CA", "US", 33.7395, -118.2600, "container_terminal", { maxDraft: 16.2, totalBerths: 82, containerCapacityTEU: 9900000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Los Angeles", ftzNumber: "FTZ-202", operatingAuthority: "City of Los Angeles" }),
  p("Port of Long Beach", "USLGB", "Long Beach", "CA", "US", 33.7540, -118.2138, "container_terminal", { maxDraft: 16.8, totalBerths: 66, containerCapacityTEU: 8900000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Long Beach", ftzNumber: "FTZ-50", operatingAuthority: "City of Long Beach" }),
  p("Port of New York and New Jersey", "USNYC", "New York", "NY", "US", 40.6645, -74.1413, "container_terminal", { maxDraft: 15.2, totalBerths: 90, containerCapacityTEU: 8300000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP New York/Newark", ftzNumber: "FTZ-49", operatingAuthority: "Port Authority of NY & NJ" }),
  p("Port of Savannah", "USSAV", "Savannah", "GA", "US", 32.0835, -81.0998, "container_terminal", { maxDraft: 14.6, totalBerths: 30, containerCapacityTEU: 5800000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Savannah", ftzNumber: "FTZ-104", operatingAuthority: "Georgia Ports Authority" }),
  p("Port of Houston", "USHOU", "Houston", "TX", "US", 29.7355, -95.2792, "container_terminal", { maxDraft: 14.0, totalBerths: 43, containerCapacityTEU: 3600000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Houston", ftzNumber: "FTZ-84", operatingAuthority: "Port of Houston Authority" }),
  p("Port of Charleston", "USCHS", "Charleston", "SC", "US", 32.7892, -79.9534, "container_terminal", { maxDraft: 15.8, totalBerths: 18, containerCapacityTEU: 2700000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Charleston", ftzNumber: "FTZ-21", operatingAuthority: "SC Ports Authority" }),
  p("Port of Norfolk / Virginia", "USORF", "Norfolk", "VA", "US", 36.8915, -76.3333, "container_terminal", { maxDraft: 15.8, totalBerths: 24, containerCapacityTEU: 3400000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Norfolk", ftzNumber: "FTZ-20", operatingAuthority: "Virginia Port Authority" }),
  p("Port of Seattle", "USSEA", "Seattle", "WA", "US", 47.5799, -122.3490, "container_terminal", { maxDraft: 15.8, totalBerths: 18, containerCapacityTEU: 1700000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Seattle", ftzNumber: "FTZ-5", operatingAuthority: "Northwest Seaport Alliance" }),
  p("Port of Tacoma", "USTCM", "Tacoma", "WA", "US", 47.2651, -122.4121, "container_terminal", { maxDraft: 15.8, totalBerths: 12, containerCapacityTEU: 1800000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Tacoma", ftzNumber: "FTZ-86", operatingAuthority: "Northwest Seaport Alliance" }),
  p("Port of Oakland", "USOAK", "Oakland", "CA", "US", 37.7955, -122.2789, "container_terminal", { maxDraft: 15.2, totalBerths: 20, containerCapacityTEU: 2400000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Oakland", ftzNumber: "FTZ-56", operatingAuthority: "Port of Oakland" }),
  p("PortMiami", "USMIA", "Miami", "FL", "US", 25.7714, -80.1624, "container_terminal", { maxDraft: 15.2, totalBerths: 14, containerCapacityTEU: 1100000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Miami", ftzNumber: "FTZ-32", operatingAuthority: "Miami-Dade County" }),
  p("JAXPORT", "USJAX", "Jacksonville", "FL", "US", 30.3793, -81.4245, "container_terminal", { maxDraft: 14.3, totalBerths: 16, containerCapacityTEU: 1400000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Jacksonville", ftzNumber: "FTZ-64", operatingAuthority: "Jacksonville Port Authority" }),
  p("Port of Baltimore", "USBAL", "Baltimore", "MD", "US", 39.2576, -76.5783, "container_terminal", { maxDraft: 15.2, totalBerths: 20, containerCapacityTEU: 900000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Baltimore", ftzNumber: "FTZ-74", operatingAuthority: "Maryland Port Administration" }),
  p("PhilaPort", "USPHL", "Philadelphia", "PA", "US", 39.8961, -75.1402, "container_terminal", { maxDraft: 13.7, totalBerths: 14, containerCapacityTEU: 650000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Philadelphia", ftzNumber: "FTZ-35", operatingAuthority: "PhilaPort" }),
  p("Port of New Orleans", "USMSY", "New Orleans", "LA", "US", 29.9369, -90.0304, "seaport", { maxDraft: 13.7, totalBerths: 28, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP New Orleans", ftzNumber: "FTZ-2", operatingAuthority: "Port of New Orleans" }),
  p("Port of Mobile", "USMOB", "Mobile", "AL", "US", 30.7021, -88.0373, "container_terminal", { maxDraft: 13.7, totalBerths: 15, containerCapacityTEU: 380000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Mobile", ftzNumber: "FTZ-82", operatingAuthority: "Alabama State Port Authority" }),
  p("Port of Corpus Christi", "USCRP", "Corpus Christi", "TX", "US", 27.8117, -97.3900, "seaport", { maxDraft: 14.0, totalBerths: 20, hasCranes: false, hasRailAccess: true, customsOffice: "CBP Corpus Christi", operatingAuthority: "Port of Corpus Christi Authority" }),
  p("Port of Texas City", "USTXC", "Texas City", "TX", "US", 29.3738, -94.9027, "seaport", { maxDraft: 12.2, totalBerths: 10, hasCranes: false, hasRailAccess: true, operatingAuthority: "Port of Texas City" }),
  p("Port of Port Arthur", "USPTA", "Port Arthur", "TX", "US", 29.8600, -93.9300, "seaport", { maxDraft: 12.2, totalBerths: 12, hasCranes: false, hasRailAccess: true, customsOffice: "CBP Port Arthur", operatingAuthority: "Port of Port Arthur" }),
  p("Port of Beaumont", "USBPT", "Beaumont", "TX", "US", 30.0799, -94.0935, "seaport", { maxDraft: 12.2, totalBerths: 14, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Beaumont", operatingAuthority: "Port of Beaumont" }),
  p("Port of Lake Charles", "USLCH", "Lake Charles", "LA", "US", 30.2103, -93.2587, "seaport", { maxDraft: 12.2, totalBerths: 16, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Lake Charles", operatingAuthority: "Port of Lake Charles" }),
  p("Port of Baton Rouge", "USBTR", "Baton Rouge", "LA", "US", 30.4263, -91.1915, "river_port", { maxDraft: 13.7, totalBerths: 18, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Greater Baton Rouge" }),
  p("Port of Portland", "USPDX", "Portland", "OR", "US", 45.5936, -122.7618, "seaport", { maxDraft: 12.2, totalBerths: 10, containerCapacityTEU: 150000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Portland", operatingAuthority: "Port of Portland" }),
  p("Port of Anchorage", "USANC", "Anchorage", "AK", "US", 61.2355, -149.8891, "seaport", { maxDraft: 10.7, totalBerths: 6, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Anchorage", operatingAuthority: "Port of Alaska" }),
  p("Port of Honolulu", "USHNL", "Honolulu", "HI", "US", 21.3069, -157.8660, "container_terminal", { maxDraft: 13.1, totalBerths: 14, containerCapacityTEU: 450000, hasCranes: true, hasRailAccess: false, customsOffice: "CBP Honolulu", operatingAuthority: "Hawaii DOT Harbors" }),
  p("Port of San Juan", "USSJU", "San Juan", "PR", "US", 18.4572, -66.0904, "container_terminal", { maxDraft: 11.0, totalBerths: 10, containerCapacityTEU: 350000, hasCranes: true, hasRailAccess: false, customsOffice: "CBP San Juan", operatingAuthority: "Puerto Rico Ports Authority" }),
  p("Port Everglades", "USPEF", "Fort Lauderdale", "FL", "US", 26.0865, -80.1168, "container_terminal", { maxDraft: 13.4, totalBerths: 12, containerCapacityTEU: 1100000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Port Everglades", ftzNumber: "FTZ-25", operatingAuthority: "Broward County" }),
  p("Port of Tampa Bay", "USTPA", "Tampa", "FL", "US", 27.9139, -82.4437, "seaport", { maxDraft: 13.1, totalBerths: 20, containerCapacityTEU: 100000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Tampa", ftzNumber: "FTZ-79", operatingAuthority: "Port Tampa Bay" }),
  p("Port of Wilmington (DE)", "USILG", "Wilmington", "DE", "US", 39.7124, -75.5079, "container_terminal", { maxDraft: 11.6, totalBerths: 8, containerCapacityTEU: 420000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Wilmington", ftzNumber: "FTZ-99", operatingAuthority: "GT USA Wilmington" }),
  p("Port of Wilmington (NC)", "USILM", "Wilmington", "NC", "US", 34.1868, -77.9548, "container_terminal", { maxDraft: 12.8, totalBerths: 6, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Wilmington NC", ftzNumber: "FTZ-214", operatingAuthority: "NC State Ports Authority" }),
  p("Port of Gulfport", "USGPT", "Gulfport", "MS", "US", 30.3583, -89.0867, "container_terminal", { maxDraft: 10.1, totalBerths: 6, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Mississippi State Port Authority" }),
  p("Port of Pensacola", "USPNS", "Pensacola", "FL", "US", 30.4095, -87.2135, "seaport", { maxDraft: 10.1, totalBerths: 5, hasCranes: false, hasRailAccess: true, operatingAuthority: "City of Pensacola" }),
  p("Port of Galveston", "USGLS", "Galveston", "TX", "US", 29.3010, -94.7935, "seaport", { maxDraft: 12.5, totalBerths: 10, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Galveston", ftzNumber: "FTZ-36", operatingAuthority: "Galveston Wharves" }),
  p("Port of Freeport (TX)", "USFPT", "Freeport", "TX", "US", 28.9357, -95.3593, "seaport", { maxDraft: 13.7, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Freeport" }),
  p("Port of San Diego", "USSAN", "San Diego", "CA", "US", 32.6867, -117.1424, "seaport", { maxDraft: 10.7, totalBerths: 8, hasCranes: false, hasRailAccess: false, customsOffice: "CBP San Diego", operatingAuthority: "Port of San Diego" }),
  p("Port Hueneme", "USHUE", "Port Hueneme", "CA", "US", 34.1480, -119.2096, "seaport", { maxDraft: 10.7, totalBerths: 4, hasCranes: true, hasRailAccess: false, customsOffice: "CBP Port Hueneme", ftzNumber: "FTZ-205", operatingAuthority: "Oxnard Harbor District" }),
  p("Port of Richmond (CA)", "USRIC", "Richmond", "CA", "US", 37.9063, -122.3579, "seaport", { maxDraft: 11.6, totalBerths: 6, hasCranes: false, hasRailAccess: true, operatingAuthority: "City of Richmond" }),
  p("Port of Stockton", "USSTS", "Stockton", "CA", "US", 37.9431, -121.3305, "inland_port", { maxDraft: 10.7, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Stockton" }),
  p("Port of West Sacramento", "USWSC", "West Sacramento", "CA", "US", 38.5590, -121.5520, "inland_port", { maxDraft: 9.1, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Port of West Sacramento" }),
  p("Port of Coos Bay", "USCOO", "Coos Bay", "OR", "US", 43.3826, -124.2148, "seaport", { maxDraft: 11.3, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Oregon International Port of Coos Bay" }),
  p("Port of Longview", "USLVW", "Longview", "WA", "US", 46.1065, -122.9448, "seaport", { maxDraft: 12.2, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Longview" }),
  p("Port of Everett", "USEVT", "Everett", "WA", "US", 47.9903, -122.2171, "seaport", { maxDraft: 10.7, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Port of Everett" }),
  p("Port of Olympia", "USOLY", "Olympia", "WA", "US", 47.0543, -122.9106, "seaport", { maxDraft: 9.1, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Port of Olympia" }),
  p("Port of Grays Harbor", "USGHR", "Aberdeen", "WA", "US", 46.9638, -123.8256, "seaport", { maxDraft: 10.7, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Grays Harbor" }),
  p("Port of Kalama", "USKLA", "Kalama", "WA", "US", 46.0295, -122.8556, "seaport", { maxDraft: 12.2, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Port of Kalama" }),
  p("Port of Vancouver (WA)", "USVUO", "Vancouver", "WA", "US", 45.6319, -122.6935, "seaport", { maxDraft: 12.2, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Vancouver USA" }),
  p("Port of Astoria", "USAST", "Astoria", "OR", "US", 46.1870, -123.8359, "seaport", { maxDraft: 10.1, totalBerths: 3, hasCranes: false, hasRailAccess: false, operatingAuthority: "Port of Astoria" }),
  p("Port of Dutch Harbor", "USDUT", "Unalaska", "AK", "US", 53.8799, -166.5369, "seaport", { maxDraft: 10.7, totalBerths: 4, hasCranes: true, hasRailAccess: false, operatingAuthority: "City of Unalaska" }),
  p("Port of Kodiak", "USKDK", "Kodiak", "AK", "US", 57.7900, -152.3934, "seaport", { maxDraft: 9.1, totalBerths: 4, hasCranes: false, hasRailAccess: false, operatingAuthority: "City of Kodiak" }),
  p("Port of Valdez", "USVAL", "Valdez", "AK", "US", 61.1273, -146.3483, "seaport", { maxDraft: 24.4, totalBerths: 3, hasCranes: false, hasRailAccess: false, operatingAuthority: "City of Valdez" }),
  p("Port of Brunswick", "USBQK", "Brunswick", "GA", "US", 31.1453, -81.5026, "seaport", { maxDraft: 10.7, totalBerths: 6, hasCranes: false, hasRailAccess: true, operatingAuthority: "Georgia Ports Authority" }),
  p("Port of Morehead City", "USMHC", "Morehead City", "NC", "US", 34.7230, -76.7039, "seaport", { maxDraft: 12.8, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "NC State Ports Authority" }),
  p("Port of Camden", "USCDE", "Camden", "NJ", "US", 39.9335, -75.1188, "seaport", { maxDraft: 10.7, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "South Jersey Port Corporation" }),
  p("Port of Providence", "USPVD", "Providence", "RI", "US", 41.8117, -71.3987, "seaport", { maxDraft: 10.7, totalBerths: 5, hasCranes: false, hasRailAccess: false, operatingAuthority: "Waterson Terminal Services" }),
  p("Port of New Haven", "USHVN", "New Haven", "CT", "US", 41.2881, -72.9095, "seaport", { maxDraft: 10.7, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Port of New Haven" }),
  p("Port of Boston", "USBOS", "Boston", "MA", "US", 42.3497, -71.0375, "container_terminal", { maxDraft: 12.2, totalBerths: 10, containerCapacityTEU: 280000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Boston", ftzNumber: "FTZ-27", operatingAuthority: "Massport" }),
  p("Port of Portland (ME)", "USPWM", "Portland", "ME", "US", 43.6539, -70.2465, "seaport", { maxDraft: 10.7, totalBerths: 6, hasCranes: false, hasRailAccess: true, customsOffice: "CBP Portland ME", operatingAuthority: "Portland Harbor" }),
  p("Port of Searsport", "USSWP", "Searsport", "ME", "US", 44.4664, -68.9116, "seaport", { maxDraft: 10.7, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Sprague Energy" }),
  p("Port of Eastport", "USEPM", "Eastport", "ME", "US", 44.9033, -66.9950, "seaport", { maxDraft: 9.1, totalBerths: 2, hasCranes: false, hasRailAccess: false, operatingAuthority: "Port of Eastport" }),
  p("Port Manatee", "USPMN", "Palmetto", "FL", "US", 27.6339, -82.5625, "seaport", { maxDraft: 12.2, totalBerths: 6, hasCranes: false, hasRailAccess: true, operatingAuthority: "Manatee County Port Authority" }),
  p("Port of Palm Beach", "USRPB", "Riviera Beach", "FL", "US", 26.7713, -80.0563, "seaport", { maxDraft: 10.1, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Palm Beach District" }),
  p("Port Canaveral", "USPCV", "Cape Canaveral", "FL", "US", 28.4130, -80.6291, "seaport", { maxDraft: 10.7, totalBerths: 8, hasCranes: false, hasRailAccess: true, operatingAuthority: "Canaveral Port Authority" }),
  p("Port of Fernandina", "USFND", "Fernandina Beach", "FL", "US", 30.6724, -81.4604, "seaport", { maxDraft: 10.1, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Nassau Terminals" }),
  p("Port of Panama City", "USPFN", "Panama City", "FL", "US", 30.1553, -85.6661, "seaport", { maxDraft: 10.7, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Port Panama City" }),

  // US — INLAND / RIVER PORTS
  p("Port of St. Louis", "USSTL", "St. Louis", "MO", "US", 38.6192, -90.1781, "river_port", { maxDraft: 2.7, totalBerths: 20, hasCranes: true, hasRailAccess: true, operatingAuthority: "St. Louis Port Authority" }),
  p("Port of Memphis", "USMEM", "Memphis", "TN", "US", 35.1147, -90.0700, "river_port", { maxDraft: 2.7, totalBerths: 12, hasCranes: true, hasRailAccess: true, operatingAuthority: "Memphis & Shelby County Port Commission" }),
  p("Port of Pittsburgh", "USPIT", "Pittsburgh", "PA", "US", 40.4271, -79.9770, "river_port", { maxDraft: 2.7, totalBerths: 10, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Pittsburgh Commission" }),
  p("Port of Cincinnati", "USCVG", "Cincinnati", "OH", "US", 39.0989, -84.5040, "river_port", { maxDraft: 2.7, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Greater Cincinnati Port Authority" }),
  p("Port of Louisville", "USSDF", "Louisville", "KY", "US", 38.2522, -85.7399, "river_port", { maxDraft: 2.7, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Riverport Authority" }),
  p("Port of Tulsa-Catoosa", "USTUL", "Catoosa", "OK", "US", 36.1960, -95.7461, "inland_port", { maxDraft: 2.7, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Tulsa Port of Catoosa" }),
  p("Port of Paducah", "USPAH", "Paducah", "KY", "US", 37.0840, -88.6040, "river_port", { maxDraft: 2.7, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Paducah-McCracken County Riverport Authority" }),
  p("Port of Huntington-Tristate", "USHTS", "Huntington", "WV", "US", 38.4254, -82.4332, "river_port", { maxDraft: 2.7, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Huntington Port Authority" }),
  p("Port of Owensboro", "USOWB", "Owensboro", "KY", "US", 37.7697, -87.1112, "river_port", { maxDraft: 2.7, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Owensboro Riverport Authority" }),
  p("Port of Helena", "USHEA", "Helena", "AR", "US", 34.5301, -90.5881, "river_port", { maxDraft: 2.7, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Helena Harbor" }),
  p("Port of Little Rock", "USLIR", "Little Rock", "AR", "US", 34.7304, -92.2694, "river_port", { maxDraft: 2.7, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "Little Rock Port Authority" }),
  p("Port of Decatur", "USDCU", "Decatur", "AL", "US", 34.6082, -87.0019, "river_port", { maxDraft: 2.7, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Decatur-Morgan County Port Authority" }),
  p("Port of Vicksburg", "USVKS", "Vicksburg", "MS", "US", 32.3519, -90.8762, "river_port", { maxDraft: 2.7, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Warren County Port Commission" }),
  p("Port of Kansas City", "USMKC", "Kansas City", "MO", "US", 39.1112, -94.6273, "inland_port", { maxDraft: 2.7, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port KC" }),
  p("Port of South Louisiana", "USSOL", "LaPlace", "LA", "US", 30.0595, -90.4757, "river_port", { maxDraft: 13.7, totalBerths: 50, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of South Louisiana" }),
  p("Port Allen-Port of Greater Baton Rouge", "USPAR", "Port Allen", "LA", "US", 30.4492, -91.2085, "river_port", { maxDraft: 10.7, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Greater Baton Rouge" }),
  p("Port of Natchez", "USNAZ", "Natchez", "MS", "US", 31.5504, -91.3998, "river_port", { maxDraft: 2.7, totalBerths: 2, hasCranes: false, hasRailAccess: true, operatingAuthority: "Adams County Port Commission" }),
  p("Port of Greenville", "USGLH", "Greenville", "MS", "US", 33.4101, -91.0605, "river_port", { maxDraft: 2.7, totalBerths: 3, hasCranes: false, hasRailAccess: false, operatingAuthority: "Greenville Port Commission" }),

  // US — GREAT LAKES PORTS
  p("Port of Duluth-Superior", "USDLH", "Duluth", "MN", "US", 46.7712, -92.0926, "lake_port", { maxDraft: 8.2, totalBerths: 18, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Duluth", operatingAuthority: "Duluth Seaway Port Authority" }),
  p("Port of Chicago", "USCHI", "Chicago", "IL", "US", 41.8384, -87.6088, "lake_port", { maxDraft: 8.2, totalBerths: 20, containerCapacityTEU: 100000, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Chicago", operatingAuthority: "Illinois International Port District" }),
  p("Port of Detroit", "USDET", "Detroit", "MI", "US", 42.3050, -83.0979, "lake_port", { maxDraft: 8.2, totalBerths: 10, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Detroit", operatingAuthority: "Detroit/Wayne County Port Authority" }),
  p("Port of Cleveland", "USCLE", "Cleveland", "OH", "US", 41.5094, -81.7029, "lake_port", { maxDraft: 8.2, totalBerths: 8, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Cleveland", operatingAuthority: "Cleveland-Cuyahoga County Port Authority" }),
  p("Port of Buffalo", "USBUF", "Buffalo", "NY", "US", 42.8783, -78.8777, "lake_port", { maxDraft: 8.2, totalBerths: 6, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Buffalo", operatingAuthority: "Erie County" }),
  p("Port of Toledo", "USTOL", "Toledo", "OH", "US", 41.6526, -83.4799, "lake_port", { maxDraft: 8.2, totalBerths: 10, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Toledo", operatingAuthority: "Toledo-Lucas County Port Authority" }),
  p("Port of Milwaukee", "USMKE", "Milwaukee", "WI", "US", 43.0250, -87.8965, "lake_port", { maxDraft: 8.2, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Milwaukee" }),
  p("Port of Green Bay", "USGRB", "Green Bay", "WI", "US", 44.5349, -87.9855, "lake_port", { maxDraft: 7.9, totalBerths: 6, hasCranes: false, hasRailAccess: true, operatingAuthority: "Port of Green Bay" }),
  p("Port of Indiana - Burns Harbor", "USBRN", "Portage", "IN", "US", 41.6362, -87.1517, "lake_port", { maxDraft: 8.2, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Ports of Indiana" }),
  p("Port of Ashtabula", "USASH", "Ashtabula", "OH", "US", 41.9109, -80.7898, "lake_port", { maxDraft: 8.2, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Ashtabula Port Authority" }),
  p("Port of Conneaut", "USCUT", "Conneaut", "OH", "US", 41.9608, -80.5661, "lake_port", { maxDraft: 7.9, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Conneaut Port Authority" }),
  p("Port of Lorain", "USLOR", "Lorain", "OH", "US", 41.4720, -82.1840, "lake_port", { maxDraft: 7.9, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Lorain Port Authority" }),
  p("Port of Erie", "USERI", "Erie", "PA", "US", 42.1400, -80.0900, "lake_port", { maxDraft: 7.6, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Erie-Western PA Port Authority" }),
  p("Port of Oswego", "USUSW", "Oswego", "NY", "US", 43.4614, -76.5098, "lake_port", { maxDraft: 7.6, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Port of Oswego Authority" }),
  p("Port of Ogdensburg", "USOGS", "Ogdensburg", "NY", "US", 44.6941, -75.4942, "lake_port", { maxDraft: 7.6, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Ogdensburg Bridge & Port Authority" }),
  p("Port of Huron", "USPHN", "Port Huron", "MI", "US", 42.9747, -82.4249, "lake_port", { maxDraft: 8.2, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Port Huron" }),
  p("Port of Saginaw", "USMBS", "Saginaw", "MI", "US", 43.6407, -83.8887, "lake_port", { maxDraft: 6.4, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Saginaw County" }),
  p("Port of Muskegon", "USMKG", "Muskegon", "MI", "US", 43.2279, -86.2601, "lake_port", { maxDraft: 7.3, totalBerths: 3, hasCranes: false, hasRailAccess: false, operatingAuthority: "City of Muskegon" }),
  p("Port of Indiana - Jeffersonville", "USJEF", "Jeffersonville", "IN", "US", 38.2859, -85.7291, "river_port", { maxDraft: 2.7, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "Ports of Indiana" }),
  p("Port of Indiana - Mount Vernon", "USMVN", "Mount Vernon", "IN", "US", 37.9362, -87.8959, "river_port", { maxDraft: 2.7, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "Ports of Indiana" }),
  p("Port of Two Harbors", "USTWH", "Two Harbors", "MN", "US", 47.0172, -91.6707, "lake_port", { maxDraft: 8.5, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Two Harbors Port" }),
  p("Port of Marquette", "USMQT", "Marquette", "MI", "US", 46.5469, -87.3930, "lake_port", { maxDraft: 7.9, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Marquette Port" }),
  p("Port of Escanaba", "USESC", "Escanaba", "MI", "US", 45.7442, -87.0557, "lake_port", { maxDraft: 7.9, totalBerths: 3, hasCranes: false, hasRailAccess: true, operatingAuthority: "Escanaba Port" }),

  // =========================================================================
  // NORTH AMERICA — CANADA
  // =========================================================================
  p("Port of Vancouver", "CAVAN", "Vancouver", "BC", "CA", 49.2884, -123.0926, "container_terminal", { maxDraft: 18.3, totalBerths: 28, containerCapacityTEU: 3800000, hasCranes: true, hasRailAccess: true, customsOffice: "CBSA Vancouver", operatingAuthority: "Vancouver Fraser Port Authority" }),
  p("Port of Montreal", "CAMTR", "Montreal", "QC", "CA", 45.5447, -73.5210, "container_terminal", { maxDraft: 11.3, totalBerths: 24, containerCapacityTEU: 1700000, hasCranes: true, hasRailAccess: true, customsOffice: "CBSA Montreal", operatingAuthority: "Montreal Port Authority" }),
  p("Port of Halifax", "CAHAL", "Halifax", "NS", "CA", 44.6353, -63.5623, "container_terminal", { maxDraft: 16.0, totalBerths: 12, containerCapacityTEU: 580000, hasCranes: true, hasRailAccess: true, customsOffice: "CBSA Halifax", operatingAuthority: "Halifax Port Authority" }),
  p("Port of Prince Rupert", "CAPRR", "Prince Rupert", "BC", "CA", 54.3000, -130.3226, "container_terminal", { maxDraft: 17.0, totalBerths: 6, containerCapacityTEU: 1500000, hasCranes: true, hasRailAccess: true, customsOffice: "CBSA Prince Rupert", operatingAuthority: "Prince Rupert Port Authority" }),
  p("Port of Saint John", "CASJN", "Saint John", "NB", "CA", 45.2643, -66.0636, "container_terminal", { maxDraft: 14.5, totalBerths: 10, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: true, customsOffice: "CBSA Saint John", operatingAuthority: "Port Saint John" }),
  p("Port of Hamilton", "CAHAM", "Hamilton", "ON", "CA", 43.2816, -79.8228, "lake_port", { maxDraft: 8.2, totalBerths: 10, hasCranes: true, hasRailAccess: true, customsOffice: "CBSA Hamilton", operatingAuthority: "Hamilton-Oshawa Port Authority" }),
  p("Port of Thunder Bay", "CATHU", "Thunder Bay", "ON", "CA", 48.3925, -89.2300, "lake_port", { maxDraft: 8.2, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Thunder Bay Port Authority" }),
  p("Port of Toronto", "CATOR", "Toronto", "ON", "CA", 43.6397, -79.3603, "lake_port", { maxDraft: 8.2, totalBerths: 6, hasCranes: true, hasRailAccess: true, customsOffice: "CBSA Toronto", operatingAuthority: "PortsToronto" }),
  p("Port of Windsor", "CAWNR", "Windsor", "ON", "CA", 42.3108, -83.0689, "lake_port", { maxDraft: 8.2, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Windsor Port Authority" }),
  p("Port of Québec", "CAQUE", "Québec City", "QC", "CA", 46.8236, -71.1918, "seaport", { maxDraft: 15.2, totalBerths: 18, hasCranes: true, hasRailAccess: true, customsOffice: "CBSA Québec", operatingAuthority: "Port of Québec" }),
  p("Port of Sept-Îles", "CASEI", "Sept-Îles", "QC", "CA", 50.2050, -66.3800, "seaport", { maxDraft: 18.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Sept-Îles" }),
  p("Port of Trois-Rivières", "CATRR", "Trois-Rivières", "QC", "CA", 46.3491, -72.5453, "seaport", { maxDraft: 10.7, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Trois-Rivières" }),
  p("Port of Nanaimo", "CANAN", "Nanaimo", "BC", "CA", 49.1690, -123.9330, "seaport", { maxDraft: 11.0, totalBerths: 6, hasCranes: false, hasRailAccess: false, operatingAuthority: "Port of Nanaimo" }),
  p("Port of St. John's", "CASJF", "St. John's", "NL", "CA", 47.5667, -52.7071, "seaport", { maxDraft: 10.7, totalBerths: 8, hasCranes: true, hasRailAccess: false, customsOffice: "CBSA St. John's", operatingAuthority: "St. John's Port Authority" }),
  p("Port of Churchill", "CACHU", "Churchill", "MB", "CA", 58.7649, -94.1710, "seaport", { maxDraft: 10.0, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Churchill" }),
  p("Port of Belledune", "CABLL", "Belledune", "NB", "CA", 47.9116, -65.8503, "seaport", { maxDraft: 12.5, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Belledune Port Authority" }),
  p("Port of Sydney", "CASYD", "Sydney", "NS", "CA", 46.1432, -60.1948, "seaport", { maxDraft: 10.0, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Sydney Port" }),

  // =========================================================================
  // NORTH AMERICA — MEXICO
  // =========================================================================
  p("Port of Manzanillo", "MXZLO", "Manzanillo", "COL", "MX", 19.0512, -104.3188, "container_terminal", { maxDraft: 16.5, totalBerths: 16, containerCapacityTEU: 3400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "API Manzanillo" }),
  p("Port of Lázaro Cárdenas", "MXLZC", "Lázaro Cárdenas", "MIC", "MX", 17.9380, -102.1720, "container_terminal", { maxDraft: 16.5, totalBerths: 12, containerCapacityTEU: 1600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "API Lázaro Cárdenas" }),
  p("Port of Veracruz", "MXVER", "Veracruz", "VER", "MX", 19.2040, -96.1354, "container_terminal", { maxDraft: 14.0, totalBerths: 22, containerCapacityTEU: 1200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "API Veracruz" }),
  p("Port of Altamira", "MXATM", "Altamira", "TAM", "MX", 22.4088, -97.8800, "container_terminal", { maxDraft: 13.0, totalBerths: 14, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "API Altamira" }),
  p("Port of Ensenada", "MXESE", "Ensenada", "BCN", "MX", 31.8539, -116.6336, "container_terminal", { maxDraft: 12.0, totalBerths: 8, containerCapacityTEU: 250000, hasCranes: true, hasRailAccess: false, operatingAuthority: "API Ensenada" }),
  p("Port of Tampico", "MXTAM", "Tampico", "TAM", "MX", 22.2455, -97.8400, "seaport", { maxDraft: 10.0, totalBerths: 12, hasCranes: true, hasRailAccess: true, operatingAuthority: "API Tampico" }),
  p("Port of Mazatlán", "MXMZT", "Mazatlán", "SIN", "MX", 23.1874, -106.4184, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: false, hasRailAccess: true, operatingAuthority: "API Mazatlán" }),
  p("Port of Guaymas", "MXGYM", "Guaymas", "SON", "MX", 27.9230, -110.9020, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "API Guaymas" }),
  p("Port of Tuxpan", "MXTUX", "Tuxpan", "VER", "MX", 20.9521, -97.3955, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "API Tuxpan" }),
  p("Port of Coatzacoalcos", "MXCOA", "Coatzacoalcos", "VER", "MX", 18.1485, -94.4196, "seaport", { maxDraft: 11.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "API Coatzacoalcos" }),
  p("Port of Salina Cruz", "MXSCX", "Salina Cruz", "OAX", "MX", 16.1654, -95.1981, "seaport", { maxDraft: 12.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "API Salina Cruz" }),
  p("Port of Progreso", "MXPGR", "Progreso", "YUC", "MX", 21.2836, -89.6593, "seaport", { maxDraft: 9.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "API Progreso" }),
  p("Port of Dos Bocas", "MXDSB", "Paraíso", "TAB", "MX", 18.4349, -93.1987, "seaport", { maxDraft: 10.0, totalBerths: 4, hasCranes: false, hasRailAccess: false, operatingAuthority: "API Dos Bocas" }),

  // =========================================================================
  // EUROPE — NORTHERN EUROPE
  // =========================================================================
  p("Port of Rotterdam", "NLRTM", "Rotterdam", null, "NL", 51.9007, 4.4717, "container_terminal", { maxDraft: 24.0, totalBerths: 120, containerCapacityTEU: 14500000, hasCranes: true, hasRailAccess: true, customsOffice: "Douane Rotterdam", operatingAuthority: "Port of Rotterdam Authority" }),
  p("Port of Antwerp-Bruges", "BEANR", "Antwerp", null, "BE", 51.2635, 4.3593, "container_terminal", { maxDraft: 16.0, totalBerths: 80, containerCapacityTEU: 14000000, hasCranes: true, hasRailAccess: true, customsOffice: "Douane Antwerpen", operatingAuthority: "Port of Antwerp-Bruges" }),
  p("Port of Hamburg", "DEHAM", "Hamburg", null, "DE", 53.5322, 9.9462, "container_terminal", { maxDraft: 15.1, totalBerths: 60, containerCapacityTEU: 8700000, hasCranes: true, hasRailAccess: true, customsOffice: "Zoll Hamburg", operatingAuthority: "Hamburg Port Authority" }),
  p("Port of Bremerhaven", "DEBRV", "Bremerhaven", null, "DE", 53.5559, 8.5692, "container_terminal", { maxDraft: 14.5, totalBerths: 30, containerCapacityTEU: 5000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Bremenports" }),
  p("Port of Felixstowe", "GBFXT", "Felixstowe", null, "GB", 51.9536, 1.3263, "container_terminal", { maxDraft: 16.0, totalBerths: 16, containerCapacityTEU: 4000000, hasCranes: true, hasRailAccess: true, customsOffice: "HMRC Felixstowe", operatingAuthority: "Hutchison Ports" }),
  p("Port of Southampton", "GBSOU", "Southampton", null, "GB", 50.8920, -1.3914, "container_terminal", { maxDraft: 14.0, totalBerths: 14, containerCapacityTEU: 2000000, hasCranes: true, hasRailAccess: true, customsOffice: "HMRC Southampton", operatingAuthority: "Associated British Ports" }),
  p("London Gateway", "GBLGP", "Stanford-le-Hope", null, "GB", 51.5078, 0.4556, "container_terminal", { maxDraft: 16.5, totalBerths: 6, containerCapacityTEU: 3500000, hasCranes: true, hasRailAccess: true, customsOffice: "HMRC London Gateway", operatingAuthority: "DP World" }),
  p("Port of Tilbury", "GBTIL", "Tilbury", null, "GB", 51.4527, 0.3555, "container_terminal", { maxDraft: 12.8, totalBerths: 10, containerCapacityTEU: 900000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Forth Ports" }),
  p("Port of Liverpool", "GBLIV", "Liverpool", null, "GB", 53.4393, -3.0171, "container_terminal", { maxDraft: 12.0, totalBerths: 12, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Peel Ports" }),
  p("Port of Immingham", "GBIMM", "Immingham", null, "GB", 53.6180, -0.1830, "seaport", { maxDraft: 11.0, totalBerths: 16, hasCranes: true, hasRailAccess: true, operatingAuthority: "Associated British Ports" }),
  p("Port of Amsterdam", "NLAMS", "Amsterdam", null, "NL", 52.4050, 4.7783, "seaport", { maxDraft: 13.7, totalBerths: 40, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Amsterdam" }),
  p("Port of Zeebrugge", "BEZEE", "Zeebrugge", null, "BE", 51.3353, 3.1765, "container_terminal", { maxDraft: 16.0, totalBerths: 14, containerCapacityTEU: 2200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Antwerp-Bruges" }),
  p("Port of Le Havre", "FRLEH", "Le Havre", null, "FR", 49.4817, 0.1024, "container_terminal", { maxDraft: 15.5, totalBerths: 20, containerCapacityTEU: 2900000, hasCranes: true, hasRailAccess: true, customsOffice: "Douanes Le Havre", operatingAuthority: "HAROPA Port" }),
  p("Port of Dunkirk", "FRDKK", "Dunkirk", null, "FR", 51.0360, 2.2050, "seaport", { maxDraft: 17.0, totalBerths: 18, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Dunkirk" }),
  p("Port of Gothenburg", "SEGOT", "Gothenburg", null, "SE", 57.6943, 11.9053, "container_terminal", { maxDraft: 13.5, totalBerths: 18, containerCapacityTEU: 850000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Gothenburg Port Authority" }),
  p("Port of Malmö", "SEMMA", "Malmö", null, "SE", 55.6157, 13.0036, "seaport", { maxDraft: 10.5, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Copenhagen Malmö Port" }),
  p("Port of Helsinki", "FIHEL", "Helsinki", null, "FI", 60.1534, 24.9580, "container_terminal", { maxDraft: 11.0, totalBerths: 12, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Helsinki" }),
  p("Port of Aarhus", "DKAAR", "Aarhus", null, "DK", 56.1535, 10.2213, "container_terminal", { maxDraft: 11.5, totalBerths: 10, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Aarhus" }),
  p("Port of Copenhagen", "DKCPH", "Copenhagen", null, "DK", 55.6949, 12.6113, "seaport", { maxDraft: 10.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Copenhagen Malmö Port" }),
  p("Port of Oslo", "NOOSL", "Oslo", null, "NO", 59.9006, 10.7394, "seaport", { maxDraft: 10.5, totalBerths: 10, containerCapacityTEU: 250000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Oslo" }),
  p("Port of Bergen", "NOBGO", "Bergen", null, "NO", 60.3953, 5.3108, "seaport", { maxDraft: 10.5, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Bergen" }),
  p("Port of Stavanger", "NOSVG", "Stavanger", null, "NO", 58.9734, 5.7449, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: false, hasRailAccess: false, operatingAuthority: "Stavanger Port" }),
  p("Port of Gdansk", "PLGDN", "Gdansk", null, "PL", 54.4002, 18.6594, "container_terminal", { maxDraft: 16.5, totalBerths: 24, containerCapacityTEU: 2500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Gdansk Authority" }),
  p("Port of Gdynia", "PLGDY", "Gdynia", null, "PL", 54.5371, 18.5420, "container_terminal", { maxDraft: 13.5, totalBerths: 14, containerCapacityTEU: 900000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Gdynia Authority" }),
  p("Port of Tallinn", "EETLL", "Tallinn", null, "EE", 59.4622, 24.7608, "container_terminal", { maxDraft: 14.5, totalBerths: 14, containerCapacityTEU: 250000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Tallinn" }),
  p("Port of Riga", "LVRIX", "Riga", null, "LV", 56.9663, 24.0903, "container_terminal", { maxDraft: 12.0, totalBerths: 18, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Freeport of Riga Authority" }),
  p("Port of Klaipeda", "LTKLJ", "Klaipeda", null, "LT", 55.7127, 21.1306, "container_terminal", { maxDraft: 14.5, totalBerths: 14, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Klaipeda State Seaport Authority" }),
  p("Port of St. Petersburg", "RULED", "St. Petersburg", null, "RU", 59.8839, 30.2178, "container_terminal", { maxDraft: 11.0, totalBerths: 20, containerCapacityTEU: 2100000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Big Port St. Petersburg" }),
  p("Port of Wilhelmshaven (JadeWeserPort)", "DEWVN", "Wilhelmshaven", null, "DE", 53.5901, 8.1419, "container_terminal", { maxDraft: 18.0, totalBerths: 4, containerCapacityTEU: 2700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "JadeWeserPort" }),
  p("Port of Dublin", "IEDUB", "Dublin", null, "IE", 53.3457, -6.2052, "container_terminal", { maxDraft: 10.0, totalBerths: 12, containerCapacityTEU: 750000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Dublin Port Company" }),
  p("Port of Cork", "IEORK", "Cork", null, "IE", 51.8512, -8.2872, "seaport", { maxDraft: 14.0, totalBerths: 10, containerCapacityTEU: 250000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Cork Company" }),
  p("Port of Belfast", "GBBEL", "Belfast", null, "GB", 54.6239, -5.8992, "seaport", { maxDraft: 9.5, totalBerths: 10, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Belfast Harbour Commissioners" }),
  p("Port of Leith (Edinburgh)", "GBLEI", "Edinburgh", null, "GB", 55.9796, -3.1696, "seaport", { maxDraft: 9.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Forth Ports" }),
  p("Port of Teesport", "GBTEE", "Middlesbrough", null, "GB", 54.6110, -1.1462, "seaport", { maxDraft: 12.5, totalBerths: 14, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "PD Ports" }),
  p("Port of Bristol (Avonmouth)", "GBAVH", "Bristol", null, "GB", 51.5070, -2.6866, "seaport", { maxDraft: 12.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Bristol Port Company" }),
  p("Port of Rostock", "DERSK", "Rostock", null, "DE", 54.1487, 12.1025, "seaport", { maxDraft: 13.0, totalBerths: 12, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Rostock Port" }),
  p("Port of Lübeck", "DELBC", "Lübeck", null, "DE", 53.8881, 10.7017, "seaport", { maxDraft: 9.5, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Lübecker Hafen-Gesellschaft" }),

  // =========================================================================
  // EUROPE — MEDITERRANEAN / SOUTHERN EUROPE
  // =========================================================================
  p("Port of Marseille-Fos", "FRMRS", "Marseille", null, "FR", 43.3267, 5.0469, "container_terminal", { maxDraft: 16.0, totalBerths: 30, containerCapacityTEU: 1500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Grand Port Maritime de Marseille" }),
  p("Port of Barcelona", "ESBCN", "Barcelona", null, "ES", 41.3550, 2.1687, "container_terminal", { maxDraft: 16.0, totalBerths: 30, containerCapacityTEU: 3400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port de Barcelona" }),
  p("Port of Valencia", "ESVLC", "Valencia", null, "ES", 39.4546, -0.3258, "container_terminal", { maxDraft: 16.0, totalBerths: 24, containerCapacityTEU: 5600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Valenciaport" }),
  p("Port of Algeciras", "ESALG", "Algeciras", null, "ES", 36.1293, -5.4337, "container_terminal", { maxDraft: 18.0, totalBerths: 12, containerCapacityTEU: 5100000, hasCranes: true, hasRailAccess: true, operatingAuthority: "APBA" }),
  p("Port of Bilbao", "ESBIO", "Bilbao", null, "ES", 43.3546, -3.0475, "seaport", { maxDraft: 18.0, totalBerths: 14, containerCapacityTEU: 650000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Bilbao Port Authority" }),
  p("Port of Tarragona", "ESTAR", "Tarragona", null, "ES", 41.0860, 1.2300, "seaport", { maxDraft: 16.0, totalBerths: 14, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Tarragona" }),
  p("Port of Vigo", "ESVGO", "Vigo", null, "ES", 42.2374, -8.7310, "seaport", { maxDraft: 12.0, totalBerths: 8, containerCapacityTEU: 250000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Vigo" }),
  p("Port of Las Palmas", "ESLPA", "Las Palmas", null, "ES", 28.1457, -15.4128, "container_terminal", { maxDraft: 14.0, totalBerths: 14, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Puertos de Las Palmas" }),
  p("Port of Piraeus", "GRPIR", "Piraeus", null, "GR", 37.9376, 23.6386, "container_terminal", { maxDraft: 16.5, totalBerths: 20, containerCapacityTEU: 5700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "COSCO Shipping / OLP" }),
  p("Port of Thessaloniki", "GRSKG", "Thessaloniki", null, "GR", 40.6333, 22.9396, "container_terminal", { maxDraft: 12.0, totalBerths: 10, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "ThPA" }),
  p("Port of Genoa", "ITGOA", "Genoa", null, "IT", 44.4096, 8.9068, "container_terminal", { maxDraft: 15.0, totalBerths: 30, containerCapacityTEU: 2600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Genoa Authority" }),
  p("Port of La Spezia", "ITSPE", "La Spezia", null, "IT", 44.1050, 9.8360, "container_terminal", { maxDraft: 14.5, totalBerths: 10, containerCapacityTEU: 1400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "La Spezia Container Terminal" }),
  p("Port of Gioia Tauro", "ITGIT", "Gioia Tauro", null, "IT", 38.4310, 15.8920, "container_terminal", { maxDraft: 18.0, totalBerths: 8, containerCapacityTEU: 3200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "MCT" }),
  p("Port of Trieste", "ITTRS", "Trieste", null, "IT", 45.6503, 13.7665, "seaport", { maxDraft: 18.0, totalBerths: 16, containerCapacityTEU: 750000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Trieste Authority" }),
  p("Port of Livorno", "ITLIV", "Livorno", null, "IT", 43.5560, 10.2933, "container_terminal", { maxDraft: 13.0, totalBerths: 14, containerCapacityTEU: 750000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of the Northern Tyrrhenian Sea" }),
  p("Port of Naples", "ITNAP", "Naples", null, "IT", 40.8472, 14.2653, "seaport", { maxDraft: 14.0, totalBerths: 16, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Naples" }),
  p("Port of Venice", "ITVCE", "Venice", null, "IT", 45.4393, 12.2625, "seaport", { maxDraft: 11.0, totalBerths: 12, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "North Adriatic Sea Port Authority" }),
  p("Port of Ravenna", "ITRAN", "Ravenna", null, "IT", 44.4767, 12.2766, "seaport", { maxDraft: 10.5, totalBerths: 10, containerCapacityTEU: 230000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Ravenna Authority" }),
  p("Port of Cagliari", "ITCAG", "Cagliari", null, "IT", 39.2093, 9.1227, "container_terminal", { maxDraft: 14.0, totalBerths: 8, containerCapacityTEU: 700000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Cagliari International Container Terminal" }),
  p("Port of Koper", "SIKOP", "Koper", null, "SI", 45.5573, 13.7359, "container_terminal", { maxDraft: 14.0, totalBerths: 12, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Luka Koper" }),
  p("Port of Rijeka", "HRRJK", "Rijeka", null, "HR", 45.3272, 14.4348, "container_terminal", { maxDraft: 14.0, totalBerths: 10, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Rijeka Authority" }),
  p("Port of Split", "HRSPU", "Split", null, "HR", 43.5046, 16.4362, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: false, hasRailAccess: true, operatingAuthority: "Split Port Authority" }),
  p("Port of Dubrovnik", "HRDBV", "Dubrovnik", null, "HR", 42.6571, 18.0879, "seaport", { maxDraft: 8.0, totalBerths: 4, hasCranes: false, hasRailAccess: false, operatingAuthority: "Port of Dubrovnik Authority" }),
  p("Port of Constanta", "ROCND", "Constanta", null, "RO", 44.1751, 28.6551, "container_terminal", { maxDraft: 16.0, totalBerths: 20, containerCapacityTEU: 700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "National Company Maritime Ports Administration" }),
  p("Port of Lisbon", "PTLIS", "Lisbon", null, "PT", 38.7000, -9.1300, "container_terminal", { maxDraft: 14.5, totalBerths: 16, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Lisbon Authority" }),
  p("Port of Sines", "PTSIE", "Sines", null, "PT", 37.9490, -8.8699, "container_terminal", { maxDraft: 17.5, totalBerths: 10, containerCapacityTEU: 1700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "APS - Port of Sines" }),
  p("Port of Leixões", "PTLEI", "Matosinhos", null, "PT", 41.1833, -8.7000, "container_terminal", { maxDraft: 12.0, totalBerths: 10, containerCapacityTEU: 700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "APDL" }),

  // =========================================================================
  // EUROPE — TURKEY / BLACK SEA
  // =========================================================================
  p("Port of Istanbul (Ambarli)", "TRIST", "Istanbul", null, "TR", 41.0086, 28.6756, "container_terminal", { maxDraft: 15.0, totalBerths: 16, containerCapacityTEU: 3500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Marport / Kumport" }),
  p("Port of Mersin", "TRMER", "Mersin", null, "TR", 36.7870, 34.6330, "container_terminal", { maxDraft: 14.5, totalBerths: 18, containerCapacityTEU: 2100000, hasCranes: true, hasRailAccess: true, operatingAuthority: "MIP" }),
  p("Port of Izmir (Alsancak)", "TRIZM", "Izmir", null, "TR", 38.4461, 27.1416, "container_terminal", { maxDraft: 13.0, totalBerths: 12, containerCapacityTEU: 800000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Izmir Port Authority" }),
  p("Port of Trabzon", "TRTRA", "Trabzon", null, "TR", 41.0033, 39.7268, "seaport", { maxDraft: 10.5, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Trabzon Port Authority" }),
  p("Port of Iskenderun", "TRISL", "Iskenderun", null, "TR", 36.5855, 36.1730, "seaport", { maxDraft: 13.0, totalBerths: 8, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Iskenderun Port" }),
  p("Port of Novorossiysk", "RUNVS", "Novorossiysk", null, "RU", 44.7266, 37.7683, "container_terminal", { maxDraft: 13.5, totalBerths: 20, containerCapacityTEU: 850000, hasCranes: true, hasRailAccess: true, operatingAuthority: "NCSP" }),
  p("Port of Varna", "BGVAR", "Varna", null, "BG", 43.1940, 27.9150, "seaport", { maxDraft: 12.0, totalBerths: 10, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Varna" }),
  p("Port of Burgas", "BGBOJ", "Burgas", null, "BG", 42.4885, 27.4810, "seaport", { maxDraft: 12.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Burgas" }),
  p("Port of Odesa", "UAODS", "Odesa", null, "UA", 46.4820, 30.7336, "container_terminal", { maxDraft: 13.0, totalBerths: 18, containerCapacityTEU: 650000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Odesa" }),
  p("Port of Batumi", "GEBUS", "Batumi", null, "GE", 41.6514, 41.6406, "seaport", { maxDraft: 12.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Batumi Sea Port" }),
  p("Port of Poti", "GEPTI", "Poti", null, "GE", 42.1544, 41.6774, "seaport", { maxDraft: 10.0, totalBerths: 8, containerCapacityTEU: 250000, hasCranes: true, hasRailAccess: true, operatingAuthority: "APM Terminals Poti" }),

  // =========================================================================
  // ASIA — CHINA
  // =========================================================================
  p("Port of Shanghai", "CNSHA", "Shanghai", null, "CN", 30.6312, 122.0654, "container_terminal", { maxDraft: 16.0, totalBerths: 130, containerCapacityTEU: 47000000, hasCranes: true, hasRailAccess: true, customsOffice: "Shanghai Customs", operatingAuthority: "SIPG" }),
  p("Port of Shenzhen", "CNSZX", "Shenzhen", null, "CN", 22.4860, 114.0134, "container_terminal", { maxDraft: 16.0, totalBerths: 60, containerCapacityTEU: 28000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Shenzhen Port Group" }),
  p("Port of Ningbo-Zhoushan", "CNNGB", "Ningbo", null, "CN", 29.9379, 121.8818, "container_terminal", { maxDraft: 22.5, totalBerths: 100, containerCapacityTEU: 33500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Ningbo Zhoushan Port Group" }),
  p("Port of Guangzhou", "CNCAN", "Guangzhou", null, "CN", 22.8765, 113.5555, "container_terminal", { maxDraft: 14.5, totalBerths: 60, containerCapacityTEU: 24000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Guangzhou Port Group" }),
  p("Port of Qingdao", "CNTAO", "Qingdao", null, "CN", 36.0729, 120.3191, "container_terminal", { maxDraft: 20.0, totalBerths: 70, containerCapacityTEU: 23000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Qingdao Port International" }),
  p("Port of Tianjin", "CNTSN", "Tianjin", null, "CN", 38.9820, 117.7398, "container_terminal", { maxDraft: 19.5, totalBerths: 60, containerCapacityTEU: 20000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Tianjin Port Group" }),
  p("Port of Dalian", "CNDLC", "Dalian", null, "CN", 38.8700, 121.6050, "container_terminal", { maxDraft: 18.0, totalBerths: 50, containerCapacityTEU: 8500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Dalian Port Group" }),
  p("Port of Xiamen", "CNXMN", "Xiamen", null, "CN", 24.4605, 118.0670, "container_terminal", { maxDraft: 17.0, totalBerths: 30, containerCapacityTEU: 12000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Xiamen Port" }),
  p("Port of Lianyungang", "CNLYG", "Lianyungang", null, "CN", 34.7326, 119.4559, "container_terminal", { maxDraft: 16.0, totalBerths: 30, containerCapacityTEU: 5000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Lianyungang Port Group" }),
  p("Port of Yingkou", "CNYIK", "Yingkou", null, "CN", 40.6712, 122.2373, "container_terminal", { maxDraft: 10.0, totalBerths: 20, containerCapacityTEU: 3000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Yingkou Port Group" }),
  p("Port of Nanjing", "CNNKG", "Nanjing", null, "CN", 32.0700, 118.7133, "river_port", { maxDraft: 10.7, totalBerths: 20, containerCapacityTEU: 3000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Nanjing Port Group" }),
  p("Port of Fuzhou", "CNFOC", "Fuzhou", null, "CN", 25.9880, 119.4460, "container_terminal", { maxDraft: 14.5, totalBerths: 16, containerCapacityTEU: 3500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Fuzhou Port Group" }),
  p("Port of Zhanjiang", "CNZHA", "Zhanjiang", null, "CN", 20.9307, 110.3975, "seaport", { maxDraft: 18.0, totalBerths: 16, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Zhanjiang Port Group" }),
  p("Port of Quanzhou", "CNQZJ", "Quanzhou", null, "CN", 24.8910, 118.5890, "container_terminal", { maxDraft: 14.0, totalBerths: 12, containerCapacityTEU: 2200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Quanzhou Port Group" }),
  p("Port of Dongguan", "CNDGG", "Dongguan", null, "CN", 22.7879, 113.6887, "container_terminal", { maxDraft: 10.0, totalBerths: 10, containerCapacityTEU: 4000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Dongguan Port" }),
  p("Port of Tangshan", "CNTGS", "Tangshan", null, "CN", 39.2178, 118.9445, "seaport", { maxDraft: 18.0, totalBerths: 40, containerCapacityTEU: 3500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Tangshan Port Group" }),
  p("Port of Rizhao", "CNRZH", "Rizhao", null, "CN", 35.3894, 119.5565, "seaport", { maxDraft: 16.0, totalBerths: 30, containerCapacityTEU: 5000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Rizhao Port Group" }),
  p("Port of Yantai", "CNYNT", "Yantai", null, "CN", 37.5551, 121.3971, "container_terminal", { maxDraft: 14.0, totalBerths: 20, containerCapacityTEU: 3500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Yantai Port Group" }),
  p("Port of Wuhan", "CNWUH", "Wuhan", null, "CN", 30.5810, 114.2818, "river_port", { maxDraft: 6.0, totalBerths: 12, containerCapacityTEU: 1500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Wuhan Port Group" }),
  p("Port of Chongqing", "CNCKG", "Chongqing", null, "CN", 29.5631, 106.5515, "river_port", { maxDraft: 4.5, totalBerths: 10, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Chongqing Port Group" }),
  p("Port of Haikou", "CNHAK", "Haikou", null, "CN", 20.0204, 110.3440, "seaport", { maxDraft: 10.5, totalBerths: 10, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Haikou Port" }),
  p("Port of Fangchenggang", "CNFCG", "Fangchenggang", null, "CN", 21.6990, 108.3670, "seaport", { maxDraft: 16.0, totalBerths: 14, hasCranes: true, hasRailAccess: true, operatingAuthority: "Fangchenggang Port Group" }),

  // =========================================================================
  // ASIA — JAPAN
  // =========================================================================
  p("Port of Tokyo", "JPTYO", "Tokyo", null, "JP", 35.6261, 139.7764, "container_terminal", { maxDraft: 15.0, totalBerths: 40, containerCapacityTEU: 4500000, hasCranes: true, hasRailAccess: true, customsOffice: "Tokyo Customs", operatingAuthority: "Bureau of Port and Harbour, Tokyo" }),
  p("Port of Yokohama", "JPYOK", "Yokohama", null, "JP", 35.4570, 139.6520, "container_terminal", { maxDraft: 16.0, totalBerths: 30, containerCapacityTEU: 2900000, hasCranes: true, hasRailAccess: true, operatingAuthority: "City of Yokohama" }),
  p("Port of Kobe", "JPUKB", "Kobe", null, "JP", 34.6784, 135.1916, "container_terminal", { maxDraft: 16.0, totalBerths: 30, containerCapacityTEU: 2900000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Kobe Port Authority" }),
  p("Port of Osaka", "JPOSA", "Osaka", null, "JP", 34.6537, 135.4273, "container_terminal", { maxDraft: 14.0, totalBerths: 20, containerCapacityTEU: 2400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Osaka Port Authority" }),
  p("Port of Nagoya", "JPNGO", "Nagoya", null, "JP", 35.0725, 136.8778, "container_terminal", { maxDraft: 16.0, totalBerths: 30, containerCapacityTEU: 2800000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Nagoya Port Authority" }),
  p("Port of Hakata (Fukuoka)", "JPHKT", "Fukuoka", null, "JP", 33.6045, 130.4017, "container_terminal", { maxDraft: 14.0, totalBerths: 14, containerCapacityTEU: 900000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Hakata Port Authority" }),
  p("Port of Shimizu", "JPSMZ", "Shizuoka", null, "JP", 35.0121, 138.4982, "container_terminal", { maxDraft: 14.0, totalBerths: 10, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Shimizu Port Authority" }),
  p("Port of Kitakyushu", "JPKKJ", "Kitakyushu", null, "JP", 33.9510, 130.9455, "container_terminal", { maxDraft: 14.0, totalBerths: 12, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Kitakyushu Port Authority" }),
  p("Port of Chiba", "JPCHI", "Chiba", null, "JP", 35.5772, 140.0840, "seaport", { maxDraft: 16.0, totalBerths: 20, hasCranes: true, hasRailAccess: true, operatingAuthority: "Chiba Port Authority" }),
  p("Port of Kawasaki", "JPKWZ", "Kawasaki", null, "JP", 35.5184, 139.7486, "seaport", { maxDraft: 14.0, totalBerths: 12, hasCranes: true, hasRailAccess: true, operatingAuthority: "Kawasaki Port Authority" }),
  p("Port of Niigata", "JPNII", "Niigata", null, "JP", 37.9476, 139.0597, "seaport", { maxDraft: 12.0, totalBerths: 8, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Niigata Port Authority" }),

  // =========================================================================
  // ASIA — SOUTH KOREA
  // =========================================================================
  p("Port of Busan", "KRPUS", "Busan", null, "KR", 35.0968, 129.0367, "container_terminal", { maxDraft: 17.0, totalBerths: 40, containerCapacityTEU: 22000000, hasCranes: true, hasRailAccess: true, customsOffice: "Busan Customs", operatingAuthority: "Busan Port Authority" }),
  p("Port of Incheon", "KRICN", "Incheon", null, "KR", 37.4558, 126.5937, "container_terminal", { maxDraft: 12.0, totalBerths: 20, containerCapacityTEU: 3200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Incheon Port Authority" }),
  p("Port of Gwangyang", "KRKWG", "Gwangyang", null, "KR", 34.9233, 127.7017, "container_terminal", { maxDraft: 16.0, totalBerths: 18, containerCapacityTEU: 2500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Yeosu Gwangyang Port Authority" }),
  p("Port of Ulsan", "KRUSN", "Ulsan", null, "KR", 35.5069, 129.3780, "seaport", { maxDraft: 17.0, totalBerths: 20, hasCranes: true, hasRailAccess: true, operatingAuthority: "Ulsan Port Authority" }),
  p("Port of Pyeongtaek-Dangjin", "KRPTK", "Pyeongtaek", null, "KR", 36.9488, 126.8258, "seaport", { maxDraft: 14.0, totalBerths: 12, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Pyeongtaek Port Authority" }),

  // =========================================================================
  // ASIA — TAIWAN
  // =========================================================================
  p("Port of Kaohsiung", "TWKHH", "Kaohsiung", null, "TW", 22.6141, 120.2869, "container_terminal", { maxDraft: 16.0, totalBerths: 30, containerCapacityTEU: 9600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Taiwan International Ports Corp." }),
  p("Port of Keelung (Taipei)", "TWKEL", "Keelung", null, "TW", 25.1535, 121.7400, "container_terminal", { maxDraft: 14.0, totalBerths: 14, containerCapacityTEU: 1700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Taiwan International Ports Corp." }),
  p("Port of Taichung", "TWTXG", "Taichung", null, "TW", 24.2835, 120.5156, "container_terminal", { maxDraft: 14.5, totalBerths: 16, containerCapacityTEU: 1800000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Taiwan International Ports Corp." }),

  // =========================================================================
  // ASIA — SOUTHEAST ASIA
  // =========================================================================
  p("Port of Singapore", "SGSIN", "Singapore", null, "SG", 1.2644, 103.8220, "container_terminal", { maxDraft: 16.0, totalBerths: 60, containerCapacityTEU: 37000000, hasCranes: true, hasRailAccess: false, customsOffice: "Singapore Customs", operatingAuthority: "PSA International" }),
  p("Port Klang", "MYPKG", "Port Klang", null, "MY", 2.9974, 101.3915, "container_terminal", { maxDraft: 15.0, totalBerths: 26, containerCapacityTEU: 13200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Westports / Northport" }),
  p("Port of Tanjung Pelepas", "MYTPP", "Gelang Patah", null, "MY", 1.3629, 103.5500, "container_terminal", { maxDraft: 18.0, totalBerths: 14, containerCapacityTEU: 11000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "PTP" }),
  p("Port of Penang", "MYPEN", "Penang", null, "MY", 5.4140, 100.3434, "container_terminal", { maxDraft: 10.5, totalBerths: 12, containerCapacityTEU: 1500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Penang Port" }),
  p("Port of Kuantan", "MYKUA", "Kuantan", null, "MY", 3.9750, 103.4280, "seaport", { maxDraft: 13.0, totalBerths: 8, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Kuantan Port" }),
  p("Laem Chabang Port", "THLCH", "Laem Chabang", null, "TH", 13.0810, 100.8880, "container_terminal", { maxDraft: 16.0, totalBerths: 24, containerCapacityTEU: 8000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Thailand" }),
  p("Port of Bangkok (Klong Toey)", "THBKK", "Bangkok", null, "TH", 13.7073, 100.5614, "container_terminal", { maxDraft: 8.2, totalBerths: 12, containerCapacityTEU: 1500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Thailand" }),
  p("Port of Map Ta Phut", "THMTP", "Rayong", null, "TH", 12.7167, 101.1500, "seaport", { maxDraft: 14.0, totalBerths: 12, hasCranes: true, hasRailAccess: true, operatingAuthority: "Industrial Estate Authority of Thailand" }),
  p("Port of Ho Chi Minh City (Cat Lai)", "VNSGN", "Ho Chi Minh City", null, "VN", 10.7603, 106.7510, "container_terminal", { maxDraft: 12.0, totalBerths: 14, containerCapacityTEU: 5000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Saigon Port" }),
  p("Port of Hai Phong", "VNHPH", "Hai Phong", null, "VN", 20.8474, 106.6820, "container_terminal", { maxDraft: 14.0, totalBerths: 16, containerCapacityTEU: 5500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Hai Phong Port" }),
  p("Port of Da Nang", "VNDAD", "Da Nang", null, "VN", 16.0669, 108.2178, "seaport", { maxDraft: 11.0, totalBerths: 8, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Da Nang Port" }),
  p("Port of Cai Mep-Thi Vai", "VNCMT", "Ba Ria", null, "VN", 10.5064, 107.0218, "container_terminal", { maxDraft: 16.0, totalBerths: 8, containerCapacityTEU: 4000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "CMIT / SSIT" }),
  p("Port of Manila (MICT)", "PHMNL", "Manila", null, "PH", 14.5825, 120.9474, "container_terminal", { maxDraft: 13.5, totalBerths: 14, containerCapacityTEU: 5500000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Philippine Ports Authority" }),
  p("Port of Cebu", "PHCEB", "Cebu", null, "PH", 10.2983, 123.8923, "container_terminal", { maxDraft: 10.5, totalBerths: 8, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Cebu Port Authority" }),
  p("Port of Subic Bay", "PHSFS", "Subic", null, "PH", 14.8096, 120.2715, "seaport", { maxDraft: 12.0, totalBerths: 6, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Subic Bay Metropolitan Authority" }),
  p("Port of Batangas", "PHBTG", "Batangas", null, "PH", 13.7581, 121.0535, "seaport", { maxDraft: 11.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Philippine Ports Authority" }),
  p("Port of Tanjung Priok (Jakarta)", "IDJKT", "Jakarta", null, "ID", -6.0988, 106.8802, "container_terminal", { maxDraft: 14.0, totalBerths: 30, containerCapacityTEU: 8000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Pelindo" }),
  p("Port of Tanjung Perak (Surabaya)", "IDSUB", "Surabaya", null, "ID", -7.2089, 112.7344, "container_terminal", { maxDraft: 10.5, totalBerths: 16, containerCapacityTEU: 3500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Pelindo" }),
  p("Port of Semarang (Tanjung Emas)", "IDSMG", "Semarang", null, "ID", -6.9548, 110.4254, "container_terminal", { maxDraft: 10.0, totalBerths: 10, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Pelindo" }),
  p("Port of Makassar", "IDMAK", "Makassar", null, "ID", -5.1108, 119.4277, "seaport", { maxDraft: 10.0, totalBerths: 10, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Pelindo" }),
  p("Port of Belawan (Medan)", "IDBLW", "Medan", null, "ID", 3.7887, 98.6960, "container_terminal", { maxDraft: 10.0, totalBerths: 12, containerCapacityTEU: 800000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Pelindo" }),
  p("Port of Balikpapan", "IDBPN", "Balikpapan", null, "ID", -1.2736, 116.8271, "seaport", { maxDraft: 12.0, totalBerths: 8, hasCranes: true, hasRailAccess: false, operatingAuthority: "Pelindo" }),
  p("Port of Banjarmasin", "IDBDJ", "Banjarmasin", null, "ID", -3.3234, 114.5890, "river_port", { maxDraft: 6.0, totalBerths: 8, hasCranes: true, hasRailAccess: false, operatingAuthority: "Pelindo" }),
  p("Port of Sihanoukville", "KHKOS", "Sihanoukville", null, "KH", 10.6100, 103.5297, "seaport", { maxDraft: 10.5, totalBerths: 6, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: true, operatingAuthority: "PAS" }),
  p("Port of Yangon", "MMRGN", "Yangon", null, "MM", 16.8658, 96.1699, "river_port", { maxDraft: 9.1, totalBerths: 10, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Myanmar Port Authority" }),

  // =========================================================================
  // ASIA — INDIA
  // =========================================================================
  p("Jawaharlal Nehru Port (JNPT)", "INNSA", "Navi Mumbai", "MH", "IN", 18.9520, 72.9477, "container_terminal", { maxDraft: 14.0, totalBerths: 14, containerCapacityTEU: 5500000, hasCranes: true, hasRailAccess: true, customsOffice: "JNCH", operatingAuthority: "JNPA" }),
  p("Port of Mumbai", "INBOM", "Mumbai", "MH", "IN", 18.9310, 72.8496, "seaport", { maxDraft: 10.7, totalBerths: 30, containerCapacityTEU: 900000, hasCranes: true, hasRailAccess: true, customsOffice: "Mumbai Customs", operatingAuthority: "Mumbai Port Trust" }),
  p("Port of Chennai", "INMAA", "Chennai", "TN", "IN", 13.0895, 80.2929, "container_terminal", { maxDraft: 15.0, totalBerths: 20, containerCapacityTEU: 1600000, hasCranes: true, hasRailAccess: true, customsOffice: "Chennai Customs", operatingAuthority: "Chennai Port Authority" }),
  p("Port of Mundra", "INMUN", "Mundra", "GJ", "IN", 22.7378, 69.7220, "container_terminal", { maxDraft: 17.5, totalBerths: 16, containerCapacityTEU: 7000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Adani Ports" }),
  p("Port of Kolkata / Haldia", "INCCU", "Kolkata", "WB", "IN", 22.0242, 88.0589, "river_port", { maxDraft: 8.5, totalBerths: 14, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "SMP Kolkata" }),
  p("Port of Visakhapatnam", "INVTZ", "Visakhapatnam", "AP", "IN", 17.6844, 83.2987, "seaport", { maxDraft: 17.5, totalBerths: 20, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Visakhapatnam Port Authority" }),
  p("Port of Cochin", "INCOK", "Kochi", "KL", "IN", 9.9709, 76.2677, "container_terminal", { maxDraft: 14.5, totalBerths: 14, containerCapacityTEU: 700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Cochin Port Authority" }),
  p("Deendayal Port (Kandla)", "INIXY", "Gandhidham", "GJ", "IN", 23.0130, 70.2130, "seaport", { maxDraft: 13.0, totalBerths: 16, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Deendayal Port Authority" }),
  p("Paradip Port", "INPRT", "Paradip", "OD", "IN", 20.2616, 86.6267, "seaport", { maxDraft: 17.0, totalBerths: 14, hasCranes: true, hasRailAccess: true, operatingAuthority: "Paradip Port Authority" }),
  p("Port of Tuticorin (V.O. Chidambaranar)", "INTUT", "Tuticorin", "TN", "IN", 8.7564, 78.1806, "container_terminal", { maxDraft: 12.8, totalBerths: 14, containerCapacityTEU: 700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "VOC Port Authority" }),
  p("Port of Mangalore (New Mangalore)", "INIXE", "Mangalore", "KA", "IN", 12.9173, 74.8126, "seaport", { maxDraft: 14.5, totalBerths: 10, hasCranes: true, hasRailAccess: true, operatingAuthority: "New Mangalore Port Authority" }),
  p("Port of Mormugao", "INMRM", "Mormugao", "GA", "IN", 15.4062, 73.7871, "seaport", { maxDraft: 14.5, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Mormugao Port Authority" }),
  p("Port of Krishnapatnam", "INKRI", "Krishnapatnam", "AP", "IN", 14.2558, 80.1133, "seaport", { maxDraft: 18.5, totalBerths: 12, containerCapacityTEU: 1200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Krishnapatnam Port Company" }),
  p("Port of Ennore (Kamarajar)", "INENR", "Ennore", "TN", "IN", 13.2157, 80.3197, "seaport", { maxDraft: 16.0, totalBerths: 14, containerCapacityTEU: 1500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Kamarajar Port" }),

  // =========================================================================
  // ASIA — MIDDLE EAST
  // =========================================================================
  p("Jebel Ali Port", "AEJEA", "Dubai", null, "AE", 25.0152, 55.0587, "container_terminal", { maxDraft: 17.0, totalBerths: 80, containerCapacityTEU: 19000000, hasCranes: true, hasRailAccess: true, customsOffice: "Dubai Customs", operatingAuthority: "DP World" }),
  p("Khalifa Port (Abu Dhabi)", "AEKHL", "Abu Dhabi", null, "AE", 24.8104, 54.6479, "container_terminal", { maxDraft: 16.0, totalBerths: 10, containerCapacityTEU: 5000000, hasCranes: true, hasRailAccess: true, customsOffice: "Abu Dhabi Customs", operatingAuthority: "AD Ports Group" }),
  p("Port of Fujairah", "AEFJR", "Fujairah", null, "AE", 25.1241, 56.3567, "seaport", { maxDraft: 16.0, totalBerths: 12, hasCranes: true, hasRailAccess: false, operatingAuthority: "Fujairah Port Authority" }),
  p("Port of Salalah", "OMSLL", "Salalah", null, "OM", 16.9539, 54.0049, "container_terminal", { maxDraft: 18.0, totalBerths: 12, containerCapacityTEU: 5000000, hasCranes: true, hasRailAccess: false, operatingAuthority: "APM Terminals" }),
  p("Port of Sohar", "OMSOH", "Sohar", null, "OM", 24.3696, 56.7279, "container_terminal", { maxDraft: 18.0, totalBerths: 10, containerCapacityTEU: 1500000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Sohar Port & Freezone" }),
  p("King Abdullah Port", "SAKAP", "King Abdullah Economic City", null, "SA", 22.9724, 39.1049, "container_terminal", { maxDraft: 18.0, totalBerths: 12, containerCapacityTEU: 3500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "King Abdullah Port" }),
  p("Jeddah Islamic Port", "SAJED", "Jeddah", null, "SA", 21.4721, 39.1655, "container_terminal", { maxDraft: 16.0, totalBerths: 50, containerCapacityTEU: 5500000, hasCranes: true, hasRailAccess: false, customsOffice: "Saudi Customs Jeddah", operatingAuthority: "Mawani" }),
  p("King Abdulaziz Port (Dammam)", "SADMM", "Dammam", null, "SA", 26.4830, 50.1863, "container_terminal", { maxDraft: 14.0, totalBerths: 30, containerCapacityTEU: 2000000, hasCranes: true, hasRailAccess: true, customsOffice: "Saudi Customs Dammam", operatingAuthority: "Mawani" }),
  p("Port of Jubail", "SAJUB", "Jubail", null, "SA", 27.0219, 49.6635, "seaport", { maxDraft: 12.5, totalBerths: 14, hasCranes: true, hasRailAccess: true, operatingAuthority: "Royal Commission Jubail" }),
  p("Port of Yanbu", "SAYNB", "Yanbu", null, "SA", 24.0851, 38.0613, "seaport", { maxDraft: 14.0, totalBerths: 12, hasCranes: true, hasRailAccess: false, operatingAuthority: "Mawani" }),
  p("Hamad Port", "QAHAM", "Doha", null, "QA", 25.2085, 51.5935, "container_terminal", { maxDraft: 17.0, totalBerths: 8, containerCapacityTEU: 7500000, hasCranes: true, hasRailAccess: false, operatingAuthority: "QTerminals" }),
  p("Port of Kuwait (Shuwaikh)", "KWSWK", "Kuwait City", null, "KW", 29.3572, 47.9340, "seaport", { maxDraft: 9.5, totalBerths: 20, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Kuwait Ports Authority" }),
  p("Port of Shuaiba", "KWSHA", "Shuaiba", null, "KW", 29.0333, 48.1500, "seaport", { maxDraft: 10.0, totalBerths: 12, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Kuwait Ports Authority" }),
  p("Port of Bandar Abbas (Shahid Rajaei)", "IRBND", "Bandar Abbas", null, "IR", 27.1327, 56.0725, "container_terminal", { maxDraft: 16.0, totalBerths: 30, containerCapacityTEU: 3000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "PMO Iran" }),
  p("Port of Imam Khomeini", "IRBKM", "Bandar Imam Khomeini", null, "IR", 30.4346, 49.0764, "seaport", { maxDraft: 13.0, totalBerths: 16, hasCranes: true, hasRailAccess: true, operatingAuthority: "PMO Iran" }),
  p("Port of Aqaba", "JOAQJ", "Aqaba", null, "JO", 29.4779, 34.9889, "container_terminal", { maxDraft: 16.0, totalBerths: 8, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Aqaba Development Corporation" }),
  p("Port of Haifa", "ILHFA", "Haifa", null, "IL", 32.8138, 35.0017, "container_terminal", { maxDraft: 14.0, totalBerths: 16, containerCapacityTEU: 1500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Haifa Port Company" }),
  p("Port of Ashdod", "ILASH", "Ashdod", null, "IL", 31.8247, 34.6417, "container_terminal", { maxDraft: 13.5, totalBerths: 10, containerCapacityTEU: 1400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Ashdod Port Company" }),
  p("Mina Salman Port", "BHBAH", "Manama", null, "BH", 26.1992, 50.6023, "seaport", { maxDraft: 10.0, totalBerths: 12, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Bahrain Port Authority" }),

  // =========================================================================
  // ASIA — PAKISTAN / BANGLADESH / SRI LANKA
  // =========================================================================
  p("Port of Karachi", "PKKHI", "Karachi", null, "PK", 24.8372, 66.9831, "container_terminal", { maxDraft: 12.5, totalBerths: 28, containerCapacityTEU: 2000000, hasCranes: true, hasRailAccess: true, customsOffice: "Pakistan Customs Karachi", operatingAuthority: "KPT" }),
  p("Port of Qasim", "PKBQM", "Karachi", null, "PK", 24.7670, 67.3540, "container_terminal", { maxDraft: 14.5, totalBerths: 16, containerCapacityTEU: 2500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Qasim Authority" }),
  p("Port of Gwadar", "PKGWD", "Gwadar", null, "PK", 25.1060, 62.3288, "seaport", { maxDraft: 14.5, totalBerths: 4, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Gwadar Port Authority" }),
  p("Port of Chittagong", "BDCGP", "Chittagong", null, "BD", 22.3233, 91.8110, "container_terminal", { maxDraft: 9.5, totalBerths: 20, containerCapacityTEU: 3000000, hasCranes: true, hasRailAccess: true, customsOffice: "Chittagong Customs", operatingAuthority: "Chittagong Port Authority" }),
  p("Port of Mongla", "BDMGL", "Mongla", null, "BD", 22.4767, 89.5928, "river_port", { maxDraft: 7.5, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Mongla Port Authority" }),
  p("Port of Colombo", "LKCMB", "Colombo", null, "LK", 6.9461, 79.8427, "container_terminal", { maxDraft: 18.0, totalBerths: 14, containerCapacityTEU: 7200000, hasCranes: true, hasRailAccess: true, customsOffice: "Sri Lanka Customs", operatingAuthority: "SLPA" }),
  p("Port of Hambantota", "LKHAM", "Hambantota", null, "LK", 6.1162, 81.0968, "seaport", { maxDraft: 17.0, totalBerths: 6, containerCapacityTEU: 2400000, hasCranes: true, hasRailAccess: false, operatingAuthority: "HIPG" }),

  // =========================================================================
  // AFRICA — NORTH AFRICA
  // =========================================================================
  p("Tanger Med Port", "MAPTM", "Tangier", null, "MA", 35.8866, -5.5003, "container_terminal", { maxDraft: 18.0, totalBerths: 10, containerCapacityTEU: 9000000, hasCranes: true, hasRailAccess: true, customsOffice: "Douanes Tangier", operatingAuthority: "TMSA" }),
  p("Port of Casablanca", "MACAS", "Casablanca", null, "MA", 33.5988, -7.6166, "container_terminal", { maxDraft: 14.0, totalBerths: 24, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: true, customsOffice: "Douanes Casablanca", operatingAuthority: "ANP Morocco" }),
  p("Port of Agadir", "MAAGA", "Agadir", null, "MA", 30.4216, -9.6450, "seaport", { maxDraft: 10.5, totalBerths: 8, hasCranes: true, hasRailAccess: false, operatingAuthority: "ANP Morocco" }),
  p("Port of Algiers", "DZALG", "Algiers", null, "DZ", 36.7644, 3.0583, "container_terminal", { maxDraft: 12.0, totalBerths: 18, containerCapacityTEU: 700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "EPAL" }),
  p("Port of Oran", "DZORN", "Oran", null, "DZ", 35.7008, -0.6483, "seaport", { maxDraft: 11.0, totalBerths: 14, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: true, operatingAuthority: "EPO" }),
  p("Port of Tunis (Rades)", "TNTUN", "Tunis", null, "TN", 36.7680, 10.2833, "container_terminal", { maxDraft: 10.0, totalBerths: 14, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "STAM" }),
  p("Port of Sfax", "TNSFA", "Sfax", null, "TN", 34.7330, 10.7610, "seaport", { maxDraft: 9.5, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "OMMP" }),
  p("Port of Alexandria", "EGALY", "Alexandria", null, "EG", 31.1948, 29.8783, "container_terminal", { maxDraft: 14.0, totalBerths: 30, containerCapacityTEU: 1700000, hasCranes: true, hasRailAccess: true, customsOffice: "Alexandria Customs", operatingAuthority: "Alexandria Port Authority" }),
  p("Port Said", "EGPSD", "Port Said", null, "EG", 31.2571, 32.3063, "container_terminal", { maxDraft: 17.0, totalBerths: 16, containerCapacityTEU: 4000000, hasCranes: true, hasRailAccess: true, customsOffice: "Port Said Customs", operatingAuthority: "Suez Canal Authority" }),
  p("Port of Damietta", "EGDAM", "Damietta", null, "EG", 31.4413, 31.7859, "container_terminal", { maxDraft: 14.0, totalBerths: 12, containerCapacityTEU: 1600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Damietta Port Authority" }),
  p("Port of Suez", "EGSUZ", "Suez", null, "EG", 29.9693, 32.5550, "seaport", { maxDraft: 16.0, totalBerths: 10, hasCranes: true, hasRailAccess: true, operatingAuthority: "Red Sea Ports Authority" }),
  p("Port of Sokhna", "EGSOK", "Ain Sokhna", null, "EG", 29.6154, 32.3330, "container_terminal", { maxDraft: 17.0, totalBerths: 8, containerCapacityTEU: 2000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "SCZONE" }),

  // =========================================================================
  // AFRICA — WEST AFRICA
  // =========================================================================
  p("Port of Lagos (Apapa)", "NGAPP", "Lagos", null, "NG", 6.4396, 3.3622, "container_terminal", { maxDraft: 13.0, totalBerths: 18, containerCapacityTEU: 1500000, hasCranes: true, hasRailAccess: true, customsOffice: "NCS Lagos", operatingAuthority: "Nigerian Ports Authority" }),
  p("Port of Tin Can Island (Lagos)", "NGTIN", "Lagos", null, "NG", 6.4277, 3.3267, "container_terminal", { maxDraft: 13.0, totalBerths: 14, containerCapacityTEU: 800000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Nigerian Ports Authority" }),
  p("Port of Onne", "NGONN", "Onne", null, "NG", 4.7283, 7.1517, "seaport", { maxDraft: 12.0, totalBerths: 8, hasCranes: true, hasRailAccess: false, operatingAuthority: "Nigerian Ports Authority" }),
  p("Port of Tema", "GHTEM", "Tema", null, "GH", 5.6302, -0.0076, "container_terminal", { maxDraft: 14.0, totalBerths: 14, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: true, customsOffice: "Ghana Revenue Authority", operatingAuthority: "Ghana Ports and Harbours Authority" }),
  p("Port of Takoradi", "GHTKD", "Takoradi", null, "GH", 4.8947, -1.7432, "seaport", { maxDraft: 10.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Ghana Ports and Harbours Authority" }),
  p("Port of Abidjan", "CIABJ", "Abidjan", null, "CI", 5.2833, -4.0033, "container_terminal", { maxDraft: 13.5, totalBerths: 16, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: true, customsOffice: "Douanes Abidjan", operatingAuthority: "PAA" }),
  p("Port of Dakar", "SNDKR", "Dakar", null, "SN", 14.6809, -17.4265, "container_terminal", { maxDraft: 13.5, totalBerths: 14, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, customsOffice: "Douanes Dakar", operatingAuthority: "Port Autonome de Dakar" }),
  p("Port of Lomé", "TGLFW", "Lomé", null, "TG", 6.1326, 1.2846, "container_terminal", { maxDraft: 16.0, totalBerths: 10, containerCapacityTEU: 1200000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Port Autonome de Lomé" }),
  p("Port of Cotonou", "BJCOO", "Cotonou", null, "BJ", 6.3546, 2.4311, "seaport", { maxDraft: 12.0, totalBerths: 10, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Autonome de Cotonou" }),
  p("Port of Douala", "CMDLA", "Douala", null, "CM", 4.0542, 9.7119, "seaport", { maxDraft: 7.5, totalBerths: 10, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "PAD Cameroon" }),
  p("Port of Pointe-Noire", "CGPNR", "Pointe-Noire", null, "CG", -4.8021, 11.8559, "seaport", { maxDraft: 12.0, totalBerths: 10, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "PAPN" }),
  p("Port of Luanda", "AOLAD", "Luanda", null, "AO", -8.8033, 13.2348, "seaport", { maxDraft: 11.0, totalBerths: 14, containerCapacityTEU: 700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Porto de Luanda" }),
  p("Port of Conakry", "GNCKY", "Conakry", null, "GN", 9.5085, -13.7109, "seaport", { maxDraft: 10.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Autonome de Conakry" }),
  p("Port of Freetown", "SLFNA", "Freetown", null, "SL", 8.4767, -13.2359, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Sierra Leone Ports Authority" }),
  p("Port of Monrovia", "LRMLW", "Monrovia", null, "LR", 6.3353, -10.7870, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "National Port Authority" }),
  p("Port of Libreville (Owendo)", "GALIB", "Libreville", null, "GA", 0.3025, 9.4903, "seaport", { maxDraft: 10.5, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "OPRAG" }),
  p("Port of Nouakchott", "MRNKC", "Nouakchott", null, "MR", 18.0331, -15.9560, "seaport", { maxDraft: 10.5, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Nouakchott Port Authority" }),

  // =========================================================================
  // AFRICA — EAST AFRICA
  // =========================================================================
  p("Port of Mombasa", "KEMBA", "Mombasa", null, "KE", -4.0621, 39.6639, "container_terminal", { maxDraft: 14.0, totalBerths: 16, containerCapacityTEU: 1500000, hasCranes: true, hasRailAccess: true, customsOffice: "KRA Mombasa", operatingAuthority: "Kenya Ports Authority" }),
  p("Port of Dar es Salaam", "TZDAR", "Dar es Salaam", null, "TZ", -6.8376, 39.2853, "container_terminal", { maxDraft: 11.5, totalBerths: 12, containerCapacityTEU: 700000, hasCranes: true, hasRailAccess: true, customsOffice: "TRA Dar es Salaam", operatingAuthority: "Tanzania Ports Authority" }),
  p("Port of Djibouti (Doraleh)", "DJJIB", "Djibouti", null, "DJ", 11.5917, 43.1449, "container_terminal", { maxDraft: 18.0, totalBerths: 8, containerCapacityTEU: 3000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "DPFZA" }),
  p("Port Sudan", "SDPZU", "Port Sudan", null, "SD", 19.6036, 37.2272, "seaport", { maxDraft: 12.0, totalBerths: 12, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Sea Ports Corporation" }),
  p("Port of Maputo", "MZMPM", "Maputo", null, "MZ", -25.9696, 32.5752, "container_terminal", { maxDraft: 11.0, totalBerths: 12, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Maputo Port Development Company" }),
  p("Port of Beira", "MZBEW", "Beira", null, "MZ", -19.8330, 34.8667, "seaport", { maxDraft: 9.5, totalBerths: 8, containerCapacityTEU: 250000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Cornelder de Moçambique" }),
  p("Port of Nacala", "MZMNC", "Nacala", null, "MZ", -14.5350, 40.6667, "seaport", { maxDraft: 14.0, totalBerths: 6, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Portos do Norte" }),
  p("Port of Berbera", "SOBBO", "Berbera", null, "SO", 10.4396, 45.0344, "seaport", { maxDraft: 14.0, totalBerths: 6, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: false, operatingAuthority: "DP World Berbera" }),
  p("Port of Massawa", "ERMSW", "Massawa", null, "ER", 15.6063, 39.4540, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Eritrean Ministry of Transport" }),

  // =========================================================================
  // AFRICA — SOUTHERN AFRICA
  // =========================================================================
  p("Port of Durban", "ZADUR", "Durban", null, "ZA", -29.8656, 31.0308, "container_terminal", { maxDraft: 14.0, totalBerths: 30, containerCapacityTEU: 2900000, hasCranes: true, hasRailAccess: true, customsOffice: "SARS Durban", operatingAuthority: "Transnet National Ports Authority" }),
  p("Port of Cape Town", "ZACPT", "Cape Town", null, "ZA", -33.9075, 18.4302, "container_terminal", { maxDraft: 14.0, totalBerths: 14, containerCapacityTEU: 900000, hasCranes: true, hasRailAccess: true, customsOffice: "SARS Cape Town", operatingAuthority: "Transnet National Ports Authority" }),
  p("Port of Ngqura (Coega)", "ZANQU", "Port Elizabeth", null, "ZA", -33.8026, 25.8419, "container_terminal", { maxDraft: 18.0, totalBerths: 6, containerCapacityTEU: 1400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Transnet National Ports Authority" }),
  p("Port Elizabeth (Gqeberha)", "ZAPLZ", "Gqeberha", null, "ZA", -33.7734, 25.6460, "container_terminal", { maxDraft: 13.0, totalBerths: 10, containerCapacityTEU: 700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Transnet National Ports Authority" }),
  p("Port of Richards Bay", "ZARCB", "Richards Bay", null, "ZA", -28.8038, 32.0683, "seaport", { maxDraft: 18.0, totalBerths: 20, hasCranes: true, hasRailAccess: true, operatingAuthority: "Transnet National Ports Authority" }),
  p("Port of East London", "ZAELS", "East London", null, "ZA", -33.0186, 27.9225, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Transnet National Ports Authority" }),
  p("Port of Saldanha Bay", "ZASDB", "Saldanha Bay", null, "ZA", -33.0167, 17.9167, "seaport", { maxDraft: 21.0, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "Transnet National Ports Authority" }),
  p("Port of Walvis Bay", "NAWVB", "Walvis Bay", null, "NA", -22.9467, 14.4917, "container_terminal", { maxDraft: 14.0, totalBerths: 8, containerCapacityTEU: 750000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Namport" }),

  // =========================================================================
  // SOUTH AMERICA — BRAZIL
  // =========================================================================
  p("Port of Santos", "BRSSZ", "Santos", "SP", "BR", -23.9615, -46.3034, "container_terminal", { maxDraft: 15.0, totalBerths: 60, containerCapacityTEU: 4300000, hasCranes: true, hasRailAccess: true, customsOffice: "Receita Federal Santos", operatingAuthority: "Santos Port Authority" }),
  p("Port of Paranaguá", "BRPNG", "Paranaguá", "PR", "BR", -25.5140, -48.5198, "container_terminal", { maxDraft: 13.0, totalBerths: 20, containerCapacityTEU: 900000, hasCranes: true, hasRailAccess: true, operatingAuthority: "APPA" }),
  p("Port of Rio Grande", "BRRIG", "Rio Grande", "RS", "BR", -32.0571, -52.0884, "container_terminal", { maxDraft: 12.5, totalBerths: 14, containerCapacityTEU: 800000, hasCranes: true, hasRailAccess: true, operatingAuthority: "SUPRG" }),
  p("Port of Itajaí / Navegantes", "BRITJ", "Itajaí", "SC", "BR", -26.9052, -48.6659, "container_terminal", { maxDraft: 14.0, totalBerths: 12, containerCapacityTEU: 1400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Itajaí" }),
  p("Port of Manaus", "BRMAO", "Manaus", "AM", "BR", -3.1487, -59.9795, "river_port", { maxDraft: 10.0, totalBerths: 10, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Port of Manaus" }),
  p("Port of Salvador", "BRSSA", "Salvador", "BA", "BR", -12.9713, -38.5176, "container_terminal", { maxDraft: 12.5, totalBerths: 10, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "CODEBA" }),
  p("Port of Suape", "BRSUA", "Ipojuca", "PE", "BR", -8.3925, -35.0030, "container_terminal", { maxDraft: 15.5, totalBerths: 12, containerCapacityTEU: 700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Suape Port Authority" }),
  p("Port of Rio de Janeiro", "BRRIO", "Rio de Janeiro", "RJ", "BR", -22.8900, -43.1733, "container_terminal", { maxDraft: 13.0, totalBerths: 14, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "CDRJ" }),
  p("Port of Vitória", "BRVIX", "Vitória", "ES", "BR", -20.3094, -40.2875, "seaport", { maxDraft: 12.6, totalBerths: 10, containerCapacityTEU: 350000, hasCranes: true, hasRailAccess: true, operatingAuthority: "CODESA" }),
  p("Port of Itaguaí (Sepetiba)", "BRITG", "Itaguaí", "RJ", "BR", -22.9211, -43.8683, "seaport", { maxDraft: 18.3, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "CDRJ" }),
  p("Port of São Luís (Itaqui)", "BRSLZ", "São Luís", "MA", "BR", -2.5700, -44.3517, "seaport", { maxDraft: 18.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "EMAP" }),
  p("Port of Pecém", "BRPEC", "São Gonçalo do Amarante", "CE", "BR", -3.5315, -38.8103, "container_terminal", { maxDraft: 16.0, totalBerths: 6, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "CIPP" }),
  p("Port of Belém", "BRBEL", "Belém", "PA", "BR", -1.4349, -48.4957, "river_port", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "CDP" }),
  p("Port of Fortaleza (Mucuripe)", "BRFOR", "Fortaleza", "CE", "BR", -3.7140, -38.4836, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "CDC" }),
  p("Port of São Francisco do Sul", "BRSFS", "São Francisco do Sul", "SC", "BR", -26.2404, -48.6294, "seaport", { maxDraft: 13.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "SFS Port Authority" }),

  // =========================================================================
  // SOUTH AMERICA — ARGENTINA
  // =========================================================================
  p("Port of Buenos Aires", "ARBUE", "Buenos Aires", null, "AR", -34.5989, -58.3709, "container_terminal", { maxDraft: 10.4, totalBerths: 16, containerCapacityTEU: 1800000, hasCranes: true, hasRailAccess: true, customsOffice: "Aduana Buenos Aires", operatingAuthority: "AGP" }),
  p("Port of Rosario", "ARROS", "Rosario", null, "AR", -32.9500, -60.6450, "river_port", { maxDraft: 10.4, totalBerths: 10, hasCranes: true, hasRailAccess: true, operatingAuthority: "ENAPRO" }),
  p("Port of Bahía Blanca", "ARBHI", "Bahía Blanca", null, "AR", -38.7508, -62.2617, "seaport", { maxDraft: 13.7, totalBerths: 10, hasCranes: true, hasRailAccess: true, operatingAuthority: "CGPBB" }),
  p("Port of Zarate", "ARZAR", "Zárate", null, "AR", -34.0924, -59.0281, "river_port", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Zárate" }),
  p("Port of San Lorenzo", "ARSLO", "San Lorenzo", null, "AR", -32.7477, -60.7335, "river_port", { maxDraft: 10.4, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "San Lorenzo Port" }),

  // =========================================================================
  // SOUTH AMERICA — CHILE
  // =========================================================================
  p("Port of San Antonio", "CLSAI", "San Antonio", null, "CL", -33.5940, -71.6154, "container_terminal", { maxDraft: 14.0, totalBerths: 10, containerCapacityTEU: 1700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "EPSA" }),
  p("Port of Valparaíso", "CLVAP", "Valparaíso", null, "CL", -33.0343, -71.6375, "container_terminal", { maxDraft: 13.0, totalBerths: 8, containerCapacityTEU: 900000, hasCranes: true, hasRailAccess: true, operatingAuthority: "EPV" }),
  p("Port of Iquique", "CLIQQ", "Iquique", null, "CL", -20.2102, -70.1410, "seaport", { maxDraft: 11.5, totalBerths: 6, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: false, operatingAuthority: "EPI" }),
  p("Port of Arica", "CLARI", "Arica", null, "CL", -18.4688, -70.3174, "seaport", { maxDraft: 10.0, totalBerths: 4, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "TPA" }),
  p("Port of Antofagasta", "CLANF", "Antofagasta", null, "CL", -23.6402, -70.4058, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "ATI" }),
  p("Port of Coronel", "CLCNL", "Coronel", null, "CL", -37.0250, -73.1525, "seaport", { maxDraft: 14.0, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "Puerto Coronel" }),
  p("Port of Lirquén", "CLLQN", "Lirquén", null, "CL", -36.7126, -72.9781, "seaport", { maxDraft: 12.0, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "Empresa Portuaria Talcahuano" }),

  // =========================================================================
  // SOUTH AMERICA — COLOMBIA
  // =========================================================================
  p("Port of Cartagena", "COCTG", "Cartagena", null, "CO", 10.3997, -75.5227, "container_terminal", { maxDraft: 16.5, totalBerths: 14, containerCapacityTEU: 3500000, hasCranes: true, hasRailAccess: false, customsOffice: "DIAN Cartagena", operatingAuthority: "Sociedad Portuaria de Cartagena" }),
  p("Port of Buenaventura", "COBUN", "Buenaventura", null, "CO", 3.8816, -77.0716, "container_terminal", { maxDraft: 13.5, totalBerths: 12, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "SPRB" }),
  p("Port of Barranquilla", "COBAQ", "Barranquilla", null, "CO", 10.9850, -74.7745, "river_port", { maxDraft: 10.0, totalBerths: 10, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: true, operatingAuthority: "SPRB" }),
  p("Port of Santa Marta", "COSMR", "Santa Marta", null, "CO", 11.2453, -74.2056, "seaport", { maxDraft: 14.0, totalBerths: 8, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "SPSM" }),

  // =========================================================================
  // SOUTH AMERICA — PERU / ECUADOR / URUGUAY / VENEZUELA
  // =========================================================================
  p("Port of Callao", "PECLL", "Callao", null, "PE", -12.0432, -77.1505, "container_terminal", { maxDraft: 16.0, totalBerths: 14, containerCapacityTEU: 2500000, hasCranes: true, hasRailAccess: false, customsOffice: "SUNAT Callao", operatingAuthority: "APM Terminals Callao / DP World Callao" }),
  p("Port of Paita", "PEPAI", "Paita", null, "PE", -5.0887, -81.1085, "seaport", { maxDraft: 13.0, totalBerths: 6, containerCapacityTEU: 350000, hasCranes: true, hasRailAccess: false, operatingAuthority: "TPE" }),
  p("Port of Matarani", "PEMAT", "Matarani", null, "PE", -17.0051, -72.1074, "seaport", { maxDraft: 11.0, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "TISUR" }),
  p("Port of Guayaquil", "ECGYE", "Guayaquil", null, "EC", -2.2677, -79.9094, "container_terminal", { maxDraft: 10.0, totalBerths: 10, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Contecon / TPG" }),
  p("Port of Manta", "ECMEC", "Manta", null, "EC", -0.9368, -80.7275, "seaport", { maxDraft: 12.5, totalBerths: 4, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Port Authority of Manta" }),
  p("Port of Montevideo", "UYMVD", "Montevideo", null, "UY", -34.8954, -56.2114, "container_terminal", { maxDraft: 12.0, totalBerths: 12, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: true, customsOffice: "Aduana Montevideo", operatingAuthority: "ANP" }),
  p("Port of Puerto Cabello", "VEPBL", "Puerto Cabello", null, "VE", 10.4734, -68.0127, "container_terminal", { maxDraft: 12.0, totalBerths: 14, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Bolipuertos" }),
  p("Port of La Guaira", "VELAG", "La Guaira", null, "VE", 10.6100, -66.9346, "seaport", { maxDraft: 10.0, totalBerths: 8, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Bolipuertos" }),
  p("Port of Maracaibo", "VEMAR", "Maracaibo", null, "VE", 10.6427, -71.6100, "seaport", { maxDraft: 10.0, totalBerths: 8, hasCranes: true, hasRailAccess: false, operatingAuthority: "Bolipuertos" }),

  // =========================================================================
  // CARIBBEAN & CENTRAL AMERICA
  // =========================================================================
  p("Port of Kingston", "JMKIN", "Kingston", null, "JM", 17.9710, -76.8369, "container_terminal", { maxDraft: 15.5, totalBerths: 14, containerCapacityTEU: 2800000, hasCranes: true, hasRailAccess: false, customsOffice: "Jamaica Customs Agency", operatingAuthority: "PAJ / Kingston Freeport Terminal" }),
  p("Freeport Container Port", "BSFPO", "Freeport", null, "BS", 26.5273, -78.7133, "container_terminal", { maxDraft: 16.0, totalBerths: 8, containerCapacityTEU: 2000000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Hutchison Port Holdings" }),
  p("Port of Caucedo", "DOCAU", "Santo Domingo", null, "DO", 18.4271, -69.6371, "container_terminal", { maxDraft: 15.0, totalBerths: 6, containerCapacityTEU: 1500000, hasCranes: true, hasRailAccess: false, operatingAuthority: "DP World Caucedo" }),
  p("Port of Haina", "DOHAI", "San Cristóbal", null, "DO", 18.4178, -70.0194, "container_terminal", { maxDraft: 10.5, totalBerths: 6, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Autoridad Portuaria Dominicana" }),
  p("Port of Balboa", "PABLB", "Balboa", null, "PA", 8.9585, -79.5645, "container_terminal", { maxDraft: 15.5, totalBerths: 12, containerCapacityTEU: 4000000, hasCranes: true, hasRailAccess: true, customsOffice: "Aduanas Panama", operatingAuthority: "Panama Ports Company" }),
  p("Port of Cristóbal (Colón)", "PACFZ", "Colón", null, "PA", 9.3553, -79.9008, "container_terminal", { maxDraft: 15.5, totalBerths: 8, containerCapacityTEU: 3500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Panama Ports Company" }),
  p("Manzanillo International Terminal (MIT)", "PAMIT", "Colón", null, "PA", 9.3486, -79.8747, "container_terminal", { maxDraft: 16.1, totalBerths: 8, containerCapacityTEU: 3500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "MIT" }),
  p("Port of Limón-Moín", "CRLIO", "Limón", null, "CR", 10.0050, -83.0700, "container_terminal", { maxDraft: 12.0, totalBerths: 8, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "JAPDEVA / APM Terminals" }),
  p("Puerto Cortés", "HNPCR", "Puerto Cortés", null, "HN", 15.8393, -87.9497, "container_terminal", { maxDraft: 13.0, totalBerths: 8, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "OPC" }),
  p("Port of Santo Tomás de Castilla", "GTSTC", "Santo Tomás", null, "GT", 15.7000, -88.6200, "seaport", { maxDraft: 11.5, totalBerths: 6, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: true, operatingAuthority: "EMPORNAC" }),
  p("Port of Puerto Quetzal", "GTPRQ", "Escuintla", null, "GT", 13.9236, -90.7883, "seaport", { maxDraft: 12.0, totalBerths: 6, containerCapacityTEU: 250000, hasCranes: true, hasRailAccess: false, operatingAuthority: "EMPORNAC" }),
  p("Port of Havana", "CUHAV", "Havana", null, "CU", 23.1419, -82.3475, "seaport", { maxDraft: 11.0, totalBerths: 12, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Empresa de Navegación Caribe" }),
  p("Port of Mariel", "CUMAR", "Mariel", null, "CU", 22.9939, -82.7579, "container_terminal", { maxDraft: 16.5, totalBerths: 4, containerCapacityTEU: 800000, hasCranes: true, hasRailAccess: true, operatingAuthority: "PSA Panama / TC Mariel" }),
  p("Port of Point Lisas", "TTPLS", "Point Lisas", null, "TT", 10.4041, -61.4701, "seaport", { maxDraft: 12.0, totalBerths: 8, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: false, operatingAuthority: "PLIPDECO" }),
  p("Port of Port of Spain", "TTPOS", "Port of Spain", null, "TT", 10.6509, -61.5165, "container_terminal", { maxDraft: 11.0, totalBerths: 8, containerCapacityTEU: 450000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Port Authority of Trinidad & Tobago" }),
  p("Port of Acajutla", "SVAQJ", "Acajutla", null, "SV", 13.5717, -89.8344, "seaport", { maxDraft: 11.0, totalBerths: 4, containerCapacityTEU: 150000, hasCranes: true, hasRailAccess: true, operatingAuthority: "CEPA" }),
  p("Port of Corinto", "NICIO", "Corinto", null, "NI", 12.4908, -87.1748, "seaport", { maxDraft: 10.5, totalBerths: 4, hasCranes: true, hasRailAccess: false, operatingAuthority: "EPN" }),

  // =========================================================================
  // OCEANIA — AUSTRALIA
  // =========================================================================
  p("Port of Melbourne", "AUMEL", "Melbourne", "VIC", "AU", -37.8277, 144.9184, "container_terminal", { maxDraft: 14.3, totalBerths: 20, containerCapacityTEU: 2900000, hasCranes: true, hasRailAccess: true, customsOffice: "ABF Melbourne", operatingAuthority: "Port of Melbourne" }),
  p("Port of Sydney (Botany)", "AUSYD", "Sydney", "NSW", "AU", -33.9714, 151.2110, "container_terminal", { maxDraft: 14.7, totalBerths: 12, containerCapacityTEU: 2600000, hasCranes: true, hasRailAccess: true, customsOffice: "ABF Sydney", operatingAuthority: "NSW Ports" }),
  p("Port of Brisbane", "AUBNE", "Brisbane", "QLD", "AU", -27.3717, 153.1674, "container_terminal", { maxDraft: 14.9, totalBerths: 16, containerCapacityTEU: 1400000, hasCranes: true, hasRailAccess: true, customsOffice: "ABF Brisbane", operatingAuthority: "Port of Brisbane Pty Ltd" }),
  p("Port of Fremantle", "AUFRE", "Fremantle", "WA", "AU", -32.0513, 115.7403, "container_terminal", { maxDraft: 14.0, totalBerths: 14, containerCapacityTEU: 800000, hasCranes: true, hasRailAccess: true, customsOffice: "ABF Fremantle", operatingAuthority: "Fremantle Ports" }),
  p("Port of Adelaide", "AUADL", "Adelaide", "SA", "AU", -34.7892, 138.4998, "container_terminal", { maxDraft: 14.2, totalBerths: 10, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Flinders Adelaide Container Terminal" }),
  p("Port Hedland", "AUPHE", "Port Hedland", "WA", "AU", -20.3078, 118.5875, "seaport", { maxDraft: 18.5, totalBerths: 14, hasCranes: true, hasRailAccess: true, operatingAuthority: "Pilbara Ports Authority" }),
  p("Port of Gladstone", "AUGLT", "Gladstone", "QLD", "AU", -23.8467, 151.2789, "seaport", { maxDraft: 14.4, totalBerths: 16, hasCranes: true, hasRailAccess: true, operatingAuthority: "Gladstone Ports Corporation" }),
  p("Port of Darwin", "AUDRW", "Darwin", "NT", "AU", -12.4275, 130.8425, "seaport", { maxDraft: 12.0, totalBerths: 8, containerCapacityTEU: 50000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Darwin Port" }),
  p("Port of Dampier", "AUDAM", "Dampier", "WA", "AU", -20.6595, 116.7074, "seaport", { maxDraft: 16.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Pilbara Ports Authority" }),
  p("Port of Newcastle", "AUNTL", "Newcastle", "NSW", "AU", -32.9237, 151.7817, "seaport", { maxDraft: 15.2, totalBerths: 12, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Newcastle" }),
  p("Port of Townsville", "AUTSV", "Townsville", "QLD", "AU", -19.2590, 146.8317, "seaport", { maxDraft: 11.7, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Townsville" }),
  p("Port of Geelong", "AUGEX", "Geelong", "VIC", "AU", -38.1303, 144.3695, "seaport", { maxDraft: 12.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "GeelongPort" }),
  p("Port of Hay Point", "AUHPT", "Hay Point", "QLD", "AU", -21.2742, 149.2933, "seaport", { maxDraft: 18.0, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "North Queensland Bulk Ports" }),

  // =========================================================================
  // OCEANIA — NEW ZEALAND
  // =========================================================================
  p("Port of Auckland", "NZAKL", "Auckland", null, "NZ", -36.8425, 174.7650, "container_terminal", { maxDraft: 13.5, totalBerths: 10, containerCapacityTEU: 900000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Ports of Auckland" }),
  p("Port of Tauranga", "NZTRG", "Tauranga", null, "NZ", -37.6464, 176.1789, "container_terminal", { maxDraft: 14.0, totalBerths: 12, containerCapacityTEU: 1300000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Tauranga" }),
  p("Port of Lyttelton", "NZLYT", "Lyttelton", null, "NZ", -43.6081, 172.7222, "container_terminal", { maxDraft: 12.4, totalBerths: 8, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Lyttelton Port Company" }),
  p("Port of Napier", "NZNPE", "Napier", null, "NZ", -39.4734, 176.9192, "seaport", { maxDraft: 12.5, totalBerths: 6, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Napier Port" }),
  p("Port of Otago (Dunedin)", "NZDUD", "Port Chalmers", null, "NZ", -45.8128, 170.6192, "seaport", { maxDraft: 12.3, totalBerths: 4, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Otago" }),
  p("Port of Wellington", "NZWLG", "Wellington", null, "NZ", -41.2839, 174.7816, "seaport", { maxDraft: 11.6, totalBerths: 6, containerCapacityTEU: 100000, hasCranes: true, hasRailAccess: true, operatingAuthority: "CentrePort" }),
  p("Port of Nelson", "NZNSN", "Nelson", null, "NZ", -41.2617, 173.2848, "seaport", { maxDraft: 8.5, totalBerths: 4, containerCapacityTEU: 100000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Port Nelson" }),

  // =========================================================================
  // OCEANIA — PACIFIC ISLANDS
  // =========================================================================
  p("Port of Suva", "FJSUV", "Suva", null, "FJ", -18.1386, 178.4261, "seaport", { maxDraft: 10.5, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Fiji Ports Corporation" }),
  p("Port of Lautoka", "FJLTK", "Lautoka", null, "FJ", -17.6079, 177.4470, "seaport", { maxDraft: 9.0, totalBerths: 4, hasCranes: true, hasRailAccess: false, operatingAuthority: "Fiji Ports Corporation" }),
  p("Port of Nouméa", "NCNOU", "Nouméa", null, "NC", -22.2735, 166.4421, "seaport", { maxDraft: 10.5, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Port Autonome de Nouvelle-Calédonie" }),
  p("Port of Papeete", "PFPPT", "Papeete", null, "PF", -17.5366, -149.5723, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Port Autonome de Papeete" }),
  p("Port of Guam (Apra Harbor)", "GUMUA", "Hagatna", null, "GU", 13.4443, 144.6358, "container_terminal", { maxDraft: 11.0, totalBerths: 6, containerCapacityTEU: 100000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Port Authority of Guam" }),
  p("Port of Apia", "WSAPW", "Apia", null, "WS", -13.8333, -171.7500, "seaport", { maxDraft: 9.0, totalBerths: 4, hasCranes: true, hasRailAccess: false, operatingAuthority: "Samoa Ports Authority" }),
  p("Port Moresby", "PGPOM", "Port Moresby", null, "PG", -9.4710, 147.1508, "seaport", { maxDraft: 11.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "PNG Ports Corporation" }),
  p("Port of Lae", "PGLAE", "Lae", null, "PG", -6.7340, 147.0050, "seaport", { maxDraft: 11.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "PNG Ports Corporation" }),
  p("Port of Nuku'alofa", "TOTBU", "Nuku'alofa", null, "TO", -21.1367, -175.2017, "seaport", { maxDraft: 8.5, totalBerths: 3, hasCranes: false, hasRailAccess: false, operatingAuthority: "Ports Authority Tonga" }),
  p("Port Vila", "VUVLI", "Port Vila", null, "VU", -17.7333, 168.3167, "seaport", { maxDraft: 10.0, totalBerths: 4, hasCranes: false, hasRailAccess: false, operatingAuthority: "Vanuatu Ports" }),

  // =========================================================================
  // ADDITIONAL EUROPEAN PORTS
  // =========================================================================
  p("Port of Nantes Saint-Nazaire", "FRSNS", "Saint-Nazaire", null, "FR", 47.2705, -2.1994, "seaport", { maxDraft: 14.0, totalBerths: 14, hasCranes: true, hasRailAccess: true, operatingAuthority: "Nantes Saint-Nazaire Port" }),
  p("Port of Bordeaux", "FRBOD", "Bordeaux", null, "FR", 44.8596, -0.5531, "river_port", { maxDraft: 10.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Grand Port Maritime de Bordeaux" }),
  p("Port of Rouen", "FRURO", "Rouen", null, "FR", 49.4390, 1.0660, "river_port", { maxDraft: 11.3, totalBerths: 14, hasCranes: true, hasRailAccess: true, operatingAuthority: "HAROPA Port" }),
  p("Port of Sète", "FRSET", "Sète", null, "FR", 43.3963, 3.7000, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port de Sète" }),
  p("Port of Calais", "FRCQF", "Calais", null, "FR", 50.9662, 1.8640, "seaport", { maxDraft: 10.5, totalBerths: 8, hasCranes: false, hasRailAccess: true, operatingAuthority: "Port Boulogne Calais" }),
  p("Port of Ghent", "BEGNE", "Ghent", null, "BE", 51.0909, 3.7407, "inland_port", { maxDraft: 12.5, totalBerths: 12, hasCranes: true, hasRailAccess: true, operatingAuthority: "North Sea Port" }),
  p("Port of Terneuzen", "NLTNZ", "Terneuzen", null, "NL", 51.3431, 3.8167, "seaport", { maxDraft: 12.5, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "North Sea Port" }),
  p("Port of Moerdijk", "NLMOE", "Moerdijk", null, "NL", 51.7000, 4.5667, "inland_port", { maxDraft: 7.5, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Moerdijk" }),
  p("Port of Duisburg", "DEDUI", "Duisburg", null, "DE", 51.4389, 6.7606, "inland_port", { maxDraft: 4.5, totalBerths: 20, containerCapacityTEU: 4000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Duisport" }),
  p("Port of Brake", "DEBKE", "Brake", null, "DE", 53.3298, 8.4845, "seaport", { maxDraft: 13.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "J. Müller" }),
  p("Port of Emden", "DEEME", "Emden", null, "DE", 53.3395, 7.1810, "seaport", { maxDraft: 10.5, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Niedersachsen Ports" }),
  p("Port of Kiel", "DEKEL", "Kiel", null, "DE", 54.3233, 10.1394, "seaport", { maxDraft: 10.5, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Kiel" }),
  p("Port of Gijon", "ESGIJ", "Gijón", null, "ES", 43.5537, -5.6954, "seaport", { maxDraft: 18.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Gijón" }),
  p("Port of A Coruña", "ESLCG", "A Coruña", null, "ES", 43.3639, -8.3800, "seaport", { maxDraft: 12.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of A Coruña" }),
  p("Port of Huelva", "ESHUV", "Huelva", null, "ES", 37.2478, -6.9461, "seaport", { maxDraft: 16.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Huelva" }),
  p("Port of Cartagena (Spain)", "ESCRT", "Cartagena", null, "ES", 37.5874, -0.9931, "seaport", { maxDraft: 15.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Cartagena" }),
  p("Port of Tenerife (Santa Cruz)", "ESSCT", "Santa Cruz de Tenerife", null, "ES", 28.4657, -16.2470, "seaport", { maxDraft: 14.0, totalBerths: 10, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Port Authority of Santa Cruz de Tenerife" }),
  p("Port of Savona-Vado", "ITSVN", "Savona", null, "IT", 44.2809, 8.4381, "container_terminal", { maxDraft: 14.0, totalBerths: 8, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Western Ligurian Sea" }),
  p("Port of Salerno", "ITSAL", "Salerno", null, "IT", 40.6767, 14.7542, "container_terminal", { maxDraft: 12.0, totalBerths: 8, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Central Tyrrhenian Sea" }),
  p("Port of Taranto", "ITTAR", "Taranto", null, "IT", 40.4608, 17.2195, "seaport", { maxDraft: 16.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Ionian Sea" }),
  p("Port of Ancona", "ITAOI", "Ancona", null, "IT", 43.6233, 13.5062, "seaport", { maxDraft: 11.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Central Adriatic Sea" }),
  p("Port of Bari", "ITBRI", "Bari", null, "IT", 41.1303, 16.8687, "seaport", { maxDraft: 10.5, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Southern Adriatic Sea" }),
  p("Port of Catania", "ITCTA", "Catania", null, "IT", 37.5040, 15.0899, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Eastern Sicily" }),
  p("Port of Palermo", "ITPMO", "Palermo", null, "IT", 38.1267, 13.3600, "seaport", { maxDraft: 11.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port Authority of Western Sicily" }),
  p("Port of Szczecin-Swinoujscie", "PLSZZ", "Szczecin", null, "PL", 53.4214, 14.5488, "seaport", { maxDraft: 13.2, totalBerths: 16, containerCapacityTEU: 100000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Szczecin & Swinoujscie Authority" }),
  p("Port of Turku", "FITKU", "Turku", null, "FI", 60.4396, 22.2256, "seaport", { maxDraft: 10.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Turku" }),
  p("Port of Kotka-HaminaKotka", "FIKTK", "Kotka", null, "FI", 60.4672, 26.9560, "container_terminal", { maxDraft: 12.0, totalBerths: 10, containerCapacityTEU: 700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "HaminaKotka Port" }),
  p("Port of Rauma", "FIRAU", "Rauma", null, "FI", 61.1230, 21.4530, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Rauma" }),
  p("Port of Fredericia", "DKFRC", "Fredericia", null, "DK", 55.5630, 9.7407, "seaport", { maxDraft: 11.5, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "ADP" }),
  p("Port of Helsingborg", "SEHEL", "Helsingborg", null, "SE", 56.0461, 12.6885, "seaport", { maxDraft: 9.5, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Helsingborg" }),
  p("Port of Norrköping", "SENRK", "Norrköping", null, "SE", 58.5946, 16.1567, "seaport", { maxDraft: 10.0, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Norrköping" }),
  p("Port of Tromsø", "NOTOS", "Tromsø", null, "NO", 69.6407, 18.9668, "seaport", { maxDraft: 10.0, totalBerths: 4, hasCranes: false, hasRailAccess: false, operatingAuthority: "Tromsø Havn" }),
  p("Port of Kristiansand", "NOKRS", "Kristiansand", null, "NO", 58.1484, 7.9949, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Kristiansand Havn" }),
  p("Port of Ventspils", "LVVNT", "Ventspils", null, "LV", 57.3944, 21.5480, "seaport", { maxDraft: 15.0, totalBerths: 10, containerCapacityTEU: 100000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Freeport of Ventspils Authority" }),
  p("Port of Liepaja", "LVLPX", "Liepaja", null, "LV", 56.5422, 21.0000, "seaport", { maxDraft: 10.5, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Liepaja Special Economic Zone" }),
  p("Port of Bar", "MEBAR", "Bar", null, "ME", 42.0910, 19.1012, "seaport", { maxDraft: 12.0, totalBerths: 8, containerCapacityTEU: 50000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Bar" }),
  p("Port of Durres", "ALDRZ", "Durrës", null, "AL", 41.3117, 19.4362, "seaport", { maxDraft: 10.0, totalBerths: 8, containerCapacityTEU: 100000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Durrës Port Authority" }),
  p("Port of Valletta", "MTMLA", "Valletta", null, "MT", 35.8936, 14.5180, "container_terminal", { maxDraft: 15.5, totalBerths: 8, containerCapacityTEU: 3300000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Malta Freeport Corporation" }),
  p("Port of Limassol", "CYLMS", "Limassol", null, "CY", 34.6670, 33.0395, "container_terminal", { maxDraft: 14.5, totalBerths: 10, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: false, operatingAuthority: "DP World Limassol" }),

  // =========================================================================
  // ADDITIONAL ASIA PORTS
  // =========================================================================
  p("Port of Hong Kong", "HKHKG", "Hong Kong", null, "HK", 22.3301, 114.1572, "container_terminal", { maxDraft: 15.5, totalBerths: 24, containerCapacityTEU: 17500000, hasCranes: true, hasRailAccess: true, customsOffice: "HK Customs & Excise", operatingAuthority: "Marine Department HKSAR" }),
  p("Port of Macau", "MOMFM", "Macau", null, "MO", 22.1784, 113.5523, "seaport", { maxDraft: 5.5, totalBerths: 4, hasCranes: false, hasRailAccess: false, operatingAuthority: "Capitania dos Portos de Macau" }),
  p("Port of Johor (Pasir Gudang)", "MYJHB", "Johor Bahru", null, "MY", 1.4667, 103.9000, "container_terminal", { maxDraft: 13.0, totalBerths: 10, containerCapacityTEU: 1000000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Johor Port" }),
  p("Port of Kuching", "MYKCH", "Kuching", null, "MY", 1.5660, 110.3833, "seaport", { maxDraft: 7.5, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Kuching Port Authority" }),
  p("Port of Bintulu", "MYBTU", "Bintulu", null, "MY", 3.2508, 113.0325, "seaport", { maxDraft: 13.0, totalBerths: 8, hasCranes: true, hasRailAccess: false, operatingAuthority: "Bintulu Port Authority" }),
  p("Port of Kota Kinabalu (Sabah)", "MYBKI", "Kota Kinabalu", null, "MY", 5.9800, 116.0700, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Sabah Ports" }),
  p("Port of Sandakan", "MYSDK", "Sandakan", null, "MY", 5.8430, 118.0640, "seaport", { maxDraft: 9.0, totalBerths: 4, hasCranes: true, hasRailAccess: false, operatingAuthority: "Sabah Ports" }),
  p("Port of Songkhla", "THSGK", "Songkhla", null, "TH", 7.1897, 100.5900, "seaport", { maxDraft: 8.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Songkhla Port" }),
  p("Port of Quy Nhon", "VNUIH", "Quy Nhon", null, "VN", 13.7648, 109.2346, "seaport", { maxDraft: 11.5, totalBerths: 6, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Quy Nhon Port" }),
  p("Port of Davao", "PHDVO", "Davao", null, "PH", 7.0765, 125.6394, "seaport", { maxDraft: 10.5, totalBerths: 6, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Philippine Ports Authority" }),
  p("Port of Cagayan de Oro", "PHCGY", "Cagayan de Oro", null, "PH", 8.5017, 124.6562, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Philippine Ports Authority" }),
  p("Port of General Santos", "PHGSA", "General Santos", null, "PH", 6.0617, 125.1638, "seaport", { maxDraft: 10.5, totalBerths: 4, hasCranes: true, hasRailAccess: false, operatingAuthority: "Philippine Ports Authority" }),
  p("Port of Vladivostok", "RUVVO", "Vladivostok", null, "RU", 43.1065, 131.8857, "container_terminal", { maxDraft: 12.0, totalBerths: 14, containerCapacityTEU: 700000, hasCranes: true, hasRailAccess: true, operatingAuthority: "VMTP" }),
  p("Port of Vostochny", "RUVYP", "Nakhodka", null, "RU", 42.7489, 133.0658, "container_terminal", { maxDraft: 16.0, totalBerths: 8, containerCapacityTEU: 650000, hasCranes: true, hasRailAccess: true, operatingAuthority: "VICS" }),
  p("Port of Murmansk", "RUMMK", "Murmansk", null, "RU", 68.9733, 33.0761, "seaport", { maxDraft: 15.5, totalBerths: 16, hasCranes: true, hasRailAccess: true, operatingAuthority: "Murmansk Commercial Seaport" }),
  p("Port of Arkhangelsk", "RUARH", "Arkhangelsk", null, "RU", 64.5336, 40.5261, "seaport", { maxDraft: 9.2, totalBerths: 10, hasCranes: true, hasRailAccess: true, operatingAuthority: "Arkhangelsk Sea Commercial Port" }),

  // =========================================================================
  // ADDITIONAL MIDDLE EAST / NORTH AFRICA
  // =========================================================================
  p("Port of Muscat (Sultan Qaboos)", "OMMCT", "Muscat", null, "OM", 23.6281, 58.5730, "seaport", { maxDraft: 12.0, totalBerths: 10, containerCapacityTEU: 350000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Oman Ports" }),
  p("Port of Duqm", "OMDUQ", "Duqm", null, "OM", 19.6544, 57.7018, "seaport", { maxDraft: 18.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Duqm" }),
  p("Port of Aden", "YEADE", "Aden", null, "YE", 12.7856, 45.0133, "container_terminal", { maxDraft: 16.0, totalBerths: 10, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Aden Container Terminal" }),
  p("Port of Hodeidah", "YEHOD", "Hodeidah", null, "YE", 14.7973, 42.9508, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Yemen Ports Authority" }),
  p("Port of Basra (Umm Qasr)", "IQUQR", "Umm Qasr", null, "IQ", 30.0368, 47.9467, "container_terminal", { maxDraft: 12.0, totalBerths: 14, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, operatingAuthority: "General Company for Ports of Iraq" }),
  p("Port of Beirut", "LBBEY", "Beirut", null, "LB", 33.9010, 35.5220, "container_terminal", { maxDraft: 12.0, totalBerths: 14, containerCapacityTEU: 1200000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Port of Beirut" }),
  p("Port of Tartous", "SYTTS", "Tartous", null, "SY", 34.8946, 35.8816, "seaport", { maxDraft: 12.0, totalBerths: 10, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "General Company for Tartous Port" }),
  p("Port of Lattakia", "SYLTK", "Lattakia", null, "SY", 35.5176, 35.7707, "container_terminal", { maxDraft: 14.0, totalBerths: 12, containerCapacityTEU: 500000, hasCranes: true, hasRailAccess: true, operatingAuthority: "General Company for Lattakia Port" }),
  p("Port of Misrata", "LYMRA", "Misrata", null, "LY", 32.3537, 15.2148, "seaport", { maxDraft: 10.5, totalBerths: 8, hasCranes: true, hasRailAccess: false, operatingAuthority: "Libyan Maritime Ports" }),
  p("Port of Tripoli (Libya)", "LYTIP", "Tripoli", null, "LY", 32.8927, 13.1803, "seaport", { maxDraft: 10.0, totalBerths: 10, hasCranes: true, hasRailAccess: false, operatingAuthority: "Libyan Maritime Ports" }),
  p("Port of Tripoli (Lebanon)", "LBKYE", "Tripoli", null, "LB", 34.4485, 35.8296, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Port of Tripoli" }),
  p("Port of Benghazi", "LYBEN", "Benghazi", null, "LY", 32.1174, 20.0534, "seaport", { maxDraft: 10.0, totalBerths: 8, hasCranes: true, hasRailAccess: false, operatingAuthority: "Libyan Maritime Ports" }),

  // =========================================================================
  // ADDITIONAL AFRICA
  // =========================================================================
  p("Port of Toamasina", "MGTMM", "Toamasina", null, "MG", -18.1552, 49.4092, "seaport", { maxDraft: 11.0, totalBerths: 8, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: true, operatingAuthority: "SPAT" }),
  p("Port of Reunion (Le Port)", "RERUN", "Le Port", null, "RE", -20.9370, 55.2897, "seaport", { maxDraft: 13.0, totalBerths: 6, hasCranes: true, hasRailAccess: false, operatingAuthority: "Grand Port Maritime de la Réunion" }),
  p("Port Louis", "MUPLU", "Port Louis", null, "MU", -20.1586, 57.4962, "container_terminal", { maxDraft: 14.5, totalBerths: 8, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: false, operatingAuthority: "Mauritius Ports Authority" }),
  p("Port of Zanzibar", "TZZNZ", "Zanzibar", null, "TZ", -6.1573, 39.1851, "seaport", { maxDraft: 8.0, totalBerths: 4, hasCranes: false, hasRailAccess: false, operatingAuthority: "Zanzibar Ports Corporation" }),
  p("Port of Matadi", "CDMAT", "Matadi", null, "CD", -5.8115, 13.4498, "river_port", { maxDraft: 6.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "SCTP" }),
  p("Port of Lobito", "AOLOB", "Lobito", null, "AO", -12.3622, 13.5481, "seaport", { maxDraft: 10.0, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Porto do Lobito" }),
  p("Port of Banjul", "GMBJL", "Banjul", null, "GM", 13.4531, -16.5753, "seaport", { maxDraft: 8.0, totalBerths: 4, hasCranes: true, hasRailAccess: false, operatingAuthority: "Gambia Ports Authority" }),
  p("Port of Djibouti (Old Port)", "DJJBO", "Djibouti", null, "DJ", 11.5959, 43.1452, "seaport", { maxDraft: 11.0, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "PAID" }),
  p("Port of Kribi", "CMKBI", "Kribi", null, "CM", 2.9247, 9.9117, "container_terminal", { maxDraft: 16.0, totalBerths: 4, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: true, operatingAuthority: "Kribi Multipurpose Terminal" }),

  // =========================================================================
  // ADDITIONAL SOUTH AMERICA
  // =========================================================================
  p("Port of Iquitos", "PEIQT", "Iquitos", null, "PE", -3.7437, -73.2516, "river_port", { maxDraft: 5.0, totalBerths: 4, hasCranes: false, hasRailAccess: false, operatingAuthority: "ENAPU" }),
  p("Port of San Vicente", "CLSVN", "San Vicente", null, "CL", -36.7414, -73.1280, "seaport", { maxDraft: 12.0, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "San Vicente Terminal Internacional" }),
  p("Port of Talcahuano", "CLTCN", "Talcahuano", null, "CL", -36.7183, -73.1128, "seaport", { maxDraft: 11.0, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "Empresa Portuaria Talcahuano" }),
  p("Port of Punta Arenas", "CLPUQ", "Punta Arenas", null, "CL", -53.1514, -70.9203, "seaport", { maxDraft: 9.0, totalBerths: 3, hasCranes: false, hasRailAccess: false, operatingAuthority: "Empresa Portuaria Austral" }),
  p("Port of Georgetown", "GYGEO", "Georgetown", null, "GY", 6.8065, -58.1510, "seaport", { maxDraft: 7.5, totalBerths: 4, hasCranes: true, hasRailAccess: false, operatingAuthority: "Guyana National Shipping Corporation" }),
  p("Port of Paramaribo", "SRPBM", "Paramaribo", null, "SR", 5.8236, -55.1597, "river_port", { maxDraft: 7.0, totalBerths: 4, hasCranes: true, hasRailAccess: false, operatingAuthority: "Suriname Port Management" }),
  p("Port of Cayenne (Degrad des Cannes)", "GFCAY", "Cayenne", null, "GF", 4.8505, -52.2680, "seaport", { maxDraft: 7.5, totalBerths: 3, hasCranes: true, hasRailAccess: false, operatingAuthority: "Grand Port Maritime de Guyane" }),

  // =========================================================================
  // ADDITIONAL US PORTS (for total coverage)
  // =========================================================================
  p("Port of Hueneme Naval", "USHNN", "Ventura", "CA", "US", 34.1475, -119.2072, "seaport", { maxDraft: 11.0, totalBerths: 3, hasCranes: false, hasRailAccess: false, operatingAuthority: "US Navy" }),
  p("Port of Brownsville", "USBRO", "Brownsville", "TX", "US", 25.9648, -97.3895, "seaport", { maxDraft: 12.8, totalBerths: 10, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Brownsville", ftzNumber: "FTZ-62", operatingAuthority: "Brownsville Navigation District" }),
  p("Port of Plaquemines", "USPLQ", "Belle Chasse", "LA", "US", 29.8555, -89.9888, "river_port", { maxDraft: 13.7, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Plaquemines Port, Harbor & Terminal District" }),
  p("Port of St. Bernard", "USSTB", "Chalmette", "LA", "US", 29.9427, -89.9602, "river_port", { maxDraft: 13.0, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "St. Bernard Port, Harbor & Terminal District" }),
  p("Port of Pascagoula", "USPGL", "Pascagoula", "MS", "US", 30.3418, -88.5534, "seaport", { maxDraft: 11.6, totalBerths: 6, hasCranes: true, hasRailAccess: true, customsOffice: "CBP Pascagoula", operatingAuthority: "Jackson County Port Authority" }),
  p("Port of Matagorda Ship Channel", "USMAT", "Point Comfort", "TX", "US", 28.6789, -96.5642, "seaport", { maxDraft: 11.3, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Calhoun County Navigation District" }),
  p("Port of Victoria", "USVCT", "Victoria", "TX", "US", 28.8161, -96.5877, "inland_port", { maxDraft: 3.7, totalBerths: 4, hasCranes: true, hasRailAccess: true, operatingAuthority: "Victoria County Navigation District" }),
  p("Port of Orange", "USORG", "Orange", "TX", "US", 30.1080, -93.7322, "seaport", { maxDraft: 10.1, totalBerths: 4, hasCranes: false, hasRailAccess: true, operatingAuthority: "Orange County Navigation & Port District" }),
  p("Port of Albany", "USALB", "Albany", "NY", "US", 42.6262, -73.7497, "river_port", { maxDraft: 8.2, totalBerths: 6, hasCranes: true, hasRailAccess: true, operatingAuthority: "Port of Albany" }),
  p("Port of Savannah (Ocean Terminal)", "USSVO", "Savannah", "GA", "US", 32.0740, -81.0910, "seaport", { maxDraft: 12.8, totalBerths: 8, hasCranes: true, hasRailAccess: true, operatingAuthority: "Georgia Ports Authority" }),

];

// ===========================================================================
// SEED RUNNER
// ===========================================================================

export async function seedWorldPorts() {
  const db = await getDb();
  if (!db) throw new Error("Database connection unavailable");

  console.log(`[seedWorldPorts] Starting — ${WORLD_PORTS.length} ports to insert...`);

  // Chunk inserts to avoid exceeding MySQL packet limits
  const CHUNK_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < WORLD_PORTS.length; i += CHUNK_SIZE) {
    const chunk = WORLD_PORTS.slice(i, i + CHUNK_SIZE);

    await db
      .insert(ports)
      .values(
        chunk.map((port) => ({
          name: port.name,
          unlocode: port.unlocode,
          city: port.city,
          state: port.state,
          country: port.country,
          coordinates: port.coordinates,
          portType: port.portType,
          maxDraft: port.maxDraft,
          totalBerths: port.totalBerths,
          containerCapacityTEU: port.containerCapacityTEU,
          hasCranes: port.hasCranes,
          hasRailAccess: port.hasRailAccess,
          customsOffice: port.customsOffice,
          ftzNumber: port.ftzNumber,
          operatingAuthority: port.operatingAuthority,
          website: null,
          isActive: port.isActive,
        })),
      )
      .onDuplicateKeyUpdate({
        set: {
          name: sql`VALUES(name)`,
          city: sql`VALUES(city)`,
          state: sql`VALUES(state)`,
          country: sql`VALUES(country)`,
          coordinates: sql`VALUES(coordinates)`,
          portType: sql`VALUES(portType)`,
          maxDraft: sql`VALUES(maxDraft)`,
          totalBerths: sql`VALUES(totalBerths)`,
          containerCapacityTEU: sql`VALUES(containerCapacityTEU)`,
          hasCranes: sql`VALUES(hasCranes)`,
          hasRailAccess: sql`VALUES(hasRailAccess)`,
          customsOffice: sql`VALUES(customsOffice)`,
          ftzNumber: sql`VALUES(ftzNumber)`,
          operatingAuthority: sql`VALUES(operatingAuthority)`,
          isActive: sql`VALUES(isActive)`,
        },
      });

    inserted += chunk.length;
    console.log(`[seedWorldPorts] Inserted ${inserted}/${WORLD_PORTS.length}`);
  }

  console.log(`[seedWorldPorts] Complete — ${inserted} ports seeded.`);
  return { inserted };
}
