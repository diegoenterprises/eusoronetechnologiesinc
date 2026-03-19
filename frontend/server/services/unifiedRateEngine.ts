/**
 * UNIFIED RATE ENGINE
 * Single source of truth for freight rate calculations.
 * Replaces 5 independent pricing engines with one consistent output.
 */
import { getDb } from "../db";
import { loads } from "../../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { logger } from "../_core/logger";
import { cacheThrough } from "./cache/redisCache";

export interface RateRequest {
  originState: string;
  destState: string;
  distance: number;
  cargoType?: string;
  equipmentType?: string;
  hazmatClass?: string;
  weight?: number;
  urgency?: 'normal' | 'urgent' | 'critical';
  transportMode?: 'TRUCK' | 'RAIL' | 'VESSEL';
  numberOfCars?: number;
  numberOfContainers?: number;
  containerSize?: '20ft' | '40ft' | '40hc' | '45ft';
}

export interface RateResult {
  spotRate: number;
  contractRate: number;
  ratePerMile: number;
  confidence: number;
  range: { low: number; high: number };
  source: 'lane_history' | 'equipment_base' | 'market_avg';
}

const BASE_RATES: Record<string, number> = {
  dry_van: 2.45, reefer: 2.85, flatbed: 2.95,
  liquid_tank: 3.25, gas_tank: 3.50, hazmat_van: 3.10,
  step_deck: 2.75, lowboy: 3.50, auto_carrier: 2.20,
  hopper: 2.60, tanker: 3.30, intermodal: 2.15,
};

const RAIL_RATES: Record<string, number> = {
  boxcar: 1.60, gondola: 1.45, hopper: 1.30, tank_car: 1.85,
  flat_car: 1.50, refrigerated: 2.10, autorack: 1.70,
  intermodal_well: 1.40, centerbeam: 1.55, covered_hopper: 1.35,
};

const VESSEL_RATES: Record<string, number> = {
  '20ft': 1800, '40ft': 2800, '40hc': 3100, '45ft': 3400,
  container: 2800, bulk_dry: 0.08, bulk_liquid: 0.12,
  breakbulk: 0.15, ro_ro: 3500, reefer: 4200, project_cargo: 0.20,
};

function computeModeBaseRate(mode: string, req: RateRequest): number {
  if (mode === 'RAIL') {
    const perMile = RAIL_RATES[req.equipmentType || 'boxcar'] || 1.50;
    const cars = req.numberOfCars || 1;
    return perMile * req.distance * cars;
  }
  if (mode === 'VESSEL') {
    const key = req.containerSize || req.equipmentType || 'container';
    const rateVal = VESSEL_RATES[key];
    if (rateVal !== undefined && rateVal < 1) {
      return rateVal * (req.weight || 20000) * (req.numberOfContainers || 1);
    }
    return (rateVal || 2800) * (req.numberOfContainers || 1);
  }
  return (BASE_RATES[req.equipmentType || 'dry_van'] || 2.50) * req.distance;
}

export async function calculateRate(req: RateRequest): Promise<RateResult> {
  const mode = req.transportMode || 'TRUCK';
  const cacheKey = `rate:${mode}:${req.originState}:${req.destState}:${req.equipmentType || 'any'}`;

  return cacheThrough("WARM", cacheKey, async () => {
    const db = await getDb();
    let baseRate: number;
    let source: RateResult['source'] = 'equipment_base';
    let confidence = 50;

    // 1. Try lane history (best source)
    if (db) {
      try {
        const [history] = await db.select({
          avg: sql<number>`AVG(CAST(rate AS DECIMAL))`,
          cnt: sql<number>`COUNT(*)`,
        }).from(loads).where(and(
          eq(loads.originState, req.originState),
          eq(loads.destState, req.destState),
          eq(loads.status, 'delivered'),
          gte(loads.createdAt, new Date(Date.now() - 90 * 86400000)),
        ));

        if (history?.cnt >= 5) {
          baseRate = Number(history.avg);
          source = 'lane_history';
          confidence = Math.min(95, 60 + history.cnt);
        } else {
          baseRate = computeModeBaseRate(mode, req);
        }
      } catch {
        baseRate = computeModeBaseRate(mode, req);
      }
    } else {
      baseRate = computeModeBaseRate(mode, req);
    }

    // 2. Adjustments
    let rate = baseRate;
    if (req.hazmatClass) rate *= 1.15;
    if (req.urgency === 'urgent') rate *= 1.10;
    if (req.urgency === 'critical') rate *= 1.25;

    const spotRate = Math.round(rate * 100) / 100;
    return {
      spotRate,
      contractRate: Math.round(spotRate * 0.94 * 100) / 100,
      ratePerMile: req.distance > 0 ? Math.round(spotRate / req.distance * 100) / 100 : 0,
      confidence,
      range: { low: Math.round(spotRate * 0.85 * 100) / 100, high: Math.round(spotRate * 1.15 * 100) / 100 },
      source,
    };
  }, 900); // 15min cache
}
