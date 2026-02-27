import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EusoDialogProvider } from "@/components/EusoDialog";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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
const PlatformLoadsOversight = lazy(() => import("./pages/PlatformLoadsOversight"));
const PlatformAgreementsOversight = lazy(() => import("./pages/PlatformAgreementsOversight"));
const PlatformClaimsOversight = lazy(() => import("./pages/PlatformClaimsOversight"));
const PlatformSupportOversight = lazy(() => import("./pages/PlatformSupportOversight"));
const LoadCreatePage = lazy(() => import("./pages/LoadCreate"));
const FindLoadsPage = lazy(() => import("./pages/FindLoads"));
// ActiveLoads merged into MyLoads
// TrackShipments merged into ShipperDispatchControl
const CatalystsPage = lazy(() => import("./pages/Catalysts"));
// Payments merged into Wallet (EusoWallet)
const AssignedLoadsPage = lazy(() => import("./pages/AssignedLoads"));
const InTransitPage = lazy(() => import("./pages/InTransit"));
const CatalystAnalyticsPage = lazy(() => import("./pages/CatalystAnalytics"));
const FleetPage = lazy(() => import("./pages/Fleet"));
const DriversPage = lazy(() => import("./pages/Drivers"));
const FleetCommandCenter = lazy(() => import("./pages/FleetCommandCenter"));
const EarningsPage = lazy(() => import("./pages/Earnings"));
const ErgPage = lazy(() => import("./pages/Erg"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CDLVerification = lazy(() => import("./pages/CDLVerification"));
const PlacardVerification = lazy(() => import("./pages/PlacardVerification"));
const ShippingPapers = lazy(() => import("./pages/ShippingPapers"));
const SpillResponse = lazy(() => import("./pages/SpillResponse"));
const EvacuationDistance = lazy(() => import("./pages/EvacuationDistance"));
const HazmatEndorsement = lazy(() => import("./pages/HazmatEndorsement"));
const TWICCard = lazy(() => import("./pages/TWICCard"));
const DrugTestAcknowledgment = lazy(() => import("./pages/DrugTestAcknowledgment"));
const SegregationRules = lazy(() => import("./pages/SegregationRules"));
const FireResponse = lazy(() => import("./pages/FireResponse"));
const IncidentReportForm = lazy(() => import("./pages/IncidentReportForm"));
const TripPay = lazy(() => import("./pages/TripPay"));
const SettlementHistory = lazy(() => import("./pages/SettlementHistory"));
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
const HazmatRegistration = lazy(() => import("./pages/HazmatRegistration"));
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
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const TodaySchedule = lazy(() => import("./pages/TodaySchedule"));
const HazmatDriverFilter = lazy(() => import("./pages/HazmatDriverFilter"));
const HazmatEquipmentFilter = lazy(() => import("./pages/HazmatEquipmentFilter"));
const HazmatRouteRestriction = lazy(() => import("./pages/HazmatRouteRestriction"));
const HazmatRouteCompliance = lazy(() => import("./pages/HazmatRouteCompliance"));
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
const DispatchDashboard = lazy(() => import("./pages/DispatchDashboard"));
const LoadBoard = lazy(() => import("./pages/LoadBoard"));
const SafetyDashboard = lazy(() => import("./pages/SafetyDashboard"));
const ComplianceDashboard = lazy(() => import("./pages/ComplianceDashboard"));
const TerminalDashboard = lazy(() => import("./pages/TerminalDashboard"));
const BrokerDashboard = lazy(() => import("./pages/BrokerDashboard"));
const EscortDashboard = lazy(() => import("./pages/EscortDashboard"));
const EscortActiveTrip = lazy(() => import("./pages/EscortActiveTrip"));
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
const FuelManagement = lazy(() => import("./pages/FuelManagement"));
const DriverScorecard = lazy(() => import("./pages/DriverScorecard"));
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
const EscortReports = lazy(() => import("./pages/EscortReports"));
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
const BrokerMarketplace = lazy(() => import("./pages/BrokerMarketplace"));
const BrokerCatalysts = lazy(() => import("./pages/BrokerCatalysts"));
const BrokerAnalytics = lazy(() => import("./pages/BrokerAnalytics"));
const LoadingBays = lazy(() => import("./pages/LoadingBays"));
const TerminalInventory = lazy(() => import("./pages/TerminalInventory"));
const BOLGeneration = lazy(() => import("./pages/BOLGeneration"));
const DriverCurrentJob = lazy(() => import("./pages/DriverCurrentJob"));
const DriverVehicle = lazy(() => import("./pages/DriverVehicle"));
const DriverHOS = lazy(() => import("./pages/DriverHOS"));
const DispatchFleetMap = lazy(() => import("./pages/DispatchFleetMap"));
const DispatchExceptions = lazy(() => import("./pages/DispatchExceptions"));
const EscortPermits = lazy(() => import("./pages/EscortPermits"));
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
const DatabaseHealth = lazy(() => import("./pages/DatabaseHealth"));
const OperatingAuthority = lazy(() => import("./pages/OperatingAuthority"));
const AdminApprovalQueue = lazy(() => import("./pages/AdminApprovalQueue"));
const CatalystCompliance = lazy(() => import("./pages/CatalystCompliance"));
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
const BOLManagementPage = lazy(() => import("./pages/BOLManagement"));
const BrokerCompliancePage = lazy(() => import("./pages/BrokerCompliance"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePassword"));
const DetentionTrackingPage = lazy(() => import("./pages/DetentionTracking"));
const DriverNavPage = lazy(() => import("./pages/DriverNavigation"));
const DriverSafetyScorecardPage = lazy(() => import("./pages/DriverSafetyScorecard"));
const DrugAlcoholTestingPage = lazy(() => import("./pages/DrugAlcoholTesting"));
const DVIRManagementPage = lazy(() => import("./pages/DVIRManagement"));
const ELDIntegrationPage = lazy(() => import("./pages/ELDIntegration"));
const EquipmentMgmtPage = lazy(() => import("./pages/EquipmentManagement"));
const ERGGuidePage = lazy(() => import("./pages/ERGGuide"));
const ERGLookupPage = lazy(() => import("./pages/ERGLookup"));
const FeatureFlagsPage = lazy(() => import("./pages/FeatureFlags"));
const HazmatCertsPage = lazy(() => import("./pages/HazmatCertifications"));
const HOSCompliancePage = lazy(() => import("./pages/HOSCompliance"));
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
const TruckPostingBoard = lazy(() => import("./pages/TruckPostingBoard"));
const DrugTestingManagement = lazy(() => import("./pages/DrugTestingManagement"));
const DriverQualificationFiles = lazy(() => import("./pages/DriverQualificationFiles"));
const LaneContractsPage = lazy(() => import("./pages/LaneContractsPage"));
const LoadBiddingAdvanced = lazy(() => import("./pages/LoadBiddingAdvanced"));
const AccountingPage = lazy(() => import("./pages/AccountingPage"));
const InHouseFleet = lazy(() => import("./pages/InHouseFleet"));
const InspectionFormsPage = lazy(() => import("./pages/InspectionFormsPage"));
const VendorManagement = lazy(() => import("./pages/VendorManagement"));
const CommissionEnginePage = lazy(() => import("./pages/CommissionEnginePage"));
const NewsfeedPage = lazy(() => import("./pages/NewsfeedPage"));
const ComplianceNetworksPage = lazy(() => import("./pages/ComplianceNetworksPage"));
const SuperAdminTools = lazy(() => import("./pages/SuperAdminTools"));
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage"));
const FacilitySearch = lazy(() => import("./pages/FacilitySearch"));
const FacilityProfile = lazy(() => import("./pages/FacilityProfile"));
const InboundDashboard = lazy(() => import("./pages/InboundDashboard"));
const DTNSyncDashboard = lazy(() => import("./pages/DTNSyncDashboard"));
const IntegrationsPortal = lazy(() => import("./pages/IntegrationsPortal"));
// IntegrationKeys fused into IntegrationsPortal

function Router() {
  // Role constants for route protection
  const ALL: UserRole[] = ["SHIPPER","CATALYST","BROKER","DRIVER","DISPATCH","ESCORT","TERMINAL_MANAGER","FACTORING","COMPLIANCE_OFFICER","SAFETY_MANAGER","ADMIN","SUPER_ADMIN"];
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
      <Route path={"/terms-of-service"} component={TermsOfService} />
      <Route path={"/privacy-policy"} component={PrivacyPolicy} />
      <Route path={"/validate/:token"} component={AccessValidation} />

      {/* ============================================ */}
      {/* SHARED ROUTES (All Authenticated Users) */}
      {/* ============================================ */}
      <Route path={"/"} component={guard(ALL, <Dashboard />)} />
      <Route path={"/profile"} component={guard(ALL, <ProfilePage />)} />
      <Route path={"/account-status"} component={guard(ALL, <AccountStatus />)} />
      <Route path={"/settings"} component={guard(ALL, <SettingsPage />)} />
      <Route path={"/messages"} component={guard(ALL, <MessagesPage />)} />
      <Route path={"/wallet"} component={guard(ALL, <WalletPage />)} />
      <Route path={"/news"} component={guard(ALL, <NewsFeedPage />)} />
      <Route path={"/support"} component={guard(ALL, <SupportPage />)} />
      <Route path={"/company-channels"} component={guard(ALL, <CompanyChannels />)} />
      <Route path={"/notifications"} component={guard(ALL, <NotificationsCenter />)} />
      <Route path={"/esang"} component={guard(ALL, <ESANGChat />)} />
      <Route path={"/ai-assistant"} component={guard(ALL, <ESANGChat />)} />
      <Route path={"/erg"} component={guard(ALL, <ErgPage />)} />
      <Route path={"/missions"} component={guard(ALL, <Missions />)} />
      <Route path={"/partners"} component={guard(ALL, <MyPartners />)} />
      <Route path={"/live-tracking"} component={guard(ALL, <DriverTracking />)} />
      <Route path={"/fleet-tracking"} component={guard(ALL, <FleetTracking />)} />
      <Route path={"/location-intelligence"} component={guard(ALL, <LocationIntelligence />)} />
      <Route path={"/admin/telemetry"} component={guard(ADMN, <AdminTelemetry />)} />
      <Route path={"/admin/approvals"} component={guard(ADMN, <AdminApprovalQueue />)} />
      <Route path={"/zeun-breakdown"} component={guard(ALL, <ZeunBreakdown />)} />
      <Route path={"/zeun-fleet"} component={guard(ALL, <ZeunFleetDashboard />)} />
      <Route path={"/admin/zeun"} component={guard(ADMN, <ZeunAdminDashboard />)} />
      <Route path={"/hot-zones"} component={guard(ALL, <HotZones />)} />
      <Route path={"/ratings"} component={guard(ALL, <RatingsReviews />)} />
      <Route path={"/claims"} component={guard(ALL, <ClaimsPage />)} />
      <Route path={"/market-pricing"} component={guard(ALL, <MarketPricing />)} />
      <Route path={"/market-intelligence"} component={guard(ALL, <MarketIntelligence2026 />)} />
      <Route path={"/authority"} component={guard([...CARR, ...DRIV, ...BROK, ...DISP, ...ESCT], <OperatingAuthority />)} />
      {/* Gold Standard: Shared auth, settings & cross-role compliance */}
      <Route path={"/settings/change-password"} component={guard(ALL, <ChangePasswordPage />)} />
      <Route path={"/settings/2fa-setup"} component={guard(ALL, <TwoFactorSetupPage />)} />
      <Route path={"/settings/2fa"} component={guard(ALL, <TwoFactorAuthPage />)} />
      <Route path={"/settings/sessions"} component={guard(ALL, <SessionMgmtPage />)} />
      <Route path={"/bol-management"} component={guard(ALL, <BOLManagementPage />)} />
      <Route path={"/rate-sheet"} component={guard(ALL, <RateSheetReconciliation />)} />
      <Route path={"/pod"} component={guard(ALL, <PODManagementPage />)} />
      <Route path={"/erg/guide"} component={guard(ALL, <ERGGuidePage />)} />
      <Route path={"/erg/lookup"} component={guard(ALL, <ERGLookupPage />)} />
      <Route path={"/fmcsa-lookup"} component={guard([...CARR, ...BROK, ...COMP, ...SHIP], <SAFERLookupPage />)} />
      <Route path={"/hazmat/certifications"} component={guard(ALL, <HazmatCertsPage />)} />
      <Route path={"/insurance"} component={guard([...CARR, ...BROK, ...COMP, "ESCORT"], <InsuranceMgmtPage />)} />
      <Route path={"/insurance/per-load"} component={guard([...CARR, ...SHIP, ...BROK], <PerLoadInsurance />)} />
      <Route path={"/insurance/verification"} component={guard([...CARR, ...BROK, ...COMP, ...SHIP, ...DRIV, "ESCORT"], <InsuranceVerification />)} />
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
      <Route path={"/loads"} component={guard(LOAD, <MyLoadsPage />)} />
      <Route path={"/loads/create"} component={guard([...SHIP, "BROKER"], <LoadCreationWizard />)} />
      <Route path={"/loads/active"} component={guard(LOAD, <MyLoadsPage />)} />
      <Route path={"/tracking"} component={guard(LOAD, <ShipperDispatchControl />)} />
      <Route path={"/catalysts"} component={guard([...SHIP, "BROKER"], <CatalystsPage />)} />
      <Route path={"/payments"} component={guard(ALL, <WalletPage />)} />
      <Route path={"/company"} component={guard([...LOAD, "ESCORT"], <CompanyProfile />)} />
      <Route path={"/agreements"} component={guard([...LOAD, "TERMINAL_MANAGER", "ESCORT"], <AgreementsLibrary />)} />
      <Route path={"/agreements/create"} component={guard([...LOAD, "TERMINAL_MANAGER", "ESCORT"], <ShipperAgreementWizard />)} />
      <Route path={"/agreements/broker"} component={guard([...BROK, "SHIPPER"], <BrokerContractWizard />)} />
      <Route path={"/agreements/:id"} component={guard([...LOAD, "TERMINAL_MANAGER", "ESCORT"], <AgreementDetail />)} />
      <Route path={"/loads/recurring"} component={guard(SHIP, <RecurringLoadScheduler />)} />
      <Route path={"/loads/:id"} component={guard(LOAD, <LoadDetails />)} />
      <Route path={"/shipper/dispatch"} component={guard(SHIP, <ShipperDispatchControl />)} />
      <Route path={"/shipper/compliance"} component={guard(SHIP, <ShipperCompliancePage />)} />
      <Route path={"/quotes"} component={guard([...SHIP, ...BROK], <QuoteMgmtPage />)} />
      <Route path={"/payment-history"} component={guard([...SHIP, ...CARR, ...BROK], <PaymentHistoryPage />)} />

      {/* ============================================ */}
      {/* CATALYST ROUTES */}
      {/* ============================================ */}
      <Route path={"/marketplace"} component={guard([...CARR, "BROKER", "DRIVER", "DISPATCH", "ESCORT"], <FindLoadsPage />)} />
      <Route path={"/bids"} component={guard([...CARR, "BROKER", "DRIVER", "DISPATCH", "ESCORT"], <BidManagement />)} />
      <Route path={"/bids/submit/:loadId"} component={guard(CARR, <CatalystBidSubmission />)} />
      <Route path={"/bids/:bidId"} component={guard(CARR, <BidDetails />)} />
      <Route path={"/contract/sign/:loadId"} component={guard(CARR, <ContractSigning />)} />
      <Route path={"/loads/assigned"} component={guard([...CARR, "DRIVER", "DISPATCH", "ESCORT"], <AssignedLoadsPage />)} />
      <Route path={"/loads/transit"} component={guard([...CARR, "DRIVER"], <InTransitPage />)} />
      <Route path={"/loads/:loadId/bids"} component={guard(LOAD, <LoadBids />)} />
      <Route path={"/load/:loadId"} component={guard(LOAD, <LoadDetails />)} />
      <Route path={"/fleet"} component={guard(CARR, <FleetCommandCenter />)} />
      <Route path={"/fleet-management"} component={guard(CARR, <FleetCommandCenter />)} />
      <Route path={"/driver/management"} component={guard(CARR, <FleetCommandCenter />)} />
      <Route path={"/drivers"} component={guard(CARR, <FleetCommandCenter />)} />
      <Route path={"/earnings"} component={guard([...CARR, "DRIVER", "DISPATCH", "ESCORT"], <WalletPage />)} />
      <Route path={"/analytics"} component={guard([...CARR, "BROKER"], <Analytics />)} />
      <Route path={"/equipment"} component={guard(CARR, <EquipmentMgmtPage />)} />
      <Route path={"/invoices"} component={guard([...CARR, ...SHIP, ...BROK, "ESCORT"], <InvoiceMgmtPage />)} />
      <Route path={"/revenue"} component={guard([...CARR, ...BROK], <RevenueAnalyticsPage />)} />
      <Route path={"/settlements"} component={guard(CARR, <SettlementStatementsPage />)} />
      <Route path={"/maintenance"} component={guard(CARR, <MaintenanceSchedulePage />)} />
      <Route path={"/compliance/ifta"} component={guard([...CARR, ...COMP], <IFTAReportingPage />)} />
      <Route path={"/permits"} component={guard([...CARR, ...COMP], <PermitMgmtPage />)} />
      <Route path={"/compliance/mvr"} component={guard([...CARR, ...COMP], <MVRReportsPage />)} />
      <Route path={"/compliance/drug-alcohol"} component={guard([...SAFE, ...COMP, ...CARR], <DrugAlcoholTestingPage />)} />
      <Route path={"/hos-compliance"} component={guard([...DRIV, ...CARR, ...COMP], <HOSCompliancePage />)} />
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
      <Route path={"/driver-scorecard"} component={guard(DRIV, <DriverScorecard />)} />
      <Route path={"/driver-scorecard/:driverId"} component={guard(DRIV, <DriverScorecard />)} />
      <Route path={"/rewards"} component={guard(ALL, <Rewards />)} />
      <Route path={"/leaderboard"} component={guard(ALL, <Leaderboard />)} />
      <Route path={"/fuel"} component={guard(DRIV, <FuelManagement />)} />
      <Route path={"/driver/cdl-verification"} component={guard(DRIV, <CDLVerification />)} />
      <Route path={"/driver/placard-verification"} component={guard(DRIV, <PlacardVerification />)} />
      <Route path={"/driver/shipping-papers"} component={guard(DRIV, <ShippingPapers />)} />
      <Route path={"/driver/spill-response"} component={guard(DRIV, <SpillResponse />)} />
      <Route path={"/driver/evacuation-distance"} component={guard(DRIV, <EvacuationDistance />)} />
      <Route path={"/driver/hazmat-endorsement"} component={guard(DRIV, <HazmatEndorsement />)} />
      <Route path={"/driver/twic-card"} component={guard(DRIV, <TWICCard />)} />
      <Route path={"/driver/drug-test"} component={guard(DRIV, <DrugTestAcknowledgment />)} />
      <Route path={"/hazmat/segregation-rules"} component={guard(ALL, <SegregationRules />)} />
      <Route path={"/hazmat/fire-response"} component={guard(ALL, <FireResponse />)} />
      <Route path={"/hazmat/incident-report"} component={guard(ALL, <IncidentReportForm />)} />
      <Route path={"/driver/trip-pay"} component={guard(DRIV, <TripPay />)} />
      <Route path={"/driver/settlement-history"} component={guard(DRIV, <SettlementHistory />)} />
      <Route path={"/driver/deductions"} component={guard(DRIV, <DeductionsBreakdown />)} />
      <Route path={"/driver/bonus-tracker"} component={guard(DRIV, <BonusTracker />)} />
      <Route path={"/driver/direct-deposit"} component={guard(DRIV, <DirectDeposit />)} />
      <Route path={"/driver/availability"} component={guard(DRIV, <DriverAvailability />)} />
      <Route path={"/hazmat/placard-guide"} component={guard(ALL, <PlacardGuide />)} />
      <Route path={"/emergency-alerts"} component={guard(ALL, <EmergencyNotification />)} />
      <Route path={"/settings/language"} component={guard(ALL, <LanguageSettings />)} />
      <Route path={"/settings/privacy"} component={guard(ALL, <PrivacySettings />)} />
      <Route path={"/hazmat/nrc-report"} component={guard(ALL, <NRCReport />)} />
      <Route path={"/hazmat/dot-5800"} component={guard(ALL, <DOT5800Form />)} />
      <Route path={"/hazmat/security-plan"} component={guard(ALL, <SecurityPlan />)} />
      <Route path={"/hazmat/registration"} component={guard(ALL, <HazmatRegistration />)} />
      <Route path={"/hazmat/corrective-actions"} component={guard(ALL, <CorrectiveActions />)} />
      <Route path={"/hazmat/regulatory-updates"} component={guard(ALL, <RegulatoryUpdates />)} />
      <Route path={"/hazmat/tank-valve"} component={guard(ALL, <TankValve />)} />
      <Route path={"/hazmat/tank-pressure"} component={guard(ALL, <TankPressure />)} />
      <Route path={"/hazmat/cryogenic-tank"} component={guard(ALL, <CryogenicTank />)} />
      <Route path={"/hazmat/liquid-tank"} component={guard(ALL, <LiquidTankInspection />)} />
      <Route path={"/hazmat/pressurized-tank"} component={guard(ALL, <PressurizedTankInspection />)} />
      <Route path={"/driver/flatbed-securement"} component={guard(DRIV, <FlatbedSecurement />)} />
      <Route path={"/driver/hopper-inspection"} component={guard(DRIV, <HopperInspection />)} />
      <Route path={"/driver/voice-messages"} component={guard(DRIV, <VoiceMessaging />)} />
      <Route path={"/dispatch/emergency-broadcast"} component={guard(DISP, <EmergencyBroadcast />)} />
      <Route path={"/dispatch/broadcast"} component={guard(DISP, <BroadcastMessages />)} />
      <Route path={"/driver/profile-setup"} component={guard(DRIV, <ProfileSetup />)} />
      <Route path={"/driver/today"} component={guard(DRIV, <TodaySchedule />)} />
      <Route path={"/hazmat/driver-filter"} component={guard(DISP, <HazmatDriverFilter />)} />
      <Route path={"/hazmat/equipment-filter"} component={guard(DISP, <HazmatEquipmentFilter />)} />
      <Route path={"/hazmat/route-restrictions"} component={guard(ALL, <HazmatRouteRestriction />)} />
      <Route path={"/hazmat/route-compliance"} component={guard(ALL, <HazmatRouteCompliance />)} />
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
      <Route path={"/dispatch"} component={guard(DISP, <DispatchDashboard />)} />
      <Route path={"/dispatch/board"} component={guard(DISP, <DispatchBoard />)} />
      <Route path={"/specializations"} component={guard(DISP, <Specializations />)} />
      <Route path={"/matched-loads"} component={guard(DISP, <MatchedLoads />)} />
      <Route path={"/opportunities"} component={guard(DISP, <Opportunities />)} />
      <Route path={"/performance"} component={guard(DISP, <DispatchPerformance />)} />
      <Route path={"/dispatch/fleet-map"} component={guard(DISP, <DispatchFleetMap />)} />
      <Route path={"/dispatch/exceptions"} component={guard(DISP, <DispatchExceptions />)} />
      <Route path={"/load-board"} component={guard([...DISP, "BROKER"], <LoadBoard />)} />

      {/* ============================================ */}
      {/* ESCORT ROUTES */}
      {/* ============================================ */}
      <Route path={"/escort"} component={guard(ESCT, <EscortDashboard />)} />
      <Route path={"/escort/active-trip"} component={guard(ESCT, <EscortActiveTrip />)} />
      <Route path={"/convoys"} component={guard(ESCT, <ActiveConvoys />)} />
      <Route path={"/team"} component={guard(ESCT, <ProfilePage />)} />
      <Route path={"/escort/incidents"} component={guard(ESCT, <EscortIncidents />)} />
      <Route path={"/escort/reports"} component={guard(ESCT, <EscortReports />)} />
      <Route path={"/escort/jobs"} component={guard(ESCT, <EscortJobs />)} />
      <Route path={"/escort/marketplace"} component={guard(ESCT, <EscortJobMarketplace />)} />
      <Route path={"/escort/permits"} component={guard(ESCT, <EscortPermits />)} />
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
      <Route path={"/bol"} component={guard(TERM, <BOLGeneration />)} />
      <Route path={"/supply-chain"} component={guard(TERM, <TerminalPartners />)} />
      <Route path={"/my-terminals"} component={guard([...SHIP, ...CARR, ...BROK], <MyTerminals />)} />
      <Route path={"/spectra-match"} component={guard(TERM, <SpectraMatch />)} />
      <Route path={"/detention"} component={guard([...TERM, ...CARR, ...SHIP], <DetentionTrackingPage />)} />
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
      <Route path={"/admin/feature-flags"} component={guard(ADMN, <FeatureFlagsPage />)} />
      <Route path={"/admin/roles"} component={guard(ADMN, <RolePermissionsPage />)} />
      <Route path={"/admin/support-tickets"} component={guard(ADMN, <SupportTickets />)} />
      <Route path={"/admin/rates"} component={guard(ADMN, <RateManagement />)} />
      <Route path={"/admin/api"} component={guard(ADMN, <APIManagement />)} />
      <Route path={"/admin/integrations"} component={guard(ADMN, <IntegrationSettings />)} />
      <Route path={"/admin/sync"} component={guard(ADMN, <SyncDashboard />)} />

      {/* ============================================ */}
      {/* SUPER ADMIN ROUTES */}
      {/* ============================================ */}
      <Route path={"/super-admin"} component={guard(SUPR, <SuperAdminDashboard />)} />
      <Route path={"/super-admin/users"} component={guard(SUPR, <UserManagement />)} />
      <Route path={"/super-admin/companies"} component={guard(SUPR, <CompanyPage />)} />
      <Route path={"/super-admin/loads"} component={guard(SUPR, <PlatformLoadsOversight />)} />
      <Route path={"/super-admin/agreements"} component={guard(SUPR, <PlatformAgreementsOversight />)} />
      <Route path={"/super-admin/claims"} component={guard(SUPR, <PlatformClaimsOversight />)} />
      <Route path={"/super-admin/support"} component={guard(SUPR, <PlatformSupportOversight />)} />
      <Route path={"/super-admin/database"} component={guard(SUPR, <DatabaseHealth />)} />
      <Route path={"/super-admin/logs"} component={guard(SUPR, <AuditLogs />)} />
      <Route path={"/super-admin/monitoring"} component={guard(SUPR, <Analytics />)} />
      <Route path={"/super-admin/settings"} component={guard(SUPR, <SettingsPage />)} />
      <Route path={"/super-admin/security"} component={guard(SUPR, <SecuritySettingsPage />)} />
      <Route path={"/super-admin/backups"} component={guard(SUPR, <BackupManagement />)} />
      <Route path={"/super-admin/releases"} component={guard(SUPR, <ReleaseNotes />)} />
      <Route path={"/super-admin/data-export"} component={guard(SUPR, <DataExport />)} />

      {/* ============================================ */}
      {/* UTILITY & DETAIL ROUTES */}
      {/* ============================================ */}
      <Route path={"/billing"} component={guard(ALL, <Billing />)} />
      <Route path={"/messaging"} component={guard(ALL, <MessagingCenter />)} />
      <Route path={"/invoice/:invoiceId"} component={guard(ALL, <InvoiceDetails />)} />
      <Route path={"/settlement/:settlementId"} component={guard(ALL, <SettlementDetails />)} />
      <Route path={"/tools/rate-calculator"} component={guard(ALL, <RateCalculator />)} />
      <Route path={"/directory"} component={guard(ALL, <IndustryDirectory />)} />
      <Route path={"/live-news"} component={guard(ALL, <LiveNewsFeed />)} />
      <Route path={"/catalyst-compliance"} component={guard(CARR, <CatalystCompliance />)} />
      <Route path={"/fuel-prices"} component={guard(ALL, <FuelPrices />)} />
      <Route path={"/weather-alerts"} component={guard(ALL, <WeatherAlerts />)} />
      <Route path={"/the-haul"} component={guard(ALL, <TheHaul />)} />
      <Route path={"/audit-log"} component={guard(ADMN, <AuditLog />)} />
      <Route path={"/procedures"} component={guard(ALL, <ProceduresPage />)} />
      <Route path={"/shipments"} component={guard(ALL, <ShipmentPage />)} />
      <Route path={"/channels"} component={guard(ALL, <ChannelsPage />)} />
      <Route path={"/reports"} component={guard(ALL, <Analytics />)} />

      {/* ============================================ */}
      {/* FRONTEND GAP AUDIT: 16 NEW PAGES */}
      {/* ============================================ */}
      <Route path="/rate-negotiations" component={guard([...SHIP, ...CARR, ...BROK], <RateNegotiations />)} />
      <Route path="/carrier-scorecard" component={guard([...SHIP, ...CARR, ...BROK, ...COMP], <CarrierScorecardPage />)} />
      <Route path="/truck-posting" component={guard([...SHIP, ...CARR, ...BROK, ...DISP], <TruckPostingBoard />)} />
      <Route path="/drug-testing" component={guard([...COMP, ...SAFE, ...CARR], <DrugTestingManagement />)} />
      <Route path="/dq-files" component={guard([...COMP, ...SAFE, ...CARR], <DriverQualificationFiles />)} />
      <Route path="/lane-contracts" component={guard([...SHIP, ...CARR, ...BROK], <LaneContractsPage />)} />
      <Route path="/advanced-bidding" component={guard([...SHIP, ...CARR, ...BROK, ...DISP], <LoadBiddingAdvanced />)} />
      <Route path="/accounting" component={guard([...SHIP, ...CARR, ...BROK, ...FACT], <AccountingPage />)} />
      <Route path="/in-house" component={guard(ALL, <InHouseFleet />)} />
      <Route path="/inspection-forms" component={guard([...COMP, ...SAFE, ...CARR, ...DRIV], <InspectionFormsPage />)} />
      <Route path="/vendors" component={guard([...CARR, ...SHIP, ...ADMN], <VendorManagement />)} />
      <Route path="/commission-engine" component={guard(ADMN, <CommissionEnginePage />)} />
      <Route path="/newsfeed" component={guard(ALL, <NewsfeedPage />)} />
      <Route path="/compliance-networks" component={guard([...COMP, ...SAFE, ...CARR], <ComplianceNetworksPage />)} />
      <Route path="/super-admin/tools" component={guard(SUPR, <SuperAdminTools />)} />
      <Route path="/audit-logs" component={guard(ADMN, <AuditLogsPage />)} />

      {/* ============================================ */}
      {/* ZEUN MECHANICS ROUTES */}
      {/* ============================================ */}
      <Route path={"/zeun/breakdown"} component={guard(ALL, <ZeunBreakdownReport />)} />
      <Route path={"/zeun/maintenance"} component={guard(ALL, <ZeunMaintenanceTracker />)} />
      <Route path={"/zeun/providers"} component={guard(ALL, <ZeunProviderNetwork />)} />

      {/* ============================================ */}
      {/* ACTIVE TRIP — Driver's real-time command center */}
      {/* ============================================ */}
      <Route path={"/active-trip"} component={guard(ALL, <ActiveTrip />)} />

      {/* ============================================ */}
      {/* FALLBACK */}
      {/* ============================================ */}
      <Route path={"/404"} component={NotFound} />
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
