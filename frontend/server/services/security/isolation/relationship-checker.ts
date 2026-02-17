/**
 * RELATIONSHIP CHECKER
 * Verifies L3 (Relationship) level access — determines if a user is a
 * participant in a transaction (load, bid, invoice, agreement, etc.).
 *
 * This is critical for shared data like loads, where shipper, carrier,
 * driver, and broker all need access but nobody else should see it.
 */

import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { getDb } from "../../../db";

export type ParticipantRole = "shipper" | "carrier" | "driver" | "broker" | "dispatch" | "escort" | "factoring";

export interface ParticipantInfo {
  role: ParticipantRole;
  userId: number;
  companyId?: number | null;
}

/**
 * Verify that a user is a participant in a load.
 * Checks direct user ID match AND organization membership.
 * Returns the participant's role in the load.
 *
 * Throws NOT_FOUND if the load doesn't exist or user isn't a participant.
 */
export async function verifyLoadParticipant(
  loadId: number | string,
  userId: number | string,
  organizationId?: number | string | null
): Promise<ParticipantInfo> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const uid = Number(userId);
  const lid = Number(loadId);

  try {
    const rows = await db.execute(
      sql`SELECT shipper_id AS shipperId, carrier_id AS carrierId, 
                 driver_id AS driverId, broker_id AS brokerId,
                 shipper_company_id AS shipperCompanyId, 
                 carrier_company_id AS carrierCompanyId,
                 dispatch_id AS dispatchId, escort_id AS escortId
          FROM loads WHERE id = ${lid} LIMIT 1`
    );

    const load = Array.isArray(rows) && rows.length > 0
      ? (Array.isArray(rows[0]) ? rows[0][0] : rows[0])
      : null;

    if (!load) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Load not found" });
    }

    // Check direct user participation
    if (Number(load.shipperId) === uid) return { role: "shipper", userId: uid, companyId: load.shipperCompanyId };
    if (Number(load.carrierId) === uid) return { role: "carrier", userId: uid, companyId: load.carrierCompanyId };
    if (Number(load.driverId) === uid) return { role: "driver", userId: uid };
    if (Number(load.brokerId) === uid) return { role: "broker", userId: uid };
    if (Number(load.dispatchId) === uid) return { role: "dispatch", userId: uid };
    if (Number(load.escortId) === uid) return { role: "escort", userId: uid };

    // Check organization membership
    if (organizationId) {
      const oid = Number(organizationId);
      if (Number(load.shipperCompanyId) === oid) return { role: "shipper", userId: uid, companyId: oid };
      if (Number(load.carrierCompanyId) === oid) return { role: "carrier", userId: uid, companyId: oid };
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    // Swallow DB errors — return NOT_FOUND
  }

  throw new TRPCError({
    code: "NOT_FOUND",
    message: "Load not found",
  });
}

/**
 * Verify that a user is a participant in a conversation.
 * Messages are only visible to conversation participants.
 */
export async function verifyConversationParticipant(
  conversationId: number | string,
  userId: number | string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const uid = Number(userId);
  const cid = Number(conversationId);

  try {
    const rows = await db.execute(
      sql`SELECT 1 FROM conversation_participants 
          WHERE conversation_id = ${cid} AND user_id = ${uid} AND left_at IS NULL 
          LIMIT 1`
    );

    const found = Array.isArray(rows) && rows.length > 0
      ? (Array.isArray(rows[0]) ? rows[0].length > 0 : true)
      : false;

    if (!found) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a participant in this conversation",
      });
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a participant in this conversation",
    });
  }
}

/**
 * Verify that a user is a participant in a bid (carrier who submitted or shipper/broker who received).
 */
export async function verifyBidParticipant(
  bidId: number | string,
  userId: number | string,
  organizationId?: number | string | null
): Promise<ParticipantInfo> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const uid = Number(userId);
  const bid = Number(bidId);

  try {
    const rows = await db.execute(
      sql`SELECT b.carrier_id AS carrierId, l.shipper_id AS shipperId, l.broker_id AS brokerId,
                 l.shipper_company_id AS shipperCompanyId, l.carrier_company_id AS carrierCompanyId
          FROM bids b JOIN loads l ON b.load_id = l.id
          WHERE b.id = ${bid} LIMIT 1`
    );

    const row = Array.isArray(rows) && rows.length > 0
      ? (Array.isArray(rows[0]) ? rows[0][0] : rows[0])
      : null;

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Bid not found" });
    }

    if (Number(row.carrierId) === uid) return { role: "carrier", userId: uid };
    if (Number(row.shipperId) === uid) return { role: "shipper", userId: uid };
    if (Number(row.brokerId) === uid) return { role: "broker", userId: uid };

    if (organizationId) {
      const oid = Number(organizationId);
      if (Number(row.shipperCompanyId) === oid) return { role: "shipper", userId: uid, companyId: oid };
      if (Number(row.carrierCompanyId) === oid) return { role: "carrier", userId: uid, companyId: oid };
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err;
  }

  throw new TRPCError({ code: "NOT_FOUND", message: "Bid not found" });
}

/**
 * Verify that a user is a party to an invoice (issuer or recipient).
 */
export async function verifyInvoiceParticipant(
  invoiceId: number | string,
  userId: number | string,
  organizationId?: number | string | null
): Promise<ParticipantInfo> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const uid = Number(userId);
  const iid = Number(invoiceId);

  try {
    const rows = await db.execute(
      sql`SELECT issuer_id AS issuerId, recipient_id AS recipientId,
                 issuer_company_id AS issuerCompanyId, recipient_company_id AS recipientCompanyId
          FROM invoices WHERE id = ${iid} LIMIT 1`
    );

    const row = Array.isArray(rows) && rows.length > 0
      ? (Array.isArray(rows[0]) ? rows[0][0] : rows[0])
      : null;

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
    }

    if (Number(row.issuerId) === uid) return { role: "carrier", userId: uid };
    if (Number(row.recipientId) === uid) return { role: "shipper", userId: uid };

    if (organizationId) {
      const oid = Number(organizationId);
      if (Number(row.issuerCompanyId) === oid) return { role: "carrier", userId: uid, companyId: oid };
      if (Number(row.recipientCompanyId) === oid) return { role: "shipper", userId: uid, companyId: oid };
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err;
  }

  throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
}

/**
 * Check if user has any relationship with another user
 * (through loads, agreements, or active business connections).
 * Used to determine if profile information can be shared.
 */
export async function hasBusinessRelationship(
  userId: number | string,
  otherUserId: number | string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const uid = Number(userId);
  const other = Number(otherUserId);

  try {
    const rows = await db.execute(
      sql`SELECT 1 FROM loads 
          WHERE (shipper_id = ${uid} OR carrier_id = ${uid} OR driver_id = ${uid} OR broker_id = ${uid})
            AND (shipper_id = ${other} OR carrier_id = ${other} OR driver_id = ${other} OR broker_id = ${other})
          LIMIT 1`
    );

    return Array.isArray(rows) && rows.length > 0 &&
      (Array.isArray(rows[0]) ? rows[0].length > 0 : true);
  } catch {
    return false;
  }
}
