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

export async function calculateRate(req: RateRequest): Promise<RateResult> {
  const cacheKey = `rate:${req.originState}:${req.destState}:${req.equipmentType || 'any'}`;

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
          baseRate = (BASE_RATES[req.equipmentType || 'dry_van'] || 2.50) * req.distance;
        }
      } catch {
        baseRate = (BASE_RATES[req.equipmentType || 'dry_van'] || 2.50) * req.distance;
      }
    } else {
      baseRate = (BASE_RATES[req.equipmentType || 'dry_van'] || 2.50) * req.distance;
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
