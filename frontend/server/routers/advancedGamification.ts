/**
 * ADVANCED GAMIFICATION ROUTER
 * tRPC procedures for guilds, prestige, rewards store, seasonal events,
 * tournaments, achievements, quests, social feed, and profile customization.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function userId(ctx: { user: { id?: number | string } }): number {
  return Number(ctx.user?.id) || 0;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

// ---------------------------------------------------------------------------
// Seed data  (will be replaced by DB tables in a future migration)
// ---------------------------------------------------------------------------

const GUILD_SEED = [
  { id: "g1", name: "Road Warriors", banner: "/banners/road-warriors.png", motto: "Miles before sleep", memberCount: 128, totalXp: 4_850_000, rank: 1, level: 42, foundedAt: "2024-06-15", region: "Midwest", tag: "RW", isRecruiting: true },
  { id: "g2", name: "Night Owls", banner: "/banners/night-owls.png", motto: "Keeping the wheels turning after dark", memberCount: 96, totalXp: 3_720_000, rank: 2, level: 38, foundedAt: "2024-07-01", region: "Southeast", tag: "NO", isRecruiting: true },
  { id: "g3", name: "Lone Stars", banner: "/banners/lone-stars.png", motto: "Everything is bigger in Texas", memberCount: 74, totalXp: 2_910_000, rank: 3, level: 35, foundedAt: "2024-08-10", region: "Southwest", tag: "LS", isRecruiting: false },
  { id: "g4", name: "Iron Fleet", banner: "/banners/iron-fleet.png", motto: "Forged in steel, driven by honor", memberCount: 112, totalXp: 4_200_000, rank: 4, level: 40, foundedAt: "2024-05-20", region: "Northeast", tag: "IF", isRecruiting: true },
  { id: "g5", name: "Cascade Haulers", banner: "/banners/cascade.png", motto: "From summit to sea", memberCount: 61, totalXp: 1_980_000, rank: 5, level: 29, foundedAt: "2024-09-01", region: "Pacific NW", tag: "CH", isRecruiting: true },
];

const GUILD_MEMBERS_SEED = [
  { id: "m1", name: "Jake Morrison", role: "Guild Master", xp: 185_000, level: 52, joinedAt: "2024-06-15", avatar: null, title: "Road King" },
  { id: "m2", name: "Maria Santos", role: "Officer", xp: 142_000, level: 47, joinedAt: "2024-06-20", avatar: null, title: "Mile Crusher" },
  { id: "m3", name: "Chen Wei", role: "Officer", xp: 128_000, level: 44, joinedAt: "2024-07-02", avatar: null, title: "Night Rider" },
  { id: "m4", name: "DeShawn Williams", role: "Member", xp: 98_000, level: 39, joinedAt: "2024-07-15", avatar: null, title: "Iron Wheels" },
  { id: "m5", name: "Sarah Kowalski", role: "Member", xp: 87_000, level: 37, joinedAt: "2024-08-01", avatar: null, title: "Fuel Saver" },
];

const GUILD_ACHIEVEMENTS_SEED = [
  { id: "ga1", name: "First Guild Haul", description: "Complete 100 loads as a guild", progress: 100, earnedAt: "2024-09-15" },
  { id: "ga2", name: "Million Mile Guild", description: "Guild members drive 1,000,000 combined miles", progress: 78, earnedAt: null },
  { id: "ga3", name: "Safety First", description: "0 safety incidents for 90 days", progress: 100, earnedAt: "2025-01-10" },
];

const GUILD_CHALLENGES_SEED = [
  { id: "gc1", type: "war" as const, title: "Road Warriors vs Night Owls", description: "Most miles driven in 7 days", guild1: { id: "g1", name: "Road Warriors", score: 42_500 }, guild2: { id: "g2", name: "Night Owls", score: 38_200 }, startsAt: "2026-03-08T00:00:00Z", endsAt: "2026-03-15T00:00:00Z", reward: "5,000 bonus XP per member", status: "active" as const },
  { id: "gc2", type: "challenge" as const, title: "Fuel Efficiency Sprint", description: "Best average MPG across all guild members", guild1: { id: "g1", name: "Road Warriors", score: 7.2 }, guild2: { id: "g3", name: "Lone Stars", score: 7.5 }, startsAt: "2026-03-10T00:00:00Z", endsAt: "2026-03-17T00:00:00Z", reward: "Exclusive Guild Banner", status: "active" as const },
];

const PRESTIGE_LEVELS = [
  { level: 0, name: "Rookie", requiredXp: 0, icon: "truck", color: "#94a3b8", bonuses: [] },
  { level: 1, name: "Bronze Hauler", requiredXp: 50_000, icon: "shield", color: "#cd7f32", bonuses: ["+5% XP gain", "Bronze profile frame"] },
  { level: 2, name: "Silver Road", requiredXp: 150_000, icon: "star", color: "#c0c0c0", bonuses: ["+10% XP gain", "Silver profile frame", "+2% point bonus"] },
  { level: 3, name: "Gold Express", requiredXp: 350_000, icon: "crown", color: "#ffd700", bonuses: ["+15% XP gain", "Gold profile frame", "+5% point bonus", "Priority guild recruitment"] },
  { level: 4, name: "Platinum Fleet", requiredXp: 750_000, icon: "gem", color: "#e5e4e2", bonuses: ["+20% XP gain", "Platinum profile frame", "+8% point bonus", "Exclusive store items", "Custom title colors"] },
  { level: 5, name: "Diamond Legend", requiredXp: 1_500_000, icon: "diamond", color: "#b9f2ff", bonuses: ["+25% XP gain", "Diamond animated frame", "+12% point bonus", "All store access", "Legendary title", "Custom truck skin"] },
  { level: 6, name: "Obsidian Titan", requiredXp: 3_000_000, icon: "flame", color: "#1a1a2e", bonuses: ["+30% XP gain", "Obsidian animated frame", "+15% point bonus", "All bonuses unlocked", "Titan badge", "Permanent 2x streak multiplier"] },
];

const REWARDS_STORE_SEED = [
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

const SEASONAL_EVENTS_SEED = [
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

const TOURNAMENTS_SEED = [
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

const TOURNAMENT_BRACKET_SEED = [
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

const ACHIEVEMENT_CATEGORIES = ["driving", "safety", "delivery", "social", "special", "legendary"] as const;
type AchievementCategory = typeof ACHIEVEMENT_CATEGORIES[number];

function generateAchievements(): Array<{
  id: string; name: string; description: string; category: AchievementCategory;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  xpReward: number; unlocked: boolean; progress: number; maxProgress: number;
  unlockPercentage: number; icon: string;
}> {
  const templates: Array<{ prefix: string; category: AchievementCategory; rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"; xp: number; icon: string; milestones: number[] }> = [
    { prefix: "Miles Driven", category: "driving", rarity: "common", xp: 100, icon: "truck", milestones: [100, 500, 1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000] },
    { prefix: "Loads Delivered", category: "delivery", rarity: "common", xp: 150, icon: "package", milestones: [10, 50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000] },
    { prefix: "On-Time Delivery", category: "delivery", rarity: "uncommon", xp: 200, icon: "clock", milestones: [10, 50, 100, 250, 500, 1_000] },
    { prefix: "Safe Days", category: "safety", rarity: "uncommon", xp: 250, icon: "shield", milestones: [7, 30, 90, 180, 365, 730, 1_095] },
    { prefix: "Clean Inspections", category: "safety", rarity: "rare", xp: 500, icon: "check-circle", milestones: [5, 10, 25, 50, 100] },
    { prefix: "States Visited", category: "driving", rarity: "uncommon", xp: 300, icon: "map", milestones: [10, 20, 30, 40, 48] },
    { prefix: "Night Hauls", category: "driving", rarity: "uncommon", xp: 200, icon: "moon", milestones: [10, 50, 100, 250, 500] },
    { prefix: "Heavy Hauls", category: "driving", rarity: "rare", xp: 400, icon: "weight", milestones: [5, 25, 50, 100, 250] },
    { prefix: "Fuel Saved (gal)", category: "driving", rarity: "uncommon", xp: 200, icon: "fuel", milestones: [50, 200, 500, 1_000, 5_000] },
    { prefix: "Teammates Helped", category: "social", rarity: "uncommon", xp: 150, icon: "users", milestones: [5, 25, 50, 100, 250] },
    { prefix: "Kudos Received", category: "social", rarity: "rare", xp: 300, icon: "heart", milestones: [10, 50, 100, 250, 500] },
    { prefix: "Guild Events Won", category: "social", rarity: "rare", xp: 500, icon: "trophy", milestones: [1, 5, 10, 25, 50] },
    { prefix: "Tournaments Entered", category: "social", rarity: "uncommon", xp: 200, icon: "swords", milestones: [1, 5, 10, 25] },
    { prefix: "Tournament Wins", category: "social", rarity: "epic", xp: 1_000, icon: "crown", milestones: [1, 3, 5, 10] },
    { prefix: "Seasonal Events Completed", category: "special", rarity: "rare", xp: 750, icon: "calendar", milestones: [1, 4, 8, 12] },
    { prefix: "Daily Streaks", category: "special", rarity: "uncommon", xp: 200, icon: "flame", milestones: [7, 14, 30, 60, 90, 180, 365] },
    { prefix: "Prestige Resets", category: "special", rarity: "epic", xp: 2_000, icon: "rotate-cw", milestones: [1, 2, 3, 5] },
  ];

  const specials: Array<{ id: string; name: string; description: string; category: AchievementCategory; rarity: "epic" | "legendary"; xpReward: number; icon: string; unlockPercentage: number }> = [
    { id: "legend1", name: "Million Mile Club", description: "Drive 1,000,000 career miles", category: "legendary", rarity: "legendary", xpReward: 50_000, icon: "sparkles", unlockPercentage: 0.3 },
    { id: "legend2", name: "Iron Horse", description: "365 consecutive safe days", category: "legendary", rarity: "legendary", xpReward: 25_000, icon: "horse", unlockPercentage: 1.2 },
    { id: "legend3", name: "Coast to Coast Champion", description: "Win a Coast to Coast Relay tournament", category: "legendary", rarity: "legendary", xpReward: 20_000, icon: "map-pin", unlockPercentage: 0.8 },
    { id: "legend4", name: "Diamond Driver", description: "Reach Diamond prestige", category: "legendary", rarity: "legendary", xpReward: 100_000, icon: "diamond", unlockPercentage: 0.1 },
    { id: "legend5", name: "All 48", description: "Deliver loads in all 48 contiguous states", category: "legendary", rarity: "legendary", xpReward: 15_000, icon: "flag", unlockPercentage: 2.1 },
    { id: "legend6", name: "Zero Incident Year", description: "No safety incidents for an entire calendar year", category: "legendary", rarity: "legendary", xpReward: 30_000, icon: "shield-check", unlockPercentage: 4.5 },
    { id: "legend7", name: "Guild Founder", description: "Found a guild that reaches level 25", category: "legendary", rarity: "epic", xpReward: 10_000, icon: "building", unlockPercentage: 3.2 },
    { id: "legend8", name: "Mentor", description: "Help 10 new drivers complete their first month", category: "legendary", rarity: "epic", xpReward: 8_000, icon: "graduation-cap", unlockPercentage: 5.8 },
  ];

  const achievements: ReturnType<typeof generateAchievements> = [];
  let idx = 0;

  for (const t of templates) {
    for (const milestone of t.milestones) {
      idx++;
      const prog = Math.floor(Math.random() * (milestone + 1));
      const unlocked = prog >= milestone;
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
        progress: Math.min(prog, milestone),
        maxProgress: milestone,
        unlockPercentage: Math.max(0.5, 100 - (rarityBoost * 12) + Math.random() * 10),
        icon: t.icon,
      });
    }
  }

  for (const s of specials) {
    achievements.push({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      rarity: s.rarity,
      xpReward: s.xpReward,
      unlocked: false,
      progress: Math.floor(Math.random() * 60),
      maxProgress: 100,
      unlockPercentage: s.unlockPercentage,
      icon: s.icon,
    });
  }

  return achievements;
}

// Cache the generated achievements so repeated calls are consistent within
// the same server process.
let _achievementCache: ReturnType<typeof generateAchievements> | null = null;
function getAchievements() {
  if (!_achievementCache) _achievementCache = generateAchievements();
  return _achievementCache;
}

const DAILY_QUESTS_SEED = [
  { id: "dq1", name: "Road Starter", description: "Drive 100 miles today", xpReward: 200, progress: 67, maxProgress: 100, completed: false, expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(), category: "driving" as const },
  { id: "dq2", name: "On-Time Express", description: "Deliver 2 loads on time", xpReward: 350, progress: 1, maxProgress: 2, completed: false, expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(), category: "delivery" as const },
  { id: "dq3", name: "Safety Check", description: "Complete your pre-trip inspection", xpReward: 150, progress: 1, maxProgress: 1, completed: true, expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(), category: "safety" as const },
  { id: "dq4", name: "Fuel Miser", description: "Average 7+ MPG for the day", xpReward: 250, progress: 0, maxProgress: 1, completed: false, expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(), category: "driving" as const },
  { id: "dq5", name: "Team Player", description: "Send a kudos to a fellow driver", xpReward: 100, progress: 0, maxProgress: 1, completed: false, expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(), category: "social" as const },
];

const WEEKLY_MISSIONS_SEED = [
  { id: "wm1", name: "Weekly Warrior", description: "Drive 1,000 miles this week", chain: 1, maxChain: 3, xpReward: 1_500, bonusXp: 500, progress: 620, maxProgress: 1_000, completed: false, expiresAt: "2026-03-15T23:59:59Z" },
  { id: "wm2", name: "Delivery Dynamo", description: "Deliver 10 loads this week", chain: 2, maxChain: 3, xpReward: 2_000, bonusXp: 750, progress: 7, maxProgress: 10, completed: false, expiresAt: "2026-03-15T23:59:59Z" },
  { id: "wm3", name: "Perfect Record", description: "No late deliveries for 7 days", chain: 1, maxChain: 5, xpReward: 1_000, bonusXp: 300, progress: 4, maxProgress: 7, completed: false, expiresAt: "2026-03-15T23:59:59Z" },
];

const SOCIAL_FEED_SEED = [
  { id: "sf1", type: "achievement" as const, userName: "Jake Morrison", userAvatar: null, content: "Unlocked \"Million Mile Club\" achievement!", timestamp: "2026-03-09T14:30:00Z", likes: 42, comments: 8, badge: "legendary" },
  { id: "sf2", type: "milestone" as const, userName: "Maria Santos", userAvatar: null, content: "Reached 500,000 career miles!", timestamp: "2026-03-09T12:15:00Z", likes: 31, comments: 5, badge: null },
  { id: "sf3", type: "prestige" as const, userName: "Chen Wei", userAvatar: null, content: "Prestiged to Gold Express (Level 3)!", timestamp: "2026-03-09T10:00:00Z", likes: 56, comments: 12, badge: "gold" },
  { id: "sf4", type: "guild" as const, userName: "Road Warriors", userAvatar: null, content: "Won the weekly Guild War against Night Owls!", timestamp: "2026-03-08T22:00:00Z", likes: 89, comments: 23, badge: null },
  { id: "sf5", type: "recognition" as const, userName: "DeShawn Williams", userAvatar: null, content: "Received 5 kudos from teammates this week!", timestamp: "2026-03-08T18:30:00Z", likes: 15, comments: 3, badge: null },
  { id: "sf6", type: "tournament" as const, userName: "Alex Kim", userAvatar: null, content: "Advanced to Round 2 in March Madness Mileage!", timestamp: "2026-03-08T16:00:00Z", likes: 22, comments: 4, badge: null },
  { id: "sf7", type: "achievement" as const, userName: "Sarah Kowalski", userAvatar: null, content: "Earned the \"All 48\" badge - delivered in every contiguous state!", timestamp: "2026-03-07T20:00:00Z", likes: 112, comments: 28, badge: "legendary" },
];

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
  { id: "ti1", type: "title" as const, name: "Driver", image: null, cost: 0, prestigeRequired: 0, owned: true, equipped: true },
  { id: "ti2", type: "title" as const, name: "Road Warrior", image: null, cost: 1_000, prestigeRequired: 0, owned: true, equipped: false },
  { id: "ti3", type: "title" as const, name: "Mile Crusher", image: null, cost: 2_000, prestigeRequired: 1, owned: false, equipped: false },
  { id: "ti4", type: "title" as const, name: "Legend", image: null, cost: 20_000, prestigeRequired: 4, owned: false, equipped: false },
  { id: "ti5", type: "title" as const, name: "Titan", image: null, cost: 50_000, prestigeRequired: 6, owned: false, equipped: false },
];

const MILESTONES_SEED = [
  { id: "ms1", name: "First Load", description: "Deliver your very first load", category: "career" as const, achieved: true, achievedAt: "2024-06-20", value: 1, icon: "package" },
  { id: "ms2", name: "100 Loads", description: "Deliver 100 loads", category: "career" as const, achieved: true, achievedAt: "2024-12-15", value: 100, icon: "package" },
  { id: "ms3", name: "1,000 Loads", description: "Deliver 1,000 loads", category: "career" as const, achieved: false, achievedAt: null, value: 478, icon: "package" },
  { id: "ms4", name: "10,000 Miles", description: "Drive 10,000 miles", category: "driving" as const, achieved: true, achievedAt: "2024-09-01", value: 10_000, icon: "truck" },
  { id: "ms5", name: "100,000 Miles", description: "Drive 100,000 miles", category: "driving" as const, achieved: true, achievedAt: "2025-06-15", value: 100_000, icon: "truck" },
  { id: "ms6", name: "500,000 Miles", description: "Drive 500,000 miles", category: "driving" as const, achieved: false, achievedAt: null, value: 342_500, icon: "truck" },
  { id: "ms7", name: "1 Year of Service", description: "Complete 1 year of active service", category: "service" as const, achieved: true, achievedAt: "2025-06-15", value: 1, icon: "calendar" },
  { id: "ms8", name: "2 Years of Service", description: "Complete 2 years of active service", category: "service" as const, achieved: false, achievedAt: null, value: 1, icon: "calendar" },
];

// ---------------------------------------------------------------------------
// ROUTER
// ---------------------------------------------------------------------------

export const advancedGamificationRouter = router({
  // ======================== GUILDS ========================

  getGuilds: protectedProcedure.query(async () => {
    return GUILD_SEED.map(g => ({
      ...g,
      avgLevel: Math.round(g.totalXp / g.memberCount / 1_000),
    }));
  }),

  getGuildDetails: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const guild = GUILD_SEED.find(g => g.id === input.guildId);
      if (!guild) throw new TRPCError({ code: "NOT_FOUND", message: "Guild not found" });
      return {
        ...guild,
        members: GUILD_MEMBERS_SEED,
        achievements: GUILD_ACHIEVEMENTS_SEED,
        treasury: { totalPoints: 125_000, weeklyEarned: 8_500 },
        weeklyXp: 85_000,
        activeChallenges: GUILD_CHALLENGES_SEED.filter(c => c.guild1.id === guild.id || c.guild2.id === guild.id),
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
      const newGuild = {
        id: `g-${randomId()}`,
        name: input.name,
        banner: input.banner || "/banners/default.png",
        motto: input.motto || "",
        tag: input.tag,
        memberCount: 1,
        totalXp: 0,
        rank: GUILD_SEED.length + 1,
        level: 1,
        foundedAt: new Date().toISOString().split("T")[0],
        region: "Unknown",
        isRecruiting: true,
        founderId: userId(ctx),
      };
      return { success: true, guild: newGuild };
    }),

  joinGuild: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const guild = GUILD_SEED.find(g => g.id === input.guildId);
      if (!guild) throw new TRPCError({ code: "NOT_FOUND", message: "Guild not found" });
      if (!guild.isRecruiting) throw new TRPCError({ code: "FORBIDDEN", message: "This guild is not currently recruiting" });
      return { success: true, guildId: guild.id, guildName: guild.name, userId: userId(ctx) };
    }),

  getGuildLeaderboard: protectedProcedure.query(async () => {
    return GUILD_SEED
      .sort((a, b) => b.totalXp - a.totalXp)
      .map((g, i) => ({
        rank: i + 1,
        guildId: g.id,
        name: g.name,
        tag: g.tag,
        memberCount: g.memberCount,
        totalXp: g.totalXp,
        level: g.level,
        weeklyChange: Math.floor(Math.random() * 20_000) - 5_000,
      }));
  }),

  getGuildChallenges: protectedProcedure.query(async () => {
    return GUILD_CHALLENGES_SEED;
  }),

  // ======================== PRESTIGE ========================

  getPrestigeSystem: protectedProcedure.query(async ({ ctx }) => {
    const currentPrestige = 2;
    const totalXp = 210_000;
    const currentLevel = PRESTIGE_LEVELS[currentPrestige];
    const nextLevel = PRESTIGE_LEVELS[currentPrestige + 1] || null;
    return {
      currentPrestige,
      currentLevel,
      nextLevel,
      totalXp,
      xpToNext: nextLevel ? nextLevel.requiredXp - totalXp : 0,
      progressPercent: nextLevel ? Math.round(((totalXp - currentLevel.requiredXp) / (nextLevel.requiredXp - currentLevel.requiredXp)) * 100) : 100,
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
      storeUnlocks: REWARDS_STORE_SEED.filter(r => r.prestigeRequired === l.level).map(r => r.name),
    }));
  }),

  activatePrestige: protectedProcedure.mutation(async ({ ctx }) => {
    // In production, this would reset the user's XP and increment prestige level
    return {
      success: true,
      newPrestigeLevel: 3,
      prestigeName: "Gold Express",
      bonusesGained: ["+15% XP gain", "Gold profile frame", "+5% point bonus", "Priority guild recruitment"],
      xpReset: true,
      message: "Congratulations! You have prestiged to Gold Express. Your XP has been reset but you gained permanent bonuses.",
    };
  }),

  // ======================== REWARDS STORE ========================

  getRewardsStore: protectedProcedure
    .input(z.object({
      category: z.enum(["all", "fuel", "pay", "pto", "merch", "cosmetic"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const category = input?.category || "all";
      const items = category === "all" ? REWARDS_STORE_SEED : REWARDS_STORE_SEED.filter(r => r.category === category);
      return {
        items,
        userPoints: 12_500,
        userPrestige: 2,
        categories: [
          { id: "all", name: "All Items", count: REWARDS_STORE_SEED.length },
          { id: "fuel", name: "Fuel Cards", count: REWARDS_STORE_SEED.filter(r => r.category === "fuel").length },
          { id: "pay", name: "Bonus Pay", count: REWARDS_STORE_SEED.filter(r => r.category === "pay").length },
          { id: "pto", name: "PTO", count: REWARDS_STORE_SEED.filter(r => r.category === "pto").length },
          { id: "merch", name: "Merchandise", count: REWARDS_STORE_SEED.filter(r => r.category === "merch").length },
          { id: "cosmetic", name: "Cosmetics", count: REWARDS_STORE_SEED.filter(r => r.category === "cosmetic").length },
        ],
      };
    }),

  purchaseReward: protectedProcedure
    .input(z.object({ rewardId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const item = REWARDS_STORE_SEED.find(r => r.id === input.rewardId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Reward not found" });
      if (!item.inStock) throw new TRPCError({ code: "BAD_REQUEST", message: "Item is out of stock" });
      return {
        success: true,
        purchaseId: `pur-${randomId()}`,
        item: item.name,
        cost: item.cost,
        remainingPoints: 12_500 - item.cost,
        message: `Successfully redeemed ${item.name}!`,
      };
    }),

  getRewardsPurchaseHistory: protectedProcedure.query(async ({ ctx }) => {
    return [
      { id: "ph1", itemName: "Fuel Card $25", cost: 2_500, purchasedAt: "2026-02-20T14:00:00Z", status: "fulfilled" as const },
      { id: "ph2", itemName: "Premium Trucker Hat", cost: 2_000, purchasedAt: "2026-02-15T10:30:00Z", status: "shipped" as const },
      { id: "ph3", itemName: "Bonus Pay +$100", cost: 8_000, purchasedAt: "2026-01-28T16:45:00Z", status: "fulfilled" as const },
    ];
  }),

  // ======================== SEASONAL EVENTS ========================

  getSeasonalEvents: protectedProcedure.query(async () => {
    return SEASONAL_EVENTS_SEED.map(e => ({
      ...e,
      daysRemaining: e.status === "active" ? daysUntil(e.endsAt) : null,
      daysUntilStart: e.status === "upcoming" ? daysUntil(e.startsAt) : null,
    }));
  }),

  getSeasonalProgress: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const event = SEASONAL_EVENTS_SEED.find(e => e.id === input.eventId);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      return {
        eventId: event.id,
        eventName: event.name,
        currentProgress: 18,
        rewards: event.rewards.map(r => ({
          ...r,
          achieved: r.threshold <= 18,
          progress: Math.min(100, Math.round((18 / r.threshold) * 100)),
        })),
        rank: 24,
        totalParticipants: 342,
        streakDays: 5,
      };
    }),

  getSeasonalRewards: protectedProcedure.query(async () => {
    return SEASONAL_EVENTS_SEED.flatMap(e =>
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
    return TOURNAMENTS_SEED.map(t => ({
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
      const tournament = TOURNAMENTS_SEED.find(t => t.id === input.tournamentId);
      if (!tournament) throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" });
      return {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        type: tournament.type,
        rounds: TOURNAMENT_BRACKET_SEED,
        totalRounds: 3,
        currentRound: 3,
      };
    }),

  joinTournament: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tournament = TOURNAMENTS_SEED.find(t => t.id === input.tournamentId);
      if (!tournament) throw new TRPCError({ code: "NOT_FOUND", message: "Tournament not found" });
      if (tournament.currentParticipants >= tournament.maxParticipants) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tournament is full" });
      }
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
    .query(async ({ input }) => {
      let achs = getAchievements();
      const cat = input?.category || "all";
      const rar = input?.rarity || "all";
      const stat = input?.status || "all";
      if (cat !== "all") achs = achs.filter(a => a.category === cat);
      if (rar !== "all") achs = achs.filter(a => a.rarity === rar);
      if (stat === "unlocked") achs = achs.filter(a => a.unlocked);
      if (stat === "locked") achs = achs.filter(a => !a.unlocked);
      const total = getAchievements().length;
      const unlocked = getAchievements().filter(a => a.unlocked).length;
      return {
        achievements: achs,
        total,
        unlocked,
        completionPercent: Math.round((unlocked / total) * 100),
        categories: ACHIEVEMENT_CATEGORIES.map(c => ({
          id: c,
          name: c.charAt(0).toUpperCase() + c.slice(1),
          count: getAchievements().filter(a => a.category === c).length,
          unlockedCount: getAchievements().filter(a => a.category === c && a.unlocked).length,
        })),
      };
    }),

  getAchievementProgress: protectedProcedure
    .input(z.object({ achievementId: z.string() }))
    .query(async ({ input }) => {
      const ach = getAchievements().find(a => a.id === input.achievementId);
      if (!ach) throw new TRPCError({ code: "NOT_FOUND", message: "Achievement not found" });
      return ach;
    }),

  getRareAchievements: protectedProcedure.query(async () => {
    return getAchievements()
      .filter(a => a.rarity === "epic" || a.rarity === "legendary")
      .sort((a, b) => a.unlockPercentage - b.unlockPercentage)
      .slice(0, 20);
  }),

  // ======================== QUESTS ========================

  getDailyQuests: protectedProcedure.query(async () => {
    return {
      quests: DAILY_QUESTS_SEED,
      completedCount: DAILY_QUESTS_SEED.filter(q => q.completed).length,
      totalCount: DAILY_QUESTS_SEED.length,
      bonusXpForAll: 500,
      allCompleted: DAILY_QUESTS_SEED.every(q => q.completed),
    };
  }),

  completeDailyQuest: protectedProcedure
    .input(z.object({ questId: z.string() }))
    .mutation(async ({ input }) => {
      const quest = DAILY_QUESTS_SEED.find(q => q.id === input.questId);
      if (!quest) throw new TRPCError({ code: "NOT_FOUND", message: "Quest not found" });
      if (quest.completed) throw new TRPCError({ code: "BAD_REQUEST", message: "Quest already completed" });
      return {
        success: true,
        questId: quest.id,
        xpEarned: quest.xpReward,
        message: `Completed "${quest.name}" - earned ${quest.xpReward} XP!`,
      };
    }),

  getWeeklyMissions: protectedProcedure.query(async () => {
    return {
      missions: WEEKLY_MISSIONS_SEED,
      completedCount: WEEKLY_MISSIONS_SEED.filter(m => m.completed).length,
      totalCount: WEEKLY_MISSIONS_SEED.length,
      chainBonusMultiplier: 1.5,
      weekEndsAt: "2026-03-15T23:59:59Z",
    };
  }),

  getStreakTracker: protectedProcedure.query(async () => {
    return {
      dailyStreak: 12,
      weeklyStreak: 5,
      bestDailyStreak: 34,
      bestWeeklyStreak: 8,
      currentMultiplier: 1.6,
      nextMultiplierAt: 14,
      nextMultiplierValue: 1.8,
      streakHistory: [
        { date: "2026-03-09", completed: true },
        { date: "2026-03-08", completed: true },
        { date: "2026-03-07", completed: true },
        { date: "2026-03-06", completed: true },
        { date: "2026-03-05", completed: true },
        { date: "2026-03-04", completed: true },
        { date: "2026-03-03", completed: true },
      ],
      dailyBonusXp: 120,
    };
  }),

  // ======================== SOCIAL ========================

  getSocialFeed: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit || 20;
      return SOCIAL_FEED_SEED.slice(0, limit);
    }),

  getDriverProfile: protectedProcedure
    .input(z.object({ driverId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return {
        id: input?.driverId || userId(ctx),
        name: "Current Driver",
        title: "Road Warrior",
        avatar: "/avatars/classic.png",
        frame: "/frames/silver.png",
        level: 47,
        xp: 142_000,
        xpToNextLevel: 158_000,
        prestigeLevel: 2,
        prestigeName: "Silver Road",
        guildId: "g1",
        guildName: "Road Warriors",
        guildRole: "Officer",
        badges: [
          { id: "b1", name: "Early Adopter", icon: "rocket", rarity: "rare" as const },
          { id: "b2", name: "Safety Star", icon: "shield", rarity: "epic" as const },
          { id: "b3", name: "Mile Marker 100K", icon: "flag", rarity: "rare" as const },
          { id: "b4", name: "On-Time King", icon: "clock", rarity: "uncommon" as const },
          { id: "b5", name: "Team Player", icon: "users", rarity: "common" as const },
        ],
        stats: {
          totalMiles: 342_500,
          totalLoads: 478,
          onTimeRate: 97.2,
          safetyScore: 98,
          avgMpg: 7.4,
          yearsOfService: 1.8,
          rankOverall: 24,
          rankGuild: 2,
        },
        recentAchievements: getAchievements().filter(a => a.unlocked).slice(0, 5),
        customization: {
          avatarId: "av2",
          frameId: "fr3",
          titleId: "ti2",
        },
      };
    }),

  getCustomizationOptions: protectedProcedure.query(async () => {
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
    .mutation(async ({ input }) => {
      const item = CUSTOMIZATION_OPTIONS.find(o => o.id === input.itemId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      if (!item.owned) throw new TRPCError({ code: "BAD_REQUEST", message: "You do not own this item" });
      return { success: true, equipped: input.itemId, type: input.type };
    }),

  getMilestones: protectedProcedure.query(async () => {
    return {
      milestones: MILESTONES_SEED,
      achievedCount: MILESTONES_SEED.filter(m => m.achieved).length,
      totalCount: MILESTONES_SEED.length,
    };
  }),

  getLeaderboardHistory: protectedProcedure.query(async () => {
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      weeks.push({
        week: d.toISOString().split("T")[0],
        rank: Math.max(1, 30 - i * 2 + Math.floor(Math.random() * 5)),
        xpEarned: 8_000 + Math.floor(Math.random() * 4_000),
        milesLogged: 1_500 + Math.floor(Math.random() * 1_000),
        loadsCompleted: 5 + Math.floor(Math.random() * 8),
      });
    }
    return {
      history: weeks,
      currentRank: 24,
      bestRank: 8,
      averageRank: 18,
      trend: "improving" as const,
    };
  }),
});
