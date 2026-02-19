import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EusoDialogProvider } from "@/components/EusoDialog";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import type { UserRole } from "./hooks/useRoleAccess";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ShipmentPage from "./pages/Shipment";
import JobsPage from "./pages/Jobs";
import MessagesPage from "./pages/Messages";
import ChannelsPage from "./pages/Channels";
import ProfilePage from "./pages/Profile";
import CompanyPage from "./pages/Company";
import FacilityPage from "./pages/Facility";
import ProceduresPage from "./pages/Procedures";
import DiagnosticsPage from "./pages/Diagnostics";
import WalletPage from "./pages/Wallet";
import SettingsPage from "./pages/Settings";
import NewsFeedPage from "./pages/NewsFeed";
import SupportPage from "./pages/Support";
import CommissionPage from "./pages/Commission";
import ShippersPage from "./pages/Shippers";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";
import CompanyChannels from "./pages/CompanyChannels";
import Analytics from "./pages/Analytics";
import DocumentsPage from "./pages/Documents";
import DashboardLayout from "./components/DashboardLayout";
import ZeunBreakdownReport from "./pages/ZeunBreakdownReport";
import ZeunMaintenanceTracker from "./pages/ZeunMaintenanceTracker";
import ZeunProviderNetwork from "./pages/ZeunProviderNetwork";
import MyLoadsPage from "./pages/MyLoads";
import PlatformLoadsOversight from "./pages/PlatformLoadsOversight";
import PlatformAgreementsOversight from "./pages/PlatformAgreementsOversight";
import PlatformClaimsOversight from "./pages/PlatformClaimsOversight";
import PlatformSupportOversight from "./pages/PlatformSupportOversight";
import LoadCreatePage from "./pages/LoadCreate";
import FindLoadsPage from "./pages/FindLoads";
// ActiveLoads merged into MyLoads
// TrackShipments merged into ShipperDispatchControl
import CatalystsPage from "./pages/Catalysts";
// Payments merged into Wallet (EusoWallet)
import AssignedLoadsPage from "./pages/AssignedLoads";
import InTransitPage from "./pages/InTransit";
import CatalystAnalyticsPage from "./pages/CatalystAnalytics";
import FleetPage from "./pages/Fleet";
import DriversPage from "./pages/Drivers";
import FleetCommandCenter from "./pages/FleetCommandCenter";
import EarningsPage from "./pages/Earnings";
import ErgPage from "./pages/Erg";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CDLVerification from "./pages/CDLVerification";
import PlacardVerification from "./pages/PlacardVerification";
import ShippingPapers from "./pages/ShippingPapers";
import SpillResponse from "./pages/SpillResponse";
import EvacuationDistance from "./pages/EvacuationDistance";
import HazmatEndorsement from "./pages/HazmatEndorsement";
import TWICCard from "./pages/TWICCard";
import DrugTestAcknowledgment from "./pages/DrugTestAcknowledgment";
import SegregationRules from "./pages/SegregationRules";
import FireResponse from "./pages/FireResponse";
import IncidentReportForm from "./pages/IncidentReportForm";
import TripPay from "./pages/TripPay";
import SettlementHistory from "./pages/SettlementHistory";
import DeductionsBreakdown from "./pages/DeductionsBreakdown";
import BonusTracker from "./pages/BonusTracker";
import DirectDeposit from "./pages/DirectDeposit";
import DriverAvailability from "./pages/DriverAvailability";
import PlacardGuide from "./pages/PlacardGuide";
import EmergencyNotification from "./pages/EmergencyNotification";
import LanguageSettings from "./pages/LanguageSettings";
import PrivacySettings from "./pages/PrivacySettings";
import NRCReport from "./pages/NRCReport";
import DOT5800Form from "./pages/DOT5800Form";
import SecurityPlan from "./pages/SecurityPlan";
import HazmatRegistration from "./pages/HazmatRegistration";
import CorrectiveActions from "./pages/CorrectiveActions";
import RegulatoryUpdates from "./pages/RegulatoryUpdates";
import TankValve from "./pages/TankValve";
import TankPressure from "./pages/TankPressure";
import CryogenicTank from "./pages/CryogenicTank";
import LiquidTankInspection from "./pages/LiquidTankInspection";
import PressurizedTankInspection from "./pages/PressurizedTankInspection";
import FlatbedSecurement from "./pages/FlatbedSecurement";
import HopperInspection from "./pages/HopperInspection";
import VoiceMessaging from "./pages/VoiceMessaging";
import EmergencyBroadcast from "./pages/EmergencyBroadcast";
import ProfileSetup from "./pages/ProfileSetup";
import TodaySchedule from "./pages/TodaySchedule";
import HazmatDriverFilter from "./pages/HazmatDriverFilter";
import HazmatEquipmentFilter from "./pages/HazmatEquipmentFilter";
import HazmatRouteRestriction from "./pages/HazmatRouteRestriction";
import HazmatRouteCompliance from "./pages/HazmatRouteCompliance";
import HazmatCheckIn from "./pages/HazmatCheckIn";
import DockAssignment from "./pages/DockAssignment";
import LoadingUnloadingStatus from "./pages/LoadingUnloadingStatus";
// TestLogin removed from production - SOC II: no dev backdoors in prod
import Register from "./pages/Register";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RegisterShipper from "./pages/RegisterShipper";
import RegisterCatalyst from "./pages/RegisterCatalyst";
import RegisterDriver from "./pages/RegisterDriver";
import LoadBids from "./pages/LoadBids";
import RegisterEscort from "./pages/RegisterEscort";
import RegisterBroker from "./pages/RegisterBroker";
import RegisterDispatch from "./pages/RegisterDispatch";
import RegisterTerminal from "./pages/RegisterTerminal";
import RegisterCompliance from "./pages/RegisterCompliance";
import RegisterSafety from "./pages/RegisterSafety";
import DispatchDashboard from "./pages/DispatchDashboard";
import LoadBoard from "./pages/LoadBoard";
import SafetyDashboard from "./pages/SafetyDashboard";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import TerminalDashboard from "./pages/TerminalDashboard";
import BrokerDashboard from "./pages/BrokerDashboard";
import EscortDashboard from "./pages/EscortDashboard";
import FleetManagement from "./pages/FleetManagement";
import ShipperLoads from "./pages/ShipperLoads";
import Billing from "./pages/Billing";
import LoadTracking from "./pages/LoadTracking";
import IncidentReport from "./pages/IncidentReport";
import AuditLog from "./pages/AuditLog";
import IndustryDirectory from "./pages/IndustryDirectory";
import LiveNewsFeed from "./pages/LiveNewsFeed";
import ESANGChat from "./pages/ESANGChat";
import DriverDashboard from "./pages/DriverDashboard";
import LoadCreationWizard from "./pages/LoadCreationWizard";
import BidManagement from "./pages/BidManagement";
import CatalystBidSubmission from "./pages/CatalystBidSubmission";
import PreTripInspection from "./pages/PreTripInspection";
import DVIR from "./pages/DVIR";
import DispatchBoard from "./pages/DispatchBoard";
import CatalystVetting from "./pages/CatalystVetting";
import EscortJobMarketplace from "./pages/EscortJobMarketplace";
import TerminalScheduling from "./pages/TerminalScheduling";
import DQFileManagement from "./pages/DQFileManagement";
import CSAScoresDashboard from "./pages/CSAScoresDashboard";
import UserVerification from "./pages/UserVerification";
import HOSTracker from "./pages/HOSTracker";
import NotificationsCenter from "./pages/NotificationsCenter";
import DocumentCenter from "./pages/DocumentCenter";
import AuditLogs from "./pages/AuditLogs";
import RateCalculator from "./pages/RateCalculator";
import DriverEarnings from "./pages/DriverEarnings";
import TrainingManagement from "./pages/TrainingManagement";
import FuelManagement from "./pages/FuelManagement";
import DriverScorecard from "./pages/DriverScorecard";
import Rewards from "./pages/Rewards";
import ClearinghouseDashboard from "./pages/ClearinghouseDashboard";
import TerminalSCADA from "./pages/TerminalSCADA";
import Leaderboard from "./pages/Leaderboard";
import DriverOnboarding from "./pages/DriverOnboarding";
import AccidentReport from "./pages/AccidentReport";
import CatalystVettingDetails from "./pages/CatalystVettingDetails";
import MessagingCenter from "./pages/MessagingCenter";
import LoadDetails from "./pages/LoadDetails";
import ELDLogs from "./pages/ELDLogs";
import InvoiceDetails from "./pages/InvoiceDetails";
import EscortJobs from "./pages/EscortJobs";
import BidDetails from "./pages/BidDetails";
import ContractSigning from "./pages/ContractSigning";
import ShipperAgreementWizard from "./pages/ShipperAgreementWizard";
import AgreementsLibrary from "./pages/AgreementsLibrary";
import AgreementDetail from "./pages/AgreementDetail";
import RecurringLoadScheduler from "./pages/RecurringLoadScheduler";
import BrokerContractWizard from "./pages/BrokerContractWizard";
import ShipperDispatchControl from "./pages/ShipperDispatchControl";
import FleetOverview from "./pages/FleetOverview";
import ComplianceCalendar from "./pages/ComplianceCalendar";
import DriverPerformance from "./pages/DriverPerformance";
import SettlementDetails from "./pages/SettlementDetails";
import AppointmentScheduler from "./pages/AppointmentScheduler";
import NotificationCenter from "./pages/NotificationCenter";
import UserManagement from "./pages/UserManagement";
import CompanyProfile from "./pages/CompanyProfile";
import ActiveConvoys from "./pages/ActiveConvoys";
import EscortReports from "./pages/EscortReports";
import EscortIncidents from "./pages/EscortIncidents";
import Specializations from "./pages/Specializations";
import MatchedLoads from "./pages/MatchedLoads";
import Opportunities from "./pages/Opportunities";
import DispatchPerformance from "./pages/DispatchPerformance";
import IncomingShipments from "./pages/IncomingShipments";
import OutgoingShipments from "./pages/OutgoingShipments";
import TerminalStaff from "./pages/TerminalStaff";
import TerminalOperations from "./pages/TerminalOperations";
import Violations from "./pages/Violations";
import Audits from "./pages/Audits";
import SafetyMetrics from "./pages/SafetyMetrics";
import SafetyIncidents from "./pages/SafetyIncidents";
import BrokerMarketplace from "./pages/BrokerMarketplace";
import BrokerCatalysts from "./pages/BrokerCatalysts";
import BrokerAnalytics from "./pages/BrokerAnalytics";
import LoadingBays from "./pages/LoadingBays";
import TerminalInventory from "./pages/TerminalInventory";
import BOLGeneration from "./pages/BOLGeneration";
import DriverCurrentJob from "./pages/DriverCurrentJob";
import DriverVehicle from "./pages/DriverVehicle";
import DispatchFleetMap from "./pages/DispatchFleetMap";
import DispatchExceptions from "./pages/DispatchExceptions";
import EscortPermits from "./pages/EscortPermits";
import EscortSchedule from "./pages/EscortSchedule";
import SpectraMatch from "./pages/SpectraMatch";
import EusoTicket from "./pages/EusoTicket";
import LocationIntelligence from "./pages/LocationIntelligence";
import AdminRSSFeeds from "./pages/AdminRSSFeeds";
import SyncDashboard from "./pages/admin/SyncDashboard";
import AdminPlatformFees from "./pages/AdminPlatformFees";
import Missions from "./pages/Missions";
import DriverTracking from "./pages/DriverTracking";
import FleetTracking from "./pages/FleetTracking";
import AdminTelemetry from "./pages/AdminTelemetry";
import ZeunBreakdown from "./pages/ZeunBreakdown";
import ZeunFleetDashboard from "./pages/ZeunFleetDashboard";
import ZeunAdminDashboard from "./pages/ZeunAdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import HotZones from "./pages/HotZones";
import RatingsReviews from "./pages/RatingsReviews";
import ClaimsPage from "./pages/Claims";
import MarketPricing from "./pages/MarketPricing";
import AccountStatus from "./pages/AccountStatus";
import DatabaseHealth from "./pages/DatabaseHealth";
import OperatingAuthority from "./pages/OperatingAuthority";
import AdminApprovalQueue from "./pages/AdminApprovalQueue";
import CatalystCompliance from "./pages/CatalystCompliance";
import FuelPrices from "./pages/FuelPrices";
import WeatherAlerts from "./pages/WeatherAlerts";
import TheHaul from "./pages/TheHaul";
import FactoringDashboardPage from "./pages/factoring/FactoringDashboard";
import FactoringInvoicesPage from "./pages/factoring/FactoringInvoices";
import FactoringCatalystsPage from "./pages/factoring/FactoringCatalysts";
import FactoringCollectionsPage from "./pages/factoring/FactoringCollections";
import FactoringFundingPage from "./pages/factoring/FactoringFunding";
import FactoringRiskPage from "./pages/factoring/FactoringRisk";
import FactoringAgingPage from "./pages/factoring/FactoringAging";
import FactoringChargebacksPage from "./pages/factoring/FactoringChargebacks";
import FactoringDebtorsPage from "./pages/factoring/FactoringDebtors";
import FactoringReportsPage from "./pages/factoring/FactoringReports";
// ── Gold Standard: Final 5 missing screens ──────────────────────────────────
import ReeferTemperatureLog from "./pages/ReeferTemperatureLog";
import PerLoadInsurance from "./pages/PerLoadInsurance";
// ── Gold Standard Wiring: 46 previously dead-code pages ─────────────────────
import BackgroundChecks from "./pages/BackgroundChecks";
import BOLManagementPage from "./pages/BOLManagement";
import BrokerCompliancePage from "./pages/BrokerCompliance";
import ChangePasswordPage from "./pages/ChangePassword";
import DetentionTrackingPage from "./pages/DetentionTracking";
import DriverNavPage from "./pages/DriverNavigation";
import DriverSafetyScorecardPage from "./pages/DriverSafetyScorecard";
import DrugAlcoholTestingPage from "./pages/DrugAlcoholTesting";
import DVIRManagementPage from "./pages/DVIRManagement";
import ELDIntegrationPage from "./pages/ELDIntegration";
import EquipmentMgmtPage from "./pages/EquipmentManagement";
import ERGGuidePage from "./pages/ERGGuide";
import ERGLookupPage from "./pages/ERGLookup";
import FeatureFlagsPage from "./pages/FeatureFlags";
import HazmatCertsPage from "./pages/HazmatCertifications";
import HOSCompliancePage from "./pages/HOSCompliance";
import IFTAReportingPage from "./pages/IFTAReporting";
import InsuranceMgmtPage from "./pages/InsuranceManagement";
import InvoiceMgmtPage from "./pages/InvoiceManagement";
import LaneAnalysisPage from "./pages/LaneAnalysis";
import LoadHistoryPage from "./pages/LoadHistory";
import MaintenanceSchedulePage from "./pages/MaintenanceSchedule";
import MedicalCertsPage from "./pages/MedicalCertifications";
import MVRReportsPage from "./pages/MVRReports";
import OnTimePerformancePage from "./pages/OnTimePerformance";
import PaymentHistoryPage from "./pages/PaymentHistory";
import PermitMgmtPage from "./pages/PermitManagement";
import PODManagementPage from "./pages/PODManagement";
import QuoteMgmtPage from "./pages/QuoteManagement";
import ReportBuilderPage from "./pages/ReportBuilder";
import RestStopsPage from "./pages/RestStops";
import RevenueAnalyticsPage from "./pages/RevenueAnalytics";
import RolePermissionsPage from "./pages/RolePermissions";
import RoutePlanningPage from "./pages/RoutePlanning";
import SAFERLookupPage from "./pages/SAFERLookup";
import SafetyMeetingsPage from "./pages/SafetyMeetings";
import ScaleLocationsPage from "./pages/ScaleLocations";
import SecuritySettingsPage from "./pages/SecuritySettings";
import SessionMgmtPage from "./pages/SessionManagement";
import SettlementStatementsPage from "./pages/SettlementStatements";
import ShipperCompliancePage from "./pages/ShipperCompliance";
import TaxDocumentsPage from "./pages/TaxDocuments";
import TrafficConditionsPage from "./pages/TrafficConditions";
import TwoFactorAuthPage from "./pages/TwoFactorAuth";
import TwoFactorSetupPage from "./pages/TwoFactorSetup";
import VehicleInspectionsPage from "./pages/VehicleInspections";
// ── Gold Standard Gap Audit: 18 pages with files but no routes ────────────────
import AchievementsBadges from "./pages/AchievementsBadges";
import QuickActions from "./pages/QuickActions";
import UtilizationReport from "./pages/UtilizationReport";
import ExpenseReports from "./pages/ExpenseReports";
import HazmatShipments from "./pages/HazmatShipments";
import BillingSettings from "./pages/BillingSettings";
import BroadcastMessages from "./pages/BroadcastMessages";
import EscortEarnings from "./pages/EscortEarnings";
import EscortCertifications from "./pages/EscortCertifications";
import SupportTickets from "./pages/SupportTickets";
import RateManagement from "./pages/RateManagement";
import APIManagement from "./pages/APIManagement";
import IntegrationSettings from "./pages/IntegrationSettings";
import BackupManagement from "./pages/BackupManagement";
import ReleaseNotes from "./pages/ReleaseNotes";
import DataExport from "./pages/DataExport";
import HelpCenter from "./pages/HelpCenter";
import NotificationSettings from "./pages/NotificationSettings";

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
      <Route path={"/authority"} component={guard([...CARR, ...DRIV, ...BROK, ...DISP, ...ESCT], <OperatingAuthority />)} />
      {/* Gold Standard: Shared auth, settings & cross-role compliance */}
      <Route path={"/settings/change-password"} component={guard(ALL, <ChangePasswordPage />)} />
      <Route path={"/settings/2fa-setup"} component={guard(ALL, <TwoFactorSetupPage />)} />
      <Route path={"/settings/2fa"} component={guard(ALL, <TwoFactorAuthPage />)} />
      <Route path={"/settings/sessions"} component={guard(ALL, <SessionMgmtPage />)} />
      <Route path={"/bol-management"} component={guard(ALL, <BOLManagementPage />)} />
      <Route path={"/pod"} component={guard(ALL, <PODManagementPage />)} />
      <Route path={"/erg/guide"} component={guard(ALL, <ERGGuidePage />)} />
      <Route path={"/erg/lookup"} component={guard(ALL, <ERGLookupPage />)} />
      <Route path={"/fmcsa-lookup"} component={guard([...CARR, ...BROK, ...COMP, ...SHIP], <SAFERLookupPage />)} />
      <Route path={"/hazmat/certifications"} component={guard(ALL, <HazmatCertsPage />)} />
      <Route path={"/insurance"} component={guard([...CARR, ...BROK, ...COMP], <InsuranceMgmtPage />)} />
      <Route path={"/insurance/per-load"} component={guard([...CARR, ...SHIP, ...BROK], <PerLoadInsurance />)} />
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
      <Route path={"/expenses"} component={guard([...CARR, ...DRIV], <ExpenseReports />)} />

      {/* ============================================ */}
      {/* SHIPPER ROUTES */}
      {/* ============================================ */}
      <Route path={"/loads"} component={guard(LOAD, <MyLoadsPage />)} />
      <Route path={"/loads/create"} component={guard([...SHIP, "BROKER", "DISPATCH", "TERMINAL_MANAGER"], <LoadCreationWizard />)} />
      <Route path={"/loads/active"} component={guard(LOAD, <MyLoadsPage />)} />
      <Route path={"/tracking"} component={guard(LOAD, <ShipperDispatchControl />)} />
      <Route path={"/catalysts"} component={guard([...SHIP, "BROKER"], <CatalystsPage />)} />
      <Route path={"/payments"} component={guard(ALL, <WalletPage />)} />
      <Route path={"/company"} component={guard(LOAD, <CompanyProfile />)} />
      <Route path={"/agreements"} component={guard(LOAD, <AgreementsLibrary />)} />
      <Route path={"/agreements/create"} component={guard(SHIP, <ShipperAgreementWizard />)} />
      <Route path={"/agreements/broker"} component={guard([...BROK, "SHIPPER"], <BrokerContractWizard />)} />
      <Route path={"/agreements/:id"} component={guard(LOAD, <AgreementDetail />)} />
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
      <Route path={"/invoices"} component={guard([...CARR, ...SHIP, ...BROK], <InvoiceMgmtPage />)} />
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
      <Route path={"/staff"} component={guard(TERM, <TerminalStaff />)} />
      <Route path={"/operations"} component={guard(TERM, <TerminalOperations />)} />
      <Route path={"/terminal/scheduling"} component={guard(TERM, <TerminalScheduling />)} />
      <Route path={"/terminal/scada"} component={guard(TERM, <TerminalSCADA />)} />
      <Route path={"/terminal/appointments"} component={guard(TERM, <AppointmentScheduler />)} />
      <Route path={"/terminal/reports"} component={guard(TERM, <TerminalOperations />)} />
      <Route path={"/loading-bays"} component={guard(TERM, <LoadingBays />)} />
      <Route path={"/terminal-inventory"} component={guard(TERM, <TerminalInventory />)} />
      <Route path={"/bol"} component={guard(TERM, <BOLGeneration />)} />
      <Route path={"/spectra-match"} component={guard(TERM, <SpectraMatch />)} />
      <Route path={"/detention"} component={guard([...TERM, ...CARR, ...SHIP], <DetentionTrackingPage />)} />
      <Route path={"/euso-ticket"} component={guard(TERM, <EusoTicket />)} />
      <Route path={"/run-tickets"} component={guard(TERM, <EusoTicket />)} />

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
      {/* ZEUN MECHANICS ROUTES */}
      {/* ============================================ */}
      <Route path={"/zeun/breakdown"} component={guard(ALL, <ZeunBreakdownReport />)} />
      <Route path={"/zeun/maintenance"} component={guard(ALL, <ZeunMaintenanceTracker />)} />
      <Route path={"/zeun/providers"} component={guard(ALL, <ZeunProviderNetwork />)} />

      {/* ============================================ */}
      {/* FALLBACK */}
      {/* ============================================ */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
