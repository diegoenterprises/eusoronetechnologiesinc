/**
 * PRIVACY CLASSIFIER
 * Classifies data into L1 (Private), L2 (Organization), L3 (Relationship), L4 (Public)
 * as defined in EUSOTRIP_DATA_ISOLATION_ARCHITECTURE.md Section 1.
 *
 * Used by ownership verification and access-check services to determine
 * what level of authorization is required for a given resource.
 */

export enum PrivacyLevel {
  L1_PRIVATE = "L1_PRIVATE",           // Only the owning user
  L2_ORGANIZATION = "L2_ORGANIZATION", // Shared within a company/fleet
  L3_RELATIONSHIP = "L3_RELATIONSHIP", // Shared between transaction parties
  L4_PUBLIC = "L4_PUBLIC",             // Visible to all authenticated users
}

export interface DataClassification {
  level: PrivacyLevel;
  ownerField: string;       // DB column that holds the owner reference
  orgField?: string;        // DB column for organization ownership (L2)
  participantFields?: string[]; // DB columns for relationship participants (L3)
  description: string;
}

/**
 * Complete data classification map for every entity type in EusoTrip.
 * This is the single source of truth for "who can see what".
 */
export const DATA_CLASSIFICATIONS: Record<string, DataClassification> = {
  // ─── L1: PRIVATE (User-Only Access) ───────────────────────────────────────
  wallet: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "userId",
    description: "Wallet balance visible only to owner",
  },
  walletTransaction: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "userId",
    description: "Transaction history visible only to owner",
  },
  notification: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "userId",
    description: "Notifications visible only to recipient",
  },
  session: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "userId",
    description: "Sessions visible only to owner",
  },
  savedLoad: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "userId",
    description: "Saved/bookmarked loads visible only to user",
  },
  searchHistory: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "userId",
    description: "Search history visible only to user",
  },
  privacySetting: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "userId",
    description: "Privacy settings visible only to owner",
  },
  notificationPreference: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "userId",
    description: "Notification preferences visible only to owner",
  },
  paymentMethod: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "userId",
    description: "Payment methods visible only to owner",
  },
  bankAccount: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "userId",
    orgField: "companyId",
    description: "Bank accounts visible only to owner or company admin",
  },

  // ─── L2: ORGANIZATION (Company-Level Access) ─────────────────────────────
  vehicle: {
    level: PrivacyLevel.L2_ORGANIZATION,
    ownerField: "companyId",
    orgField: "companyId",
    description: "Vehicles visible to company members",
  },
  driver: {
    level: PrivacyLevel.L2_ORGANIZATION,
    ownerField: "companyId",
    orgField: "companyId",
    description: "Driver records visible to company members",
  },
  equipment: {
    level: PrivacyLevel.L2_ORGANIZATION,
    ownerField: "companyId",
    orgField: "companyId",
    description: "Equipment visible to company members",
  },
  companyDocument: {
    level: PrivacyLevel.L2_ORGANIZATION,
    ownerField: "companyId",
    orgField: "companyId",
    description: "Company documents visible to company members",
  },
  maintenanceRecord: {
    level: PrivacyLevel.L2_ORGANIZATION,
    ownerField: "companyId",
    orgField: "companyId",
    description: "Maintenance records visible to company members",
  },
  complianceRecord: {
    level: PrivacyLevel.L2_ORGANIZATION,
    ownerField: "companyId",
    orgField: "companyId",
    description: "Compliance records visible to company members",
  },

  // ─── L3: RELATIONSHIP (Transaction-Based Access) ─────────────────────────
  load: {
    level: PrivacyLevel.L3_RELATIONSHIP,
    ownerField: "shipperId",
    orgField: "shipperCompanyId",
    participantFields: ["shipperId", "carrierId", "driverId", "brokerId"],
    description: "Load details visible to shipper, carrier, driver, broker",
  },
  bid: {
    level: PrivacyLevel.L3_RELATIONSHIP,
    ownerField: "carrierId",
    participantFields: ["carrierId", "shipperId", "brokerId"],
    description: "Bids visible to carrier who submitted and shipper/broker",
  },
  invoice: {
    level: PrivacyLevel.L3_RELATIONSHIP,
    ownerField: "issuerId",
    participantFields: ["issuerId", "recipientId"],
    description: "Invoices visible to issuer and recipient",
  },
  agreement: {
    level: PrivacyLevel.L3_RELATIONSHIP,
    ownerField: "creatorId",
    participantFields: ["partyAId", "partyBId"],
    description: "Agreements visible to both signing parties",
  },
  rateConfirmation: {
    level: PrivacyLevel.L3_RELATIONSHIP,
    ownerField: "shipperId",
    participantFields: ["shipperId", "carrierId", "brokerId"],
    description: "Rate confirmations visible to participating parties",
  },

  // ─── L4: PUBLIC (Platform-Wide Access) ────────────────────────────────────
  postedLoad: {
    level: PrivacyLevel.L4_PUBLIC,
    ownerField: "shipperId",
    description: "Posted loads visible to all authenticated users on load board",
  },
  carrierProfile: {
    level: PrivacyLevel.L4_PUBLIC,
    ownerField: "userId",
    description: "Public carrier profile and ratings",
  },
  hotZone: {
    level: PrivacyLevel.L4_PUBLIC,
    ownerField: "system",
    description: "Aggregated anonymized market data",
  },
  marketRate: {
    level: PrivacyLevel.L4_PUBLIC,
    ownerField: "system",
    description: "Aggregated market rate data",
  },

  // ─── MESSAGES (Special: Participant-Based) ────────────────────────────────
  message: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "senderId",
    description: "Messages visible only to conversation participants",
  },
  conversation: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "participantUserIds",
    description: "Conversations visible only to participants",
  },

  // ─── DOCUMENTS (Owner-Based) ──────────────────────────────────────────────
  userDocument: {
    level: PrivacyLevel.L1_PRIVATE,
    ownerField: "userId",
    description: "Personal documents visible only to owner",
  },

  // ─── GPS / LOCATION (Relationship + Role Based) ──────────────────────────
  gpsBreadcrumb: {
    level: PrivacyLevel.L3_RELATIONSHIP,
    ownerField: "driverId",
    orgField: "companyId",
    participantFields: ["driverId"],
    description: "GPS breadcrumbs visible to driver, carrier, and load participants",
  },
  geofenceEvent: {
    level: PrivacyLevel.L3_RELATIONSHIP,
    ownerField: "driverId",
    participantFields: ["driverId"],
    description: "Geofence events visible to load participants",
  },
  geotag: {
    level: PrivacyLevel.L3_RELATIONSHIP,
    ownerField: "createdById",
    participantFields: ["createdById"],
    description: "Geotags visible to load participants",
  },
};

/**
 * Get the privacy classification for a resource type.
 */
export function getClassification(resourceType: string): DataClassification | null {
  return DATA_CLASSIFICATIONS[resourceType] || null;
}

/**
 * Check if a resource type requires ownership verification.
 */
export function requiresOwnershipCheck(resourceType: string): boolean {
  const classification = getClassification(resourceType);
  if (!classification) return true; // Default to requiring ownership check
  return classification.level !== PrivacyLevel.L4_PUBLIC;
}

/**
 * Check if a resource type allows organization-level access.
 */
export function allowsOrgAccess(resourceType: string): boolean {
  const classification = getClassification(resourceType);
  if (!classification) return false;
  return classification.level === PrivacyLevel.L2_ORGANIZATION && !!classification.orgField;
}

/**
 * Check if a resource type allows relationship-based access.
 */
export function allowsRelationshipAccess(resourceType: string): boolean {
  const classification = getClassification(resourceType);
  if (!classification) return false;
  return classification.level === PrivacyLevel.L3_RELATIONSHIP && !!classification.participantFields;
}
