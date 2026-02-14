/**
 * WEEKLY MISSION GENERATOR
 * Generates 10+ rotating missions per role every week.
 * Seeds into DB missions table. Connects to loads, HOS, safety.
 */
import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { missions } from "../../drizzle/schema";

interface MT { name:string; desc:string; cat:"deliveries"|"earnings"|"safety"|"efficiency"|"social"|"special"|"onboarding"; tt:"count"|"amount"|"distance"|"streak"|"rating"|"time"; tv:number; tu?:string; rt:"miles"|"xp"|"crate"|"priority_perk"|"fee_reduction"|"cash"; rv:number; xp:number; roles:string[]; tp:"weekly"|"daily"; }

const ALL_TEMPLATES: MT[] = [
// SHIPPER (12)
{name:"Load Commander",desc:"Post {t} loads this week.",cat:"deliveries",tt:"count",tv:3,rt:"xp",rv:400,xp:400,roles:["SHIPPER"],tp:"weekly"},
{name:"Freight Blitz",desc:"Post {t} loads in a single day.",cat:"deliveries",tt:"count",tv:2,rt:"xp",rv:300,xp:300,roles:["SHIPPER"],tp:"daily"},
{name:"Fair Pay Champion",desc:"Post {t} load(s) at or above market avg rate.",cat:"special",tt:"count",tv:1,rt:"miles",rv:200,xp:250,roles:["SHIPPER"],tp:"weekly"},
{name:"Quick Booker",desc:"Accept catalyst bid within 2hrs on {t} load(s).",cat:"efficiency",tt:"count",tv:2,rt:"xp",rv:350,xp:350,roles:["SHIPPER"],tp:"weekly"},
{name:"Multi-Lane Shipper",desc:"Post loads across {t} different origin states.",cat:"deliveries",tt:"count",tv:3,rt:"xp",rv:400,xp:400,roles:["SHIPPER"],tp:"weekly"},
{name:"Catalyst Reviewer",desc:"Rate {t} catalysts after delivery.",cat:"social",tt:"count",tv:3,rt:"miles",rv:150,xp:200,roles:["SHIPPER"],tp:"weekly"},
{name:"Bid Negotiator",desc:"Negotiate rates on {t} loads.",cat:"earnings",tt:"count",tv:2,rt:"xp",rv:300,xp:300,roles:["SHIPPER"],tp:"weekly"},
{name:"Contract Builder",desc:"Sign {t} lane agreement(s) with catalysts.",cat:"special",tt:"count",tv:1,rt:"priority_perk",rv:1,xp:500,roles:["SHIPPER"],tp:"weekly"},
{name:"Recurring Revenue",desc:"Set up {t} recurring load(s).",cat:"efficiency",tt:"count",tv:1,rt:"xp",rv:350,xp:350,roles:["SHIPPER"],tp:"weekly"},
{name:"Hazmat Compliance",desc:"Post {t} classified hazmat load(s) with correct UN#.",cat:"safety",tt:"count",tv:1,rt:"xp",rv:400,xp:400,roles:["SHIPPER"],tp:"weekly"},
{name:"Document Master",desc:"Upload {t} shipping docs (BOL, rate conf).",cat:"efficiency",tt:"count",tv:3,rt:"xp",rv:250,xp:250,roles:["SHIPPER"],tp:"weekly"},
{name:"SPECTRA Verifier",desc:"Verify product via SPECTRA-MATCH on {t} shipment(s).",cat:"safety",tt:"count",tv:1,rt:"miles",rv:200,xp:300,roles:["SHIPPER"],tp:"weekly"},
// CATALYST (12)
{name:"Road Warrior",desc:"Complete {t} loads this week.",cat:"deliveries",tt:"count",tv:5,rt:"xp",rv:500,xp:500,roles:["CATALYST"],tp:"weekly"},
{name:"On-Time Streak",desc:"Deliver {t} consecutive loads on time.",cat:"efficiency",tt:"streak",tv:3,rt:"miles",rv:300,xp:400,roles:["CATALYST"],tp:"weekly"},
{name:"Safety Shield",desc:"Complete {t} loads with zero incidents.",cat:"safety",tt:"count",tv:3,rt:"xp",rv:400,xp:400,roles:["CATALYST"],tp:"weekly"},
{name:"Fleet Commander",desc:"Dispatch {t} loads across your fleet.",cat:"deliveries",tt:"count",tv:4,rt:"xp",rv:450,xp:450,roles:["CATALYST"],tp:"weekly"},
{name:"Bid Hunter",desc:"Submit bids on {t} loads from load board.",cat:"earnings",tt:"count",tv:5,rt:"xp",rv:350,xp:350,roles:["CATALYST"],tp:"weekly"},
{name:"Five-Star Service",desc:"Receive {t} five-star ratings from shippers.",cat:"social",tt:"rating",tv:2,rt:"miles",rv:250,xp:350,roles:["CATALYST"],tp:"weekly"},
{name:"Compliance Check",desc:"Verify {t} drivers have current compliance docs.",cat:"safety",tt:"count",tv:2,rt:"xp",rv:300,xp:300,roles:["CATALYST"],tp:"weekly"},
{name:"Revenue Milestone",desc:"Earn ${t}+ in load revenue this week.",cat:"earnings",tt:"amount",tv:5000,tu:"USD",rt:"xp",rv:500,xp:500,roles:["CATALYST"],tp:"weekly"},
{name:"Hazmat Hauler",desc:"Complete {t} hazmat load(s) with DOT compliance.",cat:"safety",tt:"count",tv:1,rt:"crate",rv:1,xp:400,roles:["CATALYST"],tp:"weekly"},
{name:"Quick Accept",desc:"Accept {t} load(s) within 30 min.",cat:"efficiency",tt:"count",tv:3,rt:"xp",rv:300,xp:300,roles:["CATALYST"],tp:"weekly"},
{name:"BOL Champion",desc:"Submit {t} BOL(s) within 1hr of delivery.",cat:"efficiency",tt:"count",tv:3,rt:"xp",rv:250,xp:250,roles:["CATALYST"],tp:"weekly"},
{name:"Insurance Guardian",desc:"Verify insurance docs for {t} vehicle(s).",cat:"safety",tt:"count",tv:2,rt:"xp",rv:300,xp:300,roles:["CATALYST"],tp:"weekly"},
// DRIVER (12)
{name:"Mile Eater",desc:"Drive {t} miles safely this week.",cat:"deliveries",tt:"distance",tv:500,tu:"miles",rt:"xp",rv:400,xp:400,roles:["DRIVER"],tp:"weekly"},
{name:"Delivery Pro",desc:"Complete {t} deliveries this week.",cat:"deliveries",tt:"count",tv:4,rt:"xp",rv:450,xp:450,roles:["DRIVER"],tp:"weekly"},
{name:"HOS Hero",desc:"100% HOS compliance for {t} days. 11hr/14hr limits.",cat:"safety",tt:"streak",tv:5,rt:"miles",rv:300,xp:500,roles:["DRIVER"],tp:"weekly"},
{name:"Pre-Trip Inspector",desc:"Complete {t} pre-trip inspections with DVIR.",cat:"safety",tt:"count",tv:5,rt:"xp",rv:350,xp:350,roles:["DRIVER"],tp:"weekly"},
{name:"Zero Violations",desc:"{t} days without DOT violations.",cat:"safety",tt:"streak",tv:7,rt:"crate",rv:1,xp:500,roles:["DRIVER"],tp:"weekly"},
{name:"On-Time Champion",desc:"Deliver {t} loads before scheduled time.",cat:"efficiency",tt:"count",tv:3,rt:"xp",rv:350,xp:350,roles:["DRIVER"],tp:"weekly"},
{name:"Fuel Saver",desc:"{t} deliveries with above-avg fuel efficiency.",cat:"efficiency",tt:"count",tv:2,rt:"miles",rv:200,xp:300,roles:["DRIVER"],tp:"weekly"},
{name:"Run Ticket Expert",desc:"Submit {t} run tickets with volume & temp.",cat:"efficiency",tt:"count",tv:3,rt:"xp",rv:300,xp:300,roles:["DRIVER"],tp:"weekly"},
{name:"Rest Stop Regular",desc:"Take {t} mandatory rest breaks at rest areas.",cat:"safety",tt:"count",tv:3,rt:"xp",rv:200,xp:200,roles:["DRIVER"],tp:"weekly"},
{name:"Multi-State Hauler",desc:"Deliver in {t} different states.",cat:"deliveries",tt:"count",tv:3,rt:"xp",rv:400,xp:400,roles:["DRIVER"],tp:"weekly"},
{name:"Customer Star",desc:"Receive {t} positive ratings.",cat:"social",tt:"rating",tv:2,rt:"miles",rv:200,xp:300,roles:["DRIVER"],tp:"weekly"},
{name:"Safety Training",desc:"Complete {t} safety training module(s).",cat:"safety",tt:"count",tv:1,rt:"xp",rv:250,xp:250,roles:["DRIVER"],tp:"weekly"},
// BROKER (11)
{name:"Deal Closer",desc:"Match and book {t} loads with catalysts.",cat:"deliveries",tt:"count",tv:5,rt:"xp",rv:500,xp:500,roles:["BROKER"],tp:"weekly"},
{name:"Rate Negotiator",desc:"Negotiate {t} rates both parties accept.",cat:"earnings",tt:"count",tv:3,rt:"miles",rv:250,xp:400,roles:["BROKER"],tp:"weekly"},
{name:"Network Builder",desc:"Onboard {t} new catalysts.",cat:"social",tt:"count",tv:2,rt:"xp",rv:400,xp:400,roles:["BROKER"],tp:"weekly"},
{name:"Board Scanner",desc:"Post {t} loads with complete details.",cat:"deliveries",tt:"count",tv:4,rt:"xp",rv:350,xp:350,roles:["BROKER"],tp:"weekly"},
{name:"Catalyst Vetter",desc:"Verify {t} catalyst compliance packets.",cat:"safety",tt:"count",tv:3,rt:"xp",rv:300,xp:300,roles:["BROKER"],tp:"weekly"},
{name:"Quick Match",desc:"Match catalyst to load within 1hr — {t} times.",cat:"efficiency",tt:"count",tv:3,rt:"xp",rv:350,xp:350,roles:["BROKER"],tp:"weekly"},
{name:"Volume King",desc:"Process ${t}+ in freight value.",cat:"earnings",tt:"amount",tv:20000,tu:"USD",rt:"xp",rv:500,xp:500,roles:["BROKER"],tp:"weekly"},
{name:"Rate Confirm Pro",desc:"Send {t} rate confirmations within 30min.",cat:"efficiency",tt:"count",tv:4,rt:"xp",rv:300,xp:300,roles:["BROKER"],tp:"weekly"},
{name:"Market Analyst",desc:"Check rates on {t} lanes.",cat:"special",tt:"count",tv:5,rt:"miles",rv:200,xp:250,roles:["BROKER"],tp:"weekly"},
{name:"Dispute Resolver",desc:"Resolve {t} load dispute(s).",cat:"special",tt:"count",tv:1,rt:"xp",rv:400,xp:400,roles:["BROKER"],tp:"weekly"},
{name:"Lane Specialist",desc:"Book {t} loads on your top lane.",cat:"deliveries",tt:"count",tv:2,rt:"xp",rv:350,xp:350,roles:["BROKER"],tp:"weekly"},
// DISPATCH (10)
{name:"Product Identifier",desc:"Verify product via SPECTRA-MATCH on {t} shipments.",cat:"safety",tt:"count",tv:3,rt:"xp",rv:500,xp:500,roles:["DISPATCH"],tp:"weekly"},
{name:"ERG Expert",desc:"Look up {t} ERG guides for emergency procedures.",cat:"safety",tt:"count",tv:3,rt:"miles",rv:300,xp:400,roles:["DISPATCH"],tp:"weekly"},
{name:"Hazmat Inspector",desc:"Complete {t} hazmat load inspections.",cat:"safety",tt:"count",tv:2,rt:"xp",rv:400,xp:400,roles:["DISPATCH"],tp:"weekly"},
{name:"Safety Auditor",desc:"Audit protocols at {t} terminal(s).",cat:"safety",tt:"count",tv:1,rt:"xp",rv:450,xp:450,roles:["DISPATCH"],tp:"weekly"},
{name:"Emergency Drill",desc:"Complete {t} emergency response drill(s).",cat:"safety",tt:"count",tv:1,rt:"crate",rv:1,xp:400,roles:["DISPATCH"],tp:"weekly"},
{name:"Compliance Enforcer",desc:"Verify placard compliance on {t} shipments.",cat:"safety",tt:"count",tv:3,rt:"xp",rv:350,xp:350,roles:["DISPATCH"],tp:"weekly"},
{name:"Product Database",desc:"Update {t} product specs in system.",cat:"special",tt:"count",tv:2,rt:"miles",rv:200,xp:300,roles:["DISPATCH"],tp:"weekly"},
{name:"Training Mentor",desc:"Complete {t} hazmat training session(s).",cat:"social",tt:"count",tv:1,rt:"xp",rv:350,xp:350,roles:["DISPATCH"],tp:"weekly"},
{name:"Incident Reporter",desc:"Document {t} safety findings.",cat:"safety",tt:"count",tv:2,rt:"xp",rv:300,xp:300,roles:["DISPATCH"],tp:"weekly"},
{name:"Tank Specialist",desc:"Verify {t} tank measurements & SCADA readings.",cat:"efficiency",tt:"count",tv:3,rt:"xp",rv:350,xp:350,roles:["DISPATCH"],tp:"weekly"},
// ESCORT (10)
{name:"Convoy Guardian",desc:"Complete {t} escort assignments safely.",cat:"safety",tt:"count",tv:2,rt:"xp",rv:500,xp:500,roles:["ESCORT"],tp:"weekly"},
{name:"Route Surveyor",desc:"Complete {t} route surveys for oversize loads.",cat:"efficiency",tt:"count",tv:2,rt:"miles",rv:250,xp:400,roles:["ESCORT"],tp:"weekly"},
{name:"Night Ops",desc:"Complete {t} nighttime escort assignment(s).",cat:"special",tt:"count",tv:1,rt:"xp",rv:400,xp:400,roles:["ESCORT"],tp:"weekly"},
{name:"Bridge Checker",desc:"Verify {t} bridge clearances on route.",cat:"safety",tt:"count",tv:3,rt:"xp",rv:300,xp:300,roles:["ESCORT"],tp:"weekly"},
{name:"Comms Log",desc:"Maintain communication logs for {t} assignments.",cat:"efficiency",tt:"count",tv:2,rt:"xp",rv:250,xp:250,roles:["ESCORT"],tp:"weekly"},
{name:"Permit Tracker",desc:"Verify permit compliance on {t} escorts.",cat:"safety",tt:"count",tv:2,rt:"xp",rv:300,xp:300,roles:["ESCORT"],tp:"weekly"},
{name:"Oversize Expert",desc:"Complete {t} oversize load escorts without incident.",cat:"safety",tt:"count",tv:1,rt:"crate",rv:1,xp:450,roles:["ESCORT"],tp:"weekly"},
{name:"Escort Trainer",desc:"Complete {t} escort certification module(s).",cat:"social",tt:"count",tv:1,rt:"xp",rv:350,xp:350,roles:["ESCORT"],tp:"weekly"},
{name:"Safety Reporter",desc:"Submit {t} escort safety report(s).",cat:"safety",tt:"count",tv:2,rt:"xp",rv:250,xp:250,roles:["ESCORT"],tp:"weekly"},
{name:"Multi-Vehicle Lead",desc:"Coordinate {t} multi-vehicle convoy(s).",cat:"special",tt:"count",tv:1,rt:"miles",rv:300,xp:450,roles:["ESCORT"],tp:"weekly"},
// UNIVERSAL (all roles, 6)
{name:"Platform Engaged",desc:"Log in and perform {t} actions on the platform.",cat:"social",tt:"count",tv:5,rt:"xp",rv:150,xp:150,roles:["SHIPPER","CATALYST","DRIVER","BROKER","DISPATCH","ESCORT"],tp:"weekly"},
{name:"Community Voice",desc:"Send {t} messages in The Haul Lobby.",cat:"social",tt:"count",tv:3,rt:"xp",rv:100,xp:100,roles:["SHIPPER","CATALYST","DRIVER","BROKER","DISPATCH","ESCORT"],tp:"weekly"},
{name:"Profile Complete",desc:"Complete all profile fields and upload {t} document(s).",cat:"onboarding",tt:"count",tv:1,rt:"xp",rv:200,xp:200,roles:["SHIPPER","CATALYST","DRIVER","BROKER","DISPATCH","ESCORT"],tp:"weekly"},
{name:"Referral Champion",desc:"Refer {t} colleague(s) to join EusoTrip.",cat:"social",tt:"count",tv:1,rt:"miles",rv:500,xp:300,roles:["SHIPPER","CATALYST","DRIVER","BROKER","DISPATCH","ESCORT"],tp:"weekly"},
{name:"Knowledge Seeker",desc:"Complete {t} training or certification module(s).",cat:"onboarding",tt:"count",tv:1,rt:"xp",rv:200,xp:200,roles:["SHIPPER","CATALYST","DRIVER","BROKER","DISPATCH","ESCORT"],tp:"weekly"},
{name:"ESANG Explorer",desc:"Ask ESANG AI {t} question(s) about logistics.",cat:"special",tt:"count",tv:3,rt:"xp",rv:100,xp:100,roles:["SHIPPER","CATALYST","DRIVER","BROKER","DISPATCH","ESCORT"],tp:"weekly"},
];

// Deterministic shuffle based on week number
function weekSeed(): number {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now.getTime() - jan1.getTime()) / (7 * 86400000));
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Pick 10 missions for a role from the template pool, rotated weekly.
 */
export function pickWeeklyMissions(role: string, count = 10): MT[] {
  const seed = weekSeed();
  const roleTemplates = ALL_TEMPLATES.filter(t => t.roles.includes(role.toUpperCase()));
  const universal = ALL_TEMPLATES.filter(t => t.roles.length > 3);
  const roleOnly = roleTemplates.filter(t => t.roles.length <= 3);
  const shuffledRole = seededShuffle(roleOnly, seed + role.charCodeAt(0));
  const shuffledUniv = seededShuffle(universal, seed);
  // Pick 7-8 role-specific + 2-3 universal = 10
  const roleCount = Math.min(shuffledRole.length, count - 2);
  const univCount = count - roleCount;
  return [...shuffledRole.slice(0, roleCount), ...shuffledUniv.slice(0, univCount)];
}

/**
 * Seed weekly missions into DB for all roles.
 * Deactivates expired missions first, then inserts new ones if missing.
 */
export async function generateWeeklyMissions(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { start, end } = getWeekBounds();
  const weekNum = weekSeed();
  const roles = ["SHIPPER", "CATALYST", "DRIVER", "BROKER", "DISPATCH", "ESCORT"];
  let created = 0;

  try {
    // Deactivate expired weekly missions
    await db.update(missions)
      .set({ isActive: false })
      .where(sql`endsAt IS NOT NULL AND endsAt < NOW() AND isActive = TRUE AND code LIKE 'wk_%'`);

    for (const role of roles) {
      const picks = pickWeeklyMissions(role, 10);
      for (let i = 0; i < picks.length; i++) {
        const t = picks[i];
        const code = `wk_${weekNum}_${role.toLowerCase()}_${i}`;

        // Check if already exists
        const [existing] = await db.select({ id: missions.id })
          .from(missions)
          .where(eq(missions.code, code))
          .limit(1);

        if (existing) continue;

        await db.insert(missions).values({
          code,
          name: t.name,
          description: t.desc.replace("{t}", String(t.tv)),
          type: t.tp,
          category: t.cat,
          targetType: t.tt,
          targetValue: t.tv.toString(),
          targetUnit: t.tu || null,
          rewardType: t.rt,
          rewardValue: t.rv.toString(),
          xpReward: t.xp,
          applicableRoles: t.roles,
          startsAt: start,
          endsAt: end,
          isActive: true,
          sortOrder: i,
        });
        created++;
      }
    }

    console.log(`[MissionGenerator] Week ${weekNum}: created ${created} missions, deactivated expired.`);
  } catch (err) {
    console.error("[MissionGenerator] Error:", err);
  }

  return created;
}

// Role-specific rewards catalog
export function getRewardsCatalogForRole(role: string) {
  const upper = role.toUpperCase();
  const common = [
    { id: "r_cap", name: "EusoTrip Cap", description: "Official branded cap", category: "merchandise", pointsCost: 500 },
    { id: "r_jacket", name: "EusoTrip Jacket", description: "Premium branded jacket", category: "merchandise", pointsCost: 3000 },
    { id: "r_amazon25", name: "$25 Amazon Gift Card", description: "Amazon gift card", category: "gift_cards", pointsCost: 2500 },
    { id: "r_amazon50", name: "$50 Amazon Gift Card", description: "Amazon gift card", category: "gift_cards", pointsCost: 5000 },
  ];
  const roleRewards: Record<string, any[]> = {
    SHIPPER: [
      { id: "r_ship_vis", name: "Priority Load Visibility", description: "Your loads appear first on the board for 7 days", category: "perks", pointsCost: 1000 },
      { id: "r_ship_fee", name: "Reduced Platform Fee", description: "20% off platform fees for 30 days", category: "perks", pointsCost: 3500 },
      { id: "r_ship_ai", name: "Premium AI Matching", description: "ESANG AI-enhanced catalyst matching for 7 days", category: "perks", pointsCost: 2000 },
    ],
    CATALYST: [
      { id: "r_carr_disp", name: "Priority Dispatch", description: "Priority access to premium loads for 7 days", category: "perks", pointsCost: 1000 },
      { id: "r_carr_fuel", name: "$25 Fuel Card", description: "Gift card for fuel purchases", category: "gift_cards", pointsCost: 2500 },
      { id: "r_carr_fact", name: "Reduced Factoring Fee", description: "0.5% off factoring for 30 days", category: "perks", pointsCost: 3000 },
    ],
    DRIVER: [
      { id: "r_drv_fuel25", name: "$25 Fuel Card", description: "Gift card for fuel purchases", category: "gift_cards", pointsCost: 2500 },
      { id: "r_drv_fuel50", name: "$50 Fuel Card", description: "Gift card for fuel purchases", category: "gift_cards", pointsCost: 5000 },
      { id: "r_drv_rest", name: "Rest Stop Voucher Pack", description: "5 premium rest stop vouchers", category: "perks", pointsCost: 1500 },
      { id: "r_drv_jobs", name: "Priority Job Alerts", description: "First access to new loads for 7 days", category: "perks", pointsCost: 1000 },
    ],
    BROKER: [
      { id: "r_brk_ana", name: "Premium Analytics", description: "Advanced market analytics for 30 days", category: "perks", pointsCost: 2000 },
      { id: "r_brk_fee", name: "Reduced Platform Fee", description: "15% off platform fees for 30 days", category: "perks", pointsCost: 3500 },
      { id: "r_brk_data", name: "Enhanced Market Data", description: "Real-time Platts/Argus-style data for 7 days", category: "perks", pointsCost: 2500 },
    ],
    DISPATCH: [
      { id: "r_cat_spec", name: "SPECTRA-MATCH Pro", description: "Advanced product identification features for 30 days", category: "perks", pointsCost: 2000 },
      { id: "r_cat_cert", name: "Certification Renewal Credit", description: "$100 toward hazmat certification renewal", category: "perks", pointsCost: 4000 },
    ],
    ESCORT: [
      { id: "r_esc_perm", name: "Permit Processing Credit", description: "$50 toward oversize permit processing", category: "perks", pointsCost: 2000 },
      { id: "r_esc_gear", name: "Safety Gear Package", description: "Hi-vis vest, flags, and light kit", category: "merchandise", pointsCost: 1500 },
    ],
  };
  return { rewards: [...(roleRewards[upper] || []), ...common], categories: ["perks", "gift_cards", "merchandise"] };
}

/**
 * Initialize gamification profile for a newly registered user.
 * Called from registration endpoints. Idempotent — safe to call multiple times.
 */
export async function initNewUserGamification(userId: number): Promise<void> {
  const db = await getDb();
  if (!db || !userId) return;

  try {
    // Import here to avoid circular deps
    const { gamificationProfiles } = await import("../../drizzle/schema");
    
    const [existing] = await db.select({ id: gamificationProfiles.id })
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, userId))
      .limit(1);

    if (existing) return; // Already initialized

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

    console.log(`[MissionGenerator] Gamification profile created for user ${userId}`);
  } catch (err) {
    console.error(`[MissionGenerator] Failed to init gamification for user ${userId}:`, err);
  }
}

let _timer: ReturnType<typeof setInterval> | null = null;

export function startMissionScheduler() {
  // Generate on startup
  setTimeout(() => generateWeeklyMissions().catch(console.error), 10000);
  // Re-check every 6 hours
  _timer = setInterval(() => generateWeeklyMissions().catch(console.error), 6 * 60 * 60 * 1000);
  console.log("[MissionGenerator] Scheduler started (generates weekly, checks every 6hrs)");
}

export function stopMissionScheduler() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}
