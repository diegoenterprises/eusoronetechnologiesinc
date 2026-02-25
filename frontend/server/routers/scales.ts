/**
 * SCALES ROUTER
 * tRPC procedures for weigh station information
 * Reference data: major US weigh stations with GPS coordinates,
 * hours, bypass programs, and hazmat inspection capabilities.
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

interface WeighStation {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  highway: string;
  direction: string;
  hours: string;
  bypassPrograms: string[];
  hazmatInspection: boolean;
  prepassEnabled: boolean;
  status: "open" | "closed" | "unknown";
}

const WEIGH_STATIONS: WeighStation[] = [
  { id: "TX-001", name: "Amarillo POE", state: "TX", lat: 35.1992, lng: -101.8450, highway: "I-40", direction: "EB/WB", hours: "24/7", bypassPrograms: ["PrePass", "Drivewyze"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "TX-002", name: "Falfurrias Checkpoint", state: "TX", lat: 27.2272, lng: -98.1442, highway: "US-281", direction: "NB", hours: "24/7", bypassPrograms: [], hazmatInspection: true, prepassEnabled: false, status: "open" },
  { id: "TX-003", name: "Sierra Blanca POE", state: "TX", lat: 31.1746, lng: -105.3572, highway: "I-10", direction: "EB/WB", hours: "24/7", bypassPrograms: ["PrePass"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "TX-004", name: "Orange POE", state: "TX", lat: 30.0930, lng: -93.7366, highway: "I-10", direction: "WB", hours: "24/7", bypassPrograms: ["PrePass", "Drivewyze"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "TX-005", name: "Laredo POE", state: "TX", lat: 27.5036, lng: -99.5075, highway: "I-35", direction: "NB", hours: "24/7", bypassPrograms: ["PrePass"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "OK-001", name: "Colbert POE", state: "OK", lat: 33.8573, lng: -96.5003, highway: "US-69/75", direction: "NB", hours: "24/7", bypassPrograms: ["PrePass"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "OK-002", name: "Gene Nolan Turnpike POE", state: "OK", lat: 34.7500, lng: -97.2500, highway: "I-35", direction: "NB/SB", hours: "Mon-Fri 8a-5p", bypassPrograms: ["PrePass", "Drivewyze"], hazmatInspection: false, prepassEnabled: true, status: "open" },
  { id: "LA-001", name: "Vinton POE", state: "LA", lat: 30.1903, lng: -93.5804, highway: "I-10", direction: "EB", hours: "24/7", bypassPrograms: ["PrePass"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "LA-002", name: "Slidell POE", state: "LA", lat: 30.2752, lng: -89.7812, highway: "I-10", direction: "WB", hours: "24/7", bypassPrograms: ["PrePass", "Drivewyze"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "NM-001", name: "Anthony POE", state: "NM", lat: 32.0036, lng: -106.5995, highway: "I-10", direction: "EB/WB", hours: "24/7", bypassPrograms: ["PrePass"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "NM-002", name: "Las Cruces POE", state: "NM", lat: 32.3199, lng: -106.7637, highway: "I-25", direction: "NB/SB", hours: "Mon-Fri 7a-5p", bypassPrograms: ["PrePass"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "CA-001", name: "Banning POE", state: "CA", lat: 33.9253, lng: -116.8763, highway: "I-10", direction: "WB", hours: "24/7", bypassPrograms: ["PrePass", "Drivewyze"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "CA-002", name: "Needles POE", state: "CA", lat: 34.8480, lng: -114.6143, highway: "I-40", direction: "WB", hours: "24/7", bypassPrograms: ["PrePass"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "CA-003", name: "Yermo POE", state: "CA", lat: 34.9036, lng: -116.8236, highway: "I-15", direction: "SB", hours: "24/7", bypassPrograms: ["PrePass", "Drivewyze"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "AZ-001", name: "Ehrenberg POE", state: "AZ", lat: 33.6031, lng: -114.5253, highway: "I-10", direction: "EB", hours: "24/7", bypassPrograms: ["PrePass"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "AZ-002", name: "Sanders POE", state: "AZ", lat: 35.2200, lng: -109.3300, highway: "I-40", direction: "WB", hours: "24/7", bypassPrograms: ["PrePass", "Drivewyze"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "GA-001", name: "Ringgold POE", state: "GA", lat: 34.9159, lng: -85.1091, highway: "I-75", direction: "SB", hours: "24/7", bypassPrograms: ["PrePass", "Drivewyze"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "FL-001", name: "Wildwood POE", state: "FL", lat: 28.8566, lng: -82.0432, highway: "I-75", direction: "NB/SB", hours: "24/7", bypassPrograms: ["PrePass"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "MI-001", name: "New Buffalo POE", state: "MI", lat: 41.7936, lng: -86.7458, highway: "I-94", direction: "EB", hours: "24/7", bypassPrograms: ["PrePass", "Drivewyze"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "IL-001", name: "East St. Louis POE", state: "IL", lat: 38.6237, lng: -90.1507, highway: "I-64", direction: "EB", hours: "Mon-Fri 7a-5p", bypassPrograms: ["PrePass"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "OH-001", name: "Steubenville POE", state: "OH", lat: 40.3698, lng: -80.6340, highway: "US-22", direction: "EB/WB", hours: "24/7", bypassPrograms: ["PrePass", "Drivewyze"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "PA-001", name: "Nesquehoning POE", state: "PA", lat: 40.8623, lng: -75.8188, highway: "I-476", direction: "NB/SB", hours: "Mon-Sat 6a-10p", bypassPrograms: ["PrePass"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "TN-001", name: "Memphis POE", state: "TN", lat: 35.0553, lng: -90.0691, highway: "I-40", direction: "EB", hours: "24/7", bypassPrograms: ["PrePass", "Drivewyze"], hazmatInspection: true, prepassEnabled: true, status: "open" },
  { id: "AR-001", name: "West Memphis POE", state: "AR", lat: 35.1465, lng: -90.1848, highway: "I-40", direction: "WB", hours: "24/7", bypassPrograms: ["PrePass"], hazmatInspection: true, prepassEnabled: true, status: "open" },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const scalesRouter = router({
  list: protectedProcedure.input(z.object({ state: z.string().optional(), limit: z.number().optional() }).optional()).query(async ({ input }) => {
    let results = [...WEIGH_STATIONS];
    if (input?.state) {
      results = results.filter(s => s.state === input.state!.toUpperCase());
    }
    return results.slice(0, input?.limit || 50);
  }),

  getNearby: protectedProcedure.input(z.object({ lat: z.number().optional(), lng: z.number().optional(), limit: z.number().optional() })).query(async ({ input }) => {
    if (!input.lat || !input.lng) return WEIGH_STATIONS.slice(0, input.limit || 10);
    const withDistance = WEIGH_STATIONS.map(s => ({
      ...s,
      distanceMiles: Math.round(haversineDistance(input.lat!, input.lng!, s.lat, s.lng) * 10) / 10,
    }));
    withDistance.sort((a, b) => a.distanceMiles - b.distanceMiles);
    return withDistance.slice(0, input.limit || 10);
  }),
});
