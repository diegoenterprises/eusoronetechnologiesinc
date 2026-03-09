// GAP-444: Blockchain Audit Trail — Immutable transaction log for compliance
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

export class BlockchainService {
  /** Log an event to the blockchain audit trail with SHA-256 hash chain */
  static async logEvent(loadId: number, eventType: string, eventData: any): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      // Get previous block hash for this load
      const [prevRows] = await db.execute(
        sql`SELECT blockHash FROM blockchain_audit_trail WHERE loadId = ${loadId} ORDER BY id DESC LIMIT 1`
      ) as any;
      const previousHash = prevRows?.[0]?.blockHash || "GENESIS";

      // Create block data and hash it
      const blockData = JSON.stringify({ loadId, eventType, eventData, previousHash, timestamp: new Date().toISOString() });
      const blockHash = this.sha256Hash(blockData);

      await db.execute(
        sql`INSERT INTO blockchain_audit_trail (loadId, eventType, eventData, blockHash, previousBlockHash)
            VALUES (${loadId}, ${eventType}, ${JSON.stringify(eventData)}, ${blockHash}, ${previousHash})`
      );
    } catch (err) {
      console.error("[BlockchainService] logEvent error:", err);
    }
  }

  /** Verify the integrity of a load's audit chain */
  static async verifyChain(loadId: number): Promise<{ valid: boolean; blockCount: number; issues: string[] }> {
    const db = await getDb();
    if (!db) return { valid: false, blockCount: 0, issues: ["Database unavailable"] };

    const [rows] = await db.execute(
      sql`SELECT id, blockHash, previousBlockHash, eventType, eventData, timestamp FROM blockchain_audit_trail WHERE loadId = ${loadId} ORDER BY id ASC`
    ) as any;

    const blocks = rows || [];
    const issues: string[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      // First block should reference GENESIS
      if (i === 0 && block.previousBlockHash !== "GENESIS") {
        issues.push(`Block ${block.id}: first block does not reference GENESIS`);
      }
      // Subsequent blocks should reference previous block's hash
      if (i > 0 && block.previousBlockHash !== blocks[i - 1].blockHash) {
        issues.push(`Block ${block.id}: hash chain broken (expected ${blocks[i - 1].blockHash?.substring(0, 8)}...)`);
      }
    }

    return { valid: issues.length === 0, blockCount: blocks.length, issues };
  }

  /** Generate a compliance report for a load's full audit trail */
  static async generateComplianceReport(loadId: number): Promise<any> {
    const db = await getDb();
    if (!db) return { loadId, blocks: [], chainValid: false };

    const [rows] = await db.execute(
      sql`SELECT id, eventType, eventData, blockHash, previousBlockHash, timestamp FROM blockchain_audit_trail WHERE loadId = ${loadId} ORDER BY id ASC`
    ) as any;

    const blocks = (rows || []).map((r: any) => ({
      id: r.id,
      eventType: r.eventType,
      eventData: typeof r.eventData === "string" ? JSON.parse(r.eventData) : r.eventData,
      blockHash: r.blockHash,
      previousBlockHash: r.previousBlockHash,
      timestamp: r.timestamp,
    }));

    const verification = await this.verifyChain(loadId);

    return {
      loadId,
      generatedAt: new Date().toISOString(),
      blocks,
      blockCount: blocks.length,
      chainValid: verification.valid,
      issues: verification.issues,
    };
  }

  private static sha256Hash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}
