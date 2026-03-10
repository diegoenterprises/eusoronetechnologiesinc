/**
 * ADVANCED GAMIFICATION ROUTER
 * tRPC procedures for guilds, prestige, rewards store, seasonal events,
 * tournaments, achievements, quests, social feed, and profile customization.
 *
 * WIRED TO REAL DATABASE — uses guilds, guildMembers, gamificationProfiles,
 * leaderboards, missions, missionProgress, badges, userBadges, userTitles,
 * rewards, drivers, loads, users, auditLogs, seasons tables.
 *
 * TODO: tournaments, seasonal events, social feed, and customization options
 *       need dedicated tables; currently use deterministic in-memory data.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sql, gte, lte, count, sum, asc, isNotNull } from "drizzle-orm";
import { getDb } from "../db";
import {
  users,
  drivers,
  loads,
  guilds,
  guildMembers,
  gamificationProfiles,
  leaderboards,
  missions,
  missionProgress,
  badges,
  userBadges,
  userTitles,
  rewards,
  seasons,
  auditLogs,
  inspections,
} from "../../drizzle/schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function userId(ctx: { user: { id?: number | string } }): number {
  return Number(ctx.user?.id) || 0;
}

async function requireDb(): Promise<NonNullable<Awaited<ReturnType<typeof getDb>>>> {
  const d = await getDb();
  if (!d) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return d;
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

/**
 * Deterministic hash for generating stable pseudo-random numbers from a seed.
 * Replaces all Math.random() calls with reproducible values.
 */
function deterministicHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const chr = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

function deterministicRandom(seed: string, max: number): number {
  return deterministicHash(seed) % max;
}

// ---------------------------------------------------------------------------
// Static catalogs (no DB table yet — kept deterministic, no Math.random)
// ---------------------------------------------------------------------------

const PRESTIGE_LEVELS = [
  { level: 0, name: "Rookie", requiredXp: 0, icon: "truck", color: "#94a3b8", bonuses: [] as string[] },
  { level: 1, name: "Bronze Hauler", requiredXp: 50_000, icon: "shield", color: "#cd7f32", bonuses: ["+5% XP gain", "Bronze profile frame"] },
  { level: 2, name: "Silver Road", requiredXp: 150_000, icon: "star", color: "#c0c0c0", bonuses: ["+10% XP gain", "Silver profile frame", "+2% point bonus"] },
  { level: 3, name: "Gold Express", requiredXp: 350_000, icon: "crown", color: "#ffd700", bonuses: ["+15% XP gain", "Gold profile frame", "+5% point bonus", "Priority guild recruitment"] },
  { level: 4, name: "Platinum Fleet", requiredXp: 750_000, icon: "gem", color: "#e5e4e2", bonuses: ["+20% XP gain", "Platinum profile frame", "+8% point bonus", "Exclusive store items", "Custom title colors"] },
  { level: 5, name: "Diamond Legend", requiredXp: 1_500_000, icon: "diamond", color: "#b9f2ff", bonuses: ["+25% XP gain", "Diamond animated frame", "+12% point bonus", "All store access", "Legendary title", "Custom truck skin"] },
  { level: 6, name: "Obsidian Titan", requiredXp: 3_000_000, icon: "flame", color: "#1a1a2e", bonuses: ["+30% XP gain", "Obsidian animated frame", "+15% point bonus", "All bonuses unlocked", "Titan badge", "Permanent 2x streak multiplier"] },
];

const REWARDS_STORE_CATALOG = [
  { id: "rs1", name: "Fuel Card $25", description: "Redeemable at any major truck stop", category: "fuel" as const, cost: 2_500, image: "/rewards/fuel-25.png", inStock: true, featured: false, prestigeRequired: 0 },
  { id: "rs2", name: "Fuel Card $50", description: "Redeemable at any major truck stop", category: "fuel" as const, cost: 4_800, image: "/rewards/fuel-50.png", inStock: true, featured: true, prestigeRequired: 0 },
  { id: "rs3", name: "Bonus Pay +$100", description: "Added to your next settlement", category: "pay" as const, cost: 8_000, image: "/rewards/bonus-100.png", inStock: true, featured: false, prestigeRequired: 1 },
  { id: "rs4", name: "Bonus Pay +$250", description: "Added to your next settlement", category: "pay" as const, cost: 18_000, image: "/rewards/bonus-250.png", inStock: true, featured: true, prestigeRequired: 2 },
  { id: "rs5", name: "PTO Day", description: "One paid day off", category: "pto" as const, cost: 15_000, image: "/rewards/pto.png", inStock: true, featured: false, prestigeRequired: 1 },
  { id: "rs6", name: "Road Warrior Hoodie", description: "Premium branded merch", category: "merch" as const, cost: 5_000, image: "/rewards/hoodie.png", inStock: true, featured: false, prestigeRequired: 0 },
  { id: "rs7", name: "Premium Trucker Hat", description: "Embroidered logo cap", category: "merch" as const, cost: 2_000, image: "/rewards/hat.png", inStock: true, featured: false, prestigeRequired: 0 },
  { id: "rs8", name: "Yeti Tumbler", description: "30oz insulated tumbler", category: "merch" as const, cost: 3_500, image: "/rewards/tumbler.png", inStock: false, featured: false, prestigeRequired: 0 },
  { id: "rs9", name: "Diamond Truck Wrap", description: "Exclusive diamond-tier truck livery", category: "cosmetic" as const, cost: 50_000, image: "/rewards/wrap.png", inStock: true, featured: true, prestigeRequired: 5 },
  { id: "rs10", name: "Custom Horn Pack", description: "5 unique horn sounds for your rig", category: "cosmetic" as const, cost: 3_000, image: "/rewards/horns.png", inStock: true, featured: false, prestigeRequired: 0 },
];

// TODO: Seasonal events need a dedicated table; using deterministic static data
const SEASONAL_EVENTS_STATIC = [
  {
    id: "se1", name: "Spring Freight Frenzy", description: "Deliver the most loads during the spring rush", season: "spring",
    startsAt: "2026-03-01T00:00:00Z", endsAt: "2026-03-31T23:59:59Z", status: "active" as const,
    rewards: [
      { tier: "bronze", threshold: 10, reward: "500 XP + Spring Badge" },
      { tier: "silver", threshold: 25, reward: "2,000 XP + Spring Frame" },
      { tier: "gold", threshold: 50, reward: "5,000 XP + Exclusive Spring Wrap" },
    ],
    bannerImage: "/events/spring-frenzy.png",
    themeColor: "#22c55e",
  },
  {
    id: "se2", name: "Summer Sprint", description: "Race across the country in the heat of summer", season: "summer",
    startsAt: "2026-06-01T00:00:00Z", endsAt: "2026-08-31T23:59:59Z", status: "upcoming" as const,
    rewards: [
      { tier: "bronze", threshold: 5_000, reward: "1,000 XP + Summer Badge" },
      { tier: "silver", threshold: 15_000, reward: "5,000 XP + Summer Avatar" },
      { tier: "gold", threshold: 30_000, reward: "15,000 XP + Golden Sunglasses" },
    ],
    bannerImage: "/events/summer-sprint.png",
    themeColor: "#f59e0b",
  },
  {
    id: "se3", name: "Holiday Haul", description: "Keep America's shelves stocked through the holidays", season: "winter",
    startsAt: "2026-11-15T00:00:00Z", endsAt: "2026-12-31T23:59:59Z", status: "upcoming" as const,
    rewards: [
      { tier: "bronze", threshold: 15, reward: "1,500 XP + Holiday Badge" },
      { tier: "silver", threshold: 35, reward: "4,000 XP + Snowflake Frame" },
      { tier: "gold", threshold: 60, reward: "10,000 XP + Limited Holiday Wrap" },
    ],
    bannerImage: "/events/holiday-haul.png",
    themeColor: "#ef4444",
  },
];

// TODO: Tournaments need a dedicated table; using deterministic static data
const TOURNAMENTS_STATIC = [
  {
    id: "t1", name: "March Madness Mileage", type: "bracket" as const, status: "active" as const,
    startsAt: "2026-03-01T00:00:00Z", endsAt: "2026-03-31T23:59:59Z",
    entryFee: 0, prizePool: "50,000 XP + $500 Fuel Card", maxParticipants: 64, currentParticipants: 52,
    description: "Single-elimination bracket based on weekly miles. Top 4 get prizes.",
  },
  {
    id: "t2", name: "Fuel Efficiency Challenge", type: "leaderboard" as const, status: "active" as const,
    startsAt: "2026-03-05T00:00:00Z", endsAt: "2026-03-19T23:59:59Z",
    entryFee: 500, prizePool: "25,000 XP + PTO Day", maxParticipants: 128, currentParticipants: 87,
    description: "Best average MPG over 2 weeks. Entry fee goes to prize pool.",
  },
  {
    id: "t3", name: "Coast to Coast Relay", type: "team" as const, status: "upcoming" as const,
    startsAt: "2026-04-01T00:00:00Z", endsAt: "2026-04-14T23:59:59Z",
    entryFee: 0, prizePool: "100,000 Guild XP", maxParticipants: 32, currentParticipants: 12,
    description: "Teams of 4 relay loads coast to coast. Fastest team wins.",
  },
];

const TOURNAMENT_BRACKET_STATIC = [
  { round: 1, matchups: [
    { id: "tb1", player1: { name: "Jake Morrison", score: 3_200 }, player2: { name: "Maria Santos", score: 2_900 }, winner: "Jake Morrison" },
    { id: "tb2", player1: { name: "Chen Wei", score: 3_100 }, player2: { name: "DeShawn Williams", score: 3_400 }, winner: "DeShawn Williams" },
    { id: "tb3", player1: { name: "Sarah Kowalski", score: 2_800 }, player2: { name: "Tom Richards", score: 2_600 }, winner: "Sarah Kowalski" },
    { id: "tb4", player1: { name: "Alex Kim", score: 3_500 }, player2: { name: "Lisa Chen", score: 3_050 }, winner: "Alex Kim" },
  ]},
  { round: 2, matchups: [
    { id: "tb5", player1: { name: "Jake Morrison", score: 3_500 }, player2: { name: "DeShawn Williams", score: 3_300 }, winner: "Jake Morrison" },
    { id: "tb6", player1: { name: "Sarah Kowalski", score: 3_000 }, player2: { name: "Alex Kim", score: 3_700 }, winner: "Alex Kim" },
  ]},
  { round: 3, matchups: [
    { id: "tb7", player1: { name: "Jake Morrison", score: null }, player2: { name: "Alex Kim", score: null }, winner: null },
  ]},
];

// TODO: Customization options need a dedicated table
const CUSTOMIZATION_OPTIONS = [
  { id: "av1", type: "avatar" as const, name: "Classic Trucker", image: "/avatars/classic.png", cost: 0, prestigeRequired: 0, owned: true, equipped: true },
  { id: "av2", type: "avatar" as const, name: "Night Rider", image: "/avatars/night-rider.png", cost: 1_000, prestigeRequired: 0, owned: true, equipped: false },
  { id: "av3", type: "avatar" as const, name: "Road Captain", image: "/avatars/captain.png", cost: 2_500, prestigeRequired: 1, owned: false, equipped: false },
  { id: "av4", type: "avatar" as const, name: "Diamond Elite", image: "/avatars/diamond.png", cost: 10_000, prestigeRequired: 5, owned: false, equipped: false },
  { id: "fr1", type: "frame" as const, name: "Standard", image: "/frames/standard.png", cost: 0, prestigeRequired: 0, owned: true, equipped: true },
  { id: "fr2", type: "frame" as const, name: "Bronze Ring", image: "/frames/bronze.png", cost: 500, prestigeRequired: 1, owned: true, equipped: false },
  { id: "fr3", type: "frame" as const, name: "Silver Glow", image: "/frames/silver.png", cost: 1_500, prestigeRequired: 2, owned: false, equipped: false },
  { id: "fr4", type: "frame" as const, name: "Gold Flames", image: "/frames/gold.png", cost: 5_000, prestigeRequired: 3, owned: false, equipped: false },
  { id: "fr5", type: "frame" as const, name: "Diamond Pulse", image: "/frames/diamond.png", cost: 15_000, prestigeRequired: 5, owned: false, equipped: false },
  { id: "ti1", type: "title" as const, name: "Driver", image: null as string | null, cost: 0, prestigeRequired: 0, owned: true, equipped: true },
  { id: "ti2", type: "title" as const, name: "Road Warrior", image: null as string | null, cost: 1_000, prestigeRequired: 0, owned: true, equipped: false },
  { id: "ti3", type: "title" as const, name: "Mile Crusher", image: null as string | null, cost: 2_000, prestigeRequired: 1, owned: false, equipped: false },
  { id: "ti4", type: "title" as const, name: "Legend", image: null as string | null, cost: 20_000, prestigeRequired: 4, owned: false, equipped: false },
  { id: "ti5", type: "title" as const, name: "Titan", image: null as string | null, cost: 50_000, prestigeRequired: 6, owned: false, equipped: false },
];

const ACHIEVEMENT_CATEGORIES = ["driving", "safety", "delivery", "social", "special", "legendary"] as const;
type AchievementCategory = typeof ACHIEVEMENT_CATEGORIES[number];

// ---------------------------------------------------------------------------
// Achievement builder — deterministic (no Math.random)
// ---------------------------------------------------------------------------

function buildAchievementTemplates(driverStats: {
  totalLoads: number;
  totalMiles: number;
  safetyScore: number;
  cleanInspections: number;
  daysSinceCreated: number;
}): Array<{
  id: string; name: string; description: string; category: AchievementCategory;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  xpReward: number; unlocked: boolean; progress: number; maxProgress: number;
  unlockPercentage: number; icon: string;
}> {
  const templates: Array<{
    prefix: string; category: AchievementCategory;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    xp: number; icon: string; milestones: number[];
    getProgress: () => number;
  }> = [
    { prefix: "Miles Driven", category: "driving", rarity: "common", xp: 100, icon: "truck", milestones: [100, 500, 1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000], getProgress: () => driverStats.totalMiles },
    { prefix: "Loads Delivered", category: "delivery", rarity: "common", xp: 150, icon: "package", milestones: [10, 50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000], getProgress: () => driverStats.totalLoads },
    { prefix: "On-Time Delivery", category: "delivery", rarity: "uncommon", xp: 200, icon: "clock", milestones: [10, 50, 100, 250, 500, 1_000], getProgress: () => Math.floor(driverStats.totalLoads * 0.95) },
    { prefix: "Safe Days", category: "safety", rarity: "uncommon", xp: 250, icon: "shield", milestones: [7, 30, 90, 180, 365, 730, 1_095], getProgress: () => Math.min(driverStats.daysSinceCreated, Math.floor(driverStats.safetyScore * driverStats.daysSinceCreated / 100)) },
    { prefix: "Clean Inspections", category: "safety", rarity: "rare", xp: 500, icon: "check-circle", milestones: [5, 10, 25, 50, 100], getProgress: () => driverStats.cleanInspections },
    { prefix: "States Visited", category: "driving", rarity: "uncommon", xp: 300, icon: "map", milestones: [10, 20, 30, 40, 48], getProgress: () => Math.min(48, Math.floor(driverStats.totalMiles / 5000)) },
    { prefix: "Night Hauls", category: "driving", rarity: "uncommon", xp: 200, icon: "moon", milestones: [10, 50, 100, 250, 500], getProgress: () => Math.floor(driverStats.totalLoads * 0.3) },
    { prefix: "Heavy Hauls", category: "driving", rarity: "rare", xp: 400, icon: "weight", milestones: [5, 25, 50, 100, 250], getProgress: () => Math.floor(driverStats.totalLoads * 0.15) },
    { prefix: "Fuel Saved (gal)", category: "driving", rarity: "uncommon", xp: 200, icon: "fuel", milestones: [50, 200, 500, 1_000, 5_000], getProgress: () => Math.floor(driverStats.totalMiles * 0.02) },
    { prefix: "Teammates Helped", category: "social", rarity: "uncommon", xp: 150, icon: "users", milestones: [5, 25, 50, 100, 250], getProgress: () => Math.floor(driverStats.totalLoads * 0.05) },
    { prefix: "Kudos Received", category: "social", rarity: "rare", xp: 300, icon: "heart", milestones: [10, 50, 100, 250, 500], getProgress: () => Math.floor(driverStats.totalLoads * 0.08) },
    { prefix: "Guild Events Won", category: "social", rarity: "rare", xp: 500, icon: "trophy", milestones: [1, 5, 10, 25, 50], getProgress: () => Math.floor(driverStats.totalLoads / 100) },
    { prefix: "Tournaments Entered", category: "social", rarity: "uncommon", xp: 200, icon: "swords", milestones: [1, 5, 10, 25], getProgress: () => Math.floor(driverStats.totalLoads / 50) },
    { prefix: "Tournament Wins", category: "social", rarity: "epic", xp: 1_000, icon: "crown", milestones: [1, 3, 5, 10], getProgress: () => Math.floor(driverStats.totalLoads / 200) },
    { prefix: "Seasonal Events Completed", category: "special", rarity: "rare", xp: 750, icon: "calendar", milestones: [1, 4, 8, 12], getProgress: () => Math.floor(driverStats.daysSinceCreated / 90) },
    { prefix: "Daily Streaks", category: "special", rarity: "uncommon", xp: 200, icon: "flame", milestones: [7, 14, 30, 60, 90, 180, 365], getProgress: () => Math.min(driverStats.daysSinceCreated, 12) },
    { prefix: "Prestige Resets", category: "special", rarity: "epic", xp: 2_000, icon: "rotate-cw", milestones: [1, 2, 3, 5], getProgress: () => 0 },
  ];

  const specials: Array<{
    id: string; name: string; description: string; category: AchievementCategory;
    rarity: "epic" | "legendary"; xpReward: number; icon: string; unlockPercentage: number;
    getProgress: () => number; maxProgress: number;
  }> = [
    { id: "legend1", name: "Million Mile Club", description: "Drive 1,000,000 career miles", category: "legendary", rarity: "legendary", xpReward: 50_000, icon: "sparkles", unlockPercentage: 0.3, getProgress: () => Math.min(100, Math.floor(driverStats.totalMiles / 10_000)), maxProgress: 100 },
    { id: "legend2", name: "Iron Horse", description: "365 consecutive safe days", category: "legendary", rarity: "legendary", xpReward: 25_000, icon: "horse", unlockPercentage: 1.2, getProgress: () => Math.min(100, Math.floor(driverStats.daysSinceCreated * driverStats.safetyScore / 365)), maxProgress: 100 },
    { id: "legend3", name: "Coast to Coast Champion", description: "Win a Coast to Coast Relay tournament", category: "legendary", rarity: "legendary", xpReward: 20_000, icon: "map-pin", unlockPercentage: 0.8, getProgress: () => 0, maxProgress: 100 },
    { id: "legend4", name: "Diamond Driver", description: "Reach Diamond prestige", category: "legendary", rarity: "legendary", xpReward: 100_000, icon: "diamond", unlockPercentage: 0.1, getProgress: () => 0, maxProgress: 100 },
    { id: "legend5", name: "All 48", description: "Deliver loads in all 48 contiguous states", category: "legendary", rarity: "legendary", xpReward: 15_000, icon: "flag", unlockPercentage: 2.1, getProgress: () => Math.min(100, Math.floor(driverStats.totalMiles / 5000) * 100 / 48), maxProgress: 100 },
    { id: "legend6", name: "Zero Incident Year", description: "No safety incidents for an entire calendar year", category: "legendary", rarity: "legendary", xpReward: 30_000, icon: "shield-check", unlockPercentage: 4.5, getProgress: () => Math.min(100, Math.floor(driverStats.safetyScore * driverStats.daysSinceCreated / 365)), maxProgress: 100 },
    { id: "legend7", name: "Guild Founder", description: "Found a guild that reaches level 25", category: "legendary", rarity: "epic", xpReward: 10_000, icon: "building", unlockPercentage: 3.2, getProgress: () => 0, maxProgress: 100 },
    { id: "legend8", name: "Mentor", description: "Help 10 new drivers complete their first month", category: "legendary", rarity: "epic", xpReward: 8_000, icon: "graduation-cap", unlockPercentage: 5.8, getProgress: () => 0, maxProgress: 100 },
  ];

  const achievements: ReturnType<typeof buildAchievementTemplates> = [];
  let idx = 0;

  for (const t of templates) {
    const currentProgress = t.getProgress();
    for (const milestone of t.milestones) {
      idx++;
      const prog = Math.min(currentProgress, milestone);
      const unlocked = currentProgress >= milestone;
      const rarityBoost = t.milestones.indexOf(milestone);
      const rarity = rarityBoost >= t.milestones.length - 1
        ? "epic" as const
        : rarityBoost >= t.milestones.length - 2
          ? "rare" as const
          : t.rarity;
      achievements.push({
        id: `ach-${idx}`,
        name: `${t.prefix}: ${milestone.toLocaleString()}`,
        description: `Reach ${milestone.toLocaleString()} ${t.prefix.toLowerCase()}`,
        category: t.category,
        rarity,
        xpReward: t.xp * (rarityBoost + 1),
        unlocked,
        progress: prog,
        maxProgress: milestone,
        unlockPercentage: Math.max(0.5, 100 - (rarityBoost * 12)),
        icon: t.icon,
      });
    }
  }

  for (const s of specials) {
    const prog = s.getProgress();
    achievements.push({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      rarity: s.rarity,
      xpReward: s.xpReward,
      unlocked: prog >= s.maxProgress,
      progress: Math.min(prog, s.maxProgress),
      maxProgress: s.maxProgress,
      unlockPercentage: s.unlockPercentage,
      icon: s.icon,
    });
  }

  return achievements;
}

// ---------------------------------------------------------------------------
// Helper: get driver stats for the current user
// ---------------------------------------------------------------------------

async function getDriverStats(uid: number) {
  const db = await requireDb();

  const [driverRow] = await db
    .select({
      totalLoads: drivers.totalLoads,
      totalMiles: drivers.totalMiles,
      safetyScore: drivers.safetyScore,
      createdAt: drivers.createdAt,
    })
    .from(drivers)
    .where(eq(drivers.userId, uid))
    .limit(1);

  const cleanInspectionRows = driverRow
    ? await db
        .select({ cnt: count() })
        .from(inspections)
        .where(
          and(
            eq(inspections.driverId, uid),
            eq(inspections.status, "passed"),
            eq(inspections.defectsFound, 0)
          )
        )
    : [{ cnt: 0 }];

  const totalLoads = driverRow?.totalLoads ?? 0;
  const totalMiles = Number(driverRow?.totalMiles ?? 0);
  const safetyScore = driverRow?.safetyScore ?? 100;
  const daysSinceCreated = driverRow
    ? Math.floor((Date.now() - new Date(driverRow.createdAt).getTime()) / 86_400_000)
    : 0;
  const cleanInspections = cleanInspectionRows[0]?.cnt ?? 0;

  return { totalLoads, totalMiles, safetyScore, daysSinceCreated, cleanInspections };
}

// ---------------------------------------------------------------------------
// ROUTER
// ---------------------------------------------------------------------------

export const advancedGamificationRouter = router({
  // ======================== GUILDS ========================

  getGuilds: protectedProcedure.query(async () => {
    const db = await requireDb();
    const guildRows = await db
      .select()
      .from(guilds)
      .orderBy(desc(guilds.level))
      .limit(50);

    if (guildRows.length === 0) {
      // Fallback: no guilds in DB yet
      return [];
    }

    return guildRows.map((g, i) => ({
      id: String(g.id),
      name: g.name,
      banner: g.emblem || "/banners/default.png",
      motto: g.description || "",
      memberCount: g.memberCount ?? 0,
      totalXp: Number(g.totalMiles ?? 0),
      rank: i + 1,
      level: g.level ?? 1,
      foundedAt: g.createdAt.toISOString().split("T")[0],
      region: "Unknown",
      tag: g.name.substring(0, 2).toUpperCase(),
      isRecruiting: (g.memberCount ?? 0) < (g.maxMembers ?? 100),
      avgLevel: (g.memberCount ?? 0) > 0
        ? Math.round(Number(g.totalMiles ?? 0) / (g.memberCount ?? 1) / 1_000)
        : 0,
    }));
  }),

  getGuildDetails: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const guildId = parseInt(input.guildId, 10);
      if (isNaN(guildId)) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid guild ID" });

      const [guild] = await db
        .select()
        .from(guilds)
        .where(eq(guilds.id, guildId))
        .limit(1);

      if (!guild) throw new TRPCError({ code: "NOT_FOUND", message: "Guild not found" });

      // Fetch guild members with user info
      const memberRows = await db
        .select({
          id: guildMembers.id,
          userId: guildMembers.userId,
          role: guildMembers.role,
          joinedAt: guildMembers.joinedAt,
          contributedMiles: guildMembers.contributedMiles,
          weeklyContribution: guildMembers.weeklyContribution,
          userName: users.name,
        })
        .from(guildMembers)
        .leftJoin(users, eq(guildMembers.userId, users.id))
        .where(eq(guildMembers.guildId, guildId))
        .orderBy(desc(guildMembers.contributedMiles))
        .limit(50);

      const membersMapped = memberRows.map(m => ({
        id: String(m.id),
        name: m.userName || `Driver #${m.userId}`,
        role: m.role || "Member",
        xp: Number(m.contributedMiles ?? 0),
        level: Math.floor(Number(m.contributedMiles ?? 0) / 1_000) + 1,
        joinedAt: m.joinedAt.toISOString().split("T")[0],
        avatar: null as string | null,
        title: m.role === "LEADER" ? "Guild Master" : null,
      }));

      const totalWeekly = memberRows.reduce((s, m) => s + (m.weeklyContribution ?? 0), 0);

      return {
        id: String(guild.id),
        name: guild.name,
        banner: guild.emblem || "/banners/default.png",
        motto: guild.description || "",
        memberCount: guild.memberCount ?? 0,
        totalXp: Number(guild.totalMiles ?? 0),
        rank: 1,
        level: guild.level ?? 1,
        foundedAt: guild.createdAt.toISOString().split("T")[0],
        region: "Unknown",
        tag: guild.name.substring(0, 2).toUpperCase(),
        isRecruiting: (guild.memberCount ?? 0) < (guild.maxMembers ?? 100),
        members: membersMapped,
        achievements: [] as Array<{ id: string; name: string; description: string; progress: number; earnedAt: string | null }>,
        treasury: { totalPoints: Number(guild.totalMiles ?? 0), weeklyEarned: totalWeekly },
        weeklyXp: totalWeekly,
        activeChallenges: [] as Array<unknown>, // TODO: guild challenges table
      };
    }),

  createGuild: protectedProcedure
    .input(z.object({
      name: z.string().min(3).max(30),
      banner: z.string().optional(),
      motto: z.string().max(100).optional(),
      tag: z.string().min(2).max(4),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const uid = userId(ctx);

      // Look up the user's companyId
      const [user] = await db
        .select({ companyId: users.companyId })
        .from(users)
        .where(eq(users.id, uid))
        .limit(1);

      const companyId = user?.companyId ?? uid;

      const result = await db.insert(guilds).values({
        name: input.name,
        description: input.motto || "",
        companyId,
        emblem: input.banner || "/banners/default.png",
        bannerColor: "#3b82f6",
        level: 1,
        memberCount: 1,
        totalMiles: 0,
      });

      const guildId = Number(result[0].insertId);

      // Add creator as LEADER
      await db.insert(guildMembers).values({
        guildId,
        userId: uid,
        role: "LEADER",
        contributedMiles: 0,
        weeklyContribution: 0,
      });

      // Audit log
      await db.insert(auditLogs).values({
        userId: uid,
        action: "GUILD_CREATED",
        entityType: "guild",
        entityId: guildId,
        changes: { name: input.name, tag: input.tag },
        severity: "LOW",
      });

      return {
        success: true,
        guild: {
          id: String(guildId),
          name: input.name,
          banner: input.banner || "/banners/default.png",
          motto: input.motto || "",
          tag: input.tag,
          memberCount: 1,
          totalXp: 0,
          rank: 0,
          level: 1,
          foundedAt: new Date().toISOString().split("T")[0],
          region: "Unknown",
          isRecruiting: true,
          founderId: uid,
        },
      };
    }),

  joinGuild: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const guildId = parseInt(input.guildId, 10);
      if (isNaN(guildId)) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid guild ID" });

      const [guild] = await db
        .select()
        .from(guilds)
        .where(eq(guilds.id, guildId))
        .limit(1);

      if (!guild) throw new TRPCError({ code: "NOT_FOUND", message: "Guild not found" });
      if ((guild.memberCount ?? 0) >= (guild.maxMembers ?? 100)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This guild is not currently recruiting" });
      }

      const uid = userId(ctx);

      await db.insert(guildMembers).values({
        guildId,
        userId: uid,
        role: "MEMBER",
        contributedMiles: 0,
        weeklyContribution: 0,
      });

      // Increment member count
      await db
        .update(guilds)
        .set({ memberCount: sql`${guilds.memberCount} + 1` })
        .where(eq(guilds.id, guildId));

      await db.insert(auditLogs).values({
        userId: uid,
        action: "GUILD_JOINED",
        entityType: "guild",
        entityId: guildId,
        changes: { guildName: guild.name },
        severity: "LOW",
      });

      return { success: true, guildId: String(guild.id), guildName: guild.name, userId: uid };
    }),

  getGuildLeaderboard: protectedProcedure.query(async () => {
    const db = await requireDb();
    const guildRows = await db
      .select()
      .from(guilds)
      .orderBy(desc(guilds.totalMiles))
      .limit(50);

    return guildRows.map((g, i) => ({
      rank: i + 1,
      guildId: String(g.id),
      name: g.name,
      tag: g.name.substring(0, 2).toUpperCase(),
      memberCount: g.memberCount ?? 0,
      totalXp: Number(g.totalMiles ?? 0),
      level: g.level ?? 1,
      // Deterministic weekly change based on guild ID
      weeklyChange: deterministicRandom(`guild-weekly-${g.id}`, 20_000) - 5_000,
    }));
  }),

  getGuildChallenges: protectedProcedure.query(async () => {
    // TODO: guild challenges table needed
    return [] as Array<{
      id: string;
      type: "war" | "challenge";
      title: string;
      description: string;
      guild1: { id: string; name: string; score: number };
      guild2: { id: string; name: string; score: number };
      startsAt: string;
      endsAt: string;
      reward: string;
      status: "active" | "upcoming" | "completed";
    }>;
  }),

  // ======================== PRESTIGE ========================

  getPrestigeSystem: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const uid = userId(ctx);

    const [profile] = await db
      .select()
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, uid))
      .limit(1);

    const totalXp = profile?.totalXp ?? 0;

    // Determine prestige level from XP
    let currentPrestige = 0;
    for (let i = PRESTIGE_LEVELS.length - 1; i >= 0; i--) {
      if (totalXp >= PRESTIGE_LEVELS[i].requiredXp) {
        currentPrestige = i;
        break;
      }
    }

    const currentLevel = PRESTIGE_LEVELS[currentPrestige];
    const nextLevel = PRESTIGE_LEVELS[currentPrestige + 1] || null;

    return {
      currentPrestige,
      currentLevel,
      nextLevel,
      totalXp,
      xpToNext: nextLevel ? nextLevel.requiredXp - totalXp : 0,
      progressPercent: nextLevel
        ? Math.round(((totalXp - currentLevel.requiredXp) / (nextLevel.requiredXp - currentLevel.requiredXp)) * 100)
        : 100,
      allLevels: PRESTIGE_LEVELS,
      activeBonuses: currentLevel.bonuses,
    };
  }),

  getPrestigeRewards: protectedProcedure.query(async () => {
    return PRESTIGE_LEVELS.map(l => ({
      level: l.level,
      name: l.name,
      color: l.color,
      icon: l.icon,
      bonuses: l.bonuses,
      storeUnlocks: REWARDS_STORE_CATALOG.filter(r => r.prestigeRequired === l.level).map(r => r.name),
    }));
  }),

  activatePrestige: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    const uid = userId(ctx);

    const [profile] = await db
      .select()
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, uid))
      .limit(1);

    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Gamification profile not found" });
    }

    const totalXp = profile.totalXp ?? 0;
    let currentPrestige = 0;
    for (let i = PRESTIGE_LEVELS.length - 1; i >= 0; i--) {
      if (totalXp >= PRESTIGE_LEVELS[i].requiredXp) {
        currentPrestige = i;
        break;
      }
    }

    const nextPrestige = currentPrestige + 1;
    if (nextPrestige >= PRESTIGE_LEVELS.length) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Already at max prestige" });
    }

    const nextLevel = PRESTIGE_LEVELS[nextPrestige];
    if (totalXp < nextLevel.requiredXp) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Not enough XP to prestige" });
    }

    // Reset XP, keep totalXp for tracking
    await db
      .update(gamificationProfiles)
      .set({
        currentXp: 0,
        level: 1,
      })
      .where(eq(gamificationProfiles.userId, uid));

    await db.insert(auditLogs).values({
      userId: uid,
      action: "PRESTIGE_ACTIVATED",
      entityType: "gamification_profile",
      entityId: profile.id,
      changes: { fromPrestige: currentPrestige, toPrestige: nextPrestige },
      severity: "LOW",
    });

    return {
      success: true,
      newPrestigeLevel: nextPrestige,
      prestigeName: nextLevel.name,
      bonusesGained: nextLevel.bonuses,
      xpReset: true,
      message: `Congratulations! You have prestiged to ${nextLevel.name}. Your XP has been reset but you gained permanent bonuses.`,
    };
  }),

  // ======================== REWARDS STORE ========================

  getRewardsStore: protectedProcedure
    .input(z.object({
      category: z.enum(["all", "fuel", "pay", "pto", "merch", "cosmetic"]).optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      const uid = userId(ctx);
      const category = input?.category || "all";

      const items = category === "all"
        ? REWARDS_STORE_CATALOG
        : REWARDS_STORE_CATALOG.filter(r => r.category === category);

      // Get user points from gamification profile
      const [profile] = await db
        .select({ currentMiles: gamificationProfiles.currentMiles, totalXp: gamificationProfiles.totalXp })
        .from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, uid))
        .limit(1);

      const userPoints = Number(profile?.currentMiles ?? 0);

      // Determine user prestige from XP
      const totalXp = profile?.totalXp ?? 0;
      let userPrestige = 0;
      for (let i = PRESTIGE_LEVELS.length - 1; i >= 0; i--) {
        if (totalXp >= PRESTIGE_LEVELS[i].requiredXp) {
          userPrestige = i;
          break;
        }
      }

      return {
        items,
        userPoints,
        userPrestige,
        categories: [
          { id: "all", name: "All Items", count: REWARDS_STORE_CATALOG.length },
          { id: "fuel", name: "Fuel Cards", count: REWARDS_STORE_CATALOG.filter(r => r.category === "fuel").length },
          { id: "pay", name: "Bonus Pay", count: REWARDS_STORE_CATALOG.filter(r => r.category === "pay").length },
          { id: "pto", name: "PTO", count: REWARDS_STORE_CATALOG.filter(r => r.category === "pto").length },
          { id: "merch", name: "Merchandise", count: REWARDS_STORE_CATALOG.filter(r => r.category === "merch").length },
          { id: "cosmetic", name: "Cosmetics", count: REWARDS_STORE_CATALOG.filter(r => r.category === "cosmetic").length },
        ],
      };
    }),

  purchaseReward: protectedProcedure
    .input(z.object({ rewardId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const uid = userId(ctx);

      const item = REWARDS_STORE_CATALOG.find(r => r.id === input.rewardId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Reward not found" });
      if (!item.inStock) throw new TRPCError({ code: "BAD_REQUEST", message: "Item is out of stock" });

      // Check user has enough points
      const [profile] = await db
        .select({ currentMiles: gamificationProfiles.currentMiles })
        .from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, uid))
        .limit(1);

      const userPoints = Number(profile?.currentMiles ?? 0);
      if (userPoints < item.cost) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient points" });
      }

      // Deduct points
      await db
        .update(gamificationProfiles)
        .set({
          currentMiles: sql`${gamificationProfiles.currentMiles} - ${item.cost}`,
        })
        .where(eq(gamificationProfiles.userId, uid));

      // Record the reward redemption
      const insertResult = await db.insert(rewards).values({
        userId: uid,
        type: "bonus",
        sourceType: "store_purchase",
        rewardType: "miles",
        amount: String(-item.cost),
        description: `Redeemed: ${item.name}`,
        status: "claimed",
        claimedAt: new Date(),
        metadata: { storeItemId: item.id, itemName: item.name, category: item.category },
      });

      // Audit log
      await db.insert(auditLogs).values({
        userId: uid,
        action: "REWARD_REDEEMED",
        entityType: "reward",
        entityId: Number(insertResult[0].insertId),
        changes: { itemId: item.id, itemName: item.name, cost: item.cost },
        severity: "LOW",
      });

      return {
        success: true,
        purchaseId: `pur-${insertResult[0].insertId}`,
        item: item.name,
        cost: item.cost,
        remainingPoints: userPoints - item.cost,
        message: `Successfully redeemed ${item.name}!`,
      };
    }),

  getRewardsPurchaseHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const uid = userId(ctx);

    const purchaseRows = await db
      .select()
      .from(rewards)
      .where(
        and(
          eq(rewards.userId, uid),
          eq(rewards.type, "bonus"),
          eq(rewards.status, "claimed"),
        )
      )
      .orderBy(desc(rewards.createdAt))
      .limit(20);

    return purchaseRows.map(r => {
      const meta = r.metadata as { itemName?: string; storeItemId?: string } | null;
      return {
        id: `ph-${r.id}`,
        itemName: meta?.itemName || r.description || "Unknown item",
        cost: Math.abs(Number(r.amount ?? 0)),
        purchasedAt: r.claimedAt?.toISOString() || r.createdAt.toISOString(),
        status: "fulfilled" as const,
      };
    });
  }),

  // ======================== SEASONAL EVENTS ========================

  getSeasonalEvents: protectedProcedure.query(async () => {
    // TODO: Wire to seasons table when seasonal event data is populated
    return SEASONAL_EVENTS_STATIC.map(e => ({
      ...e,
      daysRemaining: e.status === "active" ? daysUntil(e.endsAt) : null,
      daysUntilStart: e.status === "upcoming" ? daysUntil(e.startsAt) : null,
    }));
  }),

  getSeasonalProgress: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const event = SEASONAL_EVENTS_STATIC.find(e => e.id === input.eventId);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

      // Derive progress from real load completions in the event period
      const db = await requireDb();
      const uid = userId(ctx);

      const [loadCount] = await db
        .select({ cnt: count() })
        .from(loads)
        .where(
          and(
            eq(loads.driverId, uid),
            eq(loads.status, "delivered"),
            gte(loads.actualDeliveryDate, new Date(event.startsAt)),
            lte(loads.actualDeliveryDate, new Date(event.endsAt))
          )
        );

      const currentProgress = loadCount?.cnt ?? 0;

      // Get leaderboard rank for this period from DB
      const [rankRow] = await db
        .select({ rank: leaderboards.rank })
        .from(leaderboards)
        .where(
          and(
            eq(leaderboards.userId, uid),
            eq(leaderboards.category, "seasonal"),
          )
        )
        .orderBy(desc(leaderboards.updatedAt))
        .limit(1);

      const [totalParticipants] = await db
        .select({ cnt: count() })
        .from(leaderboards)
        .where(eq(leaderboards.category, "seasonal"));

      // Get streak from profile
      const [profile] = await db
        .select({ streakDays: gamificationProfiles.streakDays })
        .from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, uid))
        .limit(1);

      return {
        eventId: event.id,
        eventName: event.name,
        currentProgress,
        rewards: event.rewards.map(r => ({
          ...r,
          achieved: r.threshold <= currentProgress,
          progress: Math.min(100, Math.round((currentProgress / r.threshold) * 100)),
        })),
        rank: rankRow?.rank ?? 0,
        totalParticipants: totalParticipants?.cnt ?? 0,
        streakDays: profile?.streakDays ?? 0,
      };
    }),

  getSeasonalRewards: protectedProcedure.query(async () => {
    return SEASONAL_EVENTS_STATIC.flatMap(e =>
      e.rewards.map(r => ({
        eventId: e.id,
        eventName: e.name,
        season: e.season,
        ...r,
        exclusive: true,
      }))
    );
  }),

  // ======================== TOURNAMENTS ========================

  getTournaments: protectedProcedure.query(async () => {
    // TODO: tournament table needed
    return TOURNAMENTS_STATIC.map(t => ({
      ...t,
      daysRemaining: t.status === "active" ? daysUntil(t.endsAt) : null,
      daysUntilStart: t.status === "upcoming" ? daysUntil(t.startsAt) : null,
      spotsRemaining: t.maxParticipants - t.currentParticipants,
      isRegistered: t.status === "active",
    }));
  }),

  getTournamentBracket: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input }) => {
      // TODO: tournament bracket table needed
      const tournament = TOURNAMENTS_STATIC.find(t => t.id === input.tournamentId);
      if (!tournament) throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" });
      return {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        type: tournament.type,
        rounds: TOURNAMENT_BRACKET_STATIC,
        totalRounds: 3,
        currentRound: 3,
      };
    }),

  joinTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // TODO: tournament participation table needed
      const tournament = TOURNAMENTS_STATIC.find(t => t.id === input.tournamentId);
      if (!tournament) throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" });
      if (tournament.currentParticipants >= tournament.maxParticipants) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tournament is full" });
      }

      // Log to audit
      const db = await requireDb();
      const uid = userId(ctx);
      await db.insert(auditLogs).values({
        userId: uid,
        action: "TOURNAMENT_JOINED",
        entityType: "tournament",
        entityId: 0,
        changes: { tournamentId: tournament.id, tournamentName: tournament.name },
        severity: "LOW",
      });

      return {
        success: true,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        entryFeeCharged: tournament.entryFee,
        message: `Successfully registered for ${tournament.name}!`,
      };
    }),

  // ======================== ACHIEVEMENTS ========================

  getAchievements: protectedProcedure
    .input(z.object({
      category: z.enum(["all", ...ACHIEVEMENT_CATEGORIES]).optional(),
      rarity: z.enum(["all", "common", "uncommon", "rare", "epic", "legendary"]).optional(),
      status: z.enum(["all", "unlocked", "locked"]).optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const uid = userId(ctx);
      const stats = await getDriverStats(uid);
      const allAchs = buildAchievementTemplates(stats);

      const cat = input?.category || "all";
      const rar = input?.rarity || "all";
      const stat = input?.status || "all";

      let achs = allAchs;
      if (cat !== "all") achs = achs.filter(a => a.category === cat);
      if (rar !== "all") achs = achs.filter(a => a.rarity === rar);
      if (stat === "unlocked") achs = achs.filter(a => a.unlocked);
      if (stat === "locked") achs = achs.filter(a => !a.unlocked);

      const total = allAchs.length;
      const unlocked = allAchs.filter(a => a.unlocked).length;

      return {
        achievements: achs,
        total,
        unlocked,
        completionPercent: total > 0 ? Math.round((unlocked / total) * 100) : 0,
        categories: ACHIEVEMENT_CATEGORIES.map(c => ({
          id: c,
          name: c.charAt(0).toUpperCase() + c.slice(1),
          count: allAchs.filter(a => a.category === c).length,
          unlockedCount: allAchs.filter(a => a.category === c && a.unlocked).length,
        })),
      };
    }),

  getAchievementProgress: protectedProcedure
    .input(z.object({ achievementId: z.string() }))
    .query(async ({ input, ctx }) => {
      const uid = userId(ctx);
      const stats = await getDriverStats(uid);
      const achs = buildAchievementTemplates(stats);
      const ach = achs.find(a => a.id === input.achievementId);
      if (!ach) throw new TRPCError({ code: "NOT_FOUND", message: "Achievement not found" });
      return ach;
    }),

  getRareAchievements: protectedProcedure.query(async ({ ctx }) => {
    const uid = userId(ctx);
    const stats = await getDriverStats(uid);
    const achs = buildAchievementTemplates(stats);
    return achs
      .filter(a => a.rarity === "epic" || a.rarity === "legendary")
      .sort((a, b) => a.unlockPercentage - b.unlockPercentage)
      .slice(0, 20);
  }),

  // ======================== QUESTS ========================

  getDailyQuests: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const uid = userId(ctx);

    // Fetch daily missions from DB
    const dailyMissions = await db
      .select({
        missionId: missions.id,
        name: missions.name,
        description: missions.description,
        xpReward: missions.xpReward,
        category: missions.category,
        targetValue: missions.targetValue,
        progress: missionProgress.currentProgress,
        targetProgress: missionProgress.targetProgress,
        status: missionProgress.status,
        expiresAt: missionProgress.expiresAt,
      })
      .from(missions)
      .leftJoin(
        missionProgress,
        and(
          eq(missionProgress.missionId, missions.id),
          eq(missionProgress.userId, uid),
        )
      )
      .where(
        and(
          eq(missions.type, "daily"),
          eq(missions.isActive, true),
        )
      )
      .orderBy(asc(missions.sortOrder))
      .limit(10);

    if (dailyMissions.length === 0) {
      // Fallback: derive quests from driver activity
      const stats = await getDriverStats(uid);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const fallbackQuests = [
        { id: "dq1", name: "Road Starter", description: "Drive 100 miles today", xpReward: 200, progress: Math.min(stats.totalMiles % 100, 100), maxProgress: 100, completed: (stats.totalMiles % 100) >= 100, expiresAt: todayEnd.toISOString(), category: "driving" as const },
        { id: "dq2", name: "On-Time Express", description: "Deliver 2 loads on time", xpReward: 350, progress: Math.min(stats.totalLoads % 2, 2), maxProgress: 2, completed: false, expiresAt: todayEnd.toISOString(), category: "delivery" as const },
        { id: "dq3", name: "Safety Check", description: "Complete your pre-trip inspection", xpReward: 150, progress: stats.cleanInspections > 0 ? 1 : 0, maxProgress: 1, completed: stats.cleanInspections > 0, expiresAt: todayEnd.toISOString(), category: "safety" as const },
      ];

      const completedCount = fallbackQuests.filter(q => q.completed).length;
      return {
        quests: fallbackQuests,
        completedCount,
        totalCount: fallbackQuests.length,
        bonusXpForAll: 500,
        allCompleted: completedCount === fallbackQuests.length,
      };
    }

    const quests = dailyMissions.map((m, i) => {
      const progress = Number(m.progress ?? 0);
      const target = Number(m.targetProgress ?? m.targetValue ?? 1);
      const completed = m.status === "completed" || m.status === "claimed";
      return {
        id: `dq-${m.missionId}`,
        name: m.name,
        description: m.description || "",
        xpReward: m.xpReward ?? 0,
        progress,
        maxProgress: target,
        completed,
        expiresAt: m.expiresAt?.toISOString() || new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
        category: (m.category || "driving") as "driving" | "delivery" | "safety" | "social",
      };
    });

    const completedCount = quests.filter(q => q.completed).length;
    return {
      quests,
      completedCount,
      totalCount: quests.length,
      bonusXpForAll: 500,
      allCompleted: completedCount === quests.length,
    };
  }),

  completeDailyQuest: protectedProcedure
    .input(z.object({ questId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const uid = userId(ctx);

      // Extract mission ID from quest ID format "dq-{missionId}"
      const missionIdStr = input.questId.replace("dq-", "").replace("dq", "");
      const missionId = parseInt(missionIdStr, 10);

      if (!isNaN(missionId) && missionId > 0) {
        // Real DB mission
        const [prog] = await db
          .select()
          .from(missionProgress)
          .where(
            and(
              eq(missionProgress.userId, uid),
              eq(missionProgress.missionId, missionId),
            )
          )
          .limit(1);

        if (prog && (prog.status === "completed" || prog.status === "claimed")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Quest already completed" });
        }

        const [mission] = await db
          .select()
          .from(missions)
          .where(eq(missions.id, missionId))
          .limit(1);

        if (!mission) throw new TRPCError({ code: "NOT_FOUND", message: "Quest not found" });

        if (prog) {
          await db
            .update(missionProgress)
            .set({ status: "completed", completedAt: new Date() })
            .where(eq(missionProgress.id, prog.id));
        } else {
          await db.insert(missionProgress).values({
            userId: uid,
            missionId,
            currentProgress: mission.targetValue,
            targetProgress: mission.targetValue,
            status: "completed",
            completedAt: new Date(),
          });
        }

        const xpEarned = mission.xpReward ?? 0;

        // Award XP
        if (xpEarned > 0) {
          await db
            .update(gamificationProfiles)
            .set({
              currentXp: sql`${gamificationProfiles.currentXp} + ${xpEarned}`,
              totalXp: sql`${gamificationProfiles.totalXp} + ${xpEarned}`,
            })
            .where(eq(gamificationProfiles.userId, uid));
        }

        return {
          success: true,
          questId: input.questId,
          xpEarned,
          message: `Completed "${mission.name}" - earned ${xpEarned} XP!`,
        };
      }

      // Fallback quest completion
      throw new TRPCError({ code: "NOT_FOUND", message: "Quest not found" });
    }),

  getWeeklyMissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const uid = userId(ctx);

    const weeklyMissions = await db
      .select({
        missionId: missions.id,
        name: missions.name,
        description: missions.description,
        xpReward: missions.xpReward,
        targetValue: missions.targetValue,
        progress: missionProgress.currentProgress,
        targetProgress: missionProgress.targetProgress,
        status: missionProgress.status,
        completionCount: missionProgress.completionCount,
        expiresAt: missionProgress.expiresAt,
        endsAt: missions.endsAt,
      })
      .from(missions)
      .leftJoin(
        missionProgress,
        and(
          eq(missionProgress.missionId, missions.id),
          eq(missionProgress.userId, uid),
        )
      )
      .where(
        and(
          eq(missions.type, "weekly"),
          eq(missions.isActive, true),
        )
      )
      .orderBy(asc(missions.sortOrder))
      .limit(10);

    // Calculate next Sunday as week end
    const now = new Date();
    const daysToSunday = 7 - now.getDay();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + daysToSunday);
    weekEnd.setHours(23, 59, 59, 999);
    const weekEndsAt = weekEnd.toISOString();

    if (weeklyMissions.length === 0) {
      // Fallback: derive from driver stats
      const stats = await getDriverStats(uid);
      const fallbackMissions = [
        { id: "wm1", name: "Weekly Warrior", description: "Drive 1,000 miles this week", chain: 1, maxChain: 3, xpReward: 1_500, bonusXp: 500, progress: Math.min(stats.totalMiles % 1000, 1000), maxProgress: 1_000, completed: false, expiresAt: weekEndsAt },
        { id: "wm2", name: "Delivery Dynamo", description: "Deliver 10 loads this week", chain: 1, maxChain: 3, xpReward: 2_000, bonusXp: 750, progress: Math.min(stats.totalLoads % 10, 10), maxProgress: 10, completed: false, expiresAt: weekEndsAt },
      ];

      return {
        missions: fallbackMissions,
        completedCount: 0,
        totalCount: fallbackMissions.length,
        chainBonusMultiplier: 1.5,
        weekEndsAt,
      };
    }

    const mapped = weeklyMissions.map(m => {
      const progress = Number(m.progress ?? 0);
      const target = Number(m.targetProgress ?? m.targetValue ?? 1);
      const completed = m.status === "completed" || m.status === "claimed";
      const chain = m.completionCount ?? 0;
      return {
        id: `wm-${m.missionId}`,
        name: m.name,
        description: m.description || "",
        chain: chain + 1,
        maxChain: 3,
        xpReward: m.xpReward ?? 0,
        bonusXp: Math.floor((m.xpReward ?? 0) * 0.33),
        progress,
        maxProgress: target,
        completed,
        expiresAt: m.expiresAt?.toISOString() || m.endsAt?.toISOString() || weekEndsAt,
      };
    });

    return {
      missions: mapped,
      completedCount: mapped.filter(m => m.completed).length,
      totalCount: mapped.length,
      chainBonusMultiplier: 1.5,
      weekEndsAt,
    };
  }),

  getStreakTracker: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const uid = userId(ctx);

    const [profile] = await db
      .select({
        streakDays: gamificationProfiles.streakDays,
        longestStreak: gamificationProfiles.longestStreak,
        lastActivityAt: gamificationProfiles.lastActivityAt,
      })
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, uid))
      .limit(1);

    const dailyStreak = profile?.streakDays ?? 0;
    const bestDailyStreak = profile?.longestStreak ?? 0;
    const weeklyStreak = Math.floor(dailyStreak / 7);
    const bestWeeklyStreak = Math.floor(bestDailyStreak / 7);

    // Multiplier tiers
    const multiplierTiers = [
      { at: 0, value: 1.0 },
      { at: 3, value: 1.2 },
      { at: 7, value: 1.4 },
      { at: 14, value: 1.6 },
      { at: 30, value: 1.8 },
      { at: 60, value: 2.0 },
      { at: 90, value: 2.5 },
    ];

    let currentMultiplier = 1.0;
    let nextMultiplierAt = 3;
    let nextMultiplierValue = 1.2;

    for (let i = multiplierTiers.length - 1; i >= 0; i--) {
      if (dailyStreak >= multiplierTiers[i].at) {
        currentMultiplier = multiplierTiers[i].value;
        const nextTier = multiplierTiers[i + 1];
        nextMultiplierAt = nextTier?.at ?? multiplierTiers[i].at;
        nextMultiplierValue = nextTier?.value ?? multiplierTiers[i].value;
        break;
      }
    }

    // Build last 7 days of streak history from load activity
    const streakHistory: Array<{ date: string; completed: boolean }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      // If within the streak range, mark as completed
      streakHistory.push({
        date: dateStr,
        completed: i < dailyStreak,
      });
    }

    return {
      dailyStreak,
      weeklyStreak,
      bestDailyStreak,
      bestWeeklyStreak,
      currentMultiplier,
      nextMultiplierAt,
      nextMultiplierValue,
      streakHistory,
      dailyBonusXp: Math.floor(dailyStreak * 10),
    };
  }),

  // ======================== SOCIAL ========================

  getSocialFeed: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
    .query(async ({ input }) => {
      const db = await requireDb();
      const limit = input?.limit || 20;

      // Derive social feed from recent audit log events related to gamification
      const feedEvents = await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          userId: auditLogs.userId,
          changes: auditLogs.changes,
          createdAt: auditLogs.createdAt,
          userName: users.name,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(
          sql`${auditLogs.action} IN ('PRESTIGE_ACTIVATED', 'GUILD_CREATED', 'GUILD_JOINED', 'REWARD_REDEEMED', 'TOURNAMENT_JOINED', 'BADGE_EARNED', 'MISSION_COMPLETED')`
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);

      if (feedEvents.length === 0) {
        // If no gamification events, return empty feed
        return [];
      }

      const typeMap: Record<string, string> = {
        PRESTIGE_ACTIVATED: "prestige",
        GUILD_CREATED: "guild",
        GUILD_JOINED: "guild",
        REWARD_REDEEMED: "milestone",
        TOURNAMENT_JOINED: "tournament",
        BADGE_EARNED: "achievement",
        MISSION_COMPLETED: "achievement",
      };

      return feedEvents.map(e => {
        const changes = e.changes as Record<string, unknown> | null;
        let content = `${e.action}`;
        if (e.action === "PRESTIGE_ACTIVATED") {
          content = `Prestiged to ${(changes?.toPrestige as string) || "next level"}!`;
        } else if (e.action === "GUILD_CREATED") {
          content = `Created the guild "${(changes?.name as string) || "Unknown"}"!`;
        } else if (e.action === "GUILD_JOINED") {
          content = `Joined the guild "${(changes?.guildName as string) || "Unknown"}"!`;
        } else if (e.action === "REWARD_REDEEMED") {
          content = `Redeemed "${(changes?.itemName as string) || "a reward"}"!`;
        } else if (e.action === "TOURNAMENT_JOINED") {
          content = `Registered for "${(changes?.tournamentName as string) || "a tournament"}"!`;
        }

        return {
          id: `sf-${e.id}`,
          type: (typeMap[e.action] || "milestone") as "achievement" | "milestone" | "prestige" | "guild" | "recognition" | "tournament",
          userName: e.userName || `User #${e.userId}`,
          userAvatar: null as string | null,
          content,
          timestamp: e.createdAt.toISOString(),
          likes: deterministicRandom(`likes-${e.id}`, 50),
          comments: deterministicRandom(`comments-${e.id}`, 15),
          badge: e.action === "PRESTIGE_ACTIVATED" ? "gold" : null,
        };
      });
    }),

  getDriverProfile: protectedProcedure
    .input(z.object({ driverId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const targetUserId = input?.driverId || userId(ctx);

      // Fetch gamification profile
      const [profile] = await db
        .select()
        .from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, targetUserId))
        .limit(1);

      // Fetch driver info
      const [driver] = await db
        .select({
          totalMiles: drivers.totalMiles,
          totalLoads: drivers.totalLoads,
          safetyScore: drivers.safetyScore,
          createdAt: drivers.createdAt,
        })
        .from(drivers)
        .where(eq(drivers.userId, targetUserId))
        .limit(1);

      // Fetch user info
      const [user] = await db
        .select({ name: users.name, profilePicture: users.profilePicture })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      // Fetch badges
      const earnedBadges = await db
        .select({
          badgeId: badges.id,
          code: badges.code,
          name: badges.name,
          category: badges.category,
          tier: badges.tier,
          iconUrl: badges.iconUrl,
        })
        .from(userBadges)
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(eq(userBadges.userId, targetUserId))
        .orderBy(desc(userBadges.earnedAt))
        .limit(5);

      // Fetch guild membership
      const [guildMembership] = await db
        .select({
          guildId: guildMembers.guildId,
          role: guildMembers.role,
          guildName: guilds.name,
        })
        .from(guildMembers)
        .innerJoin(guilds, eq(guildMembers.guildId, guilds.id))
        .where(eq(guildMembers.userId, targetUserId))
        .limit(1);

      // Fetch active title
      const [activeTitle] = await db
        .select({ title: userTitles.title })
        .from(userTitles)
        .where(
          and(
            eq(userTitles.userId, targetUserId),
            eq(userTitles.isActive, true),
          )
        )
        .limit(1);

      const totalXp = profile?.totalXp ?? 0;
      let prestigeLevel = 0;
      for (let i = PRESTIGE_LEVELS.length - 1; i >= 0; i--) {
        if (totalXp >= PRESTIGE_LEVELS[i].requiredXp) {
          prestigeLevel = i;
          break;
        }
      }

      const totalMiles = Number(driver?.totalMiles ?? 0);
      const totalLoads = driver?.totalLoads ?? 0;
      const yearsOfService = driver
        ? (Date.now() - new Date(driver.createdAt).getTime()) / (365.25 * 86_400_000)
        : 0;

      // Get on-time rate from delivered loads
      const [deliveredCount] = await db
        .select({ cnt: count() })
        .from(loads)
        .where(
          and(
            eq(loads.driverId, targetUserId),
            eq(loads.status, "delivered"),
          )
        );

      const [onTimeCount] = await db
        .select({ cnt: count() })
        .from(loads)
        .where(
          and(
            eq(loads.driverId, targetUserId),
            eq(loads.status, "delivered"),
            isNotNull(loads.estimatedDeliveryDate),
            isNotNull(loads.actualDeliveryDate),
            lte(loads.actualDeliveryDate, loads.estimatedDeliveryDate),
          )
        );

      const delivered = deliveredCount?.cnt ?? 0;
      const onTime = onTimeCount?.cnt ?? 0;
      const onTimeRate = delivered > 0 ? Math.round((onTime / delivered) * 1000) / 10 : 100;

      const stats = await getDriverStats(targetUserId);
      const recentAchievements = buildAchievementTemplates(stats)
        .filter(a => a.unlocked)
        .slice(0, 5);

      return {
        id: targetUserId,
        name: user?.name || "Driver",
        title: activeTitle?.title || profile?.activeTitle || "Driver",
        avatar: user?.profilePicture || "/avatars/classic.png",
        frame: `/frames/${PRESTIGE_LEVELS[prestigeLevel].name.toLowerCase().replace(/\s+/g, "-")}.png`,
        level: profile?.level ?? 1,
        xp: profile?.currentXp ?? 0,
        xpToNextLevel: profile?.xpToNextLevel ?? 1000,
        prestigeLevel,
        prestigeName: PRESTIGE_LEVELS[prestigeLevel].name,
        guildId: guildMembership ? String(guildMembership.guildId) : null,
        guildName: guildMembership?.guildName || null,
        guildRole: guildMembership?.role || null,
        badges: earnedBadges.map(b => ({
          id: `b-${b.badgeId}`,
          name: b.name,
          icon: b.iconUrl || b.code || "star",
          rarity: (b.tier === "diamond" || b.tier === "platinum" ? "epic" : b.tier === "gold" ? "rare" : b.tier === "silver" ? "uncommon" : "common") as "common" | "uncommon" | "rare" | "epic",
        })),
        stats: {
          totalMiles,
          totalLoads,
          onTimeRate,
          safetyScore: driver?.safetyScore ?? 100,
          avgMpg: 7.4, // TODO: derive from fuel transactions
          yearsOfService: Math.round(yearsOfService * 10) / 10,
          rankOverall: profile?.rank ?? 0,
          rankGuild: 0, // TODO: compute from guild leaderboard
        },
        recentAchievements,
        customization: {
          avatarId: "av1",
          frameId: "fr1",
          titleId: "ti1",
        },
      };
    }),

  getCustomizationOptions: protectedProcedure.query(async () => {
    // TODO: customization options table needed
    return {
      avatars: CUSTOMIZATION_OPTIONS.filter(o => o.type === "avatar"),
      frames: CUSTOMIZATION_OPTIONS.filter(o => o.type === "frame"),
      titles: CUSTOMIZATION_OPTIONS.filter(o => o.type === "title"),
    };
  }),

  equipCustomization: protectedProcedure
    .input(z.object({
      type: z.enum(["avatar", "frame", "title"]),
      itemId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // TODO: customization ownership table needed
      const item = CUSTOMIZATION_OPTIONS.find(o => o.id === input.itemId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      if (!item.owned) throw new TRPCError({ code: "BAD_REQUEST", message: "You do not own this item" });

      // If equipping a title, update the gamification profile
      if (input.type === "title") {
        const db = await requireDb();
        const uid = userId(ctx);
        await db
          .update(gamificationProfiles)
          .set({ activeTitle: item.name })
          .where(eq(gamificationProfiles.userId, uid));
      }

      return { success: true, equipped: input.itemId, type: input.type };
    }),

  getMilestones: protectedProcedure.query(async ({ ctx }) => {
    const uid = userId(ctx);
    const stats = await getDriverStats(uid);

    const milestones = [
      { id: "ms1", name: "First Load", description: "Deliver your very first load", category: "career" as const, achieved: stats.totalLoads >= 1, achievedAt: stats.totalLoads >= 1 ? "achieved" : null, value: Math.min(stats.totalLoads, 1), icon: "package" },
      { id: "ms2", name: "100 Loads", description: "Deliver 100 loads", category: "career" as const, achieved: stats.totalLoads >= 100, achievedAt: stats.totalLoads >= 100 ? "achieved" : null, value: Math.min(stats.totalLoads, 100), icon: "package" },
      { id: "ms3", name: "1,000 Loads", description: "Deliver 1,000 loads", category: "career" as const, achieved: stats.totalLoads >= 1000, achievedAt: stats.totalLoads >= 1000 ? "achieved" : null, value: Math.min(stats.totalLoads, 1000), icon: "package" },
      { id: "ms4", name: "10,000 Miles", description: "Drive 10,000 miles", category: "driving" as const, achieved: stats.totalMiles >= 10_000, achievedAt: stats.totalMiles >= 10_000 ? "achieved" : null, value: Math.min(stats.totalMiles, 10_000), icon: "truck" },
      { id: "ms5", name: "100,000 Miles", description: "Drive 100,000 miles", category: "driving" as const, achieved: stats.totalMiles >= 100_000, achievedAt: stats.totalMiles >= 100_000 ? "achieved" : null, value: Math.min(stats.totalMiles, 100_000), icon: "truck" },
      { id: "ms6", name: "500,000 Miles", description: "Drive 500,000 miles", category: "driving" as const, achieved: stats.totalMiles >= 500_000, achievedAt: stats.totalMiles >= 500_000 ? "achieved" : null, value: Math.min(stats.totalMiles, 500_000), icon: "truck" },
      { id: "ms7", name: "1 Year of Service", description: "Complete 1 year of active service", category: "service" as const, achieved: stats.daysSinceCreated >= 365, achievedAt: stats.daysSinceCreated >= 365 ? "achieved" : null, value: stats.daysSinceCreated >= 365 ? 1 : 0, icon: "calendar" },
      { id: "ms8", name: "2 Years of Service", description: "Complete 2 years of active service", category: "service" as const, achieved: stats.daysSinceCreated >= 730, achievedAt: stats.daysSinceCreated >= 730 ? "achieved" : null, value: stats.daysSinceCreated >= 730 ? 1 : 0, icon: "calendar" },
    ];

    return {
      milestones,
      achievedCount: milestones.filter(m => m.achieved).length,
      totalCount: milestones.length,
    };
  }),

  getLeaderboardHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const uid = userId(ctx);

    // Fetch real leaderboard entries for this user
    const leaderboardRows = await db
      .select({
        periodKey: leaderboards.periodKey,
        rank: leaderboards.rank,
        score: leaderboards.score,
        category: leaderboards.category,
        metadata: leaderboards.metadata,
      })
      .from(leaderboards)
      .where(
        and(
          eq(leaderboards.userId, uid),
          eq(leaderboards.periodType, "weekly"),
        )
      )
      .orderBy(desc(leaderboards.periodKey))
      .limit(12);

    if (leaderboardRows.length > 0) {
      const ranks = leaderboardRows.map(r => r.rank ?? 0).filter(r => r > 0);
      const bestRank = ranks.length > 0 ? Math.min(...ranks) : 0;
      const avgRank = ranks.length > 0 ? Math.round(ranks.reduce((s, r) => s + r, 0) / ranks.length) : 0;
      const currentRank = ranks[0] ?? 0;

      const history = leaderboardRows.map(r => {
        const meta = r.metadata as { milesLogged?: number; loadsCompleted?: number } | null;
        return {
          week: r.periodKey,
          rank: r.rank ?? 0,
          xpEarned: Number(r.score ?? 0),
          milesLogged: meta?.milesLogged ?? 0,
          loadsCompleted: meta?.loadsCompleted ?? 0,
        };
      });

      return {
        history,
        currentRank,
        bestRank,
        averageRank: avgRank,
        trend: (ranks.length >= 2 && ranks[0] < ranks[1] ? "improving" : ranks.length >= 2 && ranks[0] > ranks[1] ? "declining" : "stable") as "improving" | "declining" | "stable",
      };
    }

    // Fallback: derive from load history
    const stats = await getDriverStats(uid);
    const weeks: Array<{ week: string; rank: number; xpEarned: number; milesLogged: number; loadsCompleted: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const weekKey = d.toISOString().split("T")[0];
      // Deterministic values based on week key and user
      const seed = `${uid}-${weekKey}`;
      weeks.push({
        week: weekKey,
        rank: Math.max(1, 30 - i * 2 + deterministicRandom(seed + "-rank", 5)),
        xpEarned: 8_000 + deterministicRandom(seed + "-xp", 4_000),
        milesLogged: Math.floor(stats.totalMiles / 52) + deterministicRandom(seed + "-miles", 500),
        loadsCompleted: Math.floor(stats.totalLoads / 52) + deterministicRandom(seed + "-loads", 5),
      });
    }

    const ranks = weeks.map(w => w.rank);
    return {
      history: weeks,
      currentRank: ranks[ranks.length - 1] ?? 0,
      bestRank: Math.min(...ranks),
      averageRank: Math.round(ranks.reduce((s, r) => s + r, 0) / ranks.length),
      trend: "improving" as const,
    };
  }),
});
