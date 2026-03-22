import { relations } from "drizzle-orm";
import {
  users,
  companies,
  loads,
  loadStops,
  loadRelayLegs,
  loadTemplates,
  bids,
  payments,
  settlements,
  settlementDocuments,
  conversations,
  conversationParticipants,
  messages,
  messageReactions,
  messageAttachments,
  messageReadReceipts,
  vehicles,
  drivers,
  documents,
  terminals,
  terminalPartners,
  terminalStaff,
  notifications,
  auditLogs,
  wallets,
  walletTransactions,
  payoutMethods,
  p2pTransfers,
  chatPayments,
  cashAdvances,
  instantPayRequests,
  escortAssignments,
  convoys,
  routes,
  routeWaypoints,
  gpsTracking,
  locationHistory,
  geofences,
  geofenceEvents,
  geofenceAlerts,
  inspections,
  incidents,
  certifications,
  fuelTransactions,
  appointments,
  agreements,
  agreementTemplates,
  agreementSignatures,
  agreementAmendments,
  loadBids,
  negotiations,
  negotiationMessages,
  laneContracts,
  gamificationProfiles,
  missions,
  missionProgress,
  userBadges,
  badges,
  rewardCrates,
  leaderboards,
  userTitles,
  seasons,
  zeunBreakdownReports,
  zeunDiagnosticResults,
  zeunRepairProviders,
  zeunProviderReviews,
  zeunMaintenanceLogs,
  zeunMaintenanceSchedules,
  zeunVehicleRecalls,
  zeunBreakdownStatusHistory,
  integrationConnections,
  integrationProviders,
  integrationSyncLogs,
  integrationWebhooks,
  insurancePolicies,
  insuranceProviders,
  insuranceClaims,
  insuranceQuotes,
  loadInsurance,
  insuranceAlerts,
  linkedBankAccounts,
  bankTransactions,
  achTransfers,
  payrollRuns,
  payrollItems,
  dashboardLayouts,
  widgetConfigurations,
  dashboardWidgets,
  platformFeeConfigs,
  userFeeOverrides,
  platformRevenue,
  feeCalculations,
  feeAuditLog,
  groupChannels,
  channelMembers,
  escrowHolds,
  detentionClaims,
  factoringInvoices,
  onboardingProgress,
  trainingModules,
  userTraining,
  drugTests,
  trainingRecords,
  supplyChainPartnerships,
  complianceNetworkMemberships,
  etaHistory,
  speedEvents,
  safetyAlerts,
  rewards,
  notificationPreferences,
  pushTokens,
  smsMessages,
  documentHashes,
  paymentMethods,
  guilds,
  guildMembers,
  promoCodes,
  promoCodeUsage,
  milesTransactions,
  lootCrates,
  userInventory,
  railShipments,
  vesselShipments,
} from "./schema";

// ═══════════════════════════════════════════════════════════════
// CORE ENTITY RELATIONS
// ═══════════════════════════════════════════════════════════════

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  loads: many(loads),
  bids: many(bids),
  paymentsSent: many(payments, { relationName: "paymentsPayer" }),
  paymentsReceived: many(payments, { relationName: "paymentsPayee" }),
  wallet: one(wallets),
  driver: one(drivers),
  documents: many(documents),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
  certifications: many(certifications),
  gamificationProfile: one(gamificationProfiles),
  messagesSent: many(messages),
  rewards: many(rewards),
  notificationPreferences: one(notificationPreferences),
  pushTokens: many(pushTokens),
  onboardingProgress: one(onboardingProgress),
  dashboardLayouts: many(dashboardLayouts),
  payoutMethods: many(payoutMethods),
  paymentMethods: many(paymentMethods),
  userBadges: many(userBadges),
  userTitles: many(userTitles),
  rewardCrates: many(rewardCrates),
  leaderboards: many(leaderboards),
  locationHistory: many(locationHistory),
  speedEvents: many(speedEvents),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  vehicles: many(vehicles),
  drivers: many(drivers),
  terminals: many(terminals),
  documents: many(documents),
  conversations: many(conversations),
  incidents: many(incidents),
  inspections: many(inspections),
  fuelTransactions: many(fuelTransactions),
  payrollRuns: many(payrollRuns),
  agreements: many(agreements),
  insurancePolicies: many(insurancePolicies),
  insuranceClaims: many(insuranceClaims),
  geofences: many(geofences),
  groupChannels: many(groupChannels),
  guilds: many(guilds),
  integrationConnections: many(integrationConnections),
}));

export const loadsRelations = relations(loads, ({ one, many }) => ({
  shipper: one(users, { fields: [loads.shipperId], references: [users.id], relationName: "loadShipper" }),
  catalyst: one(users, { fields: [loads.catalystId], references: [users.id], relationName: "loadCatalyst" }),
  driver: one(users, { fields: [loads.driverId], references: [users.id], relationName: "loadDriver" }),
  vehicle: one(vehicles, { fields: [loads.vehicleId], references: [vehicles.id] }),
  originTerminal: one(terminals, { fields: [loads.originTerminalId], references: [terminals.id], relationName: "originTerminal" }),
  destinationTerminal: one(terminals, { fields: [loads.destinationTerminalId], references: [terminals.id], relationName: "destinationTerminal" }),
  stops: many(loadStops),
  bids: many(bids),
  payments: many(payments),
  settlements: many(settlements),
  conversations: many(conversations),
  documents: many(documents),
  escortAssignments: many(escortAssignments),
  loadBids: many(loadBids),
  walletTransactions: many(walletTransactions),
  cashAdvances: many(cashAdvances),
  instantPayRequests: many(instantPayRequests),
  appointments: many(appointments),
  routes: many(routes),
  gpsTracking: many(gpsTracking),
  locationHistory: many(locationHistory),
  detentionClaims: many(detentionClaims),
  factoringInvoices: many(factoringInvoices),
  loadInsurance: many(loadInsurance),
  safetyAlerts: many(safetyAlerts),
  etaHistory: many(etaHistory),
  relayLegs: many(loadRelayLegs),
  convoys: many(convoys),
  escrowHolds: many(escrowHolds),
  geofenceEvents: many(geofenceEvents),
  speedEvents: many(speedEvents),
}));

export const loadStopsRelations = relations(loadStops, ({ one }) => ({
  load: one(loads, { fields: [loadStops.loadId], references: [loads.id] }),
}));

export const loadRelayLegsRelations = relations(loadRelayLegs, ({ one }) => ({
  load: one(loads, { fields: [loadRelayLegs.loadId], references: [loads.id] }),
  driver: one(users, { fields: [loadRelayLegs.driverId], references: [users.id] }),
  vehicle: one(vehicles, { fields: [loadRelayLegs.vehicleId], references: [vehicles.id] }),
}));

export const loadTemplatesRelations = relations(loadTemplates, ({ one }) => ({
  owner: one(users, { fields: [loadTemplates.ownerId], references: [users.id] }),
  company: one(companies, { fields: [loadTemplates.companyId], references: [companies.id] }),
}));

// ═══════════════════════════════════════════════════════════════
// BIDDING & NEGOTIATION
// ═══════════════════════════════════════════════════════════════

export const bidsRelations = relations(bids, ({ one }) => ({
  load: one(loads, { fields: [bids.loadId], references: [loads.id] }),
  catalyst: one(users, { fields: [bids.catalystId], references: [users.id] }),
}));

export const loadBidsRelations = relations(loadBids, ({ one }) => ({
  load: one(loads, { fields: [loadBids.loadId], references: [loads.id] }),
  bidder: one(users, { fields: [loadBids.bidderUserId], references: [users.id] }),
  bidderCompany: one(companies, { fields: [loadBids.bidderCompanyId], references: [companies.id] }),
  agreement: one(agreements, { fields: [loadBids.agreementId], references: [agreements.id] }),
}));

export const negotiationsRelations = relations(negotiations, ({ one, many }) => ({
  load: one(loads, { fields: [negotiations.loadId], references: [loads.id] }),
  agreement: one(agreements, { fields: [negotiations.agreementId], references: [agreements.id] }),
  laneContract: one(laneContracts, { fields: [negotiations.laneContractId], references: [laneContracts.id] }),
  initiator: one(users, { fields: [negotiations.initiatorUserId], references: [users.id], relationName: "negotiationInitiator" }),
  respondent: one(users, { fields: [negotiations.respondentUserId], references: [users.id], relationName: "negotiationRespondent" }),
  messages: many(negotiationMessages),
}));

export const negotiationMessagesRelations = relations(negotiationMessages, ({ one }) => ({
  negotiation: one(negotiations, { fields: [negotiationMessages.negotiationId], references: [negotiations.id] }),
  sender: one(users, { fields: [negotiationMessages.senderUserId], references: [users.id] }),
}));

export const laneContractsRelations = relations(laneContracts, ({ one, many }) => ({
  agreement: one(agreements, { fields: [laneContracts.agreementId], references: [agreements.id] }),
  shipper: one(users, { fields: [laneContracts.shipperId], references: [users.id], relationName: "laneShipper" }),
  catalyst: one(users, { fields: [laneContracts.catalystId], references: [users.id], relationName: "laneCatalyst" }),
  negotiations: many(negotiations),
}));

// ═══════════════════════════════════════════════════════════════
// PAYMENTS & FINANCIAL
// ═══════════════════════════════════════════════════════════════

export const paymentsRelations = relations(payments, ({ one }) => ({
  load: one(loads, { fields: [payments.loadId], references: [loads.id] }),
  payer: one(users, { fields: [payments.payerId], references: [users.id], relationName: "paymentsPayer" }),
  payee: one(users, { fields: [payments.payeeId], references: [users.id], relationName: "paymentsPayee" }),
}));

export const settlementsRelations = relations(settlements, ({ one, many }) => ({
  load: one(loads, { fields: [settlements.loadId], references: [loads.id] }),
  railShipment: one(railShipments, { fields: [settlements.railShipmentId], references: [railShipments.id] }),
  vesselShipment: one(vesselShipments, { fields: [settlements.vesselShipmentId], references: [vesselShipments.id] }),
  shipper: one(users, { fields: [settlements.shipperId], references: [users.id], relationName: "settlementShipper" }),
  carrier: one(users, { fields: [settlements.carrierId], references: [users.id], relationName: "settlementCarrier" }),
  driver: one(users, { fields: [settlements.driverId], references: [users.id], relationName: "settlementDriver" }),
  documents: many(settlementDocuments),
}));

export const settlementDocumentsRelations = relations(settlementDocuments, ({ one }) => ({
  settlement: one(settlements, { fields: [settlementDocuments.settlementId], references: [settlements.id] }),
  load: one(loads, { fields: [settlementDocuments.loadId], references: [loads.id] }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
  transactions: many(walletTransactions),
  cashAdvances: many(cashAdvances),
  instantPayRequests: many(instantPayRequests),
  payrollItems: many(payrollItems),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, { fields: [walletTransactions.walletId], references: [wallets.id] }),
  load: one(loads, { fields: [walletTransactions.loadId], references: [loads.id] }),
}));

export const payoutMethodsRelations = relations(payoutMethods, ({ one }) => ({
  user: one(users, { fields: [payoutMethods.userId], references: [users.id] }),
}));

export const p2pTransfersRelations = relations(p2pTransfers, ({ one, many }) => ({
  senderWallet: one(wallets, { fields: [p2pTransfers.senderWalletId], references: [wallets.id], relationName: "senderTransfers" }),
  recipientWallet: one(wallets, { fields: [p2pTransfers.recipientWalletId], references: [wallets.id], relationName: "recipientTransfers" }),
  chatPayments: many(chatPayments),
}));

export const chatPaymentsRelations = relations(chatPayments, ({ one }) => ({
  conversation: one(conversations, { fields: [chatPayments.conversationId], references: [conversations.id] }),
  message: one(messages, { fields: [chatPayments.messageId], references: [messages.id] }),
  sender: one(users, { fields: [chatPayments.senderUserId], references: [users.id], relationName: "chatPaymentSender" }),
  recipient: one(users, { fields: [chatPayments.recipientUserId], references: [users.id], relationName: "chatPaymentRecipient" }),
  p2pTransfer: one(p2pTransfers, { fields: [chatPayments.p2pTransferId], references: [p2pTransfers.id] }),
}));

export const cashAdvancesRelations = relations(cashAdvances, ({ one }) => ({
  user: one(users, { fields: [cashAdvances.userId], references: [users.id] }),
  wallet: one(wallets, { fields: [cashAdvances.walletId], references: [wallets.id] }),
  load: one(loads, { fields: [cashAdvances.loadId], references: [loads.id] }),
}));

export const instantPayRequestsRelations = relations(instantPayRequests, ({ one }) => ({
  user: one(users, { fields: [instantPayRequests.userId], references: [users.id] }),
  wallet: one(wallets, { fields: [instantPayRequests.walletId], references: [wallets.id] }),
  load: one(loads, { fields: [instantPayRequests.loadId], references: [loads.id] }),
  payoutMethod: one(payoutMethods, { fields: [instantPayRequests.payoutMethodId], references: [payoutMethods.id] }),
}));

export const escrowHoldsRelations = relations(escrowHolds, ({ one }) => ({
  load: one(loads, { fields: [escrowHolds.loadId], references: [loads.id] }),
  shipperWallet: one(wallets, { fields: [escrowHolds.shipperWalletId], references: [wallets.id], relationName: "escrowShipper" }),
  catalystWallet: one(wallets, { fields: [escrowHolds.catalystWalletId], references: [wallets.id], relationName: "escrowCatalyst" }),
}));

export const detentionClaimsRelations = relations(detentionClaims, ({ one }) => ({
  load: one(loads, { fields: [detentionClaims.loadId], references: [loads.id] }),
  claimedBy: one(users, { fields: [detentionClaims.claimedByUserId], references: [users.id], relationName: "detentionClaimant" }),
  claimedAgainst: one(users, { fields: [detentionClaims.claimedAgainstUserId], references: [users.id], relationName: "detentionDefendant" }),
}));

export const factoringInvoicesRelations = relations(factoringInvoices, ({ one }) => ({
  load: one(loads, { fields: [factoringInvoices.loadId], references: [loads.id] }),
  catalyst: one(users, { fields: [factoringInvoices.catalystUserId], references: [users.id] }),
  shipper: one(users, { fields: [factoringInvoices.shipperUserId], references: [users.id] }),
  factoringCompany: one(companies, { fields: [factoringInvoices.factoringCompanyId], references: [companies.id] }),
}));

export const linkedBankAccountsRelations = relations(linkedBankAccounts, ({ one, many }) => ({
  user: one(users, { fields: [linkedBankAccounts.userId], references: [users.id] }),
  transactions: many(bankTransactions),
}));

export const bankTransactionsRelations = relations(bankTransactions, ({ one }) => ({
  account: one(linkedBankAccounts, { fields: [bankTransactions.accountId], references: [linkedBankAccounts.id] }),
}));

export const achTransfersRelations = relations(achTransfers, ({ one }) => ({
  fromAccount: one(linkedBankAccounts, { fields: [achTransfers.fromAccountId], references: [linkedBankAccounts.id], relationName: "achFrom" }),
  toAccount: one(linkedBankAccounts, { fields: [achTransfers.toAccountId], references: [linkedBankAccounts.id], relationName: "achTo" }),
  initiatedBy: one(users, { fields: [achTransfers.initiatedBy], references: [users.id] }),
}));

export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
  company: one(companies, { fields: [payrollRuns.companyId], references: [companies.id] }),
  items: many(payrollItems),
}));

export const payrollItemsRelations = relations(payrollItems, ({ one }) => ({
  payrollRun: one(payrollRuns, { fields: [payrollItems.payrollRunId], references: [payrollRuns.id] }),
  user: one(users, { fields: [payrollItems.userId], references: [users.id] }),
  wallet: one(wallets, { fields: [payrollItems.walletId], references: [wallets.id] }),
}));

export const platformFeeConfigsRelations = relations(platformFeeConfigs, ({ many }) => ({
  userOverrides: many(userFeeOverrides),
  revenue: many(platformRevenue),
  calculations: many(feeCalculations),
  auditLog: many(feeAuditLog),
}));

export const userFeeOverridesRelations = relations(userFeeOverrides, ({ one }) => ({
  user: one(users, { fields: [userFeeOverrides.userId], references: [users.id] }),
  feeConfig: one(platformFeeConfigs, { fields: [userFeeOverrides.feeConfigId], references: [platformFeeConfigs.id] }),
}));

export const feeCalculationsRelations = relations(feeCalculations, ({ one }) => ({
  feeConfig: one(platformFeeConfigs, { fields: [feeCalculations.feeConfigId], references: [platformFeeConfigs.id] }),
  user: one(users, { fields: [feeCalculations.userId], references: [users.id] }),
  company: one(companies, { fields: [feeCalculations.companyId], references: [companies.id] }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, { fields: [paymentMethods.userId], references: [users.id] }),
}));

// ═══════════════════════════════════════════════════════════════
// MESSAGING & CONVERSATIONS
// ═══════════════════════════════════════════════════════════════

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  load: one(loads, { fields: [conversations.loadId], references: [loads.id] }),
  company: one(companies, { fields: [conversations.companyId], references: [companies.id] }),
  messages: many(messages),
  participants: many(conversationParticipants),
  chatPayments: many(chatPayments),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, { fields: [conversationParticipants.conversationId], references: [conversations.id] }),
  user: one(users, { fields: [conversationParticipants.userId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  reactions: many(messageReactions),
  attachments: many(messageAttachments),
  readReceipts: many(messageReadReceipts),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(messages, { fields: [messageReactions.messageId], references: [messages.id] }),
  user: one(users, { fields: [messageReactions.userId], references: [users.id] }),
}));

export const messageAttachmentsRelations = relations(messageAttachments, ({ one }) => ({
  message: one(messages, { fields: [messageAttachments.messageId], references: [messages.id] }),
}));

export const messageReadReceiptsRelations = relations(messageReadReceipts, ({ one }) => ({
  message: one(messages, { fields: [messageReadReceipts.messageId], references: [messages.id] }),
  user: one(users, { fields: [messageReadReceipts.userId], references: [users.id] }),
}));

export const groupChannelsRelations = relations(groupChannels, ({ one, many }) => ({
  company: one(companies, { fields: [groupChannels.companyId], references: [companies.id] }),
  createdBy: one(users, { fields: [groupChannels.createdBy], references: [users.id] }),
  members: many(channelMembers),
}));

export const channelMembersRelations = relations(channelMembers, ({ one }) => ({
  channel: one(groupChannels, { fields: [channelMembers.channelId], references: [groupChannels.id] }),
  user: one(users, { fields: [channelMembers.userId], references: [users.id] }),
}));

// ═══════════════════════════════════════════════════════════════
// FLEET & TRACKING
// ═══════════════════════════════════════════════════════════════

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  company: one(companies, { fields: [vehicles.companyId], references: [companies.id] }),
  currentDriver: one(users, { fields: [vehicles.currentDriverId], references: [users.id] }),
  loads: many(loads),
  inspections: many(inspections),
  gpsTracking: many(gpsTracking),
  fuelTransactions: many(fuelTransactions),
  incidents: many(incidents),
  zeunBreakdownReports: many(zeunBreakdownReports),
  zeunMaintenanceLogs: many(zeunMaintenanceLogs),
  zeunMaintenanceSchedules: many(zeunMaintenanceSchedules),
  zeunVehicleRecalls: many(zeunVehicleRecalls),
}));

export const driversRelations = relations(drivers, ({ one }) => ({
  user: one(users, { fields: [drivers.userId], references: [users.id] }),
  company: one(companies, { fields: [drivers.companyId], references: [companies.id] }),
}));

export const gpsTrackingRelations = relations(gpsTracking, ({ one }) => ({
  vehicle: one(vehicles, { fields: [gpsTracking.vehicleId], references: [vehicles.id] }),
  driver: one(users, { fields: [gpsTracking.driverId], references: [users.id] }),
  load: one(loads, { fields: [gpsTracking.loadId], references: [loads.id] }),
}));

export const locationHistoryRelations = relations(locationHistory, ({ one }) => ({
  user: one(users, { fields: [locationHistory.userId], references: [users.id] }),
  load: one(loads, { fields: [locationHistory.loadId], references: [loads.id] }),
  convoy: one(convoys, { fields: [locationHistory.convoyId], references: [convoys.id] }),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  load: one(loads, { fields: [routes.loadId], references: [loads.id] }),
  waypoints: many(routeWaypoints),
  convoys: many(convoys),
}));

export const routeWaypointsRelations = relations(routeWaypoints, ({ one }) => ({
  route: one(routes, { fields: [routeWaypoints.routeId], references: [routes.id] }),
}));

export const convoysRelations = relations(convoys, ({ one, many }) => ({
  load: one(loads, { fields: [convoys.loadId], references: [loads.id] }),
  route: one(routes, { fields: [convoys.routeId], references: [routes.id] }),
  leadUser: one(users, { fields: [convoys.leadUserId], references: [users.id], relationName: "convoyLead" }),
  loadUser: one(users, { fields: [convoys.loadUserId], references: [users.id], relationName: "convoyLoad" }),
  rearUser: one(users, { fields: [convoys.rearUserId], references: [users.id], relationName: "convoyRear" }),
  escortAssignments: many(escortAssignments),
  locationHistory: many(locationHistory),
}));

export const escortAssignmentsRelations = relations(escortAssignments, ({ one }) => ({
  load: one(loads, { fields: [escortAssignments.loadId], references: [loads.id] }),
  escortUser: one(users, { fields: [escortAssignments.escortUserId], references: [users.id] }),
  convoy: one(convoys, { fields: [escortAssignments.convoyId], references: [convoys.id] }),
}));

export const etaHistoryRelations = relations(etaHistory, ({ one }) => ({
  load: one(loads, { fields: [etaHistory.loadId], references: [loads.id] }),
  waypoint: one(routeWaypoints, { fields: [etaHistory.waypointId], references: [routeWaypoints.id] }),
}));

export const geofencesRelations = relations(geofences, ({ one, many }) => ({
  company: one(companies, { fields: [geofences.companyId], references: [companies.id] }),
  load: one(loads, { fields: [geofences.loadId], references: [loads.id] }),
  terminal: one(terminals, { fields: [geofences.terminalId], references: [terminals.id] }),
  createdBy: one(users, { fields: [geofences.createdBy], references: [users.id] }),
  events: many(geofenceEvents),
  alerts: many(geofenceAlerts),
}));

export const geofenceEventsRelations = relations(geofenceEvents, ({ one }) => ({
  geofence: one(geofences, { fields: [geofenceEvents.geofenceId], references: [geofences.id] }),
  user: one(users, { fields: [geofenceEvents.userId], references: [users.id] }),
  load: one(loads, { fields: [geofenceEvents.loadId], references: [loads.id] }),
}));

export const geofenceAlertsRelations = relations(geofenceAlerts, ({ one }) => ({
  vehicle: one(vehicles, { fields: [geofenceAlerts.vehicleId], references: [vehicles.id] }),
  geofence: one(geofences, { fields: [geofenceAlerts.geofenceId], references: [geofences.id] }),
}));

// ═══════════════════════════════════════════════════════════════
// TERMINALS & FACILITIES
// ═══════════════════════════════════════════════════════════════

export const terminalsRelations = relations(terminals, ({ one, many }) => ({
  company: one(companies, { fields: [terminals.companyId], references: [companies.id] }),
  partners: many(terminalPartners),
  staff: many(terminalStaff),
  appointments: many(appointments),
  geofences: many(geofences),
}));

export const terminalPartnersRelations = relations(terminalPartners, ({ one }) => ({
  terminal: one(terminals, { fields: [terminalPartners.terminalId], references: [terminals.id] }),
  company: one(companies, { fields: [terminalPartners.companyId], references: [companies.id] }),
  agreement: one(agreements, { fields: [terminalPartners.agreementId], references: [agreements.id] }),
}));

export const terminalStaffRelations = relations(terminalStaff, ({ one }) => ({
  company: one(companies, { fields: [terminalStaff.companyId], references: [companies.id] }),
  terminal: one(terminals, { fields: [terminalStaff.terminalId], references: [terminals.id] }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  terminal: one(terminals, { fields: [appointments.terminalId], references: [terminals.id] }),
  load: one(loads, { fields: [appointments.loadId], references: [loads.id] }),
  driver: one(users, { fields: [appointments.driverId], references: [users.id] }),
}));

// ═══════════════════════════════════════════════════════════════
// COMPLIANCE & SAFETY
// ═══════════════════════════════════════════════════════════════

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
  company: one(companies, { fields: [documents.companyId], references: [companies.id] }),
  load: one(loads, { fields: [documents.loadId], references: [loads.id] }),
  agreement: one(agreements, { fields: [documents.agreementId], references: [agreements.id] }),
}));

export const inspectionsRelations = relations(inspections, ({ one }) => ({
  vehicle: one(vehicles, { fields: [inspections.vehicleId], references: [vehicles.id] }),
  driver: one(users, { fields: [inspections.driverId], references: [users.id] }),
  company: one(companies, { fields: [inspections.companyId], references: [companies.id] }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  company: one(companies, { fields: [incidents.companyId], references: [companies.id] }),
  driver: one(users, { fields: [incidents.driverId], references: [users.id] }),
  vehicle: one(vehicles, { fields: [incidents.vehicleId], references: [vehicles.id] }),
}));

export const certificationsRelations = relations(certifications, ({ one }) => ({
  user: one(users, { fields: [certifications.userId], references: [users.id] }),
}));

export const drugTestsRelations = relations(drugTests, ({ one }) => ({
  driver: one(users, { fields: [drugTests.driverId], references: [users.id] }),
  company: one(companies, { fields: [drugTests.companyId], references: [companies.id] }),
}));

export const safetyAlertsRelations = relations(safetyAlerts, ({ one }) => ({
  user: one(users, { fields: [safetyAlerts.userId], references: [users.id] }),
  load: one(loads, { fields: [safetyAlerts.loadId], references: [loads.id] }),
}));

export const speedEventsRelations = relations(speedEvents, ({ one }) => ({
  user: one(users, { fields: [speedEvents.userId], references: [users.id] }),
  load: one(loads, { fields: [speedEvents.loadId], references: [loads.id] }),
}));

export const complianceNetworkMembershipsRelations = relations(complianceNetworkMemberships, ({ one }) => ({
  company: one(companies, { fields: [complianceNetworkMemberships.companyId], references: [companies.id] }),
}));

// ═══════════════════════════════════════════════════════════════
// AGREEMENTS & CONTRACTS
// ═══════════════════════════════════════════════════════════════

export const agreementTemplatesRelations = relations(agreementTemplates, ({ one, many }) => ({
  ownerCompany: one(companies, { fields: [agreementTemplates.ownerCompanyId], references: [companies.id] }),
  ownerUser: one(users, { fields: [agreementTemplates.ownerUserId], references: [users.id] }),
  agreements: many(agreements),
}));

export const agreementsRelations = relations(agreements, ({ one, many }) => ({
  template: one(agreementTemplates, { fields: [agreements.templateId], references: [agreementTemplates.id] }),
  partyA: one(users, { fields: [agreements.partyAUserId], references: [users.id], relationName: "agreementPartyA" }),
  partyACompany: one(companies, { fields: [agreements.partyACompanyId], references: [companies.id], relationName: "agreementPartyACompany" }),
  partyB: one(users, { fields: [agreements.partyBUserId], references: [users.id], relationName: "agreementPartyB" }),
  partyBCompany: one(companies, { fields: [agreements.partyBCompanyId], references: [companies.id], relationName: "agreementPartyBCompany" }),
  rateSheetDocument: one(documents, { fields: [agreements.rateSheetDocumentId], references: [documents.id] }),
  signatures: many(agreementSignatures),
  amendments: many(agreementAmendments),
  documents: many(documents),
}));

export const agreementSignaturesRelations = relations(agreementSignatures, ({ one }) => ({
  agreement: one(agreements, { fields: [agreementSignatures.agreementId], references: [agreements.id] }),
  user: one(users, { fields: [agreementSignatures.userId], references: [users.id] }),
  company: one(companies, { fields: [agreementSignatures.companyId], references: [companies.id] }),
}));

export const agreementAmendmentsRelations = relations(agreementAmendments, ({ one }) => ({
  agreement: one(agreements, { fields: [agreementAmendments.agreementId], references: [agreements.id] }),
  proposedBy: one(users, { fields: [agreementAmendments.proposedBy], references: [users.id] }),
}));

// ═══════════════════════════════════════════════════════════════
// INSURANCE
// ═══════════════════════════════════════════════════════════════

export const insuranceProvidersRelations = relations(insuranceProviders, ({ many }) => ({
  policies: many(insurancePolicies),
  quotes: many(insuranceQuotes),
  loadInsurance: many(loadInsurance),
}));

export const insurancePoliciesRelations = relations(insurancePolicies, ({ one, many }) => ({
  company: one(companies, { fields: [insurancePolicies.companyId], references: [companies.id] }),
  provider: one(insuranceProviders, { fields: [insurancePolicies.providerId], references: [insuranceProviders.id] }),
  claims: many(insuranceClaims),
  alerts: many(insuranceAlerts),
}));

export const insuranceClaimsRelations = relations(insuranceClaims, ({ one }) => ({
  company: one(companies, { fields: [insuranceClaims.companyId], references: [companies.id] }),
  policy: one(insurancePolicies, { fields: [insuranceClaims.policyId], references: [insurancePolicies.id] }),
  load: one(loads, { fields: [insuranceClaims.loadId], references: [loads.id] }),
}));

export const loadInsuranceRelations = relations(loadInsurance, ({ one }) => ({
  load: one(loads, { fields: [loadInsurance.loadId], references: [loads.id] }),
  company: one(companies, { fields: [loadInsurance.companyId], references: [companies.id] }),
  provider: one(insuranceProviders, { fields: [loadInsurance.providerId], references: [insuranceProviders.id] }),
}));

// ═══════════════════════════════════════════════════════════════
// ZEUN MECHANICS
// ═══════════════════════════════════════════════════════════════

export const zeunBreakdownReportsRelations = relations(zeunBreakdownReports, ({ one, many }) => ({
  driver: one(users, { fields: [zeunBreakdownReports.driverId], references: [users.id] }),
  vehicle: one(vehicles, { fields: [zeunBreakdownReports.vehicleId], references: [vehicles.id] }),
  company: one(companies, { fields: [zeunBreakdownReports.companyId], references: [companies.id] }),
  load: one(loads, { fields: [zeunBreakdownReports.loadId], references: [loads.id] }),
  selectedProvider: one(zeunRepairProviders, { fields: [zeunBreakdownReports.selectedProviderId], references: [zeunRepairProviders.id] }),
  diagnostics: many(zeunDiagnosticResults),
  statusHistory: many(zeunBreakdownStatusHistory),
}));

export const zeunDiagnosticResultsRelations = relations(zeunDiagnosticResults, ({ one }) => ({
  breakdownReport: one(zeunBreakdownReports, { fields: [zeunDiagnosticResults.breakdownReportId], references: [zeunBreakdownReports.id] }),
}));

export const zeunRepairProvidersRelations = relations(zeunRepairProviders, ({ many }) => ({
  reviews: many(zeunProviderReviews),
  maintenanceLogs: many(zeunMaintenanceLogs),
}));

export const zeunProviderReviewsRelations = relations(zeunProviderReviews, ({ one }) => ({
  provider: one(zeunRepairProviders, { fields: [zeunProviderReviews.providerId], references: [zeunRepairProviders.id] }),
  user: one(users, { fields: [zeunProviderReviews.userId], references: [users.id] }),
  breakdownReport: one(zeunBreakdownReports, { fields: [zeunProviderReviews.breakdownReportId], references: [zeunBreakdownReports.id] }),
}));

export const zeunMaintenanceLogsRelations = relations(zeunMaintenanceLogs, ({ one }) => ({
  vehicle: one(vehicles, { fields: [zeunMaintenanceLogs.vehicleId], references: [vehicles.id] }),
  provider: one(zeunRepairProviders, { fields: [zeunMaintenanceLogs.providerId], references: [zeunRepairProviders.id] }),
  breakdownReport: one(zeunBreakdownReports, { fields: [zeunMaintenanceLogs.breakdownReportId], references: [zeunBreakdownReports.id] }),
}));

export const zeunMaintenanceSchedulesRelations = relations(zeunMaintenanceSchedules, ({ one }) => ({
  vehicle: one(vehicles, { fields: [zeunMaintenanceSchedules.vehicleId], references: [vehicles.id] }),
}));

export const zeunVehicleRecallsRelations = relations(zeunVehicleRecalls, ({ one }) => ({
  vehicle: one(vehicles, { fields: [zeunVehicleRecalls.vehicleId], references: [vehicles.id] }),
  completionProvider: one(zeunRepairProviders, { fields: [zeunVehicleRecalls.completionProviderId], references: [zeunRepairProviders.id] }),
}));

export const zeunBreakdownStatusHistoryRelations = relations(zeunBreakdownStatusHistory, ({ one }) => ({
  breakdownReport: one(zeunBreakdownReports, { fields: [zeunBreakdownStatusHistory.breakdownReportId], references: [zeunBreakdownReports.id] }),
  changedBy: one(users, { fields: [zeunBreakdownStatusHistory.changedByUserId], references: [users.id] }),
}));

// ═══════════════════════════════════════════════════════════════
// INTEGRATIONS
// ═══════════════════════════════════════════════════════════════

export const integrationProvidersRelations = relations(integrationProviders, ({ many }) => ({
  connections: many(integrationConnections),
}));

export const integrationConnectionsRelations = relations(integrationConnections, ({ one, many }) => ({
  company: one(companies, { fields: [integrationConnections.companyId], references: [companies.id] }),
  user: one(users, { fields: [integrationConnections.userId], references: [users.id] }),
  provider: one(integrationProviders, { fields: [integrationConnections.providerId], references: [integrationProviders.id] }),
  syncLogs: many(integrationSyncLogs),
  webhooks: many(integrationWebhooks),
}));

export const integrationSyncLogsRelations = relations(integrationSyncLogs, ({ one }) => ({
  connection: one(integrationConnections, { fields: [integrationSyncLogs.connectionId], references: [integrationConnections.id] }),
}));

export const integrationWebhooksRelations = relations(integrationWebhooks, ({ one }) => ({
  connection: one(integrationConnections, { fields: [integrationWebhooks.connectionId], references: [integrationConnections.id] }),
}));

// ═══════════════════════════════════════════════════════════════
// GAMIFICATION
// ═══════════════════════════════════════════════════════════════

export const gamificationProfilesRelations = relations(gamificationProfiles, ({ one }) => ({
  user: one(users, { fields: [gamificationProfiles.userId], references: [users.id] }),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  missions: many(missions),
}));

export const missionsRelations = relations(missions, ({ one, many }) => ({
  season: one(seasons, { fields: [missions.seasonId], references: [seasons.id] }),
  progress: many(missionProgress),
}));

export const missionProgressRelations = relations(missionProgress, ({ one }) => ({
  user: one(users, { fields: [missionProgress.userId], references: [users.id] }),
  mission: one(missions, { fields: [missionProgress.missionId], references: [missions.id] }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
  badge: one(badges, { fields: [userBadges.badgeId], references: [badges.id] }),
}));

export const rewardCratesRelations = relations(rewardCrates, ({ one }) => ({
  user: one(users, { fields: [rewardCrates.userId], references: [users.id] }),
}));

export const leaderboardsRelations = relations(leaderboards, ({ one }) => ({
  user: one(users, { fields: [leaderboards.userId], references: [users.id] }),
}));

export const guildsRelations = relations(guilds, ({ one, many }) => ({
  company: one(companies, { fields: [guilds.companyId], references: [companies.id] }),
  members: many(guildMembers),
}));

export const guildMembersRelations = relations(guildMembers, ({ one }) => ({
  guild: one(guilds, { fields: [guildMembers.guildId], references: [guilds.id] }),
  user: one(users, { fields: [guildMembers.userId], references: [users.id] }),
}));

export const rewardsRelations = relations(rewards, ({ one }) => ({
  user: one(users, { fields: [rewards.userId], references: [users.id] }),
}));

export const promoCodesRelations = relations(promoCodes, ({ many }) => ({
  usage: many(promoCodeUsage),
}));

export const promoCodeUsageRelations = relations(promoCodeUsage, ({ one }) => ({
  promoCode: one(promoCodes, { fields: [promoCodeUsage.promoCodeId], references: [promoCodes.id] }),
  user: one(users, { fields: [promoCodeUsage.userId], references: [users.id] }),
}));

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS & MISC
// ═══════════════════════════════════════════════════════════════

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, { fields: [notificationPreferences.userId], references: [users.id] }),
}));

export const pushTokensRelations = relations(pushTokens, ({ one }) => ({
  user: one(users, { fields: [pushTokens.userId], references: [users.id] }),
}));

export const smsMessagesRelations = relations(smsMessages, ({ one }) => ({
  user: one(users, { fields: [smsMessages.userId], references: [users.id] }),
}));

export const documentHashesRelations = relations(documentHashes, ({ one }) => ({
  user: one(users, { fields: [documentHashes.userId], references: [users.id] }),
}));

export const onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  user: one(users, { fields: [onboardingProgress.userId], references: [users.id] }),
}));

export const trainingModulesRelations = relations(trainingModules, ({ many }) => ({
  userTraining: many(userTraining),
}));

export const userTrainingRelations = relations(userTraining, ({ one }) => ({
  user: one(users, { fields: [userTraining.userId], references: [users.id] }),
  module: one(trainingModules, { fields: [userTraining.moduleId], references: [trainingModules.id] }),
}));

export const fuelTransactionsRelations = relations(fuelTransactions, ({ one }) => ({
  driver: one(users, { fields: [fuelTransactions.driverId], references: [users.id] }),
  vehicle: one(vehicles, { fields: [fuelTransactions.vehicleId], references: [vehicles.id] }),
  company: one(companies, { fields: [fuelTransactions.companyId], references: [companies.id] }),
}));

export const trainingRecordsRelations = relations(trainingRecords, ({ one }) => ({
  user: one(users, { fields: [trainingRecords.userId], references: [users.id] }),
  company: one(companies, { fields: [trainingRecords.companyId], references: [companies.id] }),
}));

export const supplyChainPartnershipsRelations = relations(supplyChainPartnerships, ({ one }) => ({
  fromCompany: one(companies, { fields: [supplyChainPartnerships.fromCompanyId], references: [companies.id], relationName: "partnershipFrom" }),
  toCompany: one(companies, { fields: [supplyChainPartnerships.toCompanyId], references: [companies.id], relationName: "partnershipTo" }),
  initiator: one(users, { fields: [supplyChainPartnerships.initiatorUserId], references: [users.id] }),
  terminal: one(terminals, { fields: [supplyChainPartnerships.terminalId], references: [terminals.id] }),
}));

export const dashboardLayoutsRelations = relations(dashboardLayouts, ({ one }) => ({
  user: one(users, { fields: [dashboardLayouts.userId], references: [users.id] }),
}));

export const widgetConfigurationsRelations = relations(widgetConfigurations, ({ one }) => ({
  user: one(users, { fields: [widgetConfigurations.userId], references: [users.id] }),
  widget: one(dashboardWidgets, { fields: [widgetConfigurations.widgetId], references: [dashboardWidgets.id] }),
}));

export const dashboardWidgetsRelations = relations(dashboardWidgets, ({ many }) => ({
  configurations: many(widgetConfigurations),
}));
