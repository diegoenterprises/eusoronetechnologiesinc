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
import LoadCreatePage from "./pages/LoadCreate";
import FindLoadsPage from "./pages/FindLoads";
// ActiveLoads merged into MyLoads
// TrackShipments merged into ShipperDispatchControl
import CarriersPage from "./pages/Carriers";
// Payments merged into Wallet (EusoWallet)
import AssignedLoadsPage from "./pages/AssignedLoads";
import InTransitPage from "./pages/InTransit";
import CarrierAnalyticsPage from "./pages/CarrierAnalytics";
import FleetPage from "./pages/Fleet";
import DriversPage from "./pages/Drivers";
import FleetCommandCenter from "./pages/FleetCommandCenter";
import EarningsPage from "./pages/Earnings";
import ErgPage from "./pages/Erg";
import Login from "./pages/Login";
// TestLogin removed from production - SOC II: no dev backdoors in prod
import Register from "./pages/Register";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RegisterShipper from "./pages/RegisterShipper";
import RegisterCarrier from "./pages/RegisterCarrier";
import RegisterDriver from "./pages/RegisterDriver";
import LoadBids from "./pages/LoadBids";
import RegisterEscort from "./pages/RegisterEscort";
import RegisterBroker from "./pages/RegisterBroker";
import RegisterCatalyst from "./pages/RegisterCatalyst";
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
import CarrierBidSubmission from "./pages/CarrierBidSubmission";
import PreTripInspection from "./pages/PreTripInspection";
import DVIR from "./pages/DVIR";
import DispatchBoard from "./pages/DispatchBoard";
import CarrierVetting from "./pages/CarrierVetting";
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
import CarrierVettingDetails from "./pages/CarrierVettingDetails";
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
import CatalystPerformance from "./pages/CatalystPerformance";
import IncomingShipments from "./pages/IncomingShipments";
import OutgoingShipments from "./pages/OutgoingShipments";
import TerminalStaff from "./pages/TerminalStaff";
import TerminalOperations from "./pages/TerminalOperations";
import Violations from "./pages/Violations";
import Audits from "./pages/Audits";
import SafetyMetrics from "./pages/SafetyMetrics";
import SafetyIncidents from "./pages/SafetyIncidents";
import BrokerMarketplace from "./pages/BrokerMarketplace";
import BrokerCarriers from "./pages/BrokerCarriers";
import BrokerAnalytics from "./pages/BrokerAnalytics";
import LoadingBays from "./pages/LoadingBays";
import TerminalInventory from "./pages/TerminalInventory";
import BOLGeneration from "./pages/BOLGeneration";
import DriverCurrentJob from "./pages/DriverCurrentJob";
import DriverVehicle from "./pages/DriverVehicle";
import CatalystFleetMap from "./pages/CatalystFleetMap";
import CatalystExceptions from "./pages/CatalystExceptions";
import EscortPermits from "./pages/EscortPermits";
import EscortSchedule from "./pages/EscortSchedule";
import SpectraMatch from "./pages/SpectraMatch";
import EusoTicket from "./pages/EusoTicket";
import AdminRSSFeeds from "./pages/AdminRSSFeeds";
import AdminPlatformFees from "./pages/AdminPlatformFees";
import Missions from "./pages/Missions";
import DriverTracking from "./pages/DriverTracking";
import FleetTracking from "./pages/FleetTracking";
import AdminTelemetry from "./pages/AdminTelemetry";
import ZeunBreakdown from "./pages/ZeunBreakdown";
import ZeunFleetDashboard from "./pages/ZeunFleetDashboard";
import ZeunAdminDashboard from "./pages/ZeunAdminDashboard";
import HotZones from "./pages/HotZones";
import RatingsReviews from "./pages/RatingsReviews";
import ClaimsPage from "./pages/Claims";
import MarketPricing from "./pages/MarketPricing";
import CarrierCompliance from "./pages/CarrierCompliance";
import FuelPrices from "./pages/FuelPrices";
import WeatherAlerts from "./pages/WeatherAlerts";
import TheHaul from "./pages/TheHaul";
import FactoringDashboardPage from "./pages/factoring/FactoringDashboard";
import FactoringInvoicesPage from "./pages/factoring/FactoringInvoices";
import FactoringCarriersPage from "./pages/factoring/FactoringCarriers";
import FactoringCollectionsPage from "./pages/factoring/FactoringCollections";
import FactoringFundingPage from "./pages/factoring/FactoringFunding";
import FactoringRiskPage from "./pages/factoring/FactoringRisk";
import FactoringAgingPage from "./pages/factoring/FactoringAging";
import FactoringChargebacksPage from "./pages/factoring/FactoringChargebacks";
import FactoringDebtorsPage from "./pages/factoring/FactoringDebtors";
import FactoringReportsPage from "./pages/factoring/FactoringReports";

function Router() {
  // Role constants for route protection
  const ALL: UserRole[] = ["SHIPPER","CARRIER","BROKER","DRIVER","CATALYST","ESCORT","TERMINAL_MANAGER","FACTORING","ADMIN","SUPER_ADMIN"];
  const SHIP: UserRole[] = ["SHIPPER","ADMIN","SUPER_ADMIN"];
  const CARR: UserRole[] = ["CARRIER","ADMIN","SUPER_ADMIN"];
  const BROK: UserRole[] = ["BROKER","ADMIN","SUPER_ADMIN"];
  const DRIV: UserRole[] = ["DRIVER","CARRIER","ADMIN","SUPER_ADMIN"];
  const DISP: UserRole[] = ["CATALYST","ADMIN","SUPER_ADMIN"];
  const ESCT: UserRole[] = ["ESCORT","ADMIN","SUPER_ADMIN"];
  const TERM: UserRole[] = ["TERMINAL_MANAGER","ADMIN","SUPER_ADMIN"];
  const FACT: UserRole[] = ["FACTORING","ADMIN","SUPER_ADMIN"];
  const COMP: UserRole[] = ["TERMINAL_MANAGER","ADMIN","SUPER_ADMIN"];
  const SAFE: UserRole[] = ["ADMIN","SUPER_ADMIN"];
  const ADMN: UserRole[] = ["ADMIN","SUPER_ADMIN"];
  const SUPR: UserRole[] = ["SUPER_ADMIN"];
  const LOAD: UserRole[] = ["SHIPPER","CARRIER","BROKER","ADMIN","SUPER_ADMIN"];

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
      <Route path={"/register"} component={Register} />
      <Route path={"/register/shipper"} component={RegisterShipper} />
      <Route path={"/register/carrier"} component={RegisterCarrier} />
      <Route path={"/register/driver"} component={RegisterDriver} />
      <Route path={"/register/escort"} component={RegisterEscort} />
      <Route path={"/register/broker"} component={RegisterBroker} />
      <Route path={"/register/catalyst"} component={RegisterCatalyst} />
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
      <Route path={"/admin/telemetry"} component={guard(ADMN, <AdminTelemetry />)} />
      <Route path={"/zeun-breakdown"} component={guard(ALL, <ZeunBreakdown />)} />
      <Route path={"/zeun-fleet"} component={guard(ALL, <ZeunFleetDashboard />)} />
      <Route path={"/admin/zeun"} component={guard(ADMN, <ZeunAdminDashboard />)} />
      <Route path={"/hot-zones"} component={guard(ALL, <HotZones />)} />
      <Route path={"/ratings"} component={guard(ALL, <RatingsReviews />)} />
      <Route path={"/claims"} component={guard(ALL, <ClaimsPage />)} />
      <Route path={"/market-pricing"} component={guard(ALL, <MarketPricing />)} />

      {/* ============================================ */}
      {/* SHIPPER ROUTES */}
      {/* ============================================ */}
      <Route path={"/loads"} component={guard(LOAD, <MyLoadsPage />)} />
      <Route path={"/loads/create"} component={guard([...SHIP, "BROKER"], <LoadCreationWizard />)} />
      <Route path={"/loads/active"} component={guard(LOAD, <MyLoadsPage />)} />
      <Route path={"/tracking"} component={guard(LOAD, <ShipperDispatchControl />)} />
      <Route path={"/carriers"} component={guard([...SHIP, "BROKER"], <CarriersPage />)} />
      <Route path={"/payments"} component={guard(ALL, <WalletPage />)} />
      <Route path={"/company"} component={guard(LOAD, <CompanyProfile />)} />
      <Route path={"/agreements"} component={guard(LOAD, <AgreementsLibrary />)} />
      <Route path={"/agreements/create"} component={guard(SHIP, <ShipperAgreementWizard />)} />
      <Route path={"/agreements/broker"} component={guard([...BROK, "SHIPPER"], <BrokerContractWizard />)} />
      <Route path={"/agreements/:id"} component={guard(LOAD, <AgreementDetail />)} />
      <Route path={"/loads/recurring"} component={guard(SHIP, <RecurringLoadScheduler />)} />
      <Route path={"/loads/:id"} component={guard(LOAD, <LoadDetails />)} />
      <Route path={"/shipper/dispatch"} component={guard(SHIP, <ShipperDispatchControl />)} />

      {/* ============================================ */}
      {/* CARRIER ROUTES */}
      {/* ============================================ */}
      <Route path={"/marketplace"} component={guard([...CARR, "BROKER"], <FindLoadsPage />)} />
      <Route path={"/bids"} component={guard(CARR, <BidManagement />)} />
      <Route path={"/bids/submit/:loadId"} component={guard(CARR, <CarrierBidSubmission />)} />
      <Route path={"/bids/:bidId"} component={guard(CARR, <BidDetails />)} />
      <Route path={"/contract/sign/:loadId"} component={guard(CARR, <ContractSigning />)} />
      <Route path={"/loads/transit"} component={guard([...CARR, "DRIVER"], <InTransitPage />)} />
      <Route path={"/loads/:loadId/bids"} component={guard(LOAD, <LoadBids />)} />
      <Route path={"/load/:loadId"} component={guard(LOAD, <LoadDetails />)} />
      <Route path={"/fleet"} component={guard(CARR, <FleetCommandCenter />)} />
      <Route path={"/fleet-management"} component={guard(CARR, <FleetCommandCenter />)} />
      <Route path={"/driver/management"} component={guard(CARR, <FleetCommandCenter />)} />
      <Route path={"/drivers"} component={guard(CARR, <FleetCommandCenter />)} />
      <Route path={"/earnings"} component={guard([...CARR, "DRIVER", "CATALYST", "ESCORT"], <WalletPage />)} />
      <Route path={"/analytics"} component={guard([...CARR, "BROKER"], <Analytics />)} />

      {/* ============================================ */}
      {/* BROKER ROUTES */}
      {/* ============================================ */}
      <Route path={"/shippers"} component={guard(BROK, <ShippersPage />)} />
      <Route path={"/commission"} component={guard(BROK, <CommissionPage />)} />
      <Route path={"/carrier-vetting"} component={guard(BROK, <CarrierVetting />)} />
      <Route path={"/carrier/:carrierId"} component={guard(BROK, <CarrierVettingDetails />)} />

      {/* ============================================ */}
      {/* DRIVER ROUTES */}
      {/* ============================================ */}
      <Route path={"/jobs"} component={guard(DRIV, <JobsPage />)} />
      <Route path={"/jobs/current"} component={guard(DRIV, <DriverCurrentJob />)} />
      <Route path={"/navigation"} component={guard(DRIV, <LoadTracking />)} />
      <Route path={"/vehicle"} component={guard(DRIV, <DriverVehicle />)} />
      <Route path={"/diagnostics"} component={guard(DRIV, <DiagnosticsPage />)} />
      <Route path={"/documents"} component={guard(DRIV, <DocumentCenter />)} />
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

      {/* ============================================ */}
      {/* CATALYST (DISPATCHER) ROUTES */}
      {/* ============================================ */}
      <Route path={"/dispatch"} component={guard(DISP, <DispatchDashboard />)} />
      <Route path={"/dispatch/board"} component={guard(DISP, <DispatchBoard />)} />
      <Route path={"/specializations"} component={guard(DISP, <Specializations />)} />
      <Route path={"/matched-loads"} component={guard(DISP, <MatchedLoads />)} />
      <Route path={"/opportunities"} component={guard(DISP, <Opportunities />)} />
      <Route path={"/performance"} component={guard(DISP, <CatalystPerformance />)} />
      <Route path={"/catalyst/fleet-map"} component={guard(DISP, <CatalystFleetMap />)} />
      <Route path={"/catalyst/exceptions"} component={guard(DISP, <CatalystExceptions />)} />
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

      {/* ============================================ */}
      {/* TERMINAL MANAGER ROUTES */}
      {/* ============================================ */}
      <Route path={"/terminal"} component={guard(TERM, <TerminalDashboard />)} />
      <Route path={"/facility"} component={guard(TERM, <FacilityPage />)} />
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
      <Route path={"/euso-ticket"} component={guard(TERM, <EusoTicket />)} />
      <Route path={"/run-tickets"} component={guard(TERM, <EusoTicket />)} />

      {/* ============================================ */}
      {/* FACTORING ROUTES */}
      {/* ============================================ */}
      <Route path={"/factoring"} component={guard(FACT, <FactoringDashboardPage />)} />
      <Route path={"/factoring/invoices"} component={guard(FACT, <FactoringInvoicesPage />)} />
      <Route path={"/factoring/carriers"} component={guard(FACT, <FactoringCarriersPage />)} />
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

      {/* ============================================ */}
      {/* SUPER ADMIN ROUTES */}
      {/* ============================================ */}
      <Route path={"/super-admin"} component={guard(SUPR, <AdminDashboard />)} />
      <Route path={"/super-admin/users"} component={guard(SUPR, <UserManagement />)} />
      <Route path={"/super-admin/companies"} component={guard(SUPR, <CompanyPage />)} />
      <Route path={"/super-admin/loads"} component={guard(SUPR, <MyLoadsPage />)} />
      <Route path={"/super-admin/config"} component={guard(SUPR, <SettingsPage />)} />
      <Route path={"/super-admin/database"} component={guard(SUPR, <Analytics />)} />
      <Route path={"/super-admin/security"} component={guard(SUPR, <SettingsPage />)} />
      <Route path={"/super-admin/logs"} component={guard(SUPR, <AuditLogs />)} />
      <Route path={"/super-admin/monitoring"} component={guard(SUPR, <Analytics />)} />
      <Route path={"/super-admin/settings"} component={guard(SUPR, <SettingsPage />)} />

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
      <Route path={"/carrier-compliance"} component={guard(CARR, <CarrierCompliance />)} />
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
