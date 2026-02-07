import {
  int,
  bigint,
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
    passwordHash: varchar("passwordHash", { length: 255 }),
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
    metadata: text("metadata"),
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
      "en_route_pickup",
      "at_pickup",
      "loading",
      "in_transit",
      "at_delivery",
      "unloading",
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
    status: mysqlEnum("status", ["not_started", "in_progress", "completed", "claimed", "expired"]).default("not_started").notNull(),
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
      "LOAD_MANAGEMENT", "FINANCIAL", "COMMUNICATION", "NAVIGATION",
      "COMPLIANCE", "GAMIFICATION", "ANALYTICS", "ZEUN_MECHANICS", "SYSTEM"
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
    carrierWalletId: int("carrierWalletId").notNull(),
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
    availableForRoles: json("availableForRoles").$type<string[]>().default(["CARRIER", "SHIPPER", "BROKER"]),
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
// EUSOSHIELD - CARRIER RISK SCORES
// ============================================================================

export const carrierRiskScores = mysqlTable(
  "carrier_risk_scores",
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
export type CarrierRiskScore = typeof carrierRiskScores.$inferSelect;
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
      "carrier_shipper",
      "broker_carrier",
      "broker_shipper",
      "carrier_driver",
      "escort_service",
      "catalyst_dispatch",
      "terminal_access",
      "master_service",
      "lane_commitment",
      "fuel_surcharge",
      "accessorial_schedule",
      "nda",
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
      "carrier_shipper",
      "broker_carrier",
      "broker_shipper",
      "carrier_driver",
      "escort_service",
      "catalyst_dispatch",
      "terminal_access",
      "master_service",
      "lane_commitment",
      "fuel_surcharge",
      "accessorial_schedule",
      "nda",
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
    lanes: json("lanes").$type<{
      origin: { city: string; state: string; radius?: number };
      destination: { city: string; state: string; radius?: number };
      rate: number;
      rateType: string;
      volumeCommitment?: number;
      volumePeriod?: string;
    }[]>(),
    volumeCommitmentTotal: int("volumeCommitmentTotal"),
    volumeCommitmentPeriod: varchar("volumeCommitmentPeriod", { length: 20 }),
    // Accessorial schedule
    accessorialSchedule: json("accessorialSchedule").$type<{
      type: string;
      rate: number;
      unit: string;
      description: string;
    }[]>(),
    // Full generated contract content
    generatedContent: text("generatedContent"),
    clauses: json("clauses").$type<{
      id: string;
      title: string;
      body: string;
      isModified: boolean;
      modifiedBy?: number;
    }[]>(),
    // Strategic inputs that generated this agreement
    strategicInputs: json("strategicInputs"),
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
    bidderRole: mysqlEnum("bidderRole", ["carrier", "broker", "driver", "escort"]).notNull(),
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
    minCarrierRating: decimal("minCarrierRating", { precision: 3, scale: 1 }),
    requiredInsuranceMin: decimal("requiredInsuranceMin", { precision: 12, scale: 2 }),
    requiredEquipmentTypes: json("requiredEquipmentTypes").$type<string[]>(),
    requiredHazmat: boolean("requiredHazmat").default(false),
    maxTransitDays: int("maxTransitDays"),
    preferredCarrierIds: json("preferredCarrierIds").$type<number[]>(),
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
    carrierId: int("carrierId"),
    carrierCompanyId: int("carrierCompanyId"),
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
    carrierIdx: index("lane_carrier_idx").on(table.carrierId),
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

