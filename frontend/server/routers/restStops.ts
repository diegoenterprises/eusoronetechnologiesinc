/**
 * REST STOPS ROUTER
 * tRPC procedures for rest stop and truck stop information
 * Reference data: major truck stops along key hazmat corridors
 * with amenities, parking, and hazmat-relevant features.
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

interface TruckStop {
  id: string;
  name: string;
  chain: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  highway: string;
  exit: string;
  amenities: string[];
  truckParking: number;
  hazmatParking: boolean;
  dieselLanes: number;
  defFuel: boolean;
  scales: boolean;
  showers: boolean;
  restaurant: boolean;
  open24h: boolean;
}

const TRUCK_STOPS: TruckStop[] = [
  { id: "TS-TX-001", name: "Pilot Travel Center #362", chain: "Pilot", state: "TX", city: "Amarillo", lat: 35.2220, lng: -101.8313, highway: "I-40", exit: "Exit 75", amenities: ["PJ Fresh", "Subway", "Laundry", "WiFi", "CAT Scale"], truckParking: 150, hazmatParking: true, dieselLanes: 12, defFuel: true, scales: true, showers: true, restaurant: true, open24h: true },
  { id: "TS-TX-002", name: "Love's Travel Stop #339", chain: "Loves", state: "TX", city: "San Antonio", lat: 29.5108, lng: -98.3568, highway: "I-35", exit: "Exit 160", amenities: ["Godfather's Pizza", "Chester's", "Laundry", "WiFi"], truckParking: 120, hazmatParking: true, dieselLanes: 10, defFuel: true, scales: true, showers: true, restaurant: true, open24h: true },
  { id: "TS-TX-003", name: "TA Express #193", chain: "TravelCenters", state: "TX", city: "Laredo", lat: 27.5640, lng: -99.4902, highway: "I-35", exit: "Exit 12", amenities: ["Country Pride", "Popeyes", "Game Room", "WiFi"], truckParking: 200, hazmatParking: true, dieselLanes: 14, defFuel: true, scales: true, showers: true, restaurant: true, open24h: true },
  { id: "TS-TX-004", name: "Buc-ee's New Braunfels", chain: "Buc-ees", state: "TX", city: "New Braunfels", lat: 29.6530, lng: -98.0900, highway: "I-35", exit: "Exit 189", amenities: ["BBQ", "Fudge", "Beaver Nuggets", "Clean Restrooms", "EV Charging"], truckParking: 0, hazmatParking: false, dieselLanes: 0, defFuel: false, scales: false, showers: false, restaurant: true, open24h: true },
  { id: "TS-OK-001", name: "Pilot Travel Center #614", chain: "Pilot", state: "OK", city: "Oklahoma City", lat: 35.4676, lng: -97.5164, highway: "I-40", exit: "Exit 119", amenities: ["Wendy's", "Laundry", "WiFi", "CAT Scale"], truckParking: 100, hazmatParking: true, dieselLanes: 8, defFuel: true, scales: true, showers: true, restaurant: true, open24h: true },
  { id: "TS-LA-001", name: "Love's Travel Stop #460", chain: "Loves", state: "LA", city: "Shreveport", lat: 32.4543, lng: -93.7402, highway: "I-20", exit: "Exit 11", amenities: ["Arby's", "Laundry", "WiFi", "Tire Care"], truckParking: 90, hazmatParking: true, dieselLanes: 8, defFuel: true, scales: false, showers: true, restaurant: true, open24h: true },
  { id: "TS-NM-001", name: "Pilot Travel Center #465", chain: "Pilot", state: "NM", city: "Las Cruces", lat: 32.3425, lng: -106.7624, highway: "I-10", exit: "Exit 139", amenities: ["Subway", "Cinnabon", "Laundry", "WiFi"], truckParking: 80, hazmatParking: true, dieselLanes: 8, defFuel: true, scales: true, showers: true, restaurant: true, open24h: true },
  { id: "TS-AZ-001", name: "Love's Travel Stop #619", chain: "Loves", state: "AZ", city: "Tucson", lat: 32.1563, lng: -110.9747, highway: "I-10", exit: "Exit 264", amenities: ["Chester's", "Godfather's", "Laundry", "WiFi"], truckParking: 110, hazmatParking: true, dieselLanes: 10, defFuel: true, scales: true, showers: true, restaurant: true, open24h: true },
  { id: "TS-CA-001", name: "Pilot Travel Center #200", chain: "Pilot", state: "CA", city: "Barstow", lat: 34.8524, lng: -117.0178, highway: "I-15", exit: "Exit 183", amenities: ["McDonald's", "Laundry", "WiFi", "CAT Scale"], truckParking: 130, hazmatParking: true, dieselLanes: 10, defFuel: true, scales: true, showers: true, restaurant: true, open24h: true },
  { id: "TS-GA-001", name: "TA Travel Center #27", chain: "TravelCenters", state: "GA", city: "Cartersville", lat: 34.1651, lng: -84.7999, highway: "I-75", exit: "Exit 293", amenities: ["Country Pride", "Popeyes", "Laundry", "Game Room"], truckParking: 160, hazmatParking: true, dieselLanes: 12, defFuel: true, scales: true, showers: true, restaurant: true, open24h: true },
  { id: "TS-FL-001", name: "Love's Travel Stop #504", chain: "Loves", state: "FL", city: "Ocala", lat: 29.1550, lng: -82.1450, highway: "I-75", exit: "Exit 354", amenities: ["Arby's", "Laundry", "WiFi"], truckParking: 100, hazmatParking: true, dieselLanes: 8, defFuel: true, scales: false, showers: true, restaurant: true, open24h: true },
  { id: "TS-TN-001", name: "Pilot Travel Center #102", chain: "Pilot", state: "TN", city: "Nashville", lat: 36.1189, lng: -86.6918, highway: "I-24", exit: "Exit 56", amenities: ["Denny's", "Laundry", "WiFi", "CAT Scale"], truckParking: 120, hazmatParking: true, dieselLanes: 10, defFuel: true, scales: true, showers: true, restaurant: true, open24h: true },
  { id: "TS-MI-001", name: "Love's Travel Stop #710", chain: "Loves", state: "MI", city: "Battle Creek", lat: 42.3048, lng: -85.1637, highway: "I-94", exit: "Exit 97", amenities: ["Chester's", "Laundry", "WiFi"], truckParking: 80, hazmatParking: true, dieselLanes: 8, defFuel: true, scales: false, showers: true, restaurant: true, open24h: true },
  { id: "TS-OH-001", name: "Pilot Travel Center #390", chain: "Pilot", state: "OH", city: "Columbus", lat: 39.9642, lng: -82.8813, highway: "I-70", exit: "Exit 112", amenities: ["Subway", "Cinnabon", "Laundry", "WiFi"], truckParking: 110, hazmatParking: true, dieselLanes: 10, defFuel: true, scales: true, showers: true, restaurant: true, open24h: true },
  { id: "TS-PA-001", name: "TA Travel Center #42", chain: "TravelCenters", state: "PA", city: "Harrisburg", lat: 40.2663, lng: -76.8861, highway: "I-81", exit: "Exit 65", amenities: ["Country Pride", "Burger King", "Laundry", "Game Room"], truckParking: 140, hazmatParking: true, dieselLanes: 12, defFuel: true, scales: true, showers: true, restaurant: true, open24h: true },
  { id: "TS-IL-001", name: "Pilot Travel Center #118", chain: "Pilot", state: "IL", city: "Effingham", lat: 39.1223, lng: -88.5632, highway: "I-57/I-70", exit: "Exit 159", amenities: ["PJ Fresh", "Subway", "Laundry", "WiFi", "CAT Scale"], truckParking: 130, hazmatParking: true, dieselLanes: 10, defFuel: true, scales: true, showers: true, restaurant: true, open24h: true },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const restStopsRouter = router({
  list: protectedProcedure.input(z.object({ route: z.string().optional(), limit: z.number().optional() }).optional()).query(async ({ input }) => {
    let results = [...TRUCK_STOPS];
    if (input?.route) {
      const r = input.route.toUpperCase();
      results = results.filter(s => s.highway.toUpperCase().includes(r));
    }
    return results.slice(0, input?.limit || 20);
  }),

  getNearby: protectedProcedure.input(z.object({ lat: z.number().optional(), lng: z.number().optional(), limit: z.number().optional() })).query(async ({ input }) => {
    if (!input.lat || !input.lng) return TRUCK_STOPS.slice(0, input.limit || 10);
    const withDistance = TRUCK_STOPS.map(s => ({
      ...s,
      distanceMiles: Math.round(haversineDistance(input.lat!, input.lng!, s.lat, s.lng) * 10) / 10,
    }));
    withDistance.sort((a, b) => a.distanceMiles - b.distanceMiles);
    return withDistance.slice(0, input.limit || 10);
  }),
});
