import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";

import APIDocumentation from "./pages/APIDocumentation";
import APIKeys from "./pages/APIKeys";
import APIManagement from "./pages/APIManagement";
import AccessorialCharges from "./pages/AccessorialCharges";
import AccidentInvestigation from "./pages/AccidentInvestigation";
import AccidentReport from "./pages/AccidentReport";
import AccidentReporting from "./pages/AccidentReporting";
import AccountDeletion from "./pages/AccountDeletion";
import AccountPreferences from "./pages/AccountPreferences";
import AccountSettings from "./pages/AccountSettings";
import AchievementsBadges from "./pages/AchievementsBadges";
import ActiveConvoys from "./pages/ActiveConvoys";
import ActiveLoads from "./pages/ActiveLoads";
import ActivityFeed from "./pages/ActivityFeed";
import ActivityTimeline from "./pages/ActivityTimeline";
import AdminAPIKeys from "./pages/AdminAPIKeys";
import AdminAPIUsage from "./pages/AdminAPIUsage";
import AdminAccessLogs from "./pages/AdminAccessLogs";
import AdminAnalyticsDashboard from "./pages/AdminAnalyticsDashboard";
import AdminAnnouncementCreate from "./pages/AdminAnnouncementCreate";
import AdminAnnouncementHistory from "./pages/AdminAnnouncementHistory";
import AdminApiManagement from "./pages/AdminApiManagement";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminAuditReports from "./pages/AdminAuditReports";
import AdminAuditTrail from "./pages/AdminAuditTrail";
import AdminBackgroundChecks from "./pages/AdminBackgroundChecks";
import AdminBackupSettings from "./pages/AdminBackupSettings";
import AdminBilling from "./pages/AdminBilling";
import AdminBillingDashboard from "./pages/AdminBillingDashboard";
import AdminBrokerApproval from "./pages/AdminBrokerApproval";
import AdminCacheMonitor from "./pages/AdminCacheMonitor";
import AdminCapacityReport from "./pages/AdminCapacityReport";
import AdminCarrierApproval from "./pages/AdminCarrierApproval";
import AdminChangelog from "./pages/AdminChangelog";
import AdminChargebacks from "./pages/AdminChargebacks";
import AdminClaimsManagement from "./pages/AdminClaimsManagement";
import AdminCommissionAdjustments from "./pages/AdminCommissionAdjustments";
import AdminCommunicationReports from "./pages/AdminCommunicationReports";
import AdminCompanyAudit from "./pages/AdminCompanyAudit";
import AdminCompanyBilling from "./pages/AdminCompanyBilling";
import AdminCompanyCreate from "./pages/AdminCompanyCreate";
import AdminCompanyDetails from "./pages/AdminCompanyDetails";
import AdminCompanyDirectory from "./pages/AdminCompanyDirectory";
import AdminCompanyDocuments from "./pages/AdminCompanyDocuments";
import AdminCompanyEdit from "./pages/AdminCompanyEdit";
import AdminCompanyFeatures from "./pages/AdminCompanyFeatures";
import AdminCompanyOnboarding from "./pages/AdminCompanyOnboarding";
import AdminCompanySettings from "./pages/AdminCompanySettings";
import AdminCompanySubscription from "./pages/AdminCompanySubscription";
import AdminCompanySuspension from "./pages/AdminCompanySuspension";
import AdminCompanyUsers from "./pages/AdminCompanyUsers";
import AdminCompanyVerification from "./pages/AdminCompanyVerification";
import AdminComplianceReports from "./pages/AdminComplianceReports";
import AdminContentManagement from "./pages/AdminContentManagement";
import AdminCustomReports from "./pages/AdminCustomReports";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDataExport from "./pages/AdminDataExport";
import AdminDatabaseMonitor from "./pages/AdminDatabaseMonitor";
import AdminDocumentVerification from "./pages/AdminDocumentVerification";
import AdminDriverApproval from "./pages/AdminDriverApproval";
import AdminEmailBlast from "./pages/AdminEmailBlast";
import AdminEmailHistory from "./pages/AdminEmailHistory";
import AdminEmailSettings from "./pages/AdminEmailSettings";
import AdminErrorMonitor from "./pages/AdminErrorMonitor";
import AdminFAQManagement from "./pages/AdminFAQManagement";
import AdminFeatureFlags from "./pages/AdminFeatureFlags";
import AdminFeatureToggles from "./pages/AdminFeatureToggles";
import AdminFinancialReports from "./pages/AdminFinancialReports";
import AdminFraudAlerts from "./pages/AdminFraudAlerts";
import AdminGlossary from "./pages/AdminGlossary";
import AdminHazmatVerification from "./pages/AdminHazmatVerification";
import AdminHelpArticles from "./pages/AdminHelpArticles";
import AdminIPWhitelist from "./pages/AdminIPWhitelist";
import AdminInsuranceVerification from "./pages/AdminInsuranceVerification";
import AdminIntegrationHub from "./pages/AdminIntegrationHub";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminInvoiceDetails from "./pages/AdminInvoiceDetails";
import AdminInvoices from "./pages/AdminInvoices";
import AdminLicenseVerification from "./pages/AdminLicenseVerification";
import AdminLoadAdjustments from "./pages/AdminLoadAdjustments";
import AdminLoadCancellations from "./pages/AdminLoadCancellations";
import AdminLoadDetails from "./pages/AdminLoadDetails";
import AdminLoadDisputes from "./pages/AdminLoadDisputes";
import AdminLoadManagement from "./pages/AdminLoadManagement";
import AdminMaintenanceMode from "./pages/AdminMaintenanceMode";
import AdminMarketAnalytics from "./pages/AdminMarketAnalytics";
import AdminMedicalVerification from "./pages/AdminMedicalVerification";
import AdminNotificationRules from "./pages/AdminNotificationRules";
import AdminNotificationTemplates from "./pages/AdminNotificationTemplates";
import AdminOnboardingFlows from "./pages/AdminOnboardingFlows";
import AdminOperationsReport from "./pages/AdminOperationsReport";
import AdminPasswordReset from "./pages/AdminPasswordReset";
import AdminPaymentDetails from "./pages/AdminPaymentDetails";
import AdminPaymentDisputes from "./pages/AdminPaymentDisputes";
import AdminPaymentGateways from "./pages/AdminPaymentGateways";
import AdminPayments from "./pages/AdminPayments";
import AdminPayoutSettings from "./pages/AdminPayoutSettings";
import AdminPerformanceMonitor from "./pages/AdminPerformanceMonitor";
import AdminPermissionMatrix from "./pages/AdminPermissionMatrix";
import AdminPlatformFeeOverrides from "./pages/AdminPlatformFeeOverrides";
import AdminPlatformFees from "./pages/AdminPlatformFees";
import AdminPricingTiers from "./pages/AdminPricingTiers";
import AdminPushNotifications from "./pages/AdminPushNotifications";
import AdminQueueMonitor from "./pages/AdminQueueMonitor";
import AdminRSSFeeds from "./pages/AdminRSSFeeds";
import AdminRateLimiting from "./pages/AdminRateLimiting";
import AdminRefunds from "./pages/AdminRefunds";
import AdminReleaseNotes from "./pages/AdminReleaseNotes";
import AdminReportGenerator from "./pages/AdminReportGenerator";
import AdminReportScheduler from "./pages/AdminReportScheduler";
import AdminReporting from "./pages/AdminReporting";
import AdminReportsDashboard from "./pages/AdminReportsDashboard";
import AdminRevenueReport from "./pages/AdminRevenueReport";
import AdminRoleManagement from "./pages/AdminRoleManagement";
import AdminSMSBlast from "./pages/AdminSMSBlast";
import AdminSMSHistory from "./pages/AdminSMSHistory";
import AdminSMSSettings from "./pages/AdminSMSSettings";
import AdminSafetyReports from "./pages/AdminSafetyReports";
import AdminSecurityAlerts from "./pages/AdminSecurityAlerts";
import AdminSecurityReports from "./pages/AdminSecurityReports";
import AdminShipperApproval from "./pages/AdminShipperApproval";
import AdminStorageSettings from "./pages/AdminStorageSettings";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminSupportAssignment from "./pages/AdminSupportAssignment";
import AdminSupportCannedResponses from "./pages/AdminSupportCannedResponses";
import AdminSupportChat from "./pages/AdminSupportChat";
import AdminSupportDashboard from "./pages/AdminSupportDashboard";
import AdminSupportEscalation from "./pages/AdminSupportEscalation";
import AdminSupportFAQ from "./pages/AdminSupportFAQ";
import AdminSupportKnowledgeBase from "./pages/AdminSupportKnowledgeBase";
import AdminSupportMetrics from "./pages/AdminSupportMetrics";
import AdminSupportReports from "./pages/AdminSupportReports";
import AdminSupportSLA from "./pages/AdminSupportSLA";
import AdminSupportTicketDetails from "./pages/AdminSupportTicketDetails";
import AdminSupportTickets from "./pages/AdminSupportTickets";
import AdminSystemHealth from "./pages/AdminSystemHealth";
import AdminSystemLogs from "./pages/AdminSystemLogs";
import AdminSystemMonitor from "./pages/AdminSystemMonitor";
import AdminSystemSettings from "./pages/AdminSystemSettings";
import AdminTelemetry from "./pages/AdminTelemetry";
import AdminTerminalApproval from "./pages/AdminTerminalApproval";
import AdminUserActivity from "./pages/AdminUserActivity";
import AdminUserBulkActions from "./pages/AdminUserBulkActions";
import AdminUserCreate from "./pages/AdminUserCreate";
import AdminUserDeletion from "./pages/AdminUserDeletion";
import AdminUserDetails from "./pages/AdminUserDetails";
import AdminUserDirectory from "./pages/AdminUserDirectory";
import AdminUserEdit from "./pages/AdminUserEdit";
import AdminUserExport from "./pages/AdminUserExport";
import AdminUserImpersonation from "./pages/AdminUserImpersonation";
import AdminUserImport from "./pages/AdminUserImport";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminUserMerge from "./pages/AdminUserMerge";
import AdminUserNotifications from "./pages/AdminUserNotifications";
import AdminUserOnboarding from "./pages/AdminUserOnboarding";
import AdminUserPermissions from "./pages/AdminUserPermissions";
import AdminUserPreferences from "./pages/AdminUserPreferences";
import AdminUserReports from "./pages/AdminUserReports";
import AdminUserRoles from "./pages/AdminUserRoles";
import AdminUserSessions from "./pages/AdminUserSessions";
import AdminUserSuspension from "./pages/AdminUserSuspension";
import AdminUserVerification from "./pages/AdminUserVerification";
import AdminVerificationDashboard from "./pages/AdminVerificationDashboard";
import AdminVideoTutorials from "./pages/AdminVideoTutorials";
import AdminWebhookManagement from "./pages/AdminWebhookManagement";
import AlertManagement from "./pages/AlertManagement";
import Analytics from "./pages/Analytics";
import Announcements from "./pages/Announcements";
import AppointmentScheduler from "./pages/AppointmentScheduler";
import AppointmentScheduling from "./pages/AppointmentScheduling";
import AssignedLoads from "./pages/AssignedLoads";
import AuditLog from "./pages/AuditLog";
import AuditLogs from "./pages/AuditLogs";
import Audits from "./pages/Audits";
import BOLGeneration from "./pages/BOLGeneration";
import BOLManagement from "./pages/BOLManagement";
import BackgroundChecks from "./pages/BackgroundChecks";
import BackupManagement from "./pages/BackupManagement";
import BenefitsManagement from "./pages/BenefitsManagement";
import BidAnalysis from "./pages/BidAnalysis";
import BidDetails from "./pages/BidDetails";
import BidHistory from "./pages/BidHistory";
import BidManagement from "./pages/BidManagement";
import Billing from "./pages/Billing";
import BillingHistory from "./pages/BillingHistory";
import BillingSettings from "./pages/BillingSettings";
import Bookmarks from "./pages/Bookmarks";
import BroadcastMessages from "./pages/BroadcastMessages";
import BrokerAgentScorecard from "./pages/BrokerAgentScorecard";
import BrokerAnalytics from "./pages/BrokerAnalytics";
import BrokerAutoBidding from "./pages/BrokerAutoBidding";
import BrokerBOLManagement from "./pages/BrokerBOLManagement";
import BrokerBidAnalytics from "./pages/BrokerBidAnalytics";
import BrokerBidComparison from "./pages/BrokerBidComparison";
import BrokerBidManagement from "./pages/BrokerBidManagement";
import BrokerBidNegotiation from "./pages/BrokerBidNegotiation";
import BrokerBillingDisputes from "./pages/BrokerBillingDisputes";
import BrokerBulkLoadUpload from "./pages/BrokerBulkLoadUpload";
import BrokerCapacityReport from "./pages/BrokerCapacityReport";
import BrokerCarrierBlacklist from "./pages/BrokerCarrierBlacklist";
import BrokerCarrierCapacity from "./pages/BrokerCarrierCapacity";
import BrokerCarrierCompliance from "./pages/BrokerCarrierCompliance";
import BrokerCarrierContracts from "./pages/BrokerCarrierContracts";
import BrokerCarrierCostAnalysis from "./pages/BrokerCarrierCostAnalysis";
import BrokerCarrierDocuments from "./pages/BrokerCarrierDocuments";
import BrokerCarrierInsurance from "./pages/BrokerCarrierInsurance";
import BrokerCarrierInvite from "./pages/BrokerCarrierInvite";
import BrokerCarrierNetwork from "./pages/BrokerCarrierNetwork";
import BrokerCarrierNotes from "./pages/BrokerCarrierNotes";
import BrokerCarrierOnboarding from "./pages/BrokerCarrierOnboarding";
import BrokerCarrierPayTerms from "./pages/BrokerCarrierPayTerms";
import BrokerCarrierPerformance from "./pages/BrokerCarrierPerformance";
import BrokerCarrierPreferred from "./pages/BrokerCarrierPreferred";
import BrokerCarrierPrequalification from "./pages/BrokerCarrierPrequalification";
import BrokerCarrierRatings from "./pages/BrokerCarrierRatings";
import BrokerCarrierScorecard from "./pages/BrokerCarrierScorecard";
import BrokerCarrierSearch from "./pages/BrokerCarrierSearch";
import BrokerCarrierTiers from "./pages/BrokerCarrierTiers";
import BrokerCarrierVetting from "./pages/BrokerCarrierVetting";
import BrokerCarriers from "./pages/BrokerCarriers";
import BrokerCashFlow from "./pages/BrokerCashFlow";
import BrokerCheckCalls from "./pages/BrokerCheckCalls";
import BrokerClaimsReport from "./pages/BrokerClaimsReport";
import BrokerCommissionDetail from "./pages/BrokerCommissionDetail";
import BrokerCommissionReport from "./pages/BrokerCommissionReport";
import BrokerCommissionSettings from "./pages/BrokerCommissionSettings";
import BrokerCompliance from "./pages/BrokerCompliance";
import BrokerContractQuotes from "./pages/BrokerContractQuotes";
import BrokerCounterOffers from "./pages/BrokerCounterOffers";
import BrokerCrossBorderLoads from "./pages/BrokerCrossBorderLoads";
import BrokerCustomReports from "./pages/BrokerCustomReports";
import BrokerCustomerBilling from "./pages/BrokerCustomerBilling";
import BrokerCustomerContracts from "./pages/BrokerCustomerContracts";
import BrokerCustomerCreditCheck from "./pages/BrokerCustomerCreditCheck";
import BrokerCustomerHistory from "./pages/BrokerCustomerHistory";
import BrokerCustomerManagement from "./pages/BrokerCustomerManagement";
import BrokerCustomerNotes from "./pages/BrokerCustomerNotes";
import BrokerCustomerOnboard from "./pages/BrokerCustomerOnboard";
import BrokerCustomerPortfolio from "./pages/BrokerCustomerPortfolio";
import BrokerCustomerProfitability from "./pages/BrokerCustomerProfitability";
import BrokerCustomerRating from "./pages/BrokerCustomerRating";
import BrokerCustomerReports from "./pages/BrokerCustomerReports";
import BrokerCustomerSearch from "./pages/BrokerCustomerSearch";
import BrokerDashboard from "./pages/BrokerDashboard";
import BrokerDispatchAssignment from "./pages/BrokerDispatchAssignment";
import BrokerDispatchBoard from "./pages/BrokerDispatchBoard";
import BrokerETAManagement from "./pages/BrokerETAManagement";
import BrokerExceptionAlerts from "./pages/BrokerExceptionAlerts";
import BrokerGoalTracking from "./pages/BrokerGoalTracking";
import BrokerHazmatLoads from "./pages/BrokerHazmatLoads";
import BrokerIncentivePrograms from "./pages/BrokerIncentivePrograms";
import BrokerInvoiceDetails from "./pages/BrokerInvoiceDetails";
import BrokerInvoiceGeneration from "./pages/BrokerInvoiceGeneration";
import BrokerInvoiceHistory from "./pages/BrokerInvoiceHistory";
import BrokerInvoiceQueue from "./pages/BrokerInvoiceQueue";
import BrokerLaneProfitability from "./pages/BrokerLaneProfitability";
import BrokerLaneRates from "./pages/BrokerLaneRates";
import BrokerLoadArchive from "./pages/BrokerLoadArchive";
import BrokerLoadAssignment from "./pages/BrokerLoadAssignment";
import BrokerLoadBoard from "./pages/BrokerLoadBoard";
import BrokerLoadCancellation from "./pages/BrokerLoadCancellation";
import BrokerLoadCloning from "./pages/BrokerLoadCloning";
import BrokerLoadConsolidation from "./pages/BrokerLoadConsolidation";
import BrokerLoadCreation from "./pages/BrokerLoadCreation";
import BrokerLoadMatching from "./pages/BrokerLoadMatching";
import BrokerLoadModification from "./pages/BrokerLoadModification";
import BrokerLoadPrioritization from "./pages/BrokerLoadPrioritization";
import BrokerLoadProfitability from "./pages/BrokerLoadProfitability";
import BrokerLoadSplit from "./pages/BrokerLoadSplit";
import BrokerLoadStatusBoard from "./pages/BrokerLoadStatusBoard";
import BrokerLoadTemplates from "./pages/BrokerLoadTemplates";
import BrokerMarginAnalysis from "./pages/BrokerMarginAnalysis";
import BrokerMarginReport from "./pages/BrokerMarginReport";
import BrokerMarketplace from "./pages/BrokerMarketplace";
import BrokerMultiStopLoads from "./pages/BrokerMultiStopLoads";
import BrokerOnTimeReport from "./pages/BrokerOnTimeReport";
import BrokerOversizedLoads from "./pages/BrokerOversizedLoads";
import BrokerPODManagement from "./pages/BrokerPODManagement";
import BrokerPayableDetails from "./pages/BrokerPayableDetails";
import BrokerPayablesAging from "./pages/BrokerPayablesAging";
import BrokerPayablesQueue from "./pages/BrokerPayablesQueue";
import BrokerPaymentProcessing from "./pages/BrokerPaymentProcessing";
import BrokerPayments from "./pages/BrokerPayments";
import BrokerProfitReport from "./pages/BrokerProfitReport";
import BrokerQuoteBuilder from "./pages/BrokerQuoteBuilder";
import BrokerRFPCreate from "./pages/BrokerRFPCreate";
import BrokerRFPManagement from "./pages/BrokerRFPManagement";
import BrokerRFPResponses from "./pages/BrokerRFPResponses";
import BrokerRateNegotiationHistory from "./pages/BrokerRateNegotiationHistory";
import BrokerReceivablesAging from "./pages/BrokerReceivablesAging";
import BrokerRecurringLoads from "./pages/BrokerRecurringLoads";
import BrokerReeferLoads from "./pages/BrokerReeferLoads";
import BrokerRevenueReport from "./pages/BrokerRevenueReport";
import BrokerServiceReport from "./pages/BrokerServiceReport";
import BrokerShipperManagement from "./pages/BrokerShipperManagement";
import BrokerSpotQuotes from "./pages/BrokerSpotQuotes";
import BrokerStatusUpdates from "./pages/BrokerStatusUpdates";
import BrokerTeamManagement from "./pages/BrokerTeamManagement";
import BrokerTeamPerformance from "./pages/BrokerTeamPerformance";
import BrokerTrackingDashboard from "./pages/BrokerTrackingDashboard";
import BrokerTrackingDetails from "./pages/BrokerTrackingDetails";
import BrokerTrendAnalysis from "./pages/BrokerTrendAnalysis";
import BrokerVolumeReport from "./pages/BrokerVolumeReport";
import CSAScores from "./pages/CSAScores";
import CSAScoresDashboard from "./pages/CSAScoresDashboard";
import CacheManagement from "./pages/CacheManagement";
import CapacityBoard from "./pages/CapacityBoard";
import CarrierAccessorials from "./pages/CarrierAccessorials";
import CarrierAnalytics from "./pages/CarrierAnalytics";
import CarrierAssetTracking from "./pages/CarrierAssetTracking";
import CarrierAuditPrep from "./pages/CarrierAuditPrep";
import CarrierAuthorityDocs from "./pages/CarrierAuthorityDocs";
import CarrierBackhaul from "./pages/CarrierBackhaul";
import CarrierBidHistory from "./pages/CarrierBidHistory";
import CarrierBidSubmission from "./pages/CarrierBidSubmission";
import CarrierBidSubmit from "./pages/CarrierBidSubmit";
import CarrierBidding from "./pages/CarrierBidding";
import CarrierCapacityBoard from "./pages/CarrierCapacityBoard";
import CarrierCapacityCalendar from "./pages/CarrierCapacityCalendar";
import CarrierCapacityManagement from "./pages/CarrierCapacityManagement";
import CarrierCapacityPosting from "./pages/CarrierCapacityPosting";
import CarrierCashFlow from "./pages/CarrierCashFlow";
import CarrierClaimsReport from "./pages/CarrierClaimsReport";
import CarrierCompliance from "./pages/CarrierCompliance";
import CarrierContractRates from "./pages/CarrierContractRates";
import CarrierCostPerMile from "./pages/CarrierCostPerMile";
import CarrierCustomReports from "./pages/CarrierCustomReports";
import CarrierDashboard from "./pages/CarrierDashboard";
import CarrierDeadheadMinimizer from "./pages/CarrierDeadheadMinimizer";
import CarrierDeadheadReport from "./pages/CarrierDeadheadReport";
import CarrierDetails from "./pages/CarrierDetails";
import CarrierDirectory from "./pages/CarrierDirectory";
import CarrierDispatchBoard from "./pages/CarrierDispatchBoard";
import CarrierDocumentVault from "./pages/CarrierDocumentVault";
import CarrierDriverAssignments from "./pages/CarrierDriverAssignments";
import CarrierDriverAvailability from "./pages/CarrierDriverAvailability";
import CarrierDriverCommunication from "./pages/CarrierDriverCommunication";
import CarrierDriverCompliance from "./pages/CarrierDriverCompliance";
import CarrierDriverDirectory from "./pages/CarrierDriverDirectory";
import CarrierDriverDocuments from "./pages/CarrierDriverDocuments";
import CarrierDriverManagement from "./pages/CarrierDriverManagement";
import CarrierDriverOnboard from "./pages/CarrierDriverOnboard";
import CarrierDriverPayroll from "./pages/CarrierDriverPayroll";
import CarrierDriverPerformance from "./pages/CarrierDriverPerformance";
import CarrierDriverSchedule from "./pages/CarrierDriverSchedule";
import CarrierDriverScoring from "./pages/CarrierDriverScoring";
import CarrierDriverSettlements from "./pages/CarrierDriverSettlements";
import CarrierDriverTermination from "./pages/CarrierDriverTermination";
import CarrierDriverTraining from "./pages/CarrierDriverTraining";
import CarrierDrugTesting from "./pages/CarrierDrugTesting";
import CarrierEquipmentAssignment from "./pages/CarrierEquipmentAssignment";
import CarrierEquipmentTypes from "./pages/CarrierEquipmentTypes";
import CarrierExpenseTracking from "./pages/CarrierExpenseTracking";
import CarrierFactoringSetup from "./pages/CarrierFactoringSetup";
import CarrierFleetManagement from "./pages/CarrierFleetManagement";
import CarrierFleetOverview from "./pages/CarrierFleetOverview";
import CarrierFuelManagement from "./pages/CarrierFuelManagement";
import CarrierFuelPurchases from "./pages/CarrierFuelPurchases";
import CarrierFuelSurcharge from "./pages/CarrierFuelSurcharge";
import CarrierIncidentLog from "./pages/CarrierIncidentLog";
import CarrierInspectionSchedule from "./pages/CarrierInspectionSchedule";
import CarrierInsurance from "./pages/CarrierInsurance";
import CarrierInsuranceCerts from "./pages/CarrierInsuranceCerts";
import CarrierInvoiceGeneration from "./pages/CarrierInvoiceGeneration";
import CarrierInvoiceHistory from "./pages/CarrierInvoiceHistory";
import CarrierInvoiceQueue from "./pages/CarrierInvoiceQueue";
import CarrierInvoicing from "./pages/CarrierInvoicing";
import CarrierLanePreferences from "./pages/CarrierLanePreferences";
import CarrierLoadAlerts from "./pages/CarrierLoadAlerts";
import CarrierLoadHistory from "./pages/CarrierLoadHistory";
import CarrierLoadMatching from "./pages/CarrierLoadMatching";
import CarrierLoadRecommendations from "./pages/CarrierLoadRecommendations";
import CarrierLoadSearch from "./pages/CarrierLoadSearch";
import CarrierLoadWatchlist from "./pages/CarrierLoadWatchlist";
import CarrierLostBids from "./pages/CarrierLostBids";
import CarrierMPGReport from "./pages/CarrierMPGReport";
import CarrierMaintenanceHistory from "./pages/CarrierMaintenanceHistory";
import CarrierMaintenanceSchedule from "./pages/CarrierMaintenanceSchedule";
import CarrierMultiLoadPlanning from "./pages/CarrierMultiLoadPlanning";
import CarrierOnTimeReport from "./pages/CarrierOnTimeReport";
import CarrierPackets from "./pages/CarrierPackets";
import CarrierPaymentTracking from "./pages/CarrierPaymentTracking";
import CarrierPermitCenter from "./pages/CarrierPermitCenter";
import CarrierProfile from "./pages/CarrierProfile";
import CarrierProfitLoss from "./pages/CarrierProfitLoss";
import CarrierProfitabilityAnalysis from "./pages/CarrierProfitabilityAnalysis";
import CarrierQuickPay from "./pages/CarrierQuickPay";
import CarrierQuickQuote from "./pages/CarrierQuickQuote";
import CarrierRateComparison from "./pages/CarrierRateComparison";
import CarrierRateHistory from "./pages/CarrierRateHistory";
import CarrierRateNegotiation from "./pages/CarrierRateNegotiation";
import CarrierReceivables from "./pages/CarrierReceivables";
import CarrierRepairOrders from "./pages/CarrierRepairOrders";
import CarrierRevenueReport from "./pages/CarrierRevenueReport";
import CarrierSafetyDashboard from "./pages/CarrierSafetyDashboard";
import CarrierSafetyScores from "./pages/CarrierSafetyScores";
import CarrierSavedSearches from "./pages/CarrierSavedSearches";
import CarrierScorecard from "./pages/CarrierScorecard";
import CarrierServiceAreas from "./pages/CarrierServiceAreas";
import CarrierSettlements from "./pages/CarrierSettlements";
import CarrierSpotRates from "./pages/CarrierSpotRates";
import CarrierTaxDocuments from "./pages/CarrierTaxDocuments";
import CarrierTollTracking from "./pages/CarrierTollTracking";
import CarrierTrailerAdd from "./pages/CarrierTrailerAdd";
import CarrierTrailerDetails from "./pages/CarrierTrailerDetails";
import CarrierTrailerInventory from "./pages/CarrierTrailerInventory";
import CarrierTrainingPrograms from "./pages/CarrierTrainingPrograms";
import CarrierTripOptimization from "./pages/CarrierTripOptimization";
import CarrierUtilizationReport from "./pages/CarrierUtilizationReport";
import CarrierVehicleAdd from "./pages/CarrierVehicleAdd";
import CarrierVehicleDetails from "./pages/CarrierVehicleDetails";
import CarrierVehicleInventory from "./pages/CarrierVehicleInventory";
import CarrierVendorManagement from "./pages/CarrierVendorManagement";
import CarrierVetting from "./pages/CarrierVetting";
import CarrierVettingDetails from "./pages/CarrierVettingDetails";
import CarrierWonLoads from "./pages/CarrierWonLoads";
import Carriers from "./pages/Carriers";
import CatalystAccessorialExceptions from "./pages/CatalystAccessorialExceptions";
import CatalystActiveLoads from "./pages/CatalystActiveLoads";
import CatalystAssetUtilization from "./pages/CatalystAssetUtilization";
import CatalystBreakdownResponse from "./pages/CatalystBreakdownResponse";
import CatalystBreakdownTracking from "./pages/CatalystBreakdownTracking";
import CatalystBroadcastCenter from "./pages/CatalystBroadcastCenter";
import CatalystCallLog from "./pages/CatalystCallLog";
import CatalystCapacityForecast from "./pages/CatalystCapacityForecast";
import CatalystCapacityPlanning from "./pages/CatalystCapacityPlanning";
import CatalystCarrierCapacity from "./pages/CatalystCarrierCapacity";
import CatalystCarrierComms from "./pages/CatalystCarrierComms";
import CatalystCommunicationCenter from "./pages/CatalystCommunicationCenter";
import CatalystCostOptimization from "./pages/CatalystCostOptimization";
import CatalystCustomReports from "./pages/CatalystCustomReports";
import CatalystCustomerComms from "./pages/CatalystCustomerComms";
import CatalystDamageExceptions from "./pages/CatalystDamageExceptions";
import CatalystDashboard from "./pages/CatalystDashboard";
import CatalystDelayExceptions from "./pages/CatalystDelayExceptions";
import CatalystDelayManagement from "./pages/CatalystDelayManagement";
import CatalystDemandPlanning from "./pages/CatalystDemandPlanning";
import CatalystDetentionTracking from "./pages/CatalystDetentionTracking";
import CatalystDispatchMessages from "./pages/CatalystDispatchMessages";
import CatalystDriverAssignment from "./pages/CatalystDriverAssignment";
import CatalystDriverAssist from "./pages/CatalystDriverAssist";
import CatalystDriverAvailability from "./pages/CatalystDriverAvailability";
import CatalystDriverBroadcast from "./pages/CatalystDriverBroadcast";
import CatalystDriverChat from "./pages/CatalystDriverChat";
import CatalystDriverCheckIn from "./pages/CatalystDriverCheckIn";
import CatalystDriverCommunication from "./pages/CatalystDriverCommunication";
import CatalystDriverDashboard from "./pages/CatalystDriverDashboard";
import CatalystDriverEscalation from "./pages/CatalystDriverEscalation";
import CatalystDriverHOS from "./pages/CatalystDriverHOS";
import CatalystDriverLocation from "./pages/CatalystDriverLocation";
import CatalystDriverMetrics from "./pages/CatalystDriverMetrics";
import CatalystDriverMetricsDashboard from "./pages/CatalystDriverMetricsDashboard";
import CatalystDriverPerformance from "./pages/CatalystDriverPerformance";
import CatalystDriverRelief from "./pages/CatalystDriverRelief";
import CatalystDriverScheduling from "./pages/CatalystDriverScheduling";
import CatalystDriverStatus from "./pages/CatalystDriverStatus";
import CatalystETABoard from "./pages/CatalystETABoard";
import CatalystEmergencyComms from "./pages/CatalystEmergencyComms";
import CatalystEmergencyResponse from "./pages/CatalystEmergencyResponse";
import CatalystEquipmentAssignment from "./pages/CatalystEquipmentAssignment";
import CatalystEquipmentStatus from "./pages/CatalystEquipmentStatus";
import CatalystExceptionDashboard from "./pages/CatalystExceptionDashboard";
import CatalystExceptionManagement from "./pages/CatalystExceptionManagement";
import CatalystExceptionMetrics from "./pages/CatalystExceptionMetrics";
import CatalystExceptionResolution from "./pages/CatalystExceptionResolution";
import CatalystExceptions from "./pages/CatalystExceptions";
import CatalystFleetMap from "./pages/CatalystFleetMap";
import CatalystFleetMetrics from "./pages/CatalystFleetMetrics";
import CatalystFleetStatus from "./pages/CatalystFleetStatus";
import CatalystFuelMonitoring from "./pages/CatalystFuelMonitoring";
import CatalystGeofenceAlerts from "./pages/CatalystGeofenceAlerts";
import CatalystInspectionStatus from "./pages/CatalystInspectionStatus";
import CatalystLoadBalancing from "./pages/CatalystLoadBalancing";
import CatalystLoadBoard from "./pages/CatalystLoadBoard";
import CatalystLoadMatching from "./pages/CatalystLoadMatching";
import CatalystLoadOptimization from "./pages/CatalystLoadOptimization";
import CatalystLoadPlanning from "./pages/CatalystLoadPlanning";
import CatalystLoadPriority from "./pages/CatalystLoadPriority";
import CatalystLoadSwap from "./pages/CatalystLoadSwap";
import CatalystLoadTimeline from "./pages/CatalystLoadTimeline";
import CatalystMaintenanceAlerts from "./pages/CatalystMaintenanceAlerts";
import CatalystMessageTemplates from "./pages/CatalystMessageTemplates";
import CatalystMilestoneTracking from "./pages/CatalystMilestoneTracking";
import CatalystOnTimeMetrics from "./pages/CatalystOnTimeMetrics";
import CatalystOperationsDashboard from "./pages/CatalystOperationsDashboard";
import CatalystOptimizationSuggestions from "./pages/CatalystOptimizationSuggestions";
import CatalystPerformance from "./pages/CatalystPerformance";
import CatalystPerformanceDashboard from "./pages/CatalystPerformanceDashboard";
import CatalystProductivityReport from "./pages/CatalystProductivityReport";
import CatalystRefusalExceptions from "./pages/CatalystRefusalExceptions";
import CatalystReliefDriver from "./pages/CatalystReliefDriver";
import CatalystReschedule from "./pages/CatalystReschedule";
import CatalystResourceAllocation from "./pages/CatalystResourceAllocation";
import CatalystRoutePlanning from "./pages/CatalystRoutePlanning";
import CatalystScenarioPlanning from "./pages/CatalystScenarioPlanning";
import CatalystShiftReport from "./pages/CatalystShiftReport";
import CatalystShortageExceptions from "./pages/CatalystShortageExceptions";
import CatalystTrafficMonitoring from "./pages/CatalystTrafficMonitoring";
import CatalystTrailerTracking from "./pages/CatalystTrailerTracking";
import CatalystVehicleTracking from "./pages/CatalystVehicleTracking";
import CatalystVoiceDispatch from "./pages/CatalystVoiceDispatch";
import CatalystWeatherMonitoring from "./pages/CatalystWeatherMonitoring";
import ChangePassword from "./pages/ChangePassword";
import Channels from "./pages/Channels";
import ClaimsManagement from "./pages/ClaimsManagement";
import Clearinghouse from "./pages/Clearinghouse";
import ClearinghouseDashboard from "./pages/ClearinghouseDashboard";
import ClearinghouseQueries from "./pages/ClearinghouseQueries";
import Commission from "./pages/Commission";
import CommissionTracking from "./pages/CommissionTracking";
import Companies from "./pages/Companies";
import Company from "./pages/Company";
import CompanyBilling from "./pages/CompanyBilling";
import CompanyChannels from "./pages/CompanyChannels";
import CompanyDocuments from "./pages/CompanyDocuments";
import CompanyManagement from "./pages/CompanyManagement";
import CompanyProfile from "./pages/CompanyProfile";
import CompanyVerification from "./pages/CompanyVerification";
import CompetitorAnalysis from "./pages/CompetitorAnalysis";
import ComplianceAccidentRegister from "./pages/ComplianceAccidentRegister";
import ComplianceApplicationReview from "./pages/ComplianceApplicationReview";
import ComplianceAuditChecklist from "./pages/ComplianceAuditChecklist";
import ComplianceAuditDashboard from "./pages/ComplianceAuditDashboard";
import ComplianceAuditFindings from "./pages/ComplianceAuditFindings";
import ComplianceAuditHistory from "./pages/ComplianceAuditHistory";
import ComplianceAuditReport from "./pages/ComplianceAuditReport";
import ComplianceAuditResponse from "./pages/ComplianceAuditResponse";
import ComplianceAuditSchedule from "./pages/ComplianceAuditSchedule";
import ComplianceAudits from "./pages/ComplianceAudits";
import ComplianceAuthorityStatus from "./pages/ComplianceAuthorityStatus";
import ComplianceCOIGeneration from "./pages/ComplianceCOIGeneration";
import ComplianceCSAMonitoring from "./pages/ComplianceCSAMonitoring";
import ComplianceCSARemediation from "./pages/ComplianceCSARemediation";
import ComplianceCalendar from "./pages/ComplianceCalendar";
import ComplianceCertificationRenewals from "./pages/ComplianceCertificationRenewals";
import ComplianceClearinghouse from "./pages/ComplianceClearinghouse";
import ComplianceClearinghouseQueries from "./pages/ComplianceClearinghouseQueries";
import ComplianceClearinghouseReporting from "./pages/ComplianceClearinghouseReporting";
import ComplianceCorrectiveActions from "./pages/ComplianceCorrectiveActions";
import ComplianceCustomReports from "./pages/ComplianceCustomReports";
import ComplianceDOTAuditPrep from "./pages/ComplianceDOTAuditPrep";
import ComplianceDQFile from "./pages/ComplianceDQFile";
import ComplianceDQFileArchive from "./pages/ComplianceDQFileArchive";
import ComplianceDQFileAudit from "./pages/ComplianceDQFileAudit";
import ComplianceDQFileBuilder from "./pages/ComplianceDQFileBuilder";
import ComplianceDQFileChecklist from "./pages/ComplianceDQFileChecklist";
import ComplianceDQFileDashboard from "./pages/ComplianceDQFileDashboard";
import ComplianceDQFileExpiring from "./pages/ComplianceDQFileExpiring";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import ComplianceDataQsChallenge from "./pages/ComplianceDataQsChallenge";
import ComplianceDriverQualification from "./pages/ComplianceDriverQualification";
import ComplianceDrugTestDashboard from "./pages/ComplianceDrugTestDashboard";
import ComplianceDrugTestSchedule from "./pages/ComplianceDrugTestSchedule";
import ComplianceDrugTesting from "./pages/ComplianceDrugTesting";
import ComplianceELDCompliance from "./pages/ComplianceELDCompliance";
import ComplianceEmploymentVerification from "./pages/ComplianceEmploymentVerification";
import ComplianceExpirationReport from "./pages/ComplianceExpirationReport";
import ComplianceFatalityReporting from "./pages/ComplianceFatalityReporting";
import ComplianceFollowUpTests from "./pages/ComplianceFollowUpTests";
import ComplianceFormMannerErrors from "./pages/ComplianceFormMannerErrors";
import ComplianceHOSDashboard from "./pages/ComplianceHOSDashboard";
import ComplianceHOSExceptions from "./pages/ComplianceHOSExceptions";
import ComplianceHOSReports from "./pages/ComplianceHOSReports";
import ComplianceHOSReview from "./pages/ComplianceHOSReview";
import ComplianceHOSTrends from "./pages/ComplianceHOSTrends";
import ComplianceHOSViolations from "./pages/ComplianceHOSViolations";
import ComplianceHazmatEndorsement from "./pages/ComplianceHazmatEndorsement";
import ComplianceInsuranceClaims from "./pages/ComplianceInsuranceClaims";
import ComplianceInsuranceDashboard from "./pages/ComplianceInsuranceDashboard";
import ComplianceInsuranceExpiring from "./pages/ComplianceInsuranceExpiring";
import ComplianceInsuranceTracking from "./pages/ComplianceInsuranceTracking";
import ComplianceInsuranceVerification from "./pages/ComplianceInsuranceVerification";
import ComplianceLogApproval from "./pages/ComplianceLogApproval";
import ComplianceLogAudits from "./pages/ComplianceLogAudits";
import ComplianceLogEditing from "./pages/ComplianceLogEditing";
import ComplianceMROResults from "./pages/ComplianceMROResults";
import ComplianceMVROrders from "./pages/ComplianceMVROrders";
import ComplianceMVRReview from "./pages/ComplianceMVRReview";
import ComplianceMedicalCertificates from "./pages/ComplianceMedicalCertificates";
import ComplianceMedicalExaminer from "./pages/ComplianceMedicalExaminer";
import ComplianceMockAudit from "./pages/ComplianceMockAudit";
import ComplianceOfficerDashboard from "./pages/ComplianceOfficerDashboard";
import CompliancePSPReview from "./pages/CompliancePSPReview";
import CompliancePermitDashboard from "./pages/CompliancePermitDashboard";
import CompliancePermitRenewals from "./pages/CompliancePermitRenewals";
import CompliancePermitTracking from "./pages/CompliancePermitTracking";
import CompliancePostAccidentTest from "./pages/CompliancePostAccidentTest";
import CompliancePreEmploymentTest from "./pages/CompliancePreEmploymentTest";
import CompliancePreviousEmployer from "./pages/CompliancePreviousEmployer";
import ComplianceRandomSelection from "./pages/ComplianceRandomSelection";
import ComplianceReasonableSuspicion from "./pages/ComplianceReasonableSuspicion";
import ComplianceReferenceChecks from "./pages/ComplianceReferenceChecks";
import ComplianceReportsDashboard from "./pages/ComplianceReportsDashboard";
import ComplianceReturnToDuty from "./pages/ComplianceReturnToDuty";
import ComplianceRiskAssessment from "./pages/ComplianceRiskAssessment";
import ComplianceRoadTestRecords from "./pages/ComplianceRoadTestRecords";
import ComplianceRoadsideInspections from "./pages/ComplianceRoadsideInspections";
import ComplianceSAPReferral from "./pages/ComplianceSAPReferral";
import ComplianceSafetyDashboard from "./pages/ComplianceSafetyDashboard";
import ComplianceSafetyPlans from "./pages/ComplianceSafetyPlans";
import ComplianceSafetyRatings from "./pages/ComplianceSafetyRatings";
import ComplianceStatusReport from "./pages/ComplianceStatusReport";
import ComplianceTSABackground from "./pages/ComplianceTSABackground";
import ComplianceTWICCards from "./pages/ComplianceTWICCards";
import ComplianceTrainingAssignment from "./pages/ComplianceTrainingAssignment";
import ComplianceTrainingCompletion from "./pages/ComplianceTrainingCompletion";
import ComplianceTrainingDashboard from "./pages/ComplianceTrainingDashboard";
import ComplianceTrainingRecords from "./pages/ComplianceTrainingRecords";
import ComplianceTrainingRecordsArchive from "./pages/ComplianceTrainingRecordsArchive";
import ComplianceTrainingReports from "./pages/ComplianceTrainingReports";
import ComplianceTrendAnalysis from "./pages/ComplianceTrendAnalysis";
import ComplianceUnidentifiedDriving from "./pages/ComplianceUnidentifiedDriving";
import ComplianceViolationReport from "./pages/ComplianceViolationReport";
import ComplianceViolationTracking from "./pages/ComplianceViolationTracking";
import ComponentShowcase from "./pages/ComponentShowcase";
import ConnectedApps from "./pages/ConnectedApps";
import ContentModeration from "./pages/ContentModeration";
import ContractManagement from "./pages/ContractManagement";
import CookiePolicy from "./pages/CookiePolicy";
import CreateLoad from "./pages/CreateLoad";
import CurrentJob from "./pages/CurrentJob";
import CustomerDirectory from "./pages/CustomerDirectory";
import CustomerFeedback from "./pages/CustomerFeedback";
import CustomerManagement from "./pages/CustomerManagement";
import DQFileManagement from "./pages/DQFileManagement";
import DVIR from "./pages/DVIR";
import DVIRManagement from "./pages/DVIRManagement";
import Dashboard from "./pages/Dashboard";
import DashboardCustomizer from "./pages/DashboardCustomizer";
import DataExport from "./pages/DataExport";
import DataExports from "./pages/DataExports";
import DataImport from "./pages/DataImport";
import DataRetention from "./pages/DataRetention";
import DatabaseHealth from "./pages/DatabaseHealth";
import DeadheadAnalysis from "./pages/DeadheadAnalysis";
import DetentionTracking from "./pages/DetentionTracking";
import Diagnostics from "./pages/Diagnostics";
import DigitalSignatures from "./pages/DigitalSignatures";
import DispatchAssignment from "./pages/DispatchAssignment";
import DispatchBoard from "./pages/DispatchBoard";
import DispatchDashboard from "./pages/DispatchDashboard";
import DisputeResolution from "./pages/DisputeResolution";
import DocumentCenter from "./pages/DocumentCenter";
import Documents from "./pages/Documents";
import DriverApplications from "./pages/DriverApplications";
import DriverAvailability from "./pages/DriverAvailability";
import DriverBOLSign from "./pages/DriverBOLSign";
import DriverBenefits from "./pages/DriverBenefits";
import DriverBreakdownReport from "./pages/DriverBreakdownReport";
import DriverCertificationHistory from "./pages/DriverCertificationHistory";
import DriverCheckIn from "./pages/DriverCheckIn";
import DriverCommunicationCenter from "./pages/DriverCommunicationCenter";
import DriverCompensation from "./pages/DriverCompensation";
import DriverCompliance from "./pages/DriverCompliance";
import DriverCurrentJob from "./pages/DriverCurrentJob";
import DriverDOTAudit from "./pages/DriverDOTAudit";
import DriverDashboard from "./pages/DriverDashboard";
import DriverDetails from "./pages/DriverDetails";
import DriverDirectory from "./pages/DriverDirectory";
import DriverDispatchContact from "./pages/DriverDispatchContact";
import DriverDocuments from "./pages/DriverDocuments";
import DriverEarnings from "./pages/DriverEarnings";
import DriverEmergencyContacts from "./pages/DriverEmergencyContacts";
import DriverEquipment from "./pages/DriverEquipment";
import DriverExpenseHistory from "./pages/DriverExpenseHistory";
import DriverExpenseReport from "./pages/DriverExpenseReport";
import DriverExpenseSubmit from "./pages/DriverExpenseSubmit";
import DriverFeedback from "./pages/DriverFeedback";
import DriverFuelLocator from "./pages/DriverFuelLocator";
import DriverFuelPurchase from "./pages/DriverFuelPurchase";
import DriverFuelStops from "./pages/DriverFuelStops";
import DriverHOS from "./pages/DriverHOS";
import DriverHOSDashboard from "./pages/DriverHOSDashboard";
import DriverHOSEdit from "./pages/DriverHOSEdit";
import DriverHOSLog from "./pages/DriverHOSLog";
import DriverHome from "./pages/DriverHome";
import DriverIncidentReportForm from "./pages/DriverIncidentReportForm";
import DriverInspectionForm from "./pages/DriverInspectionForm";
import DriverInspectionHistory from "./pages/DriverInspectionHistory";
import DriverIssueReport from "./pages/DriverIssueReport";
import DriverLoadAccept from "./pages/DriverLoadAccept";
import DriverLoadDetails from "./pages/DriverLoadDetails";
import DriverLoadHistory from "./pages/DriverLoadHistory";
import DriverLoadSearch from "./pages/DriverLoadSearch";
import DriverManagement from "./pages/DriverManagement";
import DriverMessages from "./pages/DriverMessages";
import DriverMobileApp from "./pages/DriverMobileApp";
import DriverNavigation from "./pages/DriverNavigation";
import DriverOnboarding from "./pages/DriverOnboarding";
import DriverPODCapture from "./pages/DriverPODCapture";
import DriverParking from "./pages/DriverParking";
import DriverPayStatementDetails from "./pages/DriverPayStatementDetails";
import DriverPayStatements from "./pages/DriverPayStatements";
import DriverPayroll from "./pages/DriverPayroll";
import DriverPerformance from "./pages/DriverPerformance";
import DriverPostTrip from "./pages/DriverPostTrip";
import DriverPreTrip from "./pages/DriverPreTrip";
import DriverPreTripInspection from "./pages/DriverPreTripInspection";
import DriverPreferences from "./pages/DriverPreferences";
import DriverRenewalReminders from "./pages/DriverRenewalReminders";
import DriverRestStops from "./pages/DriverRestStops";
import DriverRetirement from "./pages/DriverRetirement";
import DriverRouteOptimization from "./pages/DriverRouteOptimization";
import DriverSafetyAlerts from "./pages/DriverSafetyAlerts";
import DriverSafetyScorecard from "./pages/DriverSafetyScorecard";
import DriverScaleLocations from "./pages/DriverScaleLocations";
import DriverScorecard from "./pages/DriverScorecard";
import DriverScorecards from "./pages/DriverScorecards";
import DriverSettlement from "./pages/DriverSettlement";
import DriverStatus from "./pages/DriverStatus";
import DriverTaxInfo from "./pages/DriverTaxInfo";
import DriverTerminations from "./pages/DriverTerminations";
import DriverTimeOff from "./pages/DriverTimeOff";
import DriverTracking from "./pages/DriverTracking";
import DriverTraining from "./pages/DriverTraining";
import DriverTruckStops from "./pages/DriverTruckStops";
import DriverVehicle from "./pages/DriverVehicle";
import DriverWeatherAlerts from "./pages/DriverWeatherAlerts";
import Drivers from "./pages/Drivers";
import DrugAlcoholTesting from "./pages/DrugAlcoholTesting";
import EIAReporting from "./pages/EIAReporting";
import ELDIntegration from "./pages/ELDIntegration";
import ELDLogs from "./pages/ELDLogs";
import ERGGuide from "./pages/ERGGuide";
import ERGLookup from "./pages/ERGLookup";
import ESANGChat from "./pages/ESANGChat";
import Earnings from "./pages/Earnings";
import EmailLogs from "./pages/EmailLogs";
import EmailTemplates from "./pages/EmailTemplates";
import EmploymentHistory from "./pages/EmploymentHistory";
import EquipmentManagement from "./pages/EquipmentManagement";
import EquipmentTracking from "./pages/EquipmentTracking";
import Erg from "./pages/Erg";
import EmergencyAfterAction from "./pages/EmergencyAfterAction";
import EmergencyCommandCenter from "./pages/EmergencyCommandCenter";
import EmergencyDriverResponse from "./pages/EmergencyDriverResponse";
import EmergencyGovernmentLiaison from "./pages/EmergencyGovernmentLiaison";
import EmergencyMobilization from "./pages/EmergencyMobilization";
import EmergencyScenario from "./pages/EmergencyScenario";
import EmergencySupplyAnalysis from "./pages/EmergencySupplyAnalysis";
import ErrorLogs from "./pages/ErrorLogs";
import EscortActiveJobs from "./pages/EscortActiveJobs";
import EscortAuditPrep from "./pages/EscortAuditPrep";
import EscortAvailability from "./pages/EscortAvailability";
import EscortBridgeWeights from "./pages/EscortBridgeWeights";
import EscortCertificationRenewal from "./pages/EscortCertificationRenewal";
import EscortCertifications from "./pages/EscortCertifications";
import EscortClientManagement from "./pages/EscortClientManagement";
import EscortCommunications from "./pages/EscortCommunications";
import EscortComplianceCalendar from "./pages/EscortComplianceCalendar";
import EscortConvoyComm from "./pages/EscortConvoyComm";
import EscortConvoyPositioning from "./pages/EscortConvoyPositioning";
import EscortConvoyReport from "./pages/EscortConvoyReport";
import EscortConvoySetup from "./pages/EscortConvoySetup";
import EscortConvoyTracking from "./pages/EscortConvoyTracking";
import EscortDashboard from "./pages/EscortDashboard";
import EscortEarnings from "./pages/EscortEarnings";
import EscortEmergencyProtocol from "./pages/EscortEmergencyProtocol";
import EscortEquipmentCerts from "./pages/EscortEquipmentCerts";
import EscortEquipmentChecklist from "./pages/EscortEquipmentChecklist";
import EscortEquipmentInventory from "./pages/EscortEquipmentInventory";
import EscortEquipmentMaintenance from "./pages/EscortEquipmentMaintenance";
import EscortEquipmentManagement from "./pages/EscortEquipmentManagement";
import EscortEquipmentPurchase from "./pages/EscortEquipmentPurchase";
import EscortExpenseHistory from "./pages/EscortExpenseHistory";
import EscortExpenseSubmit from "./pages/EscortExpenseSubmit";
import EscortFlagOperations from "./pages/EscortFlagOperations";
import EscortHeightClearances from "./pages/EscortHeightClearances";
import EscortHeightPole from "./pages/EscortHeightPole";
import EscortIncidents from "./pages/EscortIncidents";
import EscortInsuranceDocs from "./pages/EscortInsuranceDocs";
import EscortInvoicing from "./pages/EscortInvoicing";
import EscortJobAcceptance from "./pages/EscortJobAcceptance";
import EscortJobBidding from "./pages/EscortJobBidding";
import EscortJobCalendar from "./pages/EscortJobCalendar";
import EscortJobDetails from "./pages/EscortJobDetails";
import EscortJobHistory from "./pages/EscortJobHistory";
import EscortJobMarketplace from "./pages/EscortJobMarketplace";
import EscortJobNegotiation from "./pages/EscortJobNegotiation";
import EscortJobSearch from "./pages/EscortJobSearch";
import EscortJobs from "./pages/EscortJobs";
import EscortLicenseRenewal from "./pages/EscortLicenseRenewal";
import EscortMileageTracking from "./pages/EscortMileageTracking";
import EscortObstructions from "./pages/EscortObstructions";
import EscortPayHistory from "./pages/EscortPayHistory";
import EscortPayStatements from "./pages/EscortPayStatements";
import EscortPermitTracking from "./pages/EscortPermitTracking";
import EscortPermits from "./pages/EscortPermits";
import EscortPreferences from "./pages/EscortPreferences";
import EscortRadioComms from "./pages/EscortRadioComms";
import EscortRecurringJobs from "./pages/EscortRecurringJobs";
import EscortReports from "./pages/EscortReports";
import EscortRouteBuilder from "./pages/EscortRouteBuilder";
import EscortRouteHistory from "./pages/EscortRouteHistory";
import EscortRouteNotes from "./pages/EscortRouteNotes";
import EscortRoutePlanning from "./pages/EscortRoutePlanning";
import EscortRouteSurvey from "./pages/EscortRouteSurvey";
import EscortSchedule from "./pages/EscortSchedule";
import EscortStateCerts from "./pages/EscortStateCerts";
import EscortTaxDocuments from "./pages/EscortTaxDocuments";
import EscortTrafficControl from "./pages/EscortTrafficControl";
import EscortTraining from "./pages/EscortTraining";
import EscortTurnRadius from "./pages/EscortTurnRadius";
import EscortUtilityLines from "./pages/EscortUtilityLines";
import EscortVehicleDocs from "./pages/EscortVehicleDocs";
import EscortVehicleInspection from "./pages/EscortVehicleInspection";
import EusoTicket from "./pages/EusoTicket";
import ExceptionManagement from "./pages/ExceptionManagement";
import ExpenseReports from "./pages/ExpenseReports";
import Facility from "./pages/Facility";
import FactoringACHSetup from "./pages/FactoringACHSetup";
import FactoringAccountSetup from "./pages/FactoringAccountSetup";
import FactoringAddBankAccount from "./pages/FactoringAddBankAccount";
import FactoringAgingReport from "./pages/FactoringAgingReport";
import FactoringAnalytics from "./pages/FactoringAnalytics";
import FactoringAnnualSummary from "./pages/FactoringAnnualSummary";
import FactoringApprovedInvoices from "./pages/FactoringApprovedInvoices";
import FactoringBOLUpload from "./pages/FactoringBOLUpload";
import FactoringBankAccounts from "./pages/FactoringBankAccounts";
import FactoringBulkUpload from "./pages/FactoringBulkUpload";
import FactoringCashFlow from "./pages/FactoringCashFlow";
import FactoringCollectionAgencies from "./pages/FactoringCollectionAgencies";
import FactoringCollectionDetails from "./pages/FactoringCollectionDetails";
import FactoringCollections from "./pages/FactoringCollections";
import FactoringComparisonTool from "./pages/FactoringComparisonTool";
import FactoringContactRep from "./pages/FactoringContactRep";
import FactoringContractRates from "./pages/FactoringContractRates";
import FactoringContractReview from "./pages/FactoringContractReview";
import FactoringCostAnalysis from "./pages/FactoringCostAnalysis";
import FactoringCreditApplication from "./pages/FactoringCreditApplication";
import FactoringCreditLine from "./pages/FactoringCreditLine";
import FactoringCustomReports from "./pages/FactoringCustomReports";
import FactoringDashboard from "./pages/FactoringDashboard";
import FactoringDebtorAging from "./pages/FactoringDebtorAging";
import FactoringDebtorApproval from "./pages/FactoringDebtorApproval";
import FactoringDebtorContact from "./pages/FactoringDebtorContact";
import FactoringDebtorCreditCheck from "./pages/FactoringDebtorCreditCheck";
import FactoringDebtorDetails from "./pages/FactoringDebtorDetails";
import FactoringDebtorManagement from "./pages/FactoringDebtorManagement";
import FactoringDebtorMonitoring from "./pages/FactoringDebtorMonitoring";
import FactoringDebtorNotes from "./pages/FactoringDebtorNotes";
import FactoringDebtorPaymentHistory from "./pages/FactoringDebtorPaymentHistory";
import FactoringDocumentCenter from "./pages/FactoringDocumentCenter";
import FactoringDunningLetters from "./pages/FactoringDunningLetters";
import FactoringExportData from "./pages/FactoringExportData";
import FactoringFeeDisputes from "./pages/FactoringFeeDisputes";
import FactoringFeeHistory from "./pages/FactoringFeeHistory";
import FactoringFeeSchedule from "./pages/FactoringFeeSchedule";
import FactoringFuelAdvance from "./pages/FactoringFuelAdvance";
import FactoringFuelAdvanceHistory from "./pages/FactoringFuelAdvanceHistory";
import FactoringFuelCardLink from "./pages/FactoringFuelCardLink";
import FactoringFuelCards from "./pages/FactoringFuelCards";
import FactoringFundedInvoices from "./pages/FactoringFundedInvoices";
import FactoringFundingSchedule from "./pages/FactoringFundingSchedule";
import FactoringIntegration from "./pages/FactoringIntegration";
import FactoringInvoiceCorrection from "./pages/FactoringInvoiceCorrection";
import FactoringInvoiceDetails from "./pages/FactoringInvoiceDetails";
import FactoringInvoiceDisputes from "./pages/FactoringInvoiceDisputes";
import FactoringInvoiceHistory from "./pages/FactoringInvoiceHistory";
import FactoringInvoiceMatching from "./pages/FactoringInvoiceMatching";
import FactoringInvoiceSubmit from "./pages/FactoringInvoiceSubmit";
import FactoringInvoiceValidation from "./pages/FactoringInvoiceValidation";
import FactoringLegalActions from "./pages/FactoringLegalActions";
import FactoringNoticeOfAssignment from "./pages/FactoringNoticeOfAssignment";
import FactoringNotifications from "./pages/FactoringNotifications";
import FactoringOnboarding from "./pages/FactoringOnboarding";
import FactoringOverdueInvoices from "./pages/FactoringOverdueInvoices";
import FactoringPODUpload from "./pages/FactoringPODUpload";
import FactoringPaymentMethods from "./pages/FactoringPaymentMethods";
import FactoringPaymentReminders from "./pages/FactoringPaymentReminders";
import FactoringPendingInvoices from "./pages/FactoringPendingInvoices";
import FactoringPerformanceReport from "./pages/FactoringPerformanceReport";
import FactoringProviderApplication from "./pages/FactoringProviderApplication";
import FactoringProviderComparison from "./pages/FactoringProviderComparison";
import FactoringProviderContract from "./pages/FactoringProviderContract";
import FactoringProviderDetails from "./pages/FactoringProviderDetails";
import FactoringProviderDirectory from "./pages/FactoringProviderDirectory";
import FactoringProviderFAQ from "./pages/FactoringProviderFAQ";
import FactoringProviderFees from "./pages/FactoringProviderFees";
import FactoringProviderIntegration from "./pages/FactoringProviderIntegration";
import FactoringProviderReviews from "./pages/FactoringProviderReviews";
import FactoringProviderServices from "./pages/FactoringProviderServices";
import FactoringProviderSupport from "./pages/FactoringProviderSupport";
import FactoringQuickPay from "./pages/FactoringQuickPay";
import FactoringQuickPayHistory from "./pages/FactoringQuickPayHistory";
import FactoringROICalculator from "./pages/FactoringROICalculator";
import FactoringRateCalculator from "./pages/FactoringRateCalculator";
import FactoringRateConUpload from "./pages/FactoringRateConUpload";
import FactoringRecoveries from "./pages/FactoringRecoveries";
import FactoringRejectedInvoices from "./pages/FactoringRejectedInvoices";
import FactoringReports from "./pages/FactoringReports";
import FactoringReserveAccount from "./pages/FactoringReserveAccount";
import FactoringServices from "./pages/FactoringServices";
import FactoringSettings from "./pages/FactoringSettings";
import FactoringStatementDetail from "./pages/FactoringStatementDetail";
import FactoringStatements from "./pages/FactoringStatements";
import FactoringSupport from "./pages/FactoringSupport";
import FactoringSwitchProvider from "./pages/FactoringSwitchProvider";
import FactoringTaxDocuments from "./pages/FactoringTaxDocuments";
import FactoringTermsConditions from "./pages/FactoringTermsConditions";
import FactoringTransactions from "./pages/FactoringTransactions";
import FactoringVolumeAnalysis from "./pages/FactoringVolumeAnalysis";
import FactoringVolumeDiscounts from "./pages/FactoringVolumeDiscounts";
import FactoringWireTransfers from "./pages/FactoringWireTransfers";
import FactoringWriteOffs from "./pages/FactoringWriteOffs";
import FeatureFlags from "./pages/FeatureFlags";
import FeatureRequests from "./pages/FeatureRequests";
import FeedbackSurveys from "./pages/FeedbackSurveys";
import FindLoads from "./pages/FindLoads";
import Fleet from "./pages/Fleet";
import FleetCompliance from "./pages/FleetCompliance";
import FleetInsurance from "./pages/FleetInsurance";
import FleetManagement from "./pages/FleetManagement";
import FleetMap from "./pages/FleetMap";
import FleetOverview from "./pages/FleetOverview";
import FleetTracking from "./pages/FleetTracking";
import FuelCardManagement from "./pages/FuelCardManagement";
import FuelManagement from "./pages/FuelManagement";
import FuelPrices from "./pages/FuelPrices";
import FuelTracking from "./pages/FuelTracking";
import GPSTracking from "./pages/GPSTracking";
import GeofenceManagement from "./pages/GeofenceManagement";
import GlobalSearch from "./pages/GlobalSearch";
import HOSCompliance from "./pages/HOSCompliance";
import HOSTracker from "./pages/HOSTracker";
import HazmatCertifications from "./pages/HazmatCertifications";
import HazmatShipments from "./pages/HazmatShipments";
import HelpCenter from "./pages/HelpCenter";
import Home from "./pages/Home";
import HotZones from "./pages/HotZones";
import IFTAReporting from "./pages/IFTAReporting";
import InTransit from "./pages/InTransit";
import IncidentReport from "./pages/IncidentReport";
import IncidentReporting from "./pages/IncidentReporting";
import IncomingShipments from "./pages/IncomingShipments";
import IndustryDirectory from "./pages/IndustryDirectory";
import InsuranceAgentContact from "./pages/InsuranceAgentContact";
import InsuranceAnalytics from "./pages/InsuranceAnalytics";
import InsuranceBenchmarking from "./pages/InsuranceBenchmarking";
import InsuranceCOIGeneration from "./pages/InsuranceCOIGeneration";
import InsuranceCOIManagement from "./pages/InsuranceCOIManagement";
import InsuranceCOIRequests from "./pages/InsuranceCOIRequests";
import InsuranceCOITracking from "./pages/InsuranceCOITracking";
import InsuranceCertificates from "./pages/InsuranceCertificates";
import InsuranceClaimDetails from "./pages/InsuranceClaimDetails";
import InsuranceClaimDocuments from "./pages/InsuranceClaimDocuments";
import InsuranceClaimTracking from "./pages/InsuranceClaimTracking";
import InsuranceClaimsFiling from "./pages/InsuranceClaimsFiling";
import InsuranceClaimsHistory from "./pages/InsuranceClaimsHistory";
import InsuranceComplianceReport from "./pages/InsuranceComplianceReport";
import InsuranceCoverageAnalysis from "./pages/InsuranceCoverageAnalysis";
import InsuranceDashboard from "./pages/InsuranceDashboard";
import InsuranceDocumentVault from "./pages/InsuranceDocumentVault";
import InsuranceEducation from "./pages/InsuranceEducation";
import InsuranceExpirationAlerts from "./pages/InsuranceExpirationAlerts";
import InsuranceFAQ from "./pages/InsuranceFAQ";
import InsuranceManagement from "./pages/InsuranceManagement";
import InsuranceMarketplace from "./pages/InsuranceMarketplace";
import InsurancePolicyApplication from "./pages/InsurancePolicyApplication";
import InsurancePolicyCancellation from "./pages/InsurancePolicyCancellation";
import InsurancePolicyComparison from "./pages/InsurancePolicyComparison";
import InsurancePolicyDetails from "./pages/InsurancePolicyDetails";
import InsurancePolicyManagement from "./pages/InsurancePolicyManagement";
import InsurancePolicyModification from "./pages/InsurancePolicyModification";
import InsurancePolicyRenewal from "./pages/InsurancePolicyRenewal";
import InsurancePolicySearch from "./pages/InsurancePolicySearch";
import InsurancePremiumAnalysis from "./pages/InsurancePremiumAnalysis";
import InsuranceProviderDetails from "./pages/InsuranceProviderDetails";
import InsuranceProviderDirectory from "./pages/InsuranceProviderDirectory";
import InsuranceProviderReviews from "./pages/InsuranceProviderReviews";
import InsuranceQuoteComparison from "./pages/InsuranceQuoteComparison";
import InsuranceQuoteRequest from "./pages/InsuranceQuoteRequest";
import InsuranceRiskManagement from "./pages/InsuranceRiskManagement";
import InsuranceRiskScoring from "./pages/InsuranceRiskScoring";
import IntegrationAPIKeySetup from "./pages/IntegrationAPIKeySetup";
import IntegrationAPITesting from "./pages/IntegrationAPITesting";
import IntegrationAccountingSetup from "./pages/IntegrationAccountingSetup";
import IntegrationAccountingStatus from "./pages/IntegrationAccountingStatus";
import IntegrationAlerts from "./pages/IntegrationAlerts";
import IntegrationBISetup from "./pages/IntegrationBISetup";
import IntegrationBackgroundCheckSetup from "./pages/IntegrationBackgroundCheckSetup";
import IntegrationCertification from "./pages/IntegrationCertification";
import IntegrationCustomAPI from "./pages/IntegrationCustomAPI";
import IntegrationDataWarehouse from "./pages/IntegrationDataWarehouse";
import IntegrationDetails from "./pages/IntegrationDetails";
import IntegrationDirectory from "./pages/IntegrationDirectory";
import IntegrationDocumentSetup from "./pages/IntegrationDocumentSetup";
import IntegrationDocumentation from "./pages/IntegrationDocumentation";
import IntegrationDrugTestSetup from "./pages/IntegrationDrugTestSetup";
import IntegrationELDSetup from "./pages/IntegrationELDSetup";
import IntegrationELDStatus from "./pages/IntegrationELDStatus";
import IntegrationERPSetup from "./pages/IntegrationERPSetup";
import IntegrationERPStatus from "./pages/IntegrationERPStatus";
import IntegrationEmailSetup from "./pages/IntegrationEmailSetup";
import IntegrationFactoringSetup from "./pages/IntegrationFactoringSetup";
import IntegrationFieldMapping from "./pages/IntegrationFieldMapping";
import IntegrationFuelCardSetup from "./pages/IntegrationFuelCardSetup";
import IntegrationFuelCardStatus from "./pages/IntegrationFuelCardStatus";
import IntegrationGPSSetup from "./pages/IntegrationGPSSetup";
import IntegrationGPSStatus from "./pages/IntegrationGPSStatus";
import IntegrationHub from "./pages/IntegrationHub";
import IntegrationInsuranceSetup from "./pages/IntegrationInsuranceSetup";
import IntegrationLogs from "./pages/IntegrationLogs";
import IntegrationMappingSetup from "./pages/IntegrationMappingSetup";
import IntegrationMarketplace from "./pages/IntegrationMarketplace";
import IntegrationMonitoring from "./pages/IntegrationMonitoring";
import IntegrationNotificationSetup from "./pages/IntegrationNotificationSetup";
import IntegrationOAuthFlow from "./pages/IntegrationOAuthFlow";
import IntegrationPartnerPortal from "./pages/IntegrationPartnerPortal";
import IntegrationPaymentSetup from "./pages/IntegrationPaymentSetup";
import IntegrationPublish from "./pages/IntegrationPublish";
import IntegrationReviews from "./pages/IntegrationReviews";
import IntegrationSDKDownload from "./pages/IntegrationSDKDownload";
import IntegrationSMSSetup from "./pages/IntegrationSMSSetup";
import IntegrationSandbox from "./pages/IntegrationSandbox";
import IntegrationSettings from "./pages/IntegrationSettings";
import IntegrationSetup from "./pages/IntegrationSetup";
import IntegrationStorageSetup from "./pages/IntegrationStorageSetup";
import IntegrationSupport from "./pages/IntegrationSupport";
import IntegrationSyncErrors from "./pages/IntegrationSyncErrors";
import IntegrationSyncHistory from "./pages/IntegrationSyncHistory";
import IntegrationSyncSettings from "./pages/IntegrationSyncSettings";
import IntegrationSyncStatus from "./pages/IntegrationSyncStatus";
import IntegrationTMSSetup from "./pages/IntegrationTMSSetup";
import IntegrationTMSStatus from "./pages/IntegrationTMSStatus";
import IntegrationTestingTools from "./pages/IntegrationTestingTools";
import IntegrationTrainingSetup from "./pages/IntegrationTrainingSetup";
import IntegrationWeatherSetup from "./pages/IntegrationWeatherSetup";
import IntegrationWebhookLogs from "./pages/IntegrationWebhookLogs";
import IntegrationWebhooks from "./pages/IntegrationWebhooks";
import InvoiceDetails from "./pages/InvoiceDetails";
import InvoiceManagement from "./pages/InvoiceManagement";
import Jobs from "./pages/Jobs";
import KnowledgeBase from "./pages/KnowledgeBase";
import LaneAnalysis from "./pages/LaneAnalysis";
import LaneRates from "./pages/LaneRates";
import Leaderboard from "./pages/Leaderboard";
import LicenseManagement from "./pages/LicenseManagement";
import LiveChat from "./pages/LiveChat";
import LiveNewsFeed from "./pages/LiveNewsFeed";
import LoadAcceptance from "./pages/LoadAcceptance";
import LoadAccessorials from "./pages/LoadAccessorials";
import LoadAuction from "./pages/LoadAuction";
import LoadAutomatedBidding from "./pages/LoadAutomatedBidding";
import LoadBOLGeneration from "./pages/LoadBOLGeneration";
import LoadBOLSigning from "./pages/LoadBOLSigning";
import LoadBiddingStrategy from "./pages/LoadBiddingStrategy";
import LoadBids from "./pages/LoadBids";
import LoadBoard from "./pages/LoadBoard";
import LoadBulkUpload from "./pages/LoadBulkUpload";
import LoadCancellation from "./pages/LoadCancellation";
import LoadCapacityForecast from "./pages/LoadCapacityForecast";
import LoadCapacityMatching from "./pages/LoadCapacityMatching";
import LoadCarrierPerformance from "./pages/LoadCarrierPerformance";
import LoadCarrierRecommendation from "./pages/LoadCarrierRecommendation";
import LoadCarrierSelection from "./pages/LoadCarrierSelection";
import LoadClaimDetails from "./pages/LoadClaimDetails";
import LoadClaimDocuments from "./pages/LoadClaimDocuments";
import LoadClaims from "./pages/LoadClaims";
import LoadConsolidation from "./pages/LoadConsolidation";
import LoadContractLanes from "./pages/LoadContractLanes";
import LoadContractManagement from "./pages/LoadContractManagement";
import LoadConvoySetup from "./pages/LoadConvoySetup";
import LoadCostBreakdown from "./pages/LoadCostBreakdown";
import LoadCreate from "./pages/LoadCreate";
import LoadCreationWizard from "./pages/LoadCreationWizard";
import LoadCrossBorder from "./pages/LoadCrossBorder";
import LoadDelayManagement from "./pages/LoadDelayManagement";
import LoadDeliveryConfirmation from "./pages/LoadDeliveryConfirmation";
import LoadDemandForecast from "./pages/LoadDemandForecast";
import LoadDetails from "./pages/LoadDetails";
import LoadDetentionCalculator from "./pages/LoadDetentionCalculator";
import LoadDetentionTracking from "./pages/LoadDetentionTracking";
import LoadDispatchConfirmation from "./pages/LoadDispatchConfirmation";
import LoadDriverAssignment from "./pages/LoadDriverAssignment";
import LoadDriverPerformance from "./pages/LoadDriverPerformance";
import LoadEquipmentAssignment from "./pages/LoadEquipmentAssignment";
import LoadEscalation from "./pages/LoadEscalation";
import LoadExceptionHandling from "./pages/LoadExceptionHandling";
import LoadForecast from "./pages/LoadForecast";
import LoadHazmatDocuments from "./pages/LoadHazmatDocuments";
import LoadHistory from "./pages/LoadHistory";
import LoadInTransitTracking from "./pages/LoadInTransitTracking";
import LoadInvoiceGeneration from "./pages/LoadInvoiceGeneration";
import LoadInvoiceReview from "./pages/LoadInvoiceReview";
import LoadLaneAnalysis from "./pages/LoadLaneAnalysis";
import LoadLayoverTracking from "./pages/LoadLayoverTracking";
import LoadMarginAnalysis from "./pages/LoadMarginAnalysis";
import LoadMultiStop from "./pages/LoadMultiStop";
import LoadNegotiation from "./pages/LoadNegotiation";
import LoadOnTimeAnalysis from "./pages/LoadOnTimeAnalysis";
import LoadPODCapture from "./pages/LoadPODCapture";
import LoadPODReview from "./pages/LoadPODReview";
import LoadPaymentTracking from "./pages/LoadPaymentTracking";
import LoadPermitRequirements from "./pages/LoadPermitRequirements";
import LoadPickupConfirmation from "./pages/LoadPickupConfirmation";
import LoadPricingOptimization from "./pages/LoadPricingOptimization";
import LoadProfitAnalysis from "./pages/LoadProfitAnalysis";
import LoadRFPBuilder from "./pages/LoadRFPBuilder";
import LoadRFPResponse from "./pages/LoadRFPResponse";
import LoadRateHistory from "./pages/LoadRateHistory";
import LoadRateNegotiation from "./pages/LoadRateNegotiation";
import LoadReassignment from "./pages/LoadReassignment";
import LoadRecurringSetup from "./pages/LoadRecurringSetup";
import LoadReporting from "./pages/LoadReporting";
import LoadRerouting from "./pages/LoadRerouting";
import LoadRouteOptimization from "./pages/LoadRouteOptimization";
import LoadSettlement from "./pages/LoadSettlement";
import LoadSplit from "./pages/LoadSplit";
import LoadSpotMarket from "./pages/LoadSpotMarket";
import LoadStatusBoard from "./pages/LoadStatusBoard";
import LoadSwap from "./pages/LoadSwap";
import LoadTANUTracking from "./pages/LoadTANUTracking";
import LoadTemplateManager from "./pages/LoadTemplateManager";
import LoadTenderManagement from "./pages/LoadTenderManagement";
import LoadTracking from "./pages/LoadTracking";
import LoadTrendAnalysis from "./pages/LoadTrendAnalysis";
import LoadWizard from "./pages/LoadWizard";
import LoadingBays from "./pages/LoadingBays";
import Login from "./pages/Login";
import LoginHistory from "./pages/LoginHistory";
import MVRReports from "./pages/MVRReports";
import Maintenance from "./pages/Maintenance";
import MaintenanceSchedule from "./pages/MaintenanceSchedule";
import MarketIntelligence from "./pages/MarketIntelligence";
import MarketPricingDashboard from "./pages/MarketPricingDashboard";
import Marketplace from "./pages/Marketplace";
import MatchedLoads from "./pages/MatchedLoads";
import MedicalCertifications from "./pages/MedicalCertifications";
import Messages from "./pages/Messages";
import MessagingArchive from "./pages/MessagingArchive";
import MessagingBlocked from "./pages/MessagingBlocked";
import MessagingBroadcast from "./pages/MessagingBroadcast";
import MessagingCallHistory from "./pages/MessagingCallHistory";
import MessagingCarrierChannel from "./pages/MessagingCarrierChannel";
import MessagingCenter from "./pages/MessagingCenter";
import MessagingCompose from "./pages/MessagingCompose";
import MessagingContactDirectory from "./pages/MessagingContactDirectory";
import MessagingCustomerChannel from "./pages/MessagingCustomerChannel";
import MessagingDispatchChannel from "./pages/MessagingDispatchChannel";
import MessagingDocumentSharing from "./pages/MessagingDocumentSharing";
import MessagingDriverChannel from "./pages/MessagingDriverChannel";
import MessagingETASharing from "./pages/MessagingETASharing";
import MessagingEmergencyChannel from "./pages/MessagingEmergencyChannel";
import MessagingEmoji from "./pages/MessagingEmoji";
import MessagingExport from "./pages/MessagingExport";
import MessagingFavorites from "./pages/MessagingFavorites";
import MessagingFileSharing from "./pages/MessagingFileSharing";
import MessagingGroupCreate from "./pages/MessagingGroupCreate";
import MessagingGroupManagement from "./pages/MessagingGroupManagement";
import MessagingInChatPayment from "./pages/MessagingInChatPayment";
import MessagingInbox from "./pages/MessagingInbox";
import MessagingLocationSharing from "./pages/MessagingLocationSharing";
import MessagingMuted from "./pages/MessagingMuted";
import MessagingNotifications from "./pages/MessagingNotifications";
import MessagingReadReceipts from "./pages/MessagingReadReceipts";
import MessagingScheduled from "./pages/MessagingScheduled";
import MessagingSearch from "./pages/MessagingSearch";
import MessagingSettings from "./pages/MessagingSettings";
import MessagingStarred from "./pages/MessagingStarred";
import MessagingStatusUpdates from "./pages/MessagingStatusUpdates";
import MessagingTemplates from "./pages/MessagingTemplates";
import MessagingThreadView from "./pages/MessagingThreadView";
import MessagingTranslation from "./pages/MessagingTranslation";
import MessagingTypingIndicators from "./pages/MessagingTypingIndicators";
import MessagingVideoCall from "./pages/MessagingVideoCall";
import MessagingVoiceMessage from "./pages/MessagingVoiceMessage";
import MileageCalculator from "./pages/MileageCalculator";
import Missions from "./pages/Missions";
import MyLoads from "./pages/MyLoads";
import NavigationBreadcrumbTrail from "./pages/NavigationBreadcrumbTrail";
import NavigationFuelOptimization from "./pages/NavigationFuelOptimization";
import NavigationHOSRouting from "./pages/NavigationHOSRouting";
import NavigationHazmatRouting from "./pages/NavigationHazmatRouting";
import NavigationHeightClearance from "./pages/NavigationHeightClearance";
import NavigationHistoricalRoutes from "./pages/NavigationHistoricalRoutes";
import NavigationHome from "./pages/NavigationHome";
import NavigationMultiStop from "./pages/NavigationMultiStop";
import NavigationPlayback from "./pages/NavigationPlayback";
import NavigationRouteOptions from "./pages/NavigationRouteOptions";
import NavigationTollOptimization from "./pages/NavigationTollOptimization";
import NavigationTrafficRouting from "./pages/NavigationTrafficRouting";
import NavigationTruckRouting from "./pages/NavigationTruckRouting";
import NavigationWeatherRouting from "./pages/NavigationWeatherRouting";
import NavigationWeightRestrictions from "./pages/NavigationWeightRestrictions";
import NewsFeed from "./pages/NewsFeed";
import NotificationCenter from "./pages/NotificationCenter";
import NotificationSettings from "./pages/NotificationSettings";
import Notifications from "./pages/Notifications";
import NotificationsCenter from "./pages/NotificationsCenter";
import OnTimePerformance from "./pages/OnTimePerformance";
import Onboarding from "./pages/Onboarding";
import OnboardingCompanySetup from "./pages/OnboardingCompanySetup";
import OnboardingDocuments from "./pages/OnboardingDocuments";
import Opportunities from "./pages/Opportunities";
import OutgoingShipments from "./pages/OutgoingShipments";
import PODManagement from "./pages/PODManagement";
import PSPReports from "./pages/PSPReports";
import PasswordChange from "./pages/PasswordChange";
import PaymentHistory from "./pages/PaymentHistory";
import PaymentMethods from "./pages/PaymentMethods";
import PaymentProcessing from "./pages/PaymentProcessing";
import Payments from "./pages/Payments";
import PayrollManagement from "./pages/PayrollManagement";
import PerformanceMonitor from "./pages/PerformanceMonitor";
import PerformanceReports from "./pages/PerformanceReports";
import PerformanceReviews from "./pages/PerformanceReviews";
import PermitManagement from "./pages/PermitManagement";
import PermitRequirements from "./pages/PermitRequirements";
import Permits from "./pages/Permits";
import PlatformAnalytics from "./pages/PlatformAnalytics";
import PlatformHealth from "./pages/PlatformHealth";
import PreTripChecklist from "./pages/PreTripChecklist";
import PreTripInspection from "./pages/PreTripInspection";
import Preferences from "./pages/Preferences";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Procedures from "./pages/Procedures";
import Profile from "./pages/Profile";
import PushNotifications from "./pages/PushNotifications";
import QueueMonitor from "./pages/QueueMonitor";
import QuickActions from "./pages/QuickActions";
import QuoteManagement from "./pages/QuoteManagement";
import QuoteRequests from "./pages/QuoteRequests";
import RackStatus from "./pages/RackStatus";
import RateCalculator from "./pages/RateCalculator";
import RateConfirmationSign from "./pages/RateConfirmationSign";
import RateConfirmations from "./pages/RateConfirmations";
import RateLimiting from "./pages/RateLimiting";
import RateManagement from "./pages/RateManagement";
import ReferralProgram from "./pages/ReferralProgram";
import Register from "./pages/Register";
import RegisterBroker from "./pages/RegisterBroker";
import RegisterCarrier from "./pages/RegisterCarrier";
import RegisterCatalyst from "./pages/RegisterCatalyst";
import RegisterCompliance from "./pages/RegisterCompliance";
import RegisterDriver from "./pages/RegisterDriver";
import RegisterEscort from "./pages/RegisterEscort";
import RegisterSafety from "./pages/RegisterSafety";
import RegisterShipper from "./pages/RegisterShipper";
import RegisterTerminal from "./pages/RegisterTerminal";
import ReleaseNotes from "./pages/ReleaseNotes";
import ReportBuilder from "./pages/ReportBuilder";
import ReportingDashboard from "./pages/ReportingDashboard";
import RestStops from "./pages/RestStops";
import RevenueAnalytics from "./pages/RevenueAnalytics";
import Rewards from "./pages/Rewards";
import RewardsCenter from "./pages/RewardsCenter";
import RoadTestRecords from "./pages/RoadTestRecords";
import RolePermissions from "./pages/RolePermissions";
import RoutePlanning from "./pages/RoutePlanning";
import RunTickets from "./pages/RunTickets";
import SAFERLookup from "./pages/SAFERLookup";
import SCADA from "./pages/SCADA";
import SCADAMonitor from "./pages/SCADAMonitor";
import SMSNotifications from "./pages/SMSNotifications";
import SafetyAccidentCreate from "./pages/SafetyAccidentCreate";
import SafetyAccidentDOTReporting from "./pages/SafetyAccidentDOTReporting";
import SafetyAccidentDashboard from "./pages/SafetyAccidentDashboard";
import SafetyAccidentDetails from "./pages/SafetyAccidentDetails";
import SafetyAccidentDiagram from "./pages/SafetyAccidentDiagram";
import SafetyAccidentInsuranceClaim from "./pages/SafetyAccidentInsuranceClaim";
import SafetyAccidentInvestigation from "./pages/SafetyAccidentInvestigation";
import SafetyAccidentLessonsLearned from "./pages/SafetyAccidentLessonsLearned";
import SafetyAccidentPhotos from "./pages/SafetyAccidentPhotos";
import SafetyAccidentPoliceReport from "./pages/SafetyAccidentPoliceReport";
import SafetyAccidentPreventability from "./pages/SafetyAccidentPreventability";
import SafetyAccidentReports from "./pages/SafetyAccidentReports";
import SafetyAccidentWitness from "./pages/SafetyAccidentWitness";
import SafetyAuditFindings from "./pages/SafetyAuditFindings";
import SafetyAuditPreparation from "./pages/SafetyAuditPreparation";
import SafetyBenchmarking from "./pages/SafetyBenchmarking";
import SafetyCSAAlerts from "./pages/SafetyCSAAlerts";
import SafetyCSABasics from "./pages/SafetyCSABasics";
import SafetyCSADashboard from "./pages/SafetyCSADashboard";
import SafetyCSADataQs from "./pages/SafetyCSADataQs";
import SafetyCSAInspections from "./pages/SafetyCSAInspections";
import SafetyCSAMonitoring from "./pages/SafetyCSAMonitoring";
import SafetyCSARemediation from "./pages/SafetyCSARemediation";
import SafetyCSAReports from "./pages/SafetyCSAReports";
import SafetyCSAScores from "./pages/SafetyCSAScores";
import SafetyCSATrends from "./pages/SafetyCSATrends";
import SafetyCSAViolations from "./pages/SafetyCSAViolations";
import SafetyComplianceDashboard from "./pages/SafetyComplianceDashboard";
import SafetyCorrectiveActionPlan from "./pages/SafetyCorrectiveActionPlan";
import SafetyCustomReports from "./pages/SafetyCustomReports";
import SafetyDOTCompliance from "./pages/SafetyDOTCompliance";
import SafetyDashboard from "./pages/SafetyDashboard";
import SafetyDefectRepair from "./pages/SafetyDefectRepair";
import SafetyDefectTracking from "./pages/SafetyDefectTracking";
import SafetyDefensiveDriving from "./pages/SafetyDefensiveDriving";
import SafetyDriverAlerts from "./pages/SafetyDriverAlerts";
import SafetyDriverBehavior from "./pages/SafetyDriverBehavior";
import SafetyDriverBehaviorDetails from "./pages/SafetyDriverBehaviorDetails";
import SafetyDriverCoaching from "./pages/SafetyDriverCoaching";
import SafetyDriverComparison from "./pages/SafetyDriverComparison";
import SafetyDriverDashboard from "./pages/SafetyDriverDashboard";
import SafetyDriverDiscipline from "./pages/SafetyDriverDiscipline";
import SafetyDriverHistory from "./pages/SafetyDriverHistory";
import SafetyDriverRecognition from "./pages/SafetyDriverRecognition";
import SafetyDriverReports from "./pages/SafetyDriverReports";
import SafetyDriverRetraining from "./pages/SafetyDriverRetraining";
import SafetyDriverScoring from "./pages/SafetyDriverScoring";
import SafetyDriverTrends from "./pages/SafetyDriverTrends";
import SafetyEquipmentDashboard from "./pages/SafetyEquipmentDashboard";
import SafetyEquipmentInspections from "./pages/SafetyEquipmentInspections";
import SafetyEquipmentReports from "./pages/SafetyEquipmentReports";
import SafetyEquipmentTrends from "./pages/SafetyEquipmentTrends";
import SafetyHazmatCompliance from "./pages/SafetyHazmatCompliance";
import SafetyHazmatTraining from "./pages/SafetyHazmatTraining";
import SafetyIncidentAnalysis from "./pages/SafetyIncidentAnalysis";
import SafetyIncidentClosure from "./pages/SafetyIncidentClosure";
import SafetyIncidentCorrectiveAction from "./pages/SafetyIncidentCorrectiveAction";
import SafetyIncidentCosts from "./pages/SafetyIncidentCosts";
import SafetyIncidentCreate from "./pages/SafetyIncidentCreate";
import SafetyIncidentDashboard from "./pages/SafetyIncidentDashboard";
import SafetyIncidentDetails from "./pages/SafetyIncidentDetails";
import SafetyIncidentFollowUp from "./pages/SafetyIncidentFollowUp";
import SafetyIncidentInvestigation from "./pages/SafetyIncidentInvestigation";
import SafetyIncidentPhotos from "./pages/SafetyIncidentPhotos";
import SafetyIncidentReporting from "./pages/SafetyIncidentReporting";
import SafetyIncidentReports from "./pages/SafetyIncidentReports";
import SafetyIncidentTimeline from "./pages/SafetyIncidentTimeline";
import SafetyIncidentTracking from "./pages/SafetyIncidentTracking";
import SafetyIncidentTrends from "./pages/SafetyIncidentTrends";
import SafetyIncidentWitness from "./pages/SafetyIncidentWitness";
import SafetyIncidents from "./pages/SafetyIncidents";
import SafetyInspectionForm from "./pages/SafetyInspectionForm";
import SafetyInspectionReports from "./pages/SafetyInspectionReports";
import SafetyInspectionResults from "./pages/SafetyInspectionResults";
import SafetyInspectionSchedule from "./pages/SafetyInspectionSchedule";
import SafetyKPIDashboard from "./pages/SafetyKPIDashboard";
import SafetyManagerDashboard from "./pages/SafetyManagerDashboard";
import SafetyMeetingAgenda from "./pages/SafetyMeetingAgenda";
import SafetyMeetingAttendance from "./pages/SafetyMeetingAttendance";
import SafetyMeetingDashboard from "./pages/SafetyMeetingDashboard";
import SafetyMeetingMinutes from "./pages/SafetyMeetingMinutes";
import SafetyMeetingReports from "./pages/SafetyMeetingReports";
import SafetyMeetingSchedule from "./pages/SafetyMeetingSchedule";
import SafetyMeetings from "./pages/SafetyMeetings";
import SafetyMetrics from "./pages/SafetyMetrics";
import SafetyNearMissReporting from "./pages/SafetyNearMissReporting";
import SafetyOSHACompliance from "./pages/SafetyOSHACompliance";
import SafetyOrientationProgram from "./pages/SafetyOrientationProgram";
import SafetyOutOfService from "./pages/SafetyOutOfService";
import SafetyPredictiveAnalytics from "./pages/SafetyPredictiveAnalytics";
import SafetyRecallTracking from "./pages/SafetyRecallTracking";
import SafetyRefresherTraining from "./pages/SafetyRefresherTraining";
import SafetyRiskAssessment from "./pages/SafetyRiskAssessment";
import SafetyRiskDashboard from "./pages/SafetyRiskDashboard";
import SafetyRiskMitigation from "./pages/SafetyRiskMitigation";
import SafetyRiskReports from "./pages/SafetyRiskReports";
import SafetyRiskScoring from "./pages/SafetyRiskScoring";
import SafetyRiskTrends from "./pages/SafetyRiskTrends";
import SafetySafetyBlitz from "./pages/SafetySafetyBlitz";
import SafetyToolboxTalks from "./pages/SafetyToolboxTalks";
import SafetyTrainingAssignment from "./pages/SafetyTrainingAssignment";
import SafetyTrainingCatalog from "./pages/SafetyTrainingCatalog";
import SafetyTrainingCertification from "./pages/SafetyTrainingCertification";
import SafetyTrainingCompletion from "./pages/SafetyTrainingCompletion";
import SafetyTrainingDashboard from "./pages/SafetyTrainingDashboard";
import SafetyTrainingExpiring from "./pages/SafetyTrainingExpiring";
import SafetyTrainingPrograms from "./pages/SafetyTrainingPrograms";
import SafetyTrainingRecords from "./pages/SafetyTrainingRecords";
import SafetyTrainingReports from "./pages/SafetyTrainingReports";
import SafetyTrainingSchedule from "./pages/SafetyTrainingSchedule";
import ScaleLocations from "./pages/ScaleLocations";
import ScheduledTasks from "./pages/ScheduledTasks";
import SecuritySettings from "./pages/SecuritySettings";
import ServiceAlerts from "./pages/ServiceAlerts";
import SessionManagement from "./pages/SessionManagement";
import Settings from "./pages/Settings";
import SettingsIntegrations from "./pages/SettingsIntegrations";
import SettlementDetails from "./pages/SettlementDetails";
import SettlementStatements from "./pages/SettlementStatements";
import Shipment from "./pages/Shipment";
import ShipperAccessorials from "./pages/ShipperAccessorials";
import ShipperAppointmentBooking from "./pages/ShipperAppointmentBooking";
import ShipperAuctionBid from "./pages/ShipperAuctionBid";
import ShipperAutoPay from "./pages/ShipperAutoPay";
import ShipperBOLGeneration from "./pages/ShipperBOLGeneration";
import ShipperBOLViewer from "./pages/ShipperBOLViewer";
import ShipperBidAcceptance from "./pages/ShipperBidAcceptance";
import ShipperBidEvaluation from "./pages/ShipperBidEvaluation";
import ShipperBidManagement from "./pages/ShipperBidManagement";
import ShipperBidReview from "./pages/ShipperBidReview";
import ShipperBudgetTracking from "./pages/ShipperBudgetTracking";
import ShipperBulkUpload from "./pages/ShipperBulkUpload";
import ShipperCarrierPerformance from "./pages/ShipperCarrierPerformance";
import ShipperCarrierReport from "./pages/ShipperCarrierReport";
import ShipperCarrierScorecard from "./pages/ShipperCarrierScorecard";
import ShipperCertificateOfOrigin from "./pages/ShipperCertificateOfOrigin";
import ShipperCheckCalls from "./pages/ShipperCheckCalls";
import ShipperClaimDetails from "./pages/ShipperClaimDetails";
import ShipperClaimsFiling from "./pages/ShipperClaimsFiling";
import ShipperClaimsHistory from "./pages/ShipperClaimsHistory";
import ShipperCompliance from "./pages/ShipperCompliance";
import ShipperContractRates from "./pages/ShipperContractRates";
import ShipperContracts from "./pages/ShipperContracts";
import ShipperCostAllocation from "./pages/ShipperCostAllocation";
import ShipperCounterOffer from "./pages/ShipperCounterOffer";
import ShipperCreditBalance from "./pages/ShipperCreditBalance";
import ShipperCrossBorder from "./pages/ShipperCrossBorder";
import ShipperCustomsDocuments from "./pages/ShipperCustomsDocuments";
import ShipperDamageReport from "./pages/ShipperDamageReport";
import ShipperDashboard from "./pages/ShipperDashboard";
import ShipperDataExport from "./pages/ShipperDataExport";
import ShipperDisputeCenter from "./pages/ShipperDisputeCenter";
import ShipperDisputeDetails from "./pages/ShipperDisputeDetails";
import ShipperDisputeSubmit from "./pages/ShipperDisputeSubmit";
import ShipperDocumentExport from "./pages/ShipperDocumentExport";
import ShipperDocumentUpload from "./pages/ShipperDocumentUpload";
import ShipperDocuments from "./pages/ShipperDocuments";
import ShipperDraftShipments from "./pages/ShipperDraftShipments";
import ShipperDriverLocation from "./pages/ShipperDriverLocation";
import ShipperETAUpdates from "./pages/ShipperETAUpdates";
import ShipperExceptionAlerts from "./pages/ShipperExceptionAlerts";
import ShipperExportDocuments from "./pages/ShipperExportDocuments";
import ShipperGeofenceAlerts from "./pages/ShipperGeofenceAlerts";
import ShipperHazmatLoad from "./pages/ShipperHazmatLoad";
import ShipperInvoiceDetails from "./pages/ShipperInvoiceDetails";
import ShipperInvoiceReview from "./pages/ShipperInvoiceReview";
import ShipperInvoices from "./pages/ShipperInvoices";
import ShipperLaneAnalysis from "./pages/ShipperLaneAnalysis";
import ShipperLaneReport from "./pages/ShipperLaneReport";
import ShipperLoadCancellation from "./pages/ShipperLoadCancellation";
import ShipperLoadClone from "./pages/ShipperLoadClone";
import ShipperLoadConsolidation from "./pages/ShipperLoadConsolidation";
import ShipperLoadCreate from "./pages/ShipperLoadCreate";
import ShipperLoadModification from "./pages/ShipperLoadModification";
import ShipperLoadRescheduling from "./pages/ShipperLoadRescheduling";
import ShipperLoadSplit from "./pages/ShipperLoadSplit";
import ShipperLoadTemplates from "./pages/ShipperLoadTemplates";
import ShipperLoadTracking from "./pages/ShipperLoadTracking";
import ShipperLoadWizard from "./pages/ShipperLoadWizard";
import ShipperLoads from "./pages/ShipperLoads";
import ShipperMakePayment from "./pages/ShipperMakePayment";
import ShipperMilestoneTracking from "./pages/ShipperMilestoneTracking";
import ShipperModeAnalysis from "./pages/ShipperModeAnalysis";
import ShipperMultiStop from "./pages/ShipperMultiStop";
import ShipperOnTimeReport from "./pages/ShipperOnTimeReport";
import ShipperOversizedLoad from "./pages/ShipperOversizedLoad";
import ShipperPODReview from "./pages/ShipperPODReview";
import ShipperPODViewer from "./pages/ShipperPODViewer";
import ShipperPaymentHistory from "./pages/ShipperPaymentHistory";
import ShipperPaymentMethods from "./pages/ShipperPaymentMethods";
import ShipperProfile from "./pages/ShipperProfile";
import ShipperQuoteComparison from "./pages/ShipperQuoteComparison";
import ShipperQuoteHistory from "./pages/ShipperQuoteHistory";
import ShipperQuoteRequest from "./pages/ShipperQuoteRequest";
import ShipperQuoteRequests from "./pages/ShipperQuoteRequests";
import ShipperRateCarrier from "./pages/ShipperRateCarrier";
import ShipperRateNegotiation from "./pages/ShipperRateNegotiation";
import ShipperRecurringShipments from "./pages/ShipperRecurringShipments";
import ShipperReportScheduler from "./pages/ShipperReportScheduler";
import ShipperSavingsAnalysis from "./pages/ShipperSavingsAnalysis";
import ShipperShipmentDetails from "./pages/ShipperShipmentDetails";
import ShipperSpecialInstructions from "./pages/ShipperSpecialInstructions";
import ShipperSpendAnalytics from "./pages/ShipperSpendAnalytics";
import ShipperSpendDashboard from "./pages/ShipperSpendDashboard";
import ShipperSpotQuotes from "./pages/ShipperSpotQuotes";
import ShipperStatusHistory from "./pages/ShipperStatusHistory";
import ShipperTaxDocuments from "./pages/ShipperTaxDocuments";
import ShipperTemperatureControlled from "./pages/ShipperTemperatureControlled";
import ShipperTemperatureMonitoring from "./pages/ShipperTemperatureMonitoring";
import ShipperTrackingExport from "./pages/ShipperTrackingExport";
import ShipperTrackingMap from "./pages/ShipperTrackingMap";
import ShipperTrackingShare from "./pages/ShipperTrackingShare";
import ShipperVendorManagement from "./pages/ShipperVendorManagement";
import ShipperVolumeReport from "./pages/ShipperVolumeReport";
import Shippers from "./pages/Shippers";
import Specializations from "./pages/Specializations";
import SpectraMatch from "./pages/SpectraMatch";
import SubscriptionPlan from "./pages/SubscriptionPlan";
import SuperAdminABTestResults from "./pages/SuperAdminABTestResults";
import SuperAdminABTesting from "./pages/SuperAdminABTesting";
import SuperAdminAPIDocumentation from "./pages/SuperAdminAPIDocumentation";
import SuperAdminAPIKeys from "./pages/SuperAdminAPIKeys";
import SuperAdminAPIManagement from "./pages/SuperAdminAPIManagement";
import SuperAdminAPIUsage from "./pages/SuperAdminAPIUsage";
import SuperAdminAPIVersioning from "./pages/SuperAdminAPIVersioning";
import SuperAdminAccessLogs from "./pages/SuperAdminAccessLogs";
import SuperAdminAccountingIntegrations from "./pages/SuperAdminAccountingIntegrations";
import SuperAdminAlertConfiguration from "./pages/SuperAdminAlertConfiguration";
import SuperAdminAnalyticsDashboard from "./pages/SuperAdminAnalyticsDashboard";
import SuperAdminAnnouncementCenter from "./pages/SuperAdminAnnouncementCenter";
import SuperAdminAppVersions from "./pages/SuperAdminAppVersions";
import SuperAdminAuditTrail from "./pages/SuperAdminAuditTrail";
import SuperAdminBIIntegration from "./pages/SuperAdminBIIntegration";
import SuperAdminBackupManagement from "./pages/SuperAdminBackupManagement";
import SuperAdminBadgeManagement from "./pages/SuperAdminBadgeManagement";
import SuperAdminBenchmarkReports from "./pages/SuperAdminBenchmarkReports";
import SuperAdminBetaFeatures from "./pages/SuperAdminBetaFeatures";
import SuperAdminBillingOverview from "./pages/SuperAdminBillingOverview";
import SuperAdminBlueGreenDeployments from "./pages/SuperAdminBlueGreenDeployments";
import SuperAdminBrandingSettings from "./pages/SuperAdminBrandingSettings";
import SuperAdminBrokerApprovals from "./pages/SuperAdminBrokerApprovals";
import SuperAdminCacheManagement from "./pages/SuperAdminCacheManagement";
import SuperAdminCanaryDeployments from "./pages/SuperAdminCanaryDeployments";
import SuperAdminCapacityAnalysis from "./pages/SuperAdminCapacityAnalysis";
import SuperAdminCapacityPlanning from "./pages/SuperAdminCapacityPlanning";
import SuperAdminCarrierVetting from "./pages/SuperAdminCarrierVetting";
import SuperAdminChangelog from "./pages/SuperAdminChangelog";
import SuperAdminChurnAnalysis from "./pages/SuperAdminChurnAnalysis";
import SuperAdminCohortAnalysis from "./pages/SuperAdminCohortAnalysis";
import SuperAdminCommissionRules from "./pages/SuperAdminCommissionRules";
import SuperAdminCompanyManagement from "./pages/SuperAdminCompanyManagement";
import SuperAdminCompanyVerification from "./pages/SuperAdminCompanyVerification";
import SuperAdminCompetitorAnalysis from "./pages/SuperAdminCompetitorAnalysis";
import SuperAdminComplianceAudits from "./pages/SuperAdminComplianceAudits";
import SuperAdminComplianceReports from "./pages/SuperAdminComplianceReports";
import SuperAdminContentModeration from "./pages/SuperAdminContentModeration";
import SuperAdminCostManagement from "./pages/SuperAdminCostManagement";
import SuperAdminCurrencySettings from "./pages/SuperAdminCurrencySettings";
import SuperAdminCustomReports from "./pages/SuperAdminCustomReports";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminDataExport from "./pages/SuperAdminDataExport";
import SuperAdminDataMigration from "./pages/SuperAdminDataMigration";
import SuperAdminDataPrivacy from "./pages/SuperAdminDataPrivacy";
import SuperAdminDataRetention from "./pages/SuperAdminDataRetention";
import SuperAdminDataSync from "./pages/SuperAdminDataSync";
import SuperAdminDataWarehouse from "./pages/SuperAdminDataWarehouse";
import SuperAdminDatabaseManagement from "./pages/SuperAdminDatabaseManagement";
import SuperAdminDemandForecast from "./pages/SuperAdminDemandForecast";
import SuperAdminDeploymentHistory from "./pages/SuperAdminDeploymentHistory";
import SuperAdminDeprecationSchedule from "./pages/SuperAdminDeprecationSchedule";
import SuperAdminDeveloperAnalytics from "./pages/SuperAdminDeveloperAnalytics";
import SuperAdminDeveloperPortal from "./pages/SuperAdminDeveloperPortal";
import SuperAdminDeveloperSupport from "./pages/SuperAdminDeveloperSupport";
import SuperAdminDeviceManagement from "./pages/SuperAdminDeviceManagement";
import SuperAdminDisasterRecovery from "./pages/SuperAdminDisasterRecovery";
import SuperAdminDocumentVerification from "./pages/SuperAdminDocumentVerification";
import SuperAdminDriverApprovals from "./pages/SuperAdminDriverApprovals";
import SuperAdminDriverOverview from "./pages/SuperAdminDriverOverview";
import SuperAdminELDIntegrations from "./pages/SuperAdminELDIntegrations";
import SuperAdminEmailTemplates from "./pages/SuperAdminEmailTemplates";
import SuperAdminEncryption from "./pages/SuperAdminEncryption";
import SuperAdminEnvironmentConfig from "./pages/SuperAdminEnvironmentConfig";
import SuperAdminErrorTracking from "./pages/SuperAdminErrorTracking";
import SuperAdminEscortApprovals from "./pages/SuperAdminEscortApprovals";
import SuperAdminEventCalendar from "./pages/SuperAdminEventCalendar";
import SuperAdminFactoringApprovals from "./pages/SuperAdminFactoringApprovals";
import SuperAdminFeatureFlags from "./pages/SuperAdminFeatureFlags";
import SuperAdminFeatureRollout from "./pages/SuperAdminFeatureRollout";
import SuperAdminFeedbackCenter from "./pages/SuperAdminFeedbackCenter";
import SuperAdminFinAnalytics from "./pages/SuperAdminFinAnalytics";
import SuperAdminFinancialAnalytics from "./pages/SuperAdminFinancialAnalytics";
import SuperAdminFinancialForecasting from "./pages/SuperAdminFinancialForecasting";
import SuperAdminFleetOverview from "./pages/SuperAdminFleetOverview";
import SuperAdminForceUpdate from "./pages/SuperAdminForceUpdate";
import SuperAdminFuelCardIntegrations from "./pages/SuperAdminFuelCardIntegrations";
import SuperAdminFunnelAnalysis from "./pages/SuperAdminFunnelAnalysis";
import SuperAdminGPSProviders from "./pages/SuperAdminGPSProviders";
import SuperAdminGamificationAnalytics from "./pages/SuperAdminGamificationAnalytics";
import SuperAdminGamificationConfig from "./pages/SuperAdminGamificationConfig";
import SuperAdminGamificationReports from "./pages/SuperAdminGamificationReports";
import SuperAdminGamificationTesting from "./pages/SuperAdminGamificationTesting";
import SuperAdminGeographicAnalytics from "./pages/SuperAdminGeographicAnalytics";
import SuperAdminGlobalSettings from "./pages/SuperAdminGlobalSettings";
import SuperAdminGrowthMetrics from "./pages/SuperAdminGrowthMetrics";
import SuperAdminGuildManagement from "./pages/SuperAdminGuildManagement";
import SuperAdminHazmatCertification from "./pages/SuperAdminHazmatCertification";
import SuperAdminHelpDocs from "./pages/SuperAdminHelpDocs";
import SuperAdminIPWhitelist from "./pages/SuperAdminIPWhitelist";
import SuperAdminIncidentResponse from "./pages/SuperAdminIncidentResponse";
import SuperAdminIndexManagement from "./pages/SuperAdminIndexManagement";
import SuperAdminInfraScaling from "./pages/SuperAdminInfraScaling";
import SuperAdminInfrastructure from "./pages/SuperAdminInfrastructure";
import SuperAdminInsuranceVerification from "./pages/SuperAdminInsuranceVerification";
import SuperAdminIntegrationHub from "./pages/SuperAdminIntegrationHub";
import SuperAdminInvoiceManagement from "./pages/SuperAdminInvoiceManagement";
import SuperAdminLTVAnalysis from "./pages/SuperAdminLTVAnalysis";
import SuperAdminLeaderboardConfig from "./pages/SuperAdminLeaderboardConfig";
import SuperAdminLicenseVerification from "./pages/SuperAdminLicenseVerification";
import SuperAdminLoadAnalytics from "./pages/SuperAdminLoadAnalytics";
import SuperAdminLoadOverview from "./pages/SuperAdminLoadOverview";
import SuperAdminLocalization from "./pages/SuperAdminLocalization";
import SuperAdminLogViewer from "./pages/SuperAdminLogViewer";
import SuperAdminLootCrateDesigner from "./pages/SuperAdminLootCrateDesigner";
import SuperAdminMRRDashboard from "./pages/SuperAdminMRRDashboard";
import SuperAdminMaintenanceMode from "./pages/SuperAdminMaintenanceMode";
import SuperAdminMappingProviders from "./pages/SuperAdminMappingProviders";
import SuperAdminMarketTrends from "./pages/SuperAdminMarketTrends";
import SuperAdminMilesEconomy from "./pages/SuperAdminMilesEconomy";
import SuperAdminMissionDesigner from "./pages/SuperAdminMissionDesigner";
import SuperAdminMobileAppConfig from "./pages/SuperAdminMobileAppConfig";
import SuperAdminNotificationRules from "./pages/SuperAdminNotificationRules";
import SuperAdminOAuthProviders from "./pages/SuperAdminOAuthProviders";
import SuperAdminOperationsOverview from "./pages/SuperAdminOperationsOverview";
import SuperAdminPartnerDevelopers from "./pages/SuperAdminPartnerDevelopers";
import SuperAdminPartnerPortal from "./pages/SuperAdminPartnerPortal";
import SuperAdminPaymentGateways from "./pages/SuperAdminPaymentGateways";
import SuperAdminPaymentProviders from "./pages/SuperAdminPaymentProviders";
import SuperAdminPayoutSettings from "./pages/SuperAdminPayoutSettings";
import SuperAdminPenetrationTesting from "./pages/SuperAdminPenetrationTesting";
import SuperAdminPerformanceMetrics from "./pages/SuperAdminPerformanceMetrics";
import SuperAdminPermissions from "./pages/SuperAdminPermissions";
import SuperAdminPricingAnalysis from "./pages/SuperAdminPricingAnalysis";
import SuperAdminPricingTiers from "./pages/SuperAdminPricingTiers";
import SuperAdminPrivacyPolicy from "./pages/SuperAdminPrivacyPolicy";
import SuperAdminProfitAnalysis from "./pages/SuperAdminProfitAnalysis";
import SuperAdminPushNotifications from "./pages/SuperAdminPushNotifications";
import SuperAdminQueryAnalyzer from "./pages/SuperAdminQueryAnalyzer";
import SuperAdminQueueMonitor from "./pages/SuperAdminQueueMonitor";
import SuperAdminRateLimits from "./pages/SuperAdminRateLimits";
import SuperAdminRefundManagement from "./pages/SuperAdminRefundManagement";
import SuperAdminResourceOptimization from "./pages/SuperAdminResourceOptimization";
import SuperAdminRestoreManagement from "./pages/SuperAdminRestoreManagement";
import SuperAdminRetentionAnalytics from "./pages/SuperAdminRetentionAnalytics";
import SuperAdminRevenueDashboard from "./pages/SuperAdminRevenueDashboard";
import SuperAdminRevenueReports from "./pages/SuperAdminRevenueReports";
import SuperAdminRewardsCatalog from "./pages/SuperAdminRewardsCatalog";
import SuperAdminRoleManagement from "./pages/SuperAdminRoleManagement";
import SuperAdminRollbackManagement from "./pages/SuperAdminRollbackManagement";
import SuperAdminRouteAnalysis from "./pages/SuperAdminRouteAnalysis";
import SuperAdminSDKManagement from "./pages/SuperAdminSDKManagement";
import SuperAdminSMSConfiguration from "./pages/SuperAdminSMSConfiguration";
import SuperAdminSOC2Dashboard from "./pages/SuperAdminSOC2Dashboard";
import SuperAdminSSOConfiguration from "./pages/SuperAdminSSOConfiguration";
import SuperAdminSampleApps from "./pages/SuperAdminSampleApps";
import SuperAdminSandboxManagement from "./pages/SuperAdminSandboxManagement";
import SuperAdminScheduledReports from "./pages/SuperAdminScheduledReports";
import SuperAdminSchemaManagement from "./pages/SuperAdminSchemaManagement";
import SuperAdminSeasonManagement from "./pages/SuperAdminSeasonManagement";
import SuperAdminSecurityAlerts from "./pages/SuperAdminSecurityAlerts";
import SuperAdminSecurityDashboard from "./pages/SuperAdminSecurityDashboard";
import SuperAdminSecurityPolicies from "./pages/SuperAdminSecurityPolicies";
import SuperAdminStatusPage from "./pages/SuperAdminStatusPage";
import SuperAdminSubscriptionManagement from "./pages/SuperAdminSubscriptionManagement";
import SuperAdminSupportAnalytics from "./pages/SuperAdminSupportAnalytics";
import SuperAdminSupportEscalation from "./pages/SuperAdminSupportEscalation";
import SuperAdminSystemHealth from "./pages/SuperAdminSystemHealth";
import SuperAdminTMSIntegrations from "./pages/SuperAdminTMSIntegrations";
import SuperAdminTaxConfiguration from "./pages/SuperAdminTaxConfiguration";
import SuperAdminTenantConfig from "./pages/SuperAdminTenantConfig";
import SuperAdminTerminalApprovals from "./pages/SuperAdminTerminalApprovals";
import SuperAdminTerminalOverview from "./pages/SuperAdminTerminalOverview";
import SuperAdminTermsOfService from "./pages/SuperAdminTermsOfService";
import SuperAdminTestDataGenerator from "./pages/SuperAdminTestDataGenerator";
import SuperAdminThreatDetection from "./pages/SuperAdminThreatDetection";
import SuperAdminTimezoneSettings from "./pages/SuperAdminTimezoneSettings";
import SuperAdminTournamentConfig from "./pages/SuperAdminTournamentConfig";
import SuperAdminUserAnalytics from "./pages/SuperAdminUserAnalytics";
import SuperAdminUserDirectory from "./pages/SuperAdminUserDirectory";
import SuperAdminUserVerification from "./pages/SuperAdminUserVerification";
import SuperAdminVerificationHistory from "./pages/SuperAdminVerificationHistory";
import SuperAdminVerificationQueue from "./pages/SuperAdminVerificationQueue";
import SuperAdminVerificationReports from "./pages/SuperAdminVerificationReports";
import SuperAdminVerificationRules from "./pages/SuperAdminVerificationRules";
import SuperAdminVulnerabilityScanning from "./pages/SuperAdminVulnerabilityScanning";
import SuperAdminWeatherProviders from "./pages/SuperAdminWeatherProviders";
import SuperAdminWebhookManagement from "./pages/SuperAdminWebhookManagement";
import SuperAdminWhiteLabel from "./pages/SuperAdminWhiteLabel";
import Support from "./pages/Support";
import SupportTickets from "./pages/SupportTickets";
import SystemConfiguration from "./pages/SystemConfiguration";
import SystemHealth from "./pages/SystemHealth";
import SystemSettings from "./pages/SystemSettings";
import SystemStatus from "./pages/SystemStatus";
import TankInventory from "./pages/TankInventory";
import TaxDocuments from "./pages/TaxDocuments";
import TeamManagement from "./pages/TeamManagement";
import TelemetryAlerts from "./pages/TelemetryAlerts";
import TelemetryAnalytics from "./pages/TelemetryAnalytics";
import TelemetryBenchmarking from "./pages/TelemetryBenchmarking";
import TelemetryDTCMonitoring from "./pages/TelemetryDTCMonitoring";
import TelemetryDashboard from "./pages/TelemetryDashboard";
import TelemetryDataExport from "./pages/TelemetryDataExport";
import TelemetryDeviceManagement from "./pages/TelemetryDeviceManagement";
import TelemetryDriverDetails from "./pages/TelemetryDriverDetails";
import TelemetryEngineHealth from "./pages/TelemetryEngineHealth";
import TelemetryFleetMap from "./pages/TelemetryFleetMap";
import TelemetryFuelConsumption from "./pages/TelemetryFuelConsumption";
import TelemetryGeofenceAlerts from "./pages/TelemetryGeofenceAlerts";
import TelemetryGeofencing from "./pages/TelemetryGeofencing";
import TelemetryHarshEvents from "./pages/TelemetryHarshEvents";
import TelemetryIdleTime from "./pages/TelemetryIdleTime";
import TelemetryIntegrations from "./pages/TelemetryIntegrations";
import TelemetryLiveTracking from "./pages/TelemetryLiveTracking";
import TelemetryLocationHistory from "./pages/TelemetryLocationHistory";
import TelemetryPredictive from "./pages/TelemetryPredictive";
import TelemetryReports from "./pages/TelemetryReports";
import TelemetrySpeedMonitoring from "./pages/TelemetrySpeedMonitoring";
import TelemetryVehicleDetails from "./pages/TelemetryVehicleDetails";
import TerminalAccessControl from "./pages/TerminalAccessControl";
import TerminalAppointmentAnalytics from "./pages/TerminalAppointmentAnalytics";
import TerminalAppointmentConflicts from "./pages/TerminalAppointmentConflicts";
import TerminalAppointmentForecast from "./pages/TerminalAppointmentForecast";
import TerminalAppointmentNotifications from "./pages/TerminalAppointmentNotifications";
import TerminalAppointmentPortal from "./pages/TerminalAppointmentPortal";
import TerminalAppointmentRules from "./pages/TerminalAppointmentRules";
import TerminalAppointmentSchedule from "./pages/TerminalAppointmentSchedule";
import TerminalAppointmentSlots from "./pages/TerminalAppointmentSlots";
import TerminalAppointments from "./pages/TerminalAppointments";
import TerminalBottleneckAnalysis from "./pages/TerminalBottleneckAnalysis";
import TerminalCapacityPlanning from "./pages/TerminalCapacityPlanning";
import TerminalCarrierAccess from "./pages/TerminalCarrierAccess";
import TerminalCarrierApproval from "./pages/TerminalCarrierApproval";
import TerminalCarrierBlacklist from "./pages/TerminalCarrierBlacklist";
import TerminalCarrierPerformance from "./pages/TerminalCarrierPerformance";
import TerminalCarrierReport from "./pages/TerminalCarrierReport";
import TerminalCustomReports from "./pages/TerminalCustomReports";
import TerminalDashboard from "./pages/TerminalDashboard";
import TerminalDirectory from "./pages/TerminalDirectory";
import TerminalDriverBadging from "./pages/TerminalDriverBadging";
import TerminalDriverTraining from "./pages/TerminalDriverTraining";
import TerminalDriverValidation from "./pages/TerminalDriverValidation";
import TerminalDwellTime from "./pages/TerminalDwellTime";
import TerminalEIAReporting from "./pages/TerminalEIAReporting";
import TerminalEPAReporting from "./pages/TerminalEPAReporting";
import TerminalEmergencyDrills from "./pages/TerminalEmergencyDrills";
import TerminalEmergencyProcedures from "./pages/TerminalEmergencyProcedures";
import TerminalEquipmentMaintenance from "./pages/TerminalEquipmentMaintenance";
import TerminalEquipmentStatus from "./pages/TerminalEquipmentStatus";
import TerminalFinancialReport from "./pages/TerminalFinancialReport";
import TerminalGateManagement from "./pages/TerminalGateManagement";
import TerminalHazmatCompliance from "./pages/TerminalHazmatCompliance";
import TerminalHolidaySchedule from "./pages/TerminalHolidaySchedule";
import TerminalIncidentLog from "./pages/TerminalIncidentLog";
import TerminalIncidentReporting from "./pages/TerminalIncidentReporting";
import TerminalInventory from "./pages/TerminalInventory";
import TerminalInventoryAdjustment from "./pages/TerminalInventoryAdjustment";
import TerminalInventoryAlerts from "./pages/TerminalInventoryAlerts";
import TerminalInventoryAudit from "./pages/TerminalInventoryAudit";
import TerminalInventoryDashboard from "./pages/TerminalInventoryDashboard";
import TerminalInventoryForecast from "./pages/TerminalInventoryForecast";
import TerminalInventoryReconciliation from "./pages/TerminalInventoryReconciliation";
import TerminalInventoryReport from "./pages/TerminalInventoryReport";
import TerminalLateArrival from "./pages/TerminalLateArrival";
import TerminalLoadingBayStatus from "./pages/TerminalLoadingBayStatus";
import TerminalLoadingSchedule from "./pages/TerminalLoadingSchedule";
import TerminalMaintenanceSchedule from "./pages/TerminalMaintenanceSchedule";
import TerminalManagerDashboard from "./pages/TerminalManagerDashboard";
import TerminalMeterCalibration from "./pages/TerminalMeterCalibration";
import TerminalNoShowManagement from "./pages/TerminalNoShowManagement";
import TerminalOperations from "./pages/TerminalOperations";
import TerminalOperationsDashboard from "./pages/TerminalOperationsDashboard";
import TerminalOperationsReport from "./pages/TerminalOperationsReport";
import TerminalPPETracking from "./pages/TerminalPPETracking";
import TerminalProductBlending from "./pages/TerminalProductBlending";
import TerminalProductDispatch from "./pages/TerminalProductDispatch";
import TerminalProductInventory from "./pages/TerminalProductInventory";
import TerminalProductManagement from "./pages/TerminalProductManagement";
import TerminalProductReceipt from "./pages/TerminalProductReceipt";
import TerminalProductTransfer from "./pages/TerminalProductTransfer";
import TerminalPumpStatus from "./pages/TerminalPumpStatus";
import TerminalQueueManagement from "./pages/TerminalQueueManagement";
import TerminalRackAssignment from "./pages/TerminalRackAssignment";
import TerminalRackSchedule from "./pages/TerminalRackSchedule";
import TerminalRegulatoryCalendar from "./pages/TerminalRegulatoryCalendar";
import TerminalReorderPoints from "./pages/TerminalReorderPoints";
import TerminalRescheduling from "./pages/TerminalRescheduling";
import TerminalSCADA from "./pages/TerminalSCADA";
import TerminalSafetyDashboard from "./pages/TerminalSafetyDashboard";
import TerminalSafetyInspection from "./pages/TerminalSafetyInspection";
import TerminalSafetyInspections from "./pages/TerminalSafetyInspections";
import TerminalSafetyMetrics from "./pages/TerminalSafetyMetrics";
import TerminalSafetyReport from "./pages/TerminalSafetyReport";
import TerminalSafetyTraining from "./pages/TerminalSafetyTraining";
import TerminalScheduling from "./pages/TerminalScheduling";
import TerminalShiftHandoff from "./pages/TerminalShiftHandoff";
import TerminalStaff from "./pages/TerminalStaff";
import TerminalSurgeManagement from "./pages/TerminalSurgeManagement";
import TerminalTankGauging from "./pages/TerminalTankGauging";
import TerminalTankInspection from "./pages/TerminalTankInspection";
import TerminalTankInventory from "./pages/TerminalTankInventory";
import TerminalTankMaintenance from "./pages/TerminalTankMaintenance";
import TerminalTankStatus from "./pages/TerminalTankStatus";
import TerminalThroughput from "./pages/TerminalThroughput";
import TerminalThroughputReport from "./pages/TerminalThroughputReport";
import TerminalVisitorLog from "./pages/TerminalVisitorLog";
import TerminalWeatherPrep from "./pages/TerminalWeatherPrep";
import TerminalWeighScales from "./pages/TerminalWeighScales";
import TerminalYardManagement from "./pages/TerminalYardManagement";
import TermsOfService from "./pages/TermsOfService";
import TestLogin from "./pages/TestLogin";
import TheHaul from "./pages/TheHaul";
import TheHaulAchievementStats from "./pages/TheHaulAchievementStats";
import TheHaulAchievements from "./pages/TheHaulAchievements";
import TheHaulAvatars from "./pages/TheHaulAvatars";
import TheHaulBadgeCollection from "./pages/TheHaulBadgeCollection";
import TheHaulBadgeDetails from "./pages/TheHaulBadgeDetails";
import TheHaulDailyMissions from "./pages/TheHaulDailyMissions";
import TheHaulDashboard from "./pages/TheHaulDashboard";
import TheHaulEmotes from "./pages/TheHaulEmotes";
import TheHaulEventDetails from "./pages/TheHaulEventDetails";
import TheHaulEvents from "./pages/TheHaulEvents";
import TheHaulFindFriends from "./pages/TheHaulFindFriends";
import TheHaulFrames from "./pages/TheHaulFrames";
import TheHaulFriendRequests from "./pages/TheHaulFriendRequests";
import TheHaulFriends from "./pages/TheHaulFriends";
import TheHaulFriendsLeaderboard from "./pages/TheHaulFriendsLeaderboard";
import TheHaulGlobalLeaderboard from "./pages/TheHaulGlobalLeaderboard";
import TheHaulGuild from "./pages/TheHaulGuild";
import TheHaulGuildChat from "./pages/TheHaulGuildChat";
import TheHaulGuildCreate from "./pages/TheHaulGuildCreate";
import TheHaulGuildEvents from "./pages/TheHaulGuildEvents";
import TheHaulGuildLeaderboard from "./pages/TheHaulGuildLeaderboard";
import TheHaulGuildMembers from "./pages/TheHaulGuildMembers";
import TheHaulGuildSearch from "./pages/TheHaulGuildSearch";
import TheHaulGuildWars from "./pages/TheHaulGuildWars";
import TheHaulHelp from "./pages/TheHaulHelp";
import TheHaulInventory from "./pages/TheHaulInventory";
import TheHaulLeaderboard from "./pages/TheHaulLeaderboard";
import TheHaulLeaderboards from "./pages/TheHaulLeaderboards";
import TheHaulLevelProgress from "./pages/TheHaulLevelProgress";
import TheHaulLootCrateOpen from "./pages/TheHaulLootCrateOpen";
import TheHaulLootCrates from "./pages/TheHaulLootCrates";
import TheHaulMilesConversion from "./pages/TheHaulMilesConversion";
import TheHaulMilesHistory from "./pages/TheHaulMilesHistory";
import TheHaulMilestones from "./pages/TheHaulMilestones";
import TheHaulMissionDetails from "./pages/TheHaulMissionDetails";
import TheHaulMissions from "./pages/TheHaulMissions";
import TheHaulNotifications from "./pages/TheHaulNotifications";
import TheHaulPlayerProfile from "./pages/TheHaulPlayerProfile";
import TheHaulPrestige from "./pages/TheHaulPrestige";
import TheHaulProfile from "./pages/TheHaulProfile";
import TheHaulPurchaseHistory from "./pages/TheHaulPurchaseHistory";
import TheHaulReferralRewards from "./pages/TheHaulReferralRewards";
import TheHaulReferrals from "./pages/TheHaulReferrals";
import TheHaulRegionalLeaderboard from "./pages/TheHaulRegionalLeaderboard";
import TheHaulRewards from "./pages/TheHaulRewards";
import TheHaulSeasonHistory from "./pages/TheHaulSeasonHistory";
import TheHaulSeasonPass from "./pages/TheHaulSeasonPass";
import TheHaulSeasonRewards from "./pages/TheHaulSeasonRewards";
import TheHaulSettings from "./pages/TheHaulSettings";
import TheHaulStatistics from "./pages/TheHaulStatistics";
import TheHaulStore from "./pages/TheHaulStore";
import TheHaulStoreCategory from "./pages/TheHaulStoreCategory";
import TheHaulStreaks from "./pages/TheHaulStreaks";
import TheHaulTitles from "./pages/TheHaulTitles";
import TheHaulTournamentDetails from "./pages/TheHaulTournamentDetails";
import TheHaulTournaments from "./pages/TheHaulTournaments";
import TheHaulWeeklyMissions from "./pages/TheHaulWeeklyMissions";
import TheHaulXPHistory from "./pages/TheHaulXPHistory";
import TimeOffRequests from "./pages/TimeOffRequests";
import TollCalculator from "./pages/TollCalculator";
import TrackShipments from "./pages/TrackShipments";
import TrafficConditions from "./pages/TrafficConditions";
import TrainingManagement from "./pages/TrainingManagement";
import TwoFactorAuth from "./pages/TwoFactorAuth";
import TwoFactorSetup from "./pages/TwoFactorSetup";
import UserManagement from "./pages/UserManagement";
import UserVerification from "./pages/UserVerification";
import Users from "./pages/Users";
import UtilizationReport from "./pages/UtilizationReport";
import Vehicle from "./pages/Vehicle";
import VehicleDetails from "./pages/VehicleDetails";
import VehicleInspections from "./pages/VehicleInspections";
import VerificationQueue from "./pages/VerificationQueue";
import Violations from "./pages/Violations";
import Wallet from "./pages/Wallet";
import WalletAPIAccess from "./pages/WalletAPIAccess";
import WalletAddAccount from "./pages/WalletAddAccount";
import WalletAddFunds from "./pages/WalletAddFunds";
import WalletAutoPay from "./pages/WalletAutoPay";
import WalletBudgeting from "./pages/WalletBudgeting";
import WalletCardControls from "./pages/WalletCardControls";
import WalletCardDetails from "./pages/WalletCardDetails";
import WalletCards from "./pages/WalletCards";
import WalletCashAdvance from "./pages/WalletCashAdvance";
import WalletCashAdvanceHistory from "./pages/WalletCashAdvanceHistory";
import WalletCashAdvanceRepayment from "./pages/WalletCashAdvanceRepayment";
import WalletCashback from "./pages/WalletCashback";
import WalletCurrencyExchange from "./pages/WalletCurrencyExchange";
import WalletDeposit from "./pages/WalletDeposit";
import WalletDisputeDetails from "./pages/WalletDisputeDetails";
import WalletDisputes from "./pages/WalletDisputes";
import WalletEscrow from "./pages/WalletEscrow";
import WalletEscrowDetails from "./pages/WalletEscrowDetails";
import WalletExport from "./pages/WalletExport";
import WalletFeeAnalysis from "./pages/WalletFeeAnalysis";
import WalletFileDispute from "./pages/WalletFileDispute";
import WalletFuelCardIntegration from "./pages/WalletFuelCardIntegration";
import WalletFuelDiscounts from "./pages/WalletFuelDiscounts";
import WalletFuelPurchase from "./pages/WalletFuelPurchase";
import WalletGoals from "./pages/WalletGoals";
import WalletHome from "./pages/WalletHome";
import WalletInChatPayment from "./pages/WalletInChatPayment";
import WalletInstantPay from "./pages/WalletInstantPay";
import WalletInternationalTransfer from "./pages/WalletInternationalTransfer";
import WalletLinkedAccounts from "./pages/WalletLinkedAccounts";
import WalletLumperPayment from "./pages/WalletLumperPayment";
import WalletNotifications from "./pages/WalletNotifications";
import WalletPIN from "./pages/WalletPIN";
import WalletParkingPayment from "./pages/WalletParkingPayment";
import WalletPaymentLimits from "./pages/WalletPaymentLimits";
import WalletPaymentQRCode from "./pages/WalletPaymentQRCode";
import WalletPaymentRequest from "./pages/WalletPaymentRequest";
import WalletPayoutMethods from "./pages/WalletPayoutMethods";
import WalletPromotions from "./pages/WalletPromotions";
import WalletQuickPayHistory from "./pages/WalletQuickPayHistory";
import WalletQuickPayRequest from "./pages/WalletQuickPayRequest";
import WalletRecurringTransfer from "./pages/WalletRecurringTransfer";
import WalletRequestCard from "./pages/WalletRequestCard";
import WalletRewards from "./pages/WalletRewards";
import WalletScalePayment from "./pages/WalletScalePayment";
import WalletScheduledPayments from "./pages/WalletScheduledPayments";
import WalletSecuritySettings from "./pages/WalletSecuritySettings";
import WalletSpendingAnalytics from "./pages/WalletSpendingAnalytics";
import WalletSplitPayment from "./pages/WalletSplitPayment";
import WalletStatements from "./pages/WalletStatements";
import WalletSupport from "./pages/WalletSupport";
import WalletTaxDocuments from "./pages/WalletTaxDocuments";
import WalletTollPayment from "./pages/WalletTollPayment";
import WalletTransactionDetails from "./pages/WalletTransactionDetails";
import WalletTransactionHistory from "./pages/WalletTransactionHistory";
import WalletTransactions from "./pages/WalletTransactions";
import WalletTransfer from "./pages/WalletTransfer";
import WalletVerification from "./pages/WalletVerification";
import WalletWithdraw from "./pages/WalletWithdraw";
import WeatherAlerts from "./pages/WeatherAlerts";
import WebhookLogs from "./pages/WebhookLogs";
import WebhookManagement from "./pages/WebhookManagement";
import WidgetAPI from "./pages/WidgetAPI";
import WidgetAccessControl from "./pages/WidgetAccessControl";
import WidgetAlertThresholds from "./pages/WidgetAlertThresholds";
import WidgetAnnotations from "./pages/WidgetAnnotations";
import WidgetAuditLog from "./pages/WidgetAuditLog";
import WidgetCatalog from "./pages/WidgetCatalog";
import WidgetComparison from "./pages/WidgetComparison";
import WidgetConfiguration from "./pages/WidgetConfiguration";
import WidgetCustomBuilder from "./pages/WidgetCustomBuilder";
import WidgetDataSources from "./pages/WidgetDataSources";
import WidgetDrilldown from "./pages/WidgetDrilldown";
import WidgetEmbedding from "./pages/WidgetEmbedding";
import WidgetExport from "./pages/WidgetExport";
import WidgetFilters from "./pages/WidgetFilters";
import WidgetGoals from "./pages/WidgetGoals";
import WidgetImportExport from "./pages/WidgetImportExport";
import WidgetInteractive from "./pages/WidgetInteractive";
import WidgetLayouts from "./pages/WidgetLayouts";
import WidgetMobile from "./pages/WidgetMobile";
import WidgetNotifications from "./pages/WidgetNotifications";
import WidgetPerformance from "./pages/WidgetPerformance";
import WidgetScheduledRefresh from "./pages/WidgetScheduledRefresh";
import WidgetScheduledReports from "./pages/WidgetScheduledReports";
import WidgetSharing from "./pages/WidgetSharing";
import WidgetTemplates from "./pages/WidgetTemplates";
import WidgetThemes from "./pages/WidgetThemes";
import ZeunAdminDashboard from "./pages/ZeunAdminDashboard";
import ZeunAnalytics from "./pages/ZeunAnalytics";
import ZeunAppointmentBooking from "./pages/ZeunAppointmentBooking";
import ZeunBrakeTracking from "./pages/ZeunBrakeTracking";
import ZeunBreakdown from "./pages/ZeunBreakdown";
import ZeunBreakdownReport from "./pages/ZeunBreakdownReport";
import ZeunBreakdownWizard from "./pages/ZeunBreakdownWizard";
import ZeunBudgeting from "./pages/ZeunBudgeting";
import ZeunComplianceCalendar from "./pages/ZeunComplianceCalendar";
import ZeunCostAnalysis from "./pages/ZeunCostAnalysis";
import ZeunCostPerMile from "./pages/ZeunCostPerMile";
import ZeunCostTracking from "./pages/ZeunCostTracking";
import ZeunDOTInspectionPrep from "./pages/ZeunDOTInspectionPrep";
import ZeunDTCHistory from "./pages/ZeunDTCHistory";
import ZeunDTCLookup from "./pages/ZeunDTCLookup";
import ZeunDashboard from "./pages/ZeunDashboard";
import ZeunDefectRepair from "./pages/ZeunDefectRepair";
import ZeunDefectTracking from "./pages/ZeunDefectTracking";
import ZeunEmergencyProtocol from "./pages/ZeunEmergencyProtocol";
import ZeunEstimateApproval from "./pages/ZeunEstimateApproval";
import ZeunFleetDashboard from "./pages/ZeunFleetDashboard";
import ZeunFluidTracking from "./pages/ZeunFluidTracking";
import ZeunForecasting from "./pages/ZeunForecasting";
import ZeunInspectionForms from "./pages/ZeunInspectionForms";
import ZeunInspectionSchedule from "./pages/ZeunInspectionSchedule";
import ZeunInventoryManagement from "./pages/ZeunInventoryManagement";
import ZeunInvoiceReview from "./pages/ZeunInvoiceReview";
import ZeunMaintenanceAlerts from "./pages/ZeunMaintenanceAlerts";
import ZeunMaintenanceHistory from "./pages/ZeunMaintenanceHistory";
import ZeunMaintenancePlanning from "./pages/ZeunMaintenancePlanning";
import ZeunMaintenanceSchedule from "./pages/ZeunMaintenanceSchedule";
import ZeunMaintenanceTracker from "./pages/ZeunMaintenanceTracker";
import ZeunMobileRepair from "./pages/ZeunMobileRepair";
import ZeunPartsCatalog from "./pages/ZeunPartsCatalog";
import ZeunPartsOrdering from "./pages/ZeunPartsOrdering";
import ZeunPartsTracking from "./pages/ZeunPartsTracking";
import ZeunPaymentProcessing from "./pages/ZeunPaymentProcessing";
import ZeunPredictiveMaintenance from "./pages/ZeunPredictiveMaintenance";
import ZeunProviderDetails from "./pages/ZeunProviderDetails";
import ZeunProviderNetwork from "./pages/ZeunProviderNetwork";
import ZeunProviderReviews from "./pages/ZeunProviderReviews";
import ZeunProviderSearch from "./pages/ZeunProviderSearch";
import ZeunProviderSelection from "./pages/ZeunProviderSelection";
import ZeunRecallDetails from "./pages/ZeunRecallDetails";
import ZeunRecallTracking from "./pages/ZeunRecallTracking";
import ZeunRepairDetails from "./pages/ZeunRepairDetails";
import ZeunRepairEstimate from "./pages/ZeunRepairEstimate";
import ZeunRepairHistory from "./pages/ZeunRepairHistory";
import ZeunRepairTracking from "./pages/ZeunRepairTracking";
import ZeunReporting from "./pages/ZeunReporting";
import ZeunRoadsideAssistance from "./pages/ZeunRoadsideAssistance";
import ZeunShopDetails from "./pages/ZeunShopDetails";
import ZeunShopLocator from "./pages/ZeunShopLocator";
import ZeunTireManagement from "./pages/ZeunTireManagement";
import ZeunTireReplacement from "./pages/ZeunTireReplacement";
import ZeunTireRotation from "./pages/ZeunTireRotation";
import ZeunTowingRequest from "./pages/ZeunTowingRequest";
import ZeunVendorManagement from "./pages/ZeunVendorManagement";
import ZeunVendorPerformance from "./pages/ZeunVendorPerformance";
import ZeunWarrantyTracking from "./pages/ZeunWarrantyTracking";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/api-docs"} component={() => (<DashboardLayout><APIDocumentation /></DashboardLayout>)} />
      <Route path={"/api-keys"} component={() => (<DashboardLayout><APIKeys /></DashboardLayout>)} />
      <Route path={"/api-management"} component={() => (<DashboardLayout><APIManagement /></DashboardLayout>)} />
      <Route path={"/accessorial-charges"} component={() => (<DashboardLayout><AccessorialCharges /></DashboardLayout>)} />
      <Route path={"/accident-investigation"} component={() => (<DashboardLayout><AccidentInvestigation /></DashboardLayout>)} />
      <Route path={"/accident-report"} component={() => (<DashboardLayout><AccidentReport /></DashboardLayout>)} />
      <Route path={"/accident-reporting"} component={() => (<DashboardLayout><AccidentReporting /></DashboardLayout>)} />
      <Route path={"/account-deletion"} component={() => (<DashboardLayout><AccountDeletion /></DashboardLayout>)} />
      <Route path={"/account-preferences"} component={() => (<DashboardLayout><AccountPreferences /></DashboardLayout>)} />
      <Route path={"/account-settings"} component={() => (<DashboardLayout><AccountSettings /></DashboardLayout>)} />
      <Route path={"/achievements-badges"} component={() => (<DashboardLayout><AchievementsBadges /></DashboardLayout>)} />
      <Route path={"/active-convoys"} component={() => (<DashboardLayout><ActiveConvoys /></DashboardLayout>)} />
      <Route path={"/active-loads"} component={() => (<DashboardLayout><ActiveLoads /></DashboardLayout>)} />
      <Route path={"/activity-feed"} component={() => (<DashboardLayout><ActivityFeed /></DashboardLayout>)} />
      <Route path={"/activity-timeline"} component={() => (<DashboardLayout><ActivityTimeline /></DashboardLayout>)} />
      <Route path={"/admin/api-keys"} component={() => (<DashboardLayout><AdminAPIKeys /></DashboardLayout>)} />
      <Route path={"/admin/api-usage"} component={() => (<DashboardLayout><AdminAPIUsage /></DashboardLayout>)} />
      <Route path={"/admin/access-logs"} component={() => (<DashboardLayout><AdminAccessLogs /></DashboardLayout>)} />
      <Route path={"/admin/analytics-dashboard"} component={() => (<DashboardLayout><AdminAnalyticsDashboard /></DashboardLayout>)} />
      <Route path={"/admin/announcement-create"} component={() => (<DashboardLayout><AdminAnnouncementCreate /></DashboardLayout>)} />
      <Route path={"/admin/announcement-history"} component={() => (<DashboardLayout><AdminAnnouncementHistory /></DashboardLayout>)} />
      <Route path={"/admin/api-management"} component={() => (<DashboardLayout><AdminApiManagement /></DashboardLayout>)} />
      <Route path={"/admin/audit-logs"} component={() => (<DashboardLayout><AdminAuditLogs /></DashboardLayout>)} />
      <Route path={"/admin/audit-reports"} component={() => (<DashboardLayout><AdminAuditReports /></DashboardLayout>)} />
      <Route path={"/admin/audit-trail"} component={() => (<DashboardLayout><AdminAuditTrail /></DashboardLayout>)} />
      <Route path={"/admin/background-checks"} component={() => (<DashboardLayout><AdminBackgroundChecks /></DashboardLayout>)} />
      <Route path={"/admin/backup-settings"} component={() => (<DashboardLayout><AdminBackupSettings /></DashboardLayout>)} />
      <Route path={"/admin/billing"} component={() => (<DashboardLayout><AdminBilling /></DashboardLayout>)} />
      <Route path={"/admin/billing-dashboard"} component={() => (<DashboardLayout><AdminBillingDashboard /></DashboardLayout>)} />
      <Route path={"/admin/broker-approval"} component={() => (<DashboardLayout><AdminBrokerApproval /></DashboardLayout>)} />
      <Route path={"/admin/cache-monitor"} component={() => (<DashboardLayout><AdminCacheMonitor /></DashboardLayout>)} />
      <Route path={"/admin/capacity-report"} component={() => (<DashboardLayout><AdminCapacityReport /></DashboardLayout>)} />
      <Route path={"/admin/carrier-approval"} component={() => (<DashboardLayout><AdminCarrierApproval /></DashboardLayout>)} />
      <Route path={"/admin/changelog"} component={() => (<DashboardLayout><AdminChangelog /></DashboardLayout>)} />
      <Route path={"/admin/chargebacks"} component={() => (<DashboardLayout><AdminChargebacks /></DashboardLayout>)} />
      <Route path={"/admin/claims-management"} component={() => (<DashboardLayout><AdminClaimsManagement /></DashboardLayout>)} />
      <Route path={"/admin/commission-adjustments"} component={() => (<DashboardLayout><AdminCommissionAdjustments /></DashboardLayout>)} />
      <Route path={"/admin/communication-reports"} component={() => (<DashboardLayout><AdminCommunicationReports /></DashboardLayout>)} />
      <Route path={"/admin/company-audit"} component={() => (<DashboardLayout><AdminCompanyAudit /></DashboardLayout>)} />
      <Route path={"/admin/company-billing"} component={() => (<DashboardLayout><AdminCompanyBilling /></DashboardLayout>)} />
      <Route path={"/admin/company-create"} component={() => (<DashboardLayout><AdminCompanyCreate /></DashboardLayout>)} />
      <Route path={"/admin/company-details"} component={() => (<DashboardLayout><AdminCompanyDetails /></DashboardLayout>)} />
      <Route path={"/admin/company-directory"} component={() => (<DashboardLayout><AdminCompanyDirectory /></DashboardLayout>)} />
      <Route path={"/admin/company-documents"} component={() => (<DashboardLayout><AdminCompanyDocuments /></DashboardLayout>)} />
      <Route path={"/admin/company-edit"} component={() => (<DashboardLayout><AdminCompanyEdit /></DashboardLayout>)} />
      <Route path={"/admin/company-features"} component={() => (<DashboardLayout><AdminCompanyFeatures /></DashboardLayout>)} />
      <Route path={"/admin/company-onboarding"} component={() => (<DashboardLayout><AdminCompanyOnboarding /></DashboardLayout>)} />
      <Route path={"/admin/company-settings"} component={() => (<DashboardLayout><AdminCompanySettings /></DashboardLayout>)} />
      <Route path={"/admin/company-subscription"} component={() => (<DashboardLayout><AdminCompanySubscription /></DashboardLayout>)} />
      <Route path={"/admin/company-suspension"} component={() => (<DashboardLayout><AdminCompanySuspension /></DashboardLayout>)} />
      <Route path={"/admin/company-users"} component={() => (<DashboardLayout><AdminCompanyUsers /></DashboardLayout>)} />
      <Route path={"/admin/company-verification"} component={() => (<DashboardLayout><AdminCompanyVerification /></DashboardLayout>)} />
      <Route path={"/admin/compliance-reports"} component={() => (<DashboardLayout><AdminComplianceReports /></DashboardLayout>)} />
      <Route path={"/admin/content-management"} component={() => (<DashboardLayout><AdminContentManagement /></DashboardLayout>)} />
      <Route path={"/admin/custom-reports"} component={() => (<DashboardLayout><AdminCustomReports /></DashboardLayout>)} />
      <Route path={"/admin/dashboard"} component={() => (<DashboardLayout><AdminDashboard /></DashboardLayout>)} />
      <Route path={"/admin/data-export"} component={() => (<DashboardLayout><AdminDataExport /></DashboardLayout>)} />
      <Route path={"/admin/database-monitor"} component={() => (<DashboardLayout><AdminDatabaseMonitor /></DashboardLayout>)} />
      <Route path={"/admin/document-verification"} component={() => (<DashboardLayout><AdminDocumentVerification /></DashboardLayout>)} />
      <Route path={"/admin/driver-approval"} component={() => (<DashboardLayout><AdminDriverApproval /></DashboardLayout>)} />
      <Route path={"/admin/email-blast"} component={() => (<DashboardLayout><AdminEmailBlast /></DashboardLayout>)} />
      <Route path={"/admin/email-history"} component={() => (<DashboardLayout><AdminEmailHistory /></DashboardLayout>)} />
      <Route path={"/admin/email-settings"} component={() => (<DashboardLayout><AdminEmailSettings /></DashboardLayout>)} />
      <Route path={"/admin/error-monitor"} component={() => (<DashboardLayout><AdminErrorMonitor /></DashboardLayout>)} />
      <Route path={"/admin/faq-management"} component={() => (<DashboardLayout><AdminFAQManagement /></DashboardLayout>)} />
      <Route path={"/admin/feature-flags"} component={() => (<DashboardLayout><AdminFeatureFlags /></DashboardLayout>)} />
      <Route path={"/admin/feature-toggles"} component={() => (<DashboardLayout><AdminFeatureToggles /></DashboardLayout>)} />
      <Route path={"/admin/financial-reports"} component={() => (<DashboardLayout><AdminFinancialReports /></DashboardLayout>)} />
      <Route path={"/admin/fraud-alerts"} component={() => (<DashboardLayout><AdminFraudAlerts /></DashboardLayout>)} />
      <Route path={"/admin/glossary"} component={() => (<DashboardLayout><AdminGlossary /></DashboardLayout>)} />
      <Route path={"/admin/hazmat-verification"} component={() => (<DashboardLayout><AdminHazmatVerification /></DashboardLayout>)} />
      <Route path={"/admin/help-articles"} component={() => (<DashboardLayout><AdminHelpArticles /></DashboardLayout>)} />
      <Route path={"/admin/ip-whitelist"} component={() => (<DashboardLayout><AdminIPWhitelist /></DashboardLayout>)} />
      <Route path={"/admin/insurance-verification"} component={() => (<DashboardLayout><AdminInsuranceVerification /></DashboardLayout>)} />
      <Route path={"/admin/integration-hub"} component={() => (<DashboardLayout><AdminIntegrationHub /></DashboardLayout>)} />
      <Route path={"/admin/integrations"} component={() => (<DashboardLayout><AdminIntegrations /></DashboardLayout>)} />
      <Route path={"/admin/invoice-details"} component={() => (<DashboardLayout><AdminInvoiceDetails /></DashboardLayout>)} />
      <Route path={"/admin/invoices"} component={() => (<DashboardLayout><AdminInvoices /></DashboardLayout>)} />
      <Route path={"/admin/license-verification"} component={() => (<DashboardLayout><AdminLicenseVerification /></DashboardLayout>)} />
      <Route path={"/admin/load-adjustments"} component={() => (<DashboardLayout><AdminLoadAdjustments /></DashboardLayout>)} />
      <Route path={"/admin/load-cancellations"} component={() => (<DashboardLayout><AdminLoadCancellations /></DashboardLayout>)} />
      <Route path={"/admin/load-details"} component={() => (<DashboardLayout><AdminLoadDetails /></DashboardLayout>)} />
      <Route path={"/admin/load-disputes"} component={() => (<DashboardLayout><AdminLoadDisputes /></DashboardLayout>)} />
      <Route path={"/admin/load-management"} component={() => (<DashboardLayout><AdminLoadManagement /></DashboardLayout>)} />
      <Route path={"/admin/maintenance-mode"} component={() => (<DashboardLayout><AdminMaintenanceMode /></DashboardLayout>)} />
      <Route path={"/admin/market-analytics"} component={() => (<DashboardLayout><AdminMarketAnalytics /></DashboardLayout>)} />
      <Route path={"/admin/medical-verification"} component={() => (<DashboardLayout><AdminMedicalVerification /></DashboardLayout>)} />
      <Route path={"/admin/notification-rules"} component={() => (<DashboardLayout><AdminNotificationRules /></DashboardLayout>)} />
      <Route path={"/admin/notification-templates"} component={() => (<DashboardLayout><AdminNotificationTemplates /></DashboardLayout>)} />
      <Route path={"/admin/onboarding-flows"} component={() => (<DashboardLayout><AdminOnboardingFlows /></DashboardLayout>)} />
      <Route path={"/admin/operations-report"} component={() => (<DashboardLayout><AdminOperationsReport /></DashboardLayout>)} />
      <Route path={"/admin/password-reset"} component={() => (<DashboardLayout><AdminPasswordReset /></DashboardLayout>)} />
      <Route path={"/admin/payment-details"} component={() => (<DashboardLayout><AdminPaymentDetails /></DashboardLayout>)} />
      <Route path={"/admin/payment-disputes"} component={() => (<DashboardLayout><AdminPaymentDisputes /></DashboardLayout>)} />
      <Route path={"/admin/payment-gateways"} component={() => (<DashboardLayout><AdminPaymentGateways /></DashboardLayout>)} />
      <Route path={"/admin/payments"} component={() => (<DashboardLayout><AdminPayments /></DashboardLayout>)} />
      <Route path={"/admin/payout-settings"} component={() => (<DashboardLayout><AdminPayoutSettings /></DashboardLayout>)} />
      <Route path={"/admin/performance-monitor"} component={() => (<DashboardLayout><AdminPerformanceMonitor /></DashboardLayout>)} />
      <Route path={"/admin/permission-matrix"} component={() => (<DashboardLayout><AdminPermissionMatrix /></DashboardLayout>)} />
      <Route path={"/admin/platform-fee-overrides"} component={() => (<DashboardLayout><AdminPlatformFeeOverrides /></DashboardLayout>)} />
      <Route path={"/admin/platform-fees"} component={() => (<DashboardLayout><AdminPlatformFees /></DashboardLayout>)} />
      <Route path={"/admin/pricing-tiers"} component={() => (<DashboardLayout><AdminPricingTiers /></DashboardLayout>)} />
      <Route path={"/admin/push-notifications"} component={() => (<DashboardLayout><AdminPushNotifications /></DashboardLayout>)} />
      <Route path={"/admin/queue-monitor"} component={() => (<DashboardLayout><AdminQueueMonitor /></DashboardLayout>)} />
      <Route path={"/admin/rss-feeds"} component={() => (<DashboardLayout><AdminRSSFeeds /></DashboardLayout>)} />
      <Route path={"/admin/rate-limiting"} component={() => (<DashboardLayout><AdminRateLimiting /></DashboardLayout>)} />
      <Route path={"/admin/refunds"} component={() => (<DashboardLayout><AdminRefunds /></DashboardLayout>)} />
      <Route path={"/admin/release-notes"} component={() => (<DashboardLayout><AdminReleaseNotes /></DashboardLayout>)} />
      <Route path={"/admin/report-generator"} component={() => (<DashboardLayout><AdminReportGenerator /></DashboardLayout>)} />
      <Route path={"/admin/report-scheduler"} component={() => (<DashboardLayout><AdminReportScheduler /></DashboardLayout>)} />
      <Route path={"/admin/reporting"} component={() => (<DashboardLayout><AdminReporting /></DashboardLayout>)} />
      <Route path={"/admin/reports-dashboard"} component={() => (<DashboardLayout><AdminReportsDashboard /></DashboardLayout>)} />
      <Route path={"/admin/revenue-report"} component={() => (<DashboardLayout><AdminRevenueReport /></DashboardLayout>)} />
      <Route path={"/admin/role-management"} component={() => (<DashboardLayout><AdminRoleManagement /></DashboardLayout>)} />
      <Route path={"/admin/sms-blast"} component={() => (<DashboardLayout><AdminSMSBlast /></DashboardLayout>)} />
      <Route path={"/admin/sms-history"} component={() => (<DashboardLayout><AdminSMSHistory /></DashboardLayout>)} />
      <Route path={"/admin/sms-settings"} component={() => (<DashboardLayout><AdminSMSSettings /></DashboardLayout>)} />
      <Route path={"/admin/safety-reports"} component={() => (<DashboardLayout><AdminSafetyReports /></DashboardLayout>)} />
      <Route path={"/admin/security-alerts"} component={() => (<DashboardLayout><AdminSecurityAlerts /></DashboardLayout>)} />
      <Route path={"/admin/security-reports"} component={() => (<DashboardLayout><AdminSecurityReports /></DashboardLayout>)} />
      <Route path={"/admin/shipper-approval"} component={() => (<DashboardLayout><AdminShipperApproval /></DashboardLayout>)} />
      <Route path={"/admin/storage-settings"} component={() => (<DashboardLayout><AdminStorageSettings /></DashboardLayout>)} />
      <Route path={"/admin/subscriptions"} component={() => (<DashboardLayout><AdminSubscriptions /></DashboardLayout>)} />
      <Route path={"/admin/support-assignment"} component={() => (<DashboardLayout><AdminSupportAssignment /></DashboardLayout>)} />
      <Route path={"/admin/support-canned-responses"} component={() => (<DashboardLayout><AdminSupportCannedResponses /></DashboardLayout>)} />
      <Route path={"/admin/support-chat"} component={() => (<DashboardLayout><AdminSupportChat /></DashboardLayout>)} />
      <Route path={"/admin/support-dashboard"} component={() => (<DashboardLayout><AdminSupportDashboard /></DashboardLayout>)} />
      <Route path={"/admin/support-escalation"} component={() => (<DashboardLayout><AdminSupportEscalation /></DashboardLayout>)} />
      <Route path={"/admin/support-faq"} component={() => (<DashboardLayout><AdminSupportFAQ /></DashboardLayout>)} />
      <Route path={"/admin/support-knowledge-base"} component={() => (<DashboardLayout><AdminSupportKnowledgeBase /></DashboardLayout>)} />
      <Route path={"/admin/support-metrics"} component={() => (<DashboardLayout><AdminSupportMetrics /></DashboardLayout>)} />
      <Route path={"/admin/support-reports"} component={() => (<DashboardLayout><AdminSupportReports /></DashboardLayout>)} />
      <Route path={"/admin/support-sla"} component={() => (<DashboardLayout><AdminSupportSLA /></DashboardLayout>)} />
      <Route path={"/admin/support-ticket-details"} component={() => (<DashboardLayout><AdminSupportTicketDetails /></DashboardLayout>)} />
      <Route path={"/admin/support-tickets"} component={() => (<DashboardLayout><AdminSupportTickets /></DashboardLayout>)} />
      <Route path={"/admin/system-health"} component={() => (<DashboardLayout><AdminSystemHealth /></DashboardLayout>)} />
      <Route path={"/admin/system-logs"} component={() => (<DashboardLayout><AdminSystemLogs /></DashboardLayout>)} />
      <Route path={"/admin/system-monitor"} component={() => (<DashboardLayout><AdminSystemMonitor /></DashboardLayout>)} />
      <Route path={"/admin/system-settings"} component={() => (<DashboardLayout><AdminSystemSettings /></DashboardLayout>)} />
      <Route path={"/admin/telemetry"} component={() => (<DashboardLayout><AdminTelemetry /></DashboardLayout>)} />
      <Route path={"/admin/terminal-approval"} component={() => (<DashboardLayout><AdminTerminalApproval /></DashboardLayout>)} />
      <Route path={"/admin/user-activity"} component={() => (<DashboardLayout><AdminUserActivity /></DashboardLayout>)} />
      <Route path={"/admin/user-bulk-actions"} component={() => (<DashboardLayout><AdminUserBulkActions /></DashboardLayout>)} />
      <Route path={"/admin/user-create"} component={() => (<DashboardLayout><AdminUserCreate /></DashboardLayout>)} />
      <Route path={"/admin/user-deletion"} component={() => (<DashboardLayout><AdminUserDeletion /></DashboardLayout>)} />
      <Route path={"/admin/user-details"} component={() => (<DashboardLayout><AdminUserDetails /></DashboardLayout>)} />
      <Route path={"/admin/user-directory"} component={() => (<DashboardLayout><AdminUserDirectory /></DashboardLayout>)} />
      <Route path={"/admin/user-edit"} component={() => (<DashboardLayout><AdminUserEdit /></DashboardLayout>)} />
      <Route path={"/admin/user-export"} component={() => (<DashboardLayout><AdminUserExport /></DashboardLayout>)} />
      <Route path={"/admin/user-impersonation"} component={() => (<DashboardLayout><AdminUserImpersonation /></DashboardLayout>)} />
      <Route path={"/admin/user-import"} component={() => (<DashboardLayout><AdminUserImport /></DashboardLayout>)} />
      <Route path={"/admin/user-management"} component={() => (<DashboardLayout><AdminUserManagement /></DashboardLayout>)} />
      <Route path={"/admin/user-merge"} component={() => (<DashboardLayout><AdminUserMerge /></DashboardLayout>)} />
      <Route path={"/admin/user-notifications"} component={() => (<DashboardLayout><AdminUserNotifications /></DashboardLayout>)} />
      <Route path={"/admin/user-onboarding"} component={() => (<DashboardLayout><AdminUserOnboarding /></DashboardLayout>)} />
      <Route path={"/admin/user-permissions"} component={() => (<DashboardLayout><AdminUserPermissions /></DashboardLayout>)} />
      <Route path={"/admin/user-preferences"} component={() => (<DashboardLayout><AdminUserPreferences /></DashboardLayout>)} />
      <Route path={"/admin/user-reports"} component={() => (<DashboardLayout><AdminUserReports /></DashboardLayout>)} />
      <Route path={"/admin/user-roles"} component={() => (<DashboardLayout><AdminUserRoles /></DashboardLayout>)} />
      <Route path={"/admin/user-sessions"} component={() => (<DashboardLayout><AdminUserSessions /></DashboardLayout>)} />
      <Route path={"/admin/user-suspension"} component={() => (<DashboardLayout><AdminUserSuspension /></DashboardLayout>)} />
      <Route path={"/admin/user-verification"} component={() => (<DashboardLayout><AdminUserVerification /></DashboardLayout>)} />
      <Route path={"/admin/verification-dashboard"} component={() => (<DashboardLayout><AdminVerificationDashboard /></DashboardLayout>)} />
      <Route path={"/admin/video-tutorials"} component={() => (<DashboardLayout><AdminVideoTutorials /></DashboardLayout>)} />
      <Route path={"/admin/webhook-management"} component={() => (<DashboardLayout><AdminWebhookManagement /></DashboardLayout>)} />
      <Route path={"/alert-management"} component={() => (<DashboardLayout><AlertManagement /></DashboardLayout>)} />
      <Route path={"/analytics"} component={() => (<DashboardLayout><Analytics /></DashboardLayout>)} />
      <Route path={"/announcements"} component={() => (<DashboardLayout><Announcements /></DashboardLayout>)} />
      <Route path={"/appointment-scheduler"} component={() => (<DashboardLayout><AppointmentScheduler /></DashboardLayout>)} />
      <Route path={"/appointment-scheduling"} component={() => (<DashboardLayout><AppointmentScheduling /></DashboardLayout>)} />
      <Route path={"/assigned-loads"} component={() => (<DashboardLayout><AssignedLoads /></DashboardLayout>)} />
      <Route path={"/audit-log"} component={() => (<DashboardLayout><AuditLog /></DashboardLayout>)} />
      <Route path={"/audit-logs"} component={() => (<DashboardLayout><AuditLogs /></DashboardLayout>)} />
      <Route path={"/audits"} component={() => (<DashboardLayout><Audits /></DashboardLayout>)} />
      <Route path={"/bol-generation"} component={() => (<DashboardLayout><BOLGeneration /></DashboardLayout>)} />
      <Route path={"/bol-management"} component={() => (<DashboardLayout><BOLManagement /></DashboardLayout>)} />
      <Route path={"/background-checks"} component={() => (<DashboardLayout><BackgroundChecks /></DashboardLayout>)} />
      <Route path={"/backup-management"} component={() => (<DashboardLayout><BackupManagement /></DashboardLayout>)} />
      <Route path={"/benefits-management"} component={() => (<DashboardLayout><BenefitsManagement /></DashboardLayout>)} />
      <Route path={"/bid-analysis"} component={() => (<DashboardLayout><BidAnalysis /></DashboardLayout>)} />
      <Route path={"/bid-details"} component={() => (<DashboardLayout><BidDetails /></DashboardLayout>)} />
      <Route path={"/bid-history"} component={() => (<DashboardLayout><BidHistory /></DashboardLayout>)} />
      <Route path={"/bid-management"} component={() => (<DashboardLayout><BidManagement /></DashboardLayout>)} />
      <Route path={"/billing"} component={() => (<DashboardLayout><Billing /></DashboardLayout>)} />
      <Route path={"/billing-history"} component={() => (<DashboardLayout><BillingHistory /></DashboardLayout>)} />
      <Route path={"/billing-settings"} component={() => (<DashboardLayout><BillingSettings /></DashboardLayout>)} />
      <Route path={"/bookmarks"} component={() => (<DashboardLayout><Bookmarks /></DashboardLayout>)} />
      <Route path={"/broadcast-messages"} component={() => (<DashboardLayout><BroadcastMessages /></DashboardLayout>)} />
      <Route path={"/broker/agent-scorecard"} component={() => (<DashboardLayout><BrokerAgentScorecard /></DashboardLayout>)} />
      <Route path={"/broker/analytics"} component={() => (<DashboardLayout><BrokerAnalytics /></DashboardLayout>)} />
      <Route path={"/broker/auto-bidding"} component={() => (<DashboardLayout><BrokerAutoBidding /></DashboardLayout>)} />
      <Route path={"/broker/bol-management"} component={() => (<DashboardLayout><BrokerBOLManagement /></DashboardLayout>)} />
      <Route path={"/broker/bid-analytics"} component={() => (<DashboardLayout><BrokerBidAnalytics /></DashboardLayout>)} />
      <Route path={"/broker/bid-comparison"} component={() => (<DashboardLayout><BrokerBidComparison /></DashboardLayout>)} />
      <Route path={"/broker/bid-management"} component={() => (<DashboardLayout><BrokerBidManagement /></DashboardLayout>)} />
      <Route path={"/broker/bid-negotiation"} component={() => (<DashboardLayout><BrokerBidNegotiation /></DashboardLayout>)} />
      <Route path={"/broker/billing-disputes"} component={() => (<DashboardLayout><BrokerBillingDisputes /></DashboardLayout>)} />
      <Route path={"/broker/bulk-load-upload"} component={() => (<DashboardLayout><BrokerBulkLoadUpload /></DashboardLayout>)} />
      <Route path={"/broker/capacity-report"} component={() => (<DashboardLayout><BrokerCapacityReport /></DashboardLayout>)} />
      <Route path={"/broker/carrier-blacklist"} component={() => (<DashboardLayout><BrokerCarrierBlacklist /></DashboardLayout>)} />
      <Route path={"/broker/carrier-capacity"} component={() => (<DashboardLayout><BrokerCarrierCapacity /></DashboardLayout>)} />
      <Route path={"/broker/carrier-compliance"} component={() => (<DashboardLayout><BrokerCarrierCompliance /></DashboardLayout>)} />
      <Route path={"/broker/carrier-contracts"} component={() => (<DashboardLayout><BrokerCarrierContracts /></DashboardLayout>)} />
      <Route path={"/broker/carrier-cost-analysis"} component={() => (<DashboardLayout><BrokerCarrierCostAnalysis /></DashboardLayout>)} />
      <Route path={"/broker/carrier-documents"} component={() => (<DashboardLayout><BrokerCarrierDocuments /></DashboardLayout>)} />
      <Route path={"/broker/carrier-insurance"} component={() => (<DashboardLayout><BrokerCarrierInsurance /></DashboardLayout>)} />
      <Route path={"/broker/carrier-invite"} component={() => (<DashboardLayout><BrokerCarrierInvite /></DashboardLayout>)} />
      <Route path={"/broker/carrier-network"} component={() => (<DashboardLayout><BrokerCarrierNetwork /></DashboardLayout>)} />
      <Route path={"/broker/carrier-notes"} component={() => (<DashboardLayout><BrokerCarrierNotes /></DashboardLayout>)} />
      <Route path={"/broker/carrier-onboarding"} component={() => (<DashboardLayout><BrokerCarrierOnboarding /></DashboardLayout>)} />
      <Route path={"/broker/carrier-pay-terms"} component={() => (<DashboardLayout><BrokerCarrierPayTerms /></DashboardLayout>)} />
      <Route path={"/broker/carrier-performance"} component={() => (<DashboardLayout><BrokerCarrierPerformance /></DashboardLayout>)} />
      <Route path={"/broker/carrier-preferred"} component={() => (<DashboardLayout><BrokerCarrierPreferred /></DashboardLayout>)} />
      <Route path={"/broker/carrier-prequalification"} component={() => (<DashboardLayout><BrokerCarrierPrequalification /></DashboardLayout>)} />
      <Route path={"/broker/carrier-ratings"} component={() => (<DashboardLayout><BrokerCarrierRatings /></DashboardLayout>)} />
      <Route path={"/broker/carrier-scorecard"} component={() => (<DashboardLayout><BrokerCarrierScorecard /></DashboardLayout>)} />
      <Route path={"/broker/carrier-search"} component={() => (<DashboardLayout><BrokerCarrierSearch /></DashboardLayout>)} />
      <Route path={"/broker/carrier-tiers"} component={() => (<DashboardLayout><BrokerCarrierTiers /></DashboardLayout>)} />
      <Route path={"/broker/carrier-vetting"} component={() => (<DashboardLayout><BrokerCarrierVetting /></DashboardLayout>)} />
      <Route path={"/broker/carriers"} component={() => (<DashboardLayout><BrokerCarriers /></DashboardLayout>)} />
      <Route path={"/broker/cash-flow"} component={() => (<DashboardLayout><BrokerCashFlow /></DashboardLayout>)} />
      <Route path={"/broker/check-calls"} component={() => (<DashboardLayout><BrokerCheckCalls /></DashboardLayout>)} />
      <Route path={"/broker/claims-report"} component={() => (<DashboardLayout><BrokerClaimsReport /></DashboardLayout>)} />
      <Route path={"/broker/commission-detail"} component={() => (<DashboardLayout><BrokerCommissionDetail /></DashboardLayout>)} />
      <Route path={"/broker/commission-report"} component={() => (<DashboardLayout><BrokerCommissionReport /></DashboardLayout>)} />
      <Route path={"/broker/commission-settings"} component={() => (<DashboardLayout><BrokerCommissionSettings /></DashboardLayout>)} />
      <Route path={"/broker/compliance"} component={() => (<DashboardLayout><BrokerCompliance /></DashboardLayout>)} />
      <Route path={"/broker/contract-quotes"} component={() => (<DashboardLayout><BrokerContractQuotes /></DashboardLayout>)} />
      <Route path={"/broker/counter-offers"} component={() => (<DashboardLayout><BrokerCounterOffers /></DashboardLayout>)} />
      <Route path={"/broker/cross-border-loads"} component={() => (<DashboardLayout><BrokerCrossBorderLoads /></DashboardLayout>)} />
      <Route path={"/broker/custom-reports"} component={() => (<DashboardLayout><BrokerCustomReports /></DashboardLayout>)} />
      <Route path={"/broker/customer-billing"} component={() => (<DashboardLayout><BrokerCustomerBilling /></DashboardLayout>)} />
      <Route path={"/broker/customer-contracts"} component={() => (<DashboardLayout><BrokerCustomerContracts /></DashboardLayout>)} />
      <Route path={"/broker/customer-credit-check"} component={() => (<DashboardLayout><BrokerCustomerCreditCheck /></DashboardLayout>)} />
      <Route path={"/broker/customer-history"} component={() => (<DashboardLayout><BrokerCustomerHistory /></DashboardLayout>)} />
      <Route path={"/broker/customer-management"} component={() => (<DashboardLayout><BrokerCustomerManagement /></DashboardLayout>)} />
      <Route path={"/broker/customer-notes"} component={() => (<DashboardLayout><BrokerCustomerNotes /></DashboardLayout>)} />
      <Route path={"/broker/customer-onboard"} component={() => (<DashboardLayout><BrokerCustomerOnboard /></DashboardLayout>)} />
      <Route path={"/broker/customer-portfolio"} component={() => (<DashboardLayout><BrokerCustomerPortfolio /></DashboardLayout>)} />
      <Route path={"/broker/customer-profitability"} component={() => (<DashboardLayout><BrokerCustomerProfitability /></DashboardLayout>)} />
      <Route path={"/broker/customer-rating"} component={() => (<DashboardLayout><BrokerCustomerRating /></DashboardLayout>)} />
      <Route path={"/broker/customer-reports"} component={() => (<DashboardLayout><BrokerCustomerReports /></DashboardLayout>)} />
      <Route path={"/broker/customer-search"} component={() => (<DashboardLayout><BrokerCustomerSearch /></DashboardLayout>)} />
      <Route path={"/broker/dashboard"} component={() => (<DashboardLayout><BrokerDashboard /></DashboardLayout>)} />
      <Route path={"/broker/dispatch-assignment"} component={() => (<DashboardLayout><BrokerDispatchAssignment /></DashboardLayout>)} />
      <Route path={"/broker/dispatch-board"} component={() => (<DashboardLayout><BrokerDispatchBoard /></DashboardLayout>)} />
      <Route path={"/broker/eta-management"} component={() => (<DashboardLayout><BrokerETAManagement /></DashboardLayout>)} />
      <Route path={"/broker/exception-alerts"} component={() => (<DashboardLayout><BrokerExceptionAlerts /></DashboardLayout>)} />
      <Route path={"/broker/goal-tracking"} component={() => (<DashboardLayout><BrokerGoalTracking /></DashboardLayout>)} />
      <Route path={"/broker/hazmat-loads"} component={() => (<DashboardLayout><BrokerHazmatLoads /></DashboardLayout>)} />
      <Route path={"/broker/incentive-programs"} component={() => (<DashboardLayout><BrokerIncentivePrograms /></DashboardLayout>)} />
      <Route path={"/broker/invoice-details"} component={() => (<DashboardLayout><BrokerInvoiceDetails /></DashboardLayout>)} />
      <Route path={"/broker/invoice-generation"} component={() => (<DashboardLayout><BrokerInvoiceGeneration /></DashboardLayout>)} />
      <Route path={"/broker/invoice-history"} component={() => (<DashboardLayout><BrokerInvoiceHistory /></DashboardLayout>)} />
      <Route path={"/broker/invoice-queue"} component={() => (<DashboardLayout><BrokerInvoiceQueue /></DashboardLayout>)} />
      <Route path={"/broker/lane-profitability"} component={() => (<DashboardLayout><BrokerLaneProfitability /></DashboardLayout>)} />
      <Route path={"/broker/lane-rates"} component={() => (<DashboardLayout><BrokerLaneRates /></DashboardLayout>)} />
      <Route path={"/broker/load-archive"} component={() => (<DashboardLayout><BrokerLoadArchive /></DashboardLayout>)} />
      <Route path={"/broker/load-assignment"} component={() => (<DashboardLayout><BrokerLoadAssignment /></DashboardLayout>)} />
      <Route path={"/broker/load-board"} component={() => (<DashboardLayout><BrokerLoadBoard /></DashboardLayout>)} />
      <Route path={"/broker/load-cancellation"} component={() => (<DashboardLayout><BrokerLoadCancellation /></DashboardLayout>)} />
      <Route path={"/broker/load-cloning"} component={() => (<DashboardLayout><BrokerLoadCloning /></DashboardLayout>)} />
      <Route path={"/broker/load-consolidation"} component={() => (<DashboardLayout><BrokerLoadConsolidation /></DashboardLayout>)} />
      <Route path={"/broker/load-creation"} component={() => (<DashboardLayout><BrokerLoadCreation /></DashboardLayout>)} />
      <Route path={"/broker/load-matching"} component={() => (<DashboardLayout><BrokerLoadMatching /></DashboardLayout>)} />
      <Route path={"/broker/load-modification"} component={() => (<DashboardLayout><BrokerLoadModification /></DashboardLayout>)} />
      <Route path={"/broker/load-prioritization"} component={() => (<DashboardLayout><BrokerLoadPrioritization /></DashboardLayout>)} />
      <Route path={"/broker/load-profitability"} component={() => (<DashboardLayout><BrokerLoadProfitability /></DashboardLayout>)} />
      <Route path={"/broker/load-split"} component={() => (<DashboardLayout><BrokerLoadSplit /></DashboardLayout>)} />
      <Route path={"/broker/load-status-board"} component={() => (<DashboardLayout><BrokerLoadStatusBoard /></DashboardLayout>)} />
      <Route path={"/broker/load-templates"} component={() => (<DashboardLayout><BrokerLoadTemplates /></DashboardLayout>)} />
      <Route path={"/broker/margin-analysis"} component={() => (<DashboardLayout><BrokerMarginAnalysis /></DashboardLayout>)} />
      <Route path={"/broker/margin-report"} component={() => (<DashboardLayout><BrokerMarginReport /></DashboardLayout>)} />
      <Route path={"/broker/marketplace"} component={() => (<DashboardLayout><BrokerMarketplace /></DashboardLayout>)} />
      <Route path={"/broker/multi-stop-loads"} component={() => (<DashboardLayout><BrokerMultiStopLoads /></DashboardLayout>)} />
      <Route path={"/broker/on-time-report"} component={() => (<DashboardLayout><BrokerOnTimeReport /></DashboardLayout>)} />
      <Route path={"/broker/oversized-loads"} component={() => (<DashboardLayout><BrokerOversizedLoads /></DashboardLayout>)} />
      <Route path={"/broker/pod-management"} component={() => (<DashboardLayout><BrokerPODManagement /></DashboardLayout>)} />
      <Route path={"/broker/payable-details"} component={() => (<DashboardLayout><BrokerPayableDetails /></DashboardLayout>)} />
      <Route path={"/broker/payables-aging"} component={() => (<DashboardLayout><BrokerPayablesAging /></DashboardLayout>)} />
      <Route path={"/broker/payables-queue"} component={() => (<DashboardLayout><BrokerPayablesQueue /></DashboardLayout>)} />
      <Route path={"/broker/payment-processing"} component={() => (<DashboardLayout><BrokerPaymentProcessing /></DashboardLayout>)} />
      <Route path={"/broker/payments"} component={() => (<DashboardLayout><BrokerPayments /></DashboardLayout>)} />
      <Route path={"/broker/profit-report"} component={() => (<DashboardLayout><BrokerProfitReport /></DashboardLayout>)} />
      <Route path={"/broker/quote-builder"} component={() => (<DashboardLayout><BrokerQuoteBuilder /></DashboardLayout>)} />
      <Route path={"/broker/rfp-create"} component={() => (<DashboardLayout><BrokerRFPCreate /></DashboardLayout>)} />
      <Route path={"/broker/rfp-management"} component={() => (<DashboardLayout><BrokerRFPManagement /></DashboardLayout>)} />
      <Route path={"/broker/rfp-responses"} component={() => (<DashboardLayout><BrokerRFPResponses /></DashboardLayout>)} />
      <Route path={"/broker/rate-negotiation-history"} component={() => (<DashboardLayout><BrokerRateNegotiationHistory /></DashboardLayout>)} />
      <Route path={"/broker/receivables-aging"} component={() => (<DashboardLayout><BrokerReceivablesAging /></DashboardLayout>)} />
      <Route path={"/broker/recurring-loads"} component={() => (<DashboardLayout><BrokerRecurringLoads /></DashboardLayout>)} />
      <Route path={"/broker/reefer-loads"} component={() => (<DashboardLayout><BrokerReeferLoads /></DashboardLayout>)} />
      <Route path={"/broker/revenue-report"} component={() => (<DashboardLayout><BrokerRevenueReport /></DashboardLayout>)} />
      <Route path={"/broker/service-report"} component={() => (<DashboardLayout><BrokerServiceReport /></DashboardLayout>)} />
      <Route path={"/broker/shipper-management"} component={() => (<DashboardLayout><BrokerShipperManagement /></DashboardLayout>)} />
      <Route path={"/broker/spot-quotes"} component={() => (<DashboardLayout><BrokerSpotQuotes /></DashboardLayout>)} />
      <Route path={"/broker/status-updates"} component={() => (<DashboardLayout><BrokerStatusUpdates /></DashboardLayout>)} />
      <Route path={"/broker/team-management"} component={() => (<DashboardLayout><BrokerTeamManagement /></DashboardLayout>)} />
      <Route path={"/broker/team-performance"} component={() => (<DashboardLayout><BrokerTeamPerformance /></DashboardLayout>)} />
      <Route path={"/broker/tracking-dashboard"} component={() => (<DashboardLayout><BrokerTrackingDashboard /></DashboardLayout>)} />
      <Route path={"/broker/tracking-details"} component={() => (<DashboardLayout><BrokerTrackingDetails /></DashboardLayout>)} />
      <Route path={"/broker/trend-analysis"} component={() => (<DashboardLayout><BrokerTrendAnalysis /></DashboardLayout>)} />
      <Route path={"/broker/volume-report"} component={() => (<DashboardLayout><BrokerVolumeReport /></DashboardLayout>)} />
      <Route path={"/csa-scores"} component={() => (<DashboardLayout><CSAScores /></DashboardLayout>)} />
      <Route path={"/csa-scores-dashboard"} component={() => (<DashboardLayout><CSAScoresDashboard /></DashboardLayout>)} />
      <Route path={"/cache-management"} component={() => (<DashboardLayout><CacheManagement /></DashboardLayout>)} />
      <Route path={"/capacity-board"} component={() => (<DashboardLayout><CapacityBoard /></DashboardLayout>)} />
      <Route path={"/carrier/accessorials"} component={() => (<DashboardLayout><CarrierAccessorials /></DashboardLayout>)} />
      <Route path={"/carrier/analytics"} component={() => (<DashboardLayout><CarrierAnalytics /></DashboardLayout>)} />
      <Route path={"/carrier/asset-tracking"} component={() => (<DashboardLayout><CarrierAssetTracking /></DashboardLayout>)} />
      <Route path={"/carrier/audit-prep"} component={() => (<DashboardLayout><CarrierAuditPrep /></DashboardLayout>)} />
      <Route path={"/carrier/authority-docs"} component={() => (<DashboardLayout><CarrierAuthorityDocs /></DashboardLayout>)} />
      <Route path={"/carrier/backhaul"} component={() => (<DashboardLayout><CarrierBackhaul /></DashboardLayout>)} />
      <Route path={"/carrier/bid-history"} component={() => (<DashboardLayout><CarrierBidHistory /></DashboardLayout>)} />
      <Route path={"/carrier/bid-submission"} component={() => (<DashboardLayout><CarrierBidSubmission /></DashboardLayout>)} />
      <Route path={"/carrier/bid-submit"} component={() => (<DashboardLayout><CarrierBidSubmit /></DashboardLayout>)} />
      <Route path={"/carrier/bidding"} component={() => (<DashboardLayout><CarrierBidding /></DashboardLayout>)} />
      <Route path={"/carrier/capacity-board"} component={() => (<DashboardLayout><CarrierCapacityBoard /></DashboardLayout>)} />
      <Route path={"/carrier/capacity-calendar"} component={() => (<DashboardLayout><CarrierCapacityCalendar /></DashboardLayout>)} />
      <Route path={"/carrier/capacity-management"} component={() => (<DashboardLayout><CarrierCapacityManagement /></DashboardLayout>)} />
      <Route path={"/carrier/capacity-posting"} component={() => (<DashboardLayout><CarrierCapacityPosting /></DashboardLayout>)} />
      <Route path={"/carrier/cash-flow"} component={() => (<DashboardLayout><CarrierCashFlow /></DashboardLayout>)} />
      <Route path={"/carrier/claims-report"} component={() => (<DashboardLayout><CarrierClaimsReport /></DashboardLayout>)} />
      <Route path={"/carrier/compliance"} component={() => (<DashboardLayout><CarrierCompliance /></DashboardLayout>)} />
      <Route path={"/carrier/contract-rates"} component={() => (<DashboardLayout><CarrierContractRates /></DashboardLayout>)} />
      <Route path={"/carrier/cost-per-mile"} component={() => (<DashboardLayout><CarrierCostPerMile /></DashboardLayout>)} />
      <Route path={"/carrier/custom-reports"} component={() => (<DashboardLayout><CarrierCustomReports /></DashboardLayout>)} />
      <Route path={"/carrier/dashboard"} component={() => (<DashboardLayout><CarrierDashboard /></DashboardLayout>)} />
      <Route path={"/carrier/deadhead-minimizer"} component={() => (<DashboardLayout><CarrierDeadheadMinimizer /></DashboardLayout>)} />
      <Route path={"/carrier/deadhead-report"} component={() => (<DashboardLayout><CarrierDeadheadReport /></DashboardLayout>)} />
      <Route path={"/carrier/details"} component={() => (<DashboardLayout><CarrierDetails /></DashboardLayout>)} />
      <Route path={"/carrier/directory"} component={() => (<DashboardLayout><CarrierDirectory /></DashboardLayout>)} />
      <Route path={"/carrier/dispatch-board"} component={() => (<DashboardLayout><CarrierDispatchBoard /></DashboardLayout>)} />
      <Route path={"/carrier/document-vault"} component={() => (<DashboardLayout><CarrierDocumentVault /></DashboardLayout>)} />
      <Route path={"/carrier/driver-assignments"} component={() => (<DashboardLayout><CarrierDriverAssignments /></DashboardLayout>)} />
      <Route path={"/carrier/driver-availability"} component={() => (<DashboardLayout><CarrierDriverAvailability /></DashboardLayout>)} />
      <Route path={"/carrier/driver-communication"} component={() => (<DashboardLayout><CarrierDriverCommunication /></DashboardLayout>)} />
      <Route path={"/carrier/driver-compliance"} component={() => (<DashboardLayout><CarrierDriverCompliance /></DashboardLayout>)} />
      <Route path={"/carrier/driver-directory"} component={() => (<DashboardLayout><CarrierDriverDirectory /></DashboardLayout>)} />
      <Route path={"/carrier/driver-documents"} component={() => (<DashboardLayout><CarrierDriverDocuments /></DashboardLayout>)} />
      <Route path={"/carrier/driver-management"} component={() => (<DashboardLayout><CarrierDriverManagement /></DashboardLayout>)} />
      <Route path={"/carrier/driver-onboard"} component={() => (<DashboardLayout><CarrierDriverOnboard /></DashboardLayout>)} />
      <Route path={"/carrier/driver-payroll"} component={() => (<DashboardLayout><CarrierDriverPayroll /></DashboardLayout>)} />
      <Route path={"/carrier/driver-performance"} component={() => (<DashboardLayout><CarrierDriverPerformance /></DashboardLayout>)} />
      <Route path={"/carrier/driver-schedule"} component={() => (<DashboardLayout><CarrierDriverSchedule /></DashboardLayout>)} />
      <Route path={"/carrier/driver-scoring"} component={() => (<DashboardLayout><CarrierDriverScoring /></DashboardLayout>)} />
      <Route path={"/carrier/driver-settlements"} component={() => (<DashboardLayout><CarrierDriverSettlements /></DashboardLayout>)} />
      <Route path={"/carrier/driver-termination"} component={() => (<DashboardLayout><CarrierDriverTermination /></DashboardLayout>)} />
      <Route path={"/carrier/driver-training"} component={() => (<DashboardLayout><CarrierDriverTraining /></DashboardLayout>)} />
      <Route path={"/carrier/drug-testing"} component={() => (<DashboardLayout><CarrierDrugTesting /></DashboardLayout>)} />
      <Route path={"/carrier/equipment-assignment"} component={() => (<DashboardLayout><CarrierEquipmentAssignment /></DashboardLayout>)} />
      <Route path={"/carrier/equipment-types"} component={() => (<DashboardLayout><CarrierEquipmentTypes /></DashboardLayout>)} />
      <Route path={"/carrier/expense-tracking"} component={() => (<DashboardLayout><CarrierExpenseTracking /></DashboardLayout>)} />
      <Route path={"/carrier/factoring-setup"} component={() => (<DashboardLayout><CarrierFactoringSetup /></DashboardLayout>)} />
      <Route path={"/carrier/fleet-management"} component={() => (<DashboardLayout><CarrierFleetManagement /></DashboardLayout>)} />
      <Route path={"/carrier/fleet-overview"} component={() => (<DashboardLayout><CarrierFleetOverview /></DashboardLayout>)} />
      <Route path={"/carrier/fuel-management"} component={() => (<DashboardLayout><CarrierFuelManagement /></DashboardLayout>)} />
      <Route path={"/carrier/fuel-purchases"} component={() => (<DashboardLayout><CarrierFuelPurchases /></DashboardLayout>)} />
      <Route path={"/carrier/fuel-surcharge"} component={() => (<DashboardLayout><CarrierFuelSurcharge /></DashboardLayout>)} />
      <Route path={"/carrier/incident-log"} component={() => (<DashboardLayout><CarrierIncidentLog /></DashboardLayout>)} />
      <Route path={"/carrier/inspection-schedule"} component={() => (<DashboardLayout><CarrierInspectionSchedule /></DashboardLayout>)} />
      <Route path={"/carrier/insurance"} component={() => (<DashboardLayout><CarrierInsurance /></DashboardLayout>)} />
      <Route path={"/carrier/insurance-certs"} component={() => (<DashboardLayout><CarrierInsuranceCerts /></DashboardLayout>)} />
      <Route path={"/carrier/invoice-generation"} component={() => (<DashboardLayout><CarrierInvoiceGeneration /></DashboardLayout>)} />
      <Route path={"/carrier/invoice-history"} component={() => (<DashboardLayout><CarrierInvoiceHistory /></DashboardLayout>)} />
      <Route path={"/carrier/invoice-queue"} component={() => (<DashboardLayout><CarrierInvoiceQueue /></DashboardLayout>)} />
      <Route path={"/carrier/invoicing"} component={() => (<DashboardLayout><CarrierInvoicing /></DashboardLayout>)} />
      <Route path={"/carrier/lane-preferences"} component={() => (<DashboardLayout><CarrierLanePreferences /></DashboardLayout>)} />
      <Route path={"/carrier/load-alerts"} component={() => (<DashboardLayout><CarrierLoadAlerts /></DashboardLayout>)} />
      <Route path={"/carrier/load-history"} component={() => (<DashboardLayout><CarrierLoadHistory /></DashboardLayout>)} />
      <Route path={"/carrier/load-matching"} component={() => (<DashboardLayout><CarrierLoadMatching /></DashboardLayout>)} />
      <Route path={"/carrier/load-recommendations"} component={() => (<DashboardLayout><CarrierLoadRecommendations /></DashboardLayout>)} />
      <Route path={"/carrier/load-search"} component={() => (<DashboardLayout><CarrierLoadSearch /></DashboardLayout>)} />
      <Route path={"/carrier/load-watchlist"} component={() => (<DashboardLayout><CarrierLoadWatchlist /></DashboardLayout>)} />
      <Route path={"/carrier/lost-bids"} component={() => (<DashboardLayout><CarrierLostBids /></DashboardLayout>)} />
      <Route path={"/carrier/mpg-report"} component={() => (<DashboardLayout><CarrierMPGReport /></DashboardLayout>)} />
      <Route path={"/carrier/maintenance-history"} component={() => (<DashboardLayout><CarrierMaintenanceHistory /></DashboardLayout>)} />
      <Route path={"/carrier/maintenance-schedule"} component={() => (<DashboardLayout><CarrierMaintenanceSchedule /></DashboardLayout>)} />
      <Route path={"/carrier/multi-load-planning"} component={() => (<DashboardLayout><CarrierMultiLoadPlanning /></DashboardLayout>)} />
      <Route path={"/carrier/on-time-report"} component={() => (<DashboardLayout><CarrierOnTimeReport /></DashboardLayout>)} />
      <Route path={"/carrier/packets"} component={() => (<DashboardLayout><CarrierPackets /></DashboardLayout>)} />
      <Route path={"/carrier/payment-tracking"} component={() => (<DashboardLayout><CarrierPaymentTracking /></DashboardLayout>)} />
      <Route path={"/carrier/permit-center"} component={() => (<DashboardLayout><CarrierPermitCenter /></DashboardLayout>)} />
      <Route path={"/carrier/profile"} component={() => (<DashboardLayout><CarrierProfile /></DashboardLayout>)} />
      <Route path={"/carrier/profit-loss"} component={() => (<DashboardLayout><CarrierProfitLoss /></DashboardLayout>)} />
      <Route path={"/carrier/profitability-analysis"} component={() => (<DashboardLayout><CarrierProfitabilityAnalysis /></DashboardLayout>)} />
      <Route path={"/carrier/quick-pay"} component={() => (<DashboardLayout><CarrierQuickPay /></DashboardLayout>)} />
      <Route path={"/carrier/quick-quote"} component={() => (<DashboardLayout><CarrierQuickQuote /></DashboardLayout>)} />
      <Route path={"/carrier/rate-comparison"} component={() => (<DashboardLayout><CarrierRateComparison /></DashboardLayout>)} />
      <Route path={"/carrier/rate-history"} component={() => (<DashboardLayout><CarrierRateHistory /></DashboardLayout>)} />
      <Route path={"/carrier/rate-negotiation"} component={() => (<DashboardLayout><CarrierRateNegotiation /></DashboardLayout>)} />
      <Route path={"/carrier/receivables"} component={() => (<DashboardLayout><CarrierReceivables /></DashboardLayout>)} />
      <Route path={"/carrier/repair-orders"} component={() => (<DashboardLayout><CarrierRepairOrders /></DashboardLayout>)} />
      <Route path={"/carrier/revenue-report"} component={() => (<DashboardLayout><CarrierRevenueReport /></DashboardLayout>)} />
      <Route path={"/carrier/safety-dashboard"} component={() => (<DashboardLayout><CarrierSafetyDashboard /></DashboardLayout>)} />
      <Route path={"/carrier/safety-scores"} component={() => (<DashboardLayout><CarrierSafetyScores /></DashboardLayout>)} />
      <Route path={"/carrier/saved-searches"} component={() => (<DashboardLayout><CarrierSavedSearches /></DashboardLayout>)} />
      <Route path={"/carrier/scorecard"} component={() => (<DashboardLayout><CarrierScorecard /></DashboardLayout>)} />
      <Route path={"/carrier/service-areas"} component={() => (<DashboardLayout><CarrierServiceAreas /></DashboardLayout>)} />
      <Route path={"/carrier/settlements"} component={() => (<DashboardLayout><CarrierSettlements /></DashboardLayout>)} />
      <Route path={"/carrier/spot-rates"} component={() => (<DashboardLayout><CarrierSpotRates /></DashboardLayout>)} />
      <Route path={"/carrier/tax-documents"} component={() => (<DashboardLayout><CarrierTaxDocuments /></DashboardLayout>)} />
      <Route path={"/carrier/toll-tracking"} component={() => (<DashboardLayout><CarrierTollTracking /></DashboardLayout>)} />
      <Route path={"/carrier/trailer-add"} component={() => (<DashboardLayout><CarrierTrailerAdd /></DashboardLayout>)} />
      <Route path={"/carrier/trailer-details"} component={() => (<DashboardLayout><CarrierTrailerDetails /></DashboardLayout>)} />
      <Route path={"/carrier/trailer-inventory"} component={() => (<DashboardLayout><CarrierTrailerInventory /></DashboardLayout>)} />
      <Route path={"/carrier/training-programs"} component={() => (<DashboardLayout><CarrierTrainingPrograms /></DashboardLayout>)} />
      <Route path={"/carrier/trip-optimization"} component={() => (<DashboardLayout><CarrierTripOptimization /></DashboardLayout>)} />
      <Route path={"/carrier/utilization-report"} component={() => (<DashboardLayout><CarrierUtilizationReport /></DashboardLayout>)} />
      <Route path={"/carrier/vehicle-add"} component={() => (<DashboardLayout><CarrierVehicleAdd /></DashboardLayout>)} />
      <Route path={"/carrier/vehicle-details"} component={() => (<DashboardLayout><CarrierVehicleDetails /></DashboardLayout>)} />
      <Route path={"/carrier/vehicle-inventory"} component={() => (<DashboardLayout><CarrierVehicleInventory /></DashboardLayout>)} />
      <Route path={"/carrier/vendor-management"} component={() => (<DashboardLayout><CarrierVendorManagement /></DashboardLayout>)} />
      <Route path={"/carrier/vetting"} component={() => (<DashboardLayout><CarrierVetting /></DashboardLayout>)} />
      <Route path={"/carrier/vetting-details"} component={() => (<DashboardLayout><CarrierVettingDetails /></DashboardLayout>)} />
      <Route path={"/carrier/won-loads"} component={() => (<DashboardLayout><CarrierWonLoads /></DashboardLayout>)} />
      <Route path={"/carrier/s"} component={() => (<DashboardLayout><Carriers /></DashboardLayout>)} />
      <Route path={"/catalyst/accessorial-exceptions"} component={() => (<DashboardLayout><CatalystAccessorialExceptions /></DashboardLayout>)} />
      <Route path={"/catalyst/active-loads"} component={() => (<DashboardLayout><CatalystActiveLoads /></DashboardLayout>)} />
      <Route path={"/catalyst/asset-utilization"} component={() => (<DashboardLayout><CatalystAssetUtilization /></DashboardLayout>)} />
      <Route path={"/catalyst/breakdown-response"} component={() => (<DashboardLayout><CatalystBreakdownResponse /></DashboardLayout>)} />
      <Route path={"/catalyst/breakdown-tracking"} component={() => (<DashboardLayout><CatalystBreakdownTracking /></DashboardLayout>)} />
      <Route path={"/catalyst/broadcast-center"} component={() => (<DashboardLayout><CatalystBroadcastCenter /></DashboardLayout>)} />
      <Route path={"/catalyst/call-log"} component={() => (<DashboardLayout><CatalystCallLog /></DashboardLayout>)} />
      <Route path={"/catalyst/capacity-forecast"} component={() => (<DashboardLayout><CatalystCapacityForecast /></DashboardLayout>)} />
      <Route path={"/catalyst/capacity-planning"} component={() => (<DashboardLayout><CatalystCapacityPlanning /></DashboardLayout>)} />
      <Route path={"/catalyst/carrier-capacity"} component={() => (<DashboardLayout><CatalystCarrierCapacity /></DashboardLayout>)} />
      <Route path={"/catalyst/carrier-comms"} component={() => (<DashboardLayout><CatalystCarrierComms /></DashboardLayout>)} />
      <Route path={"/catalyst/communication-center"} component={() => (<DashboardLayout><CatalystCommunicationCenter /></DashboardLayout>)} />
      <Route path={"/catalyst/cost-optimization"} component={() => (<DashboardLayout><CatalystCostOptimization /></DashboardLayout>)} />
      <Route path={"/catalyst/custom-reports"} component={() => (<DashboardLayout><CatalystCustomReports /></DashboardLayout>)} />
      <Route path={"/catalyst/customer-comms"} component={() => (<DashboardLayout><CatalystCustomerComms /></DashboardLayout>)} />
      <Route path={"/catalyst/damage-exceptions"} component={() => (<DashboardLayout><CatalystDamageExceptions /></DashboardLayout>)} />
      <Route path={"/catalyst/dashboard"} component={() => (<DashboardLayout><CatalystDashboard /></DashboardLayout>)} />
      <Route path={"/catalyst/delay-exceptions"} component={() => (<DashboardLayout><CatalystDelayExceptions /></DashboardLayout>)} />
      <Route path={"/catalyst/delay-management"} component={() => (<DashboardLayout><CatalystDelayManagement /></DashboardLayout>)} />
      <Route path={"/catalyst/demand-planning"} component={() => (<DashboardLayout><CatalystDemandPlanning /></DashboardLayout>)} />
      <Route path={"/catalyst/detention-tracking"} component={() => (<DashboardLayout><CatalystDetentionTracking /></DashboardLayout>)} />
      <Route path={"/catalyst/dispatch-messages"} component={() => (<DashboardLayout><CatalystDispatchMessages /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-assignment"} component={() => (<DashboardLayout><CatalystDriverAssignment /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-assist"} component={() => (<DashboardLayout><CatalystDriverAssist /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-availability"} component={() => (<DashboardLayout><CatalystDriverAvailability /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-broadcast"} component={() => (<DashboardLayout><CatalystDriverBroadcast /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-chat"} component={() => (<DashboardLayout><CatalystDriverChat /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-check-in"} component={() => (<DashboardLayout><CatalystDriverCheckIn /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-communication"} component={() => (<DashboardLayout><CatalystDriverCommunication /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-dashboard"} component={() => (<DashboardLayout><CatalystDriverDashboard /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-escalation"} component={() => (<DashboardLayout><CatalystDriverEscalation /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-hos"} component={() => (<DashboardLayout><CatalystDriverHOS /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-location"} component={() => (<DashboardLayout><CatalystDriverLocation /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-metrics"} component={() => (<DashboardLayout><CatalystDriverMetrics /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-metrics-dashboard"} component={() => (<DashboardLayout><CatalystDriverMetricsDashboard /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-performance"} component={() => (<DashboardLayout><CatalystDriverPerformance /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-relief"} component={() => (<DashboardLayout><CatalystDriverRelief /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-scheduling"} component={() => (<DashboardLayout><CatalystDriverScheduling /></DashboardLayout>)} />
      <Route path={"/catalyst/driver-status"} component={() => (<DashboardLayout><CatalystDriverStatus /></DashboardLayout>)} />
      <Route path={"/catalyst/eta-board"} component={() => (<DashboardLayout><CatalystETABoard /></DashboardLayout>)} />
      <Route path={"/catalyst/emergency-comms"} component={() => (<DashboardLayout><CatalystEmergencyComms /></DashboardLayout>)} />
      <Route path={"/catalyst/emergency-response"} component={() => (<DashboardLayout><CatalystEmergencyResponse /></DashboardLayout>)} />
      <Route path={"/catalyst/equipment-assignment"} component={() => (<DashboardLayout><CatalystEquipmentAssignment /></DashboardLayout>)} />
      <Route path={"/catalyst/equipment-status"} component={() => (<DashboardLayout><CatalystEquipmentStatus /></DashboardLayout>)} />
      <Route path={"/catalyst/exception-dashboard"} component={() => (<DashboardLayout><CatalystExceptionDashboard /></DashboardLayout>)} />
      <Route path={"/catalyst/exception-management"} component={() => (<DashboardLayout><CatalystExceptionManagement /></DashboardLayout>)} />
      <Route path={"/catalyst/exception-metrics"} component={() => (<DashboardLayout><CatalystExceptionMetrics /></DashboardLayout>)} />
      <Route path={"/catalyst/exception-resolution"} component={() => (<DashboardLayout><CatalystExceptionResolution /></DashboardLayout>)} />
      <Route path={"/catalyst/exceptions"} component={() => (<DashboardLayout><CatalystExceptions /></DashboardLayout>)} />
      <Route path={"/catalyst/fleet-map"} component={() => (<DashboardLayout><CatalystFleetMap /></DashboardLayout>)} />
      <Route path={"/catalyst/fleet-metrics"} component={() => (<DashboardLayout><CatalystFleetMetrics /></DashboardLayout>)} />
      <Route path={"/catalyst/fleet-status"} component={() => (<DashboardLayout><CatalystFleetStatus /></DashboardLayout>)} />
      <Route path={"/catalyst/fuel-monitoring"} component={() => (<DashboardLayout><CatalystFuelMonitoring /></DashboardLayout>)} />
      <Route path={"/catalyst/geofence-alerts"} component={() => (<DashboardLayout><CatalystGeofenceAlerts /></DashboardLayout>)} />
      <Route path={"/catalyst/inspection-status"} component={() => (<DashboardLayout><CatalystInspectionStatus /></DashboardLayout>)} />
      <Route path={"/catalyst/load-balancing"} component={() => (<DashboardLayout><CatalystLoadBalancing /></DashboardLayout>)} />
      <Route path={"/catalyst/load-board"} component={() => (<DashboardLayout><CatalystLoadBoard /></DashboardLayout>)} />
      <Route path={"/catalyst/load-matching"} component={() => (<DashboardLayout><CatalystLoadMatching /></DashboardLayout>)} />
      <Route path={"/catalyst/load-optimization"} component={() => (<DashboardLayout><CatalystLoadOptimization /></DashboardLayout>)} />
      <Route path={"/catalyst/load-planning"} component={() => (<DashboardLayout><CatalystLoadPlanning /></DashboardLayout>)} />
      <Route path={"/catalyst/load-priority"} component={() => (<DashboardLayout><CatalystLoadPriority /></DashboardLayout>)} />
      <Route path={"/catalyst/load-swap"} component={() => (<DashboardLayout><CatalystLoadSwap /></DashboardLayout>)} />
      <Route path={"/catalyst/load-timeline"} component={() => (<DashboardLayout><CatalystLoadTimeline /></DashboardLayout>)} />
      <Route path={"/catalyst/maintenance-alerts"} component={() => (<DashboardLayout><CatalystMaintenanceAlerts /></DashboardLayout>)} />
      <Route path={"/catalyst/message-templates"} component={() => (<DashboardLayout><CatalystMessageTemplates /></DashboardLayout>)} />
      <Route path={"/catalyst/milestone-tracking"} component={() => (<DashboardLayout><CatalystMilestoneTracking /></DashboardLayout>)} />
      <Route path={"/catalyst/on-time-metrics"} component={() => (<DashboardLayout><CatalystOnTimeMetrics /></DashboardLayout>)} />
      <Route path={"/catalyst/operations-dashboard"} component={() => (<DashboardLayout><CatalystOperationsDashboard /></DashboardLayout>)} />
      <Route path={"/catalyst/optimization-suggestions"} component={() => (<DashboardLayout><CatalystOptimizationSuggestions /></DashboardLayout>)} />
      <Route path={"/catalyst/performance"} component={() => (<DashboardLayout><CatalystPerformance /></DashboardLayout>)} />
      <Route path={"/catalyst/performance-dashboard"} component={() => (<DashboardLayout><CatalystPerformanceDashboard /></DashboardLayout>)} />
      <Route path={"/catalyst/productivity-report"} component={() => (<DashboardLayout><CatalystProductivityReport /></DashboardLayout>)} />
      <Route path={"/catalyst/refusal-exceptions"} component={() => (<DashboardLayout><CatalystRefusalExceptions /></DashboardLayout>)} />
      <Route path={"/catalyst/relief-driver"} component={() => (<DashboardLayout><CatalystReliefDriver /></DashboardLayout>)} />
      <Route path={"/catalyst/reschedule"} component={() => (<DashboardLayout><CatalystReschedule /></DashboardLayout>)} />
      <Route path={"/catalyst/resource-allocation"} component={() => (<DashboardLayout><CatalystResourceAllocation /></DashboardLayout>)} />
      <Route path={"/catalyst/route-planning"} component={() => (<DashboardLayout><CatalystRoutePlanning /></DashboardLayout>)} />
      <Route path={"/catalyst/scenario-planning"} component={() => (<DashboardLayout><CatalystScenarioPlanning /></DashboardLayout>)} />
      <Route path={"/catalyst/shift-report"} component={() => (<DashboardLayout><CatalystShiftReport /></DashboardLayout>)} />
      <Route path={"/catalyst/shortage-exceptions"} component={() => (<DashboardLayout><CatalystShortageExceptions /></DashboardLayout>)} />
      <Route path={"/catalyst/traffic-monitoring"} component={() => (<DashboardLayout><CatalystTrafficMonitoring /></DashboardLayout>)} />
      <Route path={"/catalyst/trailer-tracking"} component={() => (<DashboardLayout><CatalystTrailerTracking /></DashboardLayout>)} />
      <Route path={"/catalyst/vehicle-tracking"} component={() => (<DashboardLayout><CatalystVehicleTracking /></DashboardLayout>)} />
      <Route path={"/catalyst/voice-dispatch"} component={() => (<DashboardLayout><CatalystVoiceDispatch /></DashboardLayout>)} />
      <Route path={"/catalyst/weather-monitoring"} component={() => (<DashboardLayout><CatalystWeatherMonitoring /></DashboardLayout>)} />
      <Route path={"/change-password"} component={() => (<DashboardLayout><ChangePassword /></DashboardLayout>)} />
      <Route path={"/channels"} component={() => (<DashboardLayout><Channels /></DashboardLayout>)} />
      <Route path={"/claims-management"} component={() => (<DashboardLayout><ClaimsManagement /></DashboardLayout>)} />
      <Route path={"/clearinghouse"} component={() => (<DashboardLayout><Clearinghouse /></DashboardLayout>)} />
      <Route path={"/clearinghouse-dashboard"} component={() => (<DashboardLayout><ClearinghouseDashboard /></DashboardLayout>)} />
      <Route path={"/clearinghouse-queries"} component={() => (<DashboardLayout><ClearinghouseQueries /></DashboardLayout>)} />
      <Route path={"/commission"} component={() => (<DashboardLayout><Commission /></DashboardLayout>)} />
      <Route path={"/commission-tracking"} component={() => (<DashboardLayout><CommissionTracking /></DashboardLayout>)} />
      <Route path={"/companies"} component={() => (<DashboardLayout><Companies /></DashboardLayout>)} />
      <Route path={"/company"} component={() => (<DashboardLayout><Company /></DashboardLayout>)} />
      <Route path={"/company-billing"} component={() => (<DashboardLayout><CompanyBilling /></DashboardLayout>)} />
      <Route path={"/company-channels"} component={() => (<DashboardLayout><CompanyChannels /></DashboardLayout>)} />
      <Route path={"/company-documents"} component={() => (<DashboardLayout><CompanyDocuments /></DashboardLayout>)} />
      <Route path={"/company-management"} component={() => (<DashboardLayout><CompanyManagement /></DashboardLayout>)} />
      <Route path={"/company-profile"} component={() => (<DashboardLayout><CompanyProfile /></DashboardLayout>)} />
      <Route path={"/company-verification"} component={() => (<DashboardLayout><CompanyVerification /></DashboardLayout>)} />
      <Route path={"/competitor-analysis"} component={() => (<DashboardLayout><CompetitorAnalysis /></DashboardLayout>)} />
      <Route path={"/compliance/accident-register"} component={() => (<DashboardLayout><ComplianceAccidentRegister /></DashboardLayout>)} />
      <Route path={"/compliance/application-review"} component={() => (<DashboardLayout><ComplianceApplicationReview /></DashboardLayout>)} />
      <Route path={"/compliance/audit-checklist"} component={() => (<DashboardLayout><ComplianceAuditChecklist /></DashboardLayout>)} />
      <Route path={"/compliance/audit-dashboard"} component={() => (<DashboardLayout><ComplianceAuditDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/audit-findings"} component={() => (<DashboardLayout><ComplianceAuditFindings /></DashboardLayout>)} />
      <Route path={"/compliance/audit-history"} component={() => (<DashboardLayout><ComplianceAuditHistory /></DashboardLayout>)} />
      <Route path={"/compliance/audit-report"} component={() => (<DashboardLayout><ComplianceAuditReport /></DashboardLayout>)} />
      <Route path={"/compliance/audit-response"} component={() => (<DashboardLayout><ComplianceAuditResponse /></DashboardLayout>)} />
      <Route path={"/compliance/audit-schedule"} component={() => (<DashboardLayout><ComplianceAuditSchedule /></DashboardLayout>)} />
      <Route path={"/compliance/audits"} component={() => (<DashboardLayout><ComplianceAudits /></DashboardLayout>)} />
      <Route path={"/compliance/authority-status"} component={() => (<DashboardLayout><ComplianceAuthorityStatus /></DashboardLayout>)} />
      <Route path={"/compliance/coi-generation"} component={() => (<DashboardLayout><ComplianceCOIGeneration /></DashboardLayout>)} />
      <Route path={"/compliance/csa-monitoring"} component={() => (<DashboardLayout><ComplianceCSAMonitoring /></DashboardLayout>)} />
      <Route path={"/compliance/csa-remediation"} component={() => (<DashboardLayout><ComplianceCSARemediation /></DashboardLayout>)} />
      <Route path={"/compliance/calendar"} component={() => (<DashboardLayout><ComplianceCalendar /></DashboardLayout>)} />
      <Route path={"/compliance/certification-renewals"} component={() => (<DashboardLayout><ComplianceCertificationRenewals /></DashboardLayout>)} />
      <Route path={"/compliance/clearinghouse"} component={() => (<DashboardLayout><ComplianceClearinghouse /></DashboardLayout>)} />
      <Route path={"/compliance/clearinghouse-queries"} component={() => (<DashboardLayout><ComplianceClearinghouseQueries /></DashboardLayout>)} />
      <Route path={"/compliance/clearinghouse-reporting"} component={() => (<DashboardLayout><ComplianceClearinghouseReporting /></DashboardLayout>)} />
      <Route path={"/compliance/corrective-actions"} component={() => (<DashboardLayout><ComplianceCorrectiveActions /></DashboardLayout>)} />
      <Route path={"/compliance/custom-reports"} component={() => (<DashboardLayout><ComplianceCustomReports /></DashboardLayout>)} />
      <Route path={"/compliance/dot-audit-prep"} component={() => (<DashboardLayout><ComplianceDOTAuditPrep /></DashboardLayout>)} />
      <Route path={"/compliance/dq-file"} component={() => (<DashboardLayout><ComplianceDQFile /></DashboardLayout>)} />
      <Route path={"/compliance/dq-file-archive"} component={() => (<DashboardLayout><ComplianceDQFileArchive /></DashboardLayout>)} />
      <Route path={"/compliance/dq-file-audit"} component={() => (<DashboardLayout><ComplianceDQFileAudit /></DashboardLayout>)} />
      <Route path={"/compliance/dq-file-builder"} component={() => (<DashboardLayout><ComplianceDQFileBuilder /></DashboardLayout>)} />
      <Route path={"/compliance/dq-file-checklist"} component={() => (<DashboardLayout><ComplianceDQFileChecklist /></DashboardLayout>)} />
      <Route path={"/compliance/dq-file-dashboard"} component={() => (<DashboardLayout><ComplianceDQFileDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/dq-file-expiring"} component={() => (<DashboardLayout><ComplianceDQFileExpiring /></DashboardLayout>)} />
      <Route path={"/compliance/dashboard"} component={() => (<DashboardLayout><ComplianceDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/data-qs-challenge"} component={() => (<DashboardLayout><ComplianceDataQsChallenge /></DashboardLayout>)} />
      <Route path={"/compliance/driver-qualification"} component={() => (<DashboardLayout><ComplianceDriverQualification /></DashboardLayout>)} />
      <Route path={"/compliance/drug-test-dashboard"} component={() => (<DashboardLayout><ComplianceDrugTestDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/drug-test-schedule"} component={() => (<DashboardLayout><ComplianceDrugTestSchedule /></DashboardLayout>)} />
      <Route path={"/compliance/drug-testing"} component={() => (<DashboardLayout><ComplianceDrugTesting /></DashboardLayout>)} />
      <Route path={"/compliance/eld-"} component={() => (<DashboardLayout><ComplianceELDCompliance /></DashboardLayout>)} />
      <Route path={"/compliance/employment-verification"} component={() => (<DashboardLayout><ComplianceEmploymentVerification /></DashboardLayout>)} />
      <Route path={"/compliance/expiration-report"} component={() => (<DashboardLayout><ComplianceExpirationReport /></DashboardLayout>)} />
      <Route path={"/compliance/fatality-reporting"} component={() => (<DashboardLayout><ComplianceFatalityReporting /></DashboardLayout>)} />
      <Route path={"/compliance/follow-up-tests"} component={() => (<DashboardLayout><ComplianceFollowUpTests /></DashboardLayout>)} />
      <Route path={"/compliance/form-manner-errors"} component={() => (<DashboardLayout><ComplianceFormMannerErrors /></DashboardLayout>)} />
      <Route path={"/compliance/hos-dashboard"} component={() => (<DashboardLayout><ComplianceHOSDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/hos-exceptions"} component={() => (<DashboardLayout><ComplianceHOSExceptions /></DashboardLayout>)} />
      <Route path={"/compliance/hos-reports"} component={() => (<DashboardLayout><ComplianceHOSReports /></DashboardLayout>)} />
      <Route path={"/compliance/hos-review"} component={() => (<DashboardLayout><ComplianceHOSReview /></DashboardLayout>)} />
      <Route path={"/compliance/hos-trends"} component={() => (<DashboardLayout><ComplianceHOSTrends /></DashboardLayout>)} />
      <Route path={"/compliance/hos-violations"} component={() => (<DashboardLayout><ComplianceHOSViolations /></DashboardLayout>)} />
      <Route path={"/compliance/hazmat-endorsement"} component={() => (<DashboardLayout><ComplianceHazmatEndorsement /></DashboardLayout>)} />
      <Route path={"/compliance/insurance-claims"} component={() => (<DashboardLayout><ComplianceInsuranceClaims /></DashboardLayout>)} />
      <Route path={"/compliance/insurance-dashboard"} component={() => (<DashboardLayout><ComplianceInsuranceDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/insurance-expiring"} component={() => (<DashboardLayout><ComplianceInsuranceExpiring /></DashboardLayout>)} />
      <Route path={"/compliance/insurance-tracking"} component={() => (<DashboardLayout><ComplianceInsuranceTracking /></DashboardLayout>)} />
      <Route path={"/compliance/insurance-verification"} component={() => (<DashboardLayout><ComplianceInsuranceVerification /></DashboardLayout>)} />
      <Route path={"/compliance/log-approval"} component={() => (<DashboardLayout><ComplianceLogApproval /></DashboardLayout>)} />
      <Route path={"/compliance/log-audits"} component={() => (<DashboardLayout><ComplianceLogAudits /></DashboardLayout>)} />
      <Route path={"/compliance/log-editing"} component={() => (<DashboardLayout><ComplianceLogEditing /></DashboardLayout>)} />
      <Route path={"/compliance/mro-results"} component={() => (<DashboardLayout><ComplianceMROResults /></DashboardLayout>)} />
      <Route path={"/compliance/mvr-orders"} component={() => (<DashboardLayout><ComplianceMVROrders /></DashboardLayout>)} />
      <Route path={"/compliance/mvr-review"} component={() => (<DashboardLayout><ComplianceMVRReview /></DashboardLayout>)} />
      <Route path={"/compliance/medical-certificates"} component={() => (<DashboardLayout><ComplianceMedicalCertificates /></DashboardLayout>)} />
      <Route path={"/compliance/medical-examiner"} component={() => (<DashboardLayout><ComplianceMedicalExaminer /></DashboardLayout>)} />
      <Route path={"/compliance/mock-audit"} component={() => (<DashboardLayout><ComplianceMockAudit /></DashboardLayout>)} />
      <Route path={"/compliance/officer-dashboard"} component={() => (<DashboardLayout><ComplianceOfficerDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/psp-review"} component={() => (<DashboardLayout><CompliancePSPReview /></DashboardLayout>)} />
      <Route path={"/compliance/permit-dashboard"} component={() => (<DashboardLayout><CompliancePermitDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/permit-renewals"} component={() => (<DashboardLayout><CompliancePermitRenewals /></DashboardLayout>)} />
      <Route path={"/compliance/permit-tracking"} component={() => (<DashboardLayout><CompliancePermitTracking /></DashboardLayout>)} />
      <Route path={"/compliance/post-accident-test"} component={() => (<DashboardLayout><CompliancePostAccidentTest /></DashboardLayout>)} />
      <Route path={"/compliance/pre-employment-test"} component={() => (<DashboardLayout><CompliancePreEmploymentTest /></DashboardLayout>)} />
      <Route path={"/compliance/previous-employer"} component={() => (<DashboardLayout><CompliancePreviousEmployer /></DashboardLayout>)} />
      <Route path={"/compliance/random-selection"} component={() => (<DashboardLayout><ComplianceRandomSelection /></DashboardLayout>)} />
      <Route path={"/compliance/reasonable-suspicion"} component={() => (<DashboardLayout><ComplianceReasonableSuspicion /></DashboardLayout>)} />
      <Route path={"/compliance/reference-checks"} component={() => (<DashboardLayout><ComplianceReferenceChecks /></DashboardLayout>)} />
      <Route path={"/compliance/reports-dashboard"} component={() => (<DashboardLayout><ComplianceReportsDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/return-to-duty"} component={() => (<DashboardLayout><ComplianceReturnToDuty /></DashboardLayout>)} />
      <Route path={"/compliance/risk-assessment"} component={() => (<DashboardLayout><ComplianceRiskAssessment /></DashboardLayout>)} />
      <Route path={"/compliance/road-test-records"} component={() => (<DashboardLayout><ComplianceRoadTestRecords /></DashboardLayout>)} />
      <Route path={"/compliance/roadside-inspections"} component={() => (<DashboardLayout><ComplianceRoadsideInspections /></DashboardLayout>)} />
      <Route path={"/compliance/sap-referral"} component={() => (<DashboardLayout><ComplianceSAPReferral /></DashboardLayout>)} />
      <Route path={"/compliance/safety-dashboard"} component={() => (<DashboardLayout><ComplianceSafetyDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/safety-plans"} component={() => (<DashboardLayout><ComplianceSafetyPlans /></DashboardLayout>)} />
      <Route path={"/compliance/safety-ratings"} component={() => (<DashboardLayout><ComplianceSafetyRatings /></DashboardLayout>)} />
      <Route path={"/compliance/status-report"} component={() => (<DashboardLayout><ComplianceStatusReport /></DashboardLayout>)} />
      <Route path={"/compliance/tsa-background"} component={() => (<DashboardLayout><ComplianceTSABackground /></DashboardLayout>)} />
      <Route path={"/compliance/twic-cards"} component={() => (<DashboardLayout><ComplianceTWICCards /></DashboardLayout>)} />
      <Route path={"/compliance/training-assignment"} component={() => (<DashboardLayout><ComplianceTrainingAssignment /></DashboardLayout>)} />
      <Route path={"/compliance/training-completion"} component={() => (<DashboardLayout><ComplianceTrainingCompletion /></DashboardLayout>)} />
      <Route path={"/compliance/training-dashboard"} component={() => (<DashboardLayout><ComplianceTrainingDashboard /></DashboardLayout>)} />
      <Route path={"/compliance/training-records"} component={() => (<DashboardLayout><ComplianceTrainingRecords /></DashboardLayout>)} />
      <Route path={"/compliance/training-records-archive"} component={() => (<DashboardLayout><ComplianceTrainingRecordsArchive /></DashboardLayout>)} />
      <Route path={"/compliance/training-reports"} component={() => (<DashboardLayout><ComplianceTrainingReports /></DashboardLayout>)} />
      <Route path={"/compliance/trend-analysis"} component={() => (<DashboardLayout><ComplianceTrendAnalysis /></DashboardLayout>)} />
      <Route path={"/compliance/unidentified-driving"} component={() => (<DashboardLayout><ComplianceUnidentifiedDriving /></DashboardLayout>)} />
      <Route path={"/compliance/violation-report"} component={() => (<DashboardLayout><ComplianceViolationReport /></DashboardLayout>)} />
      <Route path={"/compliance/violation-tracking"} component={() => (<DashboardLayout><ComplianceViolationTracking /></DashboardLayout>)} />
      <Route path={"/component-showcase"} component={() => (<DashboardLayout><ComponentShowcase /></DashboardLayout>)} />
      <Route path={"/connected-apps"} component={() => (<DashboardLayout><ConnectedApps /></DashboardLayout>)} />
      <Route path={"/content-moderation"} component={() => (<DashboardLayout><ContentModeration /></DashboardLayout>)} />
      <Route path={"/contract-management"} component={() => (<DashboardLayout><ContractManagement /></DashboardLayout>)} />
      <Route path={"/cookie-policy"} component={() => (<DashboardLayout><CookiePolicy /></DashboardLayout>)} />
      <Route path={"/create-load"} component={() => (<DashboardLayout><CreateLoad /></DashboardLayout>)} />
      <Route path={"/current-job"} component={() => (<DashboardLayout><CurrentJob /></DashboardLayout>)} />
      <Route path={"/customer-directory"} component={() => (<DashboardLayout><CustomerDirectory /></DashboardLayout>)} />
      <Route path={"/customer-feedback"} component={() => (<DashboardLayout><CustomerFeedback /></DashboardLayout>)} />
      <Route path={"/customer-management"} component={() => (<DashboardLayout><CustomerManagement /></DashboardLayout>)} />
      <Route path={"/dq-file-management"} component={() => (<DashboardLayout><DQFileManagement /></DashboardLayout>)} />
      <Route path={"/dvir"} component={() => (<DashboardLayout><DVIR /></DashboardLayout>)} />
      <Route path={"/dvir-management"} component={() => (<DashboardLayout><DVIRManagement /></DashboardLayout>)} />
      <Route path={"/dashboard"} component={() => (<DashboardLayout><Dashboard /></DashboardLayout>)} />
      <Route path={"/dashboard-customizer"} component={() => (<DashboardLayout><DashboardCustomizer /></DashboardLayout>)} />
      <Route path={"/data-export"} component={() => (<DashboardLayout><DataExport /></DashboardLayout>)} />
      <Route path={"/data-exports"} component={() => (<DashboardLayout><DataExports /></DashboardLayout>)} />
      <Route path={"/data-import"} component={() => (<DashboardLayout><DataImport /></DashboardLayout>)} />
      <Route path={"/data-retention"} component={() => (<DashboardLayout><DataRetention /></DashboardLayout>)} />
      <Route path={"/database-health"} component={() => (<DashboardLayout><DatabaseHealth /></DashboardLayout>)} />
      <Route path={"/deadhead-analysis"} component={() => (<DashboardLayout><DeadheadAnalysis /></DashboardLayout>)} />
      <Route path={"/detention-tracking"} component={() => (<DashboardLayout><DetentionTracking /></DashboardLayout>)} />
      <Route path={"/diagnostics"} component={() => (<DashboardLayout><Diagnostics /></DashboardLayout>)} />
      <Route path={"/digital-signatures"} component={() => (<DashboardLayout><DigitalSignatures /></DashboardLayout>)} />
      <Route path={"/dispatch-assignment"} component={() => (<DashboardLayout><DispatchAssignment /></DashboardLayout>)} />
      <Route path={"/dispatch-board"} component={() => (<DashboardLayout><DispatchBoard /></DashboardLayout>)} />
      <Route path={"/dispatch-dashboard"} component={() => (<DashboardLayout><DispatchDashboard /></DashboardLayout>)} />
      <Route path={"/dispute-resolution"} component={() => (<DashboardLayout><DisputeResolution /></DashboardLayout>)} />
      <Route path={"/document-center"} component={() => (<DashboardLayout><DocumentCenter /></DashboardLayout>)} />
      <Route path={"/documents"} component={() => (<DashboardLayout><Documents /></DashboardLayout>)} />
      <Route path={"/driver/applications"} component={() => (<DashboardLayout><DriverApplications /></DashboardLayout>)} />
      <Route path={"/driver/availability"} component={() => (<DashboardLayout><DriverAvailability /></DashboardLayout>)} />
      <Route path={"/driver/bol-sign"} component={() => (<DashboardLayout><DriverBOLSign /></DashboardLayout>)} />
      <Route path={"/driver/benefits"} component={() => (<DashboardLayout><DriverBenefits /></DashboardLayout>)} />
      <Route path={"/driver/breakdown-report"} component={() => (<DashboardLayout><DriverBreakdownReport /></DashboardLayout>)} />
      <Route path={"/driver/certification-history"} component={() => (<DashboardLayout><DriverCertificationHistory /></DashboardLayout>)} />
      <Route path={"/driver/check-in"} component={() => (<DashboardLayout><DriverCheckIn /></DashboardLayout>)} />
      <Route path={"/driver/communication-center"} component={() => (<DashboardLayout><DriverCommunicationCenter /></DashboardLayout>)} />
      <Route path={"/driver/compensation"} component={() => (<DashboardLayout><DriverCompensation /></DashboardLayout>)} />
      <Route path={"/driver/compliance"} component={() => (<DashboardLayout><DriverCompliance /></DashboardLayout>)} />
      <Route path={"/driver/current-job"} component={() => (<DashboardLayout><DriverCurrentJob /></DashboardLayout>)} />
      <Route path={"/driver/dot-audit"} component={() => (<DashboardLayout><DriverDOTAudit /></DashboardLayout>)} />
      <Route path={"/driver/dashboard"} component={() => (<DashboardLayout><DriverDashboard /></DashboardLayout>)} />
      <Route path={"/driver/details"} component={() => (<DashboardLayout><DriverDetails /></DashboardLayout>)} />
      <Route path={"/driver/directory"} component={() => (<DashboardLayout><DriverDirectory /></DashboardLayout>)} />
      <Route path={"/driver/dispatch-contact"} component={() => (<DashboardLayout><DriverDispatchContact /></DashboardLayout>)} />
      <Route path={"/driver/documents"} component={() => (<DashboardLayout><DriverDocuments /></DashboardLayout>)} />
      <Route path={"/driver/earnings"} component={() => (<DashboardLayout><DriverEarnings /></DashboardLayout>)} />
      <Route path={"/driver/emergency-contacts"} component={() => (<DashboardLayout><DriverEmergencyContacts /></DashboardLayout>)} />
      <Route path={"/driver/equipment"} component={() => (<DashboardLayout><DriverEquipment /></DashboardLayout>)} />
      <Route path={"/driver/expense-history"} component={() => (<DashboardLayout><DriverExpenseHistory /></DashboardLayout>)} />
      <Route path={"/driver/expense-report"} component={() => (<DashboardLayout><DriverExpenseReport /></DashboardLayout>)} />
      <Route path={"/driver/expense-submit"} component={() => (<DashboardLayout><DriverExpenseSubmit /></DashboardLayout>)} />
      <Route path={"/driver/feedback"} component={() => (<DashboardLayout><DriverFeedback /></DashboardLayout>)} />
      <Route path={"/driver/fuel-locator"} component={() => (<DashboardLayout><DriverFuelLocator /></DashboardLayout>)} />
      <Route path={"/driver/fuel-purchase"} component={() => (<DashboardLayout><DriverFuelPurchase /></DashboardLayout>)} />
      <Route path={"/driver/fuel-stops"} component={() => (<DashboardLayout><DriverFuelStops /></DashboardLayout>)} />
      <Route path={"/driver/hos"} component={() => (<DashboardLayout><DriverHOS /></DashboardLayout>)} />
      <Route path={"/driver/hos-dashboard"} component={() => (<DashboardLayout><DriverHOSDashboard /></DashboardLayout>)} />
      <Route path={"/driver/hos-edit"} component={() => (<DashboardLayout><DriverHOSEdit /></DashboardLayout>)} />
      <Route path={"/driver/hos-log"} component={() => (<DashboardLayout><DriverHOSLog /></DashboardLayout>)} />
      <Route path={"/driver/home"} component={() => (<DashboardLayout><DriverHome /></DashboardLayout>)} />
      <Route path={"/driver/incident-report-form"} component={() => (<DashboardLayout><DriverIncidentReportForm /></DashboardLayout>)} />
      <Route path={"/driver/inspection-form"} component={() => (<DashboardLayout><DriverInspectionForm /></DashboardLayout>)} />
      <Route path={"/driver/inspection-history"} component={() => (<DashboardLayout><DriverInspectionHistory /></DashboardLayout>)} />
      <Route path={"/driver/issue-report"} component={() => (<DashboardLayout><DriverIssueReport /></DashboardLayout>)} />
      <Route path={"/driver/load-accept"} component={() => (<DashboardLayout><DriverLoadAccept /></DashboardLayout>)} />
      <Route path={"/driver/load-details"} component={() => (<DashboardLayout><DriverLoadDetails /></DashboardLayout>)} />
      <Route path={"/driver/load-history"} component={() => (<DashboardLayout><DriverLoadHistory /></DashboardLayout>)} />
      <Route path={"/driver/load-search"} component={() => (<DashboardLayout><DriverLoadSearch /></DashboardLayout>)} />
      <Route path={"/driver/management"} component={() => (<DashboardLayout><DriverManagement /></DashboardLayout>)} />
      <Route path={"/driver/messages"} component={() => (<DashboardLayout><DriverMessages /></DashboardLayout>)} />
      <Route path={"/driver/mobile-app"} component={() => (<DashboardLayout><DriverMobileApp /></DashboardLayout>)} />
      <Route path={"/driver/navigation"} component={() => (<DashboardLayout><DriverNavigation /></DashboardLayout>)} />
      <Route path={"/driver/onboarding"} component={() => (<DashboardLayout><DriverOnboarding /></DashboardLayout>)} />
      <Route path={"/driver/pod-capture"} component={() => (<DashboardLayout><DriverPODCapture /></DashboardLayout>)} />
      <Route path={"/driver/parking"} component={() => (<DashboardLayout><DriverParking /></DashboardLayout>)} />
      <Route path={"/driver/pay-statement-details"} component={() => (<DashboardLayout><DriverPayStatementDetails /></DashboardLayout>)} />
      <Route path={"/driver/pay-statements"} component={() => (<DashboardLayout><DriverPayStatements /></DashboardLayout>)} />
      <Route path={"/driver/payroll"} component={() => (<DashboardLayout><DriverPayroll /></DashboardLayout>)} />
      <Route path={"/driver/performance"} component={() => (<DashboardLayout><DriverPerformance /></DashboardLayout>)} />
      <Route path={"/driver/post-trip"} component={() => (<DashboardLayout><DriverPostTrip /></DashboardLayout>)} />
      <Route path={"/driver/pre-trip"} component={() => (<DashboardLayout><DriverPreTrip /></DashboardLayout>)} />
      <Route path={"/driver/pre-trip-inspection"} component={() => (<DashboardLayout><DriverPreTripInspection /></DashboardLayout>)} />
      <Route path={"/driver/preferences"} component={() => (<DashboardLayout><DriverPreferences /></DashboardLayout>)} />
      <Route path={"/driver/renewal-reminders"} component={() => (<DashboardLayout><DriverRenewalReminders /></DashboardLayout>)} />
      <Route path={"/driver/rest-stops"} component={() => (<DashboardLayout><DriverRestStops /></DashboardLayout>)} />
      <Route path={"/driver/retirement"} component={() => (<DashboardLayout><DriverRetirement /></DashboardLayout>)} />
      <Route path={"/driver/route-optimization"} component={() => (<DashboardLayout><DriverRouteOptimization /></DashboardLayout>)} />
      <Route path={"/driver/safety-alerts"} component={() => (<DashboardLayout><DriverSafetyAlerts /></DashboardLayout>)} />
      <Route path={"/driver/safety-scorecard"} component={() => (<DashboardLayout><DriverSafetyScorecard /></DashboardLayout>)} />
      <Route path={"/driver/scale-locations"} component={() => (<DashboardLayout><DriverScaleLocations /></DashboardLayout>)} />
      <Route path={"/driver/scorecard"} component={() => (<DashboardLayout><DriverScorecard /></DashboardLayout>)} />
      <Route path={"/driver/scorecards"} component={() => (<DashboardLayout><DriverScorecards /></DashboardLayout>)} />
      <Route path={"/driver/settlement"} component={() => (<DashboardLayout><DriverSettlement /></DashboardLayout>)} />
      <Route path={"/driver/status"} component={() => (<DashboardLayout><DriverStatus /></DashboardLayout>)} />
      <Route path={"/driver/tax-info"} component={() => (<DashboardLayout><DriverTaxInfo /></DashboardLayout>)} />
      <Route path={"/driver/terminations"} component={() => (<DashboardLayout><DriverTerminations /></DashboardLayout>)} />
      <Route path={"/driver/time-off"} component={() => (<DashboardLayout><DriverTimeOff /></DashboardLayout>)} />
      <Route path={"/driver/tracking"} component={() => (<DashboardLayout><DriverTracking /></DashboardLayout>)} />
      <Route path={"/driver/training"} component={() => (<DashboardLayout><DriverTraining /></DashboardLayout>)} />
      <Route path={"/driver/truck-stops"} component={() => (<DashboardLayout><DriverTruckStops /></DashboardLayout>)} />
      <Route path={"/driver/vehicle"} component={() => (<DashboardLayout><DriverVehicle /></DashboardLayout>)} />
      <Route path={"/driver/weather-alerts"} component={() => (<DashboardLayout><DriverWeatherAlerts /></DashboardLayout>)} />
      <Route path={"/driver/s"} component={() => (<DashboardLayout><Drivers /></DashboardLayout>)} />
      <Route path={"/drug-alcohol-testing"} component={() => (<DashboardLayout><DrugAlcoholTesting /></DashboardLayout>)} />
      <Route path={"/eia-reporting"} component={() => (<DashboardLayout><EIAReporting /></DashboardLayout>)} />
      <Route path={"/eld-integration"} component={() => (<DashboardLayout><ELDIntegration /></DashboardLayout>)} />
      <Route path={"/eld-logs"} component={() => (<DashboardLayout><ELDLogs /></DashboardLayout>)} />
      <Route path={"/erg-guide"} component={() => (<DashboardLayout><ERGGuide /></DashboardLayout>)} />
      <Route path={"/erg-lookup"} component={() => (<DashboardLayout><ERGLookup /></DashboardLayout>)} />
      <Route path={"/esang-chat"} component={() => (<DashboardLayout><ESANGChat /></DashboardLayout>)} />
      <Route path={"/earnings"} component={() => (<DashboardLayout><Earnings /></DashboardLayout>)} />
      <Route path={"/email-logs"} component={() => (<DashboardLayout><EmailLogs /></DashboardLayout>)} />
      <Route path={"/email-templates"} component={() => (<DashboardLayout><EmailTemplates /></DashboardLayout>)} />
      <Route path={"/employment-history"} component={() => (<DashboardLayout><EmploymentHistory /></DashboardLayout>)} />
      <Route path={"/equipment-management"} component={() => (<DashboardLayout><EquipmentManagement /></DashboardLayout>)} />
      <Route path={"/equipment-tracking"} component={() => (<DashboardLayout><EquipmentTracking /></DashboardLayout>)} />
      <Route path={"/erg"} component={() => (<DashboardLayout><Erg /></DashboardLayout>)} />
      <Route path={"/emergency/command-center"} component={() => (<DashboardLayout><EmergencyCommandCenter /></DashboardLayout>)} />
      <Route path={"/emergency/mobilization"} component={() => (<DashboardLayout><EmergencyMobilization /></DashboardLayout>)} />
      <Route path={"/emergency/driver-response"} component={() => (<DashboardLayout><EmergencyDriverResponse /></DashboardLayout>)} />
      <Route path={"/emergency/supply-analysis"} component={() => (<DashboardLayout><EmergencySupplyAnalysis /></DashboardLayout>)} />
      <Route path={"/emergency/government-liaison"} component={() => (<DashboardLayout><EmergencyGovernmentLiaison /></DashboardLayout>)} />
      <Route path={"/emergency/after-action"} component={() => (<DashboardLayout><EmergencyAfterAction /></DashboardLayout>)} />
      <Route path={"/emergency/scenario"} component={() => (<DashboardLayout><EmergencyScenario /></DashboardLayout>)} />
      <Route path={"/error-logs"} component={() => (<DashboardLayout><ErrorLogs /></DashboardLayout>)} />
      <Route path={"/escort/active-jobs"} component={() => (<DashboardLayout><EscortActiveJobs /></DashboardLayout>)} />
      <Route path={"/escort/audit-prep"} component={() => (<DashboardLayout><EscortAuditPrep /></DashboardLayout>)} />
      <Route path={"/escort/availability"} component={() => (<DashboardLayout><EscortAvailability /></DashboardLayout>)} />
      <Route path={"/escort/bridge-weights"} component={() => (<DashboardLayout><EscortBridgeWeights /></DashboardLayout>)} />
      <Route path={"/escort/certification-renewal"} component={() => (<DashboardLayout><EscortCertificationRenewal /></DashboardLayout>)} />
      <Route path={"/escort/certifications"} component={() => (<DashboardLayout><EscortCertifications /></DashboardLayout>)} />
      <Route path={"/escort/client-management"} component={() => (<DashboardLayout><EscortClientManagement /></DashboardLayout>)} />
      <Route path={"/escort/communications"} component={() => (<DashboardLayout><EscortCommunications /></DashboardLayout>)} />
      <Route path={"/escort/compliance-calendar"} component={() => (<DashboardLayout><EscortComplianceCalendar /></DashboardLayout>)} />
      <Route path={"/escort/convoy-comm"} component={() => (<DashboardLayout><EscortConvoyComm /></DashboardLayout>)} />
      <Route path={"/escort/convoy-positioning"} component={() => (<DashboardLayout><EscortConvoyPositioning /></DashboardLayout>)} />
      <Route path={"/escort/convoy-report"} component={() => (<DashboardLayout><EscortConvoyReport /></DashboardLayout>)} />
      <Route path={"/escort/convoy-setup"} component={() => (<DashboardLayout><EscortConvoySetup /></DashboardLayout>)} />
      <Route path={"/escort/convoy-tracking"} component={() => (<DashboardLayout><EscortConvoyTracking /></DashboardLayout>)} />
      <Route path={"/escort/dashboard"} component={() => (<DashboardLayout><EscortDashboard /></DashboardLayout>)} />
      <Route path={"/escort/earnings"} component={() => (<DashboardLayout><EscortEarnings /></DashboardLayout>)} />
      <Route path={"/escort/emergency-protocol"} component={() => (<DashboardLayout><EscortEmergencyProtocol /></DashboardLayout>)} />
      <Route path={"/escort/equipment-certs"} component={() => (<DashboardLayout><EscortEquipmentCerts /></DashboardLayout>)} />
      <Route path={"/escort/equipment-checklist"} component={() => (<DashboardLayout><EscortEquipmentChecklist /></DashboardLayout>)} />
      <Route path={"/escort/equipment-inventory"} component={() => (<DashboardLayout><EscortEquipmentInventory /></DashboardLayout>)} />
      <Route path={"/escort/equipment-maintenance"} component={() => (<DashboardLayout><EscortEquipmentMaintenance /></DashboardLayout>)} />
      <Route path={"/escort/equipment-management"} component={() => (<DashboardLayout><EscortEquipmentManagement /></DashboardLayout>)} />
      <Route path={"/escort/equipment-purchase"} component={() => (<DashboardLayout><EscortEquipmentPurchase /></DashboardLayout>)} />
      <Route path={"/escort/expense-history"} component={() => (<DashboardLayout><EscortExpenseHistory /></DashboardLayout>)} />
      <Route path={"/escort/expense-submit"} component={() => (<DashboardLayout><EscortExpenseSubmit /></DashboardLayout>)} />
      <Route path={"/escort/flag-operations"} component={() => (<DashboardLayout><EscortFlagOperations /></DashboardLayout>)} />
      <Route path={"/escort/height-clearances"} component={() => (<DashboardLayout><EscortHeightClearances /></DashboardLayout>)} />
      <Route path={"/escort/height-pole"} component={() => (<DashboardLayout><EscortHeightPole /></DashboardLayout>)} />
      <Route path={"/escort/incidents"} component={() => (<DashboardLayout><EscortIncidents /></DashboardLayout>)} />
      <Route path={"/escort/insurance-docs"} component={() => (<DashboardLayout><EscortInsuranceDocs /></DashboardLayout>)} />
      <Route path={"/escort/invoicing"} component={() => (<DashboardLayout><EscortInvoicing /></DashboardLayout>)} />
      <Route path={"/escort/job-acceptance"} component={() => (<DashboardLayout><EscortJobAcceptance /></DashboardLayout>)} />
      <Route path={"/escort/job-bidding"} component={() => (<DashboardLayout><EscortJobBidding /></DashboardLayout>)} />
      <Route path={"/escort/job-calendar"} component={() => (<DashboardLayout><EscortJobCalendar /></DashboardLayout>)} />
      <Route path={"/escort/job-details"} component={() => (<DashboardLayout><EscortJobDetails /></DashboardLayout>)} />
      <Route path={"/escort/job-history"} component={() => (<DashboardLayout><EscortJobHistory /></DashboardLayout>)} />
      <Route path={"/escort/job-marketplace"} component={() => (<DashboardLayout><EscortJobMarketplace /></DashboardLayout>)} />
      <Route path={"/escort/job-negotiation"} component={() => (<DashboardLayout><EscortJobNegotiation /></DashboardLayout>)} />
      <Route path={"/escort/job-search"} component={() => (<DashboardLayout><EscortJobSearch /></DashboardLayout>)} />
      <Route path={"/escort/jobs"} component={() => (<DashboardLayout><EscortJobs /></DashboardLayout>)} />
      <Route path={"/escort/license-renewal"} component={() => (<DashboardLayout><EscortLicenseRenewal /></DashboardLayout>)} />
      <Route path={"/escort/mileage-tracking"} component={() => (<DashboardLayout><EscortMileageTracking /></DashboardLayout>)} />
      <Route path={"/escort/obstructions"} component={() => (<DashboardLayout><EscortObstructions /></DashboardLayout>)} />
      <Route path={"/escort/pay-history"} component={() => (<DashboardLayout><EscortPayHistory /></DashboardLayout>)} />
      <Route path={"/escort/pay-statements"} component={() => (<DashboardLayout><EscortPayStatements /></DashboardLayout>)} />
      <Route path={"/escort/permit-tracking"} component={() => (<DashboardLayout><EscortPermitTracking /></DashboardLayout>)} />
      <Route path={"/escort/permits"} component={() => (<DashboardLayout><EscortPermits /></DashboardLayout>)} />
      <Route path={"/escort/preferences"} component={() => (<DashboardLayout><EscortPreferences /></DashboardLayout>)} />
      <Route path={"/escort/radio-comms"} component={() => (<DashboardLayout><EscortRadioComms /></DashboardLayout>)} />
      <Route path={"/escort/recurring-jobs"} component={() => (<DashboardLayout><EscortRecurringJobs /></DashboardLayout>)} />
      <Route path={"/escort/reports"} component={() => (<DashboardLayout><EscortReports /></DashboardLayout>)} />
      <Route path={"/escort/route-builder"} component={() => (<DashboardLayout><EscortRouteBuilder /></DashboardLayout>)} />
      <Route path={"/escort/route-history"} component={() => (<DashboardLayout><EscortRouteHistory /></DashboardLayout>)} />
      <Route path={"/escort/route-notes"} component={() => (<DashboardLayout><EscortRouteNotes /></DashboardLayout>)} />
      <Route path={"/escort/route-planning"} component={() => (<DashboardLayout><EscortRoutePlanning /></DashboardLayout>)} />
      <Route path={"/escort/route-survey"} component={() => (<DashboardLayout><EscortRouteSurvey /></DashboardLayout>)} />
      <Route path={"/escort/schedule"} component={() => (<DashboardLayout><EscortSchedule /></DashboardLayout>)} />
      <Route path={"/escort/state-certs"} component={() => (<DashboardLayout><EscortStateCerts /></DashboardLayout>)} />
      <Route path={"/escort/tax-documents"} component={() => (<DashboardLayout><EscortTaxDocuments /></DashboardLayout>)} />
      <Route path={"/escort/traffic-control"} component={() => (<DashboardLayout><EscortTrafficControl /></DashboardLayout>)} />
      <Route path={"/escort/training"} component={() => (<DashboardLayout><EscortTraining /></DashboardLayout>)} />
      <Route path={"/escort/turn-radius"} component={() => (<DashboardLayout><EscortTurnRadius /></DashboardLayout>)} />
      <Route path={"/escort/utility-lines"} component={() => (<DashboardLayout><EscortUtilityLines /></DashboardLayout>)} />
      <Route path={"/escort/vehicle-docs"} component={() => (<DashboardLayout><EscortVehicleDocs /></DashboardLayout>)} />
      <Route path={"/escort/vehicle-inspection"} component={() => (<DashboardLayout><EscortVehicleInspection /></DashboardLayout>)} />
      <Route path={"/euso-ticket"} component={() => (<DashboardLayout><EusoTicket /></DashboardLayout>)} />
      <Route path={"/exception-management"} component={() => (<DashboardLayout><ExceptionManagement /></DashboardLayout>)} />
      <Route path={"/expense-reports"} component={() => (<DashboardLayout><ExpenseReports /></DashboardLayout>)} />
      <Route path={"/facility"} component={() => (<DashboardLayout><Facility /></DashboardLayout>)} />
      <Route path={"/factoring/ach-setup"} component={() => (<DashboardLayout><FactoringACHSetup /></DashboardLayout>)} />
      <Route path={"/factoring/account-setup"} component={() => (<DashboardLayout><FactoringAccountSetup /></DashboardLayout>)} />
      <Route path={"/factoring/add-bank-account"} component={() => (<DashboardLayout><FactoringAddBankAccount /></DashboardLayout>)} />
      <Route path={"/factoring/aging-report"} component={() => (<DashboardLayout><FactoringAgingReport /></DashboardLayout>)} />
      <Route path={"/factoring/analytics"} component={() => (<DashboardLayout><FactoringAnalytics /></DashboardLayout>)} />
      <Route path={"/factoring/annual-summary"} component={() => (<DashboardLayout><FactoringAnnualSummary /></DashboardLayout>)} />
      <Route path={"/factoring/approved-invoices"} component={() => (<DashboardLayout><FactoringApprovedInvoices /></DashboardLayout>)} />
      <Route path={"/factoring/bol-upload"} component={() => (<DashboardLayout><FactoringBOLUpload /></DashboardLayout>)} />
      <Route path={"/factoring/bank-accounts"} component={() => (<DashboardLayout><FactoringBankAccounts /></DashboardLayout>)} />
      <Route path={"/factoring/bulk-upload"} component={() => (<DashboardLayout><FactoringBulkUpload /></DashboardLayout>)} />
      <Route path={"/factoring/cash-flow"} component={() => (<DashboardLayout><FactoringCashFlow /></DashboardLayout>)} />
      <Route path={"/factoring/collection-agencies"} component={() => (<DashboardLayout><FactoringCollectionAgencies /></DashboardLayout>)} />
      <Route path={"/factoring/collection-details"} component={() => (<DashboardLayout><FactoringCollectionDetails /></DashboardLayout>)} />
      <Route path={"/factoring/collections"} component={() => (<DashboardLayout><FactoringCollections /></DashboardLayout>)} />
      <Route path={"/factoring/comparison-tool"} component={() => (<DashboardLayout><FactoringComparisonTool /></DashboardLayout>)} />
      <Route path={"/factoring/contact-rep"} component={() => (<DashboardLayout><FactoringContactRep /></DashboardLayout>)} />
      <Route path={"/factoring/contract-rates"} component={() => (<DashboardLayout><FactoringContractRates /></DashboardLayout>)} />
      <Route path={"/factoring/contract-review"} component={() => (<DashboardLayout><FactoringContractReview /></DashboardLayout>)} />
      <Route path={"/factoring/cost-analysis"} component={() => (<DashboardLayout><FactoringCostAnalysis /></DashboardLayout>)} />
      <Route path={"/factoring/credit-application"} component={() => (<DashboardLayout><FactoringCreditApplication /></DashboardLayout>)} />
      <Route path={"/factoring/credit-line"} component={() => (<DashboardLayout><FactoringCreditLine /></DashboardLayout>)} />
      <Route path={"/factoring/custom-reports"} component={() => (<DashboardLayout><FactoringCustomReports /></DashboardLayout>)} />
      <Route path={"/factoring/dashboard"} component={() => (<DashboardLayout><FactoringDashboard /></DashboardLayout>)} />
      <Route path={"/factoring/debtor-aging"} component={() => (<DashboardLayout><FactoringDebtorAging /></DashboardLayout>)} />
      <Route path={"/factoring/debtor-approval"} component={() => (<DashboardLayout><FactoringDebtorApproval /></DashboardLayout>)} />
      <Route path={"/factoring/debtor-contact"} component={() => (<DashboardLayout><FactoringDebtorContact /></DashboardLayout>)} />
      <Route path={"/factoring/debtor-credit-check"} component={() => (<DashboardLayout><FactoringDebtorCreditCheck /></DashboardLayout>)} />
      <Route path={"/factoring/debtor-details"} component={() => (<DashboardLayout><FactoringDebtorDetails /></DashboardLayout>)} />
      <Route path={"/factoring/debtor-management"} component={() => (<DashboardLayout><FactoringDebtorManagement /></DashboardLayout>)} />
      <Route path={"/factoring/debtor-monitoring"} component={() => (<DashboardLayout><FactoringDebtorMonitoring /></DashboardLayout>)} />
      <Route path={"/factoring/debtor-notes"} component={() => (<DashboardLayout><FactoringDebtorNotes /></DashboardLayout>)} />
      <Route path={"/factoring/debtor-payment-history"} component={() => (<DashboardLayout><FactoringDebtorPaymentHistory /></DashboardLayout>)} />
      <Route path={"/factoring/document-center"} component={() => (<DashboardLayout><FactoringDocumentCenter /></DashboardLayout>)} />
      <Route path={"/factoring/dunning-letters"} component={() => (<DashboardLayout><FactoringDunningLetters /></DashboardLayout>)} />
      <Route path={"/factoring/export-data"} component={() => (<DashboardLayout><FactoringExportData /></DashboardLayout>)} />
      <Route path={"/factoring/fee-disputes"} component={() => (<DashboardLayout><FactoringFeeDisputes /></DashboardLayout>)} />
      <Route path={"/factoring/fee-history"} component={() => (<DashboardLayout><FactoringFeeHistory /></DashboardLayout>)} />
      <Route path={"/factoring/fee-schedule"} component={() => (<DashboardLayout><FactoringFeeSchedule /></DashboardLayout>)} />
      <Route path={"/factoring/fuel-advance"} component={() => (<DashboardLayout><FactoringFuelAdvance /></DashboardLayout>)} />
      <Route path={"/factoring/fuel-advance-history"} component={() => (<DashboardLayout><FactoringFuelAdvanceHistory /></DashboardLayout>)} />
      <Route path={"/factoring/fuel-card-link"} component={() => (<DashboardLayout><FactoringFuelCardLink /></DashboardLayout>)} />
      <Route path={"/factoring/fuel-cards"} component={() => (<DashboardLayout><FactoringFuelCards /></DashboardLayout>)} />
      <Route path={"/factoring/funded-invoices"} component={() => (<DashboardLayout><FactoringFundedInvoices /></DashboardLayout>)} />
      <Route path={"/factoring/funding-schedule"} component={() => (<DashboardLayout><FactoringFundingSchedule /></DashboardLayout>)} />
      <Route path={"/factoring/integration"} component={() => (<DashboardLayout><FactoringIntegration /></DashboardLayout>)} />
      <Route path={"/factoring/invoice-correction"} component={() => (<DashboardLayout><FactoringInvoiceCorrection /></DashboardLayout>)} />
      <Route path={"/factoring/invoice-details"} component={() => (<DashboardLayout><FactoringInvoiceDetails /></DashboardLayout>)} />
      <Route path={"/factoring/invoice-disputes"} component={() => (<DashboardLayout><FactoringInvoiceDisputes /></DashboardLayout>)} />
      <Route path={"/factoring/invoice-history"} component={() => (<DashboardLayout><FactoringInvoiceHistory /></DashboardLayout>)} />
      <Route path={"/factoring/invoice-matching"} component={() => (<DashboardLayout><FactoringInvoiceMatching /></DashboardLayout>)} />
      <Route path={"/factoring/invoice-submit"} component={() => (<DashboardLayout><FactoringInvoiceSubmit /></DashboardLayout>)} />
      <Route path={"/factoring/invoice-validation"} component={() => (<DashboardLayout><FactoringInvoiceValidation /></DashboardLayout>)} />
      <Route path={"/factoring/legal-actions"} component={() => (<DashboardLayout><FactoringLegalActions /></DashboardLayout>)} />
      <Route path={"/factoring/notice-of-assignment"} component={() => (<DashboardLayout><FactoringNoticeOfAssignment /></DashboardLayout>)} />
      <Route path={"/factoring/notifications"} component={() => (<DashboardLayout><FactoringNotifications /></DashboardLayout>)} />
      <Route path={"/factoring/onboarding"} component={() => (<DashboardLayout><FactoringOnboarding /></DashboardLayout>)} />
      <Route path={"/factoring/overdue-invoices"} component={() => (<DashboardLayout><FactoringOverdueInvoices /></DashboardLayout>)} />
      <Route path={"/factoring/pod-upload"} component={() => (<DashboardLayout><FactoringPODUpload /></DashboardLayout>)} />
      <Route path={"/factoring/payment-methods"} component={() => (<DashboardLayout><FactoringPaymentMethods /></DashboardLayout>)} />
      <Route path={"/factoring/payment-reminders"} component={() => (<DashboardLayout><FactoringPaymentReminders /></DashboardLayout>)} />
      <Route path={"/factoring/pending-invoices"} component={() => (<DashboardLayout><FactoringPendingInvoices /></DashboardLayout>)} />
      <Route path={"/factoring/performance-report"} component={() => (<DashboardLayout><FactoringPerformanceReport /></DashboardLayout>)} />
      <Route path={"/factoring/provider-application"} component={() => (<DashboardLayout><FactoringProviderApplication /></DashboardLayout>)} />
      <Route path={"/factoring/provider-comparison"} component={() => (<DashboardLayout><FactoringProviderComparison /></DashboardLayout>)} />
      <Route path={"/factoring/provider-contract"} component={() => (<DashboardLayout><FactoringProviderContract /></DashboardLayout>)} />
      <Route path={"/factoring/provider-details"} component={() => (<DashboardLayout><FactoringProviderDetails /></DashboardLayout>)} />
      <Route path={"/factoring/provider-directory"} component={() => (<DashboardLayout><FactoringProviderDirectory /></DashboardLayout>)} />
      <Route path={"/factoring/provider-faq"} component={() => (<DashboardLayout><FactoringProviderFAQ /></DashboardLayout>)} />
      <Route path={"/factoring/provider-fees"} component={() => (<DashboardLayout><FactoringProviderFees /></DashboardLayout>)} />
      <Route path={"/factoring/provider-integration"} component={() => (<DashboardLayout><FactoringProviderIntegration /></DashboardLayout>)} />
      <Route path={"/factoring/provider-reviews"} component={() => (<DashboardLayout><FactoringProviderReviews /></DashboardLayout>)} />
      <Route path={"/factoring/provider-services"} component={() => (<DashboardLayout><FactoringProviderServices /></DashboardLayout>)} />
      <Route path={"/factoring/provider-support"} component={() => (<DashboardLayout><FactoringProviderSupport /></DashboardLayout>)} />
      <Route path={"/factoring/quick-pay"} component={() => (<DashboardLayout><FactoringQuickPay /></DashboardLayout>)} />
      <Route path={"/factoring/quick-pay-history"} component={() => (<DashboardLayout><FactoringQuickPayHistory /></DashboardLayout>)} />
      <Route path={"/factoring/roi-calculator"} component={() => (<DashboardLayout><FactoringROICalculator /></DashboardLayout>)} />
      <Route path={"/factoring/rate-calculator"} component={() => (<DashboardLayout><FactoringRateCalculator /></DashboardLayout>)} />
      <Route path={"/factoring/rate-con-upload"} component={() => (<DashboardLayout><FactoringRateConUpload /></DashboardLayout>)} />
      <Route path={"/factoring/recoveries"} component={() => (<DashboardLayout><FactoringRecoveries /></DashboardLayout>)} />
      <Route path={"/factoring/rejected-invoices"} component={() => (<DashboardLayout><FactoringRejectedInvoices /></DashboardLayout>)} />
      <Route path={"/factoring/reports"} component={() => (<DashboardLayout><FactoringReports /></DashboardLayout>)} />
      <Route path={"/factoring/reserve-account"} component={() => (<DashboardLayout><FactoringReserveAccount /></DashboardLayout>)} />
      <Route path={"/factoring/services"} component={() => (<DashboardLayout><FactoringServices /></DashboardLayout>)} />
      <Route path={"/factoring/settings"} component={() => (<DashboardLayout><FactoringSettings /></DashboardLayout>)} />
      <Route path={"/factoring/statement-detail"} component={() => (<DashboardLayout><FactoringStatementDetail /></DashboardLayout>)} />
      <Route path={"/factoring/statements"} component={() => (<DashboardLayout><FactoringStatements /></DashboardLayout>)} />
      <Route path={"/factoring/support"} component={() => (<DashboardLayout><FactoringSupport /></DashboardLayout>)} />
      <Route path={"/factoring/switch-provider"} component={() => (<DashboardLayout><FactoringSwitchProvider /></DashboardLayout>)} />
      <Route path={"/factoring/tax-documents"} component={() => (<DashboardLayout><FactoringTaxDocuments /></DashboardLayout>)} />
      <Route path={"/factoring/terms-conditions"} component={() => (<DashboardLayout><FactoringTermsConditions /></DashboardLayout>)} />
      <Route path={"/factoring/transactions"} component={() => (<DashboardLayout><FactoringTransactions /></DashboardLayout>)} />
      <Route path={"/factoring/volume-analysis"} component={() => (<DashboardLayout><FactoringVolumeAnalysis /></DashboardLayout>)} />
      <Route path={"/factoring/volume-discounts"} component={() => (<DashboardLayout><FactoringVolumeDiscounts /></DashboardLayout>)} />
      <Route path={"/factoring/wire-transfers"} component={() => (<DashboardLayout><FactoringWireTransfers /></DashboardLayout>)} />
      <Route path={"/factoring/write-offs"} component={() => (<DashboardLayout><FactoringWriteOffs /></DashboardLayout>)} />
      <Route path={"/feature-flags"} component={() => (<DashboardLayout><FeatureFlags /></DashboardLayout>)} />
      <Route path={"/feature-requests"} component={() => (<DashboardLayout><FeatureRequests /></DashboardLayout>)} />
      <Route path={"/feedback-surveys"} component={() => (<DashboardLayout><FeedbackSurveys /></DashboardLayout>)} />
      <Route path={"/find-loads"} component={() => (<DashboardLayout><FindLoads /></DashboardLayout>)} />
      <Route path={"/fleet"} component={() => (<DashboardLayout><Fleet /></DashboardLayout>)} />
      <Route path={"/fleet-compliance"} component={() => (<DashboardLayout><FleetCompliance /></DashboardLayout>)} />
      <Route path={"/fleet-insurance"} component={() => (<DashboardLayout><FleetInsurance /></DashboardLayout>)} />
      <Route path={"/fleet-management"} component={() => (<DashboardLayout><FleetManagement /></DashboardLayout>)} />
      <Route path={"/fleet-map"} component={() => (<DashboardLayout><FleetMap /></DashboardLayout>)} />
      <Route path={"/fleet-overview"} component={() => (<DashboardLayout><FleetOverview /></DashboardLayout>)} />
      <Route path={"/fleet-tracking"} component={() => (<DashboardLayout><FleetTracking /></DashboardLayout>)} />
      <Route path={"/fuel-card-management"} component={() => (<DashboardLayout><FuelCardManagement /></DashboardLayout>)} />
      <Route path={"/fuel-management"} component={() => (<DashboardLayout><FuelManagement /></DashboardLayout>)} />
      <Route path={"/fuel-prices"} component={() => (<DashboardLayout><FuelPrices /></DashboardLayout>)} />
      <Route path={"/fuel-tracking"} component={() => (<DashboardLayout><FuelTracking /></DashboardLayout>)} />
      <Route path={"/gps-tracking"} component={() => (<DashboardLayout><GPSTracking /></DashboardLayout>)} />
      <Route path={"/geofence-management"} component={() => (<DashboardLayout><GeofenceManagement /></DashboardLayout>)} />
      <Route path={"/global-search"} component={() => (<DashboardLayout><GlobalSearch /></DashboardLayout>)} />
      <Route path={"/hos-compliance"} component={() => (<DashboardLayout><HOSCompliance /></DashboardLayout>)} />
      <Route path={"/hos-tracker"} component={() => (<DashboardLayout><HOSTracker /></DashboardLayout>)} />
      <Route path={"/hazmat-certifications"} component={() => (<DashboardLayout><HazmatCertifications /></DashboardLayout>)} />
      <Route path={"/hazmat-shipments"} component={() => (<DashboardLayout><HazmatShipments /></DashboardLayout>)} />
      <Route path={"/help-center"} component={() => (<DashboardLayout><HelpCenter /></DashboardLayout>)} />
      <Route path={"/home"} component={() => (<DashboardLayout><Home /></DashboardLayout>)} />
      <Route path={"/hot-zones"} component={() => (<DashboardLayout><HotZones /></DashboardLayout>)} />
      <Route path={"/ifta-reporting"} component={() => (<DashboardLayout><IFTAReporting /></DashboardLayout>)} />
      <Route path={"/in-transit"} component={() => (<DashboardLayout><InTransit /></DashboardLayout>)} />
      <Route path={"/incident-report"} component={() => (<DashboardLayout><IncidentReport /></DashboardLayout>)} />
      <Route path={"/incident-reporting"} component={() => (<DashboardLayout><IncidentReporting /></DashboardLayout>)} />
      <Route path={"/incoming-shipments"} component={() => (<DashboardLayout><IncomingShipments /></DashboardLayout>)} />
      <Route path={"/industry-directory"} component={() => (<DashboardLayout><IndustryDirectory /></DashboardLayout>)} />
      <Route path={"/insurance/agent-contact"} component={() => (<DashboardLayout><InsuranceAgentContact /></DashboardLayout>)} />
      <Route path={"/insurance/analytics"} component={() => (<DashboardLayout><InsuranceAnalytics /></DashboardLayout>)} />
      <Route path={"/insurance/benchmarking"} component={() => (<DashboardLayout><InsuranceBenchmarking /></DashboardLayout>)} />
      <Route path={"/insurance/coi-generation"} component={() => (<DashboardLayout><InsuranceCOIGeneration /></DashboardLayout>)} />
      <Route path={"/insurance/coi-management"} component={() => (<DashboardLayout><InsuranceCOIManagement /></DashboardLayout>)} />
      <Route path={"/insurance/coi-requests"} component={() => (<DashboardLayout><InsuranceCOIRequests /></DashboardLayout>)} />
      <Route path={"/insurance/coi-tracking"} component={() => (<DashboardLayout><InsuranceCOITracking /></DashboardLayout>)} />
      <Route path={"/insurance/certificates"} component={() => (<DashboardLayout><InsuranceCertificates /></DashboardLayout>)} />
      <Route path={"/insurance/claim-details"} component={() => (<DashboardLayout><InsuranceClaimDetails /></DashboardLayout>)} />
      <Route path={"/insurance/claim-documents"} component={() => (<DashboardLayout><InsuranceClaimDocuments /></DashboardLayout>)} />
      <Route path={"/insurance/claim-tracking"} component={() => (<DashboardLayout><InsuranceClaimTracking /></DashboardLayout>)} />
      <Route path={"/insurance/claims-filing"} component={() => (<DashboardLayout><InsuranceClaimsFiling /></DashboardLayout>)} />
      <Route path={"/insurance/claims-history"} component={() => (<DashboardLayout><InsuranceClaimsHistory /></DashboardLayout>)} />
      <Route path={"/insurance/compliance-report"} component={() => (<DashboardLayout><InsuranceComplianceReport /></DashboardLayout>)} />
      <Route path={"/insurance/coverage-analysis"} component={() => (<DashboardLayout><InsuranceCoverageAnalysis /></DashboardLayout>)} />
      <Route path={"/insurance/dashboard"} component={() => (<DashboardLayout><InsuranceDashboard /></DashboardLayout>)} />
      <Route path={"/insurance/document-vault"} component={() => (<DashboardLayout><InsuranceDocumentVault /></DashboardLayout>)} />
      <Route path={"/insurance/education"} component={() => (<DashboardLayout><InsuranceEducation /></DashboardLayout>)} />
      <Route path={"/insurance/expiration-alerts"} component={() => (<DashboardLayout><InsuranceExpirationAlerts /></DashboardLayout>)} />
      <Route path={"/insurance/faq"} component={() => (<DashboardLayout><InsuranceFAQ /></DashboardLayout>)} />
      <Route path={"/insurance/management"} component={() => (<DashboardLayout><InsuranceManagement /></DashboardLayout>)} />
      <Route path={"/insurance/marketplace"} component={() => (<DashboardLayout><InsuranceMarketplace /></DashboardLayout>)} />
      <Route path={"/insurance/policy-application"} component={() => (<DashboardLayout><InsurancePolicyApplication /></DashboardLayout>)} />
      <Route path={"/insurance/policy-cancellation"} component={() => (<DashboardLayout><InsurancePolicyCancellation /></DashboardLayout>)} />
      <Route path={"/insurance/policy-comparison"} component={() => (<DashboardLayout><InsurancePolicyComparison /></DashboardLayout>)} />
      <Route path={"/insurance/policy-details"} component={() => (<DashboardLayout><InsurancePolicyDetails /></DashboardLayout>)} />
      <Route path={"/insurance/policy-management"} component={() => (<DashboardLayout><InsurancePolicyManagement /></DashboardLayout>)} />
      <Route path={"/insurance/policy-modification"} component={() => (<DashboardLayout><InsurancePolicyModification /></DashboardLayout>)} />
      <Route path={"/insurance/policy-renewal"} component={() => (<DashboardLayout><InsurancePolicyRenewal /></DashboardLayout>)} />
      <Route path={"/insurance/policy-search"} component={() => (<DashboardLayout><InsurancePolicySearch /></DashboardLayout>)} />
      <Route path={"/insurance/premium-analysis"} component={() => (<DashboardLayout><InsurancePremiumAnalysis /></DashboardLayout>)} />
      <Route path={"/insurance/provider-details"} component={() => (<DashboardLayout><InsuranceProviderDetails /></DashboardLayout>)} />
      <Route path={"/insurance/provider-directory"} component={() => (<DashboardLayout><InsuranceProviderDirectory /></DashboardLayout>)} />
      <Route path={"/insurance/provider-reviews"} component={() => (<DashboardLayout><InsuranceProviderReviews /></DashboardLayout>)} />
      <Route path={"/insurance/quote-comparison"} component={() => (<DashboardLayout><InsuranceQuoteComparison /></DashboardLayout>)} />
      <Route path={"/insurance/quote-request"} component={() => (<DashboardLayout><InsuranceQuoteRequest /></DashboardLayout>)} />
      <Route path={"/insurance/risk-management"} component={() => (<DashboardLayout><InsuranceRiskManagement /></DashboardLayout>)} />
      <Route path={"/insurance/risk-scoring"} component={() => (<DashboardLayout><InsuranceRiskScoring /></DashboardLayout>)} />
      <Route path={"/integration/api-key-setup"} component={() => (<DashboardLayout><IntegrationAPIKeySetup /></DashboardLayout>)} />
      <Route path={"/integration/api-testing"} component={() => (<DashboardLayout><IntegrationAPITesting /></DashboardLayout>)} />
      <Route path={"/integration/accounting-setup"} component={() => (<DashboardLayout><IntegrationAccountingSetup /></DashboardLayout>)} />
      <Route path={"/integration/accounting-status"} component={() => (<DashboardLayout><IntegrationAccountingStatus /></DashboardLayout>)} />
      <Route path={"/integration/alerts"} component={() => (<DashboardLayout><IntegrationAlerts /></DashboardLayout>)} />
      <Route path={"/integration/bi-setup"} component={() => (<DashboardLayout><IntegrationBISetup /></DashboardLayout>)} />
      <Route path={"/integration/background-check-setup"} component={() => (<DashboardLayout><IntegrationBackgroundCheckSetup /></DashboardLayout>)} />
      <Route path={"/integration/certification"} component={() => (<DashboardLayout><IntegrationCertification /></DashboardLayout>)} />
      <Route path={"/integration/custom-api"} component={() => (<DashboardLayout><IntegrationCustomAPI /></DashboardLayout>)} />
      <Route path={"/integration/data-warehouse"} component={() => (<DashboardLayout><IntegrationDataWarehouse /></DashboardLayout>)} />
      <Route path={"/integration/details"} component={() => (<DashboardLayout><IntegrationDetails /></DashboardLayout>)} />
      <Route path={"/integration/directory"} component={() => (<DashboardLayout><IntegrationDirectory /></DashboardLayout>)} />
      <Route path={"/integration/document-setup"} component={() => (<DashboardLayout><IntegrationDocumentSetup /></DashboardLayout>)} />
      <Route path={"/integration/documentation"} component={() => (<DashboardLayout><IntegrationDocumentation /></DashboardLayout>)} />
      <Route path={"/integration/drug-test-setup"} component={() => (<DashboardLayout><IntegrationDrugTestSetup /></DashboardLayout>)} />
      <Route path={"/integration/eld-setup"} component={() => (<DashboardLayout><IntegrationELDSetup /></DashboardLayout>)} />
      <Route path={"/integration/eld-status"} component={() => (<DashboardLayout><IntegrationELDStatus /></DashboardLayout>)} />
      <Route path={"/integration/erp-setup"} component={() => (<DashboardLayout><IntegrationERPSetup /></DashboardLayout>)} />
      <Route path={"/integration/erp-status"} component={() => (<DashboardLayout><IntegrationERPStatus /></DashboardLayout>)} />
      <Route path={"/integration/email-setup"} component={() => (<DashboardLayout><IntegrationEmailSetup /></DashboardLayout>)} />
      <Route path={"/integration/factoring-setup"} component={() => (<DashboardLayout><IntegrationFactoringSetup /></DashboardLayout>)} />
      <Route path={"/integration/field-mapping"} component={() => (<DashboardLayout><IntegrationFieldMapping /></DashboardLayout>)} />
      <Route path={"/integration/fuel-card-setup"} component={() => (<DashboardLayout><IntegrationFuelCardSetup /></DashboardLayout>)} />
      <Route path={"/integration/fuel-card-status"} component={() => (<DashboardLayout><IntegrationFuelCardStatus /></DashboardLayout>)} />
      <Route path={"/integration/gps-setup"} component={() => (<DashboardLayout><IntegrationGPSSetup /></DashboardLayout>)} />
      <Route path={"/integration/gps-status"} component={() => (<DashboardLayout><IntegrationGPSStatus /></DashboardLayout>)} />
      <Route path={"/integration/hub"} component={() => (<DashboardLayout><IntegrationHub /></DashboardLayout>)} />
      <Route path={"/integration/insurance-setup"} component={() => (<DashboardLayout><IntegrationInsuranceSetup /></DashboardLayout>)} />
      <Route path={"/integration/logs"} component={() => (<DashboardLayout><IntegrationLogs /></DashboardLayout>)} />
      <Route path={"/integration/mapping-setup"} component={() => (<DashboardLayout><IntegrationMappingSetup /></DashboardLayout>)} />
      <Route path={"/integration/marketplace"} component={() => (<DashboardLayout><IntegrationMarketplace /></DashboardLayout>)} />
      <Route path={"/integration/monitoring"} component={() => (<DashboardLayout><IntegrationMonitoring /></DashboardLayout>)} />
      <Route path={"/integration/notification-setup"} component={() => (<DashboardLayout><IntegrationNotificationSetup /></DashboardLayout>)} />
      <Route path={"/integration/o-auth-flow"} component={() => (<DashboardLayout><IntegrationOAuthFlow /></DashboardLayout>)} />
      <Route path={"/integration/partner-portal"} component={() => (<DashboardLayout><IntegrationPartnerPortal /></DashboardLayout>)} />
      <Route path={"/integration/payment-setup"} component={() => (<DashboardLayout><IntegrationPaymentSetup /></DashboardLayout>)} />
      <Route path={"/integration/publish"} component={() => (<DashboardLayout><IntegrationPublish /></DashboardLayout>)} />
      <Route path={"/integration/reviews"} component={() => (<DashboardLayout><IntegrationReviews /></DashboardLayout>)} />
      <Route path={"/integration/sdk-download"} component={() => (<DashboardLayout><IntegrationSDKDownload /></DashboardLayout>)} />
      <Route path={"/integration/sms-setup"} component={() => (<DashboardLayout><IntegrationSMSSetup /></DashboardLayout>)} />
      <Route path={"/integration/sandbox"} component={() => (<DashboardLayout><IntegrationSandbox /></DashboardLayout>)} />
      <Route path={"/integration/settings"} component={() => (<DashboardLayout><IntegrationSettings /></DashboardLayout>)} />
      <Route path={"/integration/setup"} component={() => (<DashboardLayout><IntegrationSetup /></DashboardLayout>)} />
      <Route path={"/integration/storage-setup"} component={() => (<DashboardLayout><IntegrationStorageSetup /></DashboardLayout>)} />
      <Route path={"/integration/support"} component={() => (<DashboardLayout><IntegrationSupport /></DashboardLayout>)} />
      <Route path={"/integration/sync-errors"} component={() => (<DashboardLayout><IntegrationSyncErrors /></DashboardLayout>)} />
      <Route path={"/integration/sync-history"} component={() => (<DashboardLayout><IntegrationSyncHistory /></DashboardLayout>)} />
      <Route path={"/integration/sync-settings"} component={() => (<DashboardLayout><IntegrationSyncSettings /></DashboardLayout>)} />
      <Route path={"/integration/sync-status"} component={() => (<DashboardLayout><IntegrationSyncStatus /></DashboardLayout>)} />
      <Route path={"/integration/tms-setup"} component={() => (<DashboardLayout><IntegrationTMSSetup /></DashboardLayout>)} />
      <Route path={"/integration/tms-status"} component={() => (<DashboardLayout><IntegrationTMSStatus /></DashboardLayout>)} />
      <Route path={"/integration/testing-tools"} component={() => (<DashboardLayout><IntegrationTestingTools /></DashboardLayout>)} />
      <Route path={"/integration/training-setup"} component={() => (<DashboardLayout><IntegrationTrainingSetup /></DashboardLayout>)} />
      <Route path={"/integration/weather-setup"} component={() => (<DashboardLayout><IntegrationWeatherSetup /></DashboardLayout>)} />
      <Route path={"/integration/webhook-logs"} component={() => (<DashboardLayout><IntegrationWebhookLogs /></DashboardLayout>)} />
      <Route path={"/integration/webhooks"} component={() => (<DashboardLayout><IntegrationWebhooks /></DashboardLayout>)} />
      <Route path={"/invoice-details"} component={() => (<DashboardLayout><InvoiceDetails /></DashboardLayout>)} />
      <Route path={"/invoice-management"} component={() => (<DashboardLayout><InvoiceManagement /></DashboardLayout>)} />
      <Route path={"/jobs"} component={() => (<DashboardLayout><Jobs /></DashboardLayout>)} />
      <Route path={"/knowledge-base"} component={() => (<DashboardLayout><KnowledgeBase /></DashboardLayout>)} />
      <Route path={"/lane-analysis"} component={() => (<DashboardLayout><LaneAnalysis /></DashboardLayout>)} />
      <Route path={"/lane-rates"} component={() => (<DashboardLayout><LaneRates /></DashboardLayout>)} />
      <Route path={"/leaderboard"} component={() => (<DashboardLayout><Leaderboard /></DashboardLayout>)} />
      <Route path={"/license-management"} component={() => (<DashboardLayout><LicenseManagement /></DashboardLayout>)} />
      <Route path={"/live-chat"} component={() => (<DashboardLayout><LiveChat /></DashboardLayout>)} />
      <Route path={"/live-news-feed"} component={() => (<DashboardLayout><LiveNewsFeed /></DashboardLayout>)} />
      <Route path={"/load/acceptance"} component={() => (<DashboardLayout><LoadAcceptance /></DashboardLayout>)} />
      <Route path={"/load/accessorials"} component={() => (<DashboardLayout><LoadAccessorials /></DashboardLayout>)} />
      <Route path={"/load/auction"} component={() => (<DashboardLayout><LoadAuction /></DashboardLayout>)} />
      <Route path={"/load/automated-bidding"} component={() => (<DashboardLayout><LoadAutomatedBidding /></DashboardLayout>)} />
      <Route path={"/load/bol-generation"} component={() => (<DashboardLayout><LoadBOLGeneration /></DashboardLayout>)} />
      <Route path={"/load/bol-signing"} component={() => (<DashboardLayout><LoadBOLSigning /></DashboardLayout>)} />
      <Route path={"/load/bidding-strategy"} component={() => (<DashboardLayout><LoadBiddingStrategy /></DashboardLayout>)} />
      <Route path={"/load/bids"} component={() => (<DashboardLayout><LoadBids /></DashboardLayout>)} />
      <Route path={"/load/board"} component={() => (<DashboardLayout><LoadBoard /></DashboardLayout>)} />
      <Route path={"/load/bulk-up"} component={() => (<DashboardLayout><LoadBulkUpload /></DashboardLayout>)} />
      <Route path={"/load/cancellation"} component={() => (<DashboardLayout><LoadCancellation /></DashboardLayout>)} />
      <Route path={"/load/capacity-forecast"} component={() => (<DashboardLayout><LoadCapacityForecast /></DashboardLayout>)} />
      <Route path={"/load/capacity-matching"} component={() => (<DashboardLayout><LoadCapacityMatching /></DashboardLayout>)} />
      <Route path={"/load/carrier-performance"} component={() => (<DashboardLayout><LoadCarrierPerformance /></DashboardLayout>)} />
      <Route path={"/load/carrier-recommendation"} component={() => (<DashboardLayout><LoadCarrierRecommendation /></DashboardLayout>)} />
      <Route path={"/load/carrier-selection"} component={() => (<DashboardLayout><LoadCarrierSelection /></DashboardLayout>)} />
      <Route path={"/load/claim-details"} component={() => (<DashboardLayout><LoadClaimDetails /></DashboardLayout>)} />
      <Route path={"/load/claim-documents"} component={() => (<DashboardLayout><LoadClaimDocuments /></DashboardLayout>)} />
      <Route path={"/load/claims"} component={() => (<DashboardLayout><LoadClaims /></DashboardLayout>)} />
      <Route path={"/load/consolidation"} component={() => (<DashboardLayout><LoadConsolidation /></DashboardLayout>)} />
      <Route path={"/load/contract-lanes"} component={() => (<DashboardLayout><LoadContractLanes /></DashboardLayout>)} />
      <Route path={"/load/contract-management"} component={() => (<DashboardLayout><LoadContractManagement /></DashboardLayout>)} />
      <Route path={"/load/convoy-setup"} component={() => (<DashboardLayout><LoadConvoySetup /></DashboardLayout>)} />
      <Route path={"/load/cost-breakdown"} component={() => (<DashboardLayout><LoadCostBreakdown /></DashboardLayout>)} />
      <Route path={"/load/create"} component={() => (<DashboardLayout><LoadCreate /></DashboardLayout>)} />
      <Route path={"/load/creation-wizard"} component={() => (<DashboardLayout><LoadCreationWizard /></DashboardLayout>)} />
      <Route path={"/load/cross-border"} component={() => (<DashboardLayout><LoadCrossBorder /></DashboardLayout>)} />
      <Route path={"/load/delay-management"} component={() => (<DashboardLayout><LoadDelayManagement /></DashboardLayout>)} />
      <Route path={"/load/delivery-confirmation"} component={() => (<DashboardLayout><LoadDeliveryConfirmation /></DashboardLayout>)} />
      <Route path={"/load/demand-forecast"} component={() => (<DashboardLayout><LoadDemandForecast /></DashboardLayout>)} />
      <Route path={"/load/details"} component={() => (<DashboardLayout><LoadDetails /></DashboardLayout>)} />
      <Route path={"/load/detention-calculator"} component={() => (<DashboardLayout><LoadDetentionCalculator /></DashboardLayout>)} />
      <Route path={"/load/detention-tracking"} component={() => (<DashboardLayout><LoadDetentionTracking /></DashboardLayout>)} />
      <Route path={"/load/dispatch-confirmation"} component={() => (<DashboardLayout><LoadDispatchConfirmation /></DashboardLayout>)} />
      <Route path={"/load/driver-assignment"} component={() => (<DashboardLayout><LoadDriverAssignment /></DashboardLayout>)} />
      <Route path={"/load/driver-performance"} component={() => (<DashboardLayout><LoadDriverPerformance /></DashboardLayout>)} />
      <Route path={"/load/equipment-assignment"} component={() => (<DashboardLayout><LoadEquipmentAssignment /></DashboardLayout>)} />
      <Route path={"/load/escalation"} component={() => (<DashboardLayout><LoadEscalation /></DashboardLayout>)} />
      <Route path={"/load/exception-handling"} component={() => (<DashboardLayout><LoadExceptionHandling /></DashboardLayout>)} />
      <Route path={"/load/forecast"} component={() => (<DashboardLayout><LoadForecast /></DashboardLayout>)} />
      <Route path={"/load/hazmat-documents"} component={() => (<DashboardLayout><LoadHazmatDocuments /></DashboardLayout>)} />
      <Route path={"/load/history"} component={() => (<DashboardLayout><LoadHistory /></DashboardLayout>)} />
      <Route path={"/load/in-transit-tracking"} component={() => (<DashboardLayout><LoadInTransitTracking /></DashboardLayout>)} />
      <Route path={"/load/invoice-generation"} component={() => (<DashboardLayout><LoadInvoiceGeneration /></DashboardLayout>)} />
      <Route path={"/load/invoice-review"} component={() => (<DashboardLayout><LoadInvoiceReview /></DashboardLayout>)} />
      <Route path={"/load/lane-analysis"} component={() => (<DashboardLayout><LoadLaneAnalysis /></DashboardLayout>)} />
      <Route path={"/load/layover-tracking"} component={() => (<DashboardLayout><LoadLayoverTracking /></DashboardLayout>)} />
      <Route path={"/load/margin-analysis"} component={() => (<DashboardLayout><LoadMarginAnalysis /></DashboardLayout>)} />
      <Route path={"/load/multi-stop"} component={() => (<DashboardLayout><LoadMultiStop /></DashboardLayout>)} />
      <Route path={"/load/negotiation"} component={() => (<DashboardLayout><LoadNegotiation /></DashboardLayout>)} />
      <Route path={"/load/on-time-analysis"} component={() => (<DashboardLayout><LoadOnTimeAnalysis /></DashboardLayout>)} />
      <Route path={"/load/pod-capture"} component={() => (<DashboardLayout><LoadPODCapture /></DashboardLayout>)} />
      <Route path={"/load/pod-review"} component={() => (<DashboardLayout><LoadPODReview /></DashboardLayout>)} />
      <Route path={"/load/payment-tracking"} component={() => (<DashboardLayout><LoadPaymentTracking /></DashboardLayout>)} />
      <Route path={"/load/permit-requirements"} component={() => (<DashboardLayout><LoadPermitRequirements /></DashboardLayout>)} />
      <Route path={"/load/pickup-confirmation"} component={() => (<DashboardLayout><LoadPickupConfirmation /></DashboardLayout>)} />
      <Route path={"/load/pricing-optimization"} component={() => (<DashboardLayout><LoadPricingOptimization /></DashboardLayout>)} />
      <Route path={"/load/profit-analysis"} component={() => (<DashboardLayout><LoadProfitAnalysis /></DashboardLayout>)} />
      <Route path={"/load/rfp-builder"} component={() => (<DashboardLayout><LoadRFPBuilder /></DashboardLayout>)} />
      <Route path={"/load/rfp-response"} component={() => (<DashboardLayout><LoadRFPResponse /></DashboardLayout>)} />
      <Route path={"/load/rate-history"} component={() => (<DashboardLayout><LoadRateHistory /></DashboardLayout>)} />
      <Route path={"/load/rate-negotiation"} component={() => (<DashboardLayout><LoadRateNegotiation /></DashboardLayout>)} />
      <Route path={"/load/reassignment"} component={() => (<DashboardLayout><LoadReassignment /></DashboardLayout>)} />
      <Route path={"/load/recurring-setup"} component={() => (<DashboardLayout><LoadRecurringSetup /></DashboardLayout>)} />
      <Route path={"/load/reporting"} component={() => (<DashboardLayout><LoadReporting /></DashboardLayout>)} />
      <Route path={"/load/rerouting"} component={() => (<DashboardLayout><LoadRerouting /></DashboardLayout>)} />
      <Route path={"/load/route-optimization"} component={() => (<DashboardLayout><LoadRouteOptimization /></DashboardLayout>)} />
      <Route path={"/load/settlement"} component={() => (<DashboardLayout><LoadSettlement /></DashboardLayout>)} />
      <Route path={"/load/split"} component={() => (<DashboardLayout><LoadSplit /></DashboardLayout>)} />
      <Route path={"/load/spot-market"} component={() => (<DashboardLayout><LoadSpotMarket /></DashboardLayout>)} />
      <Route path={"/load/status-board"} component={() => (<DashboardLayout><LoadStatusBoard /></DashboardLayout>)} />
      <Route path={"/load/swap"} component={() => (<DashboardLayout><LoadSwap /></DashboardLayout>)} />
      <Route path={"/load/tanu-tracking"} component={() => (<DashboardLayout><LoadTANUTracking /></DashboardLayout>)} />
      <Route path={"/load/template-manager"} component={() => (<DashboardLayout><LoadTemplateManager /></DashboardLayout>)} />
      <Route path={"/load/tender-management"} component={() => (<DashboardLayout><LoadTenderManagement /></DashboardLayout>)} />
      <Route path={"/load/tracking"} component={() => (<DashboardLayout><LoadTracking /></DashboardLayout>)} />
      <Route path={"/load/trend-analysis"} component={() => (<DashboardLayout><LoadTrendAnalysis /></DashboardLayout>)} />
      <Route path={"/load/wizard"} component={() => (<DashboardLayout><LoadWizard /></DashboardLayout>)} />
      <Route path={"/load/ing-bays"} component={() => (<DashboardLayout><LoadingBays /></DashboardLayout>)} />
      <Route path={"/login"} component={() => (<DashboardLayout><Login /></DashboardLayout>)} />
      <Route path={"/login-history"} component={() => (<DashboardLayout><LoginHistory /></DashboardLayout>)} />
      <Route path={"/mvr-reports"} component={() => (<DashboardLayout><MVRReports /></DashboardLayout>)} />
      <Route path={"/maintenance"} component={() => (<DashboardLayout><Maintenance /></DashboardLayout>)} />
      <Route path={"/maintenance-schedule"} component={() => (<DashboardLayout><MaintenanceSchedule /></DashboardLayout>)} />
      <Route path={"/market-intelligence"} component={() => (<DashboardLayout><MarketIntelligence /></DashboardLayout>)} />
      <Route path={"/market-pricing"} component={() => (<DashboardLayout><MarketPricingDashboard /></DashboardLayout>)} />
      <Route path={"/marketplace"} component={() => (<DashboardLayout><Marketplace /></DashboardLayout>)} />
      <Route path={"/matched-loads"} component={() => (<DashboardLayout><MatchedLoads /></DashboardLayout>)} />
      <Route path={"/medical-certifications"} component={() => (<DashboardLayout><MedicalCertifications /></DashboardLayout>)} />
      <Route path={"/messages"} component={() => (<DashboardLayout><Messages /></DashboardLayout>)} />
      <Route path={"/messaging/archive"} component={() => (<DashboardLayout><MessagingArchive /></DashboardLayout>)} />
      <Route path={"/messaging/blocked"} component={() => (<DashboardLayout><MessagingBlocked /></DashboardLayout>)} />
      <Route path={"/messaging/broadcast"} component={() => (<DashboardLayout><MessagingBroadcast /></DashboardLayout>)} />
      <Route path={"/messaging/call-history"} component={() => (<DashboardLayout><MessagingCallHistory /></DashboardLayout>)} />
      <Route path={"/messaging/carrier-channel"} component={() => (<DashboardLayout><MessagingCarrierChannel /></DashboardLayout>)} />
      <Route path={"/messaging/center"} component={() => (<DashboardLayout><MessagingCenter /></DashboardLayout>)} />
      <Route path={"/messaging/compose"} component={() => (<DashboardLayout><MessagingCompose /></DashboardLayout>)} />
      <Route path={"/messaging/contact-directory"} component={() => (<DashboardLayout><MessagingContactDirectory /></DashboardLayout>)} />
      <Route path={"/messaging/customer-channel"} component={() => (<DashboardLayout><MessagingCustomerChannel /></DashboardLayout>)} />
      <Route path={"/messaging/dispatch-channel"} component={() => (<DashboardLayout><MessagingDispatchChannel /></DashboardLayout>)} />
      <Route path={"/messaging/document-sharing"} component={() => (<DashboardLayout><MessagingDocumentSharing /></DashboardLayout>)} />
      <Route path={"/messaging/driver-channel"} component={() => (<DashboardLayout><MessagingDriverChannel /></DashboardLayout>)} />
      <Route path={"/messaging/eta-sharing"} component={() => (<DashboardLayout><MessagingETASharing /></DashboardLayout>)} />
      <Route path={"/messaging/emergency-channel"} component={() => (<DashboardLayout><MessagingEmergencyChannel /></DashboardLayout>)} />
      <Route path={"/messaging/emoji"} component={() => (<DashboardLayout><MessagingEmoji /></DashboardLayout>)} />
      <Route path={"/messaging/export"} component={() => (<DashboardLayout><MessagingExport /></DashboardLayout>)} />
      <Route path={"/messaging/favorites"} component={() => (<DashboardLayout><MessagingFavorites /></DashboardLayout>)} />
      <Route path={"/messaging/file-sharing"} component={() => (<DashboardLayout><MessagingFileSharing /></DashboardLayout>)} />
      <Route path={"/messaging/group-create"} component={() => (<DashboardLayout><MessagingGroupCreate /></DashboardLayout>)} />
      <Route path={"/messaging/group-management"} component={() => (<DashboardLayout><MessagingGroupManagement /></DashboardLayout>)} />
      <Route path={"/messaging/in-chat-payment"} component={() => (<DashboardLayout><MessagingInChatPayment /></DashboardLayout>)} />
      <Route path={"/messaging/inbox"} component={() => (<DashboardLayout><MessagingInbox /></DashboardLayout>)} />
      <Route path={"/messaging/location-sharing"} component={() => (<DashboardLayout><MessagingLocationSharing /></DashboardLayout>)} />
      <Route path={"/messaging/muted"} component={() => (<DashboardLayout><MessagingMuted /></DashboardLayout>)} />
      <Route path={"/messaging/notifications"} component={() => (<DashboardLayout><MessagingNotifications /></DashboardLayout>)} />
      <Route path={"/messaging/read-receipts"} component={() => (<DashboardLayout><MessagingReadReceipts /></DashboardLayout>)} />
      <Route path={"/messaging/scheduled"} component={() => (<DashboardLayout><MessagingScheduled /></DashboardLayout>)} />
      <Route path={"/messaging/search"} component={() => (<DashboardLayout><MessagingSearch /></DashboardLayout>)} />
      <Route path={"/messaging/settings"} component={() => (<DashboardLayout><MessagingSettings /></DashboardLayout>)} />
      <Route path={"/messaging/starred"} component={() => (<DashboardLayout><MessagingStarred /></DashboardLayout>)} />
      <Route path={"/messaging/status-updates"} component={() => (<DashboardLayout><MessagingStatusUpdates /></DashboardLayout>)} />
      <Route path={"/messaging/templates"} component={() => (<DashboardLayout><MessagingTemplates /></DashboardLayout>)} />
      <Route path={"/messaging/thread-view"} component={() => (<DashboardLayout><MessagingThreadView /></DashboardLayout>)} />
      <Route path={"/messaging/translation"} component={() => (<DashboardLayout><MessagingTranslation /></DashboardLayout>)} />
      <Route path={"/messaging/typing-indicators"} component={() => (<DashboardLayout><MessagingTypingIndicators /></DashboardLayout>)} />
      <Route path={"/messaging/video-call"} component={() => (<DashboardLayout><MessagingVideoCall /></DashboardLayout>)} />
      <Route path={"/messaging/voice-message"} component={() => (<DashboardLayout><MessagingVoiceMessage /></DashboardLayout>)} />
      <Route path={"/mileage-calculator"} component={() => (<DashboardLayout><MileageCalculator /></DashboardLayout>)} />
      <Route path={"/missions"} component={() => (<DashboardLayout><Missions /></DashboardLayout>)} />
      <Route path={"/my-loads"} component={() => (<DashboardLayout><MyLoads /></DashboardLayout>)} />
      <Route path={"/navigation-breadcrumb-trail"} component={() => (<DashboardLayout><NavigationBreadcrumbTrail /></DashboardLayout>)} />
      <Route path={"/navigation-fuel-optimization"} component={() => (<DashboardLayout><NavigationFuelOptimization /></DashboardLayout>)} />
      <Route path={"/navigation-hos-routing"} component={() => (<DashboardLayout><NavigationHOSRouting /></DashboardLayout>)} />
      <Route path={"/navigation-hazmat-routing"} component={() => (<DashboardLayout><NavigationHazmatRouting /></DashboardLayout>)} />
      <Route path={"/navigation-height-clearance"} component={() => (<DashboardLayout><NavigationHeightClearance /></DashboardLayout>)} />
      <Route path={"/navigation-historical-routes"} component={() => (<DashboardLayout><NavigationHistoricalRoutes /></DashboardLayout>)} />
      <Route path={"/navigation-home"} component={() => (<DashboardLayout><NavigationHome /></DashboardLayout>)} />
      <Route path={"/navigation-multi-stop"} component={() => (<DashboardLayout><NavigationMultiStop /></DashboardLayout>)} />
      <Route path={"/navigation-playback"} component={() => (<DashboardLayout><NavigationPlayback /></DashboardLayout>)} />
      <Route path={"/navigation-route-options"} component={() => (<DashboardLayout><NavigationRouteOptions /></DashboardLayout>)} />
      <Route path={"/navigation-toll-optimization"} component={() => (<DashboardLayout><NavigationTollOptimization /></DashboardLayout>)} />
      <Route path={"/navigation-traffic-routing"} component={() => (<DashboardLayout><NavigationTrafficRouting /></DashboardLayout>)} />
      <Route path={"/navigation-truck-routing"} component={() => (<DashboardLayout><NavigationTruckRouting /></DashboardLayout>)} />
      <Route path={"/navigation-weather-routing"} component={() => (<DashboardLayout><NavigationWeatherRouting /></DashboardLayout>)} />
      <Route path={"/navigation-weight-restrictions"} component={() => (<DashboardLayout><NavigationWeightRestrictions /></DashboardLayout>)} />
      <Route path={"/news-feed"} component={() => (<DashboardLayout><NewsFeed /></DashboardLayout>)} />
      <Route path={"/notification-center"} component={() => (<DashboardLayout><NotificationCenter /></DashboardLayout>)} />
      <Route path={"/notification-settings"} component={() => (<DashboardLayout><NotificationSettings /></DashboardLayout>)} />
      <Route path={"/notifications"} component={() => (<DashboardLayout><Notifications /></DashboardLayout>)} />
      <Route path={"/notifications-center"} component={() => (<DashboardLayout><NotificationsCenter /></DashboardLayout>)} />
      <Route path={"/on-time-performance"} component={() => (<DashboardLayout><OnTimePerformance /></DashboardLayout>)} />
      <Route path={"/onboarding"} component={() => (<DashboardLayout><Onboarding /></DashboardLayout>)} />
      <Route path={"/onboarding-company-setup"} component={() => (<DashboardLayout><OnboardingCompanySetup /></DashboardLayout>)} />
      <Route path={"/onboarding-documents"} component={() => (<DashboardLayout><OnboardingDocuments /></DashboardLayout>)} />
      <Route path={"/opportunities"} component={() => (<DashboardLayout><Opportunities /></DashboardLayout>)} />
      <Route path={"/outgoing-shipments"} component={() => (<DashboardLayout><OutgoingShipments /></DashboardLayout>)} />
      <Route path={"/pod-management"} component={() => (<DashboardLayout><PODManagement /></DashboardLayout>)} />
      <Route path={"/psp-reports"} component={() => (<DashboardLayout><PSPReports /></DashboardLayout>)} />
      <Route path={"/password-change"} component={() => (<DashboardLayout><PasswordChange /></DashboardLayout>)} />
      <Route path={"/payment-history"} component={() => (<DashboardLayout><PaymentHistory /></DashboardLayout>)} />
      <Route path={"/payment-methods"} component={() => (<DashboardLayout><PaymentMethods /></DashboardLayout>)} />
      <Route path={"/payment-processing"} component={() => (<DashboardLayout><PaymentProcessing /></DashboardLayout>)} />
      <Route path={"/payments"} component={() => (<DashboardLayout><Payments /></DashboardLayout>)} />
      <Route path={"/payroll-management"} component={() => (<DashboardLayout><PayrollManagement /></DashboardLayout>)} />
      <Route path={"/performance-monitor"} component={() => (<DashboardLayout><PerformanceMonitor /></DashboardLayout>)} />
      <Route path={"/performance-reports"} component={() => (<DashboardLayout><PerformanceReports /></DashboardLayout>)} />
      <Route path={"/performance-reviews"} component={() => (<DashboardLayout><PerformanceReviews /></DashboardLayout>)} />
      <Route path={"/permit-management"} component={() => (<DashboardLayout><PermitManagement /></DashboardLayout>)} />
      <Route path={"/permit-requirements"} component={() => (<DashboardLayout><PermitRequirements /></DashboardLayout>)} />
      <Route path={"/permits"} component={() => (<DashboardLayout><Permits /></DashboardLayout>)} />
      <Route path={"/platform-analytics"} component={() => (<DashboardLayout><PlatformAnalytics /></DashboardLayout>)} />
      <Route path={"/platform-health"} component={() => (<DashboardLayout><PlatformHealth /></DashboardLayout>)} />
      <Route path={"/pre-trip-checklist"} component={() => (<DashboardLayout><PreTripChecklist /></DashboardLayout>)} />
      <Route path={"/pre-trip-inspection"} component={() => (<DashboardLayout><PreTripInspection /></DashboardLayout>)} />
      <Route path={"/preferences"} component={() => (<DashboardLayout><Preferences /></DashboardLayout>)} />
      <Route path={"/privacy-policy"} component={() => (<DashboardLayout><PrivacyPolicy /></DashboardLayout>)} />
      <Route path={"/procedures"} component={() => (<DashboardLayout><Procedures /></DashboardLayout>)} />
      <Route path={"/profile"} component={() => (<DashboardLayout><Profile /></DashboardLayout>)} />
      <Route path={"/push-notifications"} component={() => (<DashboardLayout><PushNotifications /></DashboardLayout>)} />
      <Route path={"/queue-monitor"} component={() => (<DashboardLayout><QueueMonitor /></DashboardLayout>)} />
      <Route path={"/quick-actions"} component={() => (<DashboardLayout><QuickActions /></DashboardLayout>)} />
      <Route path={"/quote-management"} component={() => (<DashboardLayout><QuoteManagement /></DashboardLayout>)} />
      <Route path={"/quote-requests"} component={() => (<DashboardLayout><QuoteRequests /></DashboardLayout>)} />
      <Route path={"/rack-status"} component={() => (<DashboardLayout><RackStatus /></DashboardLayout>)} />
      <Route path={"/rate-calculator"} component={() => (<DashboardLayout><RateCalculator /></DashboardLayout>)} />
      <Route path={"/rate-confirmation-sign"} component={() => (<DashboardLayout><RateConfirmationSign /></DashboardLayout>)} />
      <Route path={"/rate-confirmations"} component={() => (<DashboardLayout><RateConfirmations /></DashboardLayout>)} />
      <Route path={"/rate-limiting"} component={() => (<DashboardLayout><RateLimiting /></DashboardLayout>)} />
      <Route path={"/rate-management"} component={() => (<DashboardLayout><RateManagement /></DashboardLayout>)} />
      <Route path={"/referral-program"} component={() => (<DashboardLayout><ReferralProgram /></DashboardLayout>)} />
      <Route path={"/register"} component={() => (<DashboardLayout><Register /></DashboardLayout>)} />
      <Route path={"/register-broker"} component={() => (<DashboardLayout><RegisterBroker /></DashboardLayout>)} />
      <Route path={"/register-carrier"} component={() => (<DashboardLayout><RegisterCarrier /></DashboardLayout>)} />
      <Route path={"/register-catalyst"} component={() => (<DashboardLayout><RegisterCatalyst /></DashboardLayout>)} />
      <Route path={"/register-compliance"} component={() => (<DashboardLayout><RegisterCompliance /></DashboardLayout>)} />
      <Route path={"/register-driver"} component={() => (<DashboardLayout><RegisterDriver /></DashboardLayout>)} />
      <Route path={"/register-escort"} component={() => (<DashboardLayout><RegisterEscort /></DashboardLayout>)} />
      <Route path={"/register-safety"} component={() => (<DashboardLayout><RegisterSafety /></DashboardLayout>)} />
      <Route path={"/register-shipper"} component={() => (<DashboardLayout><RegisterShipper /></DashboardLayout>)} />
      <Route path={"/register-terminal"} component={() => (<DashboardLayout><RegisterTerminal /></DashboardLayout>)} />
      <Route path={"/release-notes"} component={() => (<DashboardLayout><ReleaseNotes /></DashboardLayout>)} />
      <Route path={"/report-builder"} component={() => (<DashboardLayout><ReportBuilder /></DashboardLayout>)} />
      <Route path={"/reporting-dashboard"} component={() => (<DashboardLayout><ReportingDashboard /></DashboardLayout>)} />
      <Route path={"/rest-stops"} component={() => (<DashboardLayout><RestStops /></DashboardLayout>)} />
      <Route path={"/revenue-analytics"} component={() => (<DashboardLayout><RevenueAnalytics /></DashboardLayout>)} />
      <Route path={"/rewards"} component={() => (<DashboardLayout><Rewards /></DashboardLayout>)} />
      <Route path={"/rewards-center"} component={() => (<DashboardLayout><RewardsCenter /></DashboardLayout>)} />
      <Route path={"/road-test-records"} component={() => (<DashboardLayout><RoadTestRecords /></DashboardLayout>)} />
      <Route path={"/role-permissions"} component={() => (<DashboardLayout><RolePermissions /></DashboardLayout>)} />
      <Route path={"/route-planning"} component={() => (<DashboardLayout><RoutePlanning /></DashboardLayout>)} />
      <Route path={"/run-tickets"} component={() => (<DashboardLayout><RunTickets /></DashboardLayout>)} />
      <Route path={"/safer-lookup"} component={() => (<DashboardLayout><SAFERLookup /></DashboardLayout>)} />
      <Route path={"/scada"} component={() => (<DashboardLayout><SCADA /></DashboardLayout>)} />
      <Route path={"/scada-monitor"} component={() => (<DashboardLayout><SCADAMonitor /></DashboardLayout>)} />
      <Route path={"/sms-notifications"} component={() => (<DashboardLayout><SMSNotifications /></DashboardLayout>)} />
      <Route path={"/safety/accident-create"} component={() => (<DashboardLayout><SafetyAccidentCreate /></DashboardLayout>)} />
      <Route path={"/safety/accident-dot-reporting"} component={() => (<DashboardLayout><SafetyAccidentDOTReporting /></DashboardLayout>)} />
      <Route path={"/safety/accident-dashboard"} component={() => (<DashboardLayout><SafetyAccidentDashboard /></DashboardLayout>)} />
      <Route path={"/safety/accident-details"} component={() => (<DashboardLayout><SafetyAccidentDetails /></DashboardLayout>)} />
      <Route path={"/safety/accident-diagram"} component={() => (<DashboardLayout><SafetyAccidentDiagram /></DashboardLayout>)} />
      <Route path={"/safety/accident-insurance-claim"} component={() => (<DashboardLayout><SafetyAccidentInsuranceClaim /></DashboardLayout>)} />
      <Route path={"/safety/accident-investigation"} component={() => (<DashboardLayout><SafetyAccidentInvestigation /></DashboardLayout>)} />
      <Route path={"/safety/accident-lessons-learned"} component={() => (<DashboardLayout><SafetyAccidentLessonsLearned /></DashboardLayout>)} />
      <Route path={"/safety/accident-photos"} component={() => (<DashboardLayout><SafetyAccidentPhotos /></DashboardLayout>)} />
      <Route path={"/safety/accident-police-report"} component={() => (<DashboardLayout><SafetyAccidentPoliceReport /></DashboardLayout>)} />
      <Route path={"/safety/accident-preventability"} component={() => (<DashboardLayout><SafetyAccidentPreventability /></DashboardLayout>)} />
      <Route path={"/safety/accident-reports"} component={() => (<DashboardLayout><SafetyAccidentReports /></DashboardLayout>)} />
      <Route path={"/safety/accident-witness"} component={() => (<DashboardLayout><SafetyAccidentWitness /></DashboardLayout>)} />
      <Route path={"/safety/audit-findings"} component={() => (<DashboardLayout><SafetyAuditFindings /></DashboardLayout>)} />
      <Route path={"/safety/audit-preparation"} component={() => (<DashboardLayout><SafetyAuditPreparation /></DashboardLayout>)} />
      <Route path={"/safety/benchmarking"} component={() => (<DashboardLayout><SafetyBenchmarking /></DashboardLayout>)} />
      <Route path={"/safety/csa-alerts"} component={() => (<DashboardLayout><SafetyCSAAlerts /></DashboardLayout>)} />
      <Route path={"/safety/csa-basics"} component={() => (<DashboardLayout><SafetyCSABasics /></DashboardLayout>)} />
      <Route path={"/safety/csa-dashboard"} component={() => (<DashboardLayout><SafetyCSADashboard /></DashboardLayout>)} />
      <Route path={"/safety/csa-data-qs"} component={() => (<DashboardLayout><SafetyCSADataQs /></DashboardLayout>)} />
      <Route path={"/safety/csa-inspections"} component={() => (<DashboardLayout><SafetyCSAInspections /></DashboardLayout>)} />
      <Route path={"/safety/csa-monitoring"} component={() => (<DashboardLayout><SafetyCSAMonitoring /></DashboardLayout>)} />
      <Route path={"/safety/csa-remediation"} component={() => (<DashboardLayout><SafetyCSARemediation /></DashboardLayout>)} />
      <Route path={"/safety/csa-reports"} component={() => (<DashboardLayout><SafetyCSAReports /></DashboardLayout>)} />
      <Route path={"/safety/csa-scores"} component={() => (<DashboardLayout><SafetyCSAScores /></DashboardLayout>)} />
      <Route path={"/safety/csa-trends"} component={() => (<DashboardLayout><SafetyCSATrends /></DashboardLayout>)} />
      <Route path={"/safety/csa-violations"} component={() => (<DashboardLayout><SafetyCSAViolations /></DashboardLayout>)} />
      <Route path={"/safety/compliance-dashboard"} component={() => (<DashboardLayout><SafetyComplianceDashboard /></DashboardLayout>)} />
      <Route path={"/safety/corrective-action-plan"} component={() => (<DashboardLayout><SafetyCorrectiveActionPlan /></DashboardLayout>)} />
      <Route path={"/safety/custom-reports"} component={() => (<DashboardLayout><SafetyCustomReports /></DashboardLayout>)} />
      <Route path={"/safety/dot-compliance"} component={() => (<DashboardLayout><SafetyDOTCompliance /></DashboardLayout>)} />
      <Route path={"/safety/dashboard"} component={() => (<DashboardLayout><SafetyDashboard /></DashboardLayout>)} />
      <Route path={"/safety/defect-repair"} component={() => (<DashboardLayout><SafetyDefectRepair /></DashboardLayout>)} />
      <Route path={"/safety/defect-tracking"} component={() => (<DashboardLayout><SafetyDefectTracking /></DashboardLayout>)} />
      <Route path={"/safety/defensive-driving"} component={() => (<DashboardLayout><SafetyDefensiveDriving /></DashboardLayout>)} />
      <Route path={"/safety/driver-alerts"} component={() => (<DashboardLayout><SafetyDriverAlerts /></DashboardLayout>)} />
      <Route path={"/safety/driver-behavior"} component={() => (<DashboardLayout><SafetyDriverBehavior /></DashboardLayout>)} />
      <Route path={"/safety/driver-behavior-details"} component={() => (<DashboardLayout><SafetyDriverBehaviorDetails /></DashboardLayout>)} />
      <Route path={"/safety/driver-coaching"} component={() => (<DashboardLayout><SafetyDriverCoaching /></DashboardLayout>)} />
      <Route path={"/safety/driver-comparison"} component={() => (<DashboardLayout><SafetyDriverComparison /></DashboardLayout>)} />
      <Route path={"/safety/driver-dashboard"} component={() => (<DashboardLayout><SafetyDriverDashboard /></DashboardLayout>)} />
      <Route path={"/safety/driver-discipline"} component={() => (<DashboardLayout><SafetyDriverDiscipline /></DashboardLayout>)} />
      <Route path={"/safety/driver-history"} component={() => (<DashboardLayout><SafetyDriverHistory /></DashboardLayout>)} />
      <Route path={"/safety/driver-recognition"} component={() => (<DashboardLayout><SafetyDriverRecognition /></DashboardLayout>)} />
      <Route path={"/safety/driver-reports"} component={() => (<DashboardLayout><SafetyDriverReports /></DashboardLayout>)} />
      <Route path={"/safety/driver-retraining"} component={() => (<DashboardLayout><SafetyDriverRetraining /></DashboardLayout>)} />
      <Route path={"/safety/driver-scoring"} component={() => (<DashboardLayout><SafetyDriverScoring /></DashboardLayout>)} />
      <Route path={"/safety/driver-trends"} component={() => (<DashboardLayout><SafetyDriverTrends /></DashboardLayout>)} />
      <Route path={"/safety/equipment-dashboard"} component={() => (<DashboardLayout><SafetyEquipmentDashboard /></DashboardLayout>)} />
      <Route path={"/safety/equipment-inspections"} component={() => (<DashboardLayout><SafetyEquipmentInspections /></DashboardLayout>)} />
      <Route path={"/safety/equipment-reports"} component={() => (<DashboardLayout><SafetyEquipmentReports /></DashboardLayout>)} />
      <Route path={"/safety/equipment-trends"} component={() => (<DashboardLayout><SafetyEquipmentTrends /></DashboardLayout>)} />
      <Route path={"/safety/hazmat-compliance"} component={() => (<DashboardLayout><SafetyHazmatCompliance /></DashboardLayout>)} />
      <Route path={"/safety/hazmat-training"} component={() => (<DashboardLayout><SafetyHazmatTraining /></DashboardLayout>)} />
      <Route path={"/safety/incident-analysis"} component={() => (<DashboardLayout><SafetyIncidentAnalysis /></DashboardLayout>)} />
      <Route path={"/safety/incident-closure"} component={() => (<DashboardLayout><SafetyIncidentClosure /></DashboardLayout>)} />
      <Route path={"/safety/incident-corrective-action"} component={() => (<DashboardLayout><SafetyIncidentCorrectiveAction /></DashboardLayout>)} />
      <Route path={"/safety/incident-costs"} component={() => (<DashboardLayout><SafetyIncidentCosts /></DashboardLayout>)} />
      <Route path={"/safety/incident-create"} component={() => (<DashboardLayout><SafetyIncidentCreate /></DashboardLayout>)} />
      <Route path={"/safety/incident-dashboard"} component={() => (<DashboardLayout><SafetyIncidentDashboard /></DashboardLayout>)} />
      <Route path={"/safety/incident-details"} component={() => (<DashboardLayout><SafetyIncidentDetails /></DashboardLayout>)} />
      <Route path={"/safety/incident-follow-up"} component={() => (<DashboardLayout><SafetyIncidentFollowUp /></DashboardLayout>)} />
      <Route path={"/safety/incident-investigation"} component={() => (<DashboardLayout><SafetyIncidentInvestigation /></DashboardLayout>)} />
      <Route path={"/safety/incident-photos"} component={() => (<DashboardLayout><SafetyIncidentPhotos /></DashboardLayout>)} />
      <Route path={"/safety/incident-reporting"} component={() => (<DashboardLayout><SafetyIncidentReporting /></DashboardLayout>)} />
      <Route path={"/safety/incident-reports"} component={() => (<DashboardLayout><SafetyIncidentReports /></DashboardLayout>)} />
      <Route path={"/safety/incident-timeline"} component={() => (<DashboardLayout><SafetyIncidentTimeline /></DashboardLayout>)} />
      <Route path={"/safety/incident-tracking"} component={() => (<DashboardLayout><SafetyIncidentTracking /></DashboardLayout>)} />
      <Route path={"/safety/incident-trends"} component={() => (<DashboardLayout><SafetyIncidentTrends /></DashboardLayout>)} />
      <Route path={"/safety/incident-witness"} component={() => (<DashboardLayout><SafetyIncidentWitness /></DashboardLayout>)} />
      <Route path={"/safety/incidents"} component={() => (<DashboardLayout><SafetyIncidents /></DashboardLayout>)} />
      <Route path={"/safety/inspection-form"} component={() => (<DashboardLayout><SafetyInspectionForm /></DashboardLayout>)} />
      <Route path={"/safety/inspection-reports"} component={() => (<DashboardLayout><SafetyInspectionReports /></DashboardLayout>)} />
      <Route path={"/safety/inspection-results"} component={() => (<DashboardLayout><SafetyInspectionResults /></DashboardLayout>)} />
      <Route path={"/safety/inspection-schedule"} component={() => (<DashboardLayout><SafetyInspectionSchedule /></DashboardLayout>)} />
      <Route path={"/safety/kpi-dashboard"} component={() => (<DashboardLayout><SafetyKPIDashboard /></DashboardLayout>)} />
      <Route path={"/safety/manager-dashboard"} component={() => (<DashboardLayout><SafetyManagerDashboard /></DashboardLayout>)} />
      <Route path={"/safety/meeting-agenda"} component={() => (<DashboardLayout><SafetyMeetingAgenda /></DashboardLayout>)} />
      <Route path={"/safety/meeting-attendance"} component={() => (<DashboardLayout><SafetyMeetingAttendance /></DashboardLayout>)} />
      <Route path={"/safety/meeting-dashboard"} component={() => (<DashboardLayout><SafetyMeetingDashboard /></DashboardLayout>)} />
      <Route path={"/safety/meeting-minutes"} component={() => (<DashboardLayout><SafetyMeetingMinutes /></DashboardLayout>)} />
      <Route path={"/safety/meeting-reports"} component={() => (<DashboardLayout><SafetyMeetingReports /></DashboardLayout>)} />
      <Route path={"/safety/meeting-schedule"} component={() => (<DashboardLayout><SafetyMeetingSchedule /></DashboardLayout>)} />
      <Route path={"/safety/meetings"} component={() => (<DashboardLayout><SafetyMeetings /></DashboardLayout>)} />
      <Route path={"/safety/metrics"} component={() => (<DashboardLayout><SafetyMetrics /></DashboardLayout>)} />
      <Route path={"/safety/near-miss-reporting"} component={() => (<DashboardLayout><SafetyNearMissReporting /></DashboardLayout>)} />
      <Route path={"/safety/osha-compliance"} component={() => (<DashboardLayout><SafetyOSHACompliance /></DashboardLayout>)} />
      <Route path={"/safety/orientation-program"} component={() => (<DashboardLayout><SafetyOrientationProgram /></DashboardLayout>)} />
      <Route path={"/safety/out-of-service"} component={() => (<DashboardLayout><SafetyOutOfService /></DashboardLayout>)} />
      <Route path={"/safety/predictive-analytics"} component={() => (<DashboardLayout><SafetyPredictiveAnalytics /></DashboardLayout>)} />
      <Route path={"/safety/recall-tracking"} component={() => (<DashboardLayout><SafetyRecallTracking /></DashboardLayout>)} />
      <Route path={"/safety/refresher-training"} component={() => (<DashboardLayout><SafetyRefresherTraining /></DashboardLayout>)} />
      <Route path={"/safety/risk-assessment"} component={() => (<DashboardLayout><SafetyRiskAssessment /></DashboardLayout>)} />
      <Route path={"/safety/risk-dashboard"} component={() => (<DashboardLayout><SafetyRiskDashboard /></DashboardLayout>)} />
      <Route path={"/safety/risk-mitigation"} component={() => (<DashboardLayout><SafetyRiskMitigation /></DashboardLayout>)} />
      <Route path={"/safety/risk-reports"} component={() => (<DashboardLayout><SafetyRiskReports /></DashboardLayout>)} />
      <Route path={"/safety/risk-scoring"} component={() => (<DashboardLayout><SafetyRiskScoring /></DashboardLayout>)} />
      <Route path={"/safety/risk-trends"} component={() => (<DashboardLayout><SafetyRiskTrends /></DashboardLayout>)} />
      <Route path={"/safety/blitz"} component={() => (<DashboardLayout><SafetySafetyBlitz /></DashboardLayout>)} />
      <Route path={"/safety/toolbox-talks"} component={() => (<DashboardLayout><SafetyToolboxTalks /></DashboardLayout>)} />
      <Route path={"/safety/training-assignment"} component={() => (<DashboardLayout><SafetyTrainingAssignment /></DashboardLayout>)} />
      <Route path={"/safety/training-catalog"} component={() => (<DashboardLayout><SafetyTrainingCatalog /></DashboardLayout>)} />
      <Route path={"/safety/training-certification"} component={() => (<DashboardLayout><SafetyTrainingCertification /></DashboardLayout>)} />
      <Route path={"/safety/training-completion"} component={() => (<DashboardLayout><SafetyTrainingCompletion /></DashboardLayout>)} />
      <Route path={"/safety/training-dashboard"} component={() => (<DashboardLayout><SafetyTrainingDashboard /></DashboardLayout>)} />
      <Route path={"/safety/training-expiring"} component={() => (<DashboardLayout><SafetyTrainingExpiring /></DashboardLayout>)} />
      <Route path={"/safety/training-programs"} component={() => (<DashboardLayout><SafetyTrainingPrograms /></DashboardLayout>)} />
      <Route path={"/safety/training-records"} component={() => (<DashboardLayout><SafetyTrainingRecords /></DashboardLayout>)} />
      <Route path={"/safety/training-reports"} component={() => (<DashboardLayout><SafetyTrainingReports /></DashboardLayout>)} />
      <Route path={"/safety/training-schedule"} component={() => (<DashboardLayout><SafetyTrainingSchedule /></DashboardLayout>)} />
      <Route path={"/scale-locations"} component={() => (<DashboardLayout><ScaleLocations /></DashboardLayout>)} />
      <Route path={"/scheduled-tasks"} component={() => (<DashboardLayout><ScheduledTasks /></DashboardLayout>)} />
      <Route path={"/security-settings"} component={() => (<DashboardLayout><SecuritySettings /></DashboardLayout>)} />
      <Route path={"/service-alerts"} component={() => (<DashboardLayout><ServiceAlerts /></DashboardLayout>)} />
      <Route path={"/session-management"} component={() => (<DashboardLayout><SessionManagement /></DashboardLayout>)} />
      <Route path={"/settings"} component={() => (<DashboardLayout><Settings /></DashboardLayout>)} />
      <Route path={"/settings/integrations"} component={() => (<DashboardLayout><SettingsIntegrations /></DashboardLayout>)} />
      <Route path={"/settlement-details"} component={() => (<DashboardLayout><SettlementDetails /></DashboardLayout>)} />
      <Route path={"/settlement-statements"} component={() => (<DashboardLayout><SettlementStatements /></DashboardLayout>)} />
      <Route path={"/shipment"} component={() => (<DashboardLayout><Shipment /></DashboardLayout>)} />
      <Route path={"/shipper/accessorials"} component={() => (<DashboardLayout><ShipperAccessorials /></DashboardLayout>)} />
      <Route path={"/shipper/appointment-booking"} component={() => (<DashboardLayout><ShipperAppointmentBooking /></DashboardLayout>)} />
      <Route path={"/shipper/auction-bid"} component={() => (<DashboardLayout><ShipperAuctionBid /></DashboardLayout>)} />
      <Route path={"/shipper/auto-pay"} component={() => (<DashboardLayout><ShipperAutoPay /></DashboardLayout>)} />
      <Route path={"/shipper/bol-generation"} component={() => (<DashboardLayout><ShipperBOLGeneration /></DashboardLayout>)} />
      <Route path={"/shipper/bol-viewer"} component={() => (<DashboardLayout><ShipperBOLViewer /></DashboardLayout>)} />
      <Route path={"/shipper/bid-acceptance"} component={() => (<DashboardLayout><ShipperBidAcceptance /></DashboardLayout>)} />
      <Route path={"/shipper/bid-evaluation"} component={() => (<DashboardLayout><ShipperBidEvaluation /></DashboardLayout>)} />
      <Route path={"/shipper/bid-management"} component={() => (<DashboardLayout><ShipperBidManagement /></DashboardLayout>)} />
      <Route path={"/shipper/bid-review"} component={() => (<DashboardLayout><ShipperBidReview /></DashboardLayout>)} />
      <Route path={"/shipper/budget-tracking"} component={() => (<DashboardLayout><ShipperBudgetTracking /></DashboardLayout>)} />
      <Route path={"/shipper/bulk-upload"} component={() => (<DashboardLayout><ShipperBulkUpload /></DashboardLayout>)} />
      <Route path={"/shipper/carrier-performance"} component={() => (<DashboardLayout><ShipperCarrierPerformance /></DashboardLayout>)} />
      <Route path={"/shipper/carrier-report"} component={() => (<DashboardLayout><ShipperCarrierReport /></DashboardLayout>)} />
      <Route path={"/shipper/carrier-scorecard"} component={() => (<DashboardLayout><ShipperCarrierScorecard /></DashboardLayout>)} />
      <Route path={"/shipper/certificate-of-origin"} component={() => (<DashboardLayout><ShipperCertificateOfOrigin /></DashboardLayout>)} />
      <Route path={"/shipper/check-calls"} component={() => (<DashboardLayout><ShipperCheckCalls /></DashboardLayout>)} />
      <Route path={"/shipper/claim-details"} component={() => (<DashboardLayout><ShipperClaimDetails /></DashboardLayout>)} />
      <Route path={"/shipper/claims-filing"} component={() => (<DashboardLayout><ShipperClaimsFiling /></DashboardLayout>)} />
      <Route path={"/shipper/claims-history"} component={() => (<DashboardLayout><ShipperClaimsHistory /></DashboardLayout>)} />
      <Route path={"/shipper/compliance"} component={() => (<DashboardLayout><ShipperCompliance /></DashboardLayout>)} />
      <Route path={"/shipper/contract-rates"} component={() => (<DashboardLayout><ShipperContractRates /></DashboardLayout>)} />
      <Route path={"/shipper/contracts"} component={() => (<DashboardLayout><ShipperContracts /></DashboardLayout>)} />
      <Route path={"/shipper/cost-allocation"} component={() => (<DashboardLayout><ShipperCostAllocation /></DashboardLayout>)} />
      <Route path={"/shipper/counter-offer"} component={() => (<DashboardLayout><ShipperCounterOffer /></DashboardLayout>)} />
      <Route path={"/shipper/credit-balance"} component={() => (<DashboardLayout><ShipperCreditBalance /></DashboardLayout>)} />
      <Route path={"/shipper/cross-border"} component={() => (<DashboardLayout><ShipperCrossBorder /></DashboardLayout>)} />
      <Route path={"/shipper/customs-documents"} component={() => (<DashboardLayout><ShipperCustomsDocuments /></DashboardLayout>)} />
      <Route path={"/shipper/damage-report"} component={() => (<DashboardLayout><ShipperDamageReport /></DashboardLayout>)} />
      <Route path={"/shipper/dashboard"} component={() => (<DashboardLayout><ShipperDashboard /></DashboardLayout>)} />
      <Route path={"/shipper/data-export"} component={() => (<DashboardLayout><ShipperDataExport /></DashboardLayout>)} />
      <Route path={"/shipper/dispute-center"} component={() => (<DashboardLayout><ShipperDisputeCenter /></DashboardLayout>)} />
      <Route path={"/shipper/dispute-details"} component={() => (<DashboardLayout><ShipperDisputeDetails /></DashboardLayout>)} />
      <Route path={"/shipper/dispute-submit"} component={() => (<DashboardLayout><ShipperDisputeSubmit /></DashboardLayout>)} />
      <Route path={"/shipper/document-export"} component={() => (<DashboardLayout><ShipperDocumentExport /></DashboardLayout>)} />
      <Route path={"/shipper/document-upload"} component={() => (<DashboardLayout><ShipperDocumentUpload /></DashboardLayout>)} />
      <Route path={"/shipper/documents"} component={() => (<DashboardLayout><ShipperDocuments /></DashboardLayout>)} />
      <Route path={"/shipper/draft-shipments"} component={() => (<DashboardLayout><ShipperDraftShipments /></DashboardLayout>)} />
      <Route path={"/shipper/driver-location"} component={() => (<DashboardLayout><ShipperDriverLocation /></DashboardLayout>)} />
      <Route path={"/shipper/eta-updates"} component={() => (<DashboardLayout><ShipperETAUpdates /></DashboardLayout>)} />
      <Route path={"/shipper/exception-alerts"} component={() => (<DashboardLayout><ShipperExceptionAlerts /></DashboardLayout>)} />
      <Route path={"/shipper/export-documents"} component={() => (<DashboardLayout><ShipperExportDocuments /></DashboardLayout>)} />
      <Route path={"/shipper/geofence-alerts"} component={() => (<DashboardLayout><ShipperGeofenceAlerts /></DashboardLayout>)} />
      <Route path={"/shipper/hazmat-load"} component={() => (<DashboardLayout><ShipperHazmatLoad /></DashboardLayout>)} />
      <Route path={"/shipper/invoice-details"} component={() => (<DashboardLayout><ShipperInvoiceDetails /></DashboardLayout>)} />
      <Route path={"/shipper/invoice-review"} component={() => (<DashboardLayout><ShipperInvoiceReview /></DashboardLayout>)} />
      <Route path={"/shipper/invoices"} component={() => (<DashboardLayout><ShipperInvoices /></DashboardLayout>)} />
      <Route path={"/shipper/lane-analysis"} component={() => (<DashboardLayout><ShipperLaneAnalysis /></DashboardLayout>)} />
      <Route path={"/shipper/lane-report"} component={() => (<DashboardLayout><ShipperLaneReport /></DashboardLayout>)} />
      <Route path={"/shipper/load-cancellation"} component={() => (<DashboardLayout><ShipperLoadCancellation /></DashboardLayout>)} />
      <Route path={"/shipper/load-clone"} component={() => (<DashboardLayout><ShipperLoadClone /></DashboardLayout>)} />
      <Route path={"/shipper/load-consolidation"} component={() => (<DashboardLayout><ShipperLoadConsolidation /></DashboardLayout>)} />
      <Route path={"/shipper/load-create"} component={() => (<DashboardLayout><ShipperLoadCreate /></DashboardLayout>)} />
      <Route path={"/shipper/load-modification"} component={() => (<DashboardLayout><ShipperLoadModification /></DashboardLayout>)} />
      <Route path={"/shipper/load-rescheduling"} component={() => (<DashboardLayout><ShipperLoadRescheduling /></DashboardLayout>)} />
      <Route path={"/shipper/load-split"} component={() => (<DashboardLayout><ShipperLoadSplit /></DashboardLayout>)} />
      <Route path={"/shipper/load-templates"} component={() => (<DashboardLayout><ShipperLoadTemplates /></DashboardLayout>)} />
      <Route path={"/shipper/load-tracking"} component={() => (<DashboardLayout><ShipperLoadTracking /></DashboardLayout>)} />
      <Route path={"/shipper/load-wizard"} component={() => (<DashboardLayout><ShipperLoadWizard /></DashboardLayout>)} />
      <Route path={"/shipper/loads"} component={() => (<DashboardLayout><ShipperLoads /></DashboardLayout>)} />
      <Route path={"/shipper/make-payment"} component={() => (<DashboardLayout><ShipperMakePayment /></DashboardLayout>)} />
      <Route path={"/shipper/milestone-tracking"} component={() => (<DashboardLayout><ShipperMilestoneTracking /></DashboardLayout>)} />
      <Route path={"/shipper/mode-analysis"} component={() => (<DashboardLayout><ShipperModeAnalysis /></DashboardLayout>)} />
      <Route path={"/shipper/multi-stop"} component={() => (<DashboardLayout><ShipperMultiStop /></DashboardLayout>)} />
      <Route path={"/shipper/on-time-report"} component={() => (<DashboardLayout><ShipperOnTimeReport /></DashboardLayout>)} />
      <Route path={"/shipper/oversized-load"} component={() => (<DashboardLayout><ShipperOversizedLoad /></DashboardLayout>)} />
      <Route path={"/shipper/pod-review"} component={() => (<DashboardLayout><ShipperPODReview /></DashboardLayout>)} />
      <Route path={"/shipper/pod-viewer"} component={() => (<DashboardLayout><ShipperPODViewer /></DashboardLayout>)} />
      <Route path={"/shipper/payment-history"} component={() => (<DashboardLayout><ShipperPaymentHistory /></DashboardLayout>)} />
      <Route path={"/shipper/payment-methods"} component={() => (<DashboardLayout><ShipperPaymentMethods /></DashboardLayout>)} />
      <Route path={"/shipper/profile"} component={() => (<DashboardLayout><ShipperProfile /></DashboardLayout>)} />
      <Route path={"/shipper/quote-comparison"} component={() => (<DashboardLayout><ShipperQuoteComparison /></DashboardLayout>)} />
      <Route path={"/shipper/quote-history"} component={() => (<DashboardLayout><ShipperQuoteHistory /></DashboardLayout>)} />
      <Route path={"/shipper/quote-request"} component={() => (<DashboardLayout><ShipperQuoteRequest /></DashboardLayout>)} />
      <Route path={"/shipper/quote-requests"} component={() => (<DashboardLayout><ShipperQuoteRequests /></DashboardLayout>)} />
      <Route path={"/shipper/rate-carrier"} component={() => (<DashboardLayout><ShipperRateCarrier /></DashboardLayout>)} />
      <Route path={"/shipper/rate-negotiation"} component={() => (<DashboardLayout><ShipperRateNegotiation /></DashboardLayout>)} />
      <Route path={"/shipper/recurring-shipments"} component={() => (<DashboardLayout><ShipperRecurringShipments /></DashboardLayout>)} />
      <Route path={"/shipper/report-scheduler"} component={() => (<DashboardLayout><ShipperReportScheduler /></DashboardLayout>)} />
      <Route path={"/shipper/savings-analysis"} component={() => (<DashboardLayout><ShipperSavingsAnalysis /></DashboardLayout>)} />
      <Route path={"/shipper/shipment-details"} component={() => (<DashboardLayout><ShipperShipmentDetails /></DashboardLayout>)} />
      <Route path={"/shipper/special-instructions"} component={() => (<DashboardLayout><ShipperSpecialInstructions /></DashboardLayout>)} />
      <Route path={"/shipper/spend-analytics"} component={() => (<DashboardLayout><ShipperSpendAnalytics /></DashboardLayout>)} />
      <Route path={"/shipper/spend-dashboard"} component={() => (<DashboardLayout><ShipperSpendDashboard /></DashboardLayout>)} />
      <Route path={"/shipper/spot-quotes"} component={() => (<DashboardLayout><ShipperSpotQuotes /></DashboardLayout>)} />
      <Route path={"/shipper/status-history"} component={() => (<DashboardLayout><ShipperStatusHistory /></DashboardLayout>)} />
      <Route path={"/shipper/tax-documents"} component={() => (<DashboardLayout><ShipperTaxDocuments /></DashboardLayout>)} />
      <Route path={"/shipper/temperature-controlled"} component={() => (<DashboardLayout><ShipperTemperatureControlled /></DashboardLayout>)} />
      <Route path={"/shipper/temperature-monitoring"} component={() => (<DashboardLayout><ShipperTemperatureMonitoring /></DashboardLayout>)} />
      <Route path={"/shipper/tracking-export"} component={() => (<DashboardLayout><ShipperTrackingExport /></DashboardLayout>)} />
      <Route path={"/shipper/tracking-map"} component={() => (<DashboardLayout><ShipperTrackingMap /></DashboardLayout>)} />
      <Route path={"/shipper/tracking-share"} component={() => (<DashboardLayout><ShipperTrackingShare /></DashboardLayout>)} />
      <Route path={"/shipper/vendor-management"} component={() => (<DashboardLayout><ShipperVendorManagement /></DashboardLayout>)} />
      <Route path={"/shipper/volume-report"} component={() => (<DashboardLayout><ShipperVolumeReport /></DashboardLayout>)} />
      <Route path={"/shipper/s"} component={() => (<DashboardLayout><Shippers /></DashboardLayout>)} />
      <Route path={"/specializations"} component={() => (<DashboardLayout><Specializations /></DashboardLayout>)} />
      <Route path={"/spectra-match"} component={() => (<DashboardLayout><SpectraMatch /></DashboardLayout>)} />
      <Route path={"/subscription-plan"} component={() => (<DashboardLayout><SubscriptionPlan /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-ab-test-results"} component={() => (<DashboardLayout><SuperAdminABTestResults /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-ab-testing"} component={() => (<DashboardLayout><SuperAdminABTesting /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-api-documentation"} component={() => (<DashboardLayout><SuperAdminAPIDocumentation /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-api-keys"} component={() => (<DashboardLayout><SuperAdminAPIKeys /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-api-management"} component={() => (<DashboardLayout><SuperAdminAPIManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-api-usage"} component={() => (<DashboardLayout><SuperAdminAPIUsage /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-api-versioning"} component={() => (<DashboardLayout><SuperAdminAPIVersioning /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-access-logs"} component={() => (<DashboardLayout><SuperAdminAccessLogs /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-accounting-integrations"} component={() => (<DashboardLayout><SuperAdminAccountingIntegrations /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-alert-configuration"} component={() => (<DashboardLayout><SuperAdminAlertConfiguration /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-analytics-dashboard"} component={() => (<DashboardLayout><SuperAdminAnalyticsDashboard /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-announcement-center"} component={() => (<DashboardLayout><SuperAdminAnnouncementCenter /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-app-versions"} component={() => (<DashboardLayout><SuperAdminAppVersions /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-audit-trail"} component={() => (<DashboardLayout><SuperAdminAuditTrail /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-bi-integration"} component={() => (<DashboardLayout><SuperAdminBIIntegration /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-backup-management"} component={() => (<DashboardLayout><SuperAdminBackupManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-badge-management"} component={() => (<DashboardLayout><SuperAdminBadgeManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-benchmark-reports"} component={() => (<DashboardLayout><SuperAdminBenchmarkReports /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-beta-features"} component={() => (<DashboardLayout><SuperAdminBetaFeatures /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-billing-overview"} component={() => (<DashboardLayout><SuperAdminBillingOverview /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-blue-green-deployments"} component={() => (<DashboardLayout><SuperAdminBlueGreenDeployments /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-branding-settings"} component={() => (<DashboardLayout><SuperAdminBrandingSettings /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-broker-approvals"} component={() => (<DashboardLayout><SuperAdminBrokerApprovals /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-cache-management"} component={() => (<DashboardLayout><SuperAdminCacheManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-canary-deployments"} component={() => (<DashboardLayout><SuperAdminCanaryDeployments /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-capacity-analysis"} component={() => (<DashboardLayout><SuperAdminCapacityAnalysis /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-capacity-planning"} component={() => (<DashboardLayout><SuperAdminCapacityPlanning /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-carrier-vetting"} component={() => (<DashboardLayout><SuperAdminCarrierVetting /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-changelog"} component={() => (<DashboardLayout><SuperAdminChangelog /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-churn-analysis"} component={() => (<DashboardLayout><SuperAdminChurnAnalysis /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-cohort-analysis"} component={() => (<DashboardLayout><SuperAdminCohortAnalysis /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-commission-rules"} component={() => (<DashboardLayout><SuperAdminCommissionRules /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-company-management"} component={() => (<DashboardLayout><SuperAdminCompanyManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-company-verification"} component={() => (<DashboardLayout><SuperAdminCompanyVerification /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-competitor-analysis"} component={() => (<DashboardLayout><SuperAdminCompetitorAnalysis /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-compliance-audits"} component={() => (<DashboardLayout><SuperAdminComplianceAudits /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-compliance-reports"} component={() => (<DashboardLayout><SuperAdminComplianceReports /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-content-moderation"} component={() => (<DashboardLayout><SuperAdminContentModeration /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-cost-management"} component={() => (<DashboardLayout><SuperAdminCostManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-currency-settings"} component={() => (<DashboardLayout><SuperAdminCurrencySettings /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-custom-reports"} component={() => (<DashboardLayout><SuperAdminCustomReports /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-dashboard"} component={() => (<DashboardLayout><SuperAdminDashboard /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-data-export"} component={() => (<DashboardLayout><SuperAdminDataExport /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-data-migration"} component={() => (<DashboardLayout><SuperAdminDataMigration /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-data-privacy"} component={() => (<DashboardLayout><SuperAdminDataPrivacy /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-data-retention"} component={() => (<DashboardLayout><SuperAdminDataRetention /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-data-sync"} component={() => (<DashboardLayout><SuperAdminDataSync /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-data-warehouse"} component={() => (<DashboardLayout><SuperAdminDataWarehouse /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-database-management"} component={() => (<DashboardLayout><SuperAdminDatabaseManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-demand-forecast"} component={() => (<DashboardLayout><SuperAdminDemandForecast /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-deployment-history"} component={() => (<DashboardLayout><SuperAdminDeploymentHistory /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-deprecation-schedule"} component={() => (<DashboardLayout><SuperAdminDeprecationSchedule /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-developer-analytics"} component={() => (<DashboardLayout><SuperAdminDeveloperAnalytics /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-developer-portal"} component={() => (<DashboardLayout><SuperAdminDeveloperPortal /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-developer-support"} component={() => (<DashboardLayout><SuperAdminDeveloperSupport /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-device-management"} component={() => (<DashboardLayout><SuperAdminDeviceManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-disaster-recovery"} component={() => (<DashboardLayout><SuperAdminDisasterRecovery /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-document-verification"} component={() => (<DashboardLayout><SuperAdminDocumentVerification /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-driver-approvals"} component={() => (<DashboardLayout><SuperAdminDriverApprovals /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-driver-overview"} component={() => (<DashboardLayout><SuperAdminDriverOverview /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-eld-integrations"} component={() => (<DashboardLayout><SuperAdminELDIntegrations /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-email-templates"} component={() => (<DashboardLayout><SuperAdminEmailTemplates /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-encryption"} component={() => (<DashboardLayout><SuperAdminEncryption /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-environment-config"} component={() => (<DashboardLayout><SuperAdminEnvironmentConfig /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-error-tracking"} component={() => (<DashboardLayout><SuperAdminErrorTracking /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-escort-approvals"} component={() => (<DashboardLayout><SuperAdminEscortApprovals /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-event-calendar"} component={() => (<DashboardLayout><SuperAdminEventCalendar /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-factoring-approvals"} component={() => (<DashboardLayout><SuperAdminFactoringApprovals /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-feature-flags"} component={() => (<DashboardLayout><SuperAdminFeatureFlags /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-feature-rollout"} component={() => (<DashboardLayout><SuperAdminFeatureRollout /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-feedback-center"} component={() => (<DashboardLayout><SuperAdminFeedbackCenter /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-fin-analytics"} component={() => (<DashboardLayout><SuperAdminFinAnalytics /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-financial-analytics"} component={() => (<DashboardLayout><SuperAdminFinancialAnalytics /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-financial-forecasting"} component={() => (<DashboardLayout><SuperAdminFinancialForecasting /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-fleet-overview"} component={() => (<DashboardLayout><SuperAdminFleetOverview /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-force-update"} component={() => (<DashboardLayout><SuperAdminForceUpdate /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-fuel-card-integrations"} component={() => (<DashboardLayout><SuperAdminFuelCardIntegrations /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-funnel-analysis"} component={() => (<DashboardLayout><SuperAdminFunnelAnalysis /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-gps-providers"} component={() => (<DashboardLayout><SuperAdminGPSProviders /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-gamification-analytics"} component={() => (<DashboardLayout><SuperAdminGamificationAnalytics /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-gamification-config"} component={() => (<DashboardLayout><SuperAdminGamificationConfig /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-gamification-reports"} component={() => (<DashboardLayout><SuperAdminGamificationReports /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-gamification-testing"} component={() => (<DashboardLayout><SuperAdminGamificationTesting /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-geographic-analytics"} component={() => (<DashboardLayout><SuperAdminGeographicAnalytics /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-global-settings"} component={() => (<DashboardLayout><SuperAdminGlobalSettings /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-growth-metrics"} component={() => (<DashboardLayout><SuperAdminGrowthMetrics /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-guild-management"} component={() => (<DashboardLayout><SuperAdminGuildManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-hazmat-certification"} component={() => (<DashboardLayout><SuperAdminHazmatCertification /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-help-docs"} component={() => (<DashboardLayout><SuperAdminHelpDocs /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-ip-whitelist"} component={() => (<DashboardLayout><SuperAdminIPWhitelist /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-incident-response"} component={() => (<DashboardLayout><SuperAdminIncidentResponse /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-index-management"} component={() => (<DashboardLayout><SuperAdminIndexManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-infra-scaling"} component={() => (<DashboardLayout><SuperAdminInfraScaling /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-infrastructure"} component={() => (<DashboardLayout><SuperAdminInfrastructure /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-insurance-verification"} component={() => (<DashboardLayout><SuperAdminInsuranceVerification /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-integration-hub"} component={() => (<DashboardLayout><SuperAdminIntegrationHub /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-invoice-management"} component={() => (<DashboardLayout><SuperAdminInvoiceManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-ltv-analysis"} component={() => (<DashboardLayout><SuperAdminLTVAnalysis /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-leaderboard-config"} component={() => (<DashboardLayout><SuperAdminLeaderboardConfig /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-license-verification"} component={() => (<DashboardLayout><SuperAdminLicenseVerification /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-load-analytics"} component={() => (<DashboardLayout><SuperAdminLoadAnalytics /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-load-overview"} component={() => (<DashboardLayout><SuperAdminLoadOverview /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-localization"} component={() => (<DashboardLayout><SuperAdminLocalization /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-log-viewer"} component={() => (<DashboardLayout><SuperAdminLogViewer /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-loot-crate-designer"} component={() => (<DashboardLayout><SuperAdminLootCrateDesigner /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-mrr-dashboard"} component={() => (<DashboardLayout><SuperAdminMRRDashboard /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-maintenance-mode"} component={() => (<DashboardLayout><SuperAdminMaintenanceMode /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-mapping-providers"} component={() => (<DashboardLayout><SuperAdminMappingProviders /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-market-trends"} component={() => (<DashboardLayout><SuperAdminMarketTrends /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-miles-economy"} component={() => (<DashboardLayout><SuperAdminMilesEconomy /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-mission-designer"} component={() => (<DashboardLayout><SuperAdminMissionDesigner /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-mobile-app-config"} component={() => (<DashboardLayout><SuperAdminMobileAppConfig /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-notification-rules"} component={() => (<DashboardLayout><SuperAdminNotificationRules /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-o-auth-providers"} component={() => (<DashboardLayout><SuperAdminOAuthProviders /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-operations-overview"} component={() => (<DashboardLayout><SuperAdminOperationsOverview /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-partner-developers"} component={() => (<DashboardLayout><SuperAdminPartnerDevelopers /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-partner-portal"} component={() => (<DashboardLayout><SuperAdminPartnerPortal /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-payment-gateways"} component={() => (<DashboardLayout><SuperAdminPaymentGateways /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-payment-providers"} component={() => (<DashboardLayout><SuperAdminPaymentProviders /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-payout-settings"} component={() => (<DashboardLayout><SuperAdminPayoutSettings /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-penetration-testing"} component={() => (<DashboardLayout><SuperAdminPenetrationTesting /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-performance-metrics"} component={() => (<DashboardLayout><SuperAdminPerformanceMetrics /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-permissions"} component={() => (<DashboardLayout><SuperAdminPermissions /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-pricing-analysis"} component={() => (<DashboardLayout><SuperAdminPricingAnalysis /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-pricing-tiers"} component={() => (<DashboardLayout><SuperAdminPricingTiers /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-privacy-policy"} component={() => (<DashboardLayout><SuperAdminPrivacyPolicy /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-profit-analysis"} component={() => (<DashboardLayout><SuperAdminProfitAnalysis /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-push-notifications"} component={() => (<DashboardLayout><SuperAdminPushNotifications /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-query-analyzer"} component={() => (<DashboardLayout><SuperAdminQueryAnalyzer /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-queue-monitor"} component={() => (<DashboardLayout><SuperAdminQueueMonitor /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-rate-limits"} component={() => (<DashboardLayout><SuperAdminRateLimits /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-refund-management"} component={() => (<DashboardLayout><SuperAdminRefundManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-resource-optimization"} component={() => (<DashboardLayout><SuperAdminResourceOptimization /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-restore-management"} component={() => (<DashboardLayout><SuperAdminRestoreManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-retention-analytics"} component={() => (<DashboardLayout><SuperAdminRetentionAnalytics /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-revenue-dashboard"} component={() => (<DashboardLayout><SuperAdminRevenueDashboard /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-revenue-reports"} component={() => (<DashboardLayout><SuperAdminRevenueReports /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-rewards-catalog"} component={() => (<DashboardLayout><SuperAdminRewardsCatalog /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-role-management"} component={() => (<DashboardLayout><SuperAdminRoleManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-rollback-management"} component={() => (<DashboardLayout><SuperAdminRollbackManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-route-analysis"} component={() => (<DashboardLayout><SuperAdminRouteAnalysis /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-sdk-management"} component={() => (<DashboardLayout><SuperAdminSDKManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-sms-configuration"} component={() => (<DashboardLayout><SuperAdminSMSConfiguration /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-soc2-dashboard"} component={() => (<DashboardLayout><SuperAdminSOC2Dashboard /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-sso-configuration"} component={() => (<DashboardLayout><SuperAdminSSOConfiguration /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-sample-apps"} component={() => (<DashboardLayout><SuperAdminSampleApps /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-sandbox-management"} component={() => (<DashboardLayout><SuperAdminSandboxManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-scheduled-reports"} component={() => (<DashboardLayout><SuperAdminScheduledReports /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-schema-management"} component={() => (<DashboardLayout><SuperAdminSchemaManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-season-management"} component={() => (<DashboardLayout><SuperAdminSeasonManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-security-alerts"} component={() => (<DashboardLayout><SuperAdminSecurityAlerts /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-security-dashboard"} component={() => (<DashboardLayout><SuperAdminSecurityDashboard /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-security-policies"} component={() => (<DashboardLayout><SuperAdminSecurityPolicies /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-status-page"} component={() => (<DashboardLayout><SuperAdminStatusPage /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-subscription-management"} component={() => (<DashboardLayout><SuperAdminSubscriptionManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-support-analytics"} component={() => (<DashboardLayout><SuperAdminSupportAnalytics /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-support-escalation"} component={() => (<DashboardLayout><SuperAdminSupportEscalation /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-system-health"} component={() => (<DashboardLayout><SuperAdminSystemHealth /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-tms-integrations"} component={() => (<DashboardLayout><SuperAdminTMSIntegrations /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-tax-configuration"} component={() => (<DashboardLayout><SuperAdminTaxConfiguration /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-tenant-config"} component={() => (<DashboardLayout><SuperAdminTenantConfig /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-terminal-approvals"} component={() => (<DashboardLayout><SuperAdminTerminalApprovals /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-terminal-overview"} component={() => (<DashboardLayout><SuperAdminTerminalOverview /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-terms-of-service"} component={() => (<DashboardLayout><SuperAdminTermsOfService /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-test-data-generator"} component={() => (<DashboardLayout><SuperAdminTestDataGenerator /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-threat-detection"} component={() => (<DashboardLayout><SuperAdminThreatDetection /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-timezone-settings"} component={() => (<DashboardLayout><SuperAdminTimezoneSettings /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-tournament-config"} component={() => (<DashboardLayout><SuperAdminTournamentConfig /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-user-analytics"} component={() => (<DashboardLayout><SuperAdminUserAnalytics /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-user-directory"} component={() => (<DashboardLayout><SuperAdminUserDirectory /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-user-verification"} component={() => (<DashboardLayout><SuperAdminUserVerification /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-verification-history"} component={() => (<DashboardLayout><SuperAdminVerificationHistory /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-verification-queue"} component={() => (<DashboardLayout><SuperAdminVerificationQueue /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-verification-reports"} component={() => (<DashboardLayout><SuperAdminVerificationReports /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-verification-rules"} component={() => (<DashboardLayout><SuperAdminVerificationRules /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-vulnerability-scanning"} component={() => (<DashboardLayout><SuperAdminVulnerabilityScanning /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-weather-providers"} component={() => (<DashboardLayout><SuperAdminWeatherProviders /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-webhook-management"} component={() => (<DashboardLayout><SuperAdminWebhookManagement /></DashboardLayout>)} />
      <Route path={"/superadmin/super-admin-white-label"} component={() => (<DashboardLayout><SuperAdminWhiteLabel /></DashboardLayout>)} />
      <Route path={"/support"} component={() => (<DashboardLayout><Support /></DashboardLayout>)} />
      <Route path={"/support-tickets"} component={() => (<DashboardLayout><SupportTickets /></DashboardLayout>)} />
      <Route path={"/system-configuration"} component={() => (<DashboardLayout><SystemConfiguration /></DashboardLayout>)} />
      <Route path={"/system-health"} component={() => (<DashboardLayout><SystemHealth /></DashboardLayout>)} />
      <Route path={"/system-settings"} component={() => (<DashboardLayout><SystemSettings /></DashboardLayout>)} />
      <Route path={"/system-status"} component={() => (<DashboardLayout><SystemStatus /></DashboardLayout>)} />
      <Route path={"/tank-inventory"} component={() => (<DashboardLayout><TankInventory /></DashboardLayout>)} />
      <Route path={"/tax-documents"} component={() => (<DashboardLayout><TaxDocuments /></DashboardLayout>)} />
      <Route path={"/team-management"} component={() => (<DashboardLayout><TeamManagement /></DashboardLayout>)} />
      <Route path={"/telemetry/alerts"} component={() => (<DashboardLayout><TelemetryAlerts /></DashboardLayout>)} />
      <Route path={"/telemetry/analytics"} component={() => (<DashboardLayout><TelemetryAnalytics /></DashboardLayout>)} />
      <Route path={"/telemetry/benchmarking"} component={() => (<DashboardLayout><TelemetryBenchmarking /></DashboardLayout>)} />
      <Route path={"/telemetry/dtc-monitoring"} component={() => (<DashboardLayout><TelemetryDTCMonitoring /></DashboardLayout>)} />
      <Route path={"/telemetry/dashboard"} component={() => (<DashboardLayout><TelemetryDashboard /></DashboardLayout>)} />
      <Route path={"/telemetry/data-export"} component={() => (<DashboardLayout><TelemetryDataExport /></DashboardLayout>)} />
      <Route path={"/telemetry/device-management"} component={() => (<DashboardLayout><TelemetryDeviceManagement /></DashboardLayout>)} />
      <Route path={"/telemetry/driver-details"} component={() => (<DashboardLayout><TelemetryDriverDetails /></DashboardLayout>)} />
      <Route path={"/telemetry/engine-health"} component={() => (<DashboardLayout><TelemetryEngineHealth /></DashboardLayout>)} />
      <Route path={"/telemetry/fleet-map"} component={() => (<DashboardLayout><TelemetryFleetMap /></DashboardLayout>)} />
      <Route path={"/telemetry/fuel-consumption"} component={() => (<DashboardLayout><TelemetryFuelConsumption /></DashboardLayout>)} />
      <Route path={"/telemetry/geofence-alerts"} component={() => (<DashboardLayout><TelemetryGeofenceAlerts /></DashboardLayout>)} />
      <Route path={"/telemetry/geofencing"} component={() => (<DashboardLayout><TelemetryGeofencing /></DashboardLayout>)} />
      <Route path={"/telemetry/harsh-events"} component={() => (<DashboardLayout><TelemetryHarshEvents /></DashboardLayout>)} />
      <Route path={"/telemetry/idle-time"} component={() => (<DashboardLayout><TelemetryIdleTime /></DashboardLayout>)} />
      <Route path={"/telemetry/integrations"} component={() => (<DashboardLayout><TelemetryIntegrations /></DashboardLayout>)} />
      <Route path={"/telemetry/live-tracking"} component={() => (<DashboardLayout><TelemetryLiveTracking /></DashboardLayout>)} />
      <Route path={"/telemetry/location-history"} component={() => (<DashboardLayout><TelemetryLocationHistory /></DashboardLayout>)} />
      <Route path={"/telemetry/predictive"} component={() => (<DashboardLayout><TelemetryPredictive /></DashboardLayout>)} />
      <Route path={"/telemetry/reports"} component={() => (<DashboardLayout><TelemetryReports /></DashboardLayout>)} />
      <Route path={"/telemetry/speed-monitoring"} component={() => (<DashboardLayout><TelemetrySpeedMonitoring /></DashboardLayout>)} />
      <Route path={"/telemetry/vehicle-details"} component={() => (<DashboardLayout><TelemetryVehicleDetails /></DashboardLayout>)} />
      <Route path={"/terminal/access-control"} component={() => (<DashboardLayout><TerminalAccessControl /></DashboardLayout>)} />
      <Route path={"/terminal/appointment-analytics"} component={() => (<DashboardLayout><TerminalAppointmentAnalytics /></DashboardLayout>)} />
      <Route path={"/terminal/appointment-conflicts"} component={() => (<DashboardLayout><TerminalAppointmentConflicts /></DashboardLayout>)} />
      <Route path={"/terminal/appointment-forecast"} component={() => (<DashboardLayout><TerminalAppointmentForecast /></DashboardLayout>)} />
      <Route path={"/terminal/appointment-notifications"} component={() => (<DashboardLayout><TerminalAppointmentNotifications /></DashboardLayout>)} />
      <Route path={"/terminal/appointment-portal"} component={() => (<DashboardLayout><TerminalAppointmentPortal /></DashboardLayout>)} />
      <Route path={"/terminal/appointment-rules"} component={() => (<DashboardLayout><TerminalAppointmentRules /></DashboardLayout>)} />
      <Route path={"/terminal/appointment-schedule"} component={() => (<DashboardLayout><TerminalAppointmentSchedule /></DashboardLayout>)} />
      <Route path={"/terminal/appointment-slots"} component={() => (<DashboardLayout><TerminalAppointmentSlots /></DashboardLayout>)} />
      <Route path={"/terminal/appointments"} component={() => (<DashboardLayout><TerminalAppointments /></DashboardLayout>)} />
      <Route path={"/terminal/bottleneck-analysis"} component={() => (<DashboardLayout><TerminalBottleneckAnalysis /></DashboardLayout>)} />
      <Route path={"/terminal/capacity-planning"} component={() => (<DashboardLayout><TerminalCapacityPlanning /></DashboardLayout>)} />
      <Route path={"/terminal/carrier-access"} component={() => (<DashboardLayout><TerminalCarrierAccess /></DashboardLayout>)} />
      <Route path={"/terminal/carrier-approval"} component={() => (<DashboardLayout><TerminalCarrierApproval /></DashboardLayout>)} />
      <Route path={"/terminal/carrier-blacklist"} component={() => (<DashboardLayout><TerminalCarrierBlacklist /></DashboardLayout>)} />
      <Route path={"/terminal/carrier-performance"} component={() => (<DashboardLayout><TerminalCarrierPerformance /></DashboardLayout>)} />
      <Route path={"/terminal/carrier-report"} component={() => (<DashboardLayout><TerminalCarrierReport /></DashboardLayout>)} />
      <Route path={"/terminal/custom-reports"} component={() => (<DashboardLayout><TerminalCustomReports /></DashboardLayout>)} />
      <Route path={"/terminal/dashboard"} component={() => (<DashboardLayout><TerminalDashboard /></DashboardLayout>)} />
      <Route path={"/terminal/directory"} component={() => (<DashboardLayout><TerminalDirectory /></DashboardLayout>)} />
      <Route path={"/terminal/driver-badging"} component={() => (<DashboardLayout><TerminalDriverBadging /></DashboardLayout>)} />
      <Route path={"/terminal/driver-training"} component={() => (<DashboardLayout><TerminalDriverTraining /></DashboardLayout>)} />
      <Route path={"/terminal/driver-validation"} component={() => (<DashboardLayout><TerminalDriverValidation /></DashboardLayout>)} />
      <Route path={"/terminal/dwell-time"} component={() => (<DashboardLayout><TerminalDwellTime /></DashboardLayout>)} />
      <Route path={"/terminal/eia-reporting"} component={() => (<DashboardLayout><TerminalEIAReporting /></DashboardLayout>)} />
      <Route path={"/terminal/epa-reporting"} component={() => (<DashboardLayout><TerminalEPAReporting /></DashboardLayout>)} />
      <Route path={"/terminal/emergency-drills"} component={() => (<DashboardLayout><TerminalEmergencyDrills /></DashboardLayout>)} />
      <Route path={"/terminal/emergency-procedures"} component={() => (<DashboardLayout><TerminalEmergencyProcedures /></DashboardLayout>)} />
      <Route path={"/terminal/equipment-maintenance"} component={() => (<DashboardLayout><TerminalEquipmentMaintenance /></DashboardLayout>)} />
      <Route path={"/terminal/equipment-status"} component={() => (<DashboardLayout><TerminalEquipmentStatus /></DashboardLayout>)} />
      <Route path={"/terminal/financial-report"} component={() => (<DashboardLayout><TerminalFinancialReport /></DashboardLayout>)} />
      <Route path={"/terminal/gate-management"} component={() => (<DashboardLayout><TerminalGateManagement /></DashboardLayout>)} />
      <Route path={"/terminal/hazmat-compliance"} component={() => (<DashboardLayout><TerminalHazmatCompliance /></DashboardLayout>)} />
      <Route path={"/terminal/holiday-schedule"} component={() => (<DashboardLayout><TerminalHolidaySchedule /></DashboardLayout>)} />
      <Route path={"/terminal/incident-log"} component={() => (<DashboardLayout><TerminalIncidentLog /></DashboardLayout>)} />
      <Route path={"/terminal/incident-reporting"} component={() => (<DashboardLayout><TerminalIncidentReporting /></DashboardLayout>)} />
      <Route path={"/terminal/inventory"} component={() => (<DashboardLayout><TerminalInventory /></DashboardLayout>)} />
      <Route path={"/terminal/inventory-adjustment"} component={() => (<DashboardLayout><TerminalInventoryAdjustment /></DashboardLayout>)} />
      <Route path={"/terminal/inventory-alerts"} component={() => (<DashboardLayout><TerminalInventoryAlerts /></DashboardLayout>)} />
      <Route path={"/terminal/inventory-audit"} component={() => (<DashboardLayout><TerminalInventoryAudit /></DashboardLayout>)} />
      <Route path={"/terminal/inventory-dashboard"} component={() => (<DashboardLayout><TerminalInventoryDashboard /></DashboardLayout>)} />
      <Route path={"/terminal/inventory-forecast"} component={() => (<DashboardLayout><TerminalInventoryForecast /></DashboardLayout>)} />
      <Route path={"/terminal/inventory-reconciliation"} component={() => (<DashboardLayout><TerminalInventoryReconciliation /></DashboardLayout>)} />
      <Route path={"/terminal/inventory-report"} component={() => (<DashboardLayout><TerminalInventoryReport /></DashboardLayout>)} />
      <Route path={"/terminal/late-arrival"} component={() => (<DashboardLayout><TerminalLateArrival /></DashboardLayout>)} />
      <Route path={"/terminal/loading-bay-status"} component={() => (<DashboardLayout><TerminalLoadingBayStatus /></DashboardLayout>)} />
      <Route path={"/terminal/loading-schedule"} component={() => (<DashboardLayout><TerminalLoadingSchedule /></DashboardLayout>)} />
      <Route path={"/terminal/maintenance-schedule"} component={() => (<DashboardLayout><TerminalMaintenanceSchedule /></DashboardLayout>)} />
      <Route path={"/terminal/manager-dashboard"} component={() => (<DashboardLayout><TerminalManagerDashboard /></DashboardLayout>)} />
      <Route path={"/terminal/meter-calibration"} component={() => (<DashboardLayout><TerminalMeterCalibration /></DashboardLayout>)} />
      <Route path={"/terminal/no-show-management"} component={() => (<DashboardLayout><TerminalNoShowManagement /></DashboardLayout>)} />
      <Route path={"/terminal/operations"} component={() => (<DashboardLayout><TerminalOperations /></DashboardLayout>)} />
      <Route path={"/terminal/operations-dashboard"} component={() => (<DashboardLayout><TerminalOperationsDashboard /></DashboardLayout>)} />
      <Route path={"/terminal/operations-report"} component={() => (<DashboardLayout><TerminalOperationsReport /></DashboardLayout>)} />
      <Route path={"/terminal/ppe-tracking"} component={() => (<DashboardLayout><TerminalPPETracking /></DashboardLayout>)} />
      <Route path={"/terminal/product-blending"} component={() => (<DashboardLayout><TerminalProductBlending /></DashboardLayout>)} />
      <Route path={"/terminal/product-dispatch"} component={() => (<DashboardLayout><TerminalProductDispatch /></DashboardLayout>)} />
      <Route path={"/terminal/product-inventory"} component={() => (<DashboardLayout><TerminalProductInventory /></DashboardLayout>)} />
      <Route path={"/terminal/product-management"} component={() => (<DashboardLayout><TerminalProductManagement /></DashboardLayout>)} />
      <Route path={"/terminal/product-receipt"} component={() => (<DashboardLayout><TerminalProductReceipt /></DashboardLayout>)} />
      <Route path={"/terminal/product-transfer"} component={() => (<DashboardLayout><TerminalProductTransfer /></DashboardLayout>)} />
      <Route path={"/terminal/pump-status"} component={() => (<DashboardLayout><TerminalPumpStatus /></DashboardLayout>)} />
      <Route path={"/terminal/queue-management"} component={() => (<DashboardLayout><TerminalQueueManagement /></DashboardLayout>)} />
      <Route path={"/terminal/rack-assignment"} component={() => (<DashboardLayout><TerminalRackAssignment /></DashboardLayout>)} />
      <Route path={"/terminal/rack-schedule"} component={() => (<DashboardLayout><TerminalRackSchedule /></DashboardLayout>)} />
      <Route path={"/terminal/regulatory-calendar"} component={() => (<DashboardLayout><TerminalRegulatoryCalendar /></DashboardLayout>)} />
      <Route path={"/terminal/reorder-points"} component={() => (<DashboardLayout><TerminalReorderPoints /></DashboardLayout>)} />
      <Route path={"/terminal/rescheduling"} component={() => (<DashboardLayout><TerminalRescheduling /></DashboardLayout>)} />
      <Route path={"/terminal/scada"} component={() => (<DashboardLayout><TerminalSCADA /></DashboardLayout>)} />
      <Route path={"/terminal/safety-dashboard"} component={() => (<DashboardLayout><TerminalSafetyDashboard /></DashboardLayout>)} />
      <Route path={"/terminal/safety-inspection"} component={() => (<DashboardLayout><TerminalSafetyInspection /></DashboardLayout>)} />
      <Route path={"/terminal/safety-inspections"} component={() => (<DashboardLayout><TerminalSafetyInspections /></DashboardLayout>)} />
      <Route path={"/terminal/safety-metrics"} component={() => (<DashboardLayout><TerminalSafetyMetrics /></DashboardLayout>)} />
      <Route path={"/terminal/safety-report"} component={() => (<DashboardLayout><TerminalSafetyReport /></DashboardLayout>)} />
      <Route path={"/terminal/safety-training"} component={() => (<DashboardLayout><TerminalSafetyTraining /></DashboardLayout>)} />
      <Route path={"/terminal/scheduling"} component={() => (<DashboardLayout><TerminalScheduling /></DashboardLayout>)} />
      <Route path={"/terminal/shift-handoff"} component={() => (<DashboardLayout><TerminalShiftHandoff /></DashboardLayout>)} />
      <Route path={"/terminal/staff"} component={() => (<DashboardLayout><TerminalStaff /></DashboardLayout>)} />
      <Route path={"/terminal/surge-management"} component={() => (<DashboardLayout><TerminalSurgeManagement /></DashboardLayout>)} />
      <Route path={"/terminal/tank-gauging"} component={() => (<DashboardLayout><TerminalTankGauging /></DashboardLayout>)} />
      <Route path={"/terminal/tank-inspection"} component={() => (<DashboardLayout><TerminalTankInspection /></DashboardLayout>)} />
      <Route path={"/terminal/tank-inventory"} component={() => (<DashboardLayout><TerminalTankInventory /></DashboardLayout>)} />
      <Route path={"/terminal/tank-maintenance"} component={() => (<DashboardLayout><TerminalTankMaintenance /></DashboardLayout>)} />
      <Route path={"/terminal/tank-status"} component={() => (<DashboardLayout><TerminalTankStatus /></DashboardLayout>)} />
      <Route path={"/terminal/throughput"} component={() => (<DashboardLayout><TerminalThroughput /></DashboardLayout>)} />
      <Route path={"/terminal/throughput-report"} component={() => (<DashboardLayout><TerminalThroughputReport /></DashboardLayout>)} />
      <Route path={"/terminal/visitor-log"} component={() => (<DashboardLayout><TerminalVisitorLog /></DashboardLayout>)} />
      <Route path={"/terminal/weather-prep"} component={() => (<DashboardLayout><TerminalWeatherPrep /></DashboardLayout>)} />
      <Route path={"/terminal/weigh-scales"} component={() => (<DashboardLayout><TerminalWeighScales /></DashboardLayout>)} />
      <Route path={"/terminal/yard-management"} component={() => (<DashboardLayout><TerminalYardManagement /></DashboardLayout>)} />
      <Route path={"/terms-of-service"} component={() => (<DashboardLayout><TermsOfService /></DashboardLayout>)} />
      <Route path={"/test-login"} component={() => (<DashboardLayout><TestLogin /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul"} component={() => (<DashboardLayout><TheHaul /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-achievement-stats"} component={() => (<DashboardLayout><TheHaulAchievementStats /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-achievements"} component={() => (<DashboardLayout><TheHaulAchievements /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-avatars"} component={() => (<DashboardLayout><TheHaulAvatars /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-badge-collection"} component={() => (<DashboardLayout><TheHaulBadgeCollection /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-badge-details"} component={() => (<DashboardLayout><TheHaulBadgeDetails /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-daily-missions"} component={() => (<DashboardLayout><TheHaulDailyMissions /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-dashboard"} component={() => (<DashboardLayout><TheHaulDashboard /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-emotes"} component={() => (<DashboardLayout><TheHaulEmotes /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-event-details"} component={() => (<DashboardLayout><TheHaulEventDetails /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-events"} component={() => (<DashboardLayout><TheHaulEvents /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-find-friends"} component={() => (<DashboardLayout><TheHaulFindFriends /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-frames"} component={() => (<DashboardLayout><TheHaulFrames /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-friend-requests"} component={() => (<DashboardLayout><TheHaulFriendRequests /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-friends"} component={() => (<DashboardLayout><TheHaulFriends /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-friends-leaderboard"} component={() => (<DashboardLayout><TheHaulFriendsLeaderboard /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-global-leaderboard"} component={() => (<DashboardLayout><TheHaulGlobalLeaderboard /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-guild"} component={() => (<DashboardLayout><TheHaulGuild /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-guild-chat"} component={() => (<DashboardLayout><TheHaulGuildChat /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-guild-create"} component={() => (<DashboardLayout><TheHaulGuildCreate /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-guild-events"} component={() => (<DashboardLayout><TheHaulGuildEvents /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-guild-leaderboard"} component={() => (<DashboardLayout><TheHaulGuildLeaderboard /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-guild-members"} component={() => (<DashboardLayout><TheHaulGuildMembers /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-guild-search"} component={() => (<DashboardLayout><TheHaulGuildSearch /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-guild-wars"} component={() => (<DashboardLayout><TheHaulGuildWars /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-help"} component={() => (<DashboardLayout><TheHaulHelp /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-inventory"} component={() => (<DashboardLayout><TheHaulInventory /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-leaderboard"} component={() => (<DashboardLayout><TheHaulLeaderboard /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-leaderboards"} component={() => (<DashboardLayout><TheHaulLeaderboards /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-level-progress"} component={() => (<DashboardLayout><TheHaulLevelProgress /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-loot-crate-open"} component={() => (<DashboardLayout><TheHaulLootCrateOpen /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-loot-crates"} component={() => (<DashboardLayout><TheHaulLootCrates /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-miles-conversion"} component={() => (<DashboardLayout><TheHaulMilesConversion /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-miles-history"} component={() => (<DashboardLayout><TheHaulMilesHistory /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-milestones"} component={() => (<DashboardLayout><TheHaulMilestones /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-mission-details"} component={() => (<DashboardLayout><TheHaulMissionDetails /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-missions"} component={() => (<DashboardLayout><TheHaulMissions /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-notifications"} component={() => (<DashboardLayout><TheHaulNotifications /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-player-profile"} component={() => (<DashboardLayout><TheHaulPlayerProfile /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-prestige"} component={() => (<DashboardLayout><TheHaulPrestige /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-profile"} component={() => (<DashboardLayout><TheHaulProfile /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-purchase-history"} component={() => (<DashboardLayout><TheHaulPurchaseHistory /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-referral-rewards"} component={() => (<DashboardLayout><TheHaulReferralRewards /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-referrals"} component={() => (<DashboardLayout><TheHaulReferrals /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-regional-leaderboard"} component={() => (<DashboardLayout><TheHaulRegionalLeaderboard /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-rewards"} component={() => (<DashboardLayout><TheHaulRewards /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-season-history"} component={() => (<DashboardLayout><TheHaulSeasonHistory /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-season-pass"} component={() => (<DashboardLayout><TheHaulSeasonPass /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-season-rewards"} component={() => (<DashboardLayout><TheHaulSeasonRewards /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-settings"} component={() => (<DashboardLayout><TheHaulSettings /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-statistics"} component={() => (<DashboardLayout><TheHaulStatistics /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-store"} component={() => (<DashboardLayout><TheHaulStore /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-store-category"} component={() => (<DashboardLayout><TheHaulStoreCategory /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-streaks"} component={() => (<DashboardLayout><TheHaulStreaks /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-titles"} component={() => (<DashboardLayout><TheHaulTitles /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-tournament-details"} component={() => (<DashboardLayout><TheHaulTournamentDetails /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-tournaments"} component={() => (<DashboardLayout><TheHaulTournaments /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-weekly-missions"} component={() => (<DashboardLayout><TheHaulWeeklyMissions /></DashboardLayout>)} />
      <Route path={"/the-haul/the-haul-xp-history"} component={() => (<DashboardLayout><TheHaulXPHistory /></DashboardLayout>)} />
      <Route path={"/time-off-requests"} component={() => (<DashboardLayout><TimeOffRequests /></DashboardLayout>)} />
      <Route path={"/toll-calculator"} component={() => (<DashboardLayout><TollCalculator /></DashboardLayout>)} />
      <Route path={"/track-shipments"} component={() => (<DashboardLayout><TrackShipments /></DashboardLayout>)} />
      <Route path={"/traffic-conditions"} component={() => (<DashboardLayout><TrafficConditions /></DashboardLayout>)} />
      <Route path={"/training-management"} component={() => (<DashboardLayout><TrainingManagement /></DashboardLayout>)} />
      <Route path={"/two-factor-auth"} component={() => (<DashboardLayout><TwoFactorAuth /></DashboardLayout>)} />
      <Route path={"/two-factor-setup"} component={() => (<DashboardLayout><TwoFactorSetup /></DashboardLayout>)} />
      <Route path={"/user-management"} component={() => (<DashboardLayout><UserManagement /></DashboardLayout>)} />
      <Route path={"/user-verification"} component={() => (<DashboardLayout><UserVerification /></DashboardLayout>)} />
      <Route path={"/users"} component={() => (<DashboardLayout><Users /></DashboardLayout>)} />
      <Route path={"/utilization-report"} component={() => (<DashboardLayout><UtilizationReport /></DashboardLayout>)} />
      <Route path={"/vehicle"} component={() => (<DashboardLayout><Vehicle /></DashboardLayout>)} />
      <Route path={"/vehicle-details"} component={() => (<DashboardLayout><VehicleDetails /></DashboardLayout>)} />
      <Route path={"/vehicle-inspections"} component={() => (<DashboardLayout><VehicleInspections /></DashboardLayout>)} />
      <Route path={"/verification-queue"} component={() => (<DashboardLayout><VerificationQueue /></DashboardLayout>)} />
      <Route path={"/violations"} component={() => (<DashboardLayout><Violations /></DashboardLayout>)} />
      <Route path={"/wallet"} component={() => (<DashboardLayout><Wallet /></DashboardLayout>)} />
      <Route path={"/wallet/api-access"} component={() => (<DashboardLayout><WalletAPIAccess /></DashboardLayout>)} />
      <Route path={"/wallet/add-account"} component={() => (<DashboardLayout><WalletAddAccount /></DashboardLayout>)} />
      <Route path={"/wallet/add-funds"} component={() => (<DashboardLayout><WalletAddFunds /></DashboardLayout>)} />
      <Route path={"/wallet/auto-pay"} component={() => (<DashboardLayout><WalletAutoPay /></DashboardLayout>)} />
      <Route path={"/wallet/budgeting"} component={() => (<DashboardLayout><WalletBudgeting /></DashboardLayout>)} />
      <Route path={"/wallet/card-controls"} component={() => (<DashboardLayout><WalletCardControls /></DashboardLayout>)} />
      <Route path={"/wallet/card-details"} component={() => (<DashboardLayout><WalletCardDetails /></DashboardLayout>)} />
      <Route path={"/wallet/cards"} component={() => (<DashboardLayout><WalletCards /></DashboardLayout>)} />
      <Route path={"/wallet/cash-advance"} component={() => (<DashboardLayout><WalletCashAdvance /></DashboardLayout>)} />
      <Route path={"/wallet/cash-advance-history"} component={() => (<DashboardLayout><WalletCashAdvanceHistory /></DashboardLayout>)} />
      <Route path={"/wallet/cash-advance-repayment"} component={() => (<DashboardLayout><WalletCashAdvanceRepayment /></DashboardLayout>)} />
      <Route path={"/wallet/cashback"} component={() => (<DashboardLayout><WalletCashback /></DashboardLayout>)} />
      <Route path={"/wallet/currency-exchange"} component={() => (<DashboardLayout><WalletCurrencyExchange /></DashboardLayout>)} />
      <Route path={"/wallet/deposit"} component={() => (<DashboardLayout><WalletDeposit /></DashboardLayout>)} />
      <Route path={"/wallet/dispute-details"} component={() => (<DashboardLayout><WalletDisputeDetails /></DashboardLayout>)} />
      <Route path={"/wallet/disputes"} component={() => (<DashboardLayout><WalletDisputes /></DashboardLayout>)} />
      <Route path={"/wallet/escrow"} component={() => (<DashboardLayout><WalletEscrow /></DashboardLayout>)} />
      <Route path={"/wallet/escrow-details"} component={() => (<DashboardLayout><WalletEscrowDetails /></DashboardLayout>)} />
      <Route path={"/wallet/export"} component={() => (<DashboardLayout><WalletExport /></DashboardLayout>)} />
      <Route path={"/wallet/fee-analysis"} component={() => (<DashboardLayout><WalletFeeAnalysis /></DashboardLayout>)} />
      <Route path={"/wallet/file-dispute"} component={() => (<DashboardLayout><WalletFileDispute /></DashboardLayout>)} />
      <Route path={"/wallet/fuel-card-integration"} component={() => (<DashboardLayout><WalletFuelCardIntegration /></DashboardLayout>)} />
      <Route path={"/wallet/fuel-discounts"} component={() => (<DashboardLayout><WalletFuelDiscounts /></DashboardLayout>)} />
      <Route path={"/wallet/fuel-purchase"} component={() => (<DashboardLayout><WalletFuelPurchase /></DashboardLayout>)} />
      <Route path={"/wallet/goals"} component={() => (<DashboardLayout><WalletGoals /></DashboardLayout>)} />
      <Route path={"/wallet/home"} component={() => (<DashboardLayout><WalletHome /></DashboardLayout>)} />
      <Route path={"/wallet/in-chat-payment"} component={() => (<DashboardLayout><WalletInChatPayment /></DashboardLayout>)} />
      <Route path={"/wallet/instant-pay"} component={() => (<DashboardLayout><WalletInstantPay /></DashboardLayout>)} />
      <Route path={"/wallet/international-transfer"} component={() => (<DashboardLayout><WalletInternationalTransfer /></DashboardLayout>)} />
      <Route path={"/wallet/linked-accounts"} component={() => (<DashboardLayout><WalletLinkedAccounts /></DashboardLayout>)} />
      <Route path={"/wallet/lumper-payment"} component={() => (<DashboardLayout><WalletLumperPayment /></DashboardLayout>)} />
      <Route path={"/wallet/notifications"} component={() => (<DashboardLayout><WalletNotifications /></DashboardLayout>)} />
      <Route path={"/wallet/pin"} component={() => (<DashboardLayout><WalletPIN /></DashboardLayout>)} />
      <Route path={"/wallet/parking-payment"} component={() => (<DashboardLayout><WalletParkingPayment /></DashboardLayout>)} />
      <Route path={"/wallet/payment-limits"} component={() => (<DashboardLayout><WalletPaymentLimits /></DashboardLayout>)} />
      <Route path={"/wallet/payment-qr-code"} component={() => (<DashboardLayout><WalletPaymentQRCode /></DashboardLayout>)} />
      <Route path={"/wallet/payment-request"} component={() => (<DashboardLayout><WalletPaymentRequest /></DashboardLayout>)} />
      <Route path={"/wallet/payout-methods"} component={() => (<DashboardLayout><WalletPayoutMethods /></DashboardLayout>)} />
      <Route path={"/wallet/promotions"} component={() => (<DashboardLayout><WalletPromotions /></DashboardLayout>)} />
      <Route path={"/wallet/quick-pay-history"} component={() => (<DashboardLayout><WalletQuickPayHistory /></DashboardLayout>)} />
      <Route path={"/wallet/quick-pay-request"} component={() => (<DashboardLayout><WalletQuickPayRequest /></DashboardLayout>)} />
      <Route path={"/wallet/recurring-transfer"} component={() => (<DashboardLayout><WalletRecurringTransfer /></DashboardLayout>)} />
      <Route path={"/wallet/request-card"} component={() => (<DashboardLayout><WalletRequestCard /></DashboardLayout>)} />
      <Route path={"/wallet/rewards"} component={() => (<DashboardLayout><WalletRewards /></DashboardLayout>)} />
      <Route path={"/wallet/scale-payment"} component={() => (<DashboardLayout><WalletScalePayment /></DashboardLayout>)} />
      <Route path={"/wallet/scheduled-payments"} component={() => (<DashboardLayout><WalletScheduledPayments /></DashboardLayout>)} />
      <Route path={"/wallet/security-settings"} component={() => (<DashboardLayout><WalletSecuritySettings /></DashboardLayout>)} />
      <Route path={"/wallet/spending-analytics"} component={() => (<DashboardLayout><WalletSpendingAnalytics /></DashboardLayout>)} />
      <Route path={"/wallet/split-payment"} component={() => (<DashboardLayout><WalletSplitPayment /></DashboardLayout>)} />
      <Route path={"/wallet/statements"} component={() => (<DashboardLayout><WalletStatements /></DashboardLayout>)} />
      <Route path={"/wallet/support"} component={() => (<DashboardLayout><WalletSupport /></DashboardLayout>)} />
      <Route path={"/wallet/tax-documents"} component={() => (<DashboardLayout><WalletTaxDocuments /></DashboardLayout>)} />
      <Route path={"/wallet/toll-payment"} component={() => (<DashboardLayout><WalletTollPayment /></DashboardLayout>)} />
      <Route path={"/wallet/transaction-details"} component={() => (<DashboardLayout><WalletTransactionDetails /></DashboardLayout>)} />
      <Route path={"/wallet/transaction-history"} component={() => (<DashboardLayout><WalletTransactionHistory /></DashboardLayout>)} />
      <Route path={"/wallet/transactions"} component={() => (<DashboardLayout><WalletTransactions /></DashboardLayout>)} />
      <Route path={"/wallet/transfer"} component={() => (<DashboardLayout><WalletTransfer /></DashboardLayout>)} />
      <Route path={"/wallet/verification"} component={() => (<DashboardLayout><WalletVerification /></DashboardLayout>)} />
      <Route path={"/wallet/withdraw"} component={() => (<DashboardLayout><WalletWithdraw /></DashboardLayout>)} />
      <Route path={"/weather-alerts"} component={() => (<DashboardLayout><WeatherAlerts /></DashboardLayout>)} />
      <Route path={"/webhook-logs"} component={() => (<DashboardLayout><WebhookLogs /></DashboardLayout>)} />
      <Route path={"/webhook-management"} component={() => (<DashboardLayout><WebhookManagement /></DashboardLayout>)} />
      <Route path={"/widget/api"} component={() => (<DashboardLayout><WidgetAPI /></DashboardLayout>)} />
      <Route path={"/widget/access-control"} component={() => (<DashboardLayout><WidgetAccessControl /></DashboardLayout>)} />
      <Route path={"/widget/alert-thresholds"} component={() => (<DashboardLayout><WidgetAlertThresholds /></DashboardLayout>)} />
      <Route path={"/widget/annotations"} component={() => (<DashboardLayout><WidgetAnnotations /></DashboardLayout>)} />
      <Route path={"/widget/audit-log"} component={() => (<DashboardLayout><WidgetAuditLog /></DashboardLayout>)} />
      <Route path={"/widget/catalog"} component={() => (<DashboardLayout><WidgetCatalog /></DashboardLayout>)} />
      <Route path={"/widget/comparison"} component={() => (<DashboardLayout><WidgetComparison /></DashboardLayout>)} />
      <Route path={"/widget/configuration"} component={() => (<DashboardLayout><WidgetConfiguration /></DashboardLayout>)} />
      <Route path={"/widget/custom-builder"} component={() => (<DashboardLayout><WidgetCustomBuilder /></DashboardLayout>)} />
      <Route path={"/widget/data-sources"} component={() => (<DashboardLayout><WidgetDataSources /></DashboardLayout>)} />
      <Route path={"/widget/drilldown"} component={() => (<DashboardLayout><WidgetDrilldown /></DashboardLayout>)} />
      <Route path={"/widget/embedding"} component={() => (<DashboardLayout><WidgetEmbedding /></DashboardLayout>)} />
      <Route path={"/widget/export"} component={() => (<DashboardLayout><WidgetExport /></DashboardLayout>)} />
      <Route path={"/widget/filters"} component={() => (<DashboardLayout><WidgetFilters /></DashboardLayout>)} />
      <Route path={"/widget/goals"} component={() => (<DashboardLayout><WidgetGoals /></DashboardLayout>)} />
      <Route path={"/widget/import-export"} component={() => (<DashboardLayout><WidgetImportExport /></DashboardLayout>)} />
      <Route path={"/widget/interactive"} component={() => (<DashboardLayout><WidgetInteractive /></DashboardLayout>)} />
      <Route path={"/widget/layouts"} component={() => (<DashboardLayout><WidgetLayouts /></DashboardLayout>)} />
      <Route path={"/widget/mobile"} component={() => (<DashboardLayout><WidgetMobile /></DashboardLayout>)} />
      <Route path={"/widget/notifications"} component={() => (<DashboardLayout><WidgetNotifications /></DashboardLayout>)} />
      <Route path={"/widget/performance"} component={() => (<DashboardLayout><WidgetPerformance /></DashboardLayout>)} />
      <Route path={"/widget/scheduled-refresh"} component={() => (<DashboardLayout><WidgetScheduledRefresh /></DashboardLayout>)} />
      <Route path={"/widget/scheduled-reports"} component={() => (<DashboardLayout><WidgetScheduledReports /></DashboardLayout>)} />
      <Route path={"/widget/sharing"} component={() => (<DashboardLayout><WidgetSharing /></DashboardLayout>)} />
      <Route path={"/widget/templates"} component={() => (<DashboardLayout><WidgetTemplates /></DashboardLayout>)} />
      <Route path={"/widget/themes"} component={() => (<DashboardLayout><WidgetThemes /></DashboardLayout>)} />
      <Route path={"/zeun/admin-dashboard"} component={() => (<DashboardLayout><ZeunAdminDashboard /></DashboardLayout>)} />
      <Route path={"/zeun/analytics"} component={() => (<DashboardLayout><ZeunAnalytics /></DashboardLayout>)} />
      <Route path={"/zeun/appointment-booking"} component={() => (<DashboardLayout><ZeunAppointmentBooking /></DashboardLayout>)} />
      <Route path={"/zeun/brake-tracking"} component={() => (<DashboardLayout><ZeunBrakeTracking /></DashboardLayout>)} />
      <Route path={"/zeun/breakdown"} component={() => (<DashboardLayout><ZeunBreakdown /></DashboardLayout>)} />
      <Route path={"/zeun/breakdown-report"} component={() => (<DashboardLayout><ZeunBreakdownReport /></DashboardLayout>)} />
      <Route path={"/zeun/breakdown-wizard"} component={() => (<DashboardLayout><ZeunBreakdownWizard /></DashboardLayout>)} />
      <Route path={"/zeun/budgeting"} component={() => (<DashboardLayout><ZeunBudgeting /></DashboardLayout>)} />
      <Route path={"/zeun/compliance-calendar"} component={() => (<DashboardLayout><ZeunComplianceCalendar /></DashboardLayout>)} />
      <Route path={"/zeun/cost-analysis"} component={() => (<DashboardLayout><ZeunCostAnalysis /></DashboardLayout>)} />
      <Route path={"/zeun/cost-per-mile"} component={() => (<DashboardLayout><ZeunCostPerMile /></DashboardLayout>)} />
      <Route path={"/zeun/cost-tracking"} component={() => (<DashboardLayout><ZeunCostTracking /></DashboardLayout>)} />
      <Route path={"/zeun/dot-inspection-prep"} component={() => (<DashboardLayout><ZeunDOTInspectionPrep /></DashboardLayout>)} />
      <Route path={"/zeun/dtc-history"} component={() => (<DashboardLayout><ZeunDTCHistory /></DashboardLayout>)} />
      <Route path={"/zeun/dtc-lookup"} component={() => (<DashboardLayout><ZeunDTCLookup /></DashboardLayout>)} />
      <Route path={"/zeun/dashboard"} component={() => (<DashboardLayout><ZeunDashboard /></DashboardLayout>)} />
      <Route path={"/zeun/defect-repair"} component={() => (<DashboardLayout><ZeunDefectRepair /></DashboardLayout>)} />
      <Route path={"/zeun/defect-tracking"} component={() => (<DashboardLayout><ZeunDefectTracking /></DashboardLayout>)} />
      <Route path={"/zeun/emergency-protocol"} component={() => (<DashboardLayout><ZeunEmergencyProtocol /></DashboardLayout>)} />
      <Route path={"/zeun/estimate-approval"} component={() => (<DashboardLayout><ZeunEstimateApproval /></DashboardLayout>)} />
      <Route path={"/zeun/fleet-dashboard"} component={() => (<DashboardLayout><ZeunFleetDashboard /></DashboardLayout>)} />
      <Route path={"/zeun/fluid-tracking"} component={() => (<DashboardLayout><ZeunFluidTracking /></DashboardLayout>)} />
      <Route path={"/zeun/forecasting"} component={() => (<DashboardLayout><ZeunForecasting /></DashboardLayout>)} />
      <Route path={"/zeun/inspection-forms"} component={() => (<DashboardLayout><ZeunInspectionForms /></DashboardLayout>)} />
      <Route path={"/zeun/inspection-schedule"} component={() => (<DashboardLayout><ZeunInspectionSchedule /></DashboardLayout>)} />
      <Route path={"/zeun/inventory-management"} component={() => (<DashboardLayout><ZeunInventoryManagement /></DashboardLayout>)} />
      <Route path={"/zeun/invoice-review"} component={() => (<DashboardLayout><ZeunInvoiceReview /></DashboardLayout>)} />
      <Route path={"/zeun/maintenance-alerts"} component={() => (<DashboardLayout><ZeunMaintenanceAlerts /></DashboardLayout>)} />
      <Route path={"/zeun/maintenance-history"} component={() => (<DashboardLayout><ZeunMaintenanceHistory /></DashboardLayout>)} />
      <Route path={"/zeun/maintenance-planning"} component={() => (<DashboardLayout><ZeunMaintenancePlanning /></DashboardLayout>)} />
      <Route path={"/zeun/maintenance-schedule"} component={() => (<DashboardLayout><ZeunMaintenanceSchedule /></DashboardLayout>)} />
      <Route path={"/zeun/maintenance-tracker"} component={() => (<DashboardLayout><ZeunMaintenanceTracker /></DashboardLayout>)} />
      <Route path={"/zeun/mobile-repair"} component={() => (<DashboardLayout><ZeunMobileRepair /></DashboardLayout>)} />
      <Route path={"/zeun/parts-catalog"} component={() => (<DashboardLayout><ZeunPartsCatalog /></DashboardLayout>)} />
      <Route path={"/zeun/parts-ordering"} component={() => (<DashboardLayout><ZeunPartsOrdering /></DashboardLayout>)} />
      <Route path={"/zeun/parts-tracking"} component={() => (<DashboardLayout><ZeunPartsTracking /></DashboardLayout>)} />
      <Route path={"/zeun/payment-processing"} component={() => (<DashboardLayout><ZeunPaymentProcessing /></DashboardLayout>)} />
      <Route path={"/zeun/predictive-maintenance"} component={() => (<DashboardLayout><ZeunPredictiveMaintenance /></DashboardLayout>)} />
      <Route path={"/zeun/provider-details"} component={() => (<DashboardLayout><ZeunProviderDetails /></DashboardLayout>)} />
      <Route path={"/zeun/provider-network"} component={() => (<DashboardLayout><ZeunProviderNetwork /></DashboardLayout>)} />
      <Route path={"/zeun/provider-reviews"} component={() => (<DashboardLayout><ZeunProviderReviews /></DashboardLayout>)} />
      <Route path={"/zeun/provider-search"} component={() => (<DashboardLayout><ZeunProviderSearch /></DashboardLayout>)} />
      <Route path={"/zeun/provider-selection"} component={() => (<DashboardLayout><ZeunProviderSelection /></DashboardLayout>)} />
      <Route path={"/zeun/recall-details"} component={() => (<DashboardLayout><ZeunRecallDetails /></DashboardLayout>)} />
      <Route path={"/zeun/recall-tracking"} component={() => (<DashboardLayout><ZeunRecallTracking /></DashboardLayout>)} />
      <Route path={"/zeun/repair-details"} component={() => (<DashboardLayout><ZeunRepairDetails /></DashboardLayout>)} />
      <Route path={"/zeun/repair-estimate"} component={() => (<DashboardLayout><ZeunRepairEstimate /></DashboardLayout>)} />
      <Route path={"/zeun/repair-history"} component={() => (<DashboardLayout><ZeunRepairHistory /></DashboardLayout>)} />
      <Route path={"/zeun/repair-tracking"} component={() => (<DashboardLayout><ZeunRepairTracking /></DashboardLayout>)} />
      <Route path={"/zeun/reporting"} component={() => (<DashboardLayout><ZeunReporting /></DashboardLayout>)} />
      <Route path={"/zeun/roadside-assistance"} component={() => (<DashboardLayout><ZeunRoadsideAssistance /></DashboardLayout>)} />
      <Route path={"/zeun/shop-details"} component={() => (<DashboardLayout><ZeunShopDetails /></DashboardLayout>)} />
      <Route path={"/zeun/shop-locator"} component={() => (<DashboardLayout><ZeunShopLocator /></DashboardLayout>)} />
      <Route path={"/zeun/tire-management"} component={() => (<DashboardLayout><ZeunTireManagement /></DashboardLayout>)} />
      <Route path={"/zeun/tire-replacement"} component={() => (<DashboardLayout><ZeunTireReplacement /></DashboardLayout>)} />
      <Route path={"/zeun/tire-rotation"} component={() => (<DashboardLayout><ZeunTireRotation /></DashboardLayout>)} />
      <Route path={"/zeun/towing-request"} component={() => (<DashboardLayout><ZeunTowingRequest /></DashboardLayout>)} />
      <Route path={"/zeun/vendor-management"} component={() => (<DashboardLayout><ZeunVendorManagement /></DashboardLayout>)} />
      <Route path={"/zeun/vendor-performance"} component={() => (<DashboardLayout><ZeunVendorPerformance /></DashboardLayout>)} />
      <Route path={"/zeun/warranty-tracking"} component={() => (<DashboardLayout><ZeunWarrantyTracking /></DashboardLayout>)} />

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
