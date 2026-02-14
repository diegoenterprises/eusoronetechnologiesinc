/**
 * GAMIFICATION SYSTEM
 * Points, badges, leaderboards, achievements, and tier management
 */

export interface UserPoints {
  userId: number;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
  level: number;
  rank: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "SAFETY" | "PERFORMANCE" | "MILESTONE" | "SPECIAL";
  points: number;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
}

export interface Achievement {
  id: string;
  userId: number;
  badgeId: string;
  earnedAt: Date;
  progress: number;
  completed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  userRole: string;
  points: number;
  tier: string;
  badge?: string;
}

// Point values for different activities
export const POINT_VALUES = {
  // Load/Job completion
  LOAD_COMPLETED: 100,
  LOAD_ON_TIME: 50,
  LOAD_EARLY: 75,
  HAZMAT_LOAD_COMPLETED: 150,
  
  // Safety
  NO_VIOLATIONS_WEEK: 200,
  NO_VIOLATIONS_MONTH: 500,
  PERFECT_INSPECTION: 100,
  SAFETY_TRAINING_COMPLETED: 150,
  
  // Performance
  FIVE_STAR_RATING: 50,
  CUSTOMER_COMPLIMENT: 100,
  FUEL_EFFICIENCY_BONUS: 75,
  ZERO_DETENTION: 50,
  
  // Platform engagement
  PROFILE_COMPLETED: 50,
  DOCUMENT_UPLOADED: 25,
  REFERRAL_SIGNUP: 300,
  DAILY_LOGIN: 10,
  WEEKLY_STREAK: 100,
  
  // Communication
  QUICK_RESPONSE: 25,
  MESSAGE_SENT: 5,
  LOAD_POSTED: 50,
  BID_PLACED: 25,
};

// Badge definitions
export const BADGES: Badge[] = [
  // Safety Badges
  {
    id: "safety_champion",
    name: "Safety Champion",
    description: "Complete 100 loads with zero safety violations",
    icon: "shield-check",
    category: "SAFETY",
    points: 1000,
    rarity: "LEGENDARY",
  },
  {
    id: "perfect_inspector",
    name: "Perfect Inspector",
    description: "Pass 50 consecutive vehicle inspections",
    icon: "clipboard-check",
    category: "SAFETY",
    points: 500,
    rarity: "EPIC",
  },
  {
    id: "hazmat_expert",
    name: "HazMat Expert",
    description: "Complete 50 hazmat loads safely",
    icon: "alert-triangle",
    category: "SAFETY",
    points: 750,
    rarity: "EPIC",
  },
  
  // Performance Badges
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Complete 100 loads ahead of schedule",
    icon: "zap",
    category: "PERFORMANCE",
    points: 800,
    rarity: "EPIC",
  },
  {
    id: "five_star_pro",
    name: "Five Star Pro",
    description: "Maintain 5-star rating for 30 days",
    icon: "star",
    category: "PERFORMANCE",
    points: 600,
    rarity: "RARE",
  },
  {
    id: "fuel_master",
    name: "Fuel Master",
    description: "Achieve top 10% fuel efficiency for 3 months",
    icon: "droplet",
    category: "PERFORMANCE",
    points: 700,
    rarity: "EPIC",
  },
  
  // Milestone Badges
  {
    id: "first_load",
    name: "First Load",
    description: "Complete your first load",
    icon: "truck",
    category: "MILESTONE",
    points: 100,
    rarity: "COMMON",
  },
  {
    id: "century_club",
    name: "Century Club",
    description: "Complete 100 loads",
    icon: "award",
    category: "MILESTONE",
    points: 1000,
    rarity: "RARE",
  },
  {
    id: "thousand_miles",
    name: "Thousand Miles",
    description: "Drive 1,000 miles",
    icon: "map",
    category: "MILESTONE",
    points: 500,
    rarity: "RARE",
  },
  {
    id: "veteran",
    name: "Veteran",
    description: "1 year on the platform",
    icon: "calendar",
    category: "MILESTONE",
    points: 2000,
    rarity: "LEGENDARY",
  },
  
  // Special Badges
  {
    id: "early_adopter",
    name: "Early Adopter",
    description: "Joined EusoTrip in the first month",
    icon: "rocket",
    category: "SPECIAL",
    points: 500,
    rarity: "LEGENDARY",
  },
  {
    id: "referral_master",
    name: "Referral Master",
    description: "Refer 10 active users",
    icon: "users",
    category: "SPECIAL",
    points: 1500,
    rarity: "EPIC",
  },
  {
    id: "community_helper",
    name: "Community Helper",
    description: "Help 50 users through messages",
    icon: "heart",
    category: "SPECIAL",
    points: 800,
    rarity: "RARE",
  },
];

// Tier thresholds
export const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 15000,
  DIAMOND: 50000,
};

// Tier benefits
export const TIER_BENEFITS = {
  BRONZE: {
    name: "Bronze",
    color: "#CD7F32",
    benefits: ["Basic platform access", "Standard support"],
  },
  SILVER: {
    name: "Silver",
    color: "#C0C0C0",
    benefits: ["Priority load matching", "Email support", "5% QuickPay discount"],
  },
  GOLD: {
    name: "Gold",
    color: "#FFD700",
    benefits: ["Premium load matching", "Phone support", "10% QuickPay discount", "Featured profile"],
  },
  PLATINUM: {
    name: "Platinum",
    color: "#E5E4E2",
    benefits: ["AI-powered recommendations", "24/7 support", "15% QuickPay discount", "Priority bidding", "Dedicated account manager"],
  },
  DIAMOND: {
    name: "Diamond",
    color: "#B9F2FF",
    benefits: ["All Platinum benefits", "20% QuickPay discount", "Exclusive loads", "Annual bonus", "VIP events"],
  },
};

/**
 * Calculate user tier based on total points
 */
export function calculateTier(totalPoints: number): keyof typeof TIER_THRESHOLDS {
  if (totalPoints >= TIER_THRESHOLDS.DIAMOND) return "DIAMOND";
  if (totalPoints >= TIER_THRESHOLDS.PLATINUM) return "PLATINUM";
  if (totalPoints >= TIER_THRESHOLDS.GOLD) return "GOLD";
  if (totalPoints >= TIER_THRESHOLDS.SILVER) return "SILVER";
  return "BRONZE";
}

/**
 * Calculate user level based on total points
 * Each level requires 500 points
 */
export function calculateLevel(totalPoints: number): number {
  return Math.floor(totalPoints / 500) + 1;
}

/**
 * Calculate points needed for next tier
 */
export function pointsToNextTier(totalPoints: number): { nextTier: string; pointsNeeded: number } {
  const currentTier = calculateTier(totalPoints);
  
  const tiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const;
  const currentIndex = tiers.indexOf(currentTier);
  
  if (currentIndex === tiers.length - 1) {
    return { nextTier: "MAX", pointsNeeded: 0 };
  }
  
  const nextTier = tiers[currentIndex + 1];
  const pointsNeeded = TIER_THRESHOLDS[nextTier] - totalPoints;
  
  return { nextTier, pointsNeeded };
}

/**
 * Award points to a user
 */
export async function awardPoints(
  userId: number,
  points: number,
  reason: string,
  db: any
): Promise<{ success: boolean; newTotal: number; tierUp?: boolean }> {
  // This would integrate with your database
  // For now, returning mock data
  const currentTotal = 5000; // Would fetch from DB
  const newTotal = currentTotal + points;
  
  const oldTier = calculateTier(currentTotal);
  const newTier = calculateTier(newTotal);
  const tierUp = oldTier !== newTier;
  
  // TODO: Insert into database
  // await db.insert(pointsHistory).values({
  //   userId,
  //   points,
  //   reason,
  //   timestamp: new Date(),
  // });
  
  // TODO: Update user's total points
  // await db.update(users).set({ totalPoints: newTotal }).where(eq(users.id, userId));
  
  return { success: true, newTotal, tierUp };
}

/**
 * Check and award badge if criteria met
 */
export async function checkBadgeEligibility(
  userId: number,
  badgeId: string,
  db: any
): Promise<{ eligible: boolean; awarded: boolean }> {
  // TODO: Check if user already has badge
  // TODO: Check if user meets criteria
  // TODO: Award badge if eligible
  
  return { eligible: false, awarded: false };
}

/**
 * Get leaderboard for a specific time period
 */
export async function getLeaderboard(
  period: "daily" | "weekly" | "monthly" | "all-time",
  role?: string,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  // TODO: Query database for top users by points in the period
  // TODO: Filter by role if specified
  
  // Mock data
  return [
    {
      rank: 1,
      userId: 1,
      userName: "John Driver",
      userRole: "DRIVER",
      points: 15000,
      tier: "PLATINUM",
      badge: "safety_champion",
    },
    {
      rank: 2,
      userId: 2,
      userName: "Jane Catalyst",
      userRole: "CATALYST",
      points: 12500,
      tier: "GOLD",
      badge: "five_star_pro",
    },
    {
      rank: 3,
      userId: 3,
      userName: "Bob Shipper",
      userRole: "SHIPPER",
      points: 10000,
      tier: "GOLD",
      badge: "century_club",
    },
  ];
}

/**
 * Get user's achievements and progress
 */
export async function getUserAchievements(userId: number, db: any): Promise<Achievement[]> {
  // TODO: Query database for user's achievements
  
  return [];
}

/**
 * Get user's rank among all users (or within role)
 */
export async function getUserRank(userId: number, db: any, role?: string): Promise<number> {
  // TODO: Query database to calculate user's rank
  
  return 1;
}

