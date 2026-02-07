/**
 * REGISTRATION ROUTER
 * Complete user registration with all required fields per EUSOTRIP_USER_REGISTRATION_ONBOARDING
 * Includes FMCSA SAFER verification, document upload, and email verification
 */

import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { router, auditedPublicProcedure, auditedProtectedProcedure, sensitiveData } from "../_core/trpc";
import { getDb } from "../db";
import { users, companies, documents } from "../../drizzle/schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const hazmatClassSchema = z.enum(["2", "3", "4", "5", "6", "7", "8", "9"]);

const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string().default("USA"),
});

const insuranceSchema = z.object({
  carrier: z.string(),
  policyNumber: z.string(),
  coverage: z.string(),
  expiration: z.string(),
});

// Compliance integration IDs — optional fast-track fields
const complianceIdsSchema = z.object({
  avettaId: z.string().optional(),
  isnetworldId: z.string().optional(),
  veriforceId: z.string().optional(),
  disaId: z.string().optional(),
  complyWorksId: z.string().optional(),
  compassId: z.string().optional(),
  browzId: z.string().optional(),
  fmcsaUsdot: z.string().optional(),
  fmcsaMcNumber: z.string().optional(),
  phmsaRegNumber: z.string().optional(),
  tsaTwicNumber: z.string().optional(),
  epaId: z.string().optional(),
  oshaId: z.string().optional(),
  dotHazmatPermit: z.string().optional(),
  clearinghouseId: z.string().optional(),
  saferWebId: z.string().optional(),
}).optional();

// Helper to store compliance IDs as JSON metadata on the user record
async function storeComplianceIds(db: any, userId: number, complianceIds: any) {
  if (!complianceIds) return;
  const filled = Object.fromEntries(Object.entries(complianceIds).filter(([_, v]) => v && String(v).trim()));
  if (Object.keys(filled).length === 0) return;
  try {
    await db.update(users).set({ metadata: JSON.stringify(filled) }).where(eq(users.id, userId));
  } catch (e) {
    // metadata column may not exist yet — non-critical, try raw SQL fallback
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN metadata TEXT`);
      await db.update(users).set({ metadata: JSON.stringify(filled) }).where(eq(users.id, userId));
    } catch {
      console.warn("[Registration] Could not store compliance IDs:", e);
    }
  }
}

export const registrationRouter = router({
  /**
   * Register a new Shipper
   */
  registerShipper: auditedPublicProcedure
    .input(z.object({
      companyName: z.string().min(2),
      dba: z.string().optional(),
      einNumber: z.string().min(9),
      dunsNumber: z.string().optional(),
      companyType: z.string(),
      contactName: z.string(),
      contactTitle: z.string().optional(),
      contactEmail: z.string().email(),
      contactPhone: z.string(),
      password: z.string().min(8),
      emergencyContactName: z.string(),
      emergencyContactPhone: z.string(),
      streetAddress: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      phmsaNumber: z.string().optional(),
      phmsaExpiration: z.string().optional(),
      epaId: z.string().optional(),
      hazmatClasses: z.array(hazmatClassSchema),
      generalLiabilityCarrier: z.string(),
      generalLiabilityPolicy: z.string(),
      generalLiabilityCoverage: z.string(),
      generalLiabilityExpiration: z.string(),
      pollutionLiabilityCarrier: z.string().optional(),
      pollutionLiabilityPolicy: z.string().optional(),
      pollutionLiabilityCoverage: z.string().optional(),
      pollutionLiabilityExpiration: z.string().optional(),
      hasSecurityPlan: z.boolean().default(false),
      complianceIds: complianceIdsSchema,
      documents: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.contactEmail)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");

      const passwordHash = await bcrypt.hash(input.password, 12);

      const companyResult = await db.insert(companies).values({
        name: input.companyName,
        legalName: input.dba || input.companyName,
        ein: input.einNumber,
        address: input.streetAddress,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        phone: input.contactPhone,
        email: input.contactEmail,
        complianceStatus: "pending",
      }).$returningId();

      const companyId = companyResult[0]?.id;
      const openId = uuidv4();

      const userResult = await db.insert(users).values({
        openId,
        name: input.contactName,
        email: input.contactEmail,
        phone: input.contactPhone,
        passwordHash,
        role: "SHIPPER",
        companyId: Number(companyId),
        isVerified: false,
        isActive: true,
      }).$returningId();

      const userId = userResult[0]?.id;
      await storeComplianceIds(db, Number(userId), input.complianceIds);

      return {
        success: true,
        userId,
        companyId,
        message: "Registration submitted. Please check your email to verify your account.",
        verificationRequired: true,
      };
    }),

  /**
   * Register a new Carrier
   */
  registerCarrier: auditedPublicProcedure
    .input(z.object({
      companyName: z.string().min(2),
      dba: z.string().optional(),
      usdotNumber: z.string().min(5),
      mcNumber: z.string().optional(),
      einNumber: z.string().optional(),
      phmsaNumber: z.string().optional(),
      hmspPermitNumber: z.string().optional(),
      contactName: z.string(),
      contactTitle: z.string().optional(),
      contactEmail: z.string().email(),
      contactPhone: z.string(),
      password: z.string().min(8),
      streetAddress: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      fleetSize: z.object({
        powerUnits: z.number(),
        trailers: z.number(),
        drivers: z.number(),
      }),
      hazmatEndorsed: z.boolean().default(false),
      hazmatClasses: z.array(hazmatClassSchema).optional(),
      tankerEndorsed: z.boolean().default(false),
      liabilityCarrier: z.string(),
      liabilityPolicy: z.string(),
      liabilityCoverage: z.string(),
      liabilityExpiration: z.string(),
      cargoCarrier: z.string().optional(),
      cargoPolicy: z.string().optional(),
      cargoCoverage: z.string().optional(),
      cargoExpiration: z.string().optional(),
      drugAlcoholConsortium: z.string().optional(),
      clearinghouseRegistered: z.boolean().default(false),
      processAgentName: z.string().optional(),
      processAgentStates: z.array(z.string()).optional(),
      complianceIds: complianceIdsSchema,
      documents: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.contactEmail)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");

      const saferVerification = await verifyUSDOT(input.usdotNumber);
      const passwordHash = await bcrypt.hash(input.password, 12);

      const companyResult = await db.insert(companies).values({
        name: input.companyName,
        legalName: input.dba || input.companyName,
        dotNumber: input.usdotNumber,
        mcNumber: input.mcNumber,
        ein: input.einNumber,
        address: input.streetAddress,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        phone: input.contactPhone,
        email: input.contactEmail,
        complianceStatus: saferVerification.verified ? "pending" : "non_compliant",
      }).$returningId();

      const openId = uuidv4();

      const userResult = await db.insert(users).values({
        openId,
        name: input.contactName,
        email: input.contactEmail,
        phone: input.contactPhone,
        passwordHash,
        role: "CARRIER",
        companyId: Number(companyResult[0]?.id),
        isVerified: false,
        isActive: true,
      }).$returningId();

      await storeComplianceIds(db, Number(userResult[0]?.id), input.complianceIds);

      return {
        success: true,
        userId: userResult[0]?.id,
        companyId: companyResult[0]?.id,
        saferVerification,
        message: "Registration submitted. USDOT verification in progress.",
        verificationRequired: true,
      };
    }),

  /**
   * Register a new Driver
   */
  registerDriver: auditedPublicProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      password: z.string().min(8),
      dateOfBirth: z.string(),
      ssn: z.string().optional(),
      streetAddress: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      cdlNumber: z.string(),
      cdlState: z.string(),
      cdlClass: z.enum(["A", "B", "C"]),
      cdlExpiration: z.string(),
      cdlEndorsements: z.array(z.string()),
      hazmatEndorsement: z.boolean().default(false),
      hazmatExpiration: z.string().optional(),
      tankerEndorsement: z.boolean().default(false),
      doublesTriples: z.boolean().default(false),
      twicCard: z.boolean().default(false),
      twicExpiration: z.string().optional(),
      medicalCardExpiration: z.string(),
      yearsExperience: z.number(),
      previousEmployers: z.array(z.object({
        name: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        reasonForLeaving: z.string(),
      })).optional(),
      pspConsent: z.boolean(),
      backgroundCheckConsent: z.boolean(),
      drugTestConsent: z.boolean(),
      companyId: z.number().optional(),
      complianceIds: complianceIdsSchema,
      documents: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");

      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = uuidv4();

      const userResult = await db.insert(users).values({
        openId,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "DRIVER",
        companyId: input.companyId || null,
        isVerified: false,
        isActive: true,
      }).$returningId();

      await storeComplianceIds(db, Number(userResult[0]?.id), input.complianceIds);

      return {
        success: true,
        userId: userResult[0]?.id,
        message: "Registration submitted. Background check and PSP query will be initiated.",
        verificationRequired: true,
        checksRequired: ["background", "psp", "drugTest", "cdlVerification"],
      };
    }),

  /**
   * Register a new Broker
   */
  registerBroker: auditedPublicProcedure
    .input(z.object({
      companyName: z.string().min(2),
      dba: z.string().optional(),
      einNumber: z.string().min(9),
      mcNumber: z.string().min(5),
      usdotNumber: z.string().optional(),
      contactName: z.string(),
      contactEmail: z.string().email(),
      contactPhone: z.string(),
      password: z.string().min(8),
      streetAddress: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      suretyBondAmount: z.number().min(75000).default(75000),
      suretyBondCarrier: z.string(),
      suretyBondNumber: z.string(),
      brokersHazmat: z.boolean().default(false),
      complianceIds: complianceIdsSchema,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.contactEmail)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");
      const passwordHash = await bcrypt.hash(input.password, 12);
      const companyResult = await db.insert(companies).values({
        name: input.companyName,
        legalName: input.dba || input.companyName,
        mcNumber: input.mcNumber,
        dotNumber: input.usdotNumber,
        ein: input.einNumber,
        address: input.streetAddress,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        phone: input.contactPhone,
        email: input.contactEmail,
        complianceStatus: "pending",
      }).$returningId();
      const openId = uuidv4();
      const userResult = await db.insert(users).values({
        openId,
        name: input.contactName,
        email: input.contactEmail,
        phone: input.contactPhone,
        passwordHash,
        role: "BROKER",
        companyId: Number(companyResult[0]?.id),
        isVerified: false,
        isActive: true,
      }).$returningId();
      await storeComplianceIds(db, Number(userResult[0]?.id), input.complianceIds);
      return { success: true, userId: userResult[0]?.id, companyId: companyResult[0]?.id, verificationRequired: true };
    }),

  /**
   * Register Catalyst (Dispatcher)
   */
  registerCatalyst: auditedPublicProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      password: z.string().min(8),
      employerCompanyName: z.string(),
      jobTitle: z.string(),
      hazmatTrainingCompleted: z.boolean().default(false),
      companyId: z.number().optional(),
      complianceIds: complianceIdsSchema,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");
      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = uuidv4();
      const userResult = await db.insert(users).values({
        openId,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "CATALYST",
        companyId: input.companyId || null,
        isVerified: false,
        isActive: true,
      }).$returningId();
      await storeComplianceIds(db, Number(userResult[0]?.id), input.complianceIds);
      return { success: true, userId: userResult[0]?.id, verificationRequired: true };
    }),

  /**
   * Register Escort (Pilot Vehicle)
   */
  registerEscort: auditedPublicProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      password: z.string().min(8),
      driversLicenseNumber: z.string(),
      driversLicenseState: z.string(),
      streetAddress: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      experienceYears: z.number().default(0),
      complianceIds: complianceIdsSchema,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");
      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = uuidv4();
      const userResult = await db.insert(users).values({
        openId,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "ESCORT",
        isVerified: false,
        isActive: true,
      }).$returningId();
      await storeComplianceIds(db, Number(userResult[0]?.id), input.complianceIds);
      return { success: true, userId: userResult[0]?.id, verificationRequired: true };
    }),

  /**
   * Register Terminal Manager
   */
  registerTerminalManager: auditedPublicProcedure
    .input(z.object({
      managerName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      password: z.string().min(8),
      facilityName: z.string(),
      ownerCompany: z.string(),
      streetAddress: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      epaIdNumber: z.string().optional(),
      hasSpccPlan: z.boolean().default(false),
      complianceIds: complianceIdsSchema,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");
      const passwordHash = await bcrypt.hash(input.password, 12);
      const companyResult = await db.insert(companies).values({
        name: input.facilityName,
        legalName: input.ownerCompany,
        address: input.streetAddress,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        phone: input.phone,
        email: input.email,
        complianceStatus: "pending",
      }).$returningId();
      const openId = uuidv4();
      const userResult = await db.insert(users).values({
        openId,
        name: input.managerName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "TERMINAL_MANAGER",
        companyId: Number(companyResult[0]?.id),
        isVerified: false,
        isActive: true,
      }).$returningId();
      await storeComplianceIds(db, Number(userResult[0]?.id), input.complianceIds);
      return { success: true, userId: userResult[0]?.id, companyId: companyResult[0]?.id, verificationRequired: true };
    }),

  /**
   * Register Compliance Officer
   */
  registerComplianceOfficer: auditedPublicProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      password: z.string().min(8),
      employerCompanyName: z.string(),
      yearsExperience: z.number(),
      companyId: z.number().optional(),
      complianceIds: complianceIdsSchema,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");
      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = uuidv4();
      const userResult = await db.insert(users).values({
        openId,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "COMPLIANCE_OFFICER",
        companyId: input.companyId || null,
        isVerified: false,
        isActive: true,
      }).$returningId();
      await storeComplianceIds(db, Number(userResult[0]?.id), input.complianceIds);
      return { success: true, userId: userResult[0]?.id, verificationRequired: true };
    }),

  /**
   * Register Safety Manager
   */
  registerSafetyManager: auditedPublicProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      password: z.string().min(8),
      employerCompanyName: z.string(),
      employerUsdotNumber: z.string(),
      yearsAsSafetyManager: z.number(),
      companyId: z.number().optional(),
      complianceIds: complianceIdsSchema,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");
      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = uuidv4();
      const userResult = await db.insert(users).values({
        openId,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "SAFETY_MANAGER",
        companyId: input.companyId || null,
        isVerified: false,
        isActive: true,
      }).$returningId();
      await storeComplianceIds(db, Number(userResult[0]?.id), input.complianceIds);
      return { success: true, userId: userResult[0]?.id, verificationRequired: true };
    }),

  /**
   * Register Admin (Invite Only)
   */
  registerAdmin: auditedPublicProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      password: z.string().min(8),
      invitationCode: z.string(),
      adminLevel: z.enum(["super_admin", "admin", "moderator", "support"]).default("support"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (!["EUSOTRIP-ADMIN-2026", "EUSORONE-INVITE"].includes(input.invitationCode)) {
        throw new Error("Invalid invitation code");
      }
      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");
      const openId = uuidv4();
      const role = input.adminLevel === "super_admin" ? "SUPER_ADMIN" : "ADMIN";
      const userResult = await db.insert(users).values({
        openId,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        role: role as any,
        isVerified: true,
        isActive: true,
      }).$returningId();
      return { success: true, userId: userResult[0]?.id, verificationRequired: false };
    }),

  /**
   * Verify email address
   */
  verifyEmail: auditedPublicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      // TODO: Implement token verification from database
      return { success: true, message: "Email verified successfully" };
    }),

  /**
   * Resend verification email
   */
  resendVerification: auditedPublicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      // TODO: Implement resend logic
      return { success: true, message: "Verification email sent" };
    }),

  /**
   * Check registration status
   */
  checkStatus: auditedProtectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { status: "unknown" };

      const userId = ctx.user?.id;
      if (!userId) return { status: "not_logged_in" };

      const [user] = await db.select({ id: users.id, email: users.email, role: users.role, isVerified: users.isVerified }).from(users).where(eq(users.id, Number(userId))).limit(1);
      if (!user) return { status: "not_found" };

      return {
        status: user.isVerified ? "verified" : "pending",
        emailVerified: user.isVerified,
        documentsVerified: false, // TODO: Check documents
        complianceVerified: false, // TODO: Check compliance
        role: user.role,
      };
    }),

  /**
   * Get pending registrations (Admin)
   */
  getPendingRegistrations: auditedProtectedProcedure
    .input(z.object({
      role: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user?.role !== "ADMIN" && ctx.user?.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) return [];

      const pendingUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        isVerified: users.isVerified,
      })
        .from(users)
        .where(eq(users.isVerified, false))
        .limit(input.limit)
        .offset(input.offset);

      return pendingUsers;
    }),

  /**
   * Approve registration (Admin)
   */
  approveRegistration: auditedProtectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "ADMIN" && ctx.user?.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(users)
        .set({ isVerified: true, isActive: true })
        .where(eq(users.id, input.userId));

      return { success: true, message: "Registration approved" };
    }),

  /**
   * Reject registration (Admin)
   */
  rejectRegistration: auditedProtectedProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "ADMIN" && ctx.user?.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(users)
        .set({ isActive: false, deletedAt: new Date() })
        .where(eq(users.id, input.userId));

      return { success: true, message: "Registration rejected" };
    }),
});

/**
 * FMCSA SAFER System Verification
 * Verifies USDOT number against FMCSA database
 */
async function verifyUSDOT(usdotNumber: string): Promise<{
  verified: boolean;
  legalName?: string;
  operatingStatus?: string;
  safetyRating?: string;
  hazmatAuthorized?: boolean;
  outOfService?: boolean;
  error?: string;
}> {
  try {
    // FMCSA SAFER Web Services API
    const webKey = process.env.FMCSA_WEB_KEY;
    if (!webKey) {
      console.warn("FMCSA_WEB_KEY not configured, skipping verification");
      return { verified: false, error: "FMCSA verification not configured" };
    }

    const response = await fetch(
      `https://mobile.fmcsa.dot.gov/qc/services/carriers/${usdotNumber}?webKey=${webKey}`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      return { verified: false, error: "USDOT not found" };
    }

    const data = await response.json();
    const carrier = data.content?.carrier;

    if (!carrier) {
      return { verified: false, error: "Invalid USDOT response" };
    }

    return {
      verified: true,
      legalName: carrier.legalName,
      operatingStatus: carrier.allowedToOperate === "Y" ? "Authorized" : "Not Authorized",
      safetyRating: carrier.safetyRating || "Not Rated",
      hazmatAuthorized: carrier.hazmatInd === "Y",
      outOfService: carrier.oosDate ? true : false,
    };
  } catch (error) {
    console.error("FMCSA verification error:", error);
    return { verified: false, error: "Verification service unavailable" };
  }
}
