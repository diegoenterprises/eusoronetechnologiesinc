// GAP-449: EU ADR Compliance Engine
// European Agreement on Dangerous Goods by Road compliance service
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export class ADRService {
  // US DOT → EU ADR class mapping
  private static readonly ADR_CLASS_MAP: Record<string, string> = {
    "1": "1", "1.1": "1.1", "1.2": "1.2", "1.3": "1.3", "1.4": "1.4", "1.5": "1.5", "1.6": "1.6",
    "2": "2", "2.1": "2.1", "2.2": "2.2", "2.3": "2.3",
    "3": "3",
    "4": "4", "4.1": "4.1", "4.2": "4.2", "4.3": "4.3",
    "5": "5", "5.1": "5.1", "5.2": "5.2",
    "6": "6", "6.1": "6.1", "6.2": "6.2",
    "7": "7",
    "8": "8",
    "9": "9",
  };

  // Tunnel restriction codes per ADR Annex III
  private static readonly TUNNEL_RESTRICTIONS: Record<string, string> = {
    "Class3_UN1203": "C",  // Gasoline
    "Class3_UN1223": "B",  // Kerosene
    "Class3_UN1267": "C",  // Petroleum crude oil
    "Class4_UN2312": "D",  // Phosphorus white
    "Class5_UN2014": "A",  // Hydrogen peroxide >60%
    "Class5_UN2015": "B",  // Hydrogen peroxide 20-60%
    "Class6_UN1851": "E",  // Medicine
    "Class8_UN1830": "E",  // Sulfuric acid (fuming)
    "Class8_UN1789": "C",  // Hydrochloric acid
    "Class9_UN3077": "E",  // Environmentally hazardous solid
  };

  // Tunnel code descriptions
  static readonly TUNNEL_CODE_DESC: Record<string, string> = {
    "A": "Not permitted in Category A tunnels (length > 5km with restricted ventilation)",
    "B": "Permitted only in Category B tunnels with enhanced safety measures",
    "C": "Limited to specific routes — standard tunnel transit permitted",
    "D": "Restrictions on specific tunnel sections with high traffic density",
    "E": "Special permits required for all tunnel transits",
  };

  static mapDotToAdr(dotClass: string): string {
    return this.ADR_CLASS_MAP[dotClass] || dotClass;
  }

  static getTunnelRestrictionCode(adrClass: string, unNumber: string): string {
    const key = `Class${adrClass.split(".")[0]}_${unNumber}`;
    return this.TUNNEL_RESTRICTIONS[key] || "C";
  }

  /** Create ADR compliance record for a load */
  static async createCompliance(loadId: number, dotClass: string, unNumber: string): Promise<any> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const adrClass = this.mapDotToAdr(dotClass);
    const tunnelCode = this.getTunnelRestrictionCode(adrClass, unNumber);

    await db.execute(
      sql`INSERT INTO adr_compliance (loadId, adrClass, adrUnNumber, tunnelRestrictionCode)
          VALUES (${loadId}, ${adrClass}, ${unNumber}, ${tunnelCode})
          ON DUPLICATE KEY UPDATE adrClass = ${adrClass}, adrUnNumber = ${unNumber}, tunnelRestrictionCode = ${tunnelCode}`
    );

    return { loadId, adrClass, unNumber, tunnelRestrictionCode: tunnelCode, tunnelDescription: this.TUNNEL_CODE_DESC[tunnelCode] };
  }

  /** Validate driver ADR certification */
  static async validateDriverCertification(driverId: number, adrClass: string): Promise<{ valid: boolean; cert?: any; reason?: string }> {
    const db = await getDb();
    if (!db) return { valid: false, reason: "Database unavailable" };

    const [rows] = await db.execute(
      sql`SELECT * FROM adr_driver_certifications WHERE driverId = ${driverId} AND (adrClass = ${adrClass} OR adrClass IS NULL) ORDER BY expiryDate DESC LIMIT 1`
    ) as any;

    const cert = rows?.[0];
    if (!cert) return { valid: false, reason: "No ADR certification found for this driver and class" };
    if (new Date(cert.expiryDate) < new Date()) return { valid: false, reason: "ADR certification expired", cert };
    return { valid: true, cert };
  }

  /** Get ADR compliance for a load */
  static async getCompliance(loadId: number): Promise<any> {
    const db = await getDb();
    if (!db) return null;

    const [rows] = await db.execute(
      sql`SELECT * FROM adr_compliance WHERE loadId = ${loadId} LIMIT 1`
    ) as any;

    if (!rows?.[0]) return null;
    const r = rows[0];
    return {
      ...r,
      tunnelDescription: this.TUNNEL_CODE_DESC[r.tunnelRestrictionCode] || "Unknown restriction code",
    };
  }

  /** List all ADR class mappings for reference */
  static getClassMappings(): Array<{ dotClass: string; adrClass: string }> {
    return Object.entries(this.ADR_CLASS_MAP).map(([dotClass, adrClass]) => ({ dotClass, adrClass }));
  }
}
