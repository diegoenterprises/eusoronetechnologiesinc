// GAP-448: IMDG Code Integration — International Maritime Dangerous Goods
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export class IMDGService {
  // DOT → IMDG class mapping
  private static readonly IMDG_MAP: Record<string, string> = {
    "1": "Class 1", "1.1": "Class 1.1", "1.2": "Class 1.2", "1.3": "Class 1.3",
    "2": "Class 2", "2.1": "Class 2.1", "2.2": "Class 2.2", "2.3": "Class 2.3",
    "3": "Class 3",
    "4": "Class 4", "4.1": "Class 4.1", "4.2": "Class 4.2", "4.3": "Class 4.3",
    "5": "Class 5", "5.1": "Class 5.1", "5.2": "Class 5.2",
    "6": "Class 6", "6.1": "Class 6.1", "6.2": "Class 6.2",
    "7": "Class 7", "8": "Class 8", "9": "Class 9",
  };

  // Packing group descriptions
  static readonly PACKING_GROUPS: Record<string, string> = {
    "I": "Great danger — highest level of packaging required",
    "II": "Medium danger — standard packaging",
    "III": "Minor danger — basic packaging sufficient",
  };

  static mapDotToImdg(dotClass: string): string {
    return this.IMDG_MAP[dotClass] || "Class 9";
  }

  /** Create IMDG compliance record for multi-modal (road + sea) shipment */
  static async createCompliance(
    loadId: number,
    dotClass: string,
    properShippingName: string,
    packingGroup?: string
  ): Promise<any> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const imdgClass = this.mapDotToImdg(dotClass);

    await db.execute(
      sql`INSERT INTO imdg_compliance (loadId, imdgClass, imdgProperShippingName, packingGroupCode)
          VALUES (${loadId}, ${imdgClass}, ${properShippingName}, ${packingGroup || null})`
    );

    return { loadId, imdgClass, properShippingName, packingGroupCode: packingGroup };
  }

  /** Get IMDG compliance for a load */
  static async getCompliance(loadId: number): Promise<any> {
    const db = await getDb();
    if (!db) return null;

    const [rows] = await db.execute(
      sql`SELECT * FROM imdg_compliance WHERE loadId = ${loadId} LIMIT 1`
    ) as any;

    if (!rows?.[0]) return null;
    const r = rows[0];
    return {
      ...r,
      packingGroupDescription: r.packingGroupCode ? this.PACKING_GROUPS[r.packingGroupCode] : null,
    };
  }

  /** Mark container packing certificate as generated */
  static async setPackingCertUrl(loadId: number, url: string): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.execute(
      sql`UPDATE imdg_compliance SET containerPackingCertUrl = ${url} WHERE loadId = ${loadId}`
    );
  }

  /** Mark DG declaration form as generated */
  static async setDGDeclarationUrl(loadId: number, url: string): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.execute(
      sql`UPDATE imdg_compliance SET dgDeclarationFormUrl = ${url} WHERE loadId = ${loadId}`
    );
  }

  /** Mark vessel manifest as submitted */
  static async markVesselManifestSubmitted(loadId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.execute(
      sql`UPDATE imdg_compliance SET vesselManifestSubmitted = true WHERE loadId = ${loadId}`
    );
  }

  static getClassMappings(): Array<{ dotClass: string; imdgClass: string }> {
    return Object.entries(this.IMDG_MAP).map(([dotClass, imdgClass]) => ({ dotClass, imdgClass }));
  }
}
