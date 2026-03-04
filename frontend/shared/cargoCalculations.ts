/**
 * SHARED CARGO CALCULATIONS — Server-side weight fallback
 *
 * Lightweight subset of the full cargo calculations for server-side use.
 * The full tables live in client/src/lib/cargoCalculations.ts (frontend).
 * This module provides a server-side fallback for auto-calculating weight
 * when the frontend doesn't send it (e.g. RecurringLoadScheduler, legacy flows).
 */

// Top-20 liquid product densities (lbs/gal) — covers ~90% of terminal loads
const LIQUID_DENSITY: Record<string, number> = {
  "crude oil": 7.2, "gasoline": 6.1, "diesel": 7.1, "diesel fuel": 7.1,
  "jet fuel": 6.7, "kerosene": 6.7, "heating oil": 7.1, "fuel oil": 7.9,
  "ethanol": 6.6, "biodiesel": 7.3, "propane": 4.2, "butane": 4.9,
  "lng": 3.5, "natural gas": 3.5, "water": 8.34, "potable water": 8.34,
  "milk": 8.6, "sulfuric acid": 15.3, "hydrochloric acid": 9.9,
  "sodium hydroxide": 13.4, "ammonia": 5.15, "asphalt": 8.6,
};

// Top-15 dry bulk densities (lbs/cu ft) — covers common hopper/pneumatic loads
const BULK_DENSITY: Record<string, number> = {
  "cement": 94, "portland cement": 94, "fly ash": 70, "sand": 100,
  "frac sand": 100, "limestone": 88, "flour": 37, "sugar": 55,
  "salt": 75, "plastic pellets": 35, "corn": 45, "soybeans": 47,
  "wheat": 48, "barley": 39, "oats": 26,
};

// USDA standard bushel weights (lbs/bu)
const BUSHEL_WT: Record<string, number> = {
  "corn": 56, "soybeans": 60, "wheat": 60, "oats": 32, "barley": 48,
  "rye": 56, "rice": 45, "sorghum": 56, "milo": 56, "sunflower": 24,
  "canola": 50,
};

function fuzzyLookup(table: Record<string, number>, name: string): number | null {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  if (table[key] !== undefined) return table[key];
  for (const [k, v] of Object.entries(table)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

/**
 * Server-side weight auto-calculation fallback.
 * Call this when weight is null/undefined but quantity + quantityUnit + productName exist.
 * Returns weight in lbs or null if unable to calculate.
 */
export function serverCalcWeight(
  quantity: number,
  quantityUnit: string,
  productName: string,
): number | null {
  if (!quantity || quantity <= 0) return null;
  const unit = (quantityUnit || "").toLowerCase().trim();

  // Liquid volume → lbs via density
  if (unit === "gallons" || unit === "gal") {
    const d = fuzzyLookup(LIQUID_DENSITY, productName);
    return Math.round(quantity * (d ?? 7));
  }
  if (unit === "barrels" || unit === "bbl") {
    const gallons = quantity * 42;
    const d = fuzzyLookup(LIQUID_DENSITY, productName);
    return Math.round(gallons * (d ?? 7));
  }
  if (unit === "liters") {
    const gallons = quantity * 0.2642;
    const d = fuzzyLookup(LIQUID_DENSITY, productName);
    return Math.round(gallons * (d ?? 7));
  }

  // Cubic volume → lbs via bulk density
  if (unit === "cubic yards") {
    const d = fuzzyLookup(BULK_DENSITY, productName);
    return d ? Math.round(quantity * 27 * d) : Math.round(quantity * 2700);
  }
  if (unit === "cubic feet") {
    const d = fuzzyLookup(BULK_DENSITY, productName);
    return d ? Math.round(quantity * d) : Math.round(quantity * 80);
  }
  if (unit === "cubic meters") {
    const d = fuzzyLookup(BULK_DENSITY, productName);
    return d ? Math.round(quantity * 35.315 * d) : Math.round(quantity * 2800);
  }

  // Bushels → product-specific USDA weight
  if (unit === "bushels") {
    const bw = fuzzyLookup(BUSHEL_WT, productName);
    return Math.round(quantity * (bw ?? 56));
  }

  // Tons → exact
  if (unit === "tons") return Math.round(quantity * 2000);

  // Drums → 55 gal * density
  if (unit === "drums") {
    const d = fuzzyLookup(LIQUID_DENSITY, productName);
    return Math.round(quantity * 55 * (d ?? 10.9)); // 600 lbs / 55 gal ≈ 10.9
  }

  // Head (livestock)
  if (unit === "head") return Math.round(quantity * 1200);

  // Vehicles
  if (unit === "vehicles") return Math.round(quantity * 3800);

  // Pallets
  if (unit === "pallets") return Math.round(quantity * 1500);

  // Containers / TEU
  if (unit === "containers" || unit === "teu") return Math.round(quantity * 44000);

  // Pieces / bundles / linear feet
  if (unit === "pieces") return Math.round(quantity * 2000);
  if (unit === "bundles") return Math.round(quantity * 3000);
  if (unit === "linear feet") return Math.round(quantity * 300);

  // Cords / MBF (timber)
  if (unit === "cords") return Math.round(quantity * 5000);
  if (unit === "mbf") return Math.round(quantity * 6000);

  // Cases / Boxes / Units
  if (unit === "cases") return Math.round(quantity * 30);
  if (unit === "boxes") return Math.round(quantity * 25);
  if (unit === "units") return Math.round(quantity * 50);

  return null;
}
