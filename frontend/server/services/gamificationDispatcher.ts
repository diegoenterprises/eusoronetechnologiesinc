/**
 * GAMIFICATION EVENT DISPATCHER
 *
 * Lightweight layer that fires gamification events from real app operations.
 * Called from routers (loads, bids, ESANG, lobby, compliance, etc.)
 * Delegates to RewardsEngine for mission progress, badge checks, XP.
 *
 * All calls are fire-and-forget (non-blocking). App operations never
 * fail because of gamification errors.
 */

import { rewardsEngine, type MissionEvent } from "./rewardsEngine";
import { getDb } from "../db";
import {
  missionProgress,
  missions,
  gamificationProfiles,
} from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { emitGamificationEvent } from "../_core/websocket";

// ─── Extended event types beyond what RewardsEngine currently handles ─────────

export type GamificationEventType =
  | "load_created"
  | "load_completed"
  | "load_delivered"
  | "load_cancelled"
  | "bid_submitted"
  | "bid_accepted"
  | "bid_rejected"
  | "delivery_on_time"
  | "rating_received"
  | "miles_driven"
  | "earnings_received"
  | "streak_maintained"
  | "message_sent"       // lobby messages
  | "esang_question"     // ESANG AI questions
  | "document_uploaded"
  | "compliance_check"
  | "erg_lookup"
  | "spectra_match"
  | "profile_updated"
  | "platform_action";   // generic catch-all for "do X actions on the platform"

interface GamificationEvent {
  userId: number;
  type: GamificationEventType;
  value?: number;
  metadata?: Record<string, unknown>;
}

// ─── Mission category mapping ────────────────────────────────────────────────
// Maps event types to which mission categories they can advance

const EVENT_TO_CATEGORIES: Record<GamificationEventType, string[]> = {
  load_created:      ["deliveries", "special", "efficiency"],
  load_completed:    ["deliveries", "special", "efficiency", "earnings"],
  load_delivered:    ["deliveries", "efficiency"],
  load_cancelled:    [],
  bid_submitted:     ["earnings", "deliveries", "efficiency"],
  bid_accepted:      ["earnings", "deliveries"],
  bid_rejected:      [],
  delivery_on_time:  ["deliveries", "efficiency"],
  rating_received:   ["social"],
  miles_driven:      ["deliveries"],
  earnings_received: ["earnings"],
  streak_maintained: ["safety", "efficiency"],
  message_sent:      ["social"],
  esang_question:    ["special", "social"],
  document_uploaded: ["efficiency", "safety"],
  compliance_check:  ["safety"],
  erg_lookup:        ["safety"],
  spectra_match:     ["safety"],
  profile_updated:   ["onboarding"],
  platform_action:   ["social", "onboarding"],
};

// Maps event types to which mission target types they can advance
const EVENT_TO_TARGET_TYPES: Record<GamificationEventType, string[]> = {
  load_created:      ["count"],
  load_completed:    ["count", "streak"],
  load_delivered:    ["count", "streak"],
  load_cancelled:    [],
  bid_submitted:     ["count"],
  bid_accepted:      ["count"],
  bid_rejected:      [],
  delivery_on_time:  ["count", "streak"],
  rating_received:   ["rating", "count"],
  miles_driven:      ["distance"],
  earnings_received: ["amount"],
  streak_maintained: ["streak"],
  message_sent:      ["count"],
  esang_question:    ["count"],
  document_uploaded: ["count"],
  compliance_check:  ["count"],
  erg_lookup:        ["count"],
  spectra_match:     ["count"],
  profile_updated:   ["count"],
  platform_action:   ["count"],
};

// ─── Core Dispatcher ─────────────────────────────────────────────────────────

/**
 * Fire a gamification event. Non-blocking — errors are logged but never thrown.
 */
export function fireGamificationEvent(event: GamificationEvent): void {
  // Fire and forget — don't await, don't block the caller
  _processEvent(event).catch(err => {
    console.error(`[GamificationDispatcher] Error processing ${event.type} for user ${event.userId}:`, err);
  });
}

async function _processEvent(event: GamificationEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const { userId, type, value = 1, metadata } = event;
  if (!userId) return;

  console.log(`[GamificationDispatcher] ${type} user=${userId} value=${value}`);

  const validCategories = EVENT_TO_CATEGORIES[type] || [];
  const validTargetTypes = EVENT_TO_TARGET_TYPES[type] || [];
  if (validCategories.length === 0 || validTargetTypes.length === 0) return;

  // Get all active in_progress missions for this user
  const userMissions = await db
    .select({
      progressId: missionProgress.id,
      missionId: missionProgress.missionId,
      currentProgress: missionProgress.currentProgress,
      targetProgress: missionProgress.targetProgress,
      status: missionProgress.status,
      missionName: missions.name,
      missionCategory: missions.category,
      missionTargetType: missions.targetType,
      missionTargetValue: missions.targetValue,
      missionXpReward: missions.xpReward,
      missionRewardType: missions.rewardType,
      missionRewardValue: missions.rewardValue,
    })
    .from(missionProgress)
    .innerJoin(missions, eq(missionProgress.missionId, missions.id))
    .where(
      and(
        eq(missionProgress.userId, userId),
        eq(missionProgress.status, "in_progress"),
        eq(missions.isActive, true)
      )
    );

  if (userMissions.length === 0) return;

  let totalXpEarned = 0;
  const completedMissions: string[] = [];

  for (const um of userMissions) {
    // Check if this event matches this mission's category AND target type
    const categoryMatch = validCategories.includes(um.missionCategory as string);
    const targetTypeMatch = validTargetTypes.includes(um.missionTargetType as string);

    if (!categoryMatch || !targetTypeMatch) continue;

    // Calculate new progress
    const current = parseFloat(um.currentProgress || "0");
    const target = parseFloat(um.missionTargetValue || um.targetProgress || "1");
    const newProgress = current + value;
    const isCompleted = newProgress >= target;

    await db.update(missionProgress)
      .set({
        currentProgress: Math.min(newProgress, target).toString(),
        status: isCompleted ? "completed" : "in_progress",
        completedAt: isCompleted ? new Date() : undefined,
        lastProgressAt: new Date(),
      })
      .where(eq(missionProgress.id, um.progressId));

    if (isCompleted) {
      completedMissions.push(um.missionName || "Mission");
      totalXpEarned += um.missionXpReward || 0;

      console.log(`[GamificationDispatcher] ✅ Mission "${um.missionName}" COMPLETED for user ${userId}`);
    } else {
      console.log(`[GamificationDispatcher] 📊 Mission "${um.missionName}" progress: ${newProgress}/${target} for user ${userId}`);
    }
  }

  // If missions completed, update XP on gamification profile
  if (totalXpEarned > 0) {
    const [profile] = await db
      .select()
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, userId))
      .limit(1);

    if (profile) {
      const newCurrentXp = (profile.currentXp || 0) + totalXpEarned;
      const newTotalXp = (profile.totalXp || 0) + totalXpEarned;

      // Check for level up
      let level = profile.level || 1;
      let xpToNext = profile.xpToNextLevel || 1000;
      let currentXp = newCurrentXp;

      while (currentXp >= xpToNext) {
        currentXp -= xpToNext;
        level++;
        xpToNext = Math.floor(1000 * Math.pow(1.2, level - 1));
      }

      const stats = (profile.stats as any) || {};
      stats.totalMissionsCompleted = (stats.totalMissionsCompleted || 0) + completedMissions.length;

      await db.update(gamificationProfiles)
        .set({
          currentXp: currentXp,
          totalXp: newTotalXp,
          level,
          xpToNextLevel: xpToNext,
          stats,
          lastActivityAt: new Date(),
        })
        .where(eq(gamificationProfiles.id, profile.id));

      // Emit websocket event for real-time UI updates
      try {
        emitGamificationEvent(
          String(userId),
          "GAMIFICATION_EVENT" as any,
          {
            eventType: "mission_completed",
            userId: String(userId),
            data: {
              completedMissions,
              xpEarned: totalXpEarned,
              newLevel: level,
              newXp: currentXp,
            },
          } as any
        );
      } catch {}
    }
  }

  // Update streak on any activity
  try {
    await rewardsEngine.updateStreak(userId);
  } catch {}
}
