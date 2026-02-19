/**
 * USDA Agricultural Truck Rates Integration
 * Source: USDA Market News (marketnews.usda.gov)
 * Auth: None
 * Refresh: Daily at 6 AM
 */
import { getDb } from "../../db";
import { hzRateIndices } from "../../../drizzle/schema";

const USDA_BASE = "https://marketnews.usda.gov/mnp/ls-report-api";

const REGIONAL_REPORTS: Record<string, string> = {
  Western: "SF_FV010",
  Central: "KC_FV010",
  Eastern: "NY_FV010",
  Southeast: "AT_FV010",
  Texas: "FW_FV010",
};

function mapUSDAEquipment(truckType: string): "DRY_VAN" | "REEFER" | "FLATBED" | "TANKER" | "ALL" {
  if (!truckType) return "ALL";
  const lower = truckType.toLowerCase();
  if (lower.includes("reefer") || lower.includes("refrigerated")) return "REEFER";
  if (lower.includes("flatbed")) return "FLATBED";
  if (lower.includes("tanker") || lower.includes("tank")) return "TANKER";
  if (lower.includes("van")) return "DRY_VAN";
  return "ALL";
}

export async function fetchUSDATruckRates(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const [region, reportId] of Object.entries(REGIONAL_REPORTS)) {
    try {
      const url = new URL(USDA_BASE);
      url.searchParams.set("reportid", reportId);
      url.searchParams.set("format", "json");

      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
      if (!response.ok) continue;

      let data: any;
      try {
        data = await response.json();
      } catch {
        continue;
      }

      for (const record of data.results || []) {
        const lowRate = parseFloat(record.low_price) || 0;
        const highRate = parseFloat(record.high_price) || 0;
        if (lowRate === 0 && highRate === 0) continue;

        const avgRate = (lowRate + highRate) / 2;
        const id = `${reportId}-${record.report_date || new Date().toISOString().split("T")[0]}-${(record.origin || "").slice(0, 20)}-${(record.destination || "").slice(0, 20)}`;

        try {
          await db
            .insert(hzRateIndices)
            .values({
              id: id.slice(0, 36),
              origin: record.origin || null,
              destination: record.destination || null,
              region,
              ratePerMile: String(avgRate),
              equipmentType: mapUSDAEquipment(record.truck_type),
              rateType: "SPOT",
              source: "USDA",
              reportDate: record.report_date || new Date().toISOString().split("T")[0],
            })
            .onDuplicateKeyUpdate({
              set: {
                ratePerMile: String(avgRate),
                fetchedAt: new Date(),
              },
            });
        } catch {
          // Skip individual record errors
        }
      }

      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.error(`[USDA] Failed to fetch ${region}:`, e);
    }
  }
}
