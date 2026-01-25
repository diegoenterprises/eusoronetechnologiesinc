import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  index,
  unique,
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
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", [
      "SHIPPER",
      "CARRIER",
      "BROKER",
      "DRIVER",
      "CATALYST",
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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    roleIdx: index("role_idx").on(table.role),
    companyIdx: index("company_idx").on(table.companyId),
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
    carrierId: int("carrierId"),
    driverId: int("driverId"),
    vehicleId: int("vehicleId"),
    loadNumber: varchar("loadNumber", { length: 50 }).notNull().unique(),
    status: mysqlEnum("status", [
      "draft",
      "posted",
      "bidding",
      "assigned",
      "in_transit",
      "delivered",
      "cancelled",
      "disputed",
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
    documents: json("documents").$type<string[]>(),
    currentLocation: json("currentLocation").$type<{ lat: number; lng: number }>(),
    route: json("route").$type<Array<{ lat: number; lng: number }>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    shipperIdx: index("load_shipper_idx").on(table.shipperId),
    carrierIdx: index("load_carrier_idx").on(table.carrierId),
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
    carrierId: int("carrierId").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("USD"),
    estimatedPickupDate: timestamp("estimatedPickupDate"),
    estimatedDeliveryDate: timestamp("estimatedDeliveryDate"),
    notes: text("notes"),
    status: mysqlEnum("status", ["pending", "accepted", "rejected", "withdrawn", "expired"])
      .default("pending")
      .notNull(),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    loadIdx: index("bid_load_idx").on(table.loadId),
    carrierIdx: index("bid_carrier_idx").on(table.carrierId),
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
    type: mysqlEnum("type", ["terminal", "warehouse", "rest_area", "custom"]).notNull(),
    center: json("center").$type<{ lat: number; lng: number }>(),
    radius: decimal("radius", { precision: 10, scale: 2 }),
    polygon: json("polygon").$type<Array<{ lat: number; lng: number }>>(),
    companyId: int("companyId"),
    alertOnEnter: boolean("alertOnEnter").default(true),
    alertOnExit: boolean("alertOnExit").default(true),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    typeIdx: index("geofence_type_idx").on(table.type),
    companyIdx: index("geofence_company_idx").on(table.companyId),
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
// COMPLIANCE - VIOLATIONS & AUDITS
// ============================================================================

export const violations = mysqlTable(
  "violations",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    driverId: int("driverId"),
    vehicleId: int("vehicleId"),
    loadId: int("loadId"),
    violationType: mysqlEnum("violationType", [
      "hos",
      "equipment",
      "hazmat",
      "driver_qualification",
      "drug_alcohol",
      "cargo_securement",
      "other",
    ]).notNull(),
    severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
    status: mysqlEnum("status", ["open", "in_review", "resolved", "escalated"])
      .default("open")
      .notNull(),
    code: varchar("code", { length: 50 }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    source: mysqlEnum("source", ["fmcsa", "state", "internal", "roadside"])
      .default("internal")
      .notNull(),
    inspectionId: varchar("inspectionId", { length: 100 }),
    fineAmount: decimal("fineAmount", { precision: 10, scale: 2 }),
    dueDate: timestamp("dueDate"),
    resolvedAt: timestamp("resolvedAt"),
    resolvedBy: int("resolvedBy"),
    resolutionNotes: text("resolutionNotes"),
    documents: json("documents").$type<string[]>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("violation_company_idx").on(table.companyId),
    driverIdx: index("violation_driver_idx").on(table.driverId),
    statusIdx: index("violation_status_idx").on(table.status),
    severityIdx: index("violation_severity_idx").on(table.severity),
  })
);

export type Violation = typeof violations.$inferSelect;
export type InsertViolation = typeof violations.$inferInsert;

export const audits = mysqlTable(
  "audits",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    auditType: mysqlEnum("auditType", [
      "internal",
      "fmcsa",
      "dot",
      "state",
      "insurance",
      "customer",
    ]).notNull(),
    status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "failed", "cancelled"])
      .default("scheduled")
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    scheduledDate: timestamp("scheduledDate"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    auditorName: varchar("auditorName", { length: 255 }),
    auditorOrg: varchar("auditorOrg", { length: 255 }),
    findings: json("findings").$type<Array<{ category: string; finding: string; severity: string }>>(),
    score: int("score"),
    maxScore: int("maxScore"),
    passFailStatus: mysqlEnum("passFailStatus", ["pass", "fail", "conditional"]),
    correctiveActions: json("correctiveActions").$type<Array<{ action: string; dueDate: string; status: string }>>(),
    documents: json("documents").$type<string[]>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("audit_company_idx").on(table.companyId),
    statusIdx: index("audit_status_idx").on(table.status),
    typeIdx: index("audit_type_idx").on(table.auditType),
    scheduledIdx: index("audit_scheduled_idx").on(table.scheduledDate),
  })
);

export type Audit = typeof audits.$inferSelect;
export type InsertAudit = typeof audits.$inferInsert;

// ============================================================================
// SAFETY - INCIDENTS & INSPECTIONS
// ============================================================================

export const safetyIncidents = mysqlTable(
  "safety_incidents",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    driverId: int("driverId"),
    vehicleId: int("vehicleId"),
    loadId: int("loadId"),
    incidentType: mysqlEnum("incidentType", [
      "accident",
      "near_miss",
      "injury",
      "spill",
      "property_damage",
      "theft",
      "breakdown",
      "other",
    ]).notNull(),
    severity: mysqlEnum("severity", ["minor", "moderate", "major", "critical"]).notNull(),
    status: mysqlEnum("status", ["reported", "investigating", "resolved", "closed"])
      .default("reported")
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    location: json("location").$type<{ lat: number; lng: number; address: string }>(),
    occurredAt: timestamp("occurredAt").notNull(),
    reportedAt: timestamp("reportedAt").defaultNow().notNull(),
    reportedBy: int("reportedBy"),
    weatherConditions: varchar("weatherConditions", { length: 100 }),
    roadConditions: varchar("roadConditions", { length: 100 }),
    injuriesCount: int("injuriesCount").default(0),
    fatalitiesCount: int("fatalitiesCount").default(0),
    estimatedDamage: decimal("estimatedDamage", { precision: 12, scale: 2 }),
    insuranceClaim: varchar("insuranceClaim", { length: 100 }),
    policeReport: varchar("policeReport", { length: 100 }),
    rootCause: text("rootCause"),
    correctiveActions: text("correctiveActions"),
    resolvedAt: timestamp("resolvedAt"),
    resolvedBy: int("resolvedBy"),
    documents: json("documents").$type<string[]>(),
    witnesses: json("witnesses").$type<Array<{ name: string; phone: string; statement: string }>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("incident_company_idx").on(table.companyId),
    driverIdx: index("incident_driver_idx").on(table.driverId),
    statusIdx: index("incident_status_idx").on(table.status),
    severityIdx: index("incident_severity_idx").on(table.severity),
    occurredIdx: index("incident_occurred_idx").on(table.occurredAt),
  })
);

export type SafetyIncident = typeof safetyIncidents.$inferSelect;
export type InsertSafetyIncident = typeof safetyIncidents.$inferInsert;

export const vehicleInspections = mysqlTable(
  "vehicle_inspections",
  {
    id: int("id").autoincrement().primaryKey(),
    vehicleId: int("vehicleId").notNull(),
    driverId: int("driverId").notNull(),
    companyId: int("companyId").notNull(),
    inspectionType: mysqlEnum("inspectionType", ["pre_trip", "post_trip", "dot", "annual", "roadside"])
      .notNull(),
    status: mysqlEnum("status", ["pass", "fail", "out_of_service"]).notNull(),
    inspectorType: mysqlEnum("inspectorType", ["driver", "mechanic", "dot_officer", "third_party"])
      .notNull(),
    inspectorName: varchar("inspectorName", { length: 255 }),
    inspectorBadge: varchar("inspectorBadge", { length: 50 }),
    location: json("location").$type<{ lat: number; lng: number; address: string }>(),
    odometer: int("odometer"),
    defects: json("defects").$type<Array<{ 
      category: string; 
      description: string; 
      severity: string; 
      repaired: boolean;
      repairedAt?: string;
    }>>(),
    defectCount: int("defectCount").default(0),
    criticalDefectCount: int("criticalDefectCount").default(0),
    driverSignature: text("driverSignature"),
    mechanicSignature: text("mechanicSignature"),
    notes: text("notes"),
    documents: json("documents").$type<string[]>(),
    inspectedAt: timestamp("inspectedAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    vehicleIdx: index("inspection_vehicle_idx").on(table.vehicleId),
    driverIdx: index("inspection_driver_idx").on(table.driverId),
    companyIdx: index("inspection_company_idx").on(table.companyId),
    typeIdx: index("inspection_type_idx").on(table.inspectionType),
    inspectedIdx: index("inspection_inspected_idx").on(table.inspectedAt),
  })
);

export type VehicleInspection = typeof vehicleInspections.$inferSelect;
export type InsertVehicleInspection = typeof vehicleInspections.$inferInsert;

// ============================================================================
// TERMINAL OPERATIONS
// ============================================================================

export const terminals = mysqlTable(
  "terminals",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 50 }),
    zipCode: varchar("zipCode", { length: 20 }),
    location: json("location").$type<{ lat: number; lng: number }>(),
    terminalType: mysqlEnum("terminalType", ["bulk", "petroleum", "chemical", "lpg", "lng", "asphalt", "general"])
      .notNull(),
    capacity: decimal("capacity", { precision: 12, scale: 2 }),
    capacityUnit: varchar("capacityUnit", { length: 20 }).default("barrels"),
    tankCount: int("tankCount").default(0),
    rackCount: int("rackCount").default(0),
    operatingHours: json("operatingHours").$type<{ open: string; close: string; days: string[] }>(),
    contactName: varchar("contactName", { length: 255 }),
    contactPhone: varchar("contactPhone", { length: 20 }),
    contactEmail: varchar("contactEmail", { length: 320 }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("terminal_company_idx").on(table.companyId),
    codeIdx: unique("terminal_code_unique").on(table.code),
    typeIdx: index("terminal_type_idx").on(table.terminalType),
  })
);

export type Terminal = typeof terminals.$inferSelect;
export type InsertTerminal = typeof terminals.$inferInsert;

export const loadingBays = mysqlTable(
  "loading_bays",
  {
    id: int("id").autoincrement().primaryKey(),
    terminalId: int("terminalId").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    bayNumber: int("bayNumber").notNull(),
    status: mysqlEnum("status", ["available", "loading", "unloading", "maintenance", "offline"])
      .default("available")
      .notNull(),
    currentLoadId: int("currentLoadId"),
    currentVehicleId: int("currentVehicleId"),
    currentDriverId: int("currentDriverId"),
    productType: varchar("productType", { length: 100 }),
    flowRate: decimal("flowRate", { precision: 8, scale: 2 }),
    loadingProgress: int("loadingProgress").default(0),
    startedAt: timestamp("startedAt"),
    estimatedCompletion: timestamp("estimatedCompletion"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    terminalIdx: index("bay_terminal_idx").on(table.terminalId),
    statusIdx: index("bay_status_idx").on(table.status),
    bayNumberIdx: index("bay_number_idx").on(table.terminalId, table.bayNumber),
  })
);

export type LoadingBay = typeof loadingBays.$inferSelect;
export type InsertLoadingBay = typeof loadingBays.$inferInsert;

export const tankInventory = mysqlTable(
  "tank_inventory",
  {
    id: int("id").autoincrement().primaryKey(),
    terminalId: int("terminalId").notNull(),
    tankNumber: varchar("tankNumber", { length: 50 }).notNull(),
    productName: varchar("productName", { length: 255 }).notNull(),
    productCode: varchar("productCode", { length: 50 }),
    capacity: decimal("capacity", { precision: 12, scale: 2 }).notNull(),
    currentLevel: decimal("currentLevel", { precision: 12, scale: 2 }).notNull(),
    capacityUnit: varchar("capacityUnit", { length: 20 }).default("gallons"),
    levelPercent: decimal("levelPercent", { precision: 5, scale: 2 }),
    temperature: decimal("temperature", { precision: 5, scale: 2 }),
    temperatureUnit: varchar("temperatureUnit", { length: 5 }).default("F"),
    lastGaugeReading: timestamp("lastGaugeReading"),
    lowLevelAlert: decimal("lowLevelAlert", { precision: 5, scale: 2 }).default("20"),
    highLevelAlert: decimal("highLevelAlert", { precision: 5, scale: 2 }).default("95"),
    status: mysqlEnum("status", ["normal", "low", "high", "critical", "offline"])
      .default("normal")
      .notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    terminalIdx: index("tank_terminal_idx").on(table.terminalId),
    productIdx: index("tank_product_idx").on(table.productCode),
    statusIdx: index("tank_status_idx").on(table.status),
  })
);

export type TankInventory = typeof tankInventory.$inferSelect;
export type InsertTankInventory = typeof tankInventory.$inferInsert;

export const billsOfLading = mysqlTable(
  "bills_of_lading",
  {
    id: int("id").autoincrement().primaryKey(),
    terminalId: int("terminalId").notNull(),
    loadId: int("loadId"),
    bolNumber: varchar("bolNumber", { length: 50 }).notNull().unique(),
    status: mysqlEnum("status", ["draft", "pending", "approved", "printed", "voided"])
      .default("draft")
      .notNull(),
    shipperName: varchar("shipperName", { length: 255 }),
    shipperId: int("shipperId"),
    carrierName: varchar("carrierName", { length: 255 }),
    carrierId: int("carrierId"),
    driverName: varchar("driverName", { length: 255 }),
    driverId: int("driverId"),
    vehicleNumber: varchar("vehicleNumber", { length: 50 }),
    trailerNumber: varchar("trailerNumber", { length: 50 }),
    productName: varchar("productName", { length: 255 }).notNull(),
    productCode: varchar("productCode", { length: 50 }),
    quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
    quantityUnit: varchar("quantityUnit", { length: 20 }).default("gallons"),
    grossWeight: decimal("grossWeight", { precision: 10, scale: 2 }),
    netWeight: decimal("netWeight", { precision: 10, scale: 2 }),
    destination: text("destination"),
    specialInstructions: text("specialInstructions"),
    hazmatClass: varchar("hazmatClass", { length: 20 }),
    unNumber: varchar("unNumber", { length: 20 }),
    temperature: decimal("temperature", { precision: 5, scale: 2 }),
    sealNumbers: json("sealNumbers").$type<string[]>(),
    signatures: json("signatures").$type<{ driver?: string; terminal?: string; receiver?: string }>(),
    printedAt: timestamp("printedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    terminalIdx: index("bol_terminal_idx").on(table.terminalId),
    loadIdx: index("bol_load_idx").on(table.loadId),
    bolNumberIdx: unique("bol_number_unique").on(table.bolNumber),
    statusIdx: index("bol_status_idx").on(table.status),
  })
);

export type BillOfLading = typeof billsOfLading.$inferSelect;
export type InsertBillOfLading = typeof billsOfLading.$inferInsert;

// ============================================================================
// ESCORT OPERATIONS
// ============================================================================

export const escortPermits = mysqlTable(
  "escort_permits",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    state: varchar("state", { length: 50 }).notNull(),
    permitNumber: varchar("permitNumber", { length: 100 }).notNull(),
    permitType: varchar("permitType", { length: 100 }),
    status: mysqlEnum("status", ["active", "expiring_soon", "expired", "pending", "suspended"])
      .default("active")
      .notNull(),
    issuedDate: timestamp("issuedDate").notNull(),
    expirationDate: timestamp("expirationDate").notNull(),
    reciprocityStates: json("reciprocityStates").$type<string[]>(),
    documents: json("documents").$type<string[]>(),
    renewalSubmittedAt: timestamp("renewalSubmittedAt"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("escort_permit_user_idx").on(table.userId),
    stateIdx: index("escort_permit_state_idx").on(table.state),
    statusIdx: index("escort_permit_status_idx").on(table.status),
    expirationIdx: index("escort_permit_expiration_idx").on(table.expirationDate),
  })
);

export type EscortPermit = typeof escortPermits.$inferSelect;
export type InsertEscortPermit = typeof escortPermits.$inferInsert;

export const escortJobs = mysqlTable(
  "escort_jobs",
  {
    id: int("id").autoincrement().primaryKey(),
    carrierId: int("carrierId").notNull(),
    escortId: int("escortId"),
    loadId: int("loadId"),
    title: varchar("title", { length: 255 }).notNull(),
    status: mysqlEnum("status", ["posted", "assigned", "in_progress", "completed", "cancelled"])
      .default("posted")
      .notNull(),
    position: mysqlEnum("position", ["lead", "chase", "both"]).notNull(),
    origin: json("origin").$type<{ city: string; state: string; lat: number; lng: number }>(),
    destination: json("destination").$type<{ city: string; state: string; lat: number; lng: number }>(),
    startDate: timestamp("startDate").notNull(),
    estimatedDuration: varchar("estimatedDuration", { length: 50 }),
    distance: decimal("distance", { precision: 10, scale: 2 }),
    rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
    rateType: mysqlEnum("rateType", ["flat", "hourly", "per_mile"]).default("flat"),
    loadDetails: json("loadDetails").$type<{
      type: string;
      dimensions: string;
      weight: string;
    }>(),
    requirements: json("requirements").$type<{
      equipment: string[];
      certifications: string[];
    }>(),
    urgency: mysqlEnum("urgency", ["normal", "high", "urgent"]).default("normal"),
    notes: text("notes"),
    completedAt: timestamp("completedAt"),
    rating: decimal("rating", { precision: 2, scale: 1 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    carrierIdx: index("escort_job_carrier_idx").on(table.carrierId),
    escortIdx: index("escort_job_escort_idx").on(table.escortId),
    statusIdx: index("escort_job_status_idx").on(table.status),
    startDateIdx: index("escort_job_start_date_idx").on(table.startDate),
  })
);

export type EscortJob = typeof escortJobs.$inferSelect;
export type InsertEscortJob = typeof escortJobs.$inferInsert;

export const escortAvailability = mysqlTable(
  "escort_availability",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    dayOfWeek: int("dayOfWeek").notNull(),
    available: boolean("available").default(true).notNull(),
    startTime: varchar("startTime", { length: 10 }),
    endTime: varchar("endTime", { length: 10 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("escort_availability_user_idx").on(table.userId),
    userDayIdx: unique("escort_availability_user_day_unique").on(table.userId, table.dayOfWeek),
  })
);

export type EscortAvailability = typeof escortAvailability.$inferSelect;
export type InsertEscortAvailability = typeof escortAvailability.$inferInsert;

// ============================================================================
// DISPATCH EXCEPTIONS
// ============================================================================

export const dispatchExceptions = mysqlTable(
  "dispatch_exceptions",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    loadId: int("loadId"),
    driverId: int("driverId"),
    vehicleId: int("vehicleId"),
    exceptionType: mysqlEnum("exceptionType", [
      "breakdown",
      "delay",
      "hos_violation",
      "weather",
      "customer_issue",
      "accident",
      "other",
    ]).notNull(),
    severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
    status: mysqlEnum("status", ["open", "in_progress", "monitoring", "resolved"])
      .default("open")
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    location: json("location").$type<{ lat: number; lng: number; address: string }>(),
    estimatedDelay: int("estimatedDelay"),
    actualDelay: int("actualDelay"),
    reportedBy: int("reportedBy"),
    reportedAt: timestamp("reportedAt").defaultNow().notNull(),
    assignedTo: int("assignedTo"),
    resolution: text("resolution"),
    resolvedAt: timestamp("resolvedAt"),
    resolvedBy: int("resolvedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    companyIdx: index("exception_company_idx").on(table.companyId),
    loadIdx: index("exception_load_idx").on(table.loadId),
    statusIdx: index("exception_status_idx").on(table.status),
    severityIdx: index("exception_severity_idx").on(table.severity),
    typeIdx: index("exception_type_idx").on(table.exceptionType),
  })
);

export type DispatchException = typeof dispatchExceptions.$inferSelect;
export type InsertDispatchException = typeof dispatchExceptions.$inferInsert;

// ============================================================================
// HOS (HOURS OF SERVICE) LOGS
// ============================================================================

export const hosLogs = mysqlTable(
  "hos_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    driverId: int("driverId").notNull(),
    companyId: int("companyId").notNull(),
    logDate: timestamp("logDate").notNull(),
    status: mysqlEnum("status", ["off_duty", "sleeper", "driving", "on_duty"]).notNull(),
    startTime: timestamp("startTime").notNull(),
    endTime: timestamp("endTime"),
    duration: int("duration"),
    location: json("location").$type<{ lat: number; lng: number; address: string }>(),
    vehicleId: int("vehicleId"),
    loadId: int("loadId"),
    odometer: int("odometer"),
    engineHours: decimal("engineHours", { precision: 10, scale: 2 }),
    notes: text("notes"),
    editReason: text("editReason"),
    editedBy: int("editedBy"),
    editedAt: timestamp("editedAt"),
    isCertified: boolean("isCertified").default(false),
    certifiedAt: timestamp("certifiedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    driverIdx: index("hos_driver_idx").on(table.driverId),
    companyIdx: index("hos_company_idx").on(table.companyId),
    logDateIdx: index("hos_log_date_idx").on(table.logDate),
    statusIdx: index("hos_status_idx").on(table.status),
  })
);

export type HosLog = typeof hosLogs.$inferSelect;
export type InsertHosLog = typeof hosLogs.$inferInsert;

