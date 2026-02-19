import {
  int,
  bigint,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  char,
  decimal,
  boolean,
  json,
  date,
  datetime,
  tinyint,
  index,
  unique,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * ENTERPRISE-GRADE DATABASE SCHEMA FOR EUSOTRIP PLATFORM
 * 
 * 100% Database-Driven Architecture
 * - All features backed by PostgreSQL/MySQL
 * - Comprehensive indexing for performance
 * - Audit logging for compliance
 * - Soft deletes for data retention
 * - Row-level security ready
 */

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    passwordHash: varchar("passwordHash", { length: 255 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", [
      "SHIPPER",
      "CATALYST",
      "BROKER",
      "DRIVER",
      "DISPATCH",
      "ESCORT",
      "TERMINAL_MANAGER",
      "COMPLIANCE_OFFICER",
      "SAFETY_MANAGER",
      "ADMIN",
      "SUPER_ADMIN",
    ])
      .default("DRIVER")
      .notNull(),
    profilePicture: text("profilePicture"),
    companyId: int("companyId"),
    isActive: boolean("isActive").default(true).notNull(),
    isVerified: boolean("isVerified").default(false).notNull(),
    stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
    stripeConnectId: varchar("stripeConnectId", { length: 255 }),
    metadata: text("metadata"),
    currentLocation: json("currentLocation").$type<{ lat: number; lng: number; city?: string; state?: string }>(),
    lastGPSUpdate: timestamp("lastGPSUpdate"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    emailIdx: unique("email_unique").on(table.email),
    roleIdx: index("role_idx").on(table.role),
    companyIdx: index("company_idx").on(table.companyId),
    activeRoleIdx: index("active_role_idx").on(table.isActive, table.role),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// COMPANIES
// ============================================================================

export const companies = mysqlTable(
  "companies",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    legalName: varchar("legalName", { length: 255 }),
    dotNumber: varchar("dotNumber", { length: 50 }),
    mcNumber: varchar("mcNumber", { length: 50 }),
    ein: varchar("ein", { length: 20 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 50 }),
    zipCode: varchar("zipCode", { length: 20 }),
    country: varchar("country", { length: 50 }).default("USA"),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 320 }),
    website: varchar("website", { length: 255 }),
    logo: text("logo"),
    description: text("description"),
    insurancePolicy: text("insurancePolicy"),
    insuranceExpiry: timestamp("insuranceExpiry"),
    twicCard: text("twicCard"),
    twicExpiry: timestamp("twicExpiry"),
    hazmatLicense: text("hazmatLicense"),
    hazmatExpiry: timestamp("hazmatExpiry"),
    complianceStatus: mysqlEnum("complianceStatus", ["compliant", "pending", "expired", "non_compliant"])
      .default("pending")
      .notNull(),
    stripeAccountId: varchar("stripeAccountId", { length: 255 }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    dotIdx: index("dot_idx").on(table.dotNumber),
    mcIdx: index("mc_idx").on(table.mcNumber),
    complianceIdx: index("compliance_idx").on(table.complianceStatus),
  })
);

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// ============================================================================
// VEHICLES & FLEET
// ============================================================================

export const vehicles = mysqlTable(
  "vehicles",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    vin: varchar("vin", { length: 17 }).notNull().unique(),
    make: varchar("make", { length: 100 }),
    model: varchar("model", { length: 100 }),
    year: int("year"),
    licensePlate: varchar("licensePlate", { length: 20 }),
    vehicleType: mysqlEnum("vehicleType", [
      "tractor",
      "trailer",
      "tanker",
      "flatbed",
      "refrigerated",
      "dry_van",
      "lowboy",
      "step_deck",
    ]).notNull(),
    capacity: decimal("capacity", { precision: 10, scale: 2 }),
    currentDriverId: int("currentDriverId"),
    currentLocation: json("currentLocation").$type<{ lat: number; lng: number }>(),
    lastGPSUpdate: timestamp("lastGPSUpdate"),
    status: mysqlEnum("status", ["available", "in_use", "maintenance", "out_of_service"])
      .default("available")
      .notNull(),
    nextMaintenanceDate: timestamp("nextMaintenanceDate"),
    nextInspectionDate: timestamp("nextInspectionDate"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    companyIdx: index("vehicle_company_idx").on(table.companyId),
    vinIdx: index("vin_idx").on(table.vin),
    statusIdx: index("vehicle_status_idx").on(table.status),
    driverIdx: index("current_driver_idx").on(table.currentDriverId),
  })
);

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

// ============================================================================
// LOADS & SHIPMENTS
// ============================================================================

export const loads = mysqlTable(
  "loads",
  {
    id: int("id").autoincrement().primaryKey(),
    shipperId: int("shipperId").notNull(),
    catalystId: int("catalystId"),
    driverId: int("driverId"),
    vehicleId: int("vehicleId"),
    loadNumber: varchar("loadNumber", { length: 50 }).notNull().unique(),
    status: mysqlEnum("status", [
      "draft", "posted", "bidding", "expired",
      "awarded", "declined", "lapsed", "accepted", "assigned", "confirmed",
      "en_route_pickup", "at_pickup", "pickup_checkin", "loading", "loading_exception", "loaded",
      "in_transit", "transit_hold", "transit_exception",
      "at_delivery", "delivery_checkin", "unloading", "unloading_exception", "unloaded",
      "pod_pending", "pod_rejected", "delivered",
      "invoiced", "disputed", "paid", "complete",
      "cancelled", "on_hold",
    ])
      .default("draft")
      .notNull(),
    cargoType: mysqlEnum("cargoType", [
      "general",
      "hazmat",
      "refrigerated",
      "oversized",
      "liquid",
      "gas",
      "chemicals",
      "petroleum",
    ]).notNull(),
    hazmatClass: varchar("hazmatClass", { length: 10 }),
    unNumber: varchar("unNumber", { length: 10 }),
    weight: decimal("weight", { precision: 10, scale: 2 }),
    weightUnit: varchar("weightUnit", { length: 10 }).default("lbs"),
    volume: decimal("volume", { precision: 10, scale: 2 }),
    volumeUnit: varchar("volumeUnit", { length: 10 }).default("gal"),
    pickupLocation: json("pickupLocation").$type<{
      address: string;
      city: string;
      state: string;
      zipCode: string;
      lat: number;
      lng: number;
    }>(),
    deliveryLocation: json("deliveryLocation").$type<{
      address: string;
      city: string;
      state: string;
      zipCode: string;
      lat: number;
      lng: number;
    }>(),
    pickupDate: timestamp("pickupDate"),
    deliveryDate: timestamp("deliveryDate"),
    estimatedDeliveryDate: timestamp("estimatedDeliveryDate"),
    actualDeliveryDate: timestamp("actualDeliveryDate"),
    distance: decimal("distance", { precision: 10, scale: 2 }),
    distanceUnit: varchar("distanceUnit", { length: 10 }).default("miles"),
    rate: decimal("rate", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("USD"),
    specialInstructions: text("specialInstructions"),
    commodityName: varchar("commodityName", { length: 255 }),
    spectraMatchResult: json("spectraMatchResult").$type<{
      crudeId: string;
      productName: string;
      confidence: number;
      category: string;
      apiGravity?: number;
      bsw?: number;
      sulfur?: number;
      flashPoint?: number;
      verifiedBy: number;
      verifiedAt: string;
      esangVerified: boolean;
    }>(),
    documents: json("documents").$type<string[]>(),
    currentLocation: json("currentLocation").$type<{ lat: number; lng: number }>(),
    route: json("route").$type<Array<{ lat: number; lng: number }>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
    holdReason: text("hold_reason"),
    heldBy: int("held_by"),
    heldAt: timestamp("held_at"),
    previousState: varchar("previous_state", { length: 30 }),
  },
  (table) => ({
    shipperIdx: index("load_shipper_idx").on(table.shipperId),
    catalystIdx: index("load_catalyst_idx").on(table.catalystId),
    driverIdx: index("load_driver_idx").on(table.driverId),
    statusIdx: index("load_status_idx").on(table.status),
    loadNumberIdx: unique("load_number_unique").on(table.loadNumber),
    pickupDateIdx: index("pickup_date_idx").on(table.pickupDate),
  })
);

export type Load = typeof loads.$inferSelect;
export type InsertLoad = typeof loads.$inferInsert;

// ============================================================================
// BIDS
// ============================================================================

export const bids = mysqlTable(
  "bids",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId").notNull(),
    catalystId: int("catalystId").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("USD"),
    estimatedPickupDate: timestamp("estimatedPickupDate"),
    estimatedDeliveryDate: timestamp("estimatedDeliveryDate"),
    notes: text("notes"),
    status: mysqlEnum("status", ["pending", "accepted", "rejected", "withdrawn", "expired"])
      .default("pending")
      .notNull(),
    expiresAt: timestamp("expiresAt"),
    isEncrypted: boolean("isEncrypted").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    loadIdx: index("bid_load_idx").on(table.loadId),
    catalystIdx: index("bid_catalyst_idx").on(table.catalystId),
    statusIdx: index("bid_status_idx").on(table.status),
  })
);

export type Bid = typeof bids.$inferSelect;
export type InsertBid = typeof bids.$inferInsert;

// ============================================================================
// PAYMENTS & TRANSACTIONS
// ============================================================================

export const payments = mysqlTable(
  "payments",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId"),
    payerId: int("payerId").notNull(),
    payeeId: int("payeeId").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("USD"),
    paymentType: mysqlEnum("paymentType", [
      "load_payment",
      "subscription",
      "refund",
      "payout",
      "escrow",
      "tip",
    ]).notNull(),
    paymentMethod: varchar("paymentMethod", { length: 50 }),
    stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
    stripeChargeId: varchar("stripeChargeId", { length: 255 }),
    status: mysqlEnum("status", [
      "pending",
      "processing",
      "succeeded",
      "failed",
      "cancelled",
      "refunded",
    ])
      .default("pending")
      .notNull(),
    failureReason: text("failureReason"),
    metadata: json("metadata"),
    isEncrypted: boolean("isEncrypted").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    loadIdx: index("payment_load_idx").on(table.loadId),
    payerIdx: index("payment_payer_idx").on(table.payerId),
    payeeIdx: index("payment_payee_idx").on(table.payeeId),
    statusIdx: index("payment_status_idx").on(table.status),
    stripeIdx: index("stripe_payment_intent_idx").on(table.stripePaymentIntentId),
  })
);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ============================================================================
// MESSAGES & CONVERSATIONS
// ============================================================================

export const conversations = mysqlTable(
  "conversations",
  {
    id: int("id").autoincrement().primaryKey(),
    type: mysqlEnum("type", ["direct", "group", "job", "channel", "company", "support"]).notNull(),
    name: varchar("name", { length: 255 }),
    loadId: int("loadId"),
    companyId: int("companyId"),
    participants: json("participants").$type<number[]>(),
    lastMessageAt: timestamp("lastMessageAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    typeIdx: index("conversation_type_idx").on(table.type),
    loadIdx: index("conversation_load_idx").on(table.loadId),
    companyIdx: index("conversation_company_idx").on(table.companyId),
  })
);

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export const messages = mysqlTable(
  "messages",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversationId").notNull(),
    senderId: int("senderId").notNull(),
    messageType: mysqlEnum("messageType", [
      "text",
      "image",
      "document",
      "location",
      "payment_request",
      "payment_sent",
      "payment_received",
      "job_update",
      "system_notification",
      "voice_message",
      "contact_card",
    ])
      .default("text")
      .notNull(),
    content: text("content"),
    metadata: json("metadata"),
    isEncrypted: boolean("isEncrypted").default(false),
    readBy: json("readBy").$type<number[]>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    conversationIdx: index("message_conversation_idx").on(table.conversationId),
    senderIdx: index("message_sender_idx").on(table.senderId),
    createdAtIdx: index("message_created_at_idx").on(table.createdAt),
  })
);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ============================================================================
// GEOFENCES
// ============================================================================

export const geofences = mysqlTable(
  "geofences",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", [
      "terminal", "warehouse", "rest_area", "custom",
      "pickup", "delivery", "waypoint", "state_boundary",
      "hazmat_restricted", "weight_restricted", "height_restricted",
      "customer_site", "no_go", "speed_zone"
    ]).notNull(),
    shape: mysqlEnum("shape", ["circle", "polygon"]).default("circle"),
    center: json("center").$type<{ lat: number; lng: number }>(),
    radius: decimal("radius", { precision: 10, scale: 2 }),
    radiusMeters: int("radiusMeters"),
    polygon: json("polygon").$type<Array<{ lat: number; lng: number }>>(),
    companyId: int("companyId"),
    loadId: int("loadId"),
    terminalId: int("terminalId"),
    createdBy: int("createdBy"),
    alertOnEnter: boolean("alertOnEnter").default(true),
    alertOnExit: boolean("alertOnExit").default(true),
    alertOnDwell: boolean("alertOnDwell").default(false),
    dwellThresholdSeconds: int("dwellThresholdSeconds").default(300),
    actions: json("actions").$type<{ type: string; config: Record<string, unknown> }[]>(),
    isActive: boolean("isActive").default(true).notNull(),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    typeIdx: index("geofence_type_idx").on(table.type),
    companyIdx: index("geofence_company_idx").on(table.companyId),
    loadIdx: index("geofence_load_idx").on(table.loadId),
    activeIdx: index("geofence_active_idx").on(table.isActive),
  })
);

export type Geofence = typeof geofences.$inferSelect;
export type InsertGeofence = typeof geofences.$inferInsert;

// ============================================================================
// GPS TRACKING
// ============================================================================

export const gpsTracking = mysqlTable(
  "gps_tracking",
  {
    id: int("id").autoincrement().primaryKey(),
    vehicleId: int("vehicleId").notNull(),
    driverId: int("driverId").notNull(),
    loadId: int("loadId"),
    latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
    speed: decimal("speed", { precision: 5, scale: 2 }),
    heading: decimal("heading", { precision: 5, scale: 2 }),
    accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
    altitude: decimal("altitude", { precision: 7, scale: 2 }),
    timestamp: timestamp("timestamp").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    vehicleIdx: index("gps_vehicle_idx").on(table.vehicleId),
    driverIdx: index("gps_driver_idx").on(table.driverId),
    loadIdx: index("gps_load_idx").on(table.loadId),
    timestampIdx: index("gps_timestamp_idx").on(table.timestamp),
  })
);

export type GPSTracking = typeof gpsTracking.$inferSelect;
export type InsertGPSTracking = typeof gpsTracking.$inferInsert;

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("type", [
      "load_update",
      "bid_received",
      "payment_received",
      "message",
      "geofence_alert",
      "weather_alert",
      "maintenance_due",
      "compliance_expiring",
      "system",
    ]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    data: json("data"),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("notification_user_idx").on(table.userId),
    isReadIdx: index("notification_is_read_idx").on(table.isRead),
    createdAtIdx: index("notification_created_at_idx").on(table.createdAt),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================================================
// AUDIT LOGS
// ============================================================================

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entityType", { length: 50 }).notNull(),
    entityId: int("entityId"),
    changes: json("changes"),
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("audit_user_idx").on(table.userId),
    actionIdx: index("audit_action_idx").on(table.action),
    entityIdx: index("audit_entity_idx").on(table.entityType, table.entityId),
    createdAtIdx: index("audit_created_at_idx").on(table.createdAt),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;




// ============================================================================
// EUSOTRACK - ADDITIONAL TRACKING TABLES
// ============================================================================

export const geofenceAlerts = mysqlTable(
  "geofence_alerts",
  {
    id: int("id").autoincrement().primaryKey(),
    vehicleId: int("vehicleId").notNull(),
    geofenceId: int("geofenceId").notNull(),
    alertType: mysqlEnum("alertType", ["ENTER", "EXIT"]).notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    location: json("location").$type<{ lat: number; lng: number }>().notNull(),
    notified: boolean("notified").default(false),
    notifiedAt: timestamp("notifiedAt"),
  },
  (table) => ({
    vehicleIdx: index("geofence_alert_vehicle_idx").on(table.vehicleId),
    geofenceIdx: index("geofence_alert_geofence_idx").on(table.geofenceId),
    timestampIdx: index("geofence_alert_timestamp_idx").on(table.timestamp),
  })
);

export type GeofenceAlert = typeof geofenceAlerts.$inferSelect;
export type InsertGeofenceAlert = typeof geofenceAlerts.$inferInsert;

// ============================================================================
// EUSOSMS - SMS GATEWAY (IN-HOUSE)
// ============================================================================

export const smsMessages = mysqlTable(
  "sms_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    from: varchar("from", { length: 20 }).notNull(),
    to: varchar("to", { length: 20 }).notNull(),
    message: text("message").notNull(),
    status: mysqlEnum("status", ["QUEUED", "SENT", "DELIVERED", "FAILED", "UNDELIVERED"])
      .default("QUEUED")
      .notNull(),
    direction: mysqlEnum("direction", ["INBOUND", "OUTBOUND"]).notNull(),
    userId: int("userId"),
    cost: decimal("cost", { precision: 6, scale: 4 }),
    errorCode: varchar("errorCode", { length: 50 }),
    errorMessage: text("errorMessage"),
    sentAt: timestamp("sentAt"),
    deliveredAt: timestamp("deliveredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    fromIdx: index("sms_from_idx").on(table.from),
    toIdx: index("sms_to_idx").on(table.to),
    statusIdx: index("sms_status_idx").on(table.status),
    createdAtIdx: index("sms_created_at_idx").on(table.createdAt),
  })
);

export type SmsMessage = typeof smsMessages.$inferSelect;
export type InsertSmsMessage = typeof smsMessages.$inferInsert;

export const smsOptOuts = mysqlTable(
  "sms_opt_outs",
  {
    id: int("id").autoincrement().primaryKey(),
    phoneNumber: varchar("phoneNumber", { length: 20 }).notNull().unique(),
    optedOutAt: timestamp("optedOutAt").defaultNow().notNull(),
  },
  (table) => ({
    phoneIdx: unique("sms_opt_out_phone_unique").on(table.phoneNumber),
  })
);

export type SmsOptOut = typeof smsOptOuts.$inferSelect;
export type InsertSmsOptOut = typeof smsOptOuts.$inferInsert;

// ============================================================================
// EUSOBANK - BANK ACCOUNT LINKING (IN-HOUSE)
// ============================================================================

export const linkedBankAccounts = mysqlTable(
  "linked_bank_accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    bankName: varchar("bankName", { length: 255 }).notNull(),
    accountType: mysqlEnum("accountType", ["CHECKING", "SAVINGS"]).notNull(),
    accountNumberLast4: varchar("accountNumberLast4", { length: 4 }).notNull(),
    accountNumberEncrypted: text("accountNumberEncrypted").notNull(),
    routingNumber: varchar("routingNumber", { length: 9 }).notNull(),
    accountHolderName: varchar("accountHolderName", { length: 255 }).notNull(),
    balance: decimal("balance", { precision: 12, scale: 2 }),
    lastSynced: timestamp("lastSynced"),
    status: mysqlEnum("status", ["ACTIVE", "DISCONNECTED", "ERROR", "PENDING_VERIFICATION"])
      .default("PENDING_VERIFICATION")
      .notNull(),
    isDefault: boolean("isDefault").default(false),
    verificationStatus: mysqlEnum("verificationStatus", ["UNVERIFIED", "PENDING", "VERIFIED", "FAILED"])
      .default("UNVERIFIED")
      .notNull(),
    microDepositAmount1: decimal("microDepositAmount1", { precision: 4, scale: 2 }),
    microDepositAmount2: decimal("microDepositAmount2", { precision: 4, scale: 2 }),
    verificationAttempts: int("verificationAttempts").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("linked_bank_user_idx").on(table.userId),
    statusIdx: index("linked_bank_status_idx").on(table.status),
  })
);

export type LinkedBankAccount = typeof linkedBankAccounts.$inferSelect;
export type InsertLinkedBankAccount = typeof linkedBankAccounts.$inferInsert;

export const bankTransactions = mysqlTable(
  "bank_transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    accountId: int("accountId").notNull(),
    transactionId: varchar("transactionId", { length: 255 }).notNull().unique(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    type: mysqlEnum("type", ["DEBIT", "CREDIT"]).notNull(),
    category: varchar("category", { length: 100 }),
    description: text("description"),
    merchantName: varchar("merchantName", { length: 255 }),
    date: timestamp("date").notNull(),
    pending: boolean("pending").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    accountIdx: index("bank_transaction_account_idx").on(table.accountId),
    dateIdx: index("bank_transaction_date_idx").on(table.date),
    transactionIdIdx: unique("bank_transaction_id_unique").on(table.transactionId),
  })
);

export type BankTransaction = typeof bankTransactions.$inferSelect;
export type InsertBankTransaction = typeof bankTransactions.$inferInsert;

export const achTransfers = mysqlTable(
  "ach_transfers",
  {
    id: int("id").autoincrement().primaryKey(),
    fromAccountId: int("fromAccountId"),
    toAccountId: int("toAccountId"),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("USD"),
    description: text("description"),
    status: mysqlEnum("status", ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"])
      .default("PENDING")
      .notNull(),
    initiatedBy: int("initiatedBy").notNull(),
    achTraceNumber: varchar("achTraceNumber", { length: 50 }),
    errorCode: varchar("errorCode", { length: 50 }),
    errorMessage: text("errorMessage"),
    scheduledFor: timestamp("scheduledFor"),
    processedAt: timestamp("processedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    fromAccountIdx: index("ach_from_account_idx").on(table.fromAccountId),
    toAccountIdx: index("ach_to_account_idx").on(table.toAccountId),
    statusIdx: index("ach_status_idx").on(table.status),
    initiatedByIdx: index("ach_initiated_by_idx").on(table.initiatedBy),
  })
);

export type AchTransfer = typeof achTransfers.$inferSelect;
export type InsertAchTransfer = typeof achTransfers.$inferInsert;

// ============================================================================
// DRIVERS - Extended driver information
// ============================================================================

export const drivers = mysqlTable(
  "drivers",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    companyId: int("companyId").notNull(),
    licenseNumber: varchar("licenseNumber", { length: 50 }),
    licenseState: varchar("licenseState", { length: 2 }),
    licenseExpiry: timestamp("licenseExpiry"),
    medicalCardExpiry: timestamp("medicalCardExpiry"),
    hazmatEndorsement: boolean("hazmatEndorsement").default(false),
    hazmatExpiry: timestamp("hazmatExpiry"),
    twicExpiry: timestamp("twicExpiry"),
    safetyScore: int("safetyScore").default(100),
    totalMiles: decimal("totalMiles", { precision: 12, scale: 2 }),
    totalLoads: int("totalLoads").default(0),
    status: mysqlEnum("status", ["active", "inactive", "suspended", "available", "off_duty", "on_load"]).default("active"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("driver_user_idx").on(table.userId),
    companyIdx: index("driver_company_idx").on(table.companyId),
  })
);

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = typeof drivers.$inferInsert;

// ============================================================================
// INSPECTIONS
// ============================================================================

export const inspections = mysqlTable(
  "inspections",
  {
    id: int("id").autoincrement().primaryKey(),
    vehicleId: int("vehicleId").notNull(),
    driverId: int("driverId").notNull(),
    companyId: int("companyId").notNull(),
    type: mysqlEnum("type", ["pre_trip", "post_trip", "roadside", "annual", "dot"]).notNull(),
    status: mysqlEnum("status", ["passed", "failed", "pending"]).default("pending"),
    location: varchar("location", { length: 255 }),
    defectsFound: int("defectsFound").default(0),
    oosViolation: boolean("oosViolation").default(false),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    vehicleIdx: index("inspection_vehicle_idx").on(table.vehicleId),
    driverIdx: index("inspection_driver_idx").on(table.driverId),
  })
);

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

// ============================================================================
// TERMINALS
// ============================================================================

export const terminals = mysqlTable(
  "terminals",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 20 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 50 }),
    dockCount: int("dockCount").default(0),
    tankCount: int("tankCount").default(0),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("terminal_company_idx").on(table.companyId),
  })
);

export type Terminal = typeof terminals.$inferSelect;
export type InsertTerminal = typeof terminals.$inferInsert;

// ============================================================================
// INCIDENTS
// ============================================================================

export const incidents = mysqlTable(
  "incidents",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    driverId: int("driverId"),
    vehicleId: int("vehicleId"),
    type: mysqlEnum("type", ["accident", "injury", "property_damage", "hazmat_spill", "near_miss"]).notNull(),
    severity: mysqlEnum("severity", ["minor", "moderate", "major", "critical"]).notNull(),
    occurredAt: timestamp("occurredAt").notNull(),
    location: varchar("location", { length: 255 }),
    description: text("description"),
    injuries: int("injuries").default(0),
    fatalities: int("fatalities").default(0),
    status: mysqlEnum("status", ["reported", "investigating", "resolved"]).default("reported"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index("incident_company_idx").on(table.companyId),
    driverIdx: index("incident_driver_idx").on(table.driverId),
  })
);

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;

// ============================================================================
// CERTIFICATIONS
// ============================================================================

export const certifications = mysqlTable(
  "certifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    expiryDate: timestamp("expiryDate"),
    status: mysqlEnum("status", ["active", "expired", "pending"]).default("active"),
    documentUrl: text("documentUrl"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("certification_user_idx").on(table.userId),
    expiryIdx: index("certification_expiry_idx").on(table.expiryDate),
  })
);

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = typeof certifications.$inferInsert;

// ============================================================================
// DOCUMENTS
// ============================================================================

export const documents = mysqlTable(
  "documents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    companyId: int("companyId"),
    loadId: int("loadId"),
    type: varchar("type", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fileUrl: text("fileUrl").notNull(),
    expiryDate: timestamp("expiryDate"),
    status: mysqlEnum("status", ["active", "expired", "pending"]).default("active"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("document_user_idx").on(table.userId),
    companyIdx: index("document_company_idx").on(table.companyId),
  })
);

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ============================================================================
// FUEL TRANSACTIONS
// ============================================================================

export const fuelTransactions = mysqlTable(
  "fuel_transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    driverId: int("driverId").notNull(),
    vehicleId: int("vehicleId").notNull(),
    companyId: int("companyId").notNull(),
    stationName: varchar("stationName", { length: 255 }),
    gallons: decimal("gallons", { precision: 10, scale: 3 }).notNull(),
    pricePerGallon: decimal("pricePerGallon", { precision: 6, scale: 3 }).notNull(),
    totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
    transactionDate: timestamp("transactionDate").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    driverIdx: index("fuel_driver_idx").on(table.driverId),
    companyIdx: index("fuel_company_idx").on(table.companyId),
  })
);

export type FuelTransaction = typeof fuelTransactions.$inferSelect;
export type InsertFuelTransaction = typeof fuelTransactions.$inferInsert;

// ============================================================================
// TRAINING RECORDS
// ============================================================================

export const trainingRecords = mysqlTable(
  "training_records",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    companyId: int("companyId").notNull(),
    courseName: varchar("courseName", { length: 255 }).notNull(),
    completedAt: timestamp("completedAt"),
    expiresAt: timestamp("expiresAt"),
    passed: boolean("passed").default(false),
    status: mysqlEnum("status", ["assigned", "in_progress", "completed", "expired"]).default("assigned"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("training_user_idx").on(table.userId),
    companyIdx: index("training_company_idx").on(table.companyId),
  })
);

export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type InsertTrainingRecord = typeof trainingRecords.$inferInsert;

// ============================================================================
// DRUG TESTS
// ============================================================================

export const drugTests = mysqlTable(
  "drug_tests",
  {
    id: int("id").autoincrement().primaryKey(),
    driverId: int("driverId").notNull(),
    companyId: int("companyId").notNull(),
    type: mysqlEnum("type", ["pre_employment", "random", "post_accident", "reasonable_suspicion"]).notNull(),
    testDate: timestamp("testDate").notNull(),
    result: mysqlEnum("result", ["negative", "positive", "pending"]).default("pending"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    driverIdx: index("drug_test_driver_idx").on(table.driverId),
    companyIdx: index("drug_test_company_idx").on(table.companyId),
  })
);

export type DrugTest = typeof drugTests.$inferSelect;
export type InsertDrugTest = typeof drugTests.$inferInsert;

// ============================================================================
// APPOINTMENTS
// ============================================================================

export const appointments = mysqlTable(
  "appointments",
  {
    id: int("id").autoincrement().primaryKey(),
    terminalId: int("terminalId").notNull(),
    loadId: int("loadId"),
    driverId: int("driverId"),
    type: mysqlEnum("type", ["pickup", "delivery", "loading", "unloading"]).notNull(),
    scheduledAt: timestamp("scheduledAt").notNull(),
    dockNumber: varchar("dockNumber", { length: 20 }),
    status: mysqlEnum("status", ["scheduled", "checked_in", "completed", "cancelled"]).default("scheduled"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    terminalIdx: index("appointment_terminal_idx").on(table.terminalId),
    scheduledIdx: index("appointment_scheduled_idx").on(table.scheduledAt),
  })
);

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// ============================================================================
// DIGITAL WALLETS - EusoWallet System
// ============================================================================

export const wallets = mysqlTable(
  "wallets",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    availableBalance: decimal("availableBalance", { precision: 12, scale: 2 }).default("0").notNull(),
    pendingBalance: decimal("pendingBalance", { precision: 12, scale: 2 }).default("0").notNull(),
    reservedBalance: decimal("reservedBalance", { precision: 12, scale: 2 }).default("0"),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
    stripeConnectId: varchar("stripeConnectId", { length: 255 }),
    stripeAccountStatus: mysqlEnum("stripeAccountStatus", ["pending", "active", "restricted", "disabled"]).default("pending"),
    lastDepositAt: timestamp("lastDepositAt"),
    lastWithdrawalAt: timestamp("lastWithdrawalAt"),
    totalReceived: decimal("totalReceived", { precision: 14, scale: 2 }).default("0"),
    totalSpent: decimal("totalSpent", { precision: 14, scale: 2 }).default("0"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: unique("wallet_user_unique").on(table.userId),
    stripeIdx: index("wallet_stripe_idx").on(table.stripeCustomerId),
    stripeConnectIdx: index("wallet_stripe_connect_idx").on(table.stripeConnectId),
  })
);

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

export const walletTransactions = mysqlTable(
  "wallet_transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    walletId: int("walletId").notNull(),
    type: mysqlEnum("type", ["earnings", "payout", "fee", "refund", "bonus", "adjustment", "transfer", "deposit"]).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    fee: decimal("fee", { precision: 10, scale: 2 }).default("0"),
    netAmount: decimal("netAmount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("USD"),
    status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending").notNull(),
    description: text("description"),
    loadId: int("loadId"),
    loadNumber: varchar("loadNumber", { length: 50 }),
    stripePaymentId: varchar("stripePaymentId", { length: 255 }),
    stripeTransferId: varchar("stripeTransferId", { length: 255 }),
    metadata: json("metadata"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    walletIdx: index("wallet_transaction_wallet_idx").on(table.walletId),
    typeIdx: index("wallet_transaction_type_idx").on(table.type),
    statusIdx: index("wallet_transaction_status_idx").on(table.status),
    createdAtIdx: index("wallet_transaction_created_idx").on(table.createdAt),
  })
);

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

export const payoutMethods = mysqlTable(
  "payout_methods",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("type", ["bank_account", "debit_card"]).notNull(),
    bankName: varchar("bankName", { length: 255 }),
    last4: varchar("last4", { length: 4 }).notNull(),
    brand: varchar("brand", { length: 50 }),
    accountHolderName: varchar("accountHolderName", { length: 255 }),
    stripeExternalAccountId: varchar("stripeExternalAccountId", { length: 255 }),
    isDefault: boolean("isDefault").default(false),
    instantPayoutEligible: boolean("instantPayoutEligible").default(false),
    isVerified: boolean("isVerified").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("payout_method_user_idx").on(table.userId),
    stripeIdx: index("payout_method_stripe_idx").on(table.stripeExternalAccountId),
  })
);

export type PayoutMethod = typeof payoutMethods.$inferSelect;
export type InsertPayoutMethod = typeof payoutMethods.$inferInsert;

// ============================================================================
// TRAINING MODULES - Required training for compliance
// ============================================================================

export const trainingModules = mysqlTable(
  "training_modules",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", ["hazmat", "safety", "compliance", "equipment", "onboarding"]).notNull(),
    duration: int("duration"),
    requiredForRoles: json("requiredForRoles").$type<string[]>(),
    contentUrl: text("contentUrl"),
    passingScore: int("passingScore").default(80),
    expirationMonths: int("expirationMonths").default(12),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    typeIdx: index("training_module_type_idx").on(table.type),
  })
);

export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = typeof trainingModules.$inferInsert;

export const userTraining = mysqlTable(
  "user_training",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    moduleId: int("moduleId").notNull(),
    status: mysqlEnum("status", ["not_started", "in_progress", "completed", "expired"]).default("not_started").notNull(),
    progress: int("progress").default(0),
    score: int("score"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    expiresAt: timestamp("expiresAt"),
    certificateUrl: text("certificateUrl"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_training_user_idx").on(table.userId),
    moduleIdx: index("user_training_module_idx").on(table.moduleId),
    statusIdx: index("user_training_status_idx").on(table.status),
  })
);

export type UserTraining = typeof userTraining.$inferSelect;
export type InsertUserTraining = typeof userTraining.$inferInsert;

// ============================================================================
// ONBOARDING TRACKING
// ============================================================================

export const onboardingProgress = mysqlTable(
  "onboarding_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    currentStep: int("currentStep").default(1).notNull(),
    totalSteps: int("totalSteps").default(7).notNull(),
    completedSteps: json("completedSteps").$type<string[]>().default([]),
    pendingSteps: json("pendingSteps").$type<string[]>(),
    status: mysqlEnum("status", ["in_progress", "pending_review", "approved", "rejected"]).default("in_progress").notNull(),
    submittedAt: timestamp("submittedAt"),
    approvedAt: timestamp("approvedAt"),
    approvedBy: int("approvedBy"),
    rejectionReason: text("rejectionReason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: unique("onboarding_user_unique").on(table.userId),
    statusIdx: index("onboarding_status_idx").on(table.status),
  })
);

export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = typeof onboardingProgress.$inferInsert;

// ============================================================================
// PLATFORM FEE REVENUE SYSTEM
// ============================================================================

export const platformFeeConfigs = mysqlTable(
  "platform_fee_configs",
  {
    id: int("id").autoincrement().primaryKey(),
    feeCode: varchar("feeCode", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    transactionType: mysqlEnum("transactionType", [
      "load_booking",
      "load_completion",
      "instant_pay",
      "cash_advance",
      "p2p_transfer",
      "wallet_withdrawal",
      "subscription",
      "premium_feature",
    ]).notNull(),
    feeType: mysqlEnum("feeType", ["percentage", "flat", "tiered", "hybrid"]).notNull(),
    baseRate: decimal("baseRate", { precision: 10, scale: 4 }),
    flatAmount: decimal("flatAmount", { precision: 10, scale: 2 }),
    minFee: decimal("minFee", { precision: 10, scale: 2 }),
    maxFee: decimal("maxFee", { precision: 10, scale: 2 }),
    tiers: json("tiers").$type<Array<{ minAmount: number; maxAmount: number; rate: number }>>(),
    applicableRoles: json("applicableRoles").$type<string[]>(),
    platformShare: decimal("platformShare", { precision: 5, scale: 2 }).default("100"),
    processorShare: decimal("processorShare", { precision: 5, scale: 2 }).default("0"),
    isActive: boolean("isActive").default(true).notNull(),
    effectiveFrom: timestamp("effectiveFrom").defaultNow().notNull(),
    effectiveTo: timestamp("effectiveTo"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    feeCodeIdx: unique("fee_code_unique").on(table.feeCode),
    transactionTypeIdx: index("fee_transaction_type_idx").on(table.transactionType),
    activeIdx: index("fee_active_idx").on(table.isActive),
  })
);

export type PlatformFeeConfig = typeof platformFeeConfigs.$inferSelect;
export type InsertPlatformFeeConfig = typeof platformFeeConfigs.$inferInsert;

export const volumeDiscounts = mysqlTable(
  "volume_discounts",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    discountType: mysqlEnum("discountType", ["transaction_count", "volume_amount", "tenure"]).notNull(),
    thresholdValue: decimal("thresholdValue", { precision: 12, scale: 2 }).notNull(),
    discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).notNull(),
    applicableFeeCode: varchar("applicableFeeCode", { length: 50 }),
    applicableRoles: json("applicableRoles").$type<string[]>(),
    periodType: mysqlEnum("periodType", ["monthly", "quarterly", "yearly", "lifetime"]).default("monthly"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    discountTypeIdx: index("volume_discount_type_idx").on(table.discountType),
    activeIdx: index("volume_discount_active_idx").on(table.isActive),
  })
);

export type VolumeDiscount = typeof volumeDiscounts.$inferSelect;
export type InsertVolumeDiscount = typeof volumeDiscounts.$inferInsert;

export const userFeeOverrides = mysqlTable(
  "user_fee_overrides",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    feeConfigId: int("feeConfigId").notNull(),
    overrideType: mysqlEnum("overrideType", ["rate_adjustment", "flat_override", "percentage_off", "waived"]).notNull(),
    overrideValue: decimal("overrideValue", { precision: 10, scale: 4 }),
    reason: text("reason"),
    approvedBy: int("approvedBy"),
    effectiveFrom: timestamp("effectiveFrom").defaultNow().notNull(),
    effectiveTo: timestamp("effectiveTo"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_fee_override_user_idx").on(table.userId),
    feeConfigIdx: index("user_fee_override_config_idx").on(table.feeConfigId),
    activeIdx: index("user_fee_override_active_idx").on(table.isActive),
  })
);

export type UserFeeOverride = typeof userFeeOverrides.$inferSelect;
export type InsertUserFeeOverride = typeof userFeeOverrides.$inferInsert;

export const platformRevenue = mysqlTable(
  "platform_revenue",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionId: int("transactionId").notNull(),
    transactionType: varchar("transactionType", { length: 50 }).notNull(),
    userId: int("userId").notNull(),
    feeConfigId: int("feeConfigId"),
    grossAmount: decimal("grossAmount", { precision: 12, scale: 2 }).notNull(),
    feeAmount: decimal("feeAmount", { precision: 10, scale: 2 }).notNull(),
    netAmount: decimal("netAmount", { precision: 12, scale: 2 }).notNull(),
    platformShare: decimal("platformShare", { precision: 10, scale: 2 }).notNull(),
    processorShare: decimal("processorShare", { precision: 10, scale: 2 }).default("0"),
    discountApplied: decimal("discountApplied", { precision: 10, scale: 2 }).default("0"),
    promoCodeUsed: varchar("promoCodeUsed", { length: 50 }),
    feeBreakdown: json("feeBreakdown").$type<{
      baseFee: number;
      volumeDiscount?: number;
      overrideDiscount?: number;
      promoDiscount?: number;
      finalFee: number;
    }>(),
    metadata: json("metadata"),
    processedAt: timestamp("processedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    transactionIdx: index("platform_revenue_transaction_idx").on(table.transactionId),
    userIdx: index("platform_revenue_user_idx").on(table.userId),
    processedAtIdx: index("platform_revenue_processed_idx").on(table.processedAt),
    transactionTypeIdx: index("platform_revenue_type_idx").on(table.transactionType),
  })
);

export type PlatformRevenue = typeof platformRevenue.$inferSelect;
export type InsertPlatformRevenue = typeof platformRevenue.$inferInsert;

export const promoCodes = mysqlTable(
  "promo_codes",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    discountType: mysqlEnum("discountType", ["percentage", "flat", "fee_waiver"]).notNull(),
    discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
    applicableFeeCode: varchar("applicableFeeCode", { length: 50 }),
    maxUses: int("maxUses"),
    maxUsesPerUser: int("maxUsesPerUser").default(1),
    currentUses: int("currentUses").default(0),
    minTransactionAmount: decimal("minTransactionAmount", { precision: 10, scale: 2 }),
    applicableRoles: json("applicableRoles").$type<string[]>(),
    validFrom: timestamp("validFrom").defaultNow().notNull(),
    validTo: timestamp("validTo"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    codeIdx: unique("promo_code_unique").on(table.code),
    activeIdx: index("promo_code_active_idx").on(table.isActive),
    validIdx: index("promo_code_valid_idx").on(table.validFrom, table.validTo),
  })
);

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

export const promoCodeUsage = mysqlTable(
  "promo_code_usage",
  {
    id: int("id").autoincrement().primaryKey(),
    promoCodeId: int("promoCodeId").notNull(),
    userId: int("userId").notNull(),
    transactionId: int("transactionId").notNull(),
    discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).notNull(),
    usedAt: timestamp("usedAt").defaultNow().notNull(),
  },
  (table) => ({
    promoCodeIdx: index("promo_usage_code_idx").on(table.promoCodeId),
    userIdx: index("promo_usage_user_idx").on(table.userId),
  })
);

export type PromoCodeUsage = typeof promoCodeUsage.$inferSelect;
export type InsertPromoCodeUsage = typeof promoCodeUsage.$inferInsert;

// ============================================================================
// GAMIFICATION QUEST SYSTEM
// ============================================================================

export const missions = mysqlTable(
  "missions",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", [
      "daily",
      "weekly",
      "monthly",
      "epic",
      "seasonal",
      "raid",
      "story",
      "achievement",
    ]).notNull(),
    category: mysqlEnum("category", [
      "deliveries",
      "earnings",
      "safety",
      "efficiency",
      "social",
      "special",
      "onboarding",
    ]).notNull(),
    targetType: mysqlEnum("targetType", [
      "count",
      "amount",
      "distance",
      "streak",
      "rating",
      "time",
    ]).notNull(),
    targetValue: decimal("targetValue", { precision: 12, scale: 2 }).notNull(),
    targetUnit: varchar("targetUnit", { length: 50 }),
    requirements: json("requirements").$type<{
      minLevel?: number;
      requiredBadges?: string[];
      roleRestriction?: string[];
      prerequisiteMissions?: string[];
    }>(),
    rewardType: mysqlEnum("rewardType", [
      "miles",
      "cash",
      "badge",
      "title",
      "fee_reduction",
      "priority_perk",
      "crate",
      "xp",
    ]).notNull(),
    rewardValue: decimal("rewardValue", { precision: 12, scale: 2 }).notNull(),
    rewardData: json("rewardData").$type<{
      badgeId?: string;
      title?: string;
      feeReductionPercent?: number;
      crateType?: string;
      bonusMultiplier?: number;
    }>(),
    xpReward: int("xpReward").default(0),
    cooldownHours: int("cooldownHours"),
    maxCompletions: int("maxCompletions"),
    applicableRoles: json("applicableRoles").$type<string[]>(),
    seasonId: int("seasonId"),
    sortOrder: int("sortOrder").default(0),
    isActive: boolean("isActive").default(true).notNull(),
    startsAt: timestamp("startsAt"),
    endsAt: timestamp("endsAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    codeIdx: unique("mission_code_unique").on(table.code),
    typeIdx: index("mission_type_idx").on(table.type),
    categoryIdx: index("mission_category_idx").on(table.category),
    activeIdx: index("mission_active_idx").on(table.isActive),
    seasonIdx: index("mission_season_idx").on(table.seasonId),
  })
);

export type Mission = typeof missions.$inferSelect;
export type InsertMission = typeof missions.$inferInsert;

export const missionProgress = mysqlTable(
  "mission_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    missionId: int("missionId").notNull(),
    currentProgress: decimal("currentProgress", { precision: 12, scale: 2 }).default("0").notNull(),
    targetProgress: decimal("targetProgress", { precision: 12, scale: 2 }).notNull(),
    status: mysqlEnum("status", ["not_started", "in_progress", "completed", "claimed", "expired", "cancelled"]).default("not_started").notNull(),
    completionCount: int("completionCount").default(0),
    lastProgressAt: timestamp("lastProgressAt"),
    completedAt: timestamp("completedAt"),
    claimedAt: timestamp("claimedAt"),
    expiresAt: timestamp("expiresAt"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("mission_progress_user_idx").on(table.userId),
    missionIdx: index("mission_progress_mission_idx").on(table.missionId),
    statusIdx: index("mission_progress_status_idx").on(table.status),
    userMissionIdx: index("mission_progress_user_mission_idx").on(table.userId, table.missionId),
  })
);

export type MissionProgress = typeof missionProgress.$inferSelect;
export type InsertMissionProgress = typeof missionProgress.$inferInsert;

export const badges = mysqlTable(
  "badges",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: mysqlEnum("category", [
      "milestone",
      "performance",
      "specialty",
      "seasonal",
      "epic",
      "legendary",
    ]).notNull(),
    tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum", "diamond"]).default("bronze"),
    iconUrl: text("iconUrl"),
    criteria: json("criteria").$type<{
      type: string;
      value: number;
      condition?: string;
    }>(),
    xpValue: int("xpValue").default(0),
    isRare: boolean("isRare").default(false),
    sortOrder: int("sortOrder").default(0),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    codeIdx: unique("badge_code_unique").on(table.code),
    categoryIdx: index("badge_category_idx").on(table.category),
    tierIdx: index("badge_tier_idx").on(table.tier),
  })
);

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

export const userBadges = mysqlTable(
  "user_badges",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    badgeId: int("badgeId").notNull(),
    earnedAt: timestamp("earnedAt").defaultNow().notNull(),
    displayOrder: int("displayOrder").default(0),
    isDisplayed: boolean("isDisplayed").default(true),
    metadata: json("metadata"),
  },
  (table) => ({
    userIdx: index("user_badge_user_idx").on(table.userId),
    badgeIdx: index("user_badge_badge_idx").on(table.badgeId),
    userBadgeIdx: unique("user_badge_unique").on(table.userId, table.badgeId),
  })
);

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

export const userTitles = mysqlTable(
  "user_titles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 100 }).notNull(),
    source: varchar("source", { length: 100 }),
    earnedAt: timestamp("earnedAt").defaultNow().notNull(),
    isActive: boolean("isActive").default(true),
  },
  (table) => ({
    userIdx: index("user_title_user_idx").on(table.userId),
  })
);

export type UserTitle = typeof userTitles.$inferSelect;
export type InsertUserTitle = typeof userTitles.$inferInsert;

export const gamificationProfiles = mysqlTable(
  "gamification_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    level: int("level").default(1).notNull(),
    currentXp: int("currentXp").default(0).notNull(),
    totalXp: int("totalXp").default(0).notNull(),
    xpToNextLevel: int("xpToNextLevel").default(1000).notNull(),
    totalMilesEarned: decimal("totalMilesEarned", { precision: 14, scale: 2 }).default("0"),
    currentMiles: decimal("currentMiles", { precision: 14, scale: 2 }).default("0"),
    activeTitle: varchar("activeTitle", { length: 100 }),
    rank: int("rank"),
    streakDays: int("streakDays").default(0),
    longestStreak: int("longestStreak").default(0),
    lastActivityAt: timestamp("lastActivityAt"),
    seasonalRank: int("seasonalRank"),
    seasonalXp: int("seasonalXp").default(0),
    stats: json("stats").$type<{
      totalMissionsCompleted: number;
      totalBadgesEarned: number;
      totalCratesOpened: number;
      perfectDeliveries: number;
      onTimeRate: number;
    }>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: unique("gamification_profile_user_unique").on(table.userId),
    levelIdx: index("gamification_profile_level_idx").on(table.level),
    rankIdx: index("gamification_profile_rank_idx").on(table.rank),
  })
);

export type GamificationProfile = typeof gamificationProfiles.$inferSelect;
export type InsertGamificationProfile = typeof gamificationProfiles.$inferInsert;

export const rewardCrates = mysqlTable(
  "reward_crates",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    crateType: mysqlEnum("crateType", [
      "common",
      "uncommon",
      "rare",
      "epic",
      "legendary",
      "mythic",
    ]).notNull(),
    source: varchar("source", { length: 100 }),
    sourceId: int("sourceId"),
    status: mysqlEnum("status", ["pending", "opened", "expired"]).default("pending").notNull(),
    contents: json("contents").$type<Array<{
      type: string;
      value: number;
      name?: string;
    }>>(),
    openedAt: timestamp("openedAt"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("reward_crate_user_idx").on(table.userId),
    statusIdx: index("reward_crate_status_idx").on(table.status),
    crateTypeIdx: index("reward_crate_type_idx").on(table.crateType),
  })
);

export type RewardCrate = typeof rewardCrates.$inferSelect;
export type InsertRewardCrate = typeof rewardCrates.$inferInsert;

export const seasons = mysqlTable(
  "seasons",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    theme: varchar("theme", { length: 100 }),
    startsAt: timestamp("startsAt").notNull(),
    endsAt: timestamp("endsAt").notNull(),
    rewards: json("rewards").$type<Array<{
      rank: number;
      reward: { type: string; value: number };
    }>>(),
    isActive: boolean("isActive").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    activeIdx: index("season_active_idx").on(table.isActive),
    dateIdx: index("season_date_idx").on(table.startsAt, table.endsAt),
  })
);

export type Season = typeof seasons.$inferSelect;
export type InsertSeason = typeof seasons.$inferInsert;

export const leaderboards = mysqlTable(
  "leaderboards",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    periodType: mysqlEnum("periodType", ["daily", "weekly", "monthly", "seasonal", "all_time"]).notNull(),
    periodKey: varchar("periodKey", { length: 50 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    score: decimal("score", { precision: 14, scale: 2 }).notNull(),
    rank: int("rank"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("leaderboard_user_idx").on(table.userId),
    periodIdx: index("leaderboard_period_idx").on(table.periodType, table.periodKey),
    categoryIdx: index("leaderboard_category_idx").on(table.category),
    rankIdx: index("leaderboard_rank_idx").on(table.rank),
  })
);

export type Leaderboard = typeof leaderboards.$inferSelect;
export type InsertLeaderboard = typeof leaderboards.$inferInsert;

// ============================================================================
// ENHANCED MESSAGING & NOTIFICATION SYSTEM
// ============================================================================

export const notificationPreferences = mysqlTable(
  "notification_preferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    emailNotifications: boolean("emailNotifications").default(true),
    pushNotifications: boolean("pushNotifications").default(true),
    smsNotifications: boolean("smsNotifications").default(false),
    inAppNotifications: boolean("inAppNotifications").default(true),
    loadUpdates: boolean("loadUpdates").default(true),
    bidAlerts: boolean("bidAlerts").default(true),
    paymentAlerts: boolean("paymentAlerts").default(true),
    messageAlerts: boolean("messageAlerts").default(true),
    missionAlerts: boolean("missionAlerts").default(true),
    promotionalAlerts: boolean("promotionalAlerts").default(false),
    weeklyDigest: boolean("weeklyDigest").default(true),
    quietHoursEnabled: boolean("quietHoursEnabled").default(false),
    quietHoursStart: varchar("quietHoursStart", { length: 5 }),
    quietHoursEnd: varchar("quietHoursEnd", { length: 5 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: unique("notification_pref_user_unique").on(table.userId),
  })
);

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

export const pushTokens = mysqlTable(
  "push_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    token: text("token").notNull(),
    platform: mysqlEnum("platform", ["ios", "android", "web"]).notNull(),
    deviceId: varchar("deviceId", { length: 255 }),
    deviceName: varchar("deviceName", { length: 255 }),
    isActive: boolean("isActive").default(true).notNull(),
    lastUsedAt: timestamp("lastUsedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("push_token_user_idx").on(table.userId),
    platformIdx: index("push_token_platform_idx").on(table.platform),
  })
);

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

export const conversationParticipants = mysqlTable(
  "conversation_participants",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversationId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["owner", "admin", "member", "guest"]).default("member").notNull(),
    nickname: varchar("nickname", { length: 100 }),
    lastReadAt: timestamp("lastReadAt"),
    lastSeenAt: timestamp("lastSeenAt"),
    unreadCount: int("unreadCount").default(0),
    isMuted: boolean("isMuted").default(false),
    mutedUntil: timestamp("mutedUntil"),
    isPinned: boolean("isPinned").default(false),
    isArchived: boolean("isArchived").default(false),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    leftAt: timestamp("leftAt"),
  },
  (table) => ({
    conversationIdx: index("conv_participant_conv_idx").on(table.conversationId),
    userIdx: index("conv_participant_user_idx").on(table.userId),
    convUserIdx: unique("conv_participant_unique").on(table.conversationId, table.userId),
  })
);

export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = typeof conversationParticipants.$inferInsert;

export const messageReactions = mysqlTable(
  "message_reactions",
  {
    id: int("id").autoincrement().primaryKey(),
    messageId: int("messageId").notNull(),
    userId: int("userId").notNull(),
    reaction: varchar("reaction", { length: 50 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    messageIdx: index("reaction_message_idx").on(table.messageId),
    userIdx: index("reaction_user_idx").on(table.userId),
    uniqueIdx: unique("reaction_unique").on(table.messageId, table.userId, table.reaction),
  })
);

export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = typeof messageReactions.$inferInsert;

export const messageAttachments = mysqlTable(
  "message_attachments",
  {
    id: int("id").autoincrement().primaryKey(),
    messageId: int("messageId").notNull(),
    type: mysqlEnum("type", ["image", "document", "audio", "video", "location"]).notNull(),
    fileName: varchar("fileName", { length: 255 }),
    fileUrl: text("fileUrl").notNull(),
    fileSize: int("fileSize"),
    mimeType: varchar("mimeType", { length: 100 }),
    thumbnailUrl: text("thumbnailUrl"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    messageIdx: index("attachment_message_idx").on(table.messageId),
    typeIdx: index("attachment_type_idx").on(table.type),
  })
);

export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type InsertMessageAttachment = typeof messageAttachments.$inferInsert;

// ============================================================================
// EXTENDED EUSOWALLET - P2P, CHAT PAYMENTS, CASH ADVANCES, INSTANT PAY
// ============================================================================

export const p2pTransfers = mysqlTable(
  "p2p_transfers",
  {
    id: int("id").autoincrement().primaryKey(),
    senderWalletId: int("senderWalletId").notNull(),
    recipientWalletId: int("recipientWalletId").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("USD"),
    fee: decimal("fee", { precision: 10, scale: 2 }).default("0"),
    note: text("note"),
    status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled", "refunded"]).default("pending").notNull(),
    transferType: mysqlEnum("transferType", ["standard", "instant", "scheduled"]).default("standard"),
    scheduledFor: timestamp("scheduledFor"),
    completedAt: timestamp("completedAt"),
    failureReason: text("failureReason"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    senderIdx: index("p2p_sender_idx").on(table.senderWalletId),
    recipientIdx: index("p2p_recipient_idx").on(table.recipientWalletId),
    statusIdx: index("p2p_status_idx").on(table.status),
    createdAtIdx: index("p2p_created_idx").on(table.createdAt),
  })
);

export type P2PTransfer = typeof p2pTransfers.$inferSelect;
export type InsertP2PTransfer = typeof p2pTransfers.$inferInsert;

export const chatPayments = mysqlTable(
  "chat_payments",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversationId").notNull(),
    messageId: int("messageId"),
    senderUserId: int("senderUserId").notNull(),
    recipientUserId: int("recipientUserId").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("USD"),
    paymentType: mysqlEnum("paymentType", ["direct", "request", "split", "tip"]).default("direct").notNull(),
    status: mysqlEnum("status", ["pending", "accepted", "completed", "declined", "expired", "cancelled"]).default("pending").notNull(),
    note: text("note"),
    expiresAt: timestamp("expiresAt"),
    completedAt: timestamp("completedAt"),
    p2pTransferId: int("p2pTransferId"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    conversationIdx: index("chat_payment_conv_idx").on(table.conversationId),
    senderIdx: index("chat_payment_sender_idx").on(table.senderUserId),
    recipientIdx: index("chat_payment_recipient_idx").on(table.recipientUserId),
    statusIdx: index("chat_payment_status_idx").on(table.status),
  })
);

export type ChatPayment = typeof chatPayments.$inferSelect;
export type InsertChatPayment = typeof chatPayments.$inferInsert;

export const cashAdvances = mysqlTable(
  "cash_advances",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    walletId: int("walletId").notNull(),
    loadId: int("loadId"),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
    feePercent: decimal("feePercent", { precision: 5, scale: 2 }),
    totalRepayment: decimal("totalRepayment", { precision: 12, scale: 2 }).notNull(),
    status: mysqlEnum("status", [
      "pending",
      "approved",
      "disbursed",
      "partially_repaid",
      "repaid",
      "defaulted",
      "cancelled",
    ]).default("pending").notNull(),
    repaidAmount: decimal("repaidAmount", { precision: 12, scale: 2 }).default("0"),
    approvedBy: int("approvedBy"),
    approvedAt: timestamp("approvedAt"),
    disbursedAt: timestamp("disbursedAt"),
    dueDate: timestamp("dueDate"),
    repaidAt: timestamp("repaidAt"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("cash_advance_user_idx").on(table.userId),
    walletIdx: index("cash_advance_wallet_idx").on(table.walletId),
    statusIdx: index("cash_advance_status_idx").on(table.status),
    loadIdx: index("cash_advance_load_idx").on(table.loadId),
  })
);

export type CashAdvance = typeof cashAdvances.$inferSelect;
export type InsertCashAdvance = typeof cashAdvances.$inferInsert;

export const instantPayRequests = mysqlTable(
  "instant_pay_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    walletId: int("walletId").notNull(),
    loadId: int("loadId"),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
    feePercent: decimal("feePercent", { precision: 5, scale: 2 }),
    netAmount: decimal("netAmount", { precision: 12, scale: 2 }).notNull(),
    status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending").notNull(),
    payoutMethodId: int("payoutMethodId"),
    processedAt: timestamp("processedAt"),
    failureReason: text("failureReason"),
    stripePayoutId: varchar("stripePayoutId", { length: 255 }),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("instant_pay_user_idx").on(table.userId),
    walletIdx: index("instant_pay_wallet_idx").on(table.walletId),
    statusIdx: index("instant_pay_status_idx").on(table.status),
    loadIdx: index("instant_pay_load_idx").on(table.loadId),
  })
);

export type InstantPayRequest = typeof instantPayRequests.$inferSelect;
export type InsertInstantPayRequest = typeof instantPayRequests.$inferInsert;

export const payrollRuns = mysqlTable(
  "payroll_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    periodStart: timestamp("periodStart").notNull(),
    periodEnd: timestamp("periodEnd").notNull(),
    status: mysqlEnum("status", ["draft", "pending", "processing", "completed", "failed", "cancelled"]).default("draft").notNull(),
    totalAmount: decimal("totalAmount", { precision: 14, scale: 2 }).notNull(),
    totalFees: decimal("totalFees", { precision: 10, scale: 2 }).default("0"),
    employeeCount: int("employeeCount").default(0),
    processedCount: int("processedCount").default(0),
    failedCount: int("failedCount").default(0),
    approvedBy: int("approvedBy"),
    approvedAt: timestamp("approvedAt"),
    processedAt: timestamp("processedAt"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("payroll_company_idx").on(table.companyId),
    statusIdx: index("payroll_status_idx").on(table.status),
    periodIdx: index("payroll_period_idx").on(table.periodStart, table.periodEnd),
  })
);

export type PayrollRun = typeof payrollRuns.$inferSelect;
export type InsertPayrollRun = typeof payrollRuns.$inferInsert;

export const payrollItems = mysqlTable(
  "payroll_items",
  {
    id: int("id").autoincrement().primaryKey(),
    payrollRunId: int("payrollRunId").notNull(),
    userId: int("userId").notNull(),
    walletId: int("walletId"),
    grossAmount: decimal("grossAmount", { precision: 12, scale: 2 }).notNull(),
    deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0"),
    bonuses: decimal("bonuses", { precision: 10, scale: 2 }).default("0"),
    netAmount: decimal("netAmount", { precision: 12, scale: 2 }).notNull(),
    status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
    paymentMethod: mysqlEnum("paymentMethod", ["wallet", "bank_transfer", "check"]).default("wallet"),
    processedAt: timestamp("processedAt"),
    failureReason: text("failureReason"),
    breakdown: json("breakdown").$type<{
      basePay: number;
      loadPay: number;
      mileagePay: number;
      bonuses: number;
      deductions: { type: string; amount: number }[];
    }>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    payrollRunIdx: index("payroll_item_run_idx").on(table.payrollRunId),
    userIdx: index("payroll_item_user_idx").on(table.userId),
    statusIdx: index("payroll_item_status_idx").on(table.status),
  })
);

export type PayrollItem = typeof payrollItems.$inferSelect;
export type InsertPayrollItem = typeof payrollItems.$inferInsert;

export const rewards = mysqlTable(
  "rewards",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("type", [
      "mission_completion",
      "badge_earned",
      "level_up",
      "crate_opened",
      "referral",
      "achievement",
      "seasonal",
      "bonus",
    ]).notNull(),
    sourceType: varchar("sourceType", { length: 50 }),
    sourceId: int("sourceId"),
    rewardType: mysqlEnum("rewardType", ["miles", "cash", "xp", "badge", "title", "fee_reduction", "priority_perk", "crate"]).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }),
    description: text("description"),
    status: mysqlEnum("status", ["pending", "claimed", "expired"]).default("pending").notNull(),
    claimedAt: timestamp("claimedAt"),
    expiresAt: timestamp("expiresAt"),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("reward_user_idx").on(table.userId),
    typeIdx: index("reward_type_idx").on(table.type),
    statusIdx: index("reward_status_idx").on(table.status),
    createdAtIdx: index("reward_created_idx").on(table.createdAt),
  })
);

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

// ============================================================================
// TELEMETRY & GPS TRACKING
// ============================================================================

export const locationHistory = mysqlTable(
  "location_history",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    deviceId: varchar("deviceId", { length: 100 }),
    loadId: int("loadId"),
    convoyId: int("convoyId"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    altitude: decimal("altitude", { precision: 10, scale: 2 }),
    speed: decimal("speed", { precision: 6, scale: 2 }),
    heading: decimal("heading", { precision: 5, scale: 2 }),
    horizontalAccuracy: decimal("horizontalAccuracy", { precision: 8, scale: 2 }),
    activityType: mysqlEnum("activityType", ["driving", "stationary", "walking", "unknown"]).default("unknown"),
    isMoving: boolean("isMoving").default(false),
    batteryLevel: int("batteryLevel"),
    provider: mysqlEnum("provider", ["gps", "network", "fused", "passive"]).default("fused"),
    isMocked: boolean("isMocked").default(false),
    deviceTimestamp: timestamp("deviceTimestamp").notNull(),
    serverTimestamp: timestamp("serverTimestamp").defaultNow().notNull(),
  },
  (table) => ({
    userTimeIdx: index("location_user_time_idx").on(table.userId, table.deviceTimestamp),
    loadTimeIdx: index("location_load_time_idx").on(table.loadId, table.deviceTimestamp),
  })
);

export type LocationHistory = typeof locationHistory.$inferSelect;
export type InsertLocationHistory = typeof locationHistory.$inferInsert;

// ============================================================================
// GEOFENCE EVENTS (extends existing geofences table)
// ============================================================================

export const geofenceEvents = mysqlTable(
  "geofence_events",
  {
    id: int("id").autoincrement().primaryKey(),
    geofenceId: int("geofenceId").notNull(),
    userId: int("userId").notNull(),
    loadId: int("loadId"),
    eventType: mysqlEnum("eventType", ["enter", "exit", "dwell", "approach"]).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    dwellSeconds: int("dwellSeconds"),
    actionsTriggered: json("actionsTriggered").$type<string[]>(),
    eventTimestamp: timestamp("eventTimestamp").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    geofenceIdx: index("geofence_event_geofence_idx").on(table.geofenceId),
    userIdx: index("geofence_event_user_idx").on(table.userId),
  })
);

export type GeofenceEvent = typeof geofenceEvents.$inferSelect;
export type InsertGeofenceEvent = typeof geofenceEvents.$inferInsert;

// ============================================================================
// ROUTES & NAVIGATION
// ============================================================================

export const routes = mysqlTable(
  "routes",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId").notNull(),
    distanceMiles: decimal("distanceMiles", { precision: 10, scale: 2 }).notNull(),
    durationMinutes: int("durationMinutes").notNull(),
    durationInTraffic: int("durationInTraffic"),
    polyline: text("polyline").notNull(),
    vehicleProfile: json("vehicleProfile").$type<{
      height?: number; width?: number; length?: number; weight?: number;
      axles?: number; hazmatClass?: string; isOversize?: boolean; isOverweight?: boolean;
    }>(),
    hazmatRestrictions: json("hazmatRestrictions"),
    heightRestrictions: json("heightRestrictions"),
    weightRestrictions: json("weightRestrictions"),
    requiredBreaks: json("requiredBreaks"),
    fuelStops: json("fuelStops"),
    estimatedFuelCost: decimal("estimatedFuelCost", { precision: 10, scale: 2 }),
    tollCost: decimal("tollCost", { precision: 10, scale: 2 }),
    status: mysqlEnum("status", ["planned", "active", "completed", "cancelled"]).default("planned").notNull(),
    calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    loadIdx: index("route_load_idx").on(table.loadId),
    statusIdx: index("route_status_idx").on(table.status),
  })
);

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;

export const routeWaypoints = mysqlTable(
  "route_waypoints",
  {
    id: int("id").autoincrement().primaryKey(),
    routeId: int("routeId").notNull(),
    sequence: int("sequence").notNull(),
    type: mysqlEnum("type", ["origin", "stop", "rest", "fuel", "scale", "inspection", "destination"]).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    address: varchar("address", { length: 500 }),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    plannedArrival: timestamp("plannedArrival"),
    plannedDeparture: timestamp("plannedDeparture"),
    actualArrival: timestamp("actualArrival"),
    actualDeparture: timestamp("actualDeparture"),
    dwellMinutes: int("dwellMinutes"),
    status: mysqlEnum("status", ["upcoming", "approaching", "arrived", "departed", "skipped"]).default("upcoming").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    routeSeqIdx: index("waypoint_route_seq_idx").on(table.routeId, table.sequence),
  })
);

export type RouteWaypoint = typeof routeWaypoints.$inferSelect;
export type InsertRouteWaypoint = typeof routeWaypoints.$inferInsert;

// ============================================================================
// CONVOYS
// ============================================================================

export const convoys = mysqlTable(
  "convoys",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId").notNull(),
    routeId: int("routeId"),
    leadUserId: int("leadUserId").notNull(),
    loadUserId: int("loadUserId").notNull(),
    rearUserId: int("rearUserId"),
    status: mysqlEnum("status", ["forming", "active", "paused", "completed", "disbanded"]).default("forming").notNull(),
    targetLeadDistanceMeters: int("targetLeadDistanceMeters").default(800),
    targetRearDistanceMeters: int("targetRearDistanceMeters").default(500),
    maxSpeedMph: int("maxSpeedMph").default(45),
    currentLeadDistance: int("currentLeadDistance"),
    currentRearDistance: int("currentRearDistance"),
    lastPositionUpdate: timestamp("lastPositionUpdate"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    loadIdx: index("convoy_load_idx").on(table.loadId),
    statusIdx: index("convoy_status_idx").on(table.status),
  })
);

export type Convoy = typeof convoys.$inferSelect;
export type InsertConvoy = typeof convoys.$inferInsert;

// ============================================================================
// ETA TRACKING
// ============================================================================

export const etaHistory = mysqlTable(
  "eta_history",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId").notNull(),
    waypointId: int("waypointId"),
    destination: varchar("destination", { length: 500 }),
    predictedEta: timestamp("predictedEta").notNull(),
    remainingMiles: decimal("remainingMiles", { precision: 10, scale: 2 }),
    remainingMinutes: int("remainingMinutes"),
    confidence: mysqlEnum("confidence", ["high", "medium", "low"]).default("medium"),
    previousEta: timestamp("previousEta"),
    changeMinutes: int("changeMinutes"),
    changeReason: mysqlEnum("changeReason", ["traffic", "weather", "stop", "route_change", "recalculation", "initial", "deviation", "delay"]),
    currentLat: decimal("currentLat", { precision: 10, scale: 8 }),
    currentLng: decimal("currentLng", { precision: 11, scale: 8 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    loadIdx: index("eta_load_idx").on(table.loadId, table.createdAt),
  })
);

export type EtaHistory = typeof etaHistory.$inferSelect;
export type InsertEtaHistory = typeof etaHistory.$inferInsert;

// ============================================================================
// SPEED & SAFETY EVENTS
// ============================================================================

export const speedEvents = mysqlTable(
  "speed_events",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    loadId: int("loadId"),
    recordedSpeed: decimal("recordedSpeed", { precision: 6, scale: 2 }).notNull(),
    speedLimit: decimal("speedLimit", { precision: 6, scale: 2 }),
    overage: decimal("overage", { precision: 6, scale: 2 }),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    roadName: varchar("roadName", { length: 200 }),
    durationSeconds: int("durationSeconds").notNull(),
    severity: mysqlEnum("severity", ["minor", "moderate", "severe"]).default("minor"),
    eventTimestamp: timestamp("eventTimestamp").notNull(),
    acknowledged: boolean("acknowledged").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("speed_user_idx").on(table.userId, table.eventTimestamp),
    loadIdx: index("speed_load_idx").on(table.loadId),
  })
);

export type SpeedEvent = typeof speedEvents.$inferSelect;
export type InsertSpeedEvent = typeof speedEvents.$inferInsert;

export const safetyAlerts = mysqlTable(
  "safety_alerts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    loadId: int("loadId"),
    type: mysqlEnum("type", ["sos", "geofence_violation", "speeding", "harsh_braking", "rapid_acceleration", "fatigue", "deviation", "no_signal"]).notNull(),
    severity: mysqlEnum("severity", ["info", "warning", "critical", "emergency"]).default("warning").notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    message: text("message"),
    metadata: json("metadata"),
    status: mysqlEnum("status", ["active", "acknowledged", "resolved", "false_alarm"]).default("active").notNull(),
    acknowledgedBy: int("acknowledgedBy"),
    acknowledgedAt: timestamp("acknowledgedAt"),
    resolvedAt: timestamp("resolvedAt"),
    eventTimestamp: timestamp("eventTimestamp").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("safety_user_idx").on(table.userId),
    typeIdx: index("safety_type_idx").on(table.type),
    statusIdx: index("safety_status_idx").on(table.status),
  })
);

export type SafetyAlert = typeof safetyAlerts.$inferSelect;
export type InsertSafetyAlert = typeof safetyAlerts.$inferInsert;

// ============================================================================
// ZEUN MECHANICS SYSTEM - AI-Powered Breakdown, Diagnostic & Repair Platform
// ============================================================================

// BREAKDOWN REPORTS
export const zeunBreakdownReports = mysqlTable(
  "zeun_breakdown_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    driverId: int("driverId").notNull(),
    vehicleId: int("vehicleId"),
    companyId: int("companyId"),
    loadId: int("loadId"),
    issueCategory: mysqlEnum("issueCategory", ["ENGINE", "BRAKES", "TRANSMISSION", "ELECTRICAL", "TIRES", "FUEL_SYSTEM", "COOLING", "EXHAUST", "STEERING", "SUSPENSION", "HVAC", "OTHER"]).notNull(),
    severity: mysqlEnum("severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).notNull(),
    symptoms: json("symptoms").$type<string[]>().notNull(),
    canDrive: boolean("canDrive").notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    address: varchar("address", { length: 500 }),
    vehicleVin: varchar("vehicleVin", { length: 17 }),
    faultCodes: json("faultCodes").$type<string[]>(),
    driverNotes: text("driverNotes"),
    photos: json("photos").$type<string[]>(),
    videos: json("videos").$type<string[]>(),
    loadStatus: mysqlEnum("loadStatus", ["EMPTY", "LOADED", "HAZMAT"]),
    cargoType: varchar("cargoType", { length: 255 }),
    isHazmat: boolean("isHazmat").default(false),
    hazmatClass: varchar("hazmatClass", { length: 50 }),
    fuelLevelPercent: int("fuelLevelPercent"),
    defLevelPercent: int("defLevelPercent"),
    oilPressurePsi: int("oilPressurePsi"),
    coolantTempF: int("coolantTempF"),
    batteryVoltage: decimal("batteryVoltage", { precision: 4, scale: 2 }),
    currentOdometer: int("currentOdometer"),
    status: mysqlEnum("status", ["REPORTED", "DIAGNOSED", "ACKNOWLEDGED", "EN_ROUTE_TO_SHOP", "AT_SHOP", "UNDER_REPAIR", "WAITING_PARTS", "RESOLVED", "CANCELLED"]).default("REPORTED").notNull(),
    selectedProviderId: int("selectedProviderId"),
    actualCost: decimal("actualCost", { precision: 10, scale: 2 }),
    resolvedAt: timestamp("resolvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    driverIdx: index("zeun_breakdown_driver_idx").on(table.driverId),
    companyIdx: index("zeun_breakdown_company_idx").on(table.companyId),
    statusIdx: index("zeun_breakdown_status_idx").on(table.status),
    severityIdx: index("zeun_breakdown_severity_idx").on(table.severity),
  })
);

// DIAGNOSTIC RESULTS
export const zeunDiagnosticResults = mysqlTable(
  "zeun_diagnostic_results",
  {
    id: int("id").autoincrement().primaryKey(),
    breakdownReportId: int("breakdownReportId").notNull(),
    confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
    primaryDiagnosis: json("primaryDiagnosis").$type<{ issue: string; probability: number; severity: string; description: string }>().notNull(),
    alternativeDiagnoses: json("alternativeDiagnoses").$type<Array<{ issue: string; probability: number; severity: string }>>(),
    recommendedActions: json("recommendedActions").$type<string[]>(),
    emergencyProcedures: json("emergencyProcedures").$type<Array<{ title: string; severity: string; steps: string[] }>>(),
    canDrive: boolean("canDrive").notNull(),
    outOfService: boolean("outOfService").default(false),
    estimatedCostMin: decimal("estimatedCostMin", { precision: 10, scale: 2 }),
    estimatedCostMax: decimal("estimatedCostMax", { precision: 10, scale: 2 }),
    estimatedRepairTimeMin: int("estimatedRepairTimeMin"),
    estimatedRepairTimeMax: int("estimatedRepairTimeMax"),
    processingTimeMs: int("processingTimeMs"),
    aiModel: varchar("aiModel", { length: 50 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    breakdownIdx: index("zeun_diagnostic_breakdown_idx").on(table.breakdownReportId),
  })
);

// REPAIR PROVIDERS
export const zeunRepairProviders = mysqlTable(
  "zeun_repair_providers",
  {
    id: int("id").autoincrement().primaryKey(),
    externalId: varchar("externalId", { length: 100 }),
    source: mysqlEnum("source", ["GOOGLE", "YELP", "CHAIN", "MANUAL"]).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    providerType: mysqlEnum("providerType", ["TRUCK_STOP", "DEALER", "INDEPENDENT", "MOBILE", "TOWING", "TIRE_SHOP"]).notNull(),
    chainName: varchar("chainName", { length: 100 }),
    address: varchar("address", { length: 500 }),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 2 }),
    zip: varchar("zip", { length: 10 }),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    phone: varchar("phone", { length: 20 }),
    website: varchar("website", { length: 500 }),
    email: varchar("email", { length: 255 }),
    services: json("services").$type<string[]>(),
    certifications: json("certifications").$type<string[]>(),
    oemBrands: json("oemBrands").$type<string[]>(),
    available24x7: boolean("available24x7").default(false),
    hasMobileService: boolean("hasMobileService").default(false),
    acceptsCreditCard: boolean("acceptsCreditCard").default(true),
    acceptsFleetAccounts: boolean("acceptsFleetAccounts").default(false),
    rating: decimal("rating", { precision: 3, scale: 2 }),
    reviewCount: int("reviewCount").default(0),
    zeunRating: decimal("zeunRating", { precision: 3, scale: 2 }),
    zeunReviewCount: int("zeunReviewCount").default(0),
    averageWaitTimeMinutes: int("averageWaitTimeMinutes"),
    jobsCompleted: int("jobsCompleted").default(0),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastVerified: timestamp("lastVerified"),
  },
  (table) => ({
    typeStateIdx: index("zeun_provider_type_state_idx").on(table.providerType, table.state),
    chainIdx: index("zeun_provider_chain_idx").on(table.chainName),
    ratingIdx: index("zeun_provider_rating_idx").on(table.rating),
  })
);

// PROVIDER REVIEWS
export const zeunProviderReviews = mysqlTable(
  "zeun_provider_reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    providerId: int("providerId").notNull(),
    userId: int("userId").notNull(),
    breakdownReportId: int("breakdownReportId"),
    rating: decimal("rating", { precision: 3, scale: 2 }).notNull(),
    title: varchar("title", { length: 255 }),
    reviewText: text("reviewText"),
    serviceType: varchar("serviceType", { length: 50 }),
    waitTimeMinutes: int("waitTimeMinutes"),
    costAccuracy: mysqlEnum("costAccuracy", ["LOWER", "AS_QUOTED", "HIGHER"]),
    wouldRecommend: boolean("wouldRecommend"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    providerIdx: index("zeun_review_provider_idx").on(table.providerId),
    userIdx: index("zeun_review_user_idx").on(table.userId),
  })
);

// MAINTENANCE LOGS
export const zeunMaintenanceLogs = mysqlTable(
  "zeun_maintenance_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    vehicleId: int("vehicleId").notNull(),
    driverId: int("driverId"),
    companyId: int("companyId"),
    serviceType: varchar("serviceType", { length: 50 }).notNull(),
    serviceDate: timestamp("serviceDate").notNull(),
    odometerAtService: int("odometerAtService").notNull(),
    cost: decimal("cost", { precision: 10, scale: 2 }),
    providerName: varchar("providerName", { length: 255 }),
    providerId: int("providerId"),
    partsReplaced: json("partsReplaced").$type<string[]>(),
    laborHours: decimal("laborHours", { precision: 5, scale: 2 }),
    invoiceUrl: varchar("invoiceUrl", { length: 500 }),
    notes: text("notes"),
    breakdownReportId: int("breakdownReportId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    vehicleIdx: index("zeun_maint_vehicle_idx").on(table.vehicleId),
    companyIdx: index("zeun_maint_company_idx").on(table.companyId),
    serviceTypeIdx: index("zeun_maint_service_idx").on(table.serviceType),
    serviceDateIdx: index("zeun_maint_date_idx").on(table.serviceDate),
  })
);

// MAINTENANCE SCHEDULES
export const zeunMaintenanceSchedules = mysqlTable(
  "zeun_maintenance_schedules",
  {
    id: int("id").autoincrement().primaryKey(),
    vehicleId: int("vehicleId").notNull(),
    serviceType: varchar("serviceType", { length: 50 }).notNull(),
    intervalMiles: int("intervalMiles"),
    intervalDays: int("intervalDays"),
    lastServiceDate: timestamp("lastServiceDate"),
    lastServiceOdometer: int("lastServiceOdometer"),
    nextDueDate: timestamp("nextDueDate"),
    nextDueOdometer: int("nextDueOdometer"),
    estimatedCostMin: decimal("estimatedCostMin", { precision: 10, scale: 2 }),
    estimatedCostMax: decimal("estimatedCostMax", { precision: 10, scale: 2 }),
    isOverdue: boolean("isOverdue").default(false),
    priority: mysqlEnum("priority", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    vehicleIdx: index("zeun_sched_vehicle_idx").on(table.vehicleId),
    serviceTypeIdx: index("zeun_sched_service_idx").on(table.serviceType),
    overdueIdx: index("zeun_sched_overdue_idx").on(table.isOverdue),
  })
);

// VEHICLE RECALLS
export const zeunVehicleRecalls = mysqlTable(
  "zeun_vehicle_recalls",
  {
    id: int("id").autoincrement().primaryKey(),
    vehicleId: int("vehicleId").notNull(),
    campaignNumber: varchar("campaignNumber", { length: 50 }).notNull(),
    manufacturer: varchar("manufacturer", { length: 100 }),
    component: varchar("component", { length: 100 }),
    summary: text("summary"),
    consequence: text("consequence"),
    remedy: text("remedy"),
    recallDate: timestamp("recallDate"),
    isCompleted: boolean("isCompleted").default(false),
    completionDate: timestamp("completionDate"),
    completionProviderId: int("completionProviderId"),
    completionNotes: text("completionNotes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    vehicleIdx: index("zeun_recall_vehicle_idx").on(table.vehicleId),
    campaignIdx: index("zeun_recall_campaign_idx").on(table.campaignNumber),
    completedIdx: index("zeun_recall_completed_idx").on(table.isCompleted),
  })
);

// BREAKDOWN STATUS HISTORY
export const zeunBreakdownStatusHistory = mysqlTable(
  "zeun_breakdown_status_history",
  {
    id: int("id").autoincrement().primaryKey(),
    breakdownReportId: int("breakdownReportId").notNull(),
    previousStatus: varchar("previousStatus", { length: 50 }),
    newStatus: varchar("newStatus", { length: 50 }).notNull(),
    changedByUserId: int("changedByUserId"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    breakdownIdx: index("zeun_status_breakdown_idx").on(table.breakdownReportId),
  })
);

// FLEET MAINTENANCE SCHEDULES (custom per fleet)
export const zeunFleetMaintenanceSchedules = mysqlTable(
  "zeun_fleet_maintenance_schedules",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    serviceType: varchar("serviceType", { length: 50 }).notNull(),
    intervalMiles: int("intervalMiles"),
    intervalDays: int("intervalDays"),
    estimatedCostMin: decimal("estimatedCostMin", { precision: 10, scale: 2 }),
    estimatedCostMax: decimal("estimatedCostMax", { precision: 10, scale: 2 }),
    preferredProviderId: int("preferredProviderId"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyServiceIdx: index("zeun_fleet_company_service_idx").on(table.companyId, table.serviceType),
  })
);

export type ZeunBreakdownReport = typeof zeunBreakdownReports.$inferSelect;
export type InsertZeunBreakdownReport = typeof zeunBreakdownReports.$inferInsert;
export type ZeunDiagnosticResult = typeof zeunDiagnosticResults.$inferSelect;
export type ZeunRepairProvider = typeof zeunRepairProviders.$inferSelect;
export type ZeunProviderReview = typeof zeunProviderReviews.$inferSelect;
export type ZeunMaintenanceLog = typeof zeunMaintenanceLogs.$inferSelect;
export type ZeunMaintenanceSchedule = typeof zeunMaintenanceSchedules.$inferSelect;
export type ZeunVehicleRecall = typeof zeunVehicleRecalls.$inferSelect;

// ============================================================================
// DASHBOARD WIDGET SYSTEM
// ============================================================================

export const dashboardLayouts = mysqlTable(
  "dashboard_layouts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    role: varchar("role", { length: 50 }).notNull(),
    layoutJson: json("layoutJson").$type<Array<{ widgetId: string; x: number; y: number; w: number; h: number }>>(),
    isDefault: boolean("isDefault").default(false),
    name: varchar("name", { length: 100 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userRoleIdx: index("dashboard_layout_user_role_idx").on(table.userId, table.role),
  })
);

export const dashboardWidgets = mysqlTable(
  "dashboard_widgets",
  {
    id: int("id").autoincrement().primaryKey(),
    widgetKey: varchar("widgetKey", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    category: mysqlEnum("category", [
      "analytics", "operations", "financial", "communication", "productivity",
      "safety", "compliance", "performance", "planning", "tracking", "reporting", "management", "system"
    ]).notNull(),
    defaultWidth: int("defaultWidth").default(2),
    defaultHeight: int("defaultHeight").default(2),
    minWidth: int("minWidth").default(1),
    minHeight: int("minHeight").default(1),
    maxWidth: int("maxWidth").default(4),
    maxHeight: int("maxHeight").default(4),
    rolesAllowed: json("rolesAllowed").$type<string[]>(),
    isActive: boolean("isActive").default(true),
    componentPath: varchar("componentPath", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("dashboard_widget_category_idx").on(table.category),
  })
);

export const widgetConfigurations = mysqlTable(
  "widget_configurations",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    widgetId: int("widgetId").notNull(),
    positionX: int("positionX").default(0),
    positionY: int("positionY").default(0),
    width: int("width").default(2),
    height: int("height").default(2),
    settings: json("settings").$type<Record<string, unknown>>(),
    isVisible: boolean("isVisible").default(true),
    refreshInterval: int("refreshInterval").default(60),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userWidgetIdx: index("widget_config_user_widget_idx").on(table.userId, table.widgetId),
  })
);

// ============================================================================
// FEE & REVENUE MANAGEMENT SYSTEM
// ============================================================================

export const feeConfigurations = mysqlTable(
  "fee_configurations",
  {
    id: int("id").autoincrement().primaryKey(),
    feeType: varchar("feeType", { length: 100 }).notNull().unique(),
    category: mysqlEnum("category", [
      "LOAD_TRANSACTION", "FINANCIAL_SERVICE", "PAYMENT_PROCESSING",
      "WALLET_TRANSFER", "TERMINAL_SERVICE", "SUBSCRIPTION", "PREMIUM_FEATURE"
    ]).notNull(),
    description: text("description"),
    baseRate: decimal("baseRate", { precision: 8, scale: 4 }).notNull(),
    minFee: decimal("minFee", { precision: 10, scale: 2 }),
    maxFee: decimal("maxFee", { precision: 10, scale: 2 }),
    flatFee: decimal("flatFee", { precision: 10, scale: 2 }),
    isPercentage: boolean("isPercentage").default(true),
    isActive: boolean("isActive").default(true),
    effectiveFrom: timestamp("effectiveFrom"),
    effectiveTo: timestamp("effectiveTo"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("fee_config_category_idx").on(table.category),
    typeIdx: index("fee_config_type_idx").on(table.feeType),
  })
);

export const feeCalculations = mysqlTable(
  "fee_calculations",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionId: varchar("transactionId", { length: 100 }).notNull(),
    transactionType: varchar("transactionType", { length: 50 }).notNull(),
    feeConfigId: int("feeConfigId").notNull(),
    baseAmount: decimal("baseAmount", { precision: 12, scale: 2 }).notNull(),
    calculatedFee: decimal("calculatedFee", { precision: 10, scale: 2 }).notNull(),
    discountApplied: decimal("discountApplied", { precision: 10, scale: 2 }).default("0"),
    finalFee: decimal("finalFee", { precision: 10, scale: 2 }).notNull(),
    userId: int("userId"),
    companyId: int("companyId"),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    transactionIdx: index("fee_calc_transaction_idx").on(table.transactionId),
    userIdx: index("fee_calc_user_idx").on(table.userId),
  })
);

export const feeAuditLog = mysqlTable(
  "fee_audit_log",
  {
    id: int("id").autoincrement().primaryKey(),
    feeConfigId: int("feeConfigId").notNull(),
    changedBy: int("changedBy").notNull(),
    action: mysqlEnum("action", ["CREATE", "UPDATE", "DELETE", "ACTIVATE", "DEACTIVATE"]).notNull(),
    oldValue: json("oldValue").$type<Record<string, unknown>>(),
    newValue: json("newValue").$type<Record<string, unknown>>(),
    reason: text("reason"),
    ipAddress: varchar("ipAddress", { length: 45 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    configIdx: index("fee_audit_config_idx").on(table.feeConfigId),
    changedByIdx: index("fee_audit_changed_by_idx").on(table.changedBy),
  })
);

// ============================================================================
// MESSAGING SYSTEM - CHANNELS & READ RECEIPTS
// ============================================================================

export const groupChannels = mysqlTable(
  "group_channels",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", [
      "GENERAL", "ANNOUNCEMENTS", "DEPARTMENT", "PROJECT", "DRIVERS", "COMPLIANCE", "SAFETY", "CUSTOM"
    ]).notNull(),
    visibility: mysqlEnum("visibility", ["PUBLIC", "PRIVATE", "SHARED"]).default("PUBLIC"),
    createdBy: int("createdBy").notNull(),
    isArchived: boolean("isArchived").default(false),
    settings: json("settings").$type<{ postPermissions?: string[]; muteNotifications?: boolean }>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("channel_company_idx").on(table.companyId),
    typeIdx: index("channel_type_idx").on(table.type),
  })
);

export const channelMembers = mysqlTable(
  "channel_members",
  {
    id: int("id").autoincrement().primaryKey(),
    channelId: int("channelId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["OWNER", "ADMIN", "MODERATOR", "MEMBER", "GUEST"]).default("MEMBER"),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    lastReadAt: timestamp("lastReadAt"),
    isMuted: boolean("isMuted").default(false),
    notificationPreference: mysqlEnum("notificationPreference", ["ALL", "MENTIONS", "NONE"]).default("ALL"),
  },
  (table) => ({
    channelUserIdx: index("channel_member_idx").on(table.channelId, table.userId),
  })
);

export const messageReadReceipts = mysqlTable(
  "message_read_receipts",
  {
    id: int("id").autoincrement().primaryKey(),
    messageId: int("messageId").notNull(),
    userId: int("userId").notNull(),
    readAt: timestamp("readAt").defaultNow().notNull(),
  },
  (table) => ({
    messageUserIdx: index("read_receipt_msg_user_idx").on(table.messageId, table.userId),
  })
);

// ============================================================================
// GAMIFICATION SYSTEM - GUILDS, LOOT, INVENTORY
// ============================================================================

export const guilds = mysqlTable(
  "guilds",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    level: int("level").default(1),
    totalMiles: bigint("totalMiles", { mode: "number" }).default(0),
    memberCount: int("memberCount").default(0),
    maxMembers: int("maxMembers").default(100),
    emblem: varchar("emblem", { length: 255 }),
    bannerColor: varchar("bannerColor", { length: 20 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("guild_company_idx").on(table.companyId),
    levelIdx: index("guild_level_idx").on(table.level),
  })
);

export const guildMembers = mysqlTable(
  "guild_members",
  {
    id: int("id").autoincrement().primaryKey(),
    guildId: int("guildId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["LEADER", "OFFICER", "VETERAN", "MEMBER", "RECRUIT"]).default("MEMBER"),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    contributedMiles: bigint("contributedMiles", { mode: "number" }).default(0),
    weeklyContribution: int("weeklyContribution").default(0),
  },
  (table) => ({
    guildUserIdx: index("guild_member_idx").on(table.guildId, table.userId),
  })
);

export const milesTransactions = mysqlTable(
  "miles_transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    amount: int("amount").notNull(),
    type: mysqlEnum("type", ["EARN", "SPEND", "BONUS", "PENALTY", "TRANSFER", "SEASONAL_RESET"]).notNull(),
    source: varchar("source", { length: 100 }).notNull(),
    referenceId: varchar("referenceId", { length: 100 }),
    referenceType: varchar("referenceType", { length: 50 }),
    description: text("description"),
    balanceAfter: bigint("balanceAfter", { mode: "number" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("miles_tx_user_idx").on(table.userId),
    typeIdx: index("miles_tx_type_idx").on(table.type),
    sourceIdx: index("miles_tx_source_idx").on(table.source),
  })
);

export const lootCrates = mysqlTable(
  "loot_crates",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    tier: mysqlEnum("tier", ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"]).notNull(),
    source: varchar("source", { length: 100 }).notNull(),
    sourceReferenceId: varchar("sourceReferenceId", { length: 100 }),
    contentsJson: json("contentsJson").$type<Array<{ itemType: string; itemId: string; quantity: number }>>(),
    isOpened: boolean("isOpened").default(false),
    openedAt: timestamp("openedAt"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("loot_crate_user_idx").on(table.userId),
    tierIdx: index("loot_crate_tier_idx").on(table.tier),
  })
);

export const userInventory = mysqlTable(
  "user_inventory",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    itemId: varchar("itemId", { length: 100 }).notNull(),
    itemType: mysqlEnum("itemType", [
      "COSMETIC", "BOOST", "TITLE", "BADGE", "EMOTE", "FRAME", "CONSUMABLE", "CURRENCY"
    ]).notNull(),
    itemName: varchar("itemName", { length: 100 }).notNull(),
    rarity: mysqlEnum("rarity", ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"]).notNull(),
    quantity: int("quantity").default(1),
    isEquipped: boolean("isEquipped").default(false),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    acquiredAt: timestamp("acquiredAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"),
  },
  (table) => ({
    userItemIdx: index("inventory_user_item_idx").on(table.userId, table.itemId),
    typeIdx: index("inventory_type_idx").on(table.itemType),
  })
);

// ============================================================================
// ESCROW & PAYMENT METHODS
// ============================================================================

export const escrowHolds = mysqlTable(
  "escrow_holds",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    shipperWalletId: int("shipperWalletId").notNull(),
    catalystWalletId: int("catalystWalletId").notNull(),
    status: mysqlEnum("status", ["HELD", "RELEASED", "REFUNDED", "DISPUTED", "PARTIAL_RELEASE"]).default("HELD"),
    releasedAmount: decimal("releasedAmount", { precision: 12, scale: 2 }),
    releasedAt: timestamp("releasedAt"),
    releaseReason: text("releaseReason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    loadIdx: index("escrow_load_idx").on(table.loadId),
    statusIdx: index("escrow_status_idx").on(table.status),
  })
);

export const paymentMethods = mysqlTable(
  "payment_methods",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    stripePaymentMethodId: varchar("stripePaymentMethodId", { length: 100 }),
    type: mysqlEnum("type", ["CARD", "BANK_ACCOUNT", "ACH", "WIRE"]).notNull(),
    lastFour: varchar("lastFour", { length: 4 }),
    brand: varchar("brand", { length: 50 }),
    expiryMonth: int("expiryMonth"),
    expiryYear: int("expiryYear"),
    isDefault: boolean("isDefault").default(false),
    isVerified: boolean("isVerified").default(false),
    nickname: varchar("nickname", { length: 50 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("payment_method_user_idx").on(table.userId),
  })
);

// ============================================================================
// EUSOCONNECT - INTEGRATION PROVIDERS
// ============================================================================

export const integrationProviders = mysqlTable(
  "integration_providers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull().unique(),
    displayName: varchar("displayName", { length: 255 }).notNull(),
    description: text("description"),
    logoUrl: varchar("logoUrl", { length: 500 }),
    websiteUrl: varchar("websiteUrl", { length: 500 }),
    category: mysqlEnum("category", [
      "insurance", "compliance", "terminal", "eld", "fuel", "banking", "government"
    ]).notNull(),
    subcategory: varchar("subcategory", { length: 50 }),
    authType: mysqlEnum("authType", [
      "oauth2", "api_key", "api_key_secret", "oauth2_with_id", "credentials"
    ]).notNull(),
    oauthAuthorizeUrl: varchar("oauthAuthorizeUrl", { length: 500 }),
    oauthTokenUrl: varchar("oauthTokenUrl", { length: 500 }),
    oauthScopes: json("oauthScopes").$type<string[]>().default([]),
    requiresExternalId: boolean("requiresExternalId").default(false),
    externalIdLabel: varchar("externalIdLabel", { length: 100 }),
    externalIdFormat: varchar("externalIdFormat", { length: 100 }),
    apiBaseUrl: varchar("apiBaseUrl", { length: 500 }),
    apiVersion: varchar("apiVersion", { length: 20 }),
    rateLimitRequests: int("rateLimitRequests").default(100),
    rateLimitWindowSeconds: int("rateLimitWindowSeconds").default(60),
    supportsWebhooks: boolean("supportsWebhooks").default(false),
    webhookEvents: json("webhookEvents").$type<string[]>().default([]),
    dataTypesAvailable: json("dataTypesAvailable").$type<string[]>().default([]),
    syncFrequencyMinutes: int("syncFrequencyMinutes").default(60),
    supportsRealtime: boolean("supportsRealtime").default(false),
    fieldMappings: json("fieldMappings").$type<Record<string, string>>().default({}),
    entityMappings: json("entityMappings").$type<Record<string, string>>().default({}),
    status: mysqlEnum("status", ["active", "beta", "deprecated", "coming_soon"]).default("active"),
    isPremium: boolean("isPremium").default(false),
    availableForRoles: json("availableForRoles").$type<string[]>().default(["CATALYST", "SHIPPER", "BROKER"]),
    setupInstructions: text("setupInstructions"),
    documentationUrl: varchar("documentationUrl", { length: 500 }),
    supportEmail: varchar("supportEmail", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("provider_category_idx").on(table.category),
    slugIdx: index("provider_slug_idx").on(table.slug),
    statusIdx: index("provider_status_idx").on(table.status),
  })
);

// ============================================================================
// EUSOCONNECT - INTEGRATION CONNECTIONS
// ============================================================================

export const integrationConnections = mysqlTable(
  "integration_connections",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    userId: int("userId").notNull(),
    providerId: int("providerId").notNull(),
    providerSlug: varchar("providerSlug", { length: 50 }).notNull(),
    authType: varchar("authType", { length: 30 }).notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    apiKey: text("apiKey"),
    apiSecret: text("apiSecret"),
    externalId: varchar("externalId", { length: 255 }),
    tokenExpiresAt: timestamp("tokenExpiresAt"),
    tokenScopes: json("tokenScopes").$type<string[]>().default([]),
    status: mysqlEnum("status", [
      "pending", "connected", "syncing", "error", "disconnected", "expired"
    ]).default("pending"),
    lastConnectedAt: timestamp("lastConnectedAt"),
    lastSyncAt: timestamp("lastSyncAt"),
    lastError: text("lastError"),
    errorCount: int("errorCount").default(0),
    syncEnabled: boolean("syncEnabled").default(true),
    syncFrequencyMinutes: int("syncFrequencyMinutes"),
    syncDataTypes: json("syncDataTypes").$type<string[]>().default([]),
    totalRecordsSynced: int("totalRecordsSynced").default(0),
    lastRecordsSynced: int("lastRecordsSynced").default(0),
    webhookUrl: varchar("webhookUrl", { length: 500 }),
    webhookSecret: varchar("webhookSecret", { length: 255 }),
    webhookEnabled: boolean("webhookEnabled").default(false),
    connectionMetadata: json("connectionMetadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    connectedBy: int("connectedBy"),
  },
  (table) => ({
    companyIdx: index("connection_company_idx").on(table.companyId),
    providerIdx: index("connection_provider_idx").on(table.providerSlug),
    statusIdx: index("connection_status_idx").on(table.status),
    companyProviderIdx: unique("connection_company_provider_idx").on(table.companyId, table.providerSlug),
  })
);

// ============================================================================
// EUSOCONNECT - SYNC LOGS
// ============================================================================

export const integrationSyncLogs = mysqlTable(
  "integration_sync_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    connectionId: int("connectionId").notNull(),
    syncType: mysqlEnum("syncType", ["full", "incremental", "webhook", "manual"]).notNull(),
    dataType: varchar("dataType", { length: 50 }),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    durationMs: int("durationMs"),
    status: mysqlEnum("status", ["running", "completed", "failed", "partial"]).notNull(),
    recordsFetched: int("recordsFetched").default(0),
    recordsCreated: int("recordsCreated").default(0),
    recordsUpdated: int("recordsUpdated").default(0),
    recordsFailed: int("recordsFailed").default(0),
    errorMessage: text("errorMessage"),
    errorDetails: json("errorDetails").$type<Record<string, unknown>>(),
    triggeredBy: varchar("triggeredBy", { length: 50 }),
    triggeredByUserId: int("triggeredByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    connectionIdx: index("sync_log_connection_idx").on(table.connectionId),
    statusIdx: index("sync_log_status_idx").on(table.status),
  })
);

// ============================================================================
// EUSOCONNECT - SYNCED RECORDS
// ============================================================================

export const integrationSyncedRecords = mysqlTable(
  "integration_synced_records",
  {
    id: int("id").autoincrement().primaryKey(),
    connectionId: int("connectionId").notNull(),
    externalId: varchar("externalId", { length: 255 }).notNull(),
    externalType: varchar("externalType", { length: 100 }).notNull(),
    externalData: json("externalData").$type<Record<string, unknown>>(),
    internalTable: varchar("internalTable", { length: 100 }).notNull(),
    internalId: int("internalId").notNull(),
    lastSyncedAt: timestamp("lastSyncedAt").defaultNow().notNull(),
    syncStatus: mysqlEnum("syncStatus", ["synced", "pending", "conflict", "error"]).default("synced"),
    syncDirection: mysqlEnum("syncDirection", ["inbound", "outbound", "bidirectional"]).default("inbound"),
    externalUpdatedAt: timestamp("externalUpdatedAt"),
    internalUpdatedAt: timestamp("internalUpdatedAt"),
    hasConflict: boolean("hasConflict").default(false),
    conflictResolution: varchar("conflictResolution", { length: 20 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    connectionIdx: index("synced_record_connection_idx").on(table.connectionId),
    externalIdx: index("synced_record_external_idx").on(table.externalId, table.externalType),
    internalIdx: index("synced_record_internal_idx").on(table.internalTable, table.internalId),
    uniqueExternal: unique("synced_record_unique").on(table.connectionId, table.externalId, table.externalType),
  })
);

// ============================================================================
// EUSOCONNECT - WEBHOOKS
// ============================================================================

export const integrationWebhooks = mysqlTable(
  "integration_webhooks",
  {
    id: int("id").autoincrement().primaryKey(),
    connectionId: int("connectionId"),
    providerSlug: varchar("providerSlug", { length: 50 }).notNull(),
    eventType: varchar("eventType", { length: 100 }).notNull(),
    payload: json("payload").$type<Record<string, unknown>>().notNull(),
    headers: json("headers").$type<Record<string, string>>(),
    status: mysqlEnum("status", ["received", "processing", "processed", "failed", "ignored"]).default("received"),
    processedAt: timestamp("processedAt"),
    errorMessage: text("errorMessage"),
    signatureValid: boolean("signatureValid"),
    receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  },
  (table) => ({
    connectionIdx: index("webhook_connection_idx").on(table.connectionId),
    providerIdx: index("webhook_provider_idx").on(table.providerSlug),
    statusIdx: index("webhook_status_idx").on(table.status),
  })
);

// ============================================================================
// EUSOSHIELD - INSURANCE PROVIDERS
// ============================================================================

export const insuranceProviders = mysqlTable(
  "insurance_providers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    naicCode: varchar("naicCode", { length: 20 }),
    amBestRating: varchar("amBestRating", { length: 10 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    website: varchar("website", { length: 500 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 50 }),
    zipCode: varchar("zipCode", { length: 20 }),
    specializesInHazmat: boolean("specializesInHazmat").default(false),
    hazmatClasses: json("hazmatClasses").$type<string[]>().default([]),
    policyTypes: json("policyTypes").$type<string[]>().default([]),
    minimumPremium: decimal("minimumPremium", { precision: 12, scale: 2 }),
    isPreferred: boolean("isPreferred").default(false),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    naicIdx: index("ins_provider_naic_idx").on(table.naicCode),
    hazmatIdx: index("ins_provider_hazmat_idx").on(table.specializesInHazmat),
  })
);

// ============================================================================
// EUSOSHIELD - INSURANCE POLICIES
// ============================================================================

export const insurancePolicies = mysqlTable(
  "insurance_policies",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    providerId: int("providerId"),
    providerName: varchar("providerName", { length: 255 }),
    policyNumber: varchar("policyNumber", { length: 100 }).notNull(),
    policyType: mysqlEnum("policyType", [
      "auto_liability", "general_liability", "cargo", "workers_compensation",
      "umbrella_excess", "pollution_liability", "environmental_impairment",
      "motor_truck_cargo", "physical_damage", "non_trucking_liability",
      "trailer_interchange", "reefer_breakdown", "hazmat_endorsement", "other"
    ]).notNull(),
    coverageType: mysqlEnum("coverageType", ["primary", "excess", "umbrella"]).default("primary"),
    effectiveDate: timestamp("effectiveDate").notNull(),
    expirationDate: timestamp("expirationDate").notNull(),
    perOccurrenceLimit: decimal("perOccurrenceLimit", { precision: 15, scale: 2 }),
    aggregateLimit: decimal("aggregateLimit", { precision: 15, scale: 2 }),
    combinedSingleLimit: decimal("combinedSingleLimit", { precision: 15, scale: 2 }),
    bodilyInjuryPerPerson: decimal("bodilyInjuryPerPerson", { precision: 15, scale: 2 }),
    bodilyInjuryPerAccident: decimal("bodilyInjuryPerAccident", { precision: 15, scale: 2 }),
    propertyDamageLimit: decimal("propertyDamageLimit", { precision: 15, scale: 2 }),
    cargoLimit: decimal("cargoLimit", { precision: 15, scale: 2 }),
    deductible: decimal("deductible", { precision: 12, scale: 2 }),
    annualPremium: decimal("annualPremium", { precision: 12, scale: 2 }),
    paymentFrequency: varchar("paymentFrequency", { length: 20 }),
    status: mysqlEnum("status", ["active", "expired", "cancelled", "pending", "lapsed"]).default("active"),
    namedInsureds: json("namedInsureds").$type<string[]>().default([]),
    additionalInsureds: json("additionalInsureds").$type<Array<{name: string; address?: string}>>().default([]),
    endorsements: json("endorsements").$type<string[]>().default([]),
    exclusions: json("exclusions").$type<string[]>().default([]),
    hazmatCoverage: boolean("hazmatCoverage").default(false),
    hazmatClasses: json("hazmatClasses").$type<string[]>().default([]),
    pollutionCoverage: boolean("pollutionCoverage").default(false),
    fmcsaFilingNumber: varchar("fmcsaFilingNumber", { length: 50 }),
    filingStatus: mysqlEnum("filingStatus", ["filed", "pending", "rejected", "not_required"]),
    verifiedAt: timestamp("verifiedAt"),
    verifiedBy: int("verifiedBy"),
    verificationSource: varchar("verificationSource", { length: 50 }),
    documentUrl: text("documentUrl"),
    syncedFromIntegration: int("syncedFromIntegration"),
    externalPolicyId: varchar("externalPolicyId", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("policy_company_idx").on(table.companyId),
    policyNumberIdx: index("policy_number_idx").on(table.policyNumber),
    typeIdx: index("policy_type_idx").on(table.policyType),
    statusIdx: index("policy_status_idx").on(table.status),
    expirationIdx: index("policy_expiration_idx").on(table.expirationDate),
  })
);

// ============================================================================
// EUSOSHIELD - CERTIFICATES OF INSURANCE
// ============================================================================

export const certificatesOfInsurance = mysqlTable(
  "certificates_of_insurance",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    certificateNumber: varchar("certificateNumber", { length: 100 }),
    holderName: varchar("holderName", { length: 255 }).notNull(),
    holderAddress: text("holderAddress"),
    holderEmail: varchar("holderEmail", { length: 255 }),
    issuedDate: timestamp("issuedDate").notNull(),
    expirationDate: timestamp("expirationDate"),
    policies: json("policies").$type<Array<{policyId: number; policyType: string; limits: Record<string, number>}>>().default([]),
    additionalInsuredEndorsement: boolean("additionalInsuredEndorsement").default(false),
    waiverOfSubrogation: boolean("waiverOfSubrogation").default(false),
    primaryNonContributory: boolean("primaryNonContributory").default(false),
    specialProvisions: text("specialProvisions"),
    documentUrl: text("documentUrl"),
    status: mysqlEnum("status", ["active", "expired", "revoked", "pending"]).default("active"),
    requestedBy: int("requestedBy"),
    requestedAt: timestamp("requestedAt"),
    issuedBy: int("issuedBy"),
    syncedFromIntegration: int("syncedFromIntegration"),
    externalCertId: varchar("externalCertId", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("coi_company_idx").on(table.companyId),
    holderIdx: index("coi_holder_idx").on(table.holderName),
    expirationIdx: index("coi_expiration_idx").on(table.expirationDate),
  })
);

// ============================================================================
// EUSOSHIELD - INSURANCE CLAIMS
// ============================================================================

export const insuranceClaims = mysqlTable(
  "insurance_claims",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    policyId: int("policyId").notNull(),
    loadId: int("loadId"),
    claimNumber: varchar("claimNumber", { length: 100 }),
    incidentDate: timestamp("incidentDate").notNull(),
    reportedDate: timestamp("reportedDate").notNull(),
    claimType: mysqlEnum("claimType", [
      "cargo_damage", "cargo_theft", "cargo_contamination",
      "bodily_injury", "property_damage", "environmental",
      "spill_cleanup", "third_party_liability", "collision",
      "comprehensive", "workers_comp", "other"
    ]).notNull(),
    description: text("description").notNull(),
    incidentLocation: json("incidentLocation").$type<{address?: string; city?: string; state?: string; lat?: number; lng?: number}>(),
    estimatedLoss: decimal("estimatedLoss", { precision: 15, scale: 2 }),
    claimedAmount: decimal("claimedAmount", { precision: 15, scale: 2 }),
    paidAmount: decimal("paidAmount", { precision: 15, scale: 2 }),
    deductibleApplied: decimal("deductibleApplied", { precision: 12, scale: 2 }),
    status: mysqlEnum("status", [
      "draft", "submitted", "under_review", "investigation",
      "approved", "denied", "settled", "closed", "reopened"
    ]).default("draft"),
    adjusterName: varchar("adjusterName", { length: 255 }),
    adjusterPhone: varchar("adjusterPhone", { length: 20 }),
    adjusterEmail: varchar("adjusterEmail", { length: 255 }),
    witnesses: json("witnesses").$type<Array<{name: string; phone?: string; statement?: string}>>().default([]),
    policeReportNumber: varchar("policeReportNumber", { length: 100 }),
    hazmatInvolved: boolean("hazmatInvolved").default(false),
    hazmatClass: varchar("hazmatClass", { length: 20 }),
    spillReported: boolean("spillReported").default(false),
    epaNotified: boolean("epaNotified").default(false),
    dotReportable: boolean("dotReportable").default(false),
    documents: json("documents").$type<Array<{name: string; url: string; type: string}>>().default([]),
    timeline: json("timeline").$type<Array<{date: string; action: string; notes?: string}>>().default([]),
    resolution: text("resolution"),
    closedAt: timestamp("closedAt"),
    closedBy: int("closedBy"),
    filedBy: int("filedBy").notNull(),
    syncedFromIntegration: int("syncedFromIntegration"),
    externalClaimId: varchar("externalClaimId", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("claim_company_idx").on(table.companyId),
    policyIdx: index("claim_policy_idx").on(table.policyId),
    statusIdx: index("claim_status_idx").on(table.status),
    incidentDateIdx: index("claim_incident_date_idx").on(table.incidentDate),
  })
);

// ============================================================================
// EUSOSHIELD - INSURANCE VERIFICATIONS
// ============================================================================

export const insuranceVerifications = mysqlTable(
  "insurance_verifications",
  {
    id: int("id").autoincrement().primaryKey(),
    requestedByCompanyId: int("requestedByCompanyId").notNull(),
    targetCompanyId: int("targetCompanyId").notNull(),
    loadId: int("loadId"),
    verificationType: mysqlEnum("verificationType", [
      "pre_dispatch", "periodic", "incident", "renewal", "new_relationship"
    ]).notNull(),
    requiredCoverages: json("requiredCoverages").$type<Array<{type: string; minLimit: number}>>().default([]),
    verificationStatus: mysqlEnum("verificationStatus", [
      "pending", "verified", "failed", "expired", "partial"
    ]).default("pending"),
    verifiedPolicies: json("verifiedPolicies").$type<Array<{policyId: number; verified: boolean; reason?: string}>>().default([]),
    verificationMethod: varchar("verificationMethod", { length: 50 }),
    verifiedAt: timestamp("verifiedAt"),
    verifiedBy: int("verifiedBy"),
    expiresAt: timestamp("expiresAt"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    requestedByIdx: index("verification_requested_by_idx").on(table.requestedByCompanyId),
    targetIdx: index("verification_target_idx").on(table.targetCompanyId),
    statusIdx: index("verification_status_idx").on(table.verificationStatus),
  })
);

// ============================================================================
// EUSOSHIELD - INSURANCE QUOTES (MARKETPLACE)
// ============================================================================

export const insuranceQuotes = mysqlTable(
  "insurance_quotes",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    requestId: varchar("requestId", { length: 100 }),
    providerId: int("providerId"),
    providerName: varchar("providerName", { length: 255 }),
    policyType: varchar("policyType", { length: 50 }).notNull(),
    coverageDetails: json("coverageDetails").$type<Record<string, unknown>>(),
    limits: json("limits").$type<Record<string, number>>(),
    deductible: decimal("deductible", { precision: 12, scale: 2 }),
    premium: decimal("premium", { precision: 12, scale: 2 }),
    paymentOptions: json("paymentOptions").$type<Array<{frequency: string; amount: number}>>(),
    effectiveDate: timestamp("effectiveDate"),
    expirationDate: timestamp("expirationDate"),
    status: mysqlEnum("status", [
      "requested", "received", "reviewing", "accepted", "declined", "expired"
    ]).default("requested"),
    validUntil: timestamp("validUntil"),
    acceptedAt: timestamp("acceptedAt"),
    acceptedBy: int("acceptedBy"),
    resultingPolicyId: int("resultingPolicyId"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("quote_company_idx").on(table.companyId),
    requestIdx: index("quote_request_idx").on(table.requestId),
    statusIdx: index("quote_status_idx").on(table.status),
  })
);

// ============================================================================
// EUSOSHIELD - LOAD INSURANCE (PER-LOAD COVERAGE)
// ============================================================================

export const loadInsurance = mysqlTable(
  "load_insurance",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId").notNull(),
    companyId: int("companyId").notNull(),
    coverageType: mysqlEnum("coverageType", [
      "cargo", "pollution", "excess_liability", "contingent_cargo", "all_risk"
    ]).notNull(),
    providerId: int("providerId"),
    providerName: varchar("providerName", { length: 255 }),
    policyNumber: varchar("policyNumber", { length: 100 }),
    coverageLimit: decimal("coverageLimit", { precision: 15, scale: 2 }).notNull(),
    deductible: decimal("deductible", { precision: 12, scale: 2 }),
    premium: decimal("premium", { precision: 12, scale: 2 }).notNull(),
    effectiveDate: timestamp("effectiveDate").notNull(),
    expirationDate: timestamp("expirationDate").notNull(),
    commodityDescription: varchar("commodityDescription", { length: 255 }),
    hazmatClass: varchar("hazmatClass", { length: 20 }),
    declaredValue: decimal("declaredValue", { precision: 15, scale: 2 }),
    status: mysqlEnum("status", ["pending", "active", "expired", "claimed", "cancelled"]).default("pending"),
    certificateUrl: text("certificateUrl"),
    purchasedBy: int("purchasedBy").notNull(),
    purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    loadIdx: index("load_insurance_load_idx").on(table.loadId),
    companyIdx: index("load_insurance_company_idx").on(table.companyId),
    statusIdx: index("load_insurance_status_idx").on(table.status),
  })
);

// ============================================================================
// EUSOSHIELD - CATALYST RISK SCORES
// ============================================================================

export const catalystRiskScores = mysqlTable(
  "catalyst_risk_scores",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    overallScore: int("overallScore").notNull(),
    riskTier: mysqlEnum("riskTier", ["low", "moderate", "elevated", "high", "critical"]).notNull(),
    safetyScore: int("safetyScore"),
    insuranceScore: int("insuranceScore"),
    complianceScore: int("complianceScore"),
    financialScore: int("financialScore"),
    claimsHistory: json("claimsHistory").$type<{totalClaims: number; paidAmount: number; openClaims: number}>(),
    csaBasicScores: json("csaBasicScores").$type<Record<string, number>>(),
    outOfServiceRate: decimal("outOfServiceRate", { precision: 5, scale: 2 }),
    crashRate: decimal("crashRate", { precision: 5, scale: 4 }),
    factors: json("factors").$type<Array<{factor: string; impact: string; score: number}>>().default([]),
    recommendations: json("recommendations").$type<string[]>().default([]),
    calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
    validUntil: timestamp("validUntil"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: unique("risk_score_company_idx").on(table.companyId),
    tierIdx: index("risk_score_tier_idx").on(table.riskTier),
  })
);

// ============================================================================
// EUSOSHIELD - INSURANCE ALERTS
// ============================================================================

export const insuranceAlerts = mysqlTable(
  "insurance_alerts",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    policyId: int("policyId"),
    alertType: mysqlEnum("alertType", [
      "expiring_soon", "expired", "coverage_gap", "limit_inadequate",
      "filing_issue", "premium_due", "claim_update", "verification_failed",
      "document_needed", "renewal_reminder"
    ]).notNull(),
    severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("warning"),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    actionRequired: boolean("actionRequired").default(false),
    actionUrl: varchar("actionUrl", { length: 500 }),
    dueDate: timestamp("dueDate"),
    status: mysqlEnum("status", ["active", "acknowledged", "dismissed", "resolved"]).default("active"),
    acknowledgedAt: timestamp("acknowledgedAt"),
    acknowledgedBy: int("acknowledgedBy"),
    resolvedAt: timestamp("resolvedAt"),
    resolvedBy: int("resolvedBy"),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("ins_alert_company_idx").on(table.companyId),
    policyIdx: index("ins_alert_policy_idx").on(table.policyId),
    typeIdx: index("ins_alert_type_idx").on(table.alertType),
    statusIdx: index("ins_alert_status_idx").on(table.status),
  })
);

// Type exports for new tables
export type DashboardLayout = typeof dashboardLayouts.$inferSelect;
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type WidgetConfiguration = typeof widgetConfigurations.$inferSelect;
export type FeeConfiguration = typeof feeConfigurations.$inferSelect;
export type FeeCalculation = typeof feeCalculations.$inferSelect;
export type FeeAuditLog = typeof feeAuditLog.$inferSelect;
export type GroupChannel = typeof groupChannels.$inferSelect;
export type ChannelMember = typeof channelMembers.$inferSelect;
export type MessageReadReceipt = typeof messageReadReceipts.$inferSelect;
export type Guild = typeof guilds.$inferSelect;
export type GuildMember = typeof guildMembers.$inferSelect;
export type MilesTransaction = typeof milesTransactions.$inferSelect;
export type LootCrate = typeof lootCrates.$inferSelect;
export type UserInventoryItem = typeof userInventory.$inferSelect;
export type EscrowHold = typeof escrowHolds.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;

// EusoConnect Types
export type IntegrationProvider = typeof integrationProviders.$inferSelect;
export type IntegrationConnection = typeof integrationConnections.$inferSelect;
export type IntegrationSyncLog = typeof integrationSyncLogs.$inferSelect;
export type IntegrationSyncedRecord = typeof integrationSyncedRecords.$inferSelect;
export type IntegrationWebhook = typeof integrationWebhooks.$inferSelect;

// EusoShield Types
export type InsuranceProvider = typeof insuranceProviders.$inferSelect;
export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type CertificateOfInsurance = typeof certificatesOfInsurance.$inferSelect;
export type InsuranceClaim = typeof insuranceClaims.$inferSelect;
export type InsuranceVerification = typeof insuranceVerifications.$inferSelect;
export type InsuranceQuote = typeof insuranceQuotes.$inferSelect;
export type LoadInsurance = typeof loadInsurance.$inferSelect;
export type CatalystRiskScore = typeof catalystRiskScores.$inferSelect;
export type InsuranceAlert = typeof insuranceAlerts.$inferSelect;

// ============================================================================
// EUSOCONTRACT — AGREEMENT & CONTRACT MANAGEMENT SYSTEM
// ============================================================================

/**
 * AGREEMENT TEMPLATES
 * System-provided and user-uploaded contract templates.
 * Templates contain clause libraries that auto-populate agreements.
 */
export const agreementTemplates = mysqlTable(
  "agreement_templates",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    agreementType: mysqlEnum("agreementType", [
      "catalyst_shipper",
      "broker_catalyst",
      "broker_shipper",
      "catalyst_driver",
      "escort_service",
      "dispatch_dispatch",
      "terminal_access",
      "master_service",
      "lane_commitment",
      "fuel_surcharge",
      "accessorial_schedule",
      "nda",
      "factoring",
      "custom",
    ]).notNull(),
    category: mysqlEnum("category", ["system", "company", "custom", "uploaded"]).default("system").notNull(),
    version: varchar("version", { length: 20 }).default("1.0").notNull(),
    ownerCompanyId: int("ownerCompanyId"),
    ownerUserId: int("ownerUserId"),
    // Template content
    clauses: json("clauses").$type<{
      id: string;
      title: string;
      body: string;
      isRequired: boolean;
      isEditable: boolean;
      order: number;
      category: string;
    }[]>(),
    // Strategic inputs schema — defines what fields the user fills in to generate
    inputSchema: json("inputSchema").$type<{
      field: string;
      label: string;
      type: "text" | "number" | "date" | "select" | "currency" | "percentage" | "address" | "boolean";
      required: boolean;
      options?: string[];
      defaultValue?: string;
      section: string;
    }[]>(),
    // Uploaded document metadata
    originalDocumentUrl: text("originalDocumentUrl"),
    digitizedContent: text("digitizedContent"),
    isDigitized: boolean("isDigitized").default(false),
    // State
    isActive: boolean("isActive").default(true).notNull(),
    isDefault: boolean("isDefault").default(false),
    usageCount: int("usageCount").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    typeIdx: index("template_type_idx").on(table.agreementType),
    categoryIdx: index("template_category_idx").on(table.category),
    ownerCompanyIdx: index("template_owner_company_idx").on(table.ownerCompanyId),
    ownerUserIdx: index("template_owner_user_idx").on(table.ownerUserId),
  })
);

/**
 * AGREEMENTS
 * The core contract between two parties on the platform.
 * Generated from templates + strategic inputs, or uploaded + digitized.
 */
export const agreements = mysqlTable(
  "agreements",
  {
    id: int("id").autoincrement().primaryKey(),
    agreementNumber: varchar("agreementNumber", { length: 50 }).notNull().unique(),
    templateId: int("templateId"),
    agreementType: mysqlEnum("agreementType", [
      "catalyst_shipper",
      "broker_catalyst",
      "broker_shipper",
      "catalyst_driver",
      "escort_service",
      "dispatch_dispatch",
      "terminal_access",
      "master_service",
      "lane_commitment",
      "fuel_surcharge",
      "accessorial_schedule",
      "nda",
      "factoring",
      "custom",
    ]).notNull(),
    contractDuration: mysqlEnum("contractDuration", [
      "spot",
      "short_term",
      "long_term",
      "evergreen",
    ]).default("spot").notNull(),
    // Parties
    partyAUserId: int("partyAUserId").notNull(),
    partyACompanyId: int("partyACompanyId"),
    partyARole: varchar("partyARole", { length: 50 }).notNull(),
    partyBUserId: int("partyBUserId").notNull(),
    partyBCompanyId: int("partyBCompanyId"),
    partyBRole: varchar("partyBRole", { length: 50 }).notNull(),
    // Financial terms
    rateType: mysqlEnum("rateType", [
      "per_mile",
      "flat_rate",
      "percentage",
      "per_hour",
      "per_ton",
      "per_gallon",
      "custom",
    ]),
    baseRate: decimal("baseRate", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("USD"),
    fuelSurchargeType: mysqlEnum("fuelSurchargeType", ["none", "fixed", "doe_index", "percentage", "custom"]).default("none"),
    fuelSurchargeValue: decimal("fuelSurchargeValue", { precision: 10, scale: 4 }),
    minimumCharge: decimal("minimumCharge", { precision: 10, scale: 2 }),
    maximumCharge: decimal("maximumCharge", { precision: 10, scale: 2 }),
    // Payment terms
    paymentTermDays: int("paymentTermDays").default(30),
    paymentMethod: varchar("paymentMethod", { length: 50 }),
    quickPayDiscount: decimal("quickPayDiscount", { precision: 5, scale: 2 }),
    quickPayDays: int("quickPayDays"),
    // Insurance & liability
    minInsuranceAmount: decimal("minInsuranceAmount", { precision: 12, scale: 2 }),
    liabilityLimit: decimal("liabilityLimit", { precision: 12, scale: 2 }),
    cargoInsuranceRequired: decimal("cargoInsuranceRequired", { precision: 12, scale: 2 }),
    // Operational terms
    equipmentTypes: json("equipmentTypes").$type<string[]>(),
    hazmatRequired: boolean("hazmatRequired").default(false),
    twicRequired: boolean("twicRequired").default(false),
    tankerEndorsementRequired: boolean("tankerEndorsementRequired").default(false),
    // Lane commitments
    lanes: text("lanes"),
    volumeCommitmentTotal: int("volumeCommitmentTotal"),
    volumeCommitmentPeriod: varchar("volumeCommitmentPeriod", { length: 20 }),
    // Accessorial schedule
    accessorialSchedule: text("accessorialSchedule"),
    // Full generated contract content
    generatedContent: text("generatedContent"),
    clauses: text("clauses"),
    // Strategic inputs that generated this agreement
    strategicInputs: text("strategicInputs"),
    // Uploaded original document
    originalDocumentUrl: text("originalDocumentUrl"),
    // Contract lifecycle
    status: mysqlEnum("status", [
      "draft",
      "pending_review",
      "negotiating",
      "pending_signature",
      "active",
      "expired",
      "terminated",
      "cancelled",
      "suspended",
      "renewed",
    ]).default("draft").notNull(),
    effectiveDate: timestamp("effectiveDate"),
    expirationDate: timestamp("expirationDate"),
    terminationDate: timestamp("terminationDate"),
    autoRenew: boolean("autoRenew").default(false),
    renewalTermDays: int("renewalTermDays"),
    renewalNoticeDays: int("renewalNoticeDays").default(30),
    terminationNoticeDays: int("terminationNoticeDays").default(30),
    // Non-circumvention (ties to platform ToS)
    nonCircumventionEnabled: boolean("nonCircumventionEnabled").default(true),
    nonCircumventionMonths: int("nonCircumventionMonths").default(24),
    // Platform fee reference (our fee comes from load transactions, not the agreement)
    platformFeeAcknowledged: boolean("platformFeeAcknowledged").default(true),
    // Metadata
    notes: text("notes"),
    tags: json("tags").$type<string[]>(),
    // Encryption at rest
    isEncrypted: boolean("isEncrypted").default(false),
    encryptionVersion: varchar("encryptionVersion", { length: 10 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    agreementNumberIdx: unique("agreement_number_unique").on(table.agreementNumber),
    typeIdx: index("agreement_type_idx").on(table.agreementType),
    statusIdx: index("agreement_status_idx").on(table.status),
    partyAUserIdx: index("agreement_party_a_user_idx").on(table.partyAUserId),
    partyBUserIdx: index("agreement_party_b_user_idx").on(table.partyBUserId),
    partyACompanyIdx: index("agreement_party_a_company_idx").on(table.partyACompanyId),
    partyBCompanyIdx: index("agreement_party_b_company_idx").on(table.partyBCompanyId),
    durationIdx: index("agreement_duration_idx").on(table.contractDuration),
    effectiveDateIdx: index("agreement_effective_idx").on(table.effectiveDate),
    expirationDateIdx: index("agreement_expiration_idx").on(table.expirationDate),
  })
);

/**
 * AGREEMENT SIGNATURES
 * Digital signatures for agreement execution.
 */
export const agreementSignatures = mysqlTable(
  "agreement_signatures",
  {
    id: int("id").autoincrement().primaryKey(),
    agreementId: int("agreementId").notNull(),
    userId: int("userId").notNull(),
    companyId: int("companyId"),
    signatureRole: varchar("signatureRole", { length: 50 }).notNull(),
    signatureData: text("signatureData"),
    signatureHash: varchar("signatureHash", { length: 128 }),
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    signedAt: timestamp("signedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    agreementIdx: index("sig_agreement_idx").on(table.agreementId),
    userIdx: index("sig_user_idx").on(table.userId),
  })
);

/**
 * AGREEMENT AMENDMENTS
 * Track changes/amendments to active agreements.
 */
export const agreementAmendments = mysqlTable(
  "agreement_amendments",
  {
    id: int("id").autoincrement().primaryKey(),
    agreementId: int("agreementId").notNull(),
    amendmentNumber: int("amendmentNumber").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    changes: json("changes").$type<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }[]>(),
    proposedBy: int("proposedBy").notNull(),
    status: mysqlEnum("status", ["proposed", "accepted", "rejected", "withdrawn"]).default("proposed").notNull(),
    acceptedBy: int("acceptedBy"),
    acceptedAt: timestamp("acceptedAt"),
    effectiveDate: timestamp("effectiveDate"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    agreementIdx: index("amendment_agreement_idx").on(table.agreementId),
    statusIdx: index("amendment_status_idx").on(table.status),
  })
);

// ============================================================================
// EUSOBID — LOAD BIDDING & RATE NEGOTIATION SYSTEM
// ============================================================================

/**
 * LOAD BIDS (enhanced — extends the existing bids table concept)
 * Full bidding system with counter-offers, auto-accept, and multi-round.
 */
export const loadBids = mysqlTable(
  "load_bids",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId").notNull(),
    // Bidder info
    bidderUserId: int("bidderUserId").notNull(),
    bidderCompanyId: int("bidderCompanyId"),
    bidderRole: mysqlEnum("bidderRole", ["catalyst", "broker", "driver", "escort"]).notNull(),
    // Bid details
    bidAmount: decimal("bidAmount", { precision: 10, scale: 2 }).notNull(),
    rateType: mysqlEnum("rateType", ["flat", "per_mile", "per_hour", "per_ton", "percentage"]).default("flat").notNull(),
    currency: varchar("currency", { length: 3 }).default("USD"),
    // Counter-offer chain
    parentBidId: int("parentBidId"),
    bidRound: int("bidRound").default(1).notNull(),
    // Equipment & service offer
    equipmentType: varchar("equipmentType", { length: 50 }),
    estimatedPickup: timestamp("estimatedPickup"),
    estimatedDelivery: timestamp("estimatedDelivery"),
    transitTimeDays: int("transitTimeDays"),
    // Conditions
    fuelSurchargeIncluded: boolean("fuelSurchargeIncluded").default(false),
    accessorialsIncluded: json("accessorialsIncluded").$type<string[]>(),
    conditions: text("conditions"),
    // Auto-accept
    isAutoAccepted: boolean("isAutoAccepted").default(false),
    // Agreement reference (if bidding under an existing agreement)
    agreementId: int("agreementId"),
    // State
    status: mysqlEnum("status", [
      "pending",
      "accepted",
      "rejected",
      "countered",
      "withdrawn",
      "expired",
      "auto_accepted",
    ]).default("pending").notNull(),
    rejectionReason: text("rejectionReason"),
    expiresAt: timestamp("expiresAt"),
    respondedAt: timestamp("respondedAt"),
    respondedBy: int("respondedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    loadIdx: index("load_bid_load_idx").on(table.loadId),
    bidderUserIdx: index("load_bid_bidder_user_idx").on(table.bidderUserId),
    bidderCompanyIdx: index("load_bid_bidder_company_idx").on(table.bidderCompanyId),
    statusIdx: index("load_bid_status_idx").on(table.status),
    parentBidIdx: index("load_bid_parent_idx").on(table.parentBidId),
    agreementIdx: index("load_bid_agreement_idx").on(table.agreementId),
    expiresIdx: index("load_bid_expires_idx").on(table.expiresAt),
  })
);

/**
 * BID AUTO-ACCEPT RULES
 * Shippers/brokers can set rules to auto-accept bids that meet criteria.
 */
export const bidAutoAcceptRules = mysqlTable(
  "bid_auto_accept_rules",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    companyId: int("companyId"),
    name: varchar("name", { length: 255 }).notNull(),
    // Criteria
    maxRate: decimal("maxRate", { precision: 10, scale: 2 }),
    maxRatePerMile: decimal("maxRatePerMile", { precision: 8, scale: 2 }),
    minCatalystRating: decimal("minCatalystRating", { precision: 3, scale: 1 }),
    requiredInsuranceMin: decimal("requiredInsuranceMin", { precision: 12, scale: 2 }),
    requiredEquipmentTypes: json("requiredEquipmentTypes").$type<string[]>(),
    requiredHazmat: boolean("requiredHazmat").default(false),
    maxTransitDays: int("maxTransitDays"),
    preferredCatalystIds: json("preferredCatalystIds").$type<number[]>(),
    // Lane filters
    originStates: json("originStates").$type<string[]>(),
    destinationStates: json("destinationStates").$type<string[]>(),
    // State
    isActive: boolean("isActive").default(true).notNull(),
    totalAutoAccepted: int("totalAutoAccepted").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("auto_accept_user_idx").on(table.userId),
    companyIdx: index("auto_accept_company_idx").on(table.companyId),
  })
);

// ============================================================================
// EUSONEGOTIATE — RATE & TERMS NEGOTIATION THREADS
// ============================================================================

/**
 * NEGOTIATIONS
 * Thread-based negotiations between two parties.
 * Can be for a specific load, lane, or general rate agreement.
 */
export const negotiations = mysqlTable(
  "negotiations",
  {
    id: int("id").autoincrement().primaryKey(),
    negotiationNumber: varchar("negotiationNumber", { length: 50 }).notNull().unique(),
    // Context
    negotiationType: mysqlEnum("negotiationType", [
      "load_rate",
      "lane_rate",
      "contract_terms",
      "fuel_surcharge",
      "accessorial_rates",
      "volume_commitment",
      "payment_terms",
      "general",
    ]).notNull(),
    loadId: int("loadId"),
    agreementId: int("agreementId"),
    laneContractId: int("laneContractId"),
    // Parties
    initiatorUserId: int("initiatorUserId").notNull(),
    initiatorCompanyId: int("initiatorCompanyId"),
    respondentUserId: int("respondentUserId").notNull(),
    respondentCompanyId: int("respondentCompanyId"),
    // Subject
    subject: varchar("subject", { length: 255 }).notNull(),
    description: text("description"),
    // Current state of negotiation
    currentOffer: json("currentOffer").$type<{
      amount?: number;
      rateType?: string;
      terms?: Record<string, unknown>;
      proposedBy: number;
      proposedAt: string;
    }>(),
    totalRounds: int("totalRounds").default(0),
    // State
    status: mysqlEnum("status", [
      "open",
      "awaiting_response",
      "counter_offered",
      "agreed",
      "rejected",
      "expired",
      "cancelled",
    ]).default("open").notNull(),
    outcome: mysqlEnum("outcome", ["accepted", "rejected", "expired", "cancelled"]),
    agreedTerms: json("agreedTerms"),
    // Deadlines
    responseDeadline: timestamp("responseDeadline"),
    expiresAt: timestamp("expiresAt"),
    resolvedAt: timestamp("resolvedAt"),
    isEncrypted: boolean("isEncrypted").default(false),
    encryptionVersion: varchar("encryptionVersion", { length: 10 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    negotiationNumberIdx: unique("negotiation_number_unique").on(table.negotiationNumber),
    typeIdx: index("negotiation_type_idx").on(table.negotiationType),
    statusIdx: index("negotiation_status_idx").on(table.status),
    initiatorIdx: index("negotiation_initiator_idx").on(table.initiatorUserId),
    respondentIdx: index("negotiation_respondent_idx").on(table.respondentUserId),
    loadIdx: index("negotiation_load_idx").on(table.loadId),
    agreementIdx: index("negotiation_agreement_idx").on(table.agreementId),
  })
);

/**
 * NEGOTIATION MESSAGES
 * Individual messages/offers within a negotiation thread.
 */
export const negotiationMessages = mysqlTable(
  "negotiation_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    negotiationId: int("negotiationId").notNull(),
    senderUserId: int("senderUserId").notNull(),
    round: int("round").notNull(),
    // Message content
    messageType: mysqlEnum("messageType", [
      "initial_offer",
      "counter_offer",
      "message",
      "accept",
      "reject",
      "withdraw",
      "system",
    ]).notNull(),
    content: text("content"),
    // Offer details (if this message contains an offer)
    offerAmount: decimal("offerAmount", { precision: 10, scale: 2 }),
    offerRateType: varchar("offerRateType", { length: 30 }),
    offerTerms: json("offerTerms").$type<{
      paymentDays?: number;
      fuelSurcharge?: number;
      accessorials?: { type: string; rate: number }[];
      equipment?: string[];
      volume?: number;
      volumePeriod?: string;
      effectiveDate?: string;
      expirationDate?: string;
      [key: string]: unknown;
    }>(),
    // Attachments
    attachments: json("attachments").$type<{ name: string; url: string; type: string }[]>(),
    // State
    isRead: boolean("isRead").default(false),
    readAt: timestamp("readAt"),
    isEncrypted: boolean("isEncrypted").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    negotiationIdx: index("neg_msg_negotiation_idx").on(table.negotiationId),
    senderIdx: index("neg_msg_sender_idx").on(table.senderUserId),
    roundIdx: index("neg_msg_round_idx").on(table.round),
    typeIdx: index("neg_msg_type_idx").on(table.messageType),
  })
);

// ============================================================================
// EUSOLANE — LANE CONTRACTS & COMMITMENTS
// ============================================================================

/**
 * LANE CONTRACTS
 * Contracted rates on specific origin-destination lanes.
 * Tied to agreements, with volume commitments and rate locks.
 */
export const laneContracts = mysqlTable(
  "lane_contracts",
  {
    id: int("id").autoincrement().primaryKey(),
    agreementId: int("agreementId"),
    shipperId: int("shipperId"),
    shipperCompanyId: int("shipperCompanyId"),
    catalystId: int("catalystId"),
    catalystCompanyId: int("catalystCompanyId"),
    brokerId: int("brokerId"),
    brokerCompanyId: int("brokerCompanyId"),
    // Lane definition
    originCity: varchar("originCity", { length: 100 }).notNull(),
    originState: varchar("originState", { length: 50 }).notNull(),
    originZip: varchar("originZip", { length: 20 }),
    originRadius: int("originRadius"),
    destinationCity: varchar("destinationCity", { length: 100 }).notNull(),
    destinationState: varchar("destinationState", { length: 50 }).notNull(),
    destinationZip: varchar("destinationZip", { length: 20 }),
    destinationRadius: int("destinationRadius"),
    estimatedMiles: decimal("estimatedMiles", { precision: 10, scale: 2 }),
    // Rate
    contractedRate: decimal("contractedRate", { precision: 10, scale: 2 }).notNull(),
    rateType: mysqlEnum("rateType", ["flat", "per_mile", "per_hour", "per_ton"]).default("flat").notNull(),
    fuelSurchargeType: mysqlEnum("fuelSurchargeType", ["none", "fixed", "doe_index", "percentage"]).default("none"),
    fuelSurchargeValue: decimal("fuelSurchargeValue", { precision: 10, scale: 4 }),
    // Volume commitment
    volumeCommitment: int("volumeCommitment"),
    volumePeriod: mysqlEnum("volumePeriod", ["weekly", "monthly", "quarterly", "annually"]),
    volumeFulfilled: int("volumeFulfilled").default(0),
    // Equipment
    equipmentType: varchar("equipmentType", { length: 50 }),
    hazmatRequired: boolean("hazmatRequired").default(false),
    // Contract period
    effectiveDate: timestamp("effectiveDate").notNull(),
    expirationDate: timestamp("expirationDate").notNull(),
    // Performance
    totalLoadsBooked: int("totalLoadsBooked").default(0),
    totalRevenue: decimal("totalRevenue", { precision: 14, scale: 2 }).default("0"),
    onTimePercentage: decimal("onTimePercentage", { precision: 5, scale: 2 }),
    // State
    status: mysqlEnum("status", ["active", "expired", "suspended", "terminated"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    agreementIdx: index("lane_agreement_idx").on(table.agreementId),
    shipperIdx: index("lane_shipper_idx").on(table.shipperId),
    catalystIdx: index("lane_catalyst_idx").on(table.catalystId),
    brokerIdx: index("lane_broker_idx").on(table.brokerId),
    originIdx: index("lane_origin_idx").on(table.originState, table.originCity),
    destIdx: index("lane_dest_idx").on(table.destinationState, table.destinationCity),
    statusIdx: index("lane_status_idx").on(table.status),
    effectiveIdx: index("lane_effective_idx").on(table.effectiveDate),
    expirationIdx: index("lane_expiration_idx").on(table.expirationDate),
  })
);

// ============================================================================
// EUSOCONTRACT TYPES
// ============================================================================

export type AgreementTemplate = typeof agreementTemplates.$inferSelect;
export type InsertAgreementTemplate = typeof agreementTemplates.$inferInsert;
export type Agreement = typeof agreements.$inferSelect;
export type InsertAgreement = typeof agreements.$inferInsert;
export type AgreementSignature = typeof agreementSignatures.$inferSelect;
export type InsertAgreementSignature = typeof agreementSignatures.$inferInsert;
export type AgreementAmendment = typeof agreementAmendments.$inferSelect;
export type InsertAgreementAmendment = typeof agreementAmendments.$inferInsert;
export type LoadBid = typeof loadBids.$inferSelect;
export type InsertLoadBid = typeof loadBids.$inferInsert;
export type BidAutoAcceptRule = typeof bidAutoAcceptRules.$inferSelect;
export type InsertBidAutoAcceptRule = typeof bidAutoAcceptRules.$inferInsert;
export type Negotiation = typeof negotiations.$inferSelect;
export type InsertNegotiation = typeof negotiations.$inferInsert;
export type NegotiationMessage = typeof negotiationMessages.$inferSelect;
export type InsertNegotiationMessage = typeof negotiationMessages.$inferInsert;
export type LaneContract = typeof laneContracts.$inferSelect;
export type InsertLaneContract = typeof laneContracts.$inferInsert;

// ============================================================================
// COMPLIANCE NETWORK MEMBERSHIPS
// Tracks company memberships on Avetta, ISNetworld, Veriforce, FMCSA, etc.
// ============================================================================

export const complianceNetworkMemberships = mysqlTable(
  "compliance_network_memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    networkName: varchar("networkName", { length: 50 }).notNull(),
    memberId: varchar("memberId", { length: 100 }).notNull(),
    networkDisplayName: varchar("networkDisplayName", { length: 100 }),
    verificationStatus: mysqlEnum("verificationStatus", [
      "PENDING", "VERIFIED", "FAILED", "EXPIRED", "MANUAL_REVIEW",
    ]).default("PENDING").notNull(),
    verifiedAt: timestamp("verifiedAt"),
    verifiedBy: int("verifiedBy"),
    verificationMethod: varchar("verificationMethod", { length: 30 }),
    verificationData: json("verificationData"),
    proofDocumentUrl: text("proofDocumentUrl"),
    proofDocumentType: varchar("proofDocumentType", { length: 50 }),
    autoPopulatedData: json("autoPopulatedData"),
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
    submittedBy: int("submittedBy").notNull(),
    expiresAt: timestamp("expiresAt"),
    lastCheckedAt: timestamp("lastCheckedAt"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("cnm_company_idx").on(table.companyId),
    networkIdx: index("cnm_network_idx").on(table.networkName, table.memberId),
    statusIdx: index("cnm_status_idx").on(table.verificationStatus),
    expiresIdx: index("cnm_expires_idx").on(table.expiresAt),
  })
);

export type ComplianceNetworkMembership = typeof complianceNetworkMemberships.$inferSelect;
export type InsertComplianceNetworkMembership = typeof complianceNetworkMemberships.$inferInsert;

// ============================================================================
// FMCSA CATALYST CACHE
// Caches FMCSA QCMobile API responses to avoid excessive API calls
// ============================================================================

export const fmcsaCatalystCache = mysqlTable(
  "fmcsa_catalyst_cache",
  {
    id: int("id").autoincrement().primaryKey(),
    dotNumber: varchar("dotNumber", { length: 8 }).notNull().unique(),
    mcNumber: varchar("mcNumber", { length: 10 }),
    catalystData: json("catalystData").notNull(),
    authorityData: json("authorityData"),
    basicsData: json("basicsData"),
    cargoData: json("cargoData"),
    safetyData: json("safetyData"),
    fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    dotIdx: index("fmcsa_dot_idx").on(table.dotNumber),
    mcIdx: index("fmcsa_mc_idx").on(table.mcNumber),
    expiresIdx: index("fmcsa_expires_idx").on(table.expiresAt),
  })
);

export type FmcsaCatalystCache = typeof fmcsaCatalystCache.$inferSelect;
export type InsertFmcsaCatalystCache = typeof fmcsaCatalystCache.$inferInsert;

// ============================================================================
// SPECTRA-MATCH™ CRUDE OIL SPECIFICATIONS (migrated from static crudeOilSpecs.ts)
// 130+ global crude grades with 12 parameters each
// ============================================================================

export const crudeOilSpecs = mysqlTable(
  "crude_oil_specs",
  {
    id: int("id").autoincrement().primaryKey(),
    specId: varchar("specId", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    country: varchar("country", { length: 10 }).notNull(),
    region: varchar("region", { length: 255 }).notNull(),
    apiGravity: json("apiGravity").notNull(), // { min, max, typical }
    sulfur: json("sulfur").notNull(),
    bsw: json("bsw").notNull(),
    salt: json("salt"),
    rvp: json("rvp"),
    pourPoint: json("pourPoint"),
    flashPoint: json("flashPoint"),
    viscosity: json("viscosity"),
    tan: json("tan"),
    characteristics: json("characteristics").notNull(), // string[]
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    specIdIdx: index("cos_specId_idx").on(table.specId),
    countryIdx: index("cos_country_idx").on(table.country),
    typeIdx: index("cos_type_idx").on(table.type),
  })
);

export type CrudeOilSpec = typeof crudeOilSpecs.$inferSelect;
export type InsertCrudeOilSpec = typeof crudeOilSpecs.$inferInsert;

// ============================================================================
// ERG 2020 EMERGENCY RESPONSE GUIDES (Orange Pages)
// ~62 guide numbers with full hazard/response/first-aid procedures
// ============================================================================

export const ergGuides = mysqlTable(
  "erg_guides",
  {
    id: int("id").autoincrement().primaryKey(),
    guideNumber: int("guideNumber").notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    color: varchar("color", { length: 10 }).notNull(),
    potentialHazards: json("potentialHazards").notNull(), // { fireExplosion: string[], health: string[] }
    publicSafety: json("publicSafety").notNull(), // { isolationDistance, fireIsolationDistance, protectiveClothing, evacuationNotes }
    emergencyResponse: json("emergencyResponse").notNull(), // { fire: { small, large, tank }, spillLeak: { general, small, large }, firstAid }
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    guideNumIdx: index("erg_guide_num_idx").on(table.guideNumber),
  })
);

export type ErgGuide = typeof ergGuides.$inferSelect;
export type InsertErgGuide = typeof ergGuides.$inferInsert;

// ============================================================================
// ERG 2020 MATERIALS (Yellow Pages)
// ~2250 hazmat materials with UN numbers, guide references, hazard classes
// ============================================================================

export const ergMaterials = mysqlTable(
  "erg_materials",
  {
    id: int("id").autoincrement().primaryKey(),
    unNumber: varchar("unNumber", { length: 10 }).notNull(),
    name: varchar("name", { length: 512 }).notNull(),
    guide: int("guide").notNull(),
    guideP: boolean("guideP").default(false),
    hazardClass: varchar("hazardClass", { length: 20 }).notNull(),
    packingGroup: varchar("packingGroup", { length: 10 }),
    isTIH: boolean("isTIH").default(false).notNull(),
    isWR: boolean("isWR").default(false),
    alternateNames: json("alternateNames"), // string[]
    toxicGasProduced: varchar("toxicGasProduced", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    unIdx: index("erg_mat_un_idx").on(table.unNumber),
    guideIdx: index("erg_mat_guide_idx").on(table.guide),
    nameIdx: index("erg_mat_name_idx").on(table.name),
    hazClassIdx: index("erg_mat_haz_idx").on(table.hazardClass),
  })
);

export type ErgMaterial = typeof ergMaterials.$inferSelect;
export type InsertErgMaterial = typeof ergMaterials.$inferInsert;

// ============================================================================
// ERG 2020 PROTECTIVE DISTANCES (Green Tables 1 & 2)
// TIH and water-reactive materials with day/night isolation distances
// ============================================================================

export const ergProtectiveDistances = mysqlTable(
  "erg_protective_distances",
  {
    id: int("id").autoincrement().primaryKey(),
    unNumber: varchar("unNumber", { length: 10 }).notNull(),
    name: varchar("name", { length: 512 }).notNull(),
    smallSpill: json("smallSpill").notNull(), // { day: { isolateMeters, protectKm }, night: { isolateMeters, protectKm } }
    largeSpill: json("largeSpill").notNull(),
    refTable3: boolean("refTable3").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    unIdx: index("erg_pd_un_idx").on(table.unNumber),
  })
);

export type ErgProtectiveDistance = typeof ergProtectiveDistances.$inferSelect;
export type InsertErgProtectiveDistance = typeof ergProtectiveDistances.$inferInsert;

// ============================================================================
// DETENTION CLAIMS — Geofence-triggered dwell time billing
// Scenarios: LOAD-012 to LOAD-014 (driver arrives, detention accrues, auto-billed)
// ============================================================================

export const detentionClaims = mysqlTable(
  "detention_claims",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId").notNull(),
    claimedByUserId: int("claimedByUserId").notNull(),
    claimedAgainstUserId: int("claimedAgainstUserId"),
    locationType: mysqlEnum("locationType", ["pickup", "delivery"]).notNull(),
    facilityName: varchar("facilityName", { length: 255 }),
    appointmentTime: timestamp("appointmentTime"),
    arrivalTime: timestamp("arrivalTime").notNull(),
    departureTime: timestamp("departureTime"),
    freeTimeMinutes: int("freeTimeMinutes").default(120),
    totalDwellMinutes: int("totalDwellMinutes"),
    billableMinutes: int("billableMinutes"),
    hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }).default("75.00"),
    totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }),
    status: mysqlEnum("status", [
      "accruing", "pending_review", "approved", "disputed", "denied", "paid",
    ]).default("accruing").notNull(),
    disputeReason: text("disputeReason"),
    disputeEvidence: json("disputeEvidence").$type<{ type: string; url: string; description: string }[]>(),
    gpsEvidence: json("gpsEvidence").$type<{ lat: number; lng: number; timestamp: string }[]>(),
    approvedBy: int("approvedBy"),
    approvedAt: timestamp("approvedAt"),
    paidAt: timestamp("paidAt"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    loadIdx: index("detention_load_idx").on(table.loadId),
    claimedByIdx: index("detention_claimed_by_idx").on(table.claimedByUserId),
    statusIdx: index("detention_status_idx").on(table.status),
  })
);

export type DetentionClaim = typeof detentionClaims.$inferSelect;
export type InsertDetentionClaim = typeof detentionClaims.$inferInsert;

// ============================================================================
// FACTORING INVOICES — Catalyst submits invoice for same-day funding
// Scenarios: WAL-020, WAL-021 (catalyst factors invoice, factoring co collects)
// ============================================================================

export const factoringInvoices = mysqlTable(
  "factoring_invoices",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId").notNull(),
    catalystUserId: int("catalystUserId").notNull(),
    shipperUserId: int("shipperUserId"),
    factoringCompanyId: int("factoringCompanyId"),
    invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull(),
    invoiceAmount: decimal("invoiceAmount", { precision: 10, scale: 2 }).notNull(),
    advanceRate: decimal("advanceRate", { precision: 5, scale: 2 }).default("97.00"),
    factoringFeePercent: decimal("factoringFeePercent", { precision: 5, scale: 2 }).default("3.00"),
    factoringFeeAmount: decimal("factoringFeeAmount", { precision: 10, scale: 2 }),
    advanceAmount: decimal("advanceAmount", { precision: 10, scale: 2 }),
    reserveAmount: decimal("reserveAmount", { precision: 10, scale: 2 }),
    status: mysqlEnum("status", [
      "submitted", "under_review", "approved", "funded", "collection",
      "collected", "short_paid", "disputed", "chargedback", "closed",
    ]).default("submitted").notNull(),
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
    approvedAt: timestamp("approvedAt"),
    fundedAt: timestamp("fundedAt"),
    collectedAt: timestamp("collectedAt"),
    collectedAmount: decimal("collectedAmount", { precision: 10, scale: 2 }),
    dueDate: timestamp("dueDate"),
    supportingDocs: json("supportingDocs").$type<{ type: string; url: string; name: string }[]>(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    loadIdx: index("factoring_load_idx").on(table.loadId),
    catalystIdx: index("factoring_catalyst_idx").on(table.catalystUserId),
    statusIdx: index("factoring_status_idx").on(table.status),
    invoiceNumIdx: unique("factoring_invoice_num_unique").on(table.invoiceNumber),
  })
);

export type FactoringInvoice = typeof factoringInvoices.$inferSelect;
export type InsertFactoringInvoice = typeof factoringInvoices.$inferInsert;

// ============================================================================
// DTC CODES — Diagnostic Trouble Codes for Zeun Mechanics
// Scenario: ZEUN-011 (driver looks up fault code for instant diagnosis)
// ============================================================================

export const dtcCodes = mysqlTable(
  "dtc_codes",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 20 }).notNull(),
    spn: varchar("spn", { length: 20 }),
    fmi: varchar("fmi", { length: 10 }),
    description: varchar("description", { length: 512 }).notNull(),
    severity: mysqlEnum("severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).notNull(),
    category: varchar("category", { length: 100 }),
    symptoms: json("symptoms").$type<string[]>(),
    commonCauses: json("commonCauses").$type<string[]>(),
    canDrive: boolean("canDrive").default(true),
    repairUrgency: varchar("repairUrgency", { length: 100 }),
    estimatedCostMin: decimal("estimatedCostMin", { precision: 10, scale: 2 }),
    estimatedCostMax: decimal("estimatedCostMax", { precision: 10, scale: 2 }),
    estimatedTimeHours: decimal("estimatedTimeHours", { precision: 5, scale: 1 }),
    affectedSystems: json("affectedSystems").$type<string[]>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: unique("dtc_code_unique").on(table.code),
    spnIdx: index("dtc_spn_idx").on(table.spn),
    severityIdx: index("dtc_severity_idx").on(table.severity),
  })
);

export type DtcCode = typeof dtcCodes.$inferSelect;
export type InsertDtcCode = typeof dtcCodes.$inferInsert;

// ============================================================================
// LEASE AGREEMENTS — FMCSR Part 376 Authority Leasing
// Supports: Full Lease-On, Trip Lease, Interline, Seasonal
// ============================================================================

export const leaseAgreements = mysqlTable(
  "lease_agreements",
  {
    id: int("id").autoincrement().primaryKey(),
    // Lessor = carrier whose authority is being used ("Big Wheels Logistics")
    lessorCompanyId: int("lessorCompanyId").notNull(),
    lessorUserId: int("lessorUserId"),
    // Lessee = operator using the authority ("Independent Alice")
    lesseeUserId: int("lesseeUserId").notNull(),
    lesseeCompanyId: int("lesseeCompanyId"),

    leaseType: mysqlEnum("leaseType", [
      "full_lease",    // Long-term lease-on under carrier authority
      "trip_lease",    // Single trip/load authority transfer
      "interline",     // Two carriers sharing a haul
      "seasonal",      // Seasonal lease arrangement
    ]).notNull(),

    status: mysqlEnum("leaseStatus", [
      "draft",
      "pending_signatures",
      "active",
      "expired",
      "terminated",
      "suspended",
    ]).default("draft").notNull(),

    // Authority details (from lessor's company)
    mcNumber: varchar("mcNumber", { length: 50 }),
    dotNumber: varchar("dotNumber", { length: 50 }),

    // Terms
    startDate: timestamp("startDate"),
    endDate: timestamp("endDate"),
    revenueSharePercent: decimal("revenueSharePercent", { precision: 5, scale: 2 }),

    // FMCSR Part 376 compliance checklist
    hasWrittenLease: boolean("hasWrittenLease").default(false),
    hasExclusiveControl: boolean("hasExclusiveControl").default(false),
    hasInsuranceCoverage: boolean("hasInsuranceCoverage").default(false),
    hasVehicleMarking: boolean("hasVehicleMarking").default(false),

    // Insurance
    insuranceProvider: varchar("insuranceProvider", { length: 255 }),
    insurancePolicyNumber: varchar("insurancePolicyNumber", { length: 100 }),
    insuranceExpiry: timestamp("insuranceExpiry"),
    liabilityCoverage: decimal("liabilityCoverage", { precision: 12, scale: 2 }),
    cargoCoverage: decimal("cargoCoverage", { precision: 12, scale: 2 }),

    // Trip lease specifics
    loadId: int("loadId"),
    originCity: varchar("originCity", { length: 100 }),
    originState: varchar("originState", { length: 50 }),
    destinationCity: varchar("destinationCity", { length: 100 }),
    destinationState: varchar("destinationState", { length: 50 }),

    // Equipment covered
    vehicleIds: json("vehicleIds").$type<number[]>(),
    trailerTypes: json("trailerTypes").$type<string[]>(),

    // Signatures
    lessorSignedAt: timestamp("lessorSignedAt"),
    lesseeSignedAt: timestamp("lesseeSignedAt"),

    notes: text("notes"),
    documents: json("leaseDocuments").$type<string[]>(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    lessorCompanyIdx: index("lease_lessor_company_idx").on(table.lessorCompanyId),
    lesseeUserIdx: index("lease_lessee_user_idx").on(table.lesseeUserId),
    statusIdx: index("lease_status_idx").on(table.status),
    leaseTypeIdx: index("lease_type_idx").on(table.leaseType),
    loadIdx: index("lease_load_idx").on(table.loadId),
    dotIdx: index("lease_dot_idx").on(table.dotNumber),
  })
);

export type LeaseAgreement = typeof leaseAgreements.$inferSelect;
export type InsertLeaseAgreement = typeof leaseAgreements.$inferInsert;

// ============================================================================
// RUN TICKETS (Trip Sheets)
// ============================================================================

export const runTickets = mysqlTable(
  "run_tickets",
  {
    id: int("id").autoincrement().primaryKey(),
    ticketNumber: varchar("ticketNumber", { length: 50 }).notNull(),
    loadId: int("loadId"),
    loadNumber: varchar("loadNumber", { length: 100 }),
    driverId: int("driverId").notNull(),
    companyId: int("companyId").notNull(),
    status: mysqlEnum("status", ["active", "completed", "pending_review", "disputed"]).default("active").notNull(),
    origin: varchar("origin", { length: 255 }),
    destination: varchar("destination", { length: 255 }),
    totalMiles: decimal("totalMiles", { precision: 10, scale: 2 }).default("0"),
    totalFuel: decimal("totalFuel", { precision: 10, scale: 2 }).default("0"),
    totalTolls: decimal("totalTolls", { precision: 10, scale: 2 }).default("0"),
    totalExpenses: decimal("totalExpenses", { precision: 10, scale: 2 }).default("0"),
    driverNotes: text("driverNotes"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    driverIdx: index("run_ticket_driver_idx").on(table.driverId),
    companyIdx: index("run_ticket_company_idx").on(table.companyId),
    loadIdx: index("run_ticket_load_idx").on(table.loadId),
    statusIdx: index("run_ticket_status_idx").on(table.status),
  })
);

export type RunTicket = typeof runTickets.$inferSelect;
export type InsertRunTicket = typeof runTickets.$inferInsert;

export const runTicketExpenses = mysqlTable(
  "run_ticket_expenses",
  {
    id: int("id").autoincrement().primaryKey(),
    ticketId: int("ticketId").notNull(),
    type: mysqlEnum("type", ["fuel", "toll", "scale", "parking", "lumper", "detention", "repair", "meal", "other"]).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    description: text("description"),
    receiptUrl: text("receiptUrl"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    ticketIdx: index("expense_ticket_idx").on(table.ticketId),
    typeIdx: index("expense_type_idx").on(table.type),
  })
);

export type RunTicketExpense = typeof runTicketExpenses.$inferSelect;
export type InsertRunTicketExpense = typeof runTicketExpenses.$inferInsert;

// ============================================================================
// REEFER TEMPERATURE MONITORING (D-066 / FSMA 21 CFR 1.908)
// ============================================================================

export const reeferReadings = mysqlTable(
  "reefer_readings",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId"),
    vehicleId: int("vehicleId"),
    driverId: int("driverId").notNull(),
    companyId: int("companyId"),
    zone: mysqlEnum("zone", ["front", "center", "rear"]).notNull(),
    tempF: decimal("tempF", { precision: 6, scale: 2 }).notNull(),
    tempC: decimal("tempC", { precision: 6, scale: 2 }).notNull(),
    targetMinF: decimal("targetMinF", { precision: 6, scale: 2 }),
    targetMaxF: decimal("targetMaxF", { precision: 6, scale: 2 }),
    status: mysqlEnum("status", ["normal", "warning", "critical"]).default("normal").notNull(),
    source: mysqlEnum("source", ["sensor", "manual"]).default("sensor").notNull(),
    notes: text("notes"),
    recordedAt: timestamp("recordedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    driverIdx: index("reefer_reading_driver_idx").on(table.driverId),
    loadIdx: index("reefer_reading_load_idx").on(table.loadId),
    vehicleIdx: index("reefer_reading_vehicle_idx").on(table.vehicleId),
    recordedAtIdx: index("reefer_reading_recorded_idx").on(table.recordedAt),
    statusIdx: index("reefer_reading_status_idx").on(table.status),
  })
);

export type ReeferReading = typeof reeferReadings.$inferSelect;
export type InsertReeferReading = typeof reeferReadings.$inferInsert;

export const reeferAlerts = mysqlTable(
  "reefer_alerts",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId"),
    vehicleId: int("vehicleId"),
    driverId: int("driverId").notNull(),
    companyId: int("companyId"),
    severity: mysqlEnum("severity", ["warning", "critical"]).notNull(),
    message: text("message").notNull(),
    zone: mysqlEnum("zone", ["front", "center", "rear"]),
    tempF: decimal("tempF", { precision: 6, scale: 2 }),
    acknowledged: boolean("acknowledged").default(false).notNull(),
    acknowledgedAt: timestamp("acknowledgedAt"),
    acknowledgedBy: int("acknowledgedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    driverIdx: index("reefer_alert_driver_idx").on(table.driverId),
    loadIdx: index("reefer_alert_load_idx").on(table.loadId),
    acknowledgedIdx: index("reefer_alert_ack_idx").on(table.acknowledged),
  })
);

export type ReeferAlert = typeof reeferAlerts.$inferSelect;
export type InsertReeferAlert = typeof reeferAlerts.$inferInsert;

// ============================================================================
// PER-LOAD INSURANCE (C-100/S-053 + C-101/S-054)
// ============================================================================

export const perLoadInsurancePolicies = mysqlTable(
  "per_load_insurance_policies",
  {
    id: int("id").autoincrement().primaryKey(),
    policyNumber: varchar("policyNumber", { length: 50 }).notNull().unique(),
    loadId: int("loadId"),
    userId: int("userId").notNull(),
    companyId: int("companyId"),
    cargoValue: decimal("cargoValue", { precision: 12, scale: 2 }).notNull(),
    coverageAmount: decimal("coverageAmount", { precision: 12, scale: 2 }).notNull(),
    deductible: decimal("deductible", { precision: 10, scale: 2 }).notNull(),
    premium: decimal("premium", { precision: 10, scale: 2 }).notNull(),
    basePremium: decimal("basePremium", { precision: 10, scale: 2 }).notNull(),
    hazmatSurcharge: decimal("hazmatSurcharge", { precision: 10, scale: 2 }).default("0"),
    reeferSurcharge: decimal("reeferSurcharge", { precision: 10, scale: 2 }).default("0"),
    highValueSurcharge: decimal("highValueSurcharge", { precision: 10, scale: 2 }).default("0"),
    commodityType: varchar("commodityType", { length: 100 }).notNull(),
    policyType: varchar("policyType", { length: 100 }).notNull(),
    origin: varchar("origin", { length: 255 }),
    destination: varchar("destination", { length: 255 }),
    status: mysqlEnum("status", ["quoted", "active", "expired", "cancelled", "claimed"]).default("quoted").notNull(),
    activatedAt: timestamp("activatedAt"),
    expiresAt: timestamp("expiresAt"),
    walletTransactionId: int("walletTransactionId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("pli_user_idx").on(table.userId),
    loadIdx: index("pli_load_idx").on(table.loadId),
    statusIdx: index("pli_status_idx").on(table.status),
    policyNumIdx: unique("pli_policy_num_unique").on(table.policyNumber),
  })
);

export type PerLoadInsurancePolicy = typeof perLoadInsurancePolicies.$inferSelect;
export type InsertPerLoadInsurancePolicy = typeof perLoadInsurancePolicies.$inferInsert;

// ============================================================================
// IRP REGISTRATIONS (C-073)
// ============================================================================

export const irpRegistrations = mysqlTable(
  "irp_registrations",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    vehicleId: int("vehicleId"),
    cabCardNumber: varchar("cabCardNumber", { length: 100 }),
    state: varchar("state", { length: 5 }).notNull(),
    maxWeight: int("maxWeight"),
    distancePercent: decimal("distancePercent", { precision: 5, scale: 2 }),
    feesPaid: decimal("feesPaid", { precision: 10, scale: 2 }),
    status: mysqlEnum("status", ["active", "pending", "expired", "suspended"]).default("active").notNull(),
    effectiveDate: timestamp("effectiveDate"),
    expirationDate: timestamp("expirationDate"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("irp_company_idx").on(table.companyId),
    stateIdx: index("irp_state_idx").on(table.state),
    statusIdx: index("irp_status_idx").on(table.status),
  })
);

export type IrpRegistration = typeof irpRegistrations.$inferSelect;
export type InsertIrpRegistration = typeof irpRegistrations.$inferInsert;

// ============================================================================
// DEBTORS & CREDIT CHECKS (B-042)
// ============================================================================

export const debtors = mysqlTable(
  "debtors",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId"),
    factoringUserId: int("factoringUserId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: mysqlEnum("type", ["shipper", "broker"]).notNull(),
    mcNumber: varchar("mcNumber", { length: 50 }),
    dotNumber: varchar("dotNumber", { length: 50 }),
    creditScore: int("creditScore"),
    creditRating: varchar("creditRating", { length: 5 }),
    totalFactored: decimal("totalFactored", { precision: 14, scale: 2 }).default("0"),
    outstanding: decimal("outstanding", { precision: 14, scale: 2 }).default("0"),
    avgDaysToPay: int("avgDaysToPay"),
    invoiceCount: int("invoiceCount").default(0),
    lastPaymentAt: timestamp("lastPaymentAt"),
    riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).default("medium").notNull(),
    trend: mysqlEnum("trend", ["up", "down", "stable"]).default("stable"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    factoringUserIdx: index("debtor_factoring_user_idx").on(table.factoringUserId),
    riskIdx: index("debtor_risk_idx").on(table.riskLevel),
    nameIdx: index("debtor_name_idx").on(table.name),
  })
);

export type Debtor = typeof debtors.$inferSelect;
export type InsertDebtor = typeof debtors.$inferInsert;

export const creditChecks = mysqlTable(
  "credit_checks",
  {
    id: int("id").autoincrement().primaryKey(),
    requestedBy: int("requestedBy").notNull(),
    entityName: varchar("entityName", { length: 255 }).notNull(),
    entityType: mysqlEnum("entityType", ["shipper", "broker", "carrier"]),
    mcNumber: varchar("mcNumber", { length: 50 }),
    dotNumber: varchar("dotNumber", { length: 50 }),
    creditScore: int("creditScore"),
    creditRating: varchar("creditRating", { length: 5 }),
    avgDaysToPay: int("avgDaysToPay"),
    yearsInBusiness: int("yearsInBusiness"),
    publicRecords: int("publicRecords").default(0),
    recommendation: mysqlEnum("recommendation", ["approve", "review", "decline"]),
    resultData: json("resultData"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    requestedByIdx: index("credit_check_user_idx").on(table.requestedBy),
    entityNameIdx: index("credit_check_entity_idx").on(table.entityName),
  })
);

export type CreditCheck = typeof creditChecks.$inferSelect;
export type InsertCreditCheck = typeof creditChecks.$inferInsert;

// ============================================================================
// LOCATION BREADCRUMBS — High-volume GPS trail (Section 3/13 of EusoMap spec)
// Every GPS point from every driver becomes a breadcrumb for route replay,
// mileage calculation, route deviation detection, detention proof, safety reconstruction.
// ============================================================================

export const locationBreadcrumbs = mysqlTable(
  "location_breadcrumbs",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId"),
    driverId: int("driverId").notNull(),
    vehicleId: int("vehicleId"),
    lat: decimal("lat", { precision: 10, scale: 7 }).notNull(),
    lng: decimal("lng", { precision: 10, scale: 7 }).notNull(),
    accuracy: decimal("accuracy", { precision: 8, scale: 2 }),
    speed: decimal("speed", { precision: 6, scale: 2 }),
    heading: decimal("heading", { precision: 6, scale: 2 }),
    altitude: decimal("altitude", { precision: 8, scale: 2 }),
    batteryLevel: int("batteryLevel"),
    isCharging: boolean("isCharging").default(false),
    loadState: varchar("loadState", { length: 30 }),
    snappedLat: decimal("snappedLat", { precision: 10, scale: 7 }),
    snappedLng: decimal("snappedLng", { precision: 10, scale: 7 }),
    roadName: varchar("roadName", { length: 200 }),
    odometerMiles: decimal("odometerMiles", { precision: 10, scale: 2 }),
    isMock: boolean("isMock").default(false),
    source: mysqlEnum("source", ["device", "eld", "manual", "system"]).default("device"),
    isGeofenceEvent: boolean("isGeofenceEvent").default(false),
    geofenceId: int("geofenceId"),
    deviceTimestamp: timestamp("deviceTimestamp"),
    serverTimestamp: timestamp("serverTimestamp").defaultNow().notNull(),
  },
  (table) => ({
    loadTsIdx: index("breadcrumb_load_ts_idx").on(table.loadId, table.serverTimestamp),
    driverTsIdx: index("breadcrumb_driver_ts_idx").on(table.driverId, table.serverTimestamp),
    vehicleTsIdx: index("breadcrumb_vehicle_ts_idx").on(table.vehicleId, table.serverTimestamp),
    loadStateIdx: index("breadcrumb_state_idx").on(table.loadState),
  })
);

export type LocationBreadcrumb = typeof locationBreadcrumbs.$inferSelect;
export type InsertLocationBreadcrumb = typeof locationBreadcrumbs.$inferInsert;

// ============================================================================
// GEOTAGS — Immutable audit trail (Section 5/13 of EusoMap spec)
// Every significant event is location-stamped. Once created, geotags CANNOT be
// modified or deleted. They are the legal audit trail for detention claims,
// delivery proof, and compliance.
// ============================================================================

export const geotags = mysqlTable(
  "geotags",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId"),
    userId: int("userId").notNull(),
    userRole: varchar("userRole", { length: 30 }).notNull(),
    driverId: int("driverId"),
    vehicleId: int("vehicleId"),
    eventType: varchar("eventType", { length: 50 }).notNull(),
    eventCategory: mysqlEnum("eventCategory", [
      "load_lifecycle", "compliance", "safety", "operational", "photo", "document"
    ]).notNull(),
    lat: decimal("lat", { precision: 10, scale: 7 }).notNull(),
    lng: decimal("lng", { precision: 10, scale: 7 }).notNull(),
    accuracy: decimal("accuracy", { precision: 8, scale: 2 }),
    altitude: decimal("altitude", { precision: 8, scale: 2 }),
    reverseGeocode: json("reverseGeocode"),
    eventTimestamp: timestamp("eventTimestamp").notNull(),
    deviceTimestamp: timestamp("deviceTimestamp"),
    serverTimestamp: timestamp("serverTimestamp").defaultNow().notNull(),
    photoUrls: json("photoUrls"),
    signatureUrl: varchar("signatureUrl", { length: 500 }),
    documentUrls: json("documentUrls"),
    metadata: json("metadata"),
    loadState: varchar("loadState", { length: 30 }),
    source: mysqlEnum("source", ["gps_auto", "geofence_auto", "driver_manual", "system"]).notNull(),
    isVerified: boolean("isVerified").default(false),
    verifiedBy: int("verifiedBy"),
    tamperedFlag: boolean("tamperedFlag").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    loadTsIdx: index("geotag_load_ts_idx").on(table.loadId, table.eventTimestamp),
    userTsIdx: index("geotag_user_ts_idx").on(table.userId, table.eventTimestamp),
    typeIdx: index("geotag_type_idx").on(table.eventType, table.eventTimestamp),
    categoryIdx: index("geotag_category_idx").on(table.eventCategory),
    driverIdx: index("geotag_driver_idx").on(table.driverId),
  })
);

export type Geotag = typeof geotags.$inferSelect;
export type InsertGeotag = typeof geotags.$inferInsert;

// ============================================================================
// LOAD ROUTES — Hazmat-compliant cached routes (Section 6/13/17 of EusoMap spec)
// Stores the full calculated route including polyline, hazmat restrictions,
// tunnel restrictions, state crossings, suggested HOS stops, weigh stations.
// ============================================================================

export const loadRoutes = mysqlTable(
  "load_routes",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId").notNull(),
    polyline: text("polyline").notNull(),
    distanceMiles: decimal("distanceMiles", { precision: 10, scale: 2 }).notNull(),
    durationSeconds: int("durationSeconds").notNull(),
    isHazmatCompliant: boolean("isHazmatCompliant").notNull().default(false),
    hazmatRestrictions: json("hazmatRestrictions"),
    tunnelRestrictions: json("tunnelRestrictions"),
    stateCrossings: json("stateCrossings"),
    suggestedStops: json("suggestedStops"),
    weighStations: json("weighStations"),
    weatherAlerts: json("weatherAlerts"),
    permitRequirements: json("permitRequirements"),
    fuelStops: json("fuelStops"),
    boundsNeLat: decimal("boundsNeLat", { precision: 10, scale: 7 }),
    boundsNeLng: decimal("boundsNeLng", { precision: 10, scale: 7 }),
    boundsSwLat: decimal("boundsSwLat", { precision: 10, scale: 7 }),
    boundsSwLng: decimal("boundsSwLng", { precision: 10, scale: 7 }),
    tollEstimate: decimal("tollEstimate", { precision: 10, scale: 2 }),
    fuelEstimate: decimal("fuelEstimate", { precision: 10, scale: 2 }),
    isActive: boolean("isActive").default(true),
    calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  },
  (table) => ({
    loadIdx: index("load_route_load_idx").on(table.loadId),
    activeIdx: index("load_route_active_idx").on(table.isActive),
  })
);

export type LoadRoute = typeof loadRoutes.$inferSelect;
export type InsertLoadRoute = typeof loadRoutes.$inferInsert;

// ============================================================================
// DETENTION RECORDS — Automatic detention tracking (Sections 4.3/8.2 of EusoMap spec)
// Clocks start on geofence ENTER, stop on EXIT. If dwell exceeds free time
// (default 2 hours), detention billing triggers automatically.
// ============================================================================

export const detentionRecords = mysqlTable(
  "detention_records",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId").notNull(),
    locationType: mysqlEnum("locationType", ["pickup", "delivery"]).notNull(),
    facilityId: int("facilityId"),
    geofenceId: int("geofenceId"),
    driverId: int("driverId"),
    geofenceEnterAt: timestamp("geofenceEnterAt").notNull(),
    geofenceExitAt: timestamp("geofenceExitAt"),
    freeTimeMinutes: int("freeTimeMinutes").default(120),
    detentionStartedAt: timestamp("detentionStartedAt"),
    totalDwellMinutes: int("totalDwellMinutes"),
    detentionMinutes: int("detentionMinutes"),
    detentionRatePerHour: decimal("detentionRatePerHour", { precision: 10, scale: 2 }),
    detentionCharge: decimal("detentionCharge", { precision: 10, scale: 2 }),
    isBillable: boolean("isBillable").default(false),
    isPaid: boolean("isPaid").default(false),
    enterGeotagId: int("enterGeotagId"),
    exitGeotagId: int("exitGeotagId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    loadIdx: index("detention_load_idx").on(table.loadId),
    driverIdx: index("detention_driver_idx").on(table.driverId),
    facilityIdx: index("detention_facility_idx").on(table.facilityId),
    billableIdx: index("detention_billable_idx").on(table.isBillable),
  })
);

export type DetentionRecord = typeof detentionRecords.$inferSelect;
export type InsertDetentionRecord = typeof detentionRecords.$inferInsert;

// ============================================================================
// STATE CROSSINGS — IFTA fuel tax + permit compliance (Section 4.3/17 of EusoMap spec)
// Logged automatically when STATE_BORDER geofence fires. Used for IFTA mileage
// reports by state, permit verification, and compliance auditing.
// ============================================================================

export const stateCrossings = mysqlTable(
  "state_crossings",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("loadId").notNull(),
    driverId: int("driverId").notNull(),
    vehicleId: int("vehicleId"),
    fromState: varchar("fromState", { length: 2 }).notNull(),
    toState: varchar("toState", { length: 2 }).notNull(),
    crossingLat: decimal("crossingLat", { precision: 10, scale: 7 }).notNull(),
    crossingLng: decimal("crossingLng", { precision: 10, scale: 7 }).notNull(),
    crossedAt: timestamp("crossedAt").notNull(),
    odometerAtCrossing: decimal("odometerAtCrossing", { precision: 10, scale: 2 }),
    milesInFromState: decimal("milesInFromState", { precision: 10, scale: 2 }),
    permitValid: boolean("permitValid"),
    permitCheckedAt: timestamp("permitCheckedAt"),
    geotagId: int("geotagId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    loadIdx: index("state_crossing_load_idx").on(table.loadId, table.crossedAt),
    vehicleIdx: index("state_crossing_vehicle_idx").on(table.vehicleId, table.crossedAt),
    driverIdx: index("state_crossing_driver_idx").on(table.driverId),
    stateIdx: index("state_crossing_state_idx").on(table.toState),
  })
);

export type StateCrossing = typeof stateCrossings.$inferSelect;
export type InsertStateCrossing = typeof stateCrossings.$inferInsert;

// ============================================================================
// DOCUMENT CENTER — Smart Document Management System
// ============================================================================

export const documentTypes = mysqlTable(
  "document_types",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    category: mysqlEnum("category", [
      "CDL", "DOT", "HAZ", "INS", "TAX", "EMP", "VEH", "SAF", "OPS", "AUT", "COM", "LEG", "STATE",
    ]).notNull(),
    subcategory: varchar("subcategory", { length: 50 }),
    name: varchar("name", { length: 200 }).notNull(),
    shortName: varchar("shortName", { length: 50 }),
    description: text("description"),
    formNumber: varchar("formNumber", { length: 50 }),
    issuingAuthority: varchar("issuingAuthority", { length: 200 }),
    regulatoryReference: varchar("regulatoryReference", { length: 200 }),
    sourceUrl: text("sourceUrl"),
    downloadUrl: text("downloadUrl"),
    instructionsUrl: text("instructionsUrl"),
    hasExpiration: boolean("hasExpiration").default(false),
    typicalValidityDays: int("typicalValidityDays"),
    expirationWarningDays: int("expirationWarningDays").default(30),
    verificationLevel: mysqlEnum("verificationLevel", [
      "L0_SELF", "L1_SYSTEM", "L2_STAFF", "L3_EXTERNAL",
    ]).default("L1_SYSTEM"),
    requiresSignature: boolean("requiresSignature").default(false),
    requiresNotarization: boolean("requiresNotarization").default(false),
    requiresWitness: boolean("requiresWitness").default(false),
    acceptedFileTypes: varchar("acceptedFileTypes", { length: 100 }).default("pdf,jpg,jpeg,png"),
    maxFileSizeMb: int("maxFileSizeMb").default(10),
    minResolutionDpi: int("minResolutionDpi").default(150),
    ocrEnabled: boolean("ocrEnabled").default(true),
    ocrFieldMappings: json("ocrFieldMappings"),
    isStateSpecific: boolean("isStateSpecific").default(false),
    applicableStates: json("applicableStates"),
    sortOrder: int("sortOrder").default(100),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("idx_doc_types_category").on(table.category),
    activeIdx: index("idx_doc_types_active").on(table.isActive),
  })
);

export type DocumentType = typeof documentTypes.$inferSelect;
export type InsertDocumentType = typeof documentTypes.$inferInsert;

export const documentRequirements = mysqlTable(
  "document_requirements",
  {
    id: int("id").autoincrement().primaryKey(),
    documentTypeId: varchar("documentTypeId", { length: 50 }).notNull(),
    requiredForRole: mysqlEnum("requiredForRole", [
      "DRIVER", "OWNER_OPERATOR", "CARRIER", "FLEET_MANAGER", "DISPATCHER",
      "SHIPPER", "BROKER", "COMPLIANCE_OFFICER", "SAFETY_MANAGER",
      "LUMPER", "FACTORING_COMPANY", "ADMIN", "SUPER_ADMIN",
      "CATALYST", "ESCORT", "DISPATCH", "TERMINAL_MANAGER", "FACTORING",
    ]).notNull(),
    requiredForEmploymentType: mysqlEnum("requiredForEmploymentType", [
      "W2_EMPLOYEE", "1099_CONTRACTOR", "OWNER_OPERATOR", "COMPANY_OWNER",
    ]),
    isRequired: boolean("isRequired").default(true),
    isBlocking: boolean("isBlocking").default(true),
    priority: int("priority").default(1),
    conditionType: varchar("conditionType", { length: 50 }),
    conditionOperator: varchar("conditionOperator", { length: 20 }),
    conditionValue: json("conditionValue"),
    requiredInStates: json("requiredInStates"),
    exemptInStates: json("exemptInStates"),
    requiredAtOnboarding: boolean("requiredAtOnboarding").default(true),
    gracePeriodDays: int("gracePeriodDays").default(0),
    renewalReminderDays: json("renewalReminderDays").default([90, 60, 30, 14, 7, 3, 1]),
    uploadInstructions: text("uploadInstructions"),
    acceptanceCriteria: text("acceptanceCriteria"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    roleIdx: index("idx_doc_req_role").on(table.requiredForRole),
    docTypeIdx: index("idx_doc_req_doctype").on(table.documentTypeId),
  })
);

export type DocumentRequirement = typeof documentRequirements.$inferSelect;
export type InsertDocumentRequirement = typeof documentRequirements.$inferInsert;

export const userDocuments = mysqlTable(
  "user_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    companyId: int("companyId"),
    documentTypeId: varchar("documentTypeId", { length: 50 }).notNull(),
    blobUrl: text("blobUrl").notNull(),
    blobPath: varchar("blobPath", { length: 500 }),
    fileName: varchar("fileName", { length: 500 }).notNull(),
    fileSize: int("fileSize"),
    mimeType: varchar("mimeType", { length: 100 }),
    fileHash: varchar("fileHash", { length: 64 }),
    documentNumber: text("documentNumber"),
    documentNumberLast4: varchar("documentNumberLast4", { length: 4 }),
    issuedBy: varchar("issuedBy", { length: 200 }),
    issuedByState: varchar("issuedByState", { length: 2 }),
    issuedDate: varchar("issuedDate", { length: 10 }),
    effectiveDate: varchar("effectiveDate", { length: 10 }),
    expiresAt: varchar("expiresAt", { length: 10 }),
    status: mysqlEnum("docStatus", [
      "NOT_UPLOADED", "UPLOADING", "PENDING_REVIEW", "VERIFIED", "REJECTED",
      "EXPIRED", "EXPIRING_SOON", "SUPERSEDED", "NOT_APPLICABLE", "WAIVED",
    ]).default("PENDING_REVIEW").notNull(),
    statusChangedAt: timestamp("statusChangedAt").defaultNow(),
    statusChangedBy: int("statusChangedBy"),
    verificationLevel: mysqlEnum("docVerifLevel", [
      "L0_SELF", "L1_SYSTEM", "L2_STAFF", "L3_EXTERNAL",
    ]),
    verifiedAt: timestamp("verifiedAt"),
    verifiedBy: int("verifiedBy"),
    verificationNotes: text("verificationNotes"),
    rejectionReason: text("rejectionReason"),
    rejectionCode: varchar("rejectionCode", { length: 50 }),
    ocrProcessed: boolean("ocrProcessed").default(false),
    ocrProcessedAt: timestamp("ocrProcessedAt"),
    ocrExtractedData: json("ocrExtractedData"),
    ocrConfidenceScore: decimal("ocrConfidenceScore", { precision: 5, scale: 2 }),
    ocrErrors: json("ocrErrors"),
    externalVerified: boolean("externalVerified").default(false),
    externalVerifiedAt: timestamp("externalVerifiedAt"),
    externalVerificationSource: varchar("externalVerificationSource", { length: 100 }),
    externalVerificationData: json("externalVerificationData"),
    version: int("version").default(1),
    previousVersionId: int("previousVersionId"),
    supersededAt: timestamp("supersededAt"),
    supersededBy: int("supersededBy"),
    uploadedBy: int("uploadedBy").notNull(),
    uploadedAt: timestamp("uploadedAt").defaultNow(),
    uploadIpAddress: varchar("uploadIpAddress", { length: 45 }),
    uploadUserAgent: text("uploadUserAgent"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
    deletedBy: int("deletedBy"),
    deletionReason: text("deletionReason"),
  },
  (table) => ({
    userIdx: index("idx_user_docs_user").on(table.userId),
    companyIdx: index("idx_user_docs_company").on(table.companyId),
    typeIdx: index("idx_user_docs_type").on(table.documentTypeId),
    statusIdx: index("idx_user_docs_status").on(table.status),
    expiresIdx: index("idx_user_docs_expires").on(table.expiresAt),
    userTypeIdx: index("idx_user_docs_user_type").on(table.userId, table.documentTypeId),
  })
);

export type UserDocument = typeof userDocuments.$inferSelect;
export type InsertUserDocument = typeof userDocuments.$inferInsert;

export const userDocumentRequirements = mysqlTable(
  "user_document_requirements",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    documentTypeId: varchar("documentTypeId", { length: 50 }).notNull(),
    documentRequirementId: int("documentRequirementId"),
    isRequired: boolean("isRequired").default(true),
    isBlocking: boolean("isBlocking").default(true),
    priority: int("priority").default(1),
    status: mysqlEnum("udrStatus", [
      "NOT_UPLOADED", "UPLOADING", "PENDING_REVIEW", "VERIFIED", "REJECTED",
      "EXPIRED", "EXPIRING_SOON", "SUPERSEDED", "NOT_APPLICABLE", "WAIVED",
    ]).default("NOT_UPLOADED").notNull(),
    currentDocumentId: int("currentDocumentId"),
    expiresAt: varchar("udrExpiresAt", { length: 10 }),
    daysUntilExpiry: int("daysUntilExpiry"),
    isExpired: boolean("isExpired").default(false),
    isExpiringSoon: boolean("isExpiringSoon").default(false),
    complianceWeight: int("complianceWeight").default(10),
    requirementReason: text("requirementReason"),
    requirementSource: varchar("requirementSource", { length: 100 }),
    calculatedAt: timestamp("calculatedAt").defaultNow(),
    lastNotifiedAt: timestamp("lastNotifiedAt"),
    nextNotificationAt: timestamp("nextNotificationAt"),
    gracePeriodEndsAt: timestamp("gracePeriodEndsAt"),
    isInGracePeriod: boolean("isInGracePeriod").default(false),
  },
  (table) => ({
    userIdx: index("idx_udr_user").on(table.userId),
    statusIdx: index("idx_udr_status").on(table.status),
    expiresIdx: index("idx_udr_expires").on(table.expiresAt),
    userDocUnique: unique("idx_udr_unique").on(table.userId, table.documentTypeId),
  })
);

export type UserDocumentRequirement = typeof userDocumentRequirements.$inferSelect;
export type InsertUserDocumentRequirement = typeof userDocumentRequirements.$inferInsert;

export const docComplianceStatus = mysqlTable(
  "doc_compliance_status",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    companyId: int("companyId"),
    overallStatus: varchar("overallStatus", { length: 20 }).notNull(),
    complianceScore: int("complianceScore"),
    canOperate: boolean("canOperate").default(false),
    totalRequired: int("totalRequired").default(0),
    totalUploaded: int("totalUploaded").default(0),
    totalVerified: int("totalVerified").default(0),
    totalMissing: int("totalMissing").default(0),
    totalExpired: int("totalExpired").default(0),
    totalExpiringSoon: int("totalExpiringSoon").default(0),
    totalPendingReview: int("totalPendingReview").default(0),
    totalRejected: int("totalRejected").default(0),
    hasBlockingIssues: boolean("hasBlockingIssues").default(false),
    blockingDocuments: json("blockingDocuments").default([]),
    missingDocuments: json("missingDocuments").default([]),
    expiredDocuments: json("expiredDocuments").default([]),
    expiringDocuments: json("expiringDocuments").default([]),
    pendingDocuments: json("pendingDocuments").default([]),
    rejectedDocuments: json("rejectedDocuments").default([]),
    nextExpirationDate: varchar("nextExpirationDate", { length: 10 }),
    nextExpiringDocument: varchar("nextExpiringDocument", { length: 50 }),
    calculatedAt: timestamp("calculatedAt").defaultNow(),
    validUntil: timestamp("validUntil"),
  },
  (table) => ({
    userIdx: unique("idx_doc_compliance_user").on(table.userId),
    companyIdx: index("idx_doc_compliance_company").on(table.companyId),
  })
);

export type DocComplianceStatus = typeof docComplianceStatus.$inferSelect;
export type InsertDocComplianceStatus = typeof docComplianceStatus.$inferInsert;

export const stateDocRequirements = mysqlTable(
  "state_doc_requirements",
  {
    id: int("id").autoincrement().primaryKey(),
    stateCode: varchar("stateCode", { length: 2 }).notNull(),
    stateName: varchar("stateName", { length: 100 }).notNull(),
    documentTypeId: varchar("documentTypeId", { length: 50 }).notNull(),
    stateFormNumber: varchar("stateFormNumber", { length: 50 }),
    stateFormName: varchar("stateFormName", { length: 200 }),
    stateIssuingAgency: varchar("stateIssuingAgency", { length: 200 }),
    statePortalUrl: text("statePortalUrl"),
    stateFormUrl: text("stateFormUrl"),
    stateInstructionsUrl: text("stateInstructionsUrl"),
    isRequired: boolean("isRequired").default(true),
    requiredForRoles: json("requiredForRoles"),
    conditions: json("conditions"),
    filingFee: decimal("filingFee", { precision: 10, scale: 2 }),
    renewalFee: decimal("renewalFee", { precision: 10, scale: 2 }),
    lateFee: decimal("lateFee", { precision: 10, scale: 2 }),
    validityPeriod: varchar("validityPeriod", { length: 50 }),
    renewalWindow: varchar("renewalWindow", { length: 100 }),
    notes: text("notes"),
    lastVerified: varchar("lastVerified", { length: 10 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    stateIdx: index("idx_state_doc_req_state").on(table.stateCode),
    docTypeIdx: index("idx_state_doc_req_doctype").on(table.documentTypeId),
    stateDocUnique: unique("idx_state_doc_req_unique").on(table.stateCode, table.documentTypeId),
  })
);

export type StateDocRequirement = typeof stateDocRequirements.$inferSelect;
export type InsertStateDocRequirement = typeof stateDocRequirements.$inferInsert;

export const userOperatingStates = mysqlTable(
  "user_operating_states",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    stateCode: varchar("stateCode", { length: 2 }).notNull(),
    isHomeState: boolean("isHomeState").default(false),
    isRegisteredState: boolean("isRegisteredState").default(false),
    isOperatingState: boolean("isOperatingState").default(true),
    hasStatePermit: boolean("hasStatePermit").default(false),
    permitNumber: varchar("permitNumber", { length: 100 }),
    permitExpiresAt: varchar("permitExpiresAt", { length: 10 }),
    hasWeightDistanceTax: boolean("hasWeightDistanceTax").default(false),
    weightDistanceAccountNumber: varchar("weightDistanceAccountNumber", { length: 100 }),
    addedAt: timestamp("addedAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_user_op_states_user").on(table.userId),
    userStateUnique: unique("idx_user_op_states_unique").on(table.userId, table.stateCode),
  })
);

export type UserOperatingState = typeof userOperatingStates.$inferSelect;
export type InsertUserOperatingState = typeof userOperatingStates.$inferInsert;

export const documentTemplates = mysqlTable(
  "document_templates",
  {
    id: int("id").autoincrement().primaryKey(),
    documentTypeId: varchar("documentTypeId", { length: 50 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    version: varchar("version", { length: 20 }).notNull(),
    templateUrl: text("templateUrl").notNull(),
    thumbnailUrl: text("thumbnailUrl"),
    isFillable: boolean("isFillable").default(false),
    formFields: json("formFields"),
    sourceUrl: text("sourceUrl"),
    lastOfficialUpdate: varchar("lastOfficialUpdate", { length: 10 }),
    stateCode: varchar("stateCode", { length: 2 }),
    isActive: boolean("isActive").default(true),
    effectiveDate: varchar("effectiveDate", { length: 10 }),
    supersededById: int("supersededById"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    docTypeIdx: index("idx_templates_doctype").on(table.documentTypeId),
    stateIdx: index("idx_templates_state").on(table.stateCode),
  })
);

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = typeof documentTemplates.$inferInsert;

export const documentNotifications = mysqlTable(
  "document_notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    documentTypeId: varchar("documentTypeId", { length: 50 }).notNull(),
    userDocumentId: int("userDocumentId"),
    notificationType: varchar("notificationType", { length: 50 }).notNull(),
    scheduledFor: timestamp("scheduledFor").notNull(),
    sentAt: timestamp("sentAt"),
    isSent: boolean("isSent").default(false),
    channels: json("channels").default(["EMAIL", "IN_APP"]),
    channelResults: json("channelResults"),
    subject: text("subject"),
    message: text("message"),
    actionUrl: text("actionUrl"),
    readAt: timestamp("readAt"),
    clickedAt: timestamp("clickedAt"),
    dismissedAt: timestamp("dismissedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_doc_notif_user").on(table.userId),
    scheduledIdx: index("idx_doc_notif_scheduled").on(table.scheduledFor),
    pendingIdx: index("idx_doc_notif_pending").on(table.isSent, table.scheduledFor),
  })
);

export type DocumentNotification = typeof documentNotifications.$inferSelect;
export type InsertDocumentNotification = typeof documentNotifications.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// HOT ZONES DATA INTEGRATION TABLES (16 tables)
// Real-time government data feeds for hazmat logistics intelligence
// ═══════════════════════════════════════════════════════════════════════════════

// -- FUEL PRICES (EIA + AAA + OPIS) --
export const hzFuelPrices = mysqlTable("hz_fuel_prices", {
  id: varchar("id", { length: 36 }).primaryKey(),
  stateCode: char("state_code", { length: 2 }).notNull(),
  paddRegion: varchar("padd_region", { length: 10 }),
  dieselRetail: decimal("diesel_retail", { precision: 6, scale: 3 }),
  gasolineRetail: decimal("gasoline_retail", { precision: 6, scale: 3 }),
  dieselRack: decimal("diesel_rack", { precision: 6, scale: 3 }),
  ulsdRack: decimal("ulsd_rack", { precision: 6, scale: 3 }),
  dieselChange1w: decimal("diesel_change_1w", { precision: 5, scale: 3 }),
  dieselChange1m: decimal("diesel_change_1m", { precision: 5, scale: 3 }),
  source: mysqlEnum("source", ["EIA", "AAA", "OPIS"]).notNull(),
  reportDate: date("report_date").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  stateDate: index("idx_hz_fuel_state_date").on(table.stateCode, table.reportDate),
  paddDate: index("idx_hz_fuel_padd_date").on(table.paddRegion, table.reportDate),
}));

export type HzFuelPrice = typeof hzFuelPrices.$inferSelect;
export type InsertHzFuelPrice = typeof hzFuelPrices.$inferInsert;

// -- WEATHER ALERTS (NWS) --
export const hzWeatherAlerts = mysqlTable("hz_weather_alerts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  stateCodes: json("state_codes"),
  zoneIds: json("zone_ids"),
  affectedCounties: json("affected_counties"),
  geometry: json("geometry"),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  severity: mysqlEnum("severity", ["Minor", "Moderate", "Severe", "Extreme", "Unknown"]).notNull(),
  urgency: mysqlEnum("urgency", ["Immediate", "Expected", "Future", "Past", "Unknown"]).notNull(),
  certainty: mysqlEnum("certainty", ["Observed", "Likely", "Possible", "Unlikely", "Unknown"]).notNull(),
  headline: varchar("headline", { length: 500 }),
  description: text("description"),
  instruction: text("instruction"),
  onsetAt: timestamp("onset_at"),
  expiresAt: timestamp("expires_at"),
  endsAt: timestamp("ends_at"),
  status: mysqlEnum("status", ["Actual", "Exercise", "System", "Test", "Draft"]).notNull(),
  messageType: mysqlEnum("message_type", ["Alert", "Update", "Cancel"]).notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  severityIdx: index("idx_hz_weather_severity").on(table.severity),
  expiresIdx: index("idx_hz_weather_expires").on(table.expiresAt),
  eventIdx: index("idx_hz_weather_event").on(table.eventType),
}));

export type HzWeatherAlert = typeof hzWeatherAlerts.$inferSelect;
export type InsertHzWeatherAlert = typeof hzWeatherAlerts.$inferInsert;

// -- CARRIER SAFETY (FMCSA) --
export const hzCarrierSafety = mysqlTable("hz_carrier_safety", {
  dotNumber: varchar("dot_number", { length: 10 }).primaryKey(),
  legalName: varchar("legal_name", { length: 255 }).notNull(),
  dbaName: varchar("dba_name", { length: 255 }),
  unsafeDrivingScore: decimal("unsafe_driving_score", { precision: 5, scale: 2 }),
  hosComplianceScore: decimal("hos_compliance_score", { precision: 5, scale: 2 }),
  driverFitnessScore: decimal("driver_fitness_score", { precision: 5, scale: 2 }),
  controlledSubstancesScore: decimal("controlled_substances_score", { precision: 5, scale: 2 }),
  vehicleMaintenanceScore: decimal("vehicle_maintenance_score", { precision: 5, scale: 2 }),
  hazmatComplianceScore: decimal("hazmat_compliance_score", { precision: 5, scale: 2 }),
  crashIndicatorScore: decimal("crash_indicator_score", { precision: 5, scale: 2 }),
  safetyRating: mysqlEnum("safety_rating", ["Satisfactory", "Conditional", "Unsatisfactory", "None"]).default("None"),
  safetyRatingDate: date("safety_rating_date"),
  totalInspections: int("total_inspections").default(0),
  driverInspections: int("driver_inspections").default(0),
  vehicleInspections: int("vehicle_inspections").default(0),
  hazmatInspections: int("hazmat_inspections").default(0),
  driverOosRate: decimal("driver_oos_rate", { precision: 5, scale: 2 }),
  vehicleOosRate: decimal("vehicle_oos_rate", { precision: 5, scale: 2 }),
  totalCrashes: int("total_crashes").default(0),
  fatalCrashes: int("fatal_crashes").default(0),
  injuryCrashes: int("injury_crashes").default(0),
  towCrashes: int("tow_crashes").default(0),
  commonAuthority: boolean("common_authority").default(false),
  contractAuthority: boolean("contract_authority").default(false),
  brokerAuthority: boolean("broker_authority").default(false),
  hazmatAuthority: boolean("hazmat_authority").default(false),
  bipdInsuranceRequired: int("bipd_insurance_required"),
  bipdInsuranceOnFile: int("bipd_insurance_on_file"),
  cargoInsuranceRequired: int("cargo_insurance_required"),
  cargoInsuranceOnFile: int("cargo_insurance_on_file"),
  bondInsuranceRequired: int("bond_insurance_required"),
  bondInsuranceOnFile: int("bond_insurance_on_file"),
  physicalState: char("physical_state", { length: 2 }),
  physicalCity: varchar("physical_city", { length: 100 }),
  physicalZip: varchar("physical_zip", { length: 10 }),
  lastUpdate: date("last_update"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  stateIdx: index("idx_hz_carrier_state").on(table.physicalState),
  hazmatIdx: index("idx_hz_carrier_hazmat").on(table.hazmatAuthority),
  ratingIdx: index("idx_hz_carrier_rating").on(table.safetyRating),
}));

export type HzCarrierSafety = typeof hzCarrierSafety.$inferSelect;
export type InsertHzCarrierSafety = typeof hzCarrierSafety.$inferInsert;

// -- HAZMAT INCIDENTS (PHMSA) --
export const hzHazmatIncidents = mysqlTable("hz_hazmat_incidents", {
  reportNumber: varchar("report_number", { length: 20 }).primaryKey(),
  stateCode: char("state_code", { length: 2 }).notNull(),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  incidentDate: date("incident_date").notNull(),
  mode: mysqlEnum("mode", ["Highway", "Rail", "Air", "Water", "Pipeline"]).notNull(),
  incidentType: varchar("incident_type", { length: 100 }),
  hazmatClass: varchar("hazmat_class", { length: 20 }),
  hazmatName: varchar("hazmat_name", { length: 255 }),
  unNumber: varchar("un_number", { length: 10 }),
  quantityReleased: decimal("quantity_released", { precision: 15, scale: 4 }),
  quantityUnit: varchar("quantity_unit", { length: 20 }),
  fatalities: int("fatalities").default(0),
  injuries: int("injuries").default(0),
  hospitalized: int("hospitalized").default(0),
  evacuated: int("evacuated").default(0),
  propertyDamage: decimal("property_damage", { precision: 15, scale: 2 }),
  carrierName: varchar("carrier_name", { length: 255 }),
  carrierDotNumber: varchar("carrier_dot_number", { length: 10 }),
  causeCategory: varchar("cause_category", { length: 100 }),
  causeSubcategory: varchar("cause_subcategory", { length: 100 }),
  federalResponse: boolean("federal_response").default(false),
  cleanupCost: decimal("cleanup_cost", { precision: 15, scale: 2 }),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  stateDateIdx: index("idx_hz_hazmat_state_date").on(table.stateCode, table.incidentDate),
  hazmatClassIdx: index("idx_hz_hazmat_class").on(table.hazmatClass),
  carrierIdx: index("idx_hz_hazmat_carrier").on(table.carrierDotNumber),
  modeIdx: index("idx_hz_hazmat_mode").on(table.mode),
}));

export type HzHazmatIncident = typeof hzHazmatIncidents.$inferSelect;
export type InsertHzHazmatIncident = typeof hzHazmatIncidents.$inferInsert;

// -- EPA FACILITIES (TRI + ECHO) --
export const hzEpaFacilities = mysqlTable("hz_epa_facilities", {
  registryId: varchar("registry_id", { length: 20 }).primaryKey(),
  facilityName: varchar("facility_name", { length: 255 }).notNull(),
  stateCode: char("state_code", { length: 2 }).notNull(),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  zipCode: varchar("zip_code", { length: 10 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  industrySector: varchar("industry_sector", { length: 100 }),
  naicsCodes: json("naics_codes"),
  sicCodes: json("sic_codes"),
  triFacility: boolean("tri_facility").default(false),
  totalReleasesLbs: decimal("total_releases_lbs", { precision: 15, scale: 2 }),
  airReleasesLbs: decimal("air_releases_lbs", { precision: 15, scale: 2 }),
  waterReleasesLbs: decimal("water_releases_lbs", { precision: 15, scale: 2 }),
  landReleasesLbs: decimal("land_releases_lbs", { precision: 15, scale: 2 }),
  chemicalsReported: json("chemicals_reported"),
  complianceStatus: mysqlEnum("compliance_status", ["In Compliance", "Violation", "Unknown"]).default("Unknown"),
  qtrsInNoncompliance: int("qtrs_in_noncompliance").default(0),
  informalEnforcementActions: int("informal_enforcement_actions").default(0),
  formalEnforcementActions: int("formal_enforcement_actions").default(0),
  penaltiesLast5yr: decimal("penalties_last_5yr", { precision: 15, scale: 2 }),
  rcraHandler: boolean("rcra_handler").default(false),
  npdesPermit: boolean("npdes_permit").default(false),
  caaPermit: boolean("caa_permit").default(false),
  lastInspectionDate: date("last_inspection_date"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  stateIdx: index("idx_hz_epa_state").on(table.stateCode),
  complianceIdx: index("idx_hz_epa_compliance").on(table.complianceStatus),
  locationIdx: index("idx_hz_epa_location").on(table.latitude, table.longitude),
}));

export type HzEpaFacility = typeof hzEpaFacilities.$inferSelect;
export type InsertHzEpaFacility = typeof hzEpaFacilities.$inferInsert;

// -- SEISMIC EVENTS (USGS) --
export const hzSeismicEvents = mysqlTable("hz_seismic_events", {
  eventId: varchar("event_id", { length: 20 }).primaryKey(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  depthKm: decimal("depth_km", { precision: 8, scale: 3 }),
  placeDescription: varchar("place_description", { length: 255 }),
  magnitude: decimal("magnitude", { precision: 4, scale: 2 }).notNull(),
  magnitudeType: varchar("magnitude_type", { length: 10 }),
  eventTime: timestamp("event_time").notNull(),
  feltReports: int("felt_reports").default(0),
  cdi: decimal("cdi", { precision: 4, scale: 2 }),
  mmi: decimal("mmi", { precision: 4, scale: 2 }),
  alertLevel: mysqlEnum("alert_level", ["green", "yellow", "orange", "red"]),
  tsunamiFlag: boolean("tsunami_flag").default(false),
  status: varchar("status", { length: 20 }),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  timeIdx: index("idx_hz_seismic_time").on(table.eventTime),
  magIdx: index("idx_hz_seismic_mag").on(table.magnitude),
  locationIdx: index("idx_hz_seismic_location").on(table.latitude, table.longitude),
}));

export type HzSeismicEvent = typeof hzSeismicEvents.$inferSelect;
export type InsertHzSeismicEvent = typeof hzSeismicEvents.$inferInsert;

// -- WILDFIRES (NIFC) --
export const hzWildfires = mysqlTable("hz_wildfires", {
  incidentId: varchar("incident_id", { length: 50 }).primaryKey(),
  incidentName: varchar("incident_name", { length: 255 }).notNull(),
  stateCode: char("state_code", { length: 2 }),
  county: varchar("county", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  perimeterGeometry: json("perimeter_geometry"),
  fireDiscoveryDate: date("fire_discovery_date"),
  containmentDate: date("containment_date"),
  acresBurned: decimal("acres_burned", { precision: 12, scale: 2 }),
  percentContained: decimal("percent_contained", { precision: 5, scale: 2 }),
  totalPersonnel: int("total_personnel"),
  totalEngines: int("total_engines"),
  totalHelicopters: int("total_helicopters"),
  estimatedCost: decimal("estimated_cost", { precision: 15, scale: 2 }),
  structuresDestroyed: int("structures_destroyed").default(0),
  structuresThreatened: int("structures_threatened").default(0),
  evacuationsOrdered: boolean("evacuations_ordered").default(false),
  fireStatus: mysqlEnum("fire_status", ["Active", "Contained", "Controlled", "Out"]).notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  stateIdx: index("idx_hz_fire_state").on(table.stateCode),
  statusIdx: index("idx_hz_fire_status").on(table.fireStatus),
  dateIdx: index("idx_hz_fire_date").on(table.fireDiscoveryDate),
}));

export type HzWildfire = typeof hzWildfires.$inferSelect;
export type InsertHzWildfire = typeof hzWildfires.$inferInsert;

// -- FEMA DISASTERS --
export const hzFemaDisasters = mysqlTable("hz_fema_disasters", {
  disasterNumber: varchar("disaster_number", { length: 10 }).primaryKey(),
  stateCode: char("state_code", { length: 2 }).notNull(),
  designatedArea: varchar("designated_area", { length: 255 }),
  declarationDate: date("declaration_date").notNull(),
  incidentType: varchar("incident_type", { length: 100 }),
  declarationType: mysqlEnum("declaration_type", ["DR", "EM", "FM", "FS"]).notNull(),
  incidentBeginDate: date("incident_begin_date"),
  incidentEndDate: date("incident_end_date"),
  closeoutDate: date("closeout_date"),
  ihProgramDeclared: boolean("ih_program_declared").default(false),
  iaProgramDeclared: boolean("ia_program_declared").default(false),
  paProgramDeclared: boolean("pa_program_declared").default(false),
  hmProgramDeclared: boolean("hm_program_declared").default(false),
  totalObligatedAmount: decimal("total_obligated_amount", { precision: 15, scale: 2 }),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  stateIdx: index("idx_hz_fema_state").on(table.stateCode),
  dateIdx: index("idx_hz_fema_date").on(table.declarationDate),
  typeIdx: index("idx_hz_fema_type").on(table.declarationType),
}));

export type HzFemaDisaster = typeof hzFemaDisasters.$inferSelect;
export type InsertHzFemaDisaster = typeof hzFemaDisasters.$inferInsert;

// -- FREIGHT FLOWS (BTS) --
export const hzFreightFlows = mysqlTable("hz_freight_flows", {
  id: varchar("id", { length: 36 }).primaryKey(),
  originState: char("origin_state", { length: 2 }).notNull(),
  originCfsArea: varchar("origin_cfs_area", { length: 10 }),
  destinationState: char("destination_state", { length: 2 }).notNull(),
  destinationCfsArea: varchar("destination_cfs_area", { length: 10 }),
  sctgCode: varchar("sctg_code", { length: 5 }),
  sctgDescription: varchar("sctg_description", { length: 255 }),
  hazmatFlag: boolean("hazmat_flag").default(false),
  tonsThousands: decimal("tons_thousands", { precision: 15, scale: 2 }),
  tonMillesMillions: decimal("ton_miles_millions", { precision: 15, scale: 2 }),
  valueMillions: decimal("value_millions", { precision: 15, scale: 2 }),
  mode: varchar("mode", { length: 50 }),
  dataYear: int("data_year").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  originIdx: index("idx_hz_freight_origin").on(table.originState),
  destIdx: index("idx_hz_freight_dest").on(table.destinationState),
  commodityIdx: index("idx_hz_freight_commodity").on(table.sctgCode),
  hazmatIdx: index("idx_hz_freight_hazmat").on(table.hazmatFlag),
}));

export type HzFreightFlow = typeof hzFreightFlows.$inferSelect;
export type InsertHzFreightFlow = typeof hzFreightFlows.$inferInsert;

// -- RATE INDICES (USDA + Freightos) --
export const hzRateIndices = mysqlTable("hz_rate_indices", {
  id: varchar("id", { length: 36 }).primaryKey(),
  origin: varchar("origin", { length: 100 }),
  destination: varchar("destination", { length: 100 }),
  region: varchar("region", { length: 50 }),
  ratePerMile: decimal("rate_per_mile", { precision: 6, scale: 3 }),
  ratePerLoad: decimal("rate_per_load", { precision: 10, scale: 2 }),
  fuelSurcharge: decimal("fuel_surcharge", { precision: 6, scale: 3 }),
  rateChange1w: decimal("rate_change_1w", { precision: 5, scale: 2 }),
  rateChange1m: decimal("rate_change_1m", { precision: 5, scale: 2 }),
  rateChange1y: decimal("rate_change_1y", { precision: 5, scale: 2 }),
  equipmentType: mysqlEnum("equipment_type", ["DRY_VAN", "REEFER", "FLATBED", "TANKER", "ALL"]).notNull(),
  rateType: mysqlEnum("rate_type", ["SPOT", "CONTRACT", "INDEX"]).notNull(),
  source: mysqlEnum("source", ["USDA", "FREIGHTOS", "DAT_PUBLIC", "INTERNAL"]).notNull(),
  reportDate: date("report_date").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  regionIdx: index("idx_hz_rate_region").on(table.region),
  dateIdx: index("idx_hz_rate_date").on(table.reportDate),
  equipIdx: index("idx_hz_rate_equip").on(table.equipmentType),
}));

export type HzRateIndex = typeof hzRateIndices.$inferSelect;
export type InsertHzRateIndex = typeof hzRateIndices.$inferInsert;

// -- CRUDE OIL PRICING (CME + EIA) --
export const hzCrudePrices = mysqlTable("hz_crude_prices", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productCode: varchar("product_code", { length: 20 }).notNull(),
  productName: varchar("product_name", { length: 100 }),
  priceUsd: decimal("price_usd", { precision: 10, scale: 4 }).notNull(),
  priceChange1d: decimal("price_change_1d", { precision: 8, scale: 4 }),
  priceChange1w: decimal("price_change_1w", { precision: 8, scale: 4 }),
  volumeBarrels: bigint("volume_barrels", { mode: "number" }),
  openInterest: int("open_interest"),
  contractMonth: varchar("contract_month", { length: 10 }),
  settlementDate: date("settlement_date"),
  source: mysqlEnum("source", ["CME", "EIA", "PLATTS_FREE", "ICE_FREE"]).notNull(),
  reportDate: date("report_date").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  productIdx: index("idx_hz_crude_product").on(table.productCode),
  dateIdx: index("idx_hz_crude_date").on(table.reportDate),
}));

export type HzCrudePrice = typeof hzCrudePrices.$inferSelect;
export type InsertHzCrudePrice = typeof hzCrudePrices.$inferInsert;

// -- PORT ACTIVITY --
export const hzPortActivity = mysqlTable("hz_port_activity", {
  id: varchar("id", { length: 36 }).primaryKey(),
  portCode: varchar("port_code", { length: 10 }).notNull(),
  portName: varchar("port_name", { length: 100 }).notNull(),
  stateCode: char("state_code", { length: 2 }).notNull(),
  containerTeus: int("container_teus"),
  bulkTons: decimal("bulk_tons", { precision: 15, scale: 2 }),
  tankerBarrels: bigint("tanker_barrels", { mode: "number" }),
  vesselCalls: int("vessel_calls"),
  berthAvailability: decimal("berth_availability", { precision: 5, scale: 2 }),
  terminalUtilization: decimal("terminal_utilization", { precision: 5, scale: 2 }),
  avgDwellTimeHours: decimal("avg_dwell_time_hours", { precision: 6, scale: 2 }),
  avgWaitTimeHours: decimal("avg_wait_time_hours", { precision: 6, scale: 2 }),
  vesselsAtAnchor: int("vessels_at_anchor"),
  volumeChangeMom: decimal("volume_change_mom", { precision: 5, scale: 2 }),
  volumeChangeYoy: decimal("volume_change_yoy", { precision: 5, scale: 2 }),
  reportDate: date("report_date").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  portIdx: index("idx_hz_port_code").on(table.portCode),
  stateIdx: index("idx_hz_port_state").on(table.stateCode),
  dateIdx: index("idx_hz_port_date").on(table.reportDate),
}));

export type HzPortActivity = typeof hzPortActivity.$inferSelect;
export type InsertHzPortActivity = typeof hzPortActivity.$inferInsert;

// -- LOCK & WATERWAY STATUS (USACE) --
export const hzLockStatus = mysqlTable("hz_lock_status", {
  lockId: varchar("lock_id", { length: 20 }).primaryKey(),
  lockName: varchar("lock_name", { length: 100 }).notNull(),
  riverName: varchar("river_name", { length: 100 }),
  stateCode: char("state_code", { length: 2 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  operationalStatus: mysqlEnum("operational_status", ["Open", "Closed", "Restricted", "Scheduled_Closure"]).notNull(),
  closureReason: varchar("closure_reason", { length: 255 }),
  expectedReopen: date("expected_reopen"),
  avgDelayHours: decimal("avg_delay_hours", { precision: 6, scale: 2 }),
  vesselsWaiting: int("vessels_waiting"),
  dailyLockages: int("daily_lockages"),
  scheduledMaintenance: json("scheduled_maintenance"),
  lastUpdated: timestamp("last_updated"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  statusIdx: index("idx_hz_lock_status").on(table.operationalStatus),
  stateIdx: index("idx_hz_lock_state").on(table.stateCode),
}));

export type HzLockStatus = typeof hzLockStatus.$inferSelect;
export type InsertHzLockStatus = typeof hzLockStatus.$inferInsert;

// -- AIRSPACE RESTRICTIONS (FAA TFRs) --
export const hzTfrRestrictions = mysqlTable("hz_tfr_restrictions", {
  notamId: varchar("notam_id", { length: 50 }).primaryKey(),
  centerLatitude: decimal("center_latitude", { precision: 10, scale: 7 }),
  centerLongitude: decimal("center_longitude", { precision: 10, scale: 7 }),
  radiusNm: decimal("radius_nm", { precision: 8, scale: 2 }),
  altitudeFloor: int("altitude_floor"),
  altitudeCeiling: int("altitude_ceiling"),
  geometry: json("geometry"),
  restrictionType: varchar("restriction_type", { length: 100 }),
  reason: varchar("reason", { length: 255 }),
  effectiveStart: timestamp("effective_start").notNull(),
  effectiveEnd: timestamp("effective_end"),
  affectsOversize: boolean("affects_oversize").default(false),
  surfaceRestrictions: text("surface_restrictions"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  datesIdx: index("idx_hz_tfr_dates").on(table.effectiveStart, table.effectiveEnd),
}));

export type HzTfrRestriction = typeof hzTfrRestrictions.$inferSelect;
export type InsertHzTfrRestriction = typeof hzTfrRestrictions.$inferInsert;

// -- ZONE INTELLIGENCE CACHE (Aggregated Metrics) --
export const hzZoneIntelligence = mysqlTable("hz_zone_intelligence", {
  zoneId: varchar("zone_id", { length: 20 }).primaryKey(),
  liveLoads: int("live_loads").default(0),
  liveTrucks: int("live_trucks").default(0),
  loadToTruckRatio: decimal("load_to_truck_ratio", { precision: 5, scale: 2 }),
  surgeMultiplier: decimal("surge_multiplier", { precision: 4, scale: 2 }).default("1.0"),
  avgRatePerMile: decimal("avg_rate_per_mile", { precision: 6, scale: 3 }),
  rateChange24h: decimal("rate_change_24h", { precision: 5, scale: 2 }),
  rateChange7d: decimal("rate_change_7d", { precision: 5, scale: 2 }),
  dieselPrice: decimal("diesel_price", { precision: 6, scale: 3 }),
  dieselTrend: mysqlEnum("diesel_trend", ["rising", "falling", "stable"]),
  activeWeatherAlerts: int("active_weather_alerts").default(0),
  maxWeatherSeverity: mysqlEnum("max_weather_severity", ["None", "Minor", "Moderate", "Severe", "Extreme"]).default("None"),
  weatherAlertTypes: json("weather_alert_types"),
  avgCarrierSafetyScore: decimal("avg_carrier_safety_score", { precision: 5, scale: 2 }),
  carriersWithViolations: int("carriers_with_violations").default(0),
  recentHazmatIncidents: int("recent_hazmat_incidents").default(0),
  complianceRiskScore: decimal("compliance_risk_score", { precision: 5, scale: 2 }),
  complianceFactors: json("compliance_factors"),
  epaFacilitiesCount: int("epa_facilities_count").default(0),
  facilitiesWithViolations: int("facilities_with_violations").default(0),
  seismicRiskLevel: mysqlEnum("seismic_risk_level", ["Low", "Moderate", "High"]).default("Low"),
  activeWildfires: int("active_wildfires").default(0),
  femaDisasterActive: boolean("fema_disaster_active").default(false),
  portCongestionLevel: mysqlEnum("port_congestion_level", ["Low", "Normal", "High", "Critical"]).default("Normal"),
  lockDelaysAvgHours: decimal("lock_delays_avg_hours", { precision: 6, scale: 2 }),
  computedAt: timestamp("computed_at").defaultNow(),
  validUntil: timestamp("valid_until"),
}, (table) => ({
  computedIdx: index("idx_hz_zone_computed").on(table.computedAt),
}));

export type HzZoneIntelligence = typeof hzZoneIntelligence.$inferSelect;
export type InsertHzZoneIntelligence = typeof hzZoneIntelligence.$inferInsert;

// -- DATA SYNC LOG --
export const hzDataSyncLog = mysqlTable("hz_data_sync_log", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sourceName: varchar("source_name", { length: 50 }).notNull(),
  syncType: mysqlEnum("sync_type", ["FULL", "INCREMENTAL", "DELTA"]).notNull(),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  recordsFetched: int("records_fetched").default(0),
  recordsInserted: int("records_inserted").default(0),
  recordsUpdated: int("records_updated").default(0),
  recordsDeleted: int("records_deleted").default(0),
  status: mysqlEnum("status", ["RUNNING", "SUCCESS", "FAILED", "PARTIAL"]).notNull(),
  errorMessage: text("error_message"),
}, (table) => ({
  sourceIdx: index("idx_hz_sync_source").on(table.sourceName),
  statusIdx: index("idx_hz_sync_status").on(table.status),
  startedIdx: index("idx_hz_sync_started").on(table.startedAt),
}));

export type HzDataSyncLog = typeof hzDataSyncLog.$inferSelect;
export type InsertHzDataSyncLog = typeof hzDataSyncLog.$inferInsert;

// -- CLEAN AIR MARKETS EMISSIONS (CAMPD) --
export const hzEmissions = mysqlTable("hz_emissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  facilityId: varchar("facility_id", { length: 20 }).notNull(),
  facilityName: varchar("facility_name", { length: 255 }).notNull(),
  stateCode: char("state_code", { length: 2 }).notNull(),
  countyName: varchar("county_name", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  fuelTypes: json("fuel_types"),
  unitTypes: json("unit_types"),
  so2Tons: decimal("so2_tons", { precision: 12, scale: 2 }),
  noxTons: decimal("nox_tons", { precision: 12, scale: 2 }),
  co2Tons: decimal("co2_tons", { precision: 15, scale: 2 }),
  hgLbs: decimal("hg_lbs", { precision: 10, scale: 4 }),
  grossLoadMwh: decimal("gross_load_mwh", { precision: 15, scale: 2 }),
  heatInputMmbtu: decimal("heat_input_mmbtu", { precision: 15, scale: 2 }),
  operatingHours: int("operating_hours"),
  programCodes: json("program_codes"),
  reportingYear: int("reporting_year").notNull(),
  reportingQuarter: int("reporting_quarter"),
  sourceCategory: varchar("source_category", { length: 100 }),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  stateIdx: index("idx_hz_emissions_state").on(table.stateCode),
  facilityIdx: index("idx_hz_emissions_facility").on(table.facilityId),
  yearIdx: index("idx_hz_emissions_year").on(table.reportingYear),
  locationIdx: index("idx_hz_emissions_location").on(table.latitude, table.longitude),
}));

export type HzEmission = typeof hzEmissions.$inferSelect;
export type InsertHzEmission = typeof hzEmissions.$inferInsert;

// -- RCRA HAZARDOUS WASTE HANDLERS (ECHO) --
export const hzRcraHandlers = mysqlTable("hz_rcra_handlers", {
  handlerId: varchar("handler_id", { length: 20 }).primaryKey(),
  handlerName: varchar("handler_name", { length: 255 }).notNull(),
  stateCode: char("state_code", { length: 2 }).notNull(),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  zipCode: varchar("zip_code", { length: 10 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  handlerType: mysqlEnum("handler_type", ["Generator", "Transporter", "TSDF", "Mixed"]).default("Generator"),
  generatorStatus: varchar("generator_status", { length: 10 }),
  wasteActivityCodes: json("waste_activity_codes"),
  wasteCodes: json("waste_codes"),
  landType: varchar("land_type", { length: 50 }),
  complianceStatus: mysqlEnum("compliance_status", ["In Compliance", "Violation", "Unknown"]).default("Unknown"),
  evaluationsCount: int("evaluations_count").default(0),
  violationsCount: int("violations_count").default(0),
  enforcementActionsCount: int("enforcement_actions_count").default(0),
  penaltiesTotal: decimal("penalties_total", { precision: 15, scale: 2 }),
  lastEvaluationDate: date("last_evaluation_date"),
  naicsCode: varchar("naics_code", { length: 10 }),
  industrySector: varchar("industry_sector", { length: 100 }),
  fetchedAt: timestamp("fetched_at").defaultNow(),
}, (table) => ({
  stateIdx: index("idx_hz_rcra_state").on(table.stateCode),
  typeIdx: index("idx_hz_rcra_type").on(table.handlerType),
  complianceIdx: index("idx_hz_rcra_compliance").on(table.complianceStatus),
  locationIdx: index("idx_hz_rcra_location").on(table.latitude, table.longitude),
}));

export type HzRcraHandler = typeof hzRcraHandlers.$inferSelect;
export type InsertHzRcraHandler = typeof hzRcraHandlers.$inferInsert;

// -- ROUTE INTELLIGENCE — Crowd-sourced corridor metrics --
export const hzRouteIntelligence = mysqlTable("hz_route_intelligence", {
  id: int("id").autoincrement().primaryKey(),
  originZone: varchar("origin_zone", { length: 64 }).notNull(),
  destZone: varchar("dest_zone", { length: 64 }).notNull(),
  corridorName: varchar("corridor_name", { length: 255 }),
  avgSpeedMph: decimal("avg_speed_mph", { precision: 6, scale: 2 }).default("0"),
  avgTravelTimeMins: decimal("avg_travel_time_mins", { precision: 8, scale: 2 }).default("0"),
  avgDistanceMiles: decimal("avg_distance_miles", { precision: 8, scale: 2 }).default("0"),
  tripCount: int("trip_count").default(0),
  uniqueDrivers: int("unique_drivers").default(0),
  congestionScore: decimal("congestion_score", { precision: 5, scale: 2 }).default("0"),
  reliabilityScore: decimal("reliability_score", { precision: 5, scale: 2 }).default("0"),
  peakHourDelayPct: decimal("peak_hour_delay_pct", { precision: 5, scale: 2 }).default("0"),
  avgStopsPerTrip: decimal("avg_stops_per_trip", { precision: 4, scale: 1 }).default("0"),
  hazmatTripCount: int("hazmat_trip_count").default(0),
  lastTripAt: datetime("last_trip_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  originIdx: index("idx_ri_origin").on(table.originZone),
  destIdx: index("idx_ri_dest").on(table.destZone),
  corridorIdx: index("idx_ri_corridor").on(table.originZone, table.destZone),
  updatedIdx: index("idx_ri_updated").on(table.updatedAt),
}));

export type HzRouteIntelligence = typeof hzRouteIntelligence.$inferSelect;
export type InsertHzRouteIntelligence = typeof hzRouteIntelligence.$inferInsert;

// -- GRID HEAT — Spatial driver density heatmap --
export const hzGridHeat = mysqlTable("hz_grid_heat", {
  id: int("id").autoincrement().primaryKey(),
  gridLat: decimal("grid_lat", { precision: 6, scale: 2 }).notNull(),
  gridLng: decimal("grid_lng", { precision: 7, scale: 2 }).notNull(),
  periodStart: datetime("period_start").notNull(),
  periodHours: int("period_hours").default(1),
  pingCount: int("ping_count").default(0),
  uniqueDrivers: int("unique_drivers").default(0),
  avgSpeedMph: decimal("avg_speed_mph", { precision: 6, scale: 2 }).default("0"),
  movingPct: decimal("moving_pct", { precision: 5, scale: 2 }).default("0"),
  hazmatPings: int("hazmat_pings").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  gridPeriodUniq: uniqueIndex("uk_grid_period").on(table.gridLat, table.gridLng, table.periodStart),
  periodIdx: index("idx_gh_period").on(table.periodStart),
}));

export type HzGridHeat = typeof hzGridHeat.$inferSelect;
export type InsertHzGridHeat = typeof hzGridHeat.$inferInsert;

// -- LANE LEARNING — Per-lane real performance from completed trips --
export const hzLaneLearning = mysqlTable("hz_lane_learning", {
  id: int("id").autoincrement().primaryKey(),
  originCity: varchar("origin_city", { length: 128 }).notNull(),
  originState: char("origin_state", { length: 2 }).notNull(),
  destCity: varchar("dest_city", { length: 128 }).notNull(),
  destState: char("dest_state", { length: 2 }).notNull(),
  equipmentType: varchar("equipment_type", { length: 32 }),
  isHazmat: tinyint("is_hazmat").default(0),
  tripCount: int("trip_count").default(0),
  avgRatePerMile: decimal("avg_rate_per_mile", { precision: 6, scale: 2 }),
  avgTotalRate: decimal("avg_total_rate", { precision: 10, scale: 2 }),
  avgDistanceMiles: decimal("avg_distance_miles", { precision: 8, scale: 2 }),
  avgTransitHours: decimal("avg_transit_hours", { precision: 6, scale: 2 }),
  avgFuelCost: decimal("avg_fuel_cost", { precision: 8, scale: 2 }),
  avgDeadheadMiles: decimal("avg_deadhead_miles", { precision: 6, scale: 2 }),
  onTimePct: decimal("on_time_pct", { precision: 5, scale: 2 }),
  avgDwellMinsPickup: decimal("avg_dwell_mins_pickup", { precision: 6, scale: 1 }),
  avgDwellMinsDelivery: decimal("avg_dwell_mins_delivery", { precision: 6, scale: 1 }),
  bestDayOfWeek: tinyint("best_day_of_week"),
  bestHourDepart: tinyint("best_hour_depart"),
  seasonalPeak: varchar("seasonal_peak", { length: 16 }),
  lastTripAt: datetime("last_trip_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  laneIdx: index("idx_ll_lane").on(table.originState, table.destState),
  cityIdx: index("idx_ll_city").on(table.originCity, table.destCity),
  hazmatIdx: index("idx_ll_hazmat").on(table.isHazmat),
  updatedIdx: index("idx_ll_updated").on(table.updatedAt),
}));

export type HzLaneLearning = typeof hzLaneLearning.$inferSelect;
export type InsertHzLaneLearning = typeof hzLaneLearning.$inferInsert;

// -- DRIVER ROUTE REPORTS — Completed trip submissions for ML learning --
export const hzDriverRouteReports = mysqlTable("hz_driver_route_reports", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driver_id").notNull(),
  loadId: int("load_id"),
  originLat: decimal("origin_lat", { precision: 9, scale: 6 }).notNull(),
  originLng: decimal("origin_lng", { precision: 10, scale: 6 }).notNull(),
  destLat: decimal("dest_lat", { precision: 9, scale: 6 }).notNull(),
  destLng: decimal("dest_lng", { precision: 10, scale: 6 }).notNull(),
  originCity: varchar("origin_city", { length: 128 }),
  originState: char("origin_state", { length: 2 }),
  destCity: varchar("dest_city", { length: 128 }),
  destState: char("dest_state", { length: 2 }),
  distanceMiles: decimal("distance_miles", { precision: 8, scale: 2 }),
  transitMinutes: int("transit_minutes"),
  avgSpeedMph: decimal("avg_speed_mph", { precision: 6, scale: 2 }),
  maxSpeedMph: decimal("max_speed_mph", { precision: 6, scale: 2 }),
  stopCount: int("stop_count").default(0),
  fuelStops: int("fuel_stops").default(0),
  isHazmat: tinyint("is_hazmat").default(0),
  equipmentType: varchar("equipment_type", { length: 32 }),
  weatherConditions: varchar("weather_conditions", { length: 64 }),
  roadQualityScore: tinyint("road_quality_score"),
  congestionScore: tinyint("congestion_score"),
  routePolyline: text("route_polyline"),
  startedAt: datetime("started_at").notNull(),
  completedAt: datetime("completed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  driverIdx: index("idx_drr_driver").on(table.driverId),
  loadIdx: index("idx_drr_load").on(table.loadId),
  completedIdx: index("idx_drr_completed").on(table.completedAt),
  laneIdx: index("idx_drr_lane").on(table.originState, table.destState),
}));

export type HzDriverRouteReport = typeof hzDriverRouteReports.$inferSelect;
export type InsertHzDriverRouteReport = typeof hzDriverRouteReports.$inferInsert;

// ============================================================================
// SOS EMERGENCY ALERTS
// ============================================================================

export const sosAlerts = mysqlTable(
  "sos_alerts",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("load_id").notNull(),
    driverId: int("driver_id").notNull(),
    vehicleId: int("vehicle_id"),
    alertType: mysqlEnum("alert_type", ["medical", "mechanical", "hazmat_spill", "accident", "threat", "weather", "other"]).notNull(),
    severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull().default("high"),
    status: mysqlEnum("status", ["active", "acknowledged", "responding", "resolved", "false_alarm"]).notNull().default("active"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    description: text("description"),
    stateCode: varchar("state_code", { length: 2 }),
    nearestMileMarker: varchar("nearest_mile_marker", { length: 20 }),
    acknowledgedBy: int("acknowledged_by"),
    acknowledgedAt: timestamp("acknowledged_at"),
    resolvedBy: int("resolved_by"),
    resolvedAt: timestamp("resolved_at"),
    resolutionNotes: text("resolution_notes"),
    notifiedUsers: json("notified_users").$type<number[]>(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    loadIdx: index("idx_sos_load").on(table.loadId),
    driverIdx: index("idx_sos_driver").on(table.driverId),
    statusIdx: index("idx_sos_status").on(table.status),
    createdIdx: index("idx_sos_created").on(table.createdAt),
  })
);

export type SosAlert = typeof sosAlerts.$inferSelect;
export type InsertSosAlert = typeof sosAlerts.$inferInsert;

// ============================================================================
// TRIP COMPLIANCE EVENTS
// ============================================================================

export const tripComplianceEvents = mysqlTable(
  "trip_compliance_events",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("load_id").notNull(),
    driverId: int("driver_id").notNull(),
    vehicleId: int("vehicle_id"),
    eventType: mysqlEnum("event_type", [
      "state_entry", "state_exit",
      "permit_valid", "permit_missing", "permit_expired",
      "weight_tax_required", "weight_tax_filed",
      "ifta_mile_logged",
      "carb_required", "carb_valid", "carb_missing",
      "hazmat_zone_entry", "hazmat_zone_exit",
      "oversize_permit_required", "oversize_permit_valid", "oversize_permit_missing",
      "document_expiring", "document_expired",
      "weigh_station_approach", "port_of_entry",
      "fuel_purchase", "toll_crossing",
    ]).notNull(),
    stateCode: varchar("state_code", { length: 2 }),
    fromState: varchar("from_state", { length: 2 }),
    toState: varchar("to_state", { length: 2 }),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    details: json("details").$type<Record<string, any>>(),
    isBlocking: tinyint("is_blocking").default(0),
    requiresAction: tinyint("requires_action").default(0),
    actionTaken: tinyint("action_taken").default(0),
    actionDescription: text("action_description"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    loadIdx: index("idx_tce_load").on(table.loadId),
    driverIdx: index("idx_tce_driver").on(table.driverId),
    typeIdx: index("idx_tce_type").on(table.eventType),
    stateIdx: index("idx_tce_state").on(table.stateCode),
    createdIdx: index("idx_tce_created").on(table.createdAt),
  })
);

export type TripComplianceEvent = typeof tripComplianceEvents.$inferSelect;
export type InsertTripComplianceEvent = typeof tripComplianceEvents.$inferInsert;

// ============================================================================
// TRIP STATE MILES (IFTA aggregation per load per state)
// ============================================================================

export const tripStateMiles = mysqlTable(
  "trip_state_miles",
  {
    id: int("id").autoincrement().primaryKey(),
    loadId: int("load_id").notNull(),
    vehicleId: int("vehicle_id"),
    stateCode: varchar("state_code", { length: 2 }).notNull(),
    miles: decimal("miles", { precision: 8, scale: 2 }).notNull().default("0"),
    fuelGallons: decimal("fuel_gallons", { precision: 8, scale: 2 }).default("0"),
    entryTime: timestamp("entry_time"),
    exitTime: timestamp("exit_time"),
    tollCost: decimal("toll_cost", { precision: 8, scale: 2 }).default("0"),
    weightTaxApplicable: tinyint("weight_tax_applicable").default(0),
    weightTaxAmount: decimal("weight_tax_amount", { precision: 8, scale: 2 }).default("0"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    loadIdx: index("idx_tsm_load").on(table.loadId),
    stateIdx: index("idx_tsm_state").on(table.stateCode),
    vehicleIdx: index("idx_tsm_vehicle").on(table.vehicleId),
  })
);

export type TripStateMiles = typeof tripStateMiles.$inferSelect;
export type InsertTripStateMiles = typeof tripStateMiles.$inferInsert;

