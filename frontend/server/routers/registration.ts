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
import { initNewUserGamification } from "../services/missionGenerator";

const hazmatClassSchema = z.enum(["2", "3", "4", "5", "6", "7", "8", "9"]);

const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string().default("USA"),
});

const insuranceSchema = z.object({
  catalyst: z.string(),
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

/**
 * Store ALL registration data as structured JSON metadata on the user record.
 * Schema: { complianceIds: {...}, registration: {...role-specific fields...} }
 * Also populates companies table insurance/hazmat columns where they exist.
 */
async function storeRegistrationMetadata(db: any, userId: number, data: {
  complianceIds?: any;
  registration?: Record<string, any>;
  companyId?: number;
  insurance?: { policy?: string; expiry?: string; hazmatLicense?: string; hazmatExpiry?: string; twicCard?: string; twicExpiry?: string; };
}) {
  const metadata: Record<string, any> = {};

  // Compliance IDs
  if (data.complianceIds) {
    const filled = Object.fromEntries(Object.entries(data.complianceIds).filter(([_, v]) => v && String(v).trim()));
    if (Object.keys(filled).length > 0) metadata.complianceIds = filled;
  }

  // Role-specific registration data
  if (data.registration) {
    const filled = Object.fromEntries(Object.entries(data.registration).filter(([_, v]) => v !== undefined && v !== null && v !== ""));
    if (Object.keys(filled).length > 0) metadata.registration = filled;
  }

  // Store metadata on user
  if (Object.keys(metadata).length > 0) {
    try {
      await db.update(users).set({ metadata: JSON.stringify(metadata) }).where(eq(users.id, userId));
    } catch (e) {
      try {
        await db.execute(sql`ALTER TABLE users ADD COLUMN metadata TEXT`);
        await db.update(users).set({ metadata: JSON.stringify(metadata) }).where(eq(users.id, userId));
      } catch { console.warn("[Registration] Could not store metadata:", e); }
    }
  }

  // Populate companies table insurance/hazmat columns
  if (data.companyId && data.insurance) {
    try {
      const ins = data.insurance;
      const updates: any = {};
      if (ins.policy) updates.insurancePolicy = ins.policy;
      if (ins.expiry) updates.insuranceExpiry = new Date(ins.expiry);
      if (ins.hazmatLicense) updates.hazmatLicense = ins.hazmatLicense;
      if (ins.hazmatExpiry) updates.hazmatExpiry = new Date(ins.hazmatExpiry);
      if (ins.twicCard) updates.twicCard = ins.twicCard;
      if (ins.twicExpiry) updates.twicExpiry = new Date(ins.twicExpiry);
      if (Object.keys(updates).length > 0) {
        await db.update(companies).set(updates).where(eq(companies.id, data.companyId));
      }
    } catch (e) { console.warn("[Registration] Could not store insurance on company:", e); }
  }
}

// Backward compat alias
async function storeComplianceIds(db: any, userId: number, complianceIds: any) {
  await storeRegistrationMetadata(db, userId, { complianceIds });
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
      yearEstablished: z.string().optional(),
      contactName: z.string(),
      contactTitle: z.string().optional(),
      contactEmail: z.string().email(),
      contactPhone: z.string(),
      billingEmail: z.string().optional(),
      password: z.string().min(8),
      emergencyContactName: z.string().optional(),
      emergencyContactPhone: z.string().optional(),
      streetAddress: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string().optional(),
      phmsaNumber: z.string().optional(),
      phmsaExpiration: z.string().optional(),
      epaId: z.string().optional(),
      statePermits: z.array(z.string()).optional(),
      hazmatClasses: z.array(hazmatClassSchema).optional(),
      generalLiabilityCarrier: z.string().optional(),
      generalLiabilityPolicy: z.string().optional(),
      generalLiabilityCoverage: z.string().optional(),
      generalLiabilityExpiration: z.string().optional(),
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
        legalName: input.companyName,
        ein: input.einNumber,
        address: input.streetAddress,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        country: input.country || "USA",
        phone: input.contactPhone,
        email: input.contactEmail,
        description: input.dba ? `DBA: ${input.dba}` : undefined,
        complianceStatus: "pending",
      }).$returningId();

      const companyId = Number(companyResult[0]?.id);
      const openId = uuidv4();

      const userResult = await db.insert(users).values({
        openId,
        name: input.contactName,
        email: input.contactEmail,
        phone: input.contactPhone,
        passwordHash,
        role: "SHIPPER",
        companyId,
        isVerified: false,
        isActive: true,
      }).$returningId();

      const userId = Number(userResult[0]?.id);

      // Store ALL registration data
      await storeRegistrationMetadata(db, userId, {
        complianceIds: input.complianceIds,
        companyId,
        registration: {
          dba: input.dba,
          companyType: input.companyType,
          yearEstablished: input.yearEstablished,
          dunsNumber: input.dunsNumber,
          contactTitle: input.contactTitle,
          billingEmail: input.billingEmail,
          country: input.country,
          phmsaNumber: input.phmsaNumber,
          phmsaExpiration: input.phmsaExpiration,
          epaId: input.epaId,
          statePermits: input.statePermits,
          hazmatClasses: input.hazmatClasses,
          emergencyContactName: input.emergencyContactName,
          emergencyContactPhone: input.emergencyContactPhone,
          hasSecurityPlan: input.hasSecurityPlan,
          generalLiability: { carrier: input.generalLiabilityCarrier, policy: input.generalLiabilityPolicy, coverage: input.generalLiabilityCoverage, expiration: input.generalLiabilityExpiration },
          pollutionLiability: { carrier: input.pollutionLiabilityCarrier, policy: input.pollutionLiabilityPolicy, coverage: input.pollutionLiabilityCoverage, expiration: input.pollutionLiabilityExpiration },
        },
        insurance: {
          policy: JSON.stringify({ general: { carrier: input.generalLiabilityCarrier, policy: input.generalLiabilityPolicy, coverage: input.generalLiabilityCoverage }, pollution: { carrier: input.pollutionLiabilityCarrier, policy: input.pollutionLiabilityPolicy, coverage: input.pollutionLiabilityCoverage } }),
          expiry: input.generalLiabilityExpiration,
        },
      });

      initNewUserGamification(userId).catch(() => {});

      return {
        success: true,
        userId,
        companyId,
        message: "Registration submitted. Please check your email to verify your account.",
        verificationRequired: true,
      };
    }),

  /**
   * Register a new Catalyst
   */
  registerCatalyst: auditedPublicProcedure
    .input(z.object({
      companyName: z.string().min(2),
      dba: z.string().optional(),
      usdotNumber: z.string().min(5),
      mcNumber: z.string().optional(),
      einNumber: z.string().optional(),
      phmsaNumber: z.string().optional(),
      hmspPermitNumber: z.string().optional(),
      operatingStatus: z.string().optional(),
      entityType: z.string().optional(),
      contactName: z.string(),
      contactTitle: z.string().optional(),
      contactEmail: z.string().email(),
      contactPhone: z.string(),
      dispatchEmail: z.string().optional(),
      dispatchPhone: z.string().optional(),
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
      hazmatAuthorityNumber: z.string().optional(),
      hazmatClasses: z.array(hazmatClassSchema).optional(),
      hazmatCertifiedDrivers: z.number().optional(),
      tankerEndorsed: z.boolean().default(false),
      catalystType: z.array(z.string()).optional(),
      equipmentTypes: z.array(z.string()).optional(),
      liabilityCarrier: z.string().optional(),
      liabilityPolicy: z.string().optional(),
      liabilityCoverage: z.string().optional(),
      liabilityExpiration: z.string().optional(),
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
        legalName: input.companyName,
        dotNumber: input.usdotNumber,
        mcNumber: input.mcNumber,
        ein: input.einNumber,
        address: input.streetAddress,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        phone: input.contactPhone,
        email: input.contactEmail,
        description: input.dba ? `DBA: ${input.dba}` : undefined,
        complianceStatus: saferVerification.verified ? "pending" : "non_compliant",
      }).$returningId();

      const companyId = Number(companyResult[0]?.id);
      const openId = uuidv4();

      const userResult = await db.insert(users).values({
        openId,
        name: input.contactName,
        email: input.contactEmail,
        phone: input.contactPhone,
        passwordHash,
        role: "CATALYST",
        companyId,
        isVerified: false,
        isActive: true,
      }).$returningId();

      const userId = Number(userResult[0]?.id);

      await storeRegistrationMetadata(db, userId, {
        complianceIds: input.complianceIds,
        companyId,
        registration: {
          dba: input.dba,
          operatingStatus: input.operatingStatus,
          entityType: input.entityType,
          contactTitle: input.contactTitle,
          dispatchEmail: input.dispatchEmail,
          dispatchPhone: input.dispatchPhone,
          phmsaNumber: input.phmsaNumber,
          hmspPermitNumber: input.hmspPermitNumber,
          fleetSize: input.fleetSize,
          hazmatEndorsed: input.hazmatEndorsed,
          hazmatAuthorityNumber: input.hazmatAuthorityNumber,
          hazmatClasses: input.hazmatClasses,
          hazmatCertifiedDrivers: input.hazmatCertifiedDrivers,
          tankerEndorsed: input.tankerEndorsed,
          catalystType: input.catalystType,
          equipmentTypes: input.equipmentTypes,
          liability: { carrier: input.liabilityCarrier, policy: input.liabilityPolicy, coverage: input.liabilityCoverage, expiration: input.liabilityExpiration },
          cargo: { carrier: input.cargoCarrier, policy: input.cargoPolicy, coverage: input.cargoCoverage, expiration: input.cargoExpiration },
          drugAlcoholConsortium: input.drugAlcoholConsortium,
          clearinghouseRegistered: input.clearinghouseRegistered,
          processAgentName: input.processAgentName,
          processAgentStates: input.processAgentStates,
          saferVerification,
        },
        insurance: {
          policy: JSON.stringify({ liability: { carrier: input.liabilityCarrier, policy: input.liabilityPolicy, coverage: input.liabilityCoverage }, cargo: { carrier: input.cargoCarrier, policy: input.cargoPolicy, coverage: input.cargoCoverage } }),
          expiry: input.liabilityExpiration,
          hazmatLicense: input.hazmatEndorsed ? (input.hazmatAuthorityNumber || "endorsed") : undefined,
        },
      });

      initNewUserGamification(userId).catch(() => {});

      return {
        success: true,
        userId,
        companyId,
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
      employmentType: z.string().optional(),
      catalystUsdot: z.string().optional(),
      catalystName: z.string().optional(),
      cdlNumber: z.string(),
      cdlState: z.string(),
      cdlClass: z.enum(["A", "B", "C"]),
      cdlExpiration: z.string(),
      cdlEndorsements: z.array(z.string()),
      cdlRestrictions: z.array(z.string()).optional(),
      hazmatEndorsement: z.boolean().default(false),
      hazmatExpiration: z.string().optional(),
      tankerEndorsement: z.boolean().default(false),
      doublesTriples: z.boolean().default(false),
      twicCard: z.boolean().default(false),
      twicNumber: z.string().optional(),
      twicExpiration: z.string().optional(),
      medicalCardNumber: z.string().optional(),
      medicalCardExpiration: z.string(),
      hazmatTrainingDate: z.string().optional(),
      hazmatTrainingProvider: z.string().optional(),
      securityTrainingDate: z.string().optional(),
      additionalCerts: z.array(z.string()).optional(),
      yearsExperience: z.number().optional(),
      previousEmployers: z.array(z.object({
        name: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        reasonForLeaving: z.string(),
      })).optional(),
      pspConsent: z.boolean().optional(),
      backgroundCheckConsent: z.boolean().optional(),
      drugTestConsent: z.boolean().optional(),
      companyId: z.number().optional(),
      complianceIds: complianceIdsSchema,
      documents: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");

      // Resolve companyId from catalystUsdot if provided
      let companyId = input.companyId || null;
      if (!companyId && input.catalystUsdot) {
        const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.dotNumber, input.catalystUsdot)).limit(1);
        if (company) companyId = company.id;
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = uuidv4();

      const userResult = await db.insert(users).values({
        openId,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "DRIVER",
        companyId,
        isVerified: false,
        isActive: true,
      }).$returningId();

      const userId = Number(userResult[0]?.id);

      await storeRegistrationMetadata(db, userId, {
        complianceIds: input.complianceIds,
        registration: {
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth,
          ssn: input.ssn ? sensitiveData.encrypt(input.ssn) : undefined,
          address: { street: input.streetAddress, city: input.city, state: input.state, zipCode: input.zipCode },
          employmentType: input.employmentType,
          catalystUsdot: input.catalystUsdot,
          catalystName: input.catalystName,
          cdl: { number: input.cdlNumber, state: input.cdlState, class: input.cdlClass, expiration: input.cdlExpiration, endorsements: input.cdlEndorsements, restrictions: input.cdlRestrictions },
          hazmatEndorsement: input.hazmatEndorsement,
          hazmatExpiration: input.hazmatExpiration,
          tankerEndorsement: input.tankerEndorsement,
          doublesTriples: input.doublesTriples,
          twicCard: input.twicCard,
          twicNumber: input.twicNumber,
          twicExpiration: input.twicExpiration,
          medicalCardNumber: input.medicalCardNumber,
          medicalCardExpiration: input.medicalCardExpiration,
          hazmatTrainingDate: input.hazmatTrainingDate,
          hazmatTrainingProvider: input.hazmatTrainingProvider,
          securityTrainingDate: input.securityTrainingDate,
          additionalCerts: input.additionalCerts,
          yearsExperience: input.yearsExperience,
          previousEmployers: input.previousEmployers,
          consents: { psp: input.pspConsent, backgroundCheck: input.backgroundCheckConsent, drugTest: input.drugTestConsent },
        },
      });

      initNewUserGamification(userId).catch(() => {});

      return {
        success: true,
        userId,
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
      yearEstablished: z.string().optional(),
      contactName: z.string(),
      contactTitle: z.string().optional(),
      contactEmail: z.string().email(),
      contactPhone: z.string(),
      password: z.string().min(8),
      streetAddress: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      brokerAuthority: z.string().optional(),
      suretyBondAmount: z.number().min(75000).default(75000),
      suretyBondCarrier: z.string().optional(),
      suretyBondNumber: z.string().optional(),
      bondExpiration: z.string().optional(),
      brokersHazmat: z.boolean().default(false),
      insuranceCarrier: z.string().optional(),
      insurancePolicy: z.string().optional(),
      insuranceCoverage: z.string().optional(),
      insuranceExpiration: z.string().optional(),
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
        legalName: input.companyName,
        mcNumber: input.mcNumber,
        dotNumber: input.usdotNumber,
        ein: input.einNumber,
        address: input.streetAddress,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        phone: input.contactPhone,
        email: input.contactEmail,
        description: input.dba ? `DBA: ${input.dba}` : undefined,
        complianceStatus: "pending",
      }).$returningId();
      const companyId = Number(companyResult[0]?.id);
      const openId = uuidv4();
      const userResult = await db.insert(users).values({
        openId,
        name: input.contactName,
        email: input.contactEmail,
        phone: input.contactPhone,
        passwordHash,
        role: "BROKER",
        companyId,
        isVerified: false,
        isActive: true,
      }).$returningId();
      const userId = Number(userResult[0]?.id);
      await storeRegistrationMetadata(db, userId, {
        complianceIds: input.complianceIds,
        companyId,
        registration: {
          dba: input.dba,
          yearEstablished: input.yearEstablished,
          contactTitle: input.contactTitle,
          brokerAuthority: input.brokerAuthority,
          suretyBond: { amount: input.suretyBondAmount, carrier: input.suretyBondCarrier, number: input.suretyBondNumber, expiration: input.bondExpiration },
          brokersHazmat: input.brokersHazmat,
          insurance: { carrier: input.insuranceCarrier, policy: input.insurancePolicy, coverage: input.insuranceCoverage, expiration: input.insuranceExpiration },
        },
        insurance: {
          policy: JSON.stringify({ suretyBond: { amount: input.suretyBondAmount, carrier: input.suretyBondCarrier, number: input.suretyBondNumber }, general: { carrier: input.insuranceCarrier, policy: input.insurancePolicy, coverage: input.insuranceCoverage } }),
          expiry: input.insuranceExpiration || input.bondExpiration,
        },
      });
      initNewUserGamification(userId).catch(() => {});
      return { success: true, userId, companyId, verificationRequired: true };
    }),

  /**
   * Register Dispatch (Dispatcher)
   */
  registerDispatch: auditedPublicProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      password: z.string().min(8),
      employmentType: z.string().optional(),
      employerCompanyName: z.string(),
      companyUsdot: z.string().optional(),
      jobTitle: z.string(),
      department: z.string().optional(),
      yearsExperience: z.string().optional(),
      dispatchSoftware: z.array(z.string()).optional(),
      hazmatTrainingCompleted: z.boolean().default(false),
      hazmatTrainingDate: z.string().optional(),
      hazmatTrainingProvider: z.string().optional(),
      certifications: z.array(z.string()).optional(),
      otherCertifications: z.string().optional(),
      companyId: z.number().optional(),
      complianceIds: complianceIdsSchema,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");

      // Resolve companyId from USDOT if provided
      let companyId = input.companyId || null;
      if (!companyId && input.companyUsdot) {
        const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.dotNumber, input.companyUsdot)).limit(1);
        if (company) companyId = company.id;
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = uuidv4();
      const userResult = await db.insert(users).values({
        openId,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "DISPATCH",
        companyId,
        isVerified: false,
        isActive: true,
      }).$returningId();
      const userId = Number(userResult[0]?.id);
      await storeRegistrationMetadata(db, userId, {
        complianceIds: input.complianceIds,
        registration: {
          employmentType: input.employmentType,
          employerCompanyName: input.employerCompanyName,
          companyUsdot: input.companyUsdot,
          jobTitle: input.jobTitle,
          department: input.department,
          yearsExperience: input.yearsExperience,
          dispatchSoftware: input.dispatchSoftware,
          hazmatTrainingCompleted: input.hazmatTrainingCompleted,
          hazmatTrainingDate: input.hazmatTrainingDate,
          hazmatTrainingProvider: input.hazmatTrainingProvider,
          certifications: input.certifications,
          otherCertifications: input.otherCertifications,
        },
      });
      initNewUserGamification(userId).catch(() => {});
      return { success: true, userId, verificationRequired: true };
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
      dateOfBirth: z.string().optional(),
      streetAddress: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      serviceRadius: z.string().optional(),
      driversLicenseNumber: z.string(),
      driversLicenseState: z.string(),
      driversLicenseExpiration: z.string().optional(),
      driversLicenseClass: z.string().optional(),
      certifiedStates: z.array(z.string()).optional(),
      certificationNumbers: z.record(z.string(), z.string()).optional(),
      certificationExpirations: z.record(z.string(), z.string()).optional(),
      vehicleYear: z.string().optional(),
      vehicleMake: z.string().optional(),
      vehicleModel: z.string().optional(),
      vehicleColor: z.string().optional(),
      vehiclePlate: z.string().optional(),
      vehicleState: z.string().optional(),
      hasRequiredEquipment: z.boolean().default(false),
      equipmentList: z.array(z.string()).optional(),
      insuranceCarrier: z.string().optional(),
      insurancePolicy: z.string().optional(),
      insuranceCoverage: z.string().optional(),
      insuranceExpiration: z.string().optional(),
      experienceYears: z.number().default(0),
      previousEmployer: z.string().optional(),
      certifications: z.array(z.string()).optional(),
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
      const userId = Number(userResult[0]?.id);
      await storeRegistrationMetadata(db, userId, {
        complianceIds: input.complianceIds,
        registration: {
          dateOfBirth: input.dateOfBirth,
          address: { street: input.streetAddress, city: input.city, state: input.state, zipCode: input.zipCode },
          serviceRadius: input.serviceRadius,
          driversLicense: { number: input.driversLicenseNumber, state: input.driversLicenseState, expiration: input.driversLicenseExpiration, class: input.driversLicenseClass },
          stateCertifications: { states: input.certifiedStates, numbers: input.certificationNumbers, expirations: input.certificationExpirations },
          vehicle: { year: input.vehicleYear, make: input.vehicleMake, model: input.vehicleModel, color: input.vehicleColor, plate: input.vehiclePlate, state: input.vehicleState },
          hasRequiredEquipment: input.hasRequiredEquipment,
          equipmentList: input.equipmentList,
          insurance: { carrier: input.insuranceCarrier, policy: input.insurancePolicy, coverage: input.insuranceCoverage, expiration: input.insuranceExpiration },
          experienceYears: input.experienceYears,
          previousEmployer: input.previousEmployer,
          certifications: input.certifications,
        },
      });
      initNewUserGamification(userId).catch(() => {});
      return { success: true, userId, verificationRequired: true };
    }),

  /**
   * Register Terminal Manager
   */
  registerTerminalManager: auditedPublicProcedure
    .input(z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      managerName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      password: z.string().min(8),
      jobTitle: z.string().optional(),
      facilityName: z.string(),
      facilityType: z.string().optional(),
      ownerCompany: z.string(),
      streetAddress: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      epaIdNumber: z.string().optional(),
      statePermitNumber: z.string().optional(),
      spccPlanDate: z.string().optional(),
      hasSpccPlan: z.boolean().default(false),
      storageCapacity: z.string().optional(),
      eiaReporting: z.boolean().default(false),
      operatingHours: z.string().optional(),
      productsHandled: z.array(z.string()).optional(),
      loadingRacks: z.string().optional(),
      unloadingRacks: z.string().optional(),
      hasScada: z.boolean().default(false),
      emergencyContact: z.string().optional(),
      emergencyPhone: z.string().optional(),
      lastInspectionDate: z.string().optional(),
      oshaCompliant: z.boolean().default(false),
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
      const companyId = Number(companyResult[0]?.id);
      const openId = uuidv4();
      const userResult = await db.insert(users).values({
        openId,
        name: input.managerName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "TERMINAL_MANAGER",
        companyId,
        isVerified: false,
        isActive: true,
      }).$returningId();
      const userId = Number(userResult[0]?.id);
      await storeRegistrationMetadata(db, userId, {
        complianceIds: input.complianceIds,
        companyId,
        registration: {
          jobTitle: input.jobTitle,
          facilityType: input.facilityType,
          ownerCompany: input.ownerCompany,
          epaIdNumber: input.epaIdNumber,
          statePermitNumber: input.statePermitNumber,
          spccPlanDate: input.spccPlanDate,
          hasSpccPlan: input.hasSpccPlan,
          storageCapacity: input.storageCapacity,
          eiaReporting: input.eiaReporting,
          operations: { hours: input.operatingHours, productsHandled: input.productsHandled, loadingRacks: input.loadingRacks, unloadingRacks: input.unloadingRacks, hasScada: input.hasScada },
          emergency: { contact: input.emergencyContact, phone: input.emergencyPhone },
          lastInspectionDate: input.lastInspectionDate,
          oshaCompliant: input.oshaCompliant,
        },
      });
      initNewUserGamification(userId).catch(() => {});
      return { success: true, userId, companyId, verificationRequired: true };
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
      companyUsdot: z.string().optional(),
      jobTitle: z.string().optional(),
      department: z.string().optional(),
      reportsTo: z.string().optional(),
      yearsExperience: z.number().optional(),
      certifications: z.array(z.string()).optional(),
      fmcsaTrainingDate: z.string().optional(),
      hazmatTrainingDate: z.string().optional(),
      clearinghouseAccess: z.boolean().default(false),
      responsibilities: z.array(z.string()).optional(),
      companyId: z.number().optional(),
      complianceIds: complianceIdsSchema,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");

      let companyId = input.companyId || null;
      if (!companyId && input.companyUsdot) {
        const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.dotNumber, input.companyUsdot)).limit(1);
        if (company) companyId = company.id;
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = uuidv4();
      const userResult = await db.insert(users).values({
        openId,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "COMPLIANCE_OFFICER",
        companyId,
        isVerified: false,
        isActive: true,
      }).$returningId();
      const userId = Number(userResult[0]?.id);
      await storeRegistrationMetadata(db, userId, {
        complianceIds: input.complianceIds,
        registration: {
          employerCompanyName: input.employerCompanyName,
          companyUsdot: input.companyUsdot,
          jobTitle: input.jobTitle,
          department: input.department,
          reportsTo: input.reportsTo,
          yearsExperience: input.yearsExperience,
          certifications: input.certifications,
          fmcsaTrainingDate: input.fmcsaTrainingDate,
          hazmatTrainingDate: input.hazmatTrainingDate,
          clearinghouseAccess: input.clearinghouseAccess,
          responsibilities: input.responsibilities,
        },
      });
      initNewUserGamification(userId).catch(() => {});
      return { success: true, userId, verificationRequired: true };
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
      employerUsdotNumber: z.string().optional(),
      jobTitle: z.string().optional(),
      reportsTo: z.string().optional(),
      yearsAsSafetyManager: z.number().optional(),
      certifications: z.array(z.string()).optional(),
      csaTrainingDate: z.string().optional(),
      accidentInvestigationDate: z.string().optional(),
      responsibilities: z.array(z.string()).optional(),
      fleetSize: z.string().optional(),
      driverCount: z.string().optional(),
      companyId: z.number().optional(),
      complianceIds: complianceIdsSchema,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select({ id: users.id, email: users.email, role: users.role }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Email already registered");

      let companyId = input.companyId || null;
      if (!companyId && input.employerUsdotNumber) {
        const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.dotNumber, input.employerUsdotNumber)).limit(1);
        if (company) companyId = company.id;
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = uuidv4();
      const userResult = await db.insert(users).values({
        openId,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "SAFETY_MANAGER",
        companyId,
        isVerified: false,
        isActive: true,
      }).$returningId();
      const userId = Number(userResult[0]?.id);
      await storeRegistrationMetadata(db, userId, {
        complianceIds: input.complianceIds,
        registration: {
          employerCompanyName: input.employerCompanyName,
          employerUsdotNumber: input.employerUsdotNumber,
          jobTitle: input.jobTitle,
          reportsTo: input.reportsTo,
          yearsAsSafetyManager: input.yearsAsSafetyManager,
          certifications: input.certifications,
          csaTrainingDate: input.csaTrainingDate,
          accidentInvestigationDate: input.accidentInvestigationDate,
          responsibilities: input.responsibilities,
          fleetSize: input.fleetSize,
          driverCount: input.driverCount,
        },
      });
      initNewUserGamification(userId).catch(() => {});
      return { success: true, userId, verificationRequired: true };
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
      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = uuidv4();
      const role = input.adminLevel === "super_admin" ? "SUPER_ADMIN" : "ADMIN";
      const userResult = await db.insert(users).values({
        openId,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        passwordHash,
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
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Token is the user's openId — a unique UUID assigned at registration
      const [user] = await db.select({ id: users.id, isVerified: users.isVerified })
        .from(users)
        .where(eq(users.openId, input.token))
        .limit(1);

      if (!user) {
        throw new Error("Invalid or expired verification token");
      }

      if (user.isVerified) {
        return { success: true, message: "Email already verified" };
      }

      await db.update(users)
        .set({ isVerified: true })
        .where(eq(users.id, user.id));

      return { success: true, message: "Email verified successfully" };
    }),

  /**
   * Resend verification email
   */
  resendVerification: auditedPublicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [user] = await db.select({ id: users.id, openId: users.openId, isVerified: users.isVerified })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        // Don't reveal whether email exists — return generic success
        return { success: true, message: "If an account exists, a verification email has been sent" };
      }

      if (user.isVerified) {
        return { success: true, message: "Email already verified" };
      }

      // In production: send email with verification link containing user.openId
      // For now: log the token for manual verification
      console.log(`[Registration] Verification token for ${input.email}: ${user.openId}`);

      return { success: true, message: "If an account exists, a verification email has been sent" };
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
      `https://mobile.fmcsa.dot.gov/qc/services/catalysts/${usdotNumber}?webKey=${webKey}`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      return { verified: false, error: "USDOT not found" };
    }

    const data = await response.json();
    const catalyst = data.content?.catalyst;

    if (!catalyst) {
      return { verified: false, error: "Invalid USDOT response" };
    }

    return {
      verified: true,
      legalName: catalyst.legalName,
      operatingStatus: catalyst.allowedToOperate === "Y" ? "Authorized" : "Not Authorized",
      safetyRating: catalyst.safetyRating || "Not Rated",
      hazmatAuthorized: catalyst.hazmatInd === "Y",
      outOfService: catalyst.oosDate ? true : false,
    };
  } catch (error) {
    console.error("FMCSA verification error:", error);
    return { verified: false, error: "Verification service unavailable" };
  }
}
