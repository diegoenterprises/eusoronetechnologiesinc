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
  load_created:      ["deliveries", "special", "efficiency", "earnings"],
  load_completed:    ["deliveries", "special", "efficiency", "earnings", "safety"],
  load_delivered:    ["deliveries", "efficiency", "safety"],
  load_cancelled:    [],
  bid_submitted:     ["earnings", "deliveries", "efficiency"],
  bid_accepted:      ["earnings", "deliveries", "efficiency"],
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
  spectra_match:     ["safety", "special"],
  profile_updated:   ["onboarding", "social"],
  platform_action:   ["social", "onboarding", "special", "efficiency"],
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
  streak_maintained: ["streak", "count"],
  message_sent:      ["count"],
  esang_question:    ["count"],
  document_uploaded: ["count"],
  compliance_check:  ["count", "streak"],
  erg_lookup:        ["count"],
  spectra_match:     ["count"],
  profile_updated:   ["count"],
  platform_action:   ["count"],
};

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_ACTIVE_MISSIONS_PER_USER = 10;

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

// ─── Gamification Lifecycle ──────────────────────────────────────────────────

/**
 * Ensure a gamification profile exists for a user (called on OAuth login).
 * Idempotent — safe to call on every login.
 */
export async function ensureGamificationProfile(userId: number): Promise<void> {
  if (!userId) return;
  const db = await getDb();
  if (!db) return;

  try {
    const [existing] = await db.select({ id: gamificationProfiles.id })
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, userId))
      .limit(1);

    if (existing) return;

    await db.insert(gamificationProfiles).values({
      userId,
      level: 1,
      currentXp: 0,
      totalXp: 0,
      xpToNextLevel: 1000,
      currentMiles: "0",
      totalMilesEarned: "0",
      streakDays: 0,
      longestStreak: 0,
      stats: {
        totalMissionsCompleted: 0,
        totalBadgesEarned: 0,
        totalCratesOpened: 0,
        perfectDeliveries: 0,
        onTimeRate: 0,
      },
    });
    console.log(`[GamificationDispatcher] Profile created for user ${userId}`);
  } catch (err: any) {
    if (!err?.message?.includes("Duplicate")) {
      console.error(`[GamificationDispatcher] ensureProfile error for user ${userId}:`, err);
    }
  }
}

/**
 * Clean up all gamification data for a deleted/deactivated user.
 * Removes: mission_progress, gamification_profiles, user_badges, reward_crates, rewards.
 */
export async function cleanupDeletedUser(userId: number): Promise<void> {
  if (!userId) return;
  const db = await getDb();
  if (!db) return;

  try {
    // Delete in order: progress → badges → crates → rewards → profile
    await db.execute(sql`DELETE FROM mission_progress WHERE userId = ${userId}`);
    await db.execute(sql`DELETE FROM user_badges WHERE userId = ${userId}`);
    await db.execute(sql`DELETE FROM reward_crates WHERE userId = ${userId}`);
    await db.execute(sql`DELETE FROM rewards WHERE userId = ${userId}`);
    await db.execute(sql`DELETE FROM gamification_profiles WHERE userId = ${userId}`);
    await db.execute(sql`DELETE FROM leaderboards WHERE userId = ${userId}`);

    console.log(`[GamificationDispatcher] Cleaned up gamification data for user ${userId}`);
  } catch (err) {
    console.error(`[GamificationDispatcher] Cleanup error for user ${userId}:`, err);
  }
}

/**
 * Enforce active mission cap per user. If a user has more than MAX_ACTIVE_MISSIONS_PER_USER
 * in_progress missions, expire the oldest ones beyond the cap.
 */
export async function enforceActiveMissionCap(userId: number): Promise<void> {
  if (!userId) return;
  const db = await getDb();
  if (!db) return;

  try {
    const activeMissions = await db.select({ id: missionProgress.id, createdAt: missionProgress.createdAt })
      .from(missionProgress)
      .where(and(
        eq(missionProgress.userId, userId),
        eq(missionProgress.status, "in_progress")
      ))
      .orderBy(missionProgress.createdAt);

    if (activeMissions.length <= MAX_ACTIVE_MISSIONS_PER_USER) return;

    // Expire oldest missions beyond the cap
    const toExpire = activeMissions.slice(0, activeMissions.length - MAX_ACTIVE_MISSIONS_PER_USER);
    for (const m of toExpire) {
      await db.update(missionProgress)
        .set({ status: "expired" })
        .where(eq(missionProgress.id, m.id));
    }

    console.log(`[GamificationDispatcher] Expired ${toExpire.length} excess missions for user ${userId}`);
  } catch (err) {
    console.error(`[GamificationDispatcher] Cap enforcement error for user ${userId}:`, err);
  }
}

/**
 * System-wide gamification sync. Run periodically (every 6 hours).
 * 1. Expire stale in_progress missions whose parent mission has ended.
 * 2. Prune orphaned progress (user no longer exists or is deactivated).
 * 3. Ensure total active missions in DB stays manageable.
 * 4. Create gamification profiles for any users missing one.
 */
export async function syncGamificationSystem(): Promise<{ expired: number; orphaned: number; profilesCreated: number }> {
  const db = await getDb();
  if (!db) return { expired: 0, orphaned: 0, profilesCreated: 0 };

  let expired = 0;
  let orphaned = 0;
  let profilesCreated = 0;

  try {
    // 1. Expire in_progress missions whose parent mission has ended or been deactivated
    const expireResult = await db.execute(sql`
      UPDATE mission_progress mp
      INNER JOIN missions m ON mp.missionId = m.id
      SET mp.status = 'expired'
      WHERE mp.status = 'in_progress'
        AND (m.isActive = FALSE OR (m.endsAt IS NOT NULL AND m.endsAt < NOW()))
    `);
    expired = (expireResult as any)?.[0]?.affectedRows || 0;

    // 2. Prune orphaned progress — users that are deactivated or soft-deleted
    const orphanResult = await db.execute(sql`
      UPDATE mission_progress mp
      INNER JOIN users u ON mp.userId = u.id
      SET mp.status = 'expired'
      WHERE mp.status IN ('in_progress', 'not_started')
        AND (u.isActive = FALSE OR u.deletedAt IS NOT NULL)
    `);
    orphaned = (orphanResult as any)?.[0]?.affectedRows || 0;

    // 3. Create gamification profiles for active users missing one
    const missingProfiles = await db.execute(sql`
      SELECT u.id FROM users u
      LEFT JOIN gamification_profiles gp ON u.id = gp.userId
      WHERE gp.id IS NULL AND u.isActive = TRUE AND u.deletedAt IS NULL
      LIMIT 100
    `);
    const rows = (Array.isArray(missingProfiles) && Array.isArray(missingProfiles[0]))
      ? missingProfiles[0] : [];
    for (const row of rows as any[]) {
      try {
        await db.insert(gamificationProfiles).values({
          userId: row.id,
          level: 1,
          currentXp: 0,
          totalXp: 0,
          xpToNextLevel: 1000,
          currentMiles: "0",
          totalMilesEarned: "0",
          streakDays: 0,
          longestStreak: 0,
          stats: { totalMissionsCompleted: 0, totalBadgesEarned: 0, totalCratesOpened: 0, perfectDeliveries: 0, onTimeRate: 0 },
        });
        profilesCreated++;
      } catch {}
    }

    // 4. Enforce mission caps for all users with too many active missions
    const overCap = await db.execute(sql`
      SELECT userId, COUNT(*) as cnt FROM mission_progress
      WHERE status = 'in_progress'
      GROUP BY userId
      HAVING cnt > ${MAX_ACTIVE_MISSIONS_PER_USER}
    `);
    const overCapRows = (Array.isArray(overCap) && Array.isArray(overCap[0])) ? overCap[0] : [];
    for (const row of overCapRows as any[]) {
      await enforceActiveMissionCap(row.userId);
    }

    console.log(`[GamificationSync] expired=${expired} orphaned=${orphaned} profilesCreated=${profilesCreated}`);
  } catch (err) {
    console.error("[GamificationSync] Error:", err);
  }

  return { expired, orphaned, profilesCreated };
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

let _syncTimer: ReturnType<typeof setInterval> | null = null;

export function startGamificationSync(): void {
  // Run initial sync after 30 seconds (let app boot first)
  setTimeout(() => syncGamificationSystem().catch(console.error), 30000);
  // Then every 6 hours
  _syncTimer = setInterval(() => syncGamificationSystem().catch(console.error), 6 * 60 * 60 * 1000);
  console.log("[GamificationSync] Scheduler started (runs every 6 hours)");
}

export function stopGamificationSync(): void {
  if (_syncTimer) { clearInterval(_syncTimer); _syncTimer = null; }
}
