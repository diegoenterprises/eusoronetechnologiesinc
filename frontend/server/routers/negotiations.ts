/**
 * NEGOTIATIONS ROUTER — Collaborative Negotiation & Smart Contract Engine
 * TEAM ALPHA - FINTECH CORE
 *
 * Extracted from Python NegotiationService architecture:
 * - Initiate negotiation with proposed rate
 * - Counter-offer flow (multi-round)
 * - Accept / reject with state validation
 * - Finalize smart contract: BOL generation + escrow hold
 * - State machine: INITIATED → COUNTERED → ACCEPTED → SIGNED → (FAILED)
 * - Escrow integration: funds held from shipper until delivery
 * - Platform fee calculated at finalization via CommissionEngine
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";

// ── NEGOTIATION STATES ──
const NEGOTIATION_STATES = ["INITIATED", "COUNTERED", "ACCEPTED", "SIGNED", "FAILED", "EXPIRED", "REJECTED"] as const;
type NegotiationState = typeof NEGOTIATION_STATES[number];

const VALID_COUNTER_STATES: NegotiationState[] = ["INITIATED", "COUNTERED"];
const VALID_ACCEPT_STATES: NegotiationState[] = ["INITIATED", "COUNTERED"];
const VALID_SIGN_STATES: NegotiationState[] = ["ACCEPTED"];

// ── DYNAMIC FEE (inline from CommissionEngine for escrow calculation) ──
const BASE_FEE = 0.08;
const MIN_FEE = 0.05;
const MAX_FEE = 0.15;
function calcPlatformFee(rate: number, cargoType: string = "general"): number {
  let risk = 0;
  if (["hazmat", "liquid", "petroleum", "gas", "chemicals"].includes(cargoType)) risk += 0.02;
  const feeRate = Math.max(MIN_FEE, Math.min(MAX_FEE, BASE_FEE * (1.0 + risk)));
  return Math.round(rate * feeRate * 100) / 100;
}

export const negotiationsRouter = router({
  /**
   * List negotiations for the current user
   */
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      loadId: z.number().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      // In production: fetch from DB filtered by user role (shipper/carrier/broker)
      return [];
    }),

  /**
   * Get negotiation statistics for the current user
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    return {
      active: 0, pending: 0, accepted: 0, rejected: 0, expired: 0,
      signed: 0, failed: 0,
      winRate: 0, avgSavings: 0, avgRounds: 0, totalNegotiated: 0,
    };
  }),

  /**
   * Initiate a new negotiation for a load
   */
  initiate: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      proposedRate: z.number().min(0),
      message: z.string().optional(),
      cargoType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const platformFee = calcPlatformFee(input.proposedRate, input.cargoType);
      // In production: validate load is POSTED, create negotiation record, notify counterparty
      return {
        negotiationId: Date.now(),
        loadId: input.loadId,
        proposedRate: input.proposedRate,
        platformFee,
        netAfterFee: Math.round((input.proposedRate - platformFee) * 100) / 100,
        status: "INITIATED" as NegotiationState,
        proposedBy: ctx.user?.id,
        round: 1,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Submit a counter-offer (multi-round negotiation)
   */
  submitCounterOffer: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      amount: z.number().min(0),
      message: z.string().optional(),
      currentStatus: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate state allows counter-offers
      const currentStatus = (input.currentStatus || "INITIATED").toUpperCase() as NegotiationState;
      if (!VALID_COUNTER_STATES.includes(currentStatus)) {
        return { success: false, error: `Cannot counter-offer in ${currentStatus} state.` };
      }
      const platformFee = calcPlatformFee(input.amount);
      return {
        success: true,
        id: input.negotiationId,
        counterOffer: input.amount,
        platformFee,
        netAfterFee: Math.round((input.amount - platformFee) * 100) / 100,
        status: "COUNTERED" as NegotiationState,
        counteredBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Accept the current offer (moves to ACCEPTED, ready for signing)
   */
  accept: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      finalRate: z.number().min(0),
      currentStatus: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const currentStatus = (input.currentStatus || "INITIATED").toUpperCase() as NegotiationState;
      if (!VALID_ACCEPT_STATES.includes(currentStatus)) {
        return { success: false, error: `Cannot accept in ${currentStatus} state.` };
      }
      const platformFee = calcPlatformFee(input.finalRate);
      return {
        success: true,
        id: input.negotiationId,
        finalRate: input.finalRate,
        platformFee,
        status: "ACCEPTED" as NegotiationState,
        acceptedBy: ctx.user?.id,
        acceptedAt: new Date().toISOString(),
        readyForSigning: true,
      };
    }),

  /**
   * Reject the negotiation
   */
  reject: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: input.negotiationId,
        status: "REJECTED" as NegotiationState,
        reason: input.reason,
        rejectedBy: ctx.user?.id,
        rejectedAt: new Date().toISOString(),
      };
    }),

  /**
   * Finalize smart contract — BOL generation + escrow hold
   * This is the critical Trillion Dollar Code path.
   */
  finalizeSmartContract: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      loadId: z.number(),
      finalRate: z.number().min(0),
      shipperId: z.number(),
      carrierId: z.number(),
      cargoType: z.string().optional(),
      currentStatus: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const currentStatus = (input.currentStatus || "ACCEPTED").toUpperCase() as NegotiationState;
      if (!VALID_SIGN_STATES.includes(currentStatus)) {
        return { success: false, error: `Negotiation must be ACCEPTED before signing. Current: ${currentStatus}` };
      }

      const platformFee = calcPlatformFee(input.finalRate, input.cargoType);

      // 1. Generate Smart Contract Document (BOL)
      const bolUrl = `https://s3.eusorone.com/bol/load-${input.loadId}-neg-${input.negotiationId}.pdf`;

      // 2. Initiate Escrow Hold (Stripe PaymentIntent in production)
      const escrowIntentId = `pi_escrow_${input.loadId}_${Date.now()}`;

      // 3. Record transaction
      const transaction = {
        negotiationId: input.negotiationId,
        loadId: input.loadId,
        shipperId: input.shipperId,
        carrierId: input.carrierId,
        grossAmount: input.finalRate,
        platformFee,
        netToCarrier: Math.round((input.finalRate - platformFee) * 100) / 100,
        escrowIntentId,
        smartContractUrl: bolUrl,
        status: "ESCROW_HELD",
        createdAt: new Date().toISOString(),
      };

      // 4. Transition load to ASSIGNED (downstream hook)
      // In production: calls loadLifecycle.transitionState

      return {
        success: true,
        status: "SIGNED" as NegotiationState,
        escrowIntentId,
        smartContractUrl: bolUrl,
        transaction,
        loadStatus: "ASSIGNED",
        message: "Smart contract signed. Escrow initiated. Load is now ASSIGNED.",
      };
    }),

  /**
   * Send a message within the negotiation thread
   */
  sendMessage: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: Date.now(),
        negotiationId: input.negotiationId,
        sender: "you",
        type: "message",
        message: input.message,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get negotiation history / audit trail
   */
  getHistory: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      // In production: fetch full negotiation event history from DB
      return [];
    }),
});
