/**
 * DRIVER WELLNESS & RETENTION ROUTER
 * tRPC procedures for driver wellness programs, fatigue detection,
 * mental health resources, retention scoring, career development,
 * benefits management, incentive programs, and peer recognition.
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

// ── Helper: deterministic seed from string ──
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function resolveDriverId(ctx: any, inputDriverId?: string): string {
  return inputDriverId || String((ctx.user as any)?.id || "1");
}

// ── Mood / sleep / stress enums ──
const moodSchema = z.enum(["excellent", "good", "neutral", "poor", "very_poor"]);
const sleepQualitySchema = z.enum(["excellent", "good", "fair", "poor", "very_poor"]);
const stressLevelSchema = z.enum(["none", "low", "moderate", "high", "severe"]);

export const driverWellnessRouter = router({

  // ═══════════════════════════════════════════════════════════════
  // WELLNESS SCORE
  // ═══════════════════════════════════════════════════════════════
  getWellnessScore: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const driverId = resolveDriverId(ctx, input?.driverId);
      const seed = hashSeed(driverId);
      const hosCompliance = 80 + (seed % 20);
      const drivingPatterns = 70 + ((seed * 3) % 25);
      const restQuality = 65 + ((seed * 7) % 30);
      const composite = Math.round((hosCompliance * 0.4) + (drivingPatterns * 0.3) + (restQuality * 0.3));
      const trendData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2026, i, 1).toISOString().slice(0, 7),
        score: Math.max(50, Math.min(100, composite + ((seed * (i + 1)) % 15) - 7)),
      }));
      return {
        driverId,
        composite,
        hosCompliance,
        drivingPatterns,
        restQuality,
        grade: composite >= 90 ? "A" : composite >= 80 ? "B" : composite >= 70 ? "C" : composite >= 60 ? "D" : "F",
        trend: trendData,
        lastUpdated: new Date().toISOString(),
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // WELLNESS DASHBOARD (fleet-wide)
  // ═══════════════════════════════════════════════════════════════
  getWellnessDashboard: protectedProcedure
    .query(() => {
      return {
        fleetAverageScore: 82,
        totalDrivers: 147,
        driversAtRisk: 12,
        driversExcellent: 68,
        driversGood: 49,
        driversFair: 18,
        averageHosCompliance: 91,
        averageRestQuality: 78,
        averageDrivingPatterns: 84,
        monthOverMonthChange: 2.3,
        topConcerns: [
          { category: "Fatigue", count: 14, severity: "high" },
          { category: "Stress", count: 22, severity: "moderate" },
          { category: "Sleep Quality", count: 18, severity: "moderate" },
          { category: "Physical Strain", count: 8, severity: "low" },
        ],
        recentCheckIns: 89,
        checkInRate: 60.5,
        weeklyTrend: [
          { week: "W1", score: 80 }, { week: "W2", score: 81 },
          { week: "W3", score: 79 }, { week: "W4", score: 82 },
        ],
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // FATIGUE RISK ASSESSMENT
  // ═══════════════════════════════════════════════════════════════
  getFatigueRiskAssessment: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const driverId = resolveDriverId(ctx, input?.driverId);
      const seed = hashSeed(driverId);
      const hoursOnDuty = 6 + (seed % 5);
      const hoursSinceRest = 4 + (seed % 8);
      const timeOfDayFactor = ((seed % 3) === 0) ? "high" : ((seed % 3) === 1) ? "moderate" : "low";
      const routeDifficulty = ((seed % 4) === 0) ? "mountainous" : ((seed % 4) === 1) ? "urban" : ((seed % 4) === 2) ? "highway" : "rural";
      const riskScore = Math.min(100, Math.round(hoursOnDuty * 4 + hoursSinceRest * 3 + (timeOfDayFactor === "high" ? 15 : timeOfDayFactor === "moderate" ? 8 : 0)));
      return {
        driverId,
        riskScore,
        riskLevel: riskScore >= 75 ? "critical" : riskScore >= 50 ? "elevated" : riskScore >= 25 ? "moderate" : "low",
        factors: {
          hoursOnDuty,
          hoursSinceRest,
          timeOfDayFactor,
          routeDifficulty,
          weatherImpact: seed % 2 === 0 ? "none" : "moderate",
          consecutiveDrivingDays: 2 + (seed % 5),
        },
        recommendation: riskScore >= 75
          ? "Immediate rest recommended. Driver approaching fatigue threshold."
          : riskScore >= 50
            ? "Schedule a 30-minute break within the next hour."
            : "No immediate action needed. Continue monitoring.",
        nextMandatoryBreak: new Date(Date.now() + (11 - hoursOnDuty) * 3600000).toISOString(),
        assessedAt: new Date().toISOString(),
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // FATIGUE ALERTS (fleet)
  // ═══════════════════════════════════════════════════════════════
  getFatigueAlerts: protectedProcedure
    .input(z.object({
      severity: z.enum(["all", "critical", "elevated", "moderate"]).optional(),
      limit: z.number().min(1).max(100).optional(),
    }).optional())
    .query(({ input }) => {
      const alerts = [
        { id: "fa-1", driverId: "D-1042", driverName: "Marcus Johnson", riskScore: 88, riskLevel: "critical" as const, reason: "10.5 hours on duty, night driving, mountainous terrain", route: "Denver to Salt Lake City", createdAt: new Date(Date.now() - 1200000).toISOString(), acknowledged: false },
        { id: "fa-2", driverId: "D-1087", driverName: "Sarah Chen", riskScore: 76, riskLevel: "critical" as const, reason: "9 hours consecutive driving, rain conditions", route: "Atlanta to Nashville", createdAt: new Date(Date.now() - 3600000).toISOString(), acknowledged: false },
        { id: "fa-3", driverId: "D-1055", driverName: "Robert Williams", riskScore: 62, riskLevel: "elevated" as const, reason: "Late night shift, 5 consecutive driving days", route: "Chicago to Detroit", createdAt: new Date(Date.now() - 7200000).toISOString(), acknowledged: true },
        { id: "fa-4", driverId: "D-1023", driverName: "Maria Garcia", riskScore: 54, riskLevel: "elevated" as const, reason: "6 consecutive driving days, moderate sleep debt", route: "Dallas to Houston", createdAt: new Date(Date.now() - 10800000).toISOString(), acknowledged: false },
        { id: "fa-5", driverId: "D-1091", driverName: "James Cooper", riskScore: 38, riskLevel: "moderate" as const, reason: "Early morning start after short rest period", route: "Portland to Seattle", createdAt: new Date(Date.now() - 14400000).toISOString(), acknowledged: true },
      ];
      const sev = input?.severity || "all";
      const filtered = sev === "all" ? alerts : alerts.filter(a => a.riskLevel === sev);
      return { alerts: filtered.slice(0, input?.limit || 50), total: filtered.length };
    }),

  // ═══════════════════════════════════════════════════════════════
  // MENTAL HEALTH RESOURCES
  // ═══════════════════════════════════════════════════════════════
  getMentalHealthResources: protectedProcedure
    .query(() => {
      return {
        eapContact: {
          name: "Driver Assistance Program (DAP)",
          phone: "1-800-555-0199",
          available: "24/7",
          description: "Confidential counseling for drivers and families covering stress, anxiety, depression, substance abuse, and relationship issues.",
        },
        crisisLines: [
          { name: "National Suicide Prevention Lifeline", phone: "988", available: "24/7" },
          { name: "Crisis Text Line", phone: "Text HOME to 741741", available: "24/7" },
          { name: "SAMHSA National Helpline", phone: "1-800-662-4357", available: "24/7" },
          { name: "Trucker Path Peer Support", phone: "1-800-555-0177", available: "Mon-Fri 8am-8pm EST" },
        ],
        resources: [
          { id: "mh-1", title: "Managing Stress on the Road", type: "article", url: "/resources/stress-management", readTime: "8 min" },
          { id: "mh-2", title: "Sleep Hygiene for Truck Drivers", type: "video", url: "/resources/sleep-hygiene", readTime: "12 min" },
          { id: "mh-3", title: "Staying Connected with Family", type: "article", url: "/resources/family-connection", readTime: "6 min" },
          { id: "mh-4", title: "Mindfulness Exercises for the Cab", type: "audio", url: "/resources/mindfulness", readTime: "15 min" },
          { id: "mh-5", title: "Recognizing Signs of Burnout", type: "article", url: "/resources/burnout", readTime: "10 min" },
          { id: "mh-6", title: "Healthy Eating at Truck Stops", type: "guide", url: "/resources/nutrition", readTime: "7 min" },
        ],
        selfAssessmentAvailable: true,
        lastCheckIn: new Date(Date.now() - 86400000 * 3).toISOString(),
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // LOG WELLNESS CHECK-IN
  // ═══════════════════════════════════════════════════════════════
  logWellnessCheckIn: protectedProcedure
    .input(z.object({
      mood: moodSchema,
      sleepQuality: sleepQualitySchema,
      sleepHours: z.number().min(0).max(24),
      stressLevel: stressLevelSchema,
      physicalPain: z.number().min(0).max(10).optional(),
      notes: z.string().max(500).optional(),
      exercised: z.boolean().optional(),
      hydratedWell: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const driverId = resolveDriverId(ctx);
      return {
        success: true,
        checkInId: `wci-${Date.now()}`,
        driverId,
        timestamp: new Date().toISOString(),
        ...input,
        wellnessImpact: input.mood === "excellent" || input.mood === "good" ? "positive" : input.mood === "neutral" ? "neutral" : "negative",
        recommendation: input.sleepHours < 6
          ? "Consider adjusting your schedule to get at least 7 hours of sleep."
          : input.stressLevel === "high" || input.stressLevel === "severe"
            ? "High stress detected. Consider using the EAP resources or taking a break."
            : "Great check-in! Keep up the healthy habits.",
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // WELLNESS HISTORY
  // ═══════════════════════════════════════════════════════════════
  getWellnessHistory: protectedProcedure
    .input(z.object({
      driverId: z.string().optional(),
      days: z.number().min(1).max(365).optional(),
    }).optional())
    .query(({ ctx, input }) => {
      const driverId = resolveDriverId(ctx, input?.driverId);
      const days = input?.days || 30;
      const history = Array.from({ length: Math.min(days, 30) }, (_, i) => {
        const date = new Date(Date.now() - (i * 86400000));
        const seed = hashSeed(driverId + date.toDateString());
        const moods = ["excellent", "good", "neutral", "poor", "very_poor"] as const;
        const sleeps = ["excellent", "good", "fair", "poor", "very_poor"] as const;
        return {
          id: `wci-${i}`,
          date: date.toISOString().slice(0, 10),
          mood: moods[seed % 3],
          sleepQuality: sleeps[seed % 3],
          sleepHours: 5 + (seed % 5),
          stressLevel: (["none", "low", "moderate", "high"] as const)[seed % 4],
          physicalPain: seed % 4,
          exercised: seed % 2 === 0,
          hydratedWell: seed % 3 !== 0,
        };
      });
      return {
        driverId,
        history,
        averages: {
          sleepHours: 7.1,
          moodScore: 3.8,
          stressScore: 2.1,
          painLevel: 1.4,
          exerciseRate: 48,
          hydrationRate: 67,
        },
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // RETENTION SCORE
  // ═══════════════════════════════════════════════════════════════
  getRetentionScore: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const driverId = resolveDriverId(ctx, input?.driverId);
      const seed = hashSeed(driverId);
      const tenureMonths = 6 + (seed % 60);
      const satisfactionScore = 60 + (seed % 35);
      const marketComparison = -5 + (seed % 20);
      const retentionScore = Math.round(
        satisfactionScore * 0.35 +
        Math.min(100, tenureMonths * 1.5) * 0.25 +
        (50 + marketComparison) * 0.2 +
        (70 + (seed % 25)) * 0.2
      );
      return {
        driverId,
        retentionScore,
        riskLevel: retentionScore >= 80 ? "low" : retentionScore >= 60 ? "moderate" : retentionScore >= 40 ? "high" : "critical",
        factors: {
          tenureMonths,
          satisfactionScore,
          marketPayComparison: marketComparison,
          homeTimeScore: 60 + (seed % 35),
          benefitsSatisfaction: 65 + (seed % 30),
          equipmentSatisfaction: 70 + (seed % 25),
          managementRelationship: 55 + (seed % 40),
        },
        predictedTurnoverRisk: retentionScore < 50 ? "high" : retentionScore < 70 ? "moderate" : "low",
        nextReviewDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // RETENTION DASHBOARD (fleet-wide)
  // ═══════════════════════════════════════════════════════════════
  getRetentionDashboard: protectedProcedure
    .query(() => {
      return {
        fleetRetentionRate: 87.3,
        averageTenureMonths: 22.5,
        annualTurnoverRate: 12.7,
        industryAvgTurnover: 91,
        costPerTurnover: 12500,
        estimatedAnnualSavings: 187500,
        riskDistribution: {
          low: 98,
          moderate: 31,
          high: 14,
          critical: 4,
        },
        turnoverPredictions: [
          { month: "2026-04", predicted: 3, confidence: 82 },
          { month: "2026-05", predicted: 4, confidence: 76 },
          { month: "2026-06", predicted: 2, confidence: 71 },
        ],
        topRetentionFactors: [
          { factor: "Competitive Pay", impact: 92 },
          { factor: "Home Time", impact: 88 },
          { factor: "Equipment Quality", impact: 79 },
          { factor: "Management Support", impact: 75 },
          { factor: "Benefits Package", impact: 71 },
        ],
        recentDepartures: [
          { driverId: "D-982", name: "Tom Bridges", reason: "Better pay elsewhere", tenureMonths: 8, date: "2026-02-15" },
          { driverId: "D-945", name: "Lisa Tran", reason: "Family/home time", tenureMonths: 14, date: "2026-01-28" },
        ],
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // RETENTION RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════
  getRetentionRecommendations: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const driverId = resolveDriverId(ctx, input?.driverId);
      return {
        driverId,
        recommendations: [
          { id: "rr-1", priority: "high", category: "compensation", title: "Pay Rate Review", description: "Driver's CPM is 8% below market average for their experience level. Consider a $0.04/mi increase.", estimatedImpact: "high", estimatedCost: 4200 },
          { id: "rr-2", priority: "high", category: "home_time", title: "Route Optimization for Home Time", description: "Reassign to regional routes to increase home time from 2 to 3 days/week.", estimatedImpact: "high", estimatedCost: 0 },
          { id: "rr-3", priority: "medium", category: "equipment", title: "Truck Upgrade", description: "Current equipment is 4+ years old. Priority assignment for next new truck.", estimatedImpact: "medium", estimatedCost: 0 },
          { id: "rr-4", priority: "medium", category: "career", title: "Trainer Certification", description: "Driver has expressed interest in becoming a trainer. Enroll in trainer certification program.", estimatedImpact: "medium", estimatedCost: 800 },
          { id: "rr-5", priority: "low", category: "recognition", title: "Safety Milestone Recognition", description: "Driver approaching 2-year safe driving milestone. Plan recognition event.", estimatedImpact: "low", estimatedCost: 150 },
        ],
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // CAREER DEVELOPMENT
  // ═══════════════════════════════════════════════════════════════
  getCareerDevelopment: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const driverId = resolveDriverId(ctx, input?.driverId);
      return {
        driverId,
        currentLevel: "Senior Driver",
        nextLevel: "Lead Driver / Trainer",
        progressPercent: 72,
        paths: [
          {
            id: "cp-1", title: "CDL Class A Endorsements",
            milestones: [
              { name: "Hazmat (H)", status: "completed", completedDate: "2024-06-15" },
              { name: "Tanker (N)", status: "completed", completedDate: "2025-01-10" },
              { name: "Doubles/Triples (T)", status: "in_progress", targetDate: "2026-06-01" },
              { name: "Passenger (P)", status: "not_started", targetDate: null },
            ],
          },
          {
            id: "cp-2", title: "Trainer Certification",
            milestones: [
              { name: "2 years clean driving record", status: "completed", completedDate: "2025-09-01" },
              { name: "Complete trainer orientation", status: "in_progress", targetDate: "2026-05-01" },
              { name: "Shadow certified trainer (40 hrs)", status: "not_started", targetDate: null },
              { name: "Pass trainer evaluation", status: "not_started", targetDate: null },
            ],
          },
          {
            id: "cp-3", title: "Safety Leadership",
            milestones: [
              { name: "Complete advanced safety course", status: "completed", completedDate: "2025-11-20" },
              { name: "Zero incidents for 1 year", status: "in_progress", targetDate: "2026-11-20" },
              { name: "Lead 3 safety meetings", status: "not_started", targetDate: null },
            ],
          },
        ],
        yearsExperience: 4.5,
        totalMiles: 485000,
        endorsements: ["H", "N"],
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // TRAINING PROGRAMS
  // ═══════════════════════════════════════════════════════════════
  getTrainingPrograms: protectedProcedure
    .input(z.object({
      category: z.enum(["all", "safety", "compliance", "skills", "wellness", "leadership"]).optional(),
    }).optional())
    .query(({ input }) => {
      const programs = [
        { id: "tp-1", title: "Advanced Defensive Driving", category: "safety", duration: "8 hours", format: "online", status: "available", enrolled: false, completionRate: 0, credits: 4, description: "Master defensive driving techniques for hazardous conditions." },
        { id: "tp-2", title: "HOS Compliance Mastery", category: "compliance", duration: "4 hours", format: "online", status: "available", enrolled: true, completionRate: 45, credits: 2, description: "Deep dive into Hours of Service regulations and ELD compliance." },
        { id: "tp-3", title: "Hazmat Transportation Safety", category: "safety", duration: "12 hours", format: "hybrid", status: "available", enrolled: false, completionRate: 0, credits: 6, description: "Comprehensive hazmat handling, placarding, and emergency response." },
        { id: "tp-4", title: "Stress Management for Drivers", category: "wellness", duration: "3 hours", format: "online", status: "available", enrolled: false, completionRate: 0, credits: 1, description: "Practical techniques for managing stress during long hauls." },
        { id: "tp-5", title: "Fuel Efficiency Techniques", category: "skills", duration: "2 hours", format: "online", status: "completed", enrolled: true, completionRate: 100, credits: 1, description: "Learn to improve fuel economy by 10-15% through driving techniques." },
        { id: "tp-6", title: "Team Leadership on the Road", category: "leadership", duration: "6 hours", format: "in_person", status: "available", enrolled: false, completionRate: 0, credits: 3, description: "Develop leadership skills for trainers and lead drivers." },
        { id: "tp-7", title: "Cold Chain Management", category: "skills", duration: "5 hours", format: "online", status: "available", enrolled: false, completionRate: 0, credits: 2, description: "Temperature-controlled freight handling and monitoring." },
        { id: "tp-8", title: "Driver Wellness Fundamentals", category: "wellness", duration: "2 hours", format: "online", status: "available", enrolled: true, completionRate: 80, credits: 1, description: "Nutrition, exercise, and sleep optimization for drivers." },
      ];
      const cat = input?.category || "all";
      const filtered = cat === "all" ? programs : programs.filter(p => p.category === cat);
      return {
        programs: filtered,
        totalAvailable: programs.length,
        totalEnrolled: programs.filter(p => p.enrolled).length,
        totalCompleted: programs.filter(p => p.status === "completed").length,
        totalCreditsEarned: programs.filter(p => p.status === "completed").reduce((sum, p) => sum + p.credits, 0),
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // COMPLETE TRAINING MODULE
  // ═══════════════════════════════════════════════════════════════
  completeTrainingModule: protectedProcedure
    .input(z.object({
      programId: z.string(),
      score: z.number().min(0).max(100).optional(),
    }))
    .mutation(({ ctx, input }) => {
      return {
        success: true,
        programId: input.programId,
        driverId: resolveDriverId(ctx),
        completedAt: new Date().toISOString(),
        score: input.score || 85,
        passed: (input.score || 85) >= 70,
        creditsEarned: 2,
        certificate: `CERT-${input.programId}-${Date.now()}`,
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // BENEFITS OVERVIEW
  // ═══════════════════════════════════════════════════════════════
  getBenefitsOverview: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const driverId = resolveDriverId(ctx, input?.driverId);
      return {
        driverId,
        eligibilityDate: "2024-04-01",
        enrollmentWindow: { start: "2026-11-01", end: "2026-11-30", isOpen: false },
        benefits: [
          { id: "b-1", type: "health", name: "Medical Insurance", plan: "PPO Gold", provider: "Blue Cross Blue Shield", monthlyCost: 285, employerContribution: 680, coverage: "Employee + Family", status: "enrolled" },
          { id: "b-2", type: "dental", name: "Dental Insurance", plan: "Delta Dental Premier", provider: "Delta Dental", monthlyCost: 45, employerContribution: 55, coverage: "Employee + Family", status: "enrolled" },
          { id: "b-3", type: "vision", name: "Vision Insurance", plan: "VSP Choice", provider: "VSP", monthlyCost: 12, employerContribution: 18, coverage: "Employee + Family", status: "enrolled" },
          { id: "b-4", type: "retirement", name: "401(k) Retirement", plan: "Company 401k", provider: "Fidelity", monthlyCost: 0, employerContribution: 0, coverage: "6% match", status: "enrolled" },
          { id: "b-5", type: "life", name: "Life Insurance", plan: "2x Annual Salary", provider: "MetLife", monthlyCost: 0, employerContribution: 35, coverage: "$120,000", status: "enrolled" },
          { id: "b-6", type: "disability", name: "Short-Term Disability", plan: "60% salary, 26 weeks", provider: "Hartford", monthlyCost: 0, employerContribution: 28, coverage: "60% salary", status: "enrolled" },
        ],
        pto: { accrued: 12, used: 5, available: 7, maxCarryover: 5, nextAccrual: "2026-04-01" },
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // BENEFITS ENROLLMENT
  // ═══════════════════════════════════════════════════════════════
  getBenefitsEnrollment: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const driverId = resolveDriverId(ctx, input?.driverId);
      return {
        driverId,
        currentEnrollment: [
          { benefitId: "b-1", plan: "PPO Gold", tier: "Employee + Family", monthlyCost: 285 },
          { benefitId: "b-2", plan: "Delta Dental Premier", tier: "Employee + Family", monthlyCost: 45 },
          { benefitId: "b-3", plan: "VSP Choice", tier: "Employee + Family", monthlyCost: 12 },
          { benefitId: "b-4", plan: "Company 401k", tier: "6% contribution", monthlyCost: 0 },
        ],
        totalMonthlyDeduction: 342,
        enrollmentStatus: "active",
        nextOpenEnrollment: "2026-11-01",
        lifeEvents: [
          { type: "marriage", description: "Qualifying life event — 30-day enrollment window" },
          { type: "birth", description: "Qualifying life event — 30-day enrollment window" },
          { type: "loss_of_coverage", description: "Qualifying life event — 60-day enrollment window" },
        ],
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // INCENTIVE PROGRAMS
  // ═══════════════════════════════════════════════════════════════
  getIncentivePrograms: protectedProcedure
    .query(() => {
      return {
        programs: [
          { id: "ip-1", name: "Safe Driver Bonus", description: "Quarterly bonus for zero incidents and clean inspections", reward: "$500/quarter", currentProgress: 78, targetMetric: "0 incidents + clean inspections", endDate: "2026-03-31", status: "active" },
          { id: "ip-2", name: "Fuel Efficiency Champion", description: "Monthly award for top 10% fuel efficiency", reward: "$200/month", currentProgress: 85, targetMetric: "Top 10% MPG", endDate: "2026-03-31", status: "active" },
          { id: "ip-3", name: "On-Time Delivery Streak", description: "Bonus for 20+ consecutive on-time deliveries", reward: "$300 per streak", currentProgress: 65, targetMetric: "20 consecutive on-time", endDate: null, status: "active" },
          { id: "ip-4", name: "Referral Bonus", description: "Refer a qualified driver who stays 90 days", reward: "$2,500 per referral", currentProgress: 0, targetMetric: "Referred driver stays 90 days", endDate: null, status: "active" },
          { id: "ip-5", name: "Mileage Milestone", description: "Bonus at every 100,000 safe miles", reward: "$1,000 per milestone", currentProgress: 85, targetMetric: "100,000 miles without incident", endDate: null, status: "active" },
        ],
        leaderboard: [
          { rank: 1, driverId: "D-1042", name: "Marcus Johnson", totalEarnings: 4200, safetyScore: 98, fuelEfficiency: 7.8 },
          { rank: 2, driverId: "D-1087", name: "Sarah Chen", totalEarnings: 3800, safetyScore: 97, fuelEfficiency: 8.1 },
          { rank: 3, driverId: "D-1023", name: "Maria Garcia", totalEarnings: 3500, safetyScore: 96, fuelEfficiency: 7.5 },
          { rank: 4, driverId: "D-1055", name: "Robert Williams", totalEarnings: 3200, safetyScore: 95, fuelEfficiency: 7.9 },
          { rank: 5, driverId: "D-1091", name: "James Cooper", totalEarnings: 2900, safetyScore: 94, fuelEfficiency: 7.6 },
        ],
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // INCENTIVE EARNINGS
  // ═══════════════════════════════════════════════════════════════
  getIncentiveEarnings: protectedProcedure
    .input(z.object({ driverId: z.string().optional(), period: z.enum(["month", "quarter", "year"]).optional() }).optional())
    .query(({ ctx, input }) => {
      const driverId = resolveDriverId(ctx, input?.driverId);
      return {
        driverId,
        period: input?.period || "year",
        totalEarnings: 5850,
        breakdown: [
          { programId: "ip-1", programName: "Safe Driver Bonus", earned: 2000, payouts: [{ amount: 500, date: "2025-03-31" }, { amount: 500, date: "2025-06-30" }, { amount: 500, date: "2025-09-30" }, { amount: 500, date: "2025-12-31" }] },
          { programId: "ip-2", programName: "Fuel Efficiency Champion", earned: 1400, payouts: [{ amount: 200, date: "2025-08-01" }, { amount: 200, date: "2025-09-01" }, { amount: 200, date: "2025-10-01" }, { amount: 200, date: "2025-11-01" }, { amount: 200, date: "2025-12-01" }, { amount: 200, date: "2026-01-01" }, { amount: 200, date: "2026-02-01" }] },
          { programId: "ip-3", programName: "On-Time Delivery Streak", earned: 900, payouts: [{ amount: 300, date: "2025-07-15" }, { amount: 300, date: "2025-10-22" }, { amount: 300, date: "2026-01-08" }] },
          { programId: "ip-5", programName: "Mileage Milestone", earned: 1000, payouts: [{ amount: 1000, date: "2025-11-15" }] },
          { programId: "ip-4", programName: "Referral Bonus", earned: 2500, payouts: [{ amount: 2500, date: "2025-09-20" }] },
        ],
        pendingPayouts: 700,
        nextPayoutDate: "2026-03-31",
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // DRIVER SATISFACTION SURVEY
  // ═══════════════════════════════════════════════════════════════
  getDriverSatisfactionSurvey: protectedProcedure
    .query(() => {
      return {
        surveyId: "survey-2026-q1",
        title: "Q1 2026 Driver Satisfaction Survey",
        status: "active",
        deadline: "2026-03-31",
        completionRate: 64,
        questions: [
          { id: "q1", text: "How satisfied are you with your overall compensation?", type: "rating", scale: 5 },
          { id: "q2", text: "How would you rate the quality of your assigned equipment?", type: "rating", scale: 5 },
          { id: "q3", text: "How satisfied are you with your home time schedule?", type: "rating", scale: 5 },
          { id: "q4", text: "How well does management communicate with you?", type: "rating", scale: 5 },
          { id: "q5", text: "How likely are you to recommend this company to another driver?", type: "nps", scale: 10 },
          { id: "q6", text: "What one thing would most improve your experience?", type: "text", scale: 0 },
        ],
        previousResults: {
          overallSatisfaction: 3.7,
          compensationScore: 3.4,
          equipmentScore: 4.1,
          homeTimeScore: 3.2,
          managementScore: 3.5,
          npsScore: 42,
          responseRate: 71,
        },
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // SUBMIT SATISFACTION RESPONSE
  // ═══════════════════════════════════════════════════════════════
  submitSatisfactionResponse: protectedProcedure
    .input(z.object({
      surveyId: z.string(),
      responses: z.array(z.object({
        questionId: z.string(),
        rating: z.number().optional(),
        text: z.string().optional(),
      })),
    }))
    .mutation(({ ctx, input }) => {
      return {
        success: true,
        submissionId: `sub-${Date.now()}`,
        surveyId: input.surveyId,
        driverId: resolveDriverId(ctx),
        submittedAt: new Date().toISOString(),
        message: "Thank you for your feedback! Your responses help us improve the driver experience.",
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // HOME TIME OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════
  getHomeTimeOptimization: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const driverId = resolveDriverId(ctx, input?.driverId);
      return {
        driverId,
        homeLocation: "Memphis, TN",
        currentSchedule: { daysOut: 12, daysHome: 3, pattern: "12/3" },
        optimizedSchedule: { daysOut: 10, daysHome: 4, pattern: "10/4" },
        potentialRoutes: [
          { id: "hr-1", route: "Memphis - Nashville - Memphis", distance: 424, estimatedHomeTime: "4 days/2 weeks", payImpact: -120, rating: 4.5 },
          { id: "hr-2", route: "Memphis - Little Rock - Memphis", distance: 270, estimatedHomeTime: "5 days/2 weeks", payImpact: -280, rating: 4.2 },
          { id: "hr-3", route: "Memphis - Birmingham - Atlanta loop", distance: 780, estimatedHomeTime: "3 days/2 weeks", payImpact: 150, rating: 3.8 },
        ],
        nextHomeDate: "2026-03-14",
        averageHomeTimePercentage: 20,
        targetHomeTimePercentage: 28,
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // PEER RECOGNITION FEED
  // ═══════════════════════════════════════════════════════════════
  getPeerRecognition: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).optional(),
    }).optional())
    .query(({ input }) => {
      const recognitions = [
        { id: "pr-1", fromDriverId: "D-1042", fromName: "Marcus Johnson", toDriverId: "D-1087", toName: "Sarah Chen", category: "teamwork", message: "Thanks for helping me navigate the detour in Nashville. Real team player!", kudosCount: 12, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: "pr-2", fromDriverId: "D-1023", fromName: "Maria Garcia", toDriverId: "D-1055", toName: "Robert Williams", category: "safety", message: "Spotted and reported a road hazard that could have caused an accident. Great situational awareness!", kudosCount: 24, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: "pr-3", fromDriverId: "D-1091", fromName: "James Cooper", toDriverId: "D-1042", toName: "Marcus Johnson", category: "mentorship", message: "Took time to show me the proper way to secure oversized loads. Appreciate the mentoring!", kudosCount: 18, createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: "pr-4", fromDriverId: "D-1087", fromName: "Sarah Chen", toDriverId: "D-1023", toName: "Maria Garcia", category: "customer_service", message: "Customer specifically called to compliment Maria on her professionalism during a difficult delivery.", kudosCount: 31, createdAt: new Date(Date.now() - 259200000).toISOString() },
        { id: "pr-5", fromDriverId: "D-1055", fromName: "Robert Williams", toDriverId: "D-1091", toName: "James Cooper", category: "efficiency", message: "Best fuel efficiency numbers this month! Showing us all how it is done.", kudosCount: 9, createdAt: new Date(Date.now() - 345600000).toISOString() },
      ];
      return {
        recognitions: recognitions.slice(0, input?.limit || 20),
        totalThisMonth: 47,
        topRecognized: [
          { driverId: "D-1042", name: "Marcus Johnson", count: 8 },
          { driverId: "D-1023", name: "Maria Garcia", count: 7 },
          { driverId: "D-1087", name: "Sarah Chen", count: 6 },
        ],
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // SEND PEER RECOGNITION
  // ═══════════════════════════════════════════════════════════════
  sendPeerRecognition: protectedProcedure
    .input(z.object({
      toDriverId: z.string(),
      category: z.enum(["safety", "teamwork", "mentorship", "customer_service", "efficiency", "general"]),
      message: z.string().min(10).max(500),
    }))
    .mutation(({ ctx, input }) => {
      return {
        success: true,
        recognitionId: `pr-${Date.now()}`,
        fromDriverId: resolveDriverId(ctx),
        toDriverId: input.toDriverId,
        category: input.category,
        message: input.message,
        createdAt: new Date().toISOString(),
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // PHYSICAL HEALTH METRICS
  // ═══════════════════════════════════════════════════════════════
  getPhysicalHealthMetrics: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const driverId = resolveDriverId(ctx, input?.driverId);
      return {
        driverId,
        dotMedicalCard: {
          status: "valid",
          expirationDate: "2027-04-15",
          daysUntilExpiry: 401,
          examiner: "Dr. Patricia Wells",
          restrictions: [],
          nextExamDue: "2027-04-15",
        },
        fitness: {
          bmi: 28.4,
          bmiCategory: "overweight",
          bloodPressure: "128/82",
          bloodPressureCategory: "elevated",
          restingHeartRate: 76,
          sleepApneaScreening: "negative",
          diabetesScreening: "normal",
          lastPhysicalDate: "2025-10-15",
        },
        weeklyActivity: {
          stepsAverage: 4200,
          activeMinutes: 22,
          sedentaryHours: 11.5,
          waterIntakeOz: 48,
        },
        recommendations: [
          "Increase daily steps to 6,000+ by walking during breaks",
          "Monitor blood pressure weekly — borderline elevated",
          "Consider reducing sodium intake to manage BP",
          "Add 15 minutes of stretching before and after driving shifts",
        ],
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // ERGONOMIC RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════
  getErgonomicRecommendations: protectedProcedure
    .query(() => {
      return {
        seatAdjustment: [
          { tip: "Set seat height so thighs are parallel to the floor", priority: "high" },
          { tip: "Position lumbar support at the natural curve of your lower back", priority: "high" },
          { tip: "Adjust seat distance so you can fully depress pedals without stretching", priority: "medium" },
          { tip: "Keep the headrest centered behind your head, not your neck", priority: "medium" },
        ],
        mirrorSetup: [
          { tip: "Adjust side mirrors to minimize blind spots using the BGE method", priority: "high" },
          { tip: "Position convex mirrors to cover areas immediately beside the trailer", priority: "high" },
        ],
        steeringWheel: [
          { tip: "Set steering wheel at chest height with slight elbow bend", priority: "high" },
          { tip: "Use 9-and-3 hand position to reduce shoulder strain", priority: "medium" },
        ],
        breakRoutine: [
          { tip: "Take a 5-minute stretching break every 2 hours", priority: "high" },
          { tip: "Perform neck rolls and shoulder shrugs during stops", priority: "medium" },
          { tip: "Walk briskly for 10 minutes during meal breaks", priority: "medium" },
          { tip: "Do calf raises and squats to improve circulation", priority: "low" },
        ],
        equipmentRecommendations: [
          { item: "Gel Seat Cushion", description: "Reduces pressure points during long drives", estimatedCost: "$45-80", benefit: "Reduces lower back pain by up to 40%" },
          { item: "Lumbar Support Pillow", description: "Memory foam support for lower back", estimatedCost: "$25-50", benefit: "Maintains spinal alignment" },
          { item: "Anti-Vibration Gloves", description: "Reduces steering wheel vibration transfer", estimatedCost: "$20-35", benefit: "Reduces hand fatigue and numbness" },
          { item: "Blue Light Blocking Glasses", description: "Reduces eye strain from dashboard screens", estimatedCost: "$15-30", benefit: "Reduces eye fatigue on night runs" },
        ],
      };
    }),
});
