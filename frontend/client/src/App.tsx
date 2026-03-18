import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EusoDialogProvider } from "@/components/EusoDialog";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import type { UserRole } from "./hooks/useRoleAccess";
import { ThemeProvider } from "./contexts/ThemeContext";
const Home = lazy(() => import("./pages/Home"));
const AccessValidation = lazy(() => import("./pages/AccessValidation"));
const ShipmentPage = lazy(() => import("./pages/Shipment"));
const JobsPage = lazy(() => import("./pages/Jobs"));
const MessagesPage = lazy(() => import("./pages/Messages"));
const ChannelsPage = lazy(() => import("./pages/Channels"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const CompanyPage = lazy(() => import("./pages/Company"));
const EscortTeam = lazy(() => import("./pages/EscortTeam"));
const FacilityPage = lazy(() => import("./pages/Facility"));
const ProceduresPage = lazy(() => import("./pages/Procedures"));
const DiagnosticsPage = lazy(() => import("./pages/Diagnostics"));
const WalletPage = lazy(() => import("./pages/Wallet"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const NewsFeedPage = lazy(() => import("./pages/NewsFeed"));
const SupportPage = lazy(() => import("./pages/Support"));
const CommissionPage = lazy(() => import("./pages/Commission"));
const ShippersPage = lazy(() => import("./pages/Shippers"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CompanyChannels = lazy(() => import("./pages/CompanyChannels"));
const Analytics = lazy(() => import("./pages/Analytics"));
const DocumentsPage = lazy(() => import("./pages/Documents"));
import DashboardLayout from "./components/DashboardLayout";
const ZeunBreakdownReport = lazy(() => import("./pages/ZeunBreakdownReport"));
const ZeunMaintenanceTracker = lazy(() => import("./pages/ZeunMaintenanceTracker"));
const ZeunProviderNetwork = lazy(() => import("./pages/ZeunProviderNetwork"));
const ActiveTrip = lazy(() => import("./pages/ActiveTrip"));
const MarketIntelligence2026 = lazy(() => import("./pages/MarketIntelligence2026"));
const MyLoadsPage = lazy(() => import("./pages/MyLoads"));
// PlatformLoadsOversight — DEPRECATED (Task 5.1.2), absorbed into admin/PlatformOversight
const PlatformAgreementsOversight = lazy(() => import("./pages/PlatformAgreementsOversight"));
// PlatformClaimsOversight — DEPRECATED (Task 5.1.2), absorbed into admin/PlatformOversight
// PlatformSupportOversight — DEPRECATED (Task 5.1.2), absorbed into admin/PlatformOversight
const LoadCreatePage = lazy(() => import("./pages/LoadCreate"));
const FindLoadsPage = lazy(() => import("./pages/FindLoads"));
// ActiveLoads merged into MyLoads
// TrackShipments merged into ShipperDispatchControl
const CatalystsPage = lazy(() => import("./pages/Catalysts"));
// Payments merged into Wallet (EusoWallet)
// AssignedLoads, InTransit, CatalystAnalytics, Fleet, Drivers, Earnings — DEPRECATED (Task 4.5.2)
// Functionality absorbed: AssignedLoads/InTransit → MyLoads, CatalystAnalytics → Analytics, Fleet/Drivers → FleetCommandCenter, Earnings → Wallet
const FleetCommandCenter = lazy(() => import("./pages/FleetCommandCenter"));
const ErgPage = lazy(() => import("./pages/Erg"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CDLVerification = lazy(() => import("./pages/CDLVerification"));
const PlacardVerification = lazy(() => import("./pages/PlacardVerification"));
const ShippingPapers = lazy(() => import("./pages/ShippingPapers"));
const SpillResponse = lazy(() => import("./pages/SpillResponse"));
const EvacuationDistance = lazy(() => import("./pages/EvacuationDistance"));
// HazmatEndorsement — DEPRECATED (Task 5.3.2), absorbed into compliance/HazmatCompliance
const TWICCard = lazy(() => import("./pages/TWICCard"));
const DrugTestAcknowledgment = lazy(() => import("./pages/DrugTestAcknowledgment"));
const SegregationRules = lazy(() => import("./pages/SegregationRules"));
const FireResponse = lazy(() => import("./pages/FireResponse"));
const IncidentReportForm = lazy(() => import("./pages/IncidentReportForm"));
const TripPay = lazy(() => import("./pages/TripPay"));
const SettlementHistory = lazy(() => import("./pages/SettlementHistory"));
const SettlementBatching = lazy(() => import("./pages/settlements/SettlementBatching"));
const AllocationDashboard = lazy(() => import("./pages/allocations/AllocationDashboard"));
const BulkImport = lazy(() => import("./pages/bulkImport/BulkImport"));
const Pricebook = lazy(() => import("./pages/pricebook/Pricebook"));
const FSCEngine = lazy(() => import("./pages/fsc/FSCEngine"));
const CustomerPortal = lazy(() => import("./pages/portal/CustomerPortal"));
const PortalManagement = lazy(() => import("./pages/portal/PortalManagement"));
const DeductionsBreakdown = lazy(() => import("./pages/DeductionsBreakdown"));
const BonusTracker = lazy(() => import("./pages/BonusTracker"));
const DirectDeposit = lazy(() => import("./pages/DirectDeposit"));
const DriverAvailability = lazy(() => import("./pages/DriverAvailability"));
const PlacardGuide = lazy(() => import("./pages/PlacardGuide"));
const EmergencyNotification = lazy(() => import("./pages/EmergencyNotification"));
const LanguageSettings = lazy(() => import("./pages/LanguageSettings"));
const PrivacySettings = lazy(() => import("./pages/PrivacySettings"));
const NRCReport = lazy(() => import("./pages/NRCReport"));
const DOT5800Form = lazy(() => import("./pages/DOT5800Form"));
const SecurityPlan = lazy(() => import("./pages/SecurityPlan"));
// HazmatRegistration — DEPRECATED (Task 5.3.2), absorbed into compliance/HazmatCompliance
const CorrectiveActions = lazy(() => import("./pages/CorrectiveActions"));
const RegulatoryUpdates = lazy(() => import("./pages/RegulatoryUpdates"));
const TankValve = lazy(() => import("./pages/TankValve"));
const TankPressure = lazy(() => import("./pages/TankPressure"));
const CryogenicTank = lazy(() => import("./pages/CryogenicTank"));
const LiquidTankInspection = lazy(() => import("./pages/LiquidTankInspection"));
const PressurizedTankInspection = lazy(() => import("./pages/PressurizedTankInspection"));
const FlatbedSecurement = lazy(() => import("./pages/FlatbedSecurement"));
const HopperInspection = lazy(() => import("./pages/HopperInspection"));
const VoiceMessaging = lazy(() => import("./pages/VoiceMessaging"));
const EmergencyBroadcast = lazy(() => import("./pages/EmergencyBroadcast"));
const EmergencyProtocols = lazy(() => import("./pages/EmergencyProtocols"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const TodaySchedule = lazy(() => import("./pages/TodaySchedule"));
const HazmatDriverFilter = lazy(() => import("./pages/HazmatDriverFilter"));
const HazmatEquipmentFilter = lazy(() => import("./pages/HazmatEquipmentFilter"));
const HazmatRouteRestriction = lazy(() => import("./pages/HazmatRouteRestriction"));
// HazmatRouteCompliance — DEPRECATED (Task 5.3.2), absorbed into compliance/HazmatCompliance
const HazmatCheckIn = lazy(() => import("./pages/HazmatCheckIn"));
const DockAssignment = lazy(() => import("./pages/DockAssignment"));
const LoadingUnloadingStatus = lazy(() => import("./pages/LoadingUnloadingStatus"));
// TestLogin removed from production - SOC II: no dev backdoors in prod
const Register = lazy(() => import("./pages/Register"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RegisterShipper = lazy(() => import("./pages/RegisterShipper"));
const RegisterCatalyst = lazy(() => import("./pages/RegisterCatalyst"));
const RegisterDriver = lazy(() => import("./pages/RegisterDriver"));
const LoadBids = lazy(() => import("./pages/LoadBids"));
const RegisterEscort = lazy(() => import("./pages/RegisterEscort"));
const RegisterBroker = lazy(() => import("./pages/RegisterBroker"));
const RegisterDispatch = lazy(() => import("./pages/RegisterDispatch"));
const RegisterTerminal = lazy(() => import("./pages/RegisterTerminal"));
const RegisterCompliance = lazy(() => import("./pages/RegisterCompliance"));
const RegisterSafety = lazy(() => import("./pages/RegisterSafety"));
const RegisterAdmin = lazy(() => import("./pages/RegisterAdmin"));
const DispatchDashboard = lazy(() => import("./pages/DispatchDashboard"));
const DispatchCommandCenter = lazy(() => import("./pages/DispatchCommandCenter"));
const DispatchPlanner = lazy(() => import("./pages/dispatch/DispatchPlanner"));
const DispatchAssignedLoads = lazy(() => import("./pages/dispatch/DispatchAssignedLoads"));
const DispatchELDIntelligence = lazy(() => import("./pages/dispatch/DispatchELDIntelligence"));
const LoadBoard = lazy(() => import("./pages/LoadBoard"));
const SafetyDashboard = lazy(() => import("./pages/SafetyDashboard"));
const ComplianceDashboard = lazy(() => import("./pages/ComplianceDashboard"));
const TerminalDashboard = lazy(() => import("./pages/TerminalDashboard"));
const BrokerDashboard = lazy(() => import("./pages/BrokerDashboard"));
const EscortDashboard = lazy(() => import("./pages/EscortDashboard"));
const EscortActiveTrip = lazy(() => import("./pages/EscortActiveTrip"));
const EscortProfile = lazy(() => import("./pages/EscortProfile"));
const FleetManagement = lazy(() => import("./pages/FleetManagement"));
const ShipperLoads = lazy(() => import("./pages/ShipperLoads"));
const Billing = lazy(() => import("./pages/Billing"));
const LoadTracking = lazy(() => import("./pages/LoadTracking"));
const IncidentReport = lazy(() => import("./pages/IncidentReport"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const IndustryDirectory = lazy(() => import("./pages/IndustryDirectory"));
const LiveNewsFeed = lazy(() => import("./pages/LiveNewsFeed"));
const ESANGChat = lazy(() => import("./pages/ESANGChat"));
const DriverDashboard = lazy(() => import("./pages/DriverDashboard"));
const LoadCreationWizard = lazy(() => import("./pages/LoadCreationWizard"));
const BidManagement = lazy(() => import("./pages/BidManagement"));
const CatalystBidSubmission = lazy(() => import("./pages/CatalystBidSubmission"));
const PreTripInspection = lazy(() => import("./pages/PreTripInspection"));
const DVIR = lazy(() => import("./pages/DVIR"));
const DispatchBoard = lazy(() => import("./pages/DispatchBoard"));
const CatalystVetting = lazy(() => import("./pages/CatalystVetting"));
const EscortJobMarketplace = lazy(() => import("./pages/EscortJobMarketplace"));
const TerminalScheduling = lazy(() => import("./pages/TerminalScheduling"));
const DQFileManagement = lazy(() => import("./pages/DQFileManagement"));
const CSAScoresDashboard = lazy(() => import("./pages/CSAScoresDashboard"));
const UserVerification = lazy(() => import("./pages/UserVerification"));
const HOSTracker = lazy(() => import("./pages/HOSTracker"));
const NotificationsCenter = lazy(() => import("./pages/NotificationsCenter"));
const DocumentCenter = lazy(() => import("./pages/DocumentCenter"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const RateCalculator = lazy(() => import("./pages/RateCalculator"));
const DriverEarnings = lazy(() => import("./pages/DriverEarnings"));
const TrainingManagement = lazy(() => import("./pages/TrainingManagement"));
const TrainingCompliance = lazy(() => import("./pages/TrainingCompliance"));
const TrainingLMS = lazy(() => import("./pages/TrainingLMS"));
const FuelManagement = lazy(() => import("./pages/FuelManagement"));
// @deprecated — consolidated into DriverSafetyScorecard (Task 6.1.1)
// const DriverScorecard = lazy(() => import("./pages/DriverScorecard"));
const Rewards = lazy(() => import("./pages/Rewards"));
const ClearinghouseDashboard = lazy(() => import("./pages/ClearinghouseDashboard"));
const TerminalSCADA = lazy(() => import("./pages/TerminalSCADA"));
const TerminalPartners = lazy(() => import("./pages/TerminalPartners"));
const MyPartners = lazy(() => import("./pages/MyPartners"));
const MyTerminals = lazy(() => import("./pages/MyTerminals"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const DriverOnboarding = lazy(() => import("./pages/DriverOnboarding"));
const AccidentReport = lazy(() => import("./pages/AccidentReport"));
const CatalystVettingDetails = lazy(() => import("./pages/CatalystVettingDetails"));
const MessagingCenter = lazy(() => import("./pages/MessagingCenter"));
const LoadDetails = lazy(() => import("./pages/LoadDetails"));
const ELDLogs = lazy(() => import("./pages/ELDLogs"));
const InvoiceDetails = lazy(() => import("./pages/InvoiceDetails"));
const EscortJobs = lazy(() => import("./pages/EscortJobs"));
const BidDetails = lazy(() => import("./pages/BidDetails"));
const ContractSigning = lazy(() => import("./pages/ContractSigning"));
const ShipperAgreementWizard = lazy(() => import("./pages/ShipperAgreementWizard"));
const AgreementsLibrary = lazy(() => import("./pages/AgreementsLibrary"));
const AgreementDetail = lazy(() => import("./pages/AgreementDetail"));
const RecurringLoadScheduler = lazy(() => import("./pages/RecurringLoadScheduler"));
const LoadTemplates = lazy(() => import("./pages/LoadTemplates"));
const BrokerContractWizard = lazy(() => import("./pages/BrokerContractWizard"));
const ShipperDispatchControl = lazy(() => import("./pages/ShipperDispatchControl"));
const FleetOverview = lazy(() => import("./pages/FleetOverview"));
const ComplianceCalendar = lazy(() => import("./pages/ComplianceCalendar"));
const DriverPerformance = lazy(() => import("./pages/DriverPerformance"));
const SettlementDetails = lazy(() => import("./pages/SettlementDetails"));
const AppointmentScheduler = lazy(() => import("./pages/AppointmentScheduler"));
const NotificationCenter = lazy(() => import("./pages/NotificationCenter"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const ActiveConvoys = lazy(() => import("./pages/ActiveConvoys"));
// @deprecated — consolidated into EscortEarnings (Task 6.2.2)
// const EscortReports = lazy(() => import("./pages/EscortReports"));
const EscortIncidents = lazy(() => import("./pages/EscortIncidents"));
const Specializations = lazy(() => import("./pages/Specializations"));
const MatchedLoads = lazy(() => import("./pages/MatchedLoads"));
const Opportunities = lazy(() => import("./pages/Opportunities"));
const DispatchPerformance = lazy(() => import("./pages/DispatchPerformance"));
const IncomingShipments = lazy(() => import("./pages/IncomingShipments"));
const OutgoingShipments = lazy(() => import("./pages/OutgoingShipments"));
const TerminalStaff = lazy(() => import("./pages/TerminalStaff"));
const TerminalOperations = lazy(() => import("./pages/TerminalOperations"));
const TerminalAppointments = lazy(() => import("./pages/TerminalAppointments"));
const GateOperations = lazy(() => import("./pages/GateOperations"));
const DockManagement = lazy(() => import("./pages/DockManagement"));
const TerminalCreateLoad = lazy(() => import("./pages/TerminalCreateLoad"));
const Violations = lazy(() => import("./pages/Violations"));
const Audits = lazy(() => import("./pages/Audits"));
const SafetyMetrics = lazy(() => import("./pages/SafetyMetrics"));
const SafetyIncidents = lazy(() => import("./pages/SafetyIncidents"));
// BrokerMarketplace, BrokerCatalysts, BrokerAnalytics — DEPRECATED (Task 4.5.1)
// Functionality absorbed: Marketplace → FindLoads, Catalysts → CatalystsPage, Analytics → BrokerDashboard
const LoadingBays = lazy(() => import("./pages/LoadingBays"));
const TerminalInventory = lazy(() => import("./pages/TerminalInventory"));
// BOLGeneration — DEPRECATED (Task 5.3.1), absorbed into compliance/ShippingPapers
const DriverCurrentJob = lazy(() => import("./pages/DriverCurrentJob"));
const DriverVehicle = lazy(() => import("./pages/DriverVehicle"));
const DriverHOS = lazy(() => import("./pages/DriverHOS"));
const DispatchFleetMap = lazy(() => import("./pages/DispatchFleetMap"));
const DispatchExceptions = lazy(() => import("./pages/DispatchExceptions"));
// @deprecated — consolidated into EscortCertifications (Task 6.2.1)
// const EscortPermits = lazy(() => import("./pages/EscortPermits"));
const EscortSchedule = lazy(() => import("./pages/EscortSchedule"));
const SpectraMatch = lazy(() => import("./pages/SpectraMatch"));
const EusoTicket = lazy(() => import("./pages/EusoTicket"));
const LocationIntelligence = lazy(() => import("./pages/LocationIntelligence"));
const AdminRSSFeeds = lazy(() => import("./pages/AdminRSSFeeds"));
const SyncDashboard = lazy(() => import("./pages/admin/SyncDashboard"));
const AdminPlatformFees = lazy(() => import("./pages/AdminPlatformFees"));
const Missions = lazy(() => import("./pages/Missions"));
const DriverTracking = lazy(() => import("./pages/DriverTracking"));
const FleetTracking = lazy(() => import("./pages/FleetTracking"));
const AdminTelemetry = lazy(() => import("./pages/AdminTelemetry"));
const ZeunBreakdown = lazy(() => import("./pages/ZeunBreakdown"));
const ZeunFleetDashboard = lazy(() => import("./pages/ZeunFleetDashboard"));
const ZeunAdminDashboard = lazy(() => import("./pages/ZeunAdminDashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const HotZones = lazy(() => import("./pages/HotZones"));
const RatingsReviews = lazy(() => import("./pages/RatingsReviews"));
const ClaimsPage = lazy(() => import("./pages/Claims"));
const MarketPricing = lazy(() => import("./pages/MarketPricing"));
const AccountStatus = lazy(() => import("./pages/AccountStatus"));
// DatabaseHealth — DEPRECATED (Task 5.1.1), absorbed into admin/SystemHealth
const OperatingAuthority = lazy(() => import("./pages/OperatingAuthority"));
const AdminApprovalQueue = lazy(() => import("./pages/AdminApprovalQueue"));
// CatalystCompliance — DEPRECATED (Task 4.5.2), redirected to OperatingAuthority
const FuelPrices = lazy(() => import("./pages/FuelPrices"));
const WeatherAlerts = lazy(() => import("./pages/WeatherAlerts"));
const TheHaul = lazy(() => import("./pages/TheHaul"));
const FactoringDashboardPage = lazy(() => import("./pages/factoring/FactoringDashboard"));
const FactoringInvoicesPage = lazy(() => import("./pages/factoring/FactoringInvoices"));
const FactoringCatalystsPage = lazy(() => import("./pages/factoring/FactoringCatalysts"));
const FactoringCollectionsPage = lazy(() => import("./pages/factoring/FactoringCollections"));
const FactoringFundingPage = lazy(() => import("./pages/factoring/FactoringFunding"));
const FactoringRiskPage = lazy(() => import("./pages/factoring/FactoringRisk"));
const FactoringAgingPage = lazy(() => import("./pages/factoring/FactoringAging"));
const FactoringChargebacksPage = lazy(() => import("./pages/factoring/FactoringChargebacks"));
const FactoringDebtorsPage = lazy(() => import("./pages/factoring/FactoringDebtors"));
const FactoringReportsPage = lazy(() => import("./pages/factoring/FactoringReports"));
// ── Gold Standard: Final 5 missing screens ──────────────────────────────────
const ReeferTemperatureLog = lazy(() => import("./pages/ReeferTemperatureLog"));
const PerLoadInsurance = lazy(() => import("./pages/PerLoadInsurance"));
const InsuranceVerification = lazy(() => import("./pages/InsuranceVerification"));
const EquipmentIntelligence = lazy(() => import("./pages/EquipmentIntelligence"));
const RateSheetReconciliation = lazy(() => import("./pages/RateSheetReconciliation"));
// ── Gold Standard Wiring: 46 previously dead-code pages ─────────────────────
const BackgroundChecks = lazy(() => import("./pages/BackgroundChecks"));
// BOLManagementPage — DEPRECATED (Task 5.3.1), absorbed into compliance/ShippingPapers
const BrokerCompliancePage = lazy(() => import("./pages/BrokerCompliance"));
const CapacityPlanningPage = lazy(() => import("./pages/CapacityPlanning"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePassword"));
const DetentionTrackingPage = lazy(() => import("./pages/DetentionTracking"));
const RelayModePage = lazy(() => import("./pages/RelayMode"));
const PredictiveLoadPricingPage = lazy(() => import("./pages/PredictiveLoadPricing"));
const DriverNavPage = lazy(() => import("./pages/DriverNavigation"));
const DriverSafetyScorecardPage = lazy(() => import("./pages/DriverSafetyScorecard"));
const DrugAlcoholTestingPage = lazy(() => import("./pages/DrugAlcoholTesting"));
const DVIRManagementPage = lazy(() => import("./pages/DVIRManagement"));
const ELDIntegrationPage = lazy(() => import("./pages/ELDIntegration"));
const FMCSACarrierIntelligencePage = lazy(() => import("./pages/FMCSACarrierIntelligence"));
const EquipmentMgmtPage = lazy(() => import("./pages/EquipmentManagement"));
const ERGGuidePage = lazy(() => import("./pages/ERGGuide"));
const ERGLookupPage = lazy(() => import("./pages/ERGLookup"));
// FeatureFlagsPage — DEPRECATED (Task 5.1.3), absorbed into admin/SystemConfiguration
const SystemConfigurationHub = lazy(() => import("./pages/admin/SystemConfiguration"));
// HazmatCertsPage — DEPRECATED (Task 5.3.2), absorbed into compliance/HazmatCompliance
const HazmatComplianceHub = lazy(() => import("./pages/compliance/HazmatCompliance"));
// @deprecated — consolidated into DriverHOS (Task 6.1.2)
// const HOSCompliancePage = lazy(() => import("./pages/HOSCompliance"));
const IFTAReportingPage = lazy(() => import("./pages/IFTAReporting"));
const InsuranceMgmtPage = lazy(() => import("./pages/InsuranceManagement"));
const InvoiceMgmtPage = lazy(() => import("./pages/InvoiceManagement"));
const LaneAnalysisPage = lazy(() => import("./pages/LaneAnalysis"));
const LoadHistoryPage = lazy(() => import("./pages/LoadHistory"));
const MaintenanceSchedulePage = lazy(() => import("./pages/MaintenanceSchedule"));
const MedicalCertsPage = lazy(() => import("./pages/MedicalCertifications"));
const MVRReportsPage = lazy(() => import("./pages/MVRReports"));
const OnTimePerformancePage = lazy(() => import("./pages/OnTimePerformance"));
const PaymentHistoryPage = lazy(() => import("./pages/PaymentHistory"));
const PermitMgmtPage = lazy(() => import("./pages/PermitManagement"));
const PODManagementPage = lazy(() => import("./pages/PODManagement"));
const QuoteMgmtPage = lazy(() => import("./pages/QuoteManagement"));
const ReportBuilderPage = lazy(() => import("./pages/ReportBuilder"));
const RestStopsPage = lazy(() => import("./pages/RestStops"));
const RevenueAnalyticsPage = lazy(() => import("./pages/RevenueAnalytics"));
const RolePermissionsPage = lazy(() => import("./pages/RolePermissions"));
const RoutePlanningPage = lazy(() => import("./pages/RoutePlanning"));
const SAFERLookupPage = lazy(() => import("./pages/SAFERLookup"));
const SafetyMeetingsPage = lazy(() => import("./pages/SafetyMeetings"));
const ScaleLocationsPage = lazy(() => import("./pages/ScaleLocations"));
const SecuritySettingsPage = lazy(() => import("./pages/SecuritySettings"));
const SessionMgmtPage = lazy(() => import("./pages/SessionManagement"));
const SettlementStatementsPage = lazy(() => import("./pages/SettlementStatements"));
const ShipperCompliancePage = lazy(() => import("./pages/ShipperCompliance"));
const TaxDocumentsPage = lazy(() => import("./pages/TaxDocuments"));
const TrafficConditionsPage = lazy(() => import("./pages/TrafficConditions"));
const TwoFactorAuthPage = lazy(() => import("./pages/TwoFactorAuth"));
const TwoFactorSetupPage = lazy(() => import("./pages/TwoFactorSetup"));
const VehicleInspectionsPage = lazy(() => import("./pages/VehicleInspections"));
// ── Gold Standard Gap Audit: 18 pages with files but no routes ────────────────
const AchievementsBadges = lazy(() => import("./pages/AchievementsBadges"));
const QuickActions = lazy(() => import("./pages/QuickActions"));
const UtilizationReport = lazy(() => import("./pages/UtilizationReport"));
const ExpenseReports = lazy(() => import("./pages/ExpenseReports"));
const HazmatShipments = lazy(() => import("./pages/HazmatShipments"));
const BillingSettings = lazy(() => import("./pages/BillingSettings"));
const BroadcastMessages = lazy(() => import("./pages/BroadcastMessages"));
const EscortEarnings = lazy(() => import("./pages/EscortEarnings"));
const EscortCertifications = lazy(() => import("./pages/EscortCertifications"));
const SupportTickets = lazy(() => import("./pages/SupportTickets"));
const RateManagement = lazy(() => import("./pages/RateManagement"));
const APIManagement = lazy(() => import("./pages/APIManagement"));
const IntegrationSettings = lazy(() => import("./pages/IntegrationSettings"));
const BackupManagement = lazy(() => import("./pages/BackupManagement"));
const ReleaseNotes = lazy(() => import("./pages/ReleaseNotes"));
const DataExport = lazy(() => import("./pages/DataExport"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
// ── Frontend Gap Audit: 16 new pages for backend routers ─────────────────────
const RateNegotiations = lazy(() => import("./pages/RateNegotiations"));
const CarrierScorecardPage = lazy(() => import("./pages/CarrierScorecardPage"));
const CarrierTierDashboard = lazy(() => import("./pages/CarrierTierDashboard"));
const CarrierCapacityPage = lazy(() => import("./pages/CarrierCapacityPage"));
const TankLevelMonitor = lazy(() => import("./pages/TankLevelMonitor"));
const DemurrageChargesPage = lazy(() => import("./pages/DemurrageChargesPage"));
const NLLoadCreatorPage = lazy(() => import("./pages/NLLoadCreatorPage"));
const VoiceESANGPage = lazy(() => import("./pages/VoiceESANGPage"));
const RFPManagerPage = lazy(() => import("./pages/RFPManagerPage"));
const BidReviewPage = lazy(() => import("./pages/BidReviewPage"));
const PhotoInspectionPage = lazy(() => import("./pages/PhotoInspectionPage"));
const ContextualPricingPage = lazy(() => import("./pages/ContextualPricingPage"));
const ComplianceRulesPage = lazy(() => import("./pages/ComplianceRulesPage"));
const AnomalyMonitorPage = lazy(() => import("./pages/AnomalyMonitorPage"));
const MissionBalancerPage = lazy(() => import("./pages/MissionBalancerPage"));
const LoadConsolidationPage = lazy(() => import("./pages/LoadConsolidationPage"));
const MobileCommandPage = lazy(() => import("./pages/MobileCommandPage"));
const TruckPostingBoard = lazy(() => import("./pages/TruckPostingBoard"));
const DrugTestingManagement = lazy(() => import("./pages/DrugTestingManagement"));
const DriverQualificationFiles = lazy(() => import("./pages/DriverQualificationFiles"));
const LaneContractsPage = lazy(() => import("./pages/LaneContractsPage"));
const LoadBiddingAdvanced = lazy(() => import("./pages/LoadBiddingAdvanced"));
const AccountingPage = lazy(() => import("./pages/AccountingPage"));
const InHouseFleet = lazy(() => import("./pages/InHouseFleet"));
const InspectionFormsPage = lazy(() => import("./pages/InspectionFormsPage"));
const VendorManagement = lazy(() => import("./pages/VendorManagement"));
const VendorSupplier = lazy(() => import("./pages/VendorSupplier"));
const CommissionEnginePage = lazy(() => import("./pages/CommissionEnginePage"));
const NewsfeedPage = lazy(() => import("./pages/NewsfeedPage"));
const ComplianceNetworksPage = lazy(() => import("./pages/ComplianceNetworksPage"));
// SuperAdminTools — DEPRECATED (Task 5.1.4), absorbed into SuperAdminDashboard
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage"));
const FacilitySearch = lazy(() => import("./pages/FacilitySearch"));
const FacilityProfile = lazy(() => import("./pages/FacilityProfile"));
const InboundDashboard = lazy(() => import("./pages/InboundDashboard"));
const DTNSyncDashboard = lazy(() => import("./pages/DTNSyncDashboard"));
const IntegrationsPortal = lazy(() => import("./pages/IntegrationsPortal"));
const AdvancedIntegrations = lazy(() => import("./pages/AdvancedIntegrations"));
// IntegrationKeys fused into IntegrationsPortal
const AccessorialManagement = lazy(() => import("./pages/AccessorialManagement"));
// ── Page Consolidation: 14 new tabbed parent pages ──────────────────────────
const SafetyCommandCenter = lazy(() => import("./pages/safety/SafetyCommandCenter"));
const IncidentManagement = lazy(() => import("./pages/safety/IncidentManagement"));
const SystemHealth = lazy(() => import("./pages/admin/SystemHealth"));
const PlatformOversight = lazy(() => import("./pages/admin/PlatformOversight"));
const ShippingPapersHub = lazy(() => import("./pages/compliance/ShippingPapers"));
const DriverQualification = lazy(() => import("./pages/compliance/DriverQualification"));
const RegulatoryIntelligence = lazy(() => import("./pages/compliance/RegulatoryIntelligence"));
const VehicleInspectionHub = lazy(() => import("./pages/driver/VehicleInspection"));
const EmergencyResponse = lazy(() => import("./pages/driver/EmergencyResponse"));
const DriverEarningsHub = lazy(() => import("./pages/driver/DriverEarnings"));
const TerminalHub = lazy(() => import("./pages/terminal/TerminalHub"));
const DockHub = lazy(() => import("./pages/terminal/DockHub"));
const FacilityHub = lazy(() => import("./pages/terminal/FacilityHub"));
const FleetHub = lazy(() => import("./pages/carrier/FleetHub"));
const ERGHub = lazy(() => import("./pages/hazmat/ERGHub"));
const IndustryVerticals = lazy(() => import("./pages/IndustryVerticals"));
// ── Phase 4: Intelligence Layer (Cross-Border, AI Ops, Infrastructure, Industry) ──
const DeveloperPortal = lazy(() => import("./pages/admin/DeveloperPortal"));
const ESANGOperations = lazy(() => import("./pages/admin/ESANGOperations"));
const UptimeDashboard = lazy(() => import("./pages/admin/UptimeDashboard"));
const IndustryProfiles = lazy(() => import("./pages/admin/IndustryProfiles"));
const DisasterResilience = lazy(() => import("./pages/admin/DisasterResilience"));
const ReportingDashboard = lazy(() => import("./pages/admin/ReportingDashboard"));
// ── Phase 5: Scale + Polish + Innovation (GAP-436 → GAP-451) ──
const Phase5CommandCenter = lazy(() => import("./pages/superadmin/Phase5CommandCenter"));
const HrWorkforce = lazy(() => import("./pages/HrWorkforce"));
// ── New Module Pages ─────────────────────────────────────────────────────────
const AdvancedFinancials = lazy(() => import("./pages/AdvancedFinancials"));
const AdvancedGamification = lazy(() => import("./pages/AdvancedGamification"));
const CompetitiveIntelligence = lazy(() => import("./pages/CompetitiveIntelligence"));
const DriverWellness = lazy(() => import("./pages/DriverWellness"));
const FleetMaintenance = lazy(() => import("./pages/FleetMaintenance"));
const FutureVision = lazy(() => import("./pages/FutureVision"));
const YardManagement = lazy(() => import("./pages/YardManagement"));
const DocumentManagement = lazy(() => import("./pages/DocumentManagement"));
const FreightClaims = lazy(() => import("./pages/FreightClaims"));
const CrossBorderShipping = lazy(() => import("./pages/CrossBorderShipping"));
const ReportingEngine = lazy(() => import("./pages/ReportingEngine"));
const RouteOptimizationPage = lazy(() => import("./pages/RouteOptimization"));
const BrokerManagementPage = lazy(() => import("./pages/BrokerManagement"));
const AssetTrackingPage = lazy(() => import("./pages/AssetTracking"));
const DetentionAccessorialsPage = lazy(() => import("./pages/DetentionAccessorials"));
const CommunicationHubPage = lazy(() => import("./pages/CommunicationHub"));
const DataMigrationPage = lazy(() => import("./pages/DataMigration"));
const SafetyRiskPage = lazy(() => import("./pages/SafetyRisk"));
const MultiModalPage = lazy(() => import("./pages/MultiModal"));
// ═══ V5 Multi-Modal: Rail Pages ═══
const RailDashboard = lazy(() => import("./pages/rail/RailDashboard"));
const RailShipmentCreate = lazy(() => import("./pages/rail/RailShipmentCreate"));
const RailShipments = lazy(() => import("./pages/rail/RailShipments"));
const RailShipmentDetail = lazy(() => import("./pages/rail/RailShipmentDetail"));
const RailTracking = lazy(() => import("./pages/rail/RailTracking"));
const RailYards = lazy(() => import("./pages/rail/RailYards"));
const RailCommandCenter = lazy(() => import("./pages/rail/RailCommandCenter"));
const RailConsists = lazy(() => import("./pages/rail/RailConsists"));
const RailCrewHOS = lazy(() => import("./pages/rail/RailCrewHOS"));
const RailCompliance = lazy(() => import("./pages/rail/RailCompliance"));
const RailFinancial = lazy(() => import("./pages/rail/RailFinancial"));
const RailCrew = lazy(() => import("./pages/rail/RailCrew"));
const RailSafety = lazy(() => import("./pages/rail/RailSafety"));
// ═══ V5 Multi-Modal: Vessel Pages ═══
const VesselDashboard = lazy(() => import("./pages/vessel/VesselDashboard"));
const VesselBookingCreate = lazy(() => import("./pages/vessel/VesselBookingCreate"));
const VesselBookings = lazy(() => import("./pages/vessel/VesselBookings"));
const VesselBookingDetail = lazy(() => import("./pages/vessel/VesselBookingDetail"));
const ContainerTracking = lazy(() => import("./pages/vessel/ContainerTracking"));
const PortDirectory = lazy(() => import("./pages/vessel/PortDirectory"));
const VesselFleet = lazy(() => import("./pages/vessel/VesselFleet"));
const CustomsDashboard = lazy(() => import("./pages/vessel/CustomsDashboard"));
const BillOfLading = lazy(() => import("./pages/vessel/BillOfLading"));
const VesselCompliance = lazy(() => import("./pages/vessel/VesselCompliance"));
const VesselFinancial = lazy(() => import("./pages/vessel/VesselFinancial"));
const VesselCrew = lazy(() => import("./pages/vessel/VesselCrew"));
const VesselSafety = lazy(() => import("./pages/vessel/VesselSafety"));
// ═══ V5 Multi-Modal: Intermodal Pages ═══
const IntermodalDashboard = lazy(() => import("./pages/intermodal/IntermodalDashboard"));
const IntermodalShipmentCreate = lazy(() => import("./pages/intermodal/IntermodalShipmentCreate"));
const IntermodalTracking = lazy(() => import("./pages/intermodal/IntermodalTracking"));
const IntermodalTransfers = lazy(() => import("./pages/intermodal/IntermodalTransfers"));

function Router() {
  // Role constants for route protection
  const ALL: UserRole[] = ["SHIPPER","CATALYST","BROKER","DRIVER","DISPATCH","ESCORT","TERMINAL_MANAGER","FACTORING","COMPLIANCE_OFFICER","SAFETY_MANAGER","ADMIN","SUPER_ADMIN","RAIL_SHIPPER","RAIL_CATALYST","RAIL_DISPATCHER","RAIL_ENGINEER","RAIL_CONDUCTOR","RAIL_BROKER","VESSEL_SHIPPER","VESSEL_OPERATOR","PORT_MASTER","SHIP_CAPTAIN","VESSEL_BROKER","CUSTOMS_BROKER"] as UserRole[];
  const SHIP: UserRole[] = ["SHIPPER","ADMIN","SUPER_ADMIN"];
  const CARR: UserRole[] = ["CATALYST","ADMIN","SUPER_ADMIN"];
  const BROK: UserRole[] = ["BROKER","ADMIN","SUPER_ADMIN"];
  const DRIV: UserRole[] = ["DRIVER","CATALYST","ADMIN","SUPER_ADMIN"];
  const DISP: UserRole[] = ["DISPATCH","ADMIN","SUPER_ADMIN"];
  const ESCT: UserRole[] = ["ESCORT","ADMIN","SUPER_ADMIN"];
  const TERM: UserRole[] = ["TERMINAL_MANAGER","ADMIN","SUPER_ADMIN"];
  const FACT: UserRole[] = ["FACTORING","ADMIN","SUPER_ADMIN"];
  const COMP: UserRole[] = ["COMPLIANCE_OFFICER","ADMIN","SUPER_ADMIN"];
  const SAFE: UserRole[] = ["SAFETY_MANAGER","ADMIN","SUPER_ADMIN"];
  const ADMN: UserRole[] = ["ADMIN","SUPER_ADMIN"];
  const SUPR: UserRole[] = ["SUPER_ADMIN"];
  const LOAD: UserRole[] = ["SHIPPER","CATALYST","BROKER","DRIVER","DISPATCH","ADMIN","SUPER_ADMIN"];
  const ELDR: UserRole[] = ["SHIPPER","CATALYST","BROKER","DRIVER","DISPATCH","ESCORT","TERMINAL_MANAGER","COMPLIANCE_OFFICER","SAFETY_MANAGER","ADMIN","SUPER_ADMIN"];
  // V5 Multi-Modal role groups
  const RAIL: UserRole[] = ["RAIL_SHIPPER","RAIL_CATALYST","RAIL_DISPATCHER","RAIL_ENGINEER","RAIL_CONDUCTOR","RAIL_BROKER","ADMIN","SUPER_ADMIN"] as UserRole[];
  const VESL: UserRole[] = ["VESSEL_SHIPPER","VESSEL_OPERATOR","PORT_MASTER","SHIP_CAPTAIN","VESSEL_BROKER","CUSTOMS_BROKER","ADMIN","SUPER_ADMIN"] as UserRole[];
  const PORT: UserRole[] = ["PORT_MASTER","ADMIN","SUPER_ADMIN"] as UserRole[];
  const CUST: UserRole[] = ["CUSTOMS_BROKER","ADMIN","SUPER_ADMIN"] as UserRole[];

  // Helper: wrap page in DashboardLayout + ProtectedRoute
  const guard = (roles: UserRole[], Page: React.ReactNode) => () => (
    <ProtectedRoute allowedRoles={roles}><DashboardLayout>{Page}</DashboardLayout></ProtectedRoute>
  );

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
    <Switch>
      {/* ============================================ */}
      {/* PUBLIC ROUTES (No Auth Required) */}
      {/* ============================================ */}
      <Route path={"/home"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password"} component={ResetPassword} />
      <Route path={"/register"} component={Register} />
      <Route path={"/register/shipper"} component={RegisterShipper} />
      <Route path={"/register/catalyst"} component={RegisterCatalyst} />
      <Route path={"/register/driver"} component={RegisterDriver} />
      <Route path={"/register/escort"} component={RegisterEscort} />
      <Route path={"/register/broker"} component={RegisterBroker} />
      <Route path={"/register/dispatch"} component={RegisterDispatch} />
      <Route path={"/register/terminal"} component={RegisterTerminal} />
      <Route path={"/register/compliance"} component={RegisterCompliance} />
      <Route path={"/register/safety"} component={RegisterSafety} />
      <Route path={"/register/admin"} component={RegisterAdmin} />
      <Route path={"/terms-of-service"} component={TermsOfService} />
      <Route path={"/privacy-policy"} component={PrivacyPolicy} />
      <Route path={"/validate/:token"} component={AccessValidation} />
      <Route path={"/portal"} component={() => <CustomerPortal />} />

      {/* ============================================ */}
      {/* SHARED ROUTES (All Authenticated Users) */}
      {/* ============================================ */}
      <Route path={"/"} component={guard(ALL, <Dashboard />)} />
      <Route path={"/profile"} component={guard(ALL, <ProfilePage />)} />
      <Route path={"/account-status"} component={guard(ALL, <AccountStatus />)} />
      <Route path={"/settings"} component={guard(ALL, <SettingsPage />)} />
      <Route path={"/messages"} component={guard(ALL, <MessagesPage />)} />
      <Route path={"/wallet"} component={guard([...SHIP, ...CARR, ...BROK, ...FACT, ...DRIV, ...DISP, ...ESCT, ...TERM, ...ADMN], <WalletPage />)} />
      <Route path={"/news"} component={guard(ALL, <NewsFeedPage />)} />
      <Route path={"/support"} component={guard(ALL, <SupportPage />)} />
      <Route path={"/company-channels"} component={guard(ALL, <CompanyChannels />)} />
      <Route path={"/notifications"} component={guard(ALL, <NotificationsCenter />)} />
      <Route path={"/esang"} component={guard(ALL, <ESANGChat />)} />
      <Route path={"/ai-assistant"} component={guard(ALL, <ESANGChat />)} />
      <Route path={"/erg"} component={guard(ALL, <ErgPage />)} />
      <Route path={"/missions"} component={guard(ALL, <Missions />)} />
      <Route path={"/partners"} component={guard(ALL, <MyPartners />)} />
      <Route path={"/live-tracking"} component={guard([...DRIV, ...CARR, ...DISP, ...SHIP, ...BROK, ...ADMN], <DriverTracking />)} />
      <Route path={"/fleet-tracking"} component={guard([...CARR, ...DISP, ...ADMN], <FleetTracking />)} />
      <Route path={"/location-intelligence"} component={guard(ALL, <LocationIntelligence />)} />
      <Route path={"/admin/telemetry"} component={guard(ADMN, <AdminTelemetry />)} />
      <Route path={"/admin/approvals"} component={guard(ADMN, <AdminApprovalQueue />)} />
      <Route path={"/zeun-breakdown"} component={guard([...CARR, ...DRIV, ...DISP, ...ADMN], <ZeunBreakdown />)} />
      <Route path={"/zeun-fleet"} component={guard([...CARR, ...DISP, ...ADMN], <ZeunFleetDashboard />)} />
      <Route path={"/admin/zeun"} component={guard(ADMN, <ZeunAdminDashboard />)} />
      <Route path={"/eld"} component={guard(ELDR, <ELDIntegrationPage />)} />
      <Route path={"/hot-zones"} component={guard([...DRIV, ...CARR, ...DISP, ...SAFE, ...ADMN], <HotZones />)} />
      <Route path={"/ratings"} component={guard(ALL, <RatingsReviews />)} />
      <Route path={"/claims"} component={guard([...SHIP, ...CARR, ...BROK, ...FACT, ...DISP, ...ADMN], <ClaimsPage />)} />
      <Route path={"/market-pricing"} component={guard([...SHIP, ...CARR, ...BROK, ...DISP, ...ADMN], <MarketPricing />)} />
      <Route path={"/market-intelligence"} component={guard([...SHIP, ...CARR, ...BROK, ...DISP, ...ADMN], <MarketIntelligence2026 />)} />
      <Route path={"/authority"} component={guard([...CARR, ...DRIV, ...BROK, ...DISP, ...ESCT], <OperatingAuthority />)} />
      {/* Gold Standard: Shared auth, settings & cross-role compliance */}
      <Route path={"/settings/change-password"} component={guard(ALL, <ChangePasswordPage />)} />
      <Route path={"/settings/2fa-setup"} component={guard(ALL, <TwoFactorSetupPage />)} />
      <Route path={"/settings/2fa"} component={guard(ALL, <TwoFactorAuthPage />)} />
      <Route path={"/settings/sessions"} component={guard(ALL, <SessionMgmtPage />)} />
      <Route path={"/bol-management"} component={guard([...SHIP, ...CARR, ...BROK, ...DRIV, ...DISP, ...TERM, ...COMP, ...ADMN], <ShippingPapersHub />)} />
      <Route path={"/rate-sheet"} component={guard([...SHIP, ...CARR, ...BROK, ...DISP, ...FACT, ...ADMN], <RateSheetReconciliation />)} />
      <Route path={"/pod"} component={guard([...SHIP, ...CARR, ...BROK, ...DRIV, ...DISP, ...TERM, ...ADMN], <PODManagementPage />)} />
      <Route path={"/erg/guide"} component={guard(ALL, <ERGGuidePage />)} />
      <Route path={"/erg/lookup"} component={guard(ALL, <ERGLookupPage />)} />
      <Route path={"/fmcsa-lookup"} component={guard([...CARR, ...BROK, ...COMP, ...SHIP], <SAFERLookupPage />)} />
      <Route path={"/carrier-intelligence"} component={guard(ELDR, <FMCSACarrierIntelligencePage />)} />
      <Route path={"/hazmat/certifications"} component={guard([...DRIV, ...CARR, ...COMP, ...SAFE, ...ADMN], <HazmatComplianceHub />)} />
      <Route path={"/insurance"} component={guard([...CARR, ...BROK, ...COMP, "ESCORT"], <InsuranceMgmtPage />)} />
      <Route path={"/insurance/per-load"} component={guard([...CARR, ...SHIP, ...BROK], <PerLoadInsurance />)} />
      <Route path={"/insurance/verification"} component={guard([...CARR, ...BROK, ...COMP, ...SHIP, ...DRIV, "ESCORT", "DISPATCH"], <InsuranceVerification />)} />
      <Route path={"/equipment-intelligence"} component={guard([...CARR, ...BROK, ...COMP, ...SHIP], <EquipmentIntelligence />)} />
      <Route path={"/inspections"} component={guard([...CARR, ...COMP, ...SAFE], <VehicleInspectionsPage />)} />
      <Route path={"/report-builder"} component={guard([...CARR, ...BROK, ...COMP, ...SAFE, ...ADMN], <ReportBuilderPage />)} />
      {/* Gold Standard Gap Audit: 18 missing routes wired */}
      <Route path={"/help"} component={guard(ALL, <HelpCenter />)} />
      <Route path={"/settings/notifications"} component={guard(ALL, <NotificationSettings />)} />
      <Route path={"/achievements"} component={guard(ALL, <AchievementsBadges />)} />
      <Route path={"/quick-actions"} component={guard(ALL, <QuickActions />)} />
      <Route path={"/hazmat/shipments"} component={guard([...CARR, ...SHIP, ...BROK, ...COMP, ...SAFE, ...ADMN], <HazmatShipments />)} />
      <Route path={"/settings/billing"} component={guard([...CARR, ...SHIP, ...BROK], <BillingSettings />)} />
      <Route path={"/utilization"} component={guard([...CARR, ...COMP, ...ADMN], <UtilizationReport />)} />
      <Route path={"/expenses"} component={guard([...CARR, ...DRIV, "ESCORT"], <ExpenseReports />)} />

      {/* ============================================ */}
      {/* SHIPPER ROUTES */}
      {/* ============================================ */}
      <Route path={"/loads/create"} component={guard([...SHIP, "BROKER", "DISPATCH", "TERMINAL_MANAGER"], <LoadCreationWizard />)} />
      <Route path={"/loads/active"} component={guard(LOAD, <MyLoadsPage />)} />
      <Route path={"/loads/recurring"} component={guard(SHIP, <RecurringLoadScheduler />)} />
      <Route path={"/loads/templates"} component={guard([...SHIP, "BROKER", "DISPATCH"], <LoadTemplates />)} />
      <Route path={"/loads/:id"} component={guard(LOAD, <LoadDetails />)} />
      <Route path={"/loads"} component={guard(LOAD, <MyLoadsPage />)} />
      <Route path={"/tracking"} component={guard(LOAD, <ShipperDispatchControl />)} />
      <Route path={"/catalysts"} component={guard([...SHIP, "BROKER"], <CatalystsPage />)} />
      <Route path={"/payments"} component={guard([...SHIP, ...CARR, ...BROK, ...FACT, ...DRIV, ...DISP, ...ESCT, ...TERM, ...ADMN], <WalletPage />)} />
      <Route path={"/company"} component={guard([...LOAD, "ESCORT"], <CompanyProfile />)} />
      <Route path={"/agreements/create"} component={guard([...LOAD, "TERMINAL_MANAGER", "ESCORT"], <ShipperAgreementWizard />)} />
      <Route path={"/agreements/broker"} component={guard([...BROK, "SHIPPER"], <BrokerContractWizard />)} />
      <Route path={"/agreements/:id"} component={guard([...LOAD, "TERMINAL_MANAGER", "ESCORT"], <AgreementDetail />)} />
      <Route path={"/agreements"} component={guard([...LOAD, "TERMINAL_MANAGER", "ESCORT"], <AgreementsLibrary />)} />
      <Route path={"/shipper/dispatch"} component={guard(SHIP, <ShipperDispatchControl />)} />
      <Route path={"/shipper/compliance"} component={guard(SHIP, <ShipperCompliancePage />)} />
      <Route path={"/quotes"} component={guard([...SHIP, ...BROK], <QuoteMgmtPage />)} />
      <Route path={"/payment-history"} component={guard([...SHIP, ...CARR, ...BROK], <PaymentHistoryPage />)} />

      {/* ============================================ */}
      {/* CATALYST ROUTES */}
      {/* ============================================ */}
      <Route path={"/marketplace"} component={guard([...CARR, "BROKER", "DRIVER", "DISPATCH"], <FindLoadsPage />)} />
      <Route path={"/bids"} component={guard([...CARR, "BROKER", "DRIVER", "DISPATCH", "ESCORT"], <BidManagement />)} />
      <Route path={"/bids/submit/:loadId"} component={guard([...CARR, "DISPATCH"], <CatalystBidSubmission />)} />
      <Route path={"/bids/:bidId"} component={guard([...CARR, "DISPATCH"], <BidDetails />)} />
      <Route path={"/contract/sign/:loadId"} component={guard([...CARR, "DISPATCH"], <ContractSigning />)} />
      <Route path={"/loads/assigned"} component={guard([...CARR, "DRIVER", "DISPATCH", "ESCORT"], <MyLoadsPage />)} />
      <Route path={"/loads/transit"} component={guard([...CARR, "DRIVER"], <MyLoadsPage />)} />
      <Route path={"/loads/:loadId/bids"} component={guard(LOAD, <LoadBids />)} />
      <Route path={"/load/:loadId"} component={guard(LOAD, <LoadDetails />)} />
      <Route path={"/loads/:loadId"} component={guard(LOAD, <LoadDetails />)} />
      <Route path={"/fleet"} component={guard([...CARR, "DISPATCH"], <FleetCommandCenter />)} />
      <Route path={"/fleet-management"} component={guard(CARR, <FleetCommandCenter />)} />
      <Route path={"/driver/management"} component={guard(CARR, <FleetCommandCenter />)} />
      <Route path={"/drivers"} component={guard(CARR, <FleetCommandCenter />)} />
      <Route path={"/earnings"} component={guard([...CARR, "DRIVER", "DISPATCH", "ESCORT"], <WalletPage />)} />
      <Route path={"/analytics"} component={guard([...CARR, "BROKER"], <Analytics />)} />
      <Route path={"/hr"} component={guard([...CARR, ...ADMN], <HrWorkforce />)} />
      <Route path={"/hr-workforce"} component={guard([...CARR, ...ADMN], <HrWorkforce />)} />
      <Route path={"/equipment"} component={guard(CARR, <EquipmentMgmtPage />)} />
      <Route path={"/invoices"} component={guard([...CARR, ...SHIP, ...BROK, "ESCORT"], <InvoiceMgmtPage />)} />
      <Route path={"/revenue"} component={guard([...CARR, ...BROK], <RevenueAnalyticsPage />)} />
      <Route path={"/settlements/batching"} component={guard([...CARR, ...DISP, ...SHIP, "BROKER"], <SettlementBatching />)} />
      <Route path={"/settlements"} component={guard([...CARR, ...DISP, ...SHIP, "BROKER"], <SettlementStatementsPage />)} />
      <Route path={"/maintenance"} component={guard(CARR, <MaintenanceSchedulePage />)} />
      <Route path={"/compliance/ifta"} component={guard([...CARR, ...COMP], <IFTAReportingPage />)} />
      <Route path={"/permits"} component={guard([...CARR, ...COMP], <PermitMgmtPage />)} />
      <Route path={"/compliance/mvr"} component={guard([...CARR, ...COMP], <MVRReportsPage />)} />
      <Route path={"/compliance/drug-alcohol"} component={guard([...SAFE, ...COMP, ...CARR], <DrugAlcoholTestingPage />)} />
      {/* @deprecated — redirected to consolidated DriverHOS (Task 6.1.2) */}
      <Route path="/hos-compliance"><Redirect to="/hos" /></Route>
      <Route path={"/on-time"} component={guard([...DISP, ...CARR, ...SHIP], <OnTimePerformancePage />)} />

      {/* ============================================ */}
      {/* BROKER ROUTES */}
      {/* ============================================ */}
      <Route path={"/shippers"} component={guard(BROK, <ShippersPage />)} />
      <Route path={"/commission"} component={guard(BROK, <CommissionPage />)} />
      <Route path={"/catalyst-vetting"} component={guard(BROK, <CatalystVetting />)} />
      <Route path={"/catalyst/:catalystId"} component={guard(BROK, <CatalystVettingDetails />)} />
      <Route path={"/broker/compliance"} component={guard(BROK, <BrokerCompliancePage />)} />
      <Route path={"/lane-analysis"} component={guard([...BROK, ...CARR], <LaneAnalysisPage />)} />
      <Route path={"/capacity-planning"} component={guard([...BROK, ...CARR, ...DISP], <CapacityPlanningPage />)} />

      {/* ============================================ */}
      {/* DRIVER ROUTES */}
      {/* ============================================ */}
      <Route path={"/hos"} component={guard(DRIV, <DriverHOS />)} />
      <Route path={"/jobs"} component={guard(DRIV, <JobsPage />)} />
      <Route path={"/jobs/current"} component={guard(DRIV, <DriverCurrentJob />)} />
      <Route path={"/navigation"} component={guard(DRIV, <LoadTracking />)} />
      <Route path={"/vehicle"} component={guard(DRIV, <DriverVehicle />)} />
      <Route path={"/diagnostics"} component={guard(DRIV, <DiagnosticsPage />)} />
      <Route path={"/documents"} component={guard(ALL, <DocumentCenter />)} />
      <Route path={"/driver/hos"} component={guard(DRIV, <HOSTracker />)} />
      <Route path={"/driver/current-job"} component={guard(DRIV, <DriverCurrentJob />)} />
      <Route path={"/driver/vehicle"} component={guard(DRIV, <DriverVehicle />)} />
      <Route path={"/driver/onboarding"} component={guard(DRIV, <DriverOnboarding />)} />
      <Route path={"/inspection/pre-trip"} component={guard(DRIV, <PreTripInspection />)} />
      <Route path={"/inspection/dvir"} component={guard(DRIV, <DVIR />)} />
      <Route path={"/eld"} component={guard(DRIV, <ELDLogs />)} />
      {/* @deprecated — redirected to consolidated DriverSafetyScorecard (Task 6.1.1) */}
      <Route path="/driver-scorecard"><Redirect to="/driver/safety-score" /></Route>
      <Route path="/driver-scorecard/:driverId"><Redirect to="/driver/safety-score" /></Route>
      <Route path={"/rewards"} component={guard(ALL, <Rewards />)} />
      <Route path={"/leaderboard"} component={guard(ALL, <Leaderboard />)} />
      <Route path={"/fuel"} component={guard(DRIV, <FuelManagement />)} />
      <Route path={"/driver/cdl-verification"} component={guard(DRIV, <CDLVerification />)} />
      <Route path={"/driver/placard-verification"} component={guard(DRIV, <PlacardVerification />)} />
      <Route path={"/driver/shipping-papers"} component={guard(DRIV, <ShippingPapers />)} />
      <Route path={"/driver/spill-response"} component={guard(DRIV, <SpillResponse />)} />
      <Route path={"/driver/evacuation-distance"} component={guard(DRIV, <EvacuationDistance />)} />
      <Route path={"/driver/hazmat-endorsement"} component={guard(DRIV, <HazmatComplianceHub />)} />
      <Route path={"/driver/twic-card"} component={guard(DRIV, <TWICCard />)} />
      <Route path={"/driver/drug-test"} component={guard(DRIV, <DrugTestAcknowledgment />)} />
      <Route path={"/hazmat/segregation-rules"} component={guard([...DRIV, ...CARR, ...DISP, ...COMP, ...SAFE, ...TERM, ...ADMN], <SegregationRules />)} />
      <Route path={"/hazmat/fire-response"} component={guard([...DRIV, ...CARR, ...DISP, ...COMP, ...SAFE, ...TERM, ...ADMN], <FireResponse />)} />
      <Route path={"/hazmat/incident-report"} component={guard([...DRIV, ...CARR, ...DISP, ...COMP, ...SAFE, ...TERM, ...ADMN], <IncidentReportForm />)} />
      <Route path={"/driver/trip-pay"} component={guard(DRIV, <TripPay />)} />
      <Route path={"/driver/settlement-history"} component={guard(DRIV, <SettlementHistory />)} />
      <Route path={"/driver/deductions"} component={guard(DRIV, <DeductionsBreakdown />)} />
      <Route path={"/driver/bonus-tracker"} component={guard(DRIV, <BonusTracker />)} />
      <Route path={"/driver/direct-deposit"} component={guard(DRIV, <DirectDeposit />)} />
      <Route path={"/driver/availability"} component={guard(DRIV, <DriverAvailability />)} />
      <Route path={"/hazmat/placard-guide"} component={guard([...DRIV, ...CARR, ...DISP, ...COMP, ...SAFE, ...TERM, ...ADMN], <PlacardGuide />)} />
      <Route path={"/emergency-alerts"} component={guard(ALL, <EmergencyNotification />)} />
      <Route path={"/emergency-protocols"} component={guard(ALL, <EmergencyProtocols />)} />
      <Route path={"/settings/language"} component={guard(ALL, <LanguageSettings />)} />
      <Route path={"/settings/privacy"} component={guard(ALL, <PrivacySettings />)} />
      <Route path={"/hazmat/nrc-report"} component={guard([...DRIV, ...CARR, ...COMP, ...SAFE, ...ADMN], <NRCReport />)} />
      <Route path={"/hazmat/dot-5800"} component={guard([...DRIV, ...CARR, ...COMP, ...SAFE, ...ADMN], <DOT5800Form />)} />
      <Route path={"/hazmat/security-plan"} component={guard([...DRIV, ...CARR, ...COMP, ...SAFE, ...ADMN], <SecurityPlan />)} />
      <Route path={"/hazmat/registration"} component={guard([...DRIV, ...CARR, ...COMP, ...SAFE, ...ADMN], <HazmatComplianceHub />)} />
      <Route path={"/hazmat/corrective-actions"} component={guard([...DRIV, ...CARR, ...COMP, ...SAFE, ...ADMN], <CorrectiveActions />)} />
      <Route path={"/hazmat/regulatory-updates"} component={guard([...DRIV, ...CARR, ...COMP, ...SAFE, ...ADMN], <RegulatoryUpdates />)} />
      <Route path={"/hazmat/tank-valve"} component={guard([...DRIV, ...CARR, ...COMP, ...SAFE, ...TERM, ...ADMN], <TankValve />)} />
      <Route path={"/hazmat/tank-pressure"} component={guard([...DRIV, ...CARR, ...COMP, ...SAFE, ...TERM, ...ADMN], <TankPressure />)} />
      <Route path={"/hazmat/cryogenic-tank"} component={guard([...DRIV, ...CARR, ...COMP, ...SAFE, ...TERM, ...ADMN], <CryogenicTank />)} />
      <Route path={"/hazmat/liquid-tank"} component={guard([...DRIV, ...CARR, ...COMP, ...SAFE, ...TERM, ...ADMN], <LiquidTankInspection />)} />
      <Route path={"/hazmat/pressurized-tank"} component={guard([...DRIV, ...CARR, ...COMP, ...SAFE, ...TERM, ...ADMN], <PressurizedTankInspection />)} />
      <Route path={"/driver/flatbed-securement"} component={guard(DRIV, <FlatbedSecurement />)} />
      <Route path={"/driver/hopper-inspection"} component={guard(DRIV, <HopperInspection />)} />
      <Route path={"/driver/voice-messages"} component={guard(DRIV, <VoiceMessaging />)} />
      <Route path={"/dispatch/emergency-broadcast"} component={guard(DISP, <EmergencyBroadcast />)} />
      <Route path={"/dispatch/broadcast"} component={guard(DISP, <BroadcastMessages />)} />
      <Route path={"/driver/profile-setup"} component={guard(DRIV, <ProfileSetup />)} />
      <Route path={"/driver/today"} component={guard(DRIV, <TodaySchedule />)} />
      <Route path={"/hazmat/driver-filter"} component={guard(DISP, <HazmatDriverFilter />)} />
      <Route path={"/hazmat/equipment-filter"} component={guard(DISP, <HazmatEquipmentFilter />)} />
      <Route path={"/hazmat/route-restrictions"} component={guard([...DRIV, ...CARR, ...DISP, ...COMP, ...SAFE, ...ADMN], <HazmatRouteRestriction />)} />
      <Route path={"/hazmat/route-compliance"} component={guard([...DRIV, ...CARR, ...DISP, ...COMP, ...SAFE, ...ADMN], <HazmatComplianceHub />)} />
      <Route path={"/hazmat/check-in"} component={guard(DRIV, <HazmatCheckIn />)} />
      <Route path={"/hazmat/dock-assignment"} component={guard(DRIV, <DockAssignment />)} />
      <Route path={"/hazmat/loading-status"} component={guard(DRIV, <LoadingUnloadingStatus />)} />
      <Route path={"/driver/background-checks"} component={guard(DRIV, <BackgroundChecks />)} />
      <Route path={"/driver/medical-cert"} component={guard(DRIV, <MedicalCertsPage />)} />
      <Route path={"/driver/dvir-history"} component={guard(DRIV, <DVIRManagementPage />)} />
      <Route path={"/driver/navigation"} component={guard(DRIV, <DriverNavPage />)} />
      <Route path={"/driver/safety-score"} component={guard(DRIV, <DriverSafetyScorecardPage />)} />
      <Route path={"/driver/eld-transfer"} component={guard(DRIV, <ELDIntegrationPage />)} />
      <Route path={"/loads/history"} component={guard(LOAD, <LoadHistoryPage />)} />
      <Route path={"/rest-stops"} component={guard(DRIV, <RestStopsPage />)} />
      <Route path={"/traffic"} component={guard([...DRIV, ...DISP], <TrafficConditionsPage />)} />
      <Route path={"/route-planning"} component={guard([...DRIV, ...DISP, ...CARR], <RoutePlanningPage />)} />
      <Route path={"/tax-documents"} component={guard([...DRIV, ...CARR], <TaxDocumentsPage />)} />
      <Route path={"/scale-locations"} component={guard(DRIV, <ScaleLocationsPage />)} />
      <Route path={"/driver/reefer-temp"} component={guard(DRIV, <ReeferTemperatureLog />)} />

      {/* ============================================ */}
      {/* DISPATCH (DISPATCHER) ROUTES */}
      {/* ============================================ */}
      <Route path={"/dispatch/eld"} component={guard(DISP, <DispatchELDIntelligence />)} />
      <Route path={"/dispatch/assigned"} component={guard(DISP, <DispatchAssignedLoads />)} />
      <Route path={"/dispatch/planner"} component={guard(DISP, <DispatchPlanner />)} />
      <Route path={"/dispatch/allocations"} component={guard([...DISP, ...SHIP, "TERMINAL_MANAGER", "ADMIN"], <AllocationDashboard />)} />
      <Route path={"/dispatch/bulk-import"} component={guard([...DISP, ...SHIP, "BROKER", "ADMIN"], <BulkImport />)} />
      <Route path={"/dispatch/pricebook"} component={guard([...DISP, ...SHIP, "BROKER", "ADMIN"], <Pricebook />)} />
      <Route path={"/dispatch/fsc-engine"} component={guard([...DISP, ...SHIP, "BROKER", "ADMIN"], <FSCEngine />)} />
      <Route path={"/admin/portal"} component={guard(ADMN, <PortalManagement />)} />
      <Route path={"/dispatch"} component={guard(DISP, <DispatchCommandCenter />)} />
      <Route path={"/dispatch/board"} component={guard(DISP, <DispatchBoard />)} />
      <Route path={"/specializations"} component={guard(DISP, <Specializations />)} />
      <Route path={"/matched-loads"} component={guard(DISP, <MatchedLoads />)} />
      <Route path={"/opportunities"} component={guard(DISP, <Opportunities />)} />
      <Route path={"/performance"} component={guard(DISP, <DispatchPerformance />)} />
      <Route path={"/dispatch/fleet-map"} component={guard(DISP, <DispatchFleetMap />)} />
      <Route path={"/dispatch/exceptions"} component={guard(DISP, <DispatchExceptions />)} />
      <Route path={"/dispatch/drivers"} component={guard(DISP, <DispatchCommandCenter />)} />
      <Route path={"/dispatch/create"} component={guard(DISP, <LoadCreationWizard quickMode={true} />)} />
      <Route path={"/load-board"} component={guard([...DISP, "BROKER"], <LoadBoard />)} />

      {/* ============================================ */}
      {/* ESCORT ROUTES */}
      {/* ============================================ */}
      <Route path={"/escort"} component={guard(ESCT, <EscortDashboard />)} />
      <Route path={"/escort/active-trip"} component={guard(ESCT, <EscortActiveTrip />)} />
      <Route path={"/escort/profile"} component={guard(ESCT, <EscortProfile />)} />
      <Route path={"/convoys"} component={guard(ESCT, <ActiveConvoys />)} />
      <Route path={"/team"} component={guard(ESCT, <EscortTeam />)} />
      <Route path={"/escort/incidents"} component={guard(ESCT, <EscortIncidents />)} />
      {/* @deprecated — redirected to consolidated EscortEarnings (Task 6.2.2) */}
      <Route path="/escort/reports"><Redirect to="/escort/earnings" /></Route>
      <Route path={"/escort/jobs"} component={guard(ESCT, <EscortJobs />)} />
      <Route path={"/escort/marketplace"} component={guard(ESCT, <EscortJobMarketplace />)} />
      {/* @deprecated — redirected to consolidated EscortCertifications (Task 6.2.1) */}
      <Route path="/escort/permits"><Redirect to="/escort/certifications" /></Route>
      <Route path={"/escort/schedule"} component={guard(ESCT, <EscortSchedule />)} />
      <Route path={"/escort/earnings"} component={guard(ESCT, <EscortEarnings />)} />
      <Route path={"/escort/certifications"} component={guard(ESCT, <EscortCertifications />)} />

      {/* ============================================ */}
      {/* TERMINAL MANAGER ROUTES */}
      {/* ============================================ */}
      <Route path={"/terminal"} component={guard(TERM, <TerminalDashboard />)} />
      <Route path={"/facility"} component={guard([...TERM, ...SHIP], <FacilityPage />)} />
      <Route path={"/incoming"} component={guard(TERM, <IncomingShipments />)} />
      <Route path={"/outgoing"} component={guard(TERM, <OutgoingShipments />)} />
      <Route path={"/staff"} component={guard([...TERM, ...SHIP, ...BROK], <TerminalStaff />)} />
      <Route path={"/operations"} component={guard(TERM, <TerminalOperations />)} />
      <Route path={"/terminal/scheduling"} component={guard(TERM, <TerminalScheduling />)} />
      <Route path={"/terminal/scada"} component={guard(TERM, <TerminalSCADA />)} />
      <Route path={"/terminal/appointments"} component={guard(TERM, <TerminalAppointments />)} />
      <Route path={"/appointments"} component={guard(TERM, <TerminalAppointments />)} />
      <Route path={"/gate"} component={guard(TERM, <GateOperations />)} />
      <Route path={"/docks"} component={guard(TERM, <DockManagement />)} />
      <Route path={"/terminal/create-load"} component={guard(TERM, <TerminalCreateLoad />)} />
      <Route path={"/terminal/reports"} component={guard(TERM, <TerminalOperations />)} />
      <Route path={"/loading-bays"} component={guard(TERM, <LoadingBays />)} />
      <Route path={"/terminal-inventory"} component={guard(TERM, <TerminalInventory />)} />
      <Route path={"/bol"} component={guard(TERM, <ShippingPapersHub />)} />
      <Route path={"/supply-chain"} component={guard(TERM, <TerminalPartners />)} />
      <Route path={"/my-terminals"} component={guard([...SHIP, ...CARR, ...BROK], <MyTerminals />)} />
      <Route path={"/spectra-match"} component={guard(TERM, <SpectraMatch />)} />
      <Route path={"/detention"} component={guard([...TERM, ...CARR, ...SHIP], <DetentionTrackingPage />)} />
      <Route path={"/relay"} component={guard([...TERM, ...CARR, ...SHIP, ...DISP], <RelayModePage />)} />
      <Route path={"/predictive-pricing"} component={guard([...SHIP, ...CARR, ...BROK, ...DISP], <PredictiveLoadPricingPage />)} />
      <Route path={"/accessorials"} component={guard([...TERM, ...CARR, ...SHIP, ...DISP, ...ADMN], <AccessorialManagement />)} />
      <Route path={"/euso-ticket"} component={guard(TERM, <EusoTicket />)} />
      <Route path={"/run-tickets"} component={guard(TERM, <EusoTicket />)} />
      <Route path={"/inbound"} component={guard(TERM, <InboundDashboard />)} />
      <Route path={"/integrations"} component={guard(TERM, <IntegrationsPortal />)} />
      {/* integration-keys fused into /integrations */}
      <Route path={"/dtn-sync"} component={guard(TERM, <DTNSyncDashboard />)} />
      <Route path={"/facility-search"} component={guard(ALL, <FacilitySearch />)} />
      <Route path={"/facility/:id"} component={guard(ALL, <FacilityProfile />)} />

      {/* ============================================ */}
      {/* FACTORING ROUTES */}
      {/* ============================================ */}
      <Route path={"/factoring"} component={guard(FACT, <FactoringDashboardPage />)} />
      <Route path={"/factoring/invoices"} component={guard(FACT, <FactoringInvoicesPage />)} />
      <Route path={"/factoring/catalysts"} component={guard(FACT, <FactoringCatalystsPage />)} />
      <Route path={"/factoring/collections"} component={guard(FACT, <FactoringCollectionsPage />)} />
      <Route path={"/factoring/funding"} component={guard(FACT, <FactoringFundingPage />)} />
      <Route path={"/factoring/risk"} component={guard(FACT, <FactoringRiskPage />)} />
      <Route path={"/factoring/aging"} component={guard(FACT, <FactoringAgingPage />)} />
      <Route path={"/factoring/chargebacks"} component={guard(FACT, <FactoringChargebacksPage />)} />
      <Route path={"/factoring/debtors"} component={guard(FACT, <FactoringDebtorsPage />)} />
      <Route path={"/factoring/reports"} component={guard(FACT, <FactoringReportsPage />)} />
      <Route path={"/factoring/settings"} component={guard(FACT, <SettingsPage />)} />

      {/* ============================================ */}
      {/* COMPLIANCE OFFICER ROUTES */}
      {/* ============================================ */}
      <Route path={"/compliance"} component={guard(COMP, <ComplianceDashboard />)} />
      <Route path={"/compliance/dq-files"} component={guard(COMP, <DQFileManagement />)} />
      <Route path={"/compliance/calendar"} component={guard(COMP, <ComplianceCalendar />)} />
      <Route path={"/compliance/clearinghouse"} component={guard(COMP, <ClearinghouseDashboard />)} />
      <Route path={"/compliance/eld"} component={guard(COMP, <ELDLogs />)} />
      <Route path={"/violations"} component={guard(COMP, <Violations />)} />
      <Route path={"/audits"} component={guard(COMP, <Audits />)} />
      <Route path={"/fleet-compliance"} component={guard(COMP, <FleetOverview />)} />
      <Route path={"/driver-compliance"} component={guard(COMP, <DriverPerformance />)} />
      <Route path={"/compliance/reports"} component={guard(COMP, <Audits />)} />
      <Route path={"/compliance/inspections"} component={guard(COMP, <VehicleInspectionsPage />)} />

      {/* ============================================ */}
      {/* SAFETY MANAGER ROUTES */}
      {/* ============================================ */}
      <Route path={"/safety"} component={guard(SAFE, <SafetyDashboard />)} />
      <Route path={"/safety-metrics"} component={guard(SAFE, <SafetyMetrics />)} />
      <Route path={"/safety/incidents"} component={guard(SAFE, <SafetyIncidents />)} />
      <Route path={"/safety/csa-scores"} component={guard(SAFE, <CSAScoresDashboard />)} />
      <Route path={"/safety/driver-performance"} component={guard(SAFE, <DriverPerformance />)} />
      <Route path={"/driver-health"} component={guard(SAFE, <DriverPerformance />)} />
      <Route path={"/vehicle-safety"} component={guard(SAFE, <FleetOverview />)} />
      <Route path={"/training"} component={guard(SAFE, <TrainingManagement />)} />
      <Route path={"/hazmat"} component={guard(SAFE, <ErgPage />)} />
      <Route path={"/incidents"} component={guard(SAFE, <IncidentReport />)} />
      <Route path={"/accident-report"} component={guard(SAFE, <AccidentReport />)} />
      <Route path={"/safety/meetings"} component={guard(SAFE, <SafetyMeetingsPage />)} />
      <Route path={"/safety/programs"} component={guard(SAFE, <SafetyDashboard />)} />
      <Route path={"/safety/training"} component={guard(SAFE, <TrainingManagement />)} />
      <Route path="/training-compliance" component={guard([...DRIV, ...CARR, ...DISP, ...SAFE, ...COMP, ...ADMN], <TrainingCompliance />)} />
      <Route path="/training-lms" component={guard([...DRIV, ...CARR, ...DISP, ...SAFE, ...COMP, ...ADMN], <TrainingLMS />)} />
      <Route path={"/safety/inspections"} component={guard([...SAFE, ...COMP, ...CARR], <VehicleInspectionsPage />)} />
      <Route path={"/safety/scores"} component={guard(SAFE, <CSAScoresDashboard />)} />
      <Route path={"/safety/drug-testing"} component={guard([...SAFE, ...COMP, ...CARR], <DrugAlcoholTestingPage />)} />
      <Route path={"/safety/reports"} component={guard(SAFE, <SafetyMetrics />)} />

      {/* ============================================ */}
      {/* ADMIN ROUTES */}
      {/* ============================================ */}
      <Route path={"/admin"} component={guard(ADMN, <AdminDashboard />)} />
      <Route path={"/admin/users"} component={guard(ADMN, <UserManagement />)} />
      <Route path={"/admin/companies"} component={guard(ADMN, <CompanyPage />)} />
      <Route path={"/admin/loads"} component={guard(ADMN, <MyLoadsPage />)} />
      <Route path={"/admin/payments"} component={guard(ADMN, <WalletPage />)} />
      <Route path={"/admin/disputes"} component={guard(ADMN, <MessagingCenter />)} />
      <Route path={"/admin/documents"} component={guard(ADMN, <DocumentCenter />)} />
      <Route path={"/admin/analytics"} component={guard(ADMN, <Analytics />)} />
      <Route path={"/admin/settings"} component={guard(ADMN, <SettingsPage />)} />
      <Route path={"/admin/verification"} component={guard(ADMN, <UserVerification />)} />
      <Route path={"/admin/audit-logs"} component={guard(ADMN, <AuditLogs />)} />
      <Route path={"/admin/rss-feeds"} component={guard(ADMN, <AdminRSSFeeds />)} />
      <Route path={"/admin/platform-fees"} component={guard(ADMN, <AdminPlatformFees />)} />
      <Route path={"/admin/feature-flags"} component={guard(ADMN, <SystemConfigurationHub />)} />
      <Route path={"/admin/system-config"} component={guard(ADMN, <SystemConfigurationHub />)} />
      <Route path={"/admin/roles"} component={guard(ADMN, <RolePermissionsPage />)} />
      <Route path={"/admin/support-tickets"} component={guard(ADMN, <SupportTickets />)} />
      <Route path={"/admin/rates"} component={guard(ADMN, <RateManagement />)} />
      <Route path={"/admin/api"} component={guard(ADMN, <APIManagement />)} />
      <Route path={"/admin/integrations"} component={guard(ADMN, <IntegrationSettings />)} />
      <Route path={"/admin/advanced-integrations"} component={guard(ADMN, <AdvancedIntegrations />)} />
      <Route path={"/admin/sync"} component={guard(ADMN, <SyncDashboard />)} />
      {/* Phase 4: Intelligence Layer */}
      <Route path={"/admin/developer-portal"} component={guard(ADMN, <DeveloperPortal />)} />
      <Route path={"/admin/esang-operations"} component={guard(ADMN, <ESANGOperations />)} />
      <Route path={"/admin/uptime"} component={guard(ADMN, <UptimeDashboard />)} />
      <Route path={"/admin/industry-profiles"} component={guard(ADMN, <IndustryProfiles />)} />
      <Route path={"/admin/disaster-resilience"} component={guard(ADMN, <DisasterResilience />)} />
      <Route path={"/admin/reporting"} component={guard(ADMN, <ReportingDashboard />)} />

      {/* ============================================ */}
      {/* SUPER ADMIN ROUTES */}
      {/* ============================================ */}
      <Route path={"/super-admin"} component={guard(SUPR, <SuperAdminDashboard />)} />
      <Route path={"/super-admin/users"} component={guard(SUPR, <UserManagement />)} />
      <Route path={"/super-admin/companies"} component={guard(SUPR, <CompanyPage />)} />
      <Route path={"/super-admin/loads"} component={guard(SUPR, <PlatformOversight />)} />
      <Route path={"/super-admin/agreements"} component={guard(SUPR, <PlatformAgreementsOversight />)} />
      <Route path={"/super-admin/claims"} component={guard(SUPR, <PlatformOversight />)} />
      <Route path={"/super-admin/support"} component={guard(SUPR, <PlatformOversight />)} />
      <Route path={"/super-admin/database"} component={guard(SUPR, <SystemHealth />)} />
      <Route path={"/super-admin/logs"} component={guard(SUPR, <AuditLogs />)} />
      <Route path={"/super-admin/monitoring"} component={guard(SUPR, <Analytics />)} />
      <Route path={"/super-admin/settings"} component={guard(SUPR, <SettingsPage />)} />
      <Route path={"/super-admin/security"} component={guard(SUPR, <SecuritySettingsPage />)} />
      <Route path={"/super-admin/backups"} component={guard(SUPR, <BackupManagement />)} />
      <Route path={"/super-admin/releases"} component={guard(SUPR, <ReleaseNotes />)} />
      <Route path={"/super-admin/data-export"} component={guard(SUPR, <DataExport />)} />
      {/* Phase 5: Innovation Lab + Scale */}
      <Route path={"/super-admin/phase5"} component={guard(SUPR, <Phase5CommandCenter />)} />

      {/* ============================================ */}
      {/* UTILITY & DETAIL ROUTES */}
      {/* ============================================ */}
      <Route path={"/billing"} component={guard([...SHIP, ...CARR, ...BROK, ...FACT, ...ADMN], <Billing />)} />
      <Route path={"/messaging"} component={guard(ALL, <MessagingCenter />)} />
      <Route path={"/invoice/:invoiceId"} component={guard([...SHIP, ...CARR, ...BROK, ...FACT, ...ADMN], <InvoiceDetails />)} />
      <Route path={"/settlement/:settlementId"} component={guard([...SHIP, ...CARR, ...BROK, ...DISP, ...ADMN], <SettlementDetails />)} />
      <Route path={"/tools/rate-calculator"} component={guard([...SHIP, ...CARR, ...BROK, ...DISP, ...ADMN], <RateCalculator />)} />
      <Route path={"/directory"} component={guard(ALL, <IndustryDirectory />)} />
      <Route path={"/industry-verticals"} component={guard([...SHIP, ...CARR, ...BROK, ...ADMN], <IndustryVerticals />)} />
      <Route path={"/live-news"} component={guard(ALL, <LiveNewsFeed />)} />
      <Route path={"/catalyst-compliance"} component={guard(CARR, <OperatingAuthority />)} />
      <Route path={"/fuel-prices"} component={guard([...DRIV, ...CARR, ...DISP, ...BROK, ...SHIP, ...ADMN], <FuelPrices />)} />
      <Route path={"/weather-alerts"} component={guard(ALL, <WeatherAlerts />)} />
      <Route path={"/the-haul"} component={guard(ALL, <TheHaul />)} />
      <Route path={"/audit-log"} component={guard(ADMN, <AuditLog />)} />
      <Route path={"/procedures"} component={guard(ALL, <ProceduresPage />)} />
      <Route path={"/shipments"} component={guard(LOAD, <ShipmentPage />)} />
      <Route path={"/channels"} component={guard(ALL, <ChannelsPage />)} />
      <Route path={"/reports"} component={guard([...SHIP, ...CARR, ...BROK, ...DISP, ...COMP, ...SAFE, ...ADMN], <Analytics />)} />

      {/* ============================================ */}
      {/* FRONTEND GAP AUDIT: 16 NEW PAGES */}
      {/* ============================================ */}
      <Route path="/rate-negotiations" component={guard([...SHIP, ...CARR, ...BROK], <RateNegotiations />)} />
      <Route path="/carrier-scorecard" component={guard([...SHIP, ...CARR, ...BROK, ...COMP], <CarrierScorecardPage />)} />
      <Route path="/carrier-tiers" component={guard(SUPR, <CarrierTierDashboard />)} />
      <Route path="/carrier-capacity" component={guard([...SHIP, ...CARR, ...BROK, ...COMP, ...DISP], <CarrierCapacityPage />)} />
      <Route path="/tank-monitor" component={guard([...CARR, ...DRIV, ...TERM, ...DISP, ...ADMN], <TankLevelMonitor />)} />
      <Route path="/demurrage-charges" component={guard([...SHIP, ...CARR, ...BROK, ...COMP, ...DISP], <DemurrageChargesPage />)} />
      <Route path="/nl-load-creator" component={guard([...SHIP, ...CARR, ...BROK, ...DISP], <NLLoadCreatorPage />)} />
      <Route path="/voice-esang" component={guard(ALL, <VoiceESANGPage />)} />
      <Route path="/rfp-manager" component={guard([...SHIP, ...BROK, ...COMP], <RFPManagerPage />)} />
      <Route path="/bid-review" component={guard([...SHIP, ...BROK, ...COMP], <BidReviewPage />)} />
      <Route path="/photo-inspection" component={guard([...CARR, ...DRIV, ...COMP, ...SAFE], <PhotoInspectionPage />)} />
      <Route path="/contextual-pricing" component={guard([...SHIP, ...CARR, ...BROK, ...DISP], <ContextualPricingPage />)} />
      <Route path="/compliance-rules" component={guard([...COMP, ...SAFE, ...CARR, ...ADMN], <ComplianceRulesPage />)} />
      <Route path="/anomaly-monitor" component={guard([...ADMN, ...COMP, ...SAFE], <AnomalyMonitorPage />)} />
      <Route path="/mission-balancer" component={guard([...DISP, ...CARR, ...ADMN], <MissionBalancerPage />)} />
      <Route path="/load-consolidation" component={guard([...SHIP, ...BROK, ...DISP, ...ADMN], <LoadConsolidationPage />)} />
      <Route path="/mobile-command" component={guard([...DRIV, ...CARR, ...DISP], <MobileCommandPage />)} />
      <Route path="/truck-posting" component={guard([...SHIP, ...CARR, ...BROK, ...DISP], <TruckPostingBoard />)} />
      <Route path="/drug-testing" component={guard([...COMP, ...SAFE, ...CARR], <DrugTestingManagement />)} />
      <Route path="/dq-files" component={guard([...COMP, ...SAFE, ...CARR], <DriverQualificationFiles />)} />
      <Route path="/lane-contracts" component={guard([...SHIP, ...CARR, ...BROK], <LaneContractsPage />)} />
      <Route path="/advanced-bidding" component={guard([...SHIP, ...CARR, ...BROK, ...DISP], <LoadBiddingAdvanced />)} />
      <Route path="/accounting" component={guard([...SHIP, ...CARR, ...BROK, ...FACT], <AccountingPage />)} />
      <Route path="/in-house" component={guard([...SHIP, ...CARR, ...DISP, ...ADMN], <InHouseFleet />)} />
      <Route path="/inspection-forms" component={guard([...COMP, ...SAFE, ...CARR, ...DRIV], <InspectionFormsPage />)} />
      <Route path="/vendors" component={guard([...CARR, ...SHIP, ...ADMN], <VendorManagement />)} />
      <Route path="/vendor-supplier" component={guard([...CARR, ...SHIP, ...ADMN], <VendorSupplier />)} />
      <Route path="/commission-engine" component={guard(ADMN, <CommissionEnginePage />)} />
      <Route path="/newsfeed" component={guard(ALL, <NewsfeedPage />)} />
      <Route path="/compliance-networks" component={guard([...COMP, ...SAFE, ...CARR], <ComplianceNetworksPage />)} />
      <Route path="/super-admin/tools" component={guard(SUPR, <SuperAdminDashboard />)} />
      <Route path="/audit-logs" component={guard(ADMN, <AuditLogsPage />)} />

      {/* ============================================ */}
      {/* ZEUN MECHANICS ROUTES */}
      {/* ============================================ */}
      <Route path={"/zeun/breakdown"} component={guard([...CARR, ...DRIV, ...DISP, ...ADMN], <ZeunBreakdownReport />)} />
      <Route path={"/zeun/maintenance"} component={guard([...CARR, ...DRIV, ...DISP, ...ADMN], <ZeunMaintenanceTracker />)} />
      <Route path={"/zeun/providers"} component={guard([...CARR, ...DRIV, ...DISP, ...ADMN], <ZeunProviderNetwork />)} />

      {/* ============================================ */}
      {/* ACTIVE TRIP — Driver's real-time command center */}
      {/* ============================================ */}
      <Route path={"/active-trip"} component={guard([...DRIV, ...CARR, ...DISP, ...ESCT, ...ADMN], <ActiveTrip />)} />

      {/* ============================================ */}
      {/* CONSOLIDATED PAGES (Tabbed Parent Pages) */}
      {/* ============================================ */}
      <Route path={"/safety/command-center"} component={guard(SAFE, <SafetyCommandCenter />)} />
      <Route path={"/safety/incident-management"} component={guard(SAFE, <IncidentManagement />)} />
      <Route path={"/admin/system-health"} component={guard(SUPR, <SystemHealth />)} />
      <Route path={"/admin/platform-oversight"} component={guard(SUPR, <PlatformOversight />)} />
      <Route path={"/compliance/shipping-papers"} component={guard([...COMP, ...CARR, ...SHIP, "TERMINAL_MANAGER"], <ShippingPapersHub />)} />
      <Route path={"/compliance/hazmat"} component={guard([...COMP, ...CARR, ...SAFE, ...DRIV], <HazmatComplianceHub />)} />
      <Route path={"/compliance/driver-qualification"} component={guard([...COMP, ...SAFE, ...CARR], <DriverQualification />)} />
      <Route path={"/compliance/regulatory-intelligence"} component={guard([...COMP, ...SAFE, ...CARR], <RegulatoryIntelligence />)} />
      <Route path={"/driver/vehicle-inspection"} component={guard(DRIV, <VehicleInspectionHub />)} />
      <Route path={"/driver/emergency-response"} component={guard(DRIV, <EmergencyResponse />)} />
      <Route path={"/driver/earnings"} component={guard(DRIV, <DriverEarningsHub />)} />
      <Route path={"/terminal/hub"} component={guard(TERM, <TerminalHub />)} />
      <Route path={"/terminal/dock-hub"} component={guard(TERM, <DockHub />)} />
      <Route path={"/terminal/facility-hub"} component={guard([...TERM, ...SHIP, ...CARR, ...BROK], <FacilityHub />)} />
      <Route path={"/carrier/fleet-hub"} component={guard([...CARR, "DISPATCH"], <FleetHub />)} />
      <Route path={"/hazmat/erg-hub"} component={guard(ALL, <ERGHub />)} />

      {/* ============================================ */}
      {/* NEW MODULE ROUTES */}
      {/* ============================================ */}
      <Route path="/advanced-financials" component={guard([...SHIP, ...CARR, ...BROK, ...FACT, ...DISP, ...ADMN], <AdvancedFinancials />)} />
      <Route path="/advanced-gamification" component={guard([...DRIV, ...CARR, ...DISP, ...ADMN], <AdvancedGamification />)} />
      <Route path="/advanced-integrations" component={guard(ADMN, <AdvancedIntegrations />)} />
      <Route path="/competitive-intelligence" component={guard([...CARR, ...BROK, ...SHIP, ...ADMN], <CompetitiveIntelligence />)} />
      <Route path="/driver-wellness" component={guard([...DRIV, ...CARR, ...DISP, ...SAFE, ...ADMN], <DriverWellness />)} />
      <Route path="/fleet-maintenance" component={guard([...CARR, ...DISP, ...TERM, ...ADMN], <FleetMaintenance />)} />
      <Route path="/future-vision" component={guard(ADMN, <FutureVision />)} />
      <Route path="/yard-management" component={guard([...TERM, ...DISP, ...ADMN], <YardManagement />)} />
      <Route path="/document-management" component={guard([...SHIP, ...CARR, ...BROK, ...DISP, ...COMP, ...ADMN], <DocumentManagement />)} />
      <Route path="/freight-claims" component={guard([...SHIP, ...CARR, ...BROK, ...FACT, ...DISP, ...ADMN], <FreightClaims />)} />
      <Route path="/fuel-management" component={guard([...CARR, ...DISP, ...ADMN], <FuelManagement />)} />
      <Route path="/cross-border" component={guard([...SHIP, ...CARR, ...BROK, ...DISP, ...COMP, ...ADMN], <CrossBorderShipping />)} />
      <Route path="/reporting-engine" component={guard([...CARR, ...BROK, ...SHIP, ...DISP, ...ADMN], <ReportingEngine />)} />
      <Route path="/route-optimization" component={guard([...CARR, ...DISP, ...BROK], <RouteOptimizationPage />)} />
      <Route path="/broker-management" component={guard([...BROK, ...ADMN], <BrokerManagementPage />)} />
      <Route path="/asset-tracking" component={guard([...CARR, ...DISP, ...TERM, ...ADMN], <AssetTrackingPage />)} />
      <Route path="/detention-accessorials" component={guard([...SHIP, ...CARR, ...BROK, ...DISP, ...ADMN], <DetentionAccessorialsPage />)} />
      <Route path="/communication-hub" component={guard(ALL, <CommunicationHubPage />)} />
      <Route path="/data-migration" component={guard(ADMN, <DataMigrationPage />)} />
      <Route path="/safety-risk" component={guard([...CARR, ...DISP, ...SAFE, ...COMP, ...ADMN], <SafetyRiskPage />)} />
      <Route path="/multi-modal" component={guard([...CARR, ...BROK, ...DISP, ...ADMN], <MultiModalPage />)} />

      {/* ============================================ */}
      {/* TRUCK ROLE GAP FIXES — Routes previously missing */}
      {/* ============================================ */}
      <Route path="/driver-mobile" component={guard([...DRIV, ...CARR, ...DISP, ...ADMN], <MobileCommandPage />)} />
      <Route path="/audit-compliance" component={guard([...COMP, ...SAFE, ...ADMN], <AuditLogsPage />)} />
      <Route path="/shipping-papers" component={guard([...COMP, ...CARR, ...SHIP, ...ADMN], <ShippingPapersHub />)} />

      {/* ============================================ */}
      {/* FALLBACK */}
      {/* ============================================ */}
      <Route path={"/404"} component={NotFound} />
      {/* ============================================ */}
      {/* V5 RAIL ROUTES */}
      {/* ============================================ */}
      <Route path={"/rail/dashboard"} component={guard(RAIL, <RailDashboard />)} />
      <Route path={"/rail/shipments/create"} component={guard(RAIL, <RailShipmentCreate />)} />
      <Route path={"/rail/shipments/:id"} component={guard(RAIL, <RailShipmentDetail />)} />
      <Route path={"/rail/shipments"} component={guard(RAIL, <RailShipments />)} />
      <Route path={"/rail/tracking"} component={guard(RAIL, <RailTracking />)} />
      <Route path={"/rail/yards"} component={guard(RAIL, <RailYards />)} />
      <Route path={"/rail/command-center"} component={guard(RAIL, <RailCommandCenter />)} />
      <Route path={"/rail/consists"} component={guard(RAIL, <RailConsists />)} />
      <Route path={"/rail/crew/hos"} component={guard(RAIL, <RailCrewHOS />)} />
      <Route path={"/rail/hos"} component={guard(RAIL, <RailCrewHOS />)} />
      <Route path={"/rail/compliance"} component={guard(RAIL, <RailCompliance />)} />
      {/* ── V5 Rail: Financial ── */}
      <Route path={"/rail/financial"} component={guard(RAIL, <RailFinancial />)} />
      <Route path={"/rail/rates"} component={guard(RAIL, <RailFinancial />)} />
      <Route path={"/rail/settlements"} component={guard(RAIL, <RailFinancial />)} />
      <Route path={"/rail/demurrage"} component={guard(RAIL, <RailFinancial />)} />
      <Route path={"/rail/invoices"} component={guard(RAIL, <RailFinancial />)} />
      <Route path={"/rail/tariffs"} component={guard(RAIL, <RailFinancial />)} />
      <Route path={"/rail/revenue"} component={guard(RAIL, <RailFinancial />)} />
      <Route path={"/rail/earnings"} component={guard(RAIL, <RailFinancial />)} />
      {/* ── V5 Rail: Crew ── */}
      <Route path={"/rail/crew"} component={guard(RAIL, <RailCrew />)} />
      <Route path={"/rail/crew/engineers"} component={guard(RAIL, <RailCrew />)} />
      <Route path={"/rail/crew/conductors"} component={guard(RAIL, <RailCrew />)} />
      <Route path={"/rail/crew/certifications"} component={guard(RAIL, <RailCrew />)} />
      {/* ── V5 Rail: Safety ── */}
      <Route path={"/rail/safety"} component={guard(RAIL, <RailSafety />)} />
      <Route path={"/rail/incidents"} component={guard(RAIL, <RailSafety />)} />
      <Route path={"/rail/inspections"} component={guard(RAIL, <RailCompliance />)} />
      {/* ── V5 Rail: Operations & Fleet ── */}
      <Route path={"/rail/operations"} component={guard(RAIL, <RailCommandCenter />)} />
      <Route path={"/rail/yard-ops"} component={guard(RAIL, <RailYards />)} />
      <Route path={"/rail/fleet"} component={guard(RAIL, <RailConsists />)} />
      <Route path={"/rail/railcars"} component={guard(RAIL, <RailConsists />)} />
      <Route path={"/rail/maintenance"} component={guard(RAIL, <RailConsists />)} />
      <Route path={"/rail/car-status"} component={guard(RAIL, <RailConsists />)} />
      <Route path={"/rail/carriers"} component={guard(RAIL, <RailConsists />)} />
      <Route path={"/rail/interchanges"} component={guard(RAIL, <RailTracking />)} />
      <Route path={"/rail/switching"} component={guard(RAIL, <RailCommandCenter />)} />
      {/* ── V5 Rail: Documents & Training ── */}
      <Route path={"/rail/documents"} component={guard(RAIL, <DocumentCenter />)} />
      <Route path={"/rail/reports"} component={guard(RAIL, <Analytics />)} />
      <Route path={"/rail/training"} component={guard(RAIL, <TrainingLMS />)} />
      {/* ── V5 Rail: Marketplace ── */}
      <Route path={"/rail/marketplace"} component={guard(RAIL, <FindLoadsPage />)} />
      <Route path={"/rail/alerts"} component={guard(RAIL, <RailDashboard />)} />
      <Route path={"/rail/assignments"} component={guard(RAIL, <RailCrewHOS />)} />
      <Route path={"/rail/drug-testing"} component={guard(RAIL, <DrugTestingManagement />)} />
      {/* ── V5 Rail: Dispatch ── */}
      <Route path={"/rail/dispatch"} component={guard(RAIL, <RailCommandCenter />)} />
      <Route path={"/rail/dispatch/schedule"} component={guard(RAIL, <RailCommandCenter />)} />
      <Route path={"/rail/dispatch/routes"} component={guard(RAIL, <RailTracking />)} />
      <Route path={"/rail/dispatch/tracks"} component={guard(RAIL, <RailYards />)} />
      {/* ── V5 Rail: Role Dashboards ── */}
      <Route path={"/rail/carrier/dashboard"} component={guard(RAIL, <RailDashboard />)} />
      <Route path={"/rail/engineer/dashboard"} component={guard(RAIL, <RailDashboard />)} />
      <Route path={"/rail/conductor/dashboard"} component={guard(RAIL, <RailDashboard />)} />
      <Route path={"/rail/broker/dashboard"} component={guard(RAIL, <RailDashboard />)} />
      {/* ── V5 Rail: Consists sub-pages ── */}
      <Route path={"/rail/consists/build"} component={guard(RAIL, <RailConsists />)} />
      <Route path={"/rail/consists/modify"} component={guard(RAIL, <RailConsists />)} />
      <Route path={"/rail/consists/break"} component={guard(RAIL, <RailConsists />)} />
      <Route path={"/rail/consists/history"} component={guard(RAIL, <RailConsists />)} />
      {/* ── V5 Rail: Yards sub-pages ── */}
      <Route path={"/rail/yards/tracks"} component={guard(RAIL, <RailYards />)} />
      <Route path={"/rail/yards/spotting"} component={guard(RAIL, <RailYards />)} />
      <Route path={"/rail/yards/capacity"} component={guard(RAIL, <RailYards />)} />
      {/* ── V5 Rail: Compliance sub-pages ── */}
      <Route path={"/rail/compliance/fra"} component={guard(RAIL, <RailCompliance />)} />

      {/* ============================================ */}
      {/* V5 VESSEL ROUTES */}
      {/* ============================================ */}
      <Route path={"/vessel/dashboard"} component={guard(VESL, <VesselDashboard />)} />
      <Route path={"/vessel/bookings/create"} component={guard(VESL, <VesselBookingCreate />)} />
      <Route path={"/vessel/bookings/:id"} component={guard(VESL, <VesselBookingDetail />)} />
      <Route path={"/vessel/bookings"} component={guard(VESL, <VesselBookings />)} />
      <Route path={"/vessel/container-tracking"} component={guard(VESL, <ContainerTracking />)} />
      <Route path={"/vessel/ports"} component={guard(VESL, <PortDirectory />)} />
      <Route path={"/vessel/fleet"} component={guard(VESL, <VesselFleet />)} />
      <Route path={"/vessel/customs"} component={guard(VESL, <CustomsDashboard />)} />
      <Route path={"/vessel/bol"} component={guard(VESL, <BillOfLading />)} />
      <Route path={"/vessel/compliance"} component={guard(VESL, <VesselCompliance />)} />
      {/* ── V5 Vessel: Financial ── */}
      <Route path={"/vessel/financial"} component={guard(VESL, <VesselFinancial />)} />
      <Route path={"/vessel/rates"} component={guard(VESL, <VesselFinancial />)} />
      <Route path={"/vessel/invoices"} component={guard(VESL, <VesselFinancial />)} />
      <Route path={"/vessel/demurrage"} component={guard(VESL, <VesselFinancial />)} />
      {/* ── V5 Vessel: Crew ── */}
      <Route path={"/vessel/crew"} component={guard(VESL, <VesselCrew />)} />
      <Route path={"/vessel/crew/manifest"} component={guard(VESL, <VesselCrew />)} />
      <Route path={"/vessel/crew/certs"} component={guard(VESL, <VesselCrew />)} />
      <Route path={"/vessel/crew/stcw"} component={guard(VESL, <VesselCrew />)} />
      <Route path={"/vessel/crew/watch"} component={guard(VESL, <VesselCrew />)} />
      <Route path={"/vessel/crew/drills"} component={guard(VESL, <VesselCrew />)} />
      {/* ── V5 Vessel: Safety ── */}
      <Route path={"/vessel/safety"} component={guard(VESL, <VesselSafety />)} />
      <Route path={"/vessel/safety/ism"} component={guard(VESL, <VesselSafety />)} />
      <Route path={"/vessel/safety/incidents"} component={guard(VESL, <VesselSafety />)} />
      <Route path={"/vessel/safety/drills"} component={guard(VESL, <VesselSafety />)} />
      <Route path={"/vessel/safety/emergency"} component={guard(VESL, <VesselSafety />)} />
      {/* ── V5 Vessel: Operations ── */}
      <Route path={"/vessel/operations"} component={guard(VESL, <VesselFleet />)} />
      <Route path={"/vessel/operations/berths"} component={guard(VESL, <VesselFleet />)} />
      <Route path={"/vessel/operations/containers"} component={guard(VESL, <ContainerTracking />)} />
      <Route path={"/vessel/operations/cargo"} component={guard(VESL, <VesselBookings />)} />
      <Route path={"/vessel/voyages"} component={guard(VESL, <VesselFleet />)} />
      <Route path={"/vessel/voyages/active"} component={guard(VESL, <VesselFleet />)} />
      <Route path={"/vessel/voyages/schedule"} component={guard(VESL, <VesselFleet />)} />
      {/* ── V5 Vessel: Environmental ── */}
      <Route path={"/vessel/environmental"} component={guard(VESL, <VesselCompliance />)} />
      <Route path={"/vessel/environmental/marpol"} component={guard(VESL, <VesselCompliance />)} />
      <Route path={"/vessel/environmental/emissions"} component={guard(VESL, <VesselCompliance />)} />
      <Route path={"/vessel/environmental/ballast"} component={guard(VESL, <VesselCompliance />)} />
      {/* ── V5 Vessel: Navigation ── */}
      <Route path={"/vessel/navigation"} component={guard(VESL, <VesselDashboard />)} />
      <Route path={"/vessel/navigation/charts"} component={guard(VESL, <VesselDashboard />)} />
      <Route path={"/vessel/navigation/weather"} component={guard(VESL, <VesselDashboard />)} />
      <Route path={"/vessel/navigation/route"} component={guard(VESL, <VesselDashboard />)} />
      {/* ── V5 Vessel: Cargo ── */}
      <Route path={"/vessel/cargo"} component={guard(VESL, <VesselBookings />)} />
      <Route path={"/vessel/cargo/stowage"} component={guard(VESL, <VesselBookings />)} />
      <Route path={"/vessel/cargo/hazmat"} component={guard(VESL, <VesselBookings />)} />
      <Route path={"/vessel/cargo/status"} component={guard(VESL, <VesselBookings />)} />
      {/* ── V5 Vessel: Maintenance & Comms ── */}
      <Route path={"/vessel/maintenance"} component={guard(VESL, <VesselFleet />)} />
      <Route path={"/vessel/comms"} component={guard(VESL, <MessagesPage />)} />
      {/* ── V5 Vessel: Logs ── */}
      <Route path={"/vessel/logs"} component={guard(VESL, <VesselCompliance />)} />
      <Route path={"/vessel/logs/official"} component={guard(VESL, <VesselCompliance />)} />
      <Route path={"/vessel/logs/oil"} component={guard(VESL, <VesselCompliance />)} />
      <Route path={"/vessel/logs/garbage"} component={guard(VESL, <VesselCompliance />)} />
      {/* ── V5 Vessel: Documents & Training ── */}
      <Route path={"/vessel/documents"} component={guard(VESL, <DocumentCenter />)} />
      <Route path={"/vessel/documents/bol"} component={guard(VESL, <BillOfLading />)} />
      <Route path={"/vessel/documents/customs"} component={guard(VESL, <CustomsDashboard />)} />
      <Route path={"/vessel/documents/packing"} component={guard(VESL, <DocumentCenter />)} />
      <Route path={"/vessel/reports"} component={guard(VESL, <Analytics />)} />
      <Route path={"/vessel/training"} component={guard(VESL, <TrainingLMS />)} />
      {/* ── V5 Vessel: Marketplace ── */}
      <Route path={"/vessel/marketplace"} component={guard(VESL, <FindLoadsPage />)} />
      <Route path={"/vessel/marketplace/schedules"} component={guard(VESL, <VesselBookings />)} />
      <Route path={"/vessel/marketplace/rates"} component={guard(VESL, <VesselFinancial />)} />
      <Route path={"/vessel/marketplace/spot"} component={guard(VESL, <VesselFinancial />)} />
      {/* ── V5 Vessel: Carriers & Customers ── */}
      <Route path={"/vessel/carriers"} component={guard(VESL, <VesselFleet />)} />
      <Route path={"/vessel/customers"} component={guard(VESL, <VesselBookings />)} />
      {/* ── V5 Vessel: Role Dashboards ── */}
      <Route path={"/vessel/operator/dashboard"} component={guard(VESL, <VesselDashboard />)} />
      <Route path={"/vessel/captain/dashboard"} component={guard(VESL, <VesselDashboard />)} />
      <Route path={"/vessel/broker/dashboard"} component={guard(VESL, <VesselDashboard />)} />
      {/* ── V5 Vessel: Containers ── */}
      <Route path={"/vessel/containers"} component={guard(VESL, <ContainerTracking />)} />
      <Route path={"/vessel/containers/tracking"} component={guard(VESL, <ContainerTracking />)} />
      <Route path={"/vessel/containers/demurrage"} component={guard(VESL, <VesselFinancial />)} />
      <Route path={"/vessel/containers/returns"} component={guard(VESL, <ContainerTracking />)} />
      {/* ── V5 Vessel: Customs ── */}
      <Route path={"/vessel/customs/isf"} component={guard(VESL, <CustomsDashboard />)} />
      <Route path={"/vessel/customs/duties"} component={guard(VESL, <VesselFinancial />)} />
      <Route path={"/vessel/customs/hts"} component={guard(VESL, <CustomsDashboard />)} />
      {/* ── V5 Vessel: Bookings sub-pages ── */}
      <Route path={"/vessel/bookings/history"} component={guard(VESL, <VesselBookings />)} />
      <Route path={"/vessel/bookings/templates"} component={guard(VESL, <VesselBookings />)} />
      {/* ── V5 Vessel: Ports sub-pages ── */}
      <Route path={"/vessel/ports/schedules"} component={guard(VESL, <PortDirectory />)} />
      <Route path={"/vessel/ports/terminals"} component={guard(VESL, <PortDirectory />)} />
      <Route path={"/vessel/ports/gate-hours"} component={guard(VESL, <PortDirectory />)} />
      {/* ── V5 Vessel: Fleet sub-pages ── */}
      <Route path={"/vessel/fleet/vessels"} component={guard(VESL, <VesselFleet />)} />
      <Route path={"/vessel/fleet/specs"} component={guard(VESL, <VesselFleet />)} />
      <Route path={"/vessel/fleet/maintenance"} component={guard(VESL, <VesselFleet />)} />

      {/* ============================================ */}
      {/* V5 PORT ROUTES */}
      {/* ============================================ */}
      <Route path={"/port/dashboard"} component={guard(PORT, <VesselDashboard />)} />
      <Route path={"/port/terminal"} component={guard(PORT, <VesselFleet />)} />
      <Route path={"/port/terminal/berths"} component={guard(PORT, <VesselFleet />)} />
      <Route path={"/port/terminal/yard"} component={guard(PORT, <VesselFleet />)} />
      <Route path={"/port/terminal/equipment"} component={guard(PORT, <VesselFleet />)} />
      <Route path={"/port/gate"} component={guard(PORT, <GateOperations />)} />
      <Route path={"/port/gate/operations"} component={guard(PORT, <GateOperations />)} />
      <Route path={"/port/gate/appointments"} component={guard(PORT, <TerminalScheduling />)} />
      <Route path={"/port/gate/queue"} component={guard(PORT, <GateOperations />)} />
      <Route path={"/port/vessel-ops"} component={guard(PORT, <VesselFleet />)} />
      <Route path={"/port/vessel-ops/schedule"} component={guard(PORT, <VesselFleet />)} />
      <Route path={"/port/vessel-ops/pilots"} component={guard(PORT, <VesselFleet />)} />
      <Route path={"/port/vessel-ops/tugs"} component={guard(PORT, <VesselFleet />)} />
      <Route path={"/port/containers"} component={guard(PORT, <ContainerTracking />)} />
      <Route path={"/port/containers/stacks"} component={guard(PORT, <ContainerTracking />)} />
      <Route path={"/port/containers/reefer"} component={guard(PORT, <ContainerTracking />)} />
      <Route path={"/port/containers/hazmat"} component={guard(PORT, <ContainerTracking />)} />
      <Route path={"/port/security"} component={guard(PORT, <VesselCompliance />)} />
      <Route path={"/port/security/isps"} component={guard(PORT, <VesselCompliance />)} />
      <Route path={"/port/security/twic"} component={guard(PORT, <VesselCompliance />)} />
      <Route path={"/port/safety"} component={guard(PORT, <VesselSafety />)} />
      <Route path={"/port/financial"} component={guard(PORT, <VesselFinancial />)} />

      {/* ============================================ */}
      {/* V5 CUSTOMS ROUTES */}
      {/* ============================================ */}
      <Route path={"/customs/dashboard"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/entries"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/entries/create"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/entries/history"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/isf"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/isf/manage"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/isf/deadlines"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/hts"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/hts/lookup"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/hts/rulings"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/compliance"} component={guard(CUST, <VesselCompliance />)} />
      <Route path={"/customs/compliance/ftz"} component={guard(CUST, <VesselCompliance />)} />
      <Route path={"/customs/compliance/drawback"} component={guard(CUST, <VesselCompliance />)} />
      <Route path={"/customs/compliance/ctpat"} component={guard(CUST, <VesselCompliance />)} />
      <Route path={"/customs/trade"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/trade/usmca"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/trade/preferential"} component={guard(CUST, <CustomsDashboard />)} />
      <Route path={"/customs/financial"} component={guard(CUST, <VesselFinancial />)} />
      <Route path={"/customs/documents"} component={guard(CUST, <DocumentCenter />)} />
      <Route path={"/customs/reports"} component={guard(CUST, <Analytics />)} />

      {/* ============================================ */}
      {/* V5 INTERMODAL ROUTES */}
      {/* ============================================ */}
      <Route path={"/intermodal/dashboard"} component={guard([...RAIL, ...VESL] as UserRole[], <IntermodalDashboard />)} />
      <Route path={"/intermodal/shipments/create"} component={guard([...RAIL, ...VESL] as UserRole[], <IntermodalShipmentCreate />)} />
      <Route path={"/intermodal/tracking"} component={guard([...RAIL, ...VESL] as UserRole[], <IntermodalTracking />)} />
      <Route path={"/intermodal/transfers"} component={guard([...RAIL, ...VESL] as UserRole[], <IntermodalTransfers />)} />

      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

// OLD DUPLICATE ROUTES REMOVED - DO NOT RE-ADD
// The following routes were duplicates and have been consolidated:
// - /dispatch (was duplicated)
// - /terminal (was duplicated)
// - /fleet (was triplicated)
// - /support (was duplicated)
// - /notifications (was duplicated)
// - /company (was duplicated)
// - /tracking (was duplicated)
// - /loads/create (was duplicated)
// - /earnings (was duplicated)
// - /documents (was triplicated)
// - /admin/analytics (was duplicated)
// - /admin/documents (was duplicated)
// - /incidents (was duplicated - now role-specific)
// - /reports (was shared - now role-specific)

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <EusoDialogProvider>
            <Toaster />
            <Router />
          </EusoDialogProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
